/**
 * SLATE — a journey by train (docs/WORLD.md, stage 2c), from 2026-09-29.
 * The routes, times, fares and punctuality are `content/rail.ts`'s.
 *
 * A train journey's legs are the ride to the station, the time the operator
 * asks you there before the train (with the border first, where it's at the
 * departure, as Eurostar's is), the train, and the ride from the station. The
 * rides to and from the station are by the city's own transit, SLATE's
 * estimate of thirty minutes each, at its single fare (`content/transit.ts`)
 * from 2026-09-29, and free in a town whose fare isn't kept yet, said so. A
 * coach is the same, from its stand. When the
 * day's trains leave is SLATE's model: the operator's weekday count, spread
 * evenly from six in the morning to nine at night.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { instantFromZoned, zonedParts, type Instant } from '../core/time';
import { saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES, distanceKm } from '../content/geography';
import { AMTRAK_PER_MILE, NEC_MILES, RAIL_LATE_MEAN_MINUTES, RAIL_ROUTES, type RailFare, type RailRoute } from '../content/rail';
import type { JourneyLeg } from './journey';
import { TRANSIT } from '../content/transit';
import { rateOn } from '../content/career';

const KM_PER_MILE = 1.609344;
/** The ride to or from a station, by the city's transit: SLATE's estimate. */
export const STATION_RIDE_MINUTES = 30;
const FIRST_HOUR = 6;
const LAST_HOUR = 21;

const miles = (a: string, b: string) => distanceKm(CITIES.require(a), CITIES.require(b)) / KM_PER_MILE;

/** How much longer the corridor runs than the straight line: its two long segments' miles over theirs. */
export function necStretch(): number {
  return (NEC_MILES.newYorkWashington + NEC_MILES.newYorkBoston) / (miles('us-ny-newyork', 'us-dc-washington') + miles('us-ny-newyork', 'us-ma-boston'));
}

/** A route's miles: its own where it has them, else the straight line stretched as the corridor's are, SLATE's estimate. */
export function routeMiles(route: RailRoute): number {
  return route.miles ?? miles(route.from, route.to) * necStretch();
}

/** A route's fare: its own, or, for an Amtrak route without one, the Northeast Regional's by the mile. */
export function fareOf(route: RailRoute): RailFare {
  if (route.fare.amount > 0) return route.fare;
  const m = routeMiles(route);
  return {
    amount: Math.round(AMTRAK_PER_MILE.regional * m * 100),
    currency: 'USD',
    basis: `SLATE’s derivation: Amtrak’s FY2025 Northeast Regional ticket revenue per passenger-mile, $${AMTRAK_PER_MILE.regional.toFixed(3)}, times about ${Math.round(m)} miles, SLATE’s estimate of the route; Amtrak publishes no fares.`,
  };
}

/** The trains between two towns, either way. */
export function railRoutes(fromCity: string, toCity: string): RailRoute[] {
  return RAIL_ROUTES.filter((r) => (r.from === fromCity && r.to === toCity) || (r.from === toCity && r.to === fromCity));
}

/** The hours, local, a route's trains leave in a day: SLATE's model. */
export function departureHours(route: RailRoute): number[] {
  const n = Math.max(1, route.perDay);
  if (n === 1) return [12];
  return Array.from({ length: n }, (_, i) => FIRST_HOUR + ((LAST_HOUR - FIRST_HOUR) * i) / (n - 1));
}

/** The fare for a train leaving at an instant from a town, in its own money: the peak fare on a weekday morning toward New York or out of London, where there is one. */
export function fareAt(route: RailRoute, fromCity: string, at: Instant): { amount: Money; currency: string; basis: string } {
  const fare = fareOf(route);
  const p = zonedParts(at, CITIES.require(fromCity).timeZone);
  const weekday = new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay();
  const isPeak = fare.peak && fromCity === route.from && weekday >= 1 && weekday <= 5 && p.hour >= fare.peak.fromHour && p.hour < fare.peak.toHour;
  return isPeak ? { amount: fare.peak!.amount, currency: fare.currency, basis: fare.peak!.basis } : { amount: fare.amount, currency: fare.currency, basis: fare.basis };
}

/** A train journey's legs, leaving on a day on one of the day's trains. */
export function planTrain(sim: Simulation, route: RailRoute, fromCity: string, day: Instant, slot: number): JourneyLeg[] | string {
  const toCity = route.from === fromCity ? route.to : route.from;
  if (route.from !== fromCity && route.to !== fromCity) return 'That train doesn’t run from there.';
  const hours = departureHours(route);
  const h = hours[Math.max(0, Math.min(hours.length - 1, slot))]!;
  const zone = CITIES.require(fromCity).timeZone;
  const p = zonedParts(day, zone);
  const depart = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: Math.floor(h), minute: Math.round((h % 1) * 60) }, zone);
  const cur = saveCurrency(sim.universe);
  const fare = fareAt(route, fromCity, depart);
  const inSave = cur === fare.currency ? fare.amount : exchange(fare.amount, fare.currency, cur) ?? fare.amount;
  const [fromStation, toStation] = route.from === fromCity ? [route.fromStation, route.toStation] : [route.toStation, route.fromStation];
  const board = depart - route.arriveBeforeMinutes * 60_000;
  const arrive = depart + route.minutes * 60_000;
  const ride = (cityId: string, at: Instant) => {
    const t = TRANSIT[cityId];
    if (!t) return { fare: 0, basis: 'By the town’s transit: SLATE’s estimate of 30 minutes, and its fare not kept yet.' };
    const amount = rateOn(t.steps, new Date(at).toISOString().slice(0, 10));
    return { fare: cur === t.currency ? amount : exchange(amount, t.currency, cur) ?? amount, basis: `By the town’s transit, SLATE’s estimate of 30 minutes: ${t.basis}` };
  };
  const there = ride(fromCity, board);
  const away = ride(toCity, arrive);
  return [
    { mode: 'ground', from: fromCity, to: fromStation, departAt: board - STATION_RIDE_MINUTES * 60_000, arriveAt: board, fare: there.fare, basis: there.basis },
    { mode: 'check-in', from: fromStation, to: fromStation, departAt: board, arriveAt: depart, fare: 0, basis: `${route.arriveBasis}${route.borderBeforeBoarding ? ' The border is here, before boarding.' : ''}` },
    { mode: route.vehicle ?? 'train', from: fromStation, to: toStation, departAt: depart, arriveAt: arrive, fare: inSave, routeId: route.id, basis: `${route.operator}, ${route.service}: ${fare.basis} The time is the timetable’s weekday median; when it leaves is SLATE’s model.` },
    { mode: 'ground', from: toStation, to: toCity, departAt: arrive, arriveAt: arrive + STATION_RIDE_MINUTES * 60_000, fare: away.fare, basis: away.basis },
  ];
}

/**
 * Whether a train or coach is late at the operator's rate, and by how much
 * (late ones a mean of SLATE's twenty minutes past the operator's line), or
 * canceled at the operator's published share, when the next one is taken.
 */
export function trainFateOf(sim: Simulation, person: Person, route: RailRoute, key: string): { late: number; canceled: boolean } {
  const rng = sim.rng('travel.train', person.id, key);
  const x = rng.next();
  if (x < (route.cancelShare ?? 0)) return { late: Math.round(headwayMinutes(route)), canceled: true };
  if (rng.next() < route.onTime.share) return { late: 0, canceled: false };
  return { late: route.onTime.withinMinutes + Math.round(RAIL_LATE_MEAN_MINUTES * -Math.log(1 - rng.next() * 0.999)), canceled: false };
}

/** Minutes late, a cancellation counted as the wait for the next. */
export function trainFate(sim: Simulation, person: Person, route: RailRoute, key: string): number {
  return trainFateOf(sim, person, route, key).late;
}

/** The minutes between a route's departures in SLATE's model of its day. */
export function headwayMinutes(route: RailRoute): number {
  return route.perDay > 1 ? ((LAST_HOUR - FIRST_HOUR) * 60) / (route.perDay - 1) : 24 * 60;
}

export const railRouteById = (id: string | undefined) => RAIL_ROUTES.find((r) => r.id === id);
