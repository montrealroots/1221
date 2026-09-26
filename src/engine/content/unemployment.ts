/**
 * SLATE — what each country pays somebody out of work.
 *
 * For the thirteen countries SLATE pays a life in, the unemployment benefit
 * the research of 2026-09-25 found (`probe/job-research/<ISO>.json`,
 * `law.unemployment`, and `probe/unemployment-research/`), each worked by
 * the country's own formula from the record of the pay somebody has had:
 * the work that qualifies, the wage it pays on, the weekly amount in each
 * week of a claim with its floor and ceiling, the waiting days, how long it
 * runs, what quitting or being let go for missing shifts does to it, and,
 * where it's means-tested, what savings take off it. Figures are in each
 * country's own money, whole units, a week, unless a line says a month.
 *
 * Outside the thirteen, and in the US states the research didn't cover,
 * SLATE has no benefit on record, and the work screen says so.
 */

import { MS_DAY, type Instant } from '../core/time';
import { payrollYear } from './payroll';
import { PROVINCES, STATES, WORLD_LAW, type StateLaw, type WorldLaw } from './jurisdictions';

/** Each payday's hours and gross, and the days of work it covered, in the country's money, whole units. */
export type WorkRecord = readonly { at: Instant; days: number; hours: number; gross: number }[];

/**
 * What quitting, or being let go for cause, does to a claim: none paid, or
 * paid after so many weeks, and for a share fewer weeks (Germany's Sperrzeit).
 */
/**
 * What quitting or cause does to a claim: nothing paid, or weeks of delay,
 * with a share of the weeks cut (Germany's quarter), or paid at a lower rate
 * for fewer weeks (Thailand's 30% for 90 days to somebody who resigned).
 */
export type Bar = 'none' | { weeks: number; cut?: number; rate?: number; forWeeks?: number };

/** Who's claiming: their age, when the job ended, and why. */
export interface ClaimContext {
  age: number;
  /** When the job ended: the record is read back from here. */
  at: Instant;
  why: 'laidOff' | 'cause' | 'quit';
}

/** What a week's payment is worked with: age, savings in the country's money, and the share of rights. */
export interface PayContext {
  age: number;
  savings: number;
  share: number;
}

export interface Benefit {
  name: string;
  waitingDays: number;
  /** Paid every so many days. */
  every: number;
  quit: Bar;
  cause: Bar;
  /** Why the record doesn't qualify, or nothing where it does. */
  qualifies(record: WorkRecord, ctx: ClaimContext): string | undefined;
  /** The weekly wage, or amount, it's worked from, fixed when the claim is made. */
  basis(record: WorkRecord, ctx: ClaimContext): number;
  /** The share of full rights the record earns (Iceland's months worked); absent, all of them. */
  share?(record: WorkRecord, ctx: ClaimContext): number;
  /** What week n of the claim pays, from the basis, after its tiers and any means test on savings. */
  amount(basis: number, week: number, ctx: PayContext): number;
  /** How many weeks it runs; absent, as long as they're out of work. */
  weeks?(record: WorkRecord, ctx: ClaimContext, basis: number): number;
  /** Where the first claim fails, the one that's tried instead (Britain's Universal Credit). */
  fallback?: Benefit;
  /** Waiting days that turn on savings (Australia's liquid assets waiting period), in place of `waitingDays`. */
  wait?(ctx: { savings: number }): number;
  /** A bar for quitting or cause runs at the same time as the waiting days, not after them (Australia). */
  concurrentBar?: boolean;
  source: string;
}

// ---------------------------------------------------------------------------
// Reading the record

/** The paydays in the days before an instant. */
function within(record: WorkRecord, at: Instant, days: number, gapDays = 0): WorkRecord {
  const end = at - gapDays * MS_DAY;
  return record.filter((one) => one.at > end - days * MS_DAY && one.at <= end);
}
const total = (record: WorkRecord, key: 'days' | 'hours' | 'gross') => record.reduce((sum, one) => sum + one[key], 0);

/** The average week's gross over the days the paydays covered. */
function averageWeek(record: WorkRecord): number {
  const days = total(record, 'days');
  return days > 0 ? (total(record, 'gross') / days) * 7 : 0;
}

/** Months of insured work: the days the paydays covered, in months. */
const monthsIn = (record: WorkRecord) => total(record, 'days') / 30.4375;
const weeksIn = (record: WorkRecord) => total(record, 'days') / 7;

/**
 * A US base period, the first four of the last five completed calendar
 * quarters before the job ended: each quarter's gross, highest first.
 */
export function baseQuarters(record: WorkRecord, at: Instant): number[] {
  return baseInOrder(record, at).sort((a, b) => b - a);
}

/** The base period's quarters, the latest first. */
function baseInOrder(record: WorkRecord, at: Instant): number[] {
  const d = new Date(at);
  const current = d.getUTCFullYear() * 4 + Math.floor(d.getUTCMonth() / 3);
  const totals = [0, 0, 0, 0];
  for (const one of record) {
    const q = new Date(one.at);
    const back = current - (q.getUTCFullYear() * 4 + Math.floor(q.getUTCMonth() / 3));
    if (back >= 2 && back <= 5) totals[back - 2]! += one.gross;
  }
  return totals;
}

/** The hours worked in the same base period. */
function baseHours(record: WorkRecord, at: Instant): number {
  const d = new Date(at);
  const current = d.getUTCFullYear() * 4 + Math.floor(d.getUTCMonth() / 3);
  return record.filter((one) => {
    const q = new Date(one.at);
    const back = current - (q.getUTCFullYear() * 4 + Math.floor(q.getUTCMonth() / 3));
    return back >= 2 && back <= 5;
  }).reduce((sum, one) => sum + one.hours, 0);
}

const clampTo = (value: number, min = 0, max = Number.POSITIVE_INFINITY) => Math.min(max, Math.max(min, value));
/** A month's figure as a week's. */
const perWeek = (monthly: number) => (monthly * 12) / 52;
const same = (basis: number) => basis;

// ---------------------------------------------------------------------------
// The US: each state its own

interface StateRules {
  name: string;
  /** The highest quarter, the two highest, or all four, times this is the week's amount. */
  top: 1 | 2 | 4;
  factor: number;
  /** Where a state's formula is more than that (`stateWeekly`). */
  weekly?: (record: WorkRecord, at: Instant) => number;
  waitingDays?: number;
  /** A state's own penalties (Colorado's ten weeks), where not the common one. */
  quit?: Bar;
  cause?: Bar;
  min?: number;
  max: number;
  weeks: number;
  /** Where the weeks are also capped at a share of the base period's wages over the weekly amount. */
  share?: number;
  /** The least the base period must hold, in the state's own tests: its quarters' wages, highest first, and its hours. */
  qualify: (quarters: number[], hours: number) => string | undefined;
  source: string;
}

function usState(o: StateRules): Benefit {
  return {
    name: o.name, waitingDays: o.waitingDays ?? 7, every: 7, quit: o.quit ?? QUIT.US, cause: o.cause ?? CAUSE.US,
    qualifies: (record, ctx) => o.qualify(baseQuarters(record, ctx.at), baseHours(record, ctx.at)),
    basis: (record, ctx) => {
      const q = baseQuarters(record, ctx.at);
      return Math.floor(clampTo(o.weekly ? o.weekly(record, ctx.at) : q.slice(0, o.top).reduce((a, b) => a + b, 0) * o.factor, o.min ?? 0, o.max));
    },
    amount: same,
    weeks: (record, ctx, basis) => {
      if (o.share === undefined || basis <= 0) return o.weeks;
      const base = baseQuarters(record, ctx.at).reduce((a, b) => a + b, 0);
      return Math.min(o.weeks, (base * o.share) / basis);
    },
    source: o.source,
  };
}

/**
 * A state from the labor-law pass (`content/jurisdictions.ts`): the top
 * quarters times the factor, with the formulas that are more than that. Alaska,
 * Utah and Virginia add or take a dollar sum; Montana and Minnesota pay the
 * better of that and a share of the whole base period; North Dakota adds half
 * the third-best quarter; Ohio and New Jersey pay a share of the average week
 * worked in the base period.
 */
function stateWeekly(ui: NonNullable<StateLaw['ui']>): (record: WorkRecord, at: Instant) => number {
  return (record, at) => {
    const q = baseQuarters(record, at);
    const base = q.reduce((a, b) => a + b, 0);
    if (ui.averageWeek !== undefined) {
      const days = baseDays(record, at);
      return days > 0 ? (base / (days / 7)) * ui.averageWeek : 0;
    }
    const top = q.slice(0, ui.top).reduce((a, b) => a + b, 0) + (ui.thirdHalf ? q[2]! / 2 : 0);
    const weekly = top * ui.factor + (ui.offset ?? 0);
    return ui.orBase !== undefined ? Math.max(weekly, base * ui.orBase) : weekly;
  };
}

/** The days worked in the base period. */
function baseDays(record: WorkRecord, at: Instant): number {
  const d = new Date(at);
  const current = d.getUTCFullYear() * 4 + Math.floor(d.getUTCMonth() / 3);
  return record.filter((one) => {
    const q = new Date(one.at);
    const back = current - (q.getUTCFullYear() * 4 + Math.floor(q.getUTCMonth() / 3));
    return back >= 2 && back <= 5;
  }).reduce((sum, one) => sum + one.days, 0);
}

/**
 * A state's tests of the base period, as the pass wrote them: an alternative
 * base period's total, where there is one, stands in for the rest.
 */
function stateQualify(name: string, ui: NonNullable<StateLaw['ui']>, weekly: (record: WorkRecord, at: Instant) => number) {
  const t = ui.qualify;
  return (record: WorkRecord, at: Instant): string | undefined => {
    const inOrder = baseInOrder(record, at);
    const q = [...inOrder].sort((a, b) => b - a);
    const { high, total: all, with: n } = quarterly(q);
    const week = Math.floor(clampTo(weekly(record, at), ui.min, ui.max));
    const hours = baseHours(record, at);
    const fails: string[] = [];
    if (t.quartersWithWages !== undefined && n < t.quartersWithWages) fails.push(`wages in ${t.quartersWithWages} quarters of the base period`);
    if (t.highQuarterMin !== undefined && high < t.highQuarterMin) fails.push(`$${t.highQuarterMin.toLocaleString('en-US')} in the best quarter`);
    if (t.baseMin !== undefined && all < t.baseMin) fails.push(`$${t.baseMin.toLocaleString('en-US')} in the base period`);
    if (t.baseMultipleOfHQ !== undefined && all < t.baseMultipleOfHQ * high) fails.push(`the base period at ${t.baseMultipleOfHQ} times the best quarter`);
    if (t.baseMultipleOfWBA !== undefined && all < t.baseMultipleOfWBA * week) fails.push(`the base period at ${t.baseMultipleOfWBA} times the weekly benefit`);
    if (t.otherQuarterMin !== undefined && q[1]! < t.otherQuarterMin) fails.push(`$${t.otherQuarterMin.toLocaleString('en-US')} in a second quarter`);
    if (t.outsideHQMin !== undefined && all - high < t.outsideHQMin) fails.push(`$${t.outsideHQMin.toLocaleString('en-US')} outside the best quarter`);
    if (t.outsideHQMultipleOfWBA !== undefined && all - high < t.outsideHQMultipleOfWBA * week) fails.push(`${t.outsideHQMultipleOfWBA} times the weekly benefit outside the best quarter`);
    if (t.lastTwoQuartersMin !== undefined && inOrder[0]! + inOrder[1]! < t.lastTwoQuartersMin) fails.push(`$${t.lastTwoQuartersMin.toLocaleString('en-US')} in the base period’s last two quarters`);
    if (t.hoursMin !== undefined && hours < t.hoursMin) fails.push(`${t.hoursMin} hours worked in the base period`);
    if (fails.length === 0 || (t.alternativeBaseMin !== undefined && all >= t.alternativeBaseMin)) return undefined;
    return `${name} needs ${fails.join(', and ')}.`;
  };
}

// ---------------------------------------------------------------------------
// Japan

/** Japan's basic allowance a day from the daily wage, by the formula for the age (MHLW, from 2026-08-01). */
export function japanDaily(w: number, age: number): number {
  if (w < 3_203) return 2_562;
  if (w < 5_480) return Math.floor(0.8 * w);
  const [wageCap, dayCap] = age < 30 ? [14_900, 7_450] : age < 45 ? [16_540, 8_270] : age < 60 ? [18_220, 9_110] : [17_400, 7_830];
  if (age >= 60) {
    if (w <= 12_120) return Math.floor(Math.min(0.8 * w - 0.35 * ((w - 5_480) / (12_120 - 5_480)) * w, 0.05 * w + 12_120 * 0.4));
    return w <= wageCap ? Math.floor(0.45 * w) : dayCap;
  }
  if (w <= 13_490) return Math.floor(0.8 * w - 0.3 * ((w - 5_480) / (13_490 - 5_480)) * w);
  return w <= wageCap ? Math.floor(0.5 * w) : dayCap;
}

/** Japan's benefit days for somebody dismissed, by age and years insured (Hello Work, 所定給付日数). */
export function japanDismissedDays(age: number, years: number): number {
  const col = years < 1 ? 0 : years < 5 ? 1 : years < 10 ? 2 : years < 20 ? 3 : 4;
  const row = age < 30 ? [90, 90, 120, 180, 180]
    : age < 35 ? [90, 120, 180, 210, 240]
      : age < 45 ? [90, 150, 180, 240, 270]
        : age < 60 ? [90, 180, 240, 270, 330]
          : [90, 150, 180, 210, 240];
  return row[col]!;
}

/** Months that count in Japan: 11 paid days or 80 hours in the calendar month. */
function japanMonths(record: WorkRecord, at: Instant, back: number): number {
  const hours = new Map<string, number>();
  for (const one of within(record, at, back * 30.4375)) {
    const key = new Date(one.at).toISOString().slice(0, 7);
    hours.set(key, (hours.get(key) ?? 0) + one.hours);
  }
  return [...hours.values()].filter((h) => h >= 80).length;
}

// ---------------------------------------------------------------------------
// Canada

/**
 * Canada's weeks of regular benefits (canada.ca, "EI regular benefits: how
 * much you could receive"): a row for each 35 insurable hours from 420, its
 * first figure the hours it starts at, then a column for each regional
 * unemployment rate, 6% and under, 6.1 to 7%, and so on to 16% and more.
 */
const EI_WEEKS: readonly (readonly number[])[] = [
  [420, 0, 0, 0, 0, 0, 0, 0, 0, 26, 28, 30, 32],
  [455, 0, 0, 0, 0, 0, 0, 0, 24, 26, 28, 30, 32],
  [490, 0, 0, 0, 0, 0, 0, 23, 25, 27, 29, 31, 33],
  [525, 0, 0, 0, 0, 0, 21, 23, 25, 27, 29, 31, 33],
  [560, 0, 0, 0, 0, 20, 22, 24, 26, 28, 30, 32, 34],
  [595, 0, 0, 0, 18, 20, 22, 24, 26, 28, 30, 32, 34],
  [630, 0, 0, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35],
  [665, 0, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35],
  [700, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36],
  [735, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36],
  [770, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37],
  [805, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37],
  [840, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38],
  [875, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38],
  [910, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39],
  [945, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39],
  [980, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40],
  [1015, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40],
  [1050, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39, 41],
  [1085, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39, 41],
  [1120, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42],
  [1155, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42],
  [1190, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39, 41, 43],
  [1225, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39, 41, 43],
  [1260, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44],
  [1295, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44],
  [1330, 23, 25, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45],
  [1365, 23, 25, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45],
  [1400, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 45],
  [1435, 25, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 45],
  [1470, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 45, 45],
  [1505, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 45, 45],
  [1540, 28, 30, 32, 34, 36, 38, 40, 42, 44, 45, 45, 45],
  [1575, 29, 31, 33, 35, 37, 39, 41, 43, 45, 45, 45, 45],
  [1610, 30, 32, 34, 36, 38, 40, 42, 44, 45, 45, 45, 45],
  [1645, 31, 33, 35, 37, 39, 41, 43, 45, 45, 45, 45, 45],
  [1680, 32, 34, 36, 38, 40, 42, 44, 45, 45, 45, 45, 45],
  [1715, 33, 35, 37, 39, 41, 43, 45, 45, 45, 45, 45, 45],
  [1750, 34, 36, 38, 40, 42, 44, 45, 45, 45, 45, 45, 45],
  [1785, 35, 37, 39, 41, 43, 45, 45, 45, 45, 45, 45, 45],
  [1820, 36, 38, 40, 42, 44, 45, 45, 45, 45, 45, 45, 45],
];

export function eiWeeks(hours: number, regionalRate: number): number {
  const col = regionalRate <= 6 ? 0 : Math.min(11, Math.ceil(regionalRate - 6));
  let weeks = 0;
  for (const row of EI_WEEKS) if (hours >= row[0]!) weeks = row[col + 1]!;
  return weeks;
}

/** The insurable hours a claim needs, by the regional rate: 700 at 6% and under, 35 fewer a point, 420 at 13% and more. */
export function eiHoursNeeded(regionalRate: number): number {
  const col = regionalRate <= 6 ? 0 : Math.min(11, Math.ceil(regionalRate - 6));
  return EI_WEEKS.find((row) => row[col + 1]! > 0)![0]!;
}

/** Best weeks the average is taken over, by the regional rate: 22 at 6% and under, down to 14 over 13%. */
function eiBestWeeks(regionalRate: number): number {
  const col = regionalRate <= 6 ? 0 : Math.min(8, Math.ceil(regionalRate - 6));
  return 22 - col;
}


// ---------------------------------------------------------------------------
// The countries

/**
 * What quitting without good cause, and being let go for cause, does to a
 * claim (`probe/unemployment-research/answers.json`). In the US states and
 * Canada it's nothing paid until the worker has earned their way back, in a
 * new job that would end the claim anyway, so none. Missing shifts is the
 * cause SLATE lets a worker go for: Florida, Washington and Illinois name
 * such absence as misconduct, and the other states' pages are silent on it,
 * so it's held to be misconduct there too. Japan's restriction and Korea's
 * bar are for serious misconduct (重責解雇, 중대한 귀책사유), which three
 * missed shifts aren't, so neither applies.
 */
const QUIT = {
  US: 'none', CA: 'none', GB: { weeks: 13 }, IE: { weeks: 9 }, IS: { weeks: 2 * 52 / 12 }, DE: { weeks: 12, cut: 0.25 }, JP: { weeks: 30 / 7 }, NZ: { weeks: 13 }, AU: { weeks: 4 },
} satisfies Readonly<Record<string, Bar>>;
const CAUSE = {
  US: 'none', CA: 'none', MX: { weeks: 0 }, GB: { weeks: 13 }, IE: { weeks: 9 }, IS: { weeks: 2 * 52 / 12 }, DE: { weeks: 12, cut: 0.25 }, ES: { weeks: 0 }, FR: { weeks: 0 }, JP: { weeks: 0 }, KR: { weeks: 0 }, NZ: { weeks: 13 }, AU: { weeks: 4 },
} satisfies Readonly<Record<string, Bar>>;

/** A base period's quarters, highest first, their total, and how many had wages. */
const quarterly = (q: number[]) => ({ high: q[0]!, total: q.reduce((a, b) => a + b, 0), with: q.filter((one) => one > 0).length });

/** The least a US state's base period must hold (each state's own test). */
const US_QUALIFY: Readonly<Record<string, (q: number[], hours: number) => string | undefined>> = {
  // 221 times the minimum wage, rounded down to $100: $3,500 at the state's
  // $16; at New York City's $17 it would be $3,700, which the state's page
  // didn't settle.
  'US-NY': (q) => {
    const { high, total: all, with: n } = quarterly(q);
    if (n < 2) return 'New York needs wages in two quarters of the base period, the first four of the last five finished quarters.';
    if (high < 3_500) return 'New York needs $3,500 in the best quarter of the base period.';
    return all < 1.5 * high ? 'New York needs the base period’s wages to be half again the best quarter’s.' : undefined;
  },
  'US-CA': (q) => {
    const { high, total: all } = quarterly(q);
    return high >= 1_300 || (high >= 900 && all >= 1.25 * high) ? undefined : 'California needs $1,300 in the best quarter of the base period, or $900 with the year at 1.25 times it.';
  },
  'US-TX': (q) => {
    const { high, total: all, with: n } = quarterly(q);
    const weekly = Math.floor(clampTo(high / 25, 75, 605));
    if (n < 2) return 'Texas needs wages in more than one quarter of the base period, the first four of the last five finished quarters.';
    return all < 37 * weekly ? 'Texas needs base-period wages of 37 times the weekly benefit.' : undefined;
  },
  'US-FL': (q) => {
    const { high, total: all } = quarterly(q);
    return all >= 3_400 && all >= 1.5 * high ? undefined : 'Florida needs $3,400 in the base period, and half again the best quarter.';
  },
  'US-WA': (_q, hours) => (hours >= 680 ? undefined : `Washington needs 680 hours worked in the base period; SLATE has ${Math.floor(hours)} on record.`),
  'US-IL': (q) => {
    const { high, total: all } = quarterly(q);
    return all >= 1_600 && all - high >= 440 ? undefined : 'Illinois needs $1,600 in the base period, $440 of it outside the best quarter.';
  },
  'US-GA': (q) => {
    const { high, total: all, with: n } = quarterly(q);
    const weekly = Math.floor(clampTo((q[0]! + q[1]!) / 42, 55, 365));
    if (n < 2) return 'Georgia needs wages in two quarters of the base period, the first four of the last five finished quarters.';
    return all >= 1.5 * high || all >= 40 * weekly ? undefined : 'Georgia needs the base period at half again the best quarter, or 40 times the weekly benefit.';
  },
};

/**
 * Britain's National Insurance test for New Style JSA: of the two tax years
 * before the last calendar year, earnings of 26 times the lower earnings
 * limit in one and 50 times in each. The limit is 2024/25's £123 a week,
 * the one the research fetched.
 */
function GB_JSA_QUALIFY(record: WorkRecord, ctx: ClaimContext): string | undefined {
  const year = new Date(ctx.at).getUTCFullYear();
  const taxYear = (start: number) => total(record.filter((one) => one.at >= Date.UTC(start, 3, 6) && one.at < Date.UTC(start + 1, 3, 6)), 'gross');
  const years = [taxYear(year - 3), taxYear(year - 2)];
  return years.some((one) => one >= 26 * 123) && years.every((one) => one >= 50 * 123) ? undefined
    : `New Style JSA needs National Insurance paid in the tax years ${year - 3}/${String(year - 2).slice(2)} and ${year - 2}/${String(year - 1).slice(2)}.`;
}

/**
 * Universal Credit, for somebody without the National Insurance: the
 * standard allowance, less £4.35 a month for each £250 of savings over
 * £6,000, and nothing over £16,000; a sanction of 91 days for quitting or
 * misconduct, as New Style JSA's.
 */
const UNIVERSAL_CREDIT: Benefit = {
  name: 'Universal Credit', waitingDays: 0, every: 30, quit: QUIT.GB, cause: CAUSE.GB,
  qualifies: (_record, ctx) => (ctx.age < 18 ? 'Universal Credit is for ages 18 and over.' : undefined),
  basis: () => 0,
  amount: (_basis, _week, ctx) => {
    if (ctx.savings > 16_000) return 0;
    const tariff = ctx.savings > 6_000 ? Math.ceil((ctx.savings - 6_000) / 250) * 4.35 : 0;
    return perWeek(Math.max(0, (ctx.age >= 25 ? 424.90 : 338.58) - tariff));
  },
  source: 'GOV.UK 2026/27: £424.90 a month single at 25 or over, £338.58 under; savings over £6,000 count £4.35 a month for each £250, and over £16,000 there’s none',
};

/**
 * The regional unemployment rate each province's EI is worked at: Toronto,
 * Vancouver and Montreal each needed 665 hours, with the best 21 weeks, for
 * claims from 6 September to 10 October 2026, the 6.1 to 7% column.
 */
const EI_REGION: Readonly<Record<string, number>> = { 'CA-08': 6.5, 'CA-02': 6.5, 'CA-10': 6.5 };

/** Canada's Employment Insurance at a region's unemployment rate. */
function ei(rate: number): Benefit {
  return {
    name: 'Employment Insurance', waitingDays: 7, every: 14, quit: QUIT.CA, cause: CAUSE.CA,
    qualifies: (record, ctx) => {
      const hours = total(within(record, ctx.at, 364), 'hours');
      const need = eiHoursNeeded(rate);
      return hours < need ? `EI needs ${need} insurable hours in the last 52 weeks where you worked; SLATE has ${Math.floor(hours)} on record.` : undefined;
    },
    // 55% of the best weeks' average, to $729.
    basis: (record, ctx) => {
      const best = eiBestWeeks(rate);
      const weeks = within(record, ctx.at, 364).map((one) => ({ week: (one.gross / (one.days || 7)) * 7, count: one.days / 7 })).sort((a, b) => b.week - a.week);
      let need = best;
      let sum = 0;
      for (const one of weeks) {
        const take = Math.min(need, one.count);
        sum += one.week * take;
        need -= take;
        if (need <= 0) break;
      }
      return Math.min(729, (sum / best) * 0.55);
    },
    amount: same,
    weeks: (record, ctx) => eiWeeks(total(within(record, ctx.at, 364), 'hours'), rate),
    source: `canada.ca 2026: 55% of the average of the best weeks, at most $729 a week, after a week’s wait; 14 to 45 weeks by hours worked and the region’s unemployment, here ${rate}%`,
  };
}

/**
 * A country's benefit from the labor-law pass and the finishing pass
 * (`content/jurisdictions.ts`). The amount is one of: a share of the
 * average week over the months before the job ended (of the net where the
 * law says net; a lower share above a threshold, as Italy's; the rate by the
 * months insured, as Mongolia's; with the minimum wage averaged in, as
 * Algeria's); the US-style best quarters (the Virgin Islands'); or a flat
 * week, by the month where it steps (Singapore's, capped at the past pay).
 * It then steps down by the week (a new rate from a week on, or Italy's 3%
 * a month), within its bounds. It runs a number of weeks, a share of the
 * weeks worked (Italy's half, South Africa's fifth), or by the months
 * insured (Iran's table); and needs the months of work the law asks, every
 * other window it names, or the income it names (Norway's). It's paid monthly.
 */
function worldBenefit(iso: string, b: NonNullable<WorldLaw['benefit']>): Benefit {
  const monthsWorked = (record: WorkRecord, at: Instant, months = 36) => monthsIn(within(record, at, months * 30.4375));
  const lookup = (table: readonly (readonly [number, number])[], x: number) => table.reduce((v, [from, value]) => (x >= from ? value : v), table[0]?.[1] ?? 0);
  const factor = (week: number) => {
    const first = b.rates?.[0]?.[1] ?? 1;
    let out = b.rates ? lookup(b.rates, week) / first : 1;
    if (b.decline && week >= b.decline.fromWeek) out *= (1 - b.decline.perMonth) ** (Math.floor((week - b.decline.fromWeek) / (52 / 12)) + 1);
    return out;
  };
  return {
    name: b.name, waitingDays: b.waitingDays, every: 30, quit: b.quit, cause: b.cause,
    qualifies: (record, ctx) => {
      const short = [{ months: b.qualifyMonths, withinMonths: b.withinMonths }, ...(b.also ?? [])]
        .find((t) => t.months > 0 && monthsWorked(record, ctx.at, t.withinMonths) < t.months);
      if (short) return `${b.name} needs ${t(short.months)} of work in the last ${t(short.withinMonths)}; SLATE has ${Math.floor(monthsWorked(record, ctx.at, short.withinMonths))} on record.`;
      if (b.qualifyIncome && !b.qualifyIncome.some((q) => total(within(record, ctx.at, q.withinMonths * 30.4375), 'gross') >= q.amount)) {
        return `${b.name} needs earnings of ${b.qualifyIncome.map((q) => `${q.amount.toLocaleString('en-US')} in the last ${t(q.withinMonths)}`).join(', or ')}.`;
      }
      return undefined;
    },
    basis: (record, ctx) => {
      const week = averageWeek(within(record, ctx.at, (b.basisMonths ?? 12) * 30.4375));
      if (b.flats) return b.capAtPastWeek ? week : Number.POSITIVE_INFINITY;
      if (b.flat !== undefined) return clampTo(b.capAtPastWeek ? Math.min(b.flat, week) : b.flat, b.min ?? 0, b.max);
      if (b.quarters) return clampTo(baseQuarters(record, ctx.at).slice(0, b.quarters.top).reduce((x, y) => x + y, 0) * b.quarters.factor, b.min ?? 0, b.max);
      if (b.quartersSlide) {
        const { top, low, high } = b.quartersSlide;
        const hq = baseQuarters(record, ctx.at).slice(0, top).reduce((x, y) => x + y, 0);
        const along = clampTo((hq - low[0]) / (high[0] - low[0]), 0, 1);
        return clampTo(hq * (low[1] + along * (high[1] - low[1])), b.min ?? 0, b.max);
      }
      let pay = week;
      if (b.ofNet && week > 0) {
        const year = payrollYear(iso, Math.round(week * 52 * 100), { path: [iso], at: ctx.at, age: ctx.age });
        pay = week * (1 - year.lines.reduce((sum, one) => sum + one.amount, 0) / (week * 52 * 100));
      }
      if (b.withMinimum !== undefined) pay = (pay + b.withMinimum) / 2;
      const rate = b.rateByMonths ? lookup(b.rateByMonths, monthsWorked(record, ctx.at)) : b.rate ?? 0;
      const amount = b.threshold !== undefined ? Math.min(pay, b.threshold) * rate + Math.max(0, pay - b.threshold) * (b.rateAbove ?? rate) : pay * rate;
      return clampTo(amount, b.min ?? 0, b.max);
    },
    amount: (basis, week, ctx) => {
      if (b.assetLimit !== undefined && ctx.savings > b.assetLimit) return 0;
      if (b.flats) return Math.min(lookup(b.flats, week), basis);
      return clampTo(basis * factor(week), b.min ?? 0, b.max);
    },
    // With no end in law (Hong Kong's CSSA, Greenland's), it runs as long as they're out of work.
    ...(b.weeks !== undefined || b.weeksShare || b.weeksByMonths ? {
      weeks: (record: WorkRecord, ctx: ClaimContext) => {
        if (b.weeksShare) return Math.min(b.weeksShare.max, weeksIn(within(record, ctx.at, b.weeksShare.withinMonths * 30.4375)) * b.weeksShare.share);
        if (b.weeksByMonths) return lookup(b.weeksByMonths, monthsWorked(record, ctx.at));
        return b.weeks!;
      },
    } : {}),
    source: b.source,
  };
}
/** Months as the law says them: "12 months", or years where they're whole. */
const t = (months: number) => (months % 12 === 0 && months >= 24 ? `${months / 12} years` : `${Math.round(months * 10) / 10} months`);

const WORLD_BENEFITS: Readonly<Record<string, Benefit>> = Object.fromEntries(
  Object.entries(WORLD_LAW).flatMap(([iso, w]) => (w.benefit ? [[iso, worldBenefit(iso, w.benefit)]] : [])),
);

export const BENEFITS: Readonly<Record<string, Benefit>> = {
  // --- The rest of the world, from the labor-law pass; the thirteen's own
  // below replace any of theirs, and a territory that applies another's law
  // and has no benefit of its own takes that country's.
  ...WORLD_BENEFITS,
  // --- The US: the states the research covered --------------------------------
  'US-NY': usState({
    name: 'Unemployment Insurance', top: 1, factor: 1 / 26, max: 869, weeks: 26, qualify: US_QUALIFY['US-NY']!,
    source: 'NY DOL: the high quarter’s wages over 26, at most $869 a week from October 2025, for 26 weeks, the first week unpaid',
  }),
  'US-CA': usState({
    name: 'Unemployment Insurance', top: 1, factor: 1 / 26, min: 40, max: 450, weeks: 26, qualify: US_QUALIFY['US-CA']!,
    source: 'EDD DE 2320: from the highest quarter, about half a week’s pay, $40 to $450, for 26 weeks after an unpaid week',
  }),
  'US-TX': usState({
    name: 'Unemployment Benefits', top: 1, factor: 1 / 25, min: 75, max: 605, weeks: 26, share: 0.27, qualify: US_QUALIFY['US-TX']!,
    source: 'TWC: the highest quarter over 25, $75 to $605 from 5 October 2025, for 26 weeks or 27% of the base period’s wages',
  }),
  'US-FL': usState({
    name: 'Reemployment Assistance', top: 1, factor: 1 / 26, max: 275, weeks: 12, qualify: US_QUALIFY['US-FL']!,
    source: 'FloridaCommerce: the highest quarter over 26, at most $275, for 12 weeks while the state’s unemployment is low',
  }),
  'US-WA': usState({
    name: 'Unemployment Benefits', top: 2, factor: 0.0385 / 2, min: 383, max: 1_208, weeks: 26, share: 1 / 3, qualify: US_QUALIFY['US-WA']!,
    source: 'ESD: 3.85% of the two highest quarters’ average, $383 to $1,208 for claims from 5 July 2026, for 26 weeks or a third of the base period’s wages',
  }),
  'US-IL': usState({
    name: 'Unemployment Insurance', top: 2, factor: 0.47 / 26, min: 51, max: 628, weeks: 26, qualify: US_QUALIFY['US-IL']!,
    source: 'IDES: 47% of the average week in the two highest quarters, $51 to $628 for claims from 1 January 2026, for 26 weeks',
  }),
  'US-GA': usState({
    name: 'Unemployment Insurance', top: 2, factor: 1 / 42, min: 55, max: 365, weeks: 14, qualify: US_QUALIFY['US-GA']!,
    source: 'Georgia DOL: the two highest quarters over 42, $55 to $365, for 14 weeks at the current unemployment rate',
  }),

  // --- The US: the other states, from the labor-law pass -----------------------
  ...Object.fromEntries(Object.entries(STATES).filter(([code]) => !['US-NY', 'US-CA', 'US-TX', 'US-FL', 'US-WA', 'US-IL', 'US-GA'].includes(code)).flatMap(([code, st]) => {
    const ui = st.ui;
    if (!ui) return [];
    const weekly = stateWeekly(ui);
    const qualify = stateQualify(st.name, ui, weekly);
    return [[code, {
      ...usState({
        name: ui.name, top: ui.top === 4 ? 4 : ui.top === 2 ? 2 : 1, factor: ui.factor, weekly, waitingDays: ui.waitingDays, quit: ui.quit, cause: ui.cause,
        min: ui.min, max: ui.max, weeks: ui.weeks, ...(ui.share !== undefined ? { share: ui.share } : {}),
        qualify: () => undefined, source: ui.source,
      }),
      qualifies: (record: WorkRecord, ctx: ClaimContext) => qualify(record, ctx.at),
    }]];
  })),

  // --- Canada: Employment Insurance, by the region's unemployment -----------
  'CA-08': ei(EI_REGION['CA-08']!),
  'CA-02': ei(EI_REGION['CA-02']!),
  'CA-10': ei(EI_REGION['CA-10']!),
  // The other provinces and territories, at their largest city's regional rate.
  ...Object.fromEntries(Object.entries(PROVINCES).filter(([, p]) => p.eiRate !== undefined).map(([code, p]) => [code, ei(p.eiRate!)])),

  // --- Mexico: Mexico City's own insurance ----------------------------------
  'MX-09': {
    name: 'Seguro de Desempleo', waitingDays: 0, every: 30, quit: 'none', cause: CAUSE.MX,
    qualifies: (record, ctx) => (ctx.age < 18 || ctx.age > 64 ? 'Mexico City’s insurance is for ages 18 to 64.'
      : monthsIn(within(record, ctx.at, 365)) < 6 ? 'Mexico City’s insurance needs six months of formal work in the city.' : undefined),
    basis: () => perWeek(3_566.22),
    amount: same,
    weeks: () => 13,
    source: 'Mexico City’s Seguro de Desempleo: 3,566.22 pesos a month, one UMA, for up to three months, for a formal job in the city lost after six months',
  },

  // --- Britain --------------------------------------------------------------
  GB: {
    name: 'New Style Jobseeker’s Allowance', waitingDays: 7, every: 14, quit: QUIT.GB, cause: CAUSE.GB,
    qualifies: GB_JSA_QUALIFY,
    basis: () => 0,
    amount: (_basis, _week, ctx) => (ctx.age >= 25 ? 95.55 : 75.65),
    weeks: () => 26,
    fallback: UNIVERSAL_CREDIT,
    source: 'GOV.UK: New Style JSA, £95.55 a week at 25 or over and £75.65 under, for up to 182 days after up to seven waiting days, on National Insurance paid',
  },

  // --- Ireland --------------------------------------------------------------
  IE: {
    name: 'Jobseeker’s Pay-Related Benefit', waitingDays: 0, every: 7, quit: QUIT.IE, cause: CAUSE.IE,
    qualifies: (record, ctx) => {
      const paid = weeksIn(record);
      if (paid < 104) return `Jobseeker’s Pay-Related Benefit needs 104 weeks of PRSI paid; SLATE has ${Math.floor(paid)} on record. Jobseeker’s Allowance, the means-tested one, isn’t modeled.`;
      if (weeksIn(within(record, ctx.at, 364)) < 26) return 'It needs 26 weeks of PRSI paid in the year before the job ended.';
      return undefined;
    },
    // The average week over the twelve months that ended eight weeks before the job did.
    basis: (record, ctx) => averageWeek(within(record, ctx.at, 365, 56)),
    amount: (basis, week) => (week <= 26 ? clampTo(basis * 0.5, 125, 300) : 0),
    weeks: () => 26,
    source: 'gov.ie: with 104 to 259 contributions, 50% of the average week to €300, at least €125, for 26 weeks (the 60% and 55% tiers need five years, more than SLATE records)',
  },

  // --- Iceland --------------------------------------------------------------
  IS: {
    name: 'Atvinnuleysisbætur', waitingDays: 0, every: 30, quit: QUIT.IS, cause: CAUSE.IS,
    qualifies: (record, ctx) => {
      const months = monthsIn(within(record, ctx.at, 365));
      const need = ctx.at >= Date.UTC(2026, 8, 1) ? 7 : 3;
      return months < need ? `Atvinnuleysisbætur need ${need} months of work in Iceland; SLATE has ${months.toFixed(1)} on record in the last year.` : undefined;
    },
    // Rights, a twelfth for each month worked; the income-linked part is 70%
    // of the average month, in weeks three to fifteen, and the basic rate
    // either side, both by the rights.
    share: (record, ctx) => Math.min(1, monthsIn(within(record, ctx.at, 365)) / 12),
    basis: (record, ctx) => (averageWeek(within(record, ctx.at, 365)) * 52) / 12,
    amount: (basis, week, ctx) => perWeek(week >= 3 && week <= 15 ? Math.min(0.7 * basis, 605_159) : 383_870) * ctx.share,
    weeks: (_record, ctx) => (ctx.at >= Date.UTC(2026, 6, 1) ? 104 : 130),
    source: 'island.is: 383,870 kr a month at full rights from 1 January 2026, a twelfth of them for each month worked; 70% of the average pay to 605,159 kr for three months after two weeks; for 24 months on claims from 1 July 2026',
  },

  // --- Germany --------------------------------------------------------------
  DE: {
    name: 'Arbeitslosengeld', waitingDays: 0, every: 30, quit: QUIT.DE, cause: CAUSE.DE,
    qualifies: (record, ctx) => {
      const months = monthsIn(within(record, ctx.at, 30 * 30.4375));
      return months < 12 ? `Arbeitslosengeld needs 12 months insured in the last 30; SLATE has ${months.toFixed(1)} on record.` : undefined;
    },
    // 60% of the net of the last year's average pay, the net by Germany's own payslip.
    basis: (record, ctx) => {
      const week = averageWeek(within(record, ctx.at, 365));
      const year = payrollYear('DE', Math.round(week * 52 * 100), { path: ['DE'], at: ctx.at, age: ctx.age });
      const taken = year.lines.reduce((sum, line) => sum + line.amount, 0) / 100;
      return week * 0.6 * (1 - taken / (week * 52 || 1));
    },
    amount: same,
    weeks: (record, ctx) => {
      const months = monthsIn(within(record, ctx.at, 5 * 365));
      const steps: readonly (readonly [number, number, number])[] = [[12, 0, 6], [16, 0, 8], [20, 0, 10], [24, 0, 12], [30, 50, 15], [36, 55, 18], [48, 58, 24]];
      let got = 0;
      for (const [need, age, gives] of steps) if (months >= need && ctx.age >= age) got = gives;
      return (got * 52) / 12;
    },
    source: 'SGB III §§147, 149: 60% of the flat-rate net pay, after 12 months insured in 30, for 6 months, 8 after 16, 10 after 20 and 12 after 24; longer from 50',
  },

  // --- Spain ----------------------------------------------------------------
  ES: {
    name: 'Prestación por desempleo', waitingDays: 0, every: 30, quit: 'none', cause: CAUSE.ES,
    qualifies: (record, ctx) => {
      const days = total(within(record, ctx.at, 6 * 365), 'days');
      return days < 360 ? `The prestación needs 360 days of contributions in six years; SLATE has ${Math.floor(days)} on record.` : undefined;
    },
    // The base reguladora: the last 180 days' pay, a week's worth.
    basis: (record, ctx) => averageWeek(within(record, ctx.at, 180)),
    amount: (basis, week) => clampTo(basis * (week <= 26 ? 0.7 : 0.6), perWeek(560), perWeek(1_225)),
    weeks: (record, ctx) => (Math.min(720, Math.floor(total(within(record, ctx.at, 6 * 365), 'days') / 180) * 60)) / 7,
    source: 'SEPE 2026: 70% of the base reguladora for 180 days and 60% after, €560 to €1,225 a month without children; 120 days for 360 days contributed, 60 more for each 180, to 720',
  },

  // --- France ---------------------------------------------------------------
  FR: {
    name: 'Allocation d’aide au retour à l’emploi', waitingDays: 7, every: 30, quit: 'none', cause: CAUSE.FR,
    qualifies: (record, ctx) => {
      const back = within(record, ctx.at, (ctx.age >= 55 ? 36 : 24) * 30.4375);
      return monthsIn(back) < 6 && total(back, 'hours') < 910 ? 'The ARE needs six months, 130 days or 910 hours, worked in the last 24 months.' : undefined;
    },
    // The reference daily wage, a week's worth.
    basis: (record, ctx) => averageWeek(within(record, ctx.at, (ctx.age >= 55 ? 36 : 24) * 30.4375)),
    amount: (basis) => {
      const sjr = basis / 7;
      const day = Math.min(Math.max(0.404 * sjr + 13.18, 0.57 * sjr, 32.13), 0.75 * sjr);
      return day * 7;
    },
    weeks: (record, ctx) => {
      const days = total(within(record, ctx.at, 24 * 30.4375), 'days');
      return clampTo(days * 0.75, 182, 548) / 7;
    },
    source: 'Unédic, July 2025 rates unchanged in 2026: the greater of 40.4% of the daily wage plus €13.18 or 57%, at least €32.13, never over 75%; a day paid for each day worked times 0.75, 182 to 548',
  },

  // --- Japan ----------------------------------------------------------------
  JP: {
    name: '基本手当', waitingDays: 7, every: 28, quit: QUIT.JP, cause: CAUSE.JP,
    qualifies: (record, ctx) => {
      const recent = within(record, ctx.at, 182);
      if (recent.length > 0 && total(recent, 'hours') / (total(recent, 'days') / 7 || 1) < 20) return 'Employment insurance covers work of 20 hours a week or more.';
      const dismissed = ctx.why !== 'quit';
      const months = japanMonths(record, ctx.at, dismissed ? 12 : 24);
      const need = dismissed ? 6 : 12;
      return months < need ? `基本手当 needs ${need} insured months in the last ${dismissed ? 'year' : 'two years'}, each with 80 hours or 11 paid days; SLATE has ${months} on record.` : undefined;
    },
    // The daily wage: the last six months' pay over 180, and its allowance, a week's worth.
    basis: (record, ctx) => japanDaily(total(within(record, ctx.at, 182), 'gross') / 180, ctx.age) * 7,
    amount: same,
    weeks: (record, ctx) => {
      const years = monthsIn(record) / 12;
      const days = ctx.why === 'quit' ? (years < 10 ? 90 : years < 20 ? 120 : 150) : japanDismissedDays(ctx.age, years);
      return days / 7;
    },
    source: 'MHLW from 1 August 2026: 80% to 50% of the daily wage by the formula for the age, 2,562 yen a day at least; Hello Work: 90 to 330 days by age and years insured, 90 for a quit under ten years',
  },

  // --- Korea ----------------------------------------------------------------
  KR: {
    name: '구직급여', waitingDays: 7, every: 28, quit: 'none', cause: CAUSE.KR,
    qualifies: (record, ctx) => {
      const days = total(within(record, ctx.at, 18 * 30.4375), 'days');
      return days < 180 ? `구직급여 needs 180 insured days in the last 18 months; SLATE has ${Math.floor(days)} on record.` : undefined;
    },
    // 60% of the average daily wage over the last three months, between the floor and the cap, a week's worth.
    basis: (record, ctx) => clampTo((total(within(record, ctx.at, 91), 'gross') / 91) * 0.6, 66_048, 68_100) * 7,
    amount: same,
    // 고용보험법 별표1: days by years insured, more from 50.
    weeks: (record, ctx) => {
      const years = monthsIn(record) / 12;
      const col = years < 1 ? 0 : years < 3 ? 1 : years < 5 ? 2 : years < 10 ? 3 : 4;
      return (ctx.age >= 50 ? [120, 180, 210, 240, 270] : [120, 150, 180, 210, 240])[col]! / 7;
    },
    source: 'MOEL 2026: 60% of the average daily wage, 66,048 to 68,100 won a day; 고용보험법 별표1: 120 to 240 days by years insured, 120 to 270 from 50',
  },

  // --- New Zealand ----------------------------------------------------------
  NZ: {
    name: 'Jobseeker Support', waitingDays: 7, every: 7, quit: QUIT.NZ, cause: CAUSE.NZ,
    qualifies: (_record, ctx) => (ctx.age < 18 ? 'Jobseeker Support is for ages 18 and over.' : undefined),
    basis: () => 0,
    // Income-tested past $160 a week, and nothing comes in while claiming;
    // savings aren't tested.
    amount: (_basis, _week, ctx) => (ctx.age >= 25 ? 426.12 : ctx.age >= 20 ? 367.88 : 309.65),
    source: 'Work and Income from 1 April 2026: $426.12 a week single at 25 or over, $367.88 at 20 to 24, $309.65 at 18 or 19 (the rate at home, the one the research found); a week’s stand-down, 13 weeks for leaving a job without good reason',
  },

  // --- Australia ------------------------------------------------------------
  AU: {
    name: 'JobSeeker Payment', waitingDays: 7, every: 14, quit: QUIT.AU, cause: CAUSE.AU, concurrentBar: true,
    // The liquid assets waiting period, a week for each $500 over $5,000 from
    // $5,500, to 13, and then the ordinary week.
    wait: ({ savings }) => (savings >= 5_500 ? Math.min(13, Math.floor((savings - 5_000) / 500)) * 7 : 0) + 7,
    qualifies: (_record, ctx) => (ctx.age < 18 ? 'JobSeeker and Youth Allowance are for ages 18 and over.' : undefined),
    basis: () => 0,
    // Youth Allowance under 22, living away from home; nothing over the
    // assets limit for somebody who doesn't own a home.
    amount: (_basis, _week, ctx) => (ctx.savings > 600_000 ? 0 : (ctx.age < 22 ? 677.20 : 824.90) / 2),
    source: 'DSS Social Security Guide, 21 September 2026: JobSeeker $824.90 a fortnight single, Youth Allowance $677.20 at 18 to 21 away from home; a week for each $500 of savings over $5,000 from $5,500, to 13, then an ordinary week; nothing over $600,000 of assets without a home; no time limit',
  },
};

/** Where the law has no unemployment benefit, or one SLATE couldn't size: the place's name and what says so. */
export function noBenefitAt(path: readonly string[]): { name: string; source: string; unsized?: true } | undefined {
  const w = WORLD_LAW[path[0] ?? ''];
  if (benefitAt(path)) return undefined;
  return w?.noBenefit ?? (w?.unsized ? { ...w.unsized, unsized: true } : undefined);
}

/** The benefit where a job was: a state's or region's own, then the country's, then the one whose law a territory applies. */
export function benefitAt(path: readonly string[]): Benefit | undefined {
  const iso = path[0] ?? '';
  const follows = WORLD_LAW[iso]?.benefitOf ?? WORLD_LAW[iso]?.follows;
  return BENEFITS[path[1] ?? ''] ?? BENEFITS[iso] ?? (follows ? BENEFITS[follows] : undefined);
}
