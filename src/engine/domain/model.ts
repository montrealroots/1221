/**
 * SLATE — The domain model.
 *
 * Every stateful thing in the universe. Rule: each record carries `saveId`, and
 * the store refuses to hand back a record whose saveId does not match the
 * universe you asked from. One save is one world; three saves are three worlds
 * that can never see each other.
 */

import type { Instant, TimeZone } from '../core/time';
import type { Money } from '../core/money';
import type { Account, LedgerTransaction } from '../core/ledger';
import type { ScheduledItem } from '../core/scheduler';
import type { AuditRecord, HistoryRecord } from '../core/audit';
import type { PerformerTitle } from '../core/performer';
import type { ProfessionId } from '../content/professions';
import type { AttributeSheet } from './attributes';
import type { SkillSheet } from './skills';

export type Id = string;

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

export type SimulationTier = 'full' | 'active' | 'background' | 'dormant';

export interface Personality {
  /** Big five plus two industry-relevant dials, all 0-100. */
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  emotionalStability: number;
  ambition: number;
  riskTolerance: number;
}

export interface Wellbeing {
  /** 0-100. Drains with activity, restored by sleep and rest. */
  energy: number;
  /** 0-100. High stress degrades performance and relationships. */
  stress: number;
  /** Hours of sleep owed. Accumulates when nights are short. */
  sleepDebt: number;
  /** 0-100 general outlook. Feeds performance and relationship tone. */
  morale: number;
  /** 0-100 physical condition. Not a medical diagnosis, a game state. */
  condition: number;
  /** 0-100 fitness, moved by exercise and lifestyle. */
  fitness: number;
  /** Accumulated travel fatigue, decays with time in one place. */
  travelFatigue: number;
  /** Hunger 0-100 where 100 is fed. */
  nourishment: number;
  /**
   * 0-100, where 100 is clean and rested-looking. Falls through the day and
   * faster on a shoot; a shower puts it back. Rooms notice.
   */
  hygiene: number;
}

/**
 * What somebody privately thinks, which is not the same as what they say.
 *
 * Ego decides how an offer lands: to somebody who has been told for twenty
 * years that they are the reason a picture gets made, a lowball is not an
 * opening position, it is an insult. Loyalty is what you have banked with
 * them personally. Grudges are the things they have not forgotten, and they
 * are acted on later, when it costs you something.
 */
export interface Disposition {
  /** 0-100. How much of themselves is invested in being treated a certain way. */
  ego: number;
  /** 0-100 toward the player specifically. Fifty is a stranger. */
  loyalty: number;
  /** What they have not forgotten. */
  grudges: { at: Instant; reason: string; weight: number; refType?: string; refId?: Id; actedOnAt?: Instant }[];
  /** What you did right by them, which they also remember. */
  favours: { at: Instant; reason: string; weight: number }[];
  /** When they last did something about how they feel. */
  lastActedAt?: Instant;
  /** They will not read anything of yours until this passes. */
  refusingUntil?: Instant;
}

export interface Reputation {
  /** How many people know who you are, 0-100. */
  publicFame: number;
  /** Whether the people who know you like you, 0-100. */
  audienceAppeal: number;
  /** What the industry thinks of your work, 0-100. */
  professionalReputation: number;
  /** Whether producers believe you will finish the job, 0-100. */
  reliability: number;
  /** Awards-and-critics standing, 0-100. */
  prestige: number;
  /** How many people currently want to hire you, 0-100. */
  industryDemand: number;
  /** Active negative attention, 0-100. Decays slowly. */
  controversy: number;
}

export type CareerTrack =
  | 'none' | 'actor' | 'writer' | 'director' | 'producer' | 'showrunner'
  | 'crew' | 'executive' | 'agent' | 'creator' | 'civilian';

/** Standing in one unlocked profession. Level is derived from xp. */
export interface ProfessionProgress {
  unlockedAt: Instant;
  /** Experience earned in this profession since unlocking it. */
  xp: number;
  /** Trait ids picked for this profession, one per open slot. */
  traitIds: string[];
}

export interface Representation {
  agentId?: Id;
  managerId?: Id;
  lawyerId?: Id;
  publicistId?: Id;
  agencyName?: string;
  /** Commission as a decimal, e.g. 0.10. */
  agentCommission?: number;
  managerCommission?: number;
  signedAt?: Instant;
}

export type DocumentKind = 'passport' | 'license';

/** A passport or a driver's license, as the authority issued it. */
export interface IdentityDocument {
  kind: DocumentKind;
  /** The country whose authority issued it. */
  issuerId: string;
  /** The office, as it names itself: HM Passport Office, California DMV. */
  authority: string;
  number: string;
  issuedAt: Instant;
  expiresAt: Instant;
  /** `applied` is a renewal or a first application still at the office; a learner between the tests is `applied` too. */
  status: 'valid' | 'expired' | 'lost' | 'applied';
  /** A license: the state or province whose office issued it. */
  regionId?: string;
  /** An emergency travel document from a consulate: good for the journey home and nothing else. */
  emergency?: boolean;
  appliedAt?: Instant;
  readyAt?: Instant;
  /** A learner who passed the knowledge test: when the road test is booked. */
  roadTestAt?: Instant;
}

export interface IdentityPapers {
  passport?: IdentityDocument;
  secondPassport?: IdentityDocument;
  license?: IdentityDocument;
}

export interface Person {
  id: Id;
  saveId: Id;
  isPlayer: boolean;

  firstName: string;
  middleName?: string;
  lastName: string;
  /** What the player and NPCs call them day to day. */
  displayName: string;
  /** Professional credit name, when different from the legal name. */
  stageName?: string;
  pronouns: string;
  /**
   * Actor or actress, for the award categories that are named for one.
   * Nothing in the game writes this yet; absent, pronouns decide. Optional
   * so every save loads and is routed by the same rule.
   */
  performerTitle?: PerformerTitle;
  /**
   * Their headshot, as a data URL.
   *
   * Stored on the person rather than beside the save, because it belongs to
   * them: it follows them onto a credit, a casting shortlist and the slot
   * card. Always re-encoded to a fixed frame before it gets here, so this is
   * tens of kilobytes rather than whatever came off a phone.
   */
  portrait?: string;

  birthInstant: Instant;
  /** Reference city id where they are from. */
  homeRegionId: string;
  citizenshipId: string;
  /**
   * A second passport. Born in one country, naturalised in the one they live
   * in now, and they carry both for the rest of their life. Absent for most
   * people, and never the same as the first.
   */
  secondCitizenshipId?: string;
  /**
   * The papers in their wallet: a passport for each citizenship, and a
   * driver's license. Issued by the real authority for where they are from
   * (content/documents). Absent on a person nothing has asked about yet;
   * `ensurePapers` issues them the first time it matters.
   */
  documents?: IdentityPapers;
  /**
   * Cards that cannot be applied for, offered. Product id to the instant of
   * the invitation. The Centurion is the reason this exists.
   */
  invitations?: Record<string, Instant>;
  /** Reference city id where they currently are. */
  currentLocationId: string;
  /**
   * Where in the city. A place id from content/places, a property id when you
   * are at home, or absent when you are simply out in the city.
   */
  currentPlaceId?: string;
  /**
   * What they privately think of you. Absent until something has happened
   * between you, and never shown to the player as a number.
   */
  disposition?: Disposition;
  /** Property id of their home, when they have one. */
  residenceId?: Id;
  householdId?: Id;

  /**
   * When they last sat in a chair and had it cut.
   *
   * A cut lasts about six weeks before it stops looking like one, and the
   * mirror and the room both notice. Absent on somebody who has never been to
   * a salon, which reads as freshly cut rather than as a gap.
   */
  groomedAt?: Instant;

  personality: Personality;
  interests: string[];
  goals: string[];
  lifestyle: 'frugal' | 'modest' | 'comfortable' | 'lavish';
  background: string;

  attributes: AttributeSheet;
  traits: string[];
  /**
   * Who they are, as against what they are good at.
   *
   * The craft sheet above is automatic for the founder — the best living
   * writer, director, producer, showrunner and actor holds every trait in
   * every one of those disciplines. None of that says whether they sleep,
   * hold a grudge or can be alone in a house. These are chosen, there are
   * four of them, and unlike the craft traits they cost what they cost.
   */
  personalityTraits?: string[];
  skills: SkillSheet;

  /**
   * The producer's instrument, and the traits that go with it.
   *
   * A second, separate set from the acting one above. The player has it; so do
   * the executives they hire. Anybody who is only ever in front of a camera
   * does not, and reading it on them would be reading a number that was never
   * set. Absent means not a producer.
   */
  founder?: Record<string, number>;
  founderTraits?: string[];
  /** Where they came from before they were doing this. */
  founderBackground?: string;

  /**
   * The once-in-a-lifetime one, and there is exactly one of them in a save.
   *
   * They hold every attribute, every skill and every trait in the game at the
   * top of its scale at the same time. For anybody else that combination is
   * incoherent — most traits are alternatives to each other and all of them
   * are paid for with a weakness somewhere. The flag says the payment does not
   * apply here: it never adds anything, it only refuses to subtract.
   */
  prodigy?: boolean;

  wellbeing: Wellbeing;
  reputation: Reputation;

  careerTrack: CareerTrack;
  /** Asset ids currently on. Absent means nothing has been put on deliberately. */
  wearing?: Id[];
  /**
   * Which rack a shop leads with, and which side the dressing room offers
   * first. Nothing is refused either way: 'both' shows everything, and even
   * on 'men' or 'women' the whole catalog is one toggle away and anything
   * bought can be worn. Absent means it has never been set, and the actor or
   * actress title decides until it is.
   */
  wardrobePreference?: 'men' | 'women' | 'both';
  /**
   * Industry experience: earned from auditions, shoot days, credits, shifts
   * and the rest, spent to unlock professions. Absent on people from before
   * professions existed and on NPCs, and read as zero.
   */
  industryXp?: number;
  /** The professions they have unlocked, by id. Absent reads as none. */
  professions?: Partial<Record<ProfessionId, ProfessionProgress>>;
  representation: Representation;
  /** Market rate for one project, in cents. Drives offers. */
  quote: Money;
  /** Project ids they have credits on. */
  creditIds: Id[];
  /** Award nomination ids. */
  nominationIds: Id[];

  creditScore: number;
  /** Primary spending account. */
  primaryAccountId?: Id;

  /**
   * What this person remembers, as facts rather than dialogue. Absent reads
   * as nothing yet.
   */
  facts?: PersonFact[];
  /** Training history and how sore they are. Absent reads as untrained. */
  training?: TrainingRecord;

  /** Where an NPC sits in the simulation budget. */
  tier: SimulationTier;
  /** Archetype key used to generate consistent NPC behavior. */
  archetype?: string;
  /** Professional role for industry NPCs, e.g. 'casting_director'. */
  industryRole?: string;
  /**
   * The public record this person came from, when they are a real person.
   *
   * Set the first time the player deals with somebody on the roster, which is
   * when they stop being reference data and start being someone in the save
   * who can be offered a part, say no, sign a contract and take a credit.
   * Everything the game shows about them beyond that point is this save's own
   * history, and the screens say so.
   */
  recordQid?: string;
  /** Company the NPC works for, if any. */
  affiliationId?: Id;
  /** Authority to greenlight, in cents. Zero means no authority. */
  greenlightAuthority: Money;

  /** When they last deliberately slept, so the world knows to fill the gap. */
  lastSleptAt?: Instant;
  /** When they last deliberately ate. */
  lastAteAt?: Instant;

  aliveUntil?: Instant;

  /**
   * The height and weight this body ends up at, in centimetres and kilograms.
   *
   * Set once, at creation, and only for the player: it is the one physical
   * fact the player chooses. A character who starts young is smaller than
   * this and grows to exactly it. Absent on everybody else, and absent on a
   * save from before there was a way to say.
   */
  adultHeightCm?: number;
  adultWeightKg?: number;

  /**
   * Where this person's name comes from, and whether they are somebody's
   * mother or somebody's father.
   *
   * The heritage is a naming tradition and nothing else: it carries no
   * attribute, no skill and no advantage anywhere in the game. The gender is
   * carried so a family reads as a family — a mother, a father, a brother, a
   * sister — rather than as a list of people with a relationship type.
   */
  heritageId?: string;
  gender?: 'female' | 'male' | 'nonbinary';
  /**
   * The heritage of each of the two people who raised this character, so a
   * family of two traditions names its children out of both. Player only.
   */
  parentHeritageIds?: readonly [string, string];

  createdAt: Instant;
}

// ---------------------------------------------------------------------------
// Relationships
// ---------------------------------------------------------------------------

export type RelationshipType =
  | 'stranger' | 'acquaintance' | 'friend' | 'close_friend' | 'best_friend'
  | 'colleague' | 'mentor' | 'mentee' | 'rival' | 'enemy'
  | 'dating' | 'engaged' | 'spouse' | 'ex_partner' | 'separated'
  | 'parent' | 'child' | 'sibling' | 'relative' | 'guardian' | 'ward'
  | 'employer' | 'employee' | 'representation' | 'client' | 'neighbour';

export interface RelationshipDimensions {
  /** How well they know each other, 0-100. Gates everything else. */
  familiarity: number;
  /** Warmth, 0-100. */
  affection: number;
  /** Whether they rely on each other, 0-100. */
  trust: number;
  /** Professional and personal regard, 0-100. */
  respect: number;
  /** Underlying fit, mostly fixed, 0-100. */
  compatibility: number;
  /** Willingness to make sacrifices, 0-100. */
  commitment: number;
  /** Unresolved friction, 0-100. High conflict poisons the rest. */
  conflict: number;
}

export interface RelationshipMemory {
  id: Id;
  at: Instant;
  /** 'date' | 'argument' | 'worked_together' | 'gift' | 'betrayal' | ... */
  kind: string;
  summary: string;
  /** Signed effect on affection at the time. */
  impact: number;
  /** How long this stays salient, in days. Big events never fade. */
  decayDays: number;
  /** Refs to what it was about. */
  refType?: string;
  refId?: Id;
}

export interface Relationship {
  id: Id;
  saveId: Id;
  /** Canonically the lower id first, so a pair has exactly one record. */
  aId: Id;
  bId: Id;
  type: RelationshipType;
  /** Type as seen from a's side when asymmetric (parent/child). */
  reciprocalType?: RelationshipType;
  dimensions: RelationshipDimensions;
  /** Whether the wider world knows this relationship exists. */
  isPublic: boolean;
  exclusive: boolean;
  since: Instant;
  lastInteractionAt: Instant;
  memories: RelationshipMemory[];
  /** Set when the relationship ended. */
  endedAt?: Instant;
  endReason?: string;
}

export interface Household {
  id: Id;
  saveId: Id;
  name: string;
  memberIds: Id[];
  /** Members who depend on the household financially. */
  dependentIds: Id[];
  headIds: Id[];
  residenceId?: Id;
  /** Shared account for household expenses. */
  jointAccountId?: Id;
  formedAt: Instant;
  dissolvedAt?: Instant;
  historyNotes: { at: Instant; note: string }[];
}

// ---------------------------------------------------------------------------
// Finance
// ---------------------------------------------------------------------------

export type BillFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual' | 'once';

export interface Bill {
  id: Id;
  saveId: Id;
  payerId: Id;
  name: string;
  category: string;
  amount: Money;
  frequency: BillFrequency;
  nextDueAt: Instant;
  autopayAccountId?: Id;
  /** Account the money goes to conceptually, e.g. a mortgage account. */
  targetAccountId?: Id;
  active: boolean;
  /** Payments missed in a row. Drives credit damage and shutoffs. */
  missedCount: number;
  lastPaidAt?: Instant;
  refType?: string;
  refId?: Id;
  createdAt: Instant;
  endsAt?: Instant;
}

export interface CreditProfile {
  personId: Id;
  score: number;
  /** Fraction of revolving credit in use, 0-1. */
  utilisation: number;
  onTimePayments: number;
  latePayments: number;
  accountsOpen: number;
  oldestAccountAt: Instant;
  hardInquiries: { at: Instant; reason: string }[];
  derogatory: { at: Instant; kind: string; note: string }[];
}

export interface TaxYearRecord {
  id: Id;
  saveId: Id;
  personId: Id;
  year: number;
  grossIncome: Money;
  withheld: Money;
  federalTax: Money;
  stateTax: Money;
  localTax: Money;
  ficaTax: Money;
  selfEmploymentTax: Money;
  deductions: Money;
  /** Positive means a refund is owed to the player. */
  balance: Money;
  filedAt?: Instant;
  settledAt?: Instant;
  jurisdictionPath: string[];
}

// ---------------------------------------------------------------------------
// Property
// ---------------------------------------------------------------------------

export type PropertyKind =
  | 'apartment' | 'condo' | 'townhouse' | 'house' | 'villa' | 'mansion'
  | 'estate' | 'penthouse' | 'ranch' | 'farm' | 'cabin' | 'land'
  | 'private_island' | 'office' | 'studio_lot' | 'sound_stage' | 'retail';

export type TenureKind = 'owned' | 'rented' | 'leased' | 'under_construction';

export interface Property {
  id: Id;
  saveId: Id;
  ownerId?: Id;
  ownerKind: 'person' | 'company' | 'none';
  kind: PropertyKind;
  name: string;
  addressLine: string;
  locationId: string;
  neighbourhoodId?: string;
  tenure: TenureKind;
  bedrooms: number;
  bathrooms: number;
  interiorSqft: number;
  lotSqft: number;
  yearBuilt: number;
  features: string[];
  /** Current market value in cents; moves with the market model. */
  marketValue: Money;
  purchasePrice?: Money;
  purchasedAt?: Instant;
  /** Monthly rent when rented, in cents. */
  monthlyRent?: Money;
  leaseEndsAt?: Instant;
  mortgageAccountId?: Id;
  /** 0-100 physical condition; decays without maintenance. */
  condition: number;
  annualPropertyTaxRate: number;
  hoaMonthly?: Money;
  insurancePolicyId?: Id;
  /** Structures on the parcel. */
  structureIds: Id[];
  /** Covered spaces for road vehicles. Absent on a home from before, and read from its kind, features and structures instead. */
  garageSpaces?: number;
  /** The longest boat a private dock here takes, in feet. Absent means no dock. */
  dockFeet?: number;
  isPrimaryResidence: boolean;
  /** Rented out to tenants for income. */
  rentedOut?: { monthlyIncome: Money; tenantName: string; since: Instant };
  /** When the property is a studio lot or a stage: the plant, and who is on it. */
  lot?: StudioPlant;
  listedForSale?: { price: Money; since: Instant; agentId?: Id };
  soldAt?: Instant;
  createdAt: Instant;
}

/** A studio lot the player owns, as a working business. */
export interface StudioPlant {
  stages: number;
  /** Square feet of the largest stage. */
  largestStageSqft: number;
  /** What SLATE charges the world for a stage day here, in cents. */
  stageDayRate: Money;
  /** Monthly cost of keeping the lights on, in cents. */
  monthlyOverhead: Money;
  facilities: ('backlot' | 'water_tank' | 'led_volume' | 'post' | 'scoring_stage' | 'workshops' | 'offices')[];
  /** World productions on the lot right now. */
  tenants: { projectTitle: string; projectId?: Id; stages: number; from: Instant; to: Instant; dayRate: Money }[];
  /** Everything the lot has taken in and paid out. */
  lifetimeIncome: Money;
  lifetimeOverhead: Money;
  /** 0-1 share of stage days in use over the last close. */
  occupancy: number;
  lastClosedAt?: Instant;
}

export interface Structure {
  id: Id;
  saveId: Id;
  propertyId: Id;
  kind: 'main_house' | 'guest_house' | 'garage' | 'pool_house' | 'office' | 'studio' | 'gym' | 'theater' | 'workshop' | 'barn';
  name: string;
  floors: number;
  sqft: number;
  condition: number;
  roomIds: Id[];
  builtAt?: Instant;
}

export interface Room {
  id: Id;
  saveId: Id;
  structureId: Id;
  floor: number;
  kind: string;
  name: string;
  sqft: number;
  /** Design theme applied, if any. */
  themeId?: string;
  finishes: { walls?: string; floor?: string; ceiling?: string; lighting?: string };
  zoneIds: Id[];
  /** 0-100 how finished and pleasant the room is. Feeds lifestyle quality. */
  quality: number;
}

export interface Zone {
  id: Id;
  saveId: Id;
  roomId: Id;
  name: string;
  purpose: string;
  furnishingIds: Id[];
}

export interface Furnishing {
  id: Id;
  saveId: Id;
  zoneId?: Id;
  roomId?: Id;
  propertyId: Id;
  catalogId: string;
  name: string;
  category: string;
  purchasePrice: Money;
  currentValue: Money;
  condition: number;
  purchasedAt: Instant;
  /** Contribution to the room's quality score. */
  qualityContribution: number;
  /**
   * The owned thing this furnishing is. A sofa is both: a record that lifts
   * the quality of the room it stands in, and an object you own, sit on, wear
   * out and one day replace. This links the two so they cannot disagree.
   */
  assetId?: Id;
}

export type ListingStatus = 'active' | 'pending' | 'sold' | 'withdrawn' | 'expired';

export interface PropertyListing {
  id: Id;
  saveId: Id;
  propertyId: Id;
  askingPrice: Money;
  status: ListingStatus;
  agentId?: Id;
  listedAt: Instant;
  daysOnMarket: number;
  /** Sellers are more flexible the longer a listing sits. */
  sellerMotivation: number;
  openHouseAt?: Instant;
  viewedByPlayer: boolean;
}

export type OfferStatus = 'draft' | 'submitted' | 'countered' | 'accepted' | 'rejected' | 'withdrawn' | 'expired' | 'closed';

export interface PropertyOffer {
  id: Id;
  saveId: Id;
  listingId: Id;
  propertyId: Id;
  buyerId: Id;
  amount: Money;
  earnestMoney: Money;
  financingKind: 'cash' | 'conventional' | 'jumbo';
  downPayment: Money;
  contingencies: ('inspection' | 'financing' | 'appraisal' | 'sale_of_home')[];
  status: OfferStatus;
  submittedAt: Instant;
  respondBy: Instant;
  counterAmount?: Money;
  closingAt?: Instant;
  inspectionAt?: Instant;
  inspectionFindings?: { item: string; severity: 'minor' | 'moderate' | 'major'; estimate: Money }[];
  appraisalValue?: Money;
  /** What the lender will not cover after a low appraisal; the buyer brings it to the table. */
  appraisalGap?: Money;
  closingCosts?: Money;
  agentId?: Id;
  /** How many times the seller has come back with a number. */
  counterRounds?: number;
  /** When the inspection contingency was answered, by you or by silence. */
  inspectionDecidedAt?: Instant;
  /** The seller allows one delay to closing. */
  postponedOnce?: boolean;
  closedAt?: Instant;
  history: { at: Instant; note: string }[];
}

export interface RealEstateAgent {
  id: Id;
  saveId: Id;
  personId: Id;
  brokerage: string;
  specialties: PropertyKind[];
  markets: string[];
  /** 0-100. */
  experience: number;
  negotiation: number;
  reputation: number;
  commissionRate: number;
  /** Active clients; a busy agent is slower. */
  workload: number;
  closedDeals: number;
}

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

export type ConstructionPhaseId =
  | 'concept' | 'architect' | 'design' | 'plans' | 'zoning' | 'permits'
  | 'bids' | 'contracts' | 'site_work' | 'foundation' | 'framing'
  | 'mechanical' | 'electrical' | 'plumbing' | 'envelope' | 'insulation'
  | 'drywall' | 'flooring' | 'cabinetry' | 'fixtures' | 'interior_finish'
  | 'landscaping' | 'final_inspection' | 'punch_list' | 'handover';

export interface ConstructionPhase {
  id: Id;
  saveId: Id;
  projectId: Id;
  phase: ConstructionPhaseId;
  name: string;
  /** Phases that must be complete before this can start. */
  dependsOn: ConstructionPhaseId[];
  status: 'blocked' | 'ready' | 'in_progress' | 'complete' | 'failed_inspection';
  budgeted: Money;
  spent: Money;
  plannedDays: number;
  actualDays: number;
  startedAt?: Instant;
  completedAt?: Instant;
  contractorName?: string;
  /** Reason the phase slipped, surfaced in "why did the schedule move?". */
  notes: { at: Instant; note: string; deltaDays?: number; deltaCost?: Money }[];
}

export interface ChangeOrder {
  id: Id;
  saveId: Id;
  projectId: Id;
  phase: ConstructionPhaseId;
  description: string;
  costDelta: Money;
  daysDelta: number;
  status: 'proposed' | 'approved' | 'rejected';
  proposedAt: Instant;
  decidedAt?: Instant;
  initiatedBy: 'player' | 'contractor' | 'inspector';
}

export interface ConstructionProject {
  id: Id;
  saveId: Id;
  ownerId: Id;
  propertyId: Id;
  name: string;
  architectName?: string;
  generalContractor?: string;
  status: 'planning' | 'permitting' | 'building' | 'complete' | 'stalled' | 'abandoned';
  budget: Money;
  contingency: Money;
  spent: Money;
  startedAt: Instant;
  targetCompletionAt: Instant;
  actualCompletionAt?: Instant;
  phaseIds: Id[];
  changeOrderIds: Id[];
  /** Planned structures, realized as the build progresses. */
  plannedStructures: { kind: Structure['kind']; sqft: number; floors: number }[];
}

// ---------------------------------------------------------------------------
// Vehicles
// ---------------------------------------------------------------------------

export interface VehicleConfiguration {
  paint: string;
  wheels: string;
  interior: string;
  /** Factory option codes selected at build. */
  options: string[];
  /** Aftermarket modification ids currently installed. */
  modificationIds: Id[];
}

/**
 * What kind of thing a vehicle is. A car and a motorcycle count miles on the
 * road; a boat and a jet count hours, cost money standing still, and are
 * bought, insured and worked on by people who do only that.
 */
export type VehicleKind = 'car' | 'motorcycle' | 'boat' | 'jet';

/**
 * Where a vehicle is kept when it is not being used. A road vehicle in a
 * home's garage, on its driveway, on the street or in a paid unit; a boat at
 * a marina berth, in a dry stack, on a trailer at home or at a private dock;
 * an aircraft in a private or shared hangar, on a tie-down, or on the ramp
 * of an airport it was flown to.
 */
export type KeepingKind =
  | 'garage' | 'driveway' | 'street' | 'storage_unit'
  | 'berth' | 'dry_stack' | 'trailer' | 'private_dock'
  | 'hangar' | 'shared_hangar' | 'tie_down' | 'transient';

/**
 * A place in the queue for a slip at a marina, for one boat at one length.
 * The deposit is held while you wait and comes back whichever way it ends.
 * A slip that comes free is offered to whoever is first, and holds for a
 * week; letting it go puts you at the back rather than off the list.
 */
export interface BerthWaitlist {
  id: Id;
  saveId: Id;
  marinaPlaceId: string;
  cityId: string;
  /** The band you are waiting in, by the longest boat it takes, in feet. */
  bandFeet: number;
  vehicleId: Id;
  /** How many are in front of you. Zero means the next one is yours. */
  ahead: number;
  joinedAt: Instant;
  /** Held while you wait, returned when it ends. */
  deposit: Money;
  status: 'waiting' | 'offered' | 'taken' | 'left' | 'lapsed';
  offeredAt?: Instant;
  offerExpiresAt?: Instant;
  /** How many times a slip has been offered and let go. */
  passed: number;
  endedAt?: Instant;
}

/**
 * A month on an account, as the bank sends it: what it opened at, what went
 * in and out, what they charged, and what it closed at. Written when the
 * statement cycles, and never edited after.
 */
/**
 * An application to a private bank. The account does not exist until the
 * bank's checks are done, weeks later; the deposit moves then, once, or the
 * application is declined with a reason.
 */
export interface PrivateApplication {
  id: Id;
  saveId: Id;
  bankId: string;
  applicantId: Id;
  deposit: Money;
  fromAccountId: Id;
  appliedAt: Instant;
  readyAt: Instant;
  status: 'pending' | 'opened' | 'declined';
  accountId?: Id;
  reason?: string;
}

export interface AccountStatement {
  id: Id;
  saveId: Id;
  accountId: Id;
  /** The month it covers, as YYYY-MM in the home zone. */
  period: string;
  openedAt: Instant;
  closedAt: Instant;
  openingBalance: Money;
  credits: Money;
  debits: Money;
  fees: Money;
  interest: Money;
  closingBalance: Money;
  /** On a card: what is owed by the due date, and the least they will take. */
  minimumDue?: Money;
  dueAt?: Instant;
  transactionCount: number;
}

/**
 * A transfer the bank makes for you on a day of the month, from one of your
 * accounts to another. Stops when you say, or when it cannot be paid.
 */
export interface StandingOrder {
  id: Id;
  saveId: Id;
  ownerId: Id;
  name: string;
  fromAccountId: Id;
  toAccountId: Id;
  amount: Money;
  /** Day of the month it runs, 1 to 28. */
  dayOfMonth: number;
  active: boolean;
  createdAt: Instant;
  lastRunAt?: Instant;
  /** Times it could not be paid. Three and the bank gives up on it. */
  missed: number;
  endedAt?: Instant;
  endedReason?: string;
}

/** How a room serves you: over a counter, or at a table with a bill at the end. */
export type DiningService = 'counter' | 'table';

export type DiningStatus = 'waiting' | 'seated' | 'ordered' | 'served' | 'settled' | 'left';

/** One sitting: the door, the table, the order, the bill and the tip. */
export interface DiningVisit {
  id: Id;
  saveId: Id;
  placeId: string;
  cityId: string;
  service: DiningService;
  /** The one on the door. Absent where there is no door person. */
  hostId?: Id;
  /** The one who takes the order and brings the bill. */
  serverId: Id;
  partySize: number;
  /** Other people at the table, where you brought somebody. */
  guestIds: Id[];
  arrivedAt: Instant;
  /** Minutes they said it would be. */
  quotedWait: number;
  /** Minutes you actually stood there. */
  waitedMinutes: number;
  /** Where they put you: the window, the bar, the back, the terrace. */
  table: string;
  items: { name: string; price: Money }[];
  subtotal: Money;
  serviceCharge: Money;
  tip: Money;
  total: Money;
  status: DiningStatus;
  accountId?: Id;
  orderedAt?: Instant;
  servedAt?: Instant;
  settledAt?: Instant;
  /** What the room thought of you, for the next time. */
  note?: string;
}

export type RetailStatus = 'browsing' | 'fitting' | 'bought' | 'left';

/** One visit to a shop: the greeting, what you tried, and what you took home. */
export interface RetailVisit {
  id: Id;
  saveId: Id;
  placeId: string;
  retailerId: string;
  cityId: string;
  assistantId: Id;
  arrivedAt: Instant;
  /** Catalog ids you have picked up. */
  handled: string[];
  /** Catalog ids you have tried on, and what the mirror said. */
  tried: { catalogId: string; verdict: string }[];
  /** Catalog ids in your hands at the counter. */
  basket: string[];
  /** The color chosen for each thing in the basket, where it comes in colors. */
  colours?: Record<string, string>;
  orderId?: Id;
  spent: Money;
  status: RetailStatus;
  leftAt?: Instant;
}

export interface VehicleKeeping {
  kind: KeepingKind;
  cityId: string;
  /** The home whose garage, driveway, dock or trailer space it is. */
  propertyId?: Id;
  /** The marina, storage yard or boat yard. */
  placeId?: string;
  /** The airport. */
  airportId?: string;
  since: Instant;
  /** What it costs a month, after cost of living. Zero at home. */
  monthly: Money;
  /** The bill for it, when it costs anything. Ends when the vehicle moves or is sold. */
  billId?: Id;
}

export interface Vehicle {
  id: Id;
  saveId: Id;
  ownerId: Id;
  ownerKind: 'person' | 'company';
  /** Absent on a vehicle from before there was anything but cars; read as a car. */
  kind?: VehicleKind;
  catalogId: string;
  make: string;
  model: string;
  year: number;
  trim: string;
  bodyStyle: string;
  powertrain: 'gas' | 'diesel' | 'hybrid' | 'phev' | 'ev' | 'turbofan';
  vin: string;
  /** The car as it left the factory. Never changes. */
  factoryConfiguration: VehicleConfiguration;
  /** The car as it is now. */
  currentConfiguration: VehicleConfiguration;
  mileage: number;
  condition: number;
  /** 0-100 mechanical reliability, degrades if service is skipped. */
  mechanicalHealth: number;
  purchasePrice: Money;
  currentValue: Money;
  purchasedAt: Instant;
  acquisition: 'cash' | 'financed' | 'leased';
  loanAccountId?: Id;
  leaseEndsAt?: Instant;
  leaseMileageCap?: number;
  insurancePolicyId?: Id;
  registeredIn: string;
  /**
   * The city the car is in. A car driven somewhere is there until it is
   * driven on; fly home and it stays behind. Absent on cars from before this
   * existed, which are read as being with their owner.
   */
  locationId?: string;
  registrationExpiresAt: Instant;
  /** Manufacturer warranty; voided by certain modifications. */
  warranty: { bumperToBumperUntil?: Instant; powertrainUntil?: Instant; voided: boolean; voidReason?: string };
  serviceRecordIds: Id[];
  nextServiceDueMileage: number;
  storedAtPropertyId?: Id;
  soldAt?: Instant;
  /** Liters per 100km equivalent or kWh/100mi, kept abstract. */
  efficiency: number;
  /**
   * What is in the tank, 0-100. A car from before fuel was tracked is read as
   * full the first time somebody looks at it.
   */
  fuelPercent?: number;
  horsepower: number;
  zeroToSixty: number;
  /**
   * A car bought for delivery is not with you until the dealer brings it.
   * Absent once it has arrived, and on every car from before deals existed.
   */
  deliveryDueAt?: Instant;
  /** The deal it was bought under, if it was bought at a dealership. */
  dealId?: Id;
  /**
   * The berth or hangar bill from before keeping was a place. Read once by the
   * schema 39 migration and left alone after; new saves never set it.
   */
  upkeepBillId?: Id;
  /** The crew retainer for a crewed yacht or an aircraft. Ends when it is sold. */
  crewBillId?: Id;
  /** What its owner calls it: the name on a tail or a transom. */
  nickname?: string;
  /** Where it is kept now. Absent on a vehicle from before keeping existed, until it is placed. */
  keeping?: VehicleKeeping;
  /** An aircraft's hangar at home while it sits on a ramp somewhere else. The hangar is still paid for. */
  homeKeeping?: VehicleKeeping;
}

export interface VehicleModification {
  id: Id;
  saveId: Id;
  vehicleId: Id;
  partCatalogId: string;
  name: string;
  category: string;
  cost: Money;
  labourCost: Money;
  installedAt: Instant;
  removedAt?: Instant;
  /** Effects applied while installed. */
  effects: { horsepower?: number; weight?: number; zeroToSixty?: number; efficiency?: number; valueDelta?: Money; condition?: number };
  /** Legal status where the vehicle is registered. */
  streetLegal: boolean;
  voidsWarranty: boolean;
  insuranceDisclosed: boolean;
}

export interface ServiceRecord {
  id: Id;
  saveId: Id;
  vehicleId: Id;
  kind: 'scheduled' | 'repair' | 'recall' | 'inspection' | 'tires' | 'detail' | 'bodywork' | 'warranty';
  description: string;
  mileage: number;
  cost: Money;
  coveredByWarranty: boolean;
  performedAt: Instant;
  shopName: string;
  /** Effect on mechanical health. */
  healthDelta: number;
}

export interface VehicleListing {
  id: Id;
  saveId: Id;
  /** Absent on a listing from before there was anything but cars; read as a car. */
  kind?: VehicleKind;
  catalogId: string;
  condition: 'new' | 'used' | 'certified' | 'collector';
  year: number;
  mileage: number;
  price: Money;
  locationId: string;
  dealerName: string;
  configuration: VehicleConfiguration;
  status: ListingStatus;
  listedAt: Instant;
  /** How much the dealer will move, as a fraction. Never shown. */
  negotiationRoom: number;
  /** The dealership place this car sits on. Absent on listings from before dealerships were places. */
  dealerPlaceId?: string;
}

/**
 * A conversation about one car at one dealership, from the first look to the
 * signature or the walk to the door. The dealer's floor is theirs and is not
 * on the record; what they have said is.
 */
export type VehicleDealStatus = 'open' | 'agreed' | 'signed' | 'walked' | 'expired';

export interface VehicleDealTerms {
  /** What the dealer will allow against the car you bring, if you bring one. */
  tradeInVehicleId?: Id;
  tradeInValue?: Money;
  /** Drive it away today, or have it brought to you. */
  delivery: 'collect' | 'deliver';
  /** Things the dealer has agreed to put right before handover. */
  repairs: string[];
}

export interface VehicleDeal {
  id: Id;
  saveId: Id;
  listingId: Id;
  dealerPlaceId: string;
  salespersonId: Id;
  status: VehicleDealStatus;
  askingPrice: Money;
  /** The dealer's latest number; the asking price until they move. */
  currentAsk: Money;
  /** Your latest number, if you have made one. */
  lastOffer?: Money;
  agreedPrice?: Money;
  rounds: number;
  /** What the dealer has said, most recent last. */
  said: string[];
  inspected: boolean;
  /** What you found looking it over; each one is a lever. */
  findings: string[];
  testDriven: boolean;
  terms: VehicleDealTerms;
  openedAt: Instant;
  expiresAt: Instant;
  closedAt?: Instant;
  vehicleId?: Id;
}

/**
 * A date, from the asking to the walk home. Planned until it comes round;
 * under way while it is being played; then attended, or one of the ways it
 * did not happen, each of which the other person remembers differently.
 */
export type DateStatus = 'planned' | 'underway' | 'attended' | 'skipped' | 'stood_up' | 'they_cancelled' | 'cancelled';

export interface DateRecord {
  id: Id;
  saveId: Id;
  relationshipId: Id;
  personId: Id;
  scheduledItemId: Id;
  at: Instant;
  durationMinutes: number;
  activityId: string;
  placeId?: string;
  locationId: string;
  budget: Money;
  status: DateStatus;
  /** How the evening is going while it is under way, 0-100; how it went, after. */
  chemistry: number;
  beats: number;
  spent: Money;
  /** What you talked about, for the other person to remember. */
  topics: string[];
  /** What you said you would do afterwards. */
  promises: string[];
  outcome?: 'good' | 'mixed' | 'poor';
  /** They were late, or did not come. */
  showed?: 'there' | 'late' | 'no_show';
  sceneId?: Id;
  closedAt?: Instant;
}

// ---------------------------------------------------------------------------
// Possessions and commerce
// ---------------------------------------------------------------------------

export type AssetCategory =
  | 'clothing' | 'footwear' | 'accessory' | 'watch' | 'jewelry' | 'electronics'
  | 'furniture' | 'appliance' | 'art' | 'instrument' | 'equipment' | 'collectible' | 'other';

export interface OwnedAsset {
  id: Id;
  saveId: Id;
  ownerId: Id;
  ownerKind: 'person' | 'company';
  category: AssetCategory;
  catalogId?: string;
  name: string;
  brand?: string;
  purchasePrice: Money;
  currentValue: Money;
  condition: number;
  acquiredAt: Instant;
  acquiredVia: 'purchase' | 'gift' | 'inheritance' | 'award' | 'production';
  giftedById?: Id;
  /** Where it physically is. */
  locationPropertyId?: Id;
  /**
   * Which room of the home it lives in. A kettle is in the kitchen, a sofa is
   * in the living room, and a thing with a place in a room is a thing you can
   * walk up to and use.
   */
  roomId?: Id;
  /**
   * Broken, and since when. A broken machine does nothing until it is
   * repaired: the oven will not cook, the washing machine sends you to the
   * launderette.
   */
  broken?: boolean;
  brokenAt?: Instant;
  /** When the repair is due back, while one is booked. */
  repairDueAt?: Instant;
  /** The last time it was used for what it is for. */
  lastUsedAt?: Instant;
  insurancePolicyId?: Id;
  /** Provenance chain for luxury goods. */
  provenance: { at: Instant; note: string }[];
  /**
   * Set on a piece that was made rather than bought. Carries the whole
   * specification, so the thing can be described, valued and insured for what
   * it actually is years after the bench closed.
   */
  /**
   * How many of it you own, when it is the kind of thing you own by the
   * length or the box. Absent means one, which is what nearly everything is.
   */
  quantity?: number;
  bespoke?: {
    commissionId: Id;
    placeName: string;
    piece: string;
    metal: string;
    stone: string;
    carats: number;
    cut: string;
    colourGrade?: string;
    clarity?: string;
    setting: string;
    engraving?: string;
    madeAt: Instant;
  };
  /** Wardrobe-specific. */
  wardrobe?: {
    slot: string;
    formality: number;
    season: string[];
    colour: string;
    /** What it is made of, which decides warmth, wear and how it is cleaned. */
    material?: string;
    /** 0-100. Falls as it is worn; a wash or the cleaner puts it back. */
    cleanliness?: number;
    /** Times it has been out of the wardrobe. */
    timesWorn?: number;
    lastWornAt?: Instant;
    /** Somewhere other than your wardrobe: at the cleaner, at the tailor. */
    awayUntil?: Instant;
    awayReason?: string;
    /**
     * 0-100, how well it actually fits this body.
     *
     * Off the rack it is whatever the rack gave you. Cut for you it is how
     * well the workroom did, and a tailor can move it either way.
     */
    fit?: number;
  };
  soldAt?: Instant;
  tags: string[];
}

/**
 * A line on a rental ticket: what it is, what it costs a day, and what the
 * house would charge you if it came back in pieces.
 */
export interface HireLine {
  catalogId: string;
  name: string;
  brand?: string;
  subcategory?: string;
  /** SLATE's calibration, not a quote from the house. */
  dayRate: Money;
  /** Replacement value, which is what the deposit and the damage run off. */
  value: Money;
  quantity: number;
}

/**
 * Kit out on hire.
 *
 * A body worth seventy thousand is hired for the days it is needed, collected,
 * used, and taken back. The ticket carries what was taken, what it costs, the
 * deposit the house is holding, whether the damage is on their waiver or your
 * own cover, and what happened when it came back.
 */
export interface KitHire {
  id: Id;
  saveId: Id;
  personId: Id;
  /** The place id of the house, which is where you go to collect it. */
  houseId: string;
  houseName: string;
  cityId: string;
  lines: HireLine[];
  /** Days you asked for, and the days the house actually bills for. */
  days: number;
  billedDays: number;
  outAt: Instant;
  dueAt: Instant;
  /** All lines together, for one billed day. */
  rate: Money;
  hire: Money;
  waiver: Money;
  deposit: Money;
  delivery: Money;
  /** What has actually left the account so far. */
  paid: Money;
  refunded?: Money;
  status: 'booked' | 'out' | 'returned' | 'lost' | 'cancelled';
  collectedAt?: Instant;
  returnedAt?: Instant;
  lateDays?: number;
  lateFee?: Money;
  /** Set where something came back marked. */
  damage?: {
    note: string;
    cost: Money;
    paidBy: 'waiver' | 'policy' | 'you';
    excess?: Money;
  };
  /** Your own equipment cover, where you had some when you signed. */
  policyId?: Id;
  /** The shoot days this kit was on, which is what wears it. */
  shootDayIds?: Id[];
}

/** What somebody does on a day, which is the only reason to ask them. */
export type CrewRole = 'camera' | 'sound' | 'lighting' | 'grip' | 'production';

/** Somebody you asked, and what they said. */
export interface ShootCrew {
  personId: Id;
  name: string;
  role: CrewRole;
  answer: 'asked' | 'yes' | 'no';
  note?: string;
}

/**
 * A day you shoot something.
 *
 * The whole of it: where it is, whether anybody said you could be there, who
 * turned up, what kit was in the van, how many setups you meant to get and how
 * many you actually got when the weather and the hours had their say.
 */
export interface ShootDay {
  id: Id;
  saveId: Id;
  personId: Id;
  title: string;
  cityId: string;
  /** The call. */
  at: Instant;
  hours: number;
  where: 'home' | 'place' | 'street';
  placeId?: string;
  placeName: string;
  permission: {
    needed: boolean;
    status: 'none' | 'asked' | 'granted' | 'refused';
    fee: Money;
    askedAt?: Instant;
    decidedAt?: Instant;
    note?: string;
  };
  crew: ShootCrew[];
  /** Tickets whose kit is meant to be on this day. */
  hireIds: Id[];
  /** What you meant to get, and what you got. */
  setups: number;
  got?: number;
  status: 'planned' | 'shot' | 'abandoned';
  weatherNote?: string;
  note?: string;
  shotAt?: Instant;
}

/** A screening you put on yourself, and who actually came. */
export interface Screening {
  id: Id;
  at: Instant;
  placeId?: string;
  placeName: string;
  /** What the room cost you. */
  cost: Money;
  invited: number;
  came: number;
  note: string;
}

/** A festival you sent it to, and what came back. */
export interface Submission {
  id: Id;
  festivalId: string;
  festivalName: string;
  cityId: string;
  sentAt: Instant;
  fee: Money;
  answerAt: Instant;
  status: 'sent' | 'accepted' | 'rejected' | 'withdrawn';
  note?: string;
}

/**
 * A picture of your own.
 *
 * Days of shooting go into it, hours of cutting shape it, and what comes out
 * is a runtime and a quality that neither of those can exceed: you cannot cut
 * a good film out of material you never got.
 */
export interface IndieFilm {
  id: Id;
  saveId: Id;
  personId: Id;
  title: string;
  logline: string;
  format: 'short' | 'feature' | 'documentary' | 'animation';
  startedAt: Instant;
  /** The days that went into it. */
  dayIds: Id[];
  /** Hours at the bench. */
  cutHours: number;
  /** Set when it is finished, and never changed after. */
  cut?: {
    at: Instant;
    runtimeMinutes: number;
    /** 0-100, and capped by what was actually shot. */
    quality: number;
    note: string;
  };
  screenings: Screening[];
  submissions: Submission[];
  status: 'shooting' | 'cutting' | 'finished' | 'abandoned';
}

/**
 * A ticket for a seat at a cinema.
 *
 * The showing it is for is derived from the week and the branch rather than
 * stored, so a save carries the tickets you actually bought and nothing else.
 * Everything the ticket needs to stand on its own after the week has passed —
 * the title, the certificate, the runtime — is copied onto it, because the
 * program moves on and a stub in your pocket does not.
 */
export interface CinemaTicket {
  id: Id;
  saveId: Id;
  personId: Id;
  placeId: string;
  placeName: string;
  cityId: string;
  /** The chain that runs it, when it is part of one. */
  chainId?: string;
  showingId: string;
  title: string;
  genre: string;
  certificate: string;
  runtimeMinutes: number;
  screen: string;
  at: Instant;
  seats: number;
  paid: Money;
  bookedAt: Instant;
  status: 'booked' | 'seen' | 'missed' | 'refunded';
  /** Written once, when you have actually watched it. */
  seen?: {
    at: Instant;
    /** What the room was like, which is half of going to the cinema. */
    room: string;
    /** What you thought, 0-100, out of the picture and your own taste. */
    verdict: number;
    note: string;
    snacks: Money;
  };
}

/**
 * A seat at a show, asked for and either given or not.
 *
 * The week, the edition and the show are all derived from the calendar rather
 * than stored, so a save carries the letters you wrote and nothing else.
 * Everything the invitation needs to stand on its own once the season has
 * moved on — the house, the week, the season it was showing, the venue — is
 * copied onto it.
 */
export interface FashionInvite {
  id: Id;
  saveId: Id;
  personId: Id;
  weekId: string;
  weekName: string;
  editionId: string;
  showId: string;
  /** The house, spelled as the catalog spells it. */
  brand: string;
  cityId: string;
  /** The collection it was showing, named the way the industry names it. */
  season: string;
  venue: string;
  at: Instant;
  askedAt: Instant;
  status: 'asked' | 'accepted' | 'refused' | 'declined' | 'attended' | 'missed';
  /** Where they sat you, once they have answered yes. */
  seat?: string;
  /** What the letter said, either way. */
  note?: string;
  /** Written once, when you have actually been. */
  attended?: {
    at: Instant;
    /** What the room made of what you had on, 0-100. */
    verdict: number;
    photographed: boolean;
    note: string;
    /** What you were wearing, so the record stands after the wardrobe changes. */
    look: string;
    cost: Money;
  };
}

/**
 * A ticket to something on in town — a match, a concert, a play, a show.
 *
 * The event it is for is derived from the venue and the week rather than
 * stored, so a save carries only the tickets you bought. Everything the stub
 * needs to stand on its own once the week has moved on — what it was, where,
 * the card, the band you sat in — is copied onto it.
 */
export interface GoingTicket {
  id: Id;
  saveId: Id;
  personId: Id;
  placeId: string;
  placeName: string;
  cityId: string;
  eventId: string;
  kind: string;
  /** The made-up card: the act, the program, the fixture. */
  card: string;
  band: string;
  at: Instant;
  seats: number;
  paid: Money;
  bookedAt: Instant;
  status: 'booked' | 'went' | 'missed' | 'refunded';
  /** Written once, when you have actually been. */
  went?: {
    at: Instant;
    /** What the night was like, 0-100, from the room and your own taste. */
    verdict: number;
    note: string;
    /** How full the room was, which is half of a night out. */
    house: string;
  };
}

/**
 * Something you handed over a counter and sent somewhere.
 *
 * The operator and the service are copied onto it, because a parcel outlives
 * the visit that posted it and the counter it was posted at.
 */
export interface Parcel {
  id: Id;
  saveId: Id;
  personId: Id;
  placeId: string;
  placeName: string;
  /** The national operator that carries it. */
  operator: string;
  fromCityId: string;
  toCityId: string;
  service: string;
  /** What went in it, in the player's own words. */
  contents: string;
  grams: number;
  paid: Money;
  sentAt: Instant;
  dueAt: Instant;
  tracked: boolean;
  status: 'in_transit' | 'delivered' | 'delayed' | 'lost';
  /** What happened to it, once something has. */
  note?: string;
  arrivedAt?: Instant;
}

export interface Outfit {
  id: Id;
  saveId: Id;
  personId: Id;
  name: string;
  assetIds: Id[];
  /** 0-100 how formal, used for dress-code checks. */
  formality: number;
  /** Score derived from constituent items. */
  styleScore: number;
  createdAt: Instant;
  /** Times this exact set has been worn, and when it last was. */
  timesWorn?: number;
  lastWornAt?: Instant;
}

/** A day you were dressed, kept so the world can notice a repeat. */
/**
 * A piece being made for you, from the first conversation to the collection.
 *
 * The specification is kept whole rather than baked into a price, because it
 * is the thing the player designed: it goes into the finished asset's
 * provenance, onto an insurance valuation, and into what a resale is worth.
 *
 * `quotedPrice` is fixed the moment the bench quotes it. A bench that changed
 * its number between the deposit and the collection would be a different kind
 * of game.
 */
export interface Commission {
  id: Id;
  saveId: Id;
  /** The bench, or the maison's special order desk. */
  placeId: Id;
  /** Who is making it, so the same person is there when you collect. */
  jewellerId?: Id;
  /** For whom. A commission can be a gift. */
  forPersonId: Id;
  piece: string;
  metal: string;
  stone: string;
  /** Carats of the center stone. Zero when there is no stone. */
  carats: number;
  cut: string;
  colourGrade?: string;
  clarity?: string;
  setting: string;
  /** What is cut inside it, in the player's own words. */
  engraving?: string;
  quotedPrice: Money;
  /** Paid up front. The balance falls due on collection. */
  deposit: Money;
  depositPaidAt?: Instant;
  balancePaidAt?: Instant;
  status: 'quoted' | 'ordered' | 'ready' | 'collected' | 'cancelled';
  quotedAt: Instant;
  orderedAt?: Instant;
  readyAt?: Instant;
  collectedAt?: Instant;
  /** The finished piece, once it exists. */
  assetId?: Id;
  /** Why it was canceled, when it was. */
  cancelledReason?: string;
}

/**
 * A garment that does not exist yet.
 *
 * A costume house cutting one for you, a tailor altering one you own, or you
 * at your own machine. The same record covers all three because the questions
 * are the same: what is it, what is it cut from, who is making it, how many
 * fittings, what did it cost, and is it finished.
 */
export interface Costume {
  id: Id;
  saveId: Id;
  /** The workroom. Absent when you are making it at home. */
  placeId?: Id;
  /** The cutter, so the same person is there at every fitting. */
  makerId?: Id;
  /** For whom. A costume can be made for somebody else. */
  forPersonId: Id;
  /** 'house', 'tailor' or 'self'. */
  maker: string;
  kind: string;
  cloth: string;
  finish: string;
  /** What is embroidered or printed inside it, in the player's own words. */
  label?: string;
  /** Yards the pattern needs, so a self-made one can check the stash. */
  yards: number;
  quotedPrice: Money;
  deposit: Money;
  depositPaidAt?: Instant;
  balancePaidAt?: Instant;
  status: 'quoted' | 'ordered' | 'fitting' | 'ready' | 'collected' | 'cancelled';
  /** Fittings the workroom wants, and how many have happened. */
  fittingsWanted: number;
  fittingsDone: number;
  /** Every fitting leaves a note. Skipping them costs the fit. */
  fittingNotes: string[];
  quotedAt: Instant;
  orderedAt?: Instant;
  readyAt?: Instant;
  collectedAt?: Instant;
  /** How well it came out, 0-100, once it is finished. */
  quality?: number;
  /** The finished garment, once it exists. */
  assetId?: Id;
  /** Why it was canceled, when it was. */
  cancelledReason?: string;
}

export interface WornRecord {
  id: Id;
  saveId: Id;
  personId: Id;
  at: Instant;
  assetIds: Id[];
  /** The saved outfit it matched, if it matched one. */
  outfitId?: Id;
  occasion: string;
  /** 0-100 what the mirror gave it. */
  verdict: number;
  /** Whether anybody with a camera was there. */
  photographed: boolean;
}

export interface Order {
  id: Id;
  saveId: Id;
  buyerId: Id;
  buyerKind: 'person' | 'company';
  retailerId: string;
  channel: 'in_store' | 'online' | 'delivery' | 'pickup';
  items: { catalogId: string; name: string; unitPrice: Money; quantity: number; category: string }[];
  subtotal: Money;
  tax: Money;
  shipping: Money;
  total: Money;
  status: 'cart' | 'placed' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  placedAt: Instant;
  deliverAt?: Instant;
  deliveredAt?: Instant;
  paidFromAccountId: Id;
  /** Assets created on delivery. */
  createdAssetIds: Id[];
  returnWindowEndsAt?: Instant;
  refundedAmount?: Money;
  giftFor?: Id;
  /** The colorway chosen at the counter for each line that comes in colors. */
  colours?: Record<string, string>;
}

export interface PantryItem {
  id: Id;
  saveId: Id;
  householdId: Id;
  propertyId: Id;
  catalogId: string;
  name: string;
  storage: 'pantry' | 'fridge' | 'freezer';
  quantity: number;
  unit: string;
  purchasedAt: Instant;
  expiresAt: Instant;
  unitCost: Money;
}

// ---------------------------------------------------------------------------
// Health, insurance, education
// ---------------------------------------------------------------------------

export interface HealthProvider {
  id: Id;
  saveId: Id;
  name: string;
  specialty: 'primary' | 'dentist' | 'optometrist' | 'chiropractor' | 'physical_therapy' | 'specialist' | 'urgent_care' | 'emergency' | 'counseling';
  locationId: string;
  personId?: Id;
  acceptsInsurance: string[];
  baseVisitCost: Money;
  /** 0-100 quality; better care restores more condition. */
  quality: number;
  /** Days out the next opening is. */
  leadTimeDays: number;
  rating: number;
}

export interface Appointment {
  id: Id;
  saveId: Id;
  personId: Id;
  providerId: Id;
  kind: string;
  at: Instant;
  durationMinutes: number;
  locationId: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'missed' | 'rescheduled';
  cost: Money;
  insuranceCovered: Money;
  outOfPocket: Money;
  policyId?: Id;
  outcome?: string;
  scheduledItemId?: Id;
  followUpAt?: Instant;
  /** What you said brought you in. */
  complaint?: string;
  checkedInAt?: Instant;
  consultedAt?: Instant;
  testsOrderedAt?: Instant;
  resultsAt?: Instant;
  resultOutcome?: 'clear' | 'follow_up';
  prescriptionId?: Id;
  paidAt?: Instant;
  followUpDays?: number;
  conditionGain?: number;
}

/** A course of something the provider wrote, collected at a pharmacy and taken over days. Simulated; not medical advice. */
export interface Prescription {
  id: Id;
  saveId: Id;
  personId: Id;
  appointmentId: Id;
  providerId: Id;
  medication: string;
  purpose: string;
  days: number;
  dosesPerDay: number;
  cost: Money;
  insuranceCovered: Money;
  outOfPocket: Money;
  writtenAt: Instant;
  filledAt?: Instant;
  dosesTaken: number;
  nextDoseAt?: Instant;
  status: 'written' | 'filled' | 'finished' | 'lapsed';
}

export type InsuranceLine =
  | 'health' | 'dental' | 'vision' | 'auto' | 'renters' | 'homeowners'
  | 'valuables' | 'travel' | 'life' | 'umbrella' | 'business' | 'production' | 'equipment'
  | 'marine' | 'aviation';

export interface InsurancePolicy {
  id: Id;
  saveId: Id;
  holderId: Id;
  holderKind: 'person' | 'company';
  line: InsuranceLine;
  carrier: string;
  policyNumber: string;
  monthlyPremium: Money;
  deductible: Money;
  /** Per-incident and annual caps. */
  coverageLimit: Money;
  /** Fraction the insurer pays after the deductible. */
  coinsurance: number;
  coveredRefs: { type: string; id: Id }[];
  startsAt: Instant;
  endsAt: Instant;
  status: 'quoted' | 'active' | 'lapsed' | 'cancelled' | 'expired';
  claimIds: Id[];
  quotedAt: Instant;
}

export interface InsuranceClaim {
  id: Id;
  saveId: Id;
  policyId: Id;
  claimantId: Id;
  incidentAt: Instant;
  filedAt: Instant;
  description: string;
  claimedAmount: Money;
  status: 'filed' | 'reviewing' | 'approved' | 'partially_approved' | 'denied' | 'paid';
  approvedAmount?: Money;
  deniedReason?: string;
  paidAt?: Instant;
  /** Effect on future premiums. */
  premiumImpact?: number;
}

export interface Course {
  id: Id;
  saveId: Id;
  name: string;
  provider: string;
  category: 'acting' | 'writing' | 'directing' | 'production' | 'business' | 'fitness' | 'language' | 'music' | 'dance' | 'stunt' | 'general';
  locationId: string;
  /** Attributes or skills improved, with per-session gain. */
  improves: { key: string; kind: 'attribute' | 'skill'; gain: number }[];
  sessionsTotal: number;
  sessionMinutes: number;
  costPerSession: Money;
  /** Days of week sessions happen. */
  days: number[];
  hour: number;
  instructorQuality: number;
  minimumLevel: number;
}

export interface Enrollment {
  id: Id;
  saveId: Id;
  personId: Id;
  courseId: Id;
  sessionsAttended: number;
  sessionsMissed: number;
  startedAt: Instant;
  completedAt?: Instant;
  status: 'active' | 'completed' | 'dropped';
  totalPaid: Money;
  gains: Record<string, number>;
}

// ---------------------------------------------------------------------------
// School
// ---------------------------------------------------------------------------

/** One lesson on the timetable. */
export interface Lesson {
  /** 1 for Monday through 5 for Friday. */
  day: number;
  /** Which period of the day, from 1. */
  period: number;
  subjectId: string;
}

/** What a subject is worth so far this year. */
export interface SubjectMark {
  subjectId: string;
  /** Out of a hundred. */
  mark: number;
  /** Lessons sat and lessons missed, for this year. */
  attended: number;
  missed: number;
}

/** A place on a school team. */
/** A part in a school play. */
export interface SchoolPart {
  id: Id;
  productionId: string;
  title: string;
  /** 'lead' | 'supporting' | 'ensemble' | 'crew'. */
  part: string;
  /** How it went, out of a hundred, once it has been performed. */
  verdict?: number;
  /** Set when somebody outside the school noticed. */
  noticed?: boolean;
  auditionedAt: Instant;
  performsAt: Instant;
  note?: string;
}

/** Somebody's place in the education system where they live. */
export interface Schooling {
  id: Id;
  saveId: Id;
  personId: Id;
  /** The education system this is inside. */
  systemId: string;
  /** The school itself: a place id, and SLATE's own invention. */
  placeId: string;
  placeName: string;
  /** The stage and the year within it, as of the last roll-up. */
  stageId: string;
  yearLabel: string;
  /** The week, generated once per school year. */
  timetable: Lesson[];
  marks: SubjectMark[];
  clubs: string[];
  parts: SchoolPart[];
  /** Qualifications already earned, oldest first. */
  results: { name: string; stageId: string; average: number; at: Instant }[];
  startedAt: Instant;
  /** Set when they left, finished or moved on. */
  endedAt?: Instant;
  endReason?: string;
}

// ---------------------------------------------------------------------------
// Growing up
// ---------------------------------------------------------------------------

/** The years between five and twenty five, and what happened in them. */
export interface GrowingUp {
  id: Id;
  saveId: Id;
  personId: Id;
  /** The moments already lived through, by id. */
  done: string[];
  /** The one waiting on an answer, if there is one. */
  openId?: string;
  /** When the next one is due to come round. */
  nextAt?: Instant;
  /** The last week pocket money was paid for. */
  allowancePaidAt?: Instant;
  /** Hours with an instructor. */
  lessons: number;
  /** Driving tests sat, and whether one was passed. */
  testsSat: number;
  passedTestAt?: Instant;
  startedAt: Instant;
}

// ---------------------------------------------------------------------------
// Track
// ---------------------------------------------------------------------------

/** A time somebody has actually run, and where they ran it. */
export interface Mark {
  eventId: string;
  /** 'indoor' or 'outdoor'. */
  surface: string;
  seconds: number;
  /** Meters a second, where the event reads it. Above the limit and it does not stand. */
  wind?: number;
  /** Whether the mark stands for a record or a ranking. */
  legal: boolean;
  at: Instant;
  /** The meet it was run at. SLATE's own unless it is a real named meet. */
  where: string;
}

/** One race inside a meet: a heat, a semi final or a final. */
export interface RaceResult {
  /** 'heat', 'semi' or 'final'. */
  round: string;
  eventId: string;
  lane: number;
  seconds: number;
  wind?: number;
  legal: boolean;
  place: number;
  /** How many were in the race. */
  of: number;
  /** Whether that was enough to go through to the next round. */
  through: boolean;
  personalBest: boolean;
  seasonBest: boolean;
}

/** A meet on a season's schedule, and what happened at it. */
export interface MeetEntry {
  at: Instant;
  /** What it is called. A real named meet, or SLATE's own. */
  name: string;
  town: string;
  cityId?: string;
  /** Set where the meet is one SLATE carries as real. */
  meetId?: string;
  tier: string;
  /** What is being run there, from the events this runner has entered. */
  eventIds: string[];
  run: boolean;
  /** Where the runner did not qualify to be there at all. */
  locked?: boolean;
  results: RaceResult[];
  /** Where they finished in the final, if they made one. */
  place?: number;
}

/** A track season, from the first meet of it to however far it went. */
export interface TrackSeason {
  id: Id;
  saveId: Id;
  personId: Id;
  /** 'school', 'university' or 'professional'. */
  stage: string;
  /** 'indoor' or 'outdoor'. */
  surface: string;
  /** The school, university or club being run for. */
  teamName: string;
  countryId: string;
  /** The calendar year the season started in. */
  year: number;
  /** The events entered this season. */
  eventIds: string[];
  meets: MeetEntry[];
  startedAt: Instant;
  endedAt?: Instant;
  /** How far it went, in words. */
  reached?: string;
}

/** Everything about somebody as a runner, which outlasts any one season. */
export interface Running {
  id: Id;
  saveId: Id;
  personId: Id;
  /** The category they compete in: 'mens' or 'womens'. Their own choice. */
  category: string;
  /** The events they run. */
  eventIds: string[];
  /** Where they run: a school team, a university team, a club, or professionally. */
  stage: string;
  /** Who they run for. */
  teamName?: string;
  /**
   * Condition, out of a hundred, built by training and lost by not.
   *
   * Read through the system rather than straight off the record: form falls
   * away from the day it was last worked on, so the stored number is only the
   * number it was then.
   */
  form: number;
  /** The day the form was last put in. */
  formAt: Instant;
  /** Sessions put in, ever. */
  sessions: number;
  /** Every personal best, one per event and surface. */
  bests: Mark[];
  /** The best of this season, cleared when a new season starts. */
  seasonBests: Mark[];
  /** Set while hurt, and nothing can be run until it passes. */
  injuredUntil?: Instant;
  /** What the injury was, so it can be said out loud. */
  injury?: string;
  /** Whether they have turned professional. */
  professional?: boolean;
  /** A shoe contract, where there is one. */
  contract?: {
    brand: string;
    aYear: Money;
    from: Instant;
    to: Instant;
    /** What a global medal is worth on top. */
    medalBonus: Money;
  };
  startedAt: Instant;
}

// ---------------------------------------------------------------------------
// University
// ---------------------------------------------------------------------------

/** An application to a university, and what came back. */
export interface UniversityApplication {
  id: Id;
  saveId: Id;
  personId: Id;
  universityId: string;
  majorId: string;
  /** The average the applicant was carrying when they applied. */
  onMarks: number;
  status: 'pending' | 'offer' | 'rejected' | 'accepted' | 'declined' | 'withdrawn';
  /** 'academic' | 'athletic' | 'none', set when an offer carries one. */
  scholarship?: string;
  /** Why it went the way it did, in words the applicant would be given. */
  reason: string;
  appliedAt: Instant;
  decidedAt?: Instant;
}

/** A degree in progress, or one that was finished. */
export interface Studies {
  id: Id;
  saveId: Id;
  personId: Id;
  universityId: string;
  universityName: string;
  majorId: string;
  /** Which year of the course, from one. */
  year: number;
  years: number;
  /** Out of a hundred, across the course so far. */
  average: number;
  /** Terms sat and terms missed. */
  termsDone: number;
  termsMissed: number;
  scholarship?: string;
  /** Where they live while they are there, and whether they eat on a plan. */
  housing: string;
  mealPlan: boolean;
  /** What has been paid in fees so far. */
  paid: Money;
  /** And what has been paid for somewhere to sleep and something to eat. */
  paidLiving: Money;
  startedAt: Instant;
  endedAt?: Instant;
  /** Set when the degree was awarded. */
  awardedClass?: string;
  endReason?: string;
}

// ---------------------------------------------------------------------------
// Travel
// ---------------------------------------------------------------------------

export interface Trip {
  id: Id;
  saveId: Id;
  travellerIds: Id[];
  organiserId: Id;
  name: string;
  purpose: 'leisure' | 'work' | 'production' | 'press' | 'family' | 'festival' | 'relocation';
  legs: TripLeg[];
  departAt: Instant;
  returnAt?: Instant;
  budget: Money;
  spent: Money;
  status: 'planning' | 'booked' | 'in_progress' | 'complete' | 'cancelled';
  bookingIds: Id[];
  createdAt: Instant;
}

export interface TripLeg {
  id: Id;
  fromLocationId: string;
  toLocationId: string;
  departAt: Instant;
  arriveAt: Instant;
  mode: 'commercial_air' | 'private_air' | 'car' | 'train' | 'ship';
  bookingId?: Id;
}

export interface FlightBooking {
  id: Id;
  saveId: Id;
  tripId?: Id;
  passengerIds: Id[];
  airlineCode: string;
  airlineName: string;
  flightNumber: string;
  fromAirport: string;
  toAirport: string;
  departAt: Instant;
  arriveAt: Instant;
  cabin: 'economy' | 'premium_economy' | 'business' | 'first' | 'private';
  seats: string[];
  fare: Money;
  taxesFees: Money;
  bags: number;
  status: 'booked' | 'checked_in' | 'flown' | 'cancelled' | 'refunded' | 'changed' | 'missed';
  refundable: boolean;
  loyaltyMilesEarned: number;
  bookedAt: Instant;
  /** The day, as it was played or just done. */
  bag?: 'carry_on' | 'checked';
  seatChoice?: string;
  /** Bag fee, seat fee: what the day added to the fare. */
  extras?: Money;
  checkedInAt?: Instant;
  boardedAt?: Instant;
  delayMinutes?: number;
  bagsClaimedAt?: Instant;
  bagLost?: boolean;
  bagReturnedAt?: Instant;
  /** Set when the airline moved you or you moved yourself; points at the booking that replaced this one. */
  replacedBy?: Id;
  /** The owned aircraft it is flown in, when it is not a charter or an airline. */
  vehicleId?: Id;
}

export interface HotelBooking {
  id: Id;
  saveId: Id;
  tripId?: Id;
  guestIds: Id[];
  hotelRefId: string;
  hotelName: string;
  locationId: string;
  roomClass: 'standard' | 'deluxe' | 'suite' | 'penthouse';
  checkInAt: Instant;
  checkOutAt: Instant;
  nights: number;
  nightlyRate: Money;
  taxesFees: Money;
  total: Money;
  status: 'booked' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
  incidentals: Money;
  bookedAt: Instant;
  /** A hotel, or a room in somebody's home through Airbnb. Absent means hotel. */
  kind?: 'hotel' | 'airbnb';
  /** The real brand it wears, when it wears one. Absent means one of SLATE's own hotels. */
  brandId?: string;
  /** The person whose home it is, for an Airbnb. A real person in the save. */
  hostId?: Id;
  /** What was listed, for an Airbnb. */
  listing?: {
    kind: 'entire_home' | 'private_room' | 'shared_room';
    bedrooms: number;
    superhost: boolean;
    /** 0-5, the listing's rating as shown. SLATE's own. */
    rating: number;
    selfCheckIn: boolean;
  };
  /** Charged once per stay, not per night, the way the platform does it. */
  cleaningFee?: Money;
  /** The platform's cut, shown to the guest as a line of its own. */
  serviceFee?: Money;
}

// ---------------------------------------------------------------------------
// Social media
// ---------------------------------------------------------------------------

export type PlatformId = 'streamtube' | 'pulse' | 'lumen' | 'chatter';

export interface AudienceSegment {
  /** e.g. 'core_fans', 'casual', 'industry', 'international'. */
  key: string;
  size: number;
  /** 0-1 how likely this segment engages with a given post. */
  affinity: number;
  /** 0-1 how likely they leave if content quality drops. */
  churnSensitivity: number;
}

export interface SocialAccount {
  id: Id;
  saveId: Id;
  ownerId: Id;
  ownerKind: 'person' | 'company' | 'project';
  platform: PlatformId;
  handle: string;
  displayName: string;
  bio: string;
  followers: number;
  following: number;
  verified: boolean;
  createdAt: Instant;
  /** Rolling 0-100 measure of how well recent content performed. */
  momentum: number;
  /** Posting cadence over the last 30 days. */
  recentPostCount: number;
  lastPostAt?: Instant;
  segments: AudienceSegment[];
  monetisationEnabled: boolean;
  /** Cents per thousand impressions currently achieved. */
  effectiveCpm: Money;
  lifetimeEarnings: Money;
  totalViews: number;
}

export type PostFormat =
  | 'long_video' | 'short_video' | 'livestream' | 'photo' | 'carousel'
  | 'story' | 'reel' | 'text' | 'thread' | 'repost';

export interface SocialPost {
  id: Id;
  saveId: Id;
  accountId: Id;
  platform: PlatformId;
  format: PostFormat;
  title: string;
  body: string;
  /** 0-100 quality from effort, skill and equipment. */
  quality: number;
  /** Production effort in minutes. */
  effortMinutes: number;
  postedAt: Instant;
  scheduledFor?: Instant;
  status: 'draft' | 'scheduled' | 'published' | 'removed';
  /** What the post is about; drives cross-system effects. */
  topic: string;
  refType?: string;
  refId?: Id;
  /** Metrics accumulate over the post's life. */
  metrics: {
    impressions: number;
    views: number;
    watchTimeMinutes: number;
    completionRate: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    followersGained: number;
  };
  revenue: Money;
  /** True when the post crossed the virality threshold. */
  viral: boolean;
  sentiment: number;
  brandDealId?: Id;
  /** Days of decay processing still owed. */
  decayDaysRemaining: number;
  /** What the audience said a day on, as the library put it. Absent until then. */
  reactions?: { at: Instant; band: 'hit' | 'fine' | 'flop'; comments: string[]; summary: string };
}

/**
 * The video app.
 *
 * The contract asked for the real app rather than a panel of numbers: a feed
 * built from channels you actually subscribe to, channels with names and
 * subscriber counts and a history of uploads, your own channel with titles and
 * thumbnails and a schedule, analytics that behave like analytics, comments you
 * can read and reply to, and watching as a thing that costs you an evening.
 *
 * A channel in the world is not a `SocialAccount`. An account is yours and
 * carries the money; a channel is anybody's, including yours, and carries the
 * videos. The player's own channel points at their account so the two agree.
 */
export interface VideoChannel {
  id: Id;
  saveId: Id;
  platform: PlatformId;
  /** The roster entry it was made from, so a save keeps the same channels. */
  sourceId?: string;
  name: string;
  handle: string;
  topic: string;
  about: string;
  subscribers: number;
  verified: boolean;
  createdAt: Instant;
  /** Days between uploads, on average. */
  cadenceDays: number;
  /** 0-100 how good this channel is at what it does. */
  craft: number;
  /** The voice it speaks in, which shows in its titles and its comments. */
  tone: string;
  /** Whose channel it is, when somebody in the world runs it. */
  ownerId?: Id;
  /** The player's own channel, tied to the account that carries the money. */
  accountId?: Id;
  lastUploadAt?: Instant;
  totalViews: number;
  /** What it costs a month to join, where the channel sells memberships. */
  membershipMonthly?: Money;
  /** How many people are paying for that. */
  members?: number;
  liveStreamId?: Id;
  /** A photo the player uploaded, square, for the circle. */
  avatarImage?: string;
  /** And the wide one across the top of the channel page. */
  bannerImage?: string;
  /**
   * How many videos this channel has put out. The world's back catalog is
   * derived from this and the channel's seed rather than stored, because two
   * hundred and forty channels with four years of uploads behind them is
   * fourteen thousand rows nobody would ever read, in every save file. A
   * derived catalog is the same catalog every time it is asked for, costs
   * nothing to keep, and cannot drift.
   */
  uploads: number;
}

export interface VideoItem {
  id: Id;
  saveId: Id;
  channelId: Id;
  title: string;
  description: string;
  tags: string[];
  publishedAt: Instant;
  lengthMinutes: number;
  topic: string;
  views: number;
  likes: number;
  dislikes: number;
  commentCount: number;
  /** Which thumbnail was chosen, which changes how many people click. */
  thumbnail: string;
  /** 0-100 how well made it is. */
  quality: number;
  /** Share of it an average viewer sits through, 0-1. */
  retention: number;
  /** The player's own uploads carry the post that earns the money. */
  postId?: Id;
  /** Scheduled uploads are not on the feed until their hour comes. */
  scheduledFor?: Instant;
  status: 'published' | 'scheduled' | 'removed';
  live?: boolean;
  /**
   * A photo the player uploaded for the front of it, framed and re-encoded to
   * sixteen by nine, held as a data URL the way a headshot is.
   */
  thumbnailImage?: string;
  /** Where the video breaks into parts, in minutes from the start. */
  chapters?: { at: number; title: string }[];
  /** Whether there are captions on it at all. Not every video has them. */
  captions?: boolean;
  /** What a short was shot to, which the player picks on the camera screen. */
  sound?: string;
}

export interface VideoComment {
  id: Id;
  saveId: Id;
  videoId: Id;
  /** Somebody in the world, where the commenter is a person the game knows. */
  authorId?: Id;
  authorName: string;
  text: string;
  at: Instant;
  likes: number;
  /** -100 to 100. */
  sentiment: number;
  byPlayer?: boolean;
  replyToId?: Id;
  /**
   * The ones you should not read. Hidden behind a choice rather than served
   * to you, because that is the actual experience of having a channel.
   */
  harsh?: boolean;
  /** True once the player has looked at it, so a reply is not a surprise. */
  seen?: boolean;
  /** Held at the top of the section by the channel, as one can be. */
  pinned?: boolean;
  /** The little heart a creator can put on a comment, and only they can. */
  hearted?: boolean;
}

/**
 * The bell, as an inbox rather than a shower of toasts.
 *
 * A notice is what the app would put behind the bell: a channel you follow put
 * something out, somebody replied to you, your own channel passed a number
 * that matters. It is read when you open it, and not before.
 */
export interface VideoNotice {
  id: Id;
  saveId: Id;
  personId: Id;
  kind: 'upload' | 'live' | 'reply' | 'milestone' | 'payout';
  text: string;
  at: Instant;
  seen: boolean;
  channelId?: Id;
  videoId?: Id;
}

/**
 * How the player has the app set up. One set of preferences per save, because
 * they are the player's and not any one video's.
 */
export interface VideoPreferences {
  /** 0.25 to 2. Watching faster costs less of the day and takes less in. */
  speed: number;
  /** What it is set to play at. The low ones are not worth watching. */
  quality: 'auto' | '1080p' | '720p' | '480p' | '144p';
  /** Whether the next one starts on its own when this one ends. */
  autoplay: boolean;
  /** Captions on, where the video has them. */
  captions: boolean;
  /** Sorting and filtering the search results, remembered between searches. */
  searchSort: 'relevance' | 'date' | 'views';
}

export interface VideoSubscription {
  id: Id;
  saveId: Id;
  personId: Id;
  channelId: Id;
  since: Instant;
  /** The bell. Off by default, because it is off by default. */
  notify: boolean;
  /** All, the ones it thinks you want, or none: the three the bell offers. */
  bell?: 'all' | 'personalized' | 'none';
}

export interface WatchRecord {
  id: Id;
  saveId: Id;
  personId: Id;
  videoId: Id;
  at: Instant;
  minutes: number;
  finished: boolean;
  liked?: boolean;
}

/**
 * The rest of what a video platform is.
 *
 * A feed and a watch page are the half of it people see. The other half is
 * everything the app keeps for you and everything it pays you: playlists and
 * the two the app makes itself, a subscription that removes the ads and pays
 * the creators you watch, memberships somebody buys to support a channel, the
 * one-off tips under a video, a stream with a chat in it, and the posts a
 * channel writes when it has not got a video ready.
 */
export interface VideoPlaylist {
  id: Id;
  saveId: Id;
  ownerId: Id;
  title: string;
  description: string;
  videoIds: Id[];
  visibility: 'public' | 'private' | 'unlisted';
  /** The app makes two of these itself and they cannot be deleted. */
  kind: 'playlist' | 'watch_later' | 'liked';
  createdAt: Instant;
  updatedAt: Instant;
}

export interface LiveStream {
  id: Id;
  saveId: Id;
  channelId: Id;
  title: string;
  startedAt: Instant;
  endedAt?: Instant;
  minutes: number;
  peakViewers: number;
  averageViewers: number;
  chatMessages: number;
  /** What people paid to have a message read out, in total. */
  superChatTotal: Money;
  status: 'live' | 'ended';
}

export interface CommunityPost {
  id: Id;
  saveId: Id;
  channelId: Id;
  kind: 'text' | 'poll';
  text: string;
  at: Instant;
  likes: number;
  commentCount: number;
  /** A poll's options and where the votes went. */
  options?: { label: string; votes: number }[];
  /** Which option the player chose, where they voted. */
  votedFor?: number;
}

export interface ChannelMembership {
  id: Id;
  saveId: Id;
  channelId: Id;
  /** The member. Somebody in the world, or the player. */
  personId: Id;
  tier: string;
  monthly: Money;
  since: Instant;
  endedAt?: Instant;
}

/**
 * What a month on the channel actually paid, and where it came from. The app
 * shows a total; a creator lives on the breakdown.
 */
export interface CreatorPayout {
  id: Id;
  saveId: Id;
  accountId: Id;
  /** The month it covers, as the first instant of it. */
  month: Instant;
  ads: Money;
  premium: Money;
  memberships: Money;
  tips: Money;
  sponsorship: Money;
  total: Money;
  /** Monetized views the ad money was earned on. */
  monetizedViews: number;
  paidAt?: Instant;
}

/**
 * The other two apps.
 *
 * A photo app and a text app are not one app with two skins, so they do not
 * share a shape here either. What they do share is that both are made of
 * accounts and the things those accounts put out, and that both are populated
 * by SLATE's own people rather than by anybody real.
 *
 * A profile is somebody's presence on one platform. The player has one on each
 * they join; everybody else's is derived from the roster, the same way a video
 * channel is, so the world costs a save nothing.
 */
export interface SocialProfile {
  id: Id;
  saveId: Id;
  platform: PlatformId;
  /** The roster entry it was made from, so a save keeps the same people. */
  sourceId?: string;
  handle: string;
  name: string;
  bio: string;
  topic: string;
  followers: number;
  following: number;
  verified: boolean;
  createdAt: Instant;
  /** How often they post, in days. */
  cadenceDays: number;
  /** 0-100 how good they are at it. */
  craft: number;
  /** Whose profile it is, where somebody in the world holds it. */
  ownerId?: Id;
  /** The player's own, tied to the account that carries the money. */
  accountId?: Id;
  avatarImage?: string;
  /** The line somebody has put above their picture, which is up for a day. */
  note?: string;
  noteAt?: Instant;
  /** How many they have put out, which their feed is counted back from. */
  posts: number;
  lastPostAt?: Instant;
}

/**
 * One thing on one of those two apps.
 *
 * A photograph with a caption, a carousel, a reel, a story that is gone in a
 * day, a text post, a reply to one, a repost, or a quote of one. The kind
 * decides what it is; the platform decides where it can exist.
 */
export interface SocialItem {
  id: Id;
  saveId: Id;
  platform: PlatformId;
  profileId: Id;
  kind:
    | 'photo' | 'carousel' | 'reel' | 'story' | 'text' | 'reply' | 'repost' | 'quote'
    | 'message' | 'clip' | 'live';
  text: string;
  at: Instant;
  likes: number;
  comments: number;
  reposts: number;
  /** Pictures the player brought, framed and re-encoded like every other. */
  images?: string[];
  /** What this is a reply to, a repost of, or a quote of. */
  parentId?: Id;
  /** The other end of a message thread, which is who it is with. */
  withProfileId?: Id;
  /** A story is gone after this. */
  expiresAt?: Instant;
  /** A story only the close friends list sees. */
  closeOnly?: boolean;
  /** Which of the player's saved collections this is filed under. */
  collection?: string;
  /** The sound a short is cut to, where the app has one. */
  sound?: string;
  /** Where the photograph was taken, where anybody said. */
  place?: string;
  topic: string;
  /** True where the player made it, so it can be edited and deleted. */
  byPlayer?: boolean;
  /** Whether the player has liked, saved or reposted it. */
  liked?: boolean;
  saved?: boolean;
  reposted?: boolean;
  /** Read once, so a story ring goes gray. */
  seen?: boolean;
}

/**
 * How the player has the two apps set up.
 *
 * One record per save, because these are the player's and not any one app's,
 * and because every one of them changes what the app actually does: a muted
 * account is gone from the feed, a blocked one is gone from search as well, a
 * hidden word takes a comment out of the room, and a private account grows
 * more slowly because fewer people can see it to follow it.
 */
export interface SocialSettings {
  /** A private account is seen by fewer people, so it grows more slowly. */
  privateAccount: boolean;
  /** Hiding the numbers hides them on everybody's posts, including yours. */
  hideCounts: boolean;
  notificationsOn: boolean;
  mutedProfileIds: Id[];
  blockedProfileIds: Id[];
  /** Comments carrying any of these never reach you. */
  hiddenWords: string[];
  /** Meta Verified on the photo app, which is a paid subscription. */
  photoVerified?: boolean;
  photoVerifiedAt?: Instant;
}

/**
 * A follow, which runs in both directions.
 *
 * With `personId` set it is the player following an account. With
 * `byProfileId` set instead it is an account that chose to follow the player,
 * which is what makes a follower a person on a list rather than a number that
 * went up.
 */
export interface SocialFollow {
  id: Id;
  saveId: Id;
  /** The player, where this is one of theirs. */
  personId?: Id;
  /** The world account, where this is somebody following the player. */
  byProfileId?: Id;
  profileId: Id;
  since: Instant;
  /** Close friends, which is the list a story can be limited to. */
  close?: boolean;
}

/**
 * A room on the text app.
 *
 * Communities, Lists and Spaces are the same shape underneath — a name and a
 * set of accounts — and differ in what they do: a community is one you join, a
 * list is one you keep, and a space is one that runs for an hour and then is
 * over. Keeping them one record means a list you made and a community you
 * joined cannot drift apart in how they behave.
 */
export interface SocialRoom {
  id: Id;
  saveId: Id;
  platform: PlatformId;
  kind: 'community' | 'list' | 'space';
  name: string;
  topic: string;
  /** Accounts in it. */
  profileIds: Id[];
  /** True where the player made it or joined it. */
  joined?: boolean;
  /** True where the player is the one who made it. */
  mine?: boolean;
  members: number;
  createdAt: Instant;
  /** A space runs and then stops. */
  startedAt?: Instant;
  endedAt?: Instant;
  peak?: number;
}

export interface BrandDeal {
  id: Id;
  saveId: Id;
  personId: Id;
  brandName: string;
  brandRefId?: string;
  platform: PlatformId | 'multi';
  compensation: Money;
  /** Extra pay per thousand views above a threshold. */
  performanceBonusCpm?: Money;
  deliverables: { format: PostFormat; count: number; delivered: number }[];
  startsAt: Instant;
  deadlineAt: Instant;
  endsAt: Instant;
  exclusivityCategory?: string;
  usageRightsMonths: number;
  requiresApproval: boolean;
  status: 'offered' | 'active' | 'delivered' | 'breached' | 'completed' | 'declined' | 'expired';
  paidAmount: Money;
  offeredAt: Instant;
}

// ---------------------------------------------------------------------------
// Film and television
// ---------------------------------------------------------------------------
//
// Gone. The whole film and television half of the simulation — projects,
// rights, drafts, roles, auditions, shoot days, post, releases, reviews,
// awards, festivals, franchises, studios, networks, the box office and the
// trade press — was removed deliberately, not lost. Saves written before that
// carry the records forward to schema 26, which drops them; nothing in the
// life simulation was built on top of them.


// ---------------------------------------------------------------------------
// Companies
// ---------------------------------------------------------------------------

/**
 * A piece of press published inside a save.
 *
 * Written by SLATE in the register of a real outlet, about SLATE's invented
 * films. It is not an article that publication wrote, and every screen that
 * shows one says so. The outlet, its masthead and everything factual about it
 * are the public record; the words are the simulation's.
 */
export interface PressItem {
  id: Id;
  at: Instant;
  outletId: string;
  outletName: string;
  kind: string;
  desk: string;
  register: string;
  headline: string;
  standfirst: string;
  paragraphs: string[];
  /** What the piece is about, so a project page can find its own coverage. */
  projectId?: Id;
  personId?: Id;
  studioId?: string;
  networkId?: string;
  /** True when the story is about the player. */
  aboutPlayer?: boolean;
}

/**
 * The player's production company.
 *
 * After the strike there is one of these that matters, and it is theirs. It
 * holds the money, the material, the people and the standing, and every
 * decision the game asks about is finally a decision this company made.
 */
export interface Company {
  id: Id;
  saveId: Id;
  name: string;
  legalName: string;
  structure: 'sole_proprietor' | 'llc' | 's_corp' | 'c_corp' | 'partnership';
  kind: 'production' | 'studio' | 'distributor' | 'agency' | 'vendor' | 'exhibitor' | 'other';
  ownerships: { holderId: Id; holderKind: 'person' | 'company'; percent: number }[];
  founderId: Id;
  headquartersPropertyId?: Id;
  headquartersLocationId: string;

  /** The shape of the shop: kitchen table, boutique, independent, studio. */
  shingle: string;
  /** What the company says it is for. Buyers and talent both read it. */
  remit: string;
  /** In the founder's words. Shown on the company's own page. */
  strategy: string;

  cashAccountId: Id;
  creditAccountId?: Id;

  /** Monthly overhead, in cents, before anybody is paid. */
  overhead: Money;
  /**
   * What the founder pays themselves out of it each month.
   *
   * With no job system there are no wages, and somebody who wholly owns a
   * company does not go hungry beside it — they take a draw. It is money the
   * company then cannot spend on a picture, which is the whole tension: every
   * dollar you live on is a dollar that is not on the screen.
   */
  founderDraw: Money;
  /** How many projects it can carry before the work suffers. */
  capacity: number;

  /** 0-100 how the industry regards the company. */
  reputation: number;
  /** 0-100 what talent thinks of working here, which is not the same thing. */
  standingWithTalent: number;
  /** Maximum single-project greenlight the company can support, in cents. */
  greenlightCeiling: Money;
  valuation: Money;
  foundedAt: Instant;
  dissolvedAt?: Instant;
  registeredIn: string;
}

export interface Division {
  id: Id;
  saveId: Id;
  companyId: Id;
  name: string;
  focus: string;
  headId?: Id;
  budget: Money;
  spent: Money;
  employeeIds: Id[];
  projectIds: Id[];
  createdAt: Instant;
}

export interface Employee {
  id: Id;
  saveId: Id;
  companyId: Id;
  divisionId?: Id;
  personId: Id;
  title: string;
  department: string;
  annualSalary: Money;
  /** Cents of single-project greenlight authority. */
  authority: Money;
  performance: number;
  hiredAt: Instant;
  departedAt?: Instant;
  reportsToId?: Id;
}

export interface Equipment {
  id: Id;
  saveId: Id;
  ownerId: Id;
  ownerKind: 'person' | 'company';
  category: 'camera' | 'lens' | 'lighting' | 'grip' | 'sound' | 'computer' | 'storage' | 'vehicle' | 'specialty';
  name: string;
  brand: string;
  purchasePrice: Money;
  currentValue: Money;
  condition: number;
  acquiredAt: Instant;
  acquiredVia: 'purchase' | 'rental' | 'lease';
  rentalEndsAt?: Instant;
  assignedToProjectId?: Id;
  storedAtPropertyId?: Id;
  maintenanceDueAt?: Instant;
  /** Quality contribution when used on a production. */
  qualityRating: number;
}

export interface MerchandiseLine {
  id: Id;
  saveId: Id;
  ownerCompanyId: Id;
  projectId?: Id;
  franchiseId?: Id;
  name: string;
  category: 'apparel' | 'accessory' | 'collectible' | 'home' | 'licensed' | 'print';
  unitCost: Money;
  retailPrice: Money;
  unitsManufactured: number;
  unitsSold: number;
  unitsReturned: number;
  inventoryValue: Money;
  revenue: Money;
  royaltyRate: number;
  royaltiesPaid: Money;
  launchedAt: Instant;
  status: 'design' | 'manufacturing' | 'selling' | 'sold_out' | 'discontinued';
}

// ---------------------------------------------------------------------------
// Player-facing surfaces
// ---------------------------------------------------------------------------

export interface DecisionItem {
  id: Id;
  saveId: Id;
  /** Higher shows first. */
  urgency: number;
  category: string;
  title: string;
  detail: string;
  /** Where the player goes to deal with it. */
  /**
   * Where to send the player to act on it. Optional: a decision about a
   * part of the game whose screen is not built has nowhere to send them, and
   * an Open button onto nothing is worse than no Open button.
   */
  route?: string;
  /** Optional inline actions the Decision Center can execute directly. */
  actions: { label: string; commandKind: string; payload: Record<string, unknown> }[];
  dueAt?: Instant;
  createdAt: Instant;
  dismissedAt?: Instant;
  resolvedAt?: Instant;
  refType?: string;
  refId?: Id;
}

export interface Notification {
  id: Id;
  saveId: Id;
  at: Instant;
  category: string;
  title: string;
  body: string;
  read: boolean;
  route?: string;
  refType?: string;
  refId?: Id;
  importance: number;
}

export interface TutorialProgress {
  /** Tutorial ids the player has completed. */
  completed: string[];
  /** Tutorial ids currently in progress. */
  active: string[];
  dismissed: string[];
  guidedMode: boolean;
  advancedMode: boolean;
}

export interface Preferences {
  reducedMotion: boolean;
  audioEnabled: boolean;
  audioVolume: number;
  /**
   * How fast the world runs against real time. 'live' is one to one: a minute
   * of your evening is a minute of theirs. The faster settings are there for
   * waiting something out, not because the game needs them.
   */
  timeSpeed: 'paused' | 'live' | 'fast' | 'faster';
  compactMode: boolean;
  showAdvancedNumbers: boolean;
  confirmLargePurchases: boolean;
  largePurchaseThreshold: Money;
}


// ---------------------------------------------------------------------------
// The universe
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// Scenes — living a day through text
// ---------------------------------------------------------------------------

/** One line of what happened in a scene. Bounded; not long-term memory. */
export interface SceneTranscriptLine {
  at: Instant;
  /** 'you', 'world', or a person id for somebody speaking. */
  who: string;
  text: string;
}

export type SceneStatus = 'active' | 'interrupted' | 'completed' | 'abandoned';

/**
 * A scene in progress, or one that finished. The definition it runs on is
 * trusted code; what is stored here is where it got to and what it decided.
 * Every fact a scene commits — money, time, ownership, a relationship — lives
 * in the system that owns it, not here.
 */
export interface SceneSession {
  id: Id;
  saveId: Id;
  definitionId: string;
  version: number;
  /** Step revision. A choice made against an old revision is refused. */
  revision: number;
  node: string;
  status: SceneStatus;
  /** Where it was started; leaving the city or the place interrupts it. */
  locationId: string;
  placeId?: string;
  participantIds: Id[];
  startedAt: Instant;
  updatedAt: Instant;
  endedAt?: Instant;
  context: Record<string, string | number | boolean | null>;
  /** Idempotency keys of the operations this scene has committed, in order. */
  committed: string[];
  transcript: SceneTranscriptLine[];
  interruption?: { at: Instant; reason: string; resumable: boolean };
  /** What raised it, when something did: a plan, an appointment. */
  refType?: string;
  refId?: Id;
}

/**
 * What this save has heard from the dialogue library: ids and when, bounded,
 * never the text. Selection weights away from what has been heard.
 */
export interface DialogueState {
  version: 1;
  seen: Record<string, { n: number; at: Instant }>;
}

export interface SceneState {
  version: 2;
  /** The one scene in the foreground, if any. */
  activeId?: Id;
  sessions: Record<Id, SceneSession>;
}

// ---------------------------------------------------------------------------
// What people remember
// ---------------------------------------------------------------------------

export type PersonFactKind = 'promise' | 'meeting' | 'topic' | 'boundary' | 'preference' | 'goal' | 'event';

/**
 * A structured thing somebody knows, as against a line of dialogue. A
 * trainer remembers your goal; a friend remembers you said you would call;
 * a date remembers you do not drink. These shape what they do next, and they
 * are the memory that survives the scene that made them.
 */
export interface PersonFact {
  id: Id;
  at: Instant;
  kind: PersonFactKind;
  /** Who it is about, when not the person holding it. */
  aboutId?: Id;
  text: string;
  /** How much it shapes behavior, 0-100. */
  weight: number;
  /** When it stops mattering. Absent means it does not fade. */
  expiresAt?: Instant;
  /** Where it came from. */
  sourceKind: string;
  refType?: string;
  refId?: Id;
}

/** How training has gone: soreness now, and the best of every lift. */
export interface TrainingRecord {
  /** 0-100. High soreness lowers readiness and raises injury risk. */
  soreness: number;
  sorenessUntil?: Instant;
  lifts: Record<string, { best: number; sessions: number; lastAt: Instant }>;
  sessions: number;
  lastWorkoutAt?: Instant;
  /** A trainer paid for, until when, and where. The engine checks this, not the screen. */
  trainer?: { personId: Id; placeId: string; until: Instant };
  /** The workout under way: what has been done so far, kept by the engine as it happens. */
  current?: {
    placeId: string;
    startedAt: Instant;
    focus: WorkoutFocus;
    blocks: WorkoutBlock[];
    trainerId?: Id;
    classId?: string;
    cost: Money;
    injured: boolean;
    effects: Record<string, number>;
  };
}

// ---------------------------------------------------------------------------
// Fitness — gyms, passes and workouts
// ---------------------------------------------------------------------------

export type MembershipProduct = 'day_pass' | 'monthly' | 'annual';

export interface Membership {
  id: Id;
  saveId: Id;
  personId: Id;
  placeId: string;
  gymName: string;
  product: MembershipProduct;
  price: Money;
  startsAt: Instant;
  endsAt: Instant;
  status: 'active' | 'cancelled' | 'lapsed' | 'expired';
  /** The recurring bill behind a monthly or annual membership. */
  billId?: Id;
  visits: number;
  cancelledAt?: Instant;
}

export type WorkoutFocus = 'strength' | 'cardio' | 'mobility' | 'class';
export type WorkoutIntensity = 'easy' | 'steady' | 'hard';

export interface WorkoutBlock {
  exerciseId: string;
  sets: number;
  intensity: WorkoutIntensity;
  minutes: number;
  /** True when this block beat the previous best. */
  progressed: boolean;
}

export interface Workout {
  id: Id;
  saveId: Id;
  personId: Id;
  placeId: string;
  gymName: string;
  at: Instant;
  minutes: number;
  focus: WorkoutFocus;
  blocks: WorkoutBlock[];
  trainerId?: Id;
  classId?: string;
  cost: Money;
  effects: Record<string, number>;
  cutShort: boolean;
  injured: boolean;
}

// ---------------------------------------------------------------------------
// Personal plans
// ---------------------------------------------------------------------------

export type PlanStatus = 'planned' | 'attended' | 'skipped' | 'missed' | 'cancelled';

/**
 * Something you decided to do at a time. Unlike a bill or a flight, it is
 * yours to move or drop. When it comes due it opens a scene, or runs the same
 * scene summarized, and what happened is recorded as one of the five states.
 */
export interface PersonalPlan {
  id: Id;
  saveId: Id;
  personId: Id;
  title: string;
  at: Instant;
  durationMinutes: number;
  locationId: string;
  placeId?: string;
  /** The scene to open when it is time, and what to open it with. */
  sceneDefinitionId?: string;
  sceneInput?: Record<string, string | number | boolean | null>;
  participantIds: Id[];
  status: PlanStatus;
  scheduledItemId: Id;
  reminderItemId?: Id;
  /** Minutes before, for the reminder. */
  reminderMinutes?: number;
  createdAt: Instant;
  resolvedAt?: Instant;
  sceneId?: Id;
}

export const SAVE_SCHEMA_VERSION = 66;

export interface SaveMeta {
  id: Id;
  slot: 1 | 2 | 3;
  schemaVersion: number;
  createdAt: number;
  lastPlayedAt: number;
  /** Accumulated real seconds of play. */
  playtimeSeconds: number;
  /** Deterministic seed for the whole universe. */
  seed: string;
  characterName: string;
  /** The player's headshot, mirrored here so a slot can show it without
   *  deserialising the whole universe behind it. */
  portrait?: string;
  careerLabel: string;
  locationLabel: string;
  worldDateLabel: string;
  netWorthLabel: string;
  /** Set while a migration is mid-flight, for recovery. */
  migrationInProgress?: { from: number; to: number; startedAt: number };
  backupAvailable: boolean;
  appVersion: string;
}

/**
 * One save is one universe. Every collection here is scoped to this save and
 * to nothing else. There is no shared mutable state between saves anywhere in
 * SLATE; the only thing saves have in common is immutable reference data.
 */
export interface SaveUniverse {
  meta: SaveMeta;
  /** Monotonic id counter. Keeps ids deterministic across a replay. */
  __idCounter: number;

  /** The one canonical world instant. */
  now: Instant;
  /** Zone used for the player's day-to-day display. */
  homeZone: TimeZone;
  /** Zone the player is physically in right now. */
  currentZone: TimeZone;
  playerId: Id;

  people: Record<Id, Person>;
  relationships: Record<Id, Relationship>;
  households: Record<Id, Household>;

  accounts: Record<Id, Account>;
  transactions: LedgerTransaction[];
  bills: Record<Id, Bill>;
  creditProfiles: Record<Id, CreditProfile>;
  taxYears: Record<Id, TaxYearRecord>;

  properties: Record<Id, Property>;
  structures: Record<Id, Structure>;
  rooms: Record<Id, Room>;
  zones: Record<Id, Zone>;
  furnishings: Record<Id, Furnishing>;
  propertyListings: Record<Id, PropertyListing>;
  propertyOffers: Record<Id, PropertyOffer>;
  realEstateAgents: Record<Id, RealEstateAgent>;
  constructionProjects: Record<Id, ConstructionProject>;
  constructionPhases: Record<Id, ConstructionPhase>;
  changeOrders: Record<Id, ChangeOrder>;

  vehicles: Record<Id, Vehicle>;
  vehicleDeals: Record<Id, VehicleDeal>;
  /** Places in the queue for a marina slip. Absent on a save from before there were queues. */
  berthWaitlists?: Record<Id, BerthWaitlist>;
  /** Monthly statements, oldest pruned. Absent on a save from before statements. */
  accountStatements?: Record<Id, AccountStatement>;
  /** Applications to private banks, pending and decided. */
  privateApplications?: Record<Id, PrivateApplication>;
  /** Transfers the bank makes for you. Absent on a save from before standing orders. */
  standingOrders?: Record<Id, StandingOrder>;
  /** Sittings at a table or a counter. Absent on a save from before rooms had staff. */
  diningVisits?: Record<Id, DiningVisit>;
  /** What was worn on which day. Absent on a save from before getting dressed. */
  wornRecords?: Record<Id, WornRecord>;
  /** Pieces being made for you at a bench. Absent before jewelers had one. */
  commissions?: Record<Id, Commission>;
  /** Garments being cut for you, and the ones you cut yourself. */
  costumes?: Record<Id, Costume>;
  /** Visits to a shop floor. Absent on a save from before shops had a floor. */
  retailVisits?: Record<Id, RetailVisit>;
  dates: Record<Id, DateRecord>;
  /** Absent on a save that has not heard a line yet. */
  dialogue?: DialogueState;
  vehicleListings: Record<Id, VehicleListing>;
  vehicleModifications: Record<Id, VehicleModification>;
  serviceRecords: Record<Id, ServiceRecord>;

  assets: Record<Id, OwnedAsset>;
  outfits: Record<Id, Outfit>;
  orders: Record<Id, Order>;
  pantry: Record<Id, PantryItem>;

  healthProviders: Record<Id, HealthProvider>;
  appointments: Record<Id, Appointment>;
  prescriptions?: Record<Id, Prescription>;
  insurancePolicies: Record<Id, InsurancePolicy>;
  insuranceClaims: Record<Id, InsuranceClaim>;
  courses: Record<Id, Course>;
  enrollments: Record<Id, Enrollment>;
  /** School, for a life that is still in it. Absent on a save from before. */
  schooling?: Record<Id, Schooling>;
  /** University: applications and a degree. Absent on a save from before. */
  applications?: Record<Id, UniversityApplication>;
  studies?: Record<Id, Studies>;
  /** Seasons of sport, at school and at university. Absent on an older save. */
  seasons?: Record<Id, TrackSeason>;
  running?: Record<Id, Running>;
  growing?: Record<Id, GrowingUp>;

  trips: Record<Id, Trip>;
  flightBookings: Record<Id, FlightBooking>;
  hotelBookings: Record<Id, HotelBooking>;

  socialAccounts: Record<Id, SocialAccount>;
  socialPosts: Record<Id, SocialPost>;
  brandDeals: Record<Id, BrandDeal>;

  /** The video app: the channels of the world, what they put out, and what you watched. */
  videoChannels: Record<Id, VideoChannel>;
  videos: Record<Id, VideoItem>;
  videoComments: Record<Id, VideoComment>;
  videoSubscriptions: Record<Id, VideoSubscription>;
  watchHistory: Record<Id, WatchRecord>;
  /** The photo app and the text app: who is on them, and what they put out. */
  socialProfiles: Record<Id, SocialProfile>;
  socialItems: Record<Id, SocialItem>;
  socialFollows: Record<Id, SocialFollow>;
  socialSettings?: SocialSettings;
  socialRooms: Record<Id, SocialRoom>;
  /** Kit out on hire from a rental house. */
  kitHires: Record<Id, KitHire>;
  /** Days you shoot something of your own. */
  shootDays: Record<Id, ShootDay>;
  /** Pictures of your own, from the first day to the last festival. */
  indieFilms: Record<Id, IndieFilm>;
  cinemaTickets: Record<Id, CinemaTicket>;
  fashionInvites: Record<Id, FashionInvite>;
  goingTickets: Record<Id, GoingTicket>;
  parcels: Record<Id, Parcel>;
  /** Minutes spent in each app on each day, which is what Time Management is. */
  socialScreenTime: Record<string, number>;
  /** The bell, and how the player has the app set up. */
  videoNotices: Record<Id, VideoNotice>;
  videoPreferences?: VideoPreferences;
  /** The rest of the app: what it keeps for you, and what it pays. */
  videoPlaylists: Record<Id, VideoPlaylist>;
  liveStreams: Record<Id, LiveStream>;
  communityPosts: Record<Id, CommunityPost>;
  channelMemberships: Record<Id, ChannelMembership>;
  creatorPayouts: Record<Id, CreatorPayout>;

  /**
   * Companies survive the removal of the film half because finance and
   * insurance are built on them: an account can be held by one and a policy
   * can be written for one. Nothing creates them any more.
   */
  companies: Record<Id, Company>;
  /** The company the player runs. Set the moment the save is made. */
  playerCompanyId?: Id;

  /**
   * The state of the industry after the strike.
   *
   * The strike is invented for this game and the save says so, so that a
   * screenshot of any of it can never be read as an account of a real one.
   */
  industry: {
    /** Whether the aftermath opening has been shown. */
    briefed: boolean;
    /** How many months the stoppage ran. Fiction, and fixed at creation. */
    strikeMonths: number;
    /** Production companies still trading besides the player's. */
    rivals: number;
    /** 0-100 how much unmade material is sitting in the world. Starts at nothing. */
    material: number;
    /** 0-100 how badly the buyers need something to put out. */
    buyerHunger: number;
    /** 0-100 how much of the crew base is still reachable. */
    crewDepth: number;
    /** What the player set as the going rate, by craft. Watched by everybody. */
    ratesSet: Record<string, Money>;
  };

  /** Scenes in progress and recently finished. */
  scenes: SceneState;
  /** Gym passes and memberships. */
  memberships: Record<Id, Membership>;
  /** Workouts, most recent kept. */
  workouts: Record<Id, Workout>;
  /** Things you planned to do. */
  plans: Record<Id, PersonalPlan>;

  scheduled: ScheduledItem[];
  audits: AuditRecord[];
  history: HistoryRecord[];
  decisions: Record<Id, DecisionItem>;
  notifications: Notification[];

  tutorial: TutorialProgress;
  preferences: Preferences;

  /** Idempotency keys already applied, mapped to their recorded result. */
  idempotency: Record<string, { at: Instant; result: unknown }>;

  /** Counters used by systems that need per-save monotonic sequences. */
  counters: Record<string, number>;

  /**
   * Commands the engine itself raised while the clock was moving that failed.
   * Kept so a background failure is visible in a diagnostic report rather than
   * disappearing silently. Capped: this is a symptom log, not history.
   */
  engineFailures: { at: Instant; kind: string; error: string }[];
}
