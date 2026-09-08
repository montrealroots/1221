/**
 * SLATE — what the save remembers, and what it is still thinking about.
 *
 * The game already knew everything that happened to you. It just never wrote
 * any of it down: a whole simulated year of life left four lines in history,
 * because history is the milestone record and a life is not made of
 * milestones. So the world felt like it had no memory, because it did not.
 *
 * This listens to the whole event stream — every shift, every class, every
 * missed bill, every person met — and turns it into a memory, according to
 * the written book in `content/recallbook.ts`. Nothing is invented: a
 * recollection exists because an event fired, and it says which one.
 *
 * The ranking is the part that makes it feel like a mind. What you would
 * still be thinking about is not what happened most recently and not what was
 * biggest; it is both, traded off. An ordinary Tuesday fades in a week. A
 * grading, a first pay packet, a funeral does not fade at all, and above a
 * threshold nothing ever falls below half its force however long ago it was.
 *
 * History is untouched by all of this. It stays the permanent milestone
 * record, it is still lossless, and the History workspace still reads it.
 */

import type { Simulation } from '../core/simulation';
import type { Id, RecallKind, RecallState, Recollection } from '../domain/model';
import { MS_DAY } from '../core/time';
import { clamp } from '../core/rng';
import {
  MONEY_KEYS, NEVER_BELOW_HALF, PERSON_KEYS, PLACE_KEYS, RECALLBOOK,
} from '../content/recallbook';

/**
 * How many everyday recollections a save carries.
 *
 * Generous on purpose. At the rate an ordinary life generates them this is
 * years of memory, and the prune below takes the least worth remembering
 * first, so what goes is the Tuesday and never the wedding.
 */
export const MAX_RECOLLECTIONS = 6000;

/** How many played beats the register keeps before dropping the oldest. */
export const MAX_PLAYED = 3000;

export function ensureRecall(sim: Simulation): RecallState {
  if (!sim.universe.recall) sim.universe.recall = { version: 1, entries: [], played: {} };
  return sim.universe.recall;
}

export type RecallSpec = Omit<Recollection, 'id' | 'at'> & { at?: number };

/**
 * Below this, a thing is texture rather than a memory.
 *
 * Sleeping, showering, filling the tank, walking into a shop. Nobody carries
 * two hundred separate memories of showering; they carry showering, and a
 * rough sense of the week. So anything under this weight folds into one
 * memory per week per kind, with a count on it — which is both truer and the
 * difference between a memory and a log file.
 */
export const TEXTURE_BELOW = 20;

/** The window the everyday folds into. */
export const TEXTURE_WINDOW_DAYS = 7;

/**
 * Writes one thing into the memory.
 *
 * The same thing on the same day is one memory with the greater weight, not
 * two: going into three shops is three memories, but the engine emitting the
 * same event twice inside one transaction is one. The everyday folds further
 * still, into one memory for the week.
 */
export function remember(sim: Simulation, spec: RecallSpec): Recollection {
  const state = ensureRecall(sim);
  const at = spec.at ?? sim.now;
  const day = Math.floor(at / MS_DAY);

  if (spec.weight < TEXTURE_BELOW) {
    // The anchor stays where the week started. Moving it forward every time
    // would slide the window along and one memory would eat every shower a
    // character ever took.
    const window = at - TEXTURE_WINDOW_DAYS * MS_DAY;
    const thisWeek = state.entries.find((one) => one.cause === spec.cause && one.at >= window);
    if (thisWeek) {
      thisWeek.times = (thisWeek.times ?? 1) + 1;
      thisWeek.lastAt = at;
      if (spec.amount !== undefined) thisWeek.amount = (thisWeek.amount ?? 0) + spec.amount;
      return thisWeek;
    }
  }

  const same = state.entries.find((one) => one.cause === spec.cause
    && one.subjectId === spec.subjectId
    && Math.floor(one.at / MS_DAY) === day);
  if (same) {
    same.weight = Math.max(same.weight, spec.weight);
    same.at = at;
    if (spec.amount !== undefined) same.amount = (same.amount ?? 0) + spec.amount;
    return same;
  }

  const entry: Recollection = { id: sim.nextId('recall'), at, ...spec };
  state.entries.push(entry);
  if (state.entries.length > MAX_RECOLLECTIONS) prune(state, sim.now);
  return entry;
}

/**
 * Drops the least worth remembering, and only those.
 *
 * Anything above the threshold is kept whatever its age, which is what makes
 * this a memory rather than a rolling window: a save that has been played for
 * twenty years still holds every grading, every funeral and every first day.
 */
function prune(state: RecallState, now: number): void {
  const keep: Recollection[] = [];
  const rest: Recollection[] = [];
  for (const one of state.entries) (one.weight >= NEVER_BELOW_HALF ? keep : rest).push(one);
  rest.sort((a, b) => worthNow(b, now) - worthNow(a, now));
  const room = Math.max(0, MAX_RECOLLECTIONS - keep.length);
  state.entries = [...keep, ...rest.slice(0, room)].sort((a, b) => a.at - b.at);
}

/**
 * What one memory is worth right now, 0-100.
 *
 * Weight halves every `halfLife` days, except that a memory that mattered
 * enough never falls below half of what it was. That floor is the whole
 * difference between a game that remembers and a game with a recent-items
 * list.
 */
export function worthNow(entry: Recollection, now: number): number {
  if (entry.halfLifeDays <= 0) return entry.weight;
  const days = Math.max(0, (now - entry.at) / MS_DAY);
  const faded = entry.weight * Math.pow(0.5, days / entry.halfLifeDays);
  const floor = entry.weight >= NEVER_BELOW_HALF ? entry.weight / 2 : 0;
  return clamp(Math.max(faded, floor), 0, 100);
}

export interface RecallQuery {
  /** Only memories filed under all of these. */
  tags?: readonly string[];
  kind?: RecallKind;
  /** Only memories somebody else was there for. */
  withId?: Id;
  /** Only memories about one thing. */
  subjectId?: Id;
  /** Only memories caused by this event. */
  cause?: string;
  since?: number;
  until?: number;
  /** Below this, it is not worth bringing up. */
  minWorth?: number;
  limit?: number;
}

/** What the save is still thinking about, most first. */
export function recall(sim: Simulation, query: RecallQuery = {}): Recollection[] {
  const state = sim.universe.recall;
  if (!state) return [];
  const now = sim.now;
  const min = query.minWorth ?? 0;
  return state.entries
    .filter((one) => (query.kind === undefined || one.kind === query.kind)
      && (query.cause === undefined || one.cause === query.cause)
      && (query.subjectId === undefined || one.subjectId === query.subjectId)
      && (query.withId === undefined || (one.withIds?.includes(query.withId) ?? false))
      && (query.since === undefined || one.at >= query.since)
      && (query.until === undefined || one.at <= query.until)
      && (query.tags === undefined || query.tags.every((tag) => one.tags.includes(tag)))
      && worthNow(one, now) >= min)
    .sort((a, b) => worthNow(b, now) - worthNow(a, now) || b.at - a.at)
    .slice(0, query.limit ?? 40);
}

/** The last time something of a kind happened, if it ever did. */
export function lastTime(sim: Simulation, query: RecallQuery = {}): Recollection | undefined {
  const state = sim.universe.recall;
  if (!state) return undefined;
  let best: Recollection | undefined;
  for (const one of state.entries) {
    if (query.tags && !query.tags.every((tag) => one.tags.includes(tag))) continue;
    if (query.cause !== undefined && one.cause !== query.cause) continue;
    if (query.withId !== undefined && !(one.withIds?.includes(query.withId) ?? false)) continue;
    if (query.subjectId !== undefined && one.subjectId !== query.subjectId) continue;
    if (!best || whenLast(one) > whenLast(best)) best = one;
  }
  return best;
}

/** When a memory last happened: the anchor, or the last of a folded week. */
export function whenLast(entry: Recollection): number {
  return entry.lastAt ?? entry.at;
}

/** How many days since the last one of those. Undefined when there never was. */
export function daysSince(sim: Simulation, query: RecallQuery = {}): number | undefined {
  const last = lastTime(sim, query);
  return last ? Math.floor((sim.now - whenLast(last)) / MS_DAY) : undefined;
}

/** How many of a kind there have ever been. */
export function timesEver(sim: Simulation, query: RecallQuery = {}): number {
  const state = sim.universe.recall;
  if (!state) return 0;
  return state.entries
    .filter((one) => (query.cause === undefined || one.cause === query.cause)
      && (query.tags === undefined || query.tags.every((tag) => one.tags.includes(tag)))
      && (query.withId === undefined || (one.withIds?.includes(query.withId) ?? false)))
    .reduce((sum, one) => sum + (one.times ?? 1), 0);
}

/**
 * What one other person can be said to remember.
 *
 * The honesty rule, applied the other way round. A person can only bring up
 * something they were actually there for. Anything else would be the game
 * telling you they know a thing they were never told, which is the same fault
 * as showing you something your own character could not know.
 */
export function whatTheyKnow(sim: Simulation, personId: Id, limit = 12): Recollection[] {
  return recall(sim, { withId: personId, limit });
}

/** People you have not seen in a while, and how long it has been. */
export function notSeenLately(sim: Simulation, days = 45): { personId: Id; days: number }[] {
  const state = sim.universe.recall;
  if (!state) return [];
  const last = new Map<Id, number>();
  for (const one of state.entries) {
    for (const who of one.withIds ?? []) {
      const at = last.get(who);
      if (at === undefined || whenLast(one) > at) last.set(who, whenLast(one));
    }
  }
  const out: { personId: Id; days: number }[] = [];
  for (const [personId, at] of last) {
    const since = Math.floor((sim.now - at) / MS_DAY);
    const person = sim.universe.people[personId];
    if (since >= days && person && !person.isPlayer && person.tier !== 'dormant') {
      out.push({ personId, days: since });
    }
  }
  return out.sort((a, b) => b.days - a.days);
}

/**
 * The milestones that happened a whole number of years ago today.
 *
 * Read out of history rather than the recall, because an anniversary is by
 * definition a milestone, and history is the record that never prunes.
 */
export function anniversariesToday(sim: Simulation): { years: number; title: string; historyId: Id }[] {
  const today = new Date(sim.now);
  const out: { years: number; title: string; historyId: Id }[] = [];
  for (const record of sim.universe.history) {
    const then = new Date(record.at);
    if (then.getUTCMonth() !== today.getUTCMonth() || then.getUTCDate() !== today.getUTCDate()) continue;
    const years = today.getUTCFullYear() - then.getUTCFullYear();
    if (years < 1) continue;
    if (record.significance < 50) continue;
    out.push({ years, title: record.title, historyId: record.id });
  }
  return out.sort((a, b) => b.years - a.years);
}

/**
 * Something started and never finished.
 *
 * A thing said and not done, a course begun and not completed, a repair
 * booked and never mended. Each names the memory that opened it, so the game
 * can always say what it is talking about.
 */
export function openThreads(sim: Simulation): { opened: Recollection; days: number }[] {
  const state = sim.universe.recall;
  if (!state) return [];
  const CLOSES: Readonly<Record<string, readonly string[]>> = {
    'home.repair_booked': ['home.repaired'],
    'health.appointment_booked': ['health.appointment_completed', 'health.appointment_missed'],
    'exam.registered': ['exam.sat', 'exam.withdrawn'],
    'rel.date_scheduled': ['rel.date_resolved', 'date.closed', 'date.cancelled', 'date.they_cancelled', 'date.stood_up'],
    'shop.order_placed': ['shop.order_delivered', 'shop.returned'],
    'kit.hired': ['kit.returned', 'kit.lost'],
    'prop.offer_submitted': ['prop.offer_accepted', 'prop.offer_rejected'],
    'uni.applied': ['uni.accepted', 'uni.declined'],
    'shoot.planned': ['shoot.wrapped', 'shoot.abandoned'],
    'film.started': ['film.finished', 'film.abandoned'],
    'travel.trip_booked': ['travel.departed'],
  };
  const out: { opened: Recollection; days: number }[] = [];
  for (const one of state.entries) {
    const closers = CLOSES[one.cause];
    if (!closers) continue;
    const closed = state.entries.some((other) => other.at >= one.at
      && closers.includes(other.cause)
      && (one.subjectId === undefined || other.subjectId === one.subjectId));
    if (closed) continue;
    out.push({ opened: one, days: Math.floor((sim.now - one.at) / MS_DAY) });
  }
  return out.sort((a, b) => b.days - a.days);
}

/**
 * One memory said out loud.
 *
 * The names are resolved here rather than stored, so a shop that changed
 * hands or a person who changed their name reads correctly however long ago
 * it was.
 */
export function describe(sim: Simulation, entry: Recollection): string {
  const named = nameOf(sim, entry.subjectType, entry.subjectId);
  const said = named ? `${entry.what}: ${named}` : entry.what;
  return entry.times && entry.times > 1 ? `${said} (${entry.times} times that week)` : said;
}

function nameOf(sim: Simulation, type: string | undefined, id: Id | undefined): string | undefined {
  if (!type || !id) return undefined;
  const u = sim.universe;
  switch (type) {
    case 'person': return u.people[id]?.displayName;
    case 'property': return u.properties[id]?.addressLine;
    case 'asset': return u.assets[id]?.name;
    case 'vehicle': {
      const vehicle = u.vehicles[id];
      return vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : undefined;
    }
    default: return undefined;
  }
}

// ---------------------------------------------------------------------------
// Turning the event stream into a memory
// ---------------------------------------------------------------------------

function firstId(payload: Record<string, unknown>, keys: readonly string[]): Id | undefined {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return undefined;
}

function firstNumber(payload: Record<string, unknown>, keys: readonly string[]): number | undefined {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return undefined;
}

/** Everybody the payload says was there, however it happened to name them. */
function peopleIn(payload: Record<string, unknown>): Id[] | undefined {
  const found = new Set<Id>();
  const one = firstId(payload, PERSON_KEYS);
  if (one) found.add(one);
  for (const key of ['withIds', 'participantIds', 'peopleIds', 'guestIds']) {
    const value = payload[key];
    if (Array.isArray(value)) for (const each of value) if (typeof each === 'string') found.add(each);
  }
  return found.size > 0 ? [...found] : undefined;
}

/**
 * Every rule in the book, wired to the event that causes it.
 *
 * One listener per event rather than one that inspects everything, so a rule
 * costs nothing on the events it does not care about, and so an event with no
 * rule stays exactly as fast as it was.
 */
export function registerRecall(sim: Simulation): void {
  for (const rule of RECALLBOOK) {
    sim.onEvent(rule.event, 'recall.write', (event, { sim: s }) => {
      const payload = (event.payload ?? {}) as Record<string, unknown>;
      if (rule.onlyIf && payload[rule.onlyIf.key] !== rule.onlyIf.is) return;
      const subjectId = rule.subject ? firstId(payload, [rule.subject.key]) : undefined;
      remember(s, {
        kind: rule.kind,
        cause: rule.event,
        what: rule.what,
        weight: rule.weight,
        halfLifeDays: rule.halfLife,
        tags: [...rule.tags],
        withIds: peopleIn(payload),
        placeId: firstId(payload, PLACE_KEYS),
        locationId: s.player.currentLocationId,
        subjectType: subjectId && rule.subject ? rule.subject.type : undefined,
        subjectId,
        amount: firstNumber(payload, MONEY_KEYS),
      });
    }, 900);
  }
}

/** What is in the memory right now, for a screen that shows it. */
export interface RecallStats {
  entries: number;
  kept: number;
  oldestAt?: number;
  byTag: Record<string, number>;
  covered: number;
}

export function recallStats(sim: Simulation): RecallStats {
  const state = sim.universe.recall;
  const entries = state?.entries ?? [];
  const byTag: Record<string, number> = {};
  for (const one of entries) for (const tag of one.tags) byTag[tag] = (byTag[tag] ?? 0) + 1;
  return {
    entries: entries.length,
    kept: entries.filter((one) => one.weight >= NEVER_BELOW_HALF).length,
    oldestAt: entries[0]?.at,
    byTag,
    covered: RECALLBOOK.length,
  };
}
