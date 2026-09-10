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
 *   node tools/deciders.mjs            report
 *   node tools/deciders.mjs --check    fail the gate on a draw nothing owns
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const CHECK = process.argv.includes('--check');

const EXEMPT = new Set([
  'src/engine/core/rng.ts',
  'src/engine/core/simulation.ts',
  'src/engine/decided.ts',
]);

/** The only three ways to get hold of a generator. */
const DRAWS = /\b(?:sim|s|this)\.rng\(|\brngFor\(|\bmakeRng\(/;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
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

console.log('');
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
