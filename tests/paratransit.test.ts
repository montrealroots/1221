/**
 * Paratransit to the airport for a wheelchair user (`byParatransit` in
 * `systems/airportground.ts`, from 2026-10-02): where the service's own page
 * says it goes there, at its own fare a trip.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { journeysOf, planBy } from '@/engine/systems/journey';
import { PARATRANSIT, byParatransit, paratransitFare, paratransitOffered } from '@/engine/systems/airportground';
import { airportsFor } from '@/engine/systems/airports';
import { inSaveMoney } from '@/engine/systems/banking';

describe('paratransit to the airport', () => {
  it('takes a Torontonian in a wheelchair to Pearson on Wheel-Trans at C$3.30', () => {
    const sim = quickSave({ startLocationId: 'ca-on-toronto', homeRegionId: 'ca-on-toronto', livesWhereBorn: true, wealth: 'wealthy' }, 'para-to');
    const day = sim.now + 10 * MS_DAY;
    const legs = planBy(sim, undefined, 'ca-on-toronto', 'ca-bc-vancouver', day, 2, 0);
    if (typeof legs === 'string') throw new Error(legs);
    expect(paratransitOffered(legs)).toBe(true);
    const para = byParatransit(sim, legs);
    expect(para[0]!.fare).toBe(inSaveMoney(sim, 3_30, 'CAD'));
    // HandyDART at Vancouver's end.
    expect(para[para.length - 1]!.fare).toBe(inSaveMoney(sim, 2_85, 'CAD'));
    expect(sim.execute({ kind: 'travel.book', payload: { toCity: 'ca-bc-vancouver', day, slot: 2, nights: 2, ground: 'paratransit' } }).error).toBe('Paratransit is for a rider who uses a wheelchair.');
    sim.player.mobility = 'wheelchair';
    const r = sim.must<{ journeyId: string }>({ kind: 'travel.book', payload: { toCity: 'ca-bc-vancouver', day, slot: 2, nights: 2, ground: 'paratransit' } });
    expect(journeysOf(sim.player).find((j) => j.id === r.journeyId)!.legs[0]!.fare).toBe(inSaveMoney(sim, 3_30, 'CAD'));
    // Access-A-Ride reaches JFK and LaGuardia, not Newark in New Jersey, where New York's flights to Los Angeles leave.
    const ny = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'para-ny');
    const ewr = planBy(ny, undefined, 'us-ny-newyork', 'us-ca-losangeles', day, 2, 0);
    if (typeof ewr === 'string') throw new Error(ewr);
    expect(ewr[0]!.to).toBe('EWR');
    // Newark's end isn't offered; LAX's is, Access Services across Los Angeles County (from 2026-10-03).
    expect(byParatransit(ny, ewr)[0]).toEqual(ewr[0]);
    expect(paratransitOffered(ewr)).toBe(true);
  });

  it('takes an Angeleno to LAX on Access Services at its fare by the miles: $2.75 under 20, $3.50 from them', () => {
    const p = PARATRANSIT['us-ca-losangeles']!;
    const laxMiles = airportsFor('us-ca-losangeles').find((a) => a.airport.iata === 'LAX')!.km / 1.609344;
    expect(laxMiles).toBeLessThan(20);
    expect(paratransitFare(p, 'us-ca-losangeles', 'LAX')).toBe(2.75);
    const ont = airportsFor('us-ca-losangeles').find((a) => a.airport.iata === 'ONT')!;
    expect(ont.km / 1.609344).toBeGreaterThanOrEqual(20);
    expect(paratransitFare(p, 'us-ca-losangeles', 'ONT')).toBe(3.5);
    const sim = quickSave({ startLocationId: 'us-ca-losangeles', homeRegionId: 'us-ca-losangeles', livesWhereBorn: true, wealth: 'wealthy' }, 'para-la');
    const legs = planBy(sim, undefined, 'us-ca-losangeles', 'us-ny-newyork', sim.now + 10 * MS_DAY, 2, 0);
    if (typeof legs === 'string') throw new Error(legs);
    expect(byParatransit(sim, legs)[0]!.fare).toBe(inSaveMoney(sim, 275, 'USD'));
  });
});
