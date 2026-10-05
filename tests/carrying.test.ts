/**
 * Shopping carried home by hand (`CARRY_KG`, `carriedKg`, `stow` in
 * `systems/trips.ts`, from 2026-10-05): on foot or by transit, what's bought
 * goes in hand up to NIOSH's 23 kg, and past it isn't bought; in the car, the
 * car's cargo holds it instead.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { GROCERY_PRODUCTS } from '@/engine/content/groceries';
import { groceryRefusal } from '@/engine/systems/kitchen';
import { CARRY_KG, carriedKg } from '@/engine/systems/trips';

const life = (seed: string) => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);

describe('shopping carried home', () => {
  it('goes in hand up to 23 kg on foot, and past it isn’t bought', () => {
    const sim = life('carry');
    // A gallon of milk or the heaviest thing on the shelf, bought again and again on a walk to the shops.
    const heavy = GROCERY_PRODUCTS.filter((g) => !groceryRefusal(sim, sim.player, g.id, 1) && g.sizeUnit !== 'ct').sort((a, b) => b.sizeQty - a.sizeQty)[0]!;
    sim.player.trip = { by: 'foot', fuel: 0, km: 0 } as typeof sim.player.trip;
    let bought = 0;
    let refused: string | undefined;
    for (let n = 0; n < 40 && !refused; n += 1) {
      const r = sim.execute({ kind: 'food.buy_groceries', payload: { productId: heavy.id } });
      if (r.ok) bought += 1; else refused = r.error;
    }
    expect(CARRY_KG).toBe(23);
    expect(refused).toMatch(/^That’s more than you can carry home: [\d.]+ kg in hand already, of about 23\.$/);
    expect(carriedKg(sim.player)).toBeLessThanOrEqual(CARRY_KG);
    expect(carriedKg(sim.player) + heavy.sizeQty / 1000).toBeGreaterThan(CARRY_KG);
    expect(bought).toBe(Math.floor(CARRY_KG / (heavy.sizeQty / 1000)));
  });
});
