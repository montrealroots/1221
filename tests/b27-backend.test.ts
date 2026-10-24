/**
 * Brief 27, Area D (2026-10-24): the save's way to the server and back, end to end on this machine. "For backend
 * verification, cover: Creating, saving, loading, backing up, restoring, and deleting. Accurate UTF-8 byte reporting,
 * including accented names. Interrupted requests and retries. Duplicate-write prevention. Stale-save protection. Ownership
 * and account isolation. Schema compatibility. Existing-save continuity."
 *
 * FAKE PLATFORM, NOT A DEPLOYMENT: the game's own `Base44SaveAdapter` talks to the real function handlers
 * (`base44/functions/*`, with the real guard), and the handlers to `tests/fakes/base44-sdk.ts`, the in-memory stand-in
 * the contract tests use for Base44's entities and row-level security. No Base44 project was reachable from this session
 * (no SLATE_BASE44_URL or SLATE_BASE44_TOKEN), so the network hop, the platform's own row-level security and its auth
 * are not proven here; `npm run base44:smoke -- --slot 3` against a test deployment is the check that would.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { gunzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { openSlot, quickSave } from '@/engine';
import { Base44SaveAdapter, type Base44Client } from '@/engine/persistence/base44';
import { PersistenceError, serialise } from '@/engine/persistence/adapter';
import { SAVE_SCHEMA_VERSION } from '@/engine/domain/model';
import { createClientFromRequest, resetWorld, rowsFor, signIn, world } from './fakes/base44-sdk';
import saveUniverse from '../base44/functions/saveUniverse/entry.js';
import loadUniverse from '../base44/functions/loadUniverse/entry.js';
import clearSlot from '../base44/functions/clearSlot/entry.js';

const HANDLERS: Record<string, (req: Request) => Promise<Response>> = { saveUniverse, loadUniverse, clearSlot };
const post = (body: unknown) => new Request('https://slate.test/fn', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

/**
 * The game's client, its entities the fake platform's for whoever is signed in and its `invoke` reaching the real handlers
 * as the SDK reaches the deployed functions: the reply's JSON on
 * `.data`, and a non-2xx thrown with the body on `error.response.data`. `lose` drops the next reply after the handler ran,
 * as a connection that fails on the way back does.
 */
function client(): Base44Client & { lose: number; sent: string[] } {
  const c = {
    lose: 0, sent: [] as string[],
    // The entities as the browser's own client has them (the SDK injects both), scoped to whoever is signed in now.
    entities: { get SlateSave() { return createClientFromRequest(null).entities.SlateSave as never; } },
    functions: {
      invoke: async (name: string, payload: Record<string, unknown> = {}) => {
        c.sent.push(name);
        const res = await HANDLERS[name]!(post(payload));
        const data = await res.json();
        if (c.lose > 0) { c.lose -= 1; throw new Error('The connection was lost.'); }
        if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { response: { data, status: res.status } });
        return { data };
      },
    },
  };
  return c;
}

/** The browser's own store, which the adapter mirrors every remote write into, in memory. */
class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length() { return this.map.size; }
  clear() { this.map.clear(); }
  getItem(key: string) { return this.map.get(key) ?? null; }
  key(index: number) { return [...this.map.keys()][index] ?? null; }
  removeItem(key: string) { this.map.delete(key); }
  setItem(key: string, value: string) { this.map.set(key, value); }
}

const life = (seed: string, extra: Record<string, unknown> = {}) => {
  const sim = quickSave(extra, seed);
  sim.universe.meta.playtimeSeconds = 60;
  return sim;
};
const receipts = (user = 'u1') => rowsFor(user, 'SlateCommandReceipt').length;
const row = (user = 'u1', slot = 1) => rowsFor(user, 'SlateSave').find((r) => Number(r.slot) === slot);

beforeEach(() => {
  resetWorld();
  Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true, writable: true });
  Object.defineProperty(globalThis, 'indexedDB', { value: undefined, configurable: true, writable: true });
});

describe('a save’s life on the server, through the game’s own adapter', () => {
  it('is created, read back, written again with the old one kept as its backup, restored, restored back, and deleted with its backup kept', async () => {
    const c = client();
    const adapter = new Base44SaveAdapter(c);
    const sim = life('b27-be-cycle');
    await adapter.save(sim.universe);
    const first = serialise(sim.universe);
    expect(serialise((await adapter.load(1))!)).toBe(first);
    expect((await adapter.listSlots())[0]).toMatchObject({ slot: 1, occupied: true, hasBackup: false });

    sim.advanceTo(sim.now + 3 * 86_400_000);
    sim.universe.meta.playtimeSeconds = 120;
    await adapter.save(sim.universe);
    const second = serialise(sim.universe);
    expect(row()!.backup_payload).toBe(first);
    expect((await adapter.listSlots())[0]).toMatchObject({ occupied: true, hasBackup: true });

    // Restore: the server swaps its backup and its save, so the restore can itself be undone.
    const restored = await openSlot(adapter, 1, { fromBackup: true });
    if ('error' in restored) throw new Error(restored.error);
    expect(serialise(restored.universe)).toBe(first);
    expect(row()!.payload).toBe(first);
    expect(row()!.backup_payload).toBe(second);
    const undone = await openSlot(adapter, 1, { fromBackup: true });
    if ('error' in undone) throw new Error(undone.error);
    expect(row()!.payload).toBe(second);

    // Delete: the slot is empty and released, its save kept as the backup.
    await adapter.remove(1);
    expect((await adapter.listSlots())[0]).toMatchObject({ slot: 1, occupied: false, hasBackup: true });
    expect(row()!.save_id).toBe('');
    expect(row()!.backup_payload).toBe(second);
  });

  it('refuses a restore with nothing to restore, in the server’s words', async () => {
    const adapter = new Base44SaveAdapter(client());
    expect(await openSlot(adapter, 2, { fromBackup: true })).toEqual({ error: 'That slot has no backup to restore.' });
  });
});

describe('the size it reports', () => {
  it('is the UTF-8 bytes of a save of accented names, on the row, in the listing and in the reply', async () => {
    const sim = life('b27-be-bytes', { firstName: 'Zoé', lastName: 'Ferrière' });
    const payload = serialise(sim.universe);
    const utf8 = new TextEncoder().encode(payload).length;
    expect(utf8).toBeGreaterThan(payload.length);
    const res = await (await saveUniverse(post({ slot: 1, payload, idempotencyKey: 'bytes-1' }))).json();
    expect(res.bytes).toBe(utf8);
    expect(row()!.payload_bytes).toBe(utf8);
    const list = await (await loadUniverse(post({}))).json();
    expect(list.slots[0].bytes).toBe(utf8);
    expect((await new Base44SaveAdapter(client()).listSlots())[0]!.bytes).toBe(utf8);
  });
});

describe('a connection that fails on the way back, and a press made twice', () => {
  it('writes once when the reply is lost and the save is tried again: the retry is the same key, replayed', async () => {
    const c = client();
    const adapter = new Base44SaveAdapter(c);
    const sim = life('b27-be-lost');
    c.lose = 1;
    await expect(adapter.save(sim.universe)).rejects.toBeInstanceOf(PersistenceError);
    // The server had written it; the browser didn't hear. Its own copy is kept all the same.
    expect(row()!.payload).toBe(serialise(sim.universe));
    expect(receipts()).toBe(1);
    expect(globalThis.localStorage.getItem('slate.save.1')).not.toBeNull();
    await adapter.save(sim.universe);
    expect(receipts()).toBe(1);
    expect(row()!.backup_payload).toBeFalsy();
  });

  it('writes once for the same moment saved twice, so a double press leaves no backup of itself', async () => {
    const c = client();
    const adapter = new Base44SaveAdapter(c);
    const sim = life('b27-be-twice');
    await adapter.save(sim.universe);
    await adapter.save(sim.universe);
    expect(c.sent.filter((n) => n === 'saveUniverse')).toHaveLength(2);
    expect(receipts()).toBe(1);
    expect(row()!.backup_payload).toBeFalsy();
  });
});

describe('a stale tab, another player, another build', () => {
  it('refuses an older moment over a newer one, says why, and keeps the newer save', async () => {
    const adapter = new Base44SaveAdapter(client());
    const sim = life('b27-be-stale');
    const old = structuredClone(sim.universe);
    sim.advanceTo(sim.now + 86_400_000);
    sim.universe.meta.playtimeSeconds = 90;
    await adapter.save(sim.universe);
    let refused: unknown;
    try { await adapter.save(old); } catch (e) { refused = e; }
    expect(refused).toBeInstanceOf(PersistenceError);
    expect((refused as Error).message).toMatch(/older than the one already stored/);
    expect((refused as PersistenceError).recoverable).toBe(true);
    expect(row()!.payload).toBe(serialise(sim.universe));
  });

  it('keeps one player’s slot from another naming the same slot, for a write, a read, a restore and a delete', async () => {
    const adapter = new Base44SaveAdapter(client());
    const mine = life('b27-be-mine');
    await adapter.save(mine.universe);
    signIn('u2');
    expect(await adapter.load(1)).toBeNull();
    expect(await openSlot(adapter, 1, { fromBackup: true })).toEqual({ error: 'That slot has no backup to restore.' });
    await adapter.remove(1);
    const theirs = life('b27-be-theirs');
    await adapter.save(theirs.universe);
    signIn('u1');
    expect(row('u1')!.payload).toBe(serialise(mine.universe));
    expect(row('u2')!.payload).toBe(serialise(theirs.universe));
    expect(world.user?.id).toBe('u1');
  });

  it('refuses a save from a newer build without touching what’s stored, and takes this build’s', async () => {
    const adapter = new Base44SaveAdapter(client());
    const sim = life('b27-be-newer');
    await adapter.save(sim.universe);
    const stored = row()!.payload;
    const newer = structuredClone(sim.universe);
    newer.meta.schemaVersion = SAVE_SCHEMA_VERSION + 1;
    newer.now += 86_400_000;
    await expect(adapter.save(newer)).rejects.toThrow(/format 95 and this deployment understands 94/);
    expect(row()!.payload).toBe(stored);
  });
});

describe('a save made by an earlier build', () => {
  it('opens from the server at its moment, brought forward, and written back once', async () => {
    const adapter = new Base44SaveAdapter(client());
    const text = gunzipSync(readFileSync('tests/fixtures/old-leave-ff837dfa.json.gz')).toString('utf8');
    const old = JSON.parse(text);
    old.meta.slot = 1;
    const payload = JSON.stringify(old);
    await saveUniverse(post({ slot: 1, payload, idempotencyKey: 'old-1' }));
    const opened = await openSlot(adapter, 1);
    if ('error' in opened) throw new Error(opened.error);
    expect(opened.universe.now).toBe(old.now);
    expect(opened.universe.meta.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
    // Brought forward or not, a second opening writes nothing new: the save is current.
    const writes = receipts();
    const again = await openSlot(adapter, 1);
    if ('error' in again) throw new Error(again.error);
    expect(again.migration.migrated).toBe(false);
    expect(receipts()).toBe(writes);
  });
});
