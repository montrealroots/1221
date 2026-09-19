import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine';
import { marketingAwareness } from '@/engine/production/marketing';
import { projectsOf, cashAccountFor } from '@/engine/world/company';
import { deliverIt, openTheDoors } from './doors';

interface Done {
  ok: boolean;
  id?: string;
  error?: string;
  awareness?: number;
  chargedCents?: number;
}

const run = (sim: Simulation, kind: string, payload: Record<string, unknown> = {}): Done =>
  sim.execute<Done>({ kind, payload }).value!;

function delivered(sim: Simulation, title = 'Campaign Test') {
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
  expect(deliverIt(sim, project.id), 'the picture never delivered').toBe(true);
  return project;
}

describe('producer marketing', () => {
  it('commits real money and derives awareness from the campaign', () => {
    const sim = quickSave({}, 'marketing-spend');
    const project = delivered(sim);
    const account = cashAccountFor(sim.universe, project.companyId)!;
    const before = account.balance;

    const done = run(sim, 'production.marketing.commit', {
      projectId: project.id,
      strategy: 'targeted',
      spendCents: 1_000_000_00,
    });

    expect(done.ok).toBe(true);
    expect(done.chargedCents).toBe(1_000_000_00);
    expect(account.balance).toBe(before - 1_000_000_00);
    expect(project.marketing?.spendCents).toBe(1_000_000_00);
    expect(marketingAwareness(project)).toBeGreaterThan(12);
  });

  it('can revise a campaign upward but cannot unspend money', () => {
    const sim = quickSave({}, 'marketing-revise');
    const project = delivered(sim);

    expect(run(sim, 'production.marketing.commit', {
      projectId: project.id,
      strategy: 'targeted',
      spendCents: 500_000_00,
    }).ok).toBe(true);

    const up = run(sim, 'production.marketing.commit', {
      projectId: project.id,
      strategy: 'wide',
      spendCents: 800_000_00,
    });
    expect(up.ok).toBe(true);
    expect(up.chargedCents).toBe(300_000_00);

    const down = run(sim, 'production.marketing.commit', {
      projectId: project.id,
      strategy: 'minimal',
      spendCents: 200_000_00,
    });
    expect(down.ok).toBe(false);
    expect(down.error).toMatch(/cannot be unspent/i);
    expect(project.marketing?.spendCents).toBe(800_000_00);
  });

  it('makes strategy efficiency matter at the same committed spend', () => {
    const sim = quickSave({}, 'marketing-strategy');
    const project = delivered(sim);

    run(sim, 'production.marketing.commit', {
      projectId: project.id,
      strategy: 'minimal',
      spendCents: 1_000_000_00,
    });
    const minimal = marketingAwareness(project)!;

    const changed = run(sim, 'production.marketing.commit', {
      projectId: project.id,
      strategy: 'event',
      spendCents: 1_000_000_00,
    });
    expect(changed.ok).toBe(true);
    expect(changed.chargedCents).toBe(0);
    expect(marketingAwareness(project)!).toBeGreaterThan(minimal);
  });

  it('cannot change producer marketing after the picture is sold', () => {
    const sim = quickSave({}, 'marketing-locked');
    const project = delivered(sim);
    expect(run(sim, 'company.sell', { projectId: project.id, dealId: 'streamer' }).ok).toBe(true);

    const done = run(sim, 'production.marketing.commit', {
      projectId: project.id,
      strategy: 'wide',
      spendCents: 1_000_000_00,
    });
    expect(done.ok).toBe(false);
    expect(done.error).toMatch(/already been sold/i);
  });
});
