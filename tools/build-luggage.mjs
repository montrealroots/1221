// Builds src/engine/content/luggagecatalog.ts from docs/research/world/research-luggage.json (from 2026-10-02): suitcases,
// duffels and backpacks sold in the five markets, each at its regular price on its maker's or retailer's own page, with
// the liters its maker publishes. A piece whose liters or price wasn't read isn't sold here.
import { readFileSync, writeFileSync } from 'node:fs';

const OUT = 'src/engine/content/luggagecatalog.ts';
const j = JSON.parse(readFileSync('docs/research/world/research-luggage.json', 'utf8'));
const COUNTRY = { US: 'us', CA: 'ca', UK: 'uk', IE: 'ie', MX: 'mx' };
const slug = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
const seen = new Set();
const pieces = j.luggage.filter((x) => typeof x.price === 'number' && x.price > 0 && typeof x.capacityL === 'number' && x.capacityL > 0).map((x) => {
  let id = `${x.market.toLowerCase()}-${slug(x.brand)}-${slug(x.model)}`.slice(0, 80);
  for (let n = 2; seen.has(id); n += 1) id = `${id.slice(0, 76)}-${n}`;
  seen.add(id);
  const cm = typeof x.dimensionsCm === 'string' ? x.dimensionsCm.match(/[\d.]+/g)?.map(Number) : null;
  return {
    id, country: COUNTRY[x.market], brand: x.brand, model: x.model, type: x.type, retailer: x.retailer ?? null,
    liters: x.capacityL, outsideL: cm && cm.length === 3 ? Math.round((cm[0] * cm[1] * cm[2]) / 100) / 10 : null,
    kg: typeof x.weightKg === 'number' ? x.weightKg : null, price: x.price, currency: x.currency, taxIncluded: x.taxIncluded === true,
    url: x.url ?? null, confirmed: x.confirmed === true,
  };
});

const body = `/**
 * SLATE — suitcases, duffels and backpacks for sale (from 2026-10-02), built
 * by \`tools/build-luggage.mjs\` from \`docs/research/world/research-luggage.json\`.
 * Don't edit by hand; rebuild it.
 *
 * Each at its regular price on its maker's or retailer's own page (Amazon's,
 * Travelpro's, Away's, Monos's, IT Luggage's, John Lewis's, Antler's,
 * Samsonite's, American Tourister's, Brown Thomas's), America's and
 * Canada's before tax, the others' with it; its liters as its maker
 * publishes them, and the room it takes up from its outside measure where
 * that was read.
 */

export interface LuggagePiece {
  id: string; country: string; brand: string; model: string; type: string; retailer: string | null;
  liters: number; outsideL: number | null; kg: number | null;
  price: number; currency: string; taxIncluded: boolean; url: string | null; confirmed: boolean;
}

export const LUGGAGE: readonly LuggagePiece[] = JSON.parse(${JSON.stringify(JSON.stringify(pieces))});
`;
writeFileSync(OUT, body);
console.log('pieces', pieces.length);
