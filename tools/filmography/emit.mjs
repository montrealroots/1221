/**
 * Turns the pulled catalogue into what the game ships:
 *
 *   public/industry/<studio>.tsv             one row per title: the index
 *   public/industry/<studio>-credits-<decade>.tsv   crew, cast and awards
 *   public/industry/imdb.tsv                 IMDb ratings by title id (separate
 *                                            on purpose: IMDb's dataset licence
 *                                            is personal and non-commercial)
 *   public/industry/titles.txt               every real title, normalised, so
 *                                            nothing generated can collide
 *   src/engine/content/studio-labels.ts      the labels under each studio
 *   src/engine/content/studio-stats.ts       what each studio actually makes,
 *                                            measured from its own catalogue
 *
 * Everything but the IMDb file comes from Wikidata (CC0).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

const HERE = new URL('./', import.meta.url);
const ROOT = new URL('../../', HERE);
const OUT = new URL('public/industry/', ROOT);
mkdirSync(OUT, { recursive: true });
for (const f of readdirSync(OUT)) unlinkSync(new URL(f, OUT));

const resolved = JSON.parse(readFileSync(new URL('./resolved.json', HERE), 'utf8'));
const lists = JSON.parse(readFileSync(new URL('./cache/lists.json', HERE), 'utf8'));
const details = new Map();
for (const line of readFileSync(new URL('./cache/details.ndjson', HERE), 'utf8').split('\n')) {
  if (!line) continue;
  const row = JSON.parse(line);
  details.set(row.qid, row);
}

// --- IMDb ratings ----------------------------------------------------------
const imdbPath = process.argv[2];
const imdb = new Map();
if (imdbPath && existsSync(imdbPath)) {
  const text = gunzipSync(readFileSync(imdbPath)).toString('utf8');
  for (const line of text.split('\n').slice(1)) {
    const [id, rating, votes] = line.split('\t');
    if (id) imdb.set(id, [rating, votes]);
  }
}

// --- helpers ----------------------------------------------------------------
const clean = (s) => String(s ?? '').replace(/[\t\n\r]+/g, ' ').trim();
const normalise = (s) => clean(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const split = (row, key) => (row.lists[key] ?? []).map((v) => v.includes('\t') ? v.split('\t') : [null, v]);

const GENRE_MAP = [
  ['documentary', 'documentary'], ['animated', 'animation'], ['anime', 'animation'], ['science fiction', 'science fiction'], ['superhero', 'action'],
  ['action', 'action'], ['adventure', 'adventure'], ['biograph', 'biography'], ['romantic comedy', 'romance'], ['comedy', 'comedy'],
  ['crime', 'crime'], ['family', 'family'], ["children", 'family'], ['fantasy', 'fantasy'], ['horror', 'horror'], ['legal', 'legal'],
  ['courtroom', 'legal'], ['medical', 'medical'], ['musical', 'musical'], ['music', 'musical'], ['mystery', 'mystery'], ['romance', 'romance'],
  ['romantic', 'romance'], ['sport', 'sport'], ['thriller', 'thriller'], ['spy', 'thriller'], ['war', 'war'], ['western', 'western'],
  ['experimental', 'experimental'], ['avant-garde', 'experimental'], ['drama', 'drama'], ['disaster', 'action'], ['heist', 'crime'], ['gangster', 'crime'],
  ['film noir', 'crime'], ['slasher', 'horror'], ['monster', 'horror'], ['zombie', 'horror'], ['martial arts', 'action'], ['road', 'drama'], ['coming-of-age', 'drama'],
];
function slateGenres(labels) {
  const out = new Set();
  for (const label of labels) {
    const l = label.toLowerCase();
    for (const [needle, genre] of GENRE_MAP) { if (l.includes(needle)) { out.add(genre); break; } }
  }
  return [...out];
}

const TV_TYPES = /television series|tv series|animated series|miniseries|television program|web series|anime television|sitcom|soap opera|talk show|reality|documentary series|drama series|comedy series|limited series|television show/i;
const SHORT = /short film/i;
const DOC = /documentary/i;
const TVFILM = /television film|tv film|television movie/i;
const ANIM = /animated|anime/i;
function kindOf(row, listedAs) {
  const types = split(row, 'types').map(([, l]) => l).join(' | ');
  if (listedAs === 'tv' || TV_TYPES.test(types)) return TV_TYPES.test(types) || listedAs === 'tv' ? (/miniseries|limited series/i.test(types) ? 'limited_series' : 'series') : 'series';
  if (TVFILM.test(types)) return 'tv_movie';
  if (SHORT.test(types)) return 'short';
  if (DOC.test(types) || DOC.test((row.lists.genres ?? []).join(' '))) return 'documentary';
  if (ANIM.test(types)) return 'animated';
  return 'feature';
}

const numeric = (v) => { const n = Number(String(v).replace(/[^0-9.]/g, '')); return Number.isFinite(n) && String(v).trim() !== '' ? String(n) : ''; };
function scoresOf(row) {
  const out = {};
  for (const s of row.scores ?? []) {
    const by = s.by; const m = (s.method ?? '').toLowerCase(); const val = s.score ?? '';
    if (by === 'Q105584') {
      if (/tomatometer/.test(m) || /%$/.test(val)) { if (!/audience|popcorn/.test(m)) { out.rt = numeric(val.replace('%', '')); out.rtCount = s.count; } else out.rtAudience = numeric(val.replace('%', '')); }
      else if (/average/.test(m)) out.rtAverage = numeric(val.replace('/10', ''));
    } else if (by === 'Q150248') { out.metacritic = numeric(val.replace('/100', '')); out.mcCount = s.count; }
    else if (by === 'Q37312') { out.imdb = numeric(val.replace('/10', '')); out.imdbVotes = s.count; }
  }
  return out;
}

const year = (row) => (row.date || row.start || '').slice(0, 4);
const decade = (y) => (y ? `${Math.floor(Number(y) / 10) * 10}s` : 'undated');

// --- per studio ---------------------------------------------------------------
const INDEX_HEADER = ['qid', 'kind', 'title', 'original', 'year', 'date', 'runtime', 'genres', 'slateGenres', 'countries', 'languages', 'mpaa', 'boxOffice', 'boxUnit', 'budget', 'budgetUnit', 'imdbId', 'rtId', 'mcId', 'rt', 'rtCount', 'rtAudience', 'rtAverage', 'metacritic', 'mcCount', 'imdb', 'imdbVotes', 'franchise', 'series', 'basedOn', 'seasons', 'episodes', 'start', 'end', 'roles', 'directors', 'awards', 'companies', 'distributors', 'broadcasters'];
const CREDIT_HEADER = ['qid', 'role', 'personQid', 'name', 'character', 'ordinal'];

const allTitles = new Set();
const stats = {};
const labelsOut = {};
for (const [studio, labels] of Object.entries(resolved)) {
  labelsOut[studio] = [...labels.film.map((l) => ({ name: l.label, qid: l.qid, kind: 'film' })), ...labels.tv.filter((t) => !labels.film.some((f) => f.qid === t.qid)).map((l) => ({ name: l.label, qid: l.qid, kind: 'tv' }))];
  const titles = new Map(); // qid -> { row, roles: Set, listedAs }
  for (const kind of ['film', 'tv']) {
    for (const label of labels[kind]) {
      for (const [t, role] of lists[`${label.qid}|${kind}`] ?? []) {
        const row = details.get(t);
        if (!row) continue;
        const entry = titles.get(t) ?? { row, roles: new Set(), listedAs: kind };
        entry.roles.add(`${role}:${label.label}`);
        if (kind === 'film') entry.listedAs = 'film';
        titles.set(t, entry);
      }
    }
  }

  const index = [INDEX_HEADER.join('\t')];
  const credits = {};
  const st = { films: 0, series: 0, byDecade: {}, genres: {}, budgets: [], grosses: [], rts: [], awards: 0, recentYears: {}, franchises: {}, top: null, topSeries: null };
  const rows = [...titles.values()].sort((a, b) => (year(a.row) || '9999').localeCompare(year(b.row) || '9999') || (a.row.label ?? '').localeCompare(b.row.label ?? ''));
  for (const { row, roles, listedAs } of rows) {
    if (!row.label || /^Q\d+$/.test(row.label)) continue;
    const kind = kindOf(row, listedAs);
    const y = year(row);
    const genres = split(row, 'genres').map(([, l]) => l);
    const sg = slateGenres(genres);
    const sc = scoresOf(row);
    const directors = row.people.filter((p) => p.role === 'director').map((p) => p.name);
    const franchise = split(row, 'franchise')[0];
    const series = split(row, 'series')[0];
    const awards = row.lists.awards ?? [];
    const box = row.boxOffice && row.boxOffice.unit === 'United States dollar' ? Math.round(row.boxOffice.amount) : row.boxOffice ? Math.round(row.boxOffice.amount) : '';
    const budget = row.budget ? Math.round(row.budget.amount) : '';
    index.push([
      row.qid, kind, clean(row.label), clean(row.original) !== clean(row.label) ? clean(row.original) : '', y, row.date ?? '', row.duration ?? '', genres.map(clean).join(';'), sg.join(';'),
      split(row, 'countries').map(([, l]) => clean(l)).join(';'), split(row, 'languages').map(([, l]) => clean(l)).join(';'), (row.lists.mpaa ?? [])[0] ?? '',
      box, row.boxOffice ? row.boxOffice.unit : '', budget, row.budget ? row.budget.unit : '',
      row.imdb ?? '', row.rtId ?? '', row.mcId ?? '', sc.rt ?? '', sc.rtCount ?? '', sc.rtAudience ?? '', sc.rtAverage ?? '', sc.metacritic ?? '', sc.mcCount ?? '',
      sc.imdb ?? '', sc.imdbVotes ?? '',
      franchise ? `${franchise[0]}:${clean(franchise[1])}` : '', series ? `${series[0]}:${clean(series[1])}` : '', split(row, 'basedOn').map(([, l]) => clean(l)).join(';'),
      row.seasons ?? '', row.episodes ?? '', row.start ?? '', row.end ?? '', [...roles].join(';'), directors.map(clean).join(';'), awards.length,
      split(row, 'companies').map(([, l]) => clean(l)).join(';'), split(row, 'distributors').map(([, l]) => clean(l)).join(';'), split(row, 'broadcasters').map(([, l]) => clean(l)).join(';'),
    ].join('\t'));
    allTitles.add(normalise(row.label));
    if (row.original) allTitles.add(normalise(row.original));

    const shard = credits[decade(y)] ??= [CREDIT_HEADER.join('\t')];
    for (const p of row.people) shard.push([row.qid, p.role, p.qid, clean(p.name), '', ''].join('\t'));
    const cast = [...row.cast].sort((a, b) => (Number(a.ordinal) || 999) - (Number(b.ordinal) || 999));
    for (const c of cast.slice(0, 40)) shard.push([row.qid, 'cast', c.qid, clean(c.name), clean(c.character), c.ordinal ?? ''].join('\t'));
    for (const a of awards) shard.push([row.qid, 'award', '', clean(a), '', ''].join('\t'));
    for (const [q, l] of split(row, 'follows')) shard.push([row.qid, 'follows', q ?? '', clean(l), '', ''].join('\t'));
    for (const [q, l] of split(row, 'followedBy')) shard.push([row.qid, 'followed_by', q ?? '', clean(l), '', ''].join('\t'));
    for (const s of row.lists.subjects ?? []) shard.push([row.qid, 'subject', '', clean(s), '', ''].join('\t'));

    // Stats: what this studio actually makes.
    const isTv = kind === 'series' || kind === 'limited_series';
    if (isTv) st.series++; else st.films++;
    st.byDecade[decade(y)] = (st.byDecade[decade(y)] ?? 0) + 1;
    const yr = Number(y);
    if (yr >= 2011 && !isTv) {
      for (const g of sg) st.genres[g] = (st.genres[g] ?? 0) + 1;
      if (row.budget && row.budget.unit === 'United States dollar') st.budgets.push(row.budget.amount);
      if (row.boxOffice && row.boxOffice.unit === 'United States dollar') st.grosses.push(row.boxOffice.amount);
      if (sc.rt) st.rts.push(Number(sc.rt));
      st.awards += awards.length;
    }
    if (yr >= 2021 && !isTv) st.recentYears[yr] = (st.recentYears[yr] ?? 0) + 1;
    if (franchise) { const f = st.franchises[franchise[1]] ??= { count: 0, gross: 0 }; f.count++; if (typeof box === 'number' && row.boxOffice.unit === 'United States dollar') f.gross += box; }
    if (!isTv && typeof box === 'number' && row.boxOffice.unit === 'United States dollar' && (!st.top || box > st.top.gross)) st.top = { title: clean(row.label), year: y, gross: box };
    if (isTv && (!st.topSeries || (Number(row.episodes) || 0) > st.topSeries.episodes)) st.topSeries = { title: clean(row.label), year: y, episodes: Number(row.episodes) || 0 };
  }
  writeFileSync(new URL(`${studio}.tsv`, OUT), index.join('\n') + '\n');
  for (const [dec, lines] of Object.entries(credits)) writeFileSync(new URL(`${studio}-credits-${dec}.tsv`, OUT), lines.join('\n') + '\n');

  const pct = (arr, p) => { if (arr.length === 0) return null; const s = [...arr].sort((a, b) => a - b); return Math.round(s[Math.min(s.length - 1, Math.floor(p * s.length))]); };
  const total = Object.values(st.genres).reduce((a, b) => a + b, 0) || 1;
  const recent = Object.values(st.recentYears);
  stats[studio] = {
    films: st.films, series: st.series, titles: index.length - 1, byDecade: st.byDecade,
    genreShares: Object.fromEntries(Object.entries(st.genres).sort((a, b) => b[1] - a[1]).map(([g, n]) => [g, Math.round((n / total) * 1000) / 1000])),
    budgetLow: pct(st.budgets, 0.15), budgetHigh: pct(st.budgets, 0.9), budgetSample: st.budgets.length,
    grossMedian: pct(st.grosses, 0.5), grossHigh: pct(st.grosses, 0.9), grossSample: st.grosses.length,
    rtMean: st.rts.length ? Math.round(st.rts.reduce((a, b) => a + b, 0) / st.rts.length) : null, rtSample: st.rts.length,
    awardsPerFilm: st.films ? Math.round((st.awards / Math.max(1, st.rts.length || st.films)) * 100) / 100 : 0,
    filmsPerYear: recent.length ? Math.round((recent.reduce((a, b) => a + b, 0) / recent.length) * 10) / 10 : 0,
    franchises: Object.entries(st.franchises).sort((a, b) => b[1].gross - a[1].gross || b[1].count - a[1].count).slice(0, 12).map(([name, f]) => ({ name, count: f.count, gross: f.gross })),
    franchiseCount: Object.keys(st.franchises).length,
    top: st.top, topSeries: st.topSeries,
  };
  console.log(`${studio.padEnd(14)} ${String(index.length - 1).padStart(5)} titles  ${st.films} films ${st.series} series  shards ${Object.keys(credits).length}`);
}

// --- IMDb shard -------------------------------------------------------------
if (imdb.size > 0) {
  const lines = ['# IMDb ratings from datasets.imdbws.com. Licence: personal and non-commercial use only. Delete this file to drop IMDb scores from the game.', 'imdbId\trating\tvotes'];
  const seen = new Set();
  for (const row of details.values()) {
    if (row.imdb && !seen.has(row.imdb) && imdb.has(row.imdb)) { seen.add(row.imdb); const [r, v] = imdb.get(row.imdb); lines.push(`${row.imdb}\t${r}\t${v}`); }
  }
  writeFileSync(new URL('imdb.tsv', OUT), lines.join('\n') + '\n');
  console.log(`imdb ratings: ${seen.size}`);
}

writeFileSync(new URL('titles.txt', OUT), [...allTitles].filter(Boolean).sort().join('\n') + '\n');
console.log(`titles: ${allTitles.size}`);

const gen = (body) => `// Generated by tools/filmography/emit.mjs from Wikidata (CC0). Do not edit by hand.\n${body}`;
writeFileSync(new URL('src/engine/content/studio-labels.ts', ROOT), gen(`export interface StudioLabel { name: string; qid: string; kind: 'film' | 'tv' }\nexport const STUDIO_LABELS: Readonly<Record<string, readonly StudioLabel[]>> = ${JSON.stringify(labelsOut, null, 1)};\n`));
writeFileSync(new URL('src/engine/content/studio-stats.ts', ROOT), gen(`export interface StudioStats {\n  films: number; series: number; titles: number; byDecade: Record<string, number>;\n  genreShares: Record<string, number>;\n  budgetLow: number | null; budgetHigh: number | null; budgetSample: number;\n  grossMedian: number | null; grossHigh: number | null; grossSample: number;\n  rtMean: number | null; rtSample: number; awardsPerFilm: number; filmsPerYear: number;\n  franchises: { name: string; count: number; gross: number }[]; franchiseCount: number;\n  top: { title: string; year: string; gross: number } | null; topSeries: { title: string; year: string; episodes: number } | null;\n}\nexport const STUDIO_STATS: Readonly<Record<string, StudioStats>> = ${JSON.stringify(stats, null, 1)};\n`));
