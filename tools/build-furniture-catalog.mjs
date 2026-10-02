// Builds src/engine/content/furniturecatalog.ts from docs/research/world/research-furniture-catalog.json (from
// 2026-10-02): IKEA's pieces in the five countries SLATE furnishes in, at the regular price its own pages load, with
// their measurements as published and their seats as IKEA names them. A piece without a price isn't sold here.
import { readFileSync, writeFileSync } from 'node:fs';

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
  };
});

const body = `/**
 * SLATE — IKEA's pieces where you live (from 2026-10-02), built by
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
  /** Liters it holds: its outside measure. */
  holdsL: number | null;
  url: string | null;
}

export const FURNITURE_CATALOG: readonly CatalogPiece[] = JSON.parse(${JSON.stringify(JSON.stringify(pieces))});
`;
writeFileSync(OUT, body);
console.log('pieces', pieces.length);
