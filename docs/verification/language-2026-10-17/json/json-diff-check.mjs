/**
 * Brief 14, the json area: checks that rebuilding the two generated JSON files changed nothing but words.
 *
 *   node docs/verification/language-2026-10-17/json/json-diff-check.mjs <before genre-demands.json> <before home-accounts.json>
 *
 * genre-demands.json, genre by genre, against the file as it was: the same genres in the same order; the same
 * confidence, basis, tags (ids and order) and presence of belongsTo; every URL and every ISO date in each field still
 * there; each digit run in the prose still there, or listed; a source's citation the same but for its last full stop,
 * or listed where it's prose; and how each was read, parsed back to the same counts and date. home-accounts.json must
 * be byte for byte what it was. Exits 1 on a difference that isn't words.
 */
import { readFileSync } from 'node:fs';

const [beforeGd, beforeHa] = process.argv.slice(2);
const now = JSON.parse(readFileSync('src/engine/content/genre-demands.json', 'utf8'));
const was = JSON.parse(readFileSync(beforeGd, 'utf8'));
const problems = [];
const notes = [];
let sourceMarks = 0;
const bag = (s, re) => (s.match(re) ?? []).sort();
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const URL = /https?:\/\/[^\s;,)\]]+/g;
const ISO = /\b\d{4}-\d{2}-\d{2}\b/g;
const DIGITS = /\d+(?:[.,]\d+)*/g;
const missing = (a, b) => { const left = [...b]; return a.filter((x) => { const i = left.indexOf(x); if (i < 0) return true; left.splice(i, 1); return false; }); };

if (!same(Object.keys(now), Object.keys(was))) problems.push('the genres or their order changed');
for (const id of Object.keys(was)) {
  const a = was[id], b = now[id];
  if (!b) continue;
  if (!same(Object.keys(a), Object.keys(b))) problems.push(`${id}: its fields changed (${Object.keys(a)} to ${Object.keys(b)})`);
  if (a.confidence !== b.confidence) problems.push(`${id}: confidence ${a.confidence} to ${b.confidence}`);
  if (a.basis !== b.basis) problems.push(`${id}: basis ${a.basis} to ${b.basis}`);
  if (!same(a.tags.map((t) => t.tag), b.tags.map((t) => t.tag))) problems.push(`${id}: tags changed`);
  if (Boolean(a.belongsTo) !== Boolean(b.belongsTo)) problems.push(`${id}: belongsTo appeared or went`);
  const fields = [['claim'], ['sourceSupports'], ['uncertainty'], ['belongsTo'], ...a.tags.map((t, i) => [`why:${t.tag}`, i])];
  for (const [f, i] of fields) {
    const x = f.startsWith('why:') ? a.tags[i].why : a[f] ?? '';
    const y = f.startsWith('why:') ? b.tags[i].why : b[f] ?? '';
    for (const u of missing(bag(x, URL), bag(y, URL))) problems.push(`${id} ${f}: lost the URL ${u}`);
    for (const d of missing(bag(x, ISO), bag(y, ISO))) problems.push(`${id} ${f}: lost the date ${d}`);
    for (const d of missing(bag(x.replace(URL, '').replace(ISO, ''), DIGITS), bag(y.replace(URL, '').replace(ISO, ''), DIGITS))) notes.push(`${id} ${f}: the figure ${d} isn't in the new words (read it: written as a word, or gone?)`);
  }
  if (a.source !== b.source) {
    const cited = (t) => t.replace(/ ; /g, '; ').replace(/ \[fetched\]/g, ' [read directly]').replace(/ \[snippet\]/g, ' [from a search summary]').replace(/\.$/, '');
    if (cited(a.source) === b.source) sourceMarks += 1;
    else {
      notes.push(`${id} source: prose edited: "${a.source}" -> "${b.source}"`);
      for (const u of missing(bag(a.source, URL), bag(b.source, URL))) problems.push(`${id} source: lost the URL ${u}`);
    }
  }
  const r = /^Reviewed (\d{4}-\d{2}-\d{2}): (\d+) of (\d+)/.exec(a.how);
  if (r) {
    const words = { one: 1, two: 2, three: 3, four: 4, five: 5, none: 0, neither: 0, both: 2, all: Number(r[3]) };
    if (!b.how.endsWith(`reviewed ${r[1]}`)) problems.push(`${id} how: the review date ${r[1]} isn't said`);
    const tokens = b.how.split(/[\s,]+/).map((w) => words[w]).filter((x) => x !== undefined);
    if (!tokens.includes(Number(r[2])) && !(Number(r[2]) === Number(r[3]))) problems.push(`${id} how: ${r[2]} read directly isn't said: "${b.how}"`);
  }
}
if (readFileSync('src/engine/content/home-accounts.json', 'utf8') !== readFileSync(beforeHa, 'utf8')) problems.push('home-accounts.json changed');
for (const n of notes) console.log(`  note: ${n}`);
for (const p of problems) console.error(`  PROBLEM: ${p}`);
console.log(`${Object.keys(now).length} genres compared; ${sourceMarks} sources changed only in their read marks, a semicolon's space or the last full stop; ${notes.length} notes; ${problems.length} problems`);
process.exit(problems.length ? 1 : 0);
