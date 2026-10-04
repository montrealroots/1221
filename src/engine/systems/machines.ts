/**
 * SLATE — a home's machines by make and model (from 2026-10-04): the washing
 * machines, dryers and dishwashers sold where a home is
 * (`content/appliancecatalog.ts`), each with the energy a cycle its label
 * gives, ENERGY STAR's or the EU's.
 *
 * A model fitted to a home one owns (`home.fit` with an offer,
 * `systems/appliances.ts`) bills its own energy (`machineUsd` in
 * `systems/dwelling.ts`):
 * - a washer's and a dryer's loads at its label's energy a cycle, in place
 *   of the usual machine's, which the month's bill counts load by load;
 * - a dishwasher's runs at what its label takes past the usual labeled
 *   dishwasher's where the home is, the middle of those sold there. A
 *   typical household's electricity already runs a dishwasher, so a hungrier
 *   one adds a little and a frugal one takes a little off, and one with no
 *   model, or no label read, adds nothing: SLATE's estimate is the usual one.
 *
 * Kept apart here, with no import of a system, so the bill and the fitting
 * both read it.
 */

import { APPLIANCE_PRODUCTS } from '../content/appliancecatalog';
import type { CatalogMarket, CatalogOffer, CatalogProduct } from '../content/products';

export type MachineKind = 'washer' | 'dryer' | 'dishwasher';
export const MACHINE_KINDS: readonly MachineKind[] = ['washer', 'dryer', 'dishwasher'];
export const isMachine = (kind: string): kind is MachineKind => (MACHINE_KINDS as readonly string[]).includes(kind);

export const machineProduct = (id: string): CatalogProduct | undefined => APPLIANCE_PRODUCTS.find((p) => p.id === id);

export function machineOffer(offerId: string): { product: CatalogProduct; offer: CatalogOffer } | undefined {
  for (const product of APPLIANCE_PRODUCTS) { const offer = product.offers.find((o) => o.id === offerId); if (offer) return { product, offer }; }
  return undefined;
}

/** A machine as its seller names it: its make and the model number sold there, a region's where it differs. */
export const machineName = (product: CatalogProduct, offer?: CatalogOffer): string => `${product.brand} ${offer?.model ?? product.model}`;

/** The energy a cycle its label gives, kWh, or nothing where no label was read. */
export const kwhPerCycle = (product: CatalogProduct | undefined): number | undefined => (typeof product?.attrs.kwhPerCycle === 'number' ? product.attrs.kwhPerCycle : undefined);

const median = (xs: number[]): number | undefined => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[s.length >> 1] : undefined; };

/** The usual labeled dishwasher's energy a run where a market is: the middle of the labeled ones sold there, kWh. */
export function usualDishwasherKwh(market: CatalogMarket): number | undefined {
  const sold = (m?: CatalogMarket) => APPLIANCE_PRODUCTS.filter((p) => p.attrs.kind === 'dishwasher' && (!m || p.offers.some((o) => o.market === m))).map(kwhPerCycle).filter((k): k is number => k !== undefined);
  // A market with no labeled one sold takes the catalog's middle.
  return median(sold(market)) ?? median(sold());
}
