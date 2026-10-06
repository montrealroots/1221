/**
 * SLATE — a home's hot water, and what a shower takes to heat (the master
 * plan's §31f, from 2026-10-03; `docs/research/world/research-water-washing.json`).
 *
 * **The heater.** Each home's is drawn once, at its country's published
 * share of homes by the fuel that heats their water (decider
 * `homes.water_heater`): America's EIA RECS 2020, 48.0% gas and 46.2%
 * electric, the rest propane, oil or other; Canada's NRCan stock share, 48.6%
 * and 48.3% (read secondhand); in Britain, the Energy Saving Trust's 35% of
 * showers that heat their own water electrically, the rest fed from the
 * home's boiler. No share was read for Ireland or Mexico City.
 *
 * **The heat.** An electric heater's shower is metered against the average,
 * as its water is (`systems/water.ts`): each shower more than the country's
 * average costs its heat in kilowatt-hours, each fewer saves it. America's
 * and Canada's is 59.8 liters, two-thirds of it hot (REU2016's 17.8 hot
 * gallons of 26.9), heated from the DOE test's 14.4 °C to its 51.7 °C;
 * Britain's electric shower heats all of its 60 liters from the month's cold
 * mains (SAP 2009's table) to the 41 °C at the head; 0.001164 kWh a liter and
 * degree. Until 2026-10-06 a gas heater's shower wasn't metered, what share
 * of the gas burned reaches the water not having been read, so the gas bill
 * kept its typical month whoever showered how often.
 *
 * **Gas** (from 2026-10-06; `research-gas-water-heater.json`): the same heat
 * past the average, over the share of the gas that reaches the water, goes on
 * the gas bill (`gasAdjustment` in `systems/gas.ts`).
 * - America: ENERGY STAR's least UEF for a gas storage heater of 20 to 55
 *   gallons, 0.81 at the medium draw. It's the floor for a certified heater
 *   and the 24-hour test's, standby loss and all, so an older or uncertified
 *   tank burns more than this bills; the DOE's own minimum wasn't read.
 * - Britain: a shower fed from the home's boiler (the 65% that aren't
 *   electric), a combi, at the 92% ErP rating every gas boiler fitted since
 *   April 2018 must reach. SLATE bills every London home's gas, so the boiler
 *   is taken to burn it. The Energy Saving Trust's field study found none of
 *   40 A-rated condensing boilers at its rating over a year, 83% of them
 *   between 75% and 85%: the rating is what's published as a figure, so
 *   it's the one used, and the bill is low by that much.
 * Canada's gas heaters (48.6%) aren't billed for it: no efficiency read there.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { CITIES } from '../content/geography';
import { WASHING } from './water';

export type WaterHeater = 'gas' | 'electric' | 'other';

/** The share of homes heating water with each fuel, by country; the rest 'other'. */
export const HEATER_SHARE: Readonly<Record<string, { gas: number; electric: number }>> = {
  us: { gas: 59.33 / 123.53, electric: 57.04 / 123.53 },
  ca: { gas: 0.486, electric: 0.483 },
  // Britain's split is the showers', and only the electric showers' heat is kept.
  uk: { gas: 0, electric: 0.35 },
};

const KWH_PER_LITER_K = 0.001164;
/** SAP 2009 Table G2: cold mains water, °C, by month. */
export const COLD_MAINS_C = [11.1, 10.8, 11.8, 14.7, 16.1, 18.2, 21.3, 19.2, 18.8, 16.3, 13.3, 11.8] as const;

/** The fuel that heats a home's water, drawn at its country's share; nothing where none is published. */
export function waterHeaterOf(sim: Simulation, person: Person): WaterHeater | undefined {
  const home = person.home;
  const share = home ? HEATER_SHARE[CITIES.get(home.cityId)?.countryId ?? ''] : undefined;
  if (!home || !share) return undefined;
  const x = sim.rng('homes.water_heater', person.id, home.cityId, String(home.since ?? 0)).next();
  return x < share.electric ? 'electric' : x < share.electric + share.gas ? 'gas' : 'other';
}

/** The kilowatt-hours one shower takes to heat, by country and month. */
export function showerKwh(countryId: string, month: number): number | undefined {
  if (countryId === 'us' || countryId === 'ca') return 59.8 * (17.8 / 26.9) * (51.7 - 14.4) * KWH_PER_LITER_K;
  if (countryId === 'uk') return 60 * (41 - COLD_MAINS_C[month - 1]!) * KWH_PER_LITER_K;
  return undefined;
}

/** The heat of the month's showers at home past the average, in kilowatt-hours, where a heater of the kind heats them; nothing otherwise. */
function showersPastAverage(sim: Simulation, person: Person, month: number, heater: WaterHeater): number {
  const l = person.living;
  const country = CITIES.get(person.home?.cityId ?? '')?.countryId ?? '';
  const w = WASHING[country === 'uk' ? 'gb' : country];
  const kwh = showerKwh(country, month);
  if (!l?.billDays || !w || kwh === undefined || waterHeaterOf(sim, person) !== heater) return 0;
  return ((l.showers ?? 0) - w.showersADay * (l.homeDays ?? 0)) * kwh;
}

/** The month's showers at home past the average, in kilowatt-hours, where an electric heater heats them; nothing otherwise. */
export const showerKwhDelta = (sim: Simulation, person: Person, month: number): number => showersPastAverage(sim, person, month, 'electric');

/** The share of a gas heater's fuel that reaches the water, by country, and the heater that burns it: ENERGY STAR's 0.81 UEF, the ErP's 92% for a boiler. */
export const GAS_EFFICIENCY: Readonly<Record<string, { heater: WaterHeater; share: number }>> = {
  us: { heater: 'gas', share: 0.81 },
  uk: { heater: 'other', share: 0.92 },
};

/** The month's showers at home past the average, in kilowatt-hours of gas burned, where gas heats them; nothing otherwise. */
export function showerGasKwhDelta(sim: Simulation, person: Person, month: number): number {
  const g = GAS_EFFICIENCY[CITIES.get(person.home?.cityId ?? '')?.countryId ?? ''];
  return g ? showersPastAverage(sim, person, month, g.heater) / g.share : 0;
}
