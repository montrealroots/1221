/**
 * SLATE — winter tires (docs/WORLD.md, stage 3k), from 2026-09-30,
 * researched in `docs/research/world/research-customization.json` and
 * `research-custom-effects.json`.
 *
 * A set of four for a car kept in America or Canada, at the middle of
 * Discount Tire's $200 to $400 a winter tire of medium size, a set's $1,200;
 * Canada's at that in dollars converted, its own price not being read:
 * SLATE's estimate there. What they do:
 * - From 15 December to 15 March, Quebec's mandatory season, a car on them
 *   injures 5% less often in a crash: Quebec's transport ministry found 5%
 *   fewer victims once winter tires were required (Fournier and Bélanger,
 *   2010). Most of Quebec's cars had them already, so the effect for one car
 *   is likely larger, and SLATE's 5% the published floor.
 * - In Ontario, the insurer's discount the province requires it to offer,
 *   3.5%, the middle of the 2% to 5% brokers quote (no regulator sets it); and
 *   Formula Tire's C$50 to swap them on and off each November and April.
 * - They wear out after 40,000 miles of winter driving, Michelin's X-Ice Snow
 *   warranty, the one winter tire that carries one.
 * British Columbia's rule for signed highways takes an M+S all-season too,
 * which SLATE's cars have, so it asks nothing of them.
 *
 * **The everyday tires wear out** (from 2026-10-03): after 60,000 miles, the
 * treadwear warranty Michelin gives its CrossClimate 2, read on its page in a
 * search's summary, taken for every car's all-seasons. Past it they're at the
 * legal limit, and a test that checks them (the MOT, New York's,
 * Connecticut's, California's where it's due) fails them and a set is fitted
 * at the market's price. A used car's were last changed at the odometer's
 * last multiple of that life, SLATE's reading. A set fitted sooner is the
 * owner's choice. A set of four, fitted, at a named retailer's own page
 * (`research-vehicles-deeper.json`): BJ's, $899.96 after its discounts and
 * $80 to fit, in America; Blackcircles' cheapest fully fitted 215/55 R17,
 * £58.99 a tire, in Britain; Discount Tires' €145 a tire fitted in Ireland
 * (secondhand); The Wheel Shop's C$282.03 a tire in Canada, its fitting not
 * read; Costco México's MX$2,599 a tire.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { zonedParts, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { payFromBank, owe } from './household';
import { forOutings, kindOf, modelById, onTwoWheels, vehiclesOf, type OwnedVehicle } from './vehicles';
import { KM_A_YEAR, type Jurisdiction } from '../content/vehiclefees';

export const TIRE_LIFE_KM = Math.round(60_000 * 1.609344);
const USD_SET = { price: 899.96 + 80, currency: 'USD' };
export const TIRE_SET: Readonly<Partial<Record<Jurisdiction, { price: number; currency: string }>>> = {
  'US-NY': USD_SET, 'US-CT': USD_SET, 'US-CA': USD_SET,
  GB: { price: 58.99 * 4, currency: 'GBP' }, IE: { price: 145 * 4, currency: 'EUR' },
  'CA-ON': { price: 282.03 * 4, currency: 'CAD' }, 'CA-BC': { price: 282.03 * 4, currency: 'CAD' },
  'MX-CMX': { price: 2_599 * 4, currency: 'MXN' },
};
type Odo = { ageAtPurchase: number; jurisdiction: Jurisdiction; km?: number; odometerAtPurchase?: number; tiresAtKm?: number };
/** The car's odometer, km (as `odometer` in `systems/carcare.ts`). */
export const odometerOf = (v: Odo): number => (v.odometerAtPurchase ?? v.ageAtPurchase * KM_A_YEAR[v.jurisdiction]) + (v.km ?? 0);
/** The odometer when its everyday tires were last fitted. */
export const tiresFittedAt = (v: Odo): number => v.tiresAtKm ?? (() => { const at = v.odometerAtPurchase ?? v.ageAtPurchase * KM_A_YEAR[v.jurisdiction]; return at - (at % TIRE_LIFE_KM); })();
export const tiresWorn = (v: Odo): boolean => odometerOf(v) - tiresFittedAt(v) >= TIRE_LIFE_KM;
/** A set of four fitted, in the save's money, where a price is read. */
export function tireSetCost(sim: Simulation, v: OwnedVehicle): Money | undefined {
  const t = TIRE_SET[v.jurisdiction];
  if (!t) return undefined;
  const c = Math.round(t.price * 100);
  const cur = saveCurrency(sim.universe);
  return cur === t.currency ? c : exchange(c, t.currency, cur) ?? c;
}

export const WINTER_TIRES = {
  setUsd: 4 * 300,
  crashFactor: 0.95,
  ontarioDiscount: 0.035,
  switchoverCad: 50,
  wearKm: 40_000 * 1.609344,
} as const;

export interface WinterTires { boughtAt: Instant; km: number }

/** Whether a day falls in Quebec's winter-tire season, 15 December to 15 March, where the car is. */
export function inWinterSeason(at: Instant, cityId: string): boolean {
  const zone = CITIES.get(cityId)?.timeZone ?? 'UTC';
  const p = zonedParts(at, zone);
  return (p.month === 12 && p.day >= 15) || p.month === 1 || p.month === 2 || (p.month === 3 && p.day <= 15);
}

/** A crash's factor for a car on winter tires in their season. */
export const tireFactor = (v: OwnedVehicle | undefined, at: Instant): number => (v?.winterTires && inWinterSeason(at, v.at ?? v.cityId) ? WINTER_TIRES.crashFactor : 1);

/** The Ontario insurer's factor for a car on winter tires. */
export const tireInsuranceFactor = (v: OwnedVehicle): number => (v.winterTires && v.jurisdiction === 'CA-ON' ? 1 - WINTER_TIRES.ontarioDiscount : 1);

export function tiresRefusal(v: OwnedVehicle | undefined): string | undefined {
  if (!v || v.soldAt !== undefined) return 'That isn’t a vehicle you own.';
  const m = modelById(v.modelId)!;
  if (onTwoWheels(m) || forOutings(m) || kindOf(m) === 'motorhome') return 'A set is sold for a car, a van or a campervan.';
  if (!v.jurisdiction.startsWith('US-') && !v.jurisdiction.startsWith('CA-')) return 'SLATE sells winter tires in America and Canada, where their price was read.';
  if (v.winterTires) return 'It has a set.';
  return undefined;
}

const inSave = (sim: Simulation, cents: Money, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? cents : exchange(cents, from, cur) ?? cents; };

/** The month's part: Ontario's switchover in November and April, and a set worn out after its winter kilometers. */
export function tiresMonth(sim: Simulation, person: Person, v: OwnedVehicle, km: number, at: Instant): void {
  if (!v.winterTires) return;
  const city = v.at ?? v.cityId;
  if (inWinterSeason(at, city)) v.winterTires.km += km;
  const month = zonedParts(at, CITIES.get(city)?.timeZone ?? 'UTC').month;
  if (v.jurisdiction === 'CA-ON' && (month === 11 || month === 4)) {
    const fee = inSave(sim, WINTER_TIRES.switchoverCad * 100, 'CAD');
    if (!payFromBank(sim, person, fee, 'Winter tires swapped, Formula Tire', 'vehicle')) owe(sim, person, fee, 'Winter tires swapped', 'vehicle');
  }
  if (v.winterTires.km >= WINTER_TIRES.wearKm) {
    delete v.winterTires;
    if (person.id === sim.universe.playerId) sim.notify({ category: 'home', title: 'Winter Tires Worn Out', body: `The ${modelById(v.modelId)!.make} ${modelById(v.modelId)!.model}’s winter tires have done their 40,000 miles.`, importance: 40, route: '/workspace/vehicles' });
  }
}

export function registerTires(sim: Simulation): void {
  sim.onCommand<{ vehicleId: string }, { paid: Money }>('vehicle.replace_tires', (p, { sim: s }) => {
    const person = s.player;
    const v = vehiclesOf(person).find((x) => x.id === p?.vehicleId && x.soldAt === undefined);
    if (!v) throw new CommandError('That isn’t a car you own.');
    const cost = tireSetCost(s, v);
    if (cost === undefined || kindOf(modelById(v.modelId)!) !== 'car') throw new CommandError('No set’s price is kept for it.');
    if (!payFromBank(s, person, cost, 'Four tires, fitted', 'vehicle')) throw new CommandError(`${formatMoney(cost, saveCurrency(s.universe))} is more than the bank can cover.`);
    v.tiresAtKm = odometerOf(v);
    return { paid: cost };
  });
  sim.onCommand<{ vehicleId: string }, { paid: Money }>('vehicle.winter_tires', (p, { sim: s }) => {
    const person = s.player;
    const v = vehiclesOf(person).find((x) => x.id === p?.vehicleId);
    const no = tiresRefusal(v);
    if (no) throw new CommandError(no);
    const cost = inSave(s, WINTER_TIRES.setUsd * 100, 'USD');
    if (!payFromBank(s, person, cost, 'Winter tires, a set of four', 'vehicle')) throw new CommandError(`${formatMoney(cost, saveCurrency(s.universe))} is more than the bank can cover.`);
    v!.winterTires = { boughtAt: s.now, km: 0 };
    return { paid: cost };
  });
}
