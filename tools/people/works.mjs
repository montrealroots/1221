/**
 * Fills in the titles the roster is credited on.
 *
 * The credits pass gives a work's name and year. This gives the rest of what
 * a filmography line needs: its IMDb id, so a rating can be attached; what it
 * cost and what it took; and which franchise it belongs to. Batched, because
 * twenty thousand titles one at a time is a day of somebody's bandwidth.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';

const HERE = new URL('./', import.meta.url);
mkdirSync(new URL('./cache/', HERE), { recursive: true });
const UA = 'SLATE-build/1.0 (film simulator dataset builder; contact via repository)';
const ENDPOINT = 'https://query.wikidata.org/sparql';
// The label service falls through this list in order and hands back the bare
// Q-id when it reaches the end. A title nobody can read is worse than no
// title, so the list is long and anything that still comes back as an id is
// dropped rather than written.
const LANGS = 'en,mul,ja,ko,zh,fr,de,es,it,sv,da,pt,nl,ru,tr,fa,hi,cs,pl,ro,eu,ta,ml,ar,he,hu,el,uk,th,vi,id,no,fi,ca,gl,ast,cy,bn,te,mr,kn';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function sparql(query, attempt = 0) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 170_000);
  try {
    const res = await fetch(`${ENDPOINT}?query=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': UA, Accept: 'application/sparql-results+json' }, signal: controller.signal,
    });
    if (res.status === 429 || res.status >= 500) {
      if (attempt >= 7) throw new Error(`HTTP ${res.status} after retries`);
      await sleep(Number(res.headers.get('retry-after') ?? 0) * 1000 || 4000 * 2 ** Math.min(attempt, 4));
      return sparql(query, attempt + 1);
    }
    if (!res.ok) { const e = new Error(`HTTP ${res.status}`); e.fatal = true; throw e; }
    return (await res.json()).results.bindings;
  } catch (error) {
    if (error.fatal || attempt >= 7) throw error;
    await sleep(4000 * 2 ** Math.min(attempt, 4));
    return sparql(query, attempt + 1);
  } finally {
    clearTimeout(timer);
  }
}

const qid = (uri) => (uri ?? '').replace('http://www.wikidata.org/entity/', '');
const v = (b, k) => (b[k] ? b[k].value : '');

const creditsPath = new URL('./cache/credits.ndjson', HERE);
if (!existsSync(creditsPath)) { console.log('no credits cached yet'); process.exit(0); }

const wanted = new Set();
for (const line of readFileSync(creditsPath, 'utf8').split('\n')) {
  if (!line.trim()) continue;
  try { for (const work of JSON.parse(line).works) wanted.add(work.qid); } catch { /* partial line */ }
}
console.log(`${wanted.size} distinct titles on the roster's credits`);

const worksPath = new URL('./cache/works.ndjson', HERE);
const already = new Set();
if (existsSync(worksPath)) {
  for (const line of readFileSync(worksPath, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try { already.add(JSON.parse(line).qid); } catch { /* partial line */ }
  }
}
const todo = [...wanted].filter((q) => !already.has(q));
console.log(`${already.size} cached, ${todo.length} to pull`);

for (let i = 0; i < todo.length; i += 300) {
  const batch = todo.slice(i, i + 300);
  const values = batch.map((q) => `wd:${q}`).join(' ');
  let rows = [];
  try {
    rows = await sparql(`
      SELECT ?w ?imdb ?date ?box ?budget ?franchiseLabel ?seriesLabel ?countryLabel ?langLabel ?duration ?genreLabel ?companyLabel WHERE {
        VALUES ?w { ${values} }
        OPTIONAL { ?w wdt:P345 ?imdb . }
        OPTIONAL { ?w wdt:P577 ?date . }
        OPTIONAL { ?w wdt:P2142 ?box . }
        OPTIONAL { ?w wdt:P2130 ?budget . }
        OPTIONAL { ?w wdt:P8345 ?franchise . }
        OPTIONAL { ?w wdt:P179 ?series . }
        OPTIONAL { ?w wdt:P495 ?country . }
        OPTIONAL { ?w wdt:P364 ?lang . }
        OPTIONAL { ?w wdt:P2047 ?duration . }
        OPTIONAL { ?w wdt:P136 ?genre . }
        OPTIONAL { ?w wdt:P272 ?company . }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "${LANGS}" . }
      }`);
  } catch (error) {
    console.log(`  ! batch ${i}: ${error.message}`);
    continue;
  }
  const byWork = new Map();
  for (const row of rows) {
    const id = qid(v(row, 'w'));
    const entry = byWork.get(id) ?? {
      qid: id, imdb: '', date: '', box: 0, budget: 0, franchise: '', series: '',
      country: '', language: '', runtime: 0, genres: new Set(), companies: new Set(),
    };
    entry.imdb ||= v(row, 'imdb');
    entry.date ||= v(row, 'date').slice(0, 10);
    entry.box = Math.max(entry.box, Number(v(row, 'box') || 0));
    entry.budget = Math.max(entry.budget, Number(v(row, 'budget') || 0));
    entry.franchise ||= v(row, 'franchiseLabel');
    entry.country ||= v(row, 'countryLabel');
    entry.language ||= v(row, 'langLabel');
    entry.runtime = Math.max(entry.runtime, Number(v(row, 'duration') || 0));
    entry.series ||= v(row, 'seriesLabel');
    if (v(row, 'genreLabel')) entry.genres.add(v(row, 'genreLabel'));
    if (v(row, 'companyLabel')) entry.companies.add(v(row, 'companyLabel'));
    byWork.set(id, entry);
  }
  for (const id of batch) {
    const entry = byWork.get(id) ?? { qid: id };
    appendFileSync(worksPath, `${JSON.stringify({
      ...entry,
      genres: [...(entry.genres ?? [])].slice(0, 8),
      companies: [...(entry.companies ?? [])].slice(0, 4),
    })}\n`);
  }
  console.log(`  works ${Math.min(i + 300, todo.length)}/${todo.length}`);
  await sleep(300);
}
console.log('done');
