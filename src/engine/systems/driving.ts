/**
 * SLATE — driving: getting in your car and going somewhere real.
 *
 * From wherever you are, fifty real places within a day's drive — the next
 * town over, the next city, and the ones past it — each with its own clock,
 * weather, prices and taxes when you get there. You need a car, it has to be
 * where you are, and the fuel has to be paid for. The drive takes the time
 * it takes, through the one world clock, and everything on the way happens
 * in order. Any place within range can be searched for by name; the fifty
 * are what is offered before you ask.
 *
 * A car that is driven somewhere is now there. Fly home and it stays behind,
 * which is what cars do.
 *
 * Fuel prices and consumption figures are SLATE's estimates, labelled as
 * such wherever they are shown.
 */

import { CommandError, type Simulation } from '../core/simulation';
import { clamp } from '../core/rng';
import { MS_MINUTE, formatDuration, zoneOffsetMs, MS_HOUR, type Instant } from '../core/time';
import type { Id, Vehicle } from '../domain/model';
import { CITIES, distanceKm, type City } from '../content/geography';
import { VEHICLE_MODELS } from '../content/vehicles';
import { WAITING_ON_DELIVERY, addMileage } from './vehicles';

/** A long day at the wheel. Further than this is a flight, or two days. */
export const MAX_DRIVE_KM = 650;

/** How many places are offered from one spot. */
export const DRIVE_OPTIONS = 50;

/**
 * Roads are not straight lines — but the longer the trip, the straighter the
 * road. A drive across town winds through a grid; a drive between cities is
 * mostly highway. About thirty percent over the crow's flight for a short
 * hop, tapering to eight percent past three hundred kilometres.
 */
function roadFactor(greatCircleKm: number): number {
  return 1.3 - 0.22 * Math.min(1, greatCircleKm / 300);
}

/** Countries that read distance in miles. */
const MILES = new Set(['us', 'uk', 'lr', 'mm']);

export function usesMiles(countryId: string): boolean {
  return MILES.has(countryId);
}

/** Cents per litre of fuel, by country. SLATE's estimates. */
const FUEL_CENTS_PER_LITRE: Record<string, number> = {
  us: 95, ca: 115, mx: 115, uk: 190, ie: 185, fr: 195, de: 195, es: 175, it: 200, nl: 210, be: 190,
  dk: 215, se: 200, no: 215, fi: 205, pl: 160, cz: 165, at: 175, ch: 210, pt: 190, gr: 200, tr: 130,
  ru: 70, au: 125, nz: 165, jp: 120, kr: 130, cn: 120, in: 115, br: 125, ar: 100, cl: 140, co: 75,
  ae: 75, sa: 60, qa: 55, kw: 40, za: 130, ng: 70, eg: 45, th: 115, my: 50, id: 75, ph: 115, vn: 100,
  sg: 215, hk: 300,
};
const DEFAULT_FUEL_CENTS = 140;

/** Cents per kWh at a public charger, by country. SLATE's estimates. */
const CHARGE_CENTS_PER_KWH: Record<string, number> = { us: 17, uk: 40, de: 45, fr: 30, ca: 15, au: 30, jp: 28, cn: 12, no: 35 };
const DEFAULT_CHARGE_CENTS = 25;
const EV_KWH_PER_100KM = 18;

/** Litres per hundred kilometres by segment, before the powertrain. */
const LITRES_PER_100KM: Record<string, number> = {
  compact: 6.5, midsize: 8, fullsize: 10.5, luxury: 10, utility: 11.5, sports: 12, super: 17, commercial: 13,
};

export interface DriveEstimate {
  km: number;
  miles: number;
  minutes: number;
  fuelCents: number;
  crossesZone: boolean;
}

export interface DriveOption extends DriveEstimate {
  city: City;
}

/** Road distance between two places, in km. */
export function roadKm(from: City, to: City): number {
  const direct = distanceKm(from, to);
  return Math.round(direct * roadFactor(direct) * 10) / 10;
}

/**
 * How long a drive takes. Short trips crawl through town; a long one is
 * mostly highway. Ten minutes to find the keys and park at the other end.
 */
export function driveMinutes(km: number): number {
  const average = km <= 25 ? 32 : km <= 120 ? 65 : 92;
  return Math.round((km / average) * 60 + 10);
}

/** What the fuel for a drive costs, for this car in this country. */
export function fuelCostCents(km: number, vehicle: Vehicle | undefined, countryId: string): number {
  if (!vehicle) return 0;
  const model = VEHICLE_MODELS.get(vehicle.catalogId);
  if (vehicle.powertrain === 'ev') {
    const rate = CHARGE_CENTS_PER_KWH[countryId] ?? DEFAULT_CHARGE_CENTS;
    return Math.round((km / 100) * EV_KWH_PER_100KM * rate);
  }
  const base = LITRES_PER_100KM[model?.segment ?? 'midsize'] ?? 8;
  const factor = vehicle.powertrain === 'hybrid' ? 0.6 : vehicle.powertrain === 'phev' ? 0.55 : vehicle.powertrain === 'diesel' ? 0.85 : 1;
  const rate = FUEL_CENTS_PER_LITRE[countryId] ?? DEFAULT_FUEL_CENTS;
  return Math.round((km / 100) * base * factor * rate);
}

/** A drive from here to there, in this car. */
export function estimateDrive(sim: Simulation, from: City, to: City, vehicle?: Vehicle): DriveEstimate {
  const km = roadKm(from, to);
  return {
    km,
    miles: Math.round(km * 0.621371),
    minutes: driveMinutes(km),
    fuelCents: fuelCostCents(km, vehicle, from.countryId),
    crossesZone: zoneOffsetMs(sim.now, from.timeZone) !== zoneOffsetMs(sim.now, to.timeZone),
  };
}

/**
 * How the fifty are chosen: the day's drive is cut into rings of distance —
 * across town, the next city, the region, the far end — and the biggest
 * places in each ring are offered, so the list reaches Las Vegas and San
 * Diego as well as Long Beach, rather than fifty suburbs of where you are.
 */
const DRIVE_RINGS_KM = [40, 120, 300];

/**
 * The places within a drive of here, nearest first.
 *
 * A section of a bigger city — Hollywood, Brooklyn — is not a destination in
 * its own right; you are already in the city it is part of. Only places SLATE
 * has loaded are offered: the bundled cities plus whatever countries have
 * been pulled in. The Travel screen loads the country you are standing in
 * before it asks, so the list is the real neighbourhood. With a `query`, every
 * place in range whose name matches is returned instead of the spread.
 */
export function drivingOptions(
  sim: Simulation,
  fromCityId: string,
  vehicle?: Vehicle,
  options: { limit?: number; maxKm?: number; query?: string } = {},
): DriveOption[] {
  const from = CITIES.get(fromCityId);
  if (!from) return [];
  const limit = options.limit ?? DRIVE_OPTIONS;
  const maxKm = options.maxKm ?? MAX_DRIVE_KM;
  const query = options.query?.trim().toLowerCase() ?? '';

  const near: { city: City; km: number }[] = [];
  for (const city of CITIES.all()) {
    if (city.id === from.id || city.kind === 'section') continue;
    if (query && !city.name.toLowerCase().includes(query)) continue;
    // A cheap bounding box before the real distance: a degree is ~111km.
    const dLat = Math.abs(city.latitude - from.latitude);
    if (dLat * 111 > maxKm) continue;
    const km = roadKm(from, city);
    if (km <= maxKm) near.push({ city, km });
  }
  const byDistance = (a: { city: City; km: number }, b: { city: City; km: number }) => a.km - b.km || b.city.population - a.city.population;

  let chosen: { city: City; km: number }[];
  if (query) {
    chosen = near.sort(byDistance).slice(0, limit);
  } else {
    const rings = [...DRIVE_RINGS_KM.filter((r) => r < maxKm), maxKm];
    const share = Math.floor(limit / rings.length);
    const picked = new Set<string>();
    let floor = 0;
    for (const ceiling of rings) {
      const inRing = near
        .filter((n) => n.km > floor && n.km <= ceiling)
        .sort((a, b) => b.city.population - a.city.population || a.km - b.km);
      for (const n of inRing.slice(0, share)) picked.add(n.city.id);
      floor = ceiling;
    }
    // Whatever the rings left unfilled goes to the biggest places not yet in.
    for (const n of near.sort((a, b) => b.city.population - a.city.population || a.km - b.km)) {
      if (picked.size >= limit) break;
      picked.add(n.city.id);
    }
    chosen = near.filter((n) => picked.has(n.city.id)).sort(byDistance);
  }

  return chosen.map(({ city }) => ({ city, ...estimateDrive(sim, from, city, vehicle) }));
}

/** Where a car is. One from before cars had a location is with its owner. */
export function vehicleLocation(sim: Simulation, vehicle: Vehicle): string | undefined {
  return vehicle.locationId ?? sim.universe.people[vehicle.ownerId]?.currentLocationId;
}

export function registerDriving(sim: Simulation): void {
  sim.onCommand<{ vehicleId: Id; toCityId: string }, { arriveAt: Instant; km: number; minutes: number; fuelCents: number }>(
    'travel.drive',
    (p, { sim: s }) => {
      const player = s.player;
      const vehicle = s.universe.vehicles[p.vehicleId];
      if (!vehicle) throw new CommandError('That car does not exist.');
      if (vehicle.ownerId !== player.id || vehicle.ownerKind !== 'person') throw new CommandError('That is not your car.');
      if (vehicle.deliveryDueAt) throw new CommandError(WAITING_ON_DELIVERY);

      const from = CITIES.get(player.currentLocationId);
      const to = CITIES.get(p.toCityId);
      if (!from) throw new CommandError('You are nowhere SLATE can drive from.');
      if (!to) throw new CommandError('That is not a place SLATE knows.');
      if (to.id === from.id) throw new CommandError(`You are already in ${to.name}.`);

      const carAt = vehicleLocation(s, vehicle);
      if (carAt !== from.id) {
        throw new CommandError(`Your ${vehicle.year} ${vehicle.make} ${vehicle.model} is in ${CITIES.get(carAt ?? '')?.name ?? 'another city'}, not here.`);
      }
      if (vehicle.mechanicalHealth < 8) throw new CommandError('That car will not make the trip. Get it serviced first.');

      const estimate = estimateDrive(s, from, to, vehicle);
      if (estimate.km > MAX_DRIVE_KM) {
        throw new CommandError(`${to.name} is ${formatDistance(estimate, from.countryId)} away. That is a flight, or two days.`);
      }

      const accountId = player.primaryAccountId;
      if (!accountId) throw new CommandError('You have no account to pay for fuel from.');
      if (estimate.fuelCents > 0 && s.ledger.availableFunds(accountId) < estimate.fuelCents) {
        throw new CommandError(`Fuel for the drive is about ${(estimate.fuelCents / 100).toFixed(2)} and you cannot cover it.`);
      }
      if (estimate.fuelCents > 0) {
        s.expense(accountId, estimate.fuelCents, `Fuel — ${from.name} to ${to.name}`, 'transport', { refType: 'vehicle', refId: vehicle.id });
      }

      const arriveAt = s.now + estimate.minutes * MS_MINUTE;
      s.schedule({
        at: arriveAt,
        kind: 'travel.drive_arrive',
        label: `Arrive In ${to.name}`,
        category: 'travel',
        priority: 60,
        requiresPlayer: true,
        durationMinutes: 0,
        payload: { personId: player.id, vehicleId: vehicle.id, fromCityId: from.id, toCityId: to.id, km: estimate.km, minutes: estimate.minutes },
      });
      s.emit('travel.drive_started', { personId: player.id, vehicleId: vehicle.id, toCityId: to.id, arriveAt, km: estimate.km });
      return { arriveAt, km: estimate.km, minutes: estimate.minutes, fuelCents: estimate.fuelCents };
    },
  );

  sim.onSchedule('travel.drive_arrive', (item) => {
    const { personId, vehicleId, fromCityId, toCityId, km, minutes } = item.payload as {
      personId: Id; vehicleId: Id; fromCityId: string; toCityId: string; km: number; minutes: number;
    };
    const person = sim.universe.people[personId];
    const vehicle = sim.universe.vehicles[vehicleId];
    const to = CITIES.get(toCityId);
    const from = CITIES.get(fromCityId);
    if (!person || !to) return;

    person.currentLocationId = to.id;
    person.currentPlaceId = undefined;
    if (vehicle) {
      vehicle.locationId = to.id;
      addMileage(sim, vehicle, km * 0.621371);
      // The fuel for the drive is paid for when it is booked, so a long run
      // includes the stops it needs; what is in the tank at the end is
      // whatever is left after the last one.
      const litres = (km * Math.max(3, vehicle.efficiency)) / 100;
      const burned = (litres / 60) * 100;
      const start = vehicle.fuelPercent ?? 100;
      vehicle.fuelPercent = Number(clamp(burned > start ? 100 - (burned % 100) : start - burned, 4, 100).toFixed(2));
    }

    const hours = minutes / 60;
    person.wellbeing.energy = clamp(person.wellbeing.energy - hours * 2.5, 0, 100);
    person.wellbeing.travelFatigue = clamp(person.wellbeing.travelFatigue + hours * 3, 0, 100);
    if (hours > 3) person.wellbeing.stress = clamp(person.wellbeing.stress + (hours - 3) * 1.5, 0, 100);

    if (person.isPlayer) {
      const zoneShiftHours = from
        ? Math.abs(zoneOffsetMs(sim.now, to.timeZone) - zoneOffsetMs(sim.now, from.timeZone)) / MS_HOUR
        : 0;
      sim.universe.currentZone = to.timeZone;
      sim.remember({
        category: 'life',
        title: `Drove To ${to.name}`,
        detail: `${person.displayName} drove ${formatDistance({ km, miles: Math.round(km * 0.621371) }, to.countryId)} from ${from?.name ?? 'the road'} to ${to.name}, ${formatDuration(minutes * MS_MINUTE)} at the wheel.${zoneShiftHours ? ' Crossed a time zone.' : ''}`,
        refs: [{ type: 'person', id: person.id }],
        significance: Math.min(60, 20 + Math.round(km / 20)),
        public: false,
      });
      sim.notify({
        category: 'travel',
        title: `You Are In ${to.name}`,
        body: `${formatDistance({ km, miles: Math.round(km * 0.621371) }, to.countryId)} and ${formatDuration(minutes * MS_MINUTE)} later. Local time is now ${to.timeZone.replace(/_/g, ' ')}.`,
        importance: 50, route: '/home',
      });
      sim.emit('travel.arrived', { personId: person.id, cityId: to.id, zoneShiftHours, durationHours: hours, byCar: true });
    }
  });
}

/** A distance the way the country says it. */
export function formatDistance(distance: { km: number; miles: number }, countryId: string): string {
  return usesMiles(countryId) ? `${distance.miles} mi` : `${Math.round(distance.km)} km`;
}
