/**
 * The mathematics of the connected journey, held as properties over many inputs (from 2026-10-12; the owner's brief of
 * that day, section 15). Each draws its cases from a seeded stream, so a failure names its case and replays.
 *
 * - Bounded: every segment, every whole, every shared result in 0 to 100.
 * - Monotonic: a piece never falls as a segment's own work rises, as the piece's rehearsal rises, as stamina rises, as
 *   a partner's preparation rises (the shared result), or as the load on stamina falls.
 * - Normalized: a segment's tones lean its weights and add none; the piece's weights sum as the task's do.
 * - Read once: stamina is no input of a segment, only its drain.
 * - Uncertainty: no draw at mastery; under it, a segment's draw is bounded by the evaluation's variation.
 * - The mastery contract: 100 whatever the segments, the tones, the drain's load and the reader.
 */
import { describe, expect, it } from 'vitest';
import { makeRng } from '@/engine/core/rng';
import { PLAY_MATERIAL, SCENE_MATERIAL, type MaterialProfile, type Tone } from '@/engine/content/material';
import { EVALUATION, TASK_PROFILES } from '@/engine/content/tasks';
import { MASTERED } from '@/engine/content/abilities';
import { leanedWeights, type EvalContext, type Performer } from '@/engine/systems/evaluation';
import { judgePiece, pieceWeights, toneSegments, type PieceSpec } from '@/engine/systems/piece';
import { materialContext } from '@/engine/systems/material';
import { sharedOf, type PartnerRead } from '@/engine/systems/ensemble';

const ABS = ['emotionalDepth', 'presence', 'listening', 'imagination', 'focus', 'memory', 'adaptability', 'composure', 'vocal', 'physical', 'discipline', 'stamina'];
const MATERIALS: MaterialProfile[] = [...SCENE_MATERIAL.filter((m) => m.tones.length >= 2), ...PLAY_MATERIAL];

function randomActor(r: () => number): Performer & { levels: Record<string, number> } {
  const levels = Object.fromEntries(ABS.map((a) => [a, Math.round(r() * 100)]));
  const tech = Math.round(r() * MASTERED);
  return { levels, ability: (id) => levels[id] ?? 50, full: () => 100, technique: () => tech };
}
const FULL: Performer = { ability: () => 100, full: () => 100, technique: () => MASTERED };

function setup(m: MaterialProfile, prep: number, over: Partial<EvalContext> = {}, work: number[] = [], load?: number): { ctx: EvalContext; spec: PieceSpec } {
  const task = TASK_PROFILES.performance!;
  const read = materialContext(task, m);
  const ctx: EvalContext = { task, techniques: { scene: 1 }, prep: { lines: prep, blocking: prep, notes: prep }, required: { lines: 0.9, blocking: 0.9, notes: 0.8 }, difficulty: 0, condition: { readiness: 90 }, lean: read.lean, inputs: read.inputs, key: `prop:${m.id}`, expected: true, ...over };
  const spec: PieceSpec = { segments: toneSegments(m.tones, 2), work, part: 'blocking', perTurn: 0, perBlend: 0, most: 1, load: load ?? Math.min(1, 0.4 + (m.physical + m.vocal) * 0.1) };
  return { ctx, spec };
}

describe('the piece’s mathematics, over many cases', () => {
  it('is bounded, and never falls as work, rehearsal or stamina rises, or the load falls', () => {
    const r = makeRng('props-monotonic');
    for (let n = 0; n < 160; n += 1) {
      const m = MATERIALS[Math.floor(r.next() * MATERIALS.length)]!;
      const actor = randomActor(() => r.next());
      const prep = 0.3 + r.next() * 0.6;
      const s = Math.floor(r.next() * 2);
      const w = r.next() * 0.8;
      const base = setup(m, prep);
      const e0 = judgePiece('p', actor, base.ctx, base.spec);
      for (const seg of e0.piece!.segments) { expect(seg.overall).toBeGreaterThanOrEqual(0); expect(seg.overall).toBeLessThanOrEqual(100); }
      const work = Array.from({ length: base.spec.segments.length }, (_, i) => (i === s ? w : 0));
      const e1 = judgePiece('p', actor, base.ctx, { ...base.spec, work });
      expect(e1.overall, `${m.id} work on ${s}`).toBeGreaterThanOrEqual(e0.overall - 1e-9);
      const e2 = judgePiece('p', actor, { ...base.ctx, prep: { lines: prep, blocking: Math.min(1, prep + 0.2), notes: prep } }, base.spec);
      expect(e2.overall, `${m.id} rehearsal`).toBeGreaterThanOrEqual(e0.overall - 1e-9);
      const stronger: Performer = { ...actor, ability: (id) => (id === 'stamina' ? Math.min(100, actor.levels.stamina! + 30) : actor.ability(id)) };
      expect(judgePiece('p', stronger, base.ctx, base.spec).overall, `${m.id} stamina`).toBeGreaterThanOrEqual(e0.overall - 1e-9);
      expect(judgePiece('p', actor, base.ctx, { ...base.spec, load: base.spec.load * 0.5 }).overall, `${m.id} load`).toBeGreaterThanOrEqual(e0.overall - 1e-9);
    }
  });

  it('leans each segment’s weights without adding to them, and reads stamina once', () => {
    for (const m of MATERIALS) {
      const { ctx, spec } = setup(m, 1);
      const w = pieceWeights(ctx.task, ctx.lean, spec);
      const total = Object.values(w).reduce((a, x) => a + (x ?? 0), 0);
      const base = Object.values(leanedWeights(ctx.task, [], ctx.lean)).reduce((a, x) => a + (x ?? 0), 0);
      expect(total, m.id).toBeCloseTo(base, 6);
      const e = judgePiece('p', { ability: (id) => (id === 'stamina' ? 10 : 70), full: () => 100, technique: () => 60 }, ctx, spec);
      expect(e.limits.some((l) => l.kind === 'ability' && l.what === 'stamina'), m.id).toBe(false);
    }
  });

  it('draws nothing at mastery, and keeps a segment’s draw within the evaluation’s variation under it', () => {
    const r = makeRng('props-draw');
    for (const m of MATERIALS) {
      const tones: Tone[] = [...m.tones];
      for (const readiness of [60, 90]) {
        const full = setup(m, 1, { expected: false, condition: { readiness } });
        const e = judgePiece('p', FULL, full.ctx, full.spec);
        expect(e.overall, `${m.id} ${tones.join()}`).toBe(100);
        expect(e.piece!.segments.every((s) => !s.slip)).toBe(true);
      }
      const actor = randomActor(() => r.next());
      const some = setup(m, 0.7, { expected: false });
      const drawn = judgePiece('p', actor, some.ctx, some.spec);
      for (const s of drawn.piece!.segments) expect(Math.abs(s.overall - s.expected), m.id).toBeLessThanOrEqual(EVALUATION.variation * (1 + EVALUATION.fatigueSpread) + 1e-9);
    }
  });
});

describe('the scene together’s mathematics', () => {
  it('is bounded, never over what a perfect partner gives, and never falls as the partner’s preparation rises', () => {
    const r = makeRng('props-shared');
    const task = TASK_PROFILES.scene!;
    for (let n = 0; n < 120; n += 1) {
      const m = MATERIALS[Math.floor(r.next() * MATERIALS.length)]!;
      const actor = randomActor(() => r.next());
      const read = materialContext(task, m);
      const ctx: EvalContext = { task, techniques: { scene: 1 }, prep: { familiarity: 1, memorization: 1, interpretation: 1, rehearsal: 1, partner: 1 }, required: {}, difficulty: 0, condition: { readiness: 90 }, lean: read.lean, inputs: read.inputs, key: `shared:${n}`, expected: true };
      const spec: PieceSpec = { segments: toneSegments(m.tones), work: [], part: 'rehearsal', perTurn: 0.05, perBlend: 0, most: 0.95, load: 0.3 };
      const personal = judgePiece('p', actor, ctx, spec);
      const weights = pieceWeights(task, ctx.lean, spec);
      const partner = (prep: number): PartnerRead => ({ name: 'Ruth Banks', prep, timing: 0.5 + r.next() * 0.5, agree: 1, reliability: 1, level: m.partner });
      const timing = 0.5 + r.next() * 0.5;
      let last = -1;
      for (const prep of [0, 0.25, 0.5, 0.75, 1]) {
        const s = sharedOf(personal, { ...partner(prep), timing }, 'p', `k${n}`, 0.5, weights).overall;
        expect(s).toBeGreaterThanOrEqual(0);
        expect(s).toBeLessThanOrEqual(100);
        expect(s).toBeGreaterThanOrEqual(last - 1e-9);
        last = s;
      }
      const perfect = sharedOf(personal, { name: 'x', prep: 1, timing: 1, agree: 1, reliability: 1, level: m.partner }, 'p', `k${n}`, 1, weights).overall;
      expect(sharedOf(personal, { ...partner(0.5), timing }, 'p', `k${n}`, 0.5, weights).overall).toBeLessThanOrEqual(perfect + 1e-9);
    }
  });
});
