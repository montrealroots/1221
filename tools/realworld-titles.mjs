/**
 * SLATE's real-world film and television records, from Wikidata (CC0 1.0:
 * free to use with no attribution owed, which IMDb's data isn't: its terms
 * forbid reuse in a database, and its datasets are for non-commercial use
 * only; `docs/research/world/research-entertainment-database.json`).
 *
 * For each of the ten companies (`research-industry-companies.json`), the
 * films and series 2015 to 2026 Wikidata credits to one of its studios,
 * networks or streamers as producer (P272), distributor (P750) or original
 * broadcaster (P449), the most linked first (sitelinks: how many Wikipedias
 * have an article, a measure of note, not of quality). Then each title's
 * facts: its kind, first date, genres, countries, language, running time,
 * directors, cast and the characters they played where Wikidata says,
 * companies, what it's based on and follows, seasons and episodes, and awards
 * won and nominations. What Wikidata doesn't hold is left out, never filled.
 *
 * Every entity id is checked against its English label before it's used:
 * an id typed from memory and wrong fails the run here, not the data later.
 *
 *   node tools/realworld-titles.mjs            # fetch and write
 *   node tools/realworld-titles.mjs --check    # the file's shape and counts
 *
 * Wikidata asks for a descriptive User-Agent and few requests; each request
 * waits its turn.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const OUT = 'src/engine/content/realworld/titles.json';
const UA = 'SLATE-game-research/1.0 (actor life simulation; one-off import of CC0 film and TV facts)';
const PER_COMPANY = Number(process.env.PER_COMPANY ?? 70);
const CAST_MOST = 10;

/**
 * Each company's studios, networks and streamers, as Wikidata names them, by the research's own division list,
 * resolved by their English labels on 2026-10-08 (the first ids, typed from memory, were 41 of 64 wrong: a
 * trilobite, a parish in Portugal). Peacock and Apple Original Films weren't found as items of their own, so
 * Comcast's streaming titles and Apple's films come through the companies' other names or not at all.
 */
export const COMPANY_ENTITIES = {
  'walt-disney': { 'Q191224': 'Walt Disney Pictures', 'Q1047410': 'Walt Disney Animation Studios', 'Q127552': 'Pixar', 'Q367466': 'Marvel Studios', 'Q242446': 'Lucasfilm', 'Q434841': '20th Century Studios', 'Q953040': 'Searchlight Pictures', 'Q169889': 'American Broadcasting Company', 'Q651228': 'FX', 'Q54958752': 'Disney+', 'Q1630304': 'Hulu' },
  netflix: { 'Q907311': 'Netflix' },
  'comcast-nbcuniversal': { 'Q168383': 'Universal Pictures', 'Q649649': 'Focus Features', 'Q500088': 'DreamWorks Animation', 'Q1337530': 'Universal Television', 'Q13974': 'NBC', 'Q3510971': 'Sky Atlantic', 'Q2939795': 'Carnival Films', 'Q1189512': 'Illumination' },
  'skydance-corporation': { 'Q159846': 'Paramount Pictures', 'Q8016302': 'Warner Bros. Pictures', 'Q79202': 'New Line Cinema', 'Q31197934': 'DC Studios', 'Q43380': 'CBS', 'Q23633': 'HBO', 'Q27903045': 'Paramount+', 'Q65359104': 'HBO Max', 'Q1156642': 'Warner Bros. Television Studios', 'Q3486445': 'Skydance Media' },
  'sony-pictures-entertainment': { 'Q186941': 'Columbia Pictures', 'Q651454': 'TriStar Pictures', 'Q1370297': 'Screen Gems', 'Q1320443': 'Sony Pictures Classics', 'Q1416835': 'Sony Pictures Animation', 'Q652390': 'Sony Pictures Television', 'Q6516806': 'Left Bank Pictures', 'Q85744869': 'Bad Wolf' },
  'amazon-mgm-studios': { 'Q4740868': 'Amazon MGM Studios', 'Q4740856': 'Amazon Prime Video', 'Q179200': 'Metro-Goldwyn-Mayer', 'Q219400': 'United Artists', 'Q891732': 'Orion Pictures' },
  'apple-tv': { 'Q62446736': 'Apple TV' },
  'lionsgate-studios': { 'Q17076072': 'Lionsgate Films', 'Q632323': 'Summit Entertainment', 'Q3242008': 'Lionsgate Television', 'Q7339672': 'Roadside Attractions', 'Q1344736': 'Lionsgate Canada' },
  bbc: { 'Q191472': 'BBC One', 'Q216108': 'BBC Two', 'Q687427': 'BBC Three', 'Q2557489': 'BBC iPlayer', 'Q24039192': 'BBC Studios', 'Q971446': 'BBC Film' },
  itv: { 'Q220072': 'ITV', 'Q5975124': 'ITVX', 'Q5975134': 'ITV Studios', 'Q6745872': 'Mammoth Screen', 'Q8036075': 'World Productions', 'Q4035093': 'Big Talk Studios' },
};

const KINDS = {
  'Q11424': 'film', 'Q202866': 'film', 'Q506240': 'film', 'Q24862': 'short',
  'Q5398426': 'series', 'Q581714': 'series', 'Q1259759': 'series', 'Q526877': 'series', 'Q117467246': 'series', 'Q63952888': 'series',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let last = 0;
async function get(url, params) {
  const wait = 1500 - (Date.now() - last);
  if (wait > 0) await sleep(wait);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    last = Date.now();
    const res = await fetch(`${url}?${new URLSearchParams(params)}`, { headers: { 'User-Agent': UA, Accept: 'application/sparql-results+json, application/json' } });
    if (res.ok) return res.json();
    if (res.status === 429 || res.status >= 500) { await sleep(5000 * (attempt + 1)); continue; }
    throw new Error(`${res.status} ${await res.text().then((t) => t.slice(0, 200))}`);
  }
  throw new Error(`gave up on ${url}`);
}
const sparql = (query) => get('https://query.wikidata.org/sparql', { query, format: 'json' }).then((j) => j.results.bindings);
const qid = (uri) => uri.slice(uri.lastIndexOf('/') + 1);

/** Each id's English label, fifty at a time. */
async function labels(ids) {
  const out = {};
  for (let i = 0; i < ids.length; i += 50) {
    const j = await get('https://www.wikidata.org/w/api.php', { action: 'wbgetentities', ids: ids.slice(i, i + 50).join('|'), props: 'labels', languages: 'en', format: 'json' });
    for (const [id, e] of Object.entries(j.entities)) out[id] = e.labels?.en?.value;
  }
  return out;
}

async function fetchAll() {
  // The ids first: each must be what it says.
  const all = Object.values(COMPANY_ENTITIES).flatMap((m) => Object.keys(m));
  const named = await labels(all);
  const wrong = [];
  for (const [company, m] of Object.entries(COMPANY_ENTITIES)) for (const [id, want] of Object.entries(m)) if (named[id] !== want) wrong.push(`${company} ${id}: wanted "${want}", Wikidata says "${named[id]}"`);
  if (wrong.length) { console.error('Entity ids that aren’t what they say:\n  ' + wrong.join('\n  ')); process.exit(1); }

  const kinds = Object.keys(KINDS).map((k) => `wd:${k}`).join(' ');
  const picked = new Map(); // title qid -> company ids
  for (const [company, m] of Object.entries(COMPANY_ENTITIES)) {
    const values = Object.keys(m).map((k) => `wd:${k}`).join(' ');
    const rows = await sparql(`SELECT ?t (MAX(?links) AS ?n) WHERE {
      VALUES ?co { ${values} } VALUES ?kind { ${kinds} }
      ?t wdt:P31 ?kind . { ?t wdt:P272 ?co } UNION { ?t wdt:P750 ?co } UNION { ?t wdt:P449 ?co }
      ?t wdt:P577 ?d . FILTER(YEAR(?d) >= 2015 && YEAR(?d) <= 2026)
      ?t wikibase:sitelinks ?links .
    } GROUP BY ?t ORDER BY DESC(?n) LIMIT ${PER_COMPANY}`);
    for (const r of rows) { const id = qid(r.t.value); const set = picked.get(id) ?? new Set(); set.add(company); picked.set(id, set); }
    console.log(`${company}: ${rows.length}`);
  }

  const ids = [...picked.keys()];
  const titles = [];
  const people = new Map();
  for (let i = 0; i < ids.length; i += 40) {
    const chunk = ids.slice(i, i + 40);
    const values = chunk.map((k) => `wd:${k}`).join(' ');
    const facts = await sparql(`SELECT ?t ?p ?v ?q WHERE {
      VALUES ?t { ${values} }
      VALUES ?p { wdt:P31 wdt:P577 wdt:P136 wdt:P495 wdt:P364 wdt:P57 wdt:P272 wdt:P750 wdt:P449 wdt:P144 wdt:P155 wdt:P156 wdt:P166 wdt:P1411 wdt:P2437 wdt:P1113 wdt:P915 wdt:P179 }
      ?t ?p ?v .
    }`);
    // The cast in the credits' order where Wikidata gives one (P1545), then the most documented first: Wikidata keeps no
    // order of its own, and taken as it came the first ten of Oppenheimer's were its smallest parts.
    const cast = await sparql(`SELECT ?t ?a ?role ?ord ?links WHERE {
      VALUES ?t { ${values} }
      ?t p:P161 ?st . ?st ps:P161 ?a . ?a wikibase:sitelinks ?links .
      OPTIONAL { ?st pq:P1545 ?ord }
      OPTIONAL { ?st pq:P453 ?r . ?r rdfs:label ?role FILTER(LANG(?role) = "en") }
      OPTIONAL { ?st pq:P4633 ?role }
    }`);
    cast.sort((a, b) => (Number(a.ord?.value ?? Infinity) - Number(b.ord?.value ?? Infinity)) || (Number(b.links.value) - Number(a.links.value)));
    // Running time, normalized: Wikidata keeps a duration in the unit it was entered in, minutes or seconds.
    const runtime = await sparql(`SELECT ?t ?sec WHERE { VALUES ?t { ${values} } ?t p:P2047 ?st . ?st psn:P2047 ?n . ?n wikibase:quantityAmount ?sec . }`);

    const byT = new Map(chunk.map((k) => [k, { id: k, facts: {}, cast: [] }]));
    for (const r of facts) {
      const t = byT.get(qid(r.t.value)); const p = qid(r.p.value);
      const v = r.v.type === 'uri' ? qid(r.v.value) : r.v.value;
      (t.facts[p] ??= []).includes(v) || t.facts[p].push(v);
    }
    for (const r of cast) {
      const t = byT.get(qid(r.t.value)); const a = qid(r.a.value);
      const had = t.cast.find((c) => c.id === a);
      if (had) { if (r.role && !had.character) had.character = r.role.value; continue; }
      if (t.cast.length < CAST_MOST) t.cast.push({ id: a, ...(r.role ? { character: r.role.value } : {}) });
    }
    for (const r of runtime) { const t = byT.get(qid(r.t.value)); t.facts.minutes ??= Math.round(Number(r.sec.value) / 60); }
    titles.push(...byT.values());
    console.log(`facts ${Math.min(i + 40, ids.length)} / ${ids.length}`);
  }

  // Every id that's shown needs its name: titles, people, companies, genres, countries, awards, places.
  const need = new Set();
  for (const t of titles) {
    need.add(t.id);
    for (const p of ['P136', 'P495', 'P364', 'P57', 'P272', 'P750', 'P449', 'P144', 'P155', 'P156', 'P166', 'P1411', 'P915', 'P179']) for (const v of t.facts[p] ?? []) if (/^Q\d+$/.test(v)) need.add(v);
    for (const c of t.cast) need.add(c.id);
  }
  const names = await labels([...need]);

  const year = (t) => Math.min(...(t.facts.P577 ?? []).map((d) => Number(String(d).slice(0, 4))).filter(Boolean));
  const date = (t) => (t.facts.P577 ?? []).map(String).sort()[0]?.slice(0, 10);
  const kindOf = (t) => (t.facts.P31 ?? []).map((k) => KINDS[k]).find(Boolean) ?? 'film';
  const ref = (v) => (/^Q\d+$/.test(v) && names[v] ? { id: v, name: names[v] } : undefined);
  const refs = (vs) => (vs ?? []).map(ref).filter(Boolean);
  const out = titles.filter((t) => names[t.id]).map((t) => {
    for (const c of t.cast) if (names[c.id]) people.set(c.id, names[c.id]);
    for (const d of t.facts.P57 ?? []) if (names[d]) people.set(d, names[d]);
    const minutes = Number(t.facts.minutes);
    return {
      id: t.id, title: names[t.id], kind: kindOf(t), year: year(t), released: date(t),
      companies: [...picked.get(t.id)],
      filmGenres: refs(t.facts.P136).map((g) => g.name), countries: refs(t.facts.P495).map((c) => c.name), languages: refs(t.facts.P364).map((l) => l.name),
      ...(Number.isFinite(minutes) && minutes > 0 ? { minutes: Math.round(minutes) } : {}),
      directors: refs(t.facts.P57).map((d) => d.id),
      cast: t.cast.filter((c) => names[c.id]).map((c) => ({ person: c.id, ...(c.character ? { character: c.character } : {}) })),
      producers: refs(t.facts.P272), distributors: refs(t.facts.P750), broadcasters: refs(t.facts.P449),
      basedOn: refs(t.facts.P144), follows: refs(t.facts.P155), followedBy: refs(t.facts.P156), partOf: refs(t.facts.P179),
      locations: refs(t.facts.P915).map((l) => l.name).slice(0, 6),
      ...(t.facts.P2437 ? { seasons: Number(t.facts.P2437[0]) } : {}),
      ...(t.facts.P1113 ? { episodes: Number(t.facts.P1113[0]) } : {}),
      awards: refs(t.facts.P166).map((a) => a.name), nominations: refs(t.facts.P1411).map((a) => a.name),
    };
  }).sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));

  const file = {
    source: 'Wikidata (https://www.wikidata.org), structured data CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)',
    retrieved: new Date().toISOString().slice(0, 10),
    scope: `Films and series first released 2015–2026 credited in Wikidata to a studio, network or streamer of one of SLATE's ten companies, the ${PER_COMPANY} most linked per company; cast to ${CAST_MOST} a title, as Wikidata lists them. A selection, not every title.`,
    companyEntities: COMPANY_ENTITIES,
    titles: out,
    people: Object.fromEntries([...people].sort((a, b) => a[1].localeCompare(b[1]))),
  };
  mkdirSync('src/engine/content/realworld', { recursive: true });
  writeFileSync(OUT, JSON.stringify(file));
  console.log(`wrote ${out.length} titles, ${people.size} people, ${Math.round(JSON.stringify(file).length / 1024)} KB`);
}

function check() {
  const f = JSON.parse(readFileSync(OUT, 'utf8'));
  const problems = [];
  if (!/CC0/.test(f.source)) problems.push('the source must say its license');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.retrieved)) problems.push('no retrieval date');
  const ids = new Set();
  for (const t of f.titles) {
    if (ids.has(t.id)) problems.push(`duplicate title ${t.id}`);
    ids.add(t.id);
    for (const c of t.cast) if (!f.people[c.person]) problems.push(`${t.id} names a person with no name: ${c.person}`);
    for (const d of t.directors) if (!f.people[d]) problems.push(`${t.id} names a director with no name: ${d}`);
    for (const k of t.companies) if (!f.companyEntities[k]) problems.push(`${t.id} names an unknown company ${k}`);
  }
  console.log(`${f.titles.length} titles, ${Object.keys(f.people).length} people, retrieved ${f.retrieved}`);
  if (problems.length) { console.log(problems.slice(0, 20).join('\n')); process.exit(1); }
}

if (process.argv.includes('--check')) check();
else await fetchAll();
