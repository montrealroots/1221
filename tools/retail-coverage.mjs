#!/usr/bin/env node
/**
 * SLATE — which countries have real shops of their own, and which do not.
 *
 * The catalog names real chains in the markets they really trade in, so
 * coverage is uneven by construction. The honest thing is to print the
 * unevenness rather than let a worldwide chain reaching everywhere imply that
 * a country's own high street has been written. The number that matters is
 * `local`: chains authored for that country specifically.
 *
 *   npx vite-node tools/retail-coverage.mjs
 *   npx vite-node tools/retail-coverage.mjs --check
 *
 * `--check` exits 1 if a market SLATE claims to cover cannot supply food,
 * clothes and a television from its own chains.
 */

import { ALL_RETAILERS, coverageReport } from '../src/engine/content/brands.ts';

const report = coverageReport();
const check = process.argv.includes('--check');
const worldwide = report[0]?.worldwide ?? 0;

const bands = { deep: [], workable: [], thin: [], none: [] };
for (const row of report) bands[row.band].push(row);

const line = (rows) => rows.map((r) => `${r.market}(${r.local})`).join(' ');

console.log('');
console.log(`  Real retail coverage — ${ALL_RETAILERS.length} chains across ${report.length} markets`);
console.log(`  ${worldwide} of them are worldwide and reach every market on top of the numbers below.`);
console.log('');
for (const [band, label] of [
  ['deep', 'Deep — twenty local chains or more'],
  ['workable', 'Workable — ten or more'],
  ['thin', 'Thin — fewer than ten, and the high street will feel borrowed'],
]) {
  if (bands[band].length === 0) continue;
  console.log(`  ${label}: ${bands[band].length} markets`);
  console.log(`    ${line(bands[band])}`);
  console.log('');
}

const broken = report.filter((r) => !r.essentials);
if (broken.length > 0) {
  console.log('  Cannot supply food, clothes and a television from local chains alone:');
  console.log(`    ${broken.map((r) => r.market).join(' ')}`);
  console.log('  These lean on the worldwide chains, which is true of real life in some');
  console.log('  of them and a gap in the data in others.');
  console.log('');
}

console.log('  Every country not listed falls back to plainly simulated shops that say');
console.log('  on screen that they are simulated. Nothing in the game claims worldwide');
console.log('  real coverage, because there is not worldwide real coverage.');
console.log('');

if (check && broken.length > 0) process.exit(1);
