/**
 * Clothes as real garments, worn and washed (`systems/wardrobe.ts`,
 * `content/garmentcare.ts`, from 2026-10-01): a day's outfit from what's to
 * hand and clean, each kind's wears between washes, a wash's toll on its
 * life, drying, dry cleaning kept out of the machine, and an outfit chosen.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { addItem, homeKeyOf, type Item } from '@/engine/systems/items';
import { cleanOutfits, garmentsOf, outfitFor, wearTheDay, washableDirty, dryCleanDirty, type Garment } from '@/engine/systems/wardrobe';
import { doLaundry, wearOutfit } from '@/engine/systems/dwelling';
import type { Slot, Care } from '@/engine/content/garmentcare';

const HOUR = 3_600_000;
/** A life with its starter wardrobe put away, for the tests' own garments. */
function life(seed: string): Simulation {
  const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.player.items = (sim.player.items ?? []).filter((i) => !i.garment);
  return sim;
}
function wear(sim: Simulation, label: string, kind: string, slot: Slot, care: Care = 'wash', n = 1): Item[] {
  return Array.from({ length: n }, () => addItem(sim, sim.player, { kind: `test:${kind}`, label, quantity: 1, condition: 1, at: { kind: 'home', home: homeKeyOf(sim.player.home)!, spot: 'wardrobe' }, acquiredAt: sim.now, garment: { kind, slot, care, wears: 0, washes: 0 } as Garment }));
}
/** A small wardrobe: three T-shirts, a pair of jeans, three of underwear and socks, and shoes. */
function basics(sim: Simulation) {
  return { tees: wear(sim, 'T-Shirt', 't-shirt', 'top', 'wash', 3), jeans: wear(sim, 'Jeans', 'jeans', 'bottom')[0]!, under: wear(sim, 'Boxers', 'underwear', 'underwear', 'wash', 3), socks: wear(sim, 'Socks', 'socks', 'socks', 'wash', 3), shoes: wear(sim, 'Sneakers', 'shoes', 'shoes')[0]! };
}

describe('a day’s outfit', () => {
  it('is a top and a bottom, underwear, socks and shoes, all to hand and clean; none without each', () => {
    const sim = life('ward-outfit');
    const b = basics(sim);
    const outfit = outfitFor(sim, sim.player)!;
    expect(outfit.map((g) => g.garment.slot).sort()).toEqual(['bottom', 'shoes', 'socks', 'top', 'underwear']);
    expect(cleanOutfits(sim, sim.player)).toBe(3);
    // Away from home, the wardrobe isn't to hand.
    sim.player.currentLocationId = 'us-ca-losangeles';
    expect(outfitFor(sim, sim.player)).toBeUndefined();
    sim.player.currentLocationId = 'us-ny-newyork';
    // No shoes, no outfit.
    b.shoes.condition = 0;
    expect(outfitFor(sim, sim.player)).toBeUndefined();
  });

  it('wears a T-shirt, underwear and socks once before the wash, and jeans about three times', () => {
    const sim = life('ward-wears');
    const b = basics(sim);
    expect(wearTheDay(sim, sim.player)).toBe(true);
    const dirtyAfterOne = garmentsOf(sim.player).filter((g) => g.garment.dirty).map((g) => g.garment.kind).sort();
    expect(dirtyAfterOne).toEqual(['socks', 't-shirt', 'underwear']);
    expect(b.jeans.garment!.dirty).toBeFalsy();
    wearTheDay(sim, sim.player);
    wearTheDay(sim, sim.player);
    expect(b.jeans.garment!.dirty).toBe(true);
    // Nothing clean left: the day can't be dressed for.
    expect(wearTheDay(sim, sim.player)).toBe(false);
    expect(wearOutfit(sim, sim.player)).toBe(false);
  });

  it('puts on the outfit chosen, while it’s clean and to hand', () => {
    const sim = life('ward-chosen');
    const b = basics(sim);
    const dress = wear(sim, 'Dress', 'dress', 'dress')[0]!;
    sim.player.dressed = [dress.id];
    expect(outfitFor(sim, sim.player)!.map((g) => g.id)).toContain(dress.id);
    expect(outfitFor(sim, sim.player)!.some((g) => g.garment.slot === 'top')).toBe(false);
    dress.garment!.dirty = true;
    expect(outfitFor(sim, sim.player)!.some((g) => g.id === b.jeans.id)).toBe(true);
  });
});

describe('the laundry', () => {
  it('washes what’s dirty and to hand, wearable once dry, each wash its share of the kind’s life', () => {
    const sim = life('ward-wash');
    basics(sim);
    const suit = wear(sim, 'Suit', 'suit', 'suit', 'dry-clean')[0]!;
    suit.garment!.dirty = true;
    wearTheDay(sim, sim.player);
    expect(washableDirty(sim, sim.player)).toHaveLength(3);
    expect(dryCleanDirty(sim, sim.player).map((g) => g.id)).toEqual([suit.id]);
    expect(doLaundry(sim, sim.player, sim.now)).toBe(true);
    const tee = garmentsOf(sim.player).find((g) => g.garment.kind === 't-shirt' && g.garment.washes === 1)!;
    expect(tee.garment.dirty).toBe(false);
    // A T-shirt lasts 17.3 washes.
    expect(tee.condition).toBeCloseTo(1 - 1 / 17.3, 10);
    // The suit stays out of the machine.
    expect(suit.garment!.dirty).toBe(true);
    // Still drying, it can't be worn until it's dry: a building's machines dry it in two hours (`LAUNDRY.readyHours`).
    expect(tee.garment.dryUntil!).toBeGreaterThan(sim.now);
    sim.player.dressed = [tee.id];
    expect(outfitFor(sim, sim.player)?.some((g) => g.id === tee.id) ?? false).toBe(false);
    expect(outfitFor(sim, sim.player, tee.garment.dryUntil! + HOUR)!.some((g) => g.id === tee.id)).toBe(true);
  });
});
