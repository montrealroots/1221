/**
 * SLATE — having and raising a child (Stage 10 of `docs/BACKLOG.md`, from
 * 2026-10-01), from `docs/research/world/research-household-economics.json`
 * and `research-relationships.json`, read 2026-10-01.
 *
 * **Conceiving.** A month's chance for whoever carries, by their age, from
 * the PRESTO cohort (Wesselink and others, 2017): 79.3% pregnant within
 * twelve cycles at 25 to 27, 62% within six at 28 to 30, 67.4% within
 * twelve at 37 to 39, 55.5% at 40 to 45, each turned into a cycle's chance;
 * between them by a line, younger held at 25's, and none drawn past 45.
 * Who can carry is the player by their own pronouns (she/her), or a
 * partner by the list their given name came from, SLATE's reading; a
 * couple with neither isn't offered it, adoption and surrogacy not being
 * kept.
 *
 * **The birth**, 280 days on. In America: a caesarean in 32.5% of births
 * (2025 provisional); insured, Peterson-KFF's out-of-pocket $2,563 for a
 * vaginal birth and $3,071 for a caesarean (employer plans, 2021 to 2023);
 * uninsured, FAIR Health's median charges of $27,372 and $35,907. Free on
 * the NHS, under Ireland's Maternity and Infant Care Scheme and on OHIP or
 * MSP; in Mexico City IMSS's for the insured and not kept otherwise.
 *
 * **Leave for the self-employed.** Britain's Maternity Allowance, £194.32 a
 * week for 39 weeks, for the parent who gave birth; Ireland's Maternity
 * Benefit, €299 a week for 26 weeks, its Paternity Benefit, two weeks, and
 * Parent's Benefit, nine weeks each, all on Class S contributions.
 * America's state schemes, Canada's EI and IMSS ask a self-employed person
 * to have opted in ahead, which SLATE's actors haven't.
 *
 * **Raising a child**, a year, by age:
 * - America: Brookings' inflation of the USDA's last estimate, $310,605
 *   from birth to 17 for a middle-income couple, an even share a year.
 * - Britain: CPAG's 2025 cost of a child for a couple, £250,000 to 18,
 *   rent and childcare included, an even share a year.
 * - Ireland: the Vincentian MESL 2025 minimum, weekly by age (an infant
 *   €79, preschool €72, primary €98, second level €158), childcare and
 *   housing excluded.
 * - Canada: Statistics Canada's middle-income estimate (2017 dollars) by
 *   age, $15,300 to 5, $16,300 to 12, $17,420 to 17.
 * - Mexico: no official figure; a press scenario, MX$1.5 million to 18
 *   with public schooling, an even share a year, labeled as such.
 *
 * **What the state pays**, 2026: Britain's Child Benefit, £27.05 a week
 * for the eldest and £17.90 for each other, taken back 1% for each £200 the
 * higher earner's income passes £60,000, all of it at £80,000; Ireland's
 * €140 a month a child; Canada's Child Benefit, $8,157 a year under six and
 * $6,883 to seventeen, reduced by family income over $38,237 and $82,847 at
 * the published rates; Mexico's Beca Rita Cetina, MX$2,500 a year for a
 * public primary pupil and MX$1,900 every two months for a family with a
 * public secondary pupil (MX$700 for each other one). America's is the
 * Child Tax Credit on the return, $2,200 a child under 17, $1,700 of it
 * refundable, phased out by $50 for each $1,000 over $200,000, or $400,000
 * filed jointly.
 */

/** Cycles to a chance: the share pregnant within n cycles, to one cycle's chance. */
const perCycle = (share: number, cycles: number) => 1 - Math.pow(1 - share, 1 / cycles);

/** A month's chance of conceiving, by the age of whoever carries. */
export const CONCEPTION: readonly [number, number][] = [
  [26, perCycle(0.793, 12)], [29, perCycle(0.62, 6)], [38, perCycle(0.674, 12)], [42.5, perCycle(0.555, 12)], [45, perCycle(0.555, 12)],
];
export function conceptionChance(age: number): number {
  if (age > 45) return 0;
  if (age <= CONCEPTION[0]![0]) return CONCEPTION[0]![1];
  for (let i = 1; i < CONCEPTION.length; i += 1) {
    const [x1, y1] = CONCEPTION[i]!;
    const [x0, y0] = CONCEPTION[i - 1]!;
    if (age <= x1) return y0 + (y1 - y0) * (age - x0) / (x1 - x0);
  }
  return CONCEPTION[CONCEPTION.length - 1]![1];
}

export const PREGNANCY_DAYS = 280;

export const US_BIRTH = { caesarean: 0.325, insured: { vaginal: 2_563, caesarean: 3_071 }, uninsured: { vaginal: 27_372, caesarean: 35_907 } } as const;

export interface LeavePay { currency: string; weekly: number; weeks: number; label: string }
/** Leave a self-employed parent is paid, by country: the parent who gave birth, and the other. */
export const LEAVE: Readonly<Record<string, { birth: readonly LeavePay[]; other: readonly LeavePay[] }>> = {
  uk: { birth: [{ currency: 'GBP', weekly: 194.32, weeks: 39, label: 'Maternity Allowance' }], other: [] },
  ie: {
    birth: [{ currency: 'EUR', weekly: 299, weeks: 26, label: 'Maternity Benefit' }, { currency: 'EUR', weekly: 299, weeks: 9, label: 'Parent’s Benefit' }],
    other: [{ currency: 'EUR', weekly: 299, weeks: 2, label: 'Paternity Benefit' }, { currency: 'EUR', weekly: 299, weeks: 9, label: 'Parent’s Benefit' }],
  },
};

/** A year of raising a child, by country and age, in its money. */
export function raisingCost(country: string, age: number): { amount: number; currency: string } | undefined {
  if (age >= 18) return undefined;
  switch (country) {
    case 'us': return age < 17 ? { amount: 310_605 / 17, currency: 'USD' } : undefined;
    case 'uk': return { amount: 250_000 / 18, currency: 'GBP' };
    case 'ie': return { amount: (age < 1 ? 79 : age < 5 ? 72 : age < 12 ? 98 : 158) * 52, currency: 'EUR' };
    case 'ca': return { amount: age < 6 ? 15_300 : age < 13 ? 16_300 : 17_420, currency: 'CAD' };
    case 'mx': return { amount: 1_500_000 / 18, currency: 'MXN' };
    default: return undefined;
  }
}

export const CHILD_BENEFIT = {
  uk: { eldestWeekly: 27.05, otherWeekly: 17.9, hicbcFrom: 60_000, hicbcTo: 80_000 },
  ie: { monthly: 140 },
  ca: { under6: 8_157, to17: 6_883, first: 38_237, second: 82_847, rates: [[0.07, 0.032], [0.135, 0.057], [0.19, 0.08], [0.23, 0.095]] as const, fixed: [3_123, 6_022, 8_476, 10_260] as const },
  mx: { primaryYearly: 2_500, secondaryBimonthly: 1_900, secondaryOther: 700 },
  us: { credit: 2_200, refundable: 1_700, phaseFrom: 200_000, phaseFromJoint: 400_000, perThousand: 50 },
} as const;
