/**
 * SLATE — what you put on your own calendar.
 *
 * Everything else on the calendar is the world’s: a holiday it observes, a
 * commitment something else made for you. This is the other half — a person
 * deciding to be somewhere at a time, and the world holding them to it.
 *
 * A plan is an ordinary timeline item, so nothing about conflicts, skipping
 * to the next event, or the clock stopping when you are due had to be built
 * again: `requiresPlayer` already makes time advancement halt at the moment a
 * thing wants you, and `checkConflicts` already flags two things that want you
 * at once. What was missing was the way to make one.
 *
 * Kept deliberately small. A plan has a name, a time, a length, a kind and
 * somewhere to be. It is not an obligation the world enforces beyond noticing
 * you were not there.
 */

import type { Simulation } from '../core/simulation';
import type { Id, Person } from '../domain/model';
import { CITIES } from '../content/geography';
import { plural } from '../core/text';
import { MISSED_COOLS, TOGETHER_WARMS, bondFor, bondsOf, moveBond, otherIn } from './standing';
import { relationFrom } from './family';
import { formatTime, MS_DAY, MS_MINUTE, type Instant } from '../core/time';

/** The one scheduled kind a person can make for themselves. */
export const PLAN_KIND = 'life.commitment';

/**
 * The kinds of day a person can put on their own calendar.
 *
 * Not the whole legend: a holiday is a country’s, a birthday is somebody’s,
 * and "world" is the machinery. Those are things that happen to you. These
 * two are things you decide.
 */
export const PLANNABLE = ['personal', 'family'] as const;
export type PlannableCategory = typeof PLANNABLE[number];

/** How short and how long a plan may be. A day is the ceiling. */
export const SHORTEST_MINUTES = 5;
export const LONGEST_MINUTES = 24 * 60;

/** How far ahead the calendar will take a plan. */
export const FURTHEST_AHEAD_DAYS = 365 * 5;

/** What a title may run to before it stops being a label. */
export const LONGEST_TITLE = 80;

/** How many people one plan can be with. */
export const MOST_PEOPLE_ON_A_PLAN = 8;

export interface PlanSpec {
  title: string;
  at: Instant;
  durationMinutes?: number;
  category?: PlannableCategory;
  /** Where you have to be. Defaults to where you are when you make it. */
  locationId?: string;
  /**
   * Who it is with.
   *
   * A plan with nobody in it is a plan: an audition, an hour set aside, a
   * morning you meant to spend on something. A plan with somebody in it is the
   * other kind, and it is the only thing in the game that moves where you
   * stand with them — turning up is worth something and not turning up costs.
   */
  withIds?: Id[];
}

export interface PlanResult {
  ok: boolean;
  id?: Id;
  /** What was wrong, in the world’s words, for a screen to print as it is. */
  error?: string;
}

/** Whitespace collapsed and length capped, or nothing. */
function cleanTitle(raw: unknown): string {
  return typeof raw === 'string' ? raw.replace(/\s+/g, ' ').trim().slice(0, LONGEST_TITLE) : '';
}

/**
 * Whether a plan is one the calendar will take, and why not when it will not.
 *
 * Separate from the command so a screen can ask before it offers, rather than
 * letting somebody fill a form in and then telling them no.
 */
export function checkPlan(sim: Simulation, spec: Partial<PlanSpec>): PlanResult {
  const title = cleanTitle(spec.title);
  if (!title) return { ok: false, error: 'It needs a name — something you’d recognize on the day.' };

  const at = spec.at;
  if (typeof at !== 'number' || !Number.isFinite(at)) {
    return { ok: false, error: 'That isn’t a time.' };
  }
  if (at < sim.now) {
    return { ok: false, error: 'That’s already been and gone. Pick a time you can still get to.' };
  }
  if (at > sim.now + FURTHEST_AHEAD_DAYS * MS_DAY) {
    return { ok: false, error: 'That’s further out than the calendar goes.' };
  }

  const minutes = spec.durationMinutes ?? 60;
  if (!Number.isFinite(minutes) || minutes < SHORTEST_MINUTES || minutes > LONGEST_MINUTES) {
    return { ok: false, error: 'Nothing shorter than five minutes, and nothing longer than a day.' };
  }

  if (spec.category !== undefined && !PLANNABLE.includes(spec.category)) {
    return { ok: false, error: 'That isn’t a kind of day you can put on it yourself.' };
  }

  if (spec.locationId !== undefined && !CITIES.get(spec.locationId)) {
    return { ok: false, error: 'There’s nowhere by that name on the map.' };
  }

  const people = spec.withIds;
  if (people !== undefined) {
    if (!Array.isArray(people)) return { ok: false, error: 'That isn’t a list of people.' };
    if (people.length > MOST_PEOPLE_ON_A_PLAN) {
      return { ok: false, error: `That’s more than ${plural(MOST_PEOPLE_ON_A_PLAN, 'person', 'people')}. Make it two plans.` };
    }
    if (new Set(people).size !== people.length) {
      return { ok: false, error: 'Somebody is on that list twice.' };
    }
    for (const id of people) {
      if (id === sim.universe.playerId) {
        return { ok: false, error: 'You’re already going. That’s what makes it your plan.' };
      }
      const person = sim.universe.people[id];
      if (!person) return { ok: false, error: 'You don’t know anybody by that name.' };
      if (!bondFor(sim.universe, sim.universe.playerId, id)) {
        return { ok: false, error: `You don’t know ${person.firstName} well enough to make a plan with them.` };
      }
    }
  }

  return { ok: true };
}

/** The people a scheduled plan was made with, as ids the save still knows. */
export function peopleOn(item: { payload: Record<string, unknown> }): Id[] {
  const raw = item.payload.withIds;
  return Array.isArray(raw) ? raw.filter((id): id is Id => typeof id === 'string') : [];
}

/** The names of those people, in the order they were put on it. */
export function namesOn(sim: Simulation, item: { payload: Record<string, unknown> }): string[] {
  return peopleOn(item)
    .map((id) => sim.universe.people[id]?.firstName)
    .filter((name): name is string => name !== undefined);
}

/** A list of names with an "and" in it, the way a person says one. */
export function saidAsList(names: readonly string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0]!;
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]!}`;
}

/**
 * Registers the one handler and the two commands.
 *
 * The handler is what happens when the moment arrives. A plan you were in the
 * right place for is simply done — no notification, because the clock stopped
 * at it and you were looking straight at it. A plan somewhere you are not is
 * missed, and that is worth being told.
 *
 * Either way, anybody the plan was with finds out. That is the whole reason a
 * plan can have people on it: turning up is the only thing in the game that
 * warms a standing, and not turning up is the only thing that cools one on
 * purpose.
 */
export function registerPlans(sim: Simulation): void {
  sim.onSchedule(PLAN_KIND, (item, s) => {
    const player = s.universe.people[s.universe.playerId];
    const wanted = item.locationId;
    const people = peopleOn(item);
    const kept = Boolean(player) && (!wanted || wanted === player!.currentLocationId);

    if (kept) {
      for (const id of people) moveBond(s.universe, s.universe.playerId, id, TOGETHER_WARMS, s.now);
      return;
    }
    if (!player || !wanted) return;

    item.status = 'missed';
    for (const id of people) moveBond(s.universe, s.universe.playerId, id, -MISSED_COOLS, s.now);

    const there = CITIES.get(wanted)?.name ?? 'somewhere else';
    const here = CITIES.get(player.currentLocationId)?.name ?? 'where you are';
    const left = saidAsList(namesOn(s, item));
    s.notify({
      category: 'personal',
      title: `You Missed ${item.label}`,
      body: `It wanted you in ${there} at ${formatTime(item.at, s.homeZone)}, and you were in ${here}.${
        left ? ` ${left} noticed.` : ''}`,
      importance: left ? 70 : 60,
    });
  });

  sim.onCommand<PlanSpec, PlanResult>('calendar.schedule', (payload, { sim: s }) => {
    const checked = checkPlan(s, payload);
    if (!checked.ok) return checked;
    const player = s.universe.people[s.universe.playerId];
    const item = s.schedule({
      at: payload.at,
      kind: PLAN_KIND,
      label: cleanTitle(payload.title),
      category: payload.category ?? 'personal',
      requiresPlayer: true,
      durationMinutes: payload.durationMinutes ?? 60,
      locationId: payload.locationId ?? player?.currentLocationId,
      payload: payload.withIds?.length ? { withIds: [...payload.withIds] } : {},
    });
    return { ok: true, id: item.id };
  });

  sim.onCommand<{ entryId: Id }, PlanResult>('calendar.cancel', (payload, { sim: s }) => {
    const item = s.timeline.get(payload.entryId);
    if (!item) return { ok: false, error: 'There’s nothing by that name on the calendar.' };
    if (item.kind !== PLAN_KIND) {
      return { ok: false, error: 'That one isn’t yours to call off.' };
    }
    if (item.status !== 'pending') {
      return { ok: false, error: 'That’s already settled one way or the other.' };
    }
    return s.timeline.cancel(item.id, s.now)
      ? { ok: true, id: item.id }
      : { ok: false, error: 'That one wouldn’t come off the calendar.' };
  });
}

// ---------------------------------------------------------------------------
// Who a plan can be with
// ---------------------------------------------------------------------------

/** Somebody a plan can be made with, and what a screen needs to offer them. */
export interface Plannable {
  person: Person;
  /** What they are to the player, where they are anything. */
  relation?: string;
  /** Where the two of them stand, nought to a hundred. */
  closeness: number;
}

/**
 * Everybody a plan can be made with, closest first.
 *
 * The same rule `checkPlan` enforces, read the other way round: a plan can be
 * with anybody the player has a standing with, so this is that list. A screen
 * that offered anybody else would be offering something the calendar is about
 * to refuse.
 */
export function couldPlanWith(sim: Simulation): Plannable[] {
  const playerId = sim.universe.playerId;
  const out: Plannable[] = [];
  for (const bond of bondsOf(sim.universe, playerId)) {
    const person = sim.universe.people[otherIn(bond, playerId)];
    if (!person) continue;
    const relation = relationFrom(sim.universe, playerId, person.id);
    out.push({ person, closeness: bond.closeness, ...(relation ? { relation } : {}) });
  }
  return out;
}

/** Minutes, said the way a person says them. For a screen to offer. */
export const PLAN_LENGTHS: readonly { minutes: number; label: string }[] = [
  { minutes: 30, label: 'Half An Hour' },
  { minutes: 60, label: 'An Hour' },
  { minutes: 120, label: 'Two Hours' },
  { minutes: 240, label: 'Half A Day' },
  { minutes: 480, label: 'A Working Day' },
  { minutes: LONGEST_MINUTES, label: 'All Day' },
];

/** The end of a plan, for anything that needs to draw it. */
export const endOfPlan = (at: Instant, minutes: number): Instant => at + minutes * MS_MINUTE;
