/**
 * The traits wired to the school, the body and the table in the connected
 * world of 2026-10-09 (`content/personality-traits.ts`): each tested by the
 * falsifiability test, two lives alike but for the trait, or one life at two
 * hours, and the outcome moving, not only the sentence.
 *
 * - An early riser is sharper in the morning and flatter in the evening, a
 *   night owl the other way (`morning`, `evening`, read by `focusAt`).
 * - Curious reads around a part, single-minded drills it, scattered skims it
 *   and self-critical revises it: each part of the preparation that way
 *   moves further for them (`PREP_KNOB`).
 * - A meal lifts a spender's mood more and a frugal person's less
 *   (`mealMood`).
 * - Detached warms to people more slowly; keeps accounts is cut deeper by a
 *   slight; restless needs company, a homebody less (`bondWarmth`,
 *   `bondWound`, `company`).
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { PREP_DIMS, type PrepDim } from '@/engine/content/coursework';
import { activitiesOf, courseworkOf, setWork, PREP_KNOB } from '@/engine/systems/coursework';
import { bondMove, castCompany, focusAt } from '@/engine/systems/school';
import { personalityOf } from '@/engine/systems/personality';

const ZONE = 'America/New_York';
const life = (seed: string, traits: string[] = []) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', personalityTraits: traits });
/** Test setup: a rested, fed, unhurried body, so only the trait differs. */
const steady = (sim: Simulation) => { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 70, morale: 60 }); sim.player.awakeSince = sim.now - MS_HOUR; };
const at = (hour: number) => instantFromZoned({ year: 2026, month: 9, day: 15, hour }, ZONE);

describe('the hour of the day', () => {
  it('sharpens an early riser in the morning and a night owl in the evening, and leaves the afternoon alone', () => {
    const early = life('tc-hours', ['early_riser']);
    const owl = life('tc-hours', ['night_owl']);
    const plain = life('tc-hours');
    for (const s of [early, owl, plain]) steady(s);
    const f = (s: Simulation, h: number) => focusAt(s, s.player, at(h));
    expect(f(early, 9)).toBeGreaterThan(f(plain, 9));
    expect(f(owl, 9)).toBeLessThan(f(plain, 9));
    expect(f(early, 19)).toBeLessThan(f(plain, 19));
    expect(f(owl, 19)).toBeGreaterThan(f(plain, 19));
    expect(f(early, 14)).toBe(f(plain, 14));
    expect(f(owl, 14)).toBe(f(plain, 14));
    // Somebody with neither: the hour moves nothing.
    expect(f(plain, 9)).toBe(f(plain, 19));
  });
});

describe('the way a part is prepared', () => {
  /** One step of preparation on the same work at the same hour, in two lives alike but for a trait: how far the part moved. */
  const step = (seed: string, traits: string[], dim: PrepDim) => {
    const sim = life(seed, traits);
    steady(sim);
    const cw = courseworkOf(sim, sim.player)!;
    for (const a of cw.assignments) if (a.status === 'open' || a.status === 'revising') a.status = 'done';
    // Scene study has no step on the interpretation, its choices answered instead: a speech drill's transcribing is one.
    const a = setWork(sim, sim.player, dim === 'interpretation' ? 'DRAM 123a/b' : 'DRAM 103a/b', { year: 2026, month: 9, day: 28 })!;
    // Test setup: the parts a step may ask first, already in place.
    for (const d of PREP_DIMS) a.prep[d] = 0.45;
    a.prep[dim] = 0.2;
    // Test setup: revising is work already shown and given its notes.
    if (dim === 'revision') a.status = 'revising';
    const act = activitiesOf(a).find((x) => x.dim === dim && !(x.needs ?? []).includes('partner'));
    if (!act) return undefined;
    const before = a.prep[dim];
    const r = sim.execute({ kind: 'school.prepare', payload: { assignmentId: a.id, activity: act.id } });
    expect(r.ok, r.error).toBe(true);
    return a.prep[dim] - before;
  };

  it('moves each part further for the trait that works that way, and no other part', () => {
    const pairs: [string, PrepDim][] = [['curious', 'interpretation'], ['single_minded', 'memorization'], ['scattered', 'familiarity'], ['self_critical', 'revision']];
    let compared = 0;
    for (const [trait, dim] of pairs) {
      expect(PREP_KNOB[dim]).toBeDefined();
      const plain = step(`tc-prep-${dim}`, [], dim);
      const leaning = step(`tc-prep-${dim}`, [trait], dim);
      if (plain === undefined || leaning === undefined) continue;
      compared += 1;
      expect(leaning, `${trait} on ${dim}`).toBeGreaterThan(plain);
      expect(leaning / plain).toBeCloseTo(personalityOf(life('k', [trait]).player, PREP_KNOB[dim]!), 1);
    }
    // Every one of the four is a step of the work.
    expect(compared).toBe(4);
    // Curious reads around a part; it doesn't learn the lines faster.
    expect(step('tc-prep-cross', ['curious'], 'memorization')).toBe(step('tc-prep-cross', [], 'memorization'));
  });
});

describe('the table', () => {
  it('lifts a spender’s mood more for the same meal than a frugal person’s', () => {
    const lift = (traits: string[]) => {
      const sim = life('tc-meal', traits);
      steady(sim);
      sim.player.wellbeing.nourishment = 30;
      const before = sim.player.wellbeing.morale;
      const r = sim.execute({ kind: 'life.look_after', payload: { action: 'eat' } });
      expect(r.ok, r.error).toBe(true);
      return sim.player.wellbeing.morale - before;
    };
    const frugal = lift(['frugal']);
    const plain = lift([]);
    const spender = lift(['spender']);
    expect(spender).toBeGreaterThan(plain);
    expect(plain).toBeGreaterThan(frugal);
  });
});

describe('other people', () => {
  it('warms a detached person to a classmate more slowly, and cuts somebody who keeps accounts deeper', () => {
    const plain = life('tc-bonds').player;
    expect(bondMove(life('tc-bonds', ['detached']).player, 10)).toBeLessThan(bondMove(plain, 10));
    expect(bondMove(life('tc-bonds', ['detached']).player, -10)).toBe(bondMove(plain, -10));
    expect(bondMove(life('tc-bonds', ['keeps_accounts']).player, -10)).toBeLessThan(bondMove(plain, -10));
    expect(bondMove(life('tc-bonds', ['keeps_accounts']).player, 10)).toBe(bondMove(plain, 10));
  });

  it('makes friends in the cast worth more to somebody restless, and none weigh on them, where a homebody minds less', () => {
    const restless = life('tc-company', ['restless']).player;
    const homebody = life('tc-company', ['homebody']).player;
    const plain = life('tc-company').player;
    expect(castCompany(restless, 2)).toBeGreaterThan(castCompany(plain, 2));
    expect(castCompany(homebody, 2)).toBeLessThan(castCompany(plain, 2));
    expect(castCompany(restless, 0)).toBeLessThan(0);
    expect(castCompany(homebody, 0)).toBe(0);
    expect(castCompany(plain, 0)).toBe(0);
  });
});
