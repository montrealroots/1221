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
 * - **Fictional**: every project, company and casting office below but the parts drawn from real productions (from
 *   2026-10-23, brief 25's Module 2), which say they're the game's own parts in a real production; until then every one
 *   was fictional. Nothing here says a real production is casting. A fictional title that happens to match a real one is
 *   a coincidence: each says it's fictional.
 *
 * The projects are templates: the work system (`systems/projobs.ts`, built on this) makes each opportunity from one,
 * with its dates. Each names its medium, its genres (the game's genre ids, `content/genres.ts`), the role's size and
 * what it asks as a task profile (`content/tasks.ts`) with families and techniques, its union and contract, its
 * requirements, the stages it uses, its schedule's shape, and who can be put up for it: through an agent only, or open
 * to the actor's own submission as well.
 */

import type { Family } from './genres';
import type { Skill } from './school';
import type { PartFor, PartSize } from './plays';

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

/**
 * The SAG-AFTRA weekly performer's minimum by contract year, each from July 1: the rate sheet's theatrical row B 354
 * and television's TV 5, the same figures (from 2026-10-23, the owner's brief 25: `N01` in
 * `docs/verification/career-world-2026-10-23/sources.json`, read that day). Until then `RATES` held 2026–27's alone,
 * which no project paid; the Sydney feature is the first that does, and its work from July 2027 on reads its own year.
 */
export const SAG_WEEK_BY_YEAR: readonly { from: string; amount: number }[] = [
  { from: '2025-07-01', amount: 4_326_00 }, { from: '2026-07-01', amount: 4_456_00 }, { from: '2027-07-01', amount: 4_590_00 },
  { from: '2028-07-01', amount: 4_728_00 }, { from: '2029-07-01', amount: 4_870_00 },
];

/**
 * The SAG-AFTRA day rates set as a share of the Basic Agreement's day performer minimum: Low Budget at 65% (S33) and
 * Ultra Low Budget at 20% (S32), each the year's, rounded to the dollar as the rate sheets print them. Both reproduce
 * `RATES`' 2026–27 figures, $834 and $257.
 */
const SHARE_OF_SAG_DAY: Partial<Record<RateId, number>> = { 'sag-tv-day': 1, 'low-budget-day': 0.65, 'ultra-low-budget-day': 0.2 };

/**
 * A rate's minimum on a day (`YYYY-MM-DD`): the SAG-AFTRA day performer's by its contract year (S30, `SAG_DAY_BY_YEAR`),
 * and Low Budget's and Ultra Low Budget's day rates as their shares of it (`SHARE_OF_SAG_DAY`), every other as `RATES`
 * has it. The work loop prices an offer by it on the work's first day (`rateOn`, `systems/projobs.ts`), and the pay
 * measures a commission against the same scale (`scaleOf`, `systems/propay.ts`). Moved here from the work loop on
 * 2026-10-21 (brief 19's playthroughs), when the pay was found reading `RATES`' 2026–27 figure for work from July 2027 on:
 * a 2029 co-star offered scale plus ten paid its agent the full ten percent of the gross, which left the actor under
 * scale. Low Budget and Ultra Low Budget stayed at their 2026–27 figures until later that day, found by the same
 * playthroughs.
 *
 * ASSUMPTION: Equity's LORT minimums after 28 June 2027, the Off-Broadway estimate and the non-union day rate stay at the
 * figure `RATES` holds: no later LORT minimum was read (S36 quotes 29 June 2026's), and the other two are estimates.
 */
export function minimumOn(rate: Rate, day: string): number | undefined {
  if (rate.id === 'sag-tv-week') return [...SAG_WEEK_BY_YEAR].reverse().find((r) => r.from <= day)?.amount ?? rate.amount;
  const share = SHARE_OF_SAG_DAY[rate.id];
  const scale = [...SAG_DAY_BY_YEAR].reverse().find((r) => r.from <= day)?.amount;
  if (share === undefined || scale === undefined) return rate.amount;
  return Math.round((scale * share) / 100) * 100;
}

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
// The projects (fictional, but the two drawn from real productions at the end)
// ---------------------------------------------------------------------------------------------------------------------

export type ProMedium = 'stage' | 'film' | 'television';
export type ProjectKind = 'off-broadway' | 'lort' | 'network-drama' | 'network-comedy' | 'low-budget' | 'ultra-low-budget' | 'student-film' | 'non-union-short' | 'overseas-feature';

/**
 * How a project abroad gets its actor there and keeps them (from 2026-10-23, the owner's brief 25, Part 9 and the
 * dossier's Section 10; `docs/verification/career-world-2026-10-23/criteria.md`, W3 to W6): the production's company in
 * the country, which supports a work visa where one's needed, and the hotel it books. Every name is the game's, and that
 * the production books and pays for the flights, the cars and the hotel is the game's assumption, said where a player
 * reads it.
 */
export interface TripTerms {
  /** The production's own company in the country of the work, which supports the visa; none for work in the US, which needs no visa. */
  supporter?: string;
  /** Where the production puts the actor up, as a screen names it. */
  hotel: string;
  /** Who books and pays for the travel and the stay: the production, assumed. */
  pays: 'production';
  words: string;
}
/**
 * A part drawn from a real production (from 2026-10-23, brief 25's Module 2, criteria C8 and C9): the catalog's record
 * (`content/catalog.ts`) and the work the game imagines for it, after the research baseline. The character is new, never a
 * regular's; the casting office is the production's, unnamed; and every screen that shows it says it's the game's.
 */
export interface DrawnFrom {
  /** The catalog's production id. */
  production: string;
  /** The work the game imagines, in a phrase that names its production: "a season of 9-1-1 the game imagines, after its tenth". */
  season: string;
  /** Why the game sets the work where it does, the filming location being unknown. */
  placeWhy: string;
}
/** A role's size as billing calls it: the stage's three, and screen's co-star and day player. */
export type RoleSize = PartSize | 'co-star';

export interface ProjectTemplate {
  id: string;
  kind: ProjectKind;
  /**
   * The project, its company and its casting office are the game's inventions; false only for a part drawn from a real
   * production (`drawn`), whose production and companies are the catalog's and whose part is the game's (from
   * 2026-10-23, brief 25's Module 2: until then always true).
   */
  fictional: boolean;
  /** A part the game draws from a real production (Module 2, C8): the catalog's record, and the work it imagines. */
  drawn?: DrawnFrom;
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
    /**
     * Who the part is written for, as the School's plays say it (`content/plays.ts`): an actor, an actress, or either, and
     * only a part written for the player or for either is posted to them (`writtenFor`). From 2026-10-21, at the owner's
     * word ("There should be gender neutral and different parts for each genders. We need versatility always."): until
     * then nothing read it, and the breakdowns that named a sister, a brother or two fiancées went to anyone, so an
     * actress was offered Theo, "an older brother", by the app's second walk.
     */
    for: PartFor;
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
  /** Work abroad: the production's company there, its hotel, and who pays (`TripTerms`). Absent, the work is a trip from home and back each day. */
  trip?: TripTerms;
  /** Days from the posting to the work's first day, where it isn't `WORK.leadDays`: work abroad needs time for its visa. */
  leadDays?: number;
}

/**
 * Seven fictional projects, one of each kind the design names. Every name, company, casting office and schedule here is
 * invented; the schedules' lengths are assumed. Each one's pay is a rate above, verified or assumed as it says.
 *
 * Eleven parts in them (from 2026-10-21, the owner's word): three written for either, and four each for an actor and an
 * actress, so each sees all seven projects and each kind as often. Where a project's part is written for one, a second
 * part in it is written for the other, its own person in the same story, not the first one renamed, and named as no
 * classmate can be (`school.ts`'s given names): Callum beside Nell, Hester Vane beside Tobias Marsh, Ferris beside Wren,
 * Ivy beside Felix. Until then there were seven parts, one a project; Felix was Theo, and Callum Owen, until the walk
 * found classmates given each name (Theo Patel among them). Robin was Sam until brief 20 (2026-10-21), which found Sam
 * the short form of a classmate's given name, Samuel: "A Self-Tape For Sam" beside "Samuel: A Request For Help" in What
 * Needs You could be read as the classmate's.
 */
export const PROJECTS: readonly ProjectTemplate[] = [
  {
    id: 'calder-street', kind: 'off-broadway', fictional: true,
    project: 'A House On Calder Street', company: 'Marrow Lane Theater Company', casting: 'Pennick Casting',
    medium: 'stage', genres: ['domestic_drama', 'drama'],
    place: { city: 'New York', cityId: 'us-ny-newyork', venue: 'a 199-seat theater in Manhattan' },
    role: { part: 'Nell', size: 'supporting', for: 'actress', about: 'The younger sister, home for the first time in six years, who says what the family won’t.', task: 'performance', families: ['drama'], techniques: { scene: 2, character: 1 }, stakes: 2 },
    union: 'equity', contract: 'Equity Off-Broadway',
    requirements: { ages: [22, 32], sends: ['headshot', 'resume'] },
    stages: { audition: 'in-person', callback: true },
    schedule: { kind: 'run', rehearsalWeeks: 4, performanceWeeks: 6 },
    access: { agent: true, open: false }, pay: 'off-broadway',
  },
  {
    id: 'calder-street-callum', kind: 'off-broadway', fictional: true,
    project: 'A House On Calder Street', company: 'Marrow Lane Theater Company', casting: 'Pennick Casting',
    medium: 'stage', genres: ['domestic_drama', 'drama'],
    place: { city: 'New York', cityId: 'us-ny-newyork', venue: 'a 199-seat theater in Manhattan' },
    role: { part: 'Callum', size: 'supporting', for: 'actor', about: 'The older brother who stayed, who has kept the house going and the family’s secret better than anyone.', task: 'performance', families: ['drama'], techniques: { scene: 2, character: 1 }, stakes: 2 },
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
    role: { part: 'Tobias Marsh', size: 'lead', for: 'actor', about: 'A young clerk who keeps two sets of books and two fiancées, and loses track of both in one night.', task: 'performance', families: ['comedy', 'farce'], techniques: { comedy: 2, scene: 1, movement: 1 }, stakes: 1 },
    union: 'equity', contract: 'Equity LORT C',
    requirements: { ages: [22, 30], sends: ['headshot', 'resume'] },
    stages: { audition: 'in-person', callback: true },
    schedule: { kind: 'run', rehearsalWeeks: 4, performanceWeeks: 5 },
    access: { agent: true, open: 'equity-members' }, pay: 'lort-c',
  },
  {
    id: 'winter-ledger-hester', kind: 'lort', fictional: true,
    project: 'The Winter Ledger', company: 'Harrow Point Repertory Theater', casting: 'Ostrander Vale Casting',
    medium: 'stage', genres: ['comedy', 'farce'],
    place: { city: 'Hudson', cityId: 'us-ny-hudson', venue: 'the company’s main stage' },
    role: { part: 'Hester Vane', size: 'lead', for: 'actress', about: 'A young widow who runs the inn where both fiancées arrive on the same night, and tells each of the three a different lie to keep the peace.', task: 'performance', families: ['comedy', 'farce'], techniques: { comedy: 2, scene: 1, movement: 1 }, stakes: 1 },
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
    role: { part: 'Desk Clerk', size: 'co-star', for: 'either', about: 'A night clerk at a hotel who saw the victim leave and lies about when.', task: 'camera', families: ['crime', 'drama'], techniques: { screen: 2, scene: 1 }, stakes: 1 },
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
    role: { part: 'Wren', size: 'supporting', for: 'actress', about: 'A ferry deckhand who befriends the new arrival and knows more about the drowning than she says.', task: 'camera', families: ['thriller', 'drama'], techniques: { screen: 2, character: 1 }, stakes: 2 },
    union: 'sag-aftra', contract: 'SAG-AFTRA Low Budget Theatrical',
    requirements: { ages: [22, 34], sends: ['headshot', 'resume', 'reel'] },
    stages: { audition: 'self-tape', callback: true },
    schedule: { kind: 'shoot', days: 6 },
    access: { agent: true, open: false }, pay: 'low-budget-day',
  },
  {
    id: 'gull-season-ferris', kind: 'low-budget', fictional: true,
    project: 'Gull Season', company: 'Tern Island Pictures', casting: 'Quillon Casting',
    medium: 'film', genres: ['psychological_thriller', 'thriller'],
    place: { city: 'New York', cityId: 'us-ny-newyork', venue: 'locations on Long Island' },
    role: { part: 'Ferris', size: 'supporting', for: 'actor', about: 'The ferry’s pilot, who pulled the body from the water and has told the police three different stories about it.', task: 'camera', families: ['thriller', 'drama'], techniques: { screen: 2, character: 1 }, stakes: 2 },
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
    role: { part: 'Jess', size: 'lead', for: 'either', about: 'One of two night-shift radio hosts who start hearing their own voices call in.', task: 'camera', families: ['horror'], techniques: { screen: 2, emotion: 1 }, stakes: 2 },
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
    role: { part: 'Felix', size: 'lead', for: 'actor', about: 'An older brother back for the summer, deciding whether to tell the family he isn’t going back.', task: 'camera', families: ['drama'], techniques: { screen: 1, scene: 2 }, stakes: 1 },
    union: 'sag-aftra', contract: 'SAG-AFTRA Student Film',
    requirements: { ages: [21, 30], sends: ['headshot', 'resume'] },
    stages: { audition: 'in-person', callback: false },
    schedule: { kind: 'shoot', days: 3 },
    access: { agent: false, open: 'anyone' }, pay: 'student-film',
  },
  {
    id: 'paper-moons-ivy', kind: 'student-film', fictional: true,
    project: 'Paper Moons', company: 'a graduate film program’s thesis production', casting: 'the film’s director',
    medium: 'film', genres: ['coming_of_age', 'drama'],
    place: { city: 'New York', cityId: 'us-ny-newyork', venue: 'an apartment in Brooklyn' },
    role: { part: 'Ivy', size: 'lead', for: 'actress', about: 'The sister who stayed home, who learns first that her brother isn’t going back and has the summer to decide whether to say so.', task: 'camera', families: ['drama'], techniques: { screen: 1, scene: 2 }, stakes: 1 },
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
    role: { part: 'Robin', size: 'lead', for: 'either', about: 'A commuter who misses the last bus and spends the night arguing with a stranger about whether to take the job abroad.', task: 'camera', families: ['comedy', 'romance'], techniques: { screen: 1, comedy: 2 }, stakes: 1 },
    union: 'none', contract: 'Non-Union',
    requirements: { ages: [21, 35], sends: ['headshot', 'resume'] },
    stages: { audition: 'self-tape', callback: false },
    schedule: { kind: 'shoot', days: 2 },
    access: { agent: false, open: 'anyone' }, pay: 'non-union-day',
  },
  // A feature shooting in Sydney (from 2026-10-23, the owner's brief 25: the dossier's "start with a local engagement and
  // an overseas engagement"). Fictional, as every project here is: the studio, its Australian company, the casting office
  // and the hotel. ASSUMPTIONS: a US studio's feature engages an American actor it casts from the US under the SAG-AFTRA
  // Basic Agreement, its weekly performer's minimum, though the game hasn't read the agreement's terms for work abroad;
  // its casting office takes self-tapes for the part from anyone in the US; the shoot is eight weekdays, eight weeks after
  // the posting, so a visa can be decided before the flight. An agent's agreement covers work in the United States
  // (`AGREEMENT_TERMS`' territory), so this is outside it: no agent puts the actor up for it, and none is owed commission.
  {
    id: 'harbor-line', kind: 'overseas-feature', fictional: true,
    project: 'Harbor Line', company: 'Larkspur Pictures', casting: 'Brandt Casting',
    medium: 'film', genres: ['conspiracy_thriller', 'thriller'],
    place: { city: 'Sydney', cityId: 'au-nsw-sydney', venue: 'a sound stage and the harbor’s wharves' },
    role: { part: 'Dana Kell', size: 'supporting', for: 'actress', about: 'An American insurance investigator flown to Sydney when a container ship’s cargo vanishes between two ports, who finds the dockworkers know exactly where it went.', task: 'camera', families: ['thriller', 'drama'], techniques: { screen: 2, character: 1 }, stakes: 2 },
    union: 'sag-aftra', contract: 'SAG-AFTRA Basic Agreement (Theatrical)',
    requirements: { ages: [24, 36], sends: ['headshot', 'resume', 'reel'] },
    stages: { audition: 'self-tape', callback: true },
    schedule: { kind: 'shoot', days: 8 },
    access: { agent: false, open: 'anyone' }, pay: 'sag-tv-week',
    trip: { supporter: 'Larkspur Pictures Australia', hotel: 'the production’s hotel near Circular Quay', pays: 'production', words: 'Larkspur Pictures books and pays for your flights, the cars and the hotel, as the game assumes for a studio feature shooting abroad.' },
    leadDays: 56,
  },
  {
    id: 'harbor-line-arden', kind: 'overseas-feature', fictional: true,
    project: 'Harbor Line', company: 'Larkspur Pictures', casting: 'Brandt Casting',
    medium: 'film', genres: ['conspiracy_thriller', 'thriller'],
    place: { city: 'Sydney', cityId: 'au-nsw-sydney', venue: 'a sound stage and the harbor’s wharves' },
    role: { part: 'Miles Arden', size: 'supporting', for: 'actor', about: 'The shipping line’s American lawyer, sent out to keep the loss quiet, who knows the cargo was never what the manifest said.', task: 'camera', families: ['thriller', 'drama'], techniques: { screen: 2, character: 1 }, stakes: 2 },
    union: 'sag-aftra', contract: 'SAG-AFTRA Basic Agreement (Theatrical)',
    requirements: { ages: [24, 36], sends: ['headshot', 'resume', 'reel'] },
    stages: { audition: 'self-tape', callback: true },
    schedule: { kind: 'shoot', days: 8 },
    access: { agent: false, open: 'anyone' }, pay: 'sag-tv-week',
    trip: { supporter: 'Larkspur Pictures Australia', hotel: 'the production’s hotel near Circular Quay', pays: 'production', words: 'Larkspur Pictures books and pays for your flights, the cars and the hotel, as the game assumes for a studio feature shooting abroad.' },
    leadDays: 56,
  },
  // Parts drawn from real productions (from 2026-10-23, brief 25's Module 2, criteria C8 to C10): each production and its
  // companies the catalog's (`content/catalog.ts`, as their pages had them on 2026-10-23); the part, its character, its
  // story and its dates the game's own, for work the game imagines after the research baseline. No casting director is
  // named and none is known; the pay is SAG-AFTRA's Day Performer minimum. Where either films isn't in any page this
  // build read, so the game sets the work in Los Angeles, its assumption, and says so; a trip from home, as the
  // production's.
  {
    id: 'nine-one-one-guest', kind: 'network-drama', fictional: false,
    drawn: { production: 'nine-one-one', season: 'a season of 9-1-1 the game imagines, after its tenth', placeWhy: 'The game sets this part’s shoot in Los Angeles: no page it read says where 9-1-1 films.' },
    project: '9-1-1', company: '20th Television', casting: 'the production’s casting office',
    medium: 'television', genres: ['police_procedural', 'disaster'],
    place: { city: 'Los Angeles', cityId: 'us-ca-losangeles', venue: 'a sound stage, where the game sets it' },
    role: { part: 'Reese Pike', size: 'co-star', for: 'either', about: 'A driver pinned in a car on a collapsing overpass, who keeps talking to the crew as they work their way down to the car.', task: 'camera', families: ['drama', 'crime'], techniques: { screen: 2, scene: 1 }, stakes: 1 },
    union: 'sag-aftra', contract: 'SAG-AFTRA TV/Theatrical',
    requirements: { ages: [22, 40], sends: ['headshot', 'resume', 'reel'] },
    stages: { audition: 'self-tape', callback: false },
    schedule: { kind: 'shoot', days: 2 },
    access: { agent: true, open: false }, pay: 'sag-tv-day',
    trip: { hotel: 'a hotel near the studio, the production’s', pays: 'production', words: '20th Television books and pays for your flights, the cars and the hotel, as the game assumes for a part cast from New York.' },
    leadDays: 28,
  },
  {
    id: 'abbott-guest', kind: 'network-comedy', fictional: false,
    drawn: { production: 'abbott-elementary', season: 'a season of Abbott Elementary the game imagines', placeWhy: 'The game sets this part’s shoot in Los Angeles: no page it read says where Abbott Elementary films.' },
    project: 'Abbott Elementary', company: 'Warner Bros. Television and 20th Television', casting: 'the production’s casting office',
    medium: 'television', genres: ['comedy'],
    place: { city: 'Los Angeles', cityId: 'us-ca-losangeles', venue: 'a sound stage, where the game sets it' },
    role: { part: 'Casey Marlow', size: 'co-star', for: 'either', about: 'A substitute sent for a week who is sure the job is beneath them, until the class wins them over by Friday.', task: 'camera', families: ['comedy'], techniques: { screen: 2, comedy: 1 }, stakes: 1 },
    union: 'sag-aftra', contract: 'SAG-AFTRA TV/Theatrical',
    requirements: { ages: [22, 40], sends: ['headshot', 'resume', 'reel'] },
    stages: { audition: 'self-tape', callback: false },
    schedule: { kind: 'shoot', days: 2 },
    access: { agent: true, open: false }, pay: 'sag-tv-day',
    trip: { hotel: 'a hotel near the studio, the production’s', pays: 'production', words: 'Warner Bros. Television and 20th Television book and pay for your flights, the cars and the hotel, as the game assumes for a part cast from New York.' },
    leadDays: 28,
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
  { id: 'termination', heading: 'Ending It', words: 'Either of you can end it by agreement at any time. You can end it if 90 days pass with no real offer of covered work through him, or, after 151 days, if you’ve had fewer than ten days of covered work in the last 91. Otherwise it ends when the year is up.', basis: 'verified', sources: [EQUITY_ENDS, SAG_ENDS] },
  { id: 'continuing', heading: 'What You Still Owe After It Ends', words: 'Commission stays owed on contracts you made while it ran, and on their renewals, whoever represents you when you’re paid. An offer the agent passed on in the term that you accept within 60 days after it ends is owed too.', basis: 'verified', sources: [EQUITY_ONGOING, EQUITY_TAIL] },
  { id: 'offer', heading: 'How Long The Offer Stands', words: 'Fourteen days. After that it lapses.', basis: 'simulation' },
];
