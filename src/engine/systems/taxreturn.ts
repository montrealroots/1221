/**
 * SLATE — the income tax return (`content/safetynet.ts` `RETURN`).
 *
 * Each February a year's return is ready for anybody the year left owing or
 * owed: its income (acting wages with residuals, work-study, unemployment),
 * less the performing artist deduction where the year qualifies; the tax on
 * it where they last lived, with California leaving unemployment out, and
 * payroll tax on the acting wages; the premium tax credit on the marketplace
 * months; California's penalty on the months without cover; and against it
 * all, what was withheld. Filed, a balance is paid from the bank, or owed
 * until it is; a refund arrives 21 days on. Filed after 15 April's deadline
 * with a balance, the late penalties are added. Until 2026-09-27 what was
 * withheld from a paycheck was kept by nothing.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { MS_DAY, formatDate, instantFromZoned, zonedParts, type Instant } from '../core/time';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { computeAnnualTax } from '../content/tax';
import { CALIFORNIA_MANDATE, PREMIUM_CREDIT, RETURN } from '../content/safetynet';
import { yearOf } from './earnings';
import { payFromCurrent } from './household';

export const TAX_SEASON_KIND = 'tax.season';
export const TAX_DUE_KIND = 'tax.due';
export const TAX_REFUND_KIND = 'tax.refund';

const HOME = 'America/New_York';
const usd = (cents: Money, into: string) => (into === 'USD' ? cents : exchange(cents, 'USD', into) ?? cents);

export interface TaxReturn {
  year: number;
  due: Instant;
  figures: ReturnFigures;
  filedAt?: Instant;
  penalty?: Money;
  /** What's still owed after filing, if the bank couldn't pay it. */
  owed?: Money;
  refund?: Money;
  refundAt?: Instant;
}

export interface ReturnFigures {
  cityId: string;
  acting: Money;
  workStudy: Money;
  unemployment: Money;
  income: Money;
  deduction: Money;
  incomeTax: Money;
  payroll: Money;
  credit: Money;
  mandate: Money;
  withheld: Money;
  /** Positive owed, negative due back. */
  balance: Money;
}

export function returnsOf(person: Person): Record<string, TaxReturn> {
  person.returns ??= {};
  return person.returns;
}

/** A year's deadline: 15 April, or the next business day, with Emancipation Day observed. */
export function deadline(year: number): Instant {
  const filing = year + 1;
  const dow = (d: number) => new Date(Date.UTC(filing, 3, d)).getUTCDay();
  const emancipation = dow(16) === 6 ? 15 : dow(16) === 0 ? 17 : 16;
  let day = 15;
  while (dow(day) === 0 || dow(day) === 6 || day === emancipation) day += 1;
  return instantFromZoned({ year: filing, month: 4, day, hour: 23, minute: 59 }, HOME);
}

/** The applicable percentage of income at a share of the poverty line, in a year (later years hold). */
export function applicablePercent(year: number, ratio: number): number | undefined {
  // Over 400% of the poverty line there's none: the last band ends there.
  if (ratio < 1) return undefined;
  const bands = PREMIUM_CREDIT.bands[Math.min(2027, Math.max(2026, year))]!;
  let low = 1;
  for (const [upTo, from, to] of bands) {
    if (ratio <= upTo) return from + ((to - from) * (ratio - low)) / (upTo - low);
    low = upTo;
  }
  return undefined;
}

/** A year's return, worked out. */
export function figuresFor(person: Person, year: number, into = 'USD'): ReturnFigures {
  const y = yearOf(person, year);
  const cityId = y.residence ?? person.currentLocationId;
  const at = instantFromZoned({ year, month: 12, day: 31, hour: 12 }, HOME);
  const income = y.acting + y.workStudy + y.unemployment;
  const employers = Object.values(y.employers).filter((pay) => pay >= usd(RETURN.performingArtistEmployerPay, into)).length;
  const expenses = y.commission + y.dues;
  const performer = income <= usd(RETURN.performingArtistIncome, into) && employers >= RETURN.performingArtistEmployers && expenses > RETURN.performingArtistShare * y.acting;
  const deduction = performer ? expenses : 0;
  const taxed = Math.max(0, income - deduction);
  const all = computeAnnualTax(taxed, cityId, at);
  const california = CITIES.get(cityId)?.parentId === 'us-ca';
  const regional = california && y.unemployment > 0 ? computeAnnualTax(Math.max(0, taxed - y.unemployment), cityId, at).regional : all.regional;
  const incomeTax = all.federal + regional + all.local;
  // Payroll tax is on the acting wages alone: a student's work-study and a benefit carry none.
  const payroll = computeAnnualTax(y.acting, cityId, at).payroll;
  const premiums = person.health?.premiums[year] ?? [];
  const pct = applicablePercent(year, income / usd(PREMIUM_CREDIT.povertyLine, into));
  const credit = pct === undefined ? 0 : premiums.reduce((sum, premium) => sum + Math.max(0, Math.round(premium - (pct * income) / 12)), 0);
  const months = person.health?.uncoveredInCalifornia[year] ?? 0;
  const mandate = months * Math.round(Math.min(usd(CALIFORNIA_MANDATE.bronzeMonth, into), Math.max(usd(CALIFORNIA_MANDATE.flat, into), CALIFORNIA_MANDATE.share * income) / 12));
  return {
    cityId, acting: y.acting, workStudy: y.workStudy, unemployment: y.unemployment, income, deduction,
    incomeTax, payroll, credit, mandate, withheld: y.withheld,
    balance: incomeTax + payroll + mandate - y.withheld - credit,
  };
}

/** The late penalties on a balance filed at a moment: 4.5% a month or part for filing and 0.5% for paying, each to 25%, and the minimum past 60 days. */
export function latePenalty(balance: Money, due: Instant, filedAt: Instant, into = 'USD'): Money {
  if (balance <= 0 || filedAt <= due) return 0;
  const months = Math.ceil((filedAt - due) / (30.4375 * MS_DAY));
  const payLate = Math.min(RETURN.lateCap, RETURN.payLateMonthly * months) * balance;
  let fileLate = Math.min(RETURN.lateCap - Math.min(RETURN.lateCap, RETURN.payLateMonthly * months), (RETURN.lateMonthly - RETURN.payLateMonthly) * months) * balance;
  if (filedAt - due > RETURN.lateMinimumAfterDays * MS_DAY) fileLate = Math.max(fileLate, Math.min(usd(RETURN.lateMinimum, into), balance));
  return Math.round(payLate + fileLate);
}

/** Each February, from the one after the business began. */
export function armTaxes(sim: Simulation, person: Person): void {
  if (sim.universe.scheduled.some((i) => i.kind === TAX_SEASON_KIND && i.status === 'pending' && i.payload.personId === person.id)) return;
  const p = zonedParts(sim.now, HOME);
  const next = instantFromZoned({ year: p.month >= 2 ? p.year + 1 : p.year, month: 2, day: 1, hour: 9 }, HOME);
  sim.schedule({ at: next, kind: TAX_SEASON_KIND, label: 'Tax Season', category: 'system', priority: 7, payload: { personId: person.id } });
}

export function registerTaxReturn(sim: Simulation): void {
  sim.onSchedule(TAX_SEASON_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    if (!person) return;
    const p = zonedParts(item.at, HOME);
    s.schedule({ at: instantFromZoned({ year: p.year + 1, month: 2, day: 1, hour: 9 }, HOME), kind: TAX_SEASON_KIND, label: 'Tax Season', category: 'system', priority: 7, payload: { personId: person.id } });
    const year = p.year - 1;
    const cur = saveCurrency(s.universe);
    const figures = figuresFor(person, year, cur);
    // Nothing owed and nothing due back: no return to file.
    if (figures.balance === 0 && figures.income === 0) return;
    const due = deadline(year);
    returnsOf(person)[year] = { year, due, figures };
    s.schedule({ at: due, kind: TAX_DUE_KIND, label: `Tax Return Due: ${year}`, category: 'personal', priority: 25, payload: { personId: person.id, year } });
    if (person.id !== s.universe.playerId) return;
    s.requireDecision({
      urgency: 70, category: 'taxes', title: `Your ${year} Tax Return`,
      detail: `${figures.balance > 0 ? `You owe ${formatMoney(figures.balance, cur)}` : `${formatMoney(-figures.balance, cur)} comes back to you`} on ${formatMoney(figures.income, cur)} of income. File by ${formatDate(due, HOME)}.`,
      route: '/workspace/papers', dueAt: due, refType: 'return', refId: String(year),
      actions: [{ label: 'File It', commandKind: 'tax.file', payload: { year } }],
    });
  });

  sim.onSchedule(TAX_DUE_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const r = person ? returnsOf(person)[String(item.payload.year)] : undefined;
    if (!person || !r || r.filedAt !== undefined || person.id !== s.universe.playerId) return;
    s.notify({ category: 'money', title: `Your ${r.year} Return Is Late`, body: r.figures.balance > 0 ? 'Each month late adds 5% of what you owe, to a quarter of it; past 60 days, at least $525.' : 'A refund waits for the return; there’s no penalty on one.', importance: 80, route: '/workspace/papers' });
  });

  sim.onSchedule(TAX_REFUND_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const r = person ? returnsOf(person)[String(item.payload.year)] : undefined;
    const account = person?.primaryAccountId ? s.universe.accounts[person.primaryAccountId] : undefined;
    if (!person || !r?.refund || !account || account.closedAt) return;
    s.post({ memo: `Tax refund, ${r.year}`, category: 'tax', postings: [{ accountId: account.id, amount: r.refund }, { accountId: s.nominalAccount('income', 'Tax Refund').id, amount: -r.refund }] });
  });

  sim.onCommand<{ year: number }, { balance: Money; penalty: Money; paid: boolean }>('tax.file', (p, { sim: s }) => {
    const person = s.player;
    const r = returnsOf(person)[String(p.year)];
    if (!r) throw new CommandError('There’s no return for that year.');
    if (r.filedAt !== undefined) throw new CommandError('You’ve filed it.');
    const cur = saveCurrency(s.universe);
    r.figures = figuresFor(person, r.year, cur);
    r.filedAt = s.now;
    r.penalty = latePenalty(r.figures.balance, r.due, s.now, cur);
    for (const d of Object.values(s.universe.decisions)) if (d.refType === 'return' && d.refId === String(r.year) && !d.resolvedAt) d.resolvedAt = s.now;
    if (r.figures.balance < 0) {
      r.refund = -r.figures.balance;
      r.refundAt = s.now + RETURN.refundDays * MS_DAY;
      s.schedule({ at: r.refundAt, kind: TAX_REFUND_KIND, label: `Tax Refund: ${r.year}`, category: 'system', priority: 20, payload: { personId: person.id, year: r.year } });
      return { balance: r.figures.balance, penalty: 0, paid: true };
    }
    const total = r.figures.balance + r.penalty;
    const paid = total <= 0 || payFromCurrent(s, person, total, `Income tax, ${r.year}${r.penalty ? ', with late penalties' : ''}`, 'tax');
    if (!paid) r.owed = total;
    return { balance: r.figures.balance, penalty: r.penalty, paid };
  });

  sim.onCommand<{ year: number }, { paid: Money }>('tax.pay', (p, { sim: s }) => {
    const person = s.player;
    const r = returnsOf(person)[String(p.year)];
    if (!r?.owed) throw new CommandError('That year is paid.');
    // Paying late costs 0.5% a month or part from filing.
    const months = Math.ceil((s.now - (r.filedAt ?? s.now)) / (30.4375 * MS_DAY));
    const total = Math.round(r.owed * (1 + Math.min(RETURN.lateCap, RETURN.payLateMonthly * months)));
    if (!payFromCurrent(s, person, total, `Income tax owed, ${r.year}`, 'tax')) throw new CommandError(`${formatMoney(total, saveCurrency(s.universe))} is more than the bank can cover.`);
    delete r.owed;
    return { paid: total };
  });
}
