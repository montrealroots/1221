/**
 * Brief 15, money-data: builds examples.json from the batches' change records, verbatim, so no example is typed by
 * hand. PICKS names each pair: the change file, the export, the key and the field, the kind of text, why it changed,
 * whether the change touches meaning, and how the new words were read.
 *
 *   node examples.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { PICKS } from './examples-picks.mjs';

const out = [];
for (const p of PICKS) {
  if (p.before !== undefined) { out.push({ source: p.source, kind: p.kind, before: p.before, after: p.after, why: p.why, meaningSensitive: p.meaningSensitive, verified: p.verified }); continue; }
  const list = JSON.parse(readFileSync(p.file, 'utf8'));
  const c = list.find((x) => x.export === p.export && x.key === p.key && x.field === p.field);
  if (!c) throw new Error(`no change ${p.export}.${p.key}.${p.field} in ${p.file}`);
  out.push({ source: `${p.sourceFile}#${p.export} (${p.key}.${p.field})`, kind: p.kind, before: c.before, after: c.after, why: p.why, meaningSensitive: p.meaningSensitive, verified: p.verified });
}
writeFileSync('examples.json', JSON.stringify(out, null, 1) + '\n');
console.log(`${out.length} examples`);
