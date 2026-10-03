/**
 * A used car's fault and its inspection (`systems/usedcars.ts`), and a stereo
 * fitted and paid for when the car is lost (`systems/caraudio.ts`), from
 * 2026-10-02.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { documentsOf } from '@/engine/systems/documents';
import { modelById, vehiclesOf, type OwnedVehicle } from '@/engine/systems/vehicles';
import { mayCollide } from '@/engine/systems/carcare';
import { mayBeStolen } from '@/engine/systems/theft';
import { FAULTY_USED, inspectionPrice, usedFault, usedListings } from '@/engine/systems/usedcars';
import { stereoCover, stereoQuote } from '@/engine/systems/caraudio';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const inSave = (sim: Simulation, units: number, from: string) => { const c = Math.round(units * 100); const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
const license = (sim: Simulation, issuer: string) => documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer, name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 3650 * MS_DAY, expiresAt: sim.now + 3650 * MS_DAY });
const bank = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!.balance;

describe('a used car', () => {
  it('has a fault seven times in ten, a new one never', () => {
    const sim = life('us-ny-newyork', 'uc-share');
    let n = 0;
    for (let i = 0; i < 2000; i += 1) if (usedFault(sim, sim.player, 'us-toyota-camry', 1 + (i % 12), 'us-ny-newyork', Date.UTC(2027, 0, 1) + Math.floor(i / 12) * 31 * MS_DAY)) n += 1;
    expect(n / 2000).toBeCloseTo(FAULTY_USED, 1);
    expect(usedFault(sim, sim.player, 'us-toyota-camry', 0, 'us-ny-newyork', sim.now)).toBeUndefined();
    expect(usedFault(sim, sim.player, 'us-tesla-model-y', 5, 'us-ny-newyork', sim.now)).toBeUndefined();
  });

  it('inspected first, at Lemon Squad’s $219.99, reports the fault the car bought that month has', () => {
    let found: Simulation | undefined;
    let age = 0;
    for (let i = 0; i < 40 && !found; i += 1) { const s = life('us-ny-newyork', `uc-insp-${i}`); const l = usedListings(s, s.player, 'us-toyota-camry', 'us-ny-newyork', 'US-NY').find((x) => usedFault(s, s.player, 'us-toyota-camry', x.age, 'us-ny-newyork', s.now)); if (l) { found = s; age = l.age; } }
    const sim = found!;
    license(sim, 'us-ny');
    const before = bank(sim);
    const r = sim.execute<{ fault: boolean; usd?: number }>({ kind: 'vehicle.inspect_used', payload: { modelId: 'us-toyota-camry', age } });
    expect(r.ok, r.error).toBe(true);
    expect(before - bank(sim)).toBe(inspectionPrice(sim, 'US-NY'));
    expect(inspectionPrice(sim, 'US-NY')).toBe(219_99);
    expect(r.value!.fault).toBe(true);
    const b = sim.execute<{ vehicleId: string }>({ kind: 'vehicle.buy', payload: { modelId: 'us-toyota-camry', age } });
    expect(b.ok, b.error).toBe(true);
    const v = vehiclesOf(sim.player).find((x) => x.id === b.value!.vehicleId)!;
    expect(v.fault?.usd).toBe(r.value!.usd);
    expect(sim.execute({ kind: 'vehicle.inspect_used', payload: { modelId: 'us-toyota-camry', age: 0 } }).error).toBe('A new car isn’t inspected before it’s bought.');
  });
});

describe('a stereo', () => {
  it('fitted at Best Buy’s price, paid for to Progressive’s cap when the car is lost; none sold in Canada', () => {
    const sim = life('us-ny-newyork', 'uc-stereo');
    license(sim, 'us-ny');
    const b = sim.execute<{ vehicleId: string }>({ kind: 'vehicle.buy', payload: { modelId: 'us-toyota-camry' } });
    const v = vehiclesOf(sim.player).find((x) => x.id === b.value!.vehicleId)!;
    const q = stereoQuote(sim, v);
    if (typeof q === 'string') throw new Error(q);
    expect(q.price).toBe(inSave(sim, 279.99 + 149.99, 'USD'));
    expect(stereoCover(sim, v, 10_000_00)).toBe(0);
    expect(sim.execute({ kind: 'vehicle.stereo', payload: { vehicleId: v.id } }).ok).toBe(true);
    expect(stereoCover(sim, v, 10_000_00)).toBe(q.price);
    expect(stereoCover(sim, { ...v, coverage: 'liability' } as OwnedVehicle, 10_000_00)).toBe(0);
    expect(stereoQuote(sim, v)).toBe('It has one.');
    // Ireland: the lesser of €650 and 5% of the car's value.
    const ie = { ...v, jurisdiction: 'IE' } as OwnedVehicle;
    expect(stereoCover(sim, ie, 4_000_00)).toBe(200_00);
    expect(stereoQuote(sim, { ...v, stereo: undefined, jurisdiction: 'CA-ON' } as OwnedVehicle)).toBe('No retailer where it’s registered publishes a price for fitting one.');
    // Stolen and not found under full cover, it's paid with the car.
    v.coverage = 'full';
    const stolen = { ...v, id: 'twin' } as OwnedVehicle;
    let before = bank(sim);
    expect(mayBeStolen(sim, sim.player, stolen, modelById(v.modelId)!, 0, 'USD', { stolen: 1, recovered: 0 })).toBe(true);
    expect(bank(sim) - before).toBe(q.price);
    // Written off under full cover, the stereo is paid with the car.
    v.coverage = 'full';
    before = bank(sim);
    expect(mayCollide(sim, sim.player, v, modelById(v.modelId)!, 1, sim.now, 1)).toBe(true);
    expect(bank(sim) - before).toBe(q.price);
  });
});
