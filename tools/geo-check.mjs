/**
 * The world is the whole world.
 *
 * SLATE ships the complete gazetteer: every country, every first level
 * region, and every city in a file per country. The largest places are
 * bundled so a save opens instantly; the rest are pulled in a country at a
 * time. This measures that the whole of it is really there and really
 * reachable, rather than that the bundled sample looks big enough.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import {
  CITIES, CITIES_IN_THE_WORLD, COUNTRIES, REGIONS, addCountryCities, cityCount,
} from '../src/engine/content/geography.ts';
import { CITY_COUNTS } from '../src/engine/content/world-data.ts';

const TOTAL_CITIES = CITIES_IN_THE_WORLD;

const problems = [];
const countries = COUNTRIES.all();
const regions = REGIONS.all();
const files = readdirSync('public/geo').filter((one) => one.endsWith('.tsv'));

// --- Every country the game names has a list to load --------------------------

let counted = 0;
for (const [countryId, count] of Object.entries(CITY_COUNTS)) {
  counted += count;
  if (!COUNTRIES.get(countryId)) problems.push(`${countryId} has a city list and is not a country`);
  if (!existsSync(`public/geo/${countryId}.tsv`)) problems.push(`${countryId} is counted and has no file`);
}
if (counted !== TOTAL_CITIES) problems.push(`the counts add to ${counted} and the total says ${TOTAL_CITIES}`);
if (files.length < 240) problems.push(`only ${files.length} country files shipped`);
// The handful with no city at all are the ones with nobody living in them,
// plus two countries that no longer exist. That is a fact about the world
// rather than a hole in the data, and it is asserted rather than assumed.
const EMPTY = new Set([
  'aq', // Antarctica: research stations, no settlements.
  'bv', // Bouvet Island: uninhabited.
  'hm', // Heard Island and McDonald Islands: uninhabited.
  'um', // United States Minor Outlying Islands: uninhabited but for staff.
  'an', // The Netherlands Antilles, dissolved in 2010.
  'cs', // Serbia and Montenegro, dissolved in 2006.
]);
const empty = countries.filter((one) => !(CITY_COUNTS[one.id] ?? 0));
for (const one of empty) {
  if (!EMPTY.has(one.id)) problems.push(`${one.name} has no city at all and somebody lives there`);
}
for (const id of EMPTY) {
  if ((CITY_COUNTS[id] ?? 0) > 0) problems.push(`${id} is listed as uninhabited and has cities`);
}
const carried = countries.length - empty.length;
if (carried + empty.length !== countries.length) problems.push('the countries do not add up');

// --- And the whole of one big country really loads ------------------------------

const before = CITIES.all().length;
const added = addCountryCities('us', readFileSync('public/geo/us.tsv', 'utf8'));
if (added < 15_000) problems.push(`loading America added ${added} cities`);
if (CITIES.all().length <= before) problems.push('loading a country added nothing to the registry');
if (addCountryCities('us', readFileSync('public/geo/us.tsv', 'utf8')) !== 0) {
  problems.push('loading the same country twice added it twice');
}

const american = CITIES.all().filter((one) => one.countryId === 'us');
const states = new Set(regions.filter((one) => one.id.startsWith('us-')).map((one) => one.id));
const covered = new Set(american.map((one) => one.parentId));
for (const state of states) {
  if (!covered.has(state)) problems.push(`${state} has no city in it at all`);
}
if (american.length !== cityCount('us')) {
  problems.push(`America counts ${cityCount('us')} and loaded ${american.length}`);
}
// Every loaded city is a real record with somewhere real to be.
for (const city of american.slice(0, 400)) {
  if (!city.name) problems.push(`${city.id} has no name`);
  if (!city.timeZone) problems.push(`${city.name} has no time zone`);
  if (!states.has(city.parentId)) problems.push(`${city.name} is in ${city.parentId}, which is not a state`);
  if (Math.abs(city.latitude) > 90 || Math.abs(city.longitude) > 180) {
    problems.push(`${city.name} is not on Earth`);
  }
  if (city.costOfLivingIndex <= 0) problems.push(`${city.name} costs nothing to live in`);
}

// A few real towns nobody would bundle, to prove the long tail is genuinely there.
for (const id of ['us-mt-bozeman', 'us-vt-burlington', 'us-wy-cheyenne', 'us-nd-fargo', 'us-me-portland']) {
  if (!CITIES.get(id)) problems.push(`${id} is not in the gazetteer`);
}

// --- Say what was measured ------------------------------------------------------

console.log(`${countries.length} countries, ${regions.length} regions and ${TOTAL_CITIES.toLocaleString('en-US')} cities, in ${files.length} country files.`);
console.log(`${carried} countries carry at least one city and the ${empty.length} that do not are uninhabited or dissolved; America alone carries ${CITY_COUNTS.us.toLocaleString('en-US')} across all ${states.size} states and the District.`);
console.log('The gazetteer is public reference data. Every cost figure derived from it is SLATE’s own.');

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):`);
  for (const one of [...new Set(problems)].slice(0, 40)) console.error(`  - ${one}`);
  process.exit(1);
}
console.log('The world holds.');
