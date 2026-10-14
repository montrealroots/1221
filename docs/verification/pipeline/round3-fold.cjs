// Folds round three (2026-10-14) into the merge's inputs: its results as evidence3-results.json in the first rounds'
// shape; each row's corrected text (rowText) and the decisions agent's (decisions-rows.json) into doc-fields.json; and
// the knob row's new id, now that receipts went, through every input that names it.
const fs = require('fs');
const S = require('path').join(__dirname, 'inputs') + '/';
const ROOT = require('path').join(__dirname, '../../..') + '/';
const OLD = 'knob:receipts|bondWarmth|bondWound|company|morning|evening|readsAround|drills|skims|revises';
const NEW = 'knob:bondWarmth|bondWound|company|morning|evening|readsAround|drills|skims|revises';
const FIELDS = ['entry', 'reads', 'changes', 'downstream', 'persistent', 'explanation', 'tests', 'issue'];

// The id, everywhere a merge input or the audit names it (a JSON string, so its pipes need no escaping).
const files = ['row-review.json', 'checks.json', 'evidence-results.json', 'evidence2-results.json', 'doc-fields.json', 'after-check.json', 'mutations.json', 'mutations2-final.json', 'fixes.json', 'decisions-rows.json'];
for (const f of fs.readdirSync(S + 'final-checks')) files.push('final-checks/' + f);
for (const f of fs.readdirSync(S + 'round3')) files.push('round3/' + f);
let renamed = 0;
for (const f of files) {
  if (!fs.existsSync(S + f)) continue;
  const s = fs.readFileSync(S + f, 'utf8');
  if (!s.includes(OLD)) continue;
  fs.writeFileSync(S + f, s.split(OLD).join(NEW));
  renamed += 1;
}
for (const a of ['life', 'money', 'papers', 'school', 'ui']) {
  const p = `${ROOT}docs/verification/audit/${a}.json`;
  const s = fs.readFileSync(p, 'utf8');
  if (s.includes(OLD)) { fs.writeFileSync(p, s.split(OLD).join(NEW)); renamed += 1; }
}

// Round three's results.
const out = [];
for (const f of fs.readdirSync(S + 'round3').filter((x) => x.endsWith('.json'))) {
  const r = JSON.parse(fs.readFileSync(S + 'round3/' + f, 'utf8'));
  out.push({ key: 'r3-' + f.replace('.json', ''), testFile: r.testFile, rows: r.rows.map((x) => ({ ...x, mutations: x.mutations ?? [], defects: x.defects ?? [], testsAdded: x.testsAdded ?? [], gapsClosed: x.gapsClosed ?? [], gapsOpen: x.gapsOpen ?? [] })) });
}
fs.writeFileSync(S + 'evidence3-results.json', JSON.stringify(out, null, 1));

// The rows' corrected text: decisions first, round three's after (it read the code later).
const doc = JSON.parse(fs.readFileSync(S + 'doc-fields.json', 'utf8'));
let fields = 0;
const take = (id, t) => { for (const [k, v] of Object.entries(t ?? {})) if (FIELDS.includes(k) && typeof v === 'string') { (doc[id] ??= {})[k] = v; fields += 1; } };
if (fs.existsSync(S + 'decisions-rows.json')) for (const [id, t] of Object.entries(JSON.parse(fs.readFileSync(S + 'decisions-rows.json', 'utf8')))) take(id === OLD ? NEW : id, t);
for (const g of out) for (const r of g.rows) take(r.id, r.rowText);
fs.writeFileSync(S + 'doc-fields.json', JSON.stringify(doc, null, 1));
console.log(`id renamed in ${renamed} files; ${out.length} batches, ${out.reduce((n, g) => n + g.rows.length, 0)} rows; ${fields} fields of row text taken`);
