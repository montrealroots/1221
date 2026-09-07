/**
 * Is every country in the geography reachable by a real airline?
 *
 * The promise is that a flight anywhere is flown by a carrier that really
 * goes there. This counts the 252 countries in the world data against the
 * airline registry: home to a carrier, served by named neighbors' carriers,
 * or honestly listed as having no scheduled service. A country in none of
 * the three fails the gate, and so does a serving code that names an airline
 * not on the list.
 *
 * Run: npx vite-node tools/airline-coverage.mjs
 */
import { COUNTRIES } from '../src/engine/content/geography.ts';
import { AIRLINES, SERVED_BY, NO_SERVICE, coverageOf, airlineByCode } from '../src/engine/content/airlines.ts';

const countries = COUNTRIES.all();
const tally = { home: 0, served: 0, none: 0, unaccounted: [] };
for (const c of countries) {
  const cover = coverageOf(c.id);
  if (cover.kind === 'unaccounted') tally.unaccounted.push(`${c.id} ${c.name}`);
  else tally[cover.kind] += 1;
}

const problems = [];
for (const [countryId, codes] of Object.entries(SERVED_BY)) {
  if (!COUNTRIES.get(countryId)) problems.push(`SERVED_BY names a country the geography does not have: ${countryId}`);
  for (const code of codes) if (!airlineByCode(code)) problems.push(`SERVED_BY ${countryId} names a carrier not on the list: ${code}`);
  if (AIRLINES.some((x) => x.countryId === countryId)) problems.push(`${countryId} is both home to a carrier and in SERVED_BY; pick one`);
}
for (const countryId of Object.keys(NO_SERVICE)) {
  if (!COUNTRIES.get(countryId)) problems.push(`NO_SERVICE names a country the geography does not have: ${countryId}`);
  if (SERVED_BY[countryId] || AIRLINES.some((x) => x.countryId === countryId)) problems.push(`${countryId} is in NO_SERVICE and also flown; pick one`);
}
const codes = new Map();
for (const x of AIRLINES) codes.set(x.code, (codes.get(x.code) ?? 0) + 1);
for (const [code, n] of codes) if (n > 1) problems.push(`IATA code used twice: ${code}`);
for (const x of AIRLINES) if (!COUNTRIES.get(x.countryId)) problems.push(`${x.name} is homed in a country the geography does not have: ${x.countryId}`);

console.log(`${AIRLINES.length} real airlines. ${countries.length} countries: ${tally.home} home to a carrier, ${tally.served} served by named neighbors, ${tally.none} with no scheduled service and a reason.`);
if (tally.unaccounted.length > 0) console.log(`Unaccounted for: ${tally.unaccounted.join(', ')}`);
for (const p of problems) console.log(`PROBLEM ${p}`);
if (tally.unaccounted.length > 0 || problems.length > 0) process.exit(1);
