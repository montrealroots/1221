/**
 * Which numbers on a person ever actually move.
 *
 * `tools/wired.mjs` asks this too, and it cannot answer it. Its check is a
 * regular expression over the source — a field counts as moved when something
 * somewhere assigns to it — so `w.fitness = clamp(Math.min(w.fitness - 0.18,
 * ceiling), 0, 100)` reads as a live dial although it is a one-way ratchet to
 * nought, and `travelFatigue`, whose only two writes are subtractions from a
 * seed of zero, reads as live although it holds one value for a whole life. A
 * static read can prove a field is WRITTEN. It cannot prove a field MOVES. So
 * this one runs the game instead.
 *
 * On a career somebody plays, and that part is not a detail. The most expensive
 * recurring mistake in this project is measuring on a save nobody plays: an
 * idle save settles into a fixed point where most levers move nothing, and the
 * seven fields on `Reputation` are constants there — so an idle instrument
 * would flag all seven as dead and record the game as deader than it is. The
 * same run measured on a played career flags four of them, and flags them for
 * the true reason: they are ratchets that rise and never fall.
 *
 * A dial is reported when it never rose, never fell, or never held more than
 * one value across the whole career. Each of those is a different way of being
 * a number the player is invited to watch for no reason.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { quickSave } from '../src/engine/index.ts';
import { playACareer } from '../tests/played.ts';

/** Five years, which is long enough for every asked-for part to settle. */
const YEARS = 5;
const BASELINE = 'docs/UNWIRED.json';
const KEY = 'Dials nothing moves';

const check = process.argv.includes('--check');
const bless = process.argv.includes('--bless');

const model = readFileSync('src/engine/domain/model.ts', 'utf8');

/** Every numeric field declared on a shape, read off the model itself. */
function numericFieldsOf(shape) {
  const start = model.indexOf(`export interface ${shape} {`);
  if (start < 0) return [];
  const body = model.slice(start, model.indexOf('\n}', start));
  return [...body.matchAll(/^\s{2}([a-zA-Z][a-zA-Z0-9]*)\??:\s*number/gm)].map((m) => m[1]);
}

const WATCHED = [
  { shape: 'Reputation', fields: numericFieldsOf('Reputation'), on: (me) => me.reputation },
  { shape: 'Wellbeing', fields: numericFieldsOf('Wellbeing'), on: (me) => me.wellbeing },
];

const seen = new Map();
for (const { shape, fields } of WATCHED) {
  for (const field of fields) seen.set(`${shape}.${field}`, { values: new Set(), rose: false, fell: false, last: undefined });
}

const sim = quickSave({}, 'dials');
const me = () => sim.universe.people[sim.universe.playerId];

function sample() {
  for (const { shape, fields, on } of WATCHED) {
    const held = on(me()) ?? {};
    for (const field of fields) {
      const now = held[field];
      if (typeof now !== 'number') continue;
      const at = seen.get(`${shape}.${field}`);
      if (at.last !== undefined) {
        if (now > at.last) at.rose = true;
        if (now < at.last) at.fell = true;
      }
      at.values.add(Math.round(now * 1000) / 1000);
      at.last = now;
    }
  }
}

sample();
playACareer(sim, YEARS, { eachWeek: sample });

const dead = [];
for (const [name, at] of seen) {
  if (at.last === undefined) continue;
  if (at.values.size < 2) dead.push(`${name} (one value, ${at.last})`);
  else if (!at.rose) dead.push(`${name} (never rises)`);
  else if (!at.fell) dead.push(`${name} (never falls)`);
}

const watched = [...seen.keys()].length;
console.log(`${YEARS} played years. ${watched} numeric fields on Reputation and Wellbeing.`);
for (const one of dead) console.log(`  ${one}`);
console.log(`\n${dead.length} dials nothing moves.`);

const file = JSON.parse(readFileSync(BASELINE, 'utf8'));

if (bless) {
  file.counts[KEY] = dead.length;
  writeFileSync(BASELINE, `${JSON.stringify(file, null, 2)}\n`);
  console.log(`Blessed at ${dead.length}.`);
} else if (check) {
  const was = file.counts[KEY];
  if (typeof was !== 'number') {
    console.error(`${BASELINE} has no "${KEY}". Run: npx vite-node tools/dials.mjs --bless`);
    process.exit(1);
  }
  if (dead.length > was) {
    console.error(`\nThis was ${was} and is now ${dead.length}. A dial that stopped moving is a dial somebody stopped reading.`);
    process.exit(1);
  }
  if (dead.length < was) {
    console.log(`Down from ${was}. Run --bless to hold the new floor.`);
  }
}
