// Builds src/engine/content/caraudiocatalog.ts (from 2026-10-05): aftermarket car audio by make and model as products
// (`content/products.ts`) — head units, speaker pairs and amplifiers — each market's offers, from
// docs/research/catalog/caraudio-*.json. A head unit keeps its screen, CarPlay and Android Auto and DIN size; a speaker
// pair its size, kind and RMS watts; an amplifier its channels and RMS watts a channel, as the seller states them.
//
// Left out on review: a price read as "from" or "starting at", an MSRP, or summarized across several sellers. A sale with
// its regular price struck through keeps the regular.
// Run: node tools/build-caraudio.mjs
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';

const OUT = 'src/engine/content/caraudiocatalog.ts';
const slug = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
const num = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);
const MARKET = { US: 'us', CA: 'ca', GB: 'uk', IE: 'ie', MX: 'mx' };
const PARTS = new Set(['head-unit', 'speakers', 'amplifier']);
const weak = (p) => /prices? from|starting (at|from)|starts at|MSRP|several sellers/i.test(String(p.source));

const dir = 'docs/research/catalog';
const files = existsSync(dir) ? readdirSync(dir).filter((f) => /^caraudio-.*\.json$/.test(f)).sort() : [];
const products = new Map();
const offerIds = new Set();
for (const f of files) {
  const j = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
  const seller = (id) => (j.retailers ?? []).find((r) => r.id === id)?.name ?? id;
  for (const x of j.products ?? []) {
    const market = MARKET[x.market];
    if (!market || !PARTS.has(x.part) || !num(x.price) || !x.currency || !x.brand || !x.model || weak(x)) continue;
    const brand = String(x.brand).trim();
    const key = `${slug(brand)}|${slug(x.model)}`;
    let p = products.get(key);
    if (!p) {
      p = {
        id: `car-audio-${slug(brand)}-${slug(x.model)}`.slice(0, 80), category: 'car-audio', brand, family: null, model: String(x.model).trim(),
        attrs: { part: x.part, screenIn: num(x.screenIn), carplay: x.carplay ?? null, androidAuto: x.androidAuto ?? null, din: x.din ?? null, sizeIn: num(x.sizeIn), kind: x.kind ?? null, rmsWatts: num(x.rmsWatts), channels: num(x.channels) },
        variants: [], offers: [], url: x.url ?? null, status: x.confirmed ? 'verified' : 'secondhand',
      };
      products.set(key, p);
    }
    let id = `${market}-${p.id}`.slice(0, 90);
    for (let n = 2; offerIds.has(id); n += 1) id = `${`${market}-${p.id}`.slice(0, 86)}-${n}`;
    offerIds.add(id);
    p.offers.push({ id, market, seller: seller(x.retailer), channel: 'online', price: x.price, currency: x.currency, taxIncluded: market !== 'us' && market !== 'ca', url: x.url ?? null, read: j.read ?? '2026-10-05', status: x.confirmed ? 'verified' : 'secondhand' });
  }
}
const list = [...products.values()];
writeFileSync(OUT, `/**
 * SLATE — aftermarket car audio by make and model (from 2026-10-05, \`content/products.ts\`),
 * built by \`tools/build-caraudio.mjs\` from \`docs/research/catalog/caraudio-*.json\`.
 * Don't edit by hand; rebuild it.
 *
 * Head units, speaker pairs and amplifiers, each at its seller's own page,
 * America's and Canada's prices before tax.
 */

import type { CatalogProduct } from './products';

export const CAR_AUDIO_PRODUCTS: readonly CatalogProduct[] = JSON.parse(${JSON.stringify(JSON.stringify(list))});
`);
const offers = list.flatMap((p) => p.offers);
console.log(`car audio ${list.length} from ${new Set(list.map((p) => p.brand)).size} brands, offers ${offers.length}: ${['us', 'ca', 'uk', 'ie', 'mx'].map((m) => `${m} ${offers.filter((o) => o.market === m).length}`).join(', ')}; parts ${JSON.stringify(list.reduce((a, p) => ({ ...a, [p.attrs.part]: (a[p.attrs.part] ?? 0) + 1 }), {}))}`);
