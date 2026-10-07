/**
 * Shopping carried home by hand (`CARRY_KG`, `carriedKg`, `stow` in
 * `systems/trips.ts`, from 2026-10-05): on foot or by transit, what's bought
 * goes in hand up to NIOSH's 23 kg; in the car, the car's cargo holds it
 * instead. Past it, until 2026-10-06, it wasn't bought; from then, where they
 * live, a second trip takes the load home and comes back (`secondTrip`), and
 * away it still isn't bought.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { GROCERY_PRODUCTS } from '@/engine/content/groceries';
import { groceryRefusal } from '@/engine/systems/kitchen';
import { CARRY_KG, carriedKg, leg, waitingShopping } from '@/engine/systems/trips';
import type { Simulation } from '@/engine/core/simulation';

const life = (seed: string) => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);
/** A gallon of milk or the heaviest thing on the shelf. */
const heaviest = (sim: Simulation) => GROCERY_PRODUCTS.filter((g) => !groceryRefusal(sim, sim.player, g.id, 1) && g.sizeUnit !== 'ct').sort((a, b) => b.sizeQty - a.sizeQty)[0]!;

describe('shopping carried home', () => {
  it('goes in hand up to 23 kg on foot; past it, a second trip home and back, the load left inside the door', () => {
    const sim = life('carry');
    const heavy = heaviest(sim);
    sim.must({ kind: 'errand.go', payload: { to: 'shopping', by: 'foot' } });
    const oneCarry = Math.floor(CARRY_KG / (heavy.sizeQty / 1000));
    for (let n = 0; n < oneCarry; n += 1) sim.must({ kind: 'food.buy_groceries', payload: { productId: heavy.id } });
    expect(CARRY_KG).toBe(23);
    expect(carriedKg(sim.player)).toBeLessThanOrEqual(CARRY_KG);
    expect(carriedKg(sim.player) + heavy.sizeQty / 1000).toBeGreaterThan(CARRY_KG);
    const km = sim.player.trip!.km;
    const before = sim.now;
    // One more: the load in hand home, and back to the shops, the shopping leg twice.
    sim.must({ kind: 'food.buy_groceries', payload: { productId: heavy.id } });
    const walk = leg('us-ny-newyork', 'foot', 'shopping');
    expect(sim.now - before).toBeGreaterThanOrEqual(Math.round(2 * walk.minutes * 60_000));
    expect(sim.player.trip!.km).toBeCloseTo(km + 2 * walk.km, 6);
    expect(carriedKg(sim.player)).toBeCloseTo(heavy.sizeQty / 1000, 6);
    const waiting = waitingShopping(sim.player);
    expect(waiting).toHaveLength(oneCarry + 1);
    expect(waiting.filter((i) => i.at.kind === 'home' && i.at.spot === undefined)).toHaveLength(oneCarry);
    // Home, it's all put away as any shopping is.
    sim.must({ kind: 'errand.go', payload: { to: 'home' } });
    expect(sim.must<{ put: number }>({ kind: 'items.put_away', payload: {} }).put).toBe(oneCarry + 1);
    expect(waitingShopping(sim.player)).toHaveLength(0);
  });

  it('staying out of the house, past one carry isn’t bought', () => {
    const sim = life('carry-away');
    // A hotel booked in their own town: they aren't going home, so there's nowhere to take a load.
    sim.must({ kind: 'travel.stay_here', payload: { nights: 1 } });
    const heavy = heaviest(sim);
    sim.must({ kind: 'errand.go', payload: { to: 'shopping', by: 'foot' } });
    let refused: string | undefined;
    for (let n = 0; n < 40 && !refused; n += 1) {
      const r = sim.execute({ kind: 'food.buy_groceries', payload: { productId: heavy.id } });
      if (!r.ok) refused = r.error;
    }
    expect(refused).toMatch(/^That’s more than you can carry home: [\d.]+ kg in hand already, of about 23\.$/);
  });
});
