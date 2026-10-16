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
 * specialist comes out ahead where the scene is a speech to many with the partner barely there (from evaluation-10, level
 * on the Forum, whose turns give it a long score) and behind where it's played off a partner, a mastered actor reaches
 * 100 on every way of playing that fits them, and a student meets them in play once the scenes before them run short.
 *
 * **A scene's units (evaluation-10, the follow-up).** Stanislavski divides a role by its action ("a new 'bit' begins whenever
 * an action or counteraction shifts in manner of execution or strategy", Carnicke's glossary), not by its length; a profile's turns are those
 * shifts beyond its changes of tone. From evaluation-10 a class scene and a play are cut into their units, each tone
 * section again at each of its turns, each section keeping its weight, and what a piece demands counts those units, so a
 * scene of more than three reads discipline's long score as a brief's beats do. Held here: the units by hand, the
 * segment's place by the running before it (a brief's heart weighing more and taking no longer), discipline read by a
 * scene's units and not without them, and a save's work on a piece's segments moved to its units once.
 *
 * Every performer is TEST SETUP (levels set directly), every scene judged as `tools/interpretation.ts --stage` (ST3) or
 * `tools/ag-baseline.ts` (H4) judges it, the grain held at nothing as ST3 holds it. Expected figures are worked from the
 * rule (`EVALUATION`, `MASTERED`, the Scene Study template's par, the solo demand's sizes), never from the engine's own
 * helpers.
 */
import { describe, expect, it } from 'vitest';
import { judgePiece, loadOf, toneSegments, unitSegments } from '@/engine/systems/piece';
import { frozenPerformer, replayAs, type EvalContext, type Evaluation, type Performer } from '@/engine/systems/evaluation';
import { TASK_PROFILES } from '@/engine/content/tasks';
import { MASTERED } from '@/engine/content/abilities';
import { PIECE } from '@/engine/content/piece';
import { GRAIN } from '@/engine/content/interpretation';
import { PLAY_MATERIAL, SCENE_MATERIAL, type MaterialProfile } from '@/engine/content/material';
import { templateById } from '@/engine/content/coursework';
import { difficultyOf } from '@/engine/systems/coursework';
import { demandsOf, materialContext, misfitOf, type Playing } from '@/engine/systems/material';
import type { Axis, AxisValue } from '@/engine/content/material';

type Sides = Omit<Playing, 'chosenAt' | 'prep'>;
import { SCENES } from '@/engine/content/coursework';
import { HOUSE_SCENES } from '@/engine/content/scenes-house';
import { scenesFor, type Worked } from '@/engine/systems/learning';
import { createSave, cutIntoUnits, loadSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { instantFromZoned } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { courseworkOf } from '@/engine/systems/coursework';
import type { SaveUniverse } from '@/engine/domain/model';
import type { Simulation } from '@/engine/core/simulation';

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
    return judgePiece('interpretation', p, ctx, { segments: unitSegments(m, 2), work: [], part: 'rehearsal', perTurn: PIECE.scene.perTurn, perBlend: 0, most: PIECE.scene.most, load: loadOf(m, 'scene') });
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
  const scene = (m: MaterialProfile, p: Performer, sides: Sides = {}): Evaluation => {
    const chosen = Object.keys(sides).length > 0;
    const read = materialContext(task, m, chosen ? { ...sides, chosenAt: 0, prep: 1 } : undefined);
    const prep: Record<string, number> = { familiarity: 1, memorization: 1, interpretation: 1, rehearsal: 1, partner: 1, ...(chosen ? { approach: 1 } : {}) };
    const ctx: EvalContext = { task, techniques: { scene: 1, ...(m.techniques ?? {}) }, prep, required: Object.fromEntries(Object.keys(prep).map((k) => [k, 0.9])), difficulty, condition: { readiness: 100 }, lean: read.lean, inputs: read.inputs, extraPrep: read.prep, fit: read.fit, grain: read.grain, key: `h4:${m.id}`, expected: true };
    return judgePiece('h4', p, ctx, { segments: unitSegments(m, 2), work: [], part: 'rehearsal', perTurn: PIECE.scene.perTurn, perBlend: 0, most: PIECE.scene.most, load: loadOf(m, 'scene') });
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

  it('a specialist in presence comes out ahead of an even actor of the same budget on the speeches to many of four units or fewer that hold no long score, level on the Forum, whose turns make one, and behind on every scene played off a partner', () => {
    for (const id of ['henry5-4-3', 'oedipus-1']) {
      const m = byId(id);
      expect(scene(m, PRESENCE).exact! - scene(m, EVEN).exact!, id).toBeGreaterThan(0.05);
    }
    // Under evaluation-9 the Forum (one tone, three turns) was cut in two and presence's specialist led it by 0.12. From
    // evaluation-10 its three turns make four units, one past three, so its long score reads discipline (`DEMAND_EFFECT.beats`)
    // and presence's share of the scene falls: level, within 0.05. Without its turns the same speech is presence's again.
    const forum = byId('caesar-3-2');
    expect(demandsOf(forum).beats).toBe(1);
    expect(Math.abs(scene(forum, PRESENCE).exact! - scene(forum, EVEN).exact!)).toBeLessThan(0.05);
    const turnless = { ...forum, turns: 0 };
    expect(demandsOf(turnless).beats).toBe(0);
    expect(scene(turnless, PRESENCE).exact! - scene(turnless, EVEN).exact!).toBeGreaterThan(0.05);
    const partnered = SCENE_MATERIAL.filter((m) => m.partner >= 2);
    expect(partnered.length).toBeGreaterThanOrEqual(61);
    for (const m of partnered) expect(scene(m, PRESENCE).exact! - scene(m, EVEN).exact!, m.id).toBeLessThan(0.05);
  });

  it('a mastered, prepared actor reaches 100 on each of the four, on every way of playing that fits', () => {
    const MASTER: Performer = { ability: () => 100, full: () => 100, technique: () => MASTERED };
    let n = 0;
    for (const id of NEW) {
      const m = byId(id);
      for (const pace of [undefined, 'measured', 'driven'] as const) for (const scale of [undefined, 'restrained', 'expansive'] as const) for (const structure of [undefined, 'set', 'open'] as const) {
        const sides: Sides = { ...(pace ? { pace } : {}), ...(scale ? { scale } : {}), ...(structure ? { structure } : {}) };
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

describe('a scene’s units: its tone sections and its turns (evaluation-10, the follow-up)', () => {
  const task = TASK_PROFILES.scene!;
  const byId = (id: string) => [...SCENE_MATERIAL, ...PLAY_MATERIAL].find((m) => m.id === id)!;

  it('a scene is cut at each change of tone and each turn, the turns going to its sections in order, each section keeping its weight', () => {
    // The Seagull: grave, lyric, grave and three turns: one turn in each section, so six units of half a section each.
    const seagull = unitSegments(byId('seagull-4'), 2);
    expect(seagull.map((x) => x.tones[0])).toEqual(['grave', 'grave', 'lyric', 'lyric', 'grave', 'grave']);
    expect(seagull.map((x) => x.weight)).toEqual([0.5, 0.5, 0.5, 0.5, 0.5, 0.5]);
    expect(seagull.map((x) => x.turnInto)).toEqual([false, true, true, true, true, true]);
    // Hamlet's 3.1: one tone, three turns: four units of a quarter.
    const hamlet = unitSegments(byId('hamlet-3-1'), 2);
    expect(hamlet.map((x) => x.weight)).toEqual([0.25, 0.25, 0.25, 0.25]);
    expect(hamlet.map((x) => x.label)).toEqual(['Part 1', 'Part 2', 'Part 3', 'Part 4']);
    // A profile with no turns is cut by its tones, as it was.
    const none = { ...byId('hamlet-3-1'), turns: 0 };
    expect(unitSegments(none, 2)).toEqual(toneSegments(none.tones, 2));
  });

  it('a segment’s place in the piece is the running before it over the running before the last, so the drain falls where the unit does, and a brief’s heart, weighing more, takes no longer', () => {
    // TEST SETUP: three tones and one turn, so the first section is two units of half a section and the others whole.
    const m = { ...byId('hamlet-3-1'), tones: ['comic', 'grave', 'lyric'] as const, turns: 1 };
    const segments = unitSegments(m, 2);
    expect(segments.map((x) => x.weight)).toEqual([0.5, 0.5, 1, 1]);
    expect(segments.map((x) => x.length)).toEqual([0.5, 0.5, 1, 1]);
    const STAMINA = 40, LOAD = 1;
    const p: Performer = { ability: (id) => (id === 'stamina' ? STAMINA : 60), full: () => 100, technique: () => 50 };
    const drains = (segs: typeof segments) => judgePiece('units', p, { task, techniques: { scene: 1 }, prep: {}, required: {}, difficulty: 0, condition: { readiness: 100 }, key: 'units', expected: true }, { segments: segs, work: [], part: 'rehearsal', perTurn: 0, perBlend: 0, most: 1, load: LOAD }).piece!.segments.map((x) => x.drain);
    // Places 0, 0.5 / 2, 1 / 2 and 2 / 2 (the running before each over the 2 before the last), each drained by
    // PIECE.drain (0.3) × load × place × (1 − stamina).
    const byHand = (places: number[]) => places.map((place) => Math.round((1 - 0.3 * LOAD * place * (1 - STAMINA / 100)) * 1000) / 1000);
    expect(drains(segments)).toEqual(byHand([0, 0.25, 0.5, 1]));
    // A brief's four beats, its heart the second at `BRIEF.readingHeart`'s 1.6, no length given: each one long, so the
    // places are a third apart, as they were before evaluation-10, whatever the heart weighs.
    const beats = [1, 1.6, 1, 1].map((weight, i) => ({ label: `Beat ${i + 1}`, tones: ['grave'] as const, weight, turnInto: false, blend: false }));
    expect(drains(beats)).toEqual(byHand([0, 1 / 3, 2 / 3, 1]));
  });

  it('a scene of more than three units reads discipline by the beats demand, and the same scene without its turns doesn’t', () => {
    const hamlet = byId('hamlet-3-1');
    // One tone and three turns: four units, one past three. The beats demand: discipline 2.5 a unit on consistency.
    expect(demandsOf(hamlet).beats).toBe(1);
    const turnless = { ...hamlet, turns: 0 };
    expect(demandsOf(turnless).beats).toBe(0);
    const disciplineOn = (m: MaterialProfile) => materialContext(task, m).inputs.consistency?.find((x) => x.ability === 'discipline')?.weight ?? 0;
    expect(disciplineOn(hamlet) - disciplineOn(turnless)).toBeCloseTo(2.5, 12);
    // So +10 discipline moves the scene of four units more than the same scene cut in two (judged as Scene Study pitches it).
    const difficulty = difficultyOf(templateById('scene-study')!);
    const EVEN: Performer = { ability: () => 50, full: () => 100, technique: () => 50 };
    const MORE: Performer = { ability: (id) => (id === 'discipline' ? 60 : 50), full: () => 100, technique: () => 50 };
    const whole = (m: MaterialProfile, p: Performer) => {
      const read = materialContext(task, m);
      const prep = { familiarity: 1, memorization: 1, interpretation: 1, rehearsal: 1, partner: 1 };
      return judgePiece('units', p, { task, techniques: { scene: 1, ...(m.techniques ?? {}) }, prep, required: Object.fromEntries(Object.keys(prep).map((k) => [k, 0.9])), difficulty, condition: { readiness: 100 }, lean: read.lean, inputs: read.inputs, key: 'units', expected: true }, { segments: unitSegments(m, 2), work: [], part: 'rehearsal', perTurn: PIECE.scene.perTurn, perBlend: 0, most: PIECE.scene.most, load: loadOf(m, 'scene') }).exact!;
    };
    expect(whole(hamlet, MORE) - whole(hamlet, EVEN)).toBeGreaterThan(whole(turnless, MORE) - whole(turnless, EVEN));
  });
});

describe('Scapin’s sack scene: a scene of six units, discipline’s long score (the follow-up)', () => {
  const task = TASK_PROFILES.scene!;
  const difficulty = difficultyOf(templateById('scene-study')!);
  const scapin = SCENE_MATERIAL.find((m) => m.id === 'scapin-3-2')!;
  const judged = (m: MaterialProfile, p: Performer, sides: Sides = {}): Evaluation => {
    const chosen = Object.keys(sides).length > 0;
    const read = materialContext(task, m, chosen ? { ...sides, chosenAt: 0, prep: 1 } : undefined);
    const prep: Record<string, number> = { familiarity: 1, memorization: 1, interpretation: 1, rehearsal: 1, partner: 1, ...(chosen ? { approach: 1 } : {}) };
    const ctx: EvalContext = { task, techniques: { scene: 1, ...(m.techniques ?? {}) }, prep, required: Object.fromEntries(Object.keys(prep).map((k) => [k, 0.9])), difficulty, condition: { readiness: 100 }, lean: read.lean, inputs: read.inputs, extraPrep: read.prep, fit: read.fit, grain: read.grain, key: `scapin:${m.id}`, expected: true };
    return judgePiece('scapin', p, ctx, { segments: unitSegments(m, 2), work: [], part: 'rehearsal', perTurn: PIECE.scene.perTurn, perBlend: 0, most: PIECE.scene.most, load: loadOf(m, 'scene') });
  };
  const EVEN: Performer = { ability: () => 50, full: () => 100, technique: () => 50 };
  const DISCIPLINE: Performer = { ability: (id) => (id === 'discipline' ? 85 : (600 - 85) / 11), full: () => 100, technique: () => 50 };

  it('is six units of a sixth, three past three, so its long score asks discipline 2.5 a unit more on consistency than the same scene without its turns', () => {
    const units = unitSegments(scapin, 2);
    expect(units).toHaveLength(1 + 5);
    for (const u of units) expect(u.weight).toBeCloseTo(1 / 6, 12);
    expect(demandsOf(scapin).beats).toBe(6 - 3);
    const turnless = { ...scapin, turns: 0 };
    const disciplineOn = (m: MaterialProfile) => materialContext(task, m).inputs.consistency?.find((x) => x.ability === 'discipline')?.weight ?? 0;
    expect(disciplineOn(scapin) - disciplineOn(turnless)).toBeCloseTo(2.5 * 3, 12);
  });

  it('a specialist in discipline comes out ahead of an even actor of the same budget on it, by more than on the same scene without its turns', () => {
    const lead = (m: MaterialProfile) => judged(m, DISCIPLINE).exact! - judged(m, EVEN).exact!;
    expect(lead(scapin)).toBeGreaterThan(0.05);
    expect(lead(scapin)).toBeGreaterThan(lead({ ...scapin, turns: 0 }));
  });

  it('a mastered, prepared actor reaches 100 on every way of playing that fits it', () => {
    const MASTER: Performer = { ability: () => 100, full: () => 100, technique: () => MASTERED };
    let n = 0;
    for (const pace of [undefined, 'measured', 'driven'] as const) for (const scale of [undefined, 'restrained', 'expansive'] as const) for (const structure of [undefined, 'set', 'open'] as const) {
      const sides: Sides = { ...(pace ? { pace } : {}), ...(scale ? { scale } : {}), ...(structure ? { structure } : {}) };
      if ((Object.entries(sides) as [Axis, AxisValue][]).some(([a, v]) => misfitOf(a, v, scapin))) continue;
      expect(judged(scapin, MASTER, sides).overall, JSON.stringify(sides)).toBe(100);
      n += 1;
    }
    expect(n).toBe(27);
  });

  it('a student meets it in Acting III’s Scene Study once every earlier prose scene is studied, and never in Acting I’s, which sets plays from 1900', () => {
    const studied = (t: string, course: string, ids: readonly string[]): Worked[] => ids.map((id, i) => ({ id: `w${i}`, course, template: t, setOn: `2026-09-${String(1 + (i % 28)).padStart(2, '0')}`, sceneId: id, answers: {}, status: 'shown' }));
    const study = templateById('scene-study')!;
    const fresh = scenesFor(study, 'DRAM 303a', [], 2);
    expect(fresh.map((x) => x.id)).toContain('scapin-3-2');
    expect(fresh[0]!.id).not.toBe('scapin-3-2');
    const earlier = fresh.filter((x) => x.id !== 'scapin-3-2').map((x) => x.id);
    expect(scenesFor(study, 'DRAM 303a', studied(study.id, 'DRAM 303a', earlier), 2)[0]!.id).toBe('scapin-3-2');
    expect(scenesFor(study, 'DRAM 103a/b', [], 2).map((x) => x.id)).not.toContain('scapin-3-2');
    expect(SCENES.find((x) => x.id === 'scapin-3-2')).toMatchObject({ language: 'prose', genre: 'comedy', year: 1671 });
  });
});

describe('a save from before evaluation-10: work kept on a piece’s segments moved to its units, once', () => {
  const life = (seed: string): Simulation => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
  const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
  const actingI = (sim: Simulation) => courseworkOf(sim, sim.player)!.assignments.find((a) => a.course === 'DRAM 103a/b' && a.status === 'open')!;

  it('moves a scene’s work and its ways to the units of each tone section, a try to its section’s first unit, asks the problem again, and does it on one opening only', () => {
    // g18-probe's life: Acting I sets The Cherry Orchard's Act Four at orientation's courses, Friday 28 August.
    const sim = life('g18-probe');
    sim.advanceTo(instantFromZoned({ year: 2026, month: 8, day: 28, hour: 14, minute: 0 }, 'America/New_York'));
    const a = actingI(sim);
    expect(a.sceneId).toBe('cherry-orchard-4');
    // TEST SETUP: what a build before evaluation-10 kept on its two segments, comic and grave (`toneSegments`), and the
    // save marked as one that build wrote (`SaveUniverse.opened` without the step).
    const way = { axis: 'pace' as const, side: 'driven' as const, prep: 0.4 };
    a.work = [0.5, 0.2];
    a.book = { tries: [{ at: sim.now, problem: 'turn:1', label: 'The Turn Into The End', adjustment: 'work-beat', segment: 1, before: 40, after: 41, verdict: 'kept' }], ways: [null, way], problem: { id: 'turn:1', kind: 'turn', segment: 1, label: 'The Turn Into The End', why: '', measure: 40, at: sim.now } };
    const made = reload(sim);
    sim.universe.opened = sim.universe.opened!.filter((x) => x !== 'cutIntoUnits');
    const opened = reload(sim);
    // Its comic section is two units now, its turn the second, and its grave section one: each takes its section's.
    const b = actingI(opened);
    expect(b.work).toEqual([0.5, 0.5, 0.2]);
    expect(b.book!.ways).toEqual([null, null, way]);
    expect(b.book!.tries[0]).toMatchObject({ segment: 2, problem: 'turn:2' });
    expect(b.book!.problem).toBeUndefined();
    expect(opened.universe.opened).toContain('cutIntoUnits');
    // Once: opened again, nothing moves.
    expect(actingI(reload(opened)).work).toEqual([0.5, 0.5, 0.2]);
    // A save the step was already taken on, a new life's, keeps what it holds as it is.
    expect(actingI(made).work).toEqual([0.5, 0.2]);
    expect(actingI(made).book!.problem?.id).toBe('turn:1');
  }, 60_000);

  it('moves a part’s work on a play’s movements the same way, wherever the school keeps the part, and leaves a piece with nothing kept alone', () => {
    // TEST SETUP: a universe holding only what the step reads. Woyzeck's two tones and two turns are four units.
    // A Doll's House's one tone was its two halves; its two turns make three units, whose middles fall at a sixth, a half
    // and five sixths of it, so in the first half, the second (a half is the second's start) and the second.
    const process = { work: [0.4, 0.8] };
    const untouched = { play: 'Woyzeck', process: {} };
    const halves = { sceneId: 'dollhouse-3', work: [0.3, 0.7] };
    const universe = { people: { p: { school: { casting: { play: 'Woyzeck', process }, rep: untouched, coursework: { assignments: [{ sceneId: 'seagull-4' }, halves] } } } } } as unknown as SaveUniverse;
    expect(cutIntoUnits(universe)).toBe(2);
    expect(process.work).toEqual([0.4, 0.4, 0.8, 0.8]);
    expect(halves.work).toEqual([0.3, 0.7, 0.7]);
    expect(untouched.process).toEqual({});
  });
});
