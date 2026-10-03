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
 *
 * **The listings** (from 2026-10-03; `research-used-cars-parking.json`). Each
 * month a model has three used cars on offer near you, each of its own age
 * (one to ten years), odometer and seller. Until then any age could be bought,
 * at the market's average miles. The odometer is the market's own:
 * - England: the DfT's spread of cars over annual-mileage bands (NTS0904,
 *   2025), one band drawn for the car's years.
 * - America: NHTSA's miles by a car's age (its schedule from the 2001 NHTS,
 *   the only age curve published), year by year.
 * - Ireland, Canada and Mexico: the averages SLATE drives by (`KM_A_YEAR`).
 * The odometer carries into the car bought, so it decides when the next
 * service is due and whether the warranty's distance has run out. A dealer
 * or a private seller is drawn evenly, nobody publishing the share; a private
 * seller charges no dealer's documentation fee, and the buyer does the
 * transfer. The price is the age's, since no market publishes one by mileage.
 *
 * **A test drive** at the dealer, before buying: Nissan Mexico's 15 minutes,
 * Tesla's 30 in America and elsewhere, SLATE's reading where none is read.
 * It needs a license that lets you drive there. It shows a fault that shows,
 * a lit warning light or a car that won't go, and not what the repair costs,
 * which only the inspection finds.
 *
 * **The transfer** after a private sale, by each place's own rule: done
 * before it's driven in Britain (it's taxed only then) and Ireland; within 10
 * days in California (a $15 penalty after) and British Columbia, 6 in
 * Ontario, 15 working days in Mexico City; and after those days a Canadian
 * car isn't driven until it's done.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { zonedParts, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { modelById } from './vehicles';
import { KM_A_YEAR } from '../content/vehiclefees';
import { mayDrive } from './documents';
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

const NTS0904: readonly [number, number, number][] = [[0, 499, 2], [500, 999, 1], [1_000, 1_999, 5], [2_000, 2_999, 7], [3_000, 3_999, 8], [4_000, 4_999, 8], [5_000, 6_999, 24], [7_000, 8_999, 16], [9_000, 11_999, 16], [12_000, 14_999, 6], [15_000, 17_999, 3], [18_000, 20_999, 2], [21_000, 29_999, 1], [30_000, 39_999, 1]];
const NHTSA_MILES: readonly number[] = [14_231, 13_961, 13_669, 13_357, 13_028, 12_683, 12_325, 11_956, 11_578, 11_193];
const MILE_KM = 1.609344;
export const TEST_DRIVE_MINUTES: Readonly<Partial<Record<Jurisdiction, number>>> = { 'MX-CMX': 15 };
const TEST_DRIVE_DEFAULT = 30;
/** The transfer after a private sale: days allowed, whether it's done before driving, whether it's driven past the days, and a late penalty. */
export const TRANSFER: Readonly<Partial<Record<Jurisdiction, { days: number; beforeDriving?: boolean; blocksAfter?: boolean; lateUsd?: number }>>> = {
  GB: { days: 0, beforeDriving: true }, IE: { days: 0, beforeDriving: true },
  'US-CA': { days: 10, lateUsd: 15 }, 'CA-BC': { days: 10, blocksAfter: true }, 'CA-ON': { days: 6, blocksAfter: true }, 'MX-CMX': { days: 21 },
};

export interface UsedListing { modelId: string; age: number; odometerKm: number; seller: 'dealer' | 'private' }

/** This month's three used cars on offer of a model where they live (decider `vehicle.listing`). */
export function usedListings(sim: Simulation, person: Person, modelId: string, cityId: string, j: Jurisdiction, at: Instant = sim.now): UsedListing[] {
  const rng = sim.rng('vehicle.listing', person.id, `${modelId}-${monthOf(cityId, at)}`);
  const ages = new Set<number>();
  while (ages.size < 3) ages.add(1 + Math.floor(rng.next() * 10));
  return [...ages].sort((a, b) => a - b).map((age) => {
    let km: number;
    if (j === 'GB') { let t = rng.next() * 100; const band = NTS0904.find(([, , pct]) => (t -= pct) < 0) ?? NTS0904[6]!; km = (band[0] + rng.next() * (band[1] - band[0])) * age * MILE_KM; }
    else if (j.startsWith('US-')) km = NHTSA_MILES.slice(0, age).reduce((n, x) => n + x, 0) * MILE_KM;
    else km = KM_A_YEAR[j] * age;
    return { modelId, age, odometerKm: Math.round(km), seller: rng.next() < 0.5 ? 'dealer' as const : 'private' as const };
  });
}

export interface Driven { modelId: string; age: number; month: string; showed: boolean; severe?: boolean }
export const testDriveMinutes = (j: Jurisdiction): number => TEST_DRIVE_MINUTES[j] ?? TEST_DRIVE_DEFAULT;
/** This month's test drive of a used car, where one was taken. */
export function drivenOn(sim: Simulation, person: Person, modelId: string, age: number, cityId: string): Driven | undefined {
  const r = person.testDriven;
  return r && r.modelId === modelId && r.age === age && r.month === monthOf(cityId, sim.now) ? r : undefined;
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
  sim.onCommand<{ modelId: string; age: number }, Driven>('vehicle.test_drive', (p, { sim: s }) => {
    const person = s.player;
    const modelId = String(p?.modelId);
    const age = Math.round(Number(p?.age ?? 0));
    const cityId = homeOf(person);
    const j = jurisdictionOf(cityId);
    if (!j || !modelById(modelId)) throw new CommandError('No such car here.');
    if (person.currentLocationId !== cityId) throw new CommandError('It’s driven at the dealer where you live.');
    if (age > 0 && !usedListings(s, person, modelId, cityId, j).some((l) => l.age === age)) throw new CommandError('No car of that age is on offer this month.');
    const may = mayDrive(person, cityId, s.now);
    if (!may.ok) throw new CommandError(may.why ?? 'You can’t drive here.');
    s.advanceTo(s.now + testDriveMinutes(j) * 60_000);
    const f = usedFault(s, person, modelId, age, cityId, s.now);
    const driven: Driven = { modelId, age, month: monthOf(cityId, s.now), showed: Boolean(f), ...(f ? { severe: f.severe } : {}) };
    person.testDriven = driven;
    return driven;
  });
  sim.onCommand<{ vehicleId: string }, { penalty: Money }>('vehicle.transfer', (p, { sim: s }) => {
    const person = s.player;
    const v = (person.vehicles ?? []).find((x) => x.id === p?.vehicleId && x.soldAt === undefined);
    if (!v || v.transferBy === undefined) throw new CommandError('It’s in your name.');
    const rule = TRANSFER[v.jurisdiction];
    const late = s.now > v.transferBy && rule?.lateUsd ? Math.round(rule.lateUsd * 100) : 0;
    const cur = saveCurrency(s.universe);
    const penalty = late ? (cur === 'USD' ? late : exchange(late, 'USD', cur) ?? late) : 0;
    if (penalty > 0 && !payFromBank(s, person, penalty, 'A late transfer’s penalty', 'vehicle')) throw new CommandError(`${formatMoney(penalty, cur)} is more than the bank can cover.`);
    delete v.transferBy;
    return { penalty };
  });
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
