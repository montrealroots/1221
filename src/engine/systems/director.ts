/**
 * SLATE — the part that brings things back up.
 *
 * A memory nobody ever mentions is a database. What makes a world feel like
 * it has a mind is that it raises things: the promise you made and did not
 * keep, the friend you have not seen since March, the repair you booked in
 * February and never had done, the thing that happened a year ago today.
 *
 * That is all this does, once a day. It reads the recall for what is live,
 * scores it, runs it through the freshness register so the same nudge never
 * arrives twice running, and raises at most a few — through the paths that
 * already exist, so a beat is an ordinary notice or an ordinary decision and
 * behaves like one.
 *
 * Two rules hold it honest, and the checker enforces both. Every beat cites
 * the thing that caused it — a real recollection id or a real history record
 * id — so the game can always say why and can never invent a memory. And a
 * beat about somebody is only raised for somebody who was actually there,
 * because a person who brings up a thing they were never told is the same
 * fault as showing you something your character could not know.
 */

import type { Simulation } from '../core/simulation';
import type { Id, Recollection } from '../domain/model';
import { MS_DAY } from '../core/time';
import { plural } from '../core/text';
import { freshest, markPlayed, playedWithin, timesPlayed } from './freshness';
import {
  anniversariesToday, daysSince, describe, notSeenLately, openThreads, recall, timesEver, worthNow,
} from './recall';

/** How many things the world brings up on one day, at the very most. */
export const BEATS_A_DAY = 2;

/** A beat of the same kind does not come round again inside this. */
export const BEAT_COOLDOWN_DAYS = 21;

export type BeatKind = 'anniversary' | 'unfinished' | 'not_seen' | 'streak' | 'long_time';

export interface Beat {
  kind: BeatKind;
  title: string;
  detail: string;
  /** How much it is worth raising, 0-100. */
  worth: number;
  /** Where to act on it. */
  route: string;
  /**
   * What caused it. Exactly one of these is set, and it resolves to a real
   * record in this save. A beat that cannot say why does not get raised.
   */
  becauseRecallId?: Id;
  becauseHistoryId?: Id;
  /** Who it is about, when it is about somebody. */
  personId?: Id;
}

/** The key a beat is remembered by, so the same beat does not repeat. */
export function keyOf(beat: Beat): string {
  return [beat.kind, beat.personId ?? '', beat.becauseRecallId ?? beat.becauseHistoryId ?? ''].join('|');
}

/**
 * Everything the world could reasonably bring up today.
 *
 * Reads only; raising is separate, so a screen can show what is live without
 * consuming it.
 */
export function liveBeats(sim: Simulation): Beat[] {
  const out: Beat[] = [];

  // A year to the day. Read out of history, which is the milestone record and
  // never prunes, so an anniversary is always available however old the save.
  // One a day: several things happened on the same date in different years,
  // and three notices all saying "a year ago today" is noise, not memory.
  const anniversary = anniversariesToday(sim)[0];
  if (anniversary) {
    out.push({
      kind: 'anniversary',
      title: `${plural(anniversary.years, 'Year', 'Years')} Ago Today`,
      detail: `${anniversary.title}. It was ${plural(anniversary.years, 'year')} ago today.`,
      worth: Math.min(95, 55 + anniversary.years * 5),
      route: '/workspace/history',
      becauseHistoryId: anniversary.historyId,
    });
  }

  // Started and never finished. The oldest first, because that is the one
  // that has been nagging longest.
  for (const one of openThreads(sim).slice(0, 4)) {
    if (one.days < 14) continue;
    out.push({
      kind: 'unfinished',
      title: 'Still Not Done',
      detail: `${describe(sim, one.opened)}, ${plural(one.days, 'day')} ago, and nothing since.`,
      worth: Math.min(88, 40 + one.days),
      route: '/home',
      becauseRecallId: one.opened.id,
    });
  }

  // Somebody you have not seen. Only people the recall says you were actually
  // with, so this can never be about a stranger.
  for (const one of notSeenLately(sim, 45).slice(0, 4)) {
    const person = sim.universe.people[one.personId];
    if (!person) continue;
    const last = recall(sim, { withId: one.personId, limit: 1 })[0];
    if (!last) continue;
    out.push({
      kind: 'not_seen',
      title: `You Have Not Seen ${person.displayName}`,
      detail: `${plural(one.days, 'day')} since ${describe(sim, last).toLowerCase()}.`,
      worth: Math.min(80, 30 + Math.floor(one.days / 3)),
      route: '/workspace/relationships',
      becauseRecallId: last.id,
      personId: one.personId,
    });
  }

  // Something you have kept doing. Worth saying out loud, because a streak
  // nobody notices is not a streak.
  for (const tag of ['training', 'track', 'work', 'school'] as const) {
    const times = recall(sim, { tags: [tag], since: sim.now - 30 * MS_DAY, limit: 60 });
    if (times.length < 12) continue;
    const newest = times.reduce((best, one) => (one.at > best.at ? one : best), times[0]!);
    out.push({
      kind: 'streak',
      title: 'You Have Kept At It',
      detail: `${plural(times.length, 'time')} in the last month.`,
      worth: Math.min(70, 30 + times.length),
      route: '/workspace/character',
      becauseRecallId: newest.id,
    });
  }

  // Something you used to do and stopped.
  //
  // Two guards, both learned the hard way. It has to be something really
  // done — four times or more — because one meeting at the start of a save
  // is not a habit anybody dropped. And it is said at most three times: a
  // world that raises the same regret every three weeks forever is nagging,
  // not remembering.
  for (const tag of ['training', 'track', 'film', 'people'] as const) {
    const since = daysSince(sim, { tags: [tag] });
    if (since === undefined || since < 90) continue;
    if (timesEver(sim, { tags: [tag] }) < 4) continue;
    const last = recall(sim, { tags: [tag], limit: 1 })[0];
    if (!last) continue;
    const beat: Beat = {
      kind: 'long_time',
      title: 'It Has Been A While',
      detail: `${plural(since, 'day')} since the last of it: ${describe(sim, last).toLowerCase()}.`,
      worth: Math.min(75, 25 + Math.floor(since / 6)),
      route: '/home',
      becauseRecallId: last.id,
    };
    if ((timesPlayed(sim, `beat:${keyOf(beat)}`)?.n ?? 0) >= 3) continue;
    out.push(beat);
  }

  return out.sort((a, b) => b.worth - a.worth);
}

/**
 * Raises the day's beats, and writes down that it did.
 *
 * Called from the day's own schedule inside a command context, never from a
 * view, because bringing something up is a thing the save remembers.
 */
export function runTheDay(sim: Simulation): Beat[] {
  const live = liveBeats(sim).filter((beat) => !playedWithin(sim, `beat:${keyOf(beat)}`, BEAT_COOLDOWN_DAYS));
  if (live.length === 0) return [];

  const raised: Beat[] = [];
  const pool = [...live];
  for (let i = 0; i < BEATS_A_DAY && pool.length > 0; i++) {
    // Weighted away from what has been raised before, and never the same one
    // as last time while any other exists.
    const picked = freshest(sim, 'beat', pool, keyOf, BEAT_COOLDOWN_DAYS, i);
    const beat = picked.chosen;
    if (!beat) break;
    pool.splice(pool.indexOf(beat), 1);
    if (!beat.becauseRecallId && !beat.becauseHistoryId) continue;
    sim.notify({
      category: 'life',
      title: beat.title,
      body: beat.detail,
      importance: beat.worth,
      route: beat.route,
      refType: beat.becauseRecallId ? 'recall' : 'history',
      refId: beat.becauseRecallId ?? beat.becauseHistoryId,
    });
    raised.push(beat);
  }
  return raised;
}

/**
 * The memory behind a beat, resolved.
 *
 * The whole point of citing a cause is that it can be looked up. When this
 * returns nothing, the beat was talking about something that is not in the
 * record, and the checker fails the build rather than letting it ship.
 */
export function causeOf(sim: Simulation, beat: Beat): Recollection | { historyTitle: string } | undefined {
  if (beat.becauseRecallId) {
    return sim.universe.recall?.entries.find((one) => one.id === beat.becauseRecallId);
  }
  if (beat.becauseHistoryId) {
    const record = sim.universe.history.find((one) => one.id === beat.becauseHistoryId);
    return record ? { historyTitle: record.title } : undefined;
  }
  return undefined;
}

export function registerDirector(sim: Simulation): void {
  sim.onSchedule('director.day', (_item, s) => {
    runTheDay(s);
    scheduleTomorrow(s);
  });

  // A day passing is what makes the world think about yesterday.
  sim.onEvent('world.day_rollover', 'director.wake', (_event, { sim: s }) => {
    const already = s.universe.scheduled.some((one) => one.kind === 'director.day' && one.status === 'pending');
    if (!already) scheduleTomorrow(s);
  }, 950);
}

/** Tomorrow morning, once, at a time somebody would be awake. */
export function scheduleTomorrow(sim: Simulation): void {
  const at = Math.floor(sim.now / MS_DAY) * MS_DAY + MS_DAY + 8 * 60 * 60 * 1000;
  sim.schedule({
    at,
    kind: 'director.day',
    label: 'What The World Brings Up',
    category: 'personal',
    payload: {},
    priority: 20,
  });
}

/** What the loop is, and what it is not, for a screen that shows it. */
export const DIRECTOR_NOTE = 'Once a day the world looks back over what it remembers and '
  + 'brings up at most two things: a year to the day, something started and never finished, '
  + 'somebody you haven’t seen, something you have kept at, something you stopped. Every one '
  + 'of them names the record it came from, so the game can always say why it said that.';

export const DIRECTOR_LIMITS_NOTE = 'It can’t bring up something that isn’t in the record, '
  + 'and it won’t raise the same thing twice inside three weeks. It isn’t a writer and '
  + 'there’s no model behind it: it chooses among things that really happened, and says them '
  + 'in the words the memory was filed under.';

export { markPlayed, worthNow };
