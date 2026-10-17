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
/** The stretches of a quote a template can't fill: split at figures, money, dates, braces and ellipses. */
const stretches = (q) => q.split(new RegExp(`\\bN\\b|\\$\\{[^}]*\\}|\\{[^}]*\\}|…|\\$?[\\d][\\d,.:%]*|\\b(?:${MONTHS})\\b`, 'g')).map((s) => s.trim().replace(/^[,.;:]\s*|\s*[,;:]$/g, '')).filter((s) => s.split(/\s+/).length >= 3);

const out = [];
for (const f of files.filter(isGuide)) {
  const lines = readFileSync(f, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/“([^”]{8,}?)”/g)) {
      const q = m[1];
      if (q.split(/\s+/).length < 5) continue;
      const parts = stretches(q);
      if (!parts.length) continue;
      const missing = parts.filter((p) => !said.includes(p));
      out.push({ file: f, line: i + 1, quote: q, found: !missing.length, missing });
    }
  });
}
const bad = out.filter((x) => !x.found);
for (const x of process.argv.includes('--check') ? bad : out) console.log(`${x.found ? 'ok  ' : 'GONE'} ${x.file}:${x.line} “${x.quote.slice(0, 140)}”${x.found ? '' : `\n       not said: ${x.missing.map((s) => `“${s.slice(0, 80)}”`).join(', ')}`}`);
console.log(`${out.length} quoted sentences in the guide; ${out.length - bad.length} the game says, ${bad.length} it no longer says.`);
if (process.argv.includes('--check') && bad.length) process.exit(1);
