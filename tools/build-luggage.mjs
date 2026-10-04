// Builds src/engine/content/luggagecatalog.ts (from 2026-10-02; the product model from 2026-10-04): suitcases, duffels and
// backpacks as products with their variants and each market's offers (`content/products.ts`), from
// docs/research/world/research-luggage.json and every docs/research/catalog/luggage-*.json tranche. A product whose liters
// weren't read isn't sold here (a bag's liters are what packing reads), nor an offer without a price. Each offer keeps the
// id it had as a piece, so a bag in a save from before is still found.
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';

const OUT = 'src/engine/content/luggagecatalog.ts';
const slug = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
const MARKET = { US: 'us', CA: 'ca', UK: 'uk', IE: 'ie', MX: 'mx', us: 'us', ca: 'ca', uk: 'uk', ie: 'ie', mx: 'mx', gb: 'uk', GB: 'uk' };
const TYPES = new Set(['carry-on', 'underseat', 'medium', 'large', 'duffel', 'backpack', 'garment']);

/** Products by brand and model, merged across sources. */
const products = new Map();
function productFor(brand, model, family, attrs, url, status) {
  const key = `${slug(brand)}|${slug(model)}`;
  let p = products.get(key);
  if (!p) {
    p = { id: `${slug(brand)}-${slug(model)}`.slice(0, 80), category: 'luggage', brand, family: family ?? null, model, attrs: {}, variants: [], offers: [], url: url ?? null, status };
    products.set(key, p);
  }
  for (const [k, v] of Object.entries(attrs)) if (p.attrs[k] === undefined || p.attrs[k] === null) p.attrs[k] = v;
  if (status === 'verified') p.status = 'verified';
  return p;
}
const offerIds = new Set();
function addOffer(p, o) {
  // The id a piece had: market, brand, model; a second seller in the same market adds its name.
  let id = `${o.market}-${slug(p.brand)}-${slug(p.model)}`.slice(0, 80);
  if (offerIds.has(id)) id = `${id.slice(0, 70)}-${slug(o.seller)}`.slice(0, 80);
  for (let n = 2; offerIds.has(id); n += 1) id = `${id.slice(0, 76)}-${n}`;
  offerIds.add(id);
  p.offers.push({ id, ...o });
}

// The first research, a row a market.
const old = JSON.parse(readFileSync('docs/research/world/research-luggage.json', 'utf8'));
for (const x of old.luggage) {
  if (!(typeof x.price === 'number' && x.price > 0 && typeof x.capacityL === 'number' && x.capacityL > 0)) continue;
  const cm = typeof x.dimensionsCm === 'string' ? x.dimensionsCm.match(/[\d.]+/g)?.map(Number) : null;
  const p = productFor(x.brand, x.model, null, {
    type: x.type, liters: x.capacityL, outsideL: cm && cm.length === 3 ? Math.round((cm[0] * cm[1] * cm[2]) / 100) / 10 : null,
    kg: typeof x.weightKg === 'number' ? x.weightKg : null,
  }, x.url ?? null, x.confirmed === true ? 'verified' : 'secondhand');
  addOffer(p, { market: MARKET[x.market], seller: x.retailer ?? x.brand, channel: 'online', price: x.price, currency: x.currency, taxIncluded: x.taxIncluded === true, url: x.url ?? null, read: x.date ?? old.read ?? '2026-10-02', status: x.confirmed === true ? 'verified' : 'secondhand' });
}

// The tranches, in the product model.
const dir = 'docs/research/catalog';
const tranches = existsSync(dir) ? readdirSync(dir).filter((f) => /^luggage-.*\.json$/.test(f)).sort() : [];
for (const f of tranches) {
  const j = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
  for (const x of j.products ?? []) {
    if (!x.brand || !x.model || !(typeof x.liters === 'number' && x.liters > 0)) continue;
    const cm = Array.isArray(x.outsideCm) && x.outsideCm.length === 3 && x.outsideCm.every((n) => typeof n === 'number') ? x.outsideCm : null;
    const p = productFor(x.brand, x.model, x.family, {
      type: TYPES.has(x.type) ? x.type : 'carry-on', liters: x.liters, outsideL: cm ? Math.round((cm[0] * cm[1] * cm[2]) / 100) / 10 : null,
      kg: typeof x.kg === 'number' ? x.kg : null, material: x.material ?? null, wheels: typeof x.wheels === 'number' ? x.wheels : null,
      expandable: typeof x.expandable === 'boolean' ? x.expandable : null, warrantyYears: typeof x.warrantyYears === 'number' ? x.warrantyYears : null,
    }, x.url ?? null, x.status === 'verified' ? 'verified' : 'secondhand');
    for (const v of x.variants ?? []) {
      if (!v?.color) continue;
      const vid = `${p.id}-${slug(v.color)}`.slice(0, 100);
      if (!p.variants.some((y) => y.id === vid)) p.variants.push({ id: vid, attrs: { color: String(v.color) } });
    }
    for (const o of x.offers ?? []) {
      const market = MARKET[o.market];
      if (!market || !(typeof o.price === 'number' && o.price > 0)) continue;
      addOffer(p, { market, seller: o.seller ?? x.brand, channel: o.channel === 'store' ? 'store' : 'online', price: o.price, currency: o.currency, taxIncluded: o.taxIncluded === true, url: o.url ?? null, read: j.read ?? '2026-10-04', status: o.status === 'verified' ? 'verified' : 'secondhand' });
    }
  }
}

const list = [...products.values()].filter((p) => p.offers.length > 0);
// Each offer as the piece the bag system reads.
const pieces = list.flatMap((p) => p.offers.map((o) => ({
  id: o.id, productId: p.id, country: o.market, brand: p.brand, model: p.model, type: p.attrs.type, retailer: o.seller,
  liters: p.attrs.liters, outsideL: p.attrs.outsideL ?? null, kg: p.attrs.kg ?? null,
  price: o.price, currency: o.currency, taxIncluded: o.taxIncluded, url: o.url, confirmed: o.status === 'verified',
})));

const body = `/**
 * SLATE — suitcases, duffels and backpacks for sale (from 2026-10-02; as
 * products, variants and offers from 2026-10-04, \`content/products.ts\`),
 * built by \`tools/build-luggage.mjs\` from \`docs/research/world/research-luggage.json\`
 * and the tranches in \`docs/research/catalog/luggage-*.json\`. Don't edit by
 * hand; rebuild it.
 *
 * Each product at its makers' and retailers' own pages, America's and
 * Canada's offers before tax, the others' with it; its liters as its maker
 * publishes them, its weight empty, the room it takes up from its outside
 * measure where that was read, and the colors it's offered in. A product
 * whose liters weren't read isn't sold here, since packing reads them.
 */

import type { CatalogProduct } from './products';

export interface LuggagePiece {
  id: string; productId: string; country: string; brand: string; model: string; type: string; retailer: string | null;
  liters: number; outsideL: number | null; kg: number | null;
  price: number; currency: string; taxIncluded: boolean; url: string | null; confirmed: boolean;
}

export const LUGGAGE_PRODUCTS: readonly CatalogProduct[] = JSON.parse(${JSON.stringify(JSON.stringify(list))});
export const LUGGAGE: readonly LuggagePiece[] = JSON.parse(${JSON.stringify(JSON.stringify(pieces))});
`;
writeFileSync(OUT, body);
console.log(`products ${list.length}, offers ${pieces.length}, brands ${new Set(list.map((p) => p.brand)).size}, tranches ${tranches.length}`);
