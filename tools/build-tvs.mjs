// Builds src/engine/content/tvcatalog.ts (from 2026-10-04): televisions as products with their sizes, panels and the
// on-mode power their energy labels give, and each market's offers (`content/products.ts`), from every
// docs/research/catalog/tv-*.json tranche. An offer without a regular price isn't sold here. A product read twice (the
// same brand and model) is one product, its offers together.
//
// Its on-mode power (from 2026-10-05): the tranche's own label where read; else ENERGY STAR's certified set of the same
// make and model (docs/research/catalog/tv-power.json, the dataset pd96-rr3d); else an estimate from its screen's area at
// the median watts a square inch of every ENERGY STAR set (183 sets, 0.0699 W; the middle 80% run 0.056 to 0.092),
// marked so. The EU's EPREL labels need a registered API key, which this build hasn't had.
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';

const OUT = 'src/engine/content/tvcatalog.ts';
const slug = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
const MARKETS = new Set(['us', 'ca', 'uk', 'ie', 'mx']);
const PANELS = new Set(['LED', 'QLED', 'Mini-LED', 'OLED', 'QD-OLED', 'MicroLED']);
const num = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);

const dir = 'docs/research/catalog';
const tranches = existsSync(dir) ? readdirSync(dir).filter((f) => /^tv-.*\.json$/.test(f) && f !== 'tv-power.json').sort() : [];
const products = new Map();
const offerIds = new Set();
for (const f of tranches) {
  const j = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
  for (const x of j.products ?? []) {
    const size = num(x.sizeIn);
    if (!x.brand || !x.model || !size) continue;
    const key = `${slug(x.brand)}|${slug(x.model)}`;
    let p = products.get(key);
    if (!p) {
      p = {
        id: `${slug(x.brand)}-${slug(x.model)}`.slice(0, 80), category: 'televisions', brand: String(x.brand).trim(), family: x.series ?? null, model: String(x.model).trim(),
        attrs: {
          sizeIn: size, panel: PANELS.has(x.panel) ? x.panel : 'LED', resolution: x.resolution ?? null, refreshHz: num(x.refreshHz), year: num(x.year), smartOs: x.smartOs ?? null,
          onModeWatts: num(x.onModeWatts), powerBasis: num(x.onModeWatts) ? x.powerBasis ?? null : null,
        },
        variants: [], offers: [], url: x.url ?? null, status: x.status === 'verified' ? 'verified' : 'secondhand',
      };
      products.set(key, p);
    } else if (p.attrs.onModeWatts === null && num(x.onModeWatts)) { p.attrs.onModeWatts = num(x.onModeWatts); p.attrs.powerBasis = x.powerBasis ?? null; }
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
      p.offers.push({ id, market, seller: o.seller ?? p.brand, channel: 'online', price: o.price, currency: o.currency, taxIncluded: o.taxIncluded === true, url: o.url ?? null, read: j.read ?? '2026-10-04', status: o.status === 'verified' ? 'verified' : 'secondhand' });
    }
  }
}
const POWER = existsSync(`${dir}/tv-power.json`) ? JSON.parse(readFileSync(`${dir}/tv-power.json`, 'utf8')).models ?? [] : [];
const norm = (s) => String(s ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
// A 16:9 screen's area, square inches, from its diagonal.
const area = (d) => (d * d * 144) / 337;
const density = POWER.filter((m) => num(m.onModeWatts) && num(m.sizeIn)).map((m) => m.onModeWatts / area(m.sizeIn)).sort((a, b) => a - b);
const PER_SQ_IN = density.length ? density[density.length >> 1] : null;
let matched = 0;
let estimated = 0;
for (const p of products.values()) {
  if (p.attrs.onModeWatts !== null) continue;
  const code = norm(p.model);
  const hit = code.length >= 8 && POWER.find((m) => norm(m.brand).startsWith(norm(p.brand).slice(0, 4)) && num(m.onModeWatts) && (norm(m.model).startsWith(code) || code.startsWith(norm(m.model))));
  if (hit) { p.attrs.onModeWatts = hit.onModeWatts; p.attrs.powerBasis = 'ENERGY STAR on mode'; matched += 1; continue; }
  if (PER_SQ_IN) { p.attrs.onModeWatts = Math.round(area(p.attrs.sizeIn) * PER_SQ_IN * 10) / 10; p.attrs.powerBasis = 'estimate'; estimated += 1; }
}
const list = [...products.values()].filter((p) => p.offers.length > 0);
const body = `/**
 * SLATE — televisions for sale (from 2026-10-04, \`content/products.ts\`), built
 * by \`tools/build-tvs.mjs\` from the tranches in \`docs/research/catalog/tv-*.json\`.
 * Don't edit by hand; rebuild it.
 *
 * Each model at its maker's or a retailer's own page, America's and Canada's
 * prices before tax, the others' with it; its size, panel and resolution; and
 * its on-mode power, which watching it bills: its energy label's where read (the
 * EU and UK label's SDR figure, ENERGY STAR's or the FTC EnergyGuide's), or an
 * estimate from its screen's area at ENERGY STAR's median watts a square inch,
 * marked \`powerBasis: 'estimate'\`.
 */

import type { CatalogProduct } from './products';

export const TV_PRODUCTS: readonly CatalogProduct[] = JSON.parse(${JSON.stringify(JSON.stringify(list))});
`;
writeFileSync(OUT, body);
console.log(`products ${list.length}, offers ${list.reduce((n, p) => n + p.offers.length, 0)}, brands ${new Set(list.map((p) => p.brand)).size}, with watts ${list.filter((p) => p.attrs.onModeWatts).length} (ENERGY STAR matched ${matched}, estimated ${estimated}), tranches ${tranches.length}`);
