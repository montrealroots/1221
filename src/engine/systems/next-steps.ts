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
import { atFullRead, forecastWork, trainingForecast } from './advice';
import { ABILITY_DEFS } from '../content/abilities';

/**
 * From brief 10 (later on 2026-10-16): the forecast is passed only where work is kept under today's rules, and passed
 * then even when it holds nothing, so an empty one no longer falls back to the costs; and where every input the recent
 * work read that an exercise trains is at full, the advice says so first (`allFull`), with what's short that no exercise
 * trains. Until then it said nothing of it, and the Profile read as if nothing had held the work back (F2-A10 (d)).
 */
export function adviceFor(sim: Simulation, person: Person): Recommendation[] {
  const read = forecastWork(person.work ?? []).length > 0;
  const recs = recommendations((id) => levelOf(sim, person, id as never), (id) => (isAbility(id as never) ? abilityFull(sim, person, id as AbilityId) : MASTERED), person.work ?? [], (id) => exerciseFor(id as never), matchedTier, 12, practicedDaysAgo(person, sim.now, sim.homeZone), identityOf(person).recurring, read ? trainingForecast(sim, person) : undefined);
  const full = read ? atFullRead(sim, person) : undefined;
  return full?.all ? [allFull(full.short), ...recs].slice(0, 5) : recs;
}

/** Where training reaches nothing more in the recent work (from brief 10): said, with what's short and what builds it. Its target has a colon, so a reader of training targets passes it by. */
function allFull(short: readonly AbilityId[]): Recommendation {
  const builds: Partial<Record<AbilityId, string>> = { stamina: 'workouts build it', discipline: 'practice kept up on days running builds it' };
  const left = short.map((id) => `${ABILITY_DEFS.find((d) => d.id === id)!.label.toLowerCase()} isn’t, and no exercise trains it: ${builds[id] ?? 'the work itself builds it'}`);
  return { target: 'full:all', label: 'Everything Training Reaches Is At Full', focus: 'full', points: 0, why: `Every ability and technique your recent work read that an exercise trains is at its full (a technique at ${MASTERED}, past which no piece asks more), so no hours of practice would move it.${left.length ? ` Of what else it read, ${left.join('; ')}.` : ''} The work now is in new material and new ways of playing it.` };
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
