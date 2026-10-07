/**
 * SLATE — the David Geffen School of Drama at Yale University, where a life
 * begins: an admitted first-year in the MFA in Acting.
 *
 * Every figure is the school's own for 2026–2027, read on 2026-09-26 from the
 * Yale Bulletin for the school (published 30 August 2026) and the school's
 * pages. The research is in `probe/drama/`, outside the repository. What
 * SLATE had to estimate says so where it's used.
 */

import type { Money } from '../core/money';

export interface School {
  id: string;
  name: string;
  short: string;
  program: string;
  degree: string;
  /** New Haven, where the school is and the student lives. */
  cityId: string;
  /** Actors admitted each year. */
  classSize: number;
  /** Terms of study the tuition support covers, and so the length of the degree. */
  terms: number;
  dean: { name: string; title: string; since: string };
  actingChair: { name: string; title: string };
  /** The youngest a first-year can be: the MFA asks for a bachelor's degree, finished by twenty-one at the earliest. SLATE's reading of that rule. */
  minimumAge: number;
  source: string;
}

export const YALE_DRAMA: School = {
  id: 'yale-drama',
  name: 'David Geffen School of Drama at Yale University',
  /** What it's called in a word, on the School panel's button as a bank's name is on the Money panel's. */
  short: 'Yale',
  program: 'Acting',
  degree: 'MFA',
  cityId: 'us-ct-newhaven',
  classSize: 16,
  terms: 6,
  dean: { name: 'Evan Yionoulis', title: 'Dean And Artistic Director Of Yale Repertory Theatre', since: '2026-07-01' },
  actingChair: { name: 'Tamilla Woodard', title: 'Chair Of Acting' },
  minimumAge: 21,
  source: 'Yale Bulletin, David Geffen School of Drama 2026–2027 (https://bulletin.yale.edu/sites/default/files/david-geffen-school-of-drama-2026-2027.pdf); https://www.drama.yale.edu/',
};

/**
 * The year's cost of attendance, and what the school bills to the student's
 * account rather than paying out. Tuition is covered for every student by the
 * David Geffen gift; living expenses include the Yale Health hospitalization
 * and specialty plan, which is billed. Books and supplies run $913 to $2,373
 * by program, and the school doesn't say an actor's: the award takes the
 * most, SLATE's choice for a full award.
 */
export interface YearCost {
  year: string;
  tuition: Money;
  livingExpenses: Money;
  healthPlan: Money;
  books: Money;
  source: string;
}

export const COST_2026_27: YearCost = {
  year: '2026–2027',
  tuition: 40_750_00,
  livingExpenses: 28_028_00,
  healthPlan: 3_764_00,
  books: 2_373_00,
  source: 'Yale Bulletin 2026–2027, Tuition, Fees and Other Expenses; Yale Health student rates 2026–2027 (https://yalehealth.yale.edu/topic/student-rates-2026-2027)',
};

/** A day on the school's calendar, local to New Haven. */
export interface SchoolDate { year: number; month: number; day: number }

/**
 * When each term begins, the day the school's living-expense scholarship is
 * paid ("in two instalments, one at the start of the fall term and one at
 * the start of the spring term"). 2026–2027 is the Bulletin's; later years
 * aren't published yet and are SLATE's estimate by the same pattern: the fall
 * term on the fourth Monday of August, the spring term on the first Monday
 * from the third of January.
 */
export const TERM_STARTS_2026_27: { fall: SchoolDate; spring: SchoolDate } = {
  fall: { year: 2026, month: 8, day: 24 },
  spring: { year: 2027, month: 1, day: 4 },
};

/** The first-year's arrival: fall term registration, then orientation to the 29th, and classes from the 31st at nine. */
export const ORIENTATION_2026: { begins: SchoolDate; ends: SchoolDate; classesBegin: SchoolDate } = {
  begins: { year: 2026, month: 8, day: 24 },
  ends: { year: 2026, month: 8, day: 29 },
  classesBegin: { year: 2026, month: 8, day: 31 },
};

/**
 * What an actor's craft is measured in, in alphabetical order: the areas the
 * conservatories train (Yale's Bulletin, Juilliard's and RADA's course pages)
 * and the ones the business reads at an audition and on the job (cold
 * reading, audition technique, memorization, voice-over). Until 2026-09-27
 * there were seven, and acting was one number. The scale, 0 to 100, is
 * SLATE's; no school publishes one.
 */
export type Skill =
  | 'accents' | 'audition' | 'character' | 'classical' | 'clown' | 'coldReading' | 'comedy'
  | 'dance' | 'emotion' | 'improv' | 'intimacy' | 'memorization' | 'movement' | 'screen'
  | 'scene' | 'script' | 'singing' | 'speech' | 'combat' | 'voice' | 'voiceover';

export const SKILLS: readonly { id: Skill; label: string }[] = [
  { id: 'accents', label: 'Accents And Dialects' },
  { id: 'audition', label: 'Audition Technique' },
  { id: 'character', label: 'Character Work' },
  { id: 'classical', label: 'Classical Text' },
  { id: 'clown', label: 'Clown And Mask' },
  { id: 'coldReading', label: 'Cold Reading' },
  { id: 'comedy', label: 'Comedy' },
  { id: 'dance', label: 'Dance' },
  { id: 'emotion', label: 'Emotional Access' },
  { id: 'improv', label: 'Improvisation' },
  { id: 'intimacy', label: 'Intimacy' },
  { id: 'memorization', label: 'Memorization' },
  { id: 'movement', label: 'Movement' },
  { id: 'screen', label: 'On Camera' },
  { id: 'scene', label: 'Scene Study' },
  { id: 'script', label: 'Script Analysis' },
  { id: 'singing', label: 'Singing' },
  { id: 'speech', label: 'Speech' },
  { id: 'combat', label: 'Stage Combat' },
  { id: 'voice', label: 'Voice' },
  { id: 'voiceover', label: 'Voice-Over' },
];

/**
 * A save from before the 21 skills: each new one from the old area it grew
 * out of. Acting was scene study, character, emotional access, improvisation,
 * comedy, clown, the audition, cold reading and memorization at once; body,
 * movement, dance, combat and intimacy; text, script analysis and the
 * classics; speech and accents, both; voice-over, the voice.
 */
export const SKILL_FROM: Readonly<Record<Skill, string>> = {
  accents: 'speech', audition: 'acting', character: 'acting', classical: 'text', clown: 'acting', coldReading: 'acting',
  comedy: 'acting', dance: 'body', emotion: 'acting', improv: 'acting', intimacy: 'body', memorization: 'acting',
  movement: 'body', screen: 'screen', scene: 'acting', script: 'text', singing: 'singing', speech: 'speech',
  combat: 'body', voice: 'voice', voiceover: 'voice',
};

export type Term = 'fall' | 'spring';

/**
 * A required course: the Bulletin's code, title and teachers for 2026–2027,
 * the year and terms it runs, and the skills it trains, which are SLATE's
 * reading of the course's title and description: an acting class trains the
 * scene, the character and the feeling at once. Until 2026-09-27 each course
 * trained one of seven areas. How often it meets
 * isn't published: `perWeek` is SLATE's estimate, fifteen meetings a week in
 * all, three a day from nine, which is the five hours a day of class the
 * school's acting students describe.
 */
export interface Course {
  code: string;
  name: string;
  teachers: string;
  year: 1 | 2 | 3;
  terms: readonly Term[];
  skills: readonly Skill[];
  perWeek: number;
}

const both: readonly Term[] = ['fall', 'spring'];
const c = (code: string, name: string, teachers: string, year: 1 | 2 | 3, terms: readonly Term[], skills: readonly Skill[], perWeek: number): Course => ({ code, name, teachers, year, terms, skills, perWeek });

export const COURSES: readonly Course[] = [
  c('DRAM 103a/b', 'Acting I', 'Gregory Wallace', 1, both, ['scene', 'character', 'emotion'], 3),
  c('DRAM 113a/b', 'Voice I', 'Walton Wilson', 1, both, ['voice'], 2),
  c('DRAM 123a/b', 'Speech And Accents I', 'Julie Foh', 1, both, ['speech', 'accents'], 2),
  c('DRAM 133a/b', 'The Body As Source I', 'Erica Fae', 1, both, ['movement'], 2),
  c('DRAM 143a/b', 'Alexander Technique I', 'Fabio Tavares', 1, both, ['movement'], 2),
  c('DRAM 153a', 'Play', 'Justine Williams', 1, ['fall'], ['improv', 'emotion'], 1),
  c('DRAM 163b', 'Text Analysis I: The Actor’s Table Work', 'Tamilla Woodard', 1, ['spring'], ['script'], 1),
  c('DRAM 403a/b', 'Acting Intimacy And Combat For The Stage', 'Kelsey Rainwater, Michael Rossmy', 1, both, ['intimacy', 'combat'], 1),
  c('DRAM 873a/b', 'Text And Context Across The Repertory', 'Paul Walsh', 1, both, ['script'], 2),

  c('DRAM 163a', 'Text Analysis II', 'James Bundy', 2, ['fall'], ['script'], 1),
  c('DRAM 203a/b', 'Acting II: Plays Of Extended And Heightened Language', 'Mary Lou Rosato', 2, both, ['classical', 'scene', 'character', 'emotion'], 3),
  c('DRAM 213a/b', 'Voice II', 'Walton Wilson, Grace Zandarski', 2, both, ['voice'], 2),
  c('DRAM 223a/b', 'Speech And Accents II', 'Amanda Quaid', 2, both, ['accents', 'speech'], 2),
  c('DRAM 233a/b', 'The Body As Source II', 'Erica Fae', 2, both, ['movement'], 1),
  c('DRAM 243a/b', 'Alexander Technique II Tutorials', 'Bill Connington', 2, both, ['movement'], 1),
  c('DRAM 263a/b', 'Clown', 'Annelise Lawson, Chris Bayes', 2, both, ['comedy', 'clown', 'improv', 'emotion'], 1),
  c('DRAM 273a', 'Movement Invention II', 'Andrea Miller', 2, ['fall'], ['dance', 'movement'], 1),
  c('DRAM 293b', 'The Greeks', 'Evan Yionoulis', 2, ['spring'], ['classical', 'voice'], 3),
  c('DRAM 353a', 'Play With Text', 'Justine Williams', 2, ['fall'], ['emotion', 'script'], 1),
  c('DRAM 405a/b', 'Advanced Principles Of Acting Stage Combat', 'Kelsey Rainwater, Michael Rossmy', 2, both, ['combat'], 1),
  c('DRAM 413a/b', 'Singing II And Tutorials', 'Glenn Seven Allen', 2, both, ['singing'], 1),

  c('DRAM 190a', 'Shakespeare Practicum', 'Karin Coonrod', 3, ['fall'], ['classical', 'voice'], 2),
  c('DRAM 253a', 'Commedia', 'Annelise Lawson', 3, ['fall'], ['clown', 'comedy', 'movement', 'character'], 2),
  c('DRAM 303a', 'Acting III', 'Ron Van Lieu, Tamilla Woodard, Evan Yionoulis', 3, ['fall'], ['scene', 'character', 'emotion'], 2),
  c('DRAM 313a/b', 'Voice III', 'Walton Wilson, Grace Zandarski', 3, both, ['voice'], 2),
  c('DRAM 323a/b', 'Speech And Accents III', 'Julie Foh, Amanda Quaid', 3, both, ['speech', 'accents'], 2),
  c('DRAM 343a/b', 'Alexander Technique III Tutorials', 'Eleanor Taylor', 3, both, ['movement'], 1),
  c('DRAM 363a', 'You Are The Creator', 'Joan MacIntosh', 3, ['fall'], ['character', 'improv'], 1),
  c('DRAM 373a', 'Movement Invention III', 'Andrea Miller', 3, ['fall'], ['dance', 'movement'], 1),
  c('DRAM 423a/b', 'Acting Through Song', 'Lonny Price', 3, both, ['singing', 'emotion'], 1),
  c('DRAM 463a/b', 'On-Camera Acting Technique', 'Ellen Novack', 3, both, ['screen', 'scene'], 1),
  c('DRAM 273b', 'Character Analysis And Movement', 'Acting faculty', 3, ['spring'], ['character', 'movement'], 2),
  c('DRAM 473b', 'Taming The Cyclops', 'Ellen Novack', 3, ['spring'], ['screen'], 1),
  c('DRAM 743b', 'Professional Preparation And Audition Workshop', 'Tamilla Woodard', 3, ['spring'], ['audition', 'coldReading'], 2),
  c('DRAM 793b', 'Actor Showcase', 'Gregory Wallace, Tamilla Woodard', 3, ['spring'], ['scene', 'audition'], 3),
];

/**
 * The days classes meet in 2026–2027, from the Bulletin's calendar: fall
 * classes from 31 August to 11 December, spring from 11 January to 23 April,
 * less its holidays, Community Days (classes suspended), work periods and
 * recesses. Later years follow SLATE's estimate by the same pattern
 * (`systems/school.ts`).
 */
export const CLASSES_2026_27 = {
  fall: { from: '2026-08-31', to: '2026-12-11' },
  spring: { from: '2027-01-11', to: '2027-04-23' },
  /** Inclusive ranges with no classes. */
  off: [
    ['2026-09-07', '2026-09-07'], // Labor Day
    ['2026-09-30', '2026-09-30'], // Community Day
    ['2026-10-12', '2026-10-12'], // Indigenous Peoples’ Day
    ['2026-10-20', '2026-10-26'], // work period
    ['2026-11-03', '2026-11-03'], // Community Day
    ['2026-11-25', '2026-11-30'], // fall recess
    ['2027-01-18', '2027-01-18'], // Martin Luther King Jr. Day
    ['2027-02-18', '2027-02-19'], // Community Days
    ['2027-03-06', '2027-03-15'], // spring recess
    ['2027-03-30', '2027-04-01'], // work period
  ] as readonly (readonly [string, string])[],
};

/**
 * The protective equipment work-study requires (from 2026-10-08): the
 * school's cost of attendance "includes $150 for required personal
 * protective equipment for first-year students", and students "must be
 * appropriately dressed for the work-study tasks at hand including required
 * personal protective equipment such as steel-toed work shoes, as communicated
 * by the work-study supervisor" (research-yale-school-2.json). What else the
 * kit holds isn't published; the $150 is the school's figure.
 */
export const REQUIRED_PPE = { cost: 150_00, source: 'https://www.drama.yale.edu/admissions/financial-aid/ (cost of attendance 2026–2027); Yale Bulletin 2026–2027, work-study' } as const;

/** Work-study: the hours every student works a year, assigned and elective, and the rate (Bulletin 2026–2027; the rate from the school's financial aid pages). */
export const WORK_STUDY = { assignedHours: 150, electiveHours: 50, hourly: 23_00, source: 'Yale Bulletin 2026–2027, General Policies; https://www.drama.yale.edu/admissions/financial-aid/' } as const;

/**
 * Yale Rep's 2026–2027 production a first-year may understudy, from the
 * season page and the Equity audition notice: rehearsals and the run.
 * Performance days and times aren't published per performance; SLATE's
 * estimate is evenings Tuesday to Saturday at eight and a Sunday matinee at
 * two, a regional theater's usual week.
 */
export const SEAGULL_2027 = {
  name: 'The Seagull',
  by: 'Anton Chekhov, in a new version by Yura Kordonsky',
  director: 'Yura Kordonsky',
  rehearsals: { from: '2027-01-19', to: '2027-02-25' },
  run: { from: '2027-03-05', to: '2027-03-27' },
  roles: { actor: 'Konstantin', actress: 'Nina' },
  source: 'https://yalerep.org/about/2026-27-season/; Equity audition notice (https://www.broadwayworld.com/equity-audition/Yale-Repertory-Theatre-2026-27-Season-Yale-Repertory-Theatre-2026-51081)',
} as const;

/**
 * The Yale Cabaret, 217 Park Street: the students' own theater, run by a new
 * team of them each season (2026–27 is its 59th). A new show each production
 * week, Thursday to Saturday at eight, and Friday and Saturday at eleven too;
 * unpaid, and outside the curriculum. An acting student needs the chair's
 * approval first, nobody on academic warning may take part, and a conflict
 * with classes, casting or work-study is never resolved in the Cabaret's
 * favor (the Bulletin, 2026–27). The rehearsals, nine weekday evenings of
 * five hours before the production week, and one show a term, are SLATE's
 * estimate; 2026–27's dates weren't yet published.
 */
export const YALE_CABARET = {
  firstSeason: 59,
  rehearsalEvenings: 9,
  rehearsalFrom: 18,
  rehearsalMinutes: 300,
  /** Weekday (0 Sunday) and hour of each performance in the production week. */
  shows: [[4, 20], [5, 20], [5, 23], [6, 20], [6, 23]] as readonly (readonly [number, number])[],
  leadDays: 21,
  source: 'https://www.yalecabaret.org; https://bulletin.yale.edu (School of Drama, 2026–2027: the Yale Cabaret)',
} as const;

/**
 * The Yale Summer Cabaret, the students' summer theater in New Haven, three
 * shows a summer: 2026's ran 25 to 28 June, 23 July to 1 August and 13 to
 * 22 August, evenings at eight and Saturdays at two. A student continuing to
 * the next year may join its company. Later summers' dates, the three weeks'
 * afternoon rehearsals before each opening, the company being open to a
 * student in good standing, and its stipend of $375 a week, are SLATE's
 * estimate: how the company is chosen and what it pays aren't published.
 * The summer is the student's own: the Bulletin restricts outside work only
 * while classes are in session.
 */
export const SUMMER_CABARET = {
  runs: [[[6, 25], [6, 28]], [[7, 23], [8, 1]], [[8, 13], [8, 22]]] as readonly (readonly [readonly [number, number], readonly [number, number]])[],
  rehearsalWeeks: 3,
  rehearsalFrom: 13,
  rehearsalMinutes: 300,
  stipendWeekly: 375_00,
  applyBy: [4, 30] as const,
  source: 'https://www.summercabaret.org (2026 season); https://bulletin.yale.edu (School of Drama, 2026–2027)',
} as const;

/**
 * The School's own season, which the chair of Acting casts every student in
 * by assignment, the dean approving: "developmental needs of each student",
 * the needs of the project and "a balance of collaborative opportunity"
 * (the Bulletin, 2026–27). First-years are cast only from the second
 * semester. Each year: three directors' thesis productions, cast from the
 * second and third years, 2026–27's announced (Machinal from 9 October,
 * Marisol from 14 November, The Doctor from 23 January, each a week); the
 * Langston Hughes Festival of new plays in November, second and third
 * years; three Shakespeare Repertory Projects in the spring, third years
 * since the Practicum moved to the third year; and the Carlotta Festival of
 * New Plays in early May, first and second years, the third at the Actor
 * Showcase. Rehearsal calls Tuesday to Friday from three, six hours at
 * most. SLATE's estimate: the Hughes, Shakespeare and Carlotta dates, every
 * later year's by 2026–27's, the rehearsal weeks, the performances each
 * gives, and which of them the chair gives whom, by the class's standing in
 * acting, as the weights aren't published.
 */
export const SCHOOL_SEASON = {
  /** 2026–27's three, Machinal, Marisol and The Doctor, give the dates; a first-year is in none of them, so later years' are unnamed. */
  theses: [[[10, 9], [10, 16]], [[11, 14], [11, 20]], [[1, 23], [1, 29]]] as readonly (readonly (readonly [number, number])[])[],
  hughes: [[11, 5], [11, 7]] as readonly (readonly [number, number])[],
  shakespeare: [[[2, 5], [2, 6]], [[2, 27], [3, 1]], [[4, 2], [4, 3]]] as readonly (readonly (readonly [number, number])[])[],
  carlotta: [[5, 4], [5, 12]] as readonly (readonly [number, number])[],
  carlottaShows: 4,
  rehearsalWeeks: { thesis: 5, hughes: 3, shakespeare: 4, carlotta: 3 },
  source: 'https://bulletin.yale.edu (School of Drama, 2026–2027: Acting, Production, Casting); https://drama.yale.edu/productions; LORT Rule 39(E)',
} as const;

/**
 * The curriculum's own labs and showings (the Bulletin, 2026–27): Drama 50,
 * The Theatrical Event, a three-week laboratory in the first term in
 * residence; the New Play Lab, the first-year playwrights' new one-act
 * plays workshopped for three weeks by the first-year actors, directors and
 * dramaturgs in the spring; You Are the Creator, each third-year's own solo
 * piece, made across the fall and shared with the Acting program at the
 * start of the second semester; and the filmed monologues posted at the end
 * of the final term. SLATE's estimate: when in the term each lab falls
 * (Drama 50 from the second week of classes, the New Play Lab after the
 * spring recess), its afternoon hours, and the showing's day.
 */
export const LABS = {
  drama50: { name: 'Drama 50: The Theatrical Event', term: 0, weeks: 3 },
  newPlayLab: { name: 'The New Play Lab', term: 1, weeks: 3 },
  creator: { name: 'You Are The Creator', term: 5 },
  from: 15,
  minutes: 180,
  source: 'https://bulletin.yale.edu (School of Drama, 2026–2027: DRAM 50a, DRAM 51b, DRAM 363a, the acting plan of study)',
} as const;
