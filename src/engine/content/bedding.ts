/**
 * SLATE — bedding (the master plan's §35b, from 2026-10-06), from
 * `docs/research/world/research-bedding.json`, read 2026-10-06.
 *
 * **The sets**, IKEA's cheapest duvet cover with its pillowcases, by the bed
 * size each fits, in its money:
 * - America: ÄNGSLILJA for a twin, $29.99; SLÅNHÖSTMAL for a full or a queen,
 *   $39.99. No king set was read.
 * - Britain: SOLFIBBLA, 150 × 200 cm with a 50 × 80 pillowcase, IKEA's single,
 *   £20. A larger set was read only at low confidence (EKTANDVINGE, £35), so a
 *   double or a king isn't sold one.
 * - Canada: IKEA.ca's basic sets read only as a range, $29.99 to $34.99 by size
 *   and style, so each size is sold at the $34.99, the range's top, SLATE's
 *   reading; no set's name was read.
 * - Mexico: DVALA for a matrimonial or a queen, MX$499.
 * - Ireland: no price was read from IKEA's Irish store, so none is sold there.
 * A fitted sheet on its own was never priced in any market (only the duvet
 * sets were), so none is sold.
 *
 * **Washing.** The Sleep Foundation's once a week: a set is due its wash
 * after seven nights slept in.
 */

export interface BeddingSet { id: string; country: string; name: string; sizes: readonly string[]; price: number; currency: string }

export const BEDDING_SETS: readonly BeddingSet[] = [
  { id: 'us-angslilja-twin', country: 'us', name: 'ÄNGSLILJA Duvet Cover And Pillowcase', sizes: ['twin'], price: 29.99, currency: 'USD' },
  { id: 'us-slanhostmal', country: 'us', name: 'SLÅNHÖSTMAL Duvet Cover And Pillowcases', sizes: ['full', 'queen'], price: 39.99, currency: 'USD' },
  { id: 'uk-solfibbla-single', country: 'uk', name: 'SOLFIBBLA Duvet Cover And Pillowcase', sizes: ['single'], price: 20, currency: 'GBP' },
  { id: 'ca-basic', country: 'ca', name: 'Basic Duvet Cover Set', sizes: ['twin', 'full', 'queen'], price: 34.99, currency: 'CAD' },
  { id: 'mx-dvala', country: 'mx', name: 'DVALA Duvet Cover And Pillowcases', sizes: ['matrimonial', 'queen'], price: 499, currency: 'MXN' },
];

/** The Sleep Foundation's weekly change: nights slept in before a set is due its wash. */
export const BEDDING_NIGHTS = 7;
