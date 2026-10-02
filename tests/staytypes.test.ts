/**
 * The kinds of stay a town has, and their terms (`content/staytypes.ts`,
 * `systems/stays.ts`, `hotelRefund` in `systems/journey.ts`, from
 * 2026-10-01): a hostel's bed by the person, a motel, a budget chain, an
 * extended-stay suite; a flexible rate or a prepaid one; a late cancellation
 * or a no-show keeping a flexible rate's first night; a New York hotel's
 * parking for a car brought.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, MS_HOUR, instantFromZoned, normalDate, zonedParts } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { documentsOf } from '@/engine/systems/documents';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { extendQuote, hotelRefund, journeysOf, type Journey } from '@/engine/systems/journey';
import { stayClassesIn, stayPrice } from '@/engine/systems/stays';
import { PREPAID_OFF } from '@/engine/content/staytypes';

const YEAR = 365.25 * MS_DAY;
function life(seed: string, town = 'us-ny-newyork'): Simulation {
  const sim = quickSave({ startLocationId: town, homeRegionId: town, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.player.documents = [];
  documentsOf(sim.player).push({ id: 'pp', kind: 'passport', issuer: 'US', name: 'Passport', number: 'P1', status: 'valid', issuedAt: sim.now - YEAR, expiresAt: sim.now + 8 * YEAR });
  return sim;
}
const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
function saturday(sim: Simulation, after: number): number {
  const p = zonedParts(sim.now + after * MS_DAY, sim.zone);
  for (let d = 0; d < 7; d += 1) {
    const at = instantFromZoned({ ...normalDate(p.year, p.month, p.day + d), hour: 12 }, sim.zone);
    if (zonedParts(at, sim.zone).weekday === 6) return at;
  }
  throw new Error('no saturday');
}
const book = (sim: Simulation, payload: Record<string, unknown>) => sim.execute<{ journeyId: string; total: number }>({ kind: 'travel.book', payload });
const journey = (sim: Simulation, id: string): Journey => journeysOf(sim.player).find((j) => j.id === id)!;

describe('the kinds of stay', () => {
  it('offers a town’s hotel and what else was read there, and prices a hostel’s bed by the person with the town’s taxes', () => {
    const sim = life('stay-kinds');
    expect(stayClassesIn('us-ny-newyork')).toEqual(['hotel', 'hostel', 'extended']);
    expect(stayClassesIn('us-ca-losangeles')).toEqual(['hotel', 'hostel', 'motel']);
    // Mexico City's hotels have an average from 2026-10-01: Monex's MX$1,600, VAT and the 3.5% lodging tax on top.
    expect(stayClassesIn('mx-cmx-mexicocity')).toEqual(['hotel', 'hostel']);
    expect(stayPrice(sim, 'mx-cmx-mexicocity', 1)!.price).toBe(inSave(sim, Math.round(1_600 * 1.195 * 100), 'MXN'));
    // New York: 14.75% and $3.50 a room a night; a hostel bed each for two.
    expect(stayPrice(sim, 'us-ny-newyork', 2, 2, 'hostel')!.price).toBe(inSave(sim, Math.round(2 * (53.1 * 2 * 1.1475 + 3.5) * 100), 'USD'));
    expect(stayPrice(sim, 'us-ny-newyork', 1, 2, 'extended')!.price).toBe(inSave(sim, Math.round((521 * 1.1475 + 3.5) * 100), 'USD'));
    expect(stayPrice(sim, 'us-ny-newyork', 1, 1, 'motel')).toBeUndefined();
    // Paid ahead, the middle of hotels' 8% to 15% off the room.
    expect(PREPAID_OFF).toBeCloseTo(0.115, 10);
    expect(stayPrice(sim, 'us-ca-losangeles', 1, 1, 'motel', 'prepaid')!.price).toBe(inSave(sim, Math.round(84 * (1 - 0.115) * 1.16 * 100), 'USD'));
    // Vancouver's taxes with the 2.5% major-events tax, GST on them all.
    expect(stayPrice(sim, 'ca-bc-vancouver', 1)!.price).toBe(inSave(sim, Math.round(284.44 * 1.135 * 1.05 * 100), 'CAD'));
  });

  it('books a journey’s stay in the kind chosen, and refuses one the town hasn’t', () => {
    const sim = life('stay-book');
    const day = saturday(sim, 14);
    expect(book(sim, { toCity: 'us-ca-losangeles', day, slot: 2, nights: 3, stay: 'extended' }).error).toMatch(/doesn’t have an extended-stay suite/);
    const r = book(sim, { toCity: 'us-ca-losangeles', day, slot: 2, nights: 3, stay: 'motel', plan: 'prepaid' });
    expect(r.ok, r.error).toBe(true);
    const h = journey(sim, r.value!.journeyId).hotel!;
    expect(h).toMatchObject({ nights: 3, cls: 'motel', plan: 'prepaid' });
    expect(h.price).toBe(stayPrice(sim, 'us-ca-losangeles', 3, 1, 'motel', 'prepaid')!.price);
  });
});

describe('a stay called off', () => {
  const hotel = { nights: 4, price: 400_00, basis: '', checkOutAt: 0 };
  it('comes back whole to a day before on a flexible rate, then all but the first night; prepaid, not at all; parking always', () => {
    const arrive = 100 * MS_DAY;
    expect(hotelRefund(hotel, arrive, arrive - 25 * MS_HOUR)).toBe(400_00);
    expect(hotelRefund(hotel, arrive, arrive - 23 * MS_HOUR)).toBe(300_00);
    expect(hotelRefund({ ...hotel, plan: 'prepaid' }, arrive, arrive - 30 * MS_DAY)).toBe(0);
    expect(hotelRefund({ ...hotel, price: 440_00, parking: 40_00 }, arrive, arrive)).toBe(40_00 + 300_00);
    expect(hotelRefund({ ...hotel, price: 440_00, parking: 40_00, plan: 'prepaid' }, arrive, arrive)).toBe(40_00);
  });

  it('refunds a missed journey’s hotel all but its first night, as a no-show’s are released', () => {
    const sim = life('stay-missed');
    const day = saturday(sim, 14);
    const r = book(sim, { toCity: 'us-ca-losangeles', day, slot: 2, nights: 4 });
    expect(r.ok, r.error).toBe(true);
    const j = journey(sim, r.value!.journeyId);
    const price = j.hotel!.price;
    // Away from home when it leaves, so it's missed.
    sim.player.currentLocationId = 'us-ct-newhaven';
    sim.advanceBy(j.leaveAt - sim.now + MS_HOUR);
    expect(j.status).toBe('missed');
    const released = sim.universe.transactions.filter((t) => t.memo === 'A hotel’s nights released, the first kept for the no-show');
    expect(released).toHaveLength(1);
    expect(released[0]!.postings.find((x) => x.accountId === sim.player.primaryAccountId)!.amount).toBe(price - Math.round(price / 4));
  });
});

describe('a stay’s other terms', () => {
  it('parks a car brought to a New York hotel at $85 a night, released with the rooms, and none for a flight', () => {
    const sim = quickSave({ startLocationId: 'us-ct-newhaven', homeRegionId: 'us-ct-newhaven', livesWhereBorn: true, wealth: 'wealthy' }, 'stay-park');
    documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer: 'us-ct', name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 10 * YEAR, expiresAt: sim.now + 5 * YEAR });
    expect(sim.execute({ kind: 'vehicle.buy', payload: { modelId: 'us-honda-cr-v' } }).ok).toBe(true);
    const v = sim.player.vehicles!.find((x) => x.soldAt === undefined)!;
    const r = book(sim, { toCity: 'us-ny-newyork', day: saturday(sim, 14), slot: 2, by: `car:${v.id}`, nights: 2 });
    expect(r.ok, r.error).toBe(true);
    const h = journey(sim, r.value!.journeyId).hotel!;
    expect(h.parking).toBe(inSave(sim, 170_00, 'USD'));
    expect(h.price).toBe(stayPrice(sim, 'us-ny-newyork', 2)!.price + inSave(sim, 170_00, 'USD'));
  });

  it('won’t swap a prepaid hotel for a holiday let, and releases a hotel when the airline refuses boarding', () => {
    const sim = life('stay-prepaid-let');
    const r = book(sim, { toCity: 'us-ca-losangeles', day: saturday(sim, 14), slot: 2, nights: 3, plan: 'prepaid' });
    expect(r.ok, r.error).toBe(true);
    expect(sim.execute({ kind: 'travel.stay_let', payload: { journeyId: r.value!.journeyId } }).error).toMatch(/paid ahead/);
    // Abroad, the passport lost after booking: refused at check-in, the hotel's nights but the first released.
    const abroad = life('stay-refused');
    const b = book(abroad, { toCity: 'ca-on-toronto', day: saturday(abroad, 14), slot: 2, nights: 4 });
    expect(b.ok, b.error).toBe(true);
    const j = journey(abroad, b.value!.journeyId);
    documentsOf(abroad.player)[0]!.status = 'lost';
    abroad.advanceBy(j.leaveAt - abroad.now + MS_HOUR);
    expect(j.status).toBe('missed');
    expect(abroad.universe.transactions.some((t) => t.memo === 'A hotel’s nights released, the first kept for the no-show')).toBe(true);
  });
});

describe('a stay made longer', () => {
  it('parks the car the added nights too', () => {
    const sim = quickSave({ startLocationId: 'us-ct-newhaven', homeRegionId: 'us-ct-newhaven', livesWhereBorn: true, wealth: 'wealthy' }, 'stay-park-longer');
    documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer: 'us-ct', name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 10 * YEAR, expiresAt: sim.now + 5 * YEAR });
    expect(sim.execute({ kind: 'vehicle.buy', payload: { modelId: 'us-honda-cr-v' } }).ok).toBe(true);
    const v = sim.player.vehicles!.find((x) => x.soldAt === undefined)!;
    const day = saturday(sim, 14);
    const r = sim.execute<{ journeyId: string; returnId: string }>({ kind: 'travel.book', payload: { toCity: 'us-ny-newyork', day, slot: 2, by: `car:${v.id}`, returnDay: day + 2 * MS_DAY, returnSlot: 2 } });
    expect(r.ok, r.error).toBe(true);
    const out = journey(sim, r.value!.journeyId);
    const nights = out.hotel!.nights;
    // As arriving leaves them: there, and the car with them.
    sim.player.currentLocationId = 'us-ny-newyork';
    v.at = 'us-ny-newyork';
    const q = extendQuote(sim, sim.player, r.value!.returnId, day + 4 * MS_DAY, 2);
    if (typeof q === 'string') throw new Error(q);
    expect(q.stay).toBe(stayPrice(sim, 'us-ny-newyork', q.nights)!.price + inSave(sim, 85_00, 'USD') * q.nights - out.hotel!.price);
    expect(q.nights).toBeGreaterThan(nights);
  });
});
