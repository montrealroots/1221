/**
 * SLATE — what a packed bag weighs, and what an airline makes of it, from
 * `docs/research/world/research-baggage-weight.json` (read 2026-10-04).
 *
 * **Weights** are dry weights from two laundry-load tables (a Speed Queen
 * franchise's and a British laundry site's, read secondhand), a suit's and a
 * pair of shoes' from single summaries: no appliance maker publishes a
 * garment-by-garment table. A liquid weighs about its milliliters in grams. A
 * thing SLATE keeps no weight for is reckoned at a quarter of a kilogram a
 * liter of what it takes up, SLATE's estimate.
 *
 * **Checked bags**: every full-service carrier read takes 23 kg in economy
 * and charges past it. Each flight is charged by its departure country's
 * flag carrier's rule, SLATE's reading, SLATE's flights not naming a
 * carrier: Delta's from America (verified, $100 to 32 kg and $200 to 45 kg
 * at home, nothing over 32 kg abroad), British Airways' from Britain (£65 to
 * 32 kg), Aer Lingus's from Ireland (€75 to 32 kg across the Atlantic, €10 a
 * kilogram over 20 in Europe), Air Canada's from Canada (100 Canadian dollars,
 * the low end of the range read) and Aeroméxico's from Mexico (800 pesos, the
 * low end of its range). All but Delta's are secondhand. Nothing over the
 * maximum is taken: it comes out at the counter.
 */

import type { Slot } from './garmentcare';

/** A garment's grams, by the part it is. Activewear and a base layer are taken as a T-shirt; a scarf or a belt a tenth of a kilogram. */
export const GARMENT_G: Readonly<Record<Slot, number>> = {
  top: 200, bottom: 625, dress: 300, suit: 1_400, outer: 1_150, underwear: 55, base: 175, socks: 45, shoes: 900, sleep: 400, active: 175, accessory: 100, towel: 500,
};
/** A counted toiletry, a bar or a pack of something, and a counted food: SLATE's estimates. */
export const COUNTED_G = { toiletry: 100, food: 150 } as const;
/** Kilograms a liter, for a thing whose weight isn't kept: SLATE's estimate. */
export const UNKNOWN_KG_PER_L = 0.25;
/** A carry-on's own weight where its maker's isn't kept: the median of the 21 carry-ons SLATE sells. */
export const CARRY_ON_KG = 2.9;

export interface BagRule {
  carrier: string; allowanceKg: number; maxKg: number;
  /** A band's fee past the allowance, to its upper bound; or a rate a kilogram. */
  bands: readonly { toKg: number; fee: number }[]; perKg?: number;
  currency: string; status: 'verified' | 'secondhand';
}

/** The departure country's flag carrier's rule, by whether the flight stays in the country or crosses an ocean. */
export const BAG_RULES: Readonly<Record<string, { domestic: BagRule; abroad: BagRule }>> = {
  us: {
    domestic: { carrier: 'Delta', allowanceKg: 23, maxKg: 45, bands: [{ toKg: 32, fee: 100 }, { toKg: 45, fee: 200 }], currency: 'USD', status: 'verified' },
    abroad: { carrier: 'Delta', allowanceKg: 23, maxKg: 32, bands: [{ toKg: 32, fee: 100 }], currency: 'USD', status: 'secondhand' },
  },
  uk: {
    domestic: { carrier: 'British Airways', allowanceKg: 23, maxKg: 32, bands: [{ toKg: 32, fee: 65 }], currency: 'GBP', status: 'secondhand' },
    abroad: { carrier: 'British Airways', allowanceKg: 23, maxKg: 32, bands: [{ toKg: 32, fee: 65 }], currency: 'GBP', status: 'secondhand' },
  },
  ie: {
    domestic: { carrier: 'Aer Lingus', allowanceKg: 20, maxKg: 32, bands: [], perKg: 10, currency: 'EUR', status: 'secondhand' },
    abroad: { carrier: 'Aer Lingus', allowanceKg: 23, maxKg: 32, bands: [{ toKg: 32, fee: 75 }], currency: 'EUR', status: 'secondhand' },
  },
  ca: {
    domestic: { carrier: 'Air Canada', allowanceKg: 23, maxKg: 32, bands: [{ toKg: 32, fee: 100 }], currency: 'CAD', status: 'secondhand' },
    abroad: { carrier: 'Air Canada', allowanceKg: 23, maxKg: 32, bands: [{ toKg: 32, fee: 100 }], currency: 'CAD', status: 'secondhand' },
  },
  mx: {
    domestic: { carrier: 'Aeroméxico', allowanceKg: 23, maxKg: 32, bands: [{ toKg: 32, fee: 800 }], currency: 'MXN', status: 'secondhand' },
    abroad: { carrier: 'Aeroméxico', allowanceKg: 23, maxKg: 32, bands: [{ toKg: 32, fee: 800 }], currency: 'MXN', status: 'secondhand' },
  },
};
