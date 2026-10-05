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
import { RECIPES } from '@/engine/content/groceries';
import { amountIn, cookRefusal, groceryCatalog, kitchenMeal, shortfall, groceryPrice, groceryRefusal, productById, unitPrice } from '@/engine/systems/kitchen';
import { foodOf, mealsFromStock, mealsReady, throwOutSpoiled } from '@/engine/systems/pantry';
import { buyTheDaysFood, canPay, foodOf as daysFoodCost, mealOf } from '@/engine/systems/household';
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

describe('a recipe by its servings', () => {
  it('scales what it uses, keeps what’s left over, and won’t go past three times or below one', () => {
    const sim = life('us-ny-newyork', 'cook-serves');
    stockUp(sim);
    sim.player.wellbeing.nourishment = 40;
    const yogurt = () => foodOf(sim.player).find((i) => i.kind === P.yogurt)!.food.left;
    expect(cookRefusal(sim, sim.player, RECIPE, 0)).toBe('From 1 to 12 servings.');
    expect(cookRefusal(sim, sim.player, RECIPE, 13)).toBe('From 1 to 12 servings.');
    // What it makes, there's enough for; twelve wants three times the chicken there is.
    expect(cookRefusal(sim, sim.player, RECIPE, 4)).toBeUndefined();
    expect(cookRefusal(sim, sim.player, RECIPE, 12)).toMatch(/short of/);
    // Two of its four: half the yogurt, one left over.
    const r = sim.must<{ left: number }>({ kind: 'food.cook', payload: { recipeId: RECIPE, servings: 2 } });
    expect(r.left).toBe(1);
    expect(yogurt()).toBe(907 - 75);
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

describe('Look After Yourself’s meal', () => {
  const ate = (sim: Simulation) => sim.universe.transactions.filter((t) => t.memo === 'A meal').length;
  it('is what’s ready in the kitchen first, unpaid', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'nothing' }, 'eat-ready');
    sim.universe.accounts[sim.player.primaryAccountId!]!.balance += 50_00;
    buy(sim, P.pizza);
    sim.player.wellbeing.nourishment = 30;
    // With nothing in the bank to buy a meal: the pizza needs none.
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && !a.nominal && (a.kind === 'checking' || a.kind === 'savings')) a.balance = 0;
    // And the overdraft run to its end.
    sim.universe.accounts[sim.player.primaryAccountId!]!.balance -= canPay(sim, sim.player);
    const cash = bank(sim);
    expect(canPay(sim, sim.player)).toBeLessThan(mealOf(sim, sim.player));
    sim.must({ kind: 'life.look_after', payload: { action: 'eat' } });
    expect(mealsReady(sim, sim.player)).toHaveLength(0);
    expect(ate(sim)).toBe(0);
    expect(bank(sim)).toBe(cash);
    expect(sim.player.wellbeing.nourishment).toBeGreaterThan(30);
  });

  it('cooks what the stock makes when nothing’s ready, and keeps its servings', () => {
    const sim = life('us-ny-newyork', 'eat-cook');
    stockUp(sim);
    sim.player.wellbeing.nourishment = 30;
    const cash = bank(sim);
    expect(kitchenMeal(sim, sim.player)).toEqual({ recipeId: expect.any(String) });
    sim.must({ kind: 'life.look_after', payload: { action: 'eat' } });
    expect(ate(sim)).toBe(0);
    expect(bank(sim)).toBe(cash);
    expect(mealsReady(sim, sim.player)[0]!.food.key).toBe('dish');
  });

  it('isn’t cooked while they’re busy at something on the calendar', () => {
    const sim = life('us-ny-newyork', 'eat-busy');
    stockUp(sim);
    sim.player.wellbeing.nourishment = 30;
    sim.universe.scheduled.push({ id: 'busy', at: sim.now - 60_000, kind: 'test.busy', label: 'A Meeting', category: 'personal', priority: 1, status: 'done', requiresPlayer: true, durationMinutes: 120, payload: {} } as never);
    expect(kitchenMeal(sim, sim.player)).toBeUndefined();
    sim.must({ kind: 'life.look_after', payload: { action: 'eat' } });
    expect(ate(sim)).toBe(1);
  });

  it('is bought as it’s cooked only when the kitchen has nothing to make it with', () => {
    const sim = life('us-ny-newyork', 'eat-buy');
    for (const i of foodOf(sim.player)) i.food.left = 0;
    sim.player.items = (sim.player.items ?? []).filter((i) => !i.food);
    sim.player.wellbeing.nourishment = 30;
    expect(kitchenMeal(sim, sim.player)).toBeUndefined();
    sim.must({ kind: 'life.look_after', payload: { action: 'eat' } });
    expect(ate(sim)).toBe(1);
    // A pizza carried to another town, with no kitchen to heat it: not a meal from the kitchen.
    buy(sim, P.pizza);
    for (const i of foodOf(sim.player)) i.at = { kind: 'person' };
    sim.player.currentLocationId = 'us-ct-newhaven';
    expect(mealsReady(sim, sim.player)).toHaveLength(1);
    expect(kitchenMeal(sim, sim.player)).toBeUndefined();
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

describe('what a recipe is short of', () => {
  it('is bought at once, the cheapest packs here that make it up, and the recipe can be cooked', () => {
    const sim = life('us-ny-newyork', 'short');
    sim.player.items = (sim.player.items ?? []).filter((i) => !i.food);
    expect(cookRefusal(sim, sim.player, RECIPE)).toMatch(/short of/);
    const need = shortfall(sim, sim.player, RECIPE)!;
    expect(need.unbuyable).toEqual([]);
    expect(need.buys.length).toBeGreaterThan(0);
    // Each the cheapest pack here for its food, on the packs' own price per unit of it.
    const here = groceryCatalog(sim, 'us-ny-newyork').map((e) => e.value);
    for (const b of need.buys) {
      const food = productById(b.productId)!.food;
      const rivals = here.filter((p) => p.food === food);
      expect(rivals.length).toBeGreaterThan(0);
      expect(rivals.every((p) => groceryPrice(sim, 'us-ny-newyork', p) * Math.ceil((b.quantity * productById(b.productId)!.sizeQty) / p.sizeQty) >= b.cost || p.sizeUnit !== productById(b.productId)!.sizeUnit || productById(b.productId)!.sizeQty * b.quantity > p.sizeQty * 20)).toBe(true);
    }
    const before = bank(sim);
    const r = sim.execute<{ paid: number }>({ kind: 'food.buy_short', payload: { recipeId: RECIPE } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.paid).toBe(need.buys.reduce((a, b) => a + b.cost, 0));
    expect(before - bank(sim)).toBe(r.value!.paid);
    expect(cookRefusal(sim, sim.player, RECIPE)).toBeUndefined();
    expect(sim.execute({ kind: 'food.buy_short', payload: { recipeId: RECIPE } }).error).toBe('You have all of it.');
  });
});

describe('the cheapest pack', () => {
  it('is the one bought for what’s short, where London sells oats more than one way', () => {
    const sim = life('uk-eng-london', 'short-ldn');
    sim.player.items = (sim.player.items ?? []).filter((i) => !i.food);
    const need = shortfall(sim, sim.player, 'easy-overnight-oats')!;
    const oats = need.buys.find((b) => productById(b.productId)!.food === 'oats')!;
    const here = groceryCatalog(sim, 'uk-eng-london').map((e) => e.value).filter((p) => p.food === 'oats');
    expect(here.length).toBeGreaterThan(1);
    // No other oats here would make it up for less.
    const recipe = RECIPES.find((r) => r.id === 'easy-overnight-oats')!;
    const ing = recipe.ingredients.find((i) => !i.cupboard && i.food === 'oats') as Extract<(typeof recipe.ingredients)[number], { food: string | null }>;
    for (const p of here) {
      const quantity = Math.max(1, Math.ceil(amountIn(ing, p.sizeUnit, 1) / p.sizeQty - 1e-9));
      expect(groceryPrice(sim, 'uk-eng-london', p) * quantity).toBeGreaterThanOrEqual(oats.cost);
    }
  });
});
