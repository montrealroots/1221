#!/usr/bin/env node
/**
 * SLATE — neither word stands in for the other.
 *
 * The premise is that this is an actor and actress life simulator and that it
 * holds the two titles as equals. `src/engine/core/performer.ts` says how:
 * "every label about that person uses their word. Every list that would
 * otherwise pile them together is split."
 *
 * The save has been checked for that since the premise was made first-class.
 * The prose had not been, and prose is where it actually slipped: a doc comment
 * about what "an actor" handles, a refusal about casting "an American actor", a
 * shoot day lost to "a sick actor". Every one of those quietly elects one of
 * the two words as the one the other varies from, which is the thing the
 * premise exists to refuse.
 *
 * So this walks the prose and fails on a bare `actor` or `actress` standing in
 * for anybody who performs. What is allowed is written below and nothing else
 * is: the pair said together, an identifier, a real name, or a label that
 * carries both words through `nameByTitle`.
 *
 * The house word for the generic is `performer`, which is what the casting
 * files already use.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const WRITE = process.argv.includes('--write');

/** Where the game writes its own words. Research files are quoted sources. */
const ROOTS = ['src', 'base44'];
const DOCS = ['docs/DEPTH.md', 'docs/COVERAGE-MATRIX.md', 'docs/STYLE.md', 'docs/DRILL-DOWN.md', 'docs/BASE44.md'];

/**
 * The pair, said together, in any of the ways the house says it.
 *
 * Checked against the whole line rather than against the word, because "an
 * actor or an actress" puts six characters between the two halves and a window
 * that tight would refuse the house's own sentence.
 */
const TOGETHER = /\bactor(?:s|’s|'s)?\b[^.;!?]{0,60}\bactress(?:es|’s|'s)?\b|\bactress(?:es|’s|'s)?\b[^.;!?]{0,60}\bactor(?:s|’s|'s)?\b|actor[-/]actress|actress[-/]actor/i;

/**
 * Real names and set terms, which are what they are called.
 *
 * A union is not renamed for a style guide, and neither is a trade term that
 * the business itself inflects — those carry both words through `nameByTitle`
 * instead, which is the mechanism this file exists to push work toward.
 */
const NAMES = [
  'Actors Access', 'Actors’ Equity', "Actors' Equity", 'Screen Actors Guild',
  'Félag íslenskra leikara', 'Actors Fund',
];

/** An identifier, a key, or a quoted value. Code is not prose. */
const IDENTIFIER = /[A-Za-z0-9_$]actor|actor[A-Za-z0-9_$]|[A-Za-z0-9_$]actress|actress[A-Za-z0-9_$]|['"`]actors?['"`]|['"`]actress(?:es)?['"`]|\bactors?\s*:|\bactress(?:es)?\s*:|nameByTitle/i;

/**
 * The line is about the word rather than using it.
 *
 * A comment explaining why nobody calls a key grip an actress has to say
 * "actress", and rewriting it to say "performer" would delete the sentence's
 * subject. Rare enough to be marked by hand and rare enough that the marker
 * being visible in the source is the point.
 */
const ABOUT_THE_WORD = /both-titles: the word itself/;

const WORD = /\bactor(?:s|’s|'s)?\b|\bactress(?:es|’s|'s)?\b/i;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name.startsWith('.')) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(ts|tsx|js|mjs|md)$/.test(name)) out.push(path);
  }
  return out;
}

const files = [
  ...ROOTS.flatMap((r) => { try { return walk(join(ROOT, r)); } catch { return []; } }),
  ...DOCS.map((d) => join(ROOT, d)),
];

const found = [];
for (const path of files) {
  let text;
  try { text = readFileSync(path, 'utf8'); } catch { continue; }
  const lines = text.split('\n');
  for (const [i, line] of lines.entries()) {
    if (!WORD.test(line)) continue;
    // Prose wraps, and "an actor or an actress" is routinely split across two
    // lines. Read a window rather than a line, or the check fails the house's
    // own sentence more often than it catches anything.
    const around = [lines[i - 1] ?? '', line, lines[i + 1] ?? ''].join(' ');
    if (TOGETHER.test(around)) continue;
    if (IDENTIFIER.test(line)) continue;
    // The marker covers the comment block it sits in rather than one line,
    // because the sentence that needs it is rarely the last one in the block.
    if (ABOUT_THE_WORD.test(lines.slice(Math.max(0, i - 4), i + 5).join(' '))) continue;
    if (NAMES.some((n) => line.includes(n))) continue;
    found.push({ path: relative(ROOT, path), line: i + 1, text: line.trim().slice(0, 118) });
  }
}

if (found.length === 0) {
  console.log('Neither word stands in for the other.');
  process.exit(0);
}

console.log(`${found.length} place${found.length === 1 ? '' : 's'} where one of the two titles is standing in for both.`);
console.log('The generic is "performer". Say the pair, or say performer, or carry both through nameByTitle.\n');
for (const one of found) console.log(`  ${one.path}:${one.line}  ${one.text}`);
process.exit(WRITE ? 0 : 1);
