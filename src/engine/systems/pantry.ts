/**
 * SLATE — the food kept at home (Stage 4 of `docs/BACKLOG.md`, from
 * 2026-10-01): each grocery an item in the fridge, the freezer or the
 * pantry (`systems/items.ts`), with how much is left and when it goes off;
 * and each dish cooked, its portions in the fridge for as long as cooked
 * food keeps. What's gone off is thrown out at the day's turn.
 *
 * The day's meals come out of it first (`mealsFromStock`, read by
 * `buyTheDaysFood` in `systems/household.ts`): a portion of something
 * cooked, a ready meal or a frozen pizza is one of the day's three meals,
 * and the day's groceries are bought for the rest. A pizza or a ready meal
 * as one meal is SLATE's estimate. Raw ingredients aren't a meal until
 * they're cooked (`systems/kitchen.ts`).
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Instant } from '../core/time';
import type { FoodUnit } from '../content/groceries';
import { itemsOf, reachable, type Item } from './items';

/** What makes an item food: what it is, how much is left in its unit, and when it goes off. A dish's portions are counted. */
export interface Food {
  key: string;
  unit: FoodUnit;
  left: number;
  expiresAt?: Instant;
  /** A dish cooked from a recipe. */
  recipeId?: string;
}

export type Stocked = Item & { food: Food };

export const foodOf = (person: Person): Stocked[] => itemsOf(person).filter((i): i is Stocked => i.food !== undefined);

/** Fresh where it is now: not gone off. */
export const fresh = (item: Stocked, at: Instant): boolean => item.food.expiresAt === undefined || item.food.expiresAt > at;

/** What's to hand and fresh of a food, the soonest to go off first; food still in the car isn't, until it's brought in (from 2026-10-03). */
export function stockOf(sim: Simulation, person: Person, key: string, at: Instant = sim.now): Stocked[] {
  return foodOf(person).filter((i) => i.food.key === key && i.food.left > 0 && fresh(i, at) && reachable(sim, person, i.at) && i.at.kind !== 'vehicle')
    .sort((a, b) => (a.food.expiresAt ?? Infinity) - (b.food.expiresAt ?? Infinity) || a.id.localeCompare(b.id));
}

/** Foods that are a meal as they are: a dish's portion, a ready meal, a frozen pizza. */
export const MEAL_KEYS = new Set(['dish', 'ready-meal', 'pizza']);

/** Meals ready to eat at home: a portion each. */
export function mealsReady(sim: Simulation, person: Person, at: Instant = sim.now): Stocked[] {
  return foodOf(person).filter((i) => MEAL_KEYS.has(i.food.key) && i.food.left > 0 && fresh(i, at) && reachable(sim, person, i.at) && i.at.kind !== 'vehicle')
    .sort((a, b) => (a.food.expiresAt ?? Infinity) - (b.food.expiresAt ?? Infinity) || a.id.localeCompare(b.id));
}

/** Takes a portion of a meal: a dish's, counted; a ready meal or a pizza is one meal a package. The item goes with the last. */
export function takePortion(person: Person, item: Stocked): void {
  item.food.left = item.food.key === 'dish' ? item.food.left - 1 : 0;
  if (item.food.left <= 0) person.items = itemsOf(person).filter((i) => i.id !== item.id);
}

/** The day's meals eaten from what's ready at home, up to three, soonest to go off first. How many. */
export function mealsFromStock(sim: Simulation, person: Person, upTo = 3): number {
  let eaten = 0;
  while (eaten < upTo) {
    const next = mealsReady(sim, person)[0];
    if (!next) break;
    takePortion(person, next);
    eaten += 1;
  }
  return eaten;
}

/** Throws out what's gone off, anywhere they keep it. How many things. */
export function throwOutSpoiled(person: Person, at: Instant): number {
  const off = foodOf(person).filter((i) => !fresh(i, at));
  if (off.length === 0) return 0;
  const gone = new Set(off.map((i) => i.id));
  person.items = itemsOf(person).filter((i) => !gone.has(i.id));
  return off.length;
}
