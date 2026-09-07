import { categoryLabel, titleCaseLabel } from '@/engine/core/text';
import { useMemo, useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Meter, Empty, Modal, Stat } from '@/ui/components/primitives';
import { socialCircle } from '@/engine/world/world';
import {
  INTERACTIONS, describeRelationship, relationshipStrength, isRomantic, giftableAssets,
  type InteractionKind,
} from '@/engine/systems/relationships';
import { formatDate, formatRelative, formatTime, ageOn, addDays, zonedParts, instantFromZoned } from '@/engine/core/time';
import { formatMoney } from '@/engine/core/money';
import type { DateStatus } from '@/engine/domain/model';
import { DATE_ACTIVITIES, DATE_ACTIVITY_BY_ID } from '@/engine/content/dates';
import { placesNear } from '@/engine/systems/places';
import { activityOf, dateAttendable, pastDates, placeOfDate, upcomingDates } from '@/engine/systems/dating';
import { activeScene } from '@/engine/systems/scenes';

export function RelationshipsWorkspace() {
  const { sim, run } = useGame();
  const circle = useWorld(socialCircle);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [giftOpen, setGiftOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  const selected = circle.find((entry) => entry.rel.id === selectedId) ?? circle[0];
  const gifts = useWorld((s) => giftableAssets(s, s.player.id));

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Relationships</div>
        <h1>{circle.length} {circle.length === 1 ? 'Person' : 'People'}</h1>
        <p className="muted">
          Seven dimensions, not one bar, and a memory of what actually happened between you.
        </p>
      </div>

      <div className="master-detail">
        <Panel title="Everyone You Know" flush>
          {circle.length === 0 ? (
            <Empty title="Nobody Yet" body="You meet people through work, projects, classes and the places you spend time." />
          ) : (
            <div className="list" style={{ maxHeight: 620, overflowY: 'auto' }}>
              {circle.map(({ rel, person }) => {
                const strength = relationshipStrength(rel, sim.now);
                return (
                  <button
                    key={rel.id}
                    className="list-item"
                    aria-selected={selected?.rel.id === rel.id}
                    onClick={() => setSelectedId(rel.id)}
                  >
                    <div className="grow">
                      <div className="small strong">{person.displayName}</div>
                      <div className="xs dim">
                        {titleCaseLabel(rel.type.replace(/_/g, ' '))} · {describeRelationship(rel, sim.now)}
                      </div>
                    </div>
                    <span className="mono xs">{Math.round(strength)}</span>
                  </button>
                );
              })}
            </div>
          )}
        </Panel>

        {selected && (
          <div className="col gap-4">
            <Panel
              title={selected.person.displayName}
              subtitle={`${titleCaseLabel(selected.rel.type.replace(/_/g, ' '))} · since ${formatDate(selected.rel.since, sim.homeZone)}${selected.rel.isPublic ? ' · public' : ' · private'}`}
              actions={
                <>
                  {isRomantic(selected.rel.type) && selected.rel.type === 'dating' && (
                    <button className="btn btn-sm btn-primary" onClick={() => run('rel.propose', { relationshipId: selected.rel.id })}>
                      Propose
                    </button>
                  )}
                  {!isRomantic(selected.rel.type) && relationshipStrength(selected.rel, sim.now) >= 48 && (
                    <button className="btn btn-sm" onClick={() => run('rel.define', { relationshipId: selected.rel.id })}>
                      Define The Relationship
                    </button>
                  )}
                  <button className="btn btn-sm" onClick={() => setDateOpen(true)}>Ask Out</button>
                  <button className="btn btn-sm" onClick={() => setGiftOpen(true)}>Give A Gift</button>
                </>
              }
            >
              <div className="grid grid-2" style={{ marginBottom: 'var(--s4)' }}>
                <Stat label="Age" value={ageOn(selected.person.birthInstant, sim.now, sim.homeZone)} />
                <Stat label="Last Spoke" value={formatRelative(selected.rel.lastInteractionAt, sim.now)} />
              </div>

              <div className="grid grid-2">
                <Meter label="Familiarity" value={selected.rel.dimensions.familiarity} hint="How well you actually know each other." />
                <Meter label="Affection" value={selected.rel.dimensions.affection} />
                <Meter label="Trust" value={selected.rel.dimensions.trust} />
                <Meter label="Respect" value={selected.rel.dimensions.respect} />
                <Meter label="Compatibility" value={selected.rel.dimensions.compatibility} hint="Underlying fit. Mostly fixed." />
                <Meter label="Commitment" value={selected.rel.dimensions.commitment} />
                <Meter label="Conflict" value={selected.rel.dimensions.conflict} invert hint="Unresolved friction poisons everything else." />
              </div>
            </Panel>

            <DatesPanel personId={selected.person.id} />

            <Panel title="What You Can Do" flush>
              <div className="list">
                {(Object.entries(INTERACTIONS) as [InteractionKind, typeof INTERACTIONS[InteractionKind]][]).map(([kind, def]) => {
                  const locked = selected.rel.dimensions.familiarity < def.minFamiliarity;
                  return (
                    <div key={kind} className="list-item list-static">
                      <div className="grow">
                        <div className="small strong">{def.name}</div>
                        <div className="xs dim">{def.description}</div>
                      </div>
                      <span className="xs dim nowrap">{def.minutes} min</span>
                      <button
                        className="btn btn-sm"
                        disabled={locked}
                        title={locked ? `Needs familiarity of ${def.minFamiliarity}.` : undefined}
                        onClick={() => run('rel.interact', { relationshipId: selected.rel.id, interaction: kind })}
                      >
                        {locked ? 'Too Soon' : 'Do It'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </Panel>

            <Panel title="What They Remember" flush>
              {selected.rel.memories.length === 0 ? (
                <Empty title="Nothing Yet" body="Memories build as things happen between you." />
              ) : (
                <div className="list">
                  {[...selected.rel.memories].reverse().slice(0, 15).map((memory) => (
                    <div key={memory.id} className="list-item list-static">
                      <span className="xs dim nowrap" style={{ minWidth: 100 }}>{formatDate(memory.at, sim.homeZone)}</span>
                      <div className="grow">
                        <div className="small">{memory.summary}</div>
                        <div className="xs dim">
                          {memory.decayDays === 0 ? 'Never forgotten' : `Fades over ${memory.decayDays} days`}
                        </div>
                      </div>
                      <span className={`chip ${memory.impact > 0 ? 'chip-positive' : 'chip-negative'}`}>
                        {memory.impact > 0 ? '+' : ''}{memory.impact.toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        )}
      </div>

      {giftOpen && selected && (
        <Modal
          title={`Give something to ${selected.person.displayName}`}
          onClose={() => setGiftOpen(false)}
        >
          {gifts.length === 0 ? (
            <p className="muted">You do not own anything giftable. Watches, jewellery, clothing and art all work.</p>
          ) : (
            <div className="list">
              {gifts.map((asset) => (
                <button
                  key={asset.id}
                  className="list-item"
                  onClick={() => { run('rel.give_gift', { relationshipId: selected.rel.id, assetId: asset.id }); setGiftOpen(false); }}
                >
                  <div className="grow">
                    <div className="small strong">{asset.name}</div>
                    <div className="xs dim">{asset.brand} · {categoryLabel(asset.category)}</div>
                  </div>
                  <span className="mono small">{formatMoney(asset.currentValue, { cents: false })}</span>
                </button>
              ))}
            </div>
          )}
        </Modal>
      )}

      {dateOpen && selected && (
        <AskOutDialog
          relationshipId={selected.rel.id}
          name={selected.person.displayName}
          onClose={() => setDateOpen(false)}
        />
      )}
    </>
  );
}

function AskOutDialog({ relationshipId, name, onClose }: { relationshipId: string; name: string; onClose: () => void }) {
  const { sim, run, version } = useGame();
  const [days, setDays] = useState(3);
  const [hour, setHour] = useState(19);
  const [budget, setBudget] = useState(120);
  const [activity, setActivity] = useState('dinner');
  const [placeId, setPlaceId] = useState('');
  // Read against the activity chosen here, not only when the world moves:
  // useWorld memoises on the world alone and would keep the first list.
  const places = useMemo(
    () => (DATE_ACTIVITY_BY_ID[activity]?.placeKinds ?? []).flatMap((kind) => placesNear(sim, { kind, limit: 5 })).slice(0, 10),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sim, version, activity],
  );
  const place = places.find((entry) => entry.place.id === placeId)?.place;

  const day = zonedParts(addDays(sim.now, days, sim.homeZone), sim.homeZone);
  const at = instantFromZoned({ year: day.year, month: day.month, day: day.day, hour, minute: 0 }, sim.homeZone);

  const submit = () => {
    const result = run<{ accepted: boolean }>('rel.ask_out', {
      personId: relationshipIdToPerson(sim, relationshipId),
      activityId: activity,
      at,
      budget: budget * 100,
      placeId: placeId || undefined,
    });
    if (result.ok) onClose();
  };

  return (
    <Modal
      title={`Ask ${name} Out`}
      onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={submit}>Ask</button></>}
    >
      <p className="muted small">
        They can say no. How well they know you, how they feel about you, and what else is going on in
        their life all count. If they say yes it goes on the calendar, and when it comes round you play it.
      </p>
      <div className="field-row">
        <div className="field">
          <label htmlFor="activity">What You Would Do</label>
          <select id="activity" value={activity} onChange={(e) => { setActivity(e.target.value); setPlaceId(''); }}>
            {DATE_ACTIVITIES.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="date-place">Where</label>
          <select id="date-place" value={placeId} onChange={(e) => setPlaceId(e.target.value)}>
            <option value="">Wherever You Meet</option>
            {places.map(({ place: pl }) => <option key={pl.id} value={pl.id}>{pl.name}{pl.real ? ' (Real)' : ''}</option>)}
          </select>
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="days">Days From Now</label>
          <input id="days" type="number" min={1} max={30} value={days} onChange={(e) => setDays(Number(e.target.value))} />
        </div>
        <div className="field">
          <label htmlFor="date-hour">At</label>
          <select id="date-hour" value={hour} onChange={(e) => setHour(Number(e.target.value))}>
            {Array.from({ length: 14 }, (_, i) => i + 9).map((h) => <option key={h} value={h}>{h > 12 ? h - 12 : h}:00 {h >= 12 ? 'PM' : 'AM'}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="budget">Budget</label>
          <input id="budget" type="number" min={0} step={10} value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
        </div>
      </div>
      <div className="callout">{formatDate(at, sim.homeZone)} at {formatTime(at, sim.homeZone)}{place ? ` at ${place.name}` : ''}. Effort shows.</div>
    </Modal>
  );
}

const DATE_STATUS_LABEL: Readonly<Record<DateStatus, string>> = {
  planned: 'Planned', underway: 'Under Way', attended: 'Attended', skipped: 'Skipped', stood_up: 'You Did Not Go', they_cancelled: 'They Did Not Come', cancelled: 'Canceled',
};

function DatesPanel({ personId }: { personId: string }) {
  const { sim, run, version } = useGame();
  const scene = useWorld(activeScene);
  // Keyed on the person as well as the world, for the same reason as above.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const upcoming = useMemo(() => upcomingDates(sim).filter((d) => d.personId === personId), [sim, version, personId]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const past = useMemo(() => pastDates(sim).filter((d) => d.personId === personId).slice(0, 4), [sim, version, personId]);
  if (upcoming.length === 0 && past.length === 0) return null;
  return (
    <Panel title="Dates" subtitle="What is arranged, and how the last ones went." flush>
      <div className="list">
        {upcoming.map((date) => {
          const can = dateAttendable(sim, date);
          const place = placeOfDate(date);
          return (
            <div key={date.id} className="list-item list-static">
              <div className="grow">
                <div className="small strong">{activityOf(date).label}{place ? ` at ${place.name}` : ''}</div>
                <div className="xs dim">
                  {formatDate(date.at, sim.homeZone)} at {formatTime(date.at, sim.homeZone)} · {DATE_STATUS_LABEL[date.status]}{!can.ok && can.reason ? ` · ${can.reason}` : ''}
                </div>
              </div>
              <div className="row gap-1 wrap" style={{ justifyContent: 'flex-end' }}>
                <button className="btn btn-sm btn-primary" disabled={!can.ok || Boolean(scene)} onClick={() => run('date.attend', { dateId: date.id, mode: 'play' }, { idempotencyKey: `date:${date.id}:play` })}>Play It Out</button>
                <button className="btn btn-sm" disabled={!can.ok || Boolean(scene)} onClick={() => run('date.attend', { dateId: date.id, mode: 'summary' }, { idempotencyKey: `date:${date.id}:summary` })}>Just Do It</button>
                {date.status === 'planned' && <button className="btn btn-ghost btn-sm" onClick={() => run('date.cancel', { dateId: date.id })}>Cancel It</button>}
              </div>
            </div>
          );
        })}
        {past.map((date) => {
          const place = placeOfDate(date);
          return (
            <div key={date.id} className="list-item list-static">
              <div className="grow">
                <div className="small strong">{activityOf(date).label}{place ? ` at ${place.name}` : ''}</div>
                <div className="xs dim">
                  {formatDate(date.at, sim.homeZone)} · {DATE_STATUS_LABEL[date.status]}{date.outcome ? ` · ${titleCaseLabel(date.outcome)}` : ''}{date.spent > 0 ? ` · ${formatMoney(date.spent)}` : ''}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function relationshipIdToPerson(sim: ReturnType<typeof useGame>['sim'], relationshipId: string): string {
  const rel = sim.universe.relationships[relationshipId];
  if (!rel) return '';
  return rel.aId === sim.universe.playerId ? rel.bId : rel.aId;
}
