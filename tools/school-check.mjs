/**
 * School holds up.
 *
 * The shape of an education is public record and this measures that it is
 * carried like one: every stage in order and without a gap, every year of a
 * life covered from the first to the last, the qualification named where the
 * country has one, and every country mapped to a system or honestly to the
 * general one.
 *
 * It also measures the week: a timetable that is a timetable rather than a
 * coincidence, a school in every city, a school whose name suits the country
 * it stands in, sports only where a country's schools really field them, and
 * an acting ladder a child can actually climb.
 */

import {
  ACADEMIC_SCHOLARSHIP, CLUBS, EDUCATION_SYSTEMS, LEAD_TAKES, NOTICED_AT, PERIODS_A_DAY,
  SCHOOL_DAYS, SCHOOL_PLAYS, SCHOOL_SPORTS, SCHOOLING_NOTE, SUBJECTS, SUBJECT_BY_ID,
  TEAM_FROM_AGE, UNIVERSITY_LOOKS_AT, markLabel, stageForAge, systemIn, systemIsCountrys, yearLabel,
} from '../src/engine/content/schooling.ts';
import { CITIES, COUNTRIES } from '../src/engine/content/geography.ts';
import { placesIn } from '../src/engine/content/places.ts';
import { SKILLS } from '../src/engine/domain/skills.ts';
import { ATTRIBUTES } from '../src/engine/domain/attributes.ts';
import { quickSave } from '../src/engine/index.ts';
import {
  auditionStrength, averageMark, rawTalent, schoolingOf, sportsAt, stageFor, systemFor,
  todaysLessons, yearFor,
} from '../src/engine/systems/school.ts';
import { ageOf, youthFactor } from '../src/engine/systems/lifespan.ts';

const problems = [];
const known = new Set(COUNTRIES.all().map((one) => one.id));

// --- The shape of an education --------------------------------------------

for (const system of EDUCATION_SYSTEMS) {
  for (const countryId of system.countryIds) {
    if (!known.has(countryId)) problems.push(`${system.label} covers ${countryId}, which is not a country`);
  }
  if (system.stages.length === 0) problems.push(`${system.label} has no stages`);
  let last = -1;
  for (const stage of system.stages) {
    if (stage.from <= last) problems.push(`${system.label} has ${stage.label} starting at ${stage.from}, after ${last}`);
    if (stage.to < stage.from) problems.push(`${system.label}: ${stage.label} ends before it starts`);
    if (stage.from < 3 || stage.to > 19) problems.push(`${system.label}: ${stage.label} runs ${stage.from} to ${stage.to}`);
    if (stage.names && stage.names.length !== stage.to - stage.from + 1) {
      problems.push(`${system.label}: ${stage.label} names ${stage.names.length} years but runs ${stage.to - stage.from + 1}`);
    }
    if (stage.exam && stage.exam.about.length < 20) problems.push(`${system.label}: ${stage.exam.name} has nothing said about it`);
    // No gap between stages: a child does not vanish for a year.
    if (last >= 0 && stage.from !== last + 1) {
      problems.push(`${system.label} has a gap between ${last} and ${stage.from}`);
    }
    last = stage.to;
  }
  // Compulsory years must all be inside a stage.
  for (let age = system.compulsory[0]; age <= system.compulsory[1]; age++) {
    if (!stageForAge(system, age)) problems.push(`${system.label} compels ${age} year olds to a stage it does not have`);
  }
  // And every year names itself.
  for (const stage of system.stages) {
    for (let age = stage.from; age <= stage.to; age++) {
      const label = yearLabel(stage, age);
      if (!label || label.length < 2) problems.push(`${system.label}: age ${age} has no year name`);
    }
  }
  if (system.about.length < 25) problems.push(`${system.label} has nothing said about it`);
}

const seen = new Set();
for (const system of EDUCATION_SYSTEMS) {
  for (const countryId of system.countryIds) {
    if (seen.has(countryId)) problems.push(`${countryId} is in two education systems`);
    seen.add(countryId);
  }
}
if (!/public record/.test(SCHOOLING_NOTE) || !/no feed/.test(SCHOOLING_NOTE)) {
  problems.push('the note saying which half of school is real has gone');
}

// --- Subjects and clubs feed things that exist ----------------------------

const skillIds = new Set(SKILLS.map((one) => one.id));
const attributeIds = new Set(ATTRIBUTES.map((one) => one.id));
for (const one of [...SUBJECTS, ...CLUBS]) {
  if (!one.feeds) continue;
  const pool = one.feeds.kind === 'skill' ? skillIds : attributeIds;
  if (!pool.has(one.feeds.key)) problems.push(`${one.label} feeds "${one.feeds.key}", which is not a ${one.feeds.kind}`);
}
if (SUBJECTS.filter((one) => one.fromAge <= 6).length < 4) problems.push('a six year old has almost nothing on their timetable');
if (!SUBJECTS.some((one) => one.id === 'drama')) problems.push('there is no drama on any timetable');
if (!CLUBS.some((one) => one.id === 'drama')) problems.push('there is no drama club');

// --- Sport ----------------------------------------------------------------

for (const sport of SCHOOL_SPORTS) {
  for (const countryId of sport.countryIds) {
    if (!known.has(countryId)) problems.push(`${sport.label} is played in ${countryId}, which is not a country`);
  }
  if (sport.months.length === 0) problems.push(`${sport.label} has no season`);
  for (const month of sport.months) if (month < 1 || month > 12) problems.push(`${sport.label} runs in month ${month}`);
  if (sport.demand < 1 || sport.demand > 10) problems.push(`${sport.label} asks ${sport.demand} of a body`);
  if (sport.about.length < 15) problems.push(`${sport.label} has nothing said about it`);
}
for (const countryId of ['us', 'uk', 'au', 'in', 'jp', 'br', 'ke', 'de', 'ca']) {
  if (SCHOOL_SPORTS.filter((one) => one.countryIds.includes(countryId)).length < 3) {
    problems.push(`${countryId} schools field fewer than three sports`);
  }
}
// The ones a country would never field.
if (SCHOOL_SPORTS.find((one) => one.id === 'american_football')?.countryIds.some((c) => c !== 'us')) {
  problems.push('somewhere outside America fields an American football team');
}
if (SCHOOL_SPORTS.find((one) => one.id === 'aussie_rules')?.countryIds.some((c) => c !== 'au')) {
  problems.push('somewhere outside Australia fields an Australian rules team');
}

// --- The play -------------------------------------------------------------

for (const play of SCHOOL_PLAYS) {
  if (play.parts < 5) problems.push(`${play.title} has ${play.parts} parts, which is not a school play`);
  if (play.about.length < 15) problems.push(`${play.title} has nothing said about it`);
}
if (SCHOOL_PLAYS.length < 8) problems.push('there are not enough plays for a school to choose between');
if (NOTICED_AT <= LEAD_TAKES) problems.push('being noticed is easier than getting the lead');
if (ACADEMIC_SCHOLARSHIP <= UNIVERSITY_LOOKS_AT) problems.push('a scholarship is easier than getting in');

// --- A school in every town, named for where it is ------------------------

const SAMPLE = [
  'us-ca-losangeles', 'uk-eng-london', 'jp-13-tokyo', 'fr-idf-paris', 'de-be-berlin',
  'in-07-delhi', 'br-27-saopaulo', 'ng-05-lagos', 'au-nsw-sydney', 'sa-10-riyadh',
];
for (const cityId of SAMPLE) {
  const city = CITIES.get(cityId);
  if (!city) { problems.push(`${cityId} is not a city`); continue; }
  const schools = placesIn(cityId).filter((one) => one.kind.endsWith('_school'));
  if (schools.filter((one) => one.kind === 'primary_school').length === 0) problems.push(`${city.name} has no primary school`);
  if (schools.filter((one) => one.kind === 'secondary_school').length === 0) problems.push(`${city.name} has no secondary school`);
  for (const school of schools) {
    if (school.name.length < 8) problems.push(`a school in ${city.name} is called "${school.name}"`);
    // A saint on the sign only where schools are named that way.
    if (/^St /.test(school.name) && !['ie', 'uk', 'us', 'ca', 'au', 'nz', 'it', 'es', 'pt', 'fr', 'be', 'pl', 'mt', 'hr', 'at', 'mx', 'br', 'ar', 'cl', 'co', 'pe', 'ph', 'ug', 'ke', 'ng', 'gh', 'za', 'tz', 'rw', 'zm'].includes(city.countryId)) {
      problems.push(`${school.name} stands in ${city.name}, where schools are not named after saints`);
    }
  }
}

// --- A week that is a week ------------------------------------------------

for (const [year, cityId] of [[2016, 'fr-idf-paris'], [2012, 'uk-eng-london'], [2010, 'us-ca-losangeles'], [2011, 'jp-13-tokyo']]) {
  const sim = quickSave({ birthYear: year, startLocationId: cityId, homeRegionId: cityId }, `school-${cityId}-${year}`);
  const schooling = schoolingOf(sim);
  const city = CITIES.get(cityId);
  if (!schooling) { problems.push(`a ${ageOf(sim)} year old in ${city.name} is at no school`); continue; }
  if (schooling.timetable.length !== SCHOOL_DAYS.length * PERIODS_A_DAY) {
    problems.push(`the week in ${city.name} has ${schooling.timetable.length} lessons in it`);
  }
  // No subject three times in one day, and none twice running.
  for (const day of SCHOOL_DAYS) {
    const lessons = schooling.timetable.filter((one) => one.day === day).sort((a, b) => a.period - b.period);
    const counts = new Map();
    let previous = '';
    for (const lesson of lessons) {
      counts.set(lesson.subjectId, (counts.get(lesson.subjectId) ?? 0) + 1);
      if (lesson.subjectId === previous) {
        problems.push(`${city.name} has a double ${SUBJECT_BY_ID[lesson.subjectId]?.label} back to back`);
      }
      previous = lesson.subjectId;
      if (!SUBJECT_BY_ID[lesson.subjectId]) problems.push(`${city.name} teaches "${lesson.subjectId}", which is not a subject`);
    }
    for (const [subjectId, count] of counts) {
      if (count > 2) problems.push(`${city.name} does ${SUBJECT_BY_ID[subjectId]?.label} ${count} times in one day`);
    }
  }
  // Every subject on the week is one they are old enough for.
  const age = ageOf(sim);
  for (const lesson of schooling.timetable) {
    const subject = SUBJECT_BY_ID[lesson.subjectId];
    if (subject && age < subject.fromAge) problems.push(`a ${age} year old in ${city.name} is doing ${subject.label}`);
  }
  if (!yearFor(sim)) problems.push(`a ${age} year old in ${city.name} is in no named year`);
  if (systemFor(sim).id !== systemIn(city.countryId).id) problems.push(`${city.name} is in the wrong education system`);
  const marks = averageMark(schooling);
  if (marks < 20 || marks > 95) problems.push(`a ${age} year old in ${city.name} starts on ${marks}`);
  // Sport at school is the sport of that country.
  for (const sport of sportsAt(sim)) {
    if (!sport.countryIds.includes(city.countryId)) problems.push(`${city.name} fields ${sport.label}`);
  }
}

// --- The ladder a child climbs --------------------------------------------

let previousStrength = -1;
for (const year of [2016, 2014, 2012, 2010, 2008, 2006, 2004]) {
  const sim = quickSave({ birthYear: year, startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london' }, 'ladder-check');
  const strength = auditionStrength(sim);
  const age = ageOf(sim);
  if (strength < previousStrength) problems.push(`a ${age} year old auditions worse than somebody younger`);
  previousStrength = strength;
  // The best possible child is still a child.
  if (age <= 12 && strength >= LEAD_TAKES) problems.push(`a ${age} year old walks into the lead`);
  if (age >= 22 && strength < 90) problems.push(`a grown ${age} year old is still held back by their age`);
  // And the potential is visible under it, which is how a child gets found.
  if (rawTalent(sim) < strength) problems.push('what is in somebody reads lower than what they can currently do');
  if (youthFactor(sim) > 1) problems.push(`a ${age} year old brings more than everything they have`);
}

// --- Say what was measured ------------------------------------------------

const covered = COUNTRIES.all().filter((one) => systemIsCountrys(one.id)).length;
console.log(`${EDUCATION_SYSTEMS.length} education systems covering ${covered} countries by name; the rest fall to the general one.`);
console.log(`${EDUCATION_SYSTEMS.reduce((n, o) => n + o.stages.length, 0)} stages and ${EDUCATION_SYSTEMS.reduce((n, o) => n + o.stages.filter((x) => x.exam).length, 0)} named qualifications, from ages 3 to 19.`);
console.log(`${SUBJECTS.length} subjects, ${CLUBS.length} clubs, ${SCHOOL_SPORTS.length} school sports across ${new Set(SCHOOL_SPORTS.flatMap((o) => o.countryIds)).size} countries, ${SCHOOL_PLAYS.length} plays a school can put on.`);
console.log(`A week is ${SCHOOL_DAYS.length * PERIODS_A_DAY} lessons. Teams from ${TEAM_FROM_AGE}. ${markLabel(UNIVERSITY_LOOKS_AT)} gets a university to look.`);
console.log('Every school in it is SLATE’s own, and the room says so.');

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):`);
  for (const one of problems) console.error(`  - ${one}`);
  process.exit(1);
}
console.log('School holds.');
