/**
 * A car wrapped in film, and its cover changed (`systems/wraps.ts`, from
 * 2026-10-01): a named shop's posted price, its days in the shop, Britain's
 * loading for it, and full cover kept while a lender is owed.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { documentsOf } from '@/engine/systems/documents';
import { modelById, vehiclesOf } from '@/engine/systems/vehicles';
import { modLoading } from '@/engine/systems/mods';
import { laidUp } from '@/engine/systems/repairs';
import { coverRefusal, wrapCost, wrapRefusal, wrapShopById } from '@/engine/systems/wraps';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const inSave = (sim: Simulation, units: number, from: string) => { const c = Math.round(units * 100); const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
const car = (sim: Simulation, modelId: string, issuer: string, financed = false) => {
  documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer, name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 3650 * MS_DAY, expiresAt: sim.now + 3650 * MS_DAY });
  const r = sim.execute<{ vehicleId: string }>({ kind: 'vehicle.buy', payload: { modelId, ...(financed ? { financed: true } : {}) } });
  expect(r.ok, r.error).toBe(true);
  return vehiclesOf(sim.player).find((v) => v.id === r.value!.vehicleId)!;
};

describe('a wrap', () => {
  it('is a named shop’s posted price, keeps the car its days, and Britain’s insurers load it as a respray', () => {
    const sim = life('uk-eng-london', 'wr-ldn');
    const v = car(sim, 'gb-vauxhall-corsa', 'uk');
    const shop = wrapShopById('prestige-tint')!;
    expect(wrapCost(sim, shop, modelById(v.modelId)!)).toBe(inSave(sim, 2_400, 'GBP'));
    expect(wrapRefusal(sim.player, v, shop.id, 'Teal', 'gloss', sim.now)).toMatch(/color/);
    expect(wrapRefusal(sim.player, v, shop.id, 'Red', 'chrome', sim.now)).toMatch(/gloss, satin or matte/);
    sim.player.currentLocationId = 'ie-lei-dublin';
    expect(wrapRefusal(sim.player, v, shop.id, 'Red', 'matte', sim.now)).toBe('You’re not in the shop’s town.');
    sim.player.currentLocationId = 'uk-eng-london';
    const before = modLoading(v);
    const r = sim.execute<{ paid: number; readyAt: number }>({ kind: 'vehicle.wrap', payload: { vehicleId: v.id, shopId: shop.id, color: 'Red', finish: 'matte' } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.readyAt - sim.now).toBe(7 * MS_DAY);
    expect(laidUp(v, sim.now)).toMatch(/Prestige Tint/);
    expect(modLoading(v)).toBeCloseTo(before * 1.0452, 10);
    expect(wrapRefusal(sim.player, v, shop.id, 'Blue', 'gloss', sim.now)).toBe('It’s in a shop already.');
  });

  it('in Mexico City is priced by the car’s length, and isn’t sold where no shop posts a price', () => {
    const mx = life('mx-cmx-mexicocity', 'wr-mx');
    const shop = wrapShopById('los-deslumbrantes')!;
    expect(wrapCost(mx, shop, modelById('mx-nissan-versa')!)).toBe(inSave(mx, 29_500, 'MXN'));
    expect(wrapCost(mx, shop, modelById('mx-nissan-np300')!)).toBe(inSave(mx, 34_000, 'MXN'));
    const ny = life('us-ny-newyork', 'wr-ny');
    const v = car(ny, 'us-toyota-camry', 'us-ny');
    expect(wrapRefusal(ny.player, v, 'london-tint-studio', 'Red', 'gloss', ny.now)).toBe('The car isn’t in the shop’s town.');
  });
});

describe('cover', () => {
  it('changes after buying, but stays full while a lender is owed', () => {
    const sim = life('us-ny-newyork', 'wr-cover');
    const v = car(sim, 'us-toyota-camry', 'us-ny');
    expect(v.coverage).toBe('full');
    expect(sim.execute({ kind: 'vehicle.coverage', payload: { vehicleId: v.id, coverage: 'liability' } }).ok).toBe(true);
    expect(v.coverage).toBe('liability');
    expect(coverRefusal(v, 'liability', true)).toBe('It has that cover already.');
    const owed = { ...v, coverage: 'full' as const, loan: { owed: 1, monthly: 1, apr: 0.05, monthsLeft: 1 } };
    expect(coverRefusal(owed, 'liability', true)).toMatch(/lender requires full cover/);
    expect(coverRefusal({ ...v, coverage: 'full' }, 'liability', false)).toMatch(/isn’t offered/);
  });
});
