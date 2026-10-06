/**
 * A wash chosen (the master plan's §27c, from 2026-10-06): the garments
 * named go in and nothing else, clean or not; and a home's own wash is dried
 * on the rack or in the dryer, the rack's a day's wait and no dryer run.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_HOUR } from '@/engine/core/time';
import { breaches } from '@/engine/core/invariants';
import { garmentsOf, wearable } from '@/engine/systems/wardrobe';
import { LAUNDRY, laundryWay, livingOf } from '@/engine/systems/dwelling';
import { ownBuilt, type HomeFacts } from '@/engine/systems/homes';
import { homeKeyOf } from '@/engine/systems/items';

const life = (seed: string) => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);
/** A house of their own with its own washer and dryer, lived in, their clothes carried there. */
const ownMachines = (sim: ReturnType<typeof life>) => {
  const facts: HomeFacts = { type: 'house', address: 'Test House', beds: 2, baths: 1, size: 1_200, built: 2000, features: [], parts: {}, hoaUsd: 0, fixtures: { bathtub: true, dishwasher: true, laundry: 'in-unit', cooling: 'none', outdoor: 'none', gym: 'none' } };
  const home = ownBuilt(sim, sim.player, { cityId: 'us-ny-newyork', facts, price: 600_000_00, closing: 0 });
  const from = homeKeyOf(sim.player.home);
  sim.player.home = { kind: 'owned', cityId: 'us-ny-newyork', since: sim.now, homeId: home.id };
  const to = homeKeyOf(sim.player.home)!;
  for (const i of sim.player.items ?? []) if (i.at.kind === 'home' && i.at.home === from) i.at = { ...i.at, home: to };
  return sim;
};

describe('a wash chosen', () => {
  it('washes only the garments named, and dries them on the rack without the dryer, ready the next day', () => {
    const sim = ownMachines(life('laundry-choice'));
    expect(laundryWay(sim, sim.player)).toBe('in-unit');
    const [one, other] = garmentsOf(sim.player).filter((g) => g.garment.care !== 'dry-clean' && g.garment.slot === 'top');
    other!.garment.dirty = true;
    const washes = [one!.garment.washes, other!.garment.washes];
    const dryer = livingOf(sim.player).loads?.dryer ?? 0;
    sim.must({ kind: 'life.look_after', payload: { action: 'laundry', itemIds: [one!.id], dry: 'rack' } });
    // The one named was washed, clean as it was; the other, dirty, left for its own wash.
    expect(one!.garment.washes).toBe(washes[0]! + 1);
    expect(other!.garment.washes).toBe(washes[1]);
    expect(other!.garment.dirty).toBe(true);
    // On the rack: no dryer run, and not dry until the rack's hours are up.
    expect(livingOf(sim.player).loads?.dryer ?? 0).toBe(dryer);
    expect(wearable(sim, sim.player, one!)).toBe(false);
    sim.advanceBy((LAUNDRY.readyHours['washer-only'] + 1) * MS_HOUR);
    expect(wearable(sim, sim.player, one!)).toBe(true);
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('dries in the dryer by default, or on the rack once that’s the habit', () => {
    const sim = ownMachines(life('laundry-habit'));
    const dirty = () => { for (const g of garmentsOf(sim.player).filter((x) => x.garment.care !== 'dry-clean').slice(0, 3)) g.garment.dirty = true; };
    dirty();
    const before = livingOf(sim.player).loads?.dryer ?? 0;
    sim.must({ kind: 'life.look_after', payload: { action: 'laundry' } });
    expect(livingOf(sim.player).loads?.dryer ?? 0).toBeGreaterThan(before);
    sim.must({ kind: 'clothes.dry_by', payload: { by: 'rack' } });
    dirty();
    const after = livingOf(sim.player).loads?.dryer ?? 0;
    sim.advanceBy(4 * MS_HOUR);
    sim.must({ kind: 'life.look_after', payload: { action: 'laundry' } });
    expect(livingOf(sim.player).loads?.dryer ?? 0).toBe(after);
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('refuses a wash of nothing, of something not theirs, and of what’s dry-clean only', () => {
    const sim = life('laundry-refused');
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'laundry', itemIds: [] } }).error).toBe('Choose what goes in the wash.');
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'laundry', itemIds: ['no-such'] } }).error).toBe('That isn’t a garment of yours to hand.');
    const dc = garmentsOf(sim.player).find((g) => g.garment.care === 'dry-clean');
    if (dc) expect(sim.execute({ kind: 'life.look_after', payload: { action: 'laundry', itemIds: [dc.id] } }).error).toBe(`${dc.label} is dry-clean only.`);
    expect(sim.execute({ kind: 'clothes.dry_by', payload: { by: 'outside' } }).error).toBe('On the rack or in the dryer.');
  });
});
