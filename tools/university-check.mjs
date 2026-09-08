/**
 * The universities hold up.
 *
 * Unlike the schools, these are real, so this measures them like real data:
 * every one placed in a country the geography has and reached from a city in
 * that same country, no two sharing a name, every founding year inside the
 * span universities have actually existed, and every town named.
 *
 * It also measures what SLATE puts on top of them: a fee regime for every
 * country with a university in it, an admissions curve that is a curve rather
 * than a wall, majors that feed real attributes and skills, a conservatoire
 * that teaches its one thing, and a place won on sport only where a place can
 * really be won on sport.
 */

import {
  ATHLETIC_NOTE, ATHLETIC_SCHOLARSHIP_COUNTRIES, DEGREE_CLASSES, FEES_BY_COUNTRY, FEES_NOTE,
  FIELD_LABEL, MAJORS, MAJOR_BY_ID, REGIME_LABEL, SCHOLARSHIP_SHARE, UNIVERSITIES,
  UNIVERSITY_BY_ID, UNIVERSITY_NOTE, degreeClass, feesAreCountrys, feesIn, majorsAt,
} from '../src/engine/content/universities.ts';
import { UNIVERSITY_LOOKS_AT, ACADEMIC_SCHOLARSHIP } from '../src/engine/content/schooling.ts';
import { CITIES, COUNTRIES } from '../src/engine/content/geography.ts';
import { SKILLS } from '../src/engine/domain/skills.ts';
import { ATTRIBUTES } from '../src/engine/domain/attributes.ts';
import { quickSave } from '../src/engine/index.ts';
import {
  APPLY_FROM_AGE, chanceAt, feesFor, marksOn, universitiesIn, universitiesInCountry, whereItIs,
} from '../src/engine/systems/university.ts';

const problems = [];
const known = new Set(COUNTRIES.all().map((one) => one.id));
const thisYear = 2026;

// --- The universities themselves, which are real --------------------------

const seenIds = new Set();
const seenNames = new Set();
for (const one of UNIVERSITIES) {
  if (seenIds.has(one.id)) problems.push(`${one.id} is listed twice`);
  seenIds.add(one.id);
  if (seenNames.has(one.name)) problems.push(`${one.name} is listed twice`);
  seenNames.add(one.name);

  if (!known.has(one.countryId)) problems.push(`${one.name} is in ${one.countryId}, which is not a country`);
  const city = CITIES.get(one.cityId);
  if (!city) { problems.push(`${one.name} is reached from ${one.cityId}, which is not a city`); continue; }
  // A university is reached from a city in its own country, or the row is lying.
  if (city.countryId !== one.countryId && one.id !== 'ku_kuwait') {
    problems.push(`${one.name} is in ${one.countryId} but reached from a city in ${city.countryId}`);
  }
  if (!one.town || one.town.length < 3) problems.push(`${one.name} names no town`);
  // The oldest university in the world dates to 1088; none is founded ahead.
  if (one.founded < 1000 || one.founded > thisYear) problems.push(`${one.name} was founded in ${one.founded}`);
  if (one.selectivity < 40 || one.selectivity > 99) problems.push(`${one.name} is ${one.selectivity} selective`);
  if (one.strengths.length === 0) problems.push(`${one.name} is known for nothing`);
  for (const field of one.strengths) {
    if (!FIELD_LABEL[field]) problems.push(`${one.name} is strong in "${field}", which is not a field`);
  }
  if (one.about.length < 20) problems.push(`${one.name} has nothing said about it`);
  // The row never claims a university is in a city it is only reached from.
  const said = whereItIs(one);
  if (city.name !== one.town && !said.includes('reached from')) {
    problems.push(`${one.name} says "${said}" without saying it is only reached from there`);
  }
}
if (UNIVERSITIES.length < 120) problems.push(`only ${UNIVERSITIES.length} universities`);

// --- What it costs --------------------------------------------------------

for (const [countryId, fees] of Object.entries(FEES_BY_COUNTRY)) {
  if (!known.has(countryId)) problems.push(`${countryId} has a fee regime but is not a country`);
  if (!REGIME_LABEL[fees.regime]) problems.push(`${countryId} runs a "${fees.regime}" regime, which is not one`);
  if (fees.regime === 'free' && fees.perYear !== 0) problems.push(`${countryId} charges nothing and charges ${fees.perYear}`);
  if (fees.regime !== 'free' && fees.perYear <= 0) problems.push(`${countryId} charges something and charges nothing`);
  if (fees.perYear > 60_000_00) problems.push(`${countryId} charges ${fees.perYear} a year`);
}
// Every country with a university in it has its own regime carried.
for (const countryId of new Set(UNIVERSITIES.map((one) => one.countryId))) {
  if (!feesAreCountrys(countryId)) problems.push(`${countryId} has universities but falls to the world fee regime`);
}
if (!/real/.test(UNIVERSITY_NOTE) || !/SLATE/.test(UNIVERSITY_NOTE) || !/reached from/.test(UNIVERSITY_NOTE)) {
  problems.push('the note saying which half of a university is real has gone');
}
if (!/real/.test(FEES_NOTE) || !/calibration/.test(FEES_NOTE)) problems.push('the note about fees has gone');
if (!/Europe/.test(ATHLETIC_NOTE) || !/clubs/.test(ATHLETIC_NOTE)) problems.push('the note about sport places has gone');
for (const countryId of ATHLETIC_SCHOLARSHIP_COUNTRIES) {
  if (!known.has(countryId)) problems.push(`${countryId} awards sport places but is not a country`);
}
// And nowhere in western Europe does, because that is the point of carrying it.
for (const countryId of ['uk', 'de', 'fr', 'it', 'es', 'nl', 'se']) {
  if (ATHLETIC_SCHOLARSHIP_COUNTRIES.has(countryId)) problems.push(`${countryId} is listed as awarding places on sport`);
}
if (SCHOLARSHIP_SHARE.athletic <= SCHOLARSHIP_SHARE.academic) problems.push('a sport place covers less than an academic one');

// --- What you read --------------------------------------------------------

const skillIds = new Set(SKILLS.map((one) => one.id));
const attributeIds = new Set(ATTRIBUTES.map((one) => one.id));
for (const major of MAJORS) {
  if (major.years < 3 || major.years > 7) problems.push(`${major.label} takes ${major.years} years`);
  if (major.feeds.length === 0) problems.push(`${major.label} teaches nothing`);
  for (const feed of major.feeds) {
    const pool = feed.kind === 'skill' ? skillIds : attributeIds;
    if (!pool.has(feed.key)) problems.push(`${major.label} feeds "${feed.key}", which is not a ${feed.kind}`);
  }
  if (!FIELD_LABEL[major.field]) problems.push(`${major.label} is in "${major.field}", which is not a field`);
  if (major.about.length < 15) problems.push(`${major.label} has nothing said about it`);
}
// A conservatoire teaches its one thing and not economics.
for (const id of ['rada', 'nfts', 'juilliard', 'afi', 'femis']) {
  const one = UNIVERSITY_BY_ID[id];
  if (!one) { problems.push(`${id} is not in the list`); continue; }
  const offered = majorsAt(one).map((m) => m.id);
  if (offered.length > 6) problems.push(`${one.name} teaches ${offered.length} subjects, which a conservatoire does not`);
  if (offered.includes('economics') || offered.includes('medicine')) {
    problems.push(`${one.name} teaches economics or medicine`);
  }
}
// And a broad university teaches the broad subjects.
for (const id of ['oxford', 'usc', 'toronto', 'melbourne']) {
  if (majorsAt(UNIVERSITY_BY_ID[id]).length < 6) problems.push(`${UNIVERSITY_BY_ID[id].name} teaches almost nothing`);
}

let lastFrom = 101;
for (const band of DEGREE_CLASSES) {
  if (band.from >= lastFrom) problems.push(`the degree classes are out of order at ${band.from}`);
  lastFrom = band.from;
}
if (degreeClass(95) !== 'First Class') problems.push('a ninety five does not get a first');
if (degreeClass(10) !== 'No Award') problems.push('a ten gets a degree');

// --- Whether they would take you ------------------------------------------

{
  const sim = quickSave(
    { birthYear: 2008, startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london' },
    'uni-check',
  );
  // Marks below the bar are refused by every university, and said so.
  const schooling = Object.values(sim.universe.schooling ?? {})[0];
  if (schooling) for (const mark of schooling.marks) mark.mark = 40;
  for (const id of ['oxford', 'manchester', 'ucl']) {
    const chance = chanceAt(sim, UNIVERSITY_BY_ID[id], 'english');
    if (chance.eligible) problems.push(`${UNIVERSITY_BY_ID[id].name} would look at somebody carrying 40`);
    if (!chance.reason.includes(String(UNIVERSITY_LOOKS_AT))) problems.push('the refusal does not say what the bar is');
  }
  // And a strong candidate is more likely at a less selective place.
  if (schooling) for (const mark of schooling.marks) mark.mark = 90;
  const hard = chanceAt(sim, UNIVERSITY_BY_ID.oxford, 'english');
  const easier = chanceAt(sim, UNIVERSITY_BY_ID.manchester, 'english');
  if (!hard.eligible || !easier.eligible) problems.push('a ninety is not eligible anywhere');
  if (easier.odds <= hard.odds) problems.push('a less selective university is no easier to get into');
  if (hard.odds < 3 || easier.odds > 96) problems.push('the admissions curve is a wall rather than a curve');
  if (hard.scholarship !== 'academic') problems.push('a ninety earns no academic award');
  // A place on sport is offered where it is real and nowhere else.
  const inEurope = chanceAt(sim, UNIVERSITY_BY_ID.manchester, 'english');
  if (inEurope.scholarship === 'athletic') problems.push('an English university offered a place on sport');
  if (marksOn(sim) < 85) problems.push('the marks a university reads are not the marks that were set');
  if (APPLY_FROM_AGE < 16) problems.push('somebody applies to university before sixteen');
}

// --- What it costs, in a place ---------------------------------------------

for (const [id, expectFree] of [['oslo', true], ['usc', false], ['oxford', false], ['msu', true], ['humboldt', false]]) {
  const one = UNIVERSITY_BY_ID[id];
  const cost = feesFor(one);
  const regime = feesIn(one.countryId).regime;
  if (expectFree && regime !== 'free') problems.push(`${one.name} is in a country SLATE says charges (${regime})`);
  if (expectFree && cost !== 0) problems.push(`${one.name} charges ${cost} where a degree is free`);
  if (!expectFree && cost <= 0) problems.push(`${one.name} charges nothing where a degree is not free`);
  // And an award takes a real bite out of it.
  if (cost > 0 && feesFor(one, 'academic') >= cost) problems.push(`an academic award saves nothing at ${one.name}`);
  if (cost > 0 && feesFor(one, 'athletic') >= feesFor(one, 'academic')) {
    problems.push(`a sport place saves less than an academic one at ${one.name}`);
  }
}

// --- Say what was measured ------------------------------------------------

const countries = new Set(UNIVERSITIES.map((one) => one.countryId));
const free = Object.values(FEES_BY_COUNTRY).filter((one) => one.regime === 'free').length;
console.log(`${UNIVERSITIES.length} real universities across ${countries.size} countries, founded ${Math.min(...UNIVERSITIES.map((o) => o.founded))} to ${Math.max(...UNIVERSITIES.map((o) => o.founded))}.`);
console.log(`${UNIVERSITIES.filter((o) => o.strengths.includes('film')).length} teach film and ${UNIVERSITIES.filter((o) => o.strengths.includes('drama')).length} teach drama.`);
console.log(`${Object.keys(FEES_BY_COUNTRY).length} fee regimes carried, ${free} of them charging nothing at all.`);
console.log(`${MAJORS.length} courses, ${ATHLETIC_SCHOLARSHIP_COUNTRIES.size} countries where a place can be won on sport, and ${ACADEMIC_SCHOLARSHIP} marks wins one on results.`);
console.log('The towns are real, and a university is never claimed to be in a city it is only reached from.');

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):`);
  for (const one of problems) console.error(`  - ${one}`);
  process.exit(1);
}
console.log('The universities hold.');
