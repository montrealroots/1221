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

import { franceIncomeTax, franceTaxable, payrollYear, spainCuota } from './payroll';
import type { Instant } from '../core/time';
import { STATES } from './jurisdictions';

/** A tax year's figures, as the settlement reads them. */
export interface YearFigures {
  wages: number;
  /** Unemployment benefit paid in the year, by the benefit's name. */
  benefits: readonly { name: string; amount: number }[];
  age: number;
  /** Every jurisdiction the work was in, country first. */
  path: readonly string[];
  /** The town, for its own taxes (a US town's wage tax). */
  cityId?: string;
  /** A moment in the tax year, for its rates. */
  at: Instant;
  weeklyHours?: number;
  /** Whole months of the year on a benefit, for New Zealand's credit. */
  benefitMonths: number;
  /** Rent paid in the year, for Ireland's rent credit. */
  rent: number;
  /** What's in the bank when it's worked, for a credit with an asset test (Korea's). */
  savings: number;
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
  /** Only for somebody with the same employer the whole year (Mexico's cálculo anual). */
  ifWholeYear?: boolean;
  /** Only a refund, or only a sum due, is settled on this date (France pays back in July and takes in September). */
  only?: 'refund' | 'due';
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
  /**
   * A credit applied for and paid apart from the settlement, on its own date
   * after the year (Korea's 근로장려금): its amount on the year's figures.
   */
  later?: { name: string; settle: SettleDate; amount: (y: YearFigures) => number; source: string };
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
  const year = payrollYear(iso, Math.round(income * 100), { path: y.path, ...(y.cityId ? { cityId: y.cityId } : {}), settling: true, at: y.at, age: y.age, ...(y.weeklyHours !== undefined ? { weeklyHours: y.weeklyHours } : {}) });
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

/** New York's household credit for a single filer, by federal AGI (IT-201 instructions, 2025). */
export function nyHouseholdCredit(agi: number): number {
  const rows: readonly (readonly [number, number])[] = [[5_000, 75], [6_000, 60], [7_000, 50], [20_000, 45], [25_000, 40], [28_000, 20]];
  return rows.find(([upTo]) => agi <= upTo)?.[1] ?? 0;
}

/**
 * California's earned income credit with no children (FTB 3514, 2025), read
 * off the booklet's table: [earned income, credit], between which it's
 * taken on the straight line; nothing from $32,901 of earned income or AGI.
 */
const CAL_EITC: readonly (readonly [number, number])[] = [
  [0, 0], [1_000, 63], [2_000, 128], [3_000, 193], [4_000, 259], [4_700, 302], [5_000, 283], [10_000, 211],
  [15_000, 165], [20_000, 119], [25_000, 73], [27_400, 51], [30_000, 27], [32_000, 9], [32_900, 1],
];
export function calEitc(earned: number, agi: number, age: number): number {
  if (age < 18 || earned <= 0 || earned >= 32_901 || agi >= 32_901) return 0;
  for (let i = 1; i < CAL_EITC.length; i += 1) {
    const [x1, y1] = CAL_EITC[i]!;
    if (earned <= x1) {
      const [x0, y0] = CAL_EITC[i - 1]!;
      return y0 + ((y1 - y0) * (earned - x0)) / (x1 - x0);
    }
  }
  return 1;
}

/** Quebec's work premium for somebody living alone, 2026: 11.6% of work income over $2,400, to $1,207.33, less 10% of family income over $12,808. */
export function quebecWorkPremium(work: number, family: number): number {
  return Math.max(0, Math.min(1_207.33, 0.116 * Math.max(0, work - 2_400)) - 0.1 * Math.max(0, family - 12_808));
}

/** Korea's earned income tax credit (근로장려금) for a single household: 165/400 of earnings to ₩1.65 million at ₩4 million, flat to ₩9 million, then less 165/1300 of each won over it, none from ₩22 million; half with savings of ₩170 million, none from ₩240 million. */
export function koreaEarnedIncome(earned: number, savings: number): number {
  if (earned <= 0 || earned >= 22_000_000 || savings >= 240_000_000) return 0;
  const full = earned <= 4_000_000 ? (earned * 165) / 400 : earned <= 9_000_000 ? 1_650_000 : 1_650_000 - ((earned - 9_000_000) * 165) / 1_300;
  return Math.max(0, full) * (savings >= 170_000_000 ? 0.5 : 1);
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

/**
 * A state from the labor-law pass: the federal return, the state's tax on
 * unemployment benefit where it taxes it, and its earned income credit as a
 * share of the federal, which a state that doesn't refund it only takes off
 * its own tax.
 */
function stateReturn(code: string): Settlement {
  const st = STATES[code]!;
  const line = `${st.name} Income Tax`;
  const eitc = st.tax?.eitc;
  return {
    ...US,
    benefitLines: st.ui?.taxed ? new RegExp(`^(Federal|${st.name}) Income Tax$`) : US.benefitLines!,
    credits: (y, byLine) => {
      const federal = usEitc(y, allBenefits(y));
      return [
        { name: 'Earned Income Tax Credit', amount: federal, refundable: true },
        ...(eitc ? [{ name: `${st.name} Earned Income Tax Credit`, amount: eitc.refundable ? federal * eitc.share : Math.min(federal * eitc.share, byLine[line] ?? 0), refundable: eitc.refundable }] : []),
      ];
    },
    source: `${US.source}; ${st.name}${eitc ? ` adds ${Math.round(eitc.share * 100)}% of the federal credit${eitc.refundable ? '' : ', against its own tax'},` : ''} ${st.ui?.taxed ? 'taxes' : 'doesn’t tax'} unemployment benefit (${st.tax?.source ?? st.ui?.source ?? ''})`,
  };
}

export const SETTLEMENTS: Readonly<Record<string, Settlement>> = {
  US,
  ...Object.fromEntries(Object.keys(STATES).map((code) => [code, stateReturn(code)])),
  'US-NY': {
    ...US,
    benefitLines: /^(Federal|New York State) Income Tax$/,
    credits: (y, byLine) => {
      const federal = usEitc(y, allBenefits(y));
      const household = Math.min(nyHouseholdCredit(y.wages + allBenefits(y)), byLine['New York State Income Tax'] ?? 0);
      return [
        { name: 'Earned Income Tax Credit', amount: federal, refundable: true },
        { name: 'New York Household Credit', amount: household, refundable: false },
        { name: 'New York Earned Income Credit', amount: Math.max(0, 0.3 * federal - household), refundable: true },
      ];
    },
    source: `${US.source}; New York adds 30% of the federal credit less the household credit it can use, and taxes unemployment benefit (IT-201 and IT-215, 2025)`,
  },
  'US-CA': {
    ...US,
    credits: (y) => [
      { name: 'Earned Income Tax Credit', amount: usEitc(y, allBenefits(y)), refundable: true },
      { name: 'California Earned Income Tax Credit', amount: calEitc(y.wages, y.wages + allBenefits(y), y.age), refundable: true },
    ],
    source: `${US.source}; California’s own credit off FTB 3514’s table, 2025, to $302, and no state tax on unemployment benefit`,
  },
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
  // Quebec: the work premium, and not the Canada Workers Benefit at its
  // federal figures, since Quebec sets its own and they weren't found.
  'CA-10': {
    ...CANADA,
    credits: (y) => [{ name: 'Work Premium', amount: quebecWorkPremium(y.wages, y.wages + allBenefits(y)), refundable: true }],
    source: 'Revenu Québec: the year’s tax on a TP-1 and a T1, with the work premium for somebody living alone, 11.6% of work income over $2,400 to $1,207.33 in 2026, less 10% of family income over $12,808; EI is taxable. The CRA states no refund month; mid-May is SLATE’s estimate',
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
    credits: (y, byLine) => [{ name: 'Rent Tax Credit', amount: Math.min(0.2 * y.rent, 1_000, byLine.PAYE ?? 0), refundable: false }],
    source: 'Revenue: a PAYE worker’s year is settled on the statement through myAccount, from January (SLATE’s estimate of when), with the rent credit, 20% of rent to €1,000, against income tax; Jobseeker’s Benefit bears income tax, not USC or PRSI',
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
  // Korea: the employer's year-end settlement with February's pay for
  // somebody in work at the year's end, a May return for somebody not, and
  // the earned income credit paid apart at the end of September.
  KR: {
    name: '연말정산', yearStart: [1, 1],
    settle: [{ month: 2, day: 25, offsetYears: 0, ifEmployed: true }, { month: 6, day: 30, offsetYears: 0, estimate: true }],
    later: {
      name: '근로장려금', settle: { month: 9, day: 30, offsetYears: 0 },
      amount: (y) => koreaEarnedIncome(y.wages, y.savings),
      source: '조세특례제한법 제100조의5: applied for in May and paid by the end of September, for a single household by the year’s pay and savings; SLATE applies for it',
    },
    source: 'NTS: the employer settles the year with February’s pay (소득세법 제137조); somebody without an employer then may file in May, and a refund comes around the end of June, SLATE’s estimate. 구직급여 isn’t taxed',
  },
  FR: {
    name: 'Impôt Sur Le Revenu', yearStart: [1, 1],
    settle: [{ month: 7, day: 31, offsetYears: 0, only: 'refund' }, { month: 9, day: 25, offsetYears: 0, only: 'due' }],
    // The year's taxable pay and the ARE, which is taxed as pay, on the 2026 barème.
    tax: (y) => franceIncomeTax(franceTaxable(y.wages) + allBenefits(y)),
    source: 'impots.gouv.fr: the year’s tax on the spring return, on the 2026 barème with the 10% deduction and the décote; a refund paid at the end of July, a balance taken on 25 September (over €300, in four from then to December); ARE is taxable',
  },
  MX: {
    name: 'Declaración Anual', yearStart: [1, 1],
    settle: [{ month: 2, day: 28, offsetYears: 0, ifWholeYear: true }, { month: 5, day: 15, offsetYears: 0, estimate: true }],
    source: 'LISR arts. 97 and 98: the employer’s annual calculation for somebody with it all year, settled by February; anybody else files in April, and SAT’s automatic refund comes after it, mid-May being SLATE’s estimate. The Mexico City unemployment insurance isn’t taxed',
  },
  AU: {
    name: 'Tax Return', yearStart: [7, 1], settle: [{ month: 11, day: 14, offsetYears: 0, estimate: true }],
    benefitLines: /^(PAYG Withholding|Medicare Levy)$/,
    source: 'ATO: the year to 30 June on a return due 31 October, most online refunds within two weeks; JobSeeker is taxable, and nothing is withheld from it',
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
