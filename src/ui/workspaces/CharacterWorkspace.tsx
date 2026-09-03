import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Meter, Tabs } from '@/ui/components/primitives';
import {
  ATTRIBUTE_GROUPS, attributesInGroup, effectiveAttributes, groupAverage,
  overallRating, TRAIT_BY_ID, type AttributeGroup,
} from '@/engine/domain/attributes';
import { SKILLS, domainAverage, type SkillDomain } from '@/engine/domain/skills';
import { ageOn } from '@/engine/core/time';
import { formatMoney } from '@/engine/core/money';
import { CITIES } from '@/engine/content/geography';

type Tab = 'attributes' | 'skills' | 'traits' | 'standing';

const SKILL_DOMAINS: SkillDomain[] = ['writing', 'directing', 'producing', 'executive', 'crew', 'business', 'creator', 'general'];

export function CharacterWorkspace() {
  const { sim } = useGame();
  const player = useWorld((s) => s.player);
  const [tab, setTab] = useState<Tab>('attributes');
  const [group, setGroup] = useState<AttributeGroup>('Craft');

  const effective = effectiveAttributes(player.attributes, player.traits);
  const age = ageOn(player.birthInstant, sim.now, sim.homeZone);

  return (
    <>
      <div className="page-head page-head-portrait">
        {player.portrait && (
          <img className="headshot headshot-lg" src={player.portrait} alt={`Headshot for ${player.displayName}`} />
        )}
        <div>
          <div className="eyebrow">Character</div>
          <h1>{player.displayName}</h1>
          <p className="muted">
            {age} · {player.careerTrack} · {CITIES.get(player.currentLocationId)?.name}
            {player.stageName && ` · credited as ${player.stageName}`}
          </p>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 'var(--s5)' }}>
        <Stat label="Overall Performer Rating" value={Math.round(overallRating(effective))} note="Average across all 88" />
        <Stat label="Traits Held" value={player.traits.length} />
        <Stat label="Credits" value={player.creditIds.length} />
        <Stat label="Quote" value={<span className="mono">{player.quote > 0 ? formatMoney(player.quote, { cents: false }) : '—'}</span>} note="What you can ask per project" />
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'attributes', label: 'Attributes' },
          { id: 'skills', label: 'Skills' },
          { id: 'traits', label: 'Traits', badge: player.traits.length },
          { id: 'standing', label: 'Standing' },
        ]}
      />

      {tab === 'attributes' && (
        <>
          <div className="row wrap gap-2" style={{ marginBottom: 'var(--s4)' }}>
            {ATTRIBUTE_GROUPS.map((name) => (
              <button
                key={name}
                className="chip"
                aria-pressed={group === name}
                style={group === name ? { background: 'var(--accent-dim)', color: 'var(--accent-strong)', borderColor: 'var(--accent-line)' } : undefined}
                onClick={() => setGroup(name)}
              >
                {name} {Math.round(groupAverage(effective, name))}
              </button>
            ))}
          </div>

          <Panel
            title={group}
            subtitle={`${attributesInGroup(group).length} attributes · average ${Math.round(groupAverage(effective, group))}`}
          >
            {attributesInGroup(group).map((attribute) => {
              const base = player.attributes[attribute.id] ?? 0;
              const value = effective[attribute.id] ?? 0;
              const modified = Math.round(value) !== Math.round(base);
              return (
                <div key={attribute.id} className="attr-row" title={attribute.description}>
                  <div>
                    <div className="attr-name">{attribute.name}</div>
                    <div className="xs dim">{attribute.description}</div>
                  </div>
                  <div className="attr-value">
                    {Math.round(value)}
                    {modified && (
                      <span className={value > base ? 'positive xs' : 'negative xs'}>
                        {' '}{value > base ? '+' : ''}{Math.round(value - base)}
                      </span>
                    )}
                  </div>
                  <div className="meter">
                    <span style={{ width: `${value}%` }} />
                  </div>
                </div>
              );
            })}
          </Panel>
        </>
      )}

      {tab === 'skills' && (
        <div className="grid grid-2">
          {SKILL_DOMAINS.map((domain) => (
            <Panel key={domain} title={domain} subtitle={`Average ${Math.round(domainAverage(player.skills, domain))}`}>
              {SKILLS.filter((s) => s.domain === domain).map((skill) => (
                <div key={skill.id} className="attr-row" title={skill.description}>
                  <div className="attr-name">{skill.name}</div>
                  <div className="attr-value">{Math.round(player.skills[skill.id] ?? 0)}</div>
                  <div className="meter"><span style={{ width: `${player.skills[skill.id] ?? 0}%` }} /></div>
                </div>
              ))}
            </Panel>
          ))}
        </div>
      )}

      {tab === 'traits' && (
        <Panel title="Traits" subtitle="These reshape how systems behave rather than adding points.">
          {player.traits.length === 0 ? (
            <p className="muted">You hold no traits.</p>
          ) : (
            <div className="col gap-4">
              {player.traits.map((id) => {
                const trait = TRAIT_BY_ID[id];
                if (!trait) return null;
                return (
                  <div key={id}>
                    <div className="row gap-2">
                      <span className="strong">{trait.name}</span>
                      <span className="chip">{trait.category}</span>
                    </div>
                    <p className="small muted" style={{ margin: '4px 0' }}>{trait.description}</p>
                    <div className="row wrap gap-1">
                      {Object.entries(trait.attributeMods ?? {}).map(([key, delta]) => (
                        <span key={key} className={`chip ${delta > 0 ? 'chip-positive' : 'chip-negative'}`}>
                          {key.replace(/_/g, ' ')} {delta > 0 ? '+' : ''}{delta}
                        </span>
                      ))}
                      {Object.entries(trait.systemMods ?? {}).map(([key, value]) => (
                        <span key={key} className="chip chip-info">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()} ×{value}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      )}

      {tab === 'standing' && (
        <div className="grid grid-2">
          <Panel title="Reputation" subtitle="Seven separate things. You can be famous and disliked professionally.">
            <div className="col gap-4">
              <Meter label="Public Fame" value={player.reputation.publicFame} hint="How many people know who you are." />
              <Meter label="Audience Appeal" value={player.reputation.audienceAppeal} hint="Whether the people who know you like you." />
              <Meter label="Professional Reputation" value={player.reputation.professionalReputation} hint="What the industry thinks of the work." />
              <Meter label="Reliability" value={player.reputation.reliability} hint="Whether producers believe you will finish the job." />
              <Meter label="Prestige" value={player.reputation.prestige} hint="Awards and critical standing." />
              <Meter label="Industry Demand" value={player.reputation.industryDemand} hint="How many people want to hire you right now." />
              <Meter label="Controversy" value={player.reputation.controversy} invert hint="Active negative attention. Decays slowly." />
            </div>
          </Panel>

          <Panel title="Representation">
            {player.representation.agencyName ? (
              <div className="col gap-3">
                <Stat label="Agency" value={player.representation.agencyName} note={`${Math.round((player.representation.agentCommission ?? 0) * 100)}% commission`} />
                {player.representation.managerId && <Stat label="Manager" value="Signed" />}
                {player.representation.lawyerId && <Stat label="Lawyer" value="Retained" />}
                {player.representation.publicistId && <Stat label="Publicist" value="Retained" />}
              </div>
            ) : (
              <p className="muted small">
                You are unrepresented. An agent multiplies how many opportunities reach you at all.
              </p>
            )}

            <hr className="divider" />
            <div className="eyebrow" style={{ marginBottom: 'var(--s2)' }}>Personality</div>
            <div className="col gap-2">
              {Object.entries(player.personality).map(([key, value]) => (
                <div key={key}>
                  <div className="row-between xs">
                    <span className="muted">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                    <span className="mono">{value}</span>
                  </div>
                  <div className="meter"><span style={{ width: `${value}%` }} /></div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}
    </>
  );
}
