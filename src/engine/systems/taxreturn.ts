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
import { CITIES } from '../content/geography';
import { ABROAD, CALIFORNIA_MANDATE, CONNECTICUT, RECEIPTS, STATE_DEDUCTIONS, POVERTY_LINE, PREMIUM_CREDIT, PUBLIC_COVER, RETURN, STATE_RETURN, byYear } from '../content/safetynet';
import { earningsOf, stateOf, yearOf } from './earnings';
import { payFromCurrent } from './household';
import { personalityOf } from './personality';
import { payeeAccount } from './cash';

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
  /** A scholarship's taxable part. */
  scholarship?: Money;
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
/** Tax over bands, each band's upper edge and its rate. */
export function banded(income: Money, bands: readonly (readonly [number, number])[]): Money {
  let tax = 0;
  let from = 0;
  for (const [upTo, rate] of bands) {
    if (income <= from) break;
    tax += (Math.min(income, upTo) - from) * rate;
    from = upTo;
  }
  return Math.round(tax);
}

/**
 * Canada's tax under a section 216.1 election, in dollars of the save: the
 * federal brackets on the net of the Canadian gross; each province's tax on
 * the whole net, with Ontario's surtax on its own, taken in the share of the
 * gross earned there (Form T2203); the 48% federal surtax on the share no
 * province takes; and the basic personal amounts' credits only where
 * Canadian income is 90% of the year's.
 */
export function canadaElected(gross: Money, commission: Money, world: Money, into: string, byRegion: Readonly<Record<string, Money>> = {}): Money {
  const c = ABROAD.canada;
  const toCad = (m: Money) => exchange(m, into, 'CAD') ?? m;
  const net = Math.max(0, toCad(gross - commission));
  const mostly = gross >= c.residentShare * world;
  const basic = Math.max(0, banded(net, c.brackets) - (mostly ? Math.round(c.basicPersonal * c.brackets[0]![1]) : 0));
  let provincial = 0;
  let placed = 0;
  for (const [region, earned] of Object.entries(byRegion)) {
    const p = c.provinces[region];
    if (!p || gross <= 0) continue;
    const share = earned / gross;
    placed += share;
    const own = Math.max(0, banded(net, p.brackets) - (mostly ? Math.round(p.basicPersonal * p.brackets[0]![1]) : 0));
    const surtax = (p.surtax ?? []).reduce((sum, [over, rate]) => sum + Math.max(0, own - over) * rate, 0);
    provincial += (own + surtax) * share;
  }
  const cad = Math.round(basic + provincial + basic * c.surtax * Math.max(0, 1 - placed));
  return exchange(cad, 'CAD', into) ?? cad;
}

/** The UK's tax on a UK tax year's gross, a US citizen's: no personal allowance, the bands on it all. */
export function ukTaxOn(gross: Money, into: string): Money {
  const toGbp = (m: Money) => exchange(m, into, 'GBP') ?? m;
  const tax = banded(toGbp(gross), ABROAD.uk.bands);
  return exchange(tax, 'GBP', into) ?? tax;
}

export function figuresFor(person: Person, year: number, into = 'USD', filedAt?: Instant): ReturnFigures {
  const y = yearOf(person, year);
  const cityId = y.residence ?? person.currentLocationId;
  const at = instantFromZoned({ year, month: 12, day: 31, hour: 12 }, HOME);
  const income = y.acting + y.workStudy + y.unemployment + (y.scholarship ?? 0) + (y.interest ?? 0);
  const employers = Object.values(y.employers).filter((pay) => pay >= usd(RETURN.performingArtistEmployerPay, into)).length;
  // Of the rest of the work's costs, the ones there's a receipt for.
  const kept = Math.min(1, RECEIPTS.kept * personalityOf(person, 'receipts'));
  const expenses = y.commission + y.dues + Math.round((y.jobCosts ?? 0) * kept);
  const performer = income <= usd(RETURN.performingArtistIncome, into) && employers >= RETURN.performingArtistEmployers && expenses > RETURN.performingArtistShare * y.acting;
  const deduction = performer ? expenses : 0;
  const taxed = Math.max(0, income - deduction);
  const federalBefore = computeAnnualTax(taxed, cityId, at).federal;
  // Work abroad: Canada's comes back under CAD 15,000 in the year, and over it a 216.1 return filed by 30 April gives back what's past its graduated tax; the UK's is settled after its own year. The US credits what stands, to its own tax on that income.
  let foreignIncome = 0;
  let foreignTax = 0;
  let foreignRefund = 0;
  const elect = instantFromZoned({ year: year + 1, month: ABROAD.canada.electBy.month, day: ABROAD.canada.electBy.day, hour: 23 }, HOME);
  for (const [country, f] of Object.entries(y.foreign)) {
    foreignIncome += f.gross;
    let back = 0;
    if (country === 'ca') {
      if (f.gross <= (exchange(ABROAD.canada.treatyCad, 'CAD', into) ?? ABROAD.canada.treatyCad)) back = f.withheld;
      else if (filedAt === undefined || filedAt <= elect) {
        const commission = y.acting > 0 ? Math.round(y.commission * (f.gross / y.acting)) : 0;
        // Where in Canada it was earned, by province.
        const byRegion: Record<string, Money> = {};
        for (const [city, earned] of Object.entries(y.foreignWhere ?? {})) {
          const place = CITIES.get(city);
          if (place?.countryId === 'ca') byRegion[place.parentId] = (byRegion[place.parentId] ?? 0) + earned;
        }
        back = Math.max(0, f.withheld - canadaElected(f.gross, commission, income, into, byRegion));
      }
    }
    foreignRefund += back;
    foreignTax += f.withheld - back;
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
  const itemized = Math.max(0, expenses - STATE_DEDUCTIONS.floor * income);
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
    cityId, acting: y.acting, workStudy: y.workStudy, unemployment: y.unemployment, scholarship: y.scholarship ?? 0, income, deduction,
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

/**
 * The UK's years settled with its return, due 31 January after the April
 * the year ended: under the treaty's $20,000 all that was withheld comes
 * back; over it, the tax on the whole, less what was withheld, is paid or
 * refunded. What changes goes into the calendar year's foreign tax, for
 * the US credit.
 */
export function settleUkYears(sim: Simulation, person: Person, calendarYear: number): void {
  const r = earningsOf(person);
  const cur = saveCurrency(sim.universe);
  const account = person.primaryAccountId ? sim.universe.accounts[person.primaryAccountId] : undefined;
  for (const [key, gross] of Object.entries(r.ukYears ?? {})) {
    // The year from April key to April key + 1 files by 31 January key + 2.
    if (Number(key) + 2 > calendarYear || r.ukSettled?.includes(key)) continue;
    (r.ukSettled ??= []).push(key);
    const withheld = r.ukWithheld?.[key] ?? 0;
    const tax = gross <= usd(ABROAD.uk.treatyUsd, cur) ? 0 : ukTaxOn(gross, cur);
    const change = tax - withheld;
    if (change === 0 || !account) continue;
    const uk = (yearOf(person, calendarYear).foreign.uk ??= { gross: 0, withheld: 0 });
    uk.withheld += change;
    const memo = change < 0 ? `HMRC refund, UK tax year ${key}–${String(Number(key) + 1).slice(2)}` : `HMRC, UK tax year ${key}–${String(Number(key) + 1).slice(2)}`;
    sim.post({ memo, category: 'tax', postings: [{ accountId: account.id, amount: -change }, { accountId: sim.nominalAccount(change < 0 ? 'income' : 'expense', change < 0 ? 'Tax Refund' : 'Foreign Tax Withheld').id, amount: change }] });
    if (person.id === sim.universe.playerId) sim.notify({ category: 'money', title: change < 0 ? 'The UK Gave Tax Back' : 'The UK Took Its Balance', body: `Your ${key}–${String(Number(key) + 1).slice(2)} UK tax year: ${formatMoney(Math.abs(change), cur)} ${change < 0 ? 'back' : 'paid'}, ${tax === 0 ? 'the treaty leaving it untaxed' : `on ${formatMoney(tax, cur)} of UK tax`}.`, importance: 70, route: '/workspace/papers' });
  }
}

export function registerTaxReturn(sim: Simulation): void {
  sim.onSchedule(TAX_SEASON_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    if (!person) return;
    const p = zonedParts(item.at, HOME);
    s.schedule({ at: instantFromZoned({ year: p.year + 1, month: 2, day: 1, hour: 9 }, HOME), kind: TAX_SEASON_KIND, label: 'Tax Season', category: 'system', priority: 7, payload: { personId: person.id } });
    const year = p.year - 1;
    const cur = saveCurrency(s.universe);
    // A UK tax year whose return fell due yesterday, 31 January, is settled first, into this year's foreign tax.
    settleUkYears(s, person, p.year);
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
    if (!person) return;
    const account = payeeAccount(s, person);
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
    r.figures = figuresFor(person, r.year, cur, s.now);
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
