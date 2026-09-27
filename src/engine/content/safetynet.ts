/**
 * SLATE — what's there between jobs and at the year's end, for an actor in
 * New York or California: unemployment insurance, health cover bought on the
 * marketplace, California's mandate, and the income tax return
 * (`systems/unemployment.ts`, `systems/health.ts`, `systems/taxreturn.ts`).
 * Researched 2026-09-26; each figure's source is beside it, and what isn't
 * published says it's SLATE's estimate.
 */

import type { Money } from '../core/money';
import type { RateSteps } from './career';

/** The states SLATE pays unemployment in, by the city an actor lives in. */
export type BenefitState = 'ny' | 'ca';
export const BENEFIT_STATE: Readonly<Record<string, BenefitState>> = { 'us-ny-newyork': 'ny', 'us-ca-losangeles': 'ca' };

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
 * The marketplace's benchmark plan, the second-cheapest silver, a month, for
 * a single adult. Los Angeles: Covered California's 2026 rates for regions 15
 * and 16 at age 40, $463 and $459, put at age 27 by the federal age curve,
 * about $378. New York City: community rated, Kings County's 2025 $880.24
 * with 2026's average 7.1%, about $940, and 2027's approved 6.0% on it. Both
 * are SLATE's estimate from published figures; later years hold.
 */
export const BENCHMARK: Readonly<Record<BenefitState, RateSteps>> = {
  ny: [['2026-01-01', 940_00], ['2027-01-01', 996_00]],
  ca: [['2026-01-01', 378_00]],
};
export const BENCHMARK_SOURCE = 'https://hbex.coveredca.com/toolkit/downloads/CCA_26_Regional_Bronze_and_Silver_Rates.pdf; https://www.dfs.ny.gov/reports_and_publications/press_releases/pr20260904';

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
  essentialCopaysFrom: 1.5,
  workFrom: '2027-01-01',
  workHours: 80,
  workEarnings: 580_00,
  renewMonths: [['2025-01-01', 12], ['2027-03-01', 6]] as RateSteps,
  source: 'https://www.health.ny.gov/health_care/medicaid/; https://info.nystateofhealth.ny.gov/EssentialPlan; https://www.dhcs.ca.gov/services/medi-cal/; Pub. L. 119-21 (2025)',
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
export interface PlanDesign { visit: Money; urgent: Money; emergency: Money; stayShare: number; deductible: Money; outOfPocket: Money; label: string }

export const PLANS: Readonly<Record<string, PlanDesign>> = {
  // Yale Health's student plan: care at the Health Center without charge; what it leaves is SLATE's estimate.
  yale: { visit: 0, urgent: 0, emergency: 0, stayShare: 0, deductible: 0, outOfPocket: 0, label: 'Yale Health' },
  sag: { visit: 25_00, urgent: 25_00, emergency: 100_00, stayShare: 0.1, deductible: 500_00, outOfPocket: 2_750_00, label: 'SAG-AFTRA Health Plan' },
  equity: { visit: 25_00, urgent: 0, emergency: 100_00, stayShare: 0, deductible: 1_000_00, outOfPocket: 4_550_00, label: 'Equity-League Health, Tier 2' },
  'marketplace-ca': { visit: 50_00, urgent: 50_00, emergency: 400_00, stayShare: 0.3, deductible: 5_200_00, outOfPocket: 9_800_00, label: 'Covered California Silver 70' },
  'marketplace-ny': { visit: 30_00, urgent: 70_00, emergency: 500_00, stayShare: 0, deductible: 2_450_00, outOfPocket: 10_150_00, label: 'NY State Of Health Silver' },
  medicaid: { visit: 0, urgent: 0, emergency: 0, stayShare: 0, deductible: 0, outOfPocket: 0, label: 'Medicaid' },
  'essential-low': { visit: 0, urgent: 0, emergency: 0, stayShare: 0, deductible: 0, outOfPocket: 0, label: 'Essential Plan' },
  'essential-high': { visit: 15_00, urgent: 25_00, emergency: 75_00, stayShare: 0, deductible: 0, outOfPocket: 2_000_00, label: 'Essential Plan' },
};
export const PLANS_SOURCE = 'https://www.coveredca.com/support/before-you-buy/standard-benefit-designs/; NY State of Health 2026 standard silver; https://www.sagaftraplans.org/health; https://equityleague.org/health/';

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
