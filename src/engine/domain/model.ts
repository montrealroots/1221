/**
 * SLATE — The domain model.
 *
 * Every stateful thing in the universe. Rule: each record carries `saveId`, and
 * the store refuses to hand back a record whose saveId does not match the
 * universe you asked from. One save is one world; three saves are three worlds
 * that can never see each other.
 *
 * ## Every shape here is a table somebody fills
 *
 * That reads as a truism and it was not true. A hundred and ninety-nine lines
 * of this file described eight records that had no table on `SaveUniverse`, no
 * importer in `migrate`, and nothing anywhere that ever constructed one:
 * `Structure`, `Room` and `Zone` (a house broken into rooms with furnishings in
 * them), `Costume`, `Order` (a shop with a cart, a delivery window and a refund
 * window), `Training` (gyms, mat hours and grading panels), and `Running` with
 * its `Mark` (track times, wind readings, shoe contracts and medal bonuses).
 *
 * They are the same game `core/ids.ts` describes losing a hundred and five id
 * namespaces to — vehicles and their servicing, a track season, a school and a
 * degree. The namespaces went in that cull and the record shapes stayed, which
 * left the file reading as a plan for a life simulator rather than as a fact
 * about this one.
 *
 * They were cut by transitive closure and not by line region, which matters
 * here: `Mark` has two readers and both of them are fields on `Running`, so it
 * is only dead once `Running` is, and `Booking` sits directly above the region
 * and is live. The compiler is the proof — the cut typechecks, and a region
 * taken by eye would have taken `Booking` with it.
 */

import type { Instant, TimeZone } from '../core/time';
import type { Money } from '../core/money';
import type { Account, LedgerTransaction } from '../core/ledger';
import type { ScheduledItem } from '../core/scheduler';
import type { PerformerTitle } from '../core/performer';
import type { IdNamespace } from '../core/ids';
import type { AttributeSheet } from './attributes';

export type Id = string;

// The business. Declared next door, in `domain/company.ts`, because seven
// linked types about one subject are a file rather than a section.
import type {
  Company, Holding, Policy, Post, Project, Registration, Signature,
} from './company';

export type {
  Company, CompanyForm, Concept, GuildId, Holding, Hold, Jurisdiction, Ownership, Policy,
  PolicyKind, Post, Project, Provenance, Registration, RegistryId, RoleId,
  Signature, Stage,
} from './company';

export interface Personality {
  /**
   * The three dispositions that decide something, all 0-100.
   *
   * There were seven, and four of them — openness, extraversion, agreeableness
   * and risk tolerance — were written into every save and read by nothing. The
   * creation screen was honest about it and said so in as many words, which
   * made them honest dead words rather than dishonest ones, and dead either
   * way: they appeared on that screen and on no other, so nothing ever showed
   * them back. `background` survives the same test by being printed under a
   * person's name; these had no such reader anywhere.
   *
   * The three left are the three `core/taste.ts` actually asks for.
   */
  conscientiousness: number;
  emotionalStability: number;
  ambition: number;
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
  /** 0-100 fitness, moved by what a body is asked to do and how it is kept. */
  fitness: number;
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
  /**
   * What the industry's own judgement of the work has come to, 0-100.
   *
   * This was here, was deleted, and is back — and the round trip is the whole
   * reason the field is worth trusting now. It was written for 87 of the 146
   * people in a played save and read by no system, no screen decision and no
   * rule: writers and no readers, which is the one shape The One Rule has no
   * name for. The player's own held nought for twenty-five years.
   *
   * It came out rather than getting a reader, on the precedent of the audit
   * trail, and the design went to `docs/AWARDS.md` with what it would cost and
   * what it would be worth. That document's own instruction was that piece three
   * — giving prestige a reader — must not be skipped, "because piece two on its
   * own produces exactly the defect this document opens by describing".
   *
   * So it comes back with two readers written in the same commit. `remembersYou`
   * takes it as a fourth term beside fame, rooms read and reliability, so an
   * office that has never met you has heard of the work. And the sale prices it,
   * because a picture people are going to talk about is worth more to a buyer
   * than one they are not.
   *
   * It decays, for the same reason `controversy` below had to: a career is a
   * thing you keep having, and a number that only ever rises is the ratchet this
   * project has now found five times.
   */
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
   * Genres they love. On the character sheet because a person has them.
   *
   * Two places in the engine touch the list and neither decides anything with
   * it: `bootstrap` copies the player's answer onto the person at creation, and
   * `core/taste.ts` is the door every system would go through to read it. Nothing
   * goes through that door yet — `affinity` is written and tested and has no
   * caller, because the questions it answers need somebody else to ask about.
   */
  genres?: string[];
  /**
   * The life before this one, in the player's own words.
   *
   * Flavor, and deliberately kept as flavor: no attribute, no modifier and
   * no advantage hangs off it. What stops it being a dead word is that the
   * game says it back — the person look prints it under their name, for the
   * player and for every relative the family generator writes one for. A
   * sentence somebody authored about their own character and never saw again
   * would be worse than not asking.
   */
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

  /**
   * The once-in-a-lifetime one, and there is exactly one of them in a save.
   *
   * They hold every attribute and every trait in the game at the top of its
   * scale at the same time. For anybody else that combination is incoherent —
   * most traits are alternatives to each other and all of them are paid for
   * with a weakness somewhere. The flag says the payment does not apply here:
   * it never adds anything, it only refuses to subtract.
   */
  prodigy?: boolean;

  wellbeing: Wellbeing;
  reputation: Reputation;

  careerTrack: CareerTrack;

  /** Primary spending account. */
  primaryAccountId?: Id;

  /** When they last deliberately slept, so the world knows to fill the gap. */
  lastSleptAt?: Instant;
  /**
   * The last day reputation was charged for not being in anything.
   *
   * Anchored and caught up in whole days, for the reason `Bond.lastDriftedAt` is:
   * a career must not fade differently because the player skipped forward in one
   * jump rather than two. Only the player carries it — everybody else's reputation
   * is a standing the casting office reads once, not a career being lived.
   */
  reputationDriftedAt?: Instant;

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
   * It carries no attribute, no skill, no advantage and no penalty. `bootstrap`
   * copies what the player said onto the person and that is the last thing in the
   * engine to touch it, and nothing else should: it is on the character sheet
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
// Property
// ---------------------------------------------------------------------------

/**
 * The two things the family owns, and nothing else.
 *
 * This union used to carry seventeen kinds — apartments, condos, penthouses, a
 * private island, retail — for a game whose whole premise is that the family
 * already holds one estate and never buys or sells any of it. Fifteen of them
 * could not be produced by any code path in the build. A kind nothing issues is
 * a market this game does not have, written down as though it did.
 */
export type PropertyKind = 'house' | 'studio_lot';

export type TenureKind = 'owned' | 'rented' | 'leased' | 'under_construction';

/**
 * A place that stands on the estate.
 *
 * Sixteen fields came off this record at schema 80, which was two thirds of
 * what a save used to say about a house, and all sixteen the same defect: a
 * property market described in the model and absent from the game. Nothing
 * bought, so no `purchasePrice` or `purchasedAt`; nothing borrowed against, so
 * no `mortgageAccountId`; nothing rented, listed, or covered by a policy of its
 * own. `garageSpaces` and `dockFeet` outlived the vehicles and the boats they
 * were for. `structureIds` pointed at a table that had already been deleted and
 * was written as `[]` on every save ever made.
 *
 * Two of them are worth naming separately, because they were not empty — they
 * were duplicates. `addressLine` stored what `estatePlaceLine()` computes and
 * `lotSqft` stored `ESTATE_ACRES` in square feet, both fixed at the moment the
 * save was written, and no screen read either. A second copy of a fact is a
 * fact that can drift from itself, which is the reason `SoundStage` below works
 * its numbers out of the bookings instead of storing them.
 */
export interface Property {
  id: Id;
  saveId: Id;
  ownerId?: Id;
  ownerKind: 'person' | 'company' | 'none';
  kind: PropertyKind;
  name: string;
  locationId: string;
  tenure: TenureKind;
  bedrooms: number;
  bathrooms: number;
  interiorSqft: number;
  yearBuilt: number;
  features: string[];
  /** Current market value in cents; moves with the market model. */
  marketValue: Money;
  /** 0-100 physical condition; decays without maintenance. */
  condition: number;
  isPrimaryResidence: boolean;
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

/**
 * Whether a production is building on a stage, shooting on it, or taking it
 * down again.
 */
export type BookingKind = 'prep' | 'shooting' | 'strike';

/**
 * A production holding a stage for a run of dates.
 *
 * The unit is the week, because that is how stages are actually let, and the
 * rate depends on what the production is doing in there: pre-lighting and
 * striking cost less than shooting. A lot that charged one flat rate would be a
 * lot nobody had ever booked.
 *
 * Three kinds, and there used to be a fourth. Holding a standing set on a dark
 * day is a real thing a lot charges for, and nothing here ever wrote such a
 * booking, so the word and its rate were a price list for something the game
 * does not sell. `strike` is the opposite case and is why the union is three
 * again: the lot wrote a strike on every booking it took and filed it under
 * `prep`, because the rate is the same and there was no word for taking a set
 * down. It is 6.5% of what the lot quotes, and a board reading these rows saw
 * productions prep twice and never strike.
 */
export interface Booking {
  id: Id;
  saveId: Id;
  stageId: Id;
  /**
   * Which office this is, off the enquiry that booked it.
   *
   * Absent on the family's own holds, which are not an office ringing up. The
   * player's whole memory of a casting office keys on this: it used to key on
   * `holder` below, which is a sentence, so rewording a line of prose wiped the
   * history and changed the office's taste.
   */
  officeId?: string;
  /** Who is on it, in the world's words. */
  holder: string;
  /** Set when it is the family's own company on its own stage. */
  companyId?: Id;
  kind: BookingKind;
  from: Instant;
  to: Instant;
  /** What this booking is paying per week, in cents, after the rate share. */
  weekRateCents: Money;
  /**
   * What the production on it is spending in the country, in cents.
   *
   * Carried from the enquiry that booked the stage, because `feeFor` had no
   * other way to know it and was pricing a part off the rate card instead —
   * which meant the same guest part on the same commercial paid twice as much
   * or half as much depending on which room happened to be free, and the
   * correlation between a picture's money and its cast's pay was an accident
   * of floor area rather than a fact about either.
   *
   * Optional because a save written before this carries bookings without it,
   * and `feeFor` falls back to the old rate-card arithmetic when it is absent.
   */
  spendCents?: Money;
  /** Set once the money for it has been posted. */
  invoicedAt?: Instant;
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
 *
 * 86 added the people who make a picture: `appeal` on a holding, and `hires` on a
 * project in place of `levels`. A save from 85 has pictures staffed at a rung with
 * nobody in the chair, which reads as departments that were never cast rather than
 * as a broken save, and material with no appeal reads as ordinary.
 */
export const SAVE_SCHEMA_VERSION = 86;

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

export interface SaveUniverse {
  meta: SaveMeta;
  /** What this game is, stated in the save itself. See `Premise`. */
  premise: Premise;
  /** Every id ever issued in this save. Keeps ids deterministic across a replay. */
  __idCounter: number;
  /**
   * And one counter per namespace, so a person's id does not move because a
   * transaction was posted. Absent on a save written before they were told
   * apart; `core/ids.ts` says how such a save is picked up without collisions.
   */
  __idCounters?: Partial<Record<IdNamespace, number>>;

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

  /**
   * What the game has already explained to this player, and whether to go on.
   *
   * Optional because every save written before schema 83 has none, and `migrate`
   * creates an empty one rather than this being read with a fallback in thirty
   * places. A save that has never had the teaching on looks identical to one that
   * has dismissed it on its first week, which is correct: neither has been told
   * anything and only one of them wants to be.
   */
  tutorial?: Tutorial;
}

/**
 * The teaching's whole state. Two fields, and both are the player's.
 *
 * `seen` is a map rather than a list so that the date a lesson was given is kept —
 * the screen shows when each one arrived, and a lesson is never repeated on the
 * strength of it being missing from an array somebody filtered wrongly.
 */
export interface Tutorial {
  /** Lesson id to the instant it was given. */
  seen: Record<string, Instant>;
  /** Whether the player has switched the teaching off. */
  dismissed: boolean;
}
