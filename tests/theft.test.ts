/**
 * A vehicle stolen (`systems/theft.ts`, from 2026-09-30): each place's
 * published thefts over its vehicles, recovered at the published share, and
 * what full cover and liability cover each pay, a loan still owed.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { modelById, valueOf, vehiclesOf, type OwnedVehicle } from '@/engine/systems/vehicles';
import { mayBeStolen, stolenNow, theftRate } from '@/engine/systems/theft';
import { netWorth } from '@/engine/systems/finance';

const place = (jurisdiction: string, cityId: string) => ({ jurisdiction, cityId }) as Pick<OwnedVehicle, 'jurisdiction' | 'cityId' | 'at'>;
const life = (seed: string) => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);
const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
const buy = (sim: Simulation, payload: Record<string, unknown>) => { const r = sim.execute<{ vehicleId: string }>({ kind: 'vehicle.buy', payload }); expect(r.ok, r.error).toBe(true); return vehiclesOf(sim.player).find((v) => v.id === r.value!.vehicleId)!; };
const steal = (sim: Simulation, v: OwnedVehicle, recovered: number) => { const m = modelById(v.modelId)!; return mayBeStolen(sim, sim.player, v, m, valueOf(v, sim.now), m.currency, { stolen: 1, recovered }); };

describe('the rate', () => {
  it('is the published thefts over the vehicles counted, where both are published', () => {
    expect(theftRate(place('US-NY', 'us-ny-newyork'))).toBeCloseTo(620.2, 1);
    expect(theftRate(place('US-NY', 'us-ny-hudson'))).toBeCloseTo(116.2, 1);
    expect(theftRate(place('US-CA', 'us-ca-losangeles'))).toBe(502);
    expect(theftRate(place('US-CA', 'us-ca-sanfrancisco'))).toBeCloseTo(378.5, 1);
    expect(theftRate(place('CA-ON', 'ca-on-toronto'))).toBeCloseTo(219.5, 1);
    expect(theftRate(place('US-CT', 'us-ct-newhaven'))).toBeUndefined();
  });
});

describe('a theft', () => {
  it('found, gives the vehicle back a month on and pays nothing', () => {
    const sim = life('theft-found');
    const v = buy(sim, { modelId: 'us-toyota-camry' });
    expect(steal(sim, v, 1)).toBe(true);
    expect(stolenNow(v, sim.now)).toBe(true);
    expect(sim.execute({ kind: 'vehicle.sell', payload: { vehicleId: v.id } }).error).toMatch(/stolen/);
    sim.advanceBy(61 * MS_DAY);
    expect(stolenNow(v, sim.now)).toBe(false);
    expect(v.stolen).toBeUndefined();
    expect(v.soldAt).toBeUndefined();
  });

  it('not found, is paid at its value under full cover, the loan first', () => {
    const sim = life('theft-full');
    const v = buy(sim, { modelId: 'us-toyota-camry', financed: true, months: 60 });
    const value = inSave(sim, valueOf(v, sim.now), 'USD');
    const owed = v.loan!.owed;
    const before = sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
    expect(steal(sim, v, 0)).toBe(true);
    const cleared = Math.min(value, owed);
    expect(sim.universe.accounts[sim.player.primaryAccountId!]!.balance - before).toBe(value - cleared);
    if (value >= owed) expect(v.soldAt).toBeDefined();
  });

  it('under full cover with a loan bigger than the car, pays the car and keeps the rest of the loan running', () => {
    const sim = life('theft-underwater');
    const v = buy(sim, { modelId: 'us-toyota-camry' });
    v.loan = { owed: 90_000_00, monthly: 1_000_00, apr: 0, monthsLeft: 90, original: 90_000_00 };
    expect(steal(sim, v, 0)).toBe(true);
    expect(v.soldAt).toBeUndefined();
    const left = v.loan!.owed;
    sim.advanceBy(31 * MS_DAY);
    expect(v.loan!.owed).toBe(left - 1_000_00);
  });

  it('not found under liability cover, pays nothing, and its loan runs on month by month', () => {
    const sim = life('theft-liability');
    sim.player.documents = [{ id: 'lic', kind: 'license', issuer: 'us-ny', name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 365 * MS_DAY, expiresAt: sim.now + 1_000 * MS_DAY, realId: true }];
    const v = buy(sim, { modelId: 'us-toyota-camry', coverage: 'liability' });
    // A loan put on it by hand: the lender asks full cover on one it finances.
    v.loan = { owed: 10_000_00, monthly: 500_00, apr: 0, monthsLeft: 20, original: 10_000_00 };
    const worth = netWorth(sim, sim.player.id).vehicles;
    expect(steal(sim, v, 0)).toBe(true);
    expect(netWorth(sim, sim.player.id).vehicles).toBeLessThan(worth);
    sim.advanceBy(31 * MS_DAY);
    expect(v.loan.owed).toBe(9_500_00);
    expect(sim.universe.transactions.some((t) => t.memo.startsWith('Car insurance, the Toyota Camry') && t.at > v.stolen!.at)).toBe(false);
    expect(v.soldAt).toBeUndefined();
    // Not driven while it’s gone, and off the books once its loan is paid.
    expect(v.km ?? 0).toBe(0);
    v.loan!.monthsLeft = 1;
    sim.advanceBy(31 * MS_DAY);
    expect(v.loan).toBeUndefined();
    expect(v.soldAt).toBeDefined();
  });
});
