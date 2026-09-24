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
 * The genres and the crafts wait for the film career, under the same rule.
 */

import type { Person } from '../domain/model';
import type { LookAfter } from './life';

/** Which of what somebody cares about each thing they can do for themselves is. */
const LOVED_IN: Record<LookAfter, readonly string[]> = {
  eat: ['cooking'],
  wash: [],
  exercise: ['fitness', 'sport'],
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
