import { titleCaseLabel } from '@/engine/core/text';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Meter } from '@/ui/components/primitives';
import { ensureCourses } from '@/engine/systems/services';
import { formatMoney } from '@/engine/core/money';
import { formatDate } from '@/engine/core/time';
import {
  attendance, averageMark, describePart, inSeasonHere, isASchoolDay, partThisYear, productionFor,
  schoolIsCompulsory, schoolingOf, sportsAt, stageFor, standingOn, systemFor, teamPlace,
  todaysLessons,
} from '@/engine/systems/school';
import { CLUBS, SCHOOLING_NOTE, SUBJECT_BY_ID, TEAM_FROM_AGE, markLabel } from '@/engine/content/schooling';
import { ageOf } from '@/engine/systems/lifespan';
import { plural } from '@/engine/core/text';

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
  const sports = sportsAt(sim);
  const part = partThisYear(sim, schooling);
  const play = productionFor(sim, schooling);
  const inDrama = schooling.clubs.includes('drama');

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">School</div>
        <h1>{schooling.placeName}</h1>
        <p className="muted">
          {stage?.label}, {schooling.yearLabel}. The {system.label.toLowerCase()} system.
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

        {sports.length > 0 && (
          <Panel title="Teams" subtitle={`What this school fields, and when.`} flush>
            <div className="list">
              {sports.map((one) => {
                const place = teamPlace(schooling, one.id);
                const open = inSeasonHere(sim, one.id);
                return (
                  <div key={one.id} className="list-item list-static">
                    <div className="grow">
                      <div className="small strong">{one.label}</div>
                      <div className="xs dim">
                        {place
                          ? (place.onTheTeam
                            ? `On the team. ${place.won} of ${place.played} this season.`
                            : 'You tried out and did not make it.')
                          : one.about}
                      </div>
                    </div>
                    {place?.onTheTeam ? (
                      <button
                        className="btn btn-sm"
                        disabled={!open}
                        onClick={() => {
                          const res = run<{ note: string }>('school.play_fixture', { sportId: one.id });
                          if (res.ok) toast(res.value!.note, 'positive');
                        }}
                      >
                        {open ? 'Play' : 'Out Of Season'}
                      </button>
                    ) : !place ? (
                      <button
                        className="btn btn-sm"
                        disabled={!open || ageOf(sim) < TEAM_FROM_AGE}
                        onClick={() => {
                          const res = run<{ note: string }>('school.try_out', { sportId: one.id });
                          if (res.ok) toast(res.value!.note, res.value!.note.includes('did not') ? 'negative' : 'positive');
                        }}
                      >
                        {open ? 'Try Out' : 'Out Of Season'}
                      </button>
                    ) : null}
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
