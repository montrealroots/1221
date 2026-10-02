/**
 * Window tint (`systems/tint.ts`, from 2026-09-30): a named shop's price for
 * what it sells where the car is, the law deciding whether it's legal; illegal
 * tint failing New York's inspection and Ireland's NCT, a roadside ticket's
 * fine and removal; and the little fuel a cooler cabin saves.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { documentsOf } from '@/engine/systems/documents';
import { TINT_FUEL_SAVING, TINT_TICKETS_A_YEAR, illegalTint, tintAtInspection, tintOnTheRoad, tintRefusal } from '@/engine/systems/tint';
import { glazed, runningCost, vehiclesOf, type OwnedVehicle } from '@/engine/systems/vehicles';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
const paid = (sim: Simulation, memo: RegExp) => sim.universe.transactions.filter((t) => memo.test(t.memo)).reduce((a, t) => a + t.postings.filter((p) => p.amount > 0).reduce((b, p) => b + p.amount, 0), 0);

function withCar(city: string, seed: string, modelId: string): { sim: Simulation; v: OwnedVehicle } {
  const sim = life(city, seed);
  documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer: 'x', name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 3650 * MS_DAY, expiresAt: sim.now + 3650 * MS_DAY });
  const r = sim.execute({ kind: 'vehicle.buy', payload: { modelId } });
  if (!r.ok) throw new Error(r.error);
  return { sim, v: vehiclesOf(sim.player)[0]! };
}
const tint = (sim: Simulation, v: OwnedVehicle, kind: string) => sim.execute<{ paid: number; legal: boolean }>({ kind: 'vehicle.tint', payload: { vehicleId: v.id, kind } });

describe('tint', () => {
  it('is sold at a named shop’s price, legal or not by the place’s law', () => {
    const ny = withCar('us-ny-newyork', 'tint-ny', 'us-honda-cr-v');
    const r = tint(ny.sim, ny.v, 'full');
    expect(r.ok, r.error).toBe(true);
    expect(r.value).toEqual({ paid: inSave(ny.sim, 250_00, 'USD'), legal: false });
    expect(illegalTint(ny.v)).toBe(true);
    expect(tint(ny.sim, ny.v, 'full').error).toMatch(/tinted/);
    const ct = withCar('us-ct-newhaven', 'tint-ct', 'us-honda-cr-v');
    expect(tint(ct.sim, ct.v, 'full').value!.legal).toBe(true);
    const bc = withCar('ca-bc-vancouver', 'tint-bc', 'ca-honda-cr-v');
    expect(tint(bc.sim, bc.v, 'full').error).toMatch(/only behind the driver/);
    expect(tint(bc.sim, bc.v, 'rear').value!.legal).toBe(true);
    // A motorcycle has no windows to tint.
    const bike = { ...ny.v, id: 'bike', modelId: 'us-kawasaki-ninja-500', tint: undefined };
    expect(glazed(bike)).toBe(false);
    expect(tintRefusal(bike, 'full', glazed(bike))).toMatch(/no windows/);
  });

  it('saves a little fuel', () => {
    const { sim, v } = withCar('us-ct-newhaven', 'tint-fuel', 'us-honda-cr-v');
    const before = runningCost(sim, v, 1_000);
    expect(tint(sim, v, 'full').ok).toBe(true);
    expect(TINT_FUEL_SAVING).toBeCloseTo(0.061 * 0.26 * (1.8 / 7.1), 12);
    expect(runningCost(sim, v, 1_000)).toBeLessThan(before);
  });

  it('is ticketed on the road with its fine, and taken off where a removal is priced', () => {
    expect(TINT_TICKETS_A_YEAR).toBeCloseTo(119_808 / 9_277_782, 12);
    const ny = withCar('us-ny-newyork', 'tint-ticket', 'us-honda-cr-v');
    tint(ny.sim, ny.v, 'full');
    expect(tintOnTheRoad(ny.sim, ny.sim.player, ny.v, ny.sim.now, 1)).toBe(true);
    expect(paid(ny.sim, /A ticket for window tint/)).toBe(inSave(ny.sim, 150_00, 'USD'));
    expect(paid(ny.sim, /Tint taken off, as the ticket ordered/)).toBe(inSave(ny.sim, 170_00, 'USD'));
    expect(ny.v.tint).toBeUndefined();
    // Britain's removal is priced at the nearest read, a Wexford shop's €200.
    const gb = withCar('uk-eng-london', 'tint-gb', 'gb-ford-puma');
    tint(gb.sim, gb.v, 'full');
    expect(tintOnTheRoad(gb.sim, gb.sim.player, gb.v, gb.sim.now, 1)).toBe(true);
    expect(paid(gb.sim, /Tint taken off, as the ticket ordered/)).toBe(inSave(gb.sim, 200_00, 'EUR'));
    // Legal tint isn't ticketed.
    const ct = withCar('us-ct-newhaven', 'tint-legal', 'us-honda-cr-v');
    tint(ct.sim, ct.v, 'full');
    expect(tintOnTheRoad(ct.sim, ct.sim.player, ct.v, ct.sim.now, 1)).toBe(false);
    // Mexico City's removal wasn't priced: the fine, and the tint stays.
    const mx = withCar('mx-cmx-mexicocity', 'tint-mx', 'mx-nissan-versa');
    tint(mx.sim, mx.v, 'full');
    expect(tintOnTheRoad(mx.sim, mx.sim.player, mx.v, mx.sim.now, 1)).toBe(true);
    expect(paid(mx.sim, /A ticket for window tint/)).toBe(inSave(mx.sim, 2_346_20, 'MXN'));
    expect(mx.v.tint).toBe('full');
  });

  it('fails Ireland’s NCT dark, the tint off and the retest paid, and passes legal tint', () => {
    const ie = withCar('ie-lei-dublin', 'tint-nct', 'ie-skoda-octavia');
    tint(ie.sim, ie.v, 'full');
    expect(tintAtInspection(ie.sim, ie.sim.player, ie.v)).toBe(true);
    expect(paid(ie.sim, /Tint taken off after a failed inspection/)).toBe(inSave(ie.sim, 200_00, 'EUR'));
    expect(paid(ie.sim, /The inspection’s retest/)).toBe(inSave(ie.sim, 40_00, 'EUR'));
    const legal = withCar('ie-lei-dublin', 'tint-nct-rear', 'ie-skoda-octavia');
    tint(legal.sim, legal.v, 'rear');
    expect(tintAtInspection(legal.sim, legal.sim.player, legal.v)).toBe(false);
    expect(legal.v.tint).toBe('rear');
  });

  it('comes off at New York’s yearly inspection, driven through the year', () => {
    const { sim, v } = withCar('us-ny-newyork', 'tint-year', 'us-honda-cr-v');
    tint(sim, v, 'full');
    sim.advanceBy(400 * MS_DAY);
    expect(v.tint).toBeUndefined();
    expect(sim.universe.transactions.some((t) => /^Tint taken off/.test(t.memo))).toBe(true);
  });
});
