/**
 * Brief 15, money-data: runs `tools/text-inventory.mjs --mark2` for each entry of a marks module, in order, one at a
 * time (each run writes docs/text/second-pass/money-data.json, so they can't overlap). A later entry for the same source
 * replaces an earlier one, as the tool does: a group can be marked Retained by its pattern, then the sources in it that
 * changed marked Rewritten.
 *
 *   node mark.mjs <marks module>      default export: [{ id, status, reason? , evidence? }]
 */
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const marks = (await import(pathToFileURL(resolve(process.argv[2])).href)).default;
for (const m of marks) {
  const args = ['tools/text-inventory.mjs', '--mark2', m.id, m.status, '--by', 'money-data', ...(m.reason ? ['--reason', m.reason] : []), ...(m.evidence ? ['--evidence', m.evidence] : [])];
  const out = execFileSync('node', args, { encoding: 'utf8', cwd: resolve(import.meta.dirname, '../../../..') }).trim().split('\n').at(-1);
  console.log(`${m.id}: ${out}`);
}
