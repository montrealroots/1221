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
  /** A scholarship's taxable part: what paid for living, not tuition or books. */
  scholarship?: Money;
  /** Interest the bank paid, before any tax taken at source: a 1099-INT's, taxable, with no payroll tax. */
  interest?: Money;
  /** A pension paid: a 1099-R's, taxable, with no payroll tax (`systems/pension.ts`). */
  pension?: Money;
  /** SAG-AFTRA wages by production, for the pension's per-project ceiling. */
  sagByProject?: Record<string, Money>;
  withheld: Money;
  /** What the job cost: the agency's and the manager's commission, and the unions' dues. */
  commission: Money;
  dues: Money;
  /** And the rest of what the work cost: casting sites, headshots, a kit, a class, a coach. */
  jobCosts?: Money;
  /** Productions that paid $200 or more, for the performing artist deduction. */
  employers: Record<string, Money>;
  /** Where they lived when last paid, which the return is filed from. */
  residence?: string;
  /** Income by the town they lived in when it was paid, for a part-year return. */
  byResidence: Record<string, Money>;
  /** Wages for work done in a state they didn't live in, by `livedInState>workedInTown`. */
  elsewhere: Record<string, Money>;
  /** Wages for work done abroad, and what the country withheld, by country; and by the town it was done in. */
  foreign: Record<string, { gross: Money; withheld: Money }>;
  foreignWhere?: Record<string, Money>;
}

export interface EarningsRecord {
  years: Record<string, YearEarnings>;
  /** Wages by quarter, `YYYY-Q`, and of them SAG-AFTRA's. */
  quarters: Record<string, { wages: Money; sag: Money }>;
  /** Weeks with Equity work, by the Monday they began, `YYYY-MM-DD`. */
  equityWeeks: string[];
  /** Income by month, `YYYY-MM`, for the programs that test current income. */
  months: Record<string, Money>;
  /** UK wages by the UK's tax year, keyed by the year it began on 6 April, for its treaty's test; what was withheld, by year and by payer; and the years settled. */
  ukYears: Record<string, Money>;
  ukWithheld?: Record<string, Money>;
  ukPayers?: Record<string, Record<string, Money>>;
  ukSettled?: string[];
}

export function earningsOf(person: Person): EarningsRecord {
  person.earnings ??= { years: {}, quarters: {}, equityWeeks: [], months: {}, ukYears: {} };
  person.earnings.months ??= {};
  person.earnings.ukYears ??= {};
  return person.earnings;
}

export function yearOf(person: Person, year: number | string): YearEarnings {
  const record = earningsOf(person);
  record.years[year] ??= { acting: 0, residuals: 0, sag: 0, workStudy: 0, unemployment: 0, withheld: 0, commission: 0, dues: 0, employers: {}, byResidence: {}, elsewhere: {}, foreign: {} };
  const y = record.years[year]!;
  y.byResidence ??= {};
  y.elsewhere ??= {};
  y.foreign ??= {};
  return y;
}

export const quarterKey = (year: number, month: number) => `${year}-${Math.floor((month - 1) / 3) + 1}`;

/** Wages paid: to the year and the quarter they're paid in. */
export function recordWages(person: Person, at: Instant, zone: string, pay: {
  gross: Money; withheld?: Money; commission?: Money; dues?: Money; sag?: boolean; residual?: boolean; employer?: string; workStudy?: boolean;
  /** The town the work was done in, where it isn't where they live. */
  where?: string;
  /** What a country withheld, for work done abroad. */
  foreignWithheld?: Money;
}): void {
  const p = zonedParts(at, zone);
  const y = yearOf(person, p.year);
  const home = homeOf(person);
  y.byResidence[home] = (y.byResidence[home] ?? 0) + pay.gross;
  const lived = stateOf(home);
  const country = pay.where ? CITIES.get(pay.where)?.countryId : undefined;
  if (country && country !== CITIES.get(home)?.countryId) {
    const f = (y.foreign[country] ??= { gross: 0, withheld: 0 });
    f.gross += pay.gross;
    y.foreignWhere = { ...y.foreignWhere, [pay.where!]: (y.foreignWhere?.[pay.where!] ?? 0) + pay.gross };
    f.withheld += pay.foreignWithheld ?? 0;
    if (country === 'uk') {
      const r = earningsOf(person);
      const key = ukTaxYear(at);
      r.ukYears[key] = (r.ukYears[key] ?? 0) + pay.gross;
      r.ukWithheld = { ...r.ukWithheld, [key]: (r.ukWithheld?.[key] ?? 0) + (pay.foreignWithheld ?? 0) };
      const payers = ((r.ukPayers ??= {})[key] ??= {});
      if (pay.employer) payers[pay.employer] = (payers[pay.employer] ?? 0) + pay.gross;
    }
  }
  const worked = pay.where && !(country && country !== CITIES.get(home)?.countryId) ? stateOf(pay.where) : lived;
  if (worked !== lived) y.elsewhere[`${lived}>${pay.where}`] = (y.elsewhere[`${lived}>${pay.where}`] ?? 0) + pay.gross;
  const month = `${p.year}-${String(p.month).padStart(2, '0')}`;
  earningsOf(person).months[month] = (earningsOf(person).months[month] ?? 0) + pay.gross;
  if (pay.workStudy) y.workStudy += pay.gross;
  else y.acting += pay.gross;
  if (pay.residual) y.residuals += pay.gross;
  if (pay.sag) {
    y.sag += pay.gross;
    if (pay.employer && !pay.residual) (y.sagByProject ??= {})[pay.employer] = (y.sagByProject[pay.employer] ?? 0) + pay.gross;
  }
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

/**
 * Interest paid on an account, to the year's return and the month's income.
 * Until 2026-09-27 it was posted as income and read by nothing, so the
 * wealthy start's savings earned about $11,000 a year that no return taxed
 * and no income test for Medicaid or the premium credit saw.
 */
export function recordInterest(person: Person, at: Instant, zone: string, amount: Money): void {
  const p = zonedParts(at, zone);
  const y = yearOf(person, p.year);
  y.interest = (y.interest ?? 0) + amount;
  const home = homeOf(person);
  y.byResidence[home] = (y.byResidence[home] ?? 0) + amount;
  const month = `${p.year}-${String(p.month).padStart(2, '0')}`;
  earningsOf(person).months[month] = (earningsOf(person).months[month] ?? 0) + amount;
}

/** A pension paid, to the year it's paid and where they lived: income for the return, and the month's. */
export function recordPension(person: Person, at: Instant, zone: string, amount: Money): void {
  const p = zonedParts(at, zone);
  const y = yearOf(person, p.year);
  y.pension = (y.pension ?? 0) + amount;
  const home = homeOf(person);
  y.byResidence[home] = (y.byResidence[home] ?? 0) + amount;
  const month = `${p.year}-${String(p.month).padStart(2, '0')}`;
  earningsOf(person).months[month] = (earningsOf(person).months[month] ?? 0) + amount;
}

/** A scholarship's taxable part, to the year it's paid and where they lived. */
export function recordScholarship(person: Person, at: Instant, zone: string, amount: Money): void {
  const y = yearOf(person, zonedParts(at, zone).year);
  y.scholarship = (y.scholarship ?? 0) + amount;
  const home = homeOf(person);
  y.byResidence[home] = (y.byResidence[home] ?? 0) + amount;
  y.residence = home;
}

/** A cost of the work paid from the bank, for the year's return. */
export function recordJobCost(person: Person, at: Instant, amount: Money): void {
  const y = yearOf(person, zonedParts(at, 'America/New_York').year);
  y.jobCosts = (y.jobCosts ?? 0) + amount;
}

/** The UK tax year a moment is in, by the year it began: 6 April to 5 April. */
export function ukTaxYear(at: Instant): string {
  const p = zonedParts(at, 'Europe/London');
  return String(p.month > 4 || (p.month === 4 && p.day >= 6) ? p.year : p.year - 1);
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
