/**
 * Choosing clothes by size, color and fiber (requirement 22a, from
 * 2026-10-06): each a filter of the shops' catalog, a product kept where it
 * comes in what's chosen, and the fibers read from what its material says.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { arrange, facetValues } from '@/engine/systems/catalog';
import { clothingCatalog, fibresOf } from '@/engine/systems/clothing';

describe('the clothes shops, filtered', () => {
  it('keeps only what comes in the size, the color and the fiber chosen, and each narrows the rest', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true }, 'clothes-filters');
    const all = clothingCatalog(sim, 'us-ny-newyork');
    expect(facetValues(all, 'size')).toContain('M');
    const medium = arrange(all, { filters: { size: 'M' } });
    expect(medium.length).toBeGreaterThan(0);
    expect(medium.length).toBeLessThan(all.length);
    expect(medium.every((e) => e.value.sizes.includes('M'))).toBe(true);
    const color = facetValues(medium, 'color')[0]!;
    const both = arrange(all, { filters: { size: 'M', color } });
    expect(both.every((e) => e.value.sizes.includes('M') && e.value.colors.includes(color))).toBe(true);
    expect(both.length).toBeLessThanOrEqual(medium.length);
    const cotton = arrange(all, { filters: { material: 'Cotton' } });
    expect(cotton.length).toBeGreaterThan(0);
    expect(cotton.every((e) => /cotton/i.test(e.value.material ?? ''))).toBe(true);
  });

  it('reads the fibers a material names, and none from a word that only contains one', () => {
    expect(fibresOf('60% Cotton, 40% Polyester')).toEqual(['Cotton', 'Polyester']);
    expect(fibresOf('95% Viscose, 5% Elastane')).toEqual(['Elastane', 'Viscose']);
    expect(fibresOf('Breakdown-resistant knit')).toEqual([]);
    expect(fibresOf(null)).toEqual([]);
  });
});
