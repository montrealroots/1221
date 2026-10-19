/**
 * SLATE — what a way of playing came to against the scene, read from a judged result (from 2026-10-16): the points its
 * suitability gave or cost the whole, apart from what the actor's abilities cost. The take's line, its history and the
 * guide read it, from the result's own dimensions, so the screen's account is the evaluation's.
 */

import { TASK_PROFILES, type Dimension } from '../content/tasks';
import { DIMENSION_LABEL } from '../content/tasks';
import { leanedWeights, wholeOf, type Evaluation } from './evaluation';
import { pieceWeights } from './piece';

const r1 = (x: number) => Math.round(x * 10) / 10;

export interface GrainRead {
  /** The points the way it was played gave the whole (positive, with the grain) or cost it (negative, against it). */
  points: number;
  /** Each dimension it reached, and what it came to there. */
  on: { dimension: Dimension; label: string; points: number; why: string }[];
  /** The points what the actor's abilities and techniques cost the whole, each limit's summed, for comparison. */
  ability: number;
}

/** A result's grain: the whole worked out again with each dimension without its grain's points, less the whole as it was. */
export function grainRead(e: Pick<Evaluation, 'task' | 'dimensions' | 'limits' | 'inputs'>): GrainRead | undefined {
  const on = e.dimensions.filter((d) => d.grain && Math.abs(d.grain.points) >= 0.05).map((d) => ({ dimension: d.dimension, label: d.label, points: d.grain!.points, why: d.grain!.label }));
  if (!on.length) return undefined;
  const task = TASK_PROFILES[e.task];
  if (!task) return undefined;
  const weights = e.inputs.piece ? pieceWeights(task, e.inputs.lean, e.inputs.piece) : leanedWeights(task, e.inputs.families, e.inputs.lean);
  const as = wholeOf(e.dimensions, weights);
  // Each dimension's exact value and its grain's exact points where the result keeps them (from 2026-10-16, evaluation-9).
  const without = wholeOf(e.dimensions.map((d) => (d.grain ? { ...d, exact: Math.max(0, Math.min(100, (d.exact ?? d.quality) - (d.grain.exact ?? d.grain.points))) } : d)), weights);
  let ability = 0;
  for (const l of e.limits) {
    if (l.kind !== 'ability' && l.kind !== 'technique') continue;
    ability += l.whole ?? 0;
  }
  return { points: r1(as - without), on, ability: r1(ability) };
}

/** The grain in a sentence: what the way it was played came to against the scene, and beside it what the craft cost. */
export function grainWords(g: GrainRead | undefined): string {
  if (!g) return '';
  // Signed as the advice signs a change, with a minus sign, not a hyphen (from 2026-10-19, brief 15).
  const where = g.on.map((x) => `${x.points > 0 ? '+' : x.points < 0 ? '−' : ''}${Math.abs(x.points)} to ${DIMENSION_LABEL[x.dimension].toLowerCase()}`).join(', ');
  const why = [...new Set(g.on.map((x) => x.why))].join('; ');
  const lead = g.points > 0 ? `The way you played it suited the scene (${why}) and added ${g.points} points to the take (${where})` : g.points < 0 ? `The way you played it worked against the scene (${why}) and cost the take ${Math.abs(g.points)} points (${where})` : `The way you played it made no difference to the scene either way (${why})`;
  return `${lead}. Apart from that, your abilities and techniques cost it ${g.ability} points.`;
}

/** A kept take's grain in a sentence (`Take.grain`), from what it kept: the same account after a reload. */
export function takeGrainWords(g: { points: number; ability: number; why: string }): string {
  const lead = g.points > 0 ? `Played that way, it suited the scene (${g.why}) and added ${g.points} points` : g.points < 0 ? `Played that way, it worked against the scene (${g.why}) and cost ${Math.abs(g.points)} points` : `Played that way, it made no difference to the scene either way (${g.why})`;
  return `${lead}. Your abilities and techniques cost it ${g.ability} points.`;
}
