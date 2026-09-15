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
import type { AttributeSheet } from './attributes';
import type { SkillSheet } from './skills';

export type Id = string;

// The business. Declared next door, in `domain/company.ts`, because seven
// linked types about one subject are a file rather than a section.
import type {
  Company, Holding, Policy, Post, Project, Registration, Signature,
} from './company';

export type {
  Company, CompanyForm, GuildId, Holding, Hold, Jurisdiction, Ownership, Policy,
  PolicyKind, Post, Project, Provenance, Registration, RegistryId, RoleId,
  Signature, Stage,
} from './company';

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
   * Actor, or actress. The subject of the whole game, so it is stored rather
   * than worked out wherever it is needed. Set once, from what the player
   * stated; where they stated nothing, their pronouns decided it and the
   * premise records which of the two happened.
   *
   * It is a word, not a stat. Nothing about how well somebody acts, what they
   * are worth or what they are offered branches on it.
   */
  performerTitle: PerformerTitle;
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

  /** Reference city id where they currently are. */
  currentLocationId: string;

  /** Property id of their home, when they have one. */
  residenceId?: Id;
  householdId?: Id;

  personality: Personality;
  interests: string[];
  /**
   * Genres they love. On the character sheet because a person has them;
   * nothing in the simulation reads one to decide anything.
   */
  genres?: string[];
  goals: string[];
  lifestyle: 'frugal' | 'modest' | 'comfortable' | 'lavish';
  background: string;

  attributes: AttributeSheet;
  traits: string[];
  /**
   * Who they are, as against what they are good at.
   *
   * The craft sheet above is automatic — the best living actor or actress
   * holds every acting trait there is. None of that says whether they sleep,
   * hold a grudge or can be alone in a house. These are chosen, there are
   * four of them, and unlike the craft traits they cost what they cost.
   */
  personalityTraits?: string[];
  skills: SkillSheet;

  /**
   * The three that say what kind of actor or actress this is.
   *
   * They are not a second sheet. The eighty-eight attributes are the
   * instrument; these sit on top of it and are the once-in-a-lifetime part.
   * Unlike an ordinary trait, a G.O.A.T. trait is never paid for with a
   * weakness somewhere else.
   */
  goatTraits?: string[];

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

  creditScore: number;
  /** Primary spending account. */
  primaryAccountId?: Id;

  /** When they last deliberately slept, so the world knows to fill the gap. */
  lastSleptAt?: Instant;

  /**
   * Whether this person is somebody's mother or somebody's father.
   *
   * Carried so a family reads as a family — a mother, a father, a brother, a
   * sister — rather than as a list of people with a relationship type, and
   * read off the public records SLATE imports to tell an actor from an
   * actress where the record states it.
   */
  gender?: 'female' | 'male' | 'nonbinary';

  /**
   * Who this person is, in their own terms. Set at creation and only for the
   * player: SLATE never asks it of anybody else and never guesses it from a
   * name, a country or a city.
   *
   * It carries no attribute, no skill, no advantage and no penalty. Nothing in
   * the simulation reads it, and nothing should: it is on the character sheet
   * because a person has one, not because the game does anything with it.
   */
  raceEthnicity?: readonly string[];
  /** Said in their own words, where the list did not have it. */
  raceEthnicityOwn?: string;

  /**
   * Who they are to the people around them.
   *
   * Stored on the person rather than in a table of pairs, because being
   * somebody's mother is a fact about her and not a fact about the two of
   * them. How they are getting on is the other thing, and that is a `Bond`.
   */
  relations?: Relation[];

  /**
   * What they do on the family land, where they do anything.
   *
   * Not a job in a labor market — there is no labor market. It is the thing
   * this person is the one who does: keeps the house, runs the lot, runs the
   * company.
   */
  estateRole?: EstateRole;

  /**
   * What they have been paid to act, and on what.
   *
   * A quote is a ratchet with memory, and the memory is the whole of why it
   * matters. Business affairs pulls what somebody was last paid, in what size
   * of part, and argues from there — so working for a favor is not a free
   * favor, it is a number the next three producers get to read. Absent for
   * everybody who has never been cast, which is almost everybody.
   */
  quotes?: Quote[];

  createdAt: Instant;
}

/**
 * One fee, on one title, at one size.
 *
 * Kept as a list rather than a single highest number, because the thing a
 * quote decays against is its date and the thing it is argued against is the
 * size it was paid for. A lead fee does not set a day player's price and a
 * day player's does not cap a lead's.
 */
export interface Quote {
  projectId: Id;
  /** Which size of part it was paid for, by `content/casting.ts` id. */
  size: string;
  cents: number;
  at: Instant;
}

/** What somebody on the land is the one who does. */
export type EstateRole = 'the house' | 'the lot' | 'the company' | 'nothing in particular';

/**
 * How one person is related to another.
 *
 * Written from the subject's side: a person carrying `{ kind: 'mother', toId }`
 * means that person's mother is the one named. A twin is not a sibling with a
 * coincidence — the world says "your twin", never "your sibling who happens to
 * share a birthday" — so it is its own word.
 */
export type RelationKind = 'mother' | 'father' | 'child' | 'twin';

export interface Relation {
  kind: RelationKind;
  toId: Id;
}

/**
 * How two people are getting on.
 *
 * One record for a pair rather than one each: the game has no interest in a
 * mother who feels close to a son who does not feel close back, and modeling
 * both sides would double the bookkeeping to say the same thing twice.
 *
 * `closeness` is nought to a hundred and moves with what actually happens —
 * time spent together warms it, time apart cools it slowly. It is not
 * affection and it is not a score of the relationship; it is how much of each
 * other they have had lately.
 */
export interface Bond {
  id: Id;
  saveId: Id;
  /** The two people, sorted, so a pair has exactly one bond. */
  betweenIds: [Id, Id];
  closeness: number;
  /** The last time the two of them were actually in the same room on purpose. */
  lastTogetherAt?: Instant;
  /**
   * The last day drift was charged for.
   *
   * Anchored rather than assumed, so a bond drifts by the days that passed
   * and not by the number of times something happened to look at it. Skipping
   * a month forward in one jump has to cost the same as living it.
   */
  lastDriftedAt?: Instant;
  formedAt: Instant;
}

/** The one key a pair of people has, whichever order they are named in. */
export function bondKey(a: Id, b: Id): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
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
  listedForSale?: { price: Money; since: Instant; agentId?: Id };
  soldAt?: Instant;
  createdAt: Instant;
}

/**
 * One stage on a lot.
 *
 * This replaced a `StudioPlant` record that carried twelve fields and was
 * instantiated nowhere — among them `occupancy`, `lifetimeIncome` and
 * `lifetimeOverhead`, all three of them facts about the world stored as
 * numbers somebody would have to remember to update. They are worked out from
 * the bookings and from the ledger now, so they cannot drift from the thing
 * they describe.
 *
 * What is stored here is only what is physically true: how big the room is,
 * how much air is above it, what it charges and what is in it.
 */
export interface SoundStage {
  id: Id;
  saveId: Id;
  /** The lot it stands on. */
  propertyId: Id;
  name: string;
  /** Clear floor inside the acoustic liner, square meters. */
  floorSqm: number;
  /** Clear height to the underside of the perms, meters. */
  clearHeightM: number;
  /** What a shooting week costs here, in cents. */
  weekRateCents: Money;
  /** Tank floor area in square meters, where there is one. */
  tankSqm?: number;
  /**
   * What the room is fitted with, by id rather than by label.
   *
   * Not called `features`, because that name is reserved across the save for
   * lists of Title Case words a person reads, and `tools/label-sweep.mjs`
   * holds it to that. These are identifiers; `FITTING_LABEL` turns them into
   * something to print.
   */
  fitted: string[];
  builtAt: Instant;
}

/** One year's answer on how much sugar America will let in at the low duty. */
export interface QuotaYear {
  /** The American fiscal year it governs. */
  fiscalYear: number;
  /** Tonnes of additional specialty quota. Zero is a real answer. */
  tonnes: number;
  decidedAt: Instant;
  /** Why it came out that way, in the world's words. */
  because: string;
}

/** Whether a production is shooting on a stage, getting ready, or holding it. */
export type BookingKind = 'shooting' | 'prep' | 'hold';

/**
 * A production holding a stage for a run of dates.
 *
 * The unit is the week, because that is how stages are actually let, and the
 * rate depends on what the production is doing in there. Pre-lighting and
 * striking cost less than shooting; holding a standing set on a dark day costs
 * less again. A lot that charged one flat rate would be a lot nobody had ever
 * booked.
 */
export interface Booking {
  id: Id;
  saveId: Id;
  stageId: Id;
  /** Who is on it, in the world's words. */
  holder: string;
  /** Set when it is the family's own company on its own stage. */
  companyId?: Id;
  kind: BookingKind;
  from: Instant;
  to: Instant;
  /** What this booking is paying per week, in cents, after the rate share. */
  weekRateCents: Money;
  /** Set once the money for it has been posted. */
  invoicedAt?: Instant;
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

/** Somebody's place in the education system where they live. */
/** The state of somebody's teeth, and what has been done to them. */
export interface Teeth {
  personId: Id;
  /** Out of a hundred, as it stood when anybody last looked. */
  condition: number;
  /** When that was. Everything decays from here rather than ticking. */
  checkedAt: Instant;
  /** How many months the practice asked to wait before the next look. */
  recallMonths: number;
  treatments: { id: string; at: Instant; paid: Money }[];
}

/** Training in a real art, with a real grading ladder behind it. */
export interface Training {
  id: Id;
  saveId: Id;
  personId: Id;
  /** Which art, by its id in the week content. */
  artId: string;
  /** The gym, which is SLATE's own invention. */
  gymName: string;
  /** The grade held now. Empty for an art that grades nobody. */
  gradeId: string;
  /** When that grade was awarded, for the federations that publish a minimum time. */
  gradedAt: Instant;
  sessions: number;
  /** Hours on the mat, which is what a grading panel is really weighing. */
  hours: number;
  /** Every grading sat, passed or not. */
  gradings: { gradeId: string; at: Instant; passed: boolean }[];
  /** Which week the session counter belongs to, so a week's limit is a week's. */
  weekOf?: number;
  thisWeek?: number;
  startedAt: Instant;
  endedAt?: Instant;
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

/**
 * 76 added the family: relations on a person, and bonds between two of them.
 * 77 added the business — seven tables for the company, and the removal of the
 * `Company`, `Division` and `Employee` types that had been declared for a
 * build that was cut and never stored a single record.
 *
 * A save from 76 or earlier has no company at all, which reads correctly as a
 * family that never formed one rather than as a broken save.
 */
export const SAVE_SCHEMA_VERSION = 78;

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
  /**
   * Actor, or actress. The player's own word, mirrored here beside their name
   * so that a slot card, the server, or anything else reading a save can have
   * it without deserialising the person behind it. This is the game's subject,
   * so it is not derived at the point of use: it is stored.
   */
  performerTitle: PerformerTitle;
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
 * What SLATE is, written into every universe it makes.
 *
 * SLATE is an actor and actress life simulator. That is the premise, and it is
 * most important fact about the game, so it is not left to a heading on a
 * screen somebody might later rewrite: every save states it, carries the two
 * titles it is about, and records that they stand equal. A save that does not
 * say this is not a SLATE save, and validation says so.
 *
 * The two words are one craft under two names. The business has always kept
 * them apart — separate awards, separate categories, separate columns in a
 * trade paper — and SLATE keeps them apart for the same reason, without ever
 * making one of them the default and the other the exception.
 */
export interface Premise {
  /** What this game is. One value, and it does not vary by save. */
  kind: 'actor-actress-life-simulator';
  /** Said in full, so a reader of the raw save needs nothing else. */
  statement: string;
  /** The two titles the game is about, in no order of precedence. */
  titles: readonly PerformerTitle[];
  /** Neither title outranks, precedes or defaults over the other. */
  equalStanding: true;
  /** The title this save's player carries. */
  playerTitle: PerformerTitle;
  /** Whether the player stated it themselves, or their pronouns implied it. */
  playerTitleSource: 'stated' | 'implied';
  /** When the premise was written into this save. */
  recordedAt: Instant;
}

/** The premise, in the words every save carries. */
export const PREMISE_STATEMENT =
  'SLATE is an actor and actress life simulator. Actor and Actress are two names for '
  + 'one craft, and this game treats them as equals: neither is the default, and '
  + 'every label about a person uses their own word.';

/**
 * One save is one universe. Every collection here is scoped to this save and
 * to nothing else. There is no shared mutable state between saves anywhere in
 * SLATE; the only thing saves have in common is immutable reference data.
 */
/**
 * One part somebody outside the family has asked the player about.
 *
 * It exists because a production booked a stage on the lot and then needed
 * people, which is the only way anybody in this world hears about work that is
 * not their own family's. That makes the lot's business and the player's career
 * one system rather than two, and it is why money spent telling people the
 * stages are there eventually shows up as a part.
 */
export interface Audition {
  id: Id;
  saveId: Id;
  /**
   * The stage booking this production is, by the shooting row.
   *
   * A booking is written as three rows — build, shoot, strike — and the
   * shooting one is the production. Held so the dates and the money can be read
   * back off the thing that actually generated them rather than copied.
   */
  bookingId: Id;
  /** Who is casting, in the world's words. Read off the booking's holder. */
  holder: string;
  /** How big the part is, by `content/casting.ts` size id. */
  size: string;
  /** What it pays, all in. */
  feeCents: Money;
  /** The dates it would hold the player. */
  from: Instant;
  to: Instant;
  /** After this nobody is being seen. */
  closesAt: Instant;
  /**
   * What the room wants, by shade id.
   *
   * Never shown and never derivable. The one note a room gives leaks one shade
   * of it, once, which is the whole of what anybody is ever told. A want the
   * player could read off a screen would make the reading a lookup.
   */
  wants: Record<string, number>;
  /** What the player played, once they have played anything. */
  played?: Record<string, number>;
  /** Which way they went up for it, by `content/audition.ts` way id. */
  way?: string;
  /**
   * The note, where a room gave one.
   *
   * Given on the shade the reading was closest on, because a room tells you
   * about the part that nearly worked. `toward` is the direction, and how far
   * is never said.
   */
  note?: { shade: string; toward: number };
  /** How far the player took it, by `content/audition.ts` id. */
  took?: string;
  state: 'open' | 'waiting' | 'noted' | 'over';
  /** Why it ended, by `content/audition.ts` id. */
  why?: string;
  decidedAt?: Instant;
}

export interface SaveUniverse {
  meta: SaveMeta;
  /** What this game is, stated in the save itself. See `Premise`. */
  premise: Premise;
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
  households: Record<Id, Household>;
  /** How the people in it are getting on, keyed by `bondKey`. */
  bonds: Record<string, Bond>;

  /**
   * The family business.
   *
   * The parent is Icelandic and any arm of it is not, which is the one fact
   * the whole of `world/company.ts` is built on. Seven tables rather than one
   * because a company is not a record — it is a record and everything it
   * stands in relation to: the registers it is on, the guilds it has signed
   * with, the cover it carries, the material it holds, the posts it keeps and
   * the slate it is developing.
   */
  companies: Record<Id, Company>;
  registrations: Record<Id, Registration>;
  signatures: Record<Id, Signature>;
  policies: Record<Id, Policy>;
  holdings: Record<Id, Holding>;
  posts: Record<Id, Post>;
  projects: Record<Id, Project>;

  /**
   * Parts the player has been asked about, and what came of them.
   *
   * The other half of the slate, and it belongs to the person rather than to
   * the company: these are not the family's pictures, they are whatever is
   * shooting on the lot that needs somebody. Kept as a table rather than worked
   * out from the bookings because a reading is a thing that happened — what was
   * played, what note came back, what was said — and none of that is derivable
   * from a stage being let to a broadcaster.
   */
  auditions: Record<Id, Audition>;

  accounts: Record<Id, Account>;
  transactions: LedgerTransaction[];

  properties: Record<Id, Property>;

  /**
   * The lot, as a working plant. Stages are what stands on it; bookings are
   * who is on them and for how long. Occupancy and what the lot has earned are
   * worked out from these two and from the ledger, never stored, so they
   * cannot say one thing while the bookings say another.
   */
  stages: Record<Id, SoundStage>;
  bookings: Record<Id, Booking>;

  /**
   * What America let in, year by year.
   *
   * The sugar the family sells there arrives through a quota that is set fresh
   * every July, and the year it was set to nothing is real and dated. Kept as
   * a list rather than as a current figure because the interesting thing about
   * it is the run: two shut years in a row is a different world from one.
   */
  quotaYears: QuotaYear[];

  scheduled: ScheduledItem[];
  audits: AuditRecord[];
  history: HistoryRecord[];
  decisions: Record<Id, DecisionItem>;
  notifications: Notification[];

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
