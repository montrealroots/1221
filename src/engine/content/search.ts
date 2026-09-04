/**
 * SLATE — one search box for the whole industry.
 *
 * Type a name, a title, a franchise, a studio, a network, an award, a year, a
 * genre or a certificate and it finds the thing. It searches what has actually
 * been loaded, and it says what it searched, so an empty result is a real
 * answer rather than a shrug.
 *
 * Ranking is explicit rather than magic: an exact name beats a word that
 * starts with what you typed, which beats a word that contains it. Ties are
 * broken by how prominent the thing is — how much work, how much money, how
 * many votes — because when two things match equally, the one somebody has
 * heard of is the one they meant.
 */

import { COUNTRIES } from './geography';
import { GENRES_FULL, genreName } from './genres';
import { RATINGS } from './ratings';
import { STUDIOS } from './studios';
import { NETWORKS } from './networks';
import { everyLoadedTitle, isStudioCatalogLoaded, type CatalogTitle } from './filmography';
import { allCreditedWorks, allPeople, awardsFor, creditsFor, franchisesOf, isPeopleLoaded, type PersonRecord } from './people';
import { CRAFT_ROLE_LABEL, type CraftRole } from './craft-attributes';

export type SearchKind = 'person' | 'title' | 'franchise' | 'studio' | 'network' | 'award' | 'genre' | 'certificate' | 'country';

export const SEARCH_KIND_LABEL: Readonly<Record<SearchKind, string>> = {
  person: 'People', title: 'Titles', franchise: 'Franchises', studio: 'Studios',
  network: 'Networks', award: 'Awards', genre: 'Genres', certificate: 'Certificates',
  country: 'Countries',
};

export interface SearchResult {
  kind: SearchKind;
  id: string;
  label: string;
  /** One line saying what it is. */
  detail: string;
  /** Where it can be opened, when it has a screen of its own. */
  route?: string;
  score: number;
  /** How prominent the thing is, 0-100, used to break ties. */
  weight: number;
  /** What matched, so the result can say why it is here. */
  matched: string;
}

interface IndexEntry {
  kind: SearchKind;
  id: string;
  label: string;
  detail: string;
  route?: string;
  weight: number;
  /** Everything this entry can be found by, lowercased. */
  terms: string[];
}

let index: IndexEntry[] = [];
let builtFrom = '';

const lower = (value: string): string => value.toLowerCase();

function fingerprint(): string {
  return `${allPeople().length}|${everyLoadedTitle().length}|${allCreditedWorks().length}|${STUDIOS.all().length}`;
}

const YEAR = /^(19|20)\d\d$/;

/**
 * Builds the index over whatever is loaded. Cheap enough to rebuild whenever
 * more data arrives, which is what the fingerprint is for.
 */
export function buildIndex(): number {
  const entries: IndexEntry[] = [];

  for (const person of allPeople()) {
    const franchises = franchisesOf(person.qid);
    const credits = creditsFor(person.qid);
    const won = awardsFor(person.qid).filter((a) => a.outcome === 'won').length;
    entries.push({
      kind: 'person', id: person.qid, label: person.name,
      detail: [
        person.roles.map((r) => CRAFT_ROLE_LABEL[r]).join(', '),
        person.birth ? `born ${person.birth.slice(0, 4)}` : undefined,
        credits.length > 0 ? `${credits.length} credits` : undefined,
        won > 0 ? `${won} won` : undefined,
      ].filter(Boolean).join(' · '),
      route: `/workspace/industry/person/${person.qid}`,
      weight: Math.min(100, credits.length * 1.2 + won * 3),
      terms: [
        lower(person.name),
        ...person.occupations.map(lower),
        ...person.roles.map((r) => lower(CRAFT_ROLE_LABEL[r])),
        ...franchises.slice(0, 6).map(lower),
        ...(person.citizenship ?? []).map(lower),
        ...(person.bornIn ? [lower(person.bornIn)] : []),
      ],
    });
  }

  const franchises = new Map<string, { titles: number; gross: number }>();
  const indexed = new Set<string>();

  // The titles the roster is credited on. These arrive with the people, so the
  // search has real work in it before any studio's catalogue is opened.
  for (const work of allCreditedWorks()) {
    indexed.add(work.qid);
    entries.push({
      kind: 'title', id: work.qid, label: work.title,
      detail: [
        work.year ? String(work.year) : undefined,
        work.kind || undefined,
        work.genres.slice(0, 2).join(', ') || undefined,
        work.rating ? `rated ${work.rating.toFixed(1)}` : undefined,
        work.people > 1 ? `${work.people} on the roster` : undefined,
      ].filter(Boolean).join(' · '),
      weight: Math.min(100, Math.log10(1 + (work.votes ?? 0)) * 14 + work.people * 3),
      terms: [
        lower(work.title),
        ...(work.franchise ? [lower(work.franchise)] : []),
        ...work.genres.map(lower),
        ...(work.year ? [String(work.year)] : []),
      ],
    });
    if (work.franchise) {
      const entry = franchises.get(work.franchise) ?? { titles: 0, gross: 0 };
      entry.titles++;
      entry.gross += work.boxOffice ?? 0;
      franchises.set(work.franchise, entry);
    }
  }

  for (const title of everyLoadedTitle()) {
    if (indexed.has(title.qid)) continue;
    indexed.add(title.qid);
    const votes = title.imdbVotes ?? 0;
    entries.push({
      kind: 'title', id: title.qid, label: title.title,
      detail: [
        title.year ? String(title.year) : undefined,
        title.kind.replace(/_/g, ' '),
        title.slateGenres.slice(0, 2).map(genreName).join(', ') || undefined,
        title.directors?.length ? `directed by ${title.directors[0]}` : undefined,
      ].filter(Boolean).join(' · '),
      weight: Math.min(100, Math.log10(1 + votes) * 18 + (title.boxOffice ? 12 : 0)),
      terms: [
        lower(title.title),
        ...(title.originalTitle ? [lower(title.originalTitle)] : []),
        ...(title.directors ?? []).map(lower),
        ...(title.franchise ? [lower(title.franchise.name)] : []),
        ...title.slateGenres.map(lower),
        ...(title.year ? [String(title.year)] : []),
      ],
    });
    const key = title.franchise?.name ?? title.series?.name;
    if (key) {
      const entry = franchises.get(key) ?? { titles: 0, gross: 0 };
      entry.titles++;
      if (title.boxOffice && title.boxOfficeUnit === 'United States dollar') entry.gross += title.boxOffice;
      franchises.set(key, entry);
    }
  }
  for (const [name, entry] of franchises) {
    entries.push({
      kind: 'franchise', id: name, label: name,
      detail: `${entry.titles} title${entry.titles === 1 ? '' : 's'}${entry.gross > 0 ? ` · $${Math.round(entry.gross / 1e6)}M on the record` : ''}`,
      weight: Math.min(100, entry.titles * 6 + Math.log10(1 + entry.gross) * 4),
      terms: [lower(name)],
    });
  }

  for (const studio of STUDIOS.all()) {
    entries.push({
      kind: 'studio', id: studio.id, label: studio.name,
      detail: `${studio.type.replace(/_/g, ' ')} · ${COUNTRIES.get(studio.countryId)?.name ?? studio.countryId}`,
      route: `/workspace/industry/studio/${studio.id}`,
      weight: isStudioCatalogLoaded(studio.id) ? 70 : 55,
      terms: [lower(studio.name), ...(studio.aliases ?? []).map(lower)],
    });
  }
  for (const network of NETWORKS.all()) {
    entries.push({
      kind: 'network', id: network.id, label: network.name,
      detail: `${network.type.replace(/_/g, ' ')} · ${COUNTRIES.get(network.countryId)?.name ?? network.countryId}`,
      route: `/workspace/industry/network/${network.id}`,
      weight: 60,
      terms: [lower(network.name), ...(network.aliases ?? []).map(lower)],
    });
  }

  const awards = new Map<string, number>();
  for (const person of allPeople()) {
    for (const award of awardsFor(person.qid)) awards.set(award.award, (awards.get(award.award) ?? 0) + 1);
  }
  for (const [name, count] of awards) {
    entries.push({
      kind: 'award', id: name, label: name,
      detail: `${count} on the roster's record`,
      weight: Math.min(100, count * 2),
      terms: [lower(name)],
    });
  }

  for (const genre of GENRES_FULL) {
    entries.push({
      kind: 'genre', id: genre.id, label: genre.name,
      detail: genre.description, weight: 45,
      terms: [lower(genre.name), lower(genre.id)],
    });
  }
  for (const rating of RATINGS) {
    entries.push({
      kind: 'certificate', id: rating.id, label: `${rating.code} — ${rating.name}`,
      detail: rating.description, weight: 35,
      terms: [lower(rating.code), lower(rating.name)],
    });
  }
  for (const country of COUNTRIES.all()) {
    entries.push({
      kind: 'country', id: country.id, label: country.name,
      detail: 'A country the industry works in', weight: 25,
      terms: [lower(country.name), lower(country.id)],
    });
  }

  index = entries;
  builtFrom = fingerprint();
  return index.length;
}

function ensureIndex(): void {
  if (index.length === 0 || builtFrom !== fingerprint()) buildIndex();
}

/** How well one entry answers what was typed. Zero means it does not. */
function scoreEntry(entry: IndexEntry, query: string, words: string[]): { score: number; matched: string } {
  let best = 0;
  let matched = '';
  for (const term of entry.terms) {
    if (!term) continue;
    let score = 0;
    if (term === query) score = 100;
    else if (term.startsWith(query)) score = 80 - Math.min(20, term.length - query.length);
    else if (term.split(/\s+/).some((word) => word.startsWith(query))) score = 62;
    else if (term.includes(query)) score = 44;
    else if (words.length > 1 && words.every((word) => term.includes(word))) score = 38;
    if (score > best) { best = score; matched = term; }
  }
  return { score: best, matched };
}

export interface SearchOptions {
  kinds?: readonly SearchKind[];
  limit?: number;
}

/**
 * Searches everything loaded. Returns the strongest matches first, with what
 * matched attached so a result can explain itself.
 */
export function searchEverything(input: string, options: SearchOptions = {}): SearchResult[] {
  ensureIndex();
  const query = input.trim().toLowerCase();
  if (query.length < 2) return [];
  const words = query.split(/\s+/).filter(Boolean);
  const kinds = options.kinds ? new Set(options.kinds) : undefined;
  const out: SearchResult[] = [];

  for (const entry of index) {
    if (kinds && !kinds.has(entry.kind)) continue;
    const { score, matched } = scoreEntry(entry, query, words);
    if (score === 0) continue;
    out.push({
      kind: entry.kind, id: entry.id, label: entry.label, detail: entry.detail,
      route: entry.route, score: score + entry.weight * 0.35, weight: entry.weight, matched,
    });
  }

  // A bare year is a question about a year, so the titles from it come first.
  if (YEAR.test(query)) {
    for (const result of out) if (result.kind === 'title') result.score += 25;
  }

  return out
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
    .slice(0, options.limit ?? 40);
}

/** What the index currently covers, so an empty search can say why. */
export function indexCoverage(): { kind: SearchKind; count: number }[] {
  ensureIndex();
  const counts = new Map<SearchKind, number>();
  for (const entry of index) counts.set(entry.kind, (counts.get(entry.kind) ?? 0) + 1);
  return [...counts.entries()]
    .map(([kind, count]) => ({ kind, count }))
    .sort((a, b) => b.count - a.count);
}

/** Whether the people file has been fetched yet, for a screen that wants to say so. */
export const peopleAvailable = (): boolean => isPeopleLoaded();

/** Everything a person is in, for their profile page. */
export function creditsOfPerson(person: PersonRecord): CatalogTitle[] {
  const wanted = new Set(creditsFor(person.qid).map((credit) => credit.workQid));
  return everyLoadedTitle().filter((title) => wanted.has(title.qid));
}

export type { CraftRole };
