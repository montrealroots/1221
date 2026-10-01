/**
 * SLATE — a trip out on errands (Stage 7 of `docs/BACKLOG.md`, from
 * 2026-10-01; the figures in `content/errandtrips.ts`).
 *
 * A trip is a plan of stops in the town you're in, each the same command a
 * screen runs, a shop by its own hours, with a leg on the road before each
 * and one home at the end (`runErrands`). On foot a leg is England's
 * average walk at three miles an hour. By car it's the average trip of its
 * kind at the town's TomTom minutes a kilometer, with its fuel, which is
 * paid at a station: at a fuel stop on the way, or the town's first one at
 * the end. A car's errand kilometers come out of the month's everyday
 * driving, which is the rest of the place's average (`errandKm`), so no
 * kilometer's fuel is paid twice, and carry the road's risks as it does. A stop with the car parked pays its meter
 * for the minutes it took. Somebody you know can come along: the trip's
 * hours are time together (`systems/people.ts`).
 *
 * Not kept: a ticket for an unpaid or overstayed meter, SLATE always
 * paying for the time; how often meters are checked isn't published.
 */

import type { Simulation, CommandResult } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { FUEL_STOP_MINUTES, LEG_KM, METER, MIN_PER_KM, STATIONS, WALK_KM, WALK_KMH, type LegKind } from '../content/errandtrips';
import { spend } from './household';
import { contactsOf } from './people';
import { laidUp } from './repairs';
import { stolenNow } from './theft';
import { mayDrive } from './documents';
import { classFor, forOutings, kindOf, modelById, runningCost, vehiclesOf, type OwnedVehicle } from './vehicles';
import { drive } from './driving';
import { tireFactor } from './tires';

export interface Trip { by: 'car' | 'foot'; vehicleId?: string; passengerId?: string; fuel: Money; km: number }
export interface Stop { kind: string; payload: Record<string, unknown>; leg: LegKind }

const market = (cityId: string): 'na' | 'eu' => (['us', 'ca'].includes(CITIES.get(cityId)?.countryId ?? '') ? 'na' : 'eu');

/** A leg's kilometers and minutes in a town, by car or on foot. */
export function leg(cityId: string, by: 'car' | 'foot', kind: LegKind): { km: number; minutes: number } {
  if (by === 'foot') return { km: WALK_KM, minutes: (WALK_KM / WALK_KMH) * 60 };
  const km = LEG_KM[market(cityId)][kind];
  return { km, minutes: km * (MIN_PER_KM[cityId] ?? 58 / 60) };
}

/** What parking a stop costs in the save's money, or nothing where no rate is published. */
export function meterCost(sim: Simulation, cityId: string, minutes: number): Money {
  const m = METER[cityId];
  if (!m || minutes <= 0) return 0;
  const cents = Math.round((m.perHour * minutes / 60) * 100);
  const cur = saveCurrency(sim.universe);
  return cur === m.currency ? cents : exchange(cents, m.currency, cur) ?? cents;
}

/** Why a trip can't start this way, or nothing. */
export function tripRefusal(sim: Simulation, person: Person, by: 'car' | 'foot', vehicleId?: string, passengerId?: string): string | undefined {
  const here = person.currentLocationId;
  if (by === 'car') {
    const v = vehiclesOf(person).find((x) => x.id === vehicleId && x.soldAt === undefined);
    if (!v) return 'That isn’t a car you own.';
    const m = modelById(v.modelId)!;
    if (forOutings(m)) return 'A bicycle or an ATV isn’t for errands here.';
    if ((v.at ?? v.cityId) !== here) return `The car is in ${CITIES.require(v.at ?? v.cityId).name}.`;
    if (v.repossessed) return 'The lender has the car.';
    if (stolenNow(v, sim.now)) return 'It’s been stolen.';
    const laid = laidUp(v, sim.now);
    if (laid) return laid;
    const may = mayDrive(person, here, sim.now, sim.now, classFor(m), m.cc);
    if (!may.ok) return may.why ?? 'You may not drive here.';
  }
  if (passengerId) {
    const c = contactsOf(person).find((x) => x.id === passengerId);
    if (!c) return 'You don’t know them.';
    if (c.rival) return `${c.name.split(' ')[0]} would rather not.`;
    if (c.cityId !== here) return `${c.name.split(' ')[0]} lives in ${CITIES.require(c.cityId).name}.`;
  }
  return undefined;
}

const carOf = (person: Person, trip: Trip): OwnedVehicle | undefined => (trip.vehicleId ? vehiclesOf(person).find((v) => v.id === trip.vehicleId) : undefined);

function payFuel(sim: Simulation, person: Person, trip: Trip, station: string): Money {
  const paid = trip.fuel;
  if (paid > 0) spend(sim, person, paid, `Fuel at ${station}`, 'vehicle', true);
  trip.fuel = 0;
  return paid;
}

export function registerTrips(sim: Simulation): void {
  // A leg on the road: to the next stop, or home, which ends the trip.
  sim.onCommand<{ to: LegKind | 'home'; by?: 'car' | 'foot'; vehicleId?: string; passengerId?: string }, { minutes: number; km: number }>('errand.go', (p, { sim: s }) => {
    const person = s.player;
    let trip = person.trip;
    if (!trip) {
      if (p?.to === 'home') throw new CommandError('You’re home already.');
      const by = p?.by === 'car' ? 'car' : 'foot';
      const no = tripRefusal(s, person, by, p?.vehicleId, p?.passengerId);
      if (no) throw new CommandError(no);
      trip = person.trip = { by, ...(by === 'car' ? { vehicleId: String(p!.vehicleId) } : {}), ...(p?.passengerId ? { passengerId: String(p.passengerId) } : {}), fuel: 0, km: 0 };
    }
    const here = person.currentLocationId;
    const l = leg(here, trip.by, p?.to === 'errand' ? 'errand' : 'shopping');
    const v = carOf(person, trip);
    if (v) {
      trip.fuel += runningCost(s, v, l.km);
      v.errandKm = (v.errandKm ?? 0) + l.km;
      v.km = (v.km ?? 0) + l.km;
      // And what the road brings, as the month's driving does (`systems/driving.ts`).
      drive(s, person, v.jurisdiction, l.km, s.now, `${v.id}-errand-${s.now}`, kindOf(modelById(v.modelId)!), tireFactor(v, s.now));
    }
    trip.km += l.km;
    s.advanceTo(s.now + Math.round(l.minutes * 60_000));
    const c = trip.passengerId ? contactsOf(person).find((x) => x.id === trip!.passengerId) : undefined;
    if (c) { c.hours += l.minutes / 60; c.lastSeen = s.now; }
    if (p?.to === 'home') {
      if (trip.fuel > 0) payFuel(s, person, trip, (STATIONS[here] ?? ['a station'])[0]!);
      if (c) c.memory.unshift({ at: s.now, what: `Came along on your errands, ${trip.km.toFixed(1)} km` });
      delete person.trip;
    }
    return { minutes: l.minutes, km: l.km };
  });

  // The meter, for the minutes a stop took, with the car parked at it.
  sim.onCommand<{ minutes: number }, { paid: Money }>('errand.park', (p, { sim: s }) => {
    const person = s.player;
    if (!person.trip || person.trip.by !== 'car') throw new CommandError('You aren’t out in the car.');
    const minutes = Math.max(0, Number(p?.minutes) || 0);
    const paid = meterCost(s, person.currentLocationId, minutes);
    if (paid > 0 && !spend(s, person, paid, `Parking, ${METER[person.currentLocationId]!.zone}`, 'vehicle')) throw new CommandError('The meter didn’t take the payment.');
    return { paid };
  });

  // A stop for fuel, at one of the town's stations: the trip's fuel paid there.
  sim.onCommand<{ station?: number }, { paid: Money }>('errand.fuel', (p, { sim: s }) => {
    const person = s.player;
    const trip = person.trip;
    if (!trip || trip.by !== 'car') throw new CommandError('You aren’t out in the car.');
    const stations = STATIONS[person.currentLocationId] ?? [];
    const station = stations[Math.max(0, Math.min(stations.length - 1, Number(p?.station) || 0))] ?? 'a station';
    s.advanceTo(s.now + FUEL_STOP_MINUTES * 60_000);
    return { paid: payFuel(s, person, trip, station) };
  });
}

export interface ErrandRun { done: number; stopped?: { step: number; error: string } }

/**
 * Runs a trip: a leg to each stop and the stop itself, the meter paid for
 * the time the stop took when by car, and the way home, through the
 * executor given. It stops at the first stop that can't be done, and still
 * comes home.
 */
export function runErrands(sim: Simulation, plan: { by: 'car' | 'foot'; vehicleId?: string; passengerId?: string; stops: Stop[] }, exec: (kind: string, payload: Record<string, unknown>) => CommandResult = (kind, payload) => sim.execute({ kind, payload })): ErrandRun {
  let done = 0;
  let stopped: ErrandRun['stopped'];
  for (const [i, stop] of plan.stops.entries()) {
    const go = exec('errand.go', { to: stop.leg, ...(i === 0 ? { by: plan.by, vehicleId: plan.vehicleId, passengerId: plan.passengerId } : {}) });
    if (!go.ok) return { done, stopped: { step: i, error: go.error ?? 'You couldn’t set out.' } };
    const before = sim.now;
    const r = exec(stop.kind, stop.payload);
    if (plan.by === 'car' && stop.kind !== 'errand.fuel') exec('errand.park', { minutes: (sim.now - before) / 60_000 });
    if (!r.ok) { stopped = { step: i, error: r.error ?? 'It couldn’t be done.' }; break; }
    done += 1;
  }
  if (sim.player.trip) exec('errand.go', { to: 'home' });
  return { done, ...(stopped ? { stopped } : {}) };
}
