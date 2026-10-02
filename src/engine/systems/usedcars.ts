/**
 * SLATE — a used car's hidden fault, and the inspection that finds it before
 * it's bought (Stage 8 of `docs/BACKLOG.md`, from 2026-10-02), from
 * `docs/research/world/research-gaps-cars-clothes.json`, read 2026-10-02.
 *
 * **The fault.** "Seven out of 10 used cars assessed by AA Cars have at least
 * one fault." A used car bought comes with one at that share, a fault as
 * `systems/repairs.ts` draws them, severe at RepairPal's share for the
 * model, and a car RepairPal doesn't rate (an electric one, a motorcycle)
 * with none. The AA counts the cars it was asked to look at; SLATE takes its
 * share for every used car, its reading. Until 2026-10-02 every used car
 * arrived sound.
 *
 * **The inspection.** Before buying, Have It Inspected for the place's
 * cheapest named pre-purchase inspection: Lemon Squad's $219.99 in America;
 * the AA's £110 for a non-member in Britain; CarInspect.ie's €129 in Dublin;
 * CAA's C$199.95 for a non-member in Ontario; BCAA's C$249.95 in British
 * Columbia, before tax; WeVerify's MX$1,550 mechanical inspection in Mexico
 * City. It reports the fault the car has, or none, and the car bought that
 * month is the car inspected. What a buyer does with the report is theirs:
 * buy it anyway, or look at another.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { zonedParts, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { modelById } from './vehicles';
import type { Jurisdiction } from '../content/vehiclefees';
import { CITIES } from '../content/geography';
import { payFromBank } from './household';
import { reliabilityOf, repairUsd, type Fault } from './repairs';

export const FAULTY_USED = 0.7;

export const PRE_PURCHASE: Readonly<Record<Jurisdiction, { name: string; price: number; currency: string }>> = {
  'US-NY': { name: 'Lemon Squad', price: 219.99, currency: 'USD' },
  'US-CT': { name: 'Lemon Squad', price: 219.99, currency: 'USD' },
  'US-CA': { name: 'Lemon Squad', price: 219.99, currency: 'USD' },
  GB: { name: 'The AA', price: 110, currency: 'GBP' },
  IE: { name: 'CarInspect.ie', price: 129, currency: 'EUR' },
  'CA-ON': { name: 'CAA', price: 199.95, currency: 'CAD' },
  'CA-BC': { name: 'BCAA', price: 249.95, currency: 'CAD' },
  'MX-CMX': { name: 'WeVerify', price: 1_550, currency: 'MXN' },
};

export interface Inspected { modelId: string; age: number; month: string; fault: boolean; usd?: number; severe?: boolean }

const monthOf = (cityId: string, at: Instant): string => { const p = zonedParts(at, CITIES.require(cityId).timeZone); return `${p.year}-${p.month}`; };

/** The fault a used car on offer this month has, or none (decider `vehicle.used`). */
export function usedFault(sim: Simulation, person: Person, modelId: string, age: number, cityId: string, at: Instant): Fault | undefined {
  if (age <= 0) return undefined;
  const m = modelById(modelId);
  const r = m ? reliabilityOf(m) : undefined;
  if (!r) return undefined;
  const rng = sim.rng('vehicle.used', person.id, `${modelId}-${age}-${monthOf(cityId, at)}`);
  if (rng.next() >= FAULTY_USED) return undefined;
  const severe = rng.next() < r.severe;
  return { at, severe, usd: repairUsd(r, severe) };
}

export function inspectionPrice(sim: Simulation, j: Jurisdiction): Money {
  const t = PRE_PURCHASE[j];
  const c = Math.round(t.price * 100);
  const cur = saveCurrency(sim.universe);
  return cur === t.currency ? c : exchange(c, t.currency, cur) ?? c;
}

/** This month's report on a used car, where one was bought. */
export function reportOn(sim: Simulation, person: Person, modelId: string, age: number, cityId: string): Inspected | undefined {
  const r = person.inspectedUsed;
  return r && r.modelId === modelId && r.age === age && r.month === monthOf(cityId, sim.now) ? r : undefined;
}

export function registerUsedCars(sim: Simulation, jurisdictionOf: (cityId: string) => Jurisdiction | undefined, homeOf: (person: Person) => string): void {
  sim.onCommand<{ modelId: string; age: number }, Inspected>('vehicle.inspect_used', (p, { sim: s }) => {
    const person = s.player;
    const age = Math.max(0, Math.round(Number(p?.age ?? 0)));
    const modelId = String(p?.modelId);
    if (age <= 0) throw new CommandError('A new car isn’t inspected before it’s bought.');
    if (!modelById(modelId)) throw new CommandError('No such car.');
    const cityId = homeOf(person);
    const j = jurisdictionOf(cityId);
    if (!j) throw new CommandError('SLATE sells no car where you live.');
    const t = PRE_PURCHASE[j];
    const price = inspectionPrice(s, j);
    if (!payFromBank(s, person, price, `${t.name}, a pre-purchase inspection`, 'vehicle')) throw new CommandError(`${formatMoney(price, saveCurrency(s.universe))} is more than the bank can cover.`);
    const f = usedFault(s, person, modelId, age, cityId, s.now);
    const report: Inspected = { modelId, age, month: monthOf(cityId, s.now), fault: Boolean(f), ...(f ? { usd: f.usd, severe: f.severe } : {}) };
    person.inspectedUsed = report;
    return report;
  });
}
