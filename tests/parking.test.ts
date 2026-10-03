/**
 * Where a car is kept, in England and Wales (`systems/theft.ts`, from
 * 2026-10-03): the Crime Survey's thefts of and from vehicles set against
 * the National Travel Survey's share of cars kept off the street and on it,
 * and a car broken into losing its stereo.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { documentsOf } from '@/engine/systems/documents';
import { modelById, vehiclesOf, type OwnedVehicle } from '@/engine/systems/vehicles';
import { englandRate, keptIn, mayBeBrokenInto, theftRate } from '@/engine/systems/theft';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const held = (city: string, extra: Partial<OwnedVehicle> = {}) => ({ id: 'c', modelId: 'gb-ford-puma', jurisdiction: 'GB', cityId: city, coverage: 'full', boughtAt: 0, ageAtPurchase: 0, listPrice: 2_000_000, registrationDue: 0, ...extra }) as OwnedVehicle;

describe('where a car is kept', () => {
  it('sets its odds in England and Wales: a street car broken into more than twice as often', () => {
    expect(englandRate('of', 'garage') / 100).toBeCloseTo(3.42 * ((1 - 0.509 - 0.161) + 0.509 / 0.724), 6);
    expect(englandRate('of', 'street') / 100).toBeCloseTo(3.42 * ((1 - 0.509 - 0.161) + 0.161 / 0.246), 6);
    expect(englandRate('from', 'street') / englandRate('from', 'garage')).toBeGreaterThan(2);
    const p = life('uk-eng-london', 'park-ldn').player;
    expect(theftRate(held('uk-eng-london', { keptIn: 'street' }), modelById('gb-ford-puma'), p)).toBe(englandRate('of', 'street'));
    expect(theftRate(held('uk-eng-london', { keptIn: 'garage' }), modelById('gb-ford-puma'), p)).toBe(englandRate('of', 'garage'));
    // Scotland isn't the survey's.
    expect(theftRate(held('uk-sct-edinburgh'), modelById('gb-ford-puma'), p)).toBeUndefined();
    // A renter keeps it on the street; a garage is chosen only where the home has one.
    expect(keptIn(p, {})).toBe('street');
  });

  it('is chosen, and a car broken into loses its stereo, paid under full cover', () => {
    const sim = life('uk-eng-london', 'park-break');
    documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer: 'uk', name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 3650 * MS_DAY, expiresAt: sim.now + 3650 * MS_DAY });
    const r = sim.must<{ vehicleId: string }>({ kind: 'vehicle.buy', payload: { modelId: 'gb-ford-puma' } });
    const v = vehiclesOf(sim.player).find((x) => x.id === r.vehicleId)!;
    expect(sim.execute({ kind: 'vehicle.keep_in', payload: { vehicleId: v.id, where: 'garage' } }).error).toBe('Your home has no garage.');
    expect(sim.must<{ keptIn: string }>({ kind: 'vehicle.keep_in', payload: { vehicleId: v.id, where: 'street' } }).keptIn).toBe('street');
    const m = modelById(v.modelId)!;
    // Nothing fitted, nothing to take.
    expect(mayBeBrokenInto(sim, sim.player, v, m, v.listPrice, m.currency, 1)).toBe(false);
    v.stereo = true as never;
    const bank = sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
    expect(mayBeBrokenInto(sim, sim.player, v, m, v.listPrice, m.currency, 1)).toBe(true);
    expect(v.stereo).toBeUndefined();
    expect(sim.universe.accounts[sim.player.primaryAccountId!]!.balance).toBeGreaterThan(bank);
    // A car in New York isn't drawn here.
    expect(mayBeBrokenInto(sim, sim.player, { ...v, cityId: 'us-ny-newyork', stereo: true } as never, m, 0, 'USD', 1)).toBe(false);
  });
});
