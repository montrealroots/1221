/**
 * The gameplay coverage matrix (from 2026-10-10): every retained feature the audit of that day traced, in
 * `docs/verification/audit/<area>.json`, from its entry through what it reads and changes to what consumes it, how it's
 * explained and what tests it, with its status as the repairs left it. Writes `docs/GAMEPLAY-COVERAGE.md`; the totals
 * are counted from the items, never typed.
 *
 * An item audited again on 2026-10-12 carries `corrected`: what the row said (`said`), what's true now and the evidence
 * (`now`, which the Note column shows), and the status it had before (`status`) where that moved. The open-items
 * revisit's moves are still counted from the status it left (`corrected.status` where there is one), so a correction
 * doesn't rewrite what the revisit did.
 *
 * A review of that audit, the same day, found the page claiming every test a row names was read, and a row citing
 * cardlife.test.ts:242, a describe's closing brace. So both of what a script can hold are held here, for every row:
 * each test it names by its title (in ‘’ or quotes, cut short with "..." anywhere) is in the test file named before it,
 * and each line it cites (file.test.ts:N, or a range N-M) falls inside a test. Neither says the test checks what the
 * row says.
 *
 * A second review the same day found that check read only a range's first line, so cardlife.test.ts:227-99999 passed,
 * and took a test closed by `}, 120_000);` for one still open, so a line after it passed as inside it. Until then both
 * held. Since then every line of a range is read: each one with anything on it falls inside a test, which runs from
 * its `it(` to the line at its own indent that closes it (`});` or `}, 120_000);`), and a blank line between two tests
 * holds nothing to be inside. Two more parts of the page's standard are held where a script can hold them: a row
 * called verified names a test in the gate (tests/*.test.ts; tools/acceptance-ui.mjs runs outside it and can't make a
 * row verified alone), and a command row called verified names a test file that issues the command.
 *
 * A third review the same day found three more things. Until then the line check read only the first list after a file
 * (file.test.ts:N-M and K-L checked N-M alone) and nothing a row's Note cites; it reads every list now, a bare :N after
 * a file as that file's, and the files and lines the Note cites (`corrected.now`, `settled`, `issue`) as well as Tested
 * By's. A command row called verified with an action (life.look_after:wash) needed only a file that issued the kind;
 * one of its files issues the action too, now. And 37 commands docs/capabilities.json names were in no row while the
 * page said every retained feature was traced, so the two registries could disagree with nothing to say so: every
 * command a live capability names is in a row here or in docs/verification/connected-journey/TRACE.md, and where both
 * name it they agree (a capability called Verified has every row of its commands verified, and a command reached only
 * by a fixture, unresolved here, sits in a capability called Partial). A disagreement fails the run after the page is
 * written, so the page stays what the audit says while the two are brought together.
 *
 * Whether a test checks what reads the change is held by reading, and the reading is recorded where it was done: a row
 * read by eye against the standard carries `read`, true for the whole row, or what was read where it was read in part.
 * A row the third review found in no row carries `traced`, the day it was traced and read. The Totals count the verified
 * rows read apart from those called verified and not read, which until the third review they counted together as
 * verified; until the second review the page named the rows read in a sentence somebody typed. They say what share of
 * the rows called verified were read, by area and in all.
 *
 * A fourth review the same day found the agreement read two directions only: a capability called Verified with a row
 * of its commands not verified, and a command a fixture alone reaches under a capability not called Partial. So a
 * capability called Implemented or Partial could be silent on a command this page calls partial, or keep Verified in
 * its verified layer, with nothing to say so; nine commands disagreed, and docs/capabilities.json named none of them in
 * its limits. Since then, for every command both name, a capability called Verified has every row of the command
 * verified and read; a command not verified here isn't under a verified layer that says Verified; and the capability's
 * limits name the command in a sentence that gives its word here, partial, or unresolved (or out of reach) where only a
 * fixture reaches it. Whether the rest of what the limits say of it agrees with the row (that they don't call checked
 * what the row calls partial) is held by reading. A test whose `it(` line doesn't open a block, or whose close isn't
 * found, spans its own line alone: until then it would have run on to the next close at its indent. No test was one.
 *
 * Checking what the fourth review settled, the same day, found the agreement reading a command's actions as the
 * command: `names` found life.look_after inside life.look_after:order, so a sentence of limits naming the order partial
 * passed for the wash, the workout and the hour unwound, which this page called partial too, while the limits called a
 * shower and an hour unwinding checked. Since then each row not verified is named by its own id, a row of one of the
 * command's actions (life.look_after:wash) by the action's.
 *
 * The review of 2026-10-13 (the owner's brief of that day, section 1) read every row against one standard, the 328 here
 * and the 45 live capabilities, by readers who wrote nothing: what the row claims, the code and what reads it, each
 * test's assertions read, whether it reaches the action as a player does (a command, the clock, the screen) and checks
 * the consequence with an expectation of its own, and the UI evidence a row about a screen needs. Each row carries it as
 * `review`: where it stood at `fca00d8f` (`before`), its evidence by kind, the verdict and its gaps; and where that
 * pass's own work reached it, `after`: the tests added, the defects fixed, the gaps left and the mutations run. Its
 * status is the verdict now. Until then a row could be called verified and not read (134 were), and the page counted
 * them apart. Since then every row has a review, and a row called verified has at least one test in the gate that
 * reaches the action through a command, the clock or the rendered screen, checks the consequence, and expects what
 * an independent reading gives: a fixture, a function called in its place, the code read, the built app or a long run
 * supports a row and never makes it verified alone. The capabilities' own reviews are
 * `docs/verification/review-2026-10-13/capabilities.json`, one for every live capability. Since then too the gate runs
 * this page's check.
 *
 *   node tools/coverage.mjs           writes docs/GAMEPLAY-COVERAGE.md
 *   node tools/coverage.mjs --check   fails when the page is behind the JSON
 * Both fail on a citation that doesn't land, a verified row the script can see isn't, or a command the two registries
 * disagree on.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const AREAS = [
  ['life', 'Life, Health And Time'],
  ['school', 'School'],
  ['money', 'Money'],
  ['papers', 'Papers'],
  ['ui', 'Creation, Profile, Home And The Looks'],
];
const ORDER = ['verified', 'partial', 'unresolved', 'deferred', 'legacy', 'informational'];
/** Where a row stood at `fca00d8f`, before the review of 2026-10-13, in the order the page lists them. */
const BEFORE = ['verified, read', 'verified, not read', 'partial', 'unresolved', 'legacy', 'informational'];
/** Evidence kinds, as the review records them: what can make a row verified, and what supports one. */
const HOLDS = new Set(['command', 'render']);
const KINDS = ['command', 'render', 'fixture', 'inspection', 'built-app', 'long-run'];
/** The evidence that makes a row verified: a test in the gate that reaches the action, checks the consequence and expects independently. */
const holding = (i) => [
  ...(i.review?.evidence ?? []).filter((e) => HOLDS.has(e.kind) && e.reachesAction && e.checksConsequence && e.independent),
  ...(i.after?.tests ?? []).filter((t) => HOLDS.has(t.kind)),
];
/** A row's evidence by kind, the review's and the tests added since. */
const evidenceCell = (i) => {
  const n = Object.fromEntries(KINDS.map((k) => [k, 0]));
  for (const e of i.review?.evidence ?? []) n[e.kind] = (n[e.kind] ?? 0) + 1;
  for (const t of i.after?.tests ?? []) n[t.kind] = (n[t.kind] ?? 0) + 1;
  const said = KINDS.filter((k) => n[k]).map((k) => `${k} ${n[k]}`).join(', ');
  return `${said || 'none'}; ${holding(i).length} hold${i.after?.tests?.length ? `; ${i.after.tests.length} added 2026-10-13` : ''}`;
};
const nowOf = (i) => i.status;
/** A row's Note: a claim corrected on 2026-10-13 and what's still open, else what the row said before. */
const noteOf = (i) => {
  const fixed = i.after?.claimCorrection ? `Corrected on 2026-10-13${i.after.claimCorrection.field ? ` (${i.after.claimCorrection.field})` : ''}: ${i.after.claimCorrection.now}` : '';
  const open = i.after?.gapsOpen?.length ? `Still open: ${i.after.gapsOpen.join(' ')}` : '';
  return [fixed, open, i.after?.afterCheck ?? ''].filter(Boolean).join(' ') || (i.corrected?.now ?? i.settled ?? i.issue);
};
const percent = (n, of) => (of ? `${Math.round((100 * n) / of)}%` : '—');
const cell = (v) => (v === undefined || v === null || v === '' ? '—' : String(Array.isArray(v) ? v.join('; ') : v).replace(/\|/g, '/').replace(/\n/g, ' '));

const totals = Object.fromEntries(ORDER.map((s) => [s, 0]));
const sections = [];
const rows = [];
/** Items whose status the open-items revisit moved (`previous`), for the count's explanation. */
const moved = [];
/** Items audited again on 2026-10-12 and corrected (`corrected`). */
const corrected = [];
/** Items in no row until the third review of 2026-10-12, traced and read that day (`traced`). */
const traced = [];
/** Every item with its area's title, for the review of 2026-10-13. */
const reviewed = [];
/** Every item, by area, for the agreement with docs/capabilities.json. */
const everyItem = [];
/** The status the open-items revisit left, before any correction of 2026-10-12. */
const revisited = (i) => i.corrected?.status ?? i.status;
const statusCell = (i) => {
  if (i.corrected?.status && i.corrected.status !== i.status) return `${i.status} (${i.corrected.status} until 2026-10-12)`;
  return `${i.status}${i.previous && i.previous !== i.status ? ` (was ${i.previous})` : i.auditStatus && i.auditStatus !== i.status ? ` (was ${i.auditStatus})` : ''}`;
};

/** A test file's lines, read once; null where there's no such file. */
const testFiles = {};
const testLines = (file) => (testFiles[file] ??= existsSync(`tests/${file}`) ? readFileSync(`tests/${file}`, 'utf8').split('\n') : null);
const TEST_OPENS = /\b(it|describe)\(\s*(['"`])((?:\\.|(?!\2).)*)\2/;
const testsIn = (lines) => lines.flatMap((line, n) => { const m = line.match(TEST_OPENS); return m ? [{ kind: m[1], title: m[3], line: n + 1 }] : []; });
const plainQuotes = (s) => s.replace(/[’‘]/g, "'").replace(/\\'/g, "'").trim();
/** Each test in a file as the lines it runs over, from its `it(` to the line at its own indent that closes it. */
const testSpans = {};
const spansIn = (file) => (testSpans[file] ??= (() => {
  const lines = testLines(file);
  return testsIn(lines).filter((t) => t.kind === 'it').map((t) => {
    const indent = lines[t.line - 1].search(/\S/);
    // A test on one line, or one whose close isn't found, is its own line and no more.
    if (!/\{\s*$/.test(lines[t.line - 1])) return { from: t.line, to: t.line };
    let close = t.line;
    while (close < lines.length && !(lines[close].search(/\S/) === indent && /^\s*\}/.test(lines[close]))) close += 1;
    return { from: t.line, to: close < lines.length ? close + 1 : t.line };
  });
})());
/** The first line of a cited line or range that isn't inside a test, or nothing where every line is. */
function outsideATest(file, cited) {
  const lines = testLines(file);
  const [from, to = from] = cited.split('-').map(Number);
  if (!(from >= 1 && to >= from)) return `${file}:${cited} isn’t a line or a range`;
  const inside = (n) => spansIn(file).some((s) => s.from <= n && n <= s.to);
  for (let n = from; n <= to; n += 1) {
    const text = lines[n - 1];
    if (text === undefined) return `${file}:${cited} runs past the file’s ${lines.length} lines`;
    // A blank line between two tests holds nothing; a range still begins and ends on a line inside one.
    if (!text.trim() && n !== from && n !== to) continue;
    if (!text.trim() || !inside(n)) return `${file}:${cited}: line ${n} isn’t inside a test`;
  }
  return undefined;
}
/** A list of lines after a file: N, N-M, joined by commas or "and" (file.test.ts:44-108,112-168 and 170). */
const LINES = String.raw`\d+(?:-\d+)?(?:(?:\s*,\s*|\s+and\s+)\d+(?:-\d+)?)*`;
const linesOf = (list) => list.split(/\s*,\s*|\s+and\s+/).map((x) => x.trim()).filter(Boolean);
/**
 * What of a text's citations doesn't land: a file that isn't there, a line outside a test, and, where `titles`, a
 * title not in its file. A file name sets the file the titles and the bare lines (", :194") after it are in; a closing
 * ’ inside a word (won’t) isn't the quote's end.
 */
function landing(text, titles, files = new Set()) {
  const missed = [];
  const CITED = new RegExp(String.raw`([\w./-]+\.test\.ts)(?::(${LINES}))?|(?<=[\s,;(]):(${LINES})|‘((?:[^’]|’(?=[a-z]))+)’|"([^"]+)"|'((?:[^']|'(?=[a-z])){12,})'`, 'g');
  let file;
  for (const m of (text ?? '').matchAll(CITED)) {
    if (m[1]) {
      file = m[1].replace(/^tests\//, '');
      if (!testLines(file)) { missed.push(`no tests/${file}`); file = undefined; continue; }
      files.add(file);
      for (const cited of linesOf(m[2] ?? '')) { const out = outsideATest(file, cited); if (out) missed.push(out); }
      continue;
    }
    if (!file) continue;
    if (m[3]) { for (const cited of linesOf(m[3])) { const out = outsideATest(file, cited); if (out) missed.push(out); } continue; }
    if (!titles) continue;
    const title = plainQuotes(m[4] ?? m[5] ?? m[6]);
    const parts = title.split(/\.\.\.|…/).map((p) => p.trim()).filter((p) => p.length >= 3);
    const holds = (t) => { let from = 0; const said = plainQuotes(t.title); for (const p of parts) { const k = said.indexOf(p, from); if (k < 0) return false; from = k + p.length; } return true; };
    if (!testsIn(testLines(file)).some(holds)) missed.push(`${file} has no test ‘${title}’`);
  }
  return missed;
}
/**
 * What of a row's citations doesn't land, in Tested By (files, lines and titles) and in what its Note shows (files and
 * lines: a Note quotes the screen as often as a test); and, for a row called verified, no test in the gate named, or,
 * for a command, none of the files named issuing it (its kind, and its action where the row has one).
 */
function citationsMissed(i) {
  const files = new Set();
  const missed = landing(i.tests, true, files);
  for (const note of [i.corrected?.now, i.settled, i.issue]) missed.push(...landing(note, false).map((m) => `Note: ${m}`));
  if (i.status === 'verified' && !files.size) missed.push('verified, and it names no test in the gate (tests/*.test.ts)');
  if (i.status === 'verified' && i.kind === 'command' && files.size) {
    const [kind, action] = i.id.split(/[: ]/);
    const issues = (f) => testLines(f).some((l) => l.includes(`'${kind}'`)) && (!action || testLines(f).some((l) => l.includes(`'${action}'`)));
    if (![...files].some(issues)) missed.push(`verified, and no test file it names issues ${kind}${action ? ` with ${action}` : ''}`);
  }
  return missed;
}
/** Citations that don't land, and verified rows the script can see aren't, by item. */
const stale = [];
/** By area: the verified rows, how many of them were read by eye against the standard, and which rows were read. */
const readByEye = [];

for (const [area, title] of AREAS) {
  const a = JSON.parse(readFileSync(`docs/verification/audit/${area}.json`, 'utf8'));
  const count = Object.fromEntries(ORDER.map((s) => [s, 0]));
  const readHere = [];
  const readInPart = [];
  for (const i of a.items) {
    everyItem.push(i);
    count[i.status] = (count[i.status] ?? 0) + 1;
    totals[i.status] = (totals[i.status] ?? 0) + 1;
    if (i.previous && i.previous !== revisited(i)) moved.push({ title, i });
    if (i.corrected) corrected.push({ title, i });
    if (i.traced) traced.push({ title, i });
    for (const miss of citationsMissed(i)) stale.push(`${area} ${i.id}: ${miss}`);
    if (i.review?.on !== '2026-10-13') stale.push(`${area} ${i.id}: no review of 2026-10-13`);
    else if (!BEFORE.includes(i.review.before)) stale.push(`${area} ${i.id}: review.before is ${JSON.stringify(i.review.before)}, not one of ${BEFORE.join(', ')}`);
    if (i.status === 'verified' && !holding(i).length) stale.push(`${area} ${i.id}: verified, and no test in the gate reaches the action, checks the consequence and expects independently`);
    // A test's own title, its describe path (cited as “row > title”) left off, as the file's titles are read.
    for (const t of i.after?.tests ?? []) for (const miss of landing(`${t.file} ‘${t.title.split(' > ').pop().replace(/’/g, "'")}’`, true)) stale.push(`${area} ${i.id}: added: ${miss}`);
    reviewed.push({ title, i });
    if (i.read === true) readHere.push(i);
    else if (typeof i.read === 'string') readInPart.push(i);
    else if (i.read !== undefined) stale.push(`${area} ${i.id}: read is true or what was read, not ${JSON.stringify(i.read)}`);
    if (i.traced && i.read !== true) stale.push(`${area} ${i.id}: traced on ${i.traced}, and not read whole`);
  }
  readByEye.push({ title, whole: readHere, inPart: readInPart });
  rows.push([title, a.items.length, ...ORDER.map((s) => count[s]), percent(count.verified, a.items.length - count.deferred - count.legacy - count.informational)]);
  const body = [
    `## ${title}`, '',
    `${a.items.length} items: ${ORDER.map((s) => `${count[s]} ${s}`).join(', ')}.`, '',
    '| Item | Kind | Entry | Reads | Changes | Downstream | Persists | Explained | Tested by | Evidence (2026-10-13) | Status | At fca00d8f | Note |',
    '|---|---|---|---|---|---|---|---|---|---|---|---|---|',
    ...[...a.items].sort((x, y) => ORDER.indexOf(x.status) - ORDER.indexOf(y.status)).map((i) => `| ${cell(i.id)} | ${cell(i.kind)} | ${cell(i.entry)} | ${cell(i.reads)} | ${cell(i.changes)} | ${cell(i.downstream)} | ${cell(i.persistent)} | ${cell(i.explanation)} | ${cell([i.tests, ...(i.after?.tests ?? []).map((t) => `${t.file} ‘${t.title}’`)].filter(Boolean).join('; '))} | ${cell(evidenceCell(i))} | ${statusCell(i)} | ${cell(i.review?.before)} | ${cell(noteOf(i))} |`),
    '',
  ];
  sections.push(body.join('\n'));
}

/**
 * The agreement with docs/capabilities.json, on every command a live capability (not Retired) names: it's in a row
 * here or in the connected-journey trace; a capability called Verified has every row of its commands verified and
 * read; a command not verified here isn't under a verified layer that says Verified, and the capability's limits name
 * each of its rows not verified, by the row's own id, in a sentence that gives its word here; and a command unresolved
 * here, reached only by a fixture, sits in a capability called Partial. Until the fourth review of 2026-10-12 only the
 * first, a Verified capability's rows verified, and the last were held, and until its settlement was checked the
 * command's kind named every action of it.
 */
const disagree = [];
const capabilities = JSON.parse(readFileSync('docs/capabilities.json', 'utf8')).capabilities.filter((c) => c.status !== 'Retired');
const TRACE = readFileSync('docs/verification/connected-journey/TRACE.md', 'utf8');
const CAP_REVIEW = 'docs/verification/review-2026-10-13/capabilities.json';
// Every live capability reviewed on 2026-10-13.
if (existsSync(CAP_REVIEW)) { const had = new Set(JSON.parse(readFileSync(CAP_REVIEW, 'utf8')).map((c) => c.id)); for (const c of capabilities) if (!had.has(c.id)) disagree.push(`${c.id}: a live capability with no review of 2026-10-13 in ${CAP_REVIEW}`); }
const rowsOf = (command) => everyItem.filter((i) => i.kind === 'command' && (i.id === command || i.id.startsWith(`${command}:`)));
/** A text's sentences: it ends at a stop, and the next begins with a capital, a quote, a bracket or code. */
const sentencesOf = (text) => (text ?? '').split(/(?<=[.!?])\s+(?=[A-Z‘“(`])/);
const names = (sentence, command) => new RegExp(String.raw`(?<![\w.])${command.replace(/\./g, '\\.')}(?!\w)`).test(sentence);
/** The words a capability's limits may give a command that isn't verified here: its status here, or out of reach. */
const WORDS = { partial: /\bpartial\b/i, unresolved: /\bunresolved\b|\bout of reach\b/i, deferred: /\bdeferred\b/i };
let bothName = 0;
for (const c of capabilities) for (const command of c.commands ?? []) {
  const mine = rowsOf(command);
  if (!mine.length) { if (!TRACE.includes(`\`${command}\``)) disagree.push(`${command}: named by ${c.id} (${c.status}), and in no row here or in TRACE.md`); continue; }
  bothName += 1;
  const short = mine.filter((i) => i.status !== 'verified');
  const said = (i) => `${i.id} is ${i.status}`;
  if (c.status === 'Verified' && short.length) disagree.push(`${command}: ${c.id} is Verified, and ${short.map(said).join(', ')} here`);
  const unread = mine.filter((i) => i.status === 'verified' && i.review?.on !== '2026-10-13');
  if (c.status === 'Verified' && unread.length) disagree.push(`${command}: ${c.id} is Verified, and ${unread.map((i) => i.id).join(', ')} is called verified here and not reviewed`);
  if (mine.some((i) => i.status === 'unresolved') && c.status !== 'Partial') disagree.push(`${command}: unresolved here, reached only by a fixture, and ${c.id} is ${c.status}, not Partial`);
  if (short.length && c.layers?.verified === 'Verified') disagree.push(`${command}: ${short.map(said).join(', ')} here, and ${c.id}’s verified layer is Verified`);
  // Each row by its own id: a row of one of the command's actions (life.look_after:wash) by the action's, which the
  // command's kind alone doesn't name.
  for (const i of short) {
    const word = WORDS[i.status];
    if (!word) continue;
    if (!sentencesOf(c.limits).some((s) => names(s, i.id) && word.test(s))) disagree.push(`${command}: ${said(i)} here, and no sentence of ${c.id}’s limits names ${i.id === command ? 'it' : i.id} as ${i.status}`);
  }
}

const demoted = corrected.filter(({ i }) => i.corrected.status && i.corrected.status !== i.status);
// The page says the corrections moved rows from verified, to partial where a test checked less than the row said and
// to unresolved where only a fixture reached it; a correction that moved any other way would make that false, so it
// stops here instead. Until the second review of 2026-10-12 every one went to partial, and the page said only that.
for (const { i } of demoted) if (i.corrected.status !== 'verified' || !['partial', 'unresolved'].includes(i.status)) throw new Error(`${i.id}: corrected from ${i.corrected.status} to ${i.status}, which the page doesn’t say`);
const demotedTo = (s) => demoted.filter(({ i }) => i.status === s).length;
const all = Object.values(totals).reduce((a, b) => a + b, 0);
const tracedTo = (s) => traced.filter(({ i }) => i.status === s).length;
/** Rows traced and verified by the third review that the fourth moved. */
const tracedMoved = traced.filter(({ i }) => i.corrected?.status === 'verified' && i.status !== 'verified').length;
const ids = (items) => items.map((i) => i.id).join(', ');
/** What can be verified: every row but the deferred, the legacy and the informational. */
const canBe = all - totals.deferred - totals.legacy - totals.informational;

/**
 * The review of 2026-10-13, and what came of it: where each row stood at fca00d8f and where it stands now, the rows
 * called verified and not read, the rows that were partial, the evidence by kind, the capabilities reviewed, and how
 * this page's rows and the capabilities' count differently.
 */
function reviewSection() {
  const cross = BEFORE.map((b) => [b, ...ORDER.map((s) => reviewed.filter(({ i }) => i.review?.before === b && nowOf(i) === s).length)]);
  const of = (b) => reviewed.filter(({ i }) => i.review?.before === b);
  const unreadRows = of('verified, not read');
  const partialRows = of('partial');
  const added = reviewed.reduce((n, { i }) => n + (i.after?.tests?.length ?? 0), 0);
  const files = new Set(reviewed.flatMap(({ i }) => (i.after?.tests ?? []).map((t) => t.file)));
  const fixed = reviewed.flatMap(({ i }) => (i.after?.defects ?? []).filter((d) => d.fixed));
  const mutRun = reviewed.reduce((n, { i }) => n + (i.after?.mutations?.run ?? 0), 0);
  const mutKilled = reviewed.reduce((n, { i }) => n + (i.after?.mutations?.killed ?? 0), 0);
  const has = (i, k) => (i.review?.evidence ?? []).some((e) => e.kind === k) || (i.after?.tests ?? []).some((t) => t.kind === k);
  const holds = (i, k) => holding(i).some((e) => e.kind === k);
  const byKind = KINDS.map((k) => [k, reviewed.filter(({ i }) => has(i, k)).length, HOLDS.has(k) ? String(reviewed.filter(({ i }) => holds(i, k)).length) : '—']);
  const none = reviewed.filter(({ i }) => !KINDS.some((k) => has(i, k))).length;
  const held = reviewed.filter(({ i }) => holding(i).length).length;
  const what = (i) => {
    const a = i.after;
    if (!a) return i.review?.verdict === nowOf(i) ? 'As the review found it' : '—';
    const parts = [];
    if (a.tests?.length) parts.push(`${a.tests.length} test${a.tests.length === 1 ? '' : 's'} added`);
    const f = (a.defects ?? []).filter((d) => d.fixed).length;
    if (f) parts.push(`${f} defect${f === 1 ? '' : 's'} fixed`);
    if (a.claimCorrection) parts.push('its claim corrected');
    if (a.gapsOpen?.length) parts.push(`${a.gapsOpen.length} gap${a.gapsOpen.length === 1 ? '' : 's'} left`);
    return parts.join(', ') || 'Read again, nothing added';
  };
  const caps = existsSync(CAP_REVIEW) ? JSON.parse(readFileSync(CAP_REVIEW, 'utf8')) : [];
  return [
    '## The Review Of 2026-10-13',
    '',
    `The owner’s brief of 2026-10-13 asked for every coverage claim held to one standard. Every row here and every live capability was read on that day against \`fca00d8f\` by readers who changed nothing: what the row claims, the code and what reads the change, each test’s assertions read, whether the test reaches the action as a player does and checks the consequence with an expectation of its own, and the UI evidence a row about a screen needs. Each row keeps it as \`review\` in \`docs/verification/audit/*.json\`. The evidence is recorded by kind: **command** (a test in the gate that issues the command or runs the clock), **render** (a test in the gate that renders the screen and reads it), **fixture** (state set by hand, or a function called in place of the command or the clock), **inspection** (the code read), **built-app** (\`tools/acceptance-ui.mjs\`, outside the gate) and **long-run** (played lives and scenarios). Only the first two make a row verified, and only where the test reaches the action, checks the consequence and expects what an independent reading of the rule gives; the rest support. The pass that followed added ${added} tests in ${files.size} files for the rows the review left partial, fixed ${fixed.length} defects the tests found, and ran ${mutRun} mutations of the code those tests protect, ${mutKilled} of them killed; what each row gained is its \`after\`.`,
    '',
    '### Where Each Row Stood, And Where It Stands',
    '',
    `Rows by where they stood at \`fca00d8f\` (down) and their status now (across), all ${all}.`,
    '',
    `| At fca00d8f | Rows | ${ORDER.map((s) => s[0].toUpperCase() + s.slice(1)).join(' | ')} |`,
    `|---|---|${ORDER.map(() => '---').join('|')}|`,
    ...cross.map(([b, ...n]) => `| ${b} | ${n.reduce((x, y) => x + y, 0)} | ${n.join(' | ')} |`),
    '',
    '### The Rows Called Verified And Not Read',
    '',
    `${unreadRows.length} rows were called verified at \`fca00d8f\` without being read. The review found ${unreadRows.filter(({ i }) => i.review.verdict === 'verified').length} of them verified, ${unreadRows.filter(({ i }) => i.review.verdict === 'partial').length} partial, and ${unreadRows.filter(({ i }) => !['verified', 'partial'].includes(i.review.verdict)).length} otherwise; now ${unreadRows.filter(({ i }) => nowOf(i) === 'verified').length} are verified.`,
    '',
    '| Area | Item | The Review Found | Its Gaps | What Was Done | Now |',
    '|---|---|---|---|---|---|',
    ...unreadRows.map(({ title, i }) => `| ${title} | ${cell(i.id)} | ${i.review.verdict}${i.review.disposition ? ` (${i.review.disposition})` : ''} | ${i.review.gaps.length} | ${what(i)} | ${nowOf(i)} |`),
    '',
    '### The Rows That Were Partial',
    '',
    `${partialRows.length} rows were partial at \`fca00d8f\`. Each has a disposition from the review: missing evidence (it works, and no test showed it), missing implementation (in this build’s scope, and wrong or absent), a stale claim (the row said what the code doesn’t do), or deferred or removed (the owner’s). Now ${partialRows.filter(({ i }) => nowOf(i) === 'verified').length} are verified.`,
    '',
    '| Area | Item | Disposition | What Was Done | Gaps Left | Now |',
    '|---|---|---|---|---|---|',
    ...partialRows.map(({ title, i }) => `| ${title} | ${cell(i.id)} | ${i.review.disposition ?? i.review.verdict} | ${what(i)} | ${cell(i.after?.gapsOpen?.length ? i.after.gapsOpen.join(' ') : i.review.verdict === 'verified' ? '' : i.after ? '' : i.review.gaps.join(' '))} | ${nowOf(i)} |`),
    '',
    '### The Evidence, By Kind',
    '',
    `The rows with each kind of evidence, a row counted under every kind it has, and, for the two kinds that can make a row verified, the rows where at least one holds: reaches the action, checks the consequence and expects independently. ${held} of the ${all} rows have evidence that holds; ${none} have none of any kind.`,
    '',
    '| Kind | Rows With It | Rows Where It Holds |',
    '|---|---|---|',
    ...byKind.map(([k, n, h]) => `| ${k} | ${n} | ${h} |`),
    '',
    '### The Capabilities, Reviewed',
    '',
    `The ${caps.length} live capabilities of \`docs/capabilities.json\`, read the same day against the same standard (\`${CAP_REVIEW}\`). The units differ: a row here is one command, scheduled kind, system, knob, trait or panel, ${all} of them; a capability is a player’s goal, naming the commands it runs, so one capability spans several rows, and its verified layer can say Verified only where every row of its commands is verified here. ${bothName} commands are named by both; a command only a capability names is traced in \`docs/verification/connected-journey/TRACE.md\`. A capability’s verdict here is the review’s, of the goal as a whole, and moves with its rows, not apart from them.`,
    '',
    '| Capability | Status In The Registry | The Review Found | Disposition | Gaps |',
    '|---|---|---|---|---|',
    ...caps.map((c) => `| ${cell(c.id)} | ${cell(capabilities.find((x) => x.id === c.id)?.status ?? 'Retired')} | ${c.verdict} | ${cell(c.partialClass === 'none' ? '' : c.partialClass)} | ${(c.gaps ?? []).length} |`),
  ];
}
const page = [
  '# Gameplay Coverage',
  '',
  'Every retained feature traced from where the player meets it to what it changes and who reads the change: entry, preconditions and state read, the calculation and the state changed, the downstream consumer, what persists, how it is explained, and what tests it. Audited on 2026-10-10 against `43d10f8b`, and its open items revisited after `9ae9879b` (`docs/verification/open-items.json` holds each one’s disposition, recorded before the work, and its outcome). Written by `node tools/coverage.mjs` from `docs/verification/audit/*.json`.',
  '',
  `Audited again on 2026-10-12, after the connected-journey pass, and every row that pass changed was brought up to date (Corrected On 2026-10-12, below). Four reviews of that audit the same day found it said more than was done, and every row they named was settled by the standard below; the rows read by eye against it are listed under Read By Eye, and the Totals count the verified rows read apart from those called verified and not read. The third found ${traced.length} commands that came in after the audit and its revisit (from \`f899ecd7\`, 2026-10-10, and later) in no row, while this page said every retained feature was traced; each is traced and read now (Traced On 2026-10-12, below). The fourth found rows verified on the change alone, or on a reader the clock calls run by the test in its place: a medical debt’s report a year on, a tax plan revised or caught up and never played on, a term’s maturity after its interest is taken, a stopped debit card’s purchases, a dismissed decision’s refusal, savings linked behind the current account and never reached by a card’s autopay or a loan, and an overdraft’s fee once opted into; each is partial now and says what isn’t checked. Checking what the fourth settled, the same day, found more verified on a reader no test reaches through the command: an elective shift’s payday and the wages it records for the return, a kept plan’s hold on sleep and Look After, a treatment’s later months, tolls and emergencies, what a doctor chosen decides, a meal’s hunger toll, and a decision acted on refused a second time; each is partial now too. Every row is checked by \`tools/coverage.mjs\`, which writes this page and fails when one doesn’t hold: each test it names by its title is in the file it names, each line it or its Note cites falls inside a test, every line of every range, a row called verified names a test in the gate, and a command called verified names a test file that issues it, its action too. It fails as well where this page and \`docs/capabilities.json\` disagree on a command: every command a live capability names is in a row here or in the connected-journey trace (${bothName} are here); a capability called Verified has every row of its commands verified and read; a command not verified here isn’t under a capability whose verified layer says Verified, and the capability’s limits name each of its rows not verified, by the row’s own name (life.look_after:wash for one of its actions), in a sentence that gives its word here, partial, or unresolved (or out of reach) where only a fixture reaches it; and a command reached only by a fixture sits in a capability called Partial. Until the fourth review it held only the first, a Verified capability’s rows verified, and the last, so a capability called Implemented or Partial could be silent on a command this page calls partial, or keep Verified in its verified layer; and until its settlement was checked a sentence naming a command named every action of it, so limits that called one action of life.look_after partial passed for three more. Whether the rest of what the limits say of a command agrees with its row (that they don’t call checked what the row calls partial) is held by reading. Whether a test checks what reads the change is held only by reading: until the first review this page said every test a row names was read for it, until the second the rows read were named in a sentence somebody typed, and until the third the Totals counted every row called verified as verified, read or not. What the pass added is traced in \`docs/verification/connected-journey/TRACE.md\`, not here: a piece judged in its segments, the scene together with a partner or a company, the workbook’s commands, a brief’s reader, the director’s craft notes, the actor’s work so far, and the guide’s reference.`,
  '',
  '**Verified**: traced end to end, and a named test in the gate (`tests/*.test.ts`) checks what the row says reads the change (its Downstream), driving the change through the engine, by a command or the clock. A test that sets the change or its reader’s input by hand, or calls a function in place of the command or the clock, checks less: the row says so, and where what reads the change is checked only that way, or not at all, it’s partial. A reader the clock calls on its own (the day’s draw, the idle check, a rehearsal kept) called by the test in its place, or given its draw, is one of those. A precondition set by hand (wages typed in, a document put in) is setup, where the command and what reads it still run through the engine. A reader called after the command, on the state the command left, is checked by that call: its figure read (cardRoom after card.lock), or a purchase made through the engine’s own spend, the way every day’s shopping is made, where spend is what reads the change. What checks less is the same reader called on state set by hand, given its draw, or run in place of the clock that runs it: a function called in place of the command or the clock. Until the fourth review this page counted those two as setup without drawing that line, and `docs/capabilities.json` said any function called directly checked less, so a row could pass one standard and owe a word under the other. On a life no new one lives, the row says that too where the place decides what’s tested (a bank’s terms, a state’s or a country’s rule, a published wait). The rows the third review read say it; until then most bank rows ran on New York, Icelandic or London lives and didn’t. A reader that only shows (a suggestion, a look) is under Explained, not Downstream. A trait or a knob is the input itself, so its row is checked by twins: a test that varies it alone and checks the reader the row names. A Home or Profile row is a panel, and what it shows and what its controls do are what it’s for: it’s verified where a test renders it and checks that, the row naming what the test doesn’t read, and a test of the engine function a panel calls checks the figure, not the panel. `tools/acceptance-ui.mjs` plays the built app outside the gate: it can support a row and never makes one verified alone. Until 2026-10-12 a test that exercised the command was taken for that, and rows were verified on a test that checked the change and not its reader, on a fixture no new life reaches, or on no test; they’re corrected below. A row called verified and not read is verified only as the audit of 2026-10-10 and the open-items revisit left it: its Status says so, and the Totals don’t count it as verified. Mutation-tested only where a repair’s commit says so; the rest were traced, not mutated. **Partial**: works, with a named gap (untested, tested only by hand or as a function, or a consumer missing). **Unresolved**: declared or reachable only through systems the owner removed, or reached only by a fixture (a place no new life lives, such as a bank, a card or a country’s rule no New Haven life has), reported rather than deleted, each with its recommendation where the owner decides. **Legacy**: a compatibility path for a save from before 2026-10-09, tested through legacy state; no new life reaches it. **Informational**: said back to the player and meant to decide nothing (a name, a portrait).',
  '',
  `## Totals`,
  '',
  '| Area | Items | Verified | Partial | Unresolved | Deferred | Legacy | Informational | Verified, Of What Can Be |',
  '|---|---|---|---|---|---|---|---|---|',
  ...rows.map((r) => `| ${r.join(' | ')} |`),
  `| **All** | **${all}** | ${ORDER.map((s) => `**${totals[s]}**`).join(' | ')} | **${percent(totals.verified, canBe)}** |`,
  '',
  `**What the numbers are:** each row is counted once, by its status now, and every one of the ${all} has been read against the standard by the review of 2026-10-13 (below). Verified: ${totals.verified} of the ${all} rows (${percent(totals.verified, all)}), and of the ${canBe} that can be verified (${percent(totals.verified, canBe)}): the ${totals.deferred} deferred are the owner’s, out of this build, the ${totals.legacy} legacy are paths only a save from before reaches, and the ${totals.informational} informational decide nothing, so those ${totals.deferred + totals.legacy + totals.informational} are left out of what can be. Partial: works, with a gap named in the row. Unresolved: reached only by a fixture or a removed system. Until 2026-10-13 this table counted ${134} rows as called verified and not read, apart from the verified; none is now.`,
  '',
  ...reviewSection(),
  '',
  '## Read By Eye On 2026-10-12',
  '',
  'Superseded by the review of 2026-10-13, which read every row; kept as that day left it. Each row’s tests and code, read against the standard on 2026-10-12: every row the four reviews named, in the settlement of each, every command row of a capability `docs/capabilities.json` called Verified that day, and every command found in no row. A row read for only what a review named in it is listed apart, and not counted as read; a verified row not listed wasn’t read.',
  '',
  '| Area | Read Whole | Read In Part |',
  '|---|---|---|',
  ...readByEye.map((r) => `| ${r.title} | ${cell(ids(r.whole))} | ${cell(r.inPart.map((i) => `${i.id} (${i.read})`).join('; '))} |`),
  '',
  '## Traced On 2026-10-12',
  '',
  `${traced.length} commands that \`docs/capabilities.json\` names came in after the audit of 2026-10-10 and its revisit, and were in no row until the third review of 2026-10-12 found them: a leave and its way back, a repeated year and an Incomplete, the Yale account and the aid office, a state’s tax and the payment plans, the liens, the Social Security number, a second bank, and a switch’s last steps. Each was traced that day and read against the standard, and stands at ${tracedTo('verified')} verified, ${tracedTo('partial')} partial and ${tracedTo('unresolved')} unresolved, reached only by a fixture; ${tracedMoved} of the partial were verified until the fourth review read them again. Its row is in its area below, with the rest.`,
  '',
  '| Area | Item | Status | Note |',
  '|---|---|---|---|',
  ...traced.map(({ title, i }) => `| ${title} | ${cell(i.id)} | ${statusCell(i)} | ${cell(i.corrected?.now ?? i.issue)} |`),
  '',
  '## What Moved, And Why',
  '',
  `${moved.length} items moved status when the open items were revisited. A row says what moved it: built or connected, tested, or reclassified. A reclassification isn’t new functionality.`,
  '',
  '| Area | Item | Was | Now | Why |',
  '|---|---|---|---|---|',
  ...moved.map(({ title, i }) => `| ${title} | ${cell(i.id)} | ${i.previous} | ${revisited(i)} | ${cell(i.settled)} |`),
  '',
  '## Corrected On 2026-10-12',
  '',
  `${corrected.length} rows were corrected when the matrix was audited again on 2026-10-12 and reviewed four times, ${demoted.length} of them from verified: ${demotedTo('partial')} to partial, and ${demotedTo('unresolved')} to unresolved, reached only by a fixture. Each said more than its test checked, was verified on a fixture no new life reaches, named a test by a name it no longer has or none that checks it, described what the code no longer does, or didn’t say its tests ran on a life no new one lives where the place decides what they test. A row a review found moved the wrong way is back where its test puts it, and says so. A row says what it said and what it says now, with the evidence; the same words are in its Note below. Nothing here is new functionality: where the code changed, the row says when and why.`,
  '',
  '| Area | Item | Status | Said | Says Now |',
  '|---|---|---|---|---|',
  ...corrected.map(({ title, i }) => `| ${title} | ${cell(i.id)} | ${statusCell(i)} | ${cell(i.corrected.said)} | ${cell(i.corrected.now)} |`),
  '',
  ...sections,
].join('\n');

const path = 'docs/GAMEPLAY-COVERAGE.md';
if (stale.length) { console.error(`${stale.length} thing${stale.length === 1 ? '' : 's'} in docs/verification/audit/*.json ${stale.length === 1 ? 'doesn’t' : 'don’t'} hold:\n${stale.join('\n')}`); process.exit(1); }
if (process.argv.includes('--check')) {
  if (!existsSync(path) || readFileSync(path, 'utf8') !== `${page}\n`) { console.error(`${path} is behind the audit: run node tools/coverage.mjs`); process.exit(1); }
  console.log(`${path} matches the audit: ${all} items.`);
} else {
  writeFileSync(path, `${page}\n`);
  console.log(`Wrote ${path}: ${all} items, ${ORDER.map((s) => `${totals[s]} ${s}`).join(', ')}.`);
}
if (disagree.length) {
  const commands = new Set(disagree.map((d) => d.split(':')[0])).size;
  console.error(`${commands} command${commands === 1 ? '' : 's'} the two registries disagree on (docs/capabilities.json and this page’s rows), in ${disagree.length} way${disagree.length === 1 ? '' : 's'}:\n${disagree.join('\n')}`);
  process.exit(1);
}
console.log(`docs/capabilities.json agrees on the ${bothName} commands both name.`);
