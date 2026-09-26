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
import type { Id } from '../domain/model';
import { CITIES } from '../content/geography';
import { formatTime, MS_DAY, MS_MINUTE, type Instant } from '../core/time';

/** The one scheduled kind a person can make for themselves. */
export const PLAN_KIND = 'life.commitment';

/**
 * The kinds of day a person can put on their own calendar.
 *
 * Not the whole legend: a holiday is a country’s and "world" is the
 * machinery. Those are things that happen to you. This one is the thing you
 * decide. There was a second, for family, and it went with the family.
 */
export const PLANNABLE = ['personal'] as const;
export type PlannableCategory = typeof PLANNABLE[number];

/** How short and how long a plan may be. A day is the ceiling. */
export const SHORTEST_MINUTES = 5;
export const LONGEST_MINUTES = 24 * 60;

/** How far ahead the calendar will take a plan. */
export const FURTHEST_AHEAD_DAYS = 365 * 5;

/** What a title may run to before it stops being a label. */
export const LONGEST_TITLE = 80;

export interface PlanSpec {
  title: string;
  at: Instant;
  durationMinutes?: number;
  category?: PlannableCategory;
  /** Where you have to be. Defaults to where you are when you make it. */
  locationId?: string;
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
  if (!Number.isFinite(minutes) || minutes < SHORTEST_MINUTES) {
    return { ok: false, error: 'That’s too short to be worth writing down. Give it five minutes at least.' };
  }
  if (minutes > LONGEST_MINUTES) {
    return { ok: false, error: 'That runs longer than a day. Put down the part you’ll actually be there for.' };
  }

  if (spec.category !== undefined && !PLANNABLE.includes(spec.category)) {
    return { ok: false, error: 'You can’t put that kind of day on the calendar yourself.' };
  }

  if (spec.locationId !== undefined && !CITIES.get(spec.locationId)) {
    return { ok: false, error: 'There’s nowhere by that name on the map.' };
  }

  return { ok: true };
}

/**
 * Registers the one handler and the three commands.
 *
 * The handler is what happens when the moment arrives. A plan you were in the
 * right place for is simply done — no notification, because the clock stopped
 * at it and you were looking straight at it. A plan somewhere you are not is
 * missed, and that is worth being told. So is one they were asleep for: the
 * Sleep dialog warned it would be slept through, and it was marked kept.
 */
export function registerPlans(sim: Simulation): void {
  sim.onSchedule(PLAN_KIND, (item, s) => {
    const player = s.universe.people[s.universe.playerId];
    const wanted = item.locationId;
    const inPlace = Boolean(player) && (!wanted || wanted === player!.currentLocationId);
    // Where they are is asked first, so the missed notice below still comes.
    // Asleep and here, it's missed quietly: a chosen night says for itself
    // what it slept through (`life.sleep`). The screen always stops at a plan,
    // and a stop wakes them, so this is the clock run over it on autopilot.
    const asleep = Boolean(player) && player!.awakeSince !== undefined && player!.awakeSince > item.at;
    if (player && inPlace && asleep) {
      item.status = 'missed';
      return;
    }
    if (inPlace || !player || !wanted) return;

    item.status = 'missed';
    const there = CITIES.get(wanted)?.name ?? 'somewhere else';
    const here = CITIES.get(player.currentLocationId)?.name ?? 'where you are';
    s.notify({
      category: 'personal',
      title: `You Missed ${item.label}`,
      body: `It wanted you in ${there} at ${formatTime(item.at, s.homeZone)}, and you were in ${here}.`,
      importance: 60,
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
      payload: {},
    });
    return { ok: true, id: item.id };
  });

  /**
   * You did not go.
   *
   * Only while it is actually happening — the clock has reached it and it is
   * still waiting on you. Before that the honest word is calling it off, and
   * the calendar says so rather than letting the two blur together.
   */
  sim.onCommand<{ entryId: Id }, PlanResult>('calendar.skip', (payload, { sim: s }) => {
    const item = s.timeline.get(payload.entryId);
    if (!item) return { ok: false, error: 'There’s nothing by that name on the calendar.' };
    if (item.kind !== PLAN_KIND) return { ok: false, error: 'That one isn’t yours to walk away from.' };
    if (item.status !== 'pending') return { ok: false, error: 'That’s already settled one way or the other.' };
    if (item.at > s.now) {
      return { ok: false, error: 'It hasn’t come round yet. Call it off instead.' };
    }
    item.status = 'missed';
    item.resolvedAt = s.now;
    s.notify({
      category: 'personal',
      title: `You Didn’t Go To ${item.label}`,
      body: 'Nobody was waiting on it but you, so it cost you nothing but the plan.',
      importance: 35,
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
    if (item.at <= s.now) {
      return { ok: false, error: 'It’s already started. You either went or you didn’t.' };
    }
    if (!s.timeline.cancel(item.id, s.now)) {
      return { ok: false, error: 'It wouldn’t come off the calendar.' };
    }
    return { ok: true, id: item.id };
  });
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
