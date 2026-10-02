/**
 * SLATE — clothes sold on, and running shoes worn down (Stage 3 of
 * `docs/BACKLOG.md`, from 2026-10-02), from
 * `docs/research/world/research-gaps-cars-clothes.json`, read 2026-10-02.
 *
 * **Selling.** Clean garments, not worn out and of a known price, sold where
 * the person lives, at the market's own way of selling:
 * - **Britain and Ireland, Vinted**: an item sells for 72% below its new
 *   price on average (Vinted, 2026), 28% of it, and the seller pays no fee.
 * - **America, a ThredUp Clean Out bag**: an item sells at Vinted's 28%,
 *   SLATE's reading, as ThredUp publishes no average price, and pays the
 *   seller its band's share of that, the middle of each: 9% under $20, 22.5%
 *   under $50, 45% under $100, 70% under $200 and 80% above; nothing sells
 *   under $5. The bag's $14.99 service fee comes off what it earned, and no
 *   further.
 * - **Canada, Kijiji**: second-hand goods sold at half their new price on
 *   average (Kijiji's Second-Hand Economy Index), no fee.
 * - **Mexico**: the tianguis' prices are a buyer's, from MX$10 a piece, and
 *   no source relates them to a new price, so none is sold.
 * Paid when listed: no platform publishes how long an item takes to sell.
 *
 * **Running shoes.** ASICS and Brooks both say to replace them after 300 to
 * 500 miles. A run is an hour at a ten-minute mile, six miles, SLATE's
 * estimate, and the sneakers take its share of 400 miles' wear; worn out,
 * they're replaced with the cheapest pair, as every garment is
 * (`replaceWornOut`). Until 2026-10-02 shoes never wore out.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { itemsOf, reachable, type Item } from './items';
import { garmentsOf, type Garment } from './wardrobe';
import { forget, marketOf } from './clothing';

export const VINTED_SHARE = 0.28;
export const KIJIJI_SHARE = 0.5;
/** ThredUp's payout bands, by the item's selling price in dollars: up to, and the share paid. */
export const THREDUP_BANDS: readonly [number, number][] = [[5, 0], [20, 0.09], [50, 0.225], [100, 0.45], [200, 0.7], [Infinity, 0.8]];
export const THREDUP_FEE_USD = 14.99;

export const RUN_MILES = 6;
export const SHOE_MILES = 400;

type Garb = Item & { garment: Garment };

/** Why a garment can't be sold, or nothing. */
export function sellRefusal(sim: Simulation, person: Person, g: Garb | undefined): string | undefined {
  if (!g) return 'That isn’t yours to sell.';
  if (g.garment.dirty || g.condition <= 0) return 'Only clean clothes that aren’t worn out sell.';
  if (!g.paid) return 'Its price new isn’t known, so it isn’t sold.';
  if (!reachable(sim, person, g.at)) return 'It isn’t to hand.';
  if (person.wornNow?.itemIds.includes(g.id)) return 'You’re wearing it.';
  const market = marketOf(person.home?.cityId ?? person.currentLocationId);
  if (!market || market === 'MX') return 'No source gives what clothes sell for here.';
  return undefined;
}

const usdOf = (sim: Simulation, cents: Money): number => { const cur = saveCurrency(sim.universe); return (cur === 'USD' ? cents : exchange(cents, cur, 'USD') ?? cents) / 100; };
const fromUsd = (sim: Simulation, usd: number): Money => { const c = Math.round(usd * 100); const cur = saveCurrency(sim.universe); return cur === 'USD' ? c : exchange(c, 'USD', cur) ?? c; };

/** What a set of garments brings, in the save's money, at the market's way of selling. */
export function resaleOf(sim: Simulation, person: Person, items: readonly Garb[]): { paid: Money; basis: string } {
  const market = marketOf(person.home?.cityId ?? person.currentLocationId);
  if (market === 'CA') return { paid: items.reduce((a, g) => a + Math.round(g.paid! * KIJIJI_SHARE), 0), basis: 'Kijiji: half the new price' };
  if (market === 'US') {
    const earned = items.reduce((a, g) => {
      const sells = usdOf(sim, g.paid!) * VINTED_SHARE;
      return a + sells * THREDUP_BANDS.find(([upTo]) => sells < upTo)![1];
    }, 0);
    return { paid: Math.max(0, fromUsd(sim, earned - THREDUP_FEE_USD)), basis: 'A ThredUp Clean Out bag: its band of each sale, less the $14.99 fee' };
  }
  return { paid: items.reduce((a, g) => a + Math.round(g.paid! * VINTED_SHARE), 0), basis: 'Vinted: 28% of the new price, no seller’s fee' };
}

export function sellClothes(sim: Simulation, person: Person, itemIds: readonly string[]): Money {
  const items = itemIds.map((id) => garmentsOf(person).find((g) => g.id === id));
  for (const g of items) { const no = sellRefusal(sim, person, g); if (no) throw new CommandError(no); }
  if (items.length === 0) throw new CommandError('Choose what to sell.');
  const { paid, basis } = resaleOf(sim, person, items as Garb[]);
  const gone = new Set(itemIds);
  person.items = itemsOf(person).filter((i) => !gone.has(i.id));
  forget(person, gone);
  if (paid > 0) sim.post({ memo: `Clothes sold. ${basis}`, category: 'clothing', postings: [{ accountId: person.primaryAccountId!, amount: paid }, { accountId: sim.nominalAccount('income', 'Things Sold').id, amount: -paid }] });
  return paid;
}

/** A run's wear on the sneakers: the pair to hand, the least worn. */
export function runInShoes(sim: Simulation, person: Person): void {
  const pair = garmentsOf(person).filter((g) => g.garment.slot === 'shoes' && g.condition > 0 && /sneaker|trainer|running/i.test(g.label) && reachable(sim, person, g.at)).sort((a, b) => b.condition - a.condition)[0];
  if (pair) pair.condition = Math.max(0, pair.condition - RUN_MILES / SHOE_MILES);
}

export function registerResale(sim: Simulation): void {
  sim.onCommand<{ itemIds: string[] }, { paid: Money }>('clothes.sell', (p, { sim: s }) => ({ paid: sellClothes(s, s.player, Array.isArray(p?.itemIds) ? p.itemIds.map(String) : []) }));
}
