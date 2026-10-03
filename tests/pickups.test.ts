/**
 * Pickups (`content/pickups.ts`, from 2026-10-03): the catalog's pickups
 * marked, Toyota's and Ford's added where they're sold, California's weight
 * fee on one, Britain's commercial vehicle tax and VAT, and a bed that
 * carries a bed and a sofa on a move.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { documentsOf } from '@/engine/systems/documents';
import { caWeightFee, caYear, isPickup, modelById, modelsFor, renewal, vehiclesOf, type OwnedVehicle } from '@/engine/systems/vehicles';
import { carryFurniture } from '@/engine/systems/furniture';

const YEAR = 365.25 * MS_DAY;
const at = Date.UTC(2026, 9, 1);
const held = (id: string, j: string) => ({ id: 'owned', modelId: id, jurisdiction: j, cityId: '', boughtAt: at, ageAtPurchase: 0, listPrice: modelById(id)!.price, coverage: 'full', registrationDue: 0 }) as OwnedVehicle;

describe('a pickup', () => {
  it('is on sale as a car, marked a pickup, its maker’s added where sold', () => {
    expect(isPickup(modelById('us-ford-f-series')!)).toBe(true);
    expect(isPickup(modelById('us-toyota-camry')!)).toBe(false);
    expect(modelsFor('us-ny-newyork').some((m) => m.id === 'us-toyota-tacoma')).toBe(true);
    expect(modelsFor('uk-eng-london').filter(isPickup).map((m) => m.id).sort()).toEqual(['gb-ford-ranger', 'gb-toyota-hilux']);
    // Britain's makers print it before VAT; a private buyer pays it.
    expect(modelById('gb-toyota-hilux')!.price).toBe(Math.round(34_670 * 1.2 * 100));
    // Ford's curb weight where the catalog had none.
    expect(Math.round(modelById('us-ford-f-series')!.kerbKg! * 2.20462)).toBe(4_391);
  });

  it('pays California’s weight fee by its weight, and Britain’s commercial vehicle tax', () => {
    // 4,391 lb: band D, $80; a pickup whose maker publishes no weight, none; a car, none.
    expect(caWeightFee(modelById('us-ford-f-series')!)).toBe(80);
    expect(caWeightFee(modelById('us-gmc-sierra')!)).toBe(154);
    expect(caWeightFee(modelById('us-ram-pickup-1500-heavy-duty')!)).toBe(0);
    expect(caWeightFee(modelById('us-toyota-camry')!)).toBe(0);
    // A band's upper weight is in it: 5,000 lb is still D's.
    expect(caWeightFee({ ...modelById('us-ford-f-series')!, kerbKg: 5_000 / 2.20462 })).toBe(80);
    // In California's year, on top of what a car of its price pays.
    const f150 = modelById('us-ford-f-series')!;
    expect(caYear(f150, f150.price) - caYear({ ...f150, body: undefined }, f150.price)).toBe(80_00);
    expect(renewal(held('gb-toyota-hilux', 'GB'), at)).toMatchObject({ amount: 360_00, memo: 'Vehicle tax, the year, a pickup' });
    expect(renewal(held('gb-ford-puma', 'GB'), at).amount).not.toBe(360_00);
  });

  it('carries the bed and sofa on a move, as a van does', () => {
    const sim: Simulation = quickSave({ startLocationId: 'us-ca-losangeles', homeRegionId: 'us-ca-losangeles', livesWhereBorn: true, wealth: 'wealthy' }, 'pickup-move');
    sim.player.documents = [];
    documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer: 'us-ca', name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 10 * YEAR, expiresAt: sim.now + 5 * YEAR });
    sim.must({ kind: 'vehicle.buy', payload: { modelId: 'us-ford-f-series' } });
    expect(vehiclesOf(sim.player)).toHaveLength(1);
    sim.player.furniture = { bed: sim.now, sofa: sim.now };
    carryFurniture(sim, sim.player, 'us-ca-losangeles', 'us-ca-sanfrancisco');
    expect(sim.universe.transactions.some((t) => t.memo === 'Your bed and sofa moved in the Ford F-Series')).toBe(true);
    expect(sim.universe.transactions.some((t) => t.memo.startsWith('Movers'))).toBe(false);
  });
});
