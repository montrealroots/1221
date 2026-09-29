/**
 * SLATE — what flying costs and takes, beside the airports and the fares
 * (`content/airports.ts`, `content/airfares.ts`). Researched 2026-09-29 and
 * kept with its sources in `docs/research/world/research-air.json`.
 *
 * - Fares: between two US markets, the DOT's average; between two US
 *   airports it doesn't pair, the per-mile fare for the distance its
 *   thousand markets give. No official source publishes international fares
 *   by route, so abroad SLATE carries the DOT's longest band's per-mile fare
 *   to the distance, its estimate, and says so.
 * - A checked bag: $45 one way on the US carriers' economy fares in 2026
 *   (American, Delta, Southwest, United, Alaska, JetBlue's lowest); the first
 *   bag is included in standard economy across the Atlantic and Pacific.
 * - Arriving before a flight: two hours domestic and three international,
 *   TSA's advice.
 * - On time: BTS's every domestic flight of 2025, derived: 21.9% arrived 15
 *   minutes or more late, by 72.9 minutes on average, and 1.47% were
 *   canceled.
 * - The border: the UK Border Force's standard for passengers from outside
 *   the EEA, 95% through in 45 minutes (published 2013 to 2018, not confirmed
 *   current); CBP publishes no average, so SLATE takes the same.
 * - Taxis to the airports: the city's own rate cards where they were read.
 */

import { distanceKm } from './geography';
import { CITIES } from './geography';
import { DOT_PAIRS, MARKETS, PER_MILE_BANDS } from './airfares';
import type { Airport } from '../systems/airports';

const KM_PER_MILE = 1.609344;
const marketOf = (iata: string) => Object.entries(MARKETS).find(([, codes]) => codes.includes(iata))?.[0];

export const AIR = {
  departureHours: [8, 13, 19] as const,
  /** About 800 km an hour in the air and half an hour taxiing out and in: SLATE's estimate, JFK to Heathrow near seven and a half hours, JFK to LAX near five and a half. */
  cruiseKmh: 800,
  taxiMinutes: 30,
  /** A connection's time between flights: SLATE's estimate. */
  connectionMinutes: 90,
  /** A job's trip shorter than this isn't flown: New Haven to New York is a train. SLATE's estimate, until rail is kept. */
  shortestCareerFlightKm: 400,
  arriveBeforeDomesticMinutes: 120,
  arriveBeforeInternationalMinutes: 180,
  bagUsd: (international: boolean) => (international ? 0 : 45),
  bagBasis: '$45 one way on US carriers’ economy fares in 2026; included across the ocean in standard economy',
  /**
   * Business or first (from 2026-09-29): IATA's premium fares, about five
   * times economy's on average (IATA, "The Resurgence of Premium Class
   * Travel", 26 July 2024), worldwide, first and business together. No one
   * publishes the multiple by route or for the US alone, so SLATE carries the
   * world's. Checked bags come with it; Delta calls them complimentary without
   * a count, and SLATE reads two.
   */
  premiumMultiple: 5,
  premiumBags: 2,
  premiumBasis: 'Business or first: IATA’s premium fares, about five times economy’s worldwide (26 July 2024); SLATE carries the world’s multiple, none being published by route. Two checked bags come with it, SLATE’s reading of the carriers’ “complimentary”.',
  lateShare: 0.219,
  lateMinutesAverage: 72.9,
  canceledShare: 0.0147,
  /** Hours later a canceled flight's passengers go on the next departure: SLATE's estimate. */
  rebookHours: 5,
  deplaneMinutes: 15,
  borderMinutes: 45,
  bagClaimMinutes: 25,
  /**
   * A round trip's fares against two one-way fares: BTS's Q2 2026 averages,
   * $535 a round trip against $307 one way, so 0.871. The two kinds of
   * ticket are bought for different journeys, so the share is SLATE's
   * reading of the discount, not a fare any airline quotes.
   */
  roundTripShare: 535 / (2 * 307),
} as const;

/** A one-way economy fare between two airports, and whose figure it is. */
export function fareUsd(a: Airport, b: Airport): { usd: number; basis: string } {
  const ma = marketOf(a.iata);
  const mb = marketOf(b.iata);
  if (ma && mb && ma !== mb) {
    const pair = DOT_PAIRS[[ma, mb].sort().join('|')];
    if (pair) return { usd: pair.usd, basis: `The DOT’s average fare between the two markets, Q1 2026, which counts first-class fares paid with the rest.` };
  }
  const miles = distanceKm(a, b) / KM_PER_MILE;
  const domestic = a.country === 'US' && b.country === 'US';
  const band = domestic ? [...PER_MILE_BANDS].reverse().find((x) => miles >= x.fromMiles)! : PER_MILE_BANDS[PER_MILE_BANDS.length - 1]!;
  const usd = Math.round(miles * band.centsPerMile) / 100;
  return domestic
    ? { usd, basis: `The DOT’s per-mile fare for ${Math.round(miles)} miles, from its thousand markets, Q1 2026.` }
    : { usd, basis: `No official source publishes international fares by route: SLATE carries the DOT’s per-mile fare for its longest band, ${band.centsPerMile}¢, to ${Math.round(miles)} miles.` };
}

/** Taxis to an airport where the city's rate card was read: its fare in its own currency, before any tip. */
const TAXIS: Readonly<Record<string, { amount: number; currency: string; basis: string }>> = {
  JFK: { amount: 70 + 0.5 + 1 + 2.5 + 0.75, currency: 'USD', basis: 'The TLC’s $70 flat fare between Manhattan and JFK, with the MTA, improvement and congestion surcharges; tolls and the tip aside.' },
  LAX: { amount: 51.15 + 4, currency: 'USD', basis: 'LADOT’s $51.15 flat fare between LAX and downtown, and the $4 LAX surcharge.' },
  LHR: { amount: 26, currency: 'GBP', basis: 'The Heathrow Express, £26 on the day, fifteen minutes to Paddington.' },
  YVR: { amount: 46, currency: 'CAD', basis: 'YVR’s C$46 flat fare to downtown.' },
  ATL: { amount: 37.5, currency: 'USD', basis: 'Atlanta’s $37.50 flat fare to downtown.' },
  MSY: { amount: 36, currency: 'USD', basis: 'New Orleans’s $36 flat fare for up to two.' },
};

/** GO Airport Shuttle's shared van from New Haven to JFK or LaGuardia, from $79 a person. */
const SHUTTLES: Readonly<Record<string, { amount: number; currency: string; basis: string }>> = {
  'us-ct-newhaven|JFK': { amount: 79, currency: 'USD', basis: 'GO Airport Shuttle’s shared van from New Haven, from $79.' },
  'us-ct-newhaven|LGA': { amount: 79, currency: 'USD', basis: 'GO Airport Shuttle’s shared van from New Haven, from $79.' },
};

/**
 * The ride between a town and its airport, its minutes and its fare: a rate
 * card where one was read, else LA's meter ($3.10 and $2.97 a mile), SLATE's
 * estimate for a town whose card wasn't read; minutes at 35 km an hour and
 * ten more, SLATE's estimate of city traffic.
 */
export function groundLeg(cityId: string, iata: string, km: number): { amount: number; currency: string; minutes: number; basis: string } {
  const minutes = Math.round(10 + (km / 35) * 60);
  const shuttle = SHUTTLES[`${cityId}|${iata}`];
  if (shuttle) return { ...shuttle, minutes };
  const card = TAXIS[iata];
  const big = CITIES.get(cityId);
  if (card && big && km < 60) return { ...card, minutes: iata === 'LHR' ? 40 : minutes };
  const amount = Math.round((3.1 + (km / KM_PER_MILE) * 2.97) * 100) / 100;
  return { amount, currency: 'USD', minutes, basis: 'A taxi at LA’s meter, $3.10 and $2.97 a mile: SLATE’s estimate where the town’s rate card wasn’t read.' };
}
