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

/**
 * How often an emergency department is used for what a family doctor could
 * have seen, from 2026-10-02 (`research-gaps-hotels-health.json`): the
 * Commonwealth Fund's 2023 survey, the share of adults whose last visit could
 * have been handled by their own doctor had one been available, America's
 * 40.7%, Canada's 38.0% (Ontario's 35.4%, British Columbia's 41.7%), the UK's
 * 31.2% (read from CIHI's own page and workbook). SLATE's emergencies a year
 * are America's (NHAMCS); elsewhere they're the same true emergencies over
 * the place's own share, SLATE's reading, none being published for Ireland
 * or Mexico, which keep America's.
 */
export const ED_AVOIDABLE: Readonly<Record<string, number>> = { us: 0.407, ca: 0.38, 'ca-08': 0.354, 'ca-02': 0.417, uk: 0.312 };

/** A place's emergencies against America's: its avoidable share's room for them. */
export function emergencyScale(cityId: string): number {
  const [country, region] = cityId.split('-');
  const share = ED_AVOIDABLE[`${country}-${region === 'on' ? '08' : region === 'bc' ? '02' : region}`] ?? ED_AVOIDABLE[country ?? ''] ?? ED_AVOIDABLE.us!;
  return (1 - ED_AVOIDABLE.us!) / (1 - share);
}

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
