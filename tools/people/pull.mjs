/**
 * Pulls what the record holds on every resolved person.
 *
 * Three passes, all resumable and all cached to disk:
 *   facts   — born, from, citizenship, what they do, who they work for
 *   credits — every film and programme they are on, in every capacity
 *   awards  — every award won and every nomination, with the work it was for
 *
 * Episodes are left out on purpose: a filmography is the things somebody made,
 * not the four hundred episodes of one of them. Everything here is Wikidata,
 * which is CC0.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';

const HERE = new URL('./', import.meta.url);
const CACHE = new URL('./cache/', HERE);
mkdirSync(CACHE, { recursive: true });
const UA = 'SLATE-build/1.0 (film simulator dataset builder; contact via repository)';
const ENDPOINT = 'https://query.wikidata.org/sparql';
const LANGS = 'en,mul,ja,ko,zh,fr,de,es,it,sv,da,pt,nl,ru,tr,fa,hi';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function sparql(query, attempt = 0) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 170_000);
  try {
    const res = await fetch(`${ENDPOINT}?query=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': UA, Accept: 'application/sparql-results+json' }, signal: controller.signal,
    });
    if (res.status === 429 || res.status >= 500) {
      const wait = Number(res.headers.get('retry-after') ?? 0) * 1000 || 4000 * 2 ** Math.min(attempt, 4);
      if (attempt >= 7) throw new Error(`HTTP ${res.status} after retries`);
      await sleep(wait);
      return sparql(query, attempt + 1);
    }
    if (!res.ok) { const e = new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`); e.fatal = true; throw e; }
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

const resolved = JSON.parse(readFileSync(new URL('./resolved.json', HERE), 'utf8'));
const entries = Object.entries(resolved).filter(([, r]) => r.qid);
console.log(`${entries.length} people on file`);

/** Reads an NDJSON cache into a set of the ids already done. */
function doneIn(path) {
  if (!existsSync(path)) return new Set();
  const ids = new Set();
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try { ids.add(JSON.parse(line).qid); } catch { /* a half-written line at the end */ }
  }
  return ids;
}

const batches = (items, size) => {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
};

// --- Facts ---------------------------------------------------------------

const factsPath = new URL('./cache/facts.ndjson', HERE);
{
  const already = doneIn(factsPath);
  const todo = entries.filter(([, r]) => !already.has(r.qid));
  console.log(`facts: ${already.size} cached, ${todo.length} to pull`);
  for (const [i, batch] of batches(todo, 40).entries()) {
    const values = batch.map(([, r]) => `wd:${r.qid}`).join(' ');
    const rows = await sparql(`
      SELECT ?p ?birth ?death ?bornInLabel ?citizenLabel ?genderLabel ?occLabel ?imdb ?employerLabel ?memberLabel ?startYear WHERE {
        VALUES ?p { ${values} }
        OPTIONAL { ?p wdt:P569 ?birth . }
        OPTIONAL { ?p wdt:P570 ?death . }
        OPTIONAL { ?p wdt:P19 ?bornIn . }
        OPTIONAL { ?p wdt:P27 ?citizen . }
        OPTIONAL { ?p wdt:P21 ?gender . }
        OPTIONAL { ?p wdt:P106 ?occ . }
        OPTIONAL { ?p wdt:P345 ?imdb . }
        OPTIONAL { ?p wdt:P108 ?employer . }
        OPTIONAL { ?p wdt:P463 ?member . }
        OPTIONAL { ?p wdt:P2031 ?startYear . }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "${LANGS}" . }
      }`);
    const byPerson = new Map();
    for (const row of rows) {
      const id = qid(v(row, 'p'));
      const entry = byPerson.get(id) ?? {
        qid: id, birth: '', death: '', bornIn: '', citizenship: new Set(), gender: '',
        occupations: new Set(), imdb: '', employers: new Set(), memberOf: new Set(), startYear: '',
      };
      if (v(row, 'birth')) entry.birth ||= v(row, 'birth').slice(0, 10);
      if (v(row, 'death')) entry.death ||= v(row, 'death').slice(0, 10);
      if (v(row, 'bornInLabel')) entry.bornIn ||= v(row, 'bornInLabel');
      if (v(row, 'citizenLabel')) entry.citizenship.add(v(row, 'citizenLabel'));
      if (v(row, 'genderLabel')) entry.gender ||= v(row, 'genderLabel');
      if (v(row, 'occLabel')) entry.occupations.add(v(row, 'occLabel'));
      if (v(row, 'imdb')) entry.imdb ||= v(row, 'imdb');
      if (v(row, 'employerLabel')) entry.employers.add(v(row, 'employerLabel'));
      if (v(row, 'memberLabel')) entry.memberOf.add(v(row, 'memberLabel'));
      if (v(row, 'startYear')) entry.startYear ||= v(row, 'startYear').slice(0, 4);
      byPerson.set(id, entry);
    }
    for (const [, r] of batch) {
      const entry = byPerson.get(r.qid) ?? { qid: r.qid };
      appendFileSync(factsPath, `${JSON.stringify({
        ...entry,
        citizenship: [...(entry.citizenship ?? [])],
        occupations: [...(entry.occupations ?? [])],
        employers: [...(entry.employers ?? [])],
        memberOf: [...(entry.memberOf ?? [])],
      })}\n`);
    }
    console.log(`  facts batch ${i + 1}/${batches(todo, 40).length}`);
    await sleep(300);
  }
}

// --- Credits -------------------------------------------------------------

/** What counts as a title. Episodes and seasons are not filmography entries. */
const WORK_TYPES = `VALUES ?type { wd:Q11424 wd:Q5398426 wd:Q506240 wd:Q1261214 wd:Q93204 wd:Q202866 wd:Q24862 wd:Q24856 wd:Q29168811 wd:Q1366112 }`;

/** Every capacity the record credits somebody in, and what SLATE calls it. */
const ROLE_PROPS = [
  ['P161', 'cast'], ['P57', 'director'], ['P58', 'writer'], ['P162', 'producer'],
  ['P1431', 'executive producer'], ['P86', 'composer'], ['P344', 'cinematographer'],
  ['P170', 'creator'], ['P175', 'performer'],
];

const creditsPath = new URL('./cache/credits.ndjson', HERE);
{
  const already = doneIn(creditsPath);
  const todo = entries.filter(([, r]) => !already.has(r.qid));
  console.log(`credits: ${already.size} cached, ${todo.length} to pull`);

  // One query per person per property is nine queries a head and takes hours.
  // One query per property for forty people at a time is a hundred and eighty
  // queries for the whole roster, and the endpoint prefers it too.
  const collected = new Map(todo.map(([, r]) => [r.qid, new Map()]));
  const groups = batches(todo, 40);
  for (const [gi, group] of groups.entries()) {
    const values = group.map(([, r]) => `wd:${r.qid}`).join(' ');
    for (const [prop, role] of ROLE_PROPS) {
      let rows = [];
      try {
        rows = await sparql(`
          SELECT ?p ?work ?workLabel ?typeLabel ?date WHERE {
            VALUES ?p { ${values} }
            ?work wdt:${prop} ?p .
            ?work wdt:P31 ?type .
            ${WORK_TYPES}
            OPTIONAL { ?work wdt:P577 ?date . }
            SERVICE wikibase:label { bd:serviceParam wikibase:language "${LANGS}" . }
          }`);
      } catch (error) {
        console.log(`  ! ${prop} batch ${gi}: ${error.message}`);
        continue;
      }
      for (const row of rows) {
        const person = qid(v(row, 'p'));
        const workId = qid(v(row, 'work'));
        const bucket = collected.get(person);
        if (!bucket) continue;
        const entry = bucket.get(workId) ?? {
          qid: workId, title: v(row, 'workLabel'), kind: v(row, 'typeLabel'),
          date: v(row, 'date').slice(0, 10), roles: new Set(),
          genres: [], series: [], companies: [],
        };
        entry.roles.add(role);
        if (!entry.date && v(row, 'date')) entry.date = v(row, 'date').slice(0, 10);
        bucket.set(workId, entry);
      }
      await sleep(150);
    }
    for (const [, r] of group) {
      const bucket = collected.get(r.qid) ?? new Map();
      appendFileSync(creditsPath, `${JSON.stringify({
        qid: r.qid,
        works: [...bucket.values()].map((w) => ({ ...w, roles: [...w.roles] })),
      })}\n`);
      collected.delete(r.qid);
    }
    console.log(`  credits ${Math.min((gi + 1) * 40, todo.length)}/${todo.length}`);
  }
}

// --- Awards --------------------------------------------------------------

const awardsPath = new URL('./cache/awards.ndjson', HERE);
{
  const already = doneIn(awardsPath);
  const todo = entries.filter(([, r]) => !already.has(r.qid));
  console.log(`awards: ${already.size} cached, ${todo.length} to pull`);
  const groups = batches(todo, 30);
  for (const [gi, group] of groups.entries()) {
    const values = group.map(([, r]) => `wd:${r.qid}`).join(' ');
    let rows = [];
    try {
      rows = await sparql(`
        SELECT ?p ?awardLabel ?outcome ?forLabel ?when WHERE {
          VALUES ?p { ${values} }
          { ?p p:P166 ?st . BIND("won" AS ?outcome) }
          UNION
          { ?p p:P1411 ?st . BIND("nominated" AS ?outcome) }
          ?st ps:P166|ps:P1411 ?award .
          OPTIONAL { ?st pq:P1686 ?for . }
          OPTIONAL { ?st pq:P585 ?when . }
          SERVICE wikibase:label { bd:serviceParam wikibase:language "${LANGS}" . }
        }`);
    } catch (error) {
      console.log(`  ! awards batch ${gi}: ${error.message}`);
    }
    const byPerson = new Map(group.map(([, r]) => [r.qid, []]));
    const seen = new Set();
    for (const row of rows) {
      const person = qid(v(row, 'p'));
      const key = `${person}|${v(row, 'awardLabel')}|${v(row, 'outcome')}|${v(row, 'forLabel')}|${v(row, 'when').slice(0, 4)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      byPerson.get(person)?.push({
        award: v(row, 'awardLabel'), outcome: v(row, 'outcome'),
        forWork: v(row, 'forLabel'), year: v(row, 'when').slice(0, 4),
      });
    }
    for (const [, r] of group) {
      appendFileSync(awardsPath, `${JSON.stringify({ qid: r.qid, awards: byPerson.get(r.qid) ?? [] })}\n`);
    }
    console.log(`  awards ${Math.min((gi + 1) * 30, todo.length)}/${todo.length}`);
    await sleep(250);
  }
}

console.log('done');
