/**
 * SLATE — Travel: trips, commercial and private aviation, hotels.
 *
 * Travel is the system that ties geography, the calendar, the world clock and
 * the player's location together. Flying to London changes what time it is for
 * you, what you can attend, how tired you are and what things cost.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { FlightBooking, HotelBooking, Id, Trip, TripLeg } from '../domain/model';
import { clamp, remap } from '../core/rng';
import { addDays, MS_HOUR, MS_MINUTE, zoneOffsetMs } from '../core/time';
import { applyRate, formatMoney, type Money } from '../core/money';
import { AIRPORTS, CITIES, cityDistanceKm, nearestAirport } from '../content/geography';
import { costOfLiving } from '../content/tax';

export interface FlightOption {
  airlineCode: string;
  airlineName: string;
  flightNumber: string;
  fromAirport: string;
  toAirport: string;
  departAt: number;
  arriveAt: number;
  durationMinutes: number;
  stops: number;
  fares: Record<FlightBooking['cabin'], Money>;
  refundableSurcharge: number;
}

const AIRLINES: { code: string; name: string; quality: number }[] = [
  { code: 'MR', name: 'Meridian Air', quality: 82 },
  { code: 'NC', name: 'Northern Cross', quality: 74 },
  { code: 'PA', name: 'Pacifica Airways', quality: 68 },
  { code: 'AT', name: 'Atlantic Union', quality: 71 },
  { code: 'SK', name: 'Skyline Direct', quality: 54 },
];

const CABIN_MULTIPLIER: Record<FlightBooking['cabin'], number> = {
  economy: 1, premium_economy: 1.85, business: 4.2, first: 8.5, private: 0,
};

const PRIVATE_AIRCRAFT = [
  { id: 'light_jet', name: 'Light Jet', seats: 7, rangeKm: 3200, hourlyRate: 4_200_00, runwayFeet: 4500 },
  { id: 'midsize_jet', name: 'Midsize Jet', seats: 9, rangeKm: 5600, hourlyRate: 6_800_00, runwayFeet: 5200 },
  { id: 'heavy_jet', name: 'Heavy Jet', seats: 14, rangeKm: 11000, hourlyRate: 11_500_00, runwayFeet: 6000 },
  { id: 'ultra_long', name: 'Ultra Long Range', seats: 16, rangeKm: 14800, hourlyRate: 16_400_00, runwayFeet: 6500 },
] as const;

export function registerTravel(sim: Simulation): void {
  sim.onSchedule('travel.depart', (item) => departFlight(sim, item.payload.bookingId as Id));
  sim.onSchedule('travel.arrive', (item) => arriveFlight(sim, item.payload.bookingId as Id));
  sim.onSchedule('travel.check_in', (item) => checkIntoHotel(sim, item.payload.bookingId as Id));
  sim.onSchedule('travel.check_out', (item) => checkOutOfHotel(sim, item.payload.bookingId as Id));

  sim.onCommand<{ name: string; purpose: Trip['purpose']; destinations: string[]; departAt: number; returnAt?: number; travellerIds?: Id[]; budget?: Money }, { tripId: Id }>(
    'travel.plan_trip',
    (p, { sim: s }) => {
      if (p.destinations.length === 0) throw new CommandError('A trip needs at least one destination.');
      for (const city of p.destinations) CITIES.require(city);
      if (p.departAt < s.now) throw new CommandError('You cannot depart in the past.');

      const player = s.player;
      const legs: TripLeg[] = [];
      let from = player.currentLocationId;
      let cursor = p.departAt;

      for (const to of p.destinations) {
        const duration = estimateFlightMinutes(from, to);
        legs.push({
          id: s.nextId('trip'),
          fromLocationId: from,
          toLocationId: to,
          departAt: cursor,
          arriveAt: cursor + duration * MS_MINUTE,
          mode: 'commercial_air',
        });
        cursor += duration * MS_MINUTE + 2 * 24 * MS_HOUR;
        from = to;
      }
      if (p.returnAt) {
        const duration = estimateFlightMinutes(from, player.currentLocationId);
        legs.push({
          id: s.nextId('trip'),
          fromLocationId: from,
          toLocationId: player.currentLocationId,
          departAt: p.returnAt,
          arriveAt: p.returnAt + duration * MS_MINUTE,
          mode: 'commercial_air',
        });
      }

      const trip: Trip = {
        id: s.nextId('trip'),
        saveId: s.universe.meta.id,
        travellerIds: p.travellerIds ?? [player.id],
        organiserId: player.id,
        name: p.name,
        purpose: p.purpose,
        legs,
        departAt: p.departAt,
        returnAt: p.returnAt,
        budget: p.budget ?? 0,
        spent: 0,
        status: 'planning',
        bookingIds: [],
        createdAt: s.now,
      };
      s.universe.trips[trip.id] = trip;
      s.emit('travel.trip_planned', { tripId: trip.id, destinations: p.destinations });
      return { tripId: trip.id };
    },
  );

  sim.onCommand<{ fromCityId?: string; toCityId: string; departAt: number; cabin: FlightBooking['cabin']; passengerIds?: Id[]; tripId?: Id; refundable?: boolean; accountId?: Id; airlineCode?: string }, { bookingId: Id; fare: Money; arriveAt: number }>(
    'travel.book_flight',
    (p, { sim: s }) => {
      const player = s.player;
      const fromCity = p.fromCityId ?? player.currentLocationId;
      if (fromCity === p.toCityId) throw new CommandError('You are already there.');
      CITIES.require(p.toCityId);

      const options = searchFlights(s, fromCity, p.toCityId, p.departAt);
      const option = p.airlineCode ? options.find((o) => o.airlineCode === p.airlineCode) ?? options[0] : options[0];
      if (!option) throw new CommandError('No flights available on that route.');

      const passengers = p.passengerIds ?? [player.id];
      const baseFare = option.fares[p.cabin];
      const refundSurcharge = p.refundable ? applyRate(baseFare, option.refundableSurcharge) : 0;
      const fare = (baseFare + refundSurcharge) * passengers.length;
      const taxes = applyRate(fare, 0.11);
      const total = fare + taxes;

      const accountId = p.accountId ?? player.primaryAccountId;
      if (!accountId) throw new CommandError('No account to pay from.');
      if (s.ledger.availableFunds(accountId) < total) {
        throw new CommandError(`That fare is ${formatMoney(total)} for ${passengers.length} passenger${passengers.length === 1 ? '' : 's'} and you cannot cover it.`);
      }
      s.expense(accountId, total, `${option.airlineName} ${option.flightNumber}`, 'travel');

      const booking: FlightBooking = {
        id: s.nextId('flight'),
        saveId: s.universe.meta.id,
        tripId: p.tripId,
        passengerIds: passengers,
        airlineCode: option.airlineCode,
        airlineName: option.airlineName,
        flightNumber: option.flightNumber,
        fromAirport: option.fromAirport,
        toAirport: option.toAirport,
        departAt: option.departAt,
        arriveAt: option.arriveAt,
        cabin: p.cabin,
        seats: passengers.map((_, i) => `${12 + i}${'ABCDEF'[i % 6]}`),
        fare,
        taxesFees: taxes,
        bags: passengers.length,
        status: 'booked',
        refundable: p.refundable ?? false,
        loyaltyMilesEarned: Math.round(cityDistanceKm(fromCity, p.toCityId) * 0.62 * (p.cabin === 'business' ? 1.5 : p.cabin === 'first' ? 2 : 1)),
        bookedAt: s.now,
      };
      s.universe.flightBookings[booking.id] = booking;

      if (p.tripId) {
        const trip = s.universe.trips[p.tripId];
        if (trip) { trip.bookingIds.push(booking.id); trip.spent += total; trip.status = 'booked'; }
      }

      // Getting to the airport is part of the commitment.
      s.schedule({
        at: option.departAt - 2 * MS_HOUR,
        kind: 'travel.depart',
        label: `${option.airlineName} ${option.flightNumber} To ${CITIES.require(p.toCityId).name}`,
        category: 'travel',
        payload: { bookingId: booking.id },
        priority: 15,
        refType: 'flight', refId: booking.id,
        requiresPlayer: passengers.includes(player.id),
        locationId: fromCity,
        durationMinutes: Math.round((option.arriveAt - option.departAt) / MS_MINUTE) + 120,
      });
      s.schedule({
        at: option.arriveAt,
        kind: 'travel.arrive',
        label: `Arrive In ${CITIES.require(p.toCityId).name}`,
        category: 'travel',
        payload: { bookingId: booking.id },
        priority: 15,
        refType: 'flight', refId: booking.id,
      });

      s.emit('travel.flight_booked', { bookingId: booking.id, fromCity, toCity: p.toCityId, cabin: p.cabin, total });
      return { bookingId: booking.id, fare: total, arriveAt: option.arriveAt };
    },
  );

  sim.onCommand<{ toCityId: string; departAt: number; aircraftId: string; passengerIds?: Id[]; accountId?: Id }, { bookingId: Id; cost: Money; arriveAt: number }>(
    'travel.charter_private',
    (p, { sim: s }) => {
      const player = s.player;
      const fromCity = player.currentLocationId;
      const aircraft = PRIVATE_AIRCRAFT.find((a) => a.id === p.aircraftId);
      if (!aircraft) throw new CommandError('No such aircraft type.');

      const distance = cityDistanceKm(fromCity, p.toCityId);
      if (distance > aircraft.rangeKm) {
        throw new CommandError(
          `A ${aircraft.name} has a range of ${aircraft.rangeKm.toLocaleString('en-US')} km. That route is ${Math.round(distance).toLocaleString('en-US')} km, so it would need a fuel stop or a larger aircraft.`,
        );
      }

      const fromAirportId = nearestAirport(fromCity);
      const toAirportId = nearestAirport(p.toCityId);
      const toAirport = toAirportId ? AIRPORTS.get(toAirportId) : undefined;
      if (toAirport && toAirport.runwayFeet < aircraft.runwayFeet) {
        throw new CommandError(
          `${toAirport.name} has a ${toAirport.runwayFeet.toLocaleString('en-US')} foot runway. A ${aircraft.name} needs ${aircraft.runwayFeet.toLocaleString('en-US')} feet.`,
        );
      }

      const passengers = p.passengerIds ?? [player.id];
      if (passengers.length > aircraft.seats) throw new CommandError(`A ${aircraft.name} seats ${aircraft.seats}.`);

      const hours = distance / 800 + 0.6;
      const cost = Math.round(aircraft.hourlyRate * hours * 1.18);
      const accountId = p.accountId ?? player.primaryAccountId;
      if (!accountId) throw new CommandError('No account to pay from.');
      if (s.ledger.availableFunds(accountId) < cost) {
        throw new CommandError(`Chartering a ${aircraft.name} on that route is about ${formatMoney(cost)}.`);
      }
      s.expense(accountId, cost, `Private charter — ${aircraft.name}`, 'travel');

      const arriveAt = p.departAt + Math.round(hours * MS_HOUR);
      const booking: FlightBooking = {
        id: s.nextId('flight'),
        saveId: s.universe.meta.id,
        passengerIds: passengers,
        airlineCode: 'PVT',
        airlineName: `Private charter (${aircraft.name})`,
        flightNumber: `PVT${s.counter('charter')}`,
        fromAirport: fromAirportId ?? '',
        toAirport: toAirportId ?? '',
        departAt: p.departAt,
        arriveAt,
        cabin: 'private',
        seats: [],
        fare: cost,
        taxesFees: 0,
        bags: passengers.length * 2,
        status: 'booked',
        refundable: false,
        loyaltyMilesEarned: 0,
        bookedAt: s.now,
      };
      s.universe.flightBookings[booking.id] = booking;

      s.schedule({
        at: p.departAt - 25 * MS_MINUTE,
        kind: 'travel.depart',
        label: `Private Charter To ${CITIES.require(p.toCityId).name}`,
        category: 'travel',
        payload: { bookingId: booking.id },
        priority: 15,
        refType: 'flight', refId: booking.id,
        requiresPlayer: true, locationId: fromCity,
        durationMinutes: Math.round(hours * 60) + 30,
      });
      s.schedule({
        at: arriveAt, kind: 'travel.arrive',
        label: `Arrive In ${CITIES.require(p.toCityId).name}`,
        category: 'travel',
        payload: { bookingId: booking.id }, priority: 15,
        refType: 'flight', refId: booking.id,
      });

      s.emit('travel.charter_booked', { bookingId: booking.id, aircraft: aircraft.id, cost, toCity: p.toCityId });
      return { bookingId: booking.id, cost, arriveAt };
    },
  );

  sim.onCommand<{ cityId: string; checkInAt: number; nights: number; roomClass: HotelBooking['roomClass']; guestIds?: Id[]; tripId?: Id; accountId?: Id }, { bookingId: Id; total: Money }>(
    'travel.book_hotel',
    (p, { sim: s }) => {
      const city = CITIES.require(p.cityId);
      const player = s.player;
      const nights = clamp(Math.round(p.nights), 1, 365);

      const rng = s.rng('hotel', p.cityId, p.checkInAt);
      const classMultiplier: Record<HotelBooking['roomClass'], number> = { standard: 1, deluxe: 1.6, suite: 3.2, penthouse: 8.5 };
      const nightlyRate = Math.round(210_00 * costOfLiving(p.cityId) * classMultiplier[p.roomClass] * rng.float(0.85, 1.25));
      const total = nightlyRate * nights;
      const taxes = applyRate(total, 0.145);

      const accountId = p.accountId ?? player.primaryAccountId;
      if (!accountId) throw new CommandError('No account to pay from.');
      if (s.ledger.availableFunds(accountId) < total + taxes) {
        throw new CommandError(`${nights} night${nights === 1 ? '' : 's'} at ${formatMoney(nightlyRate)} comes to ${formatMoney(total + taxes)} with tax.`);
      }
      s.expense(accountId, total + taxes, `Hotel — ${city.name}`, 'travel');

      const hotelNames = ['The Meridian', 'Harbourstone House', 'The Lantern', 'Kestrel Hotel', 'The Northfield'];
      const booking: HotelBooking = {
        id: s.nextId('stay'),
        saveId: s.universe.meta.id,
        tripId: p.tripId,
        guestIds: p.guestIds ?? [player.id],
        hotelRefId: `hotel_${p.cityId}`,
        hotelName: `${rng.pick(hotelNames)} ${city.name}`,
        locationId: p.cityId,
        roomClass: p.roomClass,
        checkInAt: p.checkInAt,
        checkOutAt: addDays(p.checkInAt, nights, s.homeZone),
        nights,
        nightlyRate,
        taxesFees: taxes,
        total: total + taxes,
        status: 'booked',
        incidentals: 0,
        bookedAt: s.now,
      };
      s.universe.hotelBookings[booking.id] = booking;

      s.schedule({
        at: booking.checkInAt, kind: 'travel.check_in',
        label: `Check In — ${booking.hotelName}`,
        category: 'travel', payload: { bookingId: booking.id }, priority: 30,
        refType: 'stay', refId: booking.id, locationId: p.cityId,
      });
      s.schedule({
        at: booking.checkOutAt, kind: 'travel.check_out',
        label: `Check Out — ${booking.hotelName}`,
        category: 'travel', payload: { bookingId: booking.id }, priority: 30,
        refType: 'stay', refId: booking.id, locationId: p.cityId,
      });

      if (p.tripId) {
        const trip = s.universe.trips[p.tripId];
        if (trip) { trip.bookingIds.push(booking.id); trip.spent += total + taxes; }
      }
      s.emit('travel.hotel_booked', { bookingId: booking.id, cityId: p.cityId, nights, total: total + taxes });
      return { bookingId: booking.id, total: total + taxes };
    },
  );

  sim.onCommand<{ bookingId: Id }, { refund: Money }>(
    'travel.cancel_flight',
    (p, { sim: s }) => {
      const booking = s.universe.flightBookings[p.bookingId];
      if (!booking || booking.status !== 'booked') throw new CommandError('That booking cannot be cancelled.');
      const refund = booking.refundable
        ? booking.fare + booking.taxesFees
        : booking.departAt - s.now > 24 * MS_HOUR ? applyRate(booking.fare, 0.25) : 0;

      booking.status = booking.refundable ? 'refunded' : 'cancelled';
      s.timeline.cancelFor('flight', booking.id, s.now);
      if (refund > 0) {
        const accountId = s.player.primaryAccountId;
        if (accountId) s.income(accountId, refund, `Refund — ${booking.airlineName} ${booking.flightNumber}`, 'travel', { refType: 'flight', refId: booking.id });
      }
      s.emit('travel.flight_cancelled', { bookingId: booking.id, refund });
      return { refund };
    },
  );
}

// ---------------------------------------------------------------------------
// Mechanics
// ---------------------------------------------------------------------------

export function estimateFlightMinutes(fromCityId: string, toCityId: string): number {
  const km = cityDistanceKm(fromCityId, toCityId);
  // Cruise speed plus taxi, climb and descent overhead.
  return Math.round(km / 13.6 + 42);
}

export function searchFlights(sim: Simulation, fromCityId: string, toCityId: string, departAt: number): FlightOption[] {
  const fromAirportId = nearestAirport(fromCityId);
  const toAirportId = nearestAirport(toCityId);
  if (!fromAirportId || !toAirportId) return [];
  const fromAirport = AIRPORTS.require(fromAirportId);
  const toAirport = AIRPORTS.require(toAirportId);

  const km = cityDistanceKm(fromCityId, toCityId);
  const baseMinutes = estimateFlightMinutes(fromCityId, toCityId);
  const connectivity = (fromAirport.connectivity + toAirport.connectivity) / 200;
  const rng = sim.rng('flights', fromCityId, toCityId, Math.floor(departAt / (6 * MS_HOUR)));

  const options: FlightOption[] = [];
  const count = clamp(Math.round(2 + connectivity * 4), 2, 6);

  for (let i = 0; i < count; i++) {
    const airline = AIRLINES[i % AIRLINES.length] as (typeof AIRLINES)[number];
    const stops = connectivity > 0.7 && i < 2 ? 0 : rng.chance(0.55 - connectivity * 0.4) ? 1 : 0;
    const duration = baseMinutes + stops * rng.int(75, 190);
    const offsetHours = rng.float(-4, 10) + i * 1.5;
    const depart = departAt + Math.round(offsetHours * MS_HOUR);

    // Fare model: distance, airline quality, how close to departure you booked.
    const advanceDays = Math.max(0, (depart - sim.now) / (24 * MS_HOUR));
    const urgencyMultiplier = remap(advanceDays, 0, 45, 2.2, 0.85);
    const base = Math.round((78_00 + km * 21) * urgencyMultiplier * remap(airline.quality, 40, 90, 0.82, 1.18) * (stops > 0 ? 0.83 : 1));

    options.push({
      airlineCode: airline.code,
      airlineName: airline.name,
      flightNumber: `${airline.code}${100 + rng.int(0, 899)}`,
      fromAirport: fromAirport.iata,
      toAirport: toAirport.iata,
      departAt: depart,
      arriveAt: depart + duration * MS_MINUTE,
      durationMinutes: duration,
      stops,
      fares: {
        economy: base,
        premium_economy: Math.round(base * CABIN_MULTIPLIER.premium_economy),
        business: Math.round(base * CABIN_MULTIPLIER.business),
        first: Math.round(base * CABIN_MULTIPLIER.first),
        private: 0,
      },
      refundableSurcharge: 0.32,
    });
  }
  return options.sort((a, b) => a.departAt - b.departAt);
}

function departFlight(sim: Simulation, bookingId: Id): void {
  const booking = sim.universe.flightBookings[bookingId];
  if (!booking || booking.status !== 'booked') return;
  booking.status = 'checked_in';
  const player = sim.universe.people[sim.universe.playerId];
  if (player && booking.passengerIds.includes(player.id)) {
    player.wellbeing.energy = clamp(player.wellbeing.energy - 8, 0, 100);
    player.wellbeing.stress = clamp(player.wellbeing.stress + 6, 0, 100);
  }
  sim.emit('travel.departed', { bookingId, toAirport: booking.toAirport });
}

function arriveFlight(sim: Simulation, bookingId: Id): void {
  const booking = sim.universe.flightBookings[bookingId];
  if (!booking || booking.status === 'cancelled') return;
  booking.status = 'flown';

  const toAirport = AIRPORTS.byName(booking.toAirport) ?? AIRPORTS.all().find((a) => a.iata === booking.toAirport);
  const toCityId = toAirport?.parentId;
  if (!toCityId) return;

  const durationHours = (booking.arriveAt - booking.departAt) / MS_HOUR;

  for (const passengerId of booking.passengerIds) {
    const person = sim.universe.people[passengerId];
    if (!person) continue;
    const fromZone = CITIES.get(person.currentLocationId)?.timeZone;
    const toZone = CITIES.require(toCityId).timeZone;

    person.currentLocationId = toCityId;

    // Jet lag is real, and it is a function of how many zones you crossed.
    const zoneShiftHours = fromZone && toZone
      ? Math.abs(zoneOffsetMs(sim.now, toZone) - zoneOffsetMs(sim.now, fromZone)) / MS_HOUR
      : 0;
    const cabinComfort = booking.cabin === 'private' ? 0.35 : booking.cabin === 'first' ? 0.5 : booking.cabin === 'business' ? 0.65 : booking.cabin === 'premium_economy' ? 0.85 : 1;

    person.wellbeing.travelFatigue = clamp(
      person.wellbeing.travelFatigue + (durationHours * 4 + zoneShiftHours * 7) * cabinComfort,
      0, 100,
    );
    person.wellbeing.energy = clamp(person.wellbeing.energy - durationHours * 3.2 * cabinComfort, 0, 100);
    person.wellbeing.sleepDebt = Math.min(60, person.wellbeing.sleepDebt + zoneShiftHours * 0.5);

    if (person.isPlayer) {
      sim.universe.currentZone = toZone;
      sim.emit('travel.arrived', { personId: person.id, cityId: toCityId, zoneShiftHours, durationHours });
    }
  }

  const trip = booking.tripId ? sim.universe.trips[booking.tripId] : undefined;
  if (trip) trip.status = 'in_progress';

  sim.remember({
    category: 'travel',
    title: `Flew to ${CITIES.require(toCityId).name}`,
    detail: `${booking.airlineName} ${booking.flightNumber}, ${booking.cabin.replace(/_/g, ' ')}.`,
    refs: [{ type: 'flight', id: booking.id }],
    significance: 15, public: false, amount: booking.fare,
  });
}

function checkIntoHotel(sim: Simulation, bookingId: Id): void {
  const booking = sim.universe.hotelBookings[bookingId];
  if (!booking || booking.status !== 'booked') return;
  booking.status = 'checked_in';
  const comfort: Record<HotelBooking['roomClass'], number> = { standard: 0, deluxe: 3, suite: 7, penthouse: 12 };
  for (const guestId of booking.guestIds) {
    const person = sim.universe.people[guestId];
    if (person) person.wellbeing.morale = clamp(person.wellbeing.morale + comfort[booking.roomClass], 0, 100);
  }
  sim.emit('travel.checked_in', { bookingId, hotelName: booking.hotelName });
}

function checkOutOfHotel(sim: Simulation, bookingId: Id): void {
  const booking = sim.universe.hotelBookings[bookingId];
  if (!booking || booking.status !== 'checked_in') return;
  booking.status = 'checked_out';

  const rng = sim.rng('incidentals', booking.id);
  const incidentals = Math.round(booking.nights * rng.float(0, 70_00));
  if (incidentals > 0) {
    booking.incidentals = incidentals;
    const accountId = sim.player.primaryAccountId;
    if (accountId && sim.ledger.availableFunds(accountId) >= incidentals) {
      sim.expense(accountId, incidentals, `Incidentals — ${booking.hotelName}`, 'travel', { refType: 'stay', refId: booking.id });
    }
  }
  sim.emit('travel.checked_out', { bookingId, incidentals });
}

export function privateAircraftOptions(fromCityId: string, toCityId: string) {
  const distance = cityDistanceKm(fromCityId, toCityId);
  const toAirportId = nearestAirport(toCityId);
  const toAirport = toAirportId ? AIRPORTS.get(toAirportId) : undefined;
  return PRIVATE_AIRCRAFT.map((a) => {
    const hours = distance / 800 + 0.6;
    const rangeOk = distance <= a.rangeKm;
    const runwayOk = !toAirport || toAirport.runwayFeet >= a.runwayFeet;
    return {
      ...a,
      estimatedCost: Math.round(a.hourlyRate * hours * 1.18),
      estimatedHours: Number(hours.toFixed(1)),
      available: rangeOk && runwayOk,
      reason: !rangeOk
        ? `Range is ${a.rangeKm.toLocaleString('en-US')} km; the route is ${Math.round(distance).toLocaleString('en-US')} km.`
        : !runwayOk
          ? `${toAirport?.name} cannot take this aircraft.`
          : undefined,
    };
  });
}

/** Travel time by road, for same-region movement. */
export function driveMinutes(fromCityId: string, toCityId: string): number | undefined {
  const km = cityDistanceKm(fromCityId, toCityId);
  if (km > 1200) return undefined;
  return Math.round((km / 88) * 60 + 15);
}
