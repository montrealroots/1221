/**
 * Is there somewhere real to stay in every country in the geography?
 *
 * Counts the 252 countries against the hotel registry: chains that really
 * operate there, independents only with a reason, or nowhere to stay with a
 * reason. A country in none of the three fails the gate, and so does a
 * brand id in the map that is not in the registry.
 *
 * Run: npx vite-node tools/hotel-coverage.mjs
 */
import { COUNTRIES } from '../src/engine/content/geography.ts';
import { HOTEL_BRANDS, CHAINS_BY_COUNTRY, INDEPENDENT_ONLY, NOWHERE_TO_STAY, AIRBNB_UNAVAILABLE, hotelBrandById, stayCoverageOf } from '../src/engine/content/hotels.ts';

const countries = COUNTRIES.all();
const tally = { chains: 0, independent: 0, nowhere: 0, airbnb: 0, unaccounted: [] };
for (const c of countries) {
  const cover = stayCoverageOf(c.id);
  if (cover.kind === 'unaccounted') tally.unaccounted.push(`${c.id} ${c.name}`);
  else { tally[cover.kind] += 1; if ('airbnb' in cover && cover.airbnb) tally.airbnb += 1; }
}
const problems = [];
for (const [countryId, ids] of Object.entries(CHAINS_BY_COUNTRY)) {
  if (!COUNTRIES.get(countryId)) problems.push(`CHAINS_BY_COUNTRY names a country the geography does not have: ${countryId}`);
  for (const id of ids) if (!hotelBrandById(id)) problems.push(`${countryId} names a brand not in the registry: ${id}`);
  if (ids.length === 0) problems.push(`${countryId} has an empty chain list; move it to INDEPENDENT_ONLY`);
  if (INDEPENDENT_ONLY[countryId]) problems.push(`${countryId} is both chained and independent; pick one`);
}
for (const id of Object.keys(INDEPENDENT_ONLY)) if (!COUNTRIES.get(id)) problems.push(`INDEPENDENT_ONLY names a country the geography does not have: ${id}`);
for (const id of Object.keys(NOWHERE_TO_STAY)) { if (!COUNTRIES.get(id)) problems.push(`NOWHERE_TO_STAY names a country the geography does not have: ${id}`); if (CHAINS_BY_COUNTRY[id]) problems.push(`${id} is nowhere to stay and also has chains`); }
for (const id of Object.keys(AIRBNB_UNAVAILABLE)) if (!COUNTRIES.get(id)) problems.push(`AIRBNB_UNAVAILABLE names a country the geography does not have: ${id}`);
const ids = new Map(); for (const b of HOTEL_BRANDS) ids.set(b.id, (ids.get(b.id) ?? 0) + 1);
for (const [id, n] of ids) if (n > 1) problems.push(`brand id used twice: ${id}`);
console.log(`${HOTEL_BRANDS.length} real hotel brands. ${countries.length} countries: ${tally.chains} with chains that really operate there, ${tally.independent} independents only with a reason, ${tally.nowhere} with nowhere to stay and a reason; Airbnb lists in ${tally.airbnb}.`);
if (tally.unaccounted.length > 0) console.log(`Unaccounted for: ${tally.unaccounted.join(', ')}`);
for (const p of problems) console.log(`PROBLEM ${p}`);
if (tally.unaccounted.length > 0 || problems.length > 0) process.exit(1);
