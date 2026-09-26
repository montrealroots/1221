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
  dean: { name: 'Evan Yionoulis', title: 'Dean, and Artistic Director of Yale Repertory Theatre', since: '2026-07-01' },
  actingChair: { name: 'Tamilla Woodard', title: 'Chair of Acting' },
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
