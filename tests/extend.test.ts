/**
 * Staying longer (`travel.extend` in `systems/journey.ts`, docs/WORLD.md
 * stage 8c, from 2026-09-30): the way home moved to a later day, the fare's
 * difference by air in America and no change fee, the hotel's or the let's
 * added nights, the rental car's added days, and none of it before arriving
 * or on an airline's way home abroad.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned, normalDate, zonedParts } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { documentsOf } from '@/engine/systems/documents';
import { extendQuote, journeysOf, letQuote, slotOf, trainRefund } from '@/engine/systems/journey';
import { railRouteById } from '@/engine/systems/rail';
import { rentalDays, rentalQuote, rentalsOf } from '@/engine/systems/rentals';
import { stayPrice } from '@/engine/systems/stays';

const YEAR = 365.2425 * MS_DAY;
const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
function traveler(city: string, name: string) {
  const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, name);
  sim.player.birthInstant = sim.now - 30.5 * YEAR;
  documentsOf(sim.player).splice(0, documentsOf(sim.player).length, ...documentsOf(sim.player).filter((d) => d.kind !== 'license'));
  documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer: 'us-ny', name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 8 * YEAR, expiresAt: sim.now + 5 * YEAR });
  sim.universe.accounts[sim.player.primaryAccountId!]!.balance += inSave(sim, 50_000_00, 'USD');
  return sim;
}
function saturday(sim: Simulation, after: number): number {
  const p = zonedParts(sim.now + after * MS_DAY, sim.zone);
  for (let d = 0; d < 7; d += 1) {
    const at = instantFromZoned({ ...normalDate(p.year, p.month, p.day + d), hour: 12 }, sim.zone);
    if (zonedParts(at, sim.zone).weekday === 6) return at;
  }
  throw new Error('no saturday');
}
function liveTo(sim: Simulation, target: number): void {
  for (let guard = 0; sim.now < target && guard < 10_000; guard += 1) {
    const zone = sim.universe.currentZone;
    const p = zonedParts(sim.now, zone);
    let night = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: 23 }, zone);
    if (night <= sim.now) night = instantFromZoned({ ...normalDate(p.year, p.month, p.day + 1), hour: 23 }, zone);
    if (night >= target) { sim.advanceBy(target - sim.now); return; }
    sim.advanceBy(night - sim.now);
    sim.execute({ kind: 'life.sleep', payload: { hours: 8 } });
  }
}
/** A round trip to Los Angeles booked and flown out, with a rental car. */
function there(name: string) {
  const sim = traveler('us-ny-newyork', name);
  const day = saturday(sim, 14);
  const booked = sim.execute<{ journeyId: string; returnId: string }>({ kind: 'travel.book', payload: { toCity: 'us-ca-losangeles', day, slot: 1, returnDay: day + 4 * MS_DAY, returnSlot: 1 } });
  expect(booked.ok, booked.error).toBe(true);
  expect(sim.execute({ kind: 'travel.rent_car', payload: { journeyId: booked.value!.journeyId } }).ok).toBe(true);
  const out = journeysOf(sim.player).find((j) => j.id === booked.value!.journeyId)!;
  const back = journeysOf(sim.player).find((j) => j.id === booked.value!.returnId)!;
  return { sim, out, back, day };
}

describe('staying longer', () => {
  it('refuses before arriving, and moves the way home, the hotel and the rental car three days on once there', () => {
    const { sim, out, back, day } = there('extend-la');
    expect(extendQuote(sim, sim.player, back.id, day + 7 * MS_DAY, 1)).toMatch(/once you’re there/);
    liveTo(sim, out.arriveAt + (out.lateMinutes ?? 0) * 60_000 + 2 * MS_HOUR);
    expect(out.status).toBe('arrived');
    const oldNights = out.hotel!.nights;
    const oldHotel = out.hotel!.price;
    const oldFare = back.legs.reduce((a, l) => a + l.fare, 0);
    const car = rentalsOf(sim.player)[0]!;
    const oldPaid = car.paid;
    // Booked on the day's second flight, it stays on it.
    expect(slotOf(back)).toBe(1);
    const q = extendQuote(sim, sim.player, back.id, day + 7 * MS_DAY, 1);
    if (typeof q === 'string') throw new Error(q);
    expect(q.nights).toBe(oldNights + 3);
    expect(q.stay).toBe(stayPrice(sim, 'us-ca-losangeles', q.nights)!.price - oldHotel);
    // The fare's difference and no fee; a cheaper one left as the airline's credit.
    expect(q.travel).toBe(Math.max(0, q.legs.reduce((a, l) => a + l.fare, 0) - oldFare));
    // A dearer ticket held than the new one: nothing back, the difference the airline's credit.
    back.legs[0]!.fare += 100_000_00;
    expect((extendQuote(sim, sim.player, back.id, day + 7 * MS_DAY, 1) as { travel: number }).travel).toBe(0);
    back.legs[0]!.fare -= 100_000_00;
    const rq = rentalQuote(sim, sim.player, car.cityId, car.pickupAt, q.legs[0]!.departAt, true);
    if (typeof rq === 'string') throw new Error(rq);
    expect(q.rental).toBe(rq.total - oldPaid);
    const before = sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
    const r = sim.execute<{ total: number; leaveAt: number }>({ kind: 'travel.extend', payload: { journeyId: back.id, day: day + 7 * MS_DAY, slot: 1 } });
    expect(r.ok, r.error).toBe(true);
    expect(before - sim.universe.accounts[sim.player.primaryAccountId!]!.balance).toBe(q.total);
    expect(back.leaveAt).toBe(q.legs[0]!.departAt);
    expect(out.hotel!.nights).toBe(q.nights);
    expect(car.returnAt).toBe(back.leaveAt);
    expect(car.days).toBe(rentalDays(car.pickupAt, back.leaveAt));
    // Still there on the old day home, in the hotel, and home after the new one.
    liveTo(sim, day + 5 * MS_DAY);
    expect(sim.player.currentLocationId).toBe('us-ca-losangeles');
    expect(sim.player.stay?.kind).toBe('hotel');
    expect(car.status).toBe('out');
    // The old day's departure and check-out are gone: the way home waits, and no night is charged again.
    expect(back.status).toBe('booked');
    expect(sim.universe.transactions.some((t) => t.memo.startsWith('Another night in a hotel'))).toBe(false);
    liveTo(sim, back.arriveAt + 6 * MS_HOUR);
    expect(sim.player.currentLocationId).toBe('us-ny-newyork');
    expect(car.status).toBe('returned');
  });

  it('refuses a day no later than the way home, and a flight home abroad', () => {
    const { sim, out, back, day } = there('extend-refuse');
    liveTo(sim, out.arriveAt + (out.lateMinutes ?? 0) * 60_000 + 2 * MS_HOUR);
    expect(extendQuote(sim, sim.player, back.id, day + 2 * MS_DAY, 1)).toMatch(/later than now/);
    const uk = traveler('uk-eng-london', 'extend-abroad');
    const d = saturday(uk, 14);
    const b = uk.execute<{ journeyId: string; returnId: string }>({ kind: 'travel.book', payload: { toCity: 'ie-lei-dublin', day: d, slot: 1, returnDay: d + 4 * MS_DAY, returnSlot: 1 } });
    expect(b.ok, b.error).toBe(true);
    const o = journeysOf(uk.player).find((j) => j.id === b.value!.journeyId)!;
    liveTo(uk, o.arriveAt + (o.lateMinutes ?? 0) * 60_000 + 2 * MS_HOUR);
    expect(extendQuote(uk, uk.player, b.value!.returnId, d + 7 * MS_DAY, 1)).toMatch(/outside the United States/);
  });

  it('moves a train home and a holiday let in Edinburgh: the old ticket refunded on its terms, the let’s price for the longer stay', () => {
    const sim = traveler('uk-eng-london', 'extend-train');
    const d = saturday(sim, 14);
    const b = sim.execute<{ journeyId: string; returnId: string }>({ kind: 'travel.book', payload: { toCity: 'uk-sct-edinburgh', day: d, slot: 10, returnDay: d + 3 * MS_DAY, returnSlot: 10, by: 'lner-kgx-edb' } });
    expect(b.ok, b.error).toBe(true);
    expect(sim.execute({ kind: 'travel.stay_let', payload: { journeyId: b.value!.journeyId } }).ok).toBe(true);
    const out = journeysOf(sim.player).find((j) => j.id === b.value!.journeyId)!;
    const back = journeysOf(sim.player).find((j) => j.id === b.value!.returnId)!;
    liveTo(sim, out.arriveAt + (out.lateMinutes ?? 0) * 60_000 + 2 * MS_HOUR);
    const oldLet = out.let!.price;
    expect(slotOf(back)).toBe(10);
    const q = extendQuote(sim, sim.player, back.id, d + 5 * MS_DAY, 10);
    if (typeof q === 'string') throw new Error(q);
    expect(q.stay).toBe((letQuote(sim, 'uk-sct-edinburgh', q.nights) as { price: number }).price - oldLet);
    expect(q.travel).toBe(q.legs.reduce((a, l) => a + l.fare, 0) - trainRefund(sim, back, railRouteById('lner-kgx-edb')!));
    expect(sim.execute({ kind: 'travel.extend', payload: { journeyId: back.id, day: d + 5 * MS_DAY, slot: 10 } }).ok).toBe(true);
    expect(out.let!.nights).toBe(q.nights);
  });
});
