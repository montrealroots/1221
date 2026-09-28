/**
 * SLATE — what the weather decides: the energy on a month's bills, and when
 * the flu comes round.
 *
 * Until 2026-09-27 the weather was the calendar's alone. Bills were one flat
 * figure a month, and the flu came October to March everywhere, by New York's
 * calendar, so Sydney had its season in the southern summer and Singapore had
 * one at all. Both read the town's own climate now (`content/climate.ts`),
 * through degree days and the town's cold or wet weeks.
 *
 * The bills: of a month's bills, the energy part swings with the heating and
 * cooling the town's climate asks, and the rest (the phone, the internet,
 * getting about) doesn't. When it's paid follows the town's degree days. How
 * much a year comes to doesn't, since degree days from a smooth climate
 * normal miss real ones by too much to price (Los Angeles's normals give 1,025
 * cooling degree days to ASHRAE's measured 373; Tokyo's 763 heating to 1,559).
 * In the US the year is the state's instead (`content/energy-us.ts`): what its
 * households spend on energy against the nation's, in place of the town's
 * cost of living on that part. Until 2026-09-28 a Connecticut flat's energy
 * came to what a Florida one's did, but for the cost of living; elsewhere it
 * still does.
 *
 * The flu: its chance a year stays `CARE.flu`, and its weeks follow the town:
 * the coldest weeks where the coldest month is under 18 °C, the wettest where
 * it's over 21 °C, and a blend between (Tamerius et al., 2013). SLATE's
 * climate has no humidity, so temperature stands in for "cold and dry", and
 * wet-day frequency for "humid and rainy".
 */

import { CITIES } from '../content/geography';
import { normalFor } from '../content/climate';
import { US_ENERGY_AVERAGE, US_ENERGY_BY_STATE } from '../content/energy-us';

/**
 * What a year's energy comes to in a town against SLATE's flat bills: in the
 * US its state's household spending over the nation's, with the town's cost
 * of living taken back off it, since the state's figure carries its prices;
 * elsewhere one.
 */
/** A year of a town's bills against SLATE's flat figure: the rest as it is, the energy by `energyScale`. */
export const energyYear = (cityId: string): number => (1 - ENERGY.share) + ENERGY.share * energyScale(cityId);

export function energyScale(cityId: string): number {
  const city = CITIES.get(cityId);
  const state = city ? US_ENERGY_BY_STATE[city.parentId] : undefined;
  if (!city || state === undefined || !city.costOfLivingIndex) return 1;
  return (state / US_ENERGY_AVERAGE) * (100 / city.costOfLivingIndex);
}

/**
 * Energy on a household's bills, from the EIA's Residential Energy
 * Consumption Survey 2020 (table CE3.6), rented apartments: about $1,151 a
 * year, of which heating $225.80 and air conditioning $146.80, and the rest,
 * water heating, the fridge, lights and appliances, $778. Per degree day
 * against 2020's US population-weighted 3,914 heating and 1,519 cooling degree
 * days at 65 °F, the EIA's base: $0.1038 a heating and $0.1740 a cooling
 * degree day in °C. Of SLATE's $180 of bills for a place of one's own, about
 * $96 a month is energy: derived, and SLATE's estimate for a town outside the
 * US, whose climate it reads the same way.
 */
export const ENERGY = {
  share: 96 / 180,
  baseUsdPerYear: 778,
  heatUsdPerHddC: 0.1038,
  coolUsdPerCddC: 0.1740,
  baseC: 18.333,
  source: 'https://www.eia.gov/consumption/residential/data/2020/ (CE3.6); https://www.eia.gov/totalenergy/data/monthly/ (tables 1.11, 1.12)',
} as const;

/** Where a town's flu season follows its cold weeks and where its wet ones (Tamerius et al., PLOS Pathogens, 2013). */
export const FLU_TIMING = { coldDryBelowC: 18, humidRainyFromC: 21, source: 'Tamerius et al., PLOS Pathogens 9(3), 2013; WHO influenza transmission zones' } as const;

const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const days = new Map<string, number[]>();
const bills = new Map<string, number[]>();
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

/** A town's heating and cooling degree days by month, °C, at the EIA's 65 °F. */
export function degreeDays(cityId: string): { hdd: number[]; cdd: number[] } {
  const means = dailyMeans(cityId);
  const hdd = new Array(12).fill(0) as number[];
  const cdd = new Array(12).fill(0) as number[];
  let i = 0;
  DAYS.forEach((n, m) => {
    for (let d = 0; d < n; d += 1, i += 1) {
      hdd[m] = (hdd[m] ?? 0) + Math.max(0, ENERGY.baseC - means[i]!);
      cdd[m] = (cdd[m] ?? 0) + Math.max(0, means[i]! - ENERGY.baseC);
    }
  });
  return { hdd, cdd };
}

/** The share of a year's energy each month takes in a town, summing to one: the base evenly, heating by its degree days, cooling by its. */
export function energyByMonth(cityId: string): number[] {
  const hit = bills.get(cityId);
  if (hit) return hit;
  const { hdd, cdd } = degreeDays(cityId);
  const hddYear = hdd.reduce((a, b) => a + b, 0);
  const cddYear = cdd.reduce((a, b) => a + b, 0);
  const heat = ENERGY.heatUsdPerHddC * hddYear;
  const cool = ENERGY.coolUsdPerCddC * cddYear;
  const total = ENERGY.baseUsdPerYear + heat + cool;
  const out = hdd.map((_, m) => (ENERGY.baseUsdPerYear / total) / 12
    + (hddYear > 0 ? (heat / total) * (hdd[m]! / hddYear) : 0)
    + (cddYear > 0 ? (cool / total) * (cdd[m]! / cddYear) : 0));
  bills.set(cityId, out);
  return out;
}

/**
 * How much of a cooling month's energy a home's air conditioning uses:
 * central air all of a town's cooling, wall or window units cooling fewer
 * rooms less of it, and a home with none nothing. SLATE's estimate for units.
 */
export const COOLING_USE = { central: 1, units: 0.6, none: 0 } as const;

/**
 * What a month's bills come to against the year's average month, in a town:
 * the energy part by its month's share, the rest flat; and the cooling in it
 * as far as the home's air conditioning runs, so a home with none pays no
 * summer's cooling. Until 2026-09-28 every home paid for cooling it didn't have.
 */
export function billsFactor(cityId: string, month: number, cooling: keyof typeof COOLING_USE = 'central'): number {
  const full = energyByMonth(cityId)[month - 1]!;
  // Against the year's bills, which carry the state's energy already (`energyYear`).
  const scale = energyScale(cityId);
  const year = energyYear(cityId);
  if (cooling === 'central') return ((1 - ENERGY.share) + ENERGY.share * scale * 12 * full) / year;
  const { hdd, cdd } = degreeDays(cityId);
  const cddYear = cdd.reduce((a, b) => a + b, 0);
  const total = ENERGY.baseUsdPerYear + ENERGY.heatUsdPerHddC * hdd.reduce((a, b) => a + b, 0) + ENERGY.coolUsdPerCddC * cddYear;
  const coolPart = cddYear > 0 ? (ENERGY.coolUsdPerCddC * cddYear / total) * (cdd[month - 1]! / cddYear) : 0;
  return ((1 - ENERGY.share) + ENERGY.share * scale * 12 * (full - coolPart * (1 - COOLING_USE[cooling]))) / year;
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
