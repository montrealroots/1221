/**
 * Somewhere real to stay, everywhere, and the trip booked as one thing.
 *
 * Three promises. Every country is accounted for: chains that really operate
 * there, independents only with a reason, or nowhere to stay with a reason.
 * A hotel booked anywhere wears a brand that really has a hotel in that
 * country, and Airbnb is honestly absent where it is absent. And a trip is
 * booked as one thing: flight, stay and the flight back under one funds
 * check and one key, so a failed leg refunds the others and a retry cannot
 * pay twice.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { loadAllSections } from '@/engine/dialogue';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { CITIES, COUNTRIES } from '@/engine/content/geography';
import {
  AIRBNB_UNAVAILABLE, CHAINS_BY_COUNTRY, HOTEL_BRANDS, INDEPENDENT_ONLY, NOWHERE_TO_STAY,
  airbnbAvailable, chainsIn, hotelBrandById, hotelBrandsFor, stayCoverageOf,
} from '@/engine/content/hotels';
import { stayOptions } from '@/engine/systems/travel';

beforeAll(async () => { await loadAllSections(); });

function aLife(seed = 'stays'): Simulation {
  const sim = quickSave({}, seed);
  sim.income(sim.player.primaryAccountId!, 900_000_00, 'Test funding', 'other');
  sim.execute({ kind: 'co.set_draw', payload: { amount: 0 } });
  return sim;
}
function must<R>(sim: Simulation, kind: string, payload: Record<string, unknown>, idempotencyKey?: string): R {
  const result = sim.execute<R>({ kind, payload, idempotencyKey });
  if (!result.ok) throw new Error(`${kind}: ${result.error}`);
  return result.value!;
}
function refusal(sim: Simulation, kind: string, payload: Record<string, unknown>): string | undefined {
  const result = sim.execute({ kind, payload });
  return result.ok ? undefined : result.error;
}
function cityIn(countryId: string, name?: string): string {
  const found = CITIES.all().find((c) => c.countryId === countryId && (!name || c.name === name));
  expect(found, `no city ${name ?? ''} in ${countryId}`).toBeDefined();
  return found!.id;
}
const funds = (sim: Simulation) => sim.ledger.availableFunds(sim.player.primaryAccountId!);

describe('every country has somewhere real to stay, or an honest reason', () => {
  it('accounts for all of them', () => {
    const unaccounted = COUNTRIES.all().filter((c) => stayCoverageOf(c.id).kind === 'unaccounted').map((c) => c.id);
    expect(unaccounted).toEqual([]);
  });

  it('names only brands in the registry, never twice, and never a chain where it says independents only', () => {
    for (const [countryId, ids] of Object.entries(CHAINS_BY_COUNTRY)) {
      for (const id of ids) expect(hotelBrandById(id), `${countryId}: ${id}`).toBeDefined();
      expect(new Set(ids).size, countryId).toBe(ids.length);
      expect(INDEPENDENT_ONLY[countryId], countryId).toBeUndefined();
      expect(NOWHERE_TO_STAY[countryId], countryId).toBeUndefined();
    }
    const brandIds = HOTEL_BRANDS.map((b) => b.id);
    expect(new Set(brandIds).size).toBe(brandIds.length);
  });

  it('keeps a Premier Inn out of Lagos and puts Air Peace country hotels in it', () => {
    const lagos = chainsIn('ng').map((b) => b.id);
    expect(lagos).not.toContain('premier_inn');
    expect(lagos).toContain('eko');
    expect(chainsIn('uk').map((b) => b.id)).toContain('premier_inn');
  });

  it('says why Airbnb is absent where it is, and is present nearly everywhere else', () => {
    expect(airbnbAvailable('ru')).toBe(false);
    expect(AIRBNB_UNAVAILABLE['ru']).toMatch(/2022/);
    expect(airbnbAvailable('kp')).toBe(false);
    expect(airbnbAvailable('fr')).toBe(true);
    expect(airbnbAvailable('ng')).toBe(true);
    expect(COUNTRIES.all().filter((c) => airbnbAvailable(c.id)).length).toBeGreaterThan(230);
  });

  it('sells a room at the nearest real tier and never invents a brand for a class nobody sells', () => {
    expect(hotelBrandsFor('uk', 'penthouse').every((b) => b.tier >= 3)).toBe(true);
    expect(hotelBrandsFor('bf', 'penthouse').map((b) => b.id)).toEqual(['azalai']);
    expect(hotelBrandsFor('tv', 'standard')).toEqual([]);
  });
});

describe('booking a bed', () => {
  it('books a real brand that operates in the country, and never one that does not', () => {
    const sim = aLife();
    const lagos = cityIn('ng', 'Lagos');
    const { bookingId } = must<{ bookingId: string }>(sim, 'travel.book_hotel', { cityId: lagos, checkInAt: sim.now + 5 * MS_DAY, nights: 2, roomClass: 'deluxe' });
    const booking = sim.universe.hotelBookings[bookingId]!;
    expect(booking.brandId).toBeDefined();
    expect(CHAINS_BY_COUNTRY['ng']).toContain(booking.brandId);
    expect(booking.hotelName.startsWith(hotelBrandById(booking.brandId!)!.name)).toBe(true);
    expect(booking.kind).toBe('hotel');
  });

  it('refuses a brand that has no hotel there', () => {
    const sim = aLife();
    expect(refusal(sim, 'travel.book_hotel', { cityId: cityIn('ng', 'Lagos'), checkInAt: sim.now + 5 * MS_DAY, nights: 2, roomClass: 'standard', brandId: 'premier_inn' }))
      .toMatch(/no hotel there/i);
  });

  it('falls back to one of SLATE’s own hotels, named as such, where no chain sells the room', () => {
    const sim = aLife();
    const funafuti = cityIn('tv');
    const { bookingId } = must<{ bookingId: string }>(sim, 'travel.book_hotel', { cityId: funafuti, checkInAt: sim.now + 5 * MS_DAY, nights: 2, roomClass: 'standard' });
    const booking = sim.universe.hotelBookings[bookingId]!;
    expect(booking.brandId).toBeUndefined();
    expect(booking.hotelName).toMatch(/SLATE’s Own/);
  });

  it('books a state hotel in Pyongyang and refuses an Airbnb there with the reason', () => {
    const sim = aLife();
    const pyongyang = cityIn('kp');
    const { bookingId } = must<{ bookingId: string }>(sim, 'travel.book_hotel', { cityId: pyongyang, checkInAt: sim.now + 5 * MS_DAY, nights: 2, roomClass: 'deluxe' });
    expect(['yanggakdo', 'koryo']).toContain(sim.universe.hotelBookings[bookingId]!.brandId);
    expect(refusal(sim, 'travel.book_stay', { cityId: pyongyang, checkInAt: sim.now + 5 * MS_DAY, nights: 2, listingKind: 'entire_home' })).toMatch(/sanctions/i);
  });

  it('itemizes an Airbnb the way the platform does, and the lines add up to the charge', () => {
    const sim = aLife();
    const lisbon = cityIn('pt', 'Lisbon');
    const before = funds(sim);
    const { bookingId, total, hostId } = must<{ bookingId: string; total: number; hostId: string }>(sim, 'travel.book_stay', { cityId: lisbon, checkInAt: sim.now + 5 * MS_DAY, nights: 3, listingKind: 'entire_home' });
    const b = sim.universe.hotelBookings[bookingId]!;
    expect(b.kind).toBe('airbnb');
    expect(b.nightlyRate * 3 + b.cleaningFee! + b.serviceFee! + b.taxesFees).toBe(total);
    expect(before - funds(sim)).toBe(total);
    expect(sim.universe.people[hostId]).toBeDefined();
    expect(b.listing?.kind).toBe('entire_home');
  });

  it('keeps the same host for the same listing', () => {
    const sim = aLife();
    const lisbon = cityIn('pt', 'Lisbon');
    const a = stayOptions(sim, lisbon, sim.now + 5 * MS_DAY, 2).find((o) => o.kind === 'airbnb' && o.listing?.kind === 'private_room')!;
    const b = stayOptions(sim, lisbon, sim.now + 9 * MS_DAY, 4).find((o) => o.kind === 'airbnb' && o.listing?.kind === 'private_room')!;
    expect(a.hostId).toBe(b.hostId);
  });
});

describe('the trip as one booking', () => {
  it('books the flight, the stay and the flight back, and charges once for all of it', () => {
    const sim = aLife();
    const paris = cityIn('fr', 'Paris');
    const before = funds(sim);
    const trip = must<{ tripId: string; flightId: string; stayId?: string; returnId?: string; total: number }>(sim, 'travel.book_trip', {
      toCityId: paris, departAt: sim.now + 6 * MS_DAY, returnAt: sim.now + 10 * MS_DAY, nights: 3, cabin: 'economy', stay: { kind: 'hotel', roomClass: 'deluxe' },
    });
    expect(trip.stayId).toBeDefined();
    expect(trip.returnId).toBeDefined();
    expect(before - funds(sim)).toBe(trip.total);
    const t = sim.universe.trips[trip.tripId]!;
    expect(t.status).toBe('booked');
    expect(t.bookingIds).toEqual(expect.arrayContaining([trip.flightId, trip.stayId, trip.returnId]));
    const stay = sim.universe.hotelBookings[trip.stayId!]!;
    expect(CHAINS_BY_COUNTRY['fr']).toContain(stay.brandId);
  });

  it('does not book or charge twice when the same request is retried', () => {
    const sim = aLife();
    const paris = cityIn('fr', 'Paris');
    const payload = { toCityId: paris, departAt: sim.now + 6 * MS_DAY, nights: 2, cabin: 'economy', stay: { kind: 'airbnb', listingKind: 'private_room' } };
    const first = must<{ tripId: string; total: number }>(sim, 'travel.book_trip', payload, 'trip:retry:1');
    const after = funds(sim);
    const again = must<{ tripId: string; total: number }>(sim, 'travel.book_trip', payload, 'trip:retry:1');
    expect(again.tripId).toBe(first.tripId);
    expect(funds(sim)).toBe(after);
    expect(Object.values(sim.universe.hotelBookings).filter((b) => b.tripId === first.tripId)).toHaveLength(1);
  });

  it('refunds the flight and cancels the trip when the stay cannot be booked', () => {
    const sim = aLife();
    const moscow = cityIn('ru', 'Moscow');
    const before = funds(sim);
    const why = refusal(sim, 'travel.book_trip', { toCityId: moscow, departAt: sim.now + 6 * MS_DAY, nights: 2, cabin: 'economy', stay: { kind: 'airbnb', listingKind: 'entire_home' } });
    expect(why).toMatch(/Russia/);
    expect(funds(sim)).toBe(before);
    expect(Object.values(sim.universe.flightBookings ?? {}).filter((f) => f.status === 'booked')).toHaveLength(0);
  });

  it('refuses the whole trip up front when the total cannot be covered, charging nothing', () => {
    const sim = quickSave({}, 'broke');
    sim.execute({ kind: 'co.set_draw', payload: { amount: 0 } });
    const before = funds(sim);
    const why = refusal(sim, 'travel.book_trip', { toCityId: cityIn('jp', 'Tokyo'), departAt: sim.now + 6 * MS_DAY, returnAt: sim.now + 12 * MS_DAY, nights: 5, cabin: 'first', stay: { kind: 'hotel', roomClass: 'penthouse' } });
    expect(why).toMatch(/whole trip/i);
    expect(funds(sim)).toBe(before);
  });
});
