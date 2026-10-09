/**
 * Fitness kept and lost (from 2026-10-10, `FITNESS` in `systems/life.ts`): a workout through `life.look_after` holds
 * the body for three days, past that it detrains a little each day, a second workout the same day builds half and a
 * save and a load don't reset that, the history records what a workout built, and a body brought to its ceiling stays
 * exactly full while it's kept up. Played through the command and the clock.
 */
import { describe, expect, it } from 'vitest';
import { quickSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { FITNESS, EVERYDAY_FITNESS } from '@/engine/systems/life';
import { abilityFull, developmentOf } from '@/engine/systems/attributes';

/** Test setup: nothing on the calendar in the way, rested, and the body at a fitness. */
function body(seed: string, fitness: number): Simulation {
  const sim = quickSave({}, seed);
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
  Object.assign(sim.player.wellbeing, { energy: 90, stress: 20, sleepDebt: 0, nourishment: 70, morale: 60, hygiene: 80, fitness });
  return sim;
}
const workOut = (sim: Simulation) => sim.execute({ kind: 'life.look_after', payload: { action: 'exercise' } });
const clear = (sim: Simulation) => { for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now); };
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);

describe('fitness held and lost', () => {
  it('holds for three days after a workout, then falls 0.18 a day', () => {
    const sim = body('fit-held', 70);
    expect(workOut(sim).ok).toBe(true);
    const after = sim.player.wellbeing.fitness;
    const trainedAt = sim.now;
    sim.advanceTo(trainedAt + FITNESS.heldDays * MS_DAY);
    expect(sim.player.wellbeing.fitness).toBe(after);
    sim.advanceTo(trainedAt + (FITNESS.heldDays + 2) * MS_DAY);
    const fell = after - sim.player.wellbeing.fitness;
    expect(fell).toBeGreaterThan(0);
    expect(fell).toBeLessThanOrEqual(2 * FITNESS.perDay + 1e-9);
  });

  it('keeps a body trained every third day from falling, where one never trained falls', () => {
    const kept = body('fit-kept', 70);
    const left = body('fit-kept', 70);
    for (let d = 0; d < 30; d += 1) {
      if (d % 3 === 0) { clear(kept); kept.player.wellbeing.energy = 90; expect(workOut(kept).ok).toBe(true); }
      kept.advanceTo(kept.now + MS_DAY);
      left.advanceTo(left.now + MS_DAY);
    }
    expect(kept.player.wellbeing.fitness).toBeGreaterThan(70);
    expect(left.player.wellbeing.fitness).toBeLessThan(70);
    expect(left.player.wellbeing.fitness).toBeGreaterThanOrEqual(EVERYDAY_FITNESS);
  });

  it('detrains a save from before the rule as it did, until its first workout: no workout invented', () => {
    const sim = body('fit-legacy', 70);
    expect(developmentOf(sim.player).workout).toBeUndefined();
    sim.advanceTo(sim.now + 2 * MS_DAY);
    expect(sim.player.wellbeing.fitness).toBeLessThan(70);
  });
});

describe('a second workout the same day', () => {
  // Twins from one save, the same in everything but whether the day's count says a workout was done (TEST SETUP: the
  // count cleared on one): what the second builds against what a first would have, in the same body at the same hour.
  const gainOf = (sim: Simulation) => { const before = sim.player.wellbeing.fitness; expect(workOut(sim).ok).toBe(true); return sim.player.wellbeing.fitness - before; };
  const twins = (sim: Simulation) => {
    const second = reload(sim);
    const first = reload(sim);
    delete developmentOf(first.player).counts['stamina<workout'];
    return { second: gainOf(second), first: gainOf(first) };
  };

  it('builds half what a first would have, and a save and a load between don’t reset that', () => {
    const sim = body('fit-twice', 60);
    expect(workOut(sim).ok).toBe(true);
    const first = developmentOf(sim.player).history.at(-1)!;
    expect(first.id).toBe('stamina');
    expect(first.source).toMatch(/^workout/);
    sim.advanceTo(sim.now + MS_HOUR);
    clear(sim);
    sim.player.wellbeing.energy = 90;
    const g = twins(sim);
    expect(g.first).toBeGreaterThan(0);
    expect(g.second / g.first).toBeCloseTo(0.5, 9);
  });

  it('builds in full again the next day', () => {
    const sim = body('fit-next-day', 60);
    workOut(sim);
    workOut(sim);
    sim.advanceTo(sim.now + MS_DAY);
    clear(sim);
    Object.assign(sim.player.wellbeing, { energy: 90, nourishment: 70, hygiene: 80 });
    const g = twins(sim);
    expect(g.second / g.first).toBeCloseTo(1, 9);
  });
});

describe('full, and kept full', () => {
  it('reaches the age’s ceiling exactly and holds it there between workouts', () => {
    const sim = body('fit-full', 0);
    const full = abilityFull(sim, sim.player, 'stamina');
    sim.player.wellbeing.fitness = full - 0.05;
    expect(workOut(sim).ok).toBe(true);
    expect(sim.player.wellbeing.fitness).toBe(full);
    sim.advanceTo(sim.now + 2 * MS_DAY);
    expect(sim.player.wellbeing.fitness).toBe(abilityFull(sim, sim.player, 'stamina'));
  });
});
