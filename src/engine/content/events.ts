/**
 * SLATE — the industry's real calendar.
 *
 * The award shows, festivals, markets and fan events that actually exist,
 * under their own names, on the days they actually happen. Each one carries
 * the dates SLATE has verified (with where they came from), a rule for the
 * time of year it lands when nothing has been announced yet, the day its
 * nominations or line-up come out, and everything it hands out or puts on.
 *
 * A date in `known` is a fact read from a named source. A date produced by
 * `start` for a year with nothing in `known` is a projection from the usual
 * pattern, and is labelled as such wherever it is shown. Nothing here is
 * invented and then called verified.
 */

import { addDays, dateKey, instantFromZoned, nthWeekdayOfMonth, parseDateKey, zonedParts, type Instant } from '../core/time';

/** 0 = Sunday, as in `zonedParts().weekday`. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type DateRule =
  /** The same calendar date every year. */
  | { kind: 'fixed'; month: number; day: number }
  /** The nth weekday of a month; nth of -1 is the last. */
  | { kind: 'nth'; month: number; weekday: Weekday; nth: number }
  /** The given weekday nearest to a calendar date. */
  | { kind: 'nearest'; month: number; day: number; weekday: Weekday }
  /** So many days from US Labor Day, the first Monday of September. */
  | { kind: 'labor-day'; offsetDays: number }
  /** So many days from another event's start. */
  | { kind: 'relative'; eventId: string; offsetDays: number }
  /** One rule in even years, another in odd. */
  | { kind: 'parity'; even: DateRule; odd: DateRule };

export interface KnownDates {
  start: string;
  end?: string;
  /** The day nominations, selections or the line-up were announced. */
  nominations?: string;
  source: string;
  note?: string;
}

export interface Milestone {
  label: string;
  rule: DateRule;
  known?: Record<number, { date: string; source: string }>;
}

export type EventKind = 'awards' | 'festival' | 'fan' | 'market';
export type EventScope = 'film' | 'tv' | 'both' | 'animation' | 'documentary' | 'genre' | 'shorts' | 'pop' | 'crafts';
export type Cadence = 'annual' | 'even-years' | 'odd-years' | 'irregular';

export interface IndustryEventSpec {
  id: string;
  name: string;
  shortName?: string;
  kind: EventKind;
  scope: EventScope;
  organiser?: string;
  city: string;
  /** A SLATE city id when the place is one SLATE knows. */
  cityId?: string;
  countryId: string;
  zone: string;
  venue?: string;
  cadence?: Cadence;
  /** Edition number in a year = year − editionOffset. */
  editionOffset?: number;
  start: DateRule;
  days: number;
  /** When nominations, selections or the line-up come out. */
  nominations?: DateRule;
  milestones?: Milestone[];
  known: Record<number, KnownDates>;
  /** Every award handed out, as the body names it. */
  categories?: string[];
  /** A festival's programme strands. */
  sections?: string[];
  /** What a festival's juries give. */
  prizes?: string[];
  /** What happens at a fan event or market. */
  activities?: string[];
  note?: string;
  sources: string[];
}

export interface Occurrence {
  event: IndustryEventSpec;
  year: number;
  edition?: number;
  /** Local calendar days, 'YYYY-MM-DD'. */
  start: string;
  end: string;
  nominations?: string;
  milestones: { label: string; date: string; verified: boolean }[];
  /** True when the start date was read from a source rather than projected. */
  verified: boolean;
  source?: string;
  note?: string;
}

const NOON = 12;

function fromKey(key: string, zone: string): Instant {
  return parseDateKey(key, zone, NOON);
}

function toKey(instant: Instant, zone: string): string {
  return dateKey(instant, zone);
}

function nearest(year: number, month: number, day: number, weekday: Weekday, zone: string): Instant {
  const anchor = instantFromZoned({ year, month, day, hour: NOON }, zone);
  const have = zonedParts(anchor, zone).weekday;
  let delta = (weekday - have + 7) % 7;
  if (delta > 3) delta -= 7;
  return addDays(anchor, delta, zone);
}

/** US Labor Day: the first Monday of September. */
export function laborDay(year: number, zone: string): Instant {
  return addDays(nthWeekdayOfMonth(year, 9, 1, 1, zone), 0, zone) + NOON * 60 * 60 * 1000;
}

/** The day a rule lands on in a year, as a local date key. */
export function resolveRule(rule: DateRule, year: number, zone: string, lookup: (id: string) => IndustryEventSpec | undefined, depth = 0): string {
  if (depth > 4) throw new Error('Event date rules refer to each other in a loop.');
  switch (rule.kind) {
    case 'fixed':
      return toKey(instantFromZoned({ year, month: rule.month, day: rule.day, hour: NOON }, zone), zone);
    case 'nth':
      return toKey(nthWeekdayOfMonth(year, rule.month, rule.weekday, rule.nth, zone), zone);
    case 'nearest':
      return toKey(nearest(year, rule.month, rule.day, rule.weekday, zone), zone);
    case 'labor-day':
      return toKey(addDays(laborDay(year, zone), rule.offsetDays, zone), zone);
    case 'relative': {
      const other = lookup(rule.eventId);
      if (!other) throw new Error(`Event date rule refers to unknown event '${rule.eventId}'.`);
      const base = other.known[year]?.start ?? resolveRule(other.start, year, other.zone, lookup, depth + 1);
      return toKey(addDays(fromKey(base, zone), rule.offsetDays, zone), zone);
    }
    case 'parity':
      return resolveRule(year % 2 === 0 ? rule.even : rule.odd, year, zone, lookup, depth + 1);
  }
}

function happensIn(spec: IndustryEventSpec, year: number): boolean {
  if (spec.known[year]) return true;
  switch (spec.cadence ?? 'annual') {
    case 'annual': return true;
    case 'even-years': return year % 2 === 0;
    case 'odd-years': return year % 2 === 1;
    case 'irregular': return false;
  }
}

/**
 * When an event happens in a year: the verified dates if SLATE has them,
 * else the usual pattern. Undefined when it does not happen that year.
 */
const cache = new Map<string, Occurrence | null>();

export function occurrence(spec: IndustryEventSpec, year: number, lookup: (id: string) => IndustryEventSpec | undefined): Occurrence | undefined {
  const key = `${spec.id}:${year}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit ?? undefined;
  const made = computeOccurrence(spec, year, lookup);
  cache.set(key, made ?? null);
  return made;
}

function computeOccurrence(spec: IndustryEventSpec, year: number, lookup: (id: string) => IndustryEventSpec | undefined): Occurrence | undefined {
  if (!happensIn(spec, year)) return undefined;
  const known = spec.known[year];
  const start = known?.start ?? resolveRule(spec.start, year, spec.zone, lookup);
  const end = known?.end ?? toKey(addDays(fromKey(start, spec.zone), Math.max(0, spec.days - 1), spec.zone), spec.zone);
  const nominations = known?.nominations ?? (spec.nominations ? resolveRule(spec.nominations, year, spec.zone, lookup) : undefined);
  const milestones = (spec.milestones ?? []).map((m) => {
    const hit = m.known?.[year];
    return { label: m.label, date: hit?.date ?? resolveRule(m.rule, year, spec.zone, lookup), verified: !!hit };
  });
  return {
    event: spec,
    year,
    ...(spec.editionOffset ? { edition: year - spec.editionOffset } : {}),
    start,
    end,
    ...(nominations ? { nominations } : {}),
    milestones,
    verified: !!known,
    ...(known?.source ? { source: known.source } : {}),
    ...(known?.note ?? spec.note ? { note: known?.note ?? spec.note } : {}),
  };
}

/** What an event is doing on one day, if anything. */
export type Phase = 'nominations' | 'ceremony' | 'festival' | 'event' | 'milestone';

export interface EventDay {
  occurrence: Occurrence;
  phase: Phase;
  /** "Nominations Announced", "Day 3 Of 12", "Ceremony". */
  detail: string;
  dayIndex: number;
}

/** Whether one date key falls inside an inclusive range of date keys. */
function within(key: string, start: string, end: string): boolean {
  return key >= start && key <= end;
}

function dayNumber(key: string, start: string, zone: string): number {
  const a = fromKey(start, zone);
  const b = fromKey(key, zone);
  return Math.round((b - a) / (24 * 60 * 60 * 1000)) + 1;
}

/** Everything the industry is doing on one local day. */
export function eventsOnDay(specs: readonly IndustryEventSpec[], key: string, lookup: (id: string) => IndustryEventSpec | undefined): EventDay[] {
  const year = Number(key.slice(0, 4));
  const out: EventDay[] = [];
  for (const spec of specs) {
    // An event dated in December can have a nominations day in the same year,
    // and a January event can announce in the December before; look at both.
    for (const y of [year, year + 1]) {
      const occ = occurrence(spec, y, lookup);
      if (!occ) continue;
      if (occ.nominations === key) {
        out.push({ occurrence: occ, phase: 'nominations', detail: spec.kind === 'festival' ? 'Line-Up Announced' : 'Nominations Announced', dayIndex: 0 });
      }
      for (const m of occ.milestones) {
        if (m.date === key) out.push({ occurrence: occ, phase: 'milestone', detail: m.label, dayIndex: 0 });
      }
      if (within(key, occ.start, occ.end)) {
        const n = dayNumber(key, occ.start, spec.zone);
        const total = dayNumber(occ.end, occ.start, spec.zone);
        const phase: Phase = spec.kind === 'awards' ? 'ceremony' : spec.kind === 'festival' ? 'festival' : 'event';
        const detail = total <= 1 ? (spec.kind === 'awards' ? 'Ceremony' : 'One Day') : `Day ${n} Of ${total}`;
        out.push({ occurrence: occ, phase, detail, dayIndex: n });
      }
    }
  }
  return out;
}

/** The next occurrences on or after a date, soonest first. */
export function upcomingEvents(specs: readonly IndustryEventSpec[], fromKey_: string, limit: number, lookup: (id: string) => IndustryEventSpec | undefined): Occurrence[] {
  const year = Number(fromKey_.slice(0, 4));
  const out: Occurrence[] = [];
  for (const spec of specs) {
    for (const y of [year, year + 1]) {
      const occ = occurrence(spec, y, lookup);
      if (occ && occ.end >= fromKey_) { out.push(occ); break; }
    }
  }
  return out.sort((a, b) => a.start.localeCompare(b.start) || a.event.name.localeCompare(b.event.name)).slice(0, limit);
}

/** "98th", for an edition number. */
export function ordinalOf(n: number): string {
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th';
  return `${n}${suffix}`;
}

/** "The 98th Academy Awards", or just the name when editions are not counted. */
export function occurrenceTitle(occ: Occurrence): string {
  if (!occ.edition) return occ.event.name;
  const name = occ.event.name;
  return name.startsWith('The ') ? `The ${ordinalOf(occ.edition)} ${name.slice(4)}` : `${ordinalOf(occ.edition)} ${name}`;
}
