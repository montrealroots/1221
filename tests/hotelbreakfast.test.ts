/**
 * Breakfast at the hotel (`systems/hotelbreakfast.ts`, from 2026-10-02):
 * with the room where it comes with it, at the hotel's published price
 * where it has one, once a morning, and not where neither is known.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { instantFromZoned, zonedParts } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { inSaveMoney } from '@/engine/systems/banking';
import { breakfastPrice, breakfastRefusal } from '@/engine/systems/hotelbreakfast';

const life = (seed: string) => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);
const morningIn = (sim: Simulation, zone: string, hour: number) => { const p = zonedParts(sim.now, zone); sim.universe.now = instantFromZoned({ year: p.year, month: p.month, day: p.day + 1, hour, minute: 0 }, zone); };

describe('breakfast at the hotel', () => {
  it('comes with the room at La Quinta, once a morning, before noon', () => {
    const sim = life('bk-quinta');
    const p = sim.player;
    p.currentLocationId = 'us-ct-newhaven';
    p.stay = { kind: 'hotel', cityId: 'us-ct-newhaven', hotelId: 'la-quinta-new-haven' };
    morningIn(sim, 'America/New_York', 8);
    expect(breakfastPrice(sim, p)).toBe(0);
    p.wellbeing.nourishment = 30;
    const r = sim.execute<{ paid: number }>({ kind: 'hotel.breakfast', payload: {} });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.paid).toBe(0);
    expect(p.wellbeing.nourishment).toBeGreaterThan(30);
    expect(breakfastRefusal(sim, p)).toBe('You’ve had breakfast today.');
    morningIn(sim, 'America/New_York', 13);
    expect(breakfastRefusal(sim, p)).toBe('Breakfast is over for the day.');
  });

  it('is the hotel’s own price where it publishes one, and not sold where it doesn’t', () => {
    const sim = life('bk-premier');
    const p = sim.player;
    p.currentLocationId = 'uk-eng-london';
    p.stay = { kind: 'hotel', cityId: 'uk-eng-london', hotelId: 'premier-inn-london-county-hall' };
    morningIn(sim, 'Europe/London', 8);
    expect(breakfastPrice(sim, p)).toBe(inSaveMoney(sim, 1399, 'GBP'));
    sim.must({ kind: 'hotel.breakfast', payload: {} });
    const paid = sim.universe.transactions.find((t) => t.memo === 'Premier Inn London County Hall, breakfast')!;
    expect(paid.postings.filter((q) => q.amount > 0).reduce((t, q) => t + q.amount, 0)).toBe(inSaveMoney(sim, 1399, 'GBP'));
    p.stay = { kind: 'hotel', cityId: 'uk-eng-london', hotelId: 'travelodge-london-kings-cross-royal-scot' };
    expect(breakfastPrice(sim, p)).toBeUndefined();
    expect(breakfastRefusal(sim, p)).toMatch(/doesn’t publish what its breakfast costs/);
    p.stay = { kind: 'hotel', cityId: 'uk-eng-london' };
    expect(breakfastRefusal(sim, p)).toBe('You aren’t staying at a hotel SLATE knows by name.');
  });
});
