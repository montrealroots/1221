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
 * **H4, presence's own work.** Until brief 09 every class scene and play was played off a partner at level 2 or 3, so
 * what a piece with little to play off asks of presence (a unit of `DEMAND_EFFECT.solo` for each level of partner under
 * 2: presence 2 more on connection and its lean 0.5 more) reached none, and presence's specialist was ahead of an even
 * actor on none of the 60 scenes. Four scenes played out to a house were added (`content/scenes-house.ts`), each read
 * from its public-domain text and committed before it was measured. Held here: the rule reaches them, a presence
 * specialist comes out ahead where the scene is a speech to many with the partner barely there and behind where it's
 * played off a partner, a mastered actor reaches 100 on every way of playing that fits them, and a student meets them in
 * play once the scenes before them run short.
 *
 * Every performer is TEST SETUP (levels set directly), every scene judged as `tools/interpretation.ts --stage` (ST3) or
 * `tools/ag-baseline.ts` (H4) judges it, the grain held at nothing as ST3 holds it. Expected figures are worked from the
 * rule (`EVALUATION`, `MASTERED`, the Scene Study template's par, the solo demand's sizes), never from the engine's own
 * helpers.
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
import { AXES } from '@/engine/content/approaches';
import type { Axis, AxisValue } from '@/engine/content/material';
import { SCENES } from '@/engine/content/coursework';
import { HOUSE_SCENES } from '@/engine/content/scenes-house';
import { scenesFor, type Worked } from '@/engine/systems/learning';

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

describe('H4: presence’s own work, scenes played out to a house (brief 09)', () => {
  const task = TASK_PROFILES.scene!;
  const difficulty = difficultyOf(templateById('scene-study')!);
  const NEW = HOUSE_SCENES.map((x) => x.id);
  const all = [...SCENE_MATERIAL, ...PLAY_MATERIAL];
  const byId = (id: string) => all.find((m) => m.id === id)!;
  /** A scene as Scene Study pitches it, every part complete, no way of playing chosen: as `tools/ag-baseline.ts` judges one. */
  const scene = (m: MaterialProfile, p: Performer, sides: Partial<Record<Axis, AxisValue>> = {}): Evaluation => {
    const chosen = Object.keys(sides).length > 0;
    const read = materialContext(task, m, chosen ? { ...sides, chosenAt: 0, prep: 1 } : undefined);
    const prep: Record<string, number> = { familiarity: 1, memorization: 1, interpretation: 1, rehearsal: 1, partner: 1, ...(chosen ? { approach: 1 } : {}) };
    const ctx: EvalContext = { task, techniques: { scene: 1, ...(m.techniques ?? {}) }, prep, required: Object.fromEntries(Object.keys(prep).map((k) => [k, 0.9])), difficulty, condition: { readiness: 100 }, lean: read.lean, inputs: read.inputs, extraPrep: read.prep, fit: read.fit, grain: read.grain, key: `h4:${m.id}`, expected: true };
    return judgePiece('h4', p, ctx, { segments: toneSegments(m.tones, 2), work: [], part: 'rehearsal', perTurn: PIECE.scene.perTurn, perBlend: 0, most: PIECE.scene.most, load: loadOf(m, 'scene') });
  };
  // H4's actors: the even actor at 50, and a specialist at 85 in one ability with the other eleven lowered evenly to keep the
  // even actor's 600, every technique at 50 (`tools/ag-baseline.ts`).
  const EVEN: Performer = { ability: () => 50, full: () => 100, technique: () => 50 };
  const PRESENCE: Performer = { ability: (id) => (id === 'presence' ? 85 : (600 - 85) / 11), full: () => 100, technique: () => 50 };

  it('before brief 09 no class scene or play had a partner level under 2; the speeches to a crowd have 1, and the rule reaches them: presence 2 more on connection and its lean half again, by each level under 2', () => {
    for (const m of all.filter((x) => !NEW.includes(x.id))) expect(m.partner, m.id).toBeGreaterThanOrEqual(2);
    for (const id of ['caesar-3-2', 'henry5-4-3', 'oedipus-1']) {
      const m = byId(id);
      expect(m.partner, id).toBe(1);
      const read = materialContext(task, m);
      // One unit of the solo demand (2 − partner 1): presence 2 on connection beside the task's own 1, and connection leant
      // by 1 + 0.5 for it and by 1 + 0.2 for the partner feature at level 1 (`FEATURE_EFFECT.partner`), whose listening adds
      // 0.35 a level to the task's own 0.25.
      expect(read.inputs.connection?.find((x) => x.ability === 'presence')?.weight, id).toBeCloseTo(2, 12);
      expect(read.inputs.connection?.find((x) => x.ability === 'listening')?.weight, id).toBeCloseTo(0.35, 12);
      expect(read.lean.connection, id).toBeCloseTo(1.5 * 1.2, 12);
    }
    // The play within the play is played off a partner at 2: the solo demand doesn't reach it.
    expect(materialContext(task, byId('dream-5-1')).inputs.connection?.find((x) => x.ability === 'presence')).toBeUndefined();
  });

  it('a specialist in presence comes out ahead of an even actor of the same budget on each speech to many with the partner barely there, and behind on every scene played off a partner', () => {
    for (const id of ['caesar-3-2', 'henry5-4-3', 'oedipus-1']) {
      const m = byId(id);
      expect(scene(m, PRESENCE).exact! - scene(m, EVEN).exact!, id).toBeGreaterThan(0);
    }
    const partnered = SCENE_MATERIAL.filter((m) => m.partner >= 2);
    expect(partnered.length).toBeGreaterThanOrEqual(61);
    for (const m of partnered) expect(scene(m, PRESENCE).exact! - scene(m, EVEN).exact!, m.id).toBeLessThan(0.05);
  });

  it('a mastered, prepared actor reaches 100 on each of the four, on every way of playing that fits', () => {
    const MASTER: Performer = { ability: () => 100, full: () => 100, technique: () => MASTERED };
    let n = 0;
    for (const id of NEW) {
      const m = byId(id);
      for (const pace of [undefined, ...AXES.pace.values]) for (const scale of [undefined, ...AXES.scale.values]) for (const structure of [undefined, ...AXES.structure.values]) {
        const sides = { ...(pace ? { pace } : {}), ...(scale ? { scale } : {}), ...(structure ? { structure } : {}) } as Partial<Record<Axis, AxisValue>>;
        if ((Object.entries(sides) as [Axis, AxisValue][]).some(([a, v]) => misfitOf(a, v, m))) continue;
        const e = scene(m, MASTER, sides);
        expect(e.overall, `${id} ${JSON.stringify(sides)}`).toBe(100);
        expect(e.mastery).toBe(true);
        n += 1;
      }
    }
    expect(n).toBe(4 * 27);
  });

  it('a student meets them in play: once every earlier verse scene is studied, the Heightened Text course sets one of the three, and once every earlier Greek scene is, The Greeks sets the speech before the suppliants', () => {
    const studied = (t: string, course: string, ids: readonly string[]): Worked[] => ids.map((id, i) => ({ id: `w${i}`, course, template: t, setOn: `2026-09-${String(1 + (i % 28)).padStart(2, '0')}`, sceneId: id, answers: {}, status: 'shown' }));
    const verse = templateById('classical-scene')!;
    const fresh = scenesFor(verse, 'DRAM 203a/b', [], 3);
    const earlier = fresh.filter((x) => !NEW.includes(x.id));
    // Appended last, so with nothing studied every earlier scene that fits as well comes first.
    expect(NEW).not.toContain(fresh[0]!.id);
    const next = scenesFor(verse, 'DRAM 203a/b', studied(verse.id, 'DRAM 203a/b', earlier.map((x) => x.id)), 3);
    expect(['caesar-3-2', 'henry5-4-3', 'dream-5-1']).toContain(next[0]!.id);
    const greek = templateById('greek-scene')!;
    const before = scenesFor(greek, 'DRAM 293b', [], 2).filter((x) => !NEW.includes(x.id));
    expect(scenesFor(greek, 'DRAM 293b', studied(greek.id, 'DRAM 293b', before.map((x) => x.id)), 2)[0]!.id).toBe('oedipus-1');
    expect(SCENES.filter((x) => NEW.includes(x.id)).map((x) => [x.id, x.language, x.tradition ?? '']).sort()).toEqual([['caesar-3-2', 'verse', ''], ['dream-5-1', 'verse', ''], ['henry5-4-3', 'verse', ''], ['oedipus-1', 'verse', 'greek']]);
  });
});
