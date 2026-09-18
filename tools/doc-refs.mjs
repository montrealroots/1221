/**
 * SLATE — every file a doc names has to be there.
 *
 * The docs carry a list of what holds the line: which tool checks what, which
 * test covers what. That list is only worth anything if it is true. Three of
 * the entries in STYLE.md named tools that had been deleted, and one of them
 * described a browser walk through a phone and a gym scene that no longer
 * exist, so the section read as a guarantee and was partly fiction.
 *
 * This walks the docs, pulls out every path that looks like a file in this
 * repository, and checks it. `--check` fails the gate.
 *
 * It deliberately only looks at paths under a directory the repo actually has
 * at its root. A doc is free to mention `node_modules/x` or a path in some
 * other project without being held to it.
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const CHECK = process.argv.includes('--check');
const DOCS = 'docs';

/** Root directories a named path is expected to resolve inside. */
const OURS = new Set(['src', 'tools', 'tests', 'docs', 'base44', 'public', 'scripts']);

/**
 * Paths as they appear in prose: inside backticks, sometimes with a trailing
 * flag (`tools/inventory.mjs --check`) and sometimes possessive or followed by
 * a comma, so the match stops at the extension.
 */
const PATH = /`([A-Za-z0-9_.\-/]+\.(?:ts|tsx|mjs|js|json|md|css))`/g;

/**
 * The same thing with a line on it: `world/audition.ts:864`, or a range.
 *
 * Checked because the docs cite lines to say *where* a claim lives, and this
 * tool matched the path and stopped — so a doc could point at line 864 of a
 * file that had been cut to four hundred and pass the gate every time. That is
 * the failure mode the whole file exists to prevent, one level down.
 *
 * What is checkable is that the line is there. Whether it still says what the
 * doc thinks it says is not something a script can know, and pretending
 * otherwise would be a check that reads as a guarantee — which is the exact
 * sentence at the top of this file.
 */
const PATH_WITH_LINE = /`([A-Za-z0-9_.\-/]+\.(?:ts|tsx|mjs|js)):(\d+)(?:-(\d+))?`/g;

/** Every file under a root we own, by basename, for the bare citations. */
function byBasename() {
  const found = new Map();
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else {
        const seen = found.get(entry.name);
        // Ambiguous basenames are dropped rather than guessed at.
        found.set(entry.name, seen === undefined ? path : null);
      }
    }
  };
  for (const root of OURS) if (existsSync(root)) walk(root);
  return found;
}

const BASENAMES = byBasename();

/** Where a citation points, or nothing when it cannot be resolved honestly. */
function resolve(named) {
  if (OURS.has(named.split('/')[0])) {
    return existsSync(named) && statSync(named).isFile() ? named : undefined;
  }
  // `business.tsx:554` — bare, and worth checking when exactly one file in the
  // tree carries that name. Two would be a guess.
  const hit = BASENAMES.get(named.split('/').pop());
  return hit ?? undefined;
}

const files = readdirSync(DOCS).filter((f) => f.endsWith('.md')).sort();
const missing = [];
const past = [];
let checked = 0;
let lineChecked = 0;

for (const file of files) {
  const path = join(DOCS, file);
  const lines = readFileSync(path, 'utf8').split('\n');
  for (const [index, line] of lines.entries()) {
    PATH.lastIndex = 0;
    let m;
    while ((m = PATH.exec(line)) !== null) {
      const named = m[1];
      const root = named.split('/')[0];
      if (!OURS.has(root)) continue;
      checked += 1;
      if (existsSync(named) && statSync(named).isFile()) continue;
      missing.push({ doc: path, line: index + 1, named });
    }

    PATH_WITH_LINE.lastIndex = 0;
    while ((m = PATH_WITH_LINE.exec(line)) !== null) {
      const [, named, from, to] = m;
      const at = resolve(named);
      if (at === undefined) continue;
      lineChecked += 1;
      const held = readFileSync(at, 'utf8').split('\n').length;
      const wanted = Number(to ?? from);
      if (wanted > held) {
        past.push({ doc: path, line: index + 1, named, wanted, held, at });
      }
    }
  }
}

console.log(`${checked} files named across ${files.length} docs, and ${lineChecked} of them with a line on it.`);
if (missing.length === 0) {
  console.log('Every one of them is there.');
} else {
  console.log(`${missing.length} of them are not:`);
  for (const one of missing) console.log(`  ${one.doc}:${one.line}  ${one.named}`);
}

if (past.length > 0) {
  console.log(`\n${past.length} point past the end of the file they name:`);
  for (const one of past) {
    console.log(`  ${one.doc}:${one.line}  ${one.named}:${one.wanted} — ${one.at} has ${one.held} lines`);
  }
  console.log('\nA line reference that has fallen off the end is a doc describing a file that no longer says that.');
}

if (missing.length > 0 || past.length > 0) {
  console.log('\nA doc that names a check has to be a doc you can trust. Fix the entry or write the file.');
  if (CHECK) process.exit(1);
}
