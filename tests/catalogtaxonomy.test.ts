/**
 * The hierarchy the catalogs are counted by (`content/catalogtaxonomy.ts`, the
 * owner's §E3, restated 2026-10-05): every clothing product counted in one
 * category the hierarchy has, each shoe by its style, and the clothing
 * builder's corrections of that day.
 */
import { describe, expect, it } from 'vitest';
import { CLOTHING_PRODUCTS } from '@/engine/content/clothingcatalog';
import { CATEGORIES, LIFE_STEPS, clothingCategoryOf, footwearStyleOf } from '@/engine/content/catalogtaxonomy';

const named = (name: string) => CLOTHING_PRODUCTS.find((p) => p.name === name)!;

describe('the hierarchy', () => {
  it('counts every clothing product in one category it has', () => {
    const ids = new Set(CATEGORIES.map((c) => c.id));
    expect(CLOTHING_PRODUCTS.filter((p) => !ids.has(clothingCategoryOf(p))).map((p) => `${clothingCategoryOf(p)}: ${p.name}`)).toEqual([]);
  });

  it('names each owned item\'s steps by the steps it knows, none both built and missing', () => {
    for (const c of CATEGORIES) {
      for (const step of Object.keys(c.steps ?? {})) expect(LIFE_STEPS).toContain(step);
      for (const step of c.missing ?? []) expect(c.steps?.[step]).toBeUndefined();
    }
  });

  it('keeps underwear, a bra, socks and a designer house\'s clothes apart, and a designer\'s bag with the bags', () => {
    expect(clothingCategoryOf(CLOTHING_PRODUCTS.find((p) => p.kind === 'bra' && p.category === 'underwear')!)).toBe('lingerie');
    expect(clothingCategoryOf(CLOTHING_PRODUCTS.find((p) => p.kind === 'socks' && p.category === 'underwear')!)).toBe('hosiery');
    expect(clothingCategoryOf(CLOTHING_PRODUCTS.find((p) => p.kind === 'underwear' && p.category === 'underwear')!)).toBe('underwear');
    const prada = CLOTHING_PRODUCTS.filter((p) => p.brand === 'Prada');
    expect(prada.filter((p) => p.category === 'bags').map(clothingCategoryOf)).toEqual(prada.filter((p) => p.category === 'bags').map(() => 'bags'));
    expect(prada.some((p) => clothingCategoryOf(p) === 'designer')).toBe(true);
    // A culture's own shoes stay cultural clothing.
    expect(CLOTHING_PRODUCTS.filter((p) => p.category === 'cultural' && p.kind === 'shoes').every((p) => clothingCategoryOf(p) === 'cultural')).toBe(true);
  });
});

describe('a shoe\'s style', () => {
  it('is its name\'s, in English or Spanish', () => {
    expect(footwearStyleOf('Tenis De Bota Monocolor', 'MX')).toBe('sneakers');
    expect(footwearStyleOf('Leather Block Heel Ankle Boots', 'GB')).toBe('boots');
    expect(footwearStyleOf('Chanclas para hombre Nike ReactX Rejuven8', 'MX')).toBe('sandals');
    expect(footwearStyleOf('Zapato choclo para hombre', 'MX')).toBe('dress-shoes');
    // In Mexico a zapatilla is a woman's pump.
    expect(footwearStyleOf('ZAPATILLA ANDREA PARA MUJER 67190', 'MX')).toBe('dress-shoes');
  });

  it('is its retailer\'s filing where the name says none, unless the filing joins several', () => {
    const sandal = named('ʻAhi Kai  -  Ash / Ash');
    expect(clothingCategoryOf(sandal)).toBe('sandals');
    expect(clothingCategoryOf(named('Plastic mules'))).toBe('footwear-other');
    expect(clothingCategoryOf(named('Perfect Mirjana Wedge 50'))).toBe('sandals');
  });
});

describe('the clothing builder, as corrected on 2026-10-05', () => {
  it('leaves a factory second out', () => {
    expect(CLOTHING_PRODUCTS.filter((p) => p.name.startsWith('[S]'))).toEqual([]);
  });

  it('reads a pant in the singular as the trousers it is', () => {
    expect(named('Ponte Pull-On Boot Pant').kind).toBe('trousers');
    expect(named('Tweed Effect Sweater Pant').kind).toBe('trousers');
    expect(named('Relaxed Twill Dress Pant').slot).toBe('bottom');
    expect(named('ArctiCore Pant').kind).toBe('thermal-bottom');
    // A pant its retailer files under jeans is a pair of jeans.
    expect(named('Pull-On High-Rise Barrel Pant').kind).toBe('jeans');
    // A suit's trousers are its bottom half, not the whole suit.
    expect(named('Signature Italian Nailhead Suit Pant').slot).toBe('bottom');
  });
});
