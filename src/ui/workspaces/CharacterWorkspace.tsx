import { titleCaseLabel } from '@/engine/core/text';
import { careerLabel } from '@/engine/world/bootstrap';
import { useState } from 'react';
import { performerNoun, performerTitleOf } from '@/engine/core/performer';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Meter, Tabs } from '@/ui/components/primitives';
import {
  ALL_TRAITS, ATTRIBUTES, ATTRIBUTE_GROUPS, attributesInGroup, attributesOf, conflictingTraits, skillsOf,
  groupAverage, overallRating, traitName, TRAIT_BY_ID, traitsForProfession, type AttributeGroup,
} from '@/engine/domain/attributes';
import { SKILLS, domainAverage, type SkillDomain } from '@/engine/domain/skills';
import {
  LEVEL_XP, PROFESSIONS, PROFESSION_BY_ID, levelFor, traitSlotsAt, xpToNextLevel, type ProfessionId,
} from '@/engine/content/professions';
import { CEILING, GOAT_LABEL, POSITIONS, goatTraitsIn } from '@/engine/content/prodigy';
import { FOUNDER_ATTRIBUTES, FOUNDER_TRAITS } from '@/engine/content/founder';
import { founderScore } from '@/engine/systems/shingle';
import { ageOn } from '@/engine/core/time';
import { formatMoney } from '@/engine/core/money';
import { formatDate, MS_DAY } from '@/engine/core/time';
import { CITIES, COUNTRIES } from '@/engine/content/geography';
import { DOCUMENT_NOTE, licenseAuthorityFor, passportAuthorityFor } from '@/engine/content/documents';
import { SIX_MONTH_NOTE, exchangeOffer, regionOfCity, residenceCityOf, statusOf } from '@/engine/systems/documents';
import type { IdentityDocument } from '@/engine/domain/model';
import { countryOfCity } from '@/engine/content/geography';
import {
  describePet, growingOf, lessonCost, livedThrough, pendingMoment, readyToDrive, testCost,
} from '@/engine/systems/growing';
import { ALLOWANCE_NOTE, DRIVING_NOTE, GROWING_NOTE, PET_NOTE } from '@/engine/content/growingup';
import {
  describeJob, floorHere, jobOf, jobsHeld, openingsFor, promotionFor, shiftIsDue, shiftsToCome,
  stateFloorFor, stateFloorNameFor,
  wageFor,
} from '@/engine/systems/work';
import {
  BRANCH_NOTE, COVER_NOTE, EMPLOYER_NOTE, LADDER_NOTE, LETTING_GO_NOTE, PAYDAY_NOTE, ROLE_BY_ID,
  SHIFT_BY_ID, SICK_NOTE,
} from '@/engine/content/employers';
import {
  JOB_NOTE, LOCAL_NOTE, NO_MINIMUM_NOTE, STATE_NOTE, WAGE_NOTE, YOUNG_NOTE,
} from '@/engine/content/work';
import {
  AGE_GATE_NOTE, LIFESPAN_NOTE, PENSION_NOTE, describeHeight, describeWeight,
} from '@/engine/content/lifespan';
import {
  adultHeightOf, adultWeightOf, ageOf, agingOf, ceilingOf, describePassing, describeYears, familyOf,
  fullyGrown, gatesFor, heightOf, isAlive, mayI, pensionAgeFor, relationLabel, stageOf, weightOf,
  yearsToPension,
} from '@/engine/systems/lifespan';
import { plural } from '@/engine/core/text';

type Tab = 'positions' | 'attributes' | 'professions' | 'skills' | 'traits' | 'standing' | 'papers' | 'life';

const SKILL_NAME: Record<string, string> = Object.fromEntries(SKILLS.map((k) => [k.id, k.name]));

const SKILL_DOMAINS: SkillDomain[] = ['writing', 'directing', 'producing', 'executive', 'crew', 'business', 'creator', 'general'];

export function CharacterWorkspace() {
  const { sim, run } = useGame();
  const player = useWorld((s) => s.player);
  // Everything on this screen is at the ceiling: the founder is the prodigy.
  const goat = player.prodigy === true;
  const [tab, setTab] = useState<Tab>('positions');
  const xp = player.industryXp ?? 0;
  const held = Object.values(player.professions ?? {}).flatMap((p) => p?.traitIds ?? []);
  const skills = skillsOf(player, held);
  const [group, setGroup] = useState<AttributeGroup>('Craft');

  const effective = attributesOf(player);
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
            {age} · {careerLabel(player.careerTrack, performerTitleOf(player))} · {CITIES.get(player.currentLocationId)?.name}
            {player.stageName && ` · credited as ${player.stageName}`}
          </p>
        </div>
      </div>

      {goat && (
        <p className="god-banner" style={{ marginBottom: 'var(--s4)' }}>
          {GOAT_LABEL} at writing, directing, producing, showrunning and acting. Every attribute, every skill and
          every trait in the game, all at {CEILING} at once.
        </p>
      )}

      <div className="grid grid-4" style={{ marginBottom: 'var(--s5)' }}>
        <Stat
          label="Overall Performer Rating"
          value={goat
            ? <span className="god">{Math.round(overallRating(effective))}</span>
            : Math.round(overallRating(effective))}
          note={`All ${ATTRIBUTES.length} at ${CEILING}`}
        />
        <Stat label="Industry XP" value={<span className="mono">{xp.toLocaleString('en-US')}</span>} note="Earned by working. Spent to unlock professions." />
        <Stat label="Credits" value={player.creditIds.length} />
        <Stat label="Quote" value={<span className="mono">{player.quote > 0 ? formatMoney(player.quote, { cents: false }) : '—'}</span>} note="What you can ask per project" />
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'positions', label: GOAT_LABEL, badge: POSITIONS.length },
          { id: 'attributes', label: 'Attributes' },
          { id: 'professions', label: 'Professions', badge: Object.keys(player.professions ?? {}).length || undefined },
          { id: 'skills', label: 'Skills' },
          { id: 'traits', label: 'Traits', badge: player.traits.length },
          { id: 'standing', label: 'Standing' },
          { id: 'papers', label: 'Papers' },
          { id: 'life', label: 'Your Life' },
        ]}
      />

      {tab === 'papers' && <PapersTab />}

      {tab === 'life' && <LifeTab />}

      {tab === 'positions' && (
        <div className="col gap-4">
          {POSITIONS.map((position) => {
            const attributes = position.attributeGroups.flatMap((g) => attributesInGroup(g as AttributeGroup));
            const positionSkills = SKILLS.filter((k) => position.skillDomains.includes(k.domain));
            const producing = position.producerSheet ? FOUNDER_ATTRIBUTES : [];
            const traits = [
              ...goatTraitsIn(position.id).map((t) => ({ id: t.id, name: t.name, tier: GOAT_LABEL })),
              ...(position.traitProfession ? traitsForProfession(position.traitProfession as ProfessionId) : [])
                .map((t) => ({ id: t.id, name: t.name, tier: 'Profession' })),
              ...(position.performerTraits ? ALL_TRAITS.filter((t) => !t.profession) : [])
                .map((t) => ({ id: t.id, name: t.name, tier: titleCaseLabel(t.category) })),
              ...(position.producerTraits ? FOUNDER_TRAITS : [])
                .map((t) => ({ id: t.id, name: t.name, tier: 'Producing' })),
            ];
            const measures = attributes.length + positionSkills.length + producing.length;

            return (
              <Panel
                key={position.id}
                title={position.name}
                subtitle={`${measures} ${measures === 1 ? 'measure' : 'measures'}, all at ${CEILING} · ${traits.length} traits, all held`}
                actions={<span className="chip chip-accent">{GOAT_LABEL}</span>}
              >
                {producing.length > 0 && (
                  <>
                    <div className="eyebrow" style={{ marginBottom: 'var(--s2)' }}>Producing Attributes</div>
                    {producing.map((attribute) => (
                      <div key={attribute.id} className={`attr-row${goat ? ' god-row' : ''}`} title={attribute.description}>
                        <div className="attr-name">{attribute.name}</div>
                        <div className={`attr-value${goat ? ' god-value' : ''}`}>{Math.round(founderScore(sim, attribute.id))}</div>
                        <div className={`meter${goat ? ' god-meter' : ''}`}><span style={{ width: `${founderScore(sim, attribute.id)}%` }} /></div>
                      </div>
                    ))}
                  </>
                )}

                {attributes.length > 0 && (
                  <>
                    <div className="eyebrow" style={{ margin: 'var(--s3) 0 var(--s2)' }}>Performer Attributes</div>
                    {attributes.map((attribute) => (
                      <div key={attribute.id} className={`attr-row${goat ? ' god-row' : ''}`} title={attribute.description}>
                        <div className="attr-name">{attribute.name}</div>
                        <div className={`attr-value${goat ? ' god-value' : ''}`}>{Math.round(effective[attribute.id] ?? 0)}</div>
                        <div className={`meter${goat ? ' god-meter' : ''}`}><span style={{ width: `${effective[attribute.id] ?? 0}%` }} /></div>
                      </div>
                    ))}
                  </>
                )}

                {positionSkills.length > 0 && (
                  <>
                    <div className="eyebrow" style={{ margin: 'var(--s3) 0 var(--s2)' }}>Skills</div>
                    {positionSkills.map((skill) => (
                      <div key={skill.id} className={`attr-row${goat ? ' god-row' : ''}`} title={skill.description}>
                        <div className="attr-name">{skill.name}</div>
                        <div className={`attr-value${goat ? ' god-value' : ''}`}>{Math.round(skills[skill.id] ?? 0)}</div>
                        <div className={`meter${goat ? ' god-meter' : ''}`}><span style={{ width: `${skills[skill.id] ?? 0}%` }} /></div>
                      </div>
                    ))}
                  </>
                )}

                <div className="eyebrow" style={{ margin: 'var(--s3) 0 var(--s2)' }}>Traits</div>
                <div className="row wrap gap-1">
                  {traits.map((trait) => (
                    <span
                      key={trait.id}
                      className={`chip${trait.tier === GOAT_LABEL ? ' chip-accent' : goat ? ' chip-god' : ''}`}
                      title={trait.tier}
                    >
                      {trait.name}
                    </span>
                  ))}
                </div>
              </Panel>
            );
          })}
        </div>
      )}

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
                <div key={attribute.id} className={`attr-row${goat ? ' god-row' : ''}`} title={attribute.description}>
                  <div>
                    <div className="attr-name">{attribute.name}</div>
                    <div className="xs dim">{attribute.description}</div>
                  </div>
                  <div className={`attr-value${goat ? ' god-value' : ''}`}>
                    {Math.round(value)}
                    {!goat && modified && (
                      <span className={value > base ? 'positive xs' : 'negative xs'}>
                        {' '}{value > base ? '+' : ''}{Math.round(value - base)}
                      </span>
                    )}
                  </div>
                  <div className={`meter${goat ? ' god-meter' : ''}`}>
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
          <div className="grid grid-sheet">
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
        <div className="grid grid-sheet">
          {SKILL_DOMAINS.map((domain) => (
            <Panel key={domain} title={titleCaseLabel(domain)} subtitle={`Average ${Math.round(domainAverage(player.skills, domain))}`}>
              {SKILLS.filter((s) => s.domain === domain).map((skill) => (
                <div key={skill.id} className={`attr-row${goat ? ' god-row' : ''}`} title={skill.description}>
                  <div className="attr-name">{skill.name}</div>
                  <div className={`attr-value${goat ? ' god-value' : ''}`}>
                    {Math.round(player.skills[skill.id] ?? 0)}
                  </div>
                  <div className={`meter${goat ? ' god-meter' : ''}`}>
                    <span style={{ width: goat ? '100%' : `${player.skills[skill.id] ?? 0}%` }} />
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
                      <span className={`strong${goat ? ' god' : ''}`}>{traitName(trait, player)}</span>
                      <span className={`chip${goat ? ' chip-god' : ''}`}>{titleCaseLabel(trait.category)}</span>
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
                          {titleCaseLabel(key.replace(/([A-Z])/g, ' $1'))} ×{value}
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
        <div className="grid grid-sheet">
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

/** A document on screen: who issued it, its number, its dates and what it is right now. */
function DocumentLine({ doc, none }: { doc: IdentityDocument | undefined; none: string }) {
  const { sim } = useGame();
  if (!doc) return <div className="xs dim">{none}</div>;
  const state = statusOf(sim, doc);
  const chip = state === 'valid' ? 'chip-positive' : state === 'applied' ? '' : 'chip-negative';
  const stateLabel = state === 'valid' ? (doc.emergency ? 'Emergency Document' : 'Valid') : state === 'applied' ? (doc.roadTestAt ? 'Learner' : 'At The Office') : state === 'expired' ? 'Expired' : 'Lost';
  const days = Math.floor((doc.expiresAt - sim.now) / MS_DAY);
  return (
    <div className="list-item list-static">
      <div className="grow">
        <div className="small strong">{doc.authority}{doc.regionId ? ` · ${COUNTRIES.get(doc.issuerId)?.name ?? doc.issuerId}` : ` · ${COUNTRIES.get(doc.issuerId)?.name ?? doc.issuerId}`}</div>
        <div className="xs dim">
          {state === 'applied'
            ? doc.roadTestAt ? `Road test ${formatDate(doc.roadTestAt, sim.homeZone)}` : `Due ${formatDate(doc.readyAt ?? sim.now, sim.homeZone)}`
            : `${doc.number} · issued ${formatDate(doc.issuedAt, sim.homeZone)} · ${state === 'valid' ? `runs out ${formatDate(doc.expiresAt, sim.homeZone)} (${days} days)` : `ran out ${formatDate(doc.expiresAt, sim.homeZone)}`}`}
        </div>
      </div>
      <span className={`chip ${chip}`}>{stateLabel}</span>
    </div>
  );
}

function PapersTab() {
  const { sim, run } = useGame();
  const player = useWorld((s) => s.player);
  const papers = player.documents ?? {};
  const passportAuthority = passportAuthorityFor(player.citizenshipId);
  const secondAuthority = player.secondCitizenshipId ? passportAuthorityFor(player.secondCitizenshipId) : undefined;
  const homeCity = residenceCityOf(sim, player);
  const licenseAuthority = licenseAuthorityFor(countryOfCity(homeCity) ?? player.citizenshipId, regionOfCity(homeCity));
  const exchange = exchangeOffer(sim, player);
  const passportState = statusOf(sim, papers.passport);
  const licenseState = statusOf(sim, papers.license);
  const renewable = (doc: IdentityDocument | undefined) => doc ? doc.status !== 'applied' && (statusOf(sim, doc) !== 'valid' || doc.expiresAt - sim.now < 365 * MS_DAY || Boolean(doc.emergency)) : true;
  return (
    <div className="col gap-4">
      <Panel
        title="Passport"
        subtitle={passportAuthority ? `${passportAuthority.authority.authority} issues a ${COUNTRIES.get(passportAuthority.issuerId)?.name ?? ''} passport for ${passportAuthority.authority.validityYears} years, ${formatMoney(passportAuthority.authority.fee)}, about ${passportAuthority.authority.weeks} weeks${passportAuthority.authority.expedite ? `, or ${passportAuthority.authority.expedite.weeks} for ${formatMoney(passportAuthority.authority.expedite.fee)} more` : ''}.` : 'Nobody issues you one.'}
        flush
        actions={
          <>
            {renewable(papers.passport) && passportAuthority && (
              <button className="btn btn-sm btn-primary" onClick={() => run('doc.apply_passport', { which: 'passport' })}>
                {passportState === 'none' || passportState === 'lost' || passportState === 'expired' ? 'Apply For A Passport' : 'Renew It'}
              </button>
            )}
            {renewable(papers.passport) && passportAuthority?.authority.expedite && (
              <button className="btn btn-sm" onClick={() => run('doc.apply_passport', { which: 'passport', expedite: true })}>Expedite</button>
            )}
            {papers.passport && passportState !== 'lost' && passportState !== 'applied' && (
              <button className="btn btn-sm" onClick={() => run('doc.report_lost', { kind: 'passport' })}>Report It Lost</button>
            )}
          </>
        }
      >
        <div className="list">
          <DocumentLine doc={papers.passport} none="You hold no passport." />
          {player.secondCitizenshipId && (
            <>
              <DocumentLine doc={papers.secondPassport} none={`No ${COUNTRIES.get(player.secondCitizenshipId)?.name ?? ''} passport yet.`} />
              {renewable(papers.secondPassport) && secondAuthority && (
                <div className="list-item list-static">
                  <div className="grow xs dim">{secondAuthority.authority.authority}: {formatMoney(secondAuthority.authority.fee)}, {secondAuthority.authority.weeks} weeks.</div>
                  <button className="btn btn-sm" onClick={() => run('doc.apply_passport', { which: 'secondPassport' })}>Apply For The Second Passport</button>
                </div>
              )}
            </>
          )}
          <div className="list-item list-static"><div className="xs dim">{SIX_MONTH_NOTE}</div></div>
        </div>
      </Panel>

      <Panel
        title="Driver’s License"
        subtitle={licenseAuthority ? `${licenseAuthority.office} licenses drivers from ${licenseAuthority.authority.minAge}: ${licenseAuthority.authority.tests.map((t) => t === 'knowledge' ? 'a knowledge test' : t === 'road' ? 'a road test' : t === 'hazard' ? 'a hazard test' : 'an eye test').join(', ')}, ${formatMoney(licenseAuthority.authority.fee)}, good for ${licenseAuthority.authority.validityYears} years.` : 'Nobody where you live issues one SLATE knows of.'}
        flush
        actions={
          <>
            {(licenseState === 'none' || (licenseState === 'expired' && !papers.license)) && licenseAuthority && (
              <button className="btn btn-sm btn-primary" onClick={() => run('doc.apply_license', {})}>Apply For A License</button>
            )}
            {papers.license && licenseState !== 'applied' && renewable(papers.license) && (
              <button className="btn btn-sm btn-primary" onClick={() => run('doc.renew_license', {})}>{licenseState === 'valid' ? 'Renew It' : 'Replace It'}</button>
            )}
            {papers.license && licenseState !== 'lost' && licenseState !== 'applied' && (
              <button className="btn btn-sm" onClick={() => run('doc.report_lost', { kind: 'license' })}>Report It Lost</button>
            )}
            {exchange?.exchangeable && (
              <button className="btn btn-sm" onClick={() => run('doc.exchange_license', {})}>Exchange It Here</button>
            )}
          </>
        }
      >
        <div className="list">
          <DocumentLine doc={papers.license} none="You hold no driver’s license. Nothing with a wheel moves for you until you do; the scenes call a cab." />
          {exchange && <div className="list-item list-static"><div className="xs dim">{exchange.note}</div></div>}
        </div>
      </Panel>

      <p className="xs dim">{DOCUMENT_NOTE}</p>
    </div>
  );
}

/**
 * The whole span, on one page.
 *
 * How old you are, what part of a life that is, the size you are and the size
 * you end up, the people you were born to, and what the country you are
 * standing in will and will not let somebody your age do.
 *
 * There is deliberately nothing here about how long you have left. A
 * character does not know that, so the game does not say it.
 */
function LifeTab(): JSX.Element {
  const { sim } = useGame();
  // Everything below is read straight off the simulation, so the tab needs a
  // reason to re-render when the world clock moves.
  const now = useWorld((s) => s.now);
  const player = sim.player;
  void now;
  const stage = stageOf(sim);
  const family = familyOf(sim);
  const gates = gatesFor(sim);
  const pension = yearsToPension(sim);

  return (
    <div className="grid grid-sheet">
      <Panel title="Your Years" subtitle={stage.label}>
        <div className="col gap-4">
          <Stat label="Age" value={String(ageOf(sim))} note={stage.about} />
          <Stat label="Size" value={describeHeight(heightOf(sim))} note={describeWeight(weightOf(sim))} />
          {!fullyGrown(sim) && (
            <Stat
              label="Still Growing"
              value={describeHeight(adultHeightOf(player))}
              note={`The size you end up. ${describeWeight(adultWeightOf(player))}.`}
            />
          )}
          <Stat
            label="What A Year Costs Now"
            value={agingOf(sim).about}
            note={`Your best day is ${ceilingOf(sim).fitness.toFixed(0)} of 100 for fitness and `
              + `${ceilingOf(sim).condition.toFixed(0)} for condition.`}
          />
          <Stat
            label={pension > 0 ? 'Pension Age' : 'Past Pension Age'}
            value={String(pensionAgeFor(player))}
            note={pension > 0 ? `${plural(pension, 'year')} away. ${PENSION_NOTE}` : PENSION_NOTE}
          />
          <p className="xs dim" style={{ margin: 0 }}>{describeYears(sim)}</p>
          <p className="xs dim" style={{ margin: 0 }}>{LIFESPAN_NOTE}</p>
        </div>
      </Panel>

      <Panel title="Who You Were Born To" flush>
        {family.parents.length === 0 && family.siblings.length === 0 ? (
          <p className="xs dim" style={{ padding: 'var(--s3)' }}>Nobody on record.</p>
        ) : (
          <div className="list">
            {[...family.parents, ...family.siblings, ...family.children].map((one) => (
              <div key={one.id} className="list-item list-static">
                <div className="grow">
                  <div className="small strong">{one.displayName}</div>
                  <div className="xs dim">
                    {relationLabel(sim, one.id)} · {isAlive(one, sim.now)
                      ? `${plural(ageOf(sim, one), 'year')} old · ${CITIES.get(one.homeRegionId)?.name ?? 'Elsewhere'}`
                      : describePassing(sim, one)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <GrowingPanel />

      <JobPanel />

      <Panel title="What You Are Old Enough For" subtitle={COUNTRIES.get(gates[0]?.answer.countryId ?? '')?.name ?? ''} flush>
        <div className="list">
          {gates.map((one) => (
            <div key={one.gate} className="list-item list-static">
              <div className="grow">
                <div className="small strong">{one.label}</div>
                <div className="xs dim">
                  {one.answer.ok
                    ? (one.answer.age === undefined ? 'Open to you.' : `Open to you. Set at ${one.answer.age} here.`)
                    : one.answer.reason}
                </div>
              </div>
              <span className={`badge ${one.answer.ok ? 'badge-positive' : 'badge-quiet'}`}>
                {one.answer.ok ? 'Yes' : 'Not Yet'}
              </span>
            </div>
          ))}
        </div>
        <p className="xs dim" style={{ padding: 'var(--s3)', margin: 0 }}>{AGE_GATE_NOTE}</p>
      </Panel>
    </div>
  );
}

/**
 * Growing up, and learning to drive.
 *
 * The moments arrive in the Decision Center like anything else that needs
 * deciding; this is where they are read back afterwards, and where the
 * instructor is booked.
 */
function GrowingPanel(): JSX.Element | null {
  const { sim, run, toast } = useGame();
  const now = useWorld((s) => s.now);
  void now;
  const record = growingOf(sim);
  if (!record) return null;
  const lived = livedThrough(record);
  const waiting = pendingMoment(record);
  const ready = readyToDrive(sim, record);
  const canDrive = mayI(sim, 'drive');

  return (
    <>
      <Panel
        title="The Years So Far"
        subtitle={waiting ? `${waiting.title} is waiting on an answer.` : `${plural(lived.length, 'moment')} behind you.`}
        flush
      >
        {lived.length === 0 ? (
          <p className="xs dim" style={{ padding: 'var(--s3)' }}>
            Nothing yet. Things happen, and when they do they go where everything that needs deciding goes.
          </p>
        ) : (
          <div className="list">
            {[...lived].reverse().map((one) => (
              <div key={one.id} className="list-item list-static">
                <div className="grow">
                  <div className="small strong">{one.title}</div>
                  <div className="xs dim">{one.detail}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="xs dim" style={{ padding: 'var(--s3)', margin: 0 }}>{GROWING_NOTE}</p>
      </Panel>

      {record.pet && (
        <Panel
          title={record.pet.untilAt ? 'The One You Had' : record.pet.name}
          subtitle={record.pet.untilAt ? 'Not here any more.' : `${formatMoney(record.pet.aWeek)} a week.`}
        >
          <div className="col gap-2">
            <p className="small" style={{ margin: 0 }}>{describePet(sim, record)}</p>
            <p className="xs dim" style={{ margin: 0 }}>{PET_NOTE}</p>
          </div>
        </Panel>
      )}

      <Panel
        title="Learning To Drive"
        subtitle={record.passedTestAt
          ? `Passed on ${formatDate(record.passedTestAt, sim.homeZone)}.`
          : `${plural(record.lessons, 'hour')} in. ${plural(record.testsSat, 'test')} sat.`}
      >
        <div className="col gap-3">
          {record.passedTestAt ? (
            <p className="small" style={{ margin: 0 }}>
              You passed. The licence itself is a separate errand, at the counter.
            </p>
          ) : (
            <>
              <Meter label="Ready For It" value={ready} hint="Hours with an instructor, and what you can already do." />
              <p className="small" style={{ margin: 0 }}>
                {canDrive.ok
                  ? `An hour is ${formatMoney(lessonCost(sim))}. The test is ${formatMoney(testCost(sim))} and it can be failed.`
                  : canDrive.reason}
              </p>
              <div className="row gap-2 wrap">
                <button
                  className="btn btn-sm"
                  disabled={!canDrive.ok}
                  onClick={() => {
                    const res = run<{ note: string }>('growing.lesson', {});
                    if (res.ok) toast(res.value!.note, 'positive');
                  }}
                >
                  Book An Hour
                </button>
                <button
                  className="btn btn-sm btn-primary"
                  disabled={!canDrive.ok || record.lessons < 3}
                  onClick={() => {
                    const res = run<{ note: string; passed: boolean }>('growing.test', {});
                    if (res.ok) toast(res.value!.note, res.value!.passed ? 'positive' : 'negative');
                  }}
                >
                  Sit The Test
                </button>
              </div>
            </>
          )}
          <p className="xs dim" style={{ margin: 0 }}>{DRIVING_NOTE}</p>
          <p className="xs dim" style={{ margin: 0 }}>{ALLOWANCE_NOTE}</p>
        </div>
      </Panel>
    </>
  );
}

/**
 * The Saturday job.
 *
 * The floor is real and published; the rota and every shift are SLATE's own.
 * Where the city has a real shop of the right kind, that is where it is.
 */
function JobPanel(): JSX.Element | null {
  const { sim, run, toast } = useGame();
  const now = useWorld((s) => s.now);
  void now;
  const held = jobOf(sim);
  const past = jobsHeld(sim).filter((one) => one.endedAt).slice(0, 3);
  const openings = openingsFor(sim);
  const floor = floorHere(sim);
  const state = stateFloorNameFor(sim);
  const stateFloor = stateFloorFor(sim.player.currentLocationId);
  const allowed = mayI(sim, 'work');
  if (!held && openings.length === 0 && past.length === 0 && !allowed.ok && ageOf(sim) > 25) return null;

  return (
    <Panel
      title={held ? 'The Job' : 'A Job'}
      subtitle={state && stateFloor !== undefined
        ? `The floor in ${state} is ${formatMoney(stateFloor)} an hour.`
        : floor.statutory
          ? `The floor here is ${formatMoney(floor.perHour)} an hour, set in ${floor.year}.`
          : `No statutory minimum here. The bargained floor is about ${formatMoney(floor.perHour)} an hour.`}
    >
      <div className="col gap-3">
        {held ? (
          <>
            <p className="small" style={{ margin: 0 }}>{describeJob(sim, held)}</p>
            <div className="row gap-3 wrap">
              <Stat
                label="Where You Are"
                value={ROLE_BY_ID[held.roleId]?.label ?? 'Crew'}
                note={ROLE_BY_ID[held.roleId]?.about}
              />
              <Stat
                label="What They Think"
                value={String(Math.round(held.standing))}
                note={promotionFor(held).why}
                tone={held.standing >= 70 ? 'positive' : held.standing <= 30 ? 'negative' : undefined}
              />
            </div>

            {held.cover && (
              <p className="small" style={{ margin: 0 }}>
                <strong>They are ringing.</strong> {held.cover.reason} They want you in on{' '}
                {formatDate(held.cover.at, sim.homeZone)}. It is on your Home screen to answer.
              </p>
            )}

            <div className="row gap-3 wrap">
              <Stat
                label="On The Timesheet"
                value={formatMoney(held.owed)}
                note={held.nextPayAt
                  ? `${plural(held.owedHours, 'hour')}. Paid ${formatDate(held.nextPayAt, sim.homeZone)}.`
                  : `${plural(held.owedHours, 'hour')} not yet paid.`}
              />
              {held.payslips.length > 0 && (
                <Stat
                  label="Last Payslip"
                  value={formatMoney(held.payslips[held.payslips.length - 1]!.net)}
                  note={`${formatMoney(held.payslips[held.payslips.length - 1]!.gross)} gross, `
                    + `${formatMoney(held.payslips[held.payslips.length - 1]!.tax
                      + held.payslips[held.payslips.length - 1]!.social)} withheld.`}
                />
              )}
            </div>

            {shiftsToCome(held).length > 0 && (
              <div className="list">
                {shiftsToCome(held).slice(0, 6).map((shift, i) => (
                  <div key={`${shift.at}-${i}`} className="list-item list-static">
                    <div className="grow">
                      <div className="small strong">
                        {SHIFT_BY_ID[shift.kindId]?.label ?? 'A Shift'}
                        {shift.cover ? ' · Cover' : ''}
                      </div>
                      <div className="xs dim">
                        {formatDate(shift.at, sim.homeZone)} · {plural(shift.hours, 'hour')}
                        {' · '}{SHIFT_BY_ID[shift.kindId]?.about}
                      </div>
                    </div>
                    <span className="badge badge-quiet">
                      {sim.now >= shift.at - 2 * 60 * 60_000 ? 'On Now' : 'To Come'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="row gap-2 wrap">
              <button
                className="btn btn-sm btn-primary"
                disabled={!shiftIsDue(sim, held)}
                onClick={() => {
                  const res = run<{ note: string }>('job.shift', {});
                  if (res.ok) toast(res.value!.note, 'positive');
                }}
              >
                {shiftIsDue(sim, held) ? 'Work The Shift' : 'Not On Until Later'}
              </button>
              <button
                className="btn btn-sm"
                disabled={!shiftIsDue(sim, held)}
                onClick={() => {
                  const res = run<{ note: string; genuine: boolean }>('job.call_in_sick', {});
                  if (res.ok) toast(res.value!.note, res.value!.genuine ? 'neutral' : 'negative');
                }}
              >
                Ring In Sick
              </button>
              {promotionFor(held).ready && (
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    const res = run<{ note: string }>('job.take_promotion', {});
                    if (res.ok) toast(res.value!.note, 'positive');
                  }}
                >
                  Take {promotionFor(held).role!.label}
                </button>
              )}
              <button
                className="btn btn-sm"
                onClick={() => {
                  const res = run<{ note: string }>('job.quit', {});
                  if (res.ok) toast(res.value!.note, 'negative');
                }}
              >
                Hand Your Notice In
              </button>
            </div>
          </>
        ) : !allowed.ok ? (
          <p className="small" style={{ margin: 0 }}>{allowed.reason}</p>
        ) : (
          <>
            <p className="small" style={{ margin: 0 }}>
              {plural(openings.length, 'thing')} going, and none of them are a career.
            </p>
            <div className="list">
              {openings.map((one) => (
                <div key={one.id} className="list-item list-static">
                  <div className="grow">
                    <div className="small strong">{one.label}</div>
                    <div className="xs dim">{one.about}</div>
                    <div className="xs dim">
                      {formatMoney(wageFor(sim, one))} an hour · {plural(one.hours, 'hour')} a shift
                    </div>
                  </div>
                  <button
                    className="btn btn-sm"
                    onClick={() => {
                      const res = run<{ note: string }>('job.take', { kindId: one.id });
                      if (res.ok) toast(res.value!.note, 'positive');
                    }}
                  >
                    Take It
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {past.length > 0 && (
          <div className="list">
            {past.map((one) => (
              <div key={one.id} className="list-item list-static">
                <div className="grow">
                  <div className="xs dim">{describeJob(sim, one)}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="xs dim" style={{ margin: 0 }}>{WAGE_NOTE}</p>
        {!floor.statutory && <p className="xs dim" style={{ margin: 0 }}>{NO_MINIMUM_NOTE}</p>}
        <p className="xs dim" style={{ margin: 0 }}>{LOCAL_NOTE}</p>
        {state && <p className="xs dim" style={{ margin: 0 }}>{STATE_NOTE}</p>}
        <p className="xs dim" style={{ margin: 0 }}>{YOUNG_NOTE}</p>
        <p className="xs dim" style={{ margin: 0 }}>{JOB_NOTE}</p>
        <p className="xs dim" style={{ margin: 0 }}>{EMPLOYER_NOTE}</p>
        <p className="xs dim" style={{ margin: 0 }}>{BRANCH_NOTE}</p>
        <p className="xs dim" style={{ margin: 0 }}>{LADDER_NOTE}</p>
        <p className="xs dim" style={{ margin: 0 }}>{COVER_NOTE}</p>
        <p className="xs dim" style={{ margin: 0 }}>{PAYDAY_NOTE}</p>
        <p className="xs dim" style={{ margin: 0 }}>{SICK_NOTE}</p>
        <p className="xs dim" style={{ margin: 0 }}>{LETTING_GO_NOTE}</p>
      </div>
    </Panel>
  );
}
