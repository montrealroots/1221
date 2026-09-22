/**
 * SLATE — character creation.
 *
 * Identity, Who You Are, Starting Point, Review, then Start.
 * Progress is written to a draft on every change, so a closed tab or a dropped
 * connection never costs the setup.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Slot } from '@/engine/persistence/adapter';
import {
  APP_VERSION, WEALTH_PROFILES, defaultConfig, wealthNote,
  type NewSaveConfig, type StartingWealth,
} from '@/engine/world/bootstrap';
import { LocationPicker } from './LocationPicker';
import { PortraitPicker } from './PortraitPicker';
import { CITIES, COUNTRIES, REGIONS, isCountryLoaded, loadCountryCities } from '@/engine/content/geography';
import type { City } from '@/engine/content/geography';
import { formatMoney } from '@/engine/core/money';
import { SAVE_SCHEMA_VERSION } from '@/engine/domain/model';
import { formatPeople } from '@/engine/world/place';
import { ageOnDate, zoneAbbreviation } from '@/engine/core/time';
import { citizenshipLabel } from '@/engine/domain/citizenship';
import {
  ETHNICITIES, ETHNICITY_NOTE, ETHNICITY_OTHER, describeEthnicity,
} from '@/engine/content/ethnicity';
import {
  ALL_INTERESTS, CRAFT_INTERESTS, FILM_GENRES, GENERAL_INTERESTS, type Interest,
} from '@/engine/content/interests';
import { PERFORMER_NOUN, PERFORMER_TITLES, settledTitle, type PerformerTitle } from '@/engine/core/performer';

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

const STEPS = ['Identity', 'Who You Are', 'Starting Point', 'Review'] as const;

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
                SLATE is a life simulator. This is the {billedAs(config).toLowerCase()} you play.
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
        {step === STEP['Starting Point'] && <StartingPointStep config={config} set={set} setConfig={setConfig} />}
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
              Begin
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
 * The word this character is billed with: settled by their pronouns where
 * their pronouns settle it, and otherwise the one they picked. Undefined only
 * while somebody on they/them has not picked yet, which the Identity step
 * will not let past.
 */
function titleOf(config: NewSaveConfig): PerformerTitle | undefined {
  return settledTitle(config.pronouns) ?? config.performerTitle;
}

/** The same, as a word, and both words while it is still open. */
function billedAs(config: NewSaveConfig): string {
  const title = titleOf(config);
  return title ? PERFORMER_NOUN[title] : 'Actor Or Actress';
}

type Setter = <K extends keyof NewSaveConfig>(key: K, value: NewSaveConfig[K]) => void;

/** Every country, by name, for the two passport lists. */
const COUNTRY_OPTIONS = () => [...COUNTRIES.all()].sort((a, b) => a.name.localeCompare(b.name));

function IdentityStep({ config, set, setConfig }: {
  config: NewSaveConfig;
  set: Setter;
  setConfig: React.Dispatch<React.SetStateAction<NewSaveConfig>>;
}) {
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
              <label htmlFor="pronouns">Pronouns</label>
              <select
                id="pronouns"
                value={config.pronouns}
                onChange={(e) => {
                  const pronouns = e.target.value;
                  // The title is written into the config, so it has to move
                  // with the pronouns: settled where they settle it, and
                  // cleared where they do not, so a pick made under they/them
                  // cannot survive behind he/him.
                  setConfig((c) => ({ ...c, pronouns, performerTitle: settledTitle(pronouns) }));
                }}
              >
                <option value="she/her">She/Her</option>
                <option value="he/him">He/Him</option>
                <option value="they/them">They/Them</option>
              </select>
            </div>
          </div>

          {/* A row of its own: beside the pronouns it wraps into half a
              column, and the note under it runs eight lines deep. */}
          <div className="field-row">
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
                    treats them as equals. Pick the one you want to be called, and it will call you by it.
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
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="citizenship">Citizenship</label>
          <select id="citizenship" value={config.citizenshipId} onChange={(e) => set('citizenshipId', e.target.value)}>
            {COUNTRY_OPTIONS().map((c) => <option key={c.id} value={c.id} data-source="gazetteer">{c.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="citizenship-second">Second Citizenship (Optional)</label>
          <select
            id="citizenship-second"
            value={config.secondCitizenshipId ?? ''}
            onChange={(e) => set('secondCitizenshipId', e.target.value || undefined)}
          >
            <option value="">None</option>
            {COUNTRY_OPTIONS()
              .filter((c) => c.id !== config.citizenshipId)
              .map((c) => <option key={c.id} value={c.id} data-source="gazetteer">{c.name}</option>)}
          </select>
        </div>
      </div>

      <hr className="divider" />

      <div className="panel-head">
        <div>
          <h3>Place Of Birth</h3>
          <p className="muted small">
            Where you’re from, which isn’t always where you ended up. It’s the answer you give
            when somebody asks, and it’s the accent you either lost on purpose or kept.
          </p>
        </div>
      </div>

      <LocationPicker
        idPrefix="born"
        cityId={config.homeRegionId}
        // Where you were born, and where you live with it while you still live
        // there. Starting Point is where the two come apart.
        onPick={(picked) => setConfig((c) => ({
          ...c,
          homeRegionId: picked.id,
          ...(c.livesWhereBorn ? { startLocationId: picked.id } : {}),
        }))}
      />

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
            <h2>Interests</h2>
            <p className="muted small">
              What you care about when nobody is paying you to. Take as many as are true.
            </p>
          </div>
          <span className="chip chip-accent">{config.interests.length} Chosen</span>
        </div>

        <div className="row-between" style={{ marginBottom: 'var(--s2)' }}>
          <span className="eyebrow">Film And Television</span>
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
              The films you love. Take as many as are true — there’s no limit here.
            </p>
          </div>
          <div className="row gap-2" style={{ alignItems: 'center' }}>
            <span className="chip chip-accent">{config.genres.length} Chosen</span>
            <AllOrNothing field="genres" options={FILM_GENRES} chosen={config.genres} />
          </div>
        </div>
        <Chips options={FILM_GENRES} chosen={config.genres} onToggle={toggleGenre} />
      </div>

      {/*
        A sentence the player writes about their own character rather than an
        option list promising a consequence. It is not dead: the person page
        prints it under their name. It carries no number, and the copy here
        says so rather than implying a stat is hiding behind it.
      */}
      <div className="card">
        <div className="panel-head">
          <div>
            <h2>Background</h2>
            <p className="muted small">
              Where the life before this one happened. It carries no attribute and no
              advantage — it is yours, and it is on your page from the first morning.
            </p>
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
      </div>
    </div>
  );
}

/**
 * Starting Point — where you are standing on day one, and what is in your
 * name.
 */
function StartingPointStep({ config, set, setConfig }: {
  config: NewSaveConfig;
  set: Setter;
  setConfig: React.Dispatch<React.SetStateAction<NewSaveConfig>>;
}) {
  const city = CITIES.get(config.startLocationId);
  const birthplace = CITIES.get(config.homeRegionId);
  const wealth = WEALTH_PROFILES[config.wealth];

  return (
    <div className="col gap-5">
      <div className="card">
        <div className="panel-head">
          <div>
            <h2>Where You Live</h2>
            <p className="muted small">
              Where you are decides what things cost and whose holidays you keep.
            </p>
          </div>
        </div>

        <label className="check" htmlFor="live-here">
          <input
            id="live-here"
            type="checkbox"
            checked={config.livesWhereBorn}
            onChange={(e) => {
              const on = e.target.checked;
              setConfig((c) => (on
                ? { ...c, livesWhereBorn: true, startLocationId: c.homeRegionId }
                : { ...c, livesWhereBorn: false }));
            }}
          />
          <span>
            I Still Live Where I Was Born
            {birthplace && <span className="dim"> — {placeLine(birthplace)}</span>}
          </span>
        </label>

        {!config.livesWhereBorn && (
          <LocationPicker
            idPrefix="live"
            cityId={config.startLocationId}
            onPick={(picked) => set('startLocationId', picked.id)}
          />
        )}

        {city && (
          <div className="grid grid-3" style={{ marginTop: 'var(--s4)' }}>
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
              <span className="stat-label">Cost Of Living</span>
              <span className="stat-value">{city.costOfLivingIndex}</span>
              <span className="stat-note">A hundred is the American average</span>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="panel-head">
          <div>
            <h2>What Is Yours</h2>
            <p className="muted small">The money in your own name on the first morning.</p>
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
          <Line label="Where You Live" value={city ? placeLine(city) : '—'} />
          <Line label="Checking" value={formatMoney(wealth.checking, { cents: false })} />
          <Line label="Savings" value={formatMoney(wealth.savings, { cents: false })} />
          <Line label="Credit Score" value={String(wealth.creditScore)} />
        </div>
      </div>

      <div className="card">
        <div className="eyebrow" style={{ marginBottom: 'var(--s3)' }}>Interests And Genres</div>
        <Line label="Interests" value={namesOf(ALL_INTERESTS, config.interests)} />
        <Line label="Genres" value={namesOf(FILM_GENRES, config.genres)} />
      </div>

      <div className="callout callout-accent">
        Once this save begins, the world starts running. Time passes and the calendar fills,
        whether you’re watching or not.
      </div>
    </div>
  );
}

/** The chosen ones, in the order the list offers them, or an em dash. */
function namesOf(all: readonly Interest[], chosen: readonly string[]): string {
  const named = all.filter((one) => chosen.includes(one.id)).map((one) => one.label);
  return named.length > 0 ? named.join(', ') : '—';
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
  if (step === STEP.Identity) {
    if (!config.firstName.trim()) issues.push('A first name is needed.');
    if (!config.lastName.trim()) issues.push('A last name is needed.');
    if (!titleOf(config)) {
      issues.push('Choose whether you’re billed as an actor or an actress.');
    }
    const age = ageAtStart(config);
    // The year, not the age. A birth year at the cap can still leave somebody
    // seventeen when the save opens, and that is a life this game will run.
    if (config.birthYear > latestBirthYear(config.startYear)) {
      issues.push(`Your character can’t be born after ${latestBirthYear(config.startYear)}.`);
    }
    if (age > 95) issues.push('That start date would make your character over 95.');
    if (config.birthDay < 1 || config.birthDay > 31) issues.push('That isn’t a valid day of the month.');
    if (!CITIES.get(config.homeRegionId)) issues.push('Choose the town or city you were born in.');
  }
  if (step === STEP['Starting Point']) {
    if (!CITIES.get(config.startLocationId)) issues.push('Choose the town or city you live in.');
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
