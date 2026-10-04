/**
 * Fit lines (`research-clothing-fit.json`, from 2026-10-04): maternity,
 * petite, tall and plus as each retailer files them; a style sold in petite
 * and tall fit variants of its sizes cut and sized in each; and a catalog
 * facet holding several values, so it's found under every cut it comes in.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { arrange, facetValues, type CatalogEntry } from '@/engine/systems/catalog';
import { clothingCatalog, fitsOf, isMaternity, productById } from '@/engine/systems/clothing';
import { cutOf, sizeFor } from '@/engine/systems/tailoring';
import { CLOTHING_PRODUCTS } from '@/engine/content/clothingcatalog';

// Read in the first research and again in the fit lines', which filed it under petite, tall and plus: one product.
const LEGGINGS = 'us-old-navy-high-waisted-studiosmooth-78-leggings';

describe('a fit line', () => {
  it('is one product however often it was read, and two only where a retailer gives two garments one name', () => {
    const named = new Map<string, typeof CLOTHING_PRODUCTS[number][]>();
    for (const x of CLOTHING_PRODUCTS) { const k = `${x.retailer}|${x.name.toLowerCase()}`; named.set(k, [...(named.get(k) ?? []), x]); }
    const shared = [...named.values()].filter((g) => g.length > 1);
    expect(shared.length).toBeGreaterThan(0);
    // Liverpool's two pantimedias, one name at two prices, are two.
    expect(named.get('mx-liverpool-mx|pantimedia')?.map((x) => x.price).sort((x, y) => x - y)).toEqual([99, 129]);
    // Two by one name differ in price or in department, never both unread and alike.
    for (const g of shared) for (const [i, a] of g.entries()) for (const b of g.slice(i + 1)) expect(a.price !== b.price || (a.dept !== null && b.dept !== null && a.dept !== b.dept)).toBe(true);
  });


  it('cuts a style sold in petite and tall variants in each, and sizes a woman 160 cm or shorter in the petite', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true });
    const p = sim.player;
    const leggings = productById(LEGGINGS)!;
    expect(leggings.fitLines).toEqual(expect.arrayContaining(['petite', 'tall', 'plus']));
    // Read twice, kept once, under the id it had first.
    expect(CLOTHING_PRODUCTS.filter((x) => x.retailer === leggings.retailer && x.name === leggings.name)).toHaveLength(1);
    // Each regular size again as a petite and a tall; its plus sizes (2X to 4X) aren't cut either way.
    const regular = cutOf(leggings.sizes, 'regular');
    expect(cutOf(leggings.sizes, 'petite')).toEqual(regular.filter((s) => !/X$/.test(s) || /^X+[SL]$/.test(s)).map((s) => `PETITE ${s}`));
    expect(cutOf(leggings.sizes, 'tall').length).toBe(cutOf(leggings.sizes, 'petite').length);
    expect(leggings.sizes).not.toContain('PETITE 2X');
    p.body = { ...p.body!, heightCm: 157 };
    p.measures = { department: 'women' };
    expect(sizeFor(sim, p, leggings.sizes, leggings)!.startsWith('PETITE ')).toBe(true);
    p.body = { ...p.body!, heightCm: 171 };
    expect(sizeFor(sim, p, leggings.sizes, leggings)!.startsWith('PETITE ')).toBe(false);
  });

  it('makes a garment filed under maternity a maternity one, though its name doesn’t say so', () => {
    const jacket = productById('us-gap-denim-oversized-shirt-jacket')!;
    expect(/maternity/i.test(jacket.name)).toBe(false);
    expect(isMaternity(jacket)).toBe(true);
    expect(isMaternity({ name: jacket.name })).toBe(false);
  });

  it('is found under each cut it comes in, and lists them all', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true });
    const entries = clothingCatalog(sim, 'us-ny-newyork');
    const leggings = productById(LEGGINGS)!;
    expect(fitsOf(leggings)).toEqual(expect.arrayContaining(['Petite', 'Tall', 'Plus']));
    for (const cut of ['Petite', 'Tall', 'Plus']) {
      const found = arrange(entries, { filters: { cut } });
      expect(found.some((e) => e.id === LEGGINGS)).toBe(true);
      // Nothing is found under a cut it isn't sold in.
      expect(found.every((e) => e.facets?.cut === cut || e.also?.cut?.includes(cut))).toBe(true);
    }
  });

  it('offers every cut a list holds as a choice, one held only as a further value too', () => {
    const entry = (id: string, cut: string, also: string[]): CatalogEntry => ({ id, label: id, price: 100, priceKind: 'advertised', basis: 'Each', facets: { cut }, also: { cut: also }, value: null });
    expect(facetValues([entry('a', 'Women', ['Petite', 'Tall']), entry('b', 'Men', [])], 'cut')).toEqual(['Men', 'Petite', 'Tall', 'Women']);
  });
});
