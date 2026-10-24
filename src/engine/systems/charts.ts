/**
 * SLATE — the charts (from 2026-10-24, the owner's brief 25, Parts 10 and 13; `docs/verification/career-world-2026-10-23/
 * criteria.md`, Module 6, X1 to X5). Two kinds, never mixed: the reference charts the providers published, imported as
 * dated snapshots (`content/charts.ts`), and a chart of the game's own world for the player's released films, the game's
 * simulation and said so.
 *
 * An import is checked before it's kept: a week already held with the same figures is nothing new; the same week with a
 * figure changed is a revision, the earlier one kept; one whose unit, ranks or week aren't the chart's is refused, and the
 * last good week stays. Movement is read only between two consecutive weeks of the same chart; a title the earlier week
 * didn't have is new to the game's record of that chart, which isn't a new release, or back where an older week had it.
 *
 * The game's own chart: a film's gross is drawn by the film (decider `charts.gross`), from its budget's range, falling week
 * by week, and ranked among a field of the game's own unnamed releases. It isn't the actor's pay, a week of it isn't a
 * payday, and how well the player's part was judged doesn't move it: a film's fortunes are the production's.
 */

import type { Simulation } from '../core/simulation';
import { MS_DAY, addDays, instantFromZoned, zonedParts, type Instant } from '../core/time';
import { formatMoney } from '../core/money';
import { CHARTS, SNAPSHOTS, type ChartEntry, type ChartId, type ChartSnapshot, type ChartUnit } from '../content/charts';
import type { ProjectKind } from '../content/careerwork';

const NY = 'America/New_York';

// ---------------------------------------------------------------------------------------------------------------------
// Importing
// ---------------------------------------------------------------------------------------------------------------------

/** A week of a chart as held: its revisions, oldest first; the last is the one shown. */
export interface HeldWeek { chart: ChartId; from: string; to: string; revisions: ChartSnapshot[] }

export interface ChartStore { weeks: Map<string, HeldWeek>; refused: { snapshot: ChartSnapshot; why: string }[] }

export type ImportResult = { kind: 'added' | 'revision' | 'duplicate' } | { kind: 'refused'; why: string };

const weekKey = (chart: ChartId, from: string) => `${chart}:${from}`;
const dayOf = (iso: string) => new Date(`${iso}T12:00:00Z`);

/** Why a snapshot can't be kept, or nothing: its chart, its week and its ranks, each as the chart has them. */
export function snapshotProblem(s: ChartSnapshot): string | undefined {
  const spec = CHARTS[s.chart];
  if (!spec) return `There’s no chart ${String(s.chart)}.`;
  const from = dayOf(s.from), to = dayOf(s.to);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 'Its week isn’t a pair of dates.';
  if (Math.round((to.getTime() - from.getTime()) / MS_DAY) !== 6) return 'Its week isn’t seven days.';
  if (from.getUTCDay() !== spec.startsOn) return `Its week doesn’t start on the day ${spec.name}’s weeks do.`;
  if (!s.entries.length) return 'It holds no ranks.';
  const ranks = s.entries.map((e) => e.rank);
  if (new Set(ranks).size !== ranks.length) return 'A rank is in it twice.';
  if (ranks.some((r) => !Number.isInteger(r) || r < 1 || r > 10)) return 'A rank isn’t one of the chart’s ten.';
  if (!s.partial && ranks.length !== 10) return 'It holds fewer than ten ranks without saying it’s partial.';
  if (s.entries.some((e) => e.value !== null && (typeof e.value !== 'number' || !Number.isFinite(e.value) || e.value < 0))) return `A figure isn’t a count of ${unitNoun(spec.unit)}.`;
  if (s.entries.some((e) => !e.titleId || !e.name)) return 'A title has no name or no id.';
  return undefined;
}

const sameFigures = (a: readonly ChartEntry[], b: readonly ChartEntry[]) =>
  a.length === b.length && a.every((e, i) => e.rank === b[i]!.rank && e.titleId === b[i]!.titleId && e.value === b[i]!.value);

/** Imports a snapshot into a store: added, a revision of a week held, nothing new, or refused with why. */
export function importSnapshot(store: ChartStore, s: ChartSnapshot): ImportResult {
  const why = snapshotProblem(s);
  if (why) { store.refused.push({ snapshot: s, why }); return { kind: 'refused', why }; }
  const key = weekKey(s.chart, s.from);
  const held = store.weeks.get(key);
  if (!held) { store.weeks.set(key, { chart: s.chart, from: s.from, to: s.to, revisions: [s] }); return { kind: 'added' }; }
  if (held.revisions.some((r) => sameFigures(r.entries, s.entries))) return { kind: 'duplicate' };
  held.revisions.push(s);
  return { kind: 'revision' };
}

export const emptyStore = (): ChartStore => ({ weeks: new Map(), refused: [] });

/** The reference charts as the game holds them: every snapshot imported in order. */
export const REFERENCE: ChartStore = (() => { const s = emptyStore(); for (const x of SNAPSHOTS) importSnapshot(s, x); return s; })();

/** A chart's weeks held, oldest first. */
export const weeksOf = (store: ChartStore, chart: ChartId): HeldWeek[] =>
  [...store.weeks.values()].filter((w) => w.chart === chart).sort((a, b) => a.from.localeCompare(b.from));

/** A held week's current figures: its last revision. */
export const currentOf = (w: HeldWeek): ChartSnapshot => w.revisions.at(-1)!;

/** When a provider's week ends: the last minute of its last day, in New York. */
export const weekEnd = (to: string): Instant => instantFromZoned({ ...isoParts(to), hour: 23, minute: 59 }, NY);

/** A chart's weeks that have ended by a moment, oldest first: a week the clock hasn't reached the end of isn't shown. */
export const weeksBy = (store: ChartStore, chart: ChartId, at: Instant): HeldWeek[] => weeksOf(store, chart).filter((w) => weekEnd(w.to) <= at);

/** A chart's latest week ended by a moment, and how many whole weeks before it that was: the chart doesn't update itself. */
export function latestOf(store: ChartStore, chart: ChartId, at: Instant): { week: HeldWeek; weeksOld: number } | undefined {
  const week = weeksBy(store, chart, at).at(-1);
  if (!week) return undefined;
  return { week, weeksOld: Math.floor((at - weekEnd(week.to)) / (7 * MS_DAY)) };
}

const isoParts = (iso: string) => { const [year, month, day] = iso.split('-').map(Number) as [number, number, number]; return { year, month, day }; };

// ---------------------------------------------------------------------------------------------------------------------
// Movement, and a title across charts
// ---------------------------------------------------------------------------------------------------------------------

export type Movement =
  | { kind: 'up' | 'down' | 'same'; from: number }
  | { kind: 'new' }
  | { kind: 'back'; last: string }
  | { kind: 'not-comparable' };

/**
 * A title's movement from the chart's week before: only where the game holds that week, seven days earlier, of the same
 * chart. Absent from it and from every earlier week held, it's new to the game's record of the chart; absent from it but
 * in an older one, it's back.
 */
export function movementOf(store: ChartStore, w: HeldWeek, titleId: string): Movement {
  const weeks = weeksOf(store, w.chart);
  const i = weeks.findIndex((x) => x.from === w.from);
  const prev = i > 0 ? weeks[i - 1]! : undefined;
  if (!prev || Math.round((dayOf(w.from).getTime() - dayOf(prev.from).getTime()) / MS_DAY) !== 7) return { kind: 'not-comparable' };
  const now = currentOf(w).entries.find((e) => e.titleId === titleId);
  const before = currentOf(prev).entries.find((e) => e.titleId === titleId);
  if (!now) return { kind: 'not-comparable' };
  if (before) return { kind: before.rank > now.rank ? 'up' : before.rank < now.rank ? 'down' : 'same', from: before.rank };
  const older = weeks.slice(0, i - 1).reverse().find((x) => currentOf(x).entries.some((e) => e.titleId === titleId));
  return older ? { kind: 'back', last: older.to } : { kind: 'new' };
}

/** A title's place in a week: its rank, or outside the published Top 10, never eleventh. */
export const placeIn = (s: ChartSnapshot, titleId: string): number | 'outside' => s.entries.find((e) => e.titleId === titleId)?.rank ?? 'outside';

/** Every figure the game holds for a title, each in its own chart, unit, territory and week: none added to another. */
export function titleAcross(store: ChartStore, titleId: string): { chart: ChartId; from: string; to: string; entry: ChartEntry }[] {
  const out: { chart: ChartId; from: string; to: string; entry: ChartEntry }[] = [];
  for (const w of store.weeks.values()) { const e = currentOf(w).entries.find((x) => x.titleId === titleId); if (e) out.push({ chart: w.chart, from: w.from, to: w.to, entry: e }); }
  return out.sort((a, b) => a.from.localeCompare(b.from) || a.chart.localeCompare(b.chart));
}

// ---------------------------------------------------------------------------------------------------------------------
// Words
// ---------------------------------------------------------------------------------------------------------------------

function unitNoun(u: ChartUnit): string {
  return u === 'usd' ? 'dollars' : u === 'views' ? 'views' : 'millions of minutes';
}

/** Millions as the provider rounded them: Netflix's to the hundred thousand, one decimal, never more. */
const millions = (n: number) => `${(n / 1e6).toFixed(1).replace(/\.0$/, '')} million`;

/** A figure in its chart's own unit, or Not Reported. */
export function figureWords(chart: ChartId, value: number | null): string {
  if (value === null) return 'Not Reported';
  const u = CHARTS[chart].unit;
  if (u === 'usd') return formatMoney(value * 100, 'USD', { cents: false });
  if (u === 'views') return `${millions(value)} views`;
  return `${value.toLocaleString('en-US')} million minutes`;
}

/** A movement in words. */
export function movementWords(m: Movement): string {
  if (m.kind === 'up' || m.kind === 'down') return `${m.kind === 'up' ? 'Up' : 'Down'} from No. ${m.from}`;
  if (m.kind === 'same') return `Held at No. ${m.from}`;
  if (m.kind === 'new') return 'New to this chart in the game’s record';
  if (m.kind === 'back') return `Back in the Top 10, last in the game’s record the week ending ${longDate(m.last)}`;
  return 'No earlier week of this chart in the game’s record';
}

/** A provider's ISO date said in full. */
export function longDate(iso: string): string {
  const { year, month, day } = isoParts(iso);
  return `${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][month - 1]} ${day}, ${year}`;
}

/** A measured week in words. */
export const weekWords = (w: { from: string; to: string }) => `${longDate(w.from)} to ${longDate(w.to)}`;

// ---------------------------------------------------------------------------------------------------------------------
// The game's own chart
// ---------------------------------------------------------------------------------------------------------------------

/**
 * A film's opening week's gross, by its kind's budget, the low and high of a range the draw falls in, log-evenly
 * (ASSUMPTION, the game's: no studio's figures were read for films the game invents). A kind not here isn't released in
 * cinemas.
 */
export const OPENING: Readonly<Partial<Record<ProjectKind, readonly [number, number]>>> = {
  'ultra-low-budget': [40_000, 400_000], 'low-budget': [200_000, 4_000_000], 'overseas-feature': [8_000_000, 60_000_000],
  'action-feature': [8_000_000, 60_000_000], 'capture-feature': [10_000_000, 80_000_000], 'animated-feature': [6_000_000, 50_000_000],
};

/** How a run falls (ASSUMPTION): each week keeps a share of the last, drawn between these; the run ends under 1% of its opening, or after twelve weeks. */
export const RUN = { keepLeast: 0.4, keepMost: 0.7, endBelow: 0.01, weeksMost: 12, fieldSize: 10 } as const;

/** One week of a film in the game's own chart. */
export interface SimWeek { from: Instant; to: Instant; gross: number; rank: number | 'outside' }

/** A released film's run in the game's own chart: the game's simulation, never a published figure. */
export interface SimRun { simulated: true; opening: Instant; weeks: SimWeek[] }

/** The Friday a run opens: the release day, or the Friday after it. */
function fridayFrom(at: Instant): Instant {
  let d = at;
  while (zonedParts(d, NY).weekday !== 5) d = addDays(d, 1, NY);
  const p = zonedParts(d, NY);
  return instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: 0, minute: 0 }, NY);
}

/**
 * A film's run, drawn by the film (decider `charts.gross`, keyed by its project and its release): its opening from its
 * kind's range, each week a share of the last, and its rank each week among the game's own field of unnamed releases,
 * drawn for that week. Undefined for work not released in cinemas.
 */
export function simulateRun(sim: Simulation, projectId: string, kind: ProjectKind, releasedAt: Instant): SimRun | undefined {
  const range = OPENING[kind];
  if (!range) return undefined;
  const rng = sim.rng('charts.gross', projectId, releasedAt);
  const opening = fridayFrom(releasedAt);
  const [lo, hi] = range;
  let gross = Math.round(lo * Math.exp(Math.log(hi / lo) * rng.next()));
  const first = gross;
  const weeks: SimWeek[] = [];
  for (let k = 0; k < RUN.weeksMost && gross >= first * RUN.endBelow; k += 1) {
    const from = addDays(opening, 7 * k, NY);
    weeks.push({ from, to: addDays(from, 7, NY) - 60_000, gross, rank: rankAmong(sim, from, gross) });
    gross = Math.round(gross * (RUN.keepLeast + (RUN.keepMost - RUN.keepLeast) * rng.next()));
  }
  return { simulated: true, opening, weeks };
}

/**
 * Where a week's gross ranks among the game's own field that week: ten unnamed releases, their grosses drawn by the week
 * (decider `charts.gross`), log-evenly from $500,000 to $60,000,000 (ASSUMPTION). Outside the ten, it's outside.
 */
export function rankAmong(sim: Simulation, from: Instant, gross: number): number | 'outside' {
  const rng = sim.rng('charts.gross', 'field', from);
  const field = Array.from({ length: RUN.fieldSize }, () => Math.round(500_000 * Math.exp(Math.log(120) * rng.next())));
  const above = field.filter((g) => g > gross).length;
  return above < RUN.fieldSize ? above + 1 : 'outside';
}

/** A run's weeks the clock has reached: the rest haven't happened yet. */
export const weeksSoFar = (run: SimRun, at: Instant): SimWeek[] => run.weeks.filter((w) => w.to <= at);

/** The best rank a run reached by a moment, or nothing. */
export function peakOf(run: SimRun | undefined, at: Instant): number | undefined {
  const ranks = (run ? weeksSoFar(run, at) : []).map((w) => w.rank).filter((r): r is number => r !== 'outside');
  return ranks.length ? Math.min(...ranks) : undefined;
}
