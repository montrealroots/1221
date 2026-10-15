/**
 * SLATE — a piece of material and the way it's played, read into an evaluation (from 2026-10-10;
 * `content/material.ts`, `content/approaches.ts`).
 *
 * `materialContext` turns a material's profile and the player's choice of how to play it into what the evaluation
 * reads beside the task (`EvalContext`): the dimensions' lean, the abilities each dimension draws on beyond the task's
 * own, the preparation a choice adds, and where a choice doesn't fit. Every addition is an ability's or a
 * preparation's, read as the task's own are, so at full ability, every part prepared and a choice that fits, the
 * result is 100 whatever the material and the choice (the guarantee, held by `tests/material.test.ts`).
 *
 * A dimension's leans multiply (a material's features, its language, the medium, the choice), and the whole is then
 * normalized to the task's own total weight, so leaning moves weight and never adds it: a genre tag, a feature or a
 * choice can't stack into a free advantage.
 */

import type { AbilityId } from '../content/abilities';
import type { Dimension, TaskProfile } from '../content/tasks';
import { MATERIAL_BY_ID, type Axis, type AxisValue, type Feature, type MaterialProfile } from '../content/material';
import { APPROACH_EFFECT, AXES, BLEND_EFFECT, CAMERA_LEAN, DEMAND_EFFECT, FEATURE_EFFECT, LANGUAGE_EFFECT, MISFIT, PLAYING, TRANSITION_EFFECT, VOICE_LEAN, type Inputs } from '../content/approaches';
import type { Instant } from '../core/time';
import { grainOf, sceneOfMaterial, type Scene, type Suitability } from './interpretation';

/** How the player has chosen to play a piece, and how far the choice is rehearsed in. */
export interface Playing {
  pace?: 'measured' | 'driven';
  scale?: 'restrained' | 'expansive';
  structure?: 'set' | 'open';
  chosenAt: Instant;
  /** 0 to 1: work on its feet since the choice. */
  prep: number;
}

/** What the evaluation reads from a material and a choice. */
export interface MaterialRead {
  lean: Partial<Record<Dimension, number>>;
  inputs: Inputs;
  /** The preparation part a choice adds, by the dimensions it leans on. */
  prep: Partial<Record<Dimension, readonly string[]>>;
  /** Where the choice doesn't fit: the factor, and why. */
  fit: Partial<Record<Dimension, { f: number; label: string }>>;
  /** How well the chosen sides suit the scene (from 2026-10-16, `grainOf`): a share of difficulty by dimension, and each side's suitability. */
  grain: Partial<Record<Dimension, { d: number; label: string }>>;
  suits: Suitability[];
  /** How much of the choice's rehearsal completes it: `PLAYING.complete`, less with the grain and more against it. */
  required: number;
}

/** Tasks that aren't performed: the material's body, voice and partner don't reach them. */
export const UNPERFORMED: ReadonlySet<string> = new Set(['written']);

export const materialOf = (id: string | undefined): MaterialProfile | undefined => (id ? MATERIAL_BY_ID[id] : undefined);

/** A choice's chosen sides, in order. */
export const sidesOf = (p: Playing | undefined): AxisValue[] => (p ? (['pace', 'scale', 'structure'] as Axis[]).map((a) => p[a]).filter((v): v is NonNullable<typeof v> => v !== undefined) : []);

/**
 * The transitions a material asks: each change of tone, and each turn. A brief's beats (from 2026-10-12) count a
 * change of the tones played from one beat to the next instead, its turns already being its beats.
 */
export function transitionsOf(p: MaterialProfile): number {
  if (p.beats?.length) {
    const key = (b: { tones: readonly string[] }) => [...b.tones].sort().join('+');
    return p.beats.slice(1).filter((b, i) => key(b) !== key(p.beats![i]!)).length;
  }
  return p.tones.slice(1).filter((t, i) => t !== p.tones[i]).length + p.turns;
}

/** The beats a material holds two ways at once (from 2026-10-12): a brief's beats with two tones; none for a material without beats. */
export const blendsOf = (p: MaterialProfile): number => (p.beats ?? []).filter((b) => new Set(b.tones).size > 1).length;

/** Why a side of an axis doesn't fit a material or a direction, or nothing. */
export function misfitOf(axis: Axis, side: AxisValue, material?: MaterialProfile, direction?: Partial<Record<Axis, AxisValue>>): string | undefined {
  const allowed = material?.allows?.[axis];
  if (allowed && !allowed.includes(side)) return `${material!.title} doesn’t take it: ${material!.why.allows ?? 'the text forbids it'}`;
  const asked = direction?.[axis];
  if (asked && asked !== side) return `The director has asked for it ${APPROACH_EFFECT[asked].label.toLowerCase()}.`;
  return undefined;
}

/**
 * How much a piece has of each thing `DEMAND_EFFECT` reads (from 2026-10-16): the partner levels under 2, the steps of
 * length past short, its stakes (1 where none is given), the segments past three (a brief's beats, or a scene's or a
 * play's tones, two at least, as `toneSegments` cuts it), and the shares of its beats or tones played grave, lyric or
 * grotesque, and comic.
 */
export function demandsOf(m: MaterialProfile): Record<keyof typeof DEMAND_EFFECT, number> {
  const tones = m.beats ? m.beats.flatMap((b) => b.tones.map((t) => ({ t, w: 1 / b.tones.length }))) : m.tones.map((t) => ({ t, w: 1 }));
  const total = tones.reduce((a, x) => a + x.w, 0);
  const segments = m.beats?.length ?? Math.max(2, m.tones.length);
  const share = (t: string) => (total > 0 ? tones.filter((x) => x.t === t).reduce((a, x) => a + x.w, 0) / total : 0);
  return {
    solo: Math.max(0, 2 - m.partner),
    text: m.size === 'long' ? 2 : m.size === 'medium' ? 1 : 0,
    stakes: m.stakes ?? 1,
    beats: Math.max(0, segments - 3),
    grave: share('grave'),
    invented: share('lyric') + share('grotesque'),
    comic: share('comic'),
  };
}

const add = (to: Record<string, { ability: AbilityId; weight: number }[]>, d: Dimension, xs: readonly { ability: AbilityId; weight: number }[] | undefined, times = 1) => {
  if (!xs || times <= 0) return;
  const list = (to[d] ??= []);
  for (const x of xs) {
    const had = list.find((y) => y.ability === x.ability);
    if (had) had.weight += x.weight * times; else list.push({ ability: x.ability, weight: x.weight * times });
  }
};

/**
 * What a material and a choice ask of a task. `direction` is a director's request on an axis, for a production.
 * A choice's preparation is read by every dimension it leans on, as the part `approach`.
 */
export function materialContext(task: TaskProfile, material: MaterialProfile | undefined, playing?: Playing, direction?: Partial<Record<Axis, AxisValue>>, scene: Scene = {}): MaterialRead {
  const dims = Object.keys(task.dims) as Dimension[];
  const lean: Partial<Record<Dimension, number>> = Object.fromEntries(dims.map((d) => [d, 1]));
  const inputs: Record<string, { ability: AbilityId; weight: number }[]> = {};
  const prep: Partial<Record<Dimension, readonly string[]>> = {};
  const fit: Partial<Record<Dimension, { f: number; label: string }>> = {};
  const has = (d: Dimension) => task.dims[d] !== undefined;
  // Work that isn't performed (a written analysis) meets only the language: a verse scene analyzed is harder to
  // interpret, but the body, the voice and the partner aren't in it.
  const performed = !UNPERFORMED.has(task.id);
  if (material && !performed && material.language !== 'everyday') {
    const e = LANGUAGE_EFFECT[material.language];
    if (has('interpretation')) { lean.interpretation = lean.interpretation! * e.lean.interpretation; add(inputs, 'interpretation', e.inputs.interpretation); }
  }
  if (material && performed) {
    for (const f of Object.keys(FEATURE_EFFECT) as Feature[]) {
      const level = material[f];
      if (!level) continue;
      const e = FEATURE_EFFECT[f];
      for (const [d, per] of Object.entries(e.lean) as [Dimension, number][]) if (has(d)) lean[d] = lean[d]! * (1 + per * level);
      for (const [d, xs] of Object.entries(e.inputs) as [Dimension, { ability: AbilityId; weight: number }[]][]) if (has(d)) add(inputs, d, xs, level);
    }
    const t = transitionsOf(material);
    for (const [d, per] of Object.entries(TRANSITION_EFFECT.lean) as [Dimension, number][]) if (has(d)) lean[d] = lean[d]! * (1 + per * t);
    for (const [d, xs] of Object.entries(TRANSITION_EFFECT.inputs) as unknown as [Dimension, readonly { ability: AbilityId; weight: number }[]][]) if (has(d)) add(inputs, d, xs, t);
    // Beats held two ways at once (from 2026-10-12), each.
    const bl = blendsOf(material);
    for (const [d, per] of Object.entries(BLEND_EFFECT.lean) as [Dimension, number][]) if (has(d)) lean[d] = lean[d]! * (1 + per * bl);
    for (const [d, xs] of Object.entries(BLEND_EFFECT.inputs) as unknown as [Dimension, readonly { ability: AbilityId; weight: number }[]][]) if (has(d)) add(inputs, d, xs, bl);
    if (material.language !== 'everyday') {
      const e = LANGUAGE_EFFECT[material.language];
      for (const [d, x] of Object.entries(e.lean) as [Dimension, number][]) if (has(d)) lean[d] = lean[d]! * x;
      for (const [d, xs] of Object.entries(e.inputs) as unknown as [Dimension, readonly { ability: AbilityId; weight: number }[]][]) if (has(d)) add(inputs, d, xs);
    }
    // What the piece demands of the abilities its task reads little of (from 2026-10-16, `DEMAND_EFFECT`).
    const units = demandsOf(material);
    for (const k of Object.keys(DEMAND_EFFECT) as (keyof typeof DEMAND_EFFECT)[]) {
      const e = DEMAND_EFFECT[k];
      for (const [d, per] of Object.entries(e.lean) as [Dimension, number][]) if (has(d)) lean[d] = lean[d]! * (1 + per * units[k]);
      for (const [d, xs] of Object.entries(e.inputs) as [Dimension, readonly { ability: AbilityId; weight: number }[]][]) if (has(d)) add(inputs, d, xs, units[k]);
    }
    if (material.medium === 'camera') for (const [d, x] of Object.entries(CAMERA_LEAN) as [Dimension, number][]) if (has(d)) lean[d] = lean[d]! * x;
    if (material.medium === 'voice') for (const [d, x] of Object.entries(VOICE_LEAN) as [Dimension, number][]) if (has(d)) lean[d] = lean[d]! * x;
  }
  for (const axis of Object.keys(AXES) as Axis[]) {
    const side = playing?.[axis];
    if (!side) continue;
    const e = APPROACH_EFFECT[side];
    const why = misfitOf(axis, side, material, direction);
    for (const [d, x] of Object.entries(e.lean) as [Dimension, number][]) {
      if (!has(d)) continue;
      lean[d] = lean[d]! * x;
      // The choice is rehearsed in, and read wherever it puts weight.
      if (x >= 1.1) prep[d] = [...new Set([...(prep[d] ?? []), 'approach'])];
      if (why) fit[d] = { f: Math.min(fit[d]?.f ?? 1, MISFIT), label: `${e.label}: ${why}` };
    }
    for (const [d, xs] of Object.entries(e.inputs) as unknown as [Dimension, readonly { ability: AbilityId; weight: number }[]][]) if (has(d)) add(inputs, d, xs);
  }
  // How well the sides suit the scene (from 2026-10-16, `systems/interpretation.ts`). Work that isn't performed isn't played.
  // A class scene's or a play's own genre, where the caller gives no scene (from 2026-10-16, later: `sceneOfMaterial`).
  const read = Object.keys(scene).length ? scene : sceneOfMaterial(material);
  const g = performed ? grainOf(task, sidesOf(playing), material, read) : { grain: {}, required: PLAYING.complete, suits: [] };
  return { lean, inputs, prep, fit, grain: g.grain, suits: g.suits, required: g.required };
}

/** A choice made or changed: what was worked is kept in full for the same choice, halved for a different one. */
export function choose(was: Playing | undefined, next: Omit<Playing, 'chosenAt' | 'prep'>, at: Instant): Playing {
  const same = was && was.pace === next.pace && was.scale === next.scale && was.structure === next.structure;
  const out: Playing = { chosenAt: same ? was!.chosenAt : at, prep: same ? was!.prep : (was?.prep ?? 0) * PLAYING.keptOnChange };
  if (next.pace) out.pace = next.pace;
  if (next.scale) out.scale = next.scale;
  if (next.structure) out.structure = next.structure;
  return out;
}

/** Work on its feet after the choice: moves its rehearsal by a share of what's left, as any part of preparation moves. */
export function rehearseChoice(p: Playing | undefined, gain: number): void {
  if (!p || !sidesOf(p).length) return;
  p.prep = Math.min(1, p.prep + gain * PLAYING.gainShare * (1 - p.prep));
}
