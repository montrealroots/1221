/**
 * Builds `src/engine/content/petcare.ts` from
 * `docs/research/world/research-pet-care.json` (read 2026-10-04): each
 * market's dry dog and cat foods and cat litters at a named retailer's own
 * price, and each town's vet's yearly visit and vaccines.
 *
 * Run: node tools/build-pet-care.mjs
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const R = JSON.parse(readFileSync('docs/research/world/research-pet-care.json', 'utf8'));
const OUT = 'src/engine/content/petcare.ts';
const market = (m) => (/^US/.test(m) ? 'us' : /^UK/.test(m) ? 'uk' : /^Ireland/.test(m) ? 'ie' : /^Canada/.test(m) ? 'ca' : /^Mexico/.test(m) ? 'mx' : undefined);
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

// Each food's energy as its label states it (`research-pet-food-energy.json`, from 2026-10-05): a day is fed by energy,
// so a wet food is sold where its calories were read. Until then only dry foods were, by Royal Canin's grams.
const ENERGY_FILE = 'docs/research/world/research-pet-food-energy.json';
const ENERGY = new Map((existsSync(ENERGY_FILE) ? JSON.parse(readFileSync(ENERGY_FILE, 'utf8')).energy ?? [] : []).map((e) => [`${e.market}|${e.brand}|${e.product}`, e]));
const kcalOf = (x) => { if (x.kcalPerKg > 0) return x.kcalPerKg; if (x.kcalPerUnit > 0 && x.unitG > 0) return Math.round((x.kcalPerUnit / x.unitG) * 1000); const e = ENERGY.get(`${x.market}|${x.brand}|${x.product}`); if (!e) return null; if (e.kcalPerKg > 0) return e.kcalPerKg; return e.kcalPerUnit > 0 && e.unitG > 0 ? Math.round((e.kcalPerUnit / e.unitG) * 1000) : null; };
/** A pack's kilograms from its size where none was given: "32 x 5.5 oz", "40 x 85 g", "5.5 oz can", "85 g". */
const kgOf = (x) => { if (x.kg) return x.kg; const m = String(x.size).match(/(?:(\d+)\s*x\s*)?([\d.]+)\s*(oz|g)\b/i); if (!m) return undefined; const each = Number(m[2]) * (m[3].toLowerCase() === 'oz' ? 28.349523125 : 1); return Math.round(((Number(m[1] ?? 1) * each) / 1000) * 10000) / 10000; };
// And from 2026-10-05 more brands, each read with its own calories (`research-pet-food-2.json`).
const MORE_FOOD = 'docs/research/world/research-pet-food-2.json';
const allFoods = [...R.feeding.products, ...(existsSync(MORE_FOOD) ? JSON.parse(readFileSync(MORE_FOOD, 'utf8')).products ?? [] : [])];
const foods = allFoods.filter((x) => (/^dry /.test(x.type) || (/^wet /.test(x.type) && kcalOf(x))) && kgOf(x)).map((x) => ({
  id: `${market(x.market)}-${slug(`${x.brand} ${x.product}`)}`, market: market(x.market), species: /dog/.test(x.type) ? 'dog' : 'cat',
  brand: x.brand, product: x.product, kg: kgOf(x), wet: /^wet /.test(x.type), kcalPerKg: kcalOf(x), price: x.price, currency: x.currency, retailer: x.retailer.replace(/ \(.*\)$/, ''), url: x.url, status: x.status === 'verified' ? 'verified' : 'secondhand',
}));
// A litter's kilograms where it's sold by the liter: Cat's Best's 20 liters to 8.6 kilograms, 0.43 a liter, SLATE's reading for the rest.
const KG_PER_L = 8.6 / 20;
const litters = R.supplies.litterProducts.map((x) => {
  const liters = Number(String(x.size).match(/([\d.]+)\s*L\b/)?.[1]);
  const kg = x.kg ?? (Number.isFinite(liters) ? Math.round(liters * KG_PER_L * 100) / 100 : undefined);
  return kg ? { id: `${market(x.market)}-${slug(x.product)}`, market: market(x.market), product: x.product, kg, byLiters: !x.kg, price: x.price, currency: x.currency, retailer: x.retailer, url: x.url, status: x.status === 'verified' ? 'verified' : 'secondhand' } : undefined;
}).filter(Boolean);

const TOWN = { 'New York': 'us-ny-newyork', 'Los Angeles': 'us-ca-losangeles', 'New Haven': 'us-ct-newhaven', London: 'uk-eng-london', Dublin: 'ie-lei-dublin', Toronto: 'ca-on-toronto', Vancouver: 'ca-bc-vancouver', 'Mexico City': 'mx-cmx-mexicocity' };
const vets = {};
for (const c of R.vet.clinics) {
  const id = TOWN[c.town];
  if (!id) continue;
  let dog; let cat; let basis;
  if (c.officeVisit !== undefined) { dog = c.officeVisit + c.dogDAPP + c.rabies; cat = c.officeVisit + c.catFVRCP + c.rabies; basis = 'its office visit, the combination vaccine and rabies'; }
  else if (c.dogAnnualBooster !== undefined) { dog = c.dogAnnualBooster; cat = c.catAnnualBooster; basis = 'its yearly booster, which in Britain takes in the exam'; }
  else if (c.dogBooster !== undefined) { dog = c.consultation + c.dogBooster; cat = c.consultation + c.catBooster; basis = 'a consultation and the yearly booster'; }
  else if (c.wellnessExam !== undefined) { dog = c.wellnessExam + 2 * c.vaccineEach; cat = c.wellnessExam + 2 * c.vaccineEach; basis = 'its wellness exam and two core vaccines'; }
  else if (c.exam !== undefined) { dog = c.exam + c.dogDHPPL + c.rabies; cat = c.exam + c.catFVRCPplusFeLV + c.rabies; basis = 'its exam, the combination vaccine and rabies'; }
  else if (c.canineSextuple !== undefined) { dog = c.consultation + c.canineSextuple; cat = c.consultation + c.canineSextuple; basis = 'a consultation and the dog’s six-in-one, standing in for a cat’s, whose price wasn’t read; rabies free'; }
  vets[id] = { clinic: c.clinic, dog: Math.round(dog * 100) / 100, cat: Math.round(cat * 100) / 100, currency: c.currency, basis, url: c.url, status: c.status === 'verified' ? 'verified' : 'secondhand' };
}

const head = `/**
 * SLATE — what a pet eats, uses and costs at the vet, by market, from
 * \`docs/research/world/research-pet-care.json\` (read 2026-10-04), built by
 * \`tools/build-pet-care.mjs\`.
 *
 * - **Food**: each market's dry dog and cat foods at a named retailer's own
 *   price (Walmart.com and Chewy in America, zooplus and Pets at Home in
 *   Britain, zooplus and Maxi Zoo in Ireland, PetSmart in Canada, Petco in
 *   Mexico). A day's ration is Royal Canin's own: 273 grams for a 20 kg dog
 *   at normal activity, 56 for a 4 kg cat, which at its 3,616 and 3,534 kcal
 *   a kilogram is 987 and 198 kcal. From 2026-10-05 a day is fed by that
 *   energy, each food at its label's own kcal a kilogram, so a wet food is
 *   sold where its calories were read; a food whose figure wasn't read is
 *   taken at Royal Canin's. Until then only dry foods were, by grams.
 * - **Litter**: 1.9 kg a week for one cat, the middle of the 15 to 20 pounds
 *   a month read secondhand, SLATE's reckoning; a litter sold by the liter at
 *   Cat's Best's 0.43 kg a liter.
 * - **The vet**: each town's named clinic's yearly visit and core vaccines.
 * - **A walk**: the PDSA's hour at the least for a medium dog, at the 2024
 *   Compendium's 3.0 METs for walking one (17165).
 */
`;
const body = `
export type PetMarket = 'us' | 'uk' | 'ie' | 'ca' | 'mx';
export interface PetFood { id: string; market: PetMarket; species: 'dog' | 'cat'; brand: string; product: string; kg: number; wet: boolean; kcalPerKg: number | null; price: number; currency: string; retailer: string; url: string; status: 'verified' | 'secondhand' }
export interface Litter { id: string; market: PetMarket; product: string; kg: number; byLiters: boolean; price: number; currency: string; retailer: string; url: string; status: 'verified' | 'secondhand' }
export interface VetYear { clinic: string; dog: number; cat: number; currency: string; basis: string; url: string; status: 'verified' | 'secondhand' }

export const RATION_G = { dog: 273, cat: 56 } as const;
/** Royal Canin's own foods' energy, kcal a kilogram, and so the day's need, kcal: its ration of its food (from 2026-10-05). */
export const RATION_KCAL_PER_KG = { dog: 3616, cat: 3534 } as const;
export const KCAL_A_DAY = { dog: (RATION_G.dog * RATION_KCAL_PER_KG.dog) / 1000, cat: (RATION_G.cat * RATION_KCAL_PER_KG.cat) / 1000 } as const;
export const LITTER_KG_A_WEEK = 1.9;
export const WALK = { minutes: 60, met: 3.0 } as const;
export const PET_FOODS: readonly PetFood[] = ${JSON.stringify(foods)};
export const LITTERS: readonly Litter[] = ${JSON.stringify(litters)};
export const VET_YEAR: Readonly<Record<string, VetYear>> = ${JSON.stringify(vets)};
`;
writeFileSync(OUT, head + body);
console.log(`Wrote ${OUT}: ${foods.length} foods, ${litters.length} litters, ${Object.keys(vets).length} vets.`);
