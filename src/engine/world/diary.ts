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
import { sizeById } from '../content/casting';
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

/**
 * The last moment a part this size still has the player.
 *
 * A part scoped to the whole title has them for the whole run: a lead on a
 * nine-week picture cannot be anywhere else for nine weeks, because they are in
 * nearly all of it. A part scoped to one part of it does not, and `across` in
 * `content/casting.ts` has said which sizes are which since the sizes were
 * written. Until this, the diary was the reader that table never had, so a day
 * player on a fourteen-week feature was spoken for the whole fourteen weeks for
 * one scene — and every other ask that year was refused on their behalf.
 *
 * What a part-scoped engagement takes is `onScreen`, the share of the thing a
 * part this size is, against the run. A guest at 0.12 of a fourteen-week
 * feature is held two weeks; the same guest on a one-week commercial is held
 * the week. Never less than one week, because the week is the unit here and a
 * part taking none of it is a part nobody was cast in.
 *
 * There is no clamp at the far end and there must not be one, because no input
 * can reach it: every span handed to this function is a whole number of weeks —
 * `layOut` lays each period as `weeks * MS_WEEK` and `book` takes a stage for
 * `at + weeks * MS_WEEK` — and the largest `onScreen` on a part-scoped size is
 * the guest's 0.12. The one case where the answer is the whole span is a
 * one-week job, where the floor of one week already returns exactly `to`. A
 * guard nothing can trip is a line nothing reads, so the assumption is pinned
 * by a test instead, and the day somebody lays a period in days that test is
 * what says so.
 *
 * The same field prices the fee, and that is the point rather than a shortcut:
 * how much of a picture somebody is decides both what it pays them and how long
 * it keeps them.
 *
 * `onScreen` and not `weight`, although on the two part-scoped sizes the two
 * carry the same number today, so nothing here can tell them apart and no test
 * ever will. The choice is about meaning: `onScreen` is the share of the thing
 * a part is, which is the question a calendar asks, and `weight` is what
 * divides the money.
 *
 * WHICH weeks, it does not say: they are the first ones. The engine has no
 * opinion about when inside a run a small part is needed, and inventing one
 * would be a fact nothing else in the build could honor — so the held week
 * sits where the calendar already anchors, against the lead-in. A day player is
 * therefore free late in a picture they are technically still on, which is a
 * simplification and not an oversight.
 */
export function heldUntil(sizeId: string | undefined, from: Instant, to: Instant): Instant {
  const size = sizeById(sizeId ?? '');
  if (!size || size.across === 'title') return to;
  const whole = Math.max(1, Math.round((to - from) / MS_WEEK));
  return from + Math.max(1, Math.round(whole * size.onScreen)) * MS_WEEK;
}

export interface Taken {
  /** What has them, said the way a refusal would say it. */
  what: string;
  from: Instant;
  to: Instant;
}

/**
 * The first thing that has the player across this span, where anything does.
 *
 * The player, and only ever the player, whoever is asking: there is no person
 * argument, and both loops below match on `universe.playerId`. That is worth
 * saying out loud because `dailyRollover` calls this inside a loop over every
 * person in the save, gated on `person.isPlayer` — drop that gate and every
 * parent in the house is credited with the player's shoot days. A proposal to
 * make fitness a lever did exactly that, and the parents got fit whenever the
 * player worked.
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
      // The whole run first, and only then what this size actually holds. This
      // is asked once a day against every record a save has ever made, and
      // `heldUntil` is never past `shoot.to`, so anything the full span rejects
      // the short one rejects too. Costing the lookup before the reject is what
      // turned the ten-year endurance run superlinear.
      if (opens >= to || from >= shoot.to) continue;
      const until = heldUntil(role.size, shoot.from, shoot.to);
      if (from < until) {
        return { what: `${role.name} on ${project.title}`, from: opens, to: until };
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
    if (opens >= to || from >= one.to) continue;
    const until = heldUntil(one.size, one.from, one.to);
    if (from < until) {
      return { what: one.holder, from: opens, to: until };
    }
  }

  return undefined;
}

/** Whether the player could stand somewhere else across this span. */
export function theyAreFree(sim: Simulation, from: Instant, to: Instant): boolean {
  return whatHasThem(sim, from, to) === undefined;
}
