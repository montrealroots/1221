/**
 * A connection missed for a late flight (`flightsLate` in `systems/journey.ts`,
 * from 2026-10-03), a flight out changed to another day (`travel.change`),
 * and a suitcase too big for a cabin flown checked (`cabinBagRefusal`).
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned, normalDate, zonedParts } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { AIR, minimumConnection } from '@/engine/content/air';
import { LEAVE_KIND, changeQuote, flightsLate, journeysOf, slotOf, type JourneyLeg } from '@/engine/systems/journey';
import { rentalsOf } from '@/engine/systems/rentals';
import { stayPrice } from '@/engine/systems/stays';
import { cabinBagRefusal, checkedSize, suitcaseOf } from '@/engine/systems/luggage';
import { itemsOf } from '@/engine/systems/items';

const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
const life = (city: string, seed: string) => {
  const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.universe.accounts[sim.player.primaryAccountId!]!.balance += inSave(sim, 50_000_00, 'USD');
  return sim;
};
function saturday(sim: Simulation, after: number): number {
  const p = zonedParts(sim.now + after * MS_DAY, sim.zone);
  for (let d = 0; d < 7; d += 1) {
    const at = instantFromZoned({ ...normalDate(p.year, p.month, p.day + d), hour: 12 }, sim.zone);
    if (zonedParts(at, sim.zone).weekday === 6) return at;
  }
  throw new Error('no saturday');
}

/** Two flights with ninety minutes between, from one airport through another. */
const twoFlights = (a: string, b: string, c: string): JourneyLeg[] => [
  { mode: 'flight', from: a, to: b, departAt: 0, arriveAt: 2 * MS_HOUR, fare: 0, basis: '' },
  { mode: 'flight', from: b, to: c, departAt: 2 * MS_HOUR + AIR.connectionMinutes * 60_000, arriveAt: 6 * MS_HOUR, fare: 0, basis: '' },
];

describe('a connection', () => {
  it('absorbs a late flight within its slack: the connection leaves on time', () => {
    expect(flightsLate(twoFlights('JFK', 'ORD', 'LAX'), [20, 0])).toEqual({ late: 0, rebooked: false, missed: 0 });
    expect(flightsLate(twoFlights('JFK', 'ORD', 'LAX'), [20, 15])).toEqual({ late: 15, rebooked: false, missed: 0 });
  });

  it('is missed past the airport’s minimum, the passenger on the next flight five hours on', () => {
    expect(minimumConnection('ORD', true)).toBe(60);
    expect(flightsLate(twoFlights('JFK', 'ORD', 'LAX'), [31, 10])).toEqual({ late: AIR.rebookHours * 60 + 10, rebooked: false, missed: 1 });
    // A canceled first flight misses it too, but its five hours aren't counted twice.
    expect(flightsLate(twoFlights('JFK', 'ORD', 'LAX'), [null, 0])).toEqual({ late: AIR.rebookHours * 60, rebooked: true, missed: 1 });
  });

  it('at Toronto Pearson takes Air Canada’s 50 minutes domestic, an hour onward abroad', () => {
    expect(minimumConnection('YYZ', true)).toBe(50);
    expect(minimumConnection('YVR', true)).toBe(40);
    expect(flightsLate(twoFlights('YUL', 'YYZ', 'YVR'), [35, 0]).missed).toBe(0);
    expect(flightsLate(twoFlights('YUL', 'YYZ', 'LHR'), [35, 0]).missed).toBe(1);
  });
});

describe('a flight out, changed', () => {
  function roundTrip(seed: string, extra: Record<string, unknown> = {}) {
    const sim = life('us-ny-newyork', seed);
    const day = saturday(sim, 14);
    const r = sim.execute<{ journeyId: string; returnId: string }>({ kind: 'travel.book', payload: { toCity: 'us-ca-losangeles', day, slot: 1, returnDay: day + 5 * MS_DAY, returnSlot: 1, ...extra } });
    expect(r.ok, r.error).toBe(true);
    const out = journeysOf(sim.player).find((j) => j.id === r.value!.journeyId)!;
    return { sim, out, day };
  }

  it('a day later within America: no change fee, a night fewer at the hotel, the difference back', () => {
    const { sim, out, day } = roundTrip('change-later');
    expect(sim.execute({ kind: 'travel.rent_car', payload: { journeyId: out.id } }).ok).toBe(true);
    const nights = out.hotel!.nights;
    const q = changeQuote(sim, sim.player, out.id, day + MS_DAY, slotOf(out));
    if (typeof q === 'string') throw new Error(q);
    expect(q.nights).toBe(nights - 1);
    expect(q.stay).toBe(stayPrice(sim, 'us-ca-losangeles', nights - 1, 1, 'hotel', 'flexible', false, q.legs[q.legs.length - 1]!.arriveAt)!.price - out.hotel!.price);
    expect(q.stay).toBeLessThan(0);
    const bank = sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
    const r = sim.execute<{ total: number; leaveAt: number }>({ kind: 'travel.change', payload: { journeyId: out.id, day: day + MS_DAY, slot: slotOf(out) } });
    expect(r.ok, r.error).toBe(true);
    expect(out.leaveAt).toBe(r.value!.leaveAt);
    expect(out.leaveAt - (day + MS_DAY)).toBeLessThan(MS_DAY);
    expect(out.hotel!.nights).toBe(nights - 1);
    expect(sim.universe.accounts[sim.player.primaryAccountId!]!.balance - bank).toBe(-q.total);
    const leave = sim.universe.scheduled.filter((i) => i.status === 'pending' && i.kind === LEAVE_KIND && i.payload.journeyId === out.id);
    expect(leave.map((i) => i.at)).toEqual([out.leaveAt]);
    const car = rentalsOf(sim.player).find((c) => c.journeyId === out.id)!;
    expect(car.pickupAt).toBe(out.arriveAt);
  });

  it('isn’t moved past the way home, on a prepaid room, or with someone along', () => {
    const { sim, out, day } = roundTrip('change-no');
    expect(changeQuote(sim, sim.player, out.id, day + 6 * MS_DAY, slotOf(out))).toBe('It would land after the way home leaves.');
    expect(changeQuote(sim, sim.player, out.id, out.leaveAt, slotOf(out))).toBe('It’s the flight you have.');
    out.companionIds = ['someone'];
    expect(changeQuote(sim, sim.player, out.id, day + MS_DAY, slotOf(out))).toBe('Everyone along has a ticket of their own on it.');
    delete out.companionIds;
    out.hotel!.plan = 'prepaid';
    expect(changeQuote(sim, sim.player, out.id, day + MS_DAY, slotOf(out))).toBe('A prepaid room is non-refundable, so its nights can’t move.');
  });

  it('from Dublin to London at Aer Lingus’s €40', () => {
    const sim = life('ie-lei-dublin', 'change-ie');
    const day = saturday(sim, 20);
    const r = sim.execute<{ journeyId: string }>({ kind: 'travel.book', payload: { toCity: 'uk-eng-london', day, slot: 1, nights: 2 } });
    expect(r.ok, r.error).toBe(true);
    const out = journeysOf(sim.player).find((j) => j.id === r.value!.journeyId)!;
    const q = changeQuote(sim, sim.player, out.id, day + 2 * MS_DAY, slotOf(out));
    if (typeof q === 'string') throw new Error(q);
    expect(q.travel).toBeGreaterThanOrEqual(inSave(sim, 40_00, 'EUR'));
  });
});

describe('a suitcase too big for a cabin', () => {
  it('flies checked: booked with no bag, the flight is refused', () => {
    const sim = life('us-ny-newyork', 'big-case');
    expect(checkedSize(suitcaseOf(sim.player)!)).toBe(false);
    expect(sim.execute({ kind: 'luggage.buy', payload: { pieceId: 'us-away-the-large' } }).ok).toBe(true);
    const big = itemsOf(sim.player).find((i) => i.kind === 'luggage:us-away-the-large')!;
    expect(sim.execute({ kind: 'luggage.choose', payload: { itemId: big.id } }).ok).toBe(true);
    expect(checkedSize(big)).toBe(true);
    expect(cabinBagRefusal(sim.player, 0)).toBe(`Your ${big.label} is bigger than a cabin takes: it goes as a checked bag.`);
    expect(cabinBagRefusal(sim.player, 1)).toBeUndefined();
    const day = saturday(sim, 14);
    expect(sim.execute({ kind: 'travel.book', payload: { toCity: 'us-ca-losangeles', day, slot: 1, nights: 2 } }).error).toBe(cabinBagRefusal(sim.player, 0));
    expect(sim.execute({ kind: 'travel.book', payload: { toCity: 'us-ca-losangeles', day, slot: 1, nights: 2, bags: 1 } }).ok).toBe(true);
    // A carry-on duffel under the cabin's 45 liters isn't.
    expect(checkedSize({ ...big, kind: 'luggage:ca-herschel-supply-co-novel-duffle-twill-43-l' })).toBe(false);
    expect(checkedSize({ ...big, kind: 'luggage:uk-antler-discovery-wheeled-duffel' })).toBe(true);
  });
});
