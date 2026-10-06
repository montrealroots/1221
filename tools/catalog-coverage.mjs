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
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
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
import { LITTERS, PET_FOODS } from '../src/engine/content/petcare.ts';
import { KITCHEN_GEAR } from '../src/engine/content/kitchengear.ts';
import { GEAR_LINEUP } from '../src/engine/content/kitchengearlineup.ts';
import { SPORT_GEAR } from '../src/engine/content/sportsgear.ts';
import { CAR_OPTIONS } from '../src/engine/content/caroptions.ts';
import { HOTELS } from '../src/engine/content/hotels.ts';
import { RESTAURANTS } from '../src/engine/content/restaurants.ts';
import { CLUBS } from '../src/engine/content/clubs.ts';
import { CLINICS } from '../src/engine/content/clinics.ts';
import { CLOTHING_RETAILERS } from '../src/engine/content/clothingcatalog.ts';
import { SALONS } from '../src/engine/content/hygiene.ts';
import { CLEANING } from '../src/engine/content/cleaning.ts';
import { LIGHTING_PRODUCTS } from '../src/engine/content/lightingcatalog.ts';
import { TIRE_PRODUCTS } from '../src/engine/content/tirecatalog.ts';
import { GARDEN_PRODUCTS } from '../src/engine/content/gardencatalog.ts';
import { COMPUTER_PRODUCTS } from '../src/engine/content/computercatalog.ts';
import { CAR_AUDIO_PRODUCTS } from '../src/engine/content/caraudiocatalog.ts';
import { PAINT_PRODUCTS } from '../src/engine/content/paintcatalog.ts';

const OUT = 'docs/CATALOG-COVERAGE.md';
const DEPTH_OUT = 'docs/CATALOG-DEPTH.md';
/**
 * A brand's real range in a category where research found it can't reach the target: a brand there
 * meets the depth target when SLATE holds its whole range (`docs/research/catalog-ranges.json`, from
 * 2026-10-05). A failed search isn't a range: only a brand's own published lineup is.
 */
const RANGES = existsSync('docs/research/catalog-ranges.json') ? JSON.parse(readFileSync('docs/research/catalog-ranges.json', 'utf8')).ranges ?? {} : {};
const mode = process.argv.includes('--write') ? 'write' : 'check';

/** One row a catalog holds: its brand (null where the catalog doesn't record one), the product it is, its variants, and its market. */
const row = (brand, product, variants, market) => ({ brand, product, variants, market });

const CLOTHING_GROUP = { 'underwear and socks': 'underwear', shapewear: 'thermals', hosiery: 'thermals', slips: 'thermals' };
/** A trainer the shops sell as clothes: filed as sneakers or trainers, or named so, and not a slide, sandal, mule or boot (from 2026-10-05). */
const isSneaker = (p) => p.category === 'footwear' && !/\b(slides?|sandals?|chanclas|mules?|boots?|botas?)\b/i.test(p.name)
  && (/sneaker|trainer/i.test(p.subcategory ?? '') || /\b(sneakers?|trainers?|tenis|runners?|running shoes?|chuck 70|samba|air force 1)\b/i.test(p.name));
const clothing = (cat) => CLOTHING_PRODUCTS.filter((p) => (CLOTHING_GROUP[p.category] ?? p.category) === cat && !(cat === 'footwear' && isSneaker(p)))
  .map((p) => row(p.brand, p.sameAs ?? `${p.brand}|${p.name}`, Math.max(1, p.sizes.length) * Math.max(1, p.colors.length), p.market));
const cars = (list) => list.map((m) => row(m.make, `${m.make}|${m.model}`, 1, m.market));

/**
 * A product's identity apart from its size (the owner, 2026-10-05: sizes, colors, storage tiers and pack
 * counts are variants, never distinct products). Its name lowered, with sizes, pack and sheet counts,
 * multipacks, a size word (carry-on, medium, large) and a size code's suffix taken out. Until 2026-10-05 a
 * product's every size counted as a product of its own: a 52 fl oz and a 90 fl oz bottle were two.
 */
const UNIT = 'fl\\.?\\s?oz|oz|ml|cl|l|ltr|liters?|liters?|g|gr|kg|lbs?|ct|count|pk|packs?|pcs?|pieces?|rolls?|sheets?|loads?|washes|wash|tablets?|pods?|capsules?|bags?|sachets?|cans?|bottles?|in|inch|inches|cm|mm|qt|quarts?|gallons?|gal|w|watts?|lm|lumens?|units?';
const SIZE = new RegExp(`\\b\\d+(?:[.,]\\d+)?\\s*(?:-\\s*)?(?:${UNIT})\\b\\.?`, 'gi');
export function stemOf(name) {
  return String(name).toLowerCase()
    .replace(/\(([a-z]*\d+)-\d+\)/g, '($1)')
    .replace(/\b(?:pack|set|box|case) of \d+\b/g, ' ')
    .replace(/\b\d+\s*x\s*/g, ' ')
    .replace(SIZE, ' ')
    .replace(/\b\d+(?:\.\d+)?\s*["”]/g, ' ')
    .replace(/\b(?:extra[- ]large|carry[- ]on|cabin|checked|small|medium|large|xl|xxl|mini|maxi|family size|value pack|multipack|multi-pack)\b/g, ' ')
    .replace(/[(),.;:/+]|[-–—]\s*$/g, ' ')
    .replace(/\s+/g, ' ').trim();
}
const stemmed = (brand, name) => `${brand ?? ''}|${stemOf(name)}`;

const COSMETIC = new Set(['foundation', 'lipstick', 'mascara', 'eye-shadow', 'eyeliner', 'hair-styling']);
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
  // And from 2026-10-05 the trainers the clothes shops sell, counted here and not among the shoes.
  sneakers: () => [
    ...SNEAKERS.map((s) => row(/Jordan/.test(`${s.name} ${s.line}`) ? 'Jordan' : null, s.styleCode, Math.max(1, ...SNEAKER_RETAIL.filter((o) => o.styleCode === s.styleCode).map((o) => o.sizes?.length ?? 1)), null)),
    ...CLOTHING_PRODUCTS.filter(isSneaker).map((p) => row(p.brand, p.sameAs ?? `${p.brand}|${p.name}`, Math.max(1, p.sizes.length) * Math.max(1, p.colors.length), p.market)),
  ],
  // As products from 2026-10-04: a row an offer, the product its own, its colors its variants.
  // From 2026-10-05 a line's sizes are its variants: its name with the size and size code's suffix taken out.
  luggage: () => LUGGAGE_PRODUCTS.flatMap((p) => p.offers.map((o) => row(p.brand, stemmed(p.brand, p.model), Math.max(1, p.variants.length), o.market))),
  // From 2026-10-05 a series is the product and each screen size a variant of it (until then each size counted).
  televisions: () => TV_PRODUCTS.flatMap((p) => p.offers.map((o) => row(p.brand, `${p.brand}|${p.family ?? p.model}`, 1, o.market))),
  audio: () => AUDIO_PRODUCTS.flatMap((p) => p.offers.map((o) => row(p.brand, p.id, Math.max(1, p.variants.length), o.market))),
  // Bulbs and lamps (from 2026-10-05), each lamp's finishes its variants.
  // Tires and mowers by make and model (from 2026-10-05).
  tires: () => TIRE_PRODUCTS.flatMap((p) => p.offers.map((o) => row(p.brand, p.id, 1, o.market))),
  'car-audio': () => CAR_AUDIO_PRODUCTS.flatMap((p) => p.offers.map((o) => row(p.brand, p.id, 1, o.market))),
  // Interior paint, the first of building's finishes (from 2026-10-05).
  // A paint line is the product, each finish and can size a variant; a computer model, each configuration one (from 2026-10-05).
  building: () => PAINT_PRODUCTS.flatMap((p) => p.offers.map((o) => row(p.brand, `${p.brand}|${p.model}`, 1, o.market))),
  computers: () => COMPUTER_PRODUCTS.flatMap((p) => p.offers.map((o) => row(p.brand, `${p.brand}|${p.model}`, 1, o.market))),
  garden: () => GARDEN_PRODUCTS.flatMap((p) => p.offers.map((o) => row(p.brand, p.id, 1, o.market))),
  lighting: () => LIGHTING_PRODUCTS.flatMap((p) => p.offers.map((o) => row(p.brand, stemmed(p.brand, p.model), Math.max(1, p.variants.length), o.market))),
  // Mattresses and frames (from 2026-10-05): IKEA's by name, makers' own by model, each size a variant of its model.
  mattresses: () => [
    ...Object.entries(BED_PARTS).flatMap(([market, parts]) => [...parts.frames, ...parts.mattresses].map((x) => row('IKEA', `IKEA|${x.name}`, 1, market))),
    // A model sold in two markets is one product (from 2026-10-05; until then once a market).
    ...Object.entries(BRANDED_MATTRESSES).flatMap(([market, list]) => list.map((m) => row(m.brand, `${m.brand}|${m.name}`, 1, market))),
  ],
  appliances: () => APPLIANCE_PRODUCTS.flatMap((p) => p.offers.map((o) => row(p.brand, p.id, Math.max(1, p.variants.length), o.market))),
  phones: () => PHONES.map((p) => row(p.maker, `${p.maker}|${p.model}`, Math.max(1, p.colors.length), p.market)),
  consoles: () => CONSOLES.map((c) => row(c.maker, `${c.maker}|${c.model}`, 1, c.market)),
  furniture: () => FURNITURE_CATALOG.map((p) => row(p.brand, stemmed(p.brand, p.name), 1, p.country)),
  toiletries: () => TOILETRIES.filter((t) => !COSMETIC.has(t.kind)).map((t) => row(t.brand ?? null, stemmed(t.brand, t.name), 1, t.market)),
  cleaning: () => CLEANING.map((t) => row(t.brand ?? null, stemmed(t.brand, t.name), 1, t.market)),
  // Drinks the grocers sell (coffee, tea, juice, water, beer, wine) count as beverages, from 2026-10-05; until then as groceries.
  groceries: () => GROCERY_PRODUCTS.filter((g) => !DRINK.has(g.category)).map((g) => row(g.brand ?? null, stemmed(g.brand, g.name), 1, g.market)),
  beverages: () => GROCERY_PRODUCTS.filter((g) => DRINK.has(g.category)).map((g) => row(g.brand ?? null, stemmed(g.brand, g.name), 1, g.market)),
  cars: () => cars([...CAR_MODELS, ...PICKUP_MODELS, ...EV_MODELS]),
  motorcycles: () => cars([...BIKE_MODELS, ...MOTO_MODELS]),
  // Pet food by its brand, and litter, whose name states its maker, from 2026-10-05; until then neither was counted.
  'pet-supplies': () => [...PET_FOODS.map((p) => row(p.brand, stemmed(p.brand, p.product), 1, p.market.toUpperCase())), ...LITTERS.map((l) => row(null, l.product, 1, l.market.toUpperCase()))],
  // Blenders and slow cookers, the cheapest first read and from 2026-10-05 each market's makes.
  kitchenware: () => [...Object.entries(KITCHEN_GEAR).flatMap(([m, list]) => list.map((g) => row(g.brand ?? null, stemmed(g.brand, g.name), 1, m.toUpperCase()))), ...Object.entries(GEAR_LINEUP).flatMap(([m, list]) => list.map((g) => row(g.brand ?? null, stemmed(g.brand, g.name), 1, m.toUpperCase())))],
  // Makeup and hair styling at the chains, from 2026-10-05.
  cosmetics: () => TOILETRIES.filter((t) => COSMETIC.has(t.kind)).map((t) => row(t.brand ?? null, stemmed(t.brand, t.name), 1, t.market)),
  // Rackets, paddles and balls for a home's court or pitch, from 2026-10-05.
  sports: () => SPORT_GEAR.map((g) => row(g.brand, `${g.brand}|${g.name}`, 1, g.market.toUpperCase())),
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
    byBrand,
    markets: [...new Set(rows.map((r) => r.market).filter(Boolean).map((m) => { const u = String(m).toUpperCase(); return u === 'UK' ? 'GB' : u; }))].sort(),
  };
}

const lines = [];
lines.push('# Catalog coverage', '');
lines.push('Written by `tools/catalog-coverage.mjs` from the catalogs themselves; don\'t edit by hand. The hierarchy is', '`src/engine/content/catalogtaxonomy.ts`. The target for a brand category is at least', `${BRAND_TARGET.brands} real brands, each with at least ${BRAND_TARGET.productsPerBrand} distinct real products where the brand\'s range reaches that`, 'many (the owner, 2026-10-03, corrected 2026-10-05: a hundred is a floor, not a ceiling). A brand whose researched', 'real range is smaller meets it with its whole range held (`docs/research/catalog-ranges.json`). Brands, distinct', 'products, variants and offers are counted apart: a product sold by several sellers is one product with several', 'offers, and its sizes, colors, storage tiers, configurations and pack counts are its variants, never products of', 'their own. Owned items are counted in each save, on Belongings. A category none of whose catalogs records a brand', 'counts its products as unbranded, which never counts toward the target. Each brand\'s own count is in', '`docs/CATALOG-DEPTH.md`.', '');
lines.push('## Brand categories', '');
lines.push('| Department | Category | Brands | Of 50 | Products | Per brand (least / median / most) | Brands Deep Enough | Variants | Offers | Unbranded | Markets | Met |');
lines.push('|---|---|---|---|---|---|---|---|---|---|---|---|');
let met = 0;
let brandCats = 0;
const depth = ['# Catalog depth', '', 'Written by `tools/catalog-coverage.mjs`; don\'t edit by hand. Every brand in every brand category, with its distinct', `products in SLATE and whether it meets the depth target: at least ${BRAND_TARGET.productsPerBrand}, or its whole researched range`, '(`docs/research/catalog-ranges.json`). Short means more of its real range is to be researched and added.', ''];
/** Whether a brand is deep enough: a hundred products, or its whole recorded range. */
const deepEnough = (cat, brand, n) => n >= BRAND_TARGET.productsPerBrand || (RANGES[`${cat}|${brand}`] !== undefined && n >= RANGES[`${cat}|${brand}`].range);
for (const c of CATEGORIES.filter((x) => x.structure !== 'service')) {
  brandCats += 1;
  const read = READ[c.id];
  const k = count(read ? read() : []);
  const deep = [...k.byBrand.entries()].filter(([b, n]) => deepEnough(c.id, b, n)).length;
  const ok = c.structure === 'brand' && k.brands >= BRAND_TARGET.brands && deep >= BRAND_TARGET.brands;
  if (k.byBrand.size) {
    depth.push(`## ${c.department}: ${c.label}`, '', `${k.byBrand.size} brands, ${deep} deep enough, ${k.byBrand.size - deep} short.`, '', '| Brand | Products | Status |', '|---|---|---|');
    for (const [b, n] of [...k.byBrand.entries()].sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]))) {
      const r = RANGES[`${c.id}|${b}`];
      depth.push(`| ${b.replace(/\|/g, '/')} | ${n} | ${n >= BRAND_TARGET.productsPerBrand ? 'Meets 100' : r && n >= r.range ? `Whole range (${r.range})` : r ? `Short: ${r.range - n} of its ${r.range} to go` : `Short: ${BRAND_TARGET.productsPerBrand - n} to go`} |`);
    }
    depth.push('');
  }
  if (ok) met += 1;
  const per = k.perBrand ? `${k.perBrand.least} / ${k.perBrand.median} / ${k.perBrand.most}` : '—';
  const status = c.structure === 'narrow' ? `Narrow market: ${c.realRange}` : ok ? 'Yes' : k.products === 0 ? 'No catalog yet' : 'No';
  lines.push(`| ${c.department} | ${c.label} | ${k.brands} | ${Math.min(100, Math.round((k.brands / BRAND_TARGET.brands) * 100))}% | ${k.products} | ${per} | ${deep} | ${k.variants} | ${k.offers} | ${k.unbranded} | ${k.markets.join(', ') || '—'} | ${status} |`);
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
const depthText = `${depth.join('\n')}\n`;
if (mode === 'write') { writeFileSync(OUT, text); writeFileSync(DEPTH_OUT, depthText); console.log(`Wrote ${OUT} and ${DEPTH_OUT}: ${met} of ${brandCats} categories meet the target.`); }
else {
  let now = '';
  let nowDepth = '';
  try { now = readFileSync(OUT, 'utf8'); nowDepth = readFileSync(DEPTH_OUT, 'utf8'); } catch { /* missing */ }
  if (now !== text || nowDepth !== depthText) { console.log(`${OUT} or ${DEPTH_OUT} is behind the catalogs. Run: npx vite-node tools/catalog-coverage.mjs --write`); process.exit(1); }
  console.log(`${OUT} is current: ${met} of ${brandCats} categories meet the target.`);
}
