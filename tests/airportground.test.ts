/**
 * To the airport by transit, and a canceled flight's fare back
 * (`systems/airportground.ts`, `travel.take_refund` in `systems/journey.ts`,
 * from 2026-10-02).
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, instantFromZoned, normalDate, zonedParts } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { AIR } from '@/engine/content/air';
import { inSaveMoney } from '@/engine/systems/banking';
import { TRANSIT, byTransit, transitOffered } from '@/engine/systems/airportground';
import { hotelRefund, journeysOf, planBy, refundRefusal } from '@/engine/systems/journey';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const noonIn = (sim: Simulation, days: number) => { const p = zonedParts(sim.now + days * MS_DAY, sim.zone); return instantFromZoned({ ...normalDate(p.year, p.month, p.day), hour: 12 }, sim.zone); };

describe('to the airport by transit', () => {
  it('is the town’s read fare and, where the operator gives them, its minutes', () => {
    const sim = life('ca-on-toronto', 'ground-to');
    const legs = planBy(sim, undefined, 'ca-on-toronto', 'ca-bc-vancouver', noonIn(sim, 10), 2, 0);
    expect(typeof legs).not.toBe('string');
    if (typeof legs === 'string') return;
    expect(transitOffered(legs)).toBe(true);
    const out = byTransit(sim, legs);
    expect(out[0]!.fare).toBe(inSaveMoney(sim, 1235, 'CAD'));
    expect(out[0]!.arriveAt).toBe(legs[0]!.arriveAt);
    expect(out[0]!.arriveAt - out[0]!.departAt).toBe(28 * 60_000);
    // At the far end, Vancouver's Canada Line, as long as a taxi takes.
    const last = out[out.length - 1]!;
    expect(last.fare).toBe(inSaveMoney(sim, 1160, 'CAD'));
    expect(last.arriveAt - last.departAt).toBe(legs[legs.length - 1]!.arriveAt - legs[legs.length - 1]!.departAt);
    // Everything else as it was.
    expect(out.slice(1, -1)).toEqual(legs.slice(1, -1));
  });

  it('is booked and paid, cheaper than the taxi', () => {
    const sim = life('us-ny-newyork', 'ground-ny');
    const day = noonIn(sim, 10);
    const taxi = sim.execute<{ total: number; journeyId: string }>({ kind: 'travel.book', payload: { toCity: 'us-ca-losangeles', day, slot: 2, nights: 1 } });
    expect(taxi.ok, taxi.error).toBe(true);
    sim.must({ kind: 'travel.cancel', payload: { journeyId: taxi.value!.journeyId } });
    const transit = sim.execute<{ total: number }>({ kind: 'travel.book', payload: { toCity: 'us-ca-losangeles', day, slot: 2, nights: 1, ground: 'transit' } });
    expect(transit.ok, transit.error).toBe(true);
    expect(transit.value!.total).toBeLessThan(taxi.value!.total);
    expect(Object.keys(TRANSIT).length).toBeGreaterThan(5);
  });
});

describe('a canceled flight', () => {
  it('can be taken back as a refund, the way home with it, until the next one leaves', () => {
    const sim = life('us-ny-newyork', 'refund-ny');
    const day = noonIn(sim, 10);
    const r = sim.execute<{ journeyId: string }>({ kind: 'travel.book', payload: { toCity: 'us-ca-losangeles', day, slot: 2, returnDay: day + 4 * MS_DAY, returnSlot: 2 } });
    expect(r.ok, r.error).toBe(true);
    const out = journeysOf(sim.player).find((j) => j.id === r.value!.journeyId)!;
    const back = journeysOf(sim.player).find((j) => j.tripId === out.tripId && j.id !== out.id)!;
    expect(refundRefusal(sim, sim.player, out.id)).toBe('No flight of yours was canceled.');
    // The airline cancels it at the airport.
    out.status = 'underway';
    out.rebooked = true;
    const flight = out.legs.find((l) => l.mode === 'flight')!;
    sim.universe.now = flight.departAt;
    expect(refundRefusal(sim, sim.player, out.id)).toBeUndefined();
    const hotelBack = out.hotel ? hotelRefund(out.hotel, out.arriveAt, sim.now) : 0;
    const flights = out.legs.filter((l) => l.mode === 'flight' || l.mode === 'check-in').reduce((a, l) => a + l.fare, 0);
    const res = sim.execute<{ refund: number }>({ kind: 'travel.take_refund', payload: { journeyId: out.id } });
    expect(res.ok, res.error).toBe(true);
    expect(res.value!.refund).toBe(flights + hotelBack + back.total);
    expect(out.status).toBe('canceled');
    expect(back.status).toBe('canceled');
    expect(sim.universe.scheduled.some((x) => x.status === 'pending' && (x.payload.journeyId === out.id || x.payload.journeyId === back.id))).toBe(false);
  });

  it('can’t once the next flight has gone', () => {
    const sim = life('us-ny-newyork', 'refund-late');
    const r = sim.execute<{ journeyId: string }>({ kind: 'travel.book', payload: { toCity: 'us-ca-losangeles', day: noonIn(sim, 10), slot: 2, nights: 1 } });
    const out = journeysOf(sim.player).find((j) => j.id === r.value!.journeyId)!;
    out.status = 'underway';
    out.rebooked = true;
    sim.universe.now = out.legs.find((l) => l.mode === 'flight')!.departAt + AIR.rebookHours * 3_600_000;
    expect(refundRefusal(sim, sim.player, out.id)).toBe('The next flight has gone, with you on it.');
  });
});
