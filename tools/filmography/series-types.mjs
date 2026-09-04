/**
 * Which "part of the series" and "media franchise" items are franchises and
 * which are lists. Wikidata files a film under "BBC's 100 Greatest Films of
 * the 21st Century" with the same property it uses for "Batman in film", so
 * the emitter needs to know which is which. Writes cache/series-types.json:
 * { qid: { label, types: [...], franchise: boolean } }.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const HERE = new URL('./', import.meta.url);
const UA = 'SLATE-build/1.0 (film simulator dataset builder; contact via repository)';
const rows = readFileSync(new URL('./cache/details.ndjson', HERE), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const ids = new Map();
for (const row of rows) {
  for (const key of ['series', 'franchise']) {
    for (const v of row.lists[key] ?? []) { const [q, label] = v.split('\t'); if (/^Q\d+$/.test(q)) ids.set(q, label); }
  }
}
console.log(`series and franchise items: ${ids.size}`);

async function sparql(query, attempt = 0) {
  try {
    const res = await fetch(`https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}`, { headers: { 'User-Agent': UA, Accept: 'application/sparql-results+json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()).results.bindings;
  } catch (error) {
    if (attempt >= 5) throw error;
    await new Promise((r) => setTimeout(r, 3000 * 2 ** attempt));
    return sparql(query, attempt + 1);
  }
}

const LIST = /list|ranking|poll|canon|top \d|greatest|registry|collection of|award|selection|catalogue|programme|festival|retrospective|box set|dvd|blu-ray|home video|box office|filmography|bibliography|set of|Wikimedia|category/i;
const FRANCHISE = /franchise|film series|series of films|trilogy|tetralogy|pentalogy|hexalogy|film cycle|sequel|shared universe|fictional universe|media mix|film duology|anthology film series|television franchise|cinematic universe|reboot|prequel|series of|serial|saga|duology|multimedia/i;

const out = {};
const queue = [...ids.keys()];
while (queue.length > 0) {
  const batch = queue.splice(0, 300);
  const rowsOut = await sparql(`SELECT ?x ?xLabel ?type ?typeLabel WHERE { VALUES ?x { ${batch.map((q) => `wd:${q}`).join(' ')} } OPTIONAL { ?x wdt:P31 ?type } SERVICE wikibase:label { bd:serviceParam wikibase:language "en,mul". } }`);
  for (const r of rowsOut) {
    const q = r.x.value.split('/').pop();
    const entry = out[q] ??= { label: r.xLabel?.value ?? ids.get(q), types: [] };
    if (r.typeLabel?.value) entry.types.push(r.typeLabel.value);
  }
  process.stdout.write(`typed ${Object.keys(out).length}/${ids.size}\n`);
}
let franchises = 0;
for (const [q, entry] of Object.entries(out)) {
  const typeText = entry.types.join(' | ');
  const listy = LIST.test(typeText) || LIST.test(entry.label ?? '');
  const franchisey = FRANCHISE.test(typeText);
  entry.franchise = franchisey && !listy ? true : !listy && entry.types.length === 0 ? true : !listy && !franchisey ? !/\b(list|100|top)\b/i.test(entry.label ?? '') : false;
  if (entry.franchise) franchises++;
}
writeFileSync(new URL('./cache/series-types.json', HERE), JSON.stringify(out, null, 1));
console.log(`franchises kept: ${franchises} of ${Object.keys(out).length}`);
const dropped = Object.entries(out).filter(([, e]) => !e.franchise).slice(0, 25).map(([, e]) => `${e.label} [${e.types.slice(0, 2).join(', ')}]`);
console.log('dropped samples:', dropped.join(' · '));
