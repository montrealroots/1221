/**
 * Turns the roster's names into entries in the public record.
 *
 * A name is not an identity. "Will Smith" is two people, "Michael Cimino" is
 * two people, and half the cinematographers share a name with somebody more
 * famous. So every candidate is checked against what the record says they do
 * before it is accepted, and anything that cannot be settled is reported
 * rather than guessed at.
 *
 * Wikidata is CC0. Requests carry a User-Agent and back off on refusal.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { roster, HINTS, OVERRIDES, NOT_IN_RECORD } from './roster.mjs';

const HERE = new URL('./', import.meta.url);
mkdirSync(new URL('./cache/', HERE), { recursive: true });
const UA = 'SLATE-build/1.0 (film simulator dataset builder; contact via repository)';
const SEARCH = 'https://www.wikidata.org/w/api.php';
const ENDPOINT = 'https://query.wikidata.org/sparql';

/** Occupations that count as doing each job, as the record states them. */
const OCCUPATIONS = {
  actor: ['Q33999', 'Q10800557', 'Q10798782', 'Q2405480', 'Q948329'],
  director: ['Q2526255', 'Q3455803', 'Q5322166', 'Q7042855'],
  producer: ['Q3282637', 'Q578109', 'Q2500638', 'Q1414443'],
  showrunner: ['Q28389', 'Q18939491', 'Q3282637', 'Q578109', 'Q6625963', 'Q4853732'],
  cinematographer: ['Q222344', 'Q1208175'],
  composer: ['Q36834', 'Q21234378', 'Q1259917', 'Q639669'],
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function search(name, attempt = 0) {
  const url = `${SEARCH}?action=wbsearchentities&search=${encodeURIComponent(name)}&language=en&uselang=en&type=item&limit=10&format=json&origin=*`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    // The search API rate-limits hard and says for how long. Waiting is the
    // polite answer and the only one that works.
    if (res.status === 429) {
      const wait = Number(res.headers.get('retry-after') ?? 0) * 1000 || 20_000 * (attempt + 1);
      if (attempt >= 8) throw new Error('rate limited after waiting');
      await sleep(wait);
      return search(name, attempt + 1);
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return (json.search ?? []).map((s) => ({
      qid: s.id,
      label: s.display?.label?.value ?? s.label ?? name,
      description: s.display?.description?.value ?? s.description ?? '',
      match: s.match?.text ?? '',
    }));
  } catch (error) {
    if (attempt >= 8) throw error;
    await sleep(4000 * 2 ** Math.min(attempt, 4));
    return search(name, attempt + 1);
  }
}

async function sparql(query, attempt = 0) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120_000);
  try {
    const res = await fetch(`${ENDPOINT}?query=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': UA, Accept: 'application/sparql-results+json' }, signal: controller.signal,
    });
    if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return (await res.json()).results.bindings;
  } catch (error) {
    if (attempt >= 6) throw error;
    await sleep(2500 * 2 ** attempt);
    return sparql(query, attempt + 1);
  } finally {
    clearTimeout(timer);
  }
}

const qidOf = (uri) => uri.replace('http://www.wikidata.org/entity/', '');

/** What the record says a batch of candidates are and do. */
async function factsFor(qids) {
  const values = qids.map((q) => `wd:${q}`).join(' ');
  const rows = await sparql(`
    SELECT ?p ?instance ?occ ?birth WHERE {
      VALUES ?p { ${values} }
      OPTIONAL { ?p wdt:P31 ?instance . }
      OPTIONAL { ?p wdt:P106 ?occ . }
      OPTIONAL { ?p wdt:P569 ?birth . }
    }`);
  const out = new Map();
  for (const row of rows) {
    const id = qidOf(row.p.value);
    const entry = out.get(id) ?? { qid: id, human: false, occupations: new Set(), birth: undefined };
    if (row.instance && qidOf(row.instance.value) === 'Q5') entry.human = true;
    if (row.occ) entry.occupations.add(qidOf(row.occ.value));
    if (row.birth && !entry.birth) entry.birth = row.birth.value.slice(0, 10);
    out.set(id, entry);
  }
  return out;
}

/**
 * Resolves a batch of names in one query against the record's own labels and
 * aliases. The search API rate-limits hard; the query service does not, and it
 * returns the occupations and the description in the same pass, which is what
 * the check needs anyway.
 */
async function batchByLabel(names) {
  const escape = (n) => n.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const values = names.flatMap((n) => [`"${escape(n)}"@en`, `"${escape(n)}"@mul`]).join(' ');
  const rows = await sparql(`
    SELECT ?name ?p ?desc (GROUP_CONCAT(DISTINCT ?occ; separator="|") AS ?occs) ?birth WHERE {
      VALUES ?name { ${values} }
      { ?p rdfs:label ?name } UNION { ?p skos:altLabel ?name }
      ?p wdt:P31 wd:Q5 .
      OPTIONAL { ?p wdt:P569 ?birth . }
      OPTIONAL { ?p wdt:P106 ?occRaw . BIND(STRAFTER(STR(?occRaw), "entity/") AS ?occ) }
      OPTIONAL { ?p schema:description ?desc . FILTER(lang(?desc) = 'en') }
    } GROUP BY ?name ?p ?desc ?birth`);
  const out = new Map();
  for (const row of rows) {
    const name = row.name.value;
    const list = out.get(name) ?? [];
    const id = qidOf(row.p.value);
    if (list.some((c) => c.qid === id)) continue;
    list.push({
      qid: id,
      label: name,
      description: row.desc?.value ?? '',
      occupations: (row.occs?.value ?? '').split('|').filter(Boolean),
      birth: row.birth?.value?.slice(0, 10),
    });
    out.set(name, list);
  }
  return out;
}

/** Picks the person a name means, out of everybody who shares it. */
function choose(person, candidates) {
  const hint = HINTS[person.name];
  const wanted = new Set(person.roles.flatMap((role) => OCCUPATIONS[role] ?? []));
  return candidates.map((candidate, index) => {
    let score = 10;
    const why = [];
    const matches = candidate.occupations.filter((occ) => wanted.has(occ));
    if (matches.length > 0) { score += 40 + matches.length * 4; why.push(`does the job (${matches.length} matching occupations)`); }
    if (hint?.wants && hint.wants.test(candidate.description)) { score += 45; why.push('matches the disambiguation hint'); }
    if (hint?.avoids && hint.avoids.test(candidate.description)) { score -= 70; why.push('matches what the hint rules out'); }
    if (candidate.birth) { score += 4; why.push('has a date of birth on record'); }
    if (/film|television|actor|actress|director|producer|screenwriter|composer|cinematograph|showrunner/i.test(candidate.description)) {
      score += 8; why.push('the record describes them as working in film or television');
    }
    score += Math.max(0, 6 - index);
    return { candidate, score, why };
  }).sort((a, b) => b.score - a.score);
}

const people = roster();
const outPath = new URL('./resolved.json', HERE);
const resolved = existsSync(outPath) ? JSON.parse(readFileSync(outPath, 'utf8')) : {};
const only = process.argv[2] ? Number(process.argv[2]) : people.length;

let fresh = 0;
const problems = [];
// Anything settled by hand is settled before the search starts, and anything
// known to be absent is never searched for at all.
const absent = new Set(NOT_IN_RECORD.map((entry) => entry.name));
for (const person of people) {
  const override = OVERRIDES[person.name];
  if (!override || resolved[person.name]?.qid === override.qid) continue;
  resolved[person.name] = {
    qid: override.qid, label: person.name, description: '',
    roles: person.roles, listedAs: person.listedAs,
    confidence: 100, why: override.why, how: 'chosen by hand',
  };
}
const todo = people.slice(0, only).filter((p) => !resolved[p.name]?.qid && !absent.has(p.name));
console.log(`${people.length} on the roster, ${todo.length} still to resolve`);

// Pass one: the record's own labels and aliases, forty names at a time.
const stillMissing = [];
for (let i = 0; i < todo.length; i += 40) {
  const batch = todo.slice(i, i + 40);
  let found;
  try {
    found = await batchByLabel(batch.map((p) => p.name));
  } catch (error) {
    console.log(`  ! label batch ${i}: ${error.message}`);
    stillMissing.push(...batch);
    continue;
  }
  for (const person of batch) {
    const candidates = found.get(person.name) ?? [];
    if (candidates.length === 0) { stillMissing.push(person); continue; }
    const scored = choose(person, candidates);
    const best = scored[0];
    if (!best || best.score < 30) { stillMissing.push(person); continue; }
    resolved[person.name] = {
      qid: best.candidate.qid, label: person.name, description: best.candidate.description,
      roles: person.roles, listedAs: person.listedAs, birth: best.candidate.birth,
      occupations: best.candidate.occupations, confidence: best.score,
      why: best.why.join('; '), how: 'label',
      runnerUp: scored[1] ? `${scored[1].candidate.qid} (${scored[1].score}) ${scored[1].candidate.description}` : undefined,
      note: HINTS[person.name]?.note,
    };
    fresh++;
  }
  writeFileSync(outPath, JSON.stringify(resolved, null, 1));
  console.log(`  labels ${Math.min(i + 40, todo.length)}/${todo.length} — ${fresh} resolved, ${stillMissing.length} for the search API`);
  await sleep(200);
}

// Pass two: the search API, for the names the record does not label exactly.
console.log(`search API: ${stillMissing.length} names`);
for (const person of stillMissing) {
  let candidates;
  try {
    candidates = await search(person.name);
  } catch (error) {
    problems.push({ name: person.name, roles: person.roles, why: `search failed: ${error.message}` });
    continue;
  }
  if (candidates.length === 0) {
    problems.push({ name: person.name, roles: person.roles, why: 'nothing in the record under that name' });
    continue;
  }
  const facts = await factsFor(candidates.map((c) => c.qid));
  const enriched = candidates
    .filter((c) => facts.get(c.qid)?.human)
    .map((c) => ({ ...c, occupations: [...(facts.get(c.qid)?.occupations ?? [])], birth: facts.get(c.qid)?.birth }));
  if (enriched.length === 0) {
    problems.push({ name: person.name, roles: person.roles, why: 'no candidate under that name is a person' });
    continue;
  }
  const scored = choose(person, enriched);
  const best = scored[0];
  if (!best || best.score < 25) {
    problems.push({
      name: person.name, roles: person.roles, why: 'no candidate does this job on the record',
      saw: enriched.slice(0, 3).map((c) => `${c.qid} — ${c.description}`),
    });
    continue;
  }
  resolved[person.name] = {
    qid: best.candidate.qid, label: best.candidate.label, description: best.candidate.description,
    roles: person.roles, listedAs: person.listedAs, birth: best.candidate.birth,
    occupations: best.candidate.occupations, confidence: best.score,
    why: best.why.join('; '), how: 'search',
    runnerUp: scored[1] ? `${scored[1].candidate.qid} (${scored[1].score}) ${scored[1].candidate.description}` : undefined,
    note: HINTS[person.name]?.note,
  };
  fresh++;
  if (fresh % 10 === 0) writeFileSync(outPath, JSON.stringify(resolved, null, 1));
  await sleep(700);
}

writeFileSync(outPath, JSON.stringify(resolved, null, 1));
writeFileSync(new URL('./unresolved.json', HERE), JSON.stringify(problems, null, 1));
console.log(`resolved ${Object.keys(resolved).length} of ${people.length}; ${problems.length} unresolved`);
for (const problem of problems.slice(0, 25)) console.log(`  ${problem.name}: ${problem.why}`);
