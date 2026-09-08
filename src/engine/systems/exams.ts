/**
 * SLATE — the big tests, and the report that comes home.
 *
 * The examinations are real and their scales are real. Everything about how a
 * particular character performs on one is SLATE's own: a score is built out of
 * the marks they actually have in the subjects the paper actually reads, moved
 * by how much preparation they did and by what nerve does on the day, and then
 * put onto the real scale of the real test. It is not a prediction about
 * anybody and the room says so.
 *
 * A report card is the other half of the same idea. A term ends, every subject
 * is graded in the country's own scale, a teacher writes a line about it, and
 * it arrives — which is exactly the shape of the thing in life.
 */

import { CommandError, type Simulation } from '../core/simulation';
import type { ExamSitting, Id, Person, ReportCard, ReportLine, Schooling } from '../domain/model';
import type { Instant } from '../core/time';
import { MS_DAY, MS_HOUR, addDays, formatDate, zonedParts } from '../core/time';
import { clamp } from '../core/rng';
import { formatMoney } from '../core/money';
import { plural } from '../core/text';
import { countryOfCity, CITIES } from '../content/geography';
import { ageOf } from './lifespan';
import {
  ALL_TESTS, EFFORT_LEVELS, EXAM_NOTE, GRADE_NOTE, NERVE_SWING, PREP_CEILING, PREP_NOTE,
  PREP_PER_SESSION, PROGRESS_COMMENTS, REPORT_COMMENTS, REPORT_NOTE, SITTING_NOTE,
  STATE_TESTS, STATE_TEST_FROM, STATE_TEST_MONTH, STATE_TEST_NOTE, STATE_TEST_TO, TERM_NOTE,
  TEST_BY_ID, TEST_KIND_LABEL, type StandardTest, averageFor, effortLabel, gradeFor, scaleIn,
  scaleIsCountrys, stateTestFor, termsAreCountrys, termsIn, testsAreCountrys, testsFor,
} from '../content/exams';
import { markLabel } from '../content/schooling';
import { attendance, averageMark, markFor, schoolingOf } from './school';

// ---------------------------------------------------------------------------
// Where you are, for the purposes of a test
// ---------------------------------------------------------------------------

/** The country whose examinations somebody sits, which is where they are. */
export function examCountryFor(sim: Simulation, person: Person = sim.player): string {
  return countryOfCity(person.currentLocationId) ?? person.citizenshipId;
}

/** The state or province, for the tests a state sets rather than a country. */
export function examRegionFor(sim: Simulation, person: Person = sim.player): string | undefined {
  return CITIES.get(person.currentLocationId ?? '')?.parentId;
}

/**
 * The state assessment, which is a real thing everywhere in America and is on
 * the calendar whether anybody cares about it or not.
 *
 * It is built rather than listed because fifty one states is fifty one rows of
 * the same shape, and because a state SLATE does not carry the name for still
 * tests its schools and should still say so.
 */
export function stateAssessmentFor(regionId: string): StandardTest | undefined {
  if (!regionId.startsWith('us-')) return undefined;
  const named = stateTestFor(regionId);
  return {
    id: `state_${regionId.replace('-', '_')}`,
    name: named.name,
    shortName: named.short,
    kind: 'national',
    countryIds: [],
    regionIds: [regionId],
    fromAge: STATE_TEST_FROM,
    toAge: STATE_TEST_TO,
    month: STATE_TEST_MONTH,
    min: 0,
    max: 100,
    fee: 0,
    retakes: 0,
    resultsAfterDays: 75,
    sections: [{
      id: 'paper',
      label: 'The Papers',
      min: 0,
      max: 100,
      reads: [
        { subjectId: 'language', share: 0.34 },
        { subjectId: 'mathematics', share: 0.33 },
        { subjectId: 'science', share: 0.33 },
      ],
    }],
    about: named.about,
  };
}

/** Every test somebody could put their name down for this year. */
export function testsOpenTo(sim: Simulation, person: Person = sim.player): StandardTest[] {
  const age = ageOf(sim, person);
  const countryId = examCountryFor(sim, person);
  const regionId = examRegionFor(sim, person);
  const open = [...testsFor(countryId, age, regionId)];
  const state = regionId ? stateAssessmentFor(regionId) : undefined;
  if (state && age >= state.fromAge && age <= state.toAge) open.push(state);
  return open;
}

/** A test by its id, including the state assessments that are built rather than listed. */
export function testById(_sim: Simulation, testId: string): StandardTest | undefined {
  const listed = TEST_BY_ID[testId];
  if (listed) return listed;
  if (!testId.startsWith('state_')) return undefined;
  return stateAssessmentFor(testId.slice('state_'.length).replace('_', '-'));
}

// ---------------------------------------------------------------------------
// What is on the record
// ---------------------------------------------------------------------------

/** Every test somebody has put their name down for or already sat. */
export function sittingsOf(sim: Simulation, personId: Id = sim.player.id): ExamSitting[] {
  const schooling = schoolingOf(sim, personId);
  return schooling?.sittings ?? [];
}

/** The ones still ahead, soonest first. */
export function sittingsToCome(sim: Simulation, personId: Id = sim.player.id): ExamSitting[] {
  return sittingsOf(sim, personId)
    .filter((one) => !one.satAt && one.sitsAt >= sim.now)
    .sort((a, b) => a.sitsAt - b.sitsAt);
}

/** The ones behind, newest first, with the ones whose results are out marked. */
export function resultsOf(sim: Simulation, personId: Id = sim.player.id): ExamSitting[] {
  return sittingsOf(sim, personId)
    .filter((one) => one.satAt !== undefined)
    .sort((a, b) => (b.satAt ?? 0) - (a.satAt ?? 0));
}

/** How many times this test has already been sat, for the retake limit. */
export function attemptsAt(sim: Simulation, testId: string, personId: Id = sim.player.id): number {
  return sittingsOf(sim, personId).filter((one) => one.testId === testId && one.satAt).length;
}

/** Whether they are already down for this one. */
export function alreadyDownFor(sim: Simulation, testId: string, personId: Id = sim.player.id): boolean {
  return sittingsOf(sim, personId).some((one) => one.testId === testId && !one.satAt);
}

/** The next date this test runs on, which is its real month next time it comes round. */
export function nextSittingDate(sim: Simulation, test: StandardTest): Instant {
  const here = zonedParts(sim.now, sim.homeZone);
  const thisYear = Date.UTC(here.year, test.month - 1, 15, 9, 0, 0);
  // Six weeks is the shortest notice anybody sits a public examination on.
  if (thisYear - sim.now > 42 * MS_DAY) return thisYear;
  return Date.UTC(here.year + 1, test.month - 1, 15, 9, 0, 0);
}

// ---------------------------------------------------------------------------
// What a paper is worth to somebody
// ---------------------------------------------------------------------------

/**
 * How well somebody knows the material a section reads, out of a hundred.
 *
 * A paper is not a general test of a person: it reads particular subjects, and
 * what somebody has in those subjects is what they bring to it. A subject
 * nobody is taught yet contributes what it is worth, which is nothing much.
 */
export function readingFor(schooling: Schooling, section: StandardTest['sections'][number]): number {
  let total = 0;
  let weight = 0;
  for (const read of section.reads) {
    const mark = schooling.marks.find((one) => one.subjectId === read.subjectId);
    total += (mark?.mark ?? 0) * read.share;
    weight += read.share;
  }
  return weight > 0 ? total / weight : 0;
}

/** What the whole paper is worth, before the day itself gets involved. */
export function paperFor(schooling: Schooling, test: StandardTest): number {
  if (test.sections.length === 0) return averageMark(schooling);
  const total = test.sections.reduce((sum, one) => sum + readingFor(schooling, one), 0);
  return total / test.sections.length;
}

/** What the preparation already done is worth, up to its ceiling. */
export function prepWorth(sitting: ExamSitting): number {
  return Math.min(PREP_CEILING, sitting.prep * PREP_PER_SESSION);
}

/** Putting a quality out of a hundred onto the real scale of a real test. */
export function onScale(quality: number, min: number, max: number): number {
  const share = clamp(quality, 0, 100) / 100;
  const raw = min + share * (max - min);
  // Whole numbers everywhere except the scales that really report fractions.
  const fractional = max <= 10 || max === 99.95;
  return fractional ? Math.round(raw * 100) / 100 : Math.round(raw);
}

/**
 * What somebody would score if they sat it now, which the page shows before
 * the day so that a decision to sit it is a decision rather than a coin toss.
 */
export function predictFor(sim: Simulation, sitting: ExamSitting): { low: number; high: number } | undefined {
  const schooling = schoolingOf(sim);
  const test = testById(sim, sitting.testId);
  if (!schooling || !test) return undefined;
  const base = paperFor(schooling, test) + prepWorth(sitting);
  return {
    low: onScale(base - NERVE_SWING, test.min, test.max),
    high: onScale(base + NERVE_SWING, test.min, test.max),
  };
}

// ---------------------------------------------------------------------------
// The report that comes home
// ---------------------------------------------------------------------------

/** Which term the school year is in, where you are. */
export function termNow(sim: Simulation, countryId: string): { label: string; index: number } {
  const pattern = termsIn(countryId);
  const month = zonedParts(sim.now, sim.homeZone).month;
  for (let i = 0; i < pattern.terms.length; i += 1) {
    const term = pattern.terms[i]!;
    for (let step = 0; step < term.months; step += 1) {
      if (((term.startMonth - 1 + step) % 12) + 1 === month) return { label: term.label, index: i };
    }
  }
  // The holidays, which every year has and which belong to the term behind them.
  const last = pattern.terms.length - 1;
  return { label: pattern.terms[last]!.label, index: last };
}

/** How hard somebody has been working, read off the record rather than asserted. */
export function effortOf(schooling: Schooling): number {
  const sat = schooling.marks.reduce((sum, one) => sum + one.attended, 0);
  const gone = schooling.marks.reduce((sum, one) => sum + one.missed, 0);
  if (sat + gone === 0) return 60;
  const turningUp = (sat / (sat + gone)) * 100;
  // Turning up is most of it, and the marks say whether anything happened
  // while you were there.
  return clamp(Math.round(turningUp * 0.65 + averageMark(schooling) * 0.35), 0, 100);
}

/** The line a report card carries for one subject. */
function lineFor(
  sim: Simulation, schooling: Schooling, countryId: string, subjectId: string,
  kind: 'report' | 'progress', effort: number,
): ReportLine {
  const mark = markFor(schooling, subjectId);
  const band = markLabel(mark.mark);
  const bank = kind === 'report' ? REPORT_COMMENTS : PROGRESS_COMMENTS;
  const lines = bank[band] ?? bank.Sound!;
  const rng = sim.rng('school.report', schooling.id, subjectId, String(schooling.reports.length));
  const sat = mark.attended + mark.missed;
  return {
    subjectId,
    mark: Math.round(mark.mark * 10) / 10,
    grade: gradeFor(mark.mark, countryId).label,
    effort: effortLabel(effort),
    comment: rng.pick(lines),
    attendance: sat > 0 ? Math.round((mark.attended / sat) * 100) : 100,
  };
}

/**
 * Writing the report.
 *
 * Every subject on the timetable gets a line, in the country's own scale, with
 * a comment that is about the work rather than about the child. The average
 * the country reports alongside it, where it reports one, is on the front.
 */
export function writeReport(
  sim: Simulation, schooling: Schooling, kind: 'report' | 'progress',
): ReportCard {
  const countryId = examCountryFor(sim);
  const term = termNow(sim, countryId);
  const effort = effortOf(schooling);
  const average = averageMark(schooling);
  const reported = averageFor(average, countryId);
  const subjects = [...new Set(schooling.timetable.map((one) => one.subjectId))];
  const card: ReportCard = {
    id: sim.nextId('report'),
    at: sim.now,
    kind,
    termLabel: term.label,
    lines: subjects.map((one) => lineFor(sim, schooling, countryId, one, kind, effort)),
    average: Math.round(average * 10) / 10,
    averageLabel: reported?.label,
    averageValue: reported?.value,
    attendance: Math.round(attendance(schooling)),
    headline: kind === 'report'
      ? `${term.label} at ${schooling.placeName}. ${markLabel(average)} overall, ${effortLabel(effort).toLowerCase()} effort.`
      : `Halfway through ${term.label.toLowerCase()}. ${markLabel(average)} overall.`,
  };
  schooling.reports = [...schooling.reports, card].slice(-16);
  return card;
}

/** The reports already written, newest first. */
export function reportsOf(sim: Simulation, personId: Id = sim.player.id): ReportCard[] {
  const schooling = schoolingOf(sim, personId);
  return [...(schooling?.reports ?? [])].sort((a, b) => b.at - a.at);
}

// ---------------------------------------------------------------------------
// Commands and what arrives on its own
// ---------------------------------------------------------------------------

export function registerExams(sim: Simulation): void {
  /** Putting your name down for one. */
  sim.onCommand<{ testId: string }, { name: string; sitsAt: Instant; fee: number; note: string }>(
    'exam.register',
    (p, { sim: s }) => {
      const schooling = schoolingOf(s);
      if (!schooling) throw new CommandError('You are not at school.');
      const test = testsOpenTo(s).find((one) => one.id === p.testId);
      if (!test) throw new CommandError('That is not a test anybody sits at your age, where you are.');
      if (alreadyDownFor(s, test.id)) throw new CommandError(`You are already down for ${test.name}.`);
      const attempt = attemptsAt(s, test.id);
      if (attempt > test.retakes) {
        throw new CommandError(
          test.retakes === 0
            ? `${test.name} is sat once and you have sat it.`
            : `${test.name} may be sat ${plural(test.retakes + 1, 'time')} and you have used them.`,
        );
      }
      const sitsAt = nextSittingDate(s, test);
      if (test.fee > 0) {
        const accountId = s.player.primaryAccountId;
        if (!accountId) throw new CommandError('There is no account to pay the entry fee from.');
        if (s.ledger.availableFunds(accountId) < test.fee) {
          throw new CommandError(`${test.name} costs ${formatMoney(test.fee)} to enter and it is not there.`);
        }
        s.expense(accountId, test.fee, `${test.name} — Entry`, 'education', {
          refType: 'person', refId: s.player.id,
        });
      }
      const sitting: ExamSitting = {
        id: s.nextId('sitting'),
        testId: test.id,
        regionId: test.regionIds?.[0],
        registeredAt: s.now,
        sitsAt,
        prep: 0,
        attempt,
      };
      schooling.sittings = [...schooling.sittings, sitting];
      s.schedule({
        at: sitsAt,
        kind: 'exam.day',
        label: test.shortName ?? test.name,
        category: 'education',
        payload: { sittingId: sitting.id },
        priority: 40,
      });
      s.emit('exam.registered', { testId: test.id, sittingId: sitting.id, at: sitsAt });
      return {
        name: test.name,
        sitsAt,
        fee: test.fee,
        note: `Down for ${test.name} on ${formatDate(sitsAt, s.homeZone)}. `
          + `${TEST_KIND_LABEL[test.kind]}, ${test.min} to ${test.max}.`
          + `${test.fee > 0 ? ` ${formatMoney(test.fee)} to enter.` : ''}`,
      };
    },
  );

  /** Sitting down with a past paper, which is worth something and not everything. */
  sim.onCommand<{ sittingId?: string }, { prep: number; worth: number; note: string }>(
    'exam.study',
    (p, { sim: s }) => {
      const schooling = schoolingOf(s);
      if (!schooling) throw new CommandError('You are not at school.');
      const sitting = p.sittingId
        ? schooling.sittings.find((one) => one.id === p.sittingId)
        : sittingsToCome(s)[0];
      if (!sitting) throw new CommandError('There is nothing coming up to revise for.');
      if (sitting.satAt) throw new CommandError('That one has been sat.');
      const test = testById(s, sitting.testId)!;
      if ((s.player.wellbeing.energy ?? 100) < 15) {
        throw new CommandError('There is nothing left in you. Nothing would go in.');
      }
      if (prepWorth(sitting) >= PREP_CEILING) {
        throw new CommandError(`You have done the papers. More of them is not going to move ${test.name}.`);
      }
      sitting.prep += 1;
      s.advanceTo(s.now + 2 * MS_HOUR);
      s.player.wellbeing.energy = clamp((s.player.wellbeing.energy ?? 100) - 14, 0, 100);
      s.player.wellbeing.stress = clamp((s.player.wellbeing.stress ?? 20) + 3, 0, 100);
      // Working through a paper is still working through the subject.
      const rng = s.rng('exam.study', sitting.id, sitting.prep);
      for (const section of test.sections) {
        for (const read of section.reads) {
          const mark = markFor(schooling, read.subjectId);
          mark.mark = clamp(Math.round((mark.mark + rng.float(0.1, 0.4) * read.share) * 10) / 10, 0, 100);
          if (!schooling.marks.includes(mark)) schooling.marks.push(mark);
        }
      }
      s.emit('exam.studied', { sittingId: sitting.id, prep: sitting.prep });
      return {
        prep: sitting.prep,
        worth: Math.round(prepWorth(sitting) * 10) / 10,
        note: `Two hours on a past ${test.shortName ?? test.name} paper. `
          + `${plural(sitting.prep, 'session')} in, and it is worth about ${Math.round(prepWorth(sitting))} points on the day.`,
      };
    },
  );

  /** The day itself. */
  sim.onCommand<
    { sittingId?: string },
    { name: string; score: number; min: number; max: number; resultsAt: Instant; note: string }
  >(
    'exam.sit',
    (p, { sim: s }) => {
      const schooling = schoolingOf(s);
      if (!schooling) throw new CommandError('You are not at school.');
      const sitting = p.sittingId
        ? schooling.sittings.find((one) => one.id === p.sittingId)
        : sittingsOf(s).find((one) => !one.satAt && Math.abs(one.sitsAt - s.now) < MS_DAY);
      if (!sitting) throw new CommandError('There is nothing to sit today.');
      if (sitting.satAt) throw new CommandError('You have sat that one.');
      const test = testById(s, sitting.testId)!;
      if (s.now < sitting.sitsAt - 12 * MS_HOUR) {
        throw new CommandError(`${test.name} is on ${formatDate(sitting.sitsAt, s.homeZone)}.`);
      }
      if (s.now > sitting.sitsAt + MS_DAY) {
        throw new CommandError(`${test.name} was on ${formatDate(sitting.sitsAt, s.homeZone)} and it has gone.`);
      }

      // What they know, what the revision added, and what the day did.
      const rng = s.rng('exam.sit', sitting.id);
      const tired = (s.player.wellbeing.energy ?? 100) < 35 ? -4 : 0;
      const wound = (s.player.wellbeing.stress ?? 20) > 70 ? -4 : 0;
      const nerve = rng.normal(0, NERVE_SWING / 2);
      const sections = test.sections.map((one) => {
        const own = s.rng('exam.section', sitting.id, one.id).normal(0, 3);
        const quality = clamp(
          readingFor(schooling, one) + prepWorth(sitting) + nerve + own + tired + wound, 0, 100,
        );
        return { id: one.id, label: one.label, score: onScale(quality, one.min, one.max) };
      });
      const quality = clamp(paperFor(schooling, test) + prepWorth(sitting) + nerve + tired + wound, 0, 100);
      const score = test.sections.length > 1 && test.max === test.sections.reduce((sum, o) => sum + o.max, 0)
        ? sections.reduce((sum, one) => sum + one.score, 0)
        : onScale(quality, test.min, test.max);

      sitting.satAt = s.now;
      sitting.score = score;
      sitting.sections = sections;
      sitting.resultsAt = addDays(s.now, test.resultsAfterDays, s.homeZone);
      sitting.released = false;
      s.advanceTo(s.now + 4 * MS_HOUR);
      s.player.wellbeing.energy = clamp((s.player.wellbeing.energy ?? 100) - 22, 0, 100);
      s.player.wellbeing.stress = clamp((s.player.wellbeing.stress ?? 20) + 12, 0, 100);
      s.schedule({
        at: sitting.resultsAt,
        kind: 'exam.results',
        label: `${test.shortName ?? test.name} Results`,
        category: 'education',
        payload: { sittingId: sitting.id },
        priority: 38,
      });
      s.emit('exam.sat', { sittingId: sitting.id, testId: test.id });
      return {
        name: test.name,
        score,
        min: test.min,
        max: test.max,
        resultsAt: sitting.resultsAt,
        // What a character could actually know walking out of a hall is that
        // it is done, not what they got. The score is on the record and the
        // page does not show it until the results are out.
        note: `${test.name} is sat. Results on ${formatDate(sitting.resultsAt, s.homeZone)}, `
          + `and there is nothing to do until then.`,
      };
    },
  );

  /** Not sitting one you are down for. */
  sim.onCommand<{ sittingId: string }, { name: string; note: string }>(
    'exam.withdraw',
    (p, { sim: s }) => {
      const schooling = schoolingOf(s);
      if (!schooling) throw new CommandError('You are not at school.');
      const sitting = schooling.sittings.find((one) => one.id === p.sittingId);
      if (!sitting) throw new CommandError('You are not down for that.');
      if (sitting.satAt) throw new CommandError('That one has been sat.');
      const test = testById(s, sitting.testId)!;
      schooling.sittings = schooling.sittings.filter((one) => one.id !== sitting.id);
      s.emit('exam.withdrawn', { sittingId: sitting.id, testId: test.id });
      return {
        name: test.name,
        note: `Your name is off ${test.name}.`
          + `${test.fee > 0 ? ' The entry fee does not come back.' : ''}`,
      };
    },
  );
}

/**
 * The things that arrive without being asked for: the morning of a test, the
 * results, and the report card.
 */
export function registerExamSchedules(sim: Simulation): void {
  /** The morning of it. */
  sim.onSchedule('exam.day', (item, s) => {
    const schooling = schoolingOf(s);
    const sitting = schooling?.sittings.find((one) => one.id === (item.payload as { sittingId: Id }).sittingId);
    if (!schooling || !sitting || sitting.satAt) return;
    const test = testById(s, sitting.testId);
    if (!test) return;
    const predicted = predictFor(s, sitting);
    s.requireDecision({
      urgency: 84,
      category: 'education',
      title: `${test.name} Is Today`,
      detail: `${TEST_KIND_LABEL[test.kind]}, scored ${test.min} to ${test.max}. `
        + `${plural(sitting.prep, 'past paper')} done`
        + `${predicted ? `, and on this year’s work it is looking like ${predicted.low} to ${predicted.high}` : ''}.`,
      route: '/workspace/education',
      refType: 'sitting',
      refId: sitting.id,
      actions: [
        { label: 'Sit It', commandKind: 'exam.sit', payload: { sittingId: sitting.id } },
        { label: 'Do Not Sit It', commandKind: 'exam.withdraw', payload: { sittingId: sitting.id } },
      ],
    });
  });

  /** And the envelope, weeks later, which is how it really works. */
  sim.onSchedule('exam.results', (item, s) => {
    const schooling = schoolingOf(s);
    const sitting = schooling?.sittings.find((one) => one.id === (item.payload as { sittingId: Id }).sittingId);
    if (!schooling || !sitting || sitting.released || sitting.score === undefined) return;
    const test = testById(s, sitting.testId);
    if (!test) return;
    sitting.released = true;
    const share = (sitting.score - test.min) / Math.max(1, test.max - test.min);
    const how = share >= 0.85 ? 'and it is a very good one'
      : share >= 0.65 ? 'and it is a good one'
        : share >= 0.45 ? 'which is about the middle of it'
          : 'and it is below where you wanted to be';
    s.notify({
      title: `${test.shortName ?? test.name} Results`,
      body: `${sitting.score} out of ${test.max}, ${how}.`
        + `${(sitting.sections?.length ?? 0) > 1
          ? ` ${sitting.sections!.map((one) => `${one.label} ${one.score}`).join(', ')}.`
          : ''}`,
      category: 'education',
      importance: share >= 0.8 ? 72 : 56,
      route: '/workspace/education',
    });
    s.remember({
      category: 'education',
      title: `${test.shortName ?? test.name}: ${sitting.score}`,
      detail: `${test.name}, sat on ${formatDate(sitting.satAt ?? s.now, s.homeZone)}. `
        + `${sitting.score} out of ${test.max}.`,
      refs: [{ type: 'person', id: s.player.id }],
      significance: share >= 0.85 ? 6 : 4,
      public: false,
    });
    s.emit('exam.result', { sittingId: sitting.id, testId: test.id, score: sitting.score });
  });

  /** The report card, at the end of a term, and the progress report halfway through. */
  sim.onSchedule('school.report', (item, s) => {
    const schooling = schoolingOf(s);
    if (!schooling || schooling.endedAt) { scheduleNextReport(s); return; }
    const kind = (item.payload as { kind: 'report' | 'progress' }).kind;
    const card = writeReport(s, schooling, kind);
    s.notify({
      title: kind === 'report' ? `Report Card: ${card.termLabel}` : `Progress Report: ${card.termLabel}`,
      body: `${card.headline}${card.averageLabel ? ` ${card.averageLabel} ${card.averageValue}.` : ''} `
        + `${card.attendance}% attendance.`,
      category: 'education',
      importance: kind === 'report' ? 58 : 40,
      route: '/workspace/education',
    });
    if (kind === 'report') {
      s.remember({
        category: 'education',
        title: `${card.termLabel} Report`,
        detail: card.headline,
        refs: [{ type: 'person', id: s.player.id }],
        significance: 3,
        public: false,
      });
    }
    s.emit('school.reported', { kind, average: card.average, attendance: card.attendance });
    scheduleNextReport(s);
  });
}

/**
 * Putting the next report on the calendar.
 *
 * A term ends when it ends and a progress report comes halfway through, so the
 * next one is worked out from the country's own term pattern rather than from
 * a fixed number of weeks.
 */
export function scheduleNextReport(sim: Simulation): void {
  const schooling = schoolingOf(sim);
  if (!schooling || schooling.endedAt) return;
  const countryId = examCountryFor(sim);
  const pattern = termsIn(countryId);
  const here = zonedParts(sim.now, sim.homeZone);
  // Every date this year and next on which something comes home, in order.
  const dates: { at: Instant; kind: 'report' | 'progress' }[] = [];
  for (const year of [here.year, here.year + 1]) {
    for (const term of pattern.terms) {
      const ends = Date.UTC(year, term.startMonth - 1 + term.months, 0, 16, 0, 0);
      dates.push({ at: ends, kind: 'report' });
      if (pattern.progressReports) {
        const half = Date.UTC(
          year, term.startMonth - 1 + Math.floor(term.months / 2), 15, 16, 0, 0,
        );
        dates.push({ at: half, kind: 'progress' });
      }
    }
  }
  const next = dates.filter((one) => one.at > sim.now + MS_DAY).sort((a, b) => a.at - b.at)[0];
  if (!next) return;
  schooling.nextReportAt = next.at;
  sim.schedule({
    at: next.at,
    kind: 'school.report',
    label: next.kind === 'report' ? 'Report Card' : 'Progress Report',
    category: 'education',
    payload: { kind: next.kind },
    priority: 24,
  });
}

/**
 * Getting the whole thing going for a save that has not had it.
 *
 * Idempotent: it puts the reports on the calendar once, and it puts the tests
 * this year's age really sits on it once, so that a player who never opens the
 * Education page still has the year happen to them.
 */
export function startExams(sim: Simulation): void {
  const schooling = schoolingOf(sim);
  if (!schooling || schooling.endedAt) return;
  schooling.sittings ??= [];
  schooling.reports ??= [];
  if (schooling.nextReportAt === undefined) scheduleNextReport(sim);
  // The national assessments are not opted into: they happen to you.
  for (const test of testsOpenTo(sim)) {
    if (test.kind !== 'national') continue;
    if (test.fee > 0) continue;
    if (alreadyDownFor(sim, test.id) || attemptsAt(sim, test.id) > test.retakes) continue;
    sim.execute({ kind: 'exam.register', payload: { testId: test.id } });
  }
}

export {
  ALL_TESTS, EFFORT_LEVELS, EXAM_NOTE, GRADE_NOTE, PREP_CEILING, PREP_NOTE, REPORT_NOTE,
  SITTING_NOTE, STATE_TESTS, STATE_TEST_NOTE, TERM_NOTE, TEST_KIND_LABEL, effortLabel, gradeFor,
  scaleIn, scaleIsCountrys, stateTestFor, termsAreCountrys, termsIn, testsAreCountrys,
};
