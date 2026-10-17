/**
 * The owner's approved acting criteria, brief 10 (2026-10-16; docs/verification/decisions-2026-10-16/criteria.md, section
 * 1, committed before any of this ran): ST3-R, ST6-R, H4-R, L3-R and M1, which supersede ST3, ST6, H4 and L3 as
 * written. docs/verification/remaining-10/judge-checklist.json is the list, written before any change; judge-result.json
 * is what came of it, and docs/verification/decisions-2026-10-16/baseline/ and judge/ are the measurements.
 *
 * **What was found first.** ST6's specialists were built over eight abilities where nine are left, so each totalled
 * 645.6 against the even actor's 600, and every ST6 figure until then compared unequal budgets. At the criteria's
 * budget the restrained specialist beats the even actor's better side against the grain on 3 of 44 materials, not 24 of
 * 42: a specialist strong in three abilities and at 40.6 in nine is behind an even actor at 50 on most work, its own
 * included, because a whole reads a little of every ability and a quarter of it is the weakest dimension, so a strength
 * doesn't erase an unrelated weakness. That's held here as it stands, and reported as ST6-R not met.
 *
 * **What was added.** Two public meetings for scene study (`content/scenes-meeting.ts`), read from Sharp's An Enemy of
 * the People and Galsworthy's Strife before they were measured: presence was the largest input of three pieces, where
 * H4-R asks five.
 *
 * Held here, each block's figures worked from the rule (`EVALUATION`, `MASTERED`, Scene Study's par, `DEVELOPMENT`,
 * `ATTRIBUTES`), never typed from a run:
 * - identical inputs give identical results, judged twice, replayed, drawn and after a save and a load;
 * - the stage and a close frame differ where the rule says, and only there; every shown figure its exact value rounded
 *   once, each whole worked by hand from its parts;
 * - restrained and expansive interpretations, the wins and the limits, and what each depends on;
 * - every ability's contribution on its own work, the two meetings presence's, and what an ability does outside the
 *   piece in twin lives through the commands;
 * - a generalist's and a specialist's development, controlled, and more never making a result worse;
 * - mastery at 100 on every piece and reading and every way of playing that fits.
 *
 * Every performer is TEST SETUP (levels set directly); the stage cases are judged as `tools/interpretation.ts --stage`
 * judges them, and the pieces as `tools/pieces.ts` does. Stamina's own work, and H4-R (a) for memory and composure,
 * waited on the stamina area's model or an owner's decision until the judge area's second phase, later on 2026-10-16, and
 * weren't asserted here. That phase, under evaluation-11 before it left its branch: the full drain 0.4 where it was 0.3,
 * and a night's reaching it at 4/3 of the work it did (`PIECE.drain`, `WORKLOAD.full`); a night's part's text by its
 * time on stage (`PART_TEXT`), which the owner authorized; and a night before a house at stakes 1.5 (`NIGHT_STAKES`), from
 * performance-anxiety research. Each is held here by hand, and H4-R's own work for all twelve.
 *
 * Added on 2026-10-17 by brief 11's acting area (docs/verification/completion-2026-10-16/acting-result.json), for clauses
 * brief 10 held by measurement alone: ST3-R (e), the rules a process can change made in it and put back; ST6-R's
 * restraint read against its own abilities (the specialist and its twin) and against the grain's strength, and the
 * materials restraint suits held to exist; L3-R (a)'s fixed set as it was named and judged, controlled, with each
 * journey's own work replayed beside it; and L3-R (e)'s report, on two months the journeys' tool plays. ST6-R (a), (c)
 * and (e) still fail: what was measured of them is the owner's to decide on, and nothing here asserts them.
 */
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { ABILITY_DEFS, DEVELOPMENT, MASTERED, type AbilityId } from '@/engine/content/abilities';
import { APPROACH_EFFECT, AXES, CAMERA_LEAN, STAGE_LEAN } from '@/engine/content/approaches';
import { GRAIN } from '@/engine/content/interpretation';
import { PIECE, TONE_LEAN } from '@/engine/content/piece';
import { PLAY_MATERIAL, SCENE_MATERIAL, type Axis, type AxisValue, type MaterialProfile } from '@/engine/content/material';
import { BRIEF_BY_ID } from '@/engine/content/briefs';
import { EVALUATION, TASK_PROFILES, type Dimension } from '@/engine/content/tasks';
import { SCENES, templateById } from '@/engine/content/coursework';
import { difficultyOf } from '@/engine/systems/coursework';
import { frozenPerformer, leanedWeights, replay, replayAs, type EvalContext, type Evaluation, type Performer, type WorkRecord } from '@/engine/systems/evaluation';
import { judgePiece, judgePieceExact, loadOf, nightPiece, unitSegments } from '@/engine/systems/piece';
import { demandsOf, materialContext, misfitOf, type Playing } from '@/engine/systems/material';
import { eveningCost, nightLoad, partText, withPart } from '@/engine/systems/workload';
import { RUNNING_TIMES } from '@/engine/content/workload';
import { CALL_KIND } from '@/engine/systems/school';
import { sceneOfMaterial, suitabilityOf } from '@/engine/systems/interpretation';
import { scenesFor, type Worked } from '@/engine/systems/learning';
import { abilityFull, abilityOf, attributesOf, ATTRIBUTES } from '@/engine/systems/attributes';
import { personalityOf } from '@/engine/systems/personality';
import { ALL_PIECES, FIXED_SET, fixedPieces } from '../tools/pieces';
import { attentiveHour, life as policyLife } from '../tools/policy';

const r1 = (x: number) => Math.round(x * 10) / 10;
const ABILITIES = ABILITY_DEFS.map((d) => d.id);
type Scale = 'restrained' | 'expansive';
const actor = (ab: Partial<Record<string, number>>, fill: number, tech = 50): Performer => ({ ability: (id) => ab[id] ?? fill, full: () => 100, technique: () => tech });
const budget = (p: Performer) => ABILITIES.reduce((t, id) => t + p.ability(id), 0);
const MATS = [...SCENE_MATERIAL, ...PLAY_MATERIAL];
const byId = (id: string) => MATS.find((m) => m.id === id)!;

/** A class scene or a play as a class scene, as `--stage` judges it: every part complete, the choice rehearsed in at `prep`. */
function sceneCase(m: MaterialProfile, scale: Scale, o: { key?: string; prep?: number } = {}) {
  const task = TASK_PROFILES.scene!;
  const prepAt = o.prep ?? 1;
  const read = materialContext(task, m, { scale, chosenAt: 0, prep: prepAt });
  const prep = { familiarity: 1, memorization: 1, interpretation: 1, rehearsal: 1, partner: 1, approach: prepAt };
  const required = { familiarity: 0.9, memorization: 0.9, interpretation: 0.9, rehearsal: 0.9, partner: 0.9, approach: read.required };
  const ctx: EvalContext = { task, techniques: { scene: 1, ...(m.techniques ?? {}) }, prep, required, difficulty: difficultyOf(templateById('scene-study')!), condition: { readiness: 100 }, lean: read.lean, inputs: read.inputs, extraPrep: read.prep, fit: read.fit, grain: read.grain, key: o.key ?? `dj:${m.id}`, ...(o.key ? {} : { expected: true }) };
  const spec = { segments: unitSegments(m, 2), work: [] as number[], part: 'rehearsal', perTurn: PIECE.scene.perTurn, perBlend: 0, most: PIECE.scene.most, load: loadOf(m, 'scene') };
  return { task, ctx, spec };
}
const judged = (m: MaterialProfile, p: Performer, scale: Scale, o: { key?: string; prep?: number } = {}): Evaluation => { const c = sceneCase(m, scale, o); return judgePiece('decisions-judge', p, c.ctx, c.spec); };
const exactOf = (m: MaterialProfile, p: Performer, scale: Scale, o: { prep?: number } = {}) => judged(m, p, scale, o).exact!;
/** The grain at a strength for the length of `f`, put back after. */
const grained = <T,>(strength: number, f: () => T): T => { const s0 = GRAIN.strength; Object.assign(GRAIN as Record<string, number>, { strength }); try { return f(); } finally { Object.assign(GRAIN as Record<string, number>, { strength: s0 }); } };
/** ST3's comparison holds the grain at nothing, so the medium's own lean is what's compared. */
const grainless = <T,>(f: () => T): T => grained(0, f);
const stageCases = () => MATS.flatMap((m) => (['restrained', 'expansive'] as const).filter((s) => !misfitOf('scale', s, m)).map((s) => ({ m, s })));
const closeFrame = (m: MaterialProfile): MaterialProfile => ({ ...m, medium: 'camera' });
/** An actor at `share` of full in every ability, techniques at `tech`, and stamina at `stamina` (100 doesn't drain). */
const at = (share: number, stamina: number, tech = share * MASTERED): Performer => ({ ability: (id) => (id === 'stamina' ? stamina : 100 * share), full: () => 100, technique: () => tech });

describe('ST3-R: identical effective inputs give identical results (brief 10)', () => {
  it('the same scene judged twice, replayed from its own record, replayed with its draw, and replayed after a save and a load comes to the same exact result on every case', () => {
    const criterion = at(0.55, 55, 50);
    const records: { w: WorkRecord; exact: number; drawn: boolean }[] = [];
    grainless(() => {
      for (const { m, s } of stageCases()) {
        const e = judged(m, criterion, s), again = judged(m, criterion, s);
        expect(again.exact, `${m.id} ${s}`).toBe(e.exact);
        expect(replayAs({ inputs: e.inputs, task: e.task, ruleset: e.ruleset }, TASK_PROFILES.scene!, frozenPerformer(e.inputs))!.exact).toBe(e.exact);
        const d = judged(m, criterion, s, { key: `dj-drawn:${m.id}:${s}` });
        expect(replay({ inputs: d.inputs, task: d.task, ruleset: d.ruleset }, TASK_PROFILES.scene!)!.exact).toBe(d.exact);
        const w = (x: Evaluation, key: string, drawn: boolean) => records.push({ drawn, exact: x.exact!, w: { at: 0, task: x.task, taskLabel: x.taskLabel, what: m.id, overall: x.overall, dims: {}, mastery: x.mastery, limits: x.limits.slice(0, 3), ruleset: x.ruleset, inputs: { ...x.inputs, key } } });
        w(e, `dj:${m.id}:${s}`, false); w(d, `dj-drawn:${m.id}:${s}`, true);
      }
      // Kept in a save, the save written and read back and opened as any save is, and each record replayed from it.
      const sim = createSave(1, 'dj-st3', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
      for (let i = 0; i < records.length; i += 150) {
        const batch = records.slice(i, i + 150);
        sim.player.work = batch.map((x) => structuredClone(x.w));
        const opened = loadSave(deserialise(serialise(sim.universe)) as never);
        for (const x of batch) {
          const kept = opened.player.work!.find((y) => y.inputs.key === x.w.inputs.key)!;
          const again = x.drawn ? replay(kept, TASK_PROFILES.scene!) : replayAs(kept, TASK_PROFILES.scene!, frozenPerformer(kept.inputs));
          expect(again!.exact, x.w.inputs.key).toBe(x.exact);
        }
      }
    });
    expect(records.length).toBe(2 * stageCases().length);
    expect(stageCases().length).toBeGreaterThanOrEqual(189);
  });

  it('an actor even in everything the formula reads, undrained, is 100 × n^(1 + difficulty) on stage and at a close frame, at full precision and as shown', () => {
    // Scene Study's par is 50, and a par's difficulty is (par − 62) / 40: −0.3, so the power is 0.7.
    expect(difficultyOf(templateById('scene-study')!)).toBeCloseTo((50 - 62) / 40, 12);
    grainless(() => {
      for (const n of [0.35, 0.55, 0.8]) for (const { m, s } of stageCases()) {
        const p = at(n, 100);
        const stage = judged(m, p, s), close = judged(closeFrame(m), p, s);
        expect(stage.exact!, `${m.id} ${s} at ${n}`).toBeCloseTo(100 * n ** 0.7, 9);
        expect(Math.abs(stage.exact! - close.exact!)).toBeLessThan(1e-9);
        expect(stage.overall).toBe(close.overall);
      }
    });
  });
});

describe('ST3-R: the stage and a close frame differ where they should, and only there (brief 10)', () => {
  it('the voice-and-body specialist is better on stage than at a close frame on every case, and a stamina at 55 costs on both, at a budget of 600', () => {
    const VOICE_BODY = actor({ vocal: 85, physical: 85 }, (600 - 170) / 10);
    expect(budget(VOICE_BODY)).toBeCloseTo(600, 9);
    grainless(() => {
      for (const { m, s } of stageCases()) {
        expect(exactOf(m, VOICE_BODY, s), `${m.id} ${s}`).toBeGreaterThan(exactOf(closeFrame(m), VOICE_BODY, s));
        for (const mm of [m, closeFrame(m)]) expect(exactOf(mm, at(0.55, 100, 50), s) - exactOf(mm, at(0.55, 55, 50), s), `${mm.id} ${mm.medium} ${s}`).toBeGreaterThan(1e-9);
      }
    });
  });

  it('the criterion’s even actor’s difference is its techniques’ part and its stamina’s part, and what’s left is floating point', () => {
    grainless(() => {
      for (const { m, s } of stageCases()) {
        const apart = (p: Performer) => exactOf(m, p, s) - exactOf(closeFrame(m), p, s);
        const all = apart(at(0.55, 55, 50)), evenRead = apart(at(0.55, 55)), left = apart(at(0.55, 100));
        expect(Math.abs(left), `${m.id} ${s}`).toBeLessThan(1e-9);
        // Each part on its own, and each there: the techniques at 50 of 90 (0.556) against the abilities' 0.55, and the
        // drain, which the stage and the close frame weigh differently. How large each is isn't the criterion's.
        expect(Math.abs(all - evenRead), `${m.id} ${s}`).toBeGreaterThan(0);
        expect(Math.abs(evenRead - left), `${m.id} ${s}`).toBeGreaterThan(1e-9);
      }
    });
  });

  it('every shown figure is its own exact value rounded once, and each whole is worked by hand from its parts’ exact values', () => {
    const p = actor({ vocal: 85, physical: 85, stamina: 55 }, 42);
    let checked = 0;
    grainless(() => {
      for (const { m, s } of stageCases()) for (const mm of [m, closeFrame(m)]) {
        const { ctx, spec } = sceneCase(mm, s);
        const shown = judgePiece('decisions-judge', p, ctx, spec), x = judgePieceExact('decisions-judge', p, ctx, spec);
        expect(shown.overall).toBe(r1(x.evaluation.overall));
        for (const d of shown.dimensions) expect(d.quality).toBe(r1(x.evaluation.dimensions.find((y) => y.dimension === d.dimension)!.quality));
        for (const l of shown.limits) expect(l.by).toBe(r1(x.evaluation.dimensions.find((y) => y.dimension === l.dimension)!.limits.find((y) => y.kind === l.kind && y.what === l.what)!.by));
        // The piece's whole: its segments' exact wholes by their weights; each segment's: three quarters its dimensions'
        // weighted mean (the task's weights leant by the piece's lean and the segment's tones) and a quarter the least.
        const W = spec.segments.reduce((t, g) => t + g.weight, 0);
        expect(x.evaluation.overall).toBeCloseTo(x.segments.reduce((t, e, i) => t + e.overall * spec.segments[i]!.weight, 0) / W, 9);
        x.segments.forEach((e, i) => {
          const tones = spec.segments[i]!.tones;
          const w = leanedWeights(ctx.task, [], Object.fromEntries(Object.keys(ctx.task.dims).map((d) => [d, (ctx.lean?.[d as Dimension] ?? 1) * tones.reduce((y, t) => y * (TONE_LEAN[t]?.[d as Dimension] ?? 1) ** (1 / tones.length), 1)])));
          const qs = e.dimensions.map((d) => ({ q: d.quality, w: w[d.dimension] ?? 0 }));
          const whole = EVALUATION.meanShare * qs.reduce((t, y) => t + y.q * y.w, 0) / qs.reduce((t, y) => t + y.w, 0) + (1 - EVALUATION.meanShare) * Math.min(...qs.map((y) => y.q));
          expect(e.overall).toBeCloseTo(whole, 9);
          expect(shown.piece!.segments[i]!.overall).toBe(r1(e.overall));
        });
        checked += 1;
      }
    });
    expect(checked).toBe(2 * stageCases().length);
  });

  // From 2026-10-17 (brief 11, ST3-R (e), which brief 10 held by measurement alone): the checks above against the rules (e)
  // names, each changed in this process and put back. The stage's and the close frame's leans at 1, the full drain at
  // nothing, and the grain let into the comparison are content a process can change; rounding twice or by floor isn't, so
  // those were made in copies, each failing the test above (docs/verification/completion-2026-10-16/acting/test-mutations.json).
  it('ST3-R (e), it catches what it should: with the stage’s and the close frame’s leans at 1 the voice-and-body specialist isn’t better on stage on every case, with no drain a stamina of 55 costs nothing on any, and with the grain let into the comparison the undrained even actor comes apart', () => {
    const VOICE_BODY = actor({ vocal: 85, physical: 85 }, (600 - 170) / 10);
    const put = <T,>(o: object, to: object, f: () => T): T => { const was = { ...o }; Object.assign(o, to); try { return f(); } finally { Object.assign(o, was); } };
    grainless(() => {
      const betterOnStage = () => stageCases().filter(({ m, s }) => exactOf(m, VOICE_BODY, s) > exactOf(closeFrame(m), VOICE_BODY, s)).length;
      expect(betterOnStage()).toBe(stageCases().length);
      expect(put(STAGE_LEAN, { execution: 1 }, () => put(CAMERA_LEAN, { believability: 1 }, betterOnStage))).toBeLessThan(stageCases().length);
      const drains = () => stageCases().filter(({ m, s }) => exactOf(m, at(0.55, 100, 50), s) - exactOf(m, at(0.55, 55, 50), s) > 1e-9).length;
      expect(drains()).toBe(stageCases().length);
      expect(put(PIECE, { drain: 0 }, drains)).toBe(0);
    });
    const apart = () => stageCases().filter(({ m, s }) => Math.abs(judged(m, at(0.55, 100), s).exact! - judged(closeFrame(m), at(0.55, 100), s).exact!) > 1e-9).length;
    expect(grainless(apart)).toBe(0);
    expect(apart()).toBeGreaterThan(0);
  });
});

describe('ST6-R: restrained and expansive interpretations, the wins and the limits (brief 10)', () => {
  // The criteria's profiles, every ability not named sharing what's left of the even actor's 600.
  const RES = actor({ emotionalDepth: 85, composure: 75, focus: 75 }, (600 - 235) / 9);
  const EXP = actor({ presence: 85, vocal: 75, physical: 75 }, (600 - 235) / 9);
  const EVEN = actor({}, 50);
  const suit = (m: MaterialProfile) => { const sc = sceneOfMaterial(m); return { r: suitabilityOf('restrained', m, sc).s, e: suitabilityOf('expansive', m, sc).s }; };
  const both = MATS.filter((m) => !misfitOf('scale', 'restrained', m) && !misfitOf('scale', 'expansive', m));

  it('the profiles are on one budget: 600 each, the nine abilities left at 40.56, where until brief 10 the tool gave each specialist 645.6', () => {
    expect(budget(RES)).toBeCloseTo(600, 9);
    expect(budget(EXP)).toBeCloseTo(600, 9);
    expect(budget(EVEN)).toBe(600);
    expect(235 + 9 * ((600 - 235) / 8)).toBeCloseTo(645.625, 9);
  });

  it('a restrained take can carry a scene that leans the other way, where the lean is slight: the specialist playing Earnest’s garden scene restrained is ahead of the even actor playing it expansive, and isn’t once the choice is only half rehearsed in', () => {
    const m = byId('earnest-2');
    expect(suit(m).e).toBeGreaterThan(suit(m).r);
    expect(exactOf(m, RES, 'restrained') - exactOf(m, EVEN, 'expansive')).toBeGreaterThan(0.05);
    expect(exactOf(m, RES, 'restrained', { prep: 0.5 }) - exactOf(m, EVEN, 'expansive')).toBeLessThan(0.05);
    // The even actor, without the specialist's feeling and control, doesn't make it work.
    expect(exactOf(m, EVEN, 'restrained')).toBeLessThan(exactOf(m, EVEN, 'expansive'));
  });

  it('where size is what the scene is built on, restraint has its limits: before Thebes, at Antigone’s defiance and in the two meetings the restrained take is behind the even actor’s expansive one, and the expansive specialist is ahead of it', () => {
    for (const id of ['oedipus-300', 'antigone-441', 'enemy-4', 'strife-2-2']) {
      const m = byId(id);
      expect(suit(m).e - suit(m).r, id).toBeGreaterThanOrEqual(GRAIN.band);
      expect(exactOf(m, RES, 'restrained') - exactOf(m, EVEN, 'expansive'), id).toBeLessThan(-0.05);
      expect(exactOf(m, EXP, 'expansive') - exactOf(m, RES, 'restrained'), id).toBeGreaterThan(0.05);
    }
  });

  it('restraint’s own craft pays: the restrained specialist’s lift over the even actor is larger playing restrained than expansive wherever both fit, and restraint’s draws are part of it on every one', () => {
    const lift = (m: MaterialProfile, s: Scale) => exactOf(m, RES, s) - exactOf(m, EVEN, s);
    const R = APPROACH_EFFECT.restrained as unknown as { inputs: unknown };
    const asBuilt = R.inputs;
    for (const m of both) {
      const withDraws = lift(m, 'restrained');
      expect(withDraws - lift(m, 'expansive'), m.id).toBeGreaterThan(1e-9);
      R.inputs = {};
      try { expect(withDraws - lift(m, 'restrained'), m.id).toBeGreaterThan(0.3); } finally { R.inputs = asBuilt; }
    }
  });

  it('success depends on the scene: every win against the grain is on a material where the grain is slighter than on any of the limits', () => {
    const against = both.filter((m) => suit(m).e > suit(m).r);
    const gap = (m: MaterialProfile) => suit(m).e - suit(m).r;
    const wins = against.filter((m) => exactOf(m, RES, 'restrained') - exactOf(m, EVEN, 'expansive') > 0.05);
    const limits = against.filter((m) => exactOf(m, RES, 'restrained') - exactOf(m, EVEN, 'expansive') < -0.05);
    expect(wins.length).toBeGreaterThan(0);
    expect(Math.max(...wins.map(gap))).toBeLessThan(Math.max(...limits.map(gap)));
    // And the even actor's restrained take is never ahead of its own expansive one against the grain.
    for (const m of against) expect(exactOf(m, EVEN, 'restrained') - exactOf(m, EVEN, 'expansive'), m.id).toBeLessThanOrEqual(0.05);
  });

  it('the other half is kept: the expansive specialist playing expansive is ahead of its own restrained take on at least a quarter of the materials restraint suits better', () => {
    const withIt = both.filter((m) => suit(m).r > suit(m).e);
    const wins = withIt.filter((m) => exactOf(m, EXP, 'expansive') - exactOf(m, EXP, 'restrained') > 0.05);
    expect(wins.length).toBeGreaterThanOrEqual(Math.ceil(0.25 * withIt.length));
    // From 2026-10-17 (brief 11): and there are such materials, a quarter of those both sides fit or more (ST1's quarter;
    // 50 of 96 measured). With restrained suitability forced to its least in a copy there were none, and this held on 0 of 0.
    expect(withIt.length).toBeGreaterThanOrEqual(Math.ceil(0.25 * both.length));
  });

  // From 2026-10-17 (brief 11, section 8: "Ensure tests detect when restraint's own relevant abilities cease to matter").
  // The specialist against itself with one of restraint's abilities, or all three, at the even actor's 50 and nothing else
  // changed (the three together are a budget of 515: an ablation, not a fair-budget comparison). Measured on acting11
  // (`ST6R.sorting`, docs/verification/completion-2026-10-16/acting/measured/st6.json): the three together cost the
  // restrained take 3.33 to 8.15 on all 96, each alone 0.53 or more; by more than they cost the expansive take on 91
  // (emotional depth), 94 (composure) and 96 (focus) of 96. Where not, restraint suits the scene most (Hedda's second act,
  // Riders to the Sea, Trifles): the grain eases the restrained take, and an easier take asks less of every ability.
  it('restraint’s own abilities decide it: with emotional depth, composure or focus at the even actor’s, or all three, and nothing else changed, the specialist’s restrained take falls on every material, by more than its expansive take on nine in ten; against the grain, the grain costs it more, and restraint is its better choice less often', () => {
    const OWN = { emotionalDepth: 85, composure: 75, focus: 75 };
    const fill = (600 - 235) / 9;
    const less = { ...Object.fromEntries((Object.keys(OWN) as AbilityId[]).map((a) => [a, actor({ ...OWN, [a]: 50 }, fill)])), all: actor({ emotionalDepth: 50, composure: 50, focus: 50 }, fill) };
    for (const [which, p] of Object.entries(less)) {
      const fell = both.map((m) => ({ id: m.id, r: exactOf(m, RES, 'restrained') - exactOf(m, p, 'restrained'), e: exactOf(m, RES, 'expansive') - exactOf(m, p, 'expansive') }));
      for (const f of fell) expect(f.r, `${which}: ${f.id}`).toBeGreaterThan(0.05);
      expect(fell.filter((f) => f.r > f.e + 1e-9).length, which).toBeGreaterThanOrEqual(Math.ceil(0.9 * both.length));
    }
    const against = both.filter((m) => suit(m).e > suit(m).r);
    const TWIN = less.all;
    const grainCost = (m: MaterialProfile, p: Performer) => exactOf(m, p, 'restrained') - grained(0, () => exactOf(m, p, 'restrained'));
    expect(against.filter((m) => grainCost(m, RES) > grainCost(m, TWIN) + 1e-9).length).toBeGreaterThanOrEqual(Math.ceil(0.9 * against.length));
    // Restraint the better choice against the grain, the actor's own restrained take ahead of its own expansive one:
    // 10 of 44 for the specialist, 2 for its twin, none for the even actor.
    const better = (p: Performer) => against.filter((m) => exactOf(m, p, 'restrained') - exactOf(m, p, 'expansive') > 0.05).length;
    expect(better(RES)).toBeGreaterThan(better(TWIN));
    expect(better(TWIN)).toBeGreaterThanOrEqual(better(EVEN));
  });

  // From 2026-10-17 (brief 11): what the scene's grain does to a restrained take against it. ST6-R (a) asks the restrained
  // specialist ahead of the even actor's expansive take on a quarter of these materials; measured on acting11, it's 11 of
  // 44 with the grain at nothing, 5 at 0.1, 4 at 0.2 and 2 at the grain's 0.3, falling on all 44 (`ST6R.sorting.grain`).
  it('circumstances decide where it works: the scene’s grain only takes from a restrained take against it, so as the grain strengthens from nothing to its own the specialist’s restrained take falls against the even actor’s expansive one on every material, and wins on fewer', () => {
    const against = both.filter((m) => suit(m).e > suit(m).r);
    const steps = [0, 1 / 3, 2 / 3, 1].map((k) => grained(k * GRAIN.strength, () => against.map((m) => exactOf(m, RES, 'restrained') - exactOf(m, EVEN, 'expansive'))));
    against.forEach((m, i) => steps.forEach((xs, k) => { if (k) expect(xs[i]!, `${m.id} at ${k}/3 of the grain`).toBeLessThanOrEqual(steps[k - 1]![i]! + 1e-12); }));
    const wins = (xs: number[]) => xs.filter((x) => x > 0.05).length;
    expect(wins(steps[3]!)).toBeLessThan(wins(steps[0]!));
    expect(wins(steps[3]!)).toBeGreaterThan(0);
  });
});

describe('H4-R: every ability’s contribution on its own work (brief 10)', () => {
  const EVEN = actor({}, 50);
  const specialist = (a: AbilityId) => actor({ [a]: 85 }, (600 - 85) / 11);
  const bump = (a: AbilityId) => actor({ [a]: 60 }, 50);

  it('each specialist is on the even actor’s budget, and its own work (the pieces where its ability’s +10 effect is the largest of the twelve) is five pieces or more in two kinds or more, where all twelve are ahead on at least 60% by a median of 0.3 or more', () => {
    for (const a of ABILITIES) expect(budget(specialist(a)), a).toBeCloseTo(600, 9);
    const even = ALL_PIECES.map((pc) => pc.judge(EVEN).exact!);
    const eff = Object.fromEntries(ABILITIES.map((a) => [a, ALL_PIECES.map((pc, i) => pc.judge(bump(a)).exact! - even[i]!)]));
    // All twelve from the judge area's second phase (later on 2026-10-16): until then stamina owned one piece, a scene,
    // and memory's and composure's were briefs alone, and this read the other eleven's count without their kinds.
    for (const a of ABILITIES) {
      const own = ALL_PIECES.map((_, i) => i).filter((i) => eff[a]![i]! >= 0.05 && ABILITIES.every((b) => b === a || eff[b]![i]! < eff[a]![i]!));
      const adv = own.map((i) => ALL_PIECES[i]!.judge(specialist(a)).exact! - even[i]!).sort((x, y) => x - y);
      expect(own.length, a).toBeGreaterThanOrEqual(5);
      expect(new Set(own.map((i) => ALL_PIECES[i]!.kind)).size, a).toBeGreaterThanOrEqual(2);
      expect(adv.filter((x) => x > 0.05).length / adv.length, a).toBeGreaterThanOrEqual(0.6);
      const med = adv.length % 2 ? adv[(adv.length - 1) / 2]! : (adv[adv.length / 2 - 1]! + adv[adv.length / 2]!) / 2;
      expect(med, a).toBeGreaterThanOrEqual(0.3);
    }
  });

  it('the two public meetings are presence’s own work: its +10 effect the largest of the twelve on each, played to the meeting with the partner barely there, and its specialist ahead of the even actor', () => {
    for (const id of ['enemy-4', 'strife-2-2']) {
      const pc = ALL_PIECES.find((x) => x.kind === 'scene' && x.id === id)!;
      const even = pc.judge(EVEN).exact!;
      const eff = Object.fromEntries(ABILITIES.map((a) => [a, pc.judge(bump(a)).exact! - even]));
      expect(ABILITIES.filter((a) => a !== 'presence').every((a) => eff[a]! < eff.presence!), id).toBe(true);
      expect(pc.judge(specialist('presence')).exact! - even, id).toBeGreaterThan(0.05);
      expect(byId(id)).toMatchObject({ partner: 1, circumstances: expect.objectContaining({ address: 3 }) });
    }
  });

  it('a student meets them in play: Scene Study in Acting I sets Strife’s meeting, a play from 1909, once the prose scenes before it are studied, and Acting III’s sets the Enemy’s, from 1882, which Acting I’s never does', () => {
    const studied = (t: string, course: string, ids: readonly string[]): Worked[] => ids.map((id, i) => ({ id: `w${i}`, course, template: t, setOn: `2026-09-${String(1 + (i % 28)).padStart(2, '0')}`, sceneId: id, answers: {}, status: 'shown' }));
    const study = templateById('scene-study')!;
    const NEW = ['enemy-4', 'strife-2-2'];
    for (const [course, id] of [['DRAM 103a/b', 'strife-2-2'], ['DRAM 303a', 'enemy-4']] as const) {
      const fresh = scenesFor(study, course, [], 3);
      expect(NEW).not.toContain(fresh[0]!.id);
      const earlier = fresh.filter((x) => !NEW.includes(x.id)).map((x) => x.id);
      expect(scenesFor(study, course, studied(study.id, course, earlier), 3)[0]!.id, course).toBe(id);
    }
    expect(scenesFor(study, 'DRAM 103a/b', [], 3).map((x) => x.id)).not.toContain('enemy-4');
    expect(SCENES.slice(-2).map((x) => x.id)).toEqual(NEW);
  });

  it('no strength erases an unrelated weakness: where an ability carries under a tenth of what a piece’s abilities move, its specialist is never ahead of the even actor', () => {
    let pairs = 0;
    ALL_PIECES.forEach((pc, i) => {
      if (i % 3) return;
      const even = pc.judge(EVEN).exact!;
      const eff = Object.fromEntries(ABILITIES.map((a) => [a, Math.max(0, pc.judge(bump(a)).exact! - even)]));
      const total = ABILITIES.reduce((t, a) => t + eff[a]!, 0);
      for (const a of ABILITIES) if (total > 0 && eff[a]! / total < 0.1) { pairs += 1; expect(pc.judge(specialist(a)).exact! - even, `${pc.kind}:${pc.id} ${a}`).toBeLessThanOrEqual(0.05); }
    });
    expect(pairs).toBeGreaterThan(1500);
  });

  it('PLAYER JOURNEY: what an ability does outside the piece shows in twin lives through the commands: nerves before a performance add less stress with more composure, by the rule, and an hour of practice grows more with more discipline', () => {
    const twin = (seed: string, set: (sim: Simulation) => void, play: (sim: Simulation) => number) => { const sim = createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' }); set(sim); return { sim, x: play(sim) }; };
    const night = (composure: number) => twin('dj-nerves', (sim) => {
      const p = sim.player;
      // TEST SETUP: a casting and its night, played through the clock, as tests/attributes.test.ts plays one.
      p.school!.casting = { production: 'A Test Play', role: 'A Part In A New Play', kind: 'carlotta', term: 0, performed: 0 };
      p.awakeSince = sim.now - 60_000;
      p.wellbeing.stress = 0;
      attributesOf(sim, p).composure = composure;
    }, (sim) => { sim.schedule({ at: sim.now + 60_000, kind: 'school.call', label: 'A Test Play: Performance', category: 'school', priority: 32, requiresPlayer: true, durationMinutes: 150, payload: { personId: sim.player.id, call: 'performance' } }); sim.advanceTo(sim.now + 2 * 60_000); return sim.player.wellbeing.stress; });
    const low = night(20), high = night(80);
    // The stress nerves add is the event's weight, a performance's 6 (`ATTRIBUTES.eventWeight`), by how little composure
    // there is and how hard the person takes pressure: 6 × (0.8 − 0.2) × the person's own stress gain.
    expect(ATTRIBUTES.eventWeight.performance).toBe(6);
    expect(low.x - high.x).toBeCloseTo(6 * (0.8 - 0.2) * personalityOf(low.sim.player, 'stressGain'), 6);
    const practice = (discipline: number) => twin('dj-practice', (sim) => { attributesOf(sim, sim.player).discipline = discipline; }, (sim) => { const r = sim.execute<{ gained: number }>({ kind: 'practice.exercise', payload: { exercise: 'sense-memory' } }); expect(r.ok, r.error).toBe(true); return r.value!.gained; });
    // Discipline lifts every growth a tenth either side of 50 at its ends (`DEVELOPMENT.disciplineLift`): at 80 by
    // 0.1 × 30 / 50, at 20 by the same less.
    expect(DEVELOPMENT.disciplineLift).toBe(0.1);
    expect(practice(80).x / practice(20).x).toBeCloseTo((1 + 0.1 * 0.6) / (1 - 0.1 * 0.6), 6);
  });
});

describe('The judge area’s second phase: stamina’s, memory’s and composure’s second kind of work (brief 10)', () => {
  const PERF = TASK_PROFILES.performance!;
  const play = (title: string) => PLAY_MATERIAL.find((m) => m.id === title)!;
  const weightOf = (read: { inputs: Partial<Record<Dimension, readonly { ability: AbilityId; weight: number }[]>> }, d: Dimension, a: AbilityId) => read.inputs[d]?.find((x) => x.ability === a)?.weight ?? 0;

  it('the full drain is 0.4, and a night reaches it at 4/3 of the anchor’s work: the anchor’s lead still drains 0.3 at its curtain, and the heaviest lead the catalog holds more than that', () => {
    expect(PIECE.drain).toBe(0.4);
    // FIXTURE: the anchor's evening, 150 minutes with a 20-minute interval at its middle, a lead, four levels of the body
    // and the voice. Its work at the curtain: half of it, a quarter given back at the interval, then the other half.
    const W = (130 / 60) * 0.75 * (1 + 4 * (2 / 9));
    const anchor = nightLoad({ minutes: 150, breaks: [20], basis: 'estimate', from: 'FIXTURE' }, { physical: 2, vocal: 2 }, 'lead');
    expect(anchor.workload).toBeCloseTo(W, 12);
    const FULL = W * (1 - 0.25 / 2) * (4 / 3);
    // At no stamina on a good day: 0.4 × (0.875 W ÷ (0.875 W × 4/3)), 0.3, what the anchor drained when the full drain was
    // 0.3 at its own work.
    expect(eveningCost(anchor, 0, 100).drainEnd).toBeCloseTo(0.4 * 0.75, 12);
    expect(eveningCost(anchor, 0, 100).drainEnd).toBeCloseTo(0.3, 12);
    // Julius Caesar's lead, past the anchor: 135 minutes of playing, a 15-minute interval giving back 0.25 × 15/20 of the
    // first half, so 0.4 × (1 − 0.09375) × its workload ÷ FULL, where until then it held at 0.3.
    const jc = play('Julius Caesar');
    const Wjc = (135 / 60) * 0.75 * (1 + (jc.physical + jc.vocal) * (2 / 9));
    const n = nightLoad(RUNNING_TIMES['Julius Caesar']!, jc, 'lead');
    expect(n.workload).toBeCloseTo(Wjc, 12);
    expect(eveningCost(n, 0, 100).drainEnd).toBeCloseTo(0.4 * ((1 - 0.25 * (15 / 20) / 2) * Wjc) / FULL, 12);
    expect(eveningCost(n, 0, 100).drainEnd).toBeGreaterThan(0.3);
  });

  it('a night reads memory by its part’s time on stage: half a unit of text for each hour past the first, so a lead in Major Barbara holds more than a supporting part, and a featured part or a one-act’s lead none', () => {
    const mb = play('Major Barbara');
    // 195 minutes with a 20-minute interval: 175 of playing. A lead on for 0.75 of it, 2.1875 hours: (2.1875 − 1) × 0.5.
    const units = { lead: (175 * 0.75 / 60 - 1) * 0.5, supporting: (175 * 0.5 / 60 - 1) * 0.5, featured: 0 };
    expect(units.lead).toBeCloseTo(0.59375, 12);
    const at = (size: 'lead' | 'supporting' | 'featured') => nightLoad(RUNNING_TIMES['Major Barbara']!, mb, size);
    for (const size of ['lead', 'supporting', 'featured'] as const) {
      expect(partText(at(size)), size).toBeCloseTo(units[size], 12);
      expect(demandsOf(withPart(mb, at(size))).text, size).toBeCloseTo(units[size], 12);
    }
    // Salomé, 75 minutes straight through: a lead is on for 56 of them, under the first hour.
    expect(partText(nightLoad(RUNNING_TIMES['Salomé']!, play('Salomé'), 'lead'))).toBe(0);
    // What it reads: memory 5 a unit on execution, execution leant by 1 + 0.7 a unit (`DEMAND_EFFECT.text`).
    const lead = materialContext(PERF, withPart(mb, at('lead'))), featured = materialContext(PERF, withPart(mb, at('featured')));
    expect(weightOf(lead, 'execution', 'memory') - weightOf(featured, 'execution', 'memory')).toBeCloseTo(5 * 0.59375, 12);
    expect(lead.lean.execution! / featured.lean.execution!).toBeCloseTo(1 + 0.7 * 0.59375, 12);
    // So +10 memory moves the lead's night more than the featured part's, the workload, difficulty and day held.
    const EVEN = actor({}, 50), MORE = actor({ memory: 60 }, 50);
    const night = (size: 'lead' | 'featured', p: Performer) => {
      const spec = nightPiece(mb, RUNNING_TIMES['Major Barbara']!, size);
      const read = materialContext(PERF, withPart(mb, spec.night!));
      return judgePiece('dj-text', p, { task: PERF, techniques: { scene: 1, ...(mb.techniques ?? {}) }, prep: { lines: 1, blocking: 1, notes: 1 }, required: { lines: 0.9, blocking: 0.9, notes: 0.9 }, difficulty: 0, condition: { readiness: 100 }, lean: read.lean, inputs: read.inputs, key: 'dj-text', expected: true }, spec).exact!;
    };
    expect(night('lead', MORE) - night('lead', EVEN)).toBeGreaterThan(night('featured', MORE) - night('featured', EVEN) + 0.05);
  });

  it('a night before a house rides on 1.5 where a class scene rides on 1, from performance-anxiety research, and reads composure half a step more', () => {
    const m = play('Hedda Gabler');
    const featured = nightLoad(RUNNING_TIMES['Hedda Gabler']!, m, 'featured');
    expect(demandsOf(m).stakes).toBe(1);
    expect(demandsOf(withPart(m, featured)).stakes).toBe(1.5);
    // A featured part holds no text past its first hour (140 × 0.2 = 28 minutes), so only the stakes differ: composure 1.5
    // a step on consistency and 0.4 on believability, consistency leant by 1 + 0.6 a step (`DEMAND_EFFECT.stakes`).
    expect(partText(featured)).toBe(0);
    const night = materialContext(PERF, withPart(m, featured)), inClass = materialContext(PERF, m);
    expect(weightOf(night, 'consistency', 'composure') - weightOf(inClass, 'consistency', 'composure')).toBeCloseTo(1.5 * 0.5, 12);
    expect(weightOf(night, 'believability', 'composure') - weightOf(inClass, 'believability', 'composure')).toBeCloseTo(0.4 * 0.5, 12);
    expect(night.lean.consistency! / inClass.lean.consistency!).toBeCloseTo((1 + 0.6 * 1.5) / (1 + 0.6 * 1), 12);
  });

  it('PLAYER JOURNEY: twins at the first Carlotta’s first curtain, a lead and a featured part in Major Barbara, each night’s record reading the text its part holds and the same stakes', () => {
    const zone = 'America/New_York';
    const sim = createSave(1, 'dj-part-text', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    sim.advanceTo(instantFromZoned({ year: 2027, month: 1, day: 4, hour: 9 }, zone) + 60_000);
    const curtain = sim.universe.scheduled.filter((i) => i.kind === CALL_KIND && i.payload.which !== 'rep' && i.payload.call === 'performance' && i.payload.personId === sim.player.id).sort((a, b) => a.at - b.at)[0]!;
    // TEST SETUP: the day's dials a life keeps by its own commands, as the journeys play them, to an hour before it.
    while (sim.now < curtain.at - MS_HOUR) {
      Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 });
      sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
      sim.advanceTo(Math.min(curtain.at - MS_HOUR, sim.now + 6 * MS_HOUR));
    }
    const twin = loadSave(structuredClone(sim.universe));
    // TEST SETUP: the play set where the festival's new play is unnamed, and the part's size in each twin.
    Object.assign(sim.player.school!.casting!, { play: 'Major Barbara', size: 'lead' });
    Object.assign(twin.player.school!.casting!, { play: 'Major Barbara', size: 'featured' });
    for (const x of [sim, twin]) x.advanceTo(curtain.at + 1);
    const [lead, featured] = [sim, twin].map((x) => x.player.work!.at(-1)!);
    expect([lead!.task, featured!.task]).toEqual(['performance', 'performance']);
    expect([lead!.inputs.piece!.night!.share, featured!.inputs.piece!.night!.share]).toEqual([0.75, 0.2]);
    const read = (w: WorkRecord) => ({ inputs: w.inputs.inputs ?? {} });
    expect(weightOf(read(lead!), 'execution', 'memory') - weightOf(read(featured!), 'execution', 'memory')).toBeCloseTo(5 * 0.59375, 9);
    expect(lead!.inputs.lean!.execution! / featured!.inputs.lean!.execution!).toBeCloseTo(1 + 0.7 * 0.59375, 9);
    expect(weightOf(read(lead!), 'consistency', 'composure')).toBeCloseTo(weightOf(read(featured!), 'consistency', 'composure'), 12);
  });
});

describe('L3-R: real progress, controlled (brief 10)', () => {
  const levels = (sim: Simulation): Performer => {
    const ab = Object.fromEntries(ABILITIES.map((a) => [a, abilityOf(sim, sim.player, a)]));
    const fu = Object.fromEntries(ABILITIES.map((a) => [a, abilityFull(sim, sim.player, a)]));
    const te = { ...(sim.player.craft ?? {}) } as Record<string, number>;
    return { ability: (id) => ab[id]!, full: (id) => fu[id]!, technique: (k) => te[k] ?? 0 };
  };
  /** TEST SETUP: the journeys' specialist (the feeling abilities at 90, the rest at 49) and generalist (those eleven at their mean). */
  const profile = (sim: Simulation, which: 'specialist' | 'generalist') => {
    const p = sim.player;
    const hi = which === 'specialist' ? 90 : 703 / 11, lo = which === 'specialist' ? 49 : 703 / 11;
    p.craft!.emotion = hi; p.craft!.memorization = lo; p.craft!.voice = lo; p.craft!.movement = lo;
    p.attrs = { ...(p.attrs ?? {}), composure: hi, imagination: hi, presence: hi, listening: lo, focus: lo, adaptability: lo, discipline: lo } as typeof p.attrs;
  };

  // The month each profile is played through, once, kept for the tests below (from 2026-10-17, when the own takes' test
  // came to read it too): its levels at the start and the end, and the work it taped.
  type Month = { start: Performer; now: Performer; work: WorkRecord[] };
  const months = new Map<'specialist' | 'generalist', Month>();
  const month = (which: 'specialist' | 'generalist'): Month => {
    const kept = months.get(which);
    if (kept) return kept;
    const sim = policyLife(`dj-l3-${which}`, { homeRegionId: 'us-ny-newyork' });
    profile(sim, which);
    const start = levels(sim);
    const end = sim.now + 30 * MS_DAY;
    while (sim.now < end && sim.universe.meta.endedAt === undefined) attentiveHour(sim);
    const played = { start, now: levels(sim), work: structuredClone(sim.player.work ?? []) };
    months.set(which, played);
    return played;
  };
  /** A fall from `before` to `at(now)` put down to the abilities it reads that fell: only stamina, and gone with it held. */
  const onlyStaminaFell = (where: string, at: (p: Performer) => Evaluation, start: Performer, now: Performer, before: number) => {
    const fell = (Object.keys(at(now).inputs.abilities) as AbilityId[]).filter((a) => now.ability(a) / now.full(a) < start.ability(a) / start.full(a) - 1e-12);
    expect(fell, where).toEqual(['stamina']);
    const held: Performer = { ...now, ability: (a) => (a === 'stamina' ? start.ability(a) : now.ability(a)), full: (a) => (a === 'stamina' ? start.full(a) : now.full(a)) };
    expect(at(held).exact!, where).toBeGreaterThanOrEqual(before - 1e-9);
  };

  it('PLAYER JOURNEY: a specialist and a generalist, each played through a month of the first term, judge L3-R’s fixed set higher at the month’s end than at its start, and no piece falls but where stamina, which they never trained, fell', () => {
    for (const which of ['specialist', 'generalist'] as const) {
      const { start, now } = month(which);
      const pieces = fixedPieces();
      expect(pieces).toHaveLength(24);
      const before = pieces.map((pc) => pc.judge(start).exact!), after = pieces.map((pc) => pc.judge(now).exact!);
      expect(after.reduce((t, x) => t + x, 0) / 24, which).toBeGreaterThan(before.reduce((t, x) => t + x, 0) / 24);
      pieces.forEach((pc, i) => {
        if (after[i]! >= before[i]! - 1e-9) return;
        // A fall: the abilities it reads that fell, held at the start's level, and it falls no more.
        onlyStaminaFell(`${which} ${pc.kind}:${pc.id}`, (p) => pc.judge(p), start, now, before[i]!);
      });
    }
  });

  // From 2026-10-17 (brief 11, L3-R (a), which brief 10 held by measurement alone): the fixed set as the judge area's
  // checklist named it before anything was measured, and judged as (a) asks, controlled.
  it('L3-R (a), a fixed set, controlled: the 24 named before measurement, eight briefs at their first reading in eight registers, eight class scenes, four nights and four casting reads, each judged fully prepared, with no way chosen, on a sufficient day and with no draw', () => {
    expect(FIXED_SET.map((x) => `${x.kind}:${x.id}`)).toEqual([
      ...['brief-art_house', 'brief-comedy', 'brief-drama', 'brief-musical', 'brief-horror', 'brief-legal_drama', 'brief-thriller', 'brief-social_realism'].map((id) => `brief:${id}`),
      ...['seagull-4', 'earnest-2', 'hamlet-3-1', 'antigone-441', 'dream-3-2', 'scapin-3-2', 'henry5-4-3', 'orig-office-hours'].map((id) => `scene:${id}`),
      ...['The Bear', 'Three Sisters', 'Macbeth', 'Hedda Gabler'].map((id) => `night:${id}`),
      ...['Twelfth Night', 'Julius Caesar', 'Trifles', 'Tartuffe'].map((id) => `casting:${id}`),
    ]);
    const pieces = fixedPieces();
    const briefs = FIXED_SET.filter((x) => x.kind === 'brief').map((x) => BRIEF_BY_ID[x.id]!);
    expect(pieces.filter((pc) => pc.kind === 'brief').map((pc) => pc.id)).toEqual(briefs.map((b) => `${b.id}/${b.readings[0]!.id}`));
    expect(new Set(briefs.map((b) => b.kinds[0])).size).toBe(8);
    const p = actor({}, 50);
    let drawn = 0;
    for (const pc of pieces) {
      const e = pc.judge(p);
      const where = `${pc.kind}:${pc.id}`;
      for (const [part, at] of Object.entries(e.inputs.prep)) expect(at, `${where} ${part}`).toBeGreaterThanOrEqual(e.inputs.required[part] ?? 1);
      expect(e.inputs.prep.approach, where).toBeUndefined();
      expect(e.inputs.fit, where).toBeUndefined();
      expect(e.inputs.condition.readiness, where).toBe(100);
      // The day's own: no preparation short, no fit, and no condition but the piece's own tiring (`what: 'stamina'`, the drain).
      expect(e.dimensions.flatMap((d) => d.limits).filter((l) => l.kind === 'preparation' || l.kind === 'fit' || (l.kind === 'condition' && l.what !== 'stamina')), where).toEqual([]);
      // No draw: the judgment is the one its own record replays at the levels it was judged at with the draw left out (a
      // casting read judges the actor as casting reads them, `castingPerformer`), where a keyed one isn't, somewhere.
      const replayed = (x: Evaluation) => replayAs({ inputs: x.inputs, task: x.task, ruleset: x.ruleset }, TASK_PROFILES[x.task]!, frozenPerformer(x.inputs))!.exact!;
      expect(replayed(e), where).toBe(e.exact);
      const keyed = pc.judge(p, { key: `dj-l3-drawn:${where}` });
      if (Math.abs(keyed.exact! - replayed(keyed)) > 1e-9) drawn += 1;
    }
    expect(drawn).toBeGreaterThan(0);
  });

  it('PLAYER JOURNEY: L3-R (a), beside the fixed set: each journey’s own work, replayed as it was taped at the month’s start and at its end, is no lower at the end but where stamina, which they never trained, fell', () => {
    for (const which of ['specialist', 'generalist'] as const) {
      const { start, now, work } = month(which);
      expect(work.length, which).toBeGreaterThanOrEqual(5);
      // Stamina, untrained, detrains through the month; held at the start's level, what's left is the rest's growth.
      const held: Performer = { ...now, ability: (a) => (a === 'stamina' ? start.ability(a) : now.ability(a)), full: (a) => (a === 'stamina' ? start.full(a) : now.full(a)) };
      let rise = 0;
      for (const w of work) {
        const at = (p: Performer) => replayAs(w, TASK_PROFILES[w.task]!, p)!;
        const before = at(start).exact!, after = at(now).exact!;
        rise += at(held).exact! - before;
        if (after >= before - 1e-9) continue;
        onlyStaminaFell(`${which} ${w.task}: ${w.what}`, at, start, now, before);
      }
      // And the end's over the start's, as L3′ asks, with the fall L3-R (c) puts down to stamina held out: the mean rises.
      // Measured: the generalist's own work, movement and voice among it, fell 0.10 on the mean with stamina as it was.
      expect(rise / work.length, which).toBeGreaterThan(0);
    }
  });

  // From 2026-10-17 (brief 11, L3-R (e), which brief 10 held by measurement alone): the report the journeys' tool writes,
  // on two months of a journey it plays through the commands, read by `tools/l3r.mjs` as the coordinator's run reads eight.
  it('PLAYER JOURNEY: L3-R (e), the journey kept in view: two months played by the journeys’ tool, and its report gives each month’s takes, their purposes, their difficulty’s mean and range, their stakes and genres, with L3 as written beside the controlled measure', () => {
    const dir = mkdtempSync(join(tmpdir(), 'dj-l3r-'));
    try {
      const run = spawnSync(process.execPath, [resolve('node_modules/vite-node/vite-node.mjs'), 'tools/brief-journeys.ts', '--', '--profile', 'beginner', '--seed', 'bj-0', '--days', '62', '--trace', join(dir, 'l3-trace-beginner-bj-0.json')], { encoding: 'utf8' });
      expect(run.status, run.stderr).toBe(0);
      const read = spawnSync(process.execPath, [resolve('tools/l3r.mjs'), dir], { encoding: 'utf8' });
      expect(read.status, read.stderr).toBe(0);
      const trace = JSON.parse(readFileSync(join(dir, 'l3-trace-beginner-bj-0.json'), 'utf8')) as { takes: { month: number; purpose: string; difficulty: number; stakes: number }[] };
      const report = JSON.parse(readFileSync(join(dir, 'l3r.json'), 'utf8'));
      expect(report.verdict.e.met).toBe(true);
      const j = report.journeys[0];
      const months = Object.entries(j.mix) as [string, { takes: number; purposes: Record<string, number>; difficulty: { mean: number; min: number; max: number }; stakes: Record<string, number>; genres: string[] }][];
      expect(months.length).toBeGreaterThanOrEqual(2);
      expect(months.reduce((t, [, x]) => t + x.takes, 0)).toBe(trace.takes.length);
      for (const [m, x] of months) {
        const own = trace.takes.filter((t) => `m${t.month}` === m);
        expect(x.takes, m).toBe(own.length);
        expect(Object.values(x.purposes).reduce((t, n) => t + n, 0), m).toBe(x.takes);
        expect(Object.values(x.stakes).reduce((t, n) => t + n, 0), m).toBe(x.takes);
        expect([x.difficulty.min, x.difficulty.max], m).toEqual([Math.min(...own.map((t) => t.difficulty)), Math.max(...own.map((t) => t.difficulty))]);
        expect(x.difficulty.mean, m).toBeGreaterThanOrEqual(x.difficulty.min);
        expect(x.difficulty.mean, m).toBeLessThanOrEqual(x.difficulty.max);
        expect(x.genres.length, m).toBeGreaterThan(0);
      }
      // L3 as written, the first and last months' mean take, beside the fixed set's mean at each point and its growth.
      expect(j.journeyMetric.firstMonth.mean).toBeTypeOf('number');
      expect(j.journeyMetric.lastMonth.mean).toBeTypeOf('number');
      expect(['meets', 'fails']).toContain(j.journeyMetric.l3AsWritten);
      expect(j.fixedSetMean.map((x: { at: string }) => x.at)).toEqual(['start', 'm1', 'm2', 'end']);
      expect(j.growth).toBeCloseTo(j.fixedSetMean.at(-1).mean - j.fixedSetMean[0].mean, 2);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('more never makes it worse: raising any one ability, by ten or to full, never lowers a result, on every fourth piece for the even actor, a specialist, a beginner and a near-master', () => {
    const actors = [actor({}, 50), actor({ emotionalDepth: 85 }, 515 / 11), actor({}, 35, 30), actor({}, 92, 85)];
    let checks = 0;
    ALL_PIECES.forEach((pc, i) => {
      if (i % 4) return;
      for (const p of actors) {
        const base = pc.judge(p).exact!;
        for (const a of ABILITIES) for (const to of [Math.min(100, p.ability(a) + 10), 100]) {
          const q: Performer = { ...p, ability: (id) => (id === a ? to : p.ability(id)) };
          expect(pc.judge(q).exact! - base, `${pc.kind}:${pc.id} ${a} → ${to}`).toBeGreaterThanOrEqual(-1e-9);
          checks += 1;
        }
      }
    });
    expect(checks).toBeGreaterThan(19_000);
  });
});

describe('M1: mastery at 100 (brief 10)', () => {
  const MASTER: Performer = { ability: () => 100, full: () => 100, technique: () => MASTERED };
  it('every judged piece and reading comes to 100 for a mastered actor, prepared, on a sufficient day, with no draw and with a draw; and every class scene and play on every way of playing that fits', () => {
    for (const pc of ALL_PIECES) for (const key of [undefined, 'dj-m1']) expect(pc.judge(MASTER, key ? { key } : {}).overall, `${pc.kind}:${pc.id} ${key ?? ''}`).toBe(100);
    let ways = 0;
    for (const m of MATS) for (const pace of [undefined, ...AXES.pace.values]) for (const scale of [undefined, ...AXES.scale.values]) for (const structure of [undefined, ...AXES.structure.values]) {
      const sides = { ...(pace ? { pace } : {}), ...(scale ? { scale } : {}), ...(structure ? { structure } : {}) } as Omit<Playing, 'chosenAt' | 'prep'>;
      if ((Object.entries(sides) as [Axis, AxisValue][]).some(([a, v]) => misfitOf(a, v, m))) continue;
      const task = TASK_PROFILES.scene!;
      const read = materialContext(task, m, Object.keys(sides).length ? { ...sides, chosenAt: 0, prep: 1 } : undefined);
      const prep = { familiarity: 1, memorization: 1, interpretation: 1, rehearsal: 1, partner: 1, approach: 1 };
      const e = judgePiece('decisions-judge', MASTER, { task, techniques: { scene: 1, ...(m.techniques ?? {}) }, prep, required: Object.fromEntries(Object.keys(prep).map((k) => [k, 0.9])), difficulty: difficultyOf(templateById('scene-study')!), condition: { readiness: 100 }, lean: read.lean, inputs: read.inputs, extraPrep: read.prep, fit: read.fit, grain: read.grain, key: `dj-ways:${m.id}` }, { segments: unitSegments(m, 2), work: [], part: 'rehearsal', perTurn: PIECE.scene.perTurn, perBlend: 0, most: PIECE.scene.most, load: loadOf(m, 'scene') });
      expect(e.overall, `${m.id} ${JSON.stringify(sides)}`).toBe(100);
      ways += 1;
    }
    expect(ways).toBeGreaterThanOrEqual(2520);
  });
});
