/**
 * SLATE — the end of it, and the writer `dissolvedAt` never had.
 *
 * `Company.dissolvedAt` has been in the domain model since companies were. Five
 * things read it — three filters in `world/company.ts` and two on the estate screen —
 * and its own docstring said so plainly: *no command writes it, five filters read it,
 * five guards against a state the save cannot reach.* A game where the company cannot
 * fail is a game where the money is a score.
 *
 * So this is the writer. It is the only file in the build that can end a save's
 * business, and everything about it is arranged so that ending is something a player
 * walks into rather than something that happens to them.
 *
 * ## Three things have to be true at once
 *
 * Insolvency alone is not ruin. A company that is overdrawn in March and paid in
 * April was never in trouble — it was making a picture. So the company fails when
 * the cash is gone **and** the family has stopped writing checks without a
 * condition **and** it has been that way for long enough to be a condition rather
 * than a month.
 *
 * The family is what makes this a story instead of an accounting rule. They have
 * been carrying the lot since the beginning, their patience is already modeled in
 * `world/lot.ts` as a rung that moves with what has been put in, and past the last
 * rung the money arrives with a condition on it. That is the moment the company is
 * on its own, and a player can see it coming for years.
 *
 * ## Why it is recoverable until the day it is not
 *
 * The clock resets the moment the company is solvent again. A picture that comes
 * good in the fourth month saves the company, which is the shape a studio story
 * should have — and it means the grace period is a real window a player can act
 * inside rather than a countdown they watch.
 */

import type { Simulation } from '../core/simulation';
import type { Company } from '../domain/company';
import { cashAccountFor, parentCompany } from './company';
import { standingWith, startOfNextMonth } from './lot';

export const RUIN_KIND = 'company.arrears';

/**
 * How many months in a row the company can be under before it is wound up.
 *
 * Four, which is long enough for a release to arrive and save it. A picture opens,
 * and the foreign sale is six weeks behind that — so a producer who is overdrawn the
 * month before an opening is in trouble and is not finished, and the difference
 * between those two is the whole of the tension worth having here.
 */
export const GRACE_MONTHS = 4;

/** Whether the company is under water right now. */
export function isUnder(sim: Simulation, company: Company): boolean {
  const cash = cashAccountFor(sim.universe, company.id);
  return cash !== undefined && cash.balance < 0;
}

/**
 * Whether the family would still cover it without asking anything.
 *
 * Read off the rung they are already on. Past the last one their money comes with a
 * condition, and a company living on conditional money is a company on notice.
 */
export const familyStillCarries = (sim: Simulation): boolean => !standingWith(sim).conditional;

export interface Standing {
  /** Whether the company is overdrawn. */
  under: boolean;
  /** Whether the family is still covering it unconditionally. */
  carried: boolean;
  /** How many months in a row it has been under, counting this one. */
  months: number;
  /** How many are left before it is wound up. */
  left: number;
  /** Whether it has been wound up. */
  gone: boolean;
}

/** Where the company stands against the end of it. */
export function howBadItIs(sim: Simulation): Standing {
  const company = parentCompany(sim.universe);
  if (!company) return { under: false, carried: true, months: 0, left: GRACE_MONTHS, gone: true };
  const months = company.monthsUnder ?? 0;
  return {
    under: isUnder(sim, company),
    carried: familyStillCarries(sim),
    months,
    left: Math.max(0, GRACE_MONTHS - months),
    gone: company.dissolvedAt !== undefined,
  };
}

/**
 * One month's look at the books.
 *
 * Exported so the instrument can run a company into the ground without waiting four
 * months of world time, which is the only way anybody would ever measure this.
 */
export function takeTheMonth(sim: Simulation): Standing {
  const company = parentCompany(sim.universe);
  if (!company || company.dissolvedAt) return howBadItIs(sim);

  if (!isUnder(sim, company) || familyStillCarries(sim)) {
    // Solvent, or still being carried. The clock resets rather than pausing: four
    // bad months with a good one in the middle is a company having a hard year, and
    // a company having a hard year is not a company that failed.
    if ((company.monthsUnder ?? 0) > 0) {
      company.monthsUnder = 0;
      sim.notify({
        category: 'business',
        title: 'Back Above Water',
        body: `${company.name} is solvent again, and the count against it has stopped.`,
        importance: 55,
      });
    }
    return howBadItIs(sim);
  }

  company.monthsUnder = (company.monthsUnder ?? 0) + 1;
  const left = GRACE_MONTHS - company.monthsUnder;

  if (left > 0) {
    sim.notify({
      category: 'business',
      title: left === 1 ? 'One Month Left' : `${left} Months Left`,
      body: `${company.name} is overdrawn and the family's money has a condition on it. `
        + `${left} more month${left === 1 ? '' : 's'} of this and it is wound up.`,
      importance: left === 1 ? 92 : 78,
      route: '/workspace/business',
    });
    return howBadItIs(sim);
  }

  windUp(sim, company);
  return howBadItIs(sim);
}

/**
 * Winds the company up.
 *
 * The one place `dissolvedAt` is written. Everything downstream of it is already
 * built: `parentCompany` stops finding it, `companiesOf` filters it out, the estate
 * screen stops showing it, and every door that asked whether a company existed
 * quietly shuts. No new code had to refuse anything — the guards were all there and
 * had never been reachable.
 */
export function windUp(sim: Simulation, company: Company): void {
  company.dissolvedAt = sim.now;
  sim.notify({
    category: 'business',
    title: 'The Company Is Wound Up',
    body: `${company.legalName} could not pay what it owed and the family would not `
      + 'carry it any further. The slate is gone with it.',
    importance: 100,
  });
}

export function registerRuin(sim: Simulation): void {
  sim.onSchedule(RUIN_KIND, (item, s) => {
    takeTheMonth(s);
    s.schedule({
      at: startOfNextMonth(item.at, s.homeZone),
      kind: RUIN_KIND,
      label: 'The Company’s Month',
      category: 'system',
      priority: 8,
    });
  });
}

/** Arms the monthly look on a save that has none. Idempotent across loads. */
export function armTheBooks(sim: Simulation): void {
  if (sim.timeline.pending().some((one) => one.kind === RUIN_KIND)) return;
  sim.schedule({
    at: startOfNextMonth(sim.now, sim.homeZone),
    kind: RUIN_KIND,
    label: 'The Company’s Month',
    category: 'system',
    priority: 8,
  });
}
