/**
 * SLATE — what a thing you own can be found by (the master plan's §32b,
 * from 2026-10-02): its kind, its color and size where it was bought in
 * one, its condition, and for clothes whether it's clean, worn or drying.
 * Belongings filters by these.
 */

import type { Instant } from '../core/time';
import type { Slot } from '../content/garmentcare';
import type { Item } from './items';

export interface ItemFacets { kind: string; color?: string; size?: string; condition: string; state?: string }

const SLOT_KIND: Readonly<Record<Slot, string>> = {
  top: 'Tops', bottom: 'Bottoms', dress: 'Dresses', suit: 'Suits', outer: 'Coats And Jackets', underwear: 'Underwear', base: 'Base Layers', socks: 'Socks',
  shoes: 'Shoes', sleep: 'Sleepwear', active: 'Activewear', accessory: 'Accessories', towel: 'Towels',
};

/** A condition's band: good from three-quarters, worn from two-fifths, worn out below. */
export const CONDITION_BANDS = { good: 0.75, worn: 0.4 } as const;

export function facetsOf(item: Item, now: Instant): ItemFacets {
  const kind = item.garment ? SLOT_KIND[item.garment.slot] ?? 'Clothes'
    : item.food ? 'Food'
      : item.supply ? 'Bathroom And Cleaning'
        : item.device ? 'Phones'
          : item.bulky ? 'Furniture'
            : item.holdsL ? 'Bags'
              : 'Other';
  const condition = item.condition >= CONDITION_BANDS.good ? 'Good' : item.condition >= CONDITION_BANDS.worn ? 'Worn' : 'Worn Out';
  const state = item.garment ? (item.garment.dirty ? 'To Wash' : item.garment.dryUntil !== undefined && item.garment.dryUntil > now ? 'Drying' : 'Clean') : undefined;
  return { kind, ...(item.spec?.color ? { color: item.spec.color } : {}), ...(item.spec?.size ? { size: item.spec.size } : {}), condition, ...(state ? { state } : {}) };
}

export type FacetFilter = Partial<Record<keyof ItemFacets, string>> & { words?: string };

/** Whether a thing passes a filter: every facet chosen matches, and its words, if any, are in its label. */
export function passes(item: Item, filter: FacetFilter, now: Instant): boolean {
  const f = facetsOf(item, now);
  for (const key of ['kind', 'color', 'size', 'condition', 'state'] as const) if (filter[key] && f[key] !== filter[key]) return false;
  return !filter.words || item.label.toLowerCase().includes(filter.words.trim().toLowerCase());
}
