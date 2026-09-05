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

  personality: Personality;
  interests: string[];
  goals: string[];
  lifestyle: 'frugal' | 'modest' | 'comfortable' | 'lavish';
  background: string;

  attributes: AttributeSheet;
  traits: string[];
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

  wellbeing: Wellbeing;
  reputation: Reputation;

  careerTrack: CareerTrack;
  /**
   * Industry experience: earned from auditions, shoot days, credits, shifts
   * and the rest, spent to unlock professions. Absent on people from before
   * professions existed and on NPCs, and read as zero.
   */
  industryXp?: number;
  /** The professions they have unlocked, by id. Absent reads as none. */
  professions?: Partial<Record<ProfessionId, ProfessionProgress>>;
  /** Employment record id for their ordinary job, if any. */
  jobId?: Id;
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

  /** Where an NPC sits in the simulation budget. */
  tier: SimulationTier;
  /** Archetype key used to generate consistent NPC behaviour. */
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
// Employment
// ---------------------------------------------------------------------------

export type PayBasis = 'hourly' | 'salary' | 'daily' | 'per_project' | 'commission';

export interface Job {
  id: Id;
  saveId: Id;
  personId: Id;
  employerName: string;
  employerRefId?: string;
  title: string;
  /** 'retail' | 'hospitality' | 'office' | 'trade' | 'industry' | ... */
  sector: string;
  locationId: string;
  payBasis: PayBasis;
  /** Cents per hour, per day, or per year depending on basis. */
  payRate: Money;
  hoursPerWeek: number;
  /** Days of week worked, 0=Sunday. */
  workDays: number[];
  startHour: number;
  endHour: number;
  level: number;
  ladder: string[];
  /** 0-100 rating from the employer. */
  performance: number;
  attendance: number;
  benefits: { health: boolean; dental: boolean; vision: boolean; retirement: boolean; paidLeave: number };
  startedAt: Instant;
  endedAt?: Instant;
  endReason?: string;
  /** Consecutive missed shifts; three is a problem. */
  missedShifts: number;
  /** Cents accrued but not yet paid. */
  accruedPay: Money;
  nextPayAt: Instant;
}

export interface JobOpening {
  id: Id;
  saveId: Id;
  employerName: string;
  title: string;
  sector: string;
  locationId: string;
  payBasis: PayBasis;
  payRate: Money;
  hoursPerWeek: number;
  requirements: { skill: string; min: number }[];
  minimumAge: number;
  description: string;
  competition: number;
  postedAt: Instant;
  closesAt: Instant;
  benefits: Job['benefits'];
}

export type ApplicationStage = 'submitted' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected' | 'withdrawn';

export interface JobApplication {
  id: Id;
  saveId: Id;
  personId: Id;
  openingId: Id;
  stage: ApplicationStage;
  submittedAt: Instant;
  interviewAt?: Instant;
  decidedAt?: Instant;
  /** 0-100 score from the hiring evaluation. */
  score?: number;
  note?: string;
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
  closingCosts?: Money;
  agentId?: Id;
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
  /** Planned structures, realised as the build progresses. */
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

export interface Vehicle {
  id: Id;
  saveId: Id;
  ownerId: Id;
  ownerKind: 'person' | 'company';
  catalogId: string;
  make: string;
  model: string;
  year: number;
  trim: string;
  bodyStyle: string;
  powertrain: 'gas' | 'diesel' | 'hybrid' | 'phev' | 'ev';
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
  /** Litres per 100km equivalent or kWh/100mi, kept abstract. */
  efficiency: number;
  /**
   * What is in the tank, 0-100. A car from before fuel was tracked is read as
   * full the first time somebody looks at it.
   */
  fuelPercent?: number;
  horsepower: number;
  zeroToSixty: number;
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
  /** How much the dealer will move, as a fraction. */
  negotiationRoom: number;
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
  insurancePolicyId?: Id;
  /** Provenance chain for luxury goods. */
  provenance: { at: Instant; note: string }[];
  /** Wardrobe-specific. */
  wardrobe?: { slot: string; formality: number; season: string[]; colour: string };
  soldAt?: Instant;
  tags: string[];
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
}

export type InsuranceLine =
  | 'health' | 'dental' | 'vision' | 'auto' | 'renters' | 'homeowners'
  | 'valuables' | 'travel' | 'life' | 'umbrella' | 'business' | 'production' | 'equipment';

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
  status: 'booked' | 'checked_in' | 'flown' | 'cancelled' | 'refunded' | 'changed';
  refundable: boolean;
  loyaltyMilesEarned: number;
  bookedAt: Instant;
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
  route: string;
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

export const SAVE_SCHEMA_VERSION = 27;

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

  jobs: Record<Id, Job>;
  jobOpenings: Record<Id, JobOpening>;
  jobApplications: Record<Id, JobApplication>;

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
  vehicleListings: Record<Id, VehicleListing>;
  vehicleModifications: Record<Id, VehicleModification>;
  serviceRecords: Record<Id, ServiceRecord>;

  assets: Record<Id, OwnedAsset>;
  outfits: Record<Id, Outfit>;
  orders: Record<Id, Order>;
  pantry: Record<Id, PantryItem>;

  healthProviders: Record<Id, HealthProvider>;
  appointments: Record<Id, Appointment>;
  insurancePolicies: Record<Id, InsurancePolicy>;
  insuranceClaims: Record<Id, InsuranceClaim>;
  courses: Record<Id, Course>;
  enrollments: Record<Id, Enrollment>;

  trips: Record<Id, Trip>;
  flightBookings: Record<Id, FlightBooking>;
  hotelBookings: Record<Id, HotelBooking>;

  socialAccounts: Record<Id, SocialAccount>;
  socialPosts: Record<Id, SocialPost>;
  brandDeals: Record<Id, BrandDeal>;

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
