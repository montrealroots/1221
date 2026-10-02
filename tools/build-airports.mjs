// Builds src/engine/content/airports.ts from OurAirports' public-domain
// airports.csv (https://davidmegginson.github.io/ourairports-data/airports.csv):
// every large airport, and every medium one with scheduled service, that has
// an IATA code. Run: node tools/build-airports.mjs <airports.csv> <downloaded YYYY-MM-DD>
import { readFileSync, writeFileSync } from 'node:fs';

const [file, downloaded] = process.argv.slice(2);
if (!file || !downloaded) throw new Error('node tools/build-airports.mjs <airports.csv> <downloaded YYYY-MM-DD>');
const text = readFileSync(file, 'utf8');

/** The CSV, quoted fields and all. */
function parse(t) {
  const rows = [];
  let row = [];
  let f = '';
  let q = false;
  for (let i = 0; i < t.length; i += 1) {
    const c = t[i];
    if (q) {
      if (c === '"') { if (t[i + 1] === '"') { f += '"'; i += 1; } else q = false; } else f += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  return rows;
}

const rows = parse(text);
const head = rows.shift();
const ix = Object.fromEntries(head.map((k, i) => [k, i]));
const data = rows.filter((r) => r.length === head.length);
const kept = data
  .filter((r) => r[ix.iata_code].trim() !== '' && (r[ix.type] === 'large_airport' || (r[ix.type] === 'medium_airport' && r[ix.scheduled_service] === 'yes')))
  .map((r) => [r[ix.iata_code].trim(), r[ix.name], r[ix.type] === 'large_airport' ? 1 : 0, Number(Number(r[ix.latitude_deg]).toFixed(4)), Number(Number(r[ix.longitude_deg]).toFixed(4)), r[ix.iso_country], r[ix.municipality]])
  .sort((a, b) => a[0].localeCompare(b[0]));

const out = `/**
 * SLATE — the airports with scheduled flights: every large airport in
 * OurAirports' data, and every medium one with scheduled service, that has
 * an IATA code; ${kept.length} of its ${data.length} places, downloaded ${downloaded}. OurAirports
 * is in the public domain (https://ourairports.com/data/). Built by
 * \`tools/build-airports.mjs\`; don't edit by hand.
 *
 * Each row: IATA code, name, large (1) or medium (0), latitude, longitude,
 * ISO country, and the town it serves.
 */

export type AirportRow = readonly [iata: string, name: string, large: 0 | 1, lat: number, lon: number, country: string, municipality: string];

export const AIRPORTS_AS_OF = '${downloaded}';

export const AIRPORT_ROWS: readonly AirportRow[] = ${JSON.stringify(kept)};
`;
writeFileSync('src/engine/content/airports.ts', out);
console.log('wrote', kept.length, 'of', data.length);
