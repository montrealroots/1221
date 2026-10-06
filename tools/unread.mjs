/**
 * Finds what the engine keeps and nothing reads (from 2026-10-06): each
 * property declared on an interface under src/engine, and whether anything in
 * src reads it, as `.name` not being assigned, or by name in a destructuring,
 * an `in` check or a computed key.
 *
 * A property only ever written is a declared word nothing reads: THE ONE RULE.
 * The read is found by name across the whole source, so a name shared with a
 * read property elsewhere hides it; the report undercounts, never overcounts,
 * except where a read hides behind a dynamic key (`x[k]`), which is listed so
 * it can be looked at.
 *
 *   node tools/unread.mjs           report
 */
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const files = execSync('git ls-files --cached --others --exclude-standard "src/**/*.ts" "src/**/*.tsx" "tools/*.mjs" "base44/**/*.js"', { encoding: 'utf8' }).split('\n').filter(Boolean);
const src = new Map(files.map((f) => [f, readFileSync(f, 'utf8')]));

// Declared properties: inside `interface X {` blocks of engine files.
const declared = new Map(); // name -> [{ file, iface, line }]
for (const [f, s] of src) {
  if (!f.startsWith('src/engine/')) continue;
  const lines = s.split('\n');
  let iface = null;
  let depth = 0;
  lines.forEach((l, i) => {
    const m = l.match(/^\s*(?:export\s+)?interface\s+(\w+)/);
    if (m && depth === 0) { iface = m[1]; }
    if (iface) {
      if (depth === 1) {
        const p = l.match(/^\s{2}(?:readonly\s+)?(\w+)\??:/);
        if (p) (declared.get(p[1]) ?? declared.set(p[1], []).get(p[1])).push({ file: f, iface, line: i + 1 });
      }
      depth += (l.match(/{/g) ?? []).length - (l.match(/}/g) ?? []).length;
      if (depth <= 0) { iface = null; depth = 0; }
    }
  });
}

const all = [...src.values()].join('\n');
// The source without the lines that declare or set a property by name, where a destructured read is looked for.
const bare = all.replace(/^\s{2,}(?:readonly\s+)?\w+\??:.*$/gm, '');
const unread = [];
for (const [name, where] of declared) {
  const esc = name.replace(/\$/g, '\\$');
  // A read: `.name` not followed by an assignment, or `name` in a destructuring, a shorthand or an `in` test.
  const dot = new RegExp(`\\.${esc}\\b(?!\\s*(?:=(?!=)|\\?\\?=|\\+=|-=|\\*=|\\|\\|=|&&=))`, 'g');
  // A getter's `(x.name ??= ...)` returns what it holds: a read.
  let getters = 0;
  for (const m of all.matchAll(new RegExp(`\\.${esc}\\s*\\?\\?=`, 'g'))) {
    const before = all.slice(Math.max(0, m.index - 80), m.index).replace(/[\w.!?]*$/, '');
    if (/(?:\(|=>|return)\s*$/.test(before)) getters += 1;
  }
  const reads = (all.match(dot) ?? []).length + getters;
  const destructured = new RegExp(`[{,]\\s*${esc}\\s*(?:[,}:=]|$)`, 'm').test(bare);
  const keyed = new RegExp(`['"\`]${esc}['"\`]`).test(all);
  if (reads === 0 && !destructured) unread.push({ name, where, keyed });
}
unread.sort((a, b) => a.where[0].file.localeCompare(b.where[0].file) || a.name.localeCompare(b.name));
for (const u of unread) console.log(`${u.where.map((w) => `${w.file}:${w.line} ${w.iface}`).join(', ')}  ${u.name}${u.keyed ? '  (named in a string: may be read by key)' : ''}`);
console.log(`\n${unread.length} declared properties nothing reads, of ${declared.size}.`);
