/**
 * SLATE — a child's school day, as the parent's time (the master plan's
 * §52.5, from 2026-10-03; `docs/research/world/research-referrals-childday.json`).
 *
 * The published cost of raising a child already counts childcare, so a
 * child's day isn't charged again. It is time: a child of primary age, five
 * to eleven, living with you is taken to school and fetched at the town's
 * bell, on each school day of its year, each a quarter-hour on the calendar,
 * SLATE's estimate of the walk, so a call or a class then clashes with it.
 * The bells: New Haven's common 8:20 to 3:05 (its schools' own 2026-27
 * times), Mexico City's primaria 8:00 to 12:30 (the SEP), and New York's and
 * Los Angeles's 8:00 to 2:20 and 2:23, schools' own times read secondhand.
 * The year: each district's first and last days and the breaks it names for
 * 2026-27, taken again each year on the same dates, SLATE's reading. London,
 * Dublin, Toronto and Vancouver publish no common bell, and no run is kept
 * there.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, instantFromZoned, zonedParts, type Instant } from '../core/time';
import { CITIES } from '../content/geography';
import { childrenOf, livesWithYou } from './children';

export interface SchoolTown { start: [number, number]; end: [number, number]; first: string; last: string; breaks: readonly [string, string][]; confirmed: boolean }
/** Month-day strings; a break's both ends in. */
export const SCHOOL: Readonly<Record<string, SchoolTown>> = {
  'us-ct-newhaven': { start: [8, 20], end: [15, 5], first: '08-31', last: '06-17', breaks: [['11-26', '11-27'], ['12-24', '12-31'], ['02-15', '02-16'], ['04-12', '04-16']], confirmed: true },
  'mx-cmx-mexicocity': { start: [8, 0], end: [12, 30], first: '08-31', last: '07-09', breaks: [['12-21', '01-05'], ['03-22', '04-03']], confirmed: true },
  'us-ny-newyork': { start: [8, 0], end: [14, 20], first: '09-10', last: '06-28', breaks: [], confirmed: false },
  'us-ca-losangeles': { start: [8, 0], end: [14, 23], first: '08-12', last: '06-04', breaks: [['11-26', '11-27'], ['12-21', '01-08']], confirmed: false },
};
export const SCHOOL_RUN_MINUTES = 15;
export const SCHOOL_RUN_KIND = 'family.school_run';
const PRIMARY = { from: 5, to: 12 } as const;

const md = (month: number, day: number) => `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
/** Whether a month-day falls in a span that may run over the new year. */
const within = (d: string, from: string, to: string) => (from <= to ? d >= from && d <= to : d >= from || d <= to);

/** Whether a day is a school day in the town: a weekday in its year, not in a break. */
export function schoolDay(cityId: string, at: Instant): boolean {
  const s = SCHOOL[cityId];
  if (!s) return false;
  const p = zonedParts(at, CITIES.require(cityId).timeZone);
  if (p.weekday === 0 || p.weekday === 6) return false;
  const d = md(p.month, p.day);
  return within(d, s.first, s.last) && !s.breaks.some(([a, b]) => within(d, a, b));
}

/** The children of primary age living with them. */
export const primaryChildren = (person: Person, at: Instant) => childrenOf(person).filter((k) => livesWithYou(k) && (at - k.born) / (365.2425 * MS_DAY) >= PRIMARY.from && (at - k.born) / (365.2425 * MS_DAY) < PRIMARY.to);

/** A day's runs booked: the drop-off at the bell and the fetch at the last bell. How many booked. */
export function bookSchoolRun(sim: Simulation, person: Person, at: Instant): number {
  const cityId = person.home?.cityId;
  const s = cityId ? SCHOOL[cityId] : undefined;
  if (!s || !schoolDay(cityId!, at) || primaryChildren(person, at).length === 0) return 0;
  const zone = CITIES.require(cityId!).timeZone;
  const p = zonedParts(at, zone);
  let n = 0;
  for (const [label, [h, m]] of [['The School Run', s.start], ['The School Pick-Up', s.end]] as const) {
    const when = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: h, minute: m }, zone);
    if (when < at) continue;
    sim.schedule({ at: when, kind: SCHOOL_RUN_KIND, label, category: 'relationship', priority: 33, requiresPlayer: true, durationMinutes: SCHOOL_RUN_MINUTES, locationId: cityId!, payload: { personId: person.id } });
    n += 1;
  }
  return n;
}

export function registerSchoolRun(sim: Simulation): void {
  sim.onEvent('world.day_rollover', 'family.school_run', (_e, { sim: s }) => { bookSchoolRun(s, s.player, s.now); });
  sim.onSchedule(SCHOOL_RUN_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    if (person && person.currentLocationId !== item.locationId) item.status = 'missed';
  });
}
