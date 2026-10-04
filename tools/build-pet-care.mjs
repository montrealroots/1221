/**
 * Builds `src/engine/content/petcare.ts` from
 * `docs/research/world/research-pet-care.json` (read 2026-10-04): each
 * market's dry dog and cat foods and cat litters at a named retailer's own
 * price, and each town's vet's yearly visit and vaccines; and the grocers'
 * dry foods read later that day from their own feeds
 * (`research-pet-foods-grocers.json`, the same shape).
 *
 * Run: node tools/build-pet-care.mjs
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const R = JSON.parse(readFileSync('docs/research/world/research-pet-care.json', 'utf8'));
const GROCERS = existsSync('docs/research/world/research-pet-foods-grocers.json') ? JSON.parse(readFileSync('docs/research/world/research-pet-foods-grocers.json', 'utf8')).products : [];
const OUT = 'src/engine/content/petcare.ts';
const market = (m) => (/^US/.test(m) ? 'us' : /^UK/.test(m) ? 'uk' : /^Ireland/.test(m) ? 'ie' : /^Canada/.test(m) ? 'ca' : /^Mexico/.test(m) ? 'mx' : undefined);
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

// Dry food only: the daily ration is a dry food's grams. Wet foods wait for their energy per gram.
// Each its own id: a second bag of the same food is told by its weight. Until 2026-10-04 Walmart's 9.07 and 1.43 kg
// bags of Cat Chow shared one, and buying either bought the first.
const ids = new Set();
const foods = [...R.feeding.products, ...GROCERS].filter((x) => /^dry /.test(x.type) && x.kg).map((x) => {
  let id = `${market(x.market)}-${slug(`${x.brand} ${x.product}`)}`;
  if (ids.has(id)) id = `${id.slice(0, 54).replace(/-+$/, '')}-${String(x.kg).replace('.', '-')}kg`;
  for (let n = 2; ids.has(id); n += 1) id = `${id.replace(/-\d+$/, '')}-${n}`;
  ids.add(id);
  return {
    id, market: market(x.market), species: /dog/.test(x.type) ? 'dog' : 'cat',
    brand: x.brand, product: x.product, kg: x.kg, price: x.price, currency: x.currency, retailer: x.retailer.replace(/ \(.*\)$/, ''), url: x.url, status: x.status === 'verified' ? 'verified' : 'secondhand',
  };
});
// One spelling a maker: small letters before capitals (Purina ONE, though the earlier read wrote PURINA ONE), and a
// Purina line written without Purina is Purina's where the lists have it with (Pro Plan, Friskies).
const plain = (s) => s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
const spellings = new Map();
for (const f of foods) spellings.set(plain(f.brand), [...(spellings.get(plain(f.brand)) ?? []), f.brand]);
const ordinary = (b) => /[a-z]/.test(b);
const spelled = (b) => [...spellings.get(plain(b))].sort((a, z) => Number(ordinary(z)) - Number(ordinary(a)))[0];
for (const f of foods) {
  f.brand = spelled(f.brand);
  if (spellings.has(plain(`Purina ${f.brand}`))) f.brand = spelled(`Purina ${f.brand}`);
}
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
 *   Mexico), and from 2026-10-04 the grocers' own, read from their feeds
 *   (Price Rite, The Fresh Grocer, Smart & Final, SuperValu, Giant Tiger's
 *   Ontario listings, Chedraui). Each its own id, a maker spelled one way.
 *   A day's ration is Royal Canin's own: 273 grams for a 20 kg dog
 *   at normal activity, 56 for a 4 kg cat. Wet foods are read but not sold:
 *   a day's ration is a dry food's grams, and their energy per gram wasn't.
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
export interface PetFood { id: string; market: PetMarket; species: 'dog' | 'cat'; brand: string; product: string; kg: number; price: number; currency: string; retailer: string; url: string; status: 'verified' | 'secondhand' }
export interface Litter { id: string; market: PetMarket; product: string; kg: number; byLiters: boolean; price: number; currency: string; retailer: string; url: string; status: 'verified' | 'secondhand' }
export interface VetYear { clinic: string; dog: number; cat: number; currency: string; basis: string; url: string; status: 'verified' | 'secondhand' }

export const RATION_G = { dog: 273, cat: 56 } as const;
export const LITTER_KG_A_WEEK = 1.9;
export const WALK = { minutes: 60, met: 3.0 } as const;
// Parsed from strings, as the grocery, toiletry and cleaning catalogs are: their names are the retailers', not SLATE's
// prose (from 2026-10-04, when the grocers' foods brought fourteen of Chedraui's opening on "Alimento").
export const PET_FOODS: readonly PetFood[] = JSON.parse(${JSON.stringify(JSON.stringify(foods))});
export const LITTERS: readonly Litter[] = JSON.parse(${JSON.stringify(JSON.stringify(litters))});
export const VET_YEAR: Readonly<Record<string, VetYear>> = ${JSON.stringify(vets)};
`;
writeFileSync(OUT, head + body);
console.log(`Wrote ${OUT}: ${foods.length} foods, ${litters.length} litters, ${Object.keys(vets).length} vets.`);
