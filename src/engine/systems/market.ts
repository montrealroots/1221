/**
 * SLATE — a release's and a season's fortunes, and a finished production's other ways out (from 2026-10-25, the owner's
 * brief 27, Part 12 and the supplement's loops 33, 35 and 36; the series, releases and market cluster).
 *
 * **The player's part matters, and never decides alone** (Part 12: "Commercial success must reflect project-level
 * circumstances. A strong player performance must matter without guaranteeing a hit."; loop 35: "Project success depends
 * on multiple project-level factors, including but not limited to the player's performance"). Until this module a film's
 * run read its kind and a draw (`systems/charts.ts`), and a season's audience its series and a draw (`systems/series.ts`);
 * how the player's part was judged moved neither. Now each reads the player's part as a term: the part's size times its
 * band (`FORTUNE`), so a lead's exceptional work counts four times a co-star's and unready work counts against. A film's
 * opening is moved by that term and by the production's own quality (`qualityOf`, its own draw, the script, the director
 * and the money the game doesn't model one by one), each a log-multiplier well inside the spread of the kind's drawn
 * range; a season's audience by the term of the player's judged days in it. The critics' and the audience's response to a
 * film read the same two, and the audience's moves each week's hold, and decides whether a limited release widens.
 *
 * **A season reads only what was posted before the network's word on the next** (`markWork`, `ProRecord.seasonMarks`).
 * The network's decisions are worked out from the seed each time they're asked (`decisionsTo`), from the first season
 * on, so a season's audience must read the same for good: each judged day of series work is posted once, as it's judged,
 * and kept whole; a season reads its postings made before the word that follows it. A save from before has none, so its
 * past seasons, and every word already given on them, read as they did.
 *
 * **A finished production's other ways out** (loop 33's "Different distributor. Limited release."; Part 12's "Limited and
 * wider releases" and "Territory-specific releases"). `RELEASE_FATE` (`systems/projobs.ts`) drew late, streaming and
 * shelved; the rest of its on-time share now splits off a limited release (a few weeks in a few cinemas, widening only
 * if the audience takes to it), a release by a different distributor (the company that releases it changes and its date
 * moves, said when the first date comes), and a release in some territories first (abroad first, at home some weeks on).
 * Each changes what the game's chart reads (`runOf`), what the credit says, and what the awards read: a distributor's
 * later date is the premiere the Emmys and the Actor Awards read (`premiereOf`), and a film abroad first is eligible for
 * the Actor Awards by its run at home, in Los Angeles County, the first of the rules' six major markets (b25-S48), or not
 * at all where its first showing and that run fall in different years (`splitYearsWhy`).
 *
 * Every figure here is the game's ASSUMPTION, said where it's set; no published figure is used or claimed.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { addDays, formatDate, zonedParts, type Instant } from '../core/time';
import type { Rng } from '../core/rng';
import { countWords } from '../core/text';
import { CITIES } from '../content/geography';
import type { ProjectTemplate, RoleSize } from '../content/careerwork';
import { decisionAt, seasonYearAt, seriesById, type SeriesTemplate } from '../content/series';
import { COMPANY_WORDS } from '../content/slate';
import { RELEASED } from '../content/workflows';
import type { Band } from './coursework';
import type { Engagement, ProCredit } from './pro';
import { simulateRun, type SimRun } from './charts';
import { formatOf } from './workflow';

const NY = 'America/New_York';
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

/**
 * What the player's part weighs, and how far it and the production's quality move a release's and a season's fortunes.
 * ASSUMPTION, every figure, the game's own:
 * - **size**: a lead's part counts in full, a supporting part six tenths, a featured part four, a co-star's a quarter;
 * - **band**: exceptional work counts one, strong a half, working nothing, unready against at one;
 * - **film**: the opening's natural-log lift is `gross` times the term plus `quality` times the production's quality, so a
 *   lead's exceptional work raises it by about two fifths, against a kind's range spanning ten times and more; each week's
 *   hold moves by up to `hold` either way with the audience's response;
 * - **response**: critics' and the audience's scores of 100, about their middle, the production's quality moving each by
 *   up to its `spread` and the part by up to its `part`, each with its own draw of up to `noise`;
 * - **widen**: a limited release widens after its weeks where the audience scores it at least this;
 * - **season**: a season's audience moves by `season` (a natural log) times the term, and its critics by `seasonCritics`.
 */
export const FORTUNE = {
  size: { lead: 1, supporting: 0.6, featured: 0.4, 'co-star': 0.25 } as Readonly<Record<RoleSize, number>>,
  band: { exceptional: 1, strong: 0.5, working: 0, unready: -1 } as Readonly<Record<Band, number>>,
  gross: 0.35, quality: 0.3, hold: 0.06,
  response: { middle: 62, spread: 20, part: 12, noise: 6 },
  widen: 70,
  season: 0.2, seasonCritics: 8,
} as const;

/** A part's term: its size's weight times its band's, nothing for a part never judged. */
export const termOf = (size: RoleSize, band: Band | undefined): number => (band ? FORTUNE.size[size] * FORTUNE.band[band] : 0);

/** The production a part is in, as a key: the slate's production, or the fixed part's project. */
export const productionKey = (t: Pick<ProjectTemplate, 'slate' | 'project'>): string => t.slate?.production ?? t.project;

/** A production's own quality, from -1 to 1, by its own draw (decider `pro.quality`): what the game doesn't model one by one. */
export const qualityOf = (sim: Simulation, t: Pick<ProjectTemplate, 'slate' | 'project'>): number => sim.rng('pro.quality', productionKey(t)).next() * 2 - 1;

/** A film's critics' and audience's response, the game's simulation: the production's quality and the player's part, each with a draw. */
export function responseOf(sim: Simulation, t: Pick<ProjectTemplate, 'slate' | 'project'>, term: number, quality = qualityOf(sim, t)): { critics: number; audience: number } {
  const r = FORTUNE.response;
  const draw = sim.rng('pro.quality', productionKey(t), 'response');
  const score = (w: number) => Math.round(clamp(r.middle + r.spread * quality + r.part * term + (draw.next() * 2 - 1) * r.noise * w, 0, 100));
  return { critics: score(1), audience: score(1.5) };
}

/**
 * A released film's run in the game's own chart (`simulateRun`), with what it's made with now: the production's quality
 * and the player's part lifting its opening, the audience's response moving its hold, a limited release's weeks and
 * whether it widens, and a release abroad first coming home its days later.
 */
export function runOf(sim: Simulation, t: ProjectTemplate, c: ProCredit, releasedAt: Instant): SimRun | undefined {
  const term = termOf(t.role.size, c.band);
  const quality = qualityOf(sim, t);
  const response = responseOf(sim, t, term, quality);
  const fate = c.release;
  return simulateRun(sim, t.id, t.kind, releasedAt, {
    lift: FORTUNE.gross * term + FORTUNE.quality * quality,
    hold: FORTUNE.hold * clamp((response.audience - FORTUNE.response.middle) / 38, -1, 1),
    response,
    ...(fate?.kind === 'limited' ? { limited: { weeks: fate.weeks ?? 3, widens: response.audience >= FORTUNE.widen } } : {}),
    ...(fate?.kind === 'territory' ? { domesticAfter: fate.days ?? 28 } : {}),
  });
}

// ---------------------------------------------------------------------------------------------------------------------
// A season: the player's judged days in it, posted as they're judged
// ---------------------------------------------------------------------------------------------------------------------

/**
 * A judged day of series work posted (from the work day, `systems/projobs.ts`): its season, when, and its term. Work in
 * no series, and a day not judged, post nothing.
 */
export function markWork(person: Person, e: Engagement, t: ProjectTemplate, entry: { at: Instant; band?: Band }): void {
  const s = t.series ? seriesById(t.series) : undefined;
  if (!s || !entry.band || !person.pro) return;
  const y = e.contract?.series?.year ?? seasonYearAt(s, entry.at);
  if (y === undefined) return;
  ((person.pro.seasonMarks ??= {})[s.id] ??= []).push({ y, at: entry.at, v: Math.round(termOf(t.role.size, entry.band) * 1000) / 1000 });
}

/** The player's term in a season: the mean of its postings made before the network's word on the next, nothing without. */
export function seasonTerm(sim: Simulation, s: SeriesTemplate, year: number): number {
  const marks = sim.universe.people[sim.universe.playerId]?.pro?.seasonMarks?.[s.id] ?? [];
  const cut = decisionAt(s, year + 1);
  const these = marks.filter((m) => m.y === year && m.at < cut);
  return these.length ? these.reduce((n, m) => n + m.v, 0) / these.length : 0;
}

// ---------------------------------------------------------------------------------------------------------------------
// A finished production's other ways out (`RELEASE_FATE`)
// ---------------------------------------------------------------------------------------------------------------------

/**
 * ASSUMPTION, the game's: a limited release's weeks in a few cinemas, two to four; a different distributor's date, one to
 * five months later; a release abroad first, two to eight weeks before its domestic opening.
 */
export const ROUTES = { limitedWeeks: [2, 4], distributorDays: [30, 150], territoryWeeks: [2, 8] } as const;

/** Where a release in some territories first opens: the country the production shoots in, where that isn't the US. */
export function firstTerritories(t: Pick<ProjectTemplate, 'place'>): string {
  const country = CITIES.get(t.place.cityId)?.countryId;
  return country === 'uk' ? 'the United Kingdom' : country === 'au' ? 'Australia' : 'other countries';
}

/**
 * The rest of a slate production's way out, past the late, streaming and shelved shares (`releaseFate`): `u` is how far
 * into the on-time share its draw fell, read on against the routes' shares in turn, and the route's own figures come
 * from the same stream after it. A series' part is never taken over by another distributor alone, and only a film for
 * cinemas has a limited release or one abroad first. Nothing where the draw falls past every route: on time.
 */
export function routeOf(r: Rng, u: number, odds: { limited?: number; distributor?: number; territory?: number }, t: ProjectTemplate): NonNullable<ProCredit['release']> | undefined {
  const after = formatOf(t).after;
  const theatrical = after === 'theatrical';
  const limited = theatrical ? odds.limited ?? 0 : 0;
  const distributor = t.series ? 0 : odds.distributor ?? 0;
  const territory = theatrical ? odds.territory ?? 0 : 0;
  const between = (lo: number, hi: number) => lo + Math.floor(r.next() * (hi - lo + 1));
  if (u < limited) return { kind: 'limited', weeks: between(ROUTES.limitedWeeks[0], ROUTES.limitedWeeks[1]) };
  if (u < limited + distributor) {
    const days = between(ROUTES.distributorDays[0], ROUTES.distributorDays[1]);
    const kinds = theatrical ? ['Releasing', 'Pictures', 'Films'] : ['Streaming', 'Television'];
    return { kind: 'distributor', days, distributor: `${r.pick(COMPANY_WORDS.first)} ${r.pick(COMPANY_WORDS.second)} ${r.pick(kinds)}` };
  }
  if (u < limited + distributor + territory) return { kind: 'territory', days: 7 * between(ROUTES.territoryWeeks[0], ROUTES.territoryWeeks[1]), first: firstTerritories(t) };
  return undefined;
}

/** A distributor's change said when the first date comes, as a hold-back is: who took it over, and the new date. */
export function takenOverWords(c: ProCredit, at: Instant): string {
  return `${c.project}’s first distributor gave it up, and ${c.release?.distributor ?? 'another distributor'}, a distributor invented for the game, took it over and moved its release to ${formatDate(at, NY)}. ${c.role} stays on your credits as shot until then, and its footage can go on a reel once it’s out.`;
}

/** How a release by a route is said when it comes out, after the title: what `RELEASED` says for the rest. */
export function releasedWords(t: ProjectTemplate, c: ProCredit, at: Instant): string | undefined {
  const fate = c.release;
  if (fate?.kind === 'limited') return 'opened in a limited release, in a few cinemas in Los Angeles and New York';
  if (fate?.kind === 'territory') return `opened in ${fate.first ?? 'other countries'} first, and opens in the US on ${formatDate(homeOpening(at, c)!, NY)}`;
  if (fate?.kind === 'distributor') return `${RELEASED[formatOf(t).after]}, released by ${fate.distributor}, the distributor that took it over`;
  return undefined;
}

/** A release's way out in a phrase, for the credit and Productions And People: nothing for one on time. */
export function routeWords(c: ProCredit): string | undefined {
  const fate = c.release;
  const run = c.run;
  const weeks = (n: number) => `${countWords(n)} ${n === 1 ? 'week' : 'weeks'}`;
  if (fate?.kind === 'limited') return run?.limited ? (run.limited.widened ? `A limited release for ${weeks(run.limited.weeks)}, then wide.` : 'A limited release that never widened.') : 'A limited release, a few weeks in a few cinemas before it can widen.';
  if (fate?.kind === 'territory') return `Released in ${fate.first ?? 'other countries'} first, and in the US ${weeks(Math.max(1, Math.round((fate.days ?? 7) / 7)))} later.`;
  if (fate?.kind === 'distributor') return `Released by ${fate.distributor}, a distributor invented for the game, which took it over from the production’s first and moved its date.`;
  return undefined;
}

/**
 * A credit's opening at home, in the US, where its release came abroad first: the premiere and then the days after it.
 * The Actor Awards read it as the motion picture's qualifying run (b25-S48: "in at least one of the major markets", Los
 * Angeles County first among them). Any other credit's is its premiere.
 */
export function homeOpening(premiere: Instant | undefined, c: ProCredit): Instant | undefined {
  if (premiere === undefined || c.release?.kind !== 'territory') return premiere;
  // Out, its run says the day; before, the days its distributor set.
  return c.run?.before ? c.run.opening : addDays(premiere, c.release.days ?? 0, NY);
}

/**
 * Why a film released abroad first can't be placed in an Actor Awards year: its first showing and its run at home fall in
 * different calendar years, and the rules the game read ask for both in the year (b25-S48: "first exhibited ... during
 * the 2026 calendar year" and a run "commencing in calendar year 2026"), so the game doesn't decide which. Nothing where
 * both fall in one year, or where the release wasn't abroad first.
 */
export function splitYearsWhy(premiere: Instant | undefined, c: ProCredit): string | undefined {
  if (c.release?.kind !== 'territory' || premiere === undefined) return undefined;
  const first = zonedParts(premiere, NY).year;
  const home = zonedParts(homeOpening(premiere, c)!, NY).year;
  return first === home ? undefined : `It opened in ${c.release.first ?? 'other countries'} in ${first} and in the US in ${home}. The rules ask for a first showing and a qualifying run in the same year, so the game doesn’t place it in either.`;
}
