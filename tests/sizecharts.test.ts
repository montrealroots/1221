/**
 * Your size by a retailer's own chart (`chartSize` in `systems/tailoring.ts`,
 * `content/sizecharts.ts`, from 2026-10-02): measurements given, the chart
 * for the retailer's market and the department sized by, a top by chest or
 * bust and a bottom by waist; body mass index otherwise.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { CLOTHING_PRODUCTS, CLOTHING_RETAILERS } from '@/engine/content/clothingcatalog';
import { SIZE_CHARTS, type SizeChart } from '@/engine/content/sizecharts';
import { bmiShare, chartSize, fitKgFor, measuresRefusal, sizeFor, sizeRun } from '@/engine/systems/tailoring';
import { bodyOf } from '@/engine/systems/body';

const life = () => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'sizes');

/** A product with a chart for it, and a row of that chart it's sold in. */
function pairFor(group: 'tops' | 'bottoms') {
  for (const chart of SIZE_CHARTS.filter((c) => c.group === group)) {
    const r = CLOTHING_RETAILERS.find((x) => x.market === chart.market && (x.name === chart.retailer || chart.retailer.startsWith(`${x.name} (`)));
    if (!r) continue;
    const slots = group === 'bottoms' ? ['bottom'] : ['top'];
    const p = CLOTHING_PRODUCTS.find((x) => x.retailer === r.id && slots.includes(x.slot) && sizeRun(x.sizes).length > 2);
    if (!p) continue;
    const offered = new Set(p.sizes.map((s) => s.trim().toUpperCase()));
    const rows = chart.rows.filter((row) => row.labels.some((l) => offered.has(l)) && (group === 'bottoms' ? row.waist : row.bust ?? row.chest));
    if (rows.length >= 2) return { chart, p, row: rows[1]!, first: rows[0]! };
  }
  return undefined;
}
const span = (chart: SizeChart, row: SizeChart['rows'][number]) => (chart.group === 'bottoms' ? row.waist : row.bust ?? row.chest)!;

describe('a size by the chart', () => {
  it('is the smallest whose range reaches your chest, for a top', () => {
    const sim = life();
    const pair = pairFor('tops');
    expect(pair).toBeDefined();
    const { chart, p, row } = pair!;
    sim.must({ kind: 'clothes.measures', payload: { department: chart.department, chestCm: span(chart, row)[1] } });
    const size = chartSize(sim.player, p, p.sizes)!;
    expect(row.labels).toContain(size.trim().toUpperCase());
    expect(sizeFor(sim, sim.player, p.sizes, p)).toBe(size);
    // Bought in it, it's made for you as you are.
    expect(fitKgFor(sim, sim.player, p.sizes, size, p)).toBe(bodyOf(sim, sim.player).weightKg);
  });

  it('reads a bottom by waist, and the smallest row for a waist below them all', () => {
    const sim = life();
    const pair = pairFor('bottoms');
    expect(pair).toBeDefined();
    const { chart, p, first } = pair!;
    sim.must({ kind: 'clothes.measures', payload: { department: chart.department, chestCm: 200, waistCm: 40 } });
    expect(first.labels).toContain(chartSize(sim.player, p, p.sizes)!.trim().toUpperCase());
  });

  it('falls back to body mass index without measurements, or with another department’s charts only', () => {
    const sim = life();
    const { p } = pairFor('tops')!;
    const byBmi = sizeFor(sim, sim.player, p.sizes);
    expect(sizeFor(sim, sim.player, p.sizes, p)).toBe(byBmi);
    expect(bmiShare('us', 22)).toBeGreaterThan(0);
    sim.must({ kind: 'clothes.measures', payload: { department: 'men', chestCm: 100 } });
    sim.must({ kind: 'clothes.measures', payload: { clear: true } });
    expect(sim.player.measures).toBeUndefined();
  });

  it('keeps only measurements a body could have, and a department chosen', () => {
    expect(measuresRefusal({ chestCm: 90 })).toBe('Choose whose charts to size by.');
    expect(measuresRefusal({ department: 'women', waistCm: 10 })).toBe('Each measurement in centimeters, from 40 to 220.');
    expect(measuresRefusal({ department: 'men', chestCm: 100, waistCm: 85, hipCm: 98 })).toBeUndefined();
  });
});
