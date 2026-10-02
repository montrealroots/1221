/**
 * SLATE — The domain model.
 *
 * Every stateful thing in the universe. Each record carries `saveId`, and a
 * universe is refused on load where a person, an account or a scheduled item
 * carries another save's (`validateUniverse`). One save is one world; three
 * saves are three worlds that can never see each other. This said a store
 * refused any record of another save's, and until 2026-09-27 no such store
 * existed: the load's check is the whole of it.
 */

import type { Instant, TimeZone } from '../core/time';
import type { Money } from '../core/money';
import type { Account, LedgerTransaction } from '../core/ledger';
import type { ScheduledItem } from '../core/scheduler';
import type { HomeState } from '../systems/household';
import type { Counter, OwnedHome, Purchase } from '../systems/homes';
import type { Living, Stay } from '../systems/dwelling';
import type { CreditState } from '../systems/credit';
import type { AlertSettings } from '../systems/statements';
import type { PaymentSettings } from '../systems/payments';
import type { Craft, SchoolRecord } from '../systems/school';
import type { Attributes } from '../systems/attributes';
import type { CareerRecord } from '../systems/career';
import type { EarningsRecord } from '../systems/earnings';
import type { HealthRecord } from '../systems/health';
import type { UnemploymentRecord } from '../systems/unemployment';
import type { TaxReturn } from '../systems/taxreturn';
import type { IdNamespace } from '../core/ids';
import type { PerformerTitle } from '../core/performer';

export type Id = string;

/**
 * Seven dispositions, each on the 5-95 slider of the Dispositions & Traits
 * step. Three of them move the wellbeing model through
 * `systems/personality.ts`: emotional stability sets how fast stress arrives
 * and clears, ambition adds to what running on empty costs, and
 * conscientiousness sets how well the nights go. Risk tolerance sets whether
 * the card's autopay clears the statement or carries a balance
 * (`systems/credit.ts`); it was read by nothing until the card. Openness,
 * extraversion and agreeableness were kept and read by nothing until
 * 2026-09-27; since then they decide how a day of work is taken
 * (`systems/enjoyment.ts`): extraversion the stress of an audition in the
 * room, openness the mood of a day away from home, agreeableness the mood of
 * a rehearsal.
 */
export interface Personality {
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
  /** 0-100 fitness, moved by what a body is asked to do and how it is kept. */
  fitness: number;
  /** Hunger 0-100 where 100 is fed. */
  nourishment: number;
  /**
   * 0-100, where 100 is clean and rested-looking. Falls through the day, and
   * twice as fast on set or on stage (`setGrime`); a shower puts it back.
   * Rooms notice.
   */
  hygiene: number;
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
  pronouns: string;
  /**
   * Actor, or actress. Stored, not worked out wherever it is needed, because
   * under they/them it is the player's to state and the pronouns cannot say
   * it back. It is a word, not a stat: it decides what they are
   * called and nothing else. See `core/performer.ts`.
   */
  performerTitle: PerformerTitle;
  /**
   * Their headshot, as a data URL.
   *
   * Stored on the person rather than beside the save, because it belongs to
   * them: it follows them onto the slot card and anywhere else a face is
   * shown. Always re-encoded to a fixed frame before it gets here, so this is
   * tens of kilobytes rather than whatever came off a phone.
   */
  portrait?: string;

  birthInstant: Instant;
  /** Reference city id where they are from. */
  homeRegionId: string;
  /**
   * The country they are a citizen of: the one their place of birth gives,
   * which for a territory is the state it belongs to. Worked out from
   * `homeRegionId` when the save is made, and never asked. See
   * `domain/citizenship.ts`.
   */
  citizenshipId: string;

  /** Reference city id where they currently are. */
  currentLocationId: string;

  personality: Personality;
  /**
   * The personality traits they chose, up to four, by id from
   * `content/personality-traits.ts`. Never two that rule each other out.
   */
  personalityTraits: string[];
  /**
   * What they care about, and below it the genres they love. On the
   * character sheet because a person has them, and the person look says both
   * back. The interests change how much an hour of looking after yourself
   * gives the mood (`systems/enjoyment.ts`), never how good anybody is at
   * anything, and since 2026-09-27 what a day of work gives, with the genres.
   */
  interests: string[];
  genres?: string[];
  /**
   * The life before this one, in the player's own words.
   *
   * Flavor, and deliberately kept as flavor: no attribute, no modifier and
   * no advantage hangs off it. What stops it being a dead word is that the
   * game says it back — the person look prints it under their name. A
   * sentence somebody authored about their own character and never saw again
   * would be worse than not asking.
   */
  background: string;
  // `beforeActing`, the day job (`job`) and the pay record behind benefits
  // and tax returns (`earnings`) were here until 2026-09-26, when the owner
  // kept SLATE to acting and the job engine was taken out. `migrate` in
  // `engine/index.ts` takes them off a save from before.
  /**
   * Where they live and what kind of home it is (`systems/household.ts`):
   * the rent and bills due on the first, and the town the food is bought in.
   * Given to every character from schema 89.
   */
  home?: HomeState;
  /**
   * The homes they own, lived in, let or empty; the one they're buying, until
   * it closes; a seller's counter standing; and offers made on each listing
   * (`systems/homes.ts`). From 2026-09-28; `owned`, a single home, was the
   * first day's, and `migrate` makes it the first of `homes`.
   */
  homes?: OwnedHome[];
  buying?: Purchase;
  counter?: Counter;
  offersMade?: Record<string, number>;
  /**
   * Where they're staying away from home on a job: a production's hotel, a
   * sublet room, a friend's sofa, or a home of their own there
   * (`systems/career.ts`); `systems/dwelling.ts` reads what it has.
   */
  stay?: Stay;
  /** Their clothes, the state of the place, and a cleaner (`systems/dwelling.ts`). From 2026-09-28. */
  living?: Living;
  /**
   * The papers they hold, each a record with its issuer, number, dates and
   * status: passports, travel authorizations, visas and permissions to stay
   * or work, driving licenses (`systems/documents.ts`). From 2026-09-29.
   */
  documents?: import('../systems/documents').PersonDocument[];
  /** Journeys booked and taken (`systems/journey.ts`). */
  journeys?: import('../systems/journey').Journey[];
  /** Their progress toward a driving license where they live (`systems/licensing.ts`). */
  licensing?: import('../systems/licensing').LicensingRecord;
  /** The motorcycle license's path, kept apart from the car's (`systems/licensing.ts`, from 2026-09-30). */
  motoLicensing?: import('../systems/licensing').LicensingRecord;
  /** ConfirmID paid at a TSA checkpoint, good until then (`systems/identity.ts`, from 2026-09-30). */
  confirmIdUntil?: number;
  /** When a home's gain was last kept free of tax, which the exclusion waits two years to allow again. */
  exclusionUsedAt?: number;
  /** How many homes they've bought: England's first-time buyer's relief is for the first. */
  homesOwned?: number;
  /**
   * Their credit record and how the card is paid (`systems/credit.ts`). Not
   * `creditScore`: `migrate` sheds a field by that name that builds before 80
   * kept on the person.
   */
  credit?: CreditState;
  /** A US bank's ChexSystems report of an account it closed for what was owed: when, and by whom. */
  chex?: { at: number; bank: string };
  /**
   * The bank's alerts they've set (`systems/statements.ts`): the current
   * account under a line, a payment over one, and a statement ready. From
   * 2026-09-26; a save from before has the bank's defaults.
   */
  alerts?: AlertSettings;
  /**
   * How rent, bills and everyday spending are paid, whether savings backs
   * the current account, their standing orders and the checks in the post
   * (`systems/payments.ts`). From 2026-09-26; a save from before keeps the
   * way it ran, everything from the bank with savings swept.
   */
  payments?: PaymentSettings;
  /** Round-ups into savings, where the bank offers them, and the day's change so far. */
  roundUps?: { on: boolean; pending: Money };
  /** Money gone to the state or its scheme after years untouched, which can be claimed back. */
  unclaimed?: { amount: Money; to: string; at: Instant }[];
  /** Drama school, while they're at one and after (`systems/school.ts`). */
  school?: SchoolRecord;
  /** Their craft as an actor, 0 to 100 in each area (`content/school.ts`). */
  craft?: Craft;
  /** How far their craft can grow, skill by skill (`CEILING` in `systems/school.ts`). */
  craftCeiling?: Craft;
  /**
   * Presence, composure, reputation and recognition (`systems/attributes.ts`).
   * Kept as `attrs`: the migration sheds `attributes` and `reputation` from
   * every save, the old line's sheet and its standing, so neither name is free.
   */
  attrs?: Attributes;
  /** Their working life as an actor: representation, auditions, jobs, the unions (`systems/career.ts`). */
  career?: CareerRecord;
  /** What they've earned, by year and by quarter, for the return, unemployment and the unions' health plans (`systems/earnings.ts`). */
  earnings?: EarningsRecord;
  /** A SAG-AFTRA pension begun: when, and what an early start leaves of it (`systems/pension.ts`). */
  pensionStart?: { at: number; factor: number };
  /** Health cover after school: the unions' plans and the marketplace (`systems/health.ts`). */
  health?: HealthRecord;
  /** Unemployment insurance claims (`systems/unemployment.ts`). */
  unemployment?: UnemploymentRecord;
  /** A Universal Credit claim, living in Britain (`systems/universalcredit.ts`). From 2026-09-29. */
  universalCredit?: import('../systems/universalcredit').CreditClaim;
  /** When they claimed the UK State Pension (`systems/statepension.ts`). */
  statePensionFrom?: number;
  /** Social Security claimed: from when, and the monthly benefit in dollars (`systems/socialsecurity.ts`). */
  socialSecurity?: { from: number; monthlyUsd: number };
  /** Ireland's State Pension claimed, and its week in euro cents; Mexico's Pensión para el Bienestar claimed (`systems/homepensions.ts`). */
  irishPension?: { from: number; weeklyEur: number };
  bienestarFrom?: number;
  /** The cars they own and have owned (`systems/vehicles.ts`). */
  vehicles?: import('../systems/vehicles').OwnedVehicle[];
  /** The land they own and have owned (`systems/land.ts`). */
  land?: import('../systems/land').Parcel[];
  /** An offer on land accepted, a seller's counter, and the offers made (`systems/land.ts`). */
  landBuying?: import('../systems/land').LandBuying;
  /** A house being built on land they own (`systems/construction.ts`). */
  building?: import('../systems/construction').Build;
  /** What they own, and where each thing is (`systems/items.ts`, from 2026-10-01). */
  items?: import('../systems/items').Item[];
  /** Things bought to be delivered, and their deliveries (`systems/orders.ts`, from 2026-10-01). */
  orders?: import('../systems/orders').Order[];
  /** The outfit they chose to wear, and the one they have on (`systems/wardrobe.ts`, from 2026-10-01). */
  dressed?: string[];
  /** Streaming, music and game services paid monthly, and a TV license (`systems/homelife.ts`, from 2026-10-02). */
  subscriptions?: import('../systems/homelife').Subscription[];
  tvLicence?: { until: number };
  /** Clothes put in the basket to check out together, a retailer at a time (`systems/clothing.ts`, from 2026-10-02). */
  basket?: import('../systems/clothing').BasketLine[];
  /** What they have on now, and since when: the day's outfit as it's put on, or what they changed into (`systems/wardrobe.ts`, from 2026-10-02). */
  wornNow?: { itemIds: string[]; since: number };
  /** Outfits they've put together and named, the clothes they bought, and when their own wardrobe began (`systems/clothing.ts`, from 2026-10-01). */
  outfits?: import('../systems/clothing').Outfit[];
  clothesBought?: import('../systems/clothing').ClothesPurchase[];
  clothesSince?: number;
  /** Their blood alcohol as it stood, and the night's highest (`systems/alcohol.ts`, from 2026-10-01). */
  alcohol?: import('../systems/alcohol').Alcohol;
  /** Routines they've saved (`systems/routines.ts`, from 2026-10-01). */
  routines?: import('../systems/routines').Routine[];
  /** The people they know, met at school and at work (`systems/people.ts`, from 2026-10-01). */
  contacts?: import('../systems/people').Contact[];
  /** A gym they're a member of (`systems/gyms.ts`, from 2026-10-01). */
  gym?: import('../systems/gyms').Membership;
  /** A trip out on errands, while it's under way (`systems/trips.ts`, from 2026-10-01). */
  trip?: import('../systems/trips').Trip;
  /** The internet at home and the phone, by provider (`systems/telecom.ts`, from 2026-10-01). */
  telecom?: import('../systems/telecom').Telecom;
  /** A marriage, and a divorce under way (`systems/marriage.ts`, from 2026-10-01). */
  marriage?: import('../systems/marriage').Marriage;
  /** How a couple living together splits the rent and the bills: evenly unless by income. */
  billSplit?: 'income';
  /** Children, a child on the way, and trying for one (`systems/children.ts`, from 2026-10-01). */
  children?: import('../systems/children').Child[];
  pregnancy?: import('../systems/children').Pregnancy;
  trying?: boolean;
  /** An adoption or a surrogacy under way, and the adoptions made, for the return (`systems/adoption.ts`, from 2026-10-02). */
  familyPath?: import('../systems/adoption').FamilyPath;
  /** Your mother and father (`systems/parents.ts`, from 2026-10-02). */
  parents?: import('../systems/parents').Parent[];
  /** A personal trainer booked (`systems/trainers.ts`, from 2026-10-02). */
  training?: import('../systems/trainers').Training;
  /** This month's pre-purchase inspection of a used car (`systems/usedcars.ts`, from 2026-10-02). */
  inspectedUsed?: import('../systems/usedcars').Inspected;
  adopted?: import('../systems/adoption').Adopted[];
  /** A dating app they're on (`systems/dating.ts`, from 2026-10-01). */
  datingApp?: import('../systems/dating').DatingApp;
  /** When their toiletries began to be counted, and when they last had their hair done (`systems/hygiene.ts`, from 2026-10-01). */
  suppliesSince?: number;
  /** When their laundry and dishwasher detergent began to be counted (`systems/hygiene.ts`, from 2026-10-02). */
  cleaningSince?: number;
  groomedAt?: number;
  /** The home whose utility accounts they hold (`systems/utilities.ts`, from 2026-10-01). */
  utilitiesAt?: string;
  /** A save's bed, sofa and gear from before items, each when it was bought; moved into `items` when first read. */
  furniture?: Partial<Record<import('../content/furniture').Piece, number>>;
  /** A soup kitchen's or a pantry's help, for a day the bank can't feed them (`systems/foodhelp.ts`, from 2026-10-01). */
  foodHelp?: import('../systems/foodhelp').FoodHelpRecord;
  /** When the mattress in their bed was replaced, if it has been (`systems/furniture.ts`). */
  mattressAt?: number;
  /** A move made in a rented truck they drive, not by movers (`truckFor` in `systems/furniture.ts`). */
  moveBy?: 'truck';
  /** Air conditioning units of their own, and when they were bought (`systems/appliances.ts`). */
  acUnits?: number;
  /** Countertop and portable machines of their own, and when each was bought (`systems/appliances.ts`). */
  portables?: Partial<Record<import('../systems/appliances').Portable, number>>;
  /** Cars rented on journeys (`systems/rentals.ts`). */
  rentals?: import('../systems/rentals').Rental[];
  /** A private pilot's certificate, and the training toward it (`systems/aviation.ts`). */
  pilot?: import('../systems/aviation').PilotCertificate;
  pilotTraining?: import('../systems/aviation').PilotTraining;
  /** Pilot's licenses outside America, from 2026-09-30 (`systems/aviation.ts`). */
  pilotLicences?: { authority: string; country: string; issuedAt: number; /** When its medical runs out, from 2026-10-01. */ medicalUntil?: number }[];
  /** A plane of their own (`systems/aviation.ts`). */
  /** The planes they own (`systems/aviation.ts`). A save from before 2026-10-01 held one, as `aircraft`, moved into the list on opening. */
  planes?: import('../systems/aviation').OwnedAircraft[];
  aircraft?: import('../systems/aviation').OwnedAircraft;
  /** The boats they own, and the states whose operator's certificate they hold (`systems/boats.ts`). A save from before 2026-10-01 held one, as `boat`, moved into the list on opening. */
  boats?: import('../systems/boats').OwnedBoat[];
  /** Travel trailers and touring caravans of their own (`systems/caravans.ts`, from 2026-09-30). */
  caravans?: import('../systems/caravans').OwnedCaravan[];
  boat?: import('../systems/boats').OwnedBoat;
  boatCertificates?: import('../content/boats').BoatState[];
  /** Their driving record: points and a suspension (`systems/driving.ts`). */
  driving?: import('../systems/driving').DrivingRecord;
  /** Dublin's Housing Assistance Payment, from when (`systems/homebenefits.ts`). */
  hap?: { since: number };
  /** Their IMSS record under the 1997 law: days contributed, the AFORE account, the pension claimed (`systems/imss.ts`). */
  imss?: import('../systems/imss').ImssRecord;
  /** Canada's CPP paid in by year, and the pensions claimed (`systems/capensions.ts`, from 2026-09-30). */
  caPensions?: import('../systems/capensions').CanadaPensions;
  /** Citizenships taken since birth, by naturalization (`systems/citizenship.ts`, from 2026-09-30). */
  naturalized?: { iso: string; at: number }[];
  /** A naturalization being decided. */
  naturalizing?: { iso: string; readyAt: number };
  /** Registered for EI's special benefits as a self-employed Canadian (`systems/eiself.ts`, from 2026-09-30). */
  ei?: import('../systems/eiself').EiRecord;
  /** The body's clock a journey left out, and since when (`systems/jetlag.ts`). */
  bodyClock?: import('../systems/jetlag').BodyClock;
  /** Claims at home in Ireland and Mexico City (`systems/homebenefits.ts`), and when they moved home from abroad. */
  jobseekers?: import('../systems/homebenefits').JobseekerClaim;
  desempleo?: import('../systems/homebenefits').DesempleoClaim;
  returnedHomeAt?: number;
  /** A claim for assistance where they live: Ontario Works, BC Income Assistance or SNAP (`systems/assistance.ts`, from 2026-10-01). */
  assistance?: import('../systems/assistance').AssistanceClaim;
  /** When their US status ended while they stayed on, from 2026-10-01 (`systems/permission.ts`). */
  usOutOfStatus?: number;
  /** Income tax returns, by year (`systems/taxreturn.ts`). */
  returns?: Record<string, TaxReturn>;
  /** Where they come from, for what a school's need assessment reads. Shown nowhere. */
  family?: 'wealthy';
  /** Payments somebody else made on their cards: when, which, when they learned of it and when the statement showed it, whether they reported it, what the law left them and what came back. */
  fraud?: { accountId: string; which: 'debit' | 'credit'; amount: Money; at: Instant; learnedAt: Instant; statedAt: Instant; reportedAt?: Instant; carried?: Money; refunded?: Money }[];

  wellbeing: Wellbeing;
  /** Height and weight, and the day's energy in and out (`systems/body.ts`). */
  body?: import('../systems/body').Body;

  /** Primary spending account. */
  primaryAccountId?: Id;

  /**
   * Their last night, as one instant, so the world knows whether a night has
   * been slept since midnight (`sleepAlone` in `systems/life.ts`). A night
   * they chose is its wake, put on record when it is booked, so it is ahead
   * of the clock from the booking to the wake; before schema 88 it was
   * stamped at the wake. A night nobody chose is its bedtime: the midnight,
   * or later for somebody the player stayed up with. A new save starts with
   * the moment the world does.
   */
  lastSleptAt?: Instant;
  /**
   * When their waking day began: the moment they woke, or will wake if it is
   * still ahead of the clock, which is a night they are asleep in. A night
   * the player chose runs to its wake, and one nobody chose to a sound
   * sleeper's waking, or to where the clock stopped if that came first. The
   * clock charges waking time from here as it moves, at the drain set by the
   * sleep debt they woke with. Absent means the count starts the first time
   * the clock moves. A save from before 88 is given the next midnight, ahead
   * of the clock while they are awake. See `chargeWakingHours` in
   * `systems/life.ts`.
   */
  awakeSince?: Instant;
  /**
   * The sleep debt they woke with, which sets how fast their waking day
   * drains. Written at every wake, chosen or not, and at the start of a
   * waking day with none on record; absent on a save from before 88 until
   * its first wake, when it is worked out from the debt instead. A new save
   * starts with it at nought, the debt the world starts them with.
   */
  wokeWithDebt?: number;
  /**
   * Where a night nobody chose would have ended, kept while the clock has
   * stopped before then: a plan in the small hours, or the morning a skip was
   * sent to. Whenever the clock is sent on more than an hour before then,
   * they are asleep again, until then or until it stops, and the night is not
   * paid twice. Cleared the first time the clock moves on from it or later.
   * Before it, the stop's night was the night slept, and a plan at five past
   * one on a skip to the morning kept them up until the next midnight. See
   * `sleepAlone` in `systems/life.ts`.
   */
  nightEndsAt?: Instant;
  /**
   * The bedtime of that night while it is not yet paid: the clock stopped in
   * its first hour, and it is paid, from this bedtime, when the clock goes on
   * more than an hour into it. Kept only alongside `nightEndsAt`, and
   * forfeit with it when the player moves the clock themselves in the night.
   */
  nightOwedFrom?: Instant;

  /**
   * Who this person is, in their own terms. Set at creation and only for the
   * player: SLATE never asks it of anybody else and never guesses it from a
   * name, a country or a city.
   *
   * It carries no attribute, no skill, no advantage and no penalty. Nothing in
   * the simulation reads it, and nothing should: the person look says it
   * because a person has one, not because the game does anything with it.
   * Until 2026-09-27 this said it was on the character sheet, and no screen
   * showed it after creation.
   */
  raceEthnicity?: readonly string[];
  /** Said in their own words, where the list did not have it. */
  raceEthnicityOwn?: string;

  createdAt: Instant;
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

/**
 * What the player has set. Until 2026-09-27 six more were kept here, sound on
 * and its volume, compact mode, advanced numbers and a confirmation for large
 * purchases with its threshold, and nothing read any of them: there is no
 * sound, no settings screen and no confirmation. A save from before keeps
 * them, unread, as it keeps any key SLATE no longer knows.
 */
export interface Preferences {
  /**
   * How fast the world runs against real time. 'live' is one to one: a minute
   * of your evening is a minute of theirs. The faster settings are there for
   * waiting something out, not because the game needs them.
   */
  timeSpeed: 'paused' | 'live' | 'fast' | 'faster';
}

/**
 * 80 took out the character sheet, the film career, the family business, the
 * family itself, the land and the house. 81 put the performer title back on
 * the player. 82 took out the second citizenship and made the first the
 * country of the place of birth. 83 put the personality and its traits back.
 *
 * 87 came next, and 84 to 86 were skipped on purpose. This line and the one it
 * replaced as main split at 79, and both went on counting: the older line used
 * 80 to 83 for changes of its own, and a branch of it reached 86. A save from
 * that line at 83 claimed to be current here and opened without `migrate`, and
 * one at 84 to 86 was refused as newer. At 87 every save from either line is
 * older than the build, and opening a slot now runs `migrate` whatever the
 * number says (`openSlot` in `engine/index.ts`), so a number shared again
 * cannot skip it. `migrate` reads what a save holds and not the number on it.
 * A save from this line gains the number and nothing else. A save from the
 * older line sheds what 80 shed here and the date its reputation last faded,
 * and is given an empty history and, where it lacks them, the four personality
 * axes that line dropped on 09-17, at the values creation starts on. Its
 * premise, family, business, film career, property, lot and tutorial stay as
 * inert JSON.
 *
 * 88 charged the waking day as the clock moves instead of all at once at
 * midnight. It gave every person `awakeSince`, when their waking day began,
 * and from their next wake `wokeWithDebt`, the sleep debt they woke with, and
 * `nightEndsAt` and `nightOwedFrom` while the clock has stopped in the middle
 * of a night nobody chose. A save from before 88, this line's 87 included,
 * was charged at its last midnight for the whole day ahead, or, saved before
 * its first midnight, was never charged for that day. Either way its people
 * come in charged up to the next midnight, as that build would have left
 * them, and their waking day starts there.
 *
 * 89 keeps a save's money in the currency of the country the character
 * started in (`SaveMeta.currency`), where every save before it was kept in
 * euros. A build at 88 would print a save's krónur as euros, which is why the
 * number moved. A save from before 89 has no currency and keeps its euros.
 *
 * `migrate` in `engine/index.ts` says what an older save sheds on the way in,
 * what it keeps as inert JSON, and what it is given.
 */
export const SAVE_SCHEMA_VERSION = 89;

export interface SaveMeta {
  id: Id;
  slot: 1 | 2 | 3;
  schemaVersion: number;
  createdAt: number;
  /** Accumulated real seconds of play. */
  playtimeSeconds: number;
  /** Deterministic seed for the whole universe. */
  seed: string;
  characterName: string;
  /** The player's headshot, mirrored here so a slot can show it without
   *  deserialising the whole universe behind it. */
  portrait?: string;
  /** The player's title, Actor or Actress, for the line under their name on
   *  the slot. The hosted save table keeps it in its career column. */
  careerLabel: string;
  locationLabel: string;
  worldDateLabel: string;
  netWorthLabel: string;
  appVersion: string;
  /**
   * The currency this save's money is kept in: the one where the character
   * started, as a real account is. Absent on a save from before 89, which was
   * kept in euros (`DEFAULT_LEDGER_CURRENCY`); `saveCurrency` reads it.
   */
  currency?: string;
  /**
   * When the player's life ended, and at what age, once it has
   * (`systems/mortality.ts`).
   * A save with these set is a finished life: the clock no longer runs, and
   * the slot opens onto how it ended.
   */
  endedAt?: number;
  endedAge?: number;
}

/**
 * One save is one universe. Every collection here is scoped to this save and
 * to nothing else. There is no shared mutable state between saves anywhere in
 * SLATE; the only thing saves have in common is immutable reference data.
 */
export interface SaveUniverse {
  meta: SaveMeta;
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
  /** Zone of the player's home: the day turns over on its clock, and it follows a move (`rehome`). */
  homeZone: TimeZone;
  /** Zone the player is physically in right now. */
  currentZone: TimeZone;
  playerId: Id;

  people: Record<Id, Person>;

  accounts: Record<Id, Account>;
  transactions: LedgerTransaction[];

  scheduled: ScheduledItem[];
  decisions: Record<Id, DecisionItem>;
  notifications: Notification[];

  preferences: Preferences;

  /**
   * The guide (`world/tutorial.ts`): the chapters read, in the order they
   * were. Absent on a save begun before the guide, or made without it, and
   * such a save has everything open.
   */
  tutorial?: { read: string[] };

  /** Counters used by systems that need per-save monotonic sequences. */
  counters: Record<string, number>;

}
