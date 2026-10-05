/**
 * SLATE — a lawn mower of one's own (from 2026-10-05): the models sold where
 * they live (`content/gardencatalog.ts`), bought at the seller's price with
 * the place's tax and kept at the home, and what mowing asks of one.
 *
 * Mow The Lawn (`systems/lawns.ts`) needs a mower that's pushed: a reel, a
 * corded, a battery or a petrol one, at the home. Until 2026-10-05 a lawn was
 * mown by hand with nothing. A corded mower draws its maker's watts (or its
 * amps at the mains' 120 volts) for the mowing's 1.9 hours onto the month's
 * electricity; a battery one a full charge of its battery, its volts times
 * its amp-hours, SLATE's reading of a mowing; a reel nothing. A petrol mower's
 * fuel isn't kept, no maker's use an hour being read.
 *
 * A robot mower keeps the lawn at its height through the growing season, as
 * a gardener would, where its rated lawn is at least the home's: the lot less
 * the house's floor, SLATE's reading of a yard's lawn. Its power isn't
 * billed, no maker's use being read.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Money } from '../core/money';
import { GARDEN_PRODUCTS } from '../content/gardencatalog';
import type { CatalogOffer, CatalogProduct } from '../content/products';
import { buyDevice, deviceCatalog, deviceRefusal } from './devices';
import { homeKeyOf, itemsOf, type Item } from './items';
import type { OwnedHome } from './homes';

export { GARDEN_PRODUCTS };
const SQFT_M2 = 0.09290304;
/** The hours a mowing takes (`MOW_MINUTES` in `systems/lawns.ts`, ATUS 2025's 1.9). */
const MOW_HOURS = 1.9;

export const mowerProduct = (id: string | undefined): CatalogProduct | undefined => GARDEN_PRODUCTS.find((p) => p.id === id);
export const mowerCatalog = (sim: Simulation, person: Person): { product: CatalogProduct; offer: CatalogOffer; price: Money }[] => deviceCatalog(sim, person, GARDEN_PRODUCTS);
export const mowerRefusal = (person: Person, offerId: string): string | undefined => deviceRefusal(person, GARDEN_PRODUCTS, offerId, 'A mower');

/** The mowers at a home: each item with its model. */
export function mowersAt(person: Person, homeKey: string | undefined): { item: Item; product: CatalogProduct }[] {
  if (!homeKey) return [];
  return itemsOf(person).filter((i) => i.kind === 'furniture:mower' && i.at.kind === 'home' && i.at.home === homeKey)
    .map((item) => ({ item, product: mowerProduct(item.spec?.product)! })).filter((x) => x.product);
}

/** The mower they'd push at the home they're in: the first that isn't a robot. */
export const handMower = (person: Person): { item: Item; product: CatalogProduct } | undefined => mowersAt(person, homeKeyOf(person.home)).find((m) => m.product.attrs.kind !== 'robot');

/** A yard's lawn, square meters: the lot less the house's floor, SLATE's reading; none without a lot. */
export function lawnM2(owned: OwnedHome): number | undefined {
  const lot = owned.facts.lot;
  return lot === undefined ? undefined : Math.max(0, (lot - owned.facts.size) * SQFT_M2);
}

/** A robot at that home rated for its lawn. */
export function robotFor(person: Person, owned: OwnedHome): CatalogProduct | undefined {
  const lawn = lawnM2(owned);
  if (lawn === undefined) return undefined;
  return mowersAt(person, `owned:${owned.id}`).map((m) => m.product).find((p) => p.attrs.kind === 'robot' && Number(p.attrs.robotM2) >= lawn);
}

/** What a mowing draws, kWh: a corded mower's watts for its hours, a battery's charge, nothing else. */
export function mowKwh(product: CatalogProduct): number {
  const a = product.attrs;
  if (a.kind === 'corded' && typeof a.watts === 'number') return (a.watts * MOW_HOURS) / 1000;
  if (a.kind === 'battery' && typeof a.volts === 'number' && typeof a.ampHours === 'number') return (a.volts * a.ampHours) / 1000;
  return 0;
}

export function registerMowers(sim: Simulation): void {
  sim.onCommand<{ offerId: string; color?: string }, { paid: Money; itemId: string }>('garden.buy_mower', (p, { sim: s }) => {
    const { paid, item } = buyDevice(s, s.player, GARDEN_PRODUCTS, String(p?.offerId ?? ''), p?.color, 'mower', 'A mower', (product) => `${product.brand} ${product.model}`);
    return { paid, itemId: item.id };
  });
}
