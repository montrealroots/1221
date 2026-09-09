/**
 * The big tests hold up.
 *
 * Every examination in here is a real one and this measures it like published
 * data: a name somebody would recognize, a scale that is the scale it really
 * uses, an age somebody really sits it at, a month it really runs in, and a
 * country the geography has. Nothing invents an examination.
 *
 * The grading scales are measured the same way, including the ones whose good
 * end is the low end, which is the thing that catches everybody out.
 */

import {
  ALL_TESTS, EXAM_NOTE, GENERAL_STATE_TEST, GRADE_NOTE, GRADE_SCALES, PREP_CEILING,
  PREP_PER_SESSION, PROGRESS_COMMENTS, REPORT_COMMENTS, REPORT_NOTE, SITTING_NOTE, STATE_TESTS,
  STATE_TEST_FROM, STATE_TEST_MONTH, STATE_TEST_NOTE, STATE_TEST_TO, TERM_NOTE, TERM_PATTERNS,
  TESTS, TESTS_ELSEWHERE, TEST_BY_ID, TEST_KIND_LABEL, averageFor, effortLabel, gradeFor, scaleIn,
  scaleIsCountrys, stateTestFor, termsAreCountrys, termsIn, testsAreCountrys, testsFor,
} from '../src/engine/content/exams.ts';
import { COUNTRIES, REGIONS } from '../src/engine/content/geography.ts';
import { MARK_BANDS, SUBJECT_BY_ID } from '../src/engine/content/schooling.ts';
import { quickSave } from '../src/engine/index.ts';
import {
  effortOf, paperFor, predictFor, readingFor, reportsOf, resultsOf, sittingsOf, sittingsToCome,
  stateAssessmentFor, testById, testsOpenTo, writeReport,
} from '../src/engine/systems/exams.ts';
import { schoolingOf } from '../src/engine/systems/school.ts';

const problems = [];
const known = new Set(COUNTRIES.all().map((one) => one.id));
const states = new Set(REGIONS.all().filter((one) => one.id.startsWith('us-')).map((one) => one.id));

// --- The examinations, which are real ----------------------------------------

const seen = new Set();
const seenNames = new Set();
for (const test of ALL_TESTS) {
  if (seen.has(test.id)) problems.push(`${test.id} is listed twice`);
  seen.add(test.id);
  if (seenNames.has(test.name)) problems.push(`${test.name} is listed twice`);
  seenNames.add(test.name);
  if (!TEST_KIND_LABEL[test.kind]) problems.push(`${test.name} is a "${test.kind}", which is not a kind`);
  for (const countryId of test.countryIds) {
    if (!known.has(countryId)) problems.push(`${test.name} is sat in ${countryId}, which is not a country`);
  }
  for (const regionId of test.regionIds ?? []) {
    if (!/^[a-z]{2}-/.test(regionId)) problems.push(`${test.name} is sat in ${regionId}, which is not a region`);
  }
  if (test.countryIds.length === 0 && (test.regionIds ?? []).length === 0
    && !['ib', 'ielts'].includes(test.id)) {
    problems.push(`${test.name} is sat nowhere in particular`);
  }
  if (test.fromAge < 8 || test.fromAge > 20) problems.push(`${test.name} is sat from ${test.fromAge}`);
  if (test.toAge < test.fromAge) problems.push(`${test.name} runs out before it starts`);
  if (test.month < 1 || test.month > 12) problems.push(`${test.name} is sat in month ${test.month}`);
  if (test.max <= test.min) problems.push(`${test.name} is scored ${test.min} to ${test.max}`);
  if (test.retakes < 0 || test.retakes > 10) problems.push(`${test.name} may be sat ${test.retakes} more times`);
  if (test.resultsAfterDays < 0 || test.resultsAfterDays > 120) {
    problems.push(`${test.name} takes ${test.resultsAfterDays} days to come back`);
  }
  if (test.fee < 0 || test.fee > 500_00) problems.push(`${test.name} costs ${test.fee} to enter`);
  if (test.about.length < 40) problems.push(`${test.name} has nothing said about it`);
  if (test.sections.length === 0) problems.push(`${test.name} has no papers in it`);
  for (const section of test.sections) {
    if (section.max <= section.min) problems.push(`${test.name}: ${section.label} is scored ${section.min} to ${section.max}`);
    if (section.reads.length === 0) problems.push(`${test.name}: ${section.label} reads nothing`);
    const share = section.reads.reduce((sum, one) => sum + one.share, 0);
    if (Math.abs(share - 1) > 0.02) problems.push(`${test.name}: ${section.label} reads ${share} of a subject`);
    for (const read of section.reads) {
      if (!SUBJECT_BY_ID[read.subjectId]) problems.push(`${test.name} reads "${read.subjectId}", which is not a subject`);
    }
    // A section cannot be worth more than the whole paper it is part of.
    if (section.max > test.max && test.sections.length === 1) {
      problems.push(`${test.name}: ${section.label} is worth more than the whole test`);
    }
  }
}
if (ALL_TESTS.length < 40) problems.push(`only ${ALL_TESTS.length} examinations carried`);

// The scales everybody knows are the scales they really are.
const scaleOf = (id) => { const t = TEST_BY_ID[id]; return t ? `${t.min}-${t.max}` : 'missing'; };
if (scaleOf('sat') !== '400-1600') problems.push('the SAT is not out of 1600');
if (scaleOf('act') !== '1-36') problems.push('the ACT is not out of 36');
if (scaleOf('gaokao') !== '0-750') problems.push('the Gaokao is not out of 750');
if (scaleOf('ib') !== '0-45') problems.push('the IB Diploma is not out of 45');
if (scaleOf('ielts') !== '0-9') problems.push('IELTS is not out of 9');
if (scaleOf('atar') !== '0-99.95') problems.push('the ATAR does not stop at 99.95');
if (TEST_BY_ID.suneung?.month !== 11) problems.push('the Suneung is not sat in November');
if (TEST_BY_ID.gaokao?.month !== 6) problems.push('the Gaokao is not sat in June');
if (TEST_BY_ID.kyotsu?.month !== 1) problems.push('the Japanese Common Test is not sat in January');
if (TEST_BY_ID.enem?.month !== 11) problems.push('ENEM is not sat in November');
// And an examination that was discontinued is not in here.
if (ALL_TESTS.some((one) => /subject test/i.test(one.name))) problems.push('a discontinued examination is carried');
if (!/scales/.test(EXAM_NOTE)) problems.push('the note about the tests has gone');
if (!/moves every year/.test(SITTING_NOTE)) problems.push('the note about the calendar has gone');

// --- The state assessments ----------------------------------------------------

for (const [regionId, named] of Object.entries(STATE_TESTS)) {
  if (!states.has(regionId)) problems.push(`${regionId} has a state test and is not an American state`);
  if (named.name.length < 6) problems.push(`${regionId} has a test with no name`);
  if (named.about.length < 25) problems.push(`${named.name} has nothing said about it`);
}
if (Object.keys(STATE_TESTS).length < 30) problems.push(`only ${Object.keys(STATE_TESTS).length} states carry their own name`);
// A state SLATE does not carry still tests, and says so plainly.
const unnamed = [...states].find((one) => !(one in STATE_TESTS));
if (unnamed) {
  const fallback = stateTestFor(unnamed);
  if (fallback.carried) problems.push(`${unnamed} is said to be carried and is not`);
  if (fallback.name !== GENERAL_STATE_TEST) problems.push(`${unnamed} gets an invented name`);
}
if (stateTestFor('us-tx').short !== 'STAAR') problems.push('Texas does not sit STAAR');
if (!stateTestFor('us-ny').name.includes('Regents')) problems.push('New York does not sit the Regents');
if (STATE_TEST_FROM >= STATE_TEST_TO) problems.push('a state test is sat at one age');
if (STATE_TEST_MONTH < 3 || STATE_TEST_MONTH > 5) problems.push('the state testing window is not in the spring');
if (!/inventing/.test(STATE_TEST_NOTE)) problems.push('the note about the state tests has gone');

// --- The grading scales -------------------------------------------------------

const seenScales = new Set();
for (const scale of GRADE_SCALES) {
  if (seenScales.has(scale.id)) problems.push(`${scale.id} is listed twice`);
  seenScales.add(scale.id);
  for (const countryId of scale.countryIds) {
    if (!known.has(countryId)) problems.push(`${scale.label} is used in ${countryId}, which is not a country`);
  }
  if (scale.bands.length < 3) problems.push(`${scale.label} has ${scale.bands.length} grades on it`);
  let last = 101;
  for (const band of scale.bands) {
    if (band.from >= last) problems.push(`${scale.label} has its grades out of order at ${band.label}`);
    last = band.from;
    if (band.label.length === 0) problems.push(`${scale.label} has a grade with no name`);
    if (band.about.length < 10) problems.push(`${scale.label}: ${band.label} has nothing said about it`);
  }
  if (scale.bands[scale.bands.length - 1].from !== 0) problems.push(`${scale.label} has a hole at the bottom`);
  if (scale.averageLabel !== undefined && !scale.averageMax) {
    problems.push(`${scale.label} reports an average out of nothing`);
  }
  if (scale.direction !== 'high' && scale.direction !== 'low') {
    problems.push(`${scale.label} runs "${scale.direction}"`);
  }
}
// The famous ones are what they famously are.
if (gradeFor(96, 'us').label !== 'A') problems.push('a 96 in America is not an A');
if (gradeFor(20, 'us').label !== 'F') problems.push('a 20 in America is not an F');
if (gradeFor(95, 'de').label !== '1') problems.push('the top German grade is not a 1');
if (gradeFor(10, 'de').label !== '6') problems.push('the bottom German grade is not a 6');
if (scaleIn('de').direction !== 'low') problems.push('the German scale is not carried as running the other way');
if (gradeFor(95, 'uk').label !== '9') problems.push('the top GCSE grade is not a 9');
if (!gradeFor(52, 'uk').label.startsWith('4')) problems.push('a GCSE pass is not a 4');
if (!scaleIsCountrys('fr')) problems.push('France has no scale carried');
if (scaleIsCountrys('zz')) problems.push('a country with no scale is said to have one');
if (scaleIn('zz').id !== 'general') problems.push('a country with no scale does not fall to the general one');
// An average that runs backwards runs backwards.
const goodDe = averageFor(95, 'de');
const badDe = averageFor(10, 'de');
if (!goodDe || !badDe) problems.push('Germany reports no average');
else if (goodDe.value >= badDe.value) problems.push('a good German average is worse than a bad one');
const goodUs = averageFor(95, 'us');
const badUs = averageFor(10, 'us');
if (!goodUs || !badUs) problems.push('America reports no grade point average');
else {
  if (goodUs.value <= badUs.value) problems.push('a good grade point average is worse than a bad one');
  if (goodUs.max !== 4) problems.push('the grade point average is not out of four');
}
if (averageFor(80, 'jp') !== undefined) problems.push('Japan is said to report an average it does not report');
// A scale has to be calibrated against SLATE's own marks and not against raw
// percentages, or the middle of every class comes out failing.
for (const scale of GRADE_SCALES) {
  const countryId = scale.countryIds[0] ?? 'zz';
  const worst = scale.bands[scale.bands.length - 1];
  for (const band of MARK_BANDS) {
    const grade = gradeFor(band.from + 3, countryId);
    if (band.label === 'Sound' && grade.label === worst.label) {
      problems.push(`${scale.label} gives the middle of the class the bottom grade`);
    }
    if (band.label === 'Outstanding' && grade.label !== scale.bands[0].label
      && grade.label !== scale.bands[1]?.label) {
      problems.push(`${scale.label} does not give the top of the class a top grade`);
    }
    if (band.label === 'Passing' && grade.label === scale.bands[0].label) {
      problems.push(`${scale.label} gives a bare pass the best grade there is`);
    }
  }
  // And an average built out of grades is built out of those grades.
  for (const band of scale.bands) {
    if (band.points === undefined) continue;
    if (scale.averageMax === undefined) problems.push(`${scale.label} scores grades toward no average`);
    else if (band.points > scale.averageMax) problems.push(`${scale.label}: ${band.label} is worth more than the scale`);
    const got = averageFor(band.from + 1, countryId);
    if (got && got.value !== band.points) {
      problems.push(`${scale.label}: ${band.label} is worth ${band.points} and averages as ${got.value}`);
    }
  }
}
if (!/boundaries/.test(GRADE_NOTE)) problems.push('the note about the scales has gone');

// --- The shape of a year, and the report ---------------------------------------

const seenTerms = new Set();
for (const pattern of TERM_PATTERNS) {
  if (seenTerms.has(pattern.id)) problems.push(`${pattern.id} is listed twice`);
  seenTerms.add(pattern.id);
  if (pattern.terms.length < 2) problems.push(`${pattern.label} has ${pattern.terms.length} term in it`);
  for (const term of pattern.terms) {
    if (term.startMonth < 1 || term.startMonth > 12) problems.push(`${pattern.label}: a term opens in month ${term.startMonth}`);
    if (term.months < 2 || term.months > 6) problems.push(`${pattern.label}: a term runs ${term.months} months`);
  }
  const months = pattern.terms.reduce((sum, one) => sum + one.months, 0);
  if (months > 12) problems.push(`${pattern.label} runs for ${months} months of the year`);
  if (months < 8) problems.push(`${pattern.label} only runs for ${months} months of the year`);
  for (const countryId of pattern.countryIds) {
    if (!known.has(countryId)) problems.push(`${pattern.label} is kept in ${countryId}, which is not a country`);
  }
}
// The year opens where it really opens.
if (termsIn('jp').terms[0].startMonth !== 4) problems.push('the Japanese school year does not open in April');
if (termsIn('au').terms[0].startMonth > 2) problems.push('the Australian school year does not open in the southern summer');
if (termsIn('uk').terms.length !== 3) problems.push('the British school year is not three terms');
if (!termsAreCountrys('us')) problems.push('America has no term pattern carried');
if (termsAreCountrys('zz')) problems.push('a country with no pattern is said to have one');
if (!/April/.test(TERM_NOTE)) problems.push('the note about the school year has gone');

// Every comment on every report is written for this game and reads like one.
const bands = new Set(MARK_BANDS.map((one) => one.label));
for (const [band, lines] of Object.entries(REPORT_COMMENTS)) {
  if (!bands.has(band)) problems.push(`${band} is a report band and not a mark band`);
  if (lines.length < 4) problems.push(`${band} has ${lines.length} comments`);
  for (const line of lines) {
    if (line.length < 30) problems.push(`a ${band} comment is too short to be a comment: "${line}"`);
    if (!/[.!?]$/.test(line)) problems.push(`a ${band} comment does not end in a full stop`);
  }
  if (new Set(lines).size !== lines.length) problems.push(`${band} repeats a comment`);
}
for (const band of bands) {
  if (!REPORT_COMMENTS[band]) problems.push(`${band} has no report comments at all`);
  if (!PROGRESS_COMMENTS[band]) problems.push(`${band} has no progress comments at all`);
}
const allComments = Object.values(REPORT_COMMENTS).flat();
if (new Set(allComments).size !== allComments.length) problems.push('a report comment is used in two bands');
if (allComments.length < 40) problems.push(`only ${allComments.length} report comments`);
if (!/written for this game/.test(REPORT_NOTE)) problems.push('the note about the reports has gone');
if (PREP_CEILING <= PREP_PER_SESSION) problems.push('one session reaches the whole preparation ceiling');
if (effortLabel(95) === effortLabel(5)) problems.push('trying hard reads the same as not trying');

// --- A life it happens in ------------------------------------------------------

// The famous ones are open at the age they are really sat at.
for (const [countryId, age, testId] of [
  ['us', 16, 'sat'], ['us', 16, 'act'], ['us', 15, 'psat_nmsqt'],
  ['uk', 15, 'gcse_mocks'], ['uk', 11, 'ks2_sats'],
  ['kr', 18, 'suneung'], ['cn', 18, 'gaokao'], ['jp', 18, 'kyotsu'],
  ['br', 17, 'enem'], ['in', 17, 'neet'], ['au', 9, 'naplan'], ['za', 18, 'nsc'],
  ['ng', 17, 'wassce'], ['ru', 17, 'ege'], ['pl', 18, 'matura_pl'], ['tr', 18, 'yks'],
]) {
  if (!testsFor(countryId, age).some((one) => one.id === testId)) {
    problems.push(`a ${age} year old in ${countryId} cannot sit ${testId}, which is what somebody there sits`);
  }
}
// And nobody sits somebody else's.
if (testsFor('uk', 18).some((one) => one.id === 'sat')) problems.push('the SAT is sat in Britain');
if (testsFor('us', 18).some((one) => one.id === 'gaokao')) problems.push('the Gaokao is sat in America');
if (!testsAreCountrys('fr')) problems.push('France has no examination of its own carried');
if (testsAreCountrys('zz')) problems.push('a country with nothing carried is said to have something');

for (const [birthYear, cityId, expect] of [
  [2009, 'us-ca-losangeles', 'sat'],
  [2009, 'uk-eng-london', undefined],
  [2009, 'kr-11-seoul', undefined],
  [2014, 'us-tx-houston', undefined],
]) {
  const sim = quickSave({ birthYear, startLocationId: cityId, homeRegionId: cityId }, `exam-check-${birthYear}-${cityId}`);
  const where = `${cityId} at ${birthYear}`;
  const schooling = schoolingOf(sim);
  if (!schooling) { problems.push(`${where} is not at school at all`); continue; }
  if (!Array.isArray(schooling.sittings)) problems.push(`${where} has no sittings list`);
  if (!Array.isArray(schooling.reports)) problems.push(`${where} has no reports list`);
  const open = testsOpenTo(sim);
  if (open.length === 0) problems.push(`${where} has no test open to them at all`);
  if (expect && !open.some((one) => one.id === expect)) {
    problems.push(`${where} cannot sit ${expect}, which is what somebody there sits`);
  }
  // Nothing from somewhere else is open to them.
  for (const test of open) {
    if (test.countryIds.length === 0) continue;
    const countryId = cityId.split('-')[0];
    if (!test.countryIds.includes(countryId)) {
      problems.push(`${where} is offered ${test.name}, which is not sat there`);
    }
  }
  // Every American is offered their own state's assessment and nobody else's.
  if (cityId.startsWith('us-')) {
    const regionId = cityId.split('-').slice(0, 2).join('-');
    const state = stateAssessmentFor(regionId);
    if (!state) problems.push(`${where} has no state assessment built`);
    else if (!testById(sim, state.id)) problems.push(`${where} has a state assessment that cannot be looked up`);
  } else if (stateAssessmentFor(cityId.split('-').slice(0, 2).join('-'))) {
    problems.push(`${where} is given an American state assessment`);
  }

  // The national assessments happen to you rather than being chosen, so a
  // fresh save is already down for the ones that are free.
  const already = sittingsOf(sim);
  if (open.some((one) => one.kind === 'national' && one.fee === 0) && already.length === 0) {
    problems.push(`${where} is not down for the assessment their school sits anyway`);
  }
  // Putting a name down, revising, sitting it, and the envelope weeks later.
  const sit = open.find((one) => !already.some((down) => down.testId === one.id));
  if (!sit) continue;
  const paid = sim.ledger.availableFunds(sim.player.primaryAccountId);
  const down = sim.execute({ kind: 'exam.register', payload: { testId: sit.id } });
  if (!down.ok) { problems.push(`${where} could not enter ${sit.name}: ${down.error}`); continue; }
  if (sit.fee > 0 && sim.ledger.availableFunds(sim.player.primaryAccountId) >= paid) {
    problems.push(`${where} entered ${sit.name} and paid nothing`);
  }
  if (down.value.sitsAt <= sim.now) problems.push(`${where} is sitting ${sit.name} in the past`);
  if (sim.execute({ kind: 'exam.register', payload: { testId: sit.id } }).ok) {
    problems.push(`${where} is down for ${sit.name} twice`);
  }
  const sitting = sittingsToCome(sim)[0];
  if (!sitting) { problems.push(`${where} entered and is down for nothing`); continue; }
  const studied = sim.execute({ kind: 'exam.study', payload: { sittingId: sitting.id } });
  if (!studied.ok) problems.push(`${where} could not revise: ${studied.error}`);
  else if (studied.value.worth <= 0) problems.push(`${where} revised and it was worth nothing`);
  const guess = predictFor(sim, sitting);
  if (!guess) problems.push(`${where} has no prediction before the day`);
  else {
    if (guess.low > guess.high) problems.push(`${where} has a prediction the wrong way round`);
    if (guess.low < sit.min || guess.high > sit.max) problems.push(`${where} is predicted off the scale of ${sit.name}`);
  }
  // Not on the day, and not after it has gone.
  if (sim.execute({ kind: 'exam.sit', payload: { sittingId: sitting.id } }).ok) {
    problems.push(`${where} sat ${sit.name} months early`);
  }
  sim.advanceTo(sitting.sitsAt);
  const sat = sim.execute({ kind: 'exam.sit', payload: { sittingId: sitting.id } });
  if (!sat.ok) { problems.push(`${where} could not sit ${sit.name}: ${sat.error}`); continue; }
  if (sat.value.score < sit.min || sat.value.score > sit.max) {
    problems.push(`${where} scored ${sat.value.score} on a ${sit.min} to ${sit.max} test`);
  }
  if (/\b\d+\b/.test(sat.value.note) && sat.value.note.includes(String(sat.value.score))) {
    problems.push(`${where} was told the score walking out of the hall`);
  }
  if (sim.execute({ kind: 'exam.sit', payload: { sittingId: sitting.id } }).ok) {
    problems.push(`${where} sat ${sit.name} twice on the same day`);
  }
  const done = resultsOf(sim).find((one) => one.id === sitting.id);
  if (!done?.satAt) problems.push(`${where} sat ${sit.name} and it is not on the record`);
  if (done?.released) problems.push(`${where} had the results before they were out`);
  sim.advanceTo(done.resultsAt + 60 * 60 * 1000);
  if (!done.released) problems.push(`${where} reached results day and got nothing`);
  const remembered = sim.universe.history.filter((one) => one.category === 'education');
  if (remembered.length === 0) problems.push(`${where} sat a public examination and nothing was remembered`);
}

// --- The report that comes home -------------------------------------------------

{
  const sim = quickSave(
    { birthYear: 2011, startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london' }, 'report-check',
  );
  const schooling = schoolingOf(sim);
  if (!schooling) problems.push('nobody is at school to write a report about');
  else {
    if (schooling.nextReportAt === undefined) problems.push('there is no report on the calendar at all');
    else if (schooling.nextReportAt <= sim.now) problems.push('the next report is in the past');
    const card = writeReport(sim, schooling, 'report');
    if (card.lines.length === 0) problems.push('a report card has no subjects on it');
    const onTimetable = new Set(schooling.timetable.map((one) => one.subjectId));
    for (const line of card.lines) {
      if (!onTimetable.has(line.subjectId)) problems.push(`a report grades ${line.subjectId}, which is not on the timetable`);
      if (!line.grade) problems.push(`${line.subjectId} has no grade on the report`);
      if (line.comment.length < 30) problems.push(`${line.subjectId} has a comment that is not a comment`);
      if (line.attendance < 0 || line.attendance > 100) problems.push(`${line.subjectId} shows ${line.attendance}% attendance`);
      if (line.mark < 0 || line.mark > 100) problems.push(`${line.subjectId} shows a mark of ${line.mark}`);
    }
    if (new Set(card.lines.map((one) => one.subjectId)).size !== card.lines.length) {
      problems.push('a report card grades a subject twice');
    }
    if (!card.termLabel) problems.push('a report card belongs to no term');
    if (card.attendance < 0 || card.attendance > 100) problems.push(`a report card shows ${card.attendance}% attendance`);
    // The grades on it are the country's own.
    const scale = new Set(scaleIn('uk').bands.map((one) => one.label));
    for (const line of card.lines) {
      if (!scale.has(line.grade)) problems.push(`${line.grade} is not a grade anybody in Britain is given`);
    }
    if (reportsOf(sim).length === 0) problems.push('a report was written and is not on the record');
    const short = writeReport(sim, schooling, 'progress');
    if (short.kind !== 'progress') problems.push('a progress report is not marked as one');
    if (short.headline === card.headline) problems.push('a progress report reads the same as a report card');
    if (effortOf(schooling) < 0 || effortOf(schooling) > 100) problems.push('effort is not out of a hundred');
  }
}

// --- Say what was measured -------------------------------------------------------

const countries = new Set(ALL_TESTS.flatMap((one) => one.countryIds));
console.log(`${ALL_TESTS.length} real examinations across ${countries.size} countries, plus the international ones.`);
console.log(`${Object.keys(STATE_TESTS).length} American states named their own assessment; the rest get one plainly labelled.`);
const backwards = GRADE_SCALES.filter((o) => o.direction === 'low').length;
console.log(`${GRADE_SCALES.length} grading scales, and on ${backwards} of them the good end is the low end.`);
console.log(`${TERM_PATTERNS.length} shapes of school year, from three terms to a year that opens in April.`);
console.log(`${Object.values(REPORT_COMMENTS).flat().length} report comments and ${Object.values(PROGRESS_COMMENTS).flat().length} progress comments, all of them written for this game.`);
console.log('The tests, the scales and the school years are public record; every score, grade and comment is SLATE’s own.');

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):`);
  for (const one of [...new Set(problems)]) console.error(`  - ${one}`);
  process.exit(1);
}
console.log('The tests hold.');
