/**
 * SLATE — everything this build decides, registered.
 *
 * Importing this file registers every decider, the way `src/ui/looks/all.ts`
 * assembles the drill-down graph. `tests/deciders.test.ts` imports it and
 * sweeps each one; `tools/deciders.mjs` reads the `drawnIn` lines to check
 * that no file in the engine draws from the random number generator without
 * one of these accounting for it.
 *
 * It sits beside `index.ts` rather than under `core/` because a decider has to
 * call the real function on a real world to be worth anything, and that means
 * building a save. Nothing in the engine imports this, so there is no cycle:
 * it is read by the test and by the tool.
 *
 * The list is meant to grow. It is down to the sky after the revamp took the
 * family and the film side out, and anything new that draws lands here,
 * because it cannot land anywhere else without saying what it reads.
 */

import { drive, riderDeath } from './systems/driving';
import { waterHeaterOf } from './systems/hotwater';
import { landAnswer, listingsFor } from './systems/land';
import { trainFate } from './systems/rail';
import { RAIL_ROUTES } from './content/rail';
import { defineDecider } from './core/deciders';
import { quickSave } from './index';
import type { Simulation } from './core/simulation';
import { CITIES } from './content/geography';
import { weatherOn } from './systems/weather';
import { endBetween } from './systems/mortality';
import { accountNumber } from './systems/banknumber';
import { fraudOn } from './systems/security';
import { bankById } from './content/banks';
import { declines } from './systems/lending';
import { MS_DAY, MS_HOUR, startOfDay } from './core/time';
import { internetDown } from './systems/telecom';
import { admittedClass, classmatesIn, goesOn, evenCraft, meanCraft, nightOf } from './systems/school';
import { attributesOf } from './systems/attributes';
import { newLifeConfig } from './world/bootstrap';
import { startingDocuments } from './systems/documents';
import { passesTest } from './systems/licensing';
import { flightFate } from './systems/journey';
import { bagFate } from './systems/baggage';
import { airlineAtFault } from './systems/compensation';
import { mayBeBrokenInto, mayBeStolen } from './systems/theft';
import { mayBreak } from './systems/repairs';
import { onTheRoad } from './systems/roadside';
import { machinesDay } from './systems/appliancefaults';
import { mayRefer } from './systems/appointments';
import { atWork, works } from './systems/availability';
import { asksToday } from './systems/reachingout';
import { passesPilotTest } from './systems/aviation';
import type { Contact } from './systems/people';
import type { Journey } from './systems/journey';
import { mayCollide } from './systems/carcare';
import { buildInspectionFails, weatherDelay } from './systems/construction';
import { monthsToMatch } from './systems/adoption';
import { careOf, deathOf } from './systems/parents';
import { metAtWork } from './systems/people';
import { mayDivorce } from './systems/marriage';
import { mayConceive } from './systems/children';
import { tintOnTheRoad } from './systems/tint';
import type { OwnedVehicle } from './systems/vehicles';
import { modelById } from './systems/vehicles';
import { LICENSE_PATHS } from './content/licensepaths';
import { FILM_ROAD, afterlife, books, hoursOf, locationFor, renewed, managerOffersFor, offersFor, weekOfAuditions, keepsPart } from './systems/career';
import { classMonth } from './systems/rivals';
import { DENIALS, illnessWeek } from './systems/health';
import { listingsIn, rateShift, sellerAnswer, upkeepDay, type OwnedHome } from './systems/homes';
import { bodyOf } from './systems/body';
import { onsetMonth } from './systems/health';
import { waitDays } from './systems/appointments';
import { mayHurt } from './systems/injury';
import { drawRental } from './systems/dwelling';
import { inspectionFails } from './systems/inspections';
import { letDamaged } from './systems/journey';
import { impairedDrive } from './systems/alcohol';
import { announceNominations, entriesOf } from './systems/awards';
import { powerDay, supplyCut } from './systems/utilities';
import { careerOf } from './systems/career';
import { counterOffer } from './systems/career';
import { bidsFor, lateDays, overrunOf } from './systems/worksrisk';
import { PHONE_RISK } from './content/phoneclaims';
import { mishap } from './systems/phones';
import { therapyLifts } from './systems/therapy';
import { planningRefused } from './systems/homes';
import { interestsOf } from './systems/enjoyment';
import { usedFault, usedListings } from './systems/usedcars';
import { drawBuild } from './systems/modelyears';
import { treadLife } from './systems/tires';
import { takenFromDoor } from './systems/orders';
import { bathroomWait } from './systems/rooms';
import { AGENCIES, ROLES, SERIES } from './content/career';

// ---------------------------------------------------------------------------
// The sky
// ---------------------------------------------------------------------------

/**
 * Cities chosen for how differently they behave, not alphabetically: the
 * arctic, the subarctic, an oceanic capital, a desert, the tropics, and the
 * southern hemisphere so a sweep across the year runs both ways round.
 *
 * Every one has to be in the gazetteer the game boots with, and a name that
 * isn't stops the sweep. The list was filtered instead, and five of its eight
 * names dropped out without a word: `gb-eng-london`, `is-1-reykjavik`,
 * `sg-01-singapore` and `ru-sa-yakutsk` were ids the gazetteer never had
 * (Yakutsk is `ru-63-yakutsk`), and Anchorage is there only once the United
 * States' towns are loaded, which the sweep never does. The sweep ran on Las
 * Vegas, Sydney and Los Angeles, and the arctic, the subarctic and the tropics
 * it claimed were not in it.
 */
const SPREAD_OF_PLACES = [
  'sj-21-longyearbyen', 'gl-07-nuuk', 'is-39-reykjavik', 'uk-eng-london',
  'us-nv-lasvegas', 'sg-singapore', 'au-nsw-sydney', 'us-ca-losangeles',
].map((id) => {
  if (!CITIES.get(id)) throw new Error(`The sky's sweep names ${id}, which the gazetteer does not carry.`);
  return id;
});

interface Sky { sim: Simulation; cityId: string; instant: number }

defineDecider<Sky, string>({
  id: 'weather.day',
  decides: 'What the sky does in one city on one day.',
  drawnIn: 'src/engine/systems/weather.ts',
  reads: {
    // Latitude and climate: Longyearbyen and Singapore cannot have the same day.
    place: (sky, t) => ({
      ...sky,
      cityId: SPREAD_OF_PLACES[Math.min(SPREAD_OF_PLACES.length - 1, Math.floor(t * SPREAD_OF_PLACES.length))]!,
    }),
    // The date, all the way round the year, so the seasons have to show.
    date: (sky, t) => ({ ...sky, instant: sky.instant + Math.round(t * 364) * MS_DAY }),
    // Two saves are two different worlds, and the sky is part of that.
    world: (sky, t) => ({ ...sky, sim: skyFor(Math.round(t * 20)) }),
  },
  sample: (seed) => ({
    sim: skyFor(seed),
    cityId: SPREAD_OF_PLACES[seed % SPREAD_OF_PLACES.length]!,
    instant: skyFor(seed).now,
  }),
  decide: ({ sim, cityId, instant }) => {
    const city = CITIES.get(cityId);
    if (!city) return 'nowhere';
    const day = weatherOn(sim, city, instant);
    // The condition and the high, to the degree. Finer than that and every
    // draw differs, which would pass the sweep while proving nothing.
    return `${day.condition} ${Math.round(day.highC)}`;
  },
});

const SKIES = new Map<number, Simulation>();
function skyFor(seed: number): Simulation {
  const held = SKIES.get(seed);
  if (held) return held;
  const made = quickSave({}, `decider-sky-${seed}`);
  SKIES.set(seed, made);
  return made;
}

// ---------------------------------------------------------------------------
// The end of a life
// ---------------------------------------------------------------------------

interface Year { sim: Simulation; age: number; countryId: string; condition: number }

/** A place in each country the table has, for the country a life is lived in. */
const COUNTRY_PLACES: Readonly<Record<string, string>> = {
  jp: 'jp-13-tokyo', is: 'is-39-reykjavik', uk: 'uk-eng-london', us: 'us-ca-losangeles', mx: 'mx-cmx-mexicocity',
};

defineDecider<Year, string>({
  id: 'life.end',
  decides: 'Whether the year up to the next birthday ends the life, and the day it does.',
  drawnIn: 'src/engine/systems/mortality.ts',
  reads: {
    // The life table: a year at twenty and a year at a hundred are not alike.
    age: (year, t) => ({ ...year, age: 20 + Math.round(t * 90) }),
    // Where they live: Japan's table sits years below Mexico's, and a year at
    // ninety-six, in good shape, ends about one life in eight in Tokyo and one
    // in four in Mexico City.
    country: (year, t) => {
      const ids = Object.keys(COUNTRY_PLACES);
      return { ...year, countryId: ids[Math.min(ids.length - 1, Math.floor(t * ids.length))]! };
    },
    // The shape they are in, against what the age allows.
    condition: (year, t) => ({ ...year, condition: Math.round(t * 100) }),
    // Two saves are two lives.
    world: (year, t) => ({ ...year, sim: skyFor(Math.round(t * 20)) }),
  },
  // Old, and a different age in each world, so each world's draw meets a
  // different chance and the country's share of it has somewhere to show.
  sample: (seed) => ({ sim: skyFor(seed), age: 88 + (seed % 6) * 3, countryId: 'us', condition: 60 }),
  decide: ({ sim, age, countryId, condition }) => {
    const player = sim.player;
    const from = sim.now;
    const person = {
      ...player,
      birthInstant: from - age * 365.2425 * MS_DAY,
      // Where they live, whose table it is (`homeOf`).
      currentLocationId: COUNTRY_PLACES[countryId]!,
      home: { kind: 'shared' as const, cityId: COUNTRY_PLACES[countryId]!, since: from },
      wellbeing: { ...player.wellbeing, condition },
    };
    const at = endBetween(sim, person, from, from + 365 * MS_DAY);
    // Which day of the year, or none: the day is part of the decision.
    return at === undefined ? 'lives' : `day ${Math.floor((at - from) / MS_DAY)}`;
  },
});

// ---------------------------------------------------------------------------
// The number an account opens under
// ---------------------------------------------------------------------------

interface Opening { sim: Simulation; bankId: string; kind: 'checking' | 'savings' }

/**
 * Banks of every numbering kind the tables carry, so a sweep across them
 * meets each: an IBAN country, a plain national number, and the thirteen's
 * own formats as they are filled in.
 */
const SPREAD_OF_BANKS = ['nl-ing', 'br-itau-unibanco', 'ch-ubs', 'ng-access-bank'].map((id) => {
  if (!bankById(id)) throw new Error(`The account-number sweep names ${id}, which the bank tables do not carry.`);
  return id;
});

defineDecider<Opening, string>({
  id: 'bank.number',
  decides: 'The number a bank account is opened under.',
  drawnIn: 'src/engine/systems/banknumber.ts',
  reads: {
    // The bank: its country's format and its own code.
    bank: (o, t) => ({ ...o, bankId: SPREAD_OF_BANKS[Math.min(SPREAD_OF_BANKS.length - 1, Math.floor(t * SPREAD_OF_BANKS.length))]! }),
    // A current account and a savings account are two numbers.
    kind: (o, t) => ({ ...o, kind: t < 0.5 ? 'checking' : 'savings' }),
    // Two saves are two sets of accounts.
    world: (o, t) => ({ ...o, sim: skyFor(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: skyFor(seed), bankId: SPREAD_OF_BANKS[seed % SPREAD_OF_BANKS.length]!, kind: 'checking' }),
  decide: ({ sim, bankId, kind }) => accountNumber(sim, sim.player, bankById(bankId)!, kind),
});


// ---------------------------------------------------------------------------
// Somebody else's use of a card
// ---------------------------------------------------------------------------

interface Theft { sim: Simulation; cityId: string }

/** A country for each kind of law and rate the table has: the US's, Britain's, the EU's, Australia's. */
const SPREAD_OF_FRAUD = ['us-ny-newyork', 'uk-eng-london', 'fr-idf-paris', 'au-nsw-sydney'];
const fraudCity = (t: number) => SPREAD_OF_FRAUD[Math.min(SPREAD_OF_FRAUD.length - 1, Math.floor(t * SPREAD_OF_FRAUD.length))]!;

defineDecider<Theft, string>({
  id: 'bank.fraud',
  decides: 'Whether somebody else uses a card on a day, which card, how much, and whether the bank stops it: here, the first such day in thirty years.',
  drawnIn: 'src/engine/systems/security.ts',
  reads: {
    // Where they bank: the country's rate, its average case and its banks' share stopped.
    country: (o, t) => ({ ...o, cityId: fraudCity(t), sim: livingIn(fraudCity(t), 0) }),
    // Two saves are two lives.
    world: (o, t) => ({ ...o, sim: livingIn(o.cityId, Math.round(t * 20)) }),
  },
  sample: (seed) => ({ cityId: SPREAD_OF_FRAUD[seed % SPREAD_OF_FRAUD.length]!, sim: livingIn(SPREAD_OF_FRAUD[seed % SPREAD_OF_FRAUD.length]!, seed) }),
  decide: ({ sim }) => {
    for (let day = 0; day < 30 * 365; day += 1) {
      const hit = fraudOn(sim, sim.player, sim.now + day * MS_DAY);
      if (hit) return 'day ' + day + ': ' + hit.which + ' ' + hit.amount + (hit.stopped ? ' stopped' : '');
    }
    return 'none';
  },
});

function livingIn(cityId: string, seed: number): Simulation {
  return quickSave({ startLocationId: cityId, homeRegionId: cityId, livesWhereBorn: true }, `fraud-${seed}`);
}

// ---------------------------------------------------------------------------
// Drama school
// ---------------------------------------------------------------------------

/** A life begun at drama school, born in New York, under a seed. */
function atYale(seed: number): Simulation {
  return quickSave({ ...newLifeConfig(), homeRegionId: 'us-ny-newyork' }, `yale-${seed}`);
}

defineDecider<{ sim: Simulation; born: string }, string>({
  id: 'documents.start',
  decides: 'The papers a life begins with: a US citizen’s passport and birth state’s license at the shares that hold them, and when each was issued (STARTING).',
  drawnIn: 'src/engine/systems/documents.ts',
  reads: {
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), born: 'us-ny-newyork' }),
  decide: ({ sim }) => { delete sim.player.documents; startingDocuments(sim, sim.player); return ((sim.player.documents as { kind: string; issuedAt?: number }[] | undefined) ?? []).map((d) => `${d.kind}@${Math.round((d.issuedAt ?? 0) / 86_400_000)}`).join(' ') || 'none'; },
});

/** Every driving test on a path, with its jurisdiction. */
const TESTS = Object.entries(LICENSE_PATHS).flatMap(([j, p]) => p.steps.filter((x) => x.kind === 'test').map((x) => [j, x] as const));

defineDecider<{ sim: Simulation; test: number; attempt: number }, string>({
  id: 'documents.test',
  decides: 'Whether an attempt at a driving test passes, at the rate its authority publishes or SLATE’s mean of those published (PASS_RATES).',
  drawnIn: 'src/engine/systems/licensing.ts',
  reads: {
    // Which test: each has its own rate and draw.
    test: (o, t) => ({ ...o, test: Math.round(t * (TESTS.length - 1)) }),
    // Each attempt is drawn on its own.
    attempt: (o, t) => ({ ...o, attempt: 1 + Math.round(t * 5) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), test: seed % TESTS.length, attempt: 1 + (seed % 3) }),
  decide: ({ sim, test, attempt }) => { const [j, step] = TESTS[test]!; return passesTest(sim, sim.player, j, step, attempt) ? 'passed' : 'failed'; },
});

defineDecider<{ sim: Simulation; km: number }, string>({
  id: 'driving.ticket',
  decides: 'A speeding ticket from a stretch of driving, or none, at the place’s published tickets a driver a year spread over its miles (TICKETS).',
  drawnIn: 'src/engine/systems/driving.ts',
  reads: {
    km: (o, t) => ({ ...o, km: Math.round(t * 400_000) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), km: 200_000 + seed * 997 }),
  decide: ({ sim, km }) => { const r = drive(sim, sim.player, 'US-NY', km, sim.now, `d-${km}`); return r.ticket ? 'a ticket' : 'none'; },
});

defineDecider<{ sim: Simulation; day: number }, string>({
  id: 'utilities.outage',
  decides: 'A day with a power cut at home or not, at the distributor’s interruptions a customer a year (RELIABILITY), and its length around their mean; swept in Dublin, the likeliest of the towns.',
  drawnIn: 'src/engine/systems/utilities.ts',
  reads: {
    day: (o, t) => ({ ...o, day: Math.round(t * 4000) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), day: seed }),
  decide: ({ sim, day }) => {
    sim.player.home = { ...sim.player.home!, cityId: 'ie-lei-dublin' };
    let cuts = 0;
    for (let d = 0; d < 400; d += 1) if (powerDay(sim, sim.player, sim.now + (day * 400 + d) * 86_400_000) !== undefined) cuts += 1;
    return cuts > 1 ? 'cuts' : 'few';
  },
});

defineDecider<{ sim: Simulation; work: number }, string>({
  id: 'awards.vote',
  decides: 'A performance entered for an award nominated or not, at the category’s slots over its submissions weighed by how far the actor stood above the part (awardChances), and a nominee’s win; swept at even odds, the real ones being small.',
  drawnIn: 'src/engine/systems/awards.ts',
  reads: {
    // Each piece of work is drawn on its own.
    work: (o, t) => ({ ...o, work: Math.round(t * 400) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), work: seed }),
  decide: ({ sim, work }) => {
    sim.player.craft ??= evenCraft(70);
    const career = careerOf(sim.player);
    const id = `work-${work}`;
    career.bookings.push({ id, roleId: 'guest-hour', cityId: 'us-ny-newyork', starts: sim.now, units: 1, rehearsalWeeks: 0, status: 'worked', dueAt: sim.now, offeredAt: sim.now, worked: 1, owed: 0 });
    entriesOf(sim.player).push({ bookingId: id, body: 'emmys', year: 2027, category: 'guest-drama', entered: sim.now, byThem: true });
    return announceNominations(sim, sim.player, 'emmys', 2027, 0.5) > 0 ? 'nominated' : 'not';
  },
});

defineDecider<{ sim: Simulation; drive: number }, string>({
  id: 'alcohol.arrest',
  decides: 'A drive over the jurisdiction’s line ending in an arrest or not, at the CDC’s arrests per self-reported impaired drive (ARREST_PER_DRIVE); swept at even odds, the real ones being too small to see.',
  drawnIn: 'src/engine/systems/alcohol.ts',
  reads: {
    // Each drive is drawn on its own.
    drive: (o, t) => ({ ...o, drive: Math.round(t * 400) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), drive: seed }),
  decide: ({ sim, drive }) => {
    sim.player.alcohol = { bac: 0.1, at: sim.now, peak: 0.1, peakAt: sim.now };
    return impairedDrive(sim, sim.player, 'US-NY', sim.now, `drive-${drive}`, 0.5) ? 'arrested' : 'not';
  },
});

defineDecider<{ sim: Simulation; km: number }, string>({
  id: 'driving.rider_death',
  decides: 'A month on a motorcycle ending the life or not, at the rider’s death rate above a car occupant’s a kilometer (RIDER_DEATH); swept at even odds, the real ones being too small to see.',
  drawnIn: 'src/engine/systems/driving.ts',
  reads: {
    km: (o, t) => ({ ...o, km: Math.round(t * 400_000) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), km: 200_000 + seed * 997 }),
  decide: ({ sim, km }) => (riderDeath(sim, sim.player, 'US-NY', km, sim.now, `r-${km}`, 0.5) ? 'died' : 'rode on'),
});

defineDecider<{ sim: Simulation; train: number }, string>({
  id: 'travel.train',
  decides: 'A train on time, or late and by how much, at its operator’s own rate on its own measure of late (RAIL_ROUTES).',
  drawnIn: 'src/engine/systems/rail.ts',
  reads: {
    // Each train is drawn on its own.
    train: (o, t) => ({ ...o, train: Math.round(t * 400) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), train: seed }),
  decide: ({ sim, train }) => { const m = trainFate(sim, sim.player, RAIL_ROUTES[0]!, `r-${train}`); return m === 0 ? 'on time' : m > 30 ? 'late half an hour' : 'late'; },
});

defineDecider<{ sim: Simulation; flight: number }, string>({
  id: 'travel.delay',
  decides: 'Whether a flight is on time, late and by how much, or canceled, at the rates of BTS’s every domestic flight of 2025 (AIR).',
  drawnIn: 'src/engine/systems/journey.ts',
  reads: {
    // Each flight is drawn on its own.
    flight: (o, t) => ({ ...o, flight: Math.round(t * 400) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), flight: seed }),
  decide: ({ sim, flight }) => { const f = flightFate(sim, sim.player, `j-${flight}`); return f === null ? 'canceled' : f === 0 ? 'on time' : f > 60 ? 'late an hour' : 'late'; },
});

defineDecider<{ sim: Simulation; bag: number; international: boolean }, string>({
  id: 'travel.bags',
  decides: 'Whether a checked bag comes off the carousel, or is delayed, damaged or lost, at the DOT’s 2025 rate, an international flight’s raised by SITA’s ratio, and SITA’s 2024 split (BAGGAGE).',
  drawnIn: 'src/engine/systems/baggage.ts',
  reads: {
    // Each bag on each flight is drawn on its own.
    bag: (o, t) => ({ ...o, bag: Math.round(t * 4000) }),
    international: (o, t) => ({ ...o, international: t > 0.5 }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), bag: seed, international: seed % 2 === 0 }),
  // A bag in two hundred is mishandled, so one bag's fate barely moves: the count among five hundred checked from it does.
  decide: ({ sim, bag, international }) => { let n = 0; for (let i = 0; i < 500; i += 1) if (bagFate(sim, sim.player, `b-${bag}-${i}`, international).kind !== 'ok') n += 1; return `${n} of 500 mishandled`; },
});

defineDecider<{ sim: Simulation; flight: number }, string>({
  id: 'travel.compensation',
  decides: 'A long delay within the airline’s control or not, at EUROCONTROL’s and BTS’s published shares (COMPENSATION).',
  drawnIn: 'src/engine/systems/compensation.ts',
  reads: {
    // Each flight is weighed on its own.
    flight: (o, t) => ({ ...o, flight: Math.round(t * 400) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), flight: seed }),
  decide: ({ sim, flight }) => (airlineAtFault(sim, sim.player, 'eu261', `c-${flight}`) ? 'the airline’s' : 'not the airline’s'),
});

defineDecider<{ sim: Simulation; car: number }, string>({
  id: 'vehicle.theft',
  decides: 'A vehicle stolen in a month or not, and if so found again, at each place’s published thefts and recoveries (THEFT); swept at even odds, the real ones being too small to see.',
  drawnIn: 'src/engine/systems/theft.ts',
  reads: {
    // Each car is drawn on its own.
    car: (o, t) => ({ ...o, car: Math.round(t * 400) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), car: seed }),
  decide: ({ sim, car }) => {
    const v = { id: `car-${car}`, modelId: 'us-toyota-camry', jurisdiction: 'US-NY', cityId: 'us-ny-newyork', coverage: 'liability', boughtAt: sim.now, ageAtPurchase: 0, listPrice: 0, registrationDue: 0 } as OwnedVehicle;
    const stolen = mayBeStolen(sim, sim.player, v, modelById(v.modelId)!, 0, 'USD', { stolen: 0.5 });
    return !stolen ? 'kept' : v.stolen?.recoverAt !== undefined ? 'stolen, found' : 'stolen';
  },
});

defineDecider<{ sim: Simulation; car: number }, string>({
  id: 'vehicle.fault',
  decides: 'A month driven needing an unscheduled repair or not, at RepairPal’s visits a year for the model (RELIABILITY), and if so severe at its share; swept at even odds, the real ones being small.',
  drawnIn: 'src/engine/systems/repairs.ts',
  reads: {
    // Each car is drawn on its own.
    car: (o, t) => ({ ...o, car: Math.round(t * 400) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), car: seed }),
  decide: ({ sim, car }) => {
    const v = { id: `car-${car}`, modelId: 'us-toyota-camry', jurisdiction: 'US-NY', cityId: 'us-ny-newyork', coverage: 'liability', boughtAt: sim.now, ageAtPurchase: 0, listPrice: 0, registrationDue: 0 } as OwnedVehicle;
    return !mayBreak(sim, sim.player, v, modelById(v.modelId)!, sim.now, 0.5) ? 'goes' : v.fault!.severe ? 'severe' : 'light';
  },
});

defineDecider<{ sim: Simulation; car: number }, string>({
  id: 'vehicle.roadfault',
  decides: 'A driven journey’s own kilometers bringing an unscheduled repair or not, at RepairPal’s visits a year over the kilometers a year a car is driven, severe at its share, and where on the road; swept at even odds.',
  drawnIn: 'src/engine/systems/roadside.ts',
  reads: {
    car: (o, t) => ({ ...o, car: Math.round(t * 400) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), car: seed }),
  decide: ({ sim, car }) => {
    const v = { id: `car-${car}`, modelId: 'us-toyota-camry', jurisdiction: 'US-NY', cityId: 'us-ny-newyork', coverage: 'liability', boughtAt: sim.now, ageAtPurchase: 0, listPrice: 0, registrationDue: 0 } as OwnedVehicle;
    const j = { id: `j-${car}`, fromCity: 'us-ny-newyork', toCity: 'us-ct-newhaven', leaveAt: sim.now, arriveAt: sim.now + 7_200_000 } as Journey;
    return !onTheRoad(sim, sim.player, v, j, 130, 0.5) ? 'goes' : v.fault!.severe ? 'severe, towed' : 'light';
  },
});

defineDecider<{ sim: Simulation }, string>({
  id: 'home.appliance_fault',
  decides: 'A home machine breaking on a day, the washer, the dishwasher or the fridge, at the yearly rates Consumer Reports and Which? put a period on (FAULTS_A_YEAR); swept at even odds.',
  drawnIn: 'src/engine/systems/appliancefaults.ts',
  reads: {
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed) }),
  decide: ({ sim }) => {
    const broke = machinesDay(sim, sim.player, 0.5);
    return broke.length === 0 ? 'none' : broke.sort().join(', ');
  },
});

defineDecider<{ sim: Simulation; parcel: number }, string>({
  id: 'orders.porch',
  decides: 'A parcel delivered to a home taken from the door, at the market’s parcels stolen over parcels delivered (PARCEL_THEFT); swept at even odds.',
  drawnIn: 'src/engine/systems/orders.ts',
  reads: {
    parcel: (o, t) => ({ ...o, parcel: Math.round(t * 400) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), parcel: seed }),
  decide: ({ sim, parcel }) => (takenFromDoor(sim, sim.player, `o${parcel}`, 0.5) ? 'taken' : 'left'),
});

defineDecider<{ sim: Simulation; day: number; minute: number }, string>({
  id: 'rooms.shower',
  decides: 'When each flatmate in a flat-share showers in the morning, a minute drawn from 6:30 to 8:30 (MORNING), and so whether a shower then waits for the bathroom; a flat of three.',
  drawnIn: 'src/engine/systems/rooms.ts',
  reads: {
    day: (o, t) => ({ ...o, day: Math.round(t * 60) }),
    minute: (o, t) => ({ ...o, minute: Math.round(t * 120) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), day: seed % 60, minute: seed % 120 }),
  decide: ({ sim, day, minute }) => {
    const home = sim.player.home!;
    sim.player.home = { ...home, kind: 'shared', unit: { ...(home.unit ?? { type: 'condo', size: 900, fixtures: { bathtub: false, dishwasher: false, laundry: 'none', cooling: 'none', outdoor: 'none', gym: 'none' } }), beds: 3, shared: true } };
    sim.player.currentLocationId = home.cityId;
    const zone = CITIES.require(home.cityId).timeZone;
    const midnight = startOfDay(sim.now + day * MS_DAY, zone);
    return bathroomWait(sim, sim.player, midnight + (6.5 * 60 + minute) * 60_000, 10) > 0 ? 'waits' : 'free';
  },
});

defineDecider<{ sim: Simulation; home: number; country: number }, string>({
  id: 'homes.water_heater',
  decides: 'The fuel that heats a home\'s water, at its country\'s published share: America\'s EIA RECS 2020, Canada\'s NRCan, Britain\'s electric showers (HEATER_SHARE).',
  drawnIn: 'src/engine/systems/hotwater.ts',
  reads: {
    home: (o, t) => ({ ...o, home: Math.round(t * 40) }),
    country: (o, t) => ({ ...o, country: Math.round(t * 2) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), home: seed % 40, country: seed % 3 }),
  decide: ({ sim, home, country }) => {
    const cityId = ['us-ny-newyork', 'ca-on-toronto', 'uk-eng-london'][country]!;
    sim.player.home = { ...sim.player.home!, cityId, since: home * MS_DAY };
    return waterHeaterOf(sim, sim.player) ?? 'none';
  },
});

defineDecider<{ sim: Simulation; hour: number }, string>({
  id: 'home.internet_outage',
  decides: 'Whether the internet at home is down in an hour, at its offer’s published outage hours a year, ComReg’s 16 for fiber (OUTAGE_HOURS); swept at even odds.',
  drawnIn: 'src/engine/systems/telecom.ts',
  reads: {
    hour: (o, t) => ({ ...o, hour: Math.round(t * 400) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), hour: seed }),
  decide: ({ sim, hour }) => (internetDown(sim, sim.player, hour * MS_HOUR, 0.5) ? 'down' : 'up'),
});

defineDecider<{ sim: Simulation; claim: number }, string>({
  id: 'health.denial',
  decides: 'A marketplace plan’s claim denied, at KFF’s 20% of in-network claims (DENIALS.rate).',
  drawnIn: 'src/engine/systems/health.ts',
  reads: {
    claim: (o, t) => ({ ...o, claim: Math.round(t * 400) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), claim: seed }),
  decide: ({ sim, claim }) => (sim.rng('health.denial', sim.player.id, `m${claim}`).next() < DENIALS.rate ? 'denied' : 'paid'),
});

defineDecider<{ sim: Simulation; bill: number }, string>({
  id: 'health.appeal',
  decides: 'An appeal of a denied claim upheld by the insurer, at KFF’s 56% of appeals (DENIALS.upheld), or overturned.',
  drawnIn: 'src/engine/systems/health.ts',
  reads: {
    bill: (o, t) => ({ ...o, bill: Math.round(t * 400) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), bill: seed }),
  decide: ({ sim, bill }) => (sim.rng('health.appeal', sim.player.id, `m${bill}`).next() < DENIALS.upheld ? 'upheld' : 'overturned'),
});

defineDecider<{ sim: Simulation; visit: number }, string>({
  id: 'health.referral',
  decides: 'A doctor’s visit kept ending in a referral to a specialist or not, at the place’s share of visits referred (REFERRAL_SHARE); swept at even odds.',
  drawnIn: 'src/engine/systems/appointments.ts',
  reads: {
    visit: (o, t) => ({ ...o, visit: Math.round(t * 400) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), visit: seed }),
  decide: ({ sim, visit }) => (mayRefer(sim, sim.player, { id: `v${visit}`, at: sim.now, what: 'A checkup' }, 0.5) ? 'referred' : 'not'),
});

defineDecider<{ sim: Simulation; who: number }, string>({
  id: 'social.availability',
  decides: 'Whether a person you know has a job, by day or not, at their country’s employment rate for their age, and whether they work on a given day, at ATUS’s 81% of weekdays and 30% of weekend days (EMPLOYED, WORKS_ON); the real ones, as most work.',
  drawnIn: 'src/engine/systems/availability.ts',
  reads: {
    who: (o, t) => ({ ...o, who: Math.round(t * 400) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), who: seed }),
  decide: ({ sim, who }) => {
    const c = { id: `c${who}`, name: 'A Friend', cityId: 'us-ny-newyork', born: sim.now - 35 * 365.2425 * 86_400_000 } as Contact;
    const w = works(sim, c, sim.now);
    return !w.employed ? 'not working' : !w.daytime ? 'works other hours' : atWork(sim, c, sim.now - (sim.now % 86_400_000) + 15 * 3_600_000, 60) ? 'at work' : 'off today';
  },
});

defineDecider<{ sim: Simulation; who: number; day: number }, string>({
  id: 'social.asks',
  decides: 'Whether a friend asks you to a meal on a given day, at about one a fortnight from a close friend, one a month from a friend and one in ten weeks from a casual one (ASKS, SLATE’s estimates by Pew’s 29%), and where and when they ask you to; swept at even odds.',
  drawnIn: 'src/engine/systems/reachingout.ts',
  reads: {
    who: (o, t) => ({ ...o, who: Math.round(t * 400) }),
    day: (o, t) => ({ ...o, day: Math.round(t * 400) }),
  },
  sample: (seed) => ({ sim: atYale(seed), who: seed, day: seed }),
  decide: ({ sim, who, day }) => (asksToday(sim, { id: `c${who}` } as Contact, `d${day}`, 0.5) ? 'asks' : 'not'),
});

defineDecider<{ sim: Simulation; attempt: number }, string>({
  id: 'pilot.tests',
  decides: 'A private pilot’s knowledge test and checkride, passed or failed at the FAA’s 89.56% for the test and the secondary 75.1% for the checkride (PILOT_PASS); swept at even odds.',
  drawnIn: 'src/engine/systems/aviation.ts',
  reads: {
    attempt: (o, t) => ({ ...o, attempt: Math.round(t * 400) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), attempt: seed }),
  decide: ({ sim, attempt }) => `${passesPilotTest(sim, sim.player, 'knowledge', attempt, 0.5) ? 'test passed' : 'test failed'}, ${passesPilotTest(sim, sim.player, 'checkride', attempt, 0.5) ? 'checkride passed' : 'checkride failed'}`,
});

defineDecider<{ sim: Simulation; booking: number }, string>({
  id: 'career.counter',
  decides: 'Whether a production meets an actor’s ask for more on an offer, at the 85% a 2025 field study of job offers measured; swept at even odds.',
  drawnIn: 'src/engine/systems/career.ts',
  reads: {
    booking: (o, t) => ({ ...o, booking: Math.round(t * 400) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), booking: seed }),
  decide: ({ sim, booking }) => {
    const b = { id: `b${booking}`, roleId: 'film-weekly', status: 'offered', starts: Date.UTC(2027, 0, 4), cityId: 'us-ny-newyork' } as never;
    const r = counterOffer(sim, sim.player, b, 0.5);
    return typeof r === 'string' ? r : r.met ? 'met' : 'stands';
  },
});

defineDecider<{ sim: Simulation; key: number; age: number }, string>({
  id: 'family.parent',
  decides: 'When a parent dies, by the life table for their country, and whether and when from 65 they need care, at the ACL’s 70% and its years, at home or in a facility.',
  drawnIn: 'src/engine/systems/parents.ts',
  reads: {
    key: (o, t) => ({ ...o, key: Math.round(t * 400) }),
    age: (o, t) => ({ ...o, age: 20 + Math.round(t * 60) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), key: seed, age: 30 + (seed % 40) }),
  decide: ({ sim, key, age }) => {
    const born = Date.UTC(2026, 0, 1) - age * 365.2425 * 86_400_000;
    const dies = deathOf(sim, `p${key}`, born, 'us', Date.UTC(2026, 0, 1));
    const care = careOf(sim, `p${key}`, 'mother', born, dies);
    return `${Math.round((dies - born) / (365.2425 * 86_400_000))}${care ? `-${care.kind}` : ''}`;
  },
});

defineDecider<{ sim: Simulation; at: number }, string>({
  id: 'social.adopt',
  decides: 'The months until an agency matches a newborn with an adopter, each at the chance America’s 63% within a year gives; and an adopted child’s name.',
  drawnIn: 'src/engine/systems/adoption.ts',
  reads: {
    at: (o, t) => ({ ...o, at: Math.round(t * 1_000) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), at: seed * 13 }),
  decide: ({ sim, at }) => String(monthsToMatch(sim, sim.player, 0.63, at)),
});

defineDecider<{ sim: Simulation; build: number; stage: number }, string>({
  id: 'build.inspection',
  decides: 'How many times a house’s inspection fails before it passes, each visit at the odds Los Angeles’s own records give its kind (INSPECTION_FAILS).',
  drawnIn: 'src/engine/systems/construction.ts',
  reads: {
    build: (o, t) => ({ ...o, build: Math.round(t * 400) }),
    stage: (o, t) => ({ ...o, stage: [1, 2, 4, 6][Math.min(3, Math.floor(t * 4))]! }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), build: seed, stage: [1, 2, 4, 6][seed % 4]! }),
  decide: ({ sim, build, stage }) => String(buildInspectionFails(sim, `b${build}`, 'nyc', stage)),
});

defineDecider<{ sim: Simulation; age: number; month: number }, string>({
  id: 'vehicle.used',
  decides: 'Whether a used car on offer has a fault, at the AA’s seven in ten, and whether it is severe at RepairPal’s share for the model.',
  drawnIn: 'src/engine/systems/usedcars.ts',
  reads: {
    age: (o, t) => ({ ...o, age: 1 + Math.round(t * 14) }),
    month: (o, t) => ({ ...o, month: Math.round(t * 11) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), age: 1 + (seed % 14), month: seed % 12 }),
  decide: ({ sim, age, month }) => { const f = usedFault(sim, sim.player, 'us-toyota-camry', age, 'us-ny-newyork', Date.UTC(2027, month, 15)); return f ? (f.severe ? 'severe' : 'fault') : 'sound'; },
});

defineDecider<{ sim: Simulation; model: number; month: number }, string>({
  id: 'vehicle.listing',
  decides: 'This month’s three used cars on offer of a model: each one’s age, its odometer from the market’s own mileage (the DfT’s bands in England), and a dealer or a private seller, evenly.',
  drawnIn: 'src/engine/systems/usedcars.ts',
  reads: {
    model: (o, t) => ({ ...o, model: Math.round(t * 2) }),
    month: (o, t) => ({ ...o, month: Math.round(t * 11) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), model: seed % 3, month: seed % 12 }),
  decide: ({ sim, model, month }) => usedListings(sim, sim.player, ['gb-ford-puma', 'gb-kia-sportage', 'gb-nissan-qashqai'][model]!, 'uk-eng-london', 'GB', Date.UTC(2027, month, 15)).map((l) => `${l.age}:${Math.round(l.odometerKm / 20_000)}:${l.seller}`).join(' '),
});

defineDecider<{ sim: Simulation; model: number; year: number }, string>({
  id: 'vehicle.modelyear',
  decides: 'Which of a model year’s configurations the EPA rated a used car on offer is (from 2026-10-05): one of the year’s, evenly.',
  drawnIn: 'src/engine/systems/modelyears.ts',
  reads: {
    model: (o, t) => ({ ...o, model: Math.round(t * 2) }),
    year: (o, t) => ({ ...o, year: 2016 + Math.round(t * 9) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), model: seed % 3, year: 2016 + (seed % 10) }),
  decide: ({ sim, model, year }) => { const b = drawBuild(sim, sim.player, ['us-toyota-camry', 'us-ford-f-series', 'us-honda-cr-v'][model]!, year, 'decider'); return b ? `${b.liters}:${b.transmission}:${b.drive}` : 'none'; },
});

defineDecider<{ sim: Simulation; km: number; odo: number }, number>({
  id: 'vehicle.treadlife',
  decides: 'How far a set of tires really lasts (from 2026-10-05): between 85% and 115% of its warranted or typical km, evenly, SLATE\u2019s assumption.',
  drawnIn: 'src/engine/systems/tires.ts',
  reads: {
    km: (o, t) => ({ ...o, km: 60_000 + Math.round(t * 60_000) }),
    odo: (o, t) => ({ ...o, odo: Math.round(t * 100_000) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), km: 80_000 + (seed % 5) * 10_000, odo: (seed % 7) * 10_000 }),
  decide: ({ sim, km, odo }) => treadLife(sim, sim.player, { id: 'v-decider', ageAtPurchase: 0, jurisdiction: 'US-NY', odometerAtPurchase: odo } as never, km),
});

defineDecider<{ sim: Simulation; job: number; days: number }, string>({
  id: 'works.risk',
  decides: 'A home project’s three bids within Checkbook’s measured spread, whether it runs late (48% in America, 24% in the UK) and by how much, and whether it comes in over the bid (43%, 55%) and by how much.',
  drawnIn: 'src/engine/systems/worksrisk.ts',
  reads: {
    job: (o, t) => ({ ...o, job: Math.round(t * 400) }),
    days: (o, t) => ({ ...o, days: 1 + Math.round(t * 90) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), job: seed, days: 1 + (seed % 90) }),
  decide: ({ sim, job, days }) => `${bidsFor(sim, `j${job}`, 10_000_00, '2027-01').join('/')} ${lateDays(sim, `j${job}`, 'us-ny-newyork', days)} ${overrunOf(sim, `j${job}`, 'us-ny-newyork', 10_000_00)}`,
});

defineDecider<{ sim: Simulation; build: number; month: number }, string>({
  id: 'build.weather',
  decides: 'The extra days a wetter stretch than usual adds to an outdoor stage of a house being built, drawn around NOAA’s mean wet days for its months (WET_DAYS).',
  drawnIn: 'src/engine/systems/construction.ts',
  reads: {
    build: (o, t) => ({ ...o, build: Math.round(t * 400) }),
    month: (o, t) => ({ ...o, month: Math.round(t * 11) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), build: seed, month: seed % 12 }),
  decide: ({ sim, build, month }) => String(weatherDelay(sim, `b${build}`, 'us-ny-newyork', 2, 60, Date.UTC(2027, month, 1))),
});

defineDecider<{ sim: Simulation; car: number }, string>({
  id: 'vehicle.collision',
  decides: 'A month driven with a collision or not, at America’s 4.16 collision claims a year in 100 insured cars (COLLISION), and whether it writes the car off; swept at even odds, the real ones being small.',
  drawnIn: 'src/engine/systems/carcare.ts',
  reads: {
    car: (o, t) => ({ ...o, car: Math.round(t * 400) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), car: seed }),
  decide: ({ sim, car }) => {
    const v = { id: `car-${car}`, modelId: 'us-toyota-camry', jurisdiction: 'US-NY', cityId: 'us-ny-newyork', coverage: 'full', boughtAt: sim.now, ageAtPurchase: 0, listPrice: 0, registrationDue: 0 } as OwnedVehicle;
    return !mayCollide(sim, sim.player, v, modelById(v.modelId)!, 20_000_00, sim.now, 0.5) ? 'none' : v.soldAt !== undefined ? 'written off' : 'damaged';
  },
});

defineDecider<{ sim: Simulation; car: number }, string>({
  id: 'vehicle.tint',
  decides: 'A month driven with tint darker than the law allows ticketed or not, at New York’s tint tickets per registered car (TINT_TICKETS_A_YEAR); swept at even odds, the real ones being too small to see.',
  drawnIn: 'src/engine/systems/tint.ts',
  reads: {
    // Each car is drawn on its own.
    car: (o, t) => ({ ...o, car: Math.round(t * 400) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), car: seed }),
  decide: ({ sim, car }) => {
    const v = { id: `car-${car}`, modelId: 'us-toyota-camry', jurisdiction: 'US-NY', cityId: 'us-ny-newyork', coverage: 'liability', boughtAt: sim.now, ageAtPurchase: 0, listPrice: 0, registrationDue: 0, tint: 'full' } as OwnedVehicle;
    return tintOnTheRoad(sim, sim.player, v, sim.now, 0.5) ? 'ticketed' : 'not';
  },
});

defineDecider<{ sim: Simulation }, string>({
  id: 'attributes.presence',
  decides: 'The presence a student is given: 55 to 80, most near the middle, for the faculty’s first choice.',
  drawnIn: 'src/engine/systems/attributes.ts',
  reads: {
    // Two saves are two people.
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20) + 100) }),
  },
  sample: (seed) => ({ sim: atYale(seed) }),
  decide: ({ sim }) => {
    delete sim.player.attrs;
    return attributesOf(sim, sim.player).presence.toFixed(1);
  },
});

defineDecider<{ sim: Simulation; job: number }, string>({
  id: 'social.person',
  decides: 'Who a castmate met at work is: a name of their country, an age within five years of the actor’s, the dearest kind of place they’d eat at, whether they’re free to be asked out (Pew’s 38%) and whether they’d want to be.',
  drawnIn: 'src/engine/systems/people.ts',
  reads: {
    // Each job's castmate is drawn on its own.
    job: (o, t) => ({ ...o, job: Math.round(t * 400) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), job: seed }),
  decide: ({ sim, job }) => metAtWork(sim, sim.player, 'us-ny-newyork', `job-${job}`, 'A Job').spends,
});

defineDecider<{ sim: Simulation; year: number }, string>({
  id: 'social.divorce',
  decides: 'A marriage’s year ending in your partner asking for a divorce or not, at the place’s published rate for the marriage’s length (divorceRate); swept at even odds, the real ones being small.',
  drawnIn: 'src/engine/systems/marriage.ts',
  reads: {
    year: (o, t) => ({ ...o, year: 1 + Math.round(t * 30) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), year: 1 + (seed % 30) }),
  decide: ({ sim, year }) => {
    sim.player.marriage = { contactId: 'c', at: sim.now, worthAt: 0 };
    return mayDivorce(sim, sim.player, year, 0.5) ? 'asked' : 'stays';
  },
});

defineDecider<{ sim: Simulation; month: number }, string>({
  id: 'social.conceive',
  decides: 'A month trying for a child conceiving or not, at PRESTO’s chance for the carrier’s age (conceptionChance), a birth by caesarean or not, and the child’s name; swept at even odds.',
  drawnIn: 'src/engine/systems/children.ts',
  reads: {
    month: (o, t) => ({ ...o, month: Math.round(t * 400) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), month: seed }),
  decide: ({ sim, month }) => {
    const c = metAtWork(sim, sim.player, sim.player.currentLocationId, `k-${month}`, 'A Job');
    c.carries = true;
    c.livesWith = sim.now;
    c.dating = { since: sim.now, dates: 9, couple: sim.now };
    sim.player.home = { ...sim.player.home!, cityId: sim.player.currentLocationId };
    sim.player.trying = true;
    return mayConceive(sim, sim.player, sim.now + month * 86_400_000, 0.5) ? 'conceived' : 'not';
  },
});

defineDecider<{ sim: Simulation }, string>({
  id: 'school.class',
  decides: 'Who the fifteen classmates are, actor or actress, the craft and drive each brings from the auditions, and the player’s craft among them.',
  drawnIn: 'src/engine/systems/school.ts',
  reads: {
    // Two saves are two admitted classes.
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed) }),
  decide: ({ sim }) => {
    const { classmates, player } = admittedClass(sim, sim.player);
    return classmates.map((m) => `${m.name} ${meanCraft(m.craft).toFixed(1)}`).join(', ') + ` / ${meanCraft(player).toFixed(1)}`;
  },
});

defineDecider<{ sim: Simulation; day: number }, string>({
  id: 'school.attendance',
  decides: 'Which classmates are in class on a day, and so grow from it.',
  drawnIn: 'src/engine/systems/school.ts',
  reads: {
    // The day: each is drawn on its own.
    day: (o, t) => ({ ...o, day: Math.round(t * 60) }),
    // Two saves are two classes.
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), day: seed % 60 }),
  // A fortnight of class days from the one read, so an absence shows.
  decide: ({ sim, day }) => Array.from({ length: 14 }, (_, n) => classmatesIn(sim, sim.player, `day-${day + n}`).map((x) => (x ? '1' : '0')).join('')).join(' '),
});

defineDecider<{ sim: Simulation; level: number; ready: number }, string>({
  id: 'school.night',
  decides: 'How a night on stage goes: off, solid, strong or remarkable, by readiness, the part on the craft, and the night’s luck.',
  drawnIn: 'src/engine/systems/school.ts',
  reads: {
    // The part on their craft.
    craft: (o, t) => ({ ...o, level: 40 + t * 50 }),
    // How ready they came.
    ready: (o, t) => ({ ...o, ready: 0.3 + t * 0.9 }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), level: 50 + (seed % 30), ready: 0.6 + (seed % 5) / 10 }),
  decide: ({ sim, level, ready }) => Array.from({ length: 60 }, (_, n) => nightOf(sim, sim.player, `d${n}`, level, ready)[0]).join(''),
});

defineDecider<{ sim: Simulation; night: number }, string>({
  id: 'school.understudy',
  decides: 'On which performances an understudy on call is sent on.',
  drawnIn: 'src/engine/systems/school.ts',
  reads: {
    // Which run of nights.
    night: (o, t) => ({ ...o, night: Math.round(t * 400) }),
    // Two saves are two runs of luck.
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), night: seed * 7 }),
  // Two hundred nights, so the rare night on shows.
  decide: ({ sim, night }) => Array.from({ length: 200 }, (_, n) => (goesOn(sim, sim.player, sim.now + (night + n) * MS_DAY) ? String(night + n) : '')).filter(Boolean).join(',') || 'none',
});

// ---------------------------------------------------------------------------
// The business
// ---------------------------------------------------------------------------

defineDecider<{ sim: Simulation; score: number }, string>({
  id: 'career.offers',
  decides: 'Which agencies offer to represent an actor after a showing.',
  drawnIn: 'src/engine/systems/career.ts',
  reads: {
    // The showing: the higher, the more agencies' bars it clears.
    score: (o, t) => ({ ...o, score: 55 + t * 30 }),
    // Two saves are two sets of agents in the room.
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), score: 60 + (seed % 25) }),
  decide: ({ sim, score }) => offersFor(sim, sim.player, score, 'us-ny-newyork').join(',') || 'none',
});

defineDecider<{ sim: Simulation; tier: 0 | 1 | 2 | 3; week: number; managed?: boolean }, string>({
  id: 'career.auditions',
  decides: 'How many auditions a week brings, for which parts, when, and whether on tape.',
  drawnIn: 'src/engine/systems/career.ts',
  reads: {
    // The agency's reach: none, or the smallest to the biggest.
    agency: (o, t) => ({ ...o, tier: Math.min(3, Math.floor(t * 4)) as 0 | 1 | 2 | 3 }),
    // The week: each is drawn on its own.
    week: (o, t) => ({ ...o, week: Math.round(t * 52) }),
    // A manager's relationships add their own.
    manager: (o, t) => ({ ...o, managed: t >= 0.5 }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), tier: (seed % 4) as 0 | 1 | 2 | 3, week: seed % 52 }),
  decide: ({ sim, tier, week, managed }) => {
    const agency = tier === 0 ? undefined : AGENCIES.find((a) => a.tier === tier);
    return weekOfAuditions(sim, sim.player, sim.now + week * 7 * MS_DAY, agency, 'us-ny-newyork', 5, managed ?? false)
      .map((a) => `${a.roleId}@${a.at}/${a.mode}`).join(' ') || 'none';
  },
});

defineDecider<{ sim: Simulation; week: number; n: number }, string>({
  id: 'career.age',
  decides: 'Whether a part drawn for an actor past sixty is one written for their age, at its kind’s share (AGE_ON_SCREEN).',
  drawnIn: 'src/engine/systems/career.ts',
  reads: {
    // The week: each is drawn on its own.
    week: (o, t) => ({ ...o, week: Math.round(t * 52) }),
    // The part's place in the week.
    part: (o, t) => ({ ...o, n: Math.round(t * 6) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), week: seed % 52, n: seed % 6 }),
  decide: ({ sim, week, n }) => (keepsPart(sim, sim.player, sim.now + week * 7 * MS_DAY, n, 0.45) ? 'kept' : 'passed over'),
});

defineDecider<{ sim: Simulation; roleId: string; level: number }, string>({
  id: 'career.booking',
  decides: 'Which auditions book, weighed on the actor’s craft against the part, and the genre a part’s breakdown gives.',
  drawnIn: 'src/engine/systems/career.ts',
  reads: {
    // The part: its bar.
    role: (o, t) => ({ ...o, roleId: ROLES[Math.min(ROLES.length - 1, Math.floor(t * ROLES.length))]!.id }),
    // The actor's craft.
    craft: (o, t) => ({ ...o, level: 40 + t * 60 }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), roleId: ROLES[seed % ROLES.length]!.id, level: 50 + (seed % 40) }),
  decide: ({ sim, roleId, level }) => {
    const person = sim.player;
    person.craft = evenCraft(level);
    return Array.from({ length: 300 }, (_, n) => books(sim, person, { id: `d${n}`, roleId, at: 0, mode: 'room', cityId: 'us-ny-newyork', status: 'ahead' }, 1) ? '1' : '0').join('');
  },
});

defineDecider<{ sim: Simulation; key: number }, string>({
  id: 'career.selection',
  decides: 'Where a finished independent film goes: Tribeca, the Brooklyn Film Festival, or straight to streaming.',
  drawnIn: 'src/engine/systems/career.ts',
  reads: {
    // Which film.
    key: (o, t) => ({ ...o, key: Math.round(t * 1000) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), key: seed * 11 }),
  decide: ({ sim, key }) => Array.from({ length: 60 }, (_, n) => { const x = sim.rng('career.selection', sim.player.id, `film-${key + n}`).next(); return x < FILM_ROAD.tribeca ? 'T' : x < FILM_ROAD.tribeca + (1 - FILM_ROAD.tribeca) * FILM_ROAD.brooklyn ? 'B' : 'S'; }).join(''),
});

defineDecider<{ sim: Simulation; month: number }, string>({
  id: 'career.rivals',
  decides: 'Which of the class books work in a month after the degree, and which of them is in the room for one of the player’s auditions.',
  drawnIn: 'src/engine/systems/rivals.ts',
  reads: {
    // Which month.
    month: (o, t) => ({ ...o, month: Math.round(t * 120) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), month: seed % 60 }),
  decide: ({ sim, month }) => {
    const school = sim.player.school!;
    school.standing = 'graduated';
    for (const m of school.classmates) m.career = { agencyId: 'gersh', credits: [] };
    for (let n = 0; n < 6; n += 1) classMonth(sim, sim.player, sim.now + (month + n) * 31 * MS_DAY);
    return school.classmates.map((m) => m.career!.credits.map((c) => c.roleId).join('+') || '-').join(',');
  },
});

defineDecider<{ sim: Simulation; key: number }, string>({
  id: 'career.commercial',
  decides: 'How a commercial agency’s meeting reads an actor beside their presence and record: the room’s own swing, five points either way.',
  drawnIn: 'src/engine/systems/commercial.ts',
  reads: {
    // Which meeting.
    key: (o, t) => ({ ...o, key: Math.round(t * 1000) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), key: seed * 13 }),
  decide: ({ sim, key }) => Array.from({ length: 40 }, (_, n) => (sim.rng('career.commercial', sim.player.id, `cesd-${key + n}`).next() < 0.5 ? '-' : '+')).join(''),
});

defineDecider<{ sim: Simulation; key: number }, string>({
  id: 'career.hours',
  decides: 'How long a shooting day runs, and so its overtime.',
  drawnIn: 'src/engine/systems/career.ts',
  reads: {
    // The day: each is drawn on its own.
    day: (o, t) => ({ ...o, key: Math.round(t * 500) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), key: seed * 11 }),
  decide: ({ sim, key }) => Array.from({ length: 40 }, (_, n) => hoursOf(sim, sim.player, `d${key + n}`)).join(','),
});

defineDecider<{ sim: Simulation; roleId: string; job: number }, string>({
  id: 'career.residuals',
  decides: 'Where a finished job is seen, and how it does: a network or a streaming service of a size, a rerun, a syndication sale, a hit.',
  drawnIn: 'src/engine/systems/career.ts',
  reads: {
    // The part: television or a film.
    role: (o, t) => ({ ...o, roleId: ['costar', 'guest-hour', 'series-hour', 'film-low'][Math.min(3, Math.floor(t * 4))]! }),
    // The job: each is drawn on its own.
    job: (o, t) => ({ ...o, job: Math.round(t * 200) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), roleId: ['costar', 'guest-hour', 'series-hour', 'film-low'][seed % 4]!, job: seed }),
  decide: ({ sim, roleId, job }) => Array.from({ length: 20 }, (_, n) => {
    const r = afterlife(sim, sim.player, { id: `j${job}-${n}`, roleId, cityId: 'us-ny-newyork', starts: sim.now, units: 2, rehearsalWeeks: 0, status: 'worked', dueAt: sim.now, offeredAt: sim.now, worked: 2, owed: 0 }, sim.now)!;
    return `${r.kind}${r.size ?? ''}${r.rerun ? 'R' : ''}${r.syndicated ? 'S' : ''}${r.hit ? 'H' : ''}`;
  }).join(' '),
});

defineDecider<{ sim: Simulation; score: number }, string>({
  id: 'career.managers',
  decides: 'Which management firms offer after a showing or a job, and whether a manager finds an unrepresented client an agency in a month.',
  drawnIn: 'src/engine/systems/career.ts',
  reads: {
    // The showing: the higher, the more firms' bars it clears.
    score: (o, t) => ({ ...o, score: 55 + t * 25 }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), score: 60 + (seed % 20) }),
  decide: ({ sim, score }) => managerOffersFor(sim, sim.player, score, 'us-ny-newyork').join(',') || 'none',
});

defineDecider<{ sim: Simulation; key: number }, string>({
  id: 'career.location',
  decides: 'Where a screen job shoots: at home, or on location in Atlanta, Chicago or New Orleans.',
  drawnIn: 'src/engine/systems/career.ts',
  reads: {
    // The job: each is drawn on its own.
    job: (o, t) => ({ ...o, key: Math.round(t * 300) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), key: seed * 13 }),
  decide: ({ sim, key }) => Array.from({ length: 30 }, (_, n) => locationFor(sim, sim.player, `j${key + n}`) ?? 'home').join(','),
});

defineDecider<{ sim: Simulation; key: number }, string>({
  id: 'career.renewal',
  decides: 'Whether a series picks up its option on a regular for another season.',
  drawnIn: 'src/engine/systems/career.ts',
  reads: {
    // The season: each is drawn on its own.
    season: (o, t) => ({ ...o, key: Math.round(t * 300) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), key: seed * 7 }),
  decide: ({ sim, key }) => Array.from({ length: 30 }, (_, n) => (renewed(sim, sim.player, `s${key + n}`, SERIES.renewal.network) ? '1' : '0')).join(''),
});

defineDecider<{ sim: Simulation; bank: number }, string>({
  id: 'bank.chex',
  decides: 'Whether a US bank turns away somebody with a standing ChexSystems report.',
  drawnIn: 'src/engine/systems/lending.ts',
  reads: {
    // Each bank answers on its own.
    bank: (o, t) => ({ ...o, bank: Math.round(t * 4) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), bank: seed % 5 }),
  decide: ({ sim, bank }) => {
    sim.player.chex = { at: sim.now, bank: 'Chase' };
    const banks = ['us-chase', 'us-bank-of-america', 'us-wells-fargo', 'us-citi', 'us-capital-one'].map((id) => bankById(id)).filter((b) => b !== undefined);
    return banks.map((b, n) => (n >= bank && declines(sim, sim.player, b!) ? '1' : '0')).join('');
  },
});

defineDecider<{ sim: Simulation; week: number }, string>({
  id: 'health.illness',
  decides: 'What a week brings to a body: the flu in its season, a doctor’s visit, an emergency, a stay in hospital.',
  drawnIn: 'src/engine/systems/health.ts',
  reads: {
    // The week: in the flu season or out of it.
    week: (o, t) => ({ ...o, week: Math.round(t * 104) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), week: seed % 104 }),
  decide: ({ sim, week }) => Array.from({ length: 52 }, (_, n) => illnessWeek(sim, sim.player, sim.now + (week + n) * 7 * MS_DAY).map((e) => e.what).join('+') || '-').join(' '),
});

defineDecider<{ sim: Simulation; key: number }, string>({
  id: 'health.appointment',
  decides: 'How long a doctor’s appointment is waited for where a wait is a published distribution: England’s band and day within it, or whether a Canadian is seen the next day (`content/appointments.ts`).',
  drawnIn: 'src/engine/systems/appointments.ts',
  reads: {
    // Each booking its own draw.
    key: (o, t) => ({ ...o, key: Math.round(t * 1_000) }),
    world: (o, t) => ({ ...o, sim: quickSave({ startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london', livesWhereBorn: true, wealth: 'modest' }, `appt-${Math.round(t * 20)}`) }),
  },
  sample: (seed) => ({ sim: quickSave({ startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london', livesWhereBorn: true, wealth: 'modest' }, `appt-${seed}`), key: seed }),
  decide: ({ sim, key }) => Array.from({ length: 40 }, (_, n) => waitDays(sim, sim.player, `k${key}-${n}`)).join(' '),
});

defineDecider<{ sim: Simulation }, string>({
  id: 'health.chronic',
  decides: 'The conditions a person carries from the start, depression, asthma, high blood pressure, diabetes (and whether type 1) or arthritis, and whether they wear lenses; and an asthmatic’s or an arthritic’s month’s visit.',
  drawnIn: 'src/engine/systems/health.ts',
  reads: {
    // Two saves are two bodies.
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 40)) }),
  },
  sample: (seed) => ({ sim: atYale(seed) }),
  decide: ({ sim }) => {
    const h = sim.player.health!;
    return `${Object.keys(h.chronic ?? {}).sort().join('+') || 'none'}${h.lenses ? ', lenses' : ''}`;
  },
});

const HOME_TOWNS = ['us-ny-newyork', 'us-ct-newhaven', 'us-ca-losangeles'] as const;

defineDecider<{ sim: Simulation; cityId: string }, string>({
  id: 'homes.listings',
  decides: 'The fifty homes for sale in a town: each one’s kind, rooms, size, lot, year built, what it has, how old its parts are, its street and its place in the spread of prices about the town’s typical value.',
  drawnIn: 'src/engine/systems/homes.ts',
  reads: {
    // The town: each draws its own.
    town: (o, t) => ({ ...o, cityId: HOME_TOWNS[Math.min(2, Math.floor(t * 3))]! }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), cityId: HOME_TOWNS[seed % 3]! }),
  decide: ({ sim, cityId }) => listingsIn(sim, cityId).map((h) => `${h.type[0]}${h.beds}${h.size}${h.built}${h.features.length}${h.address.length}`).join(','),
});

/** A save that owns a house in New Haven, bought a while ago, for the homes' deciders to read. */
function withHouse(sim: Simulation): OwnedHome {
  const listing = listingsIn(sim, 'us-ct-newhaven').find((h) => h.type === 'house')!;
  const owned: OwnedHome = {
    id: 'home-1', listingId: listing.id, cityId: listing.cityId, facts: structuredClone({ ...listing }), boughtAt: sim.now, price: listing.value, closing: 0,
    investment: false, improvements: [], works: [], owed: [], billedThrough: '2026-01', occupied: [{ from: sim.now }], tenancies: [], claims: [], depreciated: 0,
  };
  sim.player.homes = [owned];
  return owned;
}

defineDecider<{ sim: Simulation; ratio: number; tries: number }, string>({
  id: 'homes.market',
  decides: 'How a seller answers an offer between the least they’d take and the asking price, and, for a home let, when a tenant is found, whether one renews and what damage one leaves.',
  drawnIn: 'src/engine/systems/homes.ts',
  reads: {
    // How near the asking price the offer is.
    ratio: (o, t) => ({ ...o, ratio: 0.9 + t * 0.1 }),
    // Each offer is its own draw.
    tries: (o, t) => ({ ...o, tries: Math.round(t * 40) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), ratio: 0.9 + (seed % 10) / 100, tries: seed }),
  decide: ({ sim, ratio, tries }) => {
    const listing = listingsIn(sim, 'us-ct-newhaven')[25]!;
    return Array.from({ length: 20 }, (_, n) => sellerAnswer(sim, sim.player, listing, Math.round(listing.value * ratio), true, tries + n).answer[0]).join('');
  },
});

defineDecider<{ sim: Simulation; wear: number; day: number }, string>({
  id: 'homes.upkeep',
  decides: 'Whether a worn part of a home fails on a day and what its repair costs, and whether a storm or a hard freeze damages it.',
  drawnIn: 'src/engine/systems/homes.ts',
  reads: {
    // How worn the parts are: the older, the likelier to fail.
    wear: (o, t) => ({ ...o, wear: t }),
    // Each day is its own draw.
    day: (o, t) => ({ ...o, day: Math.round(t * 300) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), wear: (seed % 5) / 4, day: seed * 7 }),
  decide: ({ sim, wear, day }) => {
    const s = sim;
    const owned = withHouse(s);
    const year = new Date(s.now).getUTCFullYear();
    for (const part of Object.keys(owned.facts.parts) as (keyof typeof owned.facts.parts)[]) owned.facts.parts[part] = year - Math.round(wear * 40);
    const out: string[] = [];
    for (let n = 0; n < 60; n++) out.push(String(upkeepDay(s, s.player, owned, s.now + (day + n) * 86_400_000)));
    return out.join(',');
  },
});

defineDecider<{ sim: Simulation; cityId: string; shared: boolean; key: number }, string>({
  id: 'homes.rental',
  decides: 'What a rented flat or a room in a shared one is like inside when somebody moves in: its kind, rooms and size, and its fixtures by the country’s norms; and the fixtures of a home bought before they were kept.',
  drawnIn: 'src/engine/systems/dwelling.ts',
  reads: {
    // The town: each draws by its own country and density.
    town: (o, t) => ({ ...o, cityId: HOME_TOWNS[Math.min(2, Math.floor(t * 3))]! }),
    // A room or a place of one's own.
    shared: (o, t) => ({ ...o, shared: t >= 0.5 }),
    // Each move is its own draw.
    key: (o, t) => ({ ...o, key: Math.round(t * 1000) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), cityId: HOME_TOWNS[seed % 3]!, shared: seed % 2 === 0, key: seed * 17 }),
  decide: ({ sim, cityId, shared, key }) => Array.from({ length: 12 }, (_, n) => {
    const u = drawRental(sim, sim.player, cityId, shared, key + n);
    return `${u.type[0]}${u.beds}${u.size}${u.fixtures.laundry[0]}${u.fixtures.cooling[0]}${u.fixtures.dishwasher ? 'd' : ''}${u.fixtures.bathtub ? 'b' : ''}`;
  }).join(','),
});

defineDecider<{ sim: Simulation; months: number }, string>({
  id: 'homes.rates',
  decides: 'Where mortgage rates wander month by month from the figures’ month: a small move either way, pulled back toward where they began.',
  drawnIn: 'src/engine/systems/homes.ts',
  reads: {
    // How far on.
    months: (o, t) => ({ ...o, months: 1 + Math.round(t * 120) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), months: 12 + (seed % 60) }),
  decide: ({ sim, months }) => Array.from({ length: 12 }, (_, n) => rateShift(sim, Date.UTC(2026, 8, 1) + (months + n) * 30.4375 * 86_400_000).toFixed(4)).join(','),
});

defineDecider<{ sim: Simulation }, string>({
  id: 'body.draw',
  decides: 'A body where creation set none: its height and body mass index from the birth country’s adult averages and spread.',
  drawnIn: 'src/engine/systems/body.ts',
  reads: {
    // Two saves are two bodies.
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 40)) }),
  },
  sample: (seed) => ({ sim: atYale(seed) }),
  decide: ({ sim }) => {
    delete sim.player.body;
    const b = bodyOf(sim, sim.player);
    return `${b.heightCm.toFixed(0)}/${b.weightKg.toFixed(0)}`;
  },
});

defineDecider<{ sim: Simulation; bmi: number; age: number }, string>({
  id: 'health.onset',
  decides: 'Whether a condition begins in a month (diabetes, high blood pressure, arthritis), by age and weight.',
  drawnIn: 'src/engine/systems/health.ts',
  reads: {
    // A heavier body, and an older one, meet more of them.
    bmi: (o, t) => ({ ...o, bmi: 18 + t * 24 }),
    age: (o, t) => ({ ...o, age: 20 + t * 50 }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), bmi: 20 + (seed % 20), age: 25 + (seed % 40) }),
  decide: ({ sim, bmi, age }) => {
    const person = sim.player;
    person.birthInstant = sim.now - age * 365.2425 * 86_400_000;
    person.body = { heightCm: 170, weightKg: bmi * 1.7 ** 2, habitKcal: 2_000, intake: 0, extra: 0 };
    const h = person.health!;
    h.drawn = true;
    const found: string[] = [];
    for (let m = 0; m < 240; m += 1) {
      h.chronic = {};
      const c = onsetMonth(sim, person, sim.now + m * 30.4375 * 86_400_000);
      if (c) found.push(`${m}${c[0]}`);
    }
    return found.join(',') || 'none';
  },
});

defineDecider<{ sim: Simulation; source: 'run' | 'stage' | 'fall'; key: number }, string>({
  id: 'health.injury',
  decides: 'Whether an hour of a thing, a day of work or a day of everyday life brings an injury, which one, and how long it takes to mend.',
  drawnIn: 'src/engine/systems/injury.ts',
  reads: {
    // What they were doing.
    source: (o, t) => ({ ...o, source: (['run', 'stage', 'fall'] as const)[Math.min(2, Math.floor(t * 3))]! }),
    // Each hour is its own draw.
    key: (o, t) => ({ ...o, key: Math.round(t * 1000) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), source: (['run', 'stage', 'fall'] as const)[seed % 3]!, key: seed * 13 }),
  decide: ({ sim, source, key }) => Array.from({ length: 40 }, (_, n) => {
    delete sim.player.health!.injury;
    const hurt = mayHurt(sim, sim.player, source, 0.5, sim.now + (key + n) * 3_600_000);
    return hurt ? `${hurt.kind[0]}${Math.round((hurt.until - hurt.at) / 86_400_000)}` : '-';
  }).join(''),
});

defineDecider<{ sim: Simulation; month: number }, string>({
  id: 'land.listings',
  decides: 'The land a market lists in a month: each listing’s size, its asking price over or under the value, and how long it has sat (LAND_DEAL).',
  drawnIn: 'src/engine/systems/land.ts',
  reads: {
    // Each month's listings are drawn anew.
    month: (o, t) => ({ ...o, month: Math.round(t * 60) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), month: seed }),
  decide: ({ sim, month }) => listingsFor(sim, sim.player, 'us-ny-newyork', Date.UTC(2026, month, 15)).map((l) => `${l.acres}@${l.asking}`).join(' '),
});

defineDecider<{ sim: Simulation; ratio: number; tries: number }, string>({
  id: 'land.market',
  decides: 'How a seller of land answers an offer between the least they’d take and the asking price: yes, or a counter at halfway.',
  drawnIn: 'src/engine/systems/land.ts',
  reads: {
    // How near the asking price the offer is.
    ratio: (o, t) => ({ ...o, ratio: 0.9 + t * 0.1 }),
    // Each offer is its own draw.
    tries: (o, t) => ({ ...o, tries: Math.round(t * 40) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), ratio: 0.9 + (seed % 10) / 100, tries: seed }),
  decide: ({ sim, ratio, tries }) => {
    const listing = { id: 'x', market: 0, acres: 0.1, asking: 1_000_000_00, listedAt: sim.now };
    return Array.from({ length: 20 }, (_, n) => landAnswer(sim, sim.player, listing, Math.round(listing.asking * ratio), tries + n).answer[0]).join('');
  },
});

defineDecider<{ sim: Simulation; jurisdiction: 'GB' | 'IE' | 'US-NY' | 'US-CT'; key: number }, string>({
  id: 'vehicle.inspection',
  decides: 'Whether a car fails its periodic inspection, at the place’s published rate, and what the repair and retest cost (INSPECTION_RULES).',
  drawnIn: 'src/engine/systems/inspections.ts',
  reads: {
    // Each car's each test is its own draw.
    key: (o, t) => ({ ...o, key: Math.round(t * 1000) }),
    jurisdiction: (o, t) => ({ ...o, jurisdiction: (['GB', 'IE', 'US-NY', 'US-CT'] as const)[Math.min(3, Math.floor(t * 4))]! }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), jurisdiction: (['GB', 'IE', 'US-NY', 'US-CT'] as const)[seed % 4]!, key: seed * 7 }),
  decide: ({ sim, jurisdiction, key }) => Array.from({ length: 40 }, (_, n) => {
    const v = { id: `car${key + n}`, boughtAt: Date.UTC(2026, 0, 1), ageAtPurchase: 0, jurisdiction, cityId: 'us-ny-newyork' };
    const f = inspectionFails(sim, v, Date.UTC(2031, 0, 1) + n * 86_400_000);
    return f ? String(Math.round(f.repair)) : '-';
  }).join(' '),
});

defineDecider<{ sim: Simulation; key: number }, string>({
  id: 'travel.let_damage',
  decides: 'A holiday let’s damage claim against its guest, or none, at Airbnb’s published share (LET_DAMAGE).',
  drawnIn: 'src/engine/systems/journey.ts',
  reads: {
    // Each stay is its own draw.
    key: (o, t) => ({ ...o, key: Math.round(t * 100_000) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), key: seed * 50_000 }),
  decide: ({ sim, key }) => String(Array.from({ length: 20_000 }, (_, n) => letDamaged(sim, sim.player, `stay${key + n}`)).filter(Boolean).length),
});

defineDecider<{ sim: Simulation; month: number; item: number; market: number }, string>({
  id: 'phone.risk',
  decides: 'A phone in use stolen or damaged in a month or neither, and the screen or something else, at the yearly odds a survey publishes where it is: Allstate Protection Plans’ in America, the ONS crime survey’s in England and Wales (PHONE_RISK).',
  drawnIn: 'src/engine/systems/phones.ts',
  reads: {
    month: (o, t) => ({ ...o, month: Math.round(t * 240) }),
    item: (o, t) => ({ ...o, item: Math.round(t * 240) }),
    market: (o, t) => ({ ...o, market: Math.round(t) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), month: seed % 240, item: seed % 240, market: seed % 2 }),
  decide: ({ sim, month, item, market }) => {
    const risk = PHONE_RISK[market]!;
    // A month's odds are a few in a hundred, so what's decided is counted over a thousand months from there.
    const tally: Record<string, number> = {};
    for (let n = 0; n < 1_000; n += 1) { const r = mishap(sim, risk, `item-${item}`, sim.now + (month * 1_000 + n) * 30 * MS_DAY, false) ?? 'none'; tally[r] = (tally[r] ?? 0) + 1; }
    return JSON.stringify(tally);
  },
});

for (const what of ['water', 'gas'] as const) {
  defineDecider<{ sim: Simulation; day: number }, string>({
    id: `utilities.${what}`,
    decides: `A day the ${what} is cut off at home or not, at the share of its homes the utility cuts off a year (${what === 'water' ? 'WATER_RISK' : 'GAS_RISK'}), when in the day and for how long; swept in London at even odds, a real cut being rare.`,
    drawnIn: 'src/engine/systems/utilities.ts',
    reads: {
      day: (o, t) => ({ ...o, day: Math.round(t * 4000) }),
      world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
    },
    sample: (seed) => ({ sim: atYale(seed), day: seed }),
    decide: ({ sim, day }) => {
      sim.player.home = { ...sim.player.home!, cityId: 'uk-eng-london' };
      const hours: number[] = [];
      for (let d = 0; d < 20; d += 1) { const c = supplyCut(sim, sim.player, what, sim.now + (day * 20 + d) * 86_400_000, 0.5); if (c) hours.push(Math.round((c.until - c.from) / 3_600_000)); }
      return hours.join(',') || 'none';
    },
  });
}

defineDecider<{ sim: Simulation; car: number }, string>({
  id: 'vehicle.break_in',
  decides: 'A car with a stereo in England or Wales broken into in a month or not, at the Crime Survey’s thefts from vehicles where it’s kept (THEFT.englandWales); swept at even odds, the real ones being small.',
  drawnIn: 'src/engine/systems/theft.ts',
  reads: {
    car: (o, t) => ({ ...o, car: Math.round(t * 400) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), car: seed }),
  decide: ({ sim, car }) => {
    const v = { id: `car-${car}`, modelId: 'gb-ford-puma', jurisdiction: 'GB', cityId: 'uk-eng-london', coverage: 'liability', boughtAt: sim.now, ageAtPurchase: 0, listPrice: 0, registrationDue: 0, stereo: true } as unknown as OwnedVehicle;
    return mayBeBrokenInto(sim, sim.player, v, modelById(v.modelId)!, 0, 'GBP', 0.5) ? 'broken into' : 'left alone';
  },
});

defineDecider<{ sim: Simulation; at: number; nhs: number }, string>({
  id: 'health.therapy',
  decides: 'A course of CBT lifting depression or not, at NHS Talking Therapies’ 48.5% recovery or a private course’s 36% remission (THERAPY.recovery); swept at even odds.',
  drawnIn: 'src/engine/systems/therapy.ts',
  reads: {
    at: (o, t) => ({ ...o, at: Math.round(t * 400) }),
    nhs: (o, t) => ({ ...o, nhs: Math.round(t) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), at: seed, nhs: seed % 2 }),
  decide: ({ sim, at, nhs }) => String(Array.from({ length: 30 }, (_, n) => therapyLifts(sim, sim.player, nhs === 1, at * 30 + n)).filter(Boolean).length),
});

defineDecider<{ sim: Simulation; job: number }, string>({
  id: 'homes.planning',
  decides: 'A householder planning application in England refused or granted, at the one in ten MHCLG’s year to June 2026 gives (PLANNING_REFUSED); swept at even odds.',
  drawnIn: 'src/engine/systems/homes.ts',
  reads: {
    job: (o, t) => ({ ...o, job: Math.round(t * 400) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), job: seed }),
  decide: ({ sim, job }) => (planningRefused(sim, `home-${job}`, 'adu', sim.now, 0.5) ? 'refused' : 'granted'),
});

defineDecider<{ sim: Simulation; who: number }, string>({
  id: 'social.cares',
  decides: 'The three interests a person you know cares about, drawn from the creation screen’s general ones the first time it matters (CONTACT_INTERESTS).',
  drawnIn: 'src/engine/systems/enjoyment.ts',
  reads: {
    who: (o, t) => ({ ...o, who: Math.round(t * 400) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), who: seed }),
  decide: ({ sim, who }) => interestsOf(sim, sim.player, { id: `contact-${who}` } as Contact).join(','),
});
