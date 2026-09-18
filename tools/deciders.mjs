/**
 * SLATE — nothing in the engine rolls a die on its own.
 *
 * `src/engine/core/deciders.ts` explains why this exists. The short of it: a
 * simulation and a slot machine are indistinguishable from outside, and the
 * place they become distinguishable is the draw. So every file in the engine
 * that gets hold of the random number generator has to be accounted for by a
 * registered decider, and a registered decider is swept by
 * `tests/deciders.test.ts` until it proves its inputs matter.
 *
 * A file draws when it calls `sim.rng(`, `rngFor(` or `makeRng(` — the only
 * three ways to obtain one. What it does with it afterwards is downstream of
 * that, so those three are the whole surface and there is nothing to miss.
 *
 * Three files are exempt and each for its own reason, not as a courtesy:
 * `core/rng.ts` builds the generator, `core/simulation.ts` hands it out, and
 * `decided.ts` is the registry itself.
 *
 * ## The file was the wrong unit, and the stream is the right one
 *
 * This checked ownership per FILE, so a file passed the moment one decider
 * claimed it — and a new `sim.rng('casting', 'offer', ...)` dropped into a file
 * that already owned four deciders slid under the check without a word. The
 * whole point of the registry is that a draw is accounted for, and the thing
 * that gets accounted for is the stream, not the file it happens to live in.
 *
 * So the stream is counted too. `sim.rng('audition', 'house', …)` is the
 * stream `audition.house`, which is exactly the shape of a decider id, and the
 * two are compared directly.
 *
 * Thirteen streams turned out to have no decider the first time this ran, two
 * of them in files that already owned others. Registering thirteen deciders is
 * real work — each has to declare what it reads and then survive `sweepOne`
 * proving the inputs matter — so this does not fail on them today. It counts
 * them, against a blessed floor in `docs/UNWIRED.json`, in the idiom the rest
 * of this repo already uses: the number may fall and it may not rise. A
 * fourteenth stream fails the gate the day it is written, which is the hole
 * this closes.
 *
 *   node tools/deciders.mjs            report
 *   node tools/deciders.mjs --check    fail the gate on a draw nothing owns
 *   node tools/deciders.mjs --bless    hold the new floor for unowned streams
 */

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

const CHECK = process.argv.includes('--check');
const BLESS = process.argv.includes('--bless');
const BASELINE = 'docs/UNWIRED.json';
const KEY = 'Draw streams no decider owns';

/**
 * A draw names its stream in the first two arguments, and a decider id is
 * those two joined. `sim.rng('audition', 'house', holder)` is `audition.house`.
 * A one-argument draw is its own stream and is compared as-is.
 */
const STREAM = /(?:sim|s|this)\.rng\(\s*'([^']+)'\s*(?:,\s*'([^']+)')?/g;

const EXEMPT = new Set([
  'src/engine/core/rng.ts',
  'src/engine/core/simulation.ts',
  'src/engine/decided.ts',
]);

/** The only three ways to get hold of a generator. */
const DRAWS = /\b(?:sim|s|this)\.rng\(|\brngFor\(|\bmakeRng\(/;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    // Forward slashes, always. A decider's `drawnIn` is written with them, and
    // `join` would hand back backslashes on Windows — which made every decider
    // look stale and every drawing file look like an orphan.
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) walk(path, out);
    else if (path.endsWith('.ts')) out.push(path);
  }
  return out;
}

const files = walk('src/engine');

// Who draws, and where.
const drawing = new Map();
for (const file of files) {
  if (EXEMPT.has(file)) continue;
  const lines = readFileSync(file, 'utf8').split('\n');
  const at = [];
  for (const [i, line] of lines.entries()) {
    if (line.trim().startsWith('*') || line.trim().startsWith('//')) continue;
    if (DRAWS.test(line)) at.push(i + 1);
  }
  if (at.length > 0) drawing.set(file, at);
}

// And the same walk again for the streams themselves, which is the unit that
// actually gets owned.
const streams = new Map();
for (const file of files) {
  if (EXEMPT.has(file)) continue;
  for (const [i, line] of readFileSync(file, 'utf8').split('\n').entries()) {
    if (line.trim().startsWith('*') || line.trim().startsWith('//')) continue;
    STREAM.lastIndex = 0;
    let s;
    while ((s = STREAM.exec(line)) !== null) {
      const id = s[2] ? `${s[1]}.${s[2]}` : s[1];
      if (!streams.has(id)) streams.set(id, []);
      streams.get(id).push(`${file}:${i + 1}`);
    }
  }
}

// What the registry says it accounts for. Read from the source rather than by
// importing, so this stays a text check that cannot be fooled by a module that
// registers something at runtime and hides it from the file.
const registry = readFileSync('src/engine/decided.ts', 'utf8');
const owned = new Map();
for (const m of registry.matchAll(/id:\s*'([^']+)'[\s\S]{0,400}?drawnIn:\s*'([^']+)'/g)) {
  const list = owned.get(m[2]) ?? [];
  list.push(m[1]);
  owned.set(m[2], list);
}

console.log(`${files.length} engine files. ${drawing.size} of them draw.\n`);

const orphans = [];
for (const [file, at] of [...drawing].sort()) {
  const by = owned.get(file);
  if (by) {
    console.log(`  ok       ${file}  (line${at.length > 1 ? 's' : ''} ${at.join(', ')})  →  ${by.join(', ')}`);
  } else {
    orphans.push(file);
    console.log(`  ORPHAN   ${file}  (line${at.length > 1 ? 's' : ''} ${at.join(', ')})`);
  }
}

// A decider claiming a file that no longer draws is stale, and stale is how
// this kind of check quietly stops covering anything.
const stale = [...owned.keys()].filter((file) => !drawing.has(file));
for (const file of stale) {
  console.log(`  STALE    ${file}  is claimed by ${owned.get(file).join(', ')} and does not draw`);
}

// The stream-level count, which is the one the file-level check could not see.
// Every stream a decider accounts for: its own id, plus whatever it declares in
// `draws`. A decision may take more than one die — `weather.day` takes `weather`
// for the day and `weather-hours` for the hours inside it — and insisting the
// stream be named after the decider is a rule about naming rather than about
// accounting. Renaming the streams to match was the alternative and is the one
// thing that must not happen: a stream key is an input to the generator, so
// changing one changes every seeded outcome in the build.
const registered = new Set([...owned.values()].flat());
for (const m of registry.matchAll(/draws:\s*\[([^\]]*)\]/g)) {
  for (const one of m[1].matchAll(/'([^']+)'/g)) registered.add(one[1]);
}
const unowned = [...streams.keys()].filter((id) => !registered.has(id)).sort();
console.log(`\n${streams.size} draw streams, ${registered.size} of them registered.`);
if (unowned.length > 0) {
  console.log(`${unowned.length} that no decider owns:`);
  for (const id of unowned) {
    const at = streams.get(id);
    console.log(`  ${id.padEnd(22)} ${at[0]}${at.length > 1 ? ` (+${at.length - 1} more)` : ''}`);
  }
}

const file = JSON.parse(readFileSync(BASELINE, 'utf8'));
let streamsRose = false;
if (BLESS) {
  file.counts[KEY] = unowned.length;
  writeFileSync(BASELINE, `${JSON.stringify(file, null, 2)}\n`);
  console.log(`Blessed at ${unowned.length}.`);
} else {
  const was = file.counts[KEY];
  if (typeof was !== 'number') {
    console.error(`${BASELINE} has no "${KEY}". Run: node tools/deciders.mjs --bless`);
    if (CHECK) process.exit(1);
  } else if (unowned.length > was) {
    console.error(`\nThis was ${was} and is now ${unowned.length}. A stream nothing owns is a die the registry cannot see.`);
    streamsRose = true;
  } else if (unowned.length < was) {
    console.log(`Down from ${was}. Run --bless to hold the new floor.`);
  }
}

console.log('');
if (streamsRose && CHECK) process.exit(1);
if (orphans.length === 0 && stale.length === 0) {
  console.log(`Every draw is owned by a decider, and every decider owns a real one.`);
  console.log(`${[...owned.values()].flat().length} registered: ${[...owned.values()].flat().join(', ')}`);
} else {
  if (orphans.length > 0) {
    console.log(`${orphans.length} file${orphans.length > 1 ? 's roll dice' : ' rolls dice'} that no decider owns.`);
    console.log('Register one in src/engine/decided.ts saying what it decides and what it reads.');
    console.log('The sweep in tests/deciders.test.ts will then hold it to that.');
  }
  if (stale.length > 0) console.log(`${stale.length} decider${stale.length > 1 ? 's claim' : ' claims'} a file that no longer draws.`);
  if (CHECK) process.exit(1);
}
