/**
 * SLATE — a boat of one's own (docs/WORLD.md, stage 7d), from 2026-09-30,
 * researched in docs/research/world/research-boats.json and
 * research-vehiclework.json.
 *
 * One boat, the one whose maker publishes both its price and its engine
 * maker's test: Bayliner's Trophy T18 Bay, an 18-foot center console with a
 * 115 hp Mercury, at $33,543 with its trailer, the nationally advertised
 * price for model year 2027. Mercury's report on it gives 3.7 gallons an
 * hour at 3,500 rpm and 20.4 mph, its most economical planing speed. Sold in
 * the three American states SLATE keeps a car's rules for; Bayliner prints
 * no price in Britain, Canada or Ireland, so none is sold there yet.
 */

import type { Jurisdiction } from './vehiclefees';

export type BoatState = 'US-NY' | 'US-CT' | 'US-CA';

export const T18 = {
  label: 'Bayliner Trophy T18 Bay',
  priceUsd: 33_543,
  lengthFt: 18,
  gph: 3.7,
  /** An outing: three hours on the water. SLATE's choice. */
  outingHours: 3,
} as const;

/**
 * Marina gas over the road's: $1.05 to $1.30 a gallon in New England the
 * week the research read Waterway Guide's fuel docks (secondary), the
 * middle, and taken everywhere, no other region's being published.
 */
export const MARINA_MARKUP_USD = 1.175;

/**
 * The sales tax on a boat: Connecticut's 2.99% on vessels, their motors and
 * trailers (DRS IP 2021(10)); New York's and California's ordinary rate.
 */
export const VESSEL_TAX_CT = 0.0299;

export interface BoatRules {
  /** The operator's certificate, the least an approved way to one costs. */
  certificate: { usd: number; label: string; basis: string };
  /** Registration: what the first costs and each renewal, and how many years each lasts. */
  registration: { first: (year: number) => number; renewal: number; years: number; basis: string };
  /** Keeping it off a house's drive: by the season (paid each April) or the month. */
  slip: { usd: number; per: 'season' | 'month'; basis: string };
}

export const BOAT_RULES: Readonly<Record<BoatState, BoatRules>> = {
  'US-NY': {
    certificate: { usd: 15, label: 'Boating Safety Certificate', basis: 'Brianna’s Law, every operator from 1 January 2025: the BoatUS Foundation’s free approved course and its $15 card' },
    registration: { first: () => 45, renewal: 45, years: 3, basis: 'NY DMV, $45 for three years at 16 to 26 feet' },
    slip: { usd: 1_325, per: 'season', basis: 'NYC Parks’ World’s Fair Marina, $1,325 a season at 20 feet or less (the City’s rules, read from a search’s extract)' },
  },
  'US-CT': {
    certificate: { usd: 50, label: 'Safe Boating Certificate', basis: 'CT DEEP’s $50 certificate, after an approved course' },
    registration: { first: () => 45, renewal: 45, years: 1, basis: 'CT DMV, $45 at 18 to 19 feet, a fiberglass hull, taken as yearly' },
    slip: { usd: ((960 + 1_250) / 2) * 1.0635 + 97.5, per: 'season', basis: 'Greenwich’s 2026 fees, the middle of $960 to $1,250 for a 20-foot slip with its 6.35% tax, and of its $95 to $100 permit, the one Connecticut town whose rates were read' },
  },
  'US-CA': {
    certificate: { usd: 10, label: 'California Boater Card', basis: 'the Division of Boating and Waterways’ $10 card, every operator from 1 January 2025' },
    registration: { first: (year) => (year % 2 === 0 ? 37 : 65), renewal: 36, years: 2, basis: 'California DMV: $37 in an even year and $65 in an odd one, then $36 every two years, the mussel fee in each' },
    slip: { usd: 17.69 * 25, per: 'month', basis: 'Marina del Rey’s 25-foot slips at $17.69 a foot a month, a boaters’ association’s survey of five marinas in 2021 (secondary)' },
  },
};

/**
 * Bayliner's own financing, through Brunswick's dealers: $1,500 down and
 * 6.5% over 144 months, "for well-qualified buyers", which Bayliner doesn't
 * define. SLATE takes it as a record of 740, the start of FICO's "very
 * good", its estimate. The taxes and the registration are paid at the sale,
 * as the example leaves them out. From 2026-09-30.
 */
export const BOAT_LOAN = { downUsd: 1_500, apr: 0.065, months: 144, minScore: 740 } as const;

/** Progressive’s average boat policy a year in its high-cost states, California, Connecticut and New York among them. */
export const BOAT_INSURANCE_USD = 662.51;

export const isBoatState = (j: Jurisdiction | undefined): j is BoatState => j === 'US-NY' || j === 'US-CT' || j === 'US-CA';

/**
 * A boat chartered with its captain, from 2026-09-30 (researched in
 * `docs/research/world/research-charter.json`): no boat of one's own and no
 * certificate, the captain holding the Coast Guard's six-pack license a
 * vessel for hire asks (46 CFR 15.605). Where an operator prints its price:
 * - New York City: Go Sailing NYC's 40-foot Beneteau from Chelsea Piers,
 *   $1,050 for three hours, and the 18% to 22% gratuity it suggests, the
 *   middle.
 * - Connecticut, on Long Island Sound: Island Mike's sailboat from Norwalk,
 *   $600 for four hours for up to four; it asks no gratuity.
 * From later on 2026-09-30 (`docs/research/world/research-charter-abroad.json`):
 * - Los Angeles: OnBoat's Classic Sailing Experience, a 58-foot sailboat from
 *   Marina del Rey, $875 for three hours, and the 10% to 15% it suggests.
 * - London: Thames RIB Experience's private boat, £799 for seventy minutes;
 *   a tip isn't customary in Britain.
 * - Toronto: Harbourfront's Niagara 35 for two hours, the middle of C$355 to
 *   C$395, and its skipper at the middle of C$60 to C$80 an hour, the sum
 *   SLATE's; Canada's customary 15% to 20%.
 * Vancouver's and Dublin Bay's were read only from marketplaces or an old
 * page, and none is kept there. Until then Marina del Rey's weren't either.
 */
export interface Charter { operator: string; amount: number; currency: string; hours: number; tip: number }
export const CHARTERS: Readonly<Record<string, Charter>> = {
  'us-ny-newyork': { operator: 'Go Sailing NYC', amount: 1_050, currency: 'USD', hours: 3, tip: 0.2 },
  'us-ct': { operator: 'Island Mike, Norwalk', amount: 600, currency: 'USD', hours: 4, tip: 0 },
  'us-ca-losangeles': { operator: 'OnBoat, Marina del Rey', amount: 875, currency: 'USD', hours: 3, tip: 0.125 },
  'uk-eng-london': { operator: 'Thames RIB Experience', amount: 799, currency: 'GBP', hours: 70 / 60, tip: 0 },
  'ca-on-toronto': { operator: 'Harbourfront Centre’s Nautical Centre', amount: 375 + 2 * 70, currency: 'CAD', hours: 2, tip: 0.175 },
};
