/**
 * SLATE — a day's meals from a soup kitchen, a pantry or a food bank, for
 * someone the bank can't feed (`content/foodhelp.ts`, from 2026-10-01). Asked
 * only on a day the groceries can't be paid for: the kitchen's meals where
 * one serves that weekday, and then a pantry's package, kept as a store of
 * meals, fetched when the store is empty and the pantry's interval has
 * passed. Three meals is a fed day; fewer is a short one, eaten at that share.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, zonedParts, type Instant } from '../core/time';
import { saveCurrency } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { FOOD_HELP, NYC_TOWNS, type FoodHelp } from '../content/foodhelp';
import { spend } from './household';

export interface FoodHelpRecord { /** Meals left from a pantry's package. */ store: number; /** When a package was fetched. */ visits: Instant[]; /** The meals help gave today, and whether it's been feeding them since the bank last did. */ today?: number; helping?: boolean }

/** The help where someone is, if SLATE keeps any there. */
export function foodHelpIn(cityId: string): FoodHelp | undefined {
  return FOOD_HELP[NYC_TOWNS.includes(cityId) ? 'nyc' : cityId];
}

/** The meals a day's help gives them where they are, taken from it; 0 where there's none. */
export function mealsFromHelp(sim: Simulation, person: Person, at: Instant = sim.now): number {
  const city = person.currentLocationId;
  const help = foodHelpIn(city);
  if (!help) return 0;
  const weekday = new Date(Date.UTC(...((p) => [p.year, p.month - 1, p.day] as const)(zonedParts(at, CITIES.require(city).timeZone)))).getUTCDay();
  let meals = 0;
  const k = help.kitchen;
  if (k && k.days.includes(weekday)) {
    // A comedor comunitario's fee where the bank can find it; a comedor público's meal free where it can't.
    if (k.fee) {
      const cents = Math.round(k.fee.amount * 100 * k.meals);
      const cur = saveCurrency(sim.universe);
      spend(sim, person, cur === k.fee.currency ? cents : exchange(cents, k.fee.currency, cur) ?? cents, `A meal at ${k.name}`, 'food');
    }
    meals += k.meals;
  }
  const p = help.pantry;
  if (p) {
    const r = (person.foodHelp ??= { store: 0, visits: [] });
    const last = r.visits[r.visits.length - 1];
    const recent = p.most ? r.visits.filter((v) => at - v < p.most!.days * MS_DAY).length : 0;
    if (r.store <= 0 && (last === undefined || at - last >= p.everyDays * MS_DAY) && (!p.most || recent < p.most.count)) {
      r.store += p.meals;
      r.visits = [...r.visits.filter((v) => at - v < 400 * MS_DAY), at];
    }
    const take = Math.min(r.store, 3 - meals);
    r.store -= take;
    meals += take;
  }
  return meals;
}
