/**
 * Worn-out clothes bought again on a free day (`replaceWornOut`, the Replace
 * Worn-Out Clothes shortcut), kept to the wardrobe's own counts.
 *
 * Found by the screens check of 2026-10-06: a New York life played to 60 held
 * 463 pairs of underwear among its 490 things, and its Belongings took 8.9
 * seconds to open. A pair worn out was bought again as a whole pack, a 4-pack
 * for one pair, and only the one thrown away, so each wear added three. A
 * kind the starting wardrobe counts is now bought back up to that count, and a
 * pair worn out with enough left is thrown away and not bought again.
 */
import { describe, expect, it } from 'vitest';
import { loadSave, quickSave } from '@/engine';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { MS_DAY } from '@/engine/core/time';
import { breaches } from '@/engine/core/invariants';
import { STARTER, replaceWornOut } from '@/engine/systems/clothing';
import { garmentsOf } from '@/engine/systems/wardrobe';
import type { Simulation } from '@/engine/core/simulation';

const NY = 'us-ny-newyork';
const life = (seed: string) => quickSave({ startLocationId: NY, homeRegionId: NY, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const underwear = (sim: Simulation) => garmentsOf(sim.player).filter((g) => g.garment.slot === 'underwear' && g.garment.kind === 'underwear');
const target = STARTER.filter((s) => s.slot === 'underwear' && s.kind === 'underwear').reduce((n, s) => n + s.count, 0);
/** Wear standing in for years of it: one pair worn through. */
const wearOne = (sim: Simulation) => { const g = underwear(sim).find((x) => x.condition > 0)!; g.condition = 0; return g.id; };

describe('worn-out clothes bought again', () => {
  it('on a free day, by the shortcut, the worn pair gone and the drawer back to its count', () => {
    let sim = life('replace-day');
    sim.must({ kind: 'life.set_automation', payload: { key: 'replaceClothes', on: true } });
    const before = underwear(sim).length;
    expect(before).toBe(target);
    const worn = wearOne(sim);
    sim = loadSave(deserialise(serialise(sim.universe)) as never);
    // A few days, so one of them is free.
    sim.advanceBy(4 * MS_DAY);
    expect(underwear(sim).some((g) => g.id === worn)).toBe(false);
    expect(underwear(sim).filter((g) => g.condition > 0).length).toBeGreaterThanOrEqual(target);
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('wears out pair after pair for years and the drawer never grows past a pack over its count', () => {
    const sim = life('replace-years');
    let most = 0;
    for (let n = 0; n < 80; n += 1) {
      wearOne(sim);
      replaceWornOut(sim, sim.player);
      const count = underwear(sim).length;
      most = Math.max(most, count);
      // None worn out is kept, and none short.
      expect(underwear(sim).every((g) => g.condition > 0)).toBe(true);
      expect(count).toBeGreaterThanOrEqual(target);
    }
    // A pack bought to make up the count leaves at most a pack less one over it.
    expect(most).toBeLessThan(target + 10);
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('with plenty left, throws the worn pair away and buys nothing', () => {
    const sim = life('replace-plenty');
    // One pair worn out, and bought back up to the count.
    wearOne(sim);
    replaceWornOut(sim, sim.player);
    const have = underwear(sim).length;
    // New York's cheapest underwear is a multi-pack, so making up one pair leaves some over.
    expect(have).toBeGreaterThan(target);
    const spent = sim.universe.transactions.length;
    wearOne(sim);
    replaceWornOut(sim, sim.player);
    expect(underwear(sim).length).toBe(have - 1);
    expect(sim.universe.transactions.length).toBe(spent);
    expect(breaches(sim.universe)).toEqual([]);
  });
});
