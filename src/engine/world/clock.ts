/**
 * SLATE — what the clock does at a stop, and where the Advance menu's lines land (from 2026-10-20, the owner's brief 19,
 * D1 and D2, which are brief 18's S1 and S2: the career's auditions, meetings and work days stop the clock, and an early
 * call must not be jumped past).
 *
 * Every way of moving the clock from a screen stops at a commitment that wants the player (`advanceTo` with
 * `stopOnPlayerRequired`), pauses the save (`halt`, `app/game-context.tsx`) and asks. Two answers are every commitment's:
 * - **Go:** you're there for it, and the jump carries on through its hours to where it was headed, or to the end of the
 *   commitment where that's later (`carryOnTo`).
 * - **Stand Here:** the jump ends at the stop, the clock paused, and the commitment starts the next time the clock moves.
 *
 * A kind of commitment may offer more, each a command of its own, declared here with `defineStop`: a plan of your own
 * offers Skip It (`calendar.skip`, `world/plans.ts`), a rehearsal with a partner Call It Off (`school.cancel_rehearsal`,
 * `systems/coursework.ts`). A kind that declares nothing offers Go and Stand Here alone, as the world's own always did.
 * A system can declare its kinds' choices from its own module, the way a career appointment's Ask To Move would be.
 *
 * What a choice does to the jump is one rule, said where it's offered: once its command has gone through, the commitment
 * is settled without you and the jump carries on to where it was headed, stopping again at the next commitment on the way
 * (`then: 'carry-on'`). A kind may say its choice ends the jump there instead (`then: 'stay'`); none does yet. A command
 * that refuses changes nothing: the stop stays open, the clock where it was, and the refusal is said. Until 2026-10-20
 * Skip It carried the jump on and Call It Off ended it, with neither said (brief 17's frame editor found it), and a
 * Skip It that was refused closed the stop and left the jump there.
 */

import type { AdvanceResult, CommandResult, Simulation } from '../core/simulation';
import type { ScheduledItem } from '../core/scheduler';
import { addDays, instantFromZoned, zonedParts, MS_MINUTE, type Instant, type TimeZone } from '../core/time';
import { PLAN_KIND } from './plans';
import { PARTNER_KIND } from '../systems/coursework';

/** One more answer a kind of commitment offers at its stop, beside Go and Stand Here. */
export interface StopChoice {
  /** The button's name, in Title Case: Skip It. */
  label: string;
  /** The command it runs, which is also the feature its button is gated by. */
  command: string;
  /** The command's payload, from the item the clock stopped at. */
  payload: (item: ScheduledItem) => Record<string, unknown>;
  /** What the jump does once the command has gone through: carries on to where it was headed, or ends at the stop. */
  then: 'carry-on' | 'stay';
  /** What it does, said after its name at the stop: "Skip It marks your plan missed, at no cost but the plan". */
  does: string;
  /** What On The Way says can be done, after "You can also": "skip a plan of your own". */
  ahead: string;
  /** The toast once it's done, where the command posts no notice of its own. */
  done?: string;
}

const STOPS = new Map<string, readonly StopChoice[]>();

/** A kind's choices at its stop. Declared once: a second declaration for a kind is a mistake, and throws. */
export function defineStop(kind: string, choices: readonly StopChoice[]): void {
  if (STOPS.has(kind)) throw new Error(`The stop for '${kind}' is already declared.`);
  STOPS.set(kind, choices);
}

/** What a kind of commitment offers at its stop beyond Go and Stand Here: nothing, unless it declared something. */
export const stopChoices = (kind: string): readonly StopChoice[] => STOPS.get(kind) ?? [];

/** Every command a stop's choice runs: the controls the stop gates (`tests/tutorial.test.ts` reads them). */
export const stopCommands = (): string[] => [...STOPS.values()].flatMap((choices) => choices.map((c) => c.command));

/** A stop: what the clock stopped at, where the jump was headed, and where it was sent from. */
export interface Stop { item: ScheduledItem; wanted: Instant; sentFrom: Instant }
export type Answer = 'go' | 'stand' | StopChoice;

/**
 * Where the jump goes after an answer, or nothing where it ends at the stop. Go goes through the commitment's own hours,
 * on to where the jump was headed if that's later: it went only to where it was headed until 2026-10-12, and a stop at a
 * bar shift with the evening asked for left the clock at six, halfway through the shift. A choice that carries on goes
 * to where the jump was headed.
 */
export function carryOnTo(stop: Stop, answer: Answer): Instant | undefined {
  if (answer === 'stand') return undefined;
  if (answer === 'go') return Math.max(stop.wanted, stop.item.at + (stop.item.durationMinutes ?? 0) * MS_MINUTE);
  return answer.then === 'carry-on' ? stop.wanted : undefined;
}

/** What went wrong with a choice's command, read alike for one that refused by throwing and one that answered `{ ok: false }`. */
export function refusalOf(result: CommandResult<unknown>): string | undefined {
  const fallback = 'That didn’t go through, and nothing was changed.';
  if (!result.ok) return result.error ?? fallback;
  const value = result.value as { ok?: unknown; error?: unknown } | undefined;
  return value && typeof value === 'object' && value.ok === false ? (typeof value.error === 'string' ? value.error : fallback) : undefined;
}

/**
 * A stop answered as its buttons answer it: the choice's command run, and the jump carried on or ended, by the rule
 * above. The screen does the same through the game's own `run` and `advanceTo` (`DueNow`, `ui/shell/TimeControls.tsx`),
 * which also pause the save at the next stop; this is the engine's half, for the journeys and the tests.
 */
export function answerStop(sim: Simulation, stop: Stop, answer: Answer): { refused?: string; result?: AdvanceResult } {
  if (typeof answer === 'object') {
    const refused = refusalOf(sim.execute({ kind: answer.command, payload: answer.payload(stop.item) }));
    if (refused) return { refused };
  }
  const to = carryOnTo(stop, answer);
  return to === undefined ? {} : { result: sim.advanceTo(to, { stopOnPlayerRequired: true, resumes: stop.sentFrom }) };
}

// ---------------------------------------------------------------------------------------------------------------------
// The kinds that offer more than Go and Stand Here
// ---------------------------------------------------------------------------------------------------------------------

defineStop(PLAN_KIND, [{
  label: 'Skip It',
  command: 'calendar.skip',
  payload: (item) => ({ entryId: item.id }),
  then: 'carry-on',
  does: 'marks your plan missed, at no cost but the plan',
  ahead: 'skip a plan of your own',
}]);

defineStop(PARTNER_KIND, [{
  label: 'Call It Off',
  command: 'school.cancel_rehearsal',
  payload: (item) => ({ assignmentId: item.payload.assignmentId, rehearsalId: item.payload.rehearsalId }),
  then: 'carry-on',
  does: 'calls the rehearsal off',
  ahead: 'call off a rehearsal with a partner, though at short notice that costs their trust',
  done: 'Rehearsal called off. At this short notice, it costs your partner’s trust.',
}]);

// ---------------------------------------------------------------------------------------------------------------------
// The Advance menu's lines
// ---------------------------------------------------------------------------------------------------------------------

/** The hours the Advance menu's lines go to, on the town's clock: This Evening, Tonight, Tomorrow Morning, Next Monday. */
export const ADVANCE_HOURS = { evening: 18, tonight: 22, morning: 7, monday: 9 } as const;

const todayAt = (now: Instant, zone: TimeZone, hour: number): Instant => {
  const p = zonedParts(now, zone);
  return instantFromZoned({ year: p.year, month: p.month, day: p.day, hour, minute: 0, second: 0 }, zone);
};

/**
 * The next time the clock reads `hour` o'clock: today's, if it's still to come, and otherwise the next day's. Tomorrow
 * Morning is the next seven o'clock (from 2026-10-20, the owner's brief 19, D2): pressed at 2 AM, it's that same date's
 * seven, five hours on. Until then it was always the next date's, and at 2 AM it jumped past the coming morning to the
 * one after it, a day and five hours on, running over every commitment that morning held (the frame editor's walk of
 * brief 17 found it).
 */
export function nextAtHour(now: Instant, zone: TimeZone, hour: number): Instant {
  const today = todayAt(now, zone, hour);
  return today > now ? today : addDays(today, 1, zone);
}

/** Nine o'clock next Monday: a Monday's is the Monday after it. */
export function nextMondayAt(now: Instant, zone: TimeZone, hour: number = ADVANCE_HOURS.monday): Instant {
  const weekday = zonedParts(now, zone).weekday;
  return addDays(todayAt(now, zone, hour), ((1 - weekday) + 7) % 7 || 7, zone);
}
