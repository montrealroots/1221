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
import { planRentalDrive, rentalDriven } from './rentals';
import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, MS_HOUR, formatDate, formatTime, instantFromZoned, zonedParts, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES, distanceKm } from '../content/geography';
import { expenseFor } from './household';
import { AIR, fareUsd, groundLeg } from '../content/air';
import { payFromBank } from './household';
import { present } from './career';
import { crossingRefusal, isoOfCity , mayDrive } from './documents';
import { itinerary, tripAirportFor, type Airport } from './airports';
import { nightRateFor, ownPlaceIn, stayPrice } from './stays';
import { arrive } from './jetlag';
import { byRoad, drive, driveMinutes, roadKm, ROAD, tollsUsd } from './driving';
import { modelById, runningCost, vehiclesOf } from './vehicles';
import { fareOf, planTrain, railRouteById, railRoutes, trainFateOf } from './rail';

export type LegMode = 'ground' | 'check-in' | 'flight' | 'train' | 'bus' | 'drive' | 'arrival';
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
  hotel?: { nights: number; price: Money; basis: string; checkOutAt: Instant };
  /** A holiday let there instead (`content/lets.ts`, from 2026-09-29): its nights, price and the service fee in it. */
  let?: { nights: number; price: Money; fee: Money; basis: string; checkOutAt: Instant };
  /** Business or first, where not economy (from 2026-09-29). */
  cabin?: Cabin;
  /** By train, the route's id; by air where not said (from 2026-09-29). */
  by?: string;
  /** A trip the career makes (from 2026-09-29): the job's, who paid the fares, and where they sleep on arrival. */
  bookingId?: string;
  paidBy?: 'production' | 'self';
  onArrival?: Person['stay'];
}

export const LEAVE_KIND = 'travel.leave';
export const ARRIVE_KIND = 'travel.arrive';
export const CHECKOUT_KIND = 'travel.checkout';

/** A hotel's check-out, eleven in the morning, SLATE's reading of the usual hour. */
export const CHECKOUT_HOUR = 11;
/** A hotel booked on a flexible rate is refunded until a day before arrival: SLATE's reading of the usual terms. */
export const HOTEL_FREE_UNTIL_HOURS = 24;

/** Check-out after some nights from an arrival, at eleven in the town's time. */
export function checkOutAfter(cityId: string, arriveAt: Instant, nights: number): Instant {
  const zone = CITIES.require(cityId).timeZone;
  const p = zonedParts(arriveAt, zone);
  // A night begins the evening of arrival; one that lands after midnight but before morning is the night before's.
  const firstNight = p.hour < 6 ? p.day - 1 : p.day;
  return instantFromZoned({ year: p.year, month: p.month, day: firstNight + nights, hour: CHECKOUT_HOUR }, zone);
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
function clashWith(sim: Simulation, person: Person, from: Instant, to: Instant): string | undefined {
  const clash = sim.universe.scheduled.find((i) => i.status === 'pending' && i.requiresPlayer === true && (i.payload.personId === undefined || i.payload.personId === person.id)
    && i.at < to && i.at + (i.durationMinutes ?? 60) * 60_000 > from);
  return clash ? `${clash.label}, ${formatDate(clash.at, sim.zone)} at ${formatTime(clash.at, sim.zone)}` : undefined;
}

/** Why a journey can't be booked, or nothing. */
export function bookRefusal(sim: Simulation, person: Person, toCity: string, legs: JourneyLeg[] | string, stayDays: number, nights = 0): string | undefined {
  if (typeof legs === 'string') return legs;
  if (!CITIES.get(toCity)) return 'SLATE doesn’t have that town.';
  if (legs[0]!.departAt <= sim.now) return 'That departure has gone.';
  const from = legs[0]!.from;
  if (!ownPlaceIn(person, toCity)) {
    if (nights <= 0) return `Somewhere to sleep in ${CITIES.require(toCity).name}: book the hotel’s nights with it.`;
    if (!nightRateFor(toCity)) return `SLATE doesn’t have ${CITIES.require(toCity).name}’s hotels yet, and you have no home there.`;
  }
  const border = crossingRefusal(person, from, toCity, legs[legs.length - 1]!.arriveAt, stayDays);
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
    const route = leg.mode === 'train' || leg.mode === 'bus' ? railRouteById(leg.routeId) : undefined;
    if (route) { const fate = trainFateOf(sim, person, route, `${j.id}-${n}`); late += fate.late; if (fate.canceled) rebooked = true; continue; }
    if (leg.mode !== 'flight') continue;
    const fate = flightFate(sim, person, `${j.id}-${n}`);
    if (fate === null) { rebooked = true; late += AIR.rebookHours * 60; } else late += fate;
  }
  j.status = 'underway';
  j.lateMinutes = late;
  j.rebooked = rebooked;
  sim.schedule({ at: j.arriveAt + late * 60_000, kind: ARRIVE_KIND, label: `Arrive In ${CITIES.require(j.toCity).name}`, category: 'personal', priority: 28, payload: { personId: person.id, journeyId: j.id } });
}

/** A journey's legs by air, or by a train's route: `by` is the route's id, or nothing for air. */
export function planBy(sim: Simulation, by: string | undefined, fromCity: string, toCity: string, day: Instant, slot: number, bags: number, cabin: Cabin = 'economy'): JourneyLeg[] | string {
  if (!by || by === 'air') return planJourney(sim, fromCity, toCity, day, slot, bags, cabin);
  if (by.startsWith('car:')) return planDrive(sim, sim.player, by.slice(4), fromCity, toCity, day, slot);
  // A car rented where they are (`systems/rentals.ts`, from 2026-09-29).
  if (by === 'rental') return planRentalDrive(sim, sim.player, fromCity, toCity, day, slot);
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
export function planDrive(sim: Simulation, person: Person, vehicleId: string, fromCity: string, toCity: string, day: Instant, slot: number): JourneyLeg[] | string {
  const v = vehiclesOf(person).find((x) => x.id === vehicleId && x.soldAt === undefined);
  if (!v) return 'That isn’t a car you own.';
  if ((v.at ?? v.cityId) !== fromCity) return `The car is in ${CITIES.require(v.at ?? v.cityId).name}.`;
  if (!byRoad(fromCity, toCity)) return 'No road joins those towns.';
  const may = mayDrive(person, fromCity, day);
  if (!may.ok) return may.why ?? 'You may not drive there.';
  const zone = CITIES.require(fromCity).timeZone;
  const p = zonedParts(day, zone);
  const depart = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: 7 + Math.max(0, Math.min(14, slot)) }, zone);
  const km = roadKm(fromCity, toCity);
  const minutes = driveMinutes(km);
  const cur = saveCurrency(sim.universe);
  const tolls = tollsUsd(fromCity, toCity);
  const fare = runningCost(sim, v, km) + (tolls > 0 ? (cur === 'USD' ? tolls : exchange(tolls, 'USD', cur) ?? tolls) : 0);
  const m = modelById(v.modelId)!;
  return [{ mode: 'drive', from: fromCity, to: toCity, departAt: depart, arriveAt: depart + minutes * 60_000, fare, routeId: `car:${v.id}`, basis: `${Math.round(km)} km by road in the ${m.make} ${m.model}: its fuel and upkeep${tolls > 0 ? ', and the corridor’s tolls' : ', no tolls kept for this road'}. ${ROAD.source}.` }];
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
  const price = rent + fee + Math.round(rent * t.taxRate) + usd(Math.round((t.perNightUsd ?? 0) * 100) * nights);
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

  sim.onCommand<{ toCity: string; day: Instant; slot?: number; bags?: number; nights?: number; returnDay?: Instant; returnSlot?: number; by?: string; cabin?: Cabin }, { journeyId: string; returnId?: string; leaveAt: Instant; arriveAt: Instant; total: Money }>('travel.book', (p, { sim: s }) => {
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
    let back = round ? planBy(s, by, toCity, fromCity, Number(p!.returnDay), Number(p?.returnSlot ?? 0), bags, cabin) : undefined;
    if (typeof out === 'string') throw new CommandError(out);
    if (typeof back === 'string') throw new CommandError(back);
    const arriveOut = out[out.length - 1]!.arriveAt;
    if (back && back[0]!.departAt <= arriveOut) throw new CommandError('The way home leaves before the way out arrives.');
    // A round trip's hotel runs from the night it lands to the morning it flies home.
    const nights = back ? nightsBetween(toCity, arriveOut, back[0]!.departAt) : Math.max(0, Math.min(90, Math.floor(Number(p?.nights ?? 0))));
    const no = bookRefusal(s, person, toCity, out, Math.max(1, nights), nights);
    if (no) throw new CommandError(no);
    if (back) {
      const noBack = bookRefusal(s, person, fromCity, back, 1, 1);
      if (noBack && !/Somewhere to sleep|hotels yet/.test(noBack)) throw new CommandError(`The way home: ${noBack}`);
      // A round trip's discount is the airlines'; a train's return is two singles.
      if (!by) { out = asRoundTrip(out); back = asRoundTrip(back); }
    }
    const hotel = !ownPlaceIn(person, toCity) && nights > 0 ? stayPrice(s, toCity, nights)! : undefined;
    const outCost = total(out) + (hotel?.price ?? 0);
    const cost = outCost + (back ? total(back) : 0);
    if (!payFromBank(s, person, cost, `A ${back ? 'round trip' : 'journey'} to ${CITIES.require(toCity).name}${hotel ? `, and ${nights} ${nights === 1 ? 'night' : 'nights'} in a hotel` : ''}`, 'travel')) throw new CommandError(`${formatMoney(cost, saveCurrency(s.universe))} is more than the bank can cover.`);
    const tripId = back ? s.nextId('journey') : undefined;
    const add = (legs: JourneyLeg[], from: string, to: string, price: Money, stay?: Journey['hotel']): Journey => {
      const id = s.nextId('journey');
      const leaveAt = legs[0]!.departAt;
      const arriveAt = legs[legs.length - 1]!.arriveAt;
      const j: Journey = { id, fromCity: from, toCity: to, legs, status: 'booked', bookedAt: s.now, bags, total: price, leaveAt, arriveAt, ...(by ? { by } : {}), ...(cabin === 'premium' ? { cabin } : {}), ...(tripId ? { tripId } : {}), ...(stay ? { hotel: stay } : {}) };
      journeysOf(person).push(j);
      s.schedule({ at: leaveAt, kind: LEAVE_KIND, label: `To ${CITIES.require(to).name}`, category: 'personal', priority: 28, requiresPlayer: true, durationMinutes: Math.round((arriveAt - leaveAt) / 60_000), locationId: from, payload: { personId: person.id, journeyId: id } });
      return j;
    };
    const first = add(out, fromCity, toCity, outCost, hotel ? { nights, price: hotel.price, basis: hotel.basis, checkOutAt: checkOutAfter(toCity, arriveOut, nights) } : undefined);
    const second = back ? add(back, toCity, fromCity, total(back)) : undefined;
    return { journeyId: first.id, ...(second ? { returnId: second.id } : {}), leaveAt: first.leaveAt, arriveAt: first.arriveAt, total: cost };
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
      const hotelBack = (h.hotel && h.arriveAt - s.now >= HOTEL_FREE_UNTIL_HOURS * MS_HOUR ? h.hotel.price : 0) + (h.let ? letRefund(h.let, h.arriveAt, s.now) : 0);
      const route = railRouteById(h.by);
      // A drive not yet driven has burned nothing: all of its costs come back.
      if (h.by?.startsWith('car:') || h.by === 'rental') refund += total(h.legs) + hotelBack;
      else if (route) refund += trainRefund(s, h, route) + hotelBack;
      else refund += free ? h.total : hotelBack;
      h.status = 'canceled';
      for (const item of s.universe.scheduled) if (item.status === 'pending' && item.payload.journeyId === h.id) s.timeline.cancel(item.id, s.now);
    }
    if (refund > 0) s.post({ memo: `A ${halves.length > 1 ? 'round trip' : 'journey'} canceled, refunded`, category: 'travel', postings: refundPostings(s, person, refund) });
    return { refund };
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
      tell('Journey Missed', `${j.why} The fare is gone${forfeitReturn(s, person, j) ? ', and the airline canceled the way home with it, as it does a round trip whose first flight goes unflown' : ''}.`);
      return;
    }
    // At the airport, as the airline checks: the papers the far end asks.
    const no = crossingRefusal(person, j.fromCity, j.toCity, j.arriveAt, Math.max(1, j.hotel?.nights ?? 1));
    if (no) {
      j.status = 'missed';
      j.why = `The airline wouldn’t board you: ${no}`;
      tell('Refused At Check-In', `${j.why} The fare is gone${forfeitReturn(s, person, j) ? ', and the way home with it' : ''}.`);
      return;
    }
    fly(s, person, j);
    const late = j.lateMinutes ?? 0;
    const rebooked = j.rebooked === true;
    if (rebooked || late > 15) tell(rebooked ? 'A Flight Canceled' : 'A Flight Late', rebooked ? `The airline put you on the next one: you’ll arrive about ${Math.round(late / 60)} hours late.` : `You’ll arrive about ${late} minutes late.`);
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
      car.km = (car.km ?? 0) + km;
      drive(s, person, car.jurisdiction, km, s.now, j.id);
    }
    if (driven?.routeId?.startsWith('rental:')) rentalDriven(s, person, driven.routeId, j.fromCity, j.toCity, j.id);
    person.currentLocationId = j.toCity;
    if (person.id === s.universe.playerId) s.universe.currentZone = CITIES.require(j.toCity).timeZone;
    if (person.home?.cityId === j.toCity) delete person.stay;
    else if (j.onArrival) person.stay = j.onArrival;
    else if (ownPlaceIn(person, j.toCity)) person.stay = { kind: 'own', cityId: j.toCity };
    else if (j.let) {
      person.stay = { kind: 'let', cityId: j.toCity, unit: drawRental(s, person, j.toCity, false, s.now) };
      s.schedule({ at: j.let.checkOutAt, kind: CHECKOUT_KIND, label: 'Holiday Let Check-Out', category: 'personal', priority: 26, payload: { personId: person.id, journeyId: j.id, cityId: j.toCity } });
    } else if (j.hotel) {
      person.stay = { kind: 'hotel', cityId: j.toCity };
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
function checkOut(sim: Simulation, person: Person, cityId: string, journeyId: string): void {
  if (person.currentLocationId !== cityId || (person.stay?.kind !== 'hotel' && person.stay?.kind !== 'let') || person.home?.cityId === cityId) return;
  // A let's last morning with no way out yet: a hotel from here, as a hotel's guest stays on.
  if (person.stay.kind === 'let') person.stay = { kind: 'hotel', cityId };
  // Another journey out before the next check-out takes them; the night before it is still the hotel's.
  const night = stayPrice(sim, cityId, 1);
  const mine = person.id === sim.universe.playerId;
  if (night && payFromBank(sim, person, night.price, `Another night in a hotel in ${CITIES.require(cityId).name}`, 'travel')) {
    sim.schedule({ at: checkOutAfter(cityId, sim.now, 1), kind: CHECKOUT_KIND, label: 'Hotel Check-Out', category: 'personal', priority: 26, payload: { personId: person.id, journeyId, cityId } });
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
