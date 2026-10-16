/**
 * SLATE — a piece of work judged in its parts (from 2026-10-12; `systems/piece.ts`).
 *
 * Until then a take, a scene shown in class and a night on stage were each one judgment, as if the whole were played
 * at once: a brief's beats only counted how many times its tone changed, and a night had no first half and second.
 * The owner's brief of 2026-10-12 asked for the whole piece, beats and scenes, to be evaluated: whether the character
 * is sustained, the transitions, continuity, stamina, and recovery from a mistake, with nothing counted twice.
 *
 * So a piece is cut into segments (a brief's beats, a scene's tones in order, a play's movements, two at least), and
 * each is judged by the one evaluation every piece of work goes through, with four things of its own:
 * - **its tones**, which lean its dimensions (`TONE_LEAN`, normalized as every lean is): a comic beat weighs timing and
 *   response, a grave one belief;
 * - **its rehearsal**: the piece's own rehearsal, and whatever focused work went into that segment, so working a beat
 *   makes that beat more secure. A segment a turn leads into, or one held two ways at once, asks a little more of it
 *   (`perTurn`, `perBlend`, where the kind of work sets them);
 * - **where it falls**: stamina is read as a drain growing through the piece, with its load (`drain`), in place of the
 *   share of consistency it had, so a stamina that can't hold costs the late beats and not the first;
 * - **a slip before it**: a segment that came out well under what it was expected to (`slipAt`) carries some of it into
 *   the next, less as composure and adaptability recover it (`rattle`).
 *
 * The piece's result is the mean of its segments, weighted by their length. At full abilities, mastered techniques,
 * complete preparation, a sufficient day and a choice that fits, every segment is 100, so the piece is; there is no
 * draw at mastery, so there is no slip. Continuity, how evenly the character held across the segments, is read from the
 * segments and shown, and isn't added to the result: it's what the segments already are.
 *
 * Every size here is SLATE's estimate. The shape is the rehearsal room's (a scene worked in units, a run that tires),
 * not a measured one.
 */

import type { Dimension } from './tasks';
import type { Tone } from './material';

/** How a segment's tones lean its dimensions, multiplied in and normalized: a lean moves weight, never adds it. */
export const TONE_LEAN: Readonly<Record<Tone, Partial<Record<Dimension, number>>>> = {
  comic: { responsiveness: 1.15, execution: 1.1 },
  grave: { believability: 1.15, consistency: 1.05 },
  lyric: { interpretation: 1.1, connection: 1.1 },
  grotesque: { execution: 1.1, interpretation: 1.1 },
};

export const PIECE = {
  /**
   * The stamina drain at the last segment of a brief or scene of load 1, and at the curtain's fall of a night whose work
   * so far reaches `WORKLOAD.full` (from 2026-10-16, brief 10), by an actor with none on a good day: a factor of 1 − drain
   * on what tiring reaches.
   *
   * SLATE's choice, balanced through testing as brief 10's section 4 asks of the workload's coefficients: it was 0.3
   * until later on 2026-10-16. At 0.3, on the integrated code, the stamina specialist (85, the other eleven at 515/11,
   * H4-R's budget) owned one of the 797 pieces H4-R reads and was ahead on none, and no kind of work moved stamina by 0.5
   * a +10 on average (A1). Tried on those 797 pieces: 0.35 gave stamina 6 pieces of its own, scenes only; 0.37 gave 12 in
   * two kinds (briefs 5, scenes 7), ahead on 11, median 0.63, a brief's mean effect 0.511; 0.4 gave 37 (briefs 24, scenes
   * 13), ahead on all 37, median 0.81, a brief's mean effect 0.552, a scene's 0.533, with H2 and H5 holding and memory's
   * own work 119 pieces to 111. 0.4 was taken: a third more than it was, and a margin over each target. A night's drain
   * reaches all of it at `WORKLOAD.full`, which went to 4/3 of itself with it, so a night short of the anchor there drains
   * as it did (that comment says why); with `WORKLOAD.full` as it was, the specialist led a whole night as a lead in 5 of
   * the 30 plays, and now in none (the closest, −0.21, where it was −0.28). `WORKLOAD.full` at 0.6 of itself, the other
   * way to a deeper drain, reached A1 on nights alone (0.552) and left stamina one piece of its own, a scene: on no night
   * is stamina the largest input (docs/verification/decisions-2026-10-16/integrated/after/README.md).
   */
  drain: 0.4,
  /** A segment this many points under what it was expected to come to, with no draw, is a slip. */
  slipAt: 3,
  /** The share of a slip carried into the next segment, before composure and adaptability recover it. */
  rattle: 0.5,
  /** What a brief's segment asks of rehearsal more, for a turn into it and for being held two ways. */
  brief: { perTurn: 0.15, perBlend: 0.08 },
  /** A scene's, against coursework's complete; never past what preparation can reach. */
  scene: { perTurn: 0.05, perBlend: 0, most: 0.95 },
  /**
   * How hard a brief or a scene is on stamina, 0 to 1: a base for its kind and length, and a share for each level of the
   * body's and the voice's work it stages, a few minutes of it.
   *
   * From 2026-10-16 by length as well as by the body and the voice: a long brief 0.35 where it was 0.3, and a night 0.6
   * and 0.12 a level where it was 0.4 and 0.1. Measured on the 427 pieces (phase-2b.md §3), a night, two or three hours
   * on stage, drew less of stamina's effect (+0.43 for +10) than a short brief built on a fight, and a light scene's
   * stamina came to a tenth of a point or under, which is kept: it's a few minutes, and stamina shouldn't decide it.
   *
   * Later on 2026-10-16 (brief 10) a night's load went from here: it read neither the play's length nor the part's size,
   * so a one-act was a whole evening and a featured part its lead. A night's drain is its workload since
   * (`content/workload.ts`, `systems/workload.ts`).
   */
  load: { brief: 0.1, briefMedium: 0.2, briefLong: 0.35, scene: 0.15, perLevel: 1 / 6 },
} as const;
