// Records the review of 2026-10-13 in docs/verification/audit/*.json: each row's `review` (what it was at fca00d8f, the
// claim read, its evidence by kind, the UI evidence, the verdict, its disposition and gaps), and, where this pass's
// evidence work reported on it, `after` (the tests added, defects fixed, gaps left, mutations run, the verdict now).
// The row's status becomes the verdict now. Run: node merge-review.cjs [evidence-results.json] [mutations.json] [fixes.json]
const fs = require('fs');
const ROOT = require('path').join(__dirname, '../../..') + '/';
const S = require('path').join(__dirname, 'inputs') + '/';
const review = JSON.parse(fs.readFileSync(S + 'row-review.json', 'utf8'));
const byId = Object.fromEntries(review.map((r) => [r.id, r]));
const [evidenceFile, mutationsFile, fixesFile, checksFile] = process.argv.slice(2);
const checks = checksFile && fs.existsSync(checksFile) ? JSON.parse(fs.readFileSync(checksFile, 'utf8')) : [];
const checkById = {};
for (const g of checks) for (const r of g.rows ?? []) checkById[r.id] = r;
// The lower of two verdicts, for mutations that ran and killed nothing. The skeptic's verdict itself stands either way: it
// was read against the code after the defects were fixed, so a row the claim left partial on a defect since fixed is
// verified where the skeptic found it so.
const RANK = { verified: 3, partial: 2, unresolved: 1, deferred: 0 };
const lower = (a, b) => (b && RANK[b] < RANK[a] ? b : a);
const afterCheck = fs.existsSync(S + 'after-check.json') ? JSON.parse(fs.readFileSync(S + 'after-check.json', 'utf8')) : {};
// Each a comma-separated list: the first round's file, then the second's.
const many = (list) => (list ? list.split(',').filter((x) => fs.existsSync(x)).map((x) => JSON.parse(fs.readFileSync(x, 'utf8'))) : []);
const rounds = many(evidenceFile);
const mutations = many(mutationsFile).flat();
const fixes = fixesFile ? JSON.parse(fs.readFileSync(fixesFile, 'utf8')) : {};
const docFields = fs.existsSync(S + 'doc-fields.json') ? JSON.parse(fs.readFileSync(S + 'doc-fields.json', 'utf8')) : {};
const survivors = fs.existsSync(S + 'survivors.json') ? JSON.parse(fs.readFileSync(S + 'survivors.json', 'utf8')) : {};
const renames = fs.existsSync(S + 'renames.json') ? JSON.parse(fs.readFileSync(S + 'renames.json', 'utf8')) : {};
// A row's records, one per round it was in, earliest first.
// A title as renamed since, its describe path (“row > title”) kept.
const renamed = (t) => { const parts = t.split(' > '); const last = parts.pop(); return [...parts, renames[last] ?? renames[t] ?? last].join(' > '); };
const gone = (t) => { const last = t.split(' > ').pop(); return [t, last].some((k) => Object.hasOwn(renames, k) && renames[k] === null); };
const afterById = {};
for (const evidence of rounds) for (const g of evidence) for (const r of g.rows ?? []) (afterById[r.id] ??= []).push({ ...r, testFile: g.testFile, round: g.key });
const KIND = { command: 'command', clock: 'command', fixture: 'fixture', function: 'fixture', code: 'inspection', 'long-run': 'long-run', 'built-app': 'built-app', render: 'render' };
for (const area of ['life', 'money', 'papers', 'school', 'ui']) {
  const f = `${ROOT}docs/verification/audit/${area}.json`;
  const raw = fs.readFileSync(f, 'utf8');
  const doc = JSON.parse(raw);
  for (const it of doc.items) {
    const r = byId[it.id];
    if (!r) throw new Error(`no review for ${it.id}`);
    const before = it.review?.before ?? (it.status === 'verified' ? (it.read === true ? 'verified, read' : 'verified, not read') : it.status);
    it.review = {
      on: '2026-10-13',
      against: 'fca00d8f',
      before,
      claim: r.claim,
      evidence: (r.evidence ?? []).map((e) => ({ kind: e.kind === 'long-run' && e.where.startsWith('tests/') ? 'command' : KIND[e.kind] ?? e.kind, where: e.where, reachesAction: e.reachesAction, checksConsequence: e.checksConsequence, independent: e.independent, ...(e.problem ? { problem: e.problem } : {}) })),
      ui: r.uiEvidence,
      verdict: r.verdict,
      disposition: r.partialClass === 'none' ? undefined : r.partialClass,
      gaps: r.gaps ?? [],
    };
    const recs = afterById[it.id];
    if (recs) {
      const a = recs[recs.length - 1];
      const fileOf = (x) => x.testFile.replace(/\\/g, '/').replace(/^.*tests\//, '');
      // Only mutations that applied: one whose text no longer matched (the code it named since fixed) tested nothing.
      const m = mutations.filter((x) => x.id === it.id && x.applied);
      it.after = {
        // The day of the latest round that worked the row: the current scope's (scope-*) is 2026-10-15's.
        on: recs.some((x) => String(x.round ?? '').startsWith('scope-')) ? '2026-10-15' : '2026-10-13',
        rounds: recs.length,
        // A test renamed to null was removed with the rule it held (from 2026-10-14): no test holds that claim now.
        tests: recs.flatMap((x) => x.testsAdded.filter((t) => !gone(t.title)).map((t) => ({ file: fileOf(x), title: renamed(t.title), kind: KIND[t.evidenceKind] ?? t.evidenceKind, closes: t.closes }))),
        gapsClosed: recs.flatMap((x) => x.gapsClosed),
        gapsOpen: a.gapsOpen,
        // The final check's disposition where there is one (it read the code after every fix), else the claim's.
        ...((checkById[it.id]?.disposition ?? a.disposition) ? { disposition: checkById[it.id]?.disposition ?? a.disposition } : {}),
        defects: recs.flatMap((x) => (x.defects ?? []).map((d) => ({ summary: d.summary, where: d.where, fixed: fixes[`${it.id}::${d.summary}`] ?? null }))),
        mutations: { run: m.length, killed: m.filter((x) => x.killed).length, survived: m.filter((x) => !x.killed).map((x) => { const why = survivors[`${x.id}|${x.file}|${x.find}`]; return `${x.file}: ${x.find.slice(0, 80)}${why ? ` (${why})` : ''}`; }) },
        // The skeptic's verdict where there is one, read against the code as it stands (after the defects were fixed),
        // else the claim; and mutations run with none killed hold it at partial: its tests protect nothing they were said to.
        verdict: lower(checkById[it.id]?.verdict ?? a.verdict, m.length && !m.some((x) => x.killed) ? 'partial' : undefined),
        claimed: a.verdict,
        ...(checkById[it.id] ? { check: { holds: checkById[it.id].holds, verdict: checkById[it.id].verdict, problems: checkById[it.id].problems, weakTests: checkById[it.id].weakTests } } : {}),
        ...((a.claimCorrection ?? recs.find((x) => x.claimCorrection)?.claimCorrection) ? { claimCorrection: a.claimCorrection ?? recs.find((x) => x.claimCorrection).claimCorrection } : {}),
      };
    }
    // A claim the evidence pass corrected, in the field it names, where that's one of the row's own (entry, reads,
    // changes, downstream, persistent, explanation); anything else stays in the Note.
    // A gap the skeptic named and closed after its check, by a test added since: its verdict, its note and its test.
    const ac = afterCheck[it.id];
    // Only where the note is newer than the latest check of the row: a later check read what the note answered.
    if (ac && it.after && (ac.at ?? 0) > (checkById[it.id]?.checkedAt ?? 0)) { it.after.verdict = ac.verdict; it.after.afterCheck = ac.note; if (ac.test) it.after.tests.push(ac.test); }
    // The row's own fields corrected after the check, where the code it named was changed or removed since.
    if (ac?.fields) for (const [k, v] of Object.entries(ac.fields)) it[k] = v;
    const cc = it.after?.claimCorrection;
    if (cc && ['entry', 'reads', 'changes', 'downstream', 'persistent', 'explanation'].includes(cc.field) && cc.now) it[cc.field] = cc.now;
    // The row's own words corrected last, against the code as it finally stands (doc-fields.json, from 2026-10-13's
    // reconciliation): line references moved by the day's changes, and claims its fixes falsified.
    const df = docFields[it.id];
    if (df) for (const [k, v] of Object.entries(df)) if (['entry', 'reads', 'changes', 'downstream', 'persistent', 'explanation', 'tests', 'issue'].includes(k)) it[k] = v;
    // The Note a re-audit of 2026-10-12 left (corrected.now), where what it cites moved or what it says went (from 2026-10-14).
    if (df?.['corrected.now'] !== undefined && it.corrected) it.corrected.now = df['corrected.now'];
    it.status = (it.after?.verdict ?? r.verdict);
  }
  fs.writeFileSync(f, JSON.stringify(doc, null, 2) + (raw.endsWith('\n') ? '\n' : ''));
}
console.log('merged');
