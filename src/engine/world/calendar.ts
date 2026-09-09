/**
 * SLATE — The master calendar.
 *
 * Calendar is the collision detector of the universe. Everything that occupies
 * the player's time lands here: work, classes, appointments, dates, filming,
 * flights, deadlines, ceremonies. It also carries the things that are not
 * commitments but matter anyway — birthdays, holidays, seasons.
 */

import { holidaysOn, type HolidayEntry } from '../content/holidays';
import type { Simulation } from '../core/simulation';
import type { ScheduledItem } from '../core/scheduler';
import type { Id } from '../domain/model';
import {
  addDays, dateKey, daysInMonth, instantFromZoned, seasonOf,
  startOfDay, zonedParts, type Instant, type Season, MS_DAY, MS_MINUTE,
} from '../core/time';
import { CITIES } from '../content/geography';

export type CalendarCategory =
  | 'work' | 'career' | 'finance' | 'health' | 'personal' | 'family' | 'education'
  | 'property' | 'vehicles' | 'travel' | 'production' | 'release' | 'marketing'
  | 'awards' | 'social' | 'business' | 'holiday' | 'birthday' | 'system'
;

export interface CalendarLegendEntry {
  category: CalendarCategory;
  label: string;
  colour: string;
  description: string;
}

/** One legend, used by every calendar surface so colors never disagree. */
export const CALENDAR_LEGEND: readonly CalendarLegendEntry[] = [
  { category: 'work', label: 'Work', colour: '#6b8cae', description: 'Shifts and ordinary employment.' },
  { category: 'career', label: 'Career', colour: '#c9a227', description: 'Auditions, interviews, meetings and breakdowns.' },
  { category: 'production', label: 'Production', colour: '#c2543d', description: 'Shoot days, post milestones and wrap.' },
  { category: 'release', label: 'Release', colour: '#a4553f', description: 'Openings, box office and streaming windows.' },
  { category: 'marketing', label: 'Marketing', colour: '#b07b4f', description: 'Trailers, press tours and premieres.' },
  { category: 'awards', label: 'Awards', colour: '#d4af37', description: 'Nominations, ceremonies and festivals.' },
  { category: 'finance', label: 'Finance', colour: '#4f7d5e', description: 'Bills, paydays, taxes and loan payments.' },
  { category: 'business', label: 'Business', colour: '#5c7a6b', description: 'Company deadlines, payroll and contracts.' },
  { category: 'health', label: 'Health', colour: '#7a9a8e', description: 'Appointments and recovery.' },
  { category: 'personal', label: 'Personal', colour: '#a86b8c', description: 'Dates, friends and time that’s yours.' },
  { category: 'family', label: 'Family', colour: '#b5859a', description: 'Birthdays, anniversaries and family commitments.' },
  { category: 'education', label: 'Education', colour: '#7b6ba8', description: 'Classes, coaching and training.' },
  { category: 'property', label: 'Property', colour: '#8a7a5c', description: 'Showings, inspections, closings and construction.' },
  { category: 'vehicles', label: 'Vehicles', colour: '#6f7d8c', description: 'Service, registration and shop appointments.' },
  { category: 'travel', label: 'Travel', colour: '#5d8a9e', description: 'Flights, hotels and trips.' },
  { category: 'social', label: 'Social', colour: '#9c6f9e', description: 'Scheduled posts and campaign beats.' },
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
  holidays: HolidayEntry[];
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

/** A full month grid, Sunday-first, including leading and trailing days. */
export function monthGrid(sim: Simulation, year: number, month: number): CalendarDay[] {
  const zone = sim.homeZone;
  const player = sim.universe.people[sim.universe.playerId];
  const here = player ? CITIES.get(player.currentLocationId) : undefined;
  const countryId = here?.countryId ?? 'us';
  const regionId = here?.parentId;
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
      holidays: holidaysOn(date, zone, countryId, regionId),
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
      const hasFlight = Object.values(sim.universe.flightBookings).some(
        (b) => b.status === 'booked' && b.arriveAt <= item.at && b.arriveAt > sim.now
          && CITIES.get(item.locationId as string)?.airportId === undefined,
      );
      travelNote = hasFlight
        ? undefined
        : `You’re in ${CITIES.get(player?.currentLocationId ?? '')?.name ?? 'another city'} and this is in ${CITIES.get(item.locationId)?.name ?? 'another city'}. Nothing is booked.`;
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
