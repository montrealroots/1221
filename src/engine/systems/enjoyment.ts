/**
 * SLATE — doing what you love.
 *
 * The one place the engine reads somebody's interests, and the owner's rule
 * for it, set on 2026-09-24: an interest may change how much somebody gets
 * out of doing a thing, never how good they are at it. Loving to cook makes a
 * meal more satisfying; it doesn't make the meal bigger. So what this decides
 * is mood and stress, and nothing else: not fitness, not energy, not food.
 * `tests/cohesion.test.ts` holds that nothing else in the engine reads the
 * interests, and `tests/looking-after.test.ts` that this moves only those two.
 *
 * Until then nothing read them at all. The rule was that the moment the
 * engine branched on them they would stop being who somebody is and start
 * being a stat, and this keeps the part of that which mattered.
 *
 * The genres and the crafts waited for the film career, under the same rule,
 * until 2026-09-27: a day on a job whose medium, genre or place somebody
 * loves lifts the mood and eases the stress, and the performance is no
 * better for it. The same day, three dispositions nothing read got the same
 * kind of reader: extraversion how the room is taken, openness the road, and
 * agreeableness the company of a rehearsal. None of them makes anybody better
 * at anything either.
 */

import type { Person } from '../domain/model';
import { clamp } from '../core/rng';
import type { LookAfter } from './life';
import { personalityOf } from './personality';
import { PRODUCT_INTEREST } from '../content/career';

/** Which of what somebody cares about each thing they can do for themselves is. */
const LOVED_IN: Record<LookAfter, readonly string[]> = {
  eat: ['cooking'],
  order: [],
  wash: [],
  bathe: [],
  exercise: ['fitness', 'sport'],
  swim: ['fitness', 'sport'],
  outside: ['nature'],
  laundry: ['fashion'],
  tidy: ['design'],
  // An hour to yourself goes on what you'd spend an evening on.
  unwind: ['art', 'design', 'film', 'games', 'history', 'music', 'photography', 'technology', 'television', 'theatre', 'writing'],
};

/** How much more of the mood, and of the stress relief, an hour gives somebody who loves it. */
export const LOVED_MOOD = 1.5;
export const LOVED_RELIEF = 1.25;

/** The interests of theirs this is, by id, in the order the list above gives them. */
export function lovedIn(person: Pick<Person, 'interests'>, action: LookAfter): string[] {
  const theirs = person.interests ?? [];
  return LOVED_IN[action].filter((id) => theirs.includes(id));
}

/** A day's work as enjoyment sees it: what it is, what it's filed under, and whether it's away from home. */
export interface WorkDay {
  medium: 'screen' | 'stage' | 'voice';
  after?: 'tv' | 'film' | 'commercial';
  genre?: string;
  /** A commercial's product, which may speak to an interest (`PRODUCT_INTEREST`). */
  product?: string;
  away: boolean;
}

/**
 * What of somebody's a day's work is: television or film for a screen job,
 * theater for the stage, voice acting for a voice job, travel for a job
 * away, the job's genre if it's among theirs, and a commercial's product
 * where it speaks to an interest: a car for Cars, a fashion brand for
 * Fashion, travel and the outdoors for Nature, pets for Animals, a campaign
 * for Politics. Until 2026-09-28 those five interests were said back and
 * nothing more.
 */
export function lovedInWork(person: Pick<Person, 'interests' | 'genres'>, day: WorkDay): string[] {
  const theirs = person.interests ?? [];
  const out: string[] = [];
  const medium = day.medium === 'stage' ? 'theatre' : day.medium === 'voice' ? 'voice_acting' : day.after === 'tv' ? 'television' : day.after === 'film' ? 'film' : undefined;
  if (medium && theirs.includes(medium)) out.push(medium);
  if (day.away && theirs.includes('travel')) out.push('travel');
  if (day.genre && (person.genres ?? []).includes(day.genre)) out.push(day.genre);
  const product = day.product ? PRODUCT_INTEREST[day.product] : undefined;
  if (product && theirs.includes(product)) out.push(product);
  return out;
}

/** What each loved thing about a day's work gives the mood and takes off the stress: SLATE's estimate. */
export const LOVED_WORK = { mood: 1.5, relief: 1.5 } as const;

/**
 * How somebody's disposition takes the work, SLATE's estimate: an audition in
 * the room is up to 4 points of stress more for the most introverted and 4
 * less for the most extraverted; a day away from home up to 2 of morale
 * either way by openness; a day of rehearsal up to 2 either way by
 * agreeableness. Fifty is neither.
 */
export const DISPOSED = { room: 4, away: 2, rehearsal: 2 } as const;

const lean = (axis: number | undefined) => ((axis ?? 50) - 50) / 50;

/** A day's work, enjoyed or not: the loved things in it, the road by openness, and a rehearsal by agreeableness. */
export function enjoyWork(person: Person, day: WorkDay & { rehearsal?: boolean }): void {
  const w = person.wellbeing;
  const loved = lovedInWork(person, day).length;
  let mood = loved * LOVED_WORK.mood;
  if (day.away) mood += DISPOSED.away * lean(person.personality?.openness);
  if (day.rehearsal) mood += DISPOSED.rehearsal * lean(person.personality?.agreeableness);
  w.morale = clamp(w.morale + mood, 0, 100);
  w.stress = clamp(w.stress - loved * LOVED_WORK.relief, 0, 100);
}

/**
 * What a turn in the career or at school does to the mood and the stress,
 * SLATE's estimate: a booking or an agency is a lift, being let go or
 * replaced a blow, a dismissal the worst of them and the degree the best.
 * Morale moves by the temperament's swing, stress by how it gains. Until
 * 2026-09-27 none of them moved anything, and the only work that touched
 * the mood was a day of it.
 */
export const TURNS = {
  booked: { morale: 6, stress: -2 },
  signed: { morale: 8, stress: -3 },
  pickedUp: { morale: 6, stress: -2 },
  graduated: { morale: 12, stress: -6 },
  concern: { morale: -3, stress: 3 },
  recast: { morale: -5, stress: 3 },
  canceled: { morale: -6, stress: 3 },
  warning: { morale: -6, stress: 6 },
  dropped: { morale: -8, stress: 6 },
  replaced: { morale: -10, stress: 8 },
  dismissed: { morale: -20, stress: 15 },
} as const;

/** A turn, felt. */
export function feel(person: Person, turn: keyof typeof TURNS): void {
  const w = person.wellbeing;
  const { morale, stress } = TURNS[turn];
  w.morale = clamp(w.morale + morale * personalityOf(person, 'moraleSwing'), 0, 100);
  w.stress = clamp(w.stress + (stress > 0 ? stress * personalityOf(person, 'stressGain') : stress), 0, 100);
}

/** An audition in the room, taken as the disposition takes it. A self-tape, made alone, takes nothing. */
export function takeTheRoom(person: Person): void {
  const w = person.wellbeing;
  w.stress = clamp(w.stress - DISPOSED.room * lean(person.personality?.extraversion), 0, 100);
}
