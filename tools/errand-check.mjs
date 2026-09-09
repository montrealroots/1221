/**
 * The ordinary rooms hold up.
 *
 * The chains and the postal operators are real, and this measures that they
 * are: every chain listed only in countries the geography has, every country
 * with a postal operator having exactly one, and no chain claiming a corner in
 * a country whose law requires its pharmacies to be independently owned —
 * which is a real feature of pharmacy law in Germany, France, Italy, Spain,
 * Austria, Greece, Turkey and Denmark, and reads as a gap if it is not said.
 *
 * It also measures the rooms themselves: that every city has a chemist and a
 * post office, that the sign on a chemist is a chain that really trades there
 * or the local word for an independent one, that a cut costs what a cut costs,
 * that postage rises with weight and distance, and that nothing on a counter
 * shelf carries a dose, a claim or an instruction.
 */

import {
  COUNTER_GOODS, ERRAND_NOTE, GROOMING_DAYS, INDEPENDENT_PHARMACY_WORD, LOOKS_UNKEMPT, PHARMACY_NOTE,
  POST_NOTE,
  MAX_PARCEL_GRAMS, PHARMACIES_ARE_INDEPENDENT, PHARMACY_CHAINS, POSTAL_OPERATORS, POST_SERVICES,
  SALON_SERVICES, pharmacyChainsIn, postalOperatorIn,
} from '../src/engine/content/errands.ts';
import { CITIES, COUNTRIES } from '../src/engine/content/geography.ts';
import { quickSave } from '../src/engine/index.ts';
import {
  counterPrice, describePharmacy, groomingOf, launderettesIn, operatorAt, pharmaciesIn,
  pharmacyChainOf, postagePrice, postOfficesIn, salonPrice, salonsIn, shelfAt,
} from '../src/engine/systems/errands.ts';

const problems = [];

// --- The chains -------------------------------------------------------------

const chainIds = new Set();
const chainNames = new Set();
for (const chain of PHARMACY_CHAINS) {
  if (chainIds.has(chain.id)) problems.push(`two chains share the id ${chain.id}`);
  chainIds.add(chain.id);
  if (chainNames.has(chain.name)) problems.push(`two chains are called ${chain.name}`);
  chainNames.add(chain.name);
  if (chain.countryIds.length === 0) problems.push(`${chain.name} trades nowhere`);
  for (const countryId of chain.countryIds) {
    if (!COUNTRIES.get(countryId)) problems.push(`${chain.name} is listed in ${countryId}, which is not a country here`);
    // A chain cannot own a pharmacy where the law says a pharmacist must.
    if (PHARMACIES_ARE_INDEPENDENT.has(countryId)) {
      problems.push(`${chain.name} is listed in ${countryId}, where pharmacies must be independently owned`);
    }
  }
  if (chain.about.length < 15) problems.push(`${chain.name} has nothing said about it`);
}
for (const countryId of PHARMACIES_ARE_INDEPENDENT) {
  if (!COUNTRIES.get(countryId)) problems.push(`${countryId} is not a country here`);
  if (!INDEPENDENT_PHARMACY_WORD[countryId]) problems.push(`${countryId} has no word for its own pharmacy`);
  if (pharmacyChainsIn(countryId).length > 0) problems.push(`${countryId} has chains listed despite the law`);
}

// --- The post ---------------------------------------------------------------

const seenCountries = new Set();
for (const operator of POSTAL_OPERATORS) {
  if (!COUNTRIES.get(operator.countryId)) {
    problems.push(`${operator.name} carries the post of ${operator.countryId}, which is not a country here`);
  }
  if (seenCountries.has(operator.countryId)) {
    problems.push(`${operator.countryId} has two national operators`);
  }
  seenCountries.add(operator.countryId);
  if (operator.about.length < 10) problems.push(`${operator.name} has nothing said about it`);
}

// Postage has to rise with weight, with distance, and with the service.
let lastBase = 0;
for (const service of POST_SERVICES) {
  if (service.homeDays[0] > service.homeDays[1]) problems.push(`${service.label} arrives before it is sent`);
  if (service.abroadDays[0] < service.homeDays[0]) problems.push(`${service.label} crosses a border faster than it crosses a city`);
  if (service.base <= 0 || service.perKilo <= 0) problems.push(`${service.label} is free`);
  lastBase = Math.max(lastBase, service.base);
}
if (lastBase < 1000) problems.push('nothing at the counter costs more than ten of anything');
if (MAX_PARCEL_GRAMS < 1000) problems.push('the counter will not take a parcel at all');

// --- The chair --------------------------------------------------------------

for (const service of SALON_SERVICES) {
  if (service.price <= 0) problems.push(`${service.label} is free`);
  if (service.minutes < 10 || service.minutes > 240) problems.push(`${service.label} takes ${service.minutes} minutes`);
  if (service.restores < 0 || service.restores > 100) problems.push(`${service.label} restores ${service.restores}`);
  if (service.about.length < 20) problems.push(`${service.label} has nothing said about it`);
}
if (GROOMING_DAYS < 14 || GROOMING_DAYS > 120) problems.push(`a cut lasts ${GROOMING_DAYS} days`);
if (LOOKS_UNKEMPT <= 0 || LOOKS_UNKEMPT >= 100) problems.push('the mirror never has anything to say');

// --- The shelf --------------------------------------------------------------

/**
 * Nothing at the counter carries a dose, a claim or an instruction.
 *
 * The shelf is the plain name of an ordinary thing. Anything that reads as
 * dosing, treating or curing is a medical claim and does not belong in a game.
 */
const MEDICAL_CLAIM = /\b(\d+\s?mg|dose|dosage|take (one|two|a)|cures?|treats?|relieves?|prescrib|mg\b|ml\b|twice daily|as directed)\b/i;
for (const good of COUNTER_GOODS) {
  if (MEDICAL_CLAIM.test(good.name) || MEDICAL_CLAIM.test(good.about)) {
    problems.push(`"${good.name}" reads as medical advice rather than a thing on a shelf`);
  }
  if (good.price <= 0) problems.push(`${good.name} is free`);
  if (good.about.length < 15) problems.push(`${good.name} has nothing said about it`);
}
if (COUNTER_GOODS.length < 12) problems.push(`only ${COUNTER_GOODS.length} things on the shelf`);

if (!/SLATE/.test(PHARMACY_NOTE) || !/independently owned/.test(PHARMACY_NOTE)
  || !/n[o’]t medical advice/.test(PHARMACY_NOTE) || !/SLATE/.test(POST_NOTE)
  || !ERRAND_NOTE.includes(PHARMACY_NOTE) || !ERRAND_NOTE.includes(POST_NOTE)) {
  problems.push('the note saying what is real and that nothing is medical advice has gone');
}

// --- The rooms --------------------------------------------------------------

const SAMPLE = [
  'uk-eng-london', 'us-ny-newyork', 'de-be-berlin', 'fr-idf-paris', 'it-09-milan',
  'es-md-madrid', 'jp-13-tokyo', 'kr-11-seoul', 'au-nsw-sydney', 'ca-on-toronto',
  'in-16-mumbai', 'br-27-saopaulo', 'mx-cmx-mexicocity', 'za-06-johannesburg', 'ng-05-lagos',
  'ae-du-dubai', 'tr-34-istanbul', 'se-26-stockholm', 'nl-07-amsterdam', 'ke-05-nairobi',
];

const sim = quickSave({ wealth: 'wealthy' }, 'errand-check');
let chemists = 0;
let independents = 0;
let branded = 0;

for (const cityId of SAMPLE) {
  const city = CITIES.get(cityId);
  if (!city) { problems.push(`${cityId} is not a city here`); continue; }
  sim.player.currentLocationId = cityId;

  if (pharmaciesIn(sim, cityId).length === 0) problems.push(`${city.name} has no chemist`);
  if (postOfficesIn(sim, cityId).length === 0) problems.push(`${city.name} has no post office`);
  if (salonsIn(sim, cityId).length === 0) problems.push(`${city.name} has nowhere to get a haircut`);

  for (const place of pharmaciesIn(sim, cityId)) {
    chemists += 1;
    const chain = pharmacyChainOf(place);
    const independent = PHARMACIES_ARE_INDEPENDENT.has(city.countryId);
    if (independent) {
      independents += 1;
      if (chain) problems.push(`${place.name} in ${city.name} is a chain where the law forbids one`);
      const word = INDEPENDENT_PHARMACY_WORD[city.countryId];
      if (word && !place.name.startsWith(word)) {
        problems.push(`${place.name} in ${city.name} is not named as the local kind of pharmacy`);
      }
      if (!/independently|independent/i.test(describePharmacy(place))) {
        problems.push(`${place.name} in ${city.name} does not say why there is no chain`);
      }
    } else if (chain) {
      branded += 1;
      if (!chain.countryIds.includes(city.countryId)) {
        problems.push(`${chain.name} has a branch in ${city.name}, where it does not trade`);
      }
    }
    const shelf = shelfAt(sim, place);
    if (shelf.length < 8) problems.push(`${place.name} in ${city.name} has almost nothing on the shelf`);
    for (const good of shelf) {
      const price = counterPrice(place, good.id);
      if (price < 100 || price > 12_000) problems.push(`${good.name} is ${price} cents in ${city.name}`);
    }
  }

  const post = postOfficesIn(sim, cityId)[0];
  if (post) {
    const operator = postalOperatorIn(city.countryId);
    if (operator && post.name !== operator.name) {
      problems.push(`the post office in ${city.name} is not named for ${operator.name}`);
    }
    if (!operator) problems.push(`nobody carries the post in ${city.name}`);
    if (operator && operatorAt(post) !== operator.name) {
      problems.push(`the counter in ${city.name} does not know who carries the post`);
    }
    // Heavier costs more, and further costs more.
    const light = postagePrice(post, 'tracked', 500, 'us-ca-losangeles');
    const heavy = postagePrice(post, 'tracked', 5000, 'us-ca-losangeles');
    if (heavy <= light) problems.push(`weight costs nothing in ${city.name}`);
    const near = postagePrice(post, 'tracked', 1000, SAMPLE.find((one) => one !== cityId && CITIES.get(one)?.countryId === city.countryId) ?? cityId);
    const far = postagePrice(post, 'tracked', 1000, city.countryId === 'jp' ? 'uk-eng-london' : 'jp-13-tokyo');
    if (far <= near && near > 0) problems.push(`distance costs nothing in ${city.name}`);
  }

  const salon = salonsIn(sim, cityId)[0];
  if (salon) {
    for (const service of SALON_SERVICES) {
      const price = salonPrice(salon, service.id);
      if (price < 500 || price > 120_000) problems.push(`${service.label} is ${price} cents in ${city.name}`);
    }
  }
}

// A cut wears off, and somebody who has never been reads as freshly cut.
if (groomingOf(sim) !== 100) problems.push('a new life starts looking like it needs a haircut');
sim.player.groomedAt = sim.now - GROOMING_DAYS * 86_400_000;
if (groomingOf(sim) > 2) problems.push('a cut never wears off');

console.log(`\n${PHARMACY_CHAINS.length} real pharmacy chains across ${new Set(PHARMACY_CHAINS.flatMap((c) => c.countryIds)).size} countries.`);
console.log(`${PHARMACIES_ARE_INDEPENDENT.size} countries require a pharmacy to be independently owned, and get one.`);
console.log(`${POSTAL_OPERATORS.length} national postal operators, one to a country.`);
console.log(`${chemists} chemists across ${SAMPLE.length} sampled cities: ${branded} a chain, ${independents} independent by law.`);
console.log(`${COUNTER_GOODS.length} things on a counter, ${SALON_SERVICES.length} things a salon does, ${POST_SERVICES.length} ways to send a parcel.`);

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):`);
  for (const problem of problems.slice(0, 25)) console.error(`  - ${problem}`);
  if (problems.length > 25) console.error(`  ... and ${problems.length - 25} more`);
  process.exit(1);
}
console.log('The ordinary rooms are there.');
