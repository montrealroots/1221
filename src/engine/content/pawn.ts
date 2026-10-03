/**
 * SLATE — pawning jewelry and watches (the master plan's §29, from
 * 2026-10-02; `docs/research/world/research-pawn.json`, each law's or
 * pawnbroker's own page read that day).
 *
 * - **New York**: General Business Law §46, at most 4% a month, 25 cents at
 *   least; §48–49, no sale before four months, and 30 days' notice mailed
 *   first; §50, the surplus of a sale is the borrower's.
 * - **Los Angeles**: Financial Code §21200, 3% a month, $3 at least, and
 *   §21200.5's one-off charge on the first three months, by the loan's size;
 *   §21201, four months, then a notice and ten days to redeem; the
 *   pawnbroker takes the piece, and no surplus.
 * - **New Haven**: General Statutes §21-44, 5% a month to $15, 3% to $50, 2%
 *   above; §21-45, sixty days, then it's the pawnbroker's.
 * - **Toronto**: no pawnbroker's own rate read; the Criminal Code's ceiling,
 *   48% a year on a pawn under $1,000 and 35% above (SOR/2024-114), SLATE's
 *   reading of what's charged; the Pawnbrokers Act's year to redeem, then
 *   the pawnbroker's, no surplus.
 * - **London**: H&T Pawnbrokers' own monthly rates by the loan's size,
 *   charged by the day with 28 days at least; a six-month contract and a
 *   month's grace; the Consumer Credit Act's sale with the surplus to the
 *   borrower, but a loan of £75 or less passes the piece to the pawnbroker.
 * - **Dublin**: Carthy Pawnbrokers' 3% a month; jewelry redeemable a year
 *   and seven days under the Pawnbrokers Act 1964, then sold at auction and
 *   the surplus the borrower's.
 * - **Mexico City**, from 2026-10-03 (`research-watches-pawn-parking.json`):
 *   Nacional Monte de Piedad's own rates sheet (August 2025, the one its
 *   home page links): its average loan, 89% of its appraisal on gold
 *   jewelry and 64% on a watch, the appraisal taken as the piece's
 *   second-hand worth, SLATE's reading; the middle of its standard 3.96% to
 *   6.89% a month; five months, then sold, the surplus the borrower's.
 * - **Vancouver**, from 2026-10-03: CCE Pawn on Granville Street, three
 *   months, its 5% a month above C$1,000 and 10% below held to the Criminal
 *   Code's ceilings since 2025 (48% a year under C$1,000, 35% above), the
 *   page predating them; then the pawnbroker's, no surplus read.
 * Rates are the law's ceilings in America, which SLATE reads as what a
 * pawnbroker charges.
 *
 * **The loan** is 37.5% of what the piece would sell for second-hand where
 * you are (`systems/resale.ts`): the middle of the National Pawnbrokers
 * Association's 15% to 60% of resale value, an American trade body's range
 * and SLATE's stand-in elsewhere, no pawnbroker there publishing one.
 */

export interface PawnTerms {
  cityId: string;
  lender: string;
  currency: string;
  /** The percent a month on a loan of so many units of its money. */
  monthly: (loan: number) => number;
  /** The least a month's interest, in units. */
  minMonthly?: number;
  /** A one-off charge on the first three months, in units. */
  oneOff?: (loan: number) => number;
  /** Charged by the day, with so many days at least, rather than a month or part of one. */
  daily?: { minDays: number };
  /** Days until an unredeemed piece is the pawnbroker's or sold. */
  holdDays: number;
  /** Whether a sale's surplus is paid to the borrower, above a loan of so many units. */
  surplusAbove?: number;
  /** The lender's own share of the worth it lends, a watch's and jewelry's, where it publishes one (from 2026-10-03). */
  share?: { watch: number; jewelry: number };
}

/** The NPA's 15% to 60% of resale value, its middle. */
export const PAWN_SHARE = 0.375;

const H_AND_T: readonly [number, number][] = [[1500, 10.49], [3500, 9.49], [5000, 9], [7500, 8], [10000, 7], [15000, 6], [50000, 5], [Infinity, 4]];

export const PAWN_TERMS: readonly PawnTerms[] = [
  { cityId: 'us-ny-newyork', lender: 'A New York Pawnbroker', currency: 'USD', monthly: () => 4, minMonthly: 0.25, holdDays: 120 + 30, surplusAbove: 0 },
  {
    cityId: 'us-ca-losangeles', lender: 'A Los Angeles Pawnbroker', currency: 'USD', monthly: () => 3, minMonthly: 3, holdDays: 120 + 10,
    oneOff: (l) => (l < 20 ? 3 : l < 50 ? 6 : l < 75 ? 9 : l < 100 ? 12 : l < 175 ? 15 : l < 2500 ? l * 0.09 : 0),
  },
  { cityId: 'us-ct-newhaven', lender: 'A New Haven Pawnbroker', currency: 'USD', monthly: (l) => (l <= 15 ? 5 : l <= 50 ? 3 : 2), holdDays: 60 },
  { cityId: 'ca-on-toronto', lender: 'A Toronto Pawnbroker', currency: 'CAD', monthly: (l) => (l < 1000 ? 48 : 35) / 12, holdDays: 365 },
  { cityId: 'uk-eng-london', lender: 'H&T Pawnbrokers', currency: 'GBP', monthly: (l) => H_AND_T.find(([upTo]) => l <= upTo)![1], daily: { minDays: 28 }, holdDays: 183 + 30, surplusAbove: 75 },
  { cityId: 'ie-lei-dublin', lender: 'Carthy Pawnbrokers', currency: 'EUR', monthly: () => 3, holdDays: 372, surplusAbove: 0 },
  { cityId: 'mx-cmx-mexicocity', lender: 'Nacional Monte de Piedad', currency: 'MXN', monthly: () => (3.96 + 6.89) / 2, holdDays: Math.round(5 * 365.25 / 12), surplusAbove: 0, share: { watch: 0.64, jewelry: 0.89 } },
  { cityId: 'ca-bc-vancouver', lender: 'CCE Pawn', currency: 'CAD', monthly: (l) => Math.min(l < 1000 ? 10 : 5, (l < 1000 ? 48 : 35) / 12), holdDays: Math.round(3 * 365.25 / 12) },
];
