/**
 * The tics.
 *
 * `voice-check` finds the places a person would have contracted. This finds
 * the other half of sounding like a machine, which is not stiffness but
 * relentlessness: prose where every single sentence is doing rhetorical work
 * and none of it is ever just said.
 *
 * The tell is the aphorism. One line that ends "— which is the whole point of
 * it" is good writing. Forty of them in a row is a machine, because a person
 * writing forty lines gets tired of being clever and says four of them plainly.
 * The same goes for the em-dash restate, the negation-as-definition, and the
 * triad: each is a fine move and none of them is a fine habit.
 *
 *   node tools/tics.mjs             every hit, by pattern, with its line
 *   node tools/tics.mjs --counts    the totals only
 *   node tools/tics.mjs --check     exits 1 when a pattern is over its budget
 *
 * Only text the game shows: string literals and JSX text, never comments,
 * identifiers or imports. A comment can be as dense as it likes.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const args = new Set(process.argv.slice(2));
const COUNTS = args.has('--counts');
const CHECK = args.has('--check');

const ROOT = 'src';
const SKIP_DIRS = new Set(['node_modules', 'dist', 'geography', 'world-data', '__snapshots__']);
const SKIP_FILES = /\.test\.tsx?$|\.d\.ts$/;

/**
 * Each tic, and how many the prose may carry.
 *
 * A budget rather than a ban. Every one of these is a real move that good
 * writing makes; the fault is doing it so often that the reader hears the
 * pattern instead of the sentence. The numbers are what is left after the
 * sweep, so they hold the line rather than describing an ambition.
 */
const TICS = [
  {
    id: 'aphorism',
    what: 'A clause tacked on to explain what the sentence just meant',
    hint: 'End the sentence. Say the next thing plainly, or don’t say it.',
    re: /,\s*(which|and that)\s+(is|was|are|makes|means)\b/gi,
    budget: 12,
  },
  {
    id: 'dash-restate',
    what: 'An em dash, then a restatement of what came before it',
    hint: 'A dash should add, not rephrase. Cut it or make it a new sentence.',
    re: /—\s*(which|and that|and it)\b/gi,
    budget: 6,
  },
  {
    id: 'whole-point',
    what: '"the whole point / the whole thing / the entire point"',
    hint: 'Everything can’t be the whole point of everything.',
    re: /\b(the (whole|entire) (point|thing|problem|of it)|that’s the (whole|entire))\b/gi,
    budget: 4,
  },
  {
    id: 'not-but',
    what: 'Defining something by what it isn’t before saying what it is',
    hint: 'Say what it is. The contrast is only worth it once or twice.',
    re: /\b(isn’t|is not|aren’t|wasn’t)\b[^.;!?]{2,60}?\b(it’s|they’re|it is)\b/gi,
    budget: 8,
  },
  {
    id: 'rather-than',
    what: '"rather than"',
    hint: 'Often just "not". Sometimes the clause can go entirely.',
    re: /\brather than\b/gi,
    budget: 12,
  },
  {
    id: 'nothing-opener',
    what: 'A sentence that opens with "Nothing"',
    hint: 'Turn it round: say what there is, or who does what.',
    re: /(^|[.!?]\s+|>\s*)Nothing\b/g,
    budget: 0,
  },
  {
    id: 'somebody',
    what: '"somebody"',
    hint: 'A person, a name, "you", "they" — anything but the same word again.',
    re: /\bsomebody\b/gi,
    budget: 25,
  },
  {
    id: 'triad',
    what: 'Three negatives in a row: "no x, no y, no z"',
    hint: 'Two is a pair. Three is a drum.',
    re: /\bno [a-z]+, no [a-z]+,? (and )?no [a-z]+/gi,
    budget: 3,
  },
  {
    id: 'which-is-why',
    what: '"which is why" / "which is how"',
    hint: 'Start a sentence with "That’s why", or drop the join.',
    re: /\bwhich is (why|how)\b/gi,
    budget: 8,
  },
];

// --- reading only the parts a player sees ----------------------------------

function insideString(line, at) {
  const before = line.slice(0, at);
  return ((before.match(/'/g) ?? []).length % 2 === 1)
    || ((before.match(/"/g) ?? []).length % 2 === 1)
    || ((before.match(/`/g) ?? []).length % 2 === 1);
}

function outsideInterpolations(line, start, end) {
  const spans = [];
  let at = start;
  const body = line.slice(start, end);
  let index = 0;
  while (index < body.length) {
    const open = body.indexOf('${', index);
    if (open === -1) break;
    let depth = 1;
    let close = open + 2;
    while (close < body.length && depth > 0) {
      if (body[close] === '{') depth++;
      else if (body[close] === '}') depth--;
      close++;
    }
    if (start + open > at) spans.push([at, start + open]);
    at = start + close;
    index = close;
  }
  if (at < end) spans.push([at, end]);
  return spans;
}

function proseSpans(line, tsx) {
  const spans = [];
  const comment = line.indexOf('//');
  if (/^\s*\*|^\s*\/\*/.test(line)) return spans;
  const limit = comment >= 0 && !insideString(line, comment) ? comment : line.length;
  const head = line.slice(0, limit);

  const re = /(['"`])(?:\\.|(?!\1)[^\\])*\1/g;
  let m;
  while ((m = re.exec(head)) !== null) {
    const inner = m[0].slice(1, -1);
    if (/^[a-z0-9_./@:-]+$/.test(inner)) continue;
    if (/\bfrom\s*$/.test(head.slice(0, m.index))) continue;
    const start = m.index + 1;
    const end = m.index + m[0].length - 1;
    if (m[0][0] === '`') spans.push(...outsideInterpolations(head, start, end));
    else spans.push([start, end]);
  }
  if (tsx) {
    const jsx = />([^<>{}]*[A-Za-z][^<>{}]*)</g;
    while ((m = jsx.exec(head)) !== null) spans.push([m.index + 1, m.index + 1 + m[1].length]);
    if (/^\s*[A-Za-z][^{}<>=;()`'"]*$/.test(head) && /\s[a-z]+\s/.test(head)) spans.push([0, head.length]);
  }
  return spans;
}

/**
 * Blank out `{/* ... *\/}` blocks, which span lines and read exactly like the
 * bare prose the JSX rule below is looking for. Same length in, same length
 * out, so a span found in the blanked copy still points at the real line.
 */
function withoutJsxComments(source) {
  return source.replace(/\{\/\*[\s\S]*?\*\/\}/g, (block) =>
    block.replace(/[^\n]/g, ' '));
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(ts|tsx)$/.test(entry) && !SKIP_FILES.test(entry)) out.push(path);
  }
  return out;
}

// --- the sweep --------------------------------------------------------------

const hits = new Map(TICS.map((tic) => [tic.id, []]));

/**
 * How a long list of sentences begins. One habit is fine; a hundred of them in
 * a row is the sound of a machine. A file with twenty or more lines of prose
 * where a quarter of them open on the same word gets said out loud here.
 */
const openers = new Map();
const SAMENESS_FLOOR = 20;
const SAMENESS_SHARE = 0.3;

for (const path of walk(ROOT)) {
  const tsx = path.endsWith('.tsx');
  const lines = withoutJsxComments(readFileSync(path, 'utf8')).split('\n');
  for (const [index, line] of lines.entries()) {
    const spans = proseSpans(line, tsx);
    if (spans.length === 0) continue;
    const prose = spans.map(([a, b]) => line.slice(a, b)).join(' ');
    if (!/[a-z]{3}/.test(prose)) continue;
    // A validator diagnostic is read by whoever is fixing a broken save, never
    // by a player. "The X is Y" over and over is the right register for those,
    // so they are counted out of the sameness tally below.
    if (/\b(errors|warnings)\.push\(/.test(line)) continue;
    for (const [a, b] of spans) {
      const one = line.slice(a, b).trim();
      if (one.length < 20 || !/^[A-Z][a-z]/.test(one) || !/\s[a-z]+\s/.test(one)) continue;
      const word = one.split(/\s+/)[0].replace(/[^A-Za-z’]/g, '');
      if (word.length < 2) continue;
      if (!openers.has(path)) openers.set(path, new Map());
      const tally = openers.get(path);
      tally.set(word, (tally.get(word) ?? 0) + 1);
    }
    for (const tic of TICS) {
      tic.re.lastIndex = 0;
      const found = prose.match(tic.re);
      if (found) {
        for (let i = 0; i < found.length; i += 1) {
          hits.get(tic.id).push({ path, line: index + 1, text: prose.trim() });
        }
      }
    }
  }
}

let over = 0;
console.log('What the game says, and the habits in it.\n');
for (const tic of TICS) {
  const found = hits.get(tic.id);
  const flag = found.length > tic.budget ? ` OVER by ${found.length - tic.budget}` : '';
  if (found.length > tic.budget) over += 1;
  console.log(`${String(found.length).padStart(4)}/${String(tic.budget).padEnd(4)} ${tic.what}${flag}`);
  if (!COUNTS && found.length > 0) {
    console.log(`        ${tic.hint}`);
    const seen = new Set();
    for (const hit of found) {
      const key = `${hit.path}:${hit.line}`;
      if (seen.has(key)) continue;
      seen.add(key);
      console.log(`        ${key.replace('src/', '')}  ${hit.text.slice(0, 110)}`);
    }
    console.log('');
  }
}

let same = 0;
console.log('And how the long lists begin, where one word does too much of it.\n');
for (const [path, tally] of [...openers].sort()) {
  const written = [...tally.values()].reduce((n, k) => n + k, 0);
  if (written < SAMENESS_FLOOR) continue;
  const [word, n] = [...tally].sort((a, b) => b[1] - a[1])[0];
  if (n / written < SAMENESS_SHARE) continue;
  same += 1;
  console.log(`  ${String(Math.round((100 * n) / written)).padStart(3)}%  ${path.replace('src/', '')}`
    + `  ${written} lines, ${n} of them opening on "${word}"`);
}
if (same === 0) console.log('  None. Every long list opens more than one way.');

const total = [...hits.values()].reduce((n, list) => n + list.length, 0);
console.log(`\n${total} in all, across ${TICS.length} habits.`);
if (CHECK && (over > 0 || same > 0)) {
  if (over > 0) console.log(`\n${over} of them are over budget. Say some of it plainly.`);
  if (same > 0) console.log(`${same} ${same === 1 ? 'list opens' : 'lists open'} the same way too often. Vary the shape.`);
  process.exit(1);
}
