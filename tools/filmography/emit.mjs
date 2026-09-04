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
// Only the emitted files are cleared; the logos directory beside them is built by logos.mjs.
for (const f of readdirSync(OUT)) if (/\.(tsv|txt)$/.test(f)) unlinkSync(new URL(f, OUT));

const resolved = JSON.parse(readFileSync(new URL('./resolved.json', HERE), 'utf8'));
const lists = JSON.parse(readFileSync(new URL('./cache/lists.json', HERE), 'utf8'));
const seriesTypesPath = new URL('./cache/series-types.json', HERE);
const seriesTypes = existsSync(seriesTypesPath) ? JSON.parse(readFileSync(seriesTypesPath, 'utf8')) : {};
/** A "part of the series" value that is a franchise, not a list or a ranking. */
const isFranchise = (q) => !seriesTypes[q] || seriesTypes[q].franchise !== false;
const byBroadcaster = ['qid\ttitle\tyear\tkind\tbroadcaster\tstudioId\tseasons\tepisodes\tstart\tend\trt\timdb\tgenres'];
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
/**
 * A score is only a score on its own scale. A handful of rows on the record
 * carry an IMDb rating written as a percentage, or with a digit too many;
 * those are dropped rather than guessed at, because 590 could be 5.9 and
 * could equally be 59. IMDb's own published dataset is overlaid at runtime
 * and supplies the real figure for almost all of them anyway.
 */
const inScale = (value, max) => {
  const n = numeric(value);
  return n !== '' && Number(n) > 0 && Number(n) <= max ? n : '';
};

function scoresOf(row) {
  const out = {};
  for (const s of row.scores ?? []) {
    const by = s.by; const m = (s.method ?? '').toLowerCase(); const val = s.score ?? '';
    if (by === 'Q105584') {
      if (/tomatometer/.test(m) || /%$/.test(val)) {
        if (!/audience|popcorn/.test(m)) { out.rt = inScale(val.replace('%', ''), 100); if (out.rt !== '') out.rtCount = s.count; }
        else out.rtAudience = inScale(val.replace('%', ''), 100);
      } else if (/average/.test(m)) out.rtAverage = inScale(val.replace('/10', ''), 10);
    } else if (by === 'Q150248') { out.metacritic = inScale(val.replace('/100', ''), 100); if (out.metacritic !== '') out.mcCount = s.count; }
    else if (by === 'Q37312') { out.imdb = inScale(val.replace('/10', ''), 10); if (out.imdb !== '') out.imdbVotes = s.count; }
  }
  for (const key of Object.keys(out)) if (out[key] === '') delete out[key];
  return out;
}

// Items whose only label on Wikidata is in a script other than the work's
// own. The name is the one the film's own credits carry. A title with no
// label in its own language and no original title on record is left out
// rather than shown in the wrong script.
const LABEL_OVERRIDES = { Q60833431: 'Jordan Downey', Q16514655: 'Seamus Walsh', Q109358882: "Peter O'Brien", Q113812358: 'Mo', Q125636937: 'La Cage', Q134025679: 'Legado', Q124295940: 'The Massively Mixed-Up Middle School Mystery', Q4469622: 'That Awful Baby' };
const LEFT_OUT = new Set(['Q4410648', 'Q16709204', 'Q4339920']);
for (const q of LEFT_OUT) details.delete(q);
for (const row of details.values()) {
  if (LABEL_OVERRIDES[row.qid]) row.label = LABEL_OVERRIDES[row.qid];
  for (const p of row.people) if (LABEL_OVERRIDES[p.qid]) p.name = LABEL_OVERRIDES[p.qid];
  for (const c of row.cast) if (LABEL_OVERRIDES[c.qid]) c.name = LABEL_OVERRIDES[c.qid];
}
// A date is a date or nothing: an unknown-value node arrives as a URI.
const isoDate = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v ?? '') ? v : '');
// A duration stored in seconds reads as minutes; anything still past ten hours is not a runtime.
const minutes = (v) => { if (v === undefined || v === null || v === '') return ''; let n = Number(v); if (!Number.isFinite(n) || n <= 0) return ''; if (n > 600) n = Math.round(n / 60); return n > 600 ? '' : n; };
/**
 * A short film is under forty minutes by definition, so a short carrying a
 * runtime of five hundred has it recorded in seconds. The unit is not on the
 * row to check against, so rather than guess which it is, the figure is left
 * out and the screen says the record has no number.
 */
const runtimeFor = (kind, duration) => {
  const value = minutes(duration);
  if (value === '' ) return '';
  if (kind === 'short' && Number(value) > 60) return '';
  return value;
};

const year = (row) => (isoDate(row.date) || isoDate(row.start) || '').slice(0, 4);
const decade = (y) => (y ? `${Math.floor(Number(y) / 10) * 10}s` : 'undated');

// --- per studio ---------------------------------------------------------------
const INDEX_HEADER = ['qid', 'kind', 'title', 'original', 'year', 'date', 'runtime', 'genres', 'slateGenres', 'countries', 'languages', 'mpaa', 'boxOffice', 'boxUnit', 'budget', 'budgetUnit', 'imdbId', 'rtId', 'mcId', 'rt', 'rtCount', 'rtAudience', 'rtAverage', 'metacritic', 'mcCount', 'imdb', 'imdbVotes', 'franchise', 'series', 'basedOn', 'seasons', 'episodes', 'start', 'end', 'roles', 'directors', 'awards', 'companies', 'distributors', 'broadcasters'];
const CREDIT_HEADER = ['qid', 'role', 'personQid', 'name', 'character', 'ordinal'];

const allTitles = new Set();
const UPCOMING_FROM = '2026-01-01';
const upcoming = [];
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
    const franchise = split(row, 'franchise').find(([q]) => isFranchise(q));
    const series = split(row, 'series').find(([q]) => isFranchise(q));
    const awards = row.lists.awards ?? [];
    const box = row.boxOffice && row.boxOffice.unit === 'United States dollar' ? Math.round(row.boxOffice.amount) : row.boxOffice ? Math.round(row.boxOffice.amount) : '';
    const budget = row.budget ? Math.round(row.budget.amount) : '';
    index.push([
      row.qid, kind, clean(row.label), clean(row.original) !== clean(row.label) ? clean(row.original) : '', y, isoDate(row.date), runtimeFor(kind, row.duration), genres.map(clean).join(';'), sg.join(';'),
      split(row, 'countries').map(([, l]) => clean(l)).join(';'), split(row, 'languages').map(([, l]) => clean(l)).join(';'), (row.lists.mpaa ?? [])[0] ?? '',
      box, row.boxOffice ? row.boxOffice.unit : '', budget, row.budget ? row.budget.unit : '',
      row.imdb ?? '', row.rtId ?? '', row.mcId ?? '', sc.rt ?? '', sc.rtCount ?? '', sc.rtAudience ?? '', sc.rtAverage ?? '', sc.metacritic ?? '', sc.mcCount ?? '',
      sc.imdb ?? '', sc.imdbVotes ?? '',
      franchise ? `${franchise[0]}:${clean(franchise[1])}` : '', series ? `${series[0]}:${clean(series[1])}` : '', split(row, 'basedOn').map(([, l]) => clean(l)).join(';'),
      row.seasons ?? '', row.episodes ?? '', isoDate(row.start), isoDate(row.end), [...roles].join(';'), directors.map(clean).join(';'), awards.length,
      split(row, 'companies').map(([, l]) => clean(l)).join(';'), split(row, 'distributors').map(([, l]) => clean(l)).join(';'), split(row, 'broadcasters').map(([, l]) => clean(l)).join(';'),
    ].join('\t'));
    allTitles.add(normalise(row.label));
    if (row.original) allTitles.add(normalise(row.original));
    // The dated slate: what the studio has announced for release from 2026 on.
    // The engine carries this in the bundle so the world can release it on the day.
    if (isoDate(row.date) >= UPCOMING_FROM && kind !== 'short') {
      upcoming.push({
        qid: row.qid, studioId: studio, title: clean(row.label), kind, date: isoDate(row.date), genres: sg,
        ...(row.budget && row.budget.unit === 'United States dollar' ? { budget: Math.round(row.budget.amount) } : {}),
        ...(franchise ? { franchise: { qid: franchise[0], name: clean(franchise[1]) } } : series ? { franchise: { qid: series[0], name: clean(series[1]) } } : {}),
        ...(row.imdb ? { imdbId: row.imdb } : {}),
      });
    }

    const shard = credits[decade(y)] ??= [CREDIT_HEADER.join('\t')];
    // A credit with no name on record anywhere is not a credit the screen can show.
    const named = (x) => x.name && !/^Q\d+$/.test(x.name);
    for (const p of row.people) if (named(p)) shard.push([row.qid, p.role, p.qid, clean(p.name), '', ''].join('\t'));
    const cast = [...row.cast].filter(named).sort((a, b) => (Number(a.ordinal) || 999) - (Number(b.ordinal) || 999));
    for (const c of cast.slice(0, 40)) shard.push([row.qid, 'cast', c.qid, clean(c.name), clean(c.character), c.ordinal ?? ''].join('\t'));
    for (const a of awards) shard.push([row.qid, 'award', '', clean(a), '', ''].join('\t'));
    for (const [q, l] of split(row, 'follows')) shard.push([row.qid, 'follows', q ?? '', clean(l), '', ''].join('\t'));
    for (const [q, l] of split(row, 'followedBy')) shard.push([row.qid, 'followed_by', q ?? '', clean(l), '', ''].join('\t'));
    for (const s of row.lists.subjects ?? []) shard.push([row.qid, 'subject', '', clean(s), '', ''].join('\t'));

    if (kind === 'series' || kind === 'limited_series') {
      for (const [, b] of split(row, 'broadcasters')) byBroadcaster.push([row.qid, clean(row.label), y, kind, clean(b), studio, row.seasons ?? '', row.episodes ?? '', isoDate(row.start), isoDate(row.end), sc.rt ?? '', sc.imdb ?? '', sg.join(';')].join('\t'));
    }

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

writeFileSync(new URL('series-by-broadcaster.tsv', OUT), byBroadcaster.join('\n') + '\n');
console.log(`series by broadcaster: ${byBroadcaster.length - 1}`);
writeFileSync(new URL('titles.txt', OUT), [...allTitles].filter(Boolean).sort().join('\n') + '\n');
console.log(`titles: ${allTitles.size}`);

const gen = (body) => `// Generated by tools/filmography/emit.mjs from Wikidata (CC0). Do not edit by hand.\n${body}`;
// --- all-time records ----------------------------------------------------------
// What the record actually carries: worldwide gross, budget, runtime, scores,
// awards, seasons and episodes. Opening weekends and streaming viewership are
// not on Wikidata in a comparable form, so nothing here claims them.
const everyTitle = new Map();
for (const [studio, labels] of Object.entries(resolved)) {
  for (const kind of ['film', 'tv']) {
    for (const label of labels[kind]) {
      for (const [t] of lists[`${label.qid}|${kind}`] ?? []) {
        const row = details.get(t);
        if (!row || !row.label || /^Q\d+$/.test(row.label)) continue;
        const entry = everyTitle.get(t) ?? { row, studios: new Set() };
        entry.studios.add(studio);
        everyTitle.set(t, entry);
      }
    }
  }
}
const recordRow = (entry, extra) => {
  const { row, studios } = entry;
  const sc = scoresOf(row);
  return {
    qid: row.qid, title: clean(row.label), year: Number(year(row)) || undefined,
    studioIds: [...studios],
    ...(row.boxOffice && row.boxOffice.unit === 'United States dollar' ? { gross: Math.round(row.boxOffice.amount) } : {}),
    ...(row.budget && row.budget.unit === 'United States dollar' ? { budget: Math.round(row.budget.amount) } : {}),
    ...(runtimeFor(kindOf(row, 'film'), row.duration) ? { runtime: Number(runtimeFor(kindOf(row, 'film'), row.duration)) } : {}),
    ...(sc.imdb ? { imdb: Number(sc.imdb), imdbVotes: Number(sc.imdbVotes) || undefined } : {}),
    ...(sc.rt ? { tomatometer: Number(sc.rt), tomatometerCount: Number(sc.rtCount) || undefined } : {}),
    ...(row.seasons ? { seasons: Number(row.seasons) } : {}),
    ...(row.episodes ? { episodes: Number(row.episodes) } : {}),
    ...(row.start ? { start: isoDate(row.start) } : {}),
    ...(row.end ? { end: isoDate(row.end) } : {}),
    ...(row.lists.awards ? { awards: row.lists.awards.length } : {}),
    ...extra,
  };
};
const films = [];
const television = [];
for (const entry of everyTitle.values()) {
  const kind = kindOf(entry.row, 'film');
  const isTv = kind === 'series' || kind === 'limited_series';
  (isTv ? television : films).push(recordRow(entry, { kind }));
}
const topBy = (rows, field, limit, filter = () => true) => rows
  .filter((r) => typeof r[field] === 'number' && filter(r))
  .sort((a, b) => b[field] - a[field])
  .slice(0, limit);
const runYears = (r) => (r.start && r.end ? Number(r.end.slice(0, 4)) - Number(r.start.slice(0, 4)) : r.start ? 2026 - Number(r.start.slice(0, 4)) : 0);
// A franchise's total, from the titles the record puts in it.
const franchiseTotals = new Map();
for (const entry of everyTitle.values()) {
  const f = split(entry.row, 'franchise').find(([q]) => isFranchise(q)) ?? split(entry.row, 'series').find(([q]) => isFranchise(q));
  if (!f) continue;
  const box = entry.row.boxOffice && entry.row.boxOffice.unit === 'United States dollar' ? Math.round(entry.row.boxOffice.amount) : 0;
  const cur = franchiseTotals.get(f[1]) ?? { name: clean(f[1]), qid: f[0], gross: 0, titles: 0, years: [] };
  cur.gross += box; cur.titles++;
  const y = Number(year(entry.row)); if (y) cur.years.push(y);
  franchiseTotals.set(f[1], cur);
}
const franchises = [...franchiseTotals.values()]
  .filter((f) => f.titles >= 2 && f.gross > 0)
  .map((f) => ({ name: f.name, qid: f.qid, gross: f.gross, titles: f.titles, firstYear: Math.min(...f.years), lastYear: Math.max(...f.years) }))
  .sort((a, b) => b.gross - a.gross).slice(0, 40);
const yearBest = {};
for (const f of films) {
  if (!f.year || typeof f.gross !== 'number') continue;
  const k = String(f.year);
  if (!yearBest[k] || f.gross > yearBest[k].gross) yearBest[k] = { title: f.title, qid: f.qid, gross: f.gross, studioIds: f.studioIds };
}
const records = {
  builtFrom: everyTitle.size,
  film: {
    gross: topBy(films, 'gross', 50),
    budget: topBy(films, 'budget', 30),
    runtime: topBy(films, 'runtime', 25, (r) => r.runtime >= 150 && r.kind !== 'short'),
    imdb: topBy(films, 'imdb', 40, (r) => (r.imdbVotes ?? 0) >= 50_000),
    tomatometer: topBy(films, 'tomatometer', 40, (r) => (r.tomatometerCount ?? 0) >= 60),
    awards: topBy(films, 'awards', 30),
    byYear: Object.fromEntries(Object.entries(yearBest).sort((a, b) => Number(b[0]) - Number(a[0])).slice(0, 60)),
  },
  television: {
    episodes: topBy(television, 'episodes', 40),
    seasons: topBy(television, 'seasons', 40),
    longestRun: television.filter((r) => r.start).map((r) => ({ ...r, years: runYears(r) })).filter((r) => r.years >= 8).sort((a, b) => b.years - a.years).slice(0, 40),
    imdb: topBy(television, 'imdb', 40, (r) => (r.imdbVotes ?? 0) >= 20_000),
    awards: topBy(television, 'awards', 30),
  },
  franchises,
};
writeFileSync(new URL('src/engine/content/records.ts', ROOT), gen(`/**
 * All-time records, from the record itself.
 *
 * Everything here is a figure Wikidata carries for a title in one of the
 * studios' catalogues: worldwide gross in United States dollars, production
 * budget, runtime, IMDb and Rotten Tomatoes scores, award counts, seasons and
 * episodes. Opening weekends and streaming viewership are not on the record
 * in a comparable form and are not claimed here; those records are kept for
 * what happens inside a save instead.
 */
export interface RecordEntry {
  qid: string; title: string; year?: number; kind?: string; studioIds: string[];
  gross?: number; budget?: number; runtime?: number;
  imdb?: number; imdbVotes?: number; tomatometer?: number; tomatometerCount?: number;
  seasons?: number; episodes?: number; start?: string; end?: string; awards?: number; years?: number;
}
export interface FranchiseRecord { name: string; qid: string; gross: number; titles: number; firstYear: number; lastYear: number }
export interface AllTimeRecords {
  builtFrom: number;
  film: { gross: RecordEntry[]; budget: RecordEntry[]; runtime: RecordEntry[]; imdb: RecordEntry[]; tomatometer: RecordEntry[]; awards: RecordEntry[]; byYear: Record<string, { title: string; qid: string; gross: number; studioIds: string[] }> };
  television: { episodes: RecordEntry[]; seasons: RecordEntry[]; longestRun: RecordEntry[]; imdb: RecordEntry[]; awards: RecordEntry[] };
  franchises: FranchiseRecord[];
}
export const ALL_TIME: AllTimeRecords = ${JSON.stringify(records)};
`));
console.log(`records: ${films.length} films, ${television.length} series, ${franchises.length} franchises`);

upcoming.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
const seenUpcoming = new Set();
const upcomingOut = upcoming.filter((u) => { const k = `${u.studioId}|${u.qid}`; if (seenUpcoming.has(k)) return false; seenUpcoming.add(k); return true; });
writeFileSync(new URL('src/engine/content/upcoming-slate.ts', ROOT), gen(`/** A title a studio has dated, from the record. What it does once the day comes is the save's own simulation. */\nexport interface UpcomingTitle {\n  qid: string; studioId: string; title: string; kind: string; date: string; genres: string[];\n  /** Budget on record, in United States dollars. */\n  budget?: number;\n  franchise?: { qid: string; name: string };\n  imdbId?: string;\n}\nexport const UPCOMING_SLATE: readonly UpcomingTitle[] = ${JSON.stringify(upcomingOut, null, 1)};\n`));
console.log(`upcoming slate: ${upcomingOut.length}`);
writeFileSync(new URL('src/engine/content/studio-labels.ts', ROOT), gen(`export interface StudioLabel { name: string; qid: string; kind: 'film' | 'tv' }\nexport const STUDIO_LABELS: Readonly<Record<string, readonly StudioLabel[]>> = ${JSON.stringify(labelsOut, null, 1)};\n`));
writeFileSync(new URL('src/engine/content/studio-stats.ts', ROOT), gen(`export interface StudioStats {\n  films: number; series: number; titles: number; byDecade: Record<string, number>;\n  genreShares: Record<string, number>;\n  budgetLow: number | null; budgetHigh: number | null; budgetSample: number;\n  grossMedian: number | null; grossHigh: number | null; grossSample: number;\n  rtMean: number | null; rtSample: number; awardsPerFilm: number; filmsPerYear: number;\n  franchises: { name: string; count: number; gross: number }[]; franchiseCount: number;\n  top: { title: string; year: string; gross: number } | null; topSeries: { title: string; year: string; episodes: number } | null;\n}\nexport const STUDIO_STATS: Readonly<Record<string, StudioStats>> = ${JSON.stringify(stats, null, 1)};\n`));
