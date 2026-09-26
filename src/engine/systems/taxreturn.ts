/**
 * SLATE — the tax year settled.
 *
 * Nothing was settled after a year until 2026-09-25: what a payslip withheld
 * was the tax, even for somebody who worked half the year and had twice
 * what they owed taken. Now, on the date each country settles
 * (`content/taxreturn.ts`), the year's real tax is worked on the year's real
 * pay and benefit, the credits come off it, and the difference from what
 * was withheld is paid back or asked for.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { CITIES, jurisdictionPath } from '../content/geography';
import { settleYear, settlementAt, type Credit, type Settlement, type YearFigures } from '../content/taxreturn';
import { exchange } from '../content/currency';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { dateKey, MS_DAY, type Instant } from '../core/time';
import { countryAt } from './work';
import { netWorth } from './finance';

/** A settled year, for the work screen. */
export interface YearSettled {
  name: string;
  /** The tax year's first day, YYYY-MM-DD. */
  year: string;
  at: Instant;
  wages: Money;
  benefits: Money;
  withheld: Money;
  owed: Money;
  credits: { name: string; amount: Money }[];
  refund: Money;
}

/** Where somebody's tax is settled: where they work, or last worked, or are. */
function whereTaxed(person: Person): string {
  return person.job?.cityId ?? person.earnings?.lastLeft?.cityId ?? person.currentLocationId;
}

/** The first day of the tax year an instant falls in. */
export function taxYearStart(s: Settlement, at: Instant): Instant {
  const d = new Date(at);
  const [m, day] = s.yearStart;
  const thisYear = Date.UTC(d.getUTCFullYear(), m - 1, day);
  return at >= thisYear ? thisYear : Date.UTC(d.getUTCFullYear() - 1, m - 1, day);
}

/** Tax withheld from a person's pay between two instants. */
function withheldBetween(sim: Simulation, person: Person, from: Instant, to: Instant): Money {
  const account = sim.nominalAccount('expense', 'Tax Withheld').id;
  let total = 0;
  for (const t of sim.universe.transactions) {
    if (t.at < from || t.at >= to || t.category !== 'salary') continue;
    if (!t.postings.some((p) => sim.universe.accounts[p.accountId]?.ownerId === person.id)) continue;
    for (const p of t.postings) if (p.accountId === account) total += p.amount;
  }
  return total;
}

/** Rent a person paid between two instants, however it was paid. */
function rentBetween(sim: Simulation, person: Person, from: Instant, to: Instant): Money {
  const rent = sim.nominalAccount('expense', 'Rent').id;
  let total = 0;
  for (const t of sim.universe.transactions) {
    if (t.at < from || t.at >= to || t.category !== 'rent') continue;
    if (!t.postings.some((p) => sim.universe.accounts[p.accountId]?.ownerId === person.id)) continue;
    for (const p of t.postings) if (p.accountId === rent && p.amount > 0) total += p.amount;
  }
  return total;
}

/** Unemployment benefit paid to a person between two instants, by the benefit's name. */
function benefitsBetween(sim: Simulation, person: Person, from: Instant, to: Instant): { name: string; amount: Money; at: Instant }[] {
  const out: { name: string; amount: Money; at: Instant }[] = [];
  for (const t of sim.universe.transactions) {
    if (t.at < from || t.at >= to || t.category !== 'benefit') continue;
    const paid = t.postings.find((p) => sim.universe.accounts[p.accountId]?.ownerId === person.id)?.amount ?? 0;
    if (paid > 0) out.push({ name: t.memo, amount: paid, at: t.at });
  }
  return out;
}

/**
 * A tax year's settlement for a person, worked now: its figures in the
 * country's money, and what it comes to, in the save's. Up to `to`, so a
 * year still running shows what it would come to if it ended today.
 */
export function workYear(sim: Simulation, person: Person, from: Instant, to: Instant): { settlement: Settlement; figures: YearFigures; result: ReturnType<typeof settleYear>; withheld: Money; wages: Money; benefits: Money; refund: Money } | undefined {
  const cityId = whereTaxed(person);
  const settlement = settlementFor(person);
  if (!settlement) return undefined;
  const path = jurisdictionPath(cityId);
  const save = saveCurrency(sim.universe);
  const { currency } = countryAt(cityId);
  const toLocal = (m: Money) => (save === currency ? m : exchange(m, save, currency) ?? m) / 100;
  const paydays = (person.earnings?.paydays ?? []).filter((one) => one.at >= from && one.at < to);
  const wages = paydays.reduce((sum, one) => sum + one.gross, 0);
  const paid = benefitsBetween(sim, person, from, to);
  const benefits = paid.reduce((sum, one) => sum + one.amount, 0);
  const byName = new Map<string, number>();
  for (const one of paid) byName.set(one.name, (byName.get(one.name) ?? 0) + toLocal(one.amount));
  const months = new Set(paid.map((one) => new Date(one.at).toISOString().slice(0, 7))).size;
  const days = paydays.reduce((sum, one) => sum + one.days, 0);
  const hours = paydays.reduce((sum, one) => sum + one.hours, 0);
  const figures: YearFigures = {
    wages: toLocal(wages),
    benefits: [...byName].map(([name, amount]) => ({ name, amount })),
    age: Math.floor((to - person.birthInstant) / (365.2425 * MS_DAY)),
    path, at: from + MS_DAY, benefitMonths: months,
    rent: toLocal(rentBetween(sim, person, from, to)),
    savings: toLocal(netWorth(sim, person.id).cash),
    ...(days > 0 ? { weeklyHours: hours / (days / 7) } : {}),
  };
  const withheld = withheldBetween(sim, person, from, to);
  const result = settleYear(settlement, figures, toLocal(withheld));
  const refund = Math.round(save === currency ? result.refund * 100 : exchange(Math.round(result.refund * 100), currency, save) ?? result.refund * 100);
  return { settlement, figures, result, withheld, wages, benefits, refund };
}

/** The settlement where somebody's tax is settled, if SLATE has it. */
export function settlementFor(person: Person): Settlement | undefined {
  const cityId = whereTaxed(person);
  return CITIES.get(cityId) ? settlementAt(jurisdictionPath(cityId)) : undefined;
}

/** Working: a job with shifts, not between jobs and not gone. */
const working = (person: Person) => person.job !== undefined && person.job.lookingUntil === undefined && person.job.quitAt === undefined;

/** Settles the tax year that falls due today for a person, if one does. */
export function settleToday(sim: Simulation, person: Person): YearSettled | undefined {
  const cityId = whereTaxed(person);
  if (!CITIES.get(cityId) || !person.primaryAccountId) return undefined;
  const settlement = settlementAt(jurisdictionPath(cityId));
  if (!settlement) return undefined;
  const today = dateKey(sim.now, sim.homeZone);
  const e = (person.earnings ??= { paydays: [] });
  for (let back = 0; back <= 2; back += 1) {
    const from = taxYearStart(settlement, sim.now - back * 365 * MS_DAY);
    const key = `${settlement.name}:${new Date(from).toISOString().slice(0, 10)}`;
    const end = new Date(from);
    const to = Date.UTC(end.getUTCFullYear() + 1, end.getUTCMonth(), end.getUTCDate());
    // A credit paid apart, on its own date, whether or not the year is settled.
    const later = settlement.later;
    const laterKey = later ? `${later.name}:${new Date(from).toISOString().slice(0, 10)}` : '';
    if (later && !e.settled?.includes(laterKey) && dateKey(Date.UTC(new Date(to).getUTCFullYear() + later.settle.offsetYears, later.settle.month - 1, later.settle.day), 'UTC') === today) {
      const worked = workYear(sim, person, from, to);
      const units = worked ? later.amount(worked.figures) : 0;
      e.settled = [...(e.settled ?? []).slice(-9), laterKey];
      if (units > 0) {
        const save = saveCurrency(sim.universe);
        const { currency } = countryAt(cityId);
        const paid = Math.round(save === currency ? units * 100 : exchange(Math.round(units * 100), currency, save) ?? units * 100);
        sim.post({
          memo: `${later.name}, ${new Date(from).getUTCFullYear()}`, category: 'tax',
          postings: [{ accountId: sim.nominalAccount('income', 'Tax Refund').id, amount: -paid }, { accountId: person.primaryAccountId, amount: paid }],
        });
        if (person.id === sim.universe.playerId) {
          sim.notify({ category: 'work', title: 'Tax Credit Paid', body: `${later.name}: ${formatMoney(paid, save)} for your pay in ${new Date(from).getUTCFullYear()}.`, importance: 60 });
        }
      }
    }
    if (e.settled?.includes(key)) continue;
    const due = settlement.settle.find((one) => {
      const at = Date.UTC(new Date(to).getUTCFullYear() + one.offsetYears, one.month - 1, one.day);
      return dateKey(at, 'UTC') === today && (!one.ifEmployed || working(person));
    });
    if (!due) continue;
    const worked = workYear(sim, person, from, to);
    if (!worked || (worked.wages <= 0 && worked.withheld <= 0)) continue;
    e.settled = [...(e.settled ?? []).slice(-9), key];
    const save = saveCurrency(sim.universe);
    const { currency } = countryAt(cityId);
    const toSave = (units: number) => Math.round(save === currency ? units * 100 : exchange(Math.round(units * 100), currency, save) ?? units * 100);
    const { refund } = worked;
    if (refund !== 0) {
      sim.post({
        memo: `${settlement.name}, ${new Date(from).getUTCFullYear()}`, category: 'tax',
        postings: refund > 0
          ? [{ accountId: sim.nominalAccount('income', 'Tax Refund').id, amount: -refund }, { accountId: person.primaryAccountId, amount: refund }]
          : [{ accountId: sim.nominalAccount('expense', 'Tax Due').id, amount: -refund }, { accountId: person.primaryAccountId, amount: refund }],
      });
    }
    const settled: YearSettled = {
      name: settlement.name, year: new Date(from).toISOString().slice(0, 10), at: sim.now,
      wages: worked.wages, benefits: worked.benefits, withheld: worked.withheld, owed: toSave(worked.result.owed),
      credits: worked.result.credits.map((one: Credit) => ({ name: one.name, amount: toSave(one.amount) })), refund,
    };
    e.lastReturn = settled;
    if (person.id === sim.universe.playerId) {
      sim.notify({
        category: 'work',
        title: refund >= 0 ? 'Tax Refund' : 'Tax To Pay',
        body: refund >= 0
          ? `${settlement.name}: ${formatMoney(refund, save)} back of the ${formatMoney(worked.withheld, save)} withheld from your pay${settled.credits.length ? `, with ${settled.credits.map((one) => one.name).join(' and ')}` : ''}.`
          : `${settlement.name}: ${formatMoney(-refund, save)} more than was withheld, taken from your account.`,
        importance: 60,
      });
    }
    return settled;
  }
  return undefined;
}

export function registerTaxReturn(sim: Simulation): void {
  sim.onEvent('world.day_rollover', 'tax.settle', (_event, { sim: s }) => {
    for (const person of Object.values(s.universe.people)) if (person.earnings?.paydays.length) settleToday(s, person);
  });
}
