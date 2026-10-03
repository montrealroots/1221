/**
 * A car's year, body, transmission and drivetrain where its maker's page
 * states them (`content/carspecs.ts`, from 2026-10-03), filtering the catalog.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { vehicleCatalog } from '@/engine/systems/catalogs';
import { arrange } from '@/engine/systems/catalog';

describe('a car’s specification', () => {
  it('filters the catalog by body and drivetrain where its maker states them', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'specs');
    const all = vehicleCatalog(sim, sim.player, 'us-ny-newyork', 'car');
    const crv = all.find((e) => e.id === 'us-honda-cr-v')!;
    expect(crv.facets).toMatchObject({ body: 'Compact SUV', drivetrain: 'FWD Or AWD' });
    const suvs = arrange(all, { filters: { body: 'Compact SUV' } } as never);
    expect(suvs.length).toBeGreaterThan(0);
    expect(suvs.every((e) => e.facets?.body === 'Compact SUV')).toBe(true);
    expect(suvs.length).toBeLessThan(all.length);
  });
});
