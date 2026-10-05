/**
 * Builds src/engine/content/kitchengearlineup.ts from the blenders and slow
 * cookers read at big retailers and makers in each market
 * (docs/research/catalog/kitchenware-*.json, from 2026-10-05), beside the
 * cheapest of each kind first read (`content/kitchengear.ts`). Run:
 * node tools/build-kitchenware.mjs
 *
 * A model without a regular price read isn't sold, and one whose name isn't a
 * blender's or a slow cooker's isn't taken: a multicooker sold as one is.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

const DIR = 'docs/research/catalog';
const slug = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const MARKETS = new Set(['us', 'ca', 'mx', 'uk', 'ie']);
const NAMED = { blender: /blender|licuadora/i, 'slow-cooker': /slow cooker|multi-?cooker|cocci[oó]n lenta/i };
const out = {};
const seen = new Set();
for (const f of existsSync(DIR) ? readdirSync(DIR).filter((x) => /^kitchenware-.*\.json$/.test(x)).sort() : []) {
  for (const p of JSON.parse(readFileSync(`${DIR}/${f}`, 'utf8')).products ?? []) {
    const market = String(p.market ?? '').toLowerCase();
    if (!MARKETS.has(market) || !NAMED[p.gear] || !NAMED[p.gear].test(p.name ?? '') || !(p.price > 0) || !p.currency || !p.brand) continue;
    const id = `${market}-${slug(p.brand)}-${slug(p.model ?? p.name)}-${slug(p.retailer ?? '')}`.slice(0, 90);
    if (seen.has(id)) continue;
    seen.add(id);
    (out[market] ??= []).push({ id, gear: p.gear, brand: p.brand, name: p.name, retailer: p.retailer ?? p.brand, price: p.price, currency: p.currency, taxIncluded: p.taxIncluded === true, confirmed: p.confirmed === true, url: p.url ?? null });
  }
}
for (const m of Object.keys(out)) out[m].sort((a, b) => a.price - b.price);
writeFileSync('src/engine/content/kitchengearlineup.ts', `/**
 * SLATE — blenders and slow cookers by make and model where you live, built
 * by \`tools/build-kitchenware.mjs\` from \`docs/research/catalog/kitchenware-*.json\`
 * (from 2026-10-05). Don't edit by hand. Each at its retailer's regular price;
 * America's and Canada's before sales tax.
 */

import type { GearOffer } from './kitchengear';

export const GEAR_LINEUP: Readonly<Record<string, readonly GearOffer[]>> = ${JSON.stringify(out, null, 2)};
`);
console.log(`${Object.values(out).flat().length} models from ${new Set(Object.values(out).flat().map((g) => g.brand)).size} brands`);
