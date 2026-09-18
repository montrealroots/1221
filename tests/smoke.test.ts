import { describe, expect, it } from 'vitest';
import { quickSave, validateUniverse } from '@/engine';
import { BOARD_SEATS, GROUP_ROLES } from '@/engine/content/sugar';
import { postsOf, projectsOf, theSugarGroup } from '@/engine/world/company';
import type { Simulation } from '@/engine';
import { estateCity } from '@/engine/content/estate';
import { formatDateTime, MS_DAY, MS_HOUR } from '@/engine/core/time';
import { openDecisions, simulationLoad } from '@/engine/world/world';
import { netWorth } from '@/engine/systems/finance';
import { whyNot } from '@/engine/world/rebate';
import { openTheBooks, openTheDoors } from './doors';
import { playACareer } from './played';

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
describe('the Decision Center has something in it', () => {
  const run = (sim: Simulation, kind: string, payload: Record<string, unknown> = {}) =>
    sim.execute<{ ok: boolean; id?: string; error?: string }>({ kind, payload }).value!;

  /** Opens both doors and puts a feature on the floor. Returns its id. */
  function greenlightOne(sim: Simulation, title = 'Hvítserkur'): string {
    openTheDoors(sim);
    openTheBooks(sim);
    run(sim, 'company.develop', { title, medium: 'film' });
    const id = projectsOf(sim.universe).find((one) => one.title === title)!.id;
    const done = run(sim, 'company.greenlight', {
      projectId: id, planId: 'feature', budgetCents: 20_000_000_00, shootWeeks: 8,
    });
    expect(done.error, 'the picture would not greenlight').toBeUndefined();
    return id;
  }

  it('fills over a played career that greenlights a picture and runs it', () => {
    const sim = quickSave({}, 'decisions');
    const projectId = greenlightOne(sim);

    // Played rather than idled, because the whole room hangs off the world
    // tick and an idle save is where this project has been wrong five times.
    const seen = new Map<string, string>();
    const eachWeek = (s: Simulation) => {
      for (const one of openDecisions(s)) seen.set(one.id, one.title);
    };
    playACareer(sim, 0.5, { eachWeek });

    expect(
      Object.keys(sim.universe.decisions).length,
      'half a played year with a picture on the floor and the Decision Center is still empty',
    ).toBeGreaterThan(0);
    expect([...seen.values()]).toContain('Hvítserkur: File The Reimbursement Claim');

    // One row for one picture, and not a fresh one every tick for fifteen weeks.
    expect(seen.size).toBe(1);

    // And it closed on its own date rather than being waved off before it.
    const row = Object.values(sim.universe.decisions)[0]!;
    expect(row.refType).toBe('project');
    expect(row.refId).toBe(projectId);
    expect(row.dismissedAt, 'the ninety-day quiet rule took a dated row off the list').toBeUndefined();
    expect(row.resolvedAt).toBeDefined();
    expect(row.resolvedAt!).toBeGreaterThanOrEqual(row.dueAt!);

    // Then the save forgets it, which is the other half of the room working.
    // Half a year of play leaves the closed row in place because `prune` keeps
    // one for a hundred and eighty days past its close; another year and a half
    // takes it out, and a save played for a decade does not carry every prompt
    // it ever raised.
    playACareer(sim, 1.5, { eachWeek });
    expect(Object.keys(sim.universe.decisions)).toEqual([]);
  });

  it('files the claim when the button on it is pressed', () => {
    const sim = quickSave({}, 'decisions-press');
    const projectId = greenlightOne(sim);
    sim.advanceTo(sim.now + 3 * MS_DAY);

    const row = openDecisions(sim)[0]!;
    expect(row.actions).toHaveLength(1);
    expect(row.actions[0]!.commandKind).toBe('company.claim_rebate');
    expect(sim.universe.projects[projectId]!.rebate).toBeUndefined();

    const done = run(sim, 'world.take_decision_action', { decisionId: row.id, actionIndex: 0 });
    expect(done.ok).toBe(true);
    expect(sim.universe.projects[projectId]!.rebate?.shareAt).toBe(0.35);
    expect(sim.universe.decisions[row.id]!.resolvedAt).toBeDefined();
    expect(openDecisions(sim)).toHaveLength(0);
  });

  it('clears the row when the claim is filed from the workspace instead', () => {
    const sim = quickSave({}, 'decisions-workspace');
    const projectId = greenlightOne(sim);
    sim.advanceTo(sim.now + 3 * MS_DAY);
    expect(openDecisions(sim)).toHaveLength(1);

    expect(run(sim, 'company.claim_rebate', { projectId }).ok).toBe(true);
    expect(openDecisions(sim), 'filed elsewhere and the room went on asking').toHaveLength(0);
  });

  it('stops asking once the row is waved away', () => {
    const sim = quickSave({}, 'decisions-dismiss');
    greenlightOne(sim);
    sim.advanceTo(sim.now + 3 * MS_DAY);
    const row = openDecisions(sim)[0]!;

    run(sim, 'world.dismiss_decision', { decisionId: row.id });
    expect(sim.universe.decisions[row.id]!.dismissedAt).toBeDefined();
    // Four ticks: without the check on a waved-away row the raiser puts a
    // fresh one back on the list at the first of them.
    sim.advanceTo(sim.now + 8 * MS_DAY);
    expect(openDecisions(sim), 'Dismiss is a button that undoes itself').toHaveLength(0);
  });

  it('remembers the wave for longer than it keeps the row by the calendar', () => {
    // A forty-week feature carries 294 days between the greenlight and the
    // first day of photography, and `prune` drops a closed decision a hundred
    // and eighty days after it closes. So the dismissal that stops the raiser
    // asking again is deleted with four months of runway left, and without the
    // rule that a closed row about a date still ahead is kept, the prompt comes
    // back on a picture the player waved away in week one.
    const sim = quickSave({}, 'decisions-long');
    openTheDoors(sim);
    openTheBooks(sim);
    run(sim, 'company.develop', { title: 'Langur', medium: 'film' });
    const id = projectsOf(sim.universe).find((one) => one.title === 'Langur')!.id;
    expect(run(sim, 'company.greenlight', {
      projectId: id, planId: 'feature', budgetCents: 20_000_000_00, shootWeeks: 40,
    }).error).toBeUndefined();
    sim.advanceTo(sim.now + 3 * MS_DAY);

    const row = openDecisions(sim)[0]!;
    expect(Math.round((row.dueAt! - sim.now) / MS_DAY), 'the runway is not long enough to reach past the retention').toBeGreaterThan(200);
    run(sim, 'world.dismiss_decision', { decisionId: row.id });

    sim.advanceTo(sim.now + 200 * MS_DAY);
    expect(openDecisions(sim), 'the wave was pruned and the raiser started again').toHaveLength(0);
    expect(sim.universe.decisions[row.id], 'the row carrying the wave was dropped while its date was still ahead').toBeDefined();
  });

  it('keeps the row open when the command behind the button refuses', () => {
    const sim = quickSave({}, 'decisions-late');
    const projectId = greenlightOne(sim);
    sim.advanceTo(sim.now + 3 * MS_DAY);
    const row = openDecisions(sim)[0]!;

    // The gap between the camera turning over and the tick that closes the
    // row. `CommandResult.ok` says the handler ran, not that it did the thing,
    // so reading the envelope alone marked this answered and took a claim
    // worth 5,984,927.96 EUR off the list without filing anything.
    sim.advanceTo(row.dueAt! + MS_HOUR);
    expect(whyNot(sim, sim.universe.projects[projectId]!), 'the door was meant to be shut by now').toBe('too-late');
    expect(sim.universe.decisions[row.id]!.resolvedAt, 'the tick closed it before the test could press it').toBeUndefined();

    // Read off the envelope, because the envelope is what the screen reads.
    // `game-context.tsx` shows the player a message when `CommandResult.ok` is
    // false and shows nothing at all otherwise, and Home throws the returned
    // value away. A refusal reported inside a successful envelope is a button
    // that does nothing and says nothing, so this asserts the field the player
    // is on the other end of rather than the one the engine finds convenient.
    const done = sim.execute({ kind: 'world.take_decision_action', payload: { decisionId: row.id, actionIndex: 0 } });
    expect(done.ok, 'the refusal came back inside a successful envelope, so nobody is told').toBe(false);
    expect(done.error).toContain('The camera has turned over');
    expect(sim.universe.projects[projectId]!.rebate).toBeUndefined();
    expect(sim.universe.decisions[row.id]!.resolvedAt).toBeUndefined();
  });
});
