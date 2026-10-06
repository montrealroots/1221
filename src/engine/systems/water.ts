/**
 * SLATE — water and sewer billed by the town's own tariff, to whoever the
 * town bills (the master plan's "Still Open", from 2026-10-03;
 * `docs/research/world/research-water-washing.json` and
 * `research-gaps-services.json`, read 2026-10-02). Until then no home paid
 * for water at all: the atlas's bills are power, heat, phone and internet.
 *
 * **Who's billed.** In London Thames Water bills whoever lives there, a
 * renter as much as an owner, so every home there pays, a room its share of
 * the standing charges as of the bills. Elsewhere the utility bills the
 * property's owner: a renter's water is in the rent, as New York's, Toronto's
 * and Vancouver's own pages say, and an owner pays for a house; an owned
 * flat's is the building's. Ireland charges households nothing.
 *
 * **The tariffs**, metered, with sewer:
 * - New York: $5.35 a hundred cubic feet, sewer 159% of it, and at least
 *   49 cents a day (the Water Board, from July 2026).
 * - Los Angeles: LADWP's Schedule A tier 1, $12.495 a hundred cubic feet to
 *   June and $11.794 from July (the allotment for tier 2 is by lot and zone,
 *   and isn't kept), and LA Sanitation's sewer, $9.28 then $10.13.
 * - New Haven: the RWA's $23.63 a month and $5.41 a hundred cubic feet, and
 *   the WPCA's $27.50 a month covering 5, $5.50 each above and $18 to bill.
 * - Toronto: $4.8629 a cubic meter, water and wastewater, paid on time.
 * - Vancouver: the flat year, $867 water and $1,238 sewer for a house, billed
 *   whatever is used.
 * - London: Thames Water's £2.7346 a cubic meter of water and £1.4721 of
 *   wastewater, and £66.87 and £128.13 a year standing.
 * - Mexico City, from 2026-10-03 (`research-utilities-mx-outages.json`):
 *   SACMEX's domestic metered tariff in the Código Fiscal's article 172 as
 *   reformed for 2026, billed every two months by blocks of liters, at the
 *   Alta class, which most of Polanco's, the Condesa's and Roma Norte's
 *   blocks are in (SACMEX's 2019 data); a month is half of a two months'
 *   bill on twice its liters, SLATE's arithmetic. Until then it wasn't
 *   billed.
 *
 * **What's used**: each person living there a day at home, the published
 * average: America's 221.8 liters indoors (REU2016), Ontario's 187
 * (Statistics Canada), a metered home's 122 in England and Wales
 * (Discover Water), and Mexico City's 366 (INFO CDMX's 2021 figure; SACMEX
 * gives 380 consumed against 150 supplied). A day away uses none.
 *
 * **Showers and baths, metered** (from 2026-10-03, `research-water-washing.json`):
 * the average's own showers come out and the player's go in, so showering
 * oftener than the average costs more and less often less. America's and
 * Canada's shower is REU2016's 7.8 minutes at 7.9 liters a minute, 59.8
 * liters, and its 11.1 gallons a person a day comes to 0.70 showers; Britain's
 * is the Energy Saving Trust's 60 liters, 4.4 a week, and a bath 80 liters, 1.3
 * a week. A bath elsewhere isn't metered: no volume for one was read there.
 *
 * From 2026-10-06 a shower is as long as the player takes it (`hygiene.shower_minutes`), and counts as that share of
 * the country's average shower: REU2016's 7.8 minutes in America and Canada, the Energy Saving Trust's seven and a
 * half in Britain (At Home with Water, 2013, p. 19: "approximately eight liters/min", 60 liters). Until then every
 * shower was the average's, however long. Ireland meters no home's water (its domestic charges were abolished), and
 * no shower's volume was read in Mexico, so there a shower's length changes no bill.
 */

import type { Simulation } from '../core/simulation';
import { CITIES } from '../content/geography';
import type { Person } from '../domain/model';
import { saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { isFlat } from '../content/homes';
import { homePlace, livingOf } from './dwelling';
import { contactsOf } from './people';
import { KIND_SHARE } from './electricity';

const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const HCF_LITERS = 2_831.68;

interface WaterTariff { currency: string; perPersonLiters: number; renters: boolean; bill: (liters: number, month: number, days: number, flat: boolean) => number }

export const WATER_TARIFFS: Readonly<Record<string, WaterTariff>> = {
  'us-ny-newyork': { currency: 'USD', perPersonLiters: 221.8, renters: false, bill: (l, _m, d) => Math.max(0.49 * d, 5.35 * (l / HCF_LITERS)) * 2.59 },
  'us-ca-losangeles': { currency: 'USD', perPersonLiters: 221.8, renters: false, bill: (l, m) => (l / HCF_LITERS) * (m <= 6 ? 12.495 + 9.28 : 11.794 + 10.13) },
  'us-ct-newhaven': { currency: 'USD', perPersonLiters: 221.8, renters: false, bill: (l) => { const ccf = l / HCF_LITERS; return 23.63 + 5.41 * ccf + 27.5 + 18 + 5.5 * Math.max(0, ccf - 5); } },
  'ca-on-toronto': { currency: 'CAD', perPersonLiters: 187, renters: false, bill: (l) => 4.8629 * (l / 1_000) },
  'ca-bc-vancouver': { currency: 'CAD', perPersonLiters: 0, renters: false, bill: (_l, _m, _d, flat) => (flat ? 587 + 837 : 867 + 1_238) / 12 },
  'uk-eng-london': { currency: 'GBP', perPersonLiters: 122, renters: true, bill: (l, _m, d) => (l / 1_000) * (2.7346 + 1.4721) + ((66.87 + 128.13) * d) / 365 },
  'mx-cmx-mexicocity': { currency: 'MXN', perPersonLiters: 366, renters: false, bill: (l) => sacmexBimester(l * 2) / 2 },
};

/** SACMEX's Alta class, the Código Fiscal's article 172 for 2026: each block's lower edge in liters, its minimum and each thousand liters above the edge, pesos. */
export const SACMEX_ALTA: readonly (readonly [number, number, number])[] = [
  [0, 265.25, 0], [15_000, 265.25, 29.86], [20_000, 414.49, 33.38], [30_000, 748.22, 39.62], [40_000, 1_144.31, 42.32],
  [50_000, 1_567.37, 45.34], [70_000, 2_474.15, 58.96], [90_000, 3_652.98, 78.62], [120_000, 6_011.31, 123.79],
];
/** Two months' water at the Alta class: the block's minimum and its rate on the liters above its edge. */
export function sacmexBimester(liters: number): number {
  const [edge, least, per] = [...SACMEX_ALTA].reverse().find(([from]) => liters > from) ?? SACMEX_ALTA[0]!;
  return least + ((liters - edge) / 1_000) * per;
}

const inSave = (sim: Simulation, units: number, currency: string): Money => { const c = Math.round(units * 100); const cur = saveCurrency(sim.universe); return cur === currency ? c : exchange(c, currency, cur) ?? c; };

/** Who lives in the home: them, and a partner living with them. */
export const householdOf = (person: Person): number => 1 + contactsOf(person).filter((c) => c.livesWith !== undefined).length;

/** Whether the town bills this home its water: every home where the occupier's billed, or a house of their own. */
export function billedWater(sim: Simulation, person: Person): boolean {
  const home = person.home;
  const t = home ? WATER_TARIFFS[home.cityId] : undefined;
  if (!home || !t || home.kind === 'sofa') return false;
  if (t.renters) return true;
  const place = homePlace(sim, person);
  return home.kind === 'owned' && Boolean(place) && !isFlat(place!.type);
}

/** A shower's and a bath's liters, and how many of each a person takes a day, by country. */
export const WASHING: Readonly<Record<string, { showerL: number; showersADay: number; bathL?: number; bathsADay?: number }>> = {
  us: { showerL: 59.8, showersADay: (11.1 * 3.78541) / 59.8 },
  ca: { showerL: 59.8, showersADay: (11.1 * 3.78541) / 59.8 },
  gb: { showerL: 60, showersADay: 4.4 / 7, bathL: 80, bathsADay: 1.3 / 7 },
};

/**
 * What a pet drinks a day, liters (from 2026-10-04): the Ontario SPCA's 60 to
 * 80 ml a kilogram for a dog, 40 to 60 for a cat, at the middle of each for
 * SLATE's 20 kg dog and 4 kg cat (`content/petair.ts`). It counts toward the
 * month's water every day of it: a pet drinks at home whoever's there.
 */
export const PET_WATER_L = { dog: 0.07 * 20, cat: 0.05 * 4 } as const;

/** The month's liters used at home: each of the household a day there, the player's own showers and baths in place of the average's, and the pets' water. */
export function litersUsed(person: Person, cityId: string, month: number): number {
  const t = WATER_TARIFFS[cityId];
  if (!t) return 0;
  const l = person.living;
  const days = l?.billDays ? l.homeDays ?? 0 : DAYS[month - 1]!;
  const pets = (person.pets ?? []).reduce((n, pet) => n + PET_WATER_L[pet.species], 0) * DAYS[month - 1]!;
  // And a guest's days staying, each a person's (from 2026-10-05).
  const average = t.perPersonLiters * (householdOf(person) * days + (l?.guestDays ?? 0)) + pets;
  const w = WASHING[CITIES.get(cityId)?.countryId === 'uk' ? 'gb' : CITIES.get(cityId)?.countryId ?? ''];
  if (!w || !l?.billDays || t.perPersonLiters === 0) return average;
  const showers = ((l.showers ?? 0) - w.showersADay * days) * w.showerL;
  const baths = w.bathL && w.bathsADay ? ((l.baths ?? 0) - w.bathsADay * days) * w.bathL : 0;
  return average + showers + baths;
}

/** The country's average shower, minutes, from the same studies as its liters (`WASHING`). */
export const SHOWER_MINUTES: Readonly<Record<string, number>> = { us: 7.8, ca: 7.8, gb: 7.5 };

/**
 * A shower or a bath at home, counted toward the month's water: a shower as its share of the country's average one,
 * by its minutes where they're given. Until 2026-10-04 one taken before the home's record was first kept wasn't counted.
 */
export function countWash(person: Person, bath: boolean, minutes?: number): void {
  const l = livingOf(person);
  if (bath) { l.baths = (l.baths ?? 0) + 1; return; }
  const c = CITIES.get(person.home?.cityId ?? '')?.countryId;
  const typical = SHOWER_MINUTES[c === 'uk' ? 'gb' : c ?? ''];
  l.showers = (l.showers ?? 0) + (minutes !== undefined && typical ? minutes / typical : 1);
}

/** The month's water and sewer, in the save's money; nothing where the town doesn't bill this home. */
export function waterBillOf(sim: Simulation, person: Person, month: number): Money {
  if (!billedWater(sim, person)) return 0;
  const home = person.home!;
  const t = WATER_TARIFFS[home.cityId]!;
  const days = DAYS[month - 1]!;
  const place = homePlace(sim, person);
  const whole = t.bill(litersUsed(person, home.cityId, month), month, days, Boolean(place && isFlat(place.type)));
  // A room pays its share of the standing charges, as of the bills; its own use in full.
  const share = home.kind === 'shared' ? KIND_SHARE.shared! : 1;
  const standing = t.bill(0, month, days, false);
  return inSave(sim, (whole - standing) + standing * share, t.currency);
}
