/**
 * The big tests, the grade, and the report that comes home.
 *
 * What a test can hold: an examination that is the examination it really is,
 * a scale that runs the way that country's scale really runs, a score built
 * out of the marks somebody actually has rather than out of nowhere, a result
 * that arrives when results arrive rather than in the hall, and a report card
 * whose grades are printed in the country's own letters and numbers.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import {
  ALL_TESTS, EXAM_NOTE, GRADE_SCALES, PREP_CEILING, PROGRESS_COMMENTS, REPORT_COMMENTS,
  STATE_TESTS, TERM_PATTERNS, TEST_BY_ID, averageFor, gradeFor, scaleIn, scaleIsCountrys,
  stateTestFor, termsAreCountrys, termsIn, testsAreCountrys, testsFor,
} from '@/engine/content/exams';
import {
  effortOf, paperFor, predictFor, prepWorth, readingFor, reportsOf, resultsOf, sittingsOf,
  sittingsToCome, stateAssessmentFor, testById, testsOpenTo, writeReport,
} from '@/engine/systems/exams';
import { schoolingOf } from '@/engine/systems/school';
import { MS_DAY } from '@/engine/core/time';
import { MARK_BANDS } from '@/engine/content/schooling';
import type { Simulation } from '@/engine/core/simulation';

/** Somebody at school, where you say. */
function aPupil(seed: string, birthYear = 2010, cityId = 'uk-eng-london'): Simulation {
  return quickSave({ birthYear, startLocationId: cityId, homeRegionId: cityId }, seed);
}

// ---------------------------------------------------------------------------

describe('the examinations, which are real', () => {
  it('carries the scales the famous ones really use', () => {
    expect(TEST_BY_ID.sat!.min).toBe(400);
    expect(TEST_BY_ID.sat!.max).toBe(1600);
    expect(TEST_BY_ID.act!.max).toBe(36);
    expect(TEST_BY_ID.gaokao!.max).toBe(750);
    expect(TEST_BY_ID.ib!.max).toBe(45);
    expect(TEST_BY_ID.ielts!.max).toBe(9);
    expect(TEST_BY_ID.atar!.max).toBe(99.95);
    // And the months they really run in.
    expect(TEST_BY_ID.suneung!.month).toBe(11);
    expect(TEST_BY_ID.gaokao!.month).toBe(6);
    expect(TEST_BY_ID.kyotsu!.month).toBe(1);
  });

  it('opens a test only where and when it is really sat', () => {
    expect(testsFor('us', 16).some((one) => one.id === 'sat')).toBe(true);
    expect(testsFor('uk', 15).some((one) => one.id === 'gcse_mocks')).toBe(true);
    expect(testsFor('kr', 18).some((one) => one.id === 'suneung')).toBe(true);
    // Not somebody else's, and not at an age nobody sits it.
    expect(testsFor('uk', 18).some((one) => one.id === 'sat')).toBe(false);
    expect(testsFor('us', 8).some((one) => one.id === 'sat')).toBe(false);
    expect(testsAreCountrys('fr')).toBe(true);
    expect(testsAreCountrys('zz')).toBe(false);
    // The international programs are sat anywhere, which is the point of them.
    expect(testsFor('zz', 18).some((one) => one.id === 'ib')).toBe(true);
  });

  it('names the state assessments it knows and does not invent the ones it does not', () => {
    expect(stateTestFor('us-tx').short).toBe('STAAR');
    expect(stateTestFor('us-tx').carried).toBe(true);
    expect(stateTestFor('us-ny').name).toMatch(/Regents/);
    const unnamed = stateTestFor('us-zz');
    expect(unnamed.carried).toBe(false);
    expect(unnamed.name).toBe('The State Assessment');
    expect(Object.keys(STATE_TESTS).length).toBeGreaterThan(30);
    // A state assessment is built for a state and for nowhere else.
    expect(stateAssessmentFor('us-ca')).toBeDefined();
    expect(stateAssessmentFor('uk-eng')).toBeUndefined();
  });
});

describe('the grade the country actually prints', () => {
  it('runs the German scale the other way round, and says so', () => {
    expect(scaleIn('de').direction).toBe('low');
    expect(gradeFor(95, 'de').label).toBe('1');
    expect(gradeFor(10, 'de').label).toBe('6');
    const good = averageFor(95, 'de')!;
    const bad = averageFor(10, 'de')!;
    expect(good.value).toBeLessThan(bad.value);
  });

  it('gives an American a letter and a grade point average out of four', () => {
    expect(gradeFor(96, 'us').label).toBe('A');
    expect(gradeFor(20, 'us').label).toBe('F');
    const gpa = averageFor(95, 'us')!;
    expect(gpa.max).toBe(4);
    expect(gpa.value).toBeGreaterThan(averageFor(50, 'us')!.value);
  });

  it('falls to a plain scale where it does not carry the country’s own', () => {
    expect(scaleIsCountrys('uk')).toBe(true);
    expect(scaleIsCountrys('zz')).toBe(false);
    expect(scaleIn('zz').id).toBe('general');
    // Every scale reaches the bottom, so no mark is ungradeable.
    for (const scale of GRADE_SCALES) {
      expect(scale.bands[scale.bands.length - 1]!.from).toBe(0);
      expect(gradeFor(0, scale.countryIds[0] ?? 'zz')).toBeDefined();
    }
  });
});

describe('the school year', () => {
  it('opens where each country really opens it', () => {
    expect(termsIn('jp').terms[0]!.startMonth).toBe(4);
    expect(termsIn('uk').terms).toHaveLength(3);
    expect(termsIn('au').terms[0]!.startMonth).toBeLessThanOrEqual(2);
    expect(termsAreCountrys('us')).toBe(true);
    expect(termsAreCountrys('zz')).toBe(false);
    for (const pattern of TERM_PATTERNS) {
      const months = pattern.terms.reduce((sum, one) => sum + one.months, 0);
      expect(months).toBeLessThanOrEqual(12);
      expect(months).toBeGreaterThanOrEqual(8);
    }
  });

  it('has a comment for every band a mark can land in', () => {
    for (const band of MARK_BANDS) {
      expect(REPORT_COMMENTS[band.label], band.label).toBeDefined();
      expect(PROGRESS_COMMENTS[band.label], band.label).toBeDefined();
    }
    const all = Object.values(REPORT_COMMENTS).flat();
    expect(new Set(all).size).toBe(all.length);
  });
});

describe('sitting one', () => {
  it('puts the national ones on the calendar without being asked', () => {
    const sim = aPupil('exam-auto', 2012, 'us-tx-houston');
    const down = sittingsOf(sim);
    expect(down.length).toBeGreaterThan(0);
    const test = testById(sim, down[0]!.testId)!;
    expect(test.kind).toBe('national');
    expect(down[0]!.sitsAt).toBeGreaterThan(sim.now);
    // And a Texan is only ever offered Texas's own assessment, never another
    // state's and never a test sat on the other side of the world.
    const open = testsOpenTo(sim);
    expect(open.length).toBeGreaterThan(0);
    for (const one of open) {
      if (one.regionIds?.length) expect(one.regionIds).toContain('us-tx');
      else if (one.countryIds.length) expect(one.countryIds).toContain('us');
    }
    expect(open.some((one) => one.id === 'gaokao')).toBe(false);
  });

  it('takes an entry, charges the fee, and refuses a second entry for the same test', () => {
    const sim = aPupil('exam-enter', 2009, 'us-ca-losangeles');
    const before = sim.ledger.availableFunds(sim.player.primaryAccountId!);
    const res = sim.execute<{ fee: number; sitsAt: number }>({ kind: 'exam.register', payload: { testId: 'sat' } });
    expect(res.ok, res.error).toBe(true);
    expect(res.value!.fee).toBe(TEST_BY_ID.sat!.fee);
    expect(sim.ledger.availableFunds(sim.player.primaryAccountId!)).toBe(before - res.value!.fee);
    expect(res.value!.sitsAt).toBeGreaterThan(sim.now);
    expect(sim.execute({ kind: 'exam.register', payload: { testId: 'sat' } }).ok).toBe(false);
    // And not one nobody sits where you are.
    expect(sim.execute({ kind: 'exam.register', payload: { testId: 'gaokao' } }).ok).toBe(false);
  });

  it('builds a score out of the marks the paper actually reads', () => {
    const sim = aPupil('exam-score', 2009, 'us-ca-losangeles');
    const schooling = schoolingOf(sim)!;
    const test = TEST_BY_ID.sat!;
    // Somebody who is good at mathematics and not at anything else scores
    // better on the mathematics paper than on the other one.
    for (const mark of schooling.marks) mark.mark = mark.subjectId === 'mathematics' ? 95 : 30;
    const maths = test.sections.find((one) => one.id === 'math')!;
    const rw = test.sections.find((one) => one.id === 'rw')!;
    expect(readingFor(schooling, maths)).toBeGreaterThan(readingFor(schooling, rw));
    expect(paperFor(schooling, test)).toBeGreaterThan(0);
  });

  it('is worth revising for, up to a ceiling and no further', () => {
    const sim = aPupil('exam-study', 2009, 'us-ca-losangeles');
    sim.execute({ kind: 'exam.register', payload: { testId: 'act' } });
    const sitting = sittingsToCome(sim).find((one) => one.testId === 'act')!;
    const first = sim.execute<{ worth: number }>({ kind: 'exam.study', payload: { sittingId: sitting.id } });
    expect(first.ok, first.error).toBe(true);
    expect(first.value!.worth).toBeGreaterThan(0);
    // Keep going and it stops helping, and says so rather than silently doing nothing.
    for (let i = 0; i < 20; i += 1) {
      sim.player.wellbeing.energy = 100;
      if (!sim.execute({ kind: 'exam.study', payload: { sittingId: sitting.id } }).ok) break;
    }
    expect(prepWorth(sitting)).toBeLessThanOrEqual(PREP_CEILING);
    sim.player.wellbeing.energy = 100;
    const over = sim.execute({ kind: 'exam.study', payload: { sittingId: sitting.id } });
    expect(over.ok).toBe(false);
    expect(over.error).toMatch(/papers/i);
  });

  it('will not let anybody sit it early, or twice, and does not say the score in the hall', () => {
    const sim = aPupil('exam-sit', 2009, 'us-ca-losangeles');
    sim.execute({ kind: 'exam.register', payload: { testId: 'act' } });
    const sitting = sittingsToCome(sim).find((one) => one.testId === 'act')!;
    expect(sim.execute({ kind: 'exam.sit', payload: { sittingId: sitting.id } }).ok).toBe(false);
    sim.advanceTo(sitting.sitsAt);
    const sat = sim.execute<{ score: number; note: string; resultsAt: number }>(
      { kind: 'exam.sit', payload: { sittingId: sitting.id } },
    );
    expect(sat.ok, sat.error).toBe(true);
    expect(sat.value!.score).toBeGreaterThanOrEqual(TEST_BY_ID.act!.min);
    expect(sat.value!.score).toBeLessThanOrEqual(TEST_BY_ID.act!.max);
    // Nobody walks out of a hall knowing what they got.
    expect(sat.value!.note).not.toMatch(new RegExp(`\\b${sat.value!.score}\\b`));
    expect(sat.value!.resultsAt).toBeGreaterThan(sim.now);
    expect(sim.execute({ kind: 'exam.sit', payload: { sittingId: sitting.id } }).ok).toBe(false);
  });

  it('releases the result weeks later and remembers it', () => {
    const sim = aPupil('exam-result', 2009, 'us-ca-losangeles');
    sim.execute({ kind: 'exam.register', payload: { testId: 'act' } });
    const sitting = sittingsToCome(sim).find((one) => one.testId === 'act')!;
    sim.advanceTo(sitting.sitsAt);
    sim.execute({ kind: 'exam.sit', payload: { sittingId: sitting.id } });
    expect(sitting.released).toBeFalsy();
    sim.advanceTo(sitting.resultsAt! + MS_DAY);
    expect(sitting.released).toBe(true);
    expect(resultsOf(sim).some((one) => one.id === sitting.id)).toBe(true);
    expect(sim.universe.history.some((one) => one.category === 'education')).toBe(true);
  });

  it('lets you take your name off one, and then it is not on the list', () => {
    const sim = aPupil('exam-withdraw', 2009, 'us-ca-losangeles');
    sim.execute({ kind: 'exam.register', payload: { testId: 'act' } });
    const sitting = sittingsToCome(sim).find((one) => one.testId === 'act')!;
    const off = sim.execute({ kind: 'exam.withdraw', payload: { sittingId: sitting.id } });
    expect(off.ok, off.error).toBe(true);
    expect(sittingsToCome(sim).some((one) => one.id === sitting.id)).toBe(false);
    // And it can be entered again, because a withdrawal is not a sitting.
    expect(sim.execute({ kind: 'exam.register', payload: { testId: 'act' } }).ok).toBe(true);
  });

  it('predicts a range before the day that is on the test’s own scale', () => {
    const sim = aPupil('exam-predict', 2009, 'us-ca-losangeles');
    sim.execute({ kind: 'exam.register', payload: { testId: 'sat' } });
    const sitting = sittingsToCome(sim).find((one) => one.testId === 'sat')!;
    const guess = predictFor(sim, sitting)!;
    expect(guess.low).toBeLessThanOrEqual(guess.high);
    expect(guess.low).toBeGreaterThanOrEqual(TEST_BY_ID.sat!.min);
    expect(guess.high).toBeLessThanOrEqual(TEST_BY_ID.sat!.max);
  });
});

describe('the report that comes home', () => {
  it('grades every subject on the timetable, in the country’s own scale', () => {
    const sim = aPupil('report');
    const schooling = schoolingOf(sim)!;
    const card = writeReport(sim, schooling, 'report');
    const onTimetable = new Set(schooling.timetable.map((one) => one.subjectId));
    expect(card.lines.length).toBeGreaterThan(0);
    for (const line of card.lines) {
      expect(onTimetable.has(line.subjectId)).toBe(true);
      expect(scaleIn('uk').bands.some((band) => band.label === line.grade)).toBe(true);
      expect(line.comment.length).toBeGreaterThan(20);
    }
    expect(new Set(card.lines.map((one) => one.subjectId)).size).toBe(card.lines.length);
    expect(reportsOf(sim)[0]!.id).toBe(card.id);
  });

  it('is on the calendar and arrives on its own', () => {
    const sim = aPupil('report-arrives');
    const schooling = schoolingOf(sim)!;
    expect(schooling.nextReportAt).toBeDefined();
    expect(schooling.nextReportAt!).toBeGreaterThan(sim.now);
    sim.advanceTo(schooling.nextReportAt! + MS_DAY);
    expect(schooling.reports.length).toBeGreaterThan(0);
    // And the next one is put on the calendar behind it.
    expect(schooling.nextReportAt!).toBeGreaterThan(sim.now);
  });

  it('says what effort was, and it is not the same as what the marks were', () => {
    const sim = aPupil('report-effort');
    const schooling = schoolingOf(sim)!;
    for (const mark of schooling.marks) { mark.attended = 40; mark.missed = 0; }
    const trying = effortOf(schooling);
    for (const mark of schooling.marks) { mark.attended = 10; mark.missed = 30; }
    const not = effortOf(schooling);
    expect(trying).toBeGreaterThan(not);
    expect(trying).toBeLessThanOrEqual(100);
    expect(not).toBeGreaterThanOrEqual(0);
  });
});

describe('what is claimed', () => {
  it('says out loud what is real and what is SLATE’s own', () => {
    expect(EXAM_NOTE).toMatch(/scales/);
    expect(EXAM_NOTE).toMatch(/SLATE/);
    expect(ALL_TESTS.length).toBeGreaterThan(40);
  });
});
