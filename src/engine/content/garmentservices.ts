/**
 * SLATE — what a dry cleaner charges, by town (Stage 3 of `docs/BACKLOG.md`,
 * from 2026-10-01), from the price lists read for
 * `docs/research/world/research-clothing-services.json`. Each town's figures
 * are one shop's list where a whole list was published, in the town's own
 * money: most are starting prices ("from", "and up"), kept as the price.
 *
 * Where a town's shop listed no figure for a class, the figure is another
 * town's in the same country, and `estimated` names the classes that are.
 * A town with no list of its own is priced at New York's list at its cost of
 * living (`atTown`), SLATE's estimate.
 *
 * How long a dry cleaner keeps a garment: none of the lists read gave a
 * turnaround, so SLATE takes two days, its estimate.
 */

/** The classes a dry cleaner prices by. */
export type CleanClass = 'shirt' | 'trousers' | 'suit' | 'dress' | 'coat';

export interface DryCleaner {
  /** The shop whose list it is. */
  shop: string;
  currency: string;
  price: Readonly<Record<CleanClass, number>>;
  /** Classes the shop didn't list, priced from another town's in the country. */
  estimated?: readonly CleanClass[];
  source: string;
}

export const DRY_CLEANERS: Readonly<Record<string, DryCleaner>> = {
  'us-ny-newyork': {
    shop: 'Morris Cleaners', currency: 'USD', price: { shirt: 3.9, trousers: 9.5, suit: 19, dress: 17, coat: 29.2 }, estimated: ['coat'],
    source: 'morriscleaners.com/pricing, read 2026-10-01; the coat Laundry Breeze’s, Los Angeles',
  },
  'us-ca-losangeles': {
    shop: 'Laundry Breeze', currency: 'USD', price: { shirt: 4.2, trousers: 10, suit: 20, dress: 18.4, coat: 29.2 },
    source: 'Laundry Breeze, 1661 S Robertson Blvd, price list read 2026-10-01',
  },
  'us-ct-newhaven': {
    shop: 'Neighborhood Laundromat, East Haven', currency: 'USD', price: { shirt: 2.75, trousers: 9.5, suit: 19, dress: 9.5, coat: 29.2 }, estimated: ['trousers', 'suit', 'coat'],
    source: 'Neighborhood Laundromat, 690 Main St, East Haven, read 2026-10-01; the rest New York’s and Los Angeles’s',
  },
  'uk-eng-london': {
    shop: 'Burlingtons', currency: 'GBP', price: { shirt: 2.5, trousers: 5.99, suit: 11.99, dress: 11.99, coat: 14.99 },
    source: 'Burlingtons, Kensington and Marylebone, price list read 2026-10-01',
  },
  'ie-lei-dublin': {
    shop: 'Laundrie', currency: 'EUR', price: { shirt: 6.5, trousers: 10.95, suit: 22.5, dress: 15.95, coat: 18.95 },
    source: 'Laundrie, Dublin, price list read 2026-10-01',
  },
  'ca-on-toronto': {
    shop: 'Exclusive Dry Cleaners', currency: 'CAD', price: { shirt: 3.99, trousers: 7.49, suit: 12.99, dress: 15.99, coat: 38.7 }, estimated: ['coat'],
    source: 'Exclusive Dry Cleaners, Toronto, read 2026-10-01; the coat NextLevel’s, Vancouver',
  },
  'ca-bc-vancouver': {
    shop: 'NextLevel Dry Cleaners', currency: 'CAD', price: { shirt: 9.3, trousers: 18.7, suit: 42.1, dress: 27.25, coat: 38.7 },
    source: 'NextLevel Dry Cleaners, Metro Vancouver, read 2026-10-01',
  },
  'mx-cmx-mexicocity': {
    shop: 'DryClean México', currency: 'MXN', price: { shirt: 59, trousers: 59, suit: 120, dress: 85, coat: 70 },
    source: 'DryClean México, Rosarinos 14, Álvaro Obregón, read 2026-10-01',
  },
};

/** The list a town without its own is priced from, at its cost of living. */
export const DRY_CLEANER_BASE = 'us-ny-newyork';

/** Days a dry cleaner keeps a garment. SLATE's estimate. */
export const DRY_CLEAN_DAYS = 2;

/** The class a garment is priced as, by its care kind and slot. A suit's jacket alone is priced as a coat. */
export function cleanClassOf(kind: string, slot: string): CleanClass {
  if (kind === 'suit') return slot === 'bottom' ? 'trousers' : slot === 'outer' ? 'coat' : 'suit';
  if (kind === 'dress') return 'dress';
  if (kind === 'coat') return 'coat';
  if (kind === 'trousers' || kind === 'jeans' || kind === 'skirt' || kind === 'sweater') return 'trousers';
  return 'shirt';
}
