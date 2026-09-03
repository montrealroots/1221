/**
 * SLATE — the world clock's relationship with the real one.
 *
 * Live is one to one: a minute of the player's evening is a minute of the
 * world's. The arithmetic that keeps that true lives here, apart from timers
 * and the DOM, so it can be proved rather than trusted.
 *
 * Two things make a real-time clock drift and this prevents both. Fractions
 * of a millisecond are carried rather than rounded away, so a thousand ticks
 * advance exactly a thousand ticks' worth. And a long gap — a tab left open
 * overnight, a laptop lid closed — is remembered in full and paid out in
 * bounded steps, so the world lives through every minute of it without the
 * browser freezing on one enormous frame.
 */

export interface ClockStepper {
  /** How much world time to advance for this much real time. Whole ms. */
  feed(elapsedRealMs: number): number;
  /** World time owed but not yet advanced. */
  readonly backlog: number;
}

/**
 * The most world time one tick may apply. Half an hour keeps a big backlog
 * from stalling the page while still draining a night in under a minute of
 * ticks.
 */
export const MAX_STEP_MS = 30 * 60 * 1000;

/**
 * A stepper for one speed.
 *
 * `multiplier` is world ms per real ms: 1 is live, 0 is paused, 60 is a
 * minute a second. Negative or non-finite values are treated as paused,
 * because time only moves forwards.
 */
export function createClockStepper(multiplier: number, maxStepMs = MAX_STEP_MS): ClockStepper {
  const rate = Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 0;
  const cap = Number.isFinite(maxStepMs) && maxStepMs > 0 ? maxStepMs : MAX_STEP_MS;
  let owed = 0;

  return {
    feed(elapsedRealMs: number): number {
      const elapsed = Number.isFinite(elapsedRealMs) && elapsedRealMs > 0 ? elapsedRealMs : 0;
      owed += elapsed * rate;
      const step = Math.floor(Math.min(owed, cap));
      if (step < 1) return 0;
      owed -= step;
      return step;
    },
    get backlog() {
      return owed;
    },
  };
}
