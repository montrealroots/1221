import { useGame, useWorld } from '@/app/game-context';
import { Panel, Meter } from '@/ui/components/primitives';
import { ensureCourses } from '@/engine/systems/services';
import { formatMoney } from '@/engine/core/money';
import { formatDate } from '@/engine/core/time';

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
                          {key.replace(/_/g, ' ')} +{gain.toFixed(1)}
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

      <Panel title="Available where you are" flush>
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
                        {improvement.key.replace(/_/g, ' ')} +{improvement.gain}/session
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
                  <div className="xs dim">per session</div>
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
        <Panel title="Completed and dropped" flush>
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
                  <span className={`chip ${enrollment.status === 'completed' ? 'chip-positive' : ''}`}>{enrollment.status}</span>
                </div>
              );
            })}
          </div>
        </Panel>
      )}
    </>
  );
}
