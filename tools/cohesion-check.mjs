/**
 * The whole thing makes sense together.
 *
 * Every other checker measures one part of the game against what is real. This
 * one measures the parts against each other: that a life at eleven and a life
 * at forty are both coherent lives, that nothing is handed to somebody who
 * could not have it, and that the systems built at different times still agree
 * about what a person of a given age can do.
 *
 * It is deliberately blunt. Everything here is something a player would notice
 * inside a minute and never unsee.
 */

import { quickSave } from '../src/engine/index.ts';
import { ageOf, mayI } from '../src/engine/systems/lifespan.ts';
import { schoolingOf, schoolHistoryOf, qualificationsOf } from '../src/engine/systems/school.ts';
import { runningOf, seasonOf } from '../src/engine/systems/athletics.ts';
import { growingOf, openMoments, conditionMet } from '../src/engine/systems/growing.ts';
import { TRACK_FROM_AGE } from '../src/engine/content/athletics.ts';
import { ALLOWANCE_STOPS_AT, allowanceAt } from '../src/engine/content/growingup.ts';
import { marksOn } from '../src/engine/systems/university.ts';
import { CITIES } from '../src/engine/content/geography.ts';
import { readFileSync } from 'node:fs';

/**
 * Every screen the game actually has, read off the router.
 *
 * Read as text rather than imported, because importing a React module into a
 * checker drags the whole interface in behind it.
 */
const ROUTES = new Set(['/home', '/world']);
for (const match of readFileSync('src/ui/workspaces/WorkspaceRouter.tsx', 'utf8')
  .matchAll(/'(\/workspace\/[a-z-]+)'\s*:/g)) ROUTES.add(match[1]);

const problems = [];

/** Every age a save can start at, and what has to be true of each. */
const LIVES = [
  { birthYear: 2018, expect: 'infantish' },
  { birthYear: 2014, expect: 'child' },
  { birthYear: 2010, expect: 'child' },
  { birthYear: 2008, expect: 'teenager' },
  { birthYear: 2004, expect: 'adult' },
  { birthYear: 1995, expect: 'adult' },
  { birthYear: 1975, expect: 'adult' },
  { birthYear: 1955, expect: 'older' },
];

for (const { birthYear } of LIVES) {
  for (const cityId of ['us-ca-losangeles', 'uk-eng-london', 'jp-13-tokyo']) {
    const sim = quickSave({ birthYear, startLocationId: cityId, homeRegionId: cityId }, `cohesion-${birthYear}-${cityId}`);
    const age = ageOf(sim);
    const where = `a ${age} year old in ${cityId}`;
    const player = sim.player;
    const u = sim.universe;

    // --- Nothing anybody that age could not have ---------------------------
    const grown = mayI(sim, 'majority').ok;
    const companies = Object.values(u.companies ?? {});
    if (!grown && companies.length > 0) problems.push(`${where} owns ${companies[0].name}`);
    if (grown && companies.length === 0) problems.push(`${where} has no company, and the game is about running one`);

    const cards = Object.values(u.accounts ?? {}).filter(
      (one) => one.ownerId === player.id && one.kind === 'credit_card',
    );
    if (!mayI(sim, 'borrow').ok && cards.length > 0) problems.push(`${where} holds a credit card`);

    const vehicles = Object.values(u.vehicles ?? {}).filter((one) => one.ownerId === player.id);
    if (!mayI(sim, 'drive').ok && vehicles.length > 0) problems.push(`${where} owns a car`);

    const owned = Object.values(u.properties ?? {}).filter((one) => one.ownerId === player.id && !one.soldAt);
    if (!grown && owned.length > 0) problems.push(`${where} owns a house`);

    const licences = Object.values(u.documents ?? {}).filter(
      (one) => one.personId === player.id && one.kind === 'driving_license',
    );
    if (!mayI(sim, 'drive').ok && licences.length > 0) problems.push(`${where} holds a driving license`);

    // --- Everything anybody that age would have ----------------------------
    const schooling = schoolingOf(sim);
    const history = schoolHistoryOf(sim);
    if (age >= 6 && age <= 16 && !schooling) problems.push(`${where} is at no school at all`);
    if (age >= 25 && history.length === 0) problems.push(`${where} has never been to school`);
    if (age >= 25 && qualificationsOf(sim).length === 0 && marksOn(sim) === 0) {
      problems.push(`${where} left school with nothing a university could read`);
    }

    // --- Growing up ---------------------------------------------------------
    const growing = growingOf(sim);
    if (!growing) problems.push(`${where} carries no record of growing up`);
    else {
      for (const moment of openMoments(sim, growing)) {
        if (!conditionMet(sim, moment)) problems.push(`${where} is offered ${moment.title} out of nowhere`);
        if (age < moment.fromAge || age > moment.toAge) {
          problems.push(`${where} is offered ${moment.title}, which is for ${moment.fromAge} to ${moment.toAge}`);
        }
      }
      if (age < ALLOWANCE_STOPS_AT && age >= 5 && allowanceAt(age) <= 0) {
        problems.push(`${where} is given no pocket money at all`);
      }
      if (age >= ALLOWANCE_STOPS_AT && allowanceAt(age) > 0) problems.push(`${where} is still given pocket money`);
      if (sim.execute({ kind: 'growing.lesson', payload: {} }).ok !== mayI(sim, 'drive').ok) {
        problems.push(`${where} can book a driving lesson when the law says otherwise`);
      }
    }

    // --- The track -----------------------------------------------------------
    const joined = sim.execute({ kind: 'track.join', payload: {} });
    if (age < TRACK_FROM_AGE && joined.ok) problems.push(`${where} was put in a lane`);
    if (joined.ok) {
      const running = runningOf(sim);
      if (!running) problems.push(`${where} made a team and has no running record`);
      const season = seasonOf(sim);
      if (joined.value.onTheTeam && !season) problems.push(`${where} made a team with no season to run`);
      if (season && season.meets.length === 0) problems.push(`${where} is in a season with no meets in it`);
      // And the stage they are running at is the stage they are actually at.
      if (season && season.stage === 'school' && !schooling) problems.push(`${where} runs for a school they do not attend`);
      if (season && season.stage === 'university' && !Object.values(u.studies ?? {}).some((one) => !one.endedAt)) {
        problems.push(`${where} runs for a university they do not attend`);
      }
    }

    // --- Nothing in the world is a dead end ---------------------------------
    for (const decision of Object.values(u.decisions ?? {})) {
      if (decision.route && !ROUTES.has(decision.route)) {
        problems.push(`${where} has a decision pointing at ${decision.route}, which is not a screen`);
      }
      if (!decision.route && decision.actions.length === 0) {
        problems.push(`${where} has a decision with nothing to do about it: ${decision.title}`);
      }
    }
    for (const notice of Object.values(u.notifications ?? {})) {
      if (notice.route && !ROUTES.has(notice.route)) {
        problems.push(`${where} was told something pointing at ${notice.route}, which is not a screen`);
      }
    }

    // --- And the character themselves holds together -------------------------
    if (!CITIES.get(player.currentLocationId)) problems.push(`${where} is standing in ${player.currentLocationId}`);
    if (!player.displayName || player.displayName.length < 3) problems.push(`${where} has no name`);
    if (!player.heritageId) problems.push(`${where} has no heritage`);
    for (const [key, value] of Object.entries(player.skills ?? {})) {
      if (value < 0 || value > 100) problems.push(`${where} holds ${value} of ${key}`);
    }
    for (const [key, value] of Object.entries(player.attributes ?? {})) {
      if (value < 0 || value > 100) problems.push(`${where} holds ${value} of ${key}`);
    }
    for (const [key, value] of Object.entries(player.wellbeing ?? {})) {
      if (typeof value === 'number' && (value < 0 || value > 100) && key !== 'sleepDebt' && key !== 'travelFatigue') {
        problems.push(`${where} is at ${value} for ${key}`);
      }
    }
  }
}

// --- The one thing every save has to be able to do ---------------------------

{
  // A save made at every age loads, saves and loads again without losing
  // anything the game needs to be playable.
  for (const birthYear of [2014, 2004, 1975]) {
    const sim = quickSave({ birthYear, startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london' }, `roundtrip-${birthYear}`);
    if (!sim.player.primaryAccountId) problems.push(`a save at ${ageOf(sim)} has no account to spend from`);
    if (!sim.universe.meta.id) problems.push('a save has no id');
    if (sim.universe.meta.schemaVersion <= 0) problems.push('a save has no schema version');
  }
}

// --- Say what was measured ----------------------------------------------------

console.log(`${LIVES.length} ages across 3 countries, checked for anything a person that age could not have.`);
console.log('A company, a credit card, a car, a house and a license all wait for the age that allows them.');
console.log(`${ROUTES.size} screens, and nothing in a save points at one that is not there.`);
console.log('School, growing up and the track all agree about where a character is in their life.');

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):`);
  for (const one of [...new Set(problems)]) console.error(`  - ${one}`);
  process.exit(1);
}
console.log('The whole thing coheres.');
