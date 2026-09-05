import { formatLabel, titleCaseLabel } from '@/engine/core/text';
import { STUDIOS } from '@/engine/content/studios';
import { CRAFT_LABEL, craftFocus, genre, genreName, genresByCategory, runtimeBandOf, suggestedPairings } from '@/engine/content/genres';
import { rating, ratingsFor } from '@/engine/content/ratings';
import { SLOT_EXPLAIN, SLOT_LABEL, buildLogline } from '@/engine/content/logline';
import { countryOfCity } from '@/engine/content/geography';
import { useMemo, useState, type ReactNode } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Meter, Empty, Tabs, Modal, MoneyText } from '@/ui/components/primitives';
import { activeProjects, suggestedBudget, projectProfitLoss, phaseIndex } from '@/engine/systems/film';
import { postBoard, shootingBoard } from '@/engine/systems/production';
import { releaseSummary } from '@/engine/systems/release';
import { receptionSummary } from '@/engine/systems/critics';
import { AGGREGATOR_RULES } from '@/engine/content/critics';
import { playerCompanies } from '@/engine/systems/company';
import { BUYERS } from '@/engine/content/industry';
import { PROJECT_PHASE_ORDER, type ProjectFormat } from '@/engine/domain/model';
import { formatMoney, formatMoneyCompact } from '@/engine/core/money';
import { formatDate, addDays } from '@/engine/core/time';
import { ApproachCraftDialog, OfferRealDialog } from '@/ui/components/ApproachRoom';
import { CRAFT_ROLE_LABEL, type CraftRole } from '@/engine/content/craft-attributes';
import { personByQid } from '@/engine/content/people';
import { pipelineFor } from '@/engine/content/pipelines';
import { heatSummary } from '@/engine/systems/reactive';
import { CastingRooms, CutRoom, EffectsRoom, HousePicker, MusicRoom, PostHouseLine, ScriptDocument, ShootDayRow, StageBookingPanel } from '@/ui/components/ProductionRooms';

export function ProjectsWorkspace() {
  const projects = useWorld((s) => activeProjects(s, s.player.id));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const selected = projects.find((p) => p.id === selectedId) ?? projects[0];

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Projects</div>
        <h1>{projects.length > 0 ? `${projects.length} Project${projects.length === 1 ? '' : 's'}` : 'Nothing In Development'}</h1>
        <p className="muted">
          One record per film, all the way from an idea to a library title. Every department points at
          the same project, so nothing gets out of step with itself.
        </p>
      </div>

      <div className="row gap-2" style={{ marginBottom: 'var(--s5)' }}>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>Start Something New</button>
      </div>

      {projects.length === 0 ? (
        <Empty
          title="Nothing Yet"
          body="Every career here starts with someone deciding to make something. An idea costs nothing; the rights, the script and the money come after."
        />
      ) : (
        <div className="master-detail">
          <Panel title="Your Slate" flush>
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
                    <div className="xs dim">{formatLabel(project.format)} · {titleCaseLabel(project.phase.replace(/_/g, ' '))}</div>
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

/**
 * The chairs a picture has, and what each one is for. A showrunner only appears
 * on a series, because only a series has one.
 */
const CRAFT_CHAIRS: { role: Exclude<CraftRole, 'actor'>; attachment: string; note: string }[] = [
  { role: 'director', attachment: 'director', note: 'The one whose picture it becomes. Attaching one is what makes a package a package.' },
  { role: 'showrunner', attachment: 'showrunner', note: 'Runs the room, the writing and the season. A series lives or dies on this chair.' },
  { role: 'producer', attachment: 'producer', note: 'The one who gets it made. A name here opens doors a script alone will not.' },
  { role: 'cinematographer', attachment: 'cinematographer', note: 'How it looks, and how fast it can be shot. Chosen with the director, in prep.' },
  { role: 'composer', attachment: 'composer', note: 'The score. Nothing to write until there is a cut, but the deal is done early.' },
];

function ProjectDetail({ projectId }: { projectId: string }) {
  const { sim, run } = useGame();
  const project = useWorld((s) => s.universe.projects[projectId]);
  const post = useWorld((s) => postBoard(s, projectId));
  const shooting = useWorld((s) => shootingBoard(s, projectId));
  const release = useWorld((s) => releaseSummary(s, projectId));
  const campaign = useWorld((s) => Object.values(s.universe.marketingCampaigns).find((c) => c.projectId === projectId));
  const pl = useWorld((s) => projectProfitLoss(s, projectId));
  const companies = useWorld(playerCompanies);
  const roles = useWorld((s) => Object.values(s.universe.roles).filter((r) => r.projectId === projectId));
  const drafts = useWorld((s) => project?.scriptDraftIds.map((id) => s.universe.scriptDrafts[id]).filter(Boolean) ?? []);
  const [tab, setTab] = useState<'overview' | 'script' | 'cast' | 'production' | 'post' | 'release'>('overview');
  // Which part you are taking to somebody by name, and which chair you are
  // trying to fill. Only one of either is ever open.
  const [offering, setOffering] = useState<string | null>(null);
  const [approaching, setApproaching] = useState<Exclude<CraftRole, 'actor'> | null>(null);

  if (!project) return <Empty title="Gone" body="That project no longer exists." />;

  const currentIndex = phaseIndex(project.phase);
  const pipeline = pipelineFor(project);
  const heat = heatSummary(project);
  const rights = project.rightsId ? sim.universe.rights[project.rightsId] : undefined;
  const company = companies[0];

  return (
    <div className="col gap-4">
      <Panel
        title={project.title}
        subtitle={`${formatLabel(project.format)} · ${project.genres.map(titleCaseLabel).join(', ')} · ${project.logline}`}
      >
        <div className="row wrap gap-1" style={{ marginBottom: 'var(--s4)' }}>
          {PROJECT_PHASE_ORDER.map((phase, index) => (
            <span
              key={phase}
              className={`chip ${index === currentIndex ? 'chip-accent' : index < currentIndex ? 'chip-positive' : ''}`}
              style={index > currentIndex ? { opacity: 0.4 } : undefined}
            >
              {titleCaseLabel(phase.replace(/_/g, ' '))}
            </span>
          ))}
        </div>

        <div className="grid grid-4">
          <Stat label="Budget" value={project.budget > 0 ? formatMoneyCompact(project.budget) : '—'} />
          <Stat label="Spent" value={formatMoneyCompact(project.spent)} tone={project.spent > project.budget && project.budget > 0 ? 'negative' : undefined} />
          <Stat label="Script" value={project.scriptQuality ? Math.round(project.scriptQuality) : '—'} note="out of 100" />
          <Stat label="Package" value={Math.round(project.packageValue)} note="how buyers see it" />
        </div>

        {heat.heat > 0 && (
          <div className={`callout ${heat.heat > 45 ? 'callout-negative' : 'callout-warning'}`} style={{ marginTop: 'var(--s4)' }}>
            <strong>What This Picture Is Carrying.</strong> {heat.note}
            <div className="xs dim" style={{ marginTop: 'var(--s2)' }}>
              {heat.log.slice(-3).reverse().map((entry, i) => (
                <div key={i}>{formatDate(entry.at, sim.homeZone)} · {entry.note}</div>
              ))}
            </div>
            {Object.values(sim.universe.decisions).some((d) => d.refId === project.id && !d.resolvedAt && d.category === 'business') && (
              <div className="row gap-2" style={{ marginTop: 'var(--s2)' }}>
                <button className="btn btn-sm btn-primary" onClick={() => run('pr.statement', { projectId: project.id })}>Get Ahead Of It</button>
                <button className="btn btn-sm" onClick={() => run('pr.ride_it_out', { projectId: project.id })}>Say Nothing</button>
              </div>
            )}
          </div>
        )}

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
                Register Your Own Original Material
              </button>
            </div>
          </div>
        )}
      </Panel>

      <Tabs active={tab} onChange={setTab} tabs={[
        { id: 'overview', label: 'Overview' },
        { id: 'script', label: 'Script', badge: drafts.length },
        { id: 'cast', label: 'Cast', badge: roles.length },
        { id: 'production', label: pipeline.kind === 'live_action' ? 'Production' : pipeline.label, badge: shooting.planned },
        { id: 'post', label: 'Post', badge: post.length },
        { id: 'release', label: 'Release' },
      ]} />

      {tab === 'overview' && (
        <Panel title="What Happens Next">
          <div className="col gap-3">
            {!project.currentDraftId && (
              <ActionRow
                label="Write The First Draft"
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
                  label="Take It Out To Buyers"
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
                label="Arrange Financing"
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
                label="Break Down The Roles"
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
                label={pipeline.scheduleCta}
                detail={pipeline.scheduleNote}
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
                label="Plan A Campaign"
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
            {campaign && project.studioId && !campaign.studioPush && (!release || release.release.status === 'planned') && (
              <ActionRow
                label={`Ask ${STUDIOS.get(project.studioId)?.shortName ?? 'The Studio'} For More Prints And Advertising`}
                detail="Once. They decide on your standing with them and what they have seen of the picture; a no costs you a little of both."
                action={() => run('studio.request_pa', { projectId: project.id })}
                cta="Ask"
              />
            )}
            {project.finalQuality && !project.releaseId && (
              <ActionRow
                label="Set The Release"
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
            <Empty title="Nothing Written" body="A project without a script is an idea." />
          ) : (
            <div className="list">
              {drafts.map((draft) => draft && (
                <div key={draft.id} className="list-item list-static" style={{ display: 'block' }}>
                  <div className="row-between">
                    <div>
                      <div className="small strong">{draft.label} {draft.isCurrent && <span className="chip chip-accent">Current</span>}</div>
                      <div className="xs dim">{draft.pages} pages · {formatDate(draft.writtenAt, sim.homeZone)}</div>
                    </div>
                    <span className="mono">{draft.quality}</span>
                  </div>
                  {draft.isCurrent ? (
                    <ScriptDocument project={project} draft={draft} />
                  ) : (
                    <div className="grid grid-3" style={{ marginTop: 'var(--s2)' }}>
                      <Meter label="Structure" value={draft.structure} />
                      <Meter label="Dialogue" value={draft.dialogue} />
                      <Meter label="Characters" value={draft.characters} />
                    </div>
                  )}
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
        <div className="col gap-4">
          <Panel
            title="The Chairs"
            subtitle="A picture is who is on it. Go to somebody by name and they can say no."
            flush
          >
            <div className="list">
              {CRAFT_CHAIRS.filter((chair) => chair.role !== 'showrunner' || project.format === 'series' || project.format === 'limited_series')
                .map((chair) => {
                  const sitting = project.attachments.find((a) => a.role === chair.attachment);
                  const person = sitting ? sim.universe.people[sitting.personId] : undefined;
                  const record = person?.recordQid ? personByQid(person.recordQid) : undefined;
                  return (
                    <div key={chair.role} className="list-item list-static">
                      <div className="grow">
                        <div className="small strong">{CRAFT_ROLE_LABEL[chair.role]}</div>
                        <div className="xs dim">{chair.note}</div>
                        {person && (
                          <div className="xs positive">
                            {person.displayName}
                            {record ? ` · ${record.creditCount} credits on the record` : ''}
                          </div>
                        )}
                      </div>
                      {person
                        ? <span className="chip chip-positive">Attached</span>
                        : (
                          <button className="btn btn-sm" onClick={() => setApproaching(chair.role)}>
                            Approach Somebody
                          </button>
                        )}
                    </div>
                  );
                })}
            </div>
          </Panel>

          <Panel
            title="Roles"
            actions={project.greenlitAt && roles.length === 0 && project.currentDraftId ? (
              <button className="btn btn-sm btn-primary" onClick={() => run('cast.break_down_script', { projectId: project.id })}>Break Down The Script</button>
            ) : undefined}
            flush
          >
            {roles.length === 0 ? (
              <Empty title="No Roles Yet" body="Break the script down into parts before you can cast it." />
            ) : (
              <div className="list">
                {roles.map((role) => {
                  const cast = role.castPersonId ? sim.universe.people[role.castPersonId] : undefined;
                  const passes = (role.offers ?? []).filter((offer) => offer.answer === 'declined');
                  return (
                    <div key={role.id} className="list-item list-static">
                      <div className="grow">
                        <div className="small strong">{role.characterName}{role.archetype ? <span className="chip" style={{ marginLeft: 6 }}>{titleCaseLabel(role.archetype.replace(/_/g, ' '))}</span> : null}</div>
                        <div className="xs dim">
                          {titleCaseLabel(role.billing.replace(/_/g, ' '))} · {role.shootDays} days · {formatMoney(role.payLow, { cents: false })}–{formatMoney(role.payHigh, { cents: false })} · ages {role.ageRange[0]}–{role.ageRange[1]}
                          {role.sceneNumbers && role.sceneNumbers.length > 0 ? ` · ${role.sceneNumbers.length} scenes` : ''}
                        </div>
                        {cast && <div className="xs positive">Cast: {cast.displayName}</div>}
                        {passes.length > 0 && !cast && (
                          <div className="xs muted" style={{ marginTop: 2 }}>
                            Passed: {passes.map((offer) => `${offer.name} at ${formatMoneyCompact(offer.amount)}`).join(', ')}
                          </div>
                        )}
                        <CastingRooms project={project} role={role} />
                      </div>
                      <span className="chip">{titleCaseLabel(role.status.replace(/_/g, ' '))}</span>
                      {(role.status === 'open' || role.status === 'casting') && (
                        <button className="btn btn-sm" onClick={() => setOffering(role.id)}>
                          Offer It To Somebody
                        </button>
                      )}
                      {role.status === 'open' && (
                        <button className="btn btn-sm" onClick={() => run('cast.open_casting', { roleId: role.id })}>
                          Open Casting
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>
      )}

      {tab === 'production' && (
        <Panel
          title={pipeline.label}
          subtitle={shooting.planned > 0
            ? `${shooting.shot} of ${shooting.planned} ${pipeline.units.toLowerCase()} done · ${formatMoneyCompact(shooting.spent)} against ${formatMoneyCompact(shooting.budgeted)} planned`
            : pipeline.how}
          flush
        >
          {shooting.days.length === 0 ? (
            <Empty title="No Schedule" body={`${pipeline.how} It needs a greenlight, funded money in the account, and your leads cast.`} />
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr><th>{pipeline.unit}</th><th>Date</th><th>Where</th><th className="num">Done</th><th className="num">Cost</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {shooting.days.map((day) => <ShootDayRow key={day.id} day={day} project={project} />)}
                </tbody>
              </table>
            </div>
          )}
          {shooting.days.length > 0 && (
            <div style={{ padding: 'var(--s3)' }}>
              <div className="xs dim">
                {shooting.pagesShot} of {shooting.pagesPlanned} pages shot · {shooting.hoursWorked} hours on the floor. Click a day for its call sheet and the hours as they happened.
              </div>
            </div>
          )}
        </Panel>
      )}
      {tab === 'production' && project.greenlitAt && <StageBookingPanel project={project} />}

      {tab === 'post' && post.length > 0 && (
        <div className="col gap-4">
          <CutRoom project={project} />
          <EffectsRoom project={project} />
          <MusicRoom project={project} />
        </div>
      )}
      {tab === 'post' && (
        <Panel title="Post-production" subtitle="A dependency graph. Nothing starts before what it needs is finished. Every task can be placed with a real house." flush>
          {post.length === 0 ? (
            <Empty title="Post Has Not Opened" body="Post opens once the film has been shot." />
          ) : (
            <div className="list">
              {post.map(({ task, blockedBy, progress }) => (
                <div key={task.id} className="list-item list-static">
                  <div className="grow">
                    <div className="small strong">{task.name}</div>
                    <div className="xs dim">
                      {task.vendorName ?? 'Unassigned'}<PostHouseLine task={task} /> · {Math.round(task.elapsedDays)} of {task.plannedDays} days · {formatMoneyCompact(task.budgeted)}
                      {task.quality > 0 && ` · quality ${task.quality}`}
                    </div>
                    <div style={{ marginTop: 4 }}><HousePicker project={project} task={task} /></div>
                    {blockedBy.length > 0 && (
                      <div className="xs warning">{blockedBy.join(' ')}</div>
                    )}
                  </div>
                  <div style={{ width: 110 }}>
                    <Meter label="" value={progress * 100} />
                  </div>
                  <span className={`chip ${task.status === 'complete' ? 'chip-positive' : task.status === 'blocked' ? 'chip-negative' : ''}`}>
                    {titleCaseLabel(task.status.replace(/_/g, ' '))}
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
                        <td className="xs" style={{ textTransform: 'capitalize' }}>{titleCaseLabel(beat.kind.replace(/_/g, ' '))}</td>
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
            <Panel title="Release" subtitle={`${titleCaseLabel(release.release.strategy.replace(/_/g, ' '))} via ${release.release.distributorName}`}>
              <div className="grid grid-4" style={{ marginBottom: 'var(--s4)' }}>
                <Stat label="Opening Weekend" value={formatMoneyCompact(release.openingWeekend)} />
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
                  <Stat label="Hours Viewed" value={`${(release.release.streamingResults.hoursViewed / 1_000_000).toFixed(1)}M`} />
                  <Stat label="Completion" value={`${Math.round(release.release.streamingResults.completionRate * 100)}%`} />
                  <Stat label="Peak Rank" value={`#${release.release.streamingResults.peakRank}`} />
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

          {release && <ReceptionPanel projectId={project.id} />}

          {!release && <Empty title="Not Released" body="Finish the film, then plan a campaign and set a release." />}
        </>
      )}

      {offering && <OfferRealDialog roleId={offering} onClose={() => setOffering(null)} />}
      {approaching && (
        <ApproachCraftDialog projectId={project.id} role={approaching} onClose={() => setApproaching(null)} />
      )}
    </div>
  );
}

/**
 * Reception, counted the way the aggregators count it. Nothing shows before
 * it has been counted; a blank is a blank.
 */
function ReceptionPanel({ projectId }: { projectId: string }) {
  const { sim, run } = useGame();
  const summary = useWorld((s) => receptionSummary(s, projectId));
  const project = useWorld((s) => s.universe.projects[projectId]);
  const [embargoDays, setEmbargoDays] = useState(7);
  if (!summary || !project) return null;
  const r = summary.reception;
  const release = project.releaseId ? sim.universe.releases[project.releaseId] : undefined;
  const controls = !project.studioId;
  const planned = release?.status === 'planned';
  const statusTone = summary.status === 'Certified Fresh' || summary.status === 'Fresh' ? 'chip-positive' : summary.status === 'Rotten' ? 'chip-negative' : '';
  const minimum = AGGREGATOR_RULES.metacritic.minimumReviews;

  return (
    <Panel title="Reception" subtitle={r ? summary.line : 'Nothing counted yet. Reviews land when the embargo lifts.'} flush>
      {r && r.embargoAt !== undefined && (
        <div className="xs dim" style={{ padding: 'var(--s2) var(--s4) 0' }}>
          Embargo lifts {formatDate(r.embargoAt, sim.homeZone)}, set by {r.embargoSetBy === 'player' ? 'you' : project.distributorName ?? 'the distributor'}.
          {r.embargoSetBy === 'distributor' && release && r.embargoAt >= release.openingDate ? ' Lifting on opening day is what a nervous distributor does.' : ''}
        </div>
      )}
      {planned && controls && (
        <div className="row wrap gap-2" style={{ padding: 'var(--s2) var(--s4)' }}>
          <label className="xs dim" htmlFor="embargo-days">Lift The Embargo</label>
          <select id="embargo-days" className="btn btn-sm" value={embargoDays} onChange={(e) => setEmbargoDays(Number(e.target.value))}>
            {[14, 10, 7, 5, 3, 1, 0].map((d) => <option key={d} value={d}>{d === 0 ? 'Opening Day' : `${d} Days Before`}</option>)}
          </select>
          <button className="btn btn-sm" onClick={() => release && run('crit.set_embargo', { projectId, at: addDays(release.openingDate, -embargoDays, sim.homeZone) + 15 * 60 * 60 * 1000 })}>Set</button>
        </div>
      )}
      {r && r.tomatometer !== undefined && (
        <div className="grid grid-3" style={{ padding: 'var(--s2) var(--s4)' }}>
          <Stat label="Tomatometer" value={<>{r.tomatometer}% <span className={`chip ${statusTone}`}>{summary.status}</span></>} note={`${r.reviewCount} Reviews${r.topCriticsScore !== undefined ? ` · Top Critics ${r.topCriticsScore}% Of ${r.topCriticCount}` : ''}`} />
          <Stat label="Metascore" value={r.metascore !== undefined && r.metacriticCount >= minimum ? <>{r.metascore} <span className={`chip ${summary.band?.colour === 'green' ? 'chip-positive' : summary.band?.colour === 'red' ? 'chip-negative' : 'chip-warning'}`}>{summary.band?.label}</span></> : 'Not Yet Counted'} note={r.metacriticCount >= minimum ? `${r.metacriticCount} Critics${r.mustSee ? ' · Must-See' : ''}` : `${r.metacriticCount} Of ${minimum} Critics Needed`} />
          <Stat label="CinemaScore" value={r.cinemaScore ?? (release && release.theaterCount >= AGGREGATOR_RULES.cinemaScore.minimumTheaters ? 'Opening Night' : 'Not Polled')} note={r.cinemaScore ? 'Opening-Night Audiences' : release && release.theaterCount < AGGREGATOR_RULES.cinemaScore.minimumTheaters ? 'Wide Releases Only' : undefined} />
          <Stat label="Audience Score" value={r.audienceScore !== undefined ? `${r.audienceScore}%` : 'Not Yet Counted'} note={r.audienceCount > 0 ? `${r.audienceCount.toLocaleString('en-US')} Ratings` : 'Fills After Release'} />
          <Stat label="IMDb" value={r.imdbRating !== undefined ? `${r.imdbRating.toFixed(1)}/10` : 'Not Yet Counted'} note={r.imdbVotes > 0 ? `${r.imdbVotes.toLocaleString('en-US')} Votes${r.imdbVotes < AGGREGATOR_RULES.imdb.settledVotes ? ' · Early' : ''}` : undefined} />
          <Stat label="Counted So Far" value={`${r.waves.length} ${r.waves.length === 1 ? 'Wave' : 'Waves'}`} note={r.waves.map((w) => titleCaseLabel(w)).join(', ') || 'None Yet'} />
        </div>
      )}
      {summary.reviews.length > 0 && (
        <div className="list">
          {summary.reviews.map((review) => (
            <div key={review.id} className="list-item list-static">
              <span className="mono nowrap" style={{ minWidth: 92 }}>{review.scaleText ?? review.score}</span>
              <div className="grow" style={{ minWidth: 0 }}>
                <div className="small strong">{review.publicationName}{review.topCritic ? <span className="chip" style={{ marginLeft: 6 }}>Top Critic</span> : null}</div>
                <div className="xs muted">“{review.quote}”</div>
              </div>
              {review.verdict && <span className={`chip ${review.verdict === 'fresh' ? 'chip-positive' : 'chip-negative'}`}>{titleCaseLabel(review.verdict)}</span>}
            </div>
          ))}
        </div>
      )}
      <p className="xs dim" style={{ padding: 'var(--s2) var(--s4) var(--s3)' }}>
        Real outlets, each in its own scale and taste; no verdict is attributed to a named critic. Counted critics beyond the named ones are in the totals.
      </p>
    </Panel>
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

/** The notes that ship as the example, so the builder can be tried without inventing anything. */
const LOGLINE_EXAMPLE = [
  'a retired hitman',
  'his old crew comes back',
  'wants out',
  'the cartel will not let him go',
  'his daughter pays for it',
].map((line) => `- ${line}`).join('\n');

/**
 * Bullet points in, a logline out. It reads each fragment, works out which part
 * of a logline it is, and builds the sentence — then shows its working, so what
 * it could not find is named rather than filled in with something plausible.
 */
function LoglineBuilder({ genres, onUse }: { genres: readonly string[]; onUse: (line: string) => void }) {
  const [notes, setNotes] = useState('');
  const built = useMemo(() => (notes.trim() ? buildLogline(notes, genres) : null), [notes, genres]);

  return (
    <div className="callout callout-accent" style={{ marginTop: 'var(--s3)' }}>
      <div className="row-between" style={{ marginBottom: 'var(--s2)' }}>
        <div className="small strong">The Logline Builder</div>
        <button className="link xs" onClick={() => setNotes(LOGLINE_EXAMPLE)}>Fill It With An Example</button>
      </div>
      <div className="xs dim" style={{ marginBottom: 'var(--s2)' }}>
        One thought per line. Who it is, what happens to them, what they now want, who is in the way,
        and what it costs if they fail — in any order, in your own words. This is a parser and a grammar
        rather than a language model: it runs offline, it never invents a fact you did not type, and the
        same notes always give you the same line.
      </div>
      <textarea
        aria-label="Bullet Points For The Logline"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={LOGLINE_EXAMPLE}
        style={{ minHeight: 108 }}
      />
      {built && built.logline.length > 0 && (
        <>
          <div
            className="small strong"
            style={{ marginTop: 'var(--s3)', padding: 'var(--s3)', background: 'var(--surface-2)', borderRadius: 8, lineHeight: 1.5, overflowWrap: 'anywhere' }}
          >
            {built.logline}
          </div>
          <div className="row-between gap-2" style={{ marginTop: 'var(--s2)', alignItems: 'flex-end' }}>
            <div className="grow" style={{ minWidth: 0 }}>
              <Meter
                label="How Much Of A Logline This Is"
                value={built.score}
                hint={`${built.filled.length} of the eight parts are in the sentence.`}
              />
            </div>
            <button className="btn btn-sm btn-primary" onClick={() => onUse(built.logline)}>Use This Line</button>
          </div>
        </>
      )}
      {built && built.logline.length === 0 && (
        <div className="xs dim" style={{ marginTop: 'var(--s2)' }}>
          There is not enough there yet to build a sentence. Start with who it happens to.
        </div>
      )}
      {built && built.notes.length > 0 && (
        <div style={{ marginTop: 'var(--s3)' }}>
          <div className="xs dim" style={{ marginBottom: 4 }}>What It Made Of Each Line</div>
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            {built.notes.map((note, i) => (
              <div key={`${note.slot}-${i}`} className="xs" style={{ padding: '3px 0', borderTop: i === 0 ? undefined : '1px solid var(--line)', overflowWrap: 'anywhere' }}>
                <span className="strong">{SLOT_LABEL[note.slot]}</span>
                <span className="dim"> · {note.raw}</span>
                <div className="dim">{note.why}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {built && built.missing.length > 0 && (
        <div className="xs" style={{ marginTop: 'var(--s3)' }}>
          <span className="dim">Still missing: </span>
          {built.missing.map((slot) => (
            <span key={slot} className="chip chip-warning" title={SLOT_EXPLAIN[slot]} style={{ marginRight: 4 }}>{SLOT_LABEL[slot]}</span>
          ))}
        </div>
      )}
      {built && built.advice.length > 0 && (
        <ul className="xs dim" style={{ marginTop: 'var(--s2)', paddingLeft: '1.1em' }}>
          {built.advice.slice(0, 4).map((line) => <li key={line} style={{ overflowWrap: 'anywhere' }}>{line}</li>)}
        </ul>
      )}
    </div>
  );
}

function CreateProjectDialog({ onClose }: { onClose: () => void }) {
  const { sim, run } = useGame();
  const [title, setTitle] = useState('');
  const [format, setFormat] = useState<ProjectFormat>('feature');
  const [genres, setGenres] = useState<string[]>(['drama']);
  const [logline, setLogline] = useState('');
  const [query, setQuery] = useState('');
  const [openGenre, setOpenGenre] = useState<string | null>(null);
  const [contentRating, setContentRating] = useState('');
  const [runtime, setRuntime] = useState<number | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const television = format === 'series' || format === 'limited_series' || format === 'tv_movie';
  const home = countryOfCity(sim.player.currentLocationId) ?? 'us';
  const certificates = useMemo(() => ratingsFor(home, television), [home, television]);
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return genresByCategory()
      .map((group: ReturnType<typeof genresByCategory>[number]) => ({
        ...group,
        genres: group.genres.filter((g: { formats: readonly string[]; name: string; description: string }) => (g.formats as readonly string[]).includes(format)
          && (!q || g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q))),
      }))
      .filter((group: { genres: unknown[] }) => group.genres.length > 0);
  }, [format, query]);
  const band = runtimeBandOf(genres);
  const focus = craftFocus(genres);
  const suggested = suggestedPairings(genres).slice(0, 6);
  const chosenRating = contentRating ? rating(contentRating) : undefined;

  const toggle = (id: string) => {
    setGenres((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id].slice(0, 3)));
    setError(null);
  };

  const submit = () => {
    if (genres.length === 0) { setError('Pick at least one genre.'); return; }
    const result = run('film.create_project', {
      title, format, genres, logline: logline || 'An untitled project.',
      contentRating: contentRating || undefined,
      runtime: runtime ?? undefined,
    });
    if (result.ok) onClose(); else setError(result.error ?? 'It could not be set up.');
  };

  return (
    <Modal
      title="Start A Project"
      onClose={onClose}
      wide
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={submit}>Create</button></>}
    >
      <div className="grid grid-2">
        <div className="field">
          <label htmlFor="title">Title</label>
          <input id="title" type="text" value={title} placeholder="Leave blank and one will be suggested" onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="format">Format</label>
          <select id="format" value={format} onChange={(e) => { setFormat(e.target.value as ProjectFormat); setRuntime(null); }}>
            <option value="feature">Feature</option>
            <option value="short">Short</option>
            <option value="series">Series</option>
            <option value="limited_series">Limited Series</option>
            <option value="documentary">Documentary</option>
            <option value="tv_movie">TV Movie</option>
          </select>
        </div>
      </div>

      <div className="field">
        <div className="row-between">
          <label htmlFor="genre-search">Genres <span className="dim">({genres.length} of 3)</span></label>
          <input
            id="genre-search" type="text" value={query} placeholder="Search all genres"
            onChange={(e) => setQuery(e.target.value)} style={{ maxWidth: 220 }}
          />
        </div>
        {genres.length > 0 && (
          <div className="row wrap gap-1" style={{ marginBottom: 'var(--s2)' }}>
            {genres.map((id) => (
              <button key={id} className="chip chip-positive" onClick={() => toggle(id)} title="Remove">{genreName(id)} ✕</button>
            ))}
          </div>
        )}
        <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid var(--line)', borderRadius: 8, padding: 'var(--s2)' }}>
          {groups.map((group) => (
            <div key={group.category} style={{ marginBottom: 'var(--s3)' }}>
              <div className="xs dim" style={{ marginBottom: 4 }}>{group.label}</div>
              <div className="row wrap gap-1">
                {group.genres.map((g) => (
                  <button
                    key={g.id}
                    className="chip"
                    aria-pressed={genres.includes(g.id)}
                    title={g.description}
                    style={genres.includes(g.id) ? { background: 'var(--accent-dim)', color: 'var(--accent-strong)', borderColor: 'var(--accent-line)' } : undefined}
                    onClick={() => toggle(g.id)}
                    onMouseEnter={() => setOpenGenre(g.id)}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {groups.length === 0 && <div className="small dim">Nothing matches that in this format.</div>}
        </div>
        {openGenre && genre(openGenre) && (
          <div className="xs dim" style={{ marginTop: 'var(--s2)' }}>
            <span className="strong">{genre(openGenre)!.name}.</span> {genre(openGenre)!.description} <span className="dim">{genre(openGenre)!.convention}</span>
          </div>
        )}
        {suggested.length > 0 && (
          <div className="xs dim" style={{ marginTop: 'var(--s2)' }}>
            Usually paired with: {suggested.map((g) => (
              <button key={g.id} className="link" onClick={() => toggle(g.id)}>{g.name}</button>
            )).reduce<ReactNode[]>((all, node, i) => (i === 0 ? [node] : [...all, ', ', node]), [])}.
          </div>
        )}
      </div>

      <div className="grid grid-2">
        <div className="field">
          <label htmlFor="certificate">Certificate</label>
          <select id="certificate" value={contentRating} onChange={(e) => setContentRating(e.target.value)}>
            <option value="">Undecided</option>
            {certificates.map((r: { id: string; code: string; name: string }) => <option key={r.id} value={r.id}>{r.code} — {r.name}</option>)}
          </select>
          {chosenRating && (
            <div className="xs dim">
              {chosenRating.description} <span className="strong">Permits:</span> {chosenRating.permits} <span className="strong">Limit:</span> {chosenRating.limit}
              {chosenRating.reach < 1 && <> It leaves about {Math.round(chosenRating.reach * 100)}% of the audience able to buy a ticket.</>}
            </div>
          )}
        </div>
        <div className="field">
          <label htmlFor="runtime">Runtime <span className="dim">minutes</span></label>
          <input
            id="runtime" type="number" min={1} max={600}
            value={runtime ?? ''} placeholder={`${Math.round((band[0] + band[1]) / 2)}`}
            onChange={(e) => setRuntime(e.target.value === '' ? null : Number(e.target.value))}
          />
          <div className="xs dim">{genreName(genres[0] ?? 'drama')} usually runs {band[0]} to {band[1]} minutes. Anything from one minute to ten hours is yours to choose.</div>
        </div>
      </div>

      <div className="field">
        <div className="row-between">
          <label htmlFor="logline">Logline</label>
          <button className="link xs" onClick={() => setBuilderOpen((v) => !v)}>
            {builderOpen ? 'Write It Myself' : 'Build It From Bullet Points'}
          </button>
        </div>
        <textarea id="logline" value={logline} onChange={(e) => setLogline(e.target.value)} placeholder="One sentence. What is it about?" />
        {builderOpen && <LoglineBuilder genres={genres} onUse={setLogline} />}
      </div>

      <div className="callout">
        <div className="small"><span className="strong">What this will be judged on.</span> {focus.map((d) => CRAFT_LABEL[d]).join(', ')} — that is what {genres.map(genreName).join(' and ')} lives or dies on, and it is what the script gets scored against.</div>
        <div className="small" style={{ marginTop: 'var(--s2)' }}>
          <span className="dim">Buyers who want this: </span>
          {BUYERS.all().filter((b) => genres.some((g) => b.wants.includes(g))).slice(0, 8).map((b) => b.name).join(', ') || 'nobody obviously, which is not the same as nobody'}.
        </div>
      </div>
      {error && <div className="callout callout-warning small">{error}</div>}
    </Modal>
  );
}
