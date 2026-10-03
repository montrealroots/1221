/**
 * The product page's size chart (`chartFor` in `systems/tailoring.ts`, from
 * 2026-10-02): the retailer's own chart for its market and the garment's
 * group, in your department where you've given it.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { CLOTHING_PRODUCTS, CLOTHING_RETAILERS } from '@/engine/content/clothingcatalog';
import { chartFor } from '@/engine/systems/tailoring';

describe('a product’s size chart', () => {
  it('is its retailer’s own, for its group, in your department', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'chart-for');
    const hm = CLOTHING_RETAILERS.find((r) => r.name === 'Uniqlo' && r.market === 'US')!;
    const top = CLOTHING_PRODUCTS.find((p) => p.retailer === hm.id && p.slot === 'top')!;
    const bottom = CLOTHING_PRODUCTS.find((p) => p.retailer === hm.id && p.slot === 'bottom')!;
    expect(chartFor(sim.player, top)).toMatchObject({ retailer: 'Uniqlo', market: 'US', group: 'tops', department: 'women' });
    expect(chartFor(sim.player, bottom)?.group).toBe('bottoms');
    sim.player.measures = { department: 'men', chestCm: 100 };
    expect(chartFor(sim.player, top)?.department).toBe('men');
    // Shoes and accessories have no garment chart.
    expect(chartFor(sim.player, { retailer: hm.id, slot: 'accessory' })).toBeUndefined();
  });
});
