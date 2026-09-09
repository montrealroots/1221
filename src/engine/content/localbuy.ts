/**
 * SLATE — what a branch of the same chain actually carries, country by country.
 *
 * A Carrefour in Riyadh and a Carrefour in Lyon are the same company and not
 * the same shop. Three things decide that, and all three are real:
 *
 *  1. What may lawfully or customarily be sold there. Alcohol is not on an
 *     ordinary shelf in Saudi Arabia and is behind a state monopoly counter in
 *     Sweden, Norway, Finland and Iceland. Pork is not in a Kuwaiti
 *     supermarket and is in a separate licensed room in the Emirates. Beef is
 *     restricted across most of India. These are matters of law and of public
 *     record, not calibration.
 *  2. The weather. Nobody in Singapore buys a heavy winter coat and nobody in
 *     Reykjavik buys much swimwear, so the buyers do not send either. The
 *     game already knows the climate of every city.
 *  3. Which brands trade in that country at all, which the catalog already
 *     carries on the products themselves.
 *
 * What is SLATE's own is the fourth thing: how much of the eligible range one
 * branch happens to carry, which is a buying decision no company publishes.
 */

import type { CatalogItem } from './catalog';
import type { ClimateType } from './climate';

export const LOCAL_BUY_NOTE =
  'Two branches of the same chain in two countries don’t stock the same shop, and the reasons are '
  + 'real: what may lawfully be sold there, what the weather asks for, and which brands trade in that '
  + 'market at all. How deep any one branch goes into the range it could carry is SLATE’s own, '
  + 'because no company publishes its buy.';

export const LAW_NOTE =
  'Where a shelf is missing something, the room says which rule left it off rather than quietly '
  + 'dropping it. Alcohol behind a state monopoly, pork in a licensed room rather than the aisle, and '
  + 'beef restricted across most of India are all real arrangements, carried as arrangements.';

export const CLIMATE_BUY_NOTE =
  'A buyer sends a shop what that city’s year actually needs. A heavy coat in an equatorial city and '
  + 'swimwear in a subarctic one aren’t stocked, which is why the same chain reads differently in '
  + 'Singapore and in Reykjavik. Where the line falls is SLATE’s own.';

// ---------------------------------------------------------------------------
// What may be sold
// ---------------------------------------------------------------------------

/** How available a thing is, which is not always a yes or a no. */
export type Availability = 'on_the_shelf' | 'licensed_counter' | 'not_sold';

export const AVAILABILITY_LABEL: Readonly<Record<Availability, string>> = {
  on_the_shelf: 'On The Shelf',
  licensed_counter: 'Behind A Separate Counter',
  not_sold: 'Not Sold Here',
};

/**
 * Countries where alcohol is not sold in an ordinary shop.
 *
 * The first group prohibits it or all but prohibits it for residents. The
 * second sells anything above weak beer only through a state monopoly, which
 * is a real and well known arrangement rather than a restriction.
 */
export const ALCOHOL_PROHIBITED: ReadonlySet<string> = new Set([
  'sa', 'kw', 'ly', 'af', 'ir', 'so', 'ye', 'bn', 'bd', 'sd', 'mr', 'mv',
]);

export const ALCOHOL_MONOPOLY: Readonly<Record<string, string>> = {
  se: 'Systembolaget',
  no: 'Vinmonopolet',
  fi: 'Alko',
  is: 'Vínbúðin',
  ca: 'the provincial liquor board',
  fo: 'Rúsdrekkasøla Landsins',
};

/**
 * Countries where pork is not on an ordinary shelf.
 *
 * The first group does not sell it. The second sells it, to non-Muslims, in a
 * separate licensed room rather than in the aisle, which is exactly how a
 * supermarket in Dubai or Doha is laid out.
 */
export const PORK_NOT_SOLD: ReadonlySet<string> = new Set([
  'sa', 'kw', 'ir', 'ly', 'af', 'so', 'ye', 'mr', 'bn', 'mv', 'sd', 'pk',
]);

export const PORK_LICENSED_ROOM: ReadonlySet<string> = new Set(['ae', 'qa', 'bh', 'om', 'eg', 'jo', 'my']);

/** Beef, which most Indian states restrict or prohibit outright. */
export const BEEF_RESTRICTED: ReadonlySet<string> = new Set(['in', 'np']);

/**
 * What a product is, read off its own tags rather than out of its name.
 *
 * Matching on the name would be a disaster: Virgin olive oil contains "gin",
 * a Hamilton watch contains "ham", and a Champion sweatshirt contains it
 * twice. The catalog tags what a thing is, so the tags are what is read, and
 * the checker fails the build if a grocery is one of these and does not say so.
 */
const ALCOHOL_TAGS = ['alcohol', 'wine', 'beer', 'spirits'];
const PORK_TAGS = ['pork'];
const BEEF_TAGS = ['beef'];

function hasAny(item: CatalogItem, tags: readonly string[]): boolean {
  return tags.some((tag) => item.tags.includes(tag) || item.subcategory === tag);
}

/**
 * Whether this may be sold here, and if not, why not.
 *
 * The reason is carried rather than the answer alone, because a shelf that is
 * missing something should say which arrangement left it off. Nothing here is
 * a judgement about a country; they are the rules those countries have.
 */
export function availabilityOf(
  item: CatalogItem, countryId: string,
): { availability: Availability; why?: string } {
  if (hasAny(item, ALCOHOL_TAGS)) {
    if (ALCOHOL_PROHIBITED.has(countryId)) {
      return { availability: 'not_sold', why: 'Alcohol isn’t sold in shops here.' };
    }
    const monopoly = ALCOHOL_MONOPOLY[countryId];
    if (monopoly) {
      return {
        availability: 'licensed_counter',
        why: `Anything stronger than weak beer is sold through ${monopoly} rather than in a shop.`,
      };
    }
  }
  if (hasAny(item, PORK_TAGS)) {
    if (PORK_NOT_SOLD.has(countryId)) {
      return { availability: 'not_sold', why: 'Pork isn’t sold here.' };
    }
    if (PORK_LICENSED_ROOM.has(countryId)) {
      return {
        availability: 'licensed_counter',
        why: 'Pork is sold in a separate licensed room rather than in the aisle.',
      };
    }
  }
  if (hasAny(item, BEEF_TAGS) && BEEF_RESTRICTED.has(countryId)) {
    return { availability: 'not_sold', why: 'Beef is restricted across most of the country.' };
  }
  return { availability: 'on_the_shelf' };
}

/** Whether an ordinary shelf in this country would carry it at all. */
export function onTheShelfIn(item: CatalogItem, countryId: string): boolean {
  return availabilityOf(item, countryId).availability === 'on_the_shelf';
}

// ---------------------------------------------------------------------------
// What the weather asks for
// ---------------------------------------------------------------------------

/**
 * Which seasons a city's clothes shops actually buy for.
 *
 * A city with no winter is not sent winter coats and a city with no summer is
 * not sent much swimwear. The climates are the game's own classification of
 * real places; where the line falls between them is SLATE's.
 */
export const SEASONS_BOUGHT_FOR: Readonly<Record<ClimateType, readonly string[]>> = {
  equatorial: ['Spring', 'Summer'],
  monsoon: ['Spring', 'Summer', 'Autumn'],
  savanna: ['Spring', 'Summer'],
  arid: ['Spring', 'Summer', 'Autumn'],
  semi_arid: ['Spring', 'Summer', 'Autumn'],
  mediterranean: ['Spring', 'Summer', 'Autumn', 'Winter'],
  humid_subtropical: ['Spring', 'Summer', 'Autumn', 'Winter'],
  oceanic: ['Spring', 'Summer', 'Autumn', 'Winter'],
  continental: ['Spring', 'Summer', 'Autumn', 'Winter'],
  subarctic: ['Spring', 'Autumn', 'Winter'],
  polar: ['Autumn', 'Winter'],
  highland: ['Spring', 'Summer', 'Autumn', 'Winter'],
};

/** Climates where nobody is buying swimwear off a rail in town. */
export const NO_SWIMWEAR: ReadonlySet<ClimateType> = new Set(['subarctic', 'polar']);

/** And the ones where a heavy coat would sit on the rail until it rotted. */
export const NO_HEAVY_COATS: ReadonlySet<ClimateType> = new Set(['equatorial', 'savanna', 'monsoon']);

/**
 * The two garments a climate really rules out.
 *
 * Read off the subcategory the catalog already carries, and off whole words in
 * the name rather than substrings, so a Down Street coat is not swimwear and a
 * Thermal flask is not a parka.
 */
const SWIM_WORDS = ['swim', 'swimsuit', 'swimwear', 'bikini', 'trunks', 'boardshorts'];
const HEAVY_WORDS = ['parka', 'puffer', 'overcoat', 'shearling', 'greatcoat', 'anorak'];

function saysAny(item: CatalogItem, words: readonly string[]): boolean {
  if (words.some((word) => item.subcategory.toLowerCase() === word)) return true;
  if (words.some((word) => item.tags.includes(word))) return true;
  const parts = item.name.toLowerCase().split(/[^a-z]+/);
  return words.some((word) => parts.includes(word));
}

/**
 * Whether a buyer in this climate would send this to this shop.
 *
 * Only clothing and footwear are judged: nobody declines to stock a saucepan
 * because of the weather.
 */
export function suitsClimate(item: CatalogItem, climate: ClimateType): boolean {
  if (item.category !== 'clothing' && item.category !== 'footwear') return true;
  if (NO_SWIMWEAR.has(climate) && saysAny(item, SWIM_WORDS)) return false;
  if (NO_HEAVY_COATS.has(climate) && saysAny(item, HEAVY_WORDS)) return false;
  const wanted = SEASONS_BOUGHT_FOR[climate];
  // A garment with no season on it is a garment for any of them.
  if (!item.seasons || item.seasons.length === 0) return true;
  return item.seasons.some((season) => wanted.includes(season));
}

// ---------------------------------------------------------------------------
// And the branch's own buy, which is the part nobody publishes
// ---------------------------------------------------------------------------

/**
 * How much of what it could carry one branch actually does.
 *
 * A flagship carries nearly everything and a small branch carries the middle
 * of the range. This is SLATE's own calibration end to end: it is a buying
 * decision, and no company publishes one.
 */
export const BUY_DEPTH: readonly { from: number; share: number; label: string }[] = [
  { from: 88, share: 0.97, label: 'A Flagship' },
  { from: 74, share: 0.88, label: 'A Large Branch' },
  { from: 58, share: 0.78, label: 'A Branch' },
  { from: 0, share: 0.68, label: 'A Small Branch' },
];

export function depthFor(quality: number): { share: number; label: string } {
  const found = BUY_DEPTH.find((one) => quality >= one.from) ?? BUY_DEPTH[BUY_DEPTH.length - 1]!;
  return { share: found.share, label: found.label };
}

/**
 * However thin a branch is, it still carries a shop's worth.
 *
 * The same hundred products every branch promises, which is what the catalog
 * test enforces. A branch buys a share of what it could carry and then stops
 * cutting here, so a smaller chain still differs branch to branch without ever
 * dropping below a shop.
 */
export const NEVER_BELOW = 100;
