/**
 * SLATE — Taxes and jurisdiction rules.
 *
 * Where the player lives genuinely changes their money. Rules resolve down a
 * jurisdiction path (country, then region, then city) and every rule carries an
 * effective date range, because rates change and a save that runs for twenty
 * years has to survive that.
 *
 * Honesty: these rates are CALIBRATED APPROXIMATIONS of how real tax systems
 * behave in structure — progressive brackets, flat state rates, no-income-tax
 * states, sales tax, property tax, payroll tax. They are close enough for the
 * simulation to teach real intuitions and they are not filing advice.
 */

import type { Money } from '../core/money';
import { applyRate } from '../core/money';
import { jurisdictionPath } from './geography';

export interface TaxBracket {
  /** Lower bound of the bracket in cents. */
  from: Money;
  /** Marginal rate as a decimal. */
  rate: number;
}

export interface IncomeTaxRule {
  jurisdictionCode: string;
  label: string;
  kind: 'progressive' | 'flat' | 'none';
  brackets: TaxBracket[];
  flatRate?: number;
  standardDeduction: Money;
  effectiveFrom: number;
  effectiveTo?: number;
  note: string;
}

export interface PayrollTaxRule {
  jurisdictionCode: string;
  /** Employee-side social insurance rate. */
  socialRate: number;
  /** Wage base above which the social rate stops applying, in cents. */
  socialWageBase: Money;
  medicalRate: number;
  /** Additional rate above the surcharge threshold. */
  surchargeRate: number;
  surchargeThreshold: Money;
  /** Self-employed pay both halves. */
  selfEmployedMultiplier: number;
  effectiveFrom: number;
}

export interface SalesTaxRule {
  jurisdictionCode: string;
  rate: number;
  /** Categories exempt from sales tax in this jurisdiction. */
  exemptCategories: string[];
  effectiveFrom: number;
}

export interface PropertyTaxRule {
  jurisdictionCode: string;
  /** Annual rate applied to assessed value. */
  rate: number;
  /** Cap on annual assessed-value growth, as a decimal. */
  assessmentGrowthCap?: number;
  effectiveFrom: number;
}

export interface VehicleFeeRule {
  jurisdictionCode: string;
  /** Annual registration as a fraction of vehicle value. */
  registrationRate: number;
  registrationMinimum: Money;
  /** One-time sales/use tax on purchase. */
  purchaseTaxRate: number;
  /** Whether an annual safety or emissions inspection is required. */
  inspectionRequired: boolean;
  effectiveFrom: number;
}

const YEAR = (y: number) => Date.UTC(y, 0, 1);

const APPROX = 'Calibrated approximation of the real structure. Not tax advice.';

// --- Income tax -------------------------------------------------------------

function brackets(pairs: [number, number][]): TaxBracket[] {
  return pairs.map(([from, rate]) => ({ from: from * 100, rate }));
}

/**
 * Iceland, which is where this game is played and was not in this table.
 *
 * Every other rule here was written for somewhere a production might travel to.
 * The one country the player actually lives in had no row at all, so the home
 * screen told them Iceland taxes a wage at 0% and charges no sales tax — beside
 * a company the same build already describes as paying 20% corporation tax and
 * 24% VSK.
 *
 * Three bands on the combined rate, which is how an Icelander experiences it:
 * tekjuskattur to the state and útsvar to the municipality are withheld
 * together and nobody quotes them apart. State 16.78 / 23.28 / 31.85 plus an
 * average útsvar of 14.97. The thresholds are monthly in law — ISK 472,005 and
 * ISK 1,325,127 — carried to a year and to this table's unit at the atlas's own
 * ISK rate of 138 to the dollar.
 *
 * One honest substitution. Iceland's persónuafsláttur is a CREDIT against tax
 * (ISK 68,691 a month, ISK 824,292 a year) and this table only has a deduction.
 * A credit of that size at the first band's rate is worth the same as deducting
 * about $18,800, so that is what is written, and it is the one figure here that
 * is a translation rather than a number.
 */
const ICELAND_NOTE = 'Tekjuskattur and average útsvar together. The personal credit is written as the '
  + 'deduction worth the same at the first band. Calibrated approximation. Not tax advice.';

export const INCOME_TAX_RULES: readonly IncomeTaxRule[] = [
  {
    jurisdictionCode: 'US',
    label: 'United States Federal Income Tax',
    kind: 'progressive',
    brackets: brackets([
      [0, 0.10], [11_600, 0.12], [47_150, 0.22], [100_525, 0.24],
      [191_950, 0.32], [243_725, 0.35], [609_350, 0.37],
    ]),
    standardDeduction: 14_600_00,
    effectiveFrom: YEAR(2018),
    note: APPROX,
  },
  { jurisdictionCode: 'US-CA', label: 'California Income Tax', kind: 'progressive', brackets: brackets([[0, 0.01], [10_412, 0.02], [24_684, 0.04], [38_959, 0.06], [54_081, 0.08], [68_350, 0.093], [349_137, 0.103], [418_961, 0.113], [698_271, 0.123]]), standardDeduction: 5_363_00, effectiveFrom: YEAR(2018), note: APPROX },
  // New York City's resident income tax, a single filer's brackets (NY Form IT-201 instructions, NYC rate schedule;
  // the rates have stood since 2017). Until 2026-09-27 SLATE had none, and a New Yorker paid only the state's.
  { jurisdictionCode: 'US-NY-newyork', label: 'New York City Resident Income Tax', kind: 'progressive', brackets: brackets([[0, 0.03078], [12_000, 0.03762], [25_000, 0.03819], [50_000, 0.03876]]), standardDeduction: 8_000_00, effectiveFrom: YEAR(2018), note: APPROX },
  { jurisdictionCode: 'US-NY', label: 'New York State Income Tax', kind: 'progressive', brackets: brackets([[0, 0.04], [8_500, 0.045], [11_700, 0.0525], [13_900, 0.055], [80_650, 0.06], [215_400, 0.0685], [1_077_550, 0.0965], [5_000_000, 0.103]]), standardDeduction: 8_000_00, effectiveFrom: YEAR(2018), note: APPROX },
  { jurisdictionCode: 'US-GA', label: 'Georgia Income Tax', kind: 'flat', brackets: [], flatRate: 0.0539, standardDeduction: 12_000_00, effectiveFrom: YEAR(2024), note: APPROX },
  // 4.99% for 2026, by Georgia's Department of Revenue (researched 2026-09-27).
  { jurisdictionCode: 'US-GA', label: 'Georgia Income Tax', kind: 'flat', brackets: [], flatRate: 0.0499, standardDeduction: 12_000_00, effectiveFrom: YEAR(2026), note: APPROX },
  { jurisdictionCode: 'US-IL', label: 'Illinois Income Tax', kind: 'flat', brackets: [], flatRate: 0.0495, standardDeduction: 2_775_00, effectiveFrom: YEAR(2018), note: APPROX },
  { jurisdictionCode: 'US-MA', label: 'Massachusetts Income Tax', kind: 'flat', brackets: [], flatRate: 0.05, standardDeduction: 4_400_00, effectiveFrom: YEAR(2018), note: APPROX },
  { jurisdictionCode: 'US-CO', label: 'Colorado Income Tax', kind: 'flat', brackets: [], flatRate: 0.044, standardDeduction: 14_600_00, effectiveFrom: YEAR(2022), note: APPROX },
  { jurisdictionCode: 'US-AZ', label: 'Arizona Income Tax', kind: 'flat', brackets: [], flatRate: 0.025, standardDeduction: 14_600_00, effectiveFrom: YEAR(2023), note: APPROX },
  { jurisdictionCode: 'US-UT', label: 'Utah Income Tax', kind: 'flat', brackets: [], flatRate: 0.0455, standardDeduction: 14_600_00, effectiveFrom: YEAR(2023), note: APPROX },
  { jurisdictionCode: 'US-NC', label: 'North Carolina Income Tax', kind: 'flat', brackets: [], flatRate: 0.0425, standardDeduction: 12_750_00, effectiveFrom: YEAR(2024), note: APPROX },
  { jurisdictionCode: 'US-NM', label: 'New Mexico Income Tax', kind: 'progressive', brackets: brackets([[0, 0.017], [5_500, 0.032], [11_000, 0.047], [16_000, 0.049], [210_000, 0.059]]), standardDeduction: 14_600_00, effectiveFrom: YEAR(2021), note: APPROX },
  { jurisdictionCode: 'US-LA', label: 'Louisiana Income Tax', kind: 'flat', brackets: [], flatRate: 0.03, standardDeduction: 12_500_00, effectiveFrom: YEAR(2025), note: APPROX },
  { jurisdictionCode: 'US-OR', label: 'Oregon Income Tax', kind: 'progressive', brackets: brackets([[0, 0.0475], [4_300, 0.0675], [10_750, 0.0875], [125_000, 0.099]]), standardDeduction: 2_745_00, effectiveFrom: YEAR(2018), note: APPROX },
  { jurisdictionCode: 'US-HI', label: 'Hawaii Income Tax', kind: 'progressive', brackets: brackets([[0, 0.014], [9_600, 0.055], [24_000, 0.0725], [48_000, 0.0825], [175_000, 0.09], [200_000, 0.10], [325_000, 0.11]]), standardDeduction: 4_400_00, effectiveFrom: YEAR(2018), note: APPROX },
  { jurisdictionCode: 'US-NJ', label: 'New Jersey Income Tax', kind: 'progressive', brackets: brackets([[0, 0.014], [20_000, 0.0175], [35_000, 0.035], [40_000, 0.05525], [75_000, 0.0637], [500_000, 0.0897], [1_000_000, 0.1075]]), standardDeduction: 0, effectiveFrom: YEAR(2018), note: APPROX },
  { jurisdictionCode: 'US-PA', label: 'Pennsylvania Income Tax', kind: 'flat', brackets: [], flatRate: 0.0307, standardDeduction: 0, effectiveFrom: YEAR(2018), note: APPROX },
  { jurisdictionCode: 'US-MI', label: 'Michigan Income Tax', kind: 'flat', brackets: [], flatRate: 0.0425, standardDeduction: 0, effectiveFrom: YEAR(2018), note: APPROX },
  { jurisdictionCode: 'US-OH', label: 'Ohio Income Tax', kind: 'progressive', brackets: brackets([[0, 0], [26_050, 0.0275], [100_000, 0.035]]), standardDeduction: 0, effectiveFrom: YEAR(2024), note: APPROX },
  // No state income tax.
  { jurisdictionCode: 'US-TX', label: 'Texas (No State Income Tax)', kind: 'none', brackets: [], standardDeduction: 0, effectiveFrom: YEAR(1900), note: 'Texas levies no personal income tax.' },
  { jurisdictionCode: 'US-FL', label: 'Florida (No State Income Tax)', kind: 'none', brackets: [], standardDeduction: 0, effectiveFrom: YEAR(1900), note: 'Florida levies no personal income tax.' },
  { jurisdictionCode: 'US-NV', label: 'Nevada (No State Income Tax)', kind: 'none', brackets: [], standardDeduction: 0, effectiveFrom: YEAR(1900), note: 'Nevada levies no personal income tax.' },
  { jurisdictionCode: 'US-WA', label: 'Washington (No State Income Tax)', kind: 'none', brackets: [], standardDeduction: 0, effectiveFrom: YEAR(1900), note: 'Washington levies no personal income tax on wages.' },
  { jurisdictionCode: 'US-TN', label: 'Tennessee (No State Income Tax)', kind: 'none', brackets: [], standardDeduction: 0, effectiveFrom: YEAR(2021), note: 'Tennessee levies no personal income tax.' },
  // Other countries, structurally modeled.
  { jurisdictionCode: 'CA', label: 'Canada Federal Income Tax', kind: 'progressive', brackets: brackets([[0, 0.15], [55_867, 0.205], [111_733, 0.26], [173_205, 0.29], [246_752, 0.33]]), standardDeduction: 15_705_00, effectiveFrom: YEAR(2024), note: APPROX },
  { jurisdictionCode: 'CA-02', label: 'British Columbia Income Tax', kind: 'progressive', brackets: brackets([[0, 0.0506], [47_937, 0.077], [95_875, 0.105], [110_076, 0.1229], [133_664, 0.147], [181_232, 0.168], [252_752, 0.205]]), standardDeduction: 12_580_00, effectiveFrom: YEAR(2024), note: APPROX },
  { jurisdictionCode: 'CA-08', label: 'Ontario Income Tax', kind: 'progressive', brackets: brackets([[0, 0.0505], [51_446, 0.0915], [102_894, 0.1116], [150_000, 0.1216], [220_000, 0.1316]]), standardDeduction: 12_399_00, effectiveFrom: YEAR(2024), note: APPROX },
  { jurisdictionCode: 'CA-10', label: 'Quebec Income Tax', kind: 'progressive', brackets: brackets([[0, 0.14], [51_780, 0.19], [103_545, 0.24], [126_000, 0.2575]]), standardDeduction: 18_056_00, effectiveFrom: YEAR(2024), note: APPROX },
  { jurisdictionCode: 'GB', label: 'United Kingdom Income Tax', kind: 'progressive', brackets: brackets([[0, 0], [12_570, 0.20], [50_270, 0.40], [125_140, 0.45]]), standardDeduction: 0, effectiveFrom: YEAR(2021), note: APPROX },
  { jurisdictionCode: 'IE', label: 'Ireland Income Tax', kind: 'progressive', brackets: brackets([[0, 0.20], [42_000, 0.40]]), standardDeduction: 0, effectiveFrom: YEAR(2024), note: APPROX },
  { jurisdictionCode: 'FR', label: 'France Income Tax', kind: 'progressive', brackets: brackets([[0, 0], [11_294, 0.11], [28_797, 0.30], [82_341, 0.41], [177_106, 0.45]]), standardDeduction: 0, effectiveFrom: YEAR(2024), note: APPROX },
  { jurisdictionCode: 'DE', label: 'Germany Income Tax', kind: 'progressive', brackets: brackets([[0, 0], [11_604, 0.14], [17_006, 0.24], [66_761, 0.42], [277_826, 0.45]]), standardDeduction: 0, effectiveFrom: YEAR(2024), note: APPROX },
  { jurisdictionCode: 'ES', label: 'Spain Income Tax', kind: 'progressive', brackets: brackets([[0, 0.19], [12_450, 0.24], [20_200, 0.30], [35_200, 0.37], [60_000, 0.45], [300_000, 0.47]]), standardDeduction: 5_550_00, effectiveFrom: YEAR(2023), note: APPROX },
  { jurisdictionCode: 'IT', label: 'Italy Income Tax', kind: 'progressive', brackets: brackets([[0, 0.23], [28_000, 0.35], [50_000, 0.43]]), standardDeduction: 0, effectiveFrom: YEAR(2024), note: APPROX },
  { jurisdictionCode: 'AU', label: 'Australia Income Tax', kind: 'progressive', brackets: brackets([[0, 0], [18_200, 0.16], [45_000, 0.30], [135_000, 0.37], [190_000, 0.45]]), standardDeduction: 0, effectiveFrom: YEAR(2024), note: APPROX },
  { jurisdictionCode: 'NZ', label: 'New Zealand Income Tax', kind: 'progressive', brackets: brackets([[0, 0.105], [15_600, 0.175], [53_500, 0.30], [78_100, 0.33], [180_000, 0.39]]), standardDeduction: 0, effectiveFrom: YEAR(2024), note: APPROX },
  { jurisdictionCode: 'JP', label: 'Japan Income Tax', kind: 'progressive', brackets: brackets([[0, 0.05], [1_950, 0.10], [3_300, 0.20], [6_950, 0.23], [9_000, 0.33], [18_000, 0.40], [40_000, 0.45]]), standardDeduction: 480_00, effectiveFrom: YEAR(2020), note: `${APPROX} Amounts modeled in USD-equivalent for simulation purposes.` },
  { jurisdictionCode: 'KR', label: 'South Korea Income Tax', kind: 'progressive', brackets: brackets([[0, 0.06], [12_000, 0.15], [46_000, 0.24], [88_000, 0.35], [150_000, 0.38], [300_000, 0.40]]), standardDeduction: 0, effectiveFrom: YEAR(2023), note: `${APPROX} Amounts modeled in USD-equivalent.` },
  { jurisdictionCode: 'MX', label: 'Mexico Income Tax', kind: 'progressive', brackets: brackets([[0, 0.0192], [4_000, 0.064], [34_000, 0.1088], [60_000, 0.16], [120_000, 0.2152], [250_000, 0.30], [400_000, 0.35]]), standardDeduction: 0, effectiveFrom: YEAR(2023), note: `${APPROX} Amounts modeled in USD-equivalent.` },
  { jurisdictionCode: 'AE', label: 'United Arab Emirates (No Personal Income Tax)', kind: 'none', brackets: [], standardDeduction: 0, effectiveFrom: YEAR(1900), note: 'The UAE levies no personal income tax on employment income.' },
  {
    jurisdictionCode: 'IS',
    label: 'Icelandic Income Tax',
    kind: 'progressive',
    brackets: brackets([[0, 0.3175], [41_044, 0.3825], [115_228, 0.4682]]),
    standardDeduction: 18_812_00,
    effectiveFrom: YEAR(2024),
    note: ICELAND_NOTE,
  },
];

export const PAYROLL_TAX_RULES: readonly PayrollTaxRule[] = [
  { jurisdictionCode: 'US', socialRate: 0.062, socialWageBase: 168_600_00, medicalRate: 0.0145, surchargeRate: 0.009, surchargeThreshold: 200_000_00, selfEmployedMultiplier: 2, effectiveFrom: YEAR(2024) },
  { jurisdictionCode: 'CA', socialRate: 0.0595, socialWageBase: 68_500_00, medicalRate: 0.0166, surchargeRate: 0, surchargeThreshold: 0, selfEmployedMultiplier: 2, effectiveFrom: YEAR(2024) },
  { jurisdictionCode: 'GB', socialRate: 0.08, socialWageBase: 50_270_00, medicalRate: 0.02, surchargeRate: 0, surchargeThreshold: 0, selfEmployedMultiplier: 1.2, effectiveFrom: YEAR(2024) },
  { jurisdictionCode: 'AU', socialRate: 0, socialWageBase: 0, medicalRate: 0.02, surchargeRate: 0, surchargeThreshold: 0, selfEmployedMultiplier: 1, effectiveFrom: YEAR(2024) },
  { jurisdictionCode: 'NZ', socialRate: 0.0153, socialWageBase: 142_283_00, medicalRate: 0, surchargeRate: 0, surchargeThreshold: 0, selfEmployedMultiplier: 1, effectiveFrom: YEAR(2024) },
  { jurisdictionCode: 'AE', socialRate: 0, socialWageBase: 0, medicalRate: 0, surchargeRate: 0, surchargeThreshold: 0, selfEmployedMultiplier: 1, effectiveFrom: YEAR(1900) },
  // The employee side in Iceland is the mandatory pension contribution, 4% and
  // uncapped. Tryggingagjald at 6.35% is the employer's and is not withheld from
  // a wage, so it does not belong in a figure about what somebody takes home.
  { jurisdictionCode: 'IS', socialRate: 0.04, socialWageBase: 0, medicalRate: 0, surchargeRate: 0, surchargeThreshold: 0, selfEmployedMultiplier: 1, effectiveFrom: YEAR(2024) },
];

export const SALES_TAX_RULES: readonly SalesTaxRule[] = [
  { jurisdictionCode: 'US-CA', rate: 0.0725, exemptCategories: ['groceries', 'prescription'], effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-CA-losangeles', rate: 0.0975, exemptCategories: ['groceries', 'prescription'], effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-CA-burbank', rate: 0.1025, exemptCategories: ['groceries', 'prescription'], effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-CA-santamonica', rate: 0.1025, exemptCategories: ['groceries', 'prescription'], effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-NY', rate: 0.04, exemptCategories: ['groceries', 'prescription'], effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-NY-newyork', rate: 0.08875, exemptCategories: ['groceries', 'prescription'], effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-GA', rate: 0.04, exemptCategories: ['prescription'], effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-GA-atlanta', rate: 0.089, exemptCategories: ['prescription'], effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-TX', rate: 0.0625, exemptCategories: ['groceries', 'prescription'], effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-TX-austin', rate: 0.0825, exemptCategories: ['groceries', 'prescription'], effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-FL', rate: 0.06, exemptCategories: ['groceries', 'prescription'], effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-FL-miami', rate: 0.07, exemptCategories: ['groceries', 'prescription'], effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-NV', rate: 0.0685, exemptCategories: ['groceries', 'prescription'], effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-WA', rate: 0.065, exemptCategories: ['groceries', 'prescription'], effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-IL', rate: 0.0625, exemptCategories: ['prescription'], effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-IL-chicago', rate: 0.1025, exemptCategories: ['prescription'], effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-OR', rate: 0, exemptCategories: [], effectiveFrom: YEAR(1900) },
  { jurisdictionCode: 'US-CO', rate: 0.029, exemptCategories: ['groceries', 'prescription'], effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-NM', rate: 0.05125, exemptCategories: ['groceries'], effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-LA', rate: 0.0445, exemptCategories: ['groceries'], effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-TN', rate: 0.07, exemptCategories: [], effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-MA', rate: 0.0625, exemptCategories: ['groceries', 'clothing'], effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-AZ', rate: 0.056, exemptCategories: ['groceries'], effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-HI', rate: 0.04, exemptCategories: [], effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-NC', rate: 0.0475, exemptCategories: ['groceries'], effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-NJ', rate: 0.06625, exemptCategories: ['groceries', 'clothing'], effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-PA', rate: 0.06, exemptCategories: ['groceries', 'clothing'], effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-MI', rate: 0.06, exemptCategories: ['groceries'], effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-OH', rate: 0.0575, exemptCategories: ['groceries'], effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US', rate: 0.05, exemptCategories: ['groceries', 'prescription'], effectiveFrom: YEAR(1900) },
  { jurisdictionCode: 'CA', rate: 0.05, exemptCategories: ['groceries'], effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'CA-02', rate: 0.12, exemptCategories: ['groceries'], effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'CA-08', rate: 0.13, exemptCategories: ['groceries'], effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'CA-10', rate: 0.14975, exemptCategories: ['groceries'], effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'GB', rate: 0.20, exemptCategories: ['groceries', 'children_clothing'], effectiveFrom: YEAR(2011) },
  { jurisdictionCode: 'IE', rate: 0.23, exemptCategories: ['groceries'], effectiveFrom: YEAR(2021) },
  { jurisdictionCode: 'FR', rate: 0.20, exemptCategories: [], effectiveFrom: YEAR(2014) },
  { jurisdictionCode: 'DE', rate: 0.19, exemptCategories: [], effectiveFrom: YEAR(2007) },
  { jurisdictionCode: 'ES', rate: 0.21, exemptCategories: [], effectiveFrom: YEAR(2012) },
  { jurisdictionCode: 'IT', rate: 0.22, exemptCategories: [], effectiveFrom: YEAR(2013) },
  { jurisdictionCode: 'AU', rate: 0.10, exemptCategories: ['groceries'], effectiveFrom: YEAR(2000) },
  { jurisdictionCode: 'NZ', rate: 0.15, exemptCategories: [], effectiveFrom: YEAR(2010) },
  { jurisdictionCode: 'JP', rate: 0.10, exemptCategories: [], effectiveFrom: YEAR(2019) },
  { jurisdictionCode: 'KR', rate: 0.10, exemptCategories: [], effectiveFrom: YEAR(2000) },
  { jurisdictionCode: 'MX', rate: 0.16, exemptCategories: ['groceries'], effectiveFrom: YEAR(2014) },
  { jurisdictionCode: 'AE', rate: 0.05, exemptCategories: [], effectiveFrom: YEAR(2018) },
  // VSK. It was taken from the company side's `VAT_RATE` rather than typed
  // twice; that side is gone, so the rate lives here now, where the only thing
  // that reads a tax table is.
  { jurisdictionCode: 'IS', rate: 0.24, exemptCategories: [], effectiveFrom: YEAR(2024) },
];

export const PROPERTY_TAX_RULES: readonly PropertyTaxRule[] = [
  { jurisdictionCode: 'US-CA', rate: 0.0075, assessmentGrowthCap: 0.02, effectiveFrom: YEAR(1978) },
  { jurisdictionCode: 'US-NY', rate: 0.0165, effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-GA', rate: 0.0092, effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-TX', rate: 0.0181, effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-FL', rate: 0.0089, effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-IL', rate: 0.0227, effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-NV', rate: 0.0059, effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-WA', rate: 0.0094, effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-CO', rate: 0.0052, effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-OR', rate: 0.0098, effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-NM', rate: 0.0078, effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-LA', rate: 0.0056, effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-NC', rate: 0.0082, effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-TN', rate: 0.0067, effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-MA', rate: 0.0123, effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-AZ', rate: 0.0066, effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-HI', rate: 0.0029, effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-NJ', rate: 0.0247, effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-PA', rate: 0.0158, effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US', rate: 0.011, effectiveFrom: YEAR(1900) },
  { jurisdictionCode: 'CA', rate: 0.0085, effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'GB', rate: 0.0045, effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'AU', rate: 0.0035, effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'NZ', rate: 0.0032, effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'FR', rate: 0.0110, effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'DE', rate: 0.0035, effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'ES', rate: 0.0070, effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'IT', rate: 0.0086, effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'JP', rate: 0.0140, effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'KR', rate: 0.0025, effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'MX', rate: 0.0010, effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'AE', rate: 0.0000, effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'IE', rate: 0.0018, effectiveFrom: YEAR(2018) },
  // Fasteignaskattur, A-flokkur: the residential band, which law caps at 0.5%
  // and Mosfellsbær sets near the middle of.
  { jurisdictionCode: 'IS', rate: 0.0028, effectiveFrom: YEAR(2024) },
];

export const VEHICLE_FEE_RULES: readonly VehicleFeeRule[] = [
  { jurisdictionCode: 'US-CA', registrationRate: 0.0065, registrationMinimum: 175_00, purchaseTaxRate: 0.0975, inspectionRequired: true, effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-NY', registrationRate: 0.0030, registrationMinimum: 140_00, purchaseTaxRate: 0.08875, inspectionRequired: true, effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-GA', registrationRate: 0.0000, registrationMinimum: 20_00, purchaseTaxRate: 0.070, inspectionRequired: false, effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-TX', registrationRate: 0.0000, registrationMinimum: 75_00, purchaseTaxRate: 0.0625, inspectionRequired: true, effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-FL', registrationRate: 0.0000, registrationMinimum: 225_00, purchaseTaxRate: 0.06, inspectionRequired: false, effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-NV', registrationRate: 0.0035, registrationMinimum: 33_00, purchaseTaxRate: 0.0685, inspectionRequired: false, effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US-WA', registrationRate: 0.0110, registrationMinimum: 68_00, purchaseTaxRate: 0.065, inspectionRequired: false, effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'US', registrationRate: 0.0020, registrationMinimum: 100_00, purchaseTaxRate: 0.055, inspectionRequired: false, effectiveFrom: YEAR(1900) },
  { jurisdictionCode: 'CA', registrationRate: 0.0010, registrationMinimum: 90_00, purchaseTaxRate: 0.12, inspectionRequired: true, effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'GB', registrationRate: 0.0000, registrationMinimum: 190_00, purchaseTaxRate: 0.20, inspectionRequired: true, effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'AU', registrationRate: 0.0030, registrationMinimum: 400_00, purchaseTaxRate: 0.10, inspectionRequired: true, effectiveFrom: YEAR(2018) },
  { jurisdictionCode: 'AE', registrationRate: 0.0000, registrationMinimum: 120_00, purchaseTaxRate: 0.05, inspectionRequired: true, effectiveFrom: YEAR(2018) },
];

// --- Resolution -------------------------------------------------------------

function effective<T extends { jurisdictionCode: string; effectiveFrom: number; effectiveTo?: number }>(
  rules: readonly T[], code: string, at: number,
): T | undefined {
  let best: T | undefined;
  for (const rule of rules) {
    if (rule.jurisdictionCode !== code) continue;
    if (rule.effectiveFrom > at) continue;
    if (rule.effectiveTo !== undefined && rule.effectiveTo <= at) continue;
    if (!best || rule.effectiveFrom > best.effectiveFrom) best = rule;
  }
  return best;
}

/**
 * Walks the jurisdiction path from most specific to least, returning the first
 * rule that applies. A Los Angeles sales-tax rate beats the California rate,
 * which beats the federal fallback.
 */
export function resolveRule<T extends { jurisdictionCode: string; effectiveFrom: number; effectiveTo?: number }>(
  rules: readonly T[], cityId: string, at: number,
): T | undefined {
  const path = jurisdictionPath(cityId);
  for (let i = path.length - 1; i >= 0; i--) {
    const found = effective(rules, path[i] as string, at);
    if (found) return found;
  }
  return undefined;
}

/** Every income-tax rule that applies at a location: federal plus regional. */
export function resolveIncomeTaxLayers(cityId: string, at: number): IncomeTaxRule[] {
  const path = jurisdictionPath(cityId);
  const layers: IncomeTaxRule[] = [];
  for (const code of path) {
    const rule = effective(INCOME_TAX_RULES, code, at);
    if (rule) layers.push(rule);
  }
  return layers;
}

export function applyBrackets(taxableIncome: Money, rule: IncomeTaxRule): Money {
  if (rule.kind === 'none') return 0;
  if (rule.kind === 'flat') return applyRate(Math.max(0, taxableIncome), rule.flatRate ?? 0);
  let tax = 0;
  const sorted = [...rule.brackets].sort((a, b) => a.from - b.from);
  for (let i = 0; i < sorted.length; i++) {
    const bracket = sorted[i] as TaxBracket;
    const upper = (sorted[i + 1]?.from ?? Number.POSITIVE_INFINITY);
    if (taxableIncome <= bracket.from) break;
    const slice = Math.min(taxableIncome, upper) - bracket.from;
    if (slice > 0) tax += applyRate(slice, bracket.rate);
  }
  return tax;
}

export interface TaxComputation {
  gross: Money;
  federal: Money;
  regional: Money;
  local: Money;
  payroll: Money;
  total: Money;
  net: Money;
  effectiveRate: number;
  /** Line-by-line explanation for the audit panel. */
  lines: { label: string; amount: Money; note: string }[];
}

/** Annual tax on employment income at a location. */
export function computeAnnualTax(
  gross: Money, cityId: string, at: number,
  opts: { selfEmployed?: boolean; deductions?: Money } = {},
): TaxComputation {
  const layers = resolveIncomeTaxLayers(cityId, at);
  const lines: TaxComputation['lines'] = [];
  let federal = 0;
  let regional = 0;
  let local = 0;

  for (const rule of layers) {
    const taxable = Math.max(0, gross - rule.standardDeduction - (opts.deductions ?? 0));
    const amount = applyBrackets(taxable, rule);
    if (amount === 0 && rule.kind === 'none') {
      lines.push({ label: rule.label, amount: 0, note: rule.note });
      continue;
    }
    lines.push({
      label: rule.label,
      amount,
      note: rule.kind === 'flat'
        ? `Flat ${((rule.flatRate ?? 0) * 100).toFixed(2)}% on ${(taxable / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })} after deductions.`
        : `Progressive brackets on ${(taxable / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })} after deductions.`,
    });
    const depth = jurisdictionPath(cityId).indexOf(rule.jurisdictionCode);
    if (depth === 0) federal += amount;
    else if (depth === 1) regional += amount;
    else local += amount;
  }

  const payrollRule = resolveRule(PAYROLL_TAX_RULES, cityId, at);
  let payroll = 0;
  if (payrollRule) {
    const multiplier = opts.selfEmployed ? payrollRule.selfEmployedMultiplier : 1;
    const socialBase = payrollRule.socialWageBase > 0 ? Math.min(gross, payrollRule.socialWageBase) : gross;
    const social = applyRate(socialBase, payrollRule.socialRate * multiplier);
    const medical = applyRate(gross, payrollRule.medicalRate * multiplier);
    const surcharge = gross > payrollRule.surchargeThreshold && payrollRule.surchargeThreshold > 0
      ? applyRate(gross - payrollRule.surchargeThreshold, payrollRule.surchargeRate)
      : 0;
    payroll = social + medical + surcharge;
    if (payroll > 0) {
      lines.push({
        label: opts.selfEmployed ? 'Payroll tax (self-employed, both halves)' : 'Payroll tax',
        amount: payroll,
        note: `Social insurance and medical levies${payrollRule.socialWageBase > 0 ? `, social capped at a ${(payrollRule.socialWageBase / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} wage base` : ''}.`,
      });
    }
  }

  const total = federal + regional + local + payroll;
  return {
    gross, federal, regional, local, payroll, total,
    net: gross - total,
    effectiveRate: gross > 0 ? total / gross : 0,
    lines,
  };
}

export function salesTaxRate(cityId: string, at: number, category: string): number {
  const rule = resolveRule(SALES_TAX_RULES, cityId, at);
  if (!rule) return 0;
  if (rule.exemptCategories.includes(category)) return 0;
  return rule.rate;
}

export function propertyTaxRate(cityId: string, at: number): number {
  return resolveRule(PROPERTY_TAX_RULES, cityId, at)?.rate ?? 0.011;
}

export function vehicleFees(cityId: string, at: number): VehicleFeeRule {
  return resolveRule(VEHICLE_FEE_RULES, cityId, at) ?? {
    jurisdictionCode: 'default', registrationRate: 0.002, registrationMinimum: 100_00,
    purchaseTaxRate: 0.055, inspectionRequired: false, effectiveFrom: 0,
  };
}

/** Cost-of-living multiplier relative to the national baseline. */
