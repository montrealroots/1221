// Builds src/engine/content/cleaning.ts from docs/research/world/research-household-supplies.json
// (the master plan's household supplies, from 2026-10-02): cleaning products at the grocery chains, each
// at its regular shelf price as the chain's own feed listed it, and what each town charges a household to
// take its rubbish away.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const OUT = 'src/engine/content/cleaning.ts';
const j = JSON.parse(readFileSync('docs/research/world/research-household-supplies.json', 'utf8'));
const slug = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
// A liquid detergent's washes where the pack doesn't print them: its millilitres over 32, the middle of the 27 to 37 ml a
// load the printed packs come to.
const ML_A_LOAD = 32;

const seen = new Set();
// Each product's brand as its own name states it (`research-brands-cleaning.json`, read and corrected 2026-10-05).
const BRANDS = new Map(JSON.parse(readFileSync('docs/research/world/research-brands-cleaning.json', 'utf8')).items.map((i) => [`${i.chain}|${i.name}`, i.brand ?? null]));
// And from 2026-10-05 more brands at the same chains (`research-household-supplies-2.json`), each with its brand read.
const MORE = 'docs/research/world/research-household-supplies-2.json';
// And more products from the same brands (`research-household-supplies-3.json`, from 2026-10-05).
const DEEPER = 'docs/research/world/research-household-supplies-3.json';
const all = [...j.supplies, ...[MORE, DEEPER].flatMap((f) => (existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')).supplies ?? [] : []))];
// The second file's sizes in the first's units: fluid ounces and liters in milliliters, kilograms in grams. A powder
// detergent with no washes printed is left out: its grams aren't loads.
const UNIT = { 'fl oz': ['ml', 29.5735], l: ['ml', 1000], kg: ['g', 1000] };
const norm = (p) => { const u = UNIT[String(p.sizeUnit).toLowerCase()]; return u ? { ...p, sizeQty: Math.round(p.sizeQty * u[1]), sizeUnit: u[0] } : p; };
const supplies = all.map(norm).filter((p) => !(p.kind === 'laundry-detergent' && p.sizeUnit === 'g' && !p.loads)).filter((p) => typeof p.price === 'number' && p.price > 0).map((p) => {
  let id = `${p.chain}-${slug(p.name)}`.slice(0, 80);
  for (let n = 2; seen.has(id); n += 1) id = `${p.chain}-${slug(p.name)}`.slice(0, 76) + `-${n}`;
  seen.add(id);
  // Detergents are counted in washes and cycles.
  const counted = p.kind === 'laundry-detergent' || p.kind === 'dishwasher-detergent';
  const sizeQty = counted ? (p.loads ?? (p.sizeUnit === 'ct' ? p.sizeQty : Math.round(p.sizeQty / ML_A_LOAD))) : p.sizeQty;
  return { id, chain: p.chain, market: p.market, name: p.name, brand: BRANDS.get(`${p.chain}|${p.name}`) ?? p.brand ?? null, kind: p.kind, sizeQty, sizeUnit: counted ? 'ct' : p.sizeUnit, price: p.price, currency: p.currency, taxIncluded: p.taxIncluded === true, url: p.url ?? null, date: p.read ?? null, confirmed: p.confirmed === true };
});

const waste = j.waste.map((w) => ({ cityId: w.cityId, collector: w.collector, currency: w.currency, basis: w.chargeBasis, source: w.source, confirmed: w.confirmed === true }));

const body = `/**
 * SLATE — cleaning products and the rubbish collection (the master plan's
 * household supplies, from 2026-10-02), built by \`tools/build-cleaning.mjs\`
 * from \`docs/research/world/research-household-supplies.json\`. Don't edit by
 * hand; rebuild it.
 *
 * A product is a grocery chain's at its regular shelf price as its own feed
 * listed it (\`confirmed\`), or a price tracker's for Tesco. Detergents are
 * counted in the washes or cycles the pack prints; a liquid that prints none
 * is its millilitres over ${ML_A_LOAD}, the middle of what the printed packs come to.
 * Each town's collector and how it charges are the town's own pages'.
 */

import type { Toiletry } from './hygiene';

export interface WasteService { cityId: string; collector: string; currency: string; basis: string; source: string; confirmed: boolean }

export const CLEANING: readonly Toiletry[] = JSON.parse(${JSON.stringify(JSON.stringify(supplies))});

export const WASTE_SERVICES: readonly WasteService[] = JSON.parse(${JSON.stringify(JSON.stringify(waste))});
`;
writeFileSync(OUT, body);
console.log('cleaning', supplies.length, 'waste', waste.length);
