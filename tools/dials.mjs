/**
 * Which numbers on a person ever actually move.
 *
 * `tools/wired.mjs` asks this too, and it cannot answer it. Its check is a
 * regular expression over the source — a field counts as moved when something
 * somewhere assigns to it — so `w.fitness = clamp(Math.min(w.fitness - 0.18,
 * ceiling), 0, 100)` reads as a live dial although it is a one-way ratchet to
 * nought. A static read can prove a field is WRITTEN. It cannot prove a field
 * MOVES. So this one runs the game instead.
 *
 * It has already been paid for once. `travelFatigue` was seeded at nought and
 * written twice, both times by a subtraction, so it held one value for a whole
 * life while reading as live to every static check there was. This tool called
 * it — "one value, 0" — and the field, its `axisModifier` case, the four trait
 * modifiers that declared it, the higher-is-worse guard and the ninth dial on
 * the screen were deleted together. The count fell from nine to eight.
 *
 * On a career somebody plays, and that part is not a detail. The most expensive
 * recurring mistake in this project is measuring on a save nobody plays: an
 * idle save settles into a fixed point where most levers move nothing, and the
 * seven fields on `Reputation` are constants there — so an idle instrument
 * would flag all seven as dead and record the game as deader than it is. The
 * same run measured on a played career flags four of them, and flags them for
 * the true reason: they are ratchets that rise and never fall.
 *
 * A dial is reported when it never rose, never fell, never held more than one
 * value, or STOPPED — moved through less than a tenth of its own career range
 * across the whole last third.
 * Each is a different way of being a number the player is invited to watch for
 * no reason.
 *
 * The last-third check is here because a five-year run missed a real one.
 * `Reputation.reliability` moves in both directions for years, so every test of
 * the form "does this ever change" passes — and then it reaches nought somewhere
 * around year thirteen, spends about ninety per cent of every remaining week
 * there, and claws back at most six points out of a hundred. Being difficult
 * costs a player work for the first half of a career and nothing whatever for
 * the second. A dial that dies late looks alive to any instrument that does not
 * play long enough to watch it die, which is why this plays a whole career.
 *
 * A range test and not a one-value test, for that same reason: reliability does
 * still twitch off the floor now and then, so counting distinct values calls it
 * alive. What it does not do is go anywhere a player could feel.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { quickSave } from '../src/engine/index.ts';
import { playACareer } from '../tests/played.ts';

/**
 * How small a dial's late range has to be, against its whole-career range,
 * before it counts as having stopped.
 *
 * A tenth. Reliability runs nought to ninety over a career and nought to six
 * across the last third, which is seven per cent, so it is caught with room to
 * spare; every dial that genuinely oscillates to the end sits far above this.
 */
const STOPPED_UNDER = 0.1;

/** A whole career, because the interesting deaths are late ones. */
const YEARS = 25;
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
  for (const field of fields) {
    seen.set(`${shape}.${field}`, {
      values: new Set(), rose: false, fell: false, last: undefined,
      low: Infinity, high: -Infinity, lateLow: Infinity, lateHigh: -Infinity,
    });
  }
}

const sim = quickSave({}, 'dials');
const me = () => sim.universe.people[sim.universe.playerId];
const WEEKS = YEARS * 52;
/** Where the last third starts, which is the stretch a late death hides in. */
const LATE = Math.floor(WEEKS * (2 / 3));
let week = 0;

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
      at.low = Math.min(at.low, now);
      at.high = Math.max(at.high, now);
      if (week >= LATE) {
        at.lateLow = Math.min(at.lateLow, now);
        at.lateHigh = Math.max(at.lateHigh, now);
      }
      at.last = now;
    }
  }
}

sample();
playACareer(sim, YEARS, { eachWeek: (_at, at) => { week = at; sample(); } });

const dead = [];
for (const [name, at] of seen) {
  if (at.last === undefined) continue;
  if (at.values.size < 2) dead.push(`${name} (one value, ${at.last})`);
  else if (!at.rose) dead.push(`${name} (never rises)`);
  else if (!at.fell) dead.push(`${name} (never falls)`);
  else {
    const whole = at.high - at.low;
    const late = at.lateHigh - at.lateLow;
    if (whole > 0 && late / whole < STOPPED_UNDER) {
      dead.push(`${name} (stops: ${late.toFixed(1)} of its ${whole.toFixed(1)} range in the last third, `
        + `sitting at ${at.lateLow.toFixed(1)}-${at.lateHigh.toFixed(1)})`);
    }
  }
}

const watched = [...seen.keys()].length;
console.log(`${YEARS} played years, ${watched} numeric fields on Reputation and Wellbeing, and the last third watched separately.`);
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
