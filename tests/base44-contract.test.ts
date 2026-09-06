/**
 * The Base44 server functions, actually executed.
 *
 * `tests/base44-adapter.test.ts` covers the browser side. This covers the
 * server side: it imports the four real handlers from `base44/functions` and
 * runs them against an in-memory stand-in for the SDK, so every guard, every
 * ordering rule and every error path is exercised by the same source that will
 * be deployed.
 *
 * What this does NOT prove, and the Base44 document says so plainly: that a
 * deployed project accepts the code, that Base44's own row-level security is
 * configured the way the entity files ask for, or that the network hop works.
 * Those need a live project and `tools/base44-smoke.mjs`.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { serialise } from '@/engine/persistence/adapter';
import { SAVE_SCHEMA_VERSION } from '@/engine/domain/model';
import { resetWorld, rowsFor, signIn, world } from './fakes/base44-sdk';

import saveUniverse from '../base44/functions/saveUniverse/entry.js';
import loadUniverse from '../base44/functions/loadUniverse/entry.js';
import clearSlot from '../base44/functions/clearSlot/entry.js';
import { SUPPORTED_SCHEMA_VERSION } from '../base44/shared/guard.js';

type Handler = (req: Request) => Promise<Response>;

const save = saveUniverse as unknown as Handler;
const load = loadUniverse as unknown as Handler;
const clear = clearSlot as unknown as Handler;

function post(body: unknown): Request {
  return new Request('https://slate.test/fn', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** The envelope is flat: `{ ok: true, ...data }` or `{ ok: false, status, error }`. */
async function body(res: Response): Promise<Record<string, unknown> & { ok: boolean; status?: number; error?: string }> {
  return await res.json() as Record<string, unknown> & { ok: boolean; status?: number; error?: string };
}

/** A real save, serialised the way the browser serialises one. */
function aPayload(slot = 1, seed = 'b44'): { payload: string; saveId: string } {
  const sim = quickSave({}, seed);
  sim.universe.meta.slot = slot;
  sim.universe.meta.playtimeSeconds = 60;
  return { payload: serialise(sim.universe), saveId: sim.universe.meta.id };
}

/** Edits one field inside a serialised save and re-serialises it. */
function edited(payload: string, change: (u: Record<string, unknown>) => void): string {
  const universe = JSON.parse(payload) as Record<string, unknown>;
  change(universe);
  return JSON.stringify(universe);
}

beforeEach(() => { resetWorld(); });

describe('signing in', () => {
  it('refuses everything to somebody who is not signed in', async () => {
    world.user = null;
    for (const handler of [save, load, clear]) {
      const res = await handler(post({ slot: 1 }));
      expect(res.status).toBe(401);
      expect((await body(res)).error).toMatch(/not signed in/i);
    }
  });

  it('refuses anything that is not a POST on the writing endpoints', async () => {
    for (const handler of [save, clear]) {
      const res = await handler(new Request('https://slate.test/fn', { method: 'GET' }));
      expect(res.status).toBe(405);
    }
  });
});

describe('the slot', () => {
  it('takes one, two and three and nothing else', async () => {
    const { payload } = aPayload(2);
    const good = await body(await save(post({ slot: 2, payload: edited(payload, (u) => { (u.meta as Record<string, unknown>).slot = 2; }) })));
    expect(good.ok, good.error).toBe(true);

    for (const slot of [0, 4, -1, 'two', null, 1.5]) {
      const res = await save(post({ slot, payload }));
      expect((await body(res)).ok, `slot ${JSON.stringify(slot)} was accepted`).toBe(false);
      expect(res.status).toBe(400);
    }
  });

  it('refuses a save that says it belongs somewhere else', async () => {
    const { payload } = aPayload(1);
    const res = await save(post({ slot: 3, payload }));
    expect((await body(res)).error).toMatch(/belongs to slot 1.*sent to slot 3/);
  });
});

describe('the payload', () => {
  it('refuses an empty one, an unreadable one and one with no clock', async () => {
    const cases: [unknown, RegExp][] = [
      ['', /missing or empty/],
      [undefined, /missing or empty/],
      ['{not json', /not readable/],
      [JSON.stringify({ meta: { id: 'x', schemaVersion: 1, slot: 1 } }), /no world clock/],
      [JSON.stringify({ now: 1, meta: { schemaVersion: 1, slot: 1 } }), /no meta\.id/],
      [JSON.stringify({ now: 1, meta: { id: 'x', slot: 1 } }), /does not say what format/],
    ];
    for (const [payload, expected] of cases) {
      const res = await save(post({ slot: 1, payload }));
      expect((await body(res)).error, String(payload).slice(0, 40)).toMatch(expected);
    }
  });

  it('refuses a save written by a newer build rather than risking it', async () => {
    const { payload } = aPayload(1);
    const future = edited(payload, (u) => {
      (u.meta as Record<string, unknown>).schemaVersion = SUPPORTED_SCHEMA_VERSION + 1;
    });
    const res = await save(post({ slot: 1, payload: future }));
    expect(res.status).toBe(409);
    expect((await body(res)).error).toMatch(/format 43 and this deployment understands 42/);
  });

  it('agrees with the engine about what format this build writes', () => {
    expect(SUPPORTED_SCHEMA_VERSION).toBe(SAVE_SCHEMA_VERSION);
  });

  it('refuses a ledger that does not balance, and a posting that is not whole cents', async () => {
    const { payload } = aPayload(1);
    const unbalanced = edited(payload, (u) => {
      const txns = u.transactions as { postings: { amount: number }[] }[];
      expect(txns.length, 'the fixture has no transactions to unbalance').toBeGreaterThan(0);
      txns[0]!.postings[0]!.amount += 1;
    });
    const res = await save(post({ slot: 1, payload: unbalanced }));
    expect(res.status).toBe(400);
    expect((await body(res)).error).toMatch(/does not balance/);

    const fractional = edited(payload, (u) => {
      const txns = u.transactions as { postings: { amount: number }[] }[];
      txns[0]!.postings[0]!.amount += 0.5;
    });
    const res2 = await save(post({ slot: 1, payload: fractional }));
    expect((await body(res2)).error).toMatch(/fractional posting/);
  });

  it('refuses a record that belongs to a different save', async () => {
    const { payload } = aPayload(1);
    const mixed = edited(payload, (u) => {
      const people = Object.values(u.people as Record<string, { saveId: string }>);
      expect(people.length).toBeGreaterThan(0);
      people[0]!.saveId = 'some-other-universe';
    });
    const res = await save(post({ slot: 1, payload: mixed }));
    expect(res.status).toBe(409);
    expect((await body(res)).error).toMatch(/cross-save contamination/);
  });
});

describe('writing, and writing again', () => {
  it('creates on the first write and updates on the second, keeping the old payload as a backup', async () => {
    const { payload, saveId } = aPayload(1);
    const first = await body(await save(post({ slot: 1, payload })));
    expect(first.ok).toBe(true);
    expect(first.backupAvailable).toBe(false);
    expect(rowsFor('u1', 'SlateSave')).toHaveLength(1);

    const later = edited(payload, (u) => {
      u.now = (u.now as number) + 86_400_000;
      (u.meta as Record<string, unknown>).playtimeSeconds = 600;
    });
    const second = await body(await save(post({ slot: 1, payload: later })));
    expect(second.ok).toBe(true);
    expect(second.backupAvailable).toBe(true);

    // Still one row, and the row now holds the new payload with the old one behind it.
    const rows = rowsFor('u1', 'SlateSave');
    expect(rows).toHaveLength(1);
    expect(rows[0]!.payload).toBe(later);
    expect(rows[0]!.backup_payload).toBe(payload);
    expect(rows[0]!.save_id).toBe(saveId);
  });

  it('writes once for a repeated idempotency key and returns the same answer', async () => {
    const { payload } = aPayload(1);
    const key = 'retry-me';
    const first = await body(await save(post({ slot: 1, payload, idempotencyKey: key })));
    const again = await body(await save(post({ slot: 1, payload, idempotencyKey: key })));

    expect(first.ok).toBe(true);
    expect(again.ok).toBe(true);
    const a = first;
    const b = again;
    expect(b.replayed).toBe(true);
    expect(b.id).toBe(a.id);
    expect(b.saveId).toBe(a.saveId);
    // One save row, one receipt. The retry did not write a second of either.
    expect(rowsFor('u1', 'SlateSave')).toHaveLength(1);
    expect(rowsFor('u1', 'SlateCommandReceipt')).toHaveLength(1);
  });

  it('checks the receipt before it touches the save row', async () => {
    const { payload } = aPayload(1);
    await save(post({ slot: 1, payload, idempotencyKey: 'k' }));
    world.calls = [];
    await save(post({ slot: 1, payload, idempotencyKey: 'k' }));
    // Nothing was written on the replay.
    expect(world.calls).not.toContain('SlateSave.update');
    expect(world.calls).not.toContain('SlateSave.create');
    // The receipt is looked up before the save row is even read.
    expect(world.calls).toEqual(['auth.me', 'SlateCommandReceipt.filter']);
  });
});

describe('a stale tab', () => {
  it('cannot overwrite newer progress with an older clock', async () => {
    const { payload } = aPayload(1);
    const newer = edited(payload, (u) => {
      u.now = (u.now as number) + 86_400_000;
      (u.meta as Record<string, unknown>).playtimeSeconds = 900;
    });
    await save(post({ slot: 1, payload: newer }));

    const res = await save(post({ slot: 1, payload }));
    expect(res.status).toBe(409);
    expect((await body(res)).error).toMatch(/world clock is behind/);
    // The stored row is untouched.
    expect(rowsFor('u1', 'SlateSave')[0]!.payload).toBe(newer);
  });

  it('cannot overwrite newer progress with less playtime', async () => {
    const { payload } = aPayload(1);
    const played = edited(payload, (u) => { (u.meta as Record<string, unknown>).playtimeSeconds = 5_000; });
    await save(post({ slot: 1, payload: played }));

    const res = await save(post({ slot: 1, payload }));
    expect(res.status).toBe(409);
    expect((await body(res)).error).toMatch(/less playtime/);
  });

  it('will not put a different universe into an occupied slot', async () => {
    await save(post({ slot: 1, payload: aPayload(1, 'first').payload }));
    const other = aPayload(1, 'second');
    const res = await save(post({ slot: 1, payload: other.payload }));
    expect(res.status).toBe(409);
    expect((await body(res)).error).toMatch(/Clear the slot before starting a different universe/);
  });
});

describe('reading back', () => {
  it('returns what was written, and nothing for an empty slot', async () => {
    const { payload, saveId } = aPayload(2);
    const inSlot2 = edited(payload, (u) => { (u.meta as Record<string, unknown>).slot = 2; });
    await save(post({ slot: 2, payload: inSlot2 }));

    const got = await body(await load(post({ slot: 2 })));
    const data = got;
    expect(data.payload).toBe(inSlot2);
    expect(data.saveId).toBe(saveId);
    expect(data.fromBackup).toBe(false);

    const empty = await body(await load(post({ slot: 3 })));
    expect(empty.payload).toBeNull();
  });

  it('hands back the backup when asked for it', async () => {
    const { payload } = aPayload(1);
    await save(post({ slot: 1, payload }));
    const later = edited(payload, (u) => { u.now = (u.now as number) + 1_000; });
    await save(post({ slot: 1, payload: later }));

    const backup = await body(await load(post({ slot: 1, backup: 'true' })));
    const data = backup;
    expect(data.payload).toBe(payload);
    expect(data.fromBackup).toBe(true);
  });

  it('lists all three slots with their labels when no slot is named', async () => {
    const { payload } = aPayload(1);
    await save(post({ slot: 1, payload }));
    const listed = await body(await load(post({})));
    const slots = listed.slots as Record<string, unknown>[];
    expect(slots).toHaveLength(3);
    expect(slots[0]!.occupied).toBe(true);
    expect(slots[0]!.characterName).toBeTruthy();
    expect(slots[1]!.occupied).toBe(false);
    expect(slots[2]!.occupied).toBe(false);
  });
});

describe('clearing a slot', () => {
  it('empties it, keeps the payload as a backup, and says it is recoverable', async () => {
    const { payload } = aPayload(1);
    await save(post({ slot: 1, payload }));
    const res = await body(await clear(post({ slot: 1 })));
    const data = res;
    expect(data.cleared).toBe(true);
    expect(data.recoverable).toBe(true);

    const row = rowsFor('u1', 'SlateSave')[0]!;
    expect(row.payload).toBe('');
    expect(row.backup_payload).toBe(payload);
    expect(row.deleted_at).toBeTruthy();
  });

  it('is safe to run on a slot that was already empty', async () => {
    const res = await body(await clear(post({ slot: 2 })));
    const data = res;
    expect(data.cleared).toBe(false);
    expect(data.reason).toMatch(/already empty/);
  });

  it('lets the slot be reused by a different universe afterwards', async () => {
    await save(post({ slot: 1, payload: aPayload(1, 'one').payload }));
    await clear(post({ slot: 1 }));
    const other = aPayload(1, 'two');
    const res = await body(await save(post({ slot: 1, payload: other.payload })));
    expect(res.ok, res.error).toBe(true);
  });
});

describe('two players', () => {
  it('cannot see or overwrite each other, even naming the same slot', async () => {
    const mine = aPayload(1, 'mine');
    await save(post({ slot: 1, payload: mine.payload }));

    signIn('u2');
    const theirs = aPayload(1, 'theirs');
    const res = await body(await save(post({ slot: 1, payload: theirs.payload })));
    expect(res.ok, 'the second player could not write to their own slot 1').toBe(true);

    // Each store holds one row, and it is their own.
    expect(rowsFor('u1', 'SlateSave')).toHaveLength(1);
    expect(rowsFor('u2', 'SlateSave')).toHaveLength(1);
    expect(rowsFor('u1', 'SlateSave')[0]!.save_id).toBe(mine.saveId);
    expect(rowsFor('u2', 'SlateSave')[0]!.save_id).toBe(theirs.saveId);

    // And reading as the second player returns theirs, not the first player's.
    const got = await body(await load(post({ slot: 1 })));
    expect(got.saveId).toBe(theirs.saveId);
  });
});
