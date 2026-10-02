/**
 * SLATE — child support after a separation, by where the children live
 * (Stage 10 of `docs/BACKLOG.md`, from 2026-10-02), from
 * `docs/research/world/research-gaps-family.json` and Connecticut's own
 * schedule (`content/ctsupport.ts`), read 2026-10-02.
 *
 * - New York: the Child Support Standards Act, 17%, 25%, 29%, 31% and 35% of
 *   the parents' combined income for one to five or more children, on
 *   income to $193,000 (from 1 March 2026), the paying parent's share of it.
 *   Gross income stands in for the Act's income after FICA and city tax.
 *   Support runs to 21.
 * - California: Family Code 4055, the paying parent's net monthly income
 *   times K, its share by the combined net income's band, times 1.6, 2.0 and
 *   2.3 for two, three and four children (five or more weren't read, and
 *   take four's). With the children living with one parent, the formula's
 *   time share is nothing or all, and K's multiplier one either way.
 * - Connecticut: the 2026 schedule's share of the combined net weekly
 *   income for the number of children, the paying parent's part of it.
 *   Support runs to 19.
 * - England: the Child Maintenance Service, on the paying parent's gross
 *   weekly income: 12%, 16% and 19% for one, two and three or more to £800,
 *   and 9%, 12% and 15% of the rest to £3,000; £7 a week at £200 or less,
 *   SLATE's reading of the flat and reduced rates, whose percentage wasn't
 *   read.
 * - Ontario and British Columbia: the Federal Child Support Guidelines'
 *   tables (October 2025), on the paying parent's gross income, between the
 *   published points; past $150,000 their own rates; three and four
 *   children scaled from two's by the tables' figures at $150,000. Support
 *   runs to the age of majority, 18 and 19.
 * - Mexico City: no law sets a share; lawyers' published practice is 15% to
 *   20% of net income for one child and 25% to 30% for two, the middle of
 *   each, and for three or more the 40% often given as the ceiling.
 * - Ireland: no formula; the court sets support on both parents' means, and
 *   SLATE keeps none.
 * Who keeps the children, the law in each place leaves to the parents or a
 * court on the child's best interests; SLATE's reading is that they stay in
 * the home they had, with the parent who keeps it.
 */

export const NY_CSSA = { shares: [0.17, 0.25, 0.29, 0.31, 0.35], cap: 193_000, until: 21 } as const;

/** California's K: its share of the combined net monthly income, by band. */
export function californiaK(tnMonthly: number): number {
  if (tnMonthly <= 2_900) return 0.165 + tnMonthly / 82_857;
  if (tnMonthly <= 5_000) return 0.131 + tnMonthly / 42_149;
  if (tnMonthly <= 10_000) return 0.25;
  if (tnMonthly <= 15_000) return 0.1 + 1_499 / tnMonthly;
  return 0.12 + 1_200 / tnMonthly;
}
export const CA_CHILDREN = [1, 1.6, 2.0, 2.3] as const;

export const CMS = { first: [0.12, 0.16, 0.19], second: [0.09, 0.12, 0.15], band: 800, top: 3_000, flatWeekly: 7, flatTo: 200 } as const;

export interface FederalTable { one: Readonly<Record<number, number>>; two: Readonly<Record<number, number>>; over: readonly (readonly [number, number])[]; until: number }
export const CANADA_TABLES: Readonly<Record<string, FederalTable>> = {
  'ca-08': {
    one: { 30_000: 240, 50_000: 450, 75_000: 695, 100_000: 932, 125_000: 1_131, 150_000: 1_327 },
    two: { 30_000: 501, 50_000: 744, 75_000: 1_144, 100_000: 1_517, 125_000: 1_829, 150_000: 2_135 },
    over: [[1_327, 0.0076], [2_135, 0.0122], [2_781, 0.0154], [3_310, 0.0186]],
    until: 18,
  },
  'ca-02': {
    one: { 30_000: 259, 50_000: 468, 75_000: 708, 100_000: 955, 125_000: 1_176, 150_000: 1_383 },
    two: { 30_000: 481, 50_000: 792, 75_000: 1_166, 100_000: 1_549, 125_000: 1_893, 150_000: 2_215 },
    over: [[1_383, 0.0084], [2_215, 0.0128], [2_881, 0.0166], [3_426, 0.0198]],
    until: 19,
  },
};

export const MEXICO_SHARES = [0.175, 0.275, 0.4] as const;

/** The age support runs to, by place. */
export const SUPPORT_UNTIL: Readonly<Record<string, number>> = { 'us-ny': 21, 'us-ct': 19, 'us-ca': 18, uk: 18, 'ca-08': 18, 'ca-02': 19, mx: 18 };
