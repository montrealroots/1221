/**
 * A washer, dryer or dishwasher by make and model (`content/appliancecatalog.ts`,
 * `applianceModels`, `modelFitCost`, `fittedModel` in `systems/appliances.ts`,
 * `machineUsd` in `systems/dwelling.ts`, from 2026-10-05): fitted at its
 * seller's price with the tax and the country's fitting, kept on the home, and
 * each load billed at its own energy a cycle, the typical machine's where none.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import type { Fixtures } from '@/engine/content/homes';
import { APPLIANCES } from '@/engine/content/appliances';
import { APPLIANCE_PRODUCTS } from '@/engine/content/appliancecatalog';
import { applianceModels, fittedModel, modelFitCost } from '@/engine/systems/appliances';
import { KWH_USD, MACHINE_KWH, machineUsd, livingOf } from '@/engine/systems/dwelling';
import { ownBuilt, type HomeFacts } from '@/engine/systems/homes';

const save = (city: string, name: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, name);
const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
const bare: Fixtures = { bathtub: false, dishwasher: false, laundry: 'none', cooling: 'none', outdoor: 'none', gym: 'none' };
const facts = (type: HomeFacts['type']): HomeFacts => ({ type, address: 'Test Home', beds: 2, baths: 1, size: 1_000, built: 2000, features: [], parts: {}, hoaUsd: 0, fixtures: { ...bare } });

describe('an appliance by make and model', () => {
  it('is fitted at its price with the tax and the country’s fitting, kept on the home, and its loads billed at its own energy', () => {
    const sim = save('us-ny-newyork', 'appl-model');
    sim.universe.accounts[sim.player.primaryAccountId!]!.balance += 100_000_00;
    const home = ownBuilt(sim, sim.player, { cityId: 'us-ny-newyork', facts: facts('house'), price: 400_000_00, closing: 0 });
    const washers = applianceModels(sim, 'us-ny-newyork', 'washer');
    expect(washers.length).toBeGreaterThan(0);
    expect(washers.map((m) => m.price)).toEqual([...washers.map((m) => m.price)].sort((a, b) => a - b));
    const rated = washers.find((m) => typeof m.product.attrs.kwhPerCycle === 'number') ?? washers[0]!;
    const cost = modelFitCost(sim, home, 'washer', rated.offer.id) as number;
    expect(cost).toBe(rated.price + inSave(sim, APPLIANCES.us!.items.washer!.install * 100, APPLIANCES.us!.currency));
    const r = sim.must<{ cost: number }>({ kind: 'home.fit', payload: { homeId: home.id, kind: 'washer', offerId: rated.offer.id } });
    expect(r.cost).toBe(cost);
    expect(fittedModel(home, 'washer')!.id).toBe(rated.product.id);
    // Living in it, its loads bill at its own energy; the dryer, with none fitted, at the typical machine's.
    sim.player.home = { kind: 'owned', cityId: 'us-ny-newyork', since: sim.now, homeId: home.id };
    livingOf(sim.player).loads = { washer: 10, dryer: 4 };
    const kwh = typeof rated.product.attrs.kwhPerCycle === 'number' ? rated.product.attrs.kwhPerCycle : MACHINE_KWH.washer;
    expect(machineUsd(sim.player)).toBeCloseTo((10 * kwh + 4 * MACHINE_KWH.dryer) * KWH_USD, 9);
    // Given out after its life, it goes, its model with it.
    sim.advanceBy(10 * 365.2425 * 86_400_000 + 86_400_000);
    expect(fittedModel(home, 'washer')).toBeUndefined();
  });

  it('is refused as another kind or another country’s, and a machine with no model bills the typical figure', () => {
    const sim = save('us-ny-newyork', 'appl-refuse');
    const home = ownBuilt(sim, sim.player, { cityId: 'us-ny-newyork', facts: facts('house'), price: 400_000_00, closing: 0 });
    const dryer = APPLIANCE_PRODUCTS.find((p) => p.attrs.kind === 'dryer' && p.offers.some((o) => o.market === 'us'))!;
    expect(modelFitCost(sim, home, 'washer', dryer.offers.find((o) => o.market === 'us')!.id)).toBe('That isn’t a washing machine on sale.');
    const abroad = APPLIANCE_PRODUCTS.flatMap((p) => p.attrs.kind === 'washer' ? p.offers : []).find((o) => o.market !== 'us');
    if (abroad) expect(modelFitCost(sim, home, 'washer', abroad.id)).toBe('It’s sold in another country.');
    expect(fittedModel(home, 'washer')).toBeUndefined();
    sim.player.home = { kind: 'owned', cityId: 'us-ny-newyork', since: sim.now, homeId: home.id };
    livingOf(sim.player).loads = { washer: 3, dryer: 3 };
    expect(machineUsd(sim.player)).toBeCloseTo((3 * MACHINE_KWH.washer + 3 * MACHINE_KWH.dryer) * KWH_USD, 9);
  });
});
