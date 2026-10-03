/**
 * Everyday tires wearing out (`tiresWorn` in `systems/tires.ts`, from
 * 2026-10-03): Michelin's 60,000-mile treadwear warranty for the
 * CrossClimate 2, a test that checks them failing them past it, and a set
 * fitted at the market's price.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { inspectIfDue, inspectionFails } from '@/engine/systems/inspections';
import { HALOGENS_BACK_GBP, MOD_LOADING, modLoading } from '@/engine/systems/mods';
import { TIRE_LIFE_KM, TIRE_SET, odometerOf, tireSetCost, tiresFittedAt, tiresWorn } from '@/engine/systems/tires';
import { vehiclesOf } from '@/engine/systems/vehicles';
import { inSaveMoney } from '@/engine/systems/banking';

const bought = (city: string, model: string, seed: string) => {
  const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.must({ kind: 'vehicle.buy', payload: { modelId: model } });
  return { sim, v: vehiclesOf(sim.player)[0]! };
};

describe('everyday tires', () => {
  it('last Michelin’s 60,000 miles from when they were fitted', () => {
    const { v } = bought('uk-eng-london', 'gb-ford-puma', 'tires-life');
    expect(TIRE_LIFE_KM).toBe(Math.round(60_000 * 1.609344));
    expect(tiresWorn(v)).toBe(false);
    v.km = TIRE_LIFE_KM - 1;
    expect(tiresWorn(v)).toBe(false);
    v.km = TIRE_LIFE_KM;
    expect(tiresWorn(v)).toBe(true);
    // A used car's were last changed at the odometer's last multiple of their life.
    expect(tiresFittedAt({ ageAtPurchase: 9, jurisdiction: 'GB', odometerAtPurchase: TIRE_LIFE_KM + 500 })).toBe(TIRE_LIFE_KM);
  });

  it('worn, fail the MOT, and a set is fitted at Blackcircles’ price', () => {
    const { sim, v } = bought('uk-eng-london', 'gb-ford-puma', 'tires-mot');
    v.km = TIRE_LIFE_KM + 10;
    const f = inspectionFails(sim, v, sim.now)!;
    expect(f.tires).toBe(true);
    expect(f.repair).toBeCloseTo(58.99 * 4, 6);
    expect(f.repairCurrency).toBe('GBP');
    expect(TIRE_SET.GB!.price).toBeCloseTo(235.96, 6);
  });

  it('fitted by choice, at the market’s price, start their life again', () => {
    const { sim, v } = bought('us-ny-newyork', 'us-honda-cr-v', 'tires-buy');
    v.km = 50_000;
    const r = sim.must<{ paid: number }>({ kind: 'vehicle.replace_tires', payload: { vehicleId: v.id } });
    expect(r.paid).toBe(tireSetCost(sim, v));
    expect(r.paid).toBe(inSaveMoney(sim, Math.round((899.96 + 80) * 100), 'USD'));
    expect(v.tiresAtKm).toBe(odometerOf(v));
    v.km = 50_000 + TIRE_LIFE_KM - 1;
    expect(tiresWorn(v)).toBe(false);
  });
});

describe('a part that changes the car', () => {
  it('a body kit in Britain loads the premium as the study’s body kit; American wheels and a kit change only its look', () => {
    const { sim, v } = bought('uk-eng-london', 'gb-ford-puma', 'mods-kit');
    sim.must({ kind: 'vehicle.modify', payload: { vehicleId: v.id, mod: 'bodykit' } });
    expect(modLoading(v)).toBeCloseTo(1 + MOD_LOADING.bodykit, 9);
    const us = bought('us-ny-newyork', 'us-honda-cr-v', 'mods-us');
    const r = us.sim.must<{ paid: number }>({ kind: 'vehicle.modify', payload: { vehicleId: us.v.id, mod: 'wheels' } });
    expect(r.paid).toBe(inSaveMoney(us.sim, Math.round(131.79 * 4 * 100), 'USD'));
    expect(us.v.mods).toEqual(['wheels']);
    expect(modLoading(us.v)).toBe(1);
    expect(us.sim.execute({ kind: 'vehicle.modify', payload: { vehicleId: us.v.id, mod: 'led' } }).error).toBe('No price for it is read where it’s registered.');
  });

  it('LED bulbs in a halogen headlamp fail the MOT, and the halogens go back', () => {
    const { sim, v } = bought('uk-eng-london', 'gb-ford-puma', 'mods-led');
    sim.must({ kind: 'vehicle.modify', payload: { vehicleId: v.id, mod: 'led' } });
    const f = inspectionFails(sim, v, sim.now)!;
    expect(f).toMatchObject({ led: true, repairCurrency: 'GBP' });
    expect(f.repair).toBeCloseTo(HALOGENS_BACK_GBP, 9);
    v.boughtAt = sim.now - 4 * 365 * 86_400_000;
    expect(inspectIfDue(sim, sim.player, v)).toBe(true);
    expect(v.mods).toEqual([]);
  });

  it('an MOT that fails worn tires fits a new set', () => {
    const { sim, v } = bought('uk-eng-london', 'gb-ford-puma', 'tires-mot-fit');
    v.km = TIRE_LIFE_KM + 10;
    v.boughtAt = sim.now - 4 * 365 * 86_400_000;
    expect(inspectIfDue(sim, sim.player, v)).toBe(true);
    expect(v.tiresAtKm).toBe(odometerOf(v));
    expect(tiresWorn(v)).toBe(false);
  });
});
