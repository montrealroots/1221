/**
 * The guide's quotations, held to the game's words (from 2026-10-17, brief 14). The guide's chapters
 * (`content/tutorial.ts`) and How This Works (`content/guide/*.ts`) quote what the game says: a refusal, a notice, a
 * line on a screen. A quote is a promise that the player will read those words, so when the words change the quote must
 * too. Until this, only the few quotes `tests/guide-examples-*.test.ts` held were checked, and brief 14's areas, each
 * rewriting its own words, left others' quotes behind.
 *
 *   node tools/guide-quotes.mjs           lists every quoted sentence and whether the game says it
 *   node tools/guide-quotes.mjs --check   exits 1 on a quoted sentence the game no longer says
 *
 * A quoted sentence is text in curly quotes (“…”) of five words or more, in the guide's own files. It's found when every
 * stretch of it between the parts a template fills (figures, dates, names in braces) is in a string in `src/` outside
 * the guide's files. A quote of a label, under five words, is `tools/tutorial-routes.mjs`'s to check.
 *
 * Two kinds of line are set aside (from 2026-10-17, brief 14's cross-area pass, which found 74 quotes flagged and brought
 * each in step). A comment's quote is history, the words a line said until a date, not a promise to the player, so a line
 * that is a comment isn't read. And a few of the guide's worked examples quote a sentence the game builds from parts this
 * tool can't join (a program's name from one function and the work it asks from another): `HELD` names each, with the
 * assertion in its `tests/guide-examples-*.test.ts` that holds the quote to the live words exactly. The quote counts as
 * said only while that assertion is in the test, so the test, which plays the example, is what checks it.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const GUIDE = [/^src\/engine\/content\/tutorial\.ts$/, /^src\/engine\/content\/guide\/[\w-]+\.ts$/];
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f).split('\\').join('/'); return statSync(p).isDirectory() ? (['geography', 'world-data'].includes(f) ? [] : walk(p)) : /\.(ts|tsx)$/.test(f) && !/\.test\./.test(f) ? [p] : []; });
const files = walk('src');
const isGuide = (f) => GUIDE.some((r) => r.test(f));
// The game's words: every source file but the guide's, read whole, quotes and escapes as they are written.
const said = files.filter((f) => !isGuide(f)).map((f) => readFileSync(f, 'utf8')).join('\n').replace(/\\'/g, '\'').replace(/\\u2019/g, '’');
const MONTHS = 'January|February|March|April|May|June|July|August|September|October|November|December';
/** The stretches of a quote a template can't fill: split at figures, money, dates, braces (a `${…}` with an object inside it whole, from 2026-10-17) and ellipses. */
const stretches = (q) => q.split(new RegExp(`\\bN\\b|\\$\\{(?:[^{}]|\\{[^{}]*\\})*\\}|\\{[^}]*\\}|…|\\$?[\\d][\\d,.:%]*|\\b(?:${MONTHS})\\b`, 'g')).map((s) => s.trim().replace(/^[,.;:]\s*|\s*[,;:]$/g, '')).filter((s) => s.split(/\s+/).length >= 3);

/**
 * Quotes of a sentence built from parts, each held exactly by the test that plays its example: the guide's file, the
 * quote's opening, the test file and the assertion in it that compares the quote with what the game printed.
 */
const HELD = [
  { file: 'src/engine/content/guide/papers.ts', opens: 'From January 1, 2027, HUSKY D asks for ${formatMoney', test: 'tests/guide-examples-papers.test.ts', holds: 'expect(ex.steps[1]).toContain(`Under The Marketplace: “${may.why}”`);' },
  { file: 'src/engine/content/guide/papers.ts', opens: 'Enrolled in the marketplace, from September 1, …', test: 'tests/guide-examples-papers.test.ts', holds: 'const quoted = grab(ex.result, /The toast says “([^”…]+)…”/);\n  expect(toast.startsWith(quoted)).toBe(true);' },
  { file: 'src/engine/content/guide/papers.ts', opens: 'A doctor’s visit: booked at ${YALE_PRACTICE}', test: 'tests/guide-examples-papers.test.ts', holds: 'expect(notice.body.replace(day(booked.at), \'…\')).toBe(grab(ex.steps[0]!, /A notice: “([^”]+)”/));' },
  { file: 'src/engine/content/guide/papers.ts', opens: 'A doctor’s visit: not yet seen', test: 'tests/guide-examples-papers.test.ts', holds: 'expect(ex.steps[2]).toContain(`beside “${owed}: not yet seen”`);' },
  { file: 'src/engine/content/guide/productions.ts', opens: 'You’re spent by the second half: find where the play lets you breathe.', test: 'tests/guide-examples-productions.test.ts', holds: 'expect(note.text).toContain(said);' },
  // Net Worth's sentence, its parts joined in money.tsx (from 2026-10-23, brief 23, when the example read it in place of
  // Home's Money line, which went from Home).
  { file: 'src/engine/content/guide/money.ts', opens: 'You’re worth ${formatMoney(WORTH', test: 'tests/guide-examples-money.test.ts', holds: "expect(worth.summary).toContain(grab(result, 'Net Worth says “', '(.+?)', '”'));" },
];
const heldBy = (f, q) => HELD.find((h) => h.file === f && q.startsWith(h.opens) && readFileSync(h.test, 'utf8').includes(h.holds));
const COMMENT = /^\s*(?:\/\/|\/\*|\*)/;

const out = [];
for (const f of files.filter(isGuide)) {
  const lines = readFileSync(f, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (COMMENT.test(line)) return;
    for (const m of line.matchAll(/“([^”]{8,}?)”/g)) {
      const q = m[1];
      if (q.split(/\s+/).length < 5) continue;
      const parts = stretches(q);
      if (!parts.length) continue;
      const missing = parts.filter((p) => !said.includes(p));
      const held = missing.length ? heldBy(f, q) : undefined;
      out.push({ file: f, line: i + 1, quote: q, found: !missing.length || Boolean(held), held, missing });
    }
  });
}
const bad = out.filter((x) => !x.found);
for (const x of process.argv.includes('--check') ? bad : out) console.log(`${x.held ? 'held' : x.found ? 'ok  ' : 'GONE'} ${x.file}:${x.line} “${x.quote.slice(0, 140)}”${x.held ? `\n       held by ${x.held.test}` : x.found ? '' : `\n       not said: ${x.missing.map((s) => `“${s.slice(0, 80)}”`).join(', ')}`}`);
const held = out.filter((x) => x.held).length;
console.log(`${out.length} quoted sentences in the guide; ${out.length - bad.length} the game says${held ? ` (${held} of them held by the test that plays the example)` : ''}, ${bad.length} it no longer says.`);
if (process.argv.includes('--check') && bad.length) process.exit(1);
