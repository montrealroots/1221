/**
 * SLATE — a computer of one's own (from 2026-10-05): the laptops, desktops,
 * mini PCs, all-in-ones and tablets sold where they live
 * (`content/computercatalog.ts`), bought at the seller's price with the
 * place's tax and kept at the home, its model kept (`systems/devices.ts`).
 *
 * What reads it: a games lover unwinds with games at home on a console or,
 * from 2026-10-05, on a computer or tablet of their own (`lovedIn` in
 * `systems/enjoyment.ts`). Every one sold now runs games: integrated graphics,
 * Apple's M chips and tablets play a great many titles. Until the owner's
 * correction of 2026-10-05 only a computer with a graphics card of its own
 * counted, which no game's requirements said; SLATE keeps no titles with
 * requirements yet, so none is asked of. The graphics (`graphicsOf`) are kept,
 * shown and compared, for when titles' requirements are.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Money } from '../core/money';
import { COMPUTER_PRODUCTS } from '../content/computercatalog';
import type { CatalogOffer, CatalogProduct } from '../content/products';
import { buyDevice, deviceCatalog, deviceRefusal, ownedProduct } from './devices';
import { homeKeyOf, type Item } from './items';

export { COMPUTER_PRODUCTS };
export const computerProduct = (id: unknown): CatalogProduct | undefined => COMPUTER_PRODUCTS.find((p) => p.id === id);
export const computerCatalog = (sim: Simulation, person: Person): { product: CatalogProduct; offer: CatalogOffer; price: Money }[] => deviceCatalog(sim, person, COMPUTER_PRODUCTS);
export const computerRefusal = (person: Person, offerId: string): string | undefined => deviceRefusal(person, COMPUTER_PRODUCTS, offerId, 'A computer');

/** A computer's graphics: a card of its own, or the processor's. */
export const graphicsOf = (p: CatalogProduct): 'discrete' | 'integrated' => (p.attrs.discrete === true ? 'discrete' : 'integrated');

/** Whether a home has a computer or tablet to play games on: any of them (from 2026-10-05). */
export function computerForGames(person: Partial<Pick<Person, 'items' | 'home'>>): boolean {
  const home = homeKeyOf(person.home);
  return (person.items ?? []).some((i: Item) => i.kind === 'furniture:computer' && i.at.kind === 'home' && i.at.home === home && ownedProduct(i, COMPUTER_PRODUCTS) !== undefined);
}

export function registerComputers(sim: Simulation): void {
  sim.onCommand<{ offerId: string; color?: string }, { paid: Money; itemId: string }>('computer.buy', (p, { sim: s }) => {
    const { paid, item } = buyDevice(s, s.player, COMPUTER_PRODUCTS, String(p?.offerId ?? ''), p?.color, 'computer', 'A computer', (product) => `${product.brand} ${product.model}`);
    return { paid, itemId: item.id };
  });
}
