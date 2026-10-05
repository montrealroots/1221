/**
 * The coverage report for every brand-based catalog and service directory
 * (the owner's expansion of 2026-10-03, §E3 and §E11, restated 2026-10-05),
 * counted from the catalogs themselves into docs/CATALOG-COVERAGE.md. Brands,
 * distinct products, variants and offers are counted apart; a product sold by
 * several sellers is one product (clothing's `sameAs`). A category with no
 * catalog yet reports zero, never an estimate.
 *
 * Each category's functional coverage is the life its owned items can take,
 * named in `content/catalogtaxonomy.ts` by the command or scheduled kind that
 * takes each step. This tool fails, in both modes, on a step whose kind the
 * engine doesn't register, and on a command no screen sends: a step claimed
 * and not reachable is the decorative entry the owner ruled out.
 *
 * Run under vite-node, as the gate does:
 *   npx vite-node tools/catalog-coverage.mjs --write   (rewrite the report)
 *   npx vite-node tools/catalog-coverage.mjs --check   (fail if it's stale)
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { BRAND_TARGET, CATEGORIES, LIFE_STEPS, clothingCategoryOf } from '../src/engine/content/catalogtaxonomy.ts';
import { CLOTHING_PRODUCTS, CLOTHING_RETAILERS } from '../src/engine/content/clothingcatalog.ts';
import { SNEAKERS, SNEAKER_RETAIL } from '../src/engine/content/sneakers.ts';
import { PHONES } from '../src/engine/content/phones.ts';
import { FURNITURE_CATALOG } from '../src/engine/content/furniturecatalog.ts';
import { LUGGAGE_PRODUCTS } from '../src/engine/content/luggagecatalog.ts';
import { TV_PRODUCTS } from '../src/engine/content/tvcatalog.ts';
import { APPLIANCE_PRODUCTS } from '../src/engine/content/appliancecatalog.ts';
import { TOILETRIES, SALONS } from '../src/engine/content/hygiene.ts';
import { GROCERY_PRODUCTS, GROCERY_CHAINS } from '../src/engine/content/groceries.ts';
import { CONSOLES } from '../src/engine/content/homelife.ts';
import { CAR_MODELS } from '../src/engine/content/vehiclecatalog.ts';
import { PICKUP_MODELS } from '../src/engine/content/pickups.ts';
import { EV_MODELS } from '../src/engine/content/evcatalog.ts';
import { BIKE_MODELS } from '../src/engine/content/bikecatalog.ts';
import { RIDE_MODELS } from '../src/engine/content/ridecatalog.ts';
import { RV_MODELS } from '../src/engine/content/rvcatalog.ts';
import { CAR_OPTIONS } from '../src/engine/content/caroptions.ts';
import { HOTELS } from '../src/engine/content/hotels.ts';
import { RESTAURANTS } from '../src/engine/content/restaurants.ts';
import { CLUBS } from '../src/engine/content/clubs.ts';
import { CLINICS } from '../src/engine/content/clinics.ts';
import { CLEANING } from '../src/engine/content/cleaning.ts';
import { PET_FOODS, LITTERS, VET_YEAR } from '../src/engine/content/petcare.ts';
import { BED_PARTS } from '../src/engine/content/beds.ts';
import { KITCHEN_GEAR } from '../src/engine/content/kitchengear.ts';
import { READING_BUYS } from '../src/engine/content/reading.ts';
import { SAFES } from '../src/engine/content/valuables.ts';
import { GYMS } from '../src/engine/content/gyms.ts';
import { DROP_INS } from '../src/engine/content/dropins.ts';
import { TAILORS } from '../src/engine/content/tailors.ts';
import { CAR_SHOPS } from '../src/engine/content/carshops.ts';
import { GARAGES } from '../src/engine/content/garages.ts';
import { ROADSIDE_TIERS } from '../src/engine/content/roadside.ts';
import { STATION_GRADES, CHARGERS } from '../src/engine/content/fuelcharging.ts';
import { GAMES } from '../src/engine/systems/homelife.ts';
import { ALARM } from '../src/engine/systems/alarm.ts';
import { TIRE_SET } from '../src/engine/systems/tires.ts';
import { MOD_OFFERS } from '../src/engine/systems/mods.ts';
import { HEAD_UNIT, AUDIO_PARTS } from '../src/engine/systems/caraudio.ts';
import { MATERIAL_USD, KATZKIN_USD } from '../src/engine/systems/interiors.ts';
import { ROOF_RACK, ROOF_BOXES } from '../src/engine/systems/roofbox.ts';
import { DEALERS } from '../src/engine/systems/vehicles.ts';

const OUT = 'docs/CATALOG-COVERAGE.md';
const mode = process.argv.includes('--write') ? 'write' : 'check';

/** One row a catalog holds: its brand (null where the catalog doesn't record one), the product it is, its variants, and its market. */
const row = (brand, product, variants, market) => ({ brand, product, variants, market });

const clothing = (cat) => CLOTHING_PRODUCTS.filter((p) => clothingCategoryOf(p) === cat)
  .map((p) => row(p.brand, p.sameAs ?? `${p.brand}|${p.name}`, Math.max(1, p.sizes.length) * Math.max(1, p.colors.length), p.market));
const cars = (list) => list.map((m) => row(m.make, `${m.make}|${m.model}`, 1, m.market));

/** The grocery categories that are drinks: Beverages in the taxonomy. */
const DRINKS = new Set(['beverage', 'alcohol']);
/** The toiletries' kinds by the aisle the owner names apart (2026-10-05): haircare, shaving, household paper, and the rest toiletries. */
const TOILETRY_AISLE = { shampoo: 'haircare', conditioner: 'haircare', razor: 'shaving', 'shaving-cream': 'shaving', 'toilet-paper': 'consumables' };
/** The cleaning catalog's kinds that are household paper and consumables, not cleaning products. */
const PAPER = new Set(['paper-towels', 'sponges', 'trash-bags']);
/** A small table's market key, as the rest of the report spells it. */
const mk = (key) => String(key).slice(0, 2);

/** What each category's rows are, where a catalog holds it. */
const READ = {
  // Clothing by the category each product is counted in (`clothingCategoryOf`): from 2026-10-05 underwear, lingerie,
  // socks and hosiery, shapewear and slips, thermals and designer houses' clothes apart, and every shoe by its style.
  ...Object.fromEntries(['everyday', 'designer', 'formalwear', 'outerwear', 'activewear', 'underwear', 'lingerie', 'shapewear', 'hosiery', 'thermals',
    'sleepwear', 'swimwear', 'cultural', 'dress-shoes', 'boots', 'sandals', 'footwear-other', 'bags', 'accessories', 'watches', 'jewelry'].map((c) => [c, () => clothing(c)])),
  // The Air Jordans are Jordan Brand's, Nike's (`content/sneakers.ts`), a row each retail offer; from 2026-10-05 beside
  // the clothing catalog's sneakers, which until then were counted with every other shoe.
  sneakers: () => [...clothing('sneakers'), ...SNEAKERS.flatMap((s) => {
    const offers = SNEAKER_RETAIL.filter((o) => o.styleCode === s.styleCode);
    const sizes = Math.max(1, ...offers.map((o) => o.sizes?.length ?? 1));
    return offers.length ? offers.map((o) => row('Jordan', s.styleCode, sizes, o.market)) : [row('Jordan', s.styleCode, sizes, null)];
  })],
  luggage: () => LUGGAGE_PRODUCTS.flatMap((p) => p.offers.map((o) => row(p.brand, p.id, Math.max(1, p.variants.length), o.market))),
  televisions: () => TV_PRODUCTS.flatMap((p) => p.offers.map((o) => row(p.brand, p.id, Math.max(1, p.variants.length), o.market))),
  appliances: () => APPLIANCE_PRODUCTS.flatMap((p) => p.offers.map((o) => row(p.brand, p.id, Math.max(1, p.variants.length), o.market))),
  phones: () => PHONES.map((p) => row(p.maker, `${p.maker}|${p.model}`, Math.max(1, p.colors.length), p.market)),
  consoles: () => CONSOLES.map((c) => row(c.maker, `${c.maker}|${c.model}`, 1, c.market)),
  gaming: () => GAMES.map((g) => row(g.maker, `${g.maker}|${g.title}`, 1, g.market)),
  // The e-readers keep no brand apart from their names.
  tablets: () => READING_BUYS.filter((b) => b.kind === 'ereader').map((b) => row(null, b.label, 1, b.country)),
  furniture: () => FURNITURE_CATALOG.map((p) => row('IKEA', `IKEA|${p.name}|${p.type ?? ''}`, 1, p.country)),
  toiletries: () => TOILETRIES.filter((t) => !TOILETRY_AISLE[t.kind]).map((t) => row(t.brand, t.name, 1, t.market)),
  haircare: () => TOILETRIES.filter((t) => TOILETRY_AISLE[t.kind] === 'haircare').map((t) => row(t.brand, t.name, 1, t.market)),
  shaving: () => TOILETRIES.filter((t) => TOILETRY_AISLE[t.kind] === 'shaving').map((t) => row(t.brand, t.name, 1, t.market)),
  cleaning: () => CLEANING.filter((t) => !PAPER.has(t.kind)).map((t) => row(t.brand, t.name, 1, t.market)),
  consumables: () => [...CLEANING.filter((t) => PAPER.has(t.kind)), ...TOILETRIES.filter((t) => TOILETRY_AISLE[t.kind] === 'consumables')].map((t) => row(t.brand, t.name, 1, t.market)),
  groceries: () => GROCERY_PRODUCTS.filter((g) => !DRINKS.has(g.category)).map((g) => row(g.brand, g.name, 1, g.market)),
  beverages: () => GROCERY_PRODUCTS.filter((g) => DRINKS.has(g.category)).map((g) => row(g.brand, g.name, 1, g.market)),
  'pet-food': () => PET_FOODS.map((f) => row(f.brand, `${f.brand}|${f.product}`, 1, f.market)),
  // The litters keep no brand apart from their names.
  'pet-supplies': () => LITTERS.map((l) => row(null, l.product, 1, l.market)),
  mattresses: () => {
    const parts = Object.entries(BED_PARTS).flatMap(([market, b]) => [...b.frames, ...b.mattresses].map((x) => ({ ...x, market })));
    const sizes = new Map();
    for (const x of parts) sizes.set(x.name, (sizes.get(x.name) ?? new Set()).add(x.size));
    return parts.map((x) => row('IKEA', `IKEA|${x.name}`, sizes.get(x.name).size, x.market));
  },
  // A blender and a slow cooker a market, small kitchen appliances from 2026-10-05 (Kitchenware until then), whose brand
  // isn't kept apart from their names.
  'small-appliances': () => Object.entries(KITCHEN_GEAR).flatMap(([market, offers]) => offers.map((o) => row(null, o.name, 1, market))),
  'home-security': () => [...SAFES.map((s) => row(null, s.label, 1, s.country)), ...Object.entries(ALARM).map(([market]) => row(null, 'alarm kit', 1, market))],
  cars: () => cars([...CAR_MODELS, ...PICKUP_MODELS, ...EV_MODELS]),
  motorcycles: () => cars(BIKE_MODELS),
  bicycles: () => cars(RIDE_MODELS.filter((m) => m.kind !== 'atv')),
  atvs: () => cars(RIDE_MODELS.filter((m) => m.kind === 'atv')),
  rvs: () => cars(RV_MODELS),
  'car-options': () => { const make = new Map([...CAR_MODELS, ...EV_MODELS, ...PICKUP_MODELS].map((m) => [m.id, m.make])); return CAR_OPTIONS.map((o) => row(make.get(o.carId) ?? null, o.key, 1, o.carId.slice(0, 2))); },
  // The car parts sold until now keep no brand: a set of tires a market, alloys, a body kit and the rest a market.
  tires: () => Object.keys(TIRE_SET).map((j) => row(null, 'a set of four tires', 1, mk(j))),
  wheels: () => Object.keys(MOD_OFFERS.wheels).map((m) => row(null, 'alloy wheels', 1, mk(m))),
  'car-parts': () => ['bodykit', 'led', 'exhaust', 'lowering'].flatMap((mod) => Object.keys(MOD_OFFERS[mod]).map((m) => row(null, mod, 1, mk(m)))),
  'car-audio': () => [...Object.entries(HEAD_UNIT).map(([m, h]) => row(null, h.unit, 1, m)), ...Object.entries(AUDIO_PARTS).flatMap(([m, parts]) => Object.values(parts).map((x) => row(null, x.item, 1, m)))],
  upholstery: () => [...Object.keys(MATERIAL_USD).map((k) => row(null, k, 1, 'us')), ...(KATZKIN_USD ? [row(null, 'Katzkin kit', 1, 'us')] : [])],
  'car-accessories': () => [...Object.entries(ROOF_RACK).map(([m, r]) => row(null, r.name, 1, m)), ...Object.entries(ROOF_BOXES).flatMap(([m, b]) => b.boxes.map((x) => row(null, x.name, 1, m)))],
};

/** Service directories: providers, branches, towns. */
const towns = (xs) => new Set(xs).size;
const SERVICES = {
  hotels: () => ({ providers: new Set(HOTELS.map((h) => h.brand ?? h.name)).size, branches: HOTELS.length, towns: towns(HOTELS.map((h) => h.cityId)) }),
  restaurants: () => ({ providers: new Set(RESTAURANTS.map((r) => r.name)).size, branches: RESTAURANTS.length, towns: towns(RESTAURANTS.map((r) => r.cityId)) }),
  clubs: () => ({ providers: new Set(CLUBS.map((c) => c.name)).size, branches: CLUBS.length, towns: towns(CLUBS.map((c) => c.cityId)) }),
  gyms: () => ({ providers: new Set([...GYMS.map((g) => g.name.split(' ').slice(0, 2).join(' ')), ...DROP_INS.map((d) => d.studio)]).size, branches: GYMS.length + new Set(DROP_INS.map((d) => `${d.studio}|${d.cityId}`)).size, towns: towns([...GYMS.map((g) => g.cityId), ...DROP_INS.map((d) => d.cityId)]) }),
  clinics: () => ({ providers: new Set(CLINICS.map((c) => c.name)).size, branches: CLINICS.length, towns: towns(CLINICS.map((c) => c.cityId)) }),
  vets: () => ({ providers: new Set(Object.values(VET_YEAR).map((v) => v.clinic.split(/[,(]/)[0].trim())).size, branches: Object.keys(VET_YEAR).length, towns: Object.keys(VET_YEAR).length }),
  stores: () => ({ providers: CLOTHING_RETAILERS.length + GROCERY_CHAINS.length, branches: CLOTHING_RETAILERS.reduce((n, r) => n + r.storesIn.length, 0) + GROCERY_CHAINS.reduce((n, c) => n + c.storesIn.length, 0), towns: towns([...CLOTHING_RETAILERS.flatMap((r) => r.storesIn), ...GROCERY_CHAINS.flatMap((c) => c.storesIn)]) }),
  salons: () => ({ providers: new Set(SALONS.map((s) => s.name.replace(/\s*\(.*\)$/, ''))).size, branches: SALONS.length, towns: towns(SALONS.map((s) => s.cityId)) }),
  tailors: () => ({ providers: new Set(TAILORS.map((t) => t.name)).size, branches: TAILORS.length, towns: towns(TAILORS.map((t) => t.cityId)) }),
  dealers: () => { const all = Object.entries(DEALERS).flatMap(([city, ds]) => ds.map((d) => ({ ...d, city }))); return { providers: new Set(all.map((d) => d.name)).size, branches: all.length, towns: towns(all.map((d) => d.city)) }; },
  'car-shops': () => ({ providers: new Set(CAR_SHOPS.map((c) => c.name)).size, branches: CAR_SHOPS.length, towns: towns(CAR_SHOPS.map((c) => c.cityId)) }),
  fuel: () => ({ providers: new Set([...STATION_GRADES.map((s) => s.name.split(',')[0].trim()), ...CHARGERS.map((c) => c.network)]).size, branches: STATION_GRADES.length + CHARGERS.length, towns: towns([...STATION_GRADES.map((s) => s.cityId), ...CHARGERS.map((c) => c.cityId)]) }),
  parking: () => ({ providers: new Set(GARAGES.map((g) => g.operator ?? g.name)).size, branches: GARAGES.length, towns: towns(GARAGES.map((g) => g.cityId)) }),
  roadside: () => ({ providers: new Set(ROADSIDE_TIERS.map((t) => t.club)).size, branches: ROADSIDE_TIERS.length, towns: '—' }),
};

/** Every command and scheduled kind the engine registers, and every command a screen sends, read from the code as `tools/inventory.mjs` reads it. */
function kinds() {
  const walk = (dir, out = []) => { for (const name of readdirSync(dir)) { const full = `${dir}/${name}`; if (statSync(full).isDirectory()) walk(full, out); else if (/\.tsx?$/.test(full)) out.push(full); } return out; };
  const engine = walk('src/engine');
  const named = new Map();
  for (const f of engine) for (const m of readFileSync(f, 'utf8').matchAll(/const ([A-Z][A-Z0-9_]*) = '([a-z0-9_]+\.[a-z0-9_]+)'/g)) named.set(m[1], m[2]);
  const commands = new Set();
  const schedules = new Set();
  for (const f of engine) {
    const text = readFileSync(f, 'utf8');
    for (const m of text.matchAll(/on(Command|Schedule)\s*(?:<[^(]*?>)?\s*\(\s*('[a-z0-9_.]+'|[A-Z][A-Z0-9_]*)/g)) {
      const k = m[2].startsWith("'") ? m[2].slice(1, -1) : named.get(m[2]);
      if (k) (m[1] === 'Command' ? commands : schedules).add(k);
    }
  }
  const ui = walk('src/ui').map((f) => readFileSync(f, 'utf8')).join('\n');
  return { commands, schedules, sent: (k) => ui.includes(`'${k}'`) };
}

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

const { commands, schedules, sent } = kinds();
const broken = [];
const products = BRAND_TARGET.brands * BRAND_TARGET.productsPerBrand;
const lines = [];
lines.push('# Catalog coverage', '');
lines.push('Written by `tools/catalog-coverage.mjs` from the catalogs themselves; don\'t edit by hand. The hierarchy is',
  '`src/engine/content/catalogtaxonomy.ts`. The target for a brand category is at least',
  `${BRAND_TARGET.brands} real brands with at least ${BRAND_TARGET.productsPerBrand} distinct real products each where the brand makes that many,`,
  `${products.toLocaleString('en-US')} a category, a floor and not a ceiling (the owner, 2026-10-03, restated 2026-10-05). Brands, products, variants and`,
  'offers are counted apart: a product sold by several sellers is one product with several offers,',
  'and a shoe in ten sizes one product with ten variants. A category none of whose catalogs records a',
  'brand counts its products as unbranded, which never counts toward the target. Owned items are',
  'counted in each save; the functional table names the record a purchase makes and the steps it can take.', '');
lines.push('## Brand categories', '');
lines.push('| Department | Category | Brands | Of 50 | Products | Per brand (least / median / most) | Brands at 100 | Variants | Offers | Unbranded | Markets | Met |');
lines.push('|---|---|---|---|---|---|---|---|---|---|---|---|');
let met = 0;
let brandCats = 0;
const functional = [];
for (const c of CATEGORIES.filter((x) => x.structure !== 'service')) {
  brandCats += 1;
  const read = READ[c.id];
  const k = count(read ? read() : []);
  const ok = c.structure === 'brand' && k.brands >= BRAND_TARGET.brands && k.brandsAtTarget >= BRAND_TARGET.brands;
  if (ok) met += 1;
  const per = k.perBrand ? `${k.perBrand.least} / ${k.perBrand.median} / ${k.perBrand.most}` : '—';
  const status = c.structure === 'narrow' ? `Narrow market: ${c.realRange}` : ok ? 'Yes' : k.products === 0 ? 'No catalog yet' : 'No';
  lines.push(`| ${c.department} | ${c.label} | ${k.brands} | ${Math.min(100, Math.round((k.brands / BRAND_TARGET.brands) * 100))}% | ${k.products} | ${per} | ${k.brandsAtTarget} | ${k.variants} | ${k.offers} | ${k.unbranded} | ${k.markets.join(', ') || '—'} | ${status} |`);
  // Each step's kind registered, and a command sent by a screen.
  for (const [step, kind] of Object.entries(c.steps ?? {})) {
    if (!LIFE_STEPS.includes(step)) broken.push(`${c.id}: "${step}" isn't a step`);
    else if (commands.has(kind)) { if (!sent(kind)) broken.push(`${c.id}: ${step} by ${kind}, which no screen sends`); }
    else if (!schedules.has(kind)) broken.push(`${c.id}: ${step} by ${kind}, which the engine doesn't register`);
  }
  for (const step of c.missing ?? []) if (c.steps?.[step]) broken.push(`${c.id}: ${step} is both built and missing`);
  const built = LIFE_STEPS.filter((s) => c.steps?.[s]);
  functional.push(`| ${c.label} | ${c.owned ?? '—'} | ${built.map((s) => `${s} (\`${c.steps[s]}\`)`).join(', ') || '—'} | ${(c.missing ?? []).join(', ') || '—'} | ${c.gaps ?? '—'} |`);
}
lines.push('', `${met} of ${brandCats} brand and narrow categories meet the target.`, '');
lines.push('## Functional coverage', '', 'What buying one makes, the steps its life can take by the command or scheduled kind that takes each, the',
  'steps that fit it and aren\'t built, and what else is short. A step\'s kind is checked against the engine and the screens each time this report is written or checked.', '');
lines.push('| Category | Owned As | Steps Built | Steps Missing | Gaps |', '|---|---|---|---|---|', ...functional);
lines.push('', '## Service directories', '', 'Counted by their own structure: providers, branches or listings, and the towns they cover.', '');
lines.push('| Category | Providers | Branches Or Listings | Towns |', '|---|---|---|---|');
for (const c of CATEGORIES.filter((x) => x.structure === 'service')) {
  const k = SERVICES[c.id]?.() ?? { providers: 0, branches: 0, towns: 0 };
  lines.push(`| ${c.label} | ${k.providers} | ${k.branches} | ${k.towns} |`);
}
lines.push('');
if (broken.length) { console.log(`Functional coverage names steps nothing takes:\n  ${broken.join('\n  ')}`); process.exit(1); }
const text = `${lines.join('\n')}\n`;
if (mode === 'write') { writeFileSync(OUT, text); console.log(`Wrote ${OUT}: ${met} of ${brandCats} categories meet the target.`); }
else {
  let now = '';
  try { now = readFileSync(OUT, 'utf8'); } catch { /* missing */ }
  if (now !== text) { console.log(`${OUT} is behind the catalogs. Run: npx vite-node tools/catalog-coverage.mjs --write`); process.exit(1); }
  console.log(`${OUT} is current: ${met} of ${brandCats} categories meet the target.`);
}
