// Builds src/engine/content/watchbatteries.ts from docs/research/world/research-watch-batteries.json
// (from 2026-10-02): each quartz watch SLATE sells, and how many years its battery lasts, its own
// model's figure where the maker gives one, else its brand's; a range taken at its middle, SLATE's
// reading. A quartz watch whose maker gives no figure (Tissot, Michael Kors, Thomas Sabo, Philipp
// Plein) isn't kept, and its battery never runs down.
import { readFileSync, writeFileSync } from 'node:fs';

const OUT = 'src/engine/content/watchbatteries.ts';
const j = JSON.parse(readFileSync('docs/research/world/research-watch-batteries.json', 'utf8'));
const mid = (v) => (Array.isArray(v) ? (v[0] + v[1]) / 2 : v);
const brands = new Map(j.brands.map((b) => [b.brand.toLowerCase(), b]));
const years = {};
const unconfirmed = [];
for (const m of j.models) {
  if (m.movement !== 'quartz') continue;
  const brand = brands.get(String(m.brand).toLowerCase());
  const v = m.batteryLifeYears ?? brand?.batteryLifeYears ?? null;
  if (v === null || v === undefined) continue;
  years[m.id] = mid(v);
  if (m.batteryLifeYears == null && brand && brand.confirmed !== true) unconfirmed.push(m.id);
}
const text = `/**
 * SLATE — how long a quartz watch's battery lasts, by the watch (from
 * 2026-10-02), built by \`tools/build-watch-batteries.mjs\` from
 * \`docs/research/world/research-watch-batteries.json\`. Don't edit by hand; rebuild it.
 *
 * Each maker's own manual or care page: Timex 2 to 5 years, Casio's F-91W 7 and
 * its LTP-1234 3, G-SHOCK's DW-5600E 2, Tommy Hilfiger 18 to 36 months (Movado
 * Group's), Longines 1 to 5, Frederique Constant six months to 2; Fossil's 2 to 3
 * read secondhand. A range is taken at its middle, SLATE's reading.
 */

export const BATTERY_YEARS: Readonly<Record<string, number>> = ${JSON.stringify(years, null, 2)};

/** The ones whose figure was read secondhand. */
export const BATTERY_SECONDHAND: readonly string[] = ${JSON.stringify(unconfirmed)};
`;
writeFileSync(OUT, text);
console.log('watches', Object.keys(years).length, 'secondhand', unconfirmed.length);
