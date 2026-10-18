// Collects every distinct sentence a player is shown, from the text walks, the journey fixtures' notices and the
// journeys' traces, and says where each is shown. Usage: node dedupe.mjs CLONE WALKDIR1 WALKDIR2 OUT
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join } from 'node:path';

const [CLONE, W1, W2, OUT] = process.argv.slice(2);
const seen = new Map(); // sentence -> { kind, where:Set }
const counts = { screens: 0, notices: 0, decisions: 0, traceSaid: 0, controls: 0 };
function splitSentences(text) {
  const out = [];
  for (const line of text.split(/\n+/)) {
    const l = line.replace(/\s+/g, ' ').trim();
    if (!l) continue;
    // split on sentence ends followed by a capital or quote
    const parts = l.split(/(?<=[.!?”])\s+(?=[A-Z“"$0-9])/);
    for (const p of parts) out.push(p.trim());
  }
  return out;
}
function add(s, kind, where) {
  const t = s.replace(/\s+/g, ' ').trim();
  if (!t) return;
  let e = seen.get(t);
  if (!e) { e = { kind, where: new Set() }; seen.set(t, e); }
  if (e.where.size < 6) e.where.add(where);
}
for (const dir of [W1, W2]) {
  if (!dir || !existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'walk.json')) {
    const screens = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    for (const sc of screens) {
      counts.screens++;
      const where = `${f.replace('.json', '')}:${sc.screen}${sc.tab ? '/' + sc.tab : ''}`;
      if (sc.text) for (const s of splitSentences(sc.text)) add(s, 'screen', where);
      for (const d of sc.dialogs ?? []) for (const s of splitSentences(d)) add(s, 'dialog', where);
      for (const b of sc.buttons ?? []) { counts.controls++; add(b, 'control', where); }
      for (const b of sc.labels ?? []) add(b, 'label', where);
      for (const b of sc.placeholders ?? []) add(b, 'placeholder', where);
    }
  }
}
const SAVES = (process.env.SAVES ?? '').split(',').filter(Boolean);
const saveFiles = SAVES.length ? SAVES : readdirSync(join(CLONE, 'tests/fixtures')).filter((f) => /^journey-j01-.*\.json\.gz$/.test(f)).map((f) => join(CLONE, 'tests/fixtures', f));
for (const path of saveFiles) {
  const f = path.split('/').pop();
  const raw = readFileSync(path);
  const j = JSON.parse((path.endsWith('.gz') ? gunzipSync(raw) : raw).toString('utf8'));
  for (const n of Object.values(j.notifications)) {
    counts.notices++;
    add(n.title, 'notice-title', f);
    for (const s of splitSentences(n.body ?? '')) add(s, 'notice', `${f}:${n.category}:${n.title.slice(0, 40)}`);
  }
  for (const d of Object.values(j.decisions)) {
    counts.decisions++;
    add(d.title, 'question-title', f);
    for (const s of splitSentences(d.detail ?? '')) add(s, 'question', f);
    for (const a of d.actions ?? []) add(a.label, 'control', f);
  }
}
const jdir = join(CLONE, 'docs/verification/language-2026-10-17/journeys');
for (const d of readdirSync(jdir)) {
  const t = join(jdir, d, 'trace.json');
  if (!existsSync(t)) continue;
  const j = JSON.parse(readFileSync(t, 'utf8'));
  for (const st of j.steps ?? []) for (const s of st.said ?? []) { counts.traceSaid++; for (const x of splitSentences(s)) add(x, 'trace', `${d}:${st.n}`); }
  for (const dl of j.dialogs ?? []) { const txt = typeof dl === 'string' ? dl : (dl.text ?? JSON.stringify(dl)); for (const x of splitSentences(txt)) add(x, 'trace-dialog', d); }
}
const rows = [...seen].map(([s, e]) => ({ s, kind: e.kind, where: [...e.where] }));
writeFileSync(OUT, JSON.stringify({ counts, distinct: rows.length, rows }, null, 1));
console.log(JSON.stringify(counts), 'distinct', rows.length);
