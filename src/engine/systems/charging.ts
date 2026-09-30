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
  const grant = c.cityOnly && c.cityOnly !== owned.cityId ? 0 : Math.min(Math.round(c.grant * 100), c.grantShare ? Math.round(all * c.grantShare) : all);
  const cur = saveCurrency(sim.universe);
  const inSave = (x: Money) => (cur === c.currency ? x : exchange(x, c.currency, cur) ?? x);
  return { cost: inSave(all - grant), grant: inSave(grant), label: c.label };
}

export function registerCharging(sim: Simulation): void {
  sim.onCommand<Record<string, never>, { paid: Money; grant: Money }>('home.charger', (_p, { sim: s }) => {
    const person = s.player;
    const q = chargerQuote(s, person);
    if (typeof q === 'string') throw new CommandError(q);
    if (!payFromBank(s, person, q.cost, `A home charger, ${q.label}, its grant taken off`, 'household')) throw new CommandError(`${formatMoney(q.cost, saveCurrency(s.universe))} is more than the bank can cover.`);
    livingIn(person)!.charger = true;
    return { paid: q.cost, grant: q.grant };
  });
}
