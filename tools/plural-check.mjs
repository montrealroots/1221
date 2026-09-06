/**
 * Finds every place the game can print "1 things".
 *
 * A count interpolated straight in front of a plural noun reads correctly
 * almost always and then, on the one occasion the count is one, reads like a
 * bug — because it is one. The fix is `plural(n, 'thing')` from core/text,
 * which agrees with itself.
 *
 * This reports rather than rewrites, because not every such phrase can be
 * one: a fixed constant of thirty minutes never is, a figure printed to one
 * decimal place is "1.0 hours" and correct, and a population is never a
 * single person. Those are listed below with the reason, so the allowance is
 * a decision somebody made rather than a hole the checker happens to have.
 *
 * Run: node tools/plural-check.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** Nouns that need a singular form when the count is one. */
const COUNTABLE = [
  'thing', 'item', 'day', 'time', 'piece', 'minute', 'hour', 'week', 'month', 'year',
  'night', 'seat', 'guest', 'copy|copies', 'person|people', 'room', 'car', 'offer',
  'note', 'shot', 'take', 'credit', 'episode', 'film', 'role', 'point', 'step',
];

/**
 * Expressions that cannot be one, with the reason each is allowed.
 *
 * Keyed by `file:line`, so moving the code re-opens the question rather than
 * carrying the exemption along with it silently.
 */
const ALLOWED = new Map(Object.entries({
  // Figures printed to a decimal place read correctly at one: "1.0 hours".
  'src/engine/scenes/flight.ts:138': 'One decimal place, so "1.0 hours" is right.',
  'src/engine/systems/life.ts:208': 'One decimal place.',
  'src/engine/systems/life.ts:656': 'One decimal place.',
  'src/engine/systems/relationships.ts:335': 'One decimal place.',
  // Populations, printed with thousands separators. Never one person.
  'src/ui/workspaces/TravelWorkspace.tsx:132': 'A city population.',
  'src/ui/creation/LocationPicker.tsx:216': 'A city population.',
  'src/ui/creation/LocationPicker.tsx:221': 'A city population.',
  'src/ui/screens/Home.tsx:295': 'A country population.',
  'src/ui/screens/Home.tsx:405': 'A city population.',
  'src/engine/index.ts:591': 'A world population.',
  'src/engine/systems/media.ts:520': 'An impression count, in the thousands.',
  // "A cocktail thing", "a summer thing" — a noun, not a count of things.
  'src/engine/systems/wardrobe.ts:255': 'A kind of occasion, not a count.',
  'src/engine/systems/wardrobe.ts:275': 'A kind of season, not a count.',
}));

const ROOT = 'src';
/**
 * A count, then a noun, then anything that is not the agreement idiom.
 *
 * `${n} day${n === 1 ? '' : 's'}` is already right, and there is no reason to
 * nag about it, so a `${` immediately after the noun means the line has
 * already thought about this.
 */
const PATTERN = new RegExp(String.raw`\$\{[^}]{1,80}\}\s*(?:${COUNTABLE.join('|')})\b(?!\$\{)`, 'gi');

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) out.push(...walk(path));
    else if (/\.(ts|tsx)$/.test(path)) out.push(path);
  }
  return out;
}

const findings = [];
for (const file of walk(ROOT)) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    // A plural() call is the fix, not the problem.
    if (/\bplural\(/.test(line)) return;
    const match = line.match(PATTERN);
    if (!match) return;
    const at = `${file}:${i + 1}`;
    if (ALLOWED.has(at)) return;
    findings.push({ at, text: line.trim().slice(0, 120), matched: match[0] });
  });
}

for (const f of findings) console.log(`${f.at}\n  ${f.text}\n`);
console.log(`${findings.length} counts printed in front of a plural noun without agreeing with it.`);
if (findings.length > 0) {
  console.log('Use plural(n, \'thing\') from src/engine/core/text.ts, or add the line to ALLOWED with a reason.');
  process.exit(1);
}
