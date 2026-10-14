// Folds scope/yale-result.json's later entries (renewal, cover, recheck) into scope/health-result.json's rows, so the
// merge sees one record per row: tests, fixes and mutations. Idempotent: a test or fix already there isn't added again.
const fs = require('fs');
const R = require('path').join(__dirname, '..', 'scope') + '/';
const y = JSON.parse(fs.readFileSync(R + 'yale-result.json', 'utf8'));
const h = JSON.parse(fs.readFileSync(R + 'health-result.json', 'utf8'));
const row = (id) => h.rows.find((r) => r.id === id);
const asTest = (t, fallbackFile) => (typeof t === 'string' ? { file: fallbackFile, title: t, kind: 'command', proves: '' } : { file: t.file ?? fallbackFile, title: t.title, kind: t.kind ?? 'command', proves: t.proves ?? t.closes ?? '' });
const add = (r, tests, fixes, muts) => {
  for (const t of tests) if (t?.title && !r.testsAdded.some((x) => x.title === t.title)) r.testsAdded.push(t);
  r.fixes ??= [];
  for (const f of fixes) if (f && !r.fixes.some((x) => x.summary === f.summary)) r.fixes.push(f);
  for (const m of muts) if (m?.find && !r.mutations.some((x) => x.find === m.find && x.file === m.file)) r.mutations.push(m);
};
const where = (text) => (/clinic|practice|Fair Haven|Yale Health Center|followTheCover|appointment/i.test(text) ? 'health.choose_clinic' : 'health.enroll');
const entries = [];
if (y.renewal) entries.push({ ...y.renewal, problem: y.renewal.defect });
for (const c of y.cover ?? []) entries.push({ ...c, problem: c.finding });
for (const c of y.recheck ?? []) entries.push(c);
let n = 0;
for (const e of entries) {
  const id = where(String(e.problem ?? ''));
  const r = row(id);
  const tests = (e.testsAdded ?? []).map((t) => asTest(t, /cover/i.test(JSON.stringify(t)) ? 'tests/scope-cover.test.ts' : 'tests/scope-health.test.ts'));
  const fix = e.fix || e.done ? [{ summary: String(e.problem).slice(0, 300), where: typeof e.fix === 'string' ? e.fix.slice(0, 300) : String(e.done ?? '').slice(0, 300), test: tests[0]?.title ?? '' }] : [];
  add(r, tests, fix, (e.mutations ?? []).filter((m) => typeof m === 'object'));
  n += 1;
}
fs.writeFileSync(R + 'health-result.json', JSON.stringify(h, null, 1));
for (const r of h.rows) console.log(r.id, 'tests', r.testsAdded.length, 'fixes', (r.fixes ?? []).length, 'mutations', r.mutations.length, 'files', [...new Set(r.testsAdded.map((t) => t.file))].join(' '));
console.log('entries', n);
