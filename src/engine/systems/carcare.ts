/**
 * SLATE — a car's warranty, its servicing and its collisions (Stage 8 of
 * `docs/BACKLOG.md`, from 2026-10-01; the figures in `content/carcare.ts`).
 *
 * **Servicing** comes due by the maker's interval, months or kilometers,
 * from the last service or from buying it. Book The Service at a garage in
 * the car's town while it's open, at the market's posted price; the car is
 * in for the hours it takes. A service a month or 1,000 km overdue is a
 * service missed, and the car's servicing isn't kept from then: its
 * warranty is gone, and in Britain it's worth 10% less. The services a car
 * is expected to need come out of AAA's upkeep a kilometer, as its repairs
 * do (`upkeepPerKm` in `systems/repairs.ts`). An electric car needs none.
 *
 * **The warranty** covers a fault, not a collision, within its years and
 * kilometers from new, while the servicing is kept, repaired free at a
 * dealer of the make.
 *
 * **A collision**, in a month driven, at the published rate a year
 * (decider `vehicle.collision`), leaves the car damaged until it's
 * repaired, at the place's average claim. Full cover pays all of the
 * repair over the deductible; liability, none of it. Damage beyond what the
 * car is worth writes it off: full cover pays its value less the
 * deductible, and the car is gone.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatDate, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { KM_A_YEAR, type Jurisdiction } from '../content/vehiclefees';
import type { CarModel } from '../content/vehiclecatalog';
import { COLLISION, DEFAULT_INTERVAL, MEXICO_INTERVAL, SERVICE_INTERVAL, SERVICE_PRICE, WARRANTY, type Interval, type Term } from '../content/carcare';
import { CAR_SHOPS } from '../content/carshops';
import { shutAt } from './errands';
import { spend } from './household';
import { stereoCover } from './caraudio';
import type { OwnedVehicle } from './vehicles';

const YEAR_MS = 365.2425 * MS_DAY;
const GRACE = { days: 30, km: 1_000 } as const;

export interface Service { at: Instant; km: number; shopId: string }

export type CareMarket = 'us' | 'uk' | 'ie' | 'ca' | 'mx';
export const careMarket = (j: Jurisdiction): CareMarket => (j.startsWith('US') ? 'us' : j === 'GB' ? 'uk' : j === 'IE' ? 'ie' : j.startsWith('CA') ? 'ca' : 'mx');

/** Kilometers on the clock: its years before you, at the place's average, and since. */
export const odometer = (v: OwnedVehicle): number => v.ageAtPurchase * KM_A_YEAR[v.jurisdiction] + (v.km ?? 0);
const ageAt = (v: OwnedVehicle, at: Instant) => v.ageAtPurchase + (at - v.boughtAt) / YEAR_MS;

export function intervalOf(v: OwnedVehicle, m: CarModel): Interval | undefined {
  if (m.fuel === 'ev' || (m.kind ?? 'car') !== 'car') return undefined;
  const mkt = careMarket(v.jurisdiction);
  if (mkt === 'mx') return MEXICO_INTERVAL;
  if (mkt === 'uk' || mkt === 'ie') return SERVICE_INTERVAL.uk[m.make] ?? DEFAULT_INTERVAL;
  return SERVICE_INTERVAL.us[m.make] ?? DEFAULT_INTERVAL;
}

/** When the next service is due, and at what odometer reading. */
export function serviceDue(v: OwnedVehicle, m: CarModel): { at: Instant; km: number } | undefined {
  const iv = intervalOf(v, m);
  if (!iv) return undefined;
  const last = v.services?.at(-1);
  return { at: (last?.at ?? v.boughtAt) + iv.months * YEAR_MS / 12, km: (last?.km ?? odometer({ ...v, km: 0 })) + iv.km };
}

/** Whether the car's servicing has been kept: no service gone a month or 1,000 km past due. */
export function servicingKept(v: OwnedVehicle, m: CarModel, at: Instant): boolean {
  if (v.serviceMissed) return false;
  const due = serviceDue(v, m);
  return !due || (at <= due.at + GRACE.days * MS_DAY && odometer(v) <= due.km + GRACE.km);
}

export function warrantyOf(v: OwnedVehicle, m: CarModel): Term | undefined {
  const mkt = careMarket(v.jurisdiction);
  return mkt === 'ie' ? WARRANTY.uk[m.make] : mkt === 'mx' ? WARRANTY.mx[m.make] ?? WARRANTY.us[m.make] : WARRANTY[mkt][m.make];
}

/** Whether a fault would be repaired under the maker's warranty now. */
export function inWarranty(v: OwnedVehicle, m: CarModel, at: Instant): boolean {
  const w = warrantyOf(v, m);
  return Boolean(w && ageAt(v, at) < w.years && odometer(v) < w.km && servicingKept(v, m, at));
}

const inSave = (sim: Simulation, units: number, currency: string): Money => { const c = Math.round(units * 100); const cur = saveCurrency(sim.universe); return cur === currency ? c : exchange(c, currency, cur) ?? c; };

export function serviceCost(sim: Simulation, v: OwnedVehicle): Money {
  const p = SERVICE_PRICE[careMarket(v.jurisdiction)]!;
  return inSave(sim, p.amount, p.currency);
}

/** What a service in the car's market is: the chain's own offer. */
export const serviceWhat = (v: OwnedVehicle): string => SERVICE_PRICE[careMarket(v.jurisdiction)]!.what;

/** The expected services a year, US dollars, for the upkeep they come out of. */
export function expectedServicesUsd(m: CarModel, j: Jurisdiction): number {
  const v = { jurisdiction: j } as OwnedVehicle;
  const iv = intervalOf(v, m);
  if (!iv) return 0;
  const perYear = Math.max(12 / iv.months, KM_A_YEAR[j] / iv.km);
  const p = SERVICE_PRICE[careMarket(j)]!;
  const usd = p.currency === 'USD' ? p.amount : (exchange(Math.round(p.amount * 100), p.currency, 'USD') ?? 0) / 100;
  return perYear * usd;
}

export function serviceRefusal(person: Person, v: OwnedVehicle, m: CarModel, shopId: string, at: Instant): string | undefined {
  if (!intervalOf(v, m)) return 'It needs no servicing.';
  const shop = CAR_SHOPS.find((s) => s.id === shopId);
  if (!shop) return 'There’s no such garage.';
  if ((v.at ?? v.cityId) !== shop.cityId) return `The car is in ${CITIES.require(v.at ?? v.cityId).name}.`;
  if (person.currentLocationId !== shop.cityId) return `You’re not in ${CITIES.require(shop.cityId).name}.`;
  if (shop.make && shop.make !== m.make) return `${shop.name} services only a ${shop.make}.`;
  if (v.inShop && v.inShop.until > at) return 'It’s in a shop already.';
  return shop.week ? shutAt(shop.week, shop.name, shop.cityId, at) : undefined;
}

/** The month's check: a service gone past due without one, missed for good. */
export function serviceMonth(v: OwnedVehicle, m: CarModel, at: Instant): void {
  if (!v.serviceMissed && !servicingKept(v, m, at)) v.serviceMissed = at;
}

/**
 * A month driven's chance of a collision, drawn: true where there was one.
 * `odds` overrides the month's chance, for the decider's sweep.
 */
export function mayCollide(sim: Simulation, person: Person, v: OwnedVehicle, m: CarModel, value: Money, at: Instant, odds?: number): boolean {
  if (v.fault || (m.kind ?? 'car') !== 'car') return false;
  if (sim.rng('vehicle.collision', v.id, at).next() >= (odds ?? 1 - Math.exp(-COLLISION.perYear / 12))) return false;
  const sev = COLLISION.severity[careMarket(v.jurisdiction)]!;
  const usd = sev.currency === 'USD' ? sev.amount : (exchange(Math.round(sev.amount * 100), sev.currency, 'USD') ?? 0) / 100;
  const cost = inSave(sim, sev.amount, sev.currency);
  const deductible = inSave(sim, COLLISION.deductibleUsd, 'USD');
  const mine = person.id === sim.universe.playerId;
  const cur = saveCurrency(sim.universe);
  if (cost >= value) {
    // Written off: full cover pays its value over the deductible; it's gone either way.
    // And a stereo fitted, to its cap (`stereoCover`, from 2026-10-02).
    const paid = v.coverage === 'full' ? Math.max(0, value - deductible) + stereoCover(sim, v, value) : 0;
    if (paid > 0 && person.primaryAccountId) sim.post({ memo: `The insurer, the ${m.make} ${m.model} written off`, category: 'vehicle', postings: [{ accountId: person.primaryAccountId, amount: paid }, { accountId: sim.nominalAccount('income', 'Insurance Paid').id, amount: -paid }] });
    v.soldAt = at;
    if (mine) sim.notify({ category: 'home', title: 'Your Car Was Written Off', body: `A collision did more damage than the ${m.make} ${m.model} was worth.${paid ? ` The insurer paid ${formatMoney(paid, cur, { cents: false })}.` : ' Liability cover pays nothing for your own car.'}`, importance: 80, route: '/workspace/vehicles' });
    return true;
  }
  v.fault = { at, severe: true, usd, collision: true };
  if (mine) sim.notify({ category: 'home', title: 'A Collision', body: `The ${m.make} ${m.model} is damaged, about ${formatMoney(cost, cur, { cents: false })} to repair${v.coverage === 'full' ? `, the insurer paying all over ${formatMoney(deductible, cur, { cents: false })}` : ', all of it yours on liability cover'}. It goes nowhere until it’s repaired.`, importance: 70, route: '/workspace/vehicles' });
  return true;
}

/** What you pay for a repair: nothing under warranty at a dealer of the make, the deductible's most for a collision on full cover, all of it otherwise. */
export function repairShare(sim: Simulation, v: OwnedVehicle, m: CarModel, dealerMake: string | undefined, bill: Money, at: Instant): { yours: Money; why?: string } {
  // The repair command asks for a fault first (`repairRefusal`).
  if (v.fault?.collision) {
    if (v.coverage !== 'full') return { yours: bill };
    const deductible = inSave(sim, COLLISION.deductibleUsd, 'USD');
    return { yours: Math.min(bill, deductible), why: 'the insurer pays the rest' };
  }
  if (dealerMake === m.make && inWarranty(v, m, at)) return { yours: 0, why: 'under the maker’s warranty' };
  return { yours: bill };
}

export function registerCarCare(sim: Simulation, find: (person: Person, id: string) => OwnedVehicle | undefined, model: (v: OwnedVehicle) => CarModel): void {
  sim.onCommand<{ vehicleId: string; shopId: string }, { paid: Money; readyAt: Instant }>('vehicle.service', (p, { sim: s }) => {
    const person = s.player;
    const v = find(person, String(p?.vehicleId));
    if (!v) throw new CommandError('That isn’t a car you own.');
    const m = model(v);
    const no = serviceRefusal(person, v, m, String(p?.shopId), s.now);
    if (no) throw new CommandError(no);
    const shop = CAR_SHOPS.find((x) => x.id === String(p.shopId))!;
    const paid = serviceCost(s, v);
    if (!spend(s, person, paid, `${shop.name}, a service, the ${m.make} ${m.model}`, 'vehicle')) throw new CommandError('The payment didn’t go through.');
    (v.services ??= []).push({ at: s.now, km: odometer(v), shopId: shop.id });
    const readyAt = s.now + Math.round(SERVICE_PRICE[careMarket(v.jurisdiction)]!.hours * 3_600_000);
    v.inShop = { shopId: shop.id, until: readyAt };
    if (person.id === s.universe.playerId) s.notify({ category: 'home', title: 'Serviced', body: `${shop.name} serviced the ${m.make} ${m.model}; it’s ready ${formatDate(readyAt, CITIES.require(shop.cityId).timeZone)}.`, importance: 25, route: '/workspace/vehicles' });
    return { paid, readyAt };
  });
}
