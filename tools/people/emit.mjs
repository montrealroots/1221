/**
 * Turns what was pulled into what the game reads.
 *
 * Three files, all tab-separated and all loaded lazily by the app:
 *   people.tsv         who they are, and the evidence behind each job they do
 *   people-credits.tsv every title they are on, in every capacity
 *   people-awards.tsv  every award won and every nomination
 *
 * The evidence columns are counts and averages taken from the record. The
 * attributes the game shows are derived from them at runtime, in
 * src/engine/content/people.ts, so the screen can show its working rather than
 * asking to be believed.
 */
import { existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';

const HERE = new URL('./', import.meta.url);
const OUT = new URL('../../public/industry/', HERE);
const CACHE = new URL('./cache/', HERE);

const readNdjson = (name) => {
  const path = new URL(`./${name}`, CACHE);
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8').split('\n').filter((l) => l.trim()).flatMap((line) => {
    try { return [JSON.parse(line)]; } catch { return []; }
  });
};

const resolved = JSON.parse(readFileSync(new URL('./resolved.json', HERE), 'utf8'));
/**
 * How precise each date of birth is, from the record's own precision field.
 * 11 is a day, 10 a month, 9 a year, anything less is a century. A date that
 * is not precise to the day is not a birthday, and is not written as one.
 */
const precision = existsSync(new URL('./precision.json', HERE))
  ? JSON.parse(readFileSync(new URL('./precision.json', HERE), 'utf8'))
  : {};
const facts = new Map(readNdjson('facts.ndjson').map((f) => [f.qid, f]));
const credits = new Map(readNdjson('credits.ndjson').map((c) => [c.qid, c.works]));
const awards = new Map(readNdjson('awards.ndjson').map((a) => [a.qid, a.awards]));
const works = new Map(readNdjson('works.ndjson').map((w) => [w.qid, w]));
console.log(`facts ${facts.size}, credits ${credits.size}, awards ${awards.size}, works ${works.size}`);

// --- IMDb ratings, if the file is present --------------------------------

const ratings = new Map();
{
  const path = new URL('./imdb.tsv', OUT);
  if (existsSync(path)) {
    const lines = readFileSync(path, 'utf8').split('\n');
    for (const line of lines) {
      if (!line || line.startsWith('#') || line.startsWith('imdbId')) continue;
      const [id, rating, votes] = line.split('\t');
      if (id) ratings.set(id, { rating: Number(rating), votes: Number(votes) });
    }
    console.log(`${ratings.size} IMDb ratings on file`);
  }
}

// --- The studio catalogue, for anything it already knows ------------------

const catalogue = new Map();
for (const file of readdirSync(OUT)) {
  if (!file.endsWith('.tsv') || file.includes('-credits-') || file === 'imdb.tsv' || file.startsWith('people')) continue;
  const lines = readFileSync(new URL(`./${file}`, OUT), 'utf8').split('\n');
  const head = lines[0]?.split('\t') ?? [];
  const col = (name) => head.indexOf(name);
  const [cQid, cBox, cBudget, cFranchise, cAwards, cImdb] =
    ['qid', 'boxOffice', 'budget', 'franchise', 'awards', 'imdbId'].map(col);
  if (cQid < 0) continue;
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const parts = line.split('\t');
    const id = parts[cQid];
    if (!id || catalogue.has(id)) continue;
    catalogue.set(id, {
      box: Number(parts[cBox] || 0), budget: Number(parts[cBudget] || 0),
      franchise: parts[cFranchise] || '', awards: Number(parts[cAwards] || 0),
      imdb: parts[cImdb] || '',
    });
  }
}
console.log(`${catalogue.size} titles already in the studio catalogue`);

// --- Roles ---------------------------------------------------------------

/** What a credit in the record counts as in SLATE's vocabulary. */
const ROLE_OF_CREDIT = {
  cast: 'actor', performer: 'actor',
  director: 'director',
  producer: 'producer', 'executive producer': 'producer',
  writer: 'writer', creator: 'creator',
  composer: 'composer', cinematographer: 'cinematographer',
};

const TV_KINDS = /series|programme|program|miniseries|anime/i;

/** Which craft a credit contributes evidence to. Writing on television is running it. */
function creditRoles(role, kind) {
  const mapped = ROLE_OF_CREDIT[role];
  if (!mapped) return [];
  if (mapped === 'writer') return TV_KINDS.test(kind) ? ['showrunner'] : ['director'];
  if (mapped === 'creator') return TV_KINDS.test(kind) ? ['showrunner'] : ['producer'];
  return [mapped];
}

// --- Awards --------------------------------------------------------------

/**
 * Honours that are not for anything on a screen. They are real and they are
 * theirs, but they say nothing about how good somebody is at making films, so
 * they are not counted into what the attributes are read off.
 */
const NOT_SCREEN = /espy|athlete|sportsman|sportswoman|laureus|olympic|all-star|mvp|most valuable player|nba |nfl |fifa|ballon d'or|world cup|championship performance|slam dunk|scoring title|rookie of the year|humanitarian award|philanthrop/i;

/** What an award is worth. The scale is SLATE's; the awards are the record's. */
function awardWeight(name) {
  if (/academy award|oscar/i.test(name)) return 10;
  if (/palme d'or|golden lion|golden bear|grand prix|caméra d'or/i.test(name)) return 9;
  if (/bafta|british academy/i.test(name)) return 6;
  if (/emmy/i.test(name)) return 6;
  if (/golden globe/i.test(name)) return 5;
  if (/grammy/i.test(name)) return 5;
  if (/screen actors guild|directors guild|producers guild|writers guild|american society of cinematographers|society of composers/i.test(name)) return 5;
  if (/critics|independent spirit|gotham|national board|new york film critics|los angeles film critics/i.test(name)) return 3;
  return 1.5;
}

/** Which craft an award belongs to, from what it is called. */
function awardRoles(name) {
  const out = new Set();
  if (/actor|actress|performance|cast|ensemble|breakthrough performer/i.test(name)) out.add('actor');
  if (/direct/i.test(name)) out.add('director');
  if (/cinematograph/i.test(name)) out.add('cinematographer');
  if (/score|music|song|soundtrack|composer/i.test(name)) out.add('composer');
  if (/screenplay|writing|teleplay|written/i.test(name)) { out.add('showrunner'); out.add('director'); }
  if (/best picture|best film|best motion picture|outstanding .*series|outstanding .*movie|producer/i.test(name)) out.add('producer');
  if (/palme d'or|golden lion|golden bear|honorary|lifetime|achievement|icon|career/i.test(name)) { out.add('director'); out.add('producer'); }
  return [...out];
}

// --- Evidence ------------------------------------------------------------

const THIS_YEAR = new Date().getUTCFullYear();

/** Whatever this person is credited in most, which is what an unlabelled award is for. */
const busiestCache = new Map();
function busiestRole(qid) {
  if (busiestCache.has(qid)) return busiestCache.get(qid);
  const counts = new Map();
  for (const work of credits.get(qid) ?? []) {
    for (const credited of work.roles) {
      for (const role of creditRoles(credited, work.kind)) counts.set(role, (counts.get(role) ?? 0) + 1);
    }
  }
  const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'actor';
  busiestCache.set(qid, best);
  return best;
}
const NOISE_SERIES = /list of|greatest|ranking|100 |top \d|best of/i;

function evidenceFor(qid, role) {
  const mine = (credits.get(qid) ?? []).filter((work) => work.roles.some((r) => creditRoles(r, work.kind).includes(role)));
  if (mine.length === 0) return undefined;

  const years = mine.map((w) => Number((w.date ?? '').slice(0, 4))).filter((y) => y > 1900);
  const genres = new Set();
  const genreCounts = new Map();
  const franchises = new Set();
  let box = 0; let boxN = 0; let budget = 0; let budgetN = 0;
  let ratingSum = 0; let ratingWeight = 0; let ratedN = 0;
  const rated = [];
  for (const work of mine) {
    const extra = works.get(work.qid);
    const cat = catalogue.get(work.qid);
    for (const genre of extra?.genres ?? work.genres ?? []) {
      const name = genre.replace(/ film$| series$/, '');
      genres.add(name);
      genreCounts.set(name, (genreCounts.get(name) ?? 0) + 1);
    }
    const series = [extra?.series, ...(work.series ?? [])].find((s) => s && !NOISE_SERIES.test(s));
    const franchise = extra?.franchise || cat?.franchise || series;
    if (franchise) franchises.add(franchise);
    const grossed = extra?.box || cat?.box || 0;
    if (grossed > 0) { box += grossed; boxN++; }
    const cost = extra?.budget || cat?.budget || 0;
    if (cost > 0) { budget += cost; budgetN++; }
    const imdbId = extra?.imdb || cat?.imdb;
    const score = imdbId ? ratings.get(imdbId) : undefined;
    if (score && score.votes > 200) {
      const weight = Math.log10(score.votes);
      ratingSum += score.rating * weight;
      ratingWeight += weight;
      ratedN++;
      rated.push({ title: work.title, rating: score.rating, votes: score.votes, year: Number((work.date ?? '').slice(0, 4)) || 0 });
    }
  }

  let wins = 0; let noms = 0; let winScore = 0; let nomScore = 0; let topAward = '';
  for (const award of awards.get(qid) ?? []) {
    if (NOT_SCREEN.test(award.award)) continue;
    const roles = awardRoles(award.award);
    if (roles.length > 0 && !roles.includes(role)) continue;
    // An award whose name says nothing about the job — a founders award, a
    // career honour — belongs to whatever they mostly do, not to every job
    // they have ever been credited in.
    if (roles.length === 0 && role !== busiestRole(qid)) continue;
    const weight = awardWeight(award.award);
    if (roles.length === 0 && weight < 5) continue;
    if (award.outcome === 'won') { wins++; winScore += weight; if (weight >= awardWeight(topAward || 'x')) topAward = award.award; }
    else { noms++; nomScore += weight * 0.35; }
  }

  const variance = rated.length > 1
    ? rated.reduce((s, r) => s + (r.rating - (ratingSum / Math.max(ratingWeight, 1e-9))) ** 2, 0) / rated.length
    : 0;

  return {
    credits: mine.length,
    firstYear: years.length ? Math.min(...years) : 0,
    lastYear: years.length ? Math.max(...years) : 0,
    recent: mine.filter((w) => Number((w.date ?? '').slice(0, 4)) >= THIS_YEAR - 8).length,
    ratedCount: ratedN,
    rating: ratingWeight > 0 ? Number((ratingSum / ratingWeight).toFixed(3)) : 0,
    spread: Number(Math.sqrt(variance).toFixed(3)),
    boxMean: boxN > 0 ? Math.round(box / boxN) : 0,
    boxCount: boxN,
    budgetMean: budgetN > 0 ? Math.round(budget / budgetN) : 0,
    genreCount: genres.size,
    // What they actually work in, most often first. This is what makes an
    // action star's sheet different from a chamber-drama actor's.
    topGenres: [...genreCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([g, n]) => `${g}:${n}`),
    franchises: [...franchises].slice(0, 8),
    wins, noms,
    winScore: Number(winScore.toFixed(1)), nomScore: Number(nomScore.toFixed(1)),
    topAward,
    best: rated.sort((a, b) => b.rating * Math.log10(b.votes) - a.rating * Math.log10(a.votes)).slice(0, 5).map((r) => r.title),
  };
}

// --- Emit ----------------------------------------------------------------

const ROLES = ['actor', 'director', 'producer', 'showrunner', 'cinematographer', 'composer'];
const clean = (s) => String(s ?? '').replace(/[\t\r\n]+/g, ' ').trim();

const peopleRows = [];
const creditRows = [];
const awardRows = [];

for (const [name, entry] of Object.entries(resolved)) {
  if (!entry.qid) continue;
  const fact = facts.get(entry.qid) ?? {};
  const mine = credits.get(entry.qid) ?? [];

  const evidence = {};
  for (const role of ROLES) {
    const e = evidenceFor(entry.qid, role);
    if (e && e.credits > 0) evidence[role] = e;
  }
  // Somebody listed as a director with no directing credit on file is still a
  // director; the sheet is then built on a thin body of work and says so.
  for (const role of entry.roles) if (!evidence[role]) evidence[role] = undefined;

  // A year-only date of birth is a year, not a birthday. It is kept as a year
  // and never written as the first of January, which is what the record's own
  // storage makes it look like.
  const rawBirth = clean(fact.birth ?? entry.birth ?? '');
  const level = precision[entry.qid]?.precision ?? (rawBirth ? 11 : 0);
  const birth = level >= 11 ? rawBirth : '';
  const birthYear = level >= 9 && rawBirth ? rawBirth.slice(0, 4) : '';

  peopleRows.push([
    entry.qid, clean(name), entry.roles.join(';'), (entry.listedAs ?? []).join(';'),
    birth, clean(fact.death ?? ''), clean(fact.bornIn ?? ''),
    (fact.citizenship ?? []).join(';'), clean(fact.gender ?? ''), clean(fact.imdb ?? ''),
    clean(fact.startYear ?? ''), (fact.occupations ?? []).join(';'),
    (fact.memberOf ?? []).join(';'), (fact.employers ?? []).join(';'),
    clean(entry.description ?? ''), String(mine.length), String((awards.get(entry.qid) ?? []).length),
    JSON.stringify(evidence), birthYear,
  ].join('\t'));

  for (const work of mine) {
    const extra = works.get(work.qid) ?? {};
    const cat = catalogue.get(work.qid) ?? {};
    const imdbId = extra.imdb || cat.imdb || '';
    const score = imdbId ? ratings.get(imdbId) : undefined;
    const franchise = extra.franchise || cat.franchise
      || [extra.series, ...(work.series ?? [])].find((s) => s && !NOISE_SERIES.test(s)) || '';
    creditRows.push([
      entry.qid, work.qid, clean(work.title), (work.date ?? '').slice(0, 4), clean(work.kind),
      work.roles.join(';'), (extra.genres ?? work.genres ?? []).slice(0, 6).join(';'), clean(franchise),
      (extra.companies ?? work.companies ?? []).slice(0, 3).join(';'), imdbId,
      score ? String(score.rating) : '', score ? String(score.votes) : '',
      String(extra.box || cat.box || ''), String(extra.budget || cat.budget || ''),
    ].join('\t'));
  }

  for (const award of awards.get(entry.qid) ?? []) {
    awardRows.push([
      entry.qid, clean(award.award), award.outcome, clean(award.forWork ?? ''), award.year ?? '',
      String(awardWeight(award.award)), awardRoles(award.award).join(';'),
    ].join('\t'));
  }
}

const header = (cols) => cols.join('\t');
writeFileSync(new URL('./people.tsv', OUT), [
  '# The people of the industry, from Wikidata (CC0). The evidence column is counted from the record; the attributes the game shows are derived from it and are SLATE\'s own reading, not published figures.',
  header(['qid', 'name', 'roles', 'listedAs', 'birth', 'death', 'bornIn', 'citizenship', 'gender', 'imdbId', 'startYear', 'occupations', 'memberOf', 'employers', 'description', 'creditCount', 'awardCount', 'evidence', 'birthYear']),
  ...peopleRows,
].join('\n'));

writeFileSync(new URL('./people-credits.tsv', OUT), [
  '# Every title the roster is credited on, from Wikidata (CC0). Ratings are IMDb, personal and non-commercial use only.',
  header(['personQid', 'workQid', 'title', 'year', 'kind', 'roles', 'genres', 'franchise', 'companies', 'imdbId', 'rating', 'votes', 'boxOffice', 'budget']),
  ...creditRows,
].join('\n'));

writeFileSync(new URL('./people-awards.tsv', OUT), [
  '# Awards won and nominated, from Wikidata (CC0). The weight is SLATE\'s own, for ordering.',
  header(['personQid', 'award', 'outcome', 'forWork', 'year', 'weight', 'roles']),
  ...awardRows,
].join('\n'));

console.log(`people ${peopleRows.length}, credits ${creditRows.length}, awards ${awardRows.length}`);
