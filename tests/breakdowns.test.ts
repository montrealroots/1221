/**
 * The week's breakdowns, browsed and chosen (`breakdownsOf`, `career.submit_for`,
 * from 2026-10-06): each part that takes submissions here, its genre and what it
 * asks, the same however often it's looked at; a submission for one comes back
 * at the same odds as any, and is an audition for that part, read with that
 * breakdown's genre and demands. Until then the engine picked the part.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { ESTIMATE, beginCareer, breakdownsOf, careerOf, roleById, submitForRefusal, weekOfAuditions, type Breakdown } from '@/engine/systems/career';
import { evenCraft } from '@/engine/systems/school';
import { ROLES, WORK_COSTS } from '@/engine/content/career';

function pro(seed: string) {
  const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.player.craft = evenCraft(75);
  beginCareer(sim, sim.player);
  return sim;
}

describe('the week’s breakdowns', () => {
  it('are the parts here that take submissions, each with its genre and demands, the same however often they’re read', () => {
    const sim = pro('bd-list');
    const list = breakdownsOf(sim, sim.player);
    expect(list.map((b) => b.roleId).sort()).toEqual(ROLES.filter((r) => r.cities.includes('us-ny-newyork') && r.selfSubmit).map((r) => r.id).sort());
    expect(breakdownsOf(sim, sim.player)).toEqual(list);
    // Next week's are drawn afresh.
    const weeks = Array.from({ length: 30 }, (_, w) => { sim.universe.now += w ? 7 * MS_DAY : 0; return JSON.stringify(breakdownsOf(sim, sim.player)); });
    expect(new Set(weeks).size).toBeGreaterThan(1);
  });

  it('a submission for one is an audition for that part, with its breakdown’s genre and demands, at a submission’s odds', () => {
    const sim = pro('bd-chosen');
    const role = ROLES.find((r) => r.cities.includes('us-ny-newyork') && r.selfSubmit && r.medium === 'stage') ?? ROLES.find((r) => r.cities.includes('us-ny-newyork') && r.selfSubmit)!;
    const asked: Breakdown = { roleId: role.id, genre: 'musical', demands: ['dance'] };
    let got = 0;
    let blind = 0;
    for (let w = 0; w < 400; w += 1) {
      const at = sim.now + w * 7 * MS_DAY;
      const week = weekOfAuditions(sim, sim.player, at, undefined, 'us-ny-newyork', 1, false, [asked]);
      for (const a of week) { got += 1; expect(a).toMatchObject({ roleId: role.id, self: true, chosen: true, genre: 'musical', demands: ['dance'] }); }
      blind += weekOfAuditions(sim, sim.player, at, undefined, 'us-ny-newyork', 1).length;
    }
    // The same odds as a submission for whatever part: free, a callback at half the paid share.
    expect(got).toBe(blind);
    expect(got / 400).toBeCloseTo(ESTIMATE.selfSubmitCallback * WORK_COSTS.freeSubmissionShare, 1);
  });

  it('is one of the week’s submissions, once a part, and kept to Monday’s', () => {
    const sim = pro('bd-submit');
    const [first, second] = breakdownsOf(sim, sim.player);
    expect(sim.must<{ submitted: number }>({ kind: 'career.submit_for', payload: { roleId: first!.roleId } })).toEqual({ submitted: 1 });
    expect(careerOf(sim.player).chosen).toEqual([first]);
    expect(submitForRefusal(sim, sim.player, first!.roleId)).toBe('You’ve submitted for it this week.');
    expect(submitForRefusal(sim, sim.player, 'no-such-part')).toBe('That part isn’t taking submissions here this week.');
    careerOf(sim.player).submitted = ESTIMATE.selfSubmitsAWeek;
    if (second) expect(submitForRefusal(sim, sim.player, second.roleId)).toMatch(/this week’s \d+ submissions/);
    expect(roleById(first!.roleId).selfSubmit).toBe(true);
    // Monday's week reads them and starts afresh.
    sim.advanceBy(8 * MS_DAY);
    expect(careerOf(sim.player).chosen).toBeUndefined();
  });
});
