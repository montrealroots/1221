/**
 * Clothes sold on and running shoes worn down (`systems/resale.ts`, from
 * 2026-10-02): Vinted's 28% in Britain, a ThredUp bag's bands less its fee
 * in America, Kijiji's half in Canada, none in Mexico; a run's six miles of
 * a pair's 400.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { starterWardrobe } from '@/engine/systems/clothing';
import { garmentsOf } from '@/engine/systems/wardrobe';
import { trainingAt } from '@/engine/systems/dwelling';
import { RUN_MILES, SHOE_MILES, resaleOf, runInShoes, sellRefusal } from '@/engine/systems/resale';

const life = (seed: string, city: string) => { const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed); starterWardrobe(sim, sim.player); return sim; };
const priced = (sim: Simulation, label: string, paid: number) => { const g = garmentsOf(sim.player).find((x) => x.label === label && !x.paid)!; g.paid = paid; return g; };
const bank = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!.balance;

describe('selling clothes', () => {
  it('on Vinted in London, 28% of the price new, no fee; the garment gone', () => {
    const sim = life('rs-ldn', 'uk-eng-london');
    const g = priced(sim, 'Jeans', 50_00);
    const before = bank(sim);
    const r = sim.execute<{ paid: number }>({ kind: 'clothes.sell', payload: { itemIds: [g.id] } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.paid).toBe(14_00);
    expect(bank(sim) - before).toBe(14_00);
    expect(garmentsOf(sim.player).some((x) => x.id === g.id)).toBe(false);
  });

  it('in a ThredUp bag in New York, each sale’s band, less $14.99, never below nothing', () => {
    const sim = life('rs-ny', 'us-ny-newyork');
    const coat = priced(sim, 'Coat', 400_00);
    // Sells at $112: the 70% band, $78.40, less the fee.
    expect(resaleOf(sim, sim.player, [coat]).paid).toBe(Math.round((112 * 0.7 - 14.99) * 100));
    const tee = priced(sim, 'T-Shirt', 10_00);
    // $2.80 sells nothing, and the fee takes no more than the bag made.
    expect(resaleOf(sim, sim.player, [tee]).paid).toBe(0);
  });

  it('on Kijiji in Toronto at half; none in Mexico City; not dirty, not unpriced', () => {
    const to = life('rs-to', 'ca-on-toronto');
    const j = priced(to, 'Jeans', 60_00);
    expect(resaleOf(to, to.player, [j]).paid).toBe(30_00);
    const unpriced = garmentsOf(to.player).find((x) => !x.paid)!;
    expect(sellRefusal(to, to.player, unpriced)).toBe('Its price new isn’t known, so it isn’t sold.');
    j.garment.dirty = true;
    expect(sellRefusal(to, to.player, j)).toBe('Only clean clothes that aren’t worn out sell.');
    const mx = life('rs-mx', 'mx-cmx-mexicocity');
    expect(sellRefusal(mx, mx.player, priced(mx, 'Jeans', 500_00))).toBe('No source gives what clothes sell for here.');
  });
});

describe('running shoes', () => {
  it('a run takes six miles of the sneakers’ 400, not the dress shoes’', () => {
    const sim = life('rs-run', 'us-ny-newyork');
    const sneakers = garmentsOf(sim.player).find((g) => g.label === 'Sneakers')!;
    const dress = garmentsOf(sim.player).find((g) => g.label === 'Dress Shoes')!;
    runInShoes(sim, sim.player);
    expect(sneakers.condition).toBeCloseTo(1 - RUN_MILES / SHOE_MILES, 9);
    expect(dress.condition).toBe(1);
    for (let i = 0; i < 70; i += 1) runInShoes(sim, sim.player);
    expect(sneakers.condition).toBe(0);
  });

  it('a workout that is a run wears them; one in a gym doesn’t', () => {
    let sim = life('rs-workout-0', 'us-ny-newyork');
    for (let i = 1; i < 40 && trainingAt(sim, sim.player).where !== 'run'; i += 1) sim = life(`rs-workout-${i}`, 'us-ny-newyork');
    expect(trainingAt(sim, sim.player).where).toBe('run');
    const sneakers = garmentsOf(sim.player).find((g) => g.label === 'Sneakers')!;
    sim.player.wellbeing.energy = 90;
    const r = sim.execute({ kind: 'life.look_after', payload: { action: 'exercise' } });
    expect(r.ok, r.error).toBe(true);
    expect(sneakers.condition).toBeCloseTo(1 - RUN_MILES / SHOE_MILES, 9);
  });

  it('a garment away from where you are isn’t sold', () => {
    const sim = life('rs-away', 'uk-eng-london');
    const g = priced(sim, 'Jeans', 50_00);
    sim.player.currentLocationId = 'us-ny-newyork';
    expect(sellRefusal(sim, sim.player, g)).toBe('It isn’t to hand.');
  });
});
