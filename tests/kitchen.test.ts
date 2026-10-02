/**
 * Groceries, cooking and leftovers (`systems/kitchen.ts`, `systems/pantry.ts`,
 * from 2026-10-01): a chain's shelf price, the food home to where it keeps
 * and thrown out when it goes off, a recipe cooked from what's in stock in
 * a kitchen that has what it needs, its servings eaten and kept, the day's
 * meals taken from them before groceries are bought, and a drink at home.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { amountIn, cookRefusal, groceryCatalog, groceryPrice, groceryRefusal, productById, unitPrice } from '@/engine/systems/kitchen';
import { foodOf, mealsFromStock, mealsReady, throwOutSpoiled } from '@/engine/systems/pantry';
import { buyTheDaysFood, foodOf as daysFoodCost } from '@/engine/systems/household';
import { bacAt } from '@/engine/systems/alcohol';
import { arrange } from '@/engine/systems/catalog';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const bank = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
const buy = (sim: Simulation, productId: string, quantity = 1) => sim.must({ kind: 'food.buy_groceries', payload: { productId, quantity } });

const P = {
  potatoes: 'thefreshgrocer-bowl-basket-russet-potatoes-5-lb-bag',
  chicken: 'thefreshgrocer-perdue-99-fat-free-boneless-skinless-chicken-breasts',
  tomatoes: 'thefreshgrocer-bowl-basket-grape-tomatoes-pint',
  yogurt: 'thefreshgrocer-chobani-nonfat-plain-greek-yogurt-32-oz',
  onions: 'thefreshgrocer-bowl-basket-yellow-onions-3-lb-bag',
  pizza: 'thefreshgrocer-bowl-basket-thin-crust-margherita-pizza-19-oz',
};
const RECIPE = 'chicken-and-tomato-jacket-potato';

/** Enough for the recipe: four potatoes, four chicken breasts, eight tomatoes, the yogurt and four spring onions. */
function stockUp(sim: Simulation) {
  buy(sim, P.potatoes); buy(sim, P.chicken, 2); buy(sim, P.tomatoes, 4); buy(sim, P.yogurt); buy(sim, P.onions);
}

describe('groceries', () => {
  it('are a chain’s shelf price here, cheapest first, untaxed in New York, and go home to where each keeps', () => {
    const sim = life('us-ny-newyork', 'groc');
    const list = arrange(groceryCatalog(sim, 'us-ny-newyork'));
    expect(list.length).toBeGreaterThan(20);
    for (let i = 1; i < list.length; i += 1) expect(list[i]!.price!).toBeGreaterThanOrEqual(list[i - 1]!.price!);
    const chicken = productById(P.chicken)!;
    expect(groceryPrice(sim, 'us-ny-newyork', chicken)).toBe(499);
    expect(unitPrice(sim, 'us-ny-newyork', chicken)).toEqual({ price: Math.round((499 * 1000) / 454), per: 'kg' });
    const before = bank(sim);
    buy(sim, P.chicken, 2);
    expect(before - bank(sim)).toBe(998);
    const items = foodOf(sim.player).filter((i) => i.kind === P.chicken);
    expect(items).toHaveLength(2);
    expect(items[0]!.at).toMatchObject({ kind: 'home', spot: 'fridge' });
    // FoodKeeper: a day in the fridge for raw chicken, from purchase.
    expect(items[0]!.food.expiresAt! - sim.now).toBe(1 * MS_DAY);
    expect(foodOf(sim.player).find((i) => i.kind === P.potatoes)).toBeUndefined();
  });

  it('are bought where a chain has a store, for a kitchen here, in sensible numbers', () => {
    const sim = life('us-ny-newyork', 'groc-no');
    expect(groceryRefusal(sim, sim.player, P.chicken, 21)).toBe('From one to twenty.');
    sim.player.currentLocationId = 'us-ca-losangeles';
    expect(groceryRefusal(sim, sim.player, P.chicken, 1)).toBe('There’s no store of that chain here.');
    // Price Rite's store is on New Haven's line, shopped as the town's.
    const nh = life('us-ct-newhaven', 'groc-nh');
    expect(groceryCatalog(nh, 'us-ct-newhaven').length).toBeGreaterThan(20);
  });

  it('go off and are thrown out at the day’s turn', () => {
    const sim = life('us-ny-newyork', 'spoil');
    buy(sim, P.chicken);
    expect(throwOutSpoiled(sim.player, sim.now + 12 * 3_600_000)).toBe(0);
    sim.advanceBy(2 * MS_DAY);
    expect(foodOf(sim.player).some((i) => i.kind === P.chicken)).toBe(false);
  });
});

describe('cooking', () => {
  it('turns a count into grams by USDA’s medium portion, and a milliliter into a gram', () => {
    expect(amountIn({ name: 'tomatoes', food: 'tomato', quantity: 8, unit: 'ct' }, 'g', 1)).toBe(8 * 123);
    expect(amountIn({ name: 'eggs', food: 'eggs', quantity: 2, unit: 'ct' }, 'ct', 1)).toBe(2);
    expect(amountIn({ name: 'yoghurt', food: 'yogurt', quantity: 120, unit: 'ml' }, 'g', 1)).toBe(120);
    expect(amountIn({ name: 'leeks', food: 'leek', quantity: 300, unit: 'g' }, 'ct', 1)).toBe(3);
  });

  it('needs the ingredients in stock and a kitchen, and says what’s short', () => {
    const sim = life('us-ny-newyork', 'cook-no');
    expect(cookRefusal(sim, sim.player, RECIPE)).toMatch(/short of baking potatoes, chicken breasts, tomatoes/);
    stockUp(sim);
    expect(cookRefusal(sim, sim.player, RECIPE)).toBeUndefined();
    // A hotel room has no kitchen.
    sim.player.currentLocationId = 'us-ca-losangeles';
    sim.player.stay = { kind: 'hotel', cityId: 'us-ca-losangeles' };
    expect(cookRefusal(sim, sim.player, RECIPE)).toBe('There’s no kitchen where you are.');
  });

  it('uses what’s in stock, takes its minutes, feeds them, and keeps the rest of its servings in the fridge', () => {
    const sim = life('us-ny-newyork', 'cook');
    stockUp(sim);
    sim.player.wellbeing.nourishment = 40;
    const yogurt = () => foodOf(sim.player).find((i) => i.kind === P.yogurt)!.food.left;
    const start = sim.now;
    const r = sim.must<{ left: number }>({ kind: 'food.cook', payload: { recipeId: RECIPE } });
    expect(sim.now - start).toBe(30 * 60_000);
    expect(r.left).toBe(3);
    expect(yogurt()).toBe(907 - 150);
    expect(sim.player.wellbeing.nourishment).toBeGreaterThan(40);
    const dish = mealsReady(sim, sim.player)[0]!;
    expect(dish.food).toMatchObject({ key: 'dish', left: 3 });
    expect(dish.at).toMatchObject({ kind: 'home', spot: 'fridge' });
    // FoodSafety.gov's 3 to 4 days, the safe end.
    expect(dish.food.expiresAt! - sim.now).toBe(3 * MS_DAY);
  });
});

describe('the day’s meals', () => {
  it('come out of what’s ready at home first, and the groceries are bought for the rest', () => {
    const sim = life('us-ny-newyork', 'stock');
    buy(sim, P.pizza, 2);
    const paid = () => Object.values(sim.universe.transactions).filter((t) => t.memo === 'Groceries').length;
    const before = paid();
    // Two meals from the pizzas, the third bought.
    expect(buyTheDaysFood(sim, sim.player)).toBe(true);
    expect(mealsReady(sim, sim.player)).toHaveLength(0);
    expect(paid()).toBe(before + 1);
    // The third meal's share of the day's groceries.
    const groceries = Object.values(sim.universe.transactions).filter((t) => t.memo === 'Groceries').at(-1)!;
    expect(Math.max(...groceries.postings.map((p) => p.amount))).toBe(Math.round(daysFoodCost(sim, sim.player) / 3));
    buy(sim, P.pizza, 3);
    expect(mealsFromStock(sim, sim.player)).toBe(3);
  });

  it('a ready meal eaten by hand, heated', () => {
    const sim = life('us-ny-newyork', 'ready');
    buy(sim, P.pizza);
    sim.player.wellbeing.nourishment = 30;
    expect(mealsReady(sim, sim.player)).toHaveLength(1);
    // Without one named, what's ready that goes off soonest, as a routine's step eats.
    sim.must({ kind: 'food.eat_ready', payload: {} });
    expect(mealsReady(sim, sim.player)).toHaveLength(0);
    expect(sim.player.wellbeing.nourishment).toBeGreaterThan(30);
  });
});

describe('a drink at home', () => {
  it('is a glass from the bottle, into the blood', () => {
    const sim = life('us-ca-losangeles', 'wine');
    sim.player.birthInstant = sim.now - 30 * 365.2425 * MS_DAY;
    const wine = groceryCatalog(sim, 'us-ca-losangeles').find((e) => e.value.food === 'wine')!.value;
    buy(sim, wine.id);
    const bottle = foodOf(sim.player).find((i) => i.food.key === 'wine')!;
    sim.must({ kind: 'food.drink_home', payload: { itemId: bottle.id } });
    expect(bottle.food.left).toBe(750 - 148);
    expect(bacAt(sim.player, sim.now)).toBeGreaterThan(0);
  });
});
