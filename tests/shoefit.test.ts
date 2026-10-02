/**
 * Shoes by foot length (`shoeRow` and `chartSize` in `systems/tailoring.ts`,
 * from later on 2026-10-02): the brand's own chart picks the size, and a
 * shoe shorter than the foot doesn't go on.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { CLOTHING_PRODUCTS, CLOTHING_RETAILERS } from '@/engine/content/clothingcatalog';
import { SHOE_CHARTS } from '@/engine/content/sizecharts';
import { chartSize, fitOf, measuresRefusal, shoeRow } from '@/engine/systems/tailoring';
import type { Garment } from '@/engine/systems/wardrobe';

const KEY: Record<string, 'US' | 'UK' | 'MX'> = { US: 'US', CA: 'US', GB: 'UK', IE: 'UK', MX: 'MX' };

/** A shoe sold where its brand's chart is kept, and two rows of the chart it's sold in. */
function shoePair() {
  for (const chart of SHOE_CHARTS) {
    for (const r of CLOTHING_RETAILERS.filter((x) => x.market === chart.market)) {
      const p = CLOTHING_PRODUCTS.find((x) => x.retailer === r.id && x.slot === 'shoes' && (x.brand === chart.brand || r.name === chart.brand));
      if (!p) continue;
      const offered = new Set(p.sizes.map((s) => s.trim().toUpperCase()));
      const rows = chart.rows.filter((row) => row[KEY[chart.market]!] !== null && offered.has(String(row[KEY[chart.market]!]).toUpperCase()));
      if (rows.length >= 2) return { chart, p, small: rows[0]!, big: rows[1]! };
    }
  }
  return undefined;
}

describe('a shoe', () => {
  it('is sized by the foot on its brand’s chart', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'shoes');
    const pair = shoePair();
    expect(pair).toBeDefined();
    const { chart, p, big } = pair!;
    sim.player.measures = { department: chart.department, footCm: big.footCm };
    const size = chartSize(sim.player, p, p.sizes)!;
    expect(size.trim().toUpperCase()).toBe(String(big[KEY[chart.market]!]).toUpperCase());
    expect(shoeRow(sim.player, p, size)!.footCm).toBe(big.footCm);
  });

  it('shorter than the foot, doesn’t go on; long enough, does', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'shoes-fit');
    const { chart, small, big } = shoePair()!;
    sim.player.measures = { department: chart.department, footCm: big.footCm };
    const shoe = (footCm: number): Garment => ({ kind: 'x', slot: 'shoes', care: 'wipe' as never, wears: 0, washes: 0, footCm });
    expect(fitOf(sim.player, shoe(small.footCm))).toBe('small');
    expect(fitOf(sim.player, shoe(big.footCm))).toBe('fits');
    // Bought without a chart, a shoe fits as before.
    expect(fitOf(sim.player, { kind: 'x', slot: 'shoes', care: 'wipe' as never, wears: 0, washes: 0 })).toBe('fits');
    expect(measuresRefusal({ department: 'men', footCm: 50 })).toBe('A foot in centimeters, from 10 to 40.');
  });
});
