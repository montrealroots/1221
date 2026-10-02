/**
 * Builds src/engine/content/tanks.ts from
 * docs/research/world/research-tanks.json: each model's fuel tank in liters
 * or its battery's usable kWh, as the research read them from the makers'
 * spec pages, or from a spec site where the maker's couldn't be read. A
 * model the research left null is left out, and the game uses SLATE's
 * estimate for it, saying so. Run: node tools/build-tanks.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';

const rows = JSON.parse(readFileSync('docs/research/world/research-tanks.json', 'utf8'));
const out = {};
for (const r of rows) {
  const c = {};
  if (typeof r.tankL === 'number' && r.tankL > 0) c.tankL = Math.round(r.tankL * 10) / 10;
  if (typeof r.batteryKwh === 'number' && r.batteryKwh > 0) c.batteryKwh = Math.round(r.batteryKwh * 10) / 10;
  if (Object.keys(c).length) out[r.id] = c;
}

const head = readFileSync('src/engine/content/tanks.ts', 'utf8').split('export const TANKS')[0];
const body = Object.entries(out).sort(([a], [b]) => a.localeCompare(b)).map(([id, c]) => `  '${id}': { ${Object.entries(c).map(([k, x]) => `${k}: ${x}`).join(', ')} },`).join('\n');
writeFileSync('src/engine/content/tanks.ts', `${head}export const TANKS: Readonly<Record<string, Capacity>> = {\n${body}\n};\n`);
console.log(`Wrote ${Object.keys(out).length} of ${rows.length} models into src/engine/content/tanks.ts.`);
