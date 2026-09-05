/**
 * SLATE — god mode.
 *
 * Sandbox is a stat editor: max the attributes, grant the traits, add the
 * money. God mode is the other half of it — with it on, the world stops
 * refusing the player things. Every seller takes the offer, every profession
 * opens without the experience being spent, and every trait slot is available.
 *
 * It is a declared cheat, and it stays declared. Every override is written
 * into the sandbox log, and the audit for an overridden outcome still carries
 * the honest calculation underneath it and says what it would have been. A
 * save played this way can be recognised as one, which is the whole difference
 * between a sandbox and a lie.
 */

import type { Simulation } from '../core/simulation';

/** Whether the world should refuse this player anything. */
export function godMode(sim: Simulation): boolean {
  return sim.universe.sandbox.enabled && sim.universe.sandbox.godMode;
}

/** Whether this person is the one god mode is being kind to. */
export function favoured(sim: Simulation, personId: string | undefined): boolean {
  return godMode(sim) && personId === sim.universe.playerId;
}

/**
 * Writes an override into the sandbox log.
 *
 * Called at every point where god mode changed an outcome, so the log reads as
 * a list of what the player was given rather than what they did.
 */
export function logOverride(sim: Simulation, what: string): void {
  const log = sim.universe.sandbox.log;
  log.push({ at: sim.now, action: `God mode: ${what}` });
  // A symptom log, not history. Keeps a long sandbox save from growing forever.
  if (log.length > 400) log.splice(0, log.length - 400);
}
