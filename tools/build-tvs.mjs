// Builds src/engine/content/tvcatalog.ts (from 2026-10-04): televisions as products with their sizes, panels and the
// on-mode power their energy labels give, and each market's offers (`content/products.ts`), from every
// docs/research/catalog/tv-*.json tranche. An offer without a regular price isn't sold here. A product read twice (the
// same brand and model) is one product, its offers together. A model whose page gave no on-mode power takes its
// energy label's from the labels kept beside the tranches: ENERGY STAR's certified list (`energystar-tvs.json`, the
// federal test procedure's figure) and the EU and UK labels read for the rest (`eu-labels-tvs.json`), matched by
// its own model number or a region's, and its size.
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';

const OUT = 'src/engine/content/tvcatalog.ts';
const slug = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
const MARKETS = new Set(['us', 'ca', 'uk', 'ie', 'mx']);
const PANELS = new Set(['LED', 'QLED', 'Mini-LED', 'OLED', 'QD-OLED', 'MicroLED']);
const num = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);
const code = (s) => String(s ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const brandKey = (s) => slug(String(s ?? '').split(',')[0]).replace(/-+$/, '');
// A panel as a page names it, and none where no page named one. Until 2026-10-04 a set whose panel went unread was
// filed LED: Loewe's Antares at 48 and 55 inches among them, read only on Richer Sounds' list, which Loewe's own page
// sells at 42 and 65 inches as an OLED.
const panelOf = (v) => (PANELS.has(v) ? v : null);

const dir = 'docs/research/catalog';
const tranches = existsSync(dir) ? readdirSync(dir).filter((f) => /^tv-.*\.json$/.test(f)).sort() : [];
const products = new Map();
const offerIds = new Set();
// Each product by its model codes, its own and its regions': a tranche that read a model under a region's code (Best
// Buy Canada's UN65DU7100FXZC for Samsung's UN65DU7100FXZA) adds its offers to the product that lists that code.
const byCode = new Map();
for (const f of tranches) {
  const j = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
  for (const x of j.products ?? []) {
    const size = num(x.sizeIn);
    if (!x.brand || !x.model || !size) continue;
    const key = `${slug(x.brand)}|${slug(x.model)}`;
    const known = [x.model, ...Object.values(x.regionalModels ?? {})].map((c) => byCode.get(`${brandKey(x.brand)}|${code(c)}`)).find((q) => q && Math.abs(q.attrs.sizeIn - size) <= 1);
    let p = products.get(key) ?? known;
    // Read under another code than the product's own: the offers here carry it as their market's.
    const readAs = p && code(p.model) !== code(x.model) ? String(x.model).trim() : '';
    if (!p) {
      p = {
        id: `${slug(x.brand)}-${slug(x.model)}`.slice(0, 80), category: 'televisions', brand: String(x.brand).trim(), family: x.series ?? null, model: String(x.model).trim(),
        attrs: {
          sizeIn: size, panel: panelOf(x.panel), resolution: x.resolution ?? null, refreshHz: num(x.refreshHz), year: num(x.year), smartOs: x.smartOs ?? null,
          onModeWatts: num(x.onModeWatts), powerBasis: num(x.onModeWatts) ? x.powerBasis ?? null : null,
          powerUrl: num(x.onModeWatts) ? x.powerUrl ?? null : null,
        },
        codes: [],
        variants: [], offers: [], url: x.url ?? null, status: x.status === 'verified' ? 'verified' : 'secondhand',
      };
      products.set(key, p);
    } else {
      // A later read fills what an earlier one left unstated (from 2026-10-04; until then only the power).
      const read = { panel: panelOf(x.panel), resolution: x.resolution ?? null, refreshHz: num(x.refreshHz), year: num(x.year), smartOs: x.smartOs ?? null };
      for (const [k, v] of Object.entries(read)) if (p.attrs[k] === null && v !== null) p.attrs[k] = v;
      if (p.attrs.onModeWatts === null && num(x.onModeWatts)) { p.attrs.onModeWatts = num(x.onModeWatts); p.attrs.powerBasis = x.powerBasis ?? null; p.attrs.powerUrl = x.powerUrl ?? null; }
    }
    // Its model number, and each region's where it's sold under another: what an energy label is matched by.
    for (const c of [x.model, ...Object.values(x.regionalModels ?? {})]) {
      if (code(c).length >= 7 && !p.codes.includes(code(c))) p.codes.push(code(c));
      if (code(c)) byCode.set(`${brandKey(x.brand)}|${code(c)}`, p);
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
      // The model number it's sold under there, where the market's own differs from the product's (a British QE for an American QN).
      const local = String((x.regionalModels ?? {})[market] ?? readAs).trim();
      p.offers.push({ id, market, seller: o.seller ?? p.brand, channel: 'online', price: o.price, currency: o.currency, taxIncluded: o.taxIncluded === true, url: o.url ?? null, read: j.read ?? '2026-10-04', status: o.status === 'verified' ? 'verified' : 'secondhand', ...(local && code(local) !== code(p.model) ? { model: local } : {}) });
    }
  }
}
// The labels, each with the codes it was certified or registered under. A model takes the closest: a label code that is
// its own, or begins with it (a maker's full code adds a region's letters), for a screen within an inch and a half.
const labels = [];
const es = existsSync(`${dir}/energystar-tvs.json`) ? JSON.parse(readFileSync(`${dir}/energystar-tvs.json`, 'utf8')) : { rows: [] };
for (const r of es.rows) {
  if (!num(r.onModeWattsFtp)) continue;
  labels.push({ brand: brandKey(r.brand), sizeIn: r.sizeIn, codes: [r.modelNumber, r.modelName, ...r.otherModels].map(code).filter(Boolean), watts: r.onModeWattsFtp,
    basis: 'ENERGY STAR: on-mode power per the federal test procedure', url: `https://www.energystar.gov/productfinder/product/certified-televisions/details/${r.pdId}` });
}
const eu = existsSync(`${dir}/eu-labels-tvs.json`) ? JSON.parse(readFileSync(`${dir}/eu-labels-tvs.json`, 'utf8')) : { labels: [] };
for (const l of eu.labels ?? []) {
  if (!num(l.onModeWatts)) continue;
  // A registry row's label is EPREL's own page for its registration number.
  labels.push({ brand: brandKey(l.brand), sizeIn: num(l.sizeIn), codes: [l.model, ...(l.otherModels ?? [])].map(code).filter(Boolean), watts: l.onModeWatts,
    basis: l.powerBasis ?? 'EU energy label (EPREL): on-mode power demand in SDR', url: l.powerUrl ?? (l.eprel ? `https://eprel.ec.europa.eu/qr/${l.eprel}` : null) });
}
let labeled = 0;
for (const p of products.values()) {
  if (p.attrs.onModeWatts !== null) continue;
  let best = null;
  for (const l of labels) {
    if (l.brand !== brandKey(p.brand) || (l.sizeIn !== null && Math.abs(l.sizeIn - p.attrs.sizeIn) > 1.5)) continue;
    for (const c of p.codes) for (const lc of l.codes) {
      if (!lc.startsWith(c)) continue;
      const extra = lc.length - c.length;
      if (!best || extra < best.extra) best = { l, extra };
    }
  }
  if (best) { p.attrs.onModeWatts = best.l.watts; p.attrs.powerBasis = best.l.basis; p.attrs.powerUrl = best.l.url; labeled += 1; }
}
for (const p of products.values()) delete p.codes;
const list = [...products.values()].filter((p) => p.offers.length > 0);
const body = `/**
 * SLATE — televisions for sale (from 2026-10-04, \`content/products.ts\`), built
 * by \`tools/build-tvs.mjs\` from the tranches in \`docs/research/catalog/tv-*.json\`.
 * Don't edit by hand; rebuild it.
 *
 * Each model at its maker's or a retailer's own page, America's and Canada's
 * prices before tax, the others' with it; its size, panel and resolution; and
 * its on-mode power where its energy label gives it (the EU and UK label's SDR
 * figure, ENERGY STAR's or the FTC EnergyGuide's), which watching it bills.
 */

import type { CatalogProduct } from './products';

export const TV_PRODUCTS: readonly CatalogProduct[] = JSON.parse(${JSON.stringify(JSON.stringify(list))});
`;
writeFileSync(OUT, body);
console.log(`products ${list.length}, offers ${list.reduce((n, p) => n + p.offers.length, 0)}, brands ${new Set(list.map((p) => p.brand)).size}, with watts ${list.filter((p) => p.attrs.onModeWatts).length} (${labeled} from the labels kept), tranches ${tranches.length}`);
