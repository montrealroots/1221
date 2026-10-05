/**
 * Builds src/engine/content/sportsgear.ts from the rackets, paddles and balls
 * read at sporting-goods retailers and makers in each market
 * (docs/research/catalog/sports-*.json, from 2026-10-05). Run:
 * node tools/build-sports.mjs
 *
 * One without a regular price read isn't sold.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

const DIR = 'docs/research/catalog';
const KINDS = new Set(['tennis-racket', 'tennis-balls', 'pickleball-paddle', 'pickleballs', 'basketball', 'football']);
const MARKETS = new Set(['us', 'ca', 'mx', 'uk', 'ie']);
const slug = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const out = [];
const seen = new Set();
for (const f of existsSync(DIR) ? readdirSync(DIR).filter((x) => /^sports-.*\.json$/.test(x)).sort() : []) {
  for (const p of JSON.parse(readFileSync(`${DIR}/${f}`, 'utf8')).products ?? []) {
    const market = String(p.market ?? '').toLowerCase();
    if (!KINDS.has(p.kind) || !MARKETS.has(market) || !p.brand || !(p.price > 0) || !p.currency) continue;
    const id = `${market}-${slug(p.brand)}-${slug(p.model ?? p.name)}-${slug(p.retailer ?? '')}`.slice(0, 90);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ id, market, kind: p.kind, brand: p.brand, name: p.name ?? `${p.brand} ${p.model}`, retailer: p.retailer ?? p.brand, price: p.price, currency: p.currency, taxIncluded: p.taxIncluded === true, count: Number.isInteger(p.count) && p.count > 0 ? p.count : 1, url: p.url ?? null, confirmed: p.confirmed === true });
  }
}
out.sort((a, b) => a.market.localeCompare(b.market) || a.kind.localeCompare(b.kind) || a.price - b.price);
writeFileSync('src/engine/content/sportsgear.ts', `/**
 * SLATE — rackets, paddles and balls where you live, built by
 * \`tools/build-sports.mjs\` from \`docs/research/catalog/sports-*.json\` (from
 * 2026-10-05). Don't edit by hand. Each at its retailer's regular price;
 * America's and Canada's before sales tax.
 */

export type SportGearKind = 'tennis-racket' | 'tennis-balls' | 'pickleball-paddle' | 'pickleballs' | 'basketball' | 'football';
export interface SportGear { id: string; market: string; kind: SportGearKind; brand: string; name: string; retailer: string; price: number; currency: string; taxIncluded: boolean; count: number; url: string | null; confirmed: boolean }

export const SPORT_GEAR: readonly SportGear[] = ${JSON.stringify(out, null, 2)};
`);
console.log(`${out.length} products from ${new Set(out.map((g) => g.brand)).size} brands`);
