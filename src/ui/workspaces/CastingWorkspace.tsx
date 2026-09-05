import { formatLabel, titleCaseLabel } from '@/engine/core/text';
import { genreName } from '@/engine/content/genres';
import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { auditionPolicyFor } from '@/engine/systems/casting';
import { officeBook } from '@/engine/systems/casting-office';
import { CASTING_DIRECTOR_BY_ID } from '@/engine/content/casting-people';
import { AuditionRoomDialog } from '@/ui/components/AuditionRoom';
import { Panel, Stat, Empty, Tabs, Modal } from '@/ui/components/primitives';
import { AGENCIES } from '@/engine/content/industry';
import { formatMoney } from '@/engine/core/money';
import { formatDate, formatTime, ageOn } from '@/engine/core/time';
import { CITIES } from '@/engine/content/geography';
import { redactForPlayer } from '@/engine/core/audit';
import { DossierButton } from '@/ui/components/ProjectDossier';

type Tab = 'breakdowns' | 'auditions' | 'offices' | 'representation' | 'credits';

/** How a standing with one office reads to the player. Never a number. */
const LIST_LABEL: Readonly<Record<'unknown' | 'watching' | 'shortlist' | 'favourite', string>> = {
  unknown: 'Seen You',
  watching: 'They Know You',
  shortlist: 'On Their List',
  favourite: 'They Ask For You',
};

export function CastingWorkspace() {
  const { sim, run } = useGame();
  const [tab, setTab] = useState<Tab>('breakdowns');
  const [taping, setTaping] = useState<string | null>(null);
  const [inRoom, setInRoom] = useState<string | null>(null);

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

  // Every casting office that has ever had the player in, and where that left
  // things. Only offices that have actually seen you appear here: you cannot
  // have a standing with somebody you have never read for.
  const offices = useWorld(() => officeBook(sim));
  const officeKnowsYou = new Map(offices.map((entry) => [entry.standing.castingDirectorId, entry]));

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
        { id: 'offices', label: 'Casting Offices', badge: offices.length },
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
                const office = project?.castingOfficeId ? CASTING_DIRECTOR_BY_ID[project.castingOfficeId] : undefined;
                const known = office ? officeKnowsYou.get(office.id) : undefined;
                return (
                  <div key={role.id} className="list-item list-static">
                    <div className="grow">
                      <div className="small strong">{role.characterName} — {project?.title}</div>
                      <div className="xs dim">
                        {titleCaseLabel(role.billing.replace(/_/g, ' '))} · {role.shootDays} shoot days · ages {role.ageRange[0]}–{role.ageRange[1]}
                        {project && ` · ${project.genres.map(genreName).join(', ')}`}
                      </div>
                      {office && (
                        <div className="xs dim">
                          Casting by {office.name}
                          {known && (
                            <span className={known.standing.list === 'favourite' || known.standing.list === 'shortlist' ? 'positive' : undefined}>
                              {' · '}{known.howItStands}
                            </span>
                          )}
                        </div>
                      )}
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
                    {project && <DossierButton project={project} roleId={role.id} />}
                    {submittedRoleIds.has(role.id) ? (
                      <span className="chip chip-positive">Submitted</span>
                    ) : !inRange ? (
                      <span className="chip" title={`They are looking for ${role.ageRange[0]} to ${role.ageRange[1]}. You are ${age}.`}>Wrong Age</span>
                    ) : (
                      <div className="col gap-1" style={{ alignItems: 'flex-end' }}>
                        <div className="xs dim">{POLICY_LABEL[auditionPolicyFor(sim, role)]}</div>
                        <div className="row gap-1">
                          {auditionPolicyFor(sim, role) !== 'in_person_only' && (
                            <button className="btn btn-sm" onClick={() => run('cast.submit', { roleId: role.id, prefer: 'tape' })}>Send A Tape</button>
                          )}
                          {auditionPolicyFor(sim, role) !== 'tape_only' && (
                            <button className="btn btn-sm btn-primary" onClick={() => run('cast.submit', { roleId: role.id, prefer: 'in_person' })}>Ask For The Room</button>
                          )}
                        </div>
                      </div>
                    )}
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
                          {audition.format === 'self_tape' || audition.stage === 'self_tape'
                            ? (audition.tapeSentAt
                              ? `Tape sent ${formatDate(audition.tapeSentAt, sim.homeZone)}${audition.tapeTakes ? `, take ${audition.tapeTakes} of ${audition.tapeTakes}` : ''}`
                              : audition.scheduledAt ? `Tape due ${formatDate(audition.scheduledAt, sim.homeZone)}` : 'Tape')
                            : audition.scheduledAt && `${formatDate(audition.scheduledAt, sim.homeZone)} at ${formatTime(audition.scheduledAt, sim.homeZone)}`}
                          {audition.locationId && (audition.format !== 'self_tape') && ` · ${CITIES.get(audition.locationId)?.name}`}
                          {audition.locationId && audition.format !== 'self_tape' && audition.stage !== 'self_tape' && !audition.decidedAt && sim.player.currentLocationId !== audition.locationId && (
                            <span className="warning"> · you are not in the city</span>
                          )}
                          {audition.rank && ` · finished ${audition.rank}`}
                        </div>
                      </div>
                      <span className={`chip ${audition.stage === 'booked' || audition.stage === 'offer' ? 'chip-positive' : audition.stage === 'passed' ? 'chip-negative' : ''}`}>
                        {titleCaseLabel(audition.stage.replace(/_/g, ' '))}
                      </span>
                      {project && <DossierButton project={project} roleId={audition.roleId} />}
                      {!audition.decidedAt && audition.performanceScore === undefined && (audition.format === 'self_tape' || audition.stage === 'self_tape') && !audition.tapeSentAt && (
                        <button className="btn btn-sm btn-primary" onClick={() => setTaping(audition.id)}>
                          Shoot The Tape
                        </button>
                      )}
                      {!audition.decidedAt && !audition.room?.finishedAt && audition.format !== 'self_tape' && audition.stage !== 'self_tape' && (
                        <button className="btn btn-sm btn-primary" onClick={() => setInRoom(audition.id)}>
                          {audition.room ? 'Back Into The Room' : 'Go To The Room'}
                        </button>
                      )}

                    </div>

                    {audition.room?.verdict && (
                      <div className="callout" style={{ marginTop: 'var(--s2)' }}>
                        <strong className="xs">{audition.room.walkedOut ? 'You Walked Out' : 'In The Room'}</strong>
                        <p className="xs" style={{ margin: '2px 0 0' }}>{audition.room.verdict.line}</p>
                        <p className="xs dim" style={{ margin: '2px 0 0' }}>
                          {audition.room.occupants.length} behind the table · {audition.room.played.length} beats
                        </p>
                      </div>
                    )}
                    {audition.officeResponse && audition.officeResponse.kind !== 'silence' && (
                      <div className={`callout ${audition.officeResponse.kind === 'callback' ? 'callout-accent' : audition.officeResponse.kind === 'pass' ? 'callout-negative' : ''}`} style={{ marginTop: 'var(--s2)' }}>
                        <strong className="xs">The Office, {formatDate(audition.officeResponse.at, sim.homeZone)}</strong>
                        <p className="xs" style={{ margin: '2px 0 0' }}>{audition.officeResponse.note}</p>
                      </div>
                    )}
                    {audition.officeResponse?.kind === 'silence' && (
                      <p className="xs dim" style={{ margin: 'var(--s2) 0 0' }}>Nothing back from the office. They do not always send the no.</p>
                    )}
                    {audition.tapeSentAt && !audition.officeResponse && !audition.decidedAt && (
                      <p className="xs dim" style={{ margin: 'var(--s2) 0 0' }}>The tape is with them. Offices take days, sometimes weeks.</p>
                    )}

                    {audition.relayedFeedback && (
                      <div className="callout" style={{ marginTop: 'var(--s2)' }}>
                        <strong className="xs">
                          {audition.relayedFeedback.from === 'Nobody' ? 'Nothing Came Back' : `${audition.relayedFeedback.from}, ${formatDate(audition.relayedFeedback.at, sim.homeZone)}`}
                        </strong>
                        <p className="xs" style={{ margin: '2px 0 0' }}>{audition.relayedFeedback.body}</p>
                        {(audition.relayedFeedback.grades ?? []).length > 0 && (
                          <div className="row wrap gap-1" style={{ marginTop: 6 }}>
                            {audition.relayedFeedback.grades!.map((grade) => (
                              <span key={grade.axis} className="chip" title={`${grade.label}: what casting said, as it was passed on.`}>
                                {grade.label}: <strong>{grade.grade}</strong>
                              </span>
                            ))}
                          </div>
                        )}
                        {audition.relayedFeedback.blunt && (
                          <p className="xs dim" style={{ margin: '6px 0 0' }}>
                            That is the office's own note, word for word. Not every agent passes those on.
                          </p>
                        )}
                      </div>
                    )}
                    {!audition.relayedFeedback && audition.sessionRead && (
                      <div className="row-between" style={{ marginTop: 'var(--s2)', alignItems: 'flex-end' }}>
                        <p className="xs dim" style={{ margin: 0 }}>
                          They have their notes on you. Whether any of it reaches you is up to your agent.
                        </p>
                        <button
                          className="btn btn-sm"
                          title={player.representation.agencyName
                            ? `${player.representation.agencyName} rings the office. Once is normal; a second time in a month is noticed.`
                            : 'With nobody representing you, that is you ringing a casting office about yourself. They remember.'}
                          onClick={() => run('cast.chase_feedback', { auditionId: audition.id })}
                        >
                          Chase It
                        </button>
                      </div>
                    )}

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

      {tab === 'offices' && (
        <Panel title="Where You Stand" flush>
          {offices.length === 0 ? (
            <Empty
              title="No Office Has Seen You"
              body="Read for something. Casting directors keep their own notes, and the ones who like you start bringing you in without being asked."
            />
          ) : (
            <div className="list">
              {offices.map((entry) => {
                const standing = entry.standing;
                return (
                  <div key={standing.castingDirectorId} className="list-item list-static" style={{ display: 'block' }}>
                    <div className="row-between">
                      <div className="grow">
                        <div className="small strong">{entry.name}</div>
                        <div className="xs dim">
                          {[entry.office, entry.where].filter(Boolean).join(' · ')}
                        </div>
                        {entry.knownFor && <div className="xs muted" style={{ marginTop: 2 }}>{entry.knownFor}</div>}
                      </div>
                      <span className={`chip ${standing.list === 'favourite' ? 'chip-positive' : standing.list === 'unknown' ? '' : 'chip-accent'}`}>
                        {LIST_LABEL[standing.list]}
                      </span>
                    </div>
                    <p className="xs" style={{ margin: 'var(--s2) 0 0' }}>{entry.howItStands}</p>
                    <div className="row wrap gap-1" style={{ marginTop: 6 }}>
                      <span className="chip">Seen You {standing.seen === 1 ? 'Once' : `${standing.seen} Times`}</span>
                      {standing.roomsHeld > 0 && <span className="chip">{standing.roomsHeld} In The Room</span>}
                      {standing.broughtInDirectly > 0 && <span className="chip chip-accent">Called You In {standing.broughtInDirectly}×</span>}
                      {standing.booked > 0 && <span className="chip chip-positive">Booked You {standing.booked}×</span>}
                    </div>
                    {entry.lastSeen && (
                      <p className="xs dim" style={{ margin: '6px 0 0' }}>
                        Last in for {entry.lastSeen.characterName} on {entry.lastSeen.projectTitle}, {formatDate(entry.lastSeen.at, sim.homeZone)}.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <p className="xs dim" style={{ padding: 'var(--s3)' }}>
            What an office actually writes about you is theirs, not yours. This is only what you could work
            out from how they have treated you.
          </p>
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

      {inRoom && <AuditionRoomDialog auditionId={inRoom} onClose={() => setInRoom(null)} />}
      {taping && <TapeDialog auditionId={taping} onClose={() => setTaping(null)} />}
    </>
  );
}

const POLICY_LABEL: Record<string, string> = {
  tape_only: 'Tapes only',
  either: 'Tape or the room',
  in_person_only: 'In the room only',
};

function TapeDialog({ auditionId, onClose }: { auditionId: string; onClose: () => void }) {
  const { sim, run } = useGame();
  const [hours, setHours] = useState(3);
  const [takes, setTakes] = useState(3);
  const audition = sim.universe.auditions[auditionId];
  const role = audition ? sim.universe.roles[audition.roleId] : undefined;

  const submit = () => {
    const result = run('cast.send_tape', { auditionId, prepHours: hours, takes });
    if (result.ok) onClose();
  };

  return (
    <Modal
      title={`Tape For ${role?.characterName ?? 'The Part'}`}
      onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Not Yet</button><button className="btn btn-primary" onClick={submit}>Shoot It And Send It</button></>}
    >
      <p className="muted small">
        A tape is prepared, shot in takes, and sent once. Every take is twenty minutes and a little
        energy; the best one goes. After that it is out of your hands until the office writes back,
        which they do in their own time — or not at all.
      </p>
      <div className="field">
        <div className="row-between">
          <label htmlFor="tape-prep" style={{ marginBottom: 0 }}>Hours Of Preparation</label>
          <span className="mono">{hours}</span>
        </div>
        <input id="tape-prep" type="range" min={0} max={16} value={hours} onChange={(e) => setHours(Number(e.target.value))} />
      </div>
      <div className="field">
        <div className="row-between">
          <label htmlFor="tape-takes" style={{ marginBottom: 0 }}>Takes</label>
          <span className="mono">{takes}</span>
        </div>
        <input id="tape-takes" type="range" min={1} max={8} value={takes} onChange={(e) => setTakes(Number(e.target.value))} />
        <div className="row-between xs dim">
          <span>One and done</span><span>Eight, and the light has gone</span>
        </div>
      </div>
      <div className="callout">
        {takes === 1 && 'One take. Brave, or careless.'}
        {takes > 1 && takes < 5 && 'A few takes to find it. What most people do.'}
        {takes >= 5 && 'You will get the best version you have in you today. It costs the afternoon.'}
      </div>
    </Modal>
  );
}

