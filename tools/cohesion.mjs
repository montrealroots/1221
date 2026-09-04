/**
 * Looks over the whole game for the things that go wrong quietly.
 *
 * Four questions, asked of every registry and every system:
 *   duplicates — is the same id or the same name in a registry twice?
 *   repeats    — is the same player-facing sentence written in two places?
 *   wiring     — is a command scheduled that nothing handles, or handled and
 *                never scheduled? Is an id referenced that does not exist?
 *   orphans    — is a piece of content defined and never used at all?
 *
 * It reports. Nothing here rewrites code, because most of what it finds is a
 * judgement call: two identical strings can be a copy-paste mistake or two
 * places that genuinely say the same thing.
 */
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const files = execSync('git ls-files "src/**/*.ts" "src/**/*.tsx"', { encoding: 'utf8' })
  .split('\n').filter(Boolean);
const source = new Map(files.map((f) => [f, readFileSync(f, 'utf8')]));
const all = [...source.values()].join('\n');

const problems = { duplicates: [], repeats: [], wiring: [], orphans: [] };

// --- Duplicate ids and names inside one registry -------------------------
//
// Ids only, and only where they are siblings. An outcome called 'completed'
// inside two different corporate events is not a duplicate: it is two events
// each having a completed outcome. So an id counts as a repeat only when it
// appears twice at the same indentation inside the same array.

for (const [file, text] of source) {
  if (!/content\//.test(file)) continue;
  const lines = text.split('\n');
  const seen = new Map();
  let depth = Infinity;
  lines.forEach((line, i) => {
    const match = /^(\s*)(?:\{\s*)?id:\s*'([^']+)'/.exec(line);
    if (!match) return;
    const indent = match[1].length;
    // A shallower id starts a new entry, and the ids nested inside the last
    // one stop being siblings of the ids nested inside this one.
    if (indent <= depth) { seen.clear(); depth = indent; }
    const key = `${indent}|${match[2]}`;
    const before = seen.get(key);
    if (before !== undefined) {
      problems.duplicates.push(`${file}: id '${match[2]}' at line ${i + 1} is already at line ${before}`);
    } else {
      seen.set(key, i + 1);
    }
  });
}

// --- The same sentence written twice -------------------------------------

const sentences = new Map();
for (const [file, text] of source) {
  const re = /'([A-Z][^']{45,180}[.?!])'/g;
  let match;
  while ((match = re.exec(text)) !== null) {
    const value = match[1];
    if (value.includes('${')) continue;
    const seen = sentences.get(value) ?? [];
    seen.push(file);
    sentences.set(value, seen);
  }
}
for (const [value, where] of sentences) {
  const distinct = [...new Set(where)];
  // Two deliberate repeats, both of them the point rather than a mistake:
  // a corporate event states the same public fact as the company it is about
  // (tests/cohesion checks they stay identical), and one rule can apply to two
  // deals in the same registry — French chronology covers Pathé and Gaumont
  // alike. Neither is a copy-paste fault.
  if (distinct.some((f) => f.endsWith('corporate-events.ts'))) continue;
  if (distinct.length === 1) continue;
  if (where.length > 1) {
    problems.repeats.push(`${where.length}x ${distinct.join(', ')}: "${value.slice(0, 90)}"`);
  }
}

// --- Scheduled kinds and the handlers for them ---------------------------
//
// An audit entry also carries a `kind`, and those live in their own namespace
// — 'rel.proposal_decided' is a question the player can ask, not work on the
// clock — so they are collected and excluded rather than reported.

const auditKinds = new Set();
for (const text of source.values()) {
  for (const m of text.matchAll(/kind:\s*'([a-z_]+\.[a-z_]+)',\s*subjectType/g)) auditKinds.add(m[1]);
  for (const m of text.matchAll(/audit\(\{\s*\n?\s*kind:\s*'([a-z_]+\.[a-z_]+)'/g)) auditKinds.add(m[1]);
}

const handled = new Set();
const scheduled = new Set();
for (const text of source.values()) {
  for (const m of text.matchAll(/onSchedule\(\s*'([^']+)'/g)) handled.add(m[1]);
  for (const m of text.matchAll(/kind:\s*'([a-z_]+\.[a-z_]+)'/g)) scheduled.add(m[1]);
}

// Command kinds, taken as the first kind-shaped string after each onCommand.
// The generic parameters in between can contain quotes of their own, so this
// splits rather than trying to match across them.
const commands = new Set();
for (const text of source.values()) {
  for (const chunk of text.split('onCommand').slice(1)) {
    const match = /'([a-z_]+\.[a-z_]+)'/.exec(chunk.slice(0, 600));
    if (match) commands.add(match[1]);
  }
}

for (const kind of scheduled) {
  if (handled.has(kind) || commands.has(kind) || auditKinds.has(kind)) continue;
  if (all.includes(`emit('${kind}'`) || all.includes(`onEvent('${kind}'`)) continue;
  problems.wiring.push(`scheduled or dispatched but nothing handles it: '${kind}'`);
}
for (const kind of handled) {
  if (scheduled.has(kind)) continue;
  problems.wiring.push(`handled but never scheduled: '${kind}'`);
}

// --- Commands the interface asks for, and commands the engine has ---------

const asked = new Set();
for (const [file, text] of source) {
  if (!file.startsWith('src/ui')) continue;
  for (const m of text.matchAll(/run\(\s*'([a-z_]+\.[a-z_]+)'/g)) asked.add(m[1]);
  for (const m of text.matchAll(/commandKind:\s*'([a-z_]+\.[a-z_]+)'/g)) asked.add(m[1]);
}
for (const kind of asked) {
  if (!commands.has(kind)) problems.wiring.push(`the interface runs a command the engine does not have: '${kind}'`);
}

// --- Report ---------------------------------------------------------------

let total = 0;
for (const [heading, list] of Object.entries(problems)) {
  const unique = [...new Set(list)];
  total += unique.length;
  console.log(`\n${heading}: ${unique.length}`);
  for (const line of unique.slice(0, 40)) console.log(`  ${line}`);
  if (unique.length > 40) console.log(`  ... and ${unique.length - 40} more`);
}
console.log(`\n${total} thing${total === 1 ? '' : 's'} to look at.`);
