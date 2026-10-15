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
