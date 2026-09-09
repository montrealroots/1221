/**
 * Does every country issue a passport and a driver's license, or say why not?
 *
 * Counts the 252 countries against the document registries: an authority of
 * its own, its metropole's, or none with a reason. A country in none of the
 * three fails the gate, and so does a metropole that has no authority itself,
 * a regional office keyed to a region the geography does not have, or a
 * license exchange list naming an unknown country.
 *
 * Run: npx vite-node tools/document-coverage.mjs
 */
import { COUNTRIES, REGIONS } from '../src/engine/content/geography.ts';
import {
  PASSPORT_AUTHORITIES, PASSPORT_OF, NO_PASSPORT, LICENSE_AUTHORITIES, REGIONAL_LICENSE_OFFICES, LICENSE_EXCHANGE,
  passportAuthorityFor, licenseAuthorityFor,
} from '../src/engine/content/documents.ts';

const countries = COUNTRIES.all();
const passports = { own: 0, metropole: 0, none: 0, unaccounted: [] };
const licenses = { own: 0, metropole: 0, none: 0, unaccounted: [] };
for (const c of countries) {
  const p = passportAuthorityFor(c.id);
  if (p) passports[p.issuerId === c.id ? 'own' : 'metropole'] += 1;
  else if (NO_PASSPORT[c.id]) passports.none += 1;
  else passports.unaccounted.push(`${c.id} ${c.name}`);
  const l = licenseAuthorityFor(c.id);
  if (l) licenses[l.issuerId === c.id ? 'own' : 'metropole'] += 1;
  else if (NO_PASSPORT[c.id]) licenses.none += 1;
  else licenses.unaccounted.push(`${c.id} ${c.name}`);
}
const problems = [];
for (const id of Object.keys(PASSPORT_AUTHORITIES)) if (!COUNTRIES.get(id)) problems.push(`PASSPORT_AUTHORITIES names a country the geography does not have: ${id}`);
for (const id of Object.keys(LICENSE_AUTHORITIES)) if (!COUNTRIES.get(id)) problems.push(`LICENSE_AUTHORITIES names a country the geography does not have: ${id}`);
for (const [id, via] of Object.entries(PASSPORT_OF)) {
  if (!COUNTRIES.get(id)) problems.push(`PASSPORT_OF names a country the geography does not have: ${id}`);
  if (!PASSPORT_AUTHORITIES[via]) problems.push(`${id} carries a ${via} passport but ${via} has no authority`);
  if (!LICENSE_AUTHORITIES[via]) problems.push(`${id} is licensed by ${via} but ${via} has no license authority`);
  if (PASSPORT_AUTHORITIES[id]) problems.push(`${id} both issues its own passport and carries ${via}'s; pick one`);
}
for (const id of Object.keys(NO_PASSPORT)) if (!COUNTRIES.get(id)) problems.push(`NO_PASSPORT names a country the geography does not have: ${id}`);
for (const regionId of Object.keys(REGIONAL_LICENSE_OFFICES)) if (!REGIONS.get(regionId)) problems.push(`REGIONAL_LICENSE_OFFICES names a region the geography does not have: ${regionId}`);
for (const [id, list] of Object.entries(LICENSE_EXCHANGE)) {
  if (!LICENSE_AUTHORITIES[id]) problems.push(`LICENSE_EXCHANGE keyed to ${id}, which has no authority`);
  for (const other of list) if (!LICENSE_AUTHORITIES[other]) problems.push(`${id} exchanges with ${other}, which has no authority`);
}
console.log(`${countries.length} countries. Passports: ${passports.own} issue their own, ${passports.metropole} carry a metropole's, ${passports.none} issue none with a reason. Licenses: ${licenses.own} own, ${licenses.metropole} metropole's, ${licenses.none} none with a reason. ${Object.keys(REGIONAL_LICENSE_OFFICES).length} state and provincial offices.`);
if (passports.unaccounted.length > 0) console.log(`No passport authority: ${passports.unaccounted.join(', ')}`);
if (licenses.unaccounted.length > 0) console.log(`No license authority: ${licenses.unaccounted.join(', ')}`);
for (const p of problems) console.log(`PROBLEM ${p}`);
if (passports.unaccounted.length > 0 || licenses.unaccounted.length > 0 || problems.length > 0) process.exit(1);
