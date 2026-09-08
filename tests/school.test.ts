/**
 * School.
 *
 * What a test can hold about the years a game like this usually skips: a
 * fifteen year old in the right year of the right system wherever they are,
 * a week that is a timetable rather than a coincidence, marks that move on
 * whether you turned up and whether you worked, a team you can be turned down
 * for, a school that only fields the sports its country's schools really do,
 * and a play — which is the point, because a gifted child can be seen in one
 * and an ordinary one cannot.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import {
  attendance, auditionStrength, averageMark, buildTimetable, describePart, ensureSchoolLeaver,
  ensureSchooling, isASchoolDay, markFor, partThisYear, productionFor, qualificationsOf,
  rawTalent, schoolHistoryOf, schoolIsCompulsory, schoolingOf, stageFor, standingOn, subjectsAt,
  systemFor, todaysLessons, yearFor,
} from '@/engine/systems/school';
import {
  ACADEMIC_SCHOLARSHIP, CLUBS, EDUCATION_SYSTEMS, LEAD_TAKES, NOTICED_AT, PERIODS_A_DAY,
  SCHOOLING_NOTE, SCHOOL_DAYS, SCHOOL_PLAYS, SUBJECTS, SUBJECT_BY_ID, UNIVERSITY_LOOKS_AT,
  stageForAge, systemIn, yearLabel,
} from '@/engine/content/schooling';
import { ageOf, youthFactor } from '@/engine/systems/lifespan';
import { marksOn } from '@/engine/systems/university';
import { COUNTRIES } from '@/engine/content/geography';
import { placesIn } from '@/engine/content/places';
import { MS_DAY } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';

function atSchool(seed: string, birthYear: number, cityId = 'uk-eng-london'): Simulation {
  return quickSave({ birthYear, startLocationId: cityId, homeRegionId: cityId }, seed);
}

/** Go to school today, moving forward until a school day comes round. */
function goToSchool(sim: Simulation, effort: 'coast' | 'normal' | 'hard' = 'normal'): boolean {
  for (let tries = 0; tries < 9; tries++) {
    const res = sim.execute({ kind: 'school.attend', payload: { effort } });
    if (res.ok) return true;
    sim.advanceTo(sim.now + MS_DAY / 2);
  }
  return false;
}

// ---------------------------------------------------------------------------

describe('the system you are in', () => {
  it('puts a fifteen year old in the right year wherever they are', () => {
    for (const [cityId, expected] of [
      ['us-ca-losangeles', 'Grade 10'],
      ['uk-eng-london', 'Year 11'],
      ['in-07-delhi', 'Class 10'],
      ['fr-idf-paris', 'Seconde'],
    ] as const) {
      // Born in June 2010, so fifteen on the save's start date in March 2026.
      const sim = atSchool(`year-${cityId}`, 2010, cityId);
      expect(ageOf(sim)).toBe(15);
      expect(yearFor(sim), cityId).toBe(expected);
    }
  });

  it('covers every year of a life a country compels, with no gap between stages', () => {
    for (const system of EDUCATION_SYSTEMS) {
      let last = -1;
      for (const stage of system.stages) {
        expect(stage.to, `${system.label} ${stage.label}`).toBeGreaterThanOrEqual(stage.from);
        if (last >= 0) expect(stage.from, `${system.label} gap`).toBe(last + 1);
        last = stage.to;
      }
      for (let age = system.compulsory[0]; age <= system.compulsory[1]; age++) {
        expect(stageForAge(system, age), `${system.label} at ${age}`).toBeDefined();
      }
    }
  });

  it('names every year of every stage', () => {
    for (const system of EDUCATION_SYSTEMS) {
      for (const stage of system.stages) {
        for (let age = stage.from; age <= stage.to; age++) {
          expect(yearLabel(stage, age).length, `${system.label} ${age}`).toBeGreaterThan(1);
        }
      }
    }
  });

  it('puts no country in two systems, and falls to the general one otherwise', () => {
    const seen = new Set<string>();
    for (const system of EDUCATION_SYSTEMS) {
      for (const countryId of system.countryIds) {
        expect(seen.has(countryId), countryId).toBe(false);
        seen.add(countryId);
        expect(COUNTRIES.get(countryId), countryId).toBeDefined();
      }
    }
    // Somewhere SLATE does not carry still gets a school.
    expect(systemIn('tv').id).toBe('world');
    expect(systemIn('tv').stages.length).toBeGreaterThan(0);
  });

  it('says which half of school is real', () => {
    expect(SCHOOLING_NOTE).toMatch(/public record/);
    expect(SCHOOLING_NOTE).toMatch(/no feed/);
    expect(SCHOOLING_NOTE).toMatch(/SLATE/);
  });

  it('knows when the law makes school compulsory and when it stops', () => {
    expect(schoolIsCompulsory(atSchool('young', 2016))).toBe(true);
    const grown = atSchool('grown', 2001);
    expect(schoolIsCompulsory(grown)).toBe(false);
    expect(stageFor(grown)).toBeUndefined();
    expect(schoolingOf(grown)).toBeUndefined();
  });
});

describe('the week', () => {
  it('is a timetable rather than a coincidence', () => {
    for (const [year, cityId] of [[2016, 'fr-idf-paris'], [2012, 'uk-eng-london'], [2010, 'us-ca-losangeles']] as const) {
      const sim = atSchool(`week-${cityId}`, year, cityId);
      const schooling = schoolingOf(sim)!;
      expect(schooling.timetable.length).toBe(SCHOOL_DAYS.length * PERIODS_A_DAY);
      for (const day of SCHOOL_DAYS) {
        const lessons = schooling.timetable.filter((one) => one.day === day).sort((a, b) => a.period - b.period);
        expect(lessons.length).toBe(PERIODS_A_DAY);
        const counts = new Map<string, number>();
        let previous = '';
        for (const lesson of lessons) {
          expect(SUBJECT_BY_ID[lesson.subjectId], lesson.subjectId).toBeDefined();
          expect(lesson.subjectId, 'two of the same back to back').not.toBe(previous);
          previous = lesson.subjectId;
          counts.set(lesson.subjectId, (counts.get(lesson.subjectId) ?? 0) + 1);
        }
        for (const [subjectId, count] of counts) expect(count, subjectId).toBeLessThanOrEqual(2);
      }
    }
  });

  it('puts nothing on a timetable that somebody is too young for', () => {
    const sim = atSchool('young-week', 2018, 'fr-idf-paris');
    const age = ageOf(sim);
    for (const lesson of schoolingOf(sim)!.timetable) {
      expect(SUBJECT_BY_ID[lesson.subjectId]!.fromAge, lesson.subjectId).toBeLessThanOrEqual(age);
    }
    expect(subjectsAt(7).length).toBeLessThan(SUBJECTS.length);
  });

  it('gives the same child the same week every time', () => {
    const sim = atSchool('same-week', 2012);
    const again = buildTimetable(sim, sim.player, schoolingOf(sim)!.placeId, ageOf(sim));
    expect(again).toEqual(schoolingOf(sim)!.timetable);
  });
});

describe('the marks', () => {
  it('moves them on turning up and working, and takes them off skipping', () => {
    const worker = atSchool('worker', 2011);
    const before = averageMark(schoolingOf(worker)!);
    for (let day = 0; day < 25; day++) { goToSchool(worker, 'hard'); worker.advanceTo(worker.now + MS_DAY); }
    expect(averageMark(schoolingOf(worker)!)).toBeGreaterThan(before);
    expect(attendance(schoolingOf(worker)!)).toBe(100);

    const truant = atSchool('truant', 2011);
    const started = averageMark(schoolingOf(truant)!);
    for (let day = 0; day < 25; day++) {
      for (let tries = 0; tries < 9; tries++) {
        if (truant.execute({ kind: 'school.skip', payload: {} }).ok) break;
        truant.advanceTo(truant.now + MS_DAY / 2);
      }
      truant.advanceTo(truant.now + MS_DAY);
    }
    expect(averageMark(schoolingOf(truant)!)).toBeLessThan(started);
    expect(attendance(schoolingOf(truant)!)).toBeLessThan(60);
  });

  it('says plainly whether these marks open a university', () => {
    const sim = atSchool('standing', 2011);
    const schooling = schoolingOf(sim)!;
    for (const mark of schooling.marks) mark.mark = 92;
    const strong = standingOn(schooling);
    expect(strong.university).toBe(true);
    expect(strong.scholarship).toBe(true);
    for (const mark of schooling.marks) mark.mark = 40;
    const weak = standingOn(schooling);
    expect(weak.university).toBe(false);
    expect(weak.scholarship).toBe(false);
    expect(ACADEMIC_SCHOLARSHIP).toBeGreaterThan(UNIVERSITY_LOOKS_AT);
  });

  it('refuses a school day when there is no school', () => {
    const sim = atSchool('weekend', 2011);
    while (isASchoolDay(sim)) sim.advanceTo(sim.now + MS_DAY);
    expect(todaysLessons(sim, schoolingOf(sim)!).length).toBe(0);
    const res = sim.execute({ kind: 'school.attend', payload: {} });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/no school today/i);
  });

  it('carries a mark for every subject on the timetable', () => {
    const sim = atSchool('marks', 2011);
    const schooling = schoolingOf(sim)!;
    const taught = new Set(schooling.timetable.map((one) => one.subjectId));
    for (const subjectId of taught) expect(markFor(schooling, subjectId).mark).toBeGreaterThan(0);
  });
});

describe('the play', () => {
  it('is cast out of the drama club and not out of the air', () => {
    const sim = atSchool('nodrama', 2010);
    const refused = sim.execute({ kind: 'school.audition', payload: {} });
    expect(refused.ok).toBe(false);
    expect(refused.error).toMatch(/drama club/i);

    expect(sim.execute({ kind: 'school.join_club', payload: { clubId: 'drama' } }).ok).toBe(true);
    const cast = sim.execute<{ part: string; title: string }>({ kind: 'school.audition', payload: {} });
    expect(cast.ok, cast.error).toBe(true);
    expect(SCHOOL_PLAYS.some((one) => one.title === cast.value!.title)).toBe(true);
    // And only once a year.
    expect(sim.execute({ kind: 'school.audition', payload: {} }).ok).toBe(false);
  });

  it('gives the same school the same play all year', () => {
    const sim = atSchool('sameplay', 2010);
    const first = productionFor(sim, schoolingOf(sim)!);
    sim.advanceTo(sim.now + 30 * MS_DAY);
    expect(productionFor(sim, schoolingOf(sim)!).id).toBe(first.id);
  });

  it('keeps three clubs as the most anybody can keep up', () => {
    const sim = atSchool('clubs', 2010);
    const open = CLUBS.filter((one) => ageOf(sim) >= one.fromAge);
    for (const club of open.slice(0, 3)) {
      expect(sim.execute({ kind: 'school.join_club', payload: { clubId: club.id } }).ok, club.id).toBe(true);
    }
    const fourth = sim.execute({ kind: 'school.join_club', payload: { clubId: open[3]!.id } });
    expect(fourth.ok).toBe(false);
    expect(fourth.error).toMatch(/Three is as many/);
  });

  it('performs it, writes it down, and never twice', () => {
    const sim = atSchool('night', 2009);
    sim.execute({ kind: 'school.join_club', payload: { clubId: 'drama' } });
    expect(sim.execute({ kind: 'school.audition', payload: {} }).ok).toBe(true);
    const part = partThisYear(sim, schoolingOf(sim)!)!;
    expect(part.verdict).toBeUndefined();
    sim.advanceTo(part.performsAt + MS_DAY);
    const after = schoolingOf(sim)!.parts.find((one) => one.id === part.id)!;
    expect(after.verdict).toBeDefined();
    expect(describePart(after)).toContain(after.title);
    const verdict = after.verdict;
    sim.advanceTo(sim.now + 200 * MS_DAY);
    expect(schoolingOf(sim)!.parts.find((one) => one.id === part.id)!.verdict).toBe(verdict);
  });
});

describe('growing into it', () => {
  it('makes a gifted child a gifted child rather than a professional', () => {
    let previous = -1;
    for (const year of [2016, 2014, 2012, 2010, 2008, 2006, 2004]) {
      const sim = atSchool('ladder', year);
      const age = ageOf(sim);
      const strength = auditionStrength(sim);
      expect(strength, `${age}`).toBeGreaterThanOrEqual(previous);
      previous = strength;
      // Whatever is in them, a twelve year old does not walk into the lead.
      if (age <= 12) expect(strength, `${age}`).toBeLessThan(LEAD_TAKES);
      if (age >= 22) expect(strength, `${age}`).toBeGreaterThan(90);
      // What is in there always reads at least as high as what they can do.
      expect(rawTalent(sim)).toBeGreaterThanOrEqual(strength);
      expect(youthFactor(sim)).toBeLessThanOrEqual(1);
    }
  });

  it('lets a scout read the potential rather than the finished thing', () => {
    // Which is what makes being found as a child possible at all.
    const sim = atSchool('scout', 2009);
    expect(rawTalent(sim)).toBeGreaterThanOrEqual(NOTICED_AT);
    expect(auditionStrength(sim)).toBeLessThan(rawTalent(sim));
  });

  it('moves somebody up a stage without losing what they got at the last one', () => {
    const sim = atSchool('moveup', 2011, 'uk-eng-london');
    const first = schoolingOf(sim)!;
    expect(first.stageId).toBe('secondary');
    for (const mark of first.marks) mark.mark = 80;
    // Sixteen: sixth form, and the GCSE goes on the record.
    sim.player.birthInstant = sim.now - Math.round(16.2 * 365.25 * MS_DAY);
    const next = ensureSchooling(sim)!;
    expect(next.id).not.toBe(first.id);
    expect(next.stageId).toBe('sixthform');
    expect(sim.universe.schooling![first.id]!.endedAt).toBeDefined();
    const held = qualificationsOf(sim);
    expect(held.length).toBeGreaterThan(0);
    expect(held[0]!.name).toBe('GCSE');
    expect(held[0]!.average).toBeGreaterThan(70);
    // And the new record carries the old results forward.
    expect(next.results.some((one) => one.name === 'GCSE')).toBe(true);
  });

  it('leaves school when school is over, keeping what was earned', () => {
    const sim = atSchool('leaver', 2008, 'uk-eng-london');
    const schooling = schoolingOf(sim)!;
    for (const mark of schooling.marks) mark.mark = 76;
    sim.player.birthInstant = sim.now - Math.round(19.2 * 365.25 * MS_DAY);
    expect(ensureSchooling(sim)).toBeUndefined();
    expect(schoolingOf(sim)).toBeUndefined();
    expect(qualificationsOf(sim).length).toBeGreaterThan(0);
  });

  it('gives every city a school to go to', () => {
    for (const cityId of ['us-ca-losangeles', 'uk-eng-london', 'jp-13-tokyo', 'sa-10-riyadh', 'br-27-saopaulo']) {
      const schools = placesIn(cityId).filter((one) => one.kind.endsWith('_school'));
      expect(schools.filter((one) => one.kind === 'primary_school').length, cityId).toBeGreaterThan(0);
      expect(schools.filter((one) => one.kind === 'secondary_school').length, cityId).toBeGreaterThan(0);
    }
  });

  it('puts a thirteen year old somewhere that is not called a high school', () => {
    const sim = atSchool('middle', 2012, 'us-ca-losangeles');
    expect(stageFor(sim)!.label).toBe('Middle School');
    expect(schoolingOf(sim)!.placeName).not.toMatch(/high school/i);
    expect(systemFor(sim).id).toBe('us');
  });
});

describe('the school an adult already left', () => {
  it('gives somebody who starts life grown up the record they would have', () => {
    const sim = quickSave(
      { birthYear: 1996, startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london' },
      'leaver-uk',
    );
    expect(ageOf(sim)).toBeGreaterThan(20);
    // Not still at school, but not carrying nothing either.
    expect(schoolingOf(sim)).toBeUndefined();
    const history = schoolHistoryOf(sim);
    expect(history).toHaveLength(1);
    expect(history[0]!.endedAt).toBeDefined();
    expect(history[0]!.endReason).toBe('left school');
    expect(history[0]!.placeName.length).toBeGreaterThan(3);
    // With the qualification the last stage of their country awards.
    const quals = qualificationsOf(sim);
    expect(quals).toHaveLength(1);
    expect(quals[0]!.name).toBe('A Level');
    expect(quals[0]!.average).toBeGreaterThan(0);
    // Dated to when they would have finished, not to today.
    expect(quals[0]!.at).toBeLessThan(sim.now);
  });

  it('carries marks a university can read, so an adult is not refused for having none', () => {
    for (const [year, cityId] of [[2004, 'us-ca-losangeles'], [1990, 'jp-13-tokyo']] as const) {
      const sim = quickSave({ birthYear: year, startLocationId: cityId, homeRegionId: cityId }, `leaver-${year}`);
      expect(marksOn(sim), cityId).toBeGreaterThan(20);
    }
  });

  it('leaves somebody still at school alone', () => {
    const sim = quickSave(
      { birthYear: 2010, startLocationId: 'us-ca-losangeles', homeRegionId: 'us-ca-losangeles' },
      'leaver-child',
    );
    expect(schoolingOf(sim)).toBeDefined();
    expect(schoolHistoryOf(sim)).toHaveLength(1);
    // Asking again writes nothing: the record they have is the record they have.
    expect(ensureSchoolLeaver(sim)).toBeUndefined();
    expect(schoolHistoryOf(sim)).toHaveLength(1);
  });

  it('does not write a second one when it is asked twice', () => {
    const sim = quickSave(
      { birthYear: 1996, startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london' },
      'leaver-twice',
    );
    const before = schoolHistoryOf(sim)[0]!.id;
    expect(ensureSchoolLeaver(sim)).toBeUndefined();
    expect(ensureSchoolLeaver(sim)).toBeUndefined();
    expect(schoolHistoryOf(sim)).toHaveLength(1);
    expect(schoolHistoryOf(sim)[0]!.id).toBe(before);
  });
});
