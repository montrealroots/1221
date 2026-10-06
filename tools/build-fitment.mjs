// Builds src/engine/content/vehiclefitment.ts (from 2026-10-05) from docs/research/catalog/vehicle-fitment.json:
// for each car read, the model year it was read for, its factory tire sizes front and rear, wheel diameter, bolt
// pattern and its dash's head-unit opening, with whether a kit takes a double-DIN unit. A size is kept as tire
// sellers write it, its "P" prefix and spaces taken out (P265/70R17 is 265/70R17). Run: node tools/build-fitment.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const src = JSON.parse(readFileSync('docs/research/catalog/vehicle-fitment.json', 'utf8'));
export const tireSize = (s) => (s ? String(s).toUpperCase().replace(/\s+/g, '').replace(/^P(?=\d)/, '') : null);
const out = {};
for (const [id, v] of Object.entries(src.vehicles ?? {})) {
  const front = tireSize(v.tires?.front);
  if (!front && !v.headUnit?.opening) continue;
  out[id] = {
    modelYear: v.modelYear ?? null, front, rear: tireSize(v.tires?.rear) ?? null, wheelIn: v.tires?.wheelIn ?? null,
    bolt: v.boltPattern ?? null, opening: v.headUnit?.opening ?? null, doubleDinKit: v.headUnit?.kitAllowsDoubleDin === true, confirmed: v.confirmed === true,
  };
}
writeFileSync('src/engine/content/vehiclefitment.ts', `/**
 * SLATE — what fits each car read (from 2026-10-05), built by \`tools/build-fitment.mjs\` from
 * \`docs/research/catalog/vehicle-fitment.json\` (makers' spec pages, tire sellers' fitment tools and
 * Crutchfield's, Metra's and Scosche's fit guides). Don't edit by hand; rebuild it.
 *
 * For the model year it was read for: its factory tire sizes, wheel diameter, bolt pattern and its dash's
 * head-unit opening ("integrated" is a maker's screen with no standard opening), and whether a dash kit takes
 * a double-DIN unit.
 */

export interface Fitment { modelYear: number | null; front: string | null; rear: string | null; wheelIn: number | null; bolt: string | null; opening: 'single-din' | 'double-din' | 'integrated' | null; doubleDinKit: boolean; confirmed: boolean }

export const FITMENT: Readonly<Record<string, Fitment>> = ${JSON.stringify(out, null, 1)};

/** A tire size as sellers write it: no "P", no spaces. */
export const tireSize = (s: string | null | undefined): string | null => (s ? s.toUpperCase().replace(/\\s+/g, '').replace(/^P(?=\\d)/, '') : null);
`);
console.log(`fitment for ${Object.keys(out).length} cars`);
