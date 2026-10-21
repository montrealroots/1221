/**
 * SLATE — what a jump would stop at, foreseen (from 2026-10-20, the owner's brief 19, D5: brief 18's S5, brief 14's
 * `journeys-3`).
 *
 * On The Way, before the Advance menu moves the clock past a commitment, listed only what the timeline held. Some of what
 * a jump stops at isn't on it yet when the jump is asked for: the School puts each week's classes and work-study shift on
 * the calendar at six on the Sunday evening before (`planWeek`, `systems/school.ts`), so One Week from a Friday evening
 * asked nothing first, ran to Monday's nine o'clock classes and stopped there unannounced. Brief 14's banking journey
 * failed its step 8 on that from 2026-10-17 to this day, at both widths; the guide had said all along that a jump which
 * passes a commitment lists it first ("Moving Time On"), so the game was wrong, not the step.
 *
 * So the jump is played first on a copy of the save, Go answered at every stop as the stop's own button carries it on
 * (`carryOnTo`, `world/clock.ts`), and every stop it makes is listed beside what the calendar already holds. Nothing in
 * the save is touched: the copy is a separate world, opened from the save's own record (`loadSave`), and dropped. Its
 * draws are the save's, keyed as they are (`core/rng.ts`), so it stops where the jump will, for a player who goes to
 * each. A stop the copy makes that the calendar doesn't hold yet is said to be `foreseen`. Measured on a new life's first
 * Friday evening: a week ahead took 12 to 31 ms and found the five days of classes the calendar didn't hold yet.
 */

import { loadSave } from './index';
import type { Simulation } from './core/simulation';
import type { ScheduledItem } from './core/scheduler';
import { carryOnTo } from './world/clock';
import type { Instant } from './core/time';

/** A commitment a jump passes: the item, and whether it isn't on the calendar yet when the jump is asked for. */
export interface OnTheWay { item: ScheduledItem; foreseen: boolean }

/** The most stops a foreseen jump answers before it gives up: far more than a week of a student's calendar holds. */
const MOST_STOPS = 400;

/**
 * Every commitment a jump from now to `at` stops at, in order: those the calendar holds, and the stops the jump makes on
 * the way that aren't on it yet. A copy that can't be played (an error in a system) foresees nothing, and the calendar's
 * own are listed alone.
 */
export function onTheWay(sim: Simulation, at: Instant): OnTheWay[] {
  // From just after now: a commitment at this very moment is one the clock is standing at (Stand Here), and the next move
  // runs it at once with no stop (`advanceTo` stops only for what's due after where it starts), as the stop said it
  // would. On The Way counted it among the stops until 2026-10-20, and said the clock would stop at it.
  const held = sim.timeline.between(sim.now + 1, at - 1, (i) => i.category !== 'system' && i.requiresPlayer === true);
  const known = new Set(held.map((i) => i.id));
  const ahead: ScheduledItem[] = [];
  try {
    const copy = loadSave(structuredClone(sim.universe));
    let r = copy.advanceTo(at, { stopOnPlayerRequired: true });
    for (let n = 0; r.interruptedBy && n < MOST_STOPS; n += 1) {
      const item = r.interruptedBy;
      if (item.at < at && item.category !== 'system' && !known.has(item.id)) ahead.push(item);
      r = copy.advanceTo(carryOnTo({ item, wanted: at, sentFrom: r.sentFrom }, 'go')!, { stopOnPlayerRequired: true, resumes: r.sentFrom });
    }
  } catch {
    // Foreseen nothing: what the calendar holds is still listed.
  }
  return [...held.map((item) => ({ item, foreseen: false })), ...ahead.map((item) => ({ item, foreseen: true }))]
    .sort((a, b) => a.item.at - b.item.at);
}
