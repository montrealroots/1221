/**
 * SLATE — looking a real title up on Wikidata while playing (from 2026-10-08,
 * at the owner's word: "option B"), for what SLATE's bundled selection
 * (`content/realworld/titles.json`: the ten companies' work from 2015) hasn't
 * got. Wikidata's structured data is CC0, free to use with nothing owed.
 *
 * **Asked for, never on its own.** The player presses Search Wikidata; the
 * screen fetches (`Fetcher`), this module builds the requests and reads the
 * answers into the database's own shape (`RealTitle`), and the command
 * `industry.keep_lookup` keeps them in the save with the date they were
 * fetched, so a title looked up once is there offline after, and through a
 * save. Nothing fetched is ever presented as more than Wikidata said on that
 * date; where it couldn't be reached, nothing is shown in its place.
 *
 * **Few requests**: one search, then the facts of at most `LOOKUP.most` titles
 * in three queries, the names coming with them. Wikidata limits clients that
 * ask too often; one lookup at a time is the screen's to keep.
 */

import type { RealTitle } from './database';

/** Gets a URL's JSON, or throws: the screen's `fetch`, a test's recorded answers. */
export type Fetcher = (url: string) => Promise<unknown>;

export const LOOKUP = {
  /** Titles read from one search. */
  most: 8,
  /** Cast kept a title, as the bundled file keeps them. */
  castMost: 10,
  /** Titles kept in a save from lookups, the oldest let go past it. */
  kept: 300,
  search: 'https://www.wikidata.org/w/api.php',
  sparql: 'https://query.wikidata.org/sparql',
} as const;

/** What a search result's description must say for it to be a film or a series. */
const SCREEN = /\b(film|movie|television series|tv series|miniseries|web series|television film|animated series|sitcom|anthology series)\b/i;
const KINDS: Record<string, RealTitle['kind']> = {
  Q11424: 'film', Q202866: 'film', Q506240: 'film', Q24862: 'short',
  Q5398426: 'series', Q581714: 'series', Q1259759: 'series', Q526877: 'series', Q117467246: 'series', Q63952888: 'series',
};

const qid = (uri: string) => uri.slice(uri.lastIndexOf('/') + 1);
type Binding = Record<string, { value: string; type?: string } | undefined>;
const rows = (json: unknown): Binding[] => ((json as { results?: { bindings?: Binding[] } })?.results?.bindings ?? []);

export const searchUrl = (text: string) => `${LOOKUP.search}?${new URLSearchParams({ action: 'wbsearchentities', search: text, language: 'en', type: 'item', limit: '20', format: 'json', origin: '*' })}`;
const sparqlUrl = (query: string) => `${LOOKUP.sparql}?${new URLSearchParams({ query, format: 'json' })}`;

/** The film and series items a search found, by what each says it is. */
export function screenItems(json: unknown): { id: string; label: string }[] {
  const found = ((json as { search?: { id: string; label?: string; description?: string }[] })?.search ?? []);
  return found.filter((x) => /^Q\d+$/.test(x.id) && SCREEN.test(x.description ?? '')).slice(0, LOOKUP.most).map((x) => ({ id: x.id, label: x.label ?? x.id }));
}

/** The three queries for these titles: their facts with names, their cast in credit order, their running times. */
export function factQueries(ids: readonly string[]): { facts: string; cast: string; runtime: string } {
  const values = ids.map((k) => `wd:${k}`).join(' ');
  return {
    facts: sparqlUrl(`SELECT ?t ?tLabel ?p ?v ?vLabel WHERE {
      VALUES ?t { ${values} }
      VALUES ?p { wdt:P31 wdt:P577 wdt:P136 wdt:P495 wdt:P364 wdt:P57 wdt:P272 wdt:P750 wdt:P449 wdt:P144 wdt:P155 wdt:P156 wdt:P166 wdt:P1411 wdt:P2437 wdt:P1113 wdt:P915 wdt:P179 }
      ?t ?p ?v .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }`),
    cast: sparqlUrl(`SELECT ?t ?a ?aLabel ?role ?ord ?links WHERE {
      VALUES ?t { ${values} }
      ?t p:P161 ?st . ?st ps:P161 ?a . ?a wikibase:sitelinks ?links .
      OPTIONAL { ?st pq:P1545 ?ord }
      OPTIONAL { ?st pq:P453 ?r . ?r rdfs:label ?role FILTER(LANG(?role) = "en") }
      OPTIONAL { ?st pq:P4633 ?role }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }`),
    runtime: sparqlUrl(`SELECT ?t ?sec WHERE { VALUES ?t { ${values} } ?t p:P2047 ?st . ?st psn:P2047 ?n . ?n wikibase:quantityAmount ?sec . }`),
  };
}

/**
 * The answers read into the database's shape: each title's facts as Wikidata gives them and nothing it doesn't, its
 * cast in credit order then the best documented first, and the ten companies it's credited to, by the entity ids the
 * bundled file records for each (`companyEntities`).
 */
export function readTitles(ids: readonly string[], facts: unknown, cast: unknown, runtime: unknown, companyEntities: Record<string, Record<string, string>>): { titles: RealTitle[]; people: Record<string, string> } {
  const ofCompany = new Map<string, string>();
  for (const [company, entities] of Object.entries(companyEntities)) for (const id of Object.keys(entities)) ofCompany.set(id, company);
  type Raw = { name?: string; facts: Record<string, { id?: string; name: string }[]>; cast: { id: string; name: string; character?: string; ord: number; links: number }[]; minutes?: number };
  const raw = new Map<string, Raw>(ids.map((id) => [id, { facts: {}, cast: [] }]));
  for (const r of rows(facts)) {
    const t = raw.get(qid(r.t!.value));
    if (!t) continue;
    t.name ??= r.tLabel?.value;
    const p = qid(r.p!.value);
    const isItem = r.v!.type === 'uri' && /\/entity\/Q\d+$/.test(r.v!.value);
    const v = isItem ? { id: qid(r.v!.value), name: r.vLabel?.value ?? qid(r.v!.value) } : { name: r.v!.value };
    const list = (t.facts[p] ??= []);
    if (!list.some((x) => (x.id ?? x.name) === (v.id ?? v.name))) list.push(v);
  }
  for (const r of rows(cast)) {
    const t = raw.get(qid(r.t!.value));
    if (!t) continue;
    const id = qid(r.a!.value);
    const had = t.cast.find((c) => c.id === id);
    if (had) { if (!had.character && r.role?.value) had.character = r.role.value; continue; }
    t.cast.push({ id, name: r.aLabel?.value ?? id, ...(r.role?.value ? { character: r.role.value } : {}), ord: Number(r.ord?.value ?? Infinity), links: Number(r.links?.value ?? 0) });
  }
  for (const r of rows(runtime)) { const t = raw.get(qid(r.t!.value)); if (t && t.minutes === undefined) t.minutes = Math.round(Number(r.sec!.value) / 60); }

  const people: Record<string, string> = {};
  const titles: RealTitle[] = [];
  for (const [id, t] of raw) {
    if (!t.name || /^Q\d+$/.test(t.name)) continue;
    const named = (p: string) => (t.facts[p] ?? []).filter((x) => x.id && !/^Q\d+$/.test(x.name)) as { id: string; name: string }[];
    const dates = (t.facts.P577 ?? []).map((x) => x.name).sort();
    const year = Number(dates[0]?.slice(0, 4));
    if (!Number.isFinite(year)) continue;
    const kind = (t.facts.P31 ?? []).map((x) => KINDS[x.id ?? '']).find(Boolean) ?? 'film';
    const cast = t.cast.filter((c) => !/^Q\d+$/.test(c.name)).sort((a, b) => (a.ord - b.ord) || (b.links - a.links)).slice(0, LOOKUP.castMost);
    for (const c of cast) people[c.id] = c.name;
    for (const d of named('P57')) people[d.id] = d.name;
    const credited = [...named('P272'), ...named('P750'), ...named('P449')].map((x) => ofCompany.get(x.id)).filter((x): x is string => Boolean(x));
    const count = (p: string) => { const n = Number(t.facts[p]?.[0]?.name); return Number.isFinite(n) && n > 0 ? n : undefined; };
    const seasons = count('P2437');
    const episodes = count('P1113');
    titles.push({
      id, title: t.name, kind, year, released: dates[0]?.slice(0, 10), companies: [...new Set(credited)],
      filmGenres: named('P136').map((g) => g.name), countries: named('P495').map((c) => c.name), languages: named('P364').map((l) => l.name),
      ...(t.minutes && t.minutes > 0 ? { minutes: t.minutes } : {}),
      directors: named('P57').map((d) => d.id),
      cast: cast.map((c) => ({ person: c.id, ...(c.character ? { character: c.character } : {}) })),
      producers: named('P272'), distributors: named('P750'), broadcasters: named('P449'),
      basedOn: named('P144'), follows: named('P155'), followedBy: named('P156'), partOf: named('P179'),
      locations: named('P915').map((l) => l.name).slice(0, 6),
      ...(seasons !== undefined ? { seasons } : {}), ...(episodes !== undefined ? { episodes } : {}),
      awards: named('P166').map((a) => a.name), nominations: named('P1411').map((a) => a.name),
    });
  }
  return { titles, people };
}

/** A whole lookup: search, then the facts of the films and series found. Throws where Wikidata can't be reached. */
export async function lookUp(text: string, get: Fetcher, companyEntities: Record<string, Record<string, string>>): Promise<{ titles: RealTitle[]; people: Record<string, string> }> {
  const items = screenItems(await get(searchUrl(text)));
  if (!items.length) return { titles: [], people: {} };
  const ids = items.map((x) => x.id);
  const q = factQueries(ids);
  const facts = await get(q.facts);
  const cast = await get(q.cast);
  const runtime = await get(q.runtime);
  return readTitles(ids, facts, cast, runtime, companyEntities);
}
