/**
 * SLATE — the player's own "What To Improve Next" (from 2026-10-16): `recommendations` with the forecast of what each
 * input's hours would be worth (`trainingForecast`, `systems/advice.ts`). The brief's pane, the profile and the tools that
 * play a student read this one call, so what the screen advises is what a played student follows.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { MASTERED, type AbilityId } from '../content/abilities';
import { exerciseFor } from '../content/practice';
import { abilityFull, isAbility, levelOf } from './attributes';
import { identityOf } from './artistry';
import { practicedDaysAgo, recommendations, type Recommendation } from './experience';
import { matchedTier } from './practice';
import { trainingForecast } from './advice';

export function adviceFor(sim: Simulation, person: Person): Recommendation[] {
  return recommendations((id) => levelOf(sim, person, id as never), (id) => (isAbility(id as never) ? abilityFull(sim, person, id as AbilityId) : MASTERED), person.work ?? [], (id) => exerciseFor(id as never), matchedTier, 12, practicedDaysAgo(person, sim.now, sim.homeZone), identityOf(person).recurring, trainingForecast(sim, person));
}

/**
 * What held the last piece back most against what pays most to train now, where they aren't the same (from 2026-10-16):
 * the first is the piece's own chief limit, the second the forecast's. Nothing where they agree or there's no forecast.
 */
export function heldVersusNext(person: Person, recs: readonly Recommendation[]): string | undefined {
  const top = recs.find((r) => r.forecast);
  const last = person.work?.at(-1);
  const held = last?.limits.find((l) => l.kind === 'ability' || l.kind === 'technique');
  if (!top || !held || held.what === top.target) return undefined;
  const theirs = recs.find((r) => r.target === held.what);
  const said = theirs?.forecast ? `${theirs.forecast.hours} hours of it are forecast at about ${theirs.points} points a piece, against ${top.points} for ${top.label.toLowerCase()}` : `it would pay less to train than ${top.label.toLowerCase()}`;
  return `What held your last piece back most was ${held.label.toLowerCase()}, but it isn’t what pays most to train now: ${said}, which your recent work reads across more of it or has more room to grow in.`;
}
