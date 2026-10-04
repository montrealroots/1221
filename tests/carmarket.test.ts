/**
 * A car's seller, and a car taken from America to Canada imported
 * (`systems/vehicles.ts`, from 2026-10-03).
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { documentsOf } from '@/engine/systems/documents';
import { CANADA_IMPORT, canadaImportCad, carryCars, dealerFor, vehiclesOf } from '@/engine/systems/vehicles';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);

describe('a car’s market', () => {
  it('is bought new from a named dealer of its make in the town, where one is kept', () => {
    expect(dealerFor('mx-cmx-mexicocity', 'Toyota')).toBe('Toyota Universidad');
    expect(dealerFor('us-ny-newyork', 'Kia')).toBeUndefined();
    const sim = life('us-ny-newyork', 'dealer');
    documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer: 'us-ny', name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 3650 * MS_DAY, expiresAt: sim.now + 3650 * MS_DAY });
    const r = sim.must<{ vehicleId: string }>({ kind: 'vehicle.buy', payload: { modelId: 'us-toyota-camry' } });
    expect(vehiclesOf(sim.player).find((v) => v.id === r.vehicleId)!.seller).toBe('Toyota of Manhattan');
  });

  it('taken from America to Canada is imported at the CBSA’s fees, then registered in its province', () => {
    expect(canadaImportCad(20_000, 'CA-ON')).toBeCloseTo(325 * 1.13 + 20_000 * 0.13 + 100, 6);
    expect(canadaImportCad(20_000, 'CA-BC')).toBeCloseTo(325 * 1.05 + 20_000 * 0.05 + 100, 6);
    expect(CANADA_IMPORT.ac).toBe(100);
    const sim = life('us-ny-newyork', 'import');
    documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer: 'us-ny', name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 3650 * MS_DAY, expiresAt: sim.now + 3650 * MS_DAY });
    const r = sim.must<{ vehicleId: string }>({ kind: 'vehicle.buy', payload: { modelId: 'us-toyota-camry' } });
    const v = vehiclesOf(sim.player).find((x) => x.id === r.vehicleId)!;
    carryCars(sim, sim.player, 'us-ny-newyork', 'ca-on-toronto');
    expect(v.jurisdiction).toBe('CA-ON');
    expect(sim.universe.transactions.some((t) => t.memo === 'Importing the Toyota Camry into Canada')).toBe(true);
    // Across another border the car keeps its registration.
    carryCars(sim, sim.player, 'ca-on-toronto', 'mx-cmx-mexicocity');
    expect(v.jurisdiction).toBe('CA-ON');
  });
});
