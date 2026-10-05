/**
 * SLATE — a new car built as you specify it (the master plan's §36e, §37f
 * and §37i, from 2026-10-02; the figures in `content/caroptions.ts`).
 *
 * A new car can take its maker's options for its market and trim: a paint,
 * wheels, an interior, and any of its packages and other options, each at its
 * listed price, which joins the car's price before the place's taxes. A car
 * as it comes, or in a paint or interior that costs nothing, is bought from a
 * dealer's stock and driven away. One with any option that costs something
 * is a factory order: it isn't the buyer's to drive until it comes, after the
 * weeks its dealers or Britain's leasing figures give (`ORDER_WEEKS`); where
 * none is published, it can't be ordered so, only bought from stock. What
 * was chosen is kept with the car.
 */

import type { CarModel } from '../content/vehiclecatalog';
import { CAR_OPTIONS, CAR_SPECS, ORDER_WEEKS, type CarOption, type CarSpec } from '../content/caroptions';

const ONE_EACH: ReadonlySet<CarOption['category']> = new Set(['paint', 'wheels', 'interior']);

export const optionsFor = (modelId: string): CarOption[] => CAR_OPTIONS.filter((o) => o.carId === modelId);
export const specOf = (modelId: string): CarSpec | undefined => CAR_SPECS.find((s) => s.carId === modelId);

/** Whose figure says how long a factory order of it takes, and how many weeks; nothing where none is published. */
export const orderWeeksOf = (m: CarModel): { weeks: number; whose: string } | undefined => ORDER_WEEKS[m.id] ?? ORDER_WEEKS[`${m.market}|${m.make}`];

/** The options chosen, cents of the model's currency, and whether they make it a factory order. */
export function optionsQuote(m: CarModel, keys: readonly string[]): { cents: number; factory: boolean; chosen: CarOption[] } {
  const chosen = keys.map((k) => CAR_OPTIONS.find((o) => o.key === k && o.carId === m.id)).filter((o): o is CarOption => Boolean(o));
  return { cents: chosen.reduce((a, o) => a + Math.round(o.price * 100), 0), factory: chosen.some((o) => o.price > 0), chosen };
}

/** Why these options can't go on this car bought so, or nothing. */
export function optionsRefusal(m: CarModel, keys: readonly string[], age: number): string | undefined {
  if (keys.length === 0) return undefined;
  if (age > 0) return 'A used car comes as it is.';
  const q = optionsQuote(m, keys);
  if (q.chosen.length !== keys.length) return 'That isn’t one of its options.';
  if (new Set(keys).size !== keys.length) return 'Each option once.';
  for (const cat of ONE_EACH) if (q.chosen.filter((o) => o.category === cat).length > 1) return `One ${cat === 'paint' ? 'paint' : cat === 'wheels' ? 'set of wheels' : 'interior'}.`;
  if (q.factory && !orderWeeksOf(m)) return 'No lead time for a factory order of it is published: buy one from stock, as it comes.';
  return undefined;
}
