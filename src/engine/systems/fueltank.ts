/**
 * SLATE — a vehicle's tank, or an electric car's battery (from 2026-10-02;
 * the capacities in `content/tanks.ts`).
 *
 * Until 2026-10-02 fuel was an expense: a month's driving and an errand's
 * kilometers were charged at the pump price, and nothing was in the car. Now
 * the car holds what was put in it. Each kilometer driven burns its official
 * economy from the tank: an errand's legs, and the month's everyday driving.
 * The tank is filled at a station in the car's town at the place's pump
 * price (`FUEL`), and a battery is charged at the place's public price, or at
 * home with a charger at the home price (`CHARGING`).
 *
 * The month's everyday driving fills up as a driver does: at a quarter of a
 * tank, AAA's advice for how low to let it go, to full; a battery at a fifth,
 * to the 80% makers advise for every day. What those fill-ups bought is what
 * the month pays. An errand that can't reach its next stop on what's in the
 * tank is refused there, and a stop for fuel fills it.
 *
 * A journey by road burns and buys along the way as it goes, and the car
 * arrives as full as it left: the fare is the fuel for its kilometers, at
 * the pump, as before. An older save's car had no tank kept, and starts full.
 * A model with no rated economy (AAA's cost a mile) has no tank kept, nor a
 * pedal bicycle.
 *
 * **How much, and who fills it** (from 2026-10-03, the owner's expansion):
 * a fill is chosen as full, a quantity in liters or kWh, a spending limit,
 * or a level to charge to, and refused where the tank or battery has no room
 * for it, the money isn't there, or it isn't the car's fuel. Each fill is
 * kept on the car: where, how much, what it cost and on what price, how long
 * it took, and the level and range after. Filling up as the month's driving
 * goes is a preference of each car's (`fillUp`), never assumed: a car bought
 * from 2026-10-03 is filled only when you fill it, and its everyday driving
 * runs it down a day at a time (`VEHICLE_DAY_KIND`), stops where it runs
 * dry, and says when it's low. A car from
 * before was filled as it went, and keeps that until changed.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { FUEL } from '../content/vehiclefees';
import { CHARGING, EV_MODELS } from '../content/evcatalog';
import { CAR_MODELS } from '../content/vehiclecatalog';
import { PICKUP_MODELS } from '../content/pickups';
import { BIKE_MODELS } from '../content/bikecatalog';
import { RV_MODELS } from '../content/rvcatalog';
import { RIDE_MODELS } from '../content/ridecatalog';
import { FUEL_STOP_MINUTES, STATIONS } from '../content/errandtrips';
import { TANKS } from '../content/tanks';
import { spend } from './household';
import { modelById, startDays, vehiclesOf, type OwnedVehicle } from './vehicles';
import { tintFuelFactor } from './tint';
import { roofFuelFactor } from './roofbox';
import { livingIn } from './homes';
import type { CarModel } from '../content/vehiclecatalog';
import type { Instant } from '../core/time';

/** When a driver fills, and to what: AAA's quarter tank; a battery at a fifth to the 80% makers advise daily. */
export const FILL = { petrolAt: 0.25, petrolTo: 1, batteryAt: 0.2, batteryTo: 0.8 } as const;

/**
 * A public charge's time: the kWh over the 50 kW the US Department of
 * Energy's Alternative Fuels Data Center gives as DC fast charging's lower
 * end, so no car charges faster here than it might. Charging at home is
 * overnight, plugged in, and takes none of the player's time.
 */
export const PUBLIC_KW = 50;

/** What a model holds: its tank in liters or its battery in kWh, from its maker's figure, or SLATE's estimate where none was read. */
export function capacityOf(m: CarModel): { size: number; unit: 'L' | 'kWh'; estimated: boolean } | undefined {
  const known = TANKS[m.id];
  if (m.fuel === 'ev') {
    if (!m.kwhPer100km) return undefined;
    if (known?.batteryKwh) return { size: known.batteryKwh, unit: 'kWh', estimated: false };
    const est = medianOf((x) => x.fuel === 'ev', 'batteryKwh');
    return est ? { size: est, unit: 'kWh', estimated: true } : undefined;
  }
  if (m.per100km === null || m.per100km === undefined) return undefined;
  if (known?.tankL) return { size: known.tankL, unit: 'L', estimated: false };
  const kind = m.kind ?? 'car';
  const est = medianOf((x) => (x.kind ?? 'car') === kind && x.fuel !== 'ev', 'tankL');
  return est ? { size: est, unit: 'L', estimated: true } : undefined;
}

const models: readonly CarModel[] = [...CAR_MODELS, ...PICKUP_MODELS, ...EV_MODELS, ...BIKE_MODELS, ...RV_MODELS, ...RIDE_MODELS];
function medianOf(match: (m: CarModel) => boolean, field: 'tankL' | 'batteryKwh'): number | undefined {
  const xs = models.filter(match).map((m) => TANKS[m.id]?.[field]).filter((x): x is number => typeof x === 'number' && x > 0).sort((a, b) => a - b);
  if (xs.length === 0) return undefined;
  const mid = Math.floor(xs.length / 2);
  return xs.length % 2 ? xs[mid]! : (xs[mid - 1]! + xs[mid]!) / 2;
}

/** What a distance burns, in the tank's unit, by the model's official economy; a little less with tint keeping the cabin cool (`systems/tint.ts`). */
export function burnOf(m: CarModel, km: number, v?: OwnedVehicle): number | undefined {
  // And a roof box's drag where one's on (`systems/roofbox.ts`).
  const tint = v ? tintFuelFactor(v) * roofFuelFactor(v) : 1;
  if (m.fuel === 'ev') return m.kwhPer100km ? ((km * m.kwhPer100km) / 100) * tint : undefined;
  return m.per100km ? ((km * m.per100km) / 100) * tint : undefined;
}

/** How full it is, 0 to 1: an older save's starts full. */
export const levelOf = (v: OwnedVehicle): number => v.fuelLevel ?? 1;

/** How far it goes on what's in it, km. */
export function rangeKm(v: OwnedVehicle): number | undefined {
  const m = modelById(v.modelId)!;
  const cap = capacityOf(m);
  const per = burnOf(m, 100, v);
  return cap && per ? (levelOf(v) * cap.size * 100) / per : undefined;
}

/** Burns a distance from the tank; false, burning nothing, where there isn't enough in it. A model with no tank kept always goes. */
export function burn(v: OwnedVehicle, km: number): boolean {
  const m = modelById(v.modelId)!;
  const cap = capacityOf(m);
  const use = burnOf(m, km, v);
  if (!cap || use === undefined) return true;
  const after = levelOf(v) - use / cap.size;
  if (after < -1e-9) return false;
  v.fuelLevel = Math.max(0, after);
  return true;
}

/** How a fill's amount is chosen: to full, a quantity in the tank's unit, a spending limit in the save's money, or a level from 0 to 1. */
export type FillAmount = { by: 'full' } | { by: 'quantity'; value: number } | { by: 'spend'; value: Money } | { by: 'level'; value: number };

/** One fill kept on the car. */
export interface FillRecord {
  at: Instant; where: string; amount: number; unit: 'L' | 'kWh'; cost: Money;
  /** The station's own price, or the area's average. */ basis: 'station' | 'area';
  minutes: number; /** 0 to 1, after. */ level: number; rangeKm?: number;
}
export const FILL_LOG_KEEP = 20;

/** Who fills it as the month's driving goes: the driver, at a quarter, to full ('auto'), or nobody but you ('self'). A car from before 2026-10-03 kept no choice, and filled as it went. */
export const fillingOf = (v: OwnedVehicle): 'auto' | 'self' => v.fillUp ?? 'auto';

/** Below this it's low: a quarter tank, AAA's mark; a fifth of a battery. */
export const lowAt = (m: CarModel): number => (m.fuel === 'ev' ? FILL.batteryAt : FILL.petrolAt);

/** A unit's price where the car is, in the place's money, cents: the pump's, or a charger's (public, or at home). */
function unitPrice(v: OwnedVehicle, m: CarModel, home: boolean): { cents: number; currency: string } {
  if (m.fuel === 'ev') { const c = CHARGING[v.jurisdiction]; return { cents: home ? c.home : c.public, currency: c.currency }; }
  const f = FUEL[v.jurisdiction];
  return { cents: m.fuel === 'diesel' ? f.diesel : f.petrol, currency: f.currency };
}

const inSave = (sim: Simulation, cents: number, from: string): Money => { const cur = saveCurrency(sim.universe); return cur === from ? cents : exchange(cents, from, cur) ?? cents; };

/** What filling to a level costs now, and how much goes in: at a station, or at home on a charger. */
export function fillQuote(sim: Simulation, v: OwnedVehicle, to: number, home = false): { amount: number; unit: 'L' | 'kWh'; cost: Money; estimated: boolean } | undefined {
  const m = modelById(v.modelId)!;
  const cap = capacityOf(m);
  if (!cap) return undefined;
  const amount = Math.max(0, to - levelOf(v)) * cap.size;
  const p = unitPrice(v, m, home);
  return { amount, unit: cap.unit, cost: inSave(sim, Math.round(amount * p.cents), p.currency), estimated: cap.estimated };
}

/**
 * The month's everyday driving through the tank: burned kilometer by
 * kilometer, filled at the driver's mark to their level each time it gets
 * there. What it bought and what that cost; the tank left where the month
 * leaves it. With a share charged at home, that share is at the home price.
 */
export function everydayFuel(sim: Simulation, v: OwnedVehicle, km: number, homeShare = 0): { bought: number; cost: Money; fills: number } | undefined {
  const m = modelById(v.modelId)!;
  const cap = capacityOf(m);
  const total = burnOf(m, km, v);
  if (!cap || total === undefined) return undefined;
  const at = m.fuel === 'ev' ? FILL.batteryAt : FILL.petrolAt;
  const to = m.fuel === 'ev' ? FILL.batteryTo : FILL.petrolTo;
  let level = levelOf(v) * cap.size;
  let left = total;
  let bought = 0;
  let fills = 0;
  for (let guard = 0; left > 1e-9 && guard < 10_000; guard += 1) {
    const room = Math.max(0, level - at * cap.size);
    if (left <= room) { level -= left; left = 0; break; }
    level -= room;
    left -= room;
    const add = to * cap.size - level;
    level += add;
    bought += add;
    fills += 1;
  }
  v.fuelLevel = Math.max(0, Math.min(1, level / cap.size));
  const home = unitPrice(v, m, true);
  const out = unitPrice(v, m, false);
  const cents = m.fuel === 'ev' ? bought * (homeShare * home.cents + (1 - homeShare) * out.cents) : bought * out.cents;
  return { bought, cost: inSave(sim, Math.round(cents), out.currency), fills };
}

/**
 * A fill planned: the level it reaches, how much goes in, its cost and the
 * minutes it takes, or why it can't be: no room for the quantity, a level
 * not above where it is, or a limit too small to buy anything.
 */
export function planFill(sim: Simulation, v: OwnedVehicle, want: FillAmount, home = false): { to: number; amount: number; unit: 'L' | 'kWh'; cost: Money; minutes: number; estimated: boolean } | string {
  const m = modelById(v.modelId)!;
  const cap = capacityOf(m);
  if (!cap) return 'SLATE keeps no tank for it.';
  const level = levelOf(v);
  const room = Math.max(0, 1 - level) * cap.size;
  const word = cap.unit === 'kWh' ? 'kWh' : 'liters';
  const p = unitPrice(v, m, home);
  const each = inSave(sim, p.cents, p.currency);
  let to: number;
  if (want.by === 'full') to = 1;
  else if (want.by === 'level') {
    if (!(want.value > level + 1e-6)) return `It’s at ${Math.round(level * 100)}% already.`;
    if (want.value > 1 + 1e-9) return 'It can’t go past full.';
    to = want.value;
  } else if (want.by === 'quantity') {
    if (!(want.value > 0)) return `Choose how many ${word}.`;
    if (want.value > room + 1e-6) return `It holds ${room.toFixed(1)} ${word} more.`;
    to = level + want.value / cap.size;
  } else {
    if (!(each > 0) || !(want.value >= each / 10)) return 'That buys almost nothing.';
    to = Math.min(1, level + want.value / each / cap.size);
  }
  const amount = Math.max(0, to - level) * cap.size;
  if (amount < 1e-6) return m.fuel === 'ev' ? 'It’s charged.' : 'The tank is full.';
  // A spending limit stops at the limit: the amount is what the money buys, so it never costs more.
  const cost = want.by === 'spend' ? Math.round(amount * each) : inSave(sim, Math.round(amount * p.cents), p.currency);
  const minutes = home ? 0 : m.fuel === 'ev' ? Math.round((amount / PUBLIC_KW) * 60) : FUEL_STOP_MINUTES;
  return { to, amount, unit: cap.unit, cost, minutes, estimated: cap.estimated };
}

/** Why it can't be filled here now, or nothing. */
export function fillRefusal(person: Person, vehicleId: string, home = false): string | undefined {
  const v = vehiclesOf(person).find((x) => x.id === vehicleId && x.soldAt === undefined);
  if (!v) return 'That isn’t a vehicle you own.';
  const m = modelById(v.modelId)!;
  if (!capacityOf(m)) return 'SLATE keeps no tank for it.';
  if ((v.at ?? v.cityId) !== person.currentLocationId) return `It’s in ${CITIES.get(v.at ?? v.cityId)?.name ?? 'another town'}.`;
  if (home && m.fuel !== 'ev') return 'Only a battery charges at home.';
  // At home only with a charger fitted in the home they live in (`systems/charging.ts`), and the car there.
  if (home && !(livingIn(person)?.charger && (v.at ?? v.cityId) === livingIn(person)!.cityId)) return 'There’s no charger where you live.';
  const to = m.fuel === 'ev' && home ? FILL.batteryTo : 1;
  if (levelOf(v) >= to - 1e-6) return m.fuel === 'ev' ? 'It’s charged.' : 'The tank is full.';
  if (!home && m.fuel !== 'ev' && !(STATIONS[person.currentLocationId] ?? []).length) return 'SLATE knows no station in this town.';
  return undefined;
}

export function registerFuelTank(sim: Simulation): void {
  // Filled at a station in its town, or a battery charged, publicly or at home: to full, or to the 80% for every day at home.
  sim.onCommand<{ vehicleId: string; station?: number; home?: boolean; amount?: FillAmount }, { amount: number; paid: Money; minutes: number; level: number; rangeKm?: number }>('vehicle.refuel', (p, { sim: s }) => {
    const person = s.player;
    const home = p?.home === true;
    const no = fillRefusal(person, String(p?.vehicleId), home);
    if (no) throw new CommandError(no);
    const v = vehiclesOf(person).find((x) => x.id === p.vehicleId)!;
    const m = modelById(v.modelId)!;
    // Chosen, or as before: full at a station, the 80% for every day at home.
    const want: FillAmount = p.amount ?? (m.fuel === 'ev' && home ? { by: 'level', value: FILL.batteryTo } : { by: 'full' });
    const q = planFill(s, v, want, home);
    if (typeof q === 'string') throw new CommandError(q);
    const stations = STATIONS[person.currentLocationId] ?? [];
    const where = home ? 'at home' : m.fuel === 'ev' ? 'at a public charger' : `at ${stations[Math.max(0, Math.min(stations.length - 1, Number(p?.station) || 0))]}`;
    if (!spend(s, person, q.cost, `${m.fuel === 'ev' ? 'Charging' : 'Fuel'} ${where}, the ${m.make} ${m.model}`, 'vehicle', true)) throw new CommandError(`It comes to ${formatMoney(q.cost, saveCurrency(s.universe))}, more than you can pay.`);
    v.fuelLevel = q.to;
    delete v.dry;
    if (q.minutes > 0) s.advanceTo(s.now + q.minutes * 60_000);
    const range = rangeKm(v);
    v.fills = [{ at: s.now, where: where.replace(/^at /, ''), amount: q.amount, unit: q.unit, cost: q.cost, basis: 'area' as const, minutes: q.minutes, level: q.to, ...(range !== undefined ? { rangeKm: range } : {}) }, ...(v.fills ?? [])].slice(0, FILL_LOG_KEEP);
    return { amount: q.amount, paid: q.cost, minutes: q.minutes, level: q.to, ...(range !== undefined ? { rangeKm: range } : {}) };
  });

  // Who fills it as the month's driving goes: you alone, or the driver at a quarter.
  sim.onCommand<{ vehicleId: string; auto: boolean }, { fillUp: 'auto' | 'self' }>('vehicle.set_filling', (p, { sim: s }) => {
    const v = vehiclesOf(s.player).find((x) => x.id === p?.vehicleId && x.soldAt === undefined);
    if (!v) throw new CommandError('That isn’t a vehicle you own.');
    if (!capacityOf(modelById(v.modelId)!)) throw new CommandError('SLATE keeps no tank for it.');
    v.fillUp = p.auto ? 'auto' : 'self';
    if (v.fillUp === 'self') startDays(s, s.player, v);
    return { fillUp: v.fillUp };
  });
}
