// Builds src/engine/content/modelyears.ts (from 2026-10-05) from docs/research/catalog/epa-modelyears.json: each
// American model's configurations by model year since 2000, as the EPA rated them, identical ones (same year,
// engine, transmission, drive, fuel and rating) kept once. Run: node tools/build-modelyears.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const src = JSON.parse(readFileSync('docs/research/catalog/epa-modelyears.json', 'utf8'));
const FROM = 2000;
// A match whose last rated year is before 2025, for a car SLATE sells new, found an old name only (the MX-5 Miata's
// to 2005); it's left out, listed, until its later name is read, rather than carrying an old car forward.
const STALE_BEFORE = 2025;
const stale = [];
const out = {};
let n = 0;
for (const [id, configs] of Object.entries(src.models)) {
  if (Math.max(...configs.map((c) => c.year)) < STALE_BEFORE) { stale.push(id); continue; }
  const seen = new Set();
  const keep = [];
  for (const c of configs) {
    if (c.year < FROM) continue;
    const row = [c.year, c.displ, c.cylinders, c.transmission, c.drive, c.fuel, c.per100km, c.kwhPer100km, c.rangeKm, c.turbo ? 1 : 0, c.vclass];
    const key = JSON.stringify(row);
    if (seen.has(key)) continue;
    seen.add(key);
    keep.push(row);
  }
  if (keep.length) { out[id] = keep; n += keep.length; }
}
writeFileSync('src/engine/content/modelyears.ts', `/**
 * SLATE — each American car model's configurations by model year (from 2026-10-05), built by
 * \`tools/build-modelyears.mjs\` from \`docs/research/catalog/epa-modelyears.json\`, the EPA's fueleconomy.gov
 * ratings read 2026-10-05. Don't edit by hand; rebuild it.
 *
 * A row: [model year, engine liters, cylinders, transmission, drive, fuel, liters a 100 km, kWh a 100 km,
 * range km, turbocharged (1), the EPA's size class]. The EPA rates a model year whether or not it's sold now;
 * a model year with no row had no rated configuration.
 */

export type ModelYearRow = readonly [number, number | null, number | null, string | null, string | null, string, number | null, number | null, number | null, number, string];

export const MODEL_YEARS: Readonly<Record<string, readonly ModelYearRow[]>> = JSON.parse(${JSON.stringify(JSON.stringify(out))});
`);
console.log(`models ${Object.keys(out).length}, configurations ${n}; left out as stale: ${stale.join(', ')}`);
