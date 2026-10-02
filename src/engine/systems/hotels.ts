/**
 * SLATE — a named hotel (Stage 6 of `docs/BACKLOG.md`, from 2026-10-01; the
 * hotels in `content/hotels.ts`). A journey's nights can be at a real hotel
 * in a room of its own, on its refundable rate or its non-refundable one,
 * rather than at a town's average rate.
 *
 * A night is priced at the room's own rate for the nights its booking engine
 * was read: that night's where it was one of them, otherwise the mean of
 * them, SLATE's estimate, said so. A rate before tax carries the town's
 * hotel taxes (`content/stays.ts`); one quoted tax in, none on top. A
 * hotel's resort, destination or facility fee is a night's too, taxed where
 * it was quoted before tax. A hotel's minimum age to check in is its own.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, dateKey, type Instant } from '../core/time';
import { saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { HOTELS, type Hotel, type HotelRoom } from '../content/hotels';
import { HOTEL_AMENITIES, type HotelAmenities } from '../content/hotelamenities';
import { instantFromZoned, zonedParts } from '../core/time';
import type { RatePlan } from '../content/staytypes';
import { nightRateFor } from './stays';

export const hotelById = (id: string): Hotel | undefined => HOTELS.find((h) => h.id === id);
export const hotelsIn = (cityId: string): Hotel[] => HOTELS.filter((h) => h.cityId === cityId);
export const amenitiesOf = (hotelId: string | undefined): HotelAmenities | undefined => (hotelId ? HOTEL_AMENITIES.find((a) => a.id === hotelId) : undefined);

/** What a named hotel has, as its own pages or a booking site's said, for the screen: what's known, in a line. */
export function amenityLine(hotelId: string): string {
  const a = amenitiesOf(hotelId);
  if (!a) return '';
  const bits: string[] = [];
  if (a.gym !== null) bits.push(a.gym ? 'a gym' : 'no gym');
  if (a.pool !== null) bits.push(a.pool === 'none' ? 'no pool' : `an ${a.pool} pool`);
  if (a.spa) bits.push('a spa');
  if (a.breakfast?.included !== null && a.breakfast) bits.push(a.breakfast.included ? 'breakfast included' : a.breakfast.price !== null ? `breakfast ${a.breakfast.price} ${a.breakfast.currency ?? ''} a person`.trim() : 'breakfast extra');
  if (a.wifiFree !== null) bits.push(a.wifiFree ? 'free Wi-Fi' : 'paid Wi-Fi');
  if (a.accessible !== null) bits.push(a.accessible ? 'accessible rooms' : 'no wheelchair access');
  if (a.pets?.allowed !== null && a.pets) bits.push(a.pets.allowed ? (a.pets.fee ? `pets at ${a.pets.fee} ${a.pets.currency ?? ''} a ${a.pets.per ?? 'stay'}` : 'pets welcome') : 'no pets');
  return bits.length ? `${bits.join(', ')}.`.replace(/^./, (c) => c.toUpperCase()) : '';
}

/** A flexible rate's refund, until a day before arrival where a hotel's own terms aren't known: SLATE's reading of the usual terms. */
export const FREE_CANCEL_HOURS = 24;

/**
 * Until when a stay booked on a flexible rate is called off free (from
 * 2026-10-02): a named hotel's own deadline, so many hours before arrival,
 * at its named hour of the day that falls on (Pod Times Square's 3 p.m. the
 * day before, Travelodge's noon on the day); a day before arrival otherwise.
 */
export function freeCancelUntil(hotelId: string | undefined, arriveAt: Instant): Instant {
  const c = amenitiesOf(hotelId)?.cancel;
  const h = hotelId ? hotelById(hotelId) : undefined;
  if (!c || !h) return arriveAt - FREE_CANCEL_HOURS * 3_600_000;
  const by = c.by?.match(/^(\d{1,2}):(\d{2})/);
  if (!by) return arriveAt - c.hours * 3_600_000;
  const zone = CITIES.require(h.cityId).timeZone;
  const p = zonedParts(arriveAt, zone);
  // Every hotel that names an hour gives its hours in whole days.
  return instantFromZoned({ year: p.year, month: p.month, day: p.day - c.hours / 24, hour: Number(by[1]), minute: Number(by[2]) }, zone);
}

/** A room's rate for a night on a plan, in the hotel's money, and whether it's the mean of other nights. Nothing where it offers no such rate. */
export function roomRate(h: Hotel, room: HotelRoom, plan: RatePlan, night: Instant): { rate: number; estimated: boolean } | undefined {
  const rates = room.rates[plan];
  const nights = Object.values(rates);
  if (nights.length === 0) return undefined;
  const exact = rates[dateKey(night, CITIES.require(h.cityId).timeZone)];
  if (exact !== undefined) return { rate: exact, estimated: false };
  return { rate: nights.reduce((a, b) => a + b, 0) / nights.length, estimated: true };
}

/** Why this room can't be booked so, or nothing. */
export function namedStayRefusal(person: Person, hotelId: string, roomName: string, plan: RatePlan, from: Instant): string | undefined {
  const h = hotelById(hotelId);
  if (!h) return 'No such hotel.';
  const room = h.rooms.find((r) => r.name === roomName);
  if (!room) return 'It has no such room.';
  if (!roomRate(h, room, plan, from)) return plan === 'prepaid' ? 'It offers that room only on a refundable rate.' : 'It offers that room only paid ahead.';
  const age = (from - person.birthInstant) / (365.2425 * MS_DAY);
  if (h.minAge !== null && age < h.minAge) return `${h.name} checks in guests of ${h.minAge} or older.`;
  return undefined;
}

/** What nights in a room come to, with the town's taxes and the hotel's fee, in the save's money. */
export function namedStayQuote(sim: Simulation, hotelId: string, roomName: string, plan: RatePlan, from: Instant, nights: number): { price: Money; basis: string; estimated: boolean } | undefined {
  const h = hotelById(hotelId);
  const room = h?.rooms.find((r) => r.name === roomName);
  if (!h || !room || nights <= 0) return undefined;
  const taxes = nightRateFor(h.cityId)?.rate;
  const onTop = taxes?.onTop ?? 0;
  let local = 0;
  let estimated = false;
  for (let n = 0; n < nights; n += 1) {
    const r = roomRate(h, room, plan, from + n * MS_DAY);
    if (!r) return undefined;
    estimated ||= r.estimated;
    local += room.basis === 'before-tax' ? r.rate * (1 + onTop) + (taxes?.perRoomNight ?? 0) + (taxes?.perPersonNight ?? 0) : r.rate;
  }
  const into = saveCurrency(sim.universe);
  const inSave = (amount: number, currency: string) => { const cents = Math.round(amount * 100); return currency === into ? cents : exchange(cents, currency, into) ?? cents; };
  const fee = h.fee ? inSave(h.fee.amount * (h.fee.taxIncluded ? 1 : 1 + onTop) * nights, h.fee.currency) : 0;
  const price = inSave(local, room.currency) + fee;
  const basis = `${h.name}, ${room.name}${room.bed ? ` (${room.bed})` : ''}, ${plan === 'prepaid' ? 'paid ahead, not refunded' : 'refundable'}: its own rate${estimated ? ', the mean of the nights it was read, an estimate' : ''}${room.basis === 'before-tax' ? ' with the town’s hotel taxes' : ', taxes in'}${h.fee ? `, and its ${h.fee.name.toLowerCase()}` : ''}.`;
  return { price, basis, estimated };
}

/**
 * The stay at a named hotel, from later on 2026-10-01 (Stage 6): its own
 * check-out hour; its parking for a car brought, the cheapest it names a
 * night, its lot, its valet or the garage it sends guests to; and the
 * deposit it holds at arrival, a stay's or a night's, returned at
 * check-out.
 */
export function checkOutHourOf(hotelId: string | undefined): number | undefined {
  const h = hotelId ? hotelById(hotelId) : undefined;
  const m = h?.checkOut?.match(/^(\d{1,2}):(\d{2})/);
  return m ? Number(m[1]) + Number(m[2]) / 60 : undefined;
}

export function hotelParking(sim: Simulation, hotelId: string, nights: number): { price: Money; basis: string } | undefined {
  const h = hotelById(hotelId);
  if (!h?.parking) return undefined;
  const cents = Math.round(h.parking.perNight * nights * 100);
  const cur = saveCurrency(sim.universe);
  const where = h.parking.kind === 'offsite' ? 'the garage it sends guests to' : h.parking.kind === 'valet' ? 'its valet' : 'its own lot';
  return { price: cur === h.parking.currency ? cents : exchange(cents, h.parking.currency, cur) ?? cents, basis: `Parking at ${where}, ${h.parking.perNight} ${h.parking.currency} a night` };
}

export function depositFor(sim: Simulation, hotelId: string, nights: number): Money {
  const h = hotelById(hotelId);
  if (!h?.deposit) return 0;
  const cents = Math.round(h.deposit.amount * (h.deposit.per === 'night' ? Math.max(1, nights) : 1) * 100);
  const cur = saveCurrency(sim.universe);
  return cur === h.deposit.currency ? cents : exchange(cents, h.deposit.currency, cur) ?? cents;
}
