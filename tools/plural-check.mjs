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

/** Nouns that need a singular form when the count is one. */
const COUNTABLE = [
  'thing', 'item', 'day', 'time', 'piece', 'minute', 'hour', 'week', 'month', 'year',
  'night', 'seat', 'guest', 'copy|copies', 'person|people', 'room', 'car', 'offer',
  'note', 'shot', 'take', 'credit', 'episode', 'film', 'role', 'point', 'step',
];

/**
 * Phrases that cannot print "1 things", with the reason each is allowed.
 *
 * Keyed by file and by a fragment of the line itself rather than by line
 * number, so ordinary edits above it do not re-open a question somebody has
 * already answered — while moving or rewriting the phrase itself does.
 */
// The allowances for files the revamp deleted (the flight, relationships,
// travel, media and wardrobe code) and one in src/engine/index.ts that no line
// matched any more were dropped: an allowance with nothing to allow is a word
// nothing reads.
const ALLOWED = {
  // Figures printed to a decimal place read correctly at one: "1.0 hours".
  'src/engine/systems/life.ts': ['hours.toFixed(1)', 'available.toFixed(1)'],
  // Populations, printed with thousands separators.
  'src/ui/creation/LocationPicker.tsx': ['c.population.toLocaleString'],
  'src/ui/screens/Home.tsx': ['place.countryPopulation.toLocaleString', 'formatPeople(place.cityPopulation)'],
  // Populations again, in the looks. Measured rather than assumed: of 1,379
  // cities the smallest non-zero is 2 and of 252 countries it is 30, so no
  // row in the gazetteer can print "1 people". Two cities and four countries
  // sit at 0, which agrees with a plural anyway.
  'src/ui/looks/place.tsx': ['${people} people', 'formatPeople('],
  // An ordinal before "year": "your first year", not a count of years.
  'src/ui/looks/school.tsx': ["?.toLowerCase() ?? 'last'} year", '.toLowerCase()} year', '${YEAR_WORD[c.year]} year'],
};

/** Whether this exact line has already been decided about. */
function allowed(file, line) {
  return (ALLOWED[file] ?? []).some((fragment) => line.includes(fragment));
}

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
    // Forward slashes, always. ALLOWED is keyed by them, and `join` would hand
    // back backslashes on Windows.
    const path = `${dir}/${entry}`;
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
    if (allowed(file, line)) return;
    findings.push({ at: `${file}:${i + 1}`, text: line.trim().slice(0, 120), matched: match[0] });
  });
}

for (const f of findings) console.log(`${f.at}\n  ${f.text}\n`);
console.log(`${findings.length} counts printed in front of a plural noun without agreeing with it.`);
if (findings.length > 0) {
  console.log('Use plural(n, \'thing\') from src/engine/core/text.ts, or add the line to ALLOWED with a reason.');
  process.exit(1);
}
