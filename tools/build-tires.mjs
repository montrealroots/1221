// Builds src/engine/content/tirecatalog.ts (from 2026-10-05): passenger tires by make and model as products
// (`content/products.ts`), each market's offers a tire, from docs/research/catalog/tires-*.json. Every one was read at
// 215/55 R17 or the nearest size its maker sells, and SLATE prices every car's set at it.
//
// A tire keeps its season, the size read, its treadwear warranty in km where the maker or seller states one, and
// whether its price is fitted. Left out on review: Continental's WinterContact SI in America (read at $163 and $367),
// Sumitomo's HTR Enhance LX2 (an aggregate of several sellers, no seller's page), Yokohama's Avid Ascend GT (its
// maker's list price, not a shop's), Nankang's AS-1 (a summary that likely took another size's price), and Goodyear's Canadian warranty of "60,000 km", the American 60,000 miles misread.
// Run: node tools/build-tires.mjs
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';

const OUT = 'src/engine/content/tirecatalog.ts';
const slug = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
const num = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);
const MARKET = { US: 'us', CA: 'ca', GB: 'uk', IE: 'ie', MX: 'mx' };
const SEASONS = new Set(['all-season', 'all-weather', 'summer', 'winter']);
const MI = 1.609344;
// And any price read as "from" or a range, across several sellers, off a category page or approximately, and any size outside the three asked for
// (Barum's, read at 215/50 R17).
const SIZES = new Set(['215/55R17', '205/55R16', '225/45R17', '225/55R17', '215/55R16']);
const dropped = (t) => (t.brand === 'Continental' && t.model === 'WinterContact SI' && t.market === 'US') || (t.brand === 'Sumitomo' && /HTR Enhance/.test(t.model)) || (t.brand === 'Yokohama' && /Avid Ascend/.test(t.model)) || t.brand === 'Nankang'
  || /prices? from|from £|starting from|aggregat|multi-retailer|range|category|~/i.test(String(t.source)) || !SIZES.has(String(t.size ?? '215/55R17').replace(/\s+/g, ''));
const misread = (t) => t.brand === 'Goodyear' && t.market === 'CA' && t.warranty === 60000 && t.warrantyUnit === 'km';

const dir = 'docs/research/catalog';
const files = existsSync(dir) ? readdirSync(dir).filter((f) => /^tires-.*\.json$/.test(f)).sort() : [];
const products = new Map();
const offerIds = new Set();
for (const f of files) {
  const j = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
  const seller = (id) => (j.retailers ?? []).find((r) => r.id === id)?.name ?? id;
  for (const t of j.tires ?? []) {
    const market = MARKET[t.market];
    if (!market || !num(t.price) || !t.currency || !t.brand || !t.model || dropped(t)) continue;
    const key = `${slug(t.brand)}|${slug(t.model)}`;
    let p = products.get(key);
    const warranty = !misread(t) && num(t.warranty) ? Math.round(t.warrantyUnit === 'mi' ? t.warranty * MI : t.warranty) : null;
    if (!p) {
      p = {
        id: `tire-${slug(t.brand)}-${slug(t.model)}`.slice(0, 80), category: 'tire', brand: String(t.brand).trim(), family: null, model: String(t.model).trim(),
        attrs: { season: SEASONS.has(t.season) ? t.season : 'all-season', size: String(t.size ?? '215/55R17').replace(/\s+/g, ''), warrantyKm: warranty, euLabel: t.euLabel ?? null, loadSpeed: t.loadSpeed ?? null },
        variants: [], offers: [], url: t.url ?? null, status: t.confirmed ? 'verified' : 'secondhand',
      };
      products.set(key, p);
    } else if (p.attrs.warrantyKm === null && warranty) p.attrs = { ...p.attrs, warrantyKm: warranty };
    let id = `${market}-${p.id}`.slice(0, 90);
    for (let n = 2; offerIds.has(id); n += 1) id = `${`${market}-${p.id}`.slice(0, 86)}-${n}`;
    offerIds.add(id);
    p.offers.push({ id, market, seller: seller(t.retailer), channel: 'online', price: t.price, currency: t.currency, taxIncluded: market !== 'us' && market !== 'ca', url: t.url ?? null, read: j.read ?? '2026-10-05', status: t.confirmed ? 'verified' : 'secondhand', ...(t.installed === true ? { code: 'fitted' } : {}) });
  }
}
const list = [...products.values()];
writeFileSync(OUT, `/**
 * SLATE — passenger tires by make and model (from 2026-10-05, \`content/products.ts\`),
 * built by \`tools/build-tires.mjs\` from \`docs/research/catalog/tires-*.json\`.
 * Don't edit by hand; rebuild it.
 *
 * Each offer is one tire at 215/55 R17 or the nearest size its maker sells,
 * the size SLATE prices every car's set at; its treadwear warranty in km where
 * stated, and an offer whose price is fitted is marked \`code: 'fitted'\`.
 */

import type { CatalogProduct } from './products';

export const TIRE_PRODUCTS: readonly CatalogProduct[] = JSON.parse(${JSON.stringify(JSON.stringify(list))});
`);
const offers = list.flatMap((p) => p.offers);
console.log(`tires ${list.length} from ${new Set(list.map((p) => p.brand)).size} brands, offers ${offers.length}: ${['us', 'ca', 'uk', 'ie', 'mx'].map((m) => `${m} ${offers.filter((o) => o.market === m).length}`).join(', ')}; warranty read for ${list.filter((p) => p.attrs.warrantyKm).length}`);
