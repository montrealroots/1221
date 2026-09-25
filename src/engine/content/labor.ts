/**
 * SLATE — what the law where they work adds to a shift and a job.
 *
 * For each of the thirteen countries SLATE pays a life in: the premiums a
 * shift earns for when it falls, the point past which hours are overtime,
 * the paid leave the hours build, sick pay for a day called in, the extra
 * payments the law requires on their dates, Korea's weekly paid rest day
 * and its severance, and the notice a worker gives on quitting. From the
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
  source: string;
}

export interface NightPremium extends Premium {
  /** The hours of the day the premium covers, as [from, to) on the clock; to may be past 24. */
  from: number;
  to: number;
}

export interface LaborLaw {
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

const PART_LINES = ['school', 'hospitality', 'armed_forces'];

export const LABOR: Readonly<Record<string, LaborLaw>> = {
  US: {
    overtime: { week: 40, extra: 0.5, source: 'FLSA: time and a half past 40 hours a week' },
    quitNotice: { steps: [[0, 0]], source: 'At will: no notice either way' },
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
    regions: {
      'CA-08': {
        holiday: { extra: 0.5, source: 'Ontario ESA: time and a half for a public holiday worked' },
        overtime: { week: 44, extra: 0.5, source: 'Ontario ESA: time and a half past 44 hours a week' },
      },
      'CA-02': {
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
  },
  GB: {
    leave: {
      accrual: 0.1207, paidOut: true, source: 'Working Time Regulations: 5.6 weeks, 12.07% of hours worked',
      expiry: { yearStart: 'hire', graceMonths: 0, action: 'lose', source: 'ACAS: the 5.6 weeks must be taken in the leave year, which starts on the job’s anniversary where nothing else is agreed; the employer must warn of it first' },
    },
    sick: { fromDay: 1, rate: 0.8, capDay: 123.25 / 5, paidBy: 'employer', source: 'Statutory Sick Pay from 6 April 2026: 80% of pay or £123.25 a week, from the first day' },
    quitNotice: { steps: [[0, 0], [1, 7]], source: 'Employment Rights Act 1996 s.86: a week, after a month' },
  },
  IE: {
    holiday: { extra: 1, source: 'Organisation of Working Time Act 1997: an extra day’s pay for a public holiday worked' },
    leave: {
      accrual: 0.08, paidOut: true, source: 'Organisation of Working Time Act 1997 s.19: 8% of hours worked',
      expiry: { yearStart: '04-01', graceMonths: 6, action: 'lose', source: 'Citizens Information: the leave year runs 1 April to 31 March, and leave is taken in it or, by agreement, within six months after' },
    },
    sick: { fromDay: 1, rate: 0.7, capDay: 110, daysAYear: 5, afterMonths: 3, paidBy: 'employer', source: 'Sick Leave Act 2022: 5 days in 2026 at 70%, at most €110 a day, after 13 weeks' },
    quitNotice: { steps: [[0, 0], [3, 7]], source: 'Minimum Notice and Terms of Employment Act 1973: a week, after 13 weeks' },
  },
  IS: {
    evening: { extra: 0.33, from: 17, to: 24, lines: PART_LINES, source: 'Efling–SA shift premiums: weekday evenings 17:00–24:00, 33%' },
    night: { extra: 0.45, from: 24, to: 32, lines: PART_LINES, source: 'Efling–SA: nights 00:00–08:00, 45%' },
    saturday: { extra: 0.45, lines: PART_LINES, source: 'Efling–SA: weekends, 45%' },
    sunday: { extra: 0.45, lines: PART_LINES, source: 'Efling–SA: weekends, 45%' },
    holiday: { extra: 1.383, only: ['01-01', '06-17', '12-25', 'Good Friday', 'Easter Sunday', 'Whit Sunday', 'Pentecost'], source: 'Efling–SA: major holidays at 1.375% of the monthly wage an hour, 2.383 times the day rate' },
    overtime: { week: 40, extra: 0.8, source: 'Efling–SA: yfirvinna at 1.0385% of the monthly wage, an 80% premium' },
    leave: { accrual: 0.1017, paidOut: true, source: 'Holiday Act 30/1987 and the agreements: orlof at 10.17%' },
    sick: { fromDay: 1, rate: 1, accrual: 2 * 8 / 173.33, paidBy: 'employer', source: 'Efling–SA: 2 days’ full pay for each month worked in the first year' },
    extras: [
      { kind: 'fixed', name: 'Orlofsuppbót', month: 6, day: 1, amount: 62_000, fullTimeHours: 40, source: 'Efling–SA 2026: 62,000 kr on 1 June, by job share' },
      { kind: 'fixed', name: 'Desemberuppbót', month: 12, day: 15, amount: 114_000, fullTimeHours: 40, minWeeks: 12, source: 'Efling–SA 2026: 114,000 kr by 15 December, by job share, after 12 weeks' },
    ],
    quitNotice: { steps: [[0, 0], [0.5, 12], [3, 30], [24, 60], [36, 90]], source: 'Efling–SA: 12 days to three months, then a month, two after two years, three after three' },
  },
  FR: {
    holiday: { extra: 1, only: ['05-01'], source: 'Code du travail L3133-6: 1 May worked is paid double' },
    overtime: { week: 35, extra: 0.25, tierAfter: 8, tierExtra: 0.5, source: 'Code du travail L3121-36: 25% from the 36th hour, 50% from the 44th' },
    leave: { accrual: 5 / 47, paidOut: true, source: 'Code du travail L3141-3: 2.5 days a month, five weeks' },
    sick: { fromDay: 4, rate: 0.5, capDay: 42.97, paidBy: 'state', source: 'Sécurité sociale: 50% after three waiting days, at most €42.97 a day' },
    quitNotice: { steps: [[0, 7]], source: 'Set by the branch agreement; a week is the common minimum for hourly work' },
  },
  DE: {
    night: { extra: 0.25, from: 23, to: 30, source: 'ArbZG §6(5), and the Federal Labor Court’s 25% as the reasonable supplement' },
    leave: { accrual: 4 / 48, paidOut: true, source: 'BUrlG: 20 days on a five-day week' },
    sick: { fromDay: 1, rate: 1, afterMonths: 1, paidBy: 'employer', source: 'EFZG §3: full pay for up to six weeks, after four weeks with the employer' },
    quitNotice: { steps: [[0, 14], [6, 28]], source: '§622 BGB: two weeks in probation, four weeks after' },
  },
  ES: {
    holiday: { extra: 0.75, source: 'Estatuto de los Trabajadores art. 37: a holiday worked is paid at least 75% extra' },
    leave: { accrual: (30 / 7) / (52 - 30 / 7), paidOut: true, source: 'ET art. 38: 30 calendar days' },
    sick: { fromDay: 4, rate: 0.6, paidBy: 'employer', source: 'Incapacidad temporal: 60% from the fourth day, the employer paying days 4 to 15' },
    extras: [{ kind: 'month', name: 'Paga extraordinaria', months: [6, 12], source: 'ET art. 31: two extra payments, June and Christmas' }],
    quitNotice: { steps: [[0, 15]], source: 'By convenio or custom, 15 days' },
  },
  JP: {
    night: { extra: 0.25, from: 22, to: 29, source: 'Labor Standards Act art. 37: 25% from 22:00 to 05:00' },
    overtime: { week: 40, day: 8, extra: 0.25, source: 'Labor Standards Act art. 37: 25% past 8 hours a day or 40 a week' },
    leave: {
      accrual: 2 / 50, usableAfterMonths: 6, paidOut: false, source: 'Labor Standards Act art. 39: 10 days after six months, pro rata for part-time',
      expiry: { yearStart: 'hire', graceMonths: 12, action: 'lose', source: 'MHLW: unused days carry over for one year' },
    },
    sick: { fromDay: 4, rate: 2 / 3, paidBy: 'state', source: '傷病手当金: two-thirds from the fourth day, for the insured' },
    quitNotice: { steps: [[0, 14]], source: 'Civil Code art. 627: two weeks' },
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
  },
  AU: {
    sunday: {
      extra: 0.5, byLine: { school: 0.25, office: 1, armed_forces: 1, trades: 1 },
      source: 'The awards: Sunday at 150% in retail, hospitality and restaurants, 125% under the Fast Food award, 200% for clerks, security and construction',
    },
    holiday: { extra: 1.25, source: 'The awards: public holidays at 225%' },
    night: { extra: 0.1, from: 22, to: 30, lines: PART_LINES, source: 'Fast Food award: 110% from 10 pm' },
    overtime: { week: 38, extra: 0.5, source: 'The awards: 150% past 38 hours' },
    leave: { accrual: 4 / 48, loading: 0.175, paidOut: true, source: 'NES: four weeks, with the awards’ 17.5% loading' },
    sick: { fromDay: 1, rate: 1, accrual: 1 / 26, paidBy: 'employer', source: 'NES: 10 days a year of personal leave, building with hours' },
    quitNotice: { steps: [[0, 7]], source: 'NES: a week in the first year' },
  },
  NZ: {
    holiday: { extra: 0.5, source: 'Holidays Act 2003: time and a half for a public holiday worked' },
    leave: { accrual: 0.08, paidOut: true, source: 'Holidays Act 2003: four weeks, or 8% of gross on leaving' },
    sick: { fromDay: 1, rate: 1, daysAYear: 10, afterMonths: 6, paidBy: 'employer', source: 'Holidays Act 2003: 10 days a year after six months' },
    quitNotice: { steps: [[0, 14]], source: 'By the agreement; two weeks is the usual' },
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

/** Days of notice a worker gives after so many months with the employer. */
export function quitNoticeDays(law: LaborLaw | undefined, months: number): number {
  let days = 0;
  for (const [after, notice] of law?.quitNotice?.steps ?? []) if (months >= after) days = notice;
  return days;
}
