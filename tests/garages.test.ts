/**
 * An errand's car left at a garage instead of the meter (`garageCost` and
 * `errand.park` in `systems/trips.ts`, `content/garages.ts`, from
 * 2026-10-02): the garage's own units up to its day's maximum.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { GARAGES } from '@/engine/content/garages';
import { inSaveMoney } from '@/engine/systems/banking';
import { garageCost, garagesIn } from '@/engine/systems/trips';

const g = (id: string) => GARAGES.find((x) => x.id === id)!;

describe('a garage', () => {
  it('charges its own units, up to its day', () => {
    const sim = quickSave({ startLocationId: 'us-ca-losangeles', homeRegionId: 'us-ca-losangeles', livesWhereBorn: true, wealth: 'wealthy' }, 'garage');
    expect(garageCost(sim, g('la-mall'), 50)).toBe(inSaveMoney(sim, 1200, 'USD'));
    expect(garageCost(sim, g('la-mall'), 20)).toBe(inSaveMoney(sim, 400, 'USD'));
    expect(garageCost(sim, g('la-mall'), 8 * 60)).toBe(inSaveMoney(sim, 2500, 'USD'));
    expect(garageCost(sim, g('la-mall'), 0)).toBe(0);
    // The City of London's by the vehicle: less for an electric car.
    expect(garageCost(sim, g('ldn-baynard'), 60, true)).toBe(inSaveMoney(sim, 450, 'GBP'));
    expect(garageCost(sim, g('ldn-baynard'), 60)).toBe(inSaveMoney(sim, 580, 'GBP'));
    // No day's maximum posted: hour after hour.
    expect(garageCost(sim, g('dub-fleet'), 3 * 60)).toBe(inSaveMoney(sim, 1260, 'EUR'));
    expect(garagesIn('us-ny-newyork')).toEqual([]);
  });

  it('is paid for a stop when chosen, and refused where there’s no such garage', () => {
    const sim = quickSave({ startLocationId: 'us-ca-losangeles', homeRegionId: 'us-ca-losangeles', livesWhereBorn: true, wealth: 'wealthy' }, 'garage-park');
    sim.player.trip = { by: 'car', vehicleId: 'none', fuel: 0, km: 0 };
    const r = sim.execute<{ paid: number }>({ kind: 'errand.park', payload: { minutes: 50, garageId: 'la-pershing' } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.paid).toBe(inSaveMoney(sim, 1200, 'USD'));
    expect(sim.execute({ kind: 'errand.park', payload: { minutes: 50, garageId: 'nh-temple' } }).error).toBe('There’s no such garage in this town.');
  });
});
