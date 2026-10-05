// Builds src/engine/content/gardencatalog.ts (from 2026-10-05): lawn mowers by make and model as products
// (`content/products.ts`), each market's offers, from docs/research/catalog/garden-*.json. A mower keeps its kind
// (reel, corded, battery, petrol, robot), cutting width, a corded one's watts (or amps at the mains' volts), a
// battery one's volts and amp-hours and whether the battery comes with it, a petrol one's cc, and a robot's rated lawn.
//
// Left out on review: prices read as a list price, an MSRP, a "starting" price, a figure cross-referenced from other
// sellers or a deal forum, or summarized across several sellers (Troy-Bilt's TB110, EGO's LM2102SP, EcoFlow's Blade in
// America, Husqvarna's LC221AH, Mammotion's LUBA mini in America, Mastercraft's push kit, Cobra's Mowbot 1200, AL-KO's
// Easy 3.22 E, Lawnflite's 53 cm, Murray's EQ2-300, Toro's 21771, Yard Force's EasyMow 260B, Snapper's two XD); Worx's
// WR150 in Canada, at C$1,798 against its bigger WR155's C$1,109.99; and a robot with no rated lawn read, which nothing
// could say covers a lawn.
// Run: node tools/build-garden.mjs
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';

const OUT = 'src/engine/content/gardencatalog.ts';
const slug = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
const num = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);
const MARKET = { US: 'us', CA: 'ca', GB: 'uk', IE: 'ie', MX: 'mx' };
/** The mains' volts a corded mower's amps are drawn at: North America's 120. */
const MAINS = { us: 120, ca: 120, mx: 127 };
const KIND = { reel: 'reel', corded: 'corded', battery: 'battery', gas: 'petrol', petrol: 'petrol', robot: 'robot' };
const ACRE_M2 = 4046.8564224;
const weak = (p) => /list pric|MSRP|starting price|cross-referenc|deal-tracking|retailer pricing f|summarizing retailer pricing|noting this Snapper/i.test(String(p.source))
  || ['Cobra|Mowbot 1200', 'AL-KO|Easy 3.22 E', 'Lawnflite|Rotary 53cm Petrol', 'Murray|EQ2-300', 'Toro|21771 Self Propelled Rotary'].includes(`${p.brand}|${p.model}`)
  || (p.brand === 'Worx' && p.market === 'CA' && /WR150/.test(p.model));

const dir = 'docs/research/catalog';
const files = existsSync(dir) ? readdirSync(dir).filter((f) => /^garden-.*\.json$/.test(f)).sort() : [];
const products = new Map();
const offerIds = new Set();
for (const f of files) {
  const j = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
  const seller = (id) => (j.retailers ?? []).find((r) => r.id === id)?.name ?? id;
  for (const x of j.products ?? []) {
    const market = MARKET[x.market];
    const kind = KIND[x.type];
    if (!market || !kind || !num(x.price) || !x.currency || weak(x)) continue;
    const robotM2 = num(x.robotAreaM2) ?? (num(x.robotAreaAcres) ? Math.round(x.robotAreaAcres * ACRE_M2) : null);
    if (kind === 'robot' && !robotM2) continue;
    const watts = num(x.watts) ?? (num(x.amps) && MAINS[market] ? Math.round(x.amps * MAINS[market]) : null);
    const key = `${slug(x.brand)}|${slug(x.model)}`;
    let p = products.get(key);
    if (!p) {
      p = {
        id: `mower-${slug(x.brand)}-${slug(x.model)}`.slice(0, 80), category: 'mower', brand: String(x.brand).trim(), family: null, model: String(x.model).trim(),
        attrs: { kind, widthCm: num(x.widthCm) ?? (num(x.widthIn) ? Math.round(x.widthIn * 2.54) : null), watts, wattsBasis: num(x.watts) ? 'read' : watts ? 'amps' : null, volts: num(x.volts), ampHours: num(x.ampHours), batteryIncluded: x.batteryIncluded === true, engineCc: num(x.engineCc), robotM2, wire: x.perimeterWire ?? null },
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
 * SLATE — lawn mowers by make and model (from 2026-10-05, \`content/products.ts\`),
 * built by \`tools/build-garden.mjs\` from \`docs/research/catalog/garden-*.json\`.
 * Don't edit by hand; rebuild it.
 *
 * Each at its seller's own page, America's and Canada's prices before tax.
 * A corded mower's watts are its maker's, or its amps at the mains' volts
 * (\`wattsBasis: 'amps'\`); a battery one's volts and amp-hours as stated; a
 * robot's lawn its rated area.
 */

import type { CatalogProduct } from './products';

export const GARDEN_PRODUCTS: readonly CatalogProduct[] = JSON.parse(${JSON.stringify(JSON.stringify(list))});
`);
const offers = list.flatMap((p) => p.offers);
console.log(`mowers ${list.length} from ${new Set(list.map((p) => p.brand)).size} brands, offers ${offers.length}: ${['us', 'ca', 'uk', 'ie', 'mx'].map((m) => `${m} ${offers.filter((o) => o.market === m).length}`).join(', ')}; kinds ${JSON.stringify(list.reduce((a, p) => ({ ...a, [p.attrs.kind]: (a[p.attrs.kind] ?? 0) + 1 }), {}))}`);
