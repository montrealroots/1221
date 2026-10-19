/**
 * SLATE — how work is judged (from the connected attributes of 2026-10-09).
 *
 * One pathway for every piece of finished work: a scene shown in class, a
 * written analysis, a movement score, a song, a self-tape, a night in front
 * of a house. Each is a task profile (`content/tasks.ts`) that says which
 * quality dimensions apply to it (believability, interpretation, connection,
 * execution, consistency, responsiveness), which abilities and techniques
 * bear on each and by how much, which parts of preparation it reads, and
 * which conditions of the day reach which dimension. Learning (a class, a
 * step of preparation, lines learned) isn't judged here: it develops, and is
 * never given an audience's verdict.
 *
 * Each dimension is worked out on its own before the whole:
 *
 *   capacity  = the weighted mean of its inputs, an ability as level/full (100,
 *               and for stamina the most a body that age can reach) and a
 *               technique as level/MASTERED, each at most 1 (`MASTERED`, 90:
 *               the level at which a technique counts as mastered, shown on
 *               its look);
 *   shaped    = capacity^(1 + difficulty), so harder work asks more of the
 *               same capacity and work pitched at a student (a difficulty
 *               under 0) less, and at full capacity asks nothing more;
 *   prepared  = for each part it reads, prepFloor + (1 − prepFloor) ×
 *               min(1, part / complete), the least of them, and 1 when every
 *               part it reads is complete; a part with a floor of its own
 *               (`partFloor`, from 2026-10-16: knowing the genre) reads that
 *               floor in place of prepFloor;
 *   condition = 1 when the day's condition is sufficient (readiness at
 *               `sufficientReadiness` or over, and no named cause that reaches
 *               the dimension: the flu for the voice, an injury for the body),
 *               less by each named cause otherwise;
 *   variation = a bounded draw, ± variation × (1 − shaped) × prepared ×
 *               condition × fit, so it narrows as mastery rises and is
 *               nothing at full capacity; on a tired day its downward side
 *               widens by up to `fatigueSpread`, since sleep loss brings
 *               lapses and makes work more erratic, not only worse (Lim &
 *               Dinges 2010; Doran et al. 2001; research-practice-material.json). Until 2026-10-10 it
 *               wasn't scaled by the other factors, and with the fit factor
 *               added the least they came to (0.091) let the draw outweigh a
 *               rising input;
 *   quality   = 100 × shaped × prepared × condition × fit + variation, held
 *               to 0..100.
 *
 * The whole is the dimensions' weighted mean for `meanShare` of it and the
 * weakest for the rest, so one strength doesn't erase an unrelated weakness.
 *
 * The guarantee: every ability a task reads at 100, every technique it reads
 * at MASTERED, every part of preparation complete and the condition
 * sufficient, then capacity is 1, shaped is 1, prepared is 1, condition is 1
 * and variation is 0: every dimension and the whole are 100. A dimension's
 * quality never falls as an input it reads rises, holding the rest: against
 * shaped its slope is (100 − variation × spread × draw) × prepared × condition
 * × fit, and variation × spread is at most 15, so it's always positive
 * (`tests/evaluation.test.ts` and `tests/engine-properties.test.ts` hold both).
 * Inputs a task doesn't read change nothing.
 *
 * From 2026-10-10 a piece of material and the way it's played reach the same formula (`systems/material.ts`): they
 * lean the dimensions' weights (normalized, as a genre's did), add abilities to a dimension's inputs (merged with the
 * task's own, an ability counted once at its summed weight), add the choice's rehearsal as a part of preparation, and
 * where a choice doesn't fit the material or the direction, a fit factor under 1 on the dimensions it leans on:
 *
 *   quality = 100 × shaped × prepared × condition × fit + variation.
 *
 * Fit is known before the work, shown with the choice, and 1 for a choice that fits, so the guarantee is the same
 * with "the choice fits" added to what it asks.
 *
 * Rounded once (from 2026-10-16, evaluation-9): a result is kept to a tenth, and it's rounded once, where `judge` and
 * `judgePiece` hand it out. Every part of it (a dimension, a segment, a limit, the scene together) is worked out at full
 * precision, and a whole is worked out from its parts' exact values (`exact`), never from their rounded ones. Until
 * then each dimension was rounded before the whole was taken from it, and a piece's segments before the piece's whole
 * was: the same work came out a tenth apart where nothing but the rounding differed. Measured on the stage's 171 cases
 * (docs/verification/integration-2026-10-16/st3.md), an even actor's stage and close-frame results differed by 0.1 on
 * 12, where they differed at full precision by at most 0.021.
 *
 * What's returned says why. Each limit is what one input cost its
 * dimension, in points: the dimension worked out again with that one input
 * made whole and everything else held. The words a screen shows are built
 * from these, and enough is kept to work the result out again (`ruleset`, the
 * inputs, and the draw's key, which with the save's seed gives the draw).
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { abilityFull, abilityOf, abilityDef, type AbilityId } from './attributes';
import { MASTERED, TECHNIQUES, TECHNIQUE_LABEL } from '../content/abilities';
import { type Dimension, type DimensionSpec, type TaskProfile, DIMENSION_LABEL, EVALUATION, RULESET } from '../content/tasks';
import { SKILL_WORDS, type Skill } from '../content/school';
import { plural } from '../core/text';
import { judgePiece, type PieceResult, type PieceSpec } from './piece';
import { GRAIN } from '../content/interpretation';

export type { Dimension, TaskProfile } from '../content/tasks';

/**
 * Who does the work, as the evaluation reads them (from 2026-10-10): an ability's level and the level at which it's
 * full, and the craft's techniques. The player is read through `performerOf`; a classmate through
 * `classmatePerformer` (`systems/school.ts`); a kept result through `frozenPerformer`, from the levels it was judged
 * at, so it works out again the same whatever has changed since.
 */
export interface Performer {
  ability(id: AbilityId): number;
  full(id: AbilityId): number;
  technique(skill: Skill): number;
}

export const performerOf = (sim: Simulation, person: Person): Performer => ({
  ability: (id) => abilityOf(sim, person, id),
  full: (id) => abilityFull(sim, person, id),
  technique: (skill) => person.craft?.[skill] ?? 0,
});

/** A result's own levels, as it was judged: what replaying it reads (`replay`). */
export const frozenPerformer = (inputs: Evaluation['inputs']): Performer => ({
  ability: (id) => inputs.abilities[id] ?? 0,
  full: (id) => inputs.fulls?.[id] ?? 100,
  technique: (skill) => inputs.levels?.[skill] ?? 0,
});

/** What a task asks on the day: its profile, the techniques it reads, its preparation, its difficulty and the day's condition. */
export interface EvalContext {
  task: TaskProfile;
  /** The learned techniques this piece of work reads, by weight (a template's or a play's `reads`). */
  techniques: Partial<Record<Skill, number>>;
  /** How far each part of preparation stands, 0 to 1. A part not given isn't read. */
  prep: Record<string, number>;
  /** How far each must stand to be complete, 0 to 1 (1 when not given). */
  required: Record<string, number>;
  /** -0.5 (work pitched under a professional's: a class exercise) to 1 (the hardest the task comes); 0 a professional's. */
  difficulty: number;
  condition: Condition;
  /** Genre families the material belongs to, which lean the dimensions' weights (`content/tasks.ts`, normalized). Read only where no material lean is given. */
  families?: readonly string[];
  /** A material's and a choice's lean on the dimensions, multiplied in and normalized (`systems/material.ts`). In place of the families'. */
  lean?: Partial<Record<Dimension, number>>;
  /** Abilities a dimension draws on beyond the task's own, merged into its inputs. */
  inputs?: Partial<Record<Dimension, readonly { ability: AbilityId; weight: number }[]>>;
  /** Parts of preparation a dimension reads beyond the task's own (a choice's rehearsal, `approach`). */
  extraPrep?: Partial<Record<Dimension, readonly string[]>>;
  /** Where the way it's played doesn't fit: the factor on a dimension, and why. */
  fit?: Partial<Record<Dimension, { f: number; label: string }>>;
  /**
   * How well the way it's played suits the scene (from 2026-10-16, `systems/interpretation.ts`): a share of difficulty
   * on a dimension, negative with the grain and positive against it, and why. At full capacity it asks nothing.
   */
  grain?: Partial<Record<Dimension, { d: number; label: string }>>;
  /** A stable key for the bounded draw: the same work on the same day draws the same. */
  key: string;
  /** What the work would be expected to come to, with no draw: a casting read, which judges no night (from 2026-10-10). */
  expected?: boolean;
  /**
   * A segment of a piece late enough to tire (from 2026-10-12, `systems/piece.ts`): the factor on what tiring reaches,
   * and why. Stamina's way into a piece judged in segments, in place of its share of consistency.
   */
  drain?: { f: number; label: string };
  /** A segment after a slip, not wholly recovered from (from 2026-10-12): the factor on believability and consistency, and why. */
  shaken?: { f: number; label: string };
}

/** The day's condition as the task meets it: readiness (with the hour's fit), and anything concrete that limits a dimension. */
export interface Condition {
  readiness: number;
  ill?: boolean;
  /** An injury that limits the body (`INJURY_KIND[].limits`): the dimensions whose conditions name `injury`. */
  injured?: boolean;
  /** A concussion still mending (from 2026-10-10): every dimension, once, in place of `injured`. */
  concussed?: boolean;
}

export interface Limit {
  kind: 'ability' | 'technique' | 'preparation' | 'condition' | 'difficulty' | 'fit' | 'suitability';
  what: string;
  label: string;
  dimension: Dimension;
  /** The points it cost the dimension: the dimension again with it made whole, less the dimension as it was. */
  by: number;
  /**
   * The points it cost the whole (from 2026-10-12): the whole again with this dimension at what it would have been, less
   * the whole as it was. What the limits are ranked by, since a dimension's weight and the weakest dimension decide how
   * much of the whole a dimension's points are; until then a 15-point loss in a dimension weighted 1 outranked a
   * 10-point loss in one weighted 3, which cost the whole about twice as much.
   */
  whole?: number;
}

export interface DimensionResult {
  dimension: Dimension;
  label: string;
  /** What it came to, to a tenth: `exact` rounded once. */
  quality: number;
  /**
   * What it came to at full precision (from 2026-10-16, evaluation-9): what a whole is worked out from (`wholeOf`), so a
   * whole is rounded once and never from its parts' rounded values. A result from before keeps none, and is read by
   * `quality`.
   */
  exact?: number;
  capacity: number;
  prepared: number;
  condition: number;
  /**
   * The day's share of the condition (from 2026-10-12): its fatigue, illness, injury or concussion, without a piece's
   * own stamina drain or a slip's shake, which the piece and the night's draw bring. What a night's delivery reads.
   */
  day: number;
  /** The way it's played against the material or the direction: 1 where it fits (from 2026-10-10). */
  fit?: number;
  /**
   * What the way it's played came to against the scene (from 2026-10-16): its share of difficulty, and the points it gave
   * (with the grain, positive) or cost (against it, negative), the dimension worked out again without it. Apart from what
   * the actor's abilities cost, which the limits say.
   */
  grain?: { d: number; points: number; label: string; exact?: number };
  variation: number;
  strongest?: { what: string; label: string };
  limits: Limit[];
}

export interface Evaluation {
  ruleset: string;
  task: string;
  taskLabel: string;
  dimensions: DimensionResult[];
  /** The whole, to a tenth: `exact` rounded once. What every band, standing and screen reads. */
  overall: number;
  /** The whole at full precision (from 2026-10-16, evaluation-9): what a piece's whole is worked out from, its segments' exact wholes by their weights. */
  exact?: number;
  /** Whether everything the guarantee asks was met: every input at mastery, preparation complete, condition sufficient. */
  mastery: boolean;
  /** Every dimension's limits, the costliest first. */
  limits: Limit[];
  /** The inputs as they stood, to work it out again. */
  inputs: {
    abilities: Partial<Record<AbilityId, number>>; techniques: Partial<Record<Skill, number>>; prep: Record<string, number>; required: Record<string, number>; difficulty: number; condition: Condition; families: readonly string[]; key: string;
    /** The technique levels and the abilities' full levels it was judged at (from 2026-10-10; a result from before has neither, and isn't replayed). */
    levels?: Partial<Record<Skill, number>>;
    fulls?: Partial<Record<AbilityId, number>>;
    /** The save's seed the draw was keyed by. */
    seed?: string;
    /** The material's and the choice's reads (from 2026-10-10), so a result replays with them. */
    lean?: Partial<Record<Dimension, number>>;
    inputs?: Partial<Record<Dimension, readonly { ability: AbilityId; weight: number }[]>>;
    extraPrep?: Partial<Record<Dimension, readonly string[]>>;
    fit?: Partial<Record<Dimension, { f: number; label: string }>>;
    /** The way it's played against the scene (from 2026-10-16). */
    grain?: Partial<Record<Dimension, { d: number; label: string }>>;
    /** A piece judged in segments (from 2026-10-12, `systems/piece.ts`): the segments, their work, the part and the load. */
    piece?: PieceSpec;
  };
  /** The segments' own results and the continuity read from them, for a piece judged in segments. */
  piece?: PieceResult;
}

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const r1 = (x: number) => Math.round(x * 10) / 10;

/** A small deterministic hash to [-1, 1), for the bounded draw. */
export function draw(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i += 1) h = Math.imul(h ^ key.charCodeAt(i), 16777619) >>> 0;
  return (h % 2_000_000) / 1_000_000 - 1;
}

/**
 * The dimension weights leant by a material and a choice (`lean`, multiplied in) or, with none, by the material's
 * genre families, normalized so leaning moves weight and never adds it.
 */
export function leanedWeights(task: TaskProfile, families: readonly string[] = [], lean?: Partial<Record<Dimension, number>>): Partial<Record<Dimension, number>> {
  const base = Object.fromEntries(Object.entries(task.dims).map(([d, s]) => [d, s!.weight])) as Partial<Record<Dimension, number>>;
  if (lean) {
    const out = Object.fromEntries((Object.keys(base) as Dimension[]).map((d) => [d, base[d]! * (lean[d] ?? 1)])) as Partial<Record<Dimension, number>>;
    const total = Object.values(out).reduce((a, b) => a + (b ?? 0), 0);
    const was = Object.values(base).reduce((a, b) => a + (b ?? 0), 0);
    for (const d of Object.keys(out) as Dimension[]) out[d] = (out[d]! * was) / total;
    return out;
  }
  const leans = families.map((f) => EVALUATION.familyLean[f]).filter(Boolean);
  if (!leans.length) return base;
  const out: Partial<Record<Dimension, number>> = {};
  for (const d of Object.keys(base) as Dimension[]) {
    // The mean of the families' leans on this dimension: two families aren't twice the lean.
    const lean = leans.reduce((s, l) => s + (l![d] ?? 1), 0) / leans.length;
    out[d] = base[d]! * lean;
  }
  const total = Object.values(out).reduce((a, b) => a + (b ?? 0), 0);
  const was = Object.values(base).reduce((a, b) => a + (b ?? 0), 0);
  for (const d of Object.keys(out) as Dimension[]) out[d] = (out[d]! * was) / total;
  return out;
}

/** One input to a dimension, resolved: what it is, its weight, and how far it stands (0 to 1). */
interface Term { kind: 'ability' | 'technique'; what: string; label: string; weight: number; n: number }

/** The terms of a dimension: its abilities, and the work's techniques sharing the techniques' weight as the work weights them. */
function termsOf(spec: DimensionSpec, level: (a: AbilityId) => number, full: (a: AbilityId) => number, techniques: Partial<Record<Skill, number>>, craft: (s: Skill) => number): Term[] {
  const techTotal = Object.values(techniques).reduce((a, b) => a + (b ?? 0), 0);
  const out: Term[] = [];
  for (const input of spec.inputs) {
    if ('ability' in input) out.push({ kind: 'ability', what: input.ability, label: abilityDef(input.ability).label, weight: input.weight, n: clamp(level(input.ability) / full(input.ability), 0, 1) });
    else if (techTotal > 0) {
      for (const [skill, w] of Object.entries(techniques) as [Skill, number][]) {
        out.push({ kind: 'technique', what: skill, label: TECHNIQUE_LABEL[skill], weight: (input.weight * w) / techTotal, n: clamp(craft(skill) / MASTERED, 0, 1) });
      }
    }
  }
  return out;
}

/** A dimension's parts, worked out from its terms, preparation, condition and fit factors: the one formula every limit reruns. */
function dimensionQuality(terms: readonly Term[], difficulty: number, prepared: number, condition: number, d: number, fit = 1, spread = 1): { capacity: number; shaped: number; variation: number; quality: number } {
  const total = terms.reduce((s, t) => s + t.weight, 0);
  const capacity = total > 0 ? terms.reduce((s, t) => s + t.weight * t.n, 0) / total : 1;
  const shaped = capacity ** (1 + difficulty);
  // Nothing at full capacity, exactly: not a negative zero.
  const factors = prepared * condition * fit;
  // A tired day widens the draw downward only: lapses, not inspiration (Lim & Dinges 2010), which also keeps quality
  // rising as readiness rises.
  const variation = shaped >= 1 ? 0 : EVALUATION.variation * (d < 0 ? spread : 1) * (1 - shaped) * factors * d;
  return { capacity, shaped, variation, quality: clamp(100 * shaped * factors + variation, 0, 100) };
}

/** A dimension's spec with what the material and the choice add: inputs merged (an ability once, its weights summed), parts of preparation joined. */
function specWith(spec: DimensionSpec, extra?: readonly { ability: AbilityId; weight: number }[], prep?: readonly string[]): DimensionSpec {
  if (!extra?.length && !prep?.length) return spec;
  const inputs = spec.inputs.map((x) => ({ ...x }));
  for (const e of extra ?? []) {
    const had = inputs.find((x) => 'ability' in x && x.ability === e.ability);
    if (had) had.weight += e.weight; else inputs.push({ ability: e.ability, weight: e.weight });
  }
  return { ...spec, inputs, prep: [...new Set([...(spec.prep ?? []), ...(prep ?? [])])] };
}

/** Judges the player's piece of work (`judge`, through `performerOf`). */
export function evaluate(sim: Simulation, person: Person, ctx: EvalContext): Evaluation {
  return judge(sim.universe.meta.seed, performerOf(sim, person), ctx);
}

/**
 * A kept result worked out again from its own inputs, under its seed: the same, whatever the person is now. A result
 * kept under other rules (`ruleset`, from 2026-10-12) isn't: today's judge would give another number and call it the
 * same work, so there's nothing to show but what it was.
 */
export function replay(record: { inputs: Evaluation['inputs']; task: string; ruleset?: string }, profile: TaskProfile): Evaluation | undefined {
  const i = record.inputs;
  if (!i.levels || !i.fulls || i.seed === undefined) return undefined;
  if (record.ruleset !== undefined && record.ruleset !== RULESET) return undefined;
  const ctx: EvalContext = { task: profile, techniques: i.techniques, prep: i.prep, required: i.required, difficulty: i.difficulty, condition: i.condition, families: i.families, key: i.key, ...(i.lean ? { lean: i.lean } : {}), ...(i.inputs ? { inputs: i.inputs } : {}), ...(i.extraPrep ? { extraPrep: i.extraPrep } : {}), ...(i.fit ? { fit: i.fit } : {}), ...(i.grain ? { grain: i.grain } : {}) };
  return i.piece ? judgePiece(i.seed, frozenPerformer(i), ctx, i.piece) : judge(i.seed, frozenPerformer(i), ctx);
}

/**
 * A kept result's work judged again by another performer, with no draw (from 2026-10-16): the same piece, its
 * preparation, its condition and how it was played, done by someone else, or by the same person as they are now. What
 * advice forecasts by (`systems/advice.ts`); it reads only the record, so it never touches a save. A result kept under
 * other rules isn't, as `replay` isn't.
 */
export function replayAs(record: { inputs: Evaluation['inputs']; task: string; ruleset?: string }, profile: TaskProfile, performer: Performer): Evaluation | undefined {
  const i = record.inputs;
  if (i.seed === undefined) return undefined;
  if (record.ruleset !== undefined && record.ruleset !== RULESET) return undefined;
  const ctx: EvalContext = { task: profile, techniques: i.techniques, prep: i.prep, required: i.required, difficulty: i.difficulty, condition: i.condition, families: i.families, key: i.key, expected: true, ...(i.lean ? { lean: i.lean } : {}), ...(i.inputs ? { inputs: i.inputs } : {}), ...(i.extraPrep ? { extraPrep: i.extraPrep } : {}), ...(i.fit ? { fit: i.fit } : {}), ...(i.grain ? { grain: i.grain } : {}) };
  return i.piece ? judgePiece(i.seed, performer, ctx, i.piece) : judge(i.seed, performer, ctx);
}

/** Judges a piece of work by any performer: each dimension, then the whole, with what carried it and what held it back. Rounded once, here. */
export function judge(seed: string, performer: Performer, ctx: EvalContext): Evaluation {
  return rounded(judgeExact(seed, performer, ctx));
}

/**
 * A result kept to a tenth (from 2026-10-16, evaluation-9): each figure rounded once from its exact value, the exact
 * value kept beside the dimensions' and the whole's for what's worked out from them.
 */
export function rounded(e: Evaluation): Evaluation {
  const lim = (l: Limit): Limit => ({ ...l, by: r1(l.by), ...(l.whole !== undefined ? { whole: r1(l.whole) } : {}) });
  const dimensions = e.dimensions.map((d) => ({
    ...d, quality: r1(d.quality), exact: d.quality,
    ...(d.grain ? { grain: { ...d.grain, points: r1(d.grain.points), exact: d.grain.points } } : {}),
    limits: d.limits.map(lim).filter((l) => l.by > 0),
  }));
  return { ...e, dimensions, overall: r1(e.overall), exact: e.overall, limits: dimensions.flatMap((d) => d.limits).sort(byCost) };
}

/** Limits, the costliest to the whole first, then to its dimension. */
const byCost = (a: Limit, b: Limit) => (b.whole ?? 0) - (a.whole ?? 0) || b.by - a.by;

/**
 * The judge at full precision (from 2026-10-16, evaluation-9): every figure as worked out, none rounded. `judge` rounds it
 * once; a piece judged in segments (`systems/piece.ts`) takes its segments from here and rounds its own whole once.
 */
export function judgeExact(seed: string, performer: Performer, ctx: EvalContext): Evaluation {
  const E = EVALUATION;
  const abilities: Partial<Record<AbilityId, number>> = {};
  const fulls: Partial<Record<AbilityId, number>> = {};
  const levels: Partial<Record<Skill, number>> = {};
  const level = (a: AbilityId) => (abilities[a] ??= performer.ability(a));
  const full = (a: AbilityId) => (fulls[a] ??= performer.full(a));
  const craftLevel = (s: Skill) => (levels[s] ??= performer.technique(s));
  // Only the learned techniques: a skill kept as an ability (Emotional Depth, Memory, Vocal and Physical Expression) is
  // read by the dimensions that name it, and counted there once.
  const techniques = Object.fromEntries(Object.entries(ctx.techniques).filter(([k, w]) => TECHNIQUES.includes(k as Skill) && (w ?? 0) > 0)) as Partial<Record<Skill, number>>;
  const dims: DimensionResult[] = [];
  const weights = leanedWeights(ctx.task, ctx.families, ctx.lean);
  let mastery = true;

  for (const [d, base] of Object.entries(ctx.task.dims) as [Dimension, DimensionSpec][]) {
    const spec = specWith(base, ctx.inputs?.[d], ctx.extraPrep?.[d]);
    const fit = ctx.fit?.[d];
    const f = fit ? clamp(fit.f, 0, 1) : 1;
    // The way it's played against the scene (from 2026-10-16): a share of this dimension's difficulty. The exponent is
    // held to `GRAIN.floor` or more, so the easiest side of the easiest work still asks something of the craft.
    const g = ctx.grain?.[d];
    const diff = g ? Math.max(GRAIN.floor - 1, ctx.difficulty + g.d) : ctx.difficulty;
    const terms = termsOf(spec, level, full, techniques, craftLevel);
    // The draw is the save's own, by its seed: two lives don't draw the same night.
    const dr = ctx.expected ? 0 : draw(`${seed}:${ctx.key}:${d}`);
    // Preparation: each part it reads against what completes it; the least of them counts.
    const parts = (spec.prep ?? []).filter((p) => ctx.prep[p] !== undefined).map((p) => {
      const need = ctx.required[p] ?? 1;
      // A part with a floor of its own (`partFloor`, from 2026-10-16: knowing the genre), else `prepFloor`.
      const floor = E.partFloor[p] ?? E.prepFloor;
      return { part: p, f: floor + (1 - floor) * Math.min(1, need > 0 ? ctx.prep[p]! / need : 1) };
    });
    const prepared = parts.reduce((m, p) => Math.min(m, p.f), 1);
    // Condition: readiness under sufficient, and a named cause where it reaches this dimension.
    const reaches = spec.conditions ?? [];
    const causes: { what: 'fatigue' | 'illness' | 'injury' | 'stamina' | 'shaken'; label: string; f: number }[] = [];
    if (ctx.condition.readiness < E.sufficientReadiness && reaches.includes('fatigue')) causes.push({ what: 'fatigue', label: `Readiness At ${Math.round(ctx.condition.readiness)}, Under ${E.sufficientReadiness}`, f: E.fatigueFloor + (1 - E.fatigueFloor) * clamp(ctx.condition.readiness / E.sufficientReadiness, 0, 1) });
    if (ctx.condition.ill && reaches.includes('illness')) causes.push({ what: 'illness', label: 'Down With The Flu', f: E.illness });
    if (ctx.condition.injured && reaches.includes('injury')) causes.push({ what: 'injury', label: 'An Injury Still Mending', f: E.injury });
    // A concussion reaches every dimension, whatever its conditions name: it's thinking and memory, not the body only.
    else if (ctx.condition.concussed) causes.push({ what: 'injury', label: 'A Concussion Still Mending', f: E.injury });
    // A segment late in a piece, where the stamina doesn't hold, and one after a slip (`systems/piece.ts`).
    if (ctx.drain && ctx.drain.f < 1 && reaches.includes('fatigue')) causes.push({ what: 'stamina', label: ctx.drain.label, f: ctx.drain.f });
    if (ctx.shaken && ctx.shaken.f < 1 && (d === 'believability' || d === 'consistency')) causes.push({ what: 'shaken', label: ctx.shaken.label, f: ctx.shaken.f });
    const condition = causes.reduce((p, c) => p * c.f, 1);
    const day = causes.filter((c) => c.what !== 'stamina' && c.what !== 'shaken').reduce((p, c) => p * c.f, 1);
    // A tired day widens the draw (`fatigueSpread`); a sufficient day leaves it as it is.
    const spread = ctx.condition.readiness < E.sufficientReadiness ? 1 + E.fatigueSpread * (1 - clamp(ctx.condition.readiness / E.sufficientReadiness, 0, 1)) : 1;

    const now = dimensionQuality(terms, diff, prepared, condition, dr, f, spread);
    const limits: Limit[] = [];
    const cost = (q: number) => Math.max(0, q - now.quality);
    for (const [i, t] of terms.entries()) {
      if (t.n >= 1) continue;
      mastery = false;
      const whole = terms.map((x, j) => (j === i ? { ...x, n: 1 } : x));
      limits.push({ kind: t.kind, what: t.what, label: t.label, dimension: d, by: cost(dimensionQuality(whole, diff, prepared, condition, dr, f, spread).quality) });
    }
    if (now.capacity < 1 && ctx.difficulty > 0) limits.push({ kind: 'difficulty', what: 'difficulty', label: 'How Hard The Piece Is', dimension: d, by: cost(dimensionQuality(terms, diff - ctx.difficulty, prepared, condition, dr, f, spread).quality) });
    // What the way it's played came to against the scene: the dimension again without its share of difficulty.
    const without = g ? dimensionQuality(terms, ctx.difficulty, prepared, condition, dr, f, spread).quality : now.quality;
    if (g && g.d > 0) limits.push({ kind: 'suitability', what: 'grain', label: g.label, dimension: d, by: cost(without) });
    for (const p of parts) {
      if (p.f >= 1) continue;
      mastery = false;
      const rest = parts.reduce((m, x) => (x === p ? m : Math.min(m, x.f)), 1);
      limits.push({ kind: 'preparation', what: p.part, label: ctx.task.prepLabel?.[p.part] ?? (p.part === 'approach' ? 'Rehearsing the way you chose to play it' : p.part), dimension: d, by: cost(dimensionQuality(terms, diff, rest, condition, dr, f, spread).quality) });
    }
    for (const c of causes) {
      mastery = false;
      limits.push({ kind: 'condition', what: c.what, label: c.label, dimension: d, by: cost(dimensionQuality(terms, diff, prepared, condition / c.f, dr, f, c.what === 'fatigue' ? 1 : spread).quality) });
    }
    if (f < 1) {
      mastery = false;
      limits.push({ kind: 'fit', what: 'fit', label: fit!.label, dimension: d, by: cost(dimensionQuality(terms, diff, prepared, condition, dr, 1, spread).quality) });
    }
    const strongest = terms.reduce<Term | undefined>((b, t) => (!b || t.n > b.n ? t : b), undefined);
    dims.push({ dimension: d, label: DIMENSION_LABEL[d], quality: now.quality, capacity: now.capacity, prepared, condition, day, ...(f < 1 ? { fit: f } : {}), ...(g ? { grain: { d: g.d, points: now.quality - without, label: g.label } } : {}), variation: now.variation, ...(strongest ? { strongest: { what: strongest.what, label: strongest.label } } : {}), limits: limits.filter((l) => l.by > 0).sort((a, b) => b.by - a.by) });
  }

  const overall = wholeOf(dims, weights);
  // Each limit's cost to the whole: the whole again with its dimension at what the limit made whole would leave it.
  for (const x of dims) {
    for (const l of x.limits) l.whole = Math.max(0, wholeOf(dims.map((y) => (y === x ? { ...y, quality: Math.min(100, y.quality + l.by) } : y)), weights) - overall);
    x.limits.sort(byCost);
  }
  return {
    ruleset: RULESET, task: ctx.task.id, taskLabel: ctx.task.label, dimensions: dims, overall, exact: overall, mastery,
    limits: dims.flatMap((x) => x.limits).sort(byCost),
    inputs: { abilities: { ...abilities }, techniques, prep: { ...ctx.prep }, required: { ...ctx.required }, difficulty: ctx.difficulty, condition: { ...ctx.condition }, families: ctx.families ?? [], key: ctx.key, levels: { ...levels }, fulls: { ...fulls }, seed, ...(ctx.lean ? { lean: ctx.lean } : {}), ...(ctx.inputs ? { inputs: ctx.inputs } : {}), ...(ctx.extraPrep ? { extraPrep: ctx.extraPrep } : {}), ...(ctx.fit && Object.keys(ctx.fit).length ? { fit: ctx.fit } : {}), ...(ctx.grain && Object.keys(ctx.grain).length ? { grain: ctx.grain } : {}) },
  };
}

/**
 * The whole of a set of dimensions: their weighted mean for `meanShare` of it, the weakest for the rest. It reads each
 * dimension's exact value where it has one (from 2026-10-16, evaluation-9), its rounded one only on a result from before.
 */
export function wholeOf(dims: readonly (Pick<DimensionResult, 'dimension' | 'quality'> & { exact?: number })[], weights: Partial<Record<Dimension, number>>): number {
  const E = EVALUATION;
  const q = (x: { quality: number; exact?: number }) => x.exact ?? x.quality;
  const wTotal = dims.reduce((s, x) => s + (weights[x.dimension] ?? 0), 0);
  const weighted = wTotal > 0 ? dims.reduce((s, x) => s + q(x) * (weights[x.dimension] ?? 0), 0) / wTotal : 0;
  const weakest = dims.length ? Math.min(...dims.map(q)) : 0;
  return E.meanShare * weighted + (1 - E.meanShare) * weakest;
}

/**
 * A finished piece of work kept (`person.work`): what it was, when, the whole and each dimension, its band where a
 * system reads one, the limits that held it back most, and the inputs and ruleset that work it out again. A result
 * is kept under the ruleset it was judged by: a later change to the rules doesn't rewrite it.
 */
export interface WorkRecord {
  at: number;
  task: string;
  taskLabel: string;
  what: string;
  overall: number;
  band?: string;
  dims: Partial<Record<Dimension, number>>;
  mastery: boolean;
  limits: Limit[];
  ruleset: string;
  inputs: Evaluation['inputs'];
}

/** How many pieces of work the history keeps. */
export const WORK_KEPT = 160;

/**
 * The journey's durable record (from 2026-10-10), beside the latest `WORK_KEPT` results in detail: every piece of work
 * counted for life, by kind (`totals`) and by half-year (`byTerm`, "2027 Spring" and "2027 Fall", a few kinds each),
 * and the milestones (a run's close, a first Strong or Distinction-level piece, a first at full mastery), bounded by
 * `MILESTONES_KEPT`. It grows by a handful of numbers a half-year, so a long life's save stays small, and a lifetime's
 * counts are read from it, never from the detail, which drops its oldest. `detailBefore` marks where a save from before
 * this kept no record: results older than its first were discarded and aren't invented.
 */
export interface Tally { n: number; sum: number; best: number; bands: Partial<Record<string, number>>; mastery: number }
export interface Journey {
  totals: Partial<Record<string, Tally>>;
  byTerm: Record<string, Partial<Record<string, Tally>>>;
  milestones: { at: number; kind: 'run' | 'first-strong' | 'first-exceptional' | 'first-mastery'; what: string; overall: number; detail?: string }[];
  since?: number;
  detailBefore?: number;
  /**
   * What has held work back, for life (from 2026-10-12, `systems/artistry.ts`): each limit among a piece's kept three,
   * by kind and what, how many pieces and the points of the whole summed. The detail keeps 160 pieces; a weakness that
   * recurs across years is read here.
   */
  limits?: Record<string, { label: string; n: number; whole: number; last: number }>;
  /** Notes given on the craft and by direction, worked and answered, and the ways reached for (from 2026-10-12). */
  direction?: { given: number; worked: number; answered: number; ways: Record<string, number> };
  /** Work played with others: scenes, takes with a reader and nights with a company, their sum, the slips and those covered. */
  together?: { n: number; sum: number; slips: number; covered: number };
}
export const MILESTONES_KEPT = 300;

export const journeyOf = (person: Person): Journey => (person.journey ??= { totals: {}, byTerm: {}, milestones: [] });

/** The half-year a moment falls in, by the calendar: what `Journey.byTerm` is keyed by. */
export function halfOf(at: number): string {
  const d = new Date(at);
  return `${d.getUTCFullYear()} ${d.getUTCMonth() < 6 ? 'Spring' : 'Fall'}`;
}

const bandKey = (overall: number) => bandOfQuality(overall);
function addTo(t: Tally | undefined, r: Pick<WorkRecord, 'overall' | 'mastery'>, sign: 1 | -1): Tally {
  const out: Tally = t ?? { n: 0, sum: 0, best: 0, bands: {}, mastery: 0 };
  out.n += sign;
  out.sum = Math.round((out.sum + sign * r.overall) * 10) / 10;
  if (sign > 0) out.best = Math.max(out.best, r.overall);
  const b = bandKey(r.overall);
  out.bands[b] = (out.bands[b] ?? 0) + sign;
  if (r.mastery) out.mastery += sign;
  return out;
}

/** A piece's limits, each input once: its cost the sum across the dimensions it reaches (`countWork`, the backfill in `loadSave`). */
export function limitsOnce(limits: readonly Pick<Limit, 'kind' | 'what' | 'label' | 'by' | 'whole'>[]): Map<string, { label: string; whole: number }> {
  const once = new Map<string, { label: string; whole: number }>();
  for (const l of limits) {
    const k = `${l.kind}:${l.what}`;
    const x = once.get(k) ?? { label: l.label, whole: 0 };
    x.whole += l.whole ?? l.by / 4;
    once.set(k, x);
  }
  return once;
}

/** A result counted in the journey (`sign` -1 to take one back out, when the same work is judged again). */
export function countWork(person: Person, r: Pick<WorkRecord, 'at' | 'task' | 'overall' | 'mastery' | 'what'> & Partial<Pick<WorkRecord, 'limits'>>, sign: 1 | -1 = 1): void {
  const j = journeyOf(person);
  j.since = Math.min(j.since ?? r.at, r.at);
  j.totals[r.task] = addTo(j.totals[r.task], r, sign);
  const term = (j.byTerm[halfOf(r.at)] ??= {});
  term[r.task] = addTo(term[r.task], r, sign);
  // What held it back, for life (from 2026-10-12): a piece judged again takes its last limits back out. A limit is
  // listed once for each dimension it reaches, so a piece counts once for what held it back, its cost the sum across
  // the dimensions (from 2026-10-12, round three of the defect pass: until then each dimension counted, and a piece
  // held back by listening in three dimensions counted as three pieces, n=15 against 12 pieces on a played save).
  for (const [k, x] of limitsOnce((r as Pick<WorkRecord, 'limits'>).limits ?? [])) {
    const t = ((j.limits ??= {})[k] ??= { label: x.label, n: 0, whole: 0, last: r.at });
    t.n += sign;
    t.whole = Math.round((t.whole + sign * x.whole) * 10) / 10;
    if (sign > 0) t.last = Math.max(t.last, r.at);
    if (t.n <= 0) delete j.limits![k];
  }
  if (sign < 0) return;
  // The firsts, once each.
  const first = (kind: Journey['milestones'][number]['kind']) => !j.milestones.some((m) => m.kind === kind);
  const band = bandKey(r.overall);
  if ((band === 'strong' || band === 'exceptional') && first('first-strong')) milestone(person, { at: r.at, kind: 'first-strong', what: r.what, overall: r.overall });
  if (band === 'exceptional' && first('first-exceptional')) milestone(person, { at: r.at, kind: 'first-exceptional', what: r.what, overall: r.overall });
  if (r.mastery && first('first-mastery')) milestone(person, { at: r.at, kind: 'first-mastery', what: r.what, overall: r.overall });
}

/** Work played with others counted for life (`Journey.together`, from 2026-10-12). */
export function countTogether(person: Person, t: { overall: number; slip?: { covered: number } }): void {
  const x = (journeyOf(person).together ??= { n: 0, sum: 0, slips: 0, covered: 0 });
  x.n += 1;
  x.sum = Math.round((x.sum + t.overall) * 10) / 10;
  if (t.slip) { x.slips += 1; if (t.slip.covered >= 0.5) x.covered += 1; }
}

/** A note on the craft or a direction counted for life (`Journey.direction`, from 2026-10-12): given, worked (and how), answered. */
export function countDirection(person: Person, what: { given?: boolean; worked?: string; answered?: boolean }): void {
  const x = (journeyOf(person).direction ??= { given: 0, worked: 0, answered: 0, ways: {} });
  if (what.given) x.given += 1;
  if (what.worked) { x.worked += 1; x.ways[what.worked] = (x.ways[what.worked] ?? 0) + 1; }
  if (what.answered) x.answered += 1;
}

export function milestone(person: Person, m: Journey['milestones'][number]): void {
  const j = journeyOf(person);
  j.milestones.push(m);
  if (j.milestones.length > MILESTONES_KEPT) j.milestones.splice(0, j.milestones.length - MILESTONES_KEPT);
}

/** Keeps a judged piece of work on the person's history, once for its key: judged again, it replaces itself, in the counts too. */
export function recordWork(_sim: Simulation, person: Person, e: Evaluation, at: { at: number; what: string; band?: string }): WorkRecord {
  const record: WorkRecord = {
    at: at.at, task: e.task, taskLabel: e.taskLabel, what: at.what, overall: e.overall, ...(at.band ? { band: at.band } : {}),
    dims: Object.fromEntries(e.dimensions.map((d) => [d.dimension, d.quality])), mastery: e.mastery, limits: e.limits.slice(0, 3),
    ruleset: e.ruleset, inputs: e.inputs,
  };
  const work = (person.work ??= []);
  const same = work.findIndex((w) => w.inputs.key === e.inputs.key);
  if (same >= 0) { countWork(person, work[same]!, -1); work[same] = record; }
  else work.push(record);
  countWork(person, record);
  if (work.length > WORK_KEPT) work.splice(0, work.length - WORK_KEPT);
  return record;
}

/** A whole result in a band, for the systems that read one (coursework's, a night's): LAMDA's Pass, Merit and Distinction. */
export function bandOfQuality(q: number): 'unready' | 'working' | 'strong' | 'exceptional' {
  const b = EVALUATION.bands;
  return q >= b.exceptional ? 'exceptional' : q >= b.strong ? 'strong' : q >= b.working ? 'working' : 'unready';
}

/**
 * A condition's label as the subject of a sentence: “Shaken By A Slip In The Middle” as being shaken by a slip in the
 * middle. A part of a piece is named by `segmentNames` and `beatSegments` (“The Close”, “Beat 3”, “Part 2”), none of them
 * a proper name, so it reads in lower case (from 2026-10-19, brief 15: until then only “The” was, and “by the Close”).
 */
function conditionWords(l: Pick<Limit, 'what' | 'label'>): string {
  const part = (s: string) => s.toLowerCase();
  if (l.what === 'fatigue') {
    // “Readiness At 61, Under 80”, said as a sentence says it (from 2026-10-19, brief 15: until then “Tiredness
    // (readiness at 61, under 80)”); a label from an older save that doesn't read so says only the tiredness.
    const m = /^Readiness At (\d+), Under (\d+)$/.exec(l.label);
    return m ? `Being tired (readiness ${m[1]}, below ${m[2]})` : 'Being tired';
  }
  if (l.what === 'illness') return 'Being down with the flu';
  if (l.what === 'injury') return `Working with ${l.label.charAt(0).toLowerCase()}${l.label.slice(1).toLowerCase()}`;
  if (l.what === 'stamina') return `Running low on stamina${l.label.startsWith('Stamina, By ') ? ` by ${part(l.label.slice('Stamina, By '.length))}` : ''}`;
  if (l.what === 'shaken') return `Being shaken by a slip${l.label.startsWith('Shaken By A Slip In ') ? ` in ${part(l.label.slice('Shaken By A Slip In '.length))}` : ''}`;
  return l.label;
}

/** Points a limit cost a quality, as a teacher says them: whole points of 100, not the engine's tenths. */
const pointsWords = (by: number): string => (by < 0.5 ? 'less than a point' : `${plural(Math.round(by), 'point')} out of 100`);

/** An ability or a technique, as a sentence names it: “vocal expression”, “on-camera work”. */
const skillWords = (l: Pick<Limit, 'kind' | 'what' | 'label'>): string => (l.kind === 'technique' ? SKILL_WORDS[l.what as Skill] ?? l.label.toLowerCase() : l.label.toLowerCase());

/**
 * A part of the preparation as the subject of a sentence: a task's own words as they are (“Learning the lines”), and a
 * card's Title Case label in quotes, as a name (“Lines”), so that “Lines wasn’t complete” doesn't read as a plural.
 */
const partWords = (label: string): string => (/^[A-Z][^ ]*( [A-Z][^ ]*)*$/.test(label) ? `“${label}”` : label);

/**
 * A way of playing that doesn't fit, said in brackets: its side in lower case, then its reason (`misfitOf`, “Expansive:
 * …”) after a semicolon, since the reason can hold a colon of its own, and without its own full stop.
 */
const fitWords = (label: string): string => label.replace(/\.$/, '').replace(/^(\w+): (The )?/, (_, side: string, the?: string) => `${side.toLowerCase()}; ${the ? 'the ' : ''}`);

/**
 * The first limit worth saying, in words built from the result: of a piece shown (`past`), or of one as it would be shown
 * now (`now`, a forecast). From 2026-10-17 (brief 14) the two read in their own tense, and each quality by the name the
 * screen gives it; until then a forecast said “wasn’t complete”, a condition opened on its Title Case label, and “the
 * choices wasn’t complete” could be printed. From 2026-10-19 (brief 15) a teacher's words: the quality and the ability in
 * lower case, as “your execution”, and the cost in whole points out of 100 (the limit's own `by`, rounded only in the
 * sentence), where until then it read “Your Vocal Expression held back Execution by 25.7 points”.
 */
export function chiefLimit(e: Pick<Evaluation, 'limits'>, tense: 'past' | 'now' = 'past'): string | undefined {
  const l = e.limits[0];
  if (!l) return undefined;
  const now = tense === 'now';
  const quality = `your ${DIMENSION_LABEL[l.dimension].toLowerCase()}`;
  const cost = `${now ? 'and that costs' : 'and that cost'} ${quality} ${pointsWords(l.by)}`;
  if (l.kind === 'preparation') return `${partWords(l.label)} ${now ? 'isn’t' : 'wasn’t'} complete, ${cost}`;
  if (l.kind === 'condition') return `${conditionWords(l)} ${now ? 'costs' : 'cost'} ${quality} ${pointsWords(l.by)}`;
  if (l.kind === 'difficulty') return `The piece ${now ? 'asks' : 'asked'} more than your craft can give yet, ${cost}`;
  if (l.kind === 'fit') return `The way you ${now ? 'are playing it doesn’t' : 'played it didn’t'} fit the piece (${fitWords(l.label)}), ${cost}`;
  if (l.kind === 'suitability') return `The way you ${now ? 'are playing it doesn’t' : 'played it didn’t'} suit the scene (${l.label.toLowerCase()}), ${cost}`;
  return `Your ${skillWords(l)} ${now ? 'holds' : 'held'} back ${quality} by ${pointsWords(l.by)}`;
}
