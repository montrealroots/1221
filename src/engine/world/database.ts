/**
 * SLATE — the entertainment database: one index over what the save knows of
 * the business, read from the canonical records and never copied into them.
 *
 * **What's in it, by where it comes from** (`Source`), and said so on every
 * page:
 * - **real**: films and series, the people credited in them, from Wikidata
 *   (CC0), retrieved on a date (`content/realworld/titles.json`,
 *   `tools/realworld-titles.mjs`). A selection, not every title, and nothing
 *   in a save changes it;
 * - **company**: the ten companies, from SLATE's research (`content/industry.ts`);
 * - **save**: what happens in this save: its projects (`systems/industry.ts`),
 *   the performers in them, the class, and the player. Its titles, reception
 *   and casting are the save's fiction, labelled so.
 *
 * **One record a thing.** A project is one record from its announcement to its
 * credits, wherever it's reached from; a classmate one record whether met at
 * school, in a cast, or in a search; the player one. Ids are the canonical
 * ones (`pj12`, `ip3`, a Wikidata `Q…`), so a link made anywhere opens the
 * same page.
 *
 * **What's public.** Projects' parts and who plays them, the way the trades
 * print them; never a contract's terms or anybody's pay, except the player's
 * own on their own work, which they know.
 */

import type { Simulation } from '../core/simulation';
import { COMPANIES, companyById } from '../content/industry';
import { industryOf, type Project } from '../systems/industry';

export type Source = 'real' | 'company' | 'save';
export type EntryKind = 'title' | 'project' | 'company' | 'person' | 'performer' | 'classmate' | 'you';

/** The real-world file's shape (`tools/realworld-titles.mjs`). */
export interface RealTitle {
  id: string; title: string; kind: 'film' | 'series' | 'short'; year: number; released?: string; companies: string[];
  /** Its genres, as Wikidata names them (a film's, not anybody's taste). */
  filmGenres: string[]; countries: string[]; languages: string[]; minutes?: number;
  directors: string[]; cast: { person: string; character?: string }[];
  producers: { id: string; name: string }[]; distributors: { id: string; name: string }[]; broadcasters: { id: string; name: string }[];
  basedOn: { id: string; name: string }[]; follows: { id: string; name: string }[]; followedBy: { id: string; name: string }[]; partOf: { id: string; name: string }[];
  locations: string[]; seasons?: number; episodes?: number; awards: string[]; nominations: string[];
}
export interface RealWorld { source: string; retrieved: string; scope: string; titles: RealTitle[]; people: Record<string, string> }

/** One row of the index: what it is, its name, a line under it, a year, where it comes from. */
export interface Entry { kind: EntryKind; id: string; name: string; sub: string; year?: number; source: Source; filmGenres?: readonly string[]; companyId?: string }

/** A route for an entry: the database's own address for it. */
export const routeOf = (kind: EntryKind, id: string) => `/workspace/industry/${kind}/${encodeURIComponent(id)}`;

/** Every real person's titles, by Wikidata id: as cast, with the character, or as director. */
export function filmographies(real: RealWorld): Map<string, { title: RealTitle; as: string }[]> {
  const out = new Map<string, { title: RealTitle; as: string }[]>();
  const add = (person: string, title: RealTitle, as: string) => { const list = out.get(person) ?? []; if (!list.some((x) => x.title.id === title.id && x.as === as)) list.push({ title, as }); out.set(person, list); };
  for (const t of real.titles) {
    for (const c of t.cast) add(c.person, t, c.character ? `as ${c.character}` : 'in the cast');
    for (const d of t.directors) add(d, t, 'director');
  }
  for (const list of out.values()) list.sort((a, b) => b.title.year - a.title.year);
  return out;
}

const FORMAT_WORDS: Record<Project['format'], string> = { film: 'Film', series: 'Series', play: 'Play', commercial: 'Commercial', animation: 'Animation', game: 'Video Game', audiobook: 'Audiobook', radio: 'Audio Drama', dub: 'Dubbing' };
export const formatWord = (f: Project['format']) => FORMAT_WORDS[f];
const STATUS_WORDS: Record<Project['status'], string> = { development: 'In Development', casting: 'Casting', production: 'In Production', post: 'In Post-Production', released: 'Released', cancelled: 'Canceled' };
export const statusWord = (p: Project, now: number) => (p.format === 'play' && p.status === 'released' && now < p.shootUntil ? 'Running' : p.format === 'play' && p.status === 'released' ? 'Closed' : STATUS_WORDS[p.status]);

/** The index: everything the database can show, once each. `real` is absent while it loads or where it couldn't be. */
export function entries(sim: Simulation, real?: RealWorld): Entry[] {
  const out: Entry[] = [];
  const state = industryOf(sim);
  const year = (t: number) => new Date(t).getUTCFullYear();
  for (const p of state.projects) out.push({ kind: 'project', id: p.id, name: p.title, sub: `${formatWord(p.format)} · ${p.producer} · ${statusWord(p, sim.now)} · In This Save`, year: year(p.releaseAt), source: 'save', ...(p.genre ? { filmGenres: [p.genre] } : {}), ...(p.companyId ? { companyId: p.companyId } : {}) });
  for (const c of COMPANIES) out.push({ kind: 'company', id: c.id, name: c.short, sub: `${c.name} · ${c.headquarters.city}`, source: 'company' });
  for (const p of state.performers) out.push({ kind: 'performer', id: p.id, name: p.name, sub: `Actor · ${p.credits.length} ${p.credits.length === 1 ? 'credit' : 'credits'} · In This Save`, source: 'save' });
  const school = sim.player.school;
  for (const [i, m] of (school?.classmates ?? []).entries()) out.push({ kind: 'classmate', id: String(i), name: m.name, sub: `Actor · Your class · In This Save`, source: 'save' });
  out.push({ kind: 'you', id: sim.player.id, name: sim.player.displayName, sub: 'You', source: 'save' });
  if (real) {
    for (const t of real.titles) out.push({ kind: 'title', id: t.id, name: t.title, sub: `${t.kind === 'series' ? 'Series' : 'Film'} · ${t.year} · Real World`, year: t.year, source: 'real', filmGenres: t.filmGenres, ...(t.companies[0] ? { companyId: t.companies[0] } : {}) });
    for (const [id, name] of Object.entries(real.people)) out.push({ kind: 'person', id, name, sub: 'Real World', source: 'real' });
  }
  return out;
}

export interface Query { text?: string; kinds?: readonly EntryKind[]; source?: Source; from?: number; to?: number; genre?: string; company?: string; sort?: 'relevance' | 'name' | 'newest' | 'oldest'; page?: number; per?: number }

/** How well a name matches: whole, from the start, a word's start, or anywhere in it; 0 none. */
function score(name: string, q: string): number {
  if (!q) return 1;
  const n = name.toLowerCase();
  if (n === q) return 4;
  if (n.startsWith(q)) return 3;
  if (n.split(/[\s:,'’-]+/).some((w) => w.startsWith(q))) return 2;
  return n.includes(q) ? 1 : 0;
}

/** Search and browse: filtered, sorted, a page at a time, with the total to page through. */
export function search(all: readonly Entry[], q: Query): { total: number; page: number; pages: number; rows: Entry[] } {
  const text = (q.text ?? '').trim().toLowerCase();
  const per = q.per ?? 25;
  const rows = all
    .map((e) => ({ e, s: score(e.name, text) }))
    .filter(({ e, s }) => s > 0
      && (!q.kinds?.length || q.kinds.includes(e.kind))
      && (!q.source || e.source === q.source)
      && (q.from === undefined || (e.year ?? -Infinity) >= q.from)
      && (q.to === undefined || (e.year ?? Infinity) <= q.to)
      && (!q.genre || (e.filmGenres ?? []).some((g) => g.toLowerCase().includes(q.genre!.toLowerCase())))
      && (!q.company || e.companyId === q.company));
  const sort = q.sort ?? 'relevance';
  rows.sort((a, b) => sort === 'name' ? a.e.name.localeCompare(b.e.name)
    : sort === 'newest' ? (b.e.year ?? -1) - (a.e.year ?? -1) || a.e.name.localeCompare(b.e.name)
    : sort === 'oldest' ? (a.e.year ?? 9999) - (b.e.year ?? 9999) || a.e.name.localeCompare(b.e.name)
    : b.s - a.s || (b.e.year ?? 0) - (a.e.year ?? 0) || a.e.name.localeCompare(b.e.name));
  const pages = Math.max(1, Math.ceil(rows.length / per));
  const page = Math.min(Math.max(1, q.page ?? 1), pages);
  return { total: rows.length, page, pages, rows: rows.slice((page - 1) * per, page * per).map((r) => r.e) };
}

/** A few names that begin with what's typed, for the search box, the closest first. */
export function suggest(all: readonly Entry[], text: string, most = 8): Entry[] {
  const q = text.trim().toLowerCase();
  if (q.length < 2) return [];
  return search(all, { text: q, per: most }).rows;
}

/** How many records of each kind the database holds now: real ones by the file, the save's by its records. */
export function counts(sim: Simulation, real?: RealWorld) {
  const state = industryOf(sim);
  return {
    realTitles: real?.titles.length, realFilms: real?.titles.filter((t) => t.kind !== 'series').length, realSeries: real?.titles.filter((t) => t.kind === 'series').length,
    realPeople: real ? Object.keys(real.people).length : undefined,
    companies: COMPANIES.length,
    projects: state.projects.length, projectsReleased: state.projects.filter((p) => p.status === 'released').length,
    performers: state.performers.length, classmates: sim.player.school?.classmates.length ?? 0,
  };
}

/** A genre as a person says it: "drama film" is a drama, "science fiction television series" science fiction. */
export const genreWord = (g: string) => { const w = g.replace(/ (film|television series|television program|series|show|fiction film)$/i, '').trim(); return w.charAt(0).toUpperCase() + w.slice(1); };

/** The real titles a company's studios, networks or streamers are credited on. */
export const titlesOf = (real: RealWorld | undefined, companyId: string) => (real ? real.titles.filter((t) => t.companies.includes(companyId)) : []);
/** The ten company, where a real credit's name is one of theirs. */
export const companyFor = (id: string | undefined) => (id ? companyById(id) : undefined);
