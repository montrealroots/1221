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
import type { HistoryRecord } from '../core/audit';
import type { HomeState } from '../systems/household';
import type { CreditState } from '../systems/credit';
import type { AlertSettings } from '../systems/statements';
import type { PaymentSettings } from '../systems/payments';
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
 * extraversion and agreeableness are kept and read by nothing yet;
 * `tools/wired.mjs` counts them.
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
   * 0-100, where 100 is clean and rested-looking. Falls through the day and
   * faster on a shoot; a shower puts it back. Rooms notice.
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
   * anything; the genres decide nothing.
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
   * Their credit record and how the card is paid (`systems/credit.ts`). Not
   * `creditScore`: `migrate` sheds a field by that name that builds before 80
   * kept on the person.
   */
  credit?: CreditState;
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

  wellbeing: Wellbeing;

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
   * the simulation reads it, and nothing should: it is on the character sheet
   * because a person has one, not because the game does anything with it.
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
  lastPlayedAt: number;
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
  /** Set while a migration is mid-flight, for recovery. */
  migrationInProgress?: { from: number; to: number; startedAt: number };
  backupAvailable: boolean;
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
  /** Zone used for the player's day-to-day display. */
  homeZone: TimeZone;
  /** Zone the player is physically in right now. */
  currentZone: TimeZone;
  playerId: Id;

  people: Record<Id, Person>;

  accounts: Record<Id, Account>;
  transactions: LedgerTransaction[];

  scheduled: ScheduledItem[];
  history: HistoryRecord[];
  decisions: Record<Id, DecisionItem>;
  notifications: Notification[];

  preferences: Preferences;

  /**
   * The guide (`world/tutorial.ts`): the chapters read, in the order they
   * were. Absent on a save begun before the guide, or made without it, and
   * such a save has everything open.
   */
  tutorial?: { read: string[] };

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
