/**
 * SLATE — natural gas billed by the utility's own tariff, for what the home
 * used (the master plan's "Still Open", from 2026-10-03), from
 * `research-gaps-services.json` (read 2026-10-02) and
 * `derived-gas-use.json`, as `systems/electricity.ts` does for power.
 *
 * **The tariffs.**
 * - New York, Con Edison SC3 heating: $34 for the first 3 therms, $1.6383 a
 *   therm for the next 87 and $1.3831 above, with September 2026's gas cost
 *   factor, 45.38 cents, less the monthly adjustment's 2.57 (Con Edison's
 *   own rate book). Its merchant-function, system-benefits and gross-receipts
 *   lines weren't read, and aren't added. Brooklyn and most of Queens are
 *   National Grid's, whose tariff wasn't read.
 * - Los Angeles, SoCalGas GR: 16.438 cents a day and 142.208 cents a therm
 *   at the baseline rate, read secondhand; the baseline allowance by climate
 *   zone wasn't read, so every therm is at it.
 * - New Haven, Southern Connecticut Gas RSH: $17.20 a month, 104.52 cents a
 *   ccf for the first 30 and 42.51 above (secondhand), and PURA's purchased
 *   gas adjustment by month, September's carried on past it.
 * - London, the Ofgem cap for the London region, October to December 2026:
 *   8.15p a kWh and 30.2p a day, with VAT (a third-party page).
 * - Dublin, Bord Gáis Energy's standard: 12.36 cents a kWh and €140.92 a
 *   year, with VAT (secondhand); its carbon tax line isn't added.
 * - Toronto, Enbridge Rate 1: C$27.69 a month, delivery by block (14.2691
 *   cents a cubic meter for the first 30, 13.4308 the next 55, 12.7744 the
 *   next 85, 12.285 above), and 15.5026 cents more for transportation, gas
 *   supply, cost adjustment and the facility carbon charge; HST at 13%.
 * - Vancouver, FortisBC Rate Schedule 1: 42.16 cents a day and $12.601 a
 *   gigajoule; GST at 5%.
 * - Mexico City, LP gas, from 2026-10-03 (`research-vehicles-utilities-gaps.json`,
 *   `research-utilities-mx-outages.json`): the CNE's maximum price for the
 *   city in the week to 3 October 2026, 20.10 pesos a kilo with IVA (read
 *   from UnoTV's report of it); a household's 29.4 kilos a month, INEGI's
 *   ENIGH 2024 mean spending on cylinder and tank gas in the city, 559.7
 *   pesos a month, over August 2024's 19.01 a kilo, SLATE's arithmetic.
 *   Until then it stayed as the atlas had it.
 *
 * **What the home used.** A typical household's gas a month: EIA's 2024
 * residential consumption over customers, New York's 74.9 therms,
 * California's 31.7 and Connecticut's 66.4 ccf; Ofgem's medium 9,500 kWh a
 * year; the CRU's 11,000 kWh; Enbridge's typical 2,400 cubic meters; and
 * FortisBC's sample 90 gigajoules. By kind of home and days home as
 * electricity's: a month away draws none of it, which a heating set-back
 * wouldn't quite do, its draw unpublished. No month's share of the year is
 * kept, so a winter month and a summer one use the same.
 *
 * **The bill.** The atlas's bills carry a typical month's gas in their heat.
 * That month at the tariff comes out, and the month used goes in.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { KIND_SHARE } from './electricity';

const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
/** PURA's purchased gas adjustment for Southern Connecticut Gas's heating customers, January to September 2026, a ccf. */
const SCG_PGA = [0.6398, 0.6807, 0.691, 0.6436, 0.6021, 0.5506, 0.5506, 0.5509, 0.5831];

interface GasTariff { currency: string; unit: 'therm' | 'ccf' | 'kWh' | 'm3' | 'GJ' | 'kg'; typical: number; bill: (used: number, month: number, days: number) => number }

const blocks = (used: number, steps: readonly [number, number][]): number => {
  let left = used;
  let from = 0;
  let sum = 0;
  for (const [upTo, rate] of steps) {
    const take = Math.max(0, Math.min(left, upTo - from));
    sum += take * rate;
    left -= take;
    from = upTo;
    if (left <= 0) break;
  }
  return sum;
};

export const GAS_TARIFFS: Readonly<Record<string, GasTariff>> = {
  'us-ny-newyork': { currency: 'USD', unit: 'therm', typical: 74.9, bill: (t) => 34 + blocks(Math.max(0, t - 3), [[87, 1.6383], [Infinity, 1.3831]]) + t * (0.453801 - 0.025688) },
  'us-ca-losangeles': { currency: 'USD', unit: 'therm', typical: 31.7, bill: (t, _m, d) => 0.16438 * d + t * 1.42208 },
  'us-ct-newhaven': { currency: 'USD', unit: 'ccf', typical: 66.4, bill: (c, m) => 17.2 + blocks(c, [[30, 1.0452], [Infinity, 0.4251]]) + c * (SCG_PGA[Math.min(m, SCG_PGA.length) - 1] ?? SCG_PGA[SCG_PGA.length - 1]!) },
  'uk-eng-london': { currency: 'GBP', unit: 'kWh', typical: 9_500 / 12, bill: (k, _m, d) => 0.302 * d + k * 0.0815 },
  'ie-lei-dublin': { currency: 'EUR', unit: 'kWh', typical: 11_000 / 12, bill: (k, _m, d) => (140.92 * d) / 365 + k * 0.1236 },
  'ca-on-toronto': { currency: 'CAD', unit: 'm3', typical: 2_400 / 12, bill: (v) => (27.69 + blocks(v, [[30, 0.142691], [85, 0.134308], [170, 0.127744], [Infinity, 0.12285]]) + v * 0.155026) * 1.13 },
  'ca-bc-vancouver': { currency: 'CAD', unit: 'GJ', typical: 90 / 12, bill: (g, _m, d) => (0.4216 * d + g * 12.601) * 1.05 },
  'mx-cmx-mexicocity': { currency: 'MXN', unit: 'kg', typical: (1_679.2 / 3) / 19.01, bill: (kg) => kg * 20.1 },
};

const inSave = (sim: Simulation, units: number, currency: string): Money => { const c = Math.round(units * 100); const cur = saveCurrency(sim.universe); return cur === currency ? c : exchange(c, currency, cur) ?? c; };

/** The month's gas used at home, in the tariff's unit: the typical household's for the kind of home, on the days somebody was there. */
export function gasUsed(person: Person, cityId: string): number | undefined {
  const t = GAS_TARIFFS[cityId];
  const share = person.home ? KIND_SHARE[person.home.kind] : undefined;
  if (!t || share === undefined) return undefined;
  const l = person.living;
  const home = l?.billDays ? (l.homeDays ?? 0) / l.billDays : 1;
  return t.typical * share * home;
}

/** What the tariff makes of the month used against the atlas's typical month, in the save's money; nothing where no tariff is kept. */
export function gasAdjustment(sim: Simulation, person: Person, month: number): Money {
  const cityId = person.home?.cityId;
  const t = cityId ? GAS_TARIFFS[cityId] : undefined;
  const used = cityId ? gasUsed(person, cityId) : undefined;
  if (!t || used === undefined) return 0;
  const days = DAYS[month - 1]!;
  const typical = t.typical * KIND_SHARE[person.home!.kind]!;
  return inSave(sim, t.bill(used, month, days) - t.bill(typical, month, days), t.currency);
}
