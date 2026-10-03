/**
 * SLATE — groceries, cooking and leftovers (Stage 4 of `docs/BACKLOG.md`,
 * from 2026-10-01; the products and recipes in `content/groceries.ts`, the
 * food kept in `systems/pantry.ts`).
 *
 * **Groceries** are bought in a store of a chain here, at its shelf price
 * with the town's sales tax where groceries carry one, and go home to the
 * fridge, the freezer or the pantry, keeping as long as FoodKeeper says
 * from purchase. A chain whose store is on the town's line (Price Rite in
 * Hamden, for New Haven) is shopped as the town's. No chain's delivery
 * terms were published in full, so groceries are bought in a store.
 *
 * **Cooking** a recipe makes all its servings, in a kitchen with what it
 * needs: a home's kitchen has a stove, an oven, a grill, a fridge-freezer
 * and a microwave, which the EIA found in 96% of American homes (RECS
 * 2020); a blender or a slow cooker SLATE's homes don't keep, so a recipe
 * that needs one isn't cooked. It takes the recipe's own minutes, or 30
 * where its source gave none, SLATE's estimate. Each ingredient comes out
 * of what's in stock, the soonest to go off first. Seasonings, spices,
 * stock and water are taken as in the cupboard. Where an ingredient's unit
 * isn't its product's, a milliliter is taken as a gram and a count by its
 * grams each (`GRAMS_EACH`).
 *
 * **A dish** is one serving eaten now, as a meal cooked at home is, and the
 * rest in the fridge, for the recipe's own days or the 3 to 4 days
 * FoodSafety.gov gives cooked leftovers (3, the safe end). A portion is
 * reheated in five minutes, SLATE's estimate, and eaten; the day's meals
 * take from them first (`mealsFromStock`).
 *
 * **Cooking's time** (from 2026-10-03): a recipe isn't started that would run
 * into something they're due at. **For the household**: a partner living with
 * them, home, eats a serving of what's cooked with them, the meal's time
 * counting to the two of them; and a dinner for friends at home is cooked from
 * a recipe where the stock makes it for everyone (`social.host`), its money
 * spent only where it can't be.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatTime, type Instant } from '../core/time';
import type { Money } from '../core/money';
import { salesTaxRate } from '../content/tax';
import { GROCERY_CHAINS, GROCERY_PRODUCTS, RECIPES, type FoodUnit, type GroceryProduct, type Ingredient, type Recipe, type Storage } from '../content/groceries';
import { PINT, WIDMARK, drinkingAge } from '../content/alcohol';
import type { CatalogEntry } from './catalog';
import { inSaveMoney } from './banking';
import { spend } from './household';
import { addItem, homeKeyOf, itemById } from './items';
import { COOKING_MET, GEAR_LABEL, KITCHEN_GEAR, SUBSTITUTES, type Gear, type GearOffer } from '../content/kitchengear';
import { exerts } from './body';
import { WASH_UP, atHome, livingOf, placeOf } from './dwelling';

/** The sink at home full of the dishes it holds, so nothing more is cooked there until they're washed up (from 2026-10-03). */
export const sinkFull = (person: Person): boolean => atHome(person) && (livingOf(person).dishes ?? 0) >= WASH_UP.full;
export const SINK_FULL = 'The sink’s full: wash up first.';
import { applyLookingAfter, occupiedAt } from './life';
import { contactsOf } from './people';
import { drinkGrams, marketOf as drinkingMarketOf } from './alcohol';
import { closedNow } from './errands';
import { stow } from './trips';
import { foodOf, fresh, mealsReady, stockOf, takePortion, throwOutSpoiled, type Stocked } from './pantry';

const MARKET: Readonly<Record<string, string>> = { us: 'US', uk: 'GB', ie: 'IE', ca: 'CA', mx: 'MX' };
export const groceryMarketOf = (cityId: string): string | undefined => MARKET[cityId.split('-')[0] ?? ''];

/** What a kitchen has, the minutes a recipe takes where its source gave none, a reheat, and cooked food's days. */
export const KITCHEN = { has: new Set(['stove', 'oven', 'grill', 'freezer', 'microwave']), minutes: 30, reheatMinutes: 5, leftoverDays: 3 } as const;
/**
 * Grams of one, where a recipe counts and a shop weighs: USDA FoodData
 * Central's medium portion (a large egg 50 g, a medium tomato 123 g, onion
 * 110 g, russet potato 213 g, carrot 61 g, apple 182 g, banana 118 g, sweet
 * pepper 119 g, a boneless chicken breast half 174 g). Anything else counted
 * is taken as 100 g, and an ingredient with no amount as 50 g or one, SLATE's
 * estimates.
 */
export const GRAMS_EACH: Readonly<Record<string, number>> = { eggs: 50, tomato: 123, onion: 110, potato: 213, carrot: 61, apple: 182, banana: 118, pepper: 119, chicken: 174 };
export const COUNTS = { countG: 100, someG: 50 } as const;

export const productById = (id: string): GroceryProduct | undefined => GROCERY_PRODUCTS.find((p) => p.id === id);
export const recipeById = (id: string): Recipe | undefined => RECIPES.find((r) => r.id === id);

/** The chains with a store in reach of a town. */
export const chainsIn = (cityId: string) => GROCERY_CHAINS.filter((c) => c.storesIn.includes(cityId) || c.nearestTo.includes(cityId));

/** One of a product, with the town's sales tax where groceries or alcohol carry one, in the save's money. */
export function groceryPrice(sim: Simulation, cityId: string, p: GroceryProduct): Money {
  const tax = p.taxIncluded ? 0 : salesTaxRate(cityId, sim.now, p.category === 'alcohol' ? 'alcohol' : 'groceries');
  return inSaveMoney(sim, Math.round(p.price * (1 + tax) * 100), p.currency);
}

const PER: Readonly<Record<string, string>> = { g: 'kg', ml: 'L', ct: 'each' };
/** A price a kilo, a liter or each, for comparing sizes. */
export function unitPrice(sim: Simulation, cityId: string, p: GroceryProduct): { price: Money; per: string } {
  const each = groceryPrice(sim, cityId, p);
  return p.sizeUnit === 'ct' ? { price: Math.round(each / Math.max(1, p.sizeQty)), per: PER.ct! } : { price: Math.round((each * 1000) / Math.max(1, p.sizeQty)), per: PER[p.sizeUnit]! };
}

const FOOD_LABEL: Readonly<Record<string, string>> = { dairy: 'Dairy And Eggs', bakery: 'Bread', meat: 'Meat', seafood: 'Fish', produce: 'Fruit And Vegetables', pantry: 'The Pantry', frozen: 'Frozen', beverage: 'Drinks', alcohol: 'Beer And Wine', 'ready-meal': 'Ready Meals' };

/** The groceries on sale in reach of a town, at their shelf prices, tax in. */
export function groceryCatalog(sim: Simulation, cityId: string): CatalogEntry<GroceryProduct>[] {
  const chains = new Set(chainsIn(cityId).map((c) => c.id));
  return GROCERY_PRODUCTS.filter((p) => chains.has(p.chain)).map((p) => ({
    id: p.id, label: p.name, value: p, basis: 'Shelf Price, Tax In', price: groceryPrice(sim, cityId, p), priceKind: 'advertised' as const,
    facets: { chain: GROCERY_CHAINS.find((c) => c.id === p.chain)!.name, aisle: FOOD_LABEL[p.category] ?? 'Other' },
    words: `${p.food} ${p.category}`,
  }));
}

const SPOT: Readonly<Record<Storage, 'fridge' | 'freezer' | 'pantry'>> = { fridge: 'fridge', freezer: 'freezer', pantry: 'pantry' };
const yearsOld = (person: Person, at: Instant) => (at - person.birthInstant) / (365.2425 * MS_DAY);

/** Why they can't buy it here, or nothing. */
export function groceryRefusal(sim: Simulation, person: Person, productId: string, quantity: number): string | undefined {
  const p = productById(productId);
  if (!p) return 'That isn’t on sale.';
  if (!chainsIn(person.currentLocationId).some((c) => c.id === p.chain)) return 'There’s no store of that chain here.';
  if (!(Number.isInteger(quantity) && quantity >= 1 && quantity <= 20)) return 'From one to twenty.';
  // Only while the store is open (`systems/errands.ts`).
  const shut = closedNow(p.chain, GROCERY_CHAINS.find((c) => c.id === p.chain)?.name ?? 'The store', person.currentLocationId, sim.now);
  if (shut) return shut;
  if (!(person.home && person.home.kind !== 'sofa' && person.home.cityId === person.currentLocationId)) return 'Groceries go home to your kitchen, here.';
  if (p.category === 'alcohol' && yearsOld(person, sim.now) < drinkingAge(person.currentLocationId)) return `You have to be ${drinkingAge(person.currentLocationId)} to buy it here.`;
  return undefined;
}

/** Buys groceries in a store: paid, and home to where each keeps. */
export function buyGroceries(sim: Simulation, person: Person, productId: string, quantity: number): Money {
  const no = groceryRefusal(sim, person, productId, quantity);
  if (no) throw new CommandError(no);
  const p = productById(productId)!;
  const paid = groceryPrice(sim, person.currentLocationId, p) * quantity;
  const chain = GROCERY_CHAINS.find((c) => c.id === p.chain)!;
  if (!spend(sim, person, paid, chain.name, 'food')) throw new CommandError('The payment didn’t go through.');
  const home = homeKeyOf(person.home)!;
  for (let i = 0; i < quantity; i += 1) {
    // Carried, or in the car, until a trip out is home (`stow`).
    stow(person, addItem(sim, person, {
      kind: p.id, label: p.name, quantity: 1, condition: 1, at: { kind: 'home', home, spot: SPOT[p.storage] }, acquiredAt: sim.now, paid: Math.round(paid / quantity),
      food: { key: p.food, unit: p.sizeUnit, left: p.sizeQty, ...(p.keepsDays === null ? {} : { expiresAt: sim.now + p.keepsDays * MS_DAY }) },
    }), sim.now);
  }
  return paid;
}

/** How much of a food an ingredient takes, in a product's unit, for the servings cooked. */
export function amountIn(ingredient: Extract<Ingredient, { food: string | null }>, unit: string, scale: number): number {
  const q = ingredient.quantity;
  const from = ingredient.unit;
  if (q === null || from === null) return unit === 'ct' ? 1 : COUNTS.someG;
  const need = q * scale;
  if (from === unit || (from !== 'ct' && unit !== 'ct')) return need;
  const perCount = GRAMS_EACH[ingredient.food ?? ''] ?? COUNTS.countG;
  return from === 'ct' ? need * perCount : Math.max(1, Math.ceil(need / perCount));
}

/** The servings a recipe can be cooked for: one to three times what it makes, a recipe scaled as a cook scales it (from 2026-10-02; until then always what it makes). */
export const servingsRange = (r: Recipe): { least: number; most: number } => ({ least: 1, most: r.servings * 3 });

/** What a recipe lacks here now, for so many servings: the appliances, and each ingredient short. Nothing where it can be cooked. */
export function cookRefusal(sim: Simulation, person: Person, recipeId: string, servings?: number): string | undefined {
  const r = recipeById(recipeId);
  if (!r) return 'No such recipe.';
  const n = servings ?? r.servings;
  const range = servingsRange(r);
  if (!Number.isInteger(n) || n < range.least || n > range.most) return `From ${range.least} to ${range.most} servings.`;
  const scale = n / r.servings;
  const place = placeOf(sim, person);
  if (!place?.cooks) return 'There’s no kitchen where you are.';
  if (sinkFull(person)) return SINK_FULL;
  // A recipe that needs nothing ('none') was refused for wanting a 'none' until 2026-10-03.
  const has = kitchenHas(person);
  const missing = r.appliances.filter((a) => a !== 'none' && !has.has(a));
  if (missing.length) return `It needs a ${missing.map((a) => GEAR_LABEL[a as Gear]?.toLowerCase() ?? a.replace('-', ' ')).join(' and a ')}${missing.every((a) => a in GEAR_LABEL) ? ': buy one for the kitchen' : ', which SLATE’s homes don’t keep'}.`;
  const short = r.ingredients.filter((i): i is Extract<Ingredient, { food: string | null }> => !i.cupboard).filter((i) => {
    if (!i.food) return true;
    const stock = stockOf(sim, person, i.food);
    const unit = stock[0]?.food.unit ?? 'g';
    const need = amountIn(i, unit, scale) - stock.reduce((sum, s) => sum + s.food.left, 0);
    // Short, a substitute in stock may stand in for the rest (`SUBSTITUTES`).
    return need > 1e-9 && !substituteFor(sim, person, i.food, unit, need);
  });
  if (short.length) return `You’re short of ${short.map((i) => i.name).join(', ')}.`;
  return undefined;
}

/** Something they're due at that cooking a recipe now would run into, or nothing. */
export function cookingClash(sim: Simulation, recipeId: string): string | undefined {
  const r = recipeById(recipeId);
  if (!r) return undefined;
  const end = sim.now + (r.minutes ?? KITCHEN.minutes) * 60_000;
  const clash = sim.timeline.between(sim.now, end).find((i) => i.requiresPlayer === true);
  return clash ? `${clash.label} is at ${formatTime(clash.at, sim.zone)}, and there isn’t time to cook it.` : undefined;
}

/** A recipe's ingredients taken from stock for so many servings, the soonest to go off first. */
export function takeIngredients(sim: Simulation, person: Person, recipeId: string, servings?: number): void {
  const r = recipeById(recipeId)!;
  const scale = (servings ?? r.servings) / r.servings;
  for (const i of r.ingredients) {
    if (i.cupboard || !i.food) continue;
    const stock = stockOf(sim, person, i.food);
    const unit = stock[0]?.food.unit ?? 'g';
    let need = amountIn(i, unit, scale);
    need = takeFrom(person, stock, need);
    // What's still short comes from its substitute.
    const sub = need > 1e-9 ? substituteFor(sim, person, i.food, unit, need) : undefined;
    if (sub) takeFrom(person, stockOf(sim, person, sub.use), sub.amount);
  }
}

function takeFrom(person: Person, stock: readonly Stocked[], need: number): number {
  for (const s of stock) {
    if (need <= 1e-9) break;
    const used = Math.min(need, s.food.left);
    s.food.left -= used;
    need -= used;
    if (s.food.left <= 1e-9) person.items = (person.items ?? []).filter((x) => x.id !== s.id);
  }
  return need;
}

/** A substitute in stock that covers what an ingredient is short of, and how much of it: NDSU's table, in the substitute's unit. */
export function substituteFor(sim: Simulation, person: Person, food: string, unit: FoodUnit, short: number): { use: string; amount: number } | undefined {
  for (const sub of SUBSTITUTES.filter((x) => x.for === food)) {
    const stock = stockOf(sim, person, sub.use);
    if (stock.length === 0) continue;
    const per = unit === 'ct' ? sub.perCount : sub.perGram;
    if (per === undefined || stock[0]!.food.unit === 'ct') continue;
    const amount = short * per;
    if (stock.reduce((n, s) => n + s.food.left, 0) >= amount - 1e-9) return { use: sub.use, amount };
  }
  return undefined;
}

/** What the kitchen where they are has: a home's stove, oven, grill, freezer and microwave, and at home the small appliances bought for it. */
export function kitchenHas(person: Person): Set<string> {
  const has = new Set<string>(KITCHEN.has);
  if (!atHome(person)) return has;
  const home = homeKeyOf(person.home);
  for (const it of person.items ?? []) if (it.kind.startsWith('gear:') && it.at.kind === 'home' && it.at.home === home) has.add(it.kind.slice(5));
  return has;
}

/** The small appliances on sale where they live, cheapest first, taxed where it's added, in the save's money. */
export function gearOffers(sim: Simulation, person: Person): (GearOffer & { cost: Money })[] {
  const cityId = person.home?.cityId ?? person.currentLocationId;
  const country = cityId.split('-')[0] ?? '';
  return (KITCHEN_GEAR[country] ?? []).map((g) => ({ ...g, cost: inSaveMoney(sim, Math.round(g.price * (1 + (g.taxIncluded ? 0 : salesTaxRate(cityId, sim.now, 'appliances'))) * 100), g.currency) })).sort((a, b) => a.cost - b.cost);
}

export function gearRefusal(sim: Simulation, person: Person, gear: string): string | undefined {
  if (!person.home || person.home.kind === 'sofa') return 'There’s no kitchen of yours to keep it in.';
  if (!atHome(person)) return 'It’s bought where you live.';
  if (!gearOffers(sim, person).some((g) => g.gear === gear)) return 'None is sold where you live.';
  if (kitchenHas(person).has(gear)) return 'Your kitchen has one.';
  return undefined;
}

/**
 * What a recipe is short of for so many servings, and the cheapest packs in
 * reach that make it up: each missing food's cheapest product in a store here
 * whose packs cover what's short (from 2026-10-02, the plan's §58: from a
 * missing ingredient to the shop and back to the meal). An ingredient no store
 * here sells is named as one that can't be bought.
 */
export function shortfall(sim: Simulation, person: Person, recipeId: string, servings?: number): { buys: { productId: string; quantity: number; cost: Money }[]; unbuyable: string[] } | undefined {
  const r = recipeById(recipeId);
  if (!r) return undefined;
  const scale = (servings ?? r.servings) / r.servings;
  const here = groceryCatalog(sim, person.currentLocationId).map((e) => e.value);
  const buys: { productId: string; quantity: number; cost: Money }[] = [];
  const unbuyable: string[] = [];
  for (const i of r.ingredients) {
    if (i.cupboard) continue;
    if (!i.food) { unbuyable.push(i.name); continue; }
    const stock = stockOf(sim, person, i.food);
    const unit = stock[0]?.food.unit;
    const have = stock.reduce((sum, s) => sum + s.food.left, 0);
    if (stock.length && have >= amountIn(i, unit!, scale) - 1e-9) continue;
    const products = here.filter((p) => p.food === i.food && (!unit || p.sizeUnit === unit));
    const needIn = (u: FoodUnit) => amountIn(i, u, scale) - (unit === u ? have : 0);
    const options = products.map((p) => {
      const short = needIn(p.sizeUnit);
      const quantity = Math.max(1, Math.ceil(short / p.sizeQty - 1e-9));
      return { productId: p.id, quantity, short, cost: groceryPrice(sim, person.currentLocationId, p) * quantity };
    }).filter((x) => x.short > 1e-9 && x.quantity <= 20).sort((a, b) => a.cost - b.cost);
    if (options.length === 0) { unbuyable.push(i.name); continue; }
    const { productId, quantity, cost } = options[0]!;
    buys.push({ productId, quantity, cost });
  }
  return { buys, unbuyable };
}

/** Cooks a recipe for so many servings: its ingredients used at that scale, one serving eaten, the rest in the fridge. The portions left. */
export function cook(sim: Simulation, person: Person, recipeId: string, servings?: number): number {
  const no = cookRefusal(sim, person, recipeId, servings);
  if (no) throw new CommandError(no);
  const busy = occupiedAt(sim, sim.now);
  if (busy) throw new CommandError(`You’re at ${busy.label} until ${formatTime(busy.at + busy.durationMinutes! * 60_000, sim.zone)}.`);
  const clash = cookingClash(sim, recipeId);
  if (clash) throw new CommandError(clash);
  const r = recipeById(recipeId)!;
  takeIngredients(sim, person, recipeId, servings);
  const minutes = r.minutes ?? KITCHEN.minutes;
  sim.advanceTo(sim.now + minutes * 60_000);
  // Cooking's effort, the Compendium's 2.0 METs (from 2026-10-03).
  exerts(person, COOKING_MET, minutes / 60);
  applyLookingAfter(person, 'eat', sim.now);
  // A partner living with them, home, eats with them.
  const partner = atHome(person) ? contactsOf(person).find((c) => c.livesWith !== undefined) : undefined;
  if (partner) { partner.hours += minutes / 60; partner.lastSeen = sim.now; }
  const left = (servings ?? r.servings) - 1 - (partner && (servings ?? r.servings) > 1 ? 1 : 0);
  if (left > 0) {
    const where = homeKeyOf(person.home);
    addItem(sim, person, {
      kind: `dish:${r.id}`, label: r.name, quantity: 1, condition: 1, at: where && person.home!.cityId === person.currentLocationId ? { kind: 'home', home: where, spot: 'fridge' } : { kind: 'person' }, acquiredAt: sim.now,
      food: { key: 'dish', unit: 'ct', left, recipeId: r.id, expiresAt: sim.now + (r.keepsDays ?? KITCHEN.leftoverDays) * MS_DAY },
    });
  }
  return left;
}

/**
 * What the kitchen can feed them with now, before any money is spent: a meal
 * that's ready, the soonest to spoil first; else a recipe the stock makes,
 * the quickest, when they're free to cook it. Read by Look After Yourself's
 * eat (from 2026-10-02; until then it paid a meal's money however full the
 * fridge was).
 */
export function kitchenMeal(sim: Simulation, person: Person): { ready: Stocked } | { recipeId: string } | undefined {
  if (!placeOf(sim, person)?.cooks) return undefined;
  const ready = mealsReady(sim, person)[0];
  if (ready) return { ready };
  if (occupiedAt(sim, sim.now)) return undefined;
  const quickest = RECIPES.filter((r) => !cookRefusal(sim, person, r.id)).sort((a, b) => (a.minutes ?? KITCHEN.minutes) - (b.minutes ?? KITCHEN.minutes) || a.id.localeCompare(b.id))[0];
  return quickest ? { recipeId: quickest.id } : undefined;
}

/** Eats a portion of what's ready: a dish, a ready meal or a pizza, heated. */
export function eatReady(sim: Simulation, person: Person, itemId: string): void {
  const item = itemById(person, itemId) as Stocked | undefined;
  if (!item?.food || !mealsReady(sim, person).some((m) => m.id === itemId)) throw new CommandError('That isn’t ready to eat here.');
  if (!placeOf(sim, person)?.cooks) throw new CommandError('There’s nothing to heat it with here.');
  sim.advanceTo(sim.now + KITCHEN.reheatMinutes * 60_000);
  takePortion(person, item);
  applyLookingAfter(person, 'eat', sim.now);
}

/** A drink at home from what's in stock: a pint of beer or a 148 ml glass of wine (NIAAA's five ounces), at 12% (NIAAA's table wine). */
export function drinkAtHome(sim: Simulation, person: Person, itemId: string): number {
  const item = itemById(person, itemId) as Stocked | undefined;
  if (!item?.food || (item.food.key !== 'beer' && item.food.key !== 'wine') || !fresh(item, sim.now) || item.food.left <= 0) throw new CommandError('That isn’t a drink here.');
  if (yearsOld(person, sim.now) < drinkingAge(person.currentLocationId)) throw new CommandError(`You have to be ${drinkingAge(person.currentLocationId)}.`);
  const pint = PINT[drinkingMarketOf(person.currentLocationId) as keyof typeof PINT ?? 'US'] ?? PINT.US;
  const ml = Math.min(item.food.left, item.food.key === 'beer' ? pint.ml : 148);
  const abv = item.food.key === 'beer' ? pint.abv : 0.12;
  item.food.left -= ml;
  if (item.food.left <= 1e-9) person.items = (person.items ?? []).filter((x) => x.id !== item.id);
  sim.advanceTo(sim.now + 30 * 60_000);
  drinkGrams(sim, person, ml * abv * WIDMARK.gramsPerMl, 1, sim.now);
  return ml;
}

export function registerKitchen(sim: Simulation): void {
  sim.onEvent('world.day_rollover', 'kitchen.spoil', (_e, { sim: s }) => {
    for (const person of Object.values(s.universe.people)) {
      const n = throwOutSpoiled(person, s.now);
      if (n > 0 && person.id === s.universe.playerId) s.notify({ category: 'home', title: 'Thrown Out', body: `${n} ${n === 1 ? 'thing had' : 'things had'} gone off in the kitchen.`, importance: 15, route: '/workspace/food' });
    }
  });
  sim.onCommand<{ productId: string; quantity?: number }, { paid: Money }>('food.buy_groceries', (p, { sim: s }) => ({ paid: buyGroceries(s, s.player, String(p?.productId), Number(p?.quantity ?? 1)) }));
  // What a recipe is short of, bought at once where it's sold here, each by the same rules as buying it on its own.
  sim.onCommand<{ recipeId: string; servings?: number }, { paid: Money; bought: number }>('food.buy_short', (p, { sim: s }) => {
    const person = s.player;
    const need = shortfall(s, person, String(p?.recipeId), p?.servings === undefined ? undefined : Number(p.servings));
    if (!need) throw new CommandError('No such recipe.');
    if (need.unbuyable.length) throw new CommandError(`No store here sells ${need.unbuyable.join(', ')}.`);
    if (need.buys.length === 0) throw new CommandError('You have all of it.');
    let paid = 0;
    for (const b of need.buys) paid += buyGroceries(s, person, b.productId, b.quantity);
    return { paid, bought: need.buys.length };
  });
  sim.onCommand<{ gear: string }, { paid: Money }>('food.buy_gear', (p, { sim: s }) => {
    const person = s.player;
    const no = gearRefusal(s, person, String(p?.gear));
    if (no) throw new CommandError(no);
    const g = gearOffers(s, person).find((x) => x.gear === p.gear)!;
    if (!spend(s, person, g.cost, `${g.retailer}, ${g.name}`, 'household')) throw new CommandError('The bank couldn’t pay for it.');
    addItem(s, person, { kind: `gear:${g.gear}`, label: g.name, quantity: 1, condition: 1, at: { kind: 'home', home: homeKeyOf(person.home)!, spot: 'floor' }, acquiredAt: s.now, paid: g.cost });
    return { paid: g.cost };
  });
  sim.onCommand<{ recipeId: string; servings?: number }, { left: number }>('food.cook', (p, { sim: s }) => ({ left: cook(s, s.player, String(p?.recipeId), p?.servings === undefined ? undefined : Number(p.servings)) }));
  sim.onCommand<{ itemId?: string }, { ate: true }>('food.eat_ready', (p, { sim: s }) => {
    if (s.player.wellbeing.nourishment >= 90) throw new CommandError('You aren’t hungry.');
    // Without one named, what's ready that goes off soonest: a routine's "eat something ready".
    const id = p?.itemId ?? mealsReady(s, s.player)[0]?.id;
    if (!id) throw new CommandError('There’s no meal ready to eat here.');
    eatReady(s, s.player, String(id));
    return { ate: true };
  });
  sim.onCommand<{ itemId: string }, { ml: number }>('food.drink_home', (p, { sim: s }) => ({ ml: drinkAtHome(s, s.player, String(p?.itemId)) }));
}

/** What's in the kitchen, for a screen. */
export const kitchenStock = (sim: Simulation, person: Person): Stocked[] => foodOf(person).filter((i) => fresh(i, sim.now));
