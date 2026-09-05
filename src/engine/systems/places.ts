/**
 * SLATE — the city you move through.
 *
 * Everywhere you go, you go. A restaurant across town is a drive, in traffic,
 * in a car that has to be where you are with fuel in it — or a walk, or a cab
 * you pay for. Eating is a menu and a bill. Sleeping needs a bed you have a
 * right to: your own, a hotel room you booked, or a trailer on a shoot.
 * Showering needs a bathroom. Every one of them costs time on the one world
 * clock, and the clock is the same one the industry runs on, so an afternoon
 * spent at the beach is an afternoon not spent in the cutting room.
 *
 * Distances inside a city are SLATE's model, not surveyed ones: a deterministic
 * spread across the city's neighbourhoods, wider in a bigger city. Fuel prices,
 * cab fares and menu prices are the game's calibration against the local cost
 * of living, and say so.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { HotelBooking, Id, Person, Property, Vehicle } from '../domain/model';
import { personalityOf } from './life';
import { clamp, makeRng, remap } from '../core/rng';
import { MS_HOUR, MS_MINUTE, addDays, formatDuration, formatTime, zonedParts } from '../core/time';
import { formatMoney, type Money } from '../core/money';
import { CITIES, NEIGHBOURHOODS, cityTimeZone } from '../content/geography';
import { costOfLiving } from '../content/tax';
import {
  INVENTED_NOTE, PLACE_KIND_LABEL, cuisineOf, menuOf, placesIn, priceOf,
  REAL_PLACES, type Place, type PlaceAction, type PlaceKind,
} from '../content/places';
import { fuelCostCents, usesMiles } from './driving';
import { readiness } from './life';

export type Mode = 'walk' | 'drive' | 'taxi' | 'transit' | 'cycle';

export const MODE_LABEL: Readonly<Record<Mode, string>> = {
  walk: 'Walk', drive: 'Drive', taxi: 'Taxi', transit: 'Transit', cycle: 'Cycle',
};

/** How fast each way of getting about moves, in km/h, before traffic. */
const SPEED: Readonly<Record<Mode, number>> = { walk: 4.8, drive: 38, taxi: 34, transit: 22, cycle: 15 };

/** A tank, in litres. Enough for the game to talk about range honestly. */
const TANK_LITRES = 60;

// ---------------------------------------------------------------------------
// Where things are
// ---------------------------------------------------------------------------

/**
 * How far apart two neighbourhoods are, in kilometres.
 *
 * SLATE's model: a deterministic spread seeded on the pair, scaled by how big
 * the city is. The same two places are always the same distance apart.
 */
export function neighbourhoodKm(cityId: string, a: string | undefined, b: string | undefined): number {
  const city = CITIES.get(cityId);
  const spread = city ? clamp(2 + Math.log10(Math.max(1, city.population)) * 2.6, 3, 26) : 8;
  // One decimal on every path. The two short ones were leaking a raw float
  // onto the screen as "3.444618236088402 km".
  if (!a && !b) return Number((spread * 0.35).toFixed(1));
  if (a === b) return Number((spread * 0.18).toFixed(1));
  const pair = [a ?? 'city', b ?? 'city'].sort().join('|');
  const rng = makeRng(`hood-km:${cityId}:${pair}`);
  return Number((spread * rng.float(0.25, 1)).toFixed(1));
}

/** Where the player is, as a place, when they are somewhere in particular. */
export function currentPlace(sim: Simulation, person: Person = sim.player): Place | undefined {
  if (!person.currentPlaceId) return undefined;
  return placesIn(person.currentLocationId).find((p) => p.id === person.currentPlaceId);
}

/** The property they are at, when they are at one. */
export function currentProperty(sim: Simulation, person: Person = sim.player): Property | undefined {
  if (!person.currentPlaceId) return undefined;
  return sim.universe.properties[person.currentPlaceId];
}

/** The neighbourhood the player is standing in. */
function hoodOf(sim: Simulation, person: Person): string | undefined {
  const place = currentPlace(sim, person);
  if (place) return place.neighbourhoodId;
  const property = currentProperty(sim, person);
  return property?.neighbourhoodId;
}

/** Traffic, 1 is free-flowing. Rush hours and big cities are worse. */
export function trafficFactor(sim: Simulation, cityId: string, at: number): number {
  const city = CITIES.get(cityId);
  const zone = city ? cityTimeZone(cityId) : sim.homeZone;
  const parts = zonedParts(at, zone);
  const weekday = parts.weekday >= 1 && parts.weekday <= 5;
  const hour = parts.hour + parts.minute / 60;
  const rush = weekday && ((hour >= 7 && hour <= 10) || (hour >= 16 && hour <= 19.5));
  const quiet = hour >= 22 || hour < 6;
  const size = city ? clamp(0.8 + Math.log10(Math.max(1, city.population)) / 9, 0.85, 1.6) : 1;
  return rush ? 1.35 * size : quiet ? 0.78 : 1 * size;
}

export interface Journey {
  km: number;
  minutes: number;
  cost: Money;
  mode: Mode;
  note: string;
  fuelUsed: number;
}

/** What it takes to get from where you are to somewhere else in the city. */
export function planJourney(sim: Simulation, to: { neighbourhoodId?: string; cityId: string }, mode: Mode, person: Person = sim.player): Journey {
  const km = neighbourhoodKm(to.cityId, hoodOf(sim, person), to.neighbourhoodId);
  const traffic = trafficFactor(sim, to.cityId, sim.now);
  const speed = SPEED[mode] / (mode === 'walk' || mode === 'cycle' ? 1 : traffic);
  const minutes = Math.max(3, Math.round((km / speed) * 60 + (mode === 'transit' ? 9 : mode === 'taxi' ? 5 : 0)));
  const col = costOfLiving(to.cityId);
  const vehicle = mode === 'drive' ? driveableVehicle(sim, person) : undefined;
  const cost = mode === 'taxi' ? Math.round((450 + km * 210) * col)
    : mode === 'transit' ? Math.round(280 * col)
      : mode === 'drive' ? fuelCostCents(km, vehicle, to.cityId.slice(0, 2))
        : 0;
  const fuelUsed = mode === 'drive' ? fuelPercentFor(km, vehicle) : 0;
  const note = mode === 'drive' && traffic > 1.2 ? 'Traffic. It takes as long as it takes.'
    : mode === 'walk' && km > 4 ? 'A long walk. You will feel it.'
      : mode === 'transit' ? 'A wait, then a ride.'
        : traffic < 0.85 ? 'The roads are empty at this hour.' : 'A normal run across town.';
  return { km, minutes, cost, mode, note, fuelUsed };
}

/** The car you could drive right now: yours, in this city, with fuel in it. */
export function driveableVehicle(sim: Simulation, person: Person = sim.player): Vehicle | undefined {
  return Object.values(sim.universe.vehicles).find((v) =>
    !v.soldAt && v.ownerId === person.id && (v.locationId ?? person.currentLocationId) === person.currentLocationId);
}

/** How much of a tank a distance eats, as a percentage. */
function fuelPercentFor(km: number, vehicle: Vehicle | undefined): number {
  if (!vehicle) return 0;
  if (vehicle.powertrain === 'ev') return Number(((km / 4.5) / TANK_LITRES * 100).toFixed(2));
  const litres = (km * Math.max(3, vehicle.efficiency)) / 100;
  return Number((litres / TANK_LITRES * 100).toFixed(2));
}

/** What is in the tank. A car from before fuel was tracked is full. */
export function fuelOf(vehicle: Vehicle): number {
  return vehicle.fuelPercent ?? 100;
}

/** How far it can go on what is in it, in km. */
export function rangeKm(vehicle: Vehicle): number {
  const litres = TANK_LITRES * (fuelOf(vehicle) / 100);
  if (vehicle.powertrain === 'ev') return Math.round(litres * 4.5);
  return Math.round((litres / Math.max(3, vehicle.efficiency)) * 100);
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerPlaces(sim: Simulation): void {
  // Turning up somewhere with people in it is a thing that can be seen.
  sim.onEvent('go.arrived', 'places.seen', (event, { sim: s }) => {
    const payload = event.payload as { placeId?: string; cityId?: string };
    if (payload.placeId && payload.cityId) whoSawYou(s, payload.placeId, payload.cityId);
  });

  sim.onSchedule('place.hygiene_tick', () => {
    decayHygiene(sim);
    armHygiene(sim);
  });

  // --- Getting there --------------------------------------------------------

  sim.onCommand<
    { placeId?: string; propertyId?: Id; home?: boolean; mode?: Mode },
    { placeId?: string; name: string; minutes: number; km: number; cost: Money; mode: Mode; note: string; arrivedAt: number }
  >(
    'go.to',
    (p, { sim: s }) => {
      const person = s.player;
      const cityId = person.currentLocationId;

      let target: { id: string; name: string; neighbourhoodId?: string; cityId: string };
      if (p.home || p.propertyId) {
        const propertyId = p.propertyId ?? person.residenceId;
        if (!propertyId) throw new CommandError('You do not have anywhere to go home to yet.');
        const property = s.universe.properties[propertyId];
        if (!property) throw new CommandError('That place no longer exists.');
        if (property.locationId !== cityId) {
          throw new CommandError(`${property.addressLine} is in ${CITIES.get(property.locationId)?.name ?? 'another city'} and you are in ${CITIES.get(cityId)?.name ?? 'this one'}. Fly or drive there first.`);
        }
        if (property.ownerId !== person.id && property.id !== person.residenceId) {
          throw new CommandError('That is not yours to walk into.');
        }
        target = { id: property.id, name: property.addressLine, neighbourhoodId: property.neighbourhoodId, cityId };
      } else if (p.placeId) {
        const place = placesIn(cityId).find((q) => q.id === p.placeId);
        if (!place) {
          // A generated place carries its city in its id; a real one has to be
          // looked for. Either way the answer is which city it is in.
          const generatedIn = CITIES.get(String(p.placeId).split(':')[0] ?? '');
          const realIn = generatedIn ? undefined : REAL_PLACES.find((q) => q.id === p.placeId);
          const elsewhere = generatedIn ?? (realIn ? CITIES.get(realIn.cityId) : undefined);
          throw new CommandError(elsewhere
            ? `${realIn?.name ?? 'That place'} is in ${elsewhere.name} and you are in ${CITIES.get(cityId)?.name ?? 'another city'}. Get there first.`
            : 'There is no such place here.');
        }
        target = { id: place.id, name: place.name, neighbourhoodId: place.neighbourhoodId, cityId };
      } else {
        throw new CommandError('Name somewhere to go.');
      }

      if (person.currentPlaceId === target.id) {
        return { placeId: target.id, name: target.name, minutes: 0, km: 0, cost: 0, mode: p.mode ?? 'walk', note: 'You are already here.', arrivedAt: s.now };
      }

      const mode = p.mode ?? 'drive';
      const journey = planJourney(s, target, mode, person);
      const vehicle = mode === 'drive' ? driveableVehicle(s, person) : undefined;
      if (mode === 'drive') {
        if (!vehicle) throw new CommandError('You have no car here. Walk, take transit, or call a cab.');
        if (fuelOf(vehicle) < journey.fuelUsed) {
          throw new CommandError(`${vehicle.year} ${vehicle.make} ${vehicle.model} has ${Math.round(fuelOf(vehicle))}% in the tank, which will not make ${journey.km} km. Fill up first.`);
        }
      }
      if (mode === 'walk' && person.wellbeing.energy < 8) throw new CommandError('You are too tired to walk anywhere. Sit down first.');

      if (journey.cost > 0 && mode !== 'drive') {
        const accountId = person.primaryAccountId;
        if (!accountId) throw new CommandError('No account to pay the fare from.');
        if (s.ledger.availableFunds(accountId) < journey.cost) throw new CommandError(`The fare is about ${formatMoney(journey.cost)} and you cannot cover it.`);
        s.expense(accountId, journey.cost, mode === 'taxi' ? 'Taxi' : 'Transit fare', 'travel');
      }
      if (mode === 'drive' && journey.cost > 0) {
        const accountId = person.primaryAccountId;
        if (accountId && s.ledger.availableFunds(accountId) >= journey.cost) {
          // Fuel is paid for as it is burned; the tank is what runs out.
          s.expense(accountId, journey.cost, 'Fuel', 'travel');
        }
      }

      s.advanceTo(s.now + journey.minutes * MS_MINUTE);
      person.currentPlaceId = target.id;
      if (vehicle) {
        vehicle.fuelPercent = Number(Math.max(0, fuelOf(vehicle) - journey.fuelUsed).toFixed(2));
        vehicle.locationId = cityId;
        vehicle.mileage += Math.round(journey.km * (usesMiles(cityId.slice(0, 2)) ? 0.621 : 1));
      }
      const cost = journey.minutes / 60;
      person.wellbeing.energy = clamp(person.wellbeing.energy - cost * (mode === 'walk' ? 9 : mode === 'cycle' ? 14 : 3), 0, 100);
      if (mode === 'walk' || mode === 'cycle') {
        person.wellbeing.fitness = clamp(person.wellbeing.fitness + cost * 0.5, 0, 100);
        person.wellbeing.hygiene = clamp(person.wellbeing.hygiene - cost * 6, 0, 100);
      }
      if (mode === 'drive' && trafficFactor(s, cityId, s.now) > 1.25) {
        person.wellbeing.stress = clamp(person.wellbeing.stress + cost * 5, 0, 100);
      }
      s.emit('go.arrived', { placeId: target.id, cityId, mode, minutes: journey.minutes, km: journey.km });
      return { placeId: target.id, name: target.name, minutes: journey.minutes, km: journey.km, cost: journey.cost, mode, note: journey.note, arrivedAt: s.now };
    },
  );

  // --- Eating ---------------------------------------------------------------

  sim.onCommand<
    { items: string[]; withPersonIds?: Id[]; accountId?: Id },
    { total: Money; nourishment: number; items: string[]; note: string; place: string }
  >(
    'place.order',
    (p, { sim: s }) => {
      const person = s.player;
      const place = currentPlace(s, person);
      if (!place) throw new CommandError('You are not anywhere that serves food. Go somewhere first.');
      if (!place.actions.includes('eat') && !place.actions.includes('drink')) {
        throw new CommandError(`${place.name} does not serve food.`);
      }
      const menu = menuOf(place);
      if (menu.length === 0) throw new CommandError(`${place.name} has nothing to order.`);
      if (p.items.length === 0) throw new CommandError('Order something.');
      if (p.items.length > 8) throw new CommandError('That is more than one table can eat.');

      const chosen = p.items.map((name) => {
        const item = menu.find((m) => m.name.toLowerCase() === name.toLowerCase());
        if (!item) throw new CommandError(`${place.name} does not have that. The menu is: ${menu.map((m) => m.name).join(', ')}.`);
        return item;
      });
      const guests = (p.withPersonIds ?? []).filter((id) => s.universe.people[id]);
      const total = chosen.reduce((sum, item) => sum + priceOf(place, item), 0)
        + Math.round(chosen.reduce((sum, item) => sum + priceOf(place, item), 0) * 0.18);
      const accountId = p.accountId ?? person.primaryAccountId;
      if (!accountId) throw new CommandError('No account to pay with.');
      if (s.ledger.availableFunds(accountId) < total) {
        throw new CommandError(`That comes to ${formatMoney(total)} with service and you cannot cover it.`);
      }
      s.expense(accountId, total, `${place.name}`, 'dining');

      s.advanceTo(s.now + place.minutes * MS_MINUTE);
      const nourishment = chosen.reduce((sum, item) => sum + item.nourishment, 0);
      person.wellbeing.nourishment = clamp(person.wellbeing.nourishment + nourishment, 0, 100);
      person.wellbeing.morale = clamp(person.wellbeing.morale + place.quality * 0.05 + (guests.length > 0 ? 4 : 0), 0, 100);
      person.wellbeing.stress = clamp(person.wellbeing.stress - (place.kind === 'bar' ? 8 : 5), 0, 100);
      if (place.kind === 'bar') person.wellbeing.energy = clamp(person.wellbeing.energy - 6, 0, 100);

      for (const id of guests) {
        const relationship = Object.values(s.universe.relationships).find((r) =>
          !r.endedAt && ((r.aId === person.id && r.bId === id) || (r.bId === person.id && r.aId === id)));
        if (!relationship) continue;
        relationship.dimensions.affection = clamp(relationship.dimensions.affection + 2.5, 0, 100);
        relationship.dimensions.familiarity = clamp(relationship.dimensions.familiarity + 1.5, 0, 100);
        relationship.dimensions.trust = clamp(relationship.dimensions.trust + 1, 0, 100);
        relationship.lastInteractionAt = s.now;
      }

      const note = guests.length > 0
        ? `${chosen.length} dishes and the bill, with ${guests.map((id) => s.universe.people[id]?.displayName).filter(Boolean).join(', ')}.`
        : place.kind === 'bar' ? 'One at the bar, and the room to yourself.'
          : `${chosen.map((c) => c.name).join(', ')}. ${place.quality > 75 ? 'It was as good as it should have been at that price.' : 'It did the job.'}`;
      s.remember({
        category: 'life',
        title: `Ate at ${place.name}`,
        detail: `${CITIES.get(place.cityId)?.name}. ${formatMoney(total)}. ${note}`,
        refs: [{ type: 'person', id: person.id }],
        significance: guests.length > 0 ? 12 : 4, public: false, amount: total,
      });
      s.emit('place.ordered', { placeId: place.id, total, items: chosen.length, guests: guests.length });
      return { total, nourishment, items: chosen.map((c) => c.name), note, place: place.name };
    },
  );

  // --- Fuel ------------------------------------------------------------------

  sim.onCommand<{ vehicleId?: Id; toPercent?: number; accountId?: Id }, { litres: number; cost: Money; fuelPercent: number; rangeKm: number }>(
    'place.refuel',
    (p, { sim: s }) => {
      const person = s.player;
      const place = currentPlace(s, person);
      if (!place || !place.actions.includes('refuel')) {
        throw new CommandError('You are not at a filling station. Drive to one first.');
      }
      const vehicle = p.vehicleId ? s.universe.vehicles[p.vehicleId] : driveableVehicle(s, person);
      if (!vehicle || vehicle.soldAt) throw new CommandError('You have no car here to fill.');
      if (vehicle.ownerId !== person.id) throw new CommandError('That is not your car.');
      const to = clamp(p.toPercent ?? 100, 5, 100);
      const now = fuelOf(vehicle);
      if (to <= now) throw new CommandError(`The tank is already at ${Math.round(now)}%.`);

      const litres = Number((TANK_LITRES * (to - now) / 100).toFixed(1));
      const perLitre = fuelCostCents(100, vehicle, place.cityId.slice(0, 2)) / Math.max(1, (100 * Math.max(3, vehicle.efficiency)) / 100);
      const cost = Math.round(litres * Math.max(60, perLitre));
      const accountId = p.accountId ?? person.primaryAccountId;
      if (!accountId) throw new CommandError('No account to pay with.');
      if (s.ledger.availableFunds(accountId) < cost) throw new CommandError(`${litres} litres comes to ${formatMoney(cost)} and you cannot cover it.`);
      s.expense(accountId, cost, `Fuel — ${place.name}`, 'travel');

      s.advanceTo(s.now + 9 * MS_MINUTE);
      vehicle.fuelPercent = to;
      s.emit('place.refuelled', { vehicleId: vehicle.id, litres, cost, to });
      return { litres, cost, fuelPercent: to, rangeKm: rangeKm(vehicle) };
    },
  );

  // --- A room for the night --------------------------------------------------

  sim.onCommand<
    { nights?: number; roomClass?: HotelBooking['roomClass']; guestIds?: Id[]; accountId?: Id },
    { bookingId: Id; hotel: string; nights: number; nightlyRate: Money; total: Money }
  >(
    'place.book_room',
    (p, { sim: s }) => {
      const person = s.player;
      const place = currentPlace(s, person);
      if (!place || place.kind !== 'hotel') throw new CommandError('You are not standing in a hotel. Walk into one first.');
      const existing = hotelRoom(s, person);
      if (existing && existing.hotelName === place.name) {
        return { bookingId: existing.id, hotel: existing.hotelName, nights: existing.nights, nightlyRate: existing.nightlyRate, total: existing.total };
      }
      const nights = clamp(Math.round(p.nights ?? 1), 1, 90);
      // What this hotel charges: its own tier, in its own city, on SLATE's
      // calibration rather than anybody's rate card.
      const roomClass = p.roomClass ?? (place.price >= 4 ? 'suite' : place.price >= 3 ? 'deluxe' : 'standard');
      const classMultiplier: Record<HotelBooking['roomClass'], number> = { standard: 1, deluxe: 1.6, suite: 3.2, penthouse: 8.5 };
      const nightlyRate = Math.round(150_00 * costOfLiving(place.cityId) * (0.7 + place.price * 0.35) * classMultiplier[roomClass]);
      const total = nightlyRate * nights;
      const taxes = Math.round(total * 0.145);
      const accountId = p.accountId ?? person.primaryAccountId;
      if (!accountId) throw new CommandError('No account to pay with.');
      if (s.ledger.availableFunds(accountId) < total + taxes) {
        throw new CommandError(`${nights} night${nights === 1 ? '' : 's'} at ${formatMoney(nightlyRate)} comes to ${formatMoney(total + taxes)} with tax.`);
      }
      s.expense(accountId, total + taxes, `${place.name} — ${nights} night${nights === 1 ? '' : 's'}`, 'travel');

      const booking: HotelBooking = {
        id: s.nextId('stay'),
        saveId: s.universe.meta.id,
        guestIds: [person.id, ...(p.guestIds ?? []).filter((id) => s.universe.people[id])],
        hotelRefId: place.id,
        hotelName: place.name,
        locationId: place.cityId,
        roomClass,
        checkInAt: s.now,
        checkOutAt: addDays(s.now, nights, s.homeZone),
        nights,
        nightlyRate,
        taxesFees: taxes,
        total: total + taxes,
        status: 'checked_in',
        incidentals: 0,
        bookedAt: s.now,
      };
      s.universe.hotelBookings[booking.id] = booking;
      s.advanceTo(s.now + 15 * MS_MINUTE);
      s.emit('travel.hotel_booked', { bookingId: booking.id, cityId: place.cityId, nights, total: booking.total });
      return { bookingId: booking.id, hotel: place.name, nights, nightlyRate, total: booking.total };
    },
  );

  // --- Seeing something ------------------------------------------------------

  sim.onCommand<{ minutes?: number; withPersonIds?: Id[] }, { place: string; minutes: number; cost: Money; note: string; real: boolean }>(
    'place.visit',
    (p, { sim: s }) => {
      const person = s.player;
      const place = currentPlace(s, person);
      if (!place) throw new CommandError('You are not anywhere in particular.');
      if (!place.actions.includes('visit')) throw new CommandError(`There is nothing to see at ${place.name}.`);
      const minutes = clamp(Math.round(p.minutes ?? place.minutes), 15, 360);
      const cost = place.admissionCalibration ? Math.round(place.admissionCalibration * costOfLiving(place.cityId)) : 0;
      if (cost > 0) {
        const accountId = person.primaryAccountId;
        if (!accountId) throw new CommandError('No account to pay admission from.');
        if (s.ledger.availableFunds(accountId) < cost) throw new CommandError(`Admission is about ${formatMoney(cost)} and you cannot cover it.`);
        s.expense(accountId, cost, `${place.name} — admission`, 'lifestyle');
      }
      s.advanceTo(s.now + minutes * MS_MINUTE);
      const hours = minutes / 60;
      person.wellbeing.morale = clamp(person.wellbeing.morale + hours * 7, 0, 100);
      person.wellbeing.stress = clamp(person.wellbeing.stress - hours * 8, 0, 100);
      person.wellbeing.energy = clamp(person.wellbeing.energy - hours * 5, 0, 100);
      if (place.kind === 'museum' || place.kind === 'landmark') {
        person.attributes['script_analysis'] = clamp((person.attributes['script_analysis'] ?? 20) + hours * 0.2, 0, 100);
      }
      const guests = (p.withPersonIds ?? []).filter((id) => s.universe.people[id]);
      for (const id of guests) {
        const relationship = Object.values(s.universe.relationships).find((r) =>
          !r.endedAt && ((r.aId === person.id && r.bId === id) || (r.bId === person.id && r.aId === id)));
        if (!relationship) continue;
        relationship.dimensions.affection = clamp(relationship.dimensions.affection + 3, 0, 100);
        relationship.dimensions.familiarity = clamp(relationship.dimensions.familiarity + 2, 0, 100);
        relationship.lastInteractionAt = s.now;
      }
      const note = place.real
        ? `${place.about}${guests.length > 0 ? ' You were not on your own.' : ''}`
        : `${place.about} ${INVENTED_NOTE}`;
      s.remember({
        category: 'life',
        title: `Went to ${place.name}`,
        detail: `${CITIES.get(place.cityId)?.name}. ${formatDuration(minutes)}.`,
        refs: [{ type: 'person', id: person.id }],
        significance: place.real ? 16 : 8, public: false,
      });
      s.emit('place.visited', { placeId: place.id, minutes, real: place.real });
      return { place: place.name, minutes, cost, note, real: place.real };
    },
  );

  // --- Washing --------------------------------------------------------------

  sim.onCommand<Record<string, never>, { hygiene: number; where: string }>(
    'life.shower',
    (_p, { sim: s }) => {
      const person = s.player;
      const where = bathroomFor(s, person);
      if (!where) {
        throw new CommandError('There is nowhere here to shower. Go home, or to a hotel room you have booked.');
      }
      s.advanceTo(s.now + 25 * MS_MINUTE);
      person.wellbeing.hygiene = 100;
      person.wellbeing.energy = clamp(person.wellbeing.energy + 4, 0, 100);
      person.wellbeing.stress = clamp(person.wellbeing.stress - 6, 0, 100);
      person.wellbeing.morale = clamp(person.wellbeing.morale + 2, 0, 100);
      s.emit('life.showered', { where });
      return { hygiene: 100, where };
    },
  );

  // --- Intimacy --------------------------------------------------------------

  /**
   * Two people who are together, alone somewhere private. What happens is
   * theirs; the game records that the evening was theirs and what it did to
   * how they are with each other, and nothing else.
   */
  sim.onCommand<{ personId: Id }, { happened: boolean; reason: string; closeness: number }>(
    'rel.intimacy',
    (p, { sim: s }) => {
      const person = s.player;
      const other = s.universe.people[p.personId];
      if (!other) throw new CommandError('No such person.');
      if (other.id === person.id) throw new CommandError('That is not what this is for.');
      const relationship = Object.values(s.universe.relationships).find((r) =>
        !r.endedAt && ((r.aId === person.id && r.bId === other.id) || (r.bId === person.id && r.aId === other.id)));
      if (!relationship) throw new CommandError(`You and ${other.displayName} are not together.`);
      if (!['dating', 'engaged', 'spouse'].includes(relationship.type)) {
        throw new CommandError(`You and ${other.displayName} are ${relationship.type.replace(/_/g, ' ')}. That is not this.`);
      }
      const age = (id: Id) => {
        const q = s.universe.people[id];
        return q ? Math.floor((s.now - q.birthInstant) / (365.2425 * 24 * MS_HOUR)) : 0;
      };
      if (age(person.id) < 18 || age(other.id) < 18) throw new CommandError('No.');
      if (other.currentLocationId !== person.currentLocationId) {
        throw new CommandError(`${other.displayName} is in ${CITIES.get(other.currentLocationId)?.name ?? 'another city'}.`);
      }
      const privateHere = privacyOf(s, person);
      if (!privateHere) throw new CommandError('You are not somewhere private. Go home, or to a room you have.');

      // Whether it happens at all is theirs to decide, and how the two of you
      // have been lately is most of the answer.
      const willing = relationship.dimensions.affection * 0.4 + relationship.dimensions.trust * 0.25
        + relationship.dimensions.compatibility * 0.2 + relationship.dimensions.commitment * 0.15
        - relationship.dimensions.conflict * 0.35;
      const mood = (readiness(other) + readiness(person)) / 2;
      const rng = s.rng('intimacy', relationship.id, Math.floor(s.now / MS_HOUR));
      if (willing < 45 || mood < 28) {
        relationship.lastInteractionAt = s.now;
        const reason = willing < 45
          ? relationship.dimensions.conflict > 40
            ? `Things are not right between you and ${other.displayName}. Not tonight.`
            : `${other.displayName} is not in that place with you right now. It has been distant.`
          : 'Neither of you has anything left today. It is not the night for it.';
        return { happened: false, reason, closeness: relationship.dimensions.affection };
      }
      if (rng.chance(0.06)) {
        relationship.lastInteractionAt = s.now;
        return { happened: false, reason: `${other.displayName} would rather just talk tonight.`, closeness: relationship.dimensions.affection };
      }

      s.advanceTo(s.now + 90 * MS_MINUTE);
      relationship.dimensions.affection = clamp(relationship.dimensions.affection + 4, 0, 100);
      relationship.dimensions.familiarity = clamp(relationship.dimensions.familiarity + 2, 0, 100);
      relationship.dimensions.trust = clamp(relationship.dimensions.trust + 1, 0, 100);
      relationship.dimensions.conflict = clamp(relationship.dimensions.conflict - 3, 0, 100);
      relationship.lastInteractionAt = s.now;
      relationship.memories.push({ id: s.nextId('relmem'), at: s.now, kind: 'private', summary: 'An evening in, and nobody else’s business.', impact: 4, decayDays: 120 });
      for (const q of [person, other]) {
        q.wellbeing.stress = clamp(q.wellbeing.stress - 12, 0, 100);
        q.wellbeing.morale = clamp(q.wellbeing.morale + 8, 0, 100);
        q.wellbeing.energy = clamp(q.wellbeing.energy - 8, 0, 100);
        q.wellbeing.hygiene = clamp(q.wellbeing.hygiene - 10, 0, 100);
      }
      s.emit('rel.intimacy', { relationshipId: relationship.id, personId: other.id });
      return { happened: true, reason: 'The evening was yours.', closeness: relationship.dimensions.affection };
    },
  );
}

// ---------------------------------------------------------------------------
// Being seen
// ---------------------------------------------------------------------------

/**
 * Somewhere with people in it. A hotel lobby counts; your own kitchen does not.
 */
function isPublic(place: Place | undefined): boolean {
  if (!place) return false;
  return !['garage'].includes(place.kind);
}

/** How likely somebody is to know your face here, right now. */
export function recognitionChance(sim: Simulation, place: Place, person: Person = sim.player): number {
  const fame = person.reputation.publicFame / 100;
  const busy: Partial<Record<PlaceKind, number>> = {
    club: 1.5, bar: 1.25, restaurant: 1.2, cafe: 1, landmark: 1.35, museum: 0.8,
    beach: 1.1, park: 0.9, cinema: 1.1, theatre: 1.2, market: 1, hotel: 1.15,
    gym: 0.7, salon: 0.6, gas_station: 0.5, fast_food: 0.9, viewpoint: 1.2,
  };
  const city = CITIES.get(place.cityId);
  const industry = (city?.industryPresence ?? 30) / 100;
  return clamp(Math.pow(fame, 1.4) * (busy[place.kind] ?? 1) * (0.55 + industry * 0.8), 0, 0.9);
}

const FANS = [
  'Two people at the next table worked out who you were and were kind about it.',
  'Somebody asked for a photograph on the way in. You said yes.',
  'A group by the door recognised you and pretended not to, badly.',
  'The person behind the counter said they had seen the film. They meant it.',
  'A teenager asked you to sign a receipt because it was all they had.',
  'Somebody said your name like a question, and you nodded.',
  'A family asked, politely, and you took the picture yourself because the angle was better.',
  'Somebody told you what your work meant to them and then apologised for saying it.',
];

const PHOTOGRAPHED = [
  'There was a photographer across the street when you came out.',
  'Somebody with a long lens was waiting by the valet stand.',
  'A camera went off twice as you got to the car.',
  'You saw the flash before you saw the man holding it.',
  'Two of them, on the other side of the road, not hiding.',
  'A phone came up as you walked past and stayed up.',
];

const RAN_INTO = [
  'was two tables over and came across.',
  'was at the bar and bought you one.',
  'was on the way out and stopped anyway.',
  'saw you first, which is its own kind of information.',
  'was in the corner with somebody you did not recognise.',
  'has been meaning to call you, apparently.',
];

/**
 * What happened when you turned up somewhere.
 *
 * Only what the character could actually know is written down: a photographer
 * you saw is on the record now, and one you did not see is not — that surfaces
 * later, if it surfaces at all.
 */
function whoSawYou(sim: Simulation, placeId: string, cityId: string): void {
  const person = sim.player;
  const place = placesIn(cityId).find((q) => q.id === placeId);
  if (!place || !isPublic(place)) return;
  const rng = sim.rng('seen', placeId, String(Math.floor(sim.now / MS_HOUR)));
  const chance = recognitionChance(sim, place, person);
  if (chance <= 0.01) return;

  // The industry drinks where the industry drinks.
  if (place.industryHaunt && rng.chance(0.22)) {
    const candidates = Object.values(sim.universe.people).filter((q) =>
      !q.isPlayer && q.currentLocationId === cityId && q.careerTrack && q.reputation.industryDemand > 35);
    const met = candidates.length > 0 ? candidates[rng.int(0, candidates.length - 1)] : undefined;
    if (met) {
      const existing = Object.values(sim.universe.relationships).find((r) =>
        !r.endedAt && ((r.aId === person.id && r.bId === met.id) || (r.bId === person.id && r.aId === met.id)));
      if (existing) {
        existing.dimensions.familiarity = clamp(existing.dimensions.familiarity + 3, 0, 100);
        existing.lastInteractionAt = sim.now;
      }
      person.reputation.industryDemand = clamp(person.reputation.industryDemand + 0.4, 0, 100);
      sim.notify({
        category: 'career',
        title: `You ran into ${met.stageName ?? met.displayName}`,
        body: `At ${place.name}. ${met.stageName ?? met.displayName} ${rng.pick(RAN_INTO)}`,
        importance: 44, route: '/workspace/relationships', refType: 'person', refId: met.id,
      });
      sim.emit('place.ran_into', { placeId: place.id, personId: met.id });
    }
  }

  if (!rng.chance(chance)) return;

  // Photographed, or simply recognised.
  const photographed = rng.chance(clamp(person.reputation.publicFame / 140, 0, 0.55));
  if (!photographed) {
    person.reputation.publicFame = clamp(person.reputation.publicFame + 0.15, 0, 100);
    person.reputation.audienceAppeal = clamp(person.reputation.audienceAppeal + 0.2, 0, 100);
    person.wellbeing.energy = clamp(person.wellbeing.energy - 1.5, 0, 100);
    sim.notify({
      category: 'life',
      title: `Recognised at ${place.name}`,
      body: rng.pick(FANS),
      importance: 28, route: '/workspace/city',
    });
    sim.emit('place.recognised', { placeId: place.id, photographed: false });
    return;
  }

  const noticed = rng.chance(0.62);
  person.reputation.publicFame = clamp(person.reputation.publicFame + 0.5, 0, 100);
  person.wellbeing.stress = clamp(person.wellbeing.stress + (noticed ? 4 : 0), 0, 100);

  // Who you were with is the story, when there was somebody.
  const withPartner = Object.values(sim.universe.relationships).find((r) =>
    !r.endedAt && ['dating', 'engaged', 'spouse'].includes(r.type)
    && (r.aId === person.id || r.bId === person.id)
    && !r.isPublic
    && sim.universe.people[r.aId === person.id ? r.bId : r.aId]?.currentPlaceId === place.id);
  if (withPartner) {
    withPartner.isPublic = true;
    const other = sim.universe.people[withPartner.aId === person.id ? withPartner.bId : withPartner.aId];
    sim.remember({
      category: 'life',
      title: `Photographed with ${other?.displayName ?? 'somebody'}`,
      detail: `Outside ${place.name} in ${CITIES.get(place.cityId)?.name}. Whatever it was, it is not private any more.`,
      refs: [{ type: 'person', id: person.id }],
      significance: 55, public: true,
    });
    sim.notify({
      category: 'life',
      title: `The two of you are not a secret any more`,
      body: `${noticed ? rng.pick(PHOTOGRAPHED) : 'You did not see anybody.'} By morning there were pictures of you and ${other?.displayName ?? 'somebody'} outside ${place.name}.`,
      importance: 66, route: '/workspace/relationships',
    });
    sim.emit('place.photographed', { placeId: place.id, withPersonId: other?.id, wentPublic: true });
    return;
  }

  if (noticed) {
    sim.notify({
      category: 'life',
      title: `Photographed at ${place.name}`,
      body: `${rng.pick(PHOTOGRAPHED)} Whether it runs anywhere is out of your hands.`,
      importance: 38, route: '/workspace/city',
    });
  } else {
    sim.remember({
      category: 'life',
      title: `Pictures of you outside ${place.name}`,
      detail: `${CITIES.get(place.cityId)?.name}. You did not see anybody take them.`,
      refs: [{ type: 'person', id: person.id }],
      significance: 20, public: true,
    });
  }
  sim.emit('place.photographed', { placeId: place.id, noticed, wentPublic: false });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------



/** A bathroom you have a right to use, right now. */
export function bathroomFor(sim: Simulation, person: Person = sim.player): string | undefined {
  const property = currentProperty(sim, person);
  if (property && (property.ownerId === person.id || property.id === person.residenceId)) return property.addressLine;
  const place = currentPlace(sim, person);
  if (place && place.actions.includes('shower')) {
    if (place.kind === 'hotel') return hotelRoom(sim, person) ? place.name : undefined;
    return place.name;
  }
  // At home, in the ordinary sense: no place set and a residence in this city.
  if (!person.currentPlaceId && person.residenceId) {
    const home = sim.universe.properties[person.residenceId];
    if (home && home.locationId === person.currentLocationId) return home.addressLine;
  }
  const room = hotelRoom(sim, person);
  return room ? room.hotelName : undefined;
}

/** A hotel room booked for tonight, in the city you are in. */
export function hotelRoom(sim: Simulation, person: Person = sim.player): HotelBooking | undefined {
  return Object.values(sim.universe.hotelBookings).find((b) =>
    b.guestIds.includes(person.id)
    && b.locationId === person.currentLocationId
    && (b.status === 'booked' || b.status === 'checked_in')
    && b.checkInAt <= sim.now && b.checkOutAt >= sim.now);
}

/** Somewhere with a door you can close. */
export function privacyOf(sim: Simulation, person: Person = sim.player): string | undefined {
  const property = currentProperty(sim, person);
  if (property && (property.ownerId === person.id || property.id === person.residenceId)) return property.addressLine;
  if (!person.currentPlaceId && person.residenceId) {
    const home = sim.universe.properties[person.residenceId];
    if (home && home.locationId === person.currentLocationId) return home.addressLine;
  }
  const room = hotelRoom(sim, person);
  return room ? room.hotelName : undefined;
}

/** Whether you can sleep where you are, and where that is. */
export function bedFor(sim: Simulation, person: Person = sim.player): string | undefined {
  return privacyOf(sim, person);
}

const HYGIENE_TICK_HOURS = 6;

function armHygiene(sim: Simulation): void {
  if (sim.timeline.pending().some((i) => i.kind === 'place.hygiene_tick')) return;
  sim.schedule({
    at: sim.now + HYGIENE_TICK_HOURS * MS_HOUR,
    kind: 'place.hygiene_tick',
    label: 'The Day Goes On',
    category: 'system',
    priority: 96,
  });
}

export function ensureHygieneTick(sim: Simulation): void {
  armHygiene(sim);
}

function decayHygiene(sim: Simulation): void {
  const person = sim.player;
  // An orderly person's standards slip slower than a chaotic one's.
  const drift = personalityOf(person, 'hygieneDrift');
  person.wellbeing.hygiene = clamp(person.wellbeing.hygiene - HYGIENE_TICK_HOURS * 2.2 * drift, 0, 100);
}

/** Everything you could do where you are standing. */
export function whatIsHere(sim: Simulation): {
  place?: Place; property?: Property; city: string;
  actions: PlaceAction[]; canShower: boolean; canSleep: boolean;
  vehicle?: { vehicle: Vehicle; fuel: number; range: number };
} {
  const person = sim.player;
  const place = currentPlace(sim, person);
  const property = currentProperty(sim, person);
  const vehicle = driveableVehicle(sim, person);
  return {
    place,
    property,
    city: CITIES.get(person.currentLocationId)?.name ?? person.currentLocationId,
    actions: place?.actions ?? (property ? ['sleep', 'shower', 'eat'] : []),
    canShower: Boolean(bathroomFor(sim, person)),
    canSleep: Boolean(bedFor(sim, person)),
    vehicle: vehicle ? { vehicle, fuel: fuelOf(vehicle), range: rangeKm(vehicle) } : undefined,
  };
}

/** Places in the city you are in, nearest first, with what each costs to reach. */
export function placesNear(sim: Simulation, options: { kind?: Place['kind']; mode?: Mode; limit?: number } = {}) {
  const person = sim.player;
  const cityId = person.currentLocationId;
  const mode = options.mode ?? 'drive';
  return placesIn(cityId)
    .filter((place) => !options.kind || place.kind === options.kind)
    .map((place) => ({ place, journey: planJourney(sim, place, mode, person) }))
    .sort((a, b) => a.journey.minutes - b.journey.minutes)
    .slice(0, options.limit ?? 60);
}

export { PLACE_KIND_LABEL, placesIn, menuOf, priceOf, cuisineOf };
void addDays; void formatTime; void remap; void NEIGHBOURHOODS;
