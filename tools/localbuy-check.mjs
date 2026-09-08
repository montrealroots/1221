/**
 * A branch of a chain is a branch, not the chain.
 *
 * Measured like published data: the countries that prohibit alcohol in shops
 * and the ones that sell it through a state monopoly, the countries where pork
 * is not sold and the ones that sell it in a licensed room, and the beef
 * restriction across India. Every one of those is a real arrangement and is
 * carried as one.
 *
 * Measured for making sense: a product is classified off its own tags and
 * never off its name, because a Virgin olive oil is not gin and a Hamilton
 * watch is not ham; a climate that rules out a parka does not rule out a
 * saucepan; a branch keeps the same buy every time you walk into it; and no
 * branch anywhere drops below the hundred products every branch promises.
 */

import {
  ALCOHOL_MONOPOLY, ALCOHOL_PROHIBITED, AVAILABILITY_LABEL, BEEF_RESTRICTED, BUY_DEPTH,
  CLIMATE_BUY_NOTE, LAW_NOTE, LOCAL_BUY_NOTE, NEVER_BELOW, NO_HEAVY_COATS, NO_SWIMWEAR,
  PORK_LICENSED_ROOM, PORK_NOT_SOLD, SEASONS_BOUGHT_FOR, availabilityOf, depthFor, onTheShelfIn,
  suitsClimate,
} from '../src/engine/content/localbuy.ts';
import { CLIMATE_NAMES } from '../src/engine/content/climate.ts';
import { CATALOG, RETAILERS, houseBrandOf } from '../src/engine/content/catalog.ts';
import { COUNTRIES, CITIES } from '../src/engine/content/geography.ts';
import { placesIn } from '../src/engine/content/places.ts';
import { quickSave } from '../src/engine/index.ts';
import { MINIMUM_ASSORTMENT, assortmentAt, branchBuy, branchSize, notCarriedAt } from '../src/engine/systems/retail.ts';

const problems = [];
const known = new Set(COUNTRIES.all().map((one) => one.id));
const all = CATALOG.all();

// --- The arrangements, which are real -----------------------------------------

for (const [name, set] of [
  ['alcohol prohibited', ALCOHOL_PROHIBITED], ['pork not sold', PORK_NOT_SOLD],
  ['pork in a licensed room', PORK_LICENSED_ROOM], ['beef restricted', BEEF_RESTRICTED],
]) {
  for (const countryId of set) {
    if (!known.has(countryId)) problems.push(`${countryId} is ${name} and is not a country`);
  }
  if (set.size === 0) problems.push(`nothing is ${name}`);
}
for (const [countryId, shop] of Object.entries(ALCOHOL_MONOPOLY)) {
  if (!known.has(countryId)) problems.push(`${countryId} has a monopoly and is not a country`);
  if (shop.length < 3) problems.push(`${countryId}'s monopoly has no name`);
}
// A country cannot both prohibit a thing and sell it in a room.
for (const countryId of PORK_NOT_SOLD) {
  if (PORK_LICENSED_ROOM.has(countryId)) problems.push(`${countryId} both does and does not sell pork`);
}
for (const countryId of ALCOHOL_PROHIBITED) {
  if (ALCOHOL_MONOPOLY[countryId]) problems.push(`${countryId} both prohibits alcohol and has a monopoly for it`);
}
// The ones everybody knows about.
if (!ALCOHOL_MONOPOLY.se?.includes('Systembolaget')) problems.push('Sweden is not carried as Systembolaget');
if (!ALCOHOL_MONOPOLY.no?.includes('Vinmonopolet')) problems.push('Norway is not carried as Vinmonopolet');
if (!ALCOHOL_MONOPOLY.fi?.includes('Alko')) problems.push('Finland is not carried as Alko');
if (!ALCOHOL_PROHIBITED.has('sa')) problems.push('Saudi Arabia is carried as selling alcohol in shops');
if (!PORK_NOT_SOLD.has('sa')) problems.push('Saudi Arabia is carried as selling pork');
if (!PORK_LICENSED_ROOM.has('ae')) problems.push('the Emirates are not carried as selling pork in a licensed room');
if (!BEEF_RESTRICTED.has('in')) problems.push('India is not carried as restricting beef');
// And a country with no arrangement has none applied to it.
for (const countryId of ['uk', 'us', 'fr', 'de', 'jp', 'br']) {
  if (ALCOHOL_PROHIBITED.has(countryId) || ALCOHOL_MONOPOLY[countryId]) {
    problems.push(`${countryId} is given an alcohol arrangement it does not have`);
  }
  if (PORK_NOT_SOLD.has(countryId) || PORK_LICENSED_ROOM.has(countryId)) {
    problems.push(`${countryId} is given a pork arrangement it does not have`);
  }
}
for (const label of Object.values(AVAILABILITY_LABEL)) {
  if (label.length < 8) problems.push('an availability has no label');
}
if (!/lawfully/.test(LOCAL_BUY_NOTE)) problems.push('the note about the buy has gone');
if (!/monopoly/.test(LAW_NOTE)) problems.push('the note about the rules has gone');
if (!/swimwear/.test(CLIMATE_BUY_NOTE)) problems.push('the note about the climate has gone');

// --- Classified off its tags, never off its name --------------------------------

// The disaster this rule exists to prevent: a Virgin olive oil read as gin, a
// Hamilton watch read as ham, a Champion sweatshirt read as ham twice.
const TRAPS = [
  ['Colavita Extra Virgin Olive Oil', 'sa'],
  ['Tabasco Original Red', 'sa'],
  ['Rummo Mezzi Paccheri', 'sa'],
];
for (const [name, countryId] of TRAPS) {
  const item = all.find((one) => one.name === name);
  if (!item) continue;
  if (!onTheShelfIn(item, countryId)) problems.push(`"${name}" was read as something it is not in ${countryId}`);
}
for (const item of all) {
  if (item.category === 'watch' || item.category === 'clothing' || item.category === 'jewelry') {
    if (!onTheShelfIn(item, 'sa')) problems.push(`${item.name} is a ${item.category} and was left off a shelf by a food rule`);
  }
}
// Every grocery that is one of these says so on itself, so a new product added
// without the tag is caught here rather than sold in Riyadh.
for (const item of all.filter((one) => one.category === 'groceries' && !one.tags.includes('legacy'))) {
  const name = item.name.toLowerCase();
  if (/\b(bacon|prosciutto|jam[oó]n|pancetta|chorizo|pork)\b/.test(name) && !item.tags.includes('pork')) {
    problems.push(`${item.name} is pork and is not tagged as pork`);
  }
  if (/\b(ribeye|sirloin|striploin|wagyu)\b/.test(name) && !item.tags.includes('beef')) {
    problems.push(`${item.name} is beef and is not tagged as beef`);
  }
  if (/beef/.test(name) && !item.tags.includes('beef')) {
    problems.push(`${item.name} is beef and is not tagged as beef`);
  }
}
// And the rules actually bite on the products that are there.
const booze = all.filter((one) => one.tags.includes('alcohol'));
if (booze.length < 20) problems.push(`only ${booze.length} alcohol products to apply the rule to`);
const pork = all.filter((one) => one.tags.includes('pork'));
if (pork.length < 4) problems.push(`only ${pork.length} pork products to apply the rule to`);
const beef = all.filter((one) => one.tags.includes('beef'));
if (beef.length < 3) problems.push(`only ${beef.length} beef products to apply the rule to`);
for (const item of booze) {
  if (onTheShelfIn(item, 'sa')) problems.push(`${item.name} is on a Saudi shelf`);
  if (onTheShelfIn(item, 'se')) problems.push(`${item.name} is on a Swedish supermarket shelf`);
  if (!onTheShelfIn(item, 'uk')) problems.push(`${item.name} is not on a British shelf`);
  if (availabilityOf(item, 'se').availability !== 'licensed_counter') {
    problems.push(`${item.name} in Sweden is not behind the monopoly counter`);
  }
}
for (const item of pork) {
  if (onTheShelfIn(item, 'kw')) problems.push(`${item.name} is on a Kuwaiti shelf`);
  if (availabilityOf(item, 'ae').availability !== 'licensed_counter') {
    problems.push(`${item.name} in the Emirates is not in the licensed room`);
  }
  if (!onTheShelfIn(item, 'es')) problems.push(`${item.name} is not on a Spanish shelf`);
}

// --- The weather ------------------------------------------------------------------

for (const climate of Object.keys(CLIMATE_NAMES)) {
  const seasons = SEASONS_BOUGHT_FOR[climate];
  if (!seasons || seasons.length === 0) problems.push(`${climate} buys for no season at all`);
  for (const season of seasons ?? []) {
    if (!['Spring', 'Summer', 'Autumn', 'Winter'].includes(season)) {
      problems.push(`${climate} buys for "${season}", which is not a season`);
    }
  }
}
if (NO_SWIMWEAR.size === 0 || NO_HEAVY_COATS.size === 0) problems.push('the weather rules out nothing anywhere');
for (const climate of NO_SWIMWEAR) if (!CLIMATE_NAMES[climate]) problems.push(`${climate} is not a climate`);
for (const climate of NO_HEAVY_COATS) if (!CLIMATE_NAMES[climate]) problems.push(`${climate} is not a climate`);
// Nobody declines to stock a saucepan because of the weather.
for (const item of all.filter((one) => one.category !== 'clothing' && one.category !== 'footwear')) {
  for (const climate of ['equatorial', 'polar']) {
    if (!suitsClimate(item, climate)) problems.push(`${item.name} is a ${item.category} and the weather left it off`);
  }
}
// A garment with a season on it is only bought where that season happens.
const winterOnly = all.find((one) => one.category === 'clothing'
  && Array.isArray(one.seasons) && one.seasons.length === 1 && one.seasons[0] === 'Winter');
if (winterOnly && suitsClimate(winterOnly, 'equatorial')) {
  problems.push(`${winterOnly.name} is bought for an equatorial city`);
}

// --- The branch's own buy ----------------------------------------------------------

let lastShare = 2;
for (const band of BUY_DEPTH) {
  if (band.share <= 0 || band.share > 1) problems.push(`a branch carries ${band.share} of the range`);
  if (band.share >= lastShare) problems.push('the buy depths are out of order');
  lastShare = band.share;
  if (band.label.length < 5) problems.push('a branch size has no label');
}
if (BUY_DEPTH[BUY_DEPTH.length - 1].from !== 0) problems.push('there is a hole at the bottom of the buy depths');
if (depthFor(95).share <= depthFor(20).share) problems.push('a flagship carries no more than a small branch');
if (NEVER_BELOW < MINIMUM_ASSORTMENT) problems.push('a branch may drop below the hundred it promises');

// --- A world it happens in -----------------------------------------------------------

const sim = quickSave(
  { birthYear: 1995, startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london' }, 'localbuy-check',
);
/**
 * The shops that carry more than one label.
 *
 * A brand's own boutique is a different promise: it carries what that brand
 * makes, which is a handful of things, and the hundred is not asked of it.
 */
function shopsIn(cityId) {
  const out = new Map();
  for (const place of placesIn(cityId)) {
    if (place.kind !== 'shop' && place.kind !== 'market') continue;
    const retailer = place.retailerId ? RETAILERS.get(place.retailerId) : undefined;
    if (retailer && houseBrandOf(retailer) !== undefined) continue;
    const stock = assortmentAt(sim, place);
    if (stock.length > 0) out.set(place.name, { place, ids: new Set(stock.map((one) => one.item.id)), n: stock.length });
  }
  return out;
}
const CITIES_TO_WALK = [
  ['uk-eng-london', 'London'], ['jp-13-tokyo', 'Tokyo'], ['sg-singapore', 'Singapore'],
  ['is-39-reykjavik', 'Reykjavik'], ['sa-10-riyadh', 'Riyadh'], ['ae-du-dubai', 'Dubai'],
  ['se-26-stockholm', 'Stockholm'], ['in-16-mumbai', 'Mumbai'],
];
const walked = new Map();
for (const [cityId, label] of CITIES_TO_WALK) {
  if (!CITIES.get(cityId)) { problems.push(`${label} is not a city the gazetteer has`); continue; }
  const shops = shopsIn(cityId);
  if (shops.size === 0) problems.push(`${label} has no shop with anything in it`);
  walked.set(label, shops);
  for (const [name, shop] of shops) {
    if (shop.n < MINIMUM_ASSORTMENT) problems.push(`${name} in ${label} carries ${shop.n}`);
    if (!branchSize(shop.place)) problems.push(`${name} in ${label} has no size`);
  }
}
// The same chain in two countries is not the same shop.
let compared = 0;
for (const [a, b] of [['London', 'Singapore'], ['London', 'Reykjavik'], ['Singapore', 'Reykjavik'], ['London', 'Tokyo']]) {
  const one = walked.get(a);
  const two = walked.get(b);
  if (!one || !two) continue;
  for (const name of [...one.keys()].filter((n) => two.has(n))) {
    const onlyA = [...one.get(name).ids].filter((id) => !two.get(name).ids.has(id)).length;
    const onlyB = [...two.get(name).ids].filter((id) => !one.get(name).ids.has(id)).length;
    compared += 1;
    if (onlyA === 0 && onlyB === 0) {
      problems.push(`${name} carries exactly the same shop in ${a} and ${b}`);
    }
  }
}
if (compared < 4) problems.push(`only ${compared} chains found trading in two of the walked cities`);

// A branch keeps the same buy: walking in twice is the same shop.
{
  const shops = shopsIn('uk-eng-london');
  const [name, first] = [...shops][0];
  const again = assortmentAt(sim, first.place);
  const moved = again.filter((one) => !first.ids.has(one.item.id)).length;
  if (moved > 0) problems.push(`${name} carried ${moved} different things on the same day`);
  // And still the same a fortnight later, because a buy is a season's decision.
  sim.advanceTo(sim.now + 20 * 24 * 60 * 60 * 1000);
  const later = assortmentAt(sim, first.place);
  const changed = later.filter((one) => !first.ids.has(one.item.id)).length;
  if (changed > 0) problems.push(`${name} changed its whole buy in a fortnight`);
}

// And the gap is explained rather than silent.
for (const [label, expect] of [['Riyadh', /not sold/], ['Stockholm', /Systembolaget/], ['Dubai', /licensed room/], ['Mumbai', /Beef/]]) {
  const shops = walked.get(label);
  if (!shops) continue;
  const reasons = [...shops.values()].map((one) => notCarriedAt(one.place)).find((one) => one.length > 0);
  if (!reasons) { problems.push(`${label} leaves nothing off and should`); continue; }
  if (!reasons.some((one) => expect.test(one.why))) {
    problems.push(`${label} does not say why: ${reasons.map((one) => one.why).join(' / ')}`);
  }
  for (const reason of reasons) {
    if (reason.count <= 0) problems.push(`${label} leaves off nothing and says it did`);
    if (reason.why.length < 20) problems.push(`${label} gives a reason that is not one`);
  }
}
// London leaves nothing off, because Britain has no such arrangement.
{
  const shops = walked.get('London');
  const any = [...(shops?.values() ?? [])].map((one) => notCarriedAt(one.place)).find((one) => one.length > 0);
  if (any) problems.push(`London leaves something off: ${any.map((one) => one.why).join(' / ')}`);
}

// --- Say what was measured -------------------------------------------------------------

console.log(`${ALCOHOL_PROHIBITED.size} countries do not sell alcohol in shops and ${Object.keys(ALCOHOL_MONOPOLY).length} sell it through a state monopoly.`);
console.log(`${PORK_NOT_SOLD.size} countries do not sell pork and ${PORK_LICENSED_ROOM.size} sell it in a licensed room; beef is restricted in ${BEEF_RESTRICTED.size}.`);
console.log(`${Object.keys(SEASONS_BOUGHT_FOR).length} climates, each buying for the seasons its year actually has.`);
console.log(`${compared} chains compared across two countries, and none of them carried the same shop twice.`);
console.log('The arrangements and the climates are real. How deep one branch goes into the range it could carry is SLATE’s own.');

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):`);
  for (const one of [...new Set(problems)].slice(0, 40)) console.error(`  - ${one}`);
  process.exit(1);
}
console.log('The buy holds.');
