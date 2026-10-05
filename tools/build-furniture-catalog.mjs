// Builds src/engine/content/furniturecatalog.ts from docs/research/world/research-furniture-catalog.json (from
// 2026-10-02): IKEA's pieces in the five countries SLATE furnishes in, at the regular price its own pages load, with
// their measurements as published and their seats as IKEA names them. A piece without a price isn't sold here.
// From 2026-10-05 also other makers' pieces, from docs/research/catalog/furniture-*.json, each at its retailer's own
// delivery fee; a piece whose retailer's fee wasn't read isn't sold, nor one without a price or its width and depth.
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

const OUT = 'src/engine/content/furniturecatalog.ts';
const j = JSON.parse(readFileSync('docs/research/world/research-furniture-catalog.json', 'utf8'));
// What each kind is for in SLATE: seats to sit guests on, places at a table, or room to keep things in.
const SOLD = new Set(['sofa', 'armchair', 'diningChair', 'officeChair', 'diningTable', 'wardrobe', 'wardrobeFrame', 'chestOfDrawers', 'bookcase']);
const COUNTRY = { US: 'us', CA: 'ca', MX: 'mx', UK: 'uk', IE: 'ie' };
const slug = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').replace(/[\s_/]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
const seen = new Set();
const pieces = j.products.filter((p) => SOLD.has(p.kind) && typeof p.price === 'number' && p.price > 0).map((p) => {
  let id = `${p.market.toLowerCase()}-${slug(p.name)}-${slug(p.articleNumber ?? p.variant ?? '')}`.slice(0, 80);
  for (let n = 2; seen.has(id); n += 1) id = `${id.slice(0, 76)}-${n}`;
  seen.add(id);
  return {
    id, country: COUNTRY[p.market], kind: p.kind, name: p.name, type: p.productType ?? null, variant: p.variant ?? null, article: p.articleNumber ?? null,
    price: p.price, currency: p.currency, taxIncluded: p.taxIncluded === true,
    cm: [p.widthCm ?? null, p.depthCm ?? null, p.heightCm ?? null],
    seats: typeof p.seats === 'number' ? p.seats : null,
    holdsL: typeof p.outsideVolumeLitres === 'number' ? p.outsideVolumeLitres : null,
    url: p.source ?? null,
    brand: 'IKEA', retailer: 'IKEA', flatPack: true, delivery: null,
  };
});
/**
 * IKEA's width a seat: the median, over its sofas whose seats it names, of the width over the seats. A sofa whose
 * maker names no seat count takes its width over that, rounded down, at least two; SLATE's estimate from IKEA's own.
 */
const IKEA_CM_A_SEAT = (() => { const xs = pieces.filter((p) => p.kind === 'sofa' && p.seats && p.cm[0]).map((p) => p.cm[0] / p.seats).sort((a, b) => a - b); return xs[xs.length >> 1]; })();
function seatsOf(p, w) {
  const cushions = /cushion/i.test(`${p.type ?? ''}`);
  const named = typeof p.seats === 'number' && p.seats > 0 && !cushions ? p.seats : seatsNamed(p);
  if (named) return { seats: named };
  if (p.kind === 'sofa' && IKEA_CM_A_SEAT && w && !/\b\d\s*piez|\bset\b/i.test(`${p.type ?? ''} ${p.name}`)) return { seats: Math.max(2, Math.floor(w / IKEA_CM_A_SEAT)), seatsEstimated: true };
  return { seats: null };
}
const DIR = 'docs/research/catalog';
const STORES = ['wardrobe', 'wardrobeFrame', 'chestOfDrawers', 'bookcase'];
const MARKET = { US: 'us', CA: 'ca', MX: 'mx', GB: 'uk', UK: 'uk', IE: 'ie' };
// The makers who sell only ready to assemble, as they describe themselves: their pieces come flat-packed where the
// page read didn't say.
const RTA = new Set(['Walker Edison', 'Bush Furniture', 'South Shore', 'Walmart (Mainstays)', 'Mainstays', 'Zinus', 'Sauder']);
/** Seats where the page gave none, read from the kind the maker names it: "3-seat", "3 seater", "3 plazas", a loveseat's two, a chair's one. */
function seatsNamed(p) {
  if (['armchair', 'diningChair', 'officeChair'].includes(p.kind)) return 1;
  const t = `${p.type ?? ''} ${p.name ?? ''}`.toLowerCase();
  // A set of pieces ("Sala 2 Piezas", a sofa and a loveseat) names no one piece's seats.
  if (/\b\d\s*piez|\bset\b|\b\d[- ]piece\b(?!.*modular)/.test(t)) return null;
  const n = t.match(/\b(\d)[\s-]*(?:seats?|seater|plazas?|person|people)\b/);
  if (n) return Number(n[1]);
  if (/\bloveseat|love seat|two-seat|2-seat\b/.test(t)) return 2;
  return null;
}
for (const f of existsSync(DIR) ? readdirSync(DIR).filter((x) => /^furniture-.*\.json$/.test(x)).sort() : []) {
  const r = JSON.parse(readFileSync(`${DIR}/${f}`, 'utf8'));
  const fees = new Map((r.retailers ?? []).map((x) => [`${x.market}|${x.retailer}`, x]));
  for (const p of r.products ?? []) {
    const country = MARKET[p.market];
    const fee = fees.get(`${p.market}|${p.retailer}`);
    if (!country || !SOLD.has(p.kind) || !p.brand || !p.name || p.brand === 'IKEA') continue;
    if (!(typeof p.price === 'number' && p.price > 0) || !(p.widthCm > 0 && p.depthCm > 0)) continue;
    if (!fee || typeof fee.deliveryFee !== 'number' || fee.deliveryFee < 0) continue;
    const id = `${country}-${slug(p.brand)}-${slug(p.name)}-${slug(p.type ?? '')}-${slug(p.variant ?? '')}`.replace(/-+$/, '').slice(0, 80);
    if (seen.has(id)) continue;
    seen.add(id);
    const [w, d, h] = [p.widthCm, p.depthCm, p.heightCm ?? null];
    pieces.push({
      id, country, kind: p.kind, name: p.name, type: p.type ?? null, variant: p.variant ?? null, article: null,
      price: p.price, currency: p.currency, taxIncluded: p.taxIncluded === true,
      // A seat count the page gave, unless it was the cushions; else the one its name gives; else a sofa's width over
      // IKEA's own width a seat, SLATE's estimate and marked so.
      cm: [w, d, h], ...seatsOf(p, w),
      // What it holds is its outside measure, as IKEA's: width by depth by height.
      holdsL: STORES.includes(p.kind) && h ? Math.round((w * d * h) / 1000) : null,
      url: p.url ?? null,
      brand: p.brand, retailer: p.retailer ?? p.brand, flatPack: p.flatPack === true || (p.flatPack == null && RTA.has(p.brand)), delivery: fee.deliveryFee,
    });
  }
}

const body = `/**
 * SLATE — IKEA's pieces where you live (from 2026-10-02), and from 2026-10-05
 * other makers' (\`docs/research/catalog/furniture-*.json\`), built by
 * \`tools/build-furniture-catalog.mjs\` from
 * \`docs/research/world/research-furniture-catalog.json\`. Don't edit by hand;
 * rebuild it.
 *
 * In each of the five countries, the two cheapest of a kind IKEA sold online
 * on 2026-10-02 and the middle one, and its best-known lines (BRIMNES,
 * KLEPPSTAD, HEMNES, BILLY, KALLAX), at the regular price its own pages
 * load; America's and Canada's before tax, the others' with VAT or IVA in.
 * Measurements as IKEA published them (America's from inches). Seats are
 * IKEA's own: a three-seat sofa seats three, and a four-person table four places. What a
 * wardrobe, a chest, a frame or a bookcase holds is its outside measure,
 * width by depth by height, the one figure here worked out rather than read.
 */

export type FurnitureKind = 'sofa' | 'armchair' | 'diningChair' | 'officeChair' | 'diningTable' | 'wardrobe' | 'wardrobeFrame' | 'chestOfDrawers' | 'bookcase';

export interface CatalogPiece {
  id: string; country: string; kind: FurnitureKind; name: string; type: string | null; variant: string | null; article: string | null;
  price: number; currency: string; taxIncluded: boolean;
  /** Width, depth and height, centimeters, where published. */
  cm: readonly [number | null, number | null, number | null];
  /** Places to sit, or at a table. */
  seats: number | null;
  /** A sofa's seats worked out from its width at IKEA's width a seat, where its maker names none (from 2026-10-05). */
  seatsEstimated?: boolean;
  /** Liters it holds: its outside measure. */
  holdsL: number | null;
  url: string | null;
  /** Who makes it and who sells it (from 2026-10-05): IKEA's own, or a maker's at a retailer. */
  brand: string;
  retailer: string;
  /** Delivered flat-packed, to be put together: IKEA's always; another maker's where it says so, else delivered built. */
  flatPack: boolean;
  /** The retailer's own delivery fee, in its currency; IKEA's large-item rate where null (\`content/furniture.ts\`). */
  delivery: number | null;
}

export const FURNITURE_CATALOG: readonly CatalogPiece[] = JSON.parse(${JSON.stringify(JSON.stringify(pieces))});
`;
writeFileSync(OUT, body);
console.log('pieces', pieces.length);
