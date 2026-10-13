/**
 * A new life's body from its first moment (2026-10-12). Until then a life made without a height and a weight had no
 * body on record until its first midnight (`bodyOf` drew it at the rollover, and `createUniverse` settled one only for
 * a body given), so a workout on its first morning burned calories nothing counted (`exerts` returns with no body).
 * Found playing the guide's examples: a workout at 7:30 on the first morning left the body undefined.
 */

import { describe, expect, it } from 'vitest';
import { createSave, type Simulation } from '@/engine';
import { BODY } from '@/engine/content/body';
import { addDays, startOfDay, MS_HOUR, MS_MINUTE } from '@/engine/core/time';
import { bodyOf, settle } from '@/engine/systems/body';
import { LOOKING_AFTER, trainingAt } from '@/engine/systems/life';
import { newLifeConfig, type NewSaveConfig } from '@/engine/world/bootstrap';

const SEED = 'body-first-day';

/** A new life at Yale, born in New York, with no height or weight unless one is given. */
const life = (extra: Partial<NewSaveConfig> = {}): Simulation =>
  createSave(1, SEED, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });

/** The first morning's workout, its hour lived; what each kilogram of it spends past the sedentary hour, as `life.look_after` reckons it. */
function workOut(sim: Simulation): number {
  const where = trainingAt(sim, sim.player, sim.now + LOOKING_AFTER.exercise.minutes * MS_MINUTE);
  sim.must({ kind: 'life.look_after', payload: { action: 'exercise' } });
  return (where.where === 'run' ? BODY.met.run : BODY.met.workout) - BODY.sedentary;
}

/** On to six on the second morning, past the first midnight's weighing (`dailyRollover`). */
const pastMidnight = (sim: Simulation) => sim.advanceTo(addDays(startOfDay(sim.now, sim.zone), 1, sim.zone) + 6 * MS_HOUR);

describe('a new life’s body on its first day', () => {
  it('is there from the first moment, the same body its first midnight would have drawn', () => {
    const sim = life();
    const made = sim.player.body;
    expect(made).toBeDefined();
    delete sim.player.body;
    expect(bodyOf(sim, sim.player)).toEqual(made);
  });

  it('counts a first-morning workout’s calories, and the first midnight takes them off the weight', () => {
    const worked = life();
    const perKg = workOut(worked);
    const burned = worked.player.body!.extra;
    expect(burned).toBeGreaterThan(0);
    expect(burned).toBeCloseTo(perKg * worked.player.body!.weightKg, 6);
    // The same hour lived without it, on a save of its own: the only difference by the second morning is the workout.
    const rested = life();
    rested.advanceTo(worked.now);
    expect(rested.player.body!.extra).toBe(0);
    pastMidnight(worked);
    pastMidnight(rested);
    const lighter = rested.player.body!.weightKg - worked.player.body!.weightKg;
    expect(lighter).toBeGreaterThan(0);
    expect(lighter).toBeCloseTo(burned / (BODY.kcalPerKgDay * BODY.halfLifeDays / Math.LN2), 2);
  });

  it('keeps a height and a weight given at creation as given', () => {
    const sim = life({ heightCm: 171, weightKg: 66 });
    expect(sim.player.body).toEqual(settle({ heightCm: 171, weightKg: 66 }, sim.player, sim.now));
  });
});
