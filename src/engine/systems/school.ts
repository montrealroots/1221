/**
 * SLATE — drama school, where the life begins (`content/school.ts`).
 *
 * The player arrives as an admitted first-year in the MFA in Acting at the
 * David Geffen School of Drama at Yale on the first day of the fall term,
 * one of the sixteen the faculty chose from that year's auditions. An
 * actor's craft is 0 to 100 in each of the skills the three years teach, and
 * the player's starts among the class's strongest, not above everybody: the
 * fifteen classmates grow too, each with their own drive, and are cast beside
 * and against the player every term. Until 2026-09-28 the player began above
 * every classmate in every area.
 *
 * - **Money.** Tuition is billed to the student's Yale account every term and
 *   met by the tuition scholarship every student has had since the David
 *   Geffen gift. The Yale Health plan is billed there too. Aid for living
 *   costs is need-based and assesses the family: where there's need, a
 *   living-expense scholarship meets it and what's left after the health
 *   plan is paid into the bank at the start of each term; where the family's
 *   means rule need out, as the player's do, the bank pays the health plan
 *   and everything else. (Until 2026-09-26 the award covered the whole cost
 *   whatever the family, which Yale doesn't do.)
 * - **Classes.** On the Bulletin's class days (a holiday, a Community Day, a
 *   work period or a recess has none), nine to three, the year's required
 *   courses in a weekly timetable that's SLATE's estimate. Present and awake,
 *   each course grows its skill by how ready they are and less the better
 *   they already are; asleep, or not in New Haven, it's an absence, excused
 *   only if they called in sick when unwell.
 * - **Work-study.** A six-hour assigned shift each Saturday of the class
 *   weeks, 150 hours a year, and up to 50 elective hours on the evenings they
 *   ask for, at $23 an hour, paid every Friday for the week's hours.
 * - **Casting.** From the second term the chair casts every student each
 *   term in one of the School's own productions (`SCHOOL_SEASON`): the
 *   Carlotta Festival, a directors' thesis, the Langston Hughes Festival or
 *   a Shakespeare Repertory Project, by year and standing; and once a year,
 *   in good standing, at Yale Rep, most often to understudy, on call at
 *   every performance. Missed rehearsal calls take an actor out of the
 *   casting pool; a missed performance or understudy call is a grave breach.
 *   Until 2026-09-27 only the class's best actor went to Yale Rep, and
 *   everybody else was in a project named by the term.
 * - **Labs.** Drama 50's three weeks in the first fall, the New Play Lab's
 *   three in the first spring, and the third year's solo showing, You Are
 *   The Creator, each afternoon a call like a rehearsal's (`LABS`); and at
 *   the degree, the filmed monologues a reel can be cut from.
 * - **The Cabaret and the summer.** A show a term at the Yale Cabaret, the
 *   students' own theater, on the chair's approval, never on academic
 *   warning, in a week clear of recesses and casting; and in the spring of
 *   the first and second years, the Yale Summer Cabaret's company for the
 *   summer, three shows and a weekly stipend, a missed performance and it's
 *   over. Until 2026-09-27 the terms had nothing outside the curriculum and
 *   the summers nothing at all.
 * - **Evaluation.** At the end of each term's classes the faculty weigh
 *   attendance and growth against the class: good standing, a notice of
 *   academic concern, academic warning, dismissal, with no readmission, as
 *   the Bulletin sets it out. After six terms in standing, the degree.
 */

import type { Simulation } from '../core/simulation';
import { personalityOf } from './personality';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { formatDate, formatTime, instantFromZoned, zonedParts, MS_DAY, type Instant } from '../core/time';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import {
  CLASSES_2026_27, COST_2026_27, COURSES, LABS, ORIENTATION_2026, SCHOOL_SEASON, SEAGULL_2027, SKILLS, SKILL_FROM, SUMMER_CABARET, TERM_STARTS_2026_27, WORK_STUDY, YALE_CABARET, YALE_DRAMA,
  type Course, type SchoolDate, type Skill, type Term,
} from '../content/school';
import { readiness } from './life';
import type { ClassmateCareer } from './rivals';
import { COMPANY_READ, NEW_PLAYS_READ, REP_PLAYS, SHAKESPEARE_PLAYS, SIZE_WORD, SUMMER_PLAYS, THESIS_PLAYS, unnamedParts, type Part, type PartSize } from '../content/plays';
import { enjoyWork, feel } from './enjoyment';
import { payFromCurrent } from './household';
import { SHOWCASE_KIND, armSummerWork, beginCareer, bookShowcase } from './career';
import { ATTRIBUTES, earn, nerves, nudge } from './attributes';
import { YALE_COST_GROWTH } from '../content/career';
import { recordScholarship, recordWages, yearOf } from './earnings';
import { computeAnnualTax } from '../content/tax';
import { armTaxes } from './taxreturn';
import { armHealth, inHospital } from './health';
import { chanceOver, laidUp, mayHurt } from './injury';
import { INJURY } from '../content/injury';
import { exerts } from './body';
import { BODY } from '../content/body';
import { knowTheClass } from './people';
import { payeeAccount } from './cash';

export type Craft = Record<Skill, number>;
export type Standing = 'good' | 'concern' | 'warning' | 'dismissed' | 'graduated';

/** A standing as the school names it. */
export const STANDING_LABEL: Record<Standing, string> = {
  good: 'Good Standing',
  concern: 'Academic Concern',
  warning: 'Academic Warning',
  dismissed: 'Dismissed',
  graduated: 'Graduated',
};

/** A term's attendance and growth so far, for its evaluation. */
export interface TermTally {
  classDays: number;
  attended: number;
  excused: number;
  /** Rehearsal and performance calls made, and answered. */
  calls: number;
  answered: number;
  /** Assigned work-study shifts, and worked. */
  shifts: number;
  worked: number;
  /** Performances or understudy calls missed: grave breaches of professionalism. */
  breaches: number;
  craftAtStart: Craft;
  /** Each classmate's mean craft when the term began. */
  classAtStart: number[];
  /** Each classmate's craft, skill by skill, when the term began: what the teachers' notes weigh a course's skills against. */
  classCraftAtStart?: Craft[];
}

/** A part played with nights to it: a School production's, the Rep's, a Cabaret show's or a Summer Cabaret play's. */
export interface Run { production: string; role: string; play?: string; by?: string; kind?: Casting['kind']; size?: PartSize; nights?: Partial<Record<Night, number>>; note?: string; noteSkill?: Skill; noteLevel?: number }

/** A student's last part, which the chair reads when casting the next: its size, and how the nights went on average (`NIGHT_VALUE`). */
export interface LastWork { size: PartSize; nights?: number; heeded?: boolean }

/**
 * A classmate: a name, a craft, whether they're cast as an actor or an
 * actress, their drive (how much they bring to a day, against an ordinary
 * classmate's), and their last part. Until 2026-09-28 a classmate was a name
 * and a craft, all of them equally driven, and cast in nothing.
 */
export interface Classmate {
  name: string; craft: Craft; title?: 'actor' | 'actress'; drive?: number; last?: LastWork;
  /** How far their craft can grow (`CEILING`). */
  ceiling?: Craft;
  /** Their presence, drawn once as the player's is (`classmatePresence`). */
  presence?: number;
  /** Where they stand with the player, -100 to 100: a cast shared draws them closer, a lead taken from the other apart (`BONDS`). */
  bond?: number;
  /** Their life after the degree: an agency, and the work they book (`systems/rivals.ts`). */
  career?: ClassmateCareer;
}

/**
 * How a classmate comes to be a friend or a rival, SLATE's estimate: a
 * production shared, weeks in a rehearsal room together, is ten toward a
 * friend; a lead written for the one that went to the other, twelve toward a
 * rival. From 25 a friend, from 50 a close one, from -20 a rival. Each friend
 * in a cast lifts a night's morale a point, to three; a cast without one
 * weighs two on somebody who needs people, by how much they do. How fast a
 * bond grows and how hard a slight cuts are the traits' (`bondWarmth`,
 * `bondWound`), as is what the company's worth (`company`).
 */
export const BONDS = { shared: 10, leadTaken: 12, friend: 25, close: 50, rival: -20, perFriend: 1, most: 3, alone: 2 } as const;

/** What the friends in a night's cast are worth to the mood, by how much this person needs company: none weighs on somebody who does. */
export function castCompany(person: Person, friends: number): number {
  const company = personalityOf(person, 'company');
  if (friends) return Math.min(BONDS.most, friends * BONDS.perFriend) * company;
  return company > 1 ? -BONDS.alone * (company - 1) : 0;
}

/** A bond's move as this person takes it: closer by their warmth, apart by how a slight cuts them. */
export function bondMove(person: Person, move: number): number {
  return move >= 0 ? move * personalityOf(person, 'bondWarmth') : move * personalityOf(person, 'bondWound');
}

/** What a classmate is to the player, in a word, if anything yet. */
export function bondWord(bond: number | undefined): 'Close Friend' | 'Friend' | 'Rival' | undefined {
  if (bond === undefined) return undefined;
  return bond >= BONDS.close ? 'Close Friend' : bond >= BONDS.friend ? 'Friend' : bond <= BONDS.rival ? 'Rival' : undefined;
}

export interface TermReview {
  term: number; standing: Standing; attendance: number; growth: number; classGrowth: number; reason: string;
  /** The term's work on stage, its nights on average (`NIGHT_VALUE`), where a run had begun by the evaluation. */
  work?: number;
  /** Each course's teacher's note (`teachersNotes`). */
  notes?: { course: string; teacher: string; note: string }[];
}

export interface Casting {
  production: string;
  role: string;
  /** The play, where it's named, its playwright, the part's size, and the class's others in it and their parts (`content/plays.ts`). */
  play?: string;
  by?: string;
  size?: PartSize;
  cast?: { name: string; part: string }[];
  /** The nights played, by how they went (`NIGHT_VALUE`), and the director's note once the run is over. */
  nights?: Partial<Record<Night, number>>;
  note?: string;
  /** The skill the note named, and where it stood: taken, it reads at the next casting (`LastWork.heeded`). */
  noteSkill?: Skill;
  noteLevel?: number;
  kind: 'understudy' | 'role' | 'project' | 'thesis' | 'hughes' | 'shakespeare' | 'carlotta';
  term: number;
  /** Went on as an understudy, or performed. */
  performed: number;
}

export interface SchoolRecord {
  classOf: number;
  termsBegun: number;
  standing: Standing;
  /** In the casting pool: out after missed rehearsal calls, back after a good evaluation. */
  castable: boolean;
  classmates: Classmate[];
  tally: TermTally;
  /** The player's last part, for the chair's next casting. */
  lastWork?: LastWork;
  /** The term's casting across the class: who's in what, as which part. */
  around?: { term: number; list: { name: string; production: string; part: string; size?: PartSize }[] };
  /** What they performed in at school, for the résumé: a production played, or understudied and gone on in. */
  credits?: { production: string; role: string; kind: Casting['kind'] | 'cabaret' | 'summer'; year: number; wentOn: number; size?: PartSize }[];
  /** A Cabaret show this term: which term, its production week's Thursday, the shows played, and the part and its nights (`Run`). */
  cabaret?: { term: number; week: string; performed: number } & Partial<Run>;
  /** The Summer Cabaret company: the summer's year, the shows played in each run, whether it's over, and each show's play, part and nights. */
  summer?: { year: number; played: number[]; until: Instant; out?: boolean; shows?: Run[] };
  /** The third year's filmed monologues, posted at the end of the final term: footage a reel can be cut from. */
  filmed?: boolean;
  history: TermReview[];
  casting?: Casting;
  /** A Yale Rep assignment beside it: an understudy, or a role at a director's invitation. */
  rep?: Casting;
  /** The year's work-study: hours worked, elective hours asked for, owed on Friday, and assigned hours booked (to `WORK_STUDY.assignedHours`). */
  workStudy: { electiveHours: number; owedHours: number; assignedBooked?: number };
  /** The day, `YYYY-MM-DD`, they called in sick, if today. */
  sickDay?: string;
}

export const TERM_KIND = 'school.term';
export const WEEK_KIND = 'school.week';
export const CLASSES_KIND = 'school.classes';
export const SHIFT_KIND = 'school.shift';
export const PAYDAY_KIND = 'school.payday';
export const CALL_KIND = 'school.call';
export const EVALUATION_KIND = 'school.evaluation';
export const COMMENCEMENT_KIND = 'school.commencement';
export const CABARET_KIND = 'school.cabaret';
export const SUMMER_KIND = 'school.summer';
export const STIPEND_KIND = 'school.stipend';
export const RECESS_KIND = 'school.recess';
export const LAB_KIND = 'school.lab';
export const COMPANY_KIND = 'school.company';

/** SLATE's estimates of what the school doesn't publish, each named where it's used. */
export const ESTIMATE = {
  /** How much a session can move a skill, and how much less the better it already is. It was 0.55 until 2026-09-28, when a class that rests as students do came to 83 in acting by graduation, and the player to 92. */
  sessionGain: 0.42,
  /**
   * How ready a classmate is on an ordinary day, as readiness over 80: a
   * student who sleeps and eats as students do, before their own drive. It
   * was 0.85 until 2026-09-28, and a player who looked after themselves grew
   * a third faster than the class and finished first in every one of twelve
   * played lives.
   */
  classmateFocus: 1,
  /** How often a classmate is in class. */
  classmateAttendance: 0.97,
  /** How far a classmate's drive runs either side of an ordinary classmate's: 0.75 to 1.25, so the most driven can outgrow a player who looks after themselves. */
  driveSpread: 0.25,
  /**
   * A student's talent on admission, 40 to 56 with most near 48, and each
   * skill up to seven points either side of it; the player's talent from 50,
   * the class's top quarter: among its strongest, not above everyone.
   */
  talent: { from: 40, to: 56, spread: 7, playerFrom: 50 },
  /**
   * The chair's balance of opportunity (`cast`): a lead last time counts two
   * points against the next lead, a featured part two for it; and how the
   * last run's nights went, a point and a half a band. SLATE's estimate.
   */
  /** And a director's note taken: the skill it named grown a point and a half by the next casting reads a point and a half better. SLATE's estimate. */
  casting: { balance: { lead: -2, supporting: 0, featured: 2 } as Record<PartSize, number>, nights: 1.5, heeded: 1.5, heedGain: 1.5 },
  /**
   * A night's reading (`nightOf`): readiness, a point of the part's craft
   * above what the part asks worth a fortieth (in a School production, what
   * the class's best have by the second year: a lead 62, a supporting part 57
   * and a featured one 52; at Yale Rep, a professional company, 82, 76 and
   * 70), and luck a fifth either side; under 0.75 an off
   * night, under 0.98 solid, under 1.18 strong, past it remarkable. Until
   * 2026-09-28 every part asked 65, and a strong actor's nights were nearly
   * all remarkable from the second year. What a
   * band does: a strong or remarkable night lifts morale, and a remarkable
   * one the presence and, at the Rep, the reputation; an off night stings.
   */
  nights: { par: { school: { lead: 62, supporting: 57, featured: 52 }, rep: { lead: 82, supporting: 76, featured: 70 } } as Record<'school' | 'rep', Record<PartSize, number>>, perPoint: 40, luck: 0.4, off: 0.75, solid: 0.98, strong: 1.18, lift: 3, sting: 3, presence: 0.02, reputation: 0.3 },
  /** What a day's classes, a rehearsal, a performance and a shift take out of a body, in energy. */
  energy: { classes: 6, rehearsal: 8, performance: 10, shift: 4 },
  /** The chance, each performance, that an understudy goes on. */
  goesOn: 0.02,
  /** How many hours before a performance an understudy on call hears whether they're on: at five for an eight o'clock curtain. */
  onCallAhead: 3,
  /** Attendance under this, or growth under this share of the class's, is short of the program's requirements. */
  attendanceFloor: 0.9,
  growthFloor: 0.5,
  /**
   * A term's work on stage, read at the evaluation once a run has had three
   * nights: mostly off (a mean of -0.5 or under, `NIGHT_VALUE`) falls short
   * of the program's standards. Until 2026-09-28 the faculty read attendance
   * and growth only. SLATE's reading of "appropriate standards".
   */
  workNights: 3,
  workFloor: -0.5,
  /** Missed rehearsal calls in a term that take an actor out of the casting pool. */
  missedCallsOut: 2,
  /**
   * The acting (`actingOf`) at which a director asks for a third-year in a
   * Yale Rep role. It was 80 until 2026-09-27, on the one number acting was
   * then, which ran about three points above the three skills it became by
   * the third year; 77 keeps the class's best actor as far above it.
   */
  castAtRep: 77,
  /** Below this condition a body is unwell enough to call in sick. */
  sickBelow: 55,
} as const;

const SKILL_IDS = SKILLS.map((s) => s.id);

function zone(): string {
  return CITIES.require(YALE_DRAMA.cityId).timeZone;
}

function at(date: SchoolDate, hour: number, minute = 0): Instant {
  return instantFromZoned({ ...date, hour, minute }, zone());
}

const parseKey = (key: string): SchoolDate => {
  const [y, m, d] = key.split('-').map(Number);
  return { year: y!, month: m!, day: d! };
};
export const keyOf = (d: SchoolDate) => `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
const addDays = (d: SchoolDate, n: number): SchoolDate => {
  const t = new Date(Date.UTC(d.year, d.month - 1, d.day + n));
  return { year: t.getUTCFullYear(), month: t.getUTCMonth() + 1, day: t.getUTCDate() };
};
const weekday = (d: SchoolDate) => new Date(Date.UTC(d.year, d.month - 1, d.day)).getUTCDay();

/** The first day of a weekday (Sunday 0, Monday 1) on or after a date. */
function dayOnOrAfter(year: number, month: number, day: number, wanted: number): SchoolDate {
  let d: SchoolDate = { year, month, day };
  while (weekday(d) !== wanted) d = addDays(d, 1);
  return d;
}

// ---------------------------------------------------------------------------
// The calendar
// ---------------------------------------------------------------------------

/**
 * The day a term begins, counting from the first-year's fall term as 0: the
 * Bulletin's for 2026–2027, SLATE's estimate after (`content/school.ts`).
 */
export function termStart(term: number): { date: SchoolDate; estimate: boolean; fall: boolean } {
  const fall = term % 2 === 0;
  if (term === 0) return { date: TERM_STARTS_2026_27.fall, estimate: false, fall };
  if (term === 1) return { date: TERM_STARTS_2026_27.spring, estimate: false, fall };
  const academicYear = TERM_STARTS_2026_27.fall.year + Math.floor(term / 2);
  // The fourth Monday of August; the first Monday from the third of January.
  return { date: fall ? dayOnOrAfter(academicYear, 8, 22, 1) : dayOnOrAfter(academicYear + 1, 1, 3, 1), estimate: true, fall };
}

/** A term as a label, "Fall Term 2026", and in a sentence, "the fall term of 2026". */
export function termLabel(term: number): string {
  const { date, fall } = termStart(term);
  return `${fall ? 'Fall' : 'Spring'} Term ${date.year}`;
}
export function termWords(term: number): string {
  const { date, fall } = termStart(term);
  return `the ${fall ? 'fall' : 'spring'} term of ${date.year}`;
}

/** Which year of the degree a term falls in. */
export const yearOfTerm = (term: number): 1 | 2 | 3 => (Math.floor(term / 2) + 1) as 1 | 2 | 3;

/**
 * A term's class days: the Bulletin's for 2026–2027; after, SLATE's estimate
 * by its pattern. Classes a week after the term begins, to the second Friday
 * of December or the fourth of April, off for Labor Day, Indigenous Peoples'
 * Day, the week of Thanksgiving, Martin Luther King Jr. Day and ten days'
 * spring recess from the first Saturday of March.
 */
export function classPeriod(term: number): { from: SchoolDate; to: SchoolDate; off: readonly (readonly [string, string])[]; estimate: boolean } {
  if (term === 0) return { from: parseKey(CLASSES_2026_27.fall.from), to: parseKey(CLASSES_2026_27.fall.to), off: CLASSES_2026_27.off, estimate: false };
  if (term === 1) return { from: parseKey(CLASSES_2026_27.spring.from), to: parseKey(CLASSES_2026_27.spring.to), off: CLASSES_2026_27.off, estimate: false };
  const start = termStart(term);
  const from = addDays(start.date, 7);
  const y = start.date.year;
  if (start.fall) {
    const thanksgiving = addDays(dayOnOrAfter(y, 11, 1, 4), 21);
    const labor = dayOnOrAfter(y, 9, 1, 1);
    const indigenous = addDays(dayOnOrAfter(y, 10, 1, 1), 7);
    return {
      from, to: addDays(dayOnOrAfter(y, 12, 1, 5), 7), estimate: true,
      off: [[keyOf(labor), keyOf(labor)], [keyOf(indigenous), keyOf(indigenous)], [keyOf(addDays(thanksgiving, -1)), keyOf(addDays(thanksgiving, 4))]],
    };
  }
  const recess = dayOnOrAfter(y, 3, 1, 6);
  const mlk = addDays(dayOnOrAfter(y, 1, 1, 1), 14);
  return {
    from, to: addDays(dayOnOrAfter(y, 4, 1, 5), 21), estimate: true,
    off: [[keyOf(mlk), keyOf(mlk)], [keyOf(recess), keyOf(addDays(recess, 9))]],
  };
}

function inPeriod(term: number, day: SchoolDate): boolean {
  const period = classPeriod(term);
  const key = keyOf(day);
  if (key < keyOf(period.from) || key > keyOf(period.to)) return false;
  return !period.off.some(([a, b]) => key >= a && key <= b);
}

/** Whether a day has classes in a term: a weekday of its class period, not a day off. */
export function isClassDay(term: number, day: SchoolDate): boolean {
  const wd = weekday(day);
  return wd >= 1 && wd <= 5 && inPeriod(term, day);
}

/** Whether a Saturday is a work-study Saturday: in a term's class weeks and not a recess. */
export function isShiftDay(term: number, day: SchoolDate): boolean {
  return weekday(day) === 6 && inPeriod(term, day);
}

/**
 * The week's timetable for a year and term, Monday to Friday, three meetings
 * a day: each course as many times as it meets, the most frequent first,
 * each on the least-filled day, the earliest of those. Placed that way, no
 * course meets twice in a day and no day takes a fourth, for every term's
 * fifteen (`tests/school.test.ts`); a cap at three and a preference for days
 * without the course were tried as guards, and changed no timetable. SLATE's
 * estimate; the school publishes its courses, not its hours.
 */
export function timetable(year: 1 | 2 | 3, term: Term): Course[][] {
  const days: Course[][] = [[], [], [], [], []];
  const courses = COURSES.filter((one) => one.year === year && one.terms.includes(term)).sort((a, b) => b.perWeek - a.perWeek || a.code.localeCompare(b.code));
  for (const course of courses) {
    for (let n = 0; n < course.perWeek; n += 1) {
      const pick = days.map((d, i) => ({ i, load: d.length })).sort((a, b) => a.load - b.load || a.i - b.i)[0]!;
      days[pick.i]!.push(course);
    }
  }
  return days;
}

/** The term a day falls in: the latest begun on or before it. */
export function termOf(day: SchoolDate): number {
  let term = 0;
  for (let t = 0; t < YALE_DRAMA.terms; t += 1) if (keyOf(termStart(t).date) <= keyOf(day)) term = t;
  return term;
}

/** The courses meeting on a day. */
export function coursesOn(day: SchoolDate): Course[] {
  const term = termOf(day);
  if (!isClassDay(term, day)) return [];
  return timetable(yearOfTerm(term), termStart(term).fall ? 'fall' : 'spring')[weekday(day) - 1] ?? [];
}

/**
 * When the next classes begin after a moment, at nine on the next class day,
 * looking up to a term ahead; the calendar holds only the week planned.
 */
export function nextClasses(from: Instant): Instant | undefined {
  const p = zonedParts(from, zone());
  let day: SchoolDate = { year: p.year, month: p.month, day: p.day };
  for (let n = 0; n < 200; n += 1, day = addDays(day, 1)) {
    if (coursesOn(day).length && at(day, 9) > from) return at(day, 9);
  }
  return undefined;
}

/** The days off in a term's class period: its holidays, Community Days, work periods and recesses. */
export function daysOffIn(term: number): number {
  const period = classPeriod(term);
  return period.off.filter(([a, b]) => b >= keyOf(period.from) && a <= keyOf(period.to)).length;
}

// ---------------------------------------------------------------------------
// Craft
// ---------------------------------------------------------------------------

/** A craft at one level in every skill. */
export const evenCraft = (level: number): Craft => Object.fromEntries(SKILL_IDS.map((id) => [id, level])) as Craft;

export const meanCraft = (craft: Craft) => SKILL_IDS.reduce((sum, id) => sum + craft[id], 0) / SKILL_IDS.length;

/**
 * The acting at the heart of it: scene study twice, the character and the
 * feeling once each. What one number called acting stood for until
 * 2026-09-27, read by the showcase and a Yale Rep role.
 */
export const actingOf = (craft: Craft) => (craft.scene * 2 + craft.character + craft.emotion) / 4;

/**
 * A save's craft from before the 21 skills (`SKILL_FROM`), each new skill
 * at the old area it grew out of; a craft already in them is left alone.
 */
export function upgradeCraft(craft: Craft): boolean {
  const old = craft as unknown as Record<string, number | undefined>;
  if (typeof old.acting !== 'number') return false;
  for (const id of SKILL_IDS) old[id] = old[id] ?? old[SKILL_FROM[id]] ?? 40;
  for (const gone of ['acting', 'body', 'text']) delete old[gone];
  return true;
}

/**
 * How far each actor can grow: each skill to what it was on admission and 26
 * points more, never past 100. Fitted to McDaniel, Schmidt and Hunter's
 * meta-analysis of 16,058 workers (Journal of Applied Psychology, 1988):
 * experience correlates .49 with performance in the first three years and
 * only .15 past twelve. A population drawn as SLATE draws its actors, with
 * their years of work and how much of it each does, growing as a session
 * grows here, reaches those two figures with 26 points of room above where
 * each began (`probe/calibrate-craft.mjs`). It agrees with Macnamara,
 * Hambrick and Oswald's meta-analysis (Psychological Science, 2014):
 * practice explains a fifth of performance in music and sports, and what an
 * actor brings the rest. Until 2026-09-28 everybody grew toward 100, and
 * anybody who kept working reached 99 by thirty. A save from before keeps its
 * skills and grows each to the average admit's ceiling at most, 48 and 26.
 */
export const CEILING = {
  headroom: 26,
  averageTalent: 48,
  source: 'McDaniel, Schmidt & Hunter, Job experience correlates of job performance, J. Applied Psychology 73(2), 1988; Macnamara, Hambrick & Oswald, Psychological Science 25(8), 2014',
} as const;

const CEILINGS = new WeakMap<Craft, Craft>();

/** Ties an actor's ceiling to their craft, so every session reads it. */
export function bindCeiling(craft: Craft, ceiling: Craft): void {
  CEILINGS.set(craft, ceiling);
}

/** The ceiling of a craft as admitted: each skill and the headroom. */
export function ceilingFrom(craft: Craft): Craft {
  return Object.fromEntries(Object.entries(craft).map(([k, v]) => [k, Math.min(100, Math.round((v + CEILING.headroom) * 10) / 10)])) as Craft;
}

/** A ceiling for a craft from before ceilings: where each skill stands, or the average admit's ceiling where that's higher. */
export function ceilingBefore(craft: Craft): Craft {
  return Object.fromEntries(Object.entries(craft).map(([k, v]) => [k, Math.min(100, Math.max(v, CEILING.averageTalent + CEILING.headroom))])) as Craft;
}

/** How far a skill can grow: its actor's ceiling, or 100 where none is tied to it. */
export function ceilingOf(craft: Craft, skill: Skill): number {
  return CEILINGS.get(craft)?.[skill] ?? 100;
}

/** What a session adds to a skill: more when ready, less the nearer it is to how far it can go. */
export function sessionGain(level: number, focus: number, weight = 1, ceiling = 100): number {
  return ESTIMATE.sessionGain * weight * focus * Math.max(0, 1 - level / ceiling) ** 1.5;
}

/** How ready a person comes to a session, as a share of an ordinary day's. */
export function focusOf(person: Person): number {
  return Math.min(1.2, Math.max(0.3, readiness(person) / 80));
}

export function grow(craft: Craft, skill: Skill, focus: number, weight = 1): void {
  // The gain falls to nothing at the ceiling, so a session never passes it.
  craft[skill] += sessionGain(craft[skill], focus, weight, ceilingOf(craft, skill));
}

/** Names classmates are given: common American given names and surnames, not real students'. An actress's from the first list, an actor's from the second. */
const GIVEN_ACTRESS = ['Maya', 'Elena', 'Priya', 'Sofia', 'Hannah', 'Nadia', 'Grace', 'Imani', 'Lucia', 'Aaliyah', 'Chloe', 'Zoe'];
const GIVEN_ACTOR = ['Jordan', 'Marcus', 'Daniel', 'Isaiah', 'Theo', 'Caleb', 'Julian', 'Owen', 'Samuel', 'Noah', 'Mateo', 'Ethan'];
const FAMILY = ['Okafor', 'Reyes', 'Chen', 'Patel', 'Brooks', 'Kowalski', 'Nguyen', 'Alvarez', 'Bennett', 'Haddad', 'Morales', 'Kim', 'Sullivan', 'Abara', 'Castillo', 'Fischer', 'Walsh', 'Tanaka', 'Rivera', 'Osei', 'Park', 'Donovan', 'Mendez', 'Carter'];

/**
 * The admitted class: fifteen classmates with their craft from the
 * auditions, drawn for the save (`school.class`): a talent overall and each
 * skill around it (`ESTIMATE.talent`), an actor or an actress, half and half
 * by chance, and their own drive; and the player's, their talent from the
 * class's top quarter: among its strongest, not above everybody. Until
 * 2026-09-28 the player began above every classmate in every skill, and was
 * first in the class from the first day to the last. The talents, the spread
 * and the drives are SLATE's estimate.
 */
export function admittedClass(sim: Simulation, person: Person): { classmates: Classmate[]; player: Craft } {
  const rng = sim.rng('school.class', person.id, 'admitted');
  // A student's talent overall, and each skill around it: admits differ in both.
  const t = ESTIMATE.talent;
  const skills = (talent: number) => Object.fromEntries(SKILL_IDS.map((id) => [id, Math.round(Math.min(95, talent + t.spread * (rng.next() + rng.next() - 1)) * 10) / 10])) as Craft;
  // Each name once in a class: until 2026-09-28 they were drawn with repeats, and a class had three Okafors and three Owens.
  const families = [...FAMILY];
  const given = { actress: [...GIVEN_ACTRESS], actor: [...GIVEN_ACTOR] };
  const classmates = Array.from({ length: YALE_DRAMA.classSize - 1 }, (): Classmate => {
    const craft = skills(t.from + (t.to - t.from) * (rng.next() + rng.next()) / 2);
    const title = rng.next() < 0.5 ? 'actress' : 'actor';
    const names = given[title];
    const name = `${names.splice(Math.floor(rng.next() * names.length), 1)[0]} ${families.splice(Math.floor(rng.next() * families.length), 1)[0]}`;
    const drive = Math.round((1 + ESTIMATE.driveSpread * (2 * rng.next() - 1)) * 1000) / 1000;
    return { name, craft, title, drive };
  });
  const player = skills(t.playerFrom + (t.to - t.playerFrom) * rng.next());
  return { classmates, player };
}

/**
 * A classmate's title and drive, where a save from before 2026-09-28 has
 * neither: the title by the given name's list, else drawn; the drive an
 * ordinary classmate's.
 */
export function mateOf(sim: Simulation, person: Person, i: number): Required<Pick<Classmate, 'title' | 'drive'>> & Classmate {
  const mate = person.school!.classmates[i]!;
  if (!mate.title) {
    const given = mate.name.split(' ')[0]!;
    mate.title = GIVEN_ACTRESS.includes(given) ? 'actress' : GIVEN_ACTOR.includes(given) ? 'actor' : sim.rng('school.class', person.id, `title-${i}`).next() < 0.5 ? 'actress' : 'actor';
  }
  mate.drive ??= 1;
  return mate as Required<Pick<Classmate, 'title' | 'drive'>> & Classmate;
}

/** Which classmates are in class on a day (`school.attendance`): most are, most days. */
export function classmatesIn(sim: Simulation, person: Person, day: string): boolean[] {
  const rng = sim.rng('school.attendance', person.id, day);
  return (person.school?.classmates ?? []).map(() => rng.next() < ESTIMATE.classmateAttendance);
}

/** Whether an understudy on call at a performance is sent on (`school.understudy`). */
export function goesOn(sim: Simulation, person: Person, when: Instant): boolean {
  return sim.rng('school.understudy', person.id, String(when)).next() < ESTIMATE.goesOn;
}

// ---------------------------------------------------------------------------
// Money
// ---------------------------------------------------------------------------

/**
 * A term's charges and credits on the student's Yale account, in a currency:
 * tuition met by the tuition scholarship; the health plan billed; and, where
 * there's need, the living-expense scholarship, whose rest is paid out.
 */
export function termAccount(into: string, need = true, term = 0): { tuition: Money; healthPlan: Money; livingScholarship: Money; refund: Money; taxable: Money } {
  const usd = (cents: Money) => (into === 'USD' ? cents : exchange(cents, 'USD', into) ?? cents);
  // Later years at the Bulletins' growth, 2022–23 to 2026–27 (`YALE_COST_GROWTH`); until 2026-09-26 they held at 2026–27's.
  const years = Math.floor(term / 2);
  const grown = (cents: number, rate: number) => cents * (1 + rate) ** years;
  const plan = grown(COST_2026_27.healthPlan, YALE_COST_GROWTH.healthPlan);
  const living = grown(COST_2026_27.livingExpenses - COST_2026_27.healthPlan + COST_2026_27.books, YALE_COST_GROWTH.living) + plan;
  const tuition = usd(Math.round(grown(COST_2026_27.tuition, YALE_COST_GROWTH.tuition) / 2));
  const healthPlan = usd(Math.round(plan / 2));
  const livingScholarship = need ? usd(Math.round(living / 2)) : 0;
  // What of it the US taxes: all but the books, which with tuition are what a scholarship may pay untaxed.
  const books = need ? usd(Math.round(grown(COST_2026_27.books, YALE_COST_GROWTH.living) / 2)) : 0;
  return { tuition, healthPlan, livingScholarship, refund: livingScholarship - healthPlan, taxable: livingScholarship - books };
}

/** The work-study rate in a currency. */
export const hourlyIn = (into: string): Money => (into === 'USD' ? WORK_STUDY.hourly : exchange(WORK_STUDY.hourly, 'USD', into) ?? WORK_STUDY.hourly);

/** Whether the need assessment finds need: the family's means are read, and a wealthy family's rule it out. */
export const hasNeed = (person: Person) => person.family !== 'wealthy';

// ---------------------------------------------------------------------------
// The record
// ---------------------------------------------------------------------------

/** Which year of the degree a student is in: the first until the second fall term begins. */
export function yearOfStudy(person: Person): number {
  const begun = person.school?.termsBegun ?? 0;
  return Math.max(1, Math.ceil(begun / 2));
}

/** Where a student stands among the class in a skill, in acting (`actingOf`), or overall: 1 is first. */
export function rankIn(person: Person, skill?: Skill | 'acting'): number {
  const school = person.school;
  if (!school || !person.craft) return 1;
  const read = (c: Craft) => (skill === 'acting' ? actingOf(c) : skill ? c[skill] : meanCraft(c));
  const mine = read(person.craft);
  return 1 + school.classmates.filter((m) => read(m.craft) > mine).length;
}

function freshTally(person: Person, school: SchoolRecord): TermTally {
  return {
    classDays: 0, attended: 0, excused: 0, calls: 0, answered: 0, shifts: 0, worked: 0, breaches: 0,
    craftAtStart: { ...person.craft! }, classAtStart: school.classmates.map((m) => meanCraft(m.craft)),
    classCraftAtStart: school.classmates.map((m) => ({ ...m.craft })),
  };
}

/** Whether a person is awake and in New Haven at a moment. */
/** The day a moment falls on in New Haven, as a sick day is kept. */
function dayKeyAt(when: Instant): string {
  const p = zonedParts(when, zone());
  return keyOf({ year: p.year, month: p.month, day: p.day });
}

/**
 * In hospital, or laid up by an injury (`systems/injury.ts`): an absence the
 * School excuses, as it does a sick day called in. Until 2026-09-28 only a
 * hospital stay was excused, and an actor laid up who missed a performance
 * was warned and then dismissed for it.
 */
function offSick(person: Person, when: Instant): boolean {
  return inHospital(person, when) || laidUp(person, when);
}

function present(person: Person, when: Instant): boolean {
  const asleep = person.awakeSince !== undefined && person.awakeSince > when;
  // In hospital, they're in no class (`systems/health.ts`).
  return !asleep && !inHospital(person, when) && !laidUp(person, when) && person.currentLocationId === YALE_DRAMA.cityId;
}

function tire(person: Person, energy: number): void {
  person.wellbeing.energy = Math.max(0, person.wellbeing.energy - energy);
}

function schedule(
  sim: Simulation, person: Person, when: Instant,
  { kind, label, minutes, payload = {}, requiresPlayer = true }: { kind: string; label: string; minutes: number; payload?: Record<string, unknown>; requiresPlayer?: boolean },
): void {
  if (when <= sim.now) return;
  sim.schedule({
    at: when, kind, label, category: 'school', priority: 32, requiresPlayer,
    durationMinutes: minutes, locationId: YALE_DRAMA.cityId, payload: { personId: person.id, ...payload },
  });
}

/**
 * Why the Cabaret, the Summer Cabaret or an elective shift won't take them
 * now, or nothing where it will: the commands refuse on it, and the School
 * screen offers each only where it's undefined. Until 2026-09-27 the screen
 * offered all three after graduation, and the summer's in any season.
 */
export function cabaretRefusal(sim: Simulation, person: Person): string | undefined {
  const school = person.school;
  if (!school || school.standing === 'graduated' || school.standing === 'dismissed') return 'The Cabaret is for students.';
  if (school.standing === 'warning') return 'Nobody on academic warning may take part in the Cabaret.';
  const term = school.termsBegun - 1;
  if (term < 0) return 'The Cabaret’s season begins with the term.';
  if (school.cabaret?.term === term) return 'You’re in a Cabaret show this term already.';
  // Until 2026-09-27 it was offered in the summer and the term's last weeks, where no week can be, and refused on the click.
  if (!cabaretWeek(sim, person, term)) return 'No Cabaret week this term is three weeks off and clear of your recesses and calls.';
  return undefined;
}

export function summerRefusal(sim: Simulation, person: Person): string | undefined {
  const school = person.school;
  if (!school || school.standing !== 'good') return 'The Summer Cabaret’s company takes a student in good standing.';
  const term = school.termsBegun - 1;
  // A spring term with a year still to come: the summer after the first or second year.
  if (term < 0 || termStart(term).fall || yearOfTerm(term) === 3) return 'The company forms in the spring, for students with a year still to come.';
  const year = termStart(term).date.year;
  if (school.summer?.year === year) return 'You’re in this summer’s company.';
  if (sim.now > at({ year, month: SUMMER_CABARET.applyBy[0], day: SUMMER_CABARET.applyBy[1] }, 23)) return 'This summer’s company has formed.';
  return undefined;
}

export function shiftRefusal(person: Person): string | undefined {
  const school = person.school;
  if (!school || school.standing === 'dismissed' || school.standing === 'graduated') return 'You’re not at school.';
  if (school.workStudy.electiveHours + 4 > WORK_STUDY.electiveHours) return `You’ve taken the year’s ${WORK_STUDY.electiveHours} elective hours.`;
  return undefined;
}

/** The Cabaret's season a term falls in, by its number. */
export function cabaretSeason(term: number): string {
  return `Yale Cabaret, Season ${YALE_CABARET.firstSeason + Math.floor(term / 2)}`;
}

/** The weekday evenings a Cabaret show rehearses, back from its Thursday, a day off classes skipped. */
export function cabaretEvenings(thu: SchoolDate, off: readonly (readonly [string, string])[]): SchoolDate[] {
  const out: SchoolDate[] = [];
  for (let d = addDays(thu, -1); out.length < YALE_CABARET.rehearsalEvenings; d = addDays(d, -1)) {
    const wd = weekday(d);
    if (wd === 0 || wd === 6 || off.some(([a, b]) => keyOf(d) >= a && keyOf(d) <= b)) continue;
    out.push(d);
  }
  return out;
}

/**
 * The first Cabaret production week (its Thursday) at least three weeks off,
 * which leaves its rehearsals inside the term's classes, the week itself
 * clear of a recess, and each of its calls clear of the hours of every
 * casting and lab call. Until 2026-09-27, the day it was built, any
 * casting call in the fortnight ruled a week out, which left a first-year
 * understudying at Yale Rep no Cabaret all spring. As first
 * built on 2026-09-27, a single day off classes in the fortnight ruled a
 * week out, which left a first-year's fall one week to choose from.
 */
export function cabaretWeek(sim: Simulation, person: Person, term: number): SchoolDate | undefined {
  const period = classPeriod(term);
  const calls = sim.universe.scheduled
    // A work-study shift booked too: until 2026-09-27 an elective evening already taken wasn't read, and the show was set on it.
    .filter((i) => i.status === 'pending' && (i.kind === CALL_KIND || i.kind === LAB_KIND || i.kind === SHIFT_KIND) && i.payload.personId === person.id)
    .map((i) => [i.at, i.at + (i.durationMinutes ?? 0) * 60_000] as const);
  const clashes = (from: Instant, minutes: number) => calls.some(([a, b]) => a < from + minutes * 60_000 && from < b);
  const earliest = zonedParts(sim.now + YALE_CABARET.leadDays * MS_DAY, zone());
  for (let thu = dayOnOrAfter(earliest.year, earliest.month, earliest.day, 4); keyOf(thu) <= keyOf(period.to); thu = addDays(thu, 7)) {
    const sat = addDays(thu, 2);
    if (period.off.some(([a, b]) => !(b < keyOf(thu) || a > keyOf(sat)))) continue;
    // Its calls, each against the hours of every casting and lab call: an afternoon rehearsal leaves the evening free, a night on call doesn't.
    if (cabaretEvenings(thu, period.off).some((d) => clashes(at(d, YALE_CABARET.rehearsalFrom), YALE_CABARET.rehearsalMinutes))) continue;
    if (YALE_CABARET.shows.some(([wd, hour]) => clashes(at(addDays(thu, wd - 4), hour), 90))) continue;
    return thu;
  }
  return undefined;
}

/**
 * When a spring term's summer recess begins: twenty days after its classes
 * end, the work period between. 2027's comes to the Bulletin's 13 May, 23
 * April's twentieth day; later springs are SLATE's estimate by it.
 */
export function recessStart(term: number): SchoolDate {
  return addDays(classPeriod(term).to, 20);
}

/**
 * The summer a student is in at a moment, between a first or second year's
 * recess and the next fall term: its bounds, or nothing. The Bulletin limits
 * outside work only while classes are in session, so the summer is theirs.
 */
export function summerOf(person: Person, when: Instant): { from: Instant; until: Instant } | undefined {
  const school = person.school;
  if (!school || school.standing === 'graduated' || school.standing === 'dismissed') return undefined;
  const term = school.termsBegun - 1;
  if (term < 0 || termStart(term).fall || yearOfTerm(term) === 3) return undefined;
  const from = at(recessStart(term), 0);
  const until = at(termStart(term + 1).date, 0);
  return when >= from && when < until ? { from, until } : undefined;
}

/** A summer's three runs, 2026's dates in the summer's year. */
export function summerRuns(year: number): { from: SchoolDate; to: SchoolDate }[] {
  return SUMMER_CABARET.runs.map(([[m1, d1], [m2, d2]]) => ({ from: { year, month: m1, day: d1 }, to: { year, month: m2, day: d2 } }));
}

/**
 * A new life enrolled: the admitted class and their craft, the class of
 * 2029, arriving for the fall term, with the first week on the calendar.
 */
export function enroll(sim: Simulation, person: Person): void {
  const admitted = admittedClass(sim, person);
  person.craft = admitted.player;
  // How far each can grow, from what each brought (`CEILING`).
  person.craftCeiling = ceilingFrom(admitted.player);
  bindCeiling(person.craft, person.craftCeiling);
  for (const mate of admitted.classmates) { mate.ceiling = ceilingFrom(mate.craft); bindCeiling(mate.craft, mate.ceiling); }
  const school: SchoolRecord = {
    classOf: TERM_STARTS_2026_27.fall.year + 3, termsBegun: 0, standing: 'good', castable: true,
    classmates: admitted.classmates, tally: undefined as unknown as TermTally, history: [],
    workStudy: { electiveHours: 0, owedHours: 0 },
  };
  person.school = school;
  // Illness comes at school too, with Yale Health to meet it; until 2026-09-27 it waited for the degree.
  armHealth(sim, person);
  // A scholarship for living costs is income the US taxes, and the returns begin with school.
  armTaxes(sim, person);
  school.tally = freshTally(person, school);
  sim.schedule({ at: Math.max(at(termStart(0).date, 9), sim.now + 60_000), kind: TERM_KIND, label: termLabel(0) + ' Begins', category: 'school', priority: 30, payload: { personId: person.id, term: 0 } });
  planWeek(sim, person, sim.now);
  if (person.id !== sim.universe.playerId) return;
  const day = (d: SchoolDate) => formatDate(at(d, 12), zone());
  sim.notify({
    category: 'school',
    title: 'Welcome To The Class Of ' + school.classOf,
    body: `You’re one of the ${YALE_DRAMA.classSize} actors in the ${YALE_DRAMA.degree} in ${YALE_DRAMA.program} at the ${YALE_DRAMA.name}, chosen from this year’s auditions with fifteen others you’ll be cast beside and against. Tuition is covered, as it is for every student. The fall term begins with registration, then orientation until ${day(ORIENTATION_2026.ends)}, and classes from ${day(ORIENTATION_2026.classesBegin)} at 9 a.m.`,
    importance: 80, route: '/workspace/school',
  });
}

/**
 * The week put on the calendar, from a moment to the Sunday after: its class
 * days and its work-study Saturday. A payday goes on once there are hours
 * to pay (`bookPayday`); every Friday had one until 2026-09-26, summer's too. Each Sunday evening it runs
 * again for the week after.
 */
function planWeek(sim: Simulation, person: Person, from: Instant): void {
  const school = person.school;
  if (!school || school.standing === 'dismissed' || school.standing === 'graduated') return;
  const p = zonedParts(from, zone());
  const first: SchoolDate = { year: p.year, month: p.month, day: p.day };
  const sunday = dayOnOrAfter(first.year, first.month, first.day, 0);
  for (let day = first; keyOf(day) <= keyOf(sunday); day = addDays(day, 1)) {
    const term = termOf(day);
    if (coursesOn(day).length) schedule(sim, person, at(day, 9), { kind: CLASSES_KIND, label: 'Classes', minutes: 360, payload: { day: keyOf(day) } });
    // The year's assigned hours, and no more: until 2026-09-27 every class-week
    // Saturday was booked, 156 hours in a second year against the Bulletin's 150.
    if (isShiftDay(term, day) && (school.workStudy.assignedBooked ?? 0) + 6 <= WORK_STUDY.assignedHours && at(day, 10) > sim.now) {
      school.workStudy.assignedBooked = (school.workStudy.assignedBooked ?? 0) + 6;
      schedule(sim, person, at(day, 10), { kind: SHIFT_KIND, label: 'Work-Study Shift', minutes: 360, payload: { hours: 6, elective: false } });
    }
  }
  sim.schedule({ at: at(sunday, 18), kind: WEEK_KIND, label: 'The School Week Ahead', category: 'system', priority: 5, payload: { personId: person.id } });
}

/** The Friday after hours were worked, at five, unless one's already booked. */
function bookPayday(sim: Simulation, person: Person, worked: Instant): void {
  if (sim.universe.scheduled.some((item) => item.kind === PAYDAY_KIND && item.status === 'pending' && item.payload.personId === person.id)) return;
  const p = zonedParts(worked, zone());
  const next = addDays({ year: p.year, month: p.month, day: p.day }, 1);
  schedule(sim, person, at(dayOnOrAfter(next.year, next.month, next.day, 5), 17), { kind: PAYDAY_KIND, label: 'Work-Study Payday', minutes: 0, requiresPlayer: false });
}

/** The actor's standing moved: a notice, and on dismissal or the degree the school's hold on the calendar let go, and the career begun. */
function setStanding(sim: Simulation, person: Person, to: Standing, reason: string): void {
  const school = person.school!;
  school.standing = to;
  if (to !== 'good') feel(person, to);
  if (to === 'dismissed' || to === 'graduated') {
    // The degree is a line casting reads; a dismissal is one too (`attributes.ts`).
    earn(sim, person, to === 'graduated' ? ATTRIBUTES.reputation.degree : ATTRIBUTES.reputation.dismissed);
    keepCredit(sim, school);
    // The degree's filmed monologues, posted at the end of the final term.
    if (to === 'graduated') school.filmed = true;
    // The class, known for life after it (`systems/people.ts`, from 2026-10-01).
    if (to === 'graduated') knowTheClass(sim, person, school.classmates);
    for (const item of sim.universe.scheduled) {
      // The showcase too: until 2026-09-27 a student dismissed between New York's and Los Angeles's still had the second, and the clock stopped at it.
      if (item.status === 'pending' && (item.kind.startsWith('school.') || item.kind === SHOWCASE_KIND) && item.payload.personId === person.id) sim.timeline.cancel(item.id, sim.now);
    }
    // What was worked is still paid.
    if (school.workStudy.owedHours > 0) schedule(sim, person, sim.now + 60_000, { kind: PAYDAY_KIND, label: 'Work-Study Payday', minutes: 0, requiresPlayer: false });
    // The business, from here (`systems/career.ts`).
    beginCareer(sim, person);
  }
  if (person.id !== sim.universe.playerId) return;
  const chair = YALE_DRAMA.actingChair.name;
  const words: Record<Standing, [string, string]> = {
    good: ['In Good Standing', `The acting faculty, with the chair, ${chair}, find you in good standing. ${reason}`],
    concern: ['A Notice Of Academic Concern', `The chair, ${chair}, has raised a concern. ${reason} Remedy it by the end of next term, or it becomes an academic warning.`],
    warning: ['Academic Warning', `A formal meeting with the chair, ${chair}, and an associate dean. ${reason} Improve by the end of next term, or you may be dismissed.`],
    dismissed: ['Dismissed From The School', `${reason} Once dismissed, a student isn’t eligible to come back.`],
    graduated: ['Your MFA Is Conferred', reason],
  };
  const [title, body] = words[to];
  sim.notify({ category: 'school', title, body, importance: to === 'good' ? 45 : 85, route: '/workspace/school' });
}

/** A grave breach: straight to warning, or dismissal from warning. */
function breach(sim: Simulation, person: Person, what: string): void {
  const school = person.school!;
  school.tally.breaches += 1;
  setStanding(sim, person, school.standing === 'warning' ? 'dismissed' : 'warning', `You ${what}, which the School treats as a grave breach of professionalism.`);
}

/**
 * The School production a term casts a student in (`SCHOOL_SEASON`): a
 * first-year's spring, the Carlotta Festival; a second-year's fall, a thesis
 * or, below the class's middle in acting, the Hughes Festival; their spring,
 * the January thesis or Carlotta; a third-year's fall, the November thesis
 * or Hughes; their spring, a Shakespeare Repertory Project, by standing.
 * Which goes to whom is SLATE's estimate of the chair's balance.
 */
export function schoolProduction(term: number, rank: number): { name: string; kind: Casting['kind']; runs: SchoolDate[]; weeks: number; n: number } | undefined {
  const season = SCHOOL_SEASON;
  const fallYear = termStart(term).fall ? termStart(term).date.year : termStart(term).date.year - 1;
  const day = ([m, d]: readonly [number, number]): SchoolDate => ({ year: m >= 8 ? fallYear : fallYear + 1, month: m, day: d });
  const span = (run: readonly (readonly [number, number])[]) => { const out: SchoolDate[] = []; for (let d = day(run[0]!); keyOf(d) <= keyOf(day(run[1]!)); d = addDays(d, 1)) out.push(d); return out; };
  const upper = rank <= Math.ceil(YALE_DRAMA.classSize / 2);
  const thesis = (n: number) => ({ name: `Directors’ Thesis Production ${['I', 'II', 'III'][n]}`, kind: 'thesis' as const, runs: span(season.theses[n]!), weeks: season.rehearsalWeeks.thesis, n });
  const hughes = { name: 'Langston Hughes Festival Of New Work', kind: 'hughes' as const, runs: span(season.hughes), weeks: season.rehearsalWeeks.hughes, n: 0 };
  const all = span(season.carlotta);
  const carlotta = { name: 'Carlotta Festival Of New Plays', kind: 'carlotta' as const, runs: [0, 2, 5, all.length - 1].map((n) => all[Math.min(n, all.length - 1)]!).slice(0, season.carlottaShows), weeks: season.rehearsalWeeks.carlotta, n: 0 };
  switch (term) {
    case 1: return carlotta;
    case 2: return upper ? thesis(0) : hughes;
    case 3: return upper ? thesis(2) : carlotta;
    case 4: return upper ? thesis(1) : hughes;
    case 5: {
      const n = rank <= 5 ? 0 : rank <= 10 ? 1 : 2;
      return { name: `Shakespeare Repertory Project ${['I', 'II', 'III'][n]}`, kind: 'shakespeare', runs: span(season.shakespeare[n]!), weeks: season.rehearsalWeeks.shakespeare, n };
    }
    default: return undefined;
  }
}

/**
 * The Yale Rep production a term's casting draws on: in the spring of
 * 2027, The Seagull; after, the season isn't announced, and SLATE's estimate
 * is the slot Yale Rep's seasons keep, a three-week run from the first
 * Friday of October in a fall term and of March in a spring one, rehearsed
 * from six and a half weeks before (Yale Rep's 2023–24 to 2026–27 seasons).
 */
export function repProduction(term: number): { name: string; rehearsals: { from: string; to: string }; run: { from: string; to: string }; estimate: boolean } {
  if (term === 1) return { name: SEAGULL_2027.name, rehearsals: SEAGULL_2027.rehearsals, run: SEAGULL_2027.run, estimate: false };
  const { date, fall } = termStart(term);
  const opening = dayOnOrAfter(date.year, fall ? 10 : 3, 1, 5);
  const closing = addDays(opening, 22);
  const first = addDays(opening, -45);
  return {
    name: `Yale Rep’s ${fall ? 'October' : 'March'} Production`,
    rehearsals: { from: keyOf(keyOf(first) < keyOf(date) ? date : first), to: keyOf(addDays(opening, -1)) },
    run: { from: keyOf(opening), to: keyOf(closing) },
    estimate: true,
  };
}

/** A School production's rehearsal days: Tuesday to Friday for its weeks before opening, from the term's start, a recess skipped. */
export function rehearsalDays(term: number, opening: SchoolDate, weeks: number): SchoolDate[] {
  const period = classPeriod(term);
  const begun = termStart(term).date;
  const out: SchoolDate[] = [];
  for (let d = addDays(opening, -7 * weeks); keyOf(d) < keyOf(opening); d = addDays(d, 1)) {
    const wd = weekday(d);
    if (wd < 2 || wd > 5 || keyOf(d) < keyOf(begun) || period.off.some(([a, b]) => keyOf(d) >= a && keyOf(d) <= b)) continue;
    out.push(d);
  }
  return out;
}

/**
 * A term's labs (`LABS`): Drama 50's and the New Play Lab's three weeks of
 * afternoon calls, weekdays and Tuesday to Friday, a day off skipped; and in
 * the last spring, You Are The Creator's showing on the first Friday of
 * classes.
 */
export function labDays(term: number): { name: string; days: SchoolDate[]; showing: boolean } | undefined {
  const period = classPeriod(term);
  const free = (d: SchoolDate) => !period.off.some(([a, b]) => keyOf(d) >= a && keyOf(d) <= b);
  if (term === LABS.drama50.term || term === LABS.newPlayLab.term) {
    const lab = term === LABS.drama50.term ? LABS.drama50 : LABS.newPlayLab;
    // Drama 50 from the second week of classes; the New Play Lab from the Tuesday after the spring recess.
    // The term's recess: its longest run of days off.
    const span = ([a, b]: readonly [string, string]) => Date.parse(b) - Date.parse(a);
    const recess = period.off.filter(([a, b]) => a >= keyOf(period.from) && b <= keyOf(period.to)).reduce((best, one) => (span(one) > span(best) ? one : best));
    const start = term === LABS.drama50.term ? addDays(period.from, 7) : addDays(parseKey(recess![1]), 1);
    const days: SchoolDate[] = [];
    for (let d = start; keyOf(d) < keyOf(addDays(start, 7 * lab.weeks)); d = addDays(d, 1)) {
      const wd = weekday(d);
      const open = term === LABS.drama50.term ? wd >= 1 && wd <= 5 : wd >= 2 && wd <= 5;
      if (open && free(d)) days.push(d);
    }
    return { name: lab.name, days, showing: false };
  }
  if (term === LABS.creator.term) return { name: LABS.creator.name, days: [dayOnOrAfter(period.from.year, period.from.month, period.from.day, 5)], showing: true };
  return undefined;
}

function scheduleLabs(sim: Simulation, person: Person, term: number): void {
  const lab = labDays(term);
  if (!lab) return;
  for (const d of lab.days) schedule(sim, person, at(d, LABS.from), { kind: LAB_KIND, label: lab.showing ? `${lab.name}: Your Showing` : lab.name, minutes: LABS.minutes, payload: { showing: lab.showing } });
}

/** Whether a term brings a Yale Rep assignment: once a year, a first-year's spring and a second and third year's fall. */
export const repTerm = (term: number) => term === 1 || (termStart(term).fall && term >= 2);

/** A casting done with goes on the résumé where it was played: an understudy only if they went on. */
function keepCredit(sim: Simulation, school: SchoolRecord): void {
  for (const c of [school.casting, school.rep]) {
    if (!c || c.performed === 0) continue;
    (school.credits ??= []).push({ production: c.production, role: c.role, kind: c.kind, year: zonedParts(sim.now, zone()).year, wentOn: c.performed, ...(c.size ? { size: c.size } : {}) });
  }
}

/**
 * The chair's casting for a term, from the second (`SCHOOL_SEASON`): a
 * School production for every student in the pool, its rehearsal calls
 * Tuesday to Friday from three for its weeks before opening, inside the
 * term, and its performances at seven. Beside it, once a year (a first
 * year's spring, a second and third year's fall), a Yale Rep assignment for
 * a student in good standing, as most acting students work there: an
 * understudy, or, in the third year at a director's invitation, which
 * SLATE has come at `ESTIMATE.castAtRep` acting, a role. Out of the pool,
 * nothing. Until 2026-09-27 a term's casting was one thing, the class's best
 * actor alone went to Yale Rep, and everybody else was in a project named
 * by term and played in the term's last class week.
 */
/** The craft a play or a part asks for, weighed (`content/plays.ts`). */
export function readOf(craft: Craft, reads: Partial<Craft>): number {
  const r = Object.entries(reads) as [Skill, number][];
  return r.reduce((sum, [k, w]) => sum + craft[k] * w, 0) / r.reduce((sum, [, w]) => sum + w, 0);
}

/**
 * The play a School production is, and its parts: a thesis's and a
 * Shakespeare project's dealt from `content/plays.ts` by the year and the
 * slot, SLATE's estimate as the seasons aren't announced; a festival's new
 * plays unnamed, with parts by size for the class's share of the cast.
 */
export function playOf(sim: Simulation, person: Person, production: { kind: Casting['kind']; n: number; runs: SchoolDate[] }): { title?: string; by?: string; parts: Part[]; reads: Partial<Craft> } {
  const year = production.runs[0]!.year;
  // Each save's own order of the plays, shuffled once (`school.class`), and
  // dealt out a slot at a time from the class's first year, so no student
  // meets the same play twice. Until 2026-09-28 each season was dealt on its
  // own, and a student played Marie in Woyzeck two falls running.
  const dealt = (list: readonly (typeof THESIS_PLAYS)[number][], kind: string, slot: number) => {
    const rng = sim.rng('school.class', person.id, `season-${kind}`);
    const order = [...list];
    for (let i = order.length - 1; i > 0; i -= 1) { const j = Math.floor(rng.next() * (i + 1)); [order[i], order[j]] = [order[j]!, order[i]!]; }
    return order[slot % order.length]!;
  };
  if (production.kind === 'thesis' || production.kind === 'shakespeare') {
    // The theses' year runs fall to spring: its three slots by the fall, counted from the class's.
    const fall = production.runs[0]!.month >= 8 ? year : year - 1;
    const first = (person.school?.classOf ?? fall + 1) - 3;
    const play = production.kind === 'thesis' ? dealt(THESIS_PLAYS, 'thesis', (fall - first) * 3 + production.n) : dealt(SHAKESPEARE_PLAYS, 'shakespeare', (year - first - 1) * 3 + production.n);
    return { title: play.title, by: play.by, parts: [...play.parts], reads: play.reads };
  }
  return { parts: production.kind === 'hughes' ? unnamedParts(2, 3, 3) : unnamedParts(3, 6, 7), reads: NEW_PLAYS_READ };
}

/**
 * The play Yale Rep's production is in a season not yet announced: dealt from
 * `REP_PLAYS` in the save's own shuffled order, a year at a time from the
 * class's second, SLATE's estimate.
 */
export function repPlayOf(sim: Simulation, person: Person, term: number): (typeof REP_PLAYS)[number] {
  const rng = sim.rng('school.class', person.id, 'season-rep');
  const order = [...REP_PLAYS];
  for (let i = order.length - 1; i > 0; i -= 1) { const j = Math.floor(rng.next() * (i + 1)); [order[i], order[j]] = [order[j]!, order[i]!]; }
  return order[Math.max(0, Math.floor(term / 2) - 1) % order.length]!;
}

/** What a casting asks of the craft: its play's, a festival's new plays', or the Rep company's. */
export function castingReads(c: { play?: string; kind?: Casting['kind'] }): Partial<Craft> {
  const play = c.play ? [...THESIS_PLAYS, ...SHAKESPEARE_PLAYS, ...REP_PLAYS, ...SUMMER_PLAYS].find((p) => p.title === c.play) : undefined;
  if (play) return play.reads;
  // The Rep's company without a named play asks a professional stage's; the rest are new work.
  return c.kind === 'role' || c.kind === 'understudy' ? COMPANY_READ : NEW_PLAYS_READ;
}

/**
 * A performance's growth: the scene, the feeling and the voice, and as much
 * again in what the play asks (`castingReads`), so a Shakespeare builds the
 * classics and a Wilde comedy and speech. Until 2026-09-28 every play grew
 * the same three.
 */
export function playNight(craft: Craft, reads: Partial<Craft>, focus: number, scale = 1): void {
  grow(craft, 'scene', focus, 2 * scale);
  grow(craft, 'emotion', focus, scale);
  grow(craft, 'voice', focus, scale);
  const r = Object.entries(reads) as [Skill, number][];
  const total = r.reduce((sum, [, w]) => sum + w, 0);
  for (const [k, w] of r) grow(craft, k, focus, (4 * scale * w) / total);
}

/** A rehearsal's growth: the scene, the character, the script and the lines. */
export function rehearse(craft: Craft, focus: number): void {
  grow(craft, 'scene', focus, 1.5);
  grow(craft, 'character', focus, 1.5);
  grow(craft, 'script', focus);
  grow(craft, 'memorization', focus);
}

/**
 * A part in a student company, the Cabaret's or the Summer Cabaret's, which
 * the company casts among itself: a lead for a student in the class's top
 * four on what the play asks, a supporting part otherwise, the one written
 * for them where the play names it. SLATE's estimate of how a company that
 * isn't the chair's casts.
 */
export function companyPart(person: Person, reads: Partial<Craft>, parts?: readonly Part[]): { role: string; size: PartSize } {
  const school = person.school!;
  const mine = readOf(person.craft!, reads);
  const place = 1 + school.classmates.filter((m) => readOf(m.craft, reads) > mine).length;
  const size: PartSize = place <= 4 ? 'lead' : 'supporting';
  const title = person.performerTitle === 'actress' ? 'actress' : 'actor';
  const fits = (p: Part) => p.for === 'either' || p.for === title;
  const part = parts?.find((p) => p.size === size && fits(p)) ?? parts?.find(fits);
  return part ? { role: part.name, size: part.size } : { role: `${SIZE_WORD[size]} In A New Piece`, size };
}

/** The Summer Cabaret's three plays for a summer: dealt from `SUMMER_PLAYS` in the save's own shuffled order, three a summer from the first. */
export function summerPlaysOf(sim: Simulation, person: Person, year: number): (typeof SUMMER_PLAYS)[number][] {
  const rng = sim.rng('school.class', person.id, 'season-summer');
  const order = [...SUMMER_PLAYS];
  for (let i = order.length - 1; i > 0; i -= 1) { const j = Math.floor(rng.next() * (i + 1)); [order[i], order[j]] = [order[j]!, order[i]!]; }
  const first = (person.school?.classOf ?? year + 2) - 2;
  return [0, 1, 2].map((n) => order[((year - first) * 3 + n) % order.length]!);
}

/** What a band of night is worth to the chair's next casting (`LastWork.nights`). */
export const NIGHT_VALUE = { off: -1, solid: 0, strong: 1, remarkable: 2 } as const;
export type Night = keyof typeof NIGHT_VALUE;

/**
 * How a night went (`school.night`): how ready they came and what nerves
 * left of it, how the part sits on their craft, and the night's own luck.
 * Played at an ordinary readiness, with the craft the part asks, a night
 * lands solid or strong; rested and above it, strong, and now and then
 * remarkable. The bands and their
 * edges are SLATE's estimate.
 */
export function nightOf(sim: Simulation, person: Person, key: string, level: number, ready: number, size: PartSize = 'supporting', where: 'school' | 'rep' = 'school'): Night {
  const n = ESTIMATE.nights;
  const q = Math.min(1.2, ready) + (level - n.par[where][size]) / n.perPoint + n.luck * (sim.rng('school.night', person.id, key).next() - 0.5);
  return q < n.off ? 'off' : q < n.solid ? 'solid' : q < n.strong ? 'strong' : 'remarkable';
}

/** The director's note on a run, by how its nights went on average. */
export function directorsNote(mean: number): string {
  if (mean >= 1.25) return 'Remarkable work: you held the house night after night, and it’s been noticed.';
  if (mean >= 0.5) return 'Strong, reliable work. The part was yours by the second night.';
  if (mean >= -0.25) return 'Solid, sound nights. The next step is to risk more in them.';
  return 'Uneven. Some nights got away from you: come in rested, and have the part in your body before the house does.';
}

/**
 * The teachers' notes on a term: for each course the term ran, its first
 * teacher on how the student grew in the skills it trains against the class's
 * middle, ahead at a quarter more, behind under three quarters. The Bulletin
 * says the faculty evaluate every student each term; what each says, and the
 * edges, are SLATE's.
 */
export function teachersNotes(person: Person, term: number): { course: string; teacher: string; note: string }[] {
  const t = person.school?.tally;
  const start = t?.classCraftAtStart;
  if (!t || !start || !person.craft) return [];
  const courses = COURSES.filter((c) => c.year === yearOfTerm(term) && c.terms.includes(termStart(term).fall ? 'fall' : 'spring'));
  return courses.map((c) => {
    const mine = c.skills.reduce((sum, k) => sum + person.craft![k] - t.craftAtStart[k], 0) / c.skills.length;
    const class_ = person.school!.classmates.map((m, i) => c.skills.reduce((sum, k) => sum + m.craft[k] - (start[i]?.[k] ?? m.craft[k]), 0) / c.skills.length).sort((a, b) => a - b);
    const middle = class_[Math.floor(class_.length / 2)] ?? 0;
    const skill = SKILLS.find((k) => k.id === c.skills[0])!.label.toLowerCase();
    const note = mine >= 1.25 * middle
      ? `Real progress this term: you’re pulling ahead of the room in ${skill}.`
      : mine >= 0.75 * middle
      ? `Steady work, with the class. Keep at your ${skill}.`
      : `Your ${skill} hasn’t moved as the room’s has. Come to class rested, and do the work between.`;
    return { course: c.name, teacher: c.teachers.split(', ')[0]!, note };
  });
}

/** A run's nights on average, by what each is worth. */
export function nightsMean(nights: Partial<Record<Night, number>>): number {
  const all = Object.entries(nights) as [Night, number][];
  const n = all.reduce((sum, [, c]) => sum + c, 0);
  return n ? all.reduce((sum, [b, c]) => sum + NIGHT_VALUE[b] * c, 0) / n : 0;
}

type Student = { i: number; name: string; craft: Craft; title: NonNullable<Classmate['title']>; last?: LastWork };

/** How a student reads to the chair for a play: its craft, the balance of opportunity, and how the last run went (`ESTIMATE.casting`). */
export function castScore(s: { craft: Craft; last?: LastWork }, reads: Partial<Craft>): number {
  const c = ESTIMATE.casting;
  return readOf(s.craft, reads) + (s.last ? c.balance[s.last.size] + c.nights * (s.last.nights ?? 0) + (s.last.heeded ? c.heeded : 0) : 0);
}

/**
 * The day the cast list goes up, read: a lead of their own lifts them; a
 * friend's lead is good news; a rival's stings. SLATE's estimates of how
 * much, a little beside a night on stage.
 */
export const CAST_LIST = { ownLead: 2, friendLead: 0.5, rivalLead: 1.5 };
export function castListRead(person: Person): void {
  const school = person.school;
  const list = school?.around?.list ?? [];
  const w = person.wellbeing;
  const swing = personalityOf(person, 'moraleSwing');
  for (const one of list) {
    if (one.size !== 'lead') continue;
    if (one.name === 'You') { w.morale = Math.min(100, w.morale + CAST_LIST.ownLead * swing); continue; }
    const bond = bondWord(school!.classmates.find((m) => m.name === one.name)?.bond);
    if (bond === 'Close Friend' || bond === 'Friend') w.morale = Math.min(100, w.morale + CAST_LIST.friendLead * swing);
    if (bond === 'Rival') w.stress = Math.min(100, w.stress + CAST_LIST.rivalLead * personalityOf(person, 'stressGain'));
  }
}

/**
 * A production's parts given out: the best read first takes the biggest part
 * still open that's written for them; with none left for them, the company.
 */
export function partsFor(students: readonly Student[], parts: readonly Part[], reads: Partial<Craft>): { s: Student; part: string; size: PartSize }[] {
  const open = [...parts];
  return [...students].sort((a, b) => castScore(b, reads) - castScore(a, reads)).map((s) => {
    const k = open.findIndex((p) => p.for === 'either' || p.for === s.title);
    // No part written for them left: the company, not a part written for somebody else.
    if (k < 0) return { s, part: 'In The Company', size: 'featured' as const };
    const [p] = open.splice(k, 1);
    return { s, part: p!.name, size: p!.size };
  });
}

/** A part's name as the résumé and the screens say it: a character's name, or a size in a new play. */
const partLabel = (part: string, kind: Casting['kind']) => (part.startsWith('A ') ? `${part} In ${kind === 'hughes' ? 'The Festival' : 'A New Play'}` : part);

function cast(sim: Simulation, person: Person, term: number): void {
  const school = person.school!;
  keepCredit(sim, school);
  // What the chair reads of last time: the part's size and how its nights went.
  // And whether the director's note was taken: the skill it named grown since.
  const c0 = school.casting;
  const heeded = c0?.noteSkill !== undefined && c0.noteLevel !== undefined && person.craft![c0.noteSkill] >= c0.noteLevel + ESTIMATE.casting.heedGain;
  if (c0?.size) school.lastWork = { size: c0.size, ...(c0.nights ? { nights: nightsMean(c0.nights) } : {}), ...(heeded ? { heeded } : {}) };
  delete school.casting;
  delete school.rep;
  // A third-year a director asks into the Rep's company plays there that
  // term, not in a School production too: the two rehearse the same
  // afternoons. Until 2026-09-28 a student was cast in both, and the Rep won
  // every rehearsal, leaving the thesis part unrehearsed.
  const company = repTerm(term) && yearOfTerm(term) === 3;
  const playerAtRep = company && school.standing === 'good' && actingOf(person.craft!) >= ESTIMATE.castAtRep;
  const matesAtRep = new Set(company ? school.classmates.map((m, i) => ({ m, i })).filter(({ m }) => actingOf(m.craft) >= ESTIMATE.castAtRep).map(({ i }) => i) : []);
  // The rest of the class is cast together, the player among them where they're in the pool.
  const students: Student[] = school.classmates.flatMap((_, i) => { if (matesAtRep.has(i)) return []; const m = mateOf(sim, person, i); return [{ i, name: m.name, craft: m.craft, title: m.title, ...(m.last ? { last: m.last } : {}) }]; });
  if (school.castable && !playerAtRep) students.push({ i: -1, name: 'You', craft: person.craft!, title: person.performerTitle === 'actress' ? 'actress' : 'actor', ...(school.lastWork ? { last: school.lastWork } : {}) });
  const first = schoolProduction(term, 1);
  const around: { name: string; production: string; part: string; size?: PartSize }[] = [];
  let mine: { production: NonNullable<ReturnType<typeof schoolProduction>>; play: ReturnType<typeof playOf>; part: string; size: PartSize; cast: { name: string; part: string }[] } | undefined;
  if (first) {
    // Placed by how each reads for the first production's play, then cast within each.
    const order = [...students].sort((a, b) => castScore(b, playOf(sim, person, first).reads) - castScore(a, playOf(sim, person, first).reads));
    const groups = new Map<string, { production: NonNullable<ReturnType<typeof schoolProduction>>; members: Student[] }>();
    order.forEach((s, k) => {
      const production = schoolProduction(term, k + 1)!;
      const g = groups.get(production.name) ?? { production, members: [] };
      g.members.push(s);
      groups.set(production.name, g);
    });
    for (const { production, members } of groups.values()) {
      const play = playOf(sim, person, production);
      const given = partsFor(members, play.parts, play.reads);
      const shown = play.title ?? production.name;
      for (const g of given) around.push({ name: g.s.name, production: shown, part: partLabel(g.part, production.kind), size: g.size });
      for (const g of given) if (g.s.i >= 0) school.classmates[g.s.i]!.last = { size: g.size };
      const me = given.find((g) => g.s.i < 0);
      if (me) mine = { production, play, part: me.part, size: me.size, cast: given.filter((g) => g.s.i >= 0).map((g) => ({ name: g.s.name, part: partLabel(g.part, production.kind) })) };
      // The cast they're in together: closer for the weeks shared, and apart where a lead written for the one went to the other.
      if (me) {
        const title = person.performerTitle === 'actress' ? 'actress' : 'actor';
        const partOf = (name: string) => play.parts.find((x) => x.name === name);
        for (const g of given) {
          if (g.s.i < 0) continue;
          const mate = school.classmates[g.s.i]!;
          let move: number = BONDS.shared;
          const theirs = partOf(g.part);
          const ours = partOf(me.part);
          if (theirs?.size === 'lead' && me.size !== 'lead' && (theirs.for === title || theirs.for === 'either')) move -= BONDS.leadTaken;
          if (ours?.size === 'lead' && g.size !== 'lead' && (ours.for === g.s.title || ours.for === 'either')) move -= BONDS.leadTaken;
          mate.bond = Math.max(-100, Math.min(100, (mate.bond ?? 0) + bondMove(person, move)));
        }
      }
      // The classmates in it rehearse and play it too: grown once the run is over (`COMPANY_KIND`).
      const mates = given.filter((g) => g.s.i >= 0).map((g) => g.s.i);
      const last = production.runs[production.runs.length - 1]!;
      if (mates.length) schedule(sim, person, at(last, 22), { kind: COMPANY_KIND, label: `${shown}: The Run Ends`, minutes: 0, requiresPlayer: false, payload: { mates, rehearsals: rehearsalDays(term, production.runs[0]!, production.weeks).length, performances: production.runs.length, reads: play.reads } });
    }
  }
  school.around = { term, list: around };
  castListRead(person);
  if (!school.castable) {
    if (person.id === sim.universe.playerId) sim.notify({ category: 'school', title: 'Not Cast This Term', body: 'You’re out of the casting pool after missed rehearsal calls. A good evaluation puts you back.', importance: 70, route: '/workspace/school' });
    return;
  }
  // Both assignments' calls, worked out before any is booked, so the one
  // student is never called to two places at once. The School production's
  // rehearsals give way to a Yale Rep call; a Rep night on call gives way to
  // the student's own School performance; a Rep performance in a role wins
  // over a School one. Until 2026-09-27 each was booked on its own, and a
  // second-year understudy was called to Rep and to a thesis on eight
  // afternoons, and credited with both.
  type Call = { at: Instant; minutes: number; label: string; call: 'rehearsal' | 'performance' | 'oncall' | 'runthrough'; which?: 'rep'; last?: true };
  const ours: Call[] = [];
  const reps: Call[] = [];
  const production = mine?.production;
  if (mine && production) {
    school.casting = {
      production: production.name, role: partLabel(mine.part, production.kind), kind: production.kind, term, performed: 0, size: mine.size, cast: mine.cast,
      ...(mine.play.title ? { play: mine.play.title, by: mine.play.by } : {}),
    };
    for (const d of rehearsalDays(term, production.runs[0]!, production.weeks)) ours.push({ at: at(d, 15), minutes: 360, label: `${production.name}: Rehearsal`, call: 'rehearsal' });
    production.runs.forEach((d, k) => ours.push({ at: at(d, 19), minutes: 150, label: `${production.name}: Performance`, call: 'performance', ...(k === production.runs.length - 1 ? { last: true } : {}) }));
  }
  if (repTerm(term) && school.standing === 'good') {
    const rep = repProduction(term);
    const inRole = playerAtRep;
    // After 2026–27 the Rep's play is dealt (`repPlayOf`): an understudy covers a lead written for them, and a company member plays a featured part (SLATE's estimate).
    const play = term === 1 ? undefined : repPlayOf(sim, person, term);
    const title = person.performerTitle === 'actress' ? 'actress' : 'actor';
    const pick = (size: PartSize) => play?.parts.find((x) => x.size === size && (x.for === title || x.for === 'either'))?.name;
    const role = term === 1 ? (title === 'actress' ? SEAGULL_2027.roles.actress : SEAGULL_2027.roles.actor) : inRole ? (pick('featured') ?? 'A Featured Part In The Company') : (pick('lead') ?? 'An Understudy In The Company');
    school.rep = { production: rep.name, role, kind: inRole ? 'role' : 'understudy', term, performed: 0, ...(inRole ? { size: 'featured' as const } : {}), ...(play ? { play: play.title, by: play.by } : {}) };
    // Rehearsals: an understudy's Wednesday and Friday, three to six; a company member's Tuesday to Saturday, three to nine (SLATE's estimate).
    for (let d = parseKey(rep.rehearsals.from); keyOf(d) <= rep.rehearsals.to; d = addDays(d, 1)) {
      const wd = weekday(d);
      if (inRole ? wd >= 2 && wd <= 6 : wd === 3 || wd === 5) reps.push({ at: at(d, 15), minutes: inRole ? 360 : 180, label: `${rep.name}: ${inRole ? 'Rehearsal' : 'Understudy Rehearsal'}`, call: 'rehearsal', which: 'rep' });
    }
    // Every performance, evenings Tuesday to Saturday at eight and Sundays at two: played, or on call.
    for (let d = parseKey(rep.run.from); keyOf(d) <= rep.run.to; d = addDays(d, 1)) {
      const wd = weekday(d);
      if (wd === 1) continue;
      reps.push({ at: wd === 0 ? at(d, 14) : at(d, 20), minutes: 180, label: `${rep.name}: ${inRole ? 'Performance' : 'On Call'}`, call: inRole ? 'performance' : 'oncall', which: 'rep' });
    }
    const final = reps.filter((r) => r.call === 'performance').at(-1);
    if (final) final.last = true;
    // An understudy's run-through: the understudies play the show once for the
    // director and stage management, on the dark Monday of the run's second
    // week (SLATE's estimate of when).
    if (!inRole) {
      let d = addDays(parseKey(rep.run.from), 7);
      while (weekday(d) !== 1) d = addDays(d, 1);
      if (keyOf(d) <= rep.run.to) reps.push({ at: at(d, 14), minutes: 180, label: `${rep.name}: Understudy Run-Through`, call: 'runthrough', which: 'rep' });
    }
  }
  const overlaps = (a: Call, b: Call) => a.at < b.at + b.minutes * 60_000 && b.at < a.at + a.minutes * 60_000;
  const keptOurs = ours.filter((c) => !reps.some((r) => overlaps(c, r) && (c.call === 'rehearsal' || r.call === 'performance')));
  const keptReps = reps.filter((r) => !(r.call === 'oncall' && keptOurs.some((c) => c.call === 'performance' && overlaps(c, r))));
  for (const c of [...keptOurs, ...keptReps]) {
    // A night on call is a call at five (`ESTIMATE.onCallAt`), in New Haven and reachable, and needs nobody at the theater unless they're sent on. Until 2026-09-28 it held the evening at the theater and stopped the clock every performance night.
    if (c.call === 'oncall') {
      schedule(sim, person, c.at - ESTIMATE.onCallAhead * 60 * 60_000, { kind: CALL_KIND, label: c.label, minutes: 0, requiresPlayer: false, payload: { call: 'oncall', check: true, perfAt: c.at, which: 'rep' } });
      continue;
    }
    schedule(sim, person, c.at, { kind: CALL_KIND, label: c.label, minutes: c.minutes, payload: { call: c.call, ...(c.which ? { which: c.which } : {}), ...(c.last ? { last: true } : {}) } });
  }
  // The class's others the directors ask into the Rep's company in the third year, the same bar.
  if (repTerm(term) && yearOfTerm(term) === 3) {
    const rep = repProduction(term);
    const mates = school.classmates.map((m, i) => ({ m, i })).filter(({ i }) => matesAtRep.has(i));
    for (const { m } of mates) school.around.list.push({ name: m.name, production: rep.name, part: 'A Featured Part In The Company' });
    const days = Math.max(0, Math.round((Date.parse(rep.run.from) - Date.parse(rep.rehearsals.from)) / MS_DAY));
    if (mates.length) schedule(sim, person, at(parseKey(rep.run.to), 23), { kind: COMPANY_KIND, label: `${rep.name}: The Run Ends`, minutes: 0, requiresPlayer: false, payload: { mates: mates.map(({ i }) => i), rehearsals: Math.round(days * 5 / 7), performances: Math.round((Date.parse(rep.run.to) - Date.parse(rep.run.from)) / MS_DAY * 6 / 7) + 1 } });
  }
  if (person.id === sim.universe.playerId) {
    const chair = YALE_DRAMA.actingChair.name;
    const parts: string[] = [];
    const c = school.casting;
    if (c) {
      // Who the lead went to, where it wasn't them.
      const lead = c.size !== 'lead' ? c.cast?.find((x) => !x.part.startsWith('A ') && playOf(sim, person, { kind: c.kind, n: production!.n, runs: production!.runs }).parts.find((p) => p.name === x.part)?.size === 'lead') : undefined;
      const rival = lead && bondWord(school.classmates.find((m) => m.name === lead.name)?.bond) === 'Rival';
      parts.push(`as ${c.role} in ${c.play ? `${c.play} (${c.production})` : `${c.kind === 'thesis' ? '' : 'the '}${c.production}`}, from its first rehearsal call${lead ? `; ${lead.name}${rival ? ', your rival,' : ''} plays ${lead.part}` : ''}`);
    }
    const r = school.rep;
    if (r) parts.push(r.kind === 'role' ? `and, at the director’s invitation with the dean’s approval, in the company of ${r.production}` : `and to understudy ${term === 1 ? `${r.role} in Yale Rep’s ${SEAGULL_2027.name}, directed by ${SEAGULL_2027.director}` : `in ${r.production}`}, in New Haven and reachable at every performance`);
    if (parts.length) sim.notify({ category: 'school', title: `Cast: ${school.casting?.production ?? r!.production}`, body: `The chair, ${chair}, has cast you ${parts.join(', ')}. Once cast, you fulfil the casting.`, importance: 75, route: '/workspace/school' });
  }
}

/**
 * The term's growth, the student's and the class's median, each weighed
 * against the room it had to grow, as a session's gain shrinks toward the
 * student's own ceiling (`sessionGain`, `CEILING`): until 2026-09-28 raw
 * points were compared, and the class's best, with the least room, was
 * warned and then dismissed for growing less than the rest. The evaluation
 * and the School's screen both read it.
 */
export function termGrowth(person: Person): { growth: number; classGrowth: number; grewTooLittle: boolean; pace: 'ahead of' | 'in line with' | 'behind' } {
  const school = person.school!;
  const t = school.tally;
  const room = (start: number, ceiling: number) => Math.max(0.01, Math.max(0, 1 - start / ceiling) ** 1.5);
  const growth = meanCraft(person.craft!) - meanCraft(t.craftAtStart);
  const gains = school.classmates.map((m, i) => meanCraft(m.craft) - (t.classAtStart[i] ?? meanCraft(m.craft))).sort((a, b) => a - b);
  const classGrowth = gains[Math.floor(gains.length / 2)] ?? 0;
  const paced = growth / room(meanCraft(t.craftAtStart), person.craftCeiling ? meanCraft(person.craftCeiling) : 100);
  const classPaced = school.classmates.map((m, i) => { const start = t.classAtStart[i] ?? meanCraft(m.craft); return (meanCraft(m.craft) - start) / room(start, m.ceiling ? meanCraft(m.ceiling) : 100); }).sort((a, b) => a - b);
  const classPace = classPaced[Math.floor(classPaced.length / 2)] ?? 0;
  const grewTooLittle = paced < ESTIMATE.growthFloor * classPace;
  const pace = classPace <= 0 ? 'in line with' : paced >= 1.1 * classPace ? 'ahead of' : grewTooLittle ? 'behind' : 'in line with';
  return { growth, classGrowth, grewTooLittle, pace };
}

/**
 * The faculty's evaluation at the end of a term's classes: attendance at
 * classes, calls and shifts, and growth against the class's median, each
 * measured against the room they had to grow. Short of
 * either, standing falls a step: good to concern, concern to warning,
 * warning to dismissal. Meeting both restores good standing and the casting
 * pool. The floors are SLATE's reading of "appropriate standards".
 */
export function evaluate(sim: Simulation, person: Person, term: number): TermReview | undefined {
  const school = person.school;
  if (!school || !person.craft || school.standing === 'dismissed' || school.standing === 'graduated') return undefined;
  const t = school.tally;
  const expected = (t.classDays - t.excused) + t.calls + t.shifts;
  const attendance = expected > 0 ? (t.attended + t.answered + t.worked) / expected : 1;
  const { growth, classGrowth, grewTooLittle, pace } = termGrowth(person);
  // The term's work on stage, as the faculty see it: a run gone mostly off falls short, as poor production work does; a strong one is noted.
  const run = [school.casting, school.rep].find((c) => c && c.term === term && c.nights && Object.values(c.nights).reduce((a, b) => a + b, 0) >= ESTIMATE.workNights);
  const work = run?.nights ? nightsMean(run.nights) : undefined;
  const workedPoorly = work !== undefined && work <= ESTIMATE.workFloor;
  // A grave breach in the term keeps it short of good standing, whatever else went well.
  const short = attendance < ESTIMATE.attendanceFloor || grewTooLittle || workedPoorly || t.breaches > 0;
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  const onStage = work === undefined ? '' : workedPoorly ? ` Your work in ${run!.play ?? run!.production} fell short of what the program asks.` : work >= 1 ? ` The faculty noted your strong work in ${run!.play ?? run!.production}.` : '';
  const reason = `You were at ${pct(attendance)} of what was asked of you, and your craft grew ${growth.toFixed(1)} against the class’s ${classGrowth.toFixed(1)}: for the room each of you had to grow, ${pace} the class.${onStage}`;
  const next: Standing = !short ? 'good' : school.standing === 'good' ? 'concern' : school.standing === 'concern' ? 'warning' : 'dismissed';
  const notes = teachersNotes(person, term);
  const review: TermReview = { term, standing: next, attendance, growth, classGrowth, reason, ...(work !== undefined ? { work } : {}), ...(notes.length ? { notes } : {}) };
  school.history.push(review);
  if (!short) school.castable = true;
  setStanding(sim, person, next, next === 'dismissed' ? `The warning wasn’t met. ${reason}` : reason);
  // The tally starts again with the next term (`TERM_KIND`). Until 2026-09-27 it
  // started again here, and a first-year's Carlotta calls in May and the
  // summer's growth went into the next fall's attendance and growth.
  // After the sixth term in standing, the degree at Commencement on the last Monday of May, as 24 May 2027 is (SLATE's estimate for 2029).
  if (term === YALE_DRAMA.terms - 1 && next !== 'dismissed') {
    const y = termStart(term).date.year;
    schedule(sim, person, at(dayOnOrAfter(y, 5, 25, 1), 10), { kind: COMMENCEMENT_KIND, label: 'Commencement', minutes: 180 });
  }
  return review;
}

export function registerSchool(sim: Simulation): void {
  const personOf = (item: { payload: Record<string, unknown> }) => sim.universe.people[String(item.payload.personId)];

  sim.onSchedule(TERM_KIND, (item, s) => {
    const person = personOf(item);
    const school = person?.school;
    const term = Number(item.payload.term);
    if (!person || !school || school.standing === 'dismissed') return;
    school.termsBegun = term + 1;
    if (term > 0) school.tally = freshTally(person, school);
    // A new year's hours from the second fall; the first's began at enrollment, and resetting them
    // here lost an elective shift asked for before the first term's morning.
    if (term > 0 && termStart(term).fall) school.workStudy = { electiveHours: 0, owedHours: school.workStudy.owedHours };
    const cur = saveCurrency(s.universe);
    const need = hasNeed(person);
    const account = termAccount(cur, need, term);
    const current = person.primaryAccountId ? s.universe.accounts[person.primaryAccountId] : undefined;
    if (need && current && !current.closedAt) {
      s.post({
        memo: `Living-expense scholarship, ${termWords(term)}: ${YALE_DRAMA.name}`,
        category: 'scholarship',
        postings: [{ accountId: current.id, amount: account.refund }, { accountId: s.nominalAccount('income', 'Scholarship').id, amount: -account.refund }],
      });
      recordScholarship(person, item.at, zone(), account.taxable);
    } else if (!need) {
      // No need found: the health plan is billed to the Yale account and paid from the bank.
      payFromCurrent(s, person, account.healthPlan, `Yale Health plan, ${termWords(term)}`, 'school');
    }
    if (person.id === s.universe.playerId) {
      s.notify({
        category: 'school', title: `${termLabel(term)} Begins`,
        body: need
          ? `Your living-expense scholarship of ${formatMoney(account.livingScholarship, cur)} met this term’s Yale Health plan, ${formatMoney(account.healthPlan, cur)}, and ${formatMoney(account.refund, cur)} is in your ${current?.name ?? 'account'}. Tuition, ${formatMoney(account.tuition, cur)} a term, is covered by the tuition scholarship.`
          : `Tuition, ${formatMoney(account.tuition, cur)} a term, is covered by the tuition scholarship. Yale’s aid for living costs goes by need, and none was found, so this term’s Yale Health plan, ${formatMoney(account.healthPlan, cur)}, was paid from your bank, and living costs are yours.`,
        importance: 55, route: '/workspace/school',
      });
    }
    // A first or second year's spring ends in a summer that's theirs: its first Monday, the business's week begins (`systems/career.ts`).
    if (!termStart(term).fall && yearOfTerm(term) < 3) schedule(s, person, at(recessStart(term), 9), { kind: RECESS_KIND, label: 'Summer Recess', minutes: 0, requiresPlayer: false });
    scheduleLabs(s, person, term);
    if (term >= 1) cast(s, person, term);
    // The last spring ends in the Actor Showcase.
    if (term === YALE_DRAMA.terms - 1) bookShowcase(s, person);
    schedule(s, person, at(classPeriod(term).to, 17), { kind: EVALUATION_KIND, label: `${termLabel(term)} Evaluation`, minutes: 0, payload: { term }, requiresPlayer: false });
    if (term + 1 < YALE_DRAMA.terms) s.schedule({ at: Math.max(at(termStart(term + 1).date, 9), s.now + 60_000), kind: TERM_KIND, label: termLabel(term + 1) + ' Begins', category: 'school', priority: 30, payload: { personId: person.id, term: term + 1 } });
  });

  sim.onSchedule(WEEK_KIND, (item, s) => {
    const person = personOf(item);
    if (person) planWeek(s, person, item.at + MS_DAY);
  });

  sim.onSchedule(CLASSES_KIND, (item, s) => {
    const person = personOf(item);
    const school = person?.school;
    if (!person || !school || !person.craft) return;
    const day = parseKey(String(item.payload.day));
    const courses = coursesOn(day);
    school.tally.classDays += 1;
    // The classmates, in class most days.
    const inClass = classmatesIn(s, person, keyOf(day));
    school.classmates.forEach((mate, i) => {
      if (inClass[i]) for (const course of courses) for (const skill of course.skills) grow(mate.craft, skill, ESTIMATE.classmateFocus * (mate.drive ?? 1));
    });
    // Called in sick, kept home and excused, however well they could have gone (from 2026-10-06; until then a sick day
    // counted only for someone absent anyway, and a student who called in was counted in class).
    if (school.sickDay === keyOf(day)) { item.status = 'missed'; school.tally.excused += 1; return; }
    if (present(person, item.at)) {
      school.tally.attended += 1;
      const focus = focusOf(person);
      for (const course of courses) for (const skill of course.skills) grow(person.craft, skill, focus);
      tire(person, ESTIMATE.energy.classes);
      return;
    }
    item.status = 'missed';
    // A day in hospital is excused, as a sick day called in is.
    if (offSick(person, item.at)) { school.tally.excused += 1; return; }
    if (person.id === s.universe.playerId) s.notify({ category: 'school', title: 'You Missed Classes', body: `${courses.map((one) => one.name).join(', ')}: an unexcused absence, which the faculty weigh at the end of the term.`, importance: 65, route: '/workspace/school' });
  });

  sim.onSchedule(SHIFT_KIND, (item, s) => {
    const person = personOf(item);
    const school = person?.school;
    if (!person || !school) return;
    const hours = Number(item.payload.hours);
    const elective = item.payload.elective === true;
    // A shift in hospital isn't one they were there to be asked for.
    if (offSick(person, item.at)) { item.status = 'missed'; if (elective) school.workStudy.electiveHours -= hours; return; }
    if (!elective) school.tally.shifts += 1;
    if (present(person, item.at)) {
      if (!elective) school.tally.worked += 1;
      school.workStudy.owedHours += hours;
      bookPayday(s, person, item.at);
      tire(person, ESTIMATE.energy.shift);
      return;
    }
    item.status = 'missed';
    // An elective evening not worked frees its hours to be asked for again.
    if (elective) school.workStudy.electiveHours -= hours;
    if (person.id === s.universe.playerId) s.notify({ category: 'school', title: 'You Missed A Work-Study Shift', body: 'Unworked hours aren’t paid, and a missed assigned shift counts against you at the end of the term.', importance: 60, route: '/workspace/school' });
  });

  sim.onSchedule(PAYDAY_KIND, (item, s) => {
    const person = personOf(item);
    const school = person?.school;
    if (!person || !school || school.workStudy.owedHours <= 0) return;
    const current = payeeAccount(s, person);
    const cur = saveCurrency(s.universe);
    const pay = Math.round(school.workStudy.owedHours * hourlyIn(cur));
    // Paid by direct deposit through Yale's payroll, so a bank counts it as wages. A student's pay
    // is exempt from FICA, and at these hours no federal tax is withheld.
    s.post({ memo: `Work-study wages, ${school.workStudy.owedHours} hours: ${YALE_DRAMA.name}`, category: 'salary', postings: [{ accountId: current.id, amount: pay }, { accountId: s.nominalAccount('income', 'Wages').id, amount: -pay }] });
    // Income for the year's return (`systems/earnings.ts`).
    recordWages(person, item.at, zone(), { gross: pay, workStudy: true });
    school.workStudy.owedHours = 0;
  });

  /** A night played: its reading, what it does, and on the last, the director's note. */
  const reckonNight = (s: Simulation, person: Person, casting: Run, item: { at: Instant; payload: Record<string, unknown> }, kept: number, rep: boolean): Night => {
    const n = ESTIMATE.nights;
    // An understudy plays the part they cover, which at the Rep is a lead.
    const night = nightOf(s, person, `${casting.production}-${item.at}`, readOf(person.craft!, castingReads(casting)), focusOf(person) * kept, casting.size ?? 'lead', rep ? 'rep' : 'school');
    (casting.nights ??= {})[night] = (casting.nights[night] ?? 0) + 1;
    const w = person.wellbeing;
    if (night === 'off') w.morale = Math.max(0, w.morale - n.sting);
    else if (night !== 'solid') w.morale = Math.min(100, w.morale + n.lift);
    if (night === 'remarkable') {
      nudge(s, person, 'presence', n.presence, true);
      if (rep) earn(s, person, n.reputation);
    }
    if (item.payload.last !== true) return night;
    // What to work on: the skill the play asks that's weakest in them.
    const reads = castingReads(casting);
    const weakest = (Object.keys(reads) as Skill[]).sort((a, b) => person.craft![a] - person.craft![b])[0];
    casting.note = `${directorsNote(nightsMean(casting.nights))}${weakest ? ` Work on your ${SKILLS.find((k) => k.id === weakest)!.label.toLowerCase()}.` : ''}`;
    if (weakest) { casting.noteSkill = weakest; casting.noteLevel = person.craft![weakest]; }
    if (person.id === s.universe.playerId) s.notify({ category: 'school', title: `The Director’s Note: ${casting.play ?? casting.production}`, body: casting.note, importance: 70, route: '/workspace/school' });
    return night;
  };

  // A production's run over: the classmates in it grew by its rehearsals and nights, as the player does by theirs.
  sim.onSchedule(COMPANY_KIND, (item) => {
    const person = personOf(item);
    const school = person?.school;
    if (!school) return;
    const reads = (item.payload.reads as Partial<Craft> | undefined) ?? COMPANY_READ;
    for (const i of item.payload.mates as number[]) {
      const m = school.classmates[i];
      if (!m) continue;
      const f = ESTIMATE.classmateFocus * (m.drive ?? 1) * ESTIMATE.classmateAttendance;
      for (let n = 0; n < Number(item.payload.rehearsals); n += 1) rehearse(m.craft, f);
      for (let n = 0; n < Number(item.payload.performances); n += 1) playNight(m.craft, reads, f);
    }
  });

  sim.onSchedule(CALL_KIND, (item, s) => {
    const person = personOf(item);
    const school = person?.school;
    const casting = item.payload.which === 'rep' ? school?.rep : school?.casting;
    if (!person || !school || !person.craft || !casting) return;
    const call = String(item.payload.call);
    // In hospital, or sick with the day called in, somebody else covers: the
    // call isn't theirs to answer. Until 2026-09-27 a sick day excused the
    // classes and not that afternoon's rehearsal.
    if (offSick(person, item.at) || school.sickDay === dayKeyAt(item.at)) { item.status = 'missed'; return; }
    if (call === 'oncall' && item.payload.check === true) {
      // At five: most nights they aren't needed, and the evening is theirs.
      const curtain = Number(item.payload.perfAt);
      if (!goesOn(s, person, curtain)) { item.status = 'cancelled'; return; }
      if (person.currentLocationId !== YALE_DRAMA.cityId) {
        school.tally.calls += 1;
        breach(s, person, `weren’t in New Haven when called to go on as ${casting.role}`);
        return;
      }
      // Sent on: the night's performance is theirs, on the calendar from now, with three hours' notice.
      schedule(s, person, curtain, { kind: CALL_KIND, label: `${casting.production}: You’re On As ${casting.role}`, minutes: 180, payload: { call: 'performance', which: 'rep', wentOn: true } });
      if (person.id === s.universe.playerId) s.notify({ category: 'school', title: `You’re On Tonight As ${casting.role}`, body: `The role’s actor is out: you go on in Yale Rep’s ${casting.production} tonight at ${formatTime(curtain, zone())}.`, importance: 95, route: '/workspace/school' });
      return;
    }
    if (call === 'runthrough') {
      // The understudies' run-through: the whole show, played once for the director.
      school.tally.calls += 1;
      if (!present(person, item.at)) {
        item.status = 'missed';
        if (school.tally.calls - school.tally.answered >= ESTIMATE.missedCallsOut && school.castable) school.castable = false;
        return;
      }
      school.tally.answered += 1;
      const kept = nerves(s, person, 'performance');
      playNight(person.craft, castingReads(casting), focusOf(person) * kept, 0.75);
      tire(person, ESTIMATE.energy.performance);
      const night = reckonNight(s, person, casting, item, kept, true);
      if (person.id === s.universe.playerId) s.notify({ category: 'school', title: 'Your Understudy Run-Through', body: `You played ${casting.role} through for the director today: ${night === 'off' ? 'an off' : `a ${night}`} night.`, importance: 60, route: '/workspace/school' });
      return;
    }
    if (call === 'oncall') {
      // A night on call booked before 2026-09-28, at the curtain itself.
      if (!goesOn(s, person, item.at)) { item.status = 'cancelled'; return; }
      school.tally.calls += 1;
      if (present(person, item.at)) {
        school.tally.answered += 1;
        casting.performed += 1;
        // Sent on: nerves, and a night the Rep's company remembers (`attributes.ts`).
        playNight(person.craft, castingReads(casting), focusOf(person) * nerves(s, person, 'performance'), 0.75);
        earn(s, person, ATTRIBUTES.reputation.repPerformance);
        tire(person, ESTIMATE.energy.performance);
        if (person.id === s.universe.playerId) s.notify({ category: 'school', title: `You Went On As ${casting.role}`, body: `The role’s actor was out, and you played ${casting.role} in Yale Rep’s ${casting.production} tonight.`, importance: 90, route: '/workspace/school' });
        return;
      }
      breach(s, person, `weren’t there when called to go on as ${casting.role}`);
      return;
    }
    school.tally.calls += 1;
    if (present(person, item.at)) {
      school.tally.answered += 1;
      // A call's risk to the body, a student's on a stage (`systems/injury.ts`); Yale Health, not a workers' compensation, pays the care.
      mayHurt(s, person, 'stage', chanceOver(INJURY.perThousandHours.stage, call === 'performance' ? 3 : 4), item.at);
      exerts(person, BODY.met.acting, call === 'performance' ? 3 : 4, true);
      if (call === 'performance') {
        casting.performed += 1;
        // Nerves before a house, and at the Rep a night the company remembers (`attributes.ts`).
        const kept = nerves(s, person, 'performance');
        if (item.payload.which === 'rep') earn(s, person, ATTRIBUTES.reputation.repPerformance);
        // Friends in the cast: a better night to be in.
        const friends = (casting.cast ?? []).filter((c) => (school.classmates.find((m) => m.name === c.name)?.bond ?? 0) >= BONDS.friend).length;
        person.wellbeing.morale = Math.max(0, Math.min(100, person.wellbeing.morale + castCompany(person, friends)));
        playNight(person.craft, castingReads(casting), focusOf(person) * kept);
        tire(person, ESTIMATE.energy.performance);
        reckonNight(s, person, casting, item, kept, item.payload.which === 'rep');
        if (item.payload.wentOn === true && person.id === s.universe.playerId) s.notify({ category: 'school', title: `You Went On As ${casting.role}`, body: `The role’s actor was out, and you played ${casting.role} in Yale Rep’s ${casting.production} tonight.`, importance: 90, route: '/workspace/school' });
      } else {
        rehearse(person.craft, focusOf(person));
        tire(person, ESTIMATE.energy.rehearsal);
        enjoyWork(person, { medium: 'stage', away: false, rehearsal: true });
      }
      return;
    }
    item.status = 'missed';
    if (call === 'performance') { breach(s, person, `missed a performance of ${casting.kind === 'project' ? 'the ' : ''}${casting.production}`); return; }
    if (school.tally.calls - school.tally.answered >= ESTIMATE.missedCallsOut && school.castable) {
      school.castable = false;
      if (person.id === s.universe.playerId) s.notify({ category: 'school', title: 'Out Of The Casting Pool', body: 'Missed rehearsal calls: the chair takes you out of the casting pool to reacquire the discipline. You fulfil what you’re cast in now, and aren’t cast again until a good evaluation.', importance: 80, route: '/workspace/school' });
      return;
    }
    if (person.id === s.universe.playerId) s.notify({ category: 'school', title: 'You Missed A Rehearsal Call', body: 'Missed calls take an actor out of the casting pool.', importance: 65, route: '/workspace/school' });
  });

  sim.onSchedule(EVALUATION_KIND, (item, s) => {
    const person = personOf(item);
    if (person) evaluate(s, person, Number(item.payload.term));
  });

  sim.onSchedule(COMMENCEMENT_KIND, (item, s) => {
    const person = personOf(item);
    const school = person?.school;
    if (!person || !school || school.standing === 'dismissed') return;
    setStanding(s, person, 'graduated', `You graduate from the ${YALE_DRAMA.name} with an ${YALE_DRAMA.degree} in ${YALE_DRAMA.program}, class of ${school.classOf}.`);
  });

  sim.onCommand<Record<string, never>, { week: string }>('school.cabaret', (_p, { sim: s }) => {
    const person = s.player;
    const no = cabaretRefusal(s, person);
    if (no) throw new CommandError(no);
    const school = person.school!;
    const term = school.termsBegun - 1;
    const week = cabaretWeek(s, person, term)!;
    // A new piece, made by the students, cast within the company (`companyPart`).
    school.cabaret = { term, week: keyOf(week), performed: 0, production: cabaretSeason(term), ...companyPart(person, NEW_PLAYS_READ) };
    const c = YALE_CABARET;
    for (const d of cabaretEvenings(week, classPeriod(term).off)) {
      schedule(s, person, at(d, c.rehearsalFrom), { kind: CABARET_KIND, label: 'Yale Cabaret: Rehearsal', minutes: c.rehearsalMinutes, payload: { call: 'rehearsal' } });
    }
    c.shows.forEach(([wd, hour], n) => {
      schedule(s, person, at(addDays(week, wd - 4), hour), { kind: CABARET_KIND, label: 'Yale Cabaret: Performance', minutes: 90, payload: { call: 'performance', last: n === c.shows.length - 1 } });
    });
    return { week: keyOf(week) };
  });

  sim.onSchedule(CABARET_KIND, (item) => {
    const person = personOf(item);
    const school = person?.school;
    if (!person || !school?.cabaret || !person.craft) return;
    if (!present(person, item.at)) { item.status = 'missed'; return; }
    const cab = school.cabaret;
    // A show joined before 2026-09-28 has no part yet: the company's, now.
    if (!cab.role) Object.assign(cab, { production: cabaretSeason(cab.term), ...companyPart(person, NEW_PLAYS_READ) });
    const run = cab as typeof cab & Run;
    if (item.payload.call === 'performance') {
      cab.performed += 1;
      const kept = nerves(sim, person, 'performance');
      playNight(person.craft, castingReads(run), focusOf(person) * kept);
      tire(person, ESTIMATE.energy.performance);
      enjoyWork(person, { medium: 'stage', away: false });
      reckonNight(sim, person, run, item, kept, false);
    } else {
      rehearse(person.craft, focusOf(person));
      tire(person, ESTIMATE.energy.rehearsal);
      enjoyWork(person, { medium: 'stage', away: false, rehearsal: true });
    }
    // The closing night played: on the résumé (a show never played never reaches here).
    if (item.payload.last === true) {
      (school.credits ??= []).push({ production: cabaretSeason(cab.term), role: run.role, kind: 'cabaret', year: zonedParts(item.at, zone()).year, wentOn: cab.performed });
    }
  });

  sim.onCommand<Record<string, never>, { from: Instant; until: Instant }>('school.summer_cabaret', (_p, { sim: s }) => {
    const person = s.player;
    const no = summerRefusal(s, person);
    if (no) throw new CommandError(no);
    const school = person.school!;
    const year = termStart(school.termsBegun - 1).date.year;
    const runs = summerRuns(year);
    const from = at(addDays(runs[0]!.from, -7 * SUMMER_CABARET.rehearsalWeeks), SUMMER_CABARET.rehearsalFrom);
    const until = at(runs[runs.length - 1]!.to, 23);
    // Each show a real play, and a part in it cast within the company (`summerPlaysOf`, `companyPart`).
    const shows: Run[] = summerPlaysOf(s, person, year).slice(0, runs.length).map((p, n) => ({ production: `Yale Summer Cabaret ${year}, Show ${n + 1}`, play: p.title, by: p.by, ...companyPart(person, p.reads, p.parts) }));
    school.summer = { year, played: runs.map(() => 0), until, shows };
    runs.forEach((run, n) => {
      for (let d = addDays(run.from, -7 * SUMMER_CABARET.rehearsalWeeks); keyOf(d) < keyOf(run.from); d = addDays(d, 1)) {
        const wd = weekday(d);
        if (wd >= 2 && wd <= 6) schedule(s, person, at(d, SUMMER_CABARET.rehearsalFrom), { kind: SUMMER_KIND, label: 'Summer Cabaret: Rehearsal', minutes: SUMMER_CABARET.rehearsalMinutes, payload: { call: 'rehearsal', run: n } });
      }
      // Dark on Mondays; the closing is the run's last night played, which a later summer's Monday can move.
      const nights: SchoolDate[] = [];
      for (let d = run.from; keyOf(d) <= keyOf(run.to); d = addDays(d, 1)) if (weekday(d) !== 1) nights.push(d);
      nights.forEach((d, i) => {
        if (weekday(d) === 6) schedule(s, person, at(d, 14), { kind: SUMMER_KIND, label: 'Summer Cabaret: Matinee', minutes: 150, payload: { call: 'performance', run: n } });
        schedule(s, person, at(d, 20), { kind: SUMMER_KIND, label: 'Summer Cabaret: Performance', minutes: 150, payload: { call: 'performance', run: n, last: i === nights.length - 1 } });
      });
    });
    // The stipend, each Friday from the first rehearsal week to the closing.
    for (let d = addDays(runs[0]!.from, -7 * SUMMER_CABARET.rehearsalWeeks); at(d, 17) <= until + 7 * MS_DAY; d = addDays(d, 1)) {
      if (weekday(d) === 5) schedule(s, person, at(d, 17), { kind: STIPEND_KIND, label: 'Summer Cabaret Stipend', minutes: 0, requiresPlayer: false });
    }
    return { from, until };
  });

  sim.onSchedule(SUMMER_KIND, (item, s) => {
    const person = personOf(item);
    const school = person?.school;
    const summer = school?.summer;
    if (!person || !summer || summer.out || !person.craft) return;
    const run = Number(item.payload.run);
    if (!present(person, item.at)) {
      item.status = 'missed';
      // In hospital, the company covers the night and keeps them.
      if (item.payload.call !== 'performance' || offSick(person, item.at)) return;
      // A missed performance and the company lets them go: the calls ahead are off, the stipend stops.
      summer.out = true;
      // This week's stipend is kept, for the days of it worked; until
      // 2026-09-27 it went with the rest, and the notice said they were paid.
      const pay = s.universe.scheduled.filter((one) => one.status === 'pending' && one.kind === STIPEND_KIND && one.payload.personId === person.id).sort((a, b) => a.at - b.at)[0];
      if (pay) pay.payload.share = Math.max(0, Math.min(1, 1 - (pay.at - s.now) / (7 * MS_DAY)));
      for (const one of s.universe.scheduled) if (one.status === 'pending' && one !== pay && (one.kind === SUMMER_KIND || one.kind === STIPEND_KIND) && one.payload.personId === person.id) s.timeline.cancel(one.id, s.now);
      if (person.id === s.universe.playerId) s.notify({ category: 'school', title: 'Out Of The Summer Cabaret', body: 'You missed a performance, and the company went on without you. The weeks you worked are paid.', importance: 80, route: '/workspace/school' });
      return;
    }
    // A company joined before 2026-09-28 has no plays yet: the summer's, now.
    summer.shows ??= summerPlaysOf(s, person, summer.year).slice(0, summer.played.length).map((p, n) => ({ production: `Yale Summer Cabaret ${summer.year}, Show ${n + 1}`, play: p.title, by: p.by, ...companyPart(person, p.reads, p.parts) }));
    const show = summer.shows[run]!;
    if (item.payload.call === 'performance') {
      summer.played[run] = (summer.played[run] ?? 0) + 1;
      const kept = nerves(s, person, 'performance');
      playNight(person.craft, castingReads(show), focusOf(person) * kept);
      tire(person, ESTIMATE.energy.performance);
      enjoyWork(person, { medium: 'stage', away: false });
      reckonNight(s, person, show, item, kept, false);
      if (item.payload.last === true) (school!.credits ??= []).push({ production: `${show.play}, Yale Summer Cabaret ${summer.year}`, role: show.role, kind: 'summer', year: summer.year, wentOn: summer.played[run]! });
    } else {
      rehearse(person.craft, focusOf(person));
      tire(person, ESTIMATE.energy.rehearsal);
      enjoyWork(person, { medium: 'stage', away: false, rehearsal: true });
    }
  });

  sim.onSchedule(LAB_KIND, (item) => {
    const person = personOf(item);
    const school = person?.school;
    if (!person || !school || !person.craft) return;
    // Excused as a call is. Until 2026-09-27 a lab missed in hospital counted
    // against them, and toward the casting pool's missed calls.
    if (offSick(person, item.at) || school.sickDay === dayKeyAt(item.at)) { item.status = 'missed'; return; }
    school.tally.calls += 1;
    if (!present(person, item.at)) { item.status = 'missed'; return; }
    school.tally.answered += 1;
    if (item.payload.showing === true) {
      grow(person.craft, 'scene', focusOf(person) * nerves(sim, person, 'performance'), 3);
      tire(person, ESTIMATE.energy.performance);
      enjoyWork(person, { medium: 'stage', away: false });
      return;
    }
    grow(person.craft, 'scene', focusOf(person));
    grow(person.craft, 'character', focusOf(person));
    grow(person.craft, 'script', focusOf(person));
    grow(person.craft, 'memorization', focusOf(person));
    tire(person, ESTIMATE.energy.rehearsal);
    enjoyWork(person, { medium: 'stage', away: false, rehearsal: true });
  });

  sim.onSchedule(RECESS_KIND, (item, s) => {
    const person = personOf(item);
    if (!person || !summerOf(person, item.at)) return;
    armSummerWork(s, person);
    if (person.id === s.universe.playerId) s.notify({ category: 'school', title: 'The Summer Is Yours', body: 'Classes are done until the fall term. The Bulletin limits outside work only while they’re in session: Submit Yourself for jobs that end before the term, and a job in another city means a sublet there.', importance: 60, route: '/workspace/career' });
  });

  sim.onSchedule(STIPEND_KIND, (item, s) => {
    const person = personOf(item);
    if (!person) return;
    const current = payeeAccount(s, person);
    const cur = saveCurrency(s.universe);
    const week = cur === 'USD' ? SUMMER_CABARET.stipendWeekly : exchange(SUMMER_CABARET.stipendWeekly, 'USD', cur) ?? SUMMER_CABARET.stipendWeekly;
    // A week cut short when the company let them go: its days worked.
    const pay = Math.round(week * (typeof item.payload.share === 'number' ? item.payload.share : 1));
    if (pay <= 0) return;
    // Summer wages, with tax withheld as a paycheck's: a student out of term
    // isn't exempt from FICA. Until 2026-09-27 nothing was withheld, and the
    // return asked for the payroll tax as a balance due.
    const before = yearOf(person, zonedParts(item.at, zone()).year).acting;
    const withheld = computeAnnualTax(before + pay, YALE_DRAMA.cityId, item.at, { currency: cur }).total - computeAnnualTax(before, YALE_DRAMA.cityId, item.at, { currency: cur }).total;
    s.post({ memo: 'Yale Summer Cabaret stipend, the week', category: 'salary', postings: [{ accountId: current.id, amount: pay - withheld }, { accountId: s.nominalAccount('income', 'Wages').id, amount: -pay }, ...(withheld ? [{ accountId: s.nominalAccount('expense', 'Tax Withheld').id, amount: withheld }] : [])] });
    recordWages(person, item.at, zone(), { gross: pay, withheld, employer: 'yale-summer-cabaret' });
  });

  sim.onCommand<Record<string, never>, { excused: boolean }>('school.call_in_sick', (_p, { sim: s }) => {
    const person = s.player;
    const school = person.school;
    if (!school || school.standing === 'dismissed' || school.standing === 'graduated') throw new CommandError('You’re not at school.');
    const p = zonedParts(s.now, zone());
    const today: SchoolDate = { year: p.year, month: p.month, day: p.day };
    if (!coursesOn(today).length) throw new CommandError('There are no classes today.');
    // Before they've run: until 2026-09-27 it was taken all day, and said the day was excused after it had been counted.
    if (s.universe.scheduled.some((i) => i.kind === CLASSES_KIND && i.status !== 'pending' && i.status !== 'cancelled' && i.payload.personId === person.id && i.payload.day === keyOf(today))) throw new CommandError('Today’s classes have been and gone; calling in sick now excuses nothing.');
    // Down with the flu, they're sick whatever their condition reads; until 2026-09-27 the flu alone never took it low enough.
    if (person.wellbeing.condition >= ESTIMATE.sickBelow && !((person.health?.fluUntil ?? 0) > s.now)) throw new CommandError('You’re well enough to go: staying away would be an unexcused absence.');
    school.sickDay = keyOf(today);
    return { excused: true };
  });

  sim.onCommand<Record<string, never>, { at: Instant; hours: number }>('school.take_shift', (_p, { sim: s }) => {
    const person = s.player;
    const no = shiftRefusal(person);
    if (no) throw new CommandError(no);
    const school = person.school!;
    const hours = 4;
    // The next evening, seven to eleven, front of house at Yale Rep, that nothing else wants.
    const p = zonedParts(s.now, zone());
    let day = addDays({ year: p.year, month: p.month, day: p.day }, 1);
    for (let n = 0; n < 14; n += 1, day = addDays(day, 1)) {
      const when = at(day, 19);
      if (s.timeline.conflicts(when, hours * 60).some((one) => one.requiresPlayer)) continue;
      school.workStudy.electiveHours += hours;
      schedule(s, person, when, { kind: SHIFT_KIND, label: 'Elective Shift: Front Of House, Yale Rep', minutes: hours * 60, payload: { hours, elective: true } });
      return { at: when, hours };
    }
    throw new CommandError('No free evening in the next two weeks.');
  });
}
