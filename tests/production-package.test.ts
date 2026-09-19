
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine';
import { openTheDoors } from './doors';
import { projectsOf } from '@/engine/world/company';
import { datesFor, seatFor } from '@/engine/world/casting';
import { MINIMUM_LOCK_QUALITY } from '@/engine/production/development';

interface Done {
  ok: boolean;
  id?: string;
  error?: string;
  completesAt?: number;
  quality?: number;
}

const run = (sim: Simulation, kind: string, payload: Record<string, unknown> = {}): Done =>
  sim.execute<Done>({ kind, payload }).value!;

function complete(sim: Simulation, projectId: string, kind: 'outline' | 'draft' | 'rewrite') {
  const started = run(sim, 'production.development.pass', {
    projectId,
    kind,
    focus: 'story',
  });
  expect(started.ok).toBe(true);
  sim.advanceTo(started.completesAt! + 1);
}

function developed(sim: Simulation, title = 'Packaged Picture') {
  openTheDoors(sim);
  const made = run(sim, 'company.develop', { title, medium: 'film' });
  expect(made.ok).toBe(true);
  const project = projectsOf(sim.universe).find((one) => one.id === made.id)!;

  expect(run(sim, 'production.development.start', {
    projectId: project.id,
    genreIds: ['drama'],
    audience: 'general',
    tone: 'balanced',
  }).ok).toBe(true);

  complete(sim, project.id, 'outline');
  complete(sim, project.id, 'draft');
  while (project.development!.screenplay.quality < MINIMUM_LOCK_QUALITY) {
    complete(sim, project.id, 'rewrite');
  }
  expect(run(sim, 'production.development.lock', { projectId: project.id }).ok).toBe(true);
  return project;
}

const packageSpec = (projectId: string) => ({
  projectId,
  planId: 'feature',
  budgetCents: 20_000_000_00,
  shootWeeks: 6,
  secondsEach: 100 * 60,
  hands: 2,
});

describe('production packaging', () => {
  it('creates priced roles and performer dates before the greenlight', () => {
    const sim = quickSave({}, 'package-before-greenlight');
    const project = developed(sim);

    const packed = run(sim, 'production.package.set', packageSpec(project.id));
    expect(packed.ok).toBe(true);
    expect(project.planId).toBeUndefined();
    expect(project.package).toBeDefined();
    expect(project.roles?.length).toBeGreaterThan(0);

    const role = project.roles![0]!;
    expect(role.bandCents).toBeGreaterThan(0);
    const dates = datesFor(project, role);
    expect(dates).toBeDefined();
    expect(dates!.from).toBe(project.package!.performerFrom! - 7 * 24 * 60 * 60 * 1000);
    expect(dates!.to).toBe(project.package!.performerTo);
  });

  it('allows casting against the package and carries the signed seat through greenlight', () => {
    const sim = quickSave({}, 'package-casting');
    const project = developed(sim, 'Cast Before Greenlight');
    expect(run(sim, 'production.package.set', packageSpec(project.id)).ok).toBe(true);

    const role = project.roles![0]!;
    const playerId = sim.universe.playerId;
    expect(run(sim, 'company.cast', {
      projectId: project.id,
      roleId: role.id,
      personId: playerId,
      feeCents: role.bandCents,
      terms: {
        sequelOptions: 2,
        optionRaisePct: 0.2,
        backendPointsBps: 100,
        billing: 'first',
      },
    }).ok).toBe(true);

    const before = seatFor(project, role.id);
    expect(before?.personId).toBe(playerId);

    const greenlit = run(sim, 'company.greenlight', packageSpec(project.id));
    expect(greenlit.ok).toBe(true);
    expect(project.planId).toBe('feature');
    expect(seatFor(project, role.id)?.personId).toBe(playerId);
    expect(seatFor(project, role.id)?.terms?.sequelOptions).toBe(2);
  });

  it('will not silently change the production package after casting starts', () => {
    const sim = quickSave({}, 'package-locked-by-cast');
    const project = developed(sim, 'Terms Have Consequences');
    expect(run(sim, 'production.package.set', packageSpec(project.id)).ok).toBe(true);

    const role = project.roles![0]!;
    expect(run(sim, 'company.cast', {
      projectId: project.id,
      roleId: role.id,
      personId: sim.universe.playerId,
      feeCents: role.bandCents,
    }).ok).toBe(true);

    const changed = run(sim, 'production.package.set', {
      ...packageSpec(project.id),
      budgetCents: 25_000_000_00,
    });
    expect(changed.ok).toBe(false);
    expect(changed.error).toMatch(/casting has started/i);
    expect(project.package?.budgetCents).toBe(20_000_000_00);
  });

  it('requires an opted-in developed project to be packaged before greenlight', () => {
    const sim = quickSave({}, 'package-required');
    const project = developed(sim, 'No Skip');

    const result = run(sim, 'company.greenlight', packageSpec(project.id));
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/no production package/i);
  });
});
