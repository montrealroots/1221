/**
 * The dojo, the lunch hall, the gym floor and the Saturday.
 *
 * What a test can hold: a grading ladder that is the ladder that art really
 * uses, an art that grades nobody carrying no belts at all, a minimum time
 * that is a published minimum time, a grade that cannot be awarded to somebody
 * too young for it, and an hour that is worth less at the top of a skill than
 * at the bottom.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import {
  ARTS_NOTE, ART_BY_ID, CHILD_CEILING, CLASS_BY_ID, DOINGS, LIFE_CLASSES, MARTIAL_ARTS,
  SESSIONS_A_WEEK, classesAt, doingsAt,
} from '@/engine/content/theweek';
import {
  artsOpenTo, describeTraining, gradeOf, putAnHourIn, readyToGrade, trainingIn, trainingNow,
  trainingOf,
} from '@/engine/systems/theweek';
import { SKILLS } from '@/engine/domain/skills';
import { MS_DAY } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';

function aPerson(seed: string, birthYear = 2008, cityId = 'uk-eng-london'): Simulation {
  return quickSave({ birthYear, startLocationId: cityId, homeRegionId: cityId }, seed);
}

/** Make room on the sheet, because the founder starts with everything maxed. */
function makeRoom(sim: Simulation, keys: readonly string[]): void {
  for (const key of keys) sim.player.skills[key] = 40;
}

// ---------------------------------------------------------------------------

describe('the arts, which are real', () => {
  it('runs the jiu jitsu ladder white to black and holds the black belt to nineteen', () => {
    const bjj = ART_BY_ID.bjj!;
    expect(bjj.grades.map((one) => one.label)).toEqual([
      'White Belt', 'Blue Belt', 'Purple Belt', 'Brown Belt', 'Black Belt',
    ]);
    expect(bjj.grades[bjj.grades.length - 1]!.fromAge).toBe(19);
    // The IBJJF really does want two years at blue before purple.
    expect(bjj.grades.find((one) => one.label === 'Purple Belt')!.minMonths).toBeGreaterThanOrEqual(24);
  });

  it('gives no belt at all to the arts that grade nobody', () => {
    for (const id of ['boxing', 'muay_thai', 'wrestling', 'mma']) {
      const art = ART_BY_ID[id]!;
      expect(art.grading, art.name).toBe('none');
      expect(art.grades, art.name).toHaveLength(0);
    }
    expect(ARTS_NOTE).toMatch(/grade nobody/);
  });

  it('counts kyu and geup the way those arts really count them', () => {
    expect(ART_BY_ID.judo!.grading).toBe('kyu_dan');
    expect(ART_BY_ID.karate!.grading).toBe('kyu_dan');
    expect(ART_BY_ID.taekwondo!.grading).toBe('geup_dan');
    expect(ART_BY_ID.krav_maga!.grading).toBe('levels');
    // Taekwondo gives a child a poom rather than a dan, which is the real rule.
    expect(ART_BY_ID.taekwondo!.grades.some((one) => /Poom/.test(one.label))).toBe(true);
    // And kendo uses no colored belt at all.
    expect(ART_BY_ID.kendo!.grades.every((one) => !/belt/i.test(one.label))).toBe(true);
  });

  it('asks for more mat time at every rung than the one below it', () => {
    for (const art of MARTIAL_ARTS) {
      let last = -1;
      for (const grade of art.grades) {
        expect(grade.hours, `${art.name} ${grade.label}`).toBeGreaterThanOrEqual(last);
        last = grade.hours;
      }
    }
  });
});

describe('training', () => {
  it('starts at the first grade, at a gym with a name', () => {
    const sim = aPerson('week-start');
    const res = sim.execute<{ gym: string; grade?: string }>(
      { kind: 'week.start_training', payload: { artId: 'judo' } },
    );
    expect(res.ok, res.error).toBe(true);
    const record = trainingIn(sim, 'judo')!;
    expect(record.gradeId).toBe(ART_BY_ID.judo!.grades[0]!.id);
    expect(record.gymName.length).toBeGreaterThan(4);
    expect(describeTraining(record)).toMatch('Judo');
    // And not twice, and not three at once.
    expect(sim.execute({ kind: 'week.start_training', payload: { artId: 'judo' } }).ok).toBe(false);
    sim.execute({ kind: 'week.start_training', payload: { artId: 'karate' } });
    expect(sim.execute({ kind: 'week.start_training', payload: { artId: 'boxing' } }).ok).toBe(false);
  });

  it('refuses an art a child is too young for', () => {
    const sim = aPerson('week-young', 2018);
    const open = artsOpenTo(sim).map((one) => one.id);
    expect(open).not.toContain('krav_maga');
    expect(sim.execute({ kind: 'week.start_training', payload: { artId: 'krav_maga' } }).ok).toBe(false);
    // But the ones that really take small children are open.
    expect(open).toContain('judo');
  });

  it('builds what the art builds, and stops at a session limit for the week', () => {
    const sim = aPerson('week-train');
    sim.execute({ kind: 'week.start_training', payload: { artId: 'bjj' } });
    makeRoom(sim, ART_BY_ID.bjj!.feeds.map((one) => one.key));
    const before = sim.player.skills.self_defense!;
    let worked = 0;
    for (let i = 0; i < SESSIONS_A_WEEK + 3; i += 1) {
      sim.player.wellbeing.energy = 100;
      if (sim.execute({ kind: 'week.train', payload: { artId: 'bjj' } }).ok) worked += 1;
    }
    expect(worked).toBeLessThanOrEqual(SESSIONS_A_WEEK);
    expect(worked).toBeGreaterThan(0);
    expect(sim.player.skills.self_defense!).toBeGreaterThan(before);
    expect(trainingIn(sim, 'bjj')!.hours).toBeGreaterThan(0);
  });

  it('will not grade anybody before the time and the hours are there', () => {
    const sim = aPerson('week-grade');
    sim.execute({ kind: 'week.start_training', payload: { artId: 'bjj' } });
    const record = trainingIn(sim, 'bjj')!;
    const early = readyToGrade(sim, record);
    expect(early.ready).toBe(false);
    expect(early.why.length).toBeGreaterThan(10);
    expect(sim.execute({ kind: 'week.grade', payload: { artId: 'bjj' } }).ok).toBe(false);
    // Put the hours and the months in, and it opens.
    record.hours = 5000;
    record.gradedAt = sim.now - 400 * MS_DAY;
    sim.advanceTo(sim.now + MS_DAY);
    const now = readyToGrade(sim, record);
    expect(now.ready, now.why).toBe(true);
    expect(now.next!.label).toBe('Blue Belt');
  });

  it('will not give a child a grade that cannot be awarded to a child', () => {
    const sim = aPerson('week-child-grade', 2016);
    sim.execute({ kind: 'week.start_training', payload: { artId: 'bjj' } });
    const record = trainingIn(sim, 'bjj')!;
    // Everything else is in place; only the age is not.
    record.gradeId = 'brown';
    record.hours = 9000;
    record.gradedAt = sim.now - 900 * MS_DAY;
    sim.advanceTo(sim.now + MS_DAY);
    const said = readyToGrade(sim, record);
    expect(said.ready).toBe(false);
    expect(said.why).toMatch(/19/);
    expect(sim.execute({ kind: 'week.grade', payload: { artId: 'bjj' } }).ok).toBe(false);
  });

  it('records a grading whether it was passed or failed, and moves the grade only on a pass', () => {
    const sim = aPerson('week-panel');
    sim.execute({ kind: 'week.start_training', payload: { artId: 'judo' } });
    const record = trainingIn(sim, 'judo')!;
    record.hours = 5000;
    record.gradedAt = sim.now - 400 * MS_DAY;
    sim.advanceTo(sim.now + MS_DAY);
    const was = record.gradeId;
    const res = sim.execute<{ passed: boolean; grade: string }>({ kind: 'week.grade', payload: { artId: 'judo' } });
    expect(res.ok, res.error).toBe(true);
    expect(record.gradings.length).toBe(1);
    expect(record.gradings[0]!.passed).toBe(res.value!.passed);
    if (res.value!.passed) expect(record.gradeId).not.toBe(was);
    else expect(record.gradeId).toBe(was);
  });

  it('says plainly that an art with no grades has no grades', () => {
    const sim = aPerson('week-nobelt');
    sim.execute({ kind: 'week.start_training', payload: { artId: 'boxing' } });
    const record = trainingIn(sim, 'boxing')!;
    expect(gradeOf(record).held).toBeUndefined();
    const said = readyToGrade(sim, record);
    expect(said.ready).toBe(false);
    expect(said.why).toMatch(/grades nobody/);
    expect(sim.execute({ kind: 'week.grade', payload: { artId: 'boxing' } }).ok).toBe(false);
  });

  it('lets somebody stop, and keeps what they did', () => {
    const sim = aPerson('week-stop');
    sim.execute({ kind: 'week.start_training', payload: { artId: 'karate' } });
    sim.player.wellbeing.energy = 100;
    sim.execute({ kind: 'week.train', payload: { artId: 'karate' } });
    const res = sim.execute({ kind: 'week.stop_training', payload: { artId: 'karate' } });
    expect(res.ok, res.error).toBe(true);
    expect(trainingNow(sim)).toHaveLength(0);
    expect(trainingOf(sim)).toHaveLength(1);
    expect(trainingOf(sim)[0]!.sessions).toBe(1);
  });
});

describe('the classes, and the hours around the lessons', () => {
  it('builds a skill the sheet actually carries, and charges for it', () => {
    const sim = aPerson('week-class', 2000);
    const lesson = CLASS_BY_ID.cookery!;
    makeRoom(sim, lesson.feeds.map((one) => one.key));
    const before = sim.player.skills.cooking!;
    const funds = sim.ledger.availableFunds(sim.player.primaryAccountId!);
    sim.player.wellbeing.energy = 100;
    const res = sim.execute({ kind: 'week.take_class', payload: { classId: 'cookery' } });
    expect(res.ok, res.error).toBe(true);
    expect(sim.player.skills.cooking!).toBeGreaterThan(before);
    expect(sim.ledger.availableFunds(sim.player.primaryAccountId!)).toBeLessThan(funds);
  });

  it('refuses a class nobody that age may take', () => {
    const sim = aPerson('week-class-young', 2016);
    expect(classesAt(9).some((one) => one.id === 'wine_course')).toBe(false);
    expect(sim.execute({ kind: 'week.take_class', payload: { classId: 'wine_course' } }).ok).toBe(false);
  });

  it('has something for every part of a week', () => {
    for (const when of ['lunch', 'gym_class', 'after_school', 'evening', 'weekend'] as const) {
      expect(doingsAt(14, when).length, when).toBeGreaterThan(0);
    }
    expect(DOINGS.length).toBeGreaterThan(15);
    expect(LIFE_CLASSES.length).toBeGreaterThan(15);
  });

  it('will not put a school lunch hour on a Saturday', () => {
    const sim = aPerson('week-lunch', 2010);
    // Walk to the next Saturday and try to have a school lunch on it.
    for (let i = 0; i < 8; i += 1) {
      const day = new Date(sim.now).getUTCDay();
      if (day === 6) break;
      sim.advanceTo(sim.now + MS_DAY);
    }
    const res = sim.execute({ kind: 'week.spend', payload: { doingId: 'lunch_library' } });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/no school/i);
  });

  it('will not send anybody out with friends they do not have', () => {
    const sim = aPerson('week-alone', 2010);
    for (const rel of Object.values(sim.universe.relationships ?? {})) {
      if (rel.type === 'friend') rel.endedAt = sim.now;
    }
    const res = sim.execute({ kind: 'week.spend', payload: { doingId: 'somebodys_house' } });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/nobody/i);
  });
});

describe('an hour, and what it is worth', () => {
  it('is worth less at the top of a skill than at the bottom', () => {
    const person = { skills: {}, attributes: {} } as never as Parameters<typeof putAnHourIn>[0];
    const first = putAnHourIn(person, 'chess', 'skill', 1, false);
    (person as { skills: Record<string, number> }).skills.chess = 95;
    const last = putAnHourIn(person, 'chess', 'skill', 1, false);
    expect(last).toBeLessThan(first);
  });

  it('holds a child below a ceiling an adult can pass', () => {
    const child = { skills: {}, attributes: {} } as never as Parameters<typeof putAnHourIn>[0];
    const adult = { skills: {}, attributes: {} } as never as Parameters<typeof putAnHourIn>[0];
    for (let i = 0; i < 400; i += 1) {
      putAnHourIn(child, 'swimming', 'skill', 2, true);
      putAnHourIn(adult, 'swimming', 'skill', 2, false);
    }
    const c = (child as { skills: Record<string, number> }).skills.swimming!;
    const a = (adult as { skills: Record<string, number> }).skills.swimming!;
    expect(c).toBeLessThanOrEqual(CHILD_CEILING * 100 + 0.01);
    expect(a).toBeGreaterThan(c);
  });

  it('does not move a skill that is already at the ceiling', () => {
    const maxed = { skills: { chess: 100 }, attributes: {} } as never as Parameters<typeof putAnHourIn>[0];
    expect(putAnHourIn(maxed, 'chess', 'skill', 4, false)).toBe(0);
  });
});

describe('the life skills themselves', () => {
  it('carries a full set, and everything trainable points at one of them', () => {
    const general = SKILLS.filter((one) => one.domain === 'general');
    expect(general.length).toBeGreaterThan(40);
    const ids = new Set(SKILLS.map((one) => one.id));
    for (const art of MARTIAL_ARTS) {
      for (const feed of art.feeds) {
        if (feed.kind === 'skill') expect(ids.has(feed.key), `${art.name} ${feed.key}`).toBe(true);
      }
    }
    for (const doing of DOINGS) {
      for (const feed of doing.feeds) {
        if (feed.kind === 'skill') expect(ids.has(feed.key), `${doing.label} ${feed.key}`).toBe(true);
      }
    }
  });
});
