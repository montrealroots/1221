import { categoryLabel, titleCaseLabel } from '@/engine/core/text';
import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Meter, Empty, Modal, Stat } from '@/ui/components/primitives';
import { socialCircle } from '@/engine/world/world';
import {
  INTERACTIONS, describeRelationship, relationshipStrength, isRomantic, giftableAssets,
  type InteractionKind,
} from '@/engine/systems/relationships';
import { formatDate, formatRelative, ageOn, addDays } from '@/engine/core/time';
import { formatMoney } from '@/engine/core/money';

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
                        {locked ? 'Too soon' : 'Do it'}
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
  const { sim, run } = useGame();
  const [days, setDays] = useState(3);
  const [budget, setBudget] = useState(120);
  const [activity, setActivity] = useState('dinner');

  const at = addDays(sim.now, days, sim.homeZone);

  const submit = () => {
    const result = run<{ accepted: boolean }>('rel.ask_out', {
      personId: relationshipIdToPerson(sim, relationshipId),
      activityId: activity,
      at,
      budget: budget * 100,
    });
    if (result.ok) onClose();
  };

  return (
    <Modal
      title={`Ask ${name} out`}
      onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={submit}>Ask</button></>}
    >
      <p className="muted small">
        They can say no. How well they know you, how they feel about you, and what else is going on in
        their life all count.
      </p>
      <div className="field">
        <label htmlFor="activity">What You Would Do</label>
        <select id="activity" value={activity} onChange={(e) => setActivity(e.target.value)}>
          <option value="dinner">Dinner</option>
          <option value="drinks">Drinks</option>
          <option value="film">See something</option>
          <option value="walk">A walk somewhere</option>
        </select>
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="days">Days From Now</label>
          <input id="days" type="number" min={1} max={30} value={days} onChange={(e) => setDays(Number(e.target.value))} />
        </div>
        <div className="field">
          <label htmlFor="budget">Budget</label>
          <input id="budget" type="number" min={0} step={10} value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
        </div>
      </div>
      <div className="callout">{formatDate(at, sim.homeZone)}. Effort shows.</div>
    </Modal>
  );
}

function relationshipIdToPerson(sim: ReturnType<typeof useGame>['sim'], relationshipId: string): string {
  const rel = sim.universe.relationships[relationshipId];
  if (!rel) return '';
  return rel.aId === sim.universe.playerId ? rel.bId : rel.aId;
}
