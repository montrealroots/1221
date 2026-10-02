/**
 * SLATE — US Social Security's retirement benefit (from 2026-09-29).
 * Researched from SSA's own pages (read through their Internet Archive
 * copies, SSA refusing automated fetches) and kept in
 * `docs/research/world/research-socialsecurity.json`. Until then SLATE took
 * the 6.2% from every American paycheck for a lifetime and never paid the
 * benefit back.
 *
 * A year's covered earnings are its US wages to the year's taxable maximum
 * ($184,500 in 2026), each indexed to the year the worker turns 60 by the
 * national Average Wage Index; the average of the highest 35 a month is the
 * AIME, and the benefit at full retirement age, the PIA, is 90% of it to the
 * first bend point, 32% to the second and 15% above ($1,286 and $7,749 in
 * 2026), rounded down to a dime. Forty credits qualify, four a year at most,
 * one for each $1,890 earned in 2026. Full retirement age is 67 for anyone
 * born from 1960; it can be claimed from 62, cut 5/9 of 1% a month for the
 * first 36 months early and 5/12 of 1% beyond, or delayed to 70, raised 8% a
 * year. It's paid monthly, anywhere a UK resident lives among them.
 *
 * SLATE's estimates: what SSA hasn't published (the wage index after 2024,
 * the taxable maximum, bend points and credit after 2026, every later
 * cost-of-living increase) held at the last published; the earnings test on
 * a benefit claimed early while working, its taxation on the return, and
 * combining a UK record under the totalization agreement, left out.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatDate, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { earningsOf } from './earnings';
import { payeeAccount } from './cash';

export const SOCIAL_SECURITY = {
  /** The national Average Wage Index, 2000 to 2024, dollars. */
  awi: { 2000: 32154.82, 2001: 32921.92, 2002: 33252.09, 2003: 34064.95, 2004: 35648.55, 2005: 36952.94, 2006: 38651.41, 2007: 40405.48, 2008: 41334.97, 2009: 40711.61, 2010: 41673.83, 2011: 42979.61, 2012: 44321.67, 2013: 44888.16, 2014: 46481.52, 2015: 48098.63, 2016: 48642.15, 2017: 50321.89, 2018: 52145.8, 2019: 54099.99, 2020: 55628.6, 2021: 60575.07, 2022: 63795.13, 2023: 66621.8, 2024: 69846.57 } as Readonly<Record<number, number>>,
  taxableMax: { 2020: 137_700, 2021: 142_800, 2022: 147_000, 2023: 160_200, 2024: 168_600, 2025: 176_100, 2026: 184_500 } as Readonly<Record<number, number>>,
  bends: [1_286, 7_749] as const,
  rates: [0.9, 0.32, 0.15] as const,
  perCredit: 1_890,
  creditsNeeded: 40,
  bestYears: 35,
  fullAge: 67,
  earliestAge: 62,
  latestAge: 70,
  source: 'https://www.ssa.gov/oact/cola/piaformula.html; https://www.ssa.gov/oact/cola/AWI.html; https://www.ssa.gov/oact/cola/cbb.html; https://www.ssa.gov/benefits/retirement/planner/agereduction.html',
} as const;

export const SOCIAL_SECURITY_KIND = 'pension.ss_month';
const YEAR_MS = 365.2425 * MS_DAY;
/** The same day a month on, as a monthly benefit is paid. */
const monthOn = (at: Instant) => { const d = new Date(at); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours()); };

/** A year's figure, or the last published before it. */
const heldAt = (table: Readonly<Record<number, number>>, year: number) => {
  const years = Object.keys(table).map(Number).sort((a, b) => a - b);
  const at = [...years].reverse().find((y) => y <= year) ?? years[0]!;
  return table[at]!;
};

/** A year's US wages, in dollars: what it earned in the US, all of it for a year from before wages were kept by country. */
function usWages(person: Person, year: number, currency: string): number {
  const y = earningsOf(person).years[year];
  if (!y) return 0;
  const cents = y.bySource ? (y.bySource.us ?? 0) : y.acting + y.workStudy;
  const usd = currency === 'USD' ? cents : exchange(cents, currency, 'USD') ?? cents;
  return usd / 100;
}

export interface SocialSecurityRecord { credits: number; aime: number; pia: number; years: { year: number; covered: number; indexed: number }[] }

/** Their Social Security record: credits, the AIME, and the benefit at full retirement age, in dollars a month. */
export function socialSecurityOf(person: Person, currency: string): SocialSecurityRecord {
  const born = new Date(person.birthInstant).getUTCFullYear();
  const at60 = born + 60;
  const years = Object.keys(earningsOf(person).years).map(Number).sort((a, b) => a - b);
  let credits = 0;
  const rows = years.map((year) => {
    const covered = Math.min(usWages(person, year, currency), heldAt(SOCIAL_SECURITY.taxableMax, year));
    credits += Math.min(4, Math.floor(covered / SOCIAL_SECURITY.perCredit));
    // Indexed to the year they turn 60; a year from 60 on counts as earned.
    const factor = year < at60 ? heldAt(SOCIAL_SECURITY.awi, at60) / heldAt(SOCIAL_SECURITY.awi, year) : 1;
    return { year, covered, indexed: covered * factor };
  });
  const best = rows.map((r) => r.indexed).sort((a, b) => b - a).slice(0, SOCIAL_SECURITY.bestYears);
  const aime = Math.floor(best.reduce((a, b) => a + b, 0) / (SOCIAL_SECURITY.bestYears * 12));
  const [b1, b2] = SOCIAL_SECURITY.bends;
  const [r1, r2, r3] = SOCIAL_SECURITY.rates;
  const raw = r1 * Math.min(aime, b1) + r2 * Math.max(0, Math.min(aime, b2) - b1) + r3 * Math.max(0, aime - b2);
  const pia = Math.floor(raw * 10) / 10;
  return { credits, aime, pia, years: rows };
}

/** What a claim at an age keeps of the full benefit: cut for each month early, raised for each month delayed. */
export function claimFactor(months: number): number {
  if (months < 0) {
    const early = -months;
    return 1 - (Math.min(early, 36) * 5) / 900 - (Math.max(0, early - 36) * 5) / 1200;
  }
  return 1 + (Math.min(months, (SOCIAL_SECURITY.latestAge - SOCIAL_SECURITY.fullAge) * 12) * 2) / 300;
}

/** Months from full retirement age to a moment: negative before it. */
export function monthsFromFull(person: Person, at: Instant): number {
  return Math.floor(((at - person.birthInstant) / YEAR_MS - SOCIAL_SECURITY.fullAge) * 12);
}

export function socialSecurityRefusal(sim: Simulation, person: Person): string | undefined {
  if (person.socialSecurity) return 'You’re drawing it.';
  const age = (sim.now - person.birthInstant) / YEAR_MS;
  if (age < SOCIAL_SECURITY.earliestAge) return `From 62; full at ${SOCIAL_SECURITY.fullAge}, and more if you wait to 70.`;
  const record = socialSecurityOf(person, saveCurrency(sim.universe));
  if (record.credits < SOCIAL_SECURITY.creditsNeeded) return `Forty credits qualify; your US work earned ${record.credits}.`;
  return undefined;
}

export function registerSocialSecurity(sim: Simulation): void {
  sim.onCommand<Record<string, never>, { monthly: Money; factor: number }>('pension.social_security', (_p, { sim: s }) => {
    const person = s.player;
    const no = socialSecurityRefusal(s, person);
    if (no) throw new CommandError(no);
    const cur = saveCurrency(s.universe);
    const record = socialSecurityOf(person, cur);
    const factor = claimFactor(monthsFromFull(person, s.now));
    const usd = Math.floor(record.pia * factor);
    person.socialSecurity = { from: s.now, monthlyUsd: usd };
    s.schedule({ at: monthOn(s.now), kind: SOCIAL_SECURITY_KIND, label: 'Social Security', category: 'system', priority: 20, payload: { personId: person.id } });
    return { monthly: cur === 'USD' ? usd * 100 : exchange(usd * 100, 'USD', cur) ?? usd * 100, factor };
  });

  sim.onSchedule(SOCIAL_SECURITY_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const ss = person?.socialSecurity;
    if (!person || !ss) return;
    const cur = saveCurrency(s.universe);
    const due = cur === 'USD' ? ss.monthlyUsd * 100 : exchange(ss.monthlyUsd * 100, 'USD', cur) ?? ss.monthlyUsd * 100;
    if (due > 0) {
      const account = payeeAccount(s, person);
      s.post({ memo: 'Social Security, the month', category: 'pension', postings: [{ accountId: account.id, amount: due }, { accountId: s.nominalAccount('income', 'Social Security').id, amount: -due }] });
      if (person.id === s.universe.playerId) s.notify({ category: 'bank', title: 'Social Security Paid', body: `${formatMoney(due, cur)} for the month, since ${formatDate(ss.from, s.zone)}.`, importance: 25, route: '/workspace/bank' });
    }
    s.schedule({ at: monthOn(item.at), kind: SOCIAL_SECURITY_KIND, label: 'Social Security', category: 'system', priority: 20, payload: { personId: person.id } });
  });
}
