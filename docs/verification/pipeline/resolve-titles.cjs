// For each test title the audit cites that its file doesn't hold (as tools/coverage.mjs reports them), lists it to be
// read, with the test whose own dated note records it as its old title, where one does, and the file's closest title by
// word overlap. It writes nothing: a rename is recorded in inputs/renames.json by reading the test it became.
// Until 2026-10-16 (brief 09's journeys' follow-up) a closest at 0.6 or more was taken, into renames.json where the
// citation was a test the evidence passes added and into doc-fields.json where it was in a row's own text, and the word
// overlap could take a different test sharing the words: on that tree the coordinator took five such guesses out
// (one was scope-cover's “ended at renewal on 1 November 2027 …”, taken as “HUSKY D enrolled on 1 October 2026 …”).
// Read, that one and evidence-g05-life's “HUSKY D ends at its renewal on 1 September 2027 …” are the renames each test's
// own dated note records; they're recorded in renames.json as read, not as guessed.
const fs = require('fs');
const { spawnSync } = require('child_process');
const ROOT = require('path').join(__dirname, '../../..') + '/';
const run = spawnSync('node', ['tools/coverage.mjs'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20 });
const out = (run.stdout ?? '') + (run.stderr ?? '');
const plain = (s) => s.replace(/[’‘]/g, "'").replace(/[“”]/g, '"');
const words = (s) => new Set(plain(s).toLowerCase().split(/[^a-z0-9$.%]+/).filter((w) => w.length > 1));
const titlesOf = (file) => {
  const text = fs.readFileSync(ROOT + 'tests/' + file, 'utf8');
  return [...text.matchAll(/\bit\(\s*(['`"])((?:\\.|(?!\1).)*)\1/g)].map((m) => m[2].replace(/\\'/g, "'"));
};
/** A test file's dated rename notes: each “until then “old”” over the test it stands above. */
const notesOf = (file) => {
  const lines = fs.readFileSync(ROOT + 'tests/' + file, 'utf8').split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    if (!/[Rr]enamed( later)? on \d{4}-\d{2}-\d{2}/.test(lines[i])) continue;
    let j = i, comment = '';
    while (j < lines.length && /^\s*\/\//.test(lines[j])) { comment += ' ' + lines[j].replace(/^\s*\/\/\s?/, ''); j++; }
    const it = /\bit\(\s*(['`"])((?:\\.|(?!\1).)*)\1/.exec(lines.slice(j, j + 3).join('\n'));
    const old = /“(.+?)”(?:\)|:|,| until)/.exec(comment);
    if (it && old) out.push({ line: i + 1, old: old[1], now: it[2] });
  }
  return out;
};
const unresolved = [];
for (const line of out.split('\n')) {
  const m = /^(\w+) (.+?): (added: )?([\w.-]+\.test\.ts) has no test ‘(.*)’$/.exec(line);
  if (!m) continue;
  const [, , id, added, file, cited] = m;
  const want = words(cited.split(' > ').pop());
  let best = '', score = 0;
  for (const t of titlesOf(file)) {
    const have = words(t);
    const inter = [...want].filter((w) => have.has(w)).length;
    const s = inter / Math.max(1, Math.min(want.size, have.size));
    if (s > score) { score = s; best = t; }
  }
  // The test whose dated note (“Renamed … until then “…””) names the cited title as its old one: the record to read.
  const noted = notesOf(file).filter((n) => plain(n.old).startsWith(plain(cited.split(' > ').pop()).split(/\.\.\.|…/)[0].trim())).map((n) => `${file}:${n.line} says it became ‘${n.now.slice(0, 80)}’`);
  unresolved.push(`${id} | ${file} | ${added ? 'added' : 'row text'} | ${cited.slice(0, 140)} | ${noted.length ? noted.join('; ') : 'no test’s note names it'} | nearest by words ${score.toFixed(2)}: ${best.slice(0, 100)}`);
}
// It writes neither renames.json nor doc-fields.json (from 2026-10-16), so “row text fixed” is always none; the README's
// second merge-review and resolve-titles stay harmless.
console.log(`renamed 0, row text fixed 0, to read ${unresolved.length} (no guess is taken: record a rename in inputs/renames.json by reading the test it became)`);
for (const u of unresolved) console.log('  ' + u);
