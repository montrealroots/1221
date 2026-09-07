/**
 * The second rank of houses, at the depth a house actually has.
 *
 * Three promises. Every one of the eight carries a hundred real pieces or
 * more, and the gate's own checker fails if any of them slips under. Each is
 * a house rather than a rail: leather goods, shoes, ready to wear for both
 * racks, accessories, and a fragrance counter where the house really has
 * one — Fendi has none here, because SLATE will not invent a bottle to make
 * a column look full. And every piece is buyable: a real retailer sells it,
 * in a country that retailer really trades in, at a price that says on the
 * screen that it is SLATE's own calibration.
 */

import { describe, expect, it } from 'vitest';
import { REAL_MAISONS } from '@/engine/content/maisons';
import { RETAILERS, shoppableItems } from '@/engine/content/catalog';
import { SLOTS } from '@/engine/content/wardrobe';

/** What the gate's own brand-depth checker holds a headline brand to. */
const TARGET = 100;

const HOUSES = ['Versace', 'Fendi', 'Celine', 'Loewe', 'Burberry', 'Ralph Lauren', 'Givenchy', 'Valentino'] as const;

/** Every piece in the whole catalog under this house's name, not just this file's. */
function piecesOf(brand: string) {
  return shoppableItems().filter((item) => item.brand === brand);
}

describe('eight houses at the depth of a house', () => {
  it('carries a hundred real pieces or more under every one of them', () => {
    for (const house of HOUSES) {
      expect(piecesOf(house).length, `${house} is short of ${TARGET}`).toBeGreaterThanOrEqual(TARGET);
    }
    expect(REAL_MAISONS.length).toBeGreaterThanOrEqual(800);
  });

  it('is a house rather than a rail: bags, shoes, both racks and accessories in each', () => {
    for (const house of HOUSES) {
      const mine = piecesOf(house);
      const has = (test: (item: (typeof mine)[number]) => boolean) => mine.some(test);
      expect(has((i) => i.subcategory === 'bag'), `${house} sells no bag`).toBe(true);
      expect(has((i) => i.category === 'footwear'), `${house} sells no shoes`).toBe(true);
      expect(has((i) => i.category === 'clothing' && i.audience === 'women'), `${house} has no women's rack`).toBe(true);
      expect(has((i) => i.category === 'clothing' && i.audience === 'men'), `${house} has no men's rack`).toBe(true);
      expect(has((i) => i.subcategory === 'eyewear'), `${house} sells no eyewear`).toBe(true);
      expect(has((i) => i.subcategory === 'belt'), `${house} sells no belt`).toBe(true);
      expect(has((i) => i.subcategory === 'wallet'), `${house} sells no small leather goods`).toBe(true);
      // Shoes on both feet: something a man would wear and something a woman would.
      expect(has((i) => i.category === 'footwear' && (i.audience === 'men' || i.audience === 'unisex')), `${house} has no men's shoes`).toBe(true);
      expect(has((i) => i.category === 'footwear' && (i.audience === 'women' || i.audience === 'unisex')), `${house} has no women's shoes`).toBe(true);
    }
  });

  it('has a fragrance counter where the house really has one, and none invented where it does not', () => {
    for (const house of HOUSES) {
      const scents = piecesOf(house).filter((i) => i.subcategory === 'fragrance');
      if (house === 'Fendi') {
        // Fendi's fragrance is not something SLATE can vouch for, so it sells none.
        expect(scents.length, 'Fendi should not have an invented fragrance line').toBe(0);
        continue;
      }
      expect(scents.length, `${house} has no fragrance`).toBeGreaterThanOrEqual(7);
    }
  });

  it('hangs every wearable piece on a peg the wardrobe actually has', () => {
    for (const piece of REAL_MAISONS) {
      if (piece.slot === undefined) continue;
      expect(SLOTS as readonly string[], `${piece.id} hangs on ${piece.slot}`).toContain(piece.slot);
    }
  });

  it('never uses an id or a name twice, here or against the rest of the catalog', () => {
    const ids = new Map<string, number>();
    const names = new Map<string, number>();
    for (const item of shoppableItems()) {
      ids.set(item.id, (ids.get(item.id) ?? 0) + 1);
      names.set(item.name.toLowerCase(), (names.get(item.name.toLowerCase()) ?? 0) + 1);
    }
    expect([...ids.entries()].filter(([, n]) => n > 1).map(([id]) => id)).toEqual([]);
    expect([...names.entries()].filter(([, n]) => n > 1).map(([name]) => name)).toEqual([]);
  });

  it('says on every row that the price is SLATE’s own calibration', () => {
    for (const piece of REAL_MAISONS) {
      expect(piece.source, piece.id).toBe('calibrated_estimate');
      expect(piece.note, piece.id).toBeTruthy();
      expect(piece.basePrice, piece.id).toBeGreaterThan(0);
      expect(piece.quality, piece.id).toBeGreaterThan(0);
    }
  });

  it('gives every house a real shop to be sold in', () => {
    const shops = new Map(RETAILERS.all().map((r) => [r.name, r]));
    for (const house of HOUSES) {
      const shop = shops.get(house);
      expect(shop, `${house} has no retailer`).toBeDefined();
      expect(shop!.categories).toContain('clothing');
      expect(shop!.categories).toContain('footwear');
      expect(shop!.categories).toContain('accessory');
    }
  });
});
