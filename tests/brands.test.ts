/**
 * The brands of the everyday catalogs (from 2026-10-04): each grocery,
 * toiletry and cleaning product keeps the brand its own name states, read in
 * `research-brands-from-names.json` and `research-cleaning-brands.json`, and
 * the corrections in `research-brands-corrections.json` (`tools/brands.mjs`),
 * and its list filters by it: the groceries' and the
 * bathroom's, where the cleaning products are sold beside the toiletries. A
 * product whose name states no brand (fresh produce, mostly) keeps none,
 * never a guess. A garment's brand (`tools/build-clothing.mjs`) is spelled
 * one way across its sellers, so a maker's own size chart finds it.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { GROCERY_PRODUCTS } from '@/engine/content/groceries';
import { TOILETRIES } from '@/engine/content/hygiene';
import { CLEANING } from '@/engine/content/cleaning';
import { CLOTHING_PRODUCTS } from '@/engine/content/clothingcatalog';
import { groceryCatalog } from '@/engine/systems/kitchen';
import { toiletryCatalog } from '@/engine/systems/hygiene';
import { arrange, facetValues, type CatalogEntry } from '@/engine/systems/catalog';
import { shoeRow } from '@/engine/systems/tailoring';

// A brand's spelling, read without its case, accents or apostrophes: Chedraui's "Kelloggs" is Kellogg's.
const plain = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, '');

describe('a product’s brand', () => {
  it('is the one its own name states, and none where the name states none', () => {
    for (const list of [GROCERY_PRODUCTS, TOILETRIES, CLEANING]) {
      expect(list.filter((p) => p.brand).length).toBeGreaterThan(list.length / 2);
      for (const p of list) if (p.brand) expect(plain(p.name), p.id).toContain(plain(p.brand));
    }
    // Fresh produce mostly names no brand.
    expect(GROCERY_PRODUCTS.some((p) => p.brand === null && p.category === 'produce')).toBe(true);
  });

  it('is the maker after the noun in a Spanish name, not the noun', () => {
    // Chedraui's products were read as Leche's milk and Cerveza's beer until 2026-10-04.
    const mexican = [...GROCERY_PRODUCTS, ...TOILETRIES].filter((p) => p.market === 'MX');
    expect(mexican.length).toBeGreaterThan(90);
    const brand = (id: string) => mexican.find((p) => p.id === id)?.brand;
    expect(brand('chedraui-leche-entera-lala-fresca-carton-1l')).toBe('Lala');
    expect(brand('chedraui-cerveza-corona-extra-clara-410ml')).toBe('Corona');
    expect(brand('chedraui-shampoo-head-shoulders-hidratacion-375ml')).toBe('Head & Shoulders');
    // Spelled as the other lists spell it, though the name leaves out the apostrophe.
    expect(brand('chedraui-cereal-kelloggs-corn-flakes-370g')).toBe("Kellogg's");
    expect(brand('chedraui-tomate-saladet-por-kg')).toBeNull();
    // Only Gillette's name starts with its maker.
    expect(mexican.filter((p) => p.brand && p.name.startsWith(`${p.brand} `)).map((p) => p.brand)).toEqual(['Gillette']);
  });

  it('is never the food’s own noun, nor a maker’s name cut to its first word', () => {
    // Save-On-Foods' "Spinach - Bunch, Fresh" had Spinach for its maker, Giant Tiger's "Zucchini, 2-Pack" Zucchini.
    const nouns = new Set([...GROCERY_PRODUCTS.map((p) => p.food), 'zucchini', 'bell', 'gala', 'navel', 'mcintosh', 'romaine', 'seedless', 'vine', 'jalapeno', 'english', 'italian', 'hot', 'bagged', 'wrapped', 'sleeved', 'freshly', 'fresh']);
    for (const p of GROCERY_PRODUCTS) if (p.brand) expect(nouns.has(plain(p.brand).replace(/s$/, '')), `${p.id}: ${p.brand}`).toBe(false);
    expect(GROCERY_PRODUCTS.find((p) => p.id === 'saveonfoods-spinach-bunch-fresh')?.brand).toBeNull();
    const brand = (id: string) => [...GROCERY_PRODUCTS, ...TOILETRIES].find((p) => p.id === id)?.brand;
    expect(brand('thefreshgrocer-bumble-bee-chunk-light-tuna-in-water-5-oz')).toBe('Bumble Bee');
    expect(brand('saveonfoods-dr-oetker-suprema-margherita-pizza-475-g')).toBe('Dr. Oetker');
    expect(brand('saveonfoods-general-mills-cheerios-cereal-family-size-570-g')).toBe('General Mills');
    expect(brand('saveonfoods-old-spice-deodorant-krakengard')).toBe('Old Spice');
    // Read from the grocers' feeds on 2026-10-04, a product keeps the feed's brand where its name states it.
    expect(brand('thefreshgrocer-cream-o-land-whole-milk-1-gal')).toBe('Cream-O-Land');
    expect(brand('pricerite-fresh-tomatoes-on-the-vine')).toBeNull();
  });

  it('is spelled one way in every list, its ordinary spelling where a listing writes it in capitals', () => {
    const all = [...GROCERY_PRODUCTS, ...TOILETRIES, ...CLEANING].map((p) => p.brand).filter((b): b is string => Boolean(b));
    const spellings = new Map<string, Set<string>>();
    for (const b of all) spellings.set(plain(b), (spellings.get(plain(b)) ?? new Set()).add(b));
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

describe('a garment’s brand', () => {
  it('is spelled one way across its sellers, the spelling with the fewest words in capitals or its own store’s', () => {
    const spellings = new Map<string, Set<string>>();
    for (const p of CLOTHING_PRODUCTS) spellings.set(plain(p.brand), (spellings.get(plain(p.brand)) ?? new Set()).add(p.brand));
    expect([...spellings.values()].filter((s) => s.size > 1).map((s) => [...s])).toEqual([]);
    const at = (retailer: string, brand: RegExp) => CLOTHING_PRODUCTS.find((p) => p.retailer === retailer && brand.test(p.brand))?.brand;
    // ASOS's British store writes ONLY Petite, read more often than its American store's Only Petite.
    expect(at('gb-asos', /^only petite$/i)).toBe('Only Petite');
    // Andrea's CLÓE and Liverpool's CLOE are Cloe, as its own store writes it.
    expect(at('mx-andrea-mx', /^cl[oó]e$/i)).toBe('Cloe');
  });

  it('carries no market where a retailer’s name was taken for it, and M&S is M&S', () => {
    const brands = new Set(CLOTHING_PRODUCTS.map((p) => plain(p.brand)));
    for (const p of CLOTHING_PRODUCTS) {
      const market = p.brand.match(/^(.*?)\s+(?:Canada|UK|US|USA|Ireland|M[eé]xico)$/i);
      expect(market !== null && brands.has(plain(market[1]!)), p.id).toBe(false);
    }
    // Uniqlo UK's thermals were a brand of their own, and Marks & Spencer's another beside M&S.
    const thermals = CLOTHING_PRODUCTS.filter((p) => p.retailer === 'gb-uniqlo' && p.category === 'thermals');
    expect(thermals.length).toBeGreaterThan(0);
    expect(thermals.every((p) => p.brand === 'Uniqlo')).toBe(true);
    expect(CLOTHING_PRODUCTS.some((p) => p.brand === 'Marks & Spencer')).toBe(false);
  });

  it('reads a shoe on its maker’s size chart where its seller wrote the maker another way', () => {
    // Coppel lists the UltraRun 5 as Adidas's: adidas's own chart for Mexico sizes it.
    const sim = quickSave({ startLocationId: 'mx-cmx-mexicocity', homeRegionId: 'mx-cmx-mexicocity', livesWhereBorn: true }, 'brands-shoe');
    sim.player.measures = { department: 'men', footCm: 27 };
    const shoe = CLOTHING_PRODUCTS.find((p) => p.id === 'mx-coppel-mx-tenis-para-correr-adidas-ultrarun-5-para-hombre')!;
    expect(shoe.brand).toBe('adidas');
    expect(shoeRow(sim.player, shoe)?.footCm).toBeGreaterThanOrEqual(27);
  });
});
