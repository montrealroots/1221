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
// From 2026-10-16 (brief 09's journeys' follow-up, folded by the coverage area) three more were placed, which until then
// were listed as no field on every run: a deferred row's `settled`, which the coverage page's moved rows show (the
// journeys' Mexican residence rows); a field to add to, `<field> (add)`, its value put after the field as it stands, once
// (school.term's tests, school.pay_balance's downstream, bank.month_end's tests); and `evidence (add)`, a test the item's
// own evidence brings, placed as evidence where its tests reach the row (listed as such) and listed as no field where they
// don't. And a title cited in folded row text that a later rename moved is written under its last name where
// inputs/renames.json records the rename (see citedAsNamed).
//
// From 2026-10-16 (brief 09) it reads docs/verification/remaining-09/ too, after remaining/, so that pass's results come
// in the same way: an item keyed `09-<key>/<id>` in inputs/remaining-rows.json, its records `remaining-09-<key>`, its row
// text over the earlier pass's where both write a field (said as twice). And a row added since the review of 2026-10-13
// (inputs/added-rows.json) takes evidence as any row does; its own words are kept in added-rows.json, so row text for it
// is listed and left out, not written into doc-fields.json over them. Until then this read remaining/ alone, and an added
// row (health.request_hardship) was no row to it: its evidence went nowhere.
// The same day it took two more kinds of row text: a part of a row's acceptance (acceptance.unfinished), written into
// doc-fields.json's acceptance, and what one of a row's tests closes (after.tests[N].closes), written into
// inputs/closes.json under that test's title as the audit stands, for merge-review.cjs to apply; until then both were
// listed as no field and left out.
// From 2026-10-17 (brief 11) it reads docs/verification/completion-2026-10-16/ too, after remaining-09/, keyed `11-<area>`,
// its records `remaining-11-<area>`: that pass's results list their rows under `rows`, read as items, and a test a row
// already cites isn't added again, as brief 09's. Only a row whose id is an audit row's, or one mapped in
// remaining-rows.json, takes its tests; the criteria and area items brief 11 also closed are listed as unmapped. Until
// then brief 11's tests of the audit's rows (health.enroll, l-actor) would have gone nowhere. Brief 10's results
// (remaining-10/) were never read, and still aren't: none of its items is an audit row, and its one row text (Arion's
// close, an `evidence (add)` on bank.close_current) names a test its item's tests don't reach.
//   node remaining-fold.cjs        (from inputs/, after scope-fold.cjs)
const fs = require('fs');
const path = require('path');
const S = path.join(__dirname, 'inputs') + '/';
const ROOT = path.join(__dirname, '../../..') + '/';
/** Each pass's results, in order, and the prefix its keys take. */
const DIRS = [['docs/verification/remaining/', ''], ['docs/verification/remaining-09/', '09-'], ['docs/verification/completion-2026-10-16/', '11-']];
const FIELDS = ['entry', 'reads', 'changes', 'downstream', 'persistent', 'explanation', 'tests', 'issue', 'corrected.now', 'settled'];
const added = new Set(Object.keys(fs.existsSync(S + 'added-rows.json') ? JSON.parse(fs.readFileSync(S + 'added-rows.json', 'utf8')).rows : {}));
const ids = new Set([...JSON.parse(fs.readFileSync(S + 'row-review.json', 'utf8')).map((r) => r.id), ...added]);
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
// A title renamed since it was cited lands under its last name (inputs/renames.json, followed as merge-review.cjs follows
// it, which writes the last name into the audit). From 2026-10-16 (brief 09): until then a title an area renamed after its
// result was written (the banking area's of the last pass, renamed by this pass's) was listed as no test and left out.
const renames = fs.existsSync(S + 'renames.json') ? JSON.parse(fs.readFileSync(S + 'renames.json', 'utf8')) : {};
const lastName = (t) => { const seen = new Set(); let at = t; while (typeof renames[at] === 'string' && !seen.has(at)) { seen.add(at); at = renames[at]; } return at; };
const landsAsNamed = (file, title) => {
  if (lands(file, title)) return true;
  const last = title.split(' > ').pop();
  const now = [lastName(title), lastName(last)].find((t) => t !== title && t !== last);
  return now !== undefined && lands(file, now);
};
// A title cited in row text an area wrote before a later rename (health-eligibility's health.month tests, written before
// the journeys' follow-up renamed evidence-g05-life's HUSKY D renewal): written under its last name where
// inputs/renames.json records the rename, the cited words (cut at an ellipsis, 20 characters or more) the start of a
// recorded old title and every such title leading to one test now in the cited file; left as written, for
// tools/coverage.mjs to list, where none or more than one does. A citation that lands is never touched. Recorded renames
// only: no word overlap (from 2026-10-16, brief 09's journeys' follow-up).
const recorded = Object.keys(renames).filter((k) => typeof renames[k] === 'string');
const citedAsNamed = (text, where) => {
  let file;
  return text.replace(/(?:tests\/)?[\w.-]+\.test\.ts|‘((?:[^’]|’(?=[A-Za-z]))*)’/g, (m, title) => {
    if (title === undefined) { file = m.startsWith('tests/') ? m : `tests/${m}`; return m; }
    if (!file || lands(file, title)) return m;
    const head = plain(title).split(/\.\.\.|…/)[0].trim();
    if (head.length < 20) return m;
    const now = [...new Set(recorded.filter((k) => plain(k).startsWith(head)).map((k) => lastName(k)))].filter((t) => lands(file, t));
    if (now.length !== 1) return m;
    said.renamedInText.push(`${where}: ${file} ‘${title.slice(0, 60)}’ → ‘${now[0].slice(0, 60)}’`);
    return `‘${now[0]}’`;
  });
};
/** Whether a row already cites a test: in its review's evidence, or among the tests an earlier pass's round gave it. */
const citedBefore = (row, title) => {
  const last = plain(lastName(title.split(' > ').pop()));
  const head = last.split(/\.\.\.|…/)[0].trim().slice(0, 60);
  if (head.length < 20) return false;
  const earlier = (audit[row]?.after?.tests ?? []).filter((t) => !String(t.round ?? '').startsWith('remaining-')).map((t) => plain(t.title.split(' > ').pop()));
  return earlier.some((t) => t.startsWith(head)) || (audit[row]?.review?.evidence ?? []).some((e) => plain(String(e.where)).includes(head));
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

const said = { unmapped: [], notATest: [], notARow: [], notAField: [], fragments: [], twice: [], addedRow: [], alreadyCited: [], asEvidence: [], added: [], renamedInText: [] };
const closes = fs.existsSync(S + 'closes.json') ? JSON.parse(fs.readFileSync(S + 'closes.json', 'utf8')) : { about: 'What a test cited by a row closes, corrected where an area’s change falsified the words its round wrote (from 2026-10-16, brief 09): rows[rowId][the test’s last title] = its words now. Written by remaining-fold.cjs from an area’s rowText after.tests[N].closes, read by merge-review.cjs.', rows: {} };
const wrote = {};
let fields = 0;
const byFile = {};
const files = DIRS.flatMap(([dir, prefix]) => (fs.existsSync(ROOT + dir) ? fs.readdirSync(ROOT + dir).filter((f) => f.endsWith('-result.json')).sort().map((f) => ({ resultFile: ROOT + dir + f, key: prefix + f.replace(/-result\.json$/, '') })) : []));
for (const { resultFile, key } of files) {
  const result = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
  for (const item of result.items ?? result.rows ?? []) {
    // The rows the item's tests reach, as its evidence is mapped below: an `evidence (add)` is placed where they reach it.
    const reached = new Set([...(ids.has(item.id) ? [item.id] : []), ...(map.items?.[`${key}/${item.id}`]?.rows ?? []), ...(item.evidence ?? []).flatMap((e) => ((map.items?.[`${key}/${item.id}`]?.tests ?? map.byTest?.[key] ?? []).find((t) => plain(String(e.title ?? '').split(' > ').pop()).startsWith(plain(t.title)))?.rows ?? []))]);
    // Row text.
    for (const [row, text] of Object.entries(item.rowText ?? {})) {
      if (!ids.has(row)) { said.notARow.push(`${key}/${item.id}: rowText for ${row}`); continue; }
      if (added.has(row)) { said.addedRow.push(`${key}/${item.id}: ${row}'s words are kept in inputs/added-rows.json`); continue; }
      for (const [field, value] of Object.entries(text ?? {})) {
        // A row's four parts (acceptance.player and the rest) and what one of its tests closes (after.tests[N].closes),
        // from 2026-10-16 (brief 09): the banking area corrected both where its change of German closing fees falsified
        // them. A part goes into doc-fields.json's acceptance, which the merge writes; a test's closes into
        // inputs/closes.json under the test's title as the audit stands, which the merge applies to that test.
        const part = /^acceptance\.(player|engine|deferred|unfinished)$/.exec(field);
        if (part && typeof value === 'string') {
          if (!doc[row]?.acceptance) { said.notAField.push(`${key}/${item.id}: ${row}.${field} (the row has no acceptance)`); continue; }
          if (wrote[`${row}.${field}`] && wrote[`${row}.${field}`] !== `${key}/${item.id}`) said.twice.push(`${row}.${field}: ${wrote[`${row}.${field}`]}, then ${key}/${item.id}`);
          wrote[`${row}.${field}`] = `${key}/${item.id}`;
          doc[row].acceptance[part[1]] = value.replace(/(?<=[A-Za-z])'(?=[a-z])/g, '’');
          fields += 1;
          continue;
        }
        const closesAt = /^after\.tests\[(\d+)\]\.closes$/.exec(field);
        if (closesAt && typeof value === 'string') {
          const t = audit[row]?.after?.tests?.[Number(closesAt[1])];
          if (!t) { said.notAField.push(`${key}/${item.id}: ${row}.${field} (no such test in the row as it stands)`); continue; }
          const title = lastName(t.title.split(' > ').pop());
          (closes.rows[row] ??= {})[title] = value;
          fields += 1;
          continue;
        }
        const adding = /^(.+) \(add\)$/.exec(field);
        if (adding && typeof value === 'string') {
          if (adding[1] === 'evidence') {
            if (reached.has(row)) said.asEvidence.push(`${key}/${item.id}: ${row}.${field}: the item’s tests reach ${row} through remaining-rows.json`);
            else said.notAField.push(`${key}/${item.id}: ${row}.${field} (the item’s tests reach no ${row})`);
            continue;
          }
          if (!FIELDS.includes(adding[1])) { said.notAField.push(`${key}/${item.id}: ${row}.${field}`); continue; }
          const f = adding[1];
          const add = citedAsNamed(value.replace(/(?<=[A-Za-z])'(?=[a-z])/g, '’').trim(), `${key}/${item.id}: ${row}.${field}`);
          const base = String(doc[row]?.[f] ?? baseOf(row, f) ?? '').trim();
          const now = base.includes(add) ? base : !base ? add : f === 'tests' ? `${base.replace(/[;.]$/, '')}; ${add}` : `${base}${/[.)]$/.test(base) ? '' : '.'} ${add}`;
          if (now !== base) said.added.push(`${key}/${item.id}: ${row}.${f}`);
          (doc[row] ??= {})[f] = now;
          fields += 1;
          continue;
        }
        if (!FIELDS.includes(field) || typeof value !== 'string') { said.notAField.push(`${key}/${item.id}: ${row}.${field}`); continue; }
        // A straight apostrophe inside a word curled, as the audit's words have it: tools/coverage.mjs reads a straight
        // one before a letter as a quote's inside, so health-eligibility's “renewal's hour” ran its citation of
        // scope-cover's describe on into the next and failed it (found on 2026-10-16).
        let now = citedAsNamed(value.replace(/(?<=[A-Za-z])'(?=[a-z])/g, '’'), `${key}/${item.id}: ${row}.${field}`);
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
    // A test of the item's mapped to rows of its own (from 2026-10-16, brief 09): an item's `tests`, or its area's in
    // remaining-rows.json's `byTest`, each a title's start and its rows, where an area's tests reach different rows (the
    // journeys area's, each journey several commands, cited by several items). A test none names goes to the item's rows.
    // Until then every test of an item went to every row of it.
    const byTest = map.items?.[`${key}/${item.id}`]?.tests ?? map.byTest?.[key] ?? [];
    for (const row of [...rows, ...byTest.flatMap((t) => t.rows)]) if (!ids.has(row)) said.notARow.push(`remaining-rows.json: ${key}/${item.id} maps to ${row}`);
    for (const e of item.evidence ?? []) {
      const file = String(e.file ?? '').replace(/\\/g, '/');
      const own = byTest.find((t) => plain(String(e.title ?? '').split(' > ').pop()).startsWith(plain(t.title)));
      const these = own ? own.rows : rows;
      if (!/^tests\/[\w.-]+\.test\.ts$/.test(file) || !landsAsNamed(file, String(e.title ?? ''))) { if (these.length) said.notATest.push(`${key}/${item.id}: ${file} ‘${String(e.title).slice(0, 90)}’`); continue; }
      for (const row of these.filter((r) => ids.has(r))) {
        const batch = (byFile[`${key}|${file}`] ??= { key: `remaining-${key}`, testFile: file, rows: {} });
        const rec = (batch.rows[row] ??= { id: row, testsAdded: [], gapsClosed: [], gapsOpen: undefined, defects: [] });
        // A test cited again by a later item: what it closes is the later item's where the first said only “As the item
        // says.” (from 2026-10-16: the journeys area's `actions` item cites every journey so, ahead of the items whose
        // `proves` says what each test shows, and until then the first citation's words were kept).
        const had = rec.testsAdded.find((t) => t.title === e.title);
        if (had) { if (/^(As the item says\.?)?$/.test(String(had.closes ?? '').trim()) && e.proves) had.closes = e.proves; continue; }
        // A test the row already cites, in its review or an earlier round's record, isn't added again by brief 09's results
        // (from 2026-10-16): the banking area's readings of the eight bank rows cite the rows' own tests beside the one they
        // added. The last pass's records are folded as they were.
        if (/^(09|11)-/.test(key) && citedBefore(row, String(e.title))) { said.alreadyCited.push(`${key}/${item.id}: ${row} ‘${String(e.title).split(' > ').pop().slice(0, 70)}’`); continue; }
        rec.testsAdded.push({ title: e.title, closes: e.proves, evidenceKind: kindOf(e.kind, e.title) });
      }
    }
  }
}
const out = Object.values(byFile).map((b) => ({ key: b.key, testFile: b.testFile, rows: Object.values(b.rows) }));
fs.writeFileSync(S + 'evidence5-results.json', JSON.stringify(out, null, 1));
fs.writeFileSync(S + 'doc-fields.json', JSON.stringify(doc, null, 1));
fs.writeFileSync(S + 'closes.json', JSON.stringify(closes, null, 1) + '\n');
const rowsWith = new Set(out.flatMap((g) => g.rows.map((r) => r.id)));
console.log(`${files.length} results; ${out.length} batches, ${out.reduce((n, g) => n + g.rows.reduce((m, r) => m + r.testsAdded.length, 0), 0)} tests on ${rowsWith.size} rows; ${fields} fields of row text`);
for (const [what, list] of Object.entries(said)) for (const s of list) console.log(`  ${what}: ${s}`);
