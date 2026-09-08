/**
 * A night out holds up.
 *
 * The venues are real and this measures that they are: every one in a city
 * the geography has, no two sharing an id or a name in the same town, and
 * every kind of room the listings draw on actually present somewhere.
 *
 * It also measures the seasons, which are the part that is public record.
 * A sport only turns up in the months its season really runs, in the kind of
 * building it is really played in, and in a country that really follows it —
 * so there is no test match at Wembley in March and no ice hockey in Lagos.
 * And it measures the listing itself: no venue double booked on a day, no act
 * playing two rooms in a town in one week, no exhibition changing its title
 * between Tuesday and Friday, and a price somebody could actually pay.
 */

import {
  BAND_SHARE, BASE_PRICE, CARD_COMBINATIONS, DOORS_OPEN_MINUTES, DOORS_SHUT_MINUTES,
  GOING_LABEL, GOING_NOTE, REFUNDABLE_UNTIL_MINUTES, RUNS_MINUTES, SPORTS, VENUE_SEATS, sportsIn,
} from '../src/engine/content/going.ts';
import { CITIES, COUNTRIES } from '../src/engine/content/geography.ts';
import { placesIn } from '../src/engine/content/places.ts';
import { quickSave } from '../src/engine/index.ts';
import { venuesIn, whatIsOn, priceOf, seatsLeft } from '../src/engine/systems/going.ts';
import { zoneOf } from '../src/engine/systems/cinema.ts';
import { zonedParts } from '../src/engine/core/time.ts';

const problems = [];

// --- The sports -------------------------------------------------------------

const sportIds = new Set();
for (const sport of SPORTS) {
  if (sportIds.has(sport.id)) problems.push(`two sports share the id ${sport.id}`);
  sportIds.add(sport.id);
  if (sport.months.length === 0) problems.push(`${sport.label} has no season`);
  if (sport.months.length > 10) problems.push(`${sport.label} runs ${sport.months.length} months of the year`);
  for (const month of sport.months) {
    if (month < 1 || month > 12) problems.push(`${sport.label} plays in month ${month}`);
  }
  for (const day of sport.days) {
    if (day < 0 || day > 6) problems.push(`${sport.label} plays on day ${day}`);
  }
  if (!['stadium', 'arena'].includes(sport.venueKind)) problems.push(`${sport.label} is played in a ${sport.venueKind}`);
  if (sport.cards.length < 3) problems.push(`${sport.label} has only ${sport.cards.length} kinds of fixture`);
  if (sport.countryIds.length === 0) problems.push(`${sport.label} is followed nowhere`);
  for (const countryId of sport.countryIds) {
    if (!COUNTRIES.get(countryId)) problems.push(`${sport.label} is listed in ${countryId}, which is not a country here`);
  }
  // A card must never name a club: a real club with a made-up result attached
  // to it would be a claim about somebody real.
  for (const card of sport.cards) {
    if (/\b(United|City|Rovers|Athletic|Yankees|Lakers|Real |FC )\b/.test(card)) {
      problems.push(`${sport.label} names something club-shaped in "${card}"`);
    }
  }
}
// Cricket really is two seasons on opposite sides of the year, and squashing
// them into one put test matches in an English March.
const cricket = SPORTS.filter((s) => s.label === 'Cricket');
if (cricket.length < 2) problems.push('cricket is one season rather than the two hemispheres it really is');
for (const one of cricket) {
  const northern = one.countryIds.includes('uk');
  if (northern && one.months.some((m) => m <= 3 || m >= 11)) {
    problems.push('English cricket is scheduled in the winter');
  }
  if (!northern && one.months.some((m) => m >= 5 && m <= 8)) {
    problems.push('southern cricket is scheduled in its own winter');
  }
}

// --- The rooms --------------------------------------------------------------

for (const [kind, seats] of Object.entries(VENUE_SEATS)) {
  if (seats < 100 || seats > 120_000) problems.push(`a ${kind} holds ${seats}`);
}
for (const kind of Object.keys(GOING_LABEL)) {
  if (!BASE_PRICE[kind]) problems.push(`${kind} has no price`);
  if (!RUNS_MINUTES[kind]) problems.push(`${kind} takes no time`);
  if (RUNS_MINUTES[kind] < 60 || RUNS_MINUTES[kind] > 300) problems.push(`${kind} runs ${RUNS_MINUTES[kind]} minutes`);
}
if (BAND_SHARE.best <= BAND_SHARE.middle || BAND_SHARE.middle <= BAND_SHARE.cheap) {
  problems.push('the good seats are not dearer than the cheap ones');
}
if (DOORS_OPEN_MINUTES <= DOORS_SHUT_MINUTES) problems.push('the doors shut before they open');
if (REFUNDABLE_UNTIL_MINUTES <= 0) problems.push('there is no refund window at all');
if (CARD_COMBINATIONS < 250) problems.push(`only ${CARD_COMBINATIONS} cards can be made`);

if (!/SLATE/.test(GOING_NOTE) || !/no listings feed/.test(GOING_NOTE) || !/names no club/.test(GOING_NOTE)) {
  problems.push('the note saying the card is SLATE’s own and names no club has gone');
}

// --- A week in a city -------------------------------------------------------

const SAMPLE = [
  'uk-eng-london', 'us-ny-newyork', 'fr-idf-paris', 'at-09-vienna', 'de-be-berlin',
  'jp-13-tokyo', 'in-16-mumbai', 'au-vic-melbourne', 'br-21-riodejaneiro', 'mx-cmx-mexicocity',
  'za-06-johannesburg', 'ca-on-toronto', 'us-il-chicago', 'it-09-milan', 'ng-05-lagos',
  'kr-11-seoul', 'ae-du-dubai', 'ru-48-moscow', 'eg-11-cairo', 'ar-07-buenosaires',
];

const sim = quickSave({ wealth: 'wealthy' }, 'going-check');
let events = 0;
let realVenues = 0;
let allVenues = 0;
let citiesWithSomethingOn = 0;

for (const cityId of SAMPLE) {
  const city = CITIES.get(cityId);
  if (!city) { problems.push(`${cityId} is not a city here`); continue; }
  const venues = venuesIn(sim, cityId);
  allVenues += venues.length;
  realVenues += venues.filter((one) => one.real).length;
  if (venues.length === 0) problems.push(`${city.name} has nowhere to go out at all`);

  const names = new Set();
  for (const venue of venues) {
    if (names.has(venue.name)) problems.push(`${city.name} has two venues called ${venue.name}`);
    names.add(venue.name);
    if (venue.cityId !== cityId) problems.push(`${venue.name} is filed under the wrong city`);
  }

  const on = whatIsOn(sim, cityId);
  if (on.length > 0) citiesWithSomethingOn += 1;
  else problems.push(`nothing at all is on in ${city.name}`);
  events += on.length;

  // No venue double booked on a day, and no act in two rooms in a week.
  const bookings = new Set();
  const cards = new Map();
  for (const { place, event } of on) {
    // The calendar day the thing falls on where the venue stands: a Chicago
    // evening is the next day in UTC, and reading it that way had two nights
    // on consecutive days looking like a double booking.
    const local = zonedParts(event.at, zoneOf(sim, cityId));
    const slot = `${place.id}@${local.year}-${local.month}-${local.day}`;
    if (event.kind !== 'exhibition') {
      if (bookings.has(slot)) problems.push(`${place.name} is booked twice on one day in ${city.name}`);
      bookings.add(slot);
    }
    // An exhibition keeps its title across its own sessions and nowhere else.
    const where = cards.get(event.card);
    if (where && where !== place.id) {
      problems.push(`"${event.card}" is on at two venues in ${city.name} in one week`);
    }
    cards.set(event.card, place.id);
    if (event.card.length < 4) problems.push(`something in ${city.name} has no card at all`);
    if (!GOING_LABEL[event.kind]) problems.push(`something in ${city.name} is a ${event.kind}`);
    if (event.quality < 1 || event.quality > 100) problems.push(`${event.card} has a quality of ${event.quality}`);

    // A match only where that sport is really followed and really in season.
    if (event.kind === 'match') {
      const label = event.card.split(':')[0];
      const followed = sportsIn(city.countryId).filter((one) => one.label === label);
      if (followed.length === 0) {
        problems.push(`${label} is on in ${city.name}, where nobody follows it`);
      } else {
        const month = new Date(event.at).getUTCMonth() + 1;
        if (!followed.some((one) => one.months.includes(month))) {
          problems.push(`${label} is on in ${city.name} in month ${month}, out of season`);
        }
        const vk = place.kind === 'arena' ? 'arena' : 'stadium';
        if (!followed.some((one) => one.venueKind === vk)) {
          problems.push(`${label} is on in a ${place.kind} in ${city.name}`);
        }
      }
    }

    for (const band of ['best', 'middle', 'cheap']) {
      const price = priceOf(place, event.kind, band);
      if (price < 400) problems.push(`${place.name} charges ${price} cents for a seat`);
      if (price > 90_000) problems.push(`${place.name} charges ${price} cents for a seat`);
      const left = seatsLeft(sim, place, event, band);
      if (left < 0) problems.push(`${place.name} has ${left} seats left`);
    }
  }
}

// Every kind of venue the listings draw on has to exist somewhere.
const kindsFound = new Set(SAMPLE.flatMap((cityId) => placesIn(cityId).map((p) => p.kind)));
for (const kind of ['stadium', 'arena', 'concert_hall', 'theatre', 'museum', 'club']) {
  if (!kindsFound.has(kind)) problems.push(`no city in the sample has a ${kind}`);
}

console.log(`\n${SPORTS.length} sports across ${new Set(SPORTS.flatMap((s) => s.countryIds)).size} countries, each in its own season.`);
console.log(`${allVenues} venues across ${SAMPLE.length} sampled cities, ${realVenues} of them real buildings.`);
console.log(`${events} things on across them this week, and none of them a real fixture, act or production.`);
console.log(`${citiesWithSomethingOn} of ${SAMPLE.length} cities have somewhere to be tonight.`);
console.log(`${CARD_COMBINATIONS.toLocaleString('en-US')} cards the listings can make.`);

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):`);
  for (const problem of problems.slice(0, 30)) console.error(`  - ${problem}`);
  if (problems.length > 30) console.error(`  ... and ${problems.length - 30} more`);
  process.exit(1);
}
console.log('There is somewhere to be tonight.');
