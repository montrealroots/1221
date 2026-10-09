/**
 * SLATE — what the weather decides: when the flu comes round.
 *
 * Until 2026-09-27 the flu came October to March everywhere, by New York's
 * calendar, so Sydney had its season in the southern summer and Singapore had
 * one at all. It reads the town's own climate now (`content/climate.ts`),
 * through the town's cold or wet weeks.
 *
 * The weather set the energy on a month's bills here too, from the same day:
 * the heating and cooling a town's degree days asked, and in the US the
 * state's household energy spending (content/energy-us.ts). The bills went
 * with the home in the scope reset of 2026-10-09, and from the connected world
 * that day so did their energy, the phone's share a card's bonus read last.
 *
 * The flu: its chance a year stays `CARE.flu`, and its weeks follow the town:
 * the coldest weeks where the coldest month is under 18 °C, the wettest where
 * it's over 21 °C, and a blend between (Tamerius et al., 2013). SLATE's
 * climate has no humidity, so temperature stands in for "cold and dry", and
 * wet-day frequency for "humid and rainy".
 */

import { CITIES } from '../content/geography';
import { normalFor } from '../content/climate';

/** Where a town's flu season follows its cold weeks and where its wet ones (Tamerius et al., PLOS Pathogens, 2013). */
export const FLU_TIMING = { coldDryBelowC: 18, humidRainyFromC: 21, source: 'Tamerius et al., PLOS Pathogens 9(3), 2013; WHO influenza transmission zones' } as const;

const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const days = new Map<string, number[]>();
const flu = new Map<string, number[]>();

/** A town's mean temperature on each day of a common year, °C. */
function dailyMeans(cityId: string): number[] {
  const hit = days.get(cityId);
  if (hit) return hit;
  const city = CITIES.require(cityId);
  const out: number[] = [];
  DAYS.forEach((n, m) => { for (let d = 1; d <= n; d += 1) out.push(normalFor(city, m + 1, d).mean); });
  days.set(cityId, out);
  return out;
}

/** The share of a year's flu each week of the year carries in a town, fifty-two summing to one. */
export function fluByWeek(cityId: string): number[] {
  const hit = flu.get(cityId);
  if (hit) return hit;
  const means = dailyMeans(cityId);
  const city = CITIES.require(cityId);
  const week = (w: number) => Math.min(means.length - 1, w * 7 + 3);
  const monthOf = (dayIndex: number) => { let m = 0, left = dayIndex; while (left >= DAYS[m]!) { left -= DAYS[m]!; m += 1; } return m + 1; };
  const annual = means.reduce((a, b) => a + b, 0) / means.length;
  const coldest = Math.min(...DAYS.map((_, m) => { const s = DAYS.slice(0, m).reduce((a, b) => a + b, 0); return means.slice(s, s + DAYS[m]!).reduce((a, b) => a + b, 0) / DAYS[m]!; }));
  const cold = Array.from({ length: 52 }, (_, w) => Math.max(0, annual - means[week(w)]!));
  const wet = Array.from({ length: 52 }, (_, w) => normalFor(city, monthOf(week(w)), 15).wetChance);
  const coldSum = cold.reduce((a, b) => a + b, 0);
  const wetSum = wet.reduce((a, b) => a + b, 0);
  const f = Math.min(1, Math.max(0, (FLU_TIMING.humidRainyFromC - coldest) / (FLU_TIMING.humidRainyFromC - FLU_TIMING.coldDryBelowC)));
  const out = cold.map((c, w) => (coldSum > 0 ? f * (c / coldSum) : 0) + (wetSum > 0 ? (coldSum > 0 ? 1 - f : 1) * (wet[w]! / wetSum) : 0));
  flu.set(cityId, out);
  return out;
}

/** The week of a common year a date falls in, 0 to 51, the last taking the year's last day or two. */
export function weekOfYear(month: number, day: number): number {
  const doy = DAYS.slice(0, month - 1).reduce((a, b) => a + b, 0) + Math.min(day, DAYS[month - 1]!) - 1;
  return Math.min(51, Math.floor(doy / 7));
}
