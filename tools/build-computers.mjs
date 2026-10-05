// Builds src/engine/content/computercatalog.ts (from 2026-10-05): personal computers by make and model as products
// (`content/products.ts`), each market's offers, from docs/research/catalog/computers-*.json. A computer keeps its kind
// (laptop, desktop, mini PC, all-in-one, tablet), processor, memory, storage, graphics and whether they're a card of
// their own, screen, system and weight, as its seller states them.
//
// Left out on review: any price read as "from" or "starting at" a configurator's, an MSRP, or summarized
// across several sellers; Wacom's (a review's figure), Jumper's and Blackview's (an Amazon coupon on a regular price not shown) and
// Medion's (a market-wide statement, no listing); ROG and Predator are counted as Asus's and Acer's, whose lines they are, and Surface as Microsoft's.
// Run: node tools/build-computers.mjs
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';

const OUT = 'src/engine/content/computercatalog.ts';
const slug = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
const num = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);
const MARKET = { US: 'us', CA: 'ca', GB: 'uk', IE: 'ie', MX: 'mx' };
const KINDS = new Set(['laptop', 'desktop', 'mini-pc', 'all-in-one', 'tablet']);
const BRAND = { ROG: 'Asus', Predator: 'Acer', 'Microsoft Surface': 'Microsoft', 'Overclockers UK (Titan)': 'Overclockers UK', iBuyPower: 'iBUYPOWER', Geekom: 'GEEKOM' };
const weak = (p) => /prices? from|starting (at|from)|starts at|MSRP|several sellers/i.test(String(p.source)) || ['Wacom', 'Jumper', 'Blackview', 'Medion'].includes(p.brand);

const dir = 'docs/research/catalog';
const files = existsSync(dir) ? readdirSync(dir).filter((f) => /^computers-.*\.json$/.test(f)).sort() : [];
const products = new Map();
const offerIds = new Set();
for (const f of files) {
  const j = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
  const seller = (id) => (j.retailers ?? []).find((r) => r.id === id)?.name ?? id;
  for (const x of j.products ?? []) {
    const market = MARKET[x.market];
    if (!market || !KINDS.has(x.kind) || !num(x.price) || !x.currency || !x.brand || !x.model || weak(x)) continue;
    const brand = BRAND[String(x.brand).trim()] ?? String(x.brand).trim();
    const key = `${slug(brand)}|${slug(x.model)}|${x.ramGb ?? ''}|${x.storageGb ?? ''}`;
    let p = products.get(key);
    if (!p) {
      p = {
        id: `pc-${slug(brand)}-${slug(x.model)}${x.ramGb ? `-${x.ramGb}gb` : ''}${x.storageGb ? `-${x.storageGb}` : ''}`.slice(0, 80), category: 'computer', brand, family: null, model: String(x.model).trim(),
        attrs: { kind: x.kind, cpu: x.cpu ?? null, ramGb: num(x.ramGb), storageGb: num(x.storageGb), gpu: x.gpu ?? null, discrete: x.discreteGpu === true, screenIn: num(x.screenIn), os: x.os ?? null, weightKg: num(x.weightKg) },
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
 * SLATE — personal computers by make and model (from 2026-10-05, \`content/products.ts\`),
 * built by \`tools/build-computers.mjs\` from \`docs/research/catalog/computers-*.json\`.
 * Don't edit by hand; rebuild it.
 *
 * Each at its seller's own page in the configuration read, America's and
 * Canada's prices before tax; its graphics a card of their own (\`discrete\`)
 * where the seller names one.
 */

import type { CatalogProduct } from './products';

export const COMPUTER_PRODUCTS: readonly CatalogProduct[] = JSON.parse(${JSON.stringify(JSON.stringify(list))});
`);
const offers = list.flatMap((p) => p.offers);
console.log(`computers ${list.length} from ${new Set(list.map((p) => p.brand)).size} brands, offers ${offers.length}: ${['us', 'ca', 'uk', 'ie', 'mx'].map((m) => `${m} ${offers.filter((o) => o.market === m).length}`).join(', ')}; discrete ${list.filter((p) => p.attrs.discrete).length}`);
