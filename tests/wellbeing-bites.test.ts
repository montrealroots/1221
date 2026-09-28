/**
 * What the dials decide.
 *
 * Every dial on How You Are is read by something that changes an outcome
 * other than its own figure, and each test here changes the input and watches
 * the outcome move. Before these, condition was read by nothing past its own
 * dial, fitness only by condition's drift, hygiene only by readiness, morale
 * and condition sat at a hundred and 99.7 on any life with decent nights, and
 * fitness fell to nought on autopilot.
 *
 * The careers at the bottom are the measurement: played, not idle.
 */

import { describe, expect, it } from 'vitest';
import { injuryOf } from '@/engine/systems/injury';
import { quickSave } from '@/engine';
import type { Person, Personality } from '@/engine/domain/model';
import {
  EVERYDAY_FITNESS, applyElapsedWellbeing, applySleep, freshWellbeing, mendsTo, moraleSettlesAt, readiness,
  settleTheBody, workoutBuilds, workoutCosts,
} from '@/engine/systems/life';
import { ceilingAt } from '@/engine/content/lifespan';
import { MS_DAY, MS_HOUR, startOfNextDay } from '@/engine/core/time';

const NEUTRAL: Personality = {
  openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50,
  emotionalStability: 50, ambition: 50, riskTolerance: 50,
};

function person(dials: Partial<Person['wellbeing']> = {}): Person {
  return {
    personality: NEUTRAL, personalityTraits: [], birthInstant: 0,
    wellbeing: { ...freshWellbeing(), ...dials },
  } as unknown as Person;
}

describe('fitness', () => {
  it('sets how far rest can mend condition, and the age still caps it', () => {
    expect(mendsTo(person({ fitness: EVERYDAY_FITNESS }))).toBeCloseTo(91, 9);
    expect(mendsTo(person({ fitness: 50 }))).toBe(100);
    const old = person({ fitness: 100 });
    const at = 81 * 365.2425 * MS_DAY;
    expect(mendsTo(old, at)).toBe(ceilingAt(81).condition);
  });

  it('settles condition at midnight toward what a night mends to, and no lower', () => {
    const at = 25 * 365.2425 * MS_DAY;
    const sound = person({ fitness: EVERYDAY_FITNESS });
    sound.wellbeing.condition = mendsTo(sound, at);
    settleTheBody(sound, at);
    expect(sound.wellbeing.condition).toBeCloseTo(mendsTo(sound, at), 9);
    const worn = person({ fitness: EVERYDAY_FITNESS });
    worn.wellbeing.condition = 50;
    settleTheBody(worn, at);
    expect(worn.wellbeing.condition).toBeCloseTo(50 + (mendsTo(worn, at) - 50) * 0.02, 9);
  });

  it('falls to what an everyday life keeps, and no further', () => {
    const at = 25 * 365.2425 * MS_DAY;
    for (const [from, to] of [[60, 59.82], [35.1, 35], [35, 35], [20, 20]] as [number, number][]) {
      const body = person({ fitness: from });
      settleTheBody(body, at);
      expect(body.wellbeing.fitness, `from ${from}`).toBeCloseTo(to, 9);
    }
  });

  it('sets what a workout costs: fifteen at nought, ten at fifty, five at a hundred', () => {
    expect(workoutCosts(person({ fitness: 0 }))).toBeCloseTo(15, 9);
    expect(workoutCosts(person({ fitness: 50 }))).toBeCloseTo(10, 9);
    expect(workoutCosts(person({ fitness: 100 }))).toBeCloseTo(5, 9);
  });
});

describe('condition', () => {
  it('is read by readiness', () => {
    const sound = person({ condition: 100 });
    const worn = person({ condition: 91 });
    expect(readiness(worn) / readiness(sound)).toBeCloseTo(0.973, 3);
  });

  it('is mended by a night only as far as fitness lets it, and a body past that is not pulled down', () => {
    // Twelve hours at quality one would mend 6.3, to 91.3.
    const under = person({ fitness: EVERYDAY_FITNESS, condition: 85 });
    applySleep(under, 12, 1);
    expect(under.wellbeing.condition).toBeCloseTo(91, 9);
    const over = person({ fitness: EVERYDAY_FITNESS, condition: 96 });
    applySleep(over, 12, 1);
    expect(over.wellbeing.condition).toBe(96);
  });

  it('below what rest can mend it to, gets less energy back from the same night', () => {
    const mended = person({ energy: 0, condition: 100 });
    const worn = person({ energy: 0, condition: 50 });
    applySleep(mended, 5, 0.82);
    applySleep(worn, 5, 0.82);
    // A tenth less at half of what it could be: 0.8 + 0.2 × 0.5.
    expect(worn.wellbeing.energy / mended.wellbeing.energy).toBeCloseTo(0.9, 9);
  });

  it('sets where morale settles, against what the age allows', () => {
    expect(moraleSettlesAt(person(), 91)).toBeCloseTo(80.95, 9);
    expect(moraleSettlesAt(person(), 0)).toBe(40);
    const at = 81 * 365.2425 * MS_DAY;
    expect(moraleSettlesAt(person(), ceilingAt(81).condition, at)).toBeCloseTo(85, 9);
  });
});

describe('morale', () => {
  it('sets how much of the day’s stress a night clears', () => {
    const low = person({ stress: 60, morale: 20 });
    const high = person({ stress: 60, morale: 90 });
    applySleep(low, 8, 0.82);
    applySleep(high, 8, 0.82);
    expect(low.wellbeing.stress).toBeGreaterThan(high.wellbeing.stress + 5);
  });

  it('is brought back towards where it settles by a night, a third of the way for eight hours and less for less', () => {
    const full = person({ morale: 20, condition: 100 });
    const nap = person({ morale: 20, condition: 100 });
    // Five hours at quality one is break-even, so the pull is all that moves it.
    applySleep(full, 5, 1);
    expect(full.wellbeing.morale).toBeCloseTo(20 + (85 - 20) * 0.35 * (5 / 8), 9);
    applySleep(nap, 2.5, 2);
    expect(nap.wellbeing.morale).toBeCloseTo(20 + (85 - 20) * 0.35 * (2.5 / 8), 9);
  });
});

describe('hygiene', () => {
  it('wears on the mood for the hours spent under fifty, the same by the hour as in one stretch', () => {
    const jumped = person({ hygiene: 60, morale: 70, nourishment: 100 });
    const ticked = person({ hygiene: 60, morale: 70, nourishment: 100 });
    applyElapsedWellbeing(jumped, 10);
    for (let i = 0; i < 10; i++) applyElapsedWellbeing(ticked, 1, ticked.wellbeing.sleepDebt);
    // Under fifty from 6.25 hours in, so 3.75 hours at 0.4 an hour.
    expect(jumped.wellbeing.morale).toBeCloseTo(70 - 3.75 * 0.4, 9);
    expect(ticked.wellbeing.morale).toBeCloseTo(jumped.wellbeing.morale, 9);
    const clean = person({ hygiene: 100, morale: 70, nourishment: 100 });
    applyElapsedWellbeing(clean, 10);
    expect(clean.wellbeing.morale).toBe(70);
  });
});

describe('readiness', () => {
  it('sets what a workout builds', () => {
    const ready = person();
    const spent = person({ energy: 26, stress: 70, nourishment: 25 });
    expect(workoutBuilds(ready)).toBeGreaterThan(workoutBuilds(spent) + 0.15);
    expect(workoutBuilds(ready)).toBeCloseTo(0.6 * (0.4 + 0.8 * readiness(ready) / 100), 9);
  });
});

describe('played careers', () => {
  const at = (sim: ReturnType<typeof quickSave>, hour: number) => startOfNextDay(sim.now, sim.zone) + hour * MS_HOUR;

  it('a year on autopilot keeps everyday fitness, and morale off the ceiling', () => {
    // The body on its own, and no money to worry about.
    const sim = quickSave({ wealth: 'inherited' });
    for (let d = 0; d < 365; d++) sim.advanceTo(at(sim, 7));
    sim.advanceTo(sim.now + 11 * MS_HOUR);
    const w = sim.player.wellbeing;
    expect(w.fitness).toBe(EVERYDAY_FITNESS);
    expect(w.condition).toBeCloseTo(91, 1);
    expect(w.morale).toBeGreaterThan(80);
    expect(w.morale).toBeLessThan(90);
  });

  it('half a year of looking after yourself ends fitter, sounder, happier and readier than one of only sleeping well', () => {
    // Money behind both: this compares what the actions do, and running out
    // of money would decide it instead.
    const lives = [quickSave({ wealth: 'inherited' }), quickSave({ wealth: 'inherited' })];
    for (const sim of lives) sim.advanceTo(at(sim, -1));
    for (let d = 0; d < 180; d++) {
      for (const [i, sim] of lives.entries()) {
        const bed = sim.now;
        expect(sim.execute({ kind: 'life.sleep', payload: { hours: 8 } }).ok).toBe(true);
        if (i === 0) {
          for (const [hour, action] of [[8, 'exercise'], [9, 'wash'], [14, 'eat'], [20, 'eat'], [22, 'unwind']] as const) {
            if (sim.now < bed + hour * MS_HOUR) sim.advanceTo(bed + hour * MS_HOUR);
            // Hurt, a workout waits till it mends (`systems/injury.ts`).
            if (action === 'exercise' && injuryOf(sim.player, sim.now)) continue;
            expect(sim.execute({ kind: 'life.look_after', payload: { action } }).ok, `${action} on day ${d}`).toBe(true);
          }
        }
        sim.advanceTo(bed + 24 * MS_HOUR);
      }
    }
    const [active, sleeper] = lives.map((sim) => sim.player);
    expect(active!.wellbeing.fitness).toBeGreaterThan(sleeper!.wellbeing.fitness + 40);
    expect(active!.wellbeing.condition).toBeGreaterThan(sleeper!.wellbeing.condition + 5);
    expect(active!.wellbeing.morale).toBeGreaterThan(sleeper!.wellbeing.morale + 5);
    expect(readiness(active!)).toBeGreaterThan(readiness(sleeper!) + 8);
  });

  it('three months of five-hour nights take the mood down with the body', () => {
    const sim = quickSave();
    sim.advanceTo(at(sim, -1));
    for (let d = 0; d < 90; d++) {
      expect(sim.execute({ kind: 'life.sleep', payload: { hours: 5 } }).ok).toBe(true);
      sim.advanceTo(sim.now + 19 * MS_HOUR);
    }
    expect(sim.player.wellbeing.condition).toBeLessThan(10);
    expect(sim.player.wellbeing.morale).toBeLessThan(50);
  });
});
