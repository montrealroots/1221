/**
 * SLATE — character creation.
 *
 * Identity, Who You Are, My Skills, Starting Point, Your People, Review,
 * then Start.
 * Progress is written to a draft on every change, so a closed tab or a dropped
 * connection never costs the setup.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Slot } from '@/engine/persistence/adapter';
import {
  defaultConfig, wealthNote,
  type NewSaveConfig, type StartingWealth,
} from '@/engine/world/bootstrap';
import {
  OLDEST_PARENT, YOUNGEST_PARENT, relationWord,
  type FamilyConfig, type ParentConfig, type TwinConfig,
} from '@/engine/world/family';
import { PERFORMER_NOUN, PERFORMER_TITLES, type PerformerTitle } from '@/engine/core/performer';
import { PortraitPicker } from './PortraitPicker';
import { CITIES, COUNTRIES, REGIONS, isCountryLoaded, loadCountryCities } from '@/engine/content/geography';
import type { City } from '@/engine/content/geography';
import type { EstateRole, Personality } from '@/engine/domain/model';
import { formatMoney } from '@/engine/core/money';
import {
  APP_VERSION, WEALTH_PROFILES,
} from '@/engine/world/bootstrap';
import { SAVE_SCHEMA_VERSION } from '@/engine/domain/model';
import { formatPeople } from '@/engine/world/place';
import { zoneAbbreviation } from '@/engine/core/time';
import { ageOnDate } from '@/engine/core/time';
import { citizenshipLabel } from '@/engine/domain/citizenship';
import { CEILING, DISCIPLINES, DISCIPLINE_LABEL, GOAT_LABEL, GOAT_TRAITS, goatTraitsIn } from '@/engine/content/prodigy';
import {
  MAX_PERSONALITY_TRAITS, PERSONALITY_GROUPS, PERSONALITY_TRAIT_BY_ID,
  conflictingPersonalityTraits, personalityTraitPairs,
} from '@/engine/content/personality-traits';
import { ALL_TRAITS, ATTRIBUTES, TRAITS } from '@/engine/domain/attributes';
import { GENRE_MASTERIES } from '@/engine/content/genre-mastery';
import {
  ESTATE_ACRES, ESTATE_COUNTRY_ID, ESTATE_NOTE, HOLDINGS, estateCity, estatePlaceLine,
  studioName,
} from '@/engine/content/estate';
import {
  ETHNICITIES, ETHNICITY_NOTE, ETHNICITY_OTHER, describeEthnicity,
} from '@/engine/content/ethnicity';
import {
  ALL_INTERESTS, CRAFT_INTERESTS, FILM_GENRES, GENERAL_INTERESTS, type Interest,
} from '@/engine/content/interests';

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

const STEPS = ['Identity', 'Who You Are', 'My Skills', 'Starting Point', 'Your People', 'Review'] as const;

/**
 * Which step is which, by name rather than by number.
 *
 * The numbers used to be written out in six places — the union type, both
 * arrows, the Continue test, and every branch of the form — so adding a step
 * meant finding all of them and one of them was always missed.
 */
const STEP = Object.fromEntries(STEPS.map((label, index) => [label, index])) as
  Record<typeof STEPS[number], number>;
const LAST_STEP = STEPS.length - 1;
type StepIndex = number;

const DRAFT_KEY = (slot: Slot) => `slate.draft.${slot}`;


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
                SLATE is a life simulator about the acting business. This is the{' '}
                {billedAs(config).toLowerCase()} you play.
              </p>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
        </div>

        {restored && step === 0 && (
          <div className="callout callout-info" style={{ marginBottom: 'var(--s5)' }}>
            You’d half-filled this form already. It’s been put back the way you left it.
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

        {step === STEP.Identity && <IdentityStep config={config} set={set} setConfig={setConfig} />}
        {step === STEP['Who You Are'] && <PersonalStep config={config} set={set} setConfig={setConfig} />}
        {step === STEP['My Skills'] && <CareerStep config={config} set={set} />}
        {step === STEP['Starting Point'] && <StartingPointStep config={config} set={set} />}
        {step === STEP['Your People'] && <YourPeopleStep config={config} set={set} />}
        {step === STEP.Review && <ReviewStep config={config} />}

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
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            Back
          </button>

          {step < LAST_STEP ? (
            <button
              className="btn btn-primary"
              onClick={() => setStep((s) => Math.min(LAST_STEP, s + 1))}
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
  // Whether they hold a passport for the country they live in is no longer a
  // question: the family's is Icelandic and so is the land, so everybody
  // created here can work at home. It is still worth saying on the screen.
  const settled = settledTitle(config.pronouns);

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
                Your pronouns say which of the two words is yours, so there’s nothing to pick.
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
                He/Him settles this by itself, and so does She/Her. They/Them doesn’t, so the
                choice is yours. Actor and Actress are two words for the same craft and the game
                treats them as equals — pick the one the business would list you under, and it
                will call you by it.
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
              placeholder="However you’d say it"
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
          <input
            id="citizenship"
            type="text"
            value={COUNTRIES.get(ESTATE_COUNTRY_ID)?.name ?? 'Iceland'}
            readOnly
            aria-readonly="true"
          />
          <p className="xs dim" style={{ marginTop: 4 }}>
            The family is Icelandic and so are you, wherever you happened to be born. It arrives
            with the name, and it isn’t yours to give back.
          </p>
        </div>
      </div>

      <hr className="divider" />

      {/*
        Born on the land, like everything else about where this character
        stands. The picker that used to be here — the map, the country and
        region lists, the ranked towns — is intact in LocationPicker and
        WorldMap and is simply not on this page any more.
      */}
      <div className="field" style={{ maxWidth: 'min(28rem, 100%)' }}>
        <label htmlFor="birthplace">Place Of Birth</label>
        <input
          id="birthplace"
          type="text"
          value={estatePlaceLine()}
          readOnly
          aria-readonly="true"
        />
        <p className="xs dim" style={{ marginTop: 4 }}>
          You were born on the family land and you have never lived anywhere else. It’s the answer
          you give when somebody asks, and it’s the accent you either lost on purpose or kept.
        </p>
      </div>

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
        : [...c.interests, interest],
    }));
  };

  const toggleGenre = (genre: string) => {
    setConfig((c) => ({
      ...c,
      genres: c.genres.includes(genre)
        ? c.genres.filter((g) => g !== genre)
        : [...c.genres, genre],
    }));
  };

  // Take a whole list at once, or put it back. `field` names which of the two
  // lists is being set, so one control serves both.
  const setAll = (field: 'interests' | 'genres', options: readonly Interest[], on: boolean) => {
    setConfig((c) => {
      const ids = options.map((o) => o.id);
      const rest = c[field].filter((id) => !ids.includes(id));
      return { ...c, [field]: on ? [...rest, ...ids] : rest };
    });
  };

  // One chip, whichever list it came from.
  const Chips = ({ options, chosen, onToggle }: {
    options: readonly Interest[];
    chosen: readonly string[];
    onToggle: (id: string) => void;
  }) => (
    <div className="chip-row" style={{ gap: 'var(--s2)' }}>
      {options.map((option) => {
        const on = chosen.includes(option.id);
        return (
          <button
            key={option.id}
            className="chip"
            style={on
              ? { background: 'var(--accent-dim)', color: 'var(--accent-strong)', borderColor: 'var(--accent-line)' }
              : undefined}
            aria-pressed={on}
            onClick={() => onToggle(option.id)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );

  const AllOrNothing = ({ field, options, chosen }: {
    field: 'interests' | 'genres';
    options: readonly Interest[];
    chosen: readonly string[];
  }) => {
    const every = options.every((o) => chosen.includes(o.id));
    return (
      <button
        type="button"
        className="btn btn-sm"
        onClick={() => setAll(field, options, !every)}
      >
        {every ? 'Clear These' : 'Select All'}
      </button>
    );
  };

  return (
    <div className="col gap-5">
      <div className="card">
        <div className="panel-head">
          <div>
            <h2>Personality</h2>
            <p className="muted small">
              Dispositions, not stats. Two of them do something today: Emotional Stability sets
              how quickly stress arrives and how quickly it clears, and Conscientiousness sets
              how well the nights go. The other five are written into the save and change nothing
              yet — two of them wait on shoots and travel, three wait on other people, and none
              of that is built.
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
              Pick up to {MAX_PERSONALITY_TRAITS}. Who you are, not what you are good at — you are
              already the best alive at the one thing there is to be good at. Each pair here is one
              trait written against another: every one costs something, the two sides of a pair
              can’t both be held, and everything the game still simulates reads all of them.
            </p>
          </div>
          <span className="chip chip-accent">{config.personalityTraits.length} / {MAX_PERSONALITY_TRAITS}</span>
        </div>

        {PERSONALITY_GROUPS.map((group) => (
          <div key={group} style={{ marginBottom: 'var(--s4)' }}>
            <div className="eyebrow" style={{ marginBottom: 'var(--s2)' }}>{group}</div>
            {/* A row per opposing pair. One flowing grid would wrap a pair
                across two rows at some widths and the opposition would stop
                being visible, which is the only reason the order exists. */}
            {personalityTraitPairs(group).map((pair) => (
              <div className="trait-pair" key={pair[0]!.id}>
                {pair.map((trait) => {
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
            ))}
          </div>
        ))}
      </div>

      <div className="card">
        <div className="panel-head">
          <div>
            <h2>Interests</h2>
            <p className="muted small">
              What you care about when nobody is paying you to. Take as many as are true.
            </p>
          </div>
          <span className="chip chip-accent">{config.interests.length} Chosen</span>
        </div>

        <div className="row-between" style={{ marginBottom: 'var(--s2)' }}>
          <span className="eyebrow">The Work</span>
          <AllOrNothing field="interests" options={CRAFT_INTERESTS} chosen={config.interests} />
        </div>
        <Chips options={CRAFT_INTERESTS} chosen={config.interests} onToggle={toggleInterest} />

        <div className="row-between" style={{ margin: 'var(--s4) 0 var(--s2)' }}>
          <span className="eyebrow">Everything Else</span>
          <AllOrNothing field="interests" options={GENERAL_INTERESTS} chosen={config.interests} />
        </div>
        <Chips options={GENERAL_INTERESTS} chosen={config.interests} onToggle={toggleInterest} />
      </div>

      <div className="card">
        <div className="panel-head">
          <div>
            <h2>Genres</h2>
            <p className="muted small">
              The films you love, which isn’t the same question as the films you’d be cast in.
              Take as many as are true — there’s no limit here.
            </p>
          </div>
          <div className="row gap-2" style={{ alignItems: 'center' }}>
            <span className="chip chip-accent">{config.genres.length} Chosen</span>
            <AllOrNothing field="genres" options={FILM_GENRES} chosen={config.genres} />
          </div>
        </div>
        <Chips options={FILM_GENRES} chosen={config.genres} onToggle={toggleGenre} />
      </div>

      <div className="card">
        <div className="panel-head">
          <div>
            <h2>Background</h2>
            <p className="muted small">Where the life before this one happened, and how you spend.</p>
          </div>
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
            <h2>My Skills</h2>
            <p className="muted small">
              You are an {billedAs(config).toLowerCase()}, and you are the best there
              has ever been at it. There’s nothing to choose here, because nothing is missing.
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
            <div className="chip-row" style={{ marginTop: 8 }}>
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

      {/* --- All of it, so a claim this size can be read rather than taken --- */}
      <Sheet
        title="Every Acting Skill"
        note={`All of them, at ${CEILING}. Alphabetical, so a name can be found rather than hunted for.`}
        items={ATTRIBUTES.map((one) => ({ id: one.id, name: one.name, note: one.description }))}
      />
      <Sheet
        title="Every Acting Trait"
        note="Held at once. For anybody else half of these would rule out the other half."
        items={TRAITS.map((one) => ({ id: one.id, name: one.name, note: one.description }))}
      />
      <Sheet
        title="Mastery Of Every Genre"
        note="One for each genre there is. There’s no form you can’t work in."
        items={GENRE_MASTERIES.map((one) => ({ id: one.id, name: one.name, note: one.description }))}
      />

    </div>
  );
}

/**
 * Starting Point — where you are standing on day one.
 *
 * Not a set of choices any more. Where you live, what you live in and what is
 * next door are all one fact: the family holds two thousand acres outside
 * Reykjavík and has just put a studio lot and a production company on it. The
 * page reports that rather than asking about it.
 */
function StartingPointStep({ config, set }: { config: NewSaveConfig; set: Setter }) {
  const city = estateCity();
  const wealth = WEALTH_PROFILES[config.wealth];
  const company = studioName(config.lastName);

  return (
    <div className="col gap-5">
      <div className="card">
        <div className="panel-head">
          <div>
            <h2>Home Base</h2>
            <p className="muted small">Where the family land is. It isn’t a choice — it’s where you’re from.</p>
          </div>
        </div>

        <div className="strong" style={{ fontSize: 'var(--size-lg)', marginBottom: 'var(--s3)' }}>
          {estatePlaceLine()}
        </div>

        <div className="grid grid-3">
          <div className="stat">
            <span className="stat-label">Population</span>
            <span className="stat-value">{formatPeople(city.population)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Time Zone</span>
            <span className="stat-value" style={{ fontSize: 'var(--size-md)' }}>{zoneAbbreviation(Date.now(), city.timeZone)}</span>
            <span className="stat-note">{city.timeZone}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Industry Here</span>
            <span className="stat-value">None</span>
            <span className="stat-note">No television, no film, until the family</span>
          </div>
        </div>

        <p className="muted small" style={{ marginTop: 'var(--s4)', marginBottom: 0 }}>{ESTATE_NOTE}</p>
      </div>

      <div className="card">
        <div className="panel-head">
          <div>
            <h2>The Land</h2>
            <p className="muted small">Held by the family. Three things stand on it.</p>
          </div>
          <span className="chip chip-accent">{ESTATE_ACRES.toLocaleString('en-US')} Acres</span>
        </div>

        <div className="col gap-2">
          {HOLDINGS.map((holding) => (
            <div key={holding.id} className="holding">
              <div className="strong">{holding.label(config.lastName)}</div>
              <div className="small muted">{holding.detail}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="panel-head">
          <div>
            <h2>{company}</h2>
            <p className="muted small">
              Television and Film. It carries the family name, which is the surname you gave on
              Identity — the company is named the moment you are.
            </p>
          </div>
        </div>
        {config.lastName.trim() ? (
          <div className="callout">
            The name was on the gate before you were on the lot. Everybody who reads it on a call
            sheet knows which family it belongs to. That’s the advantage, and it’s the whole problem.
          </div>
        ) : (
          <div className="callout callout-accent">
            Put a surname on Identity — it’s the family name, and the company takes it.
          </div>
        )}
      </div>

      <div className="card">
        <div className="panel-head">
          <div>
            <h2>What Is Yours</h2>
            <p className="muted small">
              The land and the company are the family’s. This is the money in your own name.
            </p>
          </div>
        </div>
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
            <span className="stat-label">Credit Score</span>
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
          <div className="eyebrow" style={{ marginBottom: 'var(--s3)' }}>Starting Point</div>
          <Line label="Home Base" value={estatePlaceLine()} />
          <Line label="The Land" value={`${ESTATE_ACRES.toLocaleString('en-US')} Acres, Family Held`} />
          <Line label="The Company" value={studioName(config.lastName)} />
          <Line label="Checking" value={formatMoney(wealth.checking, { cents: false })} />
          <Line label="Savings" value={formatMoney(wealth.savings, { cents: false })} />
          <Line label="Credit Score" value={String(wealth.creditScore)} />
        </div>
      </div>

      <div className="card">
        <div className="eyebrow" style={{ marginBottom: 'var(--s3)' }}>Personality</div>
        {config.personalityTraits.length === 0 ? (
          <p className="muted small">
            Nothing picked. You’ll be the best there has ever been at the work and nobody in
            particular away from it, which is allowed.
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
        <div className="eyebrow" style={{ marginBottom: 'var(--s3)' }}>Your People</div>
        <Line
          label="Your Mother"
          value={personLine(config.family.mother, config.lastName, config.birthYear, age)}
        />
        <Line
          label="Your Father"
          value={personLine(config.family.father, config.lastName, config.birthYear, age)}
        />
        <Line
          label={config.family.twin ? twinLabel(config.family.twin) : 'A Twin'}
          value={config.family.twin
            ? `${nameLine(config.family.twin.firstName, config.lastName)}, ${age}, ${
              config.family.twin.identical ? 'identical' : 'fraternal'}. ${
              roleLine(config.family.twin.role)}`
            : 'None — you were born alone.'}
        />
      </div>

      <div className="card">
        <div className="eyebrow" style={{ marginBottom: 'var(--s3)' }}>Interests And Genres</div>
        <Line label="Interests" value={namesOf(ALL_INTERESTS, config.interests)} />
        <Line label="Genres" value={namesOf(FILM_GENRES, config.genres)} />
      </div>

      <div className="card">
        <div className="eyebrow" style={{ marginBottom: 'var(--s3)' }}>My Skills</div>
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
        Once this save begins, the world starts running. Time passes, the calendar fills, and
        everybody in it gets on with their own life whether you’re watching or not.
      </div>
    </div>
  );
}

/** The chosen ones, in the order the list offers them, or an em dash. */
function namesOf(all: readonly Interest[], chosen: readonly string[]): string {
  const named = all.filter((one) => chosen.includes(one.id)).map((one) => one.label);
  return named.length > 0 ? named.join(', ') : '—';
}

/**
 * One long list, folded away.
 *
 * The page states that the player holds all of it, and a number that large is
 * a claim rather than a fact until somebody can read it. So it is all here,
 * shut by default because it is the length it is, and open to anybody who
 * wants to check.
 */
function Sheet({ title, note, items }: {
  title: string;
  note: string;
  items: readonly { id: string; name: string; note: string }[];
}) {
  return (
    <details className="card sheet">
      <summary>
        <span className="sheet-title">{title}</span>
        <span className="chip chip-accent">{items.length}</span>
      </summary>
      <p className="muted small" style={{ margin: 'var(--s3) 0' }}>{note}</p>
      <div className="sheet-grid">
        {items.map((item) => (
          <div key={item.id} className="sheet-item">
            <div className="strong xs">{item.name}</div>
            <div className="xs dim">{item.note}</div>
          </div>
        ))}
      </div>
    </details>
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

// ---------------------------------------------------------------------------
// Your People
// ---------------------------------------------------------------------------

/**
 * What somebody can be the one who does on the land.
 *
 * Three forms, because three places need it. `label` is the button. `note` is
 * what the button explains. `said` is the sentence about a person, which the
 * note cannot stand in for: "Halla Rivera, 53. What gets made, and what it
 * costs" is not a thing anybody would say about a mother.
 */
const ESTATE_ROLES: { id: EstateRole; label: string; note: string; said: string }[] = [
  {
    id: 'the house', label: 'Keeps The House', said: 'Keeps the house.',
    note: 'Runs the household. Nothing in it works without them.',
  },
  {
    id: 'the lot', label: 'Runs The Lot', said: 'Runs the lot.',
    note: 'The stages, the crew, the schedule. The lot is theirs.',
  },
  {
    id: 'the company', label: 'Runs The Company', said: 'Runs the company.',
    note: 'What gets made, and what it costs. The name on the gate.',
  },
  {
    id: 'nothing in particular', label: 'Nothing In Particular', said: 'Runs none of it.',
    note: 'Lives here. Leaves the running of it to everybody else.',
  },
];

const TWIN_GENDERS: { id: TwinConfig['gender']; label: string; note: string }[] = [
  { id: 'female', label: 'A Sister', note: 'Your twin sister.' },
  { id: 'male', label: 'A Brother', note: 'Your twin brother.' },
  { id: 'nonbinary', label: 'Neither', note: 'Your twin, and no other word for it.' },
];

/**
 * The step where the house stops being empty.
 *
 * Everything above this one is about the player. This is the only place the
 * game asks about anybody else, and what it asks is small on purpose: a name,
 * an age, and the thing each of them is the one who does. The rest — who they
 * are, how they take a Tuesday — the save works out for itself.
 */
function YourPeopleStep({ config, set }: { config: NewSaveConfig; set: Setter }) {
  const family = config.family;
  const surname = config.lastName.trim();
  const setFamily = (patch: Partial<FamilyConfig>) => set('family', { ...family, ...patch });
  const twin = family.twin;
  const playerAge = ageAtStart(config);

  return (
    <div className="col gap-5">
      <div className="card">
        <div className="panel-head">
          <div>
            <h2>The People You Grew Up With</h2>
            <p className="muted small">
              The land is theirs before it’s yours, and they live on it now. Two of them, and a
              third if you weren’t born alone.
            </p>
          </div>
        </div>
        <div className="callout">
          The last page showed you three things standing on that land: the house, the lot, and the
          company that carries the family name. Somebody runs each of them, and this is where you
          say who.
        </div>
        <p className="muted small" style={{ margin: 'var(--s4) 0 0' }}>
          Nobody here acts. They’re the family, not the business — and every one of them is
          somebody you have to get on with, which is its own kind of work.
        </p>
      </div>

      <ParentCard
        who="Mother" idPrefix="mother" parent={family.mother} surname={surname}
        birthYear={config.birthYear} playerAge={playerAge}
        onChange={(patch) => setFamily({ mother: { ...family.mother, ...patch } })}
      />
      <ParentCard
        who="Father" idPrefix="father" parent={family.father} surname={surname}
        birthYear={config.birthYear} playerAge={playerAge}
        onChange={(patch) => setFamily({ father: { ...family.father, ...patch } })}
      />

      <div className="card">
        <div className="panel-head">
          <div>
            <h2>A Twin</h2>
            <p className="muted small">
              Somebody born the same morning you were. Most people weren’t, so this one is a
              choice rather than a blank to fill in.
            </p>
          </div>
          {twin && twin.firstName.trim() && surname
            ? <span className="chip chip-accent">{twin.firstName.trim()} {surname}</span>
            : <span className="chip">{twin ? 'A Twin' : 'Born Alone'}</span>}
        </div>

        <div
          className="trait-grid"
          style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${CHOICE_COLUMN}px), 1fr))` }}
          role="group"
          aria-label="Whether You Have A Twin"
        >
          <button
            type="button" className="trait" aria-pressed={!twin}
            onClick={() => setFamily({ twin: undefined })}
          >
            <div className="trait-name">You Were Born Alone</div>
            <div className="trait-desc">Which is how most people are born.</div>
          </button>
          <button
            type="button" className="trait" aria-pressed={Boolean(twin)}
            onClick={() => setFamily({ twin: twin ?? defaultTwin() })}
          >
            <div className="trait-name">You Have A Twin</div>
            <div className="trait-desc">Somebody who has been beside you since before either of you could talk.</div>
          </button>
        </div>

        {twin && (
          <div className="col gap-4" style={{ marginTop: 'var(--s5)' }}>
            <div className="field">
              <label htmlFor="twin-name">Their First Name</label>
              <input
                id="twin-name" value={twin.firstName}
                onChange={(e) => setFamily({ twin: { ...twin, firstName: e.target.value } })}
                placeholder="A first name"
              />
              {surname && twin.firstName.trim() && (
                <p className="xs dim" style={{ marginTop: 4 }}>{twin.firstName.trim()} {surname}</p>
              )}
            </div>

            <Choice
              label="Brother Or Sister"
              options={TWIN_GENDERS.map((g) => ({ id: g.id ?? 'nonbinary', label: g.label, note: g.note }))}
              value={twin.gender ?? 'nonbinary'}
              onPick={(id) => setFamily({ twin: { ...twin, gender: id as TwinConfig['gender'] } })}
            />

            <Choice
              label="Identical Or Fraternal"
              options={[
                { id: 'identical', label: 'Identical', note: 'You have the same face. People get the two of you wrong, and some of them mean to.' },
                { id: 'fraternal', label: 'Fraternal', note: 'Born together, and that’s where the resemblance stops.' },
              ]}
              value={twin.identical ? 'identical' : 'fraternal'}
              onPick={(id) => setFamily({ twin: { ...twin, identical: id === 'identical' } })}
            />

            <Choice
              label="What They Do On The Land"
              options={ESTATE_ROLES.map((r) => ({ id: r.id, label: r.label, note: r.note }))}
              value={twin.role}
              onPick={(id) => setFamily({ twin: { ...twin, role: id as EstateRole } })}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/** One parent, asked for the same three things as the other. */
function ParentCard({ who, idPrefix, parent, surname, birthYear, playerAge, onChange }: {
  who: 'Mother' | 'Father';
  idPrefix: string;
  parent: ParentConfig;
  surname: string;
  birthYear: number;
  playerAge: number;
  onChange: (patch: Partial<ParentConfig>) => void;
}) {
  const age = Number.isFinite(parent.ageAtBirth) ? parent.ageAtBirth : 0;
  const bornIn = birthYear - age;

  return (
    <div className="card">
      <div className="panel-head">
        <div>
          <h2>Your {who}</h2>
          <p className="muted small">
            {who === 'Mother' ? 'She' : 'He'} was here before you were, and{' '}
            {who === 'Mother' ? 'she' : 'he'} is here now.
          </p>
        </div>
        {parent.firstName.trim() && surname && (
          <span className="chip chip-accent">{parent.firstName.trim()} {surname}</span>
        )}
      </div>

      <div className="grid grid-2">
        <div className="field">
          <label htmlFor={`${idPrefix}-name`}>Their First Name</label>
          <input
            id={`${idPrefix}-name`} value={parent.firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
            placeholder="A first name"
          />
          <p className="xs dim" style={{ marginTop: 4 }}>
            They take the family name, which is the surname you gave on Identity.
          </p>
        </div>

        <div className="field">
          <label htmlFor={`${idPrefix}-age`}>How Old They Were When You Were Born</label>
          <input
            id={`${idPrefix}-age`} type="number" inputMode="numeric"
            min={YOUNGEST_PARENT} max={OLDEST_PARENT}
            value={Number.isFinite(parent.ageAtBirth) ? parent.ageAtBirth : ''}
            onChange={(e) => onChange({ ageAtBirth: Number(e.target.value) })}
          />
          <p className="xs dim" style={{ marginTop: 4 }}>
            {age >= YOUNGEST_PARENT && age <= OLDEST_PARENT
              ? `Born around ${bornIn}, which puts them at ${age + playerAge} when the save opens.`
              : `Anywhere from ${YOUNGEST_PARENT} to ${OLDEST_PARENT}.`}
          </p>
        </div>
      </div>

      <Choice
        label="What They Do On The Land"
        options={ESTATE_ROLES.map((r) => ({ id: r.id, label: r.label, note: r.note }))}
        value={parent.role}
        onPick={(id) => onChange({ role: id as EstateRole })}
      />
    </div>
  );
}

/**
 * How narrow a column of choices is allowed to get before the row breaks.
 *
 * Wide enough that four choices land as two rows of two rather than a row of
 * three and a lonely fourth, and that two land side by side rather than as two
 * boxes and a third of a row of nothing. Three choices are the exception: they
 * fit across, and breaking them would be the same fault the other way.
 *
 * It is a floor, not a width. On a phone one column clears it and the choices
 * stack, which is the only thing that reads at that size.
 */
const CHOICE_COLUMN = 260;
const CHOICE_COLUMN_OF_THREE = 210;

/** A row of buttons where a dropdown would have hidden what the options say. */
function Choice({ label, options, value, onPick }: {
  label: string;
  options: { id: string; label: string; note: string }[];
  value: string;
  onPick: (id: string) => void;
}) {
  const floor = options.length === 3 ? CHOICE_COLUMN_OF_THREE : CHOICE_COLUMN;
  return (
    <div className="field" style={{ marginTop: 'var(--s4)' }}>
      <span className="label">{label}</span>
      <div
        className="trait-grid"
        style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${floor}px), 1fr))` }}
        role="group"
        aria-label={label}
      >
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className="trait"
            aria-pressed={value === option.id}
            onClick={() => onPick(option.id)}
          >
            <div className="trait-name">{option.label}</div>
            <div className="trait-desc">{option.note}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/** A full name, or a placeholder where the form is still half-filled. */
function nameLine(first: string, last: string): string {
  return [first.trim(), last.trim()].filter(Boolean).join(' ') || '—';
}

/** What somebody is the one who does, as a sentence rather than a label. */
function roleLine(role: EstateRole): string {
  return ESTATE_ROLES.find((one) => one.id === role)?.said ?? '';
}

/** One parent, in the one line the review has room for. */
function personLine(parent: ParentConfig, surname: string, birthYear: number, playerAge: number): string {
  const name = nameLine(parent.firstName, surname);
  if (!Number.isFinite(parent.ageAtBirth)) return name;
  return `${name}, ${parent.ageAtBirth + playerAge}, born around ${birthYear - parent.ageAtBirth}. ${roleLine(parent.role)}`;
}

/** Twin Sister, Twin Brother, or just Twin — in the engine's own word for it. */
function twinLabel(twin: TwinConfig): string {
  return `Your ${relationWord('twin', twin.gender)}`;
}

/** What the step will not let past, said the way a person would say it. */
export function familyIssues(config: NewSaveConfig): string[] {
  const issues: string[] = [];
  const { mother, father, twin } = config.family;

  for (const [who, parent] of [['mother', mother], ['father', father]] as const) {
    if (!parent.firstName.trim()) issues.push(`Your ${who} needs a first name.`);
    if (!Number.isFinite(parent.ageAtBirth)
      || parent.ageAtBirth < YOUNGEST_PARENT || parent.ageAtBirth > OLDEST_PARENT) {
      issues.push(`Your ${who} has to have been between ${YOUNGEST_PARENT} and ${OLDEST_PARENT} when you were born.`);
    }
  }
  if (twin && !twin.firstName.trim()) issues.push('Your twin needs a first name, or you were born alone.');

  // Everybody in this house shares a surname, so two of them sharing a first
  // name is a sentence nobody can read: "you told your mother" and "you told
  // your twin" would name the same person.
  const names = [
    ['you', config.firstName],
    ['your mother', mother.firstName],
    ['your father', father.firstName],
    ...(twin ? [['your twin', twin.firstName] as const] : []),
  ] as const;
  for (let i = 0; i < names.length; i += 1) {
    for (let j = i + 1; j < names.length; j += 1) {
      const [oneWho, oneName] = names[i]!;
      const [twoWho, twoName] = names[j]!;
      const shared = oneName.trim().toLowerCase();
      if (shared && shared === twoName.trim().toLowerCase()) {
        issues.push(`${sentenceStart(oneWho)} and ${twoWho} can’t both be called ${oneName.trim()}.`);
      }
    }
  }
  return issues;
}

/** A twin nobody has said anything about yet. */
function defaultTwin(): TwinConfig {
  return { firstName: '', gender: 'nonbinary', identical: false, role: 'nothing in particular' };
}

/** The same words, capitalized for the front of a sentence. */
function sentenceStart(words: string): string {
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function validate(config: NewSaveConfig, step: StepIndex): string[] {
  const issues: string[] = [];
  if (step === STEP.Identity) {
    if (!config.firstName.trim()) issues.push('A first name is needed.');
    if (!config.lastName.trim()) issues.push('A last name is needed.');
    const age = ageAtStart(config);
    // The year, not the age. A birth year at the cap can still leave somebody
    // seventeen when the save opens, and that is a life this game will run.
    if (!titleOf(config)) {
      issues.push('Choose whether you’re billed as an actor or an actress.');
    }
    if (config.birthYear > latestBirthYear(config.startYear)) {
      issues.push(`Your character can’t be born after ${latestBirthYear(config.startYear)}.`);
    }
    if (age > 95) issues.push('That start date would make your character over 95.');
    if (config.birthDay < 1 || config.birthDay > 31) issues.push('That isn’t a valid day of the month.');
  }
  if (step === STEP['Starting Point']) {
    // Where you live is not asked any more, so there is nothing here to get
    // wrong but the day the save opens on.
    if (config.startDay < 1 || config.startDay > 28) issues.push('Pick a start day between 1 and 28.');
  }
  if (step === STEP['Your People']) issues.push(...familyIssues(config));
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

    // The merge above is one level deep, so a stored family missing a parent
    // would replace a whole one and the form would read a field off nothing.
    const family = defaultConfig().family;
    merged.family = {
      mother: { ...family.mother, ...merged.family?.mother },
      father: { ...family.father, ...merged.family?.father },
      ...(merged.family?.twin ? { twin: { ...defaultTwin(), ...merged.family.twin } } : {}),
    };

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
