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
import { CURRENCY_SYMBOL, type Money } from '../core/money';
import type { Instant } from '../core/time';
import { instantFromZoned, zonedParts } from '../core/time';
import {
  A_PARENT_A_MONTH_CENTS, COST_OF_GOODS_A_DAY_CENTS, GROUP, GROUP_PROFIT_CENTS,
  A_YEAR_OF_DAYS, KEPT_IN_HAND_CENTS, PAID_IN_MEMO, PAYROLL_A_DAY_CENTS, QUOTA, THE_TARIFF,
  profitAfterQuota,
} from '../content/sugar';
import { parentCompany, theSugarGroup } from './company';
import { familyCoversToday, startOfNextMonth } from './lot';

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
  // A day of trading, every day, for as long as the save runs.
  sim.onSchedule(SUGAR_DAY_KIND, () => {
    aDayOfSugar(sim);
    // And the pictures are covered the same day rather than at month end.
    //
    // The cover used to arrive with the lot's monthly charge, so a slate that
    // spent its way under on the second of the month stayed under for four
    // weeks — measured at minus nine point nine million at its worst across
    // twenty-five played years. A family that owns a billion-euro sugar
    // business does not let the film company sit overdrawn for a month; the
    // money is there and the only thing that was missing was a tick to move it
    // on. Daily is the granularity the owner asked for and the granularity a
    // treasury actually works at.
    const company = parentCompany(sim.universe);
    const account = company && Object.values(sim.universe.accounts)
      .find((one) => one.ownerId === company.id && one.kind === 'company_cash' && !one.closedAt);
    if (account) familyCoversToday(sim, account.id);
    sim.schedule({
      at: sim.now + 24 * 60 * 60 * 1000,
      kind: SUGAR_DAY_KIND,
      label: 'A Day In The Cane',
      category: 'system',
      priority: 99,
    });
  });

  // And the board draws once a month.
  sim.onSchedule(SUGAR_PAYDAY_KIND, () => {
    payTheBoard(sim);
    sim.schedule({
      at: startOfNextMonth(sim.now, sim.homeZone),
      kind: SUGAR_PAYDAY_KIND,
      label: 'The Board Draws',
      category: 'system',
      priority: 9,
    });
  });

  if (!sim.universe.scheduled.some((i) => i.kind === SUGAR_DAY_KIND && i.status === 'pending')) {
    sim.schedule({
      at: sim.now + 24 * 60 * 60 * 1000,
      kind: SUGAR_DAY_KIND,
      label: 'A Day In The Cane',
      category: 'system',
      priority: 99,
    });
  }
  if (!sim.universe.scheduled.some((i) => i.kind === SUGAR_PAYDAY_KIND && i.status === 'pending')) {
    sim.schedule({
      at: startOfNextMonth(sim.now, sim.homeZone),
      kind: SUGAR_PAYDAY_KIND,
      label: 'The Board Draws',
      category: 'system',
      priority: 9,
    });
  }

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
  return `${CURRENCY_SYMBOL}${m >= 100 ? Math.round(m) : m.toFixed(1)}m`;
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

// ---------------------------------------------------------------------------
// The group as a business that actually trades
// ---------------------------------------------------------------------------

export const SUGAR_DAY_KIND = 'sugar.day';
export const SUGAR_PAYDAY_KIND = 'sugar.payday';

/** What the group sells under, so `profitThisYear`'s figure has a ledger behind it. */
export const SALES_MEMO = `${GROUP.name}: Sugar Sold`;
export const PAYROLL_MEMO = `${GROUP.name}: Wages`;
export const GOODS_MEMO = `${GROUP.name}: Cane, Milling And Freight`;
export const BOARD_MEMO = `${GROUP.name}: Directors`;
// What it sends the pictures goes out under `PAID_IN_MEMO`, not under a memo of
// its own: that memo is what the lot's patience is counted from, and a second
// name for the same money is a posting nobody reads.

/** The group's cash account, opened on demand so an older save gains one. */
export function sugarAccount(sim: Simulation): Id | undefined {
  const group = theSugarGroup(sim);
  if (!group) return undefined;
  const found = Object.values(sim.universe.accounts)
    .find((one) => one.ownerId === group.id && one.kind === 'company_cash' && !one.closedAt);
  if (found) return found.id;
  return sim.openAccount({
    id: sim.nextId('account'),
    kind: 'company_cash',
    name: `${GROUP.name} Operating`,
    ownerId: group.id,
    institution: 'Landsbankinn',
    openedAt: sim.now,
    balance: 0,
  }).id;
}

/**
 * A day of the sugar business, as transactions rather than as a figure.
 *
 * `GROUP_PROFIT_CENTS` has always said the group clears about a hundred and
 * fifty-four million a year, and for a long time that number had no ledger
 * behind it: the group owned no account, earned nothing, paid nobody, and the
 * figure existed only to size how much of the lot's losses the family would
 * tolerate. A business whose entire existence is one constant read by a
 * patience calculation is the thing this project has a page about.
 *
 * So it trades. Every day it sells, pays its people and pays for its cane, and
 * the profit is what is left rather than what was declared — which is the
 * ledger's own law: a balance is never a number somebody typed.
 *
 * The three lines are posted separately on purpose. One net line would hide
 * the payroll, and the payroll is the part with three thousand one hundred
 * people on the end of it.
 */
export function aDayOfSugar(sim: Simulation): Money {
  const account = sugarAccount(sim);
  if (!account) return 0;
  const quota = quotaNow(sim);
  // The costs are the costs: three thousand one hundred people are paid and the
  // cane is bought whatever Washington did.
  const costs = PAYROLL_A_DAY_CENTS + COST_OF_GOODS_A_DAY_CENTS;
  // And what America decides moves the PROFIT, not whether the group trades.
  //
  // The first version of this scaled the day's sales by the quota, so a shut
  // year sold nothing at all while still paying the wages and buying the cane —
  // a one-point-two-million-a-day bleed that took the group's own account to
  // minus thirty-two million and left it unable to fund anything. Measured, and
  // wrong: the quota is one market's door, and this group sells into Europe and
  // America both. `profitAfterQuota` already says what a shut year costs, so
  // that figure is the day's profit and the sales are whatever produces it.
  const aYear = profitAfterQuota(GROUP_PROFIT_CENTS, quota?.tonnes ?? QUOTA.ordinaryTonnes);
  const profit = Math.round(aYear / A_YEAR_OF_DAYS);
  const sold = costs + profit;
  sim.income(account, sold, SALES_MEMO, 'business');
  sim.expense(account, PAYROLL_A_DAY_CENTS, PAYROLL_MEMO, 'business');
  sim.expense(account, COST_OF_GOODS_A_DAY_CENTS, GOODS_MEMO, 'business');
  return profit;
}

/** An account for somebody who did not have one, so a wage can land in it. */
function purseFor(sim: Simulation, personId: Id): Id | undefined {
  const person = sim.universe.people[personId];
  if (!person) return undefined;
  if (person.primaryAccountId && sim.universe.accounts[person.primaryAccountId]) {
    return person.primaryAccountId;
  }
  const opened = sim.openAccount({
    id: sim.nextId('account'),
    kind: 'checking',
    name: `${person.displayName || person.firstName} Checking`,
    ownerId: person.id,
    institution: 'Landsbankinn',
    openedAt: sim.now,
    balance: 0,
  });
  person.primaryAccountId = opened.id;
  return opened.id;
}

/**
 * The parents draw from the group, monthly.
 *
 * Both of them, by name, into accounts of their own — which they did not have
 * until this, because the family generator wrote people and gave nobody a
 * purse. "The parents are paid" was a sentence about a business nobody could
 * open the books of; now there is a transaction with a person on the end.
 */
export function payTheBoard(sim: Simulation): Money {
  const account = sugarAccount(sim);
  if (!account) return 0;
  const player = sim.universe.people[sim.universe.playerId];
  const parents = (player?.relations ?? [])
    .filter((one) => one.kind === 'mother' || one.kind === 'father')
    .map((one) => one.toId);
  let paid = 0;
  for (const id of parents) {
    const purse = purseFor(sim, id);
    if (!purse) continue;
    sim.transfer(account, purse, A_PARENT_A_MONTH_CENTS, BOARD_MEMO, 'business');
    paid += A_PARENT_A_MONTH_CENTS;
  }
  return paid;
}

/**
 * The sugar pays for the pictures, which is the whole point of the family
 * owning both.
 *
 * `familyCovers` used to do this and it was a fiction with a number in it: when
 * the pictures company went under, money appeared in its account rounded up to
 * the nearest hundred thousand, from nowhere, posted against a nominal. Nothing
 * was ever debited, because the thing doing the paying had no account to debit.
 * The family's willingness was real and the family's money was not.
 *
 * It is a transfer now, out of an account that had to earn what it sends. The
 * consequence is the one the owner asked for and it is worth stating plainly:
 * **the pictures company cannot run out of money while the sugar is trading.**
 * A slate that overspends is carried by a cane business turning over one point
 * four billion a year, which is what that business is for.
 *
 * What it cannot do is empty the group. `KEPT_IN_HAND_CENTS` is a fortnight of
 * the worldwide payroll, and nothing goes to the pictures until the wages are
 * safe — so the one thing that can still stop the money is the sugar business
 * itself being in trouble, which is a real constraint rather than a decorative
 * one and is reachable through the American quota.
 *
 * `step` is how round the money is, and it is the whole difference between the
 * two clocks that call this. The month wires a round hundred thousand, which is
 * what a family actually sends and what this code has always done; the leftover
 * above the overdraft is the film company's working cash. The day sends the
 * overdraft to the cent and not a króna more.
 *
 * That split is load-bearing in both directions and it was found the hard way.
 * Cover to the cent on both clocks and the company sits at a balance of nought
 * forever — under `GREENLIGHT_FLOOR`, a blocker on the greenlight door — so
 * nothing is ever greenlit, nothing is shot and nobody is hired; `crew.test.ts`
 * caught that by making three pictures and asking who came back to work on
 * them, and the answer was nobody. Wire a round hundred thousand on both and
 * the opposite breaks: a picture that empties the company is topped back up
 * within the day, the greenlight door never shuts on money again, and
 * `making.test.ts` caught that one.
 *
 * So the day keeps the company out of the red and the month is when the family
 * decides to fund it. Which is what the two clocks are: being carried inside a
 * month is treasury, and being given money to spend is a decision somebody
 * makes once a month and can stop making.
 */
export function sugarCoversThePictures(sim: Simulation, accountId: Id, step: Money = 1): Money {
  const account = sim.universe.accounts[accountId];
  if (!account || account.balance >= 0) return 0;
  const from = sugarAccount(sim);
  if (from === undefined || from === accountId) return 0;
  const held = sim.universe.accounts[from]?.balance ?? 0;
  const spare = held - KEPT_IN_HAND_CENTS;
  if (spare <= 0) return 0;
  const short = Math.ceil(-account.balance / step) * step;
  const sent = Math.min(short, spare);
  if (sent <= 0) return 0;
  sim.transfer(from, accountId, sent, PAID_IN_MEMO, 'business');
  return sent;
}
