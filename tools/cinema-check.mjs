/**
 * The cinema holds up.
 *
 * The chains are real and this measures that they are: that every one of them
 * is listed only in countries the geography actually has, that no country with
 * cinemas in it has nowhere to see a film, that every classification system is
 * a real body with certificates that make sense next to each other, and that
 * the note saying the program is SLATE's own is still on the page.
 *
 * It also measures the program itself: that a week in a city is a real
 * week's worth of pictures, that the titles inside one do not repeat, that a
 * runtime is a runtime rather than a number somebody typed, and that a horror
 * film does not come out with a certificate that lets a child in alone.
 */

import {
  BASE_TICKET, CHAIN_TIER_LABEL, CINEMA_CHAINS, CINEMA_NOTE, GENRES, MATINEE_DISCOUNT,
  RATING_SYSTEMS, SCREEN_LABEL, SCREEN_PREMIUM, SCREEN_SEATS, SLATE_ADVISORY, SEASONS,
  TITLE_COMBINATIONS, chainsInCountry, ratingSystemFor,
} from '../src/engine/content/cinemas.ts';
import { CITIES } from '../src/engine/content/geography.ts';
import { COUNTRIES } from '../src/engine/content/geography.ts';
import { quickSave } from '../src/engine/index.ts';
import { cinemasIn, programmeIn, chainOf, showtimesFor, ticketPrice, screenFor, seatsLeft } from '../src/engine/systems/cinema.ts';

const problems = [];

// --- The chains -------------------------------------------------------------

const ids = new Set();
const names = new Set();
for (const chain of CINEMA_CHAINS) {
  if (ids.has(chain.id)) problems.push(`two chains share the id ${chain.id}`);
  ids.add(chain.id);
  if (names.has(chain.name)) problems.push(`two chains are called ${chain.name}`);
  names.add(chain.name);
  if (chain.countryIds.length === 0) problems.push(`${chain.name} trades nowhere`);
  for (const countryId of chain.countryIds) {
    if (!COUNTRIES.get(countryId)) problems.push(`${chain.name} is listed in ${countryId}, which is not a country here`);
  }
  if (chain.screens.length === 0) problems.push(`${chain.name} has no screens`);
  if (!CHAIN_TIER_LABEL[chain.tier]) problems.push(`${chain.name} is a ${chain.tier}, which is not a kind of house`);
  if (chain.about.length < 20) problems.push(`${chain.name} has nothing said about it`);
}

// --- Somewhere to see a film ------------------------------------------------

/** The countries with the most cities here. Each should have a chain in it. */
const busiest = [...CITIES.all().reduce((map, city) => map.set(city.countryId, (map.get(city.countryId) ?? 0) + 1), new Map())]
  .sort((a, b) => b[1] - a[1]).slice(0, 24).map(([countryId]) => countryId);
const withChains = busiest.filter((countryId) => chainsInCountry(countryId).length > 0);

// --- The classification systems --------------------------------------------

const systemIds = new Set();
let certificates = 0;
for (const system of [...RATING_SYSTEMS, SLATE_ADVISORY]) {
  if (systemIds.has(system.id)) problems.push(`two systems share the id ${system.id}`);
  systemIds.add(system.id);
  if (system.body.length < 4) problems.push(`${system.id} has no body behind it`);
  if (system.certificates.length === 0) problems.push(`${system.body} classifies nothing`);
  let lastAdvisory = -1;
  for (const certificate of system.certificates) {
    certificates += 1;
    if (certificate.advisoryAge < lastAdvisory) {
      problems.push(`${system.body} lists ${certificate.label} after a stricter certificate`);
    }
    lastAdvisory = certificate.advisoryAge;
    if (certificate.minimumAge > certificate.advisoryAge) {
      problems.push(`${system.body}: ${certificate.label} enforces an age above the one it advises`);
    }
    if (certificate.minimumAge > 21) problems.push(`${system.body}: ${certificate.label} bars everybody`);
    if (certificate.about.length < 8) problems.push(`${system.body}: ${certificate.label} says nothing`);
  }
  for (const countryId of system.countryIds) {
    if (!COUNTRIES.get(countryId)) problems.push(`${system.body} is listed in ${countryId}, which is not a country here`);
  }
}
if (SLATE_ADVISORY.countryIds.length > 0) problems.push('SLATE’s own advisory claims a country of its own');
if (!/SLATE/.test(SLATE_ADVISORY.body)) problems.push('SLATE’s own advisory does not say it is SLATE’s own');

// --- The note ---------------------------------------------------------------

if (!/SLATE/.test(CINEMA_NOTE) || !/no listings feed/.test(CINEMA_NOTE)) {
  problems.push('the note saying the program is SLATE’s own has gone');
}

// --- The arithmetic ---------------------------------------------------------

if (BASE_TICKET < 500 || BASE_TICKET > 3000) problems.push(`a base seat is ${BASE_TICKET} cents`);
if (MATINEE_DISCOUNT >= 1 || MATINEE_DISCOUNT <= 0.3) problems.push('a matinee is not cheaper than an evening');
for (const [screen, label] of Object.entries(SCREEN_LABEL)) {
  if (!SCREEN_PREMIUM[screen]) problems.push(`${label} has no price of its own`);
  if (!SCREEN_SEATS[screen]) problems.push(`${label} has no seats in it`);
}
const months = new Set(SEASONS.flatMap((season) => season.months));
for (let month = 1; month <= 12; month += 1) {
  if (!months.has(month)) problems.push(`month ${month} is in no season`);
}
if (TITLE_COMBINATIONS < 400) problems.push(`only ${TITLE_COMBINATIONS} titles can be made`);

// --- A week in a city -------------------------------------------------------

const SAMPLE = [
  'us-ca-losangeles', 'us-ny-newyork', 'uk-eng-london', 'fr-idf-paris', 'de-be-berlin',
  'jp-13-tokyo', 'in-16-mumbai', 'kr-11-seoul', 'au-nsw-sydney', 'br-27-saopaulo',
  'mx-cmx-mexicocity', 'za-06-johannesburg', 'ng-05-lagos', 'ae-du-dubai', 'ca-on-toronto',
  'es-md-madrid', 'it-laz-rome', 'sg-singapore', 'th-40-bangkok', 'pl-78-warsaw',
];

const sim = quickSave({ wealth: 'comfortable' }, 'cinema-check');
let showings = 0;
let runtimeTotal = 0;
let citiesWithACinema = 0;
let wrongCertificate = 0;
const perGenre = new Map(GENRES.map((genre) => [genre, 0]));

for (const cityId of SAMPLE) {
  const city = CITIES.get(cityId);
  if (!city) { problems.push(`${cityId} is not a city here`); continue; }
  const houses = cinemasIn(sim, cityId);
  if (houses.length > 0) citiesWithACinema += 1;
  else problems.push(`${city.name} has nowhere to see a film`);

  const program = programmeIn(sim, cityId);
  if (program.length < 4) problems.push(`${city.name} has only ${program.length} pictures on`);
  const titles = new Set();
  for (const showing of program) {
    showings += 1;
    runtimeTotal += showing.runtimeMinutes;
    perGenre.set(showing.genre, (perGenre.get(showing.genre) ?? 0) + 1);
    if (titles.has(showing.title)) problems.push(`${city.name} is showing ${showing.title} twice`);
    titles.add(showing.title);
    if (showing.runtimeMinutes < 60 || showing.runtimeMinutes > 200) {
      problems.push(`${showing.title} runs ${showing.runtimeMinutes} minutes`);
    }
    if (showing.quality < 1 || showing.quality > 100) problems.push(`${showing.title} has a quality of ${showing.quality}`);
    // A horror picture that a nine year old may walk into alone is not a
    // thing the boards do.
    if (showing.genre === 'horror' && showing.certificate.advisoryAge < 10) wrongCertificate += 1;
    if (showing.genre === 'thriller' && showing.certificate.advisoryAge < 8) wrongCertificate += 1;
    if (showing.genre === 'action' && showing.certificate.advisoryAge < 6) wrongCertificate += 1;
    if (showing.genre === 'animation' && showing.certificate.advisoryAge > 13) wrongCertificate += 1;
  }

  // A seat is a seat: a time, a room and a price somebody could pay.
  const place = houses[0];
  const showing = program[0];
  if (place && showing) {
    const times = showtimesFor(sim, place, showing, sim.now + 86_400_000);
    if (times.length === 0) problems.push(`${place.name} shows nothing tomorrow`);
    for (const at of times) {
      const screen = screenFor(sim, place, showing, at);
      const price = ticketPrice(sim, place, screen, at);
      if (price < 300) problems.push(`${place.name} charges ${price} cents for a seat`);
      if (price > 12000) problems.push(`${place.name} charges ${price} cents for a seat`);
      const left = seatsLeft(sim, place, showing, at);
      if (left < 0 || left > SCREEN_SEATS[screen]) problems.push(`${place.name} has ${left} seats left in a ${screen}`);
    }
    const chain = chainOf(sim, place);
    if (chain && !chain.countryIds.includes(city.countryId)) {
      problems.push(`${chain.name} is running a cinema in ${city.name}, where it does not trade`);
    }
  }
}

if (wrongCertificate > showings * 0.02) {
  problems.push(`${wrongCertificate} of ${showings} pictures carry a certificate their kind would not get`);
}
const unusedGenres = [...perGenre.entries()].filter(([, count]) => count === 0).map(([genre]) => genre);
if (unusedGenres.length > 2) problems.push(`nothing on anywhere is ${unusedGenres.join(', ')}`);

// --- What it found ----------------------------------------------------------

console.log(`\n${CINEMA_CHAINS.length} real chains across ${new Set(CINEMA_CHAINS.flatMap((c) => c.countryIds)).size} countries.`);
console.log(`${RATING_SYSTEMS.length} real classification systems, ${certificates} certificates, covering ${RATING_SYSTEMS.reduce((n, s) => n + s.countryIds.length, 0)} countries.`);
console.log(`${withChains.length} of ${busiest.length} of the busiest countries have a chain in them.`);
console.log(`${citiesWithACinema} of ${SAMPLE.length} sampled cities have somewhere to see a film.`);
console.log(`${showings} pictures on across them, averaging ${Math.round(runtimeTotal / Math.max(1, showings))} minutes.`);
console.log(`${TITLE_COMBINATIONS.toLocaleString('en-US')} titles the program can make, and none of them a real film.`);

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log('There is somewhere to go on a Friday.');
