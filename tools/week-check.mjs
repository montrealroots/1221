/**
 * The week holds up.
 *
 * The martial arts are real and this measures them like published data: an
 * art that grades has a ladder that goes one way, minimum times that are the
 * times a federation really publishes, and an age below which a grade cannot
 * be awarded. An art that grades nobody has no ladder at all, because
 * inventing a belt for a boxer would be inventing a fact.
 *
 * The rest of a week and the classes in it are SLATE's own and are measured
 * for making sense: an age somebody could really be doing it, an hour that is
 * an hour, and something built that the skill sheet actually carries.
 */

import {
  ARTS_NOTE, ART_BY_ID, CHILD_CEILING, CHILD_NOTE, CLASS_BY_ID, CLASS_NOTE, DOINGS, DOING_BY_ID,
  GRADING_LABEL, GRADING_NOTE, LIFE_CLASSES, MARTIAL_ARTS, SESSIONS_A_WEEK, SESSION_HOURS,
  WEEK_NOTE, WHEN_LABEL, classesAt, doingsAt,
} from '../src/engine/content/theweek.ts';
import { SKILLS } from '../src/engine/domain/skills.ts';
import { ATTRIBUTES } from '../src/engine/domain/attributes.ts';
import { quickSave } from '../src/engine/index.ts';
import {
  describeTraining, friendCount, gradeOf, putAnHourIn, readyToGrade, trainingIn, trainingNow,
  trainingOf, artsOpenTo,
} from '../src/engine/systems/theweek.ts';
import { ageOf } from '../src/engine/systems/lifespan.ts';

const problems = [];
const skillIds = new Set(SKILLS.map((one) => one.id));
const attributeIds = new Set(ATTRIBUTES.map((one) => one.id));

// --- The arts, which are real -------------------------------------------------

const seen = new Set();
const seenNames = new Set();
for (const art of MARTIAL_ARTS) {
  if (seen.has(art.id)) problems.push(`${art.id} is listed twice`);
  seen.add(art.id);
  if (seenNames.has(art.name)) problems.push(`${art.name} is listed twice`);
  seenNames.add(art.name);
  if (!GRADING_LABEL[art.grading]) problems.push(`${art.name} grades by "${art.grading}", which is not a way of grading`);
  if (art.origin.length < 6) problems.push(`${art.name} comes from nowhere`);
  if (art.about.length < 40) problems.push(`${art.name} has nothing said about it`);
  if (art.fromAge < 3 || art.fromAge > 18) problems.push(`${art.name} takes children from ${art.fromAge}`);
  if (art.fee < 0 || art.fee > 100_00) problems.push(`${art.name} costs ${art.fee} a session`);
  if (art.demand < 10 || art.demand > 60) problems.push(`${art.name} takes ${art.demand} out of you`);
  if (art.feeds.length === 0) problems.push(`${art.name} builds nothing`);
  const share = art.feeds.reduce((sum, one) => sum + one.share, 0);
  if (Math.abs(share - 1) > 0.02) problems.push(`${art.name} spends ${share} of an hour`);
  for (const feed of art.feeds) {
    const pool = feed.kind === 'skill' ? skillIds : attributeIds;
    if (!pool.has(feed.key)) problems.push(`${art.name} builds "${feed.key}", which is not a ${feed.kind}`);
  }

  // An art that grades nobody has no ladder, and one that does has a real one.
  if (art.grading === 'none') {
    if (art.grades.length > 0) problems.push(`${art.name} grades nobody and has ${art.grades.length} grades`);
    continue;
  }
  if (art.grades.length < 3) problems.push(`${art.name} has ${art.grades.length} grades on its ladder`);
  const seenGrades = new Set();
  let lastHours = -1;
  let lastAge = -1;
  for (const grade of art.grades) {
    if (seenGrades.has(grade.id)) problems.push(`${art.name}: ${grade.id} appears twice`);
    seenGrades.add(grade.id);
    if (grade.label.length < 3) problems.push(`${art.name} has a grade with no name`);
    if (grade.about.length < 25) problems.push(`${art.name}: ${grade.label} has nothing said about it`);
    if (grade.minMonths < 0 || grade.minMonths > 60) problems.push(`${art.name}: ${grade.label} wants ${grade.minMonths} months`);
    if (grade.hours < lastHours) problems.push(`${art.name}: ${grade.label} wants fewer hours than the grade below it`);
    lastHours = grade.hours;
    if (grade.fromAge < 3 || grade.fromAge > 25) problems.push(`${art.name}: ${grade.label} is awarded at ${grade.fromAge}`);
    if (grade.fromAge < art.fromAge) problems.push(`${art.name}: ${grade.label} is awarded younger than anybody may start`);
    lastAge = Math.max(lastAge, grade.fromAge);
  }
  if (art.grades[0].minMonths !== 0) problems.push(`${art.name} wants time served before the first grade`);
  if (art.grades[0].hours !== 0) problems.push(`${art.name} wants mat time before the first grade`);
}
if (MARTIAL_ARTS.length < 10) problems.push(`only ${MARTIAL_ARTS.length} arts carried`);

// The things everybody knows about these arts are the things the game says.
const bjj = ART_BY_ID.bjj;
if (!bjj) problems.push('there is no Brazilian jiu jitsu');
else {
  const ladder = bjj.grades.map((one) => one.label);
  const expect = ['White Belt', 'Blue Belt', 'Purple Belt', 'Brown Belt', 'Black Belt'];
  if (ladder.join(' ') !== expect.join(' ')) problems.push('the jiu jitsu belts are not white, blue, purple, brown, black');
  const black = bjj.grades[bjj.grades.length - 1];
  if (black.fromAge !== 19) problems.push('a jiu jitsu black belt is not held to nineteen');
  const purple = bjj.grades.find((one) => one.label === 'Purple Belt');
  if (purple.minMonths < 24) problems.push('the two years at blue before purple is not carried');
}
for (const id of ['boxing', 'muay_thai', 'wrestling', 'mma']) {
  const art = ART_BY_ID[id];
  if (!art) { problems.push(`${id} is not carried`); continue; }
  if (art.grading !== 'none') problems.push(`${art.name} is given a grading system it does not have`);
  if (art.grades.length > 0) problems.push(`${art.name} is given belts it does not have`);
}
if (ART_BY_ID.kendo?.grades.some((one) => /belt/i.test(one.label))) {
  problems.push('kendo is given a colored belt, which it does not use');
}
if (ART_BY_ID.judo?.grading !== 'kyu_dan') problems.push('judo is not carried as kyu then dan');
if (ART_BY_ID.taekwondo?.grading !== 'geup_dan') problems.push('taekwondo is not carried as geup then dan');
if (!ART_BY_ID.taekwondo?.grades.some((one) => /Poom/.test(one.label))) {
  problems.push('the taekwondo junior poom is not carried');
}
if (ART_BY_ID.krav_maga?.grading !== 'levels') problems.push('krav maga is not carried as numbered levels');
if (!/grade nobody/.test(ARTS_NOTE)) problems.push('the note about the arts has gone');
if (!/minimum time/.test(GRADING_NOTE)) problems.push('the note about grading has gone');
if (!/nineteen/.test(CHILD_NOTE)) problems.push('the note about children has gone');

// --- The classes and the hours around the lessons -----------------------------

const seenClasses = new Set();
for (const lesson of LIFE_CLASSES) {
  if (seenClasses.has(lesson.id)) problems.push(`${lesson.id} is listed twice`);
  seenClasses.add(lesson.id);
  if (lesson.fromAge < 3 || lesson.fromAge > 25) problems.push(`${lesson.label} takes people from ${lesson.fromAge}`);
  if (lesson.hours <= 0 || lesson.hours > 8) problems.push(`${lesson.label} runs ${lesson.hours} hours`);
  if (lesson.fee < 0 || lesson.fee > 200_00) problems.push(`${lesson.label} costs ${lesson.fee}`);
  if (lesson.about.length < 30) problems.push(`${lesson.label} has nothing said about it`);
  if (lesson.feeds.length === 0) problems.push(`${lesson.label} builds nothing`);
  const share = lesson.feeds.reduce((sum, one) => sum + one.share, 0);
  if (Math.abs(share - 1) > 0.02) problems.push(`${lesson.label} spends ${share} of its hours`);
  for (const feed of lesson.feeds) {
    const pool = feed.kind === 'skill' ? skillIds : attributeIds;
    if (!pool.has(feed.key)) problems.push(`${lesson.label} builds "${feed.key}", which is not a ${feed.kind}`);
  }
}
// The ones with an age bar in law are barred.
if (classesAt(12).some((one) => one.id === 'wine_course')) problems.push('a twelve year old is offered a wine course');
if (classesAt(12).some((one) => one.id === 'bartending_course')) problems.push('a twelve year old is offered a bartending course');
if (classesAt(30).length <= classesAt(8).length) problems.push('an adult has no more open to them than a child');

const seenDoings = new Set();
for (const doing of DOINGS) {
  if (seenDoings.has(doing.id)) problems.push(`${doing.id} is listed twice`);
  seenDoings.add(doing.id);
  if (!WHEN_LABEL[doing.when]) problems.push(`${doing.label} happens at "${doing.when}", which is not a time`);
  if (doing.fromAge >= doing.toAge) problems.push(`${doing.label} is open for one age`);
  if (doing.hours <= 0 || doing.hours > 14) problems.push(`${doing.label} takes ${doing.hours} hours`);
  if (doing.demand < 0 || doing.demand > 60) problems.push(`${doing.label} takes ${doing.demand} out of you`);
  if (doing.cost < 0 || doing.cost > 100_00) problems.push(`${doing.label} costs ${doing.cost}`);
  if (doing.about.length < 30) problems.push(`${doing.label} has nothing said about it`);
  if (doing.feeds.length === 0) problems.push(`${doing.label} builds nothing`);
  const share = doing.feeds.reduce((sum, one) => sum + one.share, 0);
  if (Math.abs(share - 1) > 0.02) problems.push(`${doing.label} spends ${share} of its hours`);
  for (const feed of doing.feeds) {
    const pool = feed.kind === 'skill' ? skillIds : attributeIds;
    if (!pool.has(feed.key)) problems.push(`${doing.label} builds "${feed.key}", which is not a ${feed.kind}`);
  }
}
for (const when of Object.keys(WHEN_LABEL)) {
  if (when === 'any') continue;
  if (doingsAt(14, when).length === 0) problems.push(`there is nothing to do at ${when}`);
}
if (DOINGS.length < 15) problems.push(`only ${DOINGS.length} ways to spend an hour`);
if (!/lunch hour/.test(WEEK_NOTE)) problems.push('the note about the week has gone');
if (!/no fee schedule/.test(CLASS_NOTE)) problems.push('the note about what a class costs has gone');

// --- A life it happens in -------------------------------------------------------

for (const [birthYear, cityId] of [[2012, 'uk-eng-london'], [2000, 'us-ca-losangeles']]) {
  const sim = quickSave({ birthYear, startLocationId: cityId, homeRegionId: cityId }, `week-check-${birthYear}`);
  const age = ageOf(sim);
  const where = `a ${age} year old in ${cityId}`;
  const open = artsOpenTo(sim);
  if (open.length === 0) problems.push(`${where} cannot train anything at all`);
  for (const art of open) {
    if (age < art.fromAge) problems.push(`${where} is offered ${art.name}, which takes people from ${art.fromAge}`);
  }

  const art = ART_BY_ID.bjj;
  const started = sim.execute({ kind: 'week.start_training', payload: { artId: art.id } });
  if (!started.ok) { problems.push(`${where} could not start jiu jitsu: ${started.error}`); continue; }
  if (sim.execute({ kind: 'week.start_training', payload: { artId: art.id } }).ok) {
    problems.push(`${where} trains the same art twice`);
  }
  const record = trainingIn(sim, art.id);
  if (!record) { problems.push(`${where} started and is training nothing`); continue; }
  if (record.gradeId !== art.grades[0].id) problems.push(`${where} did not start at the first grade`);
  if (!describeTraining(record).includes(art.name)) problems.push(`${where} trains somewhere the page does not name`);

  // A session is a session, and a week has a limit. The founder starts with
  // everything at the ceiling, so make room first: what is being measured is
  // that an hour moves something, not that a maxed skill can go higher.
  for (const feed of art.feeds) {
    if (feed.kind === 'skill') sim.player.skills[feed.key] = 40;
  }
  const before = sim.player.skills?.self_defense ?? 0;
  let worked = 0;
  for (let i = 0; i < SESSIONS_A_WEEK + 2; i += 1) {
    sim.player.wellbeing.energy = 100;
    if (sim.execute({ kind: 'week.train', payload: { artId: art.id } }).ok) worked += 1;
  }
  if (worked > SESSIONS_A_WEEK) problems.push(`${where} trained ${worked} times in one week`);
  if (worked === 0) problems.push(`${where} could not train at all`);
  if ((sim.player.skills?.self_defense ?? 0) <= before) problems.push(`${where} trained and learned nothing`);
  if (record.hours <= 0) problems.push(`${where} trained and has no mat time`);

  // A grading is refused before the time and the hours are there.
  const early = sim.execute({ kind: 'week.grade', payload: { artId: art.id } });
  if (early.ok) problems.push(`${where} was graded after a fortnight`);
  const ready = readyToGrade(sim, record);
  if (ready.ready) problems.push(`${where} is said to be ready after a fortnight`);
  if (!ready.why) problems.push(`${where} is refused a grading with no reason`);

  // An art that grades nobody says so rather than pretending.
  sim.execute({ kind: 'week.stop_training', payload: { artId: art.id } });
  const boxing = sim.execute({ kind: 'week.start_training', payload: { artId: 'boxing' } });
  if (!boxing.ok) problems.push(`${where} could not start boxing: ${boxing.error}`);
  else {
    const box = trainingIn(sim, 'boxing');
    const said = readyToGrade(sim, box);
    if (said.ready) problems.push(`${where} is being put up for a boxing belt`);
    if (!/grades nobody/.test(said.why)) problems.push(`${where} is not told that boxing grades nobody`);
    if (sim.execute({ kind: 'week.grade', payload: { artId: 'boxing' } }).ok) {
      problems.push(`${where} was awarded a belt in boxing`);
    }
  }
  sim.execute({ kind: 'week.stop_training', payload: { artId: 'boxing' } });
  if (trainingNow(sim).length !== 0) problems.push(`${where} stopped and is still training`);
  if (trainingOf(sim).length !== 2) problems.push(`${where} has the wrong number of arts behind them`);

  // A class builds what it says it builds, and one nobody their age may take is refused.
  const lesson = classesAt(age).find((one) => one.feeds.every((f) => f.kind === 'skill'));
  if (lesson) {
    for (const feed of lesson.feeds) sim.player.skills[feed.key] = 40;
    const was = lesson.feeds.map((f) => sim.player.skills?.[f.key] ?? 0);
    sim.player.wellbeing.energy = 100;
    const took = sim.execute({ kind: 'week.take_class', payload: { classId: lesson.id } });
    if (!took.ok) problems.push(`${where} could not take ${lesson.label}: ${took.error}`);
    else if (lesson.feeds.every((f, i) => (sim.player.skills?.[f.key] ?? 0) <= was[i])) {
      problems.push(`${where} took ${lesson.label} and nothing moved`);
    }
  }
  if (age < 18 && sim.execute({ kind: 'week.take_class', payload: { classId: 'wine_course' } }).ok) {
    problems.push(`${where} was sold a wine course`);
  }
}

// And a skill already at the top does not move, which is the same rule read
// the other way and is what the founder's own sheet is doing above.
{
  const maxed = { skills: { chess: 100 }, attributes: {} };
  if (putAnHourIn(maxed, 'chess', 'skill', 3, false) !== 0) {
    problems.push('an hour moved a skill that was already at the ceiling');
  }
}

// A child cannot reach an adult's ceiling however hard they work.
{
  const person = { skills: {}, attributes: {} };
  for (let i = 0; i < 400; i += 1) putAnHourIn(person, 'swimming', 'skill', 2, true);
  if ((person.skills.swimming ?? 0) > CHILD_CEILING * 100 + 0.01) {
    problems.push('a child trained past a child’s ceiling');
  }
  const adult = { skills: {}, attributes: {} };
  for (let i = 0; i < 400; i += 1) putAnHourIn(adult, 'swimming', 'skill', 2, false);
  if ((adult.skills.swimming ?? 0) <= (person.skills.swimming ?? 0)) {
    problems.push('an adult cannot get further than a child on the same hours');
  }
  // And the last ten points are harder than the first ten.
  const fresh = { skills: {}, attributes: {} };
  const first = putAnHourIn(fresh, 'chess', 'skill', 1, false);
  fresh.skills.chess = 95;
  const last = putAnHourIn(fresh, 'chess', 'skill', 1, false);
  if (last >= first) problems.push('an hour at the top of a skill is worth as much as an hour at the bottom');
}

// --- Say what was measured ---------------------------------------------------------

const graded = MARTIAL_ARTS.filter((one) => one.grading !== 'none').length;
const lifeSkills = SKILLS.filter((one) => one.domain === 'general').length;
console.log(`${MARTIAL_ARTS.length} martial arts, ${graded} of which grade and ${MARTIAL_ARTS.length - graded} of which grade nobody at all.`);
console.log(`${MARTIAL_ARTS.reduce((sum, one) => sum + one.grades.length, 0)} real grades across the ladders, from a white belt to a third dan.`);
console.log(`${LIFE_CLASSES.length} classes and ${DOINGS.length} other ways to spend part of a week.`);
console.log(`${lifeSkills} life skills on the sheet, and everything above builds one of them.`);
console.log('The arts and their grading systems are public record; every gym, every hour and every price is SLATE’s own.');

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):`);
  for (const one of [...new Set(problems)]) console.error(`  - ${one}`);
  process.exit(1);
}
console.log('The week holds.');
