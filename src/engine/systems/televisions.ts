/**
 * SLATE — a television of one's own (from 2026-10-04): the models sold where
 * they live (`content/tvcatalog.ts`), bought at a store's price with the
 * place's tax and brought home, kept as the home's TV with its make, model,
 * size and the power its energy label gives. Watching it draws that power for
 * the time watched (`living.tvKwh`), and the month's electricity bills what's
 * past a typical household's viewing (`content/tvuse.ts`).
 *
 * A TV SLATE sold before as a piece of furniture, with no model, draws the
 * middle of the catalog's labeled sets: SLATE's estimate, never nothing.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Money } from '../core/money';
import { TV_PRODUCTS } from '../content/tvcatalog';
import { GENERIC_TV_WATTS } from '../content/tvuse';
import type { CatalogOffer, CatalogProduct } from '../content/products';
import { homeKeyOf, itemsOf } from './items';
import { buyDevice, deviceCatalog, devicePrice, deviceRefusal, ownedProduct } from './devices';
import { livingOf } from './dwelling';

/** The typical set's draw (`content/tvuse.ts`): what a TV with no model draws. */
export { GENERIC_TV_WATTS };

export const tvProduct = (id: string): CatalogProduct | undefined => TV_PRODUCTS.find((p) => p.id === id);
/** An offer's price where a town is (`devicePrice`). */
export const tvPrice = devicePrice;
/** The sets on sale where they live, an offer each, cheapest first. */
export const tvCatalog = (sim: Simulation, person: Person): { product: CatalogProduct; offer: CatalogOffer; price: Money }[] => deviceCatalog(sim, person, TV_PRODUCTS);
export const buyTvRefusal = (person: Person, offerId: string): string | undefined => deviceRefusal(person, TV_PRODUCTS, offerId, 'A television');

/** The TV at home: its product where it's a model, and the watts it draws on. */
export function tvAtHome(person: Person): { label: string; watts: number | undefined; product?: CatalogProduct } | undefined {
  const home = homeKeyOf(person.home);
  const tv = itemsOf(person).find((i) => i.kind === 'furniture:tv' && i.at.kind === 'home' && i.at.home === home);
  if (!tv) return undefined;
  // Its listing's, or what was kept of it when bought (from 2026-10-05).
  const product = ownedProduct(tv, TV_PRODUCTS);
  const watts = typeof product?.attrs.onModeWatts === 'number' ? product.attrs.onModeWatts : GENERIC_TV_WATTS;
  return { label: tv.label, watts, ...(product ? { product } : {}) };
}

/** What watching for some minutes draws, kilowatt-hours, onto the month's electricity; nothing without a set at home. */
export function watchPower(person: Person, minutes: number): number {
  const tv = tvAtHome(person);
  if (!tv || tv.watts === undefined || minutes <= 0) return 0;
  const kwh = (tv.watts * minutes) / 60 / 1000;
  const l = livingOf(person);
  l.tvKwh = (l.tvKwh ?? 0) + kwh;
  return kwh;
}

export function registerTelevisions(sim: Simulation): void {
  sim.onCommand<{ offerId: string; color?: string }, { paid: Money; itemId: string }>('tv.buy', (p, { sim: s }) => {
    // Kept as the home's TV, what a film or television lover unwinds with (`GEAR_FOR`), named as this market sells it.
    const { paid, item } = buyDevice(s, s.player, TV_PRODUCTS, String(p?.offerId ?? ''), p?.color, 'tv', 'A television', (product, offer) => `${product.brand} ${offer.code ?? product.model}, ${product.attrs.sizeIn}-Inch`);
    return { paid, itemId: item.id };
  });
}
