/**
 * What a thing you own is found by (`systems/itemfacets.ts`, from
 * 2026-10-02): kind, color, size, condition, and clean or not.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { garmentsOf } from '@/engine/systems/wardrobe';
import { suppliesOf } from '@/engine/systems/hygiene';
import { facetsOf, passes } from '@/engine/systems/itemfacets';
import type { Item } from '@/engine/systems/items';

describe('a thing’s facets', () => {
  const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'facets');
  const shirt = garmentsOf(sim.player).find((g) => g.garment.slot === 'top')!;

  it('names a garment’s kind by its slot, and whether it’s clean', () => {
    delete shirt.garment.dirty;
    expect(facetsOf(shirt, sim.now)).toMatchObject({ kind: 'Tops', condition: 'Good', state: 'Clean' });
    shirt.garment.dirty = true;
    expect(facetsOf(shirt, sim.now).state).toBe('To Wash');
    delete shirt.garment.dirty;
    shirt.garment.dryUntil = sim.now + 3_600_000;
    expect(facetsOf(shirt, sim.now).state).toBe('Drying');
    delete shirt.garment.dryUntil;
    expect(facetsOf(suppliesOf(sim.player)[0]!, sim.now).kind).toBe('Bathroom And Cleaning');
  });

  it('bands condition, and reads color and size where bought in them', () => {
    const worn: Item = { ...shirt, condition: 0.5, spec: { color: 'Navy', size: 'M' } };
    expect(facetsOf(worn, sim.now)).toMatchObject({ condition: 'Worn', color: 'Navy', size: 'M' });
    expect(facetsOf({ ...shirt, condition: 0.39 }, sim.now).condition).toBe('Worn Out');
    expect(facetsOf({ ...shirt, condition: 0.75 }, sim.now).condition).toBe('Good');
  });

  it('passes a filter only where every facet chosen matches, and the words are in its name', () => {
    const navy: Item = { ...shirt, spec: { color: 'Navy' } };
    expect(passes(navy, { kind: 'Tops', color: 'Navy' }, sim.now)).toBe(true);
    expect(passes(navy, { kind: 'Tops', color: 'Black' }, sim.now)).toBe(false);
    expect(passes(navy, { kind: 'Bottoms' }, sim.now)).toBe(false);
    expect(passes(navy, { words: shirt.label.slice(0, 3).toUpperCase() }, sim.now)).toBe(true);
    expect(passes(navy, { words: 'zzz-nothing' }, sim.now)).toBe(false);
    expect(passes(navy, {}, sim.now)).toBe(true);
  });
});
