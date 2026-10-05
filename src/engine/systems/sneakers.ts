/**
 * SLATE — Air Jordans, bought at retail or on resale, and sold on (the
 * master plan's §26 and §20, from 2026-10-02; the figures in
 * `content/sneakers.ts`).
 *
 * One sneaker, by its style code, has several offers: each retailer's in the
 * market where you live, at its price on the day read with the place's sales
 * tax where it isn't in the price, and in America GOAT's, a new pair at its
 * cheapest new ask and a used pair at its cheapest used ask, with GOAT's
 * $14.95 standard shipping and the sales tax where it's sent. Each is a real
 * offer, and the pair bought keeps its style code, size and whether it was
 * new. A retail pair read as sold out before release can't be bought.
 *
 * A pair is sold on GOAT from America: at its ask, new if unworn and bought
 * new, used otherwise, less GOAT's 9.5% commission at a seller rating of 90
 * (every seller starts there), the $5 prepaid label, and its 2.9% fee to
 * cash out. GOAT doesn't buy or sell for the other four markets in dollars
 * SLATE could read, so it's offered in America only.
 *
 * Not kept: StockX, which refused the reads; a retailer's delivery fee and
 * days, which the research didn't read, so a retail pair arrives in five
 * working days, SLATE's estimate, and its delivery isn't charged and says so.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, dayHasCome, formatDay } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { GOAT_ASKS, SNEAKERS, SNEAKER_RETAIL, type Sneaker } from '../content/sneakers';
import { inSaveMoney } from './banking';
import { spend } from './household';
import { homeKeyOf, itemById, reachable, type Item } from './items';
import { placeOrder } from './orders';
import { clothingTax, marketOf } from './clothing';

/** GOAT's published terms (research-sneakers.json, read 2026-10-02). */
export const GOAT = { commission: 0.095, prepaidLabel: 5, cashOut: 0.029, buyerShipping: 14.95 } as const;
/** A retail pair's days on the way: SLATE's estimate, the retailers' not having been read. */
export const RETAIL_WORKING_DAYS = 5;
/** US men's sizes where a retailer's list wasn't read. */
export const US_SIZES = ['7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '13', '14'];

export const sneakerById = (styleCode: string): Sneaker | undefined => SNEAKERS.find((s) => s.styleCode === styleCode);

/**
 * Whether a pair is out by now: offered from its release date, at retail and on GOAT alike (from 2026-10-05). A life
 * begins on 5 January 2026, and until then 26 of the 30 pairs, released later that year, were offered from its first
 * day. One whose date wasn't read is taken as out.
 */
export const sneakerOut = (sim: Simulation, s: Sneaker): boolean => !s.released || dayHasCome(s.released, sim.now, sim.homeZone);

export interface Offer { key: string; seller: string; condition: 'new' | 'used'; price: Money; shipping: Money | null; total: Money; sizes: readonly string[]; soldOut: boolean; basis: string }

/** The offers for a pair where a person lives, cheapest first. */
export function sneakerOffers(sim: Simulation, person: Person, styleCode: string): Offer[] {
  const s = sneakerById(styleCode);
  if (s && !sneakerOut(sim, s)) return [];
  const cityId = person.home?.cityId ?? person.currentLocationId;
  const market = marketOf(cityId);
  const out: Offer[] = [];
  SNEAKER_RETAIL.forEach((o, i) => {
    if (o.styleCode !== styleCode || o.market !== market) return;
    const tax = clothingTax(cityId, sim.now, { price: o.price, taxIncluded: o.taxIncluded });
    const price = inSaveMoney(sim, Math.round((o.price + tax) * 100), o.currency);
    out.push({ key: `retail:${i}`, seller: o.retailer, condition: 'new', price, shipping: null, total: price, sizes: o.sizes ?? US_SIZES, soldOut: o.soldOut, basis: o.taxIncluded ? 'its price, tax in' : 'its price and the sales tax here' });
  });
  const ask = GOAT_ASKS.find((a) => a.styleCode === styleCode);
  if (ask && market === 'US') {
    const ship = inSaveMoney(sim, Math.round(GOAT.buyerShipping * 100), 'USD');
    for (const [condition, usd] of [['new', ask.newAsk], ['used', ask.usedAsk]] as const) {
      if (usd === null) continue;
      const tax = clothingTax(cityId, sim.now, { price: usd, taxIncluded: false });
      const price = inSaveMoney(sim, Math.round((usd + tax) * 100), 'USD');
      out.push({ key: `goat:${condition}`, seller: 'GOAT', condition, price, shipping: ship, total: price + ship, sizes: US_SIZES, soldOut: false, basis: `its cheapest ${condition} ask, the sales tax here and $14.95 shipping` });
    }
  }
  return out.sort((a, b) => a.total - b.total);
}

/** Why a pair can't be bought so, or nothing. */
export function sneakerRefusal(sim: Simulation, person: Person, styleCode: string, key: string, size: string): string | undefined {
  const s = sneakerById(styleCode);
  if (!s) return 'That isn’t a sneaker SLATE keeps.';
  if (!sneakerOut(sim, s)) return `The ${s.name} isn’t out until ${formatDay(s.released!)}.`;
  if (!person.home || person.home.kind === 'sofa') return 'A pair needs a home to be sent to.';
  const offer = sneakerOffers(sim, person, styleCode).find((o) => o.key === key);
  if (!offer) return 'That offer isn’t open where you live.';
  if (offer.soldOut) return `${offer.seller} was sold out of it.`;
  if (!offer.sizes.includes(size)) return 'Choose one of its sizes.';
  return undefined;
}

/** A pair bought: paid, and on its way. Its order. */
export function buySneakers(sim: Simulation, person: Person, styleCode: string, key: string, size: string): string {
  const no = sneakerRefusal(sim, person, styleCode, key, size);
  if (no) throw new CommandError(no);
  const s = sneakerById(styleCode)!;
  const offer = sneakerOffers(sim, person, styleCode).find((o) => o.key === key)!;
  if (!spend(sim, person, offer.total, `${offer.seller}: ${s.name}, ${offer.condition}`, 'clothing')) throw new CommandError(`It comes to ${formatMoney(offer.total, saveCurrency(sim.universe))}, more than you can pay.`);
  const days = Math.ceil((RETAIL_WORKING_DAYS * 7) / 5);
  const order = placeOrder(sim, person, { from: offer.seller, arrivesAt: sim.now + days * MS_DAY, to: { kind: 'home', home: homeKeyOf(person.home)!, spot: 'wardrobe' }, paid: offer.total }, [{
    kind: `sneaker:${styleCode}`, label: s.name, quantity: 1, condition: 1, paid: offer.price,
    spec: { styleCode, size, bought: offer.condition },
    garment: { kind: 'shoes', slot: 'shoes', care: 'hand', wears: offer.condition === 'used' ? 1 : 0, washes: 0 },
  }]);
  return order.id;
}

/** What GOAT pays for a pair: its ask less the commission, the label and the cash-out fee; or why it won't sell. */
export function goatPayout(sim: Simulation, person: Person, item: Item | undefined): { paid: Money; ask: number; condition: 'new' | 'used' } | string {
  const code = item?.spec?.styleCode;
  if (!item || !code) return 'That isn’t a pair SLATE can sell on.';
  if (marketOf(person.home?.cityId ?? person.currentLocationId) !== 'US') return 'GOAT buys from sellers in America here.';
  if (!reachable(sim, person, item.at)) return 'It isn’t to hand.';
  if (person.wornNow?.itemIds.includes(item.id)) return 'You’re wearing it.';
  const condition = item.spec?.bought === 'new' && (item.garment?.wears ?? 0) === 0 ? 'new' : 'used';
  const ask = GOAT_ASKS.find((a) => a.styleCode === code)?.[condition === 'new' ? 'newAsk' : 'usedAsk'];
  if (ask === null || ask === undefined) return `GOAT has no ${condition} ask for it.`;
  const usd = (ask * (1 - GOAT.commission) - GOAT.prepaidLabel) * (1 - GOAT.cashOut);
  return { paid: inSaveMoney(sim, Math.max(0, Math.round(usd * 100)), 'USD'), ask, condition };
}

export function registerSneakers(sim: Simulation): void {
  sim.onCommand<{ styleCode: string; offer: string; size: string }, { orderId: string }>('sneakers.buy', (p, { sim: s }) => ({ orderId: buySneakers(s, s.player, String(p?.styleCode), String(p?.offer), String(p?.size)) }));
  sim.onCommand<{ itemId: string }, { paid: Money }>('sneakers.sell', (p, { sim: s }) => {
    const person = s.player;
    const item = itemById(person, String(p?.itemId));
    const q = goatPayout(s, person, item);
    if (typeof q === 'string') throw new CommandError(q);
    person.items = (person.items ?? []).filter((i) => i.id !== item!.id);
    if (person.dressed) person.dressed = person.dressed.filter((id) => id !== item!.id);
    s.post({ memo: `GOAT: ${item!.label}, sold ${q.condition}`, category: 'clothing', postings: [{ accountId: person.primaryAccountId!, amount: q.paid }, { accountId: s.nominalAccount('income', 'Things Sold').id, amount: -q.paid }] });
    return { paid: q.paid };
  });
}
