/**
 * SLATE — Creating a universe.
 *
 * One save is one world. Everything below builds that world from the character
 * creation choices: the person, their household, their accounts, where they
 * live, what they own, what they owe, and the surrounding world that was
 * already running before they arrived.
 */

import type {
  CareerTrack, Person, Personality, SaveMeta, SaveUniverse,
} from '../domain/model';
import { SAVE_SCHEMA_VERSION } from '../domain/model';
import { emptyAttributeSheet, effectiveAttributes, TRAIT_BY_ID, type AttributeSheet } from '../domain/attributes';
import { emptySkillSheet, type SkillSheet } from '../domain/skills';
import { CITIES } from '../content/geography';
import { costOfLiving } from '../content/tax';
import { addDays, addMonths, instantFromZoned, MS_DAY } from '../core/time';
import type { Money } from '../core/money';
import { clamp } from '../core/rng';
import { freshWellbeing } from '../systems/life';

export const APP_VERSION = '1.0.0';

// ---------------------------------------------------------------------------
// Character creation input
// ---------------------------------------------------------------------------

export type StartingWealth = 'nothing' | 'scraping' | 'modest' | 'comfortable' | 'wealthy' | 'inherited';
export type StartingHousing = 'couch' | 'roommates' | 'rental' | 'owned';

export interface NewSaveConfig {
  /** Identity */
  firstName: string;
  middleName?: string;
  lastName: string;
  displayName?: string;
  stageName?: string;
  pronouns: string;
  /** Local date of birth in the starting city's zone. */
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  homeRegionId: string;
  citizenshipId: string;

  /** Personal */
  personality: Personality;
  traits: string[];
  interests: string[];
  goals: string[];
  lifestyle: Person['lifestyle'];
  background: string;

  /** Career */
  careerTrack: CareerTrack;
  /** 0 = complete unknown, 100 = already established. */
  careerStage: number;

  /** Starting point */
  startLocationId: string;
  housing: StartingHousing;
  wealth: StartingWealth;
  startWithJob: boolean;
  startWithVehicle: boolean;
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

export function defaultConfig(): NewSaveConfig {
  return {
    firstName: 'Alex', lastName: 'Rivera', pronouns: 'they/them',
    birthYear: 2001, birthMonth: 6, birthDay: 14,
    homeRegionId: 'us-ca-losangeles', citizenshipId: 'us',
    personality: defaultPersonality(),
    traits: [], interests: ['film', 'music'], goals: ['Make something that lasts'],
    lifestyle: 'modest', background: 'Grew up outside the industry.',
    careerTrack: 'actor', careerStage: 5,
    startLocationId: 'us-ca-losangeles',
    housing: 'roommates', wealth: 'scraping',
    startWithJob: true, startWithVehicle: true,
    startYear: 2026, startMonth: 3, startDay: 2,
  };
}

const WEALTH_PROFILE: Record<StartingWealth, { checking: Money; savings: Money; cardLimit: Money; cardBalance: Money; creditScore: number; note: string }> = {
  nothing: { checking: 40_00, savings: 0, cardLimit: 0, cardBalance: 0, creditScore: 520, note: 'Nothing behind you and rent due.' },
  scraping: { checking: 1_240_00, savings: 300_00, cardLimit: 1_500_00, cardBalance: -840_00, creditScore: 610, note: 'Getting by, with a card you are carrying a balance on.' },
  modest: { checking: 4_800_00, savings: 6_500_00, cardLimit: 6_000_00, cardBalance: -420_00, creditScore: 690, note: 'A small cushion and clean credit.' },
  comfortable: { checking: 18_000_00, savings: 42_000_00, cardLimit: 20_000_00, cardBalance: 0, creditScore: 748, note: 'Genuinely comfortable, with room to take a risk.' },
  wealthy: { checking: 85_000_00, savings: 380_000_00, cardLimit: 60_000_00, cardBalance: 0, creditScore: 795, note: 'Money is not the constraint. Time and access are.' },
  inherited: { checking: 240_000_00, savings: 2_400_000_00, cardLimit: 150_000_00, cardBalance: 0, creditScore: 812, note: 'You did not earn this, and everyone in the room knows it.' },
};

export function wealthNote(wealth: StartingWealth): string {
  return WEALTH_PROFILE[wealth].note;
}

// ---------------------------------------------------------------------------
// Universe construction
// ---------------------------------------------------------------------------

export function emptyUniverse(meta: SaveMeta, now: number, zone: string, playerId: string): SaveUniverse {
  return {
    meta,
    __idCounter: 0,
    now,
    homeZone: zone,
    currentZone: zone,
    playerId,
    people: {}, relationships: {}, households: {},
    accounts: {}, transactions: [], bills: {}, creditProfiles: {}, taxYears: {},
    jobs: {}, jobOpenings: {}, jobApplications: {},
    properties: {}, structures: {}, rooms: {}, zones: {}, furnishings: {},
    propertyListings: {}, propertyOffers: {}, realEstateAgents: {},
    constructionProjects: {}, constructionPhases: {}, changeOrders: {},
    vehicles: {}, vehicleListings: {}, vehicleModifications: {}, serviceRecords: {},
    assets: {}, outfits: {}, orders: {}, pantry: {},
    healthProviders: {}, appointments: {}, insurancePolicies: {}, insuranceClaims: {},
    courses: {}, enrollments: {},
    trips: {}, flightBookings: {}, hotelBookings: {},
    socialAccounts: {}, socialPosts: {}, brandDeals: {},
    projects: {}, rights: {}, scriptDrafts: {}, roles: {}, auditions: {}, contracts: {},
    shootDays: {}, postTasks: {}, marketingCampaigns: {}, releases: {}, reviews: {},
    awardEditions: {}, awardNominations: {}, festivalSubmissions: {}, franchises: {},
    companies: {}, divisions: {}, employees: {}, equipment: {}, merchandise: {},
    scheduled: [], audits: [], history: [], decisions: {}, notifications: [],
    tutorial: { completed: [], active: [], dismissed: [], guidedMode: true, advancedMode: false },
    preferences: {
      reducedMotion: false, audioEnabled: true, audioVolume: 0.6,
      timeSpeed: 'standard', compactMode: false, showAdvancedNumbers: false,
      confirmLargePurchases: true, largePurchaseThreshold: 5_000_00,
    },
    sandbox: {
      enabled: false, maxAttributesApplied: false, allTraitsGranted: false,
      unlimitedFunds: false, ignoreAuthority: false, log: [],
    },
    idempotency: {},
    counters: {},
    engineFailures: [],
  };
}

/** Starting capability from the chosen track and stage. */
function seedCapability(config: NewSaveConfig): { attributes: AttributeSheet; skills: SkillSheet } {
  const stage = clamp(config.careerStage, 0, 100) / 100;
  const attributes = emptyAttributeSheet(8 + Math.round(stage * 22));
  const skills = emptySkillSheet(4 + Math.round(stage * 18));

  const boost = (sheet: Record<string, number>, keys: string[], amount: number) => {
    for (const key of keys) {
      if (sheet[key] === undefined) continue;
      sheet[key] = clamp(sheet[key] + amount, 0, 100);
    }
  };

  const trackBoost = 14 + stage * 34;
  switch (config.careerTrack) {
    case 'actor':
      boost(attributes, ['emotional_truth', 'charisma', 'audition_technique', 'self_tape_craft', 'memorization', 'camera_awareness', 'active_listening'], trackBoost);
      break;
    case 'writer':
      boost(skills, ['story_structure', 'dialogue', 'character_writing', 'page_speed', 'rewriting'], trackBoost);
      break;
    case 'director':
      boost(skills, ['visual_language', 'actor_direction', 'coverage_planning', 'tone_control', 'set_authority'], trackBoost);
      break;
    case 'producer':
      boost(skills, ['development_instinct', 'packaging', 'budgeting', 'scheduling', 'financing'], trackBoost);
      break;
    case 'showrunner':
      boost(skills, ['room_leadership', 'episode_breaking', 'story_structure', 'post_supervision'], trackBoost);
      break;
    case 'crew':
      boost(skills, ['camera_operation', 'grip_electric', 'script_supervision', 'editing'], trackBoost);
      break;
    case 'executive':
      boost(skills, ['slate_strategy', 'market_reading', 'negotiation', 'deal_structuring', 'corporate_finance'], trackBoost);
      break;
    case 'agent':
      boost(skills, ['negotiation', 'talent_relations', 'packaging', 'deal_structuring'], trackBoost);
      break;
    case 'creator':
      boost(skills, ['content_strategy', 'editing_software', 'on_camera_hosting', 'audience_growth'], trackBoost);
      boost(attributes, ['social_instinct', 'charisma'], trackBoost * 0.7);
      break;
    default:
      boost(skills, ['operations', 'public_speaking', 'personal_finance'], trackBoost * 0.5);
      break;
  }

  // Personality feeds a handful of attributes that are genuinely dispositional.
  attributes['charisma'] = clamp((attributes['charisma'] ?? 10) + (config.personality.extraversion - 50) * 0.25, 0, 100);
  attributes['resilience'] = clamp((attributes['resilience'] ?? 10) + (config.personality.emotionalStability - 50) * 0.3, 0, 100);
  attributes['preparation'] = clamp((attributes['preparation'] ?? 10) + (config.personality.conscientiousness - 50) * 0.3, 0, 100);
  attributes['collaboration'] = clamp((attributes['collaboration'] ?? 10) + (config.personality.agreeableness - 50) * 0.25, 0, 100);
  attributes['career_strategy'] = clamp((attributes['career_strategy'] ?? 10) + (config.personality.ambition - 50) * 0.2, 0, 100);
  skills['driving'] = clamp((skills['driving'] ?? 5) + 25, 0, 100);
  skills['cooking'] = clamp((skills['cooking'] ?? 5) + 10, 0, 100);

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
export function createUniverse(slot: 1 | 2 | 3, seed: string, config: NewSaveConfig): BootstrapResult {
  const city = CITIES.require(config.startLocationId);
  const zone = city.timeZone;
  const now = instantFromZoned(
    { year: config.startYear, month: config.startMonth, day: config.startDay, hour: 7, minute: 30 },
    zone,
  );

  const playerId = 'person_000001';
  const meta: SaveMeta = {
    id: `save_${slot}_${seed.slice(0, 8)}`,
    slot,
    schemaVersion: SAVE_SCHEMA_VERSION,
    createdAt: now,
    lastPlayedAt: now,
    playtimeSeconds: 0,
    seed,
    characterName: `${config.firstName} ${config.lastName}`,
    careerLabel: careerLabel(config.careerTrack),
    locationLabel: city.name,
    worldDateLabel: '',
    netWorthLabel: '',
    backupAvailable: false,
    appVersion: APP_VERSION,
  };

  const universe = emptyUniverse(meta, now, zone, playerId);
  const { attributes, skills } = seedCapability(config);

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
    pronouns: config.pronouns,
    birthInstant,
    homeRegionId: config.homeRegionId,
    citizenshipId: config.citizenshipId,
    currentLocationId: config.startLocationId,
    personality: config.personality,
    interests: config.interests,
    goals: config.goals,
    lifestyle: config.lifestyle,
    background: config.background,
    attributes,
    traits: config.traits.filter((t) => TRAIT_BY_ID[t]),
    skills,
    wellbeing: freshWellbeing(),
    reputation: seedReputation(config),
    careerTrack: config.careerTrack,
    representation: {},
    quote: config.careerStage > 40 ? Math.round(config.careerStage * 4_000_00) : 0,
    creditIds: [],
    nominationIds: [],
    creditScore: WEALTH_PROFILE[config.wealth].creditScore,
    tier: 'full',
    greenlightAuthority: 0,
    createdAt: now,
  };
  universe.people[playerId] = player;
  universe.__idCounter = 1;

  return { universe, playerId };
}

export function careerLabel(track: CareerTrack): string {
  const labels: Record<CareerTrack, string> = {
    none: 'Undecided', actor: 'Actor', writer: 'Writer', director: 'Director',
    producer: 'Producer', showrunner: 'Showrunner', crew: 'Crew',
    executive: 'Executive', agent: 'Agent', creator: 'Creator', civilian: 'Working life',
  };
  return labels[track];
}

/** Effective attribute sheet with traits applied, for display. */
export function playerAttributes(universe: SaveUniverse): AttributeSheet {
  const player = universe.people[universe.playerId];
  if (!player) return {};
  return effectiveAttributes(player.attributes, player.traits);
}

export const WEALTH_PROFILES = WEALTH_PROFILE;
export const DAY = MS_DAY;
export { addDays, addMonths, costOfLiving };
