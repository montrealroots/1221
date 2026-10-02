/**
 * SLATE — a letting agent managing a home you let (Stage 11 of
 * `docs/BACKLOG.md`, from 2026-10-01; the agents in
 * `content/propertymanagers.ts`).
 *
 * Letting a home yourself, you show it and hand over the keys: a tenant
 * found moves in only while you're in the home's town, and waits for you
 * otherwise (`tenancies` in `systems/homes.ts`). An agent does it while
 * you're away, on its terms: its letting fee when a tenant moves in, its
 * share of each month's rent (or its flat fee), and its fee on a renewal.
 * Hire one for a home in a town where one publishes its fees; let it go
 * any time, no agent read publishing a notice period.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { PROPERTY_MANAGERS, type PropertyManager } from '../content/propertymanagers';
import { spend } from './household';
import type { OwnedHome, Tenancy } from './homes';

export const managerIn = (cityId: string): PropertyManager | undefined => PROPERTY_MANAGERS.find((m) => m.cityId === cityId);
export const managerOf = (owned: OwnedHome): PropertyManager | undefined => (owned.manager ? PROPERTY_MANAGERS.find((m) => m.id === owned.manager) : undefined);

const toUnits = (sim: Simulation, cents: Money, currency: string): number => { const cur = saveCurrency(sim.universe); return (cur === currency ? cents : exchange(cents, cur, currency) ?? cents) / 100; };
const toSave = (sim: Simulation, units: number, currency: string): Money => { const c = Math.round(units * 100); const cur = saveCurrency(sim.universe); return cur === currency ? c : exchange(c, currency, cur) ?? c; };

/** A month's management of a tenancy, in the save's money. */
export function managementFee(sim: Simulation, m: PropertyManager, t: Tenancy): Money {
  const rent = toUnits(sim, t.rent, m.currency);
  return toSave(sim, m.flat ?? Math.max(m.share(rent, t.renewals ?? 0) * rent, m.minimum ?? 0), m.currency);
}

/** Letting the home to a new tenant, in the save's money. */
export const lettingFee = (sim: Simulation, m: PropertyManager, t: Tenancy): Money => toSave(sim, m.letting(toUnits(sim, t.rent, m.currency)), m.currency);
export const renewalFee = (sim: Simulation, m: PropertyManager): Money => toSave(sim, m.renewal, m.currency);

/** Whether a tenant found can move in now: an agent's home any time, your own while you're there. */
export const keysHandedOver = (person: Person, owned: OwnedHome): boolean => Boolean(owned.manager) || person.currentLocationId === owned.cityId;

/** An agent's fee charged, as owed where the bank can't pay it. */
export function chargeAgent(sim: Simulation, person: Person, owned: OwnedHome, m: PropertyManager, amount: Money, what: string): void {
  spend(sim, person, amount, `${m.name}, ${what}, ${owned.facts.address}`, 'home', true);
}

export function registerPropertyManagers(sim: Simulation, homeById: (person: Person, id: string) => OwnedHome | undefined): void {
  sim.onCommand<{ homeId: string; on: boolean }, { manager?: string }>('home.manager', (p, { sim: s }) => {
    const owned = homeById(s.player, String(p?.homeId));
    if (!owned) throw new CommandError('You don’t own that home.');
    if (p?.on !== true) {
      if (!owned.manager) throw new CommandError('No agent manages it.');
      delete owned.manager;
      return {};
    }
    const m = managerIn(owned.cityId);
    if (!m) throw new CommandError('No agent there publishes its fees.');
    if (owned.manager) throw new CommandError(`${m.name} manages it already.`);
    owned.manager = m.id;
    return { manager: m.id };
  });
}
