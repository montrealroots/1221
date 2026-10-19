/**
 * Brief 15, money-data: rewrites fields of a probe-generated content file (`content/security.ts`, `accountlife.ts`,
 * `pending.ts`, `cash.ts`), whose data is `JSON.parse` of its generator's output, in the generator's own form
 * (`JSON.stringify(JSON.stringify(data))` inside `JSON.parse`), as `tools/research-dates.mjs --write` does.
 *
 *   node apply-gen.mjs <content file> <edits module> <changes out.json>
 *
 * The edits module's default export is `{ EXPORT: { key: { field: 'new words' } } }`. Every field named must exist and
 * hold a string: an edit to a field that isn't there is refused, so a typo can't add a field. Each change is written to
 * the changes file with its before and after, for the batch's record and examples. A second run with the same edits
 * changes nothing.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const [file, editsPath, out] = process.argv.slice(2);
const edits = (await import(pathToFileURL(resolve(editsPath)).href)).default;
let source = readFileSync(file, 'utf8');
const found = [...source.matchAll(/export const (\w+)\b[^=]*= JSON\.parse\(("(?:[^"\\]|\\.)*")\);/g)].map((m) => {
  const at = m.index + m[0].indexOf('JSON.parse(') + 'JSON.parse('.length;
  return { name: m[1], start: at, end: at + m[2].length, data: JSON.parse(JSON.parse(m[2])), literal: m[2] };
});
const changes = [];
let failed = false;
for (const one of found.reverse()) {
  const mine = edits[one.name];
  if (!mine) continue;
  if (JSON.stringify(JSON.stringify(one.data)) !== one.literal) { console.error(`${one.name}: not in the generator's form`); failed = true; continue; }
  for (const [key, fields] of Object.entries(mine)) {
    for (const [field, after] of Object.entries(fields)) {
      const holder = one.data[key];
      if (!holder || typeof holder[field] !== 'string') { console.error(`${one.name}.${key}.${field}: no such string field`); failed = true; continue; }
      if (holder[field] !== after) { changes.push({ export: one.name, key, field, before: holder[field], after }); holder[field] = after; }
    }
  }
  source = source.slice(0, one.start) + JSON.stringify(JSON.stringify(one.data)) + source.slice(one.end);
}
if (failed) process.exit(2);
writeFileSync(file, source);
const prior = (() => { try { return JSON.parse(readFileSync(out, 'utf8')); } catch { return []; } })();
// Keep the first before of a field changed twice, so the record is always against the baseline.
for (const c of changes) {
  const was = prior.find((p) => p.export === c.export && p.key === c.key && p.field === c.field);
  if (was) was.after = c.after; else prior.push(c);
}
writeFileSync(out, JSON.stringify(prior, null, 1) + '\n');
console.log(`${changes.length} fields changed in ${file}`);
