/**
 * A suitcase packed for going away and unpacked at home (`systems/luggage.ts`,
 * from 2026-10-01): leaving the town they live in packs a week's clothes and
 * the bathroom's things, which go with them; coming home puts them back.
 * Until then a life away had nothing to wear and no toothbrush.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { moveTo, suitcaseOf } from '@/engine/systems/luggage';
import { cleanOutfits, garmentsOf } from '@/engine/systems/wardrobe';
import { dailyCare, showerUses } from '@/engine/systems/hygiene';
import { reachable } from '@/engine/systems/items';

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
