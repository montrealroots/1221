/**
 * The coverage report for every brand-based catalog and service directory
 * (the owner's expansion of 2026-10-03, §E3 and §E11), counted from the
 * catalogs themselves into docs/CATALOG-COVERAGE.md. Brands, distinct
 * products, variants and offers are counted apart; a product sold by several
 * sellers is one product (clothing's `sameAs`). A category with no catalog
 * yet reports zero, never an estimate. Run under vite-node, as the gate does:
 *   npx vite-node tools/catalog-coverage.mjs --write   (rewrite the report)
 *   npx vite-node tools/catalog-coverage.mjs --check   (fail if it's stale)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { BRAND_TARGET, CATEGORIES } from '../src/engine/content/catalogtaxonomy.ts';
import { CLOTHING_PRODUCTS } from '../src/engine/content/clothingcatalog.ts';
import { SNEAKERS, SNEAKER_RETAIL } from '../src/engine/content/sneakers.ts';
import { PHONES } from '../src/engine/content/phones.ts';
import { FURNITURE_CATALOG } from '../src/engine/content/furniturecatalog.ts';
import { LUGGAGE_PRODUCTS } from '../src/engine/content/luggagecatalog.ts';
import { TV_PRODUCTS } from '../src/engine/content/tvcatalog.ts';
import { APPLIANCE_PRODUCTS } from '../src/engine/content/appliancecatalog.ts';
import { BRANDED_MATTRESSES } from '../src/engine/content/mattresscatalog.ts';
import { BED_PARTS } from '../src/engine/content/beds.ts';
import { AUDIO_PRODUCTS } from '../src/engine/content/audiocatalog.ts';
import { TOILETRIES } from '../src/engine/content/hygiene.ts';
import { GROCERY_PRODUCTS, GROCERY_CHAINS } from '../src/engine/content/groceries.ts';
import { CONSOLES } from '../src/engine/content/homelife.ts';
import { CAR_MODELS } from '../src/engine/content/vehiclecatalog.ts';
import { PICKUP_MODELS } from '../src/engine/content/pickups.ts';
import { EV_MODELS } from '../src/engine/content/evcatalog.ts';
import { BIKE_MODELS } from '../src/engine/content/bikecatalog.ts';
import { MOTO_MODELS } from '../src/engine/content/motocatalog.ts';
import { RIDE_LINEUP } from '../src/engine/content/ridelineup.ts';
import { RIDE_MODELS } from '../src/engine/content/ridecatalog.ts';
import { RV_MODELS } from '../src/engine/content/rvcatalog.ts';
import { RV_LINEUP } from '../src/engine/content/rvlineup.ts';
import { CAR_OPTIONS } from '../src/engine/content/caroptions.ts';
import { HOTELS } from '../src/engine/content/hotels.ts';
import { RESTAURANTS } from '../src/engine/content/restaurants.ts';
import { CLUBS } from '../src/engine/content/clubs.ts';
import { CLINICS } from '../src/engine/content/clinics.ts';
import { CLOTHING_RETAILERS } from '../src/engine/content/clothingcatalog.ts';
import { SALONS } from '../src/engine/content/hygiene.ts';
import { CLEANING } from '../src/engine/content/cleaning.ts';

const OUT = 'docs/CATALOG-COVERAGE.md';
const mode = process.argv.includes('--write') ? 'write' : 'check';

/** One row a catalog holds: its brand (null where the catalog doesn't record one), the product it is, its variants, and its market. */
const row = (brand, product, variants, market) => ({ brand, product, variants, market });

const CLOTHING_GROUP = { 'underwear and socks': 'underwear', shapewear: 'thermals', hosiery: 'thermals', slips: 'thermals' };
const clothing = (cat) => CLOTHING_PRODUCTS.filter((p) => (CLOTHING_GROUP[p.category] ?? p.category) === cat)
  .map((p) => row(p.brand, p.sameAs ?? `${p.brand}|${p.name}`, Math.max(1, p.sizes.length) * Math.max(1, p.colors.length), p.market));
const cars = (list) => list.map((m) => row(m.make, `${m.make}|${m.model}`, 1, m.market));

const DRINK = new Set(['beverage', 'alcohol']);
/** What each category's rows are, where a catalog holds it. */
const READ = {
  everyday: () => clothing('everyday'), formalwear: () => clothing('formalwear'), outerwear: () => clothing('outerwear'),
  activewear: () => clothing('activewear'), underwear: () => clothing('underwear'), sleepwear: () => clothing('sleepwear'),
  swimwear: () => clothing('swimwear'), thermals: () => clothing('thermals'), cultural: () => clothing('cultural'),
  // Bath towels, sold and kept as the clothes are (from 2026-10-05); bedding isn't sold yet.
  bedding: () => clothing('towels'),
  footwear: () => clothing('footwear'), bags: () => clothing('bags'), accessories: () => clothing('accessories'),
  watches: () => clothing('watches'), jewelry: () => clothing('jewelry'),
  // Every one is Nike's Jordan Brand's, an Air Jordan or a Jordan signature shoe (from 2026-10-05 counted as its brand, not unbranded).
  sneakers: () => SNEAKERS.map((s) => row(/Jordan/.test(`${s.name} ${s.line}`) ? 'Jordan' : null, s.styleCode, Math.max(1, ...SNEAKER_RETAIL.filter((o) => o.styleCode === s.styleCode).map((o) => o.sizes?.length ?? 1)), null)),
  // As products from 2026-10-04: a row an offer, the product its own, its colors its variants.
  luggage: () => LUGGAGE_PRODUCTS.flatMap((p) => p.offers.map((o) => row(p.brand, p.id, Math.max(1, p.variants.length), o.market))),
  // As products from 2026-10-05: a row an offer, each screen size its own product.
  televisions: () => TV_PRODUCTS.flatMap((p) => p.offers.map((o) => row(p.brand, p.id, Math.max(1, p.variants.length), o.market))),
  audio: () => AUDIO_PRODUCTS.flatMap((p) => p.offers.map((o) => row(p.brand, p.id, Math.max(1, p.variants.length), o.market))),
  // Mattresses and frames (from 2026-10-05): IKEA's by name, makers' own by model, each size a variant of its model.
  mattresses: () => [
    ...Object.entries(BED_PARTS).flatMap(([market, parts]) => [...parts.frames, ...parts.mattresses].map((x) => row('IKEA', `IKEA|${x.name}`, 1, market))),
    ...Object.entries(BRANDED_MATTRESSES).flatMap(([market, list]) => list.map((m) => row(m.brand, `${m.brand}|${m.name}|${market}`, 1, market))),
  ],
  appliances: () => APPLIANCE_PRODUCTS.flatMap((p) => p.offers.map((o) => row(p.brand, p.id, Math.max(1, p.variants.length), o.market))),
  phones: () => PHONES.map((p) => row(p.maker, `${p.maker}|${p.model}`, Math.max(1, p.colors.length), p.market)),
  consoles: () => CONSOLES.map((c) => row(c.maker, `${c.maker}|${c.model}`, 1, c.market)),
  furniture: () => FURNITURE_CATALOG.map((p) => row(p.brand, `${p.brand}|${p.name}|${p.type ?? ''}`, 1, p.country)),
  toiletries: () => TOILETRIES.map((t) => row(t.brand ?? null, t.name, 1, t.market)),
  cleaning: () => CLEANING.map((t) => row(t.brand ?? null, t.name, 1, t.market)),
  // Drinks the grocers sell (coffee, tea, juice, water, beer, wine) count as beverages, from 2026-10-05; until then as groceries.
  groceries: () => GROCERY_PRODUCTS.filter((g) => !DRINK.has(g.category)).map((g) => row(g.brand ?? null, g.name, 1, g.market)),
  beverages: () => GROCERY_PRODUCTS.filter((g) => DRINK.has(g.category)).map((g) => row(g.brand ?? null, g.name, 1, g.market)),
  cars: () => cars([...CAR_MODELS, ...PICKUP_MODELS, ...EV_MODELS]),
  motorcycles: () => cars([...BIKE_MODELS, ...MOTO_MODELS]),
  bicycles: () => cars([...RIDE_MODELS, ...RIDE_LINEUP]),
  rvs: () => cars([...RV_MODELS, ...RV_LINEUP]),
  'car-options': () => { const make = new Map([...CAR_MODELS, ...EV_MODELS, ...PICKUP_MODELS].map((m) => [m.id, m.make])); return CAR_OPTIONS.map((o) => row(make.get(o.carId) ?? null, o.key, 1, o.carId.slice(0, 2))); },
};

/** Service directories: providers, branches, towns. */
const SERVICES = {
  hotels: () => ({ providers: new Set(HOTELS.map((h) => h.brand ?? h.name)).size, branches: HOTELS.length, towns: new Set(HOTELS.map((h) => h.cityId)).size }),
  restaurants: () => ({ providers: new Set(RESTAURANTS.map((r) => r.name)).size, branches: RESTAURANTS.length, towns: new Set(RESTAURANTS.map((r) => r.cityId)).size }),
  clubs: () => ({ providers: new Set(CLUBS.map((c) => c.name)).size, branches: CLUBS.length, towns: new Set(CLUBS.map((c) => c.cityId)).size }),
  clinics: () => ({ providers: new Set(CLINICS.map((c) => c.name)).size, branches: CLINICS.length, towns: new Set(CLINICS.map((c) => c.cityId)).size }),
  stores: () => ({ providers: CLOTHING_RETAILERS.length + GROCERY_CHAINS.length, branches: CLOTHING_RETAILERS.reduce((n, r) => n + r.storesIn.length, 0) + GROCERY_CHAINS.reduce((n, c) => n + c.storesIn.length, 0), towns: new Set([...CLOTHING_RETAILERS.flatMap((r) => r.storesIn), ...GROCERY_CHAINS.flatMap((c) => c.storesIn)]).size }),
  salons: () => ({ providers: new Set(SALONS.map((s) => s.name.replace(/\s*\(.*\)$/, ''))).size, branches: SALONS.length, towns: new Set(SALONS.map((s) => s.cityId)).size }),
};

function count(rows) {
  const products = new Map();
  for (const r of rows) if (!products.has(r.product)) products.set(r.product, r);
  const byBrand = new Map();
  for (const r of products.values()) if (r.brand) byBrand.set(r.brand, (byBrand.get(r.brand) ?? 0) + 1);
  const per = [...byBrand.values()].sort((a, b) => a - b);
  return {
    offers: rows.length,
    products: products.size,
    variants: [...products.values()].reduce((n, r) => n + r.variants, 0),
    brands: byBrand.size,
    unbranded: [...products.values()].filter((r) => !r.brand).length,
    perBrand: per.length ? { least: per[0], median: per[Math.floor(per.length / 2)], most: per[per.length - 1] } : null,
    brandsAtTarget: per.filter((n) => n >= BRAND_TARGET.productsPerBrand).length,
    markets: [...new Set(rows.map((r) => r.market).filter(Boolean).map((m) => { const u = String(m).toUpperCase(); return u === 'UK' ? 'GB' : u; }))].sort(),
  };
}

const lines = [];
lines.push('# Catalog coverage', '');
lines.push('Written by `tools/catalog-coverage.mjs` from the catalogs themselves; don\'t edit by hand. The hierarchy is', '`src/engine/content/catalogtaxonomy.ts`. The target for a brand category is at least', `${BRAND_TARGET.brands} real brands and up to ${BRAND_TARGET.productsPerBrand} distinct real products from each where the brand makes`, 'that many (the owner, 2026-10-03). Brands, products, variants and offers are counted', 'apart: a product sold by several sellers is one product with several offers. A', 'category none of whose catalogs records a brand counts its products as unbranded,', 'which never counts toward the target.', '');
lines.push('## Brand categories', '');
lines.push('| Department | Category | Brands | Of 50 | Products | Per brand (least / median / most) | Brands at 100 | Variants | Offers | Unbranded | Markets | Met |');
lines.push('|---|---|---|---|---|---|---|---|---|---|---|---|');
let met = 0;
let brandCats = 0;
for (const c of CATEGORIES.filter((x) => x.structure !== 'service')) {
  brandCats += 1;
  const read = READ[c.id];
  const k = count(read ? read() : []);
  const ok = c.structure === 'brand' && k.brands >= BRAND_TARGET.brands && k.brandsAtTarget >= BRAND_TARGET.brands;
  if (ok) met += 1;
  const per = k.perBrand ? `${k.perBrand.least} / ${k.perBrand.median} / ${k.perBrand.most}` : '—';
  const status = c.structure === 'narrow' ? `Narrow market: ${c.realRange}` : ok ? 'Yes' : k.products === 0 ? 'No catalog yet' : 'No';
  lines.push(`| ${c.department} | ${c.label} | ${k.brands} | ${Math.min(100, Math.round((k.brands / BRAND_TARGET.brands) * 100))}% | ${k.products} | ${per} | ${k.brandsAtTarget} | ${k.variants} | ${k.offers} | ${k.unbranded} | ${k.markets.join(', ') || '—'} | ${status} |`);
}
lines.push('', `${met} of ${brandCats} brand and narrow categories meet the target.`, '');
lines.push('## Service directories', '', 'Counted by their own structure: providers, branches or listings, and the towns they cover.', '');
lines.push('| Category | Providers | Branches Or Listings | Towns |', '|---|---|---|---|');
for (const c of CATEGORIES.filter((x) => x.structure === 'service')) {
  const k = SERVICES[c.id]?.() ?? { providers: 0, branches: 0, towns: 0 };
  lines.push(`| ${c.label} | ${k.providers} | ${k.branches} | ${k.towns} |`);
}
lines.push('');
const text = `${lines.join('\n')}\n`;
if (mode === 'write') { writeFileSync(OUT, text); console.log(`Wrote ${OUT}: ${met} of ${brandCats} categories meet the target.`); }
else {
  let now = '';
  try { now = readFileSync(OUT, 'utf8'); } catch { /* missing */ }
  if (now !== text) { console.log(`${OUT} is behind the catalogs. Run: npx vite-node tools/catalog-coverage.mjs --write`); process.exit(1); }
  console.log(`${OUT} is current: ${met} of ${brandCats} categories meet the target.`);
}
