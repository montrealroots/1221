/**
 * A car rented at the far end of a journey (`systems/rentals.ts`,
 * docs/WORLD.md stage 8a, from 2026-09-29): each place's company's terms to
 * the cent, who can't rent and why, the deposit held and released, and the
 * car driven from where it is.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned, normalDate, zonedParts } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { documentsOf } from '@/engine/systems/documents';
import { journeysOf } from '@/engine/systems/journey';
import { damageOwed, planRentalDrive, rentalDays, rentalQuote, rentalsOf, type RentalQuote } from '@/engine/systems/rentals';
import { RENTALS } from '@/engine/content/rentals';

const YEAR = 365.2425 * MS_DAY;
const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
/** A driver of an age, licensed so many years. */
function driver(city: string, name: string, age: number, heldYears = 5, issuer = 'us-ny') {
  const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, name);
  sim.player.birthInstant = sim.now - (age + 0.5) * YEAR;
  // Their own license, replacing any the save began with.
  documentsOf(sim.player).splice(0, documentsOf(sim.player).length, ...documentsOf(sim.player).filter((d) => d.kind !== 'license'));
  documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer, name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - heldYears * YEAR, expiresAt: sim.now + 5 * YEAR });
  return sim;
}
const line = (q: RentalQuote, re: RegExp) => q.lines.find((l) => re.test(l.label))!.amount;
/** The Saturday after so many days, at noon. */
function saturday(sim: Simulation, after: number): number {
  const p = zonedParts(sim.now + after * MS_DAY, sim.zone);
  for (let d = 0; d < 7; d += 1) {
    const at = instantFromZoned({ ...normalDate(p.year, p.month, p.day + d), hour: 12 }, sim.zone);
    if (zonedParts(at, sim.zone).weekday === 6) return at;
  }
  throw new Error('no saturday');
}
/** Lives to a moment as a person does, asleep from eleven each night. */
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

describe('what a rental costs', () => {
  it('prices three days at JFK at Kayak’s $57, Avis’s $35 a day at 22, New York’s 20.875% of taxes with JFK’s 11.11% concession and $4.50 a day, and $200 held', () => {
    const sim = driver('us-ny-newyork', 'rent-ny', 22);
    const at = sim.now + 10 * MS_DAY;
    const q = rentalQuote(sim, sim.player, 'us-ny-newyork', at, at + 3 * MS_DAY + 20 * 60_000, true) as RentalQuote;
    expect(q.company).toBe('Avis');
    expect(q.days).toBe(3);
    expect(line(q, /Small Car/)).toBe(inSave(sim, 171_00, 'USD'));
    expect(line(q, /Young Driver/)).toBe(inSave(sim, 105_00, 'USD'));
    expect(line(q, /Taxes/)).toBe(Math.round((inSave(sim, 171_00, 'USD') + inSave(sim, 105_00, 'USD')) * (0.20875 + 0.1111)));
    expect(line(q, /Facility/)).toBe(inSave(sim, 3 * 4_50, 'USD'));
    // The damage waiver taken: New York's $9 cap a day for a small car, taxed with the rest.
    const w = rentalQuote(sim, sim.player, 'us-ny-newyork', at, at + 3 * MS_DAY + 20 * 60_000, true, true) as RentalQuote;
    expect(line(w, /Damage Waiver/)).toBe(inSave(sim, 27_00, 'USD'));
    expect(line(w, /Taxes/)).toBe(Math.round((inSave(sim, 171_00, 'USD') + inSave(sim, 105_00, 'USD') + inSave(sim, 27_00, 'USD')) * (0.20875 + 0.1111)));
    expect(q.lines.some((l) => /Damage Waiver/.test(l.label))).toBe(false);
    expect(q.deposit).toBe(inSave(sim, 200_00, 'USD'));
    // Past the 29 minutes' grace, a fourth day.
    expect(rentalDays(at, at + 3 * MS_DAY + 30 * 60_000)).toBe(4);
  });

  it('caps Hertz’s London young driver surcharge at £1,719.98 a rental', () => {
    const sim = driver('us-ny-newyork', 'rent-gb', 22, 5, 'gb');
    const at = sim.now + 10 * MS_DAY;
    const q = rentalQuote(sim, sim.player, 'uk-eng-london', at, at + 30 * MS_DAY, true);
    if (typeof q === 'string') return expect(q).toMatch(/drive/);
    expect(line(q, /Young Driver/)).toBe(inSave(sim, 1_719_98, 'GBP'));
    expect(q.lines.some((l) => /Taxes/.test(l.label))).toBe(false);
  });

  it('charges Los Angeles’s 9.75% sales tax before 1 October 2026 and 10.25% from it, with LAX’s charges and five days of its facility charge', () => {
    const sim = driver('us-ca-losangeles', 'rent-la', 30, 5, 'us-ca');
    const before = rentalQuote(sim, sim.player, 'us-ca-losangeles', Date.UTC(2026, 8, 20), Date.UTC(2026, 8, 27), true) as RentalQuote;
    const after = rentalQuote(sim, sim.player, 'us-ca-losangeles', Date.UTC(2026, 9, 2), Date.UTC(2026, 9, 9), true) as RentalQuote;
    const rent = inSave(sim, 7 * 40_00, 'USD');
    expect(line(before, /Taxes/)).toBe(Math.round(rent * (0.0975 + 0.1111 + 0.035)));
    expect(line(after, /Taxes/)).toBe(Math.round(rent * (0.1025 + 0.1111 + 0.035)));
    expect(line(after, /Facility/)).toBe(inSave(sim, 60_00, 'USD'));
  });

  it('waives Enterprise’s Toronto deposit for a renter with a ticket home, and converts Hertz Mexico’s dollar terms', () => {
    const sim = driver('us-ny-newyork', 'rent-ca', 30);
    const at = sim.now + 10 * MS_DAY;
    const withTicket = rentalQuote(sim, sim.player, 'ca-on-toronto', at, at + 2 * MS_DAY, true);
    const without = rentalQuote(sim, sim.player, 'ca-on-toronto', at, at + 2 * MS_DAY, false);
    if (typeof withTicket !== 'string' && typeof without !== 'string') {
      expect(withTicket.deposit).toBe(0);
      expect(without.deposit).toBe(inSave(sim, 400_00, 'CAD'));
    }
    const mx = rentalQuote(sim, sim.player, 'mx-cmx-mexicocity', at, at + 2 * MS_DAY, true);
    if (typeof mx !== 'string') expect(line(mx, /Damage Waiver/)).toBe(inSave(sim, 90_00, 'USD'));
  });
});

describe('who can’t rent', () => {
  it('refuses the underage, a license held too short a time, none at all, and a place with no rental kept', () => {
    const young = driver('us-ca-losangeles', 'rent-young', 20, 2, 'us-ca');
    const at = young.now + 10 * MS_DAY;
    expect(rentalQuote(young, young.player, 'us-ca-losangeles', at, at + MS_DAY, true)).toMatch(/from 21/);
    const fresh = driver('us-ca-losangeles', 'rent-fresh', 30, 0.5, 'us-ca');
    expect(rentalQuote(fresh, fresh.player, 'us-ca-losangeles', at, at + MS_DAY, true)).toMatch(/held 1 year/);
    const none = quickSave({ startLocationId: 'us-ca-losangeles', homeRegionId: 'us-ca-losangeles', livesWhereBorn: true, wealth: 'wealthy' }, 'rent-none');
    documentsOf(none.player).splice(0, documentsOf(none.player).length, ...documentsOf(none.player).filter((d) => d.kind !== 'license'));
    expect(rentalQuote(none, none.player, 'us-ca-losangeles', at, at + MS_DAY, true)).toMatch(/driving license/);
    expect(rentalQuote(young, young.player, 'fr-idf-paris', at, at + MS_DAY, true)).toMatch(/no rental cars there/);
  });
});

describe('the rental on a journey', () => {
  it('rents a car at LAX on a round trip, holds Enterprise’s $400 at pickup, drives it, and releases the deposit when the way home leaves', () => {
    const sim = driver('us-ny-newyork', 'rent-trip', 30, 5, 'us-ny');
    const day = saturday(sim, 14);
    const booked = sim.execute<{ journeyId: string; returnId: string }>({ kind: 'travel.book', payload: { toCity: 'us-ca-losangeles', day, slot: 2, returnDay: day + 7 * MS_DAY, returnSlot: 2 } });
    expect(booked.ok, booked.error).toBe(true);
    sim.universe.accounts[sim.player.primaryAccountId!]!.balance += inSave(sim, 5_000_00, 'USD');
    const r = sim.execute<{ rentalId: string; paid: number; deposit: number }>({ kind: 'travel.rent_car', payload: { journeyId: booked.value!.journeyId } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.deposit).toBe(inSave(sim, 400_00, 'USD'));
    expect(sim.execute({ kind: 'travel.rent_car', payload: { journeyId: booked.value!.journeyId } }).error).toMatch(/rented on it already/);
    const out = journeysOf(sim.player).find((j) => j.id === booked.value!.journeyId)!;
    liveTo(sim, out.arriveAt + (out.lateMinutes ?? 0) * 60_000 + 2 * MS_HOUR);
    const rental = rentalsOf(sim.player)[0]!;
    expect(rental.status).toBe('out');
    expect(sim.universe.accounts[rental.escrowAccountId!]!.balance).toBe(inSave(sim, 400_00, 'USD'));
    // Driven from where it is, within its days.
    expect(planRentalDrive(sim, sim.player, 'us-ca-losangeles', 'us-ca-sandiego', sim.now + MS_DAY, 2)).not.toBeTypeOf('string');
    expect(planRentalDrive(sim, sim.player, 'us-ca-losangeles', 'us-ca-sandiego', sim.now + 30 * MS_DAY, 2)).toMatch(/no rental car here/);
    const back = journeysOf(sim.player).find((j) => j.id === booked.value!.returnId)!;
    // A drive setting off on the last morning that would arrive after the car is due back is refused.
    const lastDay = [...Array(15).keys()].map((slot) => planRentalDrive(sim, sim.player, 'us-ca-losangeles', 'us-ca-sandiego', back.leaveAt - 4 * MS_HOUR, slot));
    expect(lastDay.some((x) => typeof x === 'string' && /due back/.test(x))).toBe(true);
    liveTo(sim, back.leaveAt + MS_HOUR);
    expect(rental.status).toBe('returned');
    expect(sim.universe.accounts[rental.escrowAccountId!]!.balance).toBe(0);
  });

  it('gives the rental back in full when the journey out is canceled', () => {
    const sim = driver('us-ny-newyork', 'rent-cancel', 30, 5, 'us-ny');
    const day = sim.now + 14 * MS_DAY;
    const booked = sim.execute<{ journeyId: string }>({ kind: 'travel.book', payload: { toCity: 'us-ca-losangeles', day, slot: 0, returnDay: day + 5 * MS_DAY, returnSlot: 0 } });
    sim.universe.accounts[sim.player.primaryAccountId!]!.balance += inSave(sim, 5_000_00, 'USD');
    const r = sim.execute<{ paid: number }>({ kind: 'travel.rent_car', payload: { journeyId: booked.value!.journeyId } });
    expect(r.ok, r.error).toBe(true);
    expect(sim.execute({ kind: 'travel.cancel', payload: { journeyId: booked.value!.journeyId } }).ok).toBe(true);
    sim.advanceBy(20 * MS_DAY);
    expect(rentalsOf(sim.player)[0]!.status).toBe('canceled');
    const refund = sim.universe.transactions.find((t) => t.memo === 'A rental car not picked up, refunded')!;
    expect(refund.postings.find((x) => x.amount > 0)!.amount).toBe(r.value!.paid);
  });
});

describe('a rental damaged', () => {
  it('owes the repair with the waiver declined: $882 at JFK, and $982 at LAX with Enterprise’s fee; nothing with it taken; the excess where one’s published, either way', () => {
    expect(damageOwed(RENTALS['us-ny-newyork']!, false)).toBe(882);
    expect(damageOwed(RENTALS['us-ny-newyork']!, true)).toBe(0);
    expect(damageOwed(RENTALS['us-ca-losangeles']!, false)).toBe(982);
    expect(damageOwed(RENTALS['us-ca-losangeles']!, true)).toBe(0);
    expect(damageOwed(RENTALS['uk-eng-london']!, true)).toBe(1_700);
    expect(damageOwed(RENTALS['us-ct-newhaven']!, false)).toBe(0);
  });

  it('keeps the waiver taken on the rental, and charges it', () => {
    const sim = driver('us-ny-newyork', 'rent-waiver', 30, 5, 'us-ny');
    const day = saturday(sim, 14);
    const booked = sim.execute<{ journeyId: string; returnId: string }>({ kind: 'travel.book', payload: { toCity: 'us-ca-losangeles', day, slot: 2, returnDay: day + 7 * MS_DAY, returnSlot: 2 } });
    expect(booked.ok, booked.error).toBe(true);
    sim.universe.accounts[sim.player.primaryAccountId!]!.balance += inSave(sim, 5_000_00, 'USD');
    const r = sim.execute<{ paid: number }>({ kind: 'travel.rent_car', payload: { journeyId: booked.value!.journeyId, waiver: true } });
    expect(r.ok, r.error).toBe(true);
    const rental = rentalsOf(sim.player)[0]!;
    expect(rental.waived).toBe(true);
    const out = journeysOf(sim.player).find((j) => j.id === booked.value!.journeyId)!;
    const back = journeysOf(sim.player).find((j) => j.id === booked.value!.returnId)!;
    expect(r.value!.paid).toBe((rentalQuote(sim, sim.player, 'us-ca-losangeles', out.arriveAt, back.leaveAt, true, true) as RentalQuote).total);
  });
});
