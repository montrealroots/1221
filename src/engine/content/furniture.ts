/**
 * SLATE — furniture of one's own (docs/WORLD.md, stage 6c), from
 * 2026-09-29, researched in docs/research/world/research-furniture.json.
 *
 * No body publishes what furnishing a home costs, but a shop publishes what
 * each piece does: IKEA, in all five countries SLATE furnishes in, read from
 * its own pages. A bed is a MALM high frame and a VALEVÅG medium-firm
 * mattress, in the country's usual double size (a Queen in America, Canada
 * and Mexico; a Standard King, 150 by 200, in Britain and Ireland, whose
 * Standard Double is the smaller 135 by 190). A sofa is a KIVIK three-seat in
 * its Tibbleby cover, the cheapest cover every country sells. The regular
 * price, not a sale's, which ends. American and Canadian prices are before
 * the sales tax, added where the town's is kept; Britain's, Ireland's and
 * Mexico's include VAT and IVA. Delivered at the cheapest large-item rate,
 * per piece.
 *
 * Only what furniture changes is sold: a bed decides where a night is slept,
 * a sofa how much an hour unwinding at home takes off. The rest of a home's
 * furniture, which changes nothing SLATE keeps, isn't.
 */

export type Piece = 'bed' | 'sofa';

export const PIECE_LABEL: Readonly<Record<Piece, string>> = { bed: 'A Bed', sofa: 'A Sofa' };

export interface PiecePrice { price: number; delivery: number; basis: string }

/** By country, whole units of its money. */
export const FURNITURE: Readonly<Record<string, { currency: string; taxAdded: boolean; items: Record<Piece, PiecePrice> }>> = {
  us: { currency: 'USD', taxAdded: true, items: {
    bed: { price: 249 + 399, delivery: 29, basis: 'IKEA’s MALM Queen frame, $249, and VALEVÅG mattress, $399, delivered from $29' },
    sofa: { price: 799, delivery: 29, basis: 'IKEA’s KIVIK three-seat, $799, delivered from $29' },
  } },
  uk: { currency: 'GBP', taxAdded: false, items: {
    bed: { price: 164 + 299, delivery: 25, basis: 'IKEA’s MALM Standard King frame, £164, and VALEVÅG mattress, £299, at their regular prices, delivered for £25' },
    sofa: { price: 499, delivery: 25, basis: 'IKEA’s KIVIK three-seat, £499 regularly, delivered for £25' },
  } },
  ie: { currency: 'EUR', taxAdded: false, items: {
    bed: { price: 204 + 379, delivery: 50, basis: 'IKEA’s MALM Standard King frame, €204, and VALEVÅG mattress, €379 regularly, delivered in Dublin for €50' },
    sofa: { price: 599, delivery: 50, basis: 'IKEA’s KIVIK three-seat, €599 regularly, delivered in Dublin for €50' },
  } },
  ca: { currency: 'CAD', taxAdded: true, items: {
    bed: { price: 249 + 499, delivery: 59, basis: 'IKEA’s MALM Queen frame, C$249, and VALEVÅG mattress, C$499, delivered into the home for C$59' },
    sofa: { price: 749, delivery: 59, basis: 'IKEA’s KIVIK three-seat, C$749, delivered into the home for C$59' },
  } },
  mx: { currency: 'MXN', taxAdded: false, items: {
    bed: { price: 5_499 + 7_999, delivery: 700, basis: 'IKEA’s MALM Queen frame, MX$5,499, and VALEVÅG mattress, MX$7,999, delivered in its first zone for MX$700' },
    sofa: { price: 9_999, delivery: 700, basis: 'IKEA’s KIVIK three-seat, MX$9,999, delivered in its first zone for MX$700' },
  } },
};

/**
 * What going without costs. A night on the floor of a home with no bed
 * sleeps as badly as one on a friend's sofa, what a late bedtime costs
 * (`systems/life.ts`); an hour unwinding in a home with no sofa takes half
 * the stress off: SLATE's estimates, no study measuring either.
 */
export const WITHOUT = { floorNight: 0.08, unwindBare: 0.5 } as const;

export const FURNITURE_SOURCE = 'docs/research/world/research-furniture.json: IKEA’s own pages in the United States, Britain, Ireland, Canada and Mexico, 2026-09-29';
