import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Meter, Empty } from '@/ui/components/primitives';
import { describePay, annualisedPay } from '@/engine/systems/work';
import { formatMoney, formatMoneyCompact } from '@/engine/core/money';
import { formatDate, formatRelative } from '@/engine/core/time';
import { CITIES } from '@/engine/content/geography';

export function WorkWorkspace() {
  const { sim, run } = useGame();
  const job = useWorld((s) => (s.player.jobId ? s.universe.jobs[s.player.jobId] : undefined));
  const openings = useWorld((s) => Object.values(s.universe.jobOpenings).filter((o) => o.closesAt > s.now));
  const applications = useWorld((s) => Object.values(s.universe.jobApplications)
    .filter((a) => a.personId === s.player.id)
    .sort((a, b) => b.submittedAt - a.submittedAt));
  const history = useWorld((s) => Object.values(s.universe.jobs)
    .filter((j) => j.personId === s.player.id && j.endedAt)
    .sort((a, b) => (b.endedAt ?? 0) - (a.endedAt ?? 0)));

  const appliedTo = new Set(applications.filter((a) => !['rejected', 'withdrawn'].includes(a.stage)).map((a) => a.openingId));

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Work</div>
        <h1>{job ? job.title : 'Not employed'}</h1>
        <p className="muted">
          {job
            ? `${job.employerName} · ${describePay(job)} · ${formatMoneyCompact(annualisedPay(job))} a year`
            : 'You never have to become famous. A job pays the bills while everything else takes its time.'}
        </p>
      </div>

      {job && (
        <Panel
          title="Where you work"
          actions={
            <>
              <button className="btn btn-sm" onClick={() => run('work.request_promotion', { jobId: job.id })}>
                Ask for a promotion
              </button>
              <button className="btn btn-sm btn-danger" onClick={() => run('work.resign', { jobId: job.id })}>
                Resign
              </button>
            </>
          }
        >
          <div className="grid grid-4" style={{ marginBottom: 'var(--s4)' }}>
            <Stat label="Rate" value={<span className="mono">{describePay(job)}</span>} />
            <Stat label="Hours" value={`${job.hoursPerWeek}/week`} />
            <Stat label="Started" value={formatDate(job.startedAt, sim.homeZone)} />
            <Stat label="Next pay" value={formatRelative(job.nextPayAt, sim.now)} note={`${formatMoney(job.accruedPay)} accrued`} />
          </div>
          <div className="grid grid-2">
            <Meter label="Performance" value={job.performance} hint="How your manager rates you. Feeds promotions and raises." />
            <Meter label="Attendance" value={job.attendance} hint="Three missed shifts in a row ends the job." />
          </div>
          <hr className="divider" />
          <div className="row wrap gap-2">
            <span className="chip">{job.ladder[job.level] ?? job.title}</span>
            {job.ladder.slice(job.level + 1, job.level + 3).map((step) => (
              <span key={step} className="chip dim">→ {step}</span>
            ))}
          </div>
          {job.benefits.health && (
            <p className="xs dim" style={{ marginTop: 'var(--s3)' }}>
              Includes health{job.benefits.dental ? ', dental' : ''}{job.benefits.vision ? ', vision' : ''}
              {job.benefits.retirement ? ' and retirement' : ''} · {job.benefits.paidLeave} days paid leave.
            </p>
          )}
        </Panel>
      )}

      {applications.length > 0 && (
        <Panel title="Applications" flush>
          <div className="list">
            {applications.slice(0, 10).map((application) => {
              const opening = sim.universe.jobOpenings[application.openingId];
              return (
                <div key={application.id} className="list-item list-static">
                  <div className="grow">
                    <div className="small strong">{opening?.title ?? 'A role'}</div>
                    <div className="xs dim">
                      {opening?.employerName ?? '—'} · submitted {formatDate(application.submittedAt, sim.homeZone)}
                      {application.interviewAt && ` · interview ${formatDate(application.interviewAt, sim.homeZone)}`}
                    </div>
                  </div>
                  <span className={`chip ${application.stage === 'offer' ? 'chip-positive' : application.stage === 'rejected' ? 'chip-negative' : ''}`}>
                    {application.stage.replace(/_/g, ' ')}
                  </span>
                  {application.stage === 'offer' && (
                    <>
                      <button className="btn btn-sm btn-primary" onClick={() => run('work.accept_offer', { applicationId: application.id })}>Accept</button>
                      <button className="btn btn-sm" onClick={() => run('work.decline_offer', { applicationId: application.id })}>Decline</button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      <Panel title="Open positions" subtitle={`${openings.length} listings where you are`} flush>
        {openings.length === 0 ? (
          <Empty title="Nothing listed" body="New listings appear weekly. Check back, or move somewhere with a deeper job market." />
        ) : (
          <div className="list">
            {openings.map((opening) => (
              <div key={opening.id} className="list-item list-static">
                <div className="grow">
                  <div className="small strong">{opening.title}</div>
                  <div className="xs dim">
                    {opening.employerName} · {CITIES.get(opening.locationId)?.name} · {opening.hoursPerWeek}h/week
                    {opening.requirements.length > 0 && ` · needs ${opening.requirements.map((r) => r.skill.replace(/_/g, ' ')).join(', ')}`}
                  </div>
                  <div className="xs muted" style={{ marginTop: 2 }}>{opening.description}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="mono small">{formatMoney(opening.payRate)}{opening.payBasis === 'hourly' ? '/hr' : opening.payBasis === 'salary' ? '/yr' : opening.payBasis === 'daily' ? '/day' : ''}</div>
                  <div className="xs dim">closes {formatRelative(opening.closesAt, sim.now)}</div>
                </div>
                <button
                  className="btn btn-sm"
                  disabled={appliedTo.has(opening.id) || Boolean(job)}
                  onClick={() => run('work.apply', { openingId: opening.id })}
                  title={job ? 'Resign before taking another job.' : undefined}
                >
                  {appliedTo.has(opening.id) ? 'Applied' : 'Apply'}
                </button>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {history.length > 0 && (
        <Panel title="Work history" flush>
          <div className="list">
            {history.map((entry) => (
              <div key={entry.id} className="list-item list-static">
                <div className="grow">
                  <div className="small">{entry.title} at {entry.employerName}</div>
                  <div className="xs dim">
                    {formatDate(entry.startedAt, sim.homeZone)} — {formatDate(entry.endedAt ?? sim.now, sim.homeZone)} · {entry.endReason}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </>
  );
}
