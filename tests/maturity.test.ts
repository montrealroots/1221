/**
 * SLATE — how far along something is, which is never one number.
 *
 * The rule under all of it, from the research: done is the MINIMUM across the
 * dimensions, never the picture alone. An episode that is locked, mixed,
 * mastered and missing one contributor's consent is not five sixths finished.
 * It is worth nothing until somebody signs, and these hold the engine to that.
 */

import { describe, expect, it } from 'vitest';
import { quickSave, validateUniverse } from '@/engine';
import type { Simulation } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { projectsOf } from '@/engine/world/company';
import { PLANS, planById } from '@/engine/content/making';
import { DIMENSIONS, rungsOf, terminalOf } from '@/engine/content/maturity';
import {
  advance, advancePart, doneShare, holdingItUp, isFinished, knockBack, owedSeconds,
  partsOf, rungOf, rungOfPart, secondsAtOrBeyond, shareOf, whereTheWorkStands,
} from '@/engine/world/maturity';
import { finishesBy, heldUpBy, nobodysJob } from '@/engine/world/making';
import { openTheDoors } from './doors';

interface Done { ok: boolean; id?: string; error?: string }
const run = (sim: Simulation, kind: string, payload: Record<string, unknown> = {}): Done =>
  sim.execute<Done>({ kind, payload }).value!;
const world = (seed = 'maturity'): Simulation => {
  const sim = quickSave({}, seed);
  // A greenlight goes through the greenlight door, and the door has to be
  // opened the way a player opens it.
  openTheDoors(sim);
  return sim;
};

function greenlit(sim: Simulation, planId: string, title = 'Hvítserkur'): string {
  const medium = planById(planId)!.media.includes('film') ? 'film' : 'television';
  run(sim, 'company.develop', { title, medium });
  const id = projectsOf(sim.universe).find((one) => one.title === title)!.id;
  const done = run(sim, 'company.greenlight', {
    projectId: id, planId, budgetCents: 20_000_000_00, shootWeeks: 6,
  });
  expect(done.error).toBeUndefined();
  return id;
}

// ---------------------------------------------------------------------------

describe('done is the minimum and nothing else', () => {
  it('reads zero while any one dimension is still at the bottom', () => {
    const sim = world();
    const project = sim.universe.projects[greenlit(sim, 'feature')]!;
    // Push five of the six all the way up and leave one alone.
    for (const d of DIMENSIONS.slice(0, 5)) {
      advance(project, d.id, terminalOf('picture', d.id));
      expect(shareOf(project, d.id)).toBe(1);
    }
    const left = DIMENSIONS[5]!.id;
    expect(shareOf(project, left)).toBe(0);
    // Five of six finished is still nothing.
    expect(doneShare(project)).toBe(0);
    expect(isFinished(project)).toBe(false);
  });

  it('is never an average, which would call that picture five sixths done', () => {
    const sim = world('average');
    const project = sim.universe.projects[greenlit(sim, 'feature')]!;
    for (const d of DIMENSIONS.slice(0, 5)) advance(project, d.id, terminalOf('picture', d.id));
    const mean = DIMENSIONS.reduce((n, d) => n + shareOf(project, d.id), 0) / DIMENSIONS.length;
    expect(mean).toBeGreaterThan(0.8);
    expect(doneShare(project)).toBe(0);
  });

  it('names what is holding it up, worst first', () => {
    const sim = world('holding');
    const project = sim.universe.projects[greenlit(sim, 'feature')]!;
    advance(project, 'picture', 'graded');
    const short = holdingItUp(project);
    expect(short).not.toContain('picture');
    expect(shareOf(project, short[0]!)).toBeLessThanOrEqual(shareOf(project, short[1]!));
    expect(whereTheWorkStands(project)).toContain('0/100');
  });
});

describe('the ladder goes down as well as up', () => {
  it('refuses to advance backward, because going down is a different event', () => {
    const sim = world('backward');
    const project = sim.universe.projects[greenlit(sim, 'feature')]!;
    expect(advance(project, 'picture', 'locked')).toBe(true);
    expect(advance(project, 'picture', 'shot')).toBe(false);
    expect(rungOf(project, 'picture')).toBe('locked');
  });

  it('knocks a finished thing back down, and says how far it fell', () => {
    const sim = world('knock');
    const project = sim.universe.projects[greenlit(sim, 'feature')]!;
    advance(project, 'rights', 'cleared');
    const fell = knockBack(project, 'rights', 'nothing');
    expect(fell.fell).toBe(2);
    expect(rungOf(project, 'rights')).toBe('nothing');
    expect(doneShare(project)).toBe(0);
  });

  it('will not knock something up, which is the same refusal the other way', () => {
    const sim = world('knock-up');
    const project = sim.universe.projects[greenlit(sim, 'feature')]!;
    expect(knockBack(project, 'picture', 'graded').fell).toBe(0);
  });
});

describe('the season is the kind that cannot fake it', () => {
  it('gives the cut a longer ladder than a picture gets, because the notes are the work', () => {
    expect(rungsOf('season', 'picture').length).toBeGreaterThan(rungsOf('picture', 'picture').length);
    // And every rung on it is a person who can send it back down.
    const ids = rungsOf('season', 'picture').map((r) => r.id);
    expect(ids).toContain('producer');
    expect(ids).toContain('exec');
    expect(ids).toContain('broadcaster');
  });

  it('destroys a finished season with one withdrawn consent', () => {
    const sim = world('consent');
    const id = greenlit(sim, 'unscripted', 'The Arena');
    const project = () => sim.universe.projects[id]!;
    for (let i = 0; i < 8; i += 1) {
      const done = finishesBy(project())!;
      if (sim.now > done) break;
      sim.advanceTo(done + MS_DAY);
    }
    for (const element of heldUpBy(project())) {
      run(sim, 'company.deliver', { projectId: id, elementId: element.id });
    }
    // Finished on every dimension, and delivered.
    expect(isFinished(project())).toBe(true);
    expect(doneShare(project())).toBe(1);

    // Then somebody unsigns.
    const fell = knockBack(project(), 'rights', 'nothing');
    expect(fell.fell).toBeGreaterThan(0);
    expect(doneShare(project()), 'a withdrawn consent left it partly finished').toBe(0);
    expect(isFinished(project())).toBe(false);
    expect(holdingItUp(project())).toEqual(['rights']);
  });
});

describe('what a plan never moves is somebody’s job', () => {
  it('leaves a picture’s compliance to the paperwork, not to a period', () => {
    // No feature period advances compliance. That is not an oversight: on a
    // picture the legal work is the delivery list, and the list moves it.
    expect(nobodysJob(planById('feature')!)).toContain('compliance');
  });

  it('gives a season a compliance period, because there it is live work', () => {
    expect(nobodysJob(planById('unscripted')!)).not.toContain('compliance');
  });

  it('leaves no dimension unreachable across a plan and its delivery list', () => {
    for (const plan of PLANS) {
      // A fresh world each time: the greenlight door is opened per picture,
      // the way a player opens it, not once for a company forever.
      const sim = world(`reachable-${plan.id}`);
      const id = greenlit(sim, plan.id, `Reach ${plan.id}`);
      const project = () => sim.universe.projects[id]!;
      for (let i = 0; i < 10; i += 1) {
        const done = finishesBy(project())!;
        if (sim.now > done) break;
        sim.advanceTo(done + MS_DAY);
      }
      for (const element of heldUpBy(project())) {
        run(sim, 'company.deliver', { projectId: id, elementId: element.id });
      }
      expect(isFinished(project()), `${plan.id} can never finish`).toBe(true);
    }
  });
});

describe('delivery waits for the work, not just the list', () => {
  it('refuses to deliver a picture whose list is filed and whose work is not done', () => {
    const sim = world('unfinished');
    const id = greenlit(sim, 'feature');
    const project = () => sim.universe.projects[id]!;
    for (let i = 0; i < 8; i += 1) {
      const done = finishesBy(project())!;
      if (sim.now > done) break;
      sim.advanceTo(done + MS_DAY);
    }
    for (const element of heldUpBy(project())) {
      run(sim, 'company.deliver', { projectId: id, elementId: element.id });
    }
    expect(project().stage).toBe('delivered');

    // Now the same picture with rights pulled back before the last element.
    const other = world('unfinished-b');
    const otherId = greenlit(other, 'feature');
    const it2 = () => other.universe.projects[otherId]!;
    for (let i = 0; i < 8; i += 1) {
      const done = finishesBy(it2())!;
      if (other.now > done) break;
      other.advanceTo(done + MS_DAY);
    }
    for (const element of heldUpBy(it2())) {
      run(other, 'company.deliver', { projectId: otherId, elementId: element.id });
    }
    knockBack(it2(), 'compliance', 'nothing');
    expect(isFinished(it2())).toBe(false);
  });

  it('keeps the save sound through all of it', () => {
    const sim = world('sound');
    const id = greenlit(sim, 'unscripted', 'The Arena');
    for (let i = 0; i < 8; i += 1) {
      const done = finishesBy(sim.universe.projects[id]!)!;
      if (sim.now > done) break;
      sim.advanceTo(done + MS_DAY);
    }
    expect(validateUniverse(sim.universe).errors).toEqual([]);
    expect(sim.ledger.audit()).toEqual([]);
  });
});

describe('a season is N timelines, measured in runtime', () => {
  const season = (seed: string): { sim: Simulation; id: string } => {
    const sim = world(seed);
    return { sim, id: greenlit(sim, 'unscripted', 'The Arena') };
  };

  it('owes eight parts and eight hours, not one thing of unstated length', () => {
    const { sim, id } = season('owes');
    const project = sim.universe.projects[id]!;
    expect(partsOf(project)).toHaveLength(8);
    expect(owedSeconds(project)).toBe(8 * 3_600);
    expect(project.parts!.map((p) => p.ordinal)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('lets a producer set the runtime, including an hour and nineteen minutes', () => {
    const sim = world('runtime');
    run(sim, 'company.develop', { title: 'Seventy Nine', medium: 'film' });
    const id = projectsOf(sim.universe).find((one) => one.title === 'Seventy Nine')!.id;
    run(sim, 'company.greenlight', {
      projectId: id, planId: 'feature', budgetCents: 20_000_000_00, shootWeeks: 6,
      secondsEach: 79 * 60,
    });
    expect(owedSeconds(sim.universe.projects[id]!)).toBe(79 * 60);
  });

  it('holds eight episodes at different rungs at once, rather than moving as a lump', () => {
    const { sim, id } = season('stagger');
    const project = () => sim.universe.projects[id]!;
    const end = finishesBy(project())!;
    let sawSpread = 0;
    for (let at = sim.now; at <= end; at += 9 * MS_DAY) {
      sim.advanceTo(at);
      const rungs = new Set(partsOf(project()).map((p) => rungOfPart(project(), p, 'picture')));
      sawSpread = Math.max(sawSpread, rungs.size);
    }
    // Three different rungs at once is eight timelines. One would be a lump.
    expect(sawSpread).toBeGreaterThanOrEqual(3);
  });

  it('weights progress by runtime, so the measure is screen time and not episodes', () => {
    const { sim, id } = season('weighted');
    const project = sim.universe.projects[id]!;
    // Make one episode twice as long as the rest, then finish only that one.
    project.parts![0]!.seconds = 7_200;
    for (const d of DIMENSIONS) advancePart(project, project.parts![0]!, d.id, terminalOf('season', d.id));
    const byRuntime = shareOf(project, 'picture');
    const byCount = 1 / 8;
    // 7,200 of 32,400 seconds is well clear of one episode in eight.
    expect(byRuntime).toBeGreaterThan(byCount);
    expect(byRuntime).toBeCloseTo(7_200 / (7_200 + 7 * 3_600), 6);
  });

  it('reads runtime at or beyond a rung, the way a reel is read', () => {
    const { sim, id } = season('reel');
    const project = sim.universe.projects[id]!;
    expect(secondsAtOrBeyond(project, 'picture', 'assembly')).toBe(0);
    for (const part of project.parts!.slice(0, 3)) advancePart(project, part, 'picture', 'assembly');
    expect(secondsAtOrBeyond(project, 'picture', 'assembly')).toBe(3 * 3_600);
    // And nothing has reached lock, which is a different question.
    expect(secondsAtOrBeyond(project, 'picture', 'locked')).toBe(0);
  });

  it('finishes the whole season, and spends its budget exactly once', () => {
    const { sim, id } = season('spend');
    const project = () => sim.universe.projects[id]!;
    for (let i = 0; i < 10; i += 1) {
      const done = finishesBy(project())!;
      if (sim.now > done) break;
      sim.advanceTo(done + MS_DAY);
    }
    for (const element of heldUpBy(project())) {
      run(sim, 'company.deliver', { projectId: id, elementId: element.id });
    }
    expect(isFinished(project())).toBe(true);

    // The guard against settling a period by two routes: the boundary of the
    // period declared after it, and the tick at the end of the work. Counting
    // the postings tests that directly, where a total only tests it loosely —
    // a season legitimately runs a little over when its field slips.
    const plan = planById('unscripted')!;
    for (const period of plan.periods) {
      const posted = sim.universe.transactions
        .filter((t) => t.memo === `${project().title}: ${period.label}`).length;
      expect(posted, `${period.label} settled ${posted} times`).toBe(1);
    }
    expect(project().settled).toHaveLength(plan.periods.length);
    // And the total is the budget plus an overrun, nowhere near twice it.
    expect(project().spentCents).toBeGreaterThanOrEqual(project().budgetCents!);
    expect(project().spentCents).toBeLessThan(project().budgetCents! * 1.3);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('takes the latest end for the work, not the last one declared', () => {
    const { sim, id } = season('latest');
    const project = sim.universe.projects[id]!;
    const windows = project.periods!;
    const lastDeclared = windows[windows.length - 1]!;
    const latest = windows.reduce((n, one) => Math.max(n, one.to), 0);
    // Compliance is declared last and ends before the cut does, so reading the
    // last element would finish the season four weeks early.
    expect(lastDeclared.to).toBeLessThan(latest);
    expect(finishesBy(project)).toBe(latest);
  });
});
