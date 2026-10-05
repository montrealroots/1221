/**
 * SLATE — a typical household's television, which the typical month of
 * electricity already holds (from 2026-10-05).
 *
 * The bill starts from the atlas's typical household's kilowatt-hours, and a
 * typical household watches television: the American Time Use Survey's 2025
 * release gives 2.6 hours a day, watching TV the leisure that took the most
 * time (bls.gov/news.release/atus.nr0.htm, read 2026-10-05). So what a life's
 * own set used watching is billed past that: 2.6 hours a day at home on the
 * middle labeled set. Less earns nothing back, since SLATE doesn't see all of a
 * life's viewing. In the commit that brought televisions in, every hour
 * watched went on top of the typical month, counting its viewing twice.
 *
 * America's hours stand for every country SLATE bills, SLATE's assumption,
 * replaceable where a country's own survey is read.
 */

import { TV_PRODUCTS } from './tvcatalog';

export const TV_HOURS_A_DAY = 2.6;

/** The middle on-mode power of every labeled set in the catalog, watts, its estimates left out: the typical set, and what a TV with no model draws. */
export const GENERIC_TV_WATTS: number | undefined = (() => {
  const w = TV_PRODUCTS.filter((p) => p.attrs.powerBasis !== 'estimate').map((p) => p.attrs.onModeWatts).filter((x): x is number => typeof x === 'number').sort((a, b) => a - b);
  return w.length ? w[w.length >> 1] : undefined;
})();

/** The typical household's TV kilowatt-hours over some days at home. */
export const typicalTvKwh = (days: number): number => (GENERIC_TV_WATTS === undefined ? 0 : (TV_HOURS_A_DAY * days * GENERIC_TV_WATTS) / 1000);
