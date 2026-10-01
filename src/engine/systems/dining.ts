/**
 * SLATE — eating out at real restaurants (Stage 4 of `docs/BACKLOG.md`, from
 * 2026-10-01): at a table, taken away, or delivered, at the menu's prices
 * with the town's tax on a meal, the custom's tip, and on a delivery the
 * app's fees (`content/dining.ts`). The meal itself is a restaurant's,
 * eaten as `life.look_after`'s ordered meal is (`food.dine` in
 * `systems/life.ts`).
 *
 * The meal of the day that nobody chooses, eaten out where there's no
 * kitchen, stays at LendingTree's average for a meal bought out
 * (`EAT_OUT`): it isn't any one restaurant's.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Instant } from '../core/time';
import type { Money } from '../core/money';
import { salesTaxRate } from '../content/tax';
import { RESTAURANTS, type Restaurant } from '../content/restaurants';
import { DELIVERY_TERMS, DINING_MINUTES, TIP, type DiningMarket } from '../content/dining';
import type { CatalogEntry } from './catalog';
import { inSaveMoney } from './banking';

export type DineHow = 'in' | 'takeout' | 'delivery';

export const restaurantById = (id: string): Restaurant | undefined => RESTAURANTS.find((r) => r.id === id);
export const restaurantsIn = (cityId: string): Restaurant[] => RESTAURANTS.filter((r) => r.cityId === cityId);

export function diningMarketOf(cityId: string): DiningMarket | undefined {
  return ({ us: 'US', uk: 'GB', ie: 'IE', ca: 'CA', mx: 'MX' } as const)[cityId.split('-')[0] ?? ''];
}

/**
 * The tax on a restaurant meal where a town is, added to the menu price.
 * Connecticut adds its 1% meals tax to the 6.35% sales tax, 7.35% since
 * 1 October 2019 (Conn. Gen. Stat. §12-408(1)(H)). British Columbia charges
 * no PST on a restaurant's food, so only the 5% GST. Elsewhere in America
 * and Canada, the town's sales tax. In Britain, Ireland and Mexico it's in
 * the price.
 */
export function mealTaxRate(cityId: string, at: Instant, r: Restaurant): number {
  if (r.taxIncluded) return 0;
  if (cityId.startsWith('us-ct-')) return 0.0735;
  if (cityId.startsWith('ca-bc-')) return 0.05;
  return salesTaxRate(cityId, at, 'restaurant');
}

export interface DiningQuote {
  /** In the restaurant's money. */
  food: number; tax: number; tip: number; fees: number;
  /** All of it, in the save's money. */
  total: Money;
  minutes: number;
  /** Whether a part of it is SLATE's estimate: a delivery fee, a service fee or a tip. */
  estimated: boolean;
}

/** What a meal would cost: the items, the tax, the tip, and a delivery's fees. Nothing where an item's price isn't known. */
export function diningQuote(sim: Simulation, r: Restaurant, items: readonly string[], how: DineHow): DiningQuote | undefined {
  const chosen = items.map((name) => r.menu.find((m) => m.item === name));
  if (chosen.length === 0 || chosen.some((m) => !m || m.price === null)) return undefined;
  const market = diningMarketOf(r.cityId);
  if (!market) return undefined;
  const food = chosen.reduce((sum, m) => sum + m!.price!, 0);
  const tax = food * mealTaxRate(r.cityId, sim.now, r);
  const tip = TIP[market];
  const tipShare = how === 'in' ? (r.tier === 'fast' ? 0 : tip.table) : how === 'delivery' ? tip.delivery : 0;
  let fees = 0;
  let estimated = how === 'delivery' && tip.deliveryEstimated && tipShare > 0;
  if (how === 'delivery') {
    const d = DELIVERY_TERMS[market];
    const service = Math.min(d.serviceMax ?? Infinity, Math.max(d.serviceMin ?? 0, food * d.serviceShare));
    fees = d.fee + service + (d.smallOrder && food < d.smallOrder.under ? d.smallOrder.fee : 0);
    estimated = estimated || d.feeEstimated || d.serviceEstimated;
  }
  const round = (n: number) => Math.round(n * 100) / 100;
  const total = inSaveMoney(sim, Math.round((food + tax + food * tipShare + fees) * 100), r.currency);
  return { food: round(food), tax: round(tax), tip: round(food * tipShare), fees: round(fees), total, minutes: how === 'in' ? DINING_MINUTES[r.tier] : DINING_MINUTES[how], estimated };
}

/** Why they can't have this meal so, or nothing. */
export function diningRefusal(sim: Simulation, person: Person, restaurantId: string, items: readonly string[], how: DineHow): string | undefined {
  const r = restaurantById(restaurantId);
  if (!r) return 'No such restaurant.';
  if (r.cityId !== person.currentLocationId) return `${r.name} is in another town.`;
  if (how === 'takeout' && !r.takeout) return `${r.name} doesn’t do takeout.`;
  if (how === 'delivery' && !r.delivery) return `${r.name} doesn’t deliver.`;
  if (how === 'delivery' && !(person.home?.cityId === person.currentLocationId || person.stay?.cityId === person.currentLocationId)) return 'A delivery needs somewhere here to be brought to.';
  if (items.length === 0) return 'Choose something from the menu.';
  if (items.length > 6) return 'Six things at most.';
  if (!items.every((name) => r.menu.some((m) => m.item === name))) return 'That isn’t on its menu.';
  if (!diningQuote(sim, r, items, how)) return 'SLATE doesn’t know the price of something you chose.';
  return undefined;
}

const TIER_LABEL = { fast: 'Counter Service', casual: 'Casual', mid: 'Mid-Range', upscale: 'Fine Dining' } as const;

/** The town's menus as a catalog: each item at its price with the meal's tax, before any tip. */
export function menuCatalog(sim: Simulation, cityId: string): CatalogEntry<{ restaurant: Restaurant; item: string }>[] {
  return restaurantsIn(cityId).flatMap((r) => r.menu.map((m) => ({
    id: `${r.id}:${m.item}`, label: m.item, value: { restaurant: r, item: m.item }, basis: 'Menu Price, Tax In, Before A Tip',
    ...(m.price === null ? { price: null, priceKind: 'unknown' as const } : { price: inSaveMoney(sim, Math.round(m.price * (1 + mealTaxRate(cityId, sim.now, r)) * 100), r.currency), priceKind: 'advertised' as const }),
    facets: { restaurant: r.name, tier: TIER_LABEL[r.tier] },
    words: `${r.name} ${r.cuisine ?? ''} ${r.neighborhood ?? ''} ${m.note ?? ''}`,
  })));
}
