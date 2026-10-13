/**
 * A piece judged in its segments (from 2026-10-12; `systems/piece.ts`, `content/piece.ts`).
 *
 * - The guarantee in segments: every scene and every play with a profile, judged in its segments at full abilities,
 *   mastered techniques, complete preparation and a sufficient day, is 100 in every segment and as a whole, with no
 *   limit and no slip.
 * - Stamina is read through the piece: nothing in the first segment, more the later and the heavier the piece, nothing
 *   at full stamina, and it never falls as stamina rises; it's no longer a share of a segment's inputs, so it isn't
 *   counted twice.
 * - Work on a segment lifts that segment and the whole, and a turn asks more of the segment it leads into.
 * - A slip carries into the next segment, less as composure and adaptability recover it.
 * - Continuity is read from the segments, not added: the whole is the segments' weighted mean.
 * - The limits are ranked by what they cost the whole.
 * - A kept piece replays exactly; one kept under other rules isn't replayed as if it were.
 */
import { describe, expect, it } from 'vitest';
import { PLAY_MATERIAL, SCENE_MATERIAL, type MaterialProfile } from '@/engine/content/material';
import { PIECE } from '@/engine/content/piece';
import { RULESET, TASK_PROFILES } from '@/engine/content/tasks';
import { MASTERED } from '@/engine/content/abilities';
import { judge, replay, type EvalContext, type Performer } from '@/engine/systems/evaluation';
import { judgePiece, loadOf, segmentPart, segmentRequired, toneSegments, type PieceSpec } from '@/engine/systems/piece';
import { materialContext } from '@/engine/systems/material';

const FULL: Performer = { ability: () => 100, full: () => 100, technique: () => MASTERED };
const actor = (abilities: Partial<Record<string, number>>, technique = 50): Performer => ({ ability: (id) => abilities[id] ?? 50, full: () => 100, technique: () => technique });

function ctxOf(m: MaterialProfile, night: boolean, prep: Record<string, number>, over: Partial<EvalContext> = {}): EvalContext {
  const task = night ? TASK_PROFILES.performance! : TASK_PROFILES.scene!;
  const read = materialContext(task, m);
  return { task, techniques: { scene: 1, ...(m.techniques ?? {}) }, prep, required: Object.fromEntries(Object.keys(prep).map((k) => [k, 0.9])), difficulty: 0, condition: { readiness: 100 }, lean: read.lean, inputs: read.inputs, key: `t:${m.id}`, expected: true, ...over };
}
const specOf = (m: MaterialProfile, night: boolean, work: number[] = []): PieceSpec => ({
  segments: toneSegments(m.tones, night ? 2 : 1), work, part: night ? 'blocking' : 'rehearsal',
  perTurn: night ? 0 : PIECE.scene.perTurn, perBlend: 0, most: night ? 1 : PIECE.scene.most, load: loadOf(m, night ? 'night' : 'scene'),
});
const SCENE_PREP = { familiarity: 1, memorization: 1, interpretation: 1, rehearsal: 1, partner: 1 };
const NIGHT_PREP = { lines: 1, blocking: 1, notes: 1 };

describe('the guarantee, in segments', () => {
  it('is 100 in every segment of every scene and every play at full, with nothing held back', () => {
    let pieces = 0;
    for (const m of SCENE_MATERIAL.filter((x) => x.tones.length >= 2)) {
      const e = judgePiece('seed', FULL, ctxOf(m, false, SCENE_PREP), specOf(m, false));
      expect(e.overall, m.id).toBe(100);
      expect(e.mastery, m.id).toBe(true);
      expect(e.limits, m.id).toEqual([]);
      for (const s of e.piece!.segments) { expect(s.overall, `${m.id} ${s.label}`).toBe(100); expect(s.slip).toBeUndefined(); }
      pieces += 1;
    }
    for (const m of PLAY_MATERIAL) {
      // With a draw, too: at full there's no variation, so no slip.
      const e = judgePiece('seed', FULL, ctxOf(m, true, NIGHT_PREP, { expected: false }), specOf(m, true));
      expect(e.overall, m.id).toBe(100);
      expect(e.piece!.segments.length, m.id).toBeGreaterThanOrEqual(2);
      expect(e.piece!.continuity, m.id).toBe(100);
      pieces += 1;
    }
    expect(pieces).toBeGreaterThan(40);
  });
});

describe('stamina, through the piece', () => {
  const heavy = PLAY_MATERIAL.find((m) => m.physical + m.vocal >= 5)!;
  it('costs nothing in the first segment, more later, more in a heavier piece, and nothing at full stamina', () => {
    const tired = actor({ stamina: 20 }, 50);
    const e = judgePiece('seed', tired, ctxOf(heavy, true, NIGHT_PREP), specOf(heavy, true));
    const segs = e.piece!.segments;
    expect(segs[0]!.drain).toBe(1);
    expect(segs.at(-1)!.drain).toBeLessThan(1);
    for (let i = 1; i < segs.length; i += 1) expect(segs[i]!.drain).toBeLessThanOrEqual(segs[i - 1]!.drain);
    expect(e.limits.some((l) => l.what === 'stamina')).toBe(true);
    const fit = judgePiece('seed', actor({ stamina: 100 }, 50), ctxOf(heavy, true, NIGHT_PREP), specOf(heavy, true));
    expect(fit.piece!.segments.every((s) => s.drain === 1)).toBe(true);
    expect(fit.limits.some((l) => l.what === 'stamina')).toBe(false);
    const light = PLAY_MATERIAL.find((m) => m.physical + m.vocal <= 1)!;
    expect(loadOf(light, 'night')).toBeLessThan(loadOf(heavy, 'night'));
  });

  it('never falls as stamina rises, and is no longer a share of a segment’s inputs', () => {
    let last = -1;
    for (const st of [0, 20, 40, 60, 80, 100]) {
      const o = judgePiece('seed', actor({ stamina: st }, 50), ctxOf(heavy, true, NIGHT_PREP), specOf(heavy, true)).overall;
      expect(o).toBeGreaterThanOrEqual(last);
      last = o;
    }
    // Whole, the same night reads stamina in consistency; in segments, only through the drain.
    const whole = judge('seed', actor({ stamina: 20 }), ctxOf(heavy, true, NIGHT_PREP));
    expect(whole.limits.some((l) => l.kind === 'ability' && l.what === 'stamina')).toBe(true);
    const parts = judgePiece('seed', actor({ stamina: 20 }), ctxOf(heavy, true, NIGHT_PREP), specOf(heavy, true));
    expect(parts.limits.some((l) => l.kind === 'ability' && l.what === 'stamina')).toBe(false);
  });
});

describe('a segment’s own rehearsal', () => {
  const m = SCENE_MATERIAL.find((x) => x.tones.length >= 3 && x.tones[1] !== x.tones[0])!;
  const half = { ...SCENE_PREP, rehearsal: 0.6 };
  it('asks more of the segment a turn leads into, and work on a segment lifts it and the whole', () => {
    const spec = specOf(m, false);
    expect(segmentRequired(spec, 0.9, 1)).toBeGreaterThan(segmentRequired(spec, 0.9, 0));
    const p = actor({}, 60);
    const before = judgePiece('seed', p, ctxOf(m, false, half), spec);
    const worked = judgePiece('seed', p, ctxOf(m, false, half), specOf(m, false, [0, 0.8]));
    expect(worked.piece!.segments[1]!.overall).toBeGreaterThan(before.piece!.segments[1]!.overall);
    expect(worked.piece!.segments[0]!.overall).toBe(before.piece!.segments[0]!.overall);
    expect(worked.overall).toBeGreaterThan(before.overall);
    expect(segmentPart(0.6, 0.8)).toBeCloseTo(0.92, 9);
    expect(segmentPart(1, 0)).toBe(1);
  });
});

describe('a slip, and the next segment', () => {
  const m = PLAY_MATERIAL.find((x) => x.tones.length >= 3)!;
  it('carries into the next segment, less as composure and adaptability recover it', () => {
    const shaky = actor({ composure: 10, adaptability: 10 }, 30);
    const steady = actor({ composure: 95, adaptability: 95 }, 30);
    // A key whose draw slips the first segment (found once: the draw is the seed's and the key's).
    const keys = Array.from({ length: 300 }, (_, i) => `slip:${i}`);
    const slipKey = keys.find((k) => judgePiece('seed', shaky, ctxOf(m, true, NIGHT_PREP, { expected: false, key: k }), specOf(m, true)).piece!.segments[0]!.slip)!;
    expect(slipKey).toBeDefined();
    const a = judgePiece('seed', shaky, ctxOf(m, true, NIGHT_PREP, { expected: false, key: slipKey }), specOf(m, true));
    expect(a.piece!.segments[1]!.shaken).toBeLessThan(1);
    expect(a.limits.some((l) => l.what === 'shaken')).toBe(true);
    const b = judgePiece('seed', steady, ctxOf(m, true, NIGHT_PREP, { expected: false, key: slipKey }), specOf(m, true));
    if (b.piece!.segments[0]!.slip) expect(b.piece!.segments[1]!.shaken!).toBeGreaterThan(a.piece!.segments[1]!.shaken!);
    // With no draw there's no slip.
    expect(judgePiece('seed', shaky, ctxOf(m, true, NIGHT_PREP, { key: slipKey }), specOf(m, true)).piece!.segments.every((s) => !s.slip)).toBe(true);
  });
});

describe('the whole, from its segments', () => {
  const m = PLAY_MATERIAL.find((x) => x.tones.length >= 3)!;
  it('is the segments’ mean; continuity is read from them and not added', () => {
    const e = judgePiece('seed', actor({ emotionalDepth: 30 }, 40), ctxOf(m, true, { lines: 0.7, blocking: 0.8, notes: 0.5 }, { expected: false }), specOf(m, true, [0.9]));
    const mean = e.piece!.segments.reduce((a, s) => a + s.overall, 0) / e.piece!.segments.length;
    expect(e.overall).toBeCloseTo(Math.round(mean * 10) / 10, 1);
    expect(e.piece!.continuity).toBeLessThanOrEqual(100);
    expect(e.piece!.lowest).toBe(Math.min(...e.piece!.segments.map((s) => s.overall)));
  });

  it('ranks the limits by what they cost the whole', () => {
    const e = judgePiece('seed', actor({}, 40), ctxOf(m, true, { lines: 0.5, blocking: 0.5, notes: 0.2 }), specOf(m, true));
    for (let i = 1; i < e.limits.length; i += 1) expect((e.limits[i - 1]!.whole ?? 0)).toBeGreaterThanOrEqual(e.limits[i]!.whole ?? 0);
    expect(e.limits[0]!.whole).toBeGreaterThan(0);
  });
});

describe('replay', () => {
  const m = PLAY_MATERIAL[3]!;
  it('works a kept piece out again exactly, and doesn’t claim to for one kept under other rules', () => {
    const e = judgePiece('seed', actor({ stamina: 40 }, 55), ctxOf(m, true, { lines: 0.8, blocking: 0.7, notes: 0.4 }, { expected: false }), specOf(m, true, [0.5, 0.2]));
    const again = replay({ inputs: e.inputs, task: 'performance', ruleset: e.ruleset }, TASK_PROFILES.performance!)!;
    expect(again.overall).toBe(e.overall);
    expect(again.piece!.segments.map((s) => s.overall)).toEqual(e.piece!.segments.map((s) => s.overall));
    expect(e.ruleset).toBe(RULESET);
    expect(replay({ inputs: e.inputs, task: 'performance', ruleset: 'evaluation-2 (2026-10-10)' }, TASK_PROFILES.performance!)).toBeUndefined();
  });
});
