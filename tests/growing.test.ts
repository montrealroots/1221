/**
 * Growing up.
 *
 * What a test can hold about the years between five and twenty five: that
 * things happen on a day and have to be answered, that answering one moves
 * something the game actually carries, that a moment nobody answers passes
 * rather than stopping a life, that pocket money goes up and then stops, and
 * that a driving test can be failed.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import {
  ALLOWANCE_BY_AGE, ALLOWANCE_STOPS_AT, DRIVING_NOTE, GROWING_NOTE, LESSONS_TO_READY, MOMENTS,
  MOMENT_BY_ID, PET_BY_ID, PET_NAMES, TEST_PASSES_AT, allowanceAt, momentsAt,
} from '@/engine/content/growingup';
import {
  LAPSES_AFTER_DAYS, conditionMet, describePet, ensureGrowing, growingOf, lessonCost,
  livedThrough, openMoments, pendingMoment, readyToDrive, testCost,
} from '@/engine/systems/growing';
import { ATTRIBUTES } from '@/engine/domain/attributes';
import { SKILLS } from '@/engine/domain/skills';
import { ageOf } from '@/engine/systems/lifespan';
import { MS_DAY } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';

/** A life, at whatever age you say. */
function aLife(seed: string, birthYear = 2015, cityId = 'uk-eng-london'): Simulation {
  return quickSave({ birthYear, startLocationId: cityId, homeRegionId: cityId, wealth: 'wealthy' }, seed);
}

// ---------------------------------------------------------------------------

describe('the moments', () => {
  it('are all inside an age a person could be, and all a real decision', () => {
    const seen = new Set<string>();
    for (const moment of MOMENTS) {
      expect(seen.has(moment.id), moment.id).toBe(false);
      seen.add(moment.id);
      expect(moment.toAge).toBeGreaterThanOrEqual(moment.fromAge);
      expect(moment.fromAge).toBeGreaterThan(2);
      expect(moment.detail.length).toBeGreaterThan(24);
      expect(moment.choices.length).toBeGreaterThan(1);
    }
    expect(MOMENTS.length).toBeGreaterThan(14);
  });

  it('only move attributes and skills that exist', () => {
    const attributeIds = new Set(ATTRIBUTES.map((one) => one.id));
    const skillIds = new Set(SKILLS.map((one) => one.id));
    for (const moment of MOMENTS) {
      for (const choice of moment.choices) {
        for (const key of Object.keys(choice.effect.attribute ?? {})) {
          expect(attributeIds.has(key), `${moment.id}/${key}`).toBe(true);
        }
        for (const key of Object.keys(choice.effect.skill ?? {})) {
          expect(skillIds.has(key), `${moment.id}/${key}`).toBe(true);
        }
      }
    }
  });

  it('leave something in every year of a childhood', () => {
    for (let age = 6; age <= 20; age++) {
      expect(momentsAt(age).length, `age ${age}`).toBeGreaterThan(0);
    }
  });

  it('say out loud that everybody in them is SLATE’s own', () => {
    expect(GROWING_NOTE).toMatch(/SLATE/);
    expect(DRIVING_NOTE).toMatch(/can be failed/);
  });
});

describe('a life it happens to', () => {
  it('starts a record and puts something on the way', () => {
    const sim = aLife('growing-start');
    const record = growingOf(sim)!;
    expect(record).toBeDefined();
    expect(record.done).toHaveLength(0);
    expect(record.nextAt).toBeDefined();
    expect(openMoments(sim, record).length).toBeGreaterThan(0);
  });

  it('does not write a second record when it is asked twice', () => {
    const sim = aLife('growing-twice');
    const first = growingOf(sim)!.id;
    expect(ensureGrowing(sim).id).toBe(first);
    expect(Object.keys(sim.universe.growing ?? {})).toHaveLength(1);
  });

  it('answers a moment, moves something, and puts it behind you', () => {
    const sim = aLife('growing-answer');
    const record = growingOf(sim)!;
    const moment = openMoments(sim, record).find((one) => one.choices.some(
      (choice) => Object.keys(choice.effect.attribute ?? {}).length > 0,
    ))!;
    const choice = moment.choices.find((one) => Object.keys(one.effect.attribute ?? {}).length > 0)!;
    const [key, amount] = Object.entries(choice.effect.attribute!)[0]!;
    const before = sim.player.attributes[key] ?? 0;
    const res = sim.execute<{ note: string }>({
      kind: 'growing.choose', payload: { momentId: moment.id, choiceId: choice.id },
    });
    expect(res.ok, res.error).toBe(true);
    // At the ceiling nothing can move, which is the sandbox character's problem
    // rather than the system's.
    if (before < 100) expect(sim.player.attributes[key]).toBeGreaterThan(before);
    expect(growingOf(sim)!.done).toContain(moment.id);
    expect(livedThrough(growingOf(sim)!)).toHaveLength(1);
    void amount;
  });

  it('refuses the same moment twice, and an answer that is not on the list', () => {
    const sim = aLife('growing-once');
    const moment = openMoments(sim, growingOf(sim)!)[0]!;
    sim.execute({ kind: 'growing.choose', payload: { momentId: moment.id, choiceId: moment.choices[0]!.id } });
    expect(sim.execute({
      kind: 'growing.choose', payload: { momentId: moment.id, choiceId: moment.choices[0]!.id },
    }).ok).toBe(false);
    const other = MOMENTS.find((one) => one.id !== moment.id)!;
    expect(sim.execute({
      kind: 'growing.choose', payload: { momentId: other.id, choiceId: 'not_an_answer' },
    }).ok).toBe(false);
  });

  it('writes a memory for every moment answered', () => {
    const sim = aLife('growing-memory');
    const before = Object.keys(sim.universe.history ?? {}).length;
    const moment = openMoments(sim, growingOf(sim)!)[0]!;
    const choice = moment.choices[0]!;
    sim.execute({ kind: 'growing.choose', payload: { momentId: moment.id, choiceId: choice.id } });
    const after = Object.values(sim.universe.history ?? {});
    expect(after.length).toBeGreaterThan(before);
    expect(after.some((one) => one.detail === choice.effect.memory)).toBe(true);
  });

  it('lets a moment nobody answers pass, rather than stopping a life', () => {
    const sim = aLife('growing-lapse');
    const record = growingOf(sim)!;
    sim.advanceTo(record.nextAt! + MS_DAY);
    const waiting = pendingMoment(growingOf(sim)!);
    if (!waiting) return;
    sim.advanceTo(sim.now + (LAPSES_AFTER_DAYS + 2) * MS_DAY);
    const after = growingOf(sim)!;
    expect(after.openId).toBeUndefined();
    expect(after.done).toContain(waiting.id);
    // And the next one is on its way.
    expect(after.nextAt).toBeDefined();
  });

  it('only offers what the world is actually in a state for', () => {
    const sim = aLife('growing-conditions');
    for (const moment of openMoments(sim, growingOf(sim)!)) {
      expect(conditionMet(sim, moment), moment.id).toBe(true);
    }
    // Moving out is not offered to a ten year old.
    expect(conditionMet(sim, MOMENT_BY_ID.move_out!)).toBe(false);
  });
});

describe('pocket money', () => {
  it('goes up with age and stops when you are old enough to earn', () => {
    let last = -1;
    for (const band of ALLOWANCE_BY_AGE) {
      expect(band.fromAge).toBeGreaterThan(last);
      last = band.fromAge;
      expect(band.aWeek).toBeGreaterThan(0);
    }
    expect(allowanceAt(6)).toBeLessThan(allowanceAt(15));
    expect(allowanceAt(4)).toBe(0);
    expect(allowanceAt(ALLOWANCE_STOPS_AT)).toBe(0);
    expect(allowanceAt(30)).toBe(0);
  });
});

describe('learning to drive', () => {
  it('will not let a child book anything', () => {
    const sim = aLife('driving-child');
    expect(ageOf(sim)).toBeLessThan(16);
    expect(sim.execute({ kind: 'growing.lesson', payload: {} }).ok).toBe(false);
    expect(sim.execute({ kind: 'growing.test', payload: {} }).ok).toBe(false);
  });

  it('charges for an hour, and an hour makes you readier', () => {
    const sim = aLife('driving-lessons', 2004);
    const record = growingOf(sim)!;
    const before = sim.ledger.availableFunds(sim.player.primaryAccountId!);
    const cost = lessonCost(sim);
    const res = sim.execute<{ lessons: number; ready: number }>({ kind: 'growing.lesson', payload: {} });
    expect(res.ok, res.error).toBe(true);
    expect(record.lessons).toBe(1);
    expect(sim.ledger.availableFunds(sim.player.primaryAccountId!)).toBe(before - cost);
    expect(readyToDrive(sim, record)).toBeGreaterThan(0);
    expect(testCost(sim)).toBeGreaterThan(0);
  });

  it('will not let anybody sit it off three hours, and passing is once', () => {
    const sim = aLife('driving-test', 2004);
    expect(sim.execute({ kind: 'growing.test', payload: {} }).ok).toBe(false);
    for (let i = 0; i < LESSONS_TO_READY; i++) sim.execute({ kind: 'growing.lesson', payload: {} });
    const record = growingOf(sim)!;
    expect(record.lessons).toBe(LESSONS_TO_READY);
    expect(readyToDrive(sim, record)).toBeGreaterThanOrEqual(TEST_PASSES_AT - 20);
    let passed = false;
    for (let i = 0; i < 6 && !passed; i++) {
      const res = sim.execute<{ passed: boolean; mark: number }>({ kind: 'growing.test', payload: {} });
      if (!res.ok) break;
      passed = res.value!.passed;
      expect(res.value!.mark).toBeGreaterThanOrEqual(0);
    }
    if (passed) {
      expect(record.passedTestAt).toBeDefined();
      expect(sim.execute({ kind: 'growing.test', payload: {} }).ok).toBe(false);
    }
    expect(record.testsSat).toBeGreaterThan(0);
  });
});

describe('the animal', () => {
  it('is a real thing in the save rather than a line in a story', () => {
    const sim = aLife('pet', 2016);
    const res = sim.execute<{ note: string }>(
      { kind: 'growing.choose', payload: { momentId: 'the_pet', choiceId: 'keep_it' } },
    );
    expect(res.ok, res.error).toBe(true);
    const pet = growingOf(sim)!.pet!;
    expect(pet).toBeDefined();
    expect(PET_BY_ID[pet.kindId]).toBeDefined();
    expect(PET_NAMES).toContain(pet.name);
    expect(pet.aWeek).toBeGreaterThan(0);
    expect(res.value!.note).toMatch(pet.name);
    expect(describePet(sim, growingOf(sim)!)).toMatch(pet.name);
  });

  it('costs money every week for as long as it is here', () => {
    const sim = aLife('pet-costs', 2016);
    sim.execute({ kind: 'growing.choose', payload: { momentId: 'the_pet', choiceId: 'keep_it' } });
    const before = sim.ledger.availableFunds(sim.player.primaryAccountId!);
    sim.advanceTo(sim.now + 30 * MS_DAY);
    expect(sim.ledger.availableFunds(sim.player.primaryAccountId!)).toBeLessThan(before);
  });

  it('does not live forever, and the game says when rather than going quiet', () => {
    const sim = aLife('pet-end', 2016);
    sim.execute({ kind: 'growing.choose', payload: { momentId: 'the_pet', choiceId: 'keep_it' } });
    const pet = growingOf(sim)!.pet!;
    const kind = PET_BY_ID[pet.kindId]!;
    // Aged by moving the day it arrived rather than by simulating thirteen
    // years, which is the same arithmetic and a great deal faster.
    pet.since = sim.now - (kind.years + 1) * 365 * MS_DAY;
    sim.advanceTo(sim.now + 9 * MS_DAY);
    expect(growingOf(sim)!.pet!.untilAt).toBeDefined();
    expect(describePet(sim, growingOf(sim)!)).toMatch(pet.name);
    // And it stops costing money once it is not here: no charge in its name
    // lands after the day it ended.
    const ended = growingOf(sim)!.pet!.untilAt!;
    sim.advanceTo(sim.now + 40 * MS_DAY);
    const after = sim.ledger.history(sim.player.primaryAccountId!)
      .filter((one) => one.memo === pet.name && one.at > ended);
    expect(after).toHaveLength(0);
  });

  it('says nothing about an animal for somebody who did not keep one', () => {
    const sim = aLife('pet-none', 2016);
    sim.execute({ kind: 'growing.choose', payload: { momentId: 'the_pet', choiceId: 'no' } });
    expect(growingOf(sim)!.pet).toBeUndefined();
    expect(describePet(sim, growingOf(sim)!)).toBeUndefined();
  });
});
