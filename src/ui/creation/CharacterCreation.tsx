/**
 * SLATE — character creation.
 *
 * Identity, Personal, Your Craft, Starting Point, Review, then Start.
 * Progress is written to a draft on every change, so a closed tab or a dropped
 * connection never costs the setup.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Slot } from '@/engine/persistence/adapter';
import {
  defaultConfig, wealthNote,
  type NewSaveConfig, type StartingHousing, type StartingWealth,
} from '@/engine/world/bootstrap';
import { PERFORMER_NOUN, PERFORMER_TITLES, type PerformerTitle } from '@/engine/core/performer';
import { LocationPicker } from './LocationPicker';
import { PortraitPicker } from './PortraitPicker';
import { CITIES, COUNTRIES, REGIONS, isCountryLoaded, loadCountryCities } from '@/engine/content/geography';
import type { City } from '@/engine/content/geography';
import type { Personality } from '@/engine/domain/model';
import { formatMoney } from '@/engine/core/money';
import {
  APP_VERSION, WEALTH_PROFILES,
} from '@/engine/world/bootstrap';
import { SAVE_SCHEMA_VERSION } from '@/engine/domain/model';
import { titleCaseLabel } from '@/engine/core/text';
import { ageOnDate } from '@/engine/core/time';
import { citizenshipLabel, isCitizenOf } from '@/engine/domain/citizenship';
import { CEILING, DISCIPLINES, DISCIPLINE_LABEL, GOAT_LABEL, GOAT_TRAITS, goatTraitsIn } from '@/engine/content/prodigy';
import {
  MAX_PERSONALITY_TRAITS, PERSONALITY_GROUPS, PERSONALITY_TRAIT_BY_ID,
  conflictingPersonalityTraits, personalityTraitsIn,
} from '@/engine/content/personality-traits';
import { ALL_TRAITS, ATTRIBUTES } from '@/engine/domain/attributes';
import {
  ETHNICITIES, ETHNICITY_NOTE, ETHNICITY_OTHER, describeEthnicity,
} from '@/engine/content/ethnicity';

/**
 * How far back the last year a character can be born in sits from the year
 * the save begins.
 *
 * The line is drawn on the year, not on the age. A birthday later in the year
 * than the start date leaves somebody seventeen when the save opens, and that
 * is fine: the picker and the rule say the same thing, which is that 2008 is
 * as recent as a birth year gets against a save that begins in 2026.
 */
export const BIRTH_YEARS_BEFORE_START = 18;

/** The last year somebody can be born in and still start this save. */
export function latestBirthYear(startYear: number): number {
  return startYear - BIRTH_YEARS_BEFORE_START;
}

const STEPS = ['Identity', 'Personal', 'Your Craft', 'Starting Point', 'Review'] as const;
type StepIndex = 0 | 1 | 2 | 3 | 4;

const DRAFT_KEY = (slot: Slot) => `slate.draft.${slot}`;


const HOUSING: { id: StartingHousing; label: string; blurb: string }[] = [
  { id: 'couch', label: "A Friend's Couch", blurb: 'No home of your own. No rent, no privacy, no stability.' },
  { id: 'roommates', label: 'Room In A Share', blurb: 'Cheap, crowded, and how most people start.' },
  { id: 'rental', label: 'Your Own Rental', blurb: 'A lease, a deposit and somewhere that’s yours.' },
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
  // opens at its foot too, and the player reads it backwards. Which ancestor
  // actually scrolls differs by layout — the body here, .main in the game —
  // so the top of the form is asked into view rather than any one container.
  const top = useRef<HTMLDivElement | null>(null);
  useEffect(() => { top.current?.scrollIntoView({ block: 'start' }); }, [step]);


  const start = () => {
    clearDraft(slot);
    onStart(config);
  };

  return (
    <div className="main" ref={top}>
      <div className="creation">
        <div className="row-between" style={{ marginBottom: 'var(--s5)' }}>
          <div className="row gap-2">
            <span role="img" aria-label="SLATE" style={{ fontSize: 22 }}>🎬</span>
            <div>
              <div className="eyebrow">Slot {slot}</div>
              <h1 style={{ fontSize: 'var(--size-lg)' }}>Who Are You Going To Be?</h1>
              <p className="muted small" style={{ marginTop: 2 }}>
                SLATE is an actor and actress life simulator. This is the{' '}
                {billedAs(config).toLowerCase()} you play.
              </p>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
        </div>

        {restored && step === 0 && (
          <div className="callout callout-info" style={{ marginBottom: 'var(--s5)' }}>
            Your previous setup was still here, so it has been restored.
            <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'var(--s2)' }} onClick={() => setConfig(defaultConfig())}>
              Start Over
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

        {step === 0 && <IdentityStep config={config} set={set} setConfig={setConfig} />}
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

/**
 * How old they are on the morning the save starts.
 *
 * Through the engine's own definition rather than subtracting years, which
 * was out by one for anybody whose birthday falls after the start date.
 */
function ageAtStart(config: NewSaveConfig): number {
  return ageOnDate(
    { year: config.birthYear, month: config.birthMonth, day: config.birthDay },
    { year: config.startYear, month: config.startMonth, day: config.startDay },
  );
}

/**
 * The title a set of pronouns settles by itself, or undefined when it is the
 * player's to make.
 *
 * He and she each name one of the two words and there is nothing left to
 * choose. They/them names neither, so the choice opens up — and it opens up
 * empty, because preselecting one of two equals is what a default is, and
 * this game holds that neither of them is.
 */
export function settledTitle(pronouns: string): PerformerTitle | undefined {
  if (/^\s*he\b/i.test(pronouns)) return 'actor';
  if (/^\s*she\b/i.test(pronouns)) return 'actress';
  return undefined;
}

/**
 * The word this character is billed with: settled by their pronouns where
 * their pronouns settle it, and otherwise the one they picked. Undefined only
 * while somebody on they/them has not picked yet, which the Identity step
 * will not let past.
 */
function titleOf(config: NewSaveConfig): PerformerTitle | undefined {
  return settledTitle(config.pronouns) ?? config.performerTitle;
}

/** The same, for the places downstream of a step that has already checked it. */
function billedAs(config: NewSaveConfig): string {
  const title = titleOf(config);
  return title ? PERFORMER_NOUN[title] : 'Actor Or Actress';
}

type Setter = <K extends keyof NewSaveConfig>(key: K, value: NewSaveConfig[K]) => void;

function IdentityStep({ config, set, setConfig }: {
  config: NewSaveConfig;
  set: Setter;
  setConfig: React.Dispatch<React.SetStateAction<NewSaveConfig>>;
}) {
  const home = CITIES.get(config.startLocationId);
  const birthplace = CITIES.get(config.homeRegionId);
  // Whether they hold a passport for the country they actually live in. When
  // they do not, the second-citizenship field is the one that matters.
  const homeCountryId = home?.countryId;
  const citizenOfHome = homeCountryId !== undefined
    && isCitizenOf({ citizenshipId: config.citizenshipId, secondCitizenshipId: config.secondCitizenshipId }, homeCountryId);

  // Most people still live where they are from, so that is the default and
  // the home town follows the birthplace until somebody says it should not.
  // Once they have said so it stays said, even if they later pick the same
  // town.
  const settled = settledTitle(config.pronouns);

  const [stillLivesThere, setStillLivesThere] = useState(
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
          <p className="xs dim" style={{ marginTop: 4 }}>The name your work is credited under, if it isn’t your own.</p>
        </div>
        <div className="field">
          <label htmlFor="pronouns">Pronouns</label>
          <select
            id="pronouns"
            value={config.pronouns}
            onChange={(e) => {
              const pronouns = e.target.value;
              // The title is written into the config, not worked out from it
              // when the save is made, so it has to move with the pronouns:
              // settled where they settle it, and cleared where they do not,
              // so a pick made under they/them cannot survive behind he/him.
              setConfig((c) => ({ ...c, pronouns, performerTitle: settledTitle(pronouns) }));
            }}
          >
            <option value="she/her">She/Her</option>
            <option value="he/him">He/Him</option>
            <option value="they/them">They/Them</option>
          </select>
        </div>
        <div className="field">
          <span className="label">Billed As</span>
          {settled ? (
            <>
              <output className="settled-title" htmlFor="pronouns">{PERFORMER_NOUN[settled]}</output>
              <p className="xs dim" style={{ marginTop: 4 }}>
                Your pronouns say which of the two words is yours, so there is nothing to pick.
                Change them and this changes with them.
              </p>
            </>
          ) : (
            <>
              <div className="row gap-2" role="group" aria-label="Billed As">
                {PERFORMER_TITLES.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className="trait grow"
                    aria-pressed={config.performerTitle === option}
                    onClick={() => set('performerTitle', option)}
                  >
                    <div className="trait-name">{PERFORMER_NOUN[option]}</div>
                  </button>
                ))}
              </div>
              <p className="xs dim" style={{ marginTop: 4 }}>
                They/them settles neither word, so this one is yours. Actor and actress are two
                names for the same craft and this game holds them equal: pick the one the
                business would list you under, and the game will call you by it.
              </p>
            </>
          )}
        </div>
      </div>
        </div>
      </div>

      <hr className="divider" />

      <div className="field">
        <span className="label">Race Or Ethnicity (Optional)</span>
        <div className="trait-grid" role="group" aria-label="Race Or Ethnicity">
          {ETHNICITIES.map((one) => {
            const on = config.raceEthnicity.includes(one.id);
            return (
              <button
                key={one.id}
                type="button"
                className="trait"
                aria-pressed={on}
                onClick={() => set(
                  'raceEthnicity',
                  on
                    ? config.raceEthnicity.filter((id) => id !== one.id)
                    : [...config.raceEthnicity, one.id],
                )}
              >
                <div className="trait-name">{one.label}</div>
              </button>
            );
          })}
        </div>
        {config.raceEthnicity.includes(ETHNICITY_OTHER) && (
          <div className="field" style={{ marginTop: 'var(--s3)' }}>
            <label htmlFor="ethnicity-own">In Your Own Words</label>
            <input
              id="ethnicity-own" type="text"
              placeholder="However you would say it"
              value={config.raceEthnicityOwn ?? ''}
              onChange={(e) => set('raceEthnicityOwn', e.target.value)}
            />
          </div>
        )}
        <p className="xs dim" style={{ marginTop: 'var(--s2)' }}>{ETHNICITY_NOTE}</p>
      </div>

      <hr className="divider" />

      <div className="field-row">
        <div className="field">
          <label htmlFor="birth-year">Year Of Birth</label>
          <input
            id="birth-year" type="number" min={1940} max={latestBirthYear(config.startYear)}
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
              .map((c) => <option key={c.id} value={c.id} data-source="gazetteer">{c.name}</option>)}
          </select>
          <p className="xs dim" style={{ marginTop: 4 }}>
            You can take work in a country you hold a passport for. Anywhere else needs an arrangement.
          </p>
        </div>
        <div className="field">
          <label htmlFor="citizenship-second">Second Citizenship (Optional)</label>
          <select
            id="citizenship-second"
            value={config.secondCitizenshipId ?? ''}
            onChange={(e) => set('secondCitizenshipId', e.target.value || undefined)}
          >
            <option value="">None</option>
            {[...COUNTRIES.all()]
              .filter((c) => c.id !== config.citizenshipId)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((c) => <option key={c.id} value={c.id} data-source="gazetteer">{c.name}</option>)}
          </select>
          <p className="xs dim" style={{ marginTop: 4 }}>
            {homeCountryId && !citizenOfHome
              ? `You live in ${COUNTRIES.get(homeCountryId)?.name ?? 'somewhere'} and aren’t a citizen of it. Naturalised there? Say so here.`
              : 'Born in one country, naturalised in another, and you carry both.'}
          </p>
        </div>
      </div>

      <hr className="divider" />

      <div className="panel-head">
        <div>
          <h3>Place Of Birth</h3>
          <p className="muted small">
            Where you are from, which isn’t always where you ended up. It’s what you say when
            somebody asks, it’s the town your family is still in, and it’s the accent you had
            to lose or decided to keep.
          </p>
        </div>
      </div>

      <LocationPicker
        idPrefix="born"
        cityId={config.homeRegionId}
        onPick={(picked) => {
          set('homeRegionId', picked.id);
          // Somebody who has not said otherwise still lives where they are from.
          if (stillLivesThere) {
            const previous = CITIES.get(config.startLocationId);
            set('startLocationId', picked.id);
            if (!previous || config.citizenshipId === previous.countryId) {
              set('citizenshipId', picked.countryId);
            }
          }
        }}
      />

      <hr className="divider" />

      <div className="panel-head">
        <div>
          <h3>Where You Live</h3>
          <p className="muted small">
            Where you are decides your taxes, your rent, your job market and how much industry work is
            within reach. Picking a country here sets your citizenship to match — change it above if you
            live somewhere you aren’t a citizen of.
          </p>
        </div>
      </div>

      <label className="check" htmlFor="live-here">
        <input
          id="live-here"
          type="checkbox"
          checked={stillLivesThere}
          onChange={(e) => {
            setStillLivesThere(e.target.checked);
            if (e.target.checked) {
              const previous = CITIES.get(config.startLocationId);
              set('startLocationId', config.homeRegionId);
              const birth = CITIES.get(config.homeRegionId);
              if (birth && (!previous || config.citizenshipId === previous.countryId)) {
                set('citizenshipId', birth.countryId);
              }
            }
          }}
        />
        <span>
          I Still Live Where I Was Born
          {birthplace && <span className="dim"> — {placeLine(birthplace)}</span>}
        </span>
      </label>

      {!stillLivesThere && (
        <LocationPicker
          idPrefix="live"
          cityId={config.startLocationId}
          onPick={(picked) => {
            const previous = CITIES.get(config.startLocationId);
            set('startLocationId', picked.id);
            // Citizenship follows the country while the two agree. Once somebody
            // has deliberately made them differ, moving no longer overwrites it.
            if (!previous || config.citizenshipId === previous.countryId) {
              set('citizenshipId', picked.countryId);
            }
          }}
        />
      )}

      {!stillLivesThere && home && (
        <div className="callout">
          Living in <strong>{placeLine(home)}</strong>
          {birthplace && birthplace.countryId !== home.countryId && (
            <> · You moved country to get where you are, which is its own kind of start.</>
          )}
        </div>
      )}

      <div className="callout">
        You will be <strong>{ageAtStart(config)}</strong> when the save begins.
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
  const togglePersonality = (id: string) => {
    setConfig((c) => {
      const held = c.personalityTraits;
      if (held.includes(id)) return { ...c, personalityTraits: held.filter((t) => t !== id) };
      if (held.length >= MAX_PERSONALITY_TRAITS) return c;
      if (conflictingPersonalityTraits(held, id).length > 0) return c;
      return { ...c, personalityTraits: [...held, id] };
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
            <h2>Personality</h2>
            <p className="muted small">
              Pick up to {MAX_PERSONALITY_TRAITS}. Who you are, not what you are good at — you are already
              the best alive at all five of those. Every one of these costs something, some can’t be
              held together, and everything the game still simulates reads all of them.
            </p>
          </div>
          <span className="chip chip-accent">{config.personalityTraits.length} / {MAX_PERSONALITY_TRAITS}</span>
        </div>

        {PERSONALITY_GROUPS.map((group) => (
          <div key={group} style={{ marginBottom: 'var(--s4)' }}>
            <div className="eyebrow" style={{ marginBottom: 'var(--s2)' }}>{group}</div>
            <div className="trait-grid">
              {personalityTraitsIn(group).map((trait) => {
                const selected = config.personalityTraits.includes(trait.id);
                const conflicts = conflictingPersonalityTraits(config.personalityTraits, trait.id);
                const blocked = !selected
                  && (conflicts.length > 0 || config.personalityTraits.length >= MAX_PERSONALITY_TRAITS);
                return (
                  <button
                    key={trait.id}
                    className="trait"
                    aria-pressed={selected}
                    disabled={blocked}
                    onClick={() => togglePersonality(trait.id)}
                    title={conflicts.length > 0
                      ? `Can’t be held with ${conflicts.map((c) => PERSONALITY_TRAIT_BY_ID[c]?.name).join(', ')}.`
                      : undefined}
                  >
                    <div className="trait-name">{trait.name}</div>
                    <div className="trait-desc">{trait.description}</div>
                    <div className="xs dim" style={{ marginTop: 4 }}>{trait.cost}</div>
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
            <h2>Your Craft</h2>
            <p className="muted small">
              Not a choice, and not on this page. You’re the best{' '}
              {billedAs(config).toLowerCase()} alive: all {ATTRIBUTES.length}{' '}
              attributes at {CEILING}, all {ALL_TRAITS.length} acting traits, and the{' '}
              {GOAT_TRAITS.length} that only ever belong to one person. They’re listed on the
              Your Craft step.
            </p>
          </div>
        </div>
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
  void set;

  return (
    <div className="col gap-5">
      {/* --- What you are -------------------------------------------------- */}
      <div className="card">
        <div className="panel-head">
          <div>
            <h2>Your Craft</h2>
            <p className="muted small">
              You are an {billedAs(config).toLowerCase()}, and you are the best there
              has ever been at it. There is nothing to choose here, because nothing is missing.
            </p>
          </div>
        </div>

        {DISCIPLINES.map((discipline) => (
          <div key={discipline} className="trait is-fixed">
            <div className="row-between">
              <div className="trait-name">{DISCIPLINE_LABEL[discipline]}</div>
              <span className="chip chip-accent">{GOAT_LABEL}</span>
            </div>
            <div className="xs dim" style={{ marginTop: 4 }}>
              All {ATTRIBUTES.length} Attributes At {CEILING} · All {ALL_TRAITS.length} Traits
            </div>
            <div className="row wrap gap-1" style={{ marginTop: 8 }}>
              {goatTraitsIn(discipline).map((trait) => (
                <span key={trait.id} className="chip chip-accent">{trait.name}</span>
              ))}
            </div>
            <div className="col gap-1" style={{ marginTop: 8 }}>
              {goatTraitsIn(discipline).map((trait) => (
                <div key={trait.id} className="xs dim">
                  <span className="strong">{trait.name}.</span> {trait.description}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* --- What is not here yet ------------------------------------------ */}
      <div className="card">
        <div className="panel-head">
          <div><h3>The Work Itself</h3></div>
        </div>
        <div className="callout">
          <strong className="xs">Under Construction</strong>
          <p className="xs" style={{ margin: '6px 0 0' }}>
            Casting, auditions, productions and everything the career is made of are being rebuilt
            for a later milestone. None of it is in this build, and nothing in the game points at
            it yet.
          </p>
          <p className="xs" style={{ margin: '8px 0 0' }}>
            This build is the ground the work will stand on: where you live, the map around it,
            the calendar you keep, the weather over all of it, and how you keep yourself standing.
            Start there, and the work arrives into a life that already exists.
          </p>
        </div>
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
            {city.tags.map(titleCaseLabel).join(' · ')}
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

    </div>
  );
}

function ReviewStep({ config }: { config: NewSaveConfig }) {
  const city = CITIES.get(config.startLocationId);
  const birthplace = CITIES.get(config.homeRegionId);
  const age = ageAtStart(config);
  const wealth = WEALTH_PROFILES[config.wealth];

  return (
    <div className="col gap-5">
      <div className="card">
        <div className="center" style={{ padding: 'var(--s4) 0' }}>
          {config.portrait && (
            <img
              className="headshot headshot-xl"
              src={config.portrait}
              alt={`Headshot for ${config.firstName} ${config.lastName}`}
              style={{ margin: '0 auto var(--s4)' }}
            />
          )}
          <div className="eyebrow">Slot ready</div>
          <h1 style={{ fontSize: 'var(--size-2xl)', margin: 'var(--s2) 0' }}>
            {config.displayName?.trim() || `${config.firstName} ${config.lastName}`}
          </h1>
          <p className="muted">
            {age} · {billedAs(config)} · {city?.name}
          </p>
          {config.stageName && (
            <p className="small dim">Credited as {config.stageName}</p>
          )}
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="eyebrow" style={{ marginBottom: 'var(--s3)' }}>Identity</div>
          <Line label="Legal Name" value={[config.firstName, config.middleName, config.lastName].filter(Boolean).join(' ')} />
          <Line label="Pronouns" value={config.pronouns} />
          <Line label="Billed As" value={billedAs(config)} />
          <Line
            label="Race Or Ethnicity"
            value={describeEthnicity(config.raceEthnicity, config.raceEthnicityOwn)}
          />
          <Line label="Born" value={`${MONTHS[config.birthMonth - 1]} ${config.birthDay}, ${config.birthYear}`} />
          <Line label="Place Of Birth" value={birthplace ? placeLine(birthplace) : '—'} />
          <Line label={config.secondCitizenshipId ? 'Citizenships' : 'Citizenship'} value={citizenshipLabel(config)} />
        </div>

        <div className="card">
          <div className="eyebrow" style={{ marginBottom: 'var(--s3)' }}>Starting point</div>
          <Line label="City" value={city?.name ?? '—'} />
          <Line label="Housing" value={HOUSING.find((h) => h.id === config.housing)?.label ?? '—'} />
          <Line label="Checking" value={formatMoney(wealth.checking, { cents: false })} />
          <Line label="Savings" value={formatMoney(wealth.savings, { cents: false })} />
          <Line label="Credit Score" value={String(wealth.creditScore)} />
        </div>
      </div>

      <div className="card">
        <div className="eyebrow" style={{ marginBottom: 'var(--s3)' }}>Personality</div>
        {config.personalityTraits.length === 0 ? (
          <p className="muted small">
            Nothing picked. You’ll be the best there has ever been at making things and no
            particular kind of person, which is allowed.
          </p>
        ) : (
          <div className="col gap-3">
            {config.personalityTraits.map((id) => {
              const trait = PERSONALITY_TRAIT_BY_ID[id];
              if (!trait) return null;
              return (
                <div key={id}>
                  <div className="strong small">{trait.name}</div>
                  <div className="xs muted">{trait.description}</div>
                  <div className="xs dim" style={{ marginTop: 2 }}>{trait.cost}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card">
        <div className="eyebrow" style={{ marginBottom: 'var(--s3)' }}>Craft</div>
        {/*
          Not a list of what was picked — nothing is picked. You hold
          every trait in the game, and this card used to say "no traits, a
          blank slate", which was the last thing the player read before
          committing and it was false.
        */}
        <p className="small">
          <strong>The Best There Has Ever Been.</strong>
          {' '}All {ATTRIBUTES.length} acting attributes at {CEILING}, all {ALL_TRAITS.length}{' '}
          acting traits, and the {GOAT_TRAITS.length} G.O.A.T. traits, held at once.
        </p>
        <p className="xs dim" style={{ margin: '6px 0 0' }}>
          For anybody else that list contradicts itself and most of it is paid for with a weakness
          somewhere. Not here: a trait never costs you anything.
        </p>
      </div>

      <div className="callout callout-accent">
        Once this save begins, the world starts running. Time passes, bills arrive, and the people in it
        get on with their own lives whether you’re watching or not.
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
    const age = ageAtStart(config);
    // The year, not the age. A birth year at the cap can still leave somebody
    // seventeen when the save opens, and that is a life this game will run.
    if (!titleOf(config)) {
      issues.push('Choose whether you are billed as an actor or an actress.');
    }
    if (config.birthYear > latestBirthYear(config.startYear)) {
      issues.push(`Your character can’t be born after ${latestBirthYear(config.startYear)}.`);
    }
    if (age > 95) issues.push('That start date would make your character over 95.');
    if (config.birthDay < 1 || config.birthDay > 31) issues.push('That isn’t a valid day of the month.');
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
