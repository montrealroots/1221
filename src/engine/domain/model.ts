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
import type { RoleCategory } from '../content/casting-industry';
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
// Film and television — one canonical project
// ---------------------------------------------------------------------------

export type ProjectFormat = 'feature' | 'short' | 'series' | 'limited_series' | 'tv_movie' | 'documentary' | 'special';

export type ProjectPhase =
  | 'idea' | 'rights' | 'writing' | 'development' | 'packaging' | 'greenlight'
  | 'financing' | 'preproduction' | 'production' | 'post' | 'testing'
  | 'marketing' | 'festivals' | 'distribution' | 'released' | 'library' | 'shelved';

export const PROJECT_PHASE_ORDER: readonly ProjectPhase[] = [
  'idea', 'rights', 'writing', 'development', 'packaging', 'greenlight',
  'financing', 'preproduction', 'production', 'post', 'testing',
  'marketing', 'festivals', 'distribution', 'released', 'library',
];

export interface Project {
  id: Id;
  saveId: Id;
  title: string;
  workingTitle?: string;
  format: ProjectFormat;
  genres: string[];
  logline: string;
  synopsis: string;
  phase: ProjectPhase;
  /** Phases already completed, with when. */
  phaseHistory: { phase: ProjectPhase; enteredAt: Instant }[];

  /** Who controls it. */
  ownerCompanyId?: Id;
  createdById: Id;
  rightsId?: Id;

  /** Key creative and business attachments. */
  attachments: { personId: Id; role: string; attachedAt: Instant; confirmed: boolean }[];
  /** Every approach made to somebody for a chair on this picture, and the answer. */
  approaches?: CraftApproach[];
  writerIds: Id[];
  directorId?: Id;
  producerIds: Id[];
  showrunnerId?: Id;
  castIds: Id[];
  /**
   * The credit list as it will always read, written the moment someone is
   * attached or cast. The id links to a person while that person is still
   * simulated; the name and role are the permanent record. A film made twenty
   * years ago keeps its billing block even after the world has stopped
   * individually simulating the day players in it.
   */
  credits: { personId: Id; name: string; role: string; characterName?: string }[];

  budget: Money;
  budgetLocked: boolean;
  spent: Money;
  contingency: Money;
  financingIds: Id[];

  /** Development. */
  scriptDraftIds: Id[];
  currentDraftId?: Id;
  targetAudience: string;
  comparables: string[];
  /** 0-100 internal assessment of the material. */
  scriptQuality: number;
  /** 0-100 how appealing the package is to buyers. */
  packageValue: number;

  /** Production. */
  productionLocationIds: string[];
  shootDayIds: Id[];
  scheduledShootDays: number;
  completedShootDays: number;
  productionStartAt?: Instant;
  productionEndAt?: Instant;

  /** Post. */
  postTaskIds: Id[];
  pictureLockedAt?: Instant;
  /**
   * The casting office running it, from the real registry. Chosen once and
   * kept, so the same office sees an actor across a career.
   */
  castingOfficeId?: string;
  /** Effects: counted, bid on, awarded. */
  vfx?: VfxPlan;
  /** Music: spotted, written, licensed. */
  music?: MusicPlan;
  /** Stages booked for the shoot. */
  stageBookings?: StageBooking[];

  /** Release. */
  releaseId?: Id;
  distributorName?: string;
  /** The real studio that set it up or released it, when one did. */
  studioId?: string;
  /** The real network or service that commissioned or aired it, when one did. */
  networkId?: string;
  releaseDate?: Instant;
  /** How it reached the public: theatrical, streaming, network. Set at release; read by the award bodies. */
  releaseStrategy?: Release['strategy'];
  /** The language of the dialogue, ISO 639-1. Set when the project is created. */
  language?: string;
  /** The certificate it carries, as a rating id from content/ratings. */
  contentRating?: string;
  /**
   * Negative public attention attached to the picture itself, 0-100: who is in
   * it, what came out about them, what the company did about it. It follows
   * the film into the reviews and the opening.
   */
  controversy?: number;
  /** Why the picture is carrying heat, in the order it happened. */
  controversyLog?: { at: Instant; delta: number; note: string; personId?: Id }[];
  /** How hard the material runs, 0-100, on the same scale the certificates sit on. */
  contentSeverity?: number;
  /** Intended runtime in minutes. */
  runtime?: number;
  /** The country the production belongs to, a SLATE country id. Set when the project is created. */
  productionCountryId?: string;

  /** Results. Critic score follows the Metascore, audience score the audience share; the full count is in `reception`. */
  criticScore?: number;
  audienceScore?: number;
  reception?: Reception;
  /** 0-100 finished quality; the single number every result derives from. */
  finalQuality?: number;
  boxOfficeDomestic: Money;
  boxOfficeInternational: Money;
  streamingHoursViewed: number;
  totalRevenue: Money;
  totalCost: Money;

  /** Series-specific. */
  seasons?: { number: number; episodeCount: number; orderedAt: Instant; status: string }[];
  parentSeriesId?: Id;
  franchiseId?: Id;
  /** Set when the project is a real title from a studio's dated slate, released by the world on its day. */
  catalogueQid?: string;
  /** Set when the world commissioned it rather than a person. Trimmable once its run is over. */
  worldCommissioned?: boolean;

  greenlitAt?: Instant;
  greenlitById?: Id;
  createdAt: Instant;
  shelvedReason?: string;
}

export interface Rights {
  id: Id;
  saveId: Id;
  title: string;
  sourceKind: 'original' | 'book' | 'article' | 'play' | 'game' | 'format' | 'life_rights' | 'remake' | 'sequel' | 'spin_off' | 'adaptation';
  holderId: Id;
  holderKind: 'person' | 'company';
  acquiredFrom: string;
  acquisitionKind: 'option' | 'purchase' | 'license' | 'original';
  cost: Money;
  /** Option payments due later. */
  extensionCost?: Money;
  acquiredAt: Instant;
  expiresAt?: Instant;
  extensionsUsed: number;
  extensionsAllowed: number;
  scope: {
    media: ('theatrical' | 'television' | 'streaming' | 'home' | 'stage' | 'game' | 'merchandise')[];
    territories: string[];
    sequelRights: boolean;
    remakeRights: boolean;
    merchandisingRights: boolean;
  };
  chainOfTitle: { at: Instant; note: string }[];
  status: 'active' | 'expired' | 'reverted' | 'assigned';
  /** Set when the rights were licensed from a real studio's franchise. */
  licensorStudioId?: string;
  franchiseName?: string;
}

/** What a scene is doing, as a breakdown would tag it. */
export type SceneKind =
  | 'dialogue' | 'action' | 'set_piece' | 'montage' | 'intimate' | 'crowd' | 'reveal' | 'transition';

/** Anything on the page that costs a department something on the day. */
export type SceneNeed =
  | 'stunts' | 'vfx' | 'animals' | 'vehicles' | 'crowd' | 'water' | 'children'
  | 'weapons' | 'practical_effects' | 'intimacy' | 'night_exterior' | 'period_dress' | 'creature';

/**
 * One scene of a script, as a breakdown reads it.
 *
 * This is what a schedule is built from, what a call sheet lists, and what a
 * day's work is measured against. A scene is the unit the whole production
 * process runs on, which is why a script that has no scenes has no
 * production process to run.
 */
export interface Scene {
  /** '1', '2', '2A' — the number on the slugline. */
  number: string;
  interior: boolean;
  timeOfDay: 'day' | 'night' | 'dawn' | 'dusk';
  /** The place on the slugline: 'KITCHEN', 'DOCKSIDE WAREHOUSE'. */
  setting: string;
  pages: number;
  kind: SceneKind;
  /** Character names in it, from the script's own list. */
  characters: string[];
  needs: SceneNeed[];
  /** What the scene is for, in one line. */
  purpose: string;
  /** How hard it is to shoot, 1 to 5. Sets setups, and so the hours. */
  complexity: number;
}

export type CharacterArchetype =
  | 'protagonist' | 'deuteragonist' | 'antagonist' | 'love_interest' | 'mentor'
  | 'foil' | 'confidant' | 'comic_relief' | 'ensemble' | 'day_player';

/** A part as the script writes it, before anybody is cast in it. */
export interface ScriptCharacter {
  name: string;
  archetype: CharacterArchetype;
  description: string;
  ageRange: [number, number];
  sceneCount: number;
  /** Share of the dialogue, 0 to 100. */
  lineShare: number;
}

export interface ScriptDraft {
  id: Id;
  saveId: Id;
  projectId: Id;
  version: number;
  label: string;
  writerIds: Id[];
  pages: number;
  /** 0-100. The craft dimensions weighted by what the genre asks for. */
  quality: number;
  structure: number;
  dialogue: number;
  characters: number;
  /**
   * The fourteen craft dimensions, 0-100 each. This is what a draft actually
   * is: a comedy with a weak humour score is a bad comedy however tight its
   * structure, and the genre's own weighting is what turns these into the one
   * number above.
   */
  craft: Record<string, number>;
  /** The script as a breakdown reads it. Empty on a draft written before scenes existed. */
  scenes: Scene[];
  /** Every part in it. */
  scriptCharacters: ScriptCharacter[];
  writtenAt: Instant;
  notes: { at: Instant; fromId: Id; note: string; addressed: boolean }[];
  coverage?: { at: Instant; readerName: string; verdict: 'pass' | 'consider' | 'recommend'; comments: string };
  isCurrent: boolean;
}

/**
 * An offer put to somebody by name, and what they said.
 *
 * Kept on the role rather than thrown away, for two reasons. It is the record
 * of who you went to and why they passed, which the player is entitled to see.
 * And it is what makes a second attempt safe: an offer that has already been
 * answered is never re-rolled, so a retry cannot book the same person twice or
 * turn a no into a yes by asking again.
 */
export interface RoleOffer {
  personId: Id;
  /** The public record behind them, when the person is a real one. */
  recordQid?: string;
  name: string;
  amount: Money;
  offeredAt: Instant;
  answer: 'accepted' | 'declined';
  /** Why, in their words. */
  reason: string;
  /** What SLATE reckoned they would take, at the time of asking. */
  wanted: Money;
}

/**
 * An approach made to somebody for a craft job, and what they said.
 *
 * The same record a part keeps of its offers, for the chairs. It is what the
 * player is entitled to see — who you went to and why they passed — and it is
 * what makes a second approach safe: an answer already given is read back
 * rather than re-rolled, and coming back needs real money on the table.
 */
export interface CraftApproach {
  personId: Id;
  recordQid?: string;
  name: string;
  role: string;
  amount: Money;
  approachedAt: Instant;
  answer: 'accepted' | 'declined';
  reason: string;
  wanted: Money;
}

export interface Role {
  id: Id;
  saveId: Id;
  projectId: Id;
  characterName: string;
  billing: 'lead' | 'supporting' | 'featured' | 'day_player' | 'voice' | 'cameo';
  description: string;
  /**
   * What the part is hired as, in the industry's own categories: a series
   * regular is contracted to the series, a guest star to an episode, a
   * co-star to a day. Absent on parts created before categories existed, and
   * derived from the billing and the format when it is read.
   */
  category?: RoleCategory;
  /** For a series: which season, how many episodes, and how many are guaranteed. */
  episodes?: { season: number; ofEpisodes: number; guaranteed?: number };
  /** What the part is in the story, when it came from a script breakdown. */
  archetype?: CharacterArchetype;
  /** The scenes the part is in, by number, when it came from a breakdown. */
  sceneNumbers?: string[];
  /** Requirements the casting model scores against. */
  requirements: { attributeId: string; weight: number }[];
  ageRange: [number, number];
  shootDays: number;
  /** Offer range in cents. */
  payLow: Money;
  payHigh: Money;
  status: 'open' | 'casting' | 'offer_out' | 'cast' | 'closed';
  /** When the decision on this role is made. Set when casting opens. */
  decidesAt?: number;
  castPersonId?: Id;
  /** What the office will take from actors submitting: tapes, the room, or either. */
  auditionPolicy?: 'tape_only' | 'either' | 'in_person_only';
  contractId?: Id;
  /** People currently in the running. */
  shortlistIds: Id[];
  /**
   * Every audition submitted for this role. Kept on the role so a casting
   * decision never has to scan the whole universe of auditions — that scan is
   * quadratic over a long career.
   */
  auditionIds: Id[];
  /** Every offer put to somebody by name on this part, and what they said. */
  offers?: RoleOffer[];
  /** When the callbacks were held, on a part the world is casting. Absent until they are. */
  callbacksAt?: Instant;
}

/** Somebody sitting behind the table, and what they are making of you. */
export interface RoomOccupant {
  /** Which chair they are in. */
  seat: string;
  /** An in-save person, when the room is filled by one. */
  personId?: Id;
  /** A real casting director from the public record, when it is one of them. */
  castingDirectorId?: string;
  name: string;
  /** Their job, in the words the room would use. */
  title: string;
  /** What this one is watching for. */
  watchingFor: string;
  /** How much their opinion moves it, 0-1. */
  sway: number;
  /** 0-100. Fifty is the room you walked into. */
  impression: number;
  /** What they made of each beat. */
  notes: { at: Instant; beat: string; note: string; delta: number }[];
}

/**
 * How an office reads somebody after a session.
 *
 * Not a school report. These are the things a casting office actually decides
 * about you in the twenty seconds after the door shuts, in the pile they put
 * you in and the note they type next to your name.
 */
export interface SessionRead {
  /** Whether you were right for this one at all. */
  right: number;
  /** The work itself. */
  read: number;
  /** Whether the performance changed when it was asked to. */
  direction: number;
  /** How you were to have in the room. */
  inTheRoom: number;
  /** Whether they would bring you in for something else. */
  bringBack: number;
  /** Which pile they put you in. Their own words. */
  pile: 'yes' | 'maybe' | 'no' | 'wrong_for_this';
  /** The line typed next to your name in the session notes. */
  note: string;
}

/** A running relationship with one casting office. */
export interface CastingOfficeStanding {
  /** The real casting director's registry id. */
  castingDirectorId: string;
  /** How many times they have seen you, and how many were rooms rather than tapes. */
  seen: number;
  roomsHeld: number;
  /** Every session they have had you in, most recent last. */
  sessions: { at: Instant; projectTitle: string; characterName: string; read: SessionRead }[];
  /** Where you sit on their list. */
  list: 'unknown' | 'watching' | 'shortlist' | 'favourite';
  /** 0-100. What the office thinks of you, which is not shown as a number. */
  regard: number;
  firstSeenAt: Instant;
  lastSeenAt: Instant;
  /** Times they have brought you in without a submission. */
  broughtInDirectly: number;
  /** Parts they have actually given you. */
  booked: number;
  /** Every time your side has rung them for an answer. Offices notice. */
  chasedAt?: Instant[];
}

/** An audition being played out, one beat at a time. */
export interface AuditionRoomState {
  /** Which stage of the process this room is. */
  stage: string;
  occupants: RoomOccupant[];
  /** The beats this room runs, in order. */
  beats: string[];
  /** Which one is next. */
  index: number;
  /** 0-100, and high is bad. */
  nerves: number;
  /** Whether it is on camera, whether anybody is reading with you, who else is out there. */
  taped: boolean;
  hasReader: boolean;
  readerQuality: number;
  sidesChanged: boolean;
  otherActors: number;
  waitingRoomLine: string;
  /** Which kind of room this is, so it talks like one. */
  register?: string;
  /** What was said to you on the way in, and how they settled you. */
  greeting?: string;
  settle?: string;
  /** How the director framed the scene before you read it. */
  sceneFrame?: string;
  /** What the reader is giving you, which is out of your hands. */
  readerLine?: string;
  /** The note the director gave, when one was given. */
  adjustment?: string;
  adjustmentTests?: string;
  /** The question they asked afterwards. */
  smallTalk?: string;
  /** How they let you out. */
  goodbye?: string;
  /** Hours put in before walking through the door. */
  prepHours?: number;
  /** What you did, beat by beat, and what it was worth. */
  played: { beat: string; choiceId: string; label: string; score: number; note: string; said?: string; at: Instant }[];
  startedAt: Instant;
  finishedAt?: Instant;
  /** What the room said once the door shut. */
  verdict?: { score: number; line: string };
  /** Set when the player walked out before it was over. */
  walkedOut?: boolean;
}

export type AuditionStage = 'submitted' | 'self_tape' | 'first_read' | 'callback' | 'chemistry_read' | 'screen_test' | 'offer' | 'passed' | 'booked';

export interface Audition {
  id: Id;
  saveId: Id;
  roleId: Id;
  projectId: Id;
  personId: Id;
  stage: AuditionStage;
  scheduledAt?: Instant;
  locationId?: string;
  submittedAt: Instant;
  decidedAt?: Instant;
  /** 0-100 performance on the day. */
  performanceScore?: number;
  /** 0-100 how well they fit what the role needs. */
  fitScore?: number;
  /** Combined score used for the decision. */
  totalScore?: number;
  /** Rank among all candidates when decided. */
  rank?: number;
  feedback?: string;
  scheduledItemId?: Id;
  isPlayer: boolean;
  /**
   * Every room this candidate has been in for the part, in order. A casting
   * decision is made on all of them, not on the first read alone, and the
   * player can see each one when it is their picture.
   */
  rounds?: { stage: AuditionStage; at: Instant; score: number; note: string }[];
  /** Tape or the room. Set when the player submits; the office decides what it will take. */
  format?: 'self_tape' | 'in_person';
  /** The room itself, once the player has walked into it. */
  room?: AuditionRoomState;
  /** When the tape went, and how many takes it took. */
  tapeSentAt?: Instant;
  tapeTakes?: number;
  /** The office got back to you, or pointedly did not. */
  officeResponse?: { at: Instant; kind: 'callback' | 'hold' | 'pass' | 'silence'; note: string };
  /**
   * What the office actually made of you, once they have watched it. Reaches
   * the player through their representation rather than directly, the way it
   * does in life, and only when somebody is willing to pass it on.
   */
  sessionRead?: SessionRead;
  /**
   * What your agent relayed, and when. Absent when nobody would tell you.
   *
   * The grades are only the part of the office's read that was actually
   * passed on — a kind agent relays two of them, a blunt one relays all five.
   * There is never a number, because no office gives an actor a number.
   */
  relayedFeedback?: {
    at: Instant; from: string; body: string; blunt: boolean;
    grades?: { axis: 'right' | 'read' | 'direction' | 'inTheRoom' | 'bringBack'; label: string; grade: string }[];
  };
}

export type ContractKind = 'acting' | 'writing' | 'directing' | 'producing' | 'crew' | 'vendor' | 'distribution' | 'license' | 'option' | 'employment';

export interface Contract {
  id: Id;
  saveId: Id;
  kind: ContractKind;
  projectId?: Id;
  partyAId: Id;
  partyAKind: 'person' | 'company';
  partyBId: Id;
  partyBKind: 'person' | 'company';
  title: string;
  /** Guaranteed compensation in cents. */
  compensation: Money;
  /** Payment milestones. */
  paymentSchedule: { label: string; amount: Money; dueAt: Instant; trigger?: string; paid: boolean; paidAt?: Instant }[];
  /** Backend participation as a fraction of defined proceeds. */
  backendPoints?: number;
  backendKind?: 'gross' | 'adjusted_gross' | 'net';
  bonuses: { label: string; amount: Money; condition: string; triggered: boolean }[];
  /** Obligations the holder must satisfy. */
  obligations: { label: string; kind: string; dueAt?: Instant; satisfied: boolean }[];
  exclusivity?: { category: string; until: Instant };
  optionsHeld?: { label: string; exerciseBy: Instant; terms: string; exercised: boolean }[];
  startsAt: Instant;
  endsAt?: Instant;
  status: 'draft' | 'negotiating' | 'executed' | 'completed' | 'terminated' | 'breached' | 'expired';
  signedAt?: Instant;
  terminationReason?: string;
  negotiationHistory: { at: Instant; byId: Id; note: string; offer?: Money }[];
}

/** What happened in one hour of a shooting day. */
export type HourKind =
  | 'call' | 'blocking' | 'lighting' | 'rehearsal' | 'shooting' | 'lunch' | 'company_move'
  | 'weather_hold' | 'turnaround' | 'wrap' | 'overtime' | 'idle';

export interface HourEntry {
  at: Instant;
  kind: HourKind;
  sceneNumber?: string;
  /** Setups completed this hour. */
  setups: number;
  /** Takes rolled this hour. */
  takes: number;
  note: string;
}

/** The call sheet: what everybody is told the night before. */
export interface CallSheet {
  crewCall: Instant;
  firstShot: Instant;
  lunch: Instant;
  wrapTarget: Instant;
  sunrise?: Instant;
  sunset?: Instant;
  daylightMinutes: number;
  forecast: string;
  castCalls: { personId: Id; name: string; at: Instant; scenes: string[] }[];
  /** How the director wants the day shot. */
  coverage: 'lean' | 'standard' | 'thorough';
  notes: string[];
}

export interface ShootDay {
  id: Id;
  saveId: Id;
  projectId: Id;
  dayNumber: number;
  date: Instant;
  callTime: Instant;
  wrapTargetTime: Instant;
  actualWrapTime?: Instant;
  locationId: string;
  locationName: string;
  isStage: boolean;
  /** What kind of day this is. Absent on days boarded before pipelines existed, which are photography. */
  kind?: ShootDayKind;
  /** The lot the stage is on, when it is a stage. */
  lotId?: string;
  scenes: {
    sceneNumber: string; pages: number; description: string; castIds: Id[]; shot: boolean;
    /** From the script's breakdown, when the day was boarded from one. */
    setups?: number; setupsDone?: number; takes?: number; complexity?: number;
    interior?: boolean; timeOfDay?: string; setting?: string; needs?: string[];
    /** 0-100 for this scene alone. */
    quality?: number;
  }[];
  /** The night before. Absent on a day boarded before call sheets existed. */
  callSheet?: CallSheet;
  /** The day, hour by hour. Absent until it has been shot. */
  hours?: HourEntry[];
  /** How the director wants it run. Set by prod.direct_day; the first AD's defaults otherwise. */
  plan?: { coverage: 'lean' | 'standard' | 'thorough'; pushPastTwelve: boolean; dropScenes: string[] };
  plannedPages: number;
  completedPages: number;
  requiredCastIds: Id[];
  crewCount: number;
  dailyBudget: Money;
  actualCost: Money;
  status: 'scheduled' | 'shooting' | 'complete' | 'incomplete' | 'cancelled' | 'weather_hold';
  /** Things that happened. Feeds "why did costs increase?". */
  incidents: { at: Instant; kind: string; description: string; costDelta: Money; timeDeltaMinutes: number }[];
  overtimeMinutes: number;
  /** 0-100 quality of the footage captured. */
  footageQuality?: number;
  /**
   * What this day produced, in the unit that suits it: lines recorded, shots
   * animated, seconds in the can, usable minutes of interview.
   */
  output?: { unit: string; done: number; planned: number };
  scheduledItemId?: Id;
}

export type PostTaskKind =
  | 'assembly' | 'editors_cut' | 'directors_cut' | 'studio_notes' | 'picture_lock'
  | 'vfx' | 'adr' | 'foley' | 'sound_design' | 'score' | 'music_clearance'
  | 'mix' | 'color' | 'titles' | 'subtitles' | 'localization' | 'qc' | 'mastering' | 'delivery'
  // Animation: the film is built rather than photographed.
  | 'story_reel_lock' | 'layout' | 'animation_final' | 'lighting_render'
  // Documentary: found footage, and lawyers.
  | 'transcription' | 'archive_clearance' | 'legal_review';

/**
 * What a day on the schedule actually is. A cartoon has no shoot days; a
 * documentary has interview days and days in the archive.
 */
export type ShootDayKind =
  | 'photography' | 'voice_session' | 'story_reel' | 'animation_block'
  | 'stop_motion_unit' | 'interview' | 'verite' | 'archive' | 'motion_capture';

export interface PostTask {
  id: Id;
  saveId: Id;
  projectId: Id;
  kind: PostTaskKind;
  name: string;
  /** Must be complete before this can start. Enforced. */
  dependsOn: PostTaskKind[];
  status: 'blocked' | 'ready' | 'in_progress' | 'complete';
  vendorName?: string;
  budgeted: Money;
  spent: Money;
  plannedDays: number;
  elapsedDays: number;
  startedAt?: Instant;
  completedAt?: Instant;
  /** 0-100 contribution to the finished film. */
  quality: number;
  notes: { at: Instant; note: string }[];
  /** The real house doing the work, from content/post-houses, when one was chosen. */
  houseId?: string;
  /**
   * Hours the player spent in the room on this task. A cut is made in
   * sessions; each one moves the task and teaches something.
   */
  sessions?: { at: Instant; hours: number; note: string; gain: number }[];
}

/** One house's answer to a request for a visual effects bid. */
export interface VfxBid {
  houseId: string;
  amount: Money;
  weeks: number;
  /** What SLATE expects the work to read at, 0-100, from the house's tier and load. */
  expectedQuality: number;
  note: string;
  at: Instant;
}

/** The effects on a picture: what the script asks for, who bid, who got it. */
export interface VfxPlan {
  /** Shots, counted from the breakdown and the director's coverage. */
  shots: number;
  mix: { simple: number; medium: number; hero: number };
  bids: VfxBid[];
  awardedHouseId?: string;
  awardedAt?: Instant;
  contractId?: Id;
  brokenDownAt: Instant;
}

/** One piece of music in the picture: a cue the composer writes, or something licensed. */
export interface MusicCue {
  id: Id;
  number: number;
  /** What it is for, in words. SLATE never names a real song. */
  description: string;
  use: 'score' | 'source' | 'needle_drop' | 'title' | 'end_credits';
  minutes: number;
  status: 'spotted' | 'written' | 'recorded' | 'licensed' | 'dropped';
  /** For licensed music: the two licences a recording needs, and their terms. */
  licence?: {
    publisherId: string;
    labelId: string;
    syncFee: Money;
    masterFee: Money;
    /** Most favoured nations: each side is paid what the other is. */
    mfn: boolean;
    term: 'perpetuity' | 'ten_years' | 'festival_only';
    territory: 'worldwide' | 'domestic';
    at: Instant;
    contractId?: Id;
  };
}

/** The music on a picture. */
export interface MusicPlan {
  cues: MusicCue[];
  spottedAt?: Instant;
  composerId?: Id;
  /** Where the score was recorded, from the registry, when it was. */
  scoringStageId?: string;
  recordedAt?: Instant;
}

/** Stage days booked on a lot. */
export interface StageBooking {
  id: Id;
  /** A real lot from content/post-houses, or the id of a property the player owns. */
  lotId: string;
  lotName: string;
  stages: number;
  from: Instant;
  to: Instant;
  days: number;
  cost: Money;
  contractId?: Id;
  bookedAt: Instant;
}

export interface MarketingCampaign {
  id: Id;
  saveId: Id;
  projectId: Id;
  budget: Money;
  spent: Money;
  positioning: string;
  targetAudience: string;
  beats: {
    kind: 'announcement' | 'first_look' | 'teaser' | 'trailer' | 'trailer_2' | 'clip' | 'featurette' | 'poster' | 'press_tour' | 'premiere';
    at: Instant;
    spend: Money;
    executed: boolean;
    /** Reach achieved when executed. */
    reach?: number;
    quality?: number;
  }[];
  /** 0-100 how many people know it exists. */
  awareness: number;
  /** 0-100 how many of those intend to watch. */
  intent: number;
  /** -100..100 how they feel about it. */
  sentiment: number;
  /** Set once the producer has asked the distributor for more prints and advertising. */
  studioPush?: { at: Instant; granted: boolean; amount: Money };
  socialPostIds: Id[];
  startedAt: Instant;
}

export interface Release {
  id: Id;
  saveId: Id;
  projectId: Id;
  strategy: 'wide_theatrical' | 'limited_theatrical' | 'platform' | 'streaming_exclusive' | 'day_and_date' | 'direct_to_video' | 'network' | 'festival_only';
  distributorName: string;
  /** The real service that carries it after cinemas, by its pay-one deal, when one applies. */
  streamingPartnerId?: string;
  streamingPartnerName?: string;
  /** The home market whose weekend chart counts it, as a country id. Absent means the United States. */
  market?: string;
  /** Fraction of gross the distributor keeps. */
  distributorShare: number;
  /** Fraction exhibitors keep of theatrical gross. */
  exhibitorShare: number;
  openingDate: Instant;
  theaterCount: number;
  maxTheaterCount: number;
  territories: string[];
  windows: { kind: string; startsAt: Instant; endsAt?: Instant }[];
  dailyBoxOffice: { date: Instant; domestic: Money; theaters: number; rank: number }[];
  streamingResults?: {
    starts: number;
    hoursViewed: number;
    completionRate: number;
    peakRank: number;
    retentionCurve: number[];
    territoryTop10: string[];
  };
  tvResults?: { episodeRatings: { episode: number; households: number; demo: number }[]; seasonAverage: number };
  totalDomestic: Money;
  totalInternational: Money;
  /** Money that actually reaches the rights holder. */
  netToDistributor: Money;
  netToProducer: Money;
  status: 'planned' | 'in_release' | 'closed';
}

export interface Review {
  id: Id;
  saveId: Id;
  projectId: Id;
  source: 'critic' | 'audience' | 'trade';
  publicationName?: string;
  criticName?: string;
  /** 0-100 on SLATE's scale, whatever the outlet prints. */
  score: number;
  quote: string;
  at: Instant;
  influence: number;
  /** The real outlet, when the review is from one in the registry. */
  outletId?: string;
  /** The score written the way the outlet writes it: stars, a grade, a number. */
  scaleText?: string;
  /** How Rotten Tomatoes counts it. */
  verdict?: 'fresh' | 'rotten';
  topCritic?: boolean;
  /** When it landed: at a festival, when the embargo lifted, on release, or later. */
  wave?: 'festival' | 'embargo' | 'release' | 'late';
}

/**
 * How a film or a season was received, counted the way the aggregators count.
 * Grows in waves as reviews land and audiences arrive; nothing here is set in
 * one go, and a number that has not been counted yet is absent.
 */
export interface Reception {
  /** When reviews may run. Set by the distributor, or by the player when they control the release. */
  embargoAt?: Instant;
  embargoSetBy?: 'distributor' | 'player';
  /** Rotten Tomatoes. */
  tomatometer?: number;
  reviewCount: number;
  freshCount: number;
  topCriticsScore?: number;
  topCriticCount: number;
  topCriticFresh: number;
  certifiedFresh: boolean;
  /** Metacritic. */
  metascore?: number;
  metacriticCount: number;
  /** The weights behind the Metascore, so later reviews can join the average. */
  metacriticWeight: number;
  mustSee: boolean;
  /** Audience score, the share of positive audience ratings. */
  audienceScore?: number;
  audienceCount: number;
  /** IMDb, out of 10, and how many votes stand behind it. */
  imdbRating?: number;
  imdbVotes: number;
  /** CinemaScore, opening night, wide releases only. */
  cinemaScore?: string;
  /** The waves that have run. */
  waves: string[];
  updatedAt: Instant;
}

export interface AwardBody {
  id: string;
  name: string;
  shortName: string;
  prestige: number;
  kind: 'film' | 'television' | 'both' | 'guild' | 'critics';
  categories: string[];
  /** Month of the ceremony, 1-12. */
  ceremonyMonth: number;
  ceremonyDay: number;
  /** Eligibility window is the prior calendar year unless stated. */
  eligibilityRule: string;
}

export interface AwardEdition {
  id: Id;
  saveId: Id;
  bodyId: string;
  /** Which staging: the 3rd, the 97th. */
  editionNumber: number;
  /** Calendar year of the ceremony. */
  year: number;
  ceremonyAt: Instant;
  nominationsAnnouncedAt: Instant;
  eligibilityStart: Instant;
  eligibilityEnd: Instant;
  status: 'upcoming' | 'nominations_open' | 'nominated' | 'voting' | 'complete';
  /** Once complete this never changes. */
  finalised: boolean;
  scheduledItemId?: Id;
  /**
   * Set on editions that were already over when the save began. They exist so
   * the award bodies have a plausible run of editions behind them, but nothing
   * about who won was simulated, and the game must never claim otherwise.
   */
  predatesSave?: boolean;
}

export interface AwardNomination {
  id: Id;
  saveId: Id;
  editionId: Id;
  bodyId: string;
  category: string;
  /** What the category judges, as SLATE classified it when the nomination was made. */
  kind?: string;
  projectId?: Id;
  personId?: Id;
  /** Filled at the ceremony. */
  won?: boolean;
  announcedAt: Instant;
  decidedAt?: Instant;
  /** Campaign spend behind this nomination, if any. */
  campaignSpend: Money;
}

export interface Festival {
  id: string;
  name: string;
  locationId: string;
  month: number;
  day: number;
  prestige: number;
  /** Requires the film to be a world or regional premiere. */
  premiereRequirement: 'world' | 'international' | 'regional' | 'none';
  categories: string[];
  submissionFee: number;
  marketAttached: boolean;
}

export interface FestivalSubmission {
  id: Id;
  saveId: Id;
  festivalId: string;
  /** Which year's edition. */
  year: number;
  projectId: Id;
  submittedAt: Instant;
  fee: Money;
  status: 'submitted' | 'under_review' | 'selected' | 'rejected' | 'withdrawn' | 'screened';
  decisionAt?: Instant;
  section?: string;
  screeningAt?: Instant;
  awardsWon: string[];
  acquisitionOffers: { buyerName: string; studioId?: string; amount: Money; territories: string[]; at: Instant; accepted: boolean }[];
}

export interface Franchise {
  id: Id;
  saveId: Id;
  name: string;
  ownerCompanyId?: Id;
  projectIds: Id[];
  /** 0-100 audience appetite for more. */
  strength: number;
  /** 0-100; high fatigue depresses performance of new entries. */
  fatigue: number;
  totalRevenue: Money;
  merchandiseRevenue: Money;
  startedAt: Instant;
  /** Set when the franchise is real IP licensed from the studio that owns it. */
  studioId?: string;
  catalogueQid?: string;
  catalogueName?: string;
  licence?: { kind: 'sequel' | 'remake' | 'spin_off' | 'series'; rightsId: Id; fee: Money };
}

// ---------------------------------------------------------------------------
// The studios and networks as they live inside a save
// ---------------------------------------------------------------------------

export type IndustryNewsKind = 'release' | 'weekend' | 'greenlight' | 'deal' | 'leadership' | 'corporate' | 'standing' | 'slate' | 'year';

export interface IndustryNewsItem {
  at: Instant;
  kind: IndustryNewsKind;
  title: string;
  detail: string;
  projectId?: Id;
}

/** A seat at a studio or network as it stands in this save, once anything about it has changed. */
export interface LiveLeader {
  name: string;
  title: string;
  /** When they took the seat in this save; absent for a seat held since before the save began. */
  since?: Instant;
  /** True when SLATE generated the person to fill a seat that emptied. Never a real person. */
  generated?: boolean;
}

export type StudioStrategy = 'steady' | 'franchise_first' | 'prestige' | 'volume' | 'cost_cutting' | 'expansion';

/** What a real studio has done, and how it regards the player, since the save began. Everything here is simulation. */
export interface StudioState {
  id: string;
  saveId: Id;
  /** 0-100 how the studio regards the player: who returns calls, who gets terms. */
  standing: number;
  standingLog: { at: Instant; delta: number; note: string }[];
  /** 0-100 corporate mood, from results. Drives strategy, slate size and appetite for risk. */
  confidence: number;
  strategy: StudioStrategy;
  /** Multiplier on how many projects the studio puts through in a year. */
  slateMultiplier: number;
  /** Drift on the studio's calibrated risk appetite and prestige bias, from results and new leadership. */
  riskDrift: number;
  prestigeDrift: number;
  /** Domestic gross of its releases by calendar year in the save, in cents. */
  yearGross: Record<string, Money>;
  yearResults: Record<string, { releases: number; hits: number; flops: number }>;
  /** The roster as it stands now, once a seat has changed hands in the save. */
  leadership?: LiveLeader[];
  leadershipChanges: { at: Instant; left: string; title: string; successor: string; generated: boolean; reason: string }[];
  parentOverride?: string;
  ownershipOverride?: string;
  statusOverride?: string;
  /** True once the studio has stopped taking on new work in this save. */
  closing?: boolean;
  corporate: { eventId: string; outcomeId: string; at: Instant; note: string }[];
  news: IndustryNewsItem[];
}

export interface NetworkState {
  id: string;
  saveId: Id;
  standing: number;
  standingLog: { at: Instant; delta: number; note: string }[];
  confidence: number;
  /** The week as it is scheduled now. Linear networks only. */
  schedule?: NetworkSchedule;
  /** How the season has gone: averages and what it cost. */
  seasons?: Record<string, { averageViewers: number; averageDemo: number; renewed: number; cancelled: number; ordered: number }>;
  leadership?: LiveLeader[];
  leadershipChanges: { at: Instant; left: string; title: string; successor: string; generated: boolean; reason: string }[];
  parentOverride?: string;
  statusOverride?: string;
  closing?: boolean;
  corporate: { eventId: string; outcomeId: string; at: Instant; note: string }[];
  news: IndustryNewsItem[];
}

/** A first-look or overall deal between the player (or their company) and a real studio or network. */
export interface TalentDeal {
  id: Id;
  saveId: Id;
  kind: 'first_look' | 'overall';
  counterpartyKind: 'studio' | 'network';
  counterpartyId: string;
  counterpartyName: string;
  holderId: Id;
  holderKind: 'person' | 'company';
  /** Overhead paid to the holder each year of the term, in cents. */
  annualFee: Money;
  /** Days the counterparty has to answer before anyone else may see a project. */
  exclusiveDays: number;
  startsAt: Instant;
  endsAt: Instant;
  status: 'active' | 'ended' | 'expired';
  endedReason?: string;
  projectsShown: number;
  paidTotal: Money;
}

export interface BoxOfficeEntry {
  projectId: Id;
  /** The market the gross belongs to, as a country id. Every market has its own chart. */
  market: string;
  title: string;
  studioId?: string;
  distributorName: string;
  /** Friday to Sunday domestic, in cents. */
  weekend: Money;
  /** Running domestic total, in cents. */
  total: Money;
  theaters: number;
  /** Weekend of release: 1 is opening. */
  week: number;
  /** True when the title is a real one from the record, released by the world on its day. */
  onRecord: boolean;
  /** True when it is the player's own picture. */
  yours: boolean;
}

export interface BoxOfficeWeekend {
  /** The Friday, as a date key. */
  key: string;
  fridayAt: Instant;
  entries: BoxOfficeEntry[];
}

/** One programme in one slot of a network's week. */
export interface ScheduleSlot {
  /** 0 Sunday to 6 Saturday. */
  day: number;
  /** Minutes from midnight: 1200 is eight o'clock. */
  start: number;
  minutes: number;
  title: string;
  kind: 'series' | 'movie' | 'news' | 'sport' | 'unscripted' | 'reruns';
  projectId?: Id;
  /** Set when the programme is a real one from the record. */
  catalogueQid?: string;
  genres: string[];
  /** True when it is the player's. */
  yours?: boolean;
  /** Which season of itself it is in. */
  season?: number;
  episodesAired?: number;
  /** The most recent airing: total viewers in thousands, the 18-49 rating, and the share. */
  viewers?: number;
  demo?: number;
  share?: number;
  /** Averages across the season so far. */
  seasonViewers?: number;
  seasonDemo?: number;
  standing?: 'new' | 'safe' | 'bubble' | 'cancelled' | 'ended';
}

export interface NetworkSchedule {
  /** The television season, as the business writes it: '2026-27'. */
  season: string;
  announcedAt: Instant;
  slots: ScheduleSlot[];
  renewed: string[];
  cancelled: string[];
  ordered: string[];
}

/** A night's viewing figure worth keeping. */
export interface Airing {
  at: Instant;
  networkId: string;
  title: string;
  projectId?: Id;
  episode?: number;
  /** Total viewers, in thousands. */
  viewers: number;
  /** The 18-49 rating. */
  demo: number;
  share: number;
  yours: boolean;
}

export interface StreamingChartEntry {
  title: string;
  projectId?: Id;
  catalogueQid?: string;
  /** Hours viewed in the week, in thousands. */
  hours: number;
  /** Weeks on the chart, this one included. */
  weeks: number;
  yours: boolean;
  onRecord: boolean;
}

export interface StreamingChart {
  /** The Monday the week began, as a date key. */
  key: string;
  at: Instant;
  serviceId: string;
  entries: StreamingChartEntry[];
}

export type RecordCategory =
  | 'opening_weekend' | 'domestic' | 'worldwide' | 'per_theatre'
  | 'viewers' | 'demo' | 'streaming_week' | 'streaming_total'
  | 'tomatometer' | 'imdb' | 'budget' | 'profit'
  | 'award_sweep' | 'award_career' | 'award_night';

/** A record set inside this save. Simulation, never the real record. */
export interface SaveRecord {
  category: RecordCategory;
  title: string;
  projectId?: Id;
  studioId?: string;
  networkId?: string;
  value: number;
  at: Instant;
  yours: boolean;
  note: string;
}

/** A named movement running in one market: a genre the money has moved to. */
export interface Wave {
  id: string;
  countryId: string;
  genreId: string;
  name: string;
  startedAt: Instant;
  endedAt?: Instant;
  /** The highest heat it reached. */
  peak: number;
  /** Titles commissioned under it. */
  titles: number;
}

/** What one national industry is making, and how warm each genre is there. */
export interface MarketMood {
  countryId: string;
  /** Genre heat, 0-100. Rises with hits, falls with saturation, settles toward the country's own nature. */
  heat: Record<string, number>;
  /** The genre combinations most recently commissioned here, newest last. */
  recent: string[];
  /** Individual genres most recently commissioned here, newest last. */
  recentGenres: string[];
  /** Titles commissioned here since the save began. */
  commissioned: number;
  waves: Wave[];
}

export interface Zeitgeist {
  markets: Record<string, MarketMood>;
  lastTick: Instant;
  /** Every wave that has run, finished or not. */
  history: Wave[];
}

export interface TradeItem {
  id: Id;
  at: Instant;
  kind: IndustryNewsKind;
  headline: string;
  detail: string;
  studioId?: string;
  networkId?: string;
  projectId?: Id;
}

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
  strategy: string;
  divisionIds: Id[];
  employeeIds: Id[];
  cashAccountId: Id;
  creditAccountId?: Id;
  projectIds: Id[];
  rightsIds: Id[];
  equipmentIds: Id[];
  /** 0-100 how the industry regards the company. */
  reputation: number;
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

export interface SandboxState {
  enabled: boolean;
  maxAttributesApplied: boolean;
  allTraitsGranted: boolean;
  unlimitedFunds: boolean;
  ignoreAuthority: boolean;
  /**
   * God mode. Nothing the player asks for is refused: every audition books,
   * every agency signs, every offer, greenlight and purchase goes through.
   *
   * It is a declared cheat, not a hidden one — every override it causes is
   * written into the log below and marked on whatever it touched, so a save
   * played this way can never be mistaken for a career that was earned.
   */
  godMode: boolean;
  /** Every profession opened without the experience being spent. */
  allProfessionsUnlocked: boolean;
  /** Every sandbox action is logged so history stays honest. */
  log: { at: Instant; action: string }[];
}

// ---------------------------------------------------------------------------
// The universe
// ---------------------------------------------------------------------------

export const SAVE_SCHEMA_VERSION = 25;

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

  projects: Record<Id, Project>;
  rights: Record<Id, Rights>;
  scriptDrafts: Record<Id, ScriptDraft>;
  roles: Record<Id, Role>;
  auditions: Record<Id, Audition>;
  contracts: Record<Id, Contract>;
  shootDays: Record<Id, ShootDay>;
  postTasks: Record<Id, PostTask>;
  marketingCampaigns: Record<Id, MarketingCampaign>;
  releases: Record<Id, Release>;
  reviews: Record<Id, Review>;
  awardEditions: Record<Id, AwardEdition>;
  awardNominations: Record<Id, AwardNomination>;
  festivalSubmissions: Record<Id, FestivalSubmission>;
  franchises: Record<Id, Franchise>;

  /**
   * Where the player stands with each casting office, keyed by the real
   * casting director's registry id. Built up one room at a time.
   */
  castingOffices?: Record<string, CastingOfficeStanding>;

  /** The real studios and networks as they live in this save, keyed by registry id. */
  studios: Record<string, StudioState>;
  networks: Record<string, NetworkState>;
  /** Ratings worth keeping, newest last. Capped. */
  airings: Airing[];
  /** The weekly streaming charts, newest last. Capped. */
  streamingCharts: StreamingChart[];
  /** The best of everything that has happened in this save, by category. */
  saveRecords: Partial<Record<RecordCategory, SaveRecord[]>>;
  /** What each national industry is in the mood for, and what it has just made. */
  zeitgeist: Zeitgeist;
  talentDeals: Record<Id, TalentDeal>;
  boxOffice: {
    weekends: BoxOfficeWeekend[];
    /** Gross by calendar year, market (country id) and studio id ('other' for the rest), in cents. Never trimmed. */
    yearToDate: Record<string, Record<string, Record<string, Money>>>;
    /** Weekend lumps waiting to be counted, from the world's own lump-sum releases. */
    pending: { key: string; entry: BoxOfficeEntry }[];
  };
  trade: TradeItem[];
  /** Everything the press has published in this save, newest last. */
  press: PressItem[];

  companies: Record<Id, Company>;
  divisions: Record<Id, Division>;
  employees: Record<Id, Employee>;
  equipment: Record<Id, Equipment>;
  merchandise: Record<Id, MerchandiseLine>;

  scheduled: ScheduledItem[];
  audits: AuditRecord[];
  history: HistoryRecord[];
  decisions: Record<Id, DecisionItem>;
  notifications: Notification[];

  tutorial: TutorialProgress;
  preferences: Preferences;
  sandbox: SandboxState;

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
