/**
 * Growing up holds up.
 *
 * The years between five and twenty five are the part of a life that is
 * easiest to fake, so this measures that they are not: every moment inside an
 * age a person could be that age, every choice moving something the game
 * actually carries, every attribute and skill it names a real one, and every
 * note describing only what the choice really does rather than a consequence
 * nobody modeled.
 *
 * It also measures the two things with money in them: pocket money that goes
 * up with age and stops, and a driving test that can be failed.
 */

import {
  ALLOWANCE_BY_AGE, ALLOWANCE_NOTE, ALLOWANCE_STOPS_AT, DRIVING_NOTE, GROWING_NOTE,
  LESSONS_TO_READY, LESSON_COST, MOMENTS, PETS, PET_BY_ID, PET_NAMES, PET_NOTE,
  TEST_COST, TEST_PASSES_AT, allowanceAt, momentsAt,
} from '../src/engine/content/growingup.ts';
import { ATTRIBUTES } from '../src/engine/domain/attributes.ts';
import { SKILLS } from '../src/engine/domain/skills.ts';
import { quickSave } from '../src/engine/index.ts';
import {
  conditionMet, describePet, growingOf, livedThrough, openMoments, readyToDrive,
} from '../src/engine/systems/growing.ts';
import { MS_DAY } from '../src/engine/core/time.ts';
import { ageOf } from '../src/engine/systems/lifespan.ts';

const problems = [];
const attributeIds = new Set(ATTRIBUTES.map((one) => one.id));
const skillIds = new Set(SKILLS.map((one) => one.id));

// --- The moments themselves ------------------------------------------------

const seen = new Set();
for (const moment of MOMENTS) {
  if (seen.has(moment.id)) problems.push(`${moment.id} is listed twice`);
  seen.add(moment.id);
  if (moment.fromAge < 3 || moment.toAge > 70) problems.push(`${moment.title} runs from ${moment.fromAge} to ${moment.toAge}`);
  if (moment.toAge < moment.fromAge) problems.push(`${moment.title} ends before it starts`);
  if (moment.detail.length < 25) problems.push(`${moment.title} has nothing said about it`);
  if (moment.urgency < 10 || moment.urgency > 90) problems.push(`${moment.title} asks at ${moment.urgency}`);
  if (moment.choices.length < 2) problems.push(`${moment.title} is not a decision`);
  if (moment.choices.length > 4) problems.push(`${moment.title} has ${moment.choices.length} answers`);

  const choiceIds = new Set();
  for (const choice of moment.choices) {
    if (choiceIds.has(choice.id)) problems.push(`${moment.title} has two answers called ${choice.id}`);
    choiceIds.add(choice.id);
    if (choice.label.length < 2) problems.push(`${moment.title} has an answer with no words`);
    // Title Case on every answer, because every label in the game is.
    for (const word of choice.label.split(' ')) {
      if (['a', 'an', 'the', 'of', 'on', 'in', 'it', 'at', 'for', 'and', 'to'].includes(word.toLowerCase())) continue;
      if (word[0] !== word[0].toUpperCase()) problems.push(`"${choice.label}" is not Title Case`);
    }
    const effect = choice.effect;
    for (const key of Object.keys(effect.attribute ?? {})) {
      if (!attributeIds.has(key)) problems.push(`${moment.title}/${choice.id} moves "${key}", which is not an attribute`);
    }
    for (const key of Object.keys(effect.skill ?? {})) {
      if (!skillIds.has(key)) problems.push(`${moment.title}/${choice.id} moves "${key}", which is not a skill`);
    }
    if (effect.memory.length < 20) problems.push(`${moment.title}/${choice.id} remembers nothing`);
    if (effect.note.length < 20) problems.push(`${moment.title}/${choice.id} says nothing back`);
    if (effect.significance < 1 || effect.significance > 10) problems.push(`${moment.title}/${choice.id} is ${effect.significance} significant`);
    if (effect.friend && !['make', 'lose'].includes(effect.friend)) problems.push(`${moment.title}/${choice.id} does something odd to a friend`);
    // A moment that does nothing at all is not a moment.
    const moves = Object.keys(effect.attribute ?? {}).length + Object.keys(effect.skill ?? {}).length
      + (effect.money ? 1 : 0) + (effect.parents ? 1 : 0) + (effect.siblings ? 1 : 0)
      + (effect.friend ? 1 : 0) + (effect.energy ? 1 : 0) + (effect.stress ? 1 : 0) + (effect.morale ? 1 : 0);
    if (moves === 0) problems.push(`${moment.title}/${choice.id} changes nothing`);
    // And nothing claims a consequence the game does not carry. This list is
    // the things a line could say that would be a lie: the game has no
    // grounding, no arrest, no exclusion, no job it did not create and no
    // marriage it did not perform.
    if (/grounded|arrested|expelled|suspended|sacked|fired from|pregnan|got married|divorced/i.test(effect.note)) {
      problems.push(`${moment.title}/${choice.id} claims something the game does not do`);
    }
  }
}
if (MOMENTS.length < 15) problems.push(`only ${MOMENTS.length} moments in a whole childhood`);
// Every age from six to twenty has something that could happen in it.
for (let age = 6; age <= 20; age++) {
  if (momentsAt(age).length === 0) problems.push(`nothing ever happens at ${age}`);
}
if (!/SLATE/.test(GROWING_NOTE) || !/own/.test(GROWING_NOTE)) problems.push('the note about growing up has gone');

// --- The animal, which is a real thing rather than a line ---------------------

{
  const sim = quickSave(
    { birthYear: 2016, startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london' }, 'pet-check',
  );
  const kept = sim.execute({ kind: 'growing.choose', payload: { momentId: 'the_pet', choiceId: 'keep_it' } });
  if (!kept.ok) problems.push(`keeping the animal was refused: ${kept.error}`);
  else {
    const record = growingOf(sim);
    const pet = record?.pet;
    if (!pet) problems.push('the animal was kept and no animal exists');
    else {
      if (!PET_BY_ID[pet.kindId]) problems.push(`the animal is a "${pet.kindId}", which is not a kind`);
      if (!pet.name || pet.name.length < 2) problems.push('the animal has no name');
      if (pet.aWeek <= 0) problems.push('the animal costs nothing to keep');
      if (!describePet(sim, record)?.includes(pet.name)) problems.push('the page does not name the animal');
      // It costs money every week, and the account agrees.
      const before = sim.ledger.availableFunds(sim.player.primaryAccountId);
      sim.advanceTo(sim.now + 30 * MS_DAY);
      if (sim.ledger.availableFunds(sim.player.primaryAccountId) >= before) {
        problems.push('a month of the animal cost nothing at all');
      }
    }
  }
  for (const kind of PETS) {
    if (kind.aWeek <= 0) problems.push(`${kind.label} costs nothing a week`);
    if (kind.years < 1 || kind.years > 25) problems.push(`${kind.label} lives ${kind.years} years`);
    if (kind.about.length < 25) problems.push(`${kind.label} has nothing said about it`);
  }
  if (PET_NAMES.length < 12) problems.push('there are not enough names for an animal');
  if (!/costs money every week/.test(PET_NOTE)) problems.push('the note about the animal has gone');
}

// --- Pocket money -----------------------------------------------------------

let last = -1;
for (const band of ALLOWANCE_BY_AGE) {
  if (band.fromAge <= last) problems.push('the pocket money bands are out of order');
  last = band.fromAge;
  if (band.aWeek <= 0) problems.push(`a ${band.fromAge} year old is given nothing`);
}
if (allowanceAt(6) >= allowanceAt(15)) problems.push('a six year old gets as much as a fifteen year old');
if (allowanceAt(ALLOWANCE_STOPS_AT) !== 0) problems.push('pocket money never stops');
if (allowanceAt(4) !== 0) problems.push('a four year old is given pocket money');
if (!/calibration/.test(ALLOWANCE_NOTE)) problems.push('the note about pocket money has gone');

// --- Learning to drive -------------------------------------------------------

if (LESSON_COST <= 0 || TEST_COST <= 0) problems.push('the lessons or the test are free');
if (LESSONS_TO_READY < 5 || LESSONS_TO_READY > 60) problems.push(`it takes ${LESSONS_TO_READY} hours to be ready`);
if (TEST_PASSES_AT < 40 || TEST_PASSES_AT > 90) problems.push(`the test passes at ${TEST_PASSES_AT}`);
if (!/can be failed/.test(DRIVING_NOTE)) problems.push('the note about the driving test has gone');

// --- A life it actually happens to -------------------------------------------

{
  const child = quickSave(
    { birthYear: 2015, startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london' }, 'growing-check',
  );
  const record = growingOf(child);
  if (!record) problems.push('a new life carries no record of growing up');
  else {
    if (record.nextAt === undefined) problems.push('nothing is ever going to happen');
    if (record.done.length !== 0) problems.push('a life starts with things already behind it');
    const open = openMoments(child, record);
    if (open.length === 0) problems.push(`nothing can happen to a ${ageOf(child)} year old`);
    // Nothing that needs a school is open to somebody who is not at one.
    for (const moment of open) {
      if (!conditionMet(child, moment)) problems.push(`${moment.title} is open and its condition is not met`);
    }
    // A moment is answered once and then it is behind you.
    const first = open[0];
    const answered = child.execute({
      kind: 'growing.choose',
      payload: { momentId: first.id, choiceId: first.choices[0].id },
    });
    if (!answered.ok) problems.push(`answering ${first.title} was refused: ${answered.error}`);
    if (!growingOf(child).done.includes(first.id)) problems.push('answering a moment did not put it behind you');
    const again = child.execute({
      kind: 'growing.choose',
      payload: { momentId: first.id, choiceId: first.choices[0].id },
    });
    if (again.ok) problems.push('the same moment can be answered twice');
    if (livedThrough(growingOf(child)).length !== 1) problems.push('what has been lived through does not read back');
    // And a ten year old cannot book a driving lesson.
    if (child.execute({ kind: 'growing.lesson', payload: {} }).ok) problems.push('a ten year old books a driving lesson');
  }

  // Somebody old enough learns, and the test is a test.
  const grown = quickSave(
    { birthYear: 2004, startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london', wealth: 'wealthy' }, 'driving-check',
  );
  const theirs = growingOf(grown);
  if (theirs) {
    if (grown.execute({ kind: 'growing.test', payload: {} }).ok) problems.push('the test can be sat off no lessons');
    for (let i = 0; i < 6; i++) grown.execute({ kind: 'growing.lesson', payload: {} });
    if (theirs.lessons !== 6) problems.push(`six lessons booked and ${theirs.lessons} recorded`);
    if (readyToDrive(grown, theirs) <= 0) problems.push('six hours of lessons make nobody readier');
    const sat = grown.execute({ kind: 'growing.test', payload: {} });
    if (!sat.ok) problems.push(`the test was refused: ${sat.error}`);
    else if (sat.value.passed && grown.execute({ kind: 'growing.test', payload: {} }).ok) {
      problems.push('the test can be sat again after passing it');
    }
  }
}

// --- Say what was measured ----------------------------------------------------

const choices = MOMENTS.reduce((sum, one) => sum + one.choices.length, 0);
console.log(`${MOMENTS.length} moments and ${choices} answers, from ${Math.min(...MOMENTS.map((o) => o.fromAge))} to ${Math.max(...MOMENTS.map((o) => o.toAge))}.`);
console.log(`Pocket money from ${ALLOWANCE_BY_AGE[0].fromAge} until ${ALLOWANCE_STOPS_AT}, and ${LESSONS_TO_READY} hours before most people are ready for the test.`);
console.log(`${PETS.length} kinds of animal, each of which costs money every week and does not live forever.`);
console.log('Everybody it puts in your life is SLATE’s own, and every moment is the ordinary kind.');

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):`);
  for (const one of problems) console.error(`  - ${one}`);
  process.exit(1);
}
console.log('Growing up holds.');
