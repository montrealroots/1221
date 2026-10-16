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
import { FITNESS, EVERYDAY_FITNESS, TRAINING, workoutBuilds } from '@/engine/systems/life';
import { abilityFull, developmentOf, repeatsSoFar } from '@/engine/systems/attributes';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { instantFromZoned } from '@/engine/core/time';
import { CLASSES_KIND, coursesOn } from '@/engine/systems/school';
import { TRAINING_CLASSES } from '@/engine/content/body';

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

describe('a workout sent twice', () => {
  it('is lived once with the same actionId, the time, the fitness and the history with it, and twice with two', () => {
    const sim = body('fit-retry', 60);
    const send = (actionId: string) => sim.execute({ kind: 'life.look_after', payload: { action: 'exercise', actionId } });
    expect(send('w-1').ok).toBe(true);
    const after = { now: sim.now, fitness: sim.player.wellbeing.fitness, history: developmentOf(sim.player).history.length };
    expect(send('w-1').error).toBe('That was already done.');
    expect({ now: sim.now, fitness: sim.player.wellbeing.fitness, history: developmentOf(sim.player).history.length }).toEqual(after);
    clear(sim);
    sim.player.wellbeing.energy = 90;
    expect(send('w-2').ok).toBe(true);
    expect(sim.player.wellbeing.fitness).toBeGreaterThan(after.fitness);
    // Saved and loaded, the first id is still spent.
    const again = reload(sim);
    clear(again);
    again.player.wellbeing.energy = 90;
    expect(again.execute({ kind: 'life.look_after', payload: { action: 'exercise', actionId: 'w-1' } }).error).toBe('That was already done.');
  });
});

/**
 * A class that trains the body as hard as a workout does (`TRAINING_CLASSES`, content/body.ts; `classTrains`,
 * systems/life.ts; from 2026-10-16, brief 09's follow-up). PLAYER JOURNEY with TEST SETUP: a first year at Yale played by
 * the clock through the fall, kept rested and fed (the dials topped up every six hours, as tests/evidence-g25-school.test.ts
 * keeps them), and from Sunday 10 January 2027 at fitness 70 (TEST SETUP), twins: one in New Haven for the spring's first
 * four weeks, the other away in Houston (TEST SETUP), so it misses every class. Neither works out. The first-year spring's
 * one class that trains the body is Acting Intimacy And Combat For The Stage, whose spring is combat.
 */
describe('a class that trains the body as hard as a workout, attended', () => {
  const ZONE = 'America/New_York';
  const nh = (y: number, m: number, d: number, h: number) => instantFromZoned({ year: y, month: m, day: d, hour: h, minute: 0 }, ZONE);
  const student = (seed: string): Simulation => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
  const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };
  const fromClass = (sim: Simulation) => developmentOf(sim.player).history.filter((e) => e.id === 'stamina' && e.source.startsWith('class:'));
  const dayOf = (key: string) => { const [year, month, day] = key.split('-').map(Number); return { year: year!, month: month!, day: day! }; };
  const met0 = (sim: Simulation, after: number) => combat(sim).find((i) => i.at > after)!;
  const combat = (sim: Simulation) => sim.universe.scheduled.filter((i) => i.kind === CLASSES_KIND && i.status === 'done' && i.payload.personId === sim.player.id && coursesOn(dayOf(String(i.payload.day))).some((c) => c.code === 'DRAM 403a/b'));

  it('holds and builds fitness at each combat class of the spring as a workout indoors does, where the twin who misses them falls 0.18 every midnight; the fall’s classes count none', () => {
    expect(TRAINING_CLASSES['DRAM 403a/b']).toBe('spring');
    const base = student('fit-class');
    tended(base, nh(2027, 1, 10, 20));
    // The fall: no first-year fall course trains the body as hard (The Body As Source, the Alexander Technique, the
    // consent and intimacy practice), so no class built or held fitness.
    expect(fromClass(base)).toHaveLength(0);
    base.player.wellbeing.fitness = 70; // TEST SETUP
    const attend = reload(base);
    const away = reload(base);
    away.player.currentLocationId = 'us-tx-houston'; // TEST SETUP
    const from = attend.now;
    tended(attend, nh(2027, 2, 7, 20));
    tended(away, nh(2027, 2, 7, 20));
    // Every combat meeting of the spring attended counted once, and nothing else did (the fall's meetings of the same
    // course were its consent and intimacy practice, and counted none, above).
    expect(combat(base).length).toBeGreaterThan(0);
    const met = combat(attend).filter((i) => i.at > from);
    expect(met.length).toBeGreaterThanOrEqual(3);
    expect(fromClass(attend).map((e) => e.source)).toEqual(met.map(() => 'class:DRAM 403a/b'));
    for (const e of fromClass(attend)) expect(e.delta).toBeGreaterThan(0);
    // What the first built is what a workout indoors would have, at the readiness of the minute before the class: a
    // twin from the same save, played to then (`workoutBuilds`, 0.6 by readiness from 0.4 to 1.2 times).
    const before = reload(base);
    tended(before, met0(attend, from).at - 60_000);
    expect(fromClass(attend)[0]!.delta).toBeCloseTo(workoutBuilds(before.player) * TRAINING.indoors, 2);
    expect(fromClass(away)).toHaveLength(0);
    // The twin who missed them fell 0.18 at each of the 28 midnights.
    expect(away.player.wellbeing.fitness).toBeCloseTo(70 - FITNESS.perDay * 28, 9);
    // The one who went: 70, what each class built, less 0.18 at each midnight more than three days after the class before
    // it (`settleTheBody`), worked from the meetings' times.
    const midnights = Array.from({ length: 28 }, (_, k) => nh(2027, 1, 11, 0) + k * MS_DAY).filter((t) => t > from);
    expect(midnights).toHaveLength(28);
    const held = midnights.filter((t) => met.some((i) => i.at <= t && t - i.at <= FITNESS.heldDays * MS_DAY)).length;
    expect(held).toBeGreaterThanOrEqual(FITNESS.heldDays * (met.length - 1));
    const built = fromClass(attend).reduce((a, e) => a + e.delta, 0);
    expect(attend.player.wellbeing.fitness).toBeCloseTo(70 + built - FITNESS.perDay * (28 - held), 2);
    // The hold is kept on the save: the last meeting, as a workout's end is.
    expect(developmentOf(reload(attend).player).workout?.at).toBe(met.at(-1)!.at);
    // And the class is the day's first workout: on the next combat day, after it, a workout would be the second.
    const next = attend.universe.scheduled.find((i) => i.kind === CLASSES_KIND && i.status === 'pending' && i.payload.personId === attend.player.id && coursesOn(dayOf(String(i.payload.day))).some((c) => c.code === 'DRAM 403a/b'))!;
    expect(next).toBeDefined();
    tended(attend, next.at + 3 * MS_HOUR);
    expect(repeatsSoFar(attend, attend.player, 'stamina<workout')).toBe(1);
  }, 240_000);
});
