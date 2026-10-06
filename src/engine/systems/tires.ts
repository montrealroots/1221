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
 *
 * **A set chosen by make and model** (from 2026-10-05, `content/tirecatalog.ts`):
 * four of a tire on sale where the car is, at its seller's price with the
 * place's tax, and in America BJ's $80 to fit a set where the price isn't
 * fitted (elsewhere a fitting's price isn't read, and none is charged). It
 * lasts its treadwear warranty where its maker or seller states one, and
 * otherwise the CrossClimate 2's 60,000 miles, or for a winter tire the
 * X-Ice Snow's 40,000. Fitted with no model chosen, a set is the market's
 * price above, as before.
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
import { TIRE_PRODUCTS } from '../content/tirecatalog';
import type { CatalogOffer, CatalogProduct } from '../content/products';
import { devicePrice, marketWhere, offerIn } from './devices';

export const TIRE_LIFE_KM = Math.round(60_000 * 1.609344);
const USD_SET = { price: 899.96 + 80, currency: 'USD' };
export const TIRE_SET: Readonly<Partial<Record<Jurisdiction, { price: number; currency: string }>>> = {
  'US-NY': USD_SET, 'US-CT': USD_SET, 'US-CA': USD_SET,
  GB: { price: 58.99 * 4, currency: 'GBP' }, IE: { price: 145 * 4, currency: 'EUR' },
  'CA-ON': { price: 282.03 * 4, currency: 'CAD' }, 'CA-BC': { price: 282.03 * 4, currency: 'CAD' },
  'MX-CMX': { price: 2_599 * 4, currency: 'MXN' },
};
/** The set on a car, chosen by model: its product and the km it lasts. */
/**
 * The set on a car, chosen by model: its product, the km it lasts, and (from 2026-10-05) the warranty it came with,
 * its brand and what it cost. A treadwear warranty is a promise, not a lifespan: a set wears out somewhat before or
 * after it, between 85% and 115% of it, SLATE's assumption, no spread being published (decider `vehicle.treadlife`).
 * One worn out before its warranty is credited pro rata, the share of the warranty not driven, toward a set of the
 * same brand, as makers' treadwear warranties are. Until 2026-10-05 a set lasted its warranty to the kilometer.
 */
export interface TireSet { product: string; lifeKm: number; warrantyKm?: number; brand?: string; paid?: Money }
/** The range a set's real life falls in, as a share of its warranted or typical km: SLATE's assumption. */
export const TREAD_LIFE = { least: 0.85, most: 1.15 } as const;
/** A set's real life: a share of its warranted or typical km, drawn for the set (`vehicle.treadlife`). */
export function treadLife(sim: Simulation, person: Person, v: OwnedVehicle, km: number): number {
  const t = sim.rng('vehicle.treadlife', person.id, `${v.id}-${Math.round(odometerOf(v))}`).next();
  return Math.round(km * (TREAD_LIFE.least + t * (TREAD_LIFE.most - TREAD_LIFE.least)));
}
/** What a worn set's warranty credits toward a set of its brand: the share of its warranty not driven, of what it cost. */
export function treadCredit(v: OwnedVehicle, brand: string): Money {
  const t = v.tires;
  if (!t?.warrantyKm || !t.paid || !t.brand || t.brand !== brand || !tiresWorn(v) || t.lifeKm >= t.warrantyKm) return 0;
  return Math.round(t.paid * (1 - t.lifeKm / t.warrantyKm));
}
type Odo = { ageAtPurchase: number; jurisdiction: Jurisdiction; km?: number; odometerAtPurchase?: number; tiresAtKm?: number; tires?: TireSet };
/** The car's odometer, km (as `odometer` in `systems/carcare.ts`). */
export const odometerOf = (v: Odo): number => (v.odometerAtPurchase ?? v.ageAtPurchase * KM_A_YEAR[v.jurisdiction]) + (v.km ?? 0);
/** The odometer when its everyday tires were last fitted. */
export const tiresFittedAt = (v: Odo): number => v.tiresAtKm ?? (() => { const at = v.odometerAtPurchase ?? v.ageAtPurchase * KM_A_YEAR[v.jurisdiction]; return at - (at % TIRE_LIFE_KM); })();
/** The km its everyday set lasts: its model's, or the CrossClimate 2's. */
export const tireLifeOf = (v: Odo): number => v.tires?.lifeKm ?? TIRE_LIFE_KM;
export const tiresWorn = (v: Odo): boolean => odometerOf(v) - tiresFittedAt(v) >= tireLifeOf(v);
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

export interface WinterTires { boughtAt: Instant; km: number; /** Its model and the km it lasts, where chosen (from 2026-10-05). */ product?: string; wearKm?: number }

/** The km a tire lasts: its warranty, or the CrossClimate 2's 60,000 miles, a winter tire the X-Ice Snow's 40,000. */
export const lifeOfTire = (p: CatalogProduct): number => (typeof p.attrs.warrantyKm === 'number' ? p.attrs.warrantyKm : p.attrs.season === 'winter' ? WINTER_TIRES.wearKm : TIRE_LIFE_KM);

/** BJ's $80 to fit a set in America, where a price isn't fitted; elsewhere none read. */
export const FIT_SET = { us: { price: 80, currency: 'USD' } } as Readonly<Record<string, { price: number; currency: string }>>;

/** The tires on sale where the car is, a set's price each, cheapest first: winter tires, or the rest. */
export function tireCatalog(sim: Simulation, v: OwnedVehicle, winter: boolean): { product: CatalogProduct; offer: CatalogOffer; price: Money }[] {
  const city = v.at ?? v.cityId;
  const market = marketWhere(city);
  return TIRE_PRODUCTS.filter((p) => (p.attrs.season === 'winter') === winter).flatMap((product) => product.offers.filter((o) => o.market === market).map((offer) => ({ product, offer, price: setPrice(sim, city, offer) })))
    .sort((a, b) => a.price - b.price || a.product.id.localeCompare(b.product.id));
}

/** Four of an offer, with the place's tax, and the fitting where the price isn't fitted. */
export function setPrice(sim: Simulation, cityId: string, offer: CatalogOffer): Money {
  const fit = offer.code === 'fitted' ? undefined : FIT_SET[offer.market];
  return devicePrice(sim, cityId, offer) * 4 + (fit ? inSave(sim, Math.round(fit.price * 100), fit.currency) : 0);
}

/** Why a model can't go on a car: not on sale where it is, or a winter tire for every day, or the other way. */
export function tireOfferRefusal(v: OwnedVehicle, offerId: string, winter: boolean): string | undefined {
  const found = offerIn(TIRE_PRODUCTS, offerId);
  if (!found) return 'That tire isn’t on sale.';
  if (found.offer.market !== marketWhere(v.at ?? v.cityId)) return 'It’s sold in another country.';
  if ((found.product.attrs.season === 'winter') !== winter) return winter ? 'That isn’t a winter tire.' : 'That’s a winter tire; fit it as one.';
  return undefined;
}

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
  const wear = v.winterTires.wearKm ?? WINTER_TIRES.wearKm;
  if (v.winterTires.km >= wear) {
    delete v.winterTires;
    if (person.id === sim.universe.playerId) sim.notify({ category: 'home', title: 'Winter Tires Worn Out', body: `The ${modelById(v.modelId)!.make} ${modelById(v.modelId)!.model}’s winter tires have done their ${Math.round(wear / 1000).toLocaleString('en-US')} thousand km.`, importance: 40, route: '/workspace/vehicles' });
  }
}

export function registerTires(sim: Simulation): void {
  sim.onCommand<{ vehicleId: string; offerId?: string }, { paid: Money; credit?: Money }>('vehicle.replace_tires', (p, { sim: s }) => {
    const person = s.player;
    const v = vehiclesOf(person).find((x) => x.id === p?.vehicleId && x.soldAt === undefined);
    if (!v) throw new CommandError('That isn’t a car you own.');
    if (kindOf(modelById(v.modelId)!) !== 'car') throw new CommandError('No set’s price is kept for it.');
    // A model chosen (from 2026-10-05): its set's price and its life.
    const chosen = p?.offerId !== undefined ? String(p.offerId) : undefined;
    if (chosen) { const no = tireOfferRefusal(v, chosen, false); if (no) throw new CommandError(no); }
    const found = chosen ? offerIn(TIRE_PRODUCTS, chosen) : undefined;
    const price = found ? setPrice(s, v.at ?? v.cityId, found.offer) : tireSetCost(s, v);
    if (price === undefined) throw new CommandError('No set’s price is kept for it.');
    // A worn set's warranty credit toward the same brand (from 2026-10-05).
    const credit = found ? Math.min(price, treadCredit(v, found.product.brand)) : 0;
    const cost = price - credit;
    if (!payFromBank(s, person, cost, `${found ? `Four ${found.product.brand} ${found.product.model} tires, ${found.offer.seller}` : 'Four tires, fitted'}${credit ? `, less ${formatMoney(credit, saveCurrency(s.universe))} of the old set’s treadwear warranty` : ''}`, 'vehicle')) throw new CommandError(`${formatMoney(cost, saveCurrency(s.universe))} is more than the bank can cover.`);
    if (found) {
      const warranty = typeof found.product.attrs.warrantyKm === 'number' ? found.product.attrs.warrantyKm : undefined;
      v.tires = { product: found.product.id, lifeKm: treadLife(s, person, v, lifeOfTire(found.product)), brand: found.product.brand, paid: price, ...(warranty ? { warrantyKm: warranty } : {}) };
    } else delete v.tires;
    v.tiresAtKm = odometerOf(v);
    return { paid: cost, ...(credit ? { credit } : {}) };
  });
  sim.onCommand<{ vehicleId: string; offerId?: string }, { paid: Money }>('vehicle.winter_tires', (p, { sim: s }) => {
    const person = s.player;
    const v = vehiclesOf(person).find((x) => x.id === p?.vehicleId);
    const no = tiresRefusal(v);
    if (no) throw new CommandError(no);
    const chosen = p?.offerId !== undefined ? String(p.offerId) : undefined;
    if (chosen) { const bad = tireOfferRefusal(v!, chosen, true); if (bad) throw new CommandError(bad); }
    const found = chosen ? offerIn(TIRE_PRODUCTS, chosen) : undefined;
    const cost = found ? setPrice(s, v!.at ?? v!.cityId, found.offer) : inSave(s, WINTER_TIRES.setUsd * 100, 'USD');
    if (!payFromBank(s, person, cost, found ? `Four ${found.product.brand} ${found.product.model} winter tires, ${found.offer.seller}` : 'Winter tires, a set of four', 'vehicle')) throw new CommandError(`${formatMoney(cost, saveCurrency(s.universe))} is more than the bank can cover.`);
    v!.winterTires = { boughtAt: s.now, km: 0, ...(found ? { product: found.product.id, wearKm: lifeOfTire(found.product) } : {}) };
    return { paid: cost };
  });
}
