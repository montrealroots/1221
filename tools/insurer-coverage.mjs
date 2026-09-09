/**
 * Is there a real insurer for every country in the geography?
 *
 * Counts the 252 countries against the insurer registry: named companies
 * that really sell there, the metropole's market for a territory, a
 * local-only market with a reason, or no market with a reason. A country in
 * none of the four fails the gate, and so does a name in a country list that
 * the registry does not know, a country id the geography does not have, or
 * a line that nobody anywhere writes.
 *
 * Run: npx vite-node tools/insurer-coverage.mjs
 */
import { COUNTRIES } from '../src/engine/content/geography.ts';
import {
  INSURERS, INSURERS_BY_COUNTRY, LOCAL_ONLY, NO_INSURER, STATE_HEALTH, GLOBAL_SPECIALISTS,
  insurerByName, insurerCoverageOf, insurersFor,
} from '../src/engine/content/insurers.ts';

const LINES = ['health', 'dental', 'vision', 'auto', 'renters', 'homeowners', 'valuables', 'travel', 'life', 'umbrella', 'business', 'production', 'equipment', 'marine', 'aviation'];
const countries = COUNTRIES.all();
const tally = { named: 0, metropole: 0, local_only: 0, none: 0, unaccounted: [] };
const thin = [];
for (const c of countries) {
  const cover = insurerCoverageOf(c.id);
  if (cover.kind === 'unaccounted') { tally.unaccounted.push(`${c.id} ${c.name}`); continue; }
  tally[cover.kind] += 1;
  if (cover.kind === 'named' || cover.kind === 'metropole') {
    // Somewhere with a market has to sell a car policy and a house policy; the rest can come through a broker.
    for (const line of ['auto', 'homeowners']) if (insurersFor(c.id, line).length === 0) thin.push(`${c.id} ${c.name}: nobody writes ${line}`);
  }
}
const problems = [];
for (const [countryId, names] of Object.entries(INSURERS_BY_COUNTRY)) {
  if (!COUNTRIES.get(countryId)) problems.push(`INSURERS_BY_COUNTRY names a country the geography does not have: ${countryId}`);
  for (const name of names) if (!insurerByName(name)) problems.push(`${countryId} names an insurer not in the registry: ${name}`);
  if (new Set(names).size !== names.length) problems.push(`${countryId} lists an insurer twice`);
  if (names.length === 0 && !LOCAL_ONLY[countryId] && !NO_INSURER[countryId] && insurerCoverageOf(countryId).kind === 'unaccounted') problems.push(`${countryId} has an empty list and no reason`);
  if (names.length > 0 && LOCAL_ONLY[countryId]) problems.push(`${countryId} is both named and local-only; pick one`);
  if (names.length > 0 && NO_INSURER[countryId]) problems.push(`${countryId} is both named and uninsurable; pick one`);
}
for (const id of Object.keys(LOCAL_ONLY)) if (!COUNTRIES.get(id)) problems.push(`LOCAL_ONLY names a country the geography does not have: ${id}`);
for (const id of Object.keys(NO_INSURER)) if (!COUNTRIES.get(id)) problems.push(`NO_INSURER names a country the geography does not have: ${id}`);
for (const id of Object.keys(STATE_HEALTH)) if (!COUNTRIES.get(id)) problems.push(`STATE_HEALTH names a country the geography does not have: ${id}`);
for (const line of LINES) {
  for (const name of GLOBAL_SPECIALISTS[line]) {
    const insurer = insurerByName(name);
    if (!insurer) problems.push(`GLOBAL_SPECIALISTS.${line} names an insurer not in the registry: ${name}`);
    else if (!insurer.lines.includes(line)) problems.push(`${name} is a ${line} specialist that does not write ${line}`);
  }
  if (!INSURERS.some((i) => i.lines.includes(line))) problems.push(`nobody anywhere writes ${line}`);
}
const named = Object.values(INSURERS_BY_COUNTRY).reduce((n, list) => n + list.length, 0);
console.log(`${INSURERS.length} real insurers, ${named} country listings. ${countries.length} countries: ${tally.named} with named insurers, ${tally.metropole} through their metropole, ${tally.local_only} local only with a reason, ${tally.none} with no market and a reason. State health schemes named for ${Object.keys(STATE_HEALTH).length}.`);
if (tally.unaccounted.length > 0) console.log(`Unaccounted for: ${tally.unaccounted.join(', ')}`);
for (const t of thin) console.log(`THIN ${t}`);
for (const p of problems) console.log(`PROBLEM ${p}`);
if (tally.unaccounted.length > 0 || problems.length > 0 || thin.length > 0) process.exit(1);
