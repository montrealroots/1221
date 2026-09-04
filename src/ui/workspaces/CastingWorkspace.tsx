import { formatLabel, titleCaseLabel } from '@/engine/core/text';
import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Empty, Tabs, Modal } from '@/ui/components/primitives';
import { AGENCIES } from '@/engine/content/industry';
import { formatMoney } from '@/engine/core/money';
import { formatDate, formatTime, ageOn } from '@/engine/core/time';
import { CITIES } from '@/engine/content/geography';
import { redactForPlayer } from '@/engine/core/audit';

type Tab = 'breakdowns' | 'auditions' | 'representation' | 'credits';

export function CastingWorkspace() {
  const { sim, run } = useGame();
  const [tab, setTab] = useState<Tab>('breakdowns');
  const [preparing, setPreparing] = useState<string | null>(null);

  const player = useWorld((s) => s.player);
  const age = ageOn(player.birthInstant, sim.now, sim.homeZone);

  const roles = useWorld((s) => Object.values(s.universe.roles)
    .filter((r) => r.status === 'casting')
    .map((role) => ({ role, project: s.universe.projects[role.projectId] }))
    .filter((entry) => entry.project && entry.project.createdById !== s.player.id));

  const auditions = useWorld((s) => Object.values(s.universe.auditions)
    .filter((a) => a.personId === s.player.id)
    .sort((a, b) => b.submittedAt - a.submittedAt));

  const submittedRoleIds = new Set(auditions.map((a) => a.roleId));

  const credits = useWorld((s) => player.creditIds
    .map((id) => s.universe.projects[id])
    .filter(Boolean));

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Casting</div>
        <h1>{auditions.filter((a) => !a.decidedAt).length} Live Auditions</h1>
        <p className="muted">
          You are scored against everyone else who read. Preparation and how rested you are on the day
          are real inputs, and when you do not get it, you can find out why.
        </p>
      </div>

      <Tabs active={tab} onChange={setTab} tabs={[
        { id: 'breakdowns', label: 'Breakdowns', badge: roles.length },
        { id: 'auditions', label: 'Your Auditions', badge: auditions.filter((a) => !a.decidedAt).length },
        { id: 'representation', label: 'Representation' },
        { id: 'credits', label: 'Credits', badge: credits.length },
      ]} />

      {tab === 'breakdowns' && (
        <Panel title="Casting Now" flush>
          {roles.length === 0 ? (
            <Empty title="Nothing Open" body="New breakdowns appear as productions gear up. Representation brings you far more of them." />
          ) : (
            <div className="list">
              {roles.map(({ role, project }) => {
                const inRange = age >= role.ageRange[0] - 4 && age <= role.ageRange[1] + 6;
                return (
                  <div key={role.id} className="list-item list-static">
                    <div className="grow">
                      <div className="small strong">{role.characterName} — {project?.title}</div>
                      <div className="xs dim">
                        {titleCaseLabel(role.billing.replace(/_/g, ' '))} · {role.shootDays} shoot days · ages {role.ageRange[0]}–{role.ageRange[1]}
                        {project && ` · ${project.genres.map(titleCaseLabel).join(', ')}`}
                      </div>
                      <div className="xs muted" style={{ marginTop: 2 }}>{role.description}</div>
                      <div className="row wrap gap-1" style={{ marginTop: 4 }}>
                        {role.requirements.slice(0, 4).map((requirement) => (
                          <span key={requirement.attributeId} className="chip">
                            {titleCaseLabel(requirement.attributeId.replace(/_/g, ' '))} {Math.round((player.attributes[requirement.attributeId] ?? 0))}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="mono small">{formatMoney(role.payLow, { cents: false })}</div>
                      <div className="xs dim">to {formatMoney(role.payHigh, { cents: false })}</div>
                    </div>
                    <button
                      className="btn btn-sm"
                      disabled={submittedRoleIds.has(role.id) || !inRange}
                      title={!inRange ? `They are looking for ${role.ageRange[0]} to ${role.ageRange[1]}. You are ${age}.` : undefined}
                      onClick={() => run('cast.submit', { roleId: role.id })}
                    >
                      {submittedRoleIds.has(role.id) ? 'Submitted' : inRange ? 'Submit' : 'Wrong age'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      )}

      {tab === 'auditions' && (
        <Panel title="Your Auditions" flush>
          {auditions.length === 0 ? (
            <Empty title="Nothing Out" body="Submit for a breakdown and it appears here with a date and a place." />
          ) : (
            <div className="list">
              {auditions.map((audition) => {
                const role = sim.universe.roles[audition.roleId];
                const project = sim.universe.projects[audition.projectId];
                const audit = sim.historian.auditFor('audition', audition.id);
                return (
                  <div key={audition.id} className="list-item list-static" style={{ display: 'block' }}>
                    <div className="row-between">
                      <div className="grow">
                        <div className="small strong">{role?.characterName} — {project?.title}</div>
                        <div className="xs dim">
                          {audition.scheduledAt && `${formatDate(audition.scheduledAt, sim.homeZone)} at ${formatTime(audition.scheduledAt, sim.homeZone)}`}
                          {audition.locationId && ` · ${CITIES.get(audition.locationId)?.name}`}
                          {audition.rank && ` · finished ${audition.rank}`}
                        </div>
                      </div>
                      <span className={`chip ${audition.stage === 'booked' || audition.stage === 'offer' ? 'chip-positive' : audition.stage === 'passed' ? 'chip-negative' : ''}`}>
                        {titleCaseLabel(audition.stage.replace(/_/g, ' '))}
                      </span>
                      {!audition.decidedAt && audition.performanceScore === undefined && (
                        <button className="btn btn-sm btn-primary" onClick={() => setPreparing(audition.id)}>
                          Prepare and perform
                        </button>
                      )}
                    </div>

                    {audition.feedback && (
                      <p className="xs muted" style={{ margin: 'var(--s2) 0 0' }}>{audition.feedback}</p>
                    )}

                    {audit && (
                      <details style={{ marginTop: 'var(--s2)' }}>
                        <summary className="xs" style={{ cursor: 'pointer', color: 'var(--accent)' }}>
                          Why did this go the way it did?
                        </summary>
                        <div style={{ paddingTop: 'var(--s2)' }}>
                          <p className="xs muted">{audit.summary}</p>
                          {redactForPlayer(audit).factors.map((factor, i) => (
                            <div key={i} className="xs" style={{ marginTop: 4 }}>
                              <span className="strong">{factor.label}</span>
                              {factor.weight > 0 && <span className="dim mono"> ({Math.round(factor.weight * 100)}%)</span>}
                              <div className="dim">{factor.detail}</div>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      )}

      {tab === 'representation' && (
        <>
          <Panel title="Who Represents You">
            {player.representation.agencyName ? (
              <div className="grid grid-2">
                <Stat label="Agency" value={player.representation.agencyName} note={`${Math.round((player.representation.agentCommission ?? 0) * 100)}% commission`} />
                <Stat label="Signed" value={player.representation.signedAt ? formatDate(player.representation.signedAt, sim.homeZone) : '—'} />
              </div>
            ) : (
              <p className="muted small">
                You are unrepresented. An agent multiplies how many opportunities reach you at all, which
                matters more than almost anything else early on.
              </p>
            )}
          </Panel>

          <Panel title="Agencies And Managers" flush>
            <div className="list">
              {AGENCIES.all().map((agency) => {
                const standing = player.reputation.professionalReputation * 0.4
                  + player.reputation.industryDemand * 0.35
                  + player.reputation.publicFame * 0.25;
                const realistic = standing >= agency.signingThreshold - 15;
                return (
                  <div key={agency.id} className="list-item list-static">
                    <div className="grow">
                      <div className="small strong">{agency.name}</div>
                      <div className="xs dim">
                        Tier {agency.tier} · {titleCaseLabel(agency.type)} · signs around {agency.signingThreshold}/100 · you read {Math.round(standing)}
                      </div>
                      <div className="xs muted" style={{ marginTop: 2 }}>{agency.description}</div>
                    </div>
                    <span className="chip">{Math.round(agency.commission * 100)}%</span>
                    <button
                      className="btn btn-sm"
                      onClick={() => run('cast.seek_representation', { agencyId: agency.id })}
                      title={realistic ? undefined : 'They sign well above where you are. It costs nothing to ask.'}
                    >
                      Approach
                    </button>
                  </div>
                );
              })}
            </div>
          </Panel>
        </>
      )}

      {tab === 'credits' && (
        <Panel title="Credits" flush>
          {credits.length === 0 ? (
            <Empty title="No Credits Yet" body="Everything starts with the first one." />
          ) : (
            <div className="list">
              {credits.map((project) => project && (
                <div key={project.id} className="list-item list-static">
                  <div className="grow">
                    <div className="small strong">{project.title}</div>
                    <div className="xs dim">
                      {formatLabel(project.format)} · {project.genres.map(titleCaseLabel).join(', ')} · {titleCaseLabel(project.phase.replace(/_/g, ' '))}
                      {project.releaseDate && ` · released ${formatDate(project.releaseDate, sim.homeZone)}`}
                    </div>
                  </div>
                  {project.criticScore !== undefined && <span className="chip">{project.criticScore} critics</span>}
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {preparing && <PrepareDialog auditionId={preparing} onClose={() => setPreparing(null)} />}
    </>
  );
}

function PrepareDialog({ auditionId, onClose }: { auditionId: string; onClose: () => void }) {
  const { sim, run } = useGame();
  const [hours, setHours] = useState(4);
  const audition = sim.universe.auditions[auditionId];
  const role = audition ? sim.universe.roles[audition.roleId] : undefined;

  const submit = () => {
    const result = run('cast.perform_audition', { auditionId, prepHours: hours });
    if (result.ok) onClose();
  };

  return (
    <Modal
      title={`Audition for ${role?.characterName ?? 'the role'}`}
      onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Not Yet</button><button className="btn btn-primary" onClick={submit}>Prepare And Go In</button></>}
    >
      <p className="muted small">
        Preparation costs hours and energy, and it is one of the largest single inputs into how the
        room goes. Going in cold is a choice you can make.
      </p>
      <div className="field">
        <div className="row-between">
          <label htmlFor="prep" style={{ marginBottom: 0 }}>Hours Of Preparation</label>
          <span className="mono">{hours}</span>
        </div>
        <input id="prep" type="range" min={0} max={16} value={hours} onChange={(e) => setHours(Number(e.target.value))} />
        <div className="row-between xs dim">
          <span>Cold</span><span>Two full days</span>
        </div>
      </div>
      <div className="callout">
        {hours === 0 && 'No preparation. Everyone in the room will know.'}
        {hours > 0 && hours < 4 && 'A pass on the material. Better than nothing.'}
        {hours >= 4 && hours < 10 && 'Properly prepared. This is what professionals do.'}
        {hours >= 10 && 'Deeply prepared, at real cost to your energy today.'}
      </div>
    </Modal>
  );
}
