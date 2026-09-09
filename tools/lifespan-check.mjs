/**
 * The span holds up.
 *
 * Two of the three datasets here are public record and this measures that they
 * behave like it: every published life expectancy inside a range a country has
 * actually recorded, every pension age inside a range a state has actually
 * set, every country either carrying its own figure or falling to a stated
 * default, and the coverage counted rather than implied.
 *
 * It also measures the life itself: that a family is generated with the right
 * name and no impossible ages in it, that ageing is a curve rather than a
 * cliff and never turns back, that age gates answer with the rule of the
 * country you are standing in, and — the one that matters most — that nothing
 * anywhere in the system hands the player a date their character could not
 * possibly know.
 */

import {
  AGE_GATE_NOTE, AGING, COUNTRY_GATES, DEFAULT_GATES, GATES, LIFESPAN_NOTE, LIFE_EXPECTANCY,
  LIFE_STAGES, NO_DRINKING, PENSION_AGE, PENSION_NOTE, WORLD_EXPECTANCY, WORLD_PENSION_AGE,
  ADULT_EXPECTANCY_NOTE, FULLY_GROWN, GROWTH_NOTE, adultExpectancyIn, ceilingAt,
  expectancyIsPublished, heightAtAge, stageAt, weightAtAge,
} from '../src/engine/content/lifespan.ts';
import { CITIES, COUNTRIES } from '../src/engine/content/geography.ts';
import { HERITAGES, HERITAGE_BY_ID, HERITAGE_NOTE } from '../src/engine/content/heritage.ts';
import { quickSave } from '../src/engine/index.ts';
import {
  ageOf, ceilingOf, describeYears, familyOf, gatesFor, mayI, relationLabel, stageOf,
} from '../src/engine/systems/lifespan.ts';

const problems = [];
const MS_DAY = 86_400_000;

// --- What is real ---------------------------------------------------------

const known = new Set(COUNTRIES.all().map((one) => one.id));
for (const one of LIFE_EXPECTANCY) {
  if (!known.has(one.countryId)) problems.push(`${one.countryId} is not a country the geography has`);
  // Nowhere on earth has recorded a national figure outside this range.
  if (one.years < 45 || one.years > 90) problems.push(`${one.countryId} lives to ${one.years}, which no country does`);
}
const seenExpectancy = new Set();
for (const one of LIFE_EXPECTANCY) {
  if (seenExpectancy.has(one.countryId)) problems.push(`${one.countryId} has two life expectancies`);
  seenExpectancy.add(one.countryId);
}
for (const [countryId, age] of Object.entries(PENSION_AGE)) {
  if (!known.has(countryId)) problems.push(`${countryId} has a pension age but is not a country`);
  if (age < 50 || age > 70) problems.push(`${countryId} pensions at ${age}, which no state sets`);
  // Nobody retires after they are expected to have died — measured against
  // what an adult actually reaches, because several countries honestly set a
  // pension age above their own life expectancy at birth.
  if (age >= adultExpectancyIn(countryId)) {
    problems.push(`${countryId} pensions at ${age} and an adult there sees ${adultExpectancyIn(countryId)}`);
  }
}

// --- The notes say which half is which ------------------------------------

for (const [name, note, needs] of [
  ['LIFESPAN_NOTE', LIFESPAN_NOTE, [/published/, /SLATE/, /no table/i]],
  ['PENSION_NOTE', PENSION_NOTE, [/men and for women/]],
  ['AGE_GATE_NOTE', AGE_GATE_NOTE, [/exceptions/, /n[o’]t legal advice/]],
  ['ADULT_EXPECTANCY_NOTE', ADULT_EXPECTANCY_NOTE, [/child mortality/, /n[o’]t a life table/]],
]) {
  for (const need of needs) if (!need.test(note)) problems.push(`${name} no longer says ${need}`);
}

// --- Ageing is a curve, not a cliff ---------------------------------------

let lastFitness = 100;
let lastCondition = 100;
for (let age = 0; age <= 100; age++) {
  const ceiling = ceilingAt(age);
  if (ceiling.fitness > lastFitness) problems.push(`the fitness ceiling goes back up at ${age}`);
  if (ceiling.condition > lastCondition) problems.push(`the condition ceiling goes back up at ${age}`);
  // A cliff is a drop of more than three points in one birthday.
  if (lastFitness - ceiling.fitness > 3) problems.push(`turning ${age} costs ${(lastFitness - ceiling.fitness).toFixed(1)} fitness in one day`);
  lastFitness = ceiling.fitness;
  lastCondition = ceiling.condition;
}
if (ceilingAt(25).fitness < 96) problems.push('a twenty five year old is already worn out');
if (ceilingAt(75).fitness > 75) problems.push('a seventy five year old is as strong as a young one');

let lastFrom = -1;
for (const band of AGING) {
  if (band.from <= lastFrom) problems.push(`the ageing bands are out of order at ${band.from}`);
  lastFrom = band.from;
}
lastFrom = -1;
for (const stage of LIFE_STAGES) {
  if (stage.from <= lastFrom && stage.from !== 0) problems.push(`the life stages are out of order at ${stage.from}`);
  if (stage.about.length < 20) problems.push(`${stage.label} has nothing said about it`);
  lastFrom = stage.from;
}
for (const [age, expect] of [[4, 'Childhood'], [15, 'Adolescence'], [22, 'Young Adult'], [35, 'Adulthood'], [50, 'Middle Age'], [66, 'Later Life'], [88, 'Old Age']]) {
  if (stageAt(age).label !== expect) problems.push(`${age} reads as ${stageAt(age).label} rather than ${expect}`);
}

// --- The gates ------------------------------------------------------------

for (const [countryId, gates] of Object.entries(COUNTRY_GATES)) {
  if (!known.has(countryId)) problems.push(`${countryId} has age gates but is not a country`);
  for (const [gate, age] of Object.entries(gates)) {
    if (DEFAULT_GATES[gate] === undefined) problems.push(`${countryId} gates "${gate}", which is not a gate`);
    if (age < 12 || age > 25) problems.push(`${countryId} sets ${gate} at ${age}`);
    if (age === DEFAULT_GATES[gate]) problems.push(`${countryId} lists ${gate} at ${age}, which is already the default`);
  }
}
for (const countryId of NO_DRINKING) {
  if (!known.has(countryId)) problems.push(`${countryId} prohibits drinking but is not a country`);
}
for (const gate of GATES) {
  if (DEFAULT_GATES[gate.id] === undefined) problems.push(`${gate.id} has no default age`);
  if (gate.refusal.length < 20) problems.push(`${gate.id} has no refusal worth reading`);
}

// --- A life, run ----------------------------------------------------------

const sim = quickSave({}, 'lifespan-check');
const family = familyOf(sim);
if (family.parents.length !== 2) problems.push(`a life started with ${family.parents.length} people who raised it`);
for (const parent of family.parents) {
  const gap = ageOf(sim, parent) - ageOf(sim);
  if (gap < 18) problems.push(`${parent.displayName} is only ${gap} years older than their child`);
  if (gap > 52) problems.push(`${parent.displayName} is ${gap} years older than their child`);
}
// The name you grew up with.
if (!family.parents.some((one) => one.lastName === sim.player.lastName)) {
  problems.push('nobody who raised you carries your name');
}
for (const sibling of family.siblings) {
  if (sibling.lastName !== sim.player.lastName) problems.push(`${sibling.displayName} is a sibling with a different name`);
  const gap = Math.abs(ageOf(sim, sibling) - ageOf(sim));
  if (gap === 0) problems.push(`${sibling.displayName} is exactly your age by accident`);
  for (const parent of family.parents) {
    const atTheirBirth = ageOf(sim, parent) - ageOf(sim, sibling);
    if (atTheirBirth < 18) problems.push(`${parent.displayName} was ${atTheirBirth} when ${sibling.displayName} was born`);
    if (atTheirBirth > 52) problems.push(`${parent.displayName} was ${atTheirBirth} when ${sibling.displayName} was born`);
  }
}
// Building it twice does not build it twice.
const before = Object.keys(sim.universe.people).length;
familyOf(sim);
if (Object.keys(sim.universe.people).length !== before) problems.push('asking who your family is created more of them');

// The gates answer with the rule where you are standing, not where you are from.
const cases = [
  ['us-ca-losangeles', 'drink', 19, false],
  ['de-be-berlin', 'drink', 19, true],
  ['jp-13-tokyo', 'drink', 19, false],
  ['sa-10-riyadh', 'drink', 40, false],
  ['uk-eng-london', 'drive', 17, true],
  ['us-ca-losangeles', 'drive', 17, true],
  ['fr-idf-paris', 'drive', 16, false],
];
for (const [cityId, gate, age, expected] of cases) {
  if (!CITIES.get(cityId)) { problems.push(`${cityId} is not a city`); continue; }
  const one = quickSave({}, `gate-${cityId}-${gate}-${age}`);
  one.player.currentLocationId = cityId;
  one.player.birthInstant = one.now - Math.round((age + 0.5) * 365.25 * MS_DAY);
  const answer = mayI(one, gate);
  if (answer.ok !== expected) {
    problems.push(`${age} in ${CITIES.get(cityId).name}: ${gate} came back ${answer.ok} and should be ${expected}`);
  }
  if (!answer.ok && answer.reason.length < 20) problems.push(`the refusal in ${cityId} says nothing`);
}

// --- Where a name comes from -----------------------------------------------

{
  const ids = new Set();
  for (const one of HERITAGES) {
    if (ids.has(one.id)) problems.push(`${one.id} is listed twice`);
    ids.add(one.id);
    if (one.feminine.length < 6) problems.push(`${one.label} has ${one.feminine.length} feminine given names`);
    if (one.masculine.length < 6) problems.push(`${one.label} has ${one.masculine.length} masculine given names`);
    if (one.family.length < 8) problems.push(`${one.label} has ${one.family.length} family names`);
    if (one.about.length < 20) problems.push(`${one.label} has nothing said about it`);
    for (const countryId of one.countryIds) {
      if (!known.has(countryId)) problems.push(`${one.label} names from ${countryId}, which is not a country`);
    }
    // A name pool with a duplicate in it is a name pool that will hand two
    // siblings the same name and think it did something.
    for (const [what, list] of [['feminine', one.feminine], ['masculine', one.masculine], ['family', one.family]]) {
      if (new Set(list).size !== list.length) problems.push(`${one.label} repeats a ${what} name`);
    }
    // A heritage is a naming tradition and nothing else. If one ever grows a
    // number on it, this is where that gets caught.
    for (const key of Object.keys(one)) {
      if (!['id', 'label', 'region', 'countryIds', 'about', 'feminine', 'masculine', 'family'].includes(key)) {
        problems.push(`${one.label} carries "${key}", and a heritage may only carry names`);
      }
    }
  }
  if (!/naming tradition/.test(HERITAGE_NOTE) || !/no attribute/.test(HERITAGE_NOTE)) {
    problems.push('the note saying a heritage is only a naming tradition has gone');
  }

  // A family reads as a family: named out of its own traditions, gendered, and
  // called what people call each other.
  const born = quickSave(
    { heritageId: 'yoruba', parentHeritageIds: ['yoruba', 'irish'], firstName: 'Test', lastName: 'Adeyemi' },
    'heritage-check',
  );
  const theirs = familyOf(born);
  const words = new Set(theirs.all.map((one) => relationLabel(born, one.id)));
  for (const word of words) {
    if (!['Mother', 'Father', 'Sister', 'Brother', 'Daughter', 'Son', 'Parent', 'Sibling', 'Child'].includes(word)) {
      problems.push(`a family member reads as "${word}"`);
    }
  }
  if (!words.has('Mother') || !words.has('Father')) problems.push('a family has no mother and father in it');
  for (const one of theirs.all) {
    if (!one.gender) problems.push(`${one.displayName} has no gender the game can say`);
    if (!one.heritageId) problems.push(`${one.displayName} has no heritage their name came from`);
    const from = HERITAGE_BY_ID[one.heritageId ?? ''];
    if (from && ![...from.feminine, ...from.masculine].includes(one.firstName)) {
      problems.push(`${one.displayName} is not named out of ${from.label}`);
    }
  }
}

// --- The size you end up ---------------------------------------------------

let lastHeight = -1;
let lastWeight = -1;
for (let age = 0; age <= 30; age++) {
  const h = heightAtAge(190, age);
  const w = weightAtAge(85, age);
  if (h < lastHeight) problems.push(`somebody shrinks at ${age}`);
  if (w < lastWeight) problems.push(`somebody loses weight by growing at ${age}`);
  lastHeight = h;
  lastWeight = w;
}
if (heightAtAge(190, FULLY_GROWN) !== 190) problems.push('a grown body is not the height it was set to');
if (weightAtAge(85, FULLY_GROWN) !== 85) problems.push('a grown body is not the weight it was set to');
if (heightAtAge(190, 40) !== 190) problems.push('a body keeps growing after it has finished');
if (heightAtAge(190, 2) / 190 < 0.4 || heightAtAge(190, 2) / 190 > 0.6) {
  problems.push('a two year old is the wrong share of their adult height');
}
if (!/one curve/.test(GROWTH_NOTE) || !/pronoun/.test(GROWTH_NOTE)) {
  problems.push('the note about the growth curve no longer says what it carries');
}
{
  const grown = quickSave({ adultHeightCm: 193, adultWeightKg: 90 }, 'grown-check');
  if (grown.player.adultHeightCm !== 193) problems.push('the height the player set did not reach the character');
  if (grown.player.adultWeightKg !== 90) problems.push('the weight the player set did not reach the character');
  for (const person of Object.values(grown.universe.people)) {
    if (!person.isPlayer && person.adultHeightCm !== undefined) {
      problems.push(`${person.displayName} was given an adult size, which only the player may set`);
    }
  }
}

// --- What a character could not know --------------------------------------

// The one that matters. Nothing the player can reach may carry the day
// somebody dies: not the description of their own years, not the gates, not
// the label on the calendar item that will one day fire.
const words = [describeYears(sim), stageOf(sim).about, ...gatesFor(sim).map((g) => g.answer.reason)].join(' ');
if (/\b(19|20|21)\d\d\b/.test(words)) problems.push('something a character reads carries a year');
for (const person of [...family.parents, ...family.siblings]) {
  if (person.aliveUntil === undefined) problems.push(`${person.displayName} has no end at all, which means they never die`);
}
if (sim.player.aliveUntil !== undefined) problems.push('the player has been given a death date, which they must never carry');
const dated = sim.timeline
  .between(sim.now, sim.now + 365 * 80 * MS_DAY)
  .filter((item) => item.kind === 'life.passing');
for (const item of dated) {
  const named = [...family.parents, ...family.siblings].some((one) => item.label.includes(one.displayName));
  if (named) problems.push('a calendar item names who is going to die on it');
}

// --- Say what was measured ------------------------------------------------

const covered = COUNTRIES.all().filter((one) => expectancyIsPublished(one.id)).length;
const pensioned = Object.keys(PENSION_AGE).length;
const gated = Object.keys(COUNTRY_GATES).length;
console.log(`${LIFE_EXPECTANCY.length} published life expectancies, from ${Math.min(...LIFE_EXPECTANCY.map((o) => o.years))} to ${Math.max(...LIFE_EXPECTANCY.map((o) => o.years))} years.`);
console.log(`${covered} of ${COUNTRIES.all().length} countries carry their own; the rest fall to the world figure of ${WORLD_EXPECTANCY}.`);
console.log(`${pensioned} state pension ages, the rest to ${WORLD_PENSION_AGE}. ${gated} countries set an age gate of their own, ${NO_DRINKING.size} allow no drinking at any age.`);
console.log(`${LIFE_STAGES.length} stages and ${AGING.length} ageing bands: a body peaks at ${ceilingAt(20).fitness} and is at ${ceilingAt(80).fitness} by eighty.`);
console.log(`${HERITAGES.length} heritages across ${new Set(HERITAGES.map((o) => o.region)).size} regions: ${HERITAGES.reduce((n, o) => n + o.feminine.length + o.masculine.length, 0)} given names and ${HERITAGES.reduce((n, o) => n + o.family.length, 0)} family names, and not one number among them.`);
console.log(`A body reaches ${(heightAtAge(100, 2)).toFixed(0)}% of its height by two and all of it by ${FULLY_GROWN}.`);
console.log(`A life started with ${familyOf(sim).parents.length} parents and ${familyOf(sim).siblings.length} brothers and sisters, and knows none of their last days.`);

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):`);
  for (const one of problems) console.error(`  - ${one}`);
  process.exit(1);
}
console.log('The span holds.');
