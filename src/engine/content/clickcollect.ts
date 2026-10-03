/**
 * SLATE — collecting an online order in store (§21, from 2026-10-02;
 * `docs/research/world/research-click-collect.json`, each retailer's own
 * help pages read that day, some through a search's copy of them as marked).
 *
 * The retailers whose fee and hold are both published, with a store in one
 * of SLATE's towns: the fee (free at most; John Lewis's £2.95, free over
 * £40), how long until it's ready to collect, and how many days it's held
 * before it goes back and is refunded. A wait given in hours is ready that
 * day, two hours on, SLATE's reading; a range is taken at its later end, and
 * working days are counted five to a week. A retailer naming no fee, or no
 * hold, isn't offered: an unknown price is never taken as nothing.
 */

export interface CollectTerms { fee: number; currency: string; freeOver?: number; readyDays: number; working: boolean; holdDays: number; confirmed: boolean }

export const CLICK_COLLECT: Readonly<Record<string, CollectTerms>> = {
  'us-uniqlo': { fee: 0, currency: 'USD', readyDays: 5, working: false, holdDays: 14, confirmed: false },
  'us-h-m': { fee: 0, currency: 'USD', readyDays: 1, working: true, holdDays: 3, confirmed: false },
  'us-target': { fee: 0, currency: 'USD', readyDays: 0, working: false, holdDays: 3, confirmed: true },
  'us-j-crew': { fee: 0, currency: 'USD', readyDays: 0, working: false, holdDays: 7, confirmed: true },
  'us-zara': { fee: 0, currency: 'USD', readyDays: 5, working: true, holdDays: 15, confirmed: false },
  'us-nordstrom': { fee: 0, currency: 'USD', readyDays: 1, working: false, holdDays: 5, confirmed: true },
  'us-macys': { fee: 0, currency: 'USD', readyDays: 0, working: false, holdDays: 7, confirmed: false },
  'us-nike': { fee: 0, currency: 'USD', readyDays: 0, working: false, holdDays: 7, confirmed: true },
  'gb-next': { fee: 0, currency: 'GBP', readyDays: 1, working: false, holdDays: 10, confirmed: true },
  'gb-uniqlo': { fee: 0, currency: 'GBP', readyDays: 1, working: false, holdDays: 14, confirmed: true },
  'gb-h-and-m': { fee: 0, currency: 'GBP', readyDays: 3, working: false, holdDays: 7, confirmed: false },
  'gb-zara': { fee: 0, currency: 'GBP', readyDays: 3, working: true, holdDays: 7, confirmed: false },
  'gb-reiss': { fee: 0, currency: 'GBP', readyDays: 1, working: false, holdDays: 10, confirmed: false },
  'gb-john-lewis': { fee: 2.95, currency: 'GBP', freeOver: 40, readyDays: 1, working: false, holdDays: 7, confirmed: true },
  'gb-selfridges': { fee: 0, currency: 'GBP', readyDays: 1, working: false, holdDays: 7, confirmed: false },
  'gb-burberry': { fee: 0, currency: 'GBP', readyDays: 1, working: false, holdDays: 10, confirmed: true },
  'ie-marks-and-spencer': { fee: 0, currency: 'EUR', readyDays: 1, working: false, holdDays: 5, confirmed: true },
  'ie-zara': { fee: 0, currency: 'EUR', readyDays: 7, working: true, holdDays: 15, confirmed: false },
  'ie-dunnes-stores': { fee: 0, currency: 'EUR', readyDays: 2, working: false, holdDays: 7, confirmed: true },
  'ie-brown-thomas': { fee: 0, currency: 'EUR', readyDays: 5, working: true, holdDays: 7, confirmed: true },
  'ie-arnotts': { fee: 0, currency: 'EUR', readyDays: 7, working: true, holdDays: 10, confirmed: true },
  'ca-uniqlo-ca': { fee: 0, currency: 'CAD', readyDays: 5, working: true, holdDays: 14, confirmed: true },
  'ca-hm-ca': { fee: 0, currency: 'CAD', readyDays: 1, working: true, holdDays: 3, confirmed: false },
  'mx-coppel-mx': { fee: 0, currency: 'MXN', readyDays: 7, working: true, holdDays: 7, confirmed: false },
  'mx-zara-mx': { fee: 0, currency: 'MXN', readyDays: 5, working: true, holdDays: 15, confirmed: false },
  'mx-pullandbear-mx': { fee: 0, currency: 'MXN', readyDays: 5, working: false, holdDays: 10, confirmed: false },
};
