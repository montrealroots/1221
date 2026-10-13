/**
 * A partner's contribution kept apart from the player's own work (from 2026-10-12; `systems/ensemble.ts`).
 *
 * - The regression: a student at full abilities, every technique mastered and every part of their own preparation
 *   complete, partner rehearsals included, comes out at exactly 100 on a paired scene, whatever the partner has or
 *   hasn't done, slipped or read. Until then the partner's time-bound preparation was blended into the player's own
 *   partner part and held them at 94 to 98 (measured by the coursework reading of 2026-10-12).
 * - The scene together moves with the partner: their preparation, their timing, readings held apart and a slip each
 *   lower it, never the player's own; a player who listens and adapts covers part of a slip; a material not played off
 *   a partner isn't moved by one.
 * - The reading held apart is recorded by the disagreement and cleared by trying both.
 * - A night's company: how the show went together is the mood a night leaves, the player's own night unchanged.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { abilityFull, attributesOf } from '@/engine/systems/attributes';
import { courseworkOf, judgeWork, partnerReadOf, questionsFor, show, togetherOf, type Assignment } from '@/engine/systems/coursework';
import { ENSEMBLE, sharedOf, type PartnerRead } from '@/engine/systems/ensemble';
import { judge, leanedWeights, type Evaluation } from '@/engine/systems/evaluation';
import { PREP_DIMS } from '@/engine/content/coursework';
import { TASK_PROFILES } from '@/engine/content/tasks';
import { MATERIAL_BY_ID } from '@/engine/content/material';
import { BRIEFS } from '@/engine/content/briefs';
import { forecast as forecastBrief, readerRead, recordOf, takeTogether } from '@/engine/systems/briefs';

/** TEST SETUP: every ability full and every craft skill at 100, the body at its age's ceiling. */
function mastered(sim: Simulation) {
  const p = sim.player;
  for (const k of Object.keys(p.craft!)) (p.craft as Record<string, number>)[k] = 100;
  const a = attributesOf(sim, p) as unknown as Record<string, number>;
  for (const k of Object.keys(a)) a[k] = 100;
  p.wellbeing.fitness = abilityFull(sim, p, 'stamina');
}

/** TEST SETUP: a paired scene-study assignment on a scene that turns, every part of the player's own work complete. */
function pairedScene(sim: Simulation, sceneId = 'seagull-4'): Assignment {
  const cw = courseworkOf(sim, sim.player)!;
  const a: Assignment = {
    id: `test-${sceneId}`, course: 'DRAM 103a/b', template: 'scene-study', term: 1, setOn: '2026-09-07', dueOn: '2026-09-21', sceneId, role: 0, partner: 0,
    prep: Object.fromEntries(PREP_DIMS.map((d) => [d, 1])) as Assignment['prep'], answers: {}, steps: {}, practicedOn: {}, trained: 0, rehearsals: [], status: 'open',
  };
  for (const { q, options } of questionsFor(a)) a.answers[q.id] = options.find((o) => o.supported)!.id as never;
  cw.assignments.push(a);
  return a;
}

const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });

describe('a paired scene at mastery', () => {
  it('comes out at exactly 100 for the player, whatever the partner has done', () => {
    const sim = life('ensemble-mastery');
    mastered(sim);
    sim.player.wellbeing.energy = 90;
    const a = pairedScene(sim);
    const mate = sim.player.school!.classmates[0]!;
    // The partner as unready and unreliable as a partner comes, readings held apart (TEST SETUP).
    (mate as typeof mate & { reliability?: number; trust?: number }).reliability = 0.72;
    (mate as typeof mate & { trust?: number }).trust = 0;
    a.readsApart = 'objective';
    for (const day of ['2026-09-08', '2026-09-14', '2026-09-21']) {
      const e = judgeWork(sim, sim.player, a, day, sim.now, `show:${sim.player.id}:${a.id}:${day}`);
      expect(e.overall, day).toBe(100);
      expect(e.mastery, day).toBe(true);
      expect(e.limits, day).toEqual([]);
      const t = togetherOf(sim, sim.player, a, day, e)!;
      expect(t, day).toBeDefined();
      // The scene together is lower: the partner's preparation and the readings apart are theirs, said there.
      expect(t.overall, day).toBeLessThan(100);
    }
  });

  it('shows at the top band, and keeps the scene together beside it', () => {
    const sim = life('ensemble-band');
    mastered(sim);
    sim.player.wellbeing.energy = 90;
    const a = pairedScene(sim);
    const showing = show(sim, sim.player, a, '2026-09-21', sim.now);
    expect(showing.band).toBe('exceptional');
    expect(showing.score).toBe(1);
    expect(showing.together).toBeDefined();
    expect(showing.together!.words.length).toBeGreaterThan(10);
    expect((sim.player.work ?? []).at(-1)!.overall).toBe(100);
  });
});

describe('the scene together', () => {
  const task = TASK_PROFILES.scene!;
  const FULL = { ability: () => 100, full: () => 100, technique: () => 90 };
  const personal: Evaluation = judge('seed', FULL, { task, techniques: { scene: 1 }, prep: {}, required: {}, difficulty: 0, condition: { readiness: 100 }, key: 'x', expected: true });
  const weights = leanedWeights(task, []);
  const read = (over: Partial<PartnerRead> = {}): PartnerRead => ({ name: 'Ruth Banks', prep: 1, timing: 1, agree: 1, reliability: 0.98, level: 3, ...over });
  // A key whose draw doesn't slip, found once (the draw is the save's own, by key).
  const quiet = Array.from({ length: 200 }, (_, i) => `k${i}`).find((k) => !sharedOf(personal, read({ reliability: 0.72 }), 'seed', k, 0, weights).slip)!;
  const slipping = Array.from({ length: 400 }, (_, i) => `s${i}`).find((k) => sharedOf(personal, read({ reliability: 0.72 }), 'seed', k, 0, weights).slip)!;

  it('is the player’s own result where the partner brings everything', () => {
    expect(sharedOf(personal, read(), 'seed', quiet, 1, weights).overall).toBe(100);
  });

  it('falls as the partner’s preparation, timing or agreement falls, and never moves the player’s own', () => {
    const at = (over: Partial<PartnerRead>) => sharedOf(personal, read(over), 'seed', quiet, 1, weights).overall;
    expect(at({ prep: 0.5 })).toBeLessThan(at({ prep: 0.9 }));
    expect(at({ prep: 0 })).toBeLessThan(at({ prep: 0.5 }));
    expect(at({ timing: 0.6 })).toBeLessThan(at({ timing: 1 }));
    expect(at({ agree: ENSEMBLE.apart })).toBeLessThan(at({ agree: 1 }));
    expect(personal.overall).toBe(100);
  });

  it('reads a material by how much it’s played off the partner: none, not at all', () => {
    const at = (level: number) => sharedOf(personal, read({ prep: 0.3, level }), 'seed', quiet, 1, weights).overall;
    expect(at(0)).toBe(100);
    expect(at(1)).toBeGreaterThan(at(3));
  });

  it('takes a slip off the scene together, less the more the player covers', () => {
    expect(slipping).toBeDefined();
    const none = sharedOf(personal, read({ reliability: 0.72 }), 'seed', slipping, 0, weights);
    const all = sharedOf(personal, read({ reliability: 0.72 }), 'seed', slipping, 1, weights);
    const quietOne = sharedOf(personal, read({ reliability: 0.72 }), 'seed', quiet, 0, weights);
    expect(none.slip).toBeDefined();
    expect(none.overall).toBeLessThan(quietOne.overall);
    expect(all.overall).toBeGreaterThan(none.overall);
    expect(all.overall).toBe(quietOne.overall);
  });

  it('slips more often the less reliable the partner', () => {
    const slips = (reliability: number) => Array.from({ length: 2000 }, (_, i) => sharedOf(personal, read({ reliability }), 'seed', `r${i}`, 0, weights).slip).filter(Boolean).length;
    const low = slips(0.72);
    const high = slips(0.98);
    expect(low).toBeGreaterThan(high * 3);
    // At 0.72 about one scene in six (1 − 0.72) × 0.6 ≈ 0.17; within a tolerance for 2000 draws.
    expect(low / 2000).toBeGreaterThan(0.12);
    expect(low / 2000).toBeLessThan(0.22);
  });
});

describe('a partner as the scene reads them', () => {
  it('reads readings held apart until both are tried, and the partner’s own preparation rising with rehearsals together', () => {
    const sim = life('ensemble-read');
    const a = pairedScene(sim, 'seagull-4');
    a.prep.partner = 0;
    const apart = () => partnerReadOf(sim, sim.player, a, '2026-09-14')!;
    expect(apart().agree).toBe(1);
    a.readsApart = 'objective';
    expect(apart().agree).toBe(ENSEMBLE.apart);
    const before = apart().prep;
    a.prep.partner = 1;
    expect(apart().prep).toBeGreaterThan(before);
    // The level is the scene's own.
    expect(apart().level).toBe(MATERIAL_BY_ID['seagull-4']!.partner);
  });
});

describe('a brief’s reader', () => {
  const student = (seed: string) => {
    const sim = life(seed);
    for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
    return sim;
  };
  const rested = (sim: Simulation) => {
    for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
    Object.assign(sim.player.wellbeing, { energy: 95, stress: 15, sleepDebt: 0, nourishment: 80, hygiene: 80, morale: 60 });
  };
  const go = (sim: Simulation, kind: string, payload: Record<string, unknown>) => { rested(sim); return sim.execute<Record<string, unknown>>({ kind, payload }); };
  const camera = BRIEFS.find((b) => b.medium === 'camera' && b.partner >= 2)!;
  const voice = BRIEFS.find((b) => b.medium === 'voice')!;

  it('reads a classmate prepared with you as more than the recording, and your own take the same either way', () => {
    const sim = student('reader-compare');
    go(sim, 'brief.choose', { brief: camera.id, reading: camera.readings[0]!.id });
    for (const step of ['read', 'lines', 'lines', 'rehearse', 'rehearse']) go(sim, 'brief.prepare', { brief: camera.id, step });
    const rec = recordOf(sim.player, camera.id);
    const recording = readerRead(sim, sim.player, camera, rec);
    expect(recording.name).toBe('A Recording');
    expect(go(sim, 'brief.reader', { brief: camera.id, mate: 0 }).ok).toBe(true);
    rec.reader!.prep = 1;
    const mate = readerRead(sim, sim.player, camera, rec);
    expect(mate.timing).toBeGreaterThan(recording.timing);
    const e = forecastBrief(sim, sim.player, camera);
    const withMate = takeTogether(sim, sim.player, camera, rec, e)!.overall;
    delete rec.reader;
    const withRecording = takeTogether(sim, sim.player, camera, rec, e)!.overall;
    expect(withMate).toBeGreaterThanOrEqual(withRecording);
    // Your own take reads none of it.
    expect(forecastBrief(sim, sim.player, camera).overall).toBe(e.overall);
  });

  it('is refused for a voice alone at a microphone, and by a classmate who doesn’t trust you', () => {
    const sim = student('reader-refused');
    expect(go(sim, 'brief.reader', { brief: voice.id, mate: 0 }).error).toMatch(/alone at a microphone/);
    (sim.player.school!.classmates[1] as { trust?: number }).trust = 5;
    expect(go(sim, 'brief.reader', { brief: camera.id, mate: 1 }).error).toMatch(/rather not/);
    expect(go(sim, 'brief.reader', { brief: camera.id, mate: 99 }).error).toMatch(/isn’t one of your classmates/);
    expect(go(sim, 'brief.reader', { brief: camera.id, mate: 'alone' }).ok).toBe(true);
  });

  it('keeps a callback open when a take is played against its note, and answered, ends it', () => {
    const sim = student('reader-callback');
    const b = camera;
    go(sim, 'brief.choose', { brief: b.id, reading: b.readings[0]!.id });
    const rec = recordOf(sim.player, b.id);
    // TEST SETUP: a callback earned, its note on one axis.
    rec.callback = { axis: 'pace', side: b.allows?.pace?.[0] ?? 'driven', why: 'test', at: sim.now };
    const against = rec.callback.side === 'driven' ? 'measured' : 'driven';
    for (const step of ['read', 'lines', 'lines', 'rehearse']) go(sim, 'brief.prepare', { brief: b.id, step });
    if (!b.allows?.pace || b.allows.pace.includes(against)) {
      go(sim, 'brief.choose', { brief: b.id, reading: b.readings[0]!.id, pace: against });
      expect(go(sim, 'practice.self_tape', { genre: b.kinds[0], brief: b.id }).ok).toBe(true);
      expect(rec.takes.at(-1)!.answered).toBe(false);
      expect(rec.callback).toBeDefined();
    }
    go(sim, 'brief.choose', { brief: b.id, reading: b.readings[0]!.id, pace: rec.callback!.side });
    expect(go(sim, 'practice.self_tape', { genre: b.kinds[0], brief: b.id }).ok).toBe(true);
    expect(rec.takes.at(-1)!.answered).toBe(true);
    expect(rec.takes.at(-1)!.together).toBeDefined();
  });
});
