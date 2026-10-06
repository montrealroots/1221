/**
 * Clothes taken off at a change (the master plan's §32e, from 2026-10-06):
 * at home, what's come off goes in the laundry basket where its wears have
 * made it due a wash, and back where it's kept where not; away, it stays
 * with them. Until then a change only said what was on.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { breaches } from '@/engine/core/invariants';
import { garmentsOf, wearable, keptIn } from '@/engine/systems/wardrobe';
import { careFor } from '@/engine/content/garmentcare';

const life = (seed: string) => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);

describe('a change of clothes', () => {
  it('puts what came off and is due a wash in the basket, and the rest back where it’s kept', () => {
    const sim = life('take-off');
    sim.advanceBy(MS_DAY);
    const pick = (slot: string, not: readonly string[] = []) => garmentsOf(sim.player).find((g) => g.garment.slot === slot && wearable(sim, sim.player, g) && !not.includes(g.id))!;
    const first = ['top', 'bottom', 'underwear', 'socks', 'shoes'].map((s) => pick(s));
    // The top one wear from its wash: this change makes it due.
    const top = first[0]!;
    top.garment.wears = careFor(top.garment.kind).wearsBetween - 1;
    sim.must({ kind: 'clothes.change', payload: { itemIds: first.map((g) => g.id) } });
    expect(top.garment.dirty).toBe(true);
    const second = ['top', 'bottom', 'underwear', 'socks', 'shoes'].map((s) => pick(s, first.map((g) => g.id)));
    sim.must({ kind: 'clothes.change', payload: { itemIds: second.map((g) => g.id) } });
    // The top due a wash, in the basket; the bottom, not yet, back in the drawers.
    expect(top.at.kind === 'home' && top.at.spot).toBe('hamper');
    const bottom = first[1]!;
    expect(bottom.garment.dirty).toBeFalsy();
    expect(bottom.at.kind === 'home' && bottom.at.spot).toBe(keptIn(bottom.garment.slot));
    // In the basket, it isn't put on again until it's washed.
    expect(wearable(sim, sim.player, top)).toBe(false);
    expect(breaches(sim.universe)).toEqual([]);
  });
});
