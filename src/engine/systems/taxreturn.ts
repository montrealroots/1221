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
import { computeAnnualTax } from '../content/tax';
import { ABROAD, CALIFORNIA_MANDATE, CONNECTICUT, STATE_DEDUCTIONS, POVERTY_LINE, PREMIUM_CREDIT, PUBLIC_COVER, RETURN, STATE_RETURN, byYear } from '../content/safetynet';
import { stateOf, yearOf } from './earnings';
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
  /** Of it, the federal tax, and each state's and town's, with the credit a home state gives for another's. */
  federal: Money;
  /** The US credit for another country's tax, and what Canada gives back under its treaty threshold. */
  foreignCredit: Money;
  foreignRefund: Money;
  states: { state: string; tax: Money; credit: Money }[];
  local: Money;
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

/**
 * Connecticut's tax on a year's income (`CONNECTICUT`): nothing at $15,000
 * or less; else the exemption, the rates, the add-back past $56,500, and the
 * personal credit's share off.
 */
export function connecticutTax(income: Money, into = 'USD'): Money {
  const $ = (c: Money) => usd(c, into);
  const c = CONNECTICUT;
  // Nothing at $15,000 or less: the exemption covers it all.
  const over = Math.max(0, income - $(c.exemptionFrom));
  const exemption = Math.max(0, $(c.exemption) - Math.ceil(over / $(1_000_00)) * $(1_000_00));
  const taxable = Math.max(0, income - exemption);
  let tax = 0;
  for (const [n, [from, rate]] of c.brackets.entries()) {
    const to = c.brackets[n + 1]?.[0];
    if (taxable <= $(from)) break;
    tax += (Math.min(taxable, to === undefined ? taxable : $(to)) - $(from)) * rate;
  }
  const addBack = income <= $(c.addBackFrom) ? 0 : Math.min($(c.addBackMax), Math.ceil((income - $(c.addBackFrom)) / $(5_000_00)) * $(c.addBackStep));
  const credit = c.credit.find(([upTo]) => income <= $(upTo))?.[1] ?? 0;
  return Math.round((tax + addBack) * (1 - credit));
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
  const federalBefore = computeAnnualTax(taxed, cityId, at).federal;
  // Work abroad: Canada's tax stands over CAD 15,000 in the year, and comes back under it; the UK's stands. The US credits it, to its own tax on that income.
  let foreignIncome = 0;
  let foreignTax = 0;
  let foreignRefund = 0;
  for (const [country, f] of Object.entries(y.foreign)) {
    foreignIncome += f.gross;
    if (country === 'ca' && f.gross <= (exchange(ABROAD.canada.treatyCad, 'CAD', into) ?? ABROAD.canada.treatyCad)) foreignRefund += f.withheld;
    else foreignTax += f.withheld;
  }
  const foreignCredit = taxed > 0 ? Math.min(foreignTax, Math.round(federalBefore * Math.min(1, foreignIncome / taxed))) : 0;
  const federal = federalBefore - foreignCredit;
  // Each state: what came while living there, and wages for work done there, over all of it.
  const states = new Map<string, { city: string; resident: Money; source: Money }>();
  const entry = (state: string, city: string) => { if (!states.has(state)) states.set(state, { city, resident: 0, source: 0 }); return states.get(state)!; };
  for (const [city, amount] of Object.entries(y.byResidence)) entry(stateOf(city), city).resident += amount;
  for (const [key, amount] of Object.entries(y.elsewhere)) { const city = key.split('>')[1]!; entry(stateOf(city), city).source += amount; }
  const lastState = stateOf(cityId);
  // California doesn't tax unemployment, which goes to where they lived at the year's end.
  const benefitOut = (state: string) => (state === 'us-ca' && lastState === 'us-ca' ? y.unemployment : 0);
  // New York and California let the job's costs be itemized above 2% of income, where that beats the standard deduction.
  const itemized = Math.max(0, y.commission + y.dues - STATE_DEDUCTIONS.floor * income);
  const extra = (state: string) => Math.max(0, itemized - usd(STATE_DEDUCTIONS.standard[state] ?? Number.POSITIVE_INFINITY, into));
  const full = (state: string) => {
    const base = Math.max(0, taxed - benefitOut(state));
    // Connecticut's own schedule; SLATE's tax table carries none for it.
    if (state === 'us-ct') return connecticutTax(base, into);
    return computeAnnualTax(base, states.get(state)!.city, at, { deductions: extra(state) }).regional;
  };
  const taxes = new Map<string, number>();
  for (const [state, part] of states) {
    const own = Math.max(0, part.resident + part.source - benefitOut(state));
    let tax = taxed > 0 ? Math.round(full(state) * Math.min(1, own / Math.max(1, taxed - benefitOut(state)))) : 0;
    // Georgia leaves a nonresident's small wages alone.
    if (state === 'us-ga' && part.resident === 0 && part.source <= Math.min(usd(STATE_RETURN.georgiaExempt, into), STATE_RETURN.georgiaExemptShare * y.acting)) tax = 0;
    taxes.set(state, tax);
  }
  // The home state credits another's tax on the same wages, to its own tax on them.
  const credits = new Map<string, number>();
  for (const [key, amount] of Object.entries(y.elsewhere)) {
    const [lived, city] = key.split('>') as [string, string];
    const worked = stateOf(city);
    if (!states.has(lived) || !taxes.get(worked)) continue;
    const part = states.get(worked)!;
    const theirs = taxes.get(worked)! * (amount / Math.max(1, part.resident + part.source));
    const ours = taxed > 0 ? full(lived) * (amount / taxed) : 0;
    credits.set(lived, (credits.get(lived) ?? 0) + Math.round(Math.min(theirs, ours)));
  }
  const stateLines = [...states.keys()].map((state) => ({ state, tax: taxes.get(state) ?? 0, credit: Math.min(taxes.get(state) ?? 0, credits.get(state) ?? 0) }));
  // A city's own tax, New York City's, only on what came while living in it.
  const local = taxed > 0 ? Object.entries(y.byResidence).reduce((sum, [city, amount]) => sum + Math.round(computeAnnualTax(taxed, city, at).local * (amount / taxed)), 0) : 0;
  const incomeTax = federal + stateLines.reduce((sum, l) => sum + l.tax - l.credit, 0) + local;
  // Payroll tax is on the acting wages alone: a student's work-study and a benefit carry none.
  const payroll = computeAnnualTax(y.acting, cityId, at).payroll;
  const premiums = person.health?.premiums[year] ?? [];
  // The poverty line the year's cover reads is the year before's; a person Medicaid or the Essential Plan would take gets no credit.
  const ratio = income / usd(byYear(POVERTY_LINE, year - 1), into);
  const program = ratio <= PUBLIC_COVER.medicaidShare || (lastState === 'us-ny' && ratio <= PUBLIC_COVER.essentialShare);
  const pct = program ? undefined : applicablePercent(year, ratio);
  const credit = pct === undefined ? 0 : premiums.reduce((sum, premium) => sum + Math.max(0, Math.round(premium - (pct * income) / 12)), 0);
  const months = person.health?.uncoveredInCalifornia[year] ?? 0;
  const mandate = months * Math.round(Math.min(usd(CALIFORNIA_MANDATE.bronzeMonth, into), Math.max(usd(CALIFORNIA_MANDATE.flat, into), CALIFORNIA_MANDATE.share * income) / 12));
  return {
    cityId, acting: y.acting, workStudy: y.workStudy, unemployment: y.unemployment, income, deduction,
    incomeTax, federal, foreignCredit, foreignRefund, states: stateLines, local, payroll, credit, mandate, withheld: y.withheld,
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
    if (figures.balance === 0 && figures.income === 0 && figures.foreignRefund === 0) return;
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
    if (!person || !account || account.closedAt) return;
    // Canada's refund of its withholding, under the treaty, beside the IRS's.
    const canada = item.payload.foreign === true ? r?.figures.foreignRefund ?? 0 : 0;
    if (canada) { s.post({ memo: `Canada Revenue Agency refund, ${r!.year}`, category: 'tax', postings: [{ accountId: account.id, amount: canada }, { accountId: s.nominalAccount('income', 'Tax Refund').id, amount: -canada }] }); return; }
    if (!r?.refund) return;
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
    if (r.figures.foreignRefund > 0) s.schedule({ at: s.now + RETURN.refundDays * MS_DAY, kind: TAX_REFUND_KIND, label: `Canada’s Refund: ${r.year}`, category: 'system', priority: 20, payload: { personId: person.id, year: r.year, foreign: true } });
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
