/**
 * SLATE — god mode.
 *
 * Sandbox used to be a stat editor: max the attributes, grant the traits, add
 * the money. This is the other half of it. With god mode on, nothing the
 * player asks the world for is refused — every audition books, every agency
 * signs, every offer, greenlight, pitch and purchase goes through — and every
 * room they walk into goes as well as a room can go.
 *
 * It is a declared cheat, and it stays declared. Every override is written
 * into the sandbox log and marked on the thing it touched, and the audit for
 * an overridden outcome still carries the honest calculation underneath it.
 * A save played this way can be recognised as one at a glance, which is the
 * whole difference between a sandbox and a lie.
 */

import type { Simulation } from '../core/simulation';

/** The top of every scale in the game. God mode does not raise it; it just
 *  puts the player there. */
export const REAL_CEILING = 100;

/** Whether the world should refuse this player anything. */
export function godMode(sim: Simulation): boolean {
  return sim.universe.sandbox.enabled && sim.universe.sandbox.godMode;
}

/**
 * What a score becomes once god mode has had it.
 *
 * The top of the real scale, and no higher: every formula in the game is built
 * for nought to a hundred, and feeding a bigger number into a curve like that
 * does not make a picture better, it makes the economics behind it wrong.
 */
export function transcend(sim: Simulation, score: number): number {
  return godMode(sim) ? REAL_CEILING : score;
}

/** Whether this person is the one god mode is being kind to. */
export function favoured(sim: Simulation, personId: string | undefined): boolean {
  return godMode(sim) && personId === sim.universe.playerId;
}

/**
 * Writes an override into the sandbox log.
 *
 * Called at every point where god mode changed an outcome, so the log reads
 * as a list of what the player was given rather than what they did.
 */
export function logOverride(sim: Simulation, what: string): void {
  const log = sim.universe.sandbox.log;
  log.push({ at: sim.now, action: `God mode: ${what}` });
  // A symptom log, not history. Keeps a long sandbox save from growing forever.
  if (log.length > 400) log.splice(0, log.length - 400);
}

/**
 * What a score is called out loud.
 *
 * One name for a person and another for a picture, because nobody calls an
 * actor a masterpiece and nobody calls a film the greatest of all time without
 * meaning something slightly different by it.
 */
export function ratingLabel(score: number, of: 'person' | 'work' = 'person'): string {
  if (score >= REAL_CEILING) return of === 'work' ? 'Masterpiece' : 'The Best There Is';
  if (score >= 85) return of === 'work' ? 'Outstanding' : 'Exceptional';
  if (score >= 70) return of === 'work' ? 'Strong' : 'Very Good';
  if (score >= 55) return of === 'work' ? 'Solid' : 'Good';
  if (score >= 40) return of === 'work' ? 'Mixed' : 'Fair';
  if (score >= 25) return of === 'work' ? 'Weak' : 'Poor';
  return of === 'work' ? 'A Disaster' : 'Not Working';
}
