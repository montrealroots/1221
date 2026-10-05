// Builds src/engine/content/audiocatalog.ts (from 2026-10-05): home speakers, soundbars and speaker pairs as products,
// with their kind, whether sold as a pair, and the amplifier power their makers state, and each market's offers
// (`content/products.ts`), from every docs/research/catalog/audio-*.json tranche. An offer without a regular price isn't
// sold here. A product read twice (the same brand and model) is one product, its offers together.
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';

const OUT = 'src/engine/content/audiocatalog.ts';
const slug = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
const MARKETS = new Set(['us', 'ca', 'uk', 'ie', 'mx']);
const TYPES = new Set(['wireless', 'smart', 'bookshelf', 'floorstanding', 'soundbar', 'powered', 'portable']);
const num = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);

const dir = 'docs/research/catalog';
const tranches = existsSync(dir) ? readdirSync(dir).filter((f) => /^audio-.*\.json$/.test(f)).sort() : [];
const products = new Map();
const offerIds = new Set();
for (const f of tranches) {
  const j = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
  for (const x of j.products ?? []) {
    if (!x.brand || !x.model) continue;
    const key = `${slug(x.brand)}|${slug(x.model)}`;
    let p = products.get(key);
    if (!p) {
      p = {
        id: `${slug(x.brand)}-${slug(x.model)}`.slice(0, 80), category: 'audio', brand: String(x.brand).trim(), family: x.family ?? null, model: String(x.model).trim(),
        attrs: { type: TYPES.has(x.type) ? x.type : 'wireless', pair: x.pair === true, watts: num(x.watts), standbyWatts: num(x.standbyWatts) },
        variants: [], offers: [], url: x.url ?? null, status: x.status === 'verified' ? 'verified' : 'secondhand',
      };
      products.set(key, p);
    }
    for (const c of Array.isArray(x.colors) ? x.colors : []) {
      const vid = `${p.id}-${slug(c)}`.slice(0, 100);
      if (!p.variants.some((v) => v.id === vid)) p.variants.push({ id: vid, attrs: { color: String(c) } });
    }
    for (const o of x.offers ?? []) {
      const market = String(o.market ?? '').toLowerCase();
      if (!MARKETS.has(market) || !num(o.price) || !o.currency) continue;
      let id = `${market}-${p.id}`.slice(0, 90);
      if (offerIds.has(id)) id = `${id.slice(0, 80)}-${slug(o.seller ?? 'seller')}`.slice(0, 100);
      for (let n = 2; offerIds.has(id); n += 1) id = `${id.slice(0, 96)}-${n}`;
      offerIds.add(id);
      p.offers.push({ id, market, seller: o.seller ?? p.brand, channel: 'online', price: o.price, currency: o.currency, taxIncluded: o.taxIncluded === true, url: o.url ?? null, read: j.read ?? '2026-10-05', status: o.status === 'verified' ? 'verified' : 'secondhand', ...(o.code ? { code: String(o.code) } : {}) });
    }
  }
}
const list = [...products.values()].filter((p) => p.offers.length > 0);
const body = `/**
 * SLATE — home speakers, soundbars and speaker pairs for sale (from 2026-10-05,
 * \`content/products.ts\`), built by \`tools/build-audio.mjs\` from the tranches
 * in \`docs/research/catalog/audio-*.json\`. Don't edit by hand; rebuild it.
 *
 * Each at its maker's or a retailer's own page, America's and Canada's prices
 * before tax, the others' with it; its kind, whether sold as a pair, the
 * amplifier power its maker states, and the colors it comes in. No maker read
 * states a speaker's standby power, so none is billed.
 */

import type { CatalogProduct } from './products';

export const AUDIO_PRODUCTS: readonly CatalogProduct[] = JSON.parse(${JSON.stringify(JSON.stringify(list))});
`;
writeFileSync(OUT, body);
console.log(`products ${list.length}, offers ${list.reduce((n, p) => n + p.offers.length, 0)}, brands ${new Set(list.map((p) => p.brand)).size}, tranches ${tranches.length}`);
