/**
 * SLATE — living in a home: what's inside the place somebody lives, and the
 * everyday life it makes possible or doesn't.
 *
 * Every home has a shower, a kitchen and a bed. What else it has is its own
 * (`Fixtures` in `content/homes.ts`), drawn by the country's norms, the
 * town, the kind of home and how dear it is: a bath, a dishwasher, the
 * laundry, air conditioning, somewhere outside, a gym. A home bought carries
 * the fixtures it was listed with; a rented flat or a room is drawn when
 * they move in (decider `homes.rental`); a friend's sofa has the friend's
 * shower and kitchen and nothing of theirs.
 *
 * What they decide:
 * - CLOTHES. A wardrobe of clean outfits, one worn a day and another by a
 *   workout. Washing them takes the home's laundry: its own machines, a
 *   washer and a rack to dry on overnight, the building's paid machines, or
 *   the laundromat and the time there. Out of clean clothes, the day starts
 *   less fresh and weighs on the mood.
 * - THE PLACE. Tidiness falls every day, a little slower with a dishwasher,
 *   and a mess weighs on the mood and adds stress. Cleaning takes longer the
 *   bigger the home; a cleaner can be hired to come every week.
 * - A BATH beside the shower, for a longer soak that takes more of the day's
 *   stress off.
 * - SOMEWHERE OUTSIDE, a balcony, a terrace or a yard, to sit out on when the
 *   weather is fine; a POOL to swim in on a warm day; a GYM to train in
 *   whatever the weather, where without one a run needs a dry, mild day.
 * - SLEEP on a hot night: with no air conditioning a night over 24°C sleeps
 *   worse, and wall or window units do most but not all of what central air
 *   does.
 * - COOKING at home, or ordering in at what delivery costs.
 *
 * The figures are SLATE's estimates where the header of each says so.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { MS_DAY, MS_HOUR, dateKey, zonedParts, type Instant } from '../core/time';
import { clamp } from '../core/rng';
import { CITIES } from '../content/geography';
import { drawFixtures, isFlat, type Fixtures, type HomeType } from '../content/homes';
import { atTown, HOME, insured as insuredHome, livingIn, type HomeFacts } from './homes';
import { exchange } from '../content/currency';
import { drawFromBank, spend } from './household';
import { weatherAt, weatherOn } from './weather';
import { personalityOf } from './personality';

// ---------------------------------------------------------------------------
// The place somebody lives

/** A rented home as it is inside: a studio or a flat, or a room in a shared one. */
export interface RentedUnit {
  type: HomeType;
  beds: number;
  size: number;
  /** A room in a flat shared with others. */
  shared: boolean;
  fixtures: Fixtures;
}

/** The place they live, as far as everyday life reads it. */
export interface Place {
  type: HomeType;
  size: number;
  fixtures: Fixtures;
  /** Their own to keep clean, and to hire a cleaner for. */
  keeps: boolean;
  shared: boolean;
  owned: boolean;
  /** A kitchen to cook in: every home has one, a hotel room doesn't. */
  cooks: boolean;
}

/** Where somebody stays away from home on a job. */
export interface Stay { kind: 'hotel' | 'sublet' | 'sofa' | 'own' | 'let'; cityId: string; unit?: RentedUnit }

/** A production's hotel room: a bath, central air, the hotel's gym, no kitchen of its own and the laundry sent out. */
const HOTEL_FIXTURES: Fixtures = { bathtub: true, dishwasher: false, laundry: 'none', cooling: 'central', outdoor: 'none', gym: 'building' };

/** What a friend's sofa gives: their shower and kitchen, and nothing of yours. */
const SOFA_FIXTURES: Fixtures = { bathtub: false, dishwasher: false, laundry: 'none', cooling: 'none', outdoor: 'none', gym: 'none' };

/** Draws a rented flat, or a room in a shared one, in a town: the kind of place a renter there gets. */
export function drawRental(sim: Simulation, person: Person, cityId: string, shared: boolean, key: number): RentedUnit {
  const city = CITIES.require(cityId);
  const rng = sim.rng('homes.rental', person.id, cityId, shared ? 'room' : 'flat', key);
  const dense = city.population >= 500_000 || city.kind === 'section';
  // A room is one of two to four in a flat, or a house off the dense city; a place of one's own is a studio or a one-bedroom.
  // A place of one's own at a one-bedroom's rent is a one-bedroom; a room is one of two to four, whose flatmates share the council tax.
  const type: HomeType = shared ? (!dense && rng.next() < 0.4 ? 'house' : 'condo') : 'condo';
  const beds = shared ? rng.int(2, 4) : 1;
  // Near what renters get: an American studio averages 457 square feet and a one-bedroom 735, New York's 487 and 697 (RentCafe, 2024).
  const size = Math.round((shared ? 700 + 300 * beds : rng.int(620, 820)) / 10) * 10;
  // A renter's place sits low in the market: the first third, a shared house a little higher.
  const fixtures = drawFixtures(rng, { countryId: city.countryId, latitude: city.latitude, longitude: city.longitude, dense }, type, rng.float(0.1, 0.4), type === 'house' && rng.next() < 0.6);
  return { type, beds, size, shared, fixtures };
}

/** A home owned's fixtures: as listed, or drawn for one bought before they were kept. */
export function fixturesOf(sim: Simulation, person: Person, cityId: string, facts: HomeFacts, key: string): Fixtures {
  if (facts.fixtures) return facts.fixtures;
  const city = CITIES.require(cityId);
  const rng = sim.rng('homes.rental', person.id, cityId, 'owned', key);
  return drawFixtures(rng, { countryId: city.countryId, latitude: city.latitude, longitude: city.longitude, dense: city.population >= 500_000 || city.kind === 'section' }, facts.type, 0.5, facts.features.includes('yard'));
}

/** Where they are now: home, or where a job has them staying (`stayPlace`). */
export function placeOf(sim: Simulation, person: Person): Place | undefined {
  if (person.home && !atHome(person)) return stayPlace(sim, person);
  return homePlace(sim, person);
}

/** Where a job has them staying: its hotel, a sublet room, a friend's sofa, or their own home in that city. */
export function stayPlace(sim: Simulation, person: Person): Place {
  const stay = person.stay?.cityId === person.currentLocationId ? person.stay : undefined;
  const own = stay?.kind === 'own' ? (person.homes ?? []).find((h) => h.cityId === stay.cityId) : undefined;
  if (own) return { type: own.facts.type, size: own.facts.size, fixtures: fixturesOf(sim, person, own.cityId, own.facts, own.id), keeps: false, shared: false, owned: true, cooks: true };
  if (stay?.kind === 'sublet' && stay.unit) return { type: stay.unit.type, size: stay.unit.size, fixtures: stay.unit.fixtures, keeps: false, shared: true, owned: false, cooks: true };
  // A holiday let: a home of the town's own, its kitchen cooked in (`content/lets.ts`, from 2026-09-29).
  if (stay?.kind === 'let' && stay.unit) return { type: stay.unit.type, size: stay.unit.size, fixtures: stay.unit.fixtures, keeps: false, shared: false, owned: false, cooks: true };
  if (stay?.kind === 'sofa') return { type: 'condo', size: 700, fixtures: SOFA_FIXTURES, keeps: false, shared: true, owned: false, cooks: true };
  return { type: 'condo', size: 350, fixtures: HOTEL_FIXTURES, keeps: false, shared: false, owned: false, cooks: false };
}

/** The place somebody lives, or nothing without a home. */
export function homePlace(sim: Simulation, person: Person): Place | undefined {
  const home = person.home;
  if (!home) return undefined;
  if (home.kind === 'sofa') return { type: 'condo', size: 700, fixtures: SOFA_FIXTURES, keeps: false, shared: true, owned: false, cooks: true };
  const owned = livingIn(person);
  if (owned) {
    return { type: owned.facts.type, size: owned.facts.size, fixtures: fixturesOf(sim, person, owned.cityId, owned.facts, owned.id), keeps: true, shared: false, owned: true, cooks: true };
  }
  const unit = home.unit ?? drawRental(sim, person, home.cityId, home.kind === 'shared', home.since);
  return { type: unit.type, size: unit.size, fixtures: unit.fixtures, keeps: true, shared: unit.shared, owned: false, cooks: true };
}

/** Whether they're at home now: in its town. */
export const atHome = (person: Person): boolean => Boolean(person.home && person.home.cityId === person.currentLocationId);

// ---------------------------------------------------------------------------
// Clothes and the place's state

/**
 * A wardrobe, a load, and how long each way of washing takes and costs. A
 * washer's cycle runs about an hour (CHOICE's lab tests: 58 minutes for a
 * top-loader) and a dryer's another (about 64), so clothes are dry two hours
 * on. A laundromat's wash averages $3.73 and its dryers about a dollar for
 * 25 minutes (the Coin Laundry Association's 2024 survey), so $6.29 a load
 * with a 64-minute dry; a building's machines about $1.50 to $2 a wash and as much to dry
 * (CSC ServiceWorks rooms), $3.50 a load; both at the town's cost of living.
 * SLATE's estimates: two weeks of outfits and seven to a load, a person's
 * one load or two a week (the American Cleaning Institute found 1 to 3 the
 * commonest in 2026), and a rack drying overnight, since no source measures it.
 */
export const LAUNDRY = {
  outfits: 14,
  perLoad: 7,
  /** Their own time, in minutes, by how it's done; and when the clothes are wearable after. */
  minutes: { 'in-unit': 20, 'washer-only': 20, building: 30, none: 120 } as const,
  readyHours: { 'in-unit': 2, 'washer-only': 18, building: 2, none: 0 } as const,
  /** A wash and a dry, a load, in dollars. */
  buildingUsd: 3.5,
  laundromatUsd: 6.29,
};

/** How fast a home gets untidy a day, a dishwasher's saving, where it starts to weigh, and what it weighs. SLATE's estimates. */
export const TIDY = { perDay: 6, dishwasher: 0.75, messy: 40, morale: 1, stress: 1, tidiedUp: 70 };

/** A day spent working: four hours or more of a commitment that needed them, in the day just gone. */
export function busyDay(sim: Simulation, person: Person): boolean {
  const from = sim.now - MS_DAY;
  return sim.universe.scheduled.some((one) => one.requiresPlayer === true && (one.durationMinutes ?? 0) >= 240
    && one.at >= from && one.at < sim.now && (one.payload.personId === undefined || one.payload.personId === person.id));
}
/**
 * Cleaning the place: an hour and a half or so for somebody cleaning a flat
 * (the American Time Use Survey's 94 minutes a day for those who clean,
 * 2024), longer the bigger it is, to four hours. A cleaner charges by the
 * hour, $45 at an American cost of living, with a two-hour visit the least,
 * so a flat's weekly clean is near $90 and a mansion's near $145, inside the
 * $75 to $145 and $100 to $250 a week that cleaners charge for an apartment
 * and a house (HomeGuide, 2026). SLATE's estimates within those.
 */
export const CLEANING = { baseMinutes: 60, sqftPerMinute: 40, most: 240, cleanerUsdHour: 45, cleanerSpeed: 0.8, leastHours: 2 };
/** Out of clean clothes: the morning's freshness, and the mood. */
export const WORN_CLOTHES = { hygiene: 55, morale: 1 };

export interface Living {
  clean: number;
  dirty: number;
  /** Clothes washed and drying, and when they're dry. */
  drying: { count: number; readyAt: Instant }[];
  tidy: number;
  /** Renters insurance on what's inside, paid monthly. */
  rentersInsurance?: boolean;
  /** The month's loads in the home's own machines, for the bills. */
  loads?: { washer: number; dryer: number };
  /** A cleaner every week, and the day of the week they come, 0 for Sunday. */
  cleaner?: { day: number };
}

export function livingOf(person: Person): Living {
  person.living ??= { clean: LAUNDRY.outfits, dirty: 0, drying: [], tidy: 80 };
  return person.living;
}

/** An outfit worn: from the clean, or worn again when there are none. */
export function wearOutfit(person: Person): boolean {
  const l = livingOf(person);
  if (l.clean <= 0) return false;
  l.clean -= 1;
  l.dirty += 1;
  return true;
}

/** How long cleaning the place takes them. */
export const cleaningMinutes = (place: Place): number => Math.min(CLEANING.most, Math.round(CLEANING.baseMinutes + place.size / CLEANING.sqftPerMinute));

/** What a cleaner's weekly visit costs here. */
export function cleanerCost(sim: Simulation, person: Person): Money {
  const place = placeOf(sim, person);
  if (!place || !person.home) return 0;
  return atTown(sim, person.home.cityId, CLEANING.cleanerUsdHour * Math.max(CLEANING.leastHours, cleaningMinutes(place) * CLEANING.cleanerSpeed / 60));
}

/** How they'd do the laundry now: the home's way, or the laundromat's away from it. */
export function laundryWay(sim: Simulation, person: Person): Fixtures['laundry'] {
  return placeOf(sim, person)?.fixtures.laundry ?? 'none';
}

/** What a laundry costs now, in loads and money. */
export function laundryCost(sim: Simulation, person: Person): { loads: number; cost: Money } {
  const loads = Math.ceil(livingOf(person).dirty / LAUNDRY.perLoad);
  const way = laundryWay(sim, person);
  const usd = way === 'building' ? LAUNDRY.buildingUsd : way === 'none' ? LAUNDRY.laundromatUsd : 0;
  // At the prices where it's done: home, or the laundromat where a job has them.
  return { loads, cost: usd > 0 ? loads * atTown(sim, atHome(person) ? person.home!.cityId : person.currentLocationId, usd) : 0 };
}

/** Does the laundry: the clothes into the wash, paid for where it's paid, and wearable when they're dry. */
export function doLaundry(sim: Simulation, person: Person, finishedAt: Instant): boolean {
  const l = livingOf(person);
  const way = laundryWay(sim, person);
  const { cost } = laundryCost(sim, person);
  if (cost > 0 && !spend(sim, person, cost, way === 'none' ? 'The laundromat' : 'The laundry room', 'laundry')) return false;
  const count = l.dirty;
  l.dirty = 0;
  // A home's own machines run on its electricity, billed with the month.
  if (way === 'in-unit' || way === 'washer-only') {
    const loads = Math.ceil(count / LAUNDRY.perLoad);
    l.loads = { washer: (l.loads?.washer ?? 0) + loads, dryer: (l.loads?.dryer ?? 0) + (way === 'in-unit' ? loads : 0) };
  }
  const ready = finishedAt + LAUNDRY.readyHours[way] * MS_HOUR;
  if (ready <= finishedAt) l.clean += count;
  else l.drying.push({ count, readyAt: ready });
  return true;
}

/**
 * What a home's own machines add to the month's bills: an electric dryer's
 * 2.4 kWh a load (the DOE standard's 684 kWh over 283 cycles) and a washer's
 * 2.3 kWh, its motor's 0.23 (the EIA's 69 kWh a year over ENERGY STAR's 295
 * loads) and the hot water it draws, which ENERGY STAR puts at about 90% of
 * a washer's energy; at the 18.19 cents a kWh America's homes paid in 2026
 * (EIA), at the town's cost of living. Until 2026-09-28 the hot water wasn't
 * counted. The water heated by gas is priced as if electric.
 */
export const MACHINES = { washerUsd: (0.23 / 0.1) * 0.1819, dryerUsd: 2.4 * 0.1819 };

/** The month's machine loads, in dollars, billed with the month's bills on the first, then counted again. */
export function machineUsd(person: Person): number {
  const l = person.living;
  if (!l?.loads) return 0;
  return l.loads.washer * MACHINES.washerUsd + l.loads.dryer * MACHINES.dryerUsd;
}

/**
 * What a home's fixtures do to what it lets and sells for, over the typical
 * home's: ApartmentAdvisor's regression on 250,000 one-bedroom listings
 * (November 2024) found a washer and dryer of its own worth 5.57% of the
 * rent, a gym 4.86%, a balcony 3.98%, air conditioning 1.30% and a
 * dishwasher 1.07%; in New York, StreetEasy found about 12% for the machines.
 * A washer alone, wall units, a terrace and a yard, and a home gym, are
 * SLATE's estimates beside those. Over the typical home's mix (`FIXTURE_TYPICAL`).
 */
export const FIXTURE_PREMIUM = {
  laundry: { 'in-unit': 0.0557, 'washer-only': 0.02, building: 0, none: 0 },
  cooling: { central: 0.013, units: 0.0065, none: 0 },
  outdoor: { terrace: 0.05, yard: 0.03, balcony: 0.0398, none: 0 },
  dishwasher: 0.0107,
  gym: { home: 0.03, building: 0.0486, none: 0 },
  bathtub: 0,
} as const;
/** The typical home's premium, which the published rents and values already carry: an American home's mix of them. */
export const FIXTURE_TYPICAL = 1.075;

export function premiumOf(f: Fixtures): number {
  const p = FIXTURE_PREMIUM;
  return (1 + p.laundry[f.laundry] + p.cooling[f.cooling] + p.outdoor[f.outdoor] + (f.dishwasher ? p.dishwasher : 0) + p.gym[f.gym] + (f.bathtub ? p.bathtub : 0)) / FIXTURE_TYPICAL;
}

/** Clothes dry by now back in the wardrobe. */
export function collectDry(person: Person, at: Instant): void {
  const l = livingOf(person);
  const dry = l.drying.filter((d) => d.readyAt <= at);
  if (dry.length === 0) return;
  l.clean += dry.reduce((s, d) => s + d.count, 0);
  l.drying = l.drying.filter((d) => d.readyAt > at);
}

/**
 * The day's turn of the place, at midnight: an outfit worn, the clothes that
 * dried, the mess a day makes, a cleaner on their day, and what a mess or
 * nothing clean to wear weighs.
 */
export function livingDay(sim: Simulation, person: Person): void {
  const place = placeOf(sim, person);
  if (!place) return;
  const l = livingOf(person);
  collectDry(person, sim.now);
  const w = person.wellbeing;
  // Left to themselves, somebody with a free day keeps up: the washing when it's nearly all worn, a tidy-up when the
  // place is getting bad, not as well as a proper clean. A day of work doesn't leave the time, and it all waits.
  const free = !busyDay(sim, person);
  if (free && l.clean <= 1 && l.drying.length === 0 && l.dirty > 0) doLaundry(sim, person, sim.now);
  if (!wearOutfit(person)) {
    w.morale = clamp(w.morale - WORN_CLOTHES.morale * personalityOf(person, 'moraleSwing'), 0, 100);
  }
  // Away, the place stands as they left it: no mess made, and none cleared.
  if (!place.keeps || !atHome(person)) return;
  l.tidy = clamp(l.tidy - TIDY.perDay * (place.fixtures.dishwasher ? TIDY.dishwasher : 1), 0, 100);
  if (free && l.tidy < TIDY.messy + TIDY.perDay) l.tidy = Math.max(l.tidy, TIDY.tidiedUp);
  const day = zonedParts(sim.now, CITIES.require(person.home!.cityId).timeZone);
  const weekday = new Date(Date.UTC(day.year, day.month - 1, day.day)).getUTCDay();
  if (l.cleaner && weekday === l.cleaner.day) {
    const cost = cleanerCost(sim, person);
    if (drawFromBank(sim, person, cost).short === 0 && spend(sim, person, cost, 'The cleaner', 'cleaning')) l.tidy = 100;
  }
  if (l.tidy < TIDY.messy) {
    w.morale = clamp(w.morale - TIDY.morale * personalityOf(person, 'moraleSwing'), 0, 100);
    w.stress = clamp(w.stress + TIDY.stress * personalityOf(person, 'stressGain'), 0, 100);
  }
}

// ---------------------------------------------------------------------------
// The weather at home, for what it lets them do

/**
 * A hot night sleeps worse. Over seven million nights in sixty-eight
 * countries, a night over 30°C cost fourteen minutes of sleep, and one over
 * 25°C made a short night 3.5 points likelier (Minor et al., One Earth,
 * 2022): about a twentieth and a thirtieth of a night. That is what a home
 * with no air conditioning loses; wall or window units take away most of it,
 * and central air all of it.
 */
export const HOT_NIGHT = { lowC: 25, none: 0.03, hotC: 30, hot: 0.05, units: 0.01 };

/** What tonight's heat takes off a night's sleep where they are. */
export function heatLoss(sim: Simulation, person: Person, at: Instant): number {
  const city = CITIES.get(person.currentLocationId);
  if (!city) return 0;
  const w = weatherOn(sim, city, at);
  if (w.lowC < HOT_NIGHT.lowC) return 0;
  // Where they sleep tonight: home, or where a job has them staying.
  const cooling = placeOf(sim, person)?.fixtures.cooling ?? 'central';
  return cooling === 'none' ? (w.lowC >= HOT_NIGHT.hotC ? HOT_NIGHT.hot : HOT_NIGHT.none) : cooling === 'units' ? HOT_NIGHT.units : 0;
}

/** Weather to be out in: dry, and neither freezing nor sweltering. A swim needs a warm day. */
export const FINE = { lowC: 10, highC: 32, swimC: 24, runLowC: 0 };

/** The weather this hour where they are, as the Weather panel shows it: the sky now, and the temperature now. */
export function weatherNow(sim: Simulation, person: Person): { condition: string; highC: number } | undefined {
  const w = weatherAt(sim, person.currentLocationId, sim.now);
  return w ? { condition: w.condition, highC: w.temperatureC } : undefined;
}

const FALLING: Readonly<Record<string, string>> = { Rain: 'raining', Thunderstorm: 'storming', Snow: 'snowing', Drizzle: 'drizzling' };
const wet = (condition: string) => condition in FALLING;

/** Why they can't sit out now, or nothing where they can. */
export function outsideRefusal(sim: Simulation, person: Person): string | undefined {
  const place = placeOf(sim, person);
  if (!atHome(person) || !place || place.fixtures.outdoor === 'none') return 'Your place has nowhere outside.';
  const w = weatherNow(sim, person);
  if (!w) return undefined;
  if (wet(w.condition)) return `It’s ${FALLING[w.condition] ?? 'wet'} out.`;
  if (w.highC < FINE.lowC) return 'It’s too cold to sit out.';
  if (w.highC > FINE.highC) return 'It’s too hot to sit out.';
  return undefined;
}

/** Why a swim can't be had now, or nothing where it can. */
export function swimRefusal(sim: Simulation, person: Person): string | undefined {
  const owned = livingIn(person);
  if (!atHome(person) || !owned?.facts.features.includes('pool')) return 'You have no pool.';
  const w = weatherNow(sim, person);
  if (w && (wet(w.condition) || w.highC < FINE.swimC)) return 'It isn’t a day for the pool.';
  return undefined;
}

/**
 * Where a workout happens, and what it builds there over a workout at home
 * with nothing: a gym's equipment, the home's or the building's (or the
 * hotel's away), builds a fifth more; a run on a dry, mild day a tenth more.
 * SLATE's estimates.
 */
export const TRAINING = { gym: 1.2, run: 1.1, home: 1 };
export function trainingAt(sim: Simulation, person: Person): { where: 'gym' | 'run' | 'home'; builds: number } {
  if ((placeOf(sim, person)?.fixtures.gym ?? 'none') !== 'none') return { where: 'gym', builds: TRAINING.gym };
  const w = weatherNow(sim, person);
  if (w && !wet(w.condition) && w.highC <= FINE.highC && w.highC >= FINE.runLowC) return { where: 'run', builds: TRAINING.run };
  return { where: 'home', builds: TRAINING.home };
}

/** A day's key for anything drawn once a day at home. */
export const homeDay = (sim: Simulation, person: Person): string => dateKey(sim.now, CITIES.require(person.home?.cityId ?? person.currentLocationId).timeZone);

/** Whether a meal now is cooked, where they're staying has a kitchen, or bought out. */
export function cooks(sim: Simulation, person: Person): boolean {
  return placeOf(sim, person)?.cooks ?? false;
}

/** What delivery costs over a meal cooked at home: $21.00 against $3.03 for the same meals (LendingTree, October 2025), near seven times. */
export const DELIVERY = { times: 21 / 3.03 };

/** A meal bought out, picked up: $11.71 against the $3.03 of cooking it (LendingTree, October 2025). */
export const EAT_OUT = { times: 11.71 / 3.03 };

export const livedDays = (from: Instant, to: Instant): number => Math.floor((to - from) / MS_DAY);

/** For a notice: what a laundry run came to. */
export function laundryNote(sim: Simulation, person: Person): string {
  const { loads, cost } = laundryCost(sim, person);
  const way = laundryWay(sim, person);
  const money = cost > 0 ? `, ${formatMoney(cost, saveCurrency(sim.universe))}` : '';
  return `${loads} ${loads === 1 ? 'load' : 'loads'}${money}${way === 'washer-only' ? ', dry on the rack by tomorrow' : way === 'none' ? ' at the laundromat' : ''}`;
}

export { isFlat };

export function registerDwelling(sim: Simulation): void {
  sim.onEvent('world.day_rollover', 'dwelling.day', (_event, { sim: s }) => {
    for (const person of Object.values(s.universe.people)) {
      livingDay(s, person);
      const city = CITIES.get(person.home?.cityId ?? '');
      belongingsDay(s, person, city ? zonedParts(s.now, city.timeZone).day === 1 : false);
    }
  });

  sim.onCommand<{ on: boolean }, { premium: Money }>('home.renters_insurance', (p, { sim: s }) => {
    const person = s.player;
    if (!person.home || person.home.kind === 'sofa' || person.home.kind === 'owned') throw new CommandError('Renters insurance is for somebody renting.');
    const l = livingOf(person);
    if (!p.on) { delete l.rentersInsurance; return { premium: 0 }; }
    l.rentersInsurance = true;
    return { premium: rentersPremium(s, person) };
  });

  sim.onCommand<{ on: boolean; day?: number }, { cost: Money }>('home.cleaner', (p, { sim: s }) => {
    const person = s.player;
    const place = placeOf(s, person);
    if (!place?.keeps) throw new CommandError('It isn’t your place to have cleaned.');
    const l = livingOf(person);
    if (!p.on) { delete l.cleaner; return { cost: 0 }; }
    const day = Number.isInteger(p.day) && p.day! >= 0 && p.day! <= 6 ? p.day! : 5;
    l.cleaner = { day };
    return { cost: cleanerCost(s, person) };
  });
}

// ---------------------------------------------------------------------------
// What they own inside: a burglary, a fire, and the insurance on them

/**
 * A home's belongings at risk. A burglary comes to 8.2 households in a
 * thousand a year (the Bureau of Justice Statistics' National Crime
 * Victimization Survey, 2024), and the average theft claim is $5,524 (the
 * Triple-I from ISO, 2019–2023); a renter's belongings are lost in a fire as
 * often as a home burns (1 in 425 a year), at about $7,170 a claim (Lemonade,
 * unverified). A homeowner's policy covers what's in the home over its
 * deductible (\`systems/homes.ts\`); a renter's needs renters insurance, $171
 * a year on average (NAIC, 2022: New York $169, California $169, Connecticut
 * $175), paying over a $500 deductible, SLATE's estimate of a common one.
 * Without it, they replace what they can afford, and do without the rest.
 */
export const BELONGINGS = {
  burglaryYear: 8.2 / 1000,
  theftUsd: [1_500, 9_500] as const,
  fireYear: 1 / 425,
  fireUsd: [3_000, 11_000] as const,
  premiumYearUsd: { 'us-ny': 169, 'us-ca': 169, 'us-ct': 175 } as Readonly<Record<string, number>>,
  premiumDefaultUsd: 171,
  deductibleUsd: 500,
  morale: 3,
  stress: 5,
  without: 2,
};

/** A renters insurance premium a month where they live, in the save's money. */
export function rentersPremium(sim: Simulation, person: Person): Money {
  const city = CITIES.get(person.home?.cityId ?? person.currentLocationId);
  if (!city) return 0;
  const usd = BELONGINGS.premiumYearUsd[city.parentId] ?? BELONGINGS.premiumDefaultUsd;
  const cur = saveCurrency(sim.universe);
  // The states' own averages are what they are; elsewhere the national average at the town's cost of living.
  const cents = BELONGINGS.premiumYearUsd[city.parentId] ? usd * 100 : Math.round(usd * 100 * city.costOfLivingIndex / 100);
  return Math.round((exchange(cents, 'USD', cur) ?? cents) / 12);
}

/** Whether what's inside their home is insured, and over what deductible. */
export function coveredInside(sim: Simulation, person: Person): Money | undefined {
  const owned = livingIn(person);
  if (owned) return insuredHome(owned) ? atTown(sim, owned.cityId, HOME.deductibleUsd) : undefined;
  return person.living?.rentersInsurance ? atTown(sim, person.home?.cityId ?? person.currentLocationId, BELONGINGS.deductibleUsd) : undefined;
}

/** A day's risk to what's inside: a burglary, or for a renter a fire in the building; and the renters premium on the first. */
export function belongingsDay(sim: Simulation, person: Person, firstOfMonth: boolean): void {
  const home = person.home;
  if (!home || home.kind === 'sofa') return;
  const cur = saveCurrency(sim.universe);
  if (firstOfMonth && person.living?.rentersInsurance && home.kind !== 'owned') {
    if (!spend(sim, person, rentersPremium(sim, person), 'Renters insurance', 'insurance')) {
      delete person.living.rentersInsurance;
      if (person.id === sim.universe.playerId) sim.notify({ category: 'home', title: 'Your Renters Insurance Lapsed', body: 'The premium couldn’t be paid, so the policy ended.', importance: 70, route: '/home' });
    }
  }
  const r = sim.rng('homes.upkeep', person.id, 'belongings', homeDay(sim, person));
  const burgled = r.next() < BELONGINGS.burglaryYear / 365;
  const burned = home.kind !== 'owned' && r.next() < BELONGINGS.fireYear / 365;
  if (!burgled && !burned) return;
  const [least, most] = burgled ? BELONGINGS.theftUsd : BELONGINGS.fireUsd;
  const loss = atTown(sim, home.cityId, r.float(least, most));
  const w = person.wellbeing;
  w.morale = clamp(w.morale - BELONGINGS.morale * personalityOf(person, 'moraleSwing'), 0, 100);
  w.stress = clamp(w.stress + BELONGINGS.stress * personalityOf(person, 'stressGain'), 0, 100);
  const deductible = coveredInside(sim, person);
  const pays = deductible === undefined ? 0 : Math.max(0, loss - deductible);
  if (pays > 0) {
    sim.post({ memo: burgled ? 'Insurance claim: a burglary' : 'Insurance claim: a fire', category: 'insurance', postings: [{ accountId: person.primaryAccountId!, amount: pays }, { accountId: sim.nominalAccount('income', 'Insurance Claims').id, amount: -pays }] });
    const owned = livingIn(person);
    if (owned) owned.claims.push(sim.now);
  }
  // What's gone is replaced as far as the money goes; what can't be is done without.
  const replaced = spend(sim, person, loss, burgled ? 'Replacing what was stolen' : 'Replacing what burned', 'household');
  if (!replaced) w.morale = clamp(w.morale - BELONGINGS.without, 0, 100);
  if (person.id === sim.universe.playerId) {
    sim.notify({
      category: 'home', title: burgled ? 'Your Home Was Burgled' : 'A Fire In The Building',
      body: `${formatMoney(loss, cur, { cents: false })} of your things ${burgled ? 'were taken' : 'were lost'}. ${pays > 0 ? `The insurance paid ${formatMoney(pays, cur, { cents: false })}, over its deductible.` : deductible !== undefined ? 'It’s under the deductible.' : 'Nothing insured them.'} ${replaced ? 'You’ve replaced what you need.' : 'You can’t afford to replace it all.'}`,
      importance: 80, route: '/home',
    });
  }
}
