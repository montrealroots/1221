/**
 * SLATE — having the work done on the house.
 *
 * `property.condition` had one writer in the whole build and it was a
 * subtraction. `systems/life.ts` took `WEAR_A_DAY` off every standing property
 * every day, `sleepQuality` read the result every night, and nothing anywhere
 * put a point back — so the house the player sleeps in reached nought in a
 * little under twenty-three years, which is inside one career, and there was
 * no command, purchase or favor that could stop it.
 *
 * ## What it was costing, measured
 *
 * Paired over six seeds of twenty-five played years, the same seed on both
 * sides, the only difference being whether the house was held at the condition
 * it starts at:
 *
 * | | rotting | held |
 * |---|---|---|
 * | readiness, last third | 19.3 | 46.6 |
 * | weeks under `spentAt`, of 1300 | 575 | 77 |
 * | reliability, mean | 47.5 | 91.0 |
 * | reliability at the end | 0.0 | 94.3 |
 * | weeks pinned at reliability nought | 372 | 0 |
 * | careers reaching nought at all | 6 of 6 | 0 of 6 |
 * | parts won | 115 | 119 |
 * | career earnings | EUR 1.92m | EUR 2.20m |
 *
 * Two things in that table are worth saying out loud rather than leaving for
 * somebody to notice. The first is that the house is most of the late-career
 * collapse: hold it and no career reaches nought at all, on any seed. The
 * second is the honest limit of it — parts won moves by three of a hundred and
 * fifteen, and readings given does not move at all. The fourteen per cent that
 * shows up in earnings is the player winning better-paid work rather than more
 * of it. A reader who takes the reliability row as the size of the prize will
 * be wrong by an order of magnitude; the earnings row is the prize.
 *
 * ## Why a command and not the family
 *
 * The comment this replaces said the family kept the house up, and the cheapest
 * fix available was to make that true — hold the condition flat in the daily
 * rollover and be done. That was refused: it would have turned a number the
 * player watches into a constant, which is the same defect the other way round,
 * and it would have taken a decision out of a game whose whole subject is what
 * the player chooses to spend on. So the family does not pay. The player does,
 * out of their own account, for their own bed.
 */

import type { Simulation } from '../core/simulation';
import type { Id, Property } from '../domain/model';
import { formatMoney, type Money } from '../core/money';
import { A_POINT_OF_IT_CENTS, HOUSE } from '../content/estate';

const money = (cents: Money): string => formatMoney(cents, { cents: false });

const UPKEEP_MEMO = 'Work on the house';

/** Why the work cannot be had done today, if it cannot. */
export type WhyNotUpkeep = 'no-house' | 'nothing-to-do' | 'cannot-pay';

/** Where the player sleeps, if they sleep anywhere. */
export function theHouse(sim: Simulation): Property | undefined {
  const me = sim.universe.people[sim.universe.playerId];
  const id = me?.residenceId;
  return id ? sim.universe.properties[id] : undefined;
}

/**
 * How far down it has gone, in points.
 *
 * Off a hundred rather than off `HOUSE.condition`, because a hundred is what
 * the field means and what every screen prints it against; reading the seed
 * would make a save that started somewhere else silently unfixable past its own
 * starting point.
 */
export function pointsMissing(house: Property): number {
  return Math.max(0, 100 - house.condition);
}

/** What having the work done would cost today. */
export function whatTheWorkCosts(sim: Simulation): Money {
  const house = theHouse(sim);
  if (!house) return 0;
  return Math.round(pointsMissing(house) * A_POINT_OF_IT_CENTS);
}

/** What the player has to pay it with. */
function whatTheyHave(sim: Simulation): Money {
  const me = sim.universe.people[sim.universe.playerId];
  const id = me?.primaryAccountId;
  return id ? sim.universe.accounts[id]?.balance ?? 0 : 0;
}

export function whyNotUpkeep(sim: Simulation): WhyNotUpkeep | undefined {
  const house = theHouse(sim);
  if (!house) return 'no-house';
  if (pointsMissing(house) < 1) return 'nothing-to-do';
  if (whatTheWorkCosts(sim) > whatTheyHave(sim)) return 'cannot-pay';
  return undefined;
}

/** The sentence for each refusal, in the player's own terms. */
export function upkeepRefusal(sim: Simulation, why: WhyNotUpkeep): string {
  switch (why) {
    case 'no-house':
      return 'You don’t sleep anywhere the work could be done on.';
    case 'nothing-to-do':
      return `${HOUSE.name} is as good as it goes. There’s nothing here worth paying somebody to do.`;
    case 'cannot-pay':
      return `The work comes to ${money(whatTheWorkCosts(sim))} and you have `
        + `${money(Math.max(0, whatTheyHave(sim)))}.`;
  }
}

/**
 * Has the work done, and pays for it.
 *
 * All of it, in one go, because the thing being modeled is the decision to keep
 * the house rather than a schedule of trades in and out of it. The money leaves
 * today and the condition is back today: a house half-repaired over eleven
 * weeks would want a state for being mid-job, a screen that says so, and a rule
 * for what sleeping in a building site does to a night — three new things to
 * answer a question nobody has asked yet.
 */
export function haveTheWorkDone(
  sim: Simulation,
): { ok: boolean; error?: string; spent?: Money; putBack?: number } {
  const why = whyNotUpkeep(sim);
  if (why) return { ok: false, error: upkeepRefusal(sim, why) };

  const house = theHouse(sim)!;
  const me = sim.universe.people[sim.universe.playerId]!;
  const account = me.primaryAccountId as Id;
  const spent = whatTheWorkCosts(sim);
  const putBack = pointsMissing(house);

  sim.expense(account, spent, UPKEEP_MEMO, 'home', { refType: 'property', refId: house.id });
  house.condition = 100;

  sim.notify({
    category: 'home',
    title: `${house.name || HOUSE.name} Has Been Put Right`,
    body: `${money(spent)} of work, and it’s back to a hundred from `
      + `${Math.round(100 - putBack)}. A night here puts back more than it did yesterday, `
      + 'and it starts going again tomorrow.',
    importance: 55,
  });

  return { ok: true, spent, putBack };
}

export function registerHouse(sim: Simulation): void {
  /**
   * Keep the house.
   *
   * The only command in the build that spends the player's own money on the
   * player's own body, by way of the only thing in the build that reads what
   * kind of night they had.
   */
  sim.onCommand<Record<string, never>, { ok: boolean; error?: string; spent?: Money; putBack?: number }>(
    'life.upkeep', (_payload, { sim: s }) => haveTheWorkDone(s),
  );
}
