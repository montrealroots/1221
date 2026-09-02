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
import { quickSave } from '@/engine';
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
    expect(() => inspectPayload('not json at all', 1)).toThrow(/not readable/);
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
    expect(() => inspectPayload(serialise(sim.universe), 1)).toThrow(/does not balance/);
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
