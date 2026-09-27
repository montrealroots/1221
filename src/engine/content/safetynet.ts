/**
 * SLATE — what's there between jobs and at the year's end, for an actor in
 * New York, California or Connecticut (Connecticut's since 2026-09-27): unemployment insurance, health cover bought on the
 * marketplace, California's mandate, and the income tax return
 * (`systems/unemployment.ts`, `systems/health.ts`, `systems/taxreturn.ts`).
 * Researched 2026-09-26; each figure's source is beside it, and what isn't
 * published says it's SLATE's estimate.
 */

import type { Money } from '../core/money';
import type { RateSteps } from './career';

/** The states SLATE pays unemployment in, by the city an actor lives in. */
export type BenefitState = 'ny' | 'ca' | 'ct';
export const BENEFIT_STATE: Readonly<Record<string, BenefitState>> = { 'us-ny-newyork': 'ny', 'us-ca-losangeles': 'ca', 'us-ct-newhaven': 'ct' };

/**
 * New York's unemployment insurance, claims from 2026: wages in two quarters
 * of the base period, $3,500 in one, and in all at least one and a half
 * times the high quarter; a weekly benefit of the high quarter over 26, or
 * over 25 at $3,575 or less, from $143 to $869; an unpaid waiting week; 26
 * weeks in a benefit year. A week with work pays by its hours, 0 to 10 in
 * full, 11 to 16 three-quarters, 17 to 21 half, 22 to 30 a quarter, over 30
 * nothing, and nothing where the week's pay reaches the maximum.
 */
export const NEW_YORK_UI = {
  highQuarterMinimum: 3_500_00,
  totalTimesHighQuarter: 1.5,
  over25Until: 3_575_00,
  floor: 143_00,
  maximum: 869_00,
  weeks: 26,
  hourBands: [[10, 1], [16, 0.75], [21, 0.5], [30, 0.25]] as readonly (readonly [number, number])[],
  taxedByState: true,
  source: 'https://forms.labor.ny.gov/UI/TC408.pdf; https://dol.ny.gov/mbr',
} as const;

/**
 * California's: $1,300 in the high quarter, or $900 and in all one and a
 * quarter times it; a weekly benefit of about the high quarter over 26, $40
 * to $450; an unpaid waiting week; at most the lesser of 26 weeks' benefit
 * and half the base period's wages. A week with work pays the benefit less
 * its earnings above the greater of $25 and a quarter of them. The table's
 * higher share below a $1,833 high quarter is taken as the same division.
 */
export const CALIFORNIA_UI = {
  highQuarterMinimum: 1_300_00,
  lowHighQuarter: 900_00,
  totalTimesHighQuarter: 1.25,
  floor: 40_00,
  maximum: 450_00,
  weeks: 26,
  disregard: 25_00,
  disregardShare: 0.25,
  taxedByState: false,
  source: 'https://edd.ca.gov/siteassets/files/pdf_pub_ctr/de8714ab.pdf; https://edd.ca.gov/siteassets/files/pdf_pub_ctr/de1101bt5.pdf',
} as const;

/**
 * Connecticut's, claims from 2026 (General Statutes chapter 567): base-period
 * wages at least 40 times the weekly benefit, with no high-quarter test; a
 * weekly benefit of the average of the two highest quarters over 26, rounded
 * down, from $44 in 2026 ($45 in 2027, SLATE's estimate by the statute's
 * index, the ECI's 3.2% to June 2026) to $721, frozen until October 2028; no
 * waiting week; 26 weeks' benefit in a benefit year. A week with work pays
 * the benefit less two-thirds of its pay, rounded up, which is nothing where
 * the pay reaches one and a half times the benefit, as the statute says. Wages Yale paid a student
 * don't count (§31-222(a)(5)(G)), as work-study's never do in SLATE.
 */
export const CONNECTICUT_UI = {
  totalTimesWeekly: 40,
  floor: [['2026-01-01', 44_00], ['2027-01-01', 45_00]] as RateSteps,
  maximum: 721_00,
  weeks: 26,
  partialShare: 2 / 3,
  taxedByState: true,
  source: 'https://www.cga.ct.gov/current/pub/chap_567.htm (§§31-229, 31-230, 31-231a, 31-231b, 31-235); https://portal.ct.gov/dol/divisions/unemployment-insurance-tax/information-on-unemployment-tax-rate-for-calendar-year-2026',
} as const;

/**
 * The marketplace's benchmark plan, the second-cheapest silver, a month, for
 * a single adult. Los Angeles: Covered California's 2026 rates for regions 15
 * and 16 at age 40, $463 and $459, put at age 27 by the federal age curve,
 * about $378. New York City: community rated, Kings County's 2025 $880.24
 * with 2026's average 7.1%, about $940, and 2027's approved 6.0% on it. Both
 * are SLATE's estimate from published figures; later years hold. New Haven
 * County: Access Health CT's 2025 grid, $562.01 at 27, grown by KFF's 25.5%
 * for Connecticut's 2026 benchmark to about $706, and by the Insurance
 * Department's approved 11.3% average for 2027 to about $786, SLATE's
 * estimate.
 */
export const BENCHMARK: Readonly<Record<BenefitState, RateSteps>> = {
  ny: [['2026-01-01', 940_00], ['2027-01-01', 996_00]],
  ca: [['2026-01-01', 378_00]],
  ct: [['2026-01-01', 706_00], ['2027-01-01', 786_00]],
};
export const BENCHMARK_SOURCE = 'https://www.kff.org/affordable-care-act/state-indicator/marketplace-average-benchmark-premiums/; https://ctmirror.org/2026/09/14/ct-insurance-rate-hikes-2027-approved/; https://hbex.coveredca.com/toolkit/downloads/CCA_26_Regional_Bronze_and_Silver_Rates.pdf; https://www.dfs.ny.gov/reports_and_publications/press_releases/pr20260904';

/**
 * The premium tax credit, with the enhanced credits expired at the end of
 * 2025: the benchmark less the applicable percentage of income, by income
 * against the poverty line, and none over 400% of it. 2026's percentages are
 * Rev. Proc. 2025-25's, 2027's Rev. Proc. 2026-26's; later years hold. The
 * poverty line is 2025's $15,650 for one person, which 2026's cover reads.
 */
export const PREMIUM_CREDIT = {
  povertyLine: 15_650_00,
  cutoff: 4,
  /** [share of the poverty line, percentage from, percentage to] */
  bands: {
    2026: [[1.33, 0.021, 0.021], [1.5, 0.0314, 0.0419], [2, 0.0419, 0.066], [2.5, 0.066, 0.0844], [3, 0.0844, 0.0996], [4, 0.0996, 0.0996]],
    2027: [[1.33, 0.0215, 0.0215], [1.5, 0.0323, 0.043], [2, 0.043, 0.0678], [2.5, 0.0678, 0.0866], [3, 0.0866, 0.1022], [4, 0.1022, 0.1022]],
  } as Readonly<Record<number, readonly (readonly [number, number, number])[]>>,
  source: 'https://www.irs.gov/pub/irs-drop/rp-26-26.pdf; Rev. Proc. 2025-25',
} as const;

/**
 * Open enrollment runs 1 November to 15 January; losing other cover opens 60
 * days to enroll. Cover starts on the first of the next month.
 */
export const ENROLLMENT = { openFrom: [11, 1] as const, openUntil: [1, 15] as const, specialDays: 60 } as const;

/**
 * Access Health CT opens its own: from 23 October for plan year 2027, while
 * the federal rule ending enrollment on 31 December is in court, to 15
 * January. HUSKY and Covered Connecticut take anybody at any time.
 */
export const CONNECTICUT_ENROLLMENT = { openFrom: [10, 23] as const, openUntil: [1, 15] as const, source: 'https://ctnewsjunkie.com/2026/09/21/access-health-ct-revises-open-enrollment-dates-for-2027/' } as const;

/**
 * California's penalty for a month without cover: the greater of a flat sum
 * a year (2025's $950 an adult; 2026's isn't published) and 2.5% of income,
 * by the month, no more than the average bronze plan, $420 a month in 2026.
 * The income it takes 2.5% of is above the state's filing threshold, which
 * SLATE doesn't have, so it's the whole income. New York has none.
 */
export const CALIFORNIA_MANDATE = { flat: 950_00, share: 0.025, bronzeMonth: 420_00, source: 'https://hbex.coveredca.com/financial-reports/PDFs/2026/Final%20Release%20-%20Individual%20Shared%20Responsibility%20Penalty%202026_20250825.pdf' } as const;

/**
 * The return. Due 15 April, or the next business day, with Washington's
 * Emancipation Day, 16 April, observed on the nearest weekday. A refund comes
 * within 21 days of filing. Late, 5% of the unpaid tax a month or part of
 * one, up to 25%, less the 0.5% a month for paying late in the same months;
 * over 60 days late, at least $525 (returns due in 2026) or all the tax due.
 * The qualified performing artist deduction takes the job's expenses off
 * income at $16,000 or less, with two employers paying $200 or more and
 * expenses over a tenth of it; other employee expenses aren't deductible,
 * permanently since 2026.
 */
export const RETURN = {
  refundDays: 21,
  lateMonthly: 0.05,
  payLateMonthly: 0.005,
  lateCap: 0.25,
  lateMinimum: 525_00,
  lateMinimumAfterDays: 60,
  performingArtistIncome: 16_000_00,
  performingArtistEmployers: 2,
  performingArtistEmployerPay: 200_00,
  performingArtistShare: 0.1,
  source: 'https://www.irs.gov/payments/failure-to-file-penalty; https://www.irs.gov/refunds; IRC §62(a)(2)(B), §67(g)',
} as const;

/** A cents amount by a year's steps. */
export const byYear = (steps: RateSteps, year: number): Money => {
  let v = steps[0]![1];
  for (const [from, cents] of steps) if (Number(from.slice(0, 4)) <= year) v = cents;
  return v;
};

/**
 * The poverty line for one person, by the year a program reads it: 2025's
 * $15,650 for 2026's marketplace credit, 2026's $15,960 for the programs
 * that test current income.
 */
export const POVERTY_LINE: RateSteps = [['2025-01-01', 15_650_00], ['2026-01-01', 15_960_00]];

/**
 * Public cover, tested on current monthly income. Medicaid in New York and
 * Medi-Cal in California take a single adult at 138% of the poverty line
 * ($1,836 a month in 2026), with no premium and nothing to pay for care but
 * New York's pharmacy copays. New York's Essential Plan takes them from there
 * to 200% ($2,660), no premium, $0 copays to 150% and $15 to $150 above it;
 * its band to 250% ended 1 July 2026. From 1 January 2027 the federal law
 * asks a Medicaid adult for 80 hours' work or $580 of earnings a month, and
 * renews them every six months from 1 March 2027. A person a program takes
 * gets no marketplace credit.
 */
export const PUBLIC_COVER = {
  medicaidShare: 1.38,
  essentialShare: 2.0,
  /**
   * Covered Connecticut: from HUSKY's 138% to 175% of the poverty line, the
   * prior year's as the marketplace reads it, a silver plan with no premium
   * and nothing to pay, at any time. HUSKY D, Connecticut's Medicaid, takes a
   * single adult to 138% with no copays, and from 1 January 2027 asks the
   * work and renews every six months from then.
   */
  coveredCtShare: 1.75,
  renewMonthsCt: [['2025-01-01', 12], ['2027-01-01', 6]] as RateSteps,
  essentialCopaysFrom: 1.5,
  workFrom: '2027-01-01',
  workHours: 80,
  workEarnings: 580_00,
  renewMonths: [['2025-01-01', 12], ['2027-03-01', 6]] as RateSteps,
  source: 'https://portal.ct.gov/dss/knowledge-base/articles/healthcare-coverage/husky-d; https://portal.ct.gov/dss/health-and-home-care/covered-connecticut-program; https://www.health.ny.gov/health_care/medicaid/; https://info.nystateofhealth.ny.gov/EssentialPlan; https://www.dhcs.ca.gov/services/medi-cal/; Pub. L. 119-21 (2025)',
} as const;

/**
 * COBRA: 60 days to elect after losing a plan, cover back to the day it was
 * lost, 18 months at most, at the plan's full cost. 2026, a month: SAG-AFTRA
 * $1,277; Equity-League's Tier 2 $1,348.50. New York pays 75% of an
 * entertainment worker's COBRA for up to 12 months where their income is
 * $5,217 a month or less. Yale Health has no continuation.
 */
export const COBRA = {
  electDays: 60,
  months: 18,
  premium: { sag: 1_277_00, equity: 1_348_50 },
  newYorkShare: 0.75,
  newYorkMonths: 12,
  newYorkIncome: 5_217_00,
  source: 'https://www.dol.gov/general/topic/health-plans/cobra; https://www.sagaftraplans.org/health/premiums; https://equityleague.org/health/premiums/',
} as const;

/**
 * What care costs and how often it comes, for an adult of 25 to 44: two
 * doctor's visits a year, 0.45 emergency visits, 0.04 hospital stays, and in
 * a flu season (October to March) an 8.9% chance of the flu, which sends 37%
 * of those who have it to a clinician. The commercial prices: a visit $100,
 * urgent care $180, an emergency visit $2,450, a medical stay $11,600; the
 * uninsured are billed about 1.75 times those. A stay is SLATE's three days,
 * and what illness takes from a body is SLATE's estimate.
 */
export const CARE = {
  perYear: { visit: 2.0, emergency: 0.45, stay: 0.04 },
  flu: 0.089,
  fluSeasonWeeks: 26,
  fluSeesClinician: 0.37,
  price: { visit: 100_00, urgent: 180_00, emergency: 2_450_00, stay: 11_600_00 },
  uninsuredMarkup: 1.75,
  stayDays: 3,
  toll: { flu: { condition: 25, energy: 30 }, emergency: { condition: 20, energy: 20 }, stay: { condition: 40, energy: 40 } },
  source: 'CDC NAMCS and NHAMCS; CDC flu burden estimates; HCCI; FAIR Health; KFF–Peterson',
} as const;

/** What a plan leaves the patient: copays for a visit, urgent care and the emergency room, the share of a stay after the deductible, and the most in a year. */
export interface PlanDesign { visit: Money; urgent: Money; emergency: Money; stayShare: number; deductible: Money; outOfPocket: Money; label: string; stayCopay?: Money; stayCopayCap?: Money }

export const PLANS: Readonly<Record<string, PlanDesign>> = {
  // Yale Health's Hospitalization and Specialty coverage, 2026–27: the Health Center and its Acute Care free, $50 an
  // emergency room, $200 an admission to $1,000 a year, $9,100 a year at most. Until 2026-09-27 SLATE took it as free
  // throughout, and then for a while that day left out the $1,000.
  yale: { visit: 0, urgent: 0, emergency: 50_00, stayShare: 0, deductible: 0, outOfPocket: 9_100_00, stayCopay: 200_00, stayCopayCap: 1_000_00, label: 'Yale Health' },
  sag: { visit: 25_00, urgent: 25_00, emergency: 100_00, stayShare: 0.1, deductible: 500_00, outOfPocket: 2_750_00, label: 'SAG-AFTRA Health Plan' },
  equity: { visit: 25_00, urgent: 0, emergency: 100_00, stayShare: 0, deductible: 1_000_00, outOfPocket: 4_550_00, label: 'Equity-League Health, Tier 2' },
  'marketplace-ca': { visit: 50_00, urgent: 50_00, emergency: 400_00, stayShare: 0.3, deductible: 5_200_00, outOfPocket: 9_800_00, label: 'Covered California Silver 70' },
  'marketplace-ny': { visit: 30_00, urgent: 70_00, emergency: 500_00, stayShare: 0, deductible: 2_450_00, outOfPocket: 10_150_00, label: 'NY State Of Health Silver' },
  medicaid: { visit: 0, urgent: 0, emergency: 0, stayShare: 0, deductible: 0, outOfPocket: 0, label: 'Medicaid' },
  'essential-low': { visit: 0, urgent: 0, emergency: 0, stayShare: 0, deductible: 0, outOfPocket: 0, label: 'Essential Plan' },
  'essential-high': { visit: 15_00, urgent: 25_00, emergency: 75_00, stayShare: 0, deductible: 0, outOfPocket: 2_000_00, label: 'Essential Plan' },
  // Access Health CT's Standard Silver, 2026: $45 a visit, $75 urgent care, $450 an emergency room, a $5,000
  // deductible, $9,400 at most; a stay after the deductible at $500 a day to $2,000 an admission, $1,500 for SLATE's three days.
  'marketplace-ct': { visit: 45_00, urgent: 75_00, emergency: 450_00, stayShare: 0, deductible: 5_000_00, outOfPocket: 9_400_00, stayCopay: 1_500_00, label: 'Access Health CT Standard Silver' },
  'covered-ct': { visit: 0, urgent: 0, emergency: 0, stayShare: 0, deductible: 0, outOfPocket: 0, label: 'Covered Connecticut' },
};
export const PLANS_SOURCE = 'http://agency.accesshealthct.com/wp-content/uploads/2025/03/2026-Standard-Silver-Plan-70.pdf; https://www.coveredca.com/support/before-you-buy/standard-benefit-designs/; NY State of Health 2026 standard silver; https://www.sagaftraplans.org/health; https://equityleague.org/health/';

/**
 * Hospital bills to the uninsured. New York's hospitals charge nothing under
 * 200% of the poverty line; California's must discount care to 400%, which
 * SLATE takes as the commercial price, not the list.
 */
export const CHARITY = { newYorkFreeBelow: 2, californiaDiscountBelow: 4, source: 'NY Public Health Law §2807-k(9-a); California Health and Safety Code §127400 et seq.' } as const;

/**
 * A medical debt goes on a credit record only at $500 or more, unpaid, and a
 * year past due, by the credit bureaus' own policy since the federal rule was
 * vacated in 2025; New York and California bar it for their residents (both
 * laws were being challenged in 2026). A bill is due in 30 days. What a
 * reported debt costs the record is SLATE's estimate.
 */
export const MEDICAL_DEBT = { reportAt: 500_00, reportAfterDays: 365, dueDays: 30, recordHit: 40, barredIn: ['us-ny', 'us-ca'] as readonly string[] } as const;

/**
 * A return where more than one state is in the year. New York, California
 * and Connecticut each tax a part-year resident or a nonresident as if they
 * had lived there all year, times the share of income that's theirs: what
 * came while living there, and wages for work done there. New York City
 * taxes only the months lived in it. A wage is the state's where the work was
 * done. The state lived in credits the tax another state charged on the same
 * income, up to its own tax on it. Georgia leaves a nonresident's wages
 * alone at $5,000 or 5% of all their wages, whichever is less.
 */
export const STATE_RETURN = {
  georgiaExempt: 5_000_00,
  georgiaExemptShare: 0.05,
  source: 'https://www.tax.ny.gov/pdf/current_forms/it/it203i.pdf; https://www.ftb.ca.gov/forms/2025/2025-540nr-booklet.pdf; https://dor.georgia.gov',
} as const;

/**
 * Working abroad. Canada withholds 23% of a nonresident actor's gross for
 * film, television and commercial acting, and its residuals; under the
 * treaty a US resident whose Canadian gross in the calendar year is CAD
 * 15,000 or less owes none, and the withholding comes back. Over it, a
 * section 216.1 return filed by 30 April pays Canada's graduated federal
 * rates on the net (the gross less the agent's and manager's share) and,
 * an actor being the production's employee, the tax of the province the
 * work was done in: British Columbia's for Vancouver, Ontario's and its
 * surtax for Toronto, each on the whole net and taken in the share of the
 * gross earned there (Form T2203); the 48% federal surtax only on what no
 * province takes. The 23% is credited and the rest refunded. The basic
 * personal amounts, federal and provincial, only where Canadian income is
 * 90% of the year's. A return filed later loses the election, and the 23%
 * stands. The 2026 brackets hold for later years, SLATE's estimate. Until
 * 2026-09-27 SLATE charged the 48% surtax on it all, the self-employed's
 * rule, where an employed actor's province's is the law.
 *
 * The United Kingdom withholds 20% from a nonresident entertainer's every
 * payment once one payer's total in the UK tax year (6 April to 5 April)
 * is expected past £12,570, and none where it isn't. After the year, the
 * treaty gives back everything where the UK gross was $20,000 or less;
 * over it, UK tax is due on it all, a US citizen having no personal
 * allowance, at 20% to £37,700, 40% to £125,140 and 45% above, and the
 * difference from what was withheld is paid or refunded with the return,
 * on 31 January. The US credits the foreign tax against its own on the same
 * income, to its own tax on it; New York and California don't. Until
 * 2026-09-27 SLATE took both by the calendar year, withheld the UK's only
 * past the treaty's $20,000, and never settled either.
 */
export const ABROAD = {
  canada: {
    rate: 0.23, treatyCad: 15_000_00,
    brackets: [[58_523_00, 0.14], [117_045_00, 0.205], [181_440_00, 0.26], [258_482_00, 0.29], [Number.POSITIVE_INFINITY, 0.33]] as readonly (readonly [number, number])[],
    basicPersonal: 16_452_00, residentShare: 0.9, surtax: 0.48, electBy: { month: 4, day: 30 },
    /** By region: British Columbia's 2026 brackets after its budget, Ontario's with its surtax on its own tax. */
    provinces: {
      'ca-02': {
        brackets: [[50_363_00, 0.056], [100_728_00, 0.077], [115_648_00, 0.105], [140_430_00, 0.1229], [190_405_00, 0.147], [265_545_00, 0.168], [Number.POSITIVE_INFINITY, 0.205]],
        basicPersonal: 13_216_00,
      },
      'ca-08': {
        brackets: [[53_891_00, 0.0505], [107_785_00, 0.0915], [150_000_00, 0.1116], [220_000_00, 0.1216], [Number.POSITIVE_INFINITY, 0.1316]],
        basicPersonal: 12_989_00,
        surtax: [[5_818_00, 0.2], [7_446_00, 0.36]],
      },
    } as Readonly<Record<string, { brackets: readonly (readonly [number, number])[]; basicPersonal: Money; surtax?: readonly (readonly [number, number])[] }>>,
  },
  uk: {
    rate: 0.2, treatyUsd: 20_000_00, payerThresholdGbp: 12_570_00,
    bands: [[37_700_00, 0.2], [125_140_00, 0.4], [Number.POSITIVE_INFINITY, 0.45]] as readonly (readonly [number, number])[],
    settleMonth: 1, settleDay: 31,
  },
  source: 'https://www.canada.ca/en/revenue-agency/services/tax/international-non-residents/film-media-tax-credits/non-resident-actors/taxation-non-resident-actors-providing-film-video-acting-services-canada.html; https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/canadian-income-tax-rates-individuals-current-previous-years.html; CRA T4058 and T2203; CRA T4127 (2026); https://www2.gov.bc.ca/gov/content/taxes/income-taxes/personal/tax-rates; https://www.ontario.ca/document/ontario-personal-income-tax; https://www.gov.uk/guidance/pay-tax-in-the-uk-as-a-foreign-performer; https://www.gov.uk/income-tax-rates; IRS Form 1116',
} as const;

/**
 * Connecticut's income tax for a single filer (Form CT-1040 instructions,
 * 2025, its thresholds unindexed and held): nothing at $15,000 or less; a
 * $15,000 exemption falling $1,000 a $1,000 past $30,000; 2% on the first
 * $10,000 taxable and 4.5% to $50,000, then 5.5%, 6%, 6.5%, 6.9% and 6.99%;
 * $25 added a $5,000 past $56,500, to $250; and the personal credit, a share
 * of the tax by income, from .75 to nothing.
 */
export const CONNECTICUT = {
  exemption: 15_000_00,
  exemptionFrom: 30_000_00,
  brackets: [[0, 0.02], [10_000_00, 0.045], [50_000_00, 0.055], [100_000_00, 0.06], [200_000_00, 0.065], [250_000_00, 0.069], [500_000_00, 0.0699]] as readonly (readonly [Money, number])[],
  addBackFrom: 56_500_00,
  addBackStep: 25_00,
  addBackMax: 250_00,
  credit: [[18_800_00, 0.75], [19_300_00, 0.7], [19_800_00, 0.65], [20_300_00, 0.6], [20_800_00, 0.55], [21_300_00, 0.5], [21_800_00, 0.45], [22_300_00, 0.4], [25_000_00, 0.35], [25_500_00, 0.3], [26_000_00, 0.25], [26_500_00, 0.2], [31_300_00, 0.15], [31_800_00, 0.14], [32_300_00, 0.13], [32_800_00, 0.12], [33_300_00, 0.11], [60_000_00, 0.1], [60_500_00, 0.09], [61_000_00, 0.08], [61_500_00, 0.07], [62_000_00, 0.06], [62_500_00, 0.05], [63_000_00, 0.04], [63_500_00, 0.03], [64_000_00, 0.02], [64_500_00, 0.01]] as readonly (readonly [Money, number])[],
  source: 'https://portal.ct.gov/-/media/drs/forms/2025/income/2025-ct-1040-instructions_1225.pdf',
} as const;

/**
 * New York and California let an employee itemize the job's costs on the
 * state return (New York's Form IT-196, California's Schedule CA) above 2% of
 * federal income, where that beats the state's standard deduction: $8,000
 * in New York, $5,706 in California (2025's, held). SLATE counts an actor's
 * commissions and union dues.
 */
/**
 * The work's costs a return can deduct are the ones with a record: the
 * IRS and the states ask for it. Commissions and dues are on the checks and
 * the union's statements; of the rest, SLATE's estimate is that four in five
 * are kept, all of them by somebody who keeps accounts, and fewer by a
 * chaotic one.
 */
export const RECEIPTS = { kept: 0.8, source: 'https://www.irs.gov/publications/p463 (records, chapter 5); NY IT-196 and CA Schedule CA instructions' } as const;

export const STATE_DEDUCTIONS = {
  floor: 0.02,
  standard: { 'us-ny': 8_000_00, 'us-ca': 5_706_00 } as Readonly<Record<string, Money>>,
  source: 'https://www.tax.ny.gov/pdf/current_forms/it/it196_fill_in.pdf; https://www.ftb.ca.gov/forms/2025/2025-540-ca-instructions.html',
} as const;

/**
 * The pharmacy. About 4.5 prescriptions filled a person a year at 18 to 44
 * (9.3 a user, MEPS, and 48.4% take one, NHIS 2021), 89% of them generic, a
 * generic's cash price $40 and a brand's $440 (2019 medians). What each plan
 * leaves at the counter, a generic and a brand: Covered California's Silver
 * 70 $19 and $60, a $50 deductible on brands; New York's silver $15 and $40;
 * SAG-AFTRA the greater of $10 or 10% and of $25 or 25%, a $75 deductible;
 * Equity-League the greater of $10 or 20% and of $20 or 25%, $100 on
 * brands; New York's Medicaid $1 and $1; Medi-Cal nothing.
 */
export interface Pharmacy { generic: [Money, number]; brand: [Money, number]; brandDeductible: Money }
export const PHARMACY = {
  perYear: 4.5,
  generic: 0.89,
  price: { generic: 40_00, brand: 440_00 },
  plans: {
    'marketplace-ca': { generic: [19_00, 0], brand: [60_00, 0], brandDeductible: 50_00 },
    'marketplace-ny': { generic: [15_00, 0], brand: [40_00, 0], brandDeductible: 0 },
    'marketplace-ct': { generic: [10_00, 0], brand: [50_00, 0], brandDeductible: 250_00 },
    'covered-ct': { generic: [0, 0], brand: [0, 0], brandDeductible: 0 },
    sag: { generic: [10_00, 0.1], brand: [25_00, 0.25], brandDeductible: 75_00 },
    equity: { generic: [10_00, 0.2], brand: [20_00, 0.25], brandDeductible: 100_00 },
    medicaid: { generic: [1_00, 0], brand: [1_00, 0], brandDeductible: 0 },
    'essential-low': { generic: [0, 0], brand: [0, 0], brandDeductible: 0 },
    'essential-high': { generic: [6_00, 0], brand: [15_00, 0], brandDeductible: 0 },
    yale: { generic: [10_00, 0], brand: [30_00, 0], brandDeductible: 0 },
  } as Readonly<Record<string, Pharmacy>>,
  source: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10121264/; https://meps.ahrq.gov/data_files/publications/st245/stat245.pdf; Covered California 2026 standard benefit designs; SAG-AFTRA and Equity-League plan summaries',
} as const;

/**
 * Teeth and eyes. About 62% of adults 18 to 44 see a dentist a year (65.5%
 * of all adults, 2023); an uninsured exam and cleaning is $203 and a filling
 * $226 (2024). About 68% wear prescription lenses; an eye exam is $136 and
 * glasses about $150. Medical plans on the marketplace carry no adult
 * dental. SAG-AFTRA's Delta Dental pays preventive care in full and 75% of a
 * filling, and VSP an exam for $10; Equity-League's Davis Vision an exam and
 * glasses a year, its dental self-paid; New York's Medicaid and Medi-Cal
 * cover both. How often a visit needs a filling, a quarter, how often a
 * wearer's eyes are checked, half the years, and new glasses, every other
 * year, are SLATE's estimate; Yale Health carries no dental.
 */
export interface TeethAndEyes { cleaning: number; filling: number; exam: Money | undefined; glasses: number }
export const DENTAL_VISION = {
  dentistShare: 0.62,
  fillingShare: 0.25,
  lensShare: 0.68,
  examShare: 0.5,
  glassesEvery: 2,
  price: { cleaning: 203_00, filling: 226_00, exam: 136_00, glasses: 150_00 },
  /** The share of each the plan pays; an exam's copay where there's one. */
  plans: {
    // Yale Health: an eye exam a year at no charge; no routine dental, nor glasses.
    yale: { cleaning: 0, filling: 0, exam: 0, glasses: 0 },
    sag: { cleaning: 1, filling: 0.75, exam: 10_00, glasses: 0.2 },
    equity: { cleaning: 0, filling: 0, exam: 0, glasses: 1 },
    medicaid: { cleaning: 1, filling: 1, exam: 0, glasses: 1 },
    'essential-low': { cleaning: 1, filling: 1, exam: 0, glasses: 1 },
    'essential-high': { cleaning: 1, filling: 1, exam: 0, glasses: 1 },
  } as Readonly<Record<string, TeethAndEyes>>,
  source: 'https://www.cdc.gov/nchs/fastats/dental.htm; SAG-AFTRA Health Plan dental and vision; https://equityleague.org/health/dental-plans/; NY Medicaid and Medi-Cal dental',
} as const;

/**
 * Chronic conditions at 18 to 34 (BRFSS 2023): depression 25.0%, asthma
 * 10.1%, high blood pressure 11.5%. Kept up, depression is two sessions of
 * therapy a month ($176 in New York, $139 elsewhere, before a plan) and a
 * generic a month; asthma an inhaler, a brand, a month and two visits a year;
 * high blood pressure a generic a month. Left alone, SLATE's estimate:
 * depression weighs on morale each week, asthma doubles the emergencies,
 * and high blood pressure does nothing a year shows.
 *
 * Diabetes, 2.0% at 18 to 34, about a quarter of it type 1: insulin a month,
 * or a generic for type 2, and a visit a quarter. Insulin's cost to the
 * patient is capped: nothing on a plan New York regulates since 2025, and
 * $35 a month from the makers to anybody; the unions' self-funded plans
 * aren't bound by the state's, and nor is Yale Health's, a university's own
 * plan, which leaves Connecticut's $25 cap out of it. Type 1 wears a
 * continuous glucose monitor as well: a FreeStyle Libre 3 Plus, $241 a month
 * cash, which Abbott's program brings to $75; a plan's brand copay where
 * that's less. The program turns away government cover, but every
 * government plan's copay here is under $75, so that changes nothing and
 * isn't kept. Arthritis, 5.0%: a generic a month and two visits a year. Left
 * alone, SLATE's estimate: type 1 diabetes quadruples the emergencies and
 * both types wear the body down, and arthritis tires it. Obesity, 27.3%,
 * isn't modeled: SLATE has no weight.
 */
export const CHRONIC = {
  share: { depression: 0.25, asthma: 0.101, hypertension: 0.115, diabetes: 0.02, arthritis: 0.05 },
  /** Of diabetes at 27 to 30, type 1: about a quarter to 30% (CDC, 2016). */
  typeOne: 0.27,
  therapy: { 'us-ny': 176_00, other: 139_00 },
  therapyPerMonth: 2,
  untreated: { moraleAWeek: 3, asthmaEmergencies: 2, diabetesEmergencies: 4, diabetesConditionAWeek: 2, arthritisEnergyAWeek: 2 },
  source: 'CDC BRFSS 2023 (ages 18–34); NHIS 2024; American Academy of Allergy, Asthma & Immunology cost estimates',
} as const;

/**
 * Insulin's caps: New York's $0 on the plans it regulates, and the makers'
 * $35 a month to anybody. California's $35 (SB 40, large groups 2026, its
 * individual plans 2027) is the makers' figure, so it changes nothing SLATE
 * shows and isn't kept. A type 1 diabetic's monitor is here too.
 */
export const INSULIN = {
  cashCap: 35_00,
  newYorkFrom: '2025-01-01',
  /** The New York plans the state regulates: its marketplace and the Essential Plan. The unions' are self-funded. */
  newYorkPlans: ['marketplace-ny', 'essential-low', 'essential-high'] as readonly string[],
  /** Connecticut's $25 a month on the plans it regulates, from 2022 (Public Act 20-4). */
  connecticutCap: 25_00,
  connecticutFrom: '2022-01-01',
  connecticutPlans: ['marketplace-ct', 'covered-ct'] as readonly string[],
  monitor: { price: 241_00, program: 75_00 },
  source: 'https://www.dfs.ny.gov/apps_and_licensing/health_insurers/insulin_cost_sharing_qa_guidance; https://leginfo.legislature.ca.gov (SB 40, 2025); Lilly, Novo Nordisk and Sanofi $35 programs; https://cga.ct.gov/2020/SUM/pdf/2020SUM00004-R02HB-06003-SUM.pdf; https://www.goodrx.com/freestyle-libre-3-plus',
} as const;

/**
 * What care cost when its price was published is grown to the year it's
 * given by the Bureau of Labor Statistics' consumer price index for its own
 * kind of care (CPI-U, US city average): hospital services for the
 * emergency room and a stay, physicians' services for a visit and urgent
 * care, prescription drugs, dental services, eyeglasses and eye care, and
 * other medical professionals for therapy. Annual averages 2018 to 2025,
 * and August 2026 for 2026; a year between prints on the straight line, and
 * past the last at the series' own 2019–24 rate, SLATE's estimate. Other
 * professionals' 2025 wasn't published. Until 2026-09-27 care cost what it
 * had in the year its price was measured, and then, for a while that day,
 * grew by the index for all medical care, which ran drugs up 2.5% a year
 * where their own index fell 2.9% the year to August 2026.
 */
export const MEDICAL_CPI = {
  series: {
    hospital: { levels: { 2018: 332.237, 2019: 338.814, 2020: 352.952, 2021: 363.533, 2022: 376.826, 2023: 392.12, 2024: 414.8, 2025: 433.655, 2026: 459.659 }, after: 0.0413 },
    physicians: { levels: { 2018: 380.451, 2019: 383.228, 2020: 389.9, 2021: 406.528, 2022: 411.927, 2023: 412.581, 2024: 417.93, 2025: 428.549, 2026: 439.389 }, after: 0.0175 },
    drugs: { levels: { 2018: 528.008, 2019: 526.785, 2020: 532.081, 2021: 522.392, 2022: 533.925, 2023: 549.458, 2024: 556.941, 2025: 568.032, 2026: 550.41 }, after: 0.0112 },
    dental: { levels: { 2018: 485.525, 2019: 496.16, 2020: 511.079, 2021: 522.5, 2022: 543.726, 2023: 574.315, 2024: 598.951, 2025: 615.074, 2026: 656.707 }, after: 0.0384 },
    eyes: { levels: { 2018: 189.609, 2019: 191.429, 2020: 192.94, 2021: 193.985, 2022: 198.68, 2023: 202.164, 2024: 209.017, 2025: 216.09, 2026: 220.071 }, after: 0.0177 },
    professionals: { levels: { 2018: 237.355, 2019: 239.204, 2020: 242.106, 2021: 247.948, 2022: 258.105, 2023: 258.694, 2024: 261.624, 2026: 281.459 }, after: 0.0181 },
  } as Readonly<Record<string, { levels: Readonly<Record<number, number>>; after: number }>>,
  /** Each price: the year it was measured, and the series that grows it. */
  base: {
    visit: [2024, 'physicians'], urgent: [2024, 'physicians'], emergency: [2019, 'hospital'], stay: [2018, 'hospital'],
    rx: [2019, 'drugs'], dental: [2024, 'dental'], vision: [2024, 'eyes'], therapy: [2024, 'professionals'],
  } as const,
  source: 'https://api.bls.gov/publicAPI/v2/timeseries/data/ (CUUR0000SEMD01, SEMC01, SEMF01, SEMC02, SEMC03, SEMC04)',
} as const;

/** How far a series' prices have grown from one year to another. */
export function medicalGrowth(from: number, to: number, series: string): number {
  const { levels, after } = MEDICAL_CPI.series[series]!;
  const years = Object.keys(levels).map(Number).sort((x, y) => x - y);
  const level = (year: number): number => {
    if (levels[year] !== undefined) return levels[year]!;
    const last = years[years.length - 1]!;
    if (year > last) return levels[last]! * (1 + after) ** (year - last);
    if (year < years[0]!) return levels[years[0]!]!;
    // Between prints, the straight line.
    const lo = years.filter((y) => y < year).pop()!;
    const hi = years.find((y) => y > year)!;
    return levels[lo]! + ((levels[hi]! - levels[lo]!) * (year - lo)) / (hi - lo);
  };
  return level(to) / level(from);
}

/**
 * Stand-alone adult dental plans. Covered California's 2026 dental PPO: a
 * $50 deductible, preventive care in full, 80% of basic work, a $1,500
 * annual maximum, bought only beside a Covered California health plan, and
 * about $40 a month in Los Angeles (its average was $27, SLATE's estimate for
 * the PPO). New York's standard adult plan: $50 and $1,500 the same, its
 * shares taken as California's, about $25 a month (SLATE's estimate). Yale's
 * Delta Dental Basic for students: $312.72 a year, $1,000 a year at most.
 */
export const DENTAL_PLANS = {
  ca: { premium: 40_00, deductible: 50_00, preventive: 1, basic: 0.8, max: 1_500_00, label: 'Covered California Dental PPO', yearly: false },
  ny: { premium: 25_00, deductible: 50_00, preventive: 1, basic: 0.8, max: 1_500_00, label: 'NY State Of Health Adult Dental', yearly: false },
  yale: { premium: 312_72, deductible: 50_00, preventive: 1, basic: 0.8, max: 1_000_00, label: 'Yale Delta Dental Basic', yearly: true },
  source: 'https://www.coveredca.com (2026 dental standard benefit designs); https://info.nystateofhealth.ny.gov; https://yalehealth.yale.edu (student dental, 2026–27)',
} as const;
