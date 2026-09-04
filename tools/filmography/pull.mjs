/**
 * Pulls the catalogue of every studio label in resolved.json from Wikidata.
 *
 * Two stages, both resumable:
 *   1. list   — every film and series each label produced or distributed
 *   2. detail — credits, cast, money, genres, franchises, scores and awards
 *               for every title, in batches, appended to cache/details.ndjson
 *
 * Wikidata is CC0. The requests carry a User-Agent, back off on refusals,
 * and never run more than three at once. Run again to resume; nothing is
 * refetched.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';

const HERE = new URL('./', import.meta.url);
const CACHE = new URL('./cache/', HERE);
mkdirSync(CACHE, { recursive: true });
const UA = 'SLATE-build/1.0 (film simulator dataset builder; contact via repository)';
const ENDPOINT = 'https://query.wikidata.org/sparql';
const LANGS = 'en,mul,ja,ko,zh,fr,de,es,hi,it,sv,da,pt,nl,ru,tr';
const PARALLEL = 3;
const BATCH = 200;

const resolved = JSON.parse(readFileSync(new URL('./resolved.json', HERE), 'utf8'));
const only = process.argv[2] ? new Set(process.argv[2].split(',')) : null;

async function sparql(query, attempt = 0) {
  if (process.env.SLATE_DEBUG) console.log(`  sparql attempt ${attempt}: ${query.replace(/\s+/g, ' ').slice(0, 90)}`);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 170_000);
  try {
    const res = await fetch(`${ENDPOINT}?query=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': UA, Accept: 'application/sparql-results+json' }, signal: controller.signal,
    });
    if (res.status === 429 || res.status >= 500) {
      const wait = Number(res.headers.get('retry-after') ?? 0) * 1000 || 3000 * 2 ** attempt;
      if (attempt >= 6) throw new Error(`HTTP ${res.status} after retries`);
      await new Promise((r) => setTimeout(r, wait));
      return sparql(query, attempt + 1);
    }
    if (!res.ok) { const err = new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`); err.fatal = true; throw err; }
    return (await res.json()).results.bindings;
  } catch (error) {
    if (error.fatal || attempt >= 6) throw error;
    await new Promise((r) => setTimeout(r, 3000 * 2 ** attempt));
    return sparql(query, attempt + 1);
  } finally {
    clearTimeout(timer);
  }
}

const qid = (uri) => uri.replace('http://www.wikidata.org/entity/', '');
const v = (b, k) => (b[k] ? b[k].value : '');

// --- Stage 1: lists -------------------------------------------------------

const listsPath = new URL('./cache/lists.json', HERE);
const lists = existsSync(listsPath) ? JSON.parse(readFileSync(listsPath, 'utf8')) : {};

/**
 * Streaming services are recorded as the distributor of everything they
 * license, which is not their catalogue. For them only what they produced or
 * premiered counts; for a studio, what it released is its catalogue too.
 */
const STREAMING_SERVICES = new Set(['Q907311', 'Q116452644', 'Q116908492', 'Q62446736', 'Q4740868', 'Q28137015']);

async function listTitles(labelQid, kind) {
  const cls = kind === 'film' ? 'wd:Q11424' : 'wd:Q5398426';
  const one = async (prop, role) => {
    const rows = await sparql(`SELECT DISTINCT ?t WHERE { hint:Query hint:optimizer "None" . ?t wdt:${prop} wd:${labelQid} . ?t wdt:P31/wdt:P279* ${cls} . }`);
    return rows.map((r) => [qid(r.t.value), role]);
  };
  const out = await one('P272', 'produced');
  if (kind === 'tv') out.push(...await one('P449', 'aired'));
  else if (!STREAMING_SERVICES.has(labelQid)) out.push(...await one('P750', 'distributed'));
  return out;
}

for (const [studio, labels] of Object.entries(resolved)) {
  if (only && !only.has(studio)) continue;
  for (const kind of ['film', 'tv']) {
    for (const label of labels[kind]) {
      const key = `${label.qid}|${kind}`;
      if (lists[key]) continue;
      try {
        lists[key] = await listTitles(label.qid, kind);
        writeFileSync(listsPath, JSON.stringify(lists));
        console.log(`list  ${studio.padEnd(14)} ${kind.padEnd(4)} ${label.label.padEnd(36)} ${lists[key].length}`);
      } catch (error) {
        console.log(`FAIL  ${studio} ${kind} ${label.label}: ${error.message}`);
      }
    }
  }
}

// --- Stage 2: details ------------------------------------------------------

const detailsPath = new URL('./cache/details.ndjson', HERE);
const have = new Set();
if (existsSync(detailsPath)) {
  for (const line of readFileSync(detailsPath, 'utf8').split('\n')) {
    if (line) have.add(JSON.parse(line).qid);
  }
}

const wanted = new Map(); // qid -> kind
for (const [studio, labels] of Object.entries(resolved)) {
  if (only && !only.has(studio)) continue;
  for (const kind of ['film', 'tv']) {
    for (const label of labels[kind]) {
      for (const [t] of lists[`${label.qid}|${kind}`] ?? []) {
        if (!have.has(t)) wanted.set(t, wanted.get(t) === 'film' ? 'film' : kind);
      }
    }
  }
}
console.log(`details wanted: ${wanted.size} (have ${have.size})`);

const VALUES = (ids) => `VALUES ?t { ${ids.map((id) => `wd:${id}`).join(' ')} }`;
const LABEL = `SERVICE wikibase:label { bd:serviceParam wikibase:language "${LANGS}". }`;

async function detailBatch(ids) {
  const out = new Map(ids.map((id) => [id, { qid: id, people: [], cast: [], lists: {}, scores: [], dates: [], boxOffice: null, budget: null }]));
  const get = (r) => out.get(qid(r.t.value));
  const add = (id, key, value) => { const o = out.get(id); if (!o) return; (o.lists[key] ??= []).push(value); };

  for (const r of await sparql(`SELECT ?t ?tLabel WHERE { ${VALUES(ids)} ${LABEL} }`)) {
    const o = get(r); if (o) o.label = v(r, 'tLabel');
  }

  const scalarProps = { P577: 'dates', P2047: 'duration', P345: 'imdb', P1258: 'rtId', P1712: 'mcId', P2437: 'seasons', P1113: 'episodes', P580: 'start', P582: 'end', P1476: 'original' };
  for (const r of await sparql(`SELECT ?t ?p ?val WHERE { ${VALUES(ids)} VALUES ?p { ${Object.keys(scalarProps).map((p) => `wdt:${p}`).join(' ')} } ?t ?p ?val }`)) {
    const o = get(r); if (!o) continue;
    const key = scalarProps[r.p.value.split('/').pop()];
    const val = r.val.value;
    if (key === 'dates') o.dates.push(val.slice(0, 10));
    else if (key === 'start') o.start = o.start && o.start < val.slice(0, 10) ? o.start : val.slice(0, 10);
    else if (key === 'end') o.end = o.end && o.end > val.slice(0, 10) ? o.end : val.slice(0, 10);
    else if (!o[key]) o[key] = val;
  }
  for (const o of out.values()) { o.date = o.dates.filter((d) => !d.startsWith('-')).sort()[0] ?? ''; delete o.dates; }

  for (const [prop, key] of [['P2142', 'boxOffice'], ['P2130', 'budget']]) {
    for (const r of await sparql(`SELECT ?t ?amt ?ul WHERE { ${VALUES(ids)} ?t p:${prop} ?st . ?st psv:${prop} ?node . ?node wikibase:quantityAmount ?amt ; wikibase:quantityUnit ?u . ?u rdfs:label ?ul . FILTER(LANG(?ul) = "en") }`)) {
      const o = get(r); if (!o) continue;
      const amount = Number(r.amt.value);
      if (!o[key] || amount > o[key].amount) o[key] = { amount, unit: v(r, 'ul') };
    }
  }

  const multi = { P31: 'types', P136: 'genres', P495: 'countries', P364: 'languages', P272: 'companies', P750: 'distributors', P144: 'basedOn', P179: 'series', P8345: 'franchise', P449: 'broadcasters', P166: 'awards', P1657: 'mpaa', P155: 'follows', P156: 'followedBy', P921: 'subjects' };
  const linked = new Set(['types', 'basedOn', 'series', 'franchise', 'follows', 'followedBy', 'companies', 'distributors', 'broadcasters']);
  for (const r of await sparql(`SELECT ?t ?p ?val ?valLabel WHERE { ${VALUES(ids)} VALUES ?p { ${Object.keys(multi).map((p) => `wdt:${p}`).join(' ')} } ?t ?p ?val . ${LABEL} }`)) {
    const key = multi[r.p.value.split('/').pop()]; if (!key) continue;
    add(qid(r.t.value), key, linked.has(key) ? `${qid(r.val.value)}\t${v(r, 'valLabel')}` : v(r, 'valLabel'));
  }

  const roles = { P57: 'director', P58: 'writer', P162: 'producer', P1431: 'executive_producer', P86: 'composer', P344: 'cinematographer', P1040: 'editor', P2554: 'production_designer', P2515: 'costume_designer', P170: 'creator', P2438: 'narrator' };
  for (const r of await sparql(`SELECT ?t ?p ?who ?whoLabel WHERE { ${VALUES(ids)} VALUES ?p { ${Object.keys(roles).map((p) => `wdt:${p}`).join(' ')} } ?t ?p ?who . ${LABEL} }`)) {
    const o = get(r); if (!o) continue;
    o.people.push({ role: roles[r.p.value.split('/').pop()], qid: qid(r.who.value), name: v(r, 'whoLabel') });
  }

  const seen = new Set();
  for (const r of await sparql(`SELECT ?t ?who ?whoLabel ?charLabel ?charText ?ord WHERE { ${VALUES(ids)} ?t p:P161 ?st . ?st ps:P161 ?who . OPTIONAL { ?st pq:P453 ?char . ?char rdfs:label ?charLabel . FILTER(LANG(?charLabel) = "en") } OPTIONAL { ?st pq:P4633 ?charText } OPTIONAL { ?st pq:P1545 ?ord } ${LABEL} }`)) {
    const o = get(r); if (!o) continue;
    const key = `${o.qid}|${qid(r.who.value)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    o.cast.push({ qid: qid(r.who.value), name: v(r, 'whoLabel'), character: v(r, 'charLabel') || v(r, 'charText'), ordinal: v(r, 'ord') });
  }

  for (const r of await sparql(`SELECT ?t ?score ?by ?byLabel ?methodLabel ?count WHERE { ${VALUES(ids)} ?t p:P444 ?st . ?st ps:P444 ?score . OPTIONAL { ?st pq:P447 ?by } OPTIONAL { ?st pq:P459 ?method } OPTIONAL { ?st pq:P7887 ?count } ${LABEL} }`)) {
    const o = get(r); if (!o) continue;
    o.scores.push({ score: v(r, 'score'), by: r.by ? qid(r.by.value) : '', byLabel: v(r, 'byLabel'), method: v(r, 'methodLabel'), count: v(r, 'count') });
  }
  return [...out.values()];
}

const queue = [...wanted.keys()];
let done = 0;
async function worker() {
  while (queue.length > 0) {
    const ids = queue.splice(0, BATCH);
    try {
      const results = await detailBatch(ids);
      appendFileSync(detailsPath, results.map((r) => JSON.stringify(r)).join('\n') + '\n');
      done += ids.length;
      console.log(`detail ${done}/${wanted.size}`);
    } catch (error) {
      console.log(`FAIL batch of ${ids.length}: ${error.message}`);
      if (ids.length > 25) queue.push(...ids); // retried later in smaller pieces
    }
  }
}
await Promise.all(Array.from({ length: PARALLEL }, worker));
console.log('done');
