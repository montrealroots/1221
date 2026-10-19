/**
 * What the built app shows that the text inventory doesn't hold (from 2026-10-19, the owner's brief 15, section 2: "Use
 * the existing inventory as the baseline, but verify that it covers the actual sources. Record omissions rather than
 * assuming the inventory is exhaustive.").
 *
 *   node tools/text-omissions.mjs <out.json> <walk dir> [<walk dir> ...]
 *
 * It reads a walk of the built app (`tools/text-walk.mjs`): each screen's text, its controls' names and its dialogs. Each
 * line of four words or more is matched against the inventory's strings, a template's fixed stretches each counting on
 * its own. A line no string accounts for is looked for in `src/` as a whole, the directories the inventory leaves out
 * included (the gazetteer's data), by its longest run of five words. Each is one of:
 * - **held:** some inventory string accounts for it;
 * - **outside the inventory:** its words are in a file under `src/` the inventory doesn't read, an omission to review;
 * - **assembled:** no file holds its words as written, so a template or code built it from values (a name, a figure, a
 *   date). Which template is looked for by its shorter fixed stretches, and named where one is found.
 * It writes the omissions and the assembled lines, with the screen each was seen on, and exits 0: what it finds is for
 * a writer to read, not a gate.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { inventory } from './text-inventory.mjs';

const [OUT, ...DIRS] = process.argv.slice(2);
if (!OUT || !DIRS.length) { console.error('Usage: node tools/text-omissions.mjs <out.json> <walk dir> [<walk dir> ...]'); process.exit(2); }
const norm = (s) => s.replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
const words = (s) => s.match(/[A-Za-z][A-Za-z']*/g) ?? [];

// The inventory's fixed stretches: each string split at its {…} parts, three words or more.
const stretches = new Map();
for (const s of inventory()) for (const x of s.strings) for (const part of norm(x.text).split('{…}')) {
  const p = part.trim();
  if (words(p).length >= 3 && p.length >= 12 && !stretches.has(p)) stretches.set(p, s.id);
}
const longest = [...stretches.keys()].sort((a, b) => b.length - a.length);
// Held either way round: a stretch inside the line (a template filled in), or the line inside a longer string (a
// paragraph of research data kept as one JSON string, shown a sentence at a time).
const everything = longest.join('\n');
const heldBy = (line) => everything.includes(line) || longest.find((p) => line.includes(p));

// Every file under src/, the inventory's skipped directories too, for a line nothing in the inventory holds.
const files = [];
(function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) { if (f !== 'node_modules') walk(p); } else if (/\.(ts|tsx|json|js|mjs)$/.test(f)) files.push(p); } })('src');
const texts = files.map((f) => [f, norm(readFileSync(f, 'utf8'))]);
const runOf = (line) => { const w = words(line); let best = ''; for (let i = 0; i + 5 <= w.length; i++) { const r = w.slice(i, i + 5).join(' '); if (r.length > best.length) best = r; } return best; };

const lines = new Map();
for (const dir of DIRS) for (const f of readdirSync(dir).filter((x) => x.endsWith('.json') && x !== 'walk.json')) {
  let screens; try { screens = JSON.parse(readFileSync(join(dir, f), 'utf8')); } catch { continue; }
  if (!Array.isArray(screens)) continue;
  for (const sc of screens) {
    const where = `${f.replace('.json', '')}: ${sc.screen}${sc.tab ? `, ${sc.tab}` : ''}`;
    const all = [...(sc.text ?? '').split('\n'), ...(sc.dialogs ?? []).flatMap((d) => d.split('\n')), ...(sc.buttons ?? []), ...(sc.labels ?? []), ...(sc.placeholders ?? [])];
    for (const raw of all) {
      const line = norm(raw);
      if (words(line).length < 4) continue;
      if (!lines.has(line)) lines.set(line, new Set());
      lines.get(line).add(where);
    }
  }
}

const out = { written: 'by tools/text-omissions.mjs', walks: DIRS, lines: lines.size, held: 0, outside: [], assembled: [] };
for (const [line, where] of lines) {
  if (heldBy(line)) { out.held++; continue; }
  const run = runOf(line);
  const file = run ? texts.find(([, t]) => t.includes(run))?.[0] : undefined;
  const seen = [...where].slice(0, 3);
  if (file) out.outside.push({ line, file, run, seen });
  else {
    // A template's shorter fixed stretches: a two-word stretch is too common to name one, so three words.
    const near = longest.filter((p) => words(p).length >= 3 && line.includes(p.slice(0, Math.min(p.length, 30)))).slice(0, 1);
    out.assembled.push({ line, seen, ...(near.length ? { near: stretches.get(near[0]) } : {}) });
  }
}
out.outside.sort((a, b) => a.file.localeCompare(b.file));
writeFileSync(OUT, `${JSON.stringify(out, null, 1)}\n`);
const byFile = {};
for (const o of out.outside) byFile[o.file] = (byFile[o.file] ?? 0) + 1;
console.log(`${out.lines} lines of four words or more: ${out.held} held by the inventory, ${out.outside.length} in files it doesn't read, ${out.assembled.length} assembled from values.`);
for (const [f, n] of Object.entries(byFile).sort((a, b) => b[1] - a[1])) console.log(`  ${n.toString().padStart(4)}  ${f}`);
