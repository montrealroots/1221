/**
 * A suitcase packed for going away and unpacked at home (`systems/luggage.ts`,
 * from 2026-10-01): leaving the town they live in packs a week's clothes and
 * the bathroom's things, which go with them; coming home puts them back.
 * Until then a life away had nothing to wear and no toothbrush.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { moveTo, packedIn, suitcaseOf } from '@/engine/systems/luggage';
import { cleanOutfits, garmentsOf } from '@/engine/systems/wardrobe';
import { dailyCare, showerUses } from '@/engine/systems/hygiene';
import { reachable, usedL, volumeOf } from '@/engine/systems/items';
import { GARMENT_L } from '@/engine/content/garmentcare';

const life = (seed: string) => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);

describe('a suitcase', () => {
  it('a life starts with a carry-on in storage', () => {
    const sim = life('bag');
    const bag = suitcaseOf(sim.player)!;
    expect(bag.holdsL).toBe(45);
    expect(bag.at).toMatchObject({ kind: 'home', spot: 'storage' });
  });

  it('is packed with a week’s clothes and the bathroom’s things on leaving town, so away there’s something to wear and wash with', () => {
    const sim = life('bag-away');
    moveTo(sim.player, 'us-ca-losangeles');
    const bag = suitcaseOf(sim.player)!;
    expect(bag.at.kind).toBe('person');
    const packed = garmentsOf(sim.player).filter((g) => g.at.kind === 'inside');
    expect(packed.filter((g) => g.garment.slot === 'top')).toHaveLength(7);
    expect(packed.filter((g) => g.garment.slot === 'underwear')).toHaveLength(7);
    expect(packed.filter((g) => g.garment.slot === 'bottom')).toHaveLength(3);
    expect(packed.every((g) => reachable(sim, sim.player, g.at))).toBe(true);
    expect(cleanOutfits(sim, sim.player)).toBeGreaterThan(0);
    expect(showerUses(sim, sim.player)).toBe(100);
    expect(dailyCare(sim, sim.player)).toBe(0);
    // What stayed home is out of reach.
    expect(garmentsOf(sim.player).some((g) => g.at.kind === 'home' && !reachable(sim, sim.player, g.at))).toBe(true);
  });

  it('goes on to the next town with them, and is unpacked at home', () => {
    const sim = life('bag-home');
    moveTo(sim.player, 'us-ca-losangeles');
    moveTo(sim.player, 'uk-eng-london');
    expect(suitcaseOf(sim.player)!.at.kind).toBe('person');
    moveTo(sim.player, 'us-ny-newyork');
    expect(suitcaseOf(sim.player)!.at).toMatchObject({ kind: 'home', spot: 'storage' });
    expect(sim.player.items!.some((i) => i.at.kind === 'inside')).toBe(false);
    expect(garmentsOf(sim.player).every((g) => g.at.kind === 'home')).toBe(true);
  });

  it('leaves dirty clothes at home, takes one of each toiletry, and puts them back in the bathroom', () => {
    const sim = life('bag-dirty');
    for (const g of garmentsOf(sim.player)) if (g.garment.kind === 't-shirt') g.garment.dirty = true;
    const paste = sim.player.items!.find((i) => i.supply?.kind === 'toothpaste')!;
    sim.player.items!.push({ ...paste, id: 'paste-2' });
    moveTo(sim.player, 'us-ca-losangeles');
    const packed = sim.player.items!.filter((i) => i.at.kind === 'inside');
    expect(packed.some((i) => i.garment?.kind === 't-shirt')).toBe(false);
    expect(packed.filter((i) => i.supply?.kind === 'toothpaste')).toHaveLength(1);
    moveTo(sim.player, 'us-ny-newyork');
    expect(sim.player.items!.filter((i) => i.supply).every((i) => i.at.kind === 'home' && i.at.spot === 'bathroom')).toBe(true);
  });

  it('carries the outfit they chose', () => {
    const sim = life('bag-chosen');
    const tops = garmentsOf(sim.player).filter((g) => g.garment.slot === 'top');
    sim.player.dressed = [tops[tops.length - 1]!.id];
    moveTo(sim.player, 'us-ca-losangeles');
    expect(garmentsOf(sim.player).find((g) => g.id === tops[tops.length - 1]!.id)!.at.kind).toBe('inside');
  });
});

describe('packing by hand', () => {
  it('takes what was packed as it was, and packs a week only into an empty suitcase', () => {
    const sim = life('bag-hand');
    const bag = suitcaseOf(sim.player)!;
    // Wait for the life's starter wardrobe and things to be given.
    sim.advanceBy(26 * 3_600_000);
    const shirt = garmentsOf(sim.player).find((g) => g.garment.slot === 'top' && g.at.kind === 'home')!;
    const r = sim.execute({ kind: 'items.move', payload: { itemId: shirt.id, to: { kind: 'inside', itemId: bag.id } } });
    expect(r.ok, r.error).toBe(true);
    moveTo(sim.player, 'us-ca-losangeles');
    expect(packedIn(sim.player, bag).map((i) => i.id)).toEqual([shirt.id]);
  });

  it('fills to the suitcase’s liters and no further, by hand or by Pack For Me', () => {
    const sim = life('bag-full');
    sim.advanceBy(26 * 3_600_000);
    const bag = suitcaseOf(sim.player)!;
    // A bag a third the size takes only what fits.
    bag.holdsL = 15;
    const a = sim.execute<{ packed: number; usedL: number }>({ kind: 'luggage.pack', payload: {} });
    expect(a.ok, a.error).toBe(true);
    expect(a.value!.usedL).toBeLessThanOrEqual(15 + 1e-9);
    expect(a.value!.usedL).toBeGreaterThan(10);
    expect(a.value!.usedL).toBeCloseTo(usedL(sim.player, bag.id), 9);
    // A pair of jeans left at home doesn't fit what's left: refused, naming the room.
    const jeans = garmentsOf(sim.player).find((g) => g.garment.slot === 'bottom' && g.at.kind === 'home')!;
    expect(volumeOf(jeans)).toBe(GARMENT_L.bottom);
    bag.holdsL = usedL(sim.player, bag.id) + 1;
    expect(sim.execute({ kind: 'items.move', payload: { itemId: jeans.id, to: { kind: 'inside', itemId: bag.id } } }).error).toMatch(/has 1 liters left; the .+ needs 2./);
    // Unpacked at home, everything back where it keeps.
    const u = sim.execute<{ unpacked: number }>({ kind: 'luggage.unpack', payload: {} });
    expect(u.ok, u.error).toBe(true);
    expect(packedIn(sim.player, bag)).toHaveLength(0);
    expect(sim.execute({ kind: 'luggage.unpack', payload: {} }).error).toBe('The suitcase is empty.');
    // Away, it's packed and unpacked at home only.
    sim.player.currentLocationId = 'us-ca-losangeles';
    expect(sim.execute({ kind: 'luggage.pack', payload: {} }).error).toBe('You pack and unpack at home.');
  });
});

describe('unpacked where they’re staying', () => {
  it('goes into the room, to hand, and is packed back on leaving while the bag holds it; the rest is left', () => {
    const sim = life('bag-stay');
    moveTo(sim.player, 'us-ca-losangeles');
    sim.player.stay = { kind: 'hotel', cityId: 'us-ca-losangeles' } as never;
    const bag = suitcaseOf(sim.player)!;
    const n = packedIn(sim.player, bag).length;
    expect(sim.must<{ unpacked: number }>({ kind: 'luggage.unpack', payload: {} }).unpacked).toBe(n);
    const room = sim.player.items!.filter((i) => i.at.kind === 'stay');
    expect(room).toHaveLength(n);
    expect(room.every((i) => reachable(sim, sim.player, i.at))).toBe(true);
    expect(cleanOutfits(sim, sim.player)).toBeGreaterThan(0);
    // Something bought on the way too big to go back in: left behind.
    const extra = { ...room[0]!, id: 'extra', quantity: 100 };
    sim.player.items!.push(extra);
    delete sim.player.stay;
    moveTo(sim.player, 'uk-eng-london');
    expect(sim.player.items!.some((i) => i.id === 'extra')).toBe(false);
    expect(packedIn(sim.player, bag)).toHaveLength(n);
    expect(sim.player.items!.some((i) => i.at.kind === 'stay')).toBe(false);
  });
});
