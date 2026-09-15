/**
 * SLATE — what already has the player, and until when.
 *
 * One question asked from both halves of the game, so it lives where both can
 * reach it and neither owns it. The performer's side asks before letting
 * somebody go up for a part. The producer's side asks before seating the player
 * in the family's own picture. They used to answer it differently: the room
 * checked, and `castSomebody` did not check at all, so Play It could put the
 * player in a part that shoots across one they had already won — and the only
 * hard constraint a perfect performer actually has was enforced in one
 * direction only.
 *
 * It is a diary and not a capacity. Nothing here is about how much work somebody
 * can stand; it is about a person being in one place at a time, which is the
 * one thing being the best there has ever been does nothing about.
 */

import type { Simulation } from '../core/simulation';
import type { Instant } from '../core/time';
import { MS_WEEK } from './lot';
import { baseWindowOf } from './periods';

/**
 * How long before the first day somebody is already spoken for.
 *
 * A fitting, a read-through and whatever else happens in the week before a
 * picture starts. It is the reason two parts that merely fail to overlap still
 * cannot both be taken.
 */
export const BEFORE_THE_FIRST_DAY = MS_WEEK;

export interface Taken {
  /** What has them, said the way a refusal would say it. */
  what: string;
  from: Instant;
  to: Instant;
}

/**
 * The first thing that has the player across this span, where anything does.
 *
 * Read off the engagements themselves rather than off the calendar, because the
 * calendar items are written from these and asking the derived copy would be a
 * second answer waiting to disagree with the first.
 */
export function whatHasThem(sim: Simulation, from: Instant, to: Instant): Taken | undefined {
  const me = sim.universe.playerId;

  for (const project of Object.values(sim.universe.projects)) {
    for (const seat of project.cast ?? []) {
      if (seat.personId !== me || seat.releasedAt !== undefined) continue;
      const role = project.roles?.find((one) => one.id === seat.roleId);
      if (!role) continue;
      const shoot = baseWindowOf(project);
      if (!shoot) continue;
      const opens = shoot.from - BEFORE_THE_FIRST_DAY;
      if (opens < to && from < shoot.to) {
        return { what: `${role.name} on ${project.title}`, from: opens, to: shoot.to };
      }
    }
  }

  for (const one of Object.values(sim.universe.auditions)) {
    if (one.why !== 'cast') continue;
    // The same week in front of it. Whose picture it is makes no difference to
    // whether somebody is already spoken for, and giving the lead-in to one of
    // these two branches and not the other would be this file answering its own
    // question twice — which is the thing it exists to stop.
    const opens = one.from - BEFORE_THE_FIRST_DAY;
    if (opens < to && from < one.to) {
      return { what: one.holder, from: opens, to: one.to };
    }
  }

  return undefined;
}

/** Whether the player could stand somewhere else across this span. */
export function theyAreFree(sim: Simulation, from: Instant, to: Instant): boolean {
  return whatHasThem(sim, from, to) === undefined;
}
