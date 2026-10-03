/**
 * A table booked ahead (`systems/reservations.ts`, from 2026-10-03): each
 * restaurant's own window, party and charges.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned, zonedParts } from '@/engine/core/time';
import { CITIES } from '@/engine/content/geography';
import { lateFee, reservationsOf, reserveRefusal } from '@/engine/systems/reservations';
import { inSaveMoney } from '@/engine/systems/banking';
import { diningQuote, restaurantById } from '@/engine/systems/dining';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const at = (sim: Simulation, city: string, days: number, hour: number) => { const z = CITIES.require(city).timeZone; const p = zonedParts(sim.now + days * MS_DAY, z); return instantFromZoned({ year: p.year, month: p.month, day: p.day, hour, minute: 0 }, z); };
const dish = (id: string) => restaurantById(id)!.menu.find((m) => m.price !== null)!.item;
const spent = (sim: Simulation, memo: string) => sim.universe.transactions.filter((t) => t.memo === memo).length;

describe('a table booked ahead', () => {
  it('keeps each restaurant’s own terms', () => {
    const sim = life('us-ny-newyork', 'tables-terms');
    expect(reserveRefusal(sim, 'frank-pepe-pizzeria-wooster-newhaven', at(sim, 'us-ct-newhaven', 3, 19), 2, dish('frank-pepe-pizzeria-wooster-newhaven'))).toBe('Frank Pepe Pizzeria Napoletana takes no reservations: it’s first come, first served.');
    expect(reserveRefusal(sim, 'n-naka-la', at(sim, 'us-ca-losangeles', 40, 19), 2, dish('n-naka-la'))).toBe('n/naka’s tables open 31 days ahead.');
    expect(reserveRefusal(sim, 'n-naka-la', at(sim, 'us-ca-losangeles', 10, 19), 5, dish('n-naka-la'))).toBe('n/naka books 4 at the most.');
    expect(reserveRefusal(sim, 'dishoom-covent-garden-london', at(sim, 'uk-eng-london', 3, 19), 2, dish('dishoom-covent-garden-london'))).toBe('After 18:00 Dishoom Covent Garden books parties of 6 or more.');
    expect(reserveRefusal(sim, 'dishoom-covent-garden-london', at(sim, 'uk-eng-london', 3, 13), 2, dish('dishoom-covent-garden-london'))).toBeUndefined();
    expect(reserveRefusal(sim, 'katzs-delicatessen-newyork', at(sim, 'us-ny-newyork', 3, 13), 2, dish('katzs-delicatessen-newyork'))).toMatch(/booking terms aren’t kept/);
  });

  it('is kept at its hour: the party’s dish each, paid then', () => {
    const sim = life('us-ny-newyork', 'tables-kept');
    const when = at(sim, 'us-ny-newyork', 3, 19);
    sim.must({ kind: 'food.reserve', payload: { restaurantId: 'le-bernardin-newyork', at: when, party: 2, item: dish('le-bernardin-newyork') } });
    sim.advanceTo(when + 3 * MS_HOUR);
    expect(spent(sim, 'Le Bernardin, a table for 2')).toBe(1);
    expect(reservationsOf(sim.player)).toEqual([]);
  });

  it('not come, costs Le Bernardin’s $150 a person; canceled in time, nothing; inside 48 hours, the fee', () => {
    const sim = life('us-ny-newyork', 'tables-noshow');
    const when = at(sim, 'us-ny-newyork', 5, 19);
    sim.must({ kind: 'food.reserve', payload: { restaurantId: 'le-bernardin-newyork', at: when, party: 2, item: dish('le-bernardin-newyork') } });
    sim.player.currentLocationId = 'uk-eng-london';
    sim.advanceTo(when + 3 * MS_HOUR);
    expect(spent(sim, 'Le Bernardin, not come')).toBe(1);
    expect(lateFee(sim, 'le-bernardin-newyork', when, 2)).toBe(inSaveMoney(sim, 300_00, 'USD'));
    sim.player.currentLocationId = 'us-ny-newyork';
    const later = at(sim, 'us-ny-newyork', 10, 19);
    const a = sim.must<{ id: string }>({ kind: 'food.reserve', payload: { restaurantId: 'le-bernardin-newyork', at: later, party: 2, item: dish('le-bernardin-newyork') } });
    expect(sim.must<{ fee: number }>({ kind: 'food.cancel_table', payload: { reservationId: a.id } }).fee).toBe(0);
    const soon = sim.now + 30 * MS_HOUR;
    const b = sim.must<{ id: string }>({ kind: 'food.reserve', payload: { restaurantId: 'le-bernardin-newyork', at: soon, party: 1, item: dish('le-bernardin-newyork') } });
    expect(sim.must<{ fee: number }>({ kind: 'food.cancel_table', payload: { reservationId: b.id } }).fee).toBe(inSaveMoney(sim, 150_00, 'USD'));
  });

  it('prepaid at n/naka, its $395 a person counting toward the meal', () => {
    const sim = life('us-ca-losangeles', 'tables-prepaid');
    const when = at(sim, 'us-ca-losangeles', 10, 19);
    const r = sim.must<{ prepaid: number }>({ kind: 'food.reserve', payload: { restaurantId: 'n-naka-la', at: when, party: 2, item: dish('n-naka-la') } });
    expect(r.prepaid).toBe(inSaveMoney(sim, 790_00, 'USD'));
    expect(spent(sim, 'n/naka, paid ahead')).toBe(1);
    // At the table, only what the meal comes to beyond it.
    const q = diningQuote(sim, restaurantById('n-naka-la')!, [dish('n-naka-la'), dish('n-naka-la')], 'in')!;
    sim.advanceTo(when + 4 * MS_HOUR);
    const charged = sim.universe.transactions.filter((t) => t.memo === 'n/naka, a table for 2').reduce((n, t) => n + Math.abs(t.postings.find((x) => x.accountId === sim.player.primaryAccountId)?.amount ?? 0), 0);
    expect(charged).toBe(Math.max(0, q.total - r.prepaid));
  });
});
