// Builds src/engine/content/lightingcatalog.ts (from 2026-10-05): light bulbs and lamps as products
// (`content/products.ts`), each market's offers, from docs/research/world/research-lighting-bulbs.json and
// research-lighting-lamps.json. A bulb keeps its draw, light, rated life, base and pack; a lamp its kind, how many
// bulbs it takes and of what base, the most watts it takes, and an LED built in.
//
// What the research couldn't read is filled, and said to be filled:
// - a bulb sold by the incandescent it replaces ("60-watt equivalent") and no draw stated takes the light that
//   replacement gives (ENERGY STAR's and the DOE's equivalences: 40 W 450 lm, 60 W 800, 75 W 1,100, 100 W 1,600),
//   and its draw is the median of the rated LEDs giving that light within 15%, SLATE's estimate;
// - an LED with no rated life stated takes ENERGY STAR's least for a lamp it certifies, 15,000 hours, SLATE's estimate.
// Left out on review: a halogen at 15 lumens a watt, under America's 45 since 2023-08-01 and so not sold; a
// refrigerator's bulb, which no lamp takes; a base nothing in SLATE takes (E39, R7s); Tesco's two 60p bulbs, a
// clearance price; a Philips Hue bulb read at MXN 2,809, the same maker's bigger bulb MXN 909 on the same page; and the
// lamps priced from a range, a "from" price or a neighbouring listing.
// Run: node tools/build-lighting.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const OUT = 'src/engine/content/lightingcatalog.ts';
const slug = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
const num = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);
const MARKET = { US: 'us', CA: 'ca', GB: 'uk', IE: 'ie', MX: 'mx' };
/** The socket a base fits: an Edison screw's 26 and 27 mm taken as one, the bayonet, the spot and the small screw. */
const FAMILY = { E26: 'edison', E27: 'edison', B22: 'bayonet', GU10: 'gu10', E14: 'e14', E12: 'e12' };
const EQUIVALENT_LM = { 40: 450, 60: 800, 75: 1100, 100: 1600 };
export const ENERGY_STAR_LIFE = 15000;

const B = JSON.parse(readFileSync('docs/research/world/research-lighting-bulbs.json', 'utf8'));
const L = JSON.parse(readFileSync('docs/research/world/research-lighting-lamps.json', 'utf8'));
const sellerOf = (list, id) => list.find((r) => r.id === id)?.name ?? id;

const bulbDropped = (b) => b.tech !== 'led' || !FAMILY[b.base] || (b.brand === 'Tesco' && b.price < 1) || (b.brand === 'Philips Hue' && b.market === 'MX' && b.price > 2000);
const bulbs = B.bulbs.filter((b) => !bulbDropped(b) && num(b.price) && MARKET[b.market]);
const lumensOf = (b) => num(b.lumens) ?? EQUIVALENT_LM[Number(String(b.name).match(/(\d+)[- ]?(?:-?Watt|W)\s*(?:Equivalent|EQ|Replacement)/i)?.[1])] ?? null;
const rated = bulbs.filter((b) => num(b.watts) && num(lumensOf(b)));
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? (s.length % 2 ? s[s.length >> 1] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : null; };
const drawOf = (b) => {
  if (num(b.watts)) return { watts: b.watts, basis: 'read' };
  const lm = lumensOf(b);
  if (!lm) return null;
  const like = rated.filter((r) => Math.abs(lumensOf(r) - lm) <= lm * 0.15).map((r) => r.watts);
  const w = median(like);
  return w ? { watts: Math.round(w * 10) / 10, basis: 'estimate' } : null;
};

const products = [];
const offerIds = new Set();
const offerId = (market, pid) => { let id = `${market}-${pid}`.slice(0, 90); for (let n = 2; offerIds.has(id); n += 1) id = `${`${market}-${pid}`.slice(0, 86)}-${n}`; offerIds.add(id); return id; };
let estimatedDraw = 0, estimatedLife = 0;
for (const b of bulbs) {
  const draw = drawOf(b);
  if (!draw) continue;
  if (draw.basis === 'estimate') estimatedDraw += 1;
  const life = num(b.lifeHours);
  if (!life) estimatedLife += 1;
  const market = MARKET[b.market];
  const id = `bulb-${slug(b.brand)}-${slug(b.name)}`.slice(0, 80);
  if (products.some((p) => p.id === id)) continue;
  products.push({
    id, category: 'bulb', brand: b.brand, family: null, model: b.name,
    attrs: { watts: draw.watts, wattsBasis: draw.basis, lumens: lumensOf(b), smart: b.smart === true, lifeHours: life ?? ENERGY_STAR_LIFE, lifeBasis: life ? 'read' : 'estimate', kelvin: num(b.kelvin), base: b.base, socket: FAMILY[b.base], pack: Math.max(1, Math.round(b.pack ?? 1)) },
    variants: [], url: b.url ?? null, status: b.confirmed ? 'verified' : 'secondhand',
    offers: [{ id: offerId(market, id), market, seller: sellerOf(B.retailers, b.retailer), channel: 'online', price: b.price, currency: b.currency, taxIncluded: market !== 'us' && market !== 'ca', url: b.url ?? null, read: B.read ?? '2026-10-05', status: b.confirmed ? 'verified' : 'secondhand' }],
  });
}

const lampDropped = (l) => /range|starting price|nearby|comparable|entry price/i.test(String(l.source));
for (const l of L.lamps.filter((x) => !lampDropped(x) && num(x.price) && MARKET[x.market])) {
  const market = MARKET[l.market];
  const id = `lamp-${slug(l.brand)}-${slug(l.name)}`.slice(0, 80);
  if (products.some((p) => p.id === id)) continue;
  // IKEA's lamps outside America take its E27 bulb: the research filed them E26 throughout.
  const base = l.brand === 'IKEA' && (market === 'uk' || market === 'ie') && l.base === 'E26' ? 'E27' : l.base ?? null;
  const integrated = num(l.integratedLedWatts) !== null || (l.bulbIncluded === true && !base && /LED/i.test(l.name));
  products.push({
    id, category: 'lamp', brand: l.brand, family: null, model: l.name,
    attrs: { type: l.type, base, socket: base ? FAMILY[base] ?? null : null, bulbs: integrated ? 0 : Math.max(1, Math.round(l.bulbs ?? 1)), maxWatts: num(l.maxWatts), bulbIncluded: l.bulbIncluded === true, ledWatts: num(l.integratedLedWatts), integrated, heightCm: num(l.heightCm) },
    variants: (Array.isArray(l.finishes) ? l.finishes : []).map((f) => ({ id: `${id}-${slug(f)}`.slice(0, 100), attrs: { color: String(f) } })),
    url: l.url ?? null, status: l.confirmed ? 'verified' : 'secondhand',
    offers: [{ id: offerId(market, id), market, seller: sellerOf(L.retailers, l.retailer), channel: 'online', price: l.price, currency: l.currency, taxIncluded: market !== 'us' && market !== 'ca', url: l.url ?? null, read: L.read ?? '2026-10-05', status: l.confirmed ? 'verified' : 'secondhand' }],
  });
}

const body = `/**
 * SLATE — light bulbs and lamps for sale (from 2026-10-05, \`content/products.ts\`),
 * built by \`tools/build-lighting.mjs\` from \`docs/research/world/research-lighting-bulbs.json\`
 * and \`research-lighting-lamps.json\`. Don't edit by hand; rebuild it.
 *
 * A bulb's draw is its package's where read, or (\`wattsBasis: 'estimate'\`) the
 * median of the rated LEDs giving its light; its rated life is its package's,
 * or ENERGY STAR's least, 15,000 hours (\`lifeBasis: 'estimate'\`). A lamp
 * takes its bulbs of its base, up to its stated watts; one with an LED built
 * in takes none.
 */

import type { CatalogProduct } from './products';

export const LIGHTING_PRODUCTS: readonly CatalogProduct[] = JSON.parse(${JSON.stringify(JSON.stringify(products))});
`;
writeFileSync(OUT, body);
const bulbsOut = products.filter((p) => p.category === 'bulb'), lampsOut = products.filter((p) => p.category === 'lamp');
console.log(`bulbs ${bulbsOut.length} from ${new Set(bulbsOut.map((p) => p.brand)).size}, lamps ${lampsOut.length} from ${new Set(lampsOut.map((p) => p.brand)).size}, brands ${new Set(products.map((p) => p.brand)).size}; draw estimated ${estimatedDraw}, life estimated ${estimatedLife}`);
