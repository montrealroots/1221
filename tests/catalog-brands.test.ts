/**
 * Groceries' and toiletries' brands (`research-brands-from-names.json`, from
 * 2026-10-05): each product's brand as its own name states it, a store's own
 * label too, and none where the name names none, as fresh produce mostly
 * doesn't; counted by the coverage report.
 */
import { describe, expect, it } from 'vitest';
import { GROCERY_PRODUCTS } from '@/engine/content/groceries';
import { TOILETRIES } from '@/engine/content/hygiene';
import { CLEANING } from '@/engine/content/cleaning';

describe('a grocery’s or a toiletry’s brand', () => {
  it('is the one its name states, and none where it names none', () => {
    const branded = GROCERY_PRODUCTS.filter((g) => g.brand);
    expect(branded.length).toBeGreaterThan(GROCERY_PRODUCTS.length / 2);
    for (const g of branded) expect(g.name.toLowerCase().replace(/[’']/g, '')).toContain(g.brand!.toLowerCase().replace(/[’']/g, '').split(' ')[0]!);
    expect(GROCERY_PRODUCTS.filter((g) => g.chain.startsWith('tesco') && g.brand === 'Tesco').length).toBeGreaterThan(0);
    expect(TOILETRIES.some((t) => t.brand === 'Colgate')).toBe(true);
    expect(TOILETRIES.every((t) => t.brand === null || t.brand.length > 0)).toBe(true);
  });

  it('is a cleaning product’s maker, never a word for the product', () => {
    expect(CLEANING.every((c) => c.brand)).toBe(true);
    expect(CLEANING.find((c) => /Cascade Platinum, 12 Cápsulas/.test(c.name))!.brand).toBe('Cascade');
    expect(CLEANING.find((c) => /Persil Non Bio Liquid/.test(c.name))!.brand).toBe('Persil');
    expect(CLEANING.some((c) => ['Cápsulas', 'Cloro', 'Toallas'].includes(c.brand!))).toBe(false);
  });
});
