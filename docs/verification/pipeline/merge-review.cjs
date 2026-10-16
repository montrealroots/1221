// Records the review of 2026-10-13 in docs/verification/audit/*.json: each row's `review` (what it was at fca00d8f, the
// claim read, its evidence by kind, the UI evidence, the verdict, its disposition and gaps), and, where this pass's
// evidence work reported on it, `after` (the tests added, defects fixed, gaps left, mutations run, the verdict now).
// The row's status becomes the verdict now. Run: node merge-review.cjs [evidence-results.json] [mutations.json] [fixes.json]
// From 2026-10-16 it also writes each row's evidence class (`verification`), which its status doesn't move, and its
// `acceptance` where doc-fields.json gives one; and it reads a round of evidence alone (evidence5-results.json, made by
// remaining-fold.cjs), whose records add tests and judge nothing.
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
// A title as renamed since, its describe path (“row > title”) kept, followed to its last name: until 2026-10-16 it was
// looked up once, so a test renamed twice (c-performerTitle’s, “Frau Gabor” and then “Frau Bergmann”) kept its middle
// name in every regeneration, a title its file doesn't hold, and the committed audit's last name wasn't the pipeline's.
const lastName = (t) => { const seen = new Set(); let at = t; while (renames[at] && !seen.has(at)) { seen.add(at); at = renames[at]; } return at; };
const renamed = (t) => { const parts = t.split(' > '); const last = parts.pop(); return [...parts, renames[last] !== undefined ? lastName(last) : renames[t] !== undefined ? lastName(t) : last].join(' > '); };
const gone = (t) => { const last = t.split(' > ').pop(); return [t, last].some((k) => Object.hasOwn(renames, k) && renames[k] === null); };
const afterById = {};
for (const evidence of rounds) for (const g of evidence) for (const r of g.rows ?? []) (afterById[r.id] ??= []).push({ ...r, testFile: g.testFile, round: g.key });
const KIND = { command: 'command', clock: 'command', fixture: 'fixture', function: 'fixture', code: 'inspection', 'long-run': 'long-run', 'built-app': 'built-app', render: 'render', static: 'static' };
// A test its own title labels a fixture is one, whatever kind its round gave it (from 2026-10-16): the last segment says
// FIXTURE (a London, Berlin or Paris life, a LIFE FIXTURE) or begins GUARD, OLDER SAVE or LEGACY STATE. Until then
// scope-fold.cjs took a kind naming render or the clock before one naming a fixture, and the earlier rounds the kind they
// named, so 51 such tests in 22 rows (16 of bank.cancel_new's 18) stood as renders or commands, counted among the tests
// that make a row verified; no verified row rested on them alone, measured that day, and the nine bank rows held no
// fixture at all.
const labelledFixture = (title) => { const last = String(title).split(' > ').pop(); return /\bFIXTURE\b/.test(last) || /^(?:GUARD|OLDER SAVE|LEGACY STATE)\b/.test(last); };
// The evidence class each row is written with (from 2026-10-16, the brief of that day's item 1): how its standing is
// evidenced, beside its status, which it doesn't change. tools/coverage.mjs holds each against the row's evidence.
const CLASS = {
  journey: 'Player Journey',
  engine: 'Retained Engine, On Labelled Fixtures',
  static: 'Documentation And Static Checks',
  deferred: 'Deferred Scope',
  legacy: 'Older Saves Only',
  informational: 'Said Back, Deciding Nothing',
};
// A row the class rule doesn't place by its status, and a static test's standard as read (inputs/classes.json).
const classes = fs.existsSync(S + 'classes.json') ? JSON.parse(fs.readFileSync(S + 'classes.json', 'utf8')) : { rows: {} };
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
      // The latest record that judged the row. A round of evidence alone (this pass's areas, folded by
      // remaining-fold.cjs from 2026-10-16) adds its tests and judges nothing: until then the last record was taken
      // whatever it was, which a record with no verdict would have left with no verdict and no gaps.
      const judged = recs.filter((x) => x.verdict !== undefined);
      const a = judged[judged.length - 1] ?? { gapsOpen: [], verdict: r.verdict };
      const fileOf = (x) => x.testFile.replace(/\\/g, '/').replace(/^.*tests\//, '');
      // Only mutations that applied: one whose text no longer matched (the code it named since fixed) tested nothing.
      const m = mutations.filter((x) => x.id === it.id && x.applied);
      // A static test of a row whose claim is the repository's text, with its standard as read (inputs/classes.json).
      const statics = classes.rows?.[it.id]?.tests ?? {};
      const kindOf = (t, title) => (statics[title.split(' > ').pop()] ? 'static' : labelledFixture(title) ? 'fixture' : KIND[t.evidenceKind] ?? t.evidenceKind);
      it.after = {
        // The day of the latest round that worked the row: the current scope's (scope-*) is 2026-10-15's, this pass's
        // areas' (remaining-*) 2026-10-16's.
        on: recs.some((x) => String(x.round ?? '').startsWith('remaining-')) ? '2026-10-16' : recs.some((x) => String(x.round ?? '').startsWith('scope-')) ? '2026-10-15' : '2026-10-13',
        rounds: recs.length,
        // A test renamed to null was removed with the rule it held (from 2026-10-14): no test holds that claim now.
        tests: recs.flatMap((x) => x.testsAdded.filter((t) => !gone(t.title)).map((t) => {
          const title = renamed(t.title);
          const standard = statics[title.split(' > ').pop()];
          return { file: fileOf(x), title, kind: kindOf(t, title), closes: t.closes, ...(String(x.round ?? '').startsWith('remaining-') ? { round: x.round } : {}), ...(standard ? { standard } : {}) };
        })),
        gapsClosed: recs.flatMap((x) => x.gapsClosed ?? []),
        gapsOpen: a.gapsOpen,
        // The final check's disposition where there is one (it read the code after every fix), else the claim's.
        ...((checkById[it.id]?.disposition ?? a.disposition) ? { disposition: checkById[it.id]?.disposition ?? a.disposition } : {}),
        defects: recs.flatMap((x) => (x.defects ?? []).map((d) => ({ summary: d.summary, where: d.where, fixed: fixes[`${it.id}::${d.summary}`] ?? null }))),
        mutations: { run: m.length, killed: m.filter((x) => x.killed).length, survived: m.filter((x) => !x.killed).map((x) => { const why = survivors[`${x.id}|${x.file}|${x.find}`]; return `${x.file}: ${x.find.slice(0, 80)}${why ? ` (${why})` : ''}`; }) },
        // The skeptic's verdict where there is one, read against the code as it stands (after the defects were fixed),
        // else the claim; and mutations run with none killed hold it at partial: its tests protect nothing they were said to.
        verdict: lower(checkById[it.id]?.verdict ?? a.verdict, m.length && !m.some((x) => x.killed) ? 'partial' : undefined),
        ...(judged.length ? { claimed: a.verdict } : {}),
        ...(checkById[it.id] ? { check: { holds: checkById[it.id].holds, verdict: checkById[it.id].verdict, problems: checkById[it.id].problems, weakTests: checkById[it.id].weakTests } } : {}),
        ...((a.claimCorrection ?? recs.find((x) => x.claimCorrection)?.claimCorrection) ? { claimCorrection: a.claimCorrection ?? recs.find((x) => x.claimCorrection).claimCorrection } : {}),
      };
    }
    // A claim the evidence pass corrected, in the field it names, where that's one of the row's own (entry, reads,
    // changes, downstream, persistent, explanation); anything else stays in the Note.
    // A gap the skeptic named and closed after its check, by a test added since: its verdict, its note and its test.
    const ac = afterCheck[it.id];
    // Only where the note is newer than the latest check of the row: a later check read what the note answered.
    if (ac && it.after && (ac.at ?? 0) > (checkById[it.id]?.checkedAt ?? 0)) {
      it.after.verdict = ac.verdict; it.after.afterCheck = ac.note; if (ac.test) it.after.tests.push(ac.test);
      // A note that verifies the row settles what its last record left open, which stays as history among the gaps
      // closed (from 2026-10-16: until then i-stale-claims, verified by the owner's answer, still said "Still open:
      // partial" beside it; no other row's note had a gap open).
      if (ac.verdict === 'verified' && it.after.gapsOpen?.length) { it.after.gapsClosed = [...it.after.gapsClosed, ...it.after.gapsOpen.map((g) => `Settled after the check: ${g}`)]; it.after.gapsOpen = []; }
    }
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
    // A row out of a current player's reach says so in four parts (from 2026-10-16, the brief of that day's item 3):
    // what a Yale player meets today, the engine's tests on fixtures, whether the owner's scope defers it, and what's
    // unfinished. A field of its own, so an area's corrected `issue`, folded on every regeneration, can't overwrite it.
    if (df?.acceptance) it.acceptance = df.acceptance;
    else delete it.acceptance;
    it.status = (it.after?.verdict ?? r.verdict);
    // Its evidence class, by its status where that settles it (deferred, legacy, informational), by inputs/classes.json
    // where a row's claim is the repository's text, out of reach (unresolved) as the engine on fixtures, else a journey.
    const named = classes.rows?.[it.id];
    const cls = ['deferred', 'legacy', 'informational'].includes(it.status) ? it.status : named?.class ?? (it.status === 'unresolved' ? 'engine' : 'journey');
    it.verification = { class: cls, label: CLASS[cls], ...(named && named.class === cls ? { since: named.since, why: named.why, ...(named.was ? { was: named.was } : {}) } : {}) };
  }
  fs.writeFileSync(f, JSON.stringify(doc, null, 2) + (raw.endsWith('\n') ? '\n' : ''));
}
console.log('merged');
