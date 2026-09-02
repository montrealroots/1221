import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Meter, Empty, Tabs, Modal, MoneyText } from '@/ui/components/primitives';
import { activeProjects, suggestedBudget, projectProfitLoss, phaseIndex } from '@/engine/systems/film';
import { postBoard, shootingBoard } from '@/engine/systems/production';
import { releaseSummary } from '@/engine/systems/release';
import { playerCompanies } from '@/engine/systems/company';
import { GENRES, BUYERS } from '@/engine/content/industry';
import { PROJECT_PHASE_ORDER } from '@/engine/domain/model';
import { formatMoney, formatMoneyCompact } from '@/engine/core/money';
import { formatDate, addDays } from '@/engine/core/time';

export function ProjectsWorkspace() {
  const projects = useWorld((s) => activeProjects(s, s.player.id));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const selected = projects.find((p) => p.id === selectedId) ?? projects[0];

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Projects</div>
        <h1>{projects.length > 0 ? `${projects.length} project${projects.length === 1 ? '' : 's'}` : 'Nothing in development'}</h1>
        <p className="muted">
          One record per film, all the way from an idea to a library title. Every department points at
          the same project, so nothing gets out of step with itself.
        </p>
      </div>

      <div className="row gap-2" style={{ marginBottom: 'var(--s5)' }}>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>Start something new</button>
      </div>

      {projects.length === 0 ? (
        <Empty
          title="Nothing yet"
          body="Every career here starts with someone deciding to make something. An idea costs nothing; the rights, the script and the money come after."
        />
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'minmax(220px, 300px) 1fr', gap: 'var(--s5)' }}>
          <Panel title="Your slate" flush>
            <div className="list" style={{ maxHeight: 600, overflowY: 'auto' }}>
              {projects.map((project) => (
                <button
                  key={project.id}
                  className="list-item"
                  aria-selected={selected?.id === project.id}
                  onClick={() => setSelectedId(project.id)}
                >
                  <div className="grow">
                    <div className="small strong">{project.title}</div>
                    <div className="xs dim">{project.format.replace(/_/g, ' ')} · {project.phase.replace(/_/g, ' ')}</div>
                  </div>
                </button>
              ))}
            </div>
          </Panel>

          {selected && <ProjectDetail projectId={selected.id} />}
        </div>
      )}

      {creating && <CreateProjectDialog onClose={() => setCreating(false)} />}
    </>
  );
}

function ProjectDetail({ projectId }: { projectId: string }) {
  const { sim, run } = useGame();
  const project = useWorld((s) => s.universe.projects[projectId]);
  const post = useWorld((s) => postBoard(s, projectId));
  const shooting = useWorld((s) => shootingBoard(s, projectId));
  const release = useWorld((s) => releaseSummary(s, projectId));
  const pl = useWorld((s) => projectProfitLoss(s, projectId));
  const companies = useWorld(playerCompanies);
  const roles = useWorld((s) => Object.values(s.universe.roles).filter((r) => r.projectId === projectId));
  const drafts = useWorld((s) => project?.scriptDraftIds.map((id) => s.universe.scriptDrafts[id]).filter(Boolean) ?? []);
  const [tab, setTab] = useState<'overview' | 'script' | 'cast' | 'production' | 'post' | 'release'>('overview');

  if (!project) return <Empty title="Gone" body="That project no longer exists." />;

  const currentIndex = phaseIndex(project.phase);
  const rights = project.rightsId ? sim.universe.rights[project.rightsId] : undefined;
  const company = companies[0];

  return (
    <div className="col gap-4">
      <Panel
        title={project.title}
        subtitle={`${project.format.replace(/_/g, ' ')} · ${project.genres.join(', ')} · ${project.logline}`}
      >
        <div className="row wrap gap-1" style={{ marginBottom: 'var(--s4)' }}>
          {PROJECT_PHASE_ORDER.map((phase, index) => (
            <span
              key={phase}
              className={`chip ${index === currentIndex ? 'chip-accent' : index < currentIndex ? 'chip-positive' : ''}`}
              style={index > currentIndex ? { opacity: 0.4 } : undefined}
            >
              {phase.replace(/_/g, ' ')}
            </span>
          ))}
        </div>

        <div className="grid grid-4">
          <Stat label="Budget" value={project.budget > 0 ? formatMoneyCompact(project.budget) : '—'} />
          <Stat label="Spent" value={formatMoneyCompact(project.spent)} tone={project.spent > project.budget && project.budget > 0 ? 'negative' : undefined} />
          <Stat label="Script" value={project.scriptQuality ? Math.round(project.scriptQuality) : '—'} note="out of 100" />
          <Stat label="Package" value={Math.round(project.packageValue)} note="how buyers see it" />
        </div>

        {!rights && (
          <div className="callout callout-warning" style={{ marginTop: 'var(--s4)' }}>
            <strong>No chain of title.</strong> You cannot greenlight or license this until the underlying
            rights are secured, even if you wrote it yourself.
            <div style={{ marginTop: 'var(--s2)' }}>
              <button
                className="btn btn-sm"
                onClick={() => run('film.acquire_rights', {
                  projectId: project.id, title: project.title,
                  sourceKind: 'original', acquisitionKind: 'original', cost: 0,
                })}
              >
                Register your own original material
              </button>
            </div>
          </div>
        )}
      </Panel>

      <Tabs active={tab} onChange={setTab} tabs={[
        { id: 'overview', label: 'Overview' },
        { id: 'script', label: 'Script', badge: drafts.length },
        { id: 'cast', label: 'Cast', badge: roles.length },
        { id: 'production', label: 'Production', badge: shooting.planned },
        { id: 'post', label: 'Post', badge: post.length },
        { id: 'release', label: 'Release' },
      ]} />

      {tab === 'overview' && (
        <Panel title="What happens next">
          <div className="col gap-3">
            {!project.currentDraftId && (
              <ActionRow
                label="Write the first draft"
                detail="Forty-five days of work. Quality comes from your writing skills and the time you give it."
                action={() => run('film.write_draft', { projectId: project.id })}
                cta="Write"
              />
            )}
            {project.currentDraftId && !project.greenlitAt && (
              <>
                <ActionRow
                  label="Rewrite"
                  detail="A rewrite improves on the draft you have rather than starting over."
                  action={() => run('film.write_draft', { projectId: project.id, daysSpent: 21 })}
                  cta="Rewrite"
                />
                <ActionRow
                  label="Take it out to buyers"
                  detail="Only buyers who will take your call. Access comes from reputation, package and representation."
                  action={() => run('film.pitch', { projectId: project.id })}
                  cta="Pitch"
                />
                {company && (
                  <ActionRow
                    label={`Greenlight at ${company.name}`}
                    detail={`Ceiling is ${formatMoneyCompact(company.greenlightCeiling)}. A suggested budget for this is ${formatMoneyCompact(suggestedBudget(project.format, project.genres, project.scriptQuality))}.`}
                    action={() => run('film.greenlight', {
                      projectId: project.id,
                      budget: Math.min(company.greenlightCeiling, suggestedBudget(project.format, project.genres, project.scriptQuality)),
                      companyId: company.id,
                    })}
                    cta="Greenlight"
                  />
                )}
              </>
            )}
            {project.greenlitAt && project.financingIds.length === 0 && (
              <ActionRow
                label="Arrange financing"
                detail="Production cannot start until the money is actually in a production account."
                action={() => run('film.arrange_financing', {
                  projectId: project.id,
                  productionLocationId: sim.player.currentLocationId,
                  sources: company
                    ? [{ kind: 'company', amount: Math.round(project.budget * 1.1), name: company.name }]
                    : [{ kind: 'equity', amount: Math.round(project.budget * 1.1), name: 'Equity investor' }],
                })}
                cta="Finance"
              />
            )}
            {project.greenlitAt && roles.length === 0 && (
              <ActionRow
                label="Break down the roles"
                detail="Create the parts, then open casting on each of them."
                action={() => {
                  run('cast.create_role', {
                    projectId: project.id, characterName: 'Lead', billing: 'lead',
                    description: 'The part the film rests on.',
                  });
                  run('cast.create_role', {
                    projectId: project.id, characterName: 'Supporting', billing: 'supporting',
                    description: 'The other half of the story.',
                  });
                }}
                cta="Create roles"
              />
            )}
            {project.greenlitAt && shooting.planned === 0 && roles.every((r) => r.billing !== 'lead' || r.status === 'cast') && roles.length > 0 && (
              <ActionRow
                label="Board a shooting schedule"
                detail="Days are placed on the calendar. Cast have to be in the right city on each of them."
                action={() => run('prod.build_schedule', {
                  projectId: project.id,
                  startAt: addDays(sim.now, 45, sim.homeZone),
                  locationId: sim.player.currentLocationId,
                })}
                cta="Board it"
              />
            )}
            {project.finalQuality && !release?.campaign && (
              <ActionRow
                label="Plan a campaign"
                detail="Awareness and intent decide the opening. Thirty days of runway is the minimum."
                action={() => run('rel.plan_campaign', {
                  projectId: project.id,
                  budget: Math.round(project.budget * 0.5),
                  positioning: 'The one you have to see',
                  targetAudience: project.targetAudience,
                  openingDate: addDays(sim.now, 120, sim.homeZone),
                })}
                cta="Plan"
              />
            )}
            {project.finalQuality && !project.releaseId && (
              <ActionRow
                label="Set the release"
                detail="Wide, limited, platform, day and date, or streaming exclusive. Rights decide what is even possible."
                action={() => run('rel.set_distribution', {
                  projectId: project.id,
                  strategy: 'wide_theatrical',
                  openingDate: addDays(sim.now, 120, sim.homeZone),
                })}
                cta="Set it"
              />
            )}
          </div>
        </Panel>
      )}

      {tab === 'script' && (
        <Panel title="Drafts" flush>
          {drafts.length === 0 ? (
            <Empty title="Nothing written" body="A project without a script is an idea." />
          ) : (
            <div className="list">
              {drafts.map((draft) => draft && (
                <div key={draft.id} className="list-item list-static" style={{ display: 'block' }}>
                  <div className="row-between">
                    <div>
                      <div className="small strong">{draft.label} {draft.isCurrent && <span className="chip chip-accent">current</span>}</div>
                      <div className="xs dim">{draft.pages} pages · {formatDate(draft.writtenAt, sim.homeZone)}</div>
                    </div>
                    <span className="mono">{draft.quality}</span>
                  </div>
                  <div className="grid grid-3" style={{ marginTop: 'var(--s2)' }}>
                    <Meter label="Structure" value={draft.structure} />
                    <Meter label="Dialogue" value={draft.dialogue} />
                    <Meter label="Characters" value={draft.characters} />
                  </div>
                  {draft.coverage && (
                    <div className={`callout ${draft.coverage.verdict === 'recommend' ? 'callout-accent' : draft.coverage.verdict === 'pass' ? 'callout-negative' : ''}`} style={{ marginTop: 'var(--s3)' }}>
                      <strong className="small">Coverage: {draft.coverage.verdict}</strong>
                      <p className="xs" style={{ margin: '4px 0 0' }}>{draft.coverage.comments}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {tab === 'cast' && (
        <Panel title="Roles" flush>
          {roles.length === 0 ? (
            <Empty title="No roles yet" body="Break the script down into parts before you can cast it." />
          ) : (
            <div className="list">
              {roles.map((role) => {
                const cast = role.castPersonId ? sim.universe.people[role.castPersonId] : undefined;
                return (
                  <div key={role.id} className="list-item list-static">
                    <div className="grow">
                      <div className="small strong">{role.characterName}</div>
                      <div className="xs dim">
                        {role.billing.replace(/_/g, ' ')} · {role.shootDays} days · {formatMoney(role.payLow, { cents: false })}–{formatMoney(role.payHigh, { cents: false })}
                      </div>
                      {cast && <div className="xs positive">Cast: {cast.displayName}</div>}
                    </div>
                    <span className="chip">{role.status.replace(/_/g, ' ')}</span>
                    {role.status === 'open' && (
                      <button className="btn btn-sm" onClick={() => run('cast.open_casting', { roleId: role.id })}>
                        Open casting
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      )}

      {tab === 'production' && (
        <Panel
          title="Shooting"
          subtitle={shooting.planned > 0
            ? `${shooting.shot} of ${shooting.planned} days shot · ${formatMoneyCompact(shooting.spent)} against ${formatMoneyCompact(shooting.budgeted)} planned`
            : 'Nothing boarded yet'}
          flush
        >
          {shooting.days.length === 0 ? (
            <Empty title="No schedule" body="A schedule needs a greenlight, funded money in the account, and your leads cast." />
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr><th>Day</th><th>Date</th><th>Location</th><th className="num">Pages</th><th className="num">Cost</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {shooting.days.map((day) => (
                    <tr key={day.id}>
                      <td className="mono xs">{day.dayNumber}</td>
                      <td className="xs">{formatDate(day.date, sim.homeZone)}</td>
                      <td className="xs">{day.locationName}</td>
                      <td className="num xs mono">{day.completedPages.toFixed(1)} / {day.plannedPages.toFixed(1)}</td>
                      <td className="num xs mono">{formatMoneyCompact(day.actualCost)}</td>
                      <td className="xs">
                        <span className={`chip ${day.status === 'complete' ? 'chip-positive' : day.status === 'incomplete' ? 'chip-warning' : ''}`}>
                          {day.status}
                        </span>
                        {day.incidents.length > 0 && (
                          <span className="xs dim" title={day.incidents.map((i) => i.description).join(' ')}> ⚠</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      {tab === 'post' && (
        <Panel title="Post-production" subtitle="A dependency graph. Nothing starts before what it needs is finished." flush>
          {post.length === 0 ? (
            <Empty title="Post has not opened" body="Post opens once the film has been shot." />
          ) : (
            <div className="list">
              {post.map(({ task, blockedBy, progress }) => (
                <div key={task.id} className="list-item list-static">
                  <div className="grow">
                    <div className="small strong">{task.name}</div>
                    <div className="xs dim">
                      {task.vendorName ?? 'Unassigned'} · {task.elapsedDays} of {task.plannedDays} days
                      {task.quality > 0 && ` · quality ${task.quality}`}
                    </div>
                    {blockedBy.length > 0 && (
                      <div className="xs warning">{blockedBy.join(' ')}</div>
                    )}
                  </div>
                  <div style={{ width: 110 }}>
                    <Meter label="" value={progress * 100} />
                  </div>
                  <span className={`chip ${task.status === 'complete' ? 'chip-positive' : task.status === 'blocked' ? 'chip-negative' : ''}`}>
                    {task.status.replace(/_/g, ' ')}
                  </span>
                  {task.status === 'ready' && (
                    <button className="btn btn-sm" onClick={() => run('prod.start_post_task', { taskId: task.id })}>Start</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {tab === 'release' && (
        <>
          {release?.campaign && (
            <Panel title="Campaign" subtitle={`${formatMoneyCompact(release.campaign.spent)} of ${formatMoneyCompact(release.campaign.budget)} spent`}>
              <div className="grid grid-3" style={{ marginBottom: 'var(--s4)' }}>
                <Meter label="Awareness" value={release.campaign.awareness} hint="How many people know it exists." />
                <Meter label="Intent" value={release.campaign.intent} hint="How many of those plan to see it." />
                <Stat label="Sentiment" value={Math.round(release.campaign.sentiment)} note="-100 to 100" />
              </div>
              <div className="table-scroll">
                <table>
                  <thead><tr><th>Beat</th><th>Date</th><th className="num">Spend</th><th className="num">Reach</th></tr></thead>
                  <tbody>
                    {release.campaign.beats.map((beat, i) => (
                      <tr key={i}>
                        <td className="xs" style={{ textTransform: 'capitalize' }}>{beat.kind.replace(/_/g, ' ')}</td>
                        <td className="xs">{formatDate(beat.at, sim.homeZone)}</td>
                        <td className="num xs mono">{formatMoneyCompact(beat.spend)}</td>
                        <td className="num xs mono">{beat.reach ? beat.reach.toLocaleString('en-US') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}

          {release?.release && (
            <Panel title="Release" subtitle={`${release.release.strategy.replace(/_/g, ' ')} via ${release.release.distributorName}`}>
              <div className="grid grid-4" style={{ marginBottom: 'var(--s4)' }}>
                <Stat label="Opening weekend" value={formatMoneyCompact(release.openingWeekend)} />
                <Stat label="Worldwide" value={formatMoneyCompact(release.worldGross)} />
                <Stat label="Theatres" value={release.release.theaterCount.toLocaleString('en-US')} />
                <Stat
                  label="Profit"
                  value={<MoneyText amount={release.profit} compact />}
                  tone={release.profit >= 0 ? 'positive' : 'negative'}
                />
              </div>

              {release.release.streamingResults && (
                <div className="grid grid-4" style={{ marginBottom: 'var(--s4)' }}>
                  <Stat label="Starts" value={`${(release.release.streamingResults.starts / 1_000_000).toFixed(1)}M`} />
                  <Stat label="Hours viewed" value={`${(release.release.streamingResults.hoursViewed / 1_000_000).toFixed(1)}M`} />
                  <Stat label="Completion" value={`${Math.round(release.release.streamingResults.completionRate * 100)}%`} />
                  <Stat label="Peak rank" value={`#${release.release.streamingResults.peakRank}`} />
                </div>
              )}

              {pl && (
                <div className="callout">
                  <strong className="small">Where the money went</strong>
                  <p className="xs" style={{ margin: '4px 0 0' }}>
                    {formatMoneyCompact(release.worldGross)} gross worldwide. Exhibitors keep roughly half of
                    domestic. The distributor takes {Math.round(release.release.distributorShare * 100)}% of what
                    is left, and {formatMoneyCompact(release.campaign?.spent ?? 0)} of campaign spend recoups
                    before profit. That leaves {formatMoneyCompact(pl.revenue)} of producer revenue against{' '}
                    {formatMoneyCompact(pl.cost)} of cost.
                  </p>
                </div>
              )}
            </Panel>
          )}

          {release?.reviews && release.reviews.length > 0 && (
            <Panel title="Reception" subtitle={`Critics ${project.criticScore ?? '—'} · Audience ${project.audienceScore ?? '—'}`} flush>
              <div className="list">
                {release.reviews.map((review) => (
                  <div key={review.id} className="list-item list-static">
                    <span className="mono" style={{ minWidth: 34 }}>{review.score}</span>
                    <div className="grow">
                      <div className="small strong">{review.publicationName}</div>
                      <div className="xs muted">“{review.quote}”</div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {!release && <Empty title="Not released" body="Finish the film, then plan a campaign and set a release." />}
        </>
      )}
    </div>
  );
}

function ActionRow({ label, detail, action, cta }: { label: string; detail: string; action: () => void; cta: string }) {
  return (
    <div className="row-between">
      <div className="grow">
        <div className="small strong">{label}</div>
        <div className="xs dim">{detail}</div>
      </div>
      <button className="btn btn-sm btn-primary" onClick={action}>{cta}</button>
    </div>
  );
}

function CreateProjectDialog({ onClose }: { onClose: () => void }) {
  const { run } = useGame();
  const [title, setTitle] = useState('');
  const [format, setFormat] = useState<'feature' | 'series' | 'limited_series' | 'short' | 'documentary'>('feature');
  const [genres, setGenres] = useState<string[]>(['drama']);
  const [logline, setLogline] = useState('');

  const submit = () => {
    const result = run('film.create_project', { title, format, genres, logline: logline || 'An untitled project.' });
    if (result.ok) onClose();
  };

  return (
    <Modal
      title="Start a project"
      onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={submit}>Create</button></>}
    >
      <div className="field">
        <label htmlFor="title">Title</label>
        <input id="title" type="text" value={title} placeholder="Leave blank and one will be suggested" onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="format">Format</label>
        <select id="format" value={format} onChange={(e) => setFormat(e.target.value as typeof format)}>
          <option value="feature">Feature</option>
          <option value="short">Short</option>
          <option value="series">Series</option>
          <option value="limited_series">Limited series</option>
          <option value="documentary">Documentary</option>
        </select>
      </div>
      <div className="field">
        <label>Genres</label>
        <div className="row wrap gap-1">
          {GENRES.map((genre) => (
            <button
              key={genre}
              className="chip"
              aria-pressed={genres.includes(genre)}
              style={genres.includes(genre) ? { background: 'var(--accent-dim)', color: 'var(--accent-strong)', borderColor: 'var(--accent-line)' } : undefined}
              onClick={() => setGenres((g) => g.includes(genre) ? g.filter((x) => x !== genre) : [...g, genre].slice(0, 3))}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label htmlFor="logline">Logline</label>
        <textarea id="logline" value={logline} onChange={(e) => setLogline(e.target.value)} placeholder="One sentence. What is it about?" />
      </div>
      <div className="callout">
        Buyers who might want this: {BUYERS.all().filter((b) => genres.some((g) => b.wants.includes(g))).map((b) => b.name).join(', ') || 'none obviously'}.
      </div>
    </Modal>
  );
}
