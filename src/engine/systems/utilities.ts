/**
 * SLATE — the utilities a home runs on (Stage 11 of `docs/BACKLOG.md`, from
 * 2026-10-01; `docs/research/world/research-utilities.json`).
 *
 * **Setting up.** Moving into a new home opens its accounts, and where a
 * provider publishes a charge for it, it's paid: Toronto Hydro's CA$35 with
 * the 13% HST, BC Hydro's CA$13.50 with the 5% GST, SoCalGas's $25 in Los
 * Angeles. Con Edison, United Illuminating, Electric Ireland, the British
 * suppliers and CFE publish none for taking over a connection. Electric
 * Ireland's €300 security deposit and the deposits American utilities may
 * ask are refundable and asked only of some, so SLATE doesn't take them. The
 * first home a life has was set up before it began.
 *
 * **Power cuts.** Each town's distributor's interruptions a customer a year
 * (SAIFI) and minutes without power a customer a year (SAIDI), from EIA Form
 * 861 for 2024, London Power Networks' 2024/25 report, ESB Networks' 2024
 * report, the OEB's Toronto Hydro scorecard, BC Hydro's 2024/25 service
 * plan report and CRE's 2024 national figures for CFE. A day's chance of a
 * cut at home is a day's share of the year's interruptions, and a cut's
 * length is drawn around their mean, SAIDI over SAIFI, SLATE's reading of
 * how they spread. Over four hours, what's in the fridge spoils, and over
 * forty-eight what's in the freezer (FoodSafety.gov: a fridge keeps food
 * safe four hours without power, a full freezer forty-eight).
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Instant } from '../core/time';
import type { Money } from '../core/money';
import { saveCurrency } from '../core/money';
import { exchange } from '../content/currency';
import { homeKeyOf, itemsOf } from './items';
import { spend } from './household';

/** A distributor's year: interruptions a customer, and minutes without power a customer. */
export const RELIABILITY: Readonly<Record<string, { distributor: string; saifi: number; saidiMinutes: number }>> = {
  'us-ny-newyork': { distributor: 'Con Edison', saifi: 0.13, saidiMinutes: 27.785 },
  'us-ca-losangeles': { distributor: 'LADWP', saifi: 0.66, saidiMinutes: 111.16 },
  'us-ct-newhaven': { distributor: 'United Illuminating', saifi: 0.79, saidiMinutes: 121.8 },
  'uk-eng-london': { distributor: 'UK Power Networks', saifi: 0.112, saidiMinutes: 10.5 },
  'ie-lei-dublin': { distributor: 'ESB Networks', saifi: 1.75, saidiMinutes: 219 },
  'ca-on-toronto': { distributor: 'Toronto Hydro', saifi: 1.29, saidiMinutes: 56.4 },
  'ca-bc-vancouver': { distributor: 'BC Hydro', saifi: 1.48, saidiMinutes: 220.2 },
  'mx-cmx-mexicocity': { distributor: 'CFE', saifi: 1.038, saidiMinutes: 116.706 },
};

/** What opening a home's accounts costs where a provider publishes it, in its money, cents, with the tax on it. */
export const SETUP: Readonly<Record<string, readonly { provider: string; cents: number; currency: string }[]>> = {
  'ca-on-toronto': [{ provider: 'Toronto Hydro', cents: Math.round(35_00 * 1.13), currency: 'CAD' }],
  'ca-bc-vancouver': [{ provider: 'BC Hydro', cents: Math.round(13_50 * 1.05), currency: 'CAD' }],
  'us-ca-losangeles': [{ provider: 'SoCalGas', cents: 25_00, currency: 'USD' }],
};

/** How long food keeps without power: a fridge, and a full freezer (FoodSafety.gov). */
export const WITHOUT_POWER = { fridgeHours: 4, freezerHours: 48 } as const;

/** What setting up a home's accounts in a town costs, in the save's money. */
export function setupCost(sim: Simulation, cityId: string): Money {
  const into = saveCurrency(sim.universe);
  return (SETUP[cityId] ?? []).reduce((sum, s) => sum + (s.currency === into ? s.cents : exchange(s.cents, s.currency, into) ?? s.cents), 0);
}

/** A home moved into: its accounts opened, and paid for where they cost anything. The first home a life has, nothing. */
export function settleIn(sim: Simulation, person: Person): Money {
  const key = homeKeyOf(person.home);
  if (!key || person.utilitiesAt === key) return 0;
  const first = person.utilitiesAt === undefined;
  person.utilitiesAt = key;
  if (first) return 0;
  const cost = setupCost(sim, person.home!.cityId);
  if (cost > 0) spend(sim, person, cost, (SETUP[person.home!.cityId] ?? []).map((s) => s.provider).join(' and ') + ', a new account', 'bills', true);
  return cost;
}

/** A day's chance of a power cut at home in a town. */
export const outageChance = (cityId: string): number => {
  const r = RELIABILITY[cityId];
  return r ? 1 - Math.exp(-r.saifi / 365) : 0;
};

/** What a cut of so many hours spoils at a home: the fridge past four, the freezer past forty-eight. How many things. */
export function spoilWithoutPower(person: Person, home: string, hours: number, at: Instant): number {
  const spot = (s: string) => (i: ReturnType<typeof itemsOf>[number]) => i.food && i.at.kind === 'home' && i.at.home === home && i.at.spot === s;
  let spoiled = 0;
  if (hours > WITHOUT_POWER.fridgeHours) for (const i of itemsOf(person).filter(spot('fridge'))) { i.food!.expiresAt = at; spoiled += 1; }
  if (hours > WITHOUT_POWER.freezerHours) for (const i of itemsOf(person).filter(spot('freezer'))) { i.food!.expiresAt = at; spoiled += 1; }
  return spoiled;
}

/** The day's power at home: a cut drawn at the town's rate, and what it spoils. The hours without power, or nothing. */
export function powerDay(sim: Simulation, person: Person, at: Instant): number | undefined {
  const cityId = person.home?.cityId;
  const r = cityId ? RELIABILITY[cityId] : undefined;
  const home = homeKeyOf(person.home);
  if (!r || !home) return undefined;
  const rng = sim.rng('utilities.outage', person.id, String(at));
  if (rng.next() >= outageChance(cityId!)) return undefined;
  const mean = r.saidiMinutes / r.saifi / 60;
  const hours = -Math.log(1 - rng.next()) * mean;
  const spoiled = spoilWithoutPower(person, home, hours, at);
  if (person.id === sim.universe.playerId) {
    sim.notify({ category: 'home', title: 'A Power Cut', body: `${r.distributor}’s power was off at home for ${hours < 1 ? `${Math.max(1, Math.round(hours * 60))} minutes` : `${hours.toFixed(1)} hours`}.${spoiled ? ` What was in the fridge${hours > WITHOUT_POWER.freezerHours ? ' and the freezer' : ''} spoiled.` : ''}`, importance: spoiled ? 50 : 20, route: '/workspace/food' });
  }
  return hours;
}

export function registerUtilities(sim: Simulation): void {
  sim.onEvent('world.day_rollover', 'utilities.day', (_e, { sim: s }) => {
    for (const person of Object.values(s.universe.people)) {
      settleIn(s, person);
      powerDay(s, person, s.now);
    }
  });
}
