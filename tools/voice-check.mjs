/**
 * The voice sweep.
 *
 * Prose that never contracts reads like a form letter. "You do not have a job"
 * is a sentence a machine says; "You don't have a job" is one a person says.
 * This walks every string the game shows and finds the places where a person
 * would have contracted and the text did not, plus a few stiff shapes that
 * turn up in bulk.
 *
 *   node tools/voice-check.mjs           counts, by pattern and by file
 *   node tools/voice-check.mjs --fix     rewrites the safe contractions
 *   node tools/voice-check.mjs --check   exits 1 when the count is over budget
 *
 * The fix only touches text inside string literals and JSX text, never code,
 * comments, identifiers, ids or import paths. It uses the typographic
 * apostrophe the rest of the prose already uses, so a single-quoted literal
 * needs no escaping. Labels in Title Case are left alone: every pattern needs
 * a lowercase second word, so "Do Not Disturb" is not a match and "do not" is.
 *
 * Some forms are never contracted here because English does not, or because
 * the contraction changes the sense: possessive "you have" ("you have $50"),
 * "it is" at the end of a clause ("that is what it is"), "you are" after
 * "who", "where", "as" or "than" ("who you are").
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const args = new Set(process.argv.slice(2));
const DRY = args.has('--dry');
const FIX = args.has('--fix') || DRY;
const CHECK = args.has('--check');
const SAMPLE = [];
const BUDGET = Number(process.env.SLATE_VOICE_BUDGET ?? 40);

const ROOT = 'src';
const SKIP_DIRS = new Set(['node_modules', 'dist', 'geography', 'world-data', '__snapshots__']);
const EXTENSIONS = /\.(ts|tsx)$/;
const SKIP_FILES = /\.test\.tsx?$|\.d\.ts$/;

const APOS = '’';

// Guards: the word after the match must not be one of these, or punctuation.
const NOT_BEFORE_CLAUSE_END = '(?! *(?:[.,;:!?)\\]"’]|$))';
// Either case, because the word before is often the start of the sentence.
const NOT_AFTER = (words) => `(?<!\\b(?:${words.map((w) => `[${w[0].toUpperCase()}${w[0]}]${w.slice(1)}`).join('|')}) )`;

const PREPOSITIONS = [
  'what', 'whatever', 'where', 'wherever', 'as', 'than', 'how', 'who', 'which', 'whichever', 'if',
  'of', 'after', 'before', 'about', 'for', 'in', 'on', 'at', 'with', 'to', 'from', 'like', 'by',
  'into', 'under', 'over', 'all', 'both', 'half', 'but', 'behind', 'beyond', 'without', 'against',
];

/** [pattern, replacement builder, label]. Order matters: "not" forms go first. */
const RULES = [
  [/\b(do|does|did|is|are|was|were|have|has|had|would|should|could|must) not\b(?! only\b)/g, (m, v) => `${v}n${APOS}t`, 'x not'],
  [/\b(Do|Does|Did|Is|Are|Was|Were|Have|Has|Had|Would|Should|Could|Must) not\b(?! only\b)/g, (m, v) => `${v}n${APOS}t`, 'X not'],
  [/\bwill not\b/g, () => `won${APOS}t`, 'will not'],
  [/\bWill not\b/g, () => `Won${APOS}t`, 'Will not'],
  [/\bcannot\b(?! only\b)/g, () => `can${APOS}t`, 'cannot'],
  [/\bCannot\b(?! only\b)/g, () => `Can${APOS}t`, 'Cannot'],
  // "here is" and "that is" after a preposition are an adverb and an object
  // ("the figure here is ours", "half of it is technique"), not a subject.
  [new RegExp(`${NOT_AFTER(PREPOSITIONS)}\\b(it|that|there) is\\b(?! to\\b)${NOT_BEFORE_CLAUSE_END}`, 'g'), (m, v) => `${v}${APOS}s`, 'x is'],
  [new RegExp(`\\b(It|That|There|Here) is\\b(?! to\\b)${NOT_BEFORE_CLAUSE_END}`, 'g'), (m, v) => `${v}${APOS}s`, 'X is'],
  [new RegExp(`${NOT_AFTER(PREPOSITIONS)}\\b(you|we|they) are\\b${NOT_BEFORE_CLAUSE_END}`, 'g'), (m, v) => `${v}${APOS}re`, 'x are'],
  [new RegExp(`\\b(You|We|They) are\\b${NOT_BEFORE_CLAUSE_END}`, 'g'), (m, v) => `${v}${APOS}re`, 'X are'],
  [new RegExp(`\\b(you|we|they|You|We|They) will\\b${NOT_BEFORE_CLAUSE_END}`, 'g'), (m, v) => `${v}${APOS}ll`, 'x will'],
  [new RegExp(`\\b(you|we|they|You|We|They) would\\b${NOT_BEFORE_CLAUSE_END}`, 'g'), (m, v) => `${v}${APOS}d`, 'x would'],
  [/\bI am\b(?! (?:not|only)\b)/g, () => `I${APOS}m`, 'I am'],
  [/\bI will\b/g, () => `I${APOS}ll`, 'I will'],
  [new RegExp(`${NOT_AFTER(PREPOSITIONS)}\\b(he|she) is\\b${NOT_BEFORE_CLAUSE_END}`, 'g'), (m, v) => `${v}${APOS}s`, 'he is'],
  [/\b(l|L)et us\b(?! (?:know|say|be|see|go|have)\b)/g, (m, l) => `${l}et${APOS}s`, 'let us'],
];

/** The stiff shapes worth counting, though a person has to decide each one. */
const TICS = [
  [/(?:^|[.!?] )Nothing [a-z]/g, 'a sentence that opens with "Nothing"'],
  [/, which is\b/g, '", which is" tacked on'],
  [/SLATE[’']s own/g, '"SLATE’s own"'],
  [/\bsomebody\b/g, '"somebody"'],
];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) out.push(...walk(path));
    else if (EXTENSIONS.test(path) && !SKIP_FILES.test(path)) out.push(path);
  }
  return out;
}

function insideString(line, at) {
  const before = line.slice(0, at);
  return ((before.match(/'/g) ?? []).length % 2 === 1)
    || ((before.match(/"/g) ?? []).length % 2 === 1)
    || ((before.match(/`/g) ?? []).length % 2 === 1);
}

/** The parts of a template literal that are text, with the ${...} cut out. */
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

/** Where prose can live on this line: string literals and JSX text. Never comments. */
function proseSpans(line, tsx) {
  const spans = [];
  const comment = line.indexOf('//');
  const star = line.search(/^\s*\*|^\s*\/\*/);
  if (star === 0) return spans;
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
    // Text between tags, and a bare line of text inside a JSX block.
    const jsx = />([^<>{}]*[A-Za-z][^<>{}]*)</g;
    while ((m = jsx.exec(head)) !== null) spans.push([m.index + 1, m.index + 1 + m[1].length]);
    if (/^\s*[A-Za-z][^{}<>=;()`'"]*$/.test(head) && /\s[a-z]+\s/.test(head)) spans.push([0, head.length]);
  }
  return spans.sort((a, b) => a[0] - b[0]);
}

const files = walk(ROOT);
const byRule = {};
const byFile = {};
const tics = {};
let edits = 0;
let total = 0;

for (const file of files) {
  const tsx = file.endsWith('.tsx');
  const source = readFileSync(file, 'utf8');
  const lines = source.split('\n');
  let changed = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const spans = proseSpans(line, tsx);
    if (spans.length === 0) continue;
    let out = '';
    let cursor = 0;
    for (const [start, end] of spans) {
      if (start < cursor) continue;
      out += line.slice(cursor, start);
      let text = line.slice(start, end);
      for (const [pattern, replace, label] of RULES) {
        const hits = text.match(pattern);
        if (!hits) continue;
        byRule[label] = (byRule[label] ?? 0) + hits.length;
        byFile[file] = (byFile[file] ?? 0) + hits.length;
        total += hits.length;
        if (FIX) text = text.replace(pattern, replace);
      }
      for (const [pattern, label] of TICS) {
        const hits = text.match(pattern);
        if (hits) tics[label] = (tics[label] ?? 0) + hits.length;
      }
      out += text;
      cursor = end;
    }
    out += line.slice(cursor);
    if (out !== line) {
      if (DRY) SAMPLE.push([file, line.trim(), out.trim()]);
      lines[i] = out;
      changed = true;
      edits += 1;
    }
  }
  if (FIX && !DRY && changed) writeFileSync(file, lines.join('\n'));
}

const sorted = Object.entries(byFile).sort((a, b) => b[1] - a[1]);
console.log(`${files.length} files. ${total} places a person would have contracted.`);
for (const [label, n] of Object.entries(byRule).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(5)}  ${label}`);
console.log('\nStiff shapes, for a person to look at:');
for (const [label, n] of Object.entries(tics).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(5)}  ${label}`);
if (!FIX) {
  console.log('\nHeaviest files:');
  for (const [file, n] of sorted.slice(0, 25)) console.log(`  ${String(n).padStart(5)}  ${file}`);
}
if (DRY) {
  // A spread of what the fix would do, so a person can read it before it runs.
  let seed = 7;
  const next = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const picks = SAMPLE.slice().sort(() => next() - 0.5).slice(0, Number(process.env.SLATE_VOICE_SAMPLE ?? 70));
  console.log(`\n${SAMPLE.length} lines would change. A sample:`);
  for (const [file, before, after] of picks) console.log(`\n${file}\n  - ${before.slice(0, 220)}\n  + ${after.slice(0, 220)}`);
} else if (FIX) console.log(`\nRewrote ${edits} lines.`);
if (CHECK && total > BUDGET) {
  console.log(`\nOver budget: ${total} uncontracted forms, and the budget is ${BUDGET}. Run node tools/voice-check.mjs --fix, or write it the way a person says it.`);
  process.exit(1);
}
