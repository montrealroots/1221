/**
 * SLATE — a journey from one town to another by air, booked, kept and taken
 * (docs/WORLD.md, stage 2). From 2026-09-29.
 *
 * A journey is its legs: the taxi to the airport, the airline's check-in,
 * the flights, the border and the bags at the far end, and the taxi into
 * town, each in the local time of where it happens. Booking pays for it,
 * checks the papers the destination asks (\`systems/documents.ts\`) and puts
 * the whole of it on the calendar as one commitment, which nothing else may
 * overlap. On the day the player must be there to leave; the papers are
 * checked again at the airport, as an airline does; a flight is on time,
 * late or canceled and rebooked at the published rates; and only on arrival
 * does the player's town, and the clock they live by, change.
 *
 * Airports are real (\`systems/airports.ts\`); schedules and routes are
 * SLATE's model, as airlines' aren't open data; fares, bag fees, the time to
 * arrive before a flight, delays, and the taxis at either end are published
 * figures where \`content/air.ts\` has them, and say so where they're SLATE's.
 */

import { drawRental } from './dwelling';
import { LETS, LET_FEE, LET_FREE_DAYS } from '../content/lets';
import { RENTAL_RETURN_KIND, planRentalDrive, rentalDays, rentalDriven, rentalQuote, rentalsOf } from './rentals';
import { ownFlown, planCharterJet, planFlyYourself } from './aviation';
import type { Simulation } from '../core/simulation';
import { CAMPGROUNDS, HOTEL_PARKING, STAY_CLASS_LABEL, type RatePlan, type StayClass } from '../content/staytypes';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, MS_HOUR, formatDate, formatTime, instantFromZoned, zonedParts, startOfNextDay, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES, distanceKm } from '../content/geography';
import { expenseFor, inTheBank } from './household';
import { AIR, fareUsd, groundLeg } from '../content/air';
import { owe, payFromBank } from './household';
import { present } from './career';
import { crossingRefusal, isoOfCity , mayDrive } from './documents';
import { itinerary, tripAirportFor, type Airport } from './airports';
import { nightRateFor, ownPlaceIn, stayPrice, streetRefusal } from './stays';
import { arrive } from './jetlag';
import { byRoad, drive, driveMinutes, roadKm, ROAD, tollsUsd } from './driving';
import { classFor, forOutings, jurisdictionOf, kindOf, modelById, runningCost, sleepsIn, vehiclesOf } from './vehicles';
import { atTheCheckpoint, boardingIdRefusal } from './identity';
import { caravansOf, towFor, towedLegs } from './caravans';
import { claimDelay } from './compensation';
import { stolenNow } from './theft';
import { laidUp } from './repairs';
import { inWinterSeason, tireFactor } from './tires';
import { CAR_FERRY } from '../content/rail';
import { moveTo } from './luggage';
import { hotelById, namedStayQuote, namedStayRefusal , checkOutHourOf, depositFor, hotelParking } from './hotels';
import { claimCancellation } from './travelinsurance';
import { departureHours, fareOf, planTrain, railRouteById, railRoutes, trainFateOf } from './rail';

export type LegMode = 'ground' | 'check-in' | 'flight' | 'fly' | 'train' | 'bus' | 'ferry' | 'drive' | 'arrival';
export type Cabin = 'economy' | 'premium';

export interface JourneyLeg {
  mode: LegMode;
  /** A town's id, or an airport's IATA code. */
  from: string;
  to: string;
  departAt: Instant;
  arriveAt: Instant;
  /** In the save's currency. */
  fare: Money;
  /** Whose figure the fare and the time are. */
  basis: string;
  /** A train's route (`content/rail.ts`). */
  routeId?: string;
}

export interface Journey {
  id: string;
  fromCity: string;
  toCity: string;
  legs: JourneyLeg[];
  status: 'booked' | 'underway' | 'arrived' | 'missed' | 'canceled';
  bookedAt: Instant;
  bags: number;
  total: Money;
  /** When they leave for the airport, and reach the town. */
  leaveAt: Instant;
  arriveAt: Instant;
  /** Minutes late on arrival, and whether a flight was canceled and rebooked. */
  lateMinutes?: number;
  rebooked?: boolean;
  /** Why it was missed, where it was. */
  why?: string;
  /** A round trip's two journeys share a trip, booked, paid and canceled together. */
  tripId?: string;
  /** A hotel at the far end for some nights, prepaid, and when its first night begins and its last ends. */
  hotel?: { nights: number; price: Money; basis: string; checkOutAt: Instant; /** Its kind and rate plan, from 2026-10-01; a hotel on a flexible rate before. */ cls?: StayClass; plan?: RatePlan; /** Parking with it, for a car brought, from 2026-10-01. */ parking?: Money; /** A named hotel and its room, where one was chosen (`systems/hotels.ts`). */ named?: { hotelId: string; room: string }; /** Its deposit held now, and returned at check-out. */ deposit?: Money; returned?: Money; /** A deposit the bank couldn't cover at arrival: the room held, not given, until the end of that day (from 2026-10-02). */ depositDue?: Money; heldUntil?: Instant; /** The stay given up, the deposit never paid. */ forfeited?: boolean; /** A late check-out bought, and its hour (`systems/latecheckout.ts`, from 2026-10-02). */ lateUntil?: Instant };
  /** A holiday let there instead (`content/lets.ts`, from 2026-09-29): its nights, price and the service fee in it. */
  let?: { nights: number; price: Money; fee: Money; basis: string; checkOutAt: Instant };
  /** Business or first, where not economy (from 2026-09-29). */
  cabin?: Cabin;
  /** By train, the route's id; by air where not said (from 2026-09-29). */
  by?: string;
  /** The caravan towed behind it (`systems/caravans.ts`, from 2026-09-30). */
  towing?: string;
  /** A trip the career makes (from 2026-09-29): the job's, who paid the fares, and where they sleep on arrival. */
  bookingId?: string;
  paidBy?: 'production' | 'self';
  onArrival?: Person['stay'];
  /** Travel insurance bought with it, a round trip's halves sharing one (`systems/travelinsurance.ts`, from 2026-10-01). */
  insured?: import('./travelinsurance').TripPolicy;
}

export const LEAVE_KIND = 'travel.leave';
export const ARRIVE_KIND = 'travel.arrive';
export const CHECKOUT_KIND = 'travel.checkout';

/** A hotel's check-out, eleven in the morning, SLATE's reading of the usual hour. */
export const CHECKOUT_HOUR = 11;
/** A hotel booked on a flexible rate is refunded until a day before arrival: SLATE's reading of the usual terms. */
export const HOTEL_FREE_UNTIL_HOURS = 24;

/**
 * What comes back of a hotel called off, from 2026-10-01
 * (`docs/research/world/research-stays-rentals.json`): on a flexible rate,
 * all of it until a day before arrival, and after that all but its first
 * night, which a late cancellation or a no-show costs, the rest released as
 * hotels do; paid ahead on the prepaid rate, nothing. Its parking comes back
 * whole, as nothing was parked. Until then a late cancellation or a missed
 * arrival forfeited every night.
 */
/** A journey missed: its hotel's nights released as a no-show's are, the first kept on a flexible rate (from 2026-10-01). */
function missedHotel(sim: Simulation, person: Person, j: Journey): Money {
  const back = j.hotel ? hotelRefund(j.hotel, j.arriveAt, j.arriveAt) : 0;
  if (back > 0) sim.post({ memo: 'A hotel’s nights released, the first kept for the no-show', category: 'travel', postings: refundPostings(sim, person, back) });
  return back;
}

export function hotelRefund(hotel: NonNullable<Journey['hotel']>, arriveAt: Instant, now: Instant): Money {
  const parking = hotel.parking ?? 0;
  if (hotel.plan === 'prepaid') return parking;
  const rooms = hotel.price - parking;
  if (arriveAt - now >= HOTEL_FREE_UNTIL_HOURS * MS_HOUR) return hotel.price;
  return parking + rooms - Math.round(rooms / Math.max(1, hotel.nights));
}

/** Check-out after some nights from an arrival, at eleven in the town's time. */
export function checkOutAfter(cityId: string, arriveAt: Instant, nights: number, hour: number = CHECKOUT_HOUR): Instant {
  const zone = CITIES.require(cityId).timeZone;
  const p = zonedParts(arriveAt, zone);
  // A night begins the evening of arrival; one that lands after midnight but before morning is the night before's.
  const firstNight = p.hour < 6 ? p.day - 1 : p.day;
  // A named hotel's own hour (`checkOutHourOf`, from 2026-10-01), eleven otherwise.
  return instantFromZoned({ year: p.year, month: p.month, day: firstNight + nights, hour: Math.floor(hour), minute: Math.round((hour % 1) * 60) }, zone);
}

/** The nights between arriving in a town and leaving it: from the night of arrival to the morning of the day one leaves. */
export function nightsBetween(cityId: string, arriveAt: Instant, leaveAt: Instant): number {
  const zone = CITIES.require(cityId).timeZone;
  const a = zonedParts(arriveAt, zone);
  const firstNight = Date.UTC(a.year, a.month - 1, a.hour < 6 ? a.day - 1 : a.day);
  const b = zonedParts(leaveAt, zone);
  return Math.max(0, Math.round((Date.UTC(b.year, b.month - 1, b.day) - firstNight) / MS_DAY));
}

/** A round trip's flights at the share BTS's averages give a round trip against two one-ways. */
export function asRoundTrip(legs: JourneyLeg[]): JourneyLeg[] {
  return legs.map((l) => (l.mode === 'flight' ? { ...l, fare: Math.round(l.fare * AIR.roundTripShare), basis: `${l.basis} A round trip: ${Math.round(AIR.roundTripShare * 1000) / 10}% of two one-way fares, BTS’s averages for Q2 2026.` } : l));
}

/** The other half of a round trip, if a journey has one. */
export function partnerOf(person: Person, j: Journey): Journey | undefined {
  return j.tripId ? journeysOf(person).find((x) => x.tripId === j.tripId && x.id !== j.id) : undefined;
}

/** Where a person will be when they leave: where they are, or where a journey booked before it takes them. */
export function whereBy(person: Person, at: Instant): string {
  const before = journeysOf(person).filter((j) => (j.status === 'booked' || j.status === 'underway') && j.arriveAt <= at).sort((a, b) => b.arriveAt - a.arriveAt)[0];
  return before?.toCity ?? person.currentLocationId;
}

export function journeysOf(person: Person): Journey[] {
  person.journeys ??= [];
  return person.journeys;
}

function inSave(sim: Simulation, amount: number, currency = 'USD'): Money {
  const cents = Math.round(amount * 100);
  const into = saveCurrency(sim.universe);
  return into === currency ? cents : exchange(cents, currency, into) ?? cents;
}

/** Minutes in the air between two airports: about 800 km an hour, and half an hour taxiing out and in. SLATE's estimate. */
export function blockMinutes(a: Airport, b: Airport): number {
  return Math.round(AIR.taxiMinutes + (distanceKm(a, b) / AIR.cruiseKmh) * 60);
}

/** The departures a day, at each airport, in its own time: SLATE's model of a schedule. */
export const DEPARTURES = AIR.departureHours;

/**
 * A journey's legs, from leaving a town for its airport on a day at one of
 * the day's departures, to reaching the other town: the plan it's booked on.
 */
export function planJourney(sim: Simulation, fromCity: string, toCity: string, day: Instant, slot: number, bags: number, cabin: Cabin = 'economy'): JourneyLeg[] | string {
  const premium = cabin === 'premium';
  const abroad = isoOfCity(fromCity) !== isoOfCity(toCity);
  const from = tripAirportFor(fromCity, abroad);
  const to = tripAirportFor(toCity, abroad);
  if (!from || !to) return 'SLATE has no airport for one end of that.';
  if (from.airport.iata === to.airport.iata) return 'Both towns fly from the same airport: it isn’t a flight.';
  const path = itinerary(from.airport, to.airport);
  const international = isoOfCity(fromCity) !== isoOfCity(toCity);
  const zone0 = CITIES.require(fromCity).timeZone;
  const p = zonedParts(day, zone0);
  const depart = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: DEPARTURES[slot] ?? DEPARTURES[0]! }, zone0);
  const legs: JourneyLeg[] = [];
  const out = groundLeg(fromCity, from.airport.iata, from.km);
  const checkIn = (international ? AIR.arriveBeforeInternationalMinutes : AIR.arriveBeforeDomesticMinutes) * 60_000;
  const atAirport = depart - checkIn;
  legs.push({ mode: 'ground', from: fromCity, to: from.airport.iata, departAt: atAirport - out.minutes * 60_000, arriveAt: atAirport, fare: inSave(sim, out.amount, out.currency), basis: out.basis });
  const paidBags = premium ? Math.max(0, bags - AIR.premiumBags) : bags;
  legs.push({ mode: 'check-in', from: from.airport.iata, to: from.airport.iata, departAt: atAirport, arriveAt: depart, fare: paidBags > 0 ? inSave(sim, AIR.bagUsd(international) * paidBags) : 0, basis: `${international ? 'Three hours' : 'Two hours'} before, as airlines ask${bags > 0 ? (premium ? '; the bags come with the cabin' : `; a checked bag, ${AIR.bagBasis}`) : ''}.` });
  let t = depart;
  for (let i = 0; i + 1 < path.length; i += 1) {
    const a = path[i]!;
    const b = path[i + 1]!;
    const minutes = blockMinutes(a, b);
    const fare = fareUsd(a, b);
    legs.push({ mode: 'flight', from: a.iata, to: b.iata, departAt: t, arriveAt: t + minutes * 60_000, fare: inSave(sim, fare.usd * (premium ? AIR.premiumMultiple : 1)), basis: `${fare.basis}${premium ? ` ${AIR.premiumBasis}` : ''} The schedule and the route are SLATE’s model; about ${Math.round(minutes / 60 * 10) / 10} hours.` });
    t += minutes * 60_000 + (i + 2 < path.length ? AIR.connectionMinutes * 60_000 : 0);
  }
  const last = path[path.length - 1]!;
  const border = international ? AIR.borderMinutes : 0;
  const claim = AIR.deplaneMinutes + border + (bags > 0 ? AIR.bagClaimMinutes : 0);
  legs.push({ mode: 'arrival', from: last.iata, to: last.iata, departAt: t, arriveAt: t + claim * 60_000, fare: 0, basis: `Off the aircraft${international ? ', through the border' : ''}${bags > 0 ? ' and the bags' : ''}: SLATE’s estimate.` });
  t += claim * 60_000;
  const back = groundLeg(toCity, last.iata, to.km);
  legs.push({ mode: 'ground', from: last.iata, to: toCity, departAt: t, arriveAt: t + back.minutes * 60_000, fare: inSave(sim, back.amount, back.currency), basis: back.basis });
  return legs;
}

/** What else on the calendar a journey's hours would run into, if anything. */
function clashWith(sim: Simulation, person: Person, from: Instant, to: Instant, except?: string): string | undefined {
  const clash = sim.universe.scheduled.find((i) => i.status === 'pending' && i.requiresPlayer === true && (i.payload.personId === undefined || i.payload.personId === person.id) && (except === undefined || i.payload.journeyId !== except)
    && i.at < to && i.at + (i.durationMinutes ?? 60) * 60_000 > from);
  return clash ? `${clash.label}, ${formatDate(clash.at, sim.zone)} at ${formatTime(clash.at, sim.zone)}` : undefined;
}

/** Why a journey can't be booked, or nothing. A night in one's own motorhome or caravan asks no hotel of the town; its stay's own price says where there's none. */
export function bookRefusal(sim: Simulation, person: Person, fromCity: string, toCity: string, legs: JourneyLeg[] | string, stayDays: number, nights = 0, sleepsInIt = false): string | undefined {
  if (typeof legs === 'string') return legs;
  if (!CITIES.get(toCity)) return 'SLATE doesn’t have that town.';
  if (legs[0]!.departAt <= sim.now) return 'That departure has gone.';
  if (!ownPlaceIn(person, toCity)) {
    if (nights <= 0) return `Somewhere to sleep in ${CITIES.require(toCity).name}: book the hotel’s nights with it.`;
    // Until later on 2026-09-30 a motorhome's trip to a town without hotel figures was refused, its campground offered and never bookable.
    if (!sleepsInIt && !nightRateFor(toCity)) return `SLATE doesn’t have ${CITIES.require(toCity).name}’s hotels yet, and you have no home there.`;
  }
  // The towns, not the first leg's place: a flight of one's own starts at an airport, whose code isn't a town,
  // and until 2026-09-30 a domestic one asked for a passport as if it crossed a border.
  const border = crossingRefusal(person, fromCity, toCity, legs[legs.length - 1]!.arriveAt, stayDays);
  if (border) return border;
  const clash = clashWith(sim, person, legs[0]!.departAt, legs[legs.length - 1]!.arriveAt);
  if (clash) return `It runs into ${clash}.`;
  if (journeysOf(person).some((j) => (j.status === 'booked' || j.status === 'underway') && j.leaveAt < legs[legs.length - 1]!.arriveAt && j.arriveAt > legs[0]!.departAt)) return 'It runs into another journey you’ve booked.';
  return undefined;
}

const total = (legs: JourneyLeg[]) => legs.reduce((a, l) => a + l.fare, 0);

/** Whether a flight is late, canceled, or on time, at the published rates: the minutes it's late, or null canceled. */
export function flightFate(sim: Simulation, person: Person, key: string): number | null {
  const rng = sim.rng('travel.delay', person.id, key);
  const x = rng.next();
  if (x < AIR.canceledShare) return null;
  if (x < AIR.canceledShare + AIR.lateShare) return Math.round(AIR.lateMinutesAverage * -Math.log(1 - rng.next() * 0.999));
  return 0;
}

/** Each flight's fate at the published rates: the minutes late in all, and whether one was canceled and rebooked. */
function fly(sim: Simulation, person: Person, j: Journey): void {
  let late = 0;
  let rebooked = false;
  for (const [n, leg] of j.legs.entries()) {
    const route = leg.mode === 'train' || leg.mode === 'bus' || leg.mode === 'ferry' ? railRouteById(leg.routeId) : undefined;
    if (route) { const fate = trainFateOf(sim, person, route, `${j.id}-${n}`); late += fate.late; if (fate.canceled) rebooked = true; continue; }
    if (leg.mode !== 'flight') continue;
    const fate = flightFate(sim, person, `${j.id}-${n}`);
    if (fate === null) { rebooked = true; late += AIR.rebookHours * 60; } else late += fate;
  }
  j.status = 'underway';
  j.lateMinutes = late;
  j.rebooked = rebooked;
  // Three hours or more late, the law the flight falls under may owe for it (`systems/compensation.ts`).
  const flown = j.legs.filter((l) => l.mode === 'flight');
  if (flown.length) claimDelay(sim, person, j, late, flown.reduce((a, l) => a + l.fare, 0));
  sim.schedule({ at: j.arriveAt + late * 60_000, kind: ARRIVE_KIND, label: `Arrive In ${CITIES.require(j.toCity).name}`, category: 'personal', priority: 28, payload: { personId: person.id, journeyId: j.id } });
}

/** A journey's legs by air, or by a train's route: `by` is the route's id, or nothing for air. */
/** A journey's legs by a way of going. The way home of a round trip by one's own car is planned from where the car will be then, the town it was driven to (from 2026-10-01). */
export function planBy(sim: Simulation, by: string | undefined, fromCity: string, toCity: string, day: Instant, slot: number, bags: number, cabin: Cabin = 'economy', carWillBeAt?: string): JourneyLeg[] | string {
  if (!by || by === 'air') return planJourney(sim, fromCity, toCity, day, slot, bags, cabin);
  if (by.startsWith('car:')) return planDrive(sim, sim.player, by.slice(4), fromCity, toCity, day, slot, carWillBeAt);
  // A car rented where they are (`systems/rentals.ts`, from 2026-09-29).
  if (by === 'rental') return planRentalDrive(sim, sim.player, fromCity, toCity, day, slot);
  // Flown oneself in a rented plane, on a pilot's certificate (`systems/aviation.ts`, from 2026-09-29).
  if (by === 'fly') return planFlyYourself(sim, sim.player, fromCity, toCity, day, slot);
  // A light jet chartered (`systems/aviation.ts`, from 2026-09-30).
  if (by === 'jet') return planCharterJet(sim, fromCity, toCity, day, slot);
  // A car and driver (from 2026-10-01).
  if (by === 'chauffeur') return planChauffeur(sim, fromCity, toCity, day, slot);
  const route = railRouteById(by);
  if (!route || !railRoutes(fromCity, toCity).includes(route)) return 'That train doesn’t run between those towns.';
  return planTrain(sim, route, fromCity, day, slot);
}

/**
 * A journey by one's own car (from 2026-09-29): the road between the towns
 * (`systems/driving.ts`), leaving on the hour of the day's slot, SLATE's
 * choice of seven in the morning onward; its fuel and upkeep and the road's
 * tolls. It's the owner's car, where it is, and a license that lets them
 * drive there.
 */
/** Whether a journey's way is one's own motorhome or campervan (`sleepsIn` in `systems/vehicles.ts`). */
export function inMotorhome(person: Person, by: string | undefined): boolean {
  const v = by?.startsWith('car:') ? vehiclesOf(person).find((x) => `car:${x.id}` === by) : undefined;
  return Boolean(v && sleepsIn(modelById(v.modelId)!));
}

/** Whether someone lives in the state or province a town is in, for a park's visitor's surcharge. */
export const residentOf = (person: Person, cityId: string): boolean => jurisdictionOf(person.home?.cityId ?? person.homeRegionId) === jurisdictionOf(cityId);

/** Whether a drive between two towns crosses to Vancouver Island on BC Ferries (`CAR_FERRY`). */
export const crossesByCarFerry = (fromCity: string, toCity: string): boolean => CAR_FERRY.islandTowns.includes(fromCity) !== CAR_FERRY.islandTowns.includes(toCity) && CITIES.get(fromCity)?.parentId === 'ca-02' && CITIES.get(toCity)?.parentId === 'ca-02';

export function planDrive(sim: Simulation, person: Person, vehicleId: string, fromCity: string, toCity: string, day: Instant, slot: number, willBeAt?: string): JourneyLeg[] | string {
  const v = vehiclesOf(person).find((x) => x.id === vehicleId && x.soldAt === undefined);
  if (!v) return 'That isn’t a car you own.';
  if (v.repossessed) return 'The lender has the car.';
  if (stolenNow(v, day)) return 'It’s been stolen.';
  const laid = laidUp(v, day);
  if (laid) return laid;
  if (forOutings(modelById(v.modelId)!)) return 'A bicycle or an ATV isn’t taken on a journey between towns.';
  if ((willBeAt ?? v.at ?? v.cityId) !== fromCity) return `The car is in ${CITIES.require(v.at ?? v.cityId).name}.`;
  if (!byRoad(fromCity, toCity)) return 'No road joins those towns.';
  const may = mayDrive(person, fromCity, day, day, classFor(modelById(v.modelId)!), modelById(v.modelId)!.cc);
  if (!may.ok) return may.why ?? 'You may not drive there.';
  const zone = CITIES.require(fromCity).timeZone;
  const p = zonedParts(day, zone);
  const depart = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: 7 + Math.max(0, Math.min(14, slot)) }, zone);
  const km = roadKm(fromCity, toCity);
  const minutes = driveMinutes(km);
  const cur = saveCurrency(sim.universe);
  const tolls = tollsUsd(fromCity, toCity);
  // Across to Vancouver Island, the car goes on BC Ferries (`CAR_FERRY`).
  const ferry = crossesByCarFerry(fromCity, toCity);
  const ferryCad = ferry ? Math.round((CAR_FERRY.vehicle + CAR_FERRY.driver) * (1 + CAR_FERRY.surcharge) * 100) : 0;
  const fare = runningCost(sim, v, km) + (tolls > 0 ? (cur === 'USD' ? tolls : exchange(tolls, 'USD', cur) ?? tolls) : 0) + (ferryCad ? (cur === 'CAD' ? ferryCad : exchange(ferryCad, 'CAD', cur) ?? ferryCad) : 0);
  const m = modelById(v.modelId)!;
  return [{ mode: 'drive', from: fromCity, to: toCity, departAt: depart, arriveAt: depart + (minutes + (ferry ? CAR_FERRY.minutes : 0)) * 60_000, fare, routeId: `car:${v.id}`, basis: `${Math.round(km)} km by road in the ${m.make} ${m.model}: its fuel and upkeep${tolls > 0 ? ', and the corridor’s tolls' : ', no tolls kept for this road'}. ${ROAD.source}.` }];
}

/**
 * How a job's trip goes, from 2026-09-29: by train where one runs (the
 * fastest on the production's ticket, the cheapest on the actor's own), else
 * by air where it's far enough to fly; out, the latest of the day's
 * departures that arrives at least ten hours before the first call, the day
 * before or the one before that; home, the first that leaves after the
 * job's done. Until then the career moved an actor between cities in an
 * instant, and an actor's own fare to a job in another city was never paid.
 */
export function careerTrip(sim: Simulation, fromCity: string, toCity: string, when: Instant, way: 'out' | 'back', payer: 'production' | 'self' = 'production'): { by?: string; day: Instant; slot: number; legs: JourneyLeg[] } | undefined {
  const trains = railRoutes(fromCity, toCity).slice().sort((a, b) => (payer === 'production' ? a.minutes - b.minutes : fareUsdOf(a) - fareUsdOf(b)));
  const route = trains[0];
  if (!route && distanceKm(CITIES.require(fromCity), CITIES.require(toCity)) < AIR.shortestCareerFlightKm) return undefined;
  const slots = route ? Array.from({ length: route.perDay }, (_, i) => i) : AIR.departureHours.map((_, i) => i);
  const tries: [Instant, number][] = way === 'out'
    ? [1, 2].flatMap((before) => [...slots].reverse().map((slot) => [when - before * MS_DAY, slot] as [Instant, number]))
    : [0, 1].flatMap((after) => slots.map((slot) => [when + after * MS_DAY, slot] as [Instant, number]));
  for (const [day, slot] of tries) {
    const legs = planBy(sim, route?.id, fromCity, toCity, day, slot, 1);
    if (typeof legs === 'string') return undefined;
    if (legs[0]!.departAt <= sim.now) continue;
    if (way === 'out' ? legs[legs.length - 1]!.arriveAt <= when - 10 * MS_HOUR : legs[0]!.departAt >= when) return { ...(route ? { by: route.id } : {}), day, slot, legs };
  }
  return undefined;
}

/** A train's fare in dollars, to set two routes side by side. */
function fareUsdOf(route: import('../content/rail').RailRoute): number {
  const f = fareOf(route);
  return f.currency === 'USD' ? f.amount : exchange(f.amount, f.currency, 'USD') ?? f.amount;
}

/** A job's trip begun: underway at once, on the plan it was booked on, re-planned from wherever they are now. */
export function startCareerJourney(sim: Simulation, person: Person, toCity: string, day: Instant, slot: number, opts: { bookingId: string; paidBy: 'production' | 'self'; onArrival?: Person['stay']; by?: string }): Journey | undefined {
  const fromCity = person.currentLocationId;
  const legs = planBy(sim, opts.by, fromCity, toCity, day, slot, 1);
  if (typeof legs === 'string') return undefined;
  const j: Journey = {
    id: sim.nextId('journey'), fromCity, toCity, legs, status: 'booked', bookedAt: sim.now, bags: 1, ...(opts.by ? { by: opts.by } : {}),
    total: total(legs), leaveAt: legs[0]!.departAt, arriveAt: legs[legs.length - 1]!.arriveAt,
    bookingId: opts.bookingId, paidBy: opts.paidBy, ...(opts.onArrival ? { onArrival: opts.onArrival } : {}),
  };
  journeysOf(person).push(j);
  fly(sim, person, j);
  return j;
}

/**
 * A holiday let for a journey's nights (`content/lets.ts`): AirDNA's rate,
 * Airbnb's service fee and the town's taxes, or why none is kept or lawful.
 */
export function letQuote(sim: Simulation, cityId: string, nights: number): { price: Money; fee: Money; basis: string } | string {
  const t = LETS[cityId];
  if (!t) return 'SLATE keeps no holiday lets there yet.';
  if (nights <= 0) return 'A let is for nights there.';
  if (t.minNights && nights < t.minNights) return `New York City’s Local Law 18 bars a whole home let for fewer than ${t.minNights} nights.`;
  if (t.maxNights && nights > t.maxNights) return `A London home is let no more than ${t.maxNights} nights a year.`;
  const cur = saveCurrency(sim.universe);
  const usd = (cents: Money) => (cur === 'USD' ? cents : exchange(cents, 'USD', cur) ?? cents);
  const rent = usd(Math.round(t.adrUsd * 100) * nights);
  const fee = Math.round(rent * LET_FEE);
  // A levy on so many nights only (Edinburgh's first five) falls on their share of the rent.
  const taxed = t.levyNights ? Math.round(rent * Math.min(nights, t.levyNights) / nights) : rent;
  const price = rent + fee + Math.round(taxed * t.taxRate) + usd(Math.round((t.perNightUsd ?? 0) * 100) * nights);
  return { price, fee, basis: `AirDNA’s average night there, Airbnb’s ${Math.round(LET_FEE * 1000) / 10}% service fee, and ${t.basis}.` };
}

/** What a let canceled brings back: all of it five days or more before arrival, then half the nights after the first, the fee kept. */
export function letRefund(l: NonNullable<Journey['let']>, arriveAt: Instant, at: Instant): Money {
  if (arriveAt - at >= LET_FREE_DAYS * MS_DAY) return l.price;
  const nightsCost = l.price - l.fee;
  return l.nights > 1 ? Math.round(nightsCost * (l.nights - 1) / l.nights / 2) : 0;
}

export function registerJourneys(sim: Simulation): void {
  sim.onCommand<{ journeyId: string }, { price: Money; hotelBack: Money }>('travel.stay_let', (p, { sim: s }) => {
    const person = s.player;
    const j = journeysOf(person).find((x) => x.id === p?.journeyId);
    if (!j || j.status !== 'booked') throw new CommandError('That isn’t a journey you have booked.');
    if (!j.hotel) throw new CommandError('A let takes the place of the journey’s hotel.');
    if (j.arriveAt - s.now < HOTEL_FREE_UNTIL_HOURS * MS_HOUR) throw new CommandError('Too close to arrival to cancel the hotel free.');
    if (j.hotel.plan === 'prepaid') throw new CommandError('The hotel was paid ahead on a rate that isn’t refunded.');
    const q = letQuote(s, j.toCity, j.hotel.nights);
    if (typeof q === 'string') throw new CommandError(q);
    const hotelBack = j.hotel.price;
    if (q.price > hotelBack && !payFromBank(s, person, q.price - hotelBack, `A holiday let in ${CITIES.require(j.toCity).name}, the hotel canceled`, 'travel')) throw new CommandError('That’s more than the bank can cover.');
    if (q.price < hotelBack) s.post({ memo: 'A hotel canceled for a holiday let, the difference back', category: 'travel', postings: refundPostings(s, person, hotelBack - q.price) });
    j.let = { nights: j.hotel.nights, price: q.price, fee: q.fee, basis: q.basis, checkOutAt: j.hotel.checkOutAt };
    j.total += q.price - hotelBack;
    delete j.hotel;
    return { price: q.price, hotelBack };
  });

  sim.onCommand<{ toCity: string; day: Instant; slot?: number; bags?: number; nights?: number; returnDay?: Instant; returnSlot?: number; by?: string; cabin?: Cabin; stay?: StayClass; plan?: RatePlan; tow?: boolean; hotelId?: string; room?: string }, { journeyId: string; returnId?: string; leaveAt: Instant; arriveAt: Instant; total: Money }>('travel.book', (p, { sim: s }) => {
    const person = s.player;
    const toCity = String(p?.toCity ?? '');
    const day = Number(p?.day);
    // From where they'll be by then: here, or where a journey booked before it takes them.
    const fromCity = whereBy(person, day);
    const bags = Math.max(0, Math.min(2, Number(p?.bags ?? 0)));
    const round = p?.returnDay !== undefined && p?.returnDay !== null;
    const by = p?.by && p.by !== 'air' ? String(p.by) : undefined;
    // A cabin is the airlines': a train is booked as it comes.
    const cabin: Cabin = !by && p?.cabin === 'premium' ? 'premium' : 'economy';
    let out = planBy(s, by, fromCity, toCity, day, Number(p?.slot ?? 0), bags, cabin);
    let back = round ? planBy(s, by, toCity, fromCity, Number(p!.returnDay), Number(p?.returnSlot ?? 0), bags, cabin, toCity) : undefined;
    if (typeof out === 'string') throw new CommandError(out);
    if (typeof back === 'string') throw new CommandError(back);
    // A caravan behind one's own car (`systems/caravans.ts`, from 2026-09-30).
    let towing: string | undefined;
    if (p?.tow) {
      const car = by?.startsWith('car:') ? vehiclesOf(person).find((x) => `car:${x.id}` === by) : undefined;
      if (!car) throw new CommandError('A caravan is towed behind a car of your own.');
      const caravan = towFor(person, car, fromCity, toCity);
      if (typeof caravan === 'string') throw new CommandError(caravan);
      towing = caravan.id;
      out = towedLegs(s, car, caravan, out);
      if (back) back = towedLegs(s, car, caravan, back);
    }
    const arriveOut = out[out.length - 1]!.arriveAt;
    if (back && back[0]!.departAt <= arriveOut) throw new CommandError('The way home leaves before the way out arrives.');
    // A round trip's hotel runs from the night it lands to the morning it flies home.
    const nights = back ? nightsBetween(toCity, arriveOut, back[0]!.departAt) : Math.max(0, Math.min(90, Math.floor(Number(p?.nights ?? 0))));
    const no = bookRefusal(s, person, fromCity, toCity, out, Math.max(1, nights), nights, p?.stay === 'campground' || p?.stay === 'street');
    if (no) throw new CommandError(no);
    if (back) {
      const noBack = bookRefusal(s, person, toCity, fromCity, back, 1, 1);
      if (noBack && !/Somewhere to sleep|hotels yet/.test(noBack)) throw new CommandError(`The way home: ${noBack}`);
      // A round trip's discount is the airlines'; a train's return is two singles.
      if (!by) { out = asRoundTrip(out); back = asRoundTrip(back); }
    }
    // The kind of stay and its rate plan, and a car brought parked where a hotel charges for it (from 2026-10-01).
    const cls: StayClass = p?.stay ?? 'hotel';
    const plan: RatePlan = p?.plan === 'prepaid' ? 'prepaid' : 'flexible';
    // A campground is for a journey made in one's own motorhome or campervan (from 2026-09-30).
    if (cls === 'campground' && !inMotorhome(person, by) && !towing) throw new CommandError('A campground’s site is for a motorhome, a campervan or a caravan of your own, brought there.');
    // The street, the same, where the town lets it stand overnight.
    if (cls === 'street' && !inMotorhome(person, by)) throw new CommandError('Sleeping on the street is in a motorhome or campervan of your own, driven there.');
    const noStreet = cls === 'street' && !ownPlaceIn(person, toCity) && nights > 0 ? streetRefusal(toCity, nights) : undefined;
    if (noStreet) throw new CommandError(noStreet);
    // A named hotel's own room and rate where one was chosen (`systems/hotels.ts`, from 2026-10-01); else the town's average.
    const named = p?.hotelId && cls === 'hotel' ? { hotelId: String(p.hotelId), room: String(p.room ?? '') } : undefined;
    if (named) {
      if (hotelById(named.hotelId)?.cityId !== toCity) throw new CommandError('That hotel is in another town.');
      const noHotel = namedStayRefusal(person, named.hotelId, named.room, plan, arriveOut);
      if (noHotel) throw new CommandError(noHotel);
    }
    const room = !ownPlaceIn(person, toCity) && nights > 0 ? (named ? namedStayQuote(s, named.hotelId, named.room, plan, arriveOut, nights) : stayPrice(s, toCity, nights, 1, cls, plan, residentOf(person, toCity), arriveOut)) : undefined;
    // A campground closed on one of the nights says when it's open.
    const closed = cls === 'campground' ? CAMPGROUNDS[jurisdictionOf(toCity) ?? '']?.closed : undefined;
    if (!ownPlaceIn(person, toCity) && nights > 0 && !room && closed) throw new CommandError(closed);
    if (!ownPlaceIn(person, toCity) && nights > 0 && !room) throw new CommandError(`SLATE doesn’t have ${STAY_CLASS_LABEL[cls].toLowerCase()} in ${CITIES.require(toCity).name}.`);
    // A named hotel's own parking where it names one (`hotelParking`, from 2026-10-01); the town's otherwise.
    const ownPark = named && by?.startsWith('car:') ? hotelParking(s, named.hotelId, nights) : undefined;
    const park = ownPark ? ownPark.price : room && cls !== 'campground' && cls !== 'street' && HOTEL_PARKING[toCity] && by?.startsWith('car:') ? inSave(s, HOTEL_PARKING[toCity]!.perNight * nights, HOTEL_PARKING[toCity]!.currency) : 0;
    const hotel = room ? { price: room.price + park, basis: `${room.basis}${ownPark ? ` ${ownPark.basis}.` : park ? ` Parking: ${HOTEL_PARKING[toCity]!.basis}.` : ''}` } : undefined;
    const outCost = total(out) + (hotel?.price ?? 0);
    const cost = outCost + (back ? total(back) : 0);
    if (!payFromBank(s, person, cost, `A ${back ? 'round trip' : 'journey'} to ${CITIES.require(toCity).name}${hotel ? `, and ${nights} ${nights === 1 ? 'night' : 'nights'} ${cls === 'campground' ? 'at a campground' : cls === 'street' ? 'on the street' : 'in a hotel'}` : ''}`, 'travel')) throw new CommandError(`${formatMoney(cost, saveCurrency(s.universe))} is more than the bank can cover.`);
    const tripId = back ? s.nextId('journey') : undefined;
    const add = (legs: JourneyLeg[], from: string, to: string, price: Money, stay?: Journey['hotel']): Journey => {
      const id = s.nextId('journey');
      const leaveAt = legs[0]!.departAt;
      const arriveAt = legs[legs.length - 1]!.arriveAt;
      const j: Journey = { id, fromCity: from, toCity: to, legs, status: 'booked', bookedAt: s.now, bags, total: price, leaveAt, arriveAt, ...(by ? { by } : {}), ...(cabin === 'premium' ? { cabin } : {}), ...(tripId ? { tripId } : {}), ...(stay ? { hotel: stay } : {}), ...(towing ? { towing } : {}) };
      journeysOf(person).push(j);
      s.schedule({ at: leaveAt, kind: LEAVE_KIND, label: `To ${CITIES.require(to).name}`, category: 'personal', priority: 28, requiresPlayer: true, durationMinutes: Math.round((arriveAt - leaveAt) / 60_000), locationId: from, payload: { personId: person.id, journeyId: id } });
      return j;
    };
    const first = add(out, fromCity, toCity, outCost, hotel ? { nights, price: hotel.price, basis: hotel.basis, checkOutAt: checkOutAfter(toCity, arriveOut, nights, checkOutHourOf(named?.hotelId)), ...(cls !== 'hotel' ? { cls } : {}), ...(plan !== 'flexible' ? { plan } : {}), ...(park ? { parking: park } : {}), ...(named ? { named } : {}) } : undefined);
    const second = back ? add(back, toCity, fromCity, total(back)) : undefined;
    return { journeyId: first.id, ...(second ? { returnId: second.id } : {}), leaveAt: first.leaveAt, arriveAt: first.arriveAt, total: cost };
  });

  sim.onCommand<{ journeyId: string; day: Instant; slot?: number }, { total: Money; leaveAt: Instant }>('travel.extend', (p, { sim: s }) => {
    const person = s.player;
    const q = extendQuote(s, person, String(p?.journeyId), Number(p?.day), Number(p?.slot ?? 0));
    if (typeof q === 'string') throw new CommandError(q);
    const back = journeysOf(person).find((x) => x.id === p.journeyId)!;
    const out = partnerOf(person, back)!;
    if (q.total > 0 && !payFromBank(s, person, q.total, `Staying longer in ${CITIES.require(back.fromCity).name}`, 'travel')) throw new CommandError(`${formatMoney(q.total, saveCurrency(s.universe))} is more than the bank can cover.`);
    if (q.total < 0) s.post({ memo: `Staying longer in ${CITIES.require(back.fromCity).name}, the difference back`, category: 'travel', postings: refundPostings(s, person, -q.total) });
    const leaveAt = q.legs[0]!.departAt;
    const cancelKind = (kind: string, key: string, id: string) => { for (const one of s.universe.scheduled) if (one.status === 'pending' && one.kind === kind && one.payload[key] === id) s.timeline.cancel(one.id, s.now); };
    // The stay runs to the new morning home.
    const checkOutAt = checkOutAfter(back.fromCity, out.arriveAt, q.nights, checkOutHourOf(out.hotel?.named?.hotelId));
    if (out.let) { const lq = letQuote(s, back.fromCity, q.nights) as { price: Money; fee: Money; basis: string }; out.let = { nights: q.nights, price: lq.price, fee: lq.fee, basis: lq.basis, checkOutAt }; }
    else if (out.hotel) out.hotel = { ...out.hotel, nights: q.nights, price: out.hotel.price + q.stay, checkOutAt };
    if (out.let || out.hotel) {
      cancelKind(CHECKOUT_KIND, 'journeyId', out.id);
      s.schedule({ at: checkOutAt, kind: CHECKOUT_KIND, label: out.let ? 'Holiday Let Check-Out' : 'Hotel Check-Out', category: 'personal', priority: 26, payload: { personId: person.id, journeyId: out.id, cityId: back.fromCity } });
    }
    out.total += q.stay;
    // The rental car kept to the new day.
    const car = rentalsOf(person).find((r) => r.returnJourneyId === back.id && (r.status === 'booked' || r.status === 'held' || r.status === 'out'));
    if (car) {
      car.returnAt = leaveAt;
      car.days = rentalDays(car.pickupAt, leaveAt);
      car.paid += q.rental;
      cancelKind(RENTAL_RETURN_KIND, 'rentalId', car.id);
      s.schedule({ at: leaveAt, kind: RENTAL_RETURN_KIND, label: 'Rental Car Return', category: 'personal', priority: 27, payload: { personId: person.id, rentalId: car.id } });
    }
    // The way home, moved.
    back.legs = q.legs;
    back.leaveAt = leaveAt;
    back.arriveAt = q.legs[q.legs.length - 1]!.arriveAt;
    back.total += q.travel;
    cancelKind(LEAVE_KIND, 'journeyId', back.id);
    s.schedule({ at: leaveAt, kind: LEAVE_KIND, label: `To ${CITIES.require(back.toCity).name}`, category: 'personal', priority: 28, requiresPlayer: true, durationMinutes: Math.round((back.arriveAt - leaveAt) / 60_000), locationId: back.fromCity, payload: { personId: person.id, journeyId: back.id } });
    return { total: q.total, leaveAt };
  });

  sim.onCommand<{ journeyId: string }, { refund: Money }>('travel.cancel', (p, { sim: s }) => {
    const person = s.player;
    const j = journeysOf(person).find((x) => x.id === p?.journeyId);
    if (!j || j.status !== 'booked') throw new CommandError('That isn’t a journey you have booked.');
    // A round trip is one ticket: canceled, both halves go, the way home too once the way out is flown.
    const halves = [j, ...[partnerOf(person, j)].filter((x): x is Journey => x !== undefined && x.status === 'booked')];
    const first = halves.reduce((a, b) => (a.leaveAt <= b.leaveAt ? a : b));
    // The DOT's rule: canceled within 24 hours of booking, a week or more before it leaves, the whole fare back.
    // A hotel on a flexible rate comes back until a day before arrival.
    const free = s.now - first.bookedAt <= 24 * MS_HOUR && first.leaveAt - first.bookedAt >= 7 * MS_DAY;
    let refund = 0;
    for (const h of halves) {
      const hotelBack = (h.hotel ? hotelRefund(h.hotel, h.arriveAt, s.now) : 0) + (h.let ? letRefund(h.let, h.arriveAt, s.now) : 0);
      const route = railRouteById(h.by);
      // A drive not yet driven has burned nothing: all of its costs come back.
      // A charter canceled ahead: SLATE's, as no operator's terms were read.
      if (h.by?.startsWith('car:') || h.by === 'rental' || h.by === 'fly' || h.by === 'jet' || h.by === 'chauffeur') refund += total(h.legs) + hotelBack;
      else if (route) refund += trainRefund(s, h, route) + hotelBack;
      else refund += free ? h.total : hotelBack;
      h.status = 'canceled';
      for (const item of s.universe.scheduled) if (item.status === 'pending' && item.payload.journeyId === h.id) s.timeline.cancel(item.id, s.now);
    }
    if (refund > 0) s.post({ memo: `A ${halves.length > 1 ? 'round trip' : 'journey'} canceled, refunded`, category: 'travel', postings: refundPostings(s, person, refund) });
    // Called off in hospital or laid up hurt, travel insurance pays what didn't come back (`systems/travelinsurance.ts`).
    const claimed = claimCancellation(s, person, first, halves.reduce((a, h) => a + (h.paidBy === 'production' ? 0 : h.total), 0) - refund, s.now);
    return { refund: refund + claimed };
  });

  sim.onSchedule(LEAVE_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const j = person ? journeysOf(person).find((x) => x.id === item.payload.journeyId) : undefined;
    if (!person || !j || j.status !== 'booked') return;
    const mine = person.id === s.universe.playerId;
    const tell = (title: string, body: string) => { if (mine) s.notify({ category: 'personal', title, body, importance: 70 }); };
    if (!present(person, item.at, j.fromCity)) {
      j.status = 'missed';
      j.why = 'You weren’t there to leave.';
      const hotelBack = missedHotel(s, person, j);
      const back = partnerOf(person, j);
      const forfeited = forfeitReturn(s, person, j);
      tell('Journey Missed', `${j.why} The fare is gone${forfeited ? ', and the airline canceled the way home with it, as it does a round trip whose first flight goes unflown' : ''}.`);
      // In hospital or laid up hurt, travel insurance pays back what was lost (`systems/travelinsurance.ts`).
      const lost = (j.paidBy === 'production' ? 0 : j.total - hotelBack) + (forfeited && back && back.paidBy !== 'production' ? back.total : 0);
      claimCancellation(s, person, j, lost, item.at);
      return;
    }
    // At the airport, as the airline checks: the papers the far end asks.
    const no = crossingRefusal(person, j.fromCity, j.toCity, j.arriveAt, Math.max(1, j.hotel?.nights ?? 1));
    if (no) {
      j.status = 'missed';
      j.why = `The airline wouldn’t board you: ${no}`;
      missedHotel(s, person, j);
      tell('Refused At Check-In', `${j.why} The fare is gone${forfeitReturn(s, person, j) ? ', and the way home with it' : ''}.`);
      return;
    }
    // Leaving a let: its host's claim, where there is one.
    if (person.stay?.kind === 'let' && person.stay.cityId === j.fromCity && letDamaged(s, person, j.id)) {
      const claim = inSave(s, LET_DAMAGE.usd, 'USD');
      if (!payFromBank(s, person, claim, 'A holiday let’s damage claim, through the host’s platform', 'travel')) owe(s, person, claim, 'A holiday let’s damage claim', 'travel');
      if (mine) s.notify({ category: 'personal', title: 'A Damage Claim', body: `The let’s host claimed for damage, and the platform charged ${formatMoney(claim, saveCurrency(s.universe))} to you.`, importance: 65 });
    }
    // The airline's ID outside America (`systems/identity.ts`): without it, not boarded.
    const noId = boardingIdRefusal(person, j, s.now);
    if (noId) {
      j.status = 'missed';
      j.why = `Not boarded without it: ${noId}`;
      missedHotel(s, person, j);
      tell('Refused At Check-In', `${j.why} The fare is gone${forfeitReturn(s, person, j) ? ', and the way home with it' : ''}.`);
      return;
    }
    // An American airline's checkpoint: a REAL ID or a passport, or ConfirmID (`systems/identity.ts`).
    atTheCheckpoint(s, person, j);
    fly(s, person, j);
    const late = j.lateMinutes ?? 0;
    const rebooked = j.rebooked === true;
    if (rebooked || late > 15) tell(rebooked ? 'A Flight Canceled' : 'A Flight Late', rebooked ? `The airline put you on the next one: you’ll arrive about ${Math.round(late / 60)} hours late.` : `You’ll arrive about ${late} minutes late.`);
  });

  sim.onCommand<{ journeyId: string }, { paid: Money }>('travel.pay_deposit', (p, { sim: s }) => {
    const person = s.player;
    const no = depositRefusal(s, person, String(p?.journeyId));
    if (no) throw new CommandError(no);
    const j = journeysOf(person).find((x) => x.id === p.journeyId)!;
    const due = j.hotel!.depositDue!;
    if (!payFromBank(s, person, due, `${hotelById(j.hotel!.named!.hotelId)?.name ?? 'The hotel'}, the deposit held`, 'travel')) throw new CommandError('Your bank declined the payment.');
    j.hotel!.deposit = due;
    delete j.hotel!.depositDue;
    delete j.hotel!.heldUntil;
    // The key, and the room.
    if (person.stay?.kind === 'hotel' && person.stay.cityId === j.toCity) delete person.stay.out;
    for (const one of s.universe.scheduled) if (one.status === 'pending' && one.kind === DEPOSIT_DUE_KIND && one.payload.journeyId === j.id) s.timeline.cancel(one.id, s.now);
    return { paid: due };
  });

  sim.onSchedule(DEPOSIT_DUE_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const j = person ? journeysOf(person).find((x) => x.id === item.payload.journeyId) : undefined;
    if (!person || !j?.hotel?.depositDue) return;
    // Given up: what the hotel's terms give back comes back, as a cancellation on the day would (`hotelRefund`).
    const back = hotelRefund(j.hotel, j.arriveAt, s.now);
    if (back > 0) s.post({ memo: 'A hotel stay given up, the deposit unpaid', category: 'travel', postings: refundPostings(s, person, back) });
    j.hotel.forfeited = true;
    delete j.hotel.depositDue;
    delete j.hotel.heldUntil;
    for (const one of s.universe.scheduled) if (one.status === 'pending' && one.kind === CHECKOUT_KIND && one.payload.journeyId === j.id) s.timeline.cancel(one.id, s.now);
    if (person.stay?.kind === 'hotel' && person.stay.cityId === j.toCity) person.stay = { kind: 'sofa', cityId: j.toCity };
    if (person.id === s.universe.playerId) s.notify({ category: 'personal', title: 'Hotel Stay Given Up', body: `Unpaid, the deposit cost you the room: it went to another guest${back > 0 ? `, and ${formatMoney(back, saveCurrency(s.universe))} came back` : ''}. A friend’s sofa until you leave.`, importance: 85, route: '/workspace/travel' });
  });

  sim.onSchedule(CHECKOUT_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    if (person) checkOut(s, person, String(item.payload.cityId), String(item.payload.journeyId));
  });

  sim.onSchedule(ARRIVE_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const j = person ? journeysOf(person).find((x) => x.id === item.payload.journeyId) : undefined;
    if (!person || !j || j.status !== 'underway') return;
    j.status = 'arrived';
    // The body keeps the clock it left with (`systems/jetlag.ts`).
    arrive(person, CITIES.require(j.fromCity).timeZone, CITIES.require(j.toCity).timeZone, s.now);
    // Driven: the car is there now, and the road brought what it brought (`systems/driving.ts`).
    const driven = j.legs.find((l) => l.mode === 'drive');
    const car = driven ? vehiclesOf(person).find((x) => `car:${x.id}` === driven.routeId) : undefined;
    if (driven && car) {
      const km = roadKm(j.fromCity, j.toCity);
      car.at = j.toCity;
      const towed = j.towing ? caravansOf(person).find((c) => c.id === j.towing) : undefined;
      if (towed) towed.at = j.toCity === towed.cityId ? undefined : j.toCity;
      car.km = (car.km ?? 0) + km;
      drive(s, person, car.jurisdiction, km, s.now, j.id, kindOf(modelById(car.modelId)!), tireFactor(car, s.now));
      if (car.winterTires && inWinterSeason(s.now, j.fromCity)) car.winterTires.km += km;
    }
    if (driven?.routeId?.startsWith('rental:')) rentalDriven(s, person, driven.routeId, j.fromCity, j.toCity, j.id);
    // One's own plane: there now, its hours on the engine (`systems/aviation.ts`).
    const flown = j.legs.find((l) => l.mode === 'fly' && l.routeId === 'own');
    if (flown) ownFlown(person, j.fromCity, j.toCity, (flown.arriveAt - flown.departAt) / 3_600_000);
    moveTo(person, j.toCity);
    if (person.id === s.universe.playerId) s.universe.currentZone = CITIES.require(j.toCity).timeZone;
    if (person.home?.cityId === j.toCity) delete person.stay;
    else if (j.onArrival) person.stay = j.onArrival;
    else if (ownPlaceIn(person, j.toCity)) person.stay = { kind: 'own', cityId: j.toCity };
    else if (j.let) {
      person.stay = { kind: 'let', cityId: j.toCity, unit: drawRental(s, person, j.toCity, false, s.now) };
      s.schedule({ at: j.let.checkOutAt, kind: CHECKOUT_KIND, label: 'Holiday Let Check-Out', category: 'personal', priority: 26, payload: { personId: person.id, journeyId: j.id, cityId: j.toCity } });
    } else if (j.hotel) {
      person.stay = { kind: 'hotel', cityId: j.toCity };
      // A named hotel's deposit, held at arrival and returned at check-out (`depositFor`, from 2026-10-01).
      const deposit = j.hotel.named ? depositFor(s, j.hotel.named.hotelId, j.hotel.nights) : 0;
      if (deposit > 0 && payFromBank(s, person, deposit, `${hotelById(j.hotel.named!.hotelId)!.name}, the deposit held`, 'travel')) j.hotel.deposit = deposit;
      else if (deposit > 0) {
        // The bank can't cover the deposit: the room is held, not given, until the day ends (from 2026-10-02; until
        // then the stay was granted whether the deposit was paid or not).
        holdForDeposit(s, person, j, deposit);
      }
      s.schedule({ at: j.hotel.checkOutAt, kind: CHECKOUT_KIND, label: 'Hotel Check-Out', category: 'personal', priority: 26, payload: { personId: person.id, journeyId: j.id, cityId: j.toCity } });
    }
    if (person.id === s.universe.playerId) s.notify({ category: 'personal', title: `In ${CITIES.require(j.toCity).name}`, body: `${j.lateMinutes ? `${j.lateMinutes} minutes late. ` : ''}You’re here.`, importance: 55 });
  });
}

/**
 * What a train ticket canceled brings back, by its operator's rule
 * (`content/rail.ts`): all of it within its free window after buying; else,
 * before its last hour, the fare less the share kept and the fee; else
 * nothing. A rule whose last hour is nought runs to midnight before the day.
 */
export function trainRefund(sim: Simulation, j: Journey, route: import('../content/rail').RailRoute): Money {
  const fare = total(j.legs);
  const r = route.refund;
  if (r.freeWithinHours !== undefined && sim.now - j.bookedAt <= r.freeWithinHours * MS_HOUR) return fare;
  if (r.keepShare >= 1) return 0;
  let last = j.leaveAt;
  if (r.untilHoursBefore === 0) { const z = CITIES.require(j.fromCity).timeZone; const p = zonedParts(j.leaveAt, z); last = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: 0 }, z); }
  else if (r.untilHoursBefore !== undefined) last = j.leaveAt - r.untilHoursBefore * MS_HOUR;
  if (sim.now >= last) return 0;
  const cur = saveCurrency(sim.universe);
  const fee = r.fee ? (exchange(r.fee, r.feeCurrency ?? route.fare.currency, cur) ?? r.fee) : 0;
  return Math.max(0, Math.round(fare * (1 - r.keepShare)) - fee);
}

/** Check-out: gone from the town, nothing; still there and not home, another night at the rate, or a friend's sofa if the bank can't pay for it. */
export const DEPOSIT_DUE_KIND = 'travel.deposit_due';

/** The room held for a deposit the bank couldn't cover: no key until it's paid, and given up when the day ends. */
function holdForDeposit(sim: Simulation, person: Person, j: Journey, deposit: Money): void {
  const zone = CITIES.require(j.toCity).timeZone;
  j.hotel!.depositDue = deposit;
  // Until the day ends, or the next one for an arrival in its last six hours, so a late flight is not given up in minutes.
  j.hotel!.heldUntil = startOfNextDay(sim.now + 6 * MS_HOUR, zone);
  person.stay = { kind: 'hotel', cityId: j.toCity, out: true };
  sim.schedule({ at: j.hotel!.heldUntil, kind: DEPOSIT_DUE_KIND, label: 'Hotel Deposit Due', category: 'personal', priority: 25, payload: { personId: person.id, journeyId: j.id } });
  if (person.id === sim.universe.playerId) sim.notify({ category: 'personal', title: 'Room Held For A Deposit', body: `${hotelById(j.hotel!.named!.hotelId)?.name ?? 'The hotel'} needs a deposit of ${formatMoney(deposit, saveCurrency(sim.universe))} that the bank can’t cover. The room is held until the end of the day; pay it on Travel, or the stay is given up.`, importance: 85, route: '/workspace/travel' });
}

/** Why a held room's deposit can't be paid now, or nothing. */
export function depositRefusal(sim: Simulation, person: Person, journeyId: string): string | undefined {
  const j = journeysOf(person).find((x) => x.id === journeyId);
  if (!j?.hotel?.depositDue) return 'No deposit is due on that stay.';
  if (j.hotel.heldUntil !== undefined && sim.now >= j.hotel.heldUntil) return 'Too late: the hold has run out.';
  if (inTheBank(sim, person) < j.hotel.depositDue) return `A deposit of ${formatMoney(j.hotel.depositDue, saveCurrency(sim.universe))} is more than the bank holds.`;
  return undefined;
}

function checkOut(sim: Simulation, person: Person, cityId: string, journeyId: string): void {
  // The deposit comes back at check-out, wherever they are (`depositFor`, from 2026-10-01).
  const held = journeysOf(person).find((j) => j.id === journeyId)?.hotel;
  if (held?.deposit) {
    sim.post({ memo: 'The hotel’s deposit, returned', category: 'travel', postings: refundPostings(sim, person, held.deposit) });
    held.returned = held.deposit;
    delete held.deposit;
  }
  if (person.currentLocationId !== cityId || (person.stay?.kind !== 'hotel' && person.stay?.kind !== 'let') || person.home?.cityId === cityId) return;
  // Leaving town that day, checked out and on their way: no night more. Until 2026-09-30 a way home leaving the
  // morning of check-out, or in the afternoon after it, was charged another night, every trip.
  const zone = CITIES.require(cityId).timeZone;
  const today = zonedParts(sim.now, zone);
  const leavesToday = journeysOf(person).some((j) => (j.status === 'booked' || j.status === 'underway') && j.fromCity === cityId && (() => { const p = zonedParts(j.leaveAt, zone); return p.year === today.year && p.month === today.month && p.day === today.day; })());
  // The room is gone until they leave (`roomGone`, from 2026-10-02).
  if (leavesToday) { person.stay.out = true; return; }
  // A let's last morning with no way out yet: a hotel from here, as a hotel's guest stays on.
  if (person.stay.kind === 'let') person.stay = { kind: 'hotel', cityId };
  // Another journey out before the next check-out takes them; the night before it is still the hotel's.
  // At the named hotel's own rate where it's one (`namedStayQuote`, from 2026-10-01), the town's otherwise.
  const named = held?.named ? namedStayQuote(sim, held.named.hotelId, held.named.room, held.plan ?? 'flexible', sim.now, 1) : undefined;
  const night = named ? { price: named.price } : stayPrice(sim, cityId, 1);
  const mine = person.id === sim.universe.playerId;
  if (night && payFromBank(sim, person, night.price, `Another night in a hotel in ${CITIES.require(cityId).name}`, 'travel')) {
    sim.schedule({ at: checkOutAfter(cityId, sim.now, 1, checkOutHourOf(held?.named?.hotelId)), kind: CHECKOUT_KIND, label: 'Hotel Check-Out', category: 'personal', priority: 26, payload: { personId: person.id, journeyId, cityId } });
    if (mine) sim.notify({ category: 'personal', title: 'Another Night', body: `Still in ${CITIES.require(cityId).name}: the hotel keeps you another night, ${formatMoney(night.price, saveCurrency(sim.universe))}.`, importance: 45 });
    return;
  }
  person.stay = { kind: 'sofa', cityId };
  if (mine) sim.notify({ category: 'personal', title: 'Out Of The Hotel', body: `The bank can’t cover another night in ${CITIES.require(cityId).name}: a friend’s sofa until you leave.`, importance: 70 });
}

/** An unflown way out cancels a round trip's way home, as airlines cancel the rest of a ticket after a no-show; true if it did. */
function forfeitReturn(sim: Simulation, person: Person, j: Journey): boolean {
  const back = partnerOf(person, j);
  if (!back || back.status !== 'booked' || back.leaveAt < j.leaveAt) return false;
  back.status = 'canceled';
  back.why = 'The way out went unflown.';
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.payload.journeyId === back.id) sim.timeline.cancel(item.id, sim.now);
  return true;
}

/** A refund into the current account, from what the journey was paid to. */
function refundPostings(sim: Simulation, person: Person, amount: Money) {
  const account = Object.values(sim.universe.accounts).find((a) => a.ownerId === person.id && !a.nominal && !a.closedAt && a.kind === 'checking');
  if (!account) throw new CommandError('There’s no account to refund to.');
  return [{ accountId: account.id, amount }, { accountId: sim.nominalAccount('expense', expenseFor('travel')).id, amount: -amount }];
}

// ---------------------------------------------------------------------------
// Staying longer (stage 8c, from 2026-09-30).

/**
 * What staying longer costs, or why it can't be done: the way home moved to a
 * later day, and the stay and any rental car carried to it.
 * - By air within the United States, the fare difference and no fee: United,
 *   Delta and American ended change fees on domestic economy tickets in
 *   August 2020. A cheaper fare leaves a credit with the airline, which
 *   SLATE doesn't keep. Abroad, no carrier's change fee was researched, so
 *   an airline's way home abroad isn't moved.
 * - By train, the old ticket refunded on its own terms and a new one bought.
 * - Driven, flown oneself or chartered, the old way home refunded and the new
 *   one paid, its costs falling when it's taken.
 * - The hotel's or the let's added nights at their price (a let within its
 *   town's cap), and the rental car's added days at its company's terms.
 */
export interface Extension { legs: JourneyLeg[]; travel: Money; stay: Money; rental: Money; total: Money; nights: number }

export function extendQuote(sim: Simulation, person: Person, backId: string, day: Instant, slot: number): Extension | string {
  const back = journeysOf(person).find((x) => x.id === backId);
  if (!back || back.status !== 'booked') return 'That isn’t a way home you have booked.';
  const out = partnerOf(person, back);
  if (!out || person.currentLocationId !== back.fromCity) return 'A stay is made longer once you’re there.';
  const air = !back.by;
  const fee = air ? changeFee(sim, back.fromCity, back.toCity, back.leaveAt) : 0;
  if (fee === undefined) return 'SLATE keeps no airline’s change fee for this flight, so it isn’t moved.';
  const planned = planBy(sim, back.by, back.fromCity, back.toCity, day, slot, back.bags, back.cabin ?? 'economy');
  if (typeof planned === 'string') return planned;
  const legs = air ? asRoundTrip(planned) : planned;
  if (legs[0]!.departAt <= back.leaveAt) return 'Staying longer goes home later than now.';
  const clash = clashWith(sim, person, back.leaveAt, legs[legs.length - 1]!.arriveAt, back.id);
  if (clash) return `It runs into ${clash}.`;
  const old = total(back.legs);
  const route = railRouteById(back.by);
  const travel = air ? fee! + Math.max(0, total(legs) - old) : route ? total(legs) - trainRefund(sim, back, route) : total(legs) - old;
  const nights = nightsBetween(back.fromCity, out.arriveAt, legs[0]!.departAt);
  let stay = 0;
  if (out.let) {
    const q = letQuote(sim, back.fromCity, nights);
    if (typeof q === 'string') return q;
    stay = q.price - out.let.price;
  } else if (out.hotel) {
    // The longer stay at the same kind and plan; the parking with it for the nights added.
    const per = out.hotel.parking ? Math.round(out.hotel.parking / out.hotel.nights) : 0;
    const longer = stayPrice(sim, back.fromCity, nights, 1, out.hotel.cls ?? 'hotel', out.hotel.plan ?? 'flexible', residentOf(person, back.fromCity), out.arriveAt);
    // A street's nights run out (`STREET_NIGHTS`).
    if (!longer) return streetRefusal(back.fromCity, nights) ?? 'The stay can’t run longer.';
    stay = longer.price + per * nights - out.hotel.price;
  }
  const car = rentalsOf(person).find((r) => r.returnJourneyId === back.id && (r.status === 'booked' || r.status === 'held' || r.status === 'out'));
  let rental = 0;
  if (car) {
    const q = rentalQuote(sim, person, car.cityId, car.pickupAt, legs[0]!.departAt, true, car.waived === true, car.cls ?? 'small');
    if (typeof q === 'string') return q;
    rental = q.total - car.paid;
  }
  return { legs, travel, stay, rental, total: travel + stay + rental, nights };
}

/** The departure a journey was booked on, as `planBy`'s slot: the airline's or the train's of the day, or the hour from 7 AM. */
export function slotOf(j: Journey): number {
  const zone = CITIES.require(j.fromCity).timeZone;
  const route = railRouteById(j.by);
  const first = j.legs.find((l) => l.mode === 'flight' || l.mode === 'train' || l.mode === 'bus' || l.mode === 'ferry' || l.mode === 'fly') ?? j.legs[0]!;
  const at = zonedParts(first.departAt, zone);
  const hour = at.hour + at.minute / 60;
  const hours: readonly number[] | undefined = route ? departureHours(route) : !j.by ? AIR.departureHours : undefined;
  if (!hours) return Math.max(0, Math.round(hour) - 7);
  let best = 0;
  hours.forEach((h, i) => { if (Math.abs(h - hour) < Math.abs(hours[best]! - hour)) best = i; });
  return best;
}

/**
 * A damage claim against a guest leaving a holiday let, from 2026-09-30
 * (`docs/research/world/research-credit-damage-movers.json`): about 0.02% of
 * Airbnb's reservations end in a damage reimbursement of $1,000 or more
 * (Airbnb, 2023), the one platform-wide figure published, so a let left
 * draws that, and the claim is the band's least, $1,000. The host files it
 * within 14 days of check-out, the guest has 24 hours to answer, and Airbnb
 * charges the guest's payment method; SLATE charges it as the let is left.
 * One manager's figure of claims on 0.71% of Airbnb bookings covers every
 * size, with no amounts, and isn't taken.
 */
export const LET_DAMAGE = { share: 0.0002, usd: 1_000 } as const;

/** Whether a stay in a let ends in a claim (decider `travel.let_damage`). */
export const letDamaged = (sim: Simulation, person: Person, journeyId: string): boolean => sim.rng('travel.let_damage', person.id, journeyId).next() < LET_DAMAGE.share;

/**
 * An airline's fee to move a flight, from 2026-09-30, in the save's money, or
 * nothing where none is kept (`docs/research/world/research-travel-aviation-boats.json`).
 * SLATE's flights name no airline, so a flight's carrier is taken as the one
 * whose fees are published for it: within the United States none, since
 * United, Delta and American ended domestic change fees in 2020; to or from
 * Ireland Aer Lingus's online fee, €40 short-haul and €100 across the
 * Atlantic; within Canada Air Canada's Standard fare, the middle of its
 * C$100 to C$120. The fare's difference is paid on top wherever it's dearer.
 * From 2026-10-01 (`docs/research/world/research-rentals-lets-charters-2.json`):
 * within Britain British Airways' £60 on a Euro Traveller fare, read from its
 * own text as a search engine holds it and from Head for Points, ba.com
 * showing only its queue; and between the United States and Mexico
 * Aeroméxico's Classic fare, whose first change is free, read the same way
 * while its site was down. British Airways' long-haul fee and a change within
 * Mexico weren't found, and nothing moved those. From later on 2026-10-01
 * (`docs/research/world/research-open-final.json`) a change within Mexico is
 * Volaris's, from its own fee table of 22 September 2026: MX$850 more than 15
 * days before the flight, MX$1,100 within them.
 */
export function changeFee(sim: Simulation, fromCity: string, toCity: string, flightAt: Instant): Money | undefined {
  const a = isoOfCity(fromCity);
  const b = isoOfCity(toCity);
  const cur = saveCurrency(sim.universe);
  const money = (units: number, currency: string) => { const c = Math.round(units * 100); return cur === currency ? c : exchange(c, currency, cur) ?? c; };
  if (a === 'US' && b === 'US') return 0;
  if (a === 'IE' || b === 'IE') {
    const other = a === 'IE' ? b : a;
    return other === 'US' || other === 'CA' ? money(100, 'EUR') : money(40, 'EUR');
  }
  if (a === 'CA' && b === 'CA') return money(110, 'CAD');
  if (a === 'GB' && b === 'GB') return money(60, 'GBP');
  if ((a === 'US' && b === 'MX') || (a === 'MX' && b === 'US')) return 0;
  if (a === 'MX' && b === 'MX') return money(flightAt - sim.now > 15 * MS_DAY ? 850 : 1_100, 'MXN');
  return undefined;
}

/**
 * A car and driver between towns by road, from 2026-10-01
 * (`docs/research/world/research-charter.json`): each city's company that
 * prints an hourly rate for a sedan, billed for the hours on the road, at
 * least its minimum, with its taxes. New York: Gotham Ride's $117 an hour,
 * two at least, its gratuity and tolls in. London: iChauffeur's £60, three
 * at least, with VAT. Dublin: All City Chauffeurs' €70, four at least (its
 * page last dated 2022). Toronto: Rosedale Limousine's C$78, two at least,
 * with Ontario's HST. Vancouver: the middle of the C$75 to C$150 the
 * Passenger Transportation Board allows a sedan limousine, with GST. Mexico
 * City: Safe&Confidence's MX$5,400 for ten hours and MX$450 each after, with
 * IVA. The car's way back, which a company prices by quote, isn't kept, nor
 * any company in Los Angeles or New Haven, whose rates were read only
 * secondhand or not at all.
 */
export interface Chauffeur { company: string; currency: string; perHour: number; minHours: number; tax: number; packageHours?: number; packagePrice?: number }
export const CHAUFFEURS: Readonly<Record<string, Chauffeur>> = {
  'us-ny-newyork': { company: 'Gotham Ride', currency: 'USD', perHour: 117, minHours: 2, tax: 0 },
  'uk-eng-london': { company: 'iChauffeur', currency: 'GBP', perHour: 60, minHours: 3, tax: 0.2 },
  'ie-lei-dublin': { company: 'All City Chauffeurs', currency: 'EUR', perHour: 70, minHours: 4, tax: 0 },
  'ca-on-toronto': { company: 'Rosedale Limousine', currency: 'CAD', perHour: 78, minHours: 2, tax: 0.13 },
  'ca-bc-vancouver': { company: 'a Vancouver sedan limousine', currency: 'CAD', perHour: 112.5, minHours: 1, tax: 0.05 },
  'mx-cmx-mexicocity': { company: 'Safe&Confidence', currency: 'MXN', perHour: 450, minHours: 10, tax: 0.16, packageHours: 10, packagePrice: 5_400 },
};

/** What a car and driver bills for so many hours, before its taxes, in its money. */
export function chauffeurUnits(c: Chauffeur, hours: number): number {
  if (c.packageHours !== undefined && c.packagePrice !== undefined) return c.packagePrice + Math.max(0, Math.ceil(hours - c.packageHours)) * c.perHour;
  return Math.max(c.minHours, hours) * c.perHour;
}

/** A journey's leg in a hired car with its driver, or why not. */
export function planChauffeur(sim: Simulation, fromCity: string, toCity: string, day: Instant, slot: number): JourneyLeg[] | string {
  const c = CHAUFFEURS[fromCity];
  if (!c) return 'SLATE keeps no company’s car and driver where you’re leaving from.';
  if (!byRoad(fromCity, toCity)) return 'No road joins those towns.';
  const zone = CITIES.require(fromCity).timeZone;
  const p = zonedParts(day, zone);
  const depart = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: 7 + Math.max(0, Math.min(14, slot)) }, zone);
  const km = roadKm(fromCity, toCity);
  const minutes = driveMinutes(km);
  // Across to Vancouver Island the driver's hours run on through the sailing, and the car and driver pay BC Ferries' fare.
  const ferry = crossesByCarFerry(fromCity, toCity);
  const hours = (minutes + (ferry ? CAR_FERRY.minutes : 0)) / 60;
  const units = chauffeurUnits(c, hours) * (1 + c.tax);
  const ferryFare = ferry ? inSave(sim, (CAR_FERRY.vehicle + CAR_FERRY.driver) * (1 + CAR_FERRY.surcharge), CAR_FERRY.currency) : 0;
  return [{ mode: 'drive', from: fromCity, to: toCity, departAt: depart, arriveAt: depart + hours * 3_600_000, fare: inSave(sim, units, c.currency) + ferryFare, routeId: 'chauffeur', basis: `${Math.round(km)} km by road with ${c.company}’s car and driver, ${(minutes / 60).toFixed(1)} hours billed at its ${c.minHours > 1 && !c.packageHours ? `least of ${c.minHours}, ` : ''}hourly rate${c.tax ? ', with its tax' : ''}.` }];
}
