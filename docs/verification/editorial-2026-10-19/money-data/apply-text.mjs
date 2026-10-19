/**
 * Brief 15, money-data: applies text edits to the hand-kept content files (`banks-thirteen.ts`, `banks-lending.ts`, …),
 * each an exact old text that must occur exactly once in its file, or already be the new text, and writes each change to
 * a changes file for the batch's record and examples.
 *
 *   node apply-text.mjs <edits module> <changes out.json>
 *
 * The edits module's default export is `[{ file, key, old, new }]`: `key` names the entry for the record (a bank's id, a
 * field), and isn't read.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const [editsPath, out] = process.argv.slice(2);
const edits = (await import(pathToFileURL(resolve(editsPath)).href)).default;
const files = new Map();
const read = (f) => { if (!files.has(f)) files.set(f, readFileSync(f, 'utf8')); return files.get(f); };
const prior = (() => { try { return JSON.parse(readFileSync(out, 'utf8')); } catch { return []; } })();
let failed = false;
let changed = 0;
for (const e of edits) {
  const text = read(e.file);
  const n = text.split(e.old).length - 1;
  if (n === 1) {
    files.set(e.file, text.replace(e.old, () => e.new));
    changed += 1;
    const was = prior.find((p) => p.file === e.file && p.key === e.key);
    if (was) was.after = e.new; else prior.push({ file: e.file, key: e.key, before: e.old, after: e.new });
  } else if (!(n === 0 && text.includes(e.new))) { console.error(`${e.file} ${e.key}: the old text is there ${n} times, not once`); failed = true; }
}
if (failed) process.exit(2);
for (const [f, t] of files) writeFileSync(f, t);
writeFileSync(out, JSON.stringify(prior, null, 1) + '\n');
console.log(`${changed} edits applied`);
