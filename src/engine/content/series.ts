/**
 * SLATE — a television series the game invents, its seasons and its episodes (from 2026-10-24, the owner's brief 25,
 * Parts 7 and 13; `docs/verification/career-world-2026-10-23/criteria.md`, Module 4, D7 and D8). Reference data, not the
 * save: what the series is and the shape of each season, every figure the game's own. Whether a season is made is decided
 * by the world (`systems/series.ts`), the same on every reload.
 *
 * The Calloway Files was a project with no seasons until this module: a co-star's two shoot days in it were posted any
 * week of any year, for ever. It has seasons now, each shot from mid-July to May, with a hiatus between when none of its
 * work is cast; and a network's word each May on whether there's another.
 */

import { addDays, instantFromZoned, zonedParts, type Instant } from '../core/time';

export interface SeriesTemplate {
  id: string;
  title: string;
  company: string;
  /** Every series here is the game's invention. */
  fictional: true;
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
  /** The network's chance of another season; and, once canceled, of reviving it, from `reviveAfter` years on. */
  chance: { renew: number; revive: number; reviveAfter: number };
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
    chance: { renew: 0.65, revive: 0.25, reviveAfter: 2 },
    words: 'The Calloway Files and its network are the game’s inventions, and so is each season: the network ordered it through the season beginning in 2029, and from May 2030 it says each May whether there’s another.',
  },
];

/**
 * The slate's series this session knows (from 2026-10-24, brief 27, `systems/slate.ts`), a save's own copy first: each a
 * series the game invents as `SERIES`' are, its seasons decided by the same rules (`systems/series.ts`).
 */
const SLATE_SERIES = new Map<string, SeriesTemplate>();
export function addSeries(list: readonly SeriesTemplate[]): void {
  for (const s of list) if (!SLATE_SERIES.has(s.id) && !SERIES.some((x) => x.id === s.id)) SLATE_SERIES.set(s.id, s);
}

export const seriesById = (id: string): SeriesTemplate | undefined => SERIES.find((s) => s.id === id) ?? SLATE_SERIES.get(id);

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
