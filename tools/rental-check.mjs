/**
 * The rental houses hold up.
 *
 * Nobody buys an Alexa, so the kit catalog is only half the story and the
 * other half is a counter. This measures that counter: that every real house
 * is in a city that exists, that no two of them collide with each other or
 * with a shop already on the street, that every line a house claims to keep
 * has enough on the shelf to be a shelf, that a day rate is a fraction of what
 * a thing is worth rather than a number somebody typed, and that the note
 * saying none of it is a quote is still there.
 *
 * It also holds the line that everywhere a picture could be shot has somewhere
 * to hire a camera, which is the thing the contract actually asked for.
 */

import {
  CITIES_WITH_REAL_HOUSES, DEPOSIT_SHARE, LINE_SUBCATEGORIES, MINIMUM_DAY_RATE, RENTABLE,
  RENTAL_HOUSES, RENTAL_LINE_LABEL, RENTAL_NOTE, RENT_FLOOR, WAIVER_SHARE, WEEK_BILLS_DAYS,
  billedDays, dayRateOf, ownHouseCount,
} from '../src/engine/content/rental.ts';
import { REAL_KIT } from '../src/engine/content/kit.ts';
import { CITIES } from '../src/engine/content/geography.ts';
import { placesIn } from '../src/engine/content/places.ts';

/** A line needs this much on the shelf before it is a line rather than a gesture. */
const PIECES_PER_LINE = 12;
/** The cities every save should be able to shoot something in. */
const SAMPLE_CITIES = [
  'us-ca-losangeles', 'us-ny-newyork', 'uk-eng-london', 'ca-on-toronto', 'ca-bc-vancouver',
  'us-ga-atlanta', 'fr-idf-paris', 'de-be-berlin', 'au-nsw-sydney', 'jp-13-tokyo',
  'it-laz-rome', 'es-md-madrid', 'in-16-mumbai', 'ng-05-lagos', 'ke-05-nairobi',
  'br-27-saopaulo', 'mx-cmx-mexicocity', 'za-06-johannesburg', 'kr-11-seoul', 'ae-du-dubai',
];

const problems = [];

// --- The roster -------------------------------------------------------------

const ids = new Set();
const inCity = new Map();

for (const house of RENTAL_HOUSES) {
  if (ids.has(house.id)) problems.push(`two houses share the id ${house.id}`);
  ids.add(house.id);

  const city = CITIES.get(house.cityId);
  if (!city) problems.push(`${house.name} is listed in ${house.cityId}, which is not a city`);

  const key = `${house.cityId}:${house.name.toLowerCase()}`;
  if (inCity.has(key)) problems.push(`${house.name} is listed twice in ${house.cityId}`);
  inCity.set(key, house);

  if (house.kind !== 'rental_house') problems.push(`${house.name} is not a rental house`);
  if (!house.house) problems.push(`${house.name} is on the real list but is not marked as a real house`);
  if (house.lines.length === 0) problems.push(`${house.name} keeps nothing`);
  for (const line of house.lines) {
    if (!RENTAL_LINE_LABEL[line]) problems.push(`${house.name} keeps ${line}, which is not a line`);
  }
  if (house.about.length < 40) problems.push(`${house.name} says almost nothing about itself`);
  if (!/SLATE’s calibration/.test(house.about)) {
    problems.push(`${house.name} does not say which half of it is SLATE's own`);
  }
  if (house.price < 1 || house.price > 4) problems.push(`${house.name} has a price band of ${house.price}`);
  if (house.opened !== undefined && (house.opened < 1900 || house.opened > 2020)) {
    problems.push(`${house.name} says it opened in ${house.opened}`);
  }
  for (const word of house.name.split(' ')) {
    if (!/^[A-Z0-9]/.test(word)) problems.push(`${house.name} is not Title Case`);
  }
}

// --- What is on the shelves -------------------------------------------------

for (const [line, subs] of Object.entries(LINE_SUBCATEGORIES)) {
  const pieces = REAL_KIT
    .filter((good) => subs.includes(good.subcategory ?? ''))
    .filter((good) => good.basePrice >= RENT_FLOOR);
  const rates = pieces.map((good) => dayRateOf(good));
  const thin = pieces.length < PIECES_PER_LINE;
  console.log(
    `${thin ? 'THIN' : 'ok  '} ${line.padEnd(9)} ${String(pieces.length).padStart(4)} pieces`
    + ` · ${(Math.min(...rates) / 100).toFixed(0).padStart(6)} to ${(Math.max(...rates) / 100).toFixed(0).padStart(7)} a day`,
  );
  if (thin) problems.push(`${line} has only ${pieces.length} pieces in the catalog`);

  for (const good of pieces) {
    const rate = dayRateOf(good);
    if (rate < MINIMUM_DAY_RATE) problems.push(`${good.name} rents for less than the minimum`);
    // A day of something should never cost more than the thing, unless the
    // house does not sell it at all and the catalog price is the day rate.
    if (!good.tags?.includes('day rate') && rate > good.basePrice * 0.25) {
      problems.push(`${good.name} rents for a quarter of its value a day`);
    }
  }
}

for (const good of REAL_KIT) {
  const sub = good.subcategory ?? '';
  if (!RENTABLE.has(sub)) continue;
  if (!Object.values(LINE_SUBCATEGORIES).some((subs) => subs.includes(sub))) {
    problems.push(`${sub} is rentable but no line keeps it`);
  }
}

// --- The street -------------------------------------------------------------

let citiesWithCamera = 0;
for (const cityId of SAMPLE_CITIES) {
  const city = CITIES.get(cityId);
  if (!city) {
    problems.push(`the sample names ${cityId}, which is not a city`);
    continue;
  }
  const houses = placesIn(cityId).filter((place) => place.kind === 'rental_house');
  const camera = houses.filter((house) => (house.lines ?? []).includes('camera'));
  if (houses.length === 0) problems.push(`nowhere in ${city.name} hires kit at all`);
  if (camera.length === 0) problems.push(`nowhere in ${city.name} hires a camera`);
  else citiesWithCamera += 1;

  // A house must not collide with a shop that is already on the street.
  const names = new Map();
  for (const place of placesIn(cityId)) {
    const key = place.name.toLowerCase();
    if (place.kind === 'rental_house' && names.get(key) && names.get(key) !== 'rental_house') {
      problems.push(`${place.name} in ${city.name} is both a rental house and a ${names.get(key)}`);
    }
    names.set(key, place.kind);
  }
}

if (ownHouseCount(0, 100) !== 0) problems.push('a village with nobody in it has a rental house');
if (ownHouseCount(90, 5_000_000) < 2) problems.push('a city that shoots everything has almost no houses');

// --- The arithmetic ---------------------------------------------------------

if (billedDays(7) !== WEEK_BILLS_DAYS) problems.push('a week no longer bills as three days');
if (billedDays(1) !== 1) problems.push('one day does not bill as one day');
if (billedDays(14) !== WEEK_BILLS_DAYS * 2) problems.push('two weeks do not bill as two weeks');
if (DEPOSIT_SHARE <= 0 || DEPOSIT_SHARE > 0.5) problems.push(`the deposit is ${DEPOSIT_SHARE} of the value`);
if (WAIVER_SHARE <= 0 || WAIVER_SHARE > 0.4) problems.push(`the waiver is ${WAIVER_SHARE} of the hire`);

if (!/SLATE/.test(RENTAL_NOTE) || !/not a quote/.test(RENTAL_NOTE)) {
  problems.push('the note saying none of this is a quote has gone');
}

const rentable = REAL_KIT.filter((good) => RENTABLE.has(good.subcategory ?? ''));
console.log(`\n${RENTAL_HOUSES.length} real houses across ${CITIES_WITH_REAL_HOUSES.length} cities.`);
console.log(`${rentable.length} of ${REAL_KIT.length} pieces of kit are hired rather than bought.`);
console.log(`${citiesWithCamera} of ${SAMPLE_CITIES.length} sampled cities can hire a camera.`);

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log('There is somewhere to hire a camera.');
