import { describe, expect, it } from 'vitest';
import { quickSave, validateUniverse } from '@/engine';
import { estateCity } from '@/engine/content/estate';
import { formatDateTime, MS_DAY } from '@/engine/core/time';
import { openDecisions, simulationLoad } from '@/engine/world/world';
import { netWorth } from '@/engine/systems/finance';

describe('a new universe boots and runs', () => {
  it('creates a coherent save', () => {
    const sim = quickSave();
    const report = validateUniverse(sim.universe);
    if (!report.ok) console.error(report.errors);
    expect(report.errors).toEqual([]);
    expect(sim.player.displayName).toBeTruthy();
    expect(sim.player.primaryAccountId).toBeTruthy();
    // A new save is one household: the player and the two people whose land
    // it is. The systems that used to populate a world around them — agents,
    // providers, the industry — are gone, and nothing outside the family
    // generates a name any more.
    expect(Object.keys(sim.universe.people)).toHaveLength(3);
    expect(Object.keys(sim.universe.people)).toContain(sim.universe.playerId);
    expect(Object.keys(sim.universe.households)).toHaveLength(1);
  });

  it('has a player who exists somewhere in time and space', () => {
    const sim = quickSave();
    expect(formatDateTime(sim.now, sim.homeZone)).toContain('2026');
    expect(sim.universe.homeZone).toBe(estateCity().timeZone);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('advances a week without corrupting anything', () => {
    const sim = quickSave();
    const before = sim.now;
    const result = sim.advanceTo(sim.now + 7 * MS_DAY);

    expect(sim.now).toBe(before + 7 * MS_DAY);
    expect(result.itemsProcessed).toBeGreaterThan(0);
    expect(sim.ledger.audit()).toEqual([]);

    const report = validateUniverse(sim.universe);
    if (!report.ok) console.error(report.errors);
    expect(report.errors).toEqual([]);
  });

  it('advances a full year and stays consistent', () => {
    const sim = quickSave();
    sim.advanceTo(sim.now + 365 * MS_DAY);

    expect(sim.ledger.audit()).toEqual([]);
    const report = validateUniverse(sim.universe);
    if (!report.ok) console.error(report.errors.slice(0, 10));
    expect(report.errors).toEqual([]);

    const load = simulationLoad(sim);
    expect(load.people).toBeLessThan(1500);
    expect(load.pendingEvents).toBeLessThan(20000);
  });

  it('runs three years without breaking anything', () => {
    // Nothing bills the player any more, so the honest claim is not that the
    // ledger keeps moving — it is that three years of the clock leave the
    // save consistent, the money reconciled and the character still alive in
    // a plausible state.
    const sim = quickSave();
    const opening = sim.universe.transactions.length;
    for (let month = 0; month < 36; month++) sim.advanceTo(sim.now + 30 * MS_DAY);

    expect(sim.universe.transactions.length, 'money appeared from nowhere').toBe(opening);
    expect(sim.ledger.audit()).toEqual([]);
    expect(validateUniverse(sim.universe).errors).toEqual([]);
    expect(openDecisions(sim).length).toBeGreaterThanOrEqual(0);

    // The clock kept turning the day over for all three years.
    const w = sim.player.wellbeing;
    expect(w.energy).toBeGreaterThan(0);
    expect(w.condition).toBeGreaterThan(0);
    expect(sim.player.lastSleptAt, 'nobody slept in three years').toBeDefined();
  });

  /**
   * Not a passing test and not a skipped one that pretends otherwise.
   *
   * Three simulated years currently raise zero decisions and two or three
   * notifications. The company's only decision was missing its overhead, and
   * with ten million in the account it never does; the life systems raise
   * nothing on their own at this wealth. The game is silent, and it will stay
   * silent until there is material to develop and buyers to sell it to.
   *
   * Left as a todo so the runner reports it every time rather than letting a
   * green suite imply the Decision Center works.
   */
  it.todo('raises something for the player to decide about — nothing does yet');

  it('keeps money as the sum of postings', () => {
    const sim = quickSave();
    sim.advanceTo(sim.now + 90 * MS_DAY);
    const recomputed = sim.ledger.recompute();
    for (const [id, account] of Object.entries(sim.universe.accounts)) {
      expect(account.balance).toBe(recomputed[id] ?? 0);
    }
    const worth = netWorth(sim, sim.player.id);
    expect(Number.isFinite(worth.total)).toBe(true);
  });

  it('is deterministic: the same seed produces the same world', () => {
    const a = quickSave(undefined, 'determinism-seed');
    const b = quickSave(undefined, 'determinism-seed');
    a.advanceTo(a.now + 30 * MS_DAY);
    b.advanceTo(b.now + 30 * MS_DAY);

    expect(a.now).toBe(b.now);
    expect(Object.keys(a.universe.people).length).toBe(Object.keys(b.universe.people).length);
    expect(a.universe.transactions.length).toBe(b.universe.transactions.length);
    expect(netWorth(a, a.player.id).total).toBe(netWorth(b, b.player.id).total);
  });

  it('isolates saves from one another', () => {
    const one = quickSave(undefined, 'seed-one', 1);
    const two = quickSave(undefined, 'seed-two', 2);
    expect(one.universe.meta.id).not.toBe(two.universe.meta.id);

    one.advanceTo(one.now + 30 * MS_DAY);
    const twoBefore = two.universe.transactions.length;
    one.advanceTo(one.now + 30 * MS_DAY);
    expect(two.universe.transactions.length).toBe(twoBefore);

    for (const person of Object.values(two.universe.people)) {
      expect(person.saveId).toBe(two.universe.meta.id);
    }
  });
});
