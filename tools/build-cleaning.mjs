// Builds src/engine/content/cleaning.ts from docs/research/world/research-household-supplies.json
// (the master plan's household supplies, from 2026-10-02): cleaning products at the grocery chains, each
// at its regular shelf price as the chain's own feed listed it, and what each town charges a household to
// take its rubbish away.
import { readFileSync, writeFileSync } from 'node:fs';
import { brandIndex } from './brands.mjs';

const OUT = 'src/engine/content/cleaning.ts';
const j = JSON.parse(readFileSync('docs/research/world/research-household-supplies.json', 'utf8'));
const slug = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
// A liquid detergent's washes where the pack doesn't print them: its millilitres over 32, the middle of the 27 to 37 ml a
// load the printed packs come to.
const ML_A_LOAD = 32;

// The brand each product's own name states (`tools/brands.mjs`, from 2026-10-04).
const BRANDS = brandIndex();

const seen = new Set();
const supplies = j.supplies.filter((p) => typeof p.price === 'number' && p.price > 0).map((p) => {
  let id = `${p.chain}-${slug(p.name)}`.slice(0, 80);
  for (let n = 2; seen.has(id); n += 1) id = `${p.chain}-${slug(p.name)}`.slice(0, 76) + `-${n}`;
  seen.add(id);
  // Detergents are counted in washes and cycles.
  const counted = p.kind === 'laundry-detergent' || p.kind === 'dishwasher-detergent';
  const sizeQty = counted ? (p.loads ?? (p.sizeUnit === 'ct' ? p.sizeQty : Math.round(p.sizeQty / ML_A_LOAD))) : p.sizeQty;
  return { id, chain: p.chain, market: p.market, name: p.name, brand: BRANDS.get(`${p.chain}|${p.market}|${p.name}`) ?? null, kind: p.kind, sizeQty, sizeUnit: counted ? 'ct' : p.sizeUnit, price: p.price, currency: p.currency, taxIncluded: p.taxIncluded === true, url: p.url ?? null, date: p.read ?? null, confirmed: p.confirmed === true };
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
