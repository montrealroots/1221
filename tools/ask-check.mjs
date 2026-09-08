/**
 * Saying it in your own words gets the real thing, or an honest no.
 *
 * The whole risk in a free text box is that it flatters. A box that answers
 * "done" to anything feels clever for about a minute and then the save is a
 * lie. So this measures the two properties that keep it honest.
 *
 * The first is that nothing in the phrasebook is invented. Every command it
 * names is a command the engine really registered, every route is a screen
 * that really exists, every kind of place is a kind the world really builds.
 * A phrasebook entry that points at nothing would be the game promising
 * something it cannot do, which is the one thing it must never do.
 *
 * The second is that the resolver never says yes on a command's behalf. It
 * returns a plan; running the plan is the command's own business, guards and
 * refusals included. So this runs the plans against a real save and checks
 * that a refusal stays a refusal.
 */

import { readFileSync } from 'node:fs';
import { PHRASEBOOK, ASK_LIMITS_NOTE, ASK_NOTE } from '../src/engine/content/phrasebook.ts';
import { resolveAsk, planFor, candidatesFor } from '../src/engine/systems/ask.ts';
import { PLACE_KIND_LABEL, placesIn } from '../src/engine/content/places.ts';
import { quickSave } from '../src/engine/index.ts';

const problems = [];

// --- Nothing in the book is invented -----------------------------------------

const sim = quickSave();
const commands = new Set(sim.commandKinds());

const routes = new Set(['/home', '/world']);
{
  const source = readFileSync('src/ui/workspaces/WorkspaceRouter.tsx', 'utf8');
  const map = source.slice(source.indexOf('const WORKSPACES'), source.indexOf('export function WorkspaceRouter'));
  for (const match of map.matchAll(/'(\/workspace\/[a-z]+)'/g)) routes.add(match[1]);
}
if (routes.size < 20) problems.push(`only ${routes.size} routes were read out of the workspace router, which cannot be right`);

const kinds = new Set(Object.keys(PLACE_KIND_LABEL));
const ids = new Set();
const labels = new Set();

for (const entry of PHRASEBOOK) {
  if (ids.has(entry.id)) problems.push(`${entry.id} is in the phrasebook twice`);
  ids.add(entry.id);
  if (labels.has(entry.label)) problems.push(`"${entry.label}" is the label of two different entries`);
  labels.add(entry.label);

  if (entry.command && !commands.has(entry.command)) {
    problems.push(`"${entry.label}" runs ${entry.command}, which the engine does not register`);
  }
  if (!routes.has(entry.route)) {
    problems.push(`"${entry.label}" points at ${entry.route}, which is not a screen`);
  }
  if (entry.placeKind && !kinds.has(entry.placeKind)) {
    problems.push(`"${entry.label}" looks for a ${entry.placeKind}, which is not a kind of place`);
  }
  if (entry.needs === 'place' && !entry.placeKind) {
    problems.push(`"${entry.label}" needs a place and does not say what kind`);
  }
  if (entry.needs !== 'place' && entry.placeKind) {
    problems.push(`"${entry.label}" names a kind of place it does not need`);
  }
  if (entry.needs === 'screen' && entry.command) {
    problems.push(`"${entry.label}" is a screen and also claims a command`);
  }
  if (entry.needs !== 'screen' && !entry.command) {
    problems.push(`"${entry.label}" is not a screen and runs nothing`);
  }
  if (entry.says.length < 3) problems.push(`"${entry.label}" has only ${entry.says.length} way(s) of being said`);
  if (entry.about.length < 20) problems.push(`"${entry.label}" does not say what it does`);

  // The labels reach the screen, and the sweep cannot see them: they are
  // passed by position rather than after a `label:`, so they are checked here.
  for (const word of entry.label.split(' ')) {
    if (word.length > 0 && word[0] !== word[0].toUpperCase()) {
      problems.push(`"${entry.label}" is not Title Case`);
      break;
    }
  }
  for (const said of entry.says) {
    if (said !== said.toLowerCase()) problems.push(`"${said}" on ${entry.id} has a capital in it, and nobody types that way`);
    if (/[.,!?]/.test(said)) problems.push(`"${said}" on ${entry.id} carries punctuation the matcher strips anyway`);
  }
}

// --- Every phrasing lands on its own entry -----------------------------------

let wrong = 0;
let asked = 0;
let phrasings = 0;
for (const entry of PHRASEBOOK) {
  for (const said of entry.says) {
    phrasings++;
    const answer = resolveAsk(sim, said);
    if (answer.kind === 'ambiguous') { asked++; continue; }
    if (answer.kind === 'unsupported') {
      problems.push(`"${said}" is written on "${entry.label}" and resolves to nothing`);
      wrong++;
      continue;
    }
    if (answer.askable.id !== entry.id) {
      problems.push(`"${said}" is written on "${entry.label}" and lands on "${answer.askable.label}"`);
      wrong++;
    }
  }
}
// A phrasing shared between two near neighbors is asked back about, which is
// the right answer. Landing on the wrong entry is not.
if (wrong > 0) problems.push(`${wrong} phrasing(s) do not land on the entry they are written on`);
if (asked > phrasings * 0.2) problems.push(`${asked} of ${phrasings} phrasings are ambiguous, which is too many to be useful`);

// --- It does not pretend ------------------------------------------------------

const nonsense = [
  'buy a spaceship', 'become president', 'travel back in time', 'hack the pentagon',
  'grow a second head', 'marry the moon',
];
for (const line of nonsense) {
  const answer = resolveAsk(sim, line);
  if (answer.kind === 'do' || answer.kind === 'go') {
    problems.push(`"${line}" was answered with ${answer.kind === 'do' ? answer.command : answer.route} instead of a no`);
  }
}
if (resolveAsk(sim, '   ').kind !== 'unsupported') problems.push('an empty line was understood as something');

// --- A plan is a plan, and the command still decides --------------------------

// Nothing the resolver returns has done anything. Proved by resolving every
// entry twice and checking the world did not move.
const before = JSON.stringify(sim.universe);
for (const entry of PHRASEBOOK) {
  resolveAsk(sim, entry.says[0]);
  planFor(sim, entry.id);
}
if (JSON.stringify(sim.universe) !== before) problems.push('asking for something changed the world before anything was run');

// A refusal is the command's own words, not the box's.
const child = quickSave({ birthYear: 2014 });
const shift = resolveAsk(child, 'work my shift');
if (shift.kind === 'do') {
  const outcome = child.execute({ kind: shift.command, payload: shift.payload });
  if (outcome.ok) problems.push('a twelve year old with no job worked a shift');
  else if (!outcome.error || outcome.error.length < 10) problems.push('the refusal did not say why');
} else if (shift.kind === 'go' || shift.kind === 'which') {
  problems.push(`asking to work a shift produced a ${shift.kind}, not a plan`);
}

// --- Standing somewhere changes what was meant, and both are real commands ----

{
  const place = placesIn(sim.player.currentLocationId).find((one) => one.kind === 'gas_station');
  if (!place) {
    problems.push('the starting city has no gas station to test standing in one against');
  } else {
    const away = resolveAsk(sim, 'fill up the car');
    if (away.kind === 'do' && away.command !== 'go.to') problems.push('standing away from the pumps still ran the pump');
    if (away.kind === 'which' && away.options.length < 2) problems.push('a question was asked with one answer in it');
    const wasAt = sim.player.currentPlaceId;
    sim.player.currentPlaceId = place.id;
    const here = resolveAsk(sim, 'fill up the car');
    if (here.kind !== 'do' || here.command === 'go.to') problems.push('standing at the pumps still walked to them');
    if (here.kind === 'do' && here.payload.placeId !== place.id) problems.push('the plan named a place other than the one being stood in');
    sim.player.currentPlaceId = wasAt;
  }
}

// A kind of place the city does not have is a plain no with a reason.
{
  const noneHere = PHRASEBOOK.find((one) => one.needs === 'place'
    && candidatesFor(sim, one).length === 0);
  if (noneHere) {
    const answer = resolveAsk(sim, noneHere.says[0]);
    if (answer.kind !== 'cannot') problems.push(`there is no ${noneHere.placeKind} here and asking for one did not say so`);
    else if (!answer.why.includes('city')) problems.push('the reason did not say where to look instead');
  }
}

// --- The notes are written ----------------------------------------------------

if (ASK_NOTE.length < 60) problems.push('there is no note saying what this is');
if (ASK_LIMITS_NOTE.length < 60) problems.push('there is no note saying what it cannot do');

// --- Say what was measured ----------------------------------------------------

const byNeed = {};
for (const entry of PHRASEBOOK) byNeed[entry.needs] = (byNeed[entry.needs] ?? 0) + 1;
const runs = PHRASEBOOK.filter((one) => one.command).length;
console.log(`${PHRASEBOOK.length} things you can ask for, in ${phrasings} different sets of words.`);
console.log(`${runs} of them run a real command; ${byNeed.screen ?? 0} open the screen where the thing is done and say so.`);
console.log(`${new Set(PHRASEBOOK.map((one) => one.command).filter(Boolean)).size} distinct commands, every one of them registered by the engine.`);
console.log(`${nonsense.length} things the game does not do were asked for, and none of them were answered with a yes.`);
console.log('The box resolves to a plan. Running it is the command’s own business, and so is every refusal.');

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):`);
  for (const one of [...new Set(problems)]) console.error(`  - ${one}`);
  process.exit(1);
}
console.log('Asking for something in your own words holds.');
