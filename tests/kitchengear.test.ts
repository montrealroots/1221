/**
 * The kitchen's gear, substitutes and effort (`content/kitchengear.ts`,
 * `systems/kitchen.ts`, from 2026-10-03).
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { COOKING_MET, SUBSTITUTES } from '@/engine/content/kitchengear';
import { cookRefusal, gearOffers, kitchenHas, substituteFor } from '@/engine/systems/kitchen';
import { addItem, homeKeyOf } from '@/engine/systems/items';
import { foodOf } from '@/engine/systems/pantry';
import { inSaveMoney } from '@/engine/systems/banking';
import { salesTaxRate } from '@/engine/content/tax';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const food = (sim: Simulation, key: string, left: number, unit: 'g' | 'ct' = 'g') => addItem(sim, sim.player, { kind: `food:${key}`, label: key, quantity: 1, condition: 1, at: { kind: 'home', home: homeKeyOf(sim.player.home)!, spot: 'pantry' }, acquiredAt: sim.now, food: { key, unit, left, expiresAt: sim.now + 30 * MS_DAY } });
const left = (sim: Simulation, key: string) => foodOf(sim.player).filter((i) => i.food.key === key).reduce((n, i) => n + i.food.left, 0);

describe('the kitchen’s gear', () => {
  it('a recipe needing a blender says to buy one; bought at Target’s $26.99 with the tax, the kitchen has it', () => {
    const sim = life('us-ny-newyork', 'gear-blender');
    expect(cookRefusal(sim, sim.player, 'chicken-jalfrezi')).toMatch(/^It needs a blender: buy one for the kitchen\.$/);
    const offer = gearOffers(sim, sim.player).find((g) => g.id === 'us-blender')!;
    expect(offer.cost).toBe(inSaveMoney(sim, Math.round(26.99 * (1 + salesTaxRate('us-ny-newyork', sim.now, 'appliances')) * 100), 'USD'));
    // A model named that isn't sold here is refused; the one named is bought (from 2026-10-05).
    expect(sim.execute({ kind: 'food.buy_gear', payload: { gear: 'blender', offerId: 'uk-blender' } }).error).toBe('That model isn’t sold where you live.');
    const paid = sim.must<{ paid: number }>({ kind: 'food.buy_gear', payload: { gear: 'blender', offerId: offer.id } }).paid;
    expect(paid).toBe(offer.cost);
    expect(kitchenHas(sim.player).has('blender')).toBe(true);
    expect(cookRefusal(sim, sim.player, 'chicken-jalfrezi') ?? '').not.toMatch(/blender/);
    expect(sim.execute({ kind: 'food.buy_gear', payload: { gear: 'blender' } }).error).toBe('Your kitchen has one.');
    // Away from home the gear stays behind.
    sim.player.currentLocationId = 'uk-eng-london';
    expect(kitchenHas(sim.player).has('blender')).toBe(false);
  });

  it('a recipe that needs nothing isn’t refused for it', () => {
    const sim = life('us-ny-newyork', 'gear-none');
    expect(cookRefusal(sim, sim.player, 'easy-overnight-oats') ?? '').not.toMatch(/needs a/);
  });
});

describe('a substitute', () => {
  it('stands in where a recipe is short: oil for butter at NDSU’s 7/8, canned tomatoes for fresh', () => {
    const sim = life('us-ny-newyork', 'subs');
    food(sim, 'oil', 1_000);
    expect(substituteFor(sim, sim.player, 'butter', 'g', 227)).toEqual({ use: 'oil', amount: 210 });
    expect(substituteFor(sim, sim.player, 'butter', 'g', 2_000)).toBeUndefined();
    food(sim, 'tomatoes-canned', 1_000);
    const sub = substituteFor(sim, sim.player, 'tomato', 'ct', 3)!;
    expect(sub.use).toBe('tomatoes-canned');
    expect(sub.amount).toBeCloseTo(454, 6);
    expect(SUBSTITUTES.find((x) => x.for === 'tomato')!.perGram).toBeCloseTo(454 / 369, 9);
  });

  it('is used up in the cooking, and the effort is the Compendium’s 2 METs', () => {
    const sim = life('us-ny-newyork', 'subs-cook');
    const r = 'chicken-and-tomato-jacket-potato';
    // Everything but the fresh tomatoes, and a big can in their place.
    const buy = (id: string, q = 1) => sim.must({ kind: 'food.buy_groceries', payload: { productId: id, quantity: q } });
    buy('thefreshgrocer-bowl-basket-russet-potatoes-5-lb-bag'); buy('thefreshgrocer-perdue-99-fat-free-boneless-skinless-chicken-breasts', 2); buy('thefreshgrocer-chobani-nonfat-plain-greek-yogurt-32-oz'); buy('thefreshgrocer-bowl-basket-yellow-onions-3-lb-bag');
    expect(cookRefusal(sim, sim.player, r)).toMatch(/short of/);
    food(sim, 'tomatoes-canned', 5_000);
    expect(cookRefusal(sim, sim.player, r)).toBeUndefined();
    const extra = sim.player.body!.extra;
    sim.must({ kind: 'food.cook', payload: { recipeId: r } });
    expect(left(sim, 'tomatoes-canned')).toBeLessThan(5_000);
    expect(sim.player.body!.extra).toBeGreaterThan(extra);
    expect(COOKING_MET).toBe(2.0);
  });
});
