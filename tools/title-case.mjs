/**
 * Puts every label, heading, button and title in the game into Title Case.
 *
 * The rule is the one that was asked for: every word starts with a capital.
 * Not the typographic convention where small words stay lowercase — "Skip To
 * Event", not "Skip to Event".
 *
 * What it deliberately does not touch:
 *  - Prose. A sentence is a sentence; `body`, `detail`, `description`, `note`
 *    and `summary` stay in sentence case with their punctuation intact.
 *  - Anything ending in . ? or ! even at a title site, because that is a
 *    sentence somebody put in a title field.
 *  - Words that already carry internal capitals — LA, VFX, P&L, McKinsey — and
 *    anything inside a ${...} interpolation, which is code.
 *
 * Run with: node tools/title-case.mjs [--write]
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const WRITE = process.argv.includes('--write');

/**
 * Capitalises one word.
 *
 * Left alone: anything with no lowercase at all (USA, 3D, £), and anything
 * already carrying a capital past the first letter (McKinsey, iPhone, P&L),
 * because those are spelled the way they are on purpose.
 */
function capitaliseWord(word) {
  if (!/[a-z]/.test(word)) return word;
  const firstLetter = word.search(/[A-Za-z]/);
  if (firstLetter < 0) return word;
  if (/[A-Z]/.test(word.slice(firstLetter + 1))) return word;
  return word.slice(0, firstLetter)
    + word[firstLetter].toUpperCase()
    + word.slice(firstLetter + 1);
}

/** Title-cases a run of plain text, leaving interpolations and markup alone. */
export function titleCase(text) {
  return text.replace(/\S+/g, (token) => (
    token.includes('${') || token.includes('{') ? token : capitaliseWord(token)
  ));
}

/** Whether a string is prose rather than a label. */
function isProse(value) {
  if (/[.?!]\s*$/.test(value.trim())) return true;         // ends like a sentence
  if (value.trim().split(/\s+/).length > 9) return true;    // too long to be a label
  return false;
}

const files = execSync('git ls-files "src/**/*.ts" "src/**/*.tsx"', { encoding: 'utf8' })
  .split('\n').filter(Boolean)
  .filter((f) => !f.endsWith('world-data.ts'));

let changedFiles = 0;
let changedStrings = 0;
const samples = [];

for (const file of files) {
  const before = readFileSync(file, 'utf8');
  let after = before;

  /** Rewrites the value of a matched string literal, if it is a label. */
  const rewrite = (whole, open, value, close) => {
    if (!value || isProse(value)) return whole;
    const next = titleCase(value);
    if (next === value) return whole;
    changedStrings++;
    if (samples.length < 25) samples.push(`${value}  ->  ${next}`);
    return open + next + close;
  };

  // Object properties that name a thing rather than describe it.
  after = after.replace(
    /\b(label|title|heading|actionLabel|buttonLabel|cta|tab|shortLabel):\s*(['"])([^'"\n]*)\2/g,
    (whole, key, quote, value) => rewrite(whole, `${key}: ${quote}`, value, quote),
  );

  // JSX string attributes that render as visible text. `aria-label` is
  // deliberately absent: it is spoken, not shown, and a screen reader reading
  // "Help For This Screen" is worse than one reading it as a sentence.
  after = after.replace(
    /\b(title|label|placeholder)=(")([^"\n]*)\2/g,
    (whole, key, quote, value) => rewrite(whole, `${key}=${quote}`, value, quote),
  );

  // Headings and buttons written as literal JSX text.
  after = after.replace(
    /(<(h1|h2|h3|h4|button|summary)(?:\s[^>]*)?>)([A-Za-z][^<>{}\n]*?)(<\/\2>)/g,
    (whole, open, _tag, text, close) => {
      if (isProse(text)) return whole;
      const next = titleCase(text);
      if (next === text) return whole;
      changedStrings++;
      if (samples.length < 25) samples.push(`${text}  ->  ${next}`);
      return open + next + close;
    },
  );

  if (after !== before) {
    changedFiles++;
    if (WRITE) writeFileSync(file, after);
  }
}

console.log(`${changedStrings} strings in ${changedFiles} files${WRITE ? ' rewritten' : ' would change'}`);
console.log('\nsample:');
for (const s of samples) console.log('  ' + s);
