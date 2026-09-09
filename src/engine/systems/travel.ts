/**
 * SLATE — Travel: trips, commercial and private aviation, hotels.
 *
 * Travel is the system that ties geography, the calendar, the world clock and
 * the player's location together. Flying to London changes what time it is for
 * you, what you can attend, how tired you are and what things cost.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { FlightBooking, HotelBooking, Id, Trip, TripLeg, Person } from '../domain/model';
import { clamp, remap } from '../core/rng';
import { addDays, MS_DAY, MS_HOUR, MS_MINUTE, zoneOffsetMs } from '../core/time';
import { applyRate, formatMoney, type Money } from '../core/money';
import { AIRPORTS, CITIES, cityDistanceKm, nearestAirport } from '../content/geography';
import { costOfLiving } from '../content/tax';
import type { Vehicle } from '../domain/model';
import { addMileage, craftOf, hourlyCostOf, requireInHand, vehicleKind } from './vehicles';

/** Landing, handling and parking at the far end, before cost of living. SLATE's own. */
const LANDING_FEES: Money = 650_00;

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

// Real airlines and who flies where live in content/airlines. They are
// re-exported here so nothing that imported them from the travel system
// has to move.
import { airlinesFor } from '../content/airlines';
import {
  AIRBNB_UNAVAILABLE, NOWHERE_TO_STAY, airbnbAvailable, chainsIn, hotelBrandById, hotelBrandsFor,
  type HotelBrand, type RoomClass,
} from '../content/hotels';
import { placesIn } from '../content/places';
import { countryOfCity } from '../content/geography';
import { passportCheck } from './documents';
import { makeBackgroundPerson, peopleOf } from './people';
import { plural } from '../core/text';
import { rememberFact } from './memory';
export { AIRLINES, REAL_CARRIER_NOTE, airlinesFor, coverageOf, type Airline } from '../content/airlines';
export { AIRBNB_NOTE, REAL_HOTEL_NOTE, airbnbAvailable, stayCoverageOf } from '../content/hotels';
export const REAL_JET_NOTE = 'A real aircraft type; seats, range and runway are manufacturer figures, rounded. The hourly rate is SLATE\'s own.';

const CABIN_MULTIPLIER: Record<FlightBooking['cabin'], number> = {
  economy: 1, premium_economy: 1.85, business: 4.2, first: 8.5, private: 0,
};

/**
 * Real aircraft types for charter. Seats, range and runway are the makers'
 * published figures, rounded; the hourly rate is SLATE's own calibration of
 * the charter market, not a quote from anyone.
 */
const PRIVATE_AIRCRAFT = [
  { id: 'phenom_300', name: 'Embraer Phenom 300', category: 'Light Jet', seats: 7, rangeKm: 3700, hourlyRate: 4_200_00, runwayFeet: 3200 },
  { id: 'citation_latitude', name: 'Cessna Citation Latitude', category: 'Midsize Jet', seats: 9, rangeKm: 5000, hourlyRate: 6_300_00, runwayFeet: 3600 },
  { id: 'challenger_350', name: 'Bombardier Challenger 350', category: 'Super Midsize Jet', seats: 10, rangeKm: 5900, hourlyRate: 7_800_00, runwayFeet: 4800 },
  { id: 'g650er', name: 'Gulfstream G650ER', category: 'Ultra Long Range', seats: 19, rangeKm: 13900, hourlyRate: 15_500_00, runwayFeet: 6000 },
  { id: 'global_7500', name: 'Bombardier Global 7500', category: 'Ultra Long Range', seats: 19, rangeKm: 14200, hourlyRate: 16_400_00, runwayFeet: 5800 },
] as const;

export function registerTravel(sim: Simulation): void {
  // Three hours before a flight is the journey system's to ask about: play the
  // day, just go, or stay home. Somebody else's flight simply departs.
  sim.onSchedule('travel.depart', (item) => {
    sim.emit('travel.departure_due', { bookingId: item.payload.bookingId, itemId: item.id });
  });
  sim.onSchedule('travel.arrive', (item) => arriveFlight(sim, item.payload.bookingId as Id));
  sim.onSchedule('travel.check_in', (item) => checkIntoHotel(sim, item.payload.bookingId as Id));
  sim.onSchedule('travel.check_out', (item) => checkOutOfHotel(sim, item.payload.bookingId as Id));

  sim.onCommand<{ name: string; purpose: Trip['purpose']; destinations: string[]; departAt: number; returnAt?: number; travellerIds?: Id[]; budget?: Money }, { tripId: Id }>(
    'travel.plan_trip',
    (p, { sim: s }) => {
      if (p.destinations.length === 0) throw new CommandError('A trip needs at least one destination.');
      for (const city of p.destinations) CITIES.require(city);
      if (p.departAt < s.now) throw new CommandError('You can’t depart in the past.');

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
      if (fromCity === p.toCityId) throw new CommandError('You’re already there.');
      CITIES.require(p.toCityId);

      const options = searchFlights(s, fromCity, p.toCityId, p.departAt);
      const option = p.airlineCode ? options.find((o) => o.airlineCode === p.airlineCode) ?? options[0] : options[0];
      if (!option) throw new CommandError('No flights available on that route.');

      const passengers = p.passengerIds ?? [player.id];
      // A border wants a passport from everybody on the booking, before any
      // money moves: missing, expired, lost or still at the office refuses
      // here rather than at the desk. Six months left warns and never refuses.
      const toCountry = countryOfCity(p.toCityId);
      const fromCountry = countryOfCity(fromCity);
      let documentNote: string | undefined;
      if (toCountry && fromCountry && toCountry !== fromCountry) {
        for (const id of passengers) {
          const person = s.universe.people[id];
          if (!person) continue;
          const check = passportCheck(s, person, toCountry);
          if (!check.ok) throw new CommandError(check.reason ?? 'No passport.');
          if (check.warning && !documentNote) documentNote = check.warning;
        }
      }
      const baseFare = option.fares[p.cabin];
      const refundSurcharge = p.refundable ? applyRate(baseFare, option.refundableSurcharge) : 0;
      const fare = (baseFare + refundSurcharge) * passengers.length;
      const taxes = applyRate(fare, 0.11);
      const total = fare + taxes;

      const accountId = p.accountId ?? player.primaryAccountId;
      if (!accountId) throw new CommandError('No account to pay from.');
      if (s.ledger.availableFunds(accountId) < total) {
        throw new CommandError(`That fare is ${formatMoney(total)} for ${passengers.length} passenger${passengers.length === 1 ? '' : 's'} and you can’t cover it.`);
      }
      s.expense(accountId, total, `${option.airlineName} ${option.flightNumber}`, 'travel');

      const booking = createFlightBooking(s, { fromCity, toCity: p.toCityId, option, cabin: p.cabin, passengers, fare, taxes, refundable: p.refundable ?? false, tripId: p.tripId });
      s.emit('travel.flight_booked', { bookingId: booking.id, fromCity, toCity: p.toCityId, cabin: p.cabin, total });
      if (documentNote && fromCity === player.currentLocationId) {
        s.notify({ category: 'papers', title: 'Check Your Passport Before You Go', body: documentNote, importance: 45, route: '/workspace/character', refType: 'flight', refId: booking.id });
      }
      return { bookingId: booking.id, fare: total, arriveAt: option.arriveAt, documentNote };
    },
  );

  sim.onCommand<{ toCityId: string; departAt: number; aircraftId?: string; vehicleId?: Id; passengerIds?: Id[]; accountId?: Id }, { bookingId: Id; cost: Money; arriveAt: number }>(
    'travel.charter_private',
    (p, { sim: s }) => {
      const player = s.player;
      const fromCity = player.currentLocationId;
      // Your own aircraft flies at what it costs to run; a charter flies at
      // the market's rate. Either way the route is checked against the
      // aircraft, not the price.
      const owned = p.vehicleId ? ownedAircraft(s, p.vehicleId) : undefined;
      const aircraft = owned
        ? ownedAsAircraft(s, owned)
        : PRIVATE_AIRCRAFT.find((a) => a.id === p.aircraftId);
      if (!aircraft) throw new CommandError('No such aircraft type.');
      if (owned && (owned.locationId ?? fromCity) !== fromCity) throw new CommandError(`The ${owned.make} ${owned.model} is in ${CITIES.get(owned.locationId ?? '')?.name ?? 'another city'}.`);

      const distance = cityDistanceKm(fromCity, p.toCityId);
      if (distance > aircraft.rangeKm) {
        throw new CommandError(
          `A ${aircraft.name} has a range of ${aircraft.rangeKm.toLocaleString('en-US')} km. That route is ${Math.round(distance).toLocaleString('en-US')} km, so it would need a fuel stop or a larger aircraft.`,
        );
      }

      const fromAirportId = nearestAirport(fromCity);
      const toAirportId = nearestAirport(p.toCityId);
      const fromAirport = fromAirportId ? AIRPORTS.get(fromAirportId) : undefined;
      const toAirport = toAirportId ? AIRPORTS.get(toAirportId) : undefined;
      if (toAirport && toAirport.runwayFeet < aircraft.runwayFeet) {
        throw new CommandError(
          `${toAirport.name} has a ${toAirport.runwayFeet.toLocaleString('en-US')} foot runway. A ${aircraft.name} needs ${aircraft.runwayFeet.toLocaleString('en-US')} feet.`,
        );
      }

      const passengers = p.passengerIds ?? [player.id];
      if (passengers.length > aircraft.seats) throw new CommandError(`A ${aircraft.name} seats ${aircraft.seats}.`);

      const hours = distance / 800 + 0.6;
      const cost = owned
        ? Math.round(aircraft.hourlyRate * hours + LANDING_FEES * costOfLiving(p.toCityId))
        : Math.round(aircraft.hourlyRate * hours * 1.18);
      const accountId = p.accountId ?? player.primaryAccountId;
      if (!accountId) throw new CommandError('No account to pay from.');
      if (s.ledger.availableFunds(accountId) < cost) {
        throw new CommandError(owned
          ? `Flying the ${aircraft.name} there’s about ${formatMoney(cost)} in fuel, crew and fees.`
          : `Chartering a ${aircraft.name} on that route is about ${formatMoney(cost)}.`);
      }
      s.expense(accountId, cost, owned ? `Flight — ${aircraft.name}` : `Private charter — ${aircraft.name}`, 'travel', owned ? { refType: 'vehicle', refId: owned.id } : undefined);

      const arriveAt = p.departAt + Math.round(hours * MS_HOUR);
      const booking: FlightBooking = {
        id: s.nextId('flight'),
        saveId: s.universe.meta.id,
        passengerIds: passengers,
        airlineCode: 'PVT',
        airlineName: owned ? (owned.nickname ? owned.nickname : `Your ${aircraft.name}`) : `Private charter (${aircraft.name})`,
        flightNumber: `PVT${s.counter('charter')}`,
        vehicleId: owned?.id,
        // The codes, as an airline booking carries them, so the day reads
        // the same city off either kind of booking.
        fromAirport: fromAirport?.iata ?? fromAirportId ?? '',
        toAirport: toAirport?.iata ?? toAirportId ?? '',
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
        label: `${owned ? 'Fly' : 'Private Charter'} To ${CITIES.require(p.toCityId).name}`,
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

      s.emit('travel.charter_booked', { bookingId: booking.id, aircraft: aircraft.id, cost, toCity: p.toCityId, vehicleId: owned?.id });
      return { bookingId: booking.id, cost, arriveAt };
    },
  );

  sim.onCommand<{ cityId: string; checkInAt: number; nights: number; roomClass: HotelBooking['roomClass']; guestIds?: Id[]; tripId?: Id; accountId?: Id; brandId?: string }, { bookingId: Id; total: Money }>(
    'travel.book_hotel',
    (p, { sim: s }) => {
      const city = CITIES.require(p.cityId);
      const player = s.player;
      const nights = clamp(Math.round(p.nights), 1, 365);

      // Priced from the same list the screen showed, so what you saw is what
      // you pay: the brand you named, or the first real one at that class, or
      // one of SLATE's own where no chain sells it.
      if (NOWHERE_TO_STAY[city.countryId]) throw new CommandError(NOWHERE_TO_STAY[city.countryId]!);
      const shown = stayOptions(s, p.cityId, p.checkInAt, nights).filter((o) => o.kind !== 'airbnb' && o.roomClass === p.roomClass);
      const option = p.brandId ? shown.find((o) => o.brandId === p.brandId) : shown[0];
      if (p.brandId && !option) throw new CommandError('That brand has no hotel there.');
      if (!option) throw new CommandError(`Nowhere in ${city.name} sells that class of room (${p.roomClass}).`);
      const nightlyRate = option.nightlyRate;
      const total = nightlyRate * nights;
      const taxes = option.taxesFees;

      const accountId = p.accountId ?? player.primaryAccountId;
      if (!accountId) throw new CommandError('No account to pay from.');
      if (s.ledger.availableFunds(accountId) < total + taxes) {
        throw new CommandError(`${nights} night${nights === 1 ? '' : 's'} at ${formatMoney(nightlyRate)} comes to ${formatMoney(total + taxes)} with tax.`);
      }
      s.expense(accountId, total + taxes, `Hotel — ${city.name}`, 'travel');

      // A real brand that has a hotel in this country, or one of SLATE's own
      // hotels named as such: whichever the option the screen showed was.
      const brand: HotelBrand | undefined = option.brandId ? hotelBrandById(option.brandId) : undefined;
      const booking: HotelBooking = {
        id: s.nextId('stay'),
        saveId: s.universe.meta.id,
        tripId: p.tripId,
        guestIds: p.guestIds ?? [player.id],
        hotelRefId: brand ? `hotel_${p.cityId}_${brand.id}` : `hotel_${p.cityId}`,
        hotelName: brand ? option.name : `${option.name} (One Of SLATE’s Own)`,
        kind: 'hotel',
        brandId: brand?.id,
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

  /**
   * A room in somebody's home, through Airbnb.
   *
   * Airbnb is a real platform and it is honestly absent from a few places, so
   * the refusal says why. The listing, the host and the rate are SLATE's own.
   * Nightly, cleaning once, the platform's fee on top and tax on the nights,
   * the way the platform actually itemizes it. One charge, one booking.
   */
  sim.onCommand<{ cityId: string; checkInAt: number; nights: number; listingKind: 'entire_home' | 'private_room'; guestIds?: Id[]; tripId?: Id; accountId?: Id }, { bookingId: Id; total: Money; hostId: Id }>(
    'travel.book_stay',
    (p, { sim: s }) => {
      const city = CITIES.require(p.cityId);
      const player = s.player;
      const blocked = NOWHERE_TO_STAY[city.countryId] ?? AIRBNB_UNAVAILABLE[city.countryId];
      if (blocked) throw new CommandError(blocked);
      const nights = clamp(Math.round(p.nights), 1, 365);
      const option = stayOptions(s, p.cityId, p.checkInAt, nights).find((o) => o.kind === 'airbnb' && o.listing?.kind === p.listingKind);
      if (!option || !option.hostId || !option.listing) throw new CommandError('Nothing of that kind is listed there for those dates.');

      const accountId = p.accountId ?? player.primaryAccountId;
      if (!accountId) throw new CommandError('No account to pay from.');
      if (s.ledger.availableFunds(accountId) < option.total) {
        throw new CommandError(`${plural(nights, 'night')} at ${formatMoney(option.nightlyRate)}, plus ${formatMoney(option.cleaningFee)} cleaning and ${formatMoney(option.serviceFee)} service, comes to ${formatMoney(option.total)}.`);
      }
      s.expense(accountId, option.total, `Airbnb — ${option.name}, ${city.name}`, 'travel');

      const booking: HotelBooking = {
        id: s.nextId('stay'),
        saveId: s.universe.meta.id,
        tripId: p.tripId,
        guestIds: p.guestIds ?? [player.id],
        hotelRefId: `airbnb_${p.cityId}_${p.listingKind}`,
        hotelName: option.name,
        locationId: p.cityId,
        roomClass: option.roomClass,
        checkInAt: p.checkInAt,
        checkOutAt: addDays(p.checkInAt, nights, s.homeZone),
        nights,
        nightlyRate: option.nightlyRate,
        taxesFees: option.taxesFees,
        total: option.total,
        status: 'booked',
        incidentals: 0,
        bookedAt: s.now,
        kind: 'airbnb',
        hostId: option.hostId,
        listing: option.listing,
        cleaningFee: option.cleaningFee,
        serviceFee: option.serviceFee,
      };
      s.universe.hotelBookings[booking.id] = booking;
      s.schedule({ at: booking.checkInAt, kind: 'travel.check_in', label: `Check In — ${booking.hotelName}`, category: 'travel', payload: { bookingId: booking.id }, priority: 30, refType: 'stay', refId: booking.id, locationId: p.cityId });
      s.schedule({ at: booking.checkOutAt, kind: 'travel.check_out', label: `Check Out — ${booking.hotelName}`, category: 'travel', payload: { bookingId: booking.id }, priority: 30, refType: 'stay', refId: booking.id, locationId: p.cityId });
      if (p.tripId) { const trip = s.universe.trips[p.tripId]; if (trip) { trip.bookingIds.push(booking.id); trip.spent += option.total; } }
      rememberHost(s, booking);
      s.emit('travel.hotel_booked', { bookingId: booking.id, cityId: p.cityId, nights, total: option.total });
      return { bookingId: booking.id, total: option.total, hostId: option.hostId };
    },
  );

  /**
   * The journey and the place to stay, booked as one thing.
   *
   * Flight there, the stay at the other end, and the flight back if asked,
   * under one funds check and one idempotency key. If any leg fails after
   * another has charged, the charged legs are refunded and the whole thing
   * fails, so a retry can never leave you with a flight and no bed, or pay
   * for either twice.
   */
  sim.onCommand<{
    toCityId: string; departAt: number; returnAt?: number; nights: number; cabin: FlightBooking['cabin']; airlineCode?: string;
    stay: { kind: 'hotel'; roomClass: RoomClass; brandId?: string } | { kind: 'airbnb'; listingKind: 'entire_home' | 'private_room' } | { kind: 'none' };
    name?: string; purpose?: Trip['purpose']; passengerIds?: Id[]; accountId?: Id;
  }, { tripId: Id; flightId: Id; stayId?: Id; returnId?: Id; total: Money }>(
    'travel.book_trip',
    (p, { sim: s }) => {
      const player = s.player;
      const city = CITIES.require(p.toCityId);
      const accountId = p.accountId ?? player.primaryAccountId;
      if (!accountId) throw new CommandError('No account to pay from.');
      const nights = clamp(Math.round(p.nights), 1, 365);

      // Price every leg before charging any.
      const out = searchFlights(s, player.currentLocationId, p.toCityId, p.departAt);
      const flight = p.airlineCode ? out.find((o) => o.airlineCode === p.airlineCode) ?? out[0] : out[0];
      if (!flight) throw new CommandError('No flights available on that route.');
      const passengers = p.passengerIds ?? [player.id];
      const flightTotal = (() => { const fare = flight.fares[p.cabin] * passengers.length; return fare + applyRate(fare, 0.11); })();
      let stayTotal = 0;
      const arriveAt = flight.arriveAt;
      if (p.stay.kind !== 'none') {
        const options = stayOptions(s, p.toCityId, arriveAt, nights);
        const stay = p.stay;
        const pick = stay.kind === 'hotel'
          ? options.find((o) => (o.kind === 'hotel' || o.kind === 'own') && o.roomClass === stay.roomClass && (!stay.brandId || o.brandId === stay.brandId))
          : options.find((o) => o.kind === 'airbnb' && o.listing?.kind === stay.listingKind);
        if (!pick) {
          const why = NOWHERE_TO_STAY[city.countryId] ?? (p.stay.kind === 'airbnb' ? AIRBNB_UNAVAILABLE[city.countryId] : undefined);
          throw new CommandError(why ?? `Nothing of that kind to stay in at ${city.name} for those dates.`);
        }
        stayTotal = pick.total;
      }
      let returnTotal = 0;
      if (p.returnAt) {
        const back = searchFlights(s, p.toCityId, player.currentLocationId, p.returnAt)[0];
        if (!back) throw new CommandError('No flights back on that date.');
        const fare = back.fares[p.cabin] * passengers.length;
        returnTotal = fare + applyRate(fare, 0.11);
      }
      const total = flightTotal + stayTotal + returnTotal;
      if (s.ledger.availableFunds(accountId) < total) {
        throw new CommandError(`The whole trip comes to ${formatMoney(total)} — flights ${formatMoney(flightTotal + returnTotal)}, stay ${formatMoney(stayTotal)} — and you can’t cover it.`);
      }

      const { tripId } = s.must<{ tripId: Id }>({ kind: 'travel.plan_trip', payload: {
        name: p.name ?? `${city.name} Trip`, purpose: p.purpose ?? 'leisure', destinations: [p.toCityId], departAt: p.departAt, returnAt: p.returnAt, travellerIds: passengers,
      } });
      const charged: { amount: Money; leg: string }[] = [];
      try {
        const f = s.must<{ bookingId: Id; fare: Money; arriveAt: number }>({ kind: 'travel.book_flight', payload: { toCityId: p.toCityId, departAt: p.departAt, cabin: p.cabin, airlineCode: flight.airlineCode, passengerIds: passengers, tripId, accountId } });
        charged.push({ amount: f.fare, leg: 'flight' });
        let stayId: Id | undefined;
        if (p.stay.kind === 'hotel') {
          const h = s.must<{ bookingId: Id; total: Money }>({ kind: 'travel.book_hotel', payload: { cityId: p.toCityId, checkInAt: f.arriveAt, nights, roomClass: p.stay.roomClass, brandId: p.stay.brandId, guestIds: passengers, tripId, accountId } });
          charged.push({ amount: h.total, leg: 'hotel' }); stayId = h.bookingId;
        } else if (p.stay.kind === 'airbnb') {
          const a = s.must<{ bookingId: Id; total: Money }>({ kind: 'travel.book_stay', payload: { cityId: p.toCityId, checkInAt: f.arriveAt, nights, listingKind: p.stay.listingKind, guestIds: passengers, tripId, accountId } });
          charged.push({ amount: a.total, leg: 'stay' }); stayId = a.bookingId;
        }
        let returnId: Id | undefined;
        if (p.returnAt) {
          const r = s.must<{ bookingId: Id; fare: Money }>({ kind: 'travel.book_flight', payload: { fromCityId: p.toCityId, toCityId: player.currentLocationId, departAt: p.returnAt, cabin: p.cabin, passengerIds: passengers, tripId, accountId } });
          charged.push({ amount: r.fare, leg: 'return' }); returnId = r.bookingId;
        }
        const trip = s.universe.trips[tripId]; if (trip) trip.status = 'booked';
        s.emit('travel.trip_booked', { tripId, flightId: f.bookingId, stayId, returnId, total });
        return { tripId, flightId: f.bookingId, stayId, returnId, total };
      } catch (error) {
        // Give back whatever was charged, then fail the whole thing.
        for (const c of charged) s.income(accountId, c.amount, `Refund — trip ${c.leg} not completed`, 'other');
        const trip = s.universe.trips[tripId]; if (trip) trip.status = 'cancelled';
        throw error;
      }
    },
  );

  sim.onCommand<{ bookingId: Id }, { refund: Money }>(
    'travel.cancel_flight',
    (p, { sim: s }) => {
      const booking = s.universe.flightBookings[p.bookingId];
      if (!booking || booking.status !== 'booked') throw new CommandError('That booking can’t be canceled.');
      const refund = booking.refundable
        ? booking.fare + booking.taxesFees
        : booking.departAt - s.now > 24 * MS_HOUR ? applyRate(booking.fare, 0.25) : 0;

      booking.status = booking.refundable ? 'refunded' : 'cancelled';
      s.timeline.cancelFor('flight', booking.id, s.now);
      s.resolveDecision('flight', booking.id);
      if (refund > 0) {
        const accountId = s.player.primaryAccountId;
        if (accountId) s.income(accountId, refund, `Refund — ${booking.airlineName} ${booking.flightNumber}`, 'travel', { refType: 'flight', refId: booking.id });
      }
      s.emit('travel.flight_cancelled', { bookingId: booking.id, refund });
      return { refund };
    },
  );
}

/** Real hotel brands by the kind of room. Names are public record; every property, rate and room is SLATE's own. */
/**
 * The brand names sold at each room class anywhere in the world, kept under
 * the name older code and tests know. Which of them a city can actually
 * offer is `stayOptions`, which reads the country.
 */
export const HOTEL_BRANDS: Readonly<Record<HotelBooking['roomClass'], readonly string[]>> = {
  standard: brandNamesAtTier([1, 2]),
  deluxe: brandNamesAtTier([2, 3]),
  suite: brandNamesAtTier([3, 4]),
  penthouse: brandNamesAtTier([4]),
};

function brandNamesAtTier(tiers: readonly number[]): string[] {
  const names: string[] = [];
  for (const brand of chainsIn('us').concat(chainsIn('uk'), chainsIn('ae'), chainsIn('sg'))) {
    if (tiers.includes(brand.tier) && !names.includes(brand.name)) names.push(brand.name);
  }
  return names;
}

/** Airbnb's fees, the way the platform shows them. SLATE's own calibration of the platform's public structure. */
export const AIRBNB_SERVICE_RATE = 0.14;
export const AIRBNB_CLEANING_NIGHTS = 0.9;

export interface StayOption {
  kind: 'hotel' | 'airbnb' | 'own';
  roomClass: RoomClass;
  /** The real brand, or for an Airbnb the listing's headline, or SLATE's own hotel's name. */
  name: string;
  brandId?: string;
  /** For an Airbnb. */
  listing?: HotelBooking['listing'];
  hostId?: Id;
  nightlyRate: Money;
  cleaningFee: Money;
  serviceFee: Money;
  taxesFees: Money;
  /** Per stay, for the nights asked. */
  total: Money;
  nights: number;
  /** Why this one is SLATE's own rather than a brand, when it is. */
  note?: string;
}

/**
 * Everywhere you could stay in a city for these nights: the real brands that
 * operate in that country at each class, the Airbnb listings, and where no
 * brand sells a class, one of SLATE's own hotels named as such.
 */
export function stayOptions(sim: Simulation, cityId: string, checkInAt: number, nights: number): StayOption[] {
  const city = CITIES.require(cityId);
  // Keyed by the check-in day, not the instant, so the list the planner
  // showed for a morning is the list the booking prices for that afternoon.
  const rng = sim.rng('stay', cityId, Math.floor(checkInAt / MS_DAY));
  const col = costOfLiving(cityId);
  const n = clamp(Math.round(nights), 1, 365);
  const out: StayOption[] = [];
  if (NOWHERE_TO_STAY[city.countryId]) return out;

  const classMultiplier: Record<RoomClass, number> = { standard: 1, deluxe: 1.6, suite: 3.2, penthouse: 8.5 };
  for (const roomClass of ['standard', 'deluxe', 'suite', 'penthouse'] as const) {
    const brands = hotelBrandsFor(city.countryId, roomClass);
    const nightly = Math.round(210_00 * col * classMultiplier[roomClass] * rng.float(0.85, 1.25));
    const taxes = applyRate(nightly * n, 0.145);
    if (brands.length > 0) {
      // Two real choices per class is a floor, not a menu.
      for (const brand of brands.slice(0, 2)) {
        const rate = Math.round(nightly * (0.9 + brand.tier * 0.05));
        out.push({ kind: 'hotel', roomClass, name: `${brand.name} ${city.name}`, brandId: brand.id, nightlyRate: rate, cleaningFee: 0, serviceFee: 0, taxesFees: applyRate(rate * n, 0.145), total: rate * n + applyRate(rate * n, 0.145), nights: n });
      }
    } else {
      const own = placesIn(cityId).filter((p) => p.kind === 'hotel');
      const place = own[0];
      if (place) {
        out.push({ kind: 'own', roomClass, name: place.name, nightlyRate: nightly, cleaningFee: 0, serviceFee: 0, taxesFees: taxes, total: nightly * n + taxes, nights: n,
          note: `No international chain in ${city.name} sells that class of room (${roomClass}). ${place.name} is one of SLATE’s own hotels.` });
      }
    }
  }

  if (airbnbAvailable(city.countryId)) {
    const kinds: HotelBooking['listing'][] = [
      { kind: 'entire_home', bedrooms: rng.int(1, 3), superhost: rng.float(0, 1) < 0.45, rating: Math.round(rng.float(4.55, 4.98) * 100) / 100, selfCheckIn: rng.float(0, 1) < 0.7 },
      { kind: 'private_room', bedrooms: 1, superhost: rng.float(0, 1) < 0.35, rating: Math.round(rng.float(4.4, 4.95) * 100) / 100, selfCheckIn: rng.float(0, 1) < 0.5 },
    ];
    for (const listing of kinds) {
      const nightly = Math.round(210_00 * col * (listing!.kind === 'entire_home' ? 0.75 + listing!.bedrooms * 0.3 : 0.42) * rng.float(0.85, 1.2));
      const cleaning = Math.round(nightly * AIRBNB_CLEANING_NIGHTS);
      const service = applyRate(nightly * n + cleaning, AIRBNB_SERVICE_RATE);
      const taxes = applyRate(nightly * n, 0.10);
      const host = hostFor(sim, cityId, listing!.kind);
      out.push({
        kind: 'airbnb', roomClass: listing!.kind === 'entire_home' ? 'deluxe' : 'standard',
        name: listing!.kind === 'entire_home' ? `${host.displayName.split(' ')[0]}’s ${listing!.bedrooms} Bedroom Place` : `Room At ${host.displayName.split(' ')[0]}’s`,
        listing, hostId: host.id, nightlyRate: nightly, cleaningFee: cleaning, serviceFee: service, taxesFees: taxes,
        total: nightly * n + cleaning + service + taxes, nights: n,
      });
    }
  }
  return out;
}

/** The person whose home it is. The same one each time for that listing. */
function hostFor(sim: Simulation, cityId: string, kind: string): Person {
  const archetype = `host:${cityId}:${kind}`;
  const existing = peopleOf(sim, archetype)[0];
  if (existing) return existing;
  const rng = sim.rng('host', cityId, kind);
  return makeBackgroundPerson(sim, {
    rng, archetype, industryRole: 'civilian', cityId,
    background: kind === 'entire_home' ? `Lets a place in ${CITIES.require(cityId).name} when away.` : `Lets the spare room in ${CITIES.require(cityId).name}.`,
    interests: [rng.pick(['cooking', 'cycling', 'gardening', 'music', 'travel', 'photography']), 'hosting'],
    skills: { hospitality: rng.int(40, 90) },
    age: [26, 68],
    personality: { conscientiousness: rng.int(50, 95), extraversion: rng.int(30, 90), agreeableness: rng.int(45, 95) },
    lifestyle: 'modest',
  });
}

// ---------------------------------------------------------------------------
// Mechanics
// ---------------------------------------------------------------------------

/** The host has a guest; the guest has a host. Both remember it. */
function rememberHost(sim: Simulation, booking: HotelBooking): void {
  if (!booking.hostId) return;
  rememberFact(sim, booking.hostId, { kind: 'topic', sourceKind: 'travel', aboutId: booking.guestIds[0]!, text: `Hosted for ${plural(booking.nights, 'night')} in ${CITIES.get(booking.locationId)?.name ?? 'town'}.`, weight: 40 });
}

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
  const carriers = rng.shuffle([...airlinesFor(CITIES.get(fromCityId)?.countryId, CITIES.get(toCityId)?.countryId, km)]);

  for (let i = 0; i < count; i++) {
    const airline = carriers[i % carriers.length]!;
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

/** The booking record and its two calendar items, once the fare is paid. Shared with rebooking and moving a flight. */
export function createFlightBooking(
  sim: Simulation,
  spec: { fromCity: string; toCity: string; option: FlightOption; cabin: FlightBooking['cabin']; passengers: Id[]; fare: Money; taxes: Money; refundable: boolean; tripId?: Id },
): FlightBooking {
  const { option, passengers } = spec;
  const player = sim.player;
  const booking: FlightBooking = {
    id: sim.nextId('flight'),
    saveId: sim.universe.meta.id,
    tripId: spec.tripId,
    passengerIds: passengers,
    airlineCode: option.airlineCode,
    airlineName: option.airlineName,
    flightNumber: option.flightNumber,
    fromAirport: option.fromAirport,
    toAirport: option.toAirport,
    departAt: option.departAt,
    arriveAt: option.arriveAt,
    cabin: spec.cabin,
    seats: passengers.map((_, i) => `${12 + i}${'ABCDEF'[i % 6]}`),
    fare: spec.fare,
    taxesFees: spec.taxes,
    bags: passengers.length,
    status: 'booked',
    refundable: spec.refundable,
    loyaltyMilesEarned: Math.round(cityDistanceKm(spec.fromCity, spec.toCity) * 0.62 * (spec.cabin === 'business' ? 1.5 : spec.cabin === 'first' ? 2 : 1)),
    bookedAt: sim.now,
  };
  sim.universe.flightBookings[booking.id] = booking;

  if (spec.tripId) {
    const trip = sim.universe.trips[spec.tripId];
    if (trip) { trip.bookingIds.push(booking.id); trip.spent += spec.fare + spec.taxes; trip.status = 'booked'; }
  }

  // Getting to the airport is part of the commitment: the day asks three hours before.
  sim.schedule({
    at: option.departAt - 3 * MS_HOUR,
    kind: 'travel.depart',
    label: `${option.airlineName} ${option.flightNumber} To ${CITIES.require(spec.toCity).name}`,
    category: 'travel',
    payload: { bookingId: booking.id },
    priority: 15,
    refType: 'flight', refId: booking.id,
    requiresPlayer: passengers.includes(player.id),
    locationId: spec.fromCity,
    durationMinutes: Math.round((option.arriveAt - option.departAt) / MS_MINUTE) + 180,
  });
  sim.schedule({
    at: option.arriveAt,
    kind: 'travel.arrive',
    label: `Arrive In ${CITIES.require(spec.toCity).name}`,
    category: 'travel',
    payload: { bookingId: booking.id },
    priority: 15,
    refType: 'flight', refId: booking.id,
  });
  return booking;
}

export function departFlight(sim: Simulation, bookingId: Id): void {
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

export function arriveFlight(sim: Simulation, bookingId: Id): void {
  const booking = sim.universe.flightBookings[bookingId];
  if (!booking || booking.status === 'cancelled' || booking.status === 'missed' || booking.status === 'changed' || booking.status === 'refunded' || booking.status === 'flown') return;
  // A private aircraft with its passenger not yet aboard has not left: it
  // waits at the terminal, and the crew's hold decides what happens next.
  if (booking.cabin === 'private' && booking.passengerIds.includes(sim.universe.playerId) && !booking.boardedAt) return;
  booking.status = 'flown';

  const toAirport = AIRPORTS.byName(booking.toAirport) ?? AIRPORTS.all().find((a) => a.iata === booking.toAirport);
  const toCityId = toAirport?.parentId;
  if (!toCityId) return;

  const durationHours = (booking.arriveAt - booking.departAt) / MS_HOUR;

  // Your own aircraft lands where you do, the hours go in its logbook, and
  // where it sleeps tonight is the keeping system's to decide.
  if (booking.vehicleId) {
    const jet = sim.universe.vehicles[booking.vehicleId];
    if (jet && !jet.soldAt) {
      jet.locationId = toCityId;
      addMileage(sim, jet, Math.max(1, Math.round(durationHours)));
      sim.emit('vehicle.relocated', { vehicleId: jet.id, cityId: toCityId, airportId: toAirport?.id });
    }
  }

  for (const passengerId of booking.passengerIds) {
    const person = sim.universe.people[passengerId];
    if (!person) continue;
    const fromZone = CITIES.get(person.currentLocationId)?.timeZone;
    const toZone = CITIES.require(toCityId).timeZone;

    person.currentLocationId = toCityId;
    // A flight lands you at the airport, not at the last place you were.
    person.currentPlaceId = undefined;

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

export function checkIntoHotel(sim: Simulation, bookingId: Id): void {
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
          ? `${toAirport?.name} can’t take this aircraft.`
          : undefined,
    };
  });
}

interface AircraftLike { id: string; name: string; category: string; seats: number; rangeKm: number; hourlyRate: Money; runwayFeet: number }

/** An aircraft you own, in hand, or the reason it is not. */
export function ownedAircraft(sim: Simulation, vehicleId: Id): Vehicle {
  const vehicle = sim.universe.vehicles[vehicleId];
  if (!vehicle || vehicle.soldAt || vehicle.ownerId !== sim.player.id) throw new CommandError('You don’t own that aircraft.');
  if (vehicleKind(vehicle) !== 'jet') throw new CommandError('That doesn’t fly.');
  requireInHand(vehicle);
  return vehicle;
}

/** Your own aircraft in the shape the charter arithmetic reads: the craft figures as they stand, and what an hour costs you. */
function ownedAsAircraft(sim: Simulation, vehicle: Vehicle): AircraftLike {
  const craft = craftOf(sim, vehicle);
  return {
    id: vehicle.id,
    name: vehicle.nickname ? `${vehicle.nickname} (${vehicle.make} ${vehicle.model})` : `${vehicle.make} ${vehicle.model}`,
    category: 'Your Aircraft',
    seats: craft?.seats ?? 4,
    rangeKm: craft?.rangeKm ?? 2_000,
    hourlyRate: hourlyCostOf(sim, vehicle),
    runwayFeet: craft?.runwayFeet ?? 4_000,
  };
}

/** The aircraft you own, in this city, against a route: what it would cost you to fly it there, and whether it can. */
export function ownedAircraftOptions(sim: Simulation, toCityId: string) {
  const fromCityId = sim.player.currentLocationId;
  const distance = cityDistanceKm(fromCityId, toCityId);
  const toAirportId = nearestAirport(toCityId);
  const toAirport = toAirportId ? AIRPORTS.get(toAirportId) : undefined;
  return Object.values(sim.universe.vehicles)
    .filter((v) => !v.soldAt && v.ownerId === sim.player.id && vehicleKind(v) === 'jet')
    .map((vehicle) => {
      const a = ownedAsAircraft(sim, vehicle);
      const hours = distance / 800 + 0.6;
      const here = (vehicle.locationId ?? fromCityId) === fromCityId && !vehicle.deliveryDueAt;
      const rangeOk = distance <= a.rangeKm;
      const runwayOk = !toAirport || toAirport.runwayFeet >= a.runwayFeet;
      return {
        ...a,
        vehicleId: vehicle.id,
        estimatedCost: Math.round(a.hourlyRate * hours + LANDING_FEES * costOfLiving(toCityId)),
        estimatedHours: Number(hours.toFixed(1)),
        available: here && rangeOk && runwayOk,
        reason: !here
          ? vehicle.deliveryDueAt ? 'Not delivered yet.' : `It’s in ${CITIES.get(vehicle.locationId ?? '')?.name ?? 'another city'}.`
          : !rangeOk
            ? `Range is ${a.rangeKm.toLocaleString('en-US')} km; the route is ${Math.round(distance).toLocaleString('en-US')} km.`
            : !runwayOk
              ? `${toAirport?.name} can’t take this aircraft.`
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
