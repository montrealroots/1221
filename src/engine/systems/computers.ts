/**
 * SLATE — a computer of one's own (from 2026-10-05): the laptops, desktops,
 * mini PCs, all-in-ones and tablets sold where they live
 * (`content/computercatalog.ts`), bought at the seller's price with the
 * place's tax and kept at the home, its model kept (`systems/devices.ts`).
 *
 * What reads it: a games lover unwinds with games at home on a console, or,
 * from 2026-10-05, on a computer whose graphics are a card of their own, as
 * PC gaming is played (`lovedIn` in `systems/enjoyment.ts`). A computer with
 * the processor's own graphics doesn't count, SLATE's line: a seller's
 * specification names no game it plays.
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

/** Whether a home has a computer with a graphics card of its own. */
export function gamingComputer(person: Partial<Pick<Person, 'items' | 'home'>>): boolean {
  const home = homeKeyOf(person.home);
  return (person.items ?? []).some((i: Item) => i.kind === 'furniture:computer' && i.at.kind === 'home' && i.at.home === home && ownedProduct(i, COMPUTER_PRODUCTS)?.attrs.discrete === true);
}

export function registerComputers(sim: Simulation): void {
  sim.onCommand<{ offerId: string; color?: string }, { paid: Money; itemId: string }>('computer.buy', (p, { sim: s }) => {
    const { paid, item } = buyDevice(s, s.player, COMPUTER_PRODUCTS, String(p?.offerId ?? ''), p?.color, 'computer', 'A computer', (product) => `${product.brand} ${product.model}`);
    return { paid, itemId: item.id };
  });
}
