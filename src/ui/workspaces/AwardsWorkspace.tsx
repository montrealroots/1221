import { useMemo, useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Empty, Tabs, Modal } from '@/ui/components/primitives';
import {
  AWARD_BODIES, AWARD_BODY_BY_ID, awardsCalendar, awardHistory, categoriesOf, contestsFor, currentEditionFor,
  editionName, eligibleContests, festivalAdmits, festivalCalendar, isEligible, whyNotContested,
} from '@/engine/systems/awards';
import { INDUSTRY_EVENTS } from '@/engine/content/events-data';
import { VOTER_PROFILES } from '@/engine/content/award-rules';
import { activeProjects } from '@/engine/systems/film';
import { formatMoney, formatMoneyCompact } from '@/engine/core/money';
import { formatDate, MS_DAY } from '@/engine/core/time';
import { titleCaseLabel } from '@/engine/core/text';
import type { Project } from '@/engine/domain/model';

export function AwardsWorkspace() {
  const { sim, run } = useGame();
  const [tab, setTab] = useState<'season' | 'festivals' | 'history'>('season');
  const [campaigning, setCampaigning] = useState<string | null>(null);

  const calendar = useWorld(awardsCalendar);
  const festivals = useWorld(festivalCalendar);
  const history = useWorld((s) => awardHistory(s, s.player.id));
  const projects = useWorld((s) => activeProjects(s, s.player.id).filter((p) => p.finalQuality));

  const wins = history.filter((h) => h.nomination.won).length;
  const ahead = calendar.filter((c) => c.edition.ceremonyAt >= sim.now - 30 * MS_DAY).slice(0, 16);
  const notContested = INDUSTRY_EVENTS.filter((e) => e.kind === 'awards' && !AWARD_BODY_BY_ID[e.id]);

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Awards</div>
        <h1>{history.length} Nomination{history.length === 1 ? '' : 's'}{wins > 0 && `, ${wins} Win${wins === 1 ? '' : 's'}`}</h1>
        <p className="muted">
          The real bodies, on their real dates, applying their own rules. Once an edition is decided it never
          changes, and a campaign helps at the margin without replacing the work.
        </p>
      </div>

      <Tabs active={tab} onChange={setTab} tabs={[
        { id: 'season', label: 'This Season' },
        { id: 'festivals', label: 'Festivals' },
        { id: 'history', label: 'Your Record', badge: history.length },
      ]} />

      {tab === 'season' && (
        <>
          <Panel title="Ceremonies" subtitle={`${AWARD_BODIES.length} bodies contested. Each judges its own window with its own voters.`} flush>
            <div className="list">
              {ahead.map(({ edition, body, name, nominations, daysAway }) => (
                <div key={edition.id} className="list-item list-static">
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="small strong truncate">{name}</div>
                    <div className="xs dim truncate">
                      {formatDate(edition.ceremonyAt, body?.spec.zone ?? sim.homeZone)}{body ? ` · ${body.spec.city}` : ''}
                      {daysAway > 0 ? ` · In ${daysAway} Days` : daysAway === 0 ? ' · Today' : ' · Past'}
                      {' · '}Judges {formatDate(edition.eligibilityStart, body?.spec.zone ?? sim.homeZone)} To {formatDate(edition.eligibilityEnd, body?.spec.zone ?? sim.homeZone)}
                    </div>
                    {body && <div className="xs dim truncate">Voted by {VOTER_PROFILES[body.rules.voters].who}.</div>}
                  </div>
                  {nominations.length > 0 && <span className="chip">{nominations.length} Nominees</span>}
                  <span className={`chip ${edition.finalised ? 'chip-positive' : ''}`}>{titleCaseLabel(edition.status.replace(/_/g, ' '))}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Campaign" subtitle="Only work a body would actually look at can be entered, and only for the categories that admit it." flush>
            {projects.length === 0 ? (
              <Empty title="Nothing Eligible" body="A film has to be finished and released, or screened at a festival, before it can be campaigned." />
            ) : (
              <div className="list">
                {projects.map((project) => <ProjectEligibility key={project.id} project={project} onCampaign={() => setCampaigning(project.id)} />)}
              </div>
            )}
          </Panel>

          <Panel title="On The Calendar, Not Contested" subtitle="Bodies SLATE lists but does not simulate, and why." flush>
            <div className="list">
              {notContested.map((e) => (
                <div key={e.id} className="list-item list-static">
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="small strong truncate">{e.name}</div>
                    <div className="xs dim">{whyNotContested(e.id) ?? 'Not simulated.'}</div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </>
      )}

      {tab === 'festivals' && (
        <Panel title="Festival Calendar" subtitle="The real festivals, on their real dates, with their real premiere rules. Fees are SLATE's estimates." flush>
          <div className="list">
            {festivals.map(({ festival, year, occurrence, city, submissions }) => (
              <div key={festival.id} className="list-item list-static">
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="small strong truncate">{festival.name} {year}{occurrence.verified ? '' : ' · Projected Dates'}</div>
                  <div className="xs dim truncate">
                    {city?.name ?? festival.spec.city} · {occurrence.start} To {occurrence.end} · Prestige {festival.rules.prestige}
                    {' · '}{festival.rules.premiere === 'none' ? 'No Premiere Rule' : `${titleCaseLabel(festival.rules.premiere.replace('_', ' '))} Premiere Required`}
                    {festival.rules.market && ' · Buyers Attend'}
                  </div>
                  <div className="xs dim">{festival.rules.eligibility}</div>
                  {submissions.length > 0 && (
                    <div className="xs positive">
                      {submissions.map((s) => `${sim.universe.projects[s.projectId]?.title}: ${titleCaseLabel(s.status.replace(/_/g, ' '))}${s.section ? ` (${s.section})` : ''}${s.awardsWon.length > 0 ? ` · Won ${s.awardsWon.join(', ')}` : ''}`).join(' · ')}
                    </div>
                  )}
                </div>
                <span className="mono small">{festival.rules.feeCents > 0 ? formatMoney(festival.rules.feeCents, { cents: false }) : 'No Fee'}</span>
                <select
                  style={{ width: 170 }} defaultValue=""
                  aria-label={`Submit To ${festival.name}`}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    run('fest.submit', { projectId: e.target.value, festivalId: festival.id, year });
                    e.target.value = '';
                  }}
                >
                  <option value="">Submit A Film…</option>
                  {projects.map((project) => {
                    const fit = festivalAdmits(sim, project, festival);
                    return <option key={project.id} value={project.id} disabled={!fit.ok} title={fit.ok ? '' : fit.reason}>{project.title}{fit.ok ? '' : ' (Not Eligible)'}</option>;
                  })}
                </select>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === 'history' && (
        <Panel title="Your Record" flush>
          {history.length === 0 ? (
            <Empty title="No Nominations" body="Awards follow work. Make something worth voting for." />
          ) : (
            <div className="list">
              {history.map(({ nomination, edition, bodyName, project }) => (
                <div key={nomination.id} className="list-item list-static">
                  <span className="xs dim nowrap" style={{ minWidth: 60 }}>{edition?.year}</span>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="small strong truncate">{titleCaseLabel(nomination.category)}</div>
                    <div className="xs dim truncate">
                      {editionName(edition?.editionNumber ?? 0, bodyName)}
                      {project && ` · ${project.title}`}
                      {nomination.campaignSpend > 0 && ` · ${formatMoneyCompact(nomination.campaignSpend)} Campaign`}
                    </div>
                  </div>
                  <span className={`chip ${nomination.won ? 'chip-accent' : ''}`}>
                    {nomination.won ? (nomination.kind?.startsWith('worst_') ? 'Named' : 'Won') : nomination.won === false ? 'Nominated' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {campaigning && <CampaignDialog projectId={campaigning} onClose={() => setCampaigning(null)} />}
    </>
  );
}

function ProjectEligibility({ project, onCampaign }: { project: Project; onCampaign: () => void }) {
  const { sim } = useGame();
  const verdicts = useMemo(() => AWARD_BODIES.map((body) => {
    const edition = currentEditionFor(sim, body.id);
    if (!edition) return { body, edition: undefined, ok: false, reason: 'No upcoming edition.' };
    const verdict = isEligible(sim, project, edition);
    return { body, edition, ok: verdict.ok, reason: verdict.ok ? '' : verdict.reason };
  }), [sim, project]);
  const eligible = verdicts.filter((v) => v.ok);
  const ineligible = verdicts.filter((v) => !v.ok && v.edition);

  return (
    <div className="list-item list-static">
      <div className="grow" style={{ minWidth: 0 }}>
        <div className="small strong">{project.title}</div>
        <div className="xs dim">
          Quality {project.finalQuality} · Critics {project.criticScore ?? '—'} ·
          {project.releaseDate ? ` Released ${formatDate(project.releaseDate, sim.homeZone)}` : ' Unreleased'}
          {project.releaseStrategy ? ` · ${titleCaseLabel(project.releaseStrategy.replace(/_/g, ' '))}` : ''}
          {project.productionCountryId ? ` · ${project.productionCountryId.toUpperCase()}` : ''}{project.language ? ` · ${project.language.toUpperCase()}` : ''}
        </div>
        <div className="xs" style={{ marginTop: 4 }}>
          {eligible.map(({ body }) => (
            <span key={body.id} className="chip chip-positive" style={{ marginRight: 4, marginBottom: 4 }} title={body.rules.eligibility}>{body.shortName}</span>
          ))}
          {ineligible.length > 0 && (
            <span className="chip" style={{ marginRight: 4 }} title={ineligible.slice(0, 8).map((v) => `${v.body.shortName}: ${v.reason}`).join('\n')}>
              Not Eligible For {ineligible.length}
            </span>
          )}
        </div>
      </div>
      <button className="btn btn-sm" onClick={onCampaign} disabled={eligible.length === 0}>Campaign</button>
    </div>
  );
}

function CampaignDialog({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const { sim, run } = useGame();
  const project = sim.universe.projects[projectId];
  const options = useMemo(() => AWARD_BODIES
    .map((body) => ({ body, edition: currentEditionFor(sim, body.id) }))
    .filter((o): o is { body: (typeof AWARD_BODIES)[number]; edition: NonNullable<typeof o.edition> } => !!o.edition && !!project && o.body.rules.campaignable && isEligible(sim, project, o.edition).ok),
  [sim, project]);
  const [bodyId, setBodyId] = useState(options[0]?.body.id ?? '');
  const [categories, setCategories] = useState<string[]>([]);
  const [spend, setSpend] = useState(250_000);

  const chosen = options.find((o) => o.body.id === bodyId);
  const body = chosen?.body;
  const edition = chosen?.edition;
  const admitted = useMemo(() => (project && edition ? eligibleContests(sim, project, edition).map((c) => c.name) : []), [sim, project, edition]);
  const contested = useMemo(() => new Set(contestsFor(bodyId).map((c) => c.name)), [bodyId]);

  const submit = () => {
    const result = run('award.campaign', { projectId, bodyId, categories, spend: spend * 100 });
    if (result.ok) onClose();
  };

  return (
    <Modal
      title={`Campaign ${project?.title ?? ''}`}
      onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={submit} disabled={categories.length === 0 || !body}>Run The Campaign</button></>}
    >
      {options.length === 0 ? (
        <p className="muted small">No body that takes campaigns has an upcoming edition this film is eligible for.</p>
      ) : (
        <>
          <div className="field">
            <label htmlFor="body">Awards Body</label>
            <select id="body" value={bodyId} onChange={(e) => { setBodyId(e.target.value); setCategories([]); }}>
              {options.map(({ body: entry, edition: ed }) => (
                <option key={entry.id} value={entry.id}>{editionName(ed.editionNumber, entry.name)} — Prestige {entry.rules.prestige}</option>
              ))}
            </select>
            {body && (
              <p className="xs dim" style={{ marginTop: 4 }}>
                {body.rules.eligibility}{body.rules.approximation ? ` ${body.rules.approximation}` : ''}
                {' '}Voted by {VOTER_PROFILES[body.rules.voters].who}. {VOTER_PROFILES[body.rules.voters].responds}
              </p>
            )}
          </div>

          <div className="field">
            <label>Categories</label>
            <div className="row wrap gap-1">
              {categoriesOf(bodyId).map(({ name, contested: isContested }) => {
                const open = admitted.includes(name);
                const why = !isContested ? 'An honour or something SLATE cannot judge; listed, not contested.' : !open ? 'This film does not fit this category.' : '';
                return (
                  <button
                    key={name} className="chip"
                    aria-pressed={categories.includes(name)}
                    disabled={!open}
                    title={why}
                    style={categories.includes(name) ? { background: 'var(--accent-dim)', color: 'var(--accent-strong)', borderColor: 'var(--accent-line)' } : !open ? { opacity: 0.45 } : undefined}
                    onClick={() => setCategories((c) => c.includes(name) ? c.filter((x) => x !== name) : [...c, name])}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
            <p className="xs dim" style={{ marginTop: 4 }}>{admitted.length} of {contested.size} contested categories admit this film.</p>
          </div>

          <div className="field">
            <label htmlFor="spend">Total Spend</label>
            <input id="spend" type="number" min={10_000} step={10_000} value={spend} onChange={(e) => setSpend(Number(e.target.value))} />
            {categories.length > 0 && (
              <p className="xs dim" style={{ marginTop: 4 }}>
                {formatMoney(Math.round(spend * 100 / categories.length))} Per Category.
              </p>
            )}
          </div>

          <div className="callout">
            Spend has real but sharply diminishing influence. The film itself and its critical standing carry
            most of the weight, and wins earlier in the season matter more than money.
          </div>
          <Stat label="Project Quality" value={project?.finalQuality ?? '—'} note={`Critics ${project?.criticScore ?? '—'}`} />
        </>
      )}
    </Modal>
  );
}
