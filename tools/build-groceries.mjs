// Builds src/engine/content/groceries.ts from docs/research/world/research-groceries.json
// (and research-groceries2.json and research-groceries3.json where they're there) and the recipes in
// research-cooking-alcohol.json (Stage 4 of docs/BACKLOG.md, from 2026-10-01).
//
// Each product keeps its chain, exact name, size, regular price, where it's
// kept and how long it keeps there (USDA FoodKeeper, from purchase). The food
// it is, which a recipe's ingredient asks for, is read from its name: the last
// food word in it, as a garment is read (tools/build-clothing.mjs), or in a
// Spanish name the first (\`productKey\`). A recipe
// keeps its source, servings, minutes and appliances, and each ingredient as
// the food it is and how much; seasonings, spices, stock, water and the like
// are taken as in the cupboard. An ingredient no shop here stocks is kept by
// name, and the recipe isn't cooked where it can't be bought.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { brandIndex } from './brands.mjs';

const OUT = 'src/engine/content/groceries.ts';
const read = (f) => JSON.parse(readFileSync(`docs/research/world/${f}`, 'utf8'));
const g = read('research-groceries.json');
const more = existsSync('docs/research/world/research-groceries2.json') ? read('research-groceries2.json') : { products: [] };
// The foods a town's recipes asked for that its grocer had none of in those two, read from the chains' own feeds on
// 2026-10-04, each with the brand its name states.
const third = existsSync('docs/research/world/research-groceries3.json') ? read('research-groceries3.json') : { products: [] };
// Coffee, tea, juice, bottled water, beer and wine from the same feeds, a shelf's makers before its sizes (2026-10-04).
const drinks = existsSync('docs/research/world/research-groceries-drinks.json') ? read('research-groceries-drinks.json') : { products: [] };
const recipesIn = read('research-cooking-alcohol.json').recipes;

/**
 * Food words, the key each names. Order doesn't matter: the last word in a name wins, the longer where two end together;
 * in a Spanish name the first, the longer where two start together.
 */
const KEYS = [
  ['peanut-butter', /peanut butter|crema de cacahuate|crema mister cacahuate/],
  ['pasta-sauce', /pasta sauce|marinara|bolognese sauce|passata|tomato sauce|salsa para pasta/],
  ['tomatoes-canned', /(canned|tinned|chopped|diced) tomato(es)?|tomato pur[eé]e|tomato paste|tomate molido|pur[eé] de tomate|tomates? (en lata|picad)/],
  ['tortilla', /tortillas?|masa harina|harina de ma[ií]z|wraps?\b|maseca/],
  ['milk', /\bmilk\b|buttermilk|leche/],
  ['eggs', /\beggs?\b|huevos?/],
  ['bread', /\bbread\b|\bloaf\b|\bbap\b|bread rolls?|breadcrumbs|baguette|\bpan\b|bolillo/],
  ['butter', /\bbutter\b|lower-fat spread|margarine|mantequilla/],
  ['cheese', /cheese|cheddar|queso/],
  ['yogurt', /yogh?urt|yogur/],
  ['rice', /\brice\b|arroz/],
  ['pasta', /pasta|spaghetti|macaroni|noodles|penne|fusilli|fideos?/],
  ['flour', /\bflour\b|harina/],
  ['oil', /\boil\b|aceite/],
  ['sugar', /\bsugar\b|az[uú]car/],
  ['salt', /\bsalt\b|\bsal\b/],
  ['chicken', /chicken|turkey|pollo|pechuga/],
  ['beef', /beef|mince|steak|carne molida|\bres\b/],
  ['bacon', /bacon|rashers?|tocino/],
  ['sausage', /sausages?|salchichas?|chorizo/],
  ['fish', /fish|tilapia|\bcod\b|salmon|haddock|pescado|filete/],
  ['tuna', /tuna|at[uú]n/],
  ['beans', /beans|chick ?peas|garbanzo|lentils|lentejas?|dhal|dal\b|frijol(es)?/],
  ['onion', /onions?|cebollas?/],
  ['garlic', /garlic|\bajo\b/],
  ['potato', /potato(es)?|\bpapas?\b/],
  ['carrot', /carrots?|zanahorias?/],
  ['lettuce', /lettuce|lechuga/],
  ['apple', /\bapples?\b|manzanas?/],
  ['banana', /bananas?|pl[aá]tanos?/],
  ['orange', /\boranges?\b|naranjas?/],
  ['lemon', /\blemons?\b|\blimes?\b|lim[oó]n(es)?/],
  ['tomato', /tomato(es)?|jitomates?|tomates?/],
  ['mushroom', /mushrooms?|champi[nñ][oó]n(es)?/],
  ['leek', /\bleeks?\b|poro/],
  ['celery', /celery|apio/],
  ['courgette', /courgettes?|zucchini|calabacitas?|(?:green|italian) squash|calabaza italiana/],
  ['pepper', /(bell|sweet|red|green|yellow|mixed) peppers?|peppers?\b(?! \()|pimientos?/],
  ['chilli', /chill?i(es)?\b(?! powder)|jalape[nñ]o peppers?|jalape[nñ]os?|serrano/],
  ['spinach', /spinach|espinacas?/],
  ['broccoli', /broccoli|br[oó]coli/],
  ['cabbage', /cabbage|col\b|repollo/],
  ['cucumber', /cucumbers?|pepinos?/],
  ['squash', /squash|butternut|calabaza/],
  ['chayote', /chayotes?(?: squash)?/],
  ['swede', /\bswedes?\b|rutabagas?/],
  ['turnip', /turnips?|nabo/],
  ['berries', /berries|berry (?:medley|blend|mix)|blueberr|raspberr|strawberr|cherries|summer fruits|frutos rojos|fresas?/],
  ['dried-fruit', /sultanas|raisins|dried (cranberries|apricots)|ready to eat apricots|pasas/],
  ['frozen-veg', /\bpeas\b|mixed vegetables|sweetcorn|sweet corn|\bcorn\b(?! flakes)|green beans|frozen vegetables|vegetable blend|peas (&|and) carrots|verduras|elote|ma[ií]z/],
  ['oats', /\boats\b|porridge|oatmeal|avena/],
  ['cereal', /cereal|corn ?flakes/],
  ['coffee', /coffee(?: whole)? beans?|coffee|caf[eé]/],
  ['tea', /\btea\b|(?<![a-z])t[eé](?![a-z])/],
  ['juice', /juice|jugo/],
  ['water', /\bwater\b|\bagua\b/],
  ['beer', /\bbeer\b|lager|cerveza|\bale\b/],
  ['wine', /\bwine\b|merlot|cabernet|pinot|\bvino\b|shiraz|sauvignon/],
  ['aubergine', /aubergines?|eggplants?|berenjenas?/],
  ['pineapple', /pineapples?|\bpi[nñ]a\b/],
  ['pizza', /pizza/],
  ['ready-meal', /lasagn[ae]|cottage pie|macaroni (&|and) cheese|hot pockets|shepherd'?s pie|enchiladas/],
];

/** Taken as in the cupboard: seasonings, spices, stock, water and the like. */
const CUPBOARD = /^(salt|pepper)\b|\b(black|white|ground) pepper|salt and pepper|herbs?|oregano|cumin|chill?i powder|cayenne|turmeric|garam|paprika|cinnamon|\bginger\b|coriander|cilantro|parsley|chives|thyme|bay leaf|epazote|vanilla|stock|broth|bouillon|gravy|water\b|baking soda|mustard|soy sauce|curry paste|pesto|honey|mayonnaise|cornflour|wheat (germ|bran)|zest/;

/**
 * A name without what it's packed or flavored with, or made without: "tuna in spring water" is tuna, "soft cheese
 * with garlic and herbs" cheese, Hunt's "Tomato Paste - No Salt Added" tomato paste (salt until 2026-10-04). A bag
 * to steam in is the pack: Price Rite's "Steam in Bag Mixed Vegetables" were a steam and no food until then.
 */
const headOf = (text) => String(text).toLowerCase().replace(/\bno [a-z ]+ added\b/g, '').replace(/steam[- ]in[- ]bag/g, 'steam bag').split(/ (?:in|with|en|con) /)[0];

function keyOf(text, first = false) {
  const t = headOf(text);
  let best;
  for (const [key, re] of KEYS) {
    for (const m of t.matchAll(new RegExp(re.source, 'g'))) {
      const end = m.index + m[0].length;
      const better = first ? !best || m.index < best.start || (m.index === best.start && m[0].length > best.len) : !best || end > best.end || (end === best.end && m[0].length > best.len);
      if (better) best = { start: m.index, end, len: m[0].length, key };
    }
  }
  return best?.key;
}

/** Made from a food, and not it: a stock, a bouillon, a soup. A recipe's stock is the cupboard's, so no recipe buys one. */
const MADE = /stock|bouillon|broth|consom[eé]|\bsoups?\b|\bsopas?\b|\bcaldos?\b|gravy/;
const SAUCE = new RegExp(KEYS.find(([key]) => key === 'pasta-sauce')[1].source);
/** A juice is the juice, whatever fruit it's of: Smart & Final's "First Street Juice, Apple" isn't an apple. A Spanish name's first word already says so. */
const JUICE = /\bjuice\b/;
/** A fresh food off the pantry shelf is kept another way: a tomato there is canned, cranberries dried. */
const PRESERVED = { tomato: 'tomatoes-canned', berries: 'dried-fruit' };

/**
 * The food a product is (from 2026-10-04). A Mexican product's name is
 * Spanish, read from its first food word, as Chedraui names a product noun
 * first: "Jugo Jumex Naranja" is juice and "Naranja de Jugo" an orange,
 * "Tortilla de Maíz" a tortilla. A stock, a bouillon or a soup is no food a
 * recipe buys; what the shop sells as a ready meal is one; a sauce is the
 * sauce and a juice the juice whatever's in it; a fresh food off the pantry shelf is its canned or
 * dried kind. Until then every name was read from its last food word and none
 * of this held, and a recipe short of chicken bought stock cubes for it,
 * cheapest in five of the eight towns: Herb-Ox's, Knorr's, Tesco's, Chedraui's
 * consommé, and in Dublin Oxo's beef for the mince. Once the cubes were gone,
 * London's chicken was Tesco's Chicken Tikka Masala and Vancouver's a butter
 * chicken entrée. Los Angeles' garlic was First Street's pasta sauce, its bell
 * pepper a jalapeño and its blueberries Ocean Spray's dried cranberries;
 * Toronto's peppers were Prego's sauce, Vancouver's peas Italissima's chick
 * peas, Mexico City's beef mince Nissin's instant soup and its peas a pack of
 * tortillas.
 */
function productKey(p) {
  const head = headOf(p.name);
  const key = MADE.test(head) ? undefined : SAUCE.test(head) ? 'pasta-sauce' : JUICE.test(head) ? 'juice' : keyOf(p.name, p.market === 'MX');
  // Sold as a ready meal, it's eaten as one, a pizza pocket as a pizza: Tesco's Chicken Tikka Masala isn't the chicken.
  if (p.category === 'ready-meal') return key === 'pizza' ? key : 'ready-meal';
  return (p.category === 'pantry' && PRESERVED[key]) || key;
}

/** The FoodKeeper row for a food, by its key and category. */
const SHELF_ROW = {
  bread: 'bread', tortilla: 'flour tortillas', milk: 'milk', eggs: 'eggs in shell', butter: 'butter', cheese: 'hard cheese', yogurt: 'yogurt',
  rice: 'white rice', pasta: 'dry pasta', flour: 'white flour', oil: 'vegetable or olive oil', sugar: 'granulated sugar', salt: 'table salt',
  chicken: 'chicken breast', beef: 'ground beef', fish: 'lean fish', tuna: 'canned tuna', beans: 'canned goods, low acid', 'tomatoes-canned': 'canned goods, high acid',
  tomato: 'tomatoes', onion: 'onions', potato: 'potatoes', carrot: 'carrots', lettuce: 'lettuce', apple: 'apples', banana: 'bananas',
  'frozen-veg': 'frozen vegetables', pizza: 'frozen pizza', 'ready-meal': 'frozen entrees', cereal: 'ready-to-eat cereal', oats: 'oats',
  coffee: 'coffee, commercial ground', tea: 'tea bags', 'peanut-butter': 'peanut butter', 'pasta-sauce': 'pasta sauce', juice: 'fruit juice',
  water: 'bottled water', beer: 'beer', wine: 'wine',
};
const rowFor = (key) => (SHELF_ROW[key] ? g.shelfLife.find((s) => s.food.startsWith(SHELF_ROW[key])) : undefined);

/**
 * Where none is published (FoodKeeper gives milk only its use-by date, and
 * has no row for the vegetables added later), SLATE's estimate by kind:
 * fresh dairy a week, fresh meat and fish two days, produce a week, bread a
 * week, anything frozen three months, a dry or canned good a year.
 */
const ESTIMATE = { dairy: 7, meat: 2, seafood: 2, produce: 7, bakery: 7, frozen: 90, pantry: 365, beverage: 365, 'ready-meal': 3, alcohol: null };

function keepsFor(key, category, storage) {
  const row = rowFor(key);
  const pick = (...fields) => fields.map((f) => row?.[f]?.minDays).find((d) => typeof d === 'number');
  // Kept cold, what keeps in the cupboard keeps at least as long: a chilled juice is FoodKeeper's carton juice.
  const days = storage === 'freezer' ? pick('freezerFromPurchase', 'freezer') : storage === 'fridge' ? pick('fridgeFromPurchase', 'fridge', 'pantryFromPurchase', 'pantry') : pick('pantryFromPurchase', 'pantry');
  if (days !== undefined) return { keepsDays: days, keepsEstimated: false, keepsSource: row.source };
  // Sugar, salt, water, beer and wine keep: FoodKeeper gives them no limit.
  if (['sugar', 'salt', 'water', 'beer', 'wine'].includes(key)) return { keepsDays: null, keepsEstimated: false, keepsSource: 'Keeps indefinitely' };
  // A ready meal kept in the cupboard is a dry one, a box of macaroni and cheese or an instant soup: a dry good's year,
  // not a chilled meal's three days (until 2026-10-04 it went off in three).
  const est = storage === 'freezer' ? ESTIMATE.frozen : storage === 'pantry' && category === 'ready-meal' ? ESTIMATE.pantry : ESTIMATE[category] ?? 7;
  return { keepsDays: est, keepsEstimated: true, keepsSource: 'SLATE’s estimate' };
}

const storageOf = (p, key) => p.storage ?? (p.category === 'frozen' ? 'freezer' : ['dairy', 'meat', 'seafood', 'ready-meal'].includes(p.category) ? 'fridge' : 'pantry');
const slug = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

// The brand each product's own name states (`tools/brands.mjs`, from 2026-10-04), null where it names none: fresh
// produce, mostly.
const BRANDS = brandIndex();

const seen = new Set();
const products = [];
for (const p of [...g.products, ...(more.products ?? []), ...(third.products ?? []), ...(drinks.products ?? [])]) {
  if (typeof p.price !== 'number' || !(p.price > 0)) continue;
  const key = productKey(p);
  if (!key) continue;
  let id = `${p.chain}-${slug(p.name)}`.slice(0, 80);
  for (let n = 2; seen.has(id); n += 1) id = `${p.chain}-${slug(p.name)}`.slice(0, 76) + `-${n}`;
  seen.add(id);
  const storage = storageOf(p, key);
  // A dry pint of cherry or grape tomatoes is two cups, 298 g (USDA FoodData Central: 149 g a cup).
  const pint = p.sizeUnit === 'ct' && p.sizeQty === 1 && /\bpint\b/i.test(`${p.size} ${p.name}`) && p.category === 'produce';
  products.push({
    id, chain: p.chain, market: p.market, name: p.name, brand: BRANDS.has(`${p.chain}|${p.market}|${p.name}`) ? BRANDS.get(`${p.chain}|${p.market}|${p.name}`) : p.brand ?? null, category: p.category, food: key,
    sizeQty: pint ? 298 : p.sizeQty, sizeUnit: pint ? 'g' : p.sizeUnit, price: p.price, currency: p.currency, taxIncluded: p.taxIncluded === true,
    storage, ...keepsFor(key, p.category, storage),
    url: p.url ?? null, date: p.date ?? null, confirmed: p.confirmed === true,
  });
}
const chainsWith = new Set(products.map((p) => p.chain));
const chains = g.chains.filter((c) => chainsWith.has(c.id)).map((c) => ({ id: c.id, name: c.name, market: c.market, storesIn: c.storesIn ?? [], nearestTo: Object.keys(c.nearestTo ?? {}) }));

/** A recipe's ingredient: the food it is where a shop could stock it, the cupboard's, or one no shop here stocks. */
const NEEDS = { stove: 'stove', oven: 'oven', grill: 'grill', microwave: 'microwave', freezer: 'freezer', none: null, blender: 'blender', 'slow cooker': 'slow-cooker', 'rice cooker': 'rice-cooker' };
const recipes = recipesIn.map((r) => {
  const ingredients = r.ingredients.map((i) => {
    const key = keyOf(i.food);
    // A seasoning first: black pepper is the cupboard's, not a sweet pepper; stock is the cupboard's, not the beef it's made of.
    if (CUPBOARD.test(headOf(i.food))) return { name: i.food, cupboard: true };
    return { name: i.food, food: key ?? null, quantity: typeof i.quantity === 'number' ? i.quantity : null, unit: i.unit ?? null };
  });
  const minutes = typeof r.prepMinutes === 'number' || typeof r.cookMinutes === 'number' ? (r.prepMinutes ?? 0) + (r.cookMinutes ?? 0) : null;
  return {
    id: r.id, name: r.name, source: r.source, url: r.url, mealType: r.mealType ?? null, cuisine: r.cuisine ?? null,
    servings: r.servings, minutes, appliances: (r.appliances ?? []).map((a) => NEEDS[a] ?? a).filter(Boolean),
    ingredients, kcal: typeof r.caloriesPerServing === 'number' ? r.caloriesPerServing : null,
    keepsDays: typeof r.keepsInFridgeDays === 'number' ? r.keepsInFridgeDays : null,
  };
});

const body = `/**
 * SLATE — groceries and recipes (Stage 4 of \`docs/BACKLOG.md\`), built by
 * \`tools/build-groceries.mjs\` from \`docs/research/world/research-groceries*.json\`
 * and the recipes in \`research-cooking-alcohol.json\`. Don't edit by hand;
 * rebuild it.
 *
 * A product's price is its chain's regular shelf price as its own data feed
 * listed it on the date given (\`confirmed\`), or a price tracker's where the
 * chain blocked the read. With VAT or IVA in Britain, Ireland and Mexico;
 * before any sales tax in America and Canada. How long it keeps where it's
 * kept is USDA FoodKeeper's, from purchase, or SLATE's estimate where
 * FoodKeeper gives none (\`keepsEstimated\`); null keeps indefinitely.
 *
 * A recipe is its source's: NHS Healthier Families, USDA MyPlate, safefood,
 * Health Canada and a DIF school recetario. An ingredient is the food it is,
 * the cupboard's, or one no shop here stocks (\`food: null\`).
 */

export type FoodUnit = 'g' | 'ml' | 'ct';
export type Storage = 'pantry' | 'fridge' | 'freezer';

export interface GroceryChain { id: string; name: string; market: string; storesIn: readonly string[]; nearestTo: readonly string[] }

export interface GroceryProduct {
  id: string; chain: string; market: string; name: string;
  /** The brand its own name states (from 2026-10-04): a maker's, or the chain's own label; null where it names none. */
  brand: string | null;
  category: string; food: string;
  sizeQty: number; sizeUnit: FoodUnit; price: number; currency: string; taxIncluded: boolean;
  storage: Storage; keepsDays: number | null; keepsEstimated: boolean; keepsSource: string;
  url: string | null; date: string | null; confirmed: boolean;
}

export type Ingredient = { name: string; cupboard: true } | { name: string; food: string | null; quantity: number | null; unit: FoodUnit | null; cupboard?: undefined };

export interface Recipe {
  id: string; name: string; source: string; url: string; mealType: string | null; cuisine: string | null;
  servings: number; minutes: number | null; appliances: readonly string[];
  ingredients: readonly Ingredient[]; kcal: number | null; keepsDays: number | null;
}

export const GROCERY_CHAINS: readonly GroceryChain[] = ${JSON.stringify(chains)};

// Parsed from strings: as literals, the lists are more than the typechecker will hold comfortably.
export const GROCERY_PRODUCTS: readonly GroceryProduct[] = JSON.parse(${JSON.stringify(JSON.stringify(products))});

export const RECIPES: readonly Recipe[] = JSON.parse(${JSON.stringify(JSON.stringify(recipes))});
`;
writeFileSync(OUT, body);
const by = {};
for (const p of products) by[p.market] = (by[p.market] ?? 0) + 1;
console.log('chains', chains.length, 'products', products.length, by, 'recipes', recipes.length);
const lacking = {};
for (const r of recipes) for (const i of r.ingredients) if (!i.cupboard && !i.food) lacking[i.name] = (lacking[i.name] ?? 0) + 1;
console.log('no shop stocks:', Object.keys(lacking).length, Object.keys(lacking).slice(0, 30).join(', '));
