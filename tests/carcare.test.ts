/**
 * A car's warranty, its servicing and its collisions (`systems/carcare.ts`,
 * `content/carcare.ts`, from 2026-10-01).
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, instantFromZoned } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { documentsOf } from '@/engine/systems/documents';
import { modelById, valueOf, vehiclesOf, type OwnedVehicle } from '@/engine/systems/vehicles';
import { inWarranty, intervalOf, mayCollide, odometer, repairShare, serviceCost, serviceDue, serviceMonth, serviceRefusal, servicingKept } from '@/engine/systems/carcare';

const YEAR = 365.2425 * MS_DAY;
const MI = 1.609344;
const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const inSave = (sim: Simulation, units: number, from: string) => { const c = Math.round(units * 100); const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
const car = (sim: Simulation, modelId: string, issuer: string, age = 0) => {
  documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer, name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 3650 * MS_DAY, expiresAt: sim.now + 3650 * MS_DAY });
  const r = sim.execute<{ vehicleId: string }>({ kind: 'vehicle.buy', payload: { modelId, ...(age ? { age } : {}) } });
  expect(r.ok, r.error).toBe(true);
  return vehiclesOf(sim.player).find((v) => v.id === r.value!.vehicleId)!;
};
const as = (v: OwnedVehicle, patch: Partial<OwnedVehicle>): OwnedVehicle => ({ ...v, ...patch });

describe('servicing', () => {
  it('comes due by the maker’s interval, from buying or the last service', () => {
    const sim = life('us-ny-newyork', 'cc-due');
    const v = car(sim, 'us-toyota-camry', 'us-ny');
    const m = modelById(v.modelId)!;
    expect(intervalOf(v, m)).toEqual({ months: 12, km: 10_000 * MI });
    expect(intervalOf(as(v, { jurisdiction: 'MX-CMX' }), m)).toEqual({ months: 6, km: 10_000 });
    expect(intervalOf(v, modelById('us-tesla-model-y')!)).toBeUndefined();
    const due = serviceDue(v, m)!;
    expect(due.at - v.boughtAt).toBeCloseTo(YEAR, -3);
    expect(servicingKept(v, m, due.at + 29 * MS_DAY)).toBe(true);
    expect(servicingKept(v, m, due.at + 31 * MS_DAY)).toBe(false);
    expect(servicingKept(as(v, { km: 10_000 * MI + 1_001 }), m, sim.now)).toBe(false);
    // Missed once, missed for good.
    serviceMonth(v, m, due.at + 31 * MS_DAY);
    v.services = [{ at: due.at + 40 * MS_DAY, km: odometer(v), shopId: 'midas-w53' }];
    expect(servicingKept(v, m, due.at + 41 * MS_DAY)).toBe(false);
  });

  it('is booked at a garage in its town at the market’s posted price, a few hours in the shop', () => {
    const sim = life('us-ny-newyork', 'cc-book');
    const v = car(sim, 'us-chevrolet-equinox', 'us-ny');
    const m = modelById(v.modelId)!;
    sim.advanceTo(instantFromZoned({ year: 2026, month: 1, day: 13, hour: 11, minute: 0 }, 'America/New_York'));
    expect(serviceRefusal(sim.player, v, m, 'toyota-of-manhattan', sim.now)).toBe('Toyota of Manhattan services only a Toyota.');
    expect(serviceCost(sim, v)).toBe(inSave(sim, 109, 'USD'));
    const r = sim.execute<{ paid: number; readyAt: number }>({ kind: 'vehicle.service', payload: { vehicleId: v.id, shopId: 'midas-w53' } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.readyAt - sim.now).toBe(15 * 60_000);
    expect(v.services).toHaveLength(1);
    expect(serviceDue(v, m)!.at - sim.now).toBeCloseTo(YEAR, -3);
  });

  it('kept or not, decides a British car’s worth', () => {
    const sim = life('uk-eng-london', 'cc-gb');
    const v = car(sim, 'gb-vauxhall-corsa', 'uk');
    const later = serviceDue(v, modelById(v.modelId)!)!.at + 60 * MS_DAY;
    const kept = valueOf(as(v, { services: [{ at: later - MS_DAY, km: 0, shopId: 'x' }] }), later);
    const not = valueOf(v, later);
    expect(Math.abs(not - kept * 0.9)).toBeLessThanOrEqual(1);
  });
});

describe('the warranty', () => {
  it('covers a fault within its years and distance from new, while servicing is kept, at a dealer of the make', () => {
    const sim = life('us-ny-newyork', 'cc-warranty');
    const v = car(sim, 'us-toyota-camry', 'us-ny');
    const m = modelById(v.modelId)!;
    expect(inWarranty(v, m, sim.now)).toBe(true);
    expect(inWarranty(as(v, { ageAtPurchase: 3.1 }), m, sim.now)).toBe(false);
    expect(inWarranty(as(v, { km: 36_001 * MI, services: [{ at: sim.now, km: 36_000 * MI, shopId: 'midas-w53' }] }), m, sim.now)).toBe(false);
    expect(inWarranty(as(v, { serviceMissed: sim.now }), m, sim.now)).toBe(false);
    v.fault = { at: sim.now, severe: false, usd: 554.01 };
    expect(repairShare(sim, v, m, 'Toyota', 55_401, sim.now)).toEqual({ yours: 0, why: 'under the maker’s warranty' });
    expect(repairShare(sim, v, m, undefined, 55_401, sim.now)).toEqual({ yours: 55_401 });
  });
});

describe('a collision', () => {
  it('damages the car to the place’s average claim; full cover pays over the deductible, liability nothing', () => {
    const sim = life('us-ny-newyork', 'cc-crash');
    const v = car(sim, 'us-toyota-camry', 'us-ny');
    const m = modelById(v.modelId)!;
    expect(mayCollide(sim, sim.player, v, m, 30_000_00, sim.now, 0)).toBe(false);
    expect(mayCollide(sim, sim.player, v, m, 30_000_00, sim.now, 1)).toBe(true);
    expect(v.fault).toMatchObject({ severe: true, usd: 5_489, collision: true });
    // Off the road until repaired, it meets no other car.
    expect(mayCollide(sim, sim.player, v, m, 30_000_00, sim.now + MS_DAY, 1)).toBe(false);
    const bill = inSave(sim, 5_489, 'USD');
    expect(repairShare(sim, v, m, 'Toyota', bill, sim.now).yours).toBe(inSave(sim, 500, 'USD'));
    expect(repairShare(sim, v, m, 'Toyota', 300_00, sim.now).yours).toBe(300_00);
    v.coverage = 'liability';
    expect(repairShare(sim, v, m, 'Toyota', bill, sim.now).yours).toBe(bill);
  });

  it('beyond what the car is worth writes it off, full cover paying its value less the deductible', () => {
    const sim = life('us-ny-newyork', 'cc-writeoff');
    const v = car(sim, 'us-toyota-camry', 'us-ny');
    const value = 4_000_00;
    const before = sim.universe.transactions.length;
    expect(mayCollide(sim, sim.player, v, modelById(v.modelId)!, value, sim.now, 1)).toBe(true);
    expect(v.soldAt).toBe(sim.now);
    const paid = sim.universe.transactions.slice(before).find((t) => /written off/.test(t.memo))!;
    expect(paid.postings.find((q) => q.amount > 0)!.amount).toBe(value - inSave(sim, 500, 'USD'));
  });
});

describe('cover changed in Britain', () => {
  it('costs the insurer’s fee', () => {
    const sim = life('uk-eng-london', 'cc-fee');
    const v = car(sim, 'gb-vauxhall-corsa', 'uk');
    // Britain sells full cover only; a car on liability came from elsewhere.
    v.coverage = 'liability';
    const before = sim.universe.transactions.length;
    const r = sim.execute({ kind: 'vehicle.coverage', payload: { vehicleId: v.id, coverage: 'full' } });
    expect(r.ok, r.error).toBe(true);
    const fee = sim.universe.transactions.slice(before).find((t) => t.memo === 'The insurer’s fee to change cover')!;
    expect(fee.postings.find((q) => q.amount > 0)!.amount).toBe(inSave(sim, 53.25, 'GBP'));
  });
});
