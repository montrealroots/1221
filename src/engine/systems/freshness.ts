/**
 * SLATE — the world does not say the same thing twice.
 *
 * The dialogue library already keeps a line from being heard twice in a row.
 * This is the same discipline one level up, for the things that are not
 * lines: which memory gets brought back, which person the world nudges you
 * about, which of six ways a moment is framed, which decision Home raises.
 *
 * A beat gets a fingerprint. The register holds how often each has been
 * played and when. Choosing among options weights hard against what has been
 * played, refuses anything inside its cooldown, and — the part that actually
 * matters to how it feels — will never hand back the one it handed back last
 * time while any alternative exists at all.
 *
 * The register is a convenience, not truth. It is bounded, the oldest go
 * first, and nothing in the save depends on it being complete. Losing it
 * would make the world repeat itself for a while; it would not lose anything
 * that happened.
 */

import type { Simulation } from '../core/simulation';
import { MS_DAY } from '../core/time';
import { ensureRecall, MAX_PLAYED } from './recall';

/** One beat, named so the same beat is the same key wherever it is raised. */
export function fingerprint(kind: string, ...parts: (string | number | undefined)[]): string {
  return [kind, ...parts.filter((one) => one !== undefined && one !== '')].join(':');
}

/** How many times this beat has been played, and when it last was. */
export function timesPlayed(sim: Simulation, key: string): { n: number; at: number } | undefined {
  return sim.universe.recall?.played[key];
}

/** Whether it has been played inside the last so many days. */
export function playedWithin(sim: Simulation, key: string, days: number): boolean {
  const seen = timesPlayed(sim, key);
  return seen !== undefined && seen.at + days * MS_DAY > sim.now;
}

/** Writes down that a beat was played. Called from a command, never a view. */
export function markPlayed(sim: Simulation, key: string): void {
  const state = ensureRecall(sim);
  const seen = state.played[key];
  state.played[key] = { n: (seen?.n ?? 0) + 1, at: sim.now };
  const keys = Object.keys(state.played);
  if (keys.length > MAX_PLAYED) {
    const oldest = keys
      .sort((a, b) => state.played[a]!.at - state.played[b]!.at)
      .slice(0, keys.length - MAX_PLAYED);
    for (const key2 of oldest) delete state.played[key2];
  }
}

export interface Freshening<T> {
  /** What was chosen. Undefined only when there was nothing to choose from. */
  chosen?: T;
  /** How many were still fresh when it was chosen. */
  fresh: number;
  /** True when everything was stale and the least stale had to do. */
  reachedFor: boolean;
}

/**
 * Picks the freshest of some options, and writes down that it did.
 *
 * `cooldownDays` is how long a beat is off the table entirely. When
 * everything is inside its cooldown the least recently played is taken and
 * `reachedFor` says so, because the alternative — saying nothing at all — is
 * worse than saying the oldest thing again.
 */
export function freshest<T>(
  sim: Simulation,
  kind: string,
  options: readonly T[],
  keyOf: (one: T) => string,
  cooldownDays = 14,
  salt: string | number = '',
): Freshening<T> {
  if (options.length === 0) return { fresh: 0, reachedFor: false };

  const keyed = options.map((one) => ({ one, key: fingerprint(kind, keyOf(one)) }));
  const state = sim.universe.recall?.played ?? {};

  // The one played most recently of all is set aside outright: hearing the
  // same thing twice running is the failure this exists to prevent.
  let lastKey: string | undefined;
  let lastAt = -1;
  for (const entry of keyed) {
    const seen = state[entry.key];
    if (seen && seen.at > lastAt) { lastAt = seen.at; lastKey = entry.key; }
  }

  const fresh = keyed.filter((entry) => !playedWithin(sim, entry.key, cooldownDays));
  let pool = fresh.length > 0 ? fresh : keyed;
  if (pool.length > 1 && lastKey !== undefined) {
    const without = pool.filter((entry) => entry.key !== lastKey);
    if (without.length > 0) pool = without;
  }

  const rng = sim.rng('freshness', kind, String(salt), sim.now);
  const picked = rng.weighted(pool, (entry) => 1 / Math.pow(1 + (state[entry.key]?.n ?? 0), 1.5));
  markPlayed(sim, picked.key);
  return { chosen: picked.one, fresh: fresh.length, reachedFor: fresh.length === 0 };
}

/**
 * The same choice without writing anything down, for a screen that has to
 * show what is coming before a command has run.
 */
export function previewFreshest<T>(
  sim: Simulation, kind: string, options: readonly T[], keyOf: (one: T) => string, cooldownDays = 14,
): T | undefined {
  if (options.length === 0) return undefined;
  const state = sim.universe.recall?.played ?? {};
  const keyed = options.map((one) => ({ one, key: fingerprint(kind, keyOf(one)) }));
  const fresh = keyed.filter((entry) => !playedWithin(sim, entry.key, cooldownDays));
  const pool = fresh.length > 0 ? fresh : keyed;
  return [...pool].sort((a, b) => (state[a.key]?.n ?? 0) - (state[b.key]?.n ?? 0)
    || (state[a.key]?.at ?? 0) - (state[b.key]?.at ?? 0))[0]?.one;
}

/** How much of a set of beats is still unheard, for a checker or a screen. */
export function freshnessOf(sim: Simulation, kind: string, keys: readonly string[], cooldownDays = 14): {
  total: number; fresh: number; played: number;
} {
  const fresh = keys.filter((key) => !playedWithin(sim, fingerprint(kind, key), cooldownDays)).length;
  const played = keys.filter((key) => timesPlayed(sim, fingerprint(kind, key)) !== undefined).length;
  return { total: keys.length, fresh, played };
}

export const FRESHNESS_NOTE = 'The world keeps a register of every beat it has already '
  + 'played, so it doesn’t bring the same one up twice running. The register is bounded and '
  + 'isn’t part of what a save is: losing it would make the world repeat itself for a while, '
  + 'and would lose nothing that happened.';
