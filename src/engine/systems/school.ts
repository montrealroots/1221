/**
 * SLATE — drama school, where the life begins (`content/school.ts`).
 *
 * The player arrives as an admitted first-year in the MFA in Acting at the
 * David Geffen School of Drama at Yale on the first day of the fall term,
 * the actor the faculty wanted most from that year's auditions. Being their
 * first choice is a measure here, not a line: an actor's craft, 0 to 100 in
 * each area the three years teach, and the player's starts above each of the
 * fifteen classmates' in every one.
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
 *   term: the one with the most acting craft, in good standing, understudies
 *   at Yale Rep where the term has a production open to them, and on call at
 *   every performance may go on; everybody else rehearses and performs a
 *   School project. Missed rehearsal calls take an actor out of the casting
 *   pool; a missed performance or understudy call is a grave breach.
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
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { formatDate, instantFromZoned, zonedParts, MS_DAY, type Instant } from '../core/time';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import {
  CLASSES_2026_27, COST_2026_27, COURSES, ORIENTATION_2026, SEAGULL_2027, SKILLS, SUMMER_CABARET, TERM_STARTS_2026_27, WORK_STUDY, YALE_CABARET, YALE_DRAMA,
  type Course, type SchoolDate, type Skill, type Term,
} from '../content/school';
import { readiness } from './life';
import { enjoyWork } from './enjoyment';
import { payFromCurrent } from './household';
import { beginCareer, bookShowcase } from './career';
import { YALE_COST_GROWTH } from '../content/career';
import { recordScholarship, recordWages } from './earnings';
import { armTaxes } from './taxreturn';
import { armHealth } from './health';

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
}

export interface TermReview { term: number; standing: Standing; attendance: number; growth: number; classGrowth: number; reason: string }

export interface Casting {
  production: string;
  role: string;
  kind: 'understudy' | 'role' | 'project';
  term: number;
  /** Went on as an understudy, or performed. */
  performed: number;
}

export interface SchoolRecord {
  schoolId: string;
  classOf: number;
  termsBegun: number;
  standing: Standing;
  /** In the casting pool: out after missed rehearsal calls, back after a good evaluation. */
  castable: boolean;
  classmates: { name: string; craft: Craft }[];
  tally: TermTally;
  /** What they performed in at school, for the résumé: a production played, or understudied and gone on in. */
  credits?: { production: string; role: string; kind: Casting['kind'] | 'cabaret' | 'summer'; year: number; wentOn: number }[];
  /** A Cabaret show this term: which term, its production week's Thursday, and the shows played. */
  cabaret?: { term: number; week: string; performed: number };
  /** The Summer Cabaret company: the summer's year, the shows played in each run, whether it's over. */
  summer?: { year: number; played: number[]; until: Instant; out?: boolean };
  history: TermReview[];
  casting?: Casting;
  workStudy: { yearHours: number; electiveHours: number; owedHours: number };
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

/** SLATE's estimates of what the school doesn't publish, each named where it's used. */
export const ESTIMATE = {
  /** How much a session can move a skill, and how much less the better it already is. */
  sessionGain: 0.55,
  /** How ready a classmate is on an ordinary day, as readiness over 80. */
  classmateFocus: 0.85,
  /** How often a classmate is in class. */
  classmateAttendance: 0.97,
  /** What a day's classes, a rehearsal, a performance and a shift take out of a body, in energy. */
  energy: { classes: 6, rehearsal: 8, performance: 10, shift: 4 },
  /** The chance, each performance, that an understudy goes on. */
  goesOn: 0.02,
  /** Attendance under this, or growth under this share of the class's, is short of the program's requirements. */
  attendanceFloor: 0.9,
  growthFloor: 0.5,
  /** Missed rehearsal calls in a term that take an actor out of the casting pool. */
  missedCallsOut: 2,
  /** The acting craft at which a director asks for a third-year in a Yale Rep role. */
  castAtRep: 80,
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

export const meanCraft = (craft: Craft) => SKILL_IDS.reduce((sum, id) => sum + craft[id], 0) / SKILL_IDS.length;

/** What a session adds to a skill: more when ready, less the better it already is. */
export function sessionGain(level: number, focus: number, weight = 1): number {
  return ESTIMATE.sessionGain * weight * focus * (1 - level / 100) ** 1.5;
}

/** How ready a person comes to a session, as a share of an ordinary day's. */
export function focusOf(person: Person): number {
  return Math.min(1.2, Math.max(0.3, readiness(person) / 80));
}

function grow(craft: Craft, skill: Skill, focus: number, weight = 1): void {
  craft[skill] = Math.min(100, craft[skill] + sessionGain(craft[skill], focus, weight));
}

/** Names classmates are given: common American given names and surnames, not real students'. */
const GIVEN = ['Maya', 'Jordan', 'Elena', 'Marcus', 'Priya', 'Daniel', 'Sofia', 'Isaiah', 'Hannah', 'Theo', 'Nadia', 'Caleb', 'Grace', 'Julian', 'Imani', 'Owen', 'Lucia', 'Samuel', 'Aaliyah', 'Noah', 'Chloe', 'Mateo', 'Zoe', 'Ethan'];
const FAMILY = ['Okafor', 'Reyes', 'Chen', 'Patel', 'Brooks', 'Kowalski', 'Nguyen', 'Alvarez', 'Bennett', 'Haddad', 'Morales', 'Kim', 'Sullivan', 'Abara', 'Castillo', 'Fischer', 'Walsh', 'Tanaka', 'Rivera', 'Osei', 'Park', 'Donovan', 'Mendez', 'Carter'];

/**
 * The admitted class: fifteen classmates with their craft from the
 * auditions, drawn for the save (`school.class`); and the player's, above
 * every classmate's in every area, as the faculty's first choice. The spread,
 * 38 to 58 with most near 48, and the lead of six are SLATE's estimate.
 */
export function admittedClass(sim: Simulation, person: Person): { classmates: { name: string; craft: Craft }[]; player: Craft } {
  const rng = sim.rng('school.class', person.id, 'admitted');
  const classmates = Array.from({ length: YALE_DRAMA.classSize - 1 }, () => {
    const craft = Object.fromEntries(SKILL_IDS.map((id) => [id, Math.round((38 + 20 * (rng.next() + rng.next() + rng.next()) / 3) * 10) / 10])) as Craft;
    return { name: `${GIVEN[Math.floor(rng.next() * GIVEN.length)]} ${FAMILY[Math.floor(rng.next() * FAMILY.length)]}`, craft };
  });
  const player = Object.fromEntries(SKILL_IDS.map((id) => [id, Math.min(95, Math.max(...classmates.map((m) => m.craft[id])) + 6)])) as Craft;
  return { classmates, player };
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

/** Where a student stands among the class in a skill, or overall: 1 is first. */
export function rankIn(person: Person, skill?: Skill): number {
  const school = person.school;
  if (!school || !person.craft) return 1;
  const mine = skill ? person.craft[skill] : meanCraft(person.craft);
  return 1 + school.classmates.filter((m) => (skill ? m.craft[skill] : meanCraft(m.craft)) > mine).length;
}

function freshTally(person: Person, school: SchoolRecord): TermTally {
  return {
    classDays: 0, attended: 0, excused: 0, calls: 0, answered: 0, shifts: 0, worked: 0, breaches: 0,
    craftAtStart: { ...person.craft! }, classAtStart: school.classmates.map((m) => meanCraft(m.craft)),
  };
}

/** Whether a person is awake and in New Haven at a moment. */
function present(person: Person, when: Instant): boolean {
  const asleep = person.awakeSince !== undefined && person.awakeSince > when;
  // In hospital, they're in no class (`systems/health.ts`).
  const inHospital = (person.health?.inHospitalUntil ?? 0) > when;
  return !asleep && !inHospital && person.currentLocationId === YALE_DRAMA.cityId;
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
 * clear of a recess, and its rehearsals and shows clear of every casting
 * call they have. As first
 * built on 2026-09-27, a single day off classes in the fortnight ruled a
 * week out, which left a first-year's fall one week to choose from.
 */
export function cabaretWeek(sim: Simulation, person: Person, term: number): SchoolDate | undefined {
  const period = classPeriod(term);
  const calls = sim.universe.scheduled.filter((i) => i.status === 'pending' && i.kind === CALL_KIND && i.payload.personId === person.id).map((i) => i.at);
  const earliest = zonedParts(sim.now + YALE_CABARET.leadDays * MS_DAY, zone());
  for (let thu = dayOnOrAfter(earliest.year, earliest.month, earliest.day, 4); keyOf(thu) <= keyOf(period.to); thu = addDays(thu, 7)) {
    const evenings = cabaretEvenings(thu, period.off);
    const sat = addDays(thu, 2);
    if (period.off.some(([a, b]) => !(b < keyOf(thu) || a > keyOf(sat)))) continue;
    const from = at(evenings.at(-1)!, 0);
    const to = at(addDays(sat, 1), 0);
    if (calls.some((t) => t >= from && t < to)) continue;
    return thu;
  }
  return undefined;
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
  const school: SchoolRecord = {
    schoolId: YALE_DRAMA.id, classOf: TERM_STARTS_2026_27.fall.year + 3, termsBegun: 0, standing: 'good', castable: true,
    classmates: admitted.classmates, tally: undefined as unknown as TermTally, history: [],
    workStudy: { yearHours: 0, electiveHours: 0, owedHours: 0 },
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
    category: 'money',
    title: 'Welcome To The Class Of ' + school.classOf,
    body: `You’re one of the ${YALE_DRAMA.classSize} actors in the ${YALE_DRAMA.degree} in ${YALE_DRAMA.program} at the ${YALE_DRAMA.name}, and the one the faculty wanted most from this year’s auditions. Tuition is covered, as it is for every student. The fall term begins with registration, then orientation until ${day(ORIENTATION_2026.ends)}, and classes from ${day(ORIENTATION_2026.classesBegin)} at 9 a.m.`,
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
    if (isShiftDay(term, day)) schedule(sim, person, at(day, 10), { kind: SHIFT_KIND, label: 'Work-Study Shift', minutes: 360, payload: { hours: 6, elective: false } });
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
  if (to === 'dismissed' || to === 'graduated') {
    keepCredit(sim, school);
    for (const item of sim.universe.scheduled) {
      if (item.status === 'pending' && item.kind.startsWith('school.') && item.payload.personId === person.id) sim.timeline.cancel(item.id, sim.now);
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
  sim.notify({ category: 'money', title, body, importance: to === 'good' ? 45 : 85, route: '/workspace/school' });
}

/** A grave breach: straight to warning, or dismissal from warning. */
function breach(sim: Simulation, person: Person, what: string): void {
  const school = person.school!;
  school.tally.breaches += 1;
  setStanding(sim, person, school.standing === 'warning' ? 'dismissed' : 'warning', `You ${what}, which the School treats as a grave breach of professionalism.`);
}

/** The School projects each term casts into after the first, by term. The dates are SLATE's estimate. */
const PROJECTS = ['', 'Spring Project', 'Shakespeare Repertory Project', 'Langston Hughes Festival Of New Work', 'Directors’ Thesis Production', 'Carlotta Festival Of New Plays'];

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

/**
 * The chair's casting for a term, from the second. The class's best actor
 * in good standing goes to Yale Rep: to understudy, as most acting students
 * do, or, in the third year and at a director's invitation, which SLATE has
 * come at `ESTIMATE.castAtRep` acting, in a role. Everybody else in the pool
 * is in a School project: five weeks of calls, Tuesday to Friday three to
 * nine, and three evening performances in the term's last class week
 * (SLATE's estimate of the dates). Out of the pool, nothing. Until
 * 2026-09-26 only the first spring went to Yale Rep.
 */
/** A casting done with goes on the résumé where it was played: an understudy only if they went on. */
function keepCredit(sim: Simulation, school: SchoolRecord): void {
  const c = school.casting;
  if (!c || c.performed === 0) return;
  (school.credits ??= []).push({ production: c.production, role: c.role, kind: c.kind, year: zonedParts(sim.now, zone()).year, wentOn: c.performed });
}

function cast(sim: Simulation, person: Person, term: number): void {
  const school = person.school!;
  keepCredit(sim, school);
  delete school.casting;
  if (!school.castable) {
    if (person.id === sim.universe.playerId) sim.notify({ category: 'money', title: 'Not Cast This Term', body: 'You’re out of the casting pool after missed rehearsal calls. A good evaluation puts you back.', importance: 70, route: '/workspace/school' });
    return;
  }
  const toRep = rankIn(person, 'acting') === 1 && school.standing === 'good';
  if (toRep) {
    const rep = repProduction(term);
    const inRole = yearOfTerm(term) === 3 && person.craft!.acting >= ESTIMATE.castAtRep;
    const role = term === 1 ? (person.performerTitle === 'actress' ? SEAGULL_2027.roles.actress : SEAGULL_2027.roles.actor) : 'A Role';
    school.casting = { production: rep.name, role, kind: inRole ? 'role' : 'understudy', term, performed: 0 };
    // Rehearsals: an understudy's Wednesday and Friday, three to six; a company member's Tuesday to Saturday, three to nine (SLATE's estimate).
    for (let d = parseKey(rep.rehearsals.from); keyOf(d) <= rep.rehearsals.to; d = addDays(d, 1)) {
      const wd = weekday(d);
      if (inRole ? wd >= 2 && wd <= 6 : wd === 3 || wd === 5) schedule(sim, person, at(d, 15), { kind: CALL_KIND, label: `${rep.name}: ${inRole ? 'Rehearsal' : 'Understudy Rehearsal'}`, minutes: inRole ? 360 : 180, payload: { call: 'rehearsal' } });
    }
    // Every performance, evenings Tuesday to Saturday at eight and Sundays at two: played, or on call.
    for (let d = parseKey(rep.run.from); keyOf(d) <= rep.run.to; d = addDays(d, 1)) {
      const wd = weekday(d);
      if (wd === 1) continue;
      const when = wd === 0 ? at(d, 14) : at(d, 20);
      if (inRole) schedule(sim, person, when, { kind: CALL_KIND, label: `${rep.name}: Performance`, minutes: 180, payload: { call: 'performance' } });
      else schedule(sim, person, when, { kind: CALL_KIND, label: `${rep.name}: On Call`, minutes: 180, payload: { call: 'oncall' }, requiresPlayer: false });
    }
  } else {
    const period = classPeriod(term);
    school.casting = { production: PROJECTS[term] ?? 'Acting Project', role: 'A Lead', kind: 'project', term, performed: 0 };
    const opening = addDays(period.to, -3);
    for (let d = addDays(opening, -35); keyOf(d) < keyOf(opening); d = addDays(d, 1)) {
      const wd = weekday(d);
      if (wd >= 2 && wd <= 5) schedule(sim, person, at(d, 15), { kind: CALL_KIND, label: `${school.casting.production}: Rehearsal`, minutes: 360, payload: { call: 'rehearsal' } });
    }
    for (let n = 0; n < 3; n += 1) schedule(sim, person, at(addDays(opening, n), 19), { kind: CALL_KIND, label: `${school.casting.production}: Performance`, minutes: 150, payload: { call: 'performance' } });
  }
  if (person.id === sim.universe.playerId) {
    sim.notify({
      category: 'money', title: `Cast: ${school.casting.production}`,
      body: school.casting.kind === 'understudy'
        ? `The chair, ${YALE_DRAMA.actingChair.name}, has cast you to understudy ${term === 1 ? `${school.casting.role} in Yale Rep’s ${SEAGULL_2027.name}, directed by ${SEAGULL_2027.director}` : `in ${school.casting.production}`}. Understudies must be in New Haven and reachable at every performance.`
        : school.casting.kind === 'role'
          ? `The director has asked for you, and the dean has approved it: you’re in the company of ${school.casting.production}.`
          : `The chair, ${YALE_DRAMA.actingChair.name}, has cast you in the ${school.casting.production}. Once cast, you fulfil the casting.`,
      importance: 75, route: '/workspace/school',
    });
  }
}

/**
 * The faculty's evaluation at the end of a term's classes: attendance at
 * classes, calls and shifts, and growth against the class's median. Short of
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
  const growth = meanCraft(person.craft) - meanCraft(t.craftAtStart);
  const gains = school.classmates.map((m, i) => meanCraft(m.craft) - (t.classAtStart[i] ?? meanCraft(m.craft))).sort((a, b) => a - b);
  const classGrowth = gains[Math.floor(gains.length / 2)] ?? 0;
  const grewTooLittle = growth < ESTIMATE.growthFloor * classGrowth;
  const short = attendance < ESTIMATE.attendanceFloor || grewTooLittle;
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  const reason = `You were at ${pct(attendance)} of what was asked of you, and your craft grew ${growth.toFixed(1)} against the class’s ${classGrowth.toFixed(1)}.`;
  const next: Standing = !short ? 'good' : school.standing === 'good' ? 'concern' : school.standing === 'concern' ? 'warning' : 'dismissed';
  const review: TermReview = { term, standing: next, attendance, growth, classGrowth, reason };
  school.history.push(review);
  if (!short) school.castable = true;
  setStanding(sim, person, next, next === 'dismissed' ? `The warning wasn’t met. ${reason}` : reason);
  school.tally = freshTally(person, school);
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
    // A new year's hours from the second fall; the first's began at enrollment, and resetting them
    // here lost an elective shift asked for before the first term's morning.
    if (term > 0 && termStart(term).fall) school.workStudy = { yearHours: 0, electiveHours: 0, owedHours: school.workStudy.owedHours };
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
        category: 'money', title: `${termLabel(term)} Begins`,
        body: need
          ? `Your living-expense scholarship of ${formatMoney(account.livingScholarship, cur)} met this term’s Yale Health plan, ${formatMoney(account.healthPlan, cur)}, and ${formatMoney(account.refund, cur)} is in your ${current?.name ?? 'account'}. Tuition, ${formatMoney(account.tuition, cur)} a term, is covered by the tuition scholarship.`
          : `Tuition, ${formatMoney(account.tuition, cur)} a term, is covered by the tuition scholarship. Yale’s aid for living costs goes by need, and none was found, so this term’s Yale Health plan, ${formatMoney(account.healthPlan, cur)}, was paid from your bank, and living costs are yours.`,
        importance: 55, route: '/workspace/school',
      });
    }
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
      if (inClass[i]) for (const course of courses) grow(mate.craft, course.skill, ESTIMATE.classmateFocus);
    });
    if (present(person, item.at)) {
      school.tally.attended += 1;
      const focus = focusOf(person);
      for (const course of courses) grow(person.craft, course.skill, focus);
      tire(person, ESTIMATE.energy.classes);
      return;
    }
    item.status = 'missed';
    if (school.sickDay === keyOf(day)) { school.tally.excused += 1; return; }
    if (person.id === s.universe.playerId) s.notify({ category: 'money', title: 'You Missed Classes', body: `${courses.map((one) => one.name).join(', ')}: an unexcused absence, which the faculty weigh at the end of the term.`, importance: 65, route: '/workspace/school' });
  });

  sim.onSchedule(SHIFT_KIND, (item, s) => {
    const person = personOf(item);
    const school = person?.school;
    if (!person || !school) return;
    const hours = Number(item.payload.hours);
    const elective = item.payload.elective === true;
    if (!elective) school.tally.shifts += 1;
    if (present(person, item.at)) {
      if (!elective) school.tally.worked += 1;
      school.workStudy.owedHours += hours;
      school.workStudy.yearHours += hours;
      bookPayday(s, person, item.at);
      tire(person, ESTIMATE.energy.shift);
      return;
    }
    item.status = 'missed';
    // An elective evening not worked frees its hours to be asked for again.
    if (elective) school.workStudy.electiveHours -= hours;
    if (person.id === s.universe.playerId) s.notify({ category: 'money', title: 'You Missed A Work-Study Shift', body: 'Unworked hours aren’t paid, and a missed assigned shift counts against you at the end of the term.', importance: 60, route: '/workspace/school' });
  });

  sim.onSchedule(PAYDAY_KIND, (item, s) => {
    const person = personOf(item);
    const school = person?.school;
    const current = person?.primaryAccountId ? s.universe.accounts[person.primaryAccountId] : undefined;
    if (!person || !school || school.workStudy.owedHours <= 0 || !current || current.closedAt) return;
    const cur = saveCurrency(s.universe);
    const pay = Math.round(school.workStudy.owedHours * hourlyIn(cur));
    // Paid by direct deposit through Yale's payroll, so a bank counts it as wages. A student's pay
    // is exempt from FICA, and at these hours no federal tax is withheld.
    s.post({ memo: `Work-study wages, ${school.workStudy.owedHours} hours: ${YALE_DRAMA.name}`, category: 'salary', postings: [{ accountId: current.id, amount: pay }, { accountId: s.nominalAccount('income', 'Wages').id, amount: -pay }] });
    // Income for the year's return (`systems/earnings.ts`).
    recordWages(person, item.at, zone(), { gross: pay, workStudy: true });
    school.workStudy.owedHours = 0;
  });

  sim.onSchedule(CALL_KIND, (item, s) => {
    const person = personOf(item);
    const school = person?.school;
    if (!person || !school || !person.craft || !school.casting) return;
    const call = String(item.payload.call);
    const casting = school.casting;
    if (call === 'oncall') {
      // Most nights the understudy isn't needed.
      if (!goesOn(s, person, item.at)) return;
      school.tally.calls += 1;
      if (present(person, item.at)) {
        school.tally.answered += 1;
        casting.performed += 1;
        grow(person.craft, 'acting', focusOf(person), 6);
        tire(person, ESTIMATE.energy.performance);
        if (person.id === s.universe.playerId) s.notify({ category: 'money', title: `You Went On As ${casting.role}`, body: `The role’s actor was out, and you played ${casting.role} in Yale Rep’s ${casting.production} tonight.`, importance: 90, route: '/workspace/school' });
        return;
      }
      breach(s, person, `weren’t there when called to go on as ${casting.role}`);
      return;
    }
    school.tally.calls += 1;
    if (present(person, item.at)) {
      school.tally.answered += 1;
      if (call === 'performance') {
        casting.performed += 1;
        grow(person.craft, 'acting', focusOf(person), 4);
        grow(person.craft, 'voice', focusOf(person), 2);
        tire(person, ESTIMATE.energy.performance);
      } else {
        grow(person.craft, 'acting', focusOf(person), 1.5);
        grow(person.craft, 'text', focusOf(person));
        tire(person, ESTIMATE.energy.rehearsal);
        enjoyWork(person, { medium: 'stage', away: false, rehearsal: true });
      }
      return;
    }
    item.status = 'missed';
    if (call === 'performance') { breach(s, person, `missed a performance of ${casting.kind === 'project' ? 'the ' : ''}${casting.production}`); return; }
    if (school.tally.calls - school.tally.answered >= ESTIMATE.missedCallsOut && school.castable) {
      school.castable = false;
      if (person.id === s.universe.playerId) s.notify({ category: 'money', title: 'Out Of The Casting Pool', body: 'Missed rehearsal calls: the chair takes you out of the casting pool to reacquire the discipline. You fulfil what you’re cast in now, and aren’t cast again until a good evaluation.', importance: 80, route: '/workspace/school' });
      return;
    }
    if (person.id === s.universe.playerId) s.notify({ category: 'money', title: 'You Missed A Rehearsal Call', body: 'Missed calls take an actor out of the casting pool.', importance: 65, route: '/workspace/school' });
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
    const school = person.school;
    if (!school || school.standing === 'graduated' || school.standing === 'dismissed') throw new CommandError('The Cabaret is for students.');
    if (school.standing === 'warning') throw new CommandError('Nobody on academic warning may take part in the Cabaret.');
    const term = school.termsBegun - 1;
    if (term < 0) throw new CommandError('The Cabaret’s season begins with the term.');
    if (school.cabaret?.term === term) throw new CommandError('You’re in a Cabaret show this term already.');
    const week = cabaretWeek(s, person, term);
    if (!week) throw new CommandError('No Cabaret week this term clears your classes’ recesses and your casting’s calls.');
    school.cabaret = { term, week: keyOf(week), performed: 0 };
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
    if (item.payload.call === 'performance') {
      school.cabaret.performed += 1;
      grow(person.craft, 'acting', focusOf(person), 4);
      grow(person.craft, 'voice', focusOf(person), 2);
      tire(person, ESTIMATE.energy.performance);
      enjoyWork(person, { medium: 'stage', away: false });
    } else {
      grow(person.craft, 'acting', focusOf(person), 1.5);
      grow(person.craft, 'text', focusOf(person));
      tire(person, ESTIMATE.energy.rehearsal);
      enjoyWork(person, { medium: 'stage', away: false, rehearsal: true });
    }
    // The closing night played: on the résumé (a show never played never reaches here).
    if (item.payload.last === true) {
      (school.credits ??= []).push({ production: cabaretSeason(school.cabaret.term), role: 'In The Company', kind: 'cabaret', year: zonedParts(item.at, zone()).year, wentOn: school.cabaret.performed });
    }
  });

  sim.onCommand<Record<string, never>, { from: Instant; until: Instant }>('school.summer_cabaret', (_p, { sim: s }) => {
    const person = s.player;
    const school = person.school;
    if (!school || school.standing !== 'good') throw new CommandError('The Summer Cabaret’s company takes a student in good standing.');
    const term = school.termsBegun - 1;
    // A spring term with a year still to come: the summer after the first or second year.
    if (term < 0 || termStart(term).fall || yearOfTerm(term) === 3) throw new CommandError('The company forms in the spring, for students with a year still to come.');
    const year = termStart(term).date.year;
    if (school.summer?.year === year) throw new CommandError('You’re in this summer’s company.');
    if (s.now > at({ year, month: SUMMER_CABARET.applyBy[0], day: SUMMER_CABARET.applyBy[1] }, 23)) throw new CommandError('This summer’s company has formed.');
    const runs = summerRuns(year);
    const from = at(addDays(runs[0]!.from, -7 * SUMMER_CABARET.rehearsalWeeks), SUMMER_CABARET.rehearsalFrom);
    const until = at(runs[runs.length - 1]!.to, 23);
    school.summer = { year, played: runs.map(() => 0), until };
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
      if (item.payload.call !== 'performance') return;
      // A missed performance and the company lets them go: the calls ahead are off, the stipend stops.
      summer.out = true;
      for (const one of s.universe.scheduled) if (one.status === 'pending' && (one.kind === SUMMER_KIND || one.kind === STIPEND_KIND) && one.payload.personId === person.id) s.timeline.cancel(one.id, s.now);
      if (person.id === s.universe.playerId) s.notify({ category: 'money', title: 'Out Of The Summer Cabaret', body: 'You missed a performance, and the company went on without you. The weeks you worked are paid.', importance: 80, route: '/workspace/school' });
      return;
    }
    if (item.payload.call === 'performance') {
      summer.played[run] = (summer.played[run] ?? 0) + 1;
      grow(person.craft, 'acting', focusOf(person), 4);
      grow(person.craft, 'voice', focusOf(person), 2);
      tire(person, ESTIMATE.energy.performance);
      enjoyWork(person, { medium: 'stage', away: false });
      if (item.payload.last === true) (school!.credits ??= []).push({ production: `Yale Summer Cabaret ${summer.year}, Show ${run + 1}`, role: 'In The Company', kind: 'summer', year: summer.year, wentOn: summer.played[run]! });
    } else {
      grow(person.craft, 'acting', focusOf(person), 1.5);
      grow(person.craft, 'text', focusOf(person));
      tire(person, ESTIMATE.energy.rehearsal);
      enjoyWork(person, { medium: 'stage', away: false, rehearsal: true });
    }
  });

  sim.onSchedule(STIPEND_KIND, (item, s) => {
    const person = personOf(item);
    const current = person?.primaryAccountId ? s.universe.accounts[person.primaryAccountId] : undefined;
    if (!person || !current || current.closedAt) return;
    const cur = saveCurrency(s.universe);
    const pay = cur === 'USD' ? SUMMER_CABARET.stipendWeekly : exchange(SUMMER_CABARET.stipendWeekly, 'USD', cur) ?? SUMMER_CABARET.stipendWeekly;
    s.post({ memo: 'Yale Summer Cabaret stipend, the week', category: 'salary', postings: [{ accountId: current.id, amount: pay }, { accountId: s.nominalAccount('income', 'Wages').id, amount: -pay }] });
    recordWages(person, item.at, zone(), { gross: pay, employer: 'yale-summer-cabaret' });
  });

  sim.onCommand<Record<string, never>, { excused: boolean }>('school.call_in_sick', (_p, { sim: s }) => {
    const person = s.player;
    const school = person.school;
    if (!school || school.standing === 'dismissed' || school.standing === 'graduated') throw new CommandError('You’re not at school.');
    const p = zonedParts(s.now, zone());
    const today: SchoolDate = { year: p.year, month: p.month, day: p.day };
    if (!coursesOn(today).length) throw new CommandError('There are no classes today.');
    if (person.wellbeing.condition >= ESTIMATE.sickBelow) throw new CommandError('You’re well enough to go: staying away would be an unexcused absence.');
    school.sickDay = keyOf(today);
    return { excused: true };
  });

  sim.onCommand<Record<string, never>, { at: Instant; hours: number }>('school.take_shift', (_p, { sim: s }) => {
    const person = s.player;
    const school = person.school;
    if (!school || school.standing === 'dismissed' || school.standing === 'graduated') throw new CommandError('You’re not at school.');
    const hours = 4;
    if (school.workStudy.electiveHours + hours > WORK_STUDY.electiveHours) throw new CommandError(`You’ve taken the year’s ${WORK_STUDY.electiveHours} elective hours.`);
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
