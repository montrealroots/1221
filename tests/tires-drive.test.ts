/**
 * The car's month hands the winter tires' factor to the road's draw
 * (`systems/vehicles.ts` into `drive`, from 2026-09-30): the draw itself is too
 * rare to see, so the call is watched.
 */
import { describe, expect, it, vi } from 'vitest';

const factors: number[] = [];
vi.mock('@/engine/systems/driving', async (original) => {
  const real = await original<typeof import('@/engine/systems/driving')>();
  return { ...real, drive: (...args: Parameters<typeof real.drive>) => { factors.push(args[7] ?? 1); return { hurt: false, ticket: false }; } };
});

import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { vehiclesOf } from '@/engine/systems/vehicles';

describe('a winter month on winter tires', () => {
  it('drives at the tires’ factor', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'tires-drive');
    sim.player.documents = [{ id: 'lic', kind: 'license', issuer: 'us-ny', name: 'License', number: 'L', status: 'valid', issuedAt: sim.now - 365 * MS_DAY, expiresAt: sim.now + 3_000 * MS_DAY, realId: true }];
    const r = sim.execute<{ vehicleId: string }>({ kind: 'vehicle.buy', payload: { modelId: 'us-toyota-camry' } });
    expect(r.ok, r.error).toBe(true);
    const v = vehiclesOf(sim.player)[0]!;
    v.winterTires = { boughtAt: sim.now, km: 0 };
    sim.advanceBy(200 * MS_DAY);
    expect(factors).toContain(0.95);
    expect(factors).toContain(1);
  });
});
