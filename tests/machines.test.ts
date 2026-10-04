/**
 * A home's machines by make and model (`systems/machines.ts`, from
 * 2026-10-04): washing machines, dryers and dishwashers sold where the home
 * is, fitted to a home owned at the model's own price and the kept fitting,
 * and the month's bill reading the model's label: a washer's and a dryer's
 * loads at its energy a cycle in place of the usual machine's, a
 * dishwasher's runs at what it takes past the usual labeled one's there.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import type { Fixtures } from '@/engine/content/homes';
import { APPLIANCE_PRODUCTS } from '@/engine/content/appliancecatalog';
import { salesTaxRate } from '@/engine/content/tax';
import { fitCost, fitRefusal, machineModels, machinePrice } from '@/engine/systems/appliances';
import { MACHINES, fittedModel, livingOf, machineUsd } from '@/engine/systems/dwelling';
import { kwhPerCycle, machineName, usualDishwasherKwh, type MachineKind } from '@/engine/systems/machines';
import { DISHWASHER_CYCLES_A_DAY, cheapestToiletry, giveToiletry, keepsCleaning } from '@/engine/systems/hygiene';
import { ownBuilt, type HomeFacts, type OwnedHome } from '@/engine/systems/homes';
import { inTheBank } from '@/engine/systems/household';

const YEAR = 365.2425 * MS_DAY;
const CITY = 'ca-on-toronto';
const MX = 'mx-cmx-mexicocity';
const save = (name: string, city = CITY) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, name);
const bare: Fixtures = { bathtub: false, dishwasher: false, laundry: 'none', cooling: 'none', outdoor: 'none', gym: 'none' };
const facts = (f: Partial<Fixtures> = {}): HomeFacts => ({ type: 'house', address: 'Test Home', beds: 2, baths: 1, size: 1_000, built: 2000, features: [], parts: {}, hoaUsd: 0, fixtures: { ...bare, ...f } });
/** A house of their own, in Toronto unless said, lived in. */
const home = (sim: Simulation, f: Partial<Fixtures> = {}, city = CITY): OwnedHome => {
  const owned = ownBuilt(sim, sim.player, { cityId: city, facts: facts(f), price: 400_000_00, closing: 0 });
  sim.player.home = { kind: 'owned', cityId: city, homeId: owned.id, since: sim.now };
  sim.universe.accounts[sim.player.primaryAccountId!]!.balance += 100_000_00;
  return owned;
};
/** The models of a kind sold there with a label, by their energy a cycle. */
const labeled = (sim: Simulation, kind: MachineKind) => machineModels(sim, CITY, kind).filter((x) => kwhPerCycle(x.product) !== undefined)
  .sort((a, b) => kwhPerCycle(a.product)! - kwhPerCycle(b.product)!);

describe('the catalog', () => {
  it('keeps washers, electric dryers and dishwashers, each once, its offers at a price read, its label with what it is and where', () => {
    expect(APPLIANCE_PRODUCTS.length).toBeGreaterThan(0);
    expect(new Set(APPLIANCE_PRODUCTS.map((p) => p.id)).size).toBe(APPLIANCE_PRODUCTS.length);
    for (const p of APPLIANCE_PRODUCTS) {
      expect(['washer', 'dryer', 'dishwasher']).toContain(p.attrs.kind);
      expect(p.offers.length, p.id).toBeGreaterThan(0);
      const k = kwhPerCycle(p);
      if (k !== undefined) {
        expect(k, p.id).toBeGreaterThan(0.05);
        expect(k, p.id).toBeLessThan(5);
        expect(p.attrs.energyBasis, p.id).toBeTruthy();
        expect(p.attrs.energyUrl, p.id).toMatch(/^https:\/\//);
      }
      for (const o of p.offers) expect(o.taxIncluded, o.id).toBe(!['us', 'ca'].includes(o.market));
    }
  });

  it('sells the models where the home is, cheapest first, with the place’s tax where the price is before it', () => {
    const sim = save('machines-shop');
    const shop = machineModels(sim, CITY);
    expect(shop.length).toBeGreaterThan(1);
    expect(shop.every((x) => x.offer.market === 'ca')).toBe(true);
    for (let i = 1; i < shop.length; i += 1) expect(shop[i]!.price).toBeGreaterThanOrEqual(shop[i - 1]!.price);
    const tax = salesTaxRate(CITY, sim.now, 'goods');
    expect(tax).toBeGreaterThan(0);
    expect(shop[0]!.price).toBe(Math.round(shop[0]!.offer.price * (1 + tax) * 100));
    expect(machineModels(sim, CITY, 'dryer').every((x) => x.product.attrs.kind === 'dryer')).toBe(true);
  });
});

describe('fitting one', () => {
  it('is paid at the model’s price and the kept fitting, and the home keeps the model until it gives out', () => {
    const sim = save('machines-fit');
    const owned = home(sim);
    const { product, offer } = labeled(sim, 'washer')[0]!;
    const cost = fitCost(sim, CITY, 'washer', offer.id)!;
    // Canada's table keeps no fitting: the model's own price with the tax.
    expect(cost).toBe(machinePrice(sim, CITY, offer));
    const before = inTheBank(sim, sim.player);
    sim.must({ kind: 'home.fit', payload: { homeId: owned.id, kind: 'washer', offerId: offer.id } });
    expect(before - inTheBank(sim, sim.player)).toBe(cost);
    expect(owned.models?.washer).toBe(product.id);
    expect(owned.facts.fixtures!.laundry).toBe('washer-only');
    expect(fittedModel(sim.player, 'washer')?.id).toBe(product.id);
    expect(fitRefusal(sim, sim.player, owned, 'washer', offer.id)).toBe('It has one.');
    expect(sim.universe.transactions.some((t) => t.memo?.startsWith(machineName(product, offer)))).toBe(true);
    // Ten years on it gives out, and the model with it.
    sim.advanceBy(10 * YEAR + MS_DAY);
    expect(owned.facts.fixtures!.laundry).toBe('none');
    expect(owned.models?.washer).toBeUndefined();
  });

  it('adds the fitting the country’s table keeps: America’s $100 to hook up a washer', () => {
    const ny = save('machines-us', 'us-ny-newyork');
    const washer = machineModels(ny, 'us-ny-newyork', 'washer')[0]!;
    expect(fitCost(ny, 'us-ny-newyork', 'washer', washer.offer.id)).toBe(machinePrice(ny, 'us-ny-newyork', washer.offer) + 100_00);
  });

  it('is plugged in by the buyer where no fitting is kept: a dryer in Mexico, whose table prices none', () => {
    const sim = save('machines-mx', MX);
    const owned = home(sim, { laundry: 'washer-only' }, MX);
    expect(fitRefusal(sim, sim.player, owned, 'dryer')).toMatch(/No one publishes a price/);
    const dryer = machineModels(sim, MX, 'dryer')[0]!;
    expect(fitCost(sim, MX, 'dryer', dryer.offer.id)).toBe(machinePrice(sim, MX, dryer.offer));
    expect(fitRefusal(sim, sim.player, owned, 'dryer', dryer.offer.id)).toBeUndefined();
  });

  it('is refused for another kind’s model, another country’s, or one not on sale', () => {
    const sim = save('machines-refuse');
    const owned = home(sim);
    const washer = machineModels(sim, CITY, 'washer')[0]!;
    expect(fitRefusal(sim, sim.player, owned, 'dryer', washer.offer.id)).toBe('That isn’t on sale.');
    expect(fitRefusal(sim, sim.player, owned, 'washer', 'no-such-machine')).toBe('That isn’t on sale.');
    const abroad = APPLIANCE_PRODUCTS.flatMap((p) => p.offers.filter((o) => o.market !== 'ca').map((o) => ({ p, o })))[0]!;
    expect(fitRefusal(sim, sim.player, owned, abroad.p.attrs.kind as MachineKind, abroad.o.id)).toBe('It’s sold in another country.');
  });
});

describe('the month’s bill', () => {
  it('bills a washer’s and a dryer’s loads at the model’s label in place of the usual machine’s', () => {
    const sim = save('machines-loads');
    const owned = home(sim);
    livingOf(sim.player).loads = { washer: 6, dryer: 4 };
    expect(machineUsd(sim.player)).toBeCloseTo(6 * MACHINES.washerUsd + 4 * MACHINES.dryerUsd, 9);
    const washer = labeled(sim, 'washer')[0]!;
    const dryer = labeled(sim, 'dryer').at(-1)!;
    sim.must({ kind: 'home.fit', payload: { homeId: owned.id, kind: 'washer', offerId: washer.offer.id } });
    sim.must({ kind: 'home.fit', payload: { homeId: owned.id, kind: 'dryer', offerId: dryer.offer.id } });
    expect(machineUsd(sim.player)).toBeCloseTo(6 * kwhPerCycle(washer.product)! * MACHINES.usdKwh + 4 * kwhPerCycle(dryer.product)! * MACHINES.usdKwh, 9);
    // A labeled washer uses far less than the usual machine, which heats its own hot water.
    expect(kwhPerCycle(washer.product)! * MACHINES.usdKwh).toBeLessThan(MACHINES.washerUsd);
  });

  it('bills a dishwasher’s runs at what it takes past the usual labeled one’s there, and nothing for one with no model', () => {
    const sim = save('machines-dish');
    const owned = home(sim);
    const usual = usualDishwasherKwh('ca')!;
    // The usual one is the middle of the labeled ones sold there: Canada's own, each model once.
    const here = [...new Map(labeled(sim, 'dishwasher').map((x) => [x.product.id, kwhPerCycle(x.product)!])).values()].sort((a, b) => a - b);
    expect(usual).toBe(here[here.length >> 1]);
    // Britain's, on the EU's label for the eco program, isn't Canada's, on the DOE's test: each is measured against its own.
    expect(usualDishwasherKwh('uk')!).toBeLessThan(usual);
    const frugal = labeled(sim, 'dishwasher')[0]!;
    expect(kwhPerCycle(frugal.product)!).toBeLessThan(usual);
    livingOf(sim.player).loads = { washer: 0, dryer: 0, dishwasher: 15 };
    expect(machineUsd(sim.player)).toBe(0);
    sim.must({ kind: 'home.fit', payload: { homeId: owned.id, kind: 'dishwasher', offerId: frugal.offer.id } });
    expect(machineUsd(sim.player)).toBeCloseTo(15 * (kwhPerCycle(frugal.product)! - usual) * MACHINES.usdKwh, 9);
    expect(machineUsd(sim.player)).toBeLessThan(0);
  });

  it('counts a dishwasher’s runs a day at a time, as its tablets are, and none without them', () => {
    const sim = save('machines-runs');
    home(sim, { dishwasher: true });
    // Their supplies are counted, and there are no tablets yet: the dishes are done by hand.
    expect(keepsCleaning(sim.player)).toBe(true);
    const runs = () => sim.player.living?.loads?.dishwasher ?? 0;
    sim.advanceBy(MS_DAY);
    expect(runs()).toBe(0);
    giveToiletry(sim, sim.player, cheapestToiletry(sim, CITY, 'dishwasher-detergent', false)!);
    sim.advanceBy(MS_DAY);
    expect(runs()).toBeCloseTo(DISHWASHER_CYCLES_A_DAY, 9);
  });
});
