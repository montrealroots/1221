import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine';
import { MS_WEEK } from '@/engine/world/lot';
import { projectsOf } from '@/engine/world/company';
import {
  latestScreening,
  postRevisionAdjustment,
} from '@/engine/production/testing';
import { openTheDoors } from './doors';

interface Done {
  ok: boolean;
  id?: string;
  error?: string;
  completesAt?: number;
}

const run = (sim: Simulation, kind: string, payload: Record<string, unknown> = {}): Done =>
  sim.execute<Done>({ kind, payload }).value!;

function inPost(sim: Simulation, title = 'Test Cut') {
  openTheDoors(sim);
  const made = run(sim, 'company.develop', { title, medium: 'film' });
  expect(made.ok).toBe(true);
  const project = projectsOf(sim.universe).find((one) => one.id === made.id)!;
  expect(run(sim, 'company.greenlight', {
    projectId: project.id,
    planId: 'feature',
    budgetCents: 20_000_000_00,
    shootWeeks: 6,
  }).error).toBeUndefined();

  for (let i = 0; i < 80 && project.stage !== 'post'; i += 1) {
    sim.advanceTo(sim.now + MS_WEEK);
  }
  expect(project.stage).toBe('post');
  return project;
}

describe('test screenings and re-edits', () => {
  it('makes a screening information rather than an automatic improvement', () => {
    const sim = quickSave({}, 'screening-information');
    const project = inPost(sim);
    const before = postRevisionAdjustment(project);

    const screening = run(sim, 'production.testing.screen', { projectId: project.id });
    expect(screening.ok).toBe(true);
    sim.advanceTo(screening.completesAt! + 1);

    const result = latestScreening(project);
    expect(result?.status).toBe('completed');
    expect(result?.audienceScore).toBeGreaterThanOrEqual(0);
    expect(result?.audienceScore).toBeLessThanOrEqual(100);
    expect(postRevisionAdjustment(project)).toBe(before);
  });

  it('requires a screening before a re-edit can be ordered', () => {
    const sim = quickSave({}, 'screen-before-edit');
    const project = inPost(sim);

    const revision = run(sim, 'production.testing.revise', {
      projectId: project.id,
      focus: 'pace',
    });
    expect(revision.ok).toBe(false);
    expect(revision.error).toMatch(/screen/i);
  });

  it('turns a completed re-edit into a bounded commercial adjustment', () => {
    const sim = quickSave({}, 'screening-reedit');
    const project = inPost(sim);

    const screening = run(sim, 'production.testing.screen', { projectId: project.id });
    sim.advanceTo(screening.completesAt! + 1);
    const seen = latestScreening(project)!;
    const scores = {
      story: seen.story!,
      character: seen.character!,
      pace: seen.pace!,
      clarity: seen.clarity!,
    };
    const weakest = (Object.entries(scores) as Array<[keyof typeof scores, number]>)
      .sort((a, b) => a[1] - b[1])[0]![0];

    const revision = run(sim, 'production.testing.revise', {
      projectId: project.id,
      focus: weakest,
    });
    expect(revision.ok).toBe(true);
    sim.advanceTo(revision.completesAt! + 1);

    const effect = project.testing?.revisions[0]?.effect;
    expect(effect).toBeDefined();
    expect(effect).toBeGreaterThanOrEqual(-4);
    expect(effect).toBeLessThanOrEqual(7);
    expect(postRevisionAdjustment(project)).toBe(effect);
  });

  it('forces the producer to screen the new cut before ordering another re-edit', () => {
    const sim = quickSave({}, 'screen-every-cut');
    const project = inPost(sim);

    const screening = run(sim, 'production.testing.screen', { projectId: project.id });
    sim.advanceTo(screening.completesAt! + 1);
    const revision = run(sim, 'production.testing.revise', {
      projectId: project.id,
      focus: 'story',
    });
    expect(revision.ok).toBe(true);
    sim.advanceTo(revision.completesAt! + 1);

    const again = run(sim, 'production.testing.revise', {
      projectId: project.id,
      focus: 'character',
    });
    expect(again.ok).toBe(false);
    expect(again.error).toMatch(/screen the new cut/i);
  });

  it('replays a screening identically for the same seed and decisions', () => {
    const play = (seed: string) => {
      const sim = quickSave({}, seed);
      const project = inPost(sim, 'Same Audience');
      const screening = run(sim, 'production.testing.screen', { projectId: project.id });
      sim.advanceTo(screening.completesAt! + 1);
      const row = latestScreening(project)!;
      return [row.story, row.character, row.pace, row.clarity, row.audienceScore];
    };

    expect(play('screening-repeat')).toEqual(play('screening-repeat'));
  });
});
