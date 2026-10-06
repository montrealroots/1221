// Checks saves against the laws of the world (`src/engine/core/invariants.ts`, from 2026-10-06): each save file
// given, or each .json in a folder given, such as a played life's snapshots. Exits 1 if any law is broken.
// Run: npx vite-node tools/breaches.mjs <save.json | folder> ...
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { breaches, breachSummary } from '../src/engine/core/invariants';

const files = process.argv.slice(2).flatMap((p) => (statSync(p).isDirectory() ? readdirSync(p).filter((f) => f.endsWith('.json')).sort().map((f) => `${p}/${f}`) : [p]));
let broken = 0;
for (const f of files) {
  const u = JSON.parse(readFileSync(f, 'utf8'));
  if (!u.transactions || !u.people) { console.log(`${f}: not a save`); continue; }
  const s = breachSummary(breaches(u));
  if (s.length) broken += 1;
  console.log(`${f}: ${s.length ? '' : 'every law holds'}`);
  for (const b of s) console.log(`  ${b.count}× ${b.law} — first: ${b.first}`);
}
process.exit(broken ? 1 : 0);
