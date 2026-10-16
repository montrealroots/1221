/**
 * The stage's and the attributes' remaining shortfalls, brief 09 (2026-10-16; docs/verification/integration-2026-10-16/
 * st3.md, st6.md, h4.md, l3.md, each with its dated section for this pass).
 *
 * **ST3, case by case.** ST3 asks that an even actor's result be the same on stage and at a close frame. Measured on the
 * 179 cases (`tools/interpretation.ts -- --st3`), 165 are the same as shown and 14 a tenth apart. None of the 14 is a
 * rounding defect: every shown result is its own exact result rounded once, and each pair a tenth apart differs at full
 * precision by 0.0017 to 0.0208, its two sides straddling a rounding point. What the differences are, taken apart: the
 * criterion's techniques at 50 of 90 read 0.556 where its abilities read 0.55 (at most 0.0026), and its stamina at 55
 * drains the later half of the piece on every dimension that names fatigue, which the stage and the close frame weigh
 * differently (at most 0.0194). An actor even in everything the formula reads, whose stamina doesn't drain, comes out the
 * same on both to the last digit, and the figure is the rule's: every dimension at the same share n of full, so the whole
 * is 100 × n^(1 + difficulty) whatever the weights. Held here:
 * - identical effective inputs give identical results, on stage, at a close frame and replayed, worked by hand;
 * - every case's shown result is its exact one rounded once, and every case a tenth apart is a real difference under half
 *   a tenth whose sides straddle a rounding point;
 * - each case's difference is its techniques' part and its stamina's part, and nothing else.
 *
 * Every performer is TEST SETUP (levels set directly), every scene judged as `tools/interpretation.ts --stage` judges it,
 * the grain held at nothing as ST3 holds it. Expected figures are worked from the rule (`EVALUATION`, `MASTERED`, the
 * Scene Study template's par), never from the engine's own helpers.
 */
import { describe, expect, it } from 'vitest';
import { judgePiece, loadOf, toneSegments } from '@/engine/systems/piece';
import { frozenPerformer, replayAs, type EvalContext, type Evaluation, type Performer } from '@/engine/systems/evaluation';
import { TASK_PROFILES } from '@/engine/content/tasks';
import { MASTERED } from '@/engine/content/abilities';
import { PIECE } from '@/engine/content/piece';
import { GRAIN } from '@/engine/content/interpretation';
import { PLAY_MATERIAL, SCENE_MATERIAL, type MaterialProfile } from '@/engine/content/material';
import { templateById } from '@/engine/content/coursework';
import { difficultyOf } from '@/engine/systems/coursework';
import { materialContext, misfitOf } from '@/engine/systems/material';

const r1 = (x: number) => Math.round(x * 10) / 10;
/** A seeded generator (mulberry32), so every run draws the same shares. */
const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

describe('ST3 case by case: the stage and a close frame (brief 09)', () => {
  const task = TASK_PROFILES.scene!;
  const difficulty = difficultyOf(templateById('scene-study')!);
  const judgeOn = (m: MaterialProfile, p: Performer, scale: 'restrained' | 'expansive'): Evaluation => {
    const read = materialContext(task, m, { scale, chosenAt: 0, prep: 1 });
    const prep = { familiarity: 1, memorization: 1, interpretation: 1, rehearsal: 1, partner: 1, approach: 1 };
    const ctx: EvalContext = { task, techniques: { scene: 1, ...(m.techniques ?? {}) }, prep, required: Object.fromEntries(Object.keys(prep).map((k) => [k, 0.9])), difficulty, condition: { readiness: 100 }, lean: read.lean, inputs: read.inputs, extraPrep: read.prep, fit: read.fit, grain: read.grain, key: `stage:${m.id}`, expected: true };
    return judgePiece('interpretation', p, ctx, { segments: toneSegments(m.tones, 2), work: [], part: 'rehearsal', perTurn: PIECE.scene.perTurn, perBlend: 0, most: PIECE.scene.most, load: loadOf(m, 'scene') });
  };
  /** Every stage material and every scale side that fits it, the grain held at nothing, as ST3 measures. */
  const cases = (fn: (m: MaterialProfile, scale: 'restrained' | 'expansive') => void) => {
    const strength = GRAIN.strength;
    Object.assign(GRAIN as Record<string, number>, { strength: 0 });
    try {
      for (const m of [...SCENE_MATERIAL, ...PLAY_MATERIAL]) for (const scale of ['restrained', 'expansive'] as const) if (!misfitOf('scale', scale, m)) fn(m, scale);
    } finally { Object.assign(GRAIN as Record<string, number>, { strength }); }
  };
  /** An actor at `share` of full in every ability and technique, with stamina at `stamina` (100 doesn't drain). */
  const at = (share: number, stamina = 100, tech = share * MASTERED): Performer => ({ ability: (id) => (id === 'stamina' ? stamina : 100 * share), full: () => 100, technique: () => tech });
  const closeFrame = (m: MaterialProfile): MaterialProfile => ({ ...m, medium: 'camera' });

  it('identical effective inputs give identical results: an actor even in everything the formula reads, its stamina undrained, comes out on stage, at a close frame and replayed at 100 × n^(1 + difficulty), whatever the weights', () => {
    const r = rng(9_2026_10_16);
    // Scene Study's par is 50, and a par's difficulty is (par − 62) / 40 (a professional's at 62): −0.3, so the power is 0.7.
    expect(difficulty).toBeCloseTo((50 - 62) / 40, 12);
    let n = 0;
    cases((m, scale) => {
      const share = Math.round((0.2 + 0.75 * r()) * 1000) / 1000;
      const p = at(share);
      const stage = judgeOn(m, p, scale), close = judgeOn(closeFrame(m), p, scale);
      const byHand = 100 * share ** 0.7;
      expect(stage.exact!, `${m.id} ${scale} at ${share}`).toBeCloseTo(byHand, 9);
      expect(close.exact!, `${m.id} ${scale} at ${share}`).toBeCloseTo(byHand, 9);
      expect(stage.overall).toBe(r1(byHand));
      expect(close.overall).toBe(r1(byHand));
      // The same work worked out again from its own record, by the levels it kept, comes to the same, to the digit.
      const again = replayAs({ inputs: stage.inputs, task: stage.task, ruleset: stage.ruleset }, task, frozenPerformer(stage.inputs))!;
      expect(again.exact).toBe(stage.exact);
      n += 1;
    });
    expect(n).toBeGreaterThanOrEqual(179);
  });

  it('every case’s shown result is its exact result rounded once, and every case a tenth apart is a real difference under half a tenth whose two sides straddle a rounding point', () => {
    const criterion = at(0.55, 55, 50);
    let apart = 0, same = 0;
    cases((m, scale) => {
      const s = judgeOn(m, criterion, scale), c = judgeOn(closeFrame(m), criterion, scale);
      expect(s.overall, `${m.id} ${scale} on stage`).toBe(r1(s.exact!));
      expect(c.overall, `${m.id} ${scale} at a close frame`).toBe(r1(c.exact!));
      if (s.overall === c.overall) { same += 1; return; }
      apart += 1;
      expect(Math.abs(s.overall - c.overall), `${m.id} ${scale}`).toBeCloseTo(0.1, 9);
      expect(Math.abs(s.exact! - c.exact!), `${m.id} ${scale}`).toBeLessThan(0.05);
      // The rounding point between the two shown tenths lies between the two exact results.
      const point = Math.max(s.overall, c.overall) - 0.05;
      expect(Math.min(s.exact!, c.exact!), `${m.id} ${scale}`).toBeLessThan(point);
      expect(Math.max(s.exact!, c.exact!), `${m.id} ${scale}`).toBeGreaterThanOrEqual(point);
    });
    // Measured on 2026-10-16: 165 the same and 14 a tenth apart. The test asks for some of each, so it can't hold vacuously.
    expect(apart).toBeGreaterThan(0);
    expect(same).toBeGreaterThan(apart);
  });

  it('each case’s difference is its techniques’ part and its stamina’s part and nothing else: even in everything read and undrained it’s nothing, and each uneven input alone makes its own part', () => {
    const diff = (m: MaterialProfile, scale: 'restrained' | 'expansive', p: Performer) => judgeOn(m, p, scale).exact! - judgeOn(closeFrame(m), p, scale).exact!;
    const criterion = at(0.55, 55, 50), evenRead = at(0.55, 55), techOnly = at(0.55, 100, 50), neither = at(0.55, 100);
    let staminaLarger = 0, n = 0, most = 0;
    cases((m, scale) => {
      n += 1;
      const whole = diff(m, scale, criterion), stamina = diff(m, scale, evenRead), techniques = diff(m, scale, techOnly), residual = diff(m, scale, neither);
      expect(Math.abs(residual), `${m.id} ${scale}`).toBeLessThan(1e-9);
      // The two parts add to the whole but for how they meet, which is under a thousandth of a point on every case.
      expect(Math.abs(whole - stamina - techniques), `${m.id} ${scale}`).toBeLessThan(1e-3);
      if (Math.abs(stamina) > Math.abs(techniques)) staminaLarger += 1;
      most = Math.max(most, Math.abs(whole));
    });
    // Stamina's drain is the larger part on most cases, and the whole is under half a rounding step on every one.
    expect(staminaLarger).toBeGreaterThan(n / 2);
    expect(most).toBeLessThan(0.05);
    expect(most).toBeGreaterThan(0);
  });
});
