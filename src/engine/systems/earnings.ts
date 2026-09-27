/**
 * SLATE — what a person earned, the one ledger the tax return, unemployment
 * insurance and the unions' health plans read (`systems/taxreturn.ts`,
 * `systems/unemployment.ts`, `systems/health.ts`). Every paycheck and
 * benefit that reaches their bank is written here as it's paid: by calendar
 * year, for the return, and by quarter, for a claim's base period and a
 * health plan's.
 */

import type { Person } from '../domain/model';
import type { Money } from '../core/money';
import { zonedParts, type Instant } from '../core/time';
import { CITIES } from '../content/geography';

export interface YearEarnings {
  /** Wages from acting work, residuals among them. */
  acting: Money;
  residuals: Money;
  /** Of the acting wages, under SAG-AFTRA, for its dues and its health plan. */
  sag: Money;
  workStudy: Money;
  unemployment: Money;
  withheld: Money;
  /** What the job cost: the agency's and the manager's commission, and the unions' dues. */
  commission: Money;
  dues: Money;
  /** Productions that paid $200 or more, for the performing artist deduction. */
  employers: Record<string, Money>;
  /** Where they lived when last paid, which the return is filed from. */
  residence?: string;
  /** Income by the town they lived in when it was paid, for a part-year return. */
  byResidence: Record<string, Money>;
  /** Wages for work done in a state they didn't live in, by `livedInState>workedInTown`. */
  elsewhere: Record<string, Money>;
}

export interface EarningsRecord {
  years: Record<string, YearEarnings>;
  /** Wages by quarter, `YYYY-Q`, and of them SAG-AFTRA's. */
  quarters: Record<string, { wages: Money; sag: Money }>;
  /** Weeks with Equity work, by the Monday they began, `YYYY-MM-DD`. */
  equityWeeks: string[];
  /** Income by month, `YYYY-MM`, for the programs that test current income. */
  months: Record<string, Money>;
}

export function earningsOf(person: Person): EarningsRecord {
  person.earnings ??= { years: {}, quarters: {}, equityWeeks: [], months: {} };
  person.earnings.months ??= {};
  return person.earnings;
}

export function yearOf(person: Person, year: number | string): YearEarnings {
  const record = earningsOf(person);
  record.years[year] ??= { acting: 0, residuals: 0, sag: 0, workStudy: 0, unemployment: 0, withheld: 0, commission: 0, dues: 0, employers: {}, byResidence: {}, elsewhere: {} };
  const y = record.years[year]!;
  y.byResidence ??= {};
  y.elsewhere ??= {};
  return y;
}

export const quarterKey = (year: number, month: number) => `${year}-${Math.floor((month - 1) / 3) + 1}`;

/** Wages paid: to the year and the quarter they're paid in. */
export function recordWages(person: Person, at: Instant, zone: string, pay: {
  gross: Money; withheld?: Money; commission?: Money; dues?: Money; sag?: boolean; residual?: boolean; employer?: string; workStudy?: boolean;
  /** The town the work was done in, where it isn't where they live. */
  where?: string;
}): void {
  const p = zonedParts(at, zone);
  const y = yearOf(person, p.year);
  const home = homeOf(person);
  y.byResidence[home] = (y.byResidence[home] ?? 0) + pay.gross;
  const lived = stateOf(home);
  const worked = pay.where ? stateOf(pay.where) : lived;
  if (worked !== lived) y.elsewhere[`${lived}>${pay.where}`] = (y.elsewhere[`${lived}>${pay.where}`] ?? 0) + pay.gross;
  const month = `${p.year}-${String(p.month).padStart(2, '0')}`;
  earningsOf(person).months[month] = (earningsOf(person).months[month] ?? 0) + pay.gross;
  if (pay.workStudy) y.workStudy += pay.gross;
  else y.acting += pay.gross;
  if (pay.residual) y.residuals += pay.gross;
  if (pay.sag) y.sag += pay.gross;
  y.withheld += pay.withheld ?? 0;
  y.commission += pay.commission ?? 0;
  y.dues += pay.dues ?? 0;
  if (pay.employer) y.employers[pay.employer] = (y.employers[pay.employer] ?? 0) + pay.gross;
  y.residence = home;
  // A student's work-study wages aren't covered by unemployment insurance.
  if (pay.workStudy) return;
  const q = (earningsOf(person).quarters[quarterKey(p.year, p.month)] ??= { wages: 0, sag: 0 });
  q.wages += pay.gross;
  if (pay.sag) q.sag += pay.gross;
}

/** A benefit paid: unemployment insurance, income for the return. */
export function recordBenefit(person: Person, at: Instant, zone: string, amount: Money): void {
  const p = zonedParts(at, zone);
  const y = yearOf(person, p.year);
  y.unemployment += amount;
  const home = homeOf(person);
  y.residence = home;
  y.byResidence[home] = (y.byResidence[home] ?? 0) + amount;
  const month = `${p.year}-${String(p.month).padStart(2, '0')}`;
  earningsOf(person).months[month] = (earningsOf(person).months[month] ?? 0) + amount;
}

/** Where they live: their home's town, or where they are without one. */
export const homeOf = (person: Person): string => person.home?.cityId ?? person.currentLocationId;

/** A town's state or region, `us-ny`. */
export const stateOf = (cityId: string): string => CITIES.get(cityId)?.parentId ?? cityId;

/** The quarters before one, newest last: `count` of them, ending the quarter before `year-q`. */
export function quartersBefore(year: number, quarter: number, count: number): string[] {
  const out: string[] = [];
  let y = year;
  let q = quarter;
  for (let n = 0; n < count; n += 1) {
    q -= 1;
    if (q === 0) { q = 4; y -= 1; }
    out.unshift(`${y}-${q}`);
  }
  return out;
}
