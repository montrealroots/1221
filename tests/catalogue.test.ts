/**
 * The real catalogue.
 *
 * Every chain and every product on a shop floor is a real one, named as public
 * record, and every price, quality score and wear curve beside it is SLATE's
 * own and labelled so. The chains only trade where they really trade. Nothing
 * SLATE invented before the real data arrived is offered any more, and nothing
 * that an old save already owns has stopped resolving.
 */

import { describe, expect, it } from 'vitest';
import {
  CATALOG, RETAILERS, isLegacyItem, retailPrice, retailersFor, shoppableItems, shoppableItemsIn, shoppableRetailers,
} from '@/engine/content/catalog';
import { REAL_RETAILERS, marketOf, tradesIn } from '@/engine/content/brands';
import { REAL_GOODS_NOTE } from '@/engine/content/goods';
import { CITIES } from '@/engine/content/geography';
import { placesIn } from '@/engine/content/places';
import { quickSave } from '@/engine';
import { MINIMUM_ASSORTMENT, aislesAt, assortmentAt, frontTableAt } from '@/engine/systems/retail';

const LA = 'us-ca-losangeles';
const LONDON = 'uk-eng-london';

/** The aisles the interface shows, and the floor a shop puts out. */
const SHOPPING_CATEGORIES = [
  'groceries', 'clothing', 'footwear', 'accessory', 'watch', 'jewelry',
  'furniture', 'home', 'household', 'appliance', 'electronics', 'equipment', 'art', 'books',
];

describe('the real catalogue', () => {
  it('carries at least a hundred real products in every aisle', () => {
    const counts = new Map<string, number>();
    for (const item of shoppableItems()) counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    const short = SHOPPING_CATEGORIES.filter((c) => (counts.get(c) ?? 0) < 100);
    expect(short, `short of a hundred: ${short.map((c) => `${c} ${counts.get(c) ?? 0}`).join(', ')}`).toEqual([]);
    expect(shoppableItems().length).toBeGreaterThan(1_400);
  });

  it('names a real brand on every product it offers, and never the same id twice', () => {
    const ids = new Set<string>();
    for (const item of shoppableItems()) {
      expect(item.brand.trim().length, item.id).toBeGreaterThan(1);
      expect(item.name.trim().length, item.id).toBeGreaterThan(2);
      expect(item.basePrice, item.id).toBeGreaterThan(0);
      expect(ids.has(item.id), `duplicate ${item.id}`).toBe(false);
      ids.add(item.id);
    }
  });

  it('says out loud that the price is its own calibration and not the shop’s', () => {
    expect(REAL_GOODS_NOTE).toMatch(/SLATE/);
    expect(REAL_GOODS_NOTE).toMatch(/calibration/i);
    // Every real product is marked as a calibrated estimate, never as public record.
    for (const item of shoppableItems().slice(0, 200)) {
      expect(item.source, item.id).toBe('calibrated_estimate');
    }
  });

  it('keeps what SLATE invented before, so an old save still resolves it, and never offers it', () => {
    // The twelve invented chains and the items that went with them are still there.
    expect(RETAILERS.get('hallidays')?.legacy).toBe(true);
    expect(RETAILERS.get('everline')?.legacy).toBe(true);
    expect(CATALOG.get('tshirt_basic')).toBeDefined();
    expect(CATALOG.get('watch_grand')).toBeDefined();
    expect(isLegacyItem(CATALOG.require('tshirt_basic'))).toBe(true);
    // And none of it is on a floor or in a list any more.
    expect(shoppableRetailers().some((r) => r.legacy)).toBe(false);
    expect(shoppableItems().some(isLegacyItem)).toBe(false);
    expect(retailersFor('clothing', LA).some((r) => r.id === 'hallidays')).toBe(false);
  });

  it('puts a chain only in the market it really trades in', () => {
    const laPop = CITIES.get(LA)!.population;
    const londonPop = CITIES.get(LONDON)!.population;
    expect(tradesIn(REAL_RETAILERS.find((r) => r.id === 'tesco')!, LONDON, londonPop)).toBe(true);
    expect(tradesIn(REAL_RETAILERS.find((r) => r.id === 'tesco')!, LA, laPop)).toBe(false);
    expect(tradesIn(REAL_RETAILERS.find((r) => r.id === 'trader_joes')!, LA, laPop)).toBe(true);
    expect(tradesIn(REAL_RETAILERS.find((r) => r.id === 'trader_joes')!, LONDON, londonPop)).toBe(false);
    expect(marketOf(LA)).toBe('us');
    expect(marketOf(LONDON)).toBe('uk');
  });

  it('keeps a flagship only house where its flagship actually is', () => {
    const harrods = REAL_RETAILERS.find((r) => r.id === 'harrods')!;
    expect(harrods.flagshipCities).toContain(LONDON);
    expect(tradesIn(harrods, LONDON, 8_900_000)).toBe(true);
    expect(tradesIn(harrods, LA, 3_900_000)).toBe(false);
  });

  it('does not put a maison in a town that could not hold one', () => {
    const hermes = REAL_RETAILERS.find((r) => r.id === 'hermes')!;
    expect(tradesIn(hermes, 'us-ca-losangeles', 3_900_000)).toBe(true);
    expect(tradesIn(hermes, 'us-ia-ames', 66_000)).toBe(false);
    // A discounter, on the other hand, is everywhere there are people.
    const aldi = REAL_RETAILERS.find((r) => r.id === 'aldi')!;
    expect(tradesIn(aldi, 'de-be-berlin', 3_600_000)).toBe(true);
  });

  it('prices a thing higher at a dearer chain and higher again in a dearer city', () => {
    const cheap = retailPrice('c_levis_501', 'costco', 1.0);
    const dear = retailPrice('c_levis_501', 'nordstrom', 1.0);
    expect(dear).toBeGreaterThan(cheap);
    const here = retailPrice('c_levis_501', 'nordstrom', 1.0);
    const expensive_city = retailPrice('c_levis_501', 'nordstrom', 1.6);
    expect(expensive_city).toBeGreaterThan(here);
  });

  it('gives a real chain a real storefront and a legacy chain none', () => {
    const shops = placesIn(LA).filter((p) => p.retailerId);
    expect(shops.length).toBeGreaterThan(30);
    for (const shop of shops) {
      const retailer = RETAILERS.get(shop.retailerId!);
      expect(retailer, shop.id).toBeDefined();
      expect(retailer!.legacy ?? false, shop.id).toBe(false);
      expect(shop.id).toBe(`${LA}:shop:${shop.retailerId}`);
    }
  });

  it('offers something in every aisle to somebody standing in a real city', () => {
    for (const category of SHOPPING_CATEGORIES) {
      const inLa = retailersFor(category, LA);
      expect(inLa.length, `nobody sells ${category} in Los Angeles`).toBeGreaterThan(0);
      const inLondon = retailersFor(category, LONDON);
      expect(inLondon.length, `nobody sells ${category} in London`).toBeGreaterThan(0);
    }
  });

  it('stocks a chain only with what that chain actually sells', () => {
    for (const retailer of shoppableRetailers()) {
      expect(retailer.categories.length, retailer.id).toBeGreaterThan(0);
      expect(retailer.priceMultiplier, retailer.id).toBeGreaterThan(0);
      expect(retailer.description.trim().length, retailer.id).toBeGreaterThan(10);
    }
  });
});

describe('a national brand stays in its nation', () => {
  it('does not sell a British loaf in California, or an American one in London', () => {
    const la = shoppableItemsIn(LA).map((i) => i.id);
    const london = shoppableItemsIn(LONDON).map((i) => i.id);
    expect(la).not.toContain('g_hovis');
    expect(la).not.toContain('g_warburtons');
    expect(london).toContain('g_hovis');
    expect(london).not.toContain('g_dave_killer');
    expect(la).toContain('g_dave_killer');
  });

  it('leaves a brand that really is everywhere alone', () => {
    for (const city of [LA, LONDON, 'fr-idf-paris']) {
      const ids = shoppableItemsIn(city).map((i) => i.id);
      expect(ids, city).toContain('g_barilla');
      expect(ids, city).toContain('c_levis_501');
      expect(ids, city).toContain('w_rolex_sub_date');
    }
  });

  it('keeps a hundred in every aisle even after the market gate', () => {
    const counts = new Map<string, number>();
    for (const item of shoppableItemsIn(LA)) counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    const short = SHOPPING_CATEGORIES.filter((c) => (counts.get(c) ?? 0) < 100);
    expect(short, `short in Los Angeles: ${short.join(', ')}`).toEqual([]);
  });
});


describe('every shop floor is a real shop floor', () => {
  it('carries at least a hundred real things in every branch, everywhere it trades', () => {
    const sim = quickSave({}, 'assortment');
    const thin: string[] = [];
    for (const cityId of [LA, LONDON, 'fr-idf-paris', 'jp-13-tokyo', 'au-nsw-sydney']) {
      for (const place of placesIn(cityId).filter((p) => p.retailerId)) {
        const count = assortmentAt(sim, place).length;
        if (count < MINIMUM_ASSORTMENT) thin.push(`${place.name} in ${cityId}: ${count}`);
      }
    }
    expect(thin, `these branches are thinner than a hundred things: ${thin.join('; ')}`).toEqual([]);
  });

  it('walks the aisles rather than a twelve item rail', () => {
    const sim = quickSave({}, 'aisles');
    const shop = placesIn(LA).find((p) => p.retailerId === 'nordstrom')!;
    const aisles = aislesAt(sim, shop);
    expect(aisles.length).toBeGreaterThan(2);
    const total = aisles.reduce((sum, a) => sum + a.count, 0);
    expect(total).toBe(assortmentAt(sim, shop).length);
    for (const aisle of aisles) {
      expect(assortmentAt(sim, shop, aisle.category).length, aisle.category).toBe(aisle.count);
    }
  });

  it('leads with a front table that changes with the fortnight and is not the whole shop', () => {
    const sim = quickSave({}, 'front');
    const shop = placesIn(LA).find((p) => p.retailerId === 'ikea')!;
    const front = frontTableAt(sim, shop);
    expect(front.length).toBeGreaterThan(0);
    expect(front.length).toBeLessThan(assortmentAt(sim, shop).length);
    for (const stocked of front) expect(stocked.featured).toBe(true);
  });
});
