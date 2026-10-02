/**
 * A car's declared modifications (`systems/mods.ts`, from 2026-09-30):
 * Britain's measured loadings on the premium, tint 12.1% and a respray 4.52%,
 * the respray sold where its effect is published, and none elsewhere.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { documentsOf } from '@/engine/systems/documents';
import { MOD_LOADING, MOD_PRICE, modLoading, modRefusal } from '@/engine/systems/mods';
import { vehiclesOf, type OwnedVehicle } from '@/engine/systems/vehicles';

const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };

function withCar(city: string, seed: string, modelId: string): { sim: Simulation; v: OwnedVehicle } {
  const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer: 'x', name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 3650 * MS_DAY, expiresAt: sim.now + 3650 * MS_DAY });
  const r = sim.execute({ kind: 'vehicle.buy', payload: { modelId } });
  if (!r.ok) throw new Error(r.error);
  return { sim, v: vehiclesOf(sim.player)[0]! };
}
const premiums = (sim: Simulation) => sim.universe.transactions.filter((t) => t.memo.startsWith('Car insurance')).map((t) => t.postings.filter((p) => p.amount > 0).reduce((a, p) => a + p.amount, 0));

describe('modifications, declared', () => {
  it('raise a British car’s premium by the measured loading: tint 12.1%, a respray 4.52%', () => {
    const { sim, v } = withCar('uk-eng-london', 'mods-gb', 'gb-ford-puma');
    sim.advanceBy(31 * MS_DAY);
    const before = premiums(sim).at(-1)!;
    expect(sim.execute({ kind: 'vehicle.tint', payload: { vehicleId: v.id, kind: 'rear' } }).ok).toBe(true);
    expect(modLoading(v)).toBeCloseTo(1 + MOD_LOADING.tint, 12);
    sim.advanceBy(31 * MS_DAY);
    expect(Math.abs(premiums(sim).at(-1)! - Math.round(before * 1.121))).toBeLessThanOrEqual(1);
    const r = sim.execute<{ paid: number }>({ kind: 'vehicle.modify', payload: { vehicleId: v.id, mod: 'respray' } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.paid).toBe(inSave(sim, 3_000_00, 'GBP'));
    expect(modLoading(v)).toBeCloseTo(1.121 * 1.0452, 12);
    expect(modRefusal(v, 'respray', true)).toMatch(/has one/);
    // A remap, 15.93%, at VUDU's £449; wheels, 0.79%, at LK Performance's £332.
    expect(sim.execute<{ paid: number }>({ kind: 'vehicle.modify', payload: { vehicleId: v.id, mod: 'remap' } }).value!.paid).toBe(inSave(sim, 449_00, 'GBP'));
    expect(sim.execute({ kind: 'vehicle.modify', payload: { vehicleId: v.id, mod: 'wheels' } }).ok).toBe(true);
    expect(modLoading(v)).toBeCloseTo(1.121 * 1.0452 * 1.1593 * 1.0079, 12);
    expect(MOD_PRICE.exhaust).toBeCloseTo((1_038.46 + 1_426.34) / 2, 6);
  });

  it('change nothing outside Britain, where no loading is published, and no respray is sold there', () => {
    const { sim, v } = withCar('us-ct-newhaven', 'mods-ct', 'us-honda-cr-v');
    expect(sim.execute({ kind: 'vehicle.tint', payload: { vehicleId: v.id, kind: 'full' } }).ok).toBe(true);
    expect(modLoading(v)).toBe(1);
    expect(modRefusal(v, 'remap', true)).toMatch(/in Britain/);
    // A leased car is the lender's.
    const gb = withCar('uk-eng-london', 'mods-lease', 'gb-ford-puma');
    const l = gb.sim.execute<{ vehicleId: string }>({ kind: 'vehicle.lease', payload: { modelId: 'gb-nissan-qashqai', months: 37 } });
    expect(l.ok, l.error).toBe(true);
    expect(modRefusal(vehiclesOf(gb.sim.player).find((x) => x.id === l.value!.vehicleId), 'remap', true)).toMatch(/lender’s/);
  });
});
