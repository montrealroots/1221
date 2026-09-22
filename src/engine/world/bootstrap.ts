/**
 * SLATE — Creating a universe.
 *
 * One save is one world. Everything below builds that world from the character
 * creation choices: the person, their accounts, where they live, what they
 * owe, and the surrounding world that was already running before they
 * arrived.
 */

import type { Person, SaveMeta, SaveUniverse } from '../domain/model';
import { SAVE_SCHEMA_VERSION } from '../domain/model';
import { CITIES } from '../content/geography';
import { costOfLiving } from '../content/tax';
import { addDays, addMonths, instantFromZoned, MS_DAY } from '../core/time';
import type { Money } from '../core/money';
import { idAlreadyIssued } from '../core/ids';
import { ETHNICITY_BY_ID } from '../content/ethnicity';
import { GENRE_BY_ID, INTEREST_BY_ID } from '../content/interests';

/** The ids on a list this build recognises, deduplicated, in the order given. */
function known(ids: readonly string[] | undefined, table: Readonly<Record<string, unknown>>): string[] {
  return [...new Set((ids ?? []).filter((id) => table[id] !== undefined))];
}
import { freshWellbeing } from '../systems/life';
import { PERFORMER_NOUN, impliedPerformerTitle, isPerformerTitle, type PerformerTitle } from '../core/performer';

export const APP_VERSION = '1.1.0';

// ---------------------------------------------------------------------------
// Character creation input
// ---------------------------------------------------------------------------

export type StartingWealth = 'nothing' | 'scraping' | 'modest' | 'comfortable' | 'wealthy' | 'inherited';
export interface NewSaveConfig {
  /** Identity */
  firstName: string;
  middleName?: string;
  lastName: string;
  displayName?: string;
  pronouns: string;
  /**
   * Actor or actress. Settled by the pronouns where they settle it, and the
   * player's pick under they/them. Absent, the pronouns decide.
   */
  performerTitle?: PerformerTitle;
  /** Local date of birth in the starting city's zone. */
  /** A second passport, for somebody naturalised where they live now. */
  secondCitizenshipId?: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  /**
   * Who the character is. More than one can be true, so it is a set, and it
   * carries nothing mechanical — see `content/ethnicity.ts`.
   */
  raceEthnicity: readonly string[];
  /** Said in their own words, when the list does not have it. */
  raceEthnicityOwn?: string;
  homeRegionId: string;
  /**
   * Whether they still live where they were born.
   *
   * On the config rather than in a component's state because two steps read
   * it: Place Of Birth on Identity carries the home town with it while this
   * is true, and Where You Live on Starting Point is what sets it. It also
   * means a half-filled form remembers the answer instead of guessing it back
   * from whether the two places happen to match.
   */
  livesWhereBorn: boolean;
  citizenshipId: string;
  /** Headshot as a data URL, already fitted to the portrait frame. */
  portrait?: string;

  /** Personal */
  interests: string[];
  /** Genres they love watching. Carries nothing; see `content/interests.ts`. */
  genres: string[];
  /** The life before this one, in their own words. Flavor, and said back to them. */
  background: string;

  /** Starting point */
  startLocationId: string;
  wealth: StartingWealth;
  /** World start date, local to the starting city. */
  startYear: number;
  startMonth: number;
  startDay: number;

}

/**
 * A config whose two passports do not name the same country.
 *
 * Picking the same country twice is not dual citizenship, it is the same
 * passport printed twice, so the second is dropped. A second passport that
 * names somewhere else is theirs and is left alone.
 */
export function withSettledCitizenship(config: NewSaveConfig): NewSaveConfig {
  if (config.secondCitizenshipId !== config.citizenshipId) return config;
  return { ...config, secondCitizenshipId: undefined };
}

/**
 * Where a new save is born and lives until the player says otherwise.
 *
 * Mosfellsbær, outside Reykjavík, because that is where the family land was
 * and the land is what the rest of the defaults were built around. The land
 * is gone; the town is still a real one, and the screen asks for a different
 * one if the player wants it.
 */
export const DEFAULT_CITY_ID = 'is-39-mosfellsbr';
export const DEFAULT_COUNTRY_ID = 'is';

export function defaultConfig(): NewSaveConfig {
  return {
    firstName: 'Alex', lastName: 'Rivera', pronouns: 'they/them',
    birthYear: 2001, birthMonth: 6, birthDay: 14,
    raceEthnicity: [],
    homeRegionId: DEFAULT_CITY_ID, livesWhereBorn: true,
    citizenshipId: DEFAULT_COUNTRY_ID,
    interests: ['film', 'television'], genres: [],
    background: '',
    startLocationId: DEFAULT_CITY_ID,
    wealth: 'scraping',
    // Monday 5 January 2026, the first working Monday of the year.
    startYear: 2026, startMonth: 1, startDay: 5,
  };
}

const WEALTH_PROFILE: Record<StartingWealth, { checking: Money; savings: Money; cardLimit: Money; cardBalance: Money; creditScore: number; note: string }> = {
  nothing: { checking: 40_00, savings: 0, cardLimit: 0, cardBalance: 0, creditScore: 520, note: 'Forty euros to your name, and no savings behind it.' },
  scraping: { checking: 1_240_00, savings: 300_00, cardLimit: 1_500_00, cardBalance: -840_00, creditScore: 610, note: 'Getting by, with a card you’re carrying a balance on.' },
  modest: { checking: 4_800_00, savings: 6_500_00, cardLimit: 6_000_00, cardBalance: -420_00, creditScore: 690, note: 'A small cushion and clean credit.' },
  comfortable: { checking: 18_000_00, savings: 42_000_00, cardLimit: 20_000_00, cardBalance: 0, creditScore: 748, note: 'Genuinely comfortable, with room to take a risk.' },
  wealthy: { checking: 85_000_00, savings: 380_000_00, cardLimit: 60_000_00, cardBalance: 0, creditScore: 795, note: 'Money isn’t the constraint. Time and access are.' },
  inherited: { checking: 240_000_00, savings: 2_400_000_00, cardLimit: 150_000_00, cardBalance: 0, creditScore: 812, note: 'You didn’t earn this, and everyone in the room knows it.' },
};

export function wealthNote(wealth: StartingWealth): string {
  return WEALTH_PROFILE[wealth].note;
}

// ---------------------------------------------------------------------------
// Universe construction
// ---------------------------------------------------------------------------

export function emptyUniverse(
  meta: SaveMeta, now: number, zone: string, playerId: string,
): SaveUniverse {
  return {
    meta,
    __idCounter: 0,
    now,
    homeZone: zone,
    currentZone: zone,
    playerId,
    people: {},
    accounts: {}, transactions: [],
    scheduled: [], history: [], decisions: {}, notifications: [],
    preferences: {
      reducedMotion: false, audioEnabled: true, audioVolume: 0.6,
      timeSpeed: 'live', compactMode: false, showAdvancedNumbers: false,
      confirmLargePurchases: true, largePurchaseThreshold: 5_000_00,
    },
    idempotency: {},
    counters: {},
    engineFailures: [],
  };
}

export interface BootstrapResult {
  universe: SaveUniverse;
  playerId: string;
}

/**
 * Builds the raw universe object. Systems are wired separately by
 * `createSimulation`, which then runs `populateWorld` to fill it in.
 */
export function createUniverse(slot: 1 | 2 | 3, seed: string, raw: NewSaveConfig): BootstrapResult {
  // Settled here rather than trusted, so a save built straight from the engine
  // holds the same two passports a save built through the screen does.
  const config = withSettledCitizenship(raw);
  const city = CITIES.require(config.startLocationId);
  const zone = city.timeZone;
  const now = instantFromZoned(
    { year: config.startYear, month: config.startMonth, day: config.startDay, hour: 7, minute: 30 },
    zone,
  );

  const playerId = 'person_000001';
  // Stated where the player stated it. Where they said nothing, which the
  // creation screen never lets happen, their pronouns decide.
  const performerTitle = isPerformerTitle(config.performerTitle)
    ? config.performerTitle
    : impliedPerformerTitle(config.pronouns);

  const meta: SaveMeta = {
    id: `save_${slot}_${seed.slice(0, 8)}`,
    slot,
    schemaVersion: SAVE_SCHEMA_VERSION,
    createdAt: now,
    lastPlayedAt: now,
    playtimeSeconds: 0,
    seed,
    characterName: `${config.firstName} ${config.lastName}`,
    portrait: config.portrait,
    careerLabel: PERFORMER_NOUN[performerTitle],
    locationLabel: city.name,
    worldDateLabel: '',
    netWorthLabel: '',
    backupAvailable: false,
    appVersion: APP_VERSION,
  };

  const universe = emptyUniverse(meta, now, zone, playerId);

  const birthInstant = instantFromZoned(
    { year: config.birthYear, month: config.birthMonth, day: config.birthDay, hour: 3 },
    zone,
  );

  const player: Person = {
    id: playerId,
    saveId: meta.id,
    isPlayer: true,
    firstName: config.firstName,
    middleName: config.middleName,
    lastName: config.lastName,
    displayName: config.displayName?.trim() || `${config.firstName} ${config.lastName}`,
    portrait: config.portrait,
    pronouns: config.pronouns,
    performerTitle,
    birthInstant,
    // Who they are, kept exactly as they said it. Only the player is asked,
    // and nothing reads it to decide anything.
    raceEthnicity: [...new Set((config.raceEthnicity ?? []).filter((id) => ETHNICITY_BY_ID[id]))],
    ...(config.raceEthnicityOwn?.trim() ? { raceEthnicityOwn: config.raceEthnicityOwn.trim() } : {}),
    homeRegionId: config.homeRegionId,
    citizenshipId: config.citizenshipId,
    ...(config.secondCitizenshipId ? { secondCitizenshipId: config.secondCitizenshipId } : {}),
    currentLocationId: config.startLocationId,
    // Cleaned by the same rule the engine reads them by, so what is written
    // and what is read can never drift apart.
    interests: known(config.interests, INTEREST_BY_ID),
    genres: known(config.genres, GENRE_BY_ID),
    // Kept as the player wrote it, and printed back on their own page. It
    // decides nothing, and the character sheet says so.
    background: config.background,
    wellbeing: freshWellbeing(),
    createdAt: now,
  };
  universe.people[playerId] = player;
  idAlreadyIssued(universe, 'person', 1);

  return { universe, playerId };
}

export const WEALTH_PROFILES = WEALTH_PROFILE;
export const DAY = MS_DAY;
export { addDays, addMonths, costOfLiving };
