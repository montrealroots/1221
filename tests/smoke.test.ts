import { describe, expect, it } from 'vitest';
import { quickSave, validateUniverse } from '@/engine';
import { BOARD_SEATS, GROUP_ROLES } from '@/engine/content/sugar';
import { postsOf, theSugarGroup } from '@/engine/world/company';
import { estateCity } from '@/engine/content/estate';
import { formatDateTime, MS_DAY } from '@/engine/core/time';
import { simulationLoad } from '@/engine/world/world';
import { netWorth } from '@/engine/systems/finance';

describe('a new universe boots and runs', () => {
  it('creates a coherent save', () => {
    const sim = quickSave();
    const report = validateUniverse(sim.universe);
    if (!report.ok) console.error(report.errors);
    expect(report.errors).toEqual([]);
    expect(sim.player.displayName).toBeTruthy();
    expect(sim.player.primaryAccountId).toBeTruthy();
    // A new save is one household: the player and the two people whose land it
    // is. The systems that used to populate a world around them — agents,
    // providers, the industry — are gone.
    //
    // "And nothing outside the family generates a name any more" is what this
    // said, and it is no longer true: the sugar group is staffed at boot, with a
    // managing director and four heads. That is a deliberate change and not a
    // leak of the old world-population. A company that has been trading since
    // 1946 and employs three thousand one hundred people cannot have a vacancy
    // where its management should be, and the screen that says who runs the
    // family business had no answer to give until these five existed. They are
    // five, they are the group's posts, and they are in nobody's household.
    const household = 3;
    const runTheGroup = GROUP_ROLES.filter((one) => one.monthlyCents > 0).length;
    expect(runTheGroup).toBe(5);
    expect(Object.keys(sim.universe.people)).toHaveLength(household + runTheGroup);
    expect(Object.keys(sim.universe.people)).toContain(sim.universe.playerId);
    expect(Object.keys(sim.universe.households)).toHaveLength(1);
    // Nobody the group employs is under the family's roof.
    const group = theSugarGroup(sim)!;
    for (const post of postsOf(sim.universe, group.id)) {
      if (!post.personId || BOARD_SEATS.includes(post.role as typeof BOARD_SEATS[number])) continue;
      expect(sim.universe.people[post.personId]!.householdId,
        `${post.role} was housed with the family`).toBeUndefined();
    }
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
    // The lot bills the company every month now, so the claim is no longer
    // that the ledger sits still — it is that everything it does conserves.
    // `audit()` re-derives every balance from the postings and proves each
    // transaction sums to zero, which is the invariant worth holding: money
    // may move as much as it likes and may not appear.
    const sim = quickSave();
    const opening = sim.universe.transactions.length;
    for (let month = 0; month < 36; month++) sim.advanceTo(sim.now + 30 * MS_DAY);

    expect(
      sim.universe.transactions.length,
      'three years and the lot never charged anybody for standing there',
    ).toBeGreaterThan(opening);
    expect(sim.ledger.audit()).toEqual([]);
    expect(validateUniverse(sim.universe).errors).toEqual([]);

    // The clock kept turning the day over for all three years.
    const w = sim.player.wellbeing;
    expect(w.energy).toBeGreaterThan(0);
    expect(w.condition).toBeGreaterThan(0);
    expect(sim.player.lastSleptAt, 'nobody slept in three years').toBeDefined();
  });

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

/**
 * The Decision Center, which was a room nothing ever wrote to.
 *
 * `world.take_decision_action` and `world.dismiss_decision` have always read a
 * `decisions` table the engine never filled, and what stood here instead of
 * these tests was an honest `it.todo` saying so. The world tick raises one
 * thing now — the reimbursement, whose application closes on the first day of
 * photography and which went entirely unannounced — so this is the room being
 * exercised rather than the room being described.
 */
