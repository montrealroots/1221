/**
 * Rehearse Alone, the scene's time on its feet, was treated as desk work until 2026-10-12: its step in
 * `content/coursework.ts` named no need, so it wasn't refused when spent, with an injury that stops training, or from a
 * hospital bed, and it counted as activity at the desk's METs. The notes call that part "time on its feet" and the
 * guide's playing entry names it among the steps on your feet; it now needs your feet, as they do.
 * TEST SETUP throughout: an assignment written onto the coursework, as tests/coursework-defects.test.ts does, and the
 * clock's own commitments cleared so a step isn't refused for a class.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { BODY } from '@/engine/content/body';
import { PREP_DIMS, templateById } from '@/engine/content/coursework';
import { WORK, courseworkOf, mateRecord, type Assignment } from '@/engine/systems/coursework';
import { SPENT } from '@/engine/systems/life';
import { healthOf } from '@/engine/systems/health';
import { bodyOf } from '@/engine/systems/body';

const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });

function work(sim: Simulation): Assignment {
  const a: Assignment = {
    id: 'g28-scene', course: 'DRAM 403a/b', template: 'scene-study', term: 1, setOn: '2026-09-07', dueOn: '2026-12-01', sceneId: 'seagull-4', role: 0, partner: 0,
    prep: { ...Object.fromEntries(PREP_DIMS.map((d) => [d, 0])), familiarity: 0.6, memorization: 0.6 } as Assignment['prep'], answers: {}, steps: {}, practicedOn: {}, trained: 0, rehearsals: [], status: 'open',
  };
  courseworkOf(sim, sim.player)!.assignments.push(a);
  mateRecord(sim.player.school!.classmates[0]!).met = sim.now;
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
  return a;
}

const ALONE = templateById('scene-study')!.activities.find((x) => x.label === 'Rehearse Alone')!;
const step = (sim: Simulation, a: Assignment, activity: string) => sim.execute({ kind: 'school.prepare', payload: { assignmentId: a.id, activity } });

describe('Rehearse Alone, the scene’s time on its feet', () => {
  it('is refused when spent, as other work on its feet is, while reading the scene at the desk isn’t', () => {
    const sim = life('g28-spent');
    const a = work(sim);
    sim.player.wellbeing.energy = SPENT - 1;
    expect(step(sim, a, ALONE.id).error).toBe('You’re too tired to work on your feet. Sleep first.');
    expect(step(sim, a, 'read').ok).toBe(true);
    sim.player.wellbeing.energy = 100;
    expect(step(sim, a, ALONE.id).ok).toBe(true);
  });

  it('is refused with an injury that stops training', () => {
    const sim = life('g28-sprain');
    const a = work(sim);
    sim.player.wellbeing.energy = 100;
    healthOf(sim.player).injury = { kind: 'sprain', at: sim.now, until: sim.now + 5 * MS_DAY };
    expect(step(sim, a, ALONE.id).error).toMatch(/^Not with a sprained ankle/);
    expect(step(sim, a, 'read').ok).toBe(true);
  });

  it('is refused from a hospital bed', () => {
    const sim = life('g28-hospital');
    const a = work(sim);
    sim.player.wellbeing.energy = 100;
    healthOf(sim.player).inHospitalUntil = sim.now + 12 * MS_HOUR;
    expect(step(sim, a, ALONE.id).error).toBe('Not from a hospital bed.');
  });

  it('counts as activity on its feet, not at the desk', () => {
    const sim = life('g28-met');
    const a = work(sim);
    sim.player.wellbeing.energy = 100;
    // The body is drawn when first asked for (`bodyOf`), as the day's weight asks for it.
    const body = bodyOf(sim, sim.player);
    const before = body.extra;
    expect(step(sim, a, ALONE.id).ok).toBe(true);
    expect(body.extra - before).toBeCloseTo((WORK.met.feet - BODY.sedentary) * body.weightKg * (ALONE.minutes / 60), 6);
  });
});
