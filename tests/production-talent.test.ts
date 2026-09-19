import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine';
import { openTheDoors } from './doors';
import { projectsOf } from '@/engine/world/company';
import { performerNew } from '@/engine/world/casting';
import {
  isTalent,
  searchTalent,
  talentCommitments,
  talentFitForRole,
  talentProfile,
} from '@/engine/production/talent';

interface Done { ok: boolean; id?: string; error?: string }

const run = (sim: Simulation, kind: string, payload: Record<string, unknown> = {}): Done =>
  sim.execute<Done>({ kind, payload }).value!;

function greenlit(sim: Simulation, title = 'Talent Test') {
  openTheDoors(sim);
  expect(run(sim, 'company.develop', { title, medium: 'film' }).error).toBeUndefined();
  const project = projectsOf(sim.universe).find((one) => one.title === title)!;
  expect(run(sim, 'company.greenlight', {
    projectId: project.id,
    planId: 'feature',
    budgetCents: 20_000_000_00,
    shootWeeks: 6,
  }).error).toBeUndefined();
  return project;
}

describe('production talent profiles', () => {
  it('puts the player and discovered performers in one searchable talent directory', () => {
    const sim = quickSave({}, 'talent-directory');
    const draw = (() => {
      const values = [0.2, 0.1, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
      let at = 0;
      return () => values[(at++) % values.length]!;
    })();
    const performer = performerNew(sim, 71, draw);

    expect(isTalent(sim, sim.universe.playerId)).toBe(true);
    expect(isTalent(sim, performer.id)).toBe(true);

    const names = searchTalent(sim, { query: performer.firstName }).map((one) => one.person.id);
    expect(names).toContain(performer.id);
  });

  it('builds a role-specific fit without collapsing availability or money into the score', () => {
    const sim = quickSave({}, 'talent-fit');
    const project = greenlit(sim, 'Fit Test');
    const role = project.roles?.[0];
    expect(role).toBeDefined();

    const fit = talentFitForRole(sim, project.id, role!.id, sim.universe.playerId);
    expect(fit).toBeDefined();
    expect(fit!.fit).toBeGreaterThanOrEqual(0);
    expect(fit!.fit).toBeLessThanOrEqual(100);
    expect(typeof fit!.available).toBe('boolean');
    expect(fit!.bandCents).toBe(role!.bandCents);
    expect(fit!.axes).toHaveLength(3);
  });

  it('turns a signed role into compensation and a dated commitment on the talent profile', () => {
    const sim = quickSave({}, 'talent-engagement');
    const project = greenlit(sim, 'Profile Test');
    const role = project.roles?.[0];
    expect(role).toBeDefined();

    const result = run(sim, 'company.cast', {
      projectId: project.id,
      roleId: role!.id,
      personId: sim.universe.playerId,
      feeCents: role!.bandCents,
    });
    expect(result.error).toBeUndefined();

    const profile = talentProfile(sim, sim.universe.playerId);
    expect(profile).toBeDefined();
    expect(profile!.engagements.some((one) => one.projectId === project.id)).toBe(true);
    expect(profile!.compensation.knownCareerCents).toBeGreaterThanOrEqual(role!.bandCents);
    expect(talentCommitments(sim, sim.universe.playerId).some((one) => one.projectId === project.id)).toBe(true);
  });

  it('does not turn a released pay-or-play seat into a filmography credit', () => {
    const sim = quickSave({}, 'talent-release');
    const project = greenlit(sim, 'Released Test');
    const role = project.roles?.[0];
    expect(role).toBeDefined();

    expect(run(sim, 'company.cast', {
      projectId: project.id,
      roleId: role!.id,
      personId: sim.universe.playerId,
      feeCents: role!.bandCents,
    }).error).toBeUndefined();

    expect(run(sim, 'company.release', {
      projectId: project.id,
      roleId: role!.id,
    }).error).toBeUndefined();

    const profile = talentProfile(sim, sim.universe.playerId)!;
    const engagement = profile.engagements.find((one) => one.projectId === project.id);
    expect(engagement?.releasedAt).toBeDefined();
    expect(profile.credits.some((one) => one.projectId === project.id)).toBe(false);
    expect(profile.compensation.knownCareerCents).toBeGreaterThanOrEqual(role!.bandCents);
  });
});
