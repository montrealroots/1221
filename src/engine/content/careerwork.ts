/**
 * SLATE — the professional work an emerging actor can be seen for, its pay, the unions' terms, and the agreement an
 * agent offers (from 2026-10-20, the owner's brief 19; `docs/verification/career-2026-10-20/design.md`, The Work Loop and
 * The Agreement).
 *
 * Three kinds of statement, kept apart in every entry (the design's first section):
 * - **Verified**: a published rate or rule, with its source in `docs/research/career-2026-10-20/` (`work.md` for pay
 *   and the unions, `representation.md` for agency agreements), the source's id there, and the date it takes effect.
 * - **Assumption**: the game's stand-in where the sources are silent, marked `basis: 'assumption'` and said as one
 *   where a player reads it.
 * - **Fictional**: every project, company and casting office below. None is a real production, and nothing here says a
 *   real production is casting. A title that happens to match a real one is a coincidence: each says it's fictional.
 *
 * The projects are templates: the work system (`systems/projobs.ts`, built on this) makes each opportunity from one,
 * with its dates. Each names its medium, its genres (the game's genre ids, `content/genres.ts`), the role's size and
 * what it asks as a task profile (`content/tasks.ts`) with families and techniques, its union and contract, its
 * requirements, the stages it uses, its schedule's shape, and who can be put up for it: through an agent only, or open
 * to the actor's own submission as well.
 */

import type { Family } from './genres';
import type { Skill } from './school';
import type { PartSize } from './plays';

export type Basis = 'verified' | 'assumption';

/** Where a verified figure or rule comes from: the research file, the source's id in it, and its own words. */
export interface WorkSource {
  file: 'work.md' | 'representation.md' | 'yale.md';
  id: string;
  url: string;
  quote: string;
}

const W = 'work.md' as const;
const R = 'representation.md' as const;

// ---------------------------------------------------------------------------------------------------------------------
// Pay
// ---------------------------------------------------------------------------------------------------------------------

export type RateId = 'sag-tv-day' | 'sag-tv-week' | 'low-budget-day' | 'low-budget-week' | 'ultra-low-budget-day' | 'student-film' | 'lort-d' | 'lort-c' | 'lort-b' | 'off-broadway' | 'non-union-day';

export interface Rate {
  id: RateId;
  /** What the minimum is for, as a screen names it. */
  label: string;
  /** In US cents; absent where the pay is deferred. */
  amount?: number;
  per: 'day' | 'week';
  /** Deferred pay: shown as deferred, never posted (SAGindie's Student Film Agreement). */
  deferred?: true;
  /** From and to, `YYYY-MM-DD`, both days in it; absent `to`, until a later figure is published. */
  effective: { from: string; to?: string };
  basis: Basis;
  /** Verified: where it's published. */
  source?: WorkSource;
  /** An assumption's own words, as a player reads it. */
  words?: string;
}

const S30: WorkSource = { file: W, id: 'S30', url: 'https://amptp.org/wp-content/themes/amptp/assets/pdf/SAG-AFTRA/2026-30%20SAG-AFTRA%20Rates_2026-05-27%204931-9242-3576%20v.4.pdf', quote: 'Performer $1,246 $1,283 $1,321 $1,361 $1,402 (day); Performer $4,326 $4,456 (weekly)' };
const S32: WorkSource = { file: W, id: 'S32', url: 'https://www.sagindie.org/signatory/', quote: 'Actor salaries are deferred; UPA minimum rate for principal performers is set at 20% of Basic Agreement scale' };
const S33: WorkSource = { file: W, id: 'S33', url: 'http://www.sagindie.org/media/LBA-Rate-Sheet-6.30.26.pdf', quote: 'equal to 65% of the applicable rate from the Basic Agreement; Day Performer $834' };
const S36: WorkSource = { file: W, id: 'S36', url: 'https://cdn.actorsequity.org/pages/lort-documents/LORTRatification.pdf', quote: 'actor minimums As of 6.29.26: D $889 / C $1,114 / B $1,213 / B+ $1,320 / A $1,453' };

/**
 * The minimums, by what they're for. The SAG-AFTRA figures are the 2026–2030 agreement's for July 1, 2026 to June 30,
 * 2027 (S30, S33, S32); the day rate's later years are in `SAG_DAY_BY_YEAR`. LORT's are Equity's from June 29, 2026
 * (S36). Off-Broadway's minimums are only on Equity's member portal (S37), so its figure is assumed, between LORT D and
 * LORT B, the research's placeholder. A non-union short's pay isn't published anywhere it could be: assumed.
 */
export const RATES: Readonly<Record<RateId, Rate>> = {
  'sag-tv-day': { id: 'sag-tv-day', label: 'SAG-AFTRA Day Performer', amount: 1_283_00, per: 'day', effective: { from: '2026-07-01', to: '2027-06-30' }, basis: 'verified', source: S30 },
  'sag-tv-week': { id: 'sag-tv-week', label: 'SAG-AFTRA Weekly Performer', amount: 4_456_00, per: 'week', effective: { from: '2026-07-01', to: '2027-06-30' }, basis: 'verified', source: S30 },
  'low-budget-day': { id: 'low-budget-day', label: 'SAG-AFTRA Low Budget Day Performer', amount: 834_00, per: 'day', effective: { from: '2026-07-01', to: '2027-06-30' }, basis: 'verified', source: S33 },
  'low-budget-week': { id: 'low-budget-week', label: 'SAG-AFTRA Low Budget Weekly Performer', amount: 2_896_00, per: 'week', effective: { from: '2026-07-01', to: '2027-06-30' }, basis: 'verified', source: S33 },
  'ultra-low-budget-day': { id: 'ultra-low-budget-day', label: 'SAG-AFTRA Ultra Low Budget Day Performer', amount: 257_00, per: 'day', effective: { from: '2026-07-01', to: '2027-06-30' }, basis: 'verified', source: S32 },
  'student-film': { id: 'student-film', label: 'SAG-AFTRA Student Film, Deferred', per: 'day', deferred: true, effective: { from: '2026-07-01' }, basis: 'verified', source: S32 },
  'lort-d': { id: 'lort-d', label: 'Equity LORT D Actor Minimum', amount: 889_00, per: 'week', effective: { from: '2026-06-29', to: '2027-06-27' }, basis: 'verified', source: S36 },
  'lort-c': { id: 'lort-c', label: 'Equity LORT C Actor Minimum', amount: 1_114_00, per: 'week', effective: { from: '2026-06-29', to: '2027-06-27' }, basis: 'verified', source: S36 },
  'lort-b': { id: 'lort-b', label: 'Equity LORT B Actor Minimum', amount: 1_213_00, per: 'week', effective: { from: '2026-06-29', to: '2027-06-27' }, basis: 'verified', source: S36 },
  // ASSUMPTION: the midpoint of LORT D and LORT B (work.md, "What a game may assume"), since Equity's Off-Broadway
  // minimums aren't public (S37).
  'off-broadway': { id: 'off-broadway', label: 'Off-Broadway Weekly Salary', amount: 1_051_00, per: 'week', effective: { from: '2026-06-29' }, basis: 'assumption', words: 'Equity’s Off-Broadway minimums aren’t public, so this weekly salary is estimated, between the LORT D and LORT B minimums.' },
  // ASSUMPTION: no published figure for a non-union short.
  'non-union-day': { id: 'non-union-day', label: 'Non-Union Day Rate', amount: 125_00, per: 'day', effective: { from: '2026-07-01' }, basis: 'assumption', words: 'A non-union short sets its own pay, so this day rate is estimated.' },
};

/** The SAG-AFTRA day performer's minimum by contract year, each from July 1 (S30): 2025's, then the agreement's four. */
export const SAG_DAY_BY_YEAR: readonly { from: string; amount: number }[] = [
  { from: '2025-07-01', amount: 1_246_00 }, { from: '2026-07-01', amount: 1_283_00 }, { from: '2027-07-01', amount: 1_321_00 },
  { from: '2028-07-01', amount: 1_361_00 }, { from: '2029-07-01', amount: 1_402_00 },
];

// ---------------------------------------------------------------------------------------------------------------------
// The unions
// ---------------------------------------------------------------------------------------------------------------------

/**
 * What joining each union costs, and how it's reached. Equity's figures are verified (S25 to S27); SAG-AFTRA's were seen
 * only in a search engine's copy of its pages (S20, "index only"), and are said so.
 */
export const UNIONS = {
  equity: {
    name: 'Actors’ Equity Association',
    initiation: 1_800_00, down: 600_00, yearlyDues: 176_00, workingDues: 0.025, basis: 'verified' as Basis,
    source: { file: W, id: 'S27', url: 'https://www.actorsequity.org/join/dues', quote: '$1,800 paid within a maximum three-year period. Basic dues : $176 annually, billed at $88 twice a year each May and November. Working dues : 2.5% of gross earnings under Equity contract' } as WorkSource,
    // Verified: "Through work at Yale Repertory Theatre, those students who are not members of Actors' Equity will attain
    // membership to the union upon graduation" (yale.md, B27 p.24), quoted from its second half.
    atDegree: { file: 'yale.md', id: 'B27 p.24', url: 'https://bulletin.yale.edu/sites/default/files/david-geffen-school-of-drama-2026-2027.pdf', quote: '… will attain membership to the union upon graduation' } as WorkSource,
  },
  sagAftra: {
    name: 'SAG-AFTRA',
    initiation: 3_121_00, yearlyDues: 246_14, workingDues: 0.01575, basis: 'assumption' as Basis,
    words: 'SAG-AFTRA’s fees were read only from a search engine’s copy of its pages, so they’re approximate.',
    /** A union-security clause can require membership from the thirtieth day of employment (29 U.S.C. 158(a)(3), S24). */
    joinWithinDays: 30,
    source: { file: W, id: 'S20', url: 'https://www.sagaftra.org/membership-benefits/membership-costs', quote: 'the national initiation fee rate is currently $3,121, although it may be lower in some states. Annual Base dues are $246.14.' } as WorkSource,
  },
} as const;

// ---------------------------------------------------------------------------------------------------------------------
// The projects (all fictional)
// ---------------------------------------------------------------------------------------------------------------------

export type ProMedium = 'stage' | 'film' | 'television';
export type ProjectKind = 'off-broadway' | 'lort' | 'network-drama' | 'low-budget' | 'ultra-low-budget' | 'student-film' | 'non-union-short';
/** A role's size as billing calls it: the stage's three, and screen's co-star and day player. */
export type RoleSize = PartSize | 'co-star';

export interface ProjectTemplate {
  id: string;
  kind: ProjectKind;
  /** Always true: the project, its company and its casting office are the game's inventions. */
  fictional: true;
  project: string;
  company: string;
  casting: string;
  medium: ProMedium;
  /** The game's genre ids (`content/genres.ts`). */
  genres: readonly string[];
  place: { city: string; cityId: string; venue: string };
  role: {
    part: string;
    size: RoleSize;
    /** The part, said as a breakdown says it. */
    about: string;
    /** What it asks, for the judge (`content/tasks.ts`): the task, its families and the techniques it reads. */
    task: 'performance' | 'camera';
    families: readonly Family[];
    techniques: Partial<Record<Skill, number>>;
    stakes: number;
  };
  union: 'equity' | 'sag-aftra' | 'none';
  /** The agreement the work is under, as its union names it. */
  contract: string;
  requirements: {
    /** The playing ages the part is cast in. */
    ages: readonly [number, number];
    /** An open call for union members only. */
    membersOnly?: 'equity';
    /** Techniques the part needs at a level, where it needs any. */
    skills?: Partial<Record<Skill, number>>;
    /** What a submission sends: a headshot and a résumé always; a reel where screen casting asks for one. */
    sends: readonly ('headshot' | 'resume' | 'reel')[];
  };
  /** The stages it uses: how it's auditioned, and whether there's a callback. */
  stages: { audition: 'self-tape' | 'in-person'; callback: boolean };
  /** A run's rehearsal and performance weeks, or a shoot's days. */
  schedule: { kind: 'run'; rehearsalWeeks: number; performanceWeeks: number } | { kind: 'shoot'; days: number };
  /** Who can put the actor up for it: an agent, and the actor's own submission where it's open. */
  access: { agent: boolean; open: false | 'anyone' | 'equity-members' };
  pay: RateId;
}

/**
 * Seven fictional projects, one of each kind the design names. Every name, company, casting office and schedule here is
 * invented; the schedules' lengths are assumed. Each one's pay is a rate above, verified or assumed as it says.
 */
export const PROJECTS: readonly ProjectTemplate[] = [
  {
    id: 'calder-street', kind: 'off-broadway', fictional: true,
    project: 'A House On Calder Street', company: 'Marrow Lane Theater Company', casting: 'Pennick Casting',
    medium: 'stage', genres: ['domestic_drama', 'drama'],
    place: { city: 'New York', cityId: 'us-ny-newyork', venue: 'a 199-seat theater in Manhattan' },
    role: { part: 'Nell', size: 'supporting', about: 'The younger sister, home for the first time in six years, who says what the family won’t.', task: 'performance', families: ['drama'], techniques: { scene: 2, character: 1 }, stakes: 2 },
    union: 'equity', contract: 'Equity Off-Broadway',
    requirements: { ages: [22, 32], sends: ['headshot', 'resume'] },
    stages: { audition: 'in-person', callback: true },
    schedule: { kind: 'run', rehearsalWeeks: 4, performanceWeeks: 6 },
    access: { agent: true, open: false }, pay: 'off-broadway',
  },
  {
    id: 'winter-ledger', kind: 'lort', fictional: true,
    project: 'The Winter Ledger', company: 'Harrow Point Repertory Theater', casting: 'Ostrander Vale Casting',
    medium: 'stage', genres: ['comedy', 'farce'],
    // In Providence until 2026-10-21, a town the gazetteer doesn't hold, so the tax return couldn't read where the work
    // was done; Hudson, New York, is held, and its work is taxed as a nonresident's New York wages like the city's.
    place: { city: 'Hudson', cityId: 'us-ny-hudson', venue: 'the company’s main stage' },
    role: { part: 'Tobias Marsh', size: 'lead', about: 'A young clerk who keeps two sets of books and two fiancées, and loses track of both in one night.', task: 'performance', families: ['comedy', 'farce'], techniques: { comedy: 2, scene: 1, movement: 1 }, stakes: 1 },
    union: 'equity', contract: 'Equity LORT C',
    requirements: { ages: [22, 30], sends: ['headshot', 'resume'] },
    stages: { audition: 'in-person', callback: true },
    schedule: { kind: 'run', rehearsalWeeks: 4, performanceWeeks: 5 },
    access: { agent: true, open: 'equity-members' }, pay: 'lort-c',
  },
  {
    id: 'calloway-files', kind: 'network-drama', fictional: true,
    project: 'The Calloway Files', company: 'Bright Harbor Television', casting: 'Kettering Casting',
    medium: 'television', genres: ['police_procedural', 'crime'],
    place: { city: 'New York', cityId: 'us-ny-newyork', venue: 'a studio in Queens' },
    role: { part: 'Desk Clerk', size: 'co-star', about: 'A night clerk at a hotel who saw the victim leave and lies about when.', task: 'camera', families: ['crime', 'drama'], techniques: { screen: 2, scene: 1 }, stakes: 1 },
    union: 'sag-aftra', contract: 'SAG-AFTRA TV/Theatrical',
    requirements: { ages: [22, 35], sends: ['headshot', 'resume', 'reel'] },
    stages: { audition: 'self-tape', callback: false },
    schedule: { kind: 'shoot', days: 2 },
    access: { agent: true, open: false }, pay: 'sag-tv-day',
  },
  {
    id: 'gull-season', kind: 'low-budget', fictional: true,
    project: 'Gull Season', company: 'Tern Island Pictures', casting: 'Quillon Casting',
    medium: 'film', genres: ['psychological_thriller', 'thriller'],
    place: { city: 'New York', cityId: 'us-ny-newyork', venue: 'locations on Long Island' },
    role: { part: 'Wren', size: 'supporting', about: 'A ferry deckhand who befriends the new arrival and knows more about the drowning than she says.', task: 'camera', families: ['thriller', 'drama'], techniques: { screen: 2, character: 1 }, stakes: 2 },
    union: 'sag-aftra', contract: 'SAG-AFTRA Low Budget Theatrical',
    requirements: { ages: [22, 34], sends: ['headshot', 'resume', 'reel'] },
    stages: { audition: 'self-tape', callback: true },
    schedule: { kind: 'shoot', days: 6 },
    access: { agent: true, open: false }, pay: 'low-budget-day',
  },
  {
    id: 'route-nine', kind: 'ultra-low-budget', fictional: true,
    project: 'Static On Route 9', company: 'Dead Air Films', casting: 'Brisbane Hall Casting',
    medium: 'film', genres: ['psychological_horror', 'horror'],
    place: { city: 'New York', cityId: 'us-ny-newyork', venue: 'a motel upstate' },
    role: { part: 'Jess', size: 'lead', about: 'One of two night-shift radio hosts who start hearing their own voices call in.', task: 'camera', families: ['horror'], techniques: { screen: 2, emotion: 1 }, stakes: 2 },
    union: 'sag-aftra', contract: 'SAG-AFTRA Ultra Low Budget',
    requirements: { ages: [21, 32], sends: ['headshot', 'resume'] },
    stages: { audition: 'self-tape', callback: false },
    schedule: { kind: 'shoot', days: 4 },
    access: { agent: true, open: 'anyone' }, pay: 'ultra-low-budget-day',
  },
  {
    id: 'paper-moons', kind: 'student-film', fictional: true,
    project: 'Paper Moons', company: 'a graduate film program’s thesis production', casting: 'the film’s director',
    medium: 'film', genres: ['coming_of_age', 'drama'],
    place: { city: 'New York', cityId: 'us-ny-newyork', venue: 'an apartment in Brooklyn' },
    role: { part: 'Theo', size: 'lead', about: 'An older brother back for the summer, deciding whether to tell the family he isn’t going back.', task: 'camera', families: ['drama'], techniques: { screen: 1, scene: 2 }, stakes: 1 },
    union: 'sag-aftra', contract: 'SAG-AFTRA Student Film',
    requirements: { ages: [21, 30], sends: ['headshot', 'resume'] },
    stages: { audition: 'in-person', callback: false },
    schedule: { kind: 'shoot', days: 3 },
    access: { agent: false, open: 'anyone' }, pay: 'student-film',
  },
  {
    id: 'eastview', kind: 'non-union-short', fictional: true,
    project: 'Last Bus To Eastview', company: 'Ferrous Pictures', casting: 'the producers',
    medium: 'film', genres: ['romantic_comedy'],
    place: { city: 'New York', cityId: 'us-ny-newyork', venue: 'a bus depot in the Bronx' },
    role: { part: 'Sam', size: 'lead', about: 'A commuter who misses the last bus and spends the night arguing with a stranger about whether to take the job abroad.', task: 'camera', families: ['comedy', 'romance'], techniques: { screen: 1, comedy: 2 }, stakes: 1 },
    union: 'none', contract: 'Non-Union',
    requirements: { ages: [21, 35], sends: ['headshot', 'resume'] },
    stages: { audition: 'self-tape', callback: false },
    schedule: { kind: 'shoot', days: 2 },
    access: { agent: false, open: 'anyone' }, pay: 'non-union-day',
  },
];

export const projectById = (id: string): ProjectTemplate | undefined => PROJECTS.find((p) => p.id === id);

/**
 * The towns an audition in person is held in, as the help says them: "New York or Hudson" (from 2026-10-21, read from the
 * projects so the help names the towns the game has; it named Providence by hand until the company moved).
 */
export const AUDITION_TOWNS = [...new Set(PROJECTS.filter((p) => p.stages.audition === 'in-person').map((p) => p.place.city))].join(' or ');

// ---------------------------------------------------------------------------------------------------------------------
// The agreement an agent offers
// ---------------------------------------------------------------------------------------------------------------------

/** One term of an agreement: what it says, and whether it's a published rule or a simulation term. */
export interface AgreementTerm {
  id: 'scope' | 'territory' | 'excluded' | 'exclusivity' | 'commission' | 'scale-plus-ten' | 'duration' | 'responsibilities' | 'actor' | 'payment' | 'termination' | 'continuing' | 'offer';
  heading: string;
  words: string;
  basis: 'verified' | 'simulation';
  sources?: readonly WorkSource[];
}

const EQUITY_COMMISSION: WorkSource = { file: R, id: 'S28', url: 'https://www.actorsequity.org/resources/agency-information/agency-commission-schedule', quote: 'Tier I: For weekly contractual salaries of $525 or less, a 5% commission; Tier II: …greater than $525, a 10% commission' };
const SAG_COMMISSION: WorkSource = { file: R, id: 'S3', url: 'https://servicesagaftra.custhelp.com/app/answers/detail/a_id/704', quote: 'No franchised agent may charge a rate of commission higher than 10%. In some cases, an agent must negotiate your fee above the minimum scale… ‘scale plus 10%’ in order to collect commission on a job.' };
const NY_CAP: WorkSource = { file: R, id: '§185(8)', url: 'https://www.nysenate.gov/legislation/laws/GBS/185', quote: 'the gross fee shall not exceed, for a single engagement, ten per cent of the compensation payable to the applicant' };
const EQUITY_PER_DIEM: WorkSource = { file: R, id: 'S28', url: 'https://www.actorsequity.org/resources/agency-information/agency-commission-schedule', quote: 'Commission shall not be applicable on the Equity minimum portion of out-of-town expense money or per diem' };
const EQUITY_TERM: WorkSource = { file: R, id: 'S30', url: 'https://sitefinitywebappprod.azurewebsites.net/docs/librariesprovider2/resource-assets/Agency-Regulations.pdf', quote: 'The initial Exclusive Management contract shall not specify a term longer than one year' };
// Seen only in a search engine's copy of the page (representation.md, [snippet]).
const SAG_TERM: WorkSource = { file: R, id: 'S11', url: 'https://www.sagaftra.org/sites/default/files/AFTRA_Regulations_Governing_Agents_Under_Rule12C.pdf', quote: 'no initial contract… may be longer than eighteen (18) months' };
const EQUITY_ENDS: WorkSource = { file: R, id: 'S29', url: 'https://www.actorsequity.org/resources/agency-information/agency-contract-termination', quote: 'If during any ninety (90) day period the Agent fails to secure… a bona fide offer of employment… for at least four weeks at the Actor’s customary salary' };
const SAG_ENDS: WorkSource = { file: R, id: 'S2', url: 'https://servicesagaftra.custhelp.com/app/answers/detail/a_id/2360', quote: 'if during the immediately preceding 91 days you have had less than 10 days of TV/Theatrical work; you must wait at least 151 days' };
const EQUITY_TAIL: WorkSource = { file: R, id: 'S30', url: 'https://sitefinitywebappprod.azurewebsites.net/docs/librariesprovider2/resource-assets/Agency-Regulations.pdf', quote: 'within 60 days after the date upon which the Agent gives such written information' };
const EQUITY_ONGOING: WorkSource = { file: R, id: 'S29', url: 'https://www.actorsequity.org/resources/agency-information/agency-contract-termination', quote: 'entered into by the Actor prior to the effective date' };
const TRUST: WorkSource = { file: R, id: 'S1', url: 'https://servicesagaftra.custhelp.com/app/answers/detail/a_id/2484', quote: 'on a (3) three, (5) five, or (7) seven day cycle' };
const AGENT_ROLE: WorkSource = { file: R, id: 'S4', url: 'https://servicesagaftra.custhelp.com/app/answers/detail/a_id/160', quote: 'agents are the only entities authorized to negotiate and service employment contracts' };
const EQUITY_FORM: WorkSource = { file: R, id: 'S30', url: 'https://sitefinitywebappprod.azurewebsites.net/docs/librariesprovider2/resource-assets/Agency-Regulations.pdf', quote: 'The Agent shall be the Actor’s sole and exclusive agent' };

/**
 * The figures the agreement's terms run on, each a published rule's or the game's own, as its comment says. The agent
 * and work systems read these; the words below say them.
 */
export const AGREEMENT = {
  /** Commission on covered work: SAG-AFTRA's cap and New York's (S3, §185(8)). */
  commission: 0.10,
  /** Equity's lower tier: 5% on weekly salaries of $525 or less (S28). */
  equityLowTier: { weeklyAtOrBelow: 525_00, rate: 0.05 },
  /** ASSUMPTION: one year, within Equity's one-year initial term (S30) and SAG-AFTRA's eighteen months (S11, search copy). */
  termDays: 365,
  /** ASSUMPTION: an offered agreement stands this long before it lapses. */
  offerStandsDays: 14,
  /** Equity: the actor may end it after 90 days with no bona fide offer of covered work (S29). */
  noOfferDays: 90,
  /** SAG-AFTRA: after 151 days, fewer than 10 days' covered work in the last 91 (S2). */
  sag: { waitDays: 151, windowDays: 91, fewerThanDays: 10 },
  /** Equity's tail: an offer conveyed in the term and accepted within 60 days after it (S30). */
  tailDays: 60,
  /** SAG-AFTRA's three-day cycle for checks held in trust (S1), applied to all covered work: ASSUMPTION. */
  trustBusinessDays: 3,
} as const;

/** The agreement's terms, as the player reads them before accepting: each verified or a simulation term. */
export const AGREEMENT_TERMS: readonly AgreementTerm[] = [
  { id: 'scope', heading: 'What It Covers', words: 'Stage, film and television work: the fields the agent’s department covers.', basis: 'simulation' },
  { id: 'territory', heading: 'Where', words: 'Work anywhere in the United States.', basis: 'simulation' },
  { id: 'excluded', heading: 'What It Leaves Out', words: 'Commercials and voice-over work aren’t covered. An agency usually handles them in another department.', basis: 'simulation' },
  { id: 'exclusivity', heading: 'Exclusive', words: 'The agent is your only agent for covered work. Equity’s standard form is written the same way for theater.', basis: 'simulation', sources: [EQUITY_FORM] },
  { id: 'commission', heading: 'Commission', words: 'Ten percent of your gross pay for covered work, and five percent on an Equity contract paying $525 a week or less. The Equity minimum part of per diem or expense money carries no commission.', basis: 'verified', sources: [SAG_COMMISSION, NY_CAP, EQUITY_COMMISSION, EQUITY_PER_DIEM] },
  { id: 'scale-plus-ten', heading: 'Scale Plus Ten', words: 'On SAG-AFTRA work at the minimum, the agent asks for scale plus ten percent, so the commission comes out of the extra ten.', basis: 'verified', sources: [SAG_COMMISSION] },
  { id: 'duration', heading: 'How Long', words: 'One year from the day you sign it.', basis: 'simulation', sources: [EQUITY_TERM, SAG_TERM] },
  { id: 'responsibilities', heading: 'What The Agent Does', words: 'Looks for and submits you for covered work, passes on every offer in writing, negotiates your terms, and collects your pay into the agency’s client trust account.', basis: 'verified', sources: [AGENT_ROLE, EQUITY_FORM] },
  { id: 'actor', heading: 'What You Do', words: 'Tell the agent when you’re available, keep the appointments made for you, and don’t take covered work without them.', basis: 'simulation' },
  { id: 'payment', heading: 'How Pay Reaches You', words: 'Pay for covered work goes to the agency’s client trust account, and comes on to you within three business days, less commission.', basis: 'simulation', sources: [TRUST] },
  { id: 'termination', heading: 'Ending It', words: 'Either of you can end it by agreement at any time. You can end it if 90 days pass with no real offer of covered work, or, after 151 days, if you’ve had fewer than ten days of covered work in the last 91. Otherwise it ends when the year is up.', basis: 'verified', sources: [EQUITY_ENDS, SAG_ENDS] },
  { id: 'continuing', heading: 'What You Still Owe After It Ends', words: 'Commission stays owed on contracts you made while it ran, and on their renewals, whoever represents you when you’re paid. An offer the agent passed on in the term that you accept within 60 days after it ends is owed too.', basis: 'verified', sources: [EQUITY_ONGOING, EQUITY_TAIL] },
  { id: 'offer', heading: 'How Long The Offer Stands', words: 'Fourteen days. After that it lapses.', basis: 'simulation' },
];
