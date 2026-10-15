/**
 * The stage and a way of playing (from 2026-10-16, the owner's brief "Finish Genre Acceptance And Correct The
 * Stage-Interpretation Bias"; docs/verification/stage-2026-10-16/). A house asks the voice and the body to reach it,
 * which is projection, read on the take's execution, and pulls no scale. A scene's circumstances say what its scale
 * asks: what it hides and how private it is argue for restraint, speaking to many and conflict out loud for size. Until
 * then expansive was the better side on every one of the 85 class scenes and plays. The expectations come from the
 * scenes' own texts (`content/material.ts`, `why`), not from the formula; what's set by hand is TEST SETUP and named.
 */
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MaterialDemands } from '@/ui/components/PlayingChooser';
import { CIRCUMSTANCE_AFFINITY } from '@/engine/content/interpretation';
import { createSave, loadSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { MASTERED } from '@/engine/content/abilities';
import { GRAIN } from '@/engine/content/interpretation';
import { PLAY_MATERIAL, SCENE_MATERIAL, type MaterialProfile } from '@/engine/content/material';
import { RULESET, TASK_PROFILES } from '@/engine/content/tasks';
import { templateById } from '@/engine/content/coursework';
import { courseworkOf, difficultyOf, playingPreview } from '@/engine/systems/coursework';
import { materialContext, misfitOf } from '@/engine/systems/material';
import { sceneOfMaterial, suitabilityOf } from '@/engine/systems/interpretation';
import { replay, type EvalContext, type Performer } from '@/engine/systems/evaluation';
import { judgePiece, loadOf, toneSegments } from '@/engine/systems/piece';
import { PIECE } from '@/engine/content/piece';

const ALL = [...SCENE_MATERIAL, ...PLAY_MATERIAL];
const byId = (id: string) => ALL.find((m) => m.id === id)!;
const scale = (m: MaterialProfile) => { const sc = sceneOfMaterial(m); const r = suitabilityOf('restrained', m, sc), e = suitabilityOf('expansive', m, sc); return { r, e, better: r.s > e.s ? 'restrained' : e.s > r.s ? 'expansive' : 'neither' }; };
const task = TASK_PROFILES.scene!;
const difficulty = difficultyOf(templateById('scene-study')!);
// The class scene judged as the measurement does it (tools/interpretation.ts, `--stage`): every part complete, rested.
function judge(m: MaterialProfile, p: Performer, side?: 'restrained' | 'expansive'): number { return judgeEval(m, p, side).overall; }
function judgeEval(m: MaterialProfile, p: Performer, side?: 'restrained' | 'expansive', expected = true) {
  const read = materialContext(task, m, side ? { scale: side, chosenAt: 0, prep: 1 } : undefined);
  const prep = { familiarity: 1, memorization: 1, interpretation: 1, rehearsal: 1, partner: 1, ...(side ? { approach: 1 } : {}) };
  const ctx: EvalContext = { task, techniques: { scene: 1, ...(m.techniques ?? {}) }, prep, required: Object.fromEntries(Object.keys(prep).map((k) => [k, 0.9])), difficulty, condition: { readiness: 100 }, lean: read.lean, inputs: read.inputs, extraPrep: read.prep, fit: read.fit, grain: read.grain, key: `stage-test:${m.id}`, expected };
  return judgePiece('stage-test', p, ctx, { segments: toneSegments(m.tones, 2), work: [], part: 'rehearsal', perTurn: PIECE.scene.perTurn, perBlend: 0, most: PIECE.scene.most, load: loadOf(m, 'scene') });
}
const actor = (ab: Partial<Record<string, number>>, fill: number): Performer => ({ ability: (id) => ab[id] ?? fill, full: () => 100, technique: () => 50 });
const EVEN = actor({}, 55);
const MASTER: Performer = { ability: () => 100, full: () => 100, technique: () => MASTERED };

describe('the stage reads the scene, not the house', () => {
  it('the house pulls no scale: the same bare scene, on stage, suits neither side; at a close frame restraint', () => {
    // TEST SETUP: a scene with nothing in it that leans: no features, everyday prose, a grave tone, no circumstances.
    const bare: MaterialProfile = { id: 'bare', title: 'Bare', medium: 'stage', language: 'everyday', timing: 0, physical: 0, partner: 1, vocal: 0, improvisation: 0, tones: ['grave'], turns: 0, why: {} };
    const onStage = scale(bare);
    expect(onStage.r.s).toBe(onStage.e.s);
    expect(onStage.e.signals.map((x) => x.source)).not.toContain('A House To Reach');
    const onCamera = scale({ ...bare, medium: 'camera' });
    expect(onCamera.better).toBe('restrained');
  });

  it('projection is a demand on the voice and the body: a voice-and-body specialist does better on stage than at a close frame, the grain left out', () => {
    const m = byId('hedda-2');
    const VOICE_BODY = actor({ vocal: 85, physical: 85 }, 43);
    // No way of playing chosen, so suitability, which differs by medium, isn't what's compared.
    expect(judge(m, VOICE_BODY)).toBeGreaterThan(judge({ ...m, medium: 'camera' }, VOICE_BODY));
    // The house weighs the take's execution, the voice and the body, as a microphone does, and more than a close frame,
    // which weighs believability instead: the same bare scene in each medium.
    const lean = (medium: MaterialProfile['medium']) => materialContext(task, { ...m, medium, circumstances: {}, vocal: 0, physical: 0, timing: 0 }).lean!;
    expect(lean('stage').execution).toBe(lean('voice').execution);
    expect(lean('stage').execution).toBeGreaterThan(lean('camera').execution!);
  });

  it('a sung song is the voice’s demand, not size: Othello’s willow song, two women at bedtime, suits restraint', () => {
    const s = scale(byId('othello-4-3'));
    expect(s.better).toBe('restrained');
    expect(s.r.signals.map((x) => x.source)).toContain('A Private Exchange');
    expect(s.e.signals.map((x) => x.source)).not.toContain('Its Voice Work');
  });

  it('a concealed, private scene and an open quarrel in the same play read apart: Brutus’s orchard (2.1) against his tent (4.3)', () => {
    // Portia presses a husband who hides the conspiracy, before dawn; Brutus and Cassius quarrel in short, hard exchanges.
    expect(scale(byId('caesar-2-1')).better).toBe('restrained');
    expect(scale(byId('caesar-2-1')).r.signals.map((x) => x.source)).toEqual(expect.arrayContaining(['A Private Exchange', 'What’s Kept Hidden']));
    expect(scale(byId('caesar-4-3')).better).toBe('expansive');
    expect(scale(byId('caesar-4-3')).e.signals.map((x) => x.source)).toContain('A Conflict Out Loud');
  });

  it('a private exchange against a public speech, within one genre: Macbeth and his wife outside the feast against Antigone before the palace', () => {
    expect(sceneOfMaterial(byId('macbeth-1-7')).genre).toBe(sceneOfMaterial(byId('antigone-441')).genre);
    expect(scale(byId('macbeth-1-7')).better).toBe('restrained');
    expect(scale(byId('antigone-441')).better).toBe('expansive');
    expect(scale(byId('antigone-441')).e.signals.map((x) => x.source)).toContain('Spoken To Many');
  });

  it('comedy both ways: Darlington’s warning under the compliments suits restraint, Chekhov’s shouting match over the meadows size', () => {
    expect(scale(byId('windermere-1')).better).toBe('restrained');
    expect(scale(byId('proposal')).better).toBe('expansive');
  });

  it('no universal best: an even actor does better restrained on some stage scenes and expansive on others, each a quarter or more', () => {
    let r = 0, e = 0, n = 0;
    for (const m of ALL) { if (misfitOf('scale', 'restrained', m) || misfitOf('scale', 'expansive', m)) continue; n += 1; const d = judge(m, EVEN, 'restrained') - judge(m, EVEN, 'expansive'); if (d > 0) r += 1; else if (d < 0) e += 1; }
    expect(r).toBeGreaterThanOrEqual(n / 4);
    expect(e).toBeGreaterThanOrEqual(n / 4);
  });

  it('strength carries the harder side: a presence specialist does better playing expansive in Brutus’s orchard, which suits restraint, than restrained', () => {
    const m = byId('caesar-2-1');
    expect(scale(m).better).toBe('restrained');
    const EXP = actor({ presence: 85, vocal: 75, physical: 75 }, (600 - 235) / 8);
    expect(judge(m, EXP, 'expansive')).toBeGreaterThan(judge(m, EXP, 'restrained'));
    // The even actor follows the scene there.
    expect(judge(m, EVEN, 'restrained')).toBeGreaterThan(judge(m, EVEN, 'expansive'));
  });

  it('mastery: a mastered, prepared actor reaches 100 either way on a scene that suits one, the other side fitting', () => {
    for (const id of ['caesar-2-1', 'caesar-4-3', 'othello-4-3', 'antigone-441']) {
      expect(judge(byId(id), MASTER, 'restrained')).toBe(100);
      expect(judge(byId(id), MASTER, 'expansive')).toBe(100);
    }
  });

  it('what a scene asks shows each circumstance with its level and its reason from the text, as it shows a feature', () => {
    // Found by the sweep of 2026-10-16: every reason was written, and no screen showed one.
    const m = byId('caesar-2-1');
    const html = renderToStaticMarkup(createElement(MaterialDemands, { material: m })).replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    const shown = Object.entries(m.circumstances ?? {}).filter(([, l]) => l! > 0);
    expect(shown.length).toBeGreaterThanOrEqual(2);
    for (const [c] of shown) {
      expect(html).toContain(`data-circumstance="${c}"`);
      expect(html).toContain(CIRCUMSTANCE_AFFINITY[c as keyof typeof CIRCUMSTANCE_AFFINITY].label);
      expect(html).toContain(m.why[c as keyof typeof m.why]!);
    }
  });

  it('a result kept under the rules before this change isn’t judged again by today’s', () => {
    expect(RULESET).toBe('evaluation-8 (2026-10-16)');
    // Judged as play judges it, with the day's draw, which the record's seed reproduces.
    const now = judgeEval(byId('hedda-2'), EVEN, 'restrained', false);
    expect(replay(now, task)!.overall).toBe(now.overall);
    expect(replay({ ...now, ruleset: 'evaluation-7 (2026-10-16)' }, task)).toBeUndefined();
  });
});

describe('the stage reads the scene, played', () => {
  const NY = 'America/New_York';
  it('PLAYER JOURNEY: a class scene chosen restrained and expansive, its forecast following the scene’s circumstances, the choice kept through a reload', () => {
    let sim: Simulation = createSave(1, 'stage-scene', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    // Played to the first scene study set with a stage scene that suits one side by a band or more.
    let a: ReturnType<typeof courseworkOf> extends infer C ? C extends { assignments: (infer A)[] } ? A : never : never;
    const until = instantFromZoned({ year: 2026, month: 12, day: 1, hour: 9 }, NY);
    for (;;) {
      Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 });
      sim.advanceTo(sim.now + 6 * MS_HOUR);
      const found = courseworkOf(sim, sim.player)?.assignments.find((x) => x.status === 'open' && x.sceneId && SCENE_MATERIAL.some((m) => m.id === x.sceneId) && Math.abs(scale(byId(x.sceneId)).r.s - scale(byId(x.sceneId)).e.s) >= GRAIN.band);
      if (found) { a = found; break; }
      expect(sim.now).toBeLessThan(until);
    }
    const m = byId(a.sceneId!);
    const suited = scale(m).better as 'restrained' | 'expansive';
    const other = suited === 'restrained' ? 'expansive' : 'restrained';
    const day = new Date(sim.now).toISOString().slice(0, 10);
    // The forecast the chooser shows follows the scene: the suited side gives the better take, as the scene's words say.
    const withIt = playingPreview(sim, sim.player, a, day, { scale: suited }).overall;
    const against = playingPreview(sim, sim.player, a, day, { scale: other }).overall;
    expect(withIt).toBeGreaterThan(against);
    // The choice made through the command, then the save written and read back: the choice and its forecast kept.
    const r = sim.execute({ kind: 'school.choose_playing', payload: { assignmentId: a.id, scale: other } });
    expect(r.ok, String(r.error)).toBe(true);
    sim = loadSave(deserialise(serialise(sim.universe)));
    const back = courseworkOf(sim, sim.player)!.assignments.find((x) => x.id === a.id)!;
    expect(back.playing?.scale).toBe(other);
    expect(playingPreview(sim, sim.player, back, day, { scale: other }).overall).toBe(against);
  }, 180_000);
});
