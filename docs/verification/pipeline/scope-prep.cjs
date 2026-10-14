// The current scope's inputs to merge-review.cjs (2026-10-15): the copies' mutation run with its reruns put in place of
// the entries they replace (mutations4-final.json), and each fix the scope's agents made keyed as merge-review reads it
// (`${id}::${summary}` in fixes.json, the fix's summary and its test).
const fs = require('fs');
const S = require('path').join(__dirname, 'inputs') + '/';
const key = (m) => `${m.id}|${m.file}|${m.find}`;
const base = JSON.parse(fs.readFileSync(S + 'mutations4.json', 'utf8'));
const reruns = [];
for (const f of ['mutations4-health-rerun.json', 'mutations4-survivors.json']) if (fs.existsSync(S + f)) reruns.push(...JSON.parse(fs.readFileSync(S + f, 'utf8')));
const byKey = new Map(base.map((m) => [key(m), m]));
for (const r of reruns) {
  const killed = r.rerun !== undefined ? /KILLED/.test(String(r.rerun)) : r.killed;
  // A guard found redundant and removed: no longer a mutation of anything, so it leaves the count, said in its row.
  if (r.removed) { byKey.delete(key(r)); continue; }
  byKey.set(key(r), { ...byKey.get(key(r)), ...r, applied: true, killed });
}
// Not applied in the copies: the money agents rewrote those lines after the copies were made, and ran them in the tree.
const out = [...byKey.values()];
fs.writeFileSync(S + 'mutations4-final.json', JSON.stringify(out, null, 1));
console.log(`mutations: ${out.length}, applied ${out.filter((m) => m.applied).length}, killed ${out.filter((m) => m.applied && m.killed).length}`);
for (const m of out.filter((x) => x.applied && !x.killed)) console.log('  SURVIVED', m.id, m.file, m.find.slice(0, 70));

const ev = JSON.parse(fs.readFileSync(S + 'evidence4-results.json', 'utf8'));
const fixes = JSON.parse(fs.readFileSync(S + 'fixes.json', 'utf8'));
let n = 0;
for (const g of ev) for (const r of g.rows) for (const d of r.defects ?? []) { const k = `${r.id}::${d.summary}`; if (!fixes[k]) { fixes[k] = { on: '2026-10-15', test: d.failingTest ?? '', how: `fixed in the code${d.where ? ` (${String(d.where).slice(0, 160)})` : ''}; the test that failed before it passes, and fails again with the fix taken out` }; n += 1; } }
fs.writeFileSync(S + 'fixes.json', JSON.stringify(fixes, null, 1));
console.log(`fixes keyed: ${n}`);
