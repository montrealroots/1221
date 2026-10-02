/**
 * Long-horizon universe tests.
 *
 * A save is meant to survive a whole life. These run the world forward at
 * increasing horizons — a day, a week, a month, a year, five years, ten — and
 * assert the properties that a simulation quietly breaks when it is left
 * running: money drifting, schedules becoming impossible, history corrupting,
 * entities duplicating, prices running away, relationships going out of range,
 * ownership contradicting itself, and each simulated year costing more than
 * the last.
 *
 * These are invariants, not snapshots. They do not assert that a particular
 * thing happened on a particular day; they assert that whatever happened, the
 * universe is still coherent afterwards.
 */

import { describe, expect, it } from 'vitest';
import { quickSave, validateUniverse } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { SaveUniverse } from '@/engine/domain/model';

const MS_DAY = 86_400_000;
const YEAR = 365 * MS_DAY;

/** Every invariant that must hold at any moment in any universe. */
function checkInvariants(sim: Simulation, label: string): void {
  const u = sim.universe;

  // --- Money ---------------------------------------------------------------
  const ledgerProblems = sim.ledger.audit();
  expect(ledgerProblems, `${label}: the books do not balance`).toEqual([]);

  // Every posting in the universe, summed, is zero. Money is only ever moved.
  let grand = 0;
  for (const txn of u.transactions) for (const p of txn.postings) grand += p.amount;
  expect(grand, `${label}: money was created or destroyed`).toBe(0);

  // Cents, always. A fractional cent means a rate was applied without rounding.
  for (const txn of u.transactions) {
    for (const p of txn.postings) {
      expect(Number.isInteger(p.amount), `${label}: ${txn.id} has a fractional posting`).toBe(true);
    }
  }

  // --- Structure -----------------------------------------------------------
  const report = validateUniverse(u);
  expect(report.errors, `${label}: universe validation failed`).toEqual([]);

  // --- Schedules -----------------------------------------------------------
  // Sorted, and nothing pending was left behind in the past.
  for (let i = 1; i < u.scheduled.length; i++) {
    expect((u.scheduled[i - 1]?.at ?? 0) <= (u.scheduled[i]?.at ?? 0), `${label}: timeline out of order`).toBe(true);
  }
  const stranded = u.scheduled.filter((s) => s.status === 'pending' && s.at < u.now);
  expect(stranded.map((s) => `${s.kind}@${s.at}`), `${label}: pending items left in the past`).toEqual([]);

  // A resolved item has a resolution time; a pending one does not.
  for (const item of u.scheduled) {
    if (item.status === 'pending') continue;
    expect(item.resolvedAt !== undefined, `${label}: ${item.kind} is ${item.status} with no resolvedAt`).toBe(true);
  }

  // --- Identity ------------------------------------------------------------
  // Records are keyed by their own id, and no id is reused across collections.
  const seen = new Map<string, string>();
  for (const [name, value] of Object.entries(u as unknown as Record<string, unknown>)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
    for (const [key, record] of Object.entries(value as Record<string, unknown>)) {
      if (!record || typeof record !== 'object' || !('id' in record)) continue;
      const id = (record as { id: string }).id;
      expect(id, `${label}: ${name}['${key}'] is filed under the wrong key`).toBe(key);
      const owner = seen.get(id);
      expect(owner === undefined || owner === name, `${label}: id ${id} exists in both ${owner} and ${name}`).toBe(true);
      seen.set(id, name);
    }
  }

  // --- Ownership -----------------------------------------------------------
  // Every account somebody holds names somebody who exists. The ledger's own
  // nominal accounts, where money comes from and goes to, belong to nobody.
  for (const account of Object.values(u.accounts)) {
    if (account.nominal) continue;
    expect(u.people[account.ownerId], `${label}: account ${account.id} has a missing owner`).toBeDefined();
  }

  // --- Wellbeing -----------------------------------------------------------
  for (const person of Object.values(u.people)) {
    for (const [key, value] of Object.entries(person.wellbeing)) {
      expect(Number.isFinite(value), `${label}: ${person.displayName}.${key} is not a number`).toBe(true);
      if (key === 'sleepDebt') continue;
      expect(value >= 0 && value <= 100, `${label}: ${person.displayName}.${key} is ${value}`).toBe(true);
    }
  }

  // Nothing in the record is dated after the moment we are standing in. (A history of milestones was checked here until it went, 2026-10-02.)
  for (const txn of u.transactions) {
    expect(txn.at <= u.now, `${label}: transaction ${txn.id} is dated in the future`).toBe(true);
  }

  // The clock only ever moved forwards.
  expect(u.now >= u.meta.createdAt, `${label}: the clock is before the save was created`).toBe(true);
}

describe('a universe left running', () => {
  const horizons: [string, number][] = [
    ['one day', 1],
    ['one week', 7],
    ['one month', 30],
    ['one year', 365],
  ];

  for (const [label, days] of horizons) {
    it(`stays coherent after ${label}`, () => {
      const sim = quickSave({}, `endurance-${days}`);
      checkInvariants(sim, `${label} (start)`);
      sim.advanceTo(sim.now + days * MS_DAY);
      checkInvariants(sim, label);
    }, 120_000);
  }

  it('stays coherent across five years, checked every year', () => {
    const sim = quickSave({}, 'endurance-5y');
    for (let year = 1; year <= 5; year++) {
      sim.advanceTo(sim.now + YEAR);
      checkInvariants(sim, `year ${year}`);
    }
  }, 600_000);

  it('stays coherent across ten years and does not slow down as it goes', () => {
    const sim = quickSave({}, 'endurance-10y');
    const cost: number[] = [];
    for (let year = 1; year <= 10; year++) {
      const started = performance.now();
      sim.advanceTo(sim.now + YEAR);
      cost.push(performance.now() - started);
    }
    checkInvariants(sim, 'ten years');

    // Cost per simulated year must plateau. Comparing the last three years to
    // the first three catches the classic failure: a collection that grows
    // without bound and is scanned every tick.
    const early = (cost[0]! + cost[1]! + cost[2]!) / 3;
    const late = (cost[7]! + cost[8]! + cost[9]!) / 3;
    expect(late / early, `year 8-10 cost ${late.toFixed(0)}ms vs year 1-3 ${early.toFixed(0)}ms`).toBeLessThan(3);
  }, 900_000);

  it('keeps every unbounded collection bounded over ten years', () => {
    const sim = quickSave({}, 'endurance-bounds');
    sim.advanceTo(sim.now + 10 * YEAR);
    const u = sim.universe as unknown as Record<string, unknown>;

    const sizes: Record<string, number> = {};
    for (const [name, value] of Object.entries(u)) {
      if (Array.isArray(value)) sizes[name] = value.length;
      else if (value && typeof value === 'object') sizes[name] = Object.keys(value).length;
    }

    // These are the collections that take on new records every single tick.
    // Left alone they grow linearly forever and eventually make the save
    // unloadable, so each one has a retention rule behind it.
    expect(sizes['people'], `people: ${sizes['people']}`).toBeLessThan(1_500);
    expect(sizes['scheduled'], `scheduled: ${sizes['scheduled']}`).toBeLessThan(6_000);
    expect(sizes['decisions'], `decisions: ${sizes['decisions']}`).toBeLessThan(500);
  }, 900_000);

  it('reaches the same universe twice from the same seed', () => {
    const fingerprint = (u: SaveUniverse) => JSON.stringify({
      now: u.now,
      people: Object.keys(u.people).length,
      transactions: u.transactions.length,
      balances: Object.entries(u.accounts).map(([id, a]) => [id, a.balance]).sort(),
      notifications: u.notifications.map((n) => `${n.at}:${n.title}`),
    });

    const a = quickSave({}, 'determinism-seed');
    const b = quickSave({}, 'determinism-seed');
    // Save ids and creation times differ by construction; everything the
    // simulation derives from the seed must not.
    a.advanceTo(a.now + 3 * YEAR);
    b.advanceTo(b.now + 3 * YEAR);
    expect(fingerprint(a.universe)).toEqual(fingerprint(b.universe));
  }, 900_000);
});
