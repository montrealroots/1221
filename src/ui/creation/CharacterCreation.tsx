/**
 * SLATE — character creation.
 *
 * Identity, Personal, Career, Starting Point, Review, then Start.
 * Progress is written to a draft on every change, so a closed tab or a dropped
 * connection never costs the setup.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Slot } from '@/engine/persistence/adapter';
import {
  defaultConfig, wealthNote, careerLabel,
  type NewSaveConfig, type StartingHousing, type StartingWealth,
} from '@/engine/world/bootstrap';
import { TRAITS, TRAIT_BY_ID, conflictingTraits, type TraitCategory } from '@/engine/domain/attributes';
import { LocationPicker } from './LocationPicker';
import { PortraitPicker } from './PortraitPicker';
import { CITIES, COUNTRIES, REGIONS, isCountryLoaded, loadCountryCities } from '@/engine/content/geography';
import type { City } from '@/engine/content/geography';
import type { CareerTrack, Personality } from '@/engine/domain/model';
import { formatMoney } from '@/engine/core/money';
import { APP_VERSION, WEALTH_PROFILES } from '@/engine/world/bootstrap';
import { SAVE_SCHEMA_VERSION } from '@/engine/domain/model';
import { titleCaseLabel } from '@/engine/core/text';

const STEPS = ['Identity', 'Personal', 'Career', 'Starting Point', 'Review'] as const;
type StepIndex = 0 | 1 | 2 | 3 | 4;

const MAX_TRAITS = 4;
const DRAFT_KEY = (slot: Slot) => `slate.draft.${slot}`;

const CAREER_TRACKS: { id: CareerTrack; blurb: string }[] = [
  { id: 'actor', blurb: 'Auditions, rooms, callbacks and the long climb from day player to lead.' },
  { id: 'writer', blurb: 'Pages, drafts, notes and selling something you made out of nothing.' },
  { id: 'director', blurb: 'Vision, a set of two hundred people, and whether the day gets made.' },
  { id: 'producer', blurb: 'Material, money, talent and the will to hold it all together.' },
  { id: 'showrunner', blurb: 'A room, a season, and a network with opinions.' },
  { id: 'crew', blurb: 'Below the line, where films are actually made.' },
  { id: 'executive', blurb: 'The slate, the market and the authority to say yes.' },
  { id: 'agent', blurb: 'Other people’s careers, and ten percent of them.' },
  { id: 'creator', blurb: 'Your own audience, your own schedule, your own risk.' },
  { id: 'civilian', blurb: 'An ordinary job and an ordinary life. Everything else stays possible.' },
];

const HOUSING: { id: StartingHousing; label: string; blurb: string }[] = [
  { id: 'couch', label: "A friend's couch", blurb: 'No home of your own. No rent, no privacy, no stability.' },
  { id: 'roommates', label: 'Room In A Share', blurb: 'Cheap, crowded, and how most people start.' },
  { id: 'rental', label: 'Your Own Rental', blurb: 'A lease, a deposit and somewhere that is yours.' },
  { id: 'owned', label: 'You Own A Home', blurb: 'A house and the mortgage that came with it.' },
];

const WEALTH: StartingWealth[] = ['nothing', 'scraping', 'modest', 'comfortable', 'wealthy', 'inherited'];

const PERSONALITY_AXES: { key: keyof Personality; label: string; low: string; high: string }[] = [
  { key: 'openness', label: 'Openness', low: 'Conventional', high: 'Experimental' },
  { key: 'conscientiousness', label: 'Conscientiousness', low: 'Loose', high: 'Meticulous' },
  { key: 'extraversion', label: 'Extraversion', low: 'Reserved', high: 'Outgoing' },
  { key: 'agreeableness', label: 'Agreeableness', low: 'Blunt', high: 'Accommodating' },
  { key: 'emotionalStability', label: 'Emotional Stability', low: 'Volatile', high: 'Steady' },
  { key: 'ambition', label: 'Ambition', low: 'Content', high: 'Driven' },
  { key: 'riskTolerance', label: 'Risk Tolerance', low: 'Cautious', high: 'Reckless' },
];

const INTEREST_OPTIONS = [
  'film', 'television', 'theatre', 'music', 'writing', 'photography', 'fashion',
  'cooking', 'travel', 'fitness', 'cars', 'design', 'history', 'technology',
  'sport', 'art', 'games', 'politics', 'nature', 'animals',
];

export function CharacterCreation({
  slot, onCancel, onStart,
}: {
  slot: Slot;
  onCancel: () => void;
  onStart: (config: NewSaveConfig) => void;
}) {
  const [step, setStep] = useState<StepIndex>(0);
  const [config, setConfig] = useState<NewSaveConfig>(() => loadDraft(slot) ?? defaultConfig());
  const [restored] = useState(() => loadDraft(slot) !== null);

  // Persist on every change. Losing the page must not lose the setup.
  useEffect(() => { saveDraft(slot, config); }, [slot, config]);

  // A restored draft can name towns too small to be bundled. Fetch the
  // countries they belong to so the names, and the validation, come back.
  const [, setResolved] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const wanted = new Set(
      [config.startLocationId, config.homeRegionId]
        .map(countryOfPlace)
        .filter((id): id is string => id !== undefined && !isCountryLoaded(id)),
    );
    if (wanted.size === 0) return;
    void Promise.all([...wanted].map((id) => loadCountryCities(id).catch(() => 0)))
      .then(() => { if (!cancelled) setResolved((n) => n + 1); });
    return () => { cancelled = true; };
  }, [config.startLocationId, config.homeRegionId]);

  const set = useCallback(<K extends keyof NewSaveConfig>(key: K, value: NewSaveConfig[K]) => {
    setConfig((c) => ({ ...c, [key]: value }));
  }, []);

  const issues = useMemo(() => validate(config, step), [config, step]);
  const canAdvance = issues.length === 0;

  // Continue was at the foot of the last step, so without this the next step
  // opens at its foot too, and the player reads it backwards.
  const scroller = useRef<HTMLDivElement | null>(null);
  useEffect(() => { scroller.current?.scrollTo({ top: 0 }); }, [step]);


  const start = () => {
    clearDraft(slot);
    onStart(config);
  };

  return (
    <div className="main" ref={scroller}>
      <div className="creation">
        <div className="row-between" style={{ marginBottom: 'var(--s5)' }}>
          <div className="row gap-2">
            <span role="img" aria-label="SLATE" style={{ fontSize: 22 }}>🎬</span>
            <div>
              <div className="eyebrow">Slot {slot}</div>
              <h1 style={{ fontSize: 'var(--size-lg)' }}>Who are you going to be?</h1>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
        </div>

        {restored && step === 0 && (
          <div className="callout callout-info" style={{ marginBottom: 'var(--s5)' }}>
            Your previous setup was still here, so it has been restored.
            <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'var(--s2)' }} onClick={() => setConfig(defaultConfig())}>
              Start over
            </button>
          </div>
        )}

        <div className="creation-steps" role="list">
          {STEPS.map((label, index) => (
            <div
              key={label}
              className="creation-step"
              role="listitem"
              data-state={index === step ? 'active' : index < step ? 'done' : 'waiting'}
            >
              {label}
            </div>
          ))}
        </div>

        {step === 0 && <IdentityStep config={config} set={set} />}
        {step === 1 && <PersonalStep config={config} set={set} setConfig={setConfig} />}
        {step === 2 && <CareerStep config={config} set={set} />}
        {step === 3 && <StartingPointStep config={config} set={set} />}
        {step === 4 && <ReviewStep config={config} />}

        {issues.length > 0 && (
          <div className="callout callout-warning" style={{ marginTop: 'var(--s5)' }}>
            <ul style={{ margin: 0, paddingLeft: 'var(--s4)' }}>
              {issues.map((issue) => <li key={issue} className="small">{issue}</li>)}
            </ul>
          </div>
        )}

        <div className="row-between" style={{ marginTop: 'var(--s6)' }}>
          <button
            className="btn"
            onClick={() => setStep((s) => Math.max(0, s - 1) as StepIndex)}
            disabled={step === 0}
          >
            Back
          </button>

          {step < 4 ? (
            <button
              className="btn btn-primary"
              onClick={() => setStep((s) => Math.min(4, s + 1) as StepIndex)}
              disabled={!canAdvance}
            >
              Continue
            </button>
          ) : (
            <button className="btn btn-primary btn-lg" onClick={start} disabled={!canAdvance}>
              It’s Time To Be Great
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

type Setter = <K extends keyof NewSaveConfig>(key: K, value: NewSaveConfig[K]) => void;

function IdentityStep({ config, set }: { config: NewSaveConfig; set: Setter }) {
  const home = CITIES.get(config.startLocationId);
  const birthplace = CITIES.get(config.homeRegionId);

  // Most people are from where they are, so that is the default and the
  // birthplace follows the home town until somebody says it should not. Once
  // they have said so it stays said, even if they later pick the same town.
  const [bornWhereTheyLive, setBornWhereTheyLive] = useState(
    () => config.homeRegionId === config.startLocationId,
  );

  return (
    <div className="card">
      <div className="panel-head">
        <div>
          <h2>Identity</h2>
          <p className="muted small">Your legal name is what appears on a contract. What the world calls you can be different.</p>
        </div>
      </div>

      <div className="identity-top">
        <PortraitPicker
          portrait={config.portrait}
          name={[config.firstName, config.lastName].filter(Boolean).join(' ')}
          onChange={(portrait) => set('portrait', portrait)}
        />

        <div className="identity-fields">
      <div className="field-row">
        <div className="field">
          <label htmlFor="first">First Name</label>
          <input id="first" type="text" value={config.firstName} onChange={(e) => set('firstName', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="middle">Middle Name (Optional)</label>
          <input id="middle" type="text" value={config.middleName ?? ''} onChange={(e) => set('middleName', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="last">Last Name</label>
          <input id="last" type="text" value={config.lastName} onChange={(e) => set('lastName', e.target.value)} />
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="display">Preferred Name</label>
          <input
            id="display" type="text"
            placeholder={`${config.firstName} ${config.lastName}`}
            value={config.displayName ?? ''}
            onChange={(e) => set('displayName', e.target.value)}
          />
          <p className="xs dim" style={{ marginTop: 4 }}>What people actually call you day to day.</p>
        </div>
        <div className="field">
          <label htmlFor="stage">Credit Name (Optional)</label>
          <input
            id="stage" type="text"
            placeholder="Leave blank to be credited under your own name"
            value={config.stageName ?? ''}
            onChange={(e) => set('stageName', e.target.value)}
          />
          <p className="xs dim" style={{ marginTop: 4 }}>How you are billed on screen.</p>
        </div>
        <div className="field">
          <label htmlFor="pronouns">Pronouns</label>
          <select id="pronouns" value={config.pronouns} onChange={(e) => set('pronouns', e.target.value)}>
            <option value="she/her">she/her</option>
            <option value="he/him">he/him</option>
            <option value="they/them">they/them</option>
          </select>
        </div>
      </div>
        </div>
      </div>

      <hr className="divider" />

      <div className="field-row">
        <div className="field">
          <label htmlFor="birth-year">Year Of Birth</label>
          <input
            id="birth-year" type="number" min={1940} max={config.startYear - 16}
            value={config.birthYear}
            onChange={(e) => set('birthYear', Number(e.target.value))}
          />
        </div>
        <div className="field">
          <label htmlFor="birth-month">Month</label>
          <select id="birth-month" value={config.birthMonth} onChange={(e) => set('birthMonth', Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="birth-day">Day</label>
          <input
            id="birth-day" type="number" min={1} max={31}
            value={config.birthDay}
            onChange={(e) => set('birthDay', Number(e.target.value))}
          />
        </div>
        <div className="field">
          <label htmlFor="citizenship">Citizenship</label>
          <select id="citizenship" value={config.citizenshipId} onChange={(e) => set('citizenshipId', e.target.value)}>
            {[...COUNTRIES.all()].sort((a, b) => a.name.localeCompare(b.name))
              .map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <p className="xs dim" style={{ marginTop: 4 }}>Affects where you can work without arrangement.</p>
        </div>
      </div>

      <hr className="divider" />

      <div className="panel-head">
        <div>
          <h3>Where You Live</h3>
          <p className="muted small">
            Where you are decides your taxes, your rent, your job market and how much industry work is
            within reach. Picking a country here sets your citizenship to match — change it above if you
            live somewhere you are not a citizen of.
          </p>
        </div>
      </div>

      <LocationPicker
        idPrefix="live"
        cityId={config.startLocationId}
        onPick={(picked) => {
          const previous = CITIES.get(config.startLocationId);
          set('startLocationId', picked.id);
          // Somebody who has not said otherwise was born where they live.
          if (bornWhereTheyLive) set('homeRegionId', picked.id);
          // Citizenship follows the country while the two agree. Once somebody
          // has deliberately made them differ, moving no longer overwrites it.
          if (!previous || config.citizenshipId === previous.countryId) {
            set('citizenshipId', picked.countryId);
          }
        }}
      />

      <hr className="divider" />

      <div className="panel-head">
        <div>
          <h3>Place Of Birth</h3>
          <p className="muted small">
            Where you are from, which is not always where you ended up. It is what you say when
            somebody asks, it is the town your family is still in, and it is the accent you had
            to lose or decided to keep.
          </p>
        </div>
      </div>

      <label className="check" htmlFor="born-here">
        <input
          id="born-here"
          type="checkbox"
          checked={bornWhereTheyLive}
          onChange={(e) => {
            setBornWhereTheyLive(e.target.checked);
            if (e.target.checked) set('homeRegionId', config.startLocationId);
          }}
        />
        <span>
          I Was Born Where I Live Now
          {home && <span className="dim"> — {placeLine(home)}</span>}
        </span>
      </label>

      {!bornWhereTheyLive && (
        <LocationPicker
          idPrefix="born"
          cityId={config.homeRegionId}
          onPick={(picked) => set('homeRegionId', picked.id)}
        />
      )}

      {!bornWhereTheyLive && birthplace && (
        <div className="callout">
          From <strong>{placeLine(birthplace)}</strong>
          {home && birthplace.countryId !== home.countryId && (
            <> · You moved country to get where you are, which is its own kind of start.</>
          )}
        </div>
      )}

      <div className="callout">
        You will be <strong>{config.startYear - config.birthYear}</strong> when the save begins.
      </div>
    </div>
  );
}

/** A place written the way somebody would say it out loud. */
function placeLine(city: City): string {
  const region = REGIONS.get(city.parentId)?.name;
  const country = COUNTRIES.get(city.countryId)?.name;
  return [city.name, region, region === country ? undefined : country]
    .filter(Boolean).join(', ');
}

function PersonalStep({
  config, set, setConfig,
}: {
  config: NewSaveConfig;
  set: Setter;
  setConfig: React.Dispatch<React.SetStateAction<NewSaveConfig>>;
}) {
  const grouped = useMemo(() => {
    const map = new Map<TraitCategory, typeof TRAITS[number][]>();
    for (const trait of TRAITS) {
      if (trait.earnable && !['controversial', 'beloved', 'polarizing'].includes(trait.id)) continue;
      const list = map.get(trait.category) ?? [];
      list.push(trait);
      map.set(trait.category, list);
    }
    return [...map.entries()];
  }, []);

  const toggleTrait = (id: string) => {
    setConfig((c) => {
      if (c.traits.includes(id)) return { ...c, traits: c.traits.filter((t) => t !== id) };
      if (c.traits.length >= MAX_TRAITS) return c;
      if (conflictingTraits(c.traits, id).length > 0) return c;
      return { ...c, traits: [...c.traits, id] };
    });
  };

  const toggleInterest = (interest: string) => {
    setConfig((c) => ({
      ...c,
      interests: c.interests.includes(interest)
        ? c.interests.filter((i) => i !== interest)
        : [...c.interests, interest].slice(0, 6),
    }));
  };

  return (
    <div className="col gap-5">
      <div className="card">
        <div className="panel-head">
          <div>
            <h2>Personality</h2>
            <p className="muted small">
              These are dispositions, not stats. They shape how people respond to you, how you hold up under pressure, and what you tend to choose.
            </p>
          </div>
        </div>
        {PERSONALITY_AXES.map((axis) => (
          <div key={axis.key} className="field">
            <div className="row-between">
              <label htmlFor={`p-${axis.key}`} style={{ marginBottom: 0 }}>{axis.label}</label>
              <span className="mono small">{config.personality[axis.key]}</span>
            </div>
            <input
              id={`p-${axis.key}`} type="range" min={5} max={95}
              value={config.personality[axis.key]}
              onChange={(e) => setConfig((c) => ({
                ...c,
                personality: { ...c.personality, [axis.key]: Number(e.target.value) },
              }))}
            />
            <div className="row-between xs dim">
              <span>{axis.low}</span><span>{axis.high}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="panel-head">
          <div>
            <h2>Traits</h2>
            <p className="muted small">
              Pick up to {MAX_TRAITS}. Traits change how systems behave rather than adding points, and some cannot be held together.
            </p>
          </div>
          <span className="chip chip-accent">{config.traits.length} / {MAX_TRAITS}</span>
        </div>

        {grouped.map(([category, traits]) => (
          <div key={category} style={{ marginBottom: 'var(--s4)' }}>
            <div className="eyebrow" style={{ marginBottom: 'var(--s2)' }}>{category}</div>
            <div className="trait-grid">
              {traits.map((trait) => {
                const selected = config.traits.includes(trait.id);
                const conflicts = conflictingTraits(config.traits, trait.id);
                const blocked = !selected && (conflicts.length > 0 || config.traits.length >= MAX_TRAITS);
                return (
                  <button
                    key={trait.id}
                    className="trait"
                    aria-pressed={selected}
                    disabled={blocked}
                    onClick={() => toggleTrait(trait.id)}
                    title={conflicts.length > 0
                      ? `Cannot be held with ${conflicts.map((c) => TRAIT_BY_ID[c]?.name).join(', ')}.`
                      : undefined}
                  >
                    <div className="trait-name">{trait.name}</div>
                    <div className="trait-desc">{trait.description}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="panel-head">
          <div>
            <h2>Interests And Background</h2>
            <p className="muted small">Interests affect who you get on with and what you enjoy doing with your time.</p>
          </div>
        </div>
        <div className="row wrap gap-2" style={{ marginBottom: 'var(--s4)' }}>
          {INTEREST_OPTIONS.map((interest) => (
            <button
              key={interest}
              className="chip"
              style={config.interests.includes(interest)
                ? { background: 'var(--accent-dim)', color: 'var(--accent-strong)', borderColor: 'var(--accent-line)' }
                : undefined}
              aria-pressed={config.interests.includes(interest)}
              onClick={() => toggleInterest(interest)}
            >
              {titleCaseLabel(interest)}
            </button>
          ))}
        </div>
        <div className="field">
          <label htmlFor="background">Where You Come From</label>
          <textarea
            id="background" value={config.background}
            onChange={(e) => set('background', e.target.value)}
            placeholder="A sentence about the life before this one."
          />
        </div>
        <div className="field">
          <label htmlFor="lifestyle">Lifestyle</label>
          <select id="lifestyle" value={config.lifestyle} onChange={(e) => set('lifestyle', e.target.value as NewSaveConfig['lifestyle'])}>
            <option value="frugal">Frugal — you keep what you earn</option>
            <option value="modest">Modest — comfortable, not showy</option>
            <option value="comfortable">Comfortable — you spend on quality</option>
            <option value="lavish">Lavish — you spend like it will keep coming</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function CareerStep({ config, set }: { config: NewSaveConfig; set: Setter }) {
  return (
    <div className="card">
      <div className="panel-head">
        <div>
          <h2>Career</h2>
          <p className="muted small">
            This is where you start, not where you have to stay. Every path in SLATE remains open from every other one.
          </p>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 'var(--s5)' }}>
        {CAREER_TRACKS.map((track) => (
          <button
            key={track.id}
            className="trait"
            aria-pressed={config.careerTrack === track.id}
            onClick={() => set('careerTrack', track.id)}
          >
            <div className="trait-name">{careerLabel(track.id)}</div>
            <div className="trait-desc">{track.blurb}</div>
          </button>
        ))}
      </div>

      <div className="field">
        <div className="row-between">
          <label htmlFor="stage" style={{ marginBottom: 0 }}>How far along are you?</label>
          <span className="mono small">{config.careerStage}</span>
        </div>
        <input
          id="stage" type="range" min={0} max={85}
          value={config.careerStage}
          onChange={(e) => set('careerStage', Number(e.target.value))}
        />
        <div className="row-between xs dim">
          <span>Nobody knows your name</span>
          <span>Already established</span>
        </div>
      </div>

      <div className="callout callout-accent">
        {config.careerStage < 10 && 'Complete unknown. Everything has to be earned, and the story is better for it.'}
        {config.careerStage >= 10 && config.careerStage < 35 && 'You have done a little. A few credits, some contacts, no leverage yet.'}
        {config.careerStage >= 35 && config.careerStage < 60 && 'A working professional. People return your calls and you have a quote.'}
        {config.careerStage >= 60 && 'Established. Doors open, and the expectations that come with that are real.'}
      </div>
    </div>
  );
}

function StartingPointStep({ config, set }: { config: NewSaveConfig; set: Setter }) {
  const city = CITIES.get(config.startLocationId);
  const wealth = WEALTH_PROFILES[config.wealth];

  return (
    <div className="col gap-5">
      <div className="card">
        <div className="panel-head">
          <div>
            <h2>Where You Start</h2>
            <p className="muted small">
              {city
                ? `${city.name}, chosen on Identity. This is what living there costs and offers.`
                : 'Choose somewhere to live on the Identity step.'}
            </p>
          </div>
        </div>

        {city && (
          <div className="grid grid-4">
            <div className="stat">
              <span className="stat-label">Industry presence</span>
              <span className="stat-value">{city.industryPresence}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Job market</span>
              <span className="stat-value">{city.jobMarketDepth}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Median rent</span>
              <span className="stat-value">{formatMoney(city.medianRentCents, { cents: false })}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Cost of living</span>
              <span className="stat-value">{city.costOfLivingIndex}</span>
            </div>
          </div>
        )}
        {city && (
          <p className="muted small" style={{ marginTop: 'var(--s3)' }}>
            {city.tags.join(' · ')}
          </p>
        )}
      </div>

      <div className="card">
        <div className="panel-head"><h2>Housing</h2></div>
        <div className="grid grid-2">
          {HOUSING.map((option) => (
            <button
              key={option.id}
              className="trait"
              aria-pressed={config.housing === option.id}
              onClick={() => set('housing', option.id)}
            >
              <div className="trait-name">{option.label}</div>
              <div className="trait-desc">{option.blurb}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="panel-head"><h2>Money</h2></div>
        <div className="field">
          <label htmlFor="wealth">What You Are Starting With</label>
          <select id="wealth" value={config.wealth} onChange={(e) => set('wealth', e.target.value as StartingWealth)}>
            {WEALTH.map((w) => <option key={w} value={w}>{w.charAt(0).toUpperCase() + w.slice(1)}</option>)}
          </select>
        </div>
        <div className="callout">{wealthNote(config.wealth)}</div>
        <div className="grid grid-3" style={{ marginTop: 'var(--s4)' }}>
          <div className="stat">
            <span className="stat-label">Checking</span>
            <span className="stat-value mono">{formatMoney(wealth.checking, { cents: false })}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Savings</span>
            <span className="stat-value mono">{formatMoney(wealth.savings, { cents: false })}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Credit score</span>
            <span className="stat-value mono">{wealth.creditScore}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="panel-head"><h2>Starting Situation</h2></div>
        <div className="col gap-3">
          <label className="row gap-2" style={{ marginBottom: 0 }}>
            <input
              type="checkbox" checked={config.startWithJob} style={{ width: 'auto' }}
              onChange={(e) => set('startWithJob', e.target.checked)}
            />
            <span className="small" style={{ color: 'var(--text)' }}>Start With A Job</span>
          </label>
          <label className="row gap-2" style={{ marginBottom: 0 }}>
            <input
              type="checkbox" checked={config.startWithVehicle} style={{ width: 'auto' }}
              onChange={(e) => set('startWithVehicle', e.target.checked)}
            />
            <span className="small" style={{ color: 'var(--text)' }}>Start With A Car</span>
          </label>
        </div>

        <hr className="divider" />

        <div className={`sandbox-choice${config.sandbox ? ' is-on' : ''}`}>
          <label className="row gap-3" style={{ marginBottom: 0, alignItems: 'flex-start' }}>
            <input
              type="checkbox" checked={config.sandbox} style={{ width: 'auto', marginTop: '3px' }}
              onChange={(e) => set('sandbox', e.target.checked)}
            />
            <span className="col gap-1">
              <span className="sandbox-choice-title">Sandbox Mode</span>
              <span className="small muted">
                Turn the rules off from the first minute. Sandbox lets you add money, max every
                attribute, grant every trait and greenlight anything, whatever your character has
                actually earned. Every sandbox action is written into the save's log, so the game
                stays honest about what it is. You can switch it on or off later in Settings —
                but a save that had it from the start says so.
              </span>
            </span>
          </label>
        </div>

        <hr className="divider" />

        <div className="field-row">
          <div className="field">
            <label htmlFor="start-year">Start Year</label>
            <input
              id="start-year" type="number" min={2000} max={2100}
              value={config.startYear} onChange={(e) => set('startYear', Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label htmlFor="start-month">Month</label>
            <select id="start-month" value={config.startMonth} onChange={(e) => set('startMonth', Number(e.target.value))}>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="start-day">Day</label>
            <input
              id="start-day" type="number" min={1} max={28}
              value={config.startDay} onChange={(e) => set('startDay', Number(e.target.value))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewStep({ config }: { config: NewSaveConfig }) {
  const city = CITIES.get(config.startLocationId);
  const birthplace = CITIES.get(config.homeRegionId);
  const age = config.startYear - config.birthYear;
  const wealth = WEALTH_PROFILES[config.wealth];

  return (
    <div className="col gap-5">
      <div className="card">
        <div className="center" style={{ padding: 'var(--s4) 0' }}>
          <div className="eyebrow">Slot ready</div>
          <h1 style={{ fontSize: 'var(--size-2xl)', margin: 'var(--s2) 0' }}>
            {config.displayName?.trim() || `${config.firstName} ${config.lastName}`}
          </h1>
          <p className="muted">
            {age} · {careerLabel(config.careerTrack)} · {city?.name}
          </p>
          {config.stageName && (
            <p className="small dim">Credited as {config.stageName}</p>
          )}
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="eyebrow" style={{ marginBottom: 'var(--s3)' }}>Identity</div>
          {config.portrait && (
            <img
              className="headshot headshot-md"
              src={config.portrait}
              alt={`Headshot for ${config.firstName} ${config.lastName}`}
              style={{ marginBottom: 'var(--s3)' }}
            />
          )}
          <Line label="Legal Name" value={[config.firstName, config.middleName, config.lastName].filter(Boolean).join(' ')} />
          <Line label="Pronouns" value={config.pronouns} />
          <Line label="Born" value={`${MONTHS[config.birthMonth - 1]} ${config.birthDay}, ${config.birthYear}`} />
          <Line label="Place Of Birth" value={birthplace ? placeLine(birthplace) : '—'} />
          <Line label="Citizenship" value={COUNTRIES.get(config.citizenshipId)?.name ?? '—'} />
        </div>

        <div className="card">
          <div className="eyebrow" style={{ marginBottom: 'var(--s3)' }}>Starting point</div>
          <Line label="City" value={city?.name ?? '—'} />
          <Line label="Housing" value={HOUSING.find((h) => h.id === config.housing)?.label ?? '—'} />
          <Line label="Checking" value={formatMoney(wealth.checking, { cents: false })} />
          <Line label="Savings" value={formatMoney(wealth.savings, { cents: false })} />
          <Line label="Credit Score" value={String(wealth.creditScore)} />
          <Line label="Job" value={config.startWithJob ? 'Yes' : 'Not yet'} />
          <Line label="Car" value={config.startWithVehicle ? 'Yes' : 'No'} />
          <Line label="Sandbox" value={config.sandbox ? 'On from the first minute' : 'Off'} />
        </div>
      </div>

      <div className="card">
        <div className="eyebrow" style={{ marginBottom: 'var(--s3)' }}>Traits</div>
        {config.traits.length === 0 ? (
          <p className="muted small">No traits. A blank slate, which is its own kind of advantage.</p>
        ) : (
          <div className="col gap-2">
            {config.traits.map((id) => {
              const trait = TRAIT_BY_ID[id];
              if (!trait) return null;
              return (
                <div key={id}>
                  <div className="strong small">{trait.name}</div>
                  <div className="xs muted">{trait.description}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="callout callout-accent">
        Once this save begins, the world starts running. Time passes, bills arrive, and the people in it
        get on with their own lives whether you are watching or not.
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="row-between" style={{ padding: '3px 0' }}>
      <span className="small muted">{label}</span>
      <span className="small strong">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function validate(config: NewSaveConfig, step: StepIndex): string[] {
  const issues: string[] = [];
  if (step === 0) {
    if (!config.firstName.trim()) issues.push('A first name is needed.');
    if (!config.lastName.trim()) issues.push('A last name is needed.');
    const age = config.startYear - config.birthYear;
    if (age < 16) issues.push('Your character has to be at least 16 when the save begins.');
    if (age > 95) issues.push('That start date would make your character over 95.');
    if (config.birthDay < 1 || config.birthDay > 31) issues.push('That is not a valid day of the month.');
    if (!CITIES.get(config.startLocationId)) issues.push('Choose the town or city you live in.');
    if (!CITIES.get(config.homeRegionId)) issues.push('Choose the town or city you were born in.');
  }
  if (step === 3) {
    if (!CITIES.get(config.startLocationId)) issues.push('Choose a city to start in.');
    if (config.startDay < 1 || config.startDay > 28) issues.push('Pick a start day between 1 and 28.');
  }
  return issues;
}

/**
 * The build a draft was written by.
 *
 * A half-filled form is a convenience, not a save, and it must never outrank
 * the game it is being filled in for. An unstamped draft written before an
 * update was merged straight over the current defaults, so a brand new save
 * silently came out with the old build's settings and none of the update in
 * it. Drafts now carry the build they came from and are discarded when it
 * moves on.
 */
const DRAFT_BUILD = `${APP_VERSION}/${SAVE_SCHEMA_VERSION}`;

interface StoredDraft {
  build: string;
  config: NewSaveConfig;
}

function loadDraft(slot: Slot): NewSaveConfig | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY(slot));
    if (!raw) return null;
    const stored = JSON.parse(raw) as Partial<StoredDraft>;

    // Written by an older build, or by one that predates the stamp entirely.
    if (stored?.build !== DRAFT_BUILD || !stored.config) {
      localStorage.removeItem(DRAFT_KEY(slot));
      return null;
    }

    const merged = { ...defaultConfig(), ...stored.config };

    // A town small enough not to be bundled is not resolvable until its
    // country has been fetched, which has not happened yet on a cold start.
    // Losing the whole draft over that threw away a filled-in form because
    // somebody was from a village, so the id is kept whenever the country it
    // names is real, and CharacterCreation pulls that country in. An id whose
    // country does not exist is a lost cause and falls back.
    if (!countryOfPlace(merged.startLocationId)) {
      merged.startLocationId = defaultConfig().startLocationId;
    }
    if (!countryOfPlace(merged.homeRegionId)) merged.homeRegionId = merged.startLocationId;
    if (!COUNTRIES.get(merged.citizenshipId)) merged.citizenshipId = defaultConfig().citizenshipId;

    return merged;
  } catch {
    return null;
  }
}

/** The country a place id belongs to, or nothing if it names no real country. */
function countryOfPlace(placeId: string): string | undefined {
  const code = placeId.split('-')[0];
  return code && COUNTRIES.get(code) ? code : undefined;
}

function saveDraft(slot: Slot, config: NewSaveConfig): void {
  try {
    const stored: StoredDraft = { build: DRAFT_BUILD, config };
    localStorage.setItem(DRAFT_KEY(slot), JSON.stringify(stored));
  } catch {
    /* storage full or unavailable; the draft is a convenience */
  }
}

function clearDraft(slot: Slot): void {
  try {
    localStorage.removeItem(DRAFT_KEY(slot));
  } catch {
    /* nothing to do */
  }
}
