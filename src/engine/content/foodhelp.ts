/**
 * SLATE — what a food bank, a pantry or a soup kitchen gives someone with
 * nothing left to pay for food, from 2026-10-01, researched in
 * `docs/research/world/research-foodbanks.json`. Until then nobody broke was
 * fed by one, and a life with nothing coming in ate a broke day's plate until
 * it starved.
 *
 * Each network leaves how often and how much to its pantries, so each figure
 * is a named site's published rule:
 * - New York City: a pantry every 14 days (NY Common Pantry), New York
 *   State's HPNAP three-day package of 9 meals, and a weekday lunch at Holy
 *   Apostles Soup Kitchen, "everyone is welcome, without question". The
 *   city's EFAP bars funded pantries from asking proof of need.
 * - Los Angeles: the Midnight Mission's three meals a day, every day, to
 *   anyone.
 * - New Haven: the Downtown Evening Soup Kitchen's evening meal every day.
 *   Its Wednesday pantry and Connecticut Foodshare's mobile pantry publish no
 *   amount, and aren't kept.
 * - London: a Trussell food bank's parcel, at least three days of meals, on
 *   a referral, which SLATE takes as given to someone with nothing left. Its
 *   guideline is three referrals in six months before the food bank talks to
 *   the referrer; SLATE keeps the three.
 * - Dublin: the Capuchin Day Centre's breakfast and lunch, Monday to
 *   Saturday, no questions asked.
 * - Toronto: Daily Bread once a week, two to three days of food (the middle,
 *   two and a half), no ID asked of a single person.
 * - Mexico City: a comedor comunitario's midday meal, MXN 11, Monday to
 *   Friday, anyone signing its book; where the bank can't find MXN 11, a
 *   comedor público's, free. The comedores públicos' days weren't read, and
 *   SLATE takes the comunitarios'.
 * Not kept: Vancouver's food bank, whose weekly 10 to 15 items are no
 * measure of meals and which asks proof of an address; and everywhere else,
 * not researched.
 */

export interface FoodHelp {
  /** Meals at a soup kitchen or a comedor, by weekday (0 Sunday), each day it serves. */
  kitchen?: { meals: number; days: readonly number[]; place: string; fee?: { amount: number; currency: string } };
  /** A pantry's or food bank's package: its meals, how often, and how many in a window. */
  pantry?: { meals: number; everyDays: number; place: string; most?: { count: number; days: number } };
}

const WEEKDAYS = [1, 2, 3, 4, 5] as const;
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6] as const;

export const FOOD_HELP: Readonly<Record<string, FoodHelp>> = {
  nyc: { kitchen: { meals: 1, days: WEEKDAYS, place: 'Holy Apostles Soup Kitchen' }, pantry: { meals: 9, everyDays: 14, place: 'a food pantry' } },
  'us-ca-losangeles': { kitchen: { meals: 3, days: EVERY_DAY, place: 'the Midnight Mission' } },
  'us-ct-newhaven': { kitchen: { meals: 1, days: EVERY_DAY, place: 'the Downtown Evening Soup Kitchen' } },
  'uk-eng-london': { pantry: { meals: 9, everyDays: 0, place: 'a Trussell food bank', most: { count: 3, days: 182 } } },
  'ie-lei-dublin': { kitchen: { meals: 2, days: [1, 2, 3, 4, 5, 6], place: 'the Capuchin Day Centre' } },
  'ca-on-toronto': { pantry: { meals: 7.5, everyDays: 7, place: 'Daily Bread' } },
  'mx-cmx-mexicocity': { kitchen: { meals: 1, days: WEEKDAYS, place: 'a comedor comunitario', fee: { amount: 11, currency: 'MXN' } } },
};

/** New York City's boroughs, which share its help. */
export const NYC_TOWNS: readonly string[] = ['us-ny-newyork', 'us-ny-manhattan', 'us-ny-brooklyn', 'us-ny-queens', 'us-ny-thebronx'];
