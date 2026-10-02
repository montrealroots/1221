/**
 * SLATE — a travel trailer or touring caravan of one's own (from 2026-09-30),
 * on the figures in `content/caravans.ts`.
 *
 * Bought where one lives in New York, Connecticut, California or Britain,
 * with the state's sales tax and first registration where they're charged.
 * Kept on the drive of a house of one's own in its town: what storing one
 * elsewhere costs wasn't researched, so it's sold without one. Each month a
 * twelfth of its insurance; each year its registration where one is asked.
 * Worth its price on the car curve, as no caravan's depreciation was read.
 *
 * Towed on a journey by road behind a car of one's own with a hitch fitted
 * (Fit A Towbar), whose maker rates it to tow the caravan's most: the drive
 * burns more fuel by its weight and takes longer where the law sets a lower
 * limit towing, and its nights can be at the region's campground, as a
 * motorhome's are. It stays in its own country: no border crossing with one
 * was read.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { salesTaxRate } from '../content/tax';
import { upkeepPerKm } from './repairs';
import { CARAVANS, CARAVAN_YEAR, HITCH_FIT, LB, TOWING, TOW_RATINGS, type CaravanMarket } from '../content/caravans';
import { inTheBank, owe, payFromBank } from './household';
import { livingIn } from './homes';
import { jurisdictionOf, kept, modelById, runningCost, vehiclesOf, type OwnedVehicle } from './vehicles';
import { roadKm } from './driving';
import type { JourneyLeg } from './journey';

export const CARAVAN_MONTH_KIND = 'caravan.month';
const VEHICLES_ROUTE = '/workspace/vehicles';
const YEAR = 365.2425 * MS_DAY;
const HOUSES = new Set(['house', 'townhouse', 'estate']);
type CaravanPlace = keyof typeof CARAVAN_YEAR;

export interface OwnedCaravan { id: string; market: CaravanMarket; place: CaravanPlace; cityId: string; at?: string; boughtAt: Instant; price: Money; registeredUntil: Instant; soldAt?: Instant }

const inSave = (sim: Simulation, units: number, currency: string): Money => { const cur = saveCurrency(sim.universe); const c = Math.round(units * 100); return cur === currency ? c : exchange(c, currency, cur) ?? c; };
const homeCity = (person: Person) => person.home?.cityId ?? person.currentLocationId;
const isPlace = (j: string | undefined): j is CaravanPlace => j !== undefined && j in CARAVAN_YEAR;
const marketOf = (place: CaravanPlace): CaravanMarket => (place === 'GB' ? 'GB' : 'US');

export const caravansOf = (person: Person): OwnedCaravan[] => (person.caravans ?? []).filter((c) => c.soldAt === undefined);

/** Its worth now, in the save's money: its price on the car curve. */
export const caravanValue = (c: OwnedCaravan, at: Instant): Money => Math.round(c.price * kept((at - c.boughtAt) / YEAR));

/** Its worth now in its own place's money, units: what California's license fee is a share of. */
const worthThere = (c: OwnedCaravan, at: Instant): number => CARAVANS[c.market].price * kept((at - c.boughtAt) / YEAR);

/** A house of one's own in the town, whose drive keeps it. */
function drivewayIn(person: Person, cityId: string): boolean {
  const owned = livingIn(person);
  return Boolean(owned && owned.cityId === cityId && HOUSES.has(owned.facts.type));
}

/** What buying one costs where they live, in the save's money: the price, the sales tax, the first registration. */
export function caravanQuote(sim: Simulation, cityId: string): { price: Money; tax: Money; registration: Money; market: CaravanMarket } | undefined {
  const place = jurisdictionOf(cityId);
  if (!isPlace(place)) return undefined;
  const market = marketOf(place);
  const model = CARAVANS[market];
  const year = CARAVAN_YEAR[place];
  const tax = model.taxIncluded ? 0 : model.price * salesTaxRate(cityId, sim.now, 'goods');
  return { price: inSave(sim, model.price, model.currency), tax: inSave(sim, tax, model.currency), registration: inSave(sim, year.registration(model.maxKg, model.price) + year.firstExtra, year.currency), market };
}

export function buyCaravanRefusal(sim: Simulation, person: Person): string | undefined {
  const city = homeCity(person);
  const q = caravanQuote(sim, city);
  if (!q) return 'SLATE sells a caravan in New York, Connecticut, California and Britain only yet.';
  if (!drivewayIn(person, city)) return 'It’s kept on the drive of a house of your own; what storing one elsewhere costs wasn’t researched.';
  const total = q.price + q.tax + q.registration;
  if (inTheBank(sim, person) < total) return `It costs ${formatMoney(total, saveCurrency(sim.universe), { cents: false })}, taxed and registered.`;
  return undefined;
}

/** What a car may tow, kg, by its maker's rating; 0 where none was read. */
export const towRating = (v: OwnedVehicle): number => TOW_RATINGS[v.modelId]?.kg ?? 0;

export function hitchRefusal(sim: Simulation, person: Person, v: OwnedVehicle): string | undefined {
  if (v.hitch) return 'It has one.';
  const place = jurisdictionOf(v.cityId);
  if (!isPlace(place)) return 'SLATE fits a towbar in America and Britain only yet, where it sells a caravan.';
  if (towRating(v) <= 0) return 'Its maker rates it to tow nothing, or no rating was read.';
  const fit = HITCH_FIT[marketOf(place)];
  if (inTheBank(sim, person) < inSave(sim, fit.amount, fit.currency)) return 'You can’t afford it.';
  return undefined;
}

/** Why the car can't tow a caravan from a town now, or the caravan it tows. */
export function towFor(person: Person, v: OwnedVehicle, fromCity: string, toCity: string, willBeAt?: string): OwnedCaravan | string {
  const caravan = caravansOf(person).find((c) => (willBeAt ?? c.at ?? c.cityId) === fromCity);
  if (!caravan) return 'No caravan of yours is there.';
  if (!v.hitch) return 'The car has no towbar: fit one on the Cars screen.';
  const most = CARAVANS[caravan.market].maxKg;
  if (towRating(v) < most) return `Its maker rates it to tow ${Math.round(towRating(v))} kg, and the ${CARAVANS[caravan.market].label} weighs up to ${Math.round(most)} kg.`;
  const home = caravan.market === 'GB' ? 'uk' : 'us';
  if (CITIES.get(toCity)?.countryId !== home) return 'It stays in its own country: no border crossing with one was read.';
  return caravan;
}

/** A drive's legs with a caravan behind: more fuel by its weight, and longer where the law's limit towing is lower. */
export function towedLegs(sim: Simulation, v: OwnedVehicle, caravan: OwnedCaravan, legs: JourneyLeg[]): JourneyLeg[] {
  const lb = CARAVANS[caravan.market].maxKg / LB;
  const slower = TOWING.slower[v.jurisdiction] ?? 1;
  return legs.map((l) => {
    const km = roadKm(l.from, l.to);
    // Upkeep is in cents a kilometer.
    const upkeep = inSave(sim, Math.round(km * upkeepPerKm(modelById(v.modelId)!, v.jurisdiction)) / 100, 'USD');
    const fuel = runningCost(sim, v, km) - upkeep;
    const more = Math.round(fuel * (lb / 100) * TOWING.fuelPer100Lb);
    const minutes = (l.arriveAt - l.departAt) * slower;
    return { ...l, fare: l.fare + more, arriveAt: l.departAt + Math.round(minutes), basis: `${l.basis} Towing the ${CARAVANS[caravan.market].label}: fuel up ${Math.round(lb / 100)}%, fueleconomy.gov’s 1% a 100 lb${slower > 1 ? `, and slower at the lower limit towing` : ''}.` };
  });
}

function scheduleCaravan(sim: Simulation, person: Person, c: OwnedCaravan): void {
  sim.schedule({ at: sim.now + 30 * MS_DAY, kind: CARAVAN_MONTH_KIND, label: 'The Caravan’s Month', category: 'home', priority: 30, payload: { personId: person.id, caravanId: c.id } });
}

/** Sold at its worth; its months end. */
function sell(sim: Simulation, person: Person, c: OwnedCaravan, memo: string): Money {
  const value = caravanValue(c, sim.now);
  sim.post({ memo, category: 'vehicle', postings: [{ accountId: person.primaryAccountId!, amount: value }, { accountId: sim.nominalAccount('income', 'Caravan Sold').id, amount: -value }] });
  c.soldAt = sim.now;
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.kind === CARAVAN_MONTH_KIND && item.payload.caravanId === c.id) sim.timeline.cancel(item.id, sim.now);
  return value;
}

export function registerCaravans(sim: Simulation): void {
  sim.onCommand<Record<string, never>, { paid: Money; caravanId: string }>('caravan.buy', (_p, { sim: s }) => {
    const person = s.player;
    const no = buyCaravanRefusal(s, person);
    if (no) throw new CommandError(no);
    const city = homeCity(person);
    const q = caravanQuote(s, city)!;
    const paid = q.price + q.tax + q.registration;
    if (!payFromBank(s, person, paid, `A ${CARAVANS[q.market].label}, taxed and registered`, 'vehicle')) throw new CommandError('The bank couldn’t pay.');
    const place = jurisdictionOf(city) as CaravanPlace;
    const c: OwnedCaravan = { id: s.nextId('vehicle'), market: q.market, place, cityId: city, boughtAt: s.now, price: q.price, registeredUntil: s.now + YEAR };
    (person.caravans ??= []).push(c);
    scheduleCaravan(s, person, c);
    return { paid, caravanId: c.id };
  });

  sim.onCommand<{ caravanId?: string }, { value: Money }>('caravan.sell', (p, { sim: s }) => {
    const person = s.player;
    const c = caravansOf(person).find((x) => x.id === p?.caravanId) ?? (p?.caravanId ? undefined : caravansOf(person)[0]);
    if (!c) throw new CommandError('That isn’t a caravan you own.');
    return { value: sell(s, person, c, `Sold the ${CARAVANS[c.market].label}`) };
  });

  sim.onCommand<{ vehicleId: string }, { paid: Money }>('vehicle.hitch', (p, { sim: s }) => {
    const person = s.player;
    const v = vehiclesOf(person).find((x) => x.id === p?.vehicleId && x.soldAt === undefined);
    if (!v) throw new CommandError('That isn’t a car you own.');
    const no = hitchRefusal(s, person, v);
    if (no) throw new CommandError(no);
    const fit = HITCH_FIT[marketOf(jurisdictionOf(v.cityId) as CaravanPlace)];
    const paid = inSave(s, fit.amount, fit.currency);
    if (!payFromBank(s, person, paid, `A towbar fitted to the ${modelById(v.modelId)!.make} ${modelById(v.modelId)!.model}`, 'vehicle')) throw new CommandError('The bank couldn’t pay.');
    v.hitch = true;
    return { paid };
  });

  sim.onSchedule(CARAVAN_MONTH_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const c = person ? caravansOf(person).find((x) => x.id === item.payload.caravanId) : undefined;
    if (!person || !c) return;
    const year = CARAVAN_YEAR[c.place];
    const pay = (units: number, memo: string) => { const due = inSave(s, units, year.currency); if (due > 0 && !payFromBank(s, person, due, memo, 'vehicle')) owe(s, person, due, memo, 'vehicle'); };
    pay(year.insurance / 12, 'The caravan’s insurance, a month');
    if (s.now >= c.registeredUntil) {
      const model = CARAVANS[c.market];
      pay(year.registration(model.maxKg, worthThere(c, s.now)), 'The caravan’s registration renewed');
      c.registeredUntil += YEAR;
    }
    scheduleCaravan(s, person, c);
  });
}

/**
 * Moving home, a caravan comes behind the move to the drive of a new house of
 * one's own in its country, registered there where the state changes; without
 * one, it's sold at its worth, as storing it elsewhere wasn't researched.
 */
export function carryCaravans(sim: Simulation, person: Person, fromCity: string, toCity: string): void {
  for (const c of caravansOf(person)) {
    if ((c.at ?? c.cityId) !== fromCity) continue;
    const place = jurisdictionOf(toCity);
    if (!isPlace(place) || marketOf(place) !== c.market || !drivewayIn(person, toCity)) {
      sell(sim, person, c, `Sold the ${CARAVANS[c.market].label}: no drive of your own to keep it on`);
      if (person.id === sim.universe.playerId) sim.notify({ category: 'home', title: 'Your Caravan Was Sold', body: 'The new home has no drive of your own to keep it on, so it was sold at its worth.', importance: 60, route: VEHICLES_ROUTE });
      continue;
    }
    c.cityId = toCity;
    delete c.at;
    if (place !== c.place) {
      const model = CARAVANS[c.market];
      const year = CARAVAN_YEAR[place];
      const due = inSave(sim, year.registration(model.maxKg, worthThere(c, sim.now)) + year.firstExtra, year.currency);
      if (due > 0 && !payFromBank(sim, person, due, 'Registering the caravan in its new home', 'vehicle')) owe(sim, person, due, 'Registering the caravan', 'vehicle');
      c.place = place;
      c.registeredUntil = sim.now + YEAR;
    }
  }
}

