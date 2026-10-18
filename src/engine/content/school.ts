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
  /** The class SLATE seats: the school admits 15 to 17 actors a year (its admissions FAQ), and SLATE takes 16. */
  classSize: 16,
  terms: 6,
  dean: { name: 'Evan Yionoulis', title: 'Dean And Artistic Director Of Yale Repertory Theatre', since: '2026-07-01' },
  actingChair: { name: 'Tamilla Woodard', title: 'Chair Of Acting' },
  /**
   * SLATE's youngest admit, from the MFA's bachelor's degree. A simplification: the program also admits actors
   * without a degree to the Certificate in Drama, five years out of high school, and an early graduate could be younger.
   */
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

/**
 * Whether the need assessment finds need, by the family's means: a wealthy family's rule it out, and with them the
 * living-expense scholarship, conversion to grant aid and the aid a leave returns. The one rule both `hasNeed`
 * (`systems/school.ts`, a person) and creation's `findsNeed` (`world/bootstrap.ts`, a family not yet a person) read,
 * from 2026-10-14: until then each wrote its own copy, and no test held them to agree.
 */
export const needFor = (family: 'wealthy' | undefined): boolean => family !== 'wealthy';

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
  { id: 'emotion', label: 'Emotional Depth' },
  { id: 'improv', label: 'Improvisation' },
  { id: 'intimacy', label: 'Intimacy' },
  { id: 'memorization', label: 'Memory' },
  { id: 'screen', label: 'On Camera' },
  { id: 'movement', label: 'Physical Expression' },
  { id: 'scene', label: 'Scene Study' },
  { id: 'script', label: 'Script Analysis' },
  { id: 'singing', label: 'Singing' },
  { id: 'speech', label: 'Speech' },
  { id: 'combat', label: 'Stage Combat' },
  { id: 'voice', label: 'Vocal Expression' },
  { id: 'voiceover', label: 'Voice-Over' },
];

/**
 * Each skill as a sentence says it after “your” (from 2026-10-17, brief 14's editorial review): the label lowercased
 * read “Your on camera and scene study carried it.” and “It asked for more clown and mask than you have yet.” The words
 * are the glossary's (Material: Techniques It Asks).
 */
export const SKILL_WORDS: Readonly<Record<Skill, string>> = {
  accents: 'accents and dialects', audition: 'audition technique', character: 'character work', classical: 'classical text work',
  clown: 'clowning', coldReading: 'cold reading', comedy: 'comic timing', dance: 'dance', emotion: 'emotional depth',
  improv: 'improvisation', intimacy: 'intimacy work', memorization: 'memory', screen: 'on-camera work', movement: 'physical expression',
  scene: 'scene study', script: 'script analysis', singing: 'singing', speech: 'speech', combat: 'stage combat',
  voice: 'vocal expression', voiceover: 'voice-over work',
};

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
    // Corrected 2026-10-10 against the 2026–27 Bulletin, where classes resume the day after each range ends and a
    // recess begins at midnight: the work period ran to the 26th, the fall recess from the 25th to the 30th, the spring
    // recess to the 15th and the spring work period to 1 April, a class day each.
    ['2026-10-20', '2026-10-25'], // work period
    ['2026-11-03', '2026-11-03'], // Community Day
    ['2026-11-26', '2026-11-29'], // fall recess
    ['2027-01-18', '2027-01-18'], // Martin Luther King Jr. Day
    ['2027-02-18', '2027-02-19'], // Community Days
    ['2027-03-06', '2027-03-14'], // spring recess
    ['2027-03-30', '2027-03-31'], // work period
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
 * outside the curriculum (and unpaid for a performer here, SLATE's reading:
 * the Cabaret offers paid elective work-study, which SLATE doesn't keep). An acting student needs the chair's
 * approval first, nobody on academic warning may take part, and a conflict
 * with classes, casting or work-study is never resolved in the Cabaret's
 * favor (the Bulletin, 2026–27). The rehearsals, nine weekday evenings of
 * five hours before the production week, and one show a term, are SLATE's
 * estimate; Season 59 opened on 17 September 2026, which SLATE's own
 * production weeks don't follow.
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
 * 22 August. Its curtain times (evenings at eight, Saturdays at two), a
 * student continuing to the next year joining its company, the April 30
 * deadline to join, later summers' dates, the three weeks'
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
 * semester. Each year (which years are cast in each is SLATE's reading, not
 * published): three directors' thesis productions, cast from the second and
 * third years, 2026–27's announced (Machinal from 9 October,
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
/**
 * What the School asks of a student, as the faculty set it out at orientation and the Bulletin keeps it (2026–27,
 * research-yale-student-policies.json), from 2026-10-10: until then the faculty session named the teachers and said
 * nothing a student needed. Each line is the Bulletin's, with its page; what SLATE does with it is said beside.
 */
export const SCHOOL_POLICIES: readonly { rule: string; page: string }[] = [
  { rule: 'Attendance is required at every class, rehearsal and call. If you’re running late for a call, tell the stage manager at least thirty minutes ahead.', page: 'p.149' },
  { rule: 'If you’re ill, email your teachers and copy the program chair, and make up the work you missed on the schedule each teacher sets. In the game, press Call In Sick, and make up an Incomplete on the Standing tab.', page: 'p.149' },
  { rule: 'Every acting course is Pass/Fail. An Incomplete is due within a month of the term’s end, or it becomes a Permanent Incomplete with no credit.', page: 'pp.26, 152' },
  { rule: 'Casting is the chair’s. Missed calls, or a want of collaboration, discipline or reliability in class or production, may take an actor out of the casting pool. The game counts two missed calls in a term, labs and rehearsals together.', page: 'p.146' },
  { rule: 'Failing to be available as an understudy is a grave breach of professionalism, and may be grounds for dismissal.', page: 'p.146' },
  { rule: 'No student on academic warning may take part in the Yale Cabaret, which also needs the chair’s approval and never wins a conflict.', page: 'pp.147–148' },
  { rule: 'Work-study is 200 hours a year, 150 assigned and 50 elective. Failing to do assigned work-study may lead to academic warning or dismissal.', page: 'p.147' },
  { rule: 'The steps are a notice of concern, then academic warning, then dismissal, and the faculty may act at any time. A dismissed student may not return; one who withdraws may apply to.', page: 'pp.154, 157–160' },
  { rule: 'The degree is recommended by a majority vote of the faculty, for a student who has completed every course and requirement.', page: 'p.151' },
];

export const LABS = {
  drama50: { name: 'Drama 50: The Theatrical Event', term: 0, weeks: 3 },
  newPlayLab: { name: 'The New Play Lab', term: 1, weeks: 3 },
  creator: { name: 'You Are The Creator', term: 5 },
  from: 15,
  minutes: 180,
  source: 'https://bulletin.yale.edu (School of Drama, 2026–2027: DRAM 50a, DRAM 51b, DRAM 363a, the acting plan of study)',
} as const;

/**
 * Yale's cost of attendance grew, 2022–23 to 2026–27, 3.22% a year in
 * tuition, 8.10% in the Yale Health plan and 5.82% in living expenses
 * without it (the Bulletins, compounded). Later years aren't published, and
 * SLATE carries each on at its rate. In `content/career.ts` until 2026-10-09.
 */
export const YALE_COST_GROWTH = {
  tuition: 0.0322,
  healthPlan: 0.0810,
  living: 0.0582,
  source: 'https://bulletin.yale.edu/sites/default/files/david-geffen-school-of-drama-2022-2023.pdf through -2026-2027.pdf',
} as const;

/**
 * A leave of absence (Bulletin 2026–2027 pp.157–160, 175–176; research-yale-leave.json). Documented: personal, medical
 * or parental, for one, two or three terms, approved by the chair and the dean; a personal leave after one term
 * completed, current with requirements, normally not after the tenth day of a term, and not for a professional
 * commitment; a medical one on a Yale Health physician's written recommendation, and back only with their permission;
 * no aid while on leave; student cover ends the day it's granted, back to the insurance term's start with the fee
 * refunded where the registrar heard by the first day of classes; Affiliate cover at $5,416 a term, the student fee
 * paid credited against it, asked for by 15 September or 31 January or within 30 days of the leave, whichever is later,
 * and paid by the School for a medical leave, to three terms; notice of return in writing eight weeks before the leave
 * ends, and a student who doesn't return, with no extension, is dismissed. SLATE's: until 2026-10-10 the leave was a
 * year, two terms, whatever was asked, because the acting courses run fall to spring in sequence; since then the
 * length is the student's, one to three terms, refused where it would bring them back in the other season to the
 * second halves of year-long courses (`leaveLengths`), and `terms` is the length asked for when none is given. The
 * decision comes within five working days, or by the start of the term the leave begins with if that comes first
 * (`requestLeave`), working days being Yale’s, Monday to Friday less its holidays and recess days (`yaleHoliday`), from
 * 2026-10-13: until then Monday to Friday, Christmas Day among them. A mandatory medical leave was modeled from 2026-10-10 (`MANDATORY_LEAVE`); this said it wasn’t
 * until 2026-10-12. A parental leave isn't modeled.
 */
export const LEAVE_RULES = {
  terms: 2,
  maxTerms: 3,
  personalByClassDay: 10,
  decideWorkingDays: 5,
  noticeWeeks: 8,
  affiliatePerTerm: 5_416_00,
  affiliateDays: 30,
  /** Fall's and spring's Affiliate deadlines, month and day. */
  affiliateBy: { fall: [9, 15], spring: [1, 31] },
  /** Yale Health's insurance terms begin 1 August and 1 February. */
  insuranceTermFrom: { fall: [8, 1], spring: [2, 1] },
  /** A physician's recommendation reads care or an injury within so many days; SLATE's estimate of "must interrupt study". */
  medicalLookbackDays: 30,
  /** The tuition rebate schedule, which recalculates aid on a leave mid-term: share of the term passed, share rebated (p.183). */
  rebate: [[0.1, 1], [0.25, 0.5], [0.5, 0.25]],
  source: 'Yale Bulletin 2026–2027, David Geffen School of Drama, pp.157–160, 175–176, 182–183; yalehealth.yale.edu Affiliate rates 2026–27',
} as const;

/**
 * Failing and finishing late (Bulletin 2026–2027 pp.182, 184, 190, 194). Documented: the degree within nine semesters,
 * with leave of no more than three; tuition support ordinarily for six terms, and "exceptions are extremely rare";
 * disqualification at two Failures in a term, three by the end of the second, four by the third, five by the fourth,
 * six by the fifth, or seven in all; a late payment fee of $125 a month, to $375 a term, and a financial hold that
 * blocks registration and the diploma. Not found: any rule for repeating a failed acting course. SLATE's faculty model,
 * labeled so on the screen: a year with a course failed can be repeated on the chair's and the dean's approval (a year
 * repeated once isn't approved again, from 2026-10-10: until then one repeat in all), or, after the last year, the
 * failed courses retaken in an additional term of their season (`school.request_extra_term`),
 * as a program "may vary specific requirements on an individual basis with the approval of the dean" (p.148), asked for
 * at the year's end, or within thirty days of a last term's; decided in five working days; refused past nine semesters.
 * Disqualification is the faculty's review (`facultyReview`), since the Bulletin says "may".
 */
/**
 * A mandatory medical leave (Bulletin 2026–2027 p.159; research-yale-leave-2.json). Documented: the director of Yale
 * Health or the chief of Mental Health and Counseling recommends it and the dean decides; on danger to self or others,
 * serious disruption of the academic community, or refusing to cooperate with the assessment; "each case will be
 * assessed individually", by "the level of risk presented and the availability of reasonable modifications"; an
 * appeal in writing to the dean within seven days of its effective date, with no stay; and back only on a Yale Health
 * physician's permission. Not found: notice before it, a meeting, or how long it runs. SLATE's model, labeled so: what
 * starts an assessment is the student's observed function, never a diagnosis (two stays in hospital in four weeks, or
 * most of a term's class days missed ill); the assessment weighs whether they're fit now, will be within two weeks
 * (when the modifications the School already makes, excused absences and Incompletes, are enough), or not; an
 * assessment not come to is the Bulletin's refusal, and a leave is recommended on it whatever the records say (from
 * 2026-10-12: until then not coming changed only the finding's sentence); the dean decides the next working day; and
 * an appeal is upheld unless the student is cleared and the term is young enough to resume.
 */
export const MANDATORY_LEAVE = {
  lookbackDays: 28,
  stays: 2,
  minClassDays: 12,
  excusedShare: 0.6,
  soonDays: 14,
  assessWorkingDays: 2,
  assessMinutes: 60,
  appealDays: 7,
  appealDecideWorkingDays: 5,
  /** An appeal overturns a leave only while this share of the term's classes is still ahead. */
  resumeWithin: 0.5,
  source: 'Yale Bulletin 2026–2027, David Geffen School of Drama, p.159',
} as const;

export const EXTENDED_STUDY = {
  maxSemesters: 9,
  supportedTerms: 6,
  requestDays: 30,
  decideWorkingDays: 5,
  dueDays: 30,
  lateFee: 125_00,
  lateFeeTermCap: 375_00,
  disqualify: { inOneTerm: 2, byTerm: { 2: 3, 3: 4, 4: 5, 5: 6 } as Readonly<Record<number, number>>, total: 7 },
  source: 'Yale Bulletin 2026–2027, David Geffen School of Drama, pp.148, 182, 184, 190, 194',
} as const;

/**
 * Work-study's limits (research-yale-leave.json): no more than 19 hours a week across all Yale jobs during academic
 * terms, 40 in recess, summer and leave; hours short of the assigned 150 through the School's or the Rep's conflicts,
 * illness or injury converted to grant-in-aid for a student on aid, up to 150, processed in January and May (p.189).
 * Not found: how Yale bounds the week; SLATE's is Monday to Sunday, New Haven time.
 */
export const WORK_LIMITS = { weekHours: 19, recessWeekHours: 40, convertibleHours: 150, convertMonths: [1, 5], source: 'https://your.yale.edu (student employment hours); Yale Bulletin 2026–2027 pp.147, 189; research-yale-leave.json' } as const;
