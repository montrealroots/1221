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
 * What an actor's craft is measured in: the areas the three years teach.
 * The scale, 0 to 100, is SLATE's; no school publishes one.
 */
export type Skill = 'acting' | 'voice' | 'speech' | 'body' | 'text' | 'singing' | 'screen';

export const SKILLS: readonly { id: Skill; label: string }[] = [
  { id: 'acting', label: 'Acting' },
  { id: 'voice', label: 'Voice' },
  { id: 'speech', label: 'Speech And Accents' },
  { id: 'body', label: 'Body And Movement' },
  { id: 'text', label: 'Text' },
  { id: 'singing', label: 'Singing' },
  { id: 'screen', label: 'On Camera' },
];

export type Term = 'fall' | 'spring';

/**
 * A required course: the Bulletin's code, title and teachers for 2026–2027,
 * the year and terms it runs, and the skill it trains. How often it meets
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
  skill: Skill;
  perWeek: number;
}

const both: readonly Term[] = ['fall', 'spring'];
const c = (code: string, name: string, teachers: string, year: 1 | 2 | 3, terms: readonly Term[], skill: Skill, perWeek: number): Course => ({ code, name, teachers, year, terms, skill, perWeek });

export const COURSES: readonly Course[] = [
  c('DRAM 103a/b', 'Acting I', 'Gregory Wallace', 1, both, 'acting', 3),
  c('DRAM 113a/b', 'Voice I', 'Walton Wilson', 1, both, 'voice', 2),
  c('DRAM 123a/b', 'Speech And Accents I', 'Julie Foh', 1, both, 'speech', 2),
  c('DRAM 133a/b', 'The Body As Source I', 'Erica Fae', 1, both, 'body', 2),
  c('DRAM 143a/b', 'Alexander Technique I', 'Fabio Tavares', 1, both, 'body', 2),
  c('DRAM 153a', 'Play', 'Justine Williams', 1, ['fall'], 'acting', 1),
  c('DRAM 163b', 'Text Analysis I: The Actor’s Table Work', 'Tamilla Woodard', 1, ['spring'], 'text', 1),
  c('DRAM 403a/b', 'Acting Intimacy And Combat For The Stage', 'Kelsey Rainwater, Michael Rossmy', 1, both, 'body', 1),
  c('DRAM 873a/b', 'Text And Context Across The Repertory', 'Paul Walsh', 1, both, 'text', 2),

  c('DRAM 163a', 'Text Analysis II', 'James Bundy', 2, ['fall'], 'text', 1),
  c('DRAM 203a/b', 'Acting II: Plays Of Extended And Heightened Language', 'Mary Lou Rosato', 2, both, 'acting', 3),
  c('DRAM 213a/b', 'Voice II', 'Walton Wilson, Grace Zandarski', 2, both, 'voice', 2),
  c('DRAM 223a/b', 'Speech And Accents II', 'Amanda Quaid', 2, both, 'speech', 2),
  c('DRAM 233a/b', 'The Body As Source II', 'Erica Fae', 2, both, 'body', 1),
  c('DRAM 243a/b', 'Alexander Technique II Tutorials', 'Bill Connington', 2, both, 'body', 1),
  c('DRAM 263a/b', 'Clown', 'Annelise Lawson, Chris Bayes', 2, both, 'acting', 1),
  c('DRAM 273a', 'Movement Invention II', 'Andrea Miller', 2, ['fall'], 'body', 1),
  c('DRAM 293b', 'The Greeks', 'Evan Yionoulis', 2, ['spring'], 'text', 3),
  c('DRAM 353a', 'Play With Text', 'Justine Williams', 2, ['fall'], 'text', 1),
  c('DRAM 405a/b', 'Advanced Principles Of Acting Stage Combat', 'Kelsey Rainwater, Michael Rossmy', 2, both, 'body', 1),
  c('DRAM 413a/b', 'Singing II And Tutorials', 'Glenn Seven Allen', 2, both, 'singing', 1),

  c('DRAM 190a', 'Shakespeare Practicum', 'Karin Coonrod', 3, ['fall'], 'text', 2),
  c('DRAM 253a', 'Commedia', 'Annelise Lawson', 3, ['fall'], 'acting', 2),
  c('DRAM 303a', 'Acting III', 'Ron Van Lieu, Tamilla Woodard, Evan Yionoulis', 3, ['fall'], 'acting', 2),
  c('DRAM 313a/b', 'Voice III', 'Walton Wilson, Grace Zandarski', 3, both, 'voice', 2),
  c('DRAM 323a/b', 'Speech And Accents III', 'Julie Foh, Amanda Quaid', 3, both, 'speech', 2),
  c('DRAM 343a/b', 'Alexander Technique III Tutorials', 'Eleanor Taylor', 3, both, 'body', 1),
  c('DRAM 363a', 'You Are The Creator', 'Joan MacIntosh', 3, ['fall'], 'acting', 1),
  c('DRAM 373a', 'Movement Invention III', 'Andrea Miller', 3, ['fall'], 'body', 1),
  c('DRAM 423a/b', 'Acting Through Song', 'Lonny Price', 3, both, 'singing', 1),
  c('DRAM 463a/b', 'On-Camera Acting Technique', 'Ellen Novack', 3, both, 'screen', 1),
  c('DRAM 273b', 'Character Analysis And Movement', 'Acting faculty', 3, ['spring'], 'body', 2),
  c('DRAM 473b', 'Taming The Cyclops', 'Ellen Novack', 3, ['spring'], 'screen', 1),
  c('DRAM 743b', 'Professional Preparation And Audition Workshop', 'Tamilla Woodard', 3, ['spring'], 'screen', 2),
  c('DRAM 793b', 'Actor Showcase', 'Gregory Wallace, Tamilla Woodard', 3, ['spring'], 'acting', 3),
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
