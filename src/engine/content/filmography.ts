/**
 * SLATE — the real catalogue.
 *
 * Every film and series the real studios made, as public record: who directed,
 * wrote, produced, shot and scored it, who was in it, what it cost, what it
 * grossed, what the critics and the audience made of it, and which franchise
 * it belongs to. Built by tools/filmography from Wikidata (CC0) and fetched a
 * studio at a time, the way the city lists are.
 *
 * Rules the rest of the game relies on:
 *   - a missing number is missing. Nothing here is estimated or filled in;
 *   - the IMDb ratings live in their own file because IMDb licenses them for
 *     personal, non-commercial use. Delete public/industry/imdb.tsv and the
 *     game simply shows no IMDb score;
 *   - no generated title may collide with a real one. `titleTaken` is the check.
 */

export type TitleKind = 'feature' | 'animated' | 'documentary' | 'short' | 'tv_movie' | 'series' | 'limited_series';

export interface CatalogTitle {
  qid: string;
  kind: TitleKind;
  title: string;
  originalTitle?: string;
  year?: number;
  date?: string;
  runtime?: number;
  genres: string[];
  /** The same genres in SLATE's own vocabulary. */
  slateGenres: string[];
  countries: string[];
  languages: string[];
  rating?: string;
  boxOffice?: number;
  boxOfficeUnit?: string;
  budget?: number;
  budgetUnit?: string;
  imdbId?: string;
  rottenTomatoesId?: string;
  metacriticId?: string;
  tomatometer?: number;
  tomatometerCount?: number;
  audienceScore?: number;
  criticsAverage?: number;
  metacritic?: number;
  metacriticCount?: number;
  imdb?: number;
  imdbVotes?: number;
  franchise?: { qid: string; name: string };
  series?: { qid: string; name: string };
  basedOn: string[];
  seasons?: number;
  episodes?: number;
  start?: string;
  end?: string;
  /** How the studio touched it: produced or distributed, by which label. */
  roles: { role: 'produced' | 'distributed' | 'aired'; label: string }[];
  directors: string[];
  awardCount: number;
  companies: string[];
  distributors: string[];
  broadcasters: string[];
  /** Studios in the registry whose catalogue carries this title. */
  studioIds: string[];
}

export interface CatalogCredit {
  qid: string;
  role: string;
  personQid: string;
  name: string;
  character?: string;
  ordinal?: number;
}

const byStudio = new Map<string, CatalogTitle[]>();
const byQid = new Map<string, CatalogTitle>();
const creditsByQid = new Map<string, CatalogCredit[]>();
const loadedCredits = new Set<string>();
const imdbRatings = new Map<string, { rating: number; votes: number }>();
let imdbLoaded = false;
const knownTitles = new Set<string>();
let knownTitlesLoaded = false;

const num = (s: string | undefined): number | undefined => {
  if (s === undefined || s === '') return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};
const list = (s: string | undefined): string[] => (s ? s.split(';').filter(Boolean) : []);
const ref = (s: string | undefined): { qid: string; name: string } | undefined => {
  if (!s) return undefined;
  const i = s.indexOf(':');
  return i < 0 ? { qid: '', name: s } : { qid: s.slice(0, i), name: s.slice(i + 1) };
};

/** A title the way a duplicate check sees it: lower case, no accents, no punctuation. */
export function normaliseTitle(title: string): string {
  return title.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

// --- Studio catalogues -----------------------------------------------------

export function isStudioCatalogLoaded(studioId: string): boolean {
  return byStudio.has(studioId);
}

export function studioCatalog(studioId: string): CatalogTitle[] | undefined {
  return byStudio.get(studioId);
}

/** Every title loaded so far, whichever studio it came in with. For the index. */
export function everyLoadedTitle(): CatalogTitle[] {
  return [...byQid.values()];
}

export function titleByQid(qid: string): CatalogTitle | undefined {
  return byQid.get(qid);
}

/** Adds one studio's index from its tab-delimited file. */
export function addStudioCatalog(studioId: string, text: string): number {
  if (byStudio.has(studioId)) return 0;
  const lines = text.split('\n');
  const header = (lines[0] ?? '').split('\t');
  const col = (name: string) => header.indexOf(name);
  const c = {
    qid: col('qid'), kind: col('kind'), title: col('title'), original: col('original'), year: col('year'), date: col('date'), runtime: col('runtime'),
    genres: col('genres'), slateGenres: col('slateGenres'), countries: col('countries'), languages: col('languages'), mpaa: col('mpaa'),
    boxOffice: col('boxOffice'), boxUnit: col('boxUnit'), budget: col('budget'), budgetUnit: col('budgetUnit'), imdbId: col('imdbId'), rtId: col('rtId'), mcId: col('mcId'),
    rt: col('rt'), rtCount: col('rtCount'), rtAudience: col('rtAudience'), rtAverage: col('rtAverage'), metacritic: col('metacritic'), mcCount: col('mcCount'), imdb: col('imdb'), imdbVotes: col('imdbVotes'),
    franchise: col('franchise'), series: col('series'), basedOn: col('basedOn'), seasons: col('seasons'), episodes: col('episodes'), start: col('start'), end: col('end'),
    roles: col('roles'), directors: col('directors'), awards: col('awards'), companies: col('companies'), distributors: col('distributors'), broadcasters: col('broadcasters'),
  };
  const titles: CatalogTitle[] = [];
  for (const line of lines.slice(1)) {
    if (!line) continue;
    const f = line.split('\t');
    const get = (i: number) => (i >= 0 ? f[i] : undefined);
    const qid = get(c.qid);
    if (!qid) continue;
    const existing = byQid.get(qid);
    if (existing) {
      if (!existing.studioIds.includes(studioId)) existing.studioIds.push(studioId);
      for (const r of list(get(c.roles))) {
        const [role, label] = r.split(':');
        if (role && label && !existing.roles.some((x) => x.role === role && x.label === label)) existing.roles.push({ role: role as CatalogTitle['roles'][number]['role'], label });
      }
      titles.push(existing);
      continue;
    }
    const imdbId = get(c.imdbId) || undefined;
    const overlay = imdbId ? imdbRatings.get(imdbId) : undefined;
    const title: CatalogTitle = {
      qid, kind: (get(c.kind) as TitleKind) || 'feature', title: get(c.title) ?? '', originalTitle: get(c.original) || undefined,
      year: num(get(c.year)), date: get(c.date) || undefined, runtime: num(get(c.runtime)),
      genres: list(get(c.genres)), slateGenres: list(get(c.slateGenres)), countries: list(get(c.countries)), languages: list(get(c.languages)), rating: get(c.mpaa) || undefined,
      boxOffice: num(get(c.boxOffice)), boxOfficeUnit: get(c.boxUnit) || undefined, budget: num(get(c.budget)), budgetUnit: get(c.budgetUnit) || undefined,
      imdbId, rottenTomatoesId: get(c.rtId) || undefined, metacriticId: get(c.mcId) || undefined,
      tomatometer: num(get(c.rt)), tomatometerCount: num(get(c.rtCount)), audienceScore: num(get(c.rtAudience)), criticsAverage: num(get(c.rtAverage)),
      metacritic: num(get(c.metacritic)), metacriticCount: num(get(c.mcCount)),
      imdb: overlay ? overlay.rating : num(get(c.imdb)), imdbVotes: overlay ? overlay.votes : num(get(c.imdbVotes)),
      franchise: ref(get(c.franchise)), series: ref(get(c.series)), basedOn: list(get(c.basedOn)),
      seasons: num(get(c.seasons)), episodes: num(get(c.episodes)), start: get(c.start) || undefined, end: get(c.end) || undefined,
      roles: list(get(c.roles)).map((r) => { const [role, label] = r.split(':'); return { role: (role ?? 'produced') as CatalogTitle['roles'][number]['role'], label: label ?? '' }; }),
      directors: list(get(c.directors)), awardCount: num(get(c.awards)) ?? 0,
      companies: list(get(c.companies)), distributors: list(get(c.distributors)), broadcasters: list(get(c.broadcasters)),
      studioIds: [studioId],
    };
    byQid.set(qid, title);
    titles.push(title);
    knownTitles.add(normaliseTitle(title.title));
    if (title.originalTitle) knownTitles.add(normaliseTitle(title.originalTitle));
  }
  byStudio.set(studioId, titles);
  return titles.length;
}

export async function loadStudioCatalog(studioId: string): Promise<number> {
  if (byStudio.has(studioId)) return 0;
  const response = await fetch(`${import.meta.env.BASE_URL}industry/${studioId}.tsv`);
  if (!response.ok) throw new Error(`The catalogue for ${studioId} could not be loaded.`);
  return addStudioCatalog(studioId, await response.text());
}

// --- Credits ---------------------------------------------------------------

export function decadeOf(year: number | undefined): string {
  return year ? `${Math.floor(year / 10) * 10}s` : 'undated';
}

export function isCreditsLoaded(studioId: string, decade: string): boolean {
  return loadedCredits.has(`${studioId}|${decade}`);
}

export function creditsFor(qid: string): CatalogCredit[] | undefined {
  return creditsByQid.get(qid);
}

export function addStudioCredits(studioId: string, decade: string, text: string): number {
  const key = `${studioId}|${decade}`;
  if (loadedCredits.has(key)) return 0;
  loadedCredits.add(key);
  let count = 0;
  for (const line of text.split('\n').slice(1)) {
    if (!line) continue;
    const [qid, role, personQid, name, character, ordinal] = line.split('\t');
    if (!qid || !role) continue;
    const bucket = creditsByQid.get(qid) ?? [];
    if (bucket.some((c) => c.role === role && c.name === name)) continue;
    bucket.push({ qid, role, personQid: personQid ?? '', name: name ?? '', character: character || undefined, ordinal: num(ordinal) });
    creditsByQid.set(qid, bucket);
    count++;
  }
  return count;
}

export async function loadStudioCredits(studioId: string, decade: string): Promise<number> {
  if (loadedCredits.has(`${studioId}|${decade}`)) return 0;
  const response = await fetch(`${import.meta.env.BASE_URL}industry/${studioId}-credits-${decade}.tsv`);
  if (!response.ok) {
    loadedCredits.add(`${studioId}|${decade}`);
    return 0;
  }
  return addStudioCredits(studioId, decade, await response.text());
}

// --- IMDb ------------------------------------------------------------------

export function isImdbLoaded(): boolean {
  return imdbLoaded;
}

export function addImdbRatings(text: string): number {
  if (imdbLoaded) return 0;
  imdbLoaded = true;
  for (const line of text.split('\n')) {
    if (!line || line.startsWith('#') || line.startsWith('imdbId')) continue;
    const [id, rating, votes] = line.split('\t');
    if (id && rating) imdbRatings.set(id, { rating: Number(rating), votes: Number(votes) || 0 });
  }
  for (const title of byQid.values()) {
    const overlay = title.imdbId ? imdbRatings.get(title.imdbId) : undefined;
    if (overlay) { title.imdb = overlay.rating; title.imdbVotes = overlay.votes; }
  }
  return imdbRatings.size;
}

export async function loadImdbRatings(): Promise<number> {
  if (imdbLoaded) return 0;
  const response = await fetch(`${import.meta.env.BASE_URL}industry/imdb.tsv`);
  if (!response.ok) { imdbLoaded = true; return 0; }
  return addImdbRatings(await response.text());
}

// --- Titles that already exist ----------------------------------------------

export function addKnownTitles(text: string): number {
  let count = 0;
  for (const line of text.split('\n')) {
    if (!line) continue;
    knownTitles.add(line.trim());
    count++;
  }
  knownTitlesLoaded = true;
  return count;
}

export function isKnownTitlesLoaded(): boolean {
  return knownTitlesLoaded;
}

export async function loadKnownTitles(): Promise<number> {
  if (knownTitlesLoaded) return 0;
  const response = await fetch(`${import.meta.env.BASE_URL}industry/titles.txt`);
  if (!response.ok) { knownTitlesLoaded = true; return 0; }
  return addKnownTitles(await response.text());
}

/** Whether a title already belongs to a real film or series. */
export function titleTaken(title: string): boolean {
  return knownTitles.has(normaliseTitle(title));
}

export function knownTitleCount(): number {
  return knownTitles.size;
}

// --- Series by broadcaster -----------------------------------------------------

export interface BroadcastSeries {
  qid: string;
  title: string;
  year?: number;
  kind: TitleKind;
  broadcaster: string;
  studioId: string;
  seasons?: number;
  episodes?: number;
  start?: string;
  end?: string;
  tomatometer?: number;
  imdb?: number;
  slateGenres: string[];
}

const broadcastSeries: BroadcastSeries[] = [];
let broadcastLoaded = false;

export function isBroadcastSeriesLoaded(): boolean {
  return broadcastLoaded;
}

export function addBroadcastSeries(text: string): number {
  if (broadcastLoaded) return 0;
  broadcastLoaded = true;
  for (const line of text.split('\n').slice(1)) {
    if (!line) continue;
    const [qid, title, year, kind, broadcaster, studioId, seasons, episodes, start, end, rt, imdb, genres] = line.split('\t');
    if (!qid || !title || !broadcaster) continue;
    broadcastSeries.push({ qid, title, year: num(year), kind: (kind as TitleKind) || 'series', broadcaster, studioId: studioId ?? '', seasons: num(seasons), episodes: num(episodes), start: start || undefined, end: end || undefined, tomatometer: num(rt), imdb: num(imdb), slateGenres: list(genres) });
  }
  return broadcastSeries.length;
}

export async function loadBroadcastSeries(): Promise<number> {
  if (broadcastLoaded) return 0;
  const response = await fetch(`${import.meta.env.BASE_URL}industry/series-by-broadcaster.tsv`);
  if (!response.ok) { broadcastLoaded = true; return 0; }
  return addBroadcastSeries(await response.text());
}

/** The series the record says aired on any of these broadcaster names, newest first, one row per series. */
export function seriesOn(broadcasterNames: readonly string[]): BroadcastSeries[] {
  const wanted = new Set(broadcasterNames.map((n) => n.toLowerCase()));
  const seen = new Set<string>();
  const out: BroadcastSeries[] = [];
  for (const row of broadcastSeries) {
    if (!wanted.has(row.broadcaster.toLowerCase()) || seen.has(row.qid)) continue;
    seen.add(row.qid);
    out.push(row);
  }
  return out.sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || a.title.localeCompare(b.title));
}

// --- Views ------------------------------------------------------------------

export interface FranchiseSummary {
  name: string;
  qid: string;
  titles: CatalogTitle[];
  gross: number;
  firstYear?: number;
  lastYear?: number;
}

/** The franchises in a catalogue, biggest first, with everything in them. */
export function franchisesIn(titles: readonly CatalogTitle[]): FranchiseSummary[] {
  const map = new Map<string, FranchiseSummary>();
  for (const title of titles) {
    const key = title.franchise ?? title.series;
    if (!key) continue;
    const entry = map.get(key.name) ?? { name: key.name, qid: key.qid, titles: [], gross: 0 };
    entry.titles.push(title);
    if (title.boxOffice && title.boxOfficeUnit === 'United States dollar') entry.gross += title.boxOffice;
    if (title.year) {
      entry.firstYear = entry.firstYear === undefined ? title.year : Math.min(entry.firstYear, title.year);
      entry.lastYear = entry.lastYear === undefined ? title.year : Math.max(entry.lastYear, title.year);
    }
    map.set(key.name, entry);
  }
  return [...map.values()].filter((f) => f.titles.length >= 2).sort((a, b) => b.gross - a.gross || b.titles.length - a.titles.length);
}

export const TITLE_KIND_LABEL: Readonly<Record<TitleKind, string>> = {
  feature: 'Feature Film', animated: 'Animated Feature', documentary: 'Documentary', short: 'Short Film', tv_movie: 'Television Film', series: 'Series', limited_series: 'Limited Series',
};

export const CREDIT_ROLE_LABEL: Readonly<Record<string, string>> = {
  director: 'Director', writer: 'Writer', producer: 'Producer', executive_producer: 'Executive Producer', composer: 'Composer', cinematographer: 'Cinematographer',
  editor: 'Editor', production_designer: 'Production Designer', costume_designer: 'Costume Designer', creator: 'Creator', narrator: 'Narrator', cast: 'Cast',
  award: 'Award', follows: 'Follows', followed_by: 'Followed By', subject: 'Subject',
};

export const CREDIT_ROLE_ORDER: readonly string[] = ['creator', 'director', 'writer', 'producer', 'executive_producer', 'cinematographer', 'composer', 'editor', 'production_designer', 'costume_designer', 'narrator'];
