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
 * Run with: node tools/title-case.mjs [--write | --check]
 *
 * `--check` reports and exits non-zero, which is how the gate runs it. It was
 * not in the gate for a long time, and "Delete slot 1" sat in a button.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const WRITE = process.argv.includes('--write');
/** In --check the tool reports and fails rather than rewriting, for the gate. */
const CHECK = process.argv.includes('--check');

/**
 * Capitalises one word.
 *
 * Left alone: anything with no lowercase at all (USA, 3D, £), and anything
 * already carrying a capital past the first letter (McKinsey, iPhone, P&L),
 * because those are spelled the way they are on purpose.
 */
function capitaliseWord(word) {
  if (!/[a-z]/.test(word)) return word;
  // An HTML entity is markup, not a word: '&amp;' is an ampersand.
  if (/^&[a-z]+;$/i.test(word)) return word;
  // Leading brackets and quotes are skipped; a leading digit is not. '97th' is
  // an ordinal, and '97Th' is nothing at all.
  const first = word.search(/[A-Za-z0-9]/);
  if (first < 0) return word;
  const lead = word[first];
  if (lead >= '0' && lead <= '9') return word;
  if (/[A-Z]/.test(word.slice(first + 1))) return word;
  return word.slice(0, first) + lead.toUpperCase() + word.slice(first + 1);
}

/** Title-cases a run of plain text, leaving interpolations and markup alone. */
export function titleCase(text) {
  return text.replace(/\S+/g, (token) => (
    token.includes('${') || token.includes('{') ? token : capitaliseWord(token)
  ));
}

/**
 * Whether a string is prose rather than a label.
 *
 * A full stop or an exclamation mark ends a sentence. A question mark does
 * not settle it either way: the style guide's own example of the rule is
 * "Why Did This Happen?", and "Delete Slot 1?" is a heading, not prose. Length
 * is what separates the two, and the word count below does that.
 */
function isProse(value) {
  if (/[.!]\s*$/.test(value.trim())) return true;          // ends like a sentence
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
  // `placeholder` is absent too — a placeholder is a hint, and hints are prose.
  after = after.replace(
    /(?<![-\w])(title|label)=(")([^"\n]*)\2/g,
    (whole, key, quote, value) => rewrite(whole, `${key}=${quote}`, value, quote),
  );

  // Headings and buttons written as literal JSX text.
  //
  // Matched from the closing tag backwards rather than from the opening one.
  // An opening tag carries handlers — onClick={() => run(...)} — and an arrow
  // function has a '>' in it, so anything that tries to read the open tag with
  // a regex stops in the middle of it and misses the label entirely. That is
  // most of the buttons in the game, because the formatter wraps them.
  //
  // An interpolation is allowed inside the text. "Delete Slot {slot}" is a
  // label with a number in it, and refusing anything containing a brace is
  // how "Delete slot {confirmDelete}" sat in a button for as long as it did.
  // `titleCase` leaves the interpolation itself alone. Angle brackets are
  // still refused, which is what keeps this from matching across markup.
  after = after.replace(
    />(\s*)([A-Za-z][^<>]*?)(\s*)<\/(h1|h2|h3|h4|h5|h6|label|button|summary|th|legend|dt)>/g,
    (whole, lead, text, trail, tag) => {
      if (/\n/.test(text) || isProse(text)) return whole;
      const next = titleCase(text);
      if (next === text) return whole;
      changedStrings++;
      if (samples.length < 25) samples.push(`${text}  ->  ${next}`);
      return `>${lead}${next}${trail}</${tag}>`;
    },
  );

  if (after !== before) {
    changedFiles++;
    if (WRITE) writeFileSync(file, after);
  }
}

console.log(`${changedStrings} strings in ${changedFiles} files${WRITE ? ' rewritten' : ' would change'}`);
if (samples.length > 0) {
  console.log('\nsample:');
  for (const s of samples) console.log('  ' + s);
}
if (CHECK && changedStrings > 0) {
  console.error('\nEvery label, heading and button is Title Case. Run: node tools/title-case.mjs --write');
  process.exit(1);
}
