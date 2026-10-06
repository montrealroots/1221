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
import { MOTO_MODELS, MOTO_TANKS } from '../content/motocatalog';
import { RV_MODELS } from '../content/rvcatalog';
import { RV_LINEUP } from '../content/rvlineup';
import { RIDE_MODELS } from '../content/ridecatalog';
import { RIDE_LINEUP } from '../content/ridelineup';
import { FUEL_STOP_MINUTES, STATIONS } from '../content/errandtrips';
import { TANKS as FIRST_TANKS } from '../content/tanks';
import { spend } from './household';
import { BIKE_UNRATED_PER100, jurisdictionOf, modelById, onTwoWheels, startDays, vehiclesOf, type OwnedVehicle } from './vehicles';
import { tintFuelFactor } from './tint';
import { roofFuelFactor } from './roofbox';
import { livingIn } from './homes';
import type { CarModel } from '../content/vehiclecatalog';
import type { Instant } from '../core/time';
import { AREA_GRADES, CHARGERS, CHARGE_CURVES, EV_PORTS, STATION_GRADES, type Charger, type Connector, type Grade, type Station } from '../content/fuelcharging';

/** When a driver fills, and to what: AAA's quarter tank; a battery at a fifth to the 80% makers advise daily. */
export const FILL = { petrolAt: 0.25, petrolTo: 1, batteryAt: 0.2, batteryTo: 0.8 } as const;

/**
 * A public charge's time: the kWh over the 50 kW the US Department of
 * Energy's Alternative Fuels Data Center gives as DC fast charging's lower
 * end, so no car charges faster here than it might. Charging at home is
 * overnight, plugged in, and takes none of the player's time.
 */
export const PUBLIC_KW = 50;

/**
 * What a model burns a 100 km: its official economy, or for a motorcycle or scooter its maker doesn't rate the mean of
 * those rated (`BIKE_UNRATED_PER100`), as its running cost already did. Until 2026-10-05 an unrated one held no tank
 * here, so it never ran dry nor was filled.
 */
const per100Of = (m: CarModel): number | null => m.per100km ?? (onTwoWheels(m) ? BIKE_UNRATED_PER100 : null);

/** What a model holds: its tank in liters or its battery in kWh, from its maker's figure, or SLATE's estimate where none was read. */
export function capacityOf(m: CarModel): { size: number; unit: 'L' | 'kWh'; estimated: boolean } | undefined {
  const known = TANKS[m.id];
  if (m.fuel === 'ev') {
    if (!m.kwhPer100km) return undefined;
    if (known?.batteryKwh) return { size: known.batteryKwh, unit: 'kWh', estimated: false };
    const est = medianOf((x) => x.fuel === 'ev', 'batteryKwh');
    return est ? { size: est, unit: 'kWh', estimated: true } : undefined;
  }
  if (per100Of(m) === null) return undefined;
  if (known?.tankL) return { size: known.tankL, unit: 'L', estimated: false };
  const kind = m.kind ?? 'car';
  const est = medianOf((x) => (x.kind ?? 'car') === kind && x.fuel !== 'ev', 'tankL');
  return est ? { size: est, unit: 'L', estimated: true } : undefined;
}

/** The tanks read, with the wider motorcycle lineup's (from 2026-10-05). */
const TANKS = { ...FIRST_TANKS, ...MOTO_TANKS };
const models: readonly CarModel[] = [...CAR_MODELS, ...PICKUP_MODELS, ...EV_MODELS, ...BIKE_MODELS, ...MOTO_MODELS, ...RV_MODELS, ...RV_LINEUP, ...RIDE_MODELS, ...RIDE_LINEUP];
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
  // A car of a model year burns as that year's configuration was rated (`systems/modelyears.ts`, from 2026-10-05).
  const b = v?.build;
  if (b && b.fuel === 'ev' && b.kwhPer100km) return ((km * b.kwhPer100km) / 100) * tint;
  if (b && b.fuel !== 'ev' && b.per100km) return ((km * b.per100km) / 100) * tint;
  if (m.fuel === 'ev') return m.kwhPer100km ? ((km * m.kwhPer100km) / 100) * tint : undefined;
  const per = per100Of(m);
  return per ? ((km * per) / 100) * tint : undefined;
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
  /** The station's own price, the area's average, a charger's own or its network's, or the home rate. */ basis: UnitPrice['basis'];
  /** The grade bought, where it's fuel; what the price was. */ grade?: Grade; priceWhy?: string;
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

/** Where a fill is bought: at home, a station of the town by its place in the list and a grade, or a named charger; a public charger at the area's average where none is named. */
export interface FillAt { home?: boolean; station?: number; grade?: Grade; chargerId?: string }

/** A unit's price as it will be paid, in the place's minor unit a liter or kWh, or by the hour; and what it rests on. */
export interface UnitPrice {
  minor: number; currency: string; perHour?: number;
  basis: 'station' | 'area' | 'site' | 'network' | 'home'; /** What the price is, in a sentence. */ why: string; date?: string;
  /** The charger's power, kW, where it's one. */ kw?: number;
}

export const GRADE_LABEL: Readonly<Record<Grade, string>> = { regular: 'Regular', mid: 'Mid-Grade', premium: 'Premium', diesel: 'Diesel', 'premium-diesel': 'Premium Diesel' };
const CONNECTOR_LABEL: Readonly<Record<Connector, string>> = { nacs: 'NACS', ccs1: 'CCS1', ccs2: 'CCS2', chademo: 'CHAdeMO' };

/** What a car may be filled with: a petrol car any petrol grade (no catalog trim's maker requires premium, research-fuel-charging.json); a diesel car takes diesel. */
export const gradesFor = (m: CarModel): Grade[] => (m.fuel === 'diesel' ? ['diesel', 'premium-diesel'] : ['regular', 'mid', 'premium']);

/** A town's station by its place in the list, and what's kept of it. */
export function stationAt(cityId: string, index = 0): { name: string; kept?: Station } | undefined {
  const list = STATIONS[cityId] ?? [];
  const name = list[Math.max(0, Math.min(list.length - 1, index))];
  return name ? { name, ...(STATION_GRADES.find((x) => x.cityId === cityId && x.name === name) ? { kept: STATION_GRADES.find((x) => x.cityId === cityId && x.name === name)! } : {}) } : undefined;
}

export const chargersIn = (cityId: string): Charger[] => CHARGERS.filter((c) => c.cityId === cityId);

/** Why a car can't charge at a charger: connectors not published, none that fit, or a network that keeps it to Teslas. */
export function chargerRefusal(m: CarModel, c: Charger): string | undefined {
  if (!c.connectors.length) return 'Its connectors aren’t published.';
  const ports = EV_PORTS[m.id];
  if (!ports) return 'Your car’s connector isn’t kept.';
  if (!c.connectors.some((x) => ports.connectors.includes(x))) return `It has ${c.connectors.map((x) => CONNECTOR_LABEL[x]).join(' and ')}; your car takes ${ports.connectors.map((x) => CONNECTOR_LABEL[x]).join(' or ')}.`;
  if (m.make !== 'Tesla' && c.open === 'tesla') return 'It’s for Teslas only.';
  if (m.make !== 'Tesla' && c.open === 'unknown') return 'It isn’t known to be open to other makes.';
  return undefined;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const;
/** A read's day, "2026-10-04", as it's said: October 4, 2026; a month alone, October 2026. */
const said = (day: string): string => { const [y, m, d] = day.split('-').map(Number); return d ? `${MONTHS[m! - 1]} ${d}, ${y}` : `${MONTHS[m! - 1]} ${y}`; };
/** The instant a read's day began, UTC. */
const dayStart = (day: string): Instant => { const [y, m, d] = day.split('-').map(Number); return Date.UTC(y!, m! - 1, d ?? 1); };

/**
 * A unit's price at where it's bought then, or why it can't be bought there.
 * A station's posted price stands from the day it was read: before it, the
 * station's price that day wasn't read, and the area's average stands.
 */
export function priceAt(v: OwnedVehicle, at: FillAt, now: Instant): UnitPrice | string {
  const m = modelById(v.modelId)!;
  const cityId = v.at ?? v.cityId;
  const j = jurisdictionOf(cityId) ?? v.jurisdiction;
  if (m.fuel === 'ev') {
    const area = CHARGING[j] ?? CHARGING[v.jurisdiction];
    if (at.home) return { minor: area.home, currency: area.currency, basis: 'home', why: 'the home rate where you live' };
    if (!at.chargerId) return { minor: area.public, currency: area.currency, basis: 'area', why: 'the area’s public charging average', kw: PUBLIC_KW };
    const c = chargersIn(cityId).find((x) => x.id === at.chargerId);
    if (!c) return 'There’s no such charger here.';
    const no = chargerRefusal(m, c);
    if (no) return no;
    const p = c.price;
    if (p?.perKwh !== undefined) return { minor: Math.round(p.perKwh * 100_000) / 1000, currency: p.currency, basis: p.basis === 'network-average' || p.basis === 'network-range' ? 'network' : 'site', why: p.basis === 'network-average' ? `${c.network}’s average rate in the state, not this site’s own` : p.basis === 'network-range' ? `the middle of ${c.network}’s published range` : p.basis === 'site-peak' ? `${c.network}’s rate here at its dearest hours` : `${c.network}’s rate here`, date: c.date, kw: c.kw };
    if (p?.perHour !== undefined) return { minor: 0, perHour: p.perHour * 100, currency: p.currency, basis: 'site', why: `${c.network}’s rate by the hour here`, date: c.date, kw: c.kw };
    return { minor: area.public, currency: area.currency, basis: 'area', why: `the area’s public charging average; ${c.network} publishes no price for it`, kw: c.kw };
  }
  const grade = at.grade ?? (m.fuel === 'diesel' ? 'diesel' : 'regular');
  if (!gradesFor(m).includes(grade)) return m.fuel === 'diesel' ? 'A diesel takes diesel.' : 'A petrol car can’t take diesel.';
  const st = stationAt(cityId, at.station ?? 0);
  if (!st) return 'SLATE knows no station in this town.';
  if (st.kept && !st.kept.grades.includes(grade)) return `${st.name} doesn’t sell ${GRADE_LABEL[grade].toLowerCase()}.`;
  const posted = st.kept?.prices?.[grade];
  if (posted && now >= dayStart(posted.date)) return { minor: posted.minor, currency: posted.currency, basis: 'station', why: `${st.name}’s own price, posted ${said(posted.date)}${posted.status === 'secondhand' ? ', read secondhand' : ''}`, date: posted.date };
  const f = FUEL[j] ?? FUEL[v.jurisdiction];
  if (grade === 'regular' || grade === 'diesel') return { minor: grade === 'diesel' ? f.diesel : f.petrol, currency: f.currency, basis: 'area', why: 'the area’s pump average, not this station’s own' };
  const avg = AREA_GRADES[j]?.[grade];
  if (avg) return { minor: avg.minor, currency: avg.currency, basis: 'area', why: `${avg.area}’s ${GRADE_LABEL[grade].toLowerCase()} average, read ${said(avg.date)}, not this station’s own`, date: avg.date };
  return `No price for ${GRADE_LABEL[grade].toLowerCase()} is published here.`;
}

/** Each catalog car's measured curve (`content/fuelcharging.ts`). */
const CURVE_OF: Readonly<Record<string, string>> = {
  'us-tesla-model-y': 'tesla-model-y-standard-64kWh-LFP', 'ca-tesla-model-y': 'tesla-model-y-standard-64kWh-LFP', 'mx-tesla-model-y': 'tesla-model-y-standard-64kWh-LFP',
  'gb-tesla-model-y': 'tesla-model-y-standard-64kWh-LFP', 'ie-tesla-model-y': 'tesla-model-y-standard-64kWh-LFP',
  'us-chevrolet-equinox-ev': 'chevrolet-equinox-ev-fwd', 'ca-chevrolet-equinox-ev': 'chevrolet-equinox-ev-fwd', 'gb-ford-puma-gen-e': 'ford-puma-gen-e',
};
function curveKw(points: readonly (readonly [number, number])[], soc: number): number {
  if (soc <= points[0]![0]) return points[0]![1];
  for (let i = 1; i < points.length; i += 1) {
    const [s1, k1] = points[i]!;
    const [s0, k0] = points[i - 1]!;
    if (soc <= s1) return k0 + ((k1 - k0) * (soc - s0)) / (s1 - s0);
  }
  return points.at(-1)![1];
}

/**
 * A public charge's minutes from one level to another: each percent at the
 * slower of the charger's power and what the car takes there, by its
 * measured curve where one is kept (charging slows past 80%), or its
 * maker's top rate where not.
 */
export function chargeMinutes(m: CarModel, size: number, from: number, to: number, chargerKw: number): number {
  const curve = CHARGE_CURVES[CURVE_OF[m.id] ?? ''];
  const top = EV_PORTS[m.id]?.maxDcKw ?? chargerKw;
  let minutes = 0;
  for (let at = from; at < to - 1e-9;) {
    const next = Math.min(to, Math.floor(at * 100 + 1e-9) / 100 + 0.01);
    const kw = Math.min(chargerKw, curve ? curveKw(curve, at * 100) : top);
    minutes += (((next - at) * size) / kw) * 60;
    at = next;
  }
  return Math.round(minutes);
}

/**
 * A fill planned: the level it reaches, how much goes in, its cost, the
 * minutes it takes and the price it's paid at, or why it can't be: a grade
 * or charger the car can't take, no room for the quantity, a level not above
 * where it is, or a limit too small to buy anything.
 */
export function planFill(sim: Simulation, v: OwnedVehicle, want: FillAmount, at: FillAt = {}): { to: number; amount: number; unit: 'L' | 'kWh'; cost: Money; minutes: number; estimated: boolean; price: UnitPrice } | string {
  const m = modelById(v.modelId)!;
  const cap = capacityOf(m);
  if (!cap) return 'SLATE keeps no tank for it.';
  const price = priceAt(v, at, sim.now);
  if (typeof price === 'string') return price;
  const level = levelOf(v);
  const room = Math.max(0, 1 - level) * cap.size;
  const word = cap.unit === 'kWh' ? 'kWh' : 'liters';
  const minutesTo = (to: number): number => (at.home ? 0 : m.fuel === 'ev' ? chargeMinutes(m, cap.size, level, to, price.kw ?? PUBLIC_KW) : FUEL_STOP_MINUTES);
  // By the hour, a level's cost is its minutes; by the unit, its amount.
  const costTo = (to: number): Money => (price.perHour !== undefined ? inSave(sim, Math.round((minutesTo(to) / 60) * price.perHour), price.currency) : inSave(sim, Math.round(Math.max(0, to - level) * cap.size * price.minor), price.currency));
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
    // A spending limit stops at the money: the most it buys, found a step at a time where it's by the hour.
    const first = Math.min(1, level + 0.01);
    if (!(want.value > 0) || costTo(first) > want.value) return 'That buys almost nothing.';
    if (price.perHour !== undefined) {
      to = first;
      while (to < 1 - 1e-9 && costTo(Math.min(1, to + 0.005)) <= want.value) to = Math.min(1, to + 0.005);
    } else {
      const each = inSave(sim, Math.round(price.minor * 1000), price.currency) / 1000;
      to = Math.min(1, level + want.value / each / cap.size);
    }
  }
  const amount = Math.max(0, to - level) * cap.size;
  if (amount < 1e-6) return m.fuel === 'ev' ? 'It’s charged.' : 'The tank is full.';
  // Held to a limit's cent: where the pump's money isn't the save's, the amount and its price round apart (tests/fuel-stations.test.ts).
  return { to, amount, unit: cap.unit, cost: Math.min(costTo(to), want.by === 'spend' ? want.value : Infinity), minutes: minutesTo(to), estimated: cap.estimated, price };
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
  sim.onCommand<{ vehicleId: string; station?: number; home?: boolean; grade?: Grade; chargerId?: string; amount?: FillAmount }, { amount: number; paid: Money; minutes: number; level: number; rangeKm?: number }>('vehicle.refuel', (p, { sim: s }) => {
    const person = s.player;
    const home = p?.home === true;
    const no = fillRefusal(person, String(p?.vehicleId), home);
    if (no) throw new CommandError(no);
    const v = vehiclesOf(person).find((x) => x.id === p.vehicleId)!;
    const m = modelById(v.modelId)!;
    // Chosen, or as before: full at a station, the 80% for every day at home.
    const want: FillAmount = p.amount ?? (m.fuel === 'ev' && home ? { by: 'level', value: FILL.batteryTo } : { by: 'full' });
    const at: FillAt = { ...(home ? { home: true } : {}), ...(p.station !== undefined ? { station: Number(p.station) || 0 } : {}), ...(p.grade ? { grade: p.grade } : {}), ...(p.chargerId ? { chargerId: String(p.chargerId) } : {}) };
    const q = planFill(s, v, want, at);
    if (typeof q === 'string') throw new CommandError(q);
    const charger = p.chargerId ? chargersIn(person.currentLocationId).find((c) => c.id === p.chargerId) : undefined;
    const where = home ? 'at home' : m.fuel === 'ev' ? (charger ? `at ${charger.network}, ${charger.name}` : 'at a public charger') : `at ${stationAt(person.currentLocationId, at.station ?? 0)?.name ?? 'a station'}`;
    if (!spend(s, person, q.cost, `${m.fuel === 'ev' ? 'Charging' : 'Fuel'} ${where}, the ${m.make} ${m.model}`, 'vehicle', true)) throw new CommandError(`It comes to ${formatMoney(q.cost, saveCurrency(s.universe))}, more than you can pay.`);
    v.fuelLevel = q.to;
    delete v.dry;
    if (q.minutes > 0) s.advanceTo(s.now + q.minutes * 60_000);
    const range = rangeKm(v);
    v.fills = [{ at: s.now, where: where.replace(/^at /, ''), amount: q.amount, unit: q.unit, cost: q.cost, basis: q.price.basis, priceWhy: q.price.why, ...(m.fuel !== 'ev' ? { grade: at.grade ?? (m.fuel === 'diesel' ? 'diesel' : 'regular') } : {}), minutes: q.minutes, level: q.to, ...(range !== undefined ? { rangeKm: range } : {}) }, ...(v.fills ?? [])].slice(0, FILL_LOG_KEEP);
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
