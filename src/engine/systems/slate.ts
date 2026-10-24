/**
 * SLATE — the slate: the work the world keeps making (from 2026-10-24, the owner's brief 27, Area B: "Build an ongoing
 * project and opportunity lifecycle that produces appropriate new work over simulation time ... Preserve history. A
 * previously completed project must not silently reset and return as a brand-new opportunity ... The player must not be
 * guaranteed work, but the world must not stop generating opportunities because a small catalog is exhausted").
 *
 * **What it makes.** Each Monday, in each market (`content/slate.ts`), productions of each kind at the market's rate for
 * the time of year: a play, a film, a television movie, a limited series, a dub, each with one to three parts, cast once,
 * its first day some weeks on. Each year, new television series in the markets that make them, each a series as brief 25's
 * Calloway Files is (`content/series.ts`): one season ordered, then renewed, canceled and revived by the network's word each
 * May (`systems/series.ts`), new characters cast in each season it makes, a recurring part carried on by its option.
 * Everything is drawn from the save's seed and the week, so the same save makes the same world on every reload, and a
 * different save another; nothing the slate makes is stored until it reaches the actor.
 *
 * **What becomes of a production.** Each has a fate, drawn when it's made and known some weeks before its first day: made as
 * planned, pushed back some weeks, or never made. Booked into one pushed, the actor is released from the old dates and
 * offered the part again for the new; into one never made, the work is called off. The odds are the kind's, in
 * `KIND_PROFILES`, every one an ASSUMPTION.
 *
 * **History.** A part posted to the actor is kept in the save as it was posted (`keepProject`, `ProRecord.projects`), its
 * series too, and a save opened puts its own copies back first (`restoreSlate`), so a part, its production and the actor's
 * work in it read the same in a later build. A production is cast once: it's never posted again as new. A series' part
 * comes round only for a later season, as a new casting.
 *
 * Who it reaches, and how often, is the work loop's (`systems/projobs.ts`, `postingsAt`): representation, the part's fit,
 * the actor's credits, the companies they've worked for, where they live and when they're booked.
 */

import type { Simulation } from '../core/simulation';
import type { Person, SaveUniverse } from '../domain/model';
import { MS_DAY, addDays, dateKey, instantFromZoned, zonedParts, type Instant } from '../core/time';
import { hash32 } from '../core/ids';
import { addProjects, type ProjectKind, type ProjectTemplate, type RoleSize, type SlateFate } from '../content/careerwork';
import { addSeries, seasonYearAt, type SeriesTemplate } from '../content/series';
import { GENRE_DEFS, type Family } from '../content/genres';
import type { Skill } from '../content/school';
import type { PartFor } from '../content/plays';
import {
  AWAY_TRIP, BREAKDOWN, CASTING_NAMES, COMPANY_WORDS, GIVEN, KIND_PROFILES, MARKETS, SLATE_VERSION, SURNAMES, TITLE_WORDS,
  type KindProfile, type Market,
} from '../content/slate';
import { CITIES } from '../content/geography';

const NY = 'America/New_York';

/**
 * How the time of year moves a kind's rate, by medium. ASSUMPTION, every figure: television casts episodes from July to
 * March and little in its spring hiatus; the stage casts its season from late summer to spring, and less for the summer;
 * film is cast all year, less over the holidays.
 */
const SEASON: Readonly<Record<'stage' | 'film' | 'television', readonly number[]>> = {
  //            Jan  Feb  Mar  Apr  May  Jun  Jul  Aug  Sep  Oct  Nov  Dec
  television: [1.0, 1.0, 1.0, 0.5, 0.4, 0.5, 1.0, 1.1, 1.1, 1.0, 1.0, 0.7],
  stage: [1.0, 1.0, 1.0, 0.9, 0.7, 0.6, 0.6, 1.0, 1.2, 1.1, 1.0, 0.7],
  film: [1.0, 1.0, 1.1, 1.1, 1.0, 1.0, 0.9, 0.9, 1.0, 1.0, 0.9, 0.5],
};

/**
 * New series a year in a market, as a share of its weekly rate for the kind. ASSUMPTION: a market starting one co-star's
 * episode a week of a kind starts about two new series of it a year.
 */
const SERIES_A_YEAR_PER_WEEKLY = 7;

/** The save's mark in every id the slate makes, so two saves in one session never share one. */
export function slateTag(sim: Pick<Simulation, 'universe'> | { universe: SaveUniverse }): string {
  return (hash32(`slate:${sim.universe.meta.seed}`) >>> 0).toString(36).slice(0, 5);
}

const isSeriesKind = (k: ProjectKind): boolean => KIND_PROFILES[k]?.series !== undefined;

/** A draw, Poisson by inverse transform, for a count with this mean, from one stream. */
function countOf(next: () => number, mean: number): number {
  if (mean <= 0) return 0;
  let n = 0;
  let p = Math.exp(-mean);
  let s = p;
  const u = next();
  while (u > s && n < 12) { n += 1; p *= mean / n; s += p; }
  return n;
}

/** The game's genre families for a production's genres, the first two, and a breakdown's family. */
function familiesOf(genres: readonly string[]): Family[] {
  return [...new Set(genres.flatMap((g) => GENRE_DEFS[g]?.families ?? []))].slice(0, 2) as Family[];
}
function breakdownFamily(kind: ProjectKind, families: readonly Family[]): keyof typeof BREAKDOWN {
  if (kind === 'documentary') return 'documentary';
  if (kind === 'animated-series' || kind === 'animated-feature' || kind === 'dub') return 'voice';
  if (kind === 'musical') return 'musical';
  const f = families[0];
  return f === 'comedy' || f === 'farce' || f === 'satire' ? 'comedy'
    : f === 'crime' || f === 'thriller' || f === 'mystery' ? 'crime'
      : f === 'horror' ? 'horror'
        : f === 'romance' ? 'romance'
          : f === 'science_fiction' || f === 'fantasy' || f === 'adventure' || f === 'action' ? 'fantastic'
            : 'drama';
}

/** The skills a genre family leans on, besides the kind's own. */
const FAMILY_SKILLS: Partial<Record<Family, Partial<Record<Skill, number>>>> = {
  comedy: { comedy: 1 }, farce: { comedy: 1, movement: 1 }, satire: { comedy: 1 }, action: { combat: 1 }, musical: { singing: 1 },
  horror: { emotion: 1 }, tragedy: { emotion: 1 }, historical: { speech: 1 }, romance: { scene: 1 }, crime: { character: 1 },
};

/** A fictional title from the word lists. */
function titleOf(r: { pick: <T>(xs: readonly T[]) => T; int: (a: number, b: number) => number }): string {
  const w = TITLE_WORDS;
  switch (r.int(0, 4)) {
    case 0: return `The ${r.pick(w.nouns)}`;
    case 1: return `${r.pick(w.adjectives)} ${r.pick(w.nouns)}`;
    case 2: return `The ${r.pick(w.nouns)} Of ${r.pick(w.places)}`;
    case 3: return `The ${r.pick(w.nouns)} On ${r.pick(w.streets)} Street`;
    default: return `${r.pick(w.places)} ${r.pick(w.nouns)}`;
  }
}

/** A company's fictional name, by medium. */
function companyOf(r: { pick: <T>(xs: readonly T[]) => T }, medium: 'stage' | 'film' | 'television'): string {
  return `${r.pick(COMPANY_WORDS.first)} ${r.pick(COMPANY_WORDS.second)} ${r.pick(COMPANY_WORDS.kinds[medium])}`;
}

/** The Monday a posting falls on, at nine in New York, from any moment that week. */
export function weekOf(at: Instant): Instant {
  const p = zonedParts(at, NY);
  const day = new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay();
  return addDays(instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: 9, minute: 0 }, NY), -((day + 6) % 7), NY);
}

interface Production { id: string; market: Market; kind: ProjectKind; title: string; company: string; casting: string; parts: ProjectTemplate[] }

/**
 * The parts of one production, made from its own draw: its title, company and casting office, its genres, schedule and
 * place, each part's size, who it's written for, its name and its breakdown, the playing ages, the days to its first day
 * from the posting, and its fate.
 */
function makeProduction(sim: Simulation, tag: string, week: Instant, market: Market, kind: ProjectKind, n: number, profile: KindProfile, extra?: { series: SeriesTemplate; season: number; recurring: boolean }): Production {
  const key = dateKey(week, NY);
  const r = sim.rng('pro.slate', key, market.id, kind, n, extra ? `s${extra.season}` : '');
  const id = extra ? `${extra.series.id}.s${extra.season}` : `s${SLATE_VERSION}.${tag}.${key}.${market.id}.${kind}.${n}`;
  const title = extra ? extra.series.title : titleOf(r);
  const company = extra ? extra.series.company : companyOf(r, profile.medium);
  const casting = extra ? `${CASTING_NAMES[(hash32(extra.series.id) >>> 0) % CASTING_NAMES.length]} Casting` : `${r.pick(CASTING_NAMES)} Casting`;
  const genres = r.pick(profile.genres);
  const families = familiesOf(genres);
  const schedule = r.pick(profile.schedules);
  const venues = market.venues[profile.medium] ?? ['locations in town'];
  const venue = r.pick(venues);
  const lead = r.int(profile.lead[0], profile.lead[1]);
  const fate: SlateFate = (() => {
    const u = r.next();
    // Known two to four weeks before the first day, counted from the posting.
    const at = week + Math.max(7, lead - r.int(14, 28)) * MS_DAY;
    if (u < profile.fate.never) return { kind: 'dropped', at };
    if (u < profile.fate.never + profile.fate.pushed) return { kind: 'pushed', at, weeks: r.int(profile.fate.weeks[0], profile.fate.weeks[1]) };
    return { kind: 'made' };
  })();
  const count = extra ? (extra.recurring ? 1 : r.int(1, 2)) : r.int(profile.parts[0], profile.parts[1]);
  const place = { city: market.city, cityId: market.cityId, venue };
  const abroad = CITIES.get(market.cityId)?.countryId !== 'us';
  const used = new Set<string>();
  const parts: ProjectTemplate[] = [];
  for (let i = 0; i < count; i += 1) {
    const pr = sim.rng('pro.slate', key, market.id, kind, n, extra ? `s${extra.season}` : '', i);
    const forWhom: PartFor = pr.weighted(['actor', 'actress', 'either'] as const, (x) => (x === 'either' ? 1 : 2));
    let given = pr.pick(GIVEN[forWhom]);
    for (let k = 0; used.has(given) && k < 8; k += 1) given = pr.pick(GIVEN[forWhom]);
    used.add(given);
    const name = pr.chance(0.5) ? `${given} ${pr.pick(SURNAMES)}` : given;
    const sizes = Object.entries(profile.sizes) as [RoleSize, number][];
    const size = extra?.recurring ? 'co-star' : pr.weighted(sizes, ([, w]) => w)[0];
    const words = BREAKDOWN[breakdownFamily(kind, families)];
    const about = `${pr.pick(words.who)} ${pr.pick(words.what)}.`;
    const lo = pr.int(18, 52);
    const ages: readonly [number, number] = [lo, lo + pr.int(8, 14)];
    const techniques: Partial<Record<Skill, number>> = { ...profile.techniques };
    for (const f of families) for (const [s, w] of Object.entries(FAMILY_SKILLS[f] ?? {}) as [Skill, number][]) techniques[s] = Math.max(techniques[s] ?? 0, w);
    const sched: ProjectTemplate['schedule'] = extra?.recurring ? { kind: 'episodes', guaranteed: 2, expected: pr.int(4, 6) } : schedule;
    parts.push({
      id: `${id}.${i}`, kind, format: profile.format, fictional: true,
      project: title, company, casting, medium: profile.medium, genres,
      place,
      role: { part: name, size, for: forWhom, about, families: families.length ? families : ['drama'], techniques, stakes: profile.stakes },
      union: profile.union, contract: profile.contract,
      requirements: { ages, sends: profile.sends, ...(profile.access.open === 'equity-members' ? { membersOnly: 'equity' as const } : {}) },
      stages: { audition: profile.audition, callback: pr.chance(profile.callback) },
      schedule: sched,
      access: profile.access, pay: profile.pay,
      leadDays: lead,
      trip: { ...(abroad ? { supporter: `${title} Productions ${CITIES.get(market.cityId)?.countryId === 'au' ? 'Pty Ltd' : 'Ltd'}` } : {}), hotel: AWAY_TRIP.hotel, pays: 'production' as const, words: AWAY_TRIP.words },
      ...(extra ? { series: extra.series.id } : {}),
      slate: { version: SLATE_VERSION, production: id, week: key, market: market.id, fate: extra ? { kind: 'made' } : fate },
    });
  }
  return { id, market, kind, title, company, casting, parts };
}

/** The productions the slate made for a week: every market's one-off work (series' seasons are cast by `seriesParts`). */
const weekCache = new WeakMap<SaveUniverse, Map<string, Production[]>>();
export function productionsOf(sim: Simulation, week: Instant): Production[] {
  const monday = weekOf(week);
  const key = dateKey(monday, NY);
  let cache = weekCache.get(sim.universe);
  if (!cache) { cache = new Map(); weekCache.set(sim.universe, cache); }
  const hit = cache.get(key);
  if (hit) return hit;
  const tag = slateTag(sim);
  const month = zonedParts(monday, NY).month - 1;
  const out: Production[] = [];
  for (const market of MARKETS) {
    for (const [kind, rate] of Object.entries(market.kinds) as [ProjectKind, number][]) {
      const profile = KIND_PROFILES[kind];
      if (!profile || isSeriesKind(kind)) continue;
      const draw = sim.rng('pro.slate', key, market.id, kind, 'count');
      const count = countOf(() => draw.next(), rate * SEASON[profile.medium][month]!);
      for (let n = 0; n < count; n += 1) out.push(makeProduction(sim, tag, monday, market, kind, n, profile));
    }
  }
  cache.set(key, out);
  return out;
}

/**
 * The series the slate started in a year, each premiering in a season beginning that year: a series the game invents, one
 * season ordered, the network deciding each May after (`systems/series.ts`), at the kind's chances.
 */
const yearCache = new WeakMap<SaveUniverse, Map<number, SeriesTemplate[]>>();
export function seriesOfYear(sim: Simulation, year: number): SeriesTemplate[] {
  let cache = yearCache.get(sim.universe);
  if (!cache) { cache = new Map(); yearCache.set(sim.universe, cache); }
  const hit = cache.get(year);
  if (hit) return hit;
  const tag = slateTag(sim);
  const out: SeriesTemplate[] = [];
  for (const market of MARKETS) {
    for (const [kind, rate] of Object.entries(market.kinds) as [ProjectKind, number][]) {
      const profile = KIND_PROFILES[kind];
      if (!profile?.series) continue;
      const draw = sim.rng('pro.slate', `series-${year}`, market.id, kind, 'count');
      const count = countOf(() => draw.next(), rate * SERIES_A_YEAR_PER_WEEKLY);
      for (let n = 0; n < count; n += 1) {
        const r = sim.rng('pro.slate', `series-${year}`, market.id, kind, n);
        const sp = profile.series;
        const title = titleOf(r);
        const company = companyOf(r, 'television');
        // A season from mid-July to May, as the network's season runs, or, for a serialized series, from February to August.
        const serialized = kind === 'serialized-drama' || kind === 'serialized-comedy';
        out.push({
          id: `g${SLATE_VERSION}.${tag}.${year}.${market.id}.${kind}.${n}`, title, company, fictional: true, program: sp.program,
          firstSeason: year, orderedThrough: year, episodes: sp.episodes, everyDays: sp.everyDays, daysEach: sp.daysEach,
          season: serialized ? { from: [2, 1], to: [8, 31] } : { from: [7, 15], to: [5, 31] },
          decide: serialized ? { month: 1, day: 10, hour: 12 } : { month: 5, day: 15, hour: 12 },
          chance: { renew: sp.renew, revive: sp.revive, reviveAfter: 2 },
          words: `${title} and ${company} are the game’s inventions, and so is each season: one was ordered, and the network says each year whether there’s another.`,
        });
      }
    }
  }
  addSeries(out);
  cache.set(year, out);
  return out;
}

/** Which kind and market a slate series is, from its id. */
function seriesKey(s: SeriesTemplate): { market: Market; kind: ProjectKind; n: number } | undefined {
  const m = /^g\d+\.[^.]+\.(\d{4})\.([^.]+)\.([^.]+)\.(\d+)$/.exec(s.id);
  const market = m ? MARKETS.find((x) => x.id === m[2]) : undefined;
  return m && market ? { market, kind: m[3] as ProjectKind, n: Number(m[4]) } : undefined;
}

/**
 * A series' parts for a season: one or two new characters each season, and in its first a recurring part the network's
 * option can carry on. Each season's characters are its own, so a later season casts new people rather than the same
 * names again.
 */
export function seriesParts(sim: Simulation, s: SeriesTemplate, seasonYear: number): ProjectTemplate[] {
  const key = seriesKey(s);
  const profile = key ? KIND_PROFILES[key.kind] : undefined;
  if (!key || !profile) return [];
  const week = instantFromZoned({ year: seasonYear, month: s.season.from[0], day: s.season.from[1], hour: 9, minute: 0 }, NY);
  const season = seasonYear - s.firstSeason + 1;
  const guests = makeProduction(sim, slateTag(sim), week, key.market, key.kind, key.n, profile, { series: s, season, recurring: false }).parts;
  const recurring = season === 1 ? makeProduction(sim, slateTag(sim), week, key.market, key.kind, key.n, profile, { series: s, season: 0, recurring: true }).parts : [];
  return [...guests, ...recurring].map((t) => ({ ...t, leadDays: undefined }));
}

/**
 * The parts the slate offers for a Monday's posting: each one-off production's parts in the week it's cast, and the parts of
 * the series made in the last six years and the next, each posted only while a season of it is being made (`seriesPosts`,
 * in the work loop).
 */
export function slatePartsAt(sim: Simulation, at: Instant): ProjectTemplate[] {
  const parts = productionsOf(sim, at).flatMap((p) => p.parts);
  const year = zonedParts(at, NY).year;
  // A series' part is cast for the season its days fall in: the days come about five weeks after the posting.
  const workAt = at + 35 * MS_DAY;
  for (let y = year - 6; y <= year + 1; y += 1) {
    for (const s of seriesOfYear(sim, y)) {
      const season = seasonYearAt(s, workAt);
      if (season !== undefined && season >= s.firstSeason) parts.push(...seriesParts(sim, s, season));
    }
  }
  // Known to the session by id, so the loop can read each one's dates before it's posted (`datesOf`).
  addProjects(parts);
  return parts;
}

/**
 * Keeps a slate part in the save as it was posted, and its series: what the actor met, read the same in any later build. A
 * fixed part, or one already kept, is left alone.
 */
export function keepProject(person: Person, t: ProjectTemplate, series?: SeriesTemplate): void {
  if (!t.slate || !person.pro) return;
  const kept = (person.pro.projects ??= {});
  if (!kept[t.id]) kept[t.id] = t;
  addProjects([t]);
  if (series && t.series === series.id) {
    const ks = (person.pro.series ??= {});
    if (!ks[series.id]) ks[series.id] = series;
  }
}

/** A save's own copies of the slate's parts and series, put back first when it's opened or made. */
export function restoreSlate(universe: SaveUniverse): void {
  for (const p of Object.values(universe.people)) {
    if (p.pro?.series) addSeries(Object.values(p.pro.series));
    if (p.pro?.projects) addProjects(Object.values(p.pro.projects));
  }
}

/**
 * A pushed part offered again for its new dates: the same part, its days the given weeks later, kept as its own part so
 * the old posting and the new each read as they were. Its fate is made.
 */
export function pushedPart(t: ProjectTemplate, weeks: number): ProjectTemplate {
  return { ...t, id: `${t.id}.p`, leadDays: (t.leadDays ?? 35) + weeks * 7, slate: { ...t.slate!, fate: { kind: 'made' }, pushedFrom: t.id } };
}
