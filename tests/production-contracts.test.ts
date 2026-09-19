
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine';
import { openTheDoors } from './doors';
import { projectsOf } from '@/engine/world/company';
import { decideOffer, seatFor } from '@/engine/world/casting';
import {
  actingTermsAcceptanceDelta,
  defaultActingTerms,
  normalizeActingTerms,
  optionFeeCents,
} from '@/engine/production/contracts';

interface Done { ok: boolean; id?: string; error?: string; said?: string }

const run = (sim: Simulation, kind: string, payload: Record<string, unknown> = {}): Done =>
  sim.execute<Done>({ kind, payload }).value!;

function greenlit(sim: Simulation, title = 'Contract Test') {
  openTheDoors(sim);
  const made = run(sim, 'company.develop', { title, medium: 'film' });
  expect(made.ok).toBe(true);
  const project = projectsOf(sim.universe).find((one) => one.id === made.id)!;
  const gl = run(sim, 'company.greenlight', {
    projectId: project.id,
    planId: 'feature',
    budgetCents: 20_000_000_00,
    shootWeeks: 6,
  });
  expect(gl.error).toBeUndefined();
  return project;
}

describe('acting contracts', () => {
  it('normalizes sequel, raise, backend and billing terms into safe ranges', () => {
    const sim = quickSave({}, 'contract-normalize');
    const project = greenlit(sim);
    const role = project.roles![0]!;

    const terms = normalizeActingTerms(role, {
      sequelOptions: 99,
      optionRaisePct: 4,
      backendPointsBps: 9_999,
      billing: 'first',
    });

    expect(terms.sequelOptions).toBe(4);
    expect(terms.optionRaisePct).toBe(0.5);
    expect(terms.backendPointsBps).toBe(500);
    expect(terms.billing).toBe('first');
  });

  it('makes favorable terms matter to a close casting decision without replacing salary', () => {
    const poor = normalizeActingTerms({
      id: 'r',
      name: 'Lead',
      size: 'lead',
      ordinal: 1,
      bandCents: 100_00,
      wants: { truth: 1, repeatable: 1, reads: 1 },
    }, {
      sequelOptions: 4,
      optionRaisePct: 0.05,
      backendPointsBps: 0,
      billing: 'standard',
    });
    const strong = {
      ...defaultActingTerms({
        id: 'r',
        name: 'Lead',
        size: 'lead',
        ordinal: 1,
        bandCents: 100_00,
        wants: { truth: 1, repeatable: 1, reads: 1 },
      }),
      backendPointsBps: 500,
      billing: 'first' as const,
    };

    expect(actingTermsAcceptanceDelta(strong)).toBeGreaterThan(actingTermsAcceptanceDelta(poor));

    const base = {
      askCents: 100_00,
      feeCents: 100_00,
      carries: 30,
      free: true,
      demand: 90,
    };
    expect(decideOffer({ ...base, terms: poor }, 0.55).took).toBe(false);
    expect(decideOffer({ ...base, terms: strong }, 0.55).took).toBe(true);
  });

  it('compounds negotiated sequel option raises from the original fee', () => {
    const terms = {
      sequelOptions: 3,
      optionRaisePct: 0.2,
      backendPointsBps: 0,
      billing: 'featured' as const,
    };

    expect(optionFeeCents(1_000_000_00, terms, 1)).toBe(1_200_000_00);
    expect(optionFeeCents(1_000_000_00, terms, 2)).toBe(1_440_000_00);
    expect(optionFeeCents(1_000_000_00, terms, 4)).toBeUndefined();
  });

  it('persists negotiated terms on the signed role', () => {
    const sim = quickSave({}, 'contract-seat');
    const project = greenlit(sim, 'Terms On Paper');
    const role = project.roles![0]!;
    const player = sim.universe.people[sim.universe.playerId]!;

    const result = run(sim, 'company.cast', {
      projectId: project.id,
      roleId: role.id,
      personId: player.id,
      feeCents: role.bandCents,
      terms: {
        sequelOptions: 2,
        optionRaisePct: 0.25,
        backendPointsBps: 150,
        billing: 'first',
      },
    });
    expect(result.ok).toBe(true);

    const seat = seatFor(project, role.id)!;
    expect(seat.terms).toEqual({
      sequelOptions: 2,
      optionRaisePct: 0.25,
      backendPointsBps: 150,
      billing: 'first',
    });
  });
});
