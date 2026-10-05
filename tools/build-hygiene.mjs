// Builds src/engine/content/hygiene.ts from docs/research/world/research-hygiene.json
// (Stage 5 of docs/BACKLOG.md, from 2026-10-01): toiletries at the grocery
// chains, each at its shelf price as the chain's own feed listed it, and the
// barbers and salons of the business's towns with their own price lists.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const OUT = 'src/engine/content/hygiene.ts';
const j = JSON.parse(readFileSync('docs/research/world/research-hygiene.json', 'utf8'));
const slug = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

// Each product's brand as its own name states it (`research-brands-from-names.json`, read 2026-10-04); null where the
// name names none, as fresh produce mostly doesn't.
const BRANDS = new Map(JSON.parse(readFileSync('docs/research/world/research-brands-from-names.json', 'utf8')).items.map((i) => [`${i.chain}|${i.name}`, i.brand ?? null]));
const brandOf = (p) => BRANDS.get(`${p.chain}|${p.name}`) ?? p.brand ?? null;
// And from 2026-10-05 makeup and hair styling at the same chains, with the SCCS's grams a day for each (`research-cosmetics.json`).
const COSMETICS = existsSync('docs/research/world/research-cosmetics.json') ? JSON.parse(readFileSync('docs/research/world/research-cosmetics.json', 'utf8')) : { products: [], usage: [] };
// And more brands at the same chains (`research-cosmetics-2.json`), the amounts the first file's.
for (const more of ['research-cosmetics-2.json', 'research-cosmetics-3.json']) if (existsSync(`docs/research/world/${more}`)) COSMETICS.products = [...(COSMETICS.products ?? []), ...(JSON.parse(readFileSync(`docs/research/world/${more}`, 'utf8')).products ?? [])];
const COSMETIC_KINDS = ['foundation', 'lipstick', 'mascara', 'eye-shadow', 'eyeliner', 'hair-styling'];
const cosmeticUse = Object.fromEntries((COSMETICS.usage ?? []).filter((u) => COSMETIC_KINDS.includes(u.kind) && u.gPerDay > 0).map((u) => [u.kind, u.gPerDay]));

const seen = new Set();
const toiletries = [...j.products, ...(COSMETICS.products ?? []).filter((p) => COSMETIC_KINDS.includes(p.kind) && cosmeticUse[p.kind] && p.sizeQty > 0 && (p.sizeUnit === 'g' || p.sizeUnit === 'ml'))].filter((p) => typeof p.price === 'number' && p.price > 0).map((p) => {
  let id = `${p.chain}-${slug(p.name)}`.slice(0, 80);
  for (let n = 2; seen.has(id); n += 1) id = `${p.chain}-${slug(p.name)}`.slice(0, 76) + `-${n}`;
  seen.add(id);
  // Its stores are 'tesco-gb' and its research filed its toiletries as 'tesco': one chain, from 2026-10-02, until when
  // Tesco's toiletries were never in reach in London nor held to its hours. The ids keep 'tesco', as saves hold them.
  return { id, chain: p.chain === 'tesco' ? 'tesco-gb' : p.chain, market: p.market, name: p.name, brand: brandOf(p), kind: p.kind, sizeQty: p.sizeQty, sizeUnit: p.sizeUnit, price: p.price, currency: p.currency, taxIncluded: p.taxIncluded === true, url: p.url ?? null, date: p.date ?? null, confirmed: p.confirmed === true };
});

const CITY = {
  'new-york': 'us-ny-newyork', 'los-angeles': 'us-ca-losangeles', 'new-haven': 'us-ct-newhaven', london: 'uk-eng-london',
  dublin: 'ie-lei-dublin', toronto: 'ca-on-toronto', vancouver: 'ca-bc-vancouver', 'mexico-city': 'mx-cmx-mexicocity',
};
const salons = j.grooming.places.map((p) => ({
  id: slug(`${p.name}-${p.city}`).slice(0, 70), name: p.name, cityId: CITY[p.city] ?? p.city, kind: p.kind ?? null, tier: p.tier ?? null,
  address: p.address ?? null, neighborhood: p.neighborhood ?? null,
  services: (p.services ?? []).map((s) => ({ service: s.service, label: s.label, price: typeof s.price === 'number' && s.price > 0 ? s.price : null, from: s.priceFrom === true, currency: s.currency, minutes: typeof s.minutes === 'number' ? s.minutes : null })),
  url: p.url ?? null, date: p.date ?? null, confirmed: p.confirmed === true,
})).filter((p) => p.cityId.includes('-'));

const body = `/**
 * SLATE — toiletries and the barbers and salons (Stage 5 of
 * \`docs/BACKLOG.md\`), built by \`tools/build-hygiene.mjs\` from
 * \`docs/research/world/research-hygiene.json\`. Don't edit by hand; rebuild it.
 *
 * A toiletry is a grocery chain's product at its regular shelf price as its
 * own feed listed it (\`confirmed\`), or a price tracker's for Tesco and
 * Sainsbury's. A salon's services are its own price list's; a price marked
 * \`from\` is the list's starting price, and one not found is null.
 */

export interface Toiletry {
  id: string; chain: string; market: string; name: string;
  /** The brand its name states; null where it names none (from 2026-10-05). */
  brand: string | null;
  kind: string;
  sizeQty: number; sizeUnit: 'g' | 'ml' | 'ct'; price: number; currency: string; taxIncluded: boolean;
  url: string | null; date: string | null; confirmed: boolean;
}

export interface SalonService { service: string; label: string; price: number | null; from: boolean; currency: string; minutes: number | null }
export interface Salon {
  id: string; name: string; cityId: string; kind: string | null; tier: string | null; address: string | null; neighborhood: string | null;
  services: readonly SalonService[]; url: string | null; date: string | null; confirmed: boolean;
}

export const TOILETRIES: readonly Toiletry[] = JSON.parse(${JSON.stringify(JSON.stringify(toiletries))});

export const SALONS: readonly Salon[] = JSON.parse(${JSON.stringify(JSON.stringify(salons))});

/** Makeup's and hair styling's grams a day where worn, the SCCS's Notes of Guidance (from 2026-10-05): Table 3A's foundation, lipstick and hair styling as applied, Table 3B's mascara, eye shadow and eyeliner; a milliliter taken as a gram. */
export const COSMETIC_G_A_DAY: Readonly<Record<string, number>> = ${JSON.stringify(cosmeticUse)};
`;
writeFileSync(OUT, body);
console.log('toiletries', toiletries.length, 'salons', salons.length, [...new Set(salons.map((s) => s.cityId))].join(' '));
