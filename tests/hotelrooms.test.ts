/**
 * Several rooms of a hotel (`rooms` on `travel.book`, from 2026-10-03), each
 * at the rate, its deposit each, its beds each; and a named hotel's stay made
 * longer at its own rate (`restay`), which until 2026-10-03 was the town's.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, instantFromZoned, normalDate, zonedParts } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { extendQuote, journeysOf, slotOf } from '@/engine/systems/journey';
import { depositFor, namedStayQuote } from '@/engine/systems/hotels';
import { sleepsIn } from '@/engine/systems/companions';

const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
const life = (city: string, seed: string) => {
  const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.universe.accounts[sim.player.primaryAccountId!]!.balance += inSave(sim, 50_000_00, 'USD');
  return sim;
};
const dayOn = (sim: Simulation, after: number) => { const p = zonedParts(sim.now + after * MS_DAY, sim.zone); return instantFromZoned({ ...normalDate(p.year, p.month, p.day), hour: 12 }, sim.zone); };

describe('several rooms', () => {
  it('cost each its rate, sleep each its beds, and hold each its deposit', () => {
    const sim = life('us-ct-newhaven', 'rooms-two');
    const r = sim.execute<{ journeyId: string }>({ kind: 'travel.book', payload: { toCity: 'us-ny-newyork', day: dayOn(sim, 10), slot: 2, nights: 2, hotelId: 'pod-times-square', room: 'Queen Pod', rooms: 2 } });
    expect(r.ok, r.error).toBe(true);
    const j = journeysOf(sim.player).find((x) => x.id === r.value!.journeyId)!;
    const one = namedStayQuote(sim, 'pod-times-square', 'Queen Pod', 'flexible', j.arriveAt, 2)!.price;
    expect(j.hotel!.rooms).toBe(2);
    expect(j.hotel!.price).toBe(2 * one);
    expect(sleepsIn(j)).toBe(4);
    while (j.status !== 'arrived' && sim.now < j.arriveAt + 2 * MS_DAY) sim.advanceTo(sim.now + 30 * 60_000);
    expect(j.hotel!.deposit).toBe(2 * depositFor(sim, 'pod-times-square', 2));
  });

  it('are a hotel’s, and a booking takes at most four', () => {
    const sim = life('us-ct-newhaven', 'rooms-hostel');
    expect(sim.execute({ kind: 'travel.book', payload: { toCity: 'us-ny-newyork', day: dayOn(sim, 10), slot: 2, nights: 2, stay: 'hostel', rooms: 2 } }).error).toBe('Several rooms are a hotel’s.');
    const r = sim.execute<{ journeyId: string }>({ kind: 'travel.book', payload: { toCity: 'us-ny-newyork', day: dayOn(sim, 10), slot: 2, nights: 2, rooms: 9 } });
    expect(r.ok, r.error).toBe(true);
    expect(journeysOf(sim.player).find((x) => x.id === r.value!.journeyId)!.hotel!.rooms).toBe(4);
  });
});

describe('a named hotel, staying longer', () => {
  it('adds its nights at the hotel’s own rate, for each room', () => {
    const sim = life('us-ct-newhaven', 'rooms-longer');
    const day = dayOn(sim, 10);
    const r = sim.execute<{ journeyId: string; returnId: string }>({ kind: 'travel.book', payload: { toCity: 'us-ny-newyork', day, slot: 1, returnDay: day + 3 * MS_DAY, returnSlot: 1, hotelId: 'pod-times-square', room: 'Queen Pod', rooms: 2 } });
    expect(r.ok, r.error).toBe(true);
    const out = journeysOf(sim.player).find((x) => x.id === r.value!.journeyId)!;
    const back = journeysOf(sim.player).find((x) => x.id === r.value!.returnId)!;
    while (out.status !== 'arrived' && sim.now < out.arriveAt + 2 * MS_DAY) sim.advanceTo(sim.now + 30 * 60_000);
    const q = extendQuote(sim, sim.player, back.id, back.leaveAt + 2 * MS_DAY, slotOf(back));
    if (typeof q === 'string') throw new Error(q);
    expect(q.stay).toBe(2 * namedStayQuote(sim, 'pod-times-square', 'Queen Pod', 'flexible', out.arriveAt, q.nights)!.price - out.hotel!.price);
  });
});
