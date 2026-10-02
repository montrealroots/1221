/**
 * SLATE — what eating out costs on top of the menu, by market (Stage 4 of
 * `docs/BACKLOG.md`, from 2026-10-01), from
 * `docs/research/world/research-restaurants.json`.
 *
 * Delivery is one app's terms per market, the one with the most published:
 * its service fee and small-order fee where its own help pages give them.
 * No app publishes a typical delivery fee: each market's is the middle of
 * what third-party guides report, SLATE's estimate, and so is Ireland's and
 * Mexico's service fee. How long a delivery takes isn't published either:
 * third-party timings put it at 26 to 40 minutes, and SLATE takes 35.
 *
 * Tipping is the custom, the middle of each market's range (Emily Post in
 * America; Angus Reid in Canada; the service charge London restaurants add;
 * Ireland's 10 to 12.5%; Mexico's 10 to 15%, which Profeco says is
 * voluntary). At a counter nobody tips. A delivery tip is America's 10 to
 * 15%, and Canada's is taken as America's, SLATE's estimate; no norm was
 * found for Britain or Ireland, where none is added, and Mexico's is its
 * customary minimum, SLATE's estimate.
 *
 * How long a meal out takes, by the kind of place, is SLATE's estimate.
 */

import type { Tier } from './restaurants';

export type DiningMarket = 'US' | 'GB' | 'IE' | 'CA' | 'MX';

export interface DeliveryTerms {
  app: string;
  currency: string;
  /** The delivery fee, and whether it's SLATE's estimate. */
  fee: number; feeEstimated: boolean;
  /** The service fee as a share of the food, its floor and cap where there are, and whether it's estimated. */
  serviceShare: number; serviceMin?: number; serviceMax?: number; serviceEstimated: boolean;
  /** A small order's fee and the food it's charged under. */
  smallOrder?: { fee: number; under: number };
  source: string;
}

export const DELIVERY_TERMS: Readonly<Record<DiningMarket, DeliveryTerms>> = {
  US: { app: 'Uber Eats', currency: 'USD', fee: 6.5, feeEstimated: true, serviceShare: 0.15, serviceEstimated: false, smallOrder: { fee: 2, under: 10 }, source: 'help.uber.com; the delivery fee the middle of Grubhub’s reported $0.99 to $12' },
  GB: { app: 'Uber Eats', currency: 'GBP', fee: 2.5, feeEstimated: true, serviceShare: 0.12, serviceMin: 0.99, serviceMax: 3.29, serviceEstimated: false, smallOrder: { fee: 0.99, under: 10 }, source: 'help.uber.com (UK); the delivery fee the middle of the £0 to £5 guides report' },
  IE: { app: 'Deliveroo', currency: 'EUR', fee: 3.75, feeEstimated: true, serviceShare: 0.1, serviceMin: 0.99, serviceMax: 2.49, serviceEstimated: true, source: 'The €2.50 to €5 a comparison reports; the service fee Deliveroo’s British one' },
  CA: { app: 'Uber Eats', currency: 'CAD', fee: 3.74, feeEstimated: true, serviceShare: 0.15, serviceEstimated: false, smallOrder: { fee: 2, under: 10 }, source: 'help.uber.com; the delivery fee the middle of SkipTheDishes’ usual $2.99 to $4.49' },
  MX: { app: 'Rappi', currency: 'MXN', fee: 32.5, feeEstimated: true, serviceShare: 0.125, serviceEstimated: true, source: 'The MXN 15 to 50 and 10 to 15% secondary sources report' },
};

/** The customary tip, as a share of the food before tax: at a table, and on a delivery. */
export const TIP: Readonly<Record<DiningMarket, { table: number; delivery: number; deliveryEstimated: boolean }>> = {
  US: { table: 0.175, delivery: 0.125, deliveryEstimated: false },
  CA: { table: 0.175, delivery: 0.125, deliveryEstimated: true },
  GB: { table: 0.125, delivery: 0, deliveryEstimated: false },
  IE: { table: 0.1125, delivery: 0, deliveryEstimated: false },
  MX: { table: 0.125, delivery: 0.1, deliveryEstimated: true },
};

/** Minutes for a meal: at a table by the kind of place, taken away, and delivered (the wait and the meal). SLATE's estimates. */
export const DINING_MINUTES: Readonly<Record<Tier, number>> & { takeout: number; delivery: number } = {
  fast: 20, casual: 50, mid: 80, upscale: 150, takeout: 35, delivery: 55,
};
