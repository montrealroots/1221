/**
 * Builds the genres' demands from the research (from 2026-10-10): src/engine/content/genre-demands.json, from
 * docs/research/attributes/research-genre-demands.json, typed by src/engine/content/genre-demands.ts. Kept as JSON,
 * so the house-voice tools don't rewrite it.
 *
 * Until 2026-10-17 this copied the research's words as they came back, and the genre look showed them: "not from my own
 * reading", "the vocabulary has no driving or riding tag", "which costume_drama covers", "(Reviewed 2026-10-10: 3 of 3
 * sources read directly, the rest as search snippets; low confidence)". From then (the owner's brief 14) the research
 * file keeps its own words and the game's words are put on the way in, here:
 *
 * - **Each genre's edits**, from docs/research/attributes/genre-demands-words.txt: exact replacements in the fields a
 *   player reads (`claim`, `sourceSupports`, `uncertainty`, `belongsTo`, a tag's `why`, and a `source` that's prose
 *   rather than a citation). Each old text must be found exactly once in what the research says now, or the build
 *   stops: a change to the research is never covered by words written for what it said before.
 * - **How each was read** (`how`), said as the look's parenthesis reads it: "from a search summary"; "two of its three
 *   sources read directly and the remaining one from a search summary, reviewed October 10, 2026" (until 2026-10-17's
 *   dates below, "reviewed 2026-10-10").
 * - **The house's spelling and contractions** in the research's own sentences, never inside a quotation: "summarized"
 *   where the research wrote it the British way, "doesn’t" for "does not"; and its apostrophe inside a word, "Beckett’s".
 * - **A source's citations** as the research wrote them, but for its marks of how each was read ("[fetched]" is
 *   "[read directly]", "[snippet]" "[from a search summary]"), the space it left before each semicolon, and its last
 *   full stop, which the look adds itself ("pages..").
 * - **Dates** as the game writes them (`gameDates`, tools/research-dates.mjs), in the research's own sentences, its
 *   citations and how each was read, never inside a quotation or a web address: "On review (October 10, 2026)",
 *   "StageMilk (July 16, 2024)". From 2026-10-17 (brief 14's research data): until then "2026-10-10" and "16 July 2024".
 *
 * Nothing the game computes from changes: the ids, the confidence, the tags, what a demand belongs to (present or not)
 * and its basis are copied as they were, and a source's citation keeps its words, its dates written the game's way.
 *
 * Until the owner removed the interests on 2026-10-10 this also generated src/engine/content/engagement.ts from
 * research-interests.json and its review: each interest's definition, what it grew, its kind of rest and when it could
 * be had. That file is hand-kept since, with only the genres' estimates.
 *
 * Run: node tools/build-attribute-content.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { gameDates } from './research-dates.mjs';

const json = (p) => JSON.parse(readFileSync(p, 'utf8'));
const confidence = (r) => (['high', 'medium', 'low'].includes(r) ? r : 'low');
const fail = (why) => { console.error(`build-attribute-content: ${why}`); process.exit(1); };

// ---------------------------------------------------------------------------------------------------------------------
// The edits: "@ <genre> <field>", then "- <old>" and "+ <new>" pairs, one line each. "#" starts a comment.

const FIELDS = new Set(['claim', 'source', 'sourceSupports', 'uncertainty', 'belongsTo']);
function readEdits(path) {
  const edits = new Map();
  let at;
  let old;
  readFileSync(path, 'utf8').split('\n').forEach((line, i) => {
    const where = `${path}:${i + 1}`;
    if (!line.trim() || line.startsWith('#')) return;
    if (line.startsWith('@ ')) {
      if (old !== undefined) fail(`${where}: "- " with no "+ " before it`);
      const [id, field] = line.slice(2).trim().split(/\s+/);
      if (!id || !field || !(FIELDS.has(field) || /^why:\w+$/.test(field))) fail(`${where}: "@ <genre> <field>", where the field is one of ${[...FIELDS].join(', ')} or why:<tag>`);
      at = `${id} ${field}`;
      if (!edits.has(at)) edits.set(at, []);
      return;
    }
    if (!at) fail(`${where}: an edit before any "@ <genre> <field>"`);
    if (line.startsWith('- ')) { if (old !== undefined) fail(`${where}: two "- " in a row`); old = line.slice(2); return; }
    if (line.startsWith('+ ') || line === '+') { if (old === undefined) fail(`${where}: "+ " with no "- "`); edits.get(at).push({ old, now: line.slice(2), where }); old = undefined; return; }
    fail(`${where}: a line is "@ ", "- ", "+ ", "#" or blank`);
  });
  if (old !== undefined) fail(`${path}: the last "- " has no "+ "`);
  return edits;
}

const once = (text, old) => { const i = text.indexOf(old); return i >= 0 && text.indexOf(old, i + 1) < 0 ? i : -1; };
function edited(id, field, text, edits, used) {
  const list = edits.get(`${id} ${field}`);
  if (!list) return text;
  used.add(`${id} ${field}`);
  for (const e of list) {
    const i = once(text, e.old);
    if (i < 0) fail(`${e.where}: "${e.old.slice(0, 80)}" isn't in ${id}'s ${field} exactly once (has the research changed?)`);
    text = text.slice(0, i) + e.now + text.slice(i + e.old.length);
  }
  return text;
}

// ---------------------------------------------------------------------------------------------------------------------
// The research's own sentences, outside its quotations.

/** The text's runs outside quotations, as [start, end) pairs. A straight single quote opens after a space or a bracket. */
function outsideQuotes(text) {
  const runs = [];
  let from = 0;
  let close;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    const before = text[i - 1] ?? ' ';
    const after = text[i + 1] ?? ' ';
    if (!close) {
      const opens = c === '"' ? '"' : c === '“' ? '”' : c === '‘' && /[\s([—–/]/.test(before) ? '’' : c === '\'' && /[\s([—–/]/.test(before) && /[\p{L}\p{N}.…]/u.test(after) ? '\'' : undefined;
      if (opens) { runs.push([from, i]); close = opens; }
    } else if (c === close && (close === '"' || close === '”' || (/\S/.test(before) && /[\s.,;:)!?\]]/.test(after)))) {
      close = undefined;
      from = i + 1;
    }
  }
  if (!close) runs.push([from, text.length]);
  return runs;
}

/** Applies a replacement to the text's runs outside quotations. */
function outside(text, re, to) {
  let out = '';
  let last = 0;
  for (const [a, b] of outsideQuotes(text)) { out += text.slice(last, a) + text.slice(a, b).replace(re, to); last = b; }
  return out + text.slice(last);
}

const CONTRACTED = { 'is not': 'isn’t', 'are not': 'aren’t', 'was not': 'wasn’t', 'were not': 'weren’t', 'does not': 'doesn’t', 'do not': 'don’t', 'did not': 'didn’t', 'could not': 'couldn’t', 'would not': 'wouldn’t', 'should not': 'shouldn’t', 'has not': 'hasn’t', 'have not': 'haven’t', 'had not': 'hadn’t', 'will not': 'won’t', cannot: 'can’t' };
const CONTRACTION = new RegExp(`\\b(${Object.keys(CONTRACTED).join('|')})\\b`, 'gi');
const contract = (m) => { const c = CONTRACTED[m.toLowerCase()]; return m[0] === m[0].toUpperCase() ? c[0].toUpperCase() + c.slice(1) : c; };

/** The house's American spelling (tools/spelling.mjs) for the British forms the research writes, lowercase only: a capital is a title or a name. */
const AMERICAN = {
  summarised: 'summarized', summarising: 'summarizing', summariser: 'summarizer', humour: 'humor', theatre: 'theater', theatres: 'theaters',
  characterise: 'characterize', characterises: 'characterizes', characterised: 'characterized', characterisation: 'characterization',
  memorise: 'memorize', memorised: 'memorized', realised: 'realized', behaviour: 'behavior', recognised: 'recognized', recognisable: 'recognizable',
  centre: 'center', centred: 'centered', centres: 'centers', mould: 'mold', modelled: 'modeled', stylised: 'stylized', favour: 'favor',
  favours: 'favors', prioritises: 'prioritizes', emphasised: 'emphasized', towards: 'toward', travellers: 'travelers', travelling: 'traveling',
  dramatised: 'dramatized', amongst: 'among', practised: 'practiced', generalise: 'generalize', generalises: 'generalizes',
  generalised: 'generalized', generalising: 'generalizing',
};
const BRITISH = new RegExp(`\\b(${Object.keys(AMERICAN).join('|')})\\b`, 'g');

/** The house's apostrophe (’) inside a word, quotation or not: "Beckett’s", "It’s like a dance". A quotation mark stays as written. */
const typographic = (text) => text.replace(/(\p{L})'(\p{L})/gu, '$1’$2');

const house = (text) => gameDates(typographic(outside(outside(text, CONTRACTION, contract), BRITISH, (w) => AMERICAN[w])));

/** A source's citations as written, with the research's marks of how each was read in the look's words, no space before a semicolon, and no last full stop. */
const cited = (text) => gameDates(text.replace(/ ; /g, '; ').replace(/ \[fetched\]/g, ' [read directly]').replace(/ \[snippet\]/g, ' [from a search summary]').replace(/\.$/, ''));

// ---------------------------------------------------------------------------------------------------------------------
// How each was read, as the look's parenthesis says it: "(… ; medium confidence)".

const WORD = ['none', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const n = (k) => WORD[k] ?? String(k);
function howWords(how) {
  const plain = { 'read directly': 'read directly', 'search snippet': 'from a search summary', 'abstract only': 'only the abstract read', secondhand: 'read secondhand' };
  if (plain[how]) return plain[how];
  const r = /^Reviewed (\d{4}-\d{2}-\d{2}): (\d+) of (\d+) sources read directly, the rest as search snippets$/.exec(how);
  if (!r) fail(`no words for how a demand was read: "${how}"`);
  const [, on, a, b] = r;
  const read = Number(a), of = Number(b), rest = of - read;
  const said = read === of
    ? (of === 1 ? 'its one source read directly' : of === 2 ? 'both its sources read directly' : `all ${n(of)} of its sources read directly`)
    : read === 0
      ? (of === 2 ? 'neither of its sources read directly, both from search summaries' : `none of its ${n(of)} sources read directly, all from search summaries`)
      : `${n(read)} of its ${n(of)} sources read directly and ${rest === 1 ? (of === 2 ? 'the other' : 'the remaining one') : `the other ${n(rest)}`} from ${rest === 1 ? 'a search summary' : 'search summaries'}`;
  return `${said}, reviewed ${gameDates(on)}`;
}

// ---------------------------------------------------------------------------------------------------------------------

const demands = json('docs/research/attributes/research-genre-demands.json').genres;
const edits = readEdits('docs/research/attributes/genre-demands-words.txt');
const used = new Set();
const known = new Set(demands.map((d) => d.id));
for (const key of edits.keys()) if (!known.has(key.split(' ')[0])) fail(`the words name a genre the research hasn't: ${key}`);

const data = Object.fromEntries(demands.map((d) => {
  const say = (field, text) => house(edited(d.id, field, text, edits, used));
  const tags = (d.tags ?? []).map((t) => ({ tag: t.tag, why: say(`why:${t.tag}`, t.why) }));
  return [d.id, {
    claim: say('claim', d.claim),
    source: cited(edited(d.id, 'source', d.source, edits, used)),
    sourceSupports: say('sourceSupports', d.sourceSupports),
    how: howWords(d.how),
    confidence: confidence(d.confidence),
    tags,
    uncertainty: say('uncertainty', d.uncertainty),
    ...(d.belongsTo ? { belongsTo: say('belongsTo', d.belongsTo) } : {}),
    ...(d.basis ? { basis: d.basis } : {}),
  }];
}));
for (const key of edits.keys()) if (!used.has(key)) fail(`the words name a field the research's ${key.split(' ')[0]} hasn't: ${key}`);
writeFileSync('src/engine/content/genre-demands.json', JSON.stringify(data, null, 1) + '\n');
console.log('wrote genre-demands.json (' + demands.length + ' genres, ' + [...edits.values()].reduce((s, l) => s + l.length, 0) + ' edits)');
