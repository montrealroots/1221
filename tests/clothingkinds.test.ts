/**
 * The kinds of garment the trade names apart (`subtype`, from 2026-10-03),
 * the same product at a market's other sellers (`otherSellers`), and a swim
 * worn in a swimsuit of one's own (`wearForSwim`).
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { CLOTHING_PRODUCTS } from '@/engine/content/clothingcatalog';
import { clothingCatalog, otherSellers, productById } from '@/engine/systems/clothing';
import { garmentsOf, isSwimsuit, swimsuitFor, wearForExercise, wearForSwim } from '@/engine/systems/wardrobe';
import { addItem } from '@/engine/systems/items';
import type { Simulation } from '@/engine/core/simulation';
import { HOTEL_AMENITIES } from '@/engine/content/hotelamenities';
import { hotelById } from '@/engine/systems/hotels';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const give = (sim: Simulation, kind: string, slot: 'active' | 'top') => addItem(sim, sim.player, { kind: `test:${kind}`, label: kind, quantity: 1, condition: 1, at: { kind: 'person' }, acquiredAt: sim.now, garment: { kind, slot, care: 'wash', wears: 0, washes: 0 } });

describe('the kinds the trade names apart', () => {
  it('are on sale where they were read, and filtered by', () => {
    for (const market of ['US', 'GB', 'CA', 'MX'] as const) expect(CLOTHING_PRODUCTS.some((p) => p.market === market && p.subtype === 'swimwear' && p.kind === 'swimsuit' && p.slot === 'active')).toBe(true);
    expect(CLOTHING_PRODUCTS.filter((p) => p.subtype === 'slips').every((p) => p.slot === 'underwear' && p.kind === 'slip')).toBe(true);
    expect(CLOTHING_PRODUCTS.filter((p) => p.subtype === 'hosiery').every((p) => p.slot === 'socks')).toBe(true);
    // A Mexican listing named in Spanish is the garment it names.
    expect(CLOTHING_PRODUCTS.find((p) => p.name === 'Pantalón térmico para hombre')!.slot).toBe('bottom');
    expect(CLOTHING_PRODUCTS.find((p) => p.name.startsWith('Conjunto pijama'))!.slot).toBe('sleep');
    const sim = life('uk-eng-london', 'kinds-gb');
    const entries = clothingCatalog(sim, 'uk-eng-london');
    expect(entries.filter((e) => e.facets?.special === 'Thermals').length).toBeGreaterThan(5);
    expect(entries.find((e) => e.value.subtype === null)!.facets?.special).toBe('None');
  });

  it('a product sold by several retailers lists the others, cheapest first, in its own market', () => {
    const sim = life('us-ny-newyork', 'sellers');
    const levis = productById('us-levis-501-original-fit-mens-jeans')!;
    const others = otherSellers(sim, 'us-ny-newyork', levis);
    expect(others.map((o) => o.product.retailer)).toEqual(['us-macys', 'us-macys']);
    expect(others[0]!.price).toBeLessThanOrEqual(others[1]!.price);
    // Cheapest first, whatever order they're listed in.
    const first = CLOTHING_PRODUCTS.find((p) => p.sameAs === levis.sameAs && p.retailer === 'us-macys' && p.price === 79.5)! as { price: number };
    first.price = 200;
    try { expect(otherSellers(sim, 'us-ny-newyork', levis).map((o) => o.product.price)).toEqual([84.95, 200]); } finally { first.price = 79.5; }
    expect(others.every((o) => o.product.market === 'US')).toBe(true);
    expect(otherSellers(sim, 'us-ny-newyork', productById(CLOTHING_PRODUCTS.find((p) => p.sameAs === null)!.id)!)).toEqual([]);
  });
});

describe('a swim', () => {
  it('is in a swimsuit of your own, which a workout doesn’t wear', () => {
    const sim = life('us-ny-newyork', 'swimsuit');
    expect(wearForSwim(sim, sim.player)).toBe(false);
    const suit = give(sim, 'swimsuit', 'active');
    give(sim, 'active', 'active');
    expect(swimsuitFor(sim, sim.player)!.id).toBe(suit.id);
    expect(wearForSwim(sim, sim.player)).toBe(true);
    expect(garmentsOf(sim.player).find((g) => g.id === suit.id)!.garment.dirty).toBe(true);
    // Washed after the one wear; until then there's no clean one.
    expect(swimsuitFor(sim, sim.player)).toBeUndefined();
    const fresh = give(sim, 'swimsuit', 'active');
    // The workout's own clothes gone, it's in a top, not the swimsuit.
    for (const g of garmentsOf(sim.player)) if (g.garment.slot === 'active' && !isSwimsuit(g)) g.garment.dirty = true;
    expect(wearForExercise(sim, sim.player)).toBe(true);
    expect(garmentsOf(sim.player).find((g) => g.id === fresh.id)!.garment.wears).toBe(0);
    expect(isSwimsuit(garmentsOf(sim.player).find((g) => g.id === fresh.id)!)).toBe(true);
  });

  it('in a hotel’s indoor pool, wears the swimsuit', () => {
    const sim = life('us-ny-newyork', 'swim-hotel');
    const p = sim.player;
    const indoor = HOTEL_AMENITIES.find((a) => a.pool === 'indoor')!;
    const city = hotelById(indoor.id)!.cityId;
    p.currentLocationId = city;
    p.stay = { kind: 'hotel', cityId: city, hotelId: indoor.id };
    const suit = give(sim, 'swimsuit', 'active');
    const r = sim.execute({ kind: 'life.look_after', payload: { action: 'swim' } });
    expect(r.ok, r.error).toBe(true);
    expect(garmentsOf(p).find((g) => g.id === suit.id)!.garment.dirty).toBe(true);
  });
});
