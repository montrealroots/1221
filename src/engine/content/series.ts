/**
 * SLATE — a television series the game invents, its seasons and its episodes (from 2026-10-24, the owner's brief 25,
 * Parts 7 and 13; `docs/verification/career-world-2026-10-23/criteria.md`, Module 4, D7 and D8). Reference data, not the
 * save: what the series is and the shape of each season, every figure the game's own. Whether a season is made is decided
 * by the world (`systems/series.ts`), the same on every reload.
 *
 * The Calloway Files was a project with no seasons until this module: a co-star's two shoot days in it were posted any
 * week of any year, for ever. It has seasons now, each shot from mid-July to May, with a hiatus between when none of its
 * work is cast; and a network's word each May on whether there's another.
 *
 * From 2026-10-25 (brief 27, Part 13) two real series too, `REAL_SERIES`: their baseline season is the catalog's, and every
 * season after it is the simulation's, under the same rules. Until then every figure here was the game's own, and the
 * parts drawn from 9-1-1 and Abbott Elementary were posted any week, in no season, with no network's word on either.
 */

import { addDays, instantFromZoned, zonedParts, type Instant } from '../core/time';

export interface SeriesTemplate {
  id: string;
  title: string;
  company: string;
  /**
   * The game's invention, or a real series the simulation continues after its verified baseline (`real`). Every series
   * was the game's invention until 2026-10-25 (brief 27, Part 13), when 9-1-1 and Abbott Elementary joined `REAL_SERIES`.
   */
  fictional: boolean;
  /**
   * A real series (from 2026-10-25, the owner's brief 27, Part 13: "Use examples such as 9-1-1 and Slow Horses only with
   * verified starting facts. Generated future offers, characters, renewals, and cancellations must belong explicitly to
   * the simulation"): the catalog's production (`content/catalog.ts`), the season its pages had on the air, by the year
   * it began and its number where a page gives one, and the source. Every season after the baseline is the simulation's,
   * said so wherever it's read; the baseline season and those before it are never simulated.
   */
  real?: { production: string; baseline: { year: number; season?: number }; source: string };
  /** How long an episode runs, which sets the rerun's ceiling (N14 §18(b)(1)b). */
  program: 'hour' | 'half-hour';
  /** The year its first season began. */
  firstSeason: number;
  /** The seasons ordered ahead, through the one beginning that year: no word on renewal is needed until the next. */
  orderedThrough: number;
  /** A season's episodes, the first shot from the first Monday of its window, one every `everyDays`, `daysEach` days each. */
  episodes: number;
  everyDays: number;
  daysEach: number;
  /** A season shoots from its first day to its last, by month and day; the weeks between are the hiatus. */
  season: { from: readonly [number, number]; to: readonly [number, number] };
  /** When the network says whether there's another season, each year after the order runs out. */
  decide: { month: number; day: number; hour: number };
  /**
   * The network's chance of another season, before the last season's audience and reviews move it (`renewChance`,
   * `systems/series.ts`, from 2026-10-25, brief 27); and, once canceled, of reviving it, from `reviveAfter` years on.
   */
  chance: { renew: number; revive: number; reviveAfter: number };
  /**
   * Where it's seen, which sets how its audience is measured (`seasonAudience`): broadcast, in viewers; streaming, in hours
   * viewed. A series kept by a save from before 2026-10-25 has none, and reads streaming where its network decides in
   * January, as a serialized series' does, and broadcast otherwise.
   */
  outlet?: 'broadcast' | 'streaming';
  /** In the player's words, said wherever its seasons are. */
  words: string;
}

const NY = 'America/New_York';

/**
 * The one series. ASSUMPTION, every figure: the game's story has Bright Harbor Television's drama in its eighth season in
 * 2026, ordered through its eleventh, so the network's first word on another season is in May 2030; thirteen hour-long
 * episodes a season, every three weeks from mid-July, two shoot days each; and a 65% chance of each season after, a
 * canceled series a 25% chance a year of coming back from its second year off.
 */
export const SERIES: readonly SeriesTemplate[] = [
  {
    id: 'calloway-files', title: 'The Calloway Files', company: 'Bright Harbor Television', fictional: true,
    program: 'hour', firstSeason: 2019, orderedThrough: 2029,
    episodes: 13, everyDays: 21, daysEach: 2,
    season: { from: [7, 15], to: [5, 31] },
    decide: { month: 5, day: 15, hour: 12 },
    chance: { renew: 0.65, revive: 0.25, reviveAfter: 2 }, outlet: 'broadcast',
    words: 'The Calloway Files and its network are the game’s inventions, and so is each season: the network ordered it through the season beginning in 2029, and from May 2030 it says each May whether there’s another.',
  },
];

/**
 * Real series the simulation continues (from 2026-10-25, the owner's brief 27, Part 13 and loop 40), the two whose
 * catalog productions the game draws a guest part from (`content/careerwork.ts`'s `drawn`). Read from the catalog: the
 * title, the company the drawn part names, the outlet (each airs on ABC, S81 and S109) and the baseline season, 9-1-1's
 * tenth premiering October 15, 2026 (S80), and the Abbott Elementary season on the air when its page was read (S109),
 * whose number no page gives. ASSUMPTION every other figure, the game's as `SERIES`' are: when a season shoots, its
 * thirteen episodes and their days, when the network's word comes, and its chances. The baseline season is ordered, so
 * the simulation's first word is the next May's, on a season the real network hasn't announced in anything the game read.
 * Slow Horses and Severance stay the catalog's alone: no part in the game is drawn from either, so nothing would read
 * their simulated seasons, and Severance's latest season in the pages read is 2025's.
 */
export const REAL_SERIES: readonly SeriesTemplate[] = [
  {
    id: 'real-nine-one-one', title: '9-1-1', company: '20th Television', fictional: false,
    program: 'hour', firstSeason: 2026, orderedThrough: 2026,
    episodes: 13, everyDays: 21, daysEach: 2,
    season: { from: [7, 15], to: [5, 31] },
    decide: { month: 5, day: 15, hour: 12 },
    chance: { renew: 0.65, revive: 0.15, reviveAfter: 2 }, outlet: 'broadcast',
    real: { production: 'nine-one-one', baseline: { year: 2026, season: 10 }, source: 'S80' },
    words: '9-1-1 is a real series. Its tenth season premiered on October 15, 2026, as its official pages said when the game read them. Every season after the tenth is the game’s own continuation: whether there’s another, when it shoots, its episodes and its audience are simulated, never an announcement.',
  },
  {
    id: 'real-abbott-elementary', title: 'Abbott Elementary', company: 'Warner Bros. Television and 20th Television', fictional: false,
    program: 'half-hour', firstSeason: 2026, orderedThrough: 2026,
    episodes: 13, everyDays: 21, daysEach: 2,
    season: { from: [7, 15], to: [5, 31] },
    decide: { month: 5, day: 15, hour: 12 },
    chance: { renew: 0.65, revive: 0.15, reviveAfter: 2 }, outlet: 'broadcast',
    real: { production: 'abbott-elementary', baseline: { year: 2026 }, source: 'S109' },
    words: 'Abbott Elementary is a real series, on the air on ABC when the game read its official pages, which don’t give its season’s number. Every season after the one on the air then is the game’s own continuation: whether there’s another, when it shoots, its episodes and its audience are simulated, never an announcement.',
  },
];

/**
 * The slate's series this session knows (from 2026-10-24, brief 27, `systems/slate.ts`), a save's own copy first: each a
 * series the game invents as `SERIES`' are, its seasons decided by the same rules (`systems/series.ts`).
 */
const SLATE_SERIES = new Map<string, SeriesTemplate>();
export function addSeries(list: readonly SeriesTemplate[]): void {
  for (const s of list) if (!SLATE_SERIES.has(s.id) && !SERIES.some((x) => x.id === s.id) && !REAL_SERIES.some((x) => x.id === s.id)) SLATE_SERIES.set(s.id, s);
}

export const seriesById = (id: string): SeriesTemplate | undefined => SERIES.find((s) => s.id === id) ?? REAL_SERIES.find((s) => s.id === id) ?? SLATE_SERIES.get(id);

/** A real series' first simulated season: the one after its baseline. A series the game invents is simulated from its first. */
export const simulatedFrom = (s: SeriesTemplate): number => (s.real ? s.real.baseline.year + 1 : s.firstSeason);

/** The first day of the season beginning in `year`, and its last, at the start and end of those days in New York. */
export function seasonWindow(s: SeriesTemplate, year: number): { from: Instant; to: Instant } {
  return {
    from: instantFromZoned({ year, month: s.season.from[0], day: s.season.from[1], hour: 0, minute: 0 }, NY),
    to: instantFromZoned({ year: year + 1, month: s.season.to[0], day: s.season.to[1] + 1, hour: 0, minute: 0 }, NY),
  };
}

/** The season whose window holds a moment, by the year it began, or none in the hiatus. */
export function seasonYearAt(s: SeriesTemplate, at: Instant): number | undefined {
  const y = zonedParts(at, NY).year;
  for (const year of [y, y - 1]) { const w = seasonWindow(s, year); if (at >= w.from && at < w.to) return year; }
  return undefined;
}

/** When the network decides on the season beginning in `year`: May 15 of that year, at noon. */
export const decisionAt = (s: SeriesTemplate, year: number): Instant => instantFromZoned({ year, month: s.decide.month, day: s.decide.day, hour: s.decide.hour, minute: 0 }, NY);

/** The first Monday of a season, from its first day. */
function firstMonday(s: SeriesTemplate, year: number): Instant {
  let d = instantFromZoned({ year, month: s.season.from[0], day: s.season.from[1], hour: 7, minute: 0 }, NY);
  while (zonedParts(d, NY).weekday !== 1) d = addDays(d, 1, NY);
  return d;
}

/** Episode `n`'s shoot days in the season beginning in `year`: a Monday every `everyDays` from the first, and the days after it. */
export function episodeDays(s: SeriesTemplate, year: number, n: number): Instant[] {
  const first = addDays(firstMonday(s, year), (n - 1) * s.everyDays, NY);
  return Array.from({ length: s.daysEach }, (_, k) => addDays(first, k, NY));
}

/** The season's episodes whose first day is at or after a moment, in order. */
export function episodesFrom(s: SeriesTemplate, year: number, at: Instant): number[] {
  const out: number[] = [];
  for (let n = 1; n <= s.episodes; n += 1) if (episodeDays(s, year, n)[0]! >= at) out.push(n);
  return out;
}
