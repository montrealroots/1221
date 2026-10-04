/**
 * The brands of the everyday catalogs (from 2026-10-04): each grocery,
 * toiletry and cleaning product keeps the brand its own name states, read in
 * `research-brands-from-names.json` and `research-cleaning-brands.json`
 * (`tools/brands.mjs`), and its list filters by it: the groceries' and the
 * bathroom's, where the cleaning products are sold beside the toiletries. A
 * product whose name states no brand (fresh produce, mostly) keeps none,
 * never a guess.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { GROCERY_PRODUCTS } from '@/engine/content/groceries';
import { TOILETRIES } from '@/engine/content/hygiene';
import { CLEANING } from '@/engine/content/cleaning';
import { groceryCatalog } from '@/engine/systems/kitchen';
import { toiletryCatalog } from '@/engine/systems/hygiene';
import { arrange, facetValues, type CatalogEntry } from '@/engine/systems/catalog';

const plain = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, "'");

describe('a product’s brand', () => {
  it('is the one its own name states, and none where the name states none', () => {
    for (const list of [GROCERY_PRODUCTS, TOILETRIES, CLEANING]) {
      expect(list.filter((p) => p.brand).length).toBeGreaterThan(list.length / 2);
      for (const p of list) if (p.brand) expect(plain(p.name), p.id).toContain(plain(p.brand));
    }
    // Fresh produce mostly names no brand.
    expect(GROCERY_PRODUCTS.some((p) => p.brand === null && p.category === 'produce')).toBe(true);
  });

  it('is spelled one way in every list, its ordinary spelling where a listing writes it in capitals', () => {
    const all = [...GROCERY_PRODUCTS, ...TOILETRIES, ...CLEANING].map((p) => p.brand).filter((b): b is string => Boolean(b));
    const spellings = new Map<string, Set<string>>();
    for (const b of all) spellings.set(b.toLowerCase(), (spellings.get(b.toLowerCase()) ?? new Set()).add(b));
    expect([...spellings.values()].filter((s) => s.size > 1).map((s) => [...s])).toEqual([]);
    // Save-On-Foods' "IVORY - Gentle Bar Soap" is Ivory's, though its capitals are read three times to Ivory's two.
    expect(TOILETRIES.find((p) => p.name.startsWith('IVORY'))?.brand).toBe('Ivory');
  });

  it('filters the grocery list and the toiletries where they live', () => {
    const sim = quickSave({ startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london', livesWhereBorn: true }, 'brands');
    const lists: readonly (readonly CatalogEntry<{ brand: string | null }>[])[] = [groceryCatalog(sim, 'uk-eng-london'), toiletryCatalog(sim, 'uk-eng-london')];
    for (const entries of lists) {
      const brands = facetValues(entries, 'brand');
      expect(brands.length).toBeGreaterThan(1);
      const one = brands[0]!;
      const only = arrange(entries, { filters: { brand: one } });
      expect(only.length).toBeGreaterThan(0);
      expect(only.every((e) => e.value.brand === one)).toBe(true);
      expect(only.length).toBeLessThan(entries.length);
    }
  });
});
