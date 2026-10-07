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
 * spent only where it can't be. Until 2026-10-06 the partner was the only one
 * an ordinary meal served, and whenever there was a second serving; from then
 * the cook chooses (`serve`, `dinersOf`): the partner, a child living there, a
 * friend staying, a lodger or a flatmate, each a serving. A child's meal comes
 * out of the food share of its month's raising (`raisingMonth`), and a
 * guest's out of the day's food bought for them, so neither is paid twice.
 *
 * **Stopped partway** (from 2026-10-06; until then cooking was one stretch of
 * the clock nothing could stop): the clock is moved over a recipe's minutes
 * as anything else that stops it for them would stop it, and at home, where a
 * power cut stops a kitchen (`cutStopsCooking`), at the cut. Stopped, the food
 * is left part-done (`person.cooking`), its ingredients already used, and
 * finished later for the minutes left (`food.resume_cooking`), in the same
 * kitchen, within USDA's two hours for perishable food left out; past them it
 * goes in the bin. One thing is on the go at a time.
 */

import type { Simulation } from '../core/simulation';
import { LOOKING_AFTER } from './life';
import { livingIn } from './homes';
import { fineWeatherRefusal } from './dwelling';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatTime, type Instant } from '../core/time';
import type { Money } from '../core/money';
import { salesTaxRate } from '../content/tax';
import { GROCERY_CHAINS, GROCERY_PRODUCTS, LEFTOVERS_FREEZE_DAYS, RECIPES, type FoodUnit, type GroceryProduct, type Ingredient, type Recipe, type Storage } from '../content/groceries';
import { PINT, WIDMARK, drinkingAge } from '../content/alcohol';
import type { CatalogEntry } from './catalog';
import { inSaveMoney } from './banking';
import { payWith, payWithRefusal, spend, type PayWith } from './household';
import { addItem, coldRoomL, coldUsedL, homeKeyOf, itemById, moveRefusal, reachable, SPOT_LABEL, type Item } from './items';
import { COOKING_MET, GEAR_LABEL, KITCHEN_GEAR, SUBSTITUTES, type Gear, type GearOffer } from '../content/kitchengear';
import { GEAR_LINEUP } from '../content/kitchengearlineup';
import { exerts } from './body';
import { WASH_UP, atHome, livingOf, placeOf } from './dwelling';

/** The sink at home full of the dishes it holds, so nothing more is cooked there until they're washed up (from 2026-10-03). */
export const sinkFull = (person: Person): boolean => atHome(person) && (livingOf(person).dishes ?? 0) >= WASH_UP.full;
export const SINK_FULL = 'The sink’s full: wash up first.';
import { applyLookingAfter, occupiedAt } from './life';
import { contactsOf } from './people';
import { drinkGrams, marketOf as drinkingMarketOf } from './alcohol';
import { closedNow } from './errands';
import { COLD_CHAIN_HOURS, stow } from './trips';
import { cutStopsCooking, powerOffAt } from './utilities';
import { CITIES } from '../content/geography';
import { CHILD_FOOD_SHARE } from '../content/children';
import { childrenOf, livesWithYou } from './children';
import { guestsOf } from './houseguests';
import { lodgersIn } from './lodgers';
import { roomsOf } from './rooms';
import { foodOf, fresh, mealsReady, stockOf, takePortion, throwOutSpoiled, type Food, type Stocked } from './pantry';

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
  // What keeps cold has to fit the fridge or freezer at home (from 2026-10-05), as a thing moved there does
  // (`moveRefusal`); until then a purchase went in whatever was already there.
  const spot = SPOT[p.storage];
  if (spot !== 'pantry') {
    const holds = coldRoomL(person, spot);
    const left = holds === undefined ? Infinity : holds - coldUsedL(person, homeKeyOf(person.home)!, spot);
    const need = (p.sizeUnit === 'ct' ? p.sizeQty * 0.25 : p.sizeQty / 1000) * quantity;
    if (need > left + 1e-9) return `${SPOT_LABEL[spot]} is full: ${Math.max(0, Math.floor(left))} liters of its ${Math.round(holds!)} are free, and ${quantity === 1 ? 'it needs' : 'they need'} ${Math.ceil(need)}.`;
  }
  return undefined;
}

/** Buys groceries in a store: paid, and home to where each keeps. */
export function buyGroceries(sim: Simulation, person: Person, productId: string, quantity: number, way: PayWith = 'debit'): Money {
  const no = groceryRefusal(sim, person, productId, quantity);
  if (no) throw new CommandError(no);
  const p = productById(productId)!;
  const paid = groceryPrice(sim, person.currentLocationId, p) * quantity;
  const chain = GROCERY_CHAINS.find((c) => c.id === p.chain)!;
  // Paid the way chosen at the till (from 2026-10-04): the debit card unless the credit card or cash is.
  const wayNo = way === 'debit' ? undefined : payWithRefusal(sim, person, paid, way, true);
  if (wayNo) throw new CommandError(wayNo);
  if (!(way === 'debit' ? spend(sim, person, paid, chain.name, 'food') : payWith(sim, person, paid, chain.name, 'food', way, true))) throw new CommandError('The payment didn’t go through.');
  deliverGroceries(sim, person, p, quantity, paid);
  return paid;
}

/** Groceries paid for, each its own item, carried or in the car until a trip out is home. */
export function deliverGroceries(sim: Simulation, person: Person, p: NonNullable<ReturnType<typeof productById>>, quantity: number, paid: Money): void {
  const home = homeKeyOf(person.home)!;
  for (let i = 0; i < quantity; i += 1) {
    // Carried, or in the car, until a trip out is home (`stow`).
    stow(sim, person, addItem(sim, person, {
      kind: p.id, label: p.name, quantity: 1, condition: 1, at: { kind: 'home', home, spot: SPOT[p.storage] }, acquiredAt: sim.now, paid: Math.round(paid / quantity),
      food: { key: p.food, unit: p.sizeUnit, left: p.sizeQty, ...(p.abv !== undefined ? { abv: p.abv } : {}), ...(p.keepsDays === null ? {} : { expiresAt: sim.now + p.keepsDays * MS_DAY }) },
    }), sim.now);
  }
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
  // One thing on the go at a time (from 2026-10-06): what was left partway is finished, or left past its two hours, first.
  const partway = cookingLeft(sim, person);
  if (partway) return `${recipeById(partway.recipeId)?.name ?? 'Something'} is partway: finish it first.`;
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
  // The cheapest of each first read, and from 2026-10-05 each market's makes and models.
  return [...(KITCHEN_GEAR[country] ?? []).map((g) => ({ ...g, id: g.id ?? `${country}-${g.gear}` })), ...(GEAR_LINEUP[country] ?? [])].map((g) => ({ ...g, cost: inSaveMoney(sim, Math.round(g.price * (1 + (g.taxIncluded ? 0 : salesTaxRate(cityId, sim.now, 'appliances'))) * 100), g.currency) })).sort((a, b) => a.cost - b.cost);
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

/** Someone at home a meal can be served to, by the id `food.cook`'s `serve` takes. */
export interface Diner { id: string; label: string; who: 'partner' | 'child' | 'guest' | 'lodger' | 'flatmate' }

/**
 * Who at home can be served from what's cooked (from 2026-10-06): a partner living there, each child who lives with
 * them from their first birthday (SLATE's estimate: no figure for when a baby first eats a family meal was read), in
 * America and Canada only, where a
 * published food share of raising a child takes their meal out of its cost (`CHILD_FOOD_SHARE`); a friend staying;
 * each lodger in the home they own; and each flatmate in a flat-share. Nobody where they aren't home.
 */
export function dinersOf(sim: Simulation, person: Person): Diner[] {
  if (!atHome(person)) return [];
  const out: Diner[] = [];
  const partner = contactsOf(person).find((c) => c.livesWith !== undefined);
  if (partner) out.push({ id: partner.id, label: partner.name.split(' ')[0]!, who: 'partner' });
  const country = CITIES.get(person.home?.cityId ?? '')?.countryId ?? '';
  if (CHILD_FOOD_SHARE[country] !== undefined) {
    for (const k of childrenOf(person)) {
      const age = (sim.now - k.born) / (365.2425 * MS_DAY);
      if (livesWithYou(k) && age >= 1 && age < 18) out.push({ id: k.id, label: k.name.split(' ')[0]!, who: 'child' });
    }
  }
  for (const g of guestsOf(person)) if (g.stay.from <= sim.now) out.push({ id: g.id, label: g.name.split(' ')[0]!, who: 'guest' });
  const owned = livingIn(person);
  (owned ? lodgersIn(owned) : []).forEach((_l, i) => out.push({ id: `lodger:${i}`, label: `Your Lodger${owned!.lodgers!.length > 1 ? ` ${i + 1}` : ''}`, who: 'lodger' }));
  for (let i = 0; i < (roomsOf(sim, person)?.flatmates ?? 0); i += 1) out.push({ id: `flatmate:${i}`, label: `A Flatmate${i ? ` (${i + 1})` : ''}`, who: 'flatmate' });
  return out;
}

/** Why a meal can't be served to these, or nothing: each must be at home to eat, and each takes a serving beside the cook's. */
export function serveRefusal(sim: Simulation, person: Person, serve: readonly string[], servings: number): string | undefined {
  const here = new Set(dinersOf(sim, person).map((d) => d.id));
  if (new Set(serve).size !== serve.length) return 'Each is served once.';
  const missing = serve.find((id) => !here.has(id));
  if (missing) return 'They aren’t here to eat.';
  if (servings < serve.length + 1) return `That takes ${serve.length + 1} servings, one for you.`;
  return undefined;
}

/**
 * A recipe under way and stopped partway (from 2026-10-06): its ingredients already taken, the minutes cooked so far,
 * when and why it stopped, and the kitchen it's in. Until then cooking was one stretch of the clock that nothing could
 * stop: something due in it refused the recipe before it began, and nothing else was looked at.
 */
export interface Cooking { recipeId: string; servings?: number; serve?: string[]; outside?: boolean; minutes: number; minutesDone: number; stoppedAt: Instant; why: string; home?: string }

/**
 * What was left cooking partway and is still safe to finish, or nothing: within USDA's two hours for perishable food
 * left out (`COLD_CHAIN_HOURS`, the rule the shopping left in a car already keeps).
 */
export function cookingLeft(sim: Simulation, person: Person): Cooking | undefined {
  const c = person.cooking;
  return c && sim.now - c.stoppedAt <= COLD_CHAIN_HOURS * 3_600_000 ? c : undefined;
}

/** Part-cooked food left out past USDA's two hours, thrown away and told. True where it was. */
export function binPartway(sim: Simulation, person: Person): boolean {
  const c = person.cooking;
  if (!c || cookingLeft(sim, person)) return false;
  delete person.cooking;
  if (person.id === sim.universe.playerId) sim.notify({ category: 'home', title: 'Left Partway Too Long', body: `${recipeById(c.recipeId)?.name ?? 'What was cooking'} was left part-cooked more than ${COLD_CHAIN_HOURS} hours, USDA's limit, and went in the bin.`, importance: 35, route: '/workspace/food' });
  return true;
}

/** The power cut that would stop cooking at home between two instants: where a cut stops cooking, its start, or nothing. */
function cutWhileCooking(person: Person, from: Instant, to: Instant): Instant | undefined {
  const cut = person.powerCut;
  if (!cut || !atHome(person) || !cutStopsCooking(person.home!.cityId)) return undefined;
  return cut.from > from && cut.from < to ? cut.from : undefined;
}

/**
 * Cooking carried on from where it is: the clock moved over the minutes left, stopping where something that stops it
 * for them comes (an appointment, a club's time to set out, a routine's time, anything scheduled meanwhile) or the
 * power goes off. Stopped, it's left partway (`person.cooking`) and the portions are none; done, it's served.
 */
function carryOn(sim: Simulation, person: Person, c: Cooking): number {
  const start = sim.now;
  const end = start + (c.minutes - c.minutesDone) * 60_000;
  const cut = cutWhileCooking(person, start, end);
  const res = sim.advanceTo(cut ?? end, { stopOnPlayerRequired: true });
  const done = (sim.now - start) / 60_000;
  // Cooking's effort, the Compendium's 2.0 METs (from 2026-10-03), for the minutes cooked.
  exerts(person, COOKING_MET, done / 60);
  // Outdoors, the minutes are time outside, at sitting out's rate for them.
  if (c.outside) applyLookingAfter(person, 'outside', sim.now, 1, done / LOOKING_AFTER.outside.minutes);
  c.minutesDone += done;
  if (sim.now < end) {
    c.stoppedAt = sim.now;
    c.why = res.interruptedBy ? res.interruptedBy.label : 'The power went off';
    person.cooking = c;
    if (person.id === sim.universe.playerId) sim.notify({ category: 'home', title: 'Cooking Stopped Partway', body: `${recipeById(c.recipeId)!.name} stopped ${Math.round(c.minutesDone)} of ${c.minutes} minutes in: ${c.why}. It keeps ${COLD_CHAIN_HOURS} hours part-cooked, USDA's limit, to be finished.`, importance: 45, route: '/workspace/food' });
    return 0;
  }
  delete person.cooking;
  return serveCooked(sim, person, c);
}

/** Why what was left partway can't be taken up again now, or nothing. */
export function resumeRefusal(sim: Simulation, person: Person): string | undefined {
  const c = cookingLeft(sim, person);
  if (!c) return person.cooking ? `It was left more than ${COLD_CHAIN_HOURS} hours, USDA's limit.` : 'There’s no cooking left partway.';
  if (c.home !== undefined && !(atHome(person) && homeKeyOf(person.home) === c.home)) return 'It’s in the kitchen at home.';
  if (!placeOf(sim, person)?.cooks) return 'There’s no kitchen where you are.';
  if (atHome(person) && powerOffAt(person, sim.now) && cutStopsCooking(person.home!.cityId)) return `The power’s off until ${formatTime(person.powerCut!.until, sim.zone)}.`;
  const busy = occupiedAt(sim, sim.now);
  if (busy) return `You’re at ${busy.label} until ${formatTime(busy.at + busy.durationMinutes! * 60_000, sim.zone)}.`;
  const end = sim.now + (c.minutes - c.minutesDone) * 60_000;
  const clash = sim.timeline.between(sim.now, end).find((i) => i.requiresPlayer === true);
  if (clash) return `${clash.label} is at ${formatTime(clash.at, sim.zone)}, and there isn’t time to finish it.`;
  return undefined;
}

/** What was left partway, finished: the minutes left cooked, and served. The portions left, none where it stopped again. */
export function resumeCooking(sim: Simulation, person: Person): number {
  const no = resumeRefusal(sim, person);
  if (no) throw new CommandError(no);
  return carryOn(sim, person, person.cooking!);
}

/** Cooks a recipe for so many servings: its ingredients used at that scale, one serving eaten, the rest in the fridge. The portions left. */
export function cook(sim: Simulation, person: Person, recipeId: string, servings?: number, outside = false, serve?: readonly string[]): number {
  // In the outdoor kitchen (from 2026-10-04): built, and the weather fit to sit out in for the recipe's minutes.
  if (outside) {
    if (!(atHome(person) && livingIn(person)?.facts.features.includes('outdoorKitchen'))) throw new CommandError('You have no outdoor kitchen.');
    const weather = fineWeatherRefusal(sim, person, 'cook outside', COOKING_MET, recipeById(recipeId)?.minutes ?? KITCHEN.minutes);
    if (weather) throw new CommandError(weather);
  }
  const no = cookRefusal(sim, person, recipeId, servings) ?? (serve ? serveRefusal(sim, person, serve, servings ?? recipeById(recipeId)!.servings) : undefined);
  if (no) throw new CommandError(no);
  const busy = occupiedAt(sim, sim.now);
  if (busy) throw new CommandError(`You’re at ${busy.label} until ${formatTime(busy.at + busy.durationMinutes! * 60_000, sim.zone)}.`);
  const clash = cookingClash(sim, recipeId);
  if (clash) throw new CommandError(clash);
  // With the power off at home, where a cut stops cooking, nothing's started (from 2026-10-06).
  if (atHome(person) && powerOffAt(person, sim.now) && cutStopsCooking(person.home!.cityId)) throw new CommandError(`The power’s off until ${formatTime(person.powerCut!.until, sim.zone)}.`);
  // What was left partway past USDA's two hours goes in the bin before anything new is started.
  binPartway(sim, person);
  const r = recipeById(recipeId)!;
  takeIngredients(sim, person, recipeId, servings);
  const home = atHome(person) ? homeKeyOf(person.home) : undefined;
  return carryOn(sim, person, { recipeId, ...(servings !== undefined ? { servings } : {}), ...(serve ? { serve: [...serve] } : {}), ...(outside ? { outside } : {}), minutes: r.minutes ?? KITCHEN.minutes, minutesDone: 0, stoppedAt: sim.now, why: '', ...(home ? { home } : {}) });
}

/** A recipe cooked through, served: one serving eaten, one each to whoever it's served to, the rest in the fridge. The portions left. */
function serveCooked(sim: Simulation, person: Person, c: Cooking): number {
  const r = recipeById(c.recipeId)!;
  const { servings, serve } = c;
  const minutes = c.minutes;
  applyLookingAfter(person, 'eat', sim.now);
  // A partner living with them, home, eats with them; from 2026-10-06, whoever the meal is served to where they're
  // chosen, each a serving: a partner the meal's time together, a child's meal out of its raising, a guest's out of the
  // day's food bought for them, a lodger or a flatmate only the serving.
  const partner = atHome(person) ? contactsOf(person).find((c) => c.livesWith !== undefined) : undefined;
  const served = serve ?? (partner && (servings ?? r.servings) > 1 ? [partner.id] : []);
  if (partner) { partner.hours += minutes / 60; partner.lastSeen = sim.now; }
  for (const id of served) {
    const child = childrenOf(person).find((k) => k.id === id);
    if (child) child.served = (child.served ?? 0) + 1;
    const guest = guestsOf(person).find((g) => g.id === id);
    if (guest) guest.stay.served = (guest.stay.served ?? 0) + 1;
  }
  const left = (servings ?? r.servings) - 1 - served.length;
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
/**
 * A cup of something at home, from 2026-10-05: the coffee, tea, juice and water the grocers sell, which until then were
 * bought and kept and nothing used. A cup is the USDA's 240 ml. Ground coffee at the Specialty Coffee Association's
 * golden ratio, 55 g a liter; instant at Nescafé's own 1.8 g a 200 ml cup; tea by the bag, one a cup, or by weight at
 * ISO 3103's 2 g a 100 ml; juice and water by the cup. Oranges sold by weight are fruit, not a drink.
 */
export const CUP_ML = 240;
export const CUP = { groundCoffeeGPerL: 55, instantCoffeeGPerMl: 1.8 / 200, teaGPerMl: 2 / 100 } as const;
const CUP_KEYS = new Set(['coffee', 'tea', 'juice', 'water', 'orange']);
/** What a cup takes of a thing in the kitchen, in its own unit; nothing where it isn't a drink by the cup. */
export function cupOf(item: Stocked): number | undefined {
  const { key, unit } = item.food;
  if (!CUP_KEYS.has(key)) return undefined;
  if (key === 'coffee') return unit === 'g' ? (/instant|soluble/i.test(item.label) ? CUP_ML * CUP.instantCoffeeGPerMl : (CUP_ML * CUP.groundCoffeeGPerL) / 1000) : undefined;
  if (key === 'tea') return unit === 'ct' ? 1 : unit === 'g' ? CUP_ML * CUP.teaGPerMl : undefined;
  return unit === 'ml' ? CUP_ML : undefined;
}

export function drinkAtHome(sim: Simulation, person: Person, itemId: string): number {
  const item = itemById(person, itemId) as Stocked | undefined;
  // At the home they're in, put away (from 2026-10-06; until then a can still in the car at the shops was poured).
  if (item?.food && !(item.at.kind === 'home' && reachable(sim, person, item.at))) throw new CommandError('It isn’t at home with you.');
  const cup = item?.food ? cupOf(item) : undefined;
  if (item && cup !== undefined) {
    if (!fresh(item, sim.now)) throw new CommandError('It’s gone off.');
    if (item.food.left + 1e-9 < cup) throw new CommandError('There isn’t a cup’s worth left.');
    item.food.left -= cup;
    if (item.food.left <= 1e-9) person.items = (person.items ?? []).filter((x) => x.id !== item.id);
    return CUP_ML;
  }
  if (!item?.food || (item.food.key !== 'beer' && item.food.key !== 'wine') || !fresh(item, sim.now) || item.food.left <= 0) throw new CommandError('That isn’t a drink here.');
  if (yearsOld(person, sim.now) < drinkingAge(person.currentLocationId)) throw new CommandError(`You have to be ${drinkingAge(person.currentLocationId)}.`);
  const pint = PINT[drinkingMarketOf(person.currentLocationId) as keyof typeof PINT ?? 'US'] ?? PINT.US;
  const ml = Math.min(item.food.left, item.food.key === 'beer' ? pint.ml : 148);
  // Its label's strength where read (from 2026-10-05), the pint's or a glass's standard where not.
  const abv = item.food.abv ?? (item.food.key === 'beer' ? pint.abv : 0.12);
  item.food.left -= ml;
  if (item.food.left <= 1e-9) person.items = (person.items ?? []).filter((x) => x.id !== item.id);
  sim.advanceTo(sim.now + 30 * 60_000);
  drinkGrams(sim, person, ml * abv * WIDMARK.gramsPerMl, 1, sim.now);
  return ml;
}

/**
 * Freezing and thawing at home, the master plan's §33h (from 2026-10-06; until then food moved to the freezer kept as
 * long as it did in the fridge). Frozen, a grocery keeps its FoodKeeper freezer time and a cooked dish the leftovers'
 * (`LEFTOVERS_FREEZE_DAYS`); what FoodKeeper gives no freezer time for isn't frozen. Thawed in the fridge it takes a full
 * day, as USDA's The Big Thaw says even a pound of ground meat does, and isn't cooked or eaten until then; then meat
 * and seafood keep "an additional day or two", the day kept here, and the rest their own time in the fridge. Thawed in
 * the fridge it may be frozen again, as the same page allows.
 */
export const THAW = { hours: 24, meatDays: 1 } as const;

/** How long a thing keeps frozen, days; none where FoodKeeper gives no freezer time. */
export function freezeDaysOf(item: Item & { food: Food }): number | null {
  if (item.food.key === 'dish') return LEFTOVERS_FREEZE_DAYS;
  return GROCERY_PRODUCTS.find((p) => p.id === item.kind)?.freezeDays ?? null;
}

/** Why a thing can't be frozen now, or nothing. */
export function freezeRefusal(sim: Simulation, person: Person, item: (Item & { food?: Food }) | undefined): string | undefined {
  if (!item?.food) return 'That isn’t food of yours.';
  if (!atHome(person)) return 'Food is frozen at home.';
  if (item.food.frozenAt !== undefined) return 'It’s frozen already.';
  if (item.food.expiresAt !== undefined && item.food.expiresAt <= sim.now) return 'It’s gone off.';
  if (freezeDaysOf(item as Item & { food: Food }) === null) return `FoodKeeper gives no freezer time for ${item.label}.`;
  return moveRefusal(sim, person, item, { kind: 'home', home: homeKeyOf(person.home)!, spot: 'freezer' });
}

/** Why a thing can't be thawed now, or nothing. */
export function thawRefusal(sim: Simulation, person: Person, item: (Item & { food?: Food }) | undefined): string | undefined {
  if (!item?.food) return 'That isn’t food of yours.';
  if (!atHome(person)) return 'Food is thawed at home.';
  if (item.food.frozenAt === undefined) return 'It isn’t frozen.';
  return moveRefusal(sim, person, item, { kind: 'home', home: homeKeyOf(person.home)!, spot: 'fridge' });
}

export function registerKitchen(sim: Simulation): void {
  sim.onCommand<{ itemId: string }, { keepsUntil: Instant }>('food.freeze', (p, { sim: s }) => {
    const person = s.player;
    const item = itemById(person, String(p?.itemId)) as (Item & { food: Food }) | undefined;
    const no = freezeRefusal(s, person, item);
    if (no) throw new CommandError(no);
    item!.at = { kind: 'home', home: homeKeyOf(person.home)!, spot: 'freezer' };
    item!.food.frozenAt = s.now;
    delete item!.food.thawsAt;
    item!.food.expiresAt = s.now + freezeDaysOf(item!)! * MS_DAY;
    return { keepsUntil: item!.food.expiresAt };
  });
  sim.onCommand<{ itemId: string }, { thawsAt: Instant; keepsUntil: Instant }>('food.thaw', (p, { sim: s }) => {
    const person = s.player;
    const item = itemById(person, String(p?.itemId)) as (Item & { food: Food }) | undefined;
    const no = thawRefusal(s, person, item);
    if (no) throw new CommandError(no);
    const product = GROCERY_PRODUCTS.find((x) => x.id === item!.kind);
    const thawsAt = s.now + THAW.hours * 3_600_000;
    const keep = product && (product.category === 'meat' || product.category === 'seafood') ? THAW.meatDays : item!.food.key === 'dish' ? KITCHEN.leftoverDays : product?.storage === 'fridge' && product.keepsDays !== null ? product.keepsDays : product?.keepsDays ?? KITCHEN.leftoverDays;
    item!.at = { kind: 'home', home: homeKeyOf(person.home)!, spot: 'fridge' };
    delete item!.food.frozenAt;
    item!.food.thawsAt = thawsAt;
    item!.food.expiresAt = thawsAt + keep * MS_DAY;
    return { thawsAt, keepsUntil: item!.food.expiresAt };
  });
  sim.onEvent('world.day_rollover', 'kitchen.spoil', (_e, { sim: s }) => {
    for (const person of Object.values(s.universe.people)) {
      binPartway(s, person);
      const n = throwOutSpoiled(person, s.now);
      if (n > 0 && person.id === s.universe.playerId) s.notify({ category: 'home', title: 'Thrown Out', body: `${n} ${n === 1 ? 'thing had' : 'things had'} gone off in the kitchen.`, importance: 15, route: '/workspace/food' });
    }
  });
  sim.onCommand<{ productId: string; quantity?: number; payWith?: PayWith }, { paid: Money }>('food.buy_groceries', (p, { sim: s }) => ({ paid: buyGroceries(s, s.player, String(p?.productId), Number(p?.quantity ?? 1), p?.payWith === 'credit' || p?.payWith === 'cash' ? p.payWith : 'debit') }));
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
  // A model chosen, or the cheapest of its kind where none is (from 2026-10-05; until then always the one).
  sim.onCommand<{ gear: string; offerId?: string }, { paid: Money }>('food.buy_gear', (p, { sim: s }) => {
    const person = s.player;
    const no = gearRefusal(s, person, String(p?.gear));
    if (no) throw new CommandError(no);
    const g = gearOffers(s, person).find((x) => x.gear === p.gear && (p.offerId === undefined || x.id === p.offerId));
    if (!g) throw new CommandError('That model isn’t sold where you live.');
    if (!spend(s, person, g.cost, `${g.retailer}, ${g.name}`, 'household')) throw new CommandError('The bank couldn’t pay for it.');
    addItem(s, person, { kind: `gear:${g.gear}`, label: g.name, quantity: 1, condition: 1, at: { kind: 'home', home: homeKeyOf(person.home)!, spot: 'floor' }, acquiredAt: s.now, paid: g.cost });
    return { paid: g.cost };
  });
  // Stopped partway, it says why (from 2026-10-06), and what's left is taken up with `food.resume_cooking`.
  sim.onCommand<{ recipeId: string; servings?: number; outside?: boolean; serve?: string[] }, { left: number; stopped?: string }>('food.cook', (p, { sim: s }) => {
    const left = cook(s, s.player, String(p?.recipeId), p?.servings === undefined ? undefined : Number(p.servings), p?.outside === true, Array.isArray(p?.serve) ? p.serve.map(String) : undefined);
    return { left, ...(s.player.cooking ? { stopped: s.player.cooking.why } : {}) };
  });
  sim.onCommand<Record<string, never>, { left: number; stopped?: string }>('food.resume_cooking', (_p, { sim: s }) => {
    const left = resumeCooking(s, s.player);
    return { left, ...(s.player.cooking ? { stopped: s.player.cooking.why } : {}) };
  });
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
