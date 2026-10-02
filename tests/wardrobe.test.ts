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
import { CHANGE_MINUTES, chosenMissing, cleanOutfits, garmentsOf, outfitFor, wearTheDay, wornNow, washableDirty, dryCleanDirty, type Garment } from '@/engine/systems/wardrobe';
import { doLaundry, wearOutfit } from '@/engine/systems/dwelling';
import type { Slot, Care } from '@/engine/content/garmentcare';
import { sellRefusal } from '@/engine/systems/resale';

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
    // The day stands something in for it, and says so, with what and why.
    expect(chosenMissing(sim, sim.player).map((m) => m.why)).toEqual(['in the wash']);
    expect(wearTheDay(sim, sim.player)).toBe(true);
    const told = sim.universe.notifications.at(-1)!;
    expect(told.title).toBe('Not Quite What You Chose');
    expect(told.body).toBe('Dress was in the wash, so T-Shirt and Jeans instead.');
  });

  it('is what they have on once the day dresses them, and a change takes its minutes, wears what goes on, and can’t sell what’s on', () => {
    const sim = life('ward-change');
    const b = basics(sim);
    const shirt = wear(sim, 'Oxford Shirt', 'shirt', 'top')[0]!;
    expect(wearTheDay(sim, sim.player)).toBe(true);
    const morning = sim.player.wornNow!.itemIds;
    expect(morning).toContain(b.jeans.id);
    expect(wornNow(sim.player).map((g) => g.garment.slot).sort()).toEqual(['bottom', 'shoes', 'socks', 'top', 'underwear']);
    const ids = [shirt.id, b.jeans.id, b.under[1]!.id, b.socks[1]!.id, b.shoes.id];
    const start = sim.now;
    const wearsBefore = shirt.garment!.wears;
    expect(sim.execute({ kind: 'clothes.change', payload: { itemIds: ids } }).ok).toBe(true);
    expect(sim.now - start).toBe(CHANGE_MINUTES * 60_000);
    expect(sim.player.wornNow!.itemIds).toEqual(ids);
    expect(sim.player.wornNow!.since).toBe(sim.now);
    expect(shirt.garment!.wears).toBe(wearsBefore + 1);
    expect(sim.player.dressed).toEqual(ids);
    // A dirty piece won't go on.
    b.under[2]!.garment!.dirty = true;
    expect(sim.execute({ kind: 'clothes.change', payload: { itemIds: [shirt.id, b.jeans.id, b.under[2]!.id] } }).error).toBe('Boxers is in the wash.');
    shirt.paid = 30_00;
    expect(sellRefusal(sim, sim.player, shirt as never)).toBe('You’re wearing it.');
  });

  it('won’t be chosen dirty, drying, outgrown or out of reach, and a saved outfit with such a piece isn’t put on', () => {
    const sim = life('ward-refuse');
    const b = basics(sim);
    const ids = [b.tees[0]!.id, b.jeans.id, b.under[0]!.id, b.socks[0]!.id, b.shoes.id];
    const saved = sim.execute<{ outfitId: string }>({ kind: 'clothes.save_outfit', payload: { name: 'Everyday', itemIds: ids } });
    expect(saved.ok, saved.error).toBe(true);
    b.jeans.garment!.dirty = true;
    expect(sim.execute({ kind: 'clothes.dress', payload: { itemIds: ids } }).error).toBe('Jeans is in the wash.');
    expect(sim.execute({ kind: 'clothes.wear_outfit', payload: { outfitId: saved.value!.outfitId } }).error).toBe('Jeans is in the wash.');
    expect(sim.player.dressed ?? []).toEqual([]);
    b.jeans.garment!.dirty = false;
    b.jeans.garment!.dryUntil = sim.now + HOUR;
    expect(sim.execute({ kind: 'clothes.dress', payload: { itemIds: ids } }).error).toBe('Jeans is still drying.');
    delete b.jeans.garment!.dryUntil;
    sim.player.body = { ...(sim.player.body ?? {}), weightKg: 70 } as never;
    b.jeans.garment!.fitKg = 90;
    expect(sim.execute({ kind: 'clothes.dress', payload: { itemIds: ids } }).error).toBe('Jeans is too big now.');
    b.jeans.garment!.fitKg = 50;
    expect(sim.execute({ kind: 'clothes.dress', payload: { itemIds: ids } }).error).toBe('Jeans is too small now.');
    delete b.jeans.garment!.fitKg;
    b.jeans.condition = 0;
    expect(sim.execute({ kind: 'clothes.dress', payload: { itemIds: ids } }).error).toBe('Jeans is worn out.');
    b.jeans.condition = 1;
    expect(sim.execute({ kind: 'clothes.wear_outfit', payload: { outfitId: saved.value!.outfitId } }).ok).toBe(true);
    expect(sim.player.dressed).toEqual(ids);
    // Only the piece that couldn't go on is named, and only what stood in for it.
    wear(sim, 'Chinos', 'chinos', 'bottom');
    b.jeans.garment!.dirty = true;
    expect(wearTheDay(sim, sim.player)).toBe(true);
    expect(sim.universe.notifications.at(-1)!.body).toBe('Jeans was in the wash, so Chinos instead.');
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
