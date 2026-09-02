import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Empty, Tabs, Modal } from '@/ui/components/primitives';
import { awardsCalendar, awardHistory, festivalCalendar, ordinal, isEligible } from '@/engine/systems/awards';
import { AWARD_BODIES, AWARD_BODY_BY_ID } from '@/engine/content/industry';
import { activeProjects } from '@/engine/systems/film';
import { formatMoney, formatMoneyCompact } from '@/engine/core/money';
import { formatDate } from '@/engine/core/time';

export function AwardsWorkspace() {
  const { sim, run } = useGame();
  const [tab, setTab] = useState<'season' | 'festivals' | 'history'>('season');
  const [campaigning, setCampaigning] = useState<string | null>(null);

  const calendar = useWorld(awardsCalendar);
  const festivals = useWorld(festivalCalendar);
  const history = useWorld((s) => awardHistory(s, s.player.id));
  const projects = useWorld((s) => activeProjects(s, s.player.id).filter((p) => p.finalQuality));

  const wins = history.filter((h) => h.nomination.won).length;

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Awards</div>
        <h1>{history.length} nomination{history.length === 1 ? '' : 's'}{wins > 0 && `, ${wins} win${wins === 1 ? '' : 's'}`}</h1>
        <p className="muted">
          Edition-specific and eligibility-gated. Once an edition is decided it never changes, and
          campaign spend helps at the margin without replacing the work.
        </p>
      </div>

      <Tabs active={tab} onChange={setTab} tabs={[
        { id: 'season', label: 'This season' },
        { id: 'festivals', label: 'Festivals' },
        { id: 'history', label: 'Your record', badge: history.length },
      ]} />

      {tab === 'season' && (
        <>
          <Panel title="Ceremonies" flush>
            <div className="list">
              {calendar.slice(0, 12).map(({ edition, body, nominations, daysAway }) => (
                <div key={edition.id} className="list-item list-static">
                  <div className="grow">
                    <div className="small strong">{ordinal(edition.editionNumber)} {body?.name}</div>
                    <div className="xs dim">
                      {formatDate(edition.ceremonyAt, sim.homeZone)}
                      {daysAway > 0 ? ` · in ${daysAway} days` : ' · past'} ·
                      {' '}eligibility {formatDate(edition.eligibilityStart, sim.homeZone)} to {formatDate(edition.eligibilityEnd, sim.homeZone)}
                    </div>
                  </div>
                  {nominations.length > 0 && <span className="chip">{nominations.length} nominees</span>}
                  <span className={`chip ${edition.finalised ? 'chip-positive' : ''}`}>{edition.status.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Campaign" subtitle="Only films that are actually eligible can be entered." flush>
            {projects.length === 0 ? (
              <Empty title="Nothing eligible" body="A film has to be finished and released before it can be campaigned." />
            ) : (
              <div className="list">
                {projects.map((project) => (
                  <div key={project.id} className="list-item list-static">
                    <div className="grow">
                      <div className="small strong">{project.title}</div>
                      <div className="xs dim">
                        Quality {project.finalQuality} · critics {project.criticScore ?? '—'} ·
                        {project.releaseDate ? ` released ${formatDate(project.releaseDate, sim.homeZone)}` : ' unreleased'}
                      </div>
                      <div className="xs" style={{ marginTop: 4 }}>
                        {AWARD_BODIES.map((body) => {
                          const edition = calendar.find((c) => c.edition.bodyId === body.id && !c.edition.finalised);
                          if (!edition) return null;
                          const eligible = isEligible(sim, project, edition.edition);
                          return (
                            <span key={body.id} className={`chip ${eligible.ok ? 'chip-positive' : ''}`} style={{ marginRight: 4 }}
                              title={eligible.ok ? 'Eligible' : eligible.reason}>
                              {body.shortName}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <button className="btn btn-sm" onClick={() => setCampaigning(project.id)}>Campaign</button>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </>
      )}

      {tab === 'festivals' && (
        <Panel title="Festival calendar" flush>
          <div className="list">
            {festivals.map(({ festival, year, at, city, submissions }) => (
              <div key={festival.id} className="list-item list-static">
                <div className="grow">
                  <div className="small strong">{festival.name} {year}</div>
                  <div className="xs dim">
                    {city?.name} · {formatDate(at, sim.homeZone)} · prestige {festival.prestige} ·
                    {' '}{festival.premiereRequirement === 'none' ? 'no premiere requirement' : `${festival.premiereRequirement} premiere required`}
                    {festival.marketAttached && ' · market attached'}
                  </div>
                  {submissions.length > 0 && (
                    <div className="xs positive">
                      {submissions.map((s) => `${sim.universe.projects[s.projectId]?.title}: ${s.status}`).join(', ')}
                    </div>
                  )}
                </div>
                <span className="mono small">${festival.submissionFee}</span>
                <select
                  style={{ width: 170 }} defaultValue=""
                  aria-label={`Submit to ${festival.name}`}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    run('fest.submit', { projectId: e.target.value, festivalId: festival.id, year });
                    e.target.value = '';
                  }}
                >
                  <option value="">Submit a film…</option>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
                </select>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === 'history' && (
        <Panel title="Your record" flush>
          {history.length === 0 ? (
            <Empty title="No nominations" body="Awards follow work. Make something worth voting for." />
          ) : (
            <div className="list">
              {history.map(({ nomination, edition, body, project }) => (
                <div key={nomination.id} className="list-item list-static">
                  <span className="xs dim nowrap" style={{ minWidth: 60 }}>{edition?.year}</span>
                  <div className="grow">
                    <div className="small strong">{nomination.category}</div>
                    <div className="xs dim">
                      {ordinal(edition?.editionNumber ?? 0)} {body?.name}
                      {project && ` · ${project.title}`}
                      {nomination.campaignSpend > 0 && ` · ${formatMoneyCompact(nomination.campaignSpend)} campaign`}
                    </div>
                  </div>
                  <span className={`chip ${nomination.won ? 'chip-accent' : ''}`}>
                    {nomination.won ? 'Won' : nomination.won === false ? 'Nominated' : 'Pending'}
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

function CampaignDialog({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const { sim, run } = useGame();
  const project = sim.universe.projects[projectId];
  const [bodyId, setBodyId] = useState(AWARD_BODIES[0]?.id ?? 'vanguard');
  const [categories, setCategories] = useState<string[]>([]);
  const [spend, setSpend] = useState(250_000);

  const body = AWARD_BODY_BY_ID[bodyId];

  const submit = () => {
    const result = run('award.campaign', { projectId, bodyId, categories, spend: spend * 100 });
    if (result.ok) onClose();
  };

  return (
    <Modal
      title={`Campaign ${project?.title ?? ''}`}
      onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={submit} disabled={categories.length === 0}>Run the campaign</button></>}
    >
      <div className="field">
        <label htmlFor="body">Awards body</label>
        <select id="body" value={bodyId} onChange={(e) => { setBodyId(e.target.value); setCategories([]); }}>
          {AWARD_BODIES.map((entry) => (
            <option key={entry.id} value={entry.id}>{entry.name} — prestige {entry.prestige}</option>
          ))}
        </select>
        {body && <p className="xs dim" style={{ marginTop: 4 }}>{body.eligibilityRule}</p>}
      </div>

      <div className="field">
        <label>Categories</label>
        <div className="row wrap gap-1">
          {body?.categories.map((category) => (
            <button
              key={category} className="chip"
              aria-pressed={categories.includes(category)}
              style={categories.includes(category) ? { background: 'var(--accent-dim)', color: 'var(--accent-strong)', borderColor: 'var(--accent-line)' } : undefined}
              onClick={() => setCategories((c) => c.includes(category) ? c.filter((x) => x !== category) : [...c, category])}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label htmlFor="spend">Total spend</label>
        <input id="spend" type="number" min={10_000} step={10_000} value={spend} onChange={(e) => setSpend(Number(e.target.value))} />
        {categories.length > 0 && (
          <p className="xs dim" style={{ marginTop: 4 }}>
            {formatMoney(Math.round(spend * 100 / categories.length))} per category.
          </p>
        )}
      </div>

      <div className="callout">
        Spend has real but sharply diminishing influence. The film itself and its critical standing carry
        most of the weight, and precursor wins earlier in the season matter more than money.
      </div>
      <Stat label="Project quality" value={project?.finalQuality ?? '—'} note={`critics ${project?.criticScore ?? '—'}`} />
    </Modal>
  );
}
