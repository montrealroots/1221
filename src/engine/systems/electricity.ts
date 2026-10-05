/**
 * SLATE — electricity billed by the utility's own tariff, for what the home
 * used (Stage 11 of `docs/BACKLOG.md`, from 2026-10-02), from
 * `docs/research/world/research-gaps-services.json`, read 2026-10-02.
 *
 * **The tariffs.** Each town's residential tariff, its fixed charge and its
 * rate for a kilowatt-hour, in blocks where it has them:
 * - New York, Con Edison SC1: $23.91 a month, all-in 30.8 cents a kWh in
 *   winter, and in summer 32.3 cents for the first 250 and 34.9 above
 *   (third-party compilations; Con Edison's own rates page returned none).
 * - Los Angeles, LADWP R-1A, Zone 1: 2026's rates by period, tier 1 the
 *   first 350 kWh, tier 2 the next 700, tier 3 above 1,050, and a power
 *   access charge of $2.30, $7.90 or $22.70 by the tier reached; a $10
 *   minimum bill (third-party).
 * - New Haven, United Illuminating Rate R: $13.02 a month, distribution
 *   11.3469 and transmission 4.8722 cents, and standard service generation
 *   13.695 cents to June and 11.9473 from July. The public-benefits figure
 *   read, 0.034 cents, looks misread, and isn't added.
 * - London, the Ofgem price cap for the London region, October to December
 *   2026: 26.6p a kWh and 42.92p a day (a third-party page; Ofgem's regional
 *   table loads by script).
 * - Dublin, Electric Ireland's standard 24-hour urban: 38.04 cents a kWh and
 *   €250.76 a year standing, with VAT.
 * - Toronto: the Regulated Price Plan's tiers, 12.0 cents to 600 kWh from May
 *   to October and 1,000 kWh in winter, 14.2 above; Toronto Hydro's C$51.18 a
 *   month, transmission 2.241, capacity 0.048 and deferral 0.112 cents a kWh;
 *   the wholesale market service 0.53 cents and $0.25 standard supply; less
 *   the Ontario Electricity Rebate's 23.5%, then HST at 13%.
 * - Vancouver, BC Hydro schedule 1101: 23.44 cents a day, 11.87 cents a kWh
 *   to 22.1918 kWh a day of the bill and 14.08 above.
 * Mexico City's CFE Tarifa 1 is read too, but no household's typical use is
 * published (two leads differ threefold), so it isn't billed this way.
 *
 * **What the home used.** A typical household's kilowatt-hours a month: New
 * York State's 571, California's 503 and Connecticut's 695 (EIA, 2024);
 * Ofgem's medium 2,500 a year; the CRU's 4,200 a year in Ireland; the OEB's
 * 700 in Ontario; and in British Columbia about 750, the median BC Hydro's
 * step implies, 90% of which it is. A one-bedroom's is its bills' share of
 * an owned home's (SLATE's 180 of 250), a room's 90 of 250. And it's used on
 * the days somebody is home: a month away draws none of it, and the fixed
 * charge is still owed. What a fridge and standby draw in an empty home
 * isn't sourced, and isn't kept.
 *
 * **The bill.** The atlas's bills already carry a typical month's
 * electricity. That month at the tariff comes out, and the month used at the
 * tariff goes in: at home every day the bill is what it was, and a month
 * away, or a block crossed, changes it as the tariff does. Until 2026-10-02
 * a month away on a shoot cost the same as a month at home.
 */

import type { Simulation } from '../core/simulation';
import { showerKwhDelta } from './hotwater';
import { typicalTvKwh } from '../content/tvuse';
import type { Person } from '../domain/model';
import { saveCurrency, type Money } from '../core/money';
import { atHome } from './dwelling';
import { exchange } from '../content/currency';

const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

interface Tariff { currency: string; typicalKwh: number; bill: (kwh: number, month: number, days: number) => number }

const blocks = (kwh: number, steps: readonly [number, number][]): number => {
  let left = kwh;
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

/** LADWP's period of a month, and its three tiers' cents. */
const ladwp = (month: number): [number, number, number] => month <= 3 ? [24.771, 30.63, 30.63] : month <= 5 ? [24.362, 30.221, 30.221] : month === 6 ? [24.362, 30.221, 38.922] : month <= 9 ? [26.408, 32.267, 40.968] : [27.292, 33.151, 33.151];

export const TARIFFS: Readonly<Record<string, Tariff>> = {
  'us-ny-newyork': { currency: 'USD', typicalKwh: 571, bill: (k, m) => 23.91 + (m >= 6 && m <= 9 ? blocks(k, [[250, 0.323], [Infinity, 0.349]]) : k * 0.308) },
  'us-ca-losangeles': {
    currency: 'USD', typicalKwh: 503,
    bill: (k, m) => { const [t1, t2, t3] = ladwp(m); const access = k > 1_050 ? 22.7 : k > 350 ? 7.9 : 2.3; return Math.max(10, access + blocks(k, [[350, t1 / 100], [1_050, t2 / 100], [Infinity, t3 / 100]])); },
  },
  'us-ct-newhaven': { currency: 'USD', typicalKwh: 695, bill: (k, m) => 13.02 + k * (11.3469 + 4.8722 + (m <= 6 ? 13.695 : 11.9473)) / 100 },
  'uk-eng-london': { currency: 'GBP', typicalKwh: 2_500 / 12, bill: (k, _m, d) => 0.4292 * d + k * 0.266 },
  'ie-lei-dublin': { currency: 'EUR', typicalKwh: 4_200 / 12, bill: (k, _m, d) => 250.76 * d / 365 + k * 0.3804 },
  'ca-on-toronto': {
    currency: 'CAD', typicalKwh: 700,
    bill: (k, m) => { const commodity = blocks(k, [[m >= 5 && m <= 10 ? 600 : 1_000, 0.12], [Infinity, 0.142]]); const pre = commodity + 51.18 + k * (0.02241 + 0.00048 + 0.00112 + 0.0053) + 0.25; return pre * (1 - 0.235) * 1.13; },
  },
  'ca-bc-vancouver': { currency: 'CAD', typicalKwh: 750, bill: (k, _m, d) => 0.2344 * d + blocks(k, [[22.1918 * d, 0.1187], [Infinity, 0.1408]]) },
};

/** A home kind's share of a typical household's use: its bills' share of an owned home's. */
export const KIND_SHARE: Readonly<Record<string, number>> = { owned: 1, own: 180 / 250, shared: 90 / 250 };

const inSave = (sim: Simulation, units: number, currency: string): Money => { const c = Math.round(units * 100); const cur = saveCurrency(sim.universe); return cur === currency ? c : exchange(c, currency, cur) ?? c; };

/** The month's kilowatt-hours used at home: the typical household's for the kind of home, on the days somebody was there. */
export function kwhUsed(person: Person, cityId: string): number | undefined {
  const t = TARIFFS[cityId];
  const share = person.home ? KIND_SHARE[person.home.kind] : undefined;
  if (!t || share === undefined) return undefined;
  const l = person.living;
  const home = l?.billDays ? (l.homeDays ?? 0) / l.billDays : 1;
  return t.typicalKwh * share * home;
}

/** What the tariff makes of the month used against the atlas's typical month, in the save's money; nothing where no tariff is kept. */
export function electricityAdjustment(sim: Simulation, person: Person, month: number): Money {
  const cityId = person.home?.cityId;
  const t = cityId ? TARIFFS[cityId] : undefined;
  const base = cityId ? kwhUsed(person, cityId) : undefined;
  if (!t || base === undefined) return 0;
  // An electric heater's showers past the average, or short of it (`systems/hotwater.ts`, from 2026-10-03).
  // And what a sauna's heater used (from 2026-10-04).
  // And from 2026-10-05 television watched on a set of one's own (`tvKwh`), past the typical household's viewing the
  // typical month already holds, on the days at home (`content/tvuse.ts`). Watching less earns nothing back: SLATE
  // doesn't see all of a life's viewing (an evening unwinding with the TV is some), so it never claims less than typical.
  const l = person.living;
  const homeDays = l?.billDays ? l.homeDays ?? 0 : DAYS[month - 1]!;
  const tv = Math.max(0, (l?.tvKwh ?? 0) - typicalTvKwh(homeDays));
  const used = base + showerKwhDelta(sim, person, month) + (l?.extraKwh ?? 0) + tv;
  const days = DAYS[month - 1]!;
  const typical = t.typicalKwh * KIND_SHARE[person.home!.kind]!;
  return inSave(sim, t.bill(used, month, days) - t.bill(typical, month, days), t.currency);
}

/** A day counted toward the month's use: home, or away. */
export function countHomeDay(person: Person, home: boolean): void {
  if (!person.home || person.home.kind === 'sofa' || !person.living) return;
  person.living.billDays = (person.living.billDays ?? 0) + 1;
  if (home) person.living.homeDays = (person.living.homeDays ?? 0) + 1;
}

export function registerElectricity(sim: Simulation): void {
  sim.onEvent('world.day_rollover', 'electricity.day', (_e, { sim: s }) => {
    for (const person of Object.values(s.universe.people)) countHomeDay(person, atHome(person));
  });
}
