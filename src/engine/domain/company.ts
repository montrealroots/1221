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
export type Stage = 'idea' | 'optioned' | 'writing' | 'draft' | 'packaged' | 'greenlit' | 'shelved';

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
}
