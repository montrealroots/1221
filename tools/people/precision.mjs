/**
 * Asks the record how precise each date of birth actually is.
 *
 * Wikidata stores a precision alongside a date: a year, a month, or a day.
 * A year-only date comes back looking like the first of January, and reading
 * an age off it produces nonsense — a showrunner winning an award at twelve.
 * So anything less precise than a day is kept as the year it is and never
 * used as a birthday.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const HERE = new URL('./', import.meta.url);
const UA = 'SLATE-build/1.0 (film simulator dataset builder; contact via repository)';
const ENDPOINT = 'https://query.wikidata.org/sparql';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function sparql(query, attempt = 0) {
  try {
    const res = await fetch(`${ENDPOINT}?query=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': UA, Accept: 'application/sparql-results+json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()).results.bindings;
  } catch (error) {
    if (attempt >= 6) throw error;
    await sleep(3000 * 2 ** Math.min(attempt, 4));
    return sparql(query, attempt + 1);
  }
}

const resolved = JSON.parse(readFileSync(new URL('./resolved.json', HERE), 'utf8'));
const qids = [...new Set(Object.values(resolved).map((r) => r.qid).filter(Boolean))];
const precision = {};

for (let i = 0; i < qids.length; i += 60) {
  const batch = qids.slice(i, i + 60);
  const values = batch.map((q) => `wd:${q}`).join(' ');
  const rows = await sparql(`
    SELECT ?p ?date ?precision WHERE {
      VALUES ?p { ${values} }
      ?p p:P569 ?st . ?st psv:P569 ?node .
      ?node wikibase:timeValue ?date ; wikibase:timePrecision ?precision .
    }`);
  for (const row of rows) {
    const qid = row.p.value.replace('http://www.wikidata.org/entity/', '');
    const level = Number(row.precision.value);
    const existing = precision[qid];
    if (!existing || level > existing.precision) {
      precision[qid] = { date: row.date.value.slice(0, 10), precision: level };
    }
  }
  console.log(`  ${Math.min(i + 60, qids.length)}/${qids.length}`);
  await sleep(250);
}

writeFileSync(new URL('./precision.json', HERE), JSON.stringify(precision, null, 1));
const counts = {};
for (const entry of Object.values(precision)) counts[entry.precision] = (counts[entry.precision] ?? 0) + 1;
console.log('precision levels (11 = day, 10 = month, 9 = year):', counts);
