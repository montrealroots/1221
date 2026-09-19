/**
 * SLATE — the family business, as records rather than a name on a gate.
 *
 * Until now the company was a string. `studioName(surname)` returned "Rivera
 * Pictures" and that was the whole of it: no registration, no bank account, no
 * standing with anybody, and nothing it was allowed or forbidden to do.
 *
 * These are the records underneath. The shape they take comes from one
 * decision about where this family sits in the world, and it is worth stating
 * plainly because everything else follows from it.
 *
 * THE DECISION. The parent company is Icelandic, and the American arm is a
 * thing you earn. A family on Icelandic land, holding Icelandic passports,
 * building on their own ground, does not incorporate in Delaware — they form
 * an `ehf.`, which is the private limited company every small Icelandic
 * business is, and they register it with Fyrirtækjaskrá like everybody else.
 * That is the company that owns the land, the lot and eventually the library.
 *
 * But the business they are trying to enter is American, and the American
 * business is fenced. A member of SAG-AFTRA may not work for a producer who
 * has not signed with SAG-AFTRA — anywhere on earth, which is the whole point
 * of the rule — so the first time this family wants an American performer, an
 * Icelandic company is not enough. They need an American subsidiary to sign
 * with, and forming one is a real, dated, costly step.
 *
 * That is the ladder the whole of this file exists to build. You start as a
 * real company that has never made anything, and every rung is a door that
 * was shut.
 */

import type { Id } from '../core/ids';
import type { Money } from '../core/money';
import type { Instant } from '../core/time';
import type { Demands } from '../content/material';

// ---------------------------------------------------------------------------
// The company itself
// ---------------------------------------------------------------------------

/** Whose law a company answers to. */
export type Jurisdiction = 'is' | 'us';

/**
 * The legal form.
 *
 * Two Icelandic and two American, because those are the four this family will
 * ever plausibly use. `ehf.` is the private limited company — the ordinary
 * one, and what the parent is. `hf.` is the public limited company, which
 * needs far more capital and exists here because a company that ever raises
 * real outside money becomes one. The American pair are the two forms a
 * production subsidiary is ever formed in.
 */
export type CompanyForm = 'ehf' | 'hf' | 'llc' | 'inc';

export interface Ownership {
  holderId: Id;
  holderKind: 'person' | 'company';
  /** Whole percent. The holders of one company must total a hundred. */
  percent: number;
}

/**
 * One company.
 *
 * The parent has no `parentId`. An arm has one, and the arm's whole reason for
 * existing is written on `formedFor`, because a subsidiary nobody can explain
 * is a subsidiary somebody is about to be asked about by a tax authority.
 */
export interface Company {
  id: Id;
  saveId: Id;
  /** What it is called on a call sheet. */
  name: string;
  /** What it is called on a contract, which carries the form. */
  legalName: string;
  form: CompanyForm;
  jurisdiction: Jurisdiction;
  /**
   * What business it is in.
   *
   * The family holds two entirely separate things: the sugar group that made
   * the money, and the production company that spends it. They share owners
   * and nothing else — different trades, different countries, different
   * centuries — so anything asking "what can the company do" has to mean one
   * of them and not both. Without this they were indistinguishable by shape,
   * and the film half started answering questions about cane.
   */
  trade: 'film' | 'sugar';
  parentId?: Id;
  /** Why this arm exists, in a sentence. Absent on a parent. */
  formedFor?: string;
  ownerships: Ownership[];
  /** The city it is registered in, from the gazetteer. */
  locationId: string;
  /** The property its registered office sits on, where it has one. */
  registeredOfficeId?: Id;
  /** What it says it is for. Buyers and talent both read this. */
  remit: string;
  foundedAt: Instant;
  /**
   * When it was wound up. Never, in this build.
   *
   * No command writes it — there is no `company.dissolve` — and five filters
   * read it: three in `world/company.ts` and two in `ui/looks/estate.tsx`.
   * Five guards against a state the save cannot reach. They stay because a
   * company that cannot be wound up is a gap somebody will want closed, and
   * the filters are where the closing would land; until then, read them as
   * shape.
   */
  dissolvedAt?: Instant;
  /**
   * How many months in a row it has been overdrawn with the family on terms.
   *
   * Reset to nought the moment it is solvent again, because four bad months with a
   * good one in the middle is a company having a hard year and not a company that
   * failed. Read by `world/ruin.ts`, which is the only thing that writes
   * `dissolvedAt` above.
   */
  monthsUnder?: number;
  /**
   * The last thing the family said about carrying this, by rung id.
   *
   * Stored because it is the only part of the conversation that is not
   * derivable. What the family has put in is on the ledger and what a year of
   * the group's profit came to is a function of the quota, so where they stand
   * is recomputed every time anybody asks — but whether anybody has said it out
   * loud is not a fact about money. It matters because the rung can move
   * without the money moving at all: America shuts the quota, the same figure
   * reads against a smaller year, and the line comes to meet you.
   */
  familySaid?: string;
  /**
   * What the lot spends a month telling people it exists, where that has been
   * decided.
   *
   * The overhead table's floor is what it costs to be sold at all. This is the
   * part somebody chose, and it is the one decision on this axis that is taken
   * again every month rather than once. Money only; what it buys is worked out
   * from the ledger, because the market takes two quarters to notice a lot and
   * two more to forget one, and a stored figure would let a player buy a
   * booking the month before they needed it.
   */
  sellsFor?: Money;
  /**
   * How many enquiries went away again, by what sent them.
   *
   * Kept rather than worked out, because an enquiry that did not book leaves no
   * trace anywhere else: the bookings table holds only the ones that said yes,
   * which is the most flattering possible account of a stage business. It is
   * also the only way to read what money spent on being known actually bought.
   */
  turnedAway?: Partial<Record<string, number>>;
  /**
   * The same enquiries again, counted by which office they came from.
   *
   * `turnedAway` above buckets a refusal by its reason, which answers "what is
   * sending work away" and hides "who". Three of the ten offices in
   * `ENQUIRY_SHAPES` — the European agency's commercials, the Nordic
   * broadcaster's series, the streamer's documentaries, 26 of 101 in enquiry
   * weight — are refused at every room size this lot can build, on the rebate
   * arithmetic or on price. They ring every year and they always go to Budapest.
   *
   * That is the premise of the whole business working exactly as written, and it
   * was invisible: a player saw an anonymous tally of reasons and could not tell
   * a run of bad luck from three standing customers they are structurally unable
   * to serve. The stage the player can choose to build is the decision this
   * informs — it recovers one of the four, and no room recovers the other three.
   */
  rangAndWent?: Partial<Record<string, { times: number; because: string }>>;
}

// ---------------------------------------------------------------------------
// Standing with the state
// ---------------------------------------------------------------------------

/**
 * A register a company has to be on.
 *
 * Real bodies, named the way they are named. Fyrirtækjaskrá is the Icelandic
 * companies register, run by RSK, which is the tax authority — the same office
 * does both, which is why an Icelandic company has one number for everything.
 * That number is a kennitala, the same kind of national identifier a person
 * carries.
 */
export type RegistryId =
  | 'is_companies' | 'is_vat' | 'is_employer'
  | 'us_state' | 'us_ein';

export interface Registration {
  id: Id;
  saveId: Id;
  companyId: Id;
  registry: RegistryId;
  /** The number it was given. Shaped like the real thing, invented by SLATE. */
  number: string;
  since: Instant;
  /**
   * The date the register would next want something filed.
   *
   * Set once, from the cadence on the registry's own row, and never moved
   * again: the build has no filing, so it has no roll-forward either. One
   * screen prints the date and calls it what it is. Read it as a fact about
   * the body rather than as a deadline the engine keeps, because there is no
   * arrears, no fee and no consequence behind it.
   */
  nextDueAt?: Instant;
  /** How long the registry will wait for a filing fee the company cannot find. */
  graceUntil?: Instant;
  /**
   * Struck off, for not filing.
   *
   * Registrations only ever started. There was no clock in `world/company.ts` and
   * no `company.deregister`, so the engine never wrote this: the one writer in the
   * tree was a test setting it by hand to prove the filter above it worked.
   *
   * `runTheClock` writes it now. A registration carries `nextDueAt` and the
   * registry carries `filesEveryMonths` and a fee, and a filing that is never paid
   * for is a company that gets struck off — which for `is_companies` shuts `trade`,
   * the door everything else in the build hangs from. That is the correct weight
   * for it and the reason this was specified before it was attempted.
   *
   * Only the annual company-register filing can actually fail, because it is the
   * only one with a fee: VAT files every two months and the employer registration
   * every month, both at nought, so nothing about them can go wrong yet. Said
   * plainly rather than papered over with an invented cost.
   */
  endedAt?: Instant;
}

// ---------------------------------------------------------------------------
// Standing with the guilds
// ---------------------------------------------------------------------------

/**
 * A union or guild a company can be signatory to.
 *
 * The American four are the ones that decide whether you can hire an American
 * at all. The Icelandic two stand in for the collective agreements a company
 * employing Icelandic cast and crew is bound by — which work differently:
 * you do not sign up to them one production at a time, you are covered by
 * them because you employ people here.
 */
export type GuildId = 'sag_aftra' | 'wga' | 'dga' | 'iatse' | 'is_actors' | 'is_crew';

export interface Signature {
  id: Id;
  saveId: Id;
  companyId: Id;
  guild: GuildId;
  /** Which agreement, by its own name. */
  agreement: string;
  since: Instant;
  /**
   * What the deposit was is not stored, deliberately.
   *
   * It is real and it lands at the worst possible moment — a deposit against
   * cast salaries is wanted before you shoot, which is when a production has
   * spent everything and earned nothing — but the figure lives on the guild's
   * own row in `content/incorporation.ts`, which is what the screen prints and
   * what `company.sign` charges. A copy on the record would be a second answer
   * waiting to disagree with the first, and nothing ever read it.
   *
   * And below it: when the company stopped being signatory, which used to be
   * never.
   *
   * This said "a signature only ever starts" and that a guild pulling one was
   * "the day that rule starts to bite backwards on a cast already seated". That
   * day has come and the writer is `runTheClock`. The cause is not a renewal —
   * you are signatory until you breach, not until a year is up, and that part of
   * the old reasoning was right. **An agreement is with a legal entity, and a
   * struck-off entity is not one.** When the company comes off its companies
   * register, or the American arm comes off Delaware, every agreement that
   * company held ends with the registration.
   *
   * Every other breach this build might have used turned out to be unreachable,
   * and each was checked: a cast fee is paid the moment somebody is cast, so
   * nobody is ever owed one, and `feeFor` floors at collective scale, so nobody
   * is ever paid under a minimum. Inventing one would have invented the mechanic.
   *
   * It does bite backwards, and that is correct rather than regrettable:
   * `signedWith` goes false, `globalRuleOne` starts applying to Americans already
   * in seats, and `employ_americans` shuts. A company that has stopped existing
   * in Delaware cannot hold an American guild agreement, whoever is already cast.
   */
  endedAt?: Instant;
}

// A guild signature still has no clock of its own, and that stayed decided. Every
// other thing in this file that ends, ends on a date it already carried: an
// option's term, a policy's year, a registration's filing period. A signature
// carries a deposit and nothing else, because that is what it is — you are
// signatory until you breach, not until a year is up.
//
// What changed is that it now ends on somebody else's date. It has no term and it
// does not renew; it dies with the registration of the company that holds it,
// which is the one cause here that is a breach rather than an expiry. So the
// hazard this paragraph used to describe as waiting is live, and the field above
// says what it does when it fires.

// ---------------------------------------------------------------------------
// Cover
// ---------------------------------------------------------------------------

/**
 * A policy a company carries.
 *
 * Errors and omissions is the one worth knowing about: it covers being sued
 * over what is in the picture rather than what happened while making it, and
 * no distributor anywhere takes delivery without a certificate of it. An
 * underwriter will not issue one until a lawyer has read the chain of title,
 * which is how sloppy rights work finally surfaces — years late, at the only
 * moment it cannot be fixed quietly.
 */
export type PolicyKind =
  | 'general_liability' | 'workers_comp' | 'errors_omissions'
  | 'production_package' | 'property' | 'business_interruption';

export interface Policy {
  id: Id;
  saveId: Id;
  companyId: Id;
  kind: PolicyKind;
  insurer: string;
  /** What it pays out to, at most. */
  limitCents: Money;
  /**
   * What the premium was is not stored, for the reason the deposit is not.
   *
   * It was copied onto the record at binding and then read by nobody: the
   * screen prints `POLICY_BY_ID[kind].premiumCents` out of content and
   * `company.insure` charges the same figure out of content, so the copy was a
   * third voice in a conversation that already had two. The payment is in the
   * ledger, where a payment belongs.
   *
   * Worth saying plainly, because the doc this replaces said "what it costs a
   * year": the premium is charged once, on the day the cover is bound, and
   * never again. A year of cover is what the quote describes, not what the
   * engine bills.
   */
  boundAt: Instant;
  /**
   * The date the term written on the policy runs to.
   *
   * Twelve months out, because that is the term an underwriter writes, and the
   * day the premium is charged again. `runTheClock` reads it: if the company can
   * find the money the term rolls forward another year, and if it cannot the
   * cover goes into grace and then lapses, and the doors `insure_a_shoot` and
   * `greenlight` shut behind it.
   *
   * It was a date on the paper and not a thing that happened, which is why cover
   * bound in 2026 was still opening those doors in 2046 — measured, ten years of
   * it, in `docs/ARREARS.md`.
   */
  renewsAt: Instant;
  /**
   * How long the insurer will wait for a premium the company could not find.
   *
   * A month, set the first time a renewal cannot be paid, and the date is said
   * out loud in the notification so the shortfall is a thing a player can act on
   * rather than a thing that happened. Cleared the moment it is paid.
   *
   * It exists because the company is funded to the cent every day by the family:
   * a premium falling due on any day but the one the monthly wire lands on would
   * otherwise find a balance of nought and take the cover away for the sake of
   * eight thousand euros, which is not a decision anybody made.
   */
  graceUntil?: Instant;
  /**
   * When the cover stopped.
   *
   * This had no writer anywhere in the tree, which made `policiesOf`'s filter on
   * it the purest example in the file of a guard no reachable input could trip: a
   * policy entered `policiesOf` on the day it was bound and stayed there for the
   * life of the save, so cover bound in 2026 was still opening the
   * `insure_a_shoot` and `greenlight` doors in 2046.
   *
   * `runTheClock` writes it now, and only after the grace month has gone by
   * without the premium being found — so the cover goes when the company truly
   * cannot pay for it, which on a save with the sugar behind it means the family
   * has stopped covering.
   */
  lapsedAt?: Instant;
}

// ---------------------------------------------------------------------------
// Material
// ---------------------------------------------------------------------------

/** Where a story came from before it was yours. */
export type Provenance = 'original' | 'novel' | 'article' | 'play' | 'life_rights' | 'format';

/** What the company actually holds over it. */
export type Hold = 'option' | 'owned' | 'commissioned';

/**
 * A right the company holds over something it might make.
 *
 * `chainComplete` is the whole file in one boolean. Chain of title is the
 * unbroken paper trail proving the company owns what it is about to sell, and
 * a break in it is not a small problem: it stops the insurance, which stops
 * the delivery, which stops the money, long after everybody has been paid to
 * make the thing.
 */
export interface Holding {
  id: Id;
  saveId: Id;
  companyId: Id;
  title: string;
  provenance: Provenance;
  /**
   * What making this will ask of each department, on a scale of one to five.
   *
   * Set when the rights are taken and never revised, because it is a fact about the
   * material rather than about the company's plans for it. Read by
   * `world/schedule.ts` to lay a picture out, which is what finally gives
   * `Project.budgetCents` a writer after two teardowns with none.
   */
  demands: Demands;
  hold: Hold;
  acquiredAt: Instant;
  /**
   * The date an option's term runs to. Ownership carries none.
   *
   * It was what is written on the agreement and not a thing the build acted on:
   * an option whose date went by a decade ago was still in `holdingsOf`, still
   * opened `own_material`, `deliver` and `greenlight`, and `company.develop`
   * would still stamp a brand-new project `optioned` off it.
   *
   * `runTheClock` reads it now, and the greenlight beats it — committing to a
   * picture exercises the option and turns the hold into ownership, which is what
   * a producer does with the money. So the mistake the ledger entry named is a
   * mistake a player can now make: option something, sit on it for eighteen
   * months without saying yes, and the rights go back.
   */
  expiresAt?: Instant;
  /**
   * When the term ran out, on an option nobody exercised.
   *
   * Set by `runTheClock` and filtered by `holdingsOf`, so the record stays in the
   * save — a thing the company used to hold is part of its history — while the
   * company stops holding it.
   */
  lapsedAt?: Instant;
  /**
   * What was paid for it, and what exercising would cost, are not stored.
   *
   * Both arrived on the payload, both were charged at the moment the hold was
   * taken, and both then sat on the record with nothing that ever looked. There
   * is no `company.exercise` to read a purchase price and no screen that prints
   * an option fee, so the two figures were a price list for a shop with no
   * door. The charge is in the ledger, where a payment belongs.
   */
  chainComplete: boolean;
  /** What is missing from the chain, where anything is. */
  chainGap?: string;
}

// ---------------------------------------------------------------------------
// People, as the company sees them
// ---------------------------------------------------------------------------

/**
 * A post at the company.
 *
 * Not everybody who works on a picture — those are hired per production and
 * gone again. These are the handful of people a production company carries
 * between projects, which is the real definition of what a production company
 * is: the group that stays when nothing is shooting.
 */
export type RoleId =
  | 'principal' | 'development' | 'production' | 'business_affairs'
  | 'accountant' | 'facility';

/**
 * The posts at the sugar group, which are not the posts at a film company.
 *
 * A head of development and a production accountant are not jobs at a cane
 * mill, and giving the group the film roles to avoid widening this union would
 * have made the one screen that says who runs the business say something false
 * about it. Two unions and one `Post` shape: the record is the same thing in
 * both companies, and only the list of what a seat can be differs.
 */
export type GroupRoleId =
  | 'chair' | 'board' | 'managing' | 'agronomy' | 'milling' | 'trade' | 'finance';

export type PostRole = RoleId | GroupRoleId;

export interface Post {
  id: Id;
  saveId: Id;
  companyId: Id;
  role: PostRole;
  /** Empty where the post exists and nobody is in it. */
  personId?: Id;
  /**
   * What the post costs a month is not stored, and is not charged either.
   *
   * The rate was copied here from `ROLE_BY_ID` at boot and at every hire, and
   * then read by nobody — both screens that print a monthly figure print it
   * out of content. So the copy went, on the same argument as the guild
   * deposit and the option fee above it.
   *
   * The larger fact the copy was standing in front of: `world/company.ts` has
   * no clock, so a filled post is never charged at all — not once, not
   * monthly. Filling development, production, business affairs and the
   * accountant on the first morning quotes EUR 38,000 a month, which over five
   * played years is EUR 2,280,000 by the words. Measured paired against the
   * same three seeds with the posts left empty, the company account ends on
   * the same cent, and the ledger carries nought lines naming any post.
   *
   * So filling a post is free, and free is why it is never a decision.
   * Charging for it wants a monthly tick, which is a larger thing than a
   * field, and it is the owner's to call: the rate is quoted on two screens
   * and it should go on being quoted, because a rate is a fact about the job.
   */
  filledAt?: Instant;
}

// ---------------------------------------------------------------------------
// The slate
// ---------------------------------------------------------------------------

/**
 * How far along something is.
 *
 * The order is the real order and the attrition is the real attrition: most
 * things die between `optioned` and `packaged`, and a company with one project
 * has no slate, it has a hope.
 */
/**
 * Where a picture is in its life.
 *
 * It used to stop at `greenlit`, which is the point where a project becomes
 * interesting rather than the point where it ends. Everything expensive and
 * everything that can go wrong happens in the four stages after it, and
 * `delivered` is the one that actually kills productions: a picture can be
 * shot, cut, finished and still not paid for, because one element on a
 * contractual list is missing.
 */
export type Stage =
  | 'idea' | 'optioned' | 'writing' | 'draft' | 'packaged' | 'greenlit'
  | 'prep' | 'shooting' | 'post' | 'delivered'
  | 'shelved';

/** The stages a greenlit picture moves through, in order. */
export const MAKING: readonly Stage[] = ['prep', 'shooting', 'post', 'delivered'];

/**
 * One deliverable part of a title: a feature, or one episode of a season.
 *
 * It carries its own maturity because parts do not finish together. On a block
 * shoot episode one is locked while episode six is a stringout, and the season
 * is neither of those numbers — it is the runtime-weighted blend of all eight,
 * held down by whichever dimension is worst.
 */
export interface Part {
  id: Id;
  /** Which one it is, counting from one. */
  ordinal: number;
  /** Seconds of finished screen time it owes. */
  seconds: number;
  /** How far each dimension has come, by rung id. Absent means the bottom. */
  maturity?: Partial<Record<string, string>>;
  /**
   * Seconds of this part the cutting room has to make again.
   *
   * What a regression actually costs, held where the regression happened. A
   * note that sends one episode back a rung is a fraction of that episode owed
   * to the room again; a withdrawn consent that sends it back to the assembly
   * is the whole of it. The room pays this down before it cuts anything new,
   * at the rate it runs at with the hands it has, which is why the same note is
   * absorbed by a room with slack and fatal to a room already short of its date.
   */
  recut?: number;
}

/**
 * What a thing is, before anybody writes it.
 *
 * Three answers and none of them decoration: the engine decides what the thing can
 * be made as, the ensemble is checked against what that engine needs to run, and the
 * world is where the unit works out of. Tone is deliberately absent — the craft
 * counts it as a component of an engine rather than a fourth choice, so it lives on
 * the engine row in `content/concept.ts`.
 */
export interface Concept {
  /** The story engine, by id from `content/concept.ts`. */
  engineId: string;
  /**
   * Where it is set, as a city id.
   *
   * Read by the greenlight: the unit works out of this city rather than out of the
   * lot's own town, which is what `unitBaseId` always used to be because nothing
   * else ever wrote it.
   */
  worldId: string;
  /**
   * How many people the show turns on.
   *
   * Television runs on a web of characters rather than one lead, and each engine
   * declares the smallest ensemble it can run on. Checked at the greenlight.
   */
  people: number;
  /** When it was conceived. */
  at: Instant;
}

export interface Project {
  id: Id;
  saveId: Id;
  companyId: Id;
  title: string;
  medium: 'film' | 'television';
  stage: Stage;
  /**
   * What this is, before anybody writes it.
   *
   * The first thing in the real process and the last thing this build acquired. A
   * picture used to go from a title straight to a runtime, which is why its parts
   * are called `Lead 1` and `Support 2` — there was nothing to lift them off.
   *
   * Optional because a film can be made without one, and required for television by
   * `whyNotMakeAs`: a series is a machine that makes episodes, and a television
   * premise with no engine under it is refused rather than made badly.
   */
  concept?: Concept;
  /** The right this hangs off, where the company holds one. */
  holdingId?: Id;
  startedAt: Instant;
  /** Development money spent on it so far, which is gone either way. */
  spentCents: Money;
  /** What making it is reckoned to cost, once anybody has reckoned. */
  budgetCents?: Money;
  shelvedAt?: Instant;

  // --- The dated life, once it is greenlit ---------------------------------
  // Empty until then. A picture that has not been greenlit has no dates and
  // saying otherwise would be a schedule nobody has agreed to.

  /** How it is being made, by plan id. Set at the greenlight and not before. */
  planId?: string;
  /**
   * Which ladder set its maturity is measured against, from the plan.
   *
   * Stored rather than looked up through the plan every time, because a plan's
   * ladders could be revised and a picture already in flight should keep
   * being measured against the ladder it was started on.
   */
  ladders?: string;
  /**
   * What this owes, part by part, each with its own maturity.
   *
   * A feature is one part. A season is eight, at eight different rungs, and
   * that is not a detail — it is what a season *is*. Holding one maturity
   * vector for a whole season would say episode six is as finished as episode
   * one, which is never true of anything made in blocks.
   *
   * Every figure anybody reads about progress is recomputed from these and
   * weighted by runtime. There is deliberately no percentage stored anywhere.
   */
  parts?: Part[];
  /**
   * Seconds of finished screen time this owes in total.
   *
   * The engine's native measure. Pages, shooting days, approved shots and cut
   * minutes are all conversions into it, because they have to be: a page is
   * about a minute, an animation shot is four or five seconds, and an engine
   * that counts in any one of them can only make one kind of thing. Stored
   * rather than summed from the parts so that a contracted slot and what the
   * cut currently runs to can differ, which is the ordinary state of a picture
   * on its way from a long assembly down to its release length.
   */
  owesSeconds?: number;
  /**
   * The periods whose money has gone out and whose elements are handed over.
   *
   * Settling is not idempotent on its own — it posts an expense and pushes
   * delivery elements — and once periods run alongside each other there is more
   * than one route to the same one: the boundary of the period declared after
   * it, and the tick at the end of the work. Recording which have settled is
   * the minimum fact that stops a picture spending its budget twice, which is
   * what happened before the guard, to the tune of ninety-six per cent over.
   */
  settled?: string[];
  /**
   * The inventory ledger: material acquired and not yet on the timeline.
   *
   * Counted by stock, cumulative, and never decremented — placing a second of
   * material on the timeline does not un-acquire it, and the thing that makes
   * the shooting ratio meaningful is precisely that most of what was banked is
   * never used. The ratio is this against the runtime owed, derived every time
   * anybody asks.
   */
  banked?: Partial<Record<string, number>>;
  /**
   * How many hands the cutting room has, where that has been decided.
   *
   * The plan's figure is a default, not a rule. Money buys capacity, capacity
   * buys progress at a rate, and money never buys progress directly — so the
   * number of editors is the decision that sits between a budget and a
   * delivery date, and under-resourcing it is how a season misses air. It is
   * taken once, on the greenlight form, priced beside the number it sets, and
   * no later week reopens it.
   */
  hands?: number;
  /**
   * Finished seconds the cutting room has produced, cumulative.
   *
   * The output side of the second ledger, and the only part of the cut that
   * cannot be derived: it depends on how many hands the room was given at the
   * greenlight, which is the last moment anybody sets that number. Parts reach
   * the rung the cut takes them to, in order, as this covers their runtime.
   */
  cut?: number;
  /**
   * Whether the last weekly look said the cut would miss the date.
   *
   * Stored because it is the only part of the forecast that is not derivable —
   * whether anybody has been told yet. The forecast itself is recomputed from
   * the ledger every time it is asked for, and a stored copy of it would drift
   * from the thing it claims to describe within a week.
   */
  shortOfTheDate?: boolean;
  /** The city the unit works out of. */
  unitBaseId?: string;
  /**
   * The schedule, period by period, with real dates on it.
   *
   * The one source of truth for when anything happens. It is a list and not a
   * set of named fields because the periods themselves are a list: an animated
   * picture has no prep and a documentary has no wrap, and a schedule with
   * `shootFrom` carved into it could never hold either. Whatever the plan says
   * its periods are, this is those periods with dates.
   */
  periods?: { id: string; from: Instant; to: Instant }[];
  /** The date the delivery is contractually due. Missing it has a cost. */
  deliverBy?: Instant;
  /** The stage on the lot it is holding, where it holds one. */
  stageId?: Id;
  /** The booking that holds it, so the lot and the picture agree. */
  bookingId?: Id;
  /** Elements handed over, by id. The money waits on the whole list. */
  delivered: string[];
  deliveredAt?: Instant;

  /**
   * Who is on it, by post, with the dates they are on it for.
   *
   * Empty until the picture starts hiring, and filled over the weeks rather
   * than at once, because a unit production manager comes on ten weeks before
   * the camera turns over and a boom operator comes on one. The person is a
   * reference rather than a copy: they exist in their own right afterward, and
   * the next picture can hire them again.
   *
   * What they are paid is not here. That is the engagement and the deal, which
   * covers cast and crew in one record.
   */
  crew?: { postId: string; personId: Id; from: Instant; to: Instant }[];

  /**
   * The parts, as parts rather than as people.
   *
   * Laid out at the greenlight from the plan and the runtime, because that is
   * when a picture first knows how much of itself there is to be in. A role
   * exists whether or not anybody is ever cast in it, and an uncast lead on a
   * picture in its last week of prep is the most expensive object in this file.
   */
  roles?: Role[];
  /**
   * Who is in them, and on what terms.
   *
   * Separate from the roles rather than a field on one, for the same reason
   * the crew is separate from the posts: the role is a fact about the picture
   * and the engagement is a fact about a person and a picture together. A
   * recast writes a second seat and leaves the first standing, because the
   * money on the first is still owed.
   */
  cast?: Seat[];
  /**
   * The twelve on a format season's cast board.
   *
   * A separate list from `cast` above, and it has to be, because the two are not
   * the same act. A seat is somebody in a written part, engaged for the dates the
   * part shoots and paid for that part. A contributor is engaged for the season,
   * has no part to play, and cannot be recast — you do not replace the person
   * whose story episode four turned out to be.
   *
   * `content/making.ts` warned against a boolean here for exactly this reason and
   * the warning still stands. What changed is that the plan's `cast` field is a
   * union, which was the design anticipating this, so the format season says
   * `'contributors'` and the performer machinery stays switched off: no role is
   * laid, no audition is armed, and the player is never offered a slot. Being on
   * a format's cast board is a job and it is not the job this game is about.
   */
  contributors?: Contributor[];
  /**
   * Whoever has been seen for the board, by id.
   *
   * The pool, kept on the picture rather than made fresh each time anybody looks,
   * for the reason `Role.seen` is: a screen that regenerated the people it was
   * about every render would be a screen nobody could choose from.
   */
  seenForBoard?: Id[];

  // --- The life after delivery ---------------------------------------------
  // Empty until somebody buys it. A picture nobody has bought is an asset with
  // no price, and saying otherwise would be inventing a market.

  /** How it was sold, by deal id. */
  dealId?: string;
  soldAt?: Instant;
  releasedAt?: Instant;
  /**
   * What it is reckoned to take across ten years, all in, for what it cost and
   * the way it is being released. Decided once at the sale and not revised,
   * because a figure that moved every time somebody looked at it would be a
   * number nobody could plan against.
   */
  takeCents?: Money;
  /**
   * Which windows have paid, by id.
   *
   * The only thing stored about the money. Everything else — gross to date,
   * what each tier took, what the company has seen — is recomputed from this
   * and the deal, so a recoupment figure can never drift from the receipts
   * that produced it.
   */
  windowsPaid?: string[];

  // --- What the state gives back -------------------------------------------

  /**
   * The reimbursement claim, once the picture has applied for one.
   *
   * Absent on a picture that never applied, which is the ordinary state of a
   * picture whose producer forgot. The application closes on the first day of
   * photography, so this field can only ever be written before the shoot and
   * can never be written afterwards.
   */
  rebate?: Claim;

  /**
   * Of everything this picture has spent, what was not spent in Iceland.
   *
   * Counted as it goes rather than worked out afterwards, because the two
   * things in it are not recoverable from a total: the flights that brought
   * somebody here, and a penalty, which is money gone without being spend at
   * all. Both come off the figure an auditor would certify, and neither leaves
   * a trace in `spentCents` that says which it was.
   */
  notSpentHereCents?: Money;
}

/**
 * A production's claim on the Icelandic reimbursement.
 *
 * The rate is stamped at the application and not recomputed at payment, the
 * way the real thing works: you are told which tier you are on when the
 * ministry accepts the file, and a picture that shrinks afterwards has already
 * been told. That stamp is the whole reason the higher tier is worth aiming at
 * before a shoot instead of hoping for one after it.
 */
export interface Claim {
  appliedAt: Instant;
  /** The share of certified spend this picture was accepted at. */
  shareAt: number;
  /** What an auditor certified as Icelandic spend, once one has. */
  certifiedCents?: Money;
  /** What the state actually paid, and when it landed. */
  paidCents?: Money;
  paidAt?: Instant;
}

// ---------------------------------------------------------------------------
// The cast
// ---------------------------------------------------------------------------

/**
 * One part, as written.
 *
 * Fields and no prose, which is the research's own rule for this record: the
 * breakdown paragraph an agent reads is generated from these, and nothing
 * further down the pipeline reads free text. A role that needed a sentence to
 * explain it would be a role the engine could not price, schedule or cast.
 */
export interface Role {
  id: Id;
  /** Which one it is on the picture, counting from one. */
  ordinal: number;
  /** The character. */
  name: string;
  /** How big it is, by `content/casting.ts` size id. */
  size: string;
  /**
   * The part it belongs to, where it belongs to one.
   *
   * Absent means the whole title, which is what a lead and a regular are. The
   * difference between those two words and this one is eight episodes of
   * money.
   */
  partId?: Id;
  /** What the picture has set aside for it, before anybody argues. */
  bandCents: Money;
  /**
   * What this particular part needs, by axis id, three numbers coming to three.
   *
   * Laid at the greenlight and stored rather than derived, because it is a fact
   * about how the part was written and not about how big it is: two leads on
   * the same picture can be a coverage problem and a face in a window, and a
   * figure recomputed from the size every time would say they were the same
   * buy. It is what stops the best performer for every part in the save being the
   * same weighted sum.
   */
  wants?: Partial<Record<string, number>>;
  /**
   * Who came in for it, and how far anybody has got with them.
   *
   * Absent until somebody puts the part out, which is a dated act and not a
   * list that appears: the people on it exist because the part was advertised,
   * and they go on existing afterwards whether or not any of them got it. That
   * is also why it is stored rather than worked out on demand — a pile of
   * submissions recomputed every time a screen was drawn would be a different
   * pile every time, and choosing between four strangers who keep changing is
   * not a decision.
   */
  seen?: Looked[];
}

/**
 * One person the company has looked at for one part.
 *
 * The rounds are stored and what the company believes is not, which is the
 * whole shape of it: a belief recomputed from the rounds every time anybody
 * asks can never drift from what was actually done to earn it, and a stored
 * belief would be a number that outlived its reason. What the company sees is a
 * fixed distance from the truth, and the rounds are what shortens the distance.
 */
export interface Looked {
  personId: Id;
  /**
   * Rounds done, in the order they were done, by `content/casting.ts` id.
   *
   * Absent means the pile — a headshot and a credit list and nothing else,
   * which is a state with real numbers rather than an empty one.
   */
  rounds?: string[];
  /**
   * The axis the last note was given on, where one was.
   *
   * A session is one note and a note is one axis. Held here rather than beside
   * the round because it is the last one that counts: you do not accumulate
   * notes, you give the one you have and find out what it bought.
   */
  note?: string;
}

/**
 * Somebody engaged in a role, on terms.
 *
 * Three facts that are routinely confused for one: what was agreed, whether it
 * is owed regardless, and whether they were ever used. Pay or play is the
 * second of those and only the second — actors are paid and cut out of the
 * picture often enough that collapsing them would make a whole category of
 * real disaster unrepresentable.
 */
/**
 * Somebody on a format season's cast board.
 *
 * Deliberately thinner than a `Seat`, and every field it does not have is a
 * statement. There is no `roleId`, because there is no part — what a contributor
 * is on the season is themselves. There is no `releasedAt`, because a season does
 * not recast a contributor: the episodes are made of what happened to the people
 * who were there, so letting one go is not a cast change, it is a different
 * season. And there is no fee of its own, because the cast board is already paid
 * for — the format plan's casting period spends twelve percent of the budget and
 * charging a contributor on top would be charging the same money twice.
 */
export interface Contributor {
  personId: Id;
  chosenAt: Instant;
}

export interface Seat {
  roleId: Id;
  personId: Id;
  /** What was agreed, in cents. */
  feeCents: Money;
  castAt: Instant;
  /**
   * When they were let go, where they were. The fee stays owed.
   *
   * There is no flag beside this saying whether the engagement was pay or play,
   * because every engagement in this build is: the money goes out when somebody
   * says yes and letting them go afterwards never gets it back. A field
   * distinguishing the two would be a field with one value, which is the
   * shortest possible way to imply a choice nobody is offered.
   */
  releasedAt?: Instant;
}
