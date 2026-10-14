// Folds the current scope's results (2026-10-15, docs/verification/scope/<key>-result.json) into the merge's inputs:
// evidence4-results.json in the first rounds' shape, each row's corrected text (rowText) into doc-fields.json, and the
// rows' mutations, with the test file each names, into mutations4-input.json for mut-parallel.cjs.
const fs = require('fs');
const S = require('path').join(__dirname, 'inputs') + '/';
const ROOT = require('path').join(__dirname, '../../..') + '/';
const DIR = fs.existsSync(ROOT + 'docs/verification/scope') ? ROOT + 'docs/verification/scope/' : ROOT + 'scope/';
const FIELDS = ['entry', 'reads', 'changes', 'downstream', 'persistent', 'explanation', 'tests', 'issue'];
const KEYS = ['people', 'taxpapers', 'health', 'money', 'school'];
const verdictOf = (after) => String(typeof after === 'string' ? after : after?.status ?? after?.verdict ?? '').split(/[:,.;\s(—-]/)[0].trim();
const kindOf = (k) => (/render/.test(k) ? 'render' : /clock/.test(k) ? 'clock' : /fixture|guard|setup/i.test(k) ? 'fixture' : 'command');
const out = [];
const doc = JSON.parse(fs.readFileSync(S + 'doc-fields.json', 'utf8'));
const muts = [];
let fields = 0;
for (const key of KEYS) {
  const j = JSON.parse(fs.readFileSync(`${DIR}${key}-result.json`, 'utf8'));
  const testFile = `tests/scope-${key}.test.ts`;
  const rows = j.rows.map((r) => {
    const v = verdictOf(r.after);
    if (!['verified', 'partial', 'unresolved', 'deferred', 'legacy', 'informational'].includes(v)) throw new Error(`${r.id}: verdict ${JSON.stringify(r.after).slice(0, 80)}`);
    for (const [k, t] of Object.entries(r.rowText ?? {})) if (FIELDS.includes(k) && typeof t === 'string') { (doc[r.id] ??= {})[k] = t; fields += 1; }
    const files = [...new Set((r.testsAdded ?? []).map((t) => t.file))];
    // A row with no test added (a stale claim corrected) names the tests that already held it.
    const own = { 'documents.apply_ssn': 'tests/evidence-g17-papers.test.ts' };
    for (const m of r.mutations ?? []) muts.push({ id: r.id, key: `scope-${key}`, file: m.file, find: m.find, replace: m.replace, protects: m.protects, test: m.test ?? (m.file.startsWith('tests/') ? m.file : files[0] ?? own[r.id]) });
    return {
      id: r.id,
      testsAdded: (r.testsAdded ?? []).map((t) => ({ title: t.title, closes: t.proves, evidenceKind: kindOf(String(t.kind)) })),
      gapsClosed: (r.fixes ?? []).map((f) => f.summary),
      gapsOpen: v === 'verified' ? [] : [typeof r.after === 'string' ? r.after : JSON.stringify(r.after)],
      disposition: r.disposition,
      defects: (r.fixes ?? []).map((f) => ({ summary: f.summary, where: f.where, proposedFix: 'fixed', failingTest: f.test })),
      verdict: v,
    };
  });
  // A test file is named per row by its tests; a row with tests in more than one file keeps the scope file as its own.
  const byFile = {};
  for (const r of rows) {
    const files = [...new Set(r.testsAdded.map((t, i) => j.rows.find((x) => x.id === r.id).testsAdded[i].file))];
    if (!files.length) (byFile[testFile] ??= []).push(r);
    for (const f of files) (byFile[f] ??= []).push({ ...r, testsAdded: r.testsAdded.filter((t, i) => j.rows.find((x) => x.id === r.id).testsAdded[i].file === f) });
  }
  for (const [f, rs] of Object.entries(byFile)) out.push({ key: `scope-${key}`, testFile: f, rows: rs });
}
fs.writeFileSync(S + 'evidence4-results.json', JSON.stringify(out, null, 1));
fs.writeFileSync(S + 'doc-fields.json', JSON.stringify(doc, null, 1));
fs.writeFileSync(S + 'mutations4-input.json', JSON.stringify(muts, null, 1));
console.log(`${out.length} batches, ${new Set(out.flatMap((g) => g.rows.map((r) => r.id))).size} rows; ${fields} fields of row text; ${muts.length} mutations`);
for (const g of out) for (const r of g.rows) if (g.testFile.includes("scope-") || !out.some((h) => h !== g && h.rows.some((x) => x.id === r.id))) console.log(`  ${r.id}: ${r.verdict}`);
