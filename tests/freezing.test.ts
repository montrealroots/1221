/**
 * Freezing and thawing at home (the master plan's §33h, from 2026-10-06):
 * frozen, a grocery keeps FoodKeeper's freezer time and a cooked dish the
 * leftovers' two months; it isn't cooked or eaten frozen; thawed in the
 * fridge it takes a full day, then meat keeps a day more (USDA's The Big
 * Thaw); and what FoodKeeper gives no freezer time for isn't frozen.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { breaches } from '@/engine/core/invariants';
import { GROCERY_PRODUCTS, LEFTOVERS_FREEZE_DAYS } from '@/engine/content/groceries';
import { THAW } from '@/engine/systems/kitchen';
import { foodOf, stockOf, mealsReady } from '@/engine/systems/pantry';
import { addItem, homeKeyOf } from '@/engine/systems/items';

const life = (seed: string) => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);
/** A grocery put in the fridge as a purchase puts it. */
const stock = (sim: ReturnType<typeof life>, productId: string) => {
  const p = GROCERY_PRODUCTS.find((x) => x.id === productId)!;
  return addItem(sim, sim.player, { kind: p.id, label: p.name, quantity: 1, condition: 1, at: { kind: 'home', home: homeKeyOf(sim.player.home)!, spot: p.storage }, acquiredAt: sim.now, food: { key: p.food, unit: p.sizeUnit, left: p.sizeQty, ...(p.keepsDays === null ? {} : { expiresAt: sim.now + p.keepsDays * MS_DAY }) } });
};

describe('freezing and thawing', () => {
  it('keeps chicken frozen for FoodKeeper’s time, won’t cook it frozen, and thaws it in a day to keep one more', () => {
    const sim = life('freeze-chicken');
    const chicken = GROCERY_PRODUCTS.find((p) => p.market === 'US' && p.food === 'chicken breast' && p.freezeDays !== null) ?? GROCERY_PRODUCTS.find((p) => p.market === 'US' && p.category === 'meat' && p.freezeDays !== null)!;
    const item = stock(sim, chicken.id);
    const fridgeUntil = item.food!.expiresAt!;
    const r = sim.must<{ keepsUntil: number }>({ kind: 'food.freeze', payload: { itemId: item.id } });
    expect(item.at.kind === 'home' && item.at.spot).toBe('freezer');
    expect(r.keepsUntil).toBe(sim.now + chicken.freezeDays! * MS_DAY);
    expect(r.keepsUntil).toBeGreaterThan(fridgeUntil);
    // Frozen, it isn't to hand to cook.
    expect(stockOf(sim, sim.player, chicken.food).some((i) => i.id === item.id)).toBe(false);
    expect(sim.execute({ kind: 'food.freeze', payload: { itemId: item.id } }).error).toBe('It’s frozen already.');
    // Kept past what the fridge would have, still good.
    sim.advanceBy(10 * MS_DAY);
    expect(foodOf(sim.player).some((i) => i.id === item.id)).toBe(true);
    // Thawed in the fridge: a full day before it's usable, then a day.
    const t = sim.must<{ thawsAt: number; keepsUntil: number }>({ kind: 'food.thaw', payload: { itemId: item.id } });
    expect(t.thawsAt).toBe(sim.now + THAW.hours * MS_HOUR);
    expect(t.keepsUntil).toBe(t.thawsAt + THAW.meatDays * MS_DAY);
    expect(stockOf(sim, sim.player, chicken.food).some((i) => i.id === item.id)).toBe(false);
    sim.advanceBy(THAW.hours * MS_HOUR + MS_HOUR);
    expect(stockOf(sim, sim.player, chicken.food).some((i) => i.id === item.id)).toBe(true);
    expect(sim.execute({ kind: 'food.thaw', payload: { itemId: item.id } }).error).toBe('It isn’t frozen.');
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('freezes a cooked dish for the leftovers’ two months, not eaten until thawed', () => {
    const sim = life('freeze-dish');
    const dish = addItem(sim, sim.player, { kind: 'dish', label: 'A Stew', quantity: 1, condition: 1, at: { kind: 'home', home: homeKeyOf(sim.player.home)!, spot: 'fridge' }, acquiredAt: sim.now, food: { key: 'dish', unit: 'ct', left: 2, recipeId: 'x', expiresAt: sim.now + 3 * MS_DAY } });
    const r = sim.must<{ keepsUntil: number }>({ kind: 'food.freeze', payload: { itemId: dish.id } });
    expect(LEFTOVERS_FREEZE_DAYS).toBe(60);
    expect(r.keepsUntil).toBe(sim.now + 60 * MS_DAY);
    expect(mealsReady(sim, sim.player).some((i) => i.id === dish.id)).toBe(false);
    sim.must({ kind: 'food.thaw', payload: { itemId: dish.id } });
    sim.advanceBy(THAW.hours * MS_HOUR + MS_HOUR);
    expect(mealsReady(sim, sim.player).some((i) => i.id === dish.id)).toBe(true);
  });

  it('refuses what FoodKeeper gives no freezer time for, and what isn’t food', () => {
    const sim = life('freeze-refused');
    const none = GROCERY_PRODUCTS.find((p) => p.market === 'US' && p.freezeDays === null && p.storage !== 'freezer')!;
    const item = stock(sim, none.id);
    expect(sim.execute({ kind: 'food.freeze', payload: { itemId: item.id } }).error).toBe(`FoodKeeper gives no freezer time for ${none.name}.`);
    expect(sim.execute({ kind: 'food.freeze', payload: { itemId: 'nothing' } }).error).toBe('That isn’t food of yours.');
  });
});
