/**
 * The car's month hands a driven car to the tint ticket's draw
 * (`systems/vehicles.ts` into `tintOnTheRoad`, from 2026-09-30): the draw is
 * too rare to see at New York's rate, so the call is watched.
 */
import { describe, expect, it, vi } from 'vitest';

const seen: string[] = [];
vi.mock('@/engine/systems/tint', async (original) => {
  const real = await original<typeof import('@/engine/systems/tint')>();
  return { ...real, tintOnTheRoad: (...args: Parameters<typeof real.tintOnTheRoad>) => { seen.push(args[2].tint ?? 'none'); return false; } };
});

import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { vehiclesOf } from '@/engine/systems/vehicles';

describe('a month driven with tint', () => {
  it('is drawn for a ticket', () => {
    const sim = quickSave({ startLocationId: 'us-ca-losangeles', homeRegionId: 'us-ca-losangeles', livesWhereBorn: true, wealth: 'wealthy' }, 'tint-road');
    sim.player.documents = [{ id: 'lic', kind: 'license', issuer: 'us-ca', name: 'License', number: 'L', status: 'valid', issuedAt: sim.now - 365 * MS_DAY, expiresAt: sim.now + 3_000 * MS_DAY }];
    const r = sim.execute<{ vehicleId: string }>({ kind: 'vehicle.buy', payload: { modelId: 'us-toyota-camry' } });
    expect(r.ok, r.error).toBe(true);
    vehiclesOf(sim.player)[0]!.tint = 'full';
    sim.advanceBy(70 * MS_DAY);
    expect(seen).toContain('full');
  });
});
