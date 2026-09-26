/**
 * SLATE — what the law where they work adds to a shift and a job.
 *
 * For each of the thirteen countries SLATE pays a life in: the premiums a
 * shift earns for when it falls, the point past which hours are overtime,
 * the paid leave the hours build, sick pay for a day called in, the extra
 * payments the law requires on their dates, Korea's weekly paid rest day
 * and its severance, the notice a worker gives on quitting, and the notice
 * and redundancy pay an employer owes on cutting a job. From the
 * research of 2026-09-25 (`probe/job-research/<ISO>.json`, `law`), with the
 * statute or agreement beside each. Where the law leaves a rate to the
 * contract or the collective agreement, SLATE uses the agreement that covers
 * the work where the research found one (Iceland's Efling–SA tables,
 * Australia's awards), and nothing where it didn't.
 *
 * Every other country has none of this, and the work screen says so.
 */

import { WORLD_WORK } from './work-world';

/** Which lines of work a premium covers; absent, every line. */
type Lines = readonly string[];

export interface Premium {
  /** Extra, as a share of the hourly rate: 0.25 is time and a quarter. */
  extra: number;
  lines?: Lines;
  /** For a holiday premium, only these days: 'MM-DD' dates, or the holiday's English name. */
  only?: readonly string[];
  /** A different extra for some lines of work, where each has its own award. */
  byLine?: Readonly<Record<string, number>>;
  /** A holiday worked also earns a paid day off in lieu (New Zealand's alternative holiday). */
  dayInLieu?: boolean;
  source: string;
}

export interface NightPremium extends Premium {
  /** The hours of the day the premium covers, as [from, to) on the clock; to may be past 24. */
  from: number;
  to: number;
}

/**
 * A premium for hours in a window of the day, on some days of the week, as a
 * share of the rate or a flat sum an hour in the country's money (Australia's
 * Hospitality award pays its late hours in dollars).
 */
export interface WindowPremium {
  name: string;
  from: number;
  to: number;
  extra?: number;
  flat?: number;
  lines?: Lines;
  /** The days it's paid, 0 for Sunday; absent, every day. */
  weekdays?: readonly number[];
  source: string;
}

export interface LaborLaw {
  /** Premiums for hours in a window, by line and day, where a line's award or agreement has its own. */
  windows?: readonly WindowPremium[];
  /**
   * Lines of work that can't be employed on a public holiday (Germany: ArbZG
   * §9 and §10); their shift falls away and the day is paid as if worked.
   */
  holidayOff?: { lines: Lines; source: string };
  /** Lines of work that can't be employed on a Sunday (Germany: ArbZG §9); their Sunday shift moves to a free weekday. */
  sundayOff?: { lines: Lines; source: string };
  saturday?: Premium;
  sunday?: Premium;
  /** A shift on a public holiday: its extra over the ordinary rate. */
  holiday?: Premium;
  /** An evening or night shift premium, where the law or the agreement sets one. */
  evening?: NightPremium;
  night?: NightPremium;
  overtime?: {
    /** Hours past which a week's work is overtime, and a day's. */
    week?: number;
    day?: number;
    extra: number;
    /** A second tier: hours of overtime a week past which the extra rises (Mexico). */
    tierAfter?: number;
    tierExtra?: number;
    source: string;
  };
  /** Paid annual leave, as hours earned for each hour worked. */
  leave?: {
    accrual: number;
    /** It can be taken only after so many months with the employer. */
    usableAfterMonths?: number;
    /** Paid on top of the leave's pay: Australia's loading, Mexico's prima vacacional. */
    loading?: number;
    /** What isn't taken is paid out when the job ends. */
    paidOut: boolean;
    /** Paid with each paycheck as a share of gross, not as time off (Canada's vacation pay). */
    asPay?: number;
    /**
     * What happens to leave not taken: a leave year starting on the hiring's
     * anniversary or a date ('MM-DD'), so many months' grace after it, and
     * then lost, or paid out. Absent, it carries over until the job ends.
     */
    expiry?: { yearStart: 'hire' | string; graceMonths: number; action: 'lose' | 'payout'; source: string };
    /**
     * Leave granted in days at a time rather than built with the hours
     * (Japan): the first grant after so many months, then one a year, each
     * year's days for full time, and fewer by the days a week for part-time
     * work of few enough days and hours, for enough of the shifts attended.
     */
    grants?: {
      firstAfterMonths: number;
      days: readonly number[];
      partTime: { maxDays: number; underHours: number; byDays: Readonly<Record<number, readonly number[]>> };
      minAttendance: number;
      source: string;
    };
    source: string;
  };
  sick?: {
    /** The day of a spell from which it's paid, 1 for the first. */
    fromDay: number;
    rate: number;
    /** Most a day, in the country's money, whole units. */
    capDay?: number;
    /** Paid days a year, where the law gives a number; hours accrued per hour worked, where it builds. */
    daysAYear?: number;
    accrual?: number;
    /** Only after so many months with the employer. */
    afterMonths?: number;
    /** The most sick hours used in a year, where the law caps them. */
    maxHoursAYear?: number;
    /** Who pays it: the employer, or the state's sickness insurance. */
    paidBy: 'employer' | 'state';
    source: string;
  };
  extras?: readonly Extra[];
  /** Korea's weekly paid rest day, for 15 hours a week or more. */
  weeklyRestDay?: { minHours: number; source: string };
  /** Korea's severance: so many days' pay a year worked, after a year. */
  severance?: { daysAYear: number; afterMonths: number; minHours: number; source: string };
  /** Notice a worker gives on quitting, in days, by months with the employer. */
  quitNotice?: { steps: readonly (readonly [number, number])[]; source: string };
  /**
   * Notice an employer gives to let a worker go for no fault of theirs, in
   * days, by months with the employer, with a week more for an older worker
   * where the law adds one (Australia).
   */
  employerNotice?: { steps: readonly (readonly [number, number])[]; older?: { age: number; afterMonths: number; days: number }; source: string };
  /** What the law pays a worker whose job goes for no fault of theirs. */
  redundancy?: Redundancy;
  /** A state's or province's own rules, over the country's, by jurisdiction code. */
  regions?: Readonly<Record<string, Omit<LaborLaw, 'regions'>>>;
}

export type Extra =
  /** A fixed sum on a date, prorated by the job's share of full time (Iceland's bonuses). */
  | { kind: 'fixed'; name: string; month: number; day: number; amount: number; fullTimeHours: number; minWeeks?: number; source: string }
  /** So many days' pay on a date, prorated by the year worked (Mexico's aguinaldo). */
  | { kind: 'days'; name: string; month: number; day: number; days: number; source: string }
  /** A month's pay, the average of the months before, in each of these months (Spain's pagas extraordinarias). */
  | { kind: 'month'; name: string; months: readonly number[]; source: string };

/**
 * Redundancy pay, in weeks of pay: so many for each year with the employer,
 * by the worker's age in that year where the law sets bands, or read off a
 * table at whole years; after a qualifying time, with weeks on top, and caps
 * on the years, the weeks and what a week's pay counts for.
 */
export interface Redundancy {
  afterMonths: number;
  weeksAYear?: number;
  /** [from age, weeks a year], for the age during each year counted (Britain). */
  byAge?: readonly (readonly [number, number])[];
  /** Past so many years, a different number of weeks a year (France). */
  later?: { afterYears: number; weeksAYear: number };
  /** [whole years, weeks], the weeks at the most years reached (Australia). */
  table?: readonly (readonly [number, number])[];
  plus?: number;
  /** Only whole years count, not the part of one. */
  wholeYears?: boolean;
  maxYears?: number;
  maxWeeks?: number;
  /** The most a week's pay counts for, in the country's money. */
  weekCap?: number;
  /** Paid free of income tax and contributions. */
  taxFree?: boolean;
  source: string;
}

const PART_LINES = ['school', 'hospitality', 'armed_forces'];

/** Britain's employer notice: a week after a month, then a week a whole year from two, to twelve. */
const GB_NOTICE: readonly (readonly [number, number])[] = [[0, 0], [1, 7], ...Array.from({ length: 11 }, (_, i) => [(i + 2) * 12, (i + 2) * 7] as const)];
/** Ontario's and British Columbia's: a week after three months, two after a year, then a week a year from three, to eight. */
const CA_NOTICE: readonly (readonly [number, number])[] = [[0, 0], [3, 7], [12, 14], ...Array.from({ length: 6 }, (_, i) => [(i + 3) * 12, (i + 3) * 7] as const)];

export const LABOR: Readonly<Record<string, LaborLaw>> = {
  US: {
    overtime: { week: 40, extra: 0.5, source: 'FLSA: time and a half past 40 hours a week' },
    quitNotice: { steps: [[0, 0]], source: 'At will: no notice either way' },
    employerNotice: { steps: [[0, 0]], source: 'At will: no notice either way; the WARN Acts only for closings and mass layoffs' },
    // Sick leave where a state's law builds it; Texas, Florida and Georgia
    // have none.
    regions: {
      'US-NY': { sick: { fromDay: 1, rate: 1, accrual: 1 / 30, maxHoursAYear: 56, paidBy: 'employer', source: 'NY Labor Law §196-b and NYC ESSTA: an hour for every 30 worked, 56 hours a year at 100 employees or more' } },
      'US-CA': {
        sick: { fromDay: 1, rate: 1, accrual: 1 / 30, maxHoursAYear: 40, paidBy: 'employer', source: 'CA Labor Code §246: an hour for every 30 worked, 40 hours a year' },
        overtime: { week: 40, day: 8, extra: 0.5, source: 'CA Labor Code §510: time and a half past 8 hours a day or 40 a week' },
      },
      'US-WA': { sick: { fromDay: 1, rate: 1, accrual: 1 / 40, paidBy: 'employer', source: 'RCW 49.46.210: an hour for every 40 worked' } },
      'US-IL': { sick: { fromDay: 1, rate: 1, accrual: 1 / 40, maxHoursAYear: 40, paidBy: 'employer', source: 'Paid Leave for All Workers Act: an hour for every 40 worked, 40 hours a year' } },
    },
  },
  CA: {
    leave: { accrual: 0, paidOut: true, asPay: 0.04, source: 'Vacation pay: 4% of gross, on each paycheck for hourly work' },
    quitNotice: { steps: [[0, 0]], source: 'No statutory notice from an employee in Ontario, British Columbia or Quebec' },
    employerNotice: { steps: [[0, 0], [3, 7], [12, 14], [60, 28], [120, 56]], source: 'Quebec’s labor standards: a week after three months, two after a year, four after five, eight after ten' },
    regions: {
      'CA-08': {
        employerNotice: { steps: CA_NOTICE, source: 'Ontario ESA: a week after three months, two after a year, then a week a year from three, to eight' },
        redundancy: { afterMonths: 60, weeksAYear: 1, maxWeeks: 26, source: 'Ontario ESA severance pay: a week a year after five years, to 26, where the payroll is $2.5 million or more, as the chains on record have' },
        holiday: { extra: 0.5, source: 'Ontario ESA: time and a half for a public holiday worked' },
        overtime: { week: 44, extra: 0.5, source: 'Ontario ESA: time and a half past 44 hours a week' },
      },
      'CA-02': {
        employerNotice: { steps: CA_NOTICE, source: 'BC ESA: a week after three months, two after a year, three after three, then a week a year, to eight' },
        holiday: { extra: 0.5, source: 'BC ESA: time and a half for a statutory holiday worked' },
        overtime: { week: 40, day: 8, extra: 0.5, source: 'BC ESA: time and a half past 8 hours a day or 40 a week' },
        sick: { fromDay: 1, rate: 1, daysAYear: 5, afterMonths: 3, paidBy: 'employer', source: 'BC ESA: five paid sick days a year after 90 days' },
      },
      'CA-10': {
        overtime: { week: 40, extra: 0.5, source: 'Quebec Act respecting labour standards: time and a half past 40 hours' },
        sick: { fromDay: 1, rate: 1, daysAYear: 2, afterMonths: 3, paidBy: 'employer', source: 'Quebec’s labor standards: two paid days a year after three months' },
      },
    },
  },
  MX: {
    sunday: { extra: 0.25, source: 'LFT art. 71: prima dominical, 25%' },
    holiday: { extra: 2, source: 'LFT art. 75: a rest day worked is paid double on top, three times in all' },
    overtime: { week: 48, extra: 1, tierAfter: 9, tierExtra: 2, source: 'LFT arts. 67–68: double for the first nine hours a week, triple after' },
    leave: { accrual: 12 / 300, usableAfterMonths: 12, loading: 0.25, paidOut: true, source: 'LFT art. 76 since 2023: 12 days after the first year; prima vacacional 25% (art. 80)' },
    sick: { fromDay: 4, rate: 0.6, paidBy: 'state', source: 'IMSS: 60% of the daily wage from the fourth day' },
    extras: [{ kind: 'days', name: 'Aguinaldo', month: 12, day: 20, days: 15, source: 'LFT art. 87: 15 days’ pay by 20 December, pro rata' }],
    quitNotice: { steps: [[0, 0]], source: 'LFT: a worker may leave at any time' },
    employerNotice: { steps: [[0, 0]], source: 'LFT arts. 46–50: no notice; a dismissal without cause is paid for instead' },
    redundancy: { afterMonths: 0, plus: 90 / 7, weeksAYear: 12 / 7, source: 'LFT arts. 48, 50 and 162: three months’ pay for a dismissal without cause, and the seniority premium of 12 days a year' },
  },
  GB: {
    leave: {
      accrual: 0.1207, paidOut: true, source: 'Working Time Regulations: 5.6 weeks, 12.07% of hours worked',
      expiry: { yearStart: 'hire', graceMonths: 0, action: 'lose', source: 'ACAS: the 5.6 weeks must be taken in the leave year, which starts on the job’s anniversary where nothing else is agreed; the employer must warn of it first' },
    },
    sick: { fromDay: 1, rate: 0.8, capDay: 123.25 / 5, paidBy: 'employer', source: 'Statutory Sick Pay from 6 April 2026: 80% of pay or £123.25 a week, from the first day' },
    quitNotice: { steps: [[0, 0], [1, 7]], source: 'Employment Rights Act 1996 s.86: a week, after a month' },
    employerNotice: { steps: GB_NOTICE, source: 'Employment Rights Act 1996 s.86: a week after a month, then a week a whole year from two, to twelve' },
    redundancy: {
      afterMonths: 24, byAge: [[0, 0.5], [22, 1], [41, 1.5]], wholeYears: true, maxYears: 20, weekCap: 751, taxFree: true,
      source: 'Statutory redundancy pay after two years: half a week a year under 22, a week to 40, a week and a half from 41, twenty years at most, a week’s pay at most £751 from 6 April 2026; the first £30,000 tax-free',
    },
  },
  IE: {
    holiday: { extra: 1, source: 'Organisation of Working Time Act 1997: an extra day’s pay for a public holiday worked' },
    leave: {
      accrual: 0.08, paidOut: true, source: 'Organisation of Working Time Act 1997 s.19: 8% of hours worked',
      expiry: { yearStart: '04-01', graceMonths: 6, action: 'lose', source: 'Citizens Information: the leave year runs 1 April to 31 March, and leave is taken in it or, by agreement, within six months after' },
    },
    sick: { fromDay: 1, rate: 0.7, capDay: 110, daysAYear: 5, afterMonths: 3, paidBy: 'employer', source: 'Sick Leave Act 2022: 5 days in 2026 at 70%, at most €110 a day, after 13 weeks' },
    quitNotice: { steps: [[0, 0], [3, 7]], source: 'Minimum Notice and Terms of Employment Act 1973: a week, after 13 weeks' },
    employerNotice: { steps: [[0, 0], [3, 7], [24, 14], [60, 28], [120, 42], [180, 56]], source: 'Minimum Notice and Terms of Employment Act 1973 s.4: a week after 13 weeks, two after two years, four after five, six after ten, eight after fifteen' },
    redundancy: { afterMonths: 24, weeksAYear: 2, plus: 1, weekCap: 600, taxFree: true, source: 'Redundancy Payments Acts: two weeks a year and a week more after two years, a week’s pay at most €600, tax-free' },
  },
  IS: {
    evening: { extra: 0.33, from: 17, to: 24, lines: PART_LINES, source: 'Efling–SA shift premiums: weekday evenings 17:00–24:00, 33%' },
    night: { extra: 0.45, from: 24, to: 32, lines: PART_LINES, source: 'Efling–SA: nights 00:00–08:00, 45%' },
    saturday: { extra: 0.45, lines: [...PART_LINES, 'retail', 'office'], byLine: { retail: 0.383, office: 0.394 }, source: 'Efling–SA: weekends, 45%; VR–SA: all of the weekend as eftirvinna, 0.8235% of the monthly wage an hour for shop work and 0.875% for office work' },
    sunday: { extra: 0.45, lines: [...PART_LINES, 'retail', 'office'], byLine: { retail: 0.383, office: 0.394 }, source: 'Efling–SA: weekends, 45%; VR–SA: all of the weekend as eftirvinna' },
    holiday: { extra: 1.383, only: ['01-01', '06-17', '12-25', 'Good Friday', 'Easter Sunday', 'Whit Sunday', 'Pentecost'], byLine: { retail: 1.309, office: 1.19 }, source: 'Efling–SA: major holidays at 1.375% of the monthly wage an hour, 2.383 times the day rate; VR–SA the same 1.375%, on its own divisors' },
    windows: [
      { name: 'Evening Premium', from: 18, to: 24, extra: 0.383, lines: ['retail'], weekdays: [1, 2, 3, 4, 5], source: 'VR–SA, 1 April 2026: shop work after 18:00 on a weekday is eftirvinna, 0.8235% of the monthly wage an hour, 38.3% over the day rate' },
      { name: 'Night Premium', from: 24, to: 31, extra: 0.482, lines: ['retail'], source: 'VR–SA: næturvinna from midnight to 07:00, 0.8824% of the monthly wage, 48.2% over' },
      { name: 'Evening Premium', from: 17, to: 24, extra: 0.394, lines: ['office'], weekdays: [1, 2, 3, 4, 5], source: 'VR–SA: office work after 17:00 is eftirvinna, 0.875% of the monthly wage, 39.4% over the day rate' },
      { name: 'Night Premium', from: 24, to: 31, extra: 0.493, lines: ['office'], source: 'VR–SA: næturvinna, 0.9375% of the monthly wage, 49.3% over' },
    ],
    overtime: { week: 40, extra: 0.8, source: 'Efling–SA: yfirvinna at 1.0385% of the monthly wage, an 80% premium' },
    leave: { accrual: 0.1017, paidOut: true, source: 'Holiday Act 30/1987 and the agreements: orlof at 10.17%' },
    sick: { fromDay: 1, rate: 1, accrual: 2 * 8 / 173.33, paidBy: 'employer', source: 'Efling–SA: 2 days’ full pay for each month worked in the first year' },
    extras: [
      { kind: 'fixed', name: 'Orlofsuppbót', month: 6, day: 1, amount: 62_000, fullTimeHours: 40, source: 'Efling–SA 2026: 62,000 kr on 1 June, by job share' },
      { kind: 'fixed', name: 'Desemberuppbót', month: 12, day: 15, amount: 114_000, fullTimeHours: 40, minWeeks: 12, source: 'Efling–SA 2026: 114,000 kr by 15 December, by job share, after 12 weeks' },
    ],
    quitNotice: { steps: [[0, 0], [0.5, 12], [3, 30], [24, 60], [36, 90]], source: 'Efling–SA: 12 days to three months, then a month, two after two years, three after three' },
    employerNotice: { steps: [[0, 0], [0.5, 12], [3, 30], [24, 60], [36, 90]], source: 'Efling–SA: the same notice both ways; no statutory severance' },
  },
  FR: {
    holiday: { extra: 1, only: ['05-01'], source: 'Code du travail L3133-6: 1 May worked is paid double' },
    overtime: { week: 35, extra: 0.25, tierAfter: 8, tierExtra: 0.5, source: 'Code du travail L3121-36: 25% from the 36th hour, 50% from the 44th' },
    leave: { accrual: 5 / 47, paidOut: true, source: 'Code du travail L3141-3: 2.5 days a month, five weeks' },
    sick: { fromDay: 4, rate: 0.5, capDay: 42.97, paidBy: 'state', source: 'Sécurité sociale: 50% after three waiting days, at most €42.97 a day' },
    quitNotice: { steps: [[0, 7]], source: 'Set by the branch agreement; a week is the common minimum for hourly work' },
    employerNotice: { steps: [[0, 7], [6, 30], [24, 60]], source: 'Code du travail L1234-1: a month from six months, two from two years; before six months the branch agreement’s, a week being the common minimum' },
    redundancy: { afterMonths: 8, weeksAYear: 52 / 12 / 4, later: { afterYears: 10, weeksAYear: 52 / 12 / 3 }, taxFree: true, source: 'Code du travail R1234-2: a quarter of a month’s pay a year for ten years and a third after, from eight months; the legal amount is free of income tax and contributions' },
  },
  DE: {
    night: { extra: 0.25, from: 23, to: 30, source: 'ArbZG §6(5), and the Federal Labor Court’s 25% as the reasonable supplement' },
    sundayOff: { lines: ['retail', 'office', 'trades'], source: 'ArbZG §9: no work on a Sunday outside the trades §10 allows; Berlin’s shop-opening law (§3) shuts shops on Sundays and public holidays' },
    holidayOff: { lines: ['retail', 'office', 'trades'], source: 'ArbZG §9 and §10: no work on a public holiday outside the trades §10 allows, restaurants, care and security among them and shops, offices and building sites not; EFZG §2 pays a day lost to a holiday as if worked' },
    leave: { accrual: 4 / 48, paidOut: true, source: 'BUrlG: 20 days on a five-day week' },
    sick: { fromDay: 1, rate: 1, afterMonths: 1, paidBy: 'employer', source: 'EFZG §3: full pay for up to six weeks, after four weeks with the employer' },
    quitNotice: { steps: [[0, 14], [6, 28]], source: '§622 BGB: two weeks in probation, four weeks after' },
    employerNotice: { steps: [[0, 14], [6, 28], [24, 30], [60, 60], [96, 90], [120, 120], [144, 150], [180, 180], [240, 210]], source: '§622 BGB: two weeks in probation, four after, then a month after two years up to seven after twenty; no statutory severance' },
  },
  ES: {
    holiday: { extra: 0.75, source: 'Estatuto de los Trabajadores art. 37: a holiday worked is paid at least 75% extra' },
    leave: { accrual: (30 / 7) / (52 - 30 / 7), paidOut: true, source: 'ET art. 38: 30 calendar days' },
    sick: { fromDay: 4, rate: 0.6, paidBy: 'employer', source: 'Incapacidad temporal: 60% from the fourth day, the employer paying days 4 to 15' },
    extras: [{ kind: 'month', name: 'Paga extraordinaria', months: [6, 12], source: 'ET art. 31: two extra payments, June and Christmas' }],
    quitNotice: { steps: [[0, 15]], source: 'By convenio or custom, 15 days' },
    employerNotice: { steps: [[0, 15]], source: 'Estatuto de los Trabajadores art. 53: 15 days for an objective dismissal' },
    redundancy: { afterMonths: 0, weeksAYear: 20 / 7, maxWeeks: 365 / 7, source: 'Estatuto de los Trabajadores art. 53: 20 days’ pay a year for an objective dismissal, to twelve months’ pay' },
  },
  JP: {
    night: { extra: 0.25, from: 22, to: 29, source: 'Labor Standards Act art. 37: 25% from 22:00 to 05:00' },
    overtime: { week: 40, day: 8, extra: 0.25, source: 'Labor Standards Act art. 37: 25% past 8 hours a day or 40 a week' },
    leave: {
      accrual: 0, paidOut: false, source: 'Labor Standards Act art. 39: 10 days after six months, pro rata for part-time',
      expiry: { yearStart: 'hire', graceMonths: 12, action: 'lose', source: 'MHLW: unused days carry over for one year' },
      grants: {
        firstAfterMonths: 6, days: [10, 11, 12, 14, 16, 18, 20], minAttendance: 0.8,
        partTime: { maxDays: 4, underHours: 30, byDays: { 4: [7, 8, 9, 10, 12, 13, 15], 3: [5, 6, 6, 8, 9, 10, 11], 2: [3, 4, 4, 5, 6, 6, 7], 1: [1, 2, 2, 2, 3, 3, 3] } },
        source: 'Labor Standards Act art. 39 and MHLW’s table: 10 days at six months, 11, 12, 14, 16, 18 and 20 a year on; four days a week or fewer, under 30 hours, 7 to 15, 5 to 11, 3 to 7 and 1 to 3; for 80% of the shifts attended',
      },
    },
    sick: { fromDay: 4, rate: 2 / 3, paidBy: 'state', source: '傷病手当金: two-thirds from the fourth day, for the insured' },
    quitNotice: { steps: [[0, 14]], source: 'Civil Code art. 627: two weeks' },
    employerNotice: { steps: [[0, 0], [0.5, 30]], source: 'Labor Standards Act art. 20: 30 days, or 30 days’ pay, after the first 14 days; no statutory severance' },
  },
  KR: {
    night: { extra: 0.5, from: 22, to: 30, source: 'Labor Standards Act art. 56: 50% from 22:00 to 06:00' },
    holiday: { extra: 0.5, source: 'Labor Standards Act art. 56: 50% for a holiday worked' },
    overtime: { week: 40, day: 8, extra: 0.5, source: 'Labor Standards Act art. 56: 50% past 8 hours a day or 40 a week' },
    leave: {
      accrual: 12 / 250, paidOut: true, source: 'Labor Standards Act art. 60: a day a month in the first year, 15 after',
      expiry: { yearStart: 'hire', graceMonths: 12, action: 'payout', source: 'Labor Standards Act art. 60: unused days are paid out as annual-leave allowance (연차수당)' },
    },
    weeklyRestDay: { minHours: 15, source: 'Labor Standards Act art. 55: a paid day off a week at 15 hours or more' },
    severance: { daysAYear: 30, afterMonths: 12, minHours: 15, source: 'Employee Retirement Benefit Security Act: 30 days’ pay a year, after a year' },
    quitNotice: { steps: [[0, 30]], source: 'Civil Code art. 660: a month' },
    employerNotice: { steps: [[0, 0], [3, 30]], source: 'Labor Standards Act art. 26: 30 days after three months; the severance above is owed on any leaving' },
  },
  AU: {
    sunday: {
      extra: 0.5, byLine: { school: 0.25, office: 1, armed_forces: 1, trades: 1 },
      source: 'The awards: Sunday at 150% in retail, hospitality and restaurants, 125% under the Fast Food award, 200% for clerks, security and construction',
    },
    holiday: { extra: 1.25, source: 'The awards: public holidays at 225%' },
    windows: [
      { name: 'Evening Premium', from: 22, to: 24, extra: 0.1, lines: ['school'], weekdays: [1, 2, 3, 4, 5], source: 'Fast Food award: 110% Monday to Friday from 10 pm to midnight' },
      { name: 'Night Premium', from: 24, to: 30, extra: 0.15, lines: ['school'], weekdays: [1, 2, 3, 4, 5], source: 'Fast Food award: 115% from midnight to 6 am' },
      { name: 'Evening Premium', from: 18, to: 21, extra: 0.25, lines: ['retail'], weekdays: [1, 2, 3, 4, 5], source: 'General Retail award: 125% Monday to Friday after 6 pm, to the end of ordinary hours at 9 pm' },
      { name: 'Night Premium', from: 18, to: 30, extra: 0.217, lines: ['armed_forces'], weekdays: [1, 2, 3, 4, 5], source: 'Security Services award: 121.7% for a night shift, Monday to Friday from 6 pm to 6 am' },
      { name: 'Evening Loading', from: 19, to: 24, flat: 2.95, lines: ['hospitality'], weekdays: [1, 2, 3, 4, 5], source: 'Hospitality award: $2.95 an hour Monday to Friday from 7 pm to midnight' },
      { name: 'Night Loading', from: 24, to: 31, flat: 4.42, lines: ['hospitality'], weekdays: [1, 2, 3, 4, 5], source: 'Hospitality award: $4.42 an hour from midnight to 7 am' },
    ],
    overtime: { week: 38, extra: 0.5, source: 'The awards: 150% past 38 hours' },
    leave: { accrual: 4 / 48, loading: 0.175, paidOut: true, source: 'NES: four weeks, with the awards’ 17.5% loading' },
    sick: { fromDay: 1, rate: 1, accrual: 1 / 26, paidBy: 'employer', source: 'NES: 10 days a year of personal leave, building with hours' },
    quitNotice: { steps: [[0, 7]], source: 'NES: a week in the first year' },
    employerNotice: { steps: [[0, 7], [12, 14], [36, 21], [60, 28]], older: { age: 45, afterMonths: 24, days: 7 }, source: 'Fair Work Act s.117: a week to a year, two to three, three to five, four after, and a week more over 45 with two years' },
    redundancy: {
      afterMonths: 12, table: [[1, 4], [2, 6], [3, 7], [4, 8], [5, 10], [6, 11], [7, 13], [8, 14], [9, 16], [10, 12]],
      source: 'Fair Work Act s.119: 4 weeks after a year up to 16 after nine, and 12 from ten, when long service leave takes over; for employers of 15 or more, as the chains on record are',
    },
  },
  NZ: {
    holiday: { extra: 0.5, dayInLieu: true, source: 'Holidays Act 2003: time and a half for a public holiday worked on a day normally worked, and a paid alternative holiday' },
    leave: { accrual: 0.08, paidOut: true, source: 'Holidays Act 2003: four weeks, or 8% of gross on leaving' },
    sick: { fromDay: 1, rate: 1, daysAYear: 10, afterMonths: 6, paidBy: 'employer', source: 'Holidays Act 2003: 10 days a year after six months' },
    quitNotice: { steps: [[0, 14]], source: 'By the agreement; two weeks is the usual' },
    employerNotice: { steps: [[0, 14]], source: 'By the agreement, reasonable where it’s silent; two weeks is the usual. No statutory redundancy pay' },
  },
};

/**
 * The law where a job is: the country's, with its state's or province's own
 * over it. Outside the thirteen, the statutory annual leave the world research
 * found (`content/work-world.ts`), built with the hours and paid out on
 * leaving; nothing else of the law is modeled there.
 */
export function laborAt(path: readonly string[]): LaborLaw | undefined {
  const country = LABOR[path[0] ?? ''];
  if (!country) {
    const leave = WORLD_WORK[path[0] ?? '']?.leaveDays;
    if (!leave) return undefined;
    const weeks = leave.days / 5;
    return { leave: { accrual: weeks / (52 - weeks), paidOut: true, source: `${leave.days} days a year; ${leave.source}` } };
  }
  const region = country.regions?.[path[1] ?? ''];
  return region ? { ...country, ...region } : country;
}

/**
 * How often a job is cut, a month, as a share of those in work. The US from
 * the BLS's JOLTS, the average of August 2025 to July 2026, seasonally
 * adjusted, by the industry a line is in; it counts layoffs and discharges
 * together, as JOLTS doesn't part them, so it runs above layoffs alone.
 * Britain from the ONS, redundancies per 1,000 employees in May to July
 * 2026, 3.9 over the three months. No other country's rate was reached, so
 * everywhere else it's Britain's, SLATE's estimate.
 */
export const LAYOFFS: Readonly<Record<string, { month: number; byLine?: Readonly<Record<string, number>>; source: string; estimate?: boolean }>> = {
  US: {
    month: 13.1 / 12 / 100,
    byLine: { school: 15.2 / 12 / 100, hospitality: 15.2 / 12 / 100, retail: 11.5 / 12 / 100 },
    source: 'BLS JOLTS layoffs and discharges rate, August 2025 to July 2026: 1.09% a month in all, 1.27% in accommodation and food, 0.96% in retail',
  },
  GB: { month: 3.9 / 1_000 / 3, source: 'ONS, redundancies per 1,000 employees, May to July 2026: 3.9 in three months' },
};

/** The chance a job is cut on a given day, where it is. */
export function layoffChanceADay(iso: string, jobId: string): number {
  const rate = LAYOFFS[iso] ?? LAYOFFS.GB!;
  const month = rate.byLine?.[jobId] ?? rate.month;
  return 1 - (1 - month) ** (1 / 30.4375);
}

/** Days of notice an employer gives to let a worker go, by months with it and the worker's age. */
export function employerNoticeDays(law: LaborLaw | undefined, months: number, age: number): number {
  const notice = law?.employerNotice;
  let days = 0;
  for (const [after, given] of notice?.steps ?? []) if (months >= after) days = given;
  if (notice?.older && age > notice.older.age && months >= notice.older.afterMonths) days += notice.older.days;
  return days;
}

/** Weeks of redundancy pay after so many months with the employer, at an age (`Redundancy`). */
export function redundancyWeeks(r: Redundancy | undefined, months: number, age: number): number {
  if (!r || months < r.afterMonths) return 0;
  const whole = Math.floor(months / 12);
  if (r.table) {
    let weeks = 0;
    for (const [years, given] of r.table) if (whole >= years) weeks = given;
    return weeks;
  }
  const years = Math.min(r.wholeYears ? whole : months / 12, r.maxYears ?? Number.POSITIVE_INFINITY);
  let weeks = r.plus ?? 0;
  if (r.byAge) {
    // Counted back from the last year, each at the age the worker was in it.
    for (let k = 0; k < years; k += 1) {
      weeks += r.byAge.reduce((w, [from, given]) => (age - k - 1 >= from ? given : w), 0) * Math.min(1, years - k);
    }
  } else {
    const first = r.later ? Math.min(years, r.later.afterYears) : years;
    weeks += first * (r.weeksAYear ?? 0) + (years - first) * (r.later?.weeksAYear ?? 0);
  }
  return Math.min(weeks, r.maxWeeks ?? Number.POSITIVE_INFINITY);
}

/** Days of notice a worker gives after so many months with the employer. */
export function quitNoticeDays(law: LaborLaw | undefined, months: number): number {
  let days = 0;
  for (const [after, notice] of law?.quitNotice?.steps ?? []) if (months >= after) days = notice;
  return days;
}
