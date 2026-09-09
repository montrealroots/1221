/**
 * The server-side guards.
 *
 * These are what stands between a browser and storage. The browser is never
 * the authority on what a save may contain, so these are the checks that run
 * before anything lands: the slot is real, the payload parses and is in a
 * format this build reads, the ledger balances, no record belongs to another
 * save, and progress has not gone backwards.
 *
 * The deployed functions themselves need a Base44 app and credentials to
 * exercise; those are reported as unavailable in the README rather than
 * counted as passing. The guards they are built on are pure, so they are
 * tested here properly.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { quickSave } from '@/engine';
import { SAVE_SCHEMA_VERSION } from '@/engine/domain/model';
import { serialise } from '@/engine/persistence/adapter';
import {
  GuardError, MAX_PAYLOAD_BYTES, SUPPORTED_SCHEMA_VERSION,
  inspectPayload, requireForwardProgress, requireSlot,
} from '../base44/shared/guard.js';

/** A real save, serialised the way the client would send it. */
function realPayload(slot: 1 | 2 | 3 = 1) {
  const sim = quickSave({ wealth: 'comfortable' }, `guard-${slot}`, slot);
  sim.advanceTo(sim.now + 90 * 86_400_000);
  return { sim, payload: serialise(sim.universe) };
}

describe('the guard and the client agree on the save format', () => {
  it('understands exactly the version the client writes', () => {
    // The guard cannot import this — it runs on Deno — so the coupling is held
    // here. Drift means the backend refuses every save the game produces.
    expect(
      SUPPORTED_SCHEMA_VERSION,
      'base44/shared/guard.js is behind src/engine/domain/model.ts. Bump it.',
    ).toBe(SAVE_SCHEMA_VERSION);
  });
});

describe('slots', () => {
  it('accepts the three real slots', () => {
    for (const slot of [1, 2, 3]) expect(requireSlot(slot)).toBe(slot);
    expect(requireSlot('2')).toBe(2);
  });

  it('refuses anything else', () => {
    for (const bad of [0, 4, -1, 1.5, 'two', null, undefined, {}, [], Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => requireSlot(bad), `slot ${JSON.stringify(bad)} was accepted`).toThrow(GuardError);
    }
  });
});

describe('the payload a client sends', () => {
  it('accepts a real save and reports what it checked', () => {
    const { sim, payload } = realPayload(1);
    const result = inspectPayload(payload, 1);
    expect(result.saveId).toBe(sim.universe.meta.id);
    expect(result.worldNow).toBe(sim.now);
    expect(result.bytes).toBe(payload.length);
  });

  it('refuses an empty or missing payload', () => {
    for (const bad of ['', null, undefined, 42, {}]) {
      expect(() => inspectPayload(bad, 1)).toThrow(GuardError);
    }
  });

  it('refuses something that is not a save', () => {
    expect(() => inspectPayload('not json at all', 1)).toThrow(/n[o’]t readable/);
    expect(() => inspectPayload('{"hello":"world"}', 1)).toThrow(/no meta\.id/);
  });

  it('refuses a save that claims a different slot than the one it was sent to', () => {
    const { payload } = realPayload(1);
    expect(() => inspectPayload(payload, 2)).toThrow(/belongs to slot/);
  });

  it('refuses a save written by a newer build rather than risking it', () => {
    const { sim } = realPayload(1);
    sim.universe.meta.schemaVersion = SUPPORTED_SCHEMA_VERSION + 1;
    expect(() => inspectPayload(serialise(sim.universe), 1)).toThrow(/understands/);
  });

  it('refuses a save that is too large', () => {
    const { sim } = realPayload(1);
    sim.universe.meta.characterName = 'x'.repeat(MAX_PAYLOAD_BYTES);
    expect(() => inspectPayload(serialise(sim.universe), 1)).toThrow(/byte limit/);
  });

  it('refuses a ledger that does not balance', () => {
    const { sim } = realPayload(1);
    const txn = sim.universe.transactions.find((t) => t.postings.length >= 2);
    expect(txn, 'no transaction to tamper with').toBeDefined();
    // The exact move a tamperer would make: quietly add money to one side.
    txn!.postings[0]!.amount += 1_000_00;
    expect(() => inspectPayload(serialise(sim.universe), 1)).toThrow(/does(n’t| not) balance/);
  });

  it('refuses a fractional posting', () => {
    const { sim } = realPayload(1);
    const txn = sim.universe.transactions.find((t) => t.postings.length >= 2);
    txn!.postings[0]!.amount += 0.5;
    txn!.postings[1]!.amount -= 0.5;
    expect(() => inspectPayload(serialise(sim.universe), 1)).toThrow(/whole cents/);
  });

  it('refuses a save carrying a record from another universe', () => {
    const a = realPayload(1);
    const b = realPayload(2);
    const donor = Object.values(b.sim.universe.people).find((p) => !p.isPlayer);
    expect(donor).toBeDefined();

    a.sim.universe.people[donor!.id] = donor!;
    expect(() => inspectPayload(serialise(a.sim.universe), 1)).toThrow(/cross-save contamination/i);
  });

  it('refuses a save with no world clock', () => {
    const { sim } = realPayload(1);

    (sim.universe as unknown as Record<string, unknown>)['now'] = 'yesterday';
    expect(() => inspectPayload(serialise(sim.universe), 1)).toThrow(/world clock/);
  });
});

describe('progress only runs forwards', () => {
  const { payload } = realPayload(1);
  const incoming = inspectPayload(payload, 1);

  it('accepts the first write to an empty slot', () => {
    expect(() => requireForwardProgress(null, incoming)).not.toThrow();
  });

  it('accepts a save that has moved on', () => {
    expect(() => requireForwardProgress({
      save_id: incoming.saveId,
      world_now: incoming.worldNow - 86_400_000,
      playtime_seconds: incoming.playtimeSeconds - 60,
    }, incoming)).not.toThrow();
  });

  it('refuses a stale tab overwriting newer progress', () => {
    expect(() => requireForwardProgress({
      save_id: incoming.saveId,
      world_now: incoming.worldNow + 86_400_000,
      playtime_seconds: incoming.playtimeSeconds,
    }, incoming)).toThrow(/older than the one already stored/);
  });

  it('refuses a write that would lose playtime', () => {
    expect(() => requireForwardProgress({
      save_id: incoming.saveId,
      world_now: incoming.worldNow,
      playtime_seconds: incoming.playtimeSeconds + 3_600,
    }, incoming)).toThrow(/less playtime/);
  });

  it('refuses a different universe dropped into an occupied slot', () => {
    expect(() => requireForwardProgress({
      save_id: 'some-other-universe',
      world_now: 0,
      playtime_seconds: 0,
    }, incoming)).toThrow(/Clear the slot/);
  });
});

/**
 * Entity ids repeat across saves, and that is the design: the id counter is
 * per-universe, so save 1 and save 2 both hold a person_000001 and a company
 * with the same id. What keeps them apart is the save_id stamped on every
 * record, which validateUniverse checks on the way in.
 *
 * That makes one specific mistake catastrophic and easy to make: a backend
 * lookup that filters on subject_id or idempotency_key and forgets save_id
 * would find another save's row and hand back its result — a finalised award
 * from one universe replayed into another, or a retry silently answered from
 * somebody else's history. These read the shipped function sources and hold
 * the rule that no such filter exists.
 */
describe('every server lookup is scoped to one save', () => {
  const dir = new URL('../base44/functions/', import.meta.url);
  const sources = ['recordOfficialResult', 'saveUniverse', 'loadUniverse', 'clearSlot']
    .map((name) => [name, readFileSync(new URL(`${name}/entry.js`, dir), 'utf8')] as const);

  it('ships the four functions this test knows about', () => {
    for (const [name, source] of sources) {
      expect(source.length, name).toBeGreaterThan(200);
    }
  });

  it('never filters on an entity id without naming the save it belongs to', () => {
    const offenders: string[] = [];
    for (const [name, source] of sources) {
      // Every .filter({ ... }) call in the file, with its object literal.
      for (const match of source.matchAll(/\.filter\(\s*(\{[\s\S]*?\})\s*\)/g)) {
        const clause = match[1] ?? '';
        const scopedByEntity = /subject_id|idempotency_key/.test(clause);
        if (scopedByEntity && !/save_id/.test(clause)) {
          offenders.push(`${name}: ${clause.replace(/\s+/g, ' ').slice(0, 90)}`);
        }
      }
    }
    expect(offenders, 'a lookup could reach into another save').toEqual([]);
  });

  it('scopes the official-result lookup by save, kind and subject together', () => {
    const source = sources.find(([n]) => n === 'recordOfficialResult')![1];
    const clause = /SlateOfficialResult\.filter\(\s*(\{[\s\S]*?\})\s*\)/.exec(source)?.[1] ?? '';
    expect(clause).toMatch(/save_id/);
    expect(clause).toMatch(/subject_id/);
    expect(clause).toMatch(/kind/);
  });

  it('scopes the retry receipt by save as well as key', () => {
    const source = sources.find(([n]) => n === 'saveUniverse')![1];
    const clause = /SlateCommandReceipt\.filter\(\s*(\{[\s\S]*?\})\s*\)/.exec(source)?.[1] ?? '';
    expect(clause).toMatch(/save_id/);
    expect(clause).toMatch(/idempotency_key/);
  });

  it('requires save_id on both server entities that carry an entity id', () => {
    for (const entity of ['SlateOfficialResult', 'SlateCommandReceipt']) {
      const schema = JSON.parse(readFileSync(new URL(`../base44/entities/${entity}.json`, import.meta.url), 'utf8'));
      expect(schema.required, entity).toContain('save_id');
      expect(schema.properties.save_id, entity).toBeTruthy();
    }
  });
});
