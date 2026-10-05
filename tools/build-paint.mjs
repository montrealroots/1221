// Builds src/engine/content/paintcatalog.ts (from 2026-10-05): interior wall paint by make and line as products
// (`content/products.ts`), each market's offers a can, from docs/research/catalog/paint-*.json. A paint keeps its
// finish, the can's liters and its maker's stated coverage, m² a liter a coat, where stated.
//
// Left out on review: a price not read (CIL's in Canada), a "from" price, an RRP or MSRP, or one summarized across
// several sellers, or one read off a single eBay listing (Edward Bulmer's). A sale or a buy-one-get-one with its regular price shown keeps the regular.
// Run: node tools/build-paint.mjs
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';

const OUT = 'src/engine/content/paintcatalog.ts';
const slug = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
const num = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);
const MARKET = { US: 'us', CA: 'ca', GB: 'uk', IE: 'ie', MX: 'mx' };
/** A US gallon in liters, and a square foot in m². */
const GALLON_L = 3.785411784;
const SQFT_M2 = 0.09290304;
const weak = (p) => /prices? from|starting (at|from)|\bRRP\b|MSRP|several sellers/i.test(String(p.source)) || /ebay/i.test(String(p.source));
const coverageOf = (p) => {
  const c = num(p.coverage);
  if (!c) return null;
  if (p.coverageUnit === 'm2-per-liter') return c;
  if (p.coverageUnit === 'sqft-per-gallon') return Math.round((c * SQFT_M2 / GALLON_L) * 100) / 100;
  return null;
};

const dir = 'docs/research/catalog';
const files = existsSync(dir) ? readdirSync(dir).filter((f) => /^paint-.*\.json$/.test(f)).sort() : [];
const products = new Map();
const offerIds = new Set();
for (const f of files) {
  const j = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
  const seller = (id) => (j.retailers ?? []).find((r) => r.id === id)?.name ?? id;
  for (const x of j.paints ?? []) {
    const market = MARKET[x.market];
    if (!market || !num(x.price) || !num(x.liters) || !x.currency || !x.brand || weak(x)) continue;
    const brand = String(x.brand).trim();
    const line = String(x.line ?? 'Interior').trim();
    const key = `${slug(brand)}|${slug(line)}|${slug(x.finish ?? '')}|${x.liters}`;
    let p = products.get(key);
    if (!p) {
      p = {
        id: `paint-${slug(brand)}-${slug(line)}-${slug(x.finish ?? '')}-${String(x.liters).replace('.', '_')}l`.slice(0, 90), category: 'paint', brand, family: null, model: line,
        attrs: { finish: x.finish ?? null, liters: x.liters, coverage: coverageOf(x), primer: x.primer === true },
        variants: [], offers: [], url: x.url ?? null, status: x.confirmed ? 'verified' : 'secondhand',
      };
      products.set(key, p);
    }
    let id = `${market}-${p.id}`.slice(0, 96);
    for (let n = 2; offerIds.has(id); n += 1) id = `${`${market}-${p.id}`.slice(0, 92)}-${n}`;
    offerIds.add(id);
    p.offers.push({ id, market, seller: seller(x.retailer), channel: 'online', price: x.price, currency: x.currency, taxIncluded: market !== 'us' && market !== 'ca', url: x.url ?? null, read: j.read ?? '2026-10-05', status: x.confirmed ? 'verified' : 'secondhand' });
  }
}
const list = [...products.values()];
writeFileSync(OUT, `/**
 * SLATE — interior wall paint by make and line (from 2026-10-05, \`content/products.ts\`),
 * built by \`tools/build-paint.mjs\` from \`docs/research/catalog/paint-*.json\`.
 * Don't edit by hand; rebuild it.
 *
 * Each offer is a can at its seller's own page, America's and Canada's prices
 * before tax; its liters, finish, and its maker's coverage (m² a liter a coat)
 * where stated.
 */

import type { CatalogProduct } from './products';

export const PAINT_PRODUCTS: readonly CatalogProduct[] = JSON.parse(${JSON.stringify(JSON.stringify(list))});
`);
const offers = list.flatMap((p) => p.offers);
console.log(`paints ${list.length} from ${new Set(list.map((p) => p.brand)).size} brands, offers ${offers.length}: ${['us', 'ca', 'uk', 'ie', 'mx'].map((m) => `${m} ${offers.filter((o) => o.market === m).length}`).join(', ')}; coverage read ${list.filter((p) => p.attrs.coverage).length}`);
