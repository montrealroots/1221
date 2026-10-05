/**
 * Other makers' furniture beside IKEA's (`content/furniturecatalog.ts` from
 * `docs/research/catalog/furniture-*.json`, `systems/furnishings.ts`, from
 * 2026-10-05): sold where they live at the regular price, with the
 * retailer's own delivery fee; built, unless its maker sends it flat-packed;
 * its seats counted for guests, a sofa's from its width where its maker
 * names none; never IKEA's assembly service nor its buyback.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { FURNITURE_CATALOG } from '@/engine/content/furniturecatalog';
import { inSaveMoney } from '@/engine/systems/banking';
import { assemblyFee, buybackRefusal, piecePrice, piecesCatalog, seatsAtHome } from '@/engine/systems/furnishings';
import { itemsOf } from '@/engine/systems/items';
import { moveIntoOwned, ownBuilt, type HomeFacts } from '@/engine/systems/homes';
import type { Fixtures } from '@/engine/content/homes';

const life = (city: string, seed: string): Simulation => {
  const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  const facts: HomeFacts = { type: 'house', address: 'Test Home', beds: 3, baths: 2, size: 2_400, built: 2000, features: [], parts: {}, hoaUsd: 0, fixtures: { bathtub: true, dishwasher: true, laundry: 'in-unit', cooling: 'central', outdoor: 'yard', gym: 'none' } as Fixtures, lot: 12_000 } as HomeFacts;
  moveIntoOwned(sim, sim.player, ownBuilt(sim, sim.player, { cityId: city, facts, price: 900_000_00, closing: 0 }));
  sim.player.currentLocationId = city;
  return sim;
};
const others = FURNITURE_CATALOG.filter((p) => p.brand !== 'IKEA');

describe('other makers’ furniture', () => {
  it('is sold beside IKEA’s from many makers, each at its retailer’s delivery fee', () => {
    expect(new Set(others.map((p) => p.brand)).size).toBeGreaterThanOrEqual(40);
    expect(others.every((p) => typeof p.delivery === 'number' && p.cm[0]! > 0 && p.cm[1]! > 0)).toBe(true);
    const sim = life('us-ny-newyork', 'furn-price');
    const p = others.find((x) => x.country === 'us' && x.delivery! > 0)!;
    const tax = piecePrice(sim, 'us-ny-newyork', { ...p, delivery: 0 });
    expect(piecePrice(sim, 'us-ny-newyork', p) - tax).toBe(inSaveMoney(sim, p.delivery! * 100, p.currency));
    expect(piecesCatalog(sim, sim.player).some((e) => e.value.brand === p.brand && e.facets?.brand === p.brand)).toBe(true);
  });

  it('comes built where its maker sends it so, seating guests at once, and isn’t IKEA’s to put together or take back', () => {
    const sim = life('uk-eng-london', 'furn-built');
    const sofa = others.find((x) => x.country === 'uk' && x.kind === 'sofa' && !x.flatPack && x.seats)!;
    expect(assemblyFee(sim, sofa, 1)).toBeUndefined();
    const before = seatsAtHome(sim.player).seats;
    sim.must({ kind: 'home.buy_piece', payload: { pieceId: sofa.id, quantity: 1 } });
    const item = itemsOf(sim.player).find((i) => i.kind === `furn:${sofa.id}`)!;
    expect(item.flatPacked).toBeUndefined();
    expect(seatsAtHome(sim.player).seats).toBe(before + sofa.seats!);
    expect(buybackRefusal(sim.player, item.id)).toBe('Only an IKEA piece goes back to IKEA.');
    expect(sim.execute({ kind: 'home.buy_piece', payload: { pieceId: sofa.id, quantity: 1, assembly: true } }).error).toBe(`${sofa.retailer} doesn’t put it together.`);
  });

  it('comes flat-packed from a maker who sells it so, and a sofa whose maker names no seat count seats its width over IKEA’s width a seat', () => {
    const flat = others.find((x) => x.flatPack)!;
    const town = { us: 'us-ny-newyork', ca: 'ca-on-toronto', mx: 'mx-cmx-mexicocity', uk: 'uk-eng-london', ie: 'ie-lei-dublin' }[flat.country]!;
    const sim = life(town, 'furn-flat');
    sim.must({ kind: 'home.buy_piece', payload: { pieceId: flat.id, quantity: 1 } });
    expect(itemsOf(sim.player).find((i) => i.kind === `furn:${flat.id}`)!.flatPacked).toBe(true);
    const ikea = FURNITURE_CATALOG.filter((p) => p.brand === 'IKEA' && p.kind === 'sofa' && p.seats && p.cm[0]).map((p) => p.cm[0]! / p.seats!).sort((a, b) => a - b);
    const perSeat = ikea[ikea.length >> 1]!;
    const est = others.filter((p) => p.seatsEstimated);
    expect(est.length).toBeGreaterThan(0);
    for (const p of est) expect(p.seats).toBe(Math.max(2, Math.floor(p.cm[0]! / perSeat)));
  });
});
