#!/usr/bin/env node
/**
 * Connecticut's Schedule of Basic Child Support Obligations (effective 1
 * August 2026), from the Judicial Branch's own PDF: each combined net weekly
 * income's share of it for one to six children. pdftotext reads the table's
 * rows whole: the income, then each number of children's percentage and
 * dollar amount.
 *
 * Usage: node tools/data/ctsupport.mjs  (needs pdftotext, which Git for Windows has)
 * Writes src/engine/content/ctsupport.ts.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL = 'https://www.jud.ct.gov/publications/childsupport/csguidelines.pdf';
const dir = mkdtempSync(join(tmpdir(), 'ct-'));
const pdf = join(dir, 'ct.pdf');
writeFileSync(pdf, Buffer.from(await (await fetch(URL, { headers: { 'User-Agent': 'Mozilla/5.0' } })).arrayBuffer()));
execFileSync('pdftotext', ['-layout', pdf, join(dir, 'ct.txt')]);
const rows = [];
for (const line of readFileSync(join(dir, 'ct.txt'), 'utf8').split(/\r?\n/)) {
  const m = /^\s*(\d{2,4})\s+((?:\d+\.\d+%\s+\d+\s*){6})$/.exec(line);
  if (!m) continue;
  const shares = [...m[2].matchAll(/(\d+\.\d+)%/g)].map((x) => Number((Number(x[1]) / 100).toFixed(4)));
  rows.push([Number(m[1]), ...shares]);
}
rows.sort((a, b) => a[0] - b[0]);
if (rows.length < 500 || rows.at(-1)[0] !== 6000) throw new Error(`Connecticut's schedule read ${rows.length} rows to ${rows.at(-1)?.[0]}`);
console.log(rows.length, 'rows,', rows[0][0], 'to', rows.at(-1)[0]);
writeFileSync('src/engine/content/ctsupport.ts', `/**
 * SLATE — Connecticut's Schedule of Basic Child Support Obligations,
 * effective 1 August 2026: each combined net weekly income's share for one
 * to six children, from the Judicial Branch's PDF (\`tools/data/ctsupport.mjs\`,
 * which writes this file; read ${new Date().toISOString().slice(0, 10)}). Above $6,000 a week, a
 * court decides case by case, and SLATE holds the last row's share.
 */

/** [combined net weekly income, then the share for 1 … 6 children]. */
export const CT_SCHEDULE: readonly (readonly number[])[] = [
${rows.map((r) => `  [${r.join(', ')}],`).join('\n')}
];
`);
console.log('wrote src/engine/content/ctsupport.ts');
