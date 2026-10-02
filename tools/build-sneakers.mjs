/**
 * Builds src/engine/content/sneakers.ts from
 * docs/research/world/research-sneakers.json: Air Jordans on sale at retail
 * in each market (Nike's own stores, JD Sports, Foot Locker), with their
 * style codes, colorways, prices and sizes as read on 2026-10-02, and GOAT's
 * resale asks for the same style codes (the cheapest new and used asks
 * across sizes, and the lowest ask and last sale at a US men's 10). StockX
 * refused automated reads, so no StockX price is kept. Run:
 * node tools/build-sneakers.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';

const r = JSON.parse(readFileSync('docs/research/world/research-sneakers.json', 'utf8'));
const MARKETS = new Set(['US', 'CA', 'MX', 'GB', 'IE']);

const sneakers = r.retail.map((s) => ({
  styleCode: s.styleCode, name: s.name, line: s.line, colorway: s.colorway ?? null, audience: s.audience ?? null, released: s.release?.date ?? null,
}));
const retail = r.retail.flatMap((s) => s.offers.filter((o) => MARKETS.has(o.market) && typeof o.price === 'number').map((o) => ({
  styleCode: s.styleCode, market: o.market, retailer: o.retailer, price: o.price, currency: o.currency, taxIncluded: o.taxIncluded === true,
  sizes: Array.isArray(o.sizes) ? o.sizes.map(String) : null, sizeSystem: o.sizeSystem ?? null,
  soldOut: /sold out/i.test(o.status ?? ''), source: o.source,
})));
const asks = {};
for (const x of r.resale.filter((y) => y.marketplace === 'GOAT' && y.currency === 'USD')) {
  const a = (asks[x.styleCode] ??= { styleCode: x.styleCode, newAsk: null, usedAsk: null, refAsk: null, lastSale: null, source: x.source });
  if (/cheapest new/.test(x.measure)) a.newAsk = x.lowestAsk ?? x.price ?? a.newAsk;
  else if (/cheapest used/.test(x.measure)) a.usedAsk = x.lowestAsk ?? x.price ?? a.usedAsk;
  else { a.refAsk = x.lowestAsk ?? a.refAsk; a.lastSale = x.lastSale ?? a.lastSale; }
}
const goat = Object.values(asks).filter((a) => sneakers.some((s) => s.styleCode === a.styleCode));

const head = readFileSync('src/engine/content/sneakers.ts', 'utf8').split('// --- generated below ---')[0];
writeFileSync('src/engine/content/sneakers.ts', `${head}// --- generated below ---
export const SNEAKERS: readonly Sneaker[] = ${JSON.stringify(sneakers, null, 2)};

export const SNEAKER_RETAIL: readonly SneakerOffer[] = ${JSON.stringify(retail, null, 2)};

export const GOAT_ASKS: readonly GoatAsk[] = ${JSON.stringify(goat, null, 2)};
`);
console.log(`Wrote ${sneakers.length} sneakers, ${retail.length} retail offers and ${goat.length} GOAT asks.`);
