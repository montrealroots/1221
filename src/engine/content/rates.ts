/**
 * SLATE — a figure that steps on dates: a benefit's weekly maximum, a
 * threshold, a fee. Each step is `[YYYY-MM-DD, cents]`. It was in
 * `content/career.ts` beside the union contracts it was written for, until
 * the career went in the scope reset of 2026-10-09 and the file with it.
 */

import type { Money } from '../core/money';

/** A rate from a day, in cents: the steps. */
export type RateSteps = readonly (readonly [string, Money])[];

/** The rate in force on a day, `YYYY-MM-DD`: the latest step begun, or the first. Past the last step, it holds. */
export function rateOn(steps: RateSteps, day: string): Money {
  let rate = steps[0]![1];
  for (const [from, cents] of steps) if (day >= from) rate = cents;
  return rate;
}
