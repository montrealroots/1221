/**
 * Builds src/engine/content/caroptions.ts from
 * docs/research/world/research-car-options.json: each catalog car's factory
 * options (paint, wheels, interior, packages, other) at the maker's price
 * list or configurator for its market and trim where it could be read, a
 * spec site's or dealer's otherwise, and its seats and cargo from the maker's
 * spec sheet. An option the research couldn't price is left out. The lead
 * times for a factory order are hand-kept above the line in the content file,
 * each with whose figure it is. Run: node tools/build-car-options.mjs
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

const r = JSON.parse(readFileSync('docs/research/world/research-car-options.json', 'utf8'));
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const seen = new Set();
// And from 2026-10-05 the other makes' options, a tranche a file (docs/research/catalog/car-options-*.json, the same shape).
const DIR = 'docs/research/catalog';
const more = existsSync(DIR) ? readdirSync(DIR).filter((f) => /^car-options-.*.json$/.test(f)).sort().flatMap((f) => JSON.parse(readFileSync(`${DIR}/${f}`, 'utf8')).options ?? []) : [];
const options = [...r.options, ...more].filter((o) => typeof o.price === 'number').map((o) => {
  let key = `${o.id}:${o.category}:${slug(o.name)}`;
  for (let n = 2; seen.has(key); n += 1) key = `${o.id}:${o.category}:${slug(o.name)}-${n}`;
  seen.add(key);
  return { key, carId: o.id, category: o.category, name: String(o.name).replace(/\s+/g, ' ').trim(), price: o.price, currency: o.currency, taxIncluded: o.taxIncluded === true, includes: Array.isArray(o.includes) ? o.includes.map(String) : typeof o.includes === 'string' ? [o.includes] : null };
});
const specs = r.specs.map((s) => ({ carId: s.id, seats: typeof s.seats === 'number' ? s.seats : null, cargoL: typeof s.cargoL === 'number' ? s.cargoL : null, cargoFoldedL: typeof s.cargoFoldedL === 'number' ? s.cargoFoldedL : null, bedL: typeof s.bed?.volumeL === 'number' ? s.bed.volumeL : null }));

const head = readFileSync('src/engine/content/caroptions.ts', 'utf8').split('// --- generated below ---')[0];
writeFileSync('src/engine/content/caroptions.ts', `${head}// --- generated below ---
export const CAR_OPTIONS: readonly CarOption[] = JSON.parse(${JSON.stringify(JSON.stringify(options))});

export const CAR_SPECS: readonly CarSpec[] = JSON.parse(${JSON.stringify(JSON.stringify(specs))});
`);
console.log(`Wrote ${options.length} priced options and ${specs.length} specs.`);
