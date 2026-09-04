/**
 * SLATE — the rooms of a production, on screen.
 *
 * The script as a document, casting as rooms, the shoot as call sheets and
 * hours, and post as sessions, bids, cues and stages. Each of these reads the
 * live universe and runs the commands behind it; none of them decides
 * anything the engine does not.
 */

import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Meter, Modal, MoneyText } from '@/ui/components/primitives';
import { titleCaseLabel } from '@/engine/core/text';
import { formatMoney, formatMoneyCompact } from '@/engine/core/money';
import { formatDate, formatTime } from '@/engine/core/time';
import { CRAFT_DIMENSIONS, CRAFT_LABEL, craftWeights } from '@/engine/content/genres';
import { SCENE_KIND_LABEL, SCENE_NEED_LABEL, archetypeLabel, breakdownSummary } from '@/engine/content/screenplay';
import { CITIES, cityTimeZone } from '@/engine/content/geography';
import { HOUSE_RATE_CALIBRATION, POST_HOUSE_BY_ID, RIGHTS_HOLDERS, STAGE_DAY_CALIBRATION, STUDIO_LOTS, housesFor, lotsIn, type PostService } from '@/engine/content/post-houses';
import { auditionsFor, decisionScore } from '@/engine/systems/casting';
import { freeStages, scoreMinutes } from '@/engine/systems/post';
import { costOfLiving } from '@/engine/content/tax';
import type { Id, MusicCue, PostTask, PostTaskKind, Project, Role, SceneNeed, ScriptDraft, ShootDay } from '@/engine/domain/model';

// ---------------------------------------------------------------------------
// The script
// ---------------------------------------------------------------------------

export function ScriptDocument({ project, draft }: { project: Project; draft: ScriptDraft }) {
  const { run } = useGame();
  const [showScenes, setShowScenes] = useState(false);
  const weights = craftWeights(project.genres);
  const top = [...CRAFT_DIMENSIONS].sort((a, b) => weights[b] - weights[a]).slice(0, 7);
  const summary = draft.scenes.length > 0 ? breakdownSummary(draft.scenes) : undefined;
  const roles = useWorld((s) => Object.values(s.universe.roles).filter((r) => r.projectId === project.id));

  return (
    <div className="col gap-3" style={{ marginTop: 'var(--s3)' }}>
      <div>
        <div className="eyebrow">Craft, Weighted The Way {project.genres.map(titleCaseLabel).join(' And ')} Asks</div>
        <div className="grid grid-3" style={{ marginTop: 'var(--s2)' }}>
          {top.map((d) => (
            <Meter key={d} label={`${CRAFT_LABEL[d]} · ${Math.round(weights[d] * 100)}%`} value={draft.craft?.[d] ?? 0} />
          ))}
        </div>
      </div>

      {summary ? (
        <div>
          <div className="row-between">
            <div className="eyebrow">Breakdown</div>
            <button className="btn btn-sm" onClick={() => setShowScenes(!showScenes)}>{showScenes ? 'Hide Scenes' : `Show ${draft.scenes.length} Scenes`}</button>
          </div>
          <div className="grid grid-4" style={{ marginTop: 'var(--s2)' }}>
            <Stat label="Scenes" value={draft.scenes.length} note={`${draft.pages} pages`} />
            <Stat label="Interiors" value={summary.interiors} note={`${summary.exteriors} exteriors`} />
            <Stat label="Nights" value={summary.nights} note="scenes after dark" />
            <Stat label="Set Pieces" value={summary.setPieces} note={`${Object.keys(summary.needs).length} department needs`} />
          </div>
          {Object.keys(summary.needs).length > 0 && (
            <div className="row wrap gap-1" style={{ marginTop: 'var(--s2)' }}>
              {(Object.entries(summary.needs) as [SceneNeed, number][]).map(([n, count]) => <span key={n} className="chip">{SCENE_NEED_LABEL[n]} · {count}</span>)}
            </div>
          )}
          {showScenes && (
            <div className="table-scroll" style={{ marginTop: 'var(--s2)', maxHeight: 360, overflowY: 'auto' }}>
              <table>
                <thead><tr><th>No.</th><th>Slug</th><th className="num">Pages</th><th>Kind</th><th>Who</th><th>Needs</th></tr></thead>
                <tbody>
                  {draft.scenes.map((scene) => (
                    <tr key={scene.number}>
                      <td className="mono xs">{scene.number}</td>
                      <td className="xs">{scene.interior ? 'INT.' : 'EXT.'} {scene.setting} — {titleCaseLabel(scene.timeOfDay)}</td>
                      <td className="num xs mono">{scene.pages.toFixed(1)}</td>
                      <td className="xs">{SCENE_KIND_LABEL[scene.kind]}</td>
                      <td className="xs">{scene.characters.join(', ')}</td>
                      <td className="xs dim">{scene.needs.map((n) => SCENE_NEED_LABEL[n]).join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <p className="xs dim">This draft has no breakdown. It was written before scenes were counted; a rewrite breaks it down.</p>
      )}

      {draft.scriptCharacters.length > 0 && (
        <div>
          <div className="row-between">
            <div className="eyebrow">Characters</div>
            {project.greenlitAt && roles.length === 0 && (
              <button className="btn btn-sm btn-primary" onClick={() => run('cast.break_down_script', { projectId: project.id })}>
                Break Down The Parts
              </button>
            )}
          </div>
          <div className="list" style={{ marginTop: 'var(--s2)' }}>
            {draft.scriptCharacters.map((c) => (
              <div key={c.name} className="list-item list-static">
                <div className="grow">
                  <div className="small strong">{c.name} <span className="chip">{archetypeLabel(c.archetype)}</span></div>
                  <div className="xs dim">{c.description} · ages {c.ageRange[0]}–{c.ageRange[1]} · {c.sceneCount} scenes · {Math.round(c.lineShare * 100)}% of the lines</div>
                </div>
                {roles.some((r) => r.characterName === c.name) && <span className="chip chip-positive">A Part</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Casting rooms
// ---------------------------------------------------------------------------

export function CastingRooms({ project, role }: { project: Project; role: Role }) {
  const { sim, run } = useGame();
  const auditions = useWorld((s) => auditionsFor(s, s.universe.roles[role.id] ?? role));
  const [open, setOpen] = useState(false);
  if (role.status !== 'casting' && role.status !== 'offer_out') return null;
  const live = auditions.filter((a) => a.stage !== 'passed');
  if (live.length === 0) return null;
  const ranked = [...live].sort((a, b) => decisionScore(b) - decisionScore(a));
  const partners = project.castIds;

  return (
    <div style={{ marginTop: 'var(--s2)' }}>
      <button className="btn btn-sm" onClick={() => setOpen(!open)}>{open ? 'Close The Room' : `The Room · ${live.length} In It`}</button>
      {open && (
        <div className="list" style={{ marginTop: 'var(--s2)' }}>
          {ranked.map((audition, i) => {
            const person = sim.universe.people[audition.personId];
            const rounds = audition.rounds ?? [];
            const calledBack = rounds.some((r) => r.stage === 'callback') || audition.stage === 'callback';
            const tested = rounds.some((r) => r.stage === 'screen_test');
            return (
              <div key={audition.id} className="list-item list-static" style={{ display: 'block' }}>
                <div className="row-between">
                  <div className="grow">
                    <div className="small strong">{i + 1}. {person?.stageName ?? person?.displayName ?? 'Somebody'}{audition.isPlayer ? ' (you)' : ''}</div>
                    <div className="xs dim">
                      {rounds.length > 0 ? rounds.map((r) => `${titleCaseLabel(r.stage.replace(/_/g, ' '))} ${Math.round(r.score)}`).join(' · ') : `First read ${Math.round(audition.totalScore ?? 0)}`}
                      {' · '}decision score {Math.round(decisionScore(audition))}
                    </div>
                    {rounds.length > 0 && <div className="xs muted" style={{ marginTop: 2 }}>{rounds[rounds.length - 1]!.note}</div>}
                  </div>
                  {role.status === 'casting' && (
                    <div className="row gap-1 wrap">
                      {!calledBack && <button className="btn btn-sm" onClick={() => run('cast.callback', { roleId: role.id, personIds: [audition.personId] })}>Call Back</button>}
                      {calledBack && partners.length > 0 && !rounds.some((r) => r.stage === 'chemistry_read') && (
                        <button className="btn btn-sm" onClick={() => run('cast.chemistry_read', { roleId: role.id, personId: audition.personId, withPersonId: partners[0] })}>
                          Read With {sim.universe.people[partners[0]!]?.displayName?.split(' ')[0] ?? 'The Lead'}
                        </button>
                      )}
                      {calledBack && !tested && <button className="btn btn-sm" onClick={() => run('cast.screen_test', { roleId: role.id, personIds: [audition.personId] })}>Screen Test</button>}
                      <button className="btn btn-sm btn-primary" onClick={() => run('cast.choose', { roleId: role.id, personId: audition.personId })}>Choose</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {role.status === 'casting' && ranked.length > 1 && (
            <div className="list-item list-static">
              <div className="grow xs dim">Screen tests cost real money: a stage, a crew, a day. Chemistry reads need somebody already cast to read against.</div>
              <button className="btn btn-sm" onClick={() => run('cast.callback', { roleId: role.id, personIds: ranked.slice(0, 4).map((a) => a.personId) })}>Call Back The Top Four</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The shoot
// ---------------------------------------------------------------------------

export function ShootDayRow({ day, project }: { day: ShootDay; project: Project }) {
  const { sim } = useGame();
  const [open, setOpen] = useState(false);
  const [directing, setDirecting] = useState(false);
  const zone = CITIES.get(day.locationId) ? cityTimeZone(day.locationId) : sim.homeZone;
  const sheet = day.callSheet;
  const canDirect = day.status === 'scheduled' && sheet && (project.directorId === sim.player.id || project.createdById === sim.player.id || Boolean(project.ownerCompanyId));
  return (
    <>
      <tr onClick={() => setOpen(!open)} style={{ cursor: sheet ? 'pointer' : undefined }}>
        <td className="mono xs">{day.dayNumber}</td>
        <td className="xs">{formatDate(day.date, sim.homeZone)}{sheet ? ` · call ${formatTime(sheet.crewCall, zone)}` : ''}</td>
        <td className="xs">{day.locationName}</td>
        <td className="num xs mono">{day.completedPages.toFixed(1)} / {day.plannedPages.toFixed(1)}</td>
        <td className="num xs mono">{formatMoneyCompact(day.actualCost)}</td>
        <td className="xs">
          <span className={`chip ${day.status === 'complete' ? 'chip-positive' : day.status === 'incomplete' ? 'chip-warning' : ''}`}>
            {titleCaseLabel(day.status)}
          </span>
          {day.incidents.length > 0 && <span className="xs dim" title={day.incidents.map((i) => i.description).join(' ')}> ⚠</span>}
          {day.plan && <span className="xs dim"> · {titleCaseLabel(day.plan.coverage)}{day.plan.pushPastTwelve ? ', to fourteen' : ''}</span>}
        </td>
      </tr>
      {open && sheet && (
        <tr>
          <td colSpan={6} style={{ background: 'var(--surface-2, transparent)' }}>
            <div className="col gap-2" style={{ padding: 'var(--s2) 0' }}>
              <div className="row wrap gap-3 xs">
                <span><strong>Crew Call</strong> {formatTime(sheet.crewCall, zone)}</span>
                <span><strong>First Shot</strong> {formatTime(sheet.firstShot, zone)}</span>
                <span><strong>Lunch</strong> {formatTime(sheet.lunch, zone)}</span>
                <span><strong>Wrap Target</strong> {formatTime(sheet.wrapTarget, zone)}</span>
                {sheet.sunrise !== undefined && <span><strong>Sunrise</strong> {formatTime(sheet.sunrise, zone)}</span>}
                {sheet.sunset !== undefined && <span><strong>Sunset</strong> {formatTime(sheet.sunset, zone)}</span>}
                <span><strong>Daylight</strong> {Math.floor(sheet.daylightMinutes / 60)}h {sheet.daylightMinutes % 60}m</span>
              </div>
              <div className="xs dim">{sheet.forecast}</div>
              <div className="xs">
                <strong>Scenes</strong>{' '}
                {day.scenes.map((s) => `${s.sceneNumber} (${s.pages.toFixed(1)}p${s.setups ? `, ${s.setupsDone ?? 0}/${s.setups} setups` : ''}${s.quality !== undefined ? `, ${s.quality}` : ''})`).join(' · ')}
              </div>
              {sheet.castCalls.length > 0 && (
                <div className="xs"><strong>Cast</strong> {sheet.castCalls.map((c) => `${sim.universe.people[c.personId]?.displayName ?? 'Cast'} ${formatTime(c.at, zone)}`).join(' · ')}</div>
              )}
              {sheet.notes.length > 0 && <div className="xs dim">{sheet.notes.join(' ')}</div>}
              {day.hours && day.hours.length > 0 && (
                <div className="table-scroll">
                  <table>
                    <thead><tr><th>Time</th><th>What</th><th className="num">Setups</th><th className="num">Takes</th><th>Note</th></tr></thead>
                    <tbody>
                      {day.hours.map((h, i) => (
                        <tr key={i}>
                          <td className="mono xs">{formatTime(h.at, zone)}</td>
                          <td className="xs">{titleCaseLabel(h.kind.replace(/_/g, ' '))}</td>
                          <td className="num xs mono">{h.setups || ''}</td>
                          <td className="num xs mono">{h.takes || ''}</td>
                          <td className="xs dim">{h.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {day.incidents.length > 0 && (
                <div className="xs">{day.incidents.map((i, n) => <div key={n} className="warning">{i.description}{i.costDelta ? ` (${formatMoneyCompact(i.costDelta)})` : ''}</div>)}</div>
              )}
              {canDirect && (
                <div><button className="btn btn-sm btn-primary" onClick={(e) => { e.stopPropagation(); setDirecting(true); }}>Direct The Day</button></div>
              )}
            </div>
          </td>
        </tr>
      )}
      {directing && <DirectDayDialog day={day} onClose={() => setDirecting(false)} />}
    </>
  );
}

function DirectDayDialog({ day, onClose }: { day: ShootDay; onClose: () => void }) {
  const { run } = useGame();
  const [coverage, setCoverage] = useState<'lean' | 'standard' | 'thorough'>(day.plan?.coverage ?? day.callSheet?.coverage ?? 'standard');
  const [push, setPush] = useState(day.plan?.pushPastTwelve ?? false);
  const [drop, setDrop] = useState<string[]>(day.plan?.dropScenes ?? []);
  const submit = () => {
    const result = run('prod.direct_day', { shootDayId: day.id, coverage, pushPastTwelve: push, dropSceneNumbers: drop });
    if (result.ok) onClose();
  };
  return (
    <Modal
      title={`Day ${day.dayNumber}: How You Want It Run`}
      onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Leave It To The First AD</button><button className="btn btn-primary" onClick={submit}>Set The Plan</button></>}
    >
      <p className="muted small">Coverage buys the edit angles and costs hours. Pushing past twelve is overtime at penalty rate. Anything you drop rolls to a later day.</p>
      <div className="field">
        <label>Coverage</label>
        <div className="row gap-1">
          {(['lean', 'standard', 'thorough'] as const).map((c) => (
            <button key={c} className={`btn btn-sm ${coverage === c ? 'btn-primary' : ''}`} onClick={() => setCoverage(c)}>{titleCaseLabel(c)}</button>
          ))}
        </div>
      </div>
      <div className="field">
        <label className="row gap-2" style={{ alignItems: 'center' }}>
          <input type="checkbox" checked={push} onChange={(e) => setPush(e.target.checked)} /> Push Past Twelve Hours If It Runs Long
        </label>
      </div>
      <div className="field">
        <label>Drop If You Must</label>
        <div className="row wrap gap-1">
          {day.scenes.map((s) => (
            <button
              key={s.sceneNumber}
              className={`btn btn-sm ${drop.includes(s.sceneNumber) ? 'btn-primary' : ''}`}
              onClick={() => setDrop(drop.includes(s.sceneNumber) ? drop.filter((n) => n !== s.sceneNumber) : [...drop, s.sceneNumber])}
            >
              {s.sceneNumber} · {s.pages.toFixed(1)}p
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}

export function StageBookingPanel({ project }: { project: Project }) {
  const { sim, run } = useGame();
  const [lotId, setLotId] = useState<string>('');
  const [days, setDays] = useState(10);
  const [stages, setStages] = useState(1);
  const city = project.productionLocationIds[0] ?? sim.player.currentLocationId;
  const lots = lotsIn(city);
  const owned = useWorld((s) => Object.values(s.universe.properties).filter((p) => p.lot && p.ownerId && (p.ownerId === s.player.id || Object.values(s.universe.companies).some((c) => c.id === p.ownerId && c.ownerships.some((o) => o.holderId === s.player.id))) && p.locationId === city));
  const firstStageDay = project.shootDayIds.map((id) => sim.universe.shootDays[id]).find((d) => d && d.isStage && d.status === 'scheduled');
  const from = firstStageDay?.callTime ?? sim.now + 7 * 86_400_000;
  const chosen = lots.find((l) => l.id === lotId);
  const free = chosen ? freeStages(sim, chosen, from) : 0;
  const rate = chosen ? Math.round(STAGE_DAY_CALIBRATION[chosen.tier] * costOfLiving(chosen.cityId)) : 0;
  const bookings = project.stageBookings ?? [];

  return (
    <Panel title="Stages" subtitle={`Real lots in ${CITIES.get(city)?.name ?? city}. Rates are SLATE’s calibration by tier, not a rate card.`}>
      {bookings.length > 0 && (
        <div className="list" style={{ marginBottom: 'var(--s3)' }}>
          {bookings.map((b) => (
            <div key={b.id} className="list-item list-static">
              <div className="grow">
                <div className="small strong">{b.lotName}</div>
                <div className="xs dim">{b.stages} stage{b.stages === 1 ? '' : 's'} · {formatDate(b.from, sim.homeZone)} for {b.days} days · {b.cost === 0 ? 'your own lot' : formatMoneyCompact(b.cost)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {lots.length === 0 && owned.length === 0 ? (
        <p className="xs dim">No lot on SLATE’s record in this city. The interiors go up on a rented warehouse stage.</p>
      ) : (
        <div className="col gap-2">
          <div className="row wrap gap-1">
            {owned.map((p) => (
              <button key={p.id} className={`btn btn-sm ${lotId === p.id ? 'btn-primary' : ''}`} onClick={() => setLotId(p.id)}>{p.name} (yours)</button>
            ))}
            {lots.map((l) => (
              <button key={l.id} className={`btn btn-sm ${lotId === l.id ? 'btn-primary' : ''}`} onClick={() => setLotId(l.id)} title={l.knownFor}>{l.name}</button>
            ))}
          </div>
          {chosen && (
            <div className="xs dim">{chosen.where}{chosen.founded ? `, since ${chosen.founded}` : ''}. {chosen.knownFor} About {chosen.stagesApprox} stages; {free} free around {formatDate(from, sim.homeZone)}. {formatMoney(rate, { cents: false })} a stage day.</div>
          )}
          <div className="row gap-2 wrap" style={{ alignItems: 'flex-end' }}>
            <div className="field" style={{ minWidth: 120 }}>
              <label>Stages</label>
              <input type="number" min={1} max={12} value={stages} onChange={(e) => setStages(Number(e.target.value))} />
            </div>
            <div className="field" style={{ minWidth: 120 }}>
              <label>Days</label>
              <input type="number" min={1} max={200} value={days} onChange={(e) => setDays(Number(e.target.value))} />
            </div>
            <button className="btn btn-sm btn-primary" disabled={!lotId} onClick={() => run('prod.book_stage', { projectId: project.id, lotId, from, days, stages })}>
              Book{chosen && rate > 0 ? ` For ${formatMoneyCompact(rate * stages * days)}` : ''}
            </button>
          </div>
        </div>
      )}
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Post
// ---------------------------------------------------------------------------

const SERVICE_OF: Partial<Record<PostTaskKind, PostService>> = {
  assembly: 'editorial', editors_cut: 'editorial', directors_cut: 'editorial', studio_notes: 'editorial', picture_lock: 'editorial',
  vfx: 'vfx', adr: 'adr', foley: 'foley', sound_design: 'sound_design', score: 'scoring',
  mix: 'mix', color: 'color', titles: 'titles', subtitles: 'mastering', localization: 'mastering', qc: 'qc', mastering: 'mastering', delivery: 'mastering',
};

export function HousePicker({ project, task }: { project: Project; task: PostTask }) {
  const { run } = useGame();
  const service = SERVICE_OF[task.kind];
  if (!service || task.status === 'complete') return null;
  if (task.kind === 'vfx' && project.vfx?.awardedHouseId) return null;
  const houses = housesFor(service);
  return (
    <select
      className="xs"
      value={task.houseId ?? ''}
      onChange={(e) => { if (e.target.value) run('prod.choose_house', { projectId: project.id, taskKind: task.kind, houseId: e.target.value }); }}
      title="A real house, priced by its tier on SLATE’s calibration."
    >
      <option value="">Pick A House</option>
      {houses.map((h) => <option key={h.id} value={h.id}>{h.name} — {h.where} ({titleCaseLabel(h.tier)})</option>)}
    </select>
  );
}

export function CutRoom({ project }: { project: Project }) {
  const { sim, run } = useGame();
  const [hours, setHours] = useState(6);
  const [focus, setFocus] = useState<'structure' | 'performance' | 'pace' | 'ending'>('structure');
  const tasks = project.postTaskIds.map((id) => sim.universe.postTasks[id]).filter((t): t is PostTask => Boolean(t));
  const cutting = (['assembly', 'editors_cut', 'directors_cut', 'studio_notes', 'picture_lock'] as const).map((k) => tasks.find((t) => t.kind === k)).filter((t): t is PostTask => Boolean(t));
  const current = cutting.find((t) => t.status === 'in_progress' || t.status === 'ready');
  const sessions = cutting.flatMap((t) => (t.sessions ?? []).map((s) => ({ ...s, task: t.name })));
  const inCity = project.productionLocationIds.includes(sim.player.currentLocationId);
  return (
    <Panel title="The Cutting Room" subtitle={current ? `On the ${current.name.toLowerCase()}.` : 'Nothing to cut right now.'}>
      {current ? (
        <div className="col gap-2">
          <div className="row gap-2 wrap" style={{ alignItems: 'flex-end' }}>
            <div className="field" style={{ minWidth: 140 }}>
              <div className="row-between"><label htmlFor="cut-hours" style={{ marginBottom: 0 }}>Hours</label><span className="mono">{hours}</span></div>
              <input id="cut-hours" type="range" min={1} max={12} value={hours} onChange={(e) => setHours(Number(e.target.value))} />
            </div>
            <div className="row gap-1">
              {(['structure', 'performance', 'pace', 'ending'] as const).map((f) => (
                <button key={f} className={`btn btn-sm ${focus === f ? 'btn-primary' : ''}`} onClick={() => setFocus(f)}>{titleCaseLabel(f)}</button>
              ))}
            </div>
            <button className="btn btn-sm btn-primary" onClick={() => run('prod.cut_session', { projectId: project.id, hours, focus })}>Sit In</button>
          </div>
          <div className="xs dim">{inCity ? 'You are in the city; you will be in the room.' : 'You are not where the picture is cutting. A remote link works, at about half the value.'} Every hour costs energy and teaches you something.</div>
        </div>
      ) : (
        <p className="xs dim">{tasks.some((t) => t.kind === 'picture_lock' && t.status === 'complete') ? 'The picture is locked.' : 'Post has not opened, or the next stage is waiting on the one before it.'}</p>
      )}
      {sessions.length > 0 && (
        <div className="list" style={{ marginTop: 'var(--s3)' }}>
          {sessions.slice(-6).reverse().map((s, i) => (
            <div key={i} className="list-item list-static">
              <div className="grow">
                <div className="xs strong">{s.task} · {formatDate(s.at, sim.homeZone)} · {s.hours}h</div>
                <div className="xs dim">{s.note}</div>
              </div>
              <span className="chip">+{s.gain.toFixed(1)}</span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

export function EffectsRoom({ project }: { project: Project }) {
  const { sim, run } = useGame();
  const [asking, setAsking] = useState<string[]>([]);
  const plan = project.vfx;
  const houses = housesFor('vfx');
  const pending = sim.timeline.pending().filter((i) => i.kind === 'post.vfx_bids_in' && i.refId === project.id).flatMap((i) => i.payload.houseIds as string[]);
  return (
    <Panel title="Visual Effects" subtitle={plan ? `${plan.shots} shots: ${plan.mix.simple} simple, ${plan.mix.medium} medium, ${plan.mix.hero} hero.` : 'Count the shots from the script before anyone can bid.'}>
      {!plan ? (
        <button className="btn btn-sm btn-primary" onClick={() => run('prod.vfx_breakdown', { projectId: project.id })}>Count The Shots</button>
      ) : plan.awardedHouseId ? (
        <div className="callout callout-accent">
          <strong className="small">Awarded to {POST_HOUSE_BY_ID[plan.awardedHouseId]?.name}</strong>
          <p className="xs" style={{ margin: '4px 0 0' }}>{plan.bids.find((b) => b.houseId === plan.awardedHouseId)?.note} {formatMoneyCompact(plan.bids.find((b) => b.houseId === plan.awardedHouseId)?.amount ?? 0)} over {plan.bids.find((b) => b.houseId === plan.awardedHouseId)?.weeks} weeks, on a contract.</p>
        </div>
      ) : (
        <div className="col gap-3">
          {plan.bids.length > 0 && (
            <div className="list">
              {plan.bids.map((bid) => {
                const house = POST_HOUSE_BY_ID[bid.houseId];
                return (
                  <div key={bid.houseId} className="list-item list-static">
                    <div className="grow">
                      <div className="small strong">{house?.name} <span className="chip">{titleCaseLabel(house?.tier ?? '')}</span></div>
                      <div className="xs dim">{formatMoneyCompact(bid.amount)} · {bid.weeks} weeks · expected to read about {bid.expectedQuality}</div>
                      <div className="xs muted" style={{ marginTop: 2 }}>{bid.note}</div>
                    </div>
                    <button className="btn btn-sm btn-primary" onClick={() => run('prod.award_vfx', { projectId: project.id, houseId: bid.houseId })}>Award</button>
                  </div>
                );
              })}
            </div>
          )}
          {pending.length > 0 && <div className="xs dim">Waiting on {pending.map((id) => POST_HOUSE_BY_ID[id]?.name).join(', ')}. Bids take a week or two.</div>}
          <div>
            <div className="eyebrow">Ask For Bids</div>
            <div className="row wrap gap-1" style={{ marginTop: 'var(--s2)' }}>
              {houses.filter((h) => !plan.bids.some((b) => b.houseId === h.id) && !pending.includes(h.id)).map((h) => (
                <button
                  key={h.id}
                  className={`btn btn-sm ${asking.includes(h.id) ? 'btn-primary' : ''}`}
                  title={`${h.where}. ${h.knownFor} About ${formatMoney(HOUSE_RATE_CALIBRATION[h.tier].vfxShot, { cents: false })} a shot on SLATE’s calibration.`}
                  onClick={() => setAsking(asking.includes(h.id) ? asking.filter((id) => id !== h.id) : [...asking, h.id].slice(-5))}
                >
                  {h.name}
                </button>
              ))}
            </div>
            <button className="btn btn-sm" style={{ marginTop: 'var(--s2)' }} disabled={asking.length === 0} onClick={() => { const r = run('prod.request_vfx_bids', { projectId: project.id, houseIds: asking }); if (r.ok) setAsking([]); }}>
              Send The Breakdown To {asking.length || 'The'} House{asking.length === 1 ? '' : 's'}
            </button>
          </div>
        </div>
      )}
    </Panel>
  );
}

export function MusicRoom({ project }: { project: Project }) {
  const { sim, run } = useGame();
  const [licensing, setLicensing] = useState<Id | null>(null);
  const music = project.music;
  const tasks = project.postTaskIds.map((id) => sim.universe.postTasks[id]).filter((t): t is PostTask => Boolean(t));
  const editorsCut = tasks.find((t) => t.kind === 'editors_cut');
  const stages = housesFor('scoring');
  const licensable = music?.cues.filter((c) => c.use !== 'score') ?? [];
  return (
    <Panel title="Music" subtitle={music?.spottedAt ? `${music.cues.length} cues, ${scoreMinutes(music.cues)} minutes of score${music.recordedAt ? `, recorded at ${POST_HOUSE_BY_ID[music.scoringStageId ?? '']?.name}` : ''}.` : 'Spotting happens on a cut.'}>
      {!music?.spottedAt ? (
        <button className="btn btn-sm btn-primary" disabled={editorsCut?.status !== 'complete'} onClick={() => run('prod.spot_score', { projectId: project.id })}>
          Spot The Picture
        </button>
      ) : (
        <div className="col gap-3">
          {licensable.length > 0 && (
            <div className="list">
              {licensable.map((cue) => (
                <div key={cue.id} className="list-item list-static">
                  <div className="grow">
                    <div className="xs strong">Cue {cue.number} · {titleCaseLabel(cue.use.replace(/_/g, ' '))} · {cue.minutes.toFixed(1)} min</div>
                    <div className="xs dim">{cue.description}</div>
                    {cue.licence && <div className="xs positive">Licensed: sync {formatMoneyCompact(cue.licence.syncFee)} to {RIGHTS_HOLDERS.find((r) => r.id === cue.licence!.publisherId)?.name}, master {formatMoneyCompact(cue.licence.masterFee)} to {RIGHTS_HOLDERS.find((r) => r.id === cue.licence!.labelId)?.name}{cue.licence.mfn ? ', MFN' : ''}.</div>}
                  </div>
                  <span className={`chip ${cue.status === 'licensed' ? 'chip-positive' : cue.status === 'dropped' ? 'chip-negative' : ''}`}>{titleCaseLabel(cue.status)}</span>
                  {cue.status === 'spotted' && <button className="btn btn-sm btn-primary" onClick={() => setLicensing(cue.id)}>License</button>}
                  {cue.status === 'spotted' && <button className="btn btn-sm" onClick={() => run('prod.drop_cue', { projectId: project.id, cueId: cue.id })}>Score It Instead</button>}
                  {cue.status === 'dropped' && <button className="btn btn-sm" onClick={() => run('prod.drop_cue', { projectId: project.id, cueId: cue.id, restore: true })}>Bring It Back</button>}
                </div>
              ))}
            </div>
          )}
          {!music.recordedAt && (
            <div>
              <div className="eyebrow">Record The Score</div>
              <div className="row wrap gap-1" style={{ marginTop: 'var(--s2)' }}>
                {stages.map((s) => (
                  <button key={s.id} className="btn btn-sm" title={`${s.where}. ${s.knownFor} About ${formatMoney(HOUSE_RATE_CALIBRATION[s.tier].scoringDay, { cents: false })} a day on SLATE’s calibration.`} onClick={() => run('prod.record_score', { projectId: project.id, stageId: s.id })}>
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {licensing && <LicenceDialog project={project} cue={music!.cues.find((c) => c.id === licensing)!} onClose={() => setLicensing(null)} />}
    </Panel>
  );
}

function LicenceDialog({ project, cue, onClose }: { project: Project; cue: MusicCue; onClose: () => void }) {
  const { run } = useGame();
  const publishers = RIGHTS_HOLDERS.filter((r) => r.side === 'publisher');
  const labels = RIGHTS_HOLDERS.filter((r) => r.side === 'label');
  const [publisherId, setPublisherId] = useState(publishers[0]!.id);
  const [labelId, setLabelId] = useState(labels[0]!.id);
  const [sync, setSync] = useState(30_000);
  const [master, setMaster] = useState(30_000);
  const [mfn, setMfn] = useState(true);
  const [term, setTerm] = useState<'perpetuity' | 'ten_years' | 'festival_only'>('perpetuity');
  const [territory, setTerritory] = useState<'worldwide' | 'domestic'>('worldwide');
  const [answer, setAnswer] = useState<string | null>(null);
  const submit = () => {
    const result = run<{ accepted: boolean; reason: string; wantedSync: number; wantedMaster: number }>('prod.license_music', {
      projectId: project.id, cueId: cue.id, publisherId, labelId, syncFee: sync * 100, masterFee: (mfn ? sync : master) * 100, mfn, term, territory,
    });
    if (result.ok && result.value?.accepted) onClose();
    else if (result.ok) setAnswer(result.value?.reason ?? 'They passed.');
  };
  return (
    <Modal
      title={`License Cue ${cue.number}`}
      onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Not Now</button><button className="btn btn-primary" onClick={submit}>Make The Offer</button></>}
    >
      <p className="muted small">Two licences: the composition from a publisher (sync) and the recording from a label (master). SLATE never names a real song; it names the companies you would be talking to, which are real.</p>
      <div className="grid grid-2">
        <div className="field"><label>Publisher (Sync)</label><select value={publisherId} onChange={(e) => setPublisherId(e.target.value)}>{publishers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
        <div className="field"><label>Label (Master)</label><select value={labelId} onChange={(e) => setLabelId(e.target.value)}>{labels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
        <div className="field"><label>Sync Fee ($)</label><input type="number" min={100} step={1000} value={sync} onChange={(e) => setSync(Number(e.target.value))} /></div>
        <div className="field"><label>Master Fee ($)</label><input type="number" min={100} step={1000} value={mfn ? sync : master} disabled={mfn} onChange={(e) => setMaster(Number(e.target.value))} /></div>
        <div className="field"><label>Term</label><select value={term} onChange={(e) => setTerm(e.target.value as typeof term)}><option value="perpetuity">In Perpetuity</option><option value="ten_years">Ten Years</option><option value="festival_only">Festival Only</option></select></div>
        <div className="field"><label>Territory</label><select value={territory} onChange={(e) => setTerritory(e.target.value as typeof territory)}><option value="worldwide">Worldwide</option><option value="domestic">Domestic</option></select></div>
      </div>
      <label className="row gap-2 xs" style={{ alignItems: 'center' }}><input type="checkbox" checked={mfn} onChange={(e) => setMfn(e.target.checked)} /> Most Favoured Nations: both sides get the same number</label>
      {answer && <div className="callout callout-negative" style={{ marginTop: 'var(--s2)' }}><p className="xs" style={{ margin: 0 }}>{answer}</p></div>}
    </Modal>
  );
}

export function PostHouseLine({ task }: { task: PostTask }) {
  const house = task.houseId ? POST_HOUSE_BY_ID[task.houseId] : undefined;
  if (!house) return null;
  return <span className="xs dim"> · {house.where}</span>;
}

export const LOTS_ON_RECORD = STUDIO_LOTS.length;
export const PRICE_NOTE = 'Every price here is SLATE’s calibration, labelled as such. Nobody real is quoted.';
export { MoneyText };
