/**
 * SLATE — a car that breaks, and the shop that mends it (Stage 8 of
 * `docs/BACKLOG.md`, from 2026-10-01; the shops and the figures in
 * `content/carshops.ts`).
 *
 * **A fault.** Each month a car is driven it may need an unscheduled
 * repair, at its model's or its make's rate a year from RepairPal (decider
 * `vehicle.fault`), and that repair is severe at RepairPal's share. An
 * ordinary fault lights the check engine light and the car still goes; a
 * severe one stops it, and it isn't driven until it's mended. Either is
 * worth its repair less to a buyer or an insurer, who'd pay to put it right
 * (`valueOf` in `systems/vehicles.ts`). The light fails an inspection that
 * reads the car's computer, New York's, Connecticut's and California's, as
 * those states' rules say a lit light does, and the fault is mended there
 * (`systems/inspections.ts`). An electric car has no such light, and
 * RepairPal rated no electric make, so none breaks here; nor a motorcycle,
 * a camper or a bicycle, which it doesn't rate.
 *
 * **Its money.** AAA's upkeep a kilometer (`content/vehiclefees.ts`) is
 * maintenance, repairs and tires together. The repairs a car is now
 * expected to need, its rate times their average cost, come out of it over
 * the place's kilometers a year (`upkeepPerKm`), so a fault's bill isn't
 * paid twice.
 *
 * **The shop.** Book The Repair at a garage in the car's town while it's
 * open, with the car and you both there; a dealer mends only its own make.
 * The bill is the fault's, at any shop: no shop publishes what one repair
 * costs. An ordinary repair is done by the shop's closing that day, or in
 * eight hours where its hours aren't known; a severe one keeps the car
 * three days (`SEVERE_DAYS`). While it's in, it isn't driven anywhere.
 * Dealers' loaners aren't kept: nothing in SLATE's day reads which car is
 * to hand within a town.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatDate, formatTime, zonedParts, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { hoursOn } from '../content/storehours';
import { KM_A_YEAR, UPKEEP_USD_PER_KM, type Jurisdiction } from '../content/vehiclefees';
import type { CarModel } from '../content/vehiclecatalog';
import { CAR_SHOPS, ORDINARY_REPAIR_USD, RELIABILITY, SEVERE_DAYS, SEVERE_TIMES_ANNUAL, type CarShop, type Reliability } from '../content/carshops';
import { shutAt } from './errands';
import { spend } from './household';
import type { OwnedVehicle } from './vehicles';

export interface Fault { at: Instant; severe: boolean; /** The repair, US dollars. */ usd: number }
export interface InShop { shopId: string; until: Instant }

/** The states whose inspection reads the car's computer, and fails a lit check engine light. */
export const READS_THE_LIGHT: ReadonlySet<Jurisdiction> = new Set(['US-NY', 'US-CT', 'US-CA']);

/** RepairPal's figures for a car: its model's, its make's, or the average; none for anything it doesn't rate. */
export function reliabilityOf(m: CarModel): Reliability | undefined {
  if ((m.kind ?? 'car') !== 'car' || m.fuel === 'ev') return undefined;
  return RELIABILITY.models[`${m.make} ${m.model}`] ?? RELIABILITY.makes[m.make] ?? RELIABILITY.average;
}

/** What a repair costs, dollars. */
export const repairUsd = (r: Reliability, severe: boolean): number => (severe ? SEVERE_TIMES_ANNUAL * r.annualUsd : ORDINARY_REPAIR_USD);

/** The repairs a car is expected to need in a year, dollars: its rate times their average cost. */
export const expectedRepairsUsd = (r: Reliability): number => r.visits * ((1 - r.severe) * repairUsd(r, false) + r.severe * repairUsd(r, true));

/** AAA's upkeep a kilometer, US cents, less the repairs now drawn as faults. */
export function upkeepPerKm(m: CarModel, j: Jurisdiction): number {
  const r = reliabilityOf(m);
  // The most taken off is the all-brand average's in Britain, the fewest kilometers: about 2.5 cents of the 7.3.
  return r ? UPKEEP_USD_PER_KM - (expectedRepairsUsd(r) * 100) / KM_A_YEAR[j] : UPKEEP_USD_PER_KM;
}

export const inShopNow = (v: OwnedVehicle, at: Instant): boolean => Boolean(v.inShop && v.inShop.until > at);

/** Why a car can't be driven now for want of a repair, or nothing. */
export function laidUp(v: OwnedVehicle, at: Instant): string | undefined {
  if (v.inShop && v.inShop.until > at) return `It’s at ${shopById(v.inShop.shopId)?.name ?? 'the garage'} until ${formatDate(v.inShop.until, CITIES.require(shopById(v.inShop.shopId)?.cityId ?? v.cityId).timeZone)}.`;
  if (v.fault?.severe) return 'It’s broken down, and needs a repair before it goes anywhere.';
  return undefined;
}

/** The fault's repair in a currency, cents; nothing where there's none. */
export function faultCost(v: OwnedVehicle, currency: string): Money {
  if (!v.fault) return 0;
  const cents = Math.round(v.fault.usd * 100);
  return currency === 'USD' ? cents : exchange(cents, 'USD', currency) ?? cents;
}

/**
 * A month's chance the car needs an unscheduled repair, drawn: true when it
 * does. RepairPal's visits a year, spread evenly over the months; `odds`
 * overrides the month's chance, for the decider's sweep.
 */
export function mayBreak(sim: Simulation, person: Person, v: OwnedVehicle, m: CarModel, at: Instant, odds?: number): boolean {
  const r = reliabilityOf(m);
  if (!r || v.fault) return false;
  const rng = sim.rng('vehicle.fault', v.id, at);
  if (rng.next() >= (odds ?? 1 - Math.exp(-r.visits / 12))) return false;
  const severe = rng.next() < r.severe;
  v.fault = { at, severe, usd: repairUsd(r, severe) };
  if (person.id === sim.universe.playerId) {
    const cost = formatMoney(faultCost(v, saveCurrency(sim.universe)), saveCurrency(sim.universe), { cents: false });
    sim.notify({ category: 'home', title: severe ? 'The Car Broke Down' : 'The Check Engine Light Came On', body: severe ? `The ${m.make} ${m.model} won’t go until it’s repaired, about ${cost}.` : `The ${m.make} ${m.model} still goes; the repair is about ${cost}, and an inspection that reads the light fails it.`, importance: severe ? 70 : 45, route: '/workspace/vehicles' });
  }
  return true;
}

export const shopById = (id: string): CarShop | undefined => CAR_SHOPS.find((s) => s.id === id);

/** The garages in a town that work on a car's make. */
export const shopsFor = (cityId: string, m: CarModel): CarShop[] => CAR_SHOPS.filter((s) => s.cityId === cityId && (!s.make || s.make === m.make));

/** Why a car can't be repaired at a shop now, or nothing. */
export function repairRefusal(person: Person, v: OwnedVehicle, m: CarModel, shopId: string, at: Instant): string | undefined {
  // A car in the shop has had its fault taken off it, so this refuses that too.
  if (!v.fault) return 'It has nothing to repair.';
  const shop = shopById(shopId);
  if (!shop) return 'There’s no such garage.';
  const carAt = v.at ?? v.cityId;
  if (shop.cityId !== carAt) return `The car is in ${CITIES.require(carAt).name}.`;
  if (person.currentLocationId !== carAt) return `You’re not in ${CITIES.require(carAt).name}.`;
  if (shop.make && shop.make !== m.make) return `${shop.name} works only on a ${shop.make}.`;
  return shop.week ? shutAt(shop.week, shop.name, shop.cityId, at) : undefined;
}

/** When a repair begun now is done: a severe one in three days; an ordinary one at the shop's closing, or in eight hours. */
export function readyAt(shop: CarShop, severe: boolean, at: Instant): Instant {
  if (severe) return at + SEVERE_DAYS * MS_DAY;
  if (!shop.week) return at + 8 * 3_600_000;
  const p = zonedParts(at, CITIES.require(shop.cityId).timeZone);
  const close = hoursOn(shop.week, p.weekday).close;
  // Booked only while it's open, so the closing is still to come.
  return at + (close - (p.hour + p.minute / 60)) * 3_600_000;
}

export function registerRepairs(sim: Simulation, find: (person: Person, id: string) => OwnedVehicle | undefined, model: (v: OwnedVehicle) => CarModel): void {
  sim.onCommand<{ vehicleId: string; shopId: string }, { readyAt: Instant; paid: Money }>('vehicle.repair', (p, { sim: s }) => {
    const person = s.player;
    const v = find(person, String(p?.vehicleId));
    if (!v) throw new CommandError('That isn’t a car you own.');
    const m = model(v);
    const no = repairRefusal(person, v, m, String(p?.shopId), s.now);
    if (no) throw new CommandError(no);
    const shop = shopById(String(p.shopId))!;
    const cur = saveCurrency(s.universe);
    const bill = faultCost(v, cur);
    if (!spend(s, person, bill, `Repair at ${shop.name}, the ${m.make} ${m.model}`, 'vehicle')) throw new CommandError('The payment didn’t go through.');
    const until = readyAt(shop, v.fault!.severe, s.now);
    v.inShop = { shopId: shop.id, until };
    delete v.fault;
    if (person.id === s.universe.playerId) s.notify({ category: 'home', title: 'The Car Is In The Shop', body: `${shop.name} has the ${m.make} ${m.model} until ${formatTime(until, CITIES.require(shop.cityId).timeZone)}, ${formatDate(until, CITIES.require(shop.cityId).timeZone)}: ${formatMoney(bill, cur, { cents: false })}.`, importance: 30, route: '/workspace/vehicles' });
    return { readyAt: until, paid: bill };
  });
}
