/**
 * A holiday let instead of a hotel (`content/lets.ts`, `systems/journey.ts`,
 * docs/WORLD.md stage 8b, from 2026-09-29): the price with its fee and the
 * town's taxes, the law that bars one, Airbnb's Moderate refunds, and the
 * let lived in with a kitchen of its own.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned, normalDate, zonedParts } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { journeysOf, letDamaged, letQuote, letRefund } from '@/engine/systems/journey';
import { stayPlace } from '@/engine/systems/dwelling';

const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
const save = (name: string) => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, name);
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

describe('what a let costs, and where the law bars it', () => {
  it('prices five nights in Los Angeles at AirDNA’s $218, Airbnb’s 14.1% and the city’s 14% occupancy tax', () => {
    const sim = save('let-la');
    const q = letQuote(sim, 'us-ca-losangeles', 5);
    if (typeof q === 'string') throw new Error(q);
    const rent = inSave(sim, 1_090_00, 'USD');
    expect(q.fee).toBe(Math.round(rent * 0.141));
    expect(q.price).toBe(rent + Math.round(rent * 0.141) + Math.round(rent * 0.14));
  });

  it('bars a New York City home for fewer than 30 nights, a London one for more than 90, and keeps none in Paris', () => {
    const sim = save('let-law');
    expect(letQuote(sim, 'us-ny-newyork', 5)).toMatch(/Local Law 18/);
    const month = letQuote(sim, 'us-ny-newyork', 30);
    if (typeof month === 'string') throw new Error(month);
    const rent = inSave(sim, 182_00 * 30, 'USD');
    expect(month.price).toBe(rent + Math.round(rent * 0.141) + Math.round(rent * (0.05875 + 0.08875)) + inSave(sim, 350 * 30, 'USD'));
    expect(letQuote(sim, 'uk-eng-london', 91)).toMatch(/90 nights/);
    expect(letQuote(sim, 'fr-idf-paris', 3)).toMatch(/no holiday lets/);
  });

  it('levies Edinburgh’s 5% on a stay’s first five nights only', () => {
    const sim = save('let-edi');
    const q = letQuote(sim, 'uk-sct-edinburgh', 8);
    if (typeof q === 'string') throw new Error(q);
    const rent = inSave(sim, 269_00 * 8, 'USD');
    expect(q.price).toBe(rent + Math.round(rent * 0.141) + Math.round(Math.round(rent * 5 / 8) * 0.05));
  });

  it('refunds all of it five days out, and half the nights after the first inside that, the fee kept', () => {
    const l = { nights: 4, price: 1_000_00, fee: 100_00, basis: '', checkOutAt: 0 };
    const arrive = 100 * MS_DAY;
    expect(letRefund(l, arrive, arrive - 5 * MS_DAY)).toBe(1_000_00);
    expect(letRefund(l, arrive, arrive - 2 * MS_DAY)).toBe(Math.round(900_00 * 3 / 4 / 2));
    expect(letRefund({ ...l, nights: 1 }, arrive, arrive - 2 * MS_DAY)).toBe(0);
  });
});

describe('a let lived in', () => {
  it('swaps a Los Angeles hotel for a let, cooked in on arrival, and a hotel from the let’s last morning if still there', () => {
    const sim = save('let-trip');
    const day = saturday(sim, 14);
    const booked = sim.execute<{ journeyId: string }>({ kind: 'travel.book', payload: { toCity: 'us-ca-losangeles', day, slot: 2, nights: 4 } });
    expect(booked.ok, booked.error).toBe(true);
    const j = journeysOf(sim.player).find((x) => x.id === booked.value!.journeyId)!;
    const hotel = j.hotel!.price;
    sim.universe.accounts[sim.player.primaryAccountId!]!.balance += inSave(sim, 5_000_00, 'USD');
    const r = sim.execute<{ price: number; hotelBack: number }>({ kind: 'travel.stay_let', payload: { journeyId: j.id } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.hotelBack).toBe(hotel);
    expect(j.hotel).toBeUndefined();
    expect(j.let!.nights).toBe(4);
    expect(sim.execute({ kind: 'travel.stay_let', payload: { journeyId: j.id } }).error).toMatch(/takes the place of the journey’s hotel/);
    liveTo(sim, j.arriveAt + (j.lateMinutes ?? 0) * 60_000 + 2 * MS_HOUR);
    expect(sim.player.stay?.kind).toBe('let');
    expect(stayPlace(sim, sim.player).cooks).toBe(true);
    liveTo(sim, j.let!.checkOutAt + MS_HOUR);
    expect(sim.player.stay?.kind).toBe('hotel');
  });
});

describe('a let’s damage claim', () => {
  it('comes on about 0.02% of stays', () => {
    const sim = save('let-damage-share');
    let n = 0;
    for (let i = 0; i < 200_000; i += 1) if (letDamaged(sim, sim.player, `stay${i}`)) n += 1;
    expect(n / 200_000).toBeGreaterThan(0.0001);
    expect(n / 200_000).toBeLessThan(0.0003);
  });

  it('charges the guest $1,000 as they leave a let the host claims on, and nothing leaving a hotel', () => {
    const sim = save('let-damage');
    sim.universe.accounts[sim.player.primaryAccountId!]!.balance += inSave(sim, 20_000_00, 'USD');
    const day = saturday(sim, 14);
    const booked = sim.execute<{ journeyId: string; returnId: string }>({ kind: 'travel.book', payload: { toCity: 'us-ca-losangeles', day, slot: 1, returnDay: day + 4 * MS_DAY, returnSlot: 2 } });
    expect(booked.ok, booked.error).toBe(true);
    expect(sim.execute({ kind: 'travel.stay_let', payload: { journeyId: booked.value!.journeyId } }).ok).toBe(true);
    const back = journeysOf(sim.player).find((j) => j.id === booked.value!.returnId)!;
    // The way home given an id whose draw is a claim.
    let id = '';
    for (let i = 0; !id && i < 1_000_000; i += 1) if (letDamaged(sim, sim.player, `claim${i}`)) id = `claim${i}`;
    for (const item of sim.universe.scheduled) if (item.payload.journeyId === back.id) item.payload.journeyId = id;
    back.id = id;
    liveTo(sim, back.leaveAt + MS_HOUR);
    const claims = sim.universe.transactions.filter((t) => t.memo === 'A holiday let’s damage claim, through the host’s platform');
    expect(claims).toHaveLength(1);
    expect(claims[0]!.postings.filter((x) => x.amount > 0).reduce((a, x) => a + x.amount, 0)).toBe(inSave(sim, 1_000_00, 'USD'));
  });
});
