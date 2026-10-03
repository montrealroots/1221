/**
 * SLATE — a car sold: to a dealer now, or listed to sell privately (the
 * master plan's "Still Open", from 2026-10-03;
 * `docs/research/world/research-car-sale.json`, and KBB's worked example in
 * `research-gaps-cars-clothes.json`). Until then a car sold went at once for
 * its full value, a private buyer's price with a dealer's speed.
 *
 * **A dealer** buys it where it is, today, for less than a private buyer
 * pays. In Britain, Autotrader (citing the Money Advice Service) says a
 * private sale is often 10 to 15% more, so a dealer gives the value over
 * 1.125. In America KBB publishes no gap, only each car's values, and its
 * one worked example read (a 2014 Forester in good condition) puts the trade-in
 * $3,815 under the private-party price, its dealer's reconditioning and
 * costs, which SLATE takes as a dealer's fixed cost, never less than that
 * example's 45% of the value. Canada, Ireland and Mexico publish no gap, and
 * Britain's is SLATE's estimate there.
 *
 * **Listed privately** on the market's own site, at its fee: Craigslist's $5
 * in America, AutoTrader.ca free in Canada, Autotrader UK's basic advert by
 * the car's price in Britain (£9.95 under £1,000, £36.95 to £10,000, £39.95
 * over, read secondhand), Facebook Marketplace free in Ireland and Mercado
 * Libre free in Mexico (both read secondhand). It sells for its value in
 * about 30 days, AutoTrader.ca's average private sale and the only one any
 * publisher gives, SLATE's estimate elsewhere. The buyer comes to see it,
 * so it's sold when they're in its town; away, the sale waits a day at a
 * time. Taken down, the fee isn't given back. Sold to a dealer meanwhile,
 * the listing ends.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { modelById, sellRefusal, sellVehicle, valueOf, vehiclesOf, type OwnedVehicle } from './vehicles';
import { payFromBank } from './household';
import { stolenNow } from './theft';

export interface Listing { platform: string; sellsAt: Instant }

export const PRIVATE_SALE_KIND = 'vehicle.private_sale';
/** Days a private listing takes to sell: AutoTrader.ca's average. */
export const PRIVATE_DAYS = 30;
/** Britain's private premium over a dealer, the middle of Autotrader's 10 to 15%. */
export const PRIVATE_PREMIUM = 1.125;
/** KBB's one worked example: its trade-in under its private-party value, and their ratio. */
export const KBB_EXAMPLE = { gapUsd: 6970 - 3155, ratio: 3155 / 6970 } as const;

interface Platform { name: string; currency: string; fee: (value: number) => number; confirmed: boolean }
export const PLATFORMS: Readonly<Record<string, Platform>> = {
  us: { name: 'Craigslist', currency: 'USD', fee: () => 5, confirmed: true },
  ca: { name: 'AutoTrader.ca', currency: 'CAD', fee: () => 0, confirmed: true },
  uk: { name: 'Autotrader', currency: 'GBP', fee: (value) => (value <= 1000 ? 9.95 : value <= 10_000 ? 36.95 : 39.95), confirmed: false },
  ie: { name: 'Facebook Marketplace', currency: 'EUR', fee: () => 0, confirmed: false },
  mx: { name: 'Mercado Libre', currency: 'MXN', fee: () => 0, confirmed: false },
};

const where = (v: OwnedVehicle): string => v.at ?? v.cityId;
const countryOf = (v: OwnedVehicle): string => CITIES.get(where(v))?.countryId ?? '';
const toSave = (sim: Simulation, cents: Money, from: string): Money => { const cur = saveCurrency(sim.universe); return cur === from ? cents : exchange(cents, from, cur) ?? cents; };

/** What a private buyer pays: its value, in the save's money. */
export const privateValue = (sim: Simulation, v: OwnedVehicle): Money => toSave(sim, valueOf(v, sim.now), modelById(v.modelId)!.currency);

/** What a dealer pays today, in the save's money. */
export function dealerOffer(sim: Simulation, v: OwnedVehicle): Money {
  const currency = modelById(v.modelId)!.currency;
  const value = valueOf(v, sim.now);
  if (countryOf(v) === 'us') {
    const gap = currency === 'USD' ? KBB_EXAMPLE.gapUsd * 100 : exchange(KBB_EXAMPLE.gapUsd * 100, 'USD', currency) ?? KBB_EXAMPLE.gapUsd * 100;
    return toSave(sim, Math.round(Math.max(value * KBB_EXAMPLE.ratio, value - gap)), currency);
  }
  return toSave(sim, Math.round(value / PRIVATE_PREMIUM), currency);
}

/** The listing's fee where the car is, in the save's money, and the site. */
export function listingQuote(sim: Simulation, v: OwnedVehicle): { platform: string; fee: Money; confirmed: boolean } | undefined {
  const p = PLATFORMS[countryOf(v)];
  if (!p) return undefined;
  const local = exchange(privateValue(sim, v), saveCurrency(sim.universe), p.currency) ?? privateValue(sim, v);
  return { platform: p.name, fee: toSave(sim, Math.round(p.fee(local / 100) * 100), p.currency), confirmed: p.confirmed };
}

/** Whether it can be sold here and now, to a dealer or by a listing. */
export function saleRefusal(sim: Simulation, person: Person, vehicleId: string): string | undefined {
  const no = sellRefusal(sim, person, vehicleId);
  if (no) return no;
  const v = vehiclesOf(person).find((x) => x.id === vehicleId)!;
  if (person.currentLocationId !== where(v)) return `It’s sold where it is, in ${CITIES.get(where(v))?.name ?? 'its town'}.`;
  return undefined;
}

export function listRefusal(sim: Simulation, person: Person, vehicleId: string): string | undefined {
  const no = saleRefusal(sim, person, vehicleId);
  if (no) return no;
  const v = vehiclesOf(person).find((x) => x.id === vehicleId)!;
  if (v.listed) return `It’s listed on ${v.listed.platform}.`;
  if (!listingQuote(sim, v)) return 'No site’s terms for selling a car here were read.';
  return undefined;
}

const nameOf = (v: OwnedVehicle) => { const m = modelById(v.modelId)!; return `${m.make} ${m.model}`; };

export function registerCarSale(sim: Simulation): void {
  sim.onCommand<{ vehicleId: string }, { value: Money }>('vehicle.sell', (p, { sim: s }) => {
    const person = s.player;
    const no = saleRefusal(s, person, String(p?.vehicleId));
    if (no) throw new CommandError(no);
    const v = vehiclesOf(person).find((x) => x.id === p.vehicleId)!;
    return { value: sellVehicle(s, person, v, dealerOffer(s, v), `Sold the ${nameOf(v)} to a dealer`) };
  });
  sim.onCommand<{ vehicleId: string }, Listing & { fee: Money }>('vehicle.list', (p, { sim: s }) => {
    const person = s.player;
    const no = listRefusal(s, person, String(p?.vehicleId));
    if (no) throw new CommandError(no);
    const v = vehiclesOf(person).find((x) => x.id === p.vehicleId)!;
    const q = listingQuote(s, v)!;
    if (q.fee > 0 && !payFromBank(s, person, q.fee, `${q.platform}, the ${nameOf(v)} listed`, 'vehicle')) throw new CommandError(`${formatMoney(q.fee, saveCurrency(s.universe))} is more than the bank can cover.`);
    v.listed = { platform: q.platform, sellsAt: s.now + PRIVATE_DAYS * MS_DAY };
    s.schedule({ at: v.listed.sellsAt, kind: PRIVATE_SALE_KIND, label: `A Buyer For The ${nameOf(v)}`, category: 'vehicle', priority: 40, payload: { personId: person.id, vehicleId: v.id } });
    return { ...v.listed, fee: q.fee };
  });
  sim.onCommand<{ vehicleId: string }, { ended: true }>('vehicle.unlist', (p, { sim: s }) => {
    const v = vehiclesOf(s.player).find((x) => x.id === p?.vehicleId && x.soldAt === undefined);
    if (!v?.listed) throw new CommandError('It isn’t listed.');
    delete v.listed;
    for (const one of s.universe.scheduled) if (one.status === 'pending' && one.kind === PRIVATE_SALE_KIND && one.payload.vehicleId === v.id) s.timeline.cancel(one.id, s.now);
    return { ended: true };
  });
  sim.onSchedule(PRIVATE_SALE_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const v = person ? vehiclesOf(person).find((x) => x.id === item.payload.vehicleId && x.soldAt === undefined) : undefined;
    if (!person || !v?.listed) return;
    // Taken back by the lender or stolen, the listing lapses.
    if (v.repossessed || stolenNow(v, s.now)) { delete v.listed; return; }
    // The buyer comes to see it: away, the sale waits.
    if (person.currentLocationId !== where(v)) { s.schedule({ at: s.now + MS_DAY, kind: PRIVATE_SALE_KIND, label: item.label, category: 'vehicle', priority: 40, payload: item.payload }); return; }
    const platform = v.listed.platform;
    const got = sellVehicle(s, person, v, privateValue(s, v), `Sold the ${nameOf(v)} privately`);
    if (person.id === s.universe.playerId) s.notify({ category: 'money', title: 'Your Car Sold', body: `A buyer from ${platform} bought the ${nameOf(v)}: ${formatMoney(got, saveCurrency(s.universe))} to you after any loan.`, importance: 50, route: '/workspace/vehicles' });
  });
}
