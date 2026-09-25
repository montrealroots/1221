/**
 * SLATE — what's settled after the tax year.
 *
 * A payslip withholds the year's tax a payday at a time, as if the pay went
 * on all year (`content/payroll.ts`). A year that didn't, a job started in
 * the spring or lost in the autumn, has had too much taken, and the country
 * settles it after the year: on a return in the US, Canada, Germany and
 * Spain, by the tax office's own reckoning in Britain, New Zealand and
 * Iceland, and by the employer in December in Japan. The settlement charges
 * the year's real tax on what was really earned, taxes the unemployment
 * benefit where the law does, and takes off the credits a low-paid worker
 * gets only there: the US earned income tax credit, the Canada Workers
 * Benefit, Ontario's LIFT credit, British Columbia's tax reduction, Spain's
 * minimum-wage deduction and New Zealand's independent earner credit. From
 * the research of 2026-09-25 (`probe/tax-return-research/answers.json`).
 *
 * France, Korea, Mexico and Australia settle a year too, and SLATE doesn't
 * have how: what they withhold stands. Figures are in the country's money,
 * whole units.
 */

import { payrollYear, spainCuota } from './payroll';
import type { Instant } from '../core/time';

/** A tax year's figures, as the settlement reads them. */
export interface YearFigures {
  wages: number;
  /** Unemployment benefit paid in the year, by the benefit's name. */
  benefits: readonly { name: string; amount: number }[];
  age: number;
  /** Every jurisdiction the work was in, country first. */
  path: readonly string[];
  /** A moment in the tax year, for its rates. */
  at: Instant;
  weeklyHours?: number;
  /** Whole months of the year on a benefit, for New Zealand's credit. */
  benefitMonths: number;
}

export interface Credit {
  name: string;
  amount: number;
  refundable: boolean;
}

/** When a settlement is paid: a date in the year the tax year ends in, or the year before, and only for somebody in work then, where the law says so. */
export interface SettleDate {
  month: number;
  day: number;
  offsetYears: number;
  ifEmployed?: boolean;
  estimate?: boolean;
}

export interface Settlement {
  name: string;
  /** The tax year's first day, [month, day]. */
  yearStart: readonly [number, number];
  /** When it's paid; the first that applies. */
  settle: readonly SettleDate[];
  /** The payslip's tax lines that charge a taxable benefit; absent, none is taxed. */
  benefitLines?: RegExp;
  /** Benefits by name that aren't taxed where others are (Britain's Universal Credit). */
  untaxed?: readonly string[];
  /** A tax-free benefit raises the rate the wages are taxed at (Germany's Progressionsvorbehalt). */
  progression?: boolean;
  /** The year's tax, where the return's isn't the payslip's (Spain's cuota). */
  tax?: (y: YearFigures) => number;
  /** The credits on the return, against the year's tax by line. */
  credits?: (y: YearFigures, byLine: Readonly<Record<string, number>>) => Credit[];
  /** Interest the settlement adds, either way (Iceland's 2.5%). */
  interest?: number;
  source: string;
}

export interface Settled {
  /** The year's tax, after the credits that only reduce it. */
  owed: number;
  credits: Credit[];
  /** What's paid back, or, below nothing, what's due. */
  refund: number;
}

const taxedBenefits = (s: Settlement, y: YearFigures) =>
  y.benefits.filter((one) => !s.untaxed?.includes(one.name)).reduce((sum, one) => sum + one.amount, 0);
const allBenefits = (y: YearFigures) => y.benefits.reduce((sum, one) => sum + one.amount, 0);

/** The year's tax by payslip line, on a year's income. */
function taxLines(iso: string, income: number, y: YearFigures): Record<string, number> {
  const out: Record<string, number> = {};
  const year = payrollYear(iso, Math.round(income * 100), { path: y.path, at: y.at, age: y.age, ...(y.weeklyHours !== undefined ? { weeklyHours: y.weeklyHours } : {}) });
  for (const line of year.lines) if (line.kind === 'tax') out[line.name] = (out[line.name] ?? 0) + line.amount / 100;
  return out;
}

/**
 * The year settled: its real tax on what was earned, with the benefit taxed
 * where the law taxes it, less the credits, against what was withheld.
 */
export function settleYear(s: Settlement, y: YearFigures, withheld: number): Settled {
  const iso = y.path[0] ?? '';
  let byLine = taxLines(iso, y.wages, y);
  const benefit = taxedBenefits(s, y);
  if (s.benefitLines && benefit > 0) {
    const withBenefit = taxLines(iso, y.wages + benefit, y);
    byLine = Object.fromEntries(Object.entries(withBenefit).map(([name, amount]) => [name, s.benefitLines!.test(name) ? amount : byLine[name] ?? 0]));
  }
  if (s.progression && allBenefits(y) > 0 && y.wages > 0) {
    const all = y.wages + allBenefits(y);
    const rated = taxLines(iso, all, y);
    byLine = Object.fromEntries(Object.entries(rated).map(([name, amount]) => [name, (amount / all) * y.wages]));
  }
  if (s.tax) byLine = { Tax: s.tax(y) };
  const total = Object.values(byLine).reduce((sum, one) => sum + one, 0);
  const credits = s.credits?.(y, byLine) ?? [];
  const nonRefundable = Math.min(total, credits.filter((one) => !one.refundable).reduce((sum, one) => sum + one.amount, 0));
  const refundable = credits.filter((one) => one.refundable).reduce((sum, one) => sum + one.amount, 0);
  const owed = total - nonRefundable;
  const refund = withheld - owed + refundable;
  return { owed, credits: credits.filter((one) => one.amount > 0), refund: refund * (1 + (s.interest ?? 0)) };
}

// ---------------------------------------------------------------------------
// The credits

/** The US earned income tax credit with no qualifying children, 2026 (Rev. Proc. 2025-32). */
export function usEitc(y: YearFigures, benefitTaxed: number): number {
  if (y.age < 25 || y.age >= 65) return 0;
  const earned = y.wages;
  const agi = earned + benefitTaxed;
  const phaseIn = 0.0765 * Math.min(earned, 8_680);
  return Math.max(0, Math.min(phaseIn, 664) - 0.0765 * Math.max(0, Math.max(agi, earned) - 10_860));
}

/** The Canada Workers Benefit, single, 2026: 27% of working income over $3,000 to $1,665, less 15% of net income over $27,392. */
export function canadaWorkers(y: YearFigures): number {
  const net = y.wages + allBenefits(y);
  return Math.max(0, Math.min(1_665, 0.27 * Math.max(0, y.wages - 3_000)) - 0.15 * Math.max(0, net - 27_392));
}

/** Spain's minimum-wage deduction, 2026: €590.89 to €17,094 of gross pay, less 20% of the pay over it. */
export function spainMinimumWage(gross: number): number {
  return Math.max(0, gross <= 17_094 ? 590.89 : 590.89 - 0.2 * (gross - 17_094));
}

/** New Zealand's independent earner credit: $520 from $24,000 to $66,000, less 13c a dollar to $70,000, for the months off a benefit. */
export function nzIndependentEarner(y: YearFigures): number {
  const income = y.wages + allBenefits(y);
  if (income < 24_000) return 0;
  const full = Math.max(0, 520 - 0.13 * Math.max(0, income - 66_000));
  return (full * Math.max(0, 12 - y.benefitMonths)) / 12;
}

const US: Settlement = {
  name: 'Tax Return', yearStart: [1, 1], settle: [{ month: 3, day: 2, offsetYears: 0 }],
  benefitLines: /^Federal Income Tax$/,
  credits: (y) => [{ name: 'Earned Income Tax Credit', amount: usEitc(y, allBenefits(y)), refundable: true }],
  source: 'IRS: the year’s tax on a return, with the earned income tax credit for no children, 2026 (Rev. Proc. 2025-32); a refund with the credit comes by about 2 March; unemployment benefit is federally taxable',
};

const CANADA: Settlement = {
  name: 'Tax Return', yearStart: [1, 1], settle: [{ month: 5, day: 15, offsetYears: 0, estimate: true }],
  benefitLines: /Income Tax|Health Premium/,
  credits: (y) => [{ name: 'Canada Workers Benefit', amount: canadaWorkers(y), refundable: true }],
  source: 'CRA: the year’s tax on a T1, with the Canada Workers Benefit, 2026; EI is taxable. The CRA states no refund month; mid-May, after the April deadline, is SLATE’s estimate',
};

export const SETTLEMENTS: Readonly<Record<string, Settlement>> = {
  US,
  'US-IL': {
    ...US,
    benefitLines: /^(Federal|Illinois) Income Tax$/,
    credits: (y) => {
      const federal = usEitc(y, allBenefits(y));
      return [
        { name: 'Earned Income Tax Credit', amount: federal, refundable: true },
        { name: 'Illinois Earned Income Tax Credit', amount: federal * 0.2, refundable: true },
      ];
    },
    source: `${US.source}; Illinois adds 20% of the federal credit (2025) and taxes unemployment benefit`,
  },
  CA: CANADA,
  'CA-08': {
    ...CANADA,
    credits: (y, byLine) => {
      const net = y.wages + allBenefits(y);
      const lift = Math.max(0, Math.min(875, 0.0505 * y.wages) - 0.05 * Math.max(0, net - 32_500));
      return [
        { name: 'Canada Workers Benefit', amount: canadaWorkers(y), refundable: true },
        { name: 'Ontario LIFT Credit', amount: Math.min(lift, byLine['Ontario Income Tax'] ?? 0), refundable: false },
      ];
    },
    source: `${CANADA.source}; Ontario’s LIFT credit, the lesser of $875 and 5.05% of employment income, less 5% over $32,500`,
  },
  'CA-02': {
    ...CANADA,
    credits: (y, byLine) => {
      const net = y.wages + allBenefits(y);
      const reduction = Math.max(0, 690 - 0.0356 * Math.max(0, net - 25_570));
      return [
        { name: 'Canada Workers Benefit', amount: canadaWorkers(y), refundable: true },
        { name: 'BC Tax Reduction', amount: Math.min(reduction, byLine['British Columbia Income Tax'] ?? 0), refundable: false },
      ];
    },
    source: `${CANADA.source}; British Columbia’s tax reduction, $690 in 2026, less 3.56% over $25,570`,
  },
  GB: {
    name: 'P800', yearStart: [4, 6], settle: [{ month: 6, day: 30, offsetYears: 0 }],
    benefitLines: /^Income Tax$/, untaxed: ['Universal Credit'],
    source: 'HMRC: PAYE is final and nothing is filed; a P800 settles too much or too little, from June after the tax year ends on 5 April. Jobseeker’s Allowance is taxable, Universal Credit isn’t',
  },
  IE: {
    name: 'End Of Year Statement', yearStart: [1, 1], settle: [{ month: 1, day: 31, offsetYears: 0, estimate: true }],
    benefitLines: /^PAYE$/,
    source: 'Revenue: a PAYE worker’s year is settled on the statement through myAccount, from January (SLATE’s estimate of when); social welfare payments bear income tax, not USC or PRSI',
  },
  IS: {
    name: 'Álagning', yearStart: [1, 1], settle: [{ month: 6, day: 1, offsetYears: 0 }], interest: 0.025,
    source: 'Skatturinn: the year’s assessment at the end of May, paid on 1 June, with 2.5% added to a refund or a shortfall',
  },
  NZ: {
    name: 'Income Tax Assessment', yearStart: [4, 1], settle: [{ month: 6, day: 15, offsetYears: 0, estimate: true }],
    benefitLines: /^PAYE$/,
    credits: (y) => [{ name: 'Independent Earner Tax Credit', amount: nzIndependentEarner(y), refundable: false }],
    source: 'IRD: a wage earner’s year is assessed automatically, with the independent earner credit for the months off a benefit; benefits are taxed. IRD states no refund month; mid-June is SLATE’s estimate',
  },
  DE: {
    name: 'Einkommensteuererklärung', yearStart: [1, 1], settle: [{ month: 7, day: 31, offsetYears: 0, estimate: true }],
    progression: true,
    source: 'EStG §46 and §32b: a return settles the Lohnsteuer, and Arbeitslosengeld, tax-free, raises the rate on the wages; the return is due by 31 July, SLATE’s estimate of when it’s paid',
  },
  ES: {
    name: 'Declaración de la Renta', yearStart: [1, 1], settle: [{ month: 6, day: 30, offsetYears: 0, estimate: true }],
    tax: (y) => spainCuota(y.wages + allBenefits(y)),
    credits: (y) => [{ name: 'Deducción Por Salario Mínimo', amount: spainMinimumWage(y.wages + allBenefits(y)), refundable: false }],
    source: 'LIRPF: the year’s cuota on pay and paro, both income from work, less the 2026 minimum-wage deduction of €590.89 to €17,094 (DA 61ª); due by the end of June, and the agency has six months more to pay, so the deadline is SLATE’s estimate',
  },
  JP: {
    name: '年末調整', yearStart: [1, 1],
    settle: [{ month: 12, day: 31, offsetYears: -1, ifEmployed: true }, { month: 4, day: 15, offsetYears: 0, estimate: true }],
    source: 'NTA: the employer’s year-end adjustment settles the year for anybody employed at its end; somebody who left and found no work files a final return by 15 March, and a month after it is SLATE’s estimate of the refund',
  },
};

/** The settlement where somebody's work was: a state's or province's own, then the country's. */
export function settlementAt(path: readonly string[]): Settlement | undefined {
  return SETTLEMENTS[path[1] ?? ''] ?? SETTLEMENTS[path[0] ?? ''];
}
