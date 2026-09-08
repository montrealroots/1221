import { titleCaseLabel } from '@/engine/core/text';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Meter } from '@/ui/components/primitives';
import { ensureCourses } from '@/engine/systems/services';
import { formatMoney } from '@/engine/core/money';
import { formatDate } from '@/engine/core/time';
import {
  attendance, averageMark, describePart, isASchoolDay, partThisYear, productionFor,
  schoolIsCompulsory, schoolingOf, stageFor, standingOn, systemFor, todaysLessons,
} from '@/engine/systems/school';
import { CLUBS, SCHOOLING_NOTE, SUBJECT_BY_ID, markLabel } from '@/engine/content/schooling';
import { ageOf } from '@/engine/systems/lifespan';
import { plural } from '@/engine/core/text';
import { useState } from 'react';
import {
  APPLY_FROM_AGE, MAX_OPEN_APPLICATIONS, applicationsOf, chanceAt, describeStudies, feesFor,
  livingFor, marksOn, studiesOf, universitiesInCountry, whereItIs,
} from '@/engine/systems/university';
import {
  ATHLETIC_NOTE, MAJOR_BY_ID, REGIME_LABEL, UNIVERSITY_BY_ID, UNIVERSITY_NOTE, feesIn, majorsAt,
} from '@/engine/content/universities';
import { UNIVERSITY_LOOKS_AT } from '@/engine/content/schooling';
import { HOUSING, HOUSING_BY_ID, ROOM_AND_BOARD_NOTE } from '@/engine/content/universities';
import { countryOfCity } from '@/engine/content/geography';
import {
  effortOf, examCountryFor, predictFor, prepWorth, reportsOf, resultsOf, sittingsToCome,
  termNow, testById, testsOpenTo,
} from '@/engine/systems/exams';
import {
  EXAM_NOTE, GRADE_NOTE, PREP_CEILING, PREP_NOTE, REPORT_NOTE, SITTING_NOTE, STATE_TEST_NOTE,
  TERM_NOTE, TEST_KIND_LABEL, averageFor, effortLabel, scaleIn, termsIn,
} from '@/engine/content/exams';
import { Stat } from '@/ui/components/primitives';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function EducationWorkspace() {
  const { sim, run } = useGame();
  const courses = useWorld((s) => ensureCourses(s, s.player.currentLocationId));
  const enrollments = useWorld((s) => Object.values(s.universe.enrollments)
    .filter((e) => e.personId === s.player.id)
    .sort((a, b) => b.startedAt - a.startedAt));
  const player = useWorld((s) => s.player);

  const activeIds = new Set(enrollments.filter((e) => e.status === 'active').map((e) => e.courseId));

  return (
    <>
      <SchoolPanels />
      <ExamPanels />
      <UniversityPanels />

      <div className="page-head">
        <div className="eyebrow">Education</div>
        <h1>Getting better at things.</h1>
        <p className="muted">
          Classes genuinely raise attributes and skills. The last ten points of anything are far harder
          than the first ten.
        </p>
      </div>

      {enrollments.filter((e) => e.status === 'active').length > 0 && (
        <Panel title="Enrolled" flush>
          <div className="list">
            {enrollments.filter((e) => e.status === 'active').map((enrollment) => {
              const course = sim.universe.courses[enrollment.courseId];
              if (!course) return null;
              return (
                <div key={enrollment.id} className="list-item list-static" style={{ display: 'block' }}>
                  <div className="row-between" style={{ marginBottom: 'var(--s2)' }}>
                    <div>
                      <div className="small strong">{course.name}</div>
                      <div className="xs dim">
                        {course.provider} · {enrollment.sessionsAttended} of {course.sessionsTotal} sessions
                        {enrollment.sessionsMissed > 0 && <span className="negative"> · {enrollment.sessionsMissed} missed</span>}
                      </div>
                    </div>
                    <button className="btn btn-sm btn-danger" onClick={() => run('edu.drop', { enrollmentId: enrollment.id })}>
                      Drop
                    </button>
                  </div>
                  <Meter label="Progress" value={(enrollment.sessionsAttended / course.sessionsTotal) * 100} />
                  {Object.keys(enrollment.gains).length > 0 && (
                    <div className="row wrap gap-1" style={{ marginTop: 'var(--s2)' }}>
                      {Object.entries(enrollment.gains).map(([key, gain]) => (
                        <span key={key} className="chip chip-positive">
                          {titleCaseLabel(key.replace(/_/g, ' '))} +{gain.toFixed(1)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      <Panel title="Available Where You Are" flush>
        <div className="list">
          {courses.map((course) => {
            const enrolled = activeIds.has(course.id);
            const relevant = course.improves[0];
            const level = relevant
              ? (relevant.kind === 'attribute' ? player.attributes[relevant.key] : player.skills[relevant.key]) ?? 0
              : 0;
            const blocked = course.minimumLevel > 0 && level < course.minimumLevel;
            return (
              <div key={course.id} className="list-item list-static">
                <div className="grow">
                  <div className="small strong">{course.name}</div>
                  <div className="xs dim">
                    {course.provider} · {course.sessionsTotal} sessions · {course.sessionMinutes} min ·{' '}
                    {course.days.map((d) => DAYS[d]).join(', ')} at {course.hour}:00 · instructor {course.instructorQuality}/100
                  </div>
                  <div className="row wrap gap-1" style={{ marginTop: 4 }}>
                    {course.improves.map((improvement) => (
                      <span key={improvement.key} className="chip">
                        {titleCaseLabel(improvement.key.replace(/_/g, ' '))} +{improvement.gain} Per Session
                      </span>
                    ))}
                  </div>
                  {blocked && (
                    <div className="xs warning" style={{ marginTop: 4 }}>
                      Expects a working level of {course.minimumLevel}. You are at {Math.round(level)}.
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="mono small">{formatMoney(course.costPerSession)}</div>
                  <div className="xs dim">Per Session</div>
                </div>
                <button
                  className="btn btn-sm"
                  disabled={enrolled || blocked}
                  onClick={() => run('edu.enroll', { courseId: course.id })}
                >
                  {enrolled ? 'Enrolled' : blocked ? 'Not yet' : 'Enrol'}
                </button>
              </div>
            );
          })}
        </div>
      </Panel>

      {enrollments.filter((e) => e.status !== 'active').length > 0 && (
        <Panel title="Completed And Dropped" flush>
          <div className="list">
            {enrollments.filter((e) => e.status !== 'active').map((enrollment) => {
              const course = sim.universe.courses[enrollment.courseId];
              return (
                <div key={enrollment.id} className="list-item list-static">
                  <div className="grow">
                    <div className="small">{course?.name ?? 'A course'}</div>
                    <div className="xs dim">
                      {formatDate(enrollment.startedAt, sim.homeZone)} · {formatMoney(enrollment.totalPaid)} paid
                    </div>
                  </div>
                  <span className={`chip ${enrollment.status === 'completed' ? 'chip-positive' : ''}`}>{titleCaseLabel(enrollment.status)}</span>
                </div>
              );
            })}
          </div>
        </Panel>
      )}
    </>
  );
}


/**
 * School, for a life that is still in it.
 *
 * Everything above this is the adult half of education: classes you pay for
 * and choose. This is the half you do not choose — the week, the marks, the
 * team and the play — and it only appears while somebody is young enough to
 * be in it.
 */
function SchoolPanels(): JSX.Element | null {
  const { sim, run, toast } = useGame();
  const now = useWorld((s) => s.now);
  void now;
  const schooling = schoolingOf(sim);
  if (!schooling) return null;

  const system = systemFor(sim);
  const stage = stageFor(sim);
  const today = todaysLessons(sim, schooling);
  const standing = standingOn(schooling);
  const part = partThisYear(sim, schooling);
  const play = productionFor(sim, schooling);
  const inDrama = schooling.clubs.includes('drama');

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">School</div>
        <h1>{schooling.placeName}</h1>
        <p className="muted">
          {stage?.label}, {schooling.yearLabel}. The {system.label} system.
          {' '}{schoolIsCompulsory(sim) ? 'You have to be here.' : 'You do not have to be here any more.'}
        </p>
      </div>

      <div className="grid grid-sheet">
        <Panel
          title={isASchoolDay(sim) ? 'Today' : 'No School Today'}
          subtitle={isASchoolDay(sim)
            ? today.map((one) => SUBJECT_BY_ID[one.subjectId]?.label ?? one.subjectId).join(' · ')
            : 'It is the weekend.'}
        >
          <div className="col gap-3">
            <div className="row gap-2 wrap">
              {(['normal', 'hard', 'coast'] as const).map((effort) => (
                <button
                  key={effort}
                  className={`btn btn-sm${effort === 'normal' ? ' btn-primary' : ''}`}
                  disabled={!isASchoolDay(sim)}
                  onClick={() => {
                    const res = run<{ note: string }>('school.attend', { effort });
                    if (res.ok) toast(res.value!.note, 'positive');
                  }}
                >
                  {effort === 'hard' ? 'Go And Work' : effort === 'coast' ? 'Go And Coast' : 'Go To School'}
                </button>
              ))}
              <button
                className="btn btn-sm"
                disabled={!isASchoolDay(sim)}
                onClick={() => {
                  const res = run<{ note: string }>('school.skip', {});
                  if (res.ok) toast(res.value!.note, 'negative');
                }}
              >
                Do Not Go
              </button>
            </div>
            <p className="xs dim" style={{ margin: 0 }}>{SCHOOLING_NOTE}</p>
          </div>
        </Panel>

        <Panel
          title="Where You Are At"
          subtitle={`${standing.label}, averaging ${averageMark(schooling)} across ${plural(schooling.marks.length, 'subject')}.`}
          flush
        >
          <div className="list">
            {[...schooling.marks].sort((a, b) => b.mark - a.mark).map((one) => (
              <div key={one.subjectId} className="list-item list-static">
                <div className="grow">
                  <div className="small strong">{SUBJECT_BY_ID[one.subjectId]?.label ?? one.subjectId}</div>
                  <div className="xs dim">{markLabel(one.mark)} · {one.attended} sat, {one.missed} missed</div>
                </div>
                <span className="mono small">{one.mark.toFixed(0)}</span>
              </div>
            ))}
          </div>
          <p className="xs dim" style={{ padding: 'var(--s3)', margin: 0 }}>
            Attendance {attendance(schooling)}%.
            {' '}{standing.university
              ? 'These marks would get a university to look.'
              : 'These marks would not get a university to look yet.'}
            {standing.scholarship ? ' And they would pay for it.' : ''}
          </p>
        </Panel>

        <Panel title="After School" subtitle="Three is as many as anybody keeps up." flush>
          <div className="list">
            {CLUBS.filter((one) => ageOf(sim) >= one.fromAge).map((one) => (
              <div key={one.id} className="list-item list-static">
                <div className="grow">
                  <div className="small strong">{one.label}</div>
                  <div className="xs dim">{one.about}</div>
                </div>
                {schooling.clubs.includes(one.id) ? (
                  <span className="badge badge-positive">In It</span>
                ) : (
                  <button
                    className="btn btn-sm"
                    onClick={() => {
                      const res = run<{ note: string }>('school.join_club', { clubId: one.id });
                      if (res.ok) toast(`${one.label}. ${res.value!.note}`, 'positive');
                    }}
                  >
                    Join
                  </button>
                )}
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="The Play" subtitle={`${schooling.placeName} is doing ${play.title} this year.`}>
          <div className="col gap-3">
            <p className="xs dim" style={{ margin: 0 }}>{play.about}</p>
            {part ? (
              <p className="small" style={{ margin: 0 }}>{describePart(part)}</p>
            ) : (
              <button
                className="btn btn-sm btn-primary"
                disabled={!inDrama}
                onClick={() => {
                  const res = run<{ note: string }>('school.audition', {});
                  if (res.ok) toast(res.value!.note, 'positive');
                }}
              >
                {inDrama ? 'Audition' : 'Join Drama Club First'}
              </button>
            )}
          </div>
        </Panel>

      </div>
    </>
  );
}



/**
 * The big tests, and the report that comes home.
 *
 * The examinations are real and so are their scales; the score is SLATE's own
 * arithmetic on the year somebody has actually had. A score is not shown until
 * the results are out, because a character walking out of a hall does not know
 * what they got.
 */
function ExamPanels(): JSX.Element | null {
  const { sim, run, toast } = useGame();
  const now = useWorld((s) => s.now);
  void now;
  const schooling = schoolingOf(sim);
  if (!schooling) return null;

  const countryId = examCountryFor(sim);
  const scale = scaleIn(countryId);
  const pattern = termsIn(countryId);
  const term = termNow(sim, countryId);
  const open = testsOpenTo(sim);
  const coming = sittingsToCome(sim);
  const behind = resultsOf(sim);
  const reports = reportsOf(sim);
  const card = reports[0];
  const effort = effortOf(schooling);
  const reported = averageFor(averageMark(schooling), countryId);

  return (
    <div className="grid grid-sheet">
      <Panel
        title="The Term"
        subtitle={`${term.label}. ${pattern.label} where you are.`}
      >
        <div className="col gap-3">
          <div className="row gap-3 wrap">
            <Stat
              label="Where You Are"
              value={markLabel(averageMark(schooling))}
              note={`${Math.round(averageMark(schooling))} across everything on the timetable.`}
            />
            {reported && (
              <Stat
                label={reported.label}
                value={`${reported.value}`}
                note={`Out of ${reported.max}, on the ${scale.label.toLowerCase()} scale.`}
              />
            )}
            <Stat
              label="Effort"
              value={effortLabel(effort)}
              note="Turning up is most of it, and the marks say what happened while you were there."
            />
          </div>
          {schooling.nextReportAt !== undefined && (
            <p className="xs dim" style={{ margin: 0 }}>
              Next report {formatDate(schooling.nextReportAt, sim.homeZone)}.
            </p>
          )}
          <p className="xs dim" style={{ margin: 0 }}>{TERM_NOTE}</p>
          <p className="xs dim" style={{ margin: 0 }}>{GRADE_NOTE}</p>
        </div>
      </Panel>

      <Panel
        title="The Big Tests"
        subtitle={coming.length > 0
          ? `${plural(coming.length, 'test')} coming up.`
          : 'Nothing down at the moment.'}
        flush
      >
        <div className="list">
          {coming.map((sitting) => {
            const test = testById(sim, sitting.testId);
            if (!test) return null;
            const guess = predictFor(sim, sitting);
            const due = Math.abs(sitting.sitsAt - sim.now) < 24 * 60 * 60 * 1000;
            return (
              <div key={sitting.id} className="list-item">
                <div className="grow">
                  <div className="row-title">{test.name}</div>
                  <div className="xs dim">
                    {TEST_KIND_LABEL[test.kind]} · {formatDate(sitting.sitsAt, sim.homeZone)} ·
                    {' '}{test.min} to {test.max}
                    {guess ? ` · Looking Like ${guess.low} To ${guess.high}` : ''}
                  </div>
                  <div className="xs dim">
                    {plural(sitting.prep, 'past paper')} done, worth about
                    {' '}{Math.round(prepWorth(sitting))} points on the day.
                  </div>
                </div>
                <div className="row gap-2">
                  <button
                    className="btn btn-sm"
                    disabled={prepWorth(sitting) >= PREP_CEILING}
                    onClick={() => {
                      const res = run<{ note: string }>('exam.study', { sittingId: sitting.id });
                      if (res.ok) toast(res.value!.note, 'positive');
                    }}
                  >
                    {prepWorth(sitting) >= PREP_CEILING ? 'Papers Done' : 'Work A Past Paper'}
                  </button>
                  <button
                    className="btn btn-sm btn-primary"
                    disabled={!due}
                    onClick={() => {
                      const res = run<{ note: string }>('exam.sit', { sittingId: sitting.id });
                      if (res.ok) toast(res.value!.note, 'positive');
                    }}
                  >
                    {due ? 'Sit It' : 'Not Yet'}
                  </button>
                </div>
              </div>
            );
          })}
          {open
            .filter((test) => !coming.some((one) => one.testId === test.id))
            .map((test) => (
              <div key={test.id} className="list-item">
                <div className="grow">
                  <div className="row-title">{test.name}</div>
                  <div className="xs dim">
                    {TEST_KIND_LABEL[test.kind]} · {test.min} to {test.max}
                    {test.fee > 0 ? ` · ${formatMoney(test.fee)} To Enter` : ' · Free'}
                  </div>
                  <div className="xs dim">{test.about}</div>
                </div>
                <button
                  className="btn btn-sm"
                  onClick={() => {
                    const res = run<{ note: string }>('exam.register', { testId: test.id });
                    if (res.ok) toast(res.value!.note, 'positive');
                  }}
                >
                  Put Your Name Down
                </button>
              </div>
            ))}
          {open.length === 0 && coming.length === 0 && (
            <div className="list-item list-static">
              <div className="xs dim">There is nothing anybody your age sits where you are.</div>
            </div>
          )}
        </div>
      </Panel>

      {behind.length > 0 && (
        <Panel title="Results" subtitle="What came back, and what is still in the post." flush>
          <div className="list">
            {behind.slice(0, 6).map((sitting) => {
              const test = testById(sim, sitting.testId);
              if (!test) return null;
              return (
                <div key={sitting.id} className="list-item list-static">
                  <div className="grow">
                    <div className="row-title">{test.name}</div>
                    <div className="xs dim">
                      {sitting.released && sitting.score !== undefined
                        ? `${sitting.score} out of ${test.max}${
                          (sitting.sections?.length ?? 0) > 1
                            ? ` · ${sitting.sections!.map((one) => `${one.label} ${one.score}`).join(' · ')}`
                            : ''}`
                        : `Sat ${formatDate(sitting.satAt ?? sim.now, sim.homeZone)}. Results ${
                          sitting.resultsAt ? formatDate(sitting.resultsAt, sim.homeZone) : 'to come'}.`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {card && (
        <Panel
          title={card.kind === 'report' ? 'The Report Card' : 'The Progress Report'}
          subtitle={card.headline}
          flush
        >
          <div className="list">
            {card.lines.map((line) => (
              <div key={line.subjectId} className="list-item list-static">
                <div className="grow">
                  <div className="row-title">
                    {SUBJECT_BY_ID[line.subjectId]?.label ?? line.subjectId} — {line.grade}
                  </div>
                  <div className="xs dim">{line.comment}</div>
                  <div className="xs dim">
                    Effort {line.effort} · {line.attendance}% Attendance
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Panel title="How This Works" subtitle="What is real here, and what is not.">
        <div className="col gap-2">
          <p className="xs dim" style={{ margin: 0 }}>{EXAM_NOTE}</p>
          <p className="xs dim" style={{ margin: 0 }}>{SITTING_NOTE}</p>
          {countryId === 'us' && <p className="xs dim" style={{ margin: 0 }}>{STATE_TEST_NOTE}</p>}
          <p className="xs dim" style={{ margin: 0 }}>{PREP_NOTE}</p>
          <p className="xs dim" style={{ margin: 0 }}>{REPORT_NOTE}</p>
        </div>
      </Panel>
    </div>
  );
}

/**
 * University, which is the end of the school ladder.
 *
 * The universities here are real, and so are their towns and the way each
 * country charges for a degree. Whether one would take you, and what a term
 * does to you, is SLATE's own — and the page says so.
 */
function UniversityPanels(): JSX.Element | null {
  const { sim, run, toast } = useGame();
  const now = useWorld((s) => s.now);
  void now;
  const [pickedUni, setPickedUni] = useState('');
  const [pickedMajor, setPickedMajor] = useState('');
  const [housing, setHousing] = useState('hall');

  const age = ageOf(sim);
  const studies = studiesOf(sim);
  const applications = applicationsOf(sim);
  if (!studies && age < APPLY_FROM_AGE) return null;

  const here = universitiesInCountry(
    countryOfCity(sim.player.currentLocationId) ?? sim.player.citizenshipId,
  );
  const chosen = pickedUni ? UNIVERSITY_BY_ID[pickedUni] : undefined;
  const courses = chosen ? majorsAt(chosen) : [];
  const chance = chosen && pickedMajor ? chanceAt(sim, chosen, pickedMajor) : undefined;
  const marks = marksOn(sim);

  if (studies) {
    const university = UNIVERSITY_BY_ID[studies.universityId]!;
    const away = sim.player.currentLocationId !== university.cityId;
    return (
      <>
        <div className="page-head">
          <div className="eyebrow">University</div>
          <h1>{studies.universityName}</h1>
          <p className="muted">{describeStudies(studies)} {whereItIs(university)}.</p>
        </div>
        <div className="grid grid-sheet">
          <Panel title="The Term" subtitle={away ? `You are not in ${university.town}.` : `Year ${studies.year} of ${studies.years}.`}>
            <div className="col gap-3">
              <div className="row gap-2 wrap">
                {(['normal', 'hard', 'coast'] as const).map((effort) => (
                  <button
                    key={effort}
                    className={`btn btn-sm${effort === 'normal' ? ' btn-primary' : ''}`}
                    disabled={away}
                    onClick={() => {
                      const res = run<{ note: string }>('uni.term', { effort });
                      if (res.ok) toast(res.value!.note, 'positive');
                    }}
                  >
                    {effort === 'hard' ? 'Work Through It' : effort === 'coast' ? 'Coast Through It' : 'Sit The Term'}
                  </button>
                ))}
                <button
                  className="btn btn-sm"
                  onClick={() => {
                    const res = run<{ note: string }>('uni.leave', {});
                    if (res.ok) toast(res.value!.note, 'negative');
                  }}
                >
                  Leave
                </button>
              </div>
              <Meter label="On Current Form" value={studies.average} max={100} />
              <p className="xs dim" style={{ margin: 0 }}>
                {plural(studies.termsDone, 'term')} done. {HOUSING_BY_ID[studies.housing]?.label ?? 'Living somewhere'}.
                {' '}Paid {formatMoney(studies.paid)} in fees and {formatMoney(studies.paidLiving)} to live on
                {studies.scholarship === 'athletic'
                  ? ', on a full ride.'
                  : studies.scholarship ? `, after the ${studies.scholarship} award.` : '.'}
              </p>
              <p className="xs dim" style={{ margin: 0 }}>{UNIVERSITY_NOTE}</p>
            </div>
          </Panel>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">University</div>
        <h1>Where you might go.</h1>
        <p className="muted">
          You are carrying {marks.toFixed(0)}. {marks >= UNIVERSITY_LOOKS_AT
            ? 'That is enough for a university to look at you.'
            : `Universities do not look below ${UNIVERSITY_LOOKS_AT}.`}
        </p>
      </div>

      <div className="grid grid-sheet">
        <Panel title="Apply" subtitle={`${MAX_OPEN_APPLICATIONS} open at once, and taking one closes the rest.`}>
          <div className="col gap-3">
            <label className="label" htmlFor="uni-pick">Where</label>
            <select
              id="uni-pick"
              className="input"
              value={pickedUni}
              onChange={(e) => { setPickedUni(e.target.value); setPickedMajor(''); }}
            >
              <option value="">Pick a university</option>
              {here.map((one) => (
                <option key={one.id} value={one.id}>{one.name} — {one.town}</option>
              ))}
            </select>

            <label className="label" htmlFor="course-pick">What</label>
            <select
              id="course-pick"
              className="input"
              value={pickedMajor}
              disabled={!chosen}
              onChange={(e) => setPickedMajor(e.target.value)}
            >
              <option value="">Pick a course</option>
              {courses.map((one) => <option key={one.id} value={one.id}>{one.label}</option>)}
            </select>

            {chosen && (
              <>
                <p className="xs dim" style={{ margin: 0 }}>
                  Founded {chosen.founded}. {chosen.about} {REGIME_LABEL[feesIn(chosen.countryId).regime]}
                  {feesFor(chosen) > 0 ? ` — about ${formatMoney(feesFor(chosen))} a year in fees.` : '.'}
                </p>
                <p className="xs dim" style={{ margin: 0 }}>
                  {HOUSING_BY_ID[housing]!.label}: about{' '}
                  {formatMoney(livingFor(chosen, housing as never, housing !== 'at_home'))} a year to live on.
                  {' '}{ROOM_AND_BOARD_NOTE}
                </p>
              </>
            )}
            {chance && <p className="small" style={{ margin: 0 }}>{chance.reason}</p>}

            <button
              className="btn btn-sm btn-primary"
              disabled={!chosen || !pickedMajor}
              onClick={() => {
                const res = run<{ note: string }>('uni.apply', { universityId: pickedUni, majorId: pickedMajor });
                if (res.ok) { toast(res.value!.note, 'positive'); setPickedUni(''); setPickedMajor(''); }
              }}
            >
              Put Your Name In
            </button>
            <p className="xs dim" style={{ margin: 0 }}>{UNIVERSITY_NOTE}</p>
            <p className="xs dim" style={{ margin: 0 }}>{ATHLETIC_NOTE}</p>
          </div>
        </Panel>

        {applications.length > 0 && (
          <Panel title="What You Have Heard" flush>
            <div className="list">
              {applications.map((one) => {
                const university = UNIVERSITY_BY_ID[one.universityId];
                return (
                  <div key={one.id} className="list-item list-static">
                    <div className="grow">
                      <div className="small strong">
                        {university?.name} — {MAJOR_BY_ID[one.majorId]?.label}
                      </div>
                      <div className="xs dim">{one.reason}</div>
                    </div>
                    {one.status === 'offer' ? (
                      <div className="row gap-2">
                        <select
                          className="input"
                          aria-label="Where You Will Live"
                          value={housing}
                          onChange={(e) => setHousing(e.target.value)}
                        >
                          {HOUSING.map((where) => (
                            <option key={where.id} value={where.id}>{where.label}</option>
                          ))}
                        </select>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => {
                            const res = run<{ note: string }>('uni.accept', { applicationId: one.id, housing });
                            if (res.ok) toast(res.value!.note, 'positive');
                          }}
                        >
                          Take It
                        </button>
                        <button className="btn btn-sm" onClick={() => run('uni.decline', { applicationId: one.id })}>
                          Turn It Down
                        </button>
                      </div>
                    ) : (
                      <span className="badge badge-quiet">{titleCaseLabel(one.status)}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </Panel>
        )}
      </div>
    </>
  );
}
