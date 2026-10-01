/**
 * SLATE — beds by market (Stage 12 of `docs/BACKLOG.md`, from 2026-10-01),
 * from `docs/research/world/research-facilities.json`, IKEA's own pages in
 * the five countries read on 2026-10-01, at their regular prices (a sale's
 * ends).
 *
 * **Sizes** are each market's own: America and Canada the International
 * Sleep Products Association's, twin 38 by 75 inches to king 76 by 80;
 * Britain and Ireland a single 90 by 190 cm, a double 135 by 190, a king
 * 150 by 200; Mexico an individual 100 by 190, a matrimonial 135 by 190 and
 * a queen 150 by 190, as two Mexican makers give them (its king's
 * published size looks wrong, and none is sold here).
 *
 * **A frame takes only its own market's mattress of its own size**: a
 * British double is 190 cm long, and no American or Mexican mattress is
 * that size, so a bed brought across takes a mattress only from home.
 * A bed under 120 cm wide sleeps one, SLATE's line, where Britain's small
 * double begins.
 */

export type BedMarket = 'na' | 'uk' | 'mx';
export interface BedSize { key: string; label: string; widthCm: number; lengthCm: number }

const IN = 2.54;
export const BED_SIZES: Readonly<Record<BedMarket, readonly BedSize[]>> = {
  na: [
    { key: 'twin', label: 'Twin', widthCm: 38 * IN, lengthCm: 75 * IN },
    { key: 'full', label: 'Full', widthCm: 54 * IN, lengthCm: 75 * IN },
    { key: 'queen', label: 'Queen', widthCm: 60 * IN, lengthCm: 80 * IN },
    { key: 'king', label: 'King', widthCm: 76 * IN, lengthCm: 80 * IN },
  ],
  uk: [
    { key: 'single', label: 'Single', widthCm: 90, lengthCm: 190 },
    { key: 'double', label: 'Double', widthCm: 135, lengthCm: 190 },
    { key: 'king', label: 'King', widthCm: 150, lengthCm: 200 },
  ],
  mx: [
    { key: 'individual', label: 'Individual', widthCm: 100, lengthCm: 190 },
    { key: 'matrimonial', label: 'Matrimonial', widthCm: 135, lengthCm: 190 },
    { key: 'queen', label: 'Queen', widthCm: 150, lengthCm: 190 },
  ],
};

/** Which market's sizes a country sells. */
export const BED_MARKET: Readonly<Record<string, BedMarket>> = { us: 'na', ca: 'na', uk: 'uk', ie: 'uk', mx: 'mx' };

/** The width a bed sleeps two from. */
export const SLEEPS_TWO_CM = 120;

export interface BedPart { id: string; name: string; size: string; price: number }

/** IKEA's frames and mattresses by country, in its money, whole units. */
export const BED_PARTS: Readonly<Record<string, { frames: readonly BedPart[]; mattresses: readonly BedPart[] }>> = {
  us: {
    frames: [
      { id: 'us-vihals-queen', name: 'VIHALS', size: 'queen', price: 129 },
      { id: 'us-vevelstad-queen', name: 'VEVELSTAD', size: 'queen', price: 149 },
      { id: 'us-tarva-king', name: 'TARVA', size: 'king', price: 189 },
      { id: 'us-mellgrund-queen', name: 'MELLGRUND', size: 'queen', price: 199 },
      { id: 'us-stjarno-queen', name: 'STJÄRNÖ', size: 'queen', price: 229 },
      { id: 'us-malm-queen', name: 'MALM', size: 'queen', price: 299 },
      { id: 'us-malm-storage-full', name: 'MALM high, two storage boxes', size: 'full', price: 369 },
      { id: 'us-brimnes-queen', name: 'BRIMNES with storage', size: 'queen', price: 399 },
      { id: 'us-malm-storage-queen', name: 'MALM storage bed', size: 'queen', price: 599 },
      { id: 'us-idanas-queen', name: 'IDANÄS with storage', size: 'queen', price: 849 },
    ],
    mattresses: [
      { id: 'us-agotnes-twin', name: 'ÅGOTNES foam', size: 'twin', price: 89 },
      { id: 'us-asvang-twin', name: 'ÅSVANG foam', size: 'twin', price: 129 },
      { id: 'us-vesteroy-queen', name: 'VESTERÖY', size: 'queen', price: 299 },
      { id: 'us-valevag-queen', name: 'VALEVÅG', size: 'queen', price: 399 },
      { id: 'us-vagstranda-queen', name: 'VÅGSTRANDA', size: 'queen', price: 549 },
    ],
  },
  ca: {
    frames: [
      { id: 'ca-neiden-twin', name: 'NEIDEN', size: 'twin', price: 79.99 },
      { id: 'ca-neiden-full', name: 'NEIDEN', size: 'full', price: 99 },
      { id: 'ca-tarva-queen', name: 'TARVA', size: 'queen', price: 179 },
      { id: 'ca-vevelstad-queen', name: 'VEVELSTAD', size: 'queen', price: 179 },
      { id: 'ca-slattum-queen', name: 'SLATTUM', size: 'queen', price: 179 },
      { id: 'ca-malm-queen', name: 'MALM', size: 'queen', price: 299 },
      { id: 'ca-malm-storage-queen', name: 'MALM high, two storage boxes', size: 'queen', price: 429 },
      { id: 'ca-brimnes-queen', name: 'BRIMNES with storage', size: 'queen', price: 449 },
      { id: 'ca-idanas-queen', name: 'IDANÄS with storage', size: 'queen', price: 799 },
    ],
    mattresses: [
      { id: 'ca-agotnes-twin', name: 'ÅGOTNES foam', size: 'twin', price: 79.99 },
      { id: 'ca-asvang-twin', name: 'ÅSVANG foam', size: 'twin', price: 149 },
      { id: 'ca-vesteroy-twin', name: 'VESTERÖY', size: 'twin', price: 249 },
      { id: 'ca-asbygda-full', name: 'ÅSBYGDA foam', size: 'full', price: 379 },
      { id: 'ca-valevag-full', name: 'VALEVÅG', size: 'full', price: 479 },
      { id: 'ca-akrehamn-queen', name: 'ÅKREHAMN foam', size: 'queen', price: 499 },
      { id: 'ca-abrotten-queen', name: 'ÅBROTTEN foam', size: 'queen', price: 599 },
      { id: 'ca-vagstranda-queen', name: 'VÅGSTRANDA', size: 'queen', price: 699 },
      { id: 'ca-anneland-queen', name: 'ANNELAND hybrid', size: 'queen', price: 799 },
    ],
  },
  uk: {
    frames: [
      { id: 'uk-neiden-single', name: 'NEIDEN', size: 'single', price: 75 },
      { id: 'uk-neiden-double', name: 'NEIDEN', size: 'double', price: 89 },
      { id: 'uk-malm-single', name: 'MALM high', size: 'single', price: 119 },
      { id: 'uk-tarva-double', name: 'TARVA', size: 'double', price: 149 },
      { id: 'uk-malm-double', name: 'MALM high', size: 'double', price: 179 },
      { id: 'uk-malm-storage-double', name: 'MALM high, two storage boxes', size: 'double', price: 239 },
      { id: 'uk-malm-ottoman-double', name: 'MALM ottoman', size: 'double', price: 399 },
    ],
    mattresses: [
      { id: 'uk-valevag-double', name: 'VALEVÅG', size: 'double', price: 229 },
    ],
  },
  ie: {
    frames: [
      { id: 'ie-neiden-single', name: 'NEIDEN', size: 'single', price: 79 },
      { id: 'ie-neiden-double', name: 'NEIDEN', size: 'double', price: 99 },
      { id: 'ie-malm-single', name: 'MALM high', size: 'single', price: 159 },
      { id: 'ie-tarva-double', name: 'TARVA', size: 'double', price: 199 },
      { id: 'ie-malm-double', name: 'MALM high', size: 'double', price: 219 },
      { id: 'ie-malm-storage-king', name: 'MALM high, two storage boxes', size: 'king', price: 379 },
      { id: 'ie-malm-ottoman-double', name: 'MALM ottoman', size: 'double', price: 499 },
    ],
    mattresses: [
      { id: 'ie-vesteroy-single', name: 'VESTERÖY', size: 'single', price: 119 },
      { id: 'ie-vestmarka-double', name: 'VESTMARKA', size: 'double', price: 149 },
      { id: 'ie-valevag-double', name: 'VALEVÅG', size: 'double', price: 229 },
      { id: 'ie-abygda-double', name: 'ÅBYGDA foam', size: 'double', price: 249 },
      { id: 'ie-vagstranda-double', name: 'VÅGSTRANDA', size: 'double', price: 449 },
      { id: 'ie-anneland-king', name: 'ANNELAND hybrid', size: 'king', price: 699 },
      { id: 'ie-vatnestrom-double', name: 'VATNESTRÖM', size: 'double', price: 850 },
    ],
  },
  mx: {
    frames: [
      { id: 'mx-neiden-matrimonial', name: 'NEIDEN', size: 'matrimonial', price: 2_199 },
      { id: 'mx-slattum-matrimonial', name: 'SLATTUM', size: 'matrimonial', price: 3_499 },
      { id: 'mx-songesand-matrimonial', name: 'SONGESAND', size: 'matrimonial', price: 4_999 },
      { id: 'mx-tallasen-queen', name: 'TÄLLÅSEN', size: 'queen', price: 4_999 },
      { id: 'mx-malm-queen', name: 'MALM high', size: 'queen', price: 6_499 },
      { id: 'mx-brimnes-matrimonial', name: 'BRIMNES with storage', size: 'matrimonial', price: 7_199 },
      { id: 'mx-songesand-drawers-queen', name: 'SONGESAND, two drawers', size: 'queen', price: 7_999 },
    ],
    mattresses: [
      { id: 'mx-agotnes-individual', name: 'ÅGOTNES foam', size: 'individual', price: 1_299 },
      { id: 'mx-asvang-matrimonial', name: 'ÅSVANG foam', size: 'matrimonial', price: 2_499 },
      { id: 'mx-asbygda-individual', name: 'ÅSBYGDA foam', size: 'individual', price: 3_499 },
      { id: 'mx-vesteroy-individual', name: 'VESTERÖY', size: 'individual', price: 3_999 },
      { id: 'mx-abrotten-individual', name: 'ÅBROTTEN foam', size: 'individual', price: 4_999 },
      { id: 'mx-valevag-matrimonial', name: 'VALEVÅG', size: 'matrimonial', price: 6_999 },
      { id: 'mx-vagstranda-queen', name: 'VÅGSTRANDA', size: 'queen', price: 10_999 },
    ],
  },
};

/** The size of the bed a country's furnishing default is (`content/furniture.ts`): its usual double. */
export const DEFAULT_BED_SIZE: Readonly<Record<string, string>> = { us: 'queen', ca: 'queen', uk: 'king', ie: 'king', mx: 'queen' };

export const bedSize = (market: BedMarket, key: string): BedSize | undefined => BED_SIZES[market].find((s) => s.key === key);
