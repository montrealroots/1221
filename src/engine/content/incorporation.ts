/**
 * SLATE — what the world charges to let a company exist.
 *
 * Real bodies, real forms, real mechanisms. Where a figure is a published
 * statutory number it is given as one and said to be one. Where it is a range
 * a person would quote you, it is SLATE's own and says so, because a game that
 * prints an invented number in the same voice as a legislated one is teaching
 * somebody something untrue.
 *
 * Two jurisdictions, because this family lives in one and works in the other.
 * Nothing here is advice and none of it is current: tax rates move, guild
 * minimums are renegotiated every three years, and the Icelandic production
 * rebate has been raised at least once. The shapes are right; treat every
 * figure as of its stated year.
 */

import type { CompanyForm, GuildId, Jurisdiction, PolicyKind, RegistryId, RoleId } from '../domain/company';
import type { Money } from '../core/money';

/**
 * Cents, so the ledger and this file never disagree about scale.
 *
 * Not króna, whatever the Icelandic figures below suggest. SLATE keeps one
 * base currency and converts for display; a figure here is a figure in that
 * base, and calling the helper `kr` would have quietly taught that the company
 * banks in króna when it does not.
 */
const cents = (amount: number): Money => Math.round(amount * 100);

// ---------------------------------------------------------------------------
// Forms
// ---------------------------------------------------------------------------

export interface FormFacts {
  id: CompanyForm;
  jurisdiction: Jurisdiction;
  /** The suffix a contract carries. */
  suffix: string;
  /** The world's word for it, Title Case. */
  label: string;
  what: string;
  /** Minimum share capital, where the law sets one. */
  minimumCapital?: Money;
  /** What forming it costs, roughly, in the local currency. SLATE's own. */
  formationCost: Money;
  /** Why you would pick this one. */
  suits: string;
}

export const FORMS: readonly FormFacts[] = [
  {
    id: 'ehf', jurisdiction: 'is', suffix: 'ehf.', label: 'Private Limited Company',
    what: 'Einkahlutafélag — the ordinary Icelandic limited company, and what almost every '
      + 'business in the country is. Liability stops at the company, one shareholder is enough, '
      + 'and the board can be a single person.',
    minimumCapital: cents(500_000),
    formationCost: cents(130_000),
    suits: 'A family company that owns land and intends to make things on it.',
  },
  {
    id: 'hf', jurisdiction: 'is', suffix: 'hf.', label: 'Public Limited Company',
    what: 'Hlutafélag — the public limited company. Far more share capital, a real board, '
      + 'audited accounts as a matter of course, and the form a company takes when outside money '
      + 'comes in at scale.',
    minimumCapital: cents(4_000_000),
    formationCost: cents(400_000),
    suits: 'Raising money from people who aren’t family.',
  },
  {
    id: 'llc', jurisdiction: 'us', suffix: 'LLC', label: 'Limited Liability Company',
    what: 'The American workhorse. Cheap, fast, no share capital requirement, and the form '
      + 'almost every single-picture production entity in the United States is formed in.',
    formationCost: cents(1_200),
    suits: 'An American arm that exists to sign agreements and hold a picture.',
  },
  {
    id: 'inc', jurisdiction: 'us', suffix: 'Inc.', label: 'Corporation',
    what: 'The American corporation. More formality than an LLC, and the form investors expect '
      + 'when they’re buying stock, not lending.',
    formationCost: cents(1_800),
    suits: 'An American arm that will take outside investment.',
  },
];

export const FORM_BY_ID: Readonly<Record<CompanyForm, FormFacts>> =
  Object.fromEntries(FORMS.map((one) => [one.id, one])) as Record<CompanyForm, FormFacts>;

// ---------------------------------------------------------------------------
// Registers
// ---------------------------------------------------------------------------

export interface RegistryFacts {
  id: RegistryId;
  jurisdiction: Jurisdiction;
  /** The body's own name. */
  body: string;
  /** The world's word for what you get, Title Case. */
  label: string;
  what: string;
  why: string;
  /** What it costs to get on it. SLATE's own where not published. */
  cost: Money;
  /** Whether the company must be on it to trade at all. */
  required: boolean;
  /** How often it wants something filed, in months. Nought for never. */
  filesEveryMonths: number;
}

export const REGISTRIES: readonly RegistryFacts[] = [
  {
    id: 'is_companies', jurisdiction: 'is',
    body: 'Fyrirtækjaskrá', label: 'The Company Register',
    what: 'The Icelandic register of companies. RSK keeps it, and RSK is also the tax office, so one '
      + 'filing does both jobs and one number follows the company everywhere.',
    why: 'Without it there’s no company, and everything else on this page needs a company first.',
    cost: cents(130_000), required: true, filesEveryMonths: 12,
  },
  {
    id: 'is_vat', jurisdiction: 'is',
    body: 'Skatturinn', label: 'The VAT Number',
    what: 'Registration for virðisaukaskattur. Iceland’s standard rate is 24 percent, and a '
      + 'registered company charges it on what it sells and reclaims it on what it buys.',
    why: 'A production buys enormously and sells rarely, so the reclaim isn’t a formality — '
      + 'it’s a fifth of the spend coming back.',
    cost: 0, required: true, filesEveryMonths: 2,
  },
  {
    id: 'is_employer', jurisdiction: 'is',
    body: 'Skatturinn', label: 'The Employer Registration',
    what: 'Standing to employ people: withholding income tax at source, paying the mandatory '
      + 'pension contribution, and remitting union dues.',
    why: 'Nobody can be paid a wage by this company until it exists.',
    cost: 0, required: false, filesEveryMonths: 1,
  },
  {
    id: 'us_state', jurisdiction: 'us',
    body: 'Delaware Division of Corporations', label: 'The American Filing',
    what: 'Formation of the American arm. Delaware because that’s where the paperwork is '
      + 'understood by everybody who will read it, not because anybody works there.',
    why: 'An American guild signs with an American company. This is that company.',
    cost: cents(1_200), required: false, filesEveryMonths: 12,
  },
  {
    id: 'us_ein', jurisdiction: 'us',
    body: 'Internal Revenue Service', label: 'The Employer Number',
    what: 'A federal Employer Identification Number for the American arm. Free, and the thing '
      + 'every American counterparty asks for before they’ll send money.',
    why: 'No American bank account, payroll or guild deposit without one.',
    cost: 0, required: false, filesEveryMonths: 12,
  },
];

export const REGISTRY_BY_ID: Readonly<Record<RegistryId, RegistryFacts>> =
  Object.fromEntries(REGISTRIES.map((one) => [one.id, one])) as Record<RegistryId, RegistryFacts>;

// ---------------------------------------------------------------------------
// Money in from the state
// ---------------------------------------------------------------------------

/**
 * Iceland's production reimbursement, which is why anybody shoots there.
 *
 * The mechanism is the thing to understand rather than the percentage. You
 * apply BEFORE you shoot, you spend, an Icelandic auditor certifies what you
 * spent in Iceland, and the state pays a share of it back afterwards. Because
 * it arrives afterwards, productions borrow against it, which is a whole
 * industry of its own.
 *
 * The rate has been raised at least once from twenty-five percent and there is
 * a higher tier attached to conditions about the size and shape of the
 * production. SLATE uses the lower figure and says so rather than printing a
 * number it cannot stand behind.
 */
export const REBATE = {
  body: 'Atvinnuvega- og nýsköpunarráðuneytið',
  label: 'The Production Reimbursement',
  /** Every qualifying feature, series and documentary. No minimum spend, no cap. */
  share: 0.25,
  /** The higher tier, and the three conditions a production has to meet for it. */
  higherShare: 0.35,
  higherNeeds: {
    /** Icelandic spend, in króna. */
    spendIsk: 350_000_000,
    /** Working days in Iceland, of which some must be shooting days. */
    workingDays: 30,
    shootingDays: 10,
    /** Crew working directly on it, and for how long, taxed in Iceland. */
    crew: 50,
    crewDays: 50,
  },
  /** Applied for before a foot of film is shot, or not at all. */
  appliedBefore: true,
  auditedBy: 'An Icelandic auditor, at the production’s cost',
  /** Roughly how long after delivery the money lands. SLATE's own. */
  paidAfterMonths: 6,
  note: 'Both rates are the published ones. The higher tier also applies with no conditions at all to '
    + 'work made for audiences of eighteen and under.',
  /**
   * The date the whole thing is legislated to stop.
   *
   * Not a detail: every business case in Iceland that turns on this rate is
   * priced against a scheme with an end date on it, and a review is already
   * running. A lot built on the rebate is built on a law that expires.
   */
  endsOn: { year: 2028, month: 12, day: 31 },
} as const;

/** Corporate income tax on an Icelandic private limited company. */
export const CORPORATION_TAX = 0.20;
export const VAT_RATE = 0.24;

// ---------------------------------------------------------------------------
// The guilds
// ---------------------------------------------------------------------------

export interface GuildFacts {
  id: GuildId;
  jurisdiction: Jurisdiction;
  /** The body's own name. */
  body: string;
  label: string;
  covers: string;
  what: string;
  /** What signing binds you to, forever. */
  binds: string;
  /**
   * Cash the guild holds before you shoot. SLATE's own: a real deposit is set
   * against the actual cast salaries of an actual production, and there isn't
   * one of those yet.
   */
  depositCents: Money;
  /** The agreement a company this size would sign. */
  agreement: string;
  /** True where you sign per company; false where coverage is automatic. */
  signable: boolean;
}

export const GUILDS: readonly GuildFacts[] = [
  {
    id: 'sag_aftra', jurisdiction: 'us',
    body: 'SAG-AFTRA', label: 'The Screen Actors Guild',
    covers: 'Actors',
    what: 'You don’t join as a producer — you sign a specific agreement and become bound by it. '
      + 'There’s a ladder of them by budget, from the ultra low budget agreement up to the basic '
      + 'theatrical, and which rung you’re on decides the minimums and the conditions.',
    binds: 'Minimums, pension and health contributions on every salary, and residuals for as long as '
      + 'the picture is used. That means for the life of the copyright.',
    depositCents: cents(25_000), agreement: 'Low Budget Agreement', signable: true,
  },
  {
    id: 'wga', jurisdiction: 'us',
    body: 'Writers Guild of America', label: 'The Writers Guild',
    covers: 'Writers',
    what: 'Signing binds the company to the minimum basic agreement for anybody it employs to '
      + 'write. It also hands the writing credit to the guild to determine, not to you.',
    binds: 'Minimums, contributions, residuals, and arbitration of who is credited.',
    depositCents: cents(10_000), agreement: 'Minimum Basic Agreement', signable: true,
  },
  {
    id: 'dga', jurisdiction: 'us',
    body: 'Directors Guild of America', label: 'The Directors Guild',
    covers: 'Directors and their teams',
    what: 'Covers the director, the assistant directors and the unit production manager, and '
      + 'carries conditions about creative rights that no other agreement does.',
    binds: 'Minimums, contributions, residuals, and the director’s cut.',
    depositCents: cents(15_000), agreement: 'Basic Agreement', signable: true,
  },
  {
    id: 'iatse', jurisdiction: 'us',
    body: 'IATSE', label: 'The Crew Union',
    covers: 'Below-the-line crew',
    what: 'The union most American crew belong to. Signing decides whether you can crew an '
      + 'American shoot at all.',
    binds: 'Rates, hours, turnaround, meal penalties and contributions.',
    depositCents: cents(20_000), agreement: 'Area Standards Agreement', signable: true,
  },
  {
    id: 'is_actors', jurisdiction: 'is',
    body: 'Félag íslenskra leikara', label: 'The Icelandic Actors',
    covers: 'Icelandic actors',
    what: 'Icelandic employment doesn’t work by signing up one production at a time. A company '
      + 'employing people here is covered by the collective agreements — kjarasamningar — because '
      + 'it employs people here, and those set the floor whatever anybody signs.',
    binds: 'The collective floor, holiday pay, and the mandatory pension contribution.',
    depositCents: 0, agreement: 'Kjarasamningur', signable: false,
  },
  {
    id: 'is_crew', jurisdiction: 'is',
    body: 'Icelandic trade unions', label: 'The Icelandic Crew',
    covers: 'Icelandic crew',
    what: 'Crew here belong to ordinary trade unions, not a film-specific one. The electrical trades '
      + 'union covers a great deal of a set. The same collective agreements apply.',
    binds: 'The collective floor, working time, and contributions.',
    depositCents: 0, agreement: 'Kjarasamningur', signable: false,
  },
];

export const GUILD_BY_ID: Readonly<Record<GuildId, GuildFacts>> =
  Object.fromEntries(GUILDS.map((one) => [one.id, one])) as Record<GuildId, GuildFacts>;

/**
 * The rule that makes an American subsidiary unavoidable.
 *
 * A SAG-AFTRA member may not render services for a producer who has not signed
 * with SAG-AFTRA, anywhere in the world. It is called Global Rule One and it
 * is the reason an Icelandic company that wants one American performer has to
 * become, in part, an American company.
 */
export const GLOBAL_RULE_ONE =
  'A SAG-AFTRA member may not work for a producer who hasn’t signed with SAG-AFTRA — anywhere on '
  + 'earth. That’s what it’s for. An Icelandic company that wants one American performer has to '
  + 'become, in part, an American company first.';

// ---------------------------------------------------------------------------
// Cover
// ---------------------------------------------------------------------------

export interface PolicyFacts {
  id: PolicyKind;
  label: string;
  what: string;
  why: string;
  /** A year's cover at the level a company this size carries. SLATE's own. */
  limitCents: Money;
  premiumCents: Money;
  /** Whether a company carries it always, or only while shooting. */
  standing: boolean;
}

export const POLICIES: readonly PolicyFacts[] = [
  {
    id: 'general_liability', label: 'General Liability',
    what: 'Third-party injury and property damage. The policy every counterparty asks for a '
      + 'certificate of before they let you through the door.',
    why: 'No location or hire company will deal with a production that hasn’t got it.',
    limitCents: cents(2_000_000), premiumCents: cents(8_000), standing: true,
  },
  {
    id: 'workers_comp', label: 'Workers’ Compensation',
    what: 'Cover for people hurt at work. On a set that’s a live risk, not a theoretical one.',
    why: 'Employing anybody without it’s unlawful in every jurisdiction this company will work in.',
    limitCents: cents(1_000_000), premiumCents: cents(6_000), standing: true,
  },
  {
    id: 'errors_omissions', label: 'Errors And Omissions',
    what: 'Cover for being sued over what’s in the picture, not what happened making it: defamation, '
      + 'privacy, and infringing another person’s rights.',
    why: 'No distributor on earth takes delivery without a certificate. The underwriter won’t '
      + 'issue one until a lawyer has read the chain of title. That’s how a break in it finally '
      + 'surfaces: years late, at the one moment it can’t be fixed quietly.',
    limitCents: cents(3_000_000), premiumCents: cents(14_000), standing: false,
  },
  {
    id: 'production_package', label: 'The Production Package',
    what: 'The bundle a shoot carries: cast cover for when the lead falls ill, faulty stock and '
      + 'processing, props, sets and wardrobe, and third-party property damage.',
    why: 'A financier or a completion guarantor won’t let a foot of film be shot without it.',
    limitCents: cents(5_000_000), premiumCents: cents(30_000), standing: false,
  },
  {
    id: 'property', label: 'Property',
    what: 'The stages, the workshops, the offices and everything in them.',
    why: 'A company that owns its own lot is carrying a building risk that a company renting '
      + 'stages by the day never has to think about.',
    limitCents: cents(40_000_000), premiumCents: cents(60_000), standing: true,
  },
  {
    id: 'business_interruption', label: 'Business Interruption',
    what: 'What the lot would have earned in the months it couldn’t be used.',
    why: 'A burnt stage costs twice: once to rebuild and once in every booking that couldn’t happen.',
    limitCents: cents(10_000_000), premiumCents: cents(18_000), standing: true,
  },
];

export const POLICY_BY_ID: Readonly<Record<PolicyKind, PolicyFacts>> =
  Object.fromEntries(POLICIES.map((one) => [one.id, one])) as Record<PolicyKind, PolicyFacts>;

// ---------------------------------------------------------------------------
// The posts a company carries
// ---------------------------------------------------------------------------

export interface RoleFacts {
  id: RoleId;
  /** The world's word for the post, Title Case. */
  label: string;
  /**
   * The same post inside a sentence.
   *
   * Kept separately because half these labels carry their own article and half
   * don't, and interpolating "the" in front of "The Principal" produced "the
   * the principal" on screen.
   */
  said: string;
  what: string;
  /** What goes wrong when nobody is in it. */
  without: string;
  /** A month of it. SLATE's own. */
  monthlyCents: Money;
}

export const ROLES: readonly RoleFacts[] = [
  {
    id: 'principal', label: 'The Principal', said: 'the principal',
    what: 'Whoever the company answers to. Sets the slate, says yes and no, and signs.',
    without: 'Decisions stop getting made. That kills a company slower than getting them wrong.',
    monthlyCents: 0,
  },
  {
    id: 'development', label: 'Head Of Development', said: 'head of development',
    what: 'Finds material, reads everything, commissions writers and carries the slate.',
    without: 'The company has nothing to make, and finds that out slowly.',
    monthlyCents: cents(9_000),
  },
  {
    id: 'production', label: 'Head Of Production', said: 'head of production',
    what: 'Turns a script into a schedule, a budget and a crew, and keeps the shoot on both.',
    without: 'Anything greenlit gets greenlit on a guess.',
    monthlyCents: cents(11_000),
  },
  {
    id: 'business_affairs', label: 'Business Affairs', said: 'business affairs',
    what: 'Every agreement the company signs, and the chain of title behind everything it holds.',
    without: 'The rights are wrong and nobody finds out until the insurer reads them.',
    monthlyCents: cents(10_000),
  },
  {
    id: 'accountant', label: 'The Production Accountant', said: 'the production accountant',
    what: 'The chart of accounts, the cost report, payroll and the audit the rebate depends on.',
    without: 'The reimbursement can’t be certified. That’s a fifth of the spend gone.',
    monthlyCents: cents(8_000),
  },
  {
    id: 'facility', label: 'The Lot Manager', said: 'the lot manager',
    what: 'Keeps the stages standing, the bookings straight and the place safe to work in.',
    without: 'The lot degrades whether or not anybody is shooting on it.',
    monthlyCents: cents(7_000),
  },
];

export const ROLE_BY_ID: Readonly<Record<RoleId, RoleFacts>> =
  Object.fromEntries(ROLES.map((one) => [one.id, one])) as Record<RoleId, RoleFacts>;

/**
 * What everything above is, honestly.
 *
 * The bodies, the forms, the mechanisms and the order they happen in are real.
 * The money is not sourced: a formation fee, a premium and a deposit are all
 * quoted rather than legislated, and they move. Read the figures as SLATE's
 * own and the shapes as the world's.
 */
export const INCORPORATION_NOTE =
  'The bodies, the forms and the order of it are real: Fyrirtækjaskrá registers Icelandic '
  + 'companies, Global Rule One is why an Icelandic producer needs an American arm, and no '
  + 'distributor takes delivery without errors and omissions cover. The money is quoted rather '
  + 'than legislated — formation fees, premiums and deposits all move, and every figure here is '
  + 'SLATE’s own estimate, not a current price.';
