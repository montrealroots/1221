// Builds src/engine/content/restaurants.ts from
// docs/research/world/research-restaurants.json (Stage 4 of docs/BACKLOG.md,
// from 2026-10-01). Each restaurant keeps its name, town, address, cuisine,
// tier, menu with each item's price as read and where it was read, and
// whether it was read on its own page. An item whose price wasn't found
// keeps a null price: a screen says it isn't known, never that it's free.
import { readFileSync, writeFileSync } from 'node:fs';

const IN = 'docs/research/world/research-restaurants.json';
const OUT = 'src/engine/content/restaurants.ts';
const j = JSON.parse(readFileSync(IN, 'utf8'));

const TIERS = new Set(['fast', 'casual', 'mid', 'upscale']);
const restaurants = j.restaurants.filter((r) => TIERS.has(r.tier)).map((r) => ({
  id: r.id, name: r.name, cityId: r.cityId, address: r.address ?? null, neighborhood: r.neighborhood ?? null, cuisine: r.cuisine ?? null, tier: r.tier,
  menu: (r.menu ?? []).map((m) => ({ item: m.item, price: typeof m.price === 'number' && m.price > 0 ? m.price : null, note: m.note ?? null })),
  currency: r.currency, taxIncluded: r.taxIncluded === true,
  priceSource: r.priceSource ?? null, takeout: r.takeout !== false, delivery: r.delivery === true,
  url: r.url ?? null, date: r.dateRead ?? null, confirmed: r.confirmed === true,
}));

const body = `/**
 * SLATE — real restaurants in the business's towns (Stage 4 of
 * \`docs/BACKLOG.md\`), built by \`tools/build-restaurants.mjs\` from
 * \`docs/research/world/research-restaurants.json\`. Don't edit by hand;
 * rebuild it.
 *
 * Each menu item's price is the one read on the date given, where it says
 * (\`priceSource\`): the restaurant's own menu, or a delivery app's listing
 * for a chain that publishes none, which runs above its counter price. With
 * VAT or IVA in Britain, Ireland and Mexico; before sales tax in America and
 * Canada. A price that wasn't found is null.
 */

export type Tier = 'fast' | 'casual' | 'mid' | 'upscale';

export interface MenuItem { item: string; price: number | null; note: string | null }

export interface Restaurant {
  id: string; name: string; cityId: string; address: string | null; neighborhood: string | null; cuisine: string | null; tier: Tier;
  menu: readonly MenuItem[];
  currency: string; taxIncluded: boolean;
  priceSource: string | null; takeout: boolean; delivery: boolean;
  url: string | null; date: string | null; confirmed: boolean;
}

export const RESTAURANTS: readonly Restaurant[] = JSON.parse(${JSON.stringify(JSON.stringify(restaurants))});
`;
writeFileSync(OUT, body);
console.log('restaurants', restaurants.length, 'items', restaurants.reduce((s, r) => s + r.menu.length, 0));
