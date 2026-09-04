/**
 * Re-labels every item in the cache with Wikidata's "mul" (all languages)
 * labels honoured. Wikidata moved many names that read the same everywhere,
 * "Christopher Nolan" among them, from the English label to "mul"; a lookup
 * that asks for English alone then falls through to whatever language comes
 * next. This pass asks for English or mul first, and only then the rest.
 *
 * Rewrites cache/details.ndjson in place. Safe to run again.
 */
import { readFileSync, writeFileSync, renameSync } from 'node:fs';

const HERE = new URL('./', import.meta.url);
const detailsPath = new URL('./cache/details.ndjson', HERE);
const UA = 'SLATE-build/1.0 (film simulator dataset builder; contact via repository)';
const PARALLEL = 3;
const BATCH = 400;

async function sparql(query, attempt = 0) {
  try {
    const res = await fetch(`https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}`, { headers: { 'User-Agent': UA, Accept: 'application/sparql-results+json' } });
    if (res.status === 429 || res.status >= 500) {
      if (attempt >= 6) throw new Error(`HTTP ${res.status}`);
      await new Promise((r) => setTimeout(r, 3000 * 2 ** attempt));
      return sparql(query, attempt + 1);
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()).results.bindings;
  } catch (error) {
    if (attempt >= 6) throw error;
    await new Promise((r) => setTimeout(r, 3000 * 2 ** attempt));
    return sparql(query, attempt + 1);
  }
}

const rows = readFileSync(detailsPath, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const ids = new Set();
const isQ = (s) => /^Q\d+$/.test(s ?? '');
for (const row of rows) {
  ids.add(row.qid);
  for (const p of row.people) ids.add(p.qid);
  for (const c of row.cast) ids.add(c.qid);
  for (const key of ['types', 'basedOn', 'series', 'franchise', 'follows', 'followedBy', 'companies', 'distributors', 'broadcasters']) {
    for (const v of row.lists[key] ?? []) { const q = v.split('\t')[0]; if (isQ(q)) ids.add(q); }
  }
}
console.log(`items to label: ${ids.size}`);

const labels = new Map();
const queue = [...ids];
let done = 0;
async function worker() {
  while (queue.length > 0) {
    const batch = queue.splice(0, BATCH);
    const values = batch.map((q) => `wd:${q}`).join(' ');
    try {
      const primary = await sparql(`SELECT ?x ?xLabel WHERE { VALUES ?x { ${values} } SERVICE wikibase:label { bd:serviceParam wikibase:language "en,mul". } }`);
      const missing = [];
      for (const r of primary) {
        const q = r.x.value.split('/').pop();
        const label = r.xLabel?.value ?? '';
        if (label && !isQ(label)) labels.set(q, label); else missing.push(q);
      }
      if (missing.length > 0) {
        const fallback = await sparql(`SELECT ?x ?xLabel WHERE { VALUES ?x { ${missing.map((q) => `wd:${q}`).join(' ')} } SERVICE wikibase:label { bd:serviceParam wikibase:language "en,mul,ja,ko,zh,fr,de,es,hi,it,sv,da,pt,nl,ru,tr". } }`);
        for (const r of fallback) {
          const q = r.x.value.split('/').pop();
          const label = r.xLabel?.value ?? '';
          if (label && !isQ(label)) labels.set(q, label);
        }
      }
      done += batch.length;
      if (done % 4000 < BATCH) console.log(`labelled ${done}/${ids.size}`);
    } catch (error) {
      console.log(`FAIL batch: ${error.message}`);
      if (batch.length > 50) queue.push(...batch);
    }
  }
}
await Promise.all(Array.from({ length: PARALLEL }, worker));
console.log(`labels found: ${labels.size}`);

let changed = 0;
const relabel = (q, old) => { const l = labels.get(q); if (l && l !== old) { changed++; return l; } return old; };
for (const row of rows) {
  row.label = relabel(row.qid, row.label);
  for (const p of row.people) p.name = relabel(p.qid, p.name);
  for (const c of row.cast) c.name = relabel(c.qid, c.name);
  for (const key of ['types', 'basedOn', 'series', 'franchise', 'follows', 'followedBy', 'companies', 'distributors', 'broadcasters']) {
    row.lists[key] = (row.lists[key] ?? []).map((v) => { const [q, old] = v.split('\t'); return isQ(q) ? `${q}\t${relabel(q, old)}` : v; });
    if (row.lists[key].length === 0) delete row.lists[key];
  }
}
const tmp = new URL('./cache/details.ndjson.tmp', HERE);
writeFileSync(tmp, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
renameSync(tmp, detailsPath);
console.log(`names corrected: ${changed}`);
