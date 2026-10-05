/**
 * SLATE — a speaker of one's own (from 2026-10-05): the home speakers,
 * soundbars and pairs sold where they live (`content/audiocatalog.ts`), bought
 * at the seller's price with the place's tax in a color it comes in, and kept
 * as the home's speaker (`furniture:speaker`), what a music lover unwinds with
 * (`GEAR_FOR`), its model and color kept (`systems/devices.ts`).
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Money } from '../core/money';
import { AUDIO_PRODUCTS } from '../content/audiocatalog';
import type { CatalogOffer, CatalogProduct } from '../content/products';
import { buyDevice, deviceCatalog, deviceRefusal } from './devices';

/** The speakers on sale where they live, an offer each, cheapest first. */
export const speakerCatalog = (sim: Simulation, person: Person): { product: CatalogProduct; offer: CatalogOffer; price: Money }[] => deviceCatalog(sim, person, AUDIO_PRODUCTS);
export const buySpeakerRefusal = (person: Person, offerId: string): string | undefined => deviceRefusal(person, AUDIO_PRODUCTS, offerId, 'A speaker');

export function registerSpeakers(sim: Simulation): void {
  sim.onCommand<{ offerId: string; color?: string }, { paid: Money; itemId: string }>('speaker.buy', (p, { sim: s }) => {
    const { paid, item } = buyDevice(s, s.player, AUDIO_PRODUCTS, String(p?.offerId ?? ''), p?.color, 'speaker', 'A speaker', (product, offer) => `${product.brand} ${offer.code ?? product.model}${product.attrs.pair ? ', A Pair' : ''}`);
    return { paid, itemId: item.id };
  });
}
