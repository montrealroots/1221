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

const files = readdirSync(DOCS).filter((f) => f.endsWith('.md')).sort();
const missing = [];
let checked = 0;

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
  }
}

console.log(`${checked} files named across ${files.length} docs.`);
if (missing.length === 0) {
  console.log('Every one of them is there.');
} else {
  console.log(`${missing.length} of them are not:`);
  for (const one of missing) console.log(`  ${one.doc}:${one.line}  ${one.named}`);
  console.log('\nA doc that names a check has to be a doc you can trust. Fix the entry or write the file.');
  if (CHECK) process.exit(1);
}
