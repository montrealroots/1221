/**
 * A result rounded once (the integration pass of 2026-10-16, evaluation-9; docs/verification/integration-2026-10-16/st3.md).
 *
 * Until then `judge` rounded each dimension to a tenth and worked the whole out from the rounded dimensions, and a piece
 * judged in segments worked its whole out from its segments' rounded wholes: a result was rounded two or three times.
 * The stage criterion ST3 asked that an even actor's result be the same on stage and at a close frame, and 12 of its
 * 171 cases came out a tenth apart, where at full precision none differed by more than 0.021. Rounded once, a result is
 * still kept to a tenth, and its parts are shown to a tenth; nothing is worked out from a rounded part.
 *
 * Every expected figure here is worked by hand from the rule's own numbers (the task profile's inputs and weights,
 * `EVALUATION.meanShare`, `MASTERED`, `PIECE.drain`), never from the engine's helpers. The performers are TEST SETUP:
 * levels set directly, drawn from a seeded generator, as `tests/engine-properties.test.ts` draws its cases.
 *
 * What ST3 measures, at full precision, is held here too (the stage materials judged as `tools/interpretation.ts`
 * judges them, the house's grain held at nothing as ST3 holds it):
 * - an actor even in everything the formula reads (every ability at 55 of 100 and every technique at 49.5 of 90) whose
 *   stamina doesn't drain comes out exactly the same on stage and at a close frame, on every case;
 * - the criterion's own even actor (techniques at 50, stamina at 55) comes out less than half a rounding step apart on
 *   every case: what remains is its stamina's drain on the dimensions the stage weighs more, which is real, and its
 *   techniques read at 50 of 90 against its abilities' 55 of 100.
 */
import { describe, expect, it } from 'vitest';
import { judge, type EvalContext, type Performer } from '@/engine/systems/evaluation';
import { EVALUATION, TASK_PROFILES, type Dimension } from '@/engine/content/tasks';
import { MASTERED } from '@/engine/content/abilities';
import { PIECE } from '@/engine/content/piece';
import { GRAIN } from '@/engine/content/interpretation';
import { PLAY_MATERIAL, SCENE_MATERIAL, type MaterialProfile } from '@/engine/content/material';
import { templateById } from '@/engine/content/coursework';
import { difficultyOf } from '@/engine/systems/coursework';
import { materialContext, misfitOf } from '@/engine/systems/material';
import { judgePiece, loadOf, toneSegments, type SegmentSpec } from '@/engine/systems/piece';

const r1 = (x: number) => Math.round(x * 10) / 10;
/** A seeded generator (mulberry32), so every run draws the same cases. */
const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
type Levels = Record<string, number>;
const performer = (ab: Levels, tech: number): Performer => ({ ability: (id) => ab[id] ?? 0, full: () => 100, technique: () => tech });

/** A dimension's quality by hand: its inputs' weighted mean (an ability over 100, the technique over `MASTERED`), to the power of one plus the difficulty. */
function byHand(dim: Dimension, ab: Levels, tech: number, difficulty: number, task = TASK_PROFILES.scene!, noStamina = false): number {
  const inputs = task.dims[dim]!.inputs.filter((x) => !(noStamina && 'ability' in x && x.ability === 'stamina'));
  const total = inputs.reduce((s, x) => s + x.weight, 0);
  const cap = inputs.reduce((s, x) => s + x.weight * ('ability' in x ? ab[x.ability]! / 100 : Math.min(1, tech / MASTERED)), 0) / total;
  return 100 * cap ** (1 + difficulty);
}
/** The whole by hand: the weighted mean for `meanShare`, the weakest for the rest. */
function wholeByHand(q: Partial<Record<Dimension, number>>, task = TASK_PROFILES.scene!): number {
  const dims = Object.keys(task.dims) as Dimension[];
  const w = dims.reduce((s, d) => s + task.dims[d]!.weight, 0);
  const mean = dims.reduce((s, d) => s + task.dims[d]!.weight * q[d]!, 0) / w;
  return EVALUATION.meanShare * mean + (1 - EVALUATION.meanShare) * Math.min(...dims.map((d) => q[d]!));
}
const ABILITIES = ['emotionalDepth', 'imagination', 'listening', 'presence', 'memory', 'vocal', 'physical', 'composure', 'discipline', 'stamina', 'adaptability', 'focus'];
const draw = (r: () => number): Levels => Object.fromEntries(ABILITIES.map((a) => [a, 20 + Math.round(r() * 7900) / 100]));

describe('a result rounded once, from parts at full precision', () => {
  it('a scene judged whole: each dimension shows its own exact value to a tenth, and the whole is the exact whole rounded once, on 600 drawn performers', () => {
    const r = rng(20261016);
    const task = TASK_PROFILES.scene!;
    let differ = 0;
    for (let k = 0; k < 600; k += 1) {
      const ab = draw(r), tech = 20 + Math.round(r() * 7000) / 100, difficulty = Math.round((r() - 0.3) * 100) / 100;
      const e = judge('rounding', performer(ab, tech), { task, techniques: { scene: 1 }, prep: {}, required: {}, difficulty, condition: { readiness: 100 }, key: `r:${k}`, expected: true });
      const q = Object.fromEntries((Object.keys(task.dims) as Dimension[]).map((d) => [d, byHand(d, ab, tech, difficulty)])) as Record<Dimension, number>;
      for (const d of e.dimensions) expect(d.quality, `case ${k}, ${d.dimension}`).toBe(r1(q[d.dimension]));
      expect(e.overall, `case ${k}`).toBe(r1(wholeByHand(q)));
      // Where rounding the dimensions first would have shown another tenth: what the old order got wrong.
      const twice = r1(wholeByHand(Object.fromEntries(Object.entries(q).map(([d, x]) => [d, r1(x)])) as Record<Dimension, number>));
      if (twice !== e.overall) differ += 1;
    }
    // The cases are drawn so that the old order and this one part somewhere: otherwise the test would hold either way.
    expect(differ).toBeGreaterThan(0);
  });

  it('a scene judged in segments: the piece’s whole is its segments’ exact wholes by their weights, rounded once, each segment drained by the rule', () => {
    const r = rng(161026);
    const task = TASK_PROFILES.scene!;
    const seg = (label: string, weight: number): SegmentSpec => ({ label, tones: [], weight, turnInto: false, blend: false });
    const segments = [seg('The Start', 1), seg('The Middle', 2), seg('The End', 1)];
    let differ = 0;
    for (let k = 0; k < 300; k += 1) {
      const ab = draw(r), tech = 20 + Math.round(r() * 7000) / 100, load = Math.round(r() * 100) / 100;
      const e = judgePiece('rounding', performer(ab, tech), { task, techniques: { scene: 1 }, prep: {}, required: {}, difficulty: 0, condition: { readiness: 100 }, key: `p:${k}`, expected: true }, { segments, work: [], part: 'rehearsal', perTurn: 0, perBlend: 0, most: 1, load });
      // Each segment: the dimensions that name fatigue (all but interpretation on a scene) by 1 − drain × load × its
      // place × (1 − stamina); stamina is read as that drain and not as an input.
      const exact = segments.map((_, s) => {
        const f = 1 - PIECE.drain * load * (s / (segments.length - 1)) * (1 - ab.stamina! / 100);
        const q = Object.fromEntries((Object.keys(task.dims) as Dimension[]).map((d) => [d, byHand(d, ab, tech, 0, task, true) * (task.dims[d]!.conditions?.includes('fatigue') ? f : 1)])) as Record<Dimension, number>;
        return wholeByHand(q);
      });
      const piece = exact.reduce((s, x, i) => s + (x * segments[i]!.weight) / 4, 0);
      expect(e.overall, `case ${k}`).toBe(r1(piece));
      e.piece!.segments.forEach((seg, i) => expect(seg.overall, `case ${k}, segment ${i}`).toBe(r1(exact[i]!)));
      if (r1(exact.reduce((s, x, i) => s + (r1(x) * segments[i]!.weight) / 4, 0)) !== e.overall) differ += 1;
    }
    expect(differ).toBeGreaterThan(0);
  });
});

describe('ST3 at full precision (the stage materials, as tools/interpretation.ts --stage judges them)', () => {
  const task = TASK_PROFILES.scene!;
  const difficulty = difficultyOf(templateById('scene-study')!);
  const judgeOn = (m: MaterialProfile, p: Performer, scale: 'restrained' | 'expansive') => {
    const read = materialContext(task, m, { scale, chosenAt: 0, prep: 1 });
    const prep = { familiarity: 1, memorization: 1, interpretation: 1, rehearsal: 1, partner: 1, approach: 1 };
    const ctx: EvalContext = { task, techniques: { scene: 1, ...(m.techniques ?? {}) }, prep, required: Object.fromEntries(Object.keys(prep).map((k) => [k, 0.9])), difficulty, condition: { readiness: 100 }, lean: read.lean, inputs: read.inputs, extraPrep: read.prep, fit: read.fit, grain: read.grain, key: `stage:${m.id}`, expected: true };
    return judgePiece('interpretation', p, ctx, { segments: toneSegments(m.tones, 2), work: [], part: 'rehearsal', perTurn: PIECE.scene.perTurn, perBlend: 0, most: PIECE.scene.most, load: loadOf(m, 'scene') });
  };
  const both = (fn: (m: MaterialProfile, scale: 'restrained' | 'expansive') => void) => {
    const strength = GRAIN.strength;
    Object.assign(GRAIN as Record<string, number>, { strength: 0 });
    try {
      for (const m of [...SCENE_MATERIAL, ...PLAY_MATERIAL]) for (const scale of ['restrained', 'expansive'] as const) if (!misfitOf('scale', scale, m)) fn(m, scale);
    } finally { Object.assign(GRAIN as Record<string, number>, { strength }); }
  };

  it('an actor even in everything the formula reads, its stamina not draining, comes out the same on stage and at a close frame on every case', () => {
    const even: Performer = { ability: (id) => (id === 'stamina' ? 100 : 55), full: () => 100, technique: () => 0.55 * MASTERED };
    let n = 0;
    both((m, scale) => {
      n += 1;
      const stage = judgeOn(m, even, scale), close = judgeOn({ ...m, medium: 'camera' }, even, scale);
      expect(Math.abs(stage.exact! - close.exact!), `${m.id} ${scale}`).toBeLessThan(1e-9);
      expect(stage.overall, `${m.id} ${scale}`).toBe(close.overall);
    });
    expect(n).toBeGreaterThanOrEqual(171);
  });

  it('the criterion’s even actor comes out less than half a rounding step apart on every case, and its stamina is why: drained the same, it differs no more than its techniques at 50 of 90 make', () => {
    const at = (stamina: number): Performer => ({ ability: (id) => (id === 'stamina' ? stamina : 55), full: () => 100, technique: () => 50 });
    let most = 0, mostUndrained = 0;
    both((m, scale) => {
      const d = Math.abs(judgeOn(m, at(55), scale).exact! - judgeOn({ ...m, medium: 'camera' }, at(55), scale).exact!);
      const u = Math.abs(judgeOn(m, at(100), scale).exact! - judgeOn({ ...m, medium: 'camera' }, at(100), scale).exact!);
      most = Math.max(most, d); mostUndrained = Math.max(mostUndrained, u);
    });
    expect(most).toBeLessThan(0.05);
    expect(mostUndrained).toBeLessThan(most);
    expect(most).toBeGreaterThan(0);
  });
});
