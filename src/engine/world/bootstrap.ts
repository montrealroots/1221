/**
 * SLATE — Creating a universe.
 *
 * One save is one world. Everything below builds that world from the character
 * creation choices: the person, their household, their accounts, where they
 * live, what they own, what they owe, and the surrounding world that was
 * already running before they arrived.
 */

import type {
  CareerTrack, Person, Personality, Premise, SaveMeta, SaveUniverse,
} from '../domain/model';
import { SAVE_SCHEMA_VERSION, PREMISE_STATEMENT } from '../domain/model';
import {
  ALL_TRAITS, ATTRIBUTES, emptyAttributeSheet,
  attributesOf, type AttributeSheet,
} from '../domain/attributes';
import { SKILLS, emptySkillSheet, type SkillSheet } from '../domain/skills';
import { CEILING, GOAT_TRAITS } from '../content/prodigy';
import { MAX_PERSONALITY_TRAITS, PERSONALITY_TRAIT_BY_ID } from '../content/personality-traits';
import { CITIES } from '../content/geography';
import { costOfLiving } from '../content/tax';
import { addDays, addMonths, instantFromZoned, MS_DAY } from '../core/time';
import type { Money } from '../core/money';
import { clamp } from '../core/rng';
import { ETHNICITY_BY_ID } from '../content/ethnicity';
import { GENRE_BY_ID, INTEREST_BY_ID } from '../content/interests';

/** The ids on a list this build recognises, deduplicated, in the order given. */
function known(ids: readonly string[] | undefined, table: Readonly<Record<string, unknown>>): string[] {
  return [...new Set((ids ?? []).filter((id) => table[id] !== undefined))];
}
import { freshWellbeing } from '../systems/life';
import { PERFORMER_NOUN, PERFORMER_TITLES, impliedPerformerTitle, type PerformerTitle } from '../core/performer';
import { ESTATE_CITY_ID, ESTATE_COUNTRY_ID } from '@/engine/content/estate';
import { defaultFamily, type FamilyConfig } from './family';

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
  stageName?: string;
  pronouns: string;
  /**
   * Which of the two the business lists them under. Theirs to state; absent,
   * pronouns decide.
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
  personality: Personality;
  /** Personality: who they are. Chosen, up to four, and they cost. */
  personalityTraits: string[];
  traits: string[];
  interests: string[];
  /** Genres they love watching. Carries nothing; see `content/interests.ts`. */
  genres: string[];
  goals: string[];
  lifestyle: Person['lifestyle'];
  background: string;

  /**
   * Career. Everyone starts as an actor or actress; the other professions
   * are unlocked in the game with experience. This is how far along the
   * acting career already is: 0 = complete unknown, 100 = already established.
   */
  careerStage: number;

  /**
   * The family.
   *
   * Just the parents, and a twin where the player had one. The land is
   * theirs, the company carries their name, and until this existed the save
   * talked about them constantly without any of them being in it.
   */
  family: FamilyConfig;

  /**
   * The company.
   *
   * There is one decision here and it is the name. The shop is an independent
   * production company, founded and wholly owned by the character, and it
   * opens on the morning the save starts. The strike ended every other one, so
   * this is the only production company trading.
   */
  companyName: string;

  /** Starting point */
  startLocationId: string;
  wealth: StartingWealth;
  /** World start date, local to the starting city. */
  startYear: number;
  startMonth: number;
  startDay: number;

}

export function defaultPersonality(): Personality {
  return {
    openness: 55, conscientiousness: 55, extraversion: 55,
    agreeableness: 55, emotionalStability: 55, ambition: 60, riskTolerance: 50,
  };
}

/**
 * A config whose two passports do not name the same country.
 *
 * Everybody created through the game holds the family's Icelandic one on top
 * of whatever their birth gives them, and that is set in `defaultConfig` and
 * on the screen. Somebody born Icelandic would otherwise be handed it a second
 * time, which is not dual citizenship, it is the same passport printed twice.
 *
 * Only the duplicate is dropped. A second passport somebody deliberately set
 * to something else is theirs and is left alone — the rule about Iceland is a
 * rule about this game's creation screen, not about what a person can be.
 */
export function withSettledCitizenship(config: NewSaveConfig): NewSaveConfig {
  if (config.secondCitizenshipId !== config.citizenshipId) return config;
  return { ...config, secondCitizenshipId: undefined };
}

export function defaultConfig(): NewSaveConfig {
  return {
    firstName: 'Alex', lastName: 'Rivera', pronouns: 'they/them',
    birthYear: 2001, birthMonth: 6, birthDay: 14,
    raceEthnicity: [],
    // Born on the family land, living on it, and holding its passport. None of
    // the three is a question any screen asks any more.
    homeRegionId: ESTATE_CITY_ID, livesWhereBorn: true,
    citizenshipId: ESTATE_COUNTRY_ID,
    personality: defaultPersonality(),
    personalityTraits: [], traits: [], interests: ['film', 'television'], genres: [], goals: ['Make something that lasts'],
    lifestyle: 'modest', background: 'Grew up outside the industry.',
    careerStage: 5,
    family: defaultFamily(),
    companyName: '',
    // Home base is the family land, and it is not a choice on any screen.
    startLocationId: ESTATE_CITY_ID,
    wealth: 'scraping',
    startYear: 2026, startMonth: 3, startDay: 2,
  };
}

/**
 * What the company has in the bank the morning it opens.
 *
 * Ten million, which is roughly one modest feature or a season of something
 * cheap — enough to make a first thing without asking anybody, and nowhere
 * near enough to make a second one if the first does not come back. It is not
 * the character's own money and it is not a reward: it is the starting
 * position, the same way the wealth level is.
 *
 * At the independent's overhead it is a long runway, so the clock on this save
 * is not the rent. It is what a production costs.
 */
export const FOUNDING_CAPITAL: Money = 10_000_000_00;

/**
 * What passes through the founder's account on the way in: the capital above,
 * plus the cost of opening the doors. It is theirs for the few lines it takes
 * to found the company and then it is the company's.
 */
export const FOUNDING_STAKE: Money = FOUNDING_CAPITAL + 220_000_00;

/** The shop every save opens with. There is no choice and no other shape. */
export const FOUNDING_SHINGLE = 'indie';

/**
 * What it says it is for, on the morning it opens: nothing yet.
 *
 * A company that has never made anything has not earned a remit, and picking
 * one before the first picture would be a promise about work that does not
 * exist. It is declared later, by what gets made.
 */
export const FOUNDING_REMIT = 'anything';

const WEALTH_PROFILE: Record<StartingWealth, { checking: Money; savings: Money; cardLimit: Money; cardBalance: Money; creditScore: number; note: string }> = {
  nothing: { checking: 40_00, savings: 0, cardLimit: 0, cardBalance: 0, creditScore: 520, note: 'Nothing behind you and rent due.' },
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
  meta: SaveMeta, now: number, zone: string, playerId: string, premise: Premise,
): SaveUniverse {
  return {
    meta,
    premise,
    __idCounter: 0,
    now,
    homeZone: zone,
    currentZone: zone,
    playerId,
    people: {}, households: {}, bonds: {},
    accounts: {}, transactions: [],
    properties: {},
    scheduled: [], audits: [], history: [], decisions: {}, notifications: [],
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

/** Starting capability from the chosen track and stage. */
/**
 * The instrument.
 *
 * There is nothing to seed. They are the best living actor or actress, so
 * every one of the 88 acting attributes starts at the ceiling, along with the
 * ordinary life skills anybody has. Nothing on the creation screen moves any
 * of it, because there is nowhere for it to go.
 *
 * What creation still decides is everything the instrument does not cover:
 * who they are, where they live, and what they are starting with.
 */
/**
 * Every trait in the game, held at once.
 *
 * For anybody else this list is incoherent: half of these are alternatives to
 * the other half, and every one of them is paid for with a weakness somewhere.
 * The prodigy flag is what makes it hold — it does not add anything, it stops
 * a trait subtracting, so the sheet that started at the ceiling stays there.
 * Nobody else in the save gets this.
 */
function everyTrait(): string[] {
  return ALL_TRAITS.map((trait) => trait.id);
}

function seedCapability(): { attributes: AttributeSheet; skills: SkillSheet } {
  const attributes = emptyAttributeSheet(CEILING);
  const skills = emptySkillSheet(CEILING);
  for (const attribute of ATTRIBUTES) attributes[attribute.id] = CEILING;
  for (const skill of SKILLS) skills[skill.id] = CEILING;
  return { attributes, skills };
}

function seedReputation(config: NewSaveConfig) {
  const stage = clamp(config.careerStage, 0, 100) / 100;
  return {
    publicFame: Math.round(stage * stage * 42),
    audienceAppeal: 50,
    professionalReputation: Math.round(stage * 46),
    reliability: 55 + Math.round(config.personality.conscientiousness * 0.2),
    prestige: Math.round(stage * stage * 30),
    industryDemand: Math.round(stage * 38),
    controversy: 0,
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

  // Actor, or actress. The one fact the whole game is about, so it is settled
  // here, once, and written into the save rather than worked out again at
  // every place that needs to print it. Stated is stated; where the player
  // said nothing, their pronouns decided and the save records that it was the
  // pronouns rather than them.
  const stated = config.performerTitle;
  const performerTitle: PerformerTitle = stated ?? impliedPerformerTitle(config.pronouns);
  const premise: Premise = {
    kind: 'actor-actress-life-simulator',
    statement: PREMISE_STATEMENT,
    titles: PERFORMER_TITLES,
    equalStanding: true,
    playerTitle: performerTitle,
    playerTitleSource: stated ? 'stated' : 'implied',
    recordedAt: now,
  };

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
    performerTitle,
    careerLabel: careerLabel('actor', performerTitle),
    locationLabel: city.name,
    worldDateLabel: '',
    netWorthLabel: '',
    backupAvailable: false,
    appVersion: APP_VERSION,
  };

  const universe = emptyUniverse(meta, now, zone, playerId, premise);

  const { attributes, skills } = seedCapability();

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
    stageName: config.stageName?.trim() || undefined,
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
    personality: config.personality,
    // Cleaned by the same rule the engine reads them by, so what is written
    // and what is read can never drift apart.
    interests: known(config.interests, INTEREST_BY_ID),
    genres: known(config.genres, GENRE_BY_ID),
    goals: config.goals,
    lifestyle: config.lifestyle,
    background: config.background,
    attributes,
    // Every acting trait in the game. Nothing was picked and nothing could
    // have been: the best living actor or actress holds all of them.
    traits: everyTrait(),
    // Personality is the opposite: the only thing on this character that was
    // genuinely chosen, and the only trait set that still costs them.
    personalityTraits: config.personalityTraits
      .filter((id) => PERSONALITY_TRAIT_BY_ID[id])
      .slice(0, MAX_PERSONALITY_TRAITS),
    skills,

    // The three that say what kind of actor or actress. There is nothing
    // else to be the best at any more: the writing, the directing, the
    // producing and the showrunning went with the half of the game that
    // used them.
    goatTraits: GOAT_TRAITS.map((t) => t.id),
    prodigy: true,
    wellbeing: freshWellbeing(),
    reputation: seedReputation(config),
    careerTrack: 'actor',
    creditScore: WEALTH_PROFILE[config.wealth].creditScore,
    createdAt: now,
  };
  universe.people[playerId] = player;
  universe.__idCounter = 1;

  return { universe, playerId };
}

/**
 * The track as a word, in the word this person uses.
 *
 * The industry has always kept actor and actress apart — separate awards,
 * separate categories, separate columns in a trade paper — so the label is
 * never printed without knowing whose it is. Every other track reads the same
 * for everybody.
 */
export function careerLabel(track: CareerTrack, title: PerformerTitle): string {
  const labels: Record<CareerTrack, string> = {
    none: 'Undecided', actor: PERFORMER_NOUN[title], writer: 'Writer', director: 'Director',
    producer: 'Producer', showrunner: 'Showrunner', crew: 'Crew',
    executive: 'Executive', agent: 'Agent', creator: 'Creator', civilian: 'Working Life',
  };
  return labels[track];
}

/** Effective attribute sheet with traits applied, for display. */
export function playerAttributes(universe: SaveUniverse): AttributeSheet {
  const player = universe.people[universe.playerId];
  if (!player) return {};
  return attributesOf(player);
}

export const WEALTH_PROFILES = WEALTH_PROFILE;
export const DAY = MS_DAY;
export { addDays, addMonths, costOfLiving };
