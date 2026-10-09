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
 *               part it reads is complete;
 *   condition = 1 when the day's condition is sufficient (readiness at
 *               `sufficientReadiness` or over, and no named cause that reaches
 *               the dimension: the flu for the voice, an injury for the body),
 *               less by each named cause otherwise;
 *   variation = a bounded draw, ± variation × (1 − shaped), so it narrows as
 *               mastery rises and is nothing at full capacity;
 *   quality   = 100 × shaped × prepared × condition + variation, held to
 *               0..100.
 *
 * The whole is the dimensions' weighted mean for `meanShare` of it and the
 * weakest for the rest, so one strength doesn't erase an unrelated weakness.
 *
 * The guarantee: every ability a task reads at 100, every technique it reads
 * at MASTERED, every part of preparation complete and the condition
 * sufficient, then capacity is 1, shaped is 1, prepared is 1, condition is 1
 * and variation is 0: every dimension and the whole are 100. A dimension's
 * quality never falls as an input it reads rises, holding the rest: the
 * variation's slope against shaped is at most `variation` points, and the
 * least prepared × condition can be (0.35 × 0.6 × 0.85 × 0.6, 0.107) gives
 * the rest at least 10.7, so quality rises (`tests/evaluation.test.ts` holds
 * both). Inputs a task doesn't read change nothing.
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
import type { Skill } from '../content/school';

export type { Dimension, TaskProfile } from '../content/tasks';

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
  /** Genre families the material belongs to, which lean the dimensions' weights (`content/tasks.ts`, normalized). */
  families?: readonly string[];
  /** A stable key for the bounded draw: the same work on the same day draws the same. */
  key: string;
}

/** The day's condition as the task meets it: readiness (with the hour's fit), and anything concrete that limits a dimension. */
export interface Condition {
  readiness: number;
  ill?: boolean;
  injured?: boolean;
}

export interface Limit {
  kind: 'ability' | 'technique' | 'preparation' | 'condition' | 'difficulty';
  what: string;
  label: string;
  dimension: Dimension;
  /** The points it cost the dimension: the dimension again with it made whole, less the dimension as it was. */
  by: number;
}

export interface DimensionResult {
  dimension: Dimension;
  label: string;
  quality: number;
  capacity: number;
  prepared: number;
  condition: number;
  variation: number;
  strongest?: { what: string; label: string };
  limits: Limit[];
}

export interface Evaluation {
  ruleset: string;
  task: string;
  taskLabel: string;
  dimensions: DimensionResult[];
  overall: number;
  /** Whether everything the guarantee asks was met: every input at mastery, preparation complete, condition sufficient. */
  mastery: boolean;
  /** Every dimension's limits, the costliest first. */
  limits: Limit[];
  /** The inputs as they stood, to work it out again. */
  inputs: { abilities: Partial<Record<AbilityId, number>>; techniques: Partial<Record<Skill, number>>; prep: Record<string, number>; required: Record<string, number>; difficulty: number; condition: Condition; families: readonly string[]; key: string };
}

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const r1 = (x: number) => Math.round(x * 10) / 10;

/** A small deterministic hash to [-1, 1), for the bounded draw. */
export function draw(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i += 1) h = Math.imul(h ^ key.charCodeAt(i), 16777619) >>> 0;
  return (h % 2_000_000) / 1_000_000 - 1;
}

/** The dimension weights leant by the material's genre families, normalized so adding families adds nothing. */
export function leanedWeights(task: TaskProfile, families: readonly string[] = []): Partial<Record<Dimension, number>> {
  const base = Object.fromEntries(Object.entries(task.dims).map(([d, s]) => [d, s!.weight])) as Partial<Record<Dimension, number>>;
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
function termsOf(spec: DimensionSpec, level: (a: AbilityId) => number, full: (a: AbilityId) => number, techniques: Partial<Record<Skill, number>>, craft: Partial<Record<Skill, number>>): Term[] {
  const techTotal = Object.values(techniques).reduce((a, b) => a + (b ?? 0), 0);
  const out: Term[] = [];
  for (const input of spec.inputs) {
    if ('ability' in input) out.push({ kind: 'ability', what: input.ability, label: abilityDef(input.ability).label, weight: input.weight, n: clamp(level(input.ability) / full(input.ability), 0, 1) });
    else if (techTotal > 0) {
      for (const [skill, w] of Object.entries(techniques) as [Skill, number][]) {
        out.push({ kind: 'technique', what: skill, label: TECHNIQUE_LABEL[skill], weight: (input.weight * w) / techTotal, n: clamp((craft[skill] ?? 0) / MASTERED, 0, 1) });
      }
    }
  }
  return out;
}

/** A dimension's parts, worked out from its terms, preparation and condition factors: the one formula every limit reruns. */
function dimensionQuality(terms: readonly Term[], difficulty: number, prepared: number, condition: number, d: number): { capacity: number; shaped: number; variation: number; quality: number } {
  const total = terms.reduce((s, t) => s + t.weight, 0);
  const capacity = total > 0 ? terms.reduce((s, t) => s + t.weight * t.n, 0) / total : 1;
  const shaped = capacity ** (1 + difficulty);
  // Nothing at full capacity, exactly: not a negative zero.
  const variation = shaped >= 1 ? 0 : EVALUATION.variation * (1 - shaped) * d;
  return { capacity, shaped, variation, quality: clamp(100 * shaped * prepared * condition + variation, 0, 100) };
}

/** Judges a piece of work: each dimension, then the whole, with what carried it and what held it back. */
export function evaluate(sim: Simulation, person: Person, ctx: EvalContext): Evaluation {
  const E = EVALUATION;
  const abilities: Partial<Record<AbilityId, number>> = {};
  const level = (a: AbilityId) => (abilities[a] ??= abilityOf(sim, person, a));
  // Only the learned techniques: a skill kept as an ability (Emotional Depth, Memory, Vocal and Physical Expression) is
  // read by the dimensions that name it, and counted there once.
  const techniques = Object.fromEntries(Object.entries(ctx.techniques).filter(([k, w]) => TECHNIQUES.includes(k as Skill) && (w ?? 0) > 0)) as Partial<Record<Skill, number>>;
  const craft = person.craft ?? {};
  const dims: DimensionResult[] = [];
  const weights = leanedWeights(ctx.task, ctx.families);
  let mastery = true;

  for (const [d, spec] of Object.entries(ctx.task.dims) as [Dimension, DimensionSpec][]) {
    const terms = termsOf(spec, level, (a) => abilityFull(sim, person, a), techniques, craft);
    // The draw is the save's own, by its seed: two lives don't draw the same night.
    const dr = draw(`${sim.universe.meta.seed}:${ctx.key}:${d}`);
    // Preparation: each part it reads against what completes it; the least of them counts.
    const parts = (spec.prep ?? []).filter((p) => ctx.prep[p] !== undefined).map((p) => {
      const need = ctx.required[p] ?? 1;
      return { part: p, f: E.prepFloor + (1 - E.prepFloor) * Math.min(1, need > 0 ? ctx.prep[p]! / need : 1) };
    });
    const prepared = parts.reduce((m, p) => Math.min(m, p.f), 1);
    // Condition: readiness under sufficient, and a named cause where it reaches this dimension.
    const reaches = spec.conditions ?? [];
    const causes: { what: 'fatigue' | 'illness' | 'injury'; label: string; f: number }[] = [];
    if (ctx.condition.readiness < E.sufficientReadiness && reaches.includes('fatigue')) causes.push({ what: 'fatigue', label: `Readiness At ${Math.round(ctx.condition.readiness)}, Under ${E.sufficientReadiness}`, f: E.fatigueFloor + (1 - E.fatigueFloor) * clamp(ctx.condition.readiness / E.sufficientReadiness, 0, 1) });
    if (ctx.condition.ill && reaches.includes('illness')) causes.push({ what: 'illness', label: 'Down With The Flu', f: E.illness });
    if (ctx.condition.injured && reaches.includes('injury')) causes.push({ what: 'injury', label: 'An Injury Still Mending', f: E.injury });
    const condition = causes.reduce((p, c) => p * c.f, 1);

    const now = dimensionQuality(terms, ctx.difficulty, prepared, condition, dr);
    const limits: Limit[] = [];
    const cost = (q: number) => r1(Math.max(0, q - now.quality));
    for (const [i, t] of terms.entries()) {
      if (t.n >= 1) continue;
      mastery = false;
      const whole = terms.map((x, j) => (j === i ? { ...x, n: 1 } : x));
      limits.push({ kind: t.kind, what: t.what, label: t.label, dimension: d, by: cost(dimensionQuality(whole, ctx.difficulty, prepared, condition, dr).quality) });
    }
    if (now.capacity < 1 && ctx.difficulty > 0) limits.push({ kind: 'difficulty', what: 'difficulty', label: 'How Hard The Work Is', dimension: d, by: cost(dimensionQuality(terms, 0, prepared, condition, dr).quality) });
    for (const p of parts) {
      if (p.f >= 1) continue;
      mastery = false;
      const rest = parts.reduce((m, x) => (x === p ? m : Math.min(m, x.f)), 1);
      limits.push({ kind: 'preparation', what: p.part, label: ctx.task.prepLabel?.[p.part] ?? p.part, dimension: d, by: cost(dimensionQuality(terms, ctx.difficulty, rest, condition, dr).quality) });
    }
    for (const c of causes) {
      mastery = false;
      limits.push({ kind: 'condition', what: c.what, label: c.label, dimension: d, by: cost(dimensionQuality(terms, ctx.difficulty, prepared, condition / c.f, dr).quality) });
    }
    const strongest = terms.reduce<Term | undefined>((b, t) => (!b || t.n > b.n ? t : b), undefined);
    dims.push({ dimension: d, label: DIMENSION_LABEL[d], quality: r1(now.quality), capacity: now.capacity, prepared, condition, variation: now.variation, ...(strongest ? { strongest: { what: strongest.what, label: strongest.label } } : {}), limits: limits.filter((l) => l.by > 0).sort((a, b) => b.by - a.by) });
  }

  const wTotal = dims.reduce((s, x) => s + (weights[x.dimension] ?? 0), 0);
  const weighted = wTotal > 0 ? dims.reduce((s, x) => s + x.quality * (weights[x.dimension] ?? 0), 0) / wTotal : 0;
  const weakest = dims.length ? Math.min(...dims.map((x) => x.quality)) : 0;
  const overall = r1(E.meanShare * weighted + (1 - E.meanShare) * weakest);
  return {
    ruleset: RULESET, task: ctx.task.id, taskLabel: ctx.task.label, dimensions: dims, overall, mastery,
    limits: dims.flatMap((x) => x.limits).sort((a, b) => b.by - a.by),
    inputs: { abilities: { ...abilities }, techniques, prep: { ...ctx.prep }, required: { ...ctx.required }, difficulty: ctx.difficulty, condition: { ...ctx.condition }, families: ctx.families ?? [], key: ctx.key },
  };
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

/** Keeps a judged piece of work on the person's history, once for its key: judged again, it replaces itself. */
export function recordWork(_sim: Simulation, person: Person, e: Evaluation, at: { at: number; what: string; band?: string }): WorkRecord {
  const record: WorkRecord = {
    at: at.at, task: e.task, taskLabel: e.taskLabel, what: at.what, overall: e.overall, ...(at.band ? { band: at.band } : {}),
    dims: Object.fromEntries(e.dimensions.map((d) => [d.dimension, d.quality])), mastery: e.mastery, limits: e.limits.slice(0, 3),
    ruleset: e.ruleset, inputs: e.inputs,
  };
  const work = (person.work ??= []);
  const same = work.findIndex((w) => w.inputs.key === e.inputs.key);
  if (same >= 0) work[same] = record;
  else work.push(record);
  if (work.length > WORK_KEPT) work.splice(0, work.length - WORK_KEPT);
  return record;
}

/** A whole result in a band, for the systems that read one (coursework's, a night's): LAMDA's Pass, Merit and Distinction. */
export function bandOfQuality(q: number): 'unready' | 'working' | 'strong' | 'exceptional' {
  const b = EVALUATION.bands;
  return q >= b.exceptional ? 'exceptional' : q >= b.strong ? 'strong' : q >= b.working ? 'working' : 'unready';
}

/** The first limit worth saying, in words built from the result. */
export function chiefLimit(e: Pick<Evaluation, 'limits'>): string | undefined {
  const l = e.limits[0];
  if (!l) return undefined;
  const dim = DIMENSION_LABEL[l.dimension].toLowerCase();
  if (l.kind === 'preparation') return `${l.label} wasn’t complete, which cost the ${dim} ${l.by} points`;
  if (l.kind === 'condition') return `${l.label}, which cost the ${dim} ${l.by} points`;
  if (l.kind === 'difficulty') return `The work asked more than the craft yet holds, which cost the ${dim} ${l.by} points`;
  return `${l.label} held back the ${dim} by ${l.by} points`;
}
