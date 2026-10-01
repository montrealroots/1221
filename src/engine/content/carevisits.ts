/**
 * SLATE — the time care takes, and where a prescription is filled (Stage 9
 * of `docs/BACKLOG.md`, from 2026-10-01), from
 * `docs/research/world/research-health-visits.json`, read 2026-10-01.
 *
 * **An emergency department** keeps somebody its median time from arrival
 * to leaving: CMS Care Compare's by state (October 2024, read from its
 * page), New York's 204 minutes, California's 186, Connecticut's 189, and
 * America's 162 elsewhere; the HSE's median 5.76 hours in Ireland (the
 * first nine months of 2025); CIHI's four hours in Canada (2024-25).
 * England publishes the share seen in four hours (75%, August 2026), not a
 * median, and Mexico City nothing; SLATE takes the four hours England's
 * standard and Canada's median both give, its reading.
 *
 * **A pharmacy** chosen in America fills a generic at its own
 * cash price: Walmart's $4, Costco's $4.10 and Kroger's $5 for a month of
 * atorvastatin, and CVS's $10 to $15 reported for a course of amoxicillin,
 * the middle; a search's summaries of GoodRx, a plan's copay never more than
 * the price. Otherwise the 2019 median of
 * $40 (`PHARMACY` in `content/safetynet.ts`).
 */

/** Minutes in an emergency department, by the place's key: a US state, or a country. */
export const ED_MINUTES: Readonly<Record<string, number>> = {
  'us-ny': 204, 'us-ca': 186, 'us-ct': 189, us: 162, ie: 5.76 * 60, ca: 4 * 60, uk: 4 * 60, mx: 4 * 60,
};

export function edMinutes(cityId: string): number {
  const [country, region] = cityId.split('-');
  return ED_MINUTES[`${country}-${region}`] ?? ED_MINUTES[country ?? ''] ?? ED_MINUTES.uk!;
}

export interface PharmacyChain { id: string; name: string; generic: number }
export const US_PHARMACIES: readonly PharmacyChain[] = [
  { id: 'walmart', name: 'Walmart Pharmacy', generic: 4 },
  { id: 'costco', name: 'Costco Pharmacy', generic: 4.1 },
  { id: 'kroger', name: 'Kroger Pharmacy', generic: 5 },
  { id: 'cvs', name: 'CVS Pharmacy', generic: 12.5 },
];
