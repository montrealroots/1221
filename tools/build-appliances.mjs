// Builds src/engine/content/appliancecatalog.ts (from 2026-10-05): washing machines, tumble dryers and dishwashers by
// make and model, the kinds SLATE fits to a home of one's own, from every docs/research/catalog/appliance-*.json tranche
// (appliance-power.json apart). Each model's energy a cycle, which each load bills:
// - ENERGY STAR's certified model of the same make and model (appliance-power.json, datasets bghd-e2wd, t9u7-4d2j and
//   q8py-6w3f): its annual kWh over the federal test procedure's cycles a year, 295 for a washer (appendix J2, which
//   ENERGY STAR certifies to; the DOE's 2022 rule's 234 belongs to appendix J, not yet in force: SLATE's reading of which
//   applies), 283 for a dryer (2011) and 215 for a dishwasher (ENERGY STAR's key criteria);
// - else its EU or UK energy label's kWh a hundred cycles, over a hundred;
// - else none, and the typical machine's figure (`MACHINES` in systems/dwelling.ts) stands, as for a machine with no model.
// Fridges are read but not built: SLATE doesn't fit a fridge.
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';

const OUT = 'src/engine/content/appliancecatalog.ts';
const slug = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
const norm = (s) => String(s ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const MARKETS = new Set(['us', 'ca', 'uk', 'ie', 'mx']);
const KINDS = new Set(['washer', 'dryer', 'dishwasher']);
const CYCLES = { washer: 295, dryer: 283, dishwasher: 215 };
const num = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);

const dir = 'docs/research/catalog';
const tranches = existsSync(dir) ? readdirSync(dir).filter((f) => /^appliance-.*\.json$/.test(f) && f !== 'appliance-power.json').sort() : [];
const POWER = existsSync(`${dir}/appliance-power.json`) ? JSON.parse(readFileSync(`${dir}/appliance-power.json`, 'utf8')).models ?? [] : [];
const products = new Map();
const offerIds = new Set();
let star = 0;
let label = 0;
for (const f of tranches) {
  const j = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
  for (const x of j.products ?? []) {
    if (!x.brand || !x.model || !KINDS.has(x.kind)) continue;
    const key = `${slug(x.brand)}|${slug(x.model)}`;
    let p = products.get(key);
    if (!p) {
      const code = norm(x.model);
      const hit = code.length >= 6 && POWER.find((m) => m.kind === x.kind && num(m.kwhPerYear) && norm(m.brand).slice(0, 3) === norm(x.brand).slice(0, 3) && (norm(m.model).startsWith(code) || code.startsWith(norm(m.model))));
      const fromLabel = num(x.kwhPer100Cycles) ? x.kwhPer100Cycles / 100 : null;
      const kwhPerCycle = hit ? Math.round((hit.kwhPerYear / CYCLES[x.kind]) * 1000) / 1000 : fromLabel;
      if (hit) star += 1; else if (fromLabel) label += 1;
      p = {
        id: `${slug(x.brand)}-${slug(x.model)}`.slice(0, 80), category: 'appliances', brand: String(x.brand).trim(), family: x.family ?? null, model: String(x.model).trim(),
        attrs: {
          kind: x.kind, capacity: num(x.capacity), capacityUnit: x.capacityUnit ?? null, loading: x.loading ?? null, fuel: x.fuel ?? null, energyLabel: x.energyLabel ?? null,
          kwhPerCycle, powerBasis: hit ? 'ENERGY STAR' : fromLabel ? 'EU label' : null,
        },
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
 * SLATE — washing machines, tumble dryers and dishwashers by make and model
 * (from 2026-10-05, \`content/products.ts\`), built by \`tools/build-appliances.mjs\`
 * from \`docs/research/catalog/appliance-*.json\`. Don't edit by hand; rebuild it.
 *
 * Each at its maker's or a retailer's own page, America's and Canada's prices
 * before tax, the others' with it; its capacity, loading or fuel, and its
 * energy a cycle (\`kwhPerCycle\`): ENERGY STAR's annual kWh over the federal
 * test's cycles a year (295 a washer, 283 a dryer, 215 a dishwasher), or its
 * EU label's kWh a hundred cycles; null where neither was read.
 */

import type { CatalogProduct } from './products';

export const APPLIANCE_PRODUCTS: readonly CatalogProduct[] = JSON.parse(${JSON.stringify(JSON.stringify(list))});
`;
writeFileSync(OUT, body);
console.log(`products ${list.length}, offers ${list.reduce((n, p) => n + p.offers.length, 0)}, brands ${new Set(list.map((p) => p.brand)).size}, kinds ${[...KINDS].map((k) => `${k} ${list.filter((p) => p.attrs.kind === k).length}`).join(' ')}, ENERGY STAR ${star}, label ${label}, tranches ${tranches.length}`);
