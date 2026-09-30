/**
 * SLATE — a holiday let instead of a hotel on a journey (docs/WORLD.md,
 * stage 8b), from 2026-09-29, researched in
 * docs/research/world/research-rentals.json.
 *
 * A night's rate is AirDNA's average daily rate for the town, a
 * compiler's figure read from a search of its page, for every kind of
 * listing, in dollars: the only figure published. On it, Airbnb's guest
 * service fee at the low end of its published 14.1% to 16.5%, and the town's
 * taxes on a stay of 30 nights or fewer:
 * - New York City's hotel room occupancy tax (5.875%, read secondhand, and
 *   $2 a night), its 8.875% sales tax and the state's $1.50 unit fee;
 * - Connecticut's 15% room occupancy tax;
 * - Los Angeles's 14% transient occupancy tax, read secondhand;
 * - Toronto's 6% municipal accommodation tax;
 * - British Columbia's 8% PST and Vancouver's 3% and 2.5% MRDT;
 * - Mexico City's 5% lodging tax on platform stays, read secondhand, and IVA;
 * London and Dublin levy none; VAT falls only on a host registered for it,
 * which SLATE takes a host not to be.
 *
 * The law, where it binds a guest's booking: New York City's Local Law 18
 * makes a whole home for fewer than 30 nights unlawful; London lets a home
 * no more than 90 nights a year. Edinburgh's and Belfast's nightly rates
 * weren't researched until 2026-09-29, and no let was kept there until then;
 * Edinburgh's 5% visitor levy falls on a stay's first five nights.
 * Canceled, Airbnb's Moderate policy: all of it back until five days before
 * arriving, then half of the nights after the first, the service fee kept.
 */

export interface LetTerms { adrUsd: number; taxRate: number; perNightUsd?: number; minNights?: number; maxNights?: number; /** A levy on so many nights only. */ levyNights?: number; basis: string }

export const LETS: Readonly<Record<string, LetTerms>> = {
  'us-ny-newyork': { adrUsd: 182, taxRate: 0.05875 + 0.08875, perNightUsd: 2 + 1.5, minNights: 30, basis: 'New York City’s occupancy and sales taxes and the state’s unit fee; Local Law 18 bars a whole home for fewer than 30 nights' },
  'us-ct-newhaven': { adrUsd: 145, taxRate: 0.15, basis: 'Connecticut’s 15% room occupancy tax' },
  'us-ca-losangeles': { adrUsd: 218, taxRate: 0.14, basis: 'Los Angeles’s 14% transient occupancy tax' },
  'uk-eng-london': { adrUsd: 234, taxRate: 0, maxNights: 90, basis: 'no levy in London; a home is let no more than 90 nights a year (Deregulation Act 2015, s. 44)' },
  'ie-lei-dublin': { adrUsd: 209, taxRate: 0, basis: 'no levy in Dublin' },
  'ca-on-toronto': { adrUsd: 141, taxRate: 0.06, basis: 'Toronto’s 6% municipal accommodation tax' },
  'ca-bc-vancouver': { adrUsd: 200, taxRate: 0.08 + 0.03 + 0.025, basis: 'British Columbia’s 8% PST and Vancouver’s 3% and 2.5% MRDT' },
  'uk-sct-edinburgh': { adrUsd: 269, taxRate: 0.05, levyNights: 5, basis: 'Edinburgh’s 5% visitor levy on the first five nights, from 24 July 2026' },
  'uk-nir-belfast': { adrUsd: 160, taxRate: 0, basis: 'no levy in Northern Ireland' },
  'mx-cmx-mexicocity': { adrUsd: 88, taxRate: 0.05 + 0.16, basis: 'Mexico City’s 5% lodging tax on a platform stay and IVA' },
};

/** Airbnb's guest service fee, its low end; and the Moderate policy's free days. */
export const LET_FEE = 0.141;
export const LET_FREE_DAYS = 5;

export const LET_SOURCE = 'docs/research/world/research-rentals.json: AirDNA’s market pages (a compiler’s, read from searches); Airbnb’s fees and cancellation policies; NYC Local Law 18; the Deregulation Act 2015; each town’s occupancy taxes';
