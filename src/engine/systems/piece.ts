/**
 * SLATE — a piece of work judged in its segments (from 2026-10-12; `content/piece.ts` says what and why).
 *
 * `judgePiece` judges each segment through `judge`, the one evaluation, with the segment's own tones, rehearsal,
 * place in the piece and the slip before it, and returns an Evaluation of the whole: its overall the segments' mean by
 * length, each dimension likewise, the limits merged (a limit in two segments is one limit, its cost the mean of both),
 * and the segments themselves, with continuity, for the work's look. The spec is kept on the result, so a kept result
 * works out again (`replay`).
 *
 * Nothing is counted twice:
 * - a segment's rehearsal replaces the piece's rehearsal in that segment's judgment; it isn't added to it;
 * - stamina is read through the drain, and its share of a dimension's inputs is taken out for a segmented piece, a
 *   segment's own way's among them (from 2026-10-12; until then a segment played its own way still drew on it);
 * - the slip is the segment's own draw, and what it carries into the next is the only thing it carries;
 * - continuity is read from the segments' results and isn't added to the overall.
 */

import { PIECE, TONE_LEAN } from '../content/piece';
import { APPROACH_EFFECT, PLAYING } from '../content/approaches';
import { WORKBOOK, type AdjustmentId } from '../content/workbook';
import type { Axis, AxisValue } from '../content/material';
import type { Instant } from '../core/time';
import type { Tone } from '../content/material';
import type { Dimension, DimensionSpec, TaskProfile } from '../content/tasks';
import type { AbilityId } from '../content/abilities';
import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { judgeExact, leanedWeights, performerOf, rounded, type DimensionResult, type EvalContext, type Evaluation, type Limit, type Performer } from './evaluation';

/**
 * One segment: what it's called on screen, its tones, its share of the piece, and whether a turn leads into it or it's
 * held two ways. `length` (from 2026-10-16, evaluation-10) is how much of the piece's running it takes, for where the
 * ones after it fall, one where it isn't given: a unit of a tone section cut at its turns takes its share of the section
 * (`unitSegments`). A brief's heart weighs more in the whole (`BRIEF.readingHeart`) and takes no longer.
 */
export interface SegmentSpec { label: string; tones: readonly Tone[]; weight: number; turnInto: boolean; blend: boolean; length?: number }

/** What a segment played its own way adds to it (a discovery kept, `systems/workbook.ts`): leaned, drawn on, rehearsed in, fitting or not. */
export interface SegmentOwn {
  lean?: Partial<Record<Dimension, number>>;
  inputs?: Partial<Record<Dimension, readonly { ability: AbilityId; weight: number }[]>>;
  extraPrep?: Partial<Record<Dimension, readonly string[]>>;
  fit?: Partial<Record<Dimension, { f: number; label: string }>>;
  prep?: Record<string, number>;
  required?: Record<string, number>;
}

export interface PieceSpec {
  segments: readonly SegmentSpec[];
  /** Focused work on each segment, 0 to 1: the part a segment reads is 1 − (1 − the piece's part) × (1 − its work). */
  work: readonly number[];
  /** The part of preparation the segments refine: a brief's and a scene's rehearsal, a night's blocking. */
  part: string;
  /** What a segment asks of that part more, for a turn into it and for being held two ways, never past `most`. */
  perTurn: number;
  perBlend: number;
  most: number;
  /** How hard the piece is on stamina, 0 to 1. */
  load: number;
  own?: readonly (SegmentOwn | undefined)[];
}

export interface SegmentResult {
  label: string;
  tones: readonly Tone[];
  overall: number;
  /** What it would have come to with no draw. */
  expected: number;
  dims: Partial<Record<Dimension, number>>;
  /** Its own rehearsal, against what completes it there. */
  part: number;
  required: number;
  /** The stamina drain's factor here: 1 where it doesn't tire. */
  drain: number;
  /** A slip: points under what was expected. */
  slip?: number;
  /** The factor a slip before it left on it. */
  shaken?: number;
  /** What held it back most, in points of the segment. */
  chief?: Limit;
  /** Its three costliest limits, for what a problem in it is called (`systems/workbook.ts`). */
  top?: Limit[];
}

export interface PieceResult {
  segments: SegmentResult[];
  /** How evenly the character held across the segments: 100 less the spread of their belief and interpretation. */
  continuity: number;
  /** The weakest segment's result. */
  lowest: number;
}

/** The names of a scene's or a night's segments, by how many there are. */
function segmentNames(n: number): string[] {
  if (n === 2) return ['The First Half', 'The Second Half'];
  if (n === 3) return ['The Opening', 'The Middle', 'The Close'];
  return Array.from({ length: n }, (_, i) => `Part ${i + 1}`);
}

const key = (tones: readonly Tone[]) => [...tones].sort().join('+');

/** A brief's beats as segments: each beat its own, a turn where its tones change from the beat before, a blend where it holds two. */
export function beatSegments(beats: readonly { tones: readonly Tone[] }[]): SegmentSpec[] {
  return beats.map((b, i) => ({ label: `Beat ${i + 1}`, tones: b.tones, weight: 1, turnInto: i > 0 && key(b.tones) !== key(beats[i - 1]!.tones), blend: new Set(b.tones).size > 1 }));
}

/**
 * A scene's or a play's tones, in order, as segments: a play has two at least, a first half and a second, however few
 * tones it has. A new play with no profile (a festival's, a cabaret's) is its two halves with no tones said: nothing is
 * assumed of a text the game doesn't have.
 */
export function toneSegments(tones: readonly Tone[], least = 1): SegmentSpec[] {
  if (!tones.length) return segmentNames(Math.max(1, least)).map((label) => ({ label, tones: [], weight: 1, turnInto: false, blend: false }));
  const list = tones.length >= least ? [...tones] : Array.from({ length: least }, (_, i) => tones[Math.min(i, tones.length - 1)]!);
  const names = segmentNames(list.length);
  return list.map((t, i) => ({ label: names[i]!, tones: [t], weight: 1, turnInto: i > 0 && t !== list[i - 1], blend: false }));
}

/**
 * A scene's or a play's units (from 2026-10-16, evaluation-10, brief 09's follow-up): its tones in order, each section of
 * a tone cut again at each of its turns, so the piece is judged in as many parts as its action shifts. Stanislavski
 * divides a role into bits by its action, "a new bit begins whenever an action or counteraction shifts in manner of
 * execution or strategy" (An Actor Prepares, "Units and Objectives", 1936; the glossary Wikipedia's "Unit of action"
 * cites, read 2026-10-16), not by its length; a profile's turns are those shifts beyond its changes of tone
 * (`MaterialProfile.turns`), as a brief's are its beats. Until then a scene and a play were cut only where the tone
 * changed (`toneSegments`), so a scene of one tone with three reversals was two halves, and the long score of units a
 * brief's beats ask discipline for (`DEMAND_EFFECT.beats`) reached no scene and no night.
 *
 * Where in a section a turn falls the profile doesn't say, so the turns go to the sections in order, one a round, and each
 * section keeps the weight it had, shared among its units: the tones' mix is as it was, and what changes is how many parts
 * the piece is held through. A unit after the first starts with a shift, a turn or a change of tone. A piece with no turns
 * or no tones is cut as `toneSegments` cuts it.
 */
export function unitSegments(m: { tones: readonly Tone[]; turns: number }, least = 1): SegmentSpec[] {
  const counts = unitCounts(m);
  if (!counts) return toneSegments(m.tones, least);
  const names = segmentNames(counts.reduce((a, b) => a + b, 0));
  const out: SegmentSpec[] = [];
  m.tones.forEach((t, i) => {
    for (let u = 0; u < counts[i]!; u += 1) out.push({ label: names[out.length]!, tones: [t], weight: 1 / counts[i]!, length: 1 / counts[i]!, turnInto: u > 0 || (i > 0 && t !== m.tones[i - 1]), blend: false });
  });
  return out;
}

/** How much of a piece's running a segment takes (`SegmentSpec.length`): one where it isn't given. */
const lengthOf = (x: SegmentSpec): number => x.length ?? 1;

/** How many units each tone section is cut into (`unitSegments`), or none where the piece is cut as its tones are. */
function unitCounts(m: { tones: readonly Tone[]; turns: number }): number[] | undefined {
  const turns = Math.max(0, Math.floor(m.turns));
  if (!m.tones.length || !turns) return undefined;
  const counts = m.tones.map(() => 1);
  for (let k = 0; k < turns; k += 1) counts[k % counts.length]! += 1;
  return counts;
}

/**
 * For each of a piece's units, the segment `toneSegments` cut it into until evaluation-10: where a save's work on a
 * segment, written under that cut, goes once the piece is its units (`cutIntoUnits`, `engine/index.ts`). A unit of a tone
 * section takes its section's; where a piece of one tone was its two halves, a unit takes the half its middle falls in.
 */
export function unitsFromTones(m: { tones: readonly Tone[]; turns: number }, least = 1): number[] {
  const counts = unitCounts(m);
  if (!counts) return toneSegments(m.tones, least).map((_, s) => s);
  const n = counts.reduce((a, b) => a + b, 0);
  const halves = Math.max(least, m.tones.length);
  if (m.tones.length >= least) return counts.flatMap((c, i) => Array.from({ length: c }, () => i));
  return Array.from({ length: n }, (_, u) => Math.min(halves - 1, Math.floor(((u + 0.5) / n) * halves)));
}

/** How hard a piece is on stamina (`PIECE.load`), from the body's and the voice's work it stages. */
export function loadOf(m: { physical: number; vocal: number }, kind: 'brief' | 'scene' | 'night', medium = false): number {
  const L = PIECE.load;
  if (kind === 'night') return clamp(L.night + (m.physical + m.vocal) * L.nightPerLevel, 0, 1);
  const base = kind === 'brief' ? (medium ? L.briefMedium : L.brief) : L.scene;
  return clamp(base + (m.physical + m.vocal) * L.perLevel, 0, 1);
}

const r1 = (x: number) => Math.round(x * 10) / 10;
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

// ---------------------------------------------------------------------------
// The workbook a piece keeps (`systems/workbook.ts`), as a piece reads it
// ---------------------------------------------------------------------------

/** A problem found in a piece's forecast: what kind, which segment, what it's called, why, and its figure when found. */
export interface Problem { id: string; kind: import('../content/workbook').ProblemKind; segment?: number; label: string; why: string; measure: number }

/** A segment played its own way: one side of one axis the whole leaves open, and how far it's rehearsed in. */
export interface SegmentWay { axis: Axis; side: AxisValue; prep: number }

/** An adjustment tried: on which problem, its figure before and after, and whether it was kept or put back. */
export interface Try {
  at: Instant; problem: string; label: string; adjustment: AdjustmentId; option?: string; segment?: number;
  before: number; after: number; verdict: 'kept' | 'revised' | 'pending';
}

/**
 * What a piece in progress keeps (from 2026-10-12): the problem being worked on, the tries and their evidence, and the
 * discoveries kept, a segment's own way and places to breathe, which every later forecast and performance reads.
 */
export interface Workbook {
  problem?: Problem & { at: Instant };
  tries: Try[];
  ways?: (SegmentWay | null)[];
  breathe?: boolean;
  /** What putting a pending change back restores. */
  undo?: { ways?: (SegmentWay | null)[]; breathe?: boolean };
}

/**
 * Work on its feet rehearses in each segment's own way the workbook kept, as it rehearses in the whole piece's way of
 * playing (`rehearseChoice`, by `PLAYING.gainShare` of the gain), from 2026-10-12. Until then a kept way was rehearsed in
 * only by trying it again or by Working It Slowly, so a mastered actor who kept one came to every later call short of
 * 100 by their own discovery (`tests/direction-mastery.test.ts`: 91.9, 4.3 points of it a way 60% rehearsed in). A way
 * still pending is rehearsed too; putting it back restores the ways as they were before it was tried.
 */
export function rehearseWays(book: Workbook | undefined, gain: number): void {
  if (!book?.ways?.some(Boolean)) return;
  book.ways = book.ways.map((w) => (w ? { ...w, prep: Math.min(1, w.prep + gain * PLAYING.gainShare * (1 - w.prep)) } : w));
}

/** A piece's spec with its workbook's discoveries in it: each segment's own way, rehearsed in, and the breath found. */
export function withBook(spec: PieceSpec, book: Workbook | undefined): PieceSpec {
  if (!book || (!book.ways?.some(Boolean) && !book.breathe)) return spec;
  const own = spec.segments.map((_, s): SegmentOwn | undefined => {
    const way = book.ways?.[s];
    if (!way) return undefined;
    const e = APPROACH_EFFECT[way.side];
    const extraPrep = Object.fromEntries(Object.entries(e.lean).filter(([, x]) => x >= 1.1).map(([d]) => [d, ['way']]));
    return { lean: e.lean, inputs: e.inputs, extraPrep, prep: { way: way.prep }, required: { way: PLAYING.complete } };
  });
  return { ...spec, ...(own.some(Boolean) ? { own } : {}), load: spec.load * (book.breathe ? WORKBOOK.breathe : 1) };
}

/** A task with stamina taken out of its dimensions' inputs: a segmented piece reads it through the drain instead. */
const STRIPPED = new Map<string, TaskProfile>();
function withoutStamina(task: TaskProfile): TaskProfile {
  let t = STRIPPED.get(task.id);
  if (t) return t;
  const dims = Object.fromEntries((Object.entries(task.dims) as [Dimension, DimensionSpec][]).map(([d, spec]) => [d, { ...spec, inputs: spec.inputs.filter((x) => !('ability' in x) || x.ability !== 'stamina') }])) as TaskProfile['dims'];
  t = { ...task, dims };
  STRIPPED.set(task.id, t);
  return t;
}

const noStamina = (inputs: EvalContext['inputs']): EvalContext['inputs'] => (inputs ? Object.fromEntries(Object.entries(inputs).map(([d, xs]) => [d, (xs ?? []).filter((x) => x.ability !== 'stamina')])) : undefined);

/** A genre families' lean as a multiplier on each of a task's weights, so a segment or an objective can lean on top of it. */
export function familyLean(task: TaskProfile, families: readonly string[]): Partial<Record<Dimension, number>> {
  const w = leanedWeights(task, families);
  return Object.fromEntries((Object.keys(task.dims) as Dimension[]).map((d) => [d, (w[d] ?? 0) / (task.dims[d]!.weight || 1)]));
}

/** A segment's lean: the piece's, its tones' (each tone's lean to the power of one over how many it holds), and its own way's. */
function segmentLean(base: Partial<Record<Dimension, number>>, tones: readonly Tone[], own?: SegmentOwn): Partial<Record<Dimension, number>> {
  const out: Partial<Record<Dimension, number>> = { ...base };
  for (const d of Object.keys(out) as Dimension[]) {
    let x = out[d]!;
    for (const t of tones) x *= (TONE_LEAN[t]?.[d] ?? 1) ** (1 / tones.length);
    x *= own?.lean?.[d] ?? 1;
    out[d] = x;
  }
  return out;
}

function mergeInputs(a: EvalContext['inputs'], b: SegmentOwn['inputs']): EvalContext['inputs'] {
  if (!b) return a;
  const out: Record<string, { ability: AbilityId; weight: number }[]> = Object.fromEntries(Object.entries(a ?? {}).map(([d, xs]) => [d, (xs ?? []).map((x) => ({ ...x }))]));
  for (const [d, xs] of Object.entries(b)) for (const x of xs ?? []) {
    const list = (out[d] ??= []);
    const had = list.find((y) => y.ability === x.ability);
    if (had) had.weight += x.weight; else list.push({ ...x });
  }
  return out;
}

/** What one segment asks of the part it refines. */
export function segmentRequired(spec: PieceSpec, base: number, s: number): number {
  const seg = spec.segments[s]!;
  const more = (seg.turnInto ? spec.perTurn : 0) + (seg.blend ? spec.perBlend : 0);
  return more > 0 ? Math.max(base, Math.min(spec.most, base + more)) : base;
}

/** The part as a segment reads it: the piece's own, and the focused work on the segment. */
export const segmentPart = (piece: number, work: number): number => 1 - (1 - piece) * (1 - clamp(work, 0, 1));

/** Judges a piece of the player's, segment by segment (`judgePiece` through `performerOf`). */
export function evaluatePiece(sim: Simulation, person: Person, ctx: EvalContext, spec: PieceSpec): Evaluation {
  return judgePiece(sim.universe.meta.seed, performerOf(sim, person), ctx, spec);
}

/**
 * The weights a piece's segments put on each dimension, their mean: what a piece leans on as a whole, for a brief's
 * share of a weakness and what it asks (`systems/briefs.ts`).
 */
export function pieceWeights(task: TaskProfile, lean: Partial<Record<Dimension, number>> | undefined, spec: PieceSpec): Partial<Record<Dimension, number>> {
  const base = lean ?? Object.fromEntries(Object.keys(task.dims).map((d) => [d, 1]));
  const W = spec.segments.reduce((s, x) => s + x.weight, 0) || 1;
  const out: Partial<Record<Dimension, number>> = {};
  spec.segments.forEach((seg, s) => {
    const w = leanedWeights(task, [], segmentLean(base, seg.tones, spec.own?.[s]));
    for (const [d, x] of Object.entries(w) as [Dimension, number][]) out[d] = (out[d] ?? 0) + (x * seg.weight) / W;
  });
  return out;
}

/** Judges a piece segment by segment, and the whole from them. */
export function judgePiece(seed: string, performer: Performer, ctx: EvalContext, spec: PieceSpec): Evaluation {
  const n = spec.segments.length;
  const W = spec.segments.reduce((s, x) => s + x.weight, 0) || 1;
  const norm = (a: AbilityId) => clamp(performer.ability(a) / Math.max(1, performer.full(a)), 0, 1);
  const stamina = norm('stamina');
  const recover = (norm('composure') + norm('adaptability')) / 2;
  const task = withoutStamina(ctx.task);
  const inputs = noStamina(ctx.inputs);
  // The piece's lean: its material's and its choice's, or with none its genre families', as a multiplier on each weight.
  const baseLean = ctx.lean ?? familyLean(ctx.task, ctx.families ?? []);
  const results: Evaluation[] = [];
  const segments: SegmentResult[] = [];
  let shaken: EvalContext['shaken'];
  for (let s = 0; s < n; s += 1) {
    const seg = spec.segments[s]!;
    const own = spec.own?.[s];
    // Where it falls in the piece, by its segments' lengths (from 2026-10-16, evaluation-10): the running before it over the
    // running before the last. With every segment one long, as a brief's beats and a piece cut by its tones are, it's
    // s / (n − 1), as it was; a tone section cut by its turns (`unitSegments`) keeps its units where they fall in it. A
    // first try placed segments by their weights, which moved a brief's beats after its heart later (measured on the
    // designed briefs, I3's even actor restrained-ahead 70.3% to 68.9%): a heart counts for more and takes no longer.
    const before = spec.segments.slice(0, s).reduce((t, x) => t + lengthOf(x), 0);
    const span = spec.segments.reduce((t, x) => t + lengthOf(x), 0) - lengthOf(spec.segments[n - 1]!);
    const position = n > 1 && span > 0 ? before / span : 0;
    const prep = { ...ctx.prep, ...(own?.prep ?? {}) };
    const required = { ...ctx.required, ...(own?.required ?? {}) };
    const base = ctx.prep[spec.part];
    if (base !== undefined) {
      prep[spec.part] = segmentPart(base, spec.work[s] ?? 0);
      required[spec.part] = segmentRequired(spec, ctx.required[spec.part] ?? 1, s);
    }
    const f = 1 - PIECE.drain * clamp(spec.load, 0, 1) * position * (1 - stamina);
    const drain = f < 1 ? { f, label: `Stamina, By ${seg.label}` } : undefined;
    const fit = own?.fit ? { ...(ctx.fit ?? {}), ...Object.fromEntries(Object.entries(own.fit).map(([d, x]) => [d, { f: Math.min(ctx.fit?.[d as Dimension]?.f ?? 1, x!.f), label: x!.label }])) } : ctx.fit;
    const extraPrep = own?.extraPrep ? Object.fromEntries([...new Set([...Object.keys(ctx.extraPrep ?? {}), ...Object.keys(own.extraPrep)])].map((d) => [d, [...new Set([...(ctx.extraPrep?.[d as Dimension] ?? []), ...(own.extraPrep![d as Dimension] ?? [])])]])) : ctx.extraPrep;
    // A segment's own way draws on what the same side draws on for the whole, stamina left to the drain here too (from
    // 2026-10-12): until then it was merged in after the whole's was taken out, so a movement played Driven its own way
    // read stamina where the part played Driven didn't.
    const c: EvalContext = {
      ...ctx, task, inputs: mergeInputs(inputs, noStamina(own?.inputs)), lean: segmentLean(baseLean, seg.tones, own), prep, required, key: `${ctx.key}:${s}`,
      ...(extraPrep ? { extraPrep } : {}), ...(fit ? { fit } : {}), ...(drain ? { drain } : {}), ...(shaken ? { shaken } : {}),
    };
    // Each segment at full precision (from 2026-10-16, evaluation-9): the piece's whole is worked out from the segments'
    // exact wholes and rounded once, and what a segment shows is its own figures rounded once.
    const e = judgeExact(seed, performer, c);
    const expected = ctx.expected ? e.overall : judgeExact(seed, performer, { ...c, expected: true }).overall;
    const slip = expected - e.overall >= PIECE.slipAt ? r1(expected - e.overall) : undefined;
    results.push(e);
    const shown = rounded(e);
    segments.push({
      label: seg.label, tones: seg.tones, overall: shown.overall, expected: r1(expected), dims: Object.fromEntries(shown.dimensions.map((d) => [d.dimension, d.quality])),
      part: prep[spec.part] ?? 1, required: required[spec.part] ?? 1, drain: r1(f * 1000) / 1000,
      ...(slip ? { slip } : {}), ...(shaken ? { shaken: Math.round(shaken.f * 1000) / 1000 } : {}), ...(shown.limits[0] ? { chief: shown.limits[0], top: shown.limits.slice(0, 3) } : {}),
    });
    // What a slip carries into the next segment, less as composure and adaptability recover it.
    shaken = slip ? { f: 1 - PIECE.rattle * (slip / 100) * (1 - recover), label: `Shaken By A Slip In ${seg.label}` } : undefined;
  }

  const w = (s: number) => spec.segments[s]!.weight / W;
  // Each dimension, the segments' mean; its limits merged by what they are.
  const dimensions: DimensionResult[] = results[0]!.dimensions.map((d0) => {
    const at = results.map((r) => r.dimensions.find((x) => x.dimension === d0.dimension)!);
    const merged = new Map<string, Limit>();
    at.forEach((x, s) => {
      for (const l of x.limits) {
        const k = `${l.kind}|${l.what}`;
        const had = merged.get(k);
        if (had) { had.by += l.by * w(s); had.whole = (had.whole ?? 0) + (l.whole ?? 0) * w(s); }
        else merged.set(k, { ...l, by: l.by * w(s), whole: (l.whole ?? 0) * w(s) });
      }
    });
    const limits = [...merged.values()].filter((l) => l.by > 0).sort((a, b) => (b.whole ?? 0) - (a.whole ?? 0) || b.by - a.by);
    // By the segments' weights, divided once (from evaluation-10): until then each segment's share was divided first,
    // and six units of half a section each, the Seagull's, summed a full preparation to 0.9999999999999999.
    const mean = (pick: (x: DimensionResult) => number) => at.reduce((s, x, i) => s + pick(x) * spec.segments[i]!.weight, 0) / W;
    const fits = at.map((x) => x.fit).filter((x): x is number => x !== undefined);
    // The way it's played against the scene (from 2026-10-16): each segment's points, by its weight.
    const grains = at.map((x, i) => ({ g: x.grain, w: w(i) })).filter((x) => x.g);
    return {
      dimension: d0.dimension, label: d0.label, quality: mean((x) => x.quality), capacity: mean((x) => x.capacity), prepared: mean((x) => x.prepared), condition: mean((x) => x.condition), day: mean((x) => x.day),
      ...(fits.length ? { fit: Math.min(...fits) } : {}), ...(grains.length ? { grain: { d: grains[0]!.g!.d, label: grains[0]!.g!.label, points: grains.reduce((t, x) => t + x.g!.points * x.w, 0) } } : {}), variation: mean((x) => x.variation), ...(d0.strongest ? { strongest: d0.strongest } : {}), limits,
    };
  });
  const overall = results.reduce((s, r, i) => s + r.overall * spec.segments[i]!.weight, 0) / W;
  const exactDim = (r: Evaluation, d: Dimension) => r.dimensions.find((x) => x.dimension === d)?.quality ?? r.overall;
  const held = results.map((r) => (exactDim(r, 'believability') + exactDim(r, 'interpretation')) / 2);
  const continuity = r1(100 - (Math.max(...held) - Math.min(...held)));
  // The levels every segment read, and the three the piece itself reads: stamina, composure and adaptability.
  const abilities: Partial<Record<AbilityId, number>> = Object.assign({}, ...results.map((r) => r.inputs.abilities));
  const fulls: Partial<Record<AbilityId, number>> = Object.assign({}, ...results.map((r) => r.inputs.fulls ?? {}));
  for (const a of ['stamina', 'composure', 'adaptability'] as AbilityId[]) { abilities[a] = performer.ability(a); fulls[a] = performer.full(a); }
  const first = results[0]!;
  // The piece's own reads, not segment 0's: replaying applies each segment's tones and its own way again.
  const { lean: _lean, inputs: _inputs, extraPrep: _extra, fit: _fit, grain: _grain, ...rest } = first.inputs;
  void _lean; void _inputs; void _extra; void _fit; void _grain;
  return rounded({
    ruleset: first.ruleset, task: ctx.task.id, taskLabel: ctx.task.label, dimensions, overall, exact: overall, mastery: results.every((r) => r.mastery),
    limits: dimensions.flatMap((d) => d.limits).sort((a, b) => (b.whole ?? 0) - (a.whole ?? 0) || b.by - a.by),
    inputs: {
      ...rest, abilities, fulls, levels: Object.assign({}, ...results.map((r) => r.inputs.levels ?? {})), prep: { ...ctx.prep }, required: { ...ctx.required }, key: ctx.key,
      ...(ctx.lean ? { lean: ctx.lean } : {}), ...(ctx.inputs ? { inputs: ctx.inputs } : {}), ...(ctx.extraPrep ? { extraPrep: ctx.extraPrep } : {}), ...(ctx.fit && Object.keys(ctx.fit).length ? { fit: ctx.fit } : {}), ...(ctx.grain && Object.keys(ctx.grain).length ? { grain: ctx.grain } : {}),
      piece: spec,
    },
    piece: { segments, continuity, lowest: Math.min(...segments.map((x) => x.overall)) },
  });
}
