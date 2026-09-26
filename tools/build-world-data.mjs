/**
 * Builds SLATE's world reference data from the GeoNames public dataset.
 *
 * Two outputs, for two different jobs:
 *
 *  - `src/engine/content/world-data.ts` — every country and every first-level
 *    subdivision on Earth, plus the largest cities, compiled into the bundle.
 *    Small enough to always be there, which is what the engine needs.
 *  - `public/geo/<iso2>.tsv` — every city in that country, fetched only when
 *    somebody actually opens the picker for it. 170,000 places do not belong
 *    in a bundle, and nobody needs Andorra's villages loaded to play in Ohio.
 *
 * Run with: node tools/build-world-data.mjs <geonames-dir>
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const source = process.argv[2];
if (!source) {
  console.error('Usage: node tools/build-world-data.mjs <directory containing the GeoNames dumps>');
  process.exit(1);
}

const rows = (file, skipComments = false) => readFileSync(join(source, file), 'utf8')
  .split('\n')
  .filter((line) => line.length > 0 && (!skipComments || !line.startsWith('#')))
  .map((line) => line.split('\t'));

/**
 * SLATE has shipped with a handful of country ids that predate this data and
 * are referenced by saves, tax tables and content. ISO 3166 is the rule; these
 * are the exceptions, kept so nobody's universe loses its city.
 */
const COUNTRY_ID_OVERRIDE = { GB: 'uk' };
/**
 * Currencies GeoNames hasn't caught up with: Bulgaria has used the euro since
 * 1 January 2026, at a fixed 1.95583 leva (the European Commission). Until
 * 2026-09-26 SLATE kept it on the lev, and charged Bulbank's €2.84 fee as
 * 2.84 leva.
 */
const CURRENCY_OVERRIDE = { BG: ['EUR', 'Euro'] };

/**
 * The same exceptions for subdivisions and cities. GeoNames keys many
 * subdivisions numerically — Tokyo is JP.40, Paris is FR.11 — while SLATE's
 * hand-calibrated places were written with readable codes and are referenced
 * by tax tables, content and saves. The readable id wins; the world data is
 * mapped onto it.
 */
const REGION_ID_OVERRIDE = {
  // Empty on purpose. GeoNames numbers subdivisions its own way — Tokyo is
  // JP.40, not the ISO JP-13 — and renaming them to look like ISO collides
  // with whatever GeoNames actually put at that number. Nothing references a
  // subdivision id directly, so the dataset's own numbering stands.
};
const CITY_ID_OVERRIDE = {
  "ca-02-vancouver": "ca-bc-vancouver",
  "ca-08-toronto": "ca-on-toronto",
  "ie-l-dublin": "ie-lei-dublin",
  "fr-11-paris": "fr-idf-paris",
  "fr-93-cannes": "fr-paca-cannes",
  "de-16-berlin": "de-be-berlin",
  "es-29-madrid": "es-md-madrid",
  "es-56-barcelona": "es-cat-barcelona",
  "it-07-rome": "it-laz-rome",
  "au-02-sydney": "au-nsw-sydney",
  "au-07-melbourne": "au-vic-melbourne",
  "au-04-goldcoast": "au-qld-goldcoast",
  "nz-g2-wellington": "nz-wgn-wellington",
  "nz-e7-auckland": "nz-akl-auckland",
  "jp-40-tokyo": "jp-13-tokyo",
  "mx-09-mexicocity": "mx-cmx-mexicocity",
  "ae-03-dubai": "ae-du-dubai",
  "us-ny-newyorkcity": "us-ny-newyork",
  "ca-10-montreal": "ca-qc-montreal"
};
const countryId = (iso2) => COUNTRY_ID_OVERRIDE[iso2] ?? iso2.toLowerCase();

/** A url- and id-safe form of a place name. */
function slug(name) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 28) || 'place';
}

// --- Countries -------------------------------------------------------------

const countries = [];
for (const r of rows('countryInfo.txt', true)) {
  const [iso2, , , , name, capital, area, population, continent, , currency, currencyName, phone, , , languages] = r;
  if (!iso2 || !name) continue;
  countries.push({
    id: countryId(iso2),
    iso2,
    name,
    capital: capital || '',
    continent: continent || '',
    currency: CURRENCY_OVERRIDE[iso2]?.[0] ?? (currency || 'USD'),
    areaKm2: Number(area) || 0, currencyName: CURRENCY_OVERRIDE[iso2]?.[1] ?? (currencyName || ''), phone: phone || '', languages: languages || '',
    population: Number(population) || 0,
  });
}
countries.sort((a, b) => a.name.localeCompare(b.name));

// --- First-level subdivisions ---------------------------------------------

const regions = [];
const regionByKey = new Map();
for (const [code, name] of rows('admin1CodesASCII.txt')) {
  if (!code || !name) continue;
  const [iso2, admin1] = code.split('.');
  if (!iso2 || !admin1) continue;
  const generated = `${countryId(iso2)}-${slug(admin1)}`;
  const id = REGION_ID_OVERRIDE[generated] ?? generated;
  if (regionByKey.has(code)) continue;
  const region = { id, code: admin1, name, countryId: countryId(iso2) };
  regions.push(region);
  regionByKey.set(code, region);
}
regions.sort((a, b) => a.countryId.localeCompare(b.countryId) || a.name.localeCompare(b.name));

// --- Cities ----------------------------------------------------------------

const byCountry = new Map();
const seenId = new Set();
let total = 0;

for (const r of rows('cities1000.txt')) {
  const name = r[1];
  const lat = Number(r[4]);
  const lon = Number(r[5]);
  const iso2 = r[8];
  const admin1 = r[10];
  const population = Number(r[14]) || 0;
  const timeZone = r[17];
  if (!name || !iso2 || !timeZone || Number.isNaN(lat) || Number.isNaN(lon)) continue;
  // What kind of place: a section of a larger city (Hollywood, Brooklyn), a
  // national capital, a first-level regional capital, or an ordinary town.
  const code = r[7];
  const kind = code === 'PPLX' ? 'x' : code === 'PPLC' ? 'c' : code === 'PPLA' ? 'a' : '';

  const region = regionByKey.get(`${iso2}.${admin1}`);
  const base = region ? `${region.id}-${slug(name)}` : `${countryId(iso2)}-${slug(name)}`;
  let id = CITY_ID_OVERRIDE[base] ?? base;
  // Two towns of the same name in the same state is common. Keep both.
  for (let n = 2; seenId.has(id); n++) id = `${base}${n}`;
  seenId.add(id);

  const list = byCountry.get(iso2) ?? [];
  list.push({ id, name, regionId: region?.id ?? '', countryId: countryId(iso2), lat, lon, timeZone, population, kind });
  byCountry.set(iso2, list);
  total++;
}

// --- Per-country files -----------------------------------------------------

const outDir = 'public/geo';
mkdirSync(outDir, { recursive: true });
// Only the city files are ours to replace; the map lives here too.
for (const stale of readdirSync(outDir)) if (stale.endsWith('.tsv')) rmSync(join(outDir, stale));

const manifest = [];
for (const [iso2, list] of [...byCountry.entries()].sort()) {
  list.sort((a, b) => b.population - a.population || a.name.localeCompare(b.name));
  const body = list
    .map((c) => [c.id, c.name, c.regionId, c.lat.toFixed(4), c.lon.toFixed(4), c.timeZone, c.population, c.kind].join('\t'))
    .join('\n');
  writeFileSync(join(outDir, `${countryId(iso2)}.tsv`), body);
  manifest.push({ countryId: countryId(iso2), cities: list.length });
}
writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest));

// --- The in-bundle set -----------------------------------------------------
// Enough of the world to be playable before anything is fetched: the biggest
// places globally, plus every country's largest, so no country is empty.

const prominent = new Map();
for (const [, list] of byCountry) {
  for (const city of list.slice(0, 3)) prominent.set(city.id, city);
}
const global = [...byCountry.values()].flat().sort((a, b) => b.population - a.population).slice(0, 900);
for (const city of global) prominent.set(city.id, city);

const bundled = [...prominent.values()].sort((a, b) => b.population - a.population);

// Emitted as delimited tables rather than object literals. Three and a half
// thousand object literals is a quarter of a megabyte of source for a parser
// to chew through before the app starts; the same data as a string is a
// fraction of that and splits in a millisecond.
const tsv = (rows) => rows.map((r) => r.join('\t')).join('\n');
const lit = (s) => JSON.stringify(s);

const ts = `/**
 * SLATE — world reference data.
 *
 * Generated by tools/build-world-data.mjs from the GeoNames public dataset,
 * which is real-world public reference data rather than anything SLATE
 * invented. Do not edit by hand; regenerate instead.
 *
 * Every country and every first-level subdivision on Earth is here, along with
 * ${bundled.length.toLocaleString('en-US')} of the largest cities. The remaining places — ${total.toLocaleString('en-US')} in
 * total across ${byCountry.size} countries — live in public/geo and are fetched per
 * country when somebody opens the picker for one.
 *
 * The three tables below are tab-delimited rather than object literals: the
 * same data as source objects is several times the size and materially slower
 * to parse on a phone.
 */

export interface RawCountry {
  id: string; iso2: string; name: string; capital: string;
  continent: string; currency: string; population: number;
  /** Land area in square kilometers. */
  areaKm2: number;
  /** The currency's name as GeoNames gives it: "Dollar", "Yen", "Pound". */
  currencyName: string;
  /** International dialling code, without the plus. */
  phone: string;
  /** Languages as ISO 639 codes, most spoken first: "en-US,es-US,haw,fr". */
  languages: string;
}

export interface RawRegion {
  id: string; code: string; name: string; countryId: string;
}

export interface RawCity {
  id: string; name: string; regionId: string; countryId: string;
  lat: number; lon: number; timeZone: string; population: number;
  /** 'x' a section of a larger city, 'c' a national capital, 'a' a regional capital, '' a town. */
  kind: string;
}

const COUNTRY_TABLE = ${lit(tsv(countries.map((c) => [c.id, c.iso2, c.name, c.capital, c.continent, c.currency, c.population, c.areaKm2, c.currencyName, c.phone, c.languages])))};

const REGION_TABLE = ${lit(tsv(regions.map((r) => [r.id, r.code, r.name, r.countryId])))};

const CITY_TABLE = ${lit(tsv(bundled.map((c) => [c.id, c.name, c.regionId, c.countryId, c.lat.toFixed(4), c.lon.toFixed(4), c.timeZone, c.population, c.kind])))};

const rows = (table: string) => table.split('\\n').map((line) => line.split('\\t'));

export const WORLD_COUNTRIES: readonly RawCountry[] = rows(COUNTRY_TABLE).map((r) => ({
  id: r[0] as string, iso2: r[1] as string, name: r[2] as string, capital: r[3] as string,
  continent: r[4] as string, currency: r[5] as string, population: Number(r[6]),
  areaKm2: Number(r[7]) || 0, currencyName: (r[8] as string) ?? '', phone: (r[9] as string) ?? '',
  languages: (r[10] as string) ?? '',
}));

export const WORLD_REGIONS: readonly RawRegion[] = rows(REGION_TABLE).map((r) => ({
  id: r[0] as string, code: r[1] as string, name: r[2] as string, countryId: r[3] as string,
}));

export const WORLD_CITIES: readonly RawCity[] = rows(CITY_TABLE).map((r) => ({
  id: r[0] as string, name: r[1] as string, regionId: r[2] as string, countryId: r[3] as string,
  lat: Number(r[4]), lon: Number(r[5]), timeZone: r[6] as string, population: Number(r[7]), kind: r[8] ?? '',
}));

/** How many cities each country has on disk, for the picker to show a count. */
export const CITY_COUNTS: Readonly<Record<string, number>> = Object.fromEntries(
  ${lit(tsv(manifest.map((m) => [m.countryId, m.cities])))}.split('\\n').map((line) => {
    const [id, count] = line.split('\\t');
    return [id as string, Number(count)];
  }),
);

/** Every city in the world that SLATE knows about. */
export const TOTAL_CITIES = ${total};
`;

writeFileSync('src/engine/content/world-data.ts', ts);

console.log(`countries      ${countries.length}`);
console.log(`regions        ${regions.length}`);
console.log(`cities total   ${total}`);
console.log(`  bundled      ${bundled.length}`);
console.log(`  per-country  ${manifest.length} files in ${outDir}`);
