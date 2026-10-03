/**
 * Looking after yourself: eat, shower, work out, unwind.
 *
 * Sleep used to be the only thing a player could do for their body. These hold
 * the four that joined it to three things: each spends its own time on the one
 * clock, each moves the dials it names and the readiness they feed, by what
 * was needed rather than a flat bonus, and each refuses, without touching the
 * save, what it can't sensibly do, including running into something that needs
 * the player.
 */

import { describe, expect, it } from 'vitest';
import { injuryOf } from '@/engine/systems/injury';
import { quickSave } from '@/engine';
import { wearTheDay } from '@/engine/systems/wardrobe';
import type { Person, Personality } from '@/engine/domain/model';
import {
  LOOKING_AFTER, applyLookingAfter, freshWellbeing, lookAfterRefusal, mendsTo, minutesFor, readiness, type LookAfter,
} from '@/engine/systems/life';
import { ceilingAt } from '@/engine/content/lifespan';
import { MS_DAY, MS_HOUR, MS_MINUTE } from '@/engine/core/time';

const ACTIONS = Object.keys(LOOKING_AFTER) as LookAfter[];

const NEUTRAL: Personality = {
  openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50,
  emotionalStability: 50, ambition: 50, riskTolerance: 50,
};

function person(traits: string[] = []): Person {
  return { personality: NEUTRAL, personalityTraits: traits, wellbeing: freshWellbeing() } as unknown as Person;
}

function doIt(sim: ReturnType<typeof quickSave>, action: LookAfter) {
  return sim.execute<{ doneAt: number; changed: Record<string, number> }>({ kind: 'life.look_after', payload: { action } });
}

describe('looking after yourself', () => {
  for (const action of ACTIONS) {
    it(`${action} spends exactly its own time on the clock, where the place and the weather allow it`, () => {
      const sim = quickSave();
      const w = sim.player.wellbeing;
      w.nourishment = 40; w.hygiene = 50; w.energy = 70;
      // Clothes to wash, a place to clean and dishes in the sink.
      sim.player.living = { tidy: 30, dishes: 2 };
      for (let i = 0; i < 7; i += 1) wearTheDay(sim, sim.player);
      // A bath, a pool, a court, a terrace and fine weather are the home's and the day's to give (`systems/dwelling.ts`).
      // A boat is its owner's (`systems/boats.ts`, tested in `tests/boats.test.ts`).
      // A bicycle and an ATV are their owner's (`systems/outings.ts`, tested in `tests/outings.test.ts`).
      // A lawn is a home's with a yard (`systems/lawns.ts`, tested in `tests/lawns.test.ts`).
      if (lookAfterRefusal(sim, action) && ['bathe', 'swim', 'court', 'outside', 'boat', 'charter', 'ride', 'trail', 'mow'].includes(action)) return;
      const minutes = minutesFor(sim, action);
      const before = sim.now;
      const result = doIt(sim, action);
      expect(result.ok, result.error).toBe(true);
      expect(sim.now).toBe(before + minutes * MS_MINUTE);
      expect(result.value?.doneAt).toBe(sim.now);
    });
  }

  it('a meal feeds, and leaves readiness above the same afternoon without one', () => {
    const fed = quickSave();
    const skipped = quickSave();
    for (const sim of [fed, skipped]) sim.player.wellbeing.nourishment = 30;
    expect(doIt(fed, 'eat').ok).toBe(true);
    skipped.advanceTo(fed.now);
    expect(fed.player.wellbeing.nourishment - skipped.player.wellbeing.nourishment).toBeCloseTo(50, 5);
    expect(readiness(fed.player)).toBeGreaterThan(readiness(skipped.player));
  });

  it('a meal you needed lifts the mood more than one you did not', () => {
    const hungry = person();
    const peckish = person();
    hungry.wellbeing.nourishment = 30;
    peckish.wellbeing.nourishment = 85;
    const moraleBefore = hungry.wellbeing.morale;
    applyLookingAfter(hungry, 'eat');
    applyLookingAfter(peckish, 'eat');
    expect(hungry.wellbeing.nourishment).toBe(80);
    expect(peckish.wellbeing.nourishment).toBe(100);
    expect(hungry.wellbeing.morale - moraleBefore).toBeCloseTo(2, 5);
    expect(peckish.wellbeing.morale - moraleBefore).toBeCloseTo(0.6, 5);
  });

  it('a shower cleans all the way, and takes off stress by how much it had to', () => {
    const grubby = person();
    grubby.wellbeing.hygiene = 40;
    grubby.wellbeing.stress = 50;
    applyLookingAfter(grubby, 'wash');
    expect(grubby.wellbeing.hygiene).toBe(100);
    expect(grubby.wellbeing.stress).toBeCloseTo(44, 5);
  });

  it('a workout builds fitness by how ready you are, and costs energy by how fit you are, and food and a shower', () => {
    const body = person();
    const w = body.wellbeing;
    const was = { ...w };
    const ready = readiness(body);
    applyLookingAfter(body, 'exercise');
    expect(w.fitness).toBeCloseTo(was.fitness + 0.6 * (0.4 + 0.8 * ready / 100), 9);
    expect(w.energy).toBeCloseTo(was.energy - 10, 9);
    expect(w.nourishment).toBeCloseTo(was.nourishment - 6, 5);
    expect(w.hygiene).toBeLessThan(was.hygiene);
    expect(w.stress).toBeLessThan(was.stress);
    expect(w.morale).toBeGreaterThan(was.morale);
  });

  it('a workout never takes fitness past what a body that age can reach, and never pulls it down to it', () => {
    const sim = quickSave();
    const at = sim.now + 50 * 365.2425 * MS_DAY;
    const ceiling = ceilingAt(50 + (sim.now - sim.player.birthInstant) / (365.2425 * MS_DAY)).fitness;
    const near = person();
    near.birthInstant = sim.player.birthInstant;
    near.wellbeing.fitness = ceiling - 0.2;
    applyLookingAfter(near, 'exercise', at);
    expect(near.wellbeing.fitness).toBeCloseTo(ceiling, 5);
    const over = person();
    over.birthInstant = sim.player.birthInstant;
    over.wellbeing.fitness = ceiling + 5;
    applyLookingAfter(over, 'exercise', at);
    expect(over.wellbeing.fitness).toBe(ceiling + 5);
  });

  // Fitness reached condition only through its daily target once, and a
  // rested night pushed condition to its age's ceiling far faster than the
  // target pulled: over eight weeks on eight- or six-hour nights both lives
  // sat at 99.8, trained or not, and on five-hour nights the trained one
  // ended 1.75 higher. Rest mends condition only as far as fitness lets it
  // now (`mendsTo`), so it shows on every schedule.
  for (const night of [8, 5]) {
    it(`eight weeks of workouts on ${night}-hour nights build fitness, and with it condition and readiness`, () => {
      // The body alone, and money that never runs out.
      const trained = quickSave({ wealth: 'inherited' });
      const idle = quickSave({ wealth: 'inherited' });
      for (let day = 0; day < 56; day++) {
        for (const sim of [trained, idle]) expect(sim.execute({ kind: 'life.sleep', payload: { hours: night } }).ok).toBe(true);
        // Hurt, the workout waits till it mends (`systems/injury.ts`).
        if (!injuryOf(trained.player, trained.now)) {
          const result = doIt(trained, 'exercise');
          expect(result.ok, result.error).toBe(true);
        } else trained.advanceTo(trained.now + LOOKING_AFTER.exercise.minutes * MS_MINUTE);
        const next = trained.now + (24 - night) * MS_HOUR - LOOKING_AFTER.exercise.minutes * MS_MINUTE;
        trained.advanceTo(next);
        idle.advanceTo(next);
      }
      const a = trained.player.wellbeing;
      const b = idle.player.wellbeing;
      expect(a.fitness - b.fitness).toBeGreaterThan(30);
      // Condition follows what the fitness supports (`mendsTo`): the trained
      // body at its higher mark, the idle one sliding 2% a day toward its lower.
      // Until 2026-09-27 the idle one slid toward 74 and the gap here was five.
      expect(a.condition).toBeGreaterThan(mendsTo(trained.player) - 1);
      expect(a.condition - b.condition).toBeGreaterThan(1);
      expect(readiness(trained.player)).toBeGreaterThan(readiness(idle.player));
    });
  }

  it('an hour unwinding takes off far more stress than an hour going by', () => {
    const rested = quickSave();
    const waited = quickSave();
    for (const sim of [rested, waited]) sim.player.wellbeing.stress = 60;
    expect(doIt(rested, 'unwind').ok).toBe(true);
    waited.advanceTo(rested.now);
    expect(waited.player.wellbeing.stress - rested.player.wellbeing.stress).toBeGreaterThan(8);
    expect(rested.player.wellbeing.morale).toBeGreaterThan(waited.player.wellbeing.morale);
  });

  // Each knob an action reads, against somebody with no lean, on the dial it
  // moves. Without these, dropping the knob from a meal's mood or a workout's
  // sweat and stress survived every other test here.
  const knobs: [LookAfter, string, keyof Person['wellbeing']][] = [
    ['eat', 'highly_strung', 'morale'],
    ['exercise', 'chaotic', 'hygiene'],
    ['exercise', 'burns_out', 'stress'],
    ['exercise', 'even_tempered', 'morale'],
  ];
  for (const [action, trait, dial] of knobs) {
    it(`${trait} changes what ${action} does to ${dial}`, () => {
      const plain = person();
      const leaning = person([trait]);
      for (const p of [plain, leaning]) { p.wellbeing.nourishment = 30; p.wellbeing.stress = 60; }
      applyLookingAfter(plain, action);
      applyLookingAfter(leaning, action);
      expect(leaning.wellbeing[dial]).not.toBeCloseTo(plain.wellbeing[dial] as number, 3);
    });
  }

  it('how much unwinding helps is the person’s as much as the hour’s', () => {
    const even = person();
    const strung = person(['burns_out']);
    for (const p of [even, strung]) p.wellbeing.stress = 60;
    applyLookingAfter(even, 'unwind');
    applyLookingAfter(strung, 'unwind');
    expect(even.wellbeing.stress).not.toBeCloseTo(strung.wellbeing.stress, 3);
  });
});

describe('what looking after yourself refuses', () => {
  const refusals: [string, LookAfter, (sim: ReturnType<typeof quickSave>) => void, RegExp][] = [
    ['eating on a full stomach', 'eat', (s) => { s.player.wellbeing.nourishment = 95; }, /hungry/],
    ['showering clean', 'wash', (s) => { s.player.wellbeing.hygiene = 99; }, /clean/],
    ['training spent', 'exercise', (s) => { s.player.wellbeing.energy = 20; }, /tired/],
    ['running into a plan', 'unwind', (s) => {
      expect(s.execute({ kind: 'calendar.schedule', payload: { title: 'Call', at: s.now + 30 * MS_MINUTE } }).ok).toBe(true);
    }, /Call is at .*there isn’t time/],
  ];

  for (const [name, action, set, says] of refusals) {
    it(`refuses ${name}, and leaves the save as it was`, () => {
      const sim = quickSave();
      set(sim);
      expect(lookAfterRefusal(sim, action)).toMatch(says);
      const before = JSON.stringify(sim.universe);
      const result = doIt(sim, action);
      expect(result.ok).toBe(false);
      expect(result.error).toMatch(says);
      expect(JSON.stringify(sim.universe)).toBe(before);
    });
  }

  it('does not refuse a plan that starts after it is done', () => {
    const sim = quickSave();
    sim.player.wellbeing.hygiene = 50;
    expect(sim.execute({ kind: 'calendar.schedule', payload: { title: 'Call', at: sim.now + 30 * MS_MINUTE } }).ok).toBe(true);
    expect(lookAfterRefusal(sim, 'wash')).toBeUndefined();
    expect(lookAfterRefusal(sim, 'unwind')).toBeDefined();
  });

  it('refuses an action that is not one of the four', () => {
    const sim = quickSave();
    const result = sim.execute({ kind: 'life.look_after', payload: { action: 'nap' } });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/isn’t something/);
  });
});
