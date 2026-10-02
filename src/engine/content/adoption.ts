/**
 * SLATE — adopting a child, and a child born to a surrogate (Stage 10 of
 * `docs/BACKLOG.md`, from 2026-10-02), from
 * `docs/research/world/research-gaps-family.json`, read 2026-10-02; the
 * children's ages at adoption from DfE (England, year to March 2025: 3 years
 * 2 months) and AFCARS (America's public adoptions, FY2022: 6.1 years).
 *
 * **Adoption**, each place's main published route:
 * - New York: Spence-Chapin's domestic infant program, $51,000 and its
 *   $2,000 home study (its fee a search's summary); a newborn. In America 63%
 *   of infant adopters are matched within twelve months (2015), the month's
 *   chance taken from it.
 * - California and Connecticut: a private agency, the middle of the national
 *   $20,000 to $45,000; California's public agencies' $500 fee is for a
 *   child from care. Connecticut asks 21; California's age wasn't read.
 * - England: a local authority or regional adoption agency, which may charge
 *   nothing, and the £207 adoption order; a child adopted from care, at its
 *   average age. No applicant's wait is published: SLATE takes the 27
 *   months a child waits from entering care to adoption. 21 at least.
 * - Ireland: Tusla, nothing charged, an assessment of 18 months at least;
 *   the child England's average age, Ireland's not being published. 21.
 * - Ontario and British Columbia: a licensed private agency, the middle of
 *   $15,000 to $30,000, a newborn, matched at America's rate, Canada's not
 *   being published.
 * - Mexico City: DIF, free, 25 at least (and 17 years older than the child,
 *   which a child of England's average age never tests past 25); no wait is
 *   published, and SLATE takes Ireland's 18 months; the child England's
 *   average age.
 * America's federal adoption credit, up to $17,670 of a child's expenses in
 * 2026, $5,120 of it refundable, phased out between $265,080 and $305,080,
 * comes off the year's return (`systems/taxreturn.ts`). Canada's credit is a
 * fifteenth of the expenses against federal tax, which SLATE's Canadian tax
 * doesn't itemize, and isn't kept.
 *
 * **Surrogacy**, where the law lets it: compensated in New York (since
 * February 2021), California and Connecticut, Circle Surrogacy's fixed
 * program $189,500; altruistic in England (the surrogate's expenses and the
 * rest, Brilliant Beginnings' £50,000 to £60,000, and the £270 parental
 * order) and Canada (receipted expenses C$25,000 to C$45,000); in Mexico City
 * by the Supreme Court's 2021 ruling, clinics' US$60,000 to US$90,000. The
 * middle of each range. Ireland's 2024 Act isn't in force for it. The child
 * is born a pregnancy's 280 days after; no agency publishes the months of
 * matching before it.
 */

export interface AdoptionRoute {
  place: string;
  agency: string;
  currency: string;
  cost: number;
  minAge: number;
  /** The child's age when placed, years. */
  childAge: number;
  /** Placed after these months, or matched at this share within a year. */
  months?: number;
  matchedInYear?: number;
}

export const ADOPTION: Readonly<Record<string, AdoptionRoute>> = {
  'us-ny': { place: 'New York', agency: 'Spence-Chapin', currency: 'USD', cost: 51_000 + 2_000, minAge: 18, childAge: 0, matchedInYear: 0.63 },
  'us-ca': { place: 'California', agency: 'a licensed private agency', currency: 'USD', cost: (20_000 + 45_000) / 2, minAge: 18, childAge: 0, matchedInYear: 0.63 },
  'us-ct': { place: 'Connecticut', agency: 'a licensed private agency', currency: 'USD', cost: (20_000 + 45_000) / 2, minAge: 21, childAge: 0, matchedInYear: 0.63 },
  uk: { place: 'England', agency: 'the local authority', currency: 'GBP', cost: 207, minAge: 21, childAge: 3 + 2 / 12, months: 27 },
  ie: { place: 'Ireland', agency: 'Tusla', currency: 'EUR', cost: 0, minAge: 21, childAge: 3 + 2 / 12, months: 18 },
  ca: { place: 'Canada', agency: 'a licensed private agency', currency: 'CAD', cost: (15_000 + 30_000) / 2, minAge: 18, childAge: 0, matchedInYear: 0.63 },
  mx: { place: 'Mexico', agency: 'DIF', currency: 'MXN', cost: 0, minAge: 25, childAge: 3 + 2 / 12, months: 18 },
};

export const US_ADOPTION_CREDIT = { most: 17_670, refundable: 5_120, phaseFrom: 265_080, phaseTo: 305_080 } as const;

export interface SurrogacyTerms { currency: string; cost: number; kind: 'compensated' | 'altruistic' }
export const SURROGACY: Readonly<Record<string, SurrogacyTerms>> = {
  'us-ny': { currency: 'USD', cost: 189_500, kind: 'compensated' },
  'us-ca': { currency: 'USD', cost: 189_500, kind: 'compensated' },
  'us-ct': { currency: 'USD', cost: 189_500, kind: 'compensated' },
  uk: { currency: 'GBP', cost: (50_000 + 60_000) / 2 + 270, kind: 'altruistic' },
  ca: { currency: 'CAD', cost: (25_000 + 45_000) / 2, kind: 'altruistic' },
  mx: { currency: 'USD', cost: (60_000 + 90_000) / 2, kind: 'compensated' },
};

/** The key a home's town reads these by: a US state, or a country. */
export function familyPlace(cityId: string): string {
  const [country, region] = cityId.split('-');
  return country === 'us' ? `us-${region}` : country ?? '';
}
