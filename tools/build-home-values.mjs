// Builds src/engine/content/homevalues-us.ts from Zillow's Home Value Index by city.
//
//   node tools/build-home-values.mjs <City_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv>
//
// The CSV is Zillow Research's public data
// (https://www.zillow.com/research/data/, "ZHVI All Homes (SFR, Condo/Co-op)
// Time Series, Smoothed, Seasonally Adjusted", by city). Each of SLATE's US
// cities is matched by its name and state; the latest month's typical value
// and the five years' compound growth before it are kept, in whole dollars
// and tenths of a percent.

import { readFileSync, writeFileSync } from 'node:fs';

const [csvPath] = process.argv.slice(2);
if (!csvPath) { console.error('Give the ZHVI city CSV.'); process.exit(1); }

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/^(city of|town of|village of)\s+/, '').replace(/\bsaint\b/g, 'st').replace(/\bst\./g, 'st').replace(/[^a-z0-9]+/g, '');

// SLATE's US cities: id, name, region.
const cities = readFileSync('public/geo/us.tsv', 'utf8').split(/\r?\n/).filter(Boolean).map((l) => l.split('\t')).map(([id, name, region]) => ({ id, name, state: (region ?? '').split('-')[1]?.toUpperCase() }));

// Zillow's: the latest month and sixty before it.
const lines = readFileSync(csvPath, 'utf8').split(/\r?\n/).filter(Boolean);
const head = lines[0].split(',');
const lastCol = head.length - 1;
const month = head[lastCol];
const zillow = new Map();
for (const line of lines.slice(1)) {
  // No commas inside the name fields in this file but for quoted metros; split carefully.
  const cells = line.match(/("([^"]*)"|[^,]*)(,|$)/g).map((c) => c.replace(/,$/, '').replace(/^"|"$/g, ''));
  const name = cells[2];
  const state = cells[5];
  const now = Number(cells[lastCol]);
  const then = Number(cells[lastCol - 60]);
  if (!name || !state || !now) continue;
  const key = `${norm(name)}|${state}`;
  // Where a name repeats in a state, the larger place (lower SizeRank) wins.
  if (zillow.has(key)) continue;
  const growth = then > 0 ? Math.pow(now / then, 1 / 5) - 1 : undefined;
  zillow.set(key, { value: Math.round(now), growth });
}

// Zillow reports New York City as one city named New York; its boroughs are SLATE's own cities, and take the city's value.
const ALIAS = { 'us-ny-newyork': 'New York', 'us-ny-brooklyn': 'New York', 'us-ny-queens': 'New York', 'us-ny-manhattan': 'New York', 'us-ny-bronx': 'New York', 'us-ny-thebronx': 'New York', 'us-ny-statenisland': 'New York' };
const rows = [];
for (const c of cities) {
  const z = zillow.get(`${norm(ALIAS[c.id] ?? c.name)}|${c.state}`);
  if (!z) continue;
  rows.push(`${c.id.slice(3)}:${z.value}:${z.growth === undefined ? '' : Math.round(z.growth * 1000)}`);
}

const out = `/**
 * SLATE — what a home is worth in each US city SLATE knows, from Zillow's
 * Home Value Index (ZHVI All Homes, the middle third, smoothed and seasonally
 * adjusted, ${month}), matched by name and state: ${rows.length} of ${cities.length} cities.
 * Each entry is the city id without \`us-\`, the typical home's value in
 * whole dollars, and its compound growth a year over the five years before,
 * in tenths of a percent. Built by \`tools/build-home-values.mjs\`; source:
 * https://www.zillow.com/research/data/ (Zillow Research, with attribution).
 */

export const US_HOME_VALUES_MONTH = '${month}';

export const US_HOME_VALUES = '${rows.join(';')}';
`;
writeFileSync('src/engine/content/homevalues-us.ts', out);
console.log(`matched ${rows.length} of ${cities.length}, month ${month}`);
