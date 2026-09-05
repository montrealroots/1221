import { titleCaseLabel } from '@/engine/core/text';
import { careerLabel } from '@/engine/world/bootstrap';
import { useState } from 'react';
import { performerNoun } from '@/engine/core/performer';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Meter, Tabs } from '@/ui/components/primitives';
import {
  ATTRIBUTE_GROUPS, attributesInGroup, conflictingTraits, effectiveAttributes, effectiveSkills,
  groupAverage, overallRating, traitName, TRAIT_BY_ID, traitsForProfession, type AttributeGroup,
} from '@/engine/domain/attributes';
import { SKILLS, domainAverage, type SkillDomain } from '@/engine/domain/skills';
import {
  LEVEL_XP, PROFESSIONS, PROFESSION_BY_ID, levelFor, traitSlotsAt, xpToNextLevel,
} from '@/engine/content/professions';
import { ageOn } from '@/engine/core/time';
import { formatMoney } from '@/engine/core/money';
import { CITIES } from '@/engine/content/geography';

type Tab = 'attributes' | 'professions' | 'skills' | 'traits' | 'standing';

const SKILL_NAME: Record<string, string> = Object.fromEntries(SKILLS.map((k) => [k.id, k.name]));

const SKILL_DOMAINS: SkillDomain[] = ['writing', 'directing', 'producing', 'executive', 'crew', 'business', 'creator', 'general'];

export function CharacterWorkspace() {
  const { sim, run } = useGame();
  const player = useWorld((s) => s.player);
  // Everything on this screen is at the ceiling: the founder is a prodigy.
  const cheating = true;
  const [tab, setTab] = useState<Tab>('attributes');
  const xp = player.industryXp ?? 0;
  const held = Object.values(player.professions ?? {}).flatMap((p) => p?.traitIds ?? []);
  const skills = effectiveSkills(player.skills, held);
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
            {age} · {careerLabel(player.careerTrack)} · {CITIES.get(player.currentLocationId)?.name}
            {player.stageName && ` · credited as ${player.stageName}`}
          </p>
        </div>
      </div>

      {cheating && (
        <p className="god-banner" style={{ marginBottom: 'var(--s4)' }}>
          God Mode Is On. Every attribute, skill and trait is at the top of the scale, and nothing you ask the
          industry for will be refused. None of it was earned, and the save records every bit of it.
        </p>
      )}

      <div className="grid grid-4" style={{ marginBottom: 'var(--s5)' }}>
        <Stat
          label="Overall Performer Rating"
          value={cheating
            ? <span className="god">{Math.round(overallRating(effective))}</span>
            : Math.round(overallRating(effective))}
          note="Every one of the 88 at the ceiling"
        />
        <Stat label="Industry XP" value={<span className="mono">{xp.toLocaleString('en-US')}</span>} note="Earned by working. Spent to unlock professions." />
        <Stat label="Credits" value={player.creditIds.length} />
        <Stat label="Quote" value={<span className="mono">{player.quote > 0 ? formatMoney(player.quote, { cents: false }) : '—'}</span>} note="What you can ask per project" />
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'attributes', label: 'Attributes' },
          { id: 'professions', label: 'Professions', badge: Object.keys(player.professions ?? {}).length || undefined },
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
                <div key={attribute.id} className={`attr-row${cheating ? ' god-row' : ''}`} title={attribute.description}>
                  <div>
                    <div className="attr-name">{attribute.name}</div>
                    <div className="xs dim">{attribute.description}</div>
                  </div>
                  <div className={`attr-value${cheating ? ' god-value' : ''}`}>
                    {Math.round(value)}
                    {!cheating && modified && (
                      <span className={value > base ? 'positive xs' : 'negative xs'}>
                        {' '}{value > base ? '+' : ''}{Math.round(value - base)}
                      </span>
                    )}
                  </div>
                  <div className={`meter${cheating ? ' god-meter' : ''}`}>
                    <span style={{ width: '100%' }} />
                  </div>
                </div>
              );
            })}
          </Panel>
        </>
      )}

      {tab === 'professions' && (
        <div className="col gap-4">
          <p className="muted small" style={{ margin: 0 }}>
            You are {performerNoun(player).toLowerCase() === 'actress' ? 'an actress' : 'an actor'}. Everything else in the industry is unlocked with the experience you
            earn working, and each profession then levels on its own work: every one of its skills rises
            with each level, and a trait slot opens at levels 1, 3, 6 and 9.
          </p>
          <div className="grid grid-2">
            {PROFESSIONS.map((def) => {
              const progress = player.professions?.[def.id];
              const level = progress ? levelFor(progress.xp) : 0;
              const missing = def.requires.filter((id) => !player.professions?.[id]);
              const affordable = xp >= def.unlockXp;
              const slots = progress ? traitSlotsAt(level) : 0;
              const picked = progress?.traitIds ?? [];
              const open = Math.max(0, slots - picked.length);
              const choices = progress
                ? traitsForProfession(def.id).filter((t) => !picked.includes(t.id) && conflictingTraits(picked, t.id).length === 0)
                : [];
              const floor = LEVEL_XP[level - 1] ?? 0;
              const ceiling = LEVEL_XP[level] ?? (progress?.xp ?? 0);
              const toNext = progress ? xpToNextLevel(progress.xp) : 0;

              return (
                <Panel
                  key={def.id}
                  title={def.name}
                  subtitle={def.blurb}
                  actions={progress
                    ? <span className="chip chip-accent">Level {level}</span>
                    : (
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        disabled={!affordable || missing.length > 0}
                        onClick={() => run('profession.unlock', { professionId: def.id }, { idempotencyKey: `profession.unlock:${def.id}` })}
                      >
                        Unlock · {def.unlockXp.toLocaleString('en-US')} XP
                      </button>
                    )}
                >
                  {!progress && (
                    <p className="small muted" style={{ margin: 0 }}>
                      {def.earnedBy}
                      {missing.length > 0 && ` Needs ${missing.map((id) => PROFESSION_BY_ID[id].name).join(' and ')} first.`}
                      {missing.length === 0 && !affordable && ` ${(def.unlockXp - xp).toLocaleString('en-US')} more XP to unlock.`}
                    </p>
                  )}

                  {progress && (
                    <div className="col gap-4">
                      <Meter
                        label={toNext > 0 ? `${toNext.toLocaleString('en-US')} XP To Level ${level + 1}` : 'Top Level'}
                        value={progress.xp - floor}
                        max={Math.max(1, ceiling - floor)}
                        hint={def.earnedBy}
                      />

                      <div>
                        <div className="eyebrow" style={{ marginBottom: 'var(--s2)' }}>Skills</div>
                        <div className="col gap-2">
                          {def.skillIds.map((id) => (
                            <div key={id}>
                              <div className="row-between xs">
                                <span className="muted">{SKILL_NAME[id] ?? id}</span>
                                <span className="mono">{Math.round(skills[id] ?? 0)}</span>
                              </div>
                              <div className="meter"><span style={{ width: `${Math.round(skills[id] ?? 0)}%` }} /></div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="row-between" style={{ marginBottom: 'var(--s2)' }}>
                          <span className="eyebrow">Traits</span>
                          <span className="chip">{picked.length} / {slots}</span>
                        </div>
                        {picked.length === 0 && open === 0 && (
                          <p className="small muted" style={{ margin: 0 }}>The first slot opens at level 1.</p>
                        )}
                        <div className="col gap-2">
                          {picked.map((id) => {
                            const trait = TRAIT_BY_ID[id];
                            if (!trait) return null;
                            return (
                              <div key={id}>
                                <div className="strong small">{traitName(trait, player)}</div>
                                <div className="xs muted">{trait.description}</div>
                              </div>
                            );
                          })}
                        </div>
                        {open > 0 && (
                          <div className="field" style={{ marginTop: 'var(--s3)' }}>
                            <label htmlFor={`pick-${def.id}`}>Pick A Trait ({open} Open)</label>
                            <select
                              id={`pick-${def.id}`}
                              value=""
                              onChange={(e) => {
                                const traitId = e.target.value;
                                if (!traitId) return;
                                run('profession.pick_trait', { professionId: def.id, traitId }, { idempotencyKey: `profession.pick_trait:${def.id}:${traitId}` });
                              }}
                            >
                              <option value="">Choose…</option>
                              {choices.map((t) => (
                                <option key={t.id} value={t.id}>{t.name} — {t.description}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Panel>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'skills' && (
        <div className="grid grid-2">
          {SKILL_DOMAINS.map((domain) => (
            <Panel key={domain} title={domain} subtitle={`Average ${Math.round(domainAverage(player.skills, domain))}`}>
              {SKILLS.filter((s) => s.domain === domain).map((skill) => (
                <div key={skill.id} className={`attr-row${cheating ? ' god-row' : ''}`} title={skill.description}>
                  <div className="attr-name">{skill.name}</div>
                  <div className={`attr-value${cheating ? ' god-value' : ''}`}>
                    {Math.round(player.skills[skill.id] ?? 0)}
                  </div>
                  <div className={`meter${cheating ? ' god-meter' : ''}`}>
                    <span style={{ width: cheating ? '100%' : `${player.skills[skill.id] ?? 0}%` }} />
                  </div>
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
                      <span className={`strong${cheating ? ' god' : ''}`}>{traitName(trait, player)}</span>
                      <span className={`chip${cheating ? ' chip-god' : ''}`}>{titleCaseLabel(trait.category)}</span>
                    </div>
                    <p className="small muted" style={{ margin: '4px 0' }}>{trait.description}</p>
                    <div className="row wrap gap-1">
                      {Object.entries(trait.attributeMods ?? {}).map(([key, delta]) => (
                        <span key={key} className={`chip ${delta > 0 ? 'chip-positive' : 'chip-negative'}`}>
                          {titleCaseLabel(key.replace(/_/g, ' '))} {delta > 0 ? '+' : ''}{delta}
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
