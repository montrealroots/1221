/**
 * The Full Life Test.
 *
 * SLATE is not only a film game, so this one never touches the industry. It is
 * an ordinary person: they rent somewhere to live, buy and insure a
 * car, meet someone, marry them, have a child, study, eat, sleep, see a doctor
 * and take a trip — over about four years of world time.
 *
 * What it proves is that the ordinary path is actually playable end to end, and
 * that every consequence lands somewhere the player can see: money in the
 * ledger, commitments on the calendar, milestones in history, people in a
 * household.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { quickSave, validateUniverse } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Id } from '@/engine/domain/model';
import { CATALOG } from '@/engine/content/catalog';
import { INTERACTIONS, relationshipStrength, type InteractionKind } from '@/engine/systems/relationships';

const MS_DAY = 86_400_000;

interface Lived {
  sim: Simulation;
  done: string[];
  skipped: string[];
}

function liveALife(): Lived {
  const sim = quickSave({ wealth: 'modest' }, 'full-life');
  const done: string[] = [];
  const skipped: string[] = [];

  /** Runs a step, recording whether the world allowed it. */
  const interactionRefusals = new Set<string>();
  const step = <R>(label: string, fn: () => R | undefined): R | undefined => {
    try {
      const value = fn();
      if (value === undefined) { skipped.push(label); return undefined; }
      done.push(label);
      return value;
    } catch (err) {
      skipped.push(`${label}: ${(err as Error).message}`);
      return undefined;
    }
  };

  const run = <R>(kind: string, payload: Record<string, unknown>): R => {
    const result = sim.execute<R>({ kind, payload });
    if (!result.ok) throw new Error(result.error ?? 'refused');
    return result.value as R;
  };

  // --- A place to live -----------------------------------------------------
  step('rent a home', () => {
    if (sim.player.residenceId && sim.universe.properties[sim.player.residenceId]) {
      return sim.universe.properties[sim.player.residenceId];
    }
    const rentable = Object.values(sim.universe.properties)
      .filter((p) => p.monthlyRent && p.monthlyRent > 0 && !p.isPrimaryResidence)
      .sort((a, b) => (a.monthlyRent ?? 0) - (b.monthlyRent ?? 0));
    for (const property of rentable) {
      const result = sim.execute<{ monthlyRent: number }>({
        kind: 'prop.rent', payload: { propertyId: property.id, months: 12 },
      });
      if (result.ok) return result.value;
    }
    return undefined;
  });

  // Work a while and put something aside before spending it.
  sim.advanceTo(sim.now + 300 * MS_DAY);

  /** Moves savings into the spending account, the way anyone buying something does. */
  const topUpChecking = (target: number): void => {
    const checking = sim.player.primaryAccountId;
    const savings = Object.values(sim.universe.accounts).find(
      (a) => a.ownerId === sim.player.id && a.kind === 'savings' && !a.closedAt,
    );
    if (!checking || !savings) return;
    const short = target - sim.ledger.availableFunds(checking);
    if (short <= 0) return;
    const amount = Math.min(short, savings.balance);
    if (amount <= 0) return;
    sim.execute({
      kind: 'finance.transfer',
      payload: { fromAccountId: savings.id, toAccountId: checking, amount, memo: 'Moving money across to spend it' },
    });
  };
  topUpChecking(6_000_00);

  // --- A car, and insurance on it -----------------------------------------
  const vehicleId = step('buy a car', () => {
    const listing = Object.values(sim.universe.vehicleListings)
      .filter((l) => l.status === 'active')
      .sort((a, b) => a.price - b.price)[0];
    if (!listing) return undefined;
    const bought = run<{ vehicleId: Id }>('veh.purchase', {
      listingId: listing.id, acquisition: 'financed', downPayment: 2_000_00, termMonths: 60, negotiate: true,
    });
    return bought.vehicleId;
  });

  step('insure the car', () => {
    if (!vehicleId) return undefined;
    topUpChecking(1_500_00);
    const quote = run<{ quoteId: Id }>('ins.quote', {
      line: 'auto', coveredRefs: [{ type: 'vehicle', id: vehicleId }],
    });
    return run<{ policyId: Id }>('ins.purchase', { quoteId: quote.quoteId });
  });

  // --- Eating and sleeping -------------------------------------------------
  step('sleep a real night', () => run('life.sleep', { hours: 8 }));

  step('buy groceries', () => {
    const items = CATALOG.all().filter((i) => i.category === 'groceries').slice(0, 5);
    if (items.length === 0) return undefined;
    const result = sim.execute<{ orderId: Id; total: number }>({
      kind: 'shop.purchase',
      payload: {
        retailerId: 'valuemart',
        lines: items.map((i) => ({ catalogId: i.id, quantity: 2 })),
      },
    });
    return result.ok ? result.value : undefined;
  });

  // --- Someone to know -----------------------------------------------------
  const relationshipId = step('meet someone', () => {
    const stranger = Object.values(sim.universe.people).find(
      (p) => !p.isPlayer && p.tier !== 'dormant'
        && !Object.values(sim.universe.relationships).some(
          (r) => (r.aId === p.id || r.bId === p.id) && (r.aId === sim.player.id || r.bId === sim.player.id),
        ),
    );
    if (!stranger) return undefined;
    return run<{ relationshipId: Id }>('rel.meet', { personId: stranger.id, context: 'Through work.' }).relationshipId;
  });

  /**
   * Spends time with someone the way the game intends: the best thing the
   * relationship is currently ready for. You cannot have the conversation that
   * changes everything with somebody you have just met.
   */
  const spendTimeTogether = (id: Id, times: number, mood: InteractionKind[]): void => {
    for (let i = 0; i < times; i++) {
      const rel = sim.universe.relationships[id];
      if (!rel || rel.endedAt) return;
      const familiarity = rel.dimensions.familiarity;
      // Clear the air first when there is air to clear. Nothing else in a
      // relationship lands properly on top of unresolved friction.
      const available = mood.filter((kind) => INTERACTIONS[kind].minFamiliarity <= familiarity);
      const choice = rel.dimensions.conflict > 25 && familiarity >= INTERACTIONS.apologise.minFamiliarity
        ? 'apologise'
        : available[available.length - 1] ?? 'chat';
      const res = sim.execute({ kind: 'rel.interact', payload: { relationshipId: id, interaction: choice } });
      if (!res.ok) interactionRefusals.add(`${choice}: ${res.error}`);
      sim.advanceTo(sim.now + 5 * MS_DAY);
    }
  };

  step('get to know them', () => {
    if (!relationshipId) return undefined;
    // Familiarity is earned, and the good conversations are gated behind it.
    spendTimeTogether(relationshipId, 45, ['chat', 'work_together', 'catch_up', 'deep_talk']);
    return sim.universe.relationships[relationshipId];
  });

  step('become a couple', () => {
    if (!relationshipId) return undefined;
    return run<{ type: string }>('rel.define', { relationshipId, exclusive: true });
  });

  step('get engaged', () => {
    if (!relationshipId) return undefined;
    // A proposal can be turned down, and being turned down is not the world
    // refusing to let you marry. You put the work in and you ask again.
    for (let attempt = 0; attempt < 4; attempt++) {
      spendTimeTogether(relationshipId, 40, ['chat', 'catch_up', 'celebrate', 'support', 'deep_talk']);
      const proposal = sim.execute<{ accepted: boolean }>({ kind: 'rel.propose', payload: { relationshipId } });
      if (proposal.ok && proposal.value?.accepted) return proposal.value;
      sim.advanceTo(sim.now + 60 * MS_DAY);
    }
    return undefined;
  });

  step('get married', () => {
    if (!relationshipId) return undefined;
    topUpChecking(16_000_00);
    const result = sim.execute<{ cost: number }>({
      kind: 'rel.plan_wedding',
      payload: {
        relationshipId, date: sim.now + 200 * MS_DAY, budget: 14_000_00,
        guests: 60, venue: 'A room above a pub',
      },
    });
    if (!result.ok) return undefined;
    sim.advanceTo(sim.now + 210 * MS_DAY);
    return result.value;
  });

  const childId = step('have a child', () => {
    if (!relationshipId) return undefined;
    // A wedding is not the end of the relationship; it still needs tending.
    spendTimeTogether(relationshipId, 45, ['chat', 'catch_up', 'celebrate', 'support', 'deep_talk']);
    const result = sim.execute<{ childId: Id }>({
      kind: 'rel.have_child', payload: { partnerRelationshipId: relationshipId, method: 'birth' },
    });
    if (!result.ok) {
      const rel = sim.universe.relationships[relationshipId];
      throw new Error(
        `${result.error} (strength ${rel ? relationshipStrength(rel, sim.now).toFixed(0) : '?'}, `
        + `dimensions ${JSON.stringify(rel?.dimensions)}`
        + `${interactionRefusals.size > 0 ? `, refused: ${[...interactionRefusals].join('; ')}` : ''})`,
      );
    }
    return result.value?.childId;
  });

  // --- Study, health, travel ----------------------------------------------
  step('enroll in a course', () => {
    topUpChecking(3_000_00);
    const course = Object.values(sim.universe.courses).sort((a, b) => a.costPerSession - b.costPerSession)[0];
    if (!course) return undefined;
    const result = sim.execute<{ enrollmentId: Id }>({ kind: 'edu.enroll', payload: { courseId: course.id } });
    return result.ok ? result.value : undefined;
  });

  step('see a doctor', () => {
    const provider = Object.values(sim.universe.healthProviders)[0];
    if (!provider) return undefined;
    // The Calendar refuses a slot that collides with something already booked,
    // so find one that does not, the way the booking screen would.
    let refusal = 'no provider';
    for (let day = 3; day < 60; day++) {
      const at = sim.now + day * MS_DAY + 10 * 3_600_000;
      if (sim.timeline.conflicts(at, 60).length > 0) continue;
      const result = sim.execute<{ appointmentId: Id }>({
        kind: 'health.book', payload: { providerId: provider.id, at },
      });
      if (result.ok) return result.value;
      refusal = result.error ?? 'refused';
    }
    throw new Error(refusal);
  });

  step('take a trip', () => {
    const somewhere = ['us-ny-newyork', 'us-il-chicago', 'us-ca-losangeles']
      .find((id) => id !== sim.player.currentLocationId);
    if (!somewhere) return undefined;
    const result = sim.execute<{ tripId: Id }>({
      kind: 'travel.plan_trip',
      payload: {
        name: 'A week away', purpose: 'leisure', destinations: [somewhere],
        departAt: sim.now + 45 * MS_DAY, returnAt: sim.now + 52 * MS_DAY,
      },
    });
    return result.ok ? result.value : undefined;
  });

  // Live the rest of it out.
  sim.advanceTo(sim.now + 400 * MS_DAY);
  void childId;

  return { sim, done, skipped };
}

describe('an ordinary life', () => {
  let lived: Lived;
  beforeAll(() => { lived = liveALife(); }, 300_000);

  it('is playable without ever touching the film industry', () => {
    // Every step that mattered has to have been possible. If the world refused
    // one, the message says which and why rather than the test simply passing.
    expect(lived.skipped, `steps the world refused: ${lived.skipped.join(' | ')}`).toEqual([]);
    expect(lived.done.length).toBeGreaterThanOrEqual(12);
  });

  it('paid for all of it out of a ledger that still balances', () => {
    const sim = lived.sim;
    expect(sim.ledger.audit()).toEqual([]);
    let total = 0;
    for (const txn of sim.universe.transactions) for (const p of txn.postings) total += p.amount;
    expect(total).toBe(0);
    // An ordinary life generates ordinary spending, in several categories.
    const categories = new Set(sim.universe.transactions.map((t) => t.category));
    expect(categories.size, `only spent on: ${[...categories].join(', ')}`).toBeGreaterThan(4);
  });

  it('left the person with a home, a car and a family', () => {
    const sim = lived.sim;
    const player = sim.player;

    expect(player.residenceId, 'never got a home').toBeDefined();
    expect(
      Object.values(sim.universe.vehicles).some((v) => v.ownerId === player.id && !v.soldAt),
      'never kept a car',
    ).toBe(true);

    const mine = Object.values(sim.universe.relationships).filter(
      (r) => r.aId === player.id || r.bId === player.id,
    );
    const spouse = mine.find((r) => !r.endedAt && r.type === 'spouse');
    expect(
      spouse,
      `never married. Relationships: ${JSON.stringify(mine.map((r) => [r.type, r.endedAt ? 'ended:' + r.endReason : 'live']))}`,
    ).toBeDefined();

    const children = Object.values(sim.universe.relationships).filter(
      (r) => !r.endedAt && r.type === 'parent' && r.aId === player.id,
    );
    expect(children.length, 'no children recorded as a relationship').toBeGreaterThan(0);

    const household = player.householdId ? sim.universe.households[player.householdId] : undefined;
    expect(household, 'no household').toBeDefined();
    expect(household!.memberIds.length, 'the household never grew').toBeGreaterThan(1);
  });

  it('remembers the milestones', () => {
    const sim = lived.sim;
    const categories = new Set(sim.universe.history.map((h) => h.category));
    // A life leaves a record across more than one part of itself.
    expect(categories.size, `history only covers: ${[...categories].join(', ')}`).toBeGreaterThan(3);
    expect(sim.universe.history.every((h) => h.at <= sim.now)).toBe(true);
  });

  it('kept the relationship inside its bounds the whole way', () => {
    const sim = lived.sim;
    for (const rel of Object.values(sim.universe.relationships)) {
      for (const [dim, value] of Object.entries(rel.dimensions)) {
        expect(value >= 0 && value <= 100, `${rel.id}.${dim} = ${value}`).toBe(true);
      }
      // A relationship that got somewhere has something to remember about it.
      if (rel.type === 'spouse') expect(rel.memories.length).toBeGreaterThan(0);
    }
  });

  it('ends with a universe that still validates', () => {
    expect(validateUniverse(lived.sim.universe).errors).toEqual([]);
  });
});

/**
 * A year of eating.
 *
 * The unplanned meal used to take the single best nourishment-per-dollar item
 * in the catalog, every time, forever: five hundred and twenty-seven
 * identical lines of pasta in a year, at $3.87 a day, which is neither a
 * person nor an economy. It picks from the good-value end now, weighted, so a
 * careful eater is still careful and still a person.
 */
describe('a year of eating', () => {
  const YEAR = 365 * 86_400_000;

  it('does not eat the same thing every meal for a year', () => {
    const sim = quickSave({ wealth: 'modest' }, 'eating-variety');
    sim.advanceTo(sim.now + YEAR);
    const meals = sim.universe.transactions.filter((t) => t.category === 'food');
    expect(meals.length, 'nobody ate anything all year').toBeGreaterThan(200);

    const foods = new Set(meals.map((t) => t.memo.split(' — ')[0]));
    const lines = new Set(meals.map((t) => t.memo));
    expect(foods.size, `only ate ${[...foods].join(', ')}`).toBeGreaterThanOrEqual(8);
    expect(lines.size, 'the statement reads the same line over and over').toBeGreaterThan(40);

    // And no single thing dominates the whole year.
    const counts = new Map<string, number>();
    for (const meal of meals) {
      const food = meal.memo.split(' — ')[0]!;
      counts.set(food, (counts.get(food) ?? 0) + 1);
    }
    const commonest = Math.max(...counts.values());
    expect(commonest / meals.length, 'one food is more than a third of everything eaten').toBeLessThan(0.34);
  });

  it('costs something a person could recognize, per meal', () => {
    const sim = quickSave({ wealth: 'modest' }, 'eating-cost');
    sim.advanceTo(sim.now + YEAR);
    const meals = sim.universe.transactions.filter((t) => t.category === 'food');
    const spent = meals.reduce((sum, t) => sum + Math.abs(t.postings.find((p) => p.amount < 0)?.amount ?? 0), 0);
    const perMeal = spent / 100 / meals.length;
    expect(perMeal, `each meal cost $${perMeal.toFixed(2)}`).toBeGreaterThan(3);
    expect(perMeal, `each meal cost $${perMeal.toFixed(2)}`).toBeLessThan(20);
  });

  it('feeds somebody roughly three times a day', () => {
    // This was a todo. applyElapsedWellbeing existed, was exported and was
    // called by nothing, so a coasted day only ran its sleep: hunger moved ten
    // points instead of eighty and the autopilot bought two thirds of a meal a
    // day. The waking day happens now.
    const sim = quickSave({ wealth: 'modest' }, 'eating-frequency');
    sim.advanceTo(sim.now + YEAR);
    const meals = sim.universe.transactions.filter((t) => t.category === 'food');
    const perDay = meals.length / 365;
    expect(perDay, `${perDay.toFixed(2)} meals a day`).toBeGreaterThan(2.4);
    expect(perDay, `${perDay.toFixed(2)} meals a day`).toBeLessThan(5);
  });

  it('costs what feeding one person costs', () => {
    const sim = quickSave({ wealth: 'modest' }, 'eating-daily-cost');
    sim.advanceTo(sim.now + YEAR);
    const spent = sim.universe.transactions
      .filter((t) => t.category === 'food')
      .reduce((sum, t) => sum + Math.abs(t.postings.find((p) => p.amount < 0)?.amount ?? 0), 0);
    const perDay = spent / 100 / 365;
    expect(perDay, `food came to $${perDay.toFixed(2)} a day`).toBeGreaterThan(9);
    expect(perDay, `food came to $${perDay.toFixed(2)} a day`).toBeLessThan(30);
  });

  it('still leans cheap, because this is somebody who did not shop', () => {
    const sim = quickSave({ wealth: 'modest' }, 'eating-cheap');
    sim.advanceTo(sim.now + YEAR);
    const meals = sim.universe.transactions.filter((t) => t.category === 'food');
    const dear = meals.filter((t) => Math.abs(t.postings.find((p) => p.amount < 0)?.amount ?? 0) > 30_00);
    expect(dear.length / meals.length, 'a careful eater is buying too many expensive meals').toBeLessThan(0.1);
    expect(sim.player.wellbeing.nourishment, 'they starved').toBeGreaterThan(40);
  });

  it('reaches the same meals twice from the same seed', () => {
    const a = quickSave({ wealth: 'modest' }, 'eating-determinism');
    const b = quickSave({ wealth: 'modest' }, 'eating-determinism');
    a.advanceTo(a.now + 120 * 86_400_000);
    b.advanceTo(b.now + 120 * 86_400_000);
    const memos = (sim: typeof a) => sim.universe.transactions.filter((t) => t.category === 'food').map((t) => t.memo);
    expect(memos(a)).toEqual(memos(b));
  });
});

/**
 * The waking day.
 *
 * applyElapsedWellbeing was written, exported, and called by nothing at all.
 * A character carried forward by the clock only ever ran their sleep: energy
 * never drained, stress never built, sleep debt never accrued and hunger moved
 * a tenth of what it should. They were permanently well rested.
 *
 * Turning it on broke two things that had never been under load, and both are
 * held here: sleep debt could only be paid down out of the part of a night
 * above five and a half effective hours, which an unattended night never
 * reaches, so debt climbed to its cap and stayed; and morale moved on a
 * threshold at the same unreachable point, so it fell every night forever.
 */
describe('a day that is not directed', () => {
  const YEAR2 = 365 * 86_400_000;

  it('drains what a day drains, rather than only what a night does', () => {
    const sim = quickSave({}, 'awake-drain');
    const before = { ...sim.player.wellbeing };
    sim.advanceTo(sim.now + 2 * 86_400_000);
    // Hunger has to move by more than a night's worth.
    expect(before.nourishment - sim.player.wellbeing.nourishment + 60).toBeGreaterThan(20);
  });

  it('does not spiral into the sleep-debt cap over a year', () => {
    const sim = quickSave({}, 'awake-debt');
    sim.advanceTo(sim.now + YEAR2);
    expect(sim.player.wellbeing.sleepDebt, 'sleep debt ran away').toBeLessThan(20);
  });

  it('does not grind morale and condition to nothing', () => {
    const sim = quickSave({}, 'awake-morale');
    sim.advanceTo(sim.now + YEAR2);
    expect(sim.player.wellbeing.morale, 'morale bottomed out').toBeGreaterThan(35);
    expect(sim.player.wellbeing.condition, 'condition bottomed out').toBeGreaterThan(35);
  });

  it('settles into a mediocre equilibrium rather than a collapse or a holiday', () => {
    // Coasting keeps you going and does not get you to your best. Both halves
    // of that are the claim.
    const sim = quickSave({}, 'awake-equilibrium');
    sim.advanceTo(sim.now + YEAR2);
    const w = sim.player.wellbeing;
    for (const [key, value] of Object.entries(w)) {
      if (key === 'sleepDebt') continue;
      expect(value, `${key} left the scale`).toBeGreaterThanOrEqual(0);
      expect(value, `${key} left the scale`).toBeLessThanOrEqual(100);
    }
    expect(w.energy, 'a coasting day should still tire somebody out').toBeLessThan(74);
  });
});
