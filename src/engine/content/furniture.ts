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

/**
 * The recycling fee a state charges on each mattress sold there, collected
 * at the sale (\`docs/research/world/research-upkeep.json\`): California's
 * $18 from 2026-04-01 (it was $16), Connecticut's $19.50 from 2026-10-01
 * (it was $16), the Mattress Recycling Council's own notices. A MALM frame
 * stands on slats, not a foundation, so a bed is one. From 2026-09-30.
 */
export const MATTRESS_FEE_USD: Readonly<Record<string, readonly { from: number; usd: number }[]>> = {
  'us-ca': [{ from: 0, usd: 16 }, { from: Date.UTC(2026, 3, 1, 7), usd: 18 }],
  'us-ct': [{ from: 0, usd: 16 }, { from: Date.UTC(2026, 9, 1, 4), usd: 19.5 }],
};

/**
 * Movers for a bed and a sofa, the least a removal firm quotes for: a
 * one-bedroom's move, the middle of its range, in the country's money.
 * Local within 100 miles, as Angi counts one, and long distance past it:
 * - America: Angi's $250 to $700 local and $700 to $3,000 long distance
 *   for a one-bedroom (2026, secondary).
 * - Britain: Konnect You's £466 for a one-bedroom, and £75 to £150 more
 *   from 10 to 50 miles and £150 to £300 to 150; past that nothing is
 *   published, and SLATE takes the last (secondary).
 * - Canada: HomeStars' C$300 to C$900 local for a one-bedroom flat and
 *   C$2,800 to C$6,000 across Canada (secondary, read from search extracts).
 * - Mexico City: a marketplace's MX$3,515 local, every size together.
 * - Ireland: a Dublin removal firm's €300 to €600 for a one-bedroom
 *   (secondary). Until 2026-09-30 only a three-bedroom's €1,700 had been
 *   read, and none was charged.
 * Abroad, from 2026-09-30, the movers' and brokers' own estimates for a
 * one-bedroom's goods (`MOVERS_ABROAD`); the goods of someone changing
 * residence come in free of duty in each of these countries, under its
 * transfer-of-residence relief, so none is charged.
 */
export const MOVERS: Readonly<Record<string, { currency: string; local: (miles: number) => number; far?: number }>> = {
  us: { currency: 'USD', local: () => 475, far: 1_850 },
  uk: { currency: 'GBP', local: (mi) => 466 + (mi <= 10 ? 0 : mi <= 50 ? 112.5 : 225), far: 466 + 225 },
  ca: { currency: 'CAD', local: () => 600, far: 4_400 },
  mx: { currency: 'MXN', local: () => 3_515 },
  ie: { currency: 'EUR', local: () => 450 },
};

/**
 * Movers between countries for a one-bedroom's goods, by the pair (either
 * way), the middle of each estimate (`docs/research/world/research-credit-damage-movers.json`):
 * London and Dublin, Sirelo's £1,000 to £1,400 (February 2026); America and
 * Britain, MoveHub's $1,258 to $3,775 for a 20-foot container port to port;
 * America and Ireland $2,700 to $4,500; America and Toronto $3,375 to $4,215;
 * America and Mexico by road $4,500 to $8,000. None was published elsewhere
 * until 2026-10-01, when the rest of the pairs were read
 * (`docs/research/world/research-home-lodgers-movers-2.json`, estimates, not
 * quotes): Britain and Canada, MoveHub's £3,942 to £4,357 by sea; Britain and
 * Mexico, its £4,334 to £4,791; Ireland and Canada, AMC Removals' €2,500 to
 * €4,000; Ireland and Mexico, MoveHub's £4,657 to £5,147; Canada and Mexico,
 * MoveHub's £3,189 to £3,524, as Three Movers' 4,000 to 9,500 names no money.
 * Every pair of SLATE's five countries is now kept.
 */
export const MOVERS_ABROAD: Readonly<Record<string, { currency: string; amount: number }>> = {
  'ie|uk': { currency: 'GBP', amount: 1_200 },
  'uk|us': { currency: 'USD', amount: 2_516.5 },
  'ie|us': { currency: 'USD', amount: 3_600 },
  'ca|us': { currency: 'USD', amount: 3_795 },
  'mx|us': { currency: 'USD', amount: 6_250 },
  'ca|uk': { currency: 'GBP', amount: 4_149.5 },
  'mx|uk': { currency: 'GBP', amount: 4_562.5 },
  'ca|ie': { currency: 'EUR', amount: 3_250 },
  'ie|mx': { currency: 'GBP', amount: 4_902 },
  'ca|mx': { currency: 'GBP', amount: 3_356.5 },
};


/**
 * A mattress's life and its replacement, from 2026-09-30
 * (`docs/research/world/research-credit-damage-movers.json`). VALEVÅG is a
 * pocket-spring mattress, and the Sleep Foundation gives an innerspring 5.5
 * to 6.5 years, the middle taken; Consumer Reports gives 7 to 10 for
 * mattresses in general. Worn, a night on it sleeps half as badly again as a
 * night on the floor would, SLATE's estimate: the one study measuring old
 * beds against new (Jacobson, 2009, 59 people off beds averaging 9.5 years)
 * found sleep 52% better on the new, but has no control group, was paid for
 * by the mattress industry's council, and measures on no scale SLATE's sleep
 * has. Replaced at IKEA's own price for the mattress alone, delivered and
 * taxed where the tax is added, with a state's recycling fee and the
 * removal a retailer prints for the old one: IKEA's from $30 in America,
 * Dreams' £60 for a double in Britain (IKEA's is suspended there), Dreams'
 * €69 in Ireland. None is printed in Canada or Mexico.
 */
export const MATTRESS_YEARS = 6;
export const WORN_NIGHT = WITHOUT.floorNight / 2;
export const MATTRESS: Readonly<Record<string, { price: number; removal?: number }>> = {
  us: { price: 399, removal: 30 },
  uk: { price: 299, removal: 60 },
  ie: { price: 379, removal: 69 },
  ca: { price: 499 },
  mx: { price: 7_999 },
};
