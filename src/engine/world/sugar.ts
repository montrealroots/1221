/**
 * SLATE — the sugar year, and the one line in Washington that decides it.
 *
 * The family's money is in cane. Cane sells into America through a quota that
 * is set fresh every July, and in July 2025 it was set to nothing. That is
 * real, dated and already true when the save opens, which is why it is seeded
 * rather than waited for.
 *
 * What happens after is not knowable and the game does not pretend to model
 * the politics of it. It models the one thing that is reliably true about
 * policy, which is that last year's answer is the best guess at this year's,
 * and then lets it drift. A shut year is more likely to be followed by another
 * shut year than by an open one, and a run of them is a different world from a
 * single bad summer.
 *
 * The reason any of this is in a game about an actor: it is what the family
 * has to spend. A quota year that goes badly is a year the sugar has less to
 * put into a studio lot standing half empty in Mosfellsbær, and the player
 * finds out the way anybody finds out about their parents' business, which is
 * secondhand and late.
 */

import type { Simulation } from '../core/simulation';
import type { Id, QuotaYear } from '../domain/model';
import type { Money } from '../core/money';
import type { Instant } from '../core/time';
import { instantFromZoned, zonedParts } from '../core/time';
import {
  GROUP, GROUP_PROFIT_CENTS, QUOTA, THE_TARIFF, profitAfterQuota,
} from '../content/sugar';

export const QUOTA_KIND = 'sugar.quota';

/** Every year's answer, oldest first. */
export function quotaYears(sim: Simulation): QuotaYear[] {
  return [...sim.universe.quotaYears].sort((a, b) => a.fiscalYear - b.fiscalYear);
}

/** The answer governing right now, which is the most recent one decided. */
export function quotaNow(sim: Simulation): QuotaYear | undefined {
  const decided = quotaYears(sim).filter((y) => y.decidedAt <= sim.now);
  return decided[decided.length - 1];
}

/** What the group actually clears this year, after what America did. */
export function profitThisYear(sim: Simulation): Money {
  const year = quotaNow(sim);
  return year ? profitAfterQuota(GROUP_PROFIT_CENTS, year.tonnes) : GROUP_PROFIT_CENTS;
}

/** How many shut years in a row, counting back from now. */
export function shutYearsRunning(sim: Simulation): number {
  let run = 0;
  for (const year of quotaYears(sim).filter((y) => y.decidedAt <= sim.now).reverse()) {
    if (year.tonnes > 0) break;
    run += 1;
  }
  return run;
}

/**
 * What America decides for a fiscal year.
 *
 * Three things move it and all three are things about the world rather than a
 * roll dressed up. What it did last year, because policy is sticky and that is
 * the honest majority of the answer. How long it has been shut, because a run
 * builds pressure to reopen. And a draw, because it is a political decision
 * and pretending otherwise would be worse than admitting the game does not
 * know.
 */
export function decideQuota(was: number | undefined, shutRunning: number, roll: number): { tonnes: number; because: string } {
  // The first year in the save is not decided, it is remembered.
  if (was === undefined) {
    return { tonnes: QUOTA.firstYearTonnes, because: THE_TARIFF.what };
  }
  const wasShut = was === 0;
  // Sticky, and stickier the more recently it changed. A run of shut years
  // pushes back the other way.
  const reopen = wasShut ? 0.18 + shutRunning * 0.14 : 0.86;
  if (roll < reopen) {
    const tonnes = Math.round(QUOTA.ordinaryTonnes * (0.6 + roll * 0.5));
    return {
      tonnes,
      because: wasShut
        ? `Open again after ${shutRunning === 1 ? 'a year' : `${shutRunning} years`} shut.`
        : 'Held open, at about the usual.',
    };
  }
  return {
    tonnes: 0,
    because: wasShut ? 'Shut again, with no additional quota at all.' : 'Shut, for the first time in years.',
  };
}

/** Midnight on the announcement day in a given year, in the estate's zone. */
function announcementIn(year: number, zone: string): Instant {
  return instantFromZoned({ year, month: QUOTA.announcedInMonth, day: 14, hour: 9, minute: 0 }, zone);
}

/**
 * Puts the years that already happened into a new save, and arms the next one.
 *
 * The 2026 answer is not simulated. It happened, it is on the record, and a
 * game that rolled for it would be inventing a fact it could have looked up.
 */
export function seedTheQuota(sim: Simulation): void {
  if (sim.universe.quotaYears.length > 0) return;
  const zone = sim.homeZone;
  sim.universe.quotaYears.push({
    fiscalYear: QUOTA.firstYear,
    tonnes: QUOTA.firstYearTonnes,
    decidedAt: announcementIn(THE_TARIFF.announced.year, zone),
    because: THE_TARIFF.what,
  });
}

export function registerSugar(sim: Simulation): void {
  sim.onSchedule(QUOTA_KIND, () => {
    const zone = sim.homeZone;
    const fiscalYear = zonedParts(sim.now, zone).year + 1;
    const was = quotaNow(sim);
    const roll = sim.rng('sugar', 'quota', String(fiscalYear)).next();
    const answer = decideQuota(was?.tonnes, shutYearsRunning(sim), roll);

    sim.universe.quotaYears.push({
      fiscalYear,
      tonnes: answer.tonnes,
      decidedAt: sim.now,
      because: answer.because,
    });

    const before = profitAfterQuota(GROUP_PROFIT_CENTS, was?.tonnes ?? QUOTA.ordinaryTonnes);
    const after = profitAfterQuota(GROUP_PROFIT_CENTS, answer.tonnes);
    const moved = after - before;
    sim.notify({
      category: 'business',
      // Said as somebody would hear it: the family's business, not a policy.
      title: answer.tonnes === 0 ? 'America Stays Shut To The Sugar' : 'America Opens Again',
      body: `${answer.because} ${GROUP.name} clears about ${euros(after)} this year`
        + `${moved === 0 ? '.' : `, ${moved > 0 ? 'up' : 'down'} ${euros(Math.abs(moved))} on last.`}`,
      importance: answer.tonnes === 0 ? 60 : 40,
    });

    sim.schedule({
      at: announcementIn(zonedParts(sim.now, zone).year + 1, zone),
      kind: QUOTA_KIND,
      label: 'The Sugar Quota',
      category: 'system',
      priority: 5,
    });
  });

  if (!sim.universe.scheduled.some((i) => i.kind === QUOTA_KIND && i.status === 'pending')) {
    const zone = sim.homeZone;
    const here = zonedParts(sim.now, zone);
    // This July if it has not passed, next July if it has.
    const next = here.month < QUOTA.announcedInMonth ? here.year : here.year + 1;
    sim.schedule({
      at: announcementIn(next, zone),
      kind: QUOTA_KIND,
      label: 'The Sugar Quota',
      category: 'system',
      priority: 5,
    });
  }
}

const euros = (cents: Money): string => {
  const m = cents / 100 / 1_000_000;
  return `€${m >= 100 ? Math.round(m) : m.toFixed(1)}m`;
};

/** Where the sugar stands, in a sentence. */
export function whereTheSugarStands(sim: Simulation): string {
  const year = quotaNow(sim);
  if (!year) return `${GROUP.name} has had no word from America either way.`;
  const run = shutYearsRunning(sim);
  if (year.tonnes === 0) {
    return `America has been shut to it ${run === 1 ? 'since last summer' : `${run} years running`}, `
      + `so ${GROUP.name} is clearing about ${euros(profitThisYear(sim))} rather than ${euros(GROUP_PROFIT_CENTS)}.`;
  }
  return `America is open to it again, and ${GROUP.name} is clearing about ${euros(profitThisYear(sim))}.`;
}

/** The people in the group, for anything that needs to name one. */
export function chairOf(sim: Simulation, groupId: Id): Id | undefined {
  return Object.values(sim.universe.posts).find((p) => p.companyId === groupId)?.personId;
}
