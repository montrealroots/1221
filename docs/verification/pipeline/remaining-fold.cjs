// Folds this pass's areas (2026-10-16, docs/verification/remaining/<key>-result.json) into the merge's inputs, as
// scope-fold.cjs folds the current scope's: each item's corrected row text (`rowText`) into doc-fields.json, and its
// evidence into evidence5-results.json in the rounds' shape. It reads every result there, so a result written after a
// run is taken by running it again; the coverage area's own (coverage-result.json) too, whose row text corrects what
// scope-fold.cjs writes back on every run from the scope's results of 2026-10-15 (i-stale-claims' count of sentences
// read and listed true, which the coverage area's two of 2026-10-16 moved), and whose items' tests are no row's.
//
// An item's evidence names no audit row, and its row text names only the rows whose words it changed, which aren't
// always the rows its tests are for (health-eligibility's work-test item corrects health.dental's line numbers alone).
// So the rows each item's tests are evidence for are read and written down in inputs/remaining-rows.json, with why; an
// item whose id is a row's needs no entry. An item in neither is listed as unmapped, and its tests go nowhere until it's
// mapped. A record here carries no verdict: merge-review.cjs takes a row's verdict, gaps and disposition from its latest
// record that has one, so folding this pass moves no row's status. Its kind is read from what the area wrote: static;
// a fixture where it says FIXTURE, GUARD, an older save, the engine or a unit (or its title is labelled so, which
// merge-review.cjs reads of every round); a render; else a command or the clock. A title that isn't a test in its file
// (a describe, or "(the leave and withdrawal reprice tests)") is listed and left out, so the audit cites none that
// doesn't land.
//
// Row text: a row's own fields (entry, reads, changes, downstream, persistent, explanation, tests, issue) and the Note's
// `corrected.now`. A value that begins or ends with "…" is a fragment of the field, applied only where
// inputs/remaining-rows.json says what it replaces; any other field is listed and left out. Two results writing one
// row's field are listed; the later file, by name, wins.
//   node remaining-fold.cjs        (from inputs/, after scope-fold.cjs)
const fs = require('fs');
const path = require('path');
const S = path.join(__dirname, 'inputs') + '/';
const ROOT = path.join(__dirname, '../../..') + '/';
const DIR = ROOT + 'docs/verification/remaining/';
const FIELDS = ['entry', 'reads', 'changes', 'downstream', 'persistent', 'explanation', 'tests', 'issue', 'corrected.now'];
const ids = new Set(JSON.parse(fs.readFileSync(S + 'row-review.json', 'utf8')).map((r) => r.id));
const map = JSON.parse(fs.readFileSync(S + 'remaining-rows.json', 'utf8'));
const doc = JSON.parse(fs.readFileSync(S + 'doc-fields.json', 'utf8'));
// A row's field as the merge would leave it without this fold: doc-fields.json's, else the audit's own.
const audit = {};
for (const area of ['life', 'money', 'papers', 'school', 'ui']) for (const it of JSON.parse(fs.readFileSync(`${ROOT}docs/verification/audit/${area}.json`, 'utf8')).items) audit[it.id] = it;
const baseOf = (id, field) => (field === 'corrected.now' ? doc[id]?.[field] ?? audit[id]?.corrected?.now : doc[id]?.[field] ?? audit[id]?.[field]);

const plain = (s) => s.replace(/[’‘]/g, "'").replace(/\\'/g, "'").replace(/[“”]/g, '"').trim();
const titles = {};
const titlesOf = (file) => (titles[file] ??= fs.existsSync(ROOT + file) ? [...fs.readFileSync(ROOT + file, 'utf8').matchAll(/\bit\(\s*(['`"])((?:\\.|(?!\1).)*)\1/g)].map((m) => plain(m[2])) : null);
// A cited title is in its file where each of its parts, cut short with "…" or "...", is in one test's title, in order.
const lands = (file, title) => {
  const parts = plain(title.split(' > ').pop()).split(/\.\.\.|…/).map((p) => p.trim()).filter((p) => p.length >= 3);
  return parts.length > 0 && (titlesOf(file) ?? []).some((t) => { let from = 0; for (const p of parts) { const k = t.indexOf(p, from); if (k < 0) return false; from = k + p.length; } return true; });
};
const kindOf = (kind, title) => {
  const k = String(kind);
  const last = String(title).split(' > ').pop();
  if (/\bstatic\b/i.test(k)) return 'static';
  if (/fixture|guard|older save|loadSave|migrate|\bengine\b|\bunit\b/i.test(k) || /\bFIXTURE\b/.test(last) || /^(?:GUARD|OLDER SAVE|LEGACY STATE)\b/.test(last)) return 'fixture';
  if (/render/i.test(k)) return 'render';
  if (/command|clock|reload|jump/i.test(k)) return 'command';
  return 'fixture';
};

const said = { unmapped: [], notATest: [], notARow: [], notAField: [], fragments: [], twice: [] };
const wrote = {};
let fields = 0;
const byFile = {};
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('-result.json')).sort();
for (const f of files) {
  const result = JSON.parse(fs.readFileSync(DIR + f, 'utf8'));
  const key = f.replace(/-result\.json$/, '');
  for (const item of result.items ?? []) {
    // Row text.
    for (const [row, text] of Object.entries(item.rowText ?? {})) {
      if (!ids.has(row)) { said.notARow.push(`${key}/${item.id}: rowText for ${row}`); continue; }
      for (const [field, value] of Object.entries(text ?? {})) {
        if (!FIELDS.includes(field) || typeof value !== 'string') { said.notAField.push(`${key}/${item.id}: ${row}.${field}`); continue; }
        // A straight apostrophe inside a word curled, as the audit's words have it: tools/coverage.mjs reads a straight
        // one before a letter as a quote's inside, so health-eligibility's “renewal's hour” ran its citation of
        // scope-cover's describe on into the next and failed it (found on 2026-10-16).
        let now = value.replace(/(?<=[A-Za-z])'(?=[a-z])/g, '’');
        if (/^…|…$/.test(value.trim())) {
          const fix = map.fragments?.[`${row}|${field}`];
          const base = baseOf(row, field) ?? '';
          if (!fix || fix.fragment !== value) { said.fragments.push(`${key}/${item.id}: ${row}.${field} is a fragment remaining-rows.json doesn't place: ${value.slice(0, 80)}`); continue; }
          if (base.includes(fix.replaces)) now = base.split(fix.replaces).join(fix.with);
          else if (base.includes(fix.with)) now = base;
          else { said.fragments.push(`${key}/${item.id}: ${row}.${field}: what the fragment replaces isn't in the field`); continue; }
        }
        const at = `${row}.${field}`;
        if (wrote[at] && wrote[at] !== `${key}/${item.id}`) said.twice.push(`${at}: ${wrote[at]}, then ${key}/${item.id}`);
        wrote[at] = `${key}/${item.id}`;
        (doc[row] ??= {})[field] = now;
        fields += 1;
      }
    }
    // Evidence, to the rows it's for.
    const rows = ids.has(item.id) ? [item.id, ...(map.items?.[`${key}/${item.id}`]?.rows ?? []).filter((r) => r !== item.id)] : map.items?.[`${key}/${item.id}`]?.rows;
    if (!rows) { if ((item.evidence ?? []).length) said.unmapped.push(`${key}/${item.id} (${item.evidence.length} tests)`); continue; }
    for (const row of rows) if (!ids.has(row)) said.notARow.push(`remaining-rows.json: ${key}/${item.id} maps to ${row}`);
    for (const e of item.evidence ?? []) {
      const file = String(e.file ?? '').replace(/\\/g, '/');
      if (!/^tests\/[\w.-]+\.test\.ts$/.test(file) || !lands(file, String(e.title ?? ''))) { if (rows.length) said.notATest.push(`${key}/${item.id}: ${file} ‘${String(e.title).slice(0, 90)}’`); continue; }
      for (const row of rows.filter((r) => ids.has(r))) {
        const batch = (byFile[`${key}|${file}`] ??= { key: `remaining-${key}`, testFile: file, rows: {} });
        const rec = (batch.rows[row] ??= { id: row, testsAdded: [], gapsClosed: [], gapsOpen: undefined, defects: [] });
        if (rec.testsAdded.some((t) => t.title === e.title)) continue;
        rec.testsAdded.push({ title: e.title, closes: e.proves, evidenceKind: kindOf(e.kind, e.title) });
      }
    }
  }
}
const out = Object.values(byFile).map((b) => ({ key: b.key, testFile: b.testFile, rows: Object.values(b.rows) }));
fs.writeFileSync(S + 'evidence5-results.json', JSON.stringify(out, null, 1));
fs.writeFileSync(S + 'doc-fields.json', JSON.stringify(doc, null, 1));
const rowsWith = new Set(out.flatMap((g) => g.rows.map((r) => r.id)));
console.log(`${files.length} results; ${out.length} batches, ${out.reduce((n, g) => n + g.rows.reduce((m, r) => m + r.testsAdded.length, 0), 0)} tests on ${rowsWith.size} rows; ${fields} fields of row text`);
for (const [what, list] of Object.entries(said)) for (const s of list) console.log(`  ${what}: ${s}`);
