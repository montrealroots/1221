// Builds src/engine/content/airfares.ts from the DOT Consumer Airfare Report
// research: the average fare between two US city markets, and the per-mile
// fares by distance its thousand markets give.
// Run: node tools/build-airfares.mjs docs/research/world/research-air.json
import { readFileSync, writeFileSync } from 'node:fs';

const j = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const d = j.domesticFares;
/** DOT's city markets, and the airports each pools. */
const MARKETS = {
  'New York City, NY (Metropolitan Area)': ['JFK', 'LGA', 'EWR'],
  'Los Angeles, CA (Metropolitan Area)': ['LAX', 'BUR', 'LGB', 'SNA', 'ONT'],
  'San Francisco, CA (Metropolitan Area)': ['SFO', 'OAK', 'SJC'],
  'Chicago, IL': ['ORD', 'MDW'],
  'Atlanta, GA (Metropolitan Area)': ['ATL'],
  'Las Vegas, NV': ['LAS'],
  'Seattle, WA': ['SEA'],
  'Washington, DC (Metropolitan Area)': ['DCA', 'IAD', 'BWI'],
  'Dallas/Fort Worth, TX': ['DFW', 'DAL'],
  'Boston, MA (Metropolitan Area)': ['BOS'],
  'Miami, FL (Metropolitan Area)': ['MIA', 'FLL'],
  'New Orleans, LA': ['MSY'],
};
const pairs = {};
for (const p of d.pairs) {
  if (!MARKETS[p.cityA] || !MARKETS[p.cityB]) throw new Error('unmapped market ' + p.cityA + ' / ' + p.cityB);
  const key = [p.cityA, p.cityB].sort().join('|');
  pairs[key] = { usd: p.avgFareUSD, miles: p.nonstopMiles, perDay: p.paxPerDay };
}
const bands = d.derivedFromTable1.byDistanceBand.map((b) => ({ fromMiles: Number(b.miles.split(/[-+]/)[0]), centsPerMile: b.centsPerMile }));
const text = `/**
 * SLATE — what a US flight costs: the US DOT's Domestic Airline Consumer
 * Airfare Report, Table 1, for Q1 2026 (${d.source.url}):
 * the average fare every paying passenger paid between two city markets,
 * each direction, round trips split in half, all carriers. And the
 * per-mile fares by distance its thousand markets give, passenger-weighted
 * (derived from the table on 2026-09-29). Built by
 * \`tools/build-airfares.mjs\`; don't edit by hand.
 */

/** Each DOT city market, and the airports it pools. */
export const MARKETS: Readonly<Record<string, readonly string[]>> = ${JSON.stringify(MARKETS)};

/** The average one-way fare between two markets, keyed by their names in order, with the nonstop miles and the passengers a day. */
export const DOT_PAIRS: Readonly<Record<string, { usd: number; miles: number; perDay: number }>> = ${JSON.stringify(pairs)};

/** Cents a mile, by the distance a market is flown, from its lower bound in miles. */
export const PER_MILE_BANDS: readonly { fromMiles: number; centsPerMile: number }[] = ${JSON.stringify(bands)};

export const AIRFARES_AS_OF = 'Q1 2026';
`;
writeFileSync('src/engine/content/airfares.ts', text);
console.log('wrote', Object.keys(pairs).length, 'pairs', bands.length, 'bands');
