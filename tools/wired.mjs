/**
 * SLATE — what the game declares, and what actually reads it.
 *
 * This is the counter to the one failure this project is most exposed to.
 * SLATE is aiming at a simulation deeper than anything in its genre, and the
 * cheapest way to fake that is to declare the vocabulary of depth without
 * building the systems: a field for every axis, a modifier key for every
 * effect, an id namespace for every noun. It reads as a deep game to anybody
 * scrolling the source, and it plays as nothing at all.
 *
 * The disease was found here by measurement, not by argument: 813 acting
 * attributes nothing read, 54 trait modifier keys of which two were consulted,
 * guards on keys no trait declared, a seven-axis reputation nothing moved, and
 * a hundred and twenty-five id namespaces for systems long deleted. The revamp
 * took all of that out, and what is left to walk is the vocabulary that
 * survived it and what has come back since: the id namespaces, the tables in
 * the save, and the personality's knobs and axes.
 *
 * So this walks the declared vocabulary, finds what nothing reads, and holds
 * the number against a baseline in `docs/UNWIRED.json`. It does not demand the
 * number be zero: a vocabulary written a little ahead of its system is normal
 * and often right, and the content here was deliberately written first. What
 * it forbids is the number going UP. Declaring more dead words is the thing
 * that has to stop.
 *
 *   node tools/wired.mjs            report
 *   node tools/wired.mjs --check    fail the gate if anything got worse
 *   node tools/wired.mjs --bless    accept the current numbers as the baseline
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';

const CHECK = process.argv.includes('--check');
const BLESS = process.argv.includes('--bless');
const BASELINE = 'docs/UNWIRED.json';

// --- reading the tree --------------------------------------------------------

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    // Forward slashes, always. Every path this file names a file by is written
    // with them, and `join` would hand back backslashes on Windows.
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) walk(path, out);
    else if (/\.(ts|tsx)$/.test(path)) out.push(path);
  }
  return out;
}

const FILES = walk('src');
const SOURCE = new Map(FILES.map((f) => [f, readFileSync(f, 'utf8')]));

/** Everything but the file a thing is declared in, joined. A declaration is not a use. */
function everywhereBut(...declaredIn) {
  const skip = new Set(declaredIn);
  return FILES.filter((f) => !skip.has(f)).map((f) => SOURCE.get(f)).join('\n');
}

const ALL = [...SOURCE.values()].join('\n');

// --- the checks --------------------------------------------------------------

const findings = [];

/** A group of declared words, and the ones nothing reads. */
function group(name, what, dead, hint) {
  findings.push({ name, what, dead: [...dead].sort(), hint });
}

// 1. Id namespaces. `nextId('x')` is the only way one is spent, so a namespace
//    with no call site is a noun the game does not have.
{
  const ids = readFileSync('src/engine/core/ids.ts', 'utf8');
  const declared = new Set();
  const block = ids.slice(ids.indexOf('ID_NAMESPACES = ['), ids.indexOf('] as const;'));
  for (const m of block.matchAll(/'([a-z0-9_]+)'/g)) declared.add(m[1]);
  const used = new Set();
  for (const m of ALL.matchAll(/nextId\(\s*'([a-z0-9_]+)'/g)) used.add(m[1]);
  group('Id namespaces', declared.size, [...declared].filter((d) => !used.has(d)),
    'A noun with no nextId call site is a table the game never fills.');
}

// 2. Tables in the save that nothing writes. A collection only bootstrap fills
//    is a shape, not a system.
{
  const model = SOURCE.get('src/engine/domain/model.ts');
  const start = model.indexOf('export interface SaveUniverse {');
  const body = model.slice(start, model.indexOf('\n}', start));
  const tables = [...body.matchAll(/^\s{2}([a-zA-Z][a-zA-Z0-9]*):\s*(?:Record<|[A-Za-z]+\[\])/gm)].map((m) => m[1]);
  const others = everywhereBut('src/engine/domain/model.ts', 'src/engine/world/bootstrap.ts');
  const dead = tables.filter((t) => !new RegExp(
    `\\.${t}\\[[^\\]]*\\]\\s*=|\\.${t}\\.(?:push|splice|unshift)\\(|\\.${t}\\s*=\\s*\\{`,
  ).test(others));
  group('Save tables nothing fills', tables.length, dead,
    'A collection only bootstrap writes is a shape in the save, not a system in the game.');
}

// 3. Personality knobs. A trait may only declare a knob named in
//    `PersonalityKnob`, so the vocabulary is that union, and a knob is read
//    where the life system asks `personalityOf(…, 'knob')`. The helper that
//    answers the question is not a reader of it.
{
  const content = SOURCE.get('src/engine/content/personality-traits.ts');
  const union = content.slice(content.indexOf('export type PersonalityKnob ='), content.indexOf(';', content.indexOf('export type PersonalityKnob =')));
  const knobs = [...union.matchAll(/'([a-zA-Z]+)'/g)].map((m) => m[1]);
  const others = everywhereBut('src/engine/content/personality-traits.ts', 'src/engine/systems/personality.ts');
  const asked = new Set([...others.matchAll(/personalityOf\([^,()]+,\s*'([a-zA-Z]+)'\)/g)].map((m) => m[1]));
  group('Personality knobs nothing reads', knobs.length, knobs.filter((k) => !asked.has(k)),
    'A knob a trait can move and the game never asks about is a trait that says it does something and does not.');
}

// 4. Personality axes. An axis is consulted where the engine reads it by name,
//    `.axis` or `'axis'`, anywhere but the model that declares it.
{
  const model = SOURCE.get('src/engine/domain/model.ts');
  const start = model.indexOf('export interface Personality {');
  const body = model.slice(start, model.indexOf('\n}', start));
  const axes = [...body.matchAll(/^\s{2}([a-zA-Z][a-zA-Z0-9]*):\s*number/gm)].map((m) => m[1]);
  const engine = FILES.filter((f) => f.startsWith('src/engine') && f !== 'src/engine/domain/model.ts')
    .map((f) => SOURCE.get(f)).join('\n');
  group('Personality axes nothing consults', axes.length,
    axes.filter((a) => !new RegExp(`'${a}'|\\.${a}\\b`).test(engine)),
    'A slider the player sets and nothing reads.');
}

// The axes came back at four with the Dispositions & Traits step, and that is
// a rise, so the reason is here. The page came back whole, all seven sliders,
// and it says on it which three do something today and that the other four
// are kept and read by nothing: openness waits on travel, and extraversion,
// agreeableness and risk tolerance on other people. None of those is built.
// The knobs came back at nought, and a trait can only declare one that
// something reads.

// Both of these rose by one when the family went, and a rise is normally the
// thing this file exists to refuse, so the reason is written down. The family
// was the only thing that made a person after boot. The player is written by
// bootstrap, by hand, as `person_000001`, so the `person` namespace has no
// `nextId` call and `people` is filled only by bootstrap. Both findings are the
// player — the one record this build is about — counted honestly: the count
// caught up with a deletion rather than a word being declared ahead of its
// system. A rise with no such entry beside it is still a defect.

// --- the report --------------------------------------------------------------

const counts = Object.fromEntries(findings.map((f) => [f.name, f.dead.length]));
const total = Object.values(counts).reduce((n, k) => n + k, 0);

console.log('What SLATE declares, and what nothing reads.\n');
for (const f of findings) {
  console.log(`  ${String(f.dead.length).padStart(4)}  ${f.name}  (of ${f.what})`);
  if (f.dead.length > 0) {
    console.log(`        ${f.hint}`);
    const shown = f.dead.slice(0, 14).join(', ');
    console.log(`        ${shown}${f.dead.length > 14 ? `, and ${f.dead.length - 14} more` : ''}`);
  }
}
console.log(`\n${total} declared words that nothing reads.`);

if (BLESS) {
  const note = 'Set by tools/wired.mjs --bless. These may fall. They may not rise.';
  writeFileSync(BASELINE, `${JSON.stringify({ note, counts }, null, 2)}\n`);
  console.log(`\nBaseline written to ${BASELINE}.`);
  process.exit(0);
}

if (!existsSync(BASELINE)) {
  console.log(`\nNo baseline yet. Run --bless to set one.`);
  process.exit(CHECK ? 1 : 0);
}

const was = JSON.parse(readFileSync(BASELINE, 'utf8')).counts;
const worse = [];
const better = [];
for (const [name, n] of Object.entries(counts)) {
  const before = was[name] ?? 0;
  if (n > before) worse.push(`${name}: ${before} → ${n}`);
  if (n < before) better.push(`${name}: ${before} → ${n}`);
}

if (better.length > 0) {
  console.log('\nWired up since the baseline:');
  for (const line of better) console.log(`  ${line}`);
  console.log('Run --bless to hold the new floor.');
}
if (worse.length > 0) {
  console.log('\nMore dead words than the baseline:');
  for (const line of worse) console.log(`  ${line}`);
  console.log('\nA field, a key or a namespace with nothing that reads it is the cheapest way to');
  console.log('look deep without being deep. Wire it, or do not declare it yet.');
  if (CHECK) process.exit(1);
}
