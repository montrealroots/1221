/**
 * SLATE — the rental houses, because nobody buys an Alexa.
 *
 * A camera body worth seventy thousand is hired for the days it is needed and
 * goes back on the Monday. That is how the work is actually done, so the kit
 * catalog is only half of it: the other half is a counter with a rate card, a
 * deposit, a damage waiver and somebody who checks the case when you bring it
 * back. This file is the counter.
 *
 * Public record: the house exists, and it is in the business it is in. SLATE's
 * own arithmetic: the branch, what is on its shelves this week, every rate,
 * every deposit, every waiver and every late fee. There is no rate feed for
 * any of this and inventing one and calling it a quote would be a claim about
 * the world that is not true, so nothing here is a quote from anybody.
 */

import type { Money } from '../core/money';
import { makeRng } from '../core/rng';
import type { Place, PlaceAction } from './places';
import type { RealGood } from './goods';

/** What a house keeps on its shelves. */
export type RentalLine = 'camera' | 'lighting' | 'grip' | 'sound';

export const RENTAL_LINE_LABEL: Readonly<Record<RentalLine, string>> = {
  camera: 'Camera And Lenses',
  lighting: 'Lighting',
  grip: 'Grip And Support',
  sound: 'Sound',
};

/** Which subcategories of the kit catalog each line covers. */
export const LINE_SUBCATEGORIES: Readonly<Record<RentalLine, readonly string[]>> = {
  camera: ['camera', 'lens', 'monitoring', 'media', 'filtration', 'live'],
  lighting: ['lighting', 'power'],
  grip: ['grip', 'camera support'],
  sound: ['sound'],
};

/** Every subcategory anybody rents. Everything else is bought and kept. */
export const RENTABLE: ReadonlySet<string> = new Set(
  Object.values(LINE_SUBCATEGORIES).flat(),
);

export const RENTAL_NOTE =
  'The houses here are real and are in the business they’re named for. Which branch, what is on '
  + 'its shelves, every rate, deposit and waiver is SLATE’s own calibration and isn’t a quote from '
  + 'anybody. Nothing here is a price list.';

/**
 * A rental house, real or SLATE's own.
 *
 * Everything on it that is a fact about the world is a durable one: the house
 * exists and it hires out what it says it hires out. The rest is calibration.
 */
export interface RentalHouse extends Omit<Place, 'quality' | 'price' | 'minutes' | 'real' | 'actions'> {
  kind: 'rental_house';
  price: 1 | 2 | 3 | 4;
  quality?: number;
  actions?: PlaceAction[];
  /** What it keeps. A camera house does not hire you a generator. */
  lines: readonly RentalLine[];
  /** True where the house is a real one. */
  house: boolean;
}

const CAMERA: readonly RentalLine[] = ['camera'];
const CAMERA_GRIP: readonly RentalLine[] = ['camera', 'grip'];
const LIGHT_GRIP: readonly RentalLine[] = ['lighting', 'grip'];
const EVERYTHING: readonly RentalLine[] = ['camera', 'lighting', 'grip', 'sound'];

/** A real house, in a city where it really works. */
const rh = (
  id: string, name: string, cityId: string, lines: readonly RentalLine[],
  price: 1 | 2 | 3 | 4, about: string, opened?: number, quality?: number,
): RentalHouse => ({
  id, name, kind: 'rental_house', cityId, about, price, quality, opened, lines, house: true,
});

/**
 * The real houses, in the cities they really work in.
 *
 * Kept to what is durable and well known: that Panavision rents and has never
 * sold, that ARRI Rental is the rental arm of the camera maker, that William F.
 * White is the Canadian house. Where SLATE is not sure a house has a counter in
 * a city, it is not listed there, and one of SLATE's own houses stands in the
 * street instead.
 */
export const RENTAL_HOUSES: readonly RentalHouse[] = [
  // --- Los Angeles ---------------------------------------------------------
  rh('rent-la-panavision', 'Panavision', 'us-ca-losangeles', CAMERA, 4,
    'The camera house founded in California in 1954, which has rented its cameras and lenses for its whole history and has never sold them. What is on the shelf and what a day costs is SLATE’s calibration.', 1954, 96),
  rh('rent-la-arri', 'ARRI Rental', 'us-ca-losangeles', CAMERA, 4,
    'The rental arm of ARRI, the Munich camera maker founded in 1917. The counter, the stock and the rates are SLATE’s calibration.', 1917, 95),
  rh('rent-la-keslow', 'Keslow Camera', 'us-ca-losangeles', CAMERA, 3,
    'A camera and lens house serving features and series out of Los Angeles. Its stock here and every figure on the quote are SLATE’s calibration.', undefined, 92),
  rh('rent-la-nemenz', 'Otto Nemenz International', 'us-ca-losangeles', CAMERA, 3,
    'A Hollywood camera house, known for cameras and glass rather than a catalog of everything. Stock and rates are SLATE’s calibration.', undefined, 91),
  rh('rent-la-abelcine', 'AbelCine', 'us-ca-losangeles', CAMERA, 2,
    'A camera house that sells as well as hires, and is used to a crew of three as much as a crew of ninety. Stock and rates are SLATE’s calibration.', undefined, 87),
  rh('rent-la-sim', 'Sim', 'us-ca-losangeles', CAMERA, 3,
    'A camera house working across the North American production centers. What is on its shelf this week is SLATE’s calibration.', undefined, 90),
  rh('rent-la-cinelease', 'Cinelease', 'us-ca-losangeles', LIGHT_GRIP, 3,
    'A lighting and grip house: lamps, stands, distribution and the truck it all goes on. Every rate here is SLATE’s calibration.', undefined, 89),
  rh('rent-la-mbs', 'MBS Equipment Company', 'us-ca-losangeles', LIGHT_GRIP, 3,
    'Lighting and grip, the kind of supplier a stage lot keeps on the lot. Stock and rates are SLATE’s calibration.', undefined, 88),
  rh('rent-la-trew', 'Trew Audio', 'us-ca-losangeles', ['sound'], 2,
    'A sound house: recorders, radio mics, booms and the bag it hangs off. Stock and rates are SLATE’s calibration.', undefined, 88),

  // --- New York ------------------------------------------------------------
  rh('rent-ny-panavision', 'Panavision', 'us-ny-newyork', CAMERA, 4,
    'The New York counter of the house founded in California in 1954, which rents and doesn’t sell. Stock and rates are SLATE’s calibration.', 1954, 95),
  rh('rent-ny-arri', 'ARRI Rental', 'us-ny-newyork', CAMERA, 4,
    'The New York counter of the rental arm of ARRI, the Munich camera maker founded in 1917. Stock and rates are SLATE’s calibration.', 1917, 94),
  rh('rent-ny-keslow', 'Keslow Camera', 'us-ny-newyork', CAMERA, 3,
    'A camera and lens house working out of New York as well as the west coast. Stock and rates are SLATE’s calibration.', undefined, 91),
  rh('rent-ny-abelcine', 'AbelCine', 'us-ny-newyork', CAMERA, 2,
    'The New York counter of the camera house that sells as well as hires. Stock and rates are SLATE’s calibration.', undefined, 88),
  rh('rent-ny-cinelease', 'Cinelease', 'us-ny-newyork', LIGHT_GRIP, 3,
    'Lighting and grip for the city: lamps, stands, distribution and a truck that can park. Rates are SLATE’s calibration.', undefined, 88),

  // --- Atlanta -------------------------------------------------------------
  rh('rent-atl-keslow', 'Keslow Camera', 'us-ga-atlanta', CAMERA, 3,
    'A camera and lens house working the southeast. Stock and rates are SLATE’s calibration.', undefined, 90),
  rh('rent-atl-sim', 'Sim', 'us-ga-atlanta', CAMERA, 3,
    'A camera house in the southeastern production center. Stock and rates are SLATE’s calibration.', undefined, 89),
  rh('rent-atl-cinelease', 'Cinelease', 'us-ga-atlanta', LIGHT_GRIP, 3,
    'Lighting and grip out of Atlanta, where a great deal is shot. Rates are SLATE’s calibration.', undefined, 88),
  rh('rent-atl-mbs', 'MBS Equipment Company', 'us-ga-atlanta', LIGHT_GRIP, 3,
    'Lighting and grip beside the stages. Stock and rates are SLATE’s calibration.', undefined, 87),
  rh('rent-atl-trew', 'Trew Audio', 'us-ga-atlanta', ['sound'], 2,
    'A sound house: recorders, radio mics and booms. Stock and rates are SLATE’s calibration.', undefined, 87),

  // --- London --------------------------------------------------------------
  rh('rent-ldn-panavision', 'Panavision', 'uk-eng-london', CAMERA, 4,
    'The London counter of the house founded in California in 1954, which rents and doesn’t sell. Stock and rates are SLATE’s calibration.', 1954, 95),
  rh('rent-ldn-arri', 'ARRI Rental', 'uk-eng-london', CAMERA, 4,
    'The London counter of the rental arm of ARRI, the Munich camera maker founded in 1917. Stock and rates are SLATE’s calibration.', 1917, 94),
  rh('rent-ldn-movietech', 'Movietech Camera Rentals', 'uk-eng-london', CAMERA, 3,
    'A British camera house, long associated with the studios west of London. Stock and rates are SLATE’s calibration.', undefined, 90),
  rh('rent-ldn-panalux', 'Panalux', 'uk-eng-london', LIGHT_GRIP, 3,
    'A lighting house working British stages and locations. Stock and rates are SLATE’s calibration.', undefined, 89),

  // --- Toronto and Vancouver -----------------------------------------------
  rh('rent-tor-white', 'William F. White International', 'ca-on-toronto', EVERYTHING, 3,
    'The Canadian rental house, in the business since 1963, which hires camera, lighting, grip and sound out of one door. Stock and rates are SLATE’s calibration.', 1963, 91),
  rh('rent-tor-panavision', 'Panavision', 'ca-on-toronto', CAMERA, 4,
    'The Toronto counter of the house founded in California in 1954, which rents and doesn’t sell. Stock and rates are SLATE’s calibration.', 1954, 93),
  rh('rent-tor-keslow', 'Keslow Camera', 'ca-on-toronto', CAMERA, 3,
    'A camera and lens house working Toronto as well as the American centers. Stock and rates are SLATE’s calibration.', undefined, 90),
  rh('rent-tor-trew', 'Trew Audio', 'ca-on-toronto', ['sound'], 2,
    'A sound house: recorders, radio mics and booms. Stock and rates are SLATE’s calibration.', undefined, 87),
  rh('rent-van-white', 'William F. White International', 'ca-bc-vancouver', EVERYTHING, 3,
    'The Vancouver branch of the Canadian house in the business since 1963. Stock and rates are SLATE’s calibration.', 1963, 90),
  rh('rent-van-sim', 'Sim', 'ca-bc-vancouver', CAMERA, 3,
    'A camera house on the west coast of Canada, where a great deal of series work is shot. Stock and rates are SLATE’s calibration.', undefined, 90),
  rh('rent-van-keslow', 'Keslow Camera', 'ca-bc-vancouver', CAMERA, 3,
    'A camera and lens house working Vancouver. Stock and rates are SLATE’s calibration.', undefined, 89),
  rh('rent-van-trew', 'Trew Audio', 'ca-bc-vancouver', ['sound'], 2,
    'A sound house: recorders, radio mics and booms. Stock and rates are SLATE’s calibration.', undefined, 87),

  // --- Sydney and Paris ----------------------------------------------------
  rh('rent-syd-panavision', 'Panavision', 'au-nsw-sydney', CAMERA_GRIP, 4,
    'The Sydney counter of the house founded in California in 1954, which rents and doesn’t sell. Stock and rates are SLATE’s calibration.', 1954, 92),
  rh('rent-par-panavision', 'Panavision Alga', 'fr-idf-paris', CAMERA, 4,
    'The French arm of the house founded in California in 1954, which rents and doesn’t sell. Stock and rates are SLATE’s calibration.', 1954, 92),
  rh('rent-par-tsf', 'TSF', 'fr-idf-paris', EVERYTHING, 3,
    'A French rental group with camera, lighting and grip under one name. Stock and rates are SLATE’s calibration.', undefined, 90),

  // --- Berlin --------------------------------------------------------------
  rh('rent-ber-arri', 'ARRI Rental', 'de-be-berlin', CAMERA, 4,
    'The German rental arm of ARRI, the Munich camera maker founded in 1917. Stock and rates are SLATE’s calibration.', 1917, 93),
];

/**
 * Chains in the retail catalog that are rental houses rather than shops.
 *
 * Panavision has never sold a camera and ARRI Rental is a rental arm, so
 * neither is a storefront you walk into and buy from. They stand in the street
 * as houses now, and the shop of the same name is taken off it, which is also
 * how a city stops having two doors with one name on them.
 */
export const HOUSES_NOT_SHOPS: ReadonlySet<string> = new Set(['panavision', 'arri_rental']);

/** The cities the real list reaches. Everywhere else the houses are SLATE's. */
export const CITIES_WITH_REAL_HOUSES: readonly string[] = [...new Set(RENTAL_HOUSES.map((h) => h.cityId))];

// ---------------------------------------------------------------------------
// SLATE's own houses, for every other city that shoots anything
// ---------------------------------------------------------------------------

const OWN_NAMES: readonly ((city: string) => string)[] = [
  (city) => `${city} Camera Rentals`,
  () => 'Lot Six Rentals',
  () => 'Backline Camera',
  (city) => `${city} Grip And Lighting`,
  () => 'The Loading Bay',
  () => 'Northside Lighting',
  () => 'Second Unit Rentals',
  () => 'The Sound Cage',
];

const OWN_LINES: readonly (readonly RentalLine[])[] = [
  CAMERA, CAMERA, LIGHT_GRIP, LIGHT_GRIP, EVERYTHING, ['sound'], CAMERA_GRIP, EVERYTHING,
];

const OWN_ABOUT: readonly string[] = [
  'A counter, a prep bay and a shelf of cases with somebody else’s show name still taped to them.',
  'Two units on an industrial estate, open early because everybody collects early.',
  'A yard with a roller door, a forklift and a very organized book of who has what.',
  'A lighting store with the lamps racked by wattage and the stands by height.',
  'Camera, lighting, grip and sound out of one door, which is rarer than it sounds.',
  'A small shop that knows radio mics better than anybody, and says so.',
  'Cameras at the front, sticks and dollies at the back, and a prep table between them.',
  'The house everybody in town uses, because there’s one of them and it’s fine.',
];

/**
 * How many houses a city has of its own, by how much is shot there. A city
 * with no industry at all still has one place that hires a camera, because
 * somewhere always does.
 */
export function ownHouseCount(industryPresence: number, population: number): number {
  if (industryPresence >= 70) return 3;
  if (industryPresence >= 45) return 2;
  if (industryPresence >= 20 || population > 1_500_000) return 1;
  return population > 400_000 ? 1 : 0;
}

/** SLATE's own houses in a city, which never move once a save has seen them. */
export function ownHousesIn(cityId: string, cityName: string, industryPresence: number, population: number): RentalHouse[] {
  const count = ownHouseCount(industryPresence, population);
  const rng = makeRng(`rental:${cityId}`);
  const out: RentalHouse[] = [];
  const taken = new Set<string>();
  for (let i = 0; i < count; i += 1) {
    let at = rng.int(0, OWN_NAMES.length - 1);
    let guard = 0;
    // The first house in a town always hires a camera. A place with nowhere to
    // hire a camera and one shop full of radio mics is not a town anybody shoots in.
    const wanted = (index: number) => !taken.has(String(index)) && (i > 0 || OWN_LINES[index]!.includes('camera'));
    while (!wanted(at) && guard++ < OWN_NAMES.length * 2) at = (at + 1) % OWN_NAMES.length;
    taken.add(String(at));
    out.push({
      id: `${cityId}:rental_house:${i}`,
      name: OWN_NAMES[at]!(cityName),
      kind: 'rental_house',
      cityId,
      about: OWN_ABOUT[at]!,
      price: (i === 0 ? 2 : rng.int(1, 3)) as 1 | 2 | 3 | 4,
      quality: 52 + rng.int(0, 26),
      lines: OWN_LINES[at]!,
      house: false,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// What a day costs
// ---------------------------------------------------------------------------

/**
 * The share of a piece's value a house asks for a day of it.
 *
 * Cheap things rent for a bigger share of themselves than dear ones, which is
 * why a seventy thousand dollar body is under two percent a day and a nine
 * hundred dollar lamp is nearer five. Every figure is SLATE's own.
 */
const DAY_SHARE: Readonly<Record<string, number>> = {
  camera: 0.018,
  lens: 0.020,
  'camera support': 0.045,
  lighting: 0.045,
  grip: 0.050,
  sound: 0.035,
  monitoring: 0.035,
  media: 0.030,
  power: 0.038,
  filtration: 0.040,
  live: 0.030,
};

/** Nothing is worth writing a ticket for under this. */
export const MINIMUM_DAY_RATE: Money = 12_00;

/**
 * Under this, a thing is bought rather than hired.
 *
 * Nobody writes a ticket for a thirty dollar clamp; it goes in the van with
 * the rest of the expendables and gets bought. The shelf starts here.
 */
export const RENT_FLOOR: Money = 75_00;

/** What one piece costs for a day, before the week. */
export function dayRateOf(good: RealGood): Money {
  // Panavision quotes a day rate and no purchase price, so the catalog price
  // is already the day rate rather than something to take a share of.
  if (good.tags?.includes('day rate')) return good.basePrice;
  const share = DAY_SHARE[good.subcategory ?? ''] ?? 0.035;
  return Math.max(MINIMUM_DAY_RATE, Math.round((good.basePrice * share) / 100) * 100);
}

/**
 * The three day week.
 *
 * A rental week bills as three days, which is the convention and is why
 * anybody shoots on a Friday. Days beyond a week bill the same way again.
 */
export const WEEK_BILLS_DAYS = 3;

export function billedDays(days: number): number {
  const whole = Math.max(1, Math.round(days));
  const weeks = Math.floor(whole / 7);
  const rest = whole % 7;
  return weeks * WEEK_BILLS_DAYS + Math.min(rest, WEEK_BILLS_DAYS);
}

/** The deposit a house holds, as a share of what the kit is worth. */
export const DEPOSIT_SHARE = 0.08;
/** With equipment cover of your own on file, the house holds less. */
export const INSURED_DEPOSIT_SHARE = 0.02;
/** The house's own damage waiver, as a share of the hire. */
export const WAIVER_SHARE = 0.12;
/** What a day late costs: the day rate again, and then some. */
export const LATE_SHARE = 1.25;
/** How long a house will wait before it calls the hire a loss. */
export const LOST_AFTER_DAYS = 21;
/** Delivery to the location, as a share of the hire, with a floor. */
export const DELIVERY_SHARE = 0.06;
export const DELIVERY_FLOOR: Money = 85_00;
/** Minutes it takes to go and collect a hire yourself, and to take it back. */
export const COLLECT_MINUTES = 75;
