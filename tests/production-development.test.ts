
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine';
import { projectsOf } from '@/engine/world/company';
import { DEVELOPMENT_PASS_BY_ID, MINIMUM_LOCK_QUALITY } from '@/engine/production/development';
import { openTheDoors } from './doors';

interface Done {
  ok: boolean;
  id?: string;
  error?: string;
  completesAt?: number;
  quality?: number;
}

const run = (sim: Simulation, kind: string, payload: Record<string, unknown> = {}): Done =>
  sim.execute<Done>({ kind, payload }).value!;

function project(sim: Simulation, title = 'Development Test') {
  const created = run(sim, 'company.develop', { title, medium: 'film' });
  expect(created.ok).toBe(true);
  return projectsOf(sim.universe).find((one) => one.id === created.id)!;
}

function complete(sim: Simulation, projectId: string, kind: 'outline' | 'draft' | 'rewrite' | 'polish') {
  const started = run(sim, 'production.development.pass', { projectId, kind, focus: 'story' });
  expect(started.ok).toBe(true);
  expect(started.completesAt).toBeDefined();
  sim.advanceTo(started.completesAt! + 1);
}

describe('replacement production development', () => {
  it('grandfathers projects that have not opted into the replacement development pipeline', () => {
    const sim = quickSave({}, 'development-legacy');
    openTheDoors(sim);
    const one = project(sim, 'Legacy Path');

    const result = run(sim, 'company.greenlight', {
      projectId: one.id,
      planId: 'feature',
      budgetCents: 20_000_000_00,
      shootWeeks: 6,
    });

    expect(result.error).toBeUndefined();
  });

  it('turns a new creative brief into a real greenlight gate', () => {
    const sim = quickSave({}, 'development-gate');
    openTheDoors(sim);
    const one = project(sim, 'Locked Before Camera');

    expect(run(sim, 'production.development.start', {
      projectId: one.id,
      genreIds: ['drama'],
      audience: 'general',
      tone: 'balanced',
    }).ok).toBe(true);

    const early = run(sim, 'company.greenlight', {
      projectId: one.id,
      planId: 'feature',
      budgetCents: 20_000_000_00,
      shootWeeks: 6,
    });
    expect(early.ok).toBe(false);
    expect(early.error).toMatch(/development pass|first draft|screenplay|locked/i);

    complete(sim, one.id, 'outline');
    complete(sim, one.id, 'draft');

    while (one.development!.screenplay.quality < MINIMUM_LOCK_QUALITY) {
      complete(sim, one.id, 'rewrite');
    }

    expect(run(sim, 'production.development.lock', { projectId: one.id }).ok).toBe(true);
    expect(one.development!.screenplay.status).toBe('locked');

    const ready = run(sim, 'company.greenlight', {
      projectId: one.id,
      planId: 'feature',
      budgetCents: 20_000_000_00,
      shootWeeks: 6,
    });
    expect(ready.error).toBeUndefined();
  });

  it('enforces the screenplay order and charges development when work begins', () => {
    const sim = quickSave({}, 'development-order');
    openTheDoors(sim);
    const one = project(sim, 'Order Matters');

    expect(run(sim, 'production.development.start', {
      projectId: one.id,
      genreIds: ['thriller'],
      audience: 'adult',
      tone: 'commercial',
    }).ok).toBe(true);

    const draftFirst = run(sim, 'production.development.pass', {
      projectId: one.id,
      kind: 'draft',
      focus: 'pace',
    });
    expect(draftFirst.ok).toBe(false);
    expect(draftFirst.error).toMatch(/outline/i);

    const before = one.spentCents;
    const outline = run(sim, 'production.development.pass', {
      projectId: one.id,
      kind: 'outline',
      focus: 'structure',
    });
    expect(outline.ok).toBe(true);
    expect(one.spentCents - before).toBe(DEVELOPMENT_PASS_BY_ID.outline.costCents);

    const secondAtOnce = run(sim, 'production.development.pass', {
      projectId: one.id,
      kind: 'draft',
      focus: 'character',
    });
    expect(secondAtOnce.ok).toBe(false);
    expect(secondAtOnce.error).toMatch(/already underway/i);
  });

  it('replays screenplay quality identically for the same seed and decisions', () => {
    const play = (seed: string) => {
      const sim = quickSave({}, seed);
      openTheDoors(sim);
      const one = project(sim, 'Same Script');
      run(sim, 'production.development.start', {
        projectId: one.id,
        genreIds: ['drama'],
        audience: 'general',
        tone: 'prestige',
      });
      complete(sim, one.id, 'outline');
      complete(sim, one.id, 'draft');
      complete(sim, one.id, 'rewrite');
      return one.development!.screenplay.passes.map((pass) => pass.qualityAfter);
    };

    expect(play('development-repeat')).toEqual(play('development-repeat'));
  });
});
