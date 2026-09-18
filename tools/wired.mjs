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
 * The disease is already here and was found by measurement, not by argument:
 *
 *   - 813 acting attributes, every one of them set to 100 on every person, and
 *     no system that reads a single id.
 *   - 54 `systemMods` keys across 445 traits, of which two are consulted.
 *   - Six entries in SYSTEM_HIGHER_IS_WORSE guarding keys no trait declares.
 *   - A seven-axis Reputation with two seed writers and nothing that moves it.
 *   - Id namespaces for jobs, flights, schools and channels whose systems were
 *     deleted a long time ago.
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

// 2. `systemMods` keys. A key nothing multiplies through is an effect the trait
//    claims and does not have.
{
  const declared = new Set();
  for (const file of ['src/engine/domain/attributes.ts', 'src/engine/content/personality-traits.ts']) {
    for (const block of SOURCE.get(file).matchAll(/systemMods:\s*\{([^}]*)\}/g)) {
      for (const m of block[1].matchAll(/([a-zA-Z][a-zA-Z0-9]*)\s*:/g)) declared.add(m[1]);
    }
  }
  // A key is read when some file asks for it by name.
  const asked = new Set();
  for (const m of ALL.matchAll(/(?:modifierFor|personalityOf|dispositionOf|traitModifier|axisModifier|systemModifier|personalityModifier)\([^)]*'([a-zA-Z][a-zA-Z0-9]*)'/g)) {
    asked.add(m[1]);
  }
  group('Trait modifier keys', declared.size, [...declared].filter((d) => !asked.has(d)),
    'A key no system asks for by name is an effect the trait promises and does not deliver.');
}

// 3. The higher-is-worse guards. These exist to flip the sign on a key; one
//    guarding a key no trait declares is rot left by a deleted system.
{
  const src = SOURCE.get('src/engine/domain/attributes.ts') + SOURCE.get('src/engine/content/personality-traits.ts');
  const guards = new Set();
  for (const m of src.matchAll(/(?:SYSTEM|PERSONALITY)_HIGHER_IS_WORSE[^=]*=\s*(?:new Set\()?\[([^\]]*)\]/g)) {
    for (const k of m[1].matchAll(/'([a-zA-Z][a-zA-Z0-9]*)'/g)) guards.add(k[1]);
  }
  const declared = new Set();
  for (const block of src.matchAll(/systemMods:\s*\{([^}]*)\}/g)) {
    for (const m of block[1].matchAll(/([a-zA-Z][a-zA-Z0-9]*)\s*:/g)) declared.add(m[1]);
  }
  group('Higher-is-worse guards', guards.size, [...guards].filter((g) => !declared.has(g)),
    'A guard on a key no trait declares is left over from a system that was deleted.');
}

// 4. The dials on a person that nothing moves USED to be asked here, and this
//    file cannot answer it. Everything above is a question about whether a word
//    is READ, which a regular expression over the source can settle. Whether a
//    NUMBER MOVES is a question about what happens when the game runs, and the
//    regex that stood here answered a different one: it matched any assignment,
//    so a one-way ratchet like `w.fitness = clamp(Math.min(w.fitness - 0.18,
//    ceiling), 0, 100)` scored as a live dial, and `travelFatigue`, whose only
//    writes were subtractions from a seed of nought, scored as live while
//    holding one value for a whole life. It reported nought dead. The honest
//    figure was eight. `tools/dials.mjs` plays a career and counts them, and
//    owns the "Dials nothing moves" key in the baseline this file writes.

// 4b. The personality axes are a character sheet, not a set of dials: they are
//     meant to be fixed at creation. So the honest question is not whether
//     anything moves one, but whether anything READS it. An axis the player is
//     asked to set and no system consults is a question with no consequence.
//
//     This count has gone UP once, at 3 to 4, and the reason is written down
//     because a rise is normally the thing this file exists to refuse.
//     `openness` had one reader: a case in `axisModifier` scaling how fast
//     `travelFatigue` came off. Nothing in the build ever put any on, so the
//     read reached nothing. Deleting the dead dial deleted the case, and the
//     axis stopped being read at all. No word was declared; a fake reader was
//     removed, and this check went from counting six honestly to counting
//     seven honestly. A rise for that reason is the count catching up, not the
//     rot it guards against — which is the same blindness that made
//     `travelFatigue` look like a live dial and made `tools/dials.mjs`
//     necessary. A rise with no such entry beside it is still a defect.
{
  const model = SOURCE.get('src/engine/domain/model.ts');
  const start = model.indexOf('export interface Personality {');
  const body = model.slice(start, model.indexOf('\n}', start));
  const axes = [...body.matchAll(/^\s{2}([a-zA-Z][a-zA-Z0-9]*)\??:\s*number/gm)].map((m) => m[1]);
  // Creation asks about every axis by name, so its own list does not count.
  const engine = FILES.filter((f) => f.startsWith('src/engine') && f !== 'src/engine/domain/model.ts')
    .map((f) => SOURCE.get(f)).join('\n');
  const dead = axes.filter((a) => !new RegExp(`'${a}'|\\.${a}\\b`).test(engine));
  group('Personality axes nothing consults', axes.length, dead,
    'An axis creation asks the player to set, and no system in the engine ever reads, is a question with no consequence.');
}

// 5. Tables in the save that nothing writes. A collection only bootstrap fills
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
  // Merge rather than overwrite: tools/dials.mjs owns a key in this file and
  // has to run the game to work it out, so blessing from here must leave it be.
  const held = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, 'utf8')).counts : {};
  const note = 'Set by tools/wired.mjs --bless, except "Dials nothing moves", which is '
    + 'tools/dials.mjs --bless. These may fall. They may not rise.';
  writeFileSync(BASELINE, `${JSON.stringify({ note, counts: { ...held, ...counts } }, null, 2)}\n`);
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
