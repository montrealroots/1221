/**
 * Brief 14, the json area: every field of src/engine/content/genre-demands.json the genre look shows, swept for the
 * research's working words the player can't read. The claim, what the source supports, how it was read, what's
 * uncertain, what a demand belongs to, and a requirement's reason where the genre's requirements apply (the look shows
 * no other), outside its quotations, which keep their sources' words; and each source line, for its marks of how it was
 * read. Prints each hit with its genre and field.
 *
 *   node docs/verification/language-2026-10-17/json/sweep-words.mjs
 */
import { readFileSync } from 'node:fs';

const data = JSON.parse(readFileSync('src/engine/content/genre-demands.json', 'utf8'));

/** The text with its quotations blanked, as tools/build-attribute-content.mjs finds them: a quotation keeps its source's words. */
function unquoted(text) {
  let out = '';
  let close;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i], before = text[i - 1] ?? ' ', after = text[i + 1] ?? ' ';
    if (!close) {
      const opens = c === '"' ? '"' : c === '“' ? '”' : c === '‘' && /[\s([—–/]/.test(before) ? '’' : c === '\'' && /[\s([—–/]/.test(before) && /[\p{L}\p{N}.…]/u.test(after) ? '\'' : undefined;
      if (opens) { close = opens; out += c; continue; }
      out += c;
    } else if (c === close && (close === '"' || close === '”' || (/\S/.test(before) && /[\s.,;:)!?\]]/.test(after)))) { close = undefined; out += c; }
    else out += '·';
  }
  return out;
}
const PROSE = [
  [/\bsnippets?\b/i, 'snippet'], [/\bfetch(ed|ing)?\b/i, 'fetch'], [/\btags?\b/i, 'tag'], [/\bvocabular/i, 'vocabulary'],
  [/\b403\b|\bHTTP\b/, 'an HTTP code'], [/genre-wide|subgenre-or-role|^unsupported:|^definition:/i, 'a review label'], [/\be\.g\.|\bi\.e\./, 'e.g. or i.e.'],
  [/\bmy own\b|\bI (was|am|have|had|did|read|found|could|think|saw)\b/, 'first person'], [/\bthe input\b/i, 'the input'], [/\bpointers?\b/i, 'pointer'], [/\b[a-z]+_[a-z_]+\b/, 'an id'],
  [/\b(physicalComedy|voiceWork)\b|'(stunt|song|dance|comic|heightened|accent|camera|transformation|improvisation|intimacy)'/, 'a tag id'],
  [/Reviewed 2026|Not applied genre-wide/, 'a review note'], [/SLATE/, 'SLATE'], [/\bsummaris|generalis|characteris(e|es|ed|ing|ation)\b|stylis|theatre\b|behaviour|humour|centre\b/, 'British spelling'],
  [/ [,.;:]/, 'a space before punctuation'], [/\.\.(?!\.)/, 'a doubled stop'], [/\b(is|are|was|were|does|do|did|could|would|has|have) not\b/, 'uncontracted'],
];
const SOURCE = [[/snippet|fetched|fetch\b|\b403\b|blocked/i, 'a read mark'], [/ ;/, 'a space before a semicolon'], [/\.$/, 'a last full stop']];
let hits = 0;
for (const [id, g] of Object.entries(data)) {
  const fields = [['claim', g.claim], ['sourceSupports', g.sourceSupports], ['how', g.how], ['uncertainty', g.uncertainty], ['belongsTo', g.belongsTo ?? ''],
    ...(g.confidence !== 'low' ? g.tags.map((t) => [`why:${t.tag}`, t.why]) : [])];
  for (const [f, text] of fields) for (const [re, label] of PROSE) { const m = re.exec(unquoted(text)); if (m) { hits += 1; console.log(`${id} ${f} [${label}] …${text.slice(Math.max(0, m.index - 50), m.index + 60)}…`); } }
  for (const [re, label] of SOURCE) { const m = re.exec(g.source); if (m) { hits += 1; console.log(`${id} source [${label}] …${g.source.slice(Math.max(0, m.index - 50), m.index + 60)}…`); } }
}
console.log(`${hits} hits in ${Object.keys(data).length} genres`);
