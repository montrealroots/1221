/**
 * SLATE — charging an electric car (docs/WORLD.md, stage 3l), from
 * 2026-09-30, from `content/evcatalog.ts`.
 *
 * An electric car's kilometers are bought as kWh at its official consumption.
 * Owning a home with a charger fitted, three-quarters of them come at the
 * home's price (`HOME_CHARGING_SHARE`) and the rest at the public fast
 * chargers'. Without a charger, all come at the public price. On a journey,
 * they all do. A charger goes on a house one owns, not a flat, and stays with
 * it. Charging at home from an ordinary socket isn't kept.
 *
 * The utilities' rewards for charging off the peak, from later on 2026-09-30
 * (`research-ev-tint-security.json`), read by the car's month:
 * - Connecticut, Eversource's Managed Charging: $100 on enrolling with the
 *   charger, and its baseline tier's $120 a year, $10 a month. A household at
 *   or under 300% of the poverty line takes the charger rebate instead, up to
 *   $1,500 of it, and no enrollment incentive.
 * - New York, Con Edison's SmartCharge: 10 cents a kWh charged at home from
 *   midnight to eight, which SLATE's home charging is; $35 a month from June
 *   to September for staying off the peak; and a $25 bonus at three months.
 * California's, Ontario's, BC's, Britain's and Ireland's overnight rates are
 * in the home price already (`CHARGING`), and no other reward was read.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { salesTaxRate } from '../content/tax';
import type { Jurisdiction } from '../content/vehiclefees';
import { CHARGERS, CHARGING, HOME_CHARGING_SHARE } from '../content/evcatalog';
import { payFromBank } from './household';
import { POVERTY_LINE } from '../content/safetynet';
import { rateOn } from '../content/career';
import { earningsOf } from './earnings';
import { livingIn } from './homes';
import { jurisdictionOf } from './vehicles';

/** The share of an owner's charging done at home: with a charger in the home they live in, the IEA's three-quarters. */
export const homeShareOf = (person: Person): number => (livingIn(person)?.charger ? HOME_CHARGING_SHARE : 0);

/** A kWh's price in the place's money, cents, at the share charged at home. */
export function kwhPrice(j: Jurisdiction, homeShare: number): number {
  const c = CHARGING[j];
  return homeShare * c.home + (1 - homeShare) * c.public;
}

/** What fitting a charger costs where the home is, in the save's money, its grant taken off; or why it can't be fitted. */
export function chargerQuote(sim: Simulation, person: Person): { cost: Money; grant: Money; label: string } | string {
  const owned = livingIn(person);
  if (!owned) return 'A charger goes on a home you own.';
  if (!owned.facts.lot) return 'A charger goes on a house with its own parking, not a flat.';
  if (owned.charger) return 'Your home has one.';
  const j = jurisdictionOf(owned.cityId);
  if (!j) return 'SLATE prices a charger where it keeps the car rules.';
  const c = CHARGERS[j];
  const hardware = Math.round(c.hardware * 100);
  const taxed = c.taxIncluded ? hardware : Math.round(hardware * (1 + salesTaxRate(owned.cityId, sim.now, 'goods')));
  const all = taxed + Math.round(c.install * 100);
  const ctRebate = j === 'US-CT' && ctIncomeQualified(sim, person) ? EV_REWARDS.ctChargerRebate * 100 : 0;
  const grant = c.cityOnly && c.cityOnly !== owned.cityId ? 0 : Math.min(Math.round(c.grant * 100) + ctRebate, c.grantShare ? Math.round(all * c.grantShare) : all);
  const cur = saveCurrency(sim.universe);
  const inSave = (x: Money) => (cur === c.currency ? x : exchange(x, c.currency, cur) ?? x);
  return { cost: inSave(all - grant), grant: inSave(grant), label: c.label };
}

export const EV_REWARDS = { ctEnroll: 100, ctMonthly: 10, ctChargerRebate: 1_500, ctIncomeShare: 3, nyPerKwh: 0.1, nySummer: 35, nyBonus: 25 } as const;

/** Whether last year's income is at or under 300% of the poverty line, Connecticut's income test, in dollars. */
export function ctIncomeQualified(sim: Simulation, person: Person): boolean {
  const year = new Date(sim.now).getUTCFullYear() - 1;
  const cur = saveCurrency(sim.universe);
  const income = earningsOf(person).years[year]?.acting ?? 0;
  const usd = cur === 'USD' ? income : exchange(income, cur, 'USD') ?? income;
  return usd <= EV_REWARDS.ctIncomeShare * rateOn(POVERTY_LINE, `${year}-12-31`);
}

/** A month's charging rewards for an electric car charged at home, in the save's money, cents: Connecticut's baseline, New York's per kWh and summer, and each's one-time sum. */
export function chargingRewards(sim: Simulation, person: Person, j: Jurisdiction, homeKwh: number, monthsCharged: number, month: number): Money {
  const owned = livingIn(person);
  if (!owned?.charger || homeKwh <= 0) return 0;
  let usd = 0;
  if (j === 'US-CT') usd = EV_REWARDS.ctMonthly + (monthsCharged === 0 && !owned.chargerRebate ? EV_REWARDS.ctEnroll : 0);
  if (j === 'US-NY') usd = homeKwh * EV_REWARDS.nyPerKwh + (month >= 6 && month <= 9 ? EV_REWARDS.nySummer : 0) + (monthsCharged === 2 ? EV_REWARDS.nyBonus : 0);
  const c = Math.round(usd * 100);
  const cur = saveCurrency(sim.universe);
  return cur === 'USD' ? c : exchange(c, 'USD', cur) ?? c;
}

export function registerCharging(sim: Simulation): void {
  sim.onCommand<Record<string, never>, { paid: Money; grant: Money }>('home.charger', (_p, { sim: s }) => {
    const person = s.player;
    const q = chargerQuote(s, person);
    if (typeof q === 'string') throw new CommandError(q);
    if (!payFromBank(s, person, q.cost, `A home charger, ${q.label}, its grant taken off`, 'household')) throw new CommandError(`${formatMoney(q.cost, saveCurrency(s.universe))} is more than the bank can cover.`);
    livingIn(person)!.charger = true;
    // Connecticut's income-qualified rebate stands in for its enrollment incentive.
    if (jurisdictionOf(livingIn(person)!.cityId) === 'US-CT' && ctIncomeQualified(s, person)) livingIn(person)!.chargerRebate = true;
    return { paid: q.cost, grant: q.grant };
  });
}
