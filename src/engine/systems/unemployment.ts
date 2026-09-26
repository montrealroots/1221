/**
 * SLATE — out of work, and what the state pays for it.
 *
 * Until 2026-09-25 losing a job paid nothing anywhere: three weeks' looking,
 * and nothing coming in. Now each payday's hours and pay are kept on record,
 * as the insurance a country runs keeps them, and somebody out of work can
 * claim what the country pays (`content/unemployment.ts`): worked from that
 * record by the country's own formula, after its waiting days, for as long
 * as it pays, while they're looking, and not at all, or only later, when they
 * quit or were let go for missing shifts, as the law there has it.
 *
 * Only what this save has recorded counts toward qualifying. A character's
 * work before the save began isn't known, so somebody laid off in their
 * first months qualifies only where a new entrant to work would.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { CITIES, jurisdictionPath } from '../content/geography';
import { benefitAt, noBenefitAt, type Benefit, type ClaimContext, type WorkRecord } from '../content/unemployment';
import { exchange } from '../content/currency';
import { payrollYear } from '../content/payroll';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { MS_DAY, type Instant } from '../core/time';
import { netWorth } from './finance';
import { countryAt } from './work';
import type { YearSettled } from './taxreturn';

export const BENEFIT_KIND = 'work.benefit';

export interface EarningsState {
  /** Each payday's hours, gross and the days it covered, oldest first; the last three years. */
  paydays: { at: Instant; days: number; hours: number; gross: Money }[];
  /** How the last job ended, for what a claim can be paid. */
  lastLeft?: { at: Instant; why: 'laidOff' | 'cause' | 'quit'; cityId: string };
  claim?: Claim;
  /** The tax years settled (`systems/taxreturn.ts`), by the settlement's name and the year's first day, and the last one. */
  settled?: string[];
  lastReturn?: YearSettled;
  /** The last top-up for low pay paid (`systems/topup.ts`). */
  topUp?: { name: string; amount: Money; at: Instant };
  /** The weeks the leave and redundancy pay paid out on leaving cover (Australia's income maintenance period). */
  paidOutWeeks?: number;
  /** When each claim after quitting was made, where the law bars a repeat longer (Japan's). */
  quitClaims?: Instant[];
  /** Canada Workers Benefit advances for a year: half the last return's benefit, in the save's money, and what's been paid of it. */
  cwbAdvance?: { forYear: number; total: Money; paid: Money } | undefined;
}

export interface Claim {
  name: string;
  cityId: string;
  /** On the benefit tried where the country's first failed (Britain's Universal Credit). */
  fallback?: boolean;
  /** What it's worked from, in the country's money, and the share of rights, fixed at the claim. */
  basis: number;
  share: number;
  from: Instant;
  /** Payments start here, after the waiting days and any bar. */
  paysFrom: Instant;
  /** The last day it pays; absent where it runs as long as they're out of work. */
  until?: Instant;
  paid: Money;
}

/** Puts a payday's hours and gross, and the days of work it covered, on the record. */
export function recordEarnings(person: Person, at: Instant, days: number, hours: number, gross: Money): void {
  const e = (person.earnings ??= { paydays: [] });
  e.paydays.push({ at, days, hours, gross });
  e.paydays = e.paydays.filter((one) => at - one.at <= 3 * 365 * MS_DAY);
}

/** Why the last job ended, when it ends. */
export function recordLeaving(sim: Simulation, person: Person, why: 'laidOff' | 'cause' | 'quit', cityId: string): void {
  const e = (person.earnings ??= { paydays: [] });
  e.lastLeft = { at: sim.now, why, cityId };
}

/** Working: a job with shifts, not between jobs and not gone. */
function working(person: Person): boolean {
  const job = person.job;
  return job !== undefined && job.lookingUntil === undefined && job.quitAt === undefined;
}

/** The record in the country's money, for a benefit worked there. */
function recordIn(sim: Simulation, person: Person, currency: string): WorkRecord {
  const save = saveCurrency(sim.universe);
  return (person.earnings?.paydays ?? []).map((one) => ({
    at: one.at, days: one.days, hours: one.hours,
    gross: (save === currency ? one.gross : exchange(one.gross, save, currency) ?? one.gross) / 100,
  }));
}

/** The benefit a claim is on: the country's, or the one tried where it failed. */
function benefitOf(cityId: string, fallback: boolean): Benefit | undefined {
  const first = benefitAt(jurisdictionPath(cityId), cityId);
  return fallback ? first?.fallback : first;
}

/** Age in whole years. */
const ageAt = (person: Person, at: Instant) => Math.floor((at - person.birthInstant) / (365.2425 * MS_DAY));

export interface Offer {
  benefit: Benefit;
  fallback: boolean;
  basis: number;
  share: number;
  /** The first week's amount, in the country's money, at today's savings. */
  weekly: number;
  /** Days before it pays: the waiting days, and a bar for quitting or cause, after them or alongside. */
  waitDays: number;
  weeks?: number;
  barWeeks: number;
}

/**
 * What a claim would come to now, or why there's none: the country's
 * benefit, or the one tried where it fails, whether the record qualifies,
 * the bar for how the job ended, the first week's amount and how long it runs.
 */
export function claimFor(sim: Simulation, person: Person): Offer | { refused: string; source?: string } {
  const left = person.earnings?.lastLeft;
  const where = left?.cityId ?? person.job?.cityId ?? person.currentLocationId;
  if (!CITIES.get(where)) return { refused: 'SLATE doesn’t know the law there.' };
  const first = benefitAt(jurisdictionPath(where), where);
  const none = noBenefitAt(jurisdictionPath(where));
  // The source apart from the sentence, as the screen shows every other.
  if (none) return { refused: none.unsized ? `${none.name} pays an unemployment benefit whose amount SLATE couldn’t find.` : `${none.name} has no unemployment benefit.`, source: none.source };
  if (!first) return { refused: 'SLATE has no unemployment benefit on record where you last worked.' };
  const { currency } = countryAt(where);
  const record = recordIn(sim, person, currency);
  const ctx: ClaimContext = { age: ageAt(person, sim.now), at: left?.at ?? sim.now, why: left?.why ?? 'quit' };
  const savings = (() => {
    const save = saveCurrency(sim.universe);
    const cash = netWorth(sim, person.id).cash;
    return (save === currency ? cash : exchange(cash, save, currency) ?? cash) / 100;
  })();
  let refused = '';
  for (const [benefit, fallback] of [[first, false], [first.fallback, true]] as const) {
    if (!benefit) continue;
    const refusal = benefit.qualifies(record, ctx);
    if (refusal) {
      refused ||= refusal;
      continue;
    }
    const priorQuits = (person.earnings?.quitClaims ?? []).filter((at) => benefit.repeatQuit && ctx.at - at <= benefit.repeatQuit.withinYears * 365.25 * MS_DAY).length;
    const bar = ctx.why === 'quit' ? (benefit.repeatQuit && priorQuits >= benefit.repeatQuit.after ? { weeks: benefit.repeatQuit.weeks } : benefit.quit) : ctx.why === 'cause' ? benefit.cause : { weeks: 0 };
    if (bar === 'none') {
      refused ||= ctx.why === 'quit' ? `${benefit.name} isn’t paid to somebody who quit without good cause.` : `${benefit.name} isn’t paid to somebody let go for missing shifts.`;
      continue;
    }
    // A lower rate for quitting pays on a lower basis.
    const basis = benefit.basis(record, ctx) * (bar.rate ?? 1);
    const share = benefit.share?.(record, ctx) ?? 1;
    const full = benefit.weeks?.(record, ctx, basis);
    const cut = full !== undefined && bar.cut ? full * (1 - bar.cut) : full;
    const weeks = bar.forWeeks !== undefined ? Math.min(cut ?? bar.forWeeks, bar.forWeeks) : cut;
    if (weeks !== undefined && weeks <= 0) {
      refused ||= `Your record doesn’t reach a week of ${benefit.name}.`;
      continue;
    }
    const weekly = benefit.amount(basis, 1, { age: ctx.age, savings, share });
    // Weeks already served of what was paid out on leaving (Australia's income maintenance period).
    const sinceLeft = left ? (sim.now - left.at) / (7 * MS_DAY) : 0;
    const waiting = benefit.wait ? benefit.wait({ savings, paidOutWeeks: Math.max(0, (person.earnings?.paidOutWeeks ?? 0) - sinceLeft) }) : benefit.waitingDays;
    const waitDays = benefit.concurrentBar ? Math.max(waiting, bar.weeks * 7) : waiting + bar.weeks * 7;
    return { benefit, fallback, basis, share, weekly, waitDays, ...(weeks !== undefined ? { weeks } : {}), barWeeks: bar.weeks };
  }
  return { refused };
}

function scheduleBenefit(sim: Simulation, person: Person, at: Instant): void {
  sim.schedule({ at, kind: BENEFIT_KIND, label: 'Benefit Payment', category: 'work', priority: 42, payload: { personId: person.id } });
}

export function registerUnemployment(sim: Simulation): void {
  // Claiming: somebody out of work whose record qualifies. It starts the
  // looking where they weren't, since every country pays only somebody
  // available for work and looking for it.
  sim.onCommand<Record<string, never>, { name: string; paysFrom: Instant; weekly: Money; until?: Instant }>('work.claim', (_p, { sim: s }) => {
    const person = s.player;
    if (working(person)) throw new CommandError('You’re in work; the benefit is for somebody out of it.');
    if (person.earnings?.claim) throw new CommandError(`You’re already claiming ${person.earnings.claim.name}.`);
    const found = claimFor(s, person);
    if ('refused' in found) throw new CommandError(found.refused);
    if (!person.job) s.must({ kind: 'work.find_job', payload: {} });
    const { benefit, fallback, basis, share, weekly, weeks, waitDays } = found;
    const where = person.earnings?.lastLeft?.cityId ?? person.job!.cityId;
    const paysFrom = s.now + waitDays * MS_DAY;
    const claim: Claim = {
      name: benefit.name, cityId: where, basis, share, from: s.now, paysFrom, paid: 0,
      ...(fallback ? { fallback: true } : {}),
      ...(weeks !== undefined ? { until: paysFrom + weeks * 7 * MS_DAY } : {}),
    };
    (person.earnings ??= { paydays: [] }).claim = claim;
    if (person.earnings.lastLeft?.why === 'quit' && benefit.repeatQuit) person.earnings.quitClaims = [...(person.earnings.quitClaims ?? []), s.now];
    scheduleBenefit(s, person, paysFrom + benefit.every * MS_DAY);
    const save = saveCurrency(s.universe);
    const { currency } = countryAt(where);
    const inSave = exchange(Math.round(weekly * 100), currency, save) ?? Math.round(weekly * 100);
    return { name: benefit.name, paysFrom, weekly: inSave, ...(claim.until !== undefined ? { until: claim.until } : {}) };
  });

  // A payment: the days since the last, at what the week pays that far into
  // the claim, after any means test on what's in the bank; and the claim
  // ends when they're back in work or it has run its time.
  sim.onSchedule(BENEFIT_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId ?? s.universe.playerId)];
    const claim = person?.earnings?.claim;
    if (!person || !claim) return;
    const benefit = benefitOf(claim.cityId, claim.fallback === true);
    if (!benefit) return;
    const save = saveCurrency(s.universe);
    const end = (why: string) => {
      delete person.earnings!.claim;
      s.notify({ category: 'work', title: `${claim.name} Ended`, body: why, importance: 55 });
    };
    // Paid in arrears: back in work, the days out of it up to the new start
    // are still owed, and this is the last payment.
    const back = working(person) ? person.job!.since : undefined;
    const upTo = Math.min(item.at, claim.until ?? Number.POSITIVE_INFINITY, back ?? Number.POSITIVE_INFINITY);
    const from = Math.max(claim.paysFrom, item.at - benefit.every * MS_DAY);
    const days = Math.max(0, (upTo - from) / MS_DAY);
    const week = Math.floor((from - claim.paysFrom) / (7 * MS_DAY)) + 1;
    const { currency } = countryAt(claim.cityId);
    const cash = netWorth(s, person.id).cash;
    const savings = (save === currency ? cash : exchange(cash, save, currency) ?? cash) / 100;
    const weekly = benefit.amount(claim.basis, week, { age: ageAt(person, s.now), savings, share: claim.share });
    const local = Math.round(weekly * (days / 7) * 100);
    const amount = save === currency ? local : exchange(local, currency, save) ?? local;
    if (amount > 0 && person.primaryAccountId) {
      // Tax taken as it's paid where the law takes it, at what the benefit over a year would bear; the return settles it.
      const iso = countryAt(claim.cityId).iso;
      const yearly = Math.round(weekly * 52 * 100);
      const taxShare = benefit.withheld && yearly > 0
        ? payrollYear(iso, yearly, { path: jurisdictionPath(claim.cityId), cityId: claim.cityId, at: s.now, age: ageAt(person, s.now) }).lines.filter((one) => one.kind === 'tax').reduce((sum, one) => sum + one.amount, 0) / yearly
        : 0;
      const tax = Math.round(amount * Math.min(1, Math.max(0, taxShare)));
      s.post({
        memo: claim.name, category: 'benefit',
        postings: [
          { accountId: s.nominalAccount('income', 'Unemployment Benefit').id, amount: -amount },
          { accountId: person.primaryAccountId, amount: amount - tax },
          ...(tax > 0 ? [{ accountId: s.nominalAccount('expense', 'Tax Withheld').id, amount: tax }] : []),
        ],
      });
      claim.paid += amount;
    }
    if (back !== undefined) {
      end(`You’re back in work, so ${claim.name} stops. ${formatMoney(claim.paid, save)} was paid in all.`);
      return;
    }
    if (claim.until !== undefined && item.at >= claim.until) {
      end(`${claim.name} has run its time. ${formatMoney(claim.paid, save)} was paid in all.`);
      return;
    }
    scheduleBenefit(s, person, item.at + benefit.every * MS_DAY);
  });
}
