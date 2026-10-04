// Builds src/engine/content/appliancecatalog.ts (from 2026-10-04): washing machines, dryers and dishwashers as products
// (`content/products.ts`) with each market's offers, from every docs/research/catalog/appliances-*.json tranche, and the
// energy a cycle each one's label gives, from appliance-labels.json: ENERGY STAR's certified lists (America's and
// Canada's) and EPREL's registry (the EU's and Northern Ireland's), matched by the model's own number or a region's.
//
// Kept out, and why: a washer dryer in one drum, as SLATE's laundry is a washer and a dryer apart; and a gas dryer, whose
// gas no bill here reads. An offer without a regular price isn't sold here. A product read twice (the same brand and
// model) is one product, its offers together.
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';

const OUT = 'src/engine/content/appliancecatalog.ts';
const slug = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
const MARKETS = new Set(['us', 'ca', 'uk', 'ie', 'mx']);
const KINDS = new Set(['washer', 'dryer', 'dishwasher']);
const num = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);
const code = (s) => String(s ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const brandKey = (s) => slug(String(s ?? '').replace(/&/g, ' and ')).replace(/-+$/, '');

const dir = 'docs/research/catalog';
const tranches = existsSync(dir) ? readdirSync(dir).filter((f) => /^appliances-.*\.json$/.test(f)).sort() : [];
const products = new Map();
const offerIds = new Set();
const left = { 'a washer dryer': 0, 'a gas dryer': 0 };
for (const f of tranches) {
  const j = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
  for (const x of j.products ?? []) {
    if (!x.brand || !x.model || !KINDS.has(x.kind)) { if (x.kind === 'washer-dryer') left['a washer dryer'] += 1; continue; }
    if (x.kind === 'dryer' && x.fuel === 'gas') { left['a gas dryer'] += 1; continue; }
    const key = `${slug(x.brand)}|${slug(x.model)}`;
    let p = products.get(key);
    if (!p) {
      p = {
        id: `${slug(x.brand)}-${slug(x.model)}`.slice(0, 80), category: 'appliances', brand: String(x.brand).trim(), family: x.series ?? null, model: String(x.model).trim(),
        attrs: {
          kind: x.kind, loadType: x.kind === 'washer' && ['front', 'top'].includes(x.loadType) ? x.loadType : null,
          dryerType: x.kind === 'dryer' && ['vented', 'condenser', 'heat-pump'].includes(x.dryerType) ? x.dryerType : null,
          capacityKg: num(x.capacityKg), capacityCuFt: num(x.capacityCuFt), placeSettings: num(x.placeSettings), year: num(x.year),
          kwhPerCycle: null, energyBasis: null, energyUrl: null,
        },
        codes: [], variants: [], offers: [], url: x.url ?? null, status: x.status === 'verified' ? 'verified' : 'secondhand',
      };
      products.set(key, p);
    }
    // Its model number, and each region's where it's sold under another: what an energy label is matched by.
    for (const c of [x.model, ...Object.values(x.regionalModels ?? {})]) if (code(c).length >= 6 && !p.codes.includes(code(c))) p.codes.push(code(c));
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
      // The model number it's sold under there, where the market's own differs from the product's.
      const local = String((x.regionalModels ?? {})[market] ?? '').trim();
      p.offers.push({ id, market, seller: o.seller ?? p.brand, channel: 'online', price: o.price, currency: o.currency, taxIncluded: o.taxIncluded === true, url: o.url ?? null, read: j.read ?? '2026-10-04', status: o.status === 'verified' ? 'verified' : 'secondhand', ...(local && code(local) !== code(p.model) ? { model: local } : {}) });
    }
  }
}

// The labels. ENERGY STAR gives a year's energy over the cycles the DOE's test procedure takes a year; EPREL a washer's
// and a dishwasher's per 100 cycles of the eco program, and a dryer's weighted year over its 160 cycles.
const L = JSON.parse(readFileSync(`${dir}/appliance-labels.json`, 'utf8'));
const ES_PAGE = { washer: 'certified-clothes-washers', dryer: 'certified-clothes-dryers', dishwasher: 'certified-residential-dishwashers' };
const ES_CYCLES = { washer: '295 washes', dryer: '283 dryings', dishwasher: '215 runs' };
const labels = [];
for (const [source, part] of [['es', L.es], ['eprel', L.eprel]]) {
  for (const [kind, brand, model, kwh, per, , fuel, id] of part.rows) {
    if (fuel === 'gas' || !num(kwh) || !num(per)) continue;
    const raw = String(model).toUpperCase();
    // An ENERGY STAR model number's * or # stands for a letter of a color or a variant: the model's own begins with what precedes it.
    const wild = (raw.match(/[*#]/g) ?? []).length;
    labels.push({
      kind, brand: brandKey(brand), full: code(raw), prefix: code(raw.split(/[*#]/)[0]), wild, kwhPerCycle: Math.round((kwh / per) * 1000) / 1000,
      basis: source === 'es' ? `ENERGY STAR: the DOE test’s yearly energy over its ${ES_CYCLES[kind]} a year` : kind === 'dryer' ? 'EU energy label (EPREL): its weighted yearly energy over 160 cycles' : 'EU energy label (EPREL): its energy over 100 cycles of the eco program',
      url: source === 'es' ? `https://www.energystar.gov/productfinder/product/${ES_PAGE[kind]}/details/${id}` : `https://eprel.ec.europa.eu/qr/${id}`,
    });
  }
}
for (const p of products.values()) {
  let best = null;
  for (const l of labels) {
    if (l.kind !== p.attrs.kind || l.brand !== brandKey(p.brand)) continue;
    for (const c of p.codes) {
      // A label's own code that begins with the model's (a maker's full code adds a region's letters), or a wildcard
      // label whose stem begins the model's, a letter or so for each wildcard.
      const extra = l.wild ? (c.startsWith(l.prefix) && c.length - l.prefix.length <= 3 * l.wild ? c.length - l.prefix.length : -1) : l.full.startsWith(c) ? l.full.length - c.length : -1;
      if (extra >= 0 && (!best || extra < best.extra)) best = { l, extra };
    }
  }
  if (best) { p.attrs.kwhPerCycle = best.l.kwhPerCycle; p.attrs.energyBasis = best.l.basis; p.attrs.energyUrl = best.l.url; }
}
for (const p of products.values()) delete p.codes;
const list = [...products.values()].filter((p) => p.offers.length > 0);
const body = `/**
 * SLATE — washing machines, dryers and dishwashers for sale (from 2026-10-04,
 * \`content/products.ts\`), built by \`tools/build-appliances.mjs\` from the
 * tranches in \`docs/research/catalog/appliances-*.json\` and the energy labels
 * in \`appliance-labels.json\`. Don't edit by hand; rebuild it.
 *
 * Each model at its maker's or a retailer's own price, America's and Canada's
 * before tax, the others' with it; its kind, drum or place settings; and the
 * energy a cycle its label gives where one was matched, which the month's bill
 * reads for a model fitted at home (\`systems/machines.ts\`).
 */

import type { CatalogProduct } from './products';

export const APPLIANCE_PRODUCTS: readonly CatalogProduct[] = JSON.parse(${JSON.stringify(JSON.stringify(list))});
`;
writeFileSync(OUT, body);
const kinds = {};
for (const p of list) kinds[p.attrs.kind] = (kinds[p.attrs.kind] ?? 0) + 1;
console.log(`products ${list.length} ${JSON.stringify(kinds)}, offers ${list.reduce((n, p) => n + p.offers.length, 0)}, brands ${new Set(list.map((p) => p.brand)).size}, with a label ${list.filter((p) => p.attrs.kwhPerCycle !== null).length}, tranches ${tranches.length}, left out ${JSON.stringify(left)}`);
