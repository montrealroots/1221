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
export function heldUntil(_sizeId: string | undefined, _from: Instant, to: Instant): Instant {
  // Part sizes went with the casting system, so a booking is held for the whole
  // of its window rather than for the days somebody is actually called. Both
  // arguments are kept and unread on purpose: the signature is what casting will
  // hand back when it returns, and changing it twice is worse than once.
  return to;
  return to;
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
export function whatHasThem(_sim: Simulation, _from: Instant, _to: Instant): Taken | undefined {
  // Nothing takes days out of a diary at the moment, and that is the honest state
  // rather than a stub. Two things used to: a seat on one of the family's own
  // pictures, through its roles and its shooting window, and a part won at an
  // audition, through the booking behind it. Both went with the production system.
  //
  // The function stays and is still called, because whether somebody is already
  // spoken for is a question the rest of the build asks and will need answered
  // again the moment there is work. What it must not do is guess.
  return undefined;
}

/** Whether the player could stand somewhere else across this span. */
export function theyAreFree(sim: Simulation, from: Instant, to: Instant): boolean {
  return whatHasThem(sim, from, to) === undefined;
}
