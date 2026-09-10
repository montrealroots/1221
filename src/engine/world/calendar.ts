/**
 * SLATE — The master calendar.
 *
 * Calendar is the collision detector of the universe. Everything that occupies
 * the player's time lands here: work, classes, appointments, dates, filming,
 * flights, deadlines, ceremonies. It also carries the things that are not
 * commitments but matter anyway — birthdays, holidays, seasons.
 */

import { holidaysAcross, type Calendar, type KeptHoliday } from '../content/holidays';
import type { Simulation } from '../core/simulation';
import type { ScheduledItem } from '../core/scheduler';
import type { Id } from '../domain/model';
import {
  addDays, dateKey, daysInMonth, instantFromZoned, seasonOf,
  startOfDay, zonedParts, type Instant, type Season, MS_DAY, MS_MINUTE,
} from '../core/time';
import { CITIES } from '../content/geography';

export type CalendarCategory = 'personal' | 'family' | 'holiday' | 'birthday' | 'system';

export interface CalendarLegendEntry {
  category: CalendarCategory;
  label: string;
  colour: string;
  description: string;
}

/**
 * One legend, used by every calendar surface so colors never disagree.
 *
 * It used to run to nineteen categories, one for every system that could book
 * the player. Those systems are gone, and a legend that names colors nothing
 * can ever be drawn in is a legend that lies about the game.
 */
export const CALENDAR_LEGEND: readonly CalendarLegendEntry[] = [
  { category: 'personal', label: 'Personal', colour: '#a86b8c', description: 'Time that’s yours.' },
  { category: 'family', label: 'Family', colour: '#b5859a', description: 'Anniversaries and family commitments.' },
  { category: 'holiday', label: 'Holiday', colour: '#8c8c8c', description: 'Public holidays and observances.' },
  { category: 'birthday', label: 'Birthday', colour: '#c98b8b', description: 'Birthdays of people you know.' },
  { category: 'system', label: 'World', colour: '#6a6a6a', description: 'Background world processing.' },
];

export const LEGEND_BY_CATEGORY: Readonly<Record<string, CalendarLegendEntry>> =
  Object.fromEntries(CALENDAR_LEGEND.map((e) => [e.category, e]));

export interface CalendarEntry {
  id: string;
  at: Instant;
  endsAt?: Instant;
  title: string;
  category: CalendarCategory;
  /** Scheduled commitments the player must attend. */
  requiresPlayer: boolean;
  locationId?: string;
  status: ScheduledItem['status'] | 'observance';
  refType?: string;
  refId?: Id;
  durationMinutes?: number;
  /** True when this entry conflicts with another commitment. */
  conflicted?: boolean;
}

export interface CalendarDay {
  key: string;
  date: Instant;
  dayOfMonth: number;
  weekday: number;
  inMonth: boolean;
  isToday: boolean;
  season: Season;
  entries: CalendarEntry[];
  holidays: KeptHoliday[];
}

// ---------------------------------------------------------------------------
// Holidays
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// Building the calendar
// ---------------------------------------------------------------------------

function toEntry(item: ScheduledItem): CalendarEntry {
  return {
    id: item.id,
    at: item.at,
    endsAt: item.durationMinutes ? item.at + item.durationMinutes * MS_MINUTE : undefined,
    title: item.label,
    category: (item.category as CalendarCategory) ?? 'system',
    requiresPlayer: item.requiresPlayer ?? false,
    locationId: item.locationId,
    status: item.status,
    refType: item.refType,
    refId: item.refId,
    durationMinutes: item.durationMinutes,
  };
}

/** Entries overlapping a window, sorted, with conflicts flagged. */
export function entriesBetween(sim: Simulation, from: Instant, to: Instant): CalendarEntry[] {
  const entries = sim.timeline
    .overlapping(from, to)
    .filter((item) => item.category !== 'system')
    .map(toEntry)
    .sort((a, b) => a.at - b.at);

  // Flag genuine collisions between things the player has to attend.
  for (let i = 0; i < entries.length; i++) {
    const a = entries[i] as CalendarEntry;
    if (!a.requiresPlayer || a.status !== 'pending') continue;
    const aEnd = a.endsAt ?? a.at;
    for (let j = i + 1; j < entries.length; j++) {
      const b = entries[j] as CalendarEntry;
      if (b.at >= aEnd) break;
      if (!b.requiresPlayer || b.status !== 'pending') continue;
      a.conflicted = true;
      b.conflicted = true;
    }
  }
  return entries;
}

/**
 * The country whose year the business runs on.
 *
 * The work is American — the studios, the guilds, the awards, the release
 * calendar — so its holidays are kept wherever the player is standing. A
 * Thanksgiving nobody in the industry is working through is a fact about the
 * week whether or not the shops in Reykjavík are open.
 */
export const INDUSTRY_COUNTRY = 'us';

/**
 * The calendars this life keeps: where you are standing, and the industry's.
 *
 * Where you are comes first, because that is whose shops are shut and whose
 * roads are quiet. The two collapse to one when the player is in America.
 */
export function keptCalendars(sim: Simulation): Calendar[] {
  const player = sim.universe.people[sim.universe.playerId];
  const here = player ? CITIES.get(player.currentLocationId) : undefined;
  const out: Calendar[] = here ? [{ countryId: here.countryId, regionId: here.parentId }] : [];
  if (!out.some((c) => c.countryId === INDUSTRY_COUNTRY)) out.push({ countryId: INDUSTRY_COUNTRY });
  return out;
}

/** A full month grid, Sunday-first, including leading and trailing days. */
export function monthGrid(sim: Simulation, year: number, month: number): CalendarDay[] {
  const zone = sim.homeZone;
  const player = sim.universe.people[sim.universe.playerId];
  const here = player ? CITIES.get(player.currentLocationId) : undefined;
  const calendars = keptCalendars(sim);
  const latitude = here?.latitude ?? 34;

  const firstOfMonth = instantFromZoned({ year, month, day: 1 }, zone);
  const leading = zonedParts(firstOfMonth, zone).weekday;
  const gridStart = addDays(firstOfMonth, -leading, zone);
  const total = Math.ceil((leading + daysInMonth(year, month)) / 7) * 7;

  const windowStart = startOfDay(gridStart, zone);
  const windowEnd = addDays(windowStart, total, zone);
  const entries = entriesBetween(sim, windowStart, windowEnd);
  const todayKey = dateKey(sim.now, zone);

  const days: CalendarDay[] = [];
  for (let i = 0; i < total; i++) {
    const date = addDays(gridStart, i, zone);
    const parts = zonedParts(date, zone);
    const key = dateKey(date, zone);
    const dayStart = startOfDay(date, zone);
    const dayEnd = dayStart + MS_DAY;

    days.push({
      key,
      date: dayStart,
      dayOfMonth: parts.day,
      weekday: parts.weekday,
      inMonth: parts.month === month && parts.year === year,
      isToday: key === todayKey,
      season: seasonOf(date, zone, latitude),
      entries: entries.filter((e) => e.at >= dayStart && e.at < dayEnd),
      holidays: holidaysAcross(date, zone, calendars),
    });
  }
  return days;
}

/** The next N commitments the player actually has to be at. */
export function upcoming(sim: Simulation, limit = 8): CalendarEntry[] {
  return sim.timeline
    .between(sim.now, sim.now + 365 * MS_DAY, (i) => i.category !== 'system')
    .slice(0, limit)
    .map(toEntry);
}

/** The single next thing, for HOME. */
export function nextCommitment(sim: Simulation): CalendarEntry | undefined {
  const next = sim.timeline.next(sim.now, (i) => i.requiresPlayer === true);
  return next ? toEntry(next) : undefined;
}

export interface SkipTarget {
  item: ScheduledItem;
  entry: CalendarEntry;
  /** Commitments that would be crossed on the way. */
  crossed: CalendarEntry[];
  /** Crossed commitments that need the player and would be missed. */
  missed: CalendarEntry[];
  /** True when the player is not in the right city and has no travel booked. */
  needsTravel: boolean;
  travelNote?: string;
  daysAway: number;
}

/**
 * Everything Skip to Event needs to show before it commits. Nothing here
 * mutates; the player sees exactly what the jump will cost first.
 */
export function skipTargets(sim: Simulation, limit = 12): SkipTarget[] {
  const player = sim.universe.people[sim.universe.playerId];
  const pending = sim.timeline
    .between(sim.now + 1, sim.now + 400 * MS_DAY, (i) => i.category !== 'system')
    .slice(0, limit);

  return pending.map((item) => {
    const crossedItems = sim.timeline.between(sim.now, item.at - 1, (i) => i.category !== 'system' && i.id !== item.id);
    const crossed = crossedItems.map(toEntry);
    const missed = crossed.filter((e) => e.requiresPlayer);

    const needsTravel = Boolean(
      item.locationId && player && item.locationId !== player.currentLocationId,
    );
    let travelNote: string | undefined;
    if (needsTravel && item.locationId) {
      travelNote = `You’re in ${CITIES.get(player?.currentLocationId ?? '')?.name ?? 'another city'} and this is in ${CITIES.get(item.locationId)?.name ?? 'another city'}.`;
    }

    return {
      item,
      entry: toEntry(item),
      crossed,
      missed,
      needsTravel,
      travelNote,
      daysAway: Math.max(0, Math.round((item.at - sim.now) / MS_DAY)),
    };
  });
}

/**
 * The commitments the player would miss by jumping straight to `at`.
 *
 * The Advance menu asks before it moves, because time only goes forwards and
 * an audition skipped is an audition missed.
 */
export function missedBy(sim: Simulation, at: Instant): CalendarEntry[] {
  return sim.timeline
    .between(sim.now, at - 1, (i) => i.category !== 'system')
    .map(toEntry)
    .filter((e) => e.requiresPlayer);
}

/** Whether a proposed commitment collides with anything already booked. */
export function checkConflicts(sim: Simulation, at: Instant, durationMinutes: number): CalendarEntry[] {
  return sim.timeline.conflicts(at, durationMinutes).map(toEntry);
}

/** Free windows in a day, for scheduling UIs that suggest times. */
export function freeWindows(sim: Simulation, day: Instant, opts: { fromHour?: number; toHour?: number } = {}): { start: Instant; end: Instant }[] {
  const zone = sim.homeZone;
  const parts = zonedParts(day, zone);
  const from = instantFromZoned({ year: parts.year, month: parts.month, day: parts.day, hour: opts.fromHour ?? 8 }, zone);
  const to = instantFromZoned({ year: parts.year, month: parts.month, day: parts.day, hour: opts.toHour ?? 22 }, zone);

  const busy = sim.timeline
    .between(from, to, (i) => i.requiresPlayer === true)
    .map((i) => ({ start: i.at, end: i.at + (i.durationMinutes ?? 60) * MS_MINUTE }))
    .sort((a, b) => a.start - b.start);

  const windows: { start: Instant; end: Instant }[] = [];
  let cursor = from;
  for (const block of busy) {
    if (block.start > cursor + 30 * MS_MINUTE) windows.push({ start: cursor, end: block.start });
    cursor = Math.max(cursor, block.end);
  }
  if (to > cursor + 30 * MS_MINUTE) windows.push({ start: cursor, end: to });
  return windows;
}
