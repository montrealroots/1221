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
 * of the rule — so the first time this family wants an American actor, an
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
  dissolvedAt?: Instant;
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
  /** When the next filing is due, where the register wants one. */
  nextDueAt?: Instant;
  /** Struck off, surrendered, or lapsed. */
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
   * Cash the guild holds against what you will owe.
   *
   * Real, and it lands at the worst possible moment: a deposit against cast
   * salaries is wanted before you shoot, which is when a production has spent
   * everything and earned nothing.
   */
  depositCents: Money;
  endedAt?: Instant;
}

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
  /** What it costs a year. */
  premiumCents: Money;
  boundAt: Instant;
  renewsAt: Instant;
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
  hold: Hold;
  acquiredAt: Instant;
  /** An option runs out. Ownership does not. */
  expiresAt?: Instant;
  optionFeeCents?: Money;
  /** What exercising the option would cost. */
  purchasePriceCents?: Money;
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

export interface Post {
  id: Id;
  saveId: Id;
  companyId: Id;
  role: RoleId;
  /** Empty where the post exists and nobody is in it. */
  personId?: Id;
  filledAt?: Instant;
  /** What the post costs the company a month. */
  monthlyCents: Money;
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

export interface Project {
  id: Id;
  saveId: Id;
  companyId: Id;
  title: string;
  medium: 'film' | 'television';
  stage: Stage;
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
   * How far each dimension has come, by rung id. Absent means the bottom.
   *
   * Six strings, and every figure anybody reads about progress is recomputed
   * from them. There is deliberately no percentage stored anywhere: "how far
   * along is this" is a question with six answers whose minimum is the only
   * honest single one.
   */
  maturity?: Partial<Record<string, string>>;
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
}
