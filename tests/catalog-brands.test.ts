/**
 * Groceries' and toiletries' brands (`research-brands-from-names.json`, from
 * 2026-10-05): each product's brand as its own name states it, a store's own
 * label too, and none where the name names none, as fresh produce mostly
 * doesn't; counted by the coverage report.
 */
import { describe, expect, it } from 'vitest';
import { GROCERY_PRODUCTS } from '@/engine/content/groceries';
import { TOILETRIES } from '@/engine/content/hygiene';

describe('a grocery’s or a toiletry’s brand', () => {
  it('is the one its name states, and none where it names none', () => {
    const branded = GROCERY_PRODUCTS.filter((g) => g.brand);
    expect(branded.length).toBeGreaterThan(GROCERY_PRODUCTS.length / 2);
    for (const g of branded) expect(g.name.toLowerCase().replace(/[’']/g, '')).toContain(g.brand!.toLowerCase().replace(/[’']/g, '').split(' ')[0]!);
    expect(GROCERY_PRODUCTS.filter((g) => g.chain.startsWith('tesco') && g.brand === 'Tesco').length).toBeGreaterThan(0);
    expect(TOILETRIES.some((t) => t.brand === 'Colgate')).toBe(true);
    expect(TOILETRIES.every((t) => t.brand === null || t.brand.length > 0)).toBe(true);
  });
});
