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
 *   costs is need-based and assesses the family. Simplified: where there's
 *   need, a living-expense scholarship meets it here, where Yale awards it
 *   after the student's and the family's contributions, a first-year loan
 *   (most first-years borrow $9,500, the aid office says) and work-study, so
 *   that even high need is met at about 95% across the three years. SLATE
 *   keeps no student loan. What's left after the health
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
 * - **Work-study.** The Bulletin's minimum of 200 hours a year, 150 assigned
 *   and 50 elective, at $23 an hour. SLATE's schedule for them is its own: a
 *   six-hour assigned shift each Saturday of the class weeks, elective shifts
 *   on the evenings asked for, and pay every Friday for the week's hours. The
 *   50 elective hours were a cap here until 2026-10-10; the Bulletin gives them
 *   as part of a minimum.
 * - **Casting.** Documented: the chair determines casting assignments, and
 *   first-years are cast from the second semester. SLATE's design: from the
 *   second term the chair casts every student each term in one of the
 *   School's own productions (`SCHOOL_SEASON`), the Carlotta Festival, a
 *   directors' thesis, the Langston Hughes Festival or a Shakespeare
 *   Repertory Project, with the years cast in each SLATE's reading; and once
 *   a year, in good standing, at Yale Rep, most often to understudy, on call
 *   at every performance. Documented: missed calls can take an actor out of
 *   the casting pool; SLATE's count is two. A missed performance or
 *   understudy call is a grave breach here.
 *   Until 2026-09-27 only the class's best actor went to Yale Rep, and
 *   everybody else was in a project named by the term.
 * - **Labs.** Drama 50's three weeks in the first fall, the New Play Lab's
 *   three in the first spring, and the third year's solo showing, You Are
 *   The Creator, each afternoon a call like a rehearsal's (`LABS`). The
 *   filmed monologues at the degree went with the reel they were for.
 * - **The Cabaret and the summer.** A show a term at the Yale Cabaret, the
 *   students' own theater, on the chair's approval, never on academic
 *   warning, in a week clear of recesses and casting; and in the spring of
 *   the first and second years, the Yale Summer Cabaret's company for the
 *   summer, three shows and a weekly stipend, a missed performance and it's
 *   over. Until 2026-09-27 the terms had nothing outside the curriculum and
 *   the summers nothing at all.
 * - **Evaluation.** Documented: the four standings (good, a notice of
 *   academic concern, academic warning, dismissal with no readmission), and
 *   that the faculty evaluate students regularly and may act at any time,
 *   even dismissing without a warning first. SLATE's design: one evaluation at
 *   the end of each term's classes, of attendance, growth against the class,
 *   the term's work on stage and its coursework, each against floors that are
 *   SLATE's estimates, moving standing one step a term. This said until
 *   2026-10-10 that the Bulletin set out the term-end ladder; it sets out the
 *   standings. After six terms in standing, the degree.
 */

import type { Simulation } from '../core/simulation';
import type { ScheduledItem } from '../core/scheduler';
import { rngFor } from '../core/rng';
import { personalityOf } from './personality';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { formatDate, formatTime, instantFromZoned, zonedParts, MS_DAY, type Instant } from '../core/time';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import {
  CLASSES_2026_27, COST_2026_27, COURSES, LABS, ORIENTATION_2026, SCHOOL_SEASON, REQUIRED_PPE, SEAGULL_2027, SKILLS, SKILL_FROM, SUMMER_CABARET, TERM_STARTS_2026_27, WORK_LIMITS, WORK_STUDY, YALE_CABARET, YALE_DRAMA,
  type Course, type SchoolDate, type Skill, type Term,
} from '../content/school';
import { classTrains, readiness } from './life';
import { COMPANY_READ, NEW_PLAYS_READ, REP_PLAYS, genresOfPlay, SHAKESPEARE_PLAYS, SIZE_WORD, SUMMER_PLAYS, THESIS_PLAYS, unnamedParts, type Part, type PartSize } from '../content/plays';
import { enjoyWork, feel } from './enjoyment';
import { expenseFor, owe, payFromCurrent, spend } from './spending';
import { inSaveMoney } from './banking';
import { ATTRIBUTES, CRAFT_ABILITY, abilityFull, abilityGain, abilityOf, classmatePresence, presenceFor, develop, isAbility, nerves, nudge, targetId, type Target } from './attributes';
import { ABILITY_KIN, ABILITY_DEFS, type AbilityId } from '../content/abilities';
import { EXTENDED_STUDY, YALE_COST_GROWTH, needFor } from '../content/school';
import { addWithheld, recordScholarship, recordWages, stateOf, yearOf } from './earnings';
import { computeAnnualTax, federalStandardDeduction } from '../content/tax';
import { armTaxes } from './taxreturn';
import { armHealth, healthOf, inHospital, repriceCare } from './health';
import { chanceOver, injuryOf, laidUp, mayHurt } from './injury';
import { bandOfQuality, countTogether, judge, leanedWeights, milestone, performerOf, recordWork, type Condition, type Evaluation, type Performer } from './evaluation';
import { evaluatePiece, judgePiece, nightPiece, pieceWeights, withBook, type PieceSpec } from './piece';
import { energyOfNight, holdOf, runningOf, withPart, type Participation } from './workload';
import { sharedOf, type PartnerRead, type SharedResult } from './ensemble';
import { TASK_PROFILES } from '../content/tasks';
import { familiesOf } from '../content/genres';
import { materialContext, materialOf, sidesOf, type Playing } from './material';
import { noteMaterial } from './experience';
import { PLAYING } from '../content/approaches';
import { practiceGenres } from './engagement';
import { INJURY, INJURY_KIND } from '../content/injury';
import { exerts } from './body';
import { BODY } from '../content/body';
import { payeeAccount } from './cash';
import { courseworkOf, lapseTerm, meetingWeight, mateRecord, shortCause, partnerAsks, reliabilityOf, reliabilityFor, scheduleOrientation, setWork, termTally, type Assignment } from './coursework';
import { f1Of, scheduleUsStatus } from './permission';
import { connecticutTax, nonresidentFor } from './taxreturn';
import { MOMENT_KIND, momentInClass } from './classmates';
import { endCoursework } from './coursework';
import { LAB_CODES, degreeShortfall, noteMeeting, registerCourseRecord, settleCourses, tellFails, type CourseRecord } from './courserecord';
import { withRepeat, considerWelfare, facultyReview, followFormerClasses, FORMER_KIND, joinCohort, leaveClassBehind, insuranceStart, accountOwed, aidOnAccount, billUnsupportedTerm, closeLeave, liftHold, yaleAccount, enrolledTerms, offerRepeat, returnFromLeave, startLeave } from './leave';
import { hasProcess, STAGE_LABEL, cabaretStages, callAnswered, callMissed, completeFor, nightFactor, prepOf, processOf, reflect, stagesOf, type Stage } from './production';

export type Craft = Record<Skill, number>;
/**
 * `withheld`: the last term ended on academic warning, and the faculty, who recommend the degree by a majority vote
 * (Bulletin p.151), didn't (from 2026-10-10: until then Commencement was booked for any standing short of dismissal).
 */
export type Standing = 'good' | 'concern' | 'warning' | 'dismissed' | 'graduated' | 'withheld' | 'withdrawn';

/**
 * Whether they're registered for the program (from 2026-10-10). The Bulletin has every student register before the fall
 * term's classes begin, and register late only with the chair's written permission (2026–27 p.144); the work-study's
 * I-9 is done with it, SLATE's reading of where it falls. Unregistered, classes don't count them and a shift can't be
 * worked. Orientation's registration session does it (`systems/coursework.ts`), or catching it up later, which SLATE
 * takes the chair's permission for as given. A student who arrived after orientation registered on arriving, and a save
 * from before a term had begun keeps the way it ran.
 */
export function registered(school: SchoolRecord | undefined, cw?: { orientation: { behind?: boolean; done: Partial<Record<string, Instant>> } }): boolean {
  if (!school) return false;
  // Back from a leave, or a term begun under a financial hold: registered again before anything counts (from 2026-10-10).
  if (school.mustRegister) return false;
  return school.registeredAt !== undefined || cw?.orientation.behind === true || cw?.orientation.done.register !== undefined || school.termsBegun > 1;
}

/** Whether anything of the school's is on their calendar between two moments. */
function somethingAtSchoolFor(sim: Simulation, personId: string, from: Instant, to: Instant): boolean {
  return sim.universe.scheduled.some((i) => i.status === 'pending' && i.payload.personId === personId && i.at >= from && i.at < to
    && (i.kind === CALL_KIND || i.kind === LAB_KIND || i.kind === SHIFT_KIND || i.kind === CABARET_KIND || i.kind === SUMMER_KIND));
}

/**
 * Why they can't call in sick now, or nothing (a function of its own from 2026-10-10, so the screen offers the button
 * with its reason, as the command refuses it).
 */
export function sickRefusal(sim: Simulation, person: Person): string | undefined {
  const school = person.school;
  if (!school || schoolEnded(school.standing)) return 'You’re not at school.';
  const p = zonedParts(sim.now, zone());
  const today: SchoolDate = { year: p.year, month: p.month, day: p.day };
  if (school.sickDay === keyOf(today)) return 'You’ve called in sick today already.';
  // Any day with something at school: classes, or a call, a lab, a shift, a Cabaret or Summer Cabaret call (from
  // 2026-10-10: until then only a class day, and flu on a Saturday performance or in a recess run couldn't be excused).
  const due = somethingAtSchoolFor(sim, person.id, at(today, 0), at(addDays(today, 1), 0));
  if (!coursesFor(school, today).length && !due) return 'There’s nothing at school today to miss.';
  // Before they've run: until 2026-09-27 it was taken all day, and said the day was excused after it had been counted.
  if (coursesFor(school, today).length && !due && sim.universe.scheduled.some((i) => i.kind === CLASSES_KIND && i.status !== 'pending' && i.status !== 'cancelled' && i.payload.personId === person.id && i.payload.day === keyOf(today))) return 'Today’s classes are over, so calling in sick now wouldn’t excuse anything.';
  // Down with the flu, they're sick whatever their condition reads; until 2026-09-27 the flu alone never took it low enough.
  // Hurt in a way that limits the work (`INJURY_KIND[].limits`), a doctor's note excuses them too (from 2026-10-10): until
  // then a student with a sprained ankle had to show a movement score on it, and lost a third of it (`tools/condition.ts`).
  const hurt = injuryOf(person, sim.now);
  const noted = hurt !== undefined && INJURY_KIND[hurt.kind].limits !== 'none';
  if (person.wellbeing.condition >= ESTIMATE.sickBelow && !((person.health?.fluUntil ?? 0) > sim.now) && !noted) return 'You’re well enough to go. Staying away would count as an unexcused absence.';
  return undefined;
}

/** The withholding on a nonresident alien's taxable scholarship at source: 14% for an F-1 student (IRC 1441(b)). */
export const NONRESIDENT_SCHOLARSHIP_RATE = 0.14;

/**
 * Whether school is over for them: dismissed, graduated, ended without the degree, or withdrawn by their own choice
 * (`school.withdraw`, from 2026-10-10). The four aren't the same event: the Bulletin lets a student who withdrew apply
 * to come back and one dismissed never (pp.157, 160), and their status, cover and options after differ
 * (`systems/permission.ts`, `yaleUntil`).
 */
export const schoolEnded = (standing: Standing): boolean => standing === 'dismissed' || standing === 'graduated' || standing === 'withheld' || standing === 'withdrawn';

/** Left without the degree, whichever way. */
export const leftWithout = (standing: Standing): boolean => standing === 'dismissed' || standing === 'withheld' || standing === 'withdrawn';

/** A standing as the school names it. */
export const STANDING_LABEL: Record<Standing, string> = {
  good: 'Good Standing',
  concern: 'Academic Concern',
  warning: 'Academic Warning',
  dismissed: 'Dismissed',
  graduated: 'Graduated',
  withheld: 'Degree Not Recommended',
  withdrawn: 'Withdrawn',
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
export interface Run { production: string; role: string; play?: string; by?: string; kind?: Casting['kind']; size?: PartSize; nights?: Partial<Record<Night, number>>; note?: string }

/**
 * A student's last part, which the chair reads when casting the next: its size, and how much of themselves they
 * delivered. Its nights on average and whether the director's note was heeded were kept here too until 2026-10-10,
 * a week after the chair stopped reading them; nothing else did, and they went.
 */
export interface LastWork {
  /** The last School or Rep part's size, for the balance of opportunity; Cabaret and Summer parts don't move it. */
  size?: PartSize;
  /**
   * How much of their ability they brought to it, 0 to 1 (from 2026-10-10): the player's, the mean of each night's
   * preparation and the day's condition as the evaluation found them (`DimensionResult.day`); a classmate's, the share
   * of calls they keep (`reliabilityOf`), as their calls aren't played one by one. What the chair reads of a last run
   * since, in place of the nights' bands, which read the craft a second time. Until 2026-10-12 the condition read was
   * the whole of it, with the stamina's drain late in the play and a slip's shake in it, which read the stamina and the
   * night's draw a second time.
   */
  delivery?: number;
  /**
   * The player's: how much evidence the delivery stands on (`ESTIMATE.casting.record`), and the runs it was read
   * from at the last casting, for Why This Cast (from 2026-10-10).
   */
  weight?: number;
  from?: { what: string; source: RunSource | 'before'; nights?: number; delivery: number; weight: number }[];
}

/** Where a run was played: a School production, the Rep, the Yale Cabaret or the Summer Cabaret. */
export type RunSource = 'school' | 'rep' | 'cabaret' | 'summer';

/**
 * A run of nights, kept whatever kind it was (from 2026-10-10): its nights played and missed, how much of themselves
 * the student delivered across them, the quality of the nights as judged (for the record, never the casting), and
 * the casting that read it. Until then the chair read only the last School production's delivery, and a Cabaret or a
 * Summer run reached nothing it decided.
 */
export interface RunRecord {
  key: string; source: RunSource; production: string; play?: string; role: string; size?: PartSize; term?: number;
  nights: number; missed: number; delivered: number; quality: number; firstAt: Instant; lastAt: Instant;
  readAtCasting?: number;
}

/**
 * A classmate: a name, a craft, whether they're cast as an actor or an
 * actress, their drive (how much they bring to a day, against an ordinary
 * classmate's), and their last part. Until 2026-09-28 a classmate was a name
 * and a craft, all of them equally driven, and cast in nothing.
 */
/**
 * A classmate's abilities beside presence (from 2026-10-10), drawn once as the player's are (`mateAbilities`):
 * composure by an emotional stability drawn for them, and the other four from their kin in the craft
 * (`ABILITY_KIN`). Emotional Depth, Memory, Vocal and Physical Expression are their craft, as the player's are.
 */
export interface MateAbilities { composure: number; listening: number; imagination: number; focus: number; adaptability: number }

export interface Classmate {
  name: string; craft: Craft; title?: 'actor' | 'actress'; drive?: number; last?: LastWork;
  abilities?: MateAbilities;
  /** Their last run, judged as the player's nights are (`classmateRun`): its whole, for the work's own record, shown in Around The Class (from 2026-10-10; until then it was kept and never shown). */
  shown?: { production: string; quality: number; at: Instant; runs: number };
  /** How far their craft can grow (`CEILING`). */
  ceiling?: Craft;
  /** Their presence, drawn once as the player's is (`classmatePresence`). */
  presence?: number;
  /** Where they stand with the player, -100 to 100: a cast shared draws them closer, a lead taken from the other apart (`BONDS`). */
  bond?: number;
  /**
   * As a partner in class work (`systems/coursework.ts`, from 2026-10-07): how reliably they come, how far they trust
   * you, the rehearsals kept with you, the ones they missed and the ones you did, when you met, and what's happened.
   */
  reliability?: number; trust?: number; kept?: number; stoodUp?: number; missedByYou?: number; met?: Instant;
  log?: { at: Instant; what: string }[];
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
  /** The term's coursework shown, and how much of it unready and how much strong or better (from 2026-10-10). */
  coursework?: { shown: number; unready: number; strong: number };
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
  kind: 'understudy' | 'role' | 'project' | 'thesis' | 'hughes' | 'shakespeare' | 'carlotta';
  term: number;
  /** Went on as an understudy, or performed. */
  performed: number;
  /** Read by a term's evaluation (from 2026-10-10), so a run is judged once. */
  reviewed?: boolean;
}

export interface SchoolRecord {
  classOf: number;
  termsBegun: number;
  standing: Standing;
  /**
   * When the degree or a dismissal ended it (from 2026-10-09), which the Yale Health plan runs on from. It was the day
   * the career began until the career went; a save from before has neither, and its plan runs on.
   */
  endedAt?: Instant;
  /** Withdrew on or before the fifteenth day of a term's classes, when Yale Health's cover is canceled back to its start (p.174). */
  withdrewEarly?: boolean;
  /** Each course's record, by term and number (`systems/courserecord.ts`, from 2026-10-10). */
  courses?: Record<string, CourseRecord>;
  /** Past Commencement with an Incomplete outstanding: the degree waits for it (`courserecord.ts`). */
  awaitingDegree?: boolean;
  /** When they registered for the program (`registered`, from 2026-10-10): classes count them, and work-study's I-9 is done, from then. */
  registeredAt?: Instant;
  /**
   * In the casting pool: out after missed calls, labs among them from 2026-10-12 (`missedCallsOut`), back after a good
   * evaluation. Until then only a missed rehearsal or run-through took a student out.
   */
  castable: boolean;
  /**
   * Runs played after their term's evaluation and not yet judged, kept from the next casting for the next
   * evaluation (from 2026-10-10): a first-year's Carlotta in May, after April's evaluation, was never judged.
   */
  unreviewed?: Casting[];
  classmates: Classmate[];
  tally: TermTally;
  /**
   * The calls of the terms before this one, made and answered, folded in as each new term's tally starts (from
   * 2026-10-12): what Your Work So Far's Reliability reads with this term's (`identityOf`). Until then it read this
   * term's alone, and was gone at each new term until six more were made. Absent on a save from before, and read as none.
   */
  callsBefore?: { calls: number; answered: number };
  /** The player's last part, for the chair's next casting. */
  lastWork?: LastWork;
  /** Every run played, the latest last, the most recent twelve (`RunRecord`, from 2026-10-10). */
  runs?: RunRecord[];
  /**
   * The chair's read of the cast the player is in, kept from 2026-10-10 for the screen: each student's fit for the
   * play, how much of themselves they delivered last time, the balance of opportunity, the score and the part.
   */
  castRead?: { term: number; play: string; reads: Partial<Craft>; kinds: string[]; rows: { name: string; you: boolean; fit: number; delivery: number; balance: number; score: number; part: string; size: PartSize; from?: LastWork['from'] }[] };
  /** The term's casting across the class: who's in what, as which part. */
  /** The class's casts this term, and the week of its Cabaret show where it has one (`cabaretCompany`, from 2026-10-11). */
  around?: { term: number; list: { name: string; production: string; part: string; size?: PartSize }[]; cabaretWeek?: string };
  /** What they performed in at school, for the résumé: a production played, or understudied and gone on in. */
  /**
   * What they played, each with the year of its run (read by the résumé from 2026-10-11). A credit an older save wrote
   * before the acceptance pass of 2026-10-11 has the year it was written down; opened, each is dated by its term's
   * casting notice where one is kept (`creditsDated`), and one with none keeps its year, said (`yearAsKept`).
   */
  credits?: { production: string; role: string; kind: Casting['kind'] | 'cabaret' | 'summer'; year: number; wentOn: number; size?: PartSize; yearAsKept?: true }[];
  /** The credits' years checked against the casting notices, once (`redateCredits`, from 2026-10-11). */
  creditsDated?: true;
  /** A Cabaret show this term: which term, its production week's Thursday, the shows played, and the part and its nights (`Run`). */
  /** `withdrawn`: taken out of the show by an academic warning that came during it (from 2026-10-10, `leaveCabaret`). */
  cabaret?: { term: number; week: string; performed: number; withdrawn?: { at: Instant; why: string } } & Partial<Run>;
  /** The Summer Cabaret company: the summer's year, the shows played in each run, whether it's over, and each show's play, part and nights. */
  summer?: { year: number; played: number[]; until: Instant; out?: boolean; shows?: Run[] };
  history: TermReview[];
  casting?: Casting;
  /** A Yale Rep assignment beside it: an understudy, or a role at a director's invitation. */
  rep?: Casting;
  /** The year's work-study: hours worked, elective hours asked for, owed on Friday, and assigned hours booked (to `WORK_STUDY.assignedHours`). */
  workStudy: { electiveHours: number; owedHours: number; assignedBooked?: number };
  /** The work-study protective equipment, when bought and for how much (`REQUIRED_PPE`, from 2026-10-08). */
  ppe?: { at: Instant; cost: Money };
  /** The day, `YYYY-MM-DD`, they called in sick, if today. */
  sickDay?: string;
  /** The courses' work between meetings, and the first week (`systems/coursework.ts`, from 2026-10-07). */
  coursework?: import('./coursework').Coursework;
  /**
   * The calendar terms a leave or a repeated year put them behind the program (`academicTerm`), two a time, from
   * 2026-10-10 (`systems/leave.ts`). Absent, none.
   */
  offset?: number;
  /** The calendar terms they were enrolled in, a term begun and not left on leave (`systems/leave.ts`). Absent, every term begun. */
  enrolled?: number[];
  /** A leave asked for, granted, under way; and the leaves before it (`systems/leave.ts`). */
  leave?: import('./leave').Leave;
  leaves?: import('./leave').Leave[];
  /** A year asked to be repeated, and how many have been (`systems/leave.ts`). */
  repeat?: import('./leave').Repeat;
  repeats?: number;
  /** A last year failed: until when a repeat can be asked for, before the degree is withheld (`systems/leave.ts`). */
  repeatBy?: Instant;
  /** Yale Health's assessment of whether a student can go on (`systems/leave.ts`, a mandatory leave's process), and those before. */
  welfare?: import('./leave').Welfare;
  welfares?: import('./leave').Welfare[];
  /** Back from a leave, or held: registration to do again before classes count them (`school.reregister`). */
  mustRegister?: boolean;
  /** Yale Health's student cover lapsed, from and to: a leave's, with no Affiliate cover (`systems/leave.ts`, `coverOn`). */
  uncovered?: { from: Instant; until?: Instant }[];
  /** A financial hold on the Yale account, since when (`systems/leave.ts`): no registration and no diploma while it stands. */
  hold?: Instant;
  /** Late fees charged on the Yale account, by calendar term, against the Bulletin's cap. */
  lateFees?: Record<string, Money>;
  /** Work-study hours excused (illness, injury, a School call), by academic year's fall term, for conversion to grant aid. */
  excusedHours?: Record<string, number>;
  /** Hours converted to grant aid, by the same year. */
  convertedHours?: Record<string, number>;
  /**
   * The classes the player was in before falling a year behind, kept whole with every relationship and record
   * (`systems/leave.ts`, from 2026-10-10): each class's year, its classmates, and the calendar term it's been played
   * forward to (`advanceMates`).
   */
  formerClasses?: {
    classOf: number; classmates: Classmate[]; playedTo: number; left: Instant; offset?: number; productions?: FormerProduction[]; graduatedAt?: Instant;
    /** The class the student was in when they left the School, followed on without them (`leaveClassBehind`, from 2026-10-11). */
    leftBehind?: true;
    /** A term the class had partly with the student: its class days from `from` are still to play, its casts were live. */
    resume?: { term: number; from: string };
  }[];
  /** The productions the class a student joined had before they came (`joinCohort`, from the integration pass of 2026-10-10). */
  joinedHistory?: FormerProduction[];
  /**
   * A new cohort to join at the next term of study, set by a leave's start or a repeat granted: the offset the student
   * had before falling behind, which is still the first class's, and the last calendar term spent with that class.
   */
  joinsCohort?: { offsetBefore: number; lastWith: number };
  /**
   * An additional term to retake failed courses (`systems/leave.ts`, from 2026-10-10): its calendar term, and each
   * course's code and the program term it belongs to, met in that term's season with the class then in that year.
   */
  extra?: { term: number; courses: { code: string; academic: number; name: string }[] };
  /** Additional-term requests, and the program years a repeat has been granted for (`systems/leave.ts`). */
  extraRequest?: import('./leave').ExtraRequest;
  repeatedYears?: number[];
  /** The financial-aid office's review of support for a term past six (`school.request_aid_review`). */
  aidReview?: import('./leave').AidReview;
  /** The faculty's reviews of a disqualification (`facultyReview`), each kept. */
  reviews?: { at: Instant; term: number; outcome: 'dismissed' | 'warning'; why: string }[];
  /** Tuition billed to the Yale account for a term past the sixth, by calendar term (`billUnsupportedTerm`). */
  enrolledBilled?: Record<string, Money>;
}

export const TERM_KIND = 'school.term';
export const WEEK_KIND = 'school.week';
export const CLASSES_KIND = 'school.classes';
export const SHIFT_KIND = 'school.shift';

/**
 * A School item called off, an elective evening's hours given back as an evening not worked gives them (from 2026-10-13:
 * until then a leave, or leaving the School, called one off with its four hours still counted as asked for; found by
 * that day's evidence pass).
 */
export function callOff(sim: Simulation, person: Person, item: ScheduledItem): void {
  if (item.kind === SHIFT_KIND && item.payload.elective === true && person.school) person.school.workStudy.electiveHours -= Number(item.payload.hours ?? 0);
  sim.timeline.cancel(item.id, sim.now);
}
export const PAYDAY_KIND = 'school.payday';
export const CALL_KIND = 'school.call';
export const EVALUATION_KIND = 'school.evaluation';
export const COMMENCEMENT_KIND = 'school.commencement';
export const CONFERRAL_KIND = 'school.conferral';

/**
 * Yale confers most degrees in May or December, and "multiple times a year" (the University Registrar; the Graduate
 * School's 2026–27 calendar gives 22 December 2026). SLATE confers a degree finished in an additional fall term on 22
 * December; later years' dates are SLATE's estimate by the same day. A diploma off-cycle is mailed six weeks after.
 */
export const DEGREE_DATES = { december: [12, 22] as const, mailedWeeks: 6, source: 'https://registrar.yale.edu (degree conferral); Yale Graduate School 2026-2027 academic calendar; research-yale-leave-2.json' } as const;
export const CABARET_KIND = 'school.cabaret';
export const SUMMER_KIND = 'school.summer';
export const STIPEND_KIND = 'school.stipend';
/** The Summer Cabaret as an employer: its stipend's wages, and an injury at its work (`Injury.atWork.employer`). */
const SUMMER_EMPLOYER = 'yale-summer-cabaret';
/** The stipend’s line in the ledger, paid each Friday for the seven days before it (`STIPEND_KIND`, `workDoneIn`). */
const STIPEND_MEMO = 'Yale Summer Cabaret stipend, the week';
export const RECESS_KIND = 'school.recess';
export const LAB_KIND = 'school.lab';
export const CONVERT_KIND = 'school.convert';
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
  /**
   * And from 2026-10-10 a fifth of a student's fit by how much of themselves they delivered in their last run
   * (`LastWork.delivery`), in place of a point and a half a night's band and as much again for a director's note
   * heeded, which read the craft again. A note heeded shows in the fit through the skill itself; it was marked for the
   * record (`heedGain`, the skill grown a point and a half) until 2026-10-10, read by nothing. SLATE's estimates.
   */
  casting: {
    balance: { lead: -2, supporting: 0, featured: 2 } as Record<PartSize, number>, delivery: 0.2,
    /**
     * What the chair reads of a student's runs since the last casting (from 2026-10-10): each run's delivery, weighted
     * by its nights up to `nightsCap` and by its kind (a Cabaret show or a Summer play half a School production's),
     * with the record before carried at `carry` of its weight, and the whole held to `cap`. So a short run can't
     * erase a long one, more runs add evidence and never advantage (it's an average), a run not played counts for
     * nothing either way, and each run is read once. SLATE's estimates. The faculty's term evaluation reads the
     * term's School, Rep and Cabaret runs (`evaluate`); the Summer Cabaret is outside the term, and reaches casting
     * only.
     */
    record: { weight: { school: 1, rep: 1, cabaret: 0.5, summer: 0.5 } as Record<RunSource, number>, nightsCap: 8, carry: 0.5, cap: 12 },
  },
  /**
   * What a night's band does (`nightOf`, judged by `systems/evaluation.ts` from 2026-10-09): a strong or remarkable
   * night lifts morale, and a remarkable one the presence; an off night stings. Until 2026-10-09 the band was readiness
   * plus the part's craft against a par (a School lead 62, the Rep's 82) at a fortieth a point, with luck a fifth either
   * side, cut at 0.75, 0.98 and 1.18; the pars became `NIGHT_DIFFICULTY`. A remarkable Rep night added to reputation
   * too, until it went on 2026-10-09.
   */
  nights: { lift: 3, sting: 3, presence: 0.02 },
  /**
   * What a day's classes, a rehearsal and a shift take out of a body, in energy. A performance took 10 flat until
   * 2026-10-16 (brief 10), whatever the play, the part and the actor's stamina; it costs its workload since
   * (`eveningCost`, `systems/workload.ts`).
   */
  energy: { classes: 6, rehearsal: 8, shift: 4 },
  /** The chance, each performance, that an understudy goes on. */
  goesOn: 0.02,
  /** How many hours before a performance an understudy on call hears whether they're on: at five for an eight o'clock curtain. */
  onCallAhead: 3,
  /**
   * Attendance under this, or growth under this share of the class's, is short of the program's requirements: SLATE's
   * estimates, both (the Bulletin publishes no threshold for either).
   */
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
  /**
   * A term's coursework, read at the evaluation from 2026-10-10 once three pieces were shown: half or more of it
   * unready falls short of the program's standards, as a run gone mostly off does; half or more of it strong or
   * exceptional is noted. Until then the bands reached the term only through the meetings' growth (`WORK.weight`).
   * SLATE's reading of "appropriate standards".
   */
  coursework: { shown: 3, unready: 0.5, strong: 0.5 },
  /**
   * Missed calls in a term that take an actor out of the casting pool, labs and rehearsals together (`missedCallsOut`;
   * a missed lab took nobody out until 2026-10-12): the removal is the Bulletin's, the count SLATE's estimate.
   */
  missedCallsOut: 2,
  /**
   * The acting (`actingOf`) at which a director asks for a third-year in a
   * Yale Rep role. It was 80 until 2026-09-27, on the one number acting was
   * then, which ran about three points above the three skills it became by
   * the third year; 77 keeps the class's best actor as far above it.
   */
  castAtRep: 77,
  /**
   * A classmate's Cabaret (from 2026-10-11): the class makes one new piece a term, in a week drawn among the term's
   * (three weeks in, clear of a recess, as the player's is), and each classmate free of their own production's calls
   * that week joins it at this chance, at most this many. The Cabaret is the students' own and voluntary (the
   * Bulletin, 2026–27); how many of a class take part isn't published, so both numbers are SLATE's estimate.
   */
  cabaretMates: { chance: 0.35, most: 4 },
  /** Below this condition a body is unwell enough to call in sick. */
  sickBelow: 55,
} as const;

const SKILL_IDS = SKILLS.map((s) => s.id);

export function zone(): string {
  return CITIES.require(YALE_DRAMA.cityId).timeZone;
}

export function at(date: SchoolDate, hour: number, minute = 0): Instant {
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

/** A term's start, as the calendar names it: its season, not its year, which the day already says (from 2026-10-09; `Fall Term 2026 Begins` until then). */
export function termBegins(term: number): string {
  return `The ${termStart(term).fall ? 'Fall' : 'Spring'} Term Begins`;
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
  // Past the program's six terms too, for a student a leave or a repeated year carries on (from 2026-10-10).
  for (let t = 0; t < CALENDAR_TERMS; t += 1) if (keyOf(termStart(t).date) <= keyOf(day)) term = t;
  return term;
}

/**
 * The calendar terms SLATE keeps: the program's six, a year of leave and a year repeated, and one more (from
 * 2026-10-10). The Bulletin caps the degree at nine semesters of study and leave at three (p.194).
 */
export const CALENDAR_TERMS = 12;

/**
 * Where a student is in the program in a calendar term: the term less the calendar terms a leave or a repeated year
 * put them behind (`SchoolRecord.offset`, from 2026-10-10). Always a whole number of years, so a fall is a fall.
 */
export const academicTerm = (school: SchoolRecord | undefined, calendarTerm: number): number => calendarTerm - (school?.offset ?? 0);

/**
 * The courses a student has on a day (from 2026-10-10): in an additional term (`SchoolRecord.extra`), only the
 * courses being retaken, each in its own year's timetable for the season; otherwise the program's year they're in.
 */
export function coursesFor(school: SchoolRecord | undefined, day: SchoolDate): Course[] {
  const extra = school?.extra;
  if (extra && termOf(day) === extra.term) {
    if (!isClassDay(extra.term, day)) return [];
    const season = termStart(extra.term).fall ? 'fall' : 'spring';
    return extra.courses.flatMap((c) => (timetable(yearOfTerm(c.academic), season)[weekday(day) - 1] ?? []).filter((x) => x.code === c.code));
  }
  return coursesOn(day, school?.offset ?? 0);
}

/**
 * The courses meeting on a day, for a student so many calendar terms behind (`offset`, from 2026-10-10): the
 * program's year they're in, on the calendar's days.
 */
export function coursesOn(day: SchoolDate, offset = 0): Course[] {
  const term = termOf(day);
  if (!isClassDay(term, day)) return [];
  const academic = term - offset;
  if (academic < 0 || academic >= YALE_DRAMA.terms) return [];
  return timetable(yearOfTerm(academic), termStart(term).fall ? 'fall' : 'spring')[weekday(day) - 1] ?? [];
}

/**
 * When the next classes begin after a moment, at nine on the next class day,
 * looking up to a term ahead; the calendar holds only the week planned.
 */
export function nextClasses(from: Instant, school?: SchoolRecord): Instant | undefined {
  // On leave, none until the return term (from 2026-10-10); the program's year by the offset.
  if (school?.leave?.status === 'on') return undefined;
  const p = zonedParts(from, zone());
  let day: SchoolDate = { year: p.year, month: p.month, day: p.day };
  for (let n = 0; n < 200; n += 1, day = addDays(day, 1)) {
    if (coursesFor(school, day).length && at(day, 9) > from) return at(day, 9);
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

/**
 * How the hour suits this person (from 2026-10-09): before noon an early riser is sharper and a night owl flatter
 * (`morning`), from five in the evening the other way round (`evening`); between, nobody's hour. Classes start at
 * nine and rehearsals and performances in the evening, so the traits that promise mornings or nights read them.
 */
export function hourFit(person: Person, hour: number): number {
  if (hour < 12) return personalityOf(person, 'morning');
  if (hour >= 17) return personalityOf(person, 'evening');
  return 1;
}

/** Focus for work at an instant, where it happens: readiness, then the hour's fit, inside focus's own bounds. */
export function focusAt(sim: Simulation, person: Person, at: Instant): number {
  const z = CITIES.get(person.currentLocationId)?.timeZone ?? sim.homeZone;
  return Math.min(1.2, Math.max(0.3, focusOf(person) * hourFit(person, zonedParts(at, z).hour)));
}

/**
 * The day's condition as a piece of work meets it (`systems/evaluation.ts`), from 2026-10-09: readiness at the hour's
 * fit, the flu, and an injury still mending, by what it limits (from 2026-10-10). Weather reaches it only through these: a cold night's sleep or a wet walk
 * is already in readiness.
 */
export function conditionAt(sim: Simulation, person: Person, at: Instant): Condition {
  const z = CITIES.get(person.currentLocationId)?.timeZone ?? sim.homeZone;
  const ill = (healthOf(person).fluUntil ?? 0) > at;
  // What the injury limits (`INJURY_KIND[].limits`, from 2026-10-10): the body's dimensions, every one for a
  // concussion, and nothing for a cut or a knock.
  const hurt = injuryOf(person, at);
  const limits = hurt ? INJURY_KIND[hurt.kind].limits : 'none';
  return { readiness: readiness(person) * hourFit(person, zonedParts(at, z).hour), ...(ill ? { ill } : {}), ...(limits === 'body' ? { injured: true } : {}), ...(limits === 'mind' ? { concussed: true } : {}) };
}

/**
 * Where ordinary work levels off for this person (`develop`): a craft skill's own ceiling, a new ability's the mean
 * of its kin's (`ABILITY_KIN`), and 100 for discipline, presence and composure, which classes don't grow.
 */
export function reachOf(person: Person, target: Target): number {
  const id = targetId(target);
  if (!person.craft) return 100;
  if (!isAbility(id)) return ceilingOf(person.craft, id as Skill);
  const held = ({ emotionalDepth: 'emotion', memory: 'memorization', vocal: 'voice', physical: 'movement' } as Partial<Record<AbilityId, Skill>>)[id];
  if (held) return ceilingOf(person.craft, held);
  const kin = ABILITY_KIN[id];
  return kin ? kin.reduce((s, k) => s + ceilingOf(person.craft!, k), 0) / kin.length : 100;
}

/**
 * Whether classes grow it at all (from 2026-10-10): a technique, an ability kept in the craft, or one with kin among the
 * craft (`ABILITY_KIN`). Presence and composure grow in front of people, discipline from practice kept up, and stamina
 * from workouts; until 2026-10-10 the Profile showed each a "Classes Reach" of full, which classes never brought it to.
 */
export function classesGrow(target: Target): boolean {
  const id = targetId(target);
  if (!isAbility(id)) return true;
  return Boolean(CRAFT_ABILITY[id] || ABILITY_KIN[id]);
}

/** Ordinary development from a piece of work (a class, a step, a call): toward the reach, never past it, recorded. */
export function ordinary(sim: Simulation, person: Person, target: Target, focus: number, weight: number, source: string): number {
  return develop(sim, person, target, { weight, focus, deliberate: false, source }, reachOf(person, target));
}

/** The abilities a class grows besides its skills: those whose kin it trains (`ABILITY_KIN`), a share each. */
export const classAbilities = (skills: readonly Skill[]): AbilityId[] => ABILITY_DEFS.filter((d) => (ABILITY_KIN[d.id] ?? []).some((k) => skills.includes(k))).map((d) => d.id);

/** A classmate's ability grown as an ordinary session grows the player's, toward the mean of its kin's ceilings. */
export function growMateAbility(sim: Simulation, person: Person, i: number, id: keyof MateAbilities, focus: number, weight: number): void {
  const mate = person.school!.classmates[i]!;
  const a = mateAbilities(sim, person, i);
  const kin = ABILITY_KIN[id as AbilityId] ?? [];
  const reach = kin.length ? kin.reduce((s, k) => s + ceilingOf(mate.craft, k), 0) / kin.length : 100;
  a[id] = Math.min(100, a[id] + abilityGain(a[id], reach, { weight, focus, deliberate: false }));
}

/** What a class gives an ability it reaches through its skills, as a share of a session's weight: SLATE's estimate. */
export const CLASS_ABILITY_SHARE = 0.5;

/**
 * A classmate's craft grown by a session (from 2026-10-16, a classmate's only): toward the ceiling, never past it. The
 * player's grows through `ordinary` and `develop` (`grewFrom`), which halve the same growth again the same day and read
 * discipline; until 2026-10-16 a class, a night, a call, a lab and coursework's training grew the player through this,
 * which did neither (attributes-matrix.md, "duplicate mechanic").
 */
export function grow(craft: Craft, skill: Skill, focus: number, weight = 1): void {
  // The gain falls to nothing at the ceiling, so a session never passes it.
  craft[skill] += sessionGain(craft[skill], focus, weight, ceilingOf(craft, skill));
}

/**
 * The player's craft grown by a call, a night, a lab or a step of coursework, and each skill's rise kept in the
 * development history under its source (from 2026-10-10): until then only a class meeting was kept, and an ability
 * grown by a run of rehearsals said on its look that nothing had moved it.
 */
export function grewFrom(sim: Simulation, person: Person, source: string, focus: number, weights: readonly (readonly [Skill, number])[]): void {
  if (!person.craft) return;
  // Each skill once, its weights summed (from 2026-10-16): a night that asks the scene twice, as every night and a play
  // that reads it do, grows it once by both, not once and then again at the repeat's half (`grown`).
  const by = new Map<Skill, number>();
  for (const [k, w] of weights) by.set(k, (by.get(k) ?? 0) + w);
  for (const [k, w] of by) ordinary(sim, person, k, focus, w, source);
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
 * A class admitted in a later year, the cohort a student who fell a year behind goes on with (from 2026-10-10;
 * `systems/leave.ts`): drawn as the first class was (`admittedClass`), by the same talent and names, keyed by its own
 * class year so it isn't the first class again, their ceilings bound and their abilities drawn under the same key.
 */
export function drawCohort(sim: Simulation, person: Person, classOf: number): Classmate[] {
  const rng = sim.rng('school.class', person.id, `cohort-${classOf}`);
  const t = ESTIMATE.talent;
  const skills = (talent: number) => Object.fromEntries(SKILL_IDS.map((id) => [id, Math.round(Math.min(95, talent + t.spread * (rng.next() + rng.next() - 1)) * 10) / 10])) as Craft;
  const families = [...FAMILY];
  const given = { actress: [...GIVEN_ACTRESS], actor: [...GIVEN_ACTOR] };
  // Not a name the first class has: a returning student knows both.
  const taken = new Set([...(person.school?.classmates ?? []), ...(person.school?.formerClasses ?? []).flatMap((c) => c.classmates)].map((m) => m.name));
  return Array.from({ length: YALE_DRAMA.classSize - 1 }, (_, i): Classmate => {
    const craft = skills(t.from + (t.to - t.from) * (rng.next() + rng.next()) / 2);
    const title = rng.next() < 0.5 ? 'actress' : 'actor';
    const names = given[title];
    let name = '';
    for (let n = 0; n < 50 && (!name || taken.has(name)); n += 1) name = `${names[Math.floor(rng.next() * names.length)]} ${families[Math.floor(rng.next() * families.length)]}`;
    taken.add(name);
    const drive = Math.round((1 + ESTIMATE.driveSpread * (2 * rng.next() - 1)) * 1000) / 1000;
    const mate: Classmate = { name, craft, title, drive, ceiling: ceilingFrom(craft) };
    bindCeiling(craft, mate.ceiling!);
    mate.abilities = drawMateAbilities(sim.universe.meta.seed, `${person.id}:${classOf}`, i, craft);
    // Presence and reliability drawn now, under the class's own key (from the integration pass of 2026-10-10): until
    // then they were drawn later by place alone, and the new class's fifth had the first class's fifth's presence and
    // reliability to the decimal.
    presenceFor(sim, person, mate, `cohort-${classOf}-mate-${i}`);
    reliabilityFor(sim, person, mate, `cohort-${classOf}-reliability-${i}`);
    return mate;
  });
}

/** A production a first class played without the student (`formerProductions`): when, what, who played what, and how it went. */
export interface FormerProduction {
  term: number; academic: number; name: string; play?: string; by?: string; from: string; to: string;
  cast: { name: string; part: string; size: PartSize; quality: number }[];
}

/**
 * A class's Cabaret show in a term (from 2026-10-11, `ESTIMATE.cabaretMates`): its week, drawn among the Thursdays three
 * weeks into the term's classes with the week clear of a recess, and the classmates in it, each drawn at the chance
 * among those whose own calls (`busy`, the days a production calls them) leave its evenings and nights free, as the
 * player's week must be clear of theirs (`cabaretWeek`). A double-cast classmate is busy every week of their runs, so
 * the Bulletin's bar on double-cast actors holds without a rule of its own. A classmate's standing isn't simulated, so
 * none is kept out by a warning. Until 2026-10-11 only the player did the Cabaret, and a class's lists had no show.
 */
export function cabaretCompany(sim: Simulation, person: Person, key: string, term: number, mates: number, busy: (i: number) => ReadonlySet<string>): { week: SchoolDate; evenings: SchoolDate[]; members: number[] } | undefined {
  const period = classPeriod(term);
  const weeks: SchoolDate[] = [];
  const from = addDays(period.from, 21);
  for (let thu = addDays(from, (4 - weekday(from) + 7) % 7); keyOf(thu) <= keyOf(period.to); thu = addDays(thu, 7)) {
    const sat = addDays(thu, 2);
    if (period.off.some(([a, b]) => !(b < keyOf(thu) || a > keyOf(sat)))) continue;
    weeks.push(thu);
  }
  if (!weeks.length) return undefined;
  const week = weeks[Math.floor(sim.rng('school.cabaret_mates', person.id, `${key}-${term}-week`).next() * weeks.length)]!;
  const evenings = cabaretEvenings(week, period.off);
  const days = [...evenings, week, addDays(week, 1), addDays(week, 2)].map(keyOf);
  const members: number[] = [];
  for (let i = 0; i < mates && members.length < ESTIMATE.cabaretMates.most; i += 1) {
    const held = busy(i);
    if (days.some((d) => held.has(d))) continue;
    if (sim.rng('school.cabaret_mates', person.id, `${key}-${term}-${i}`).next() < ESTIMATE.cabaretMates.chance) members.push(i);
  }
  return members.length ? { week, evenings, members } : undefined;
}

/** The days a School production calls its cast: each rehearsal and each night (`rehearsalDays`, its runs). */
export function productionDays(term: number, p: { runs: SchoolDate[]; weeks: number }): Set<string> {
  return new Set([...rehearsalDays(term, p.runs[0]!, p.weeks), ...p.runs].map(keyOf));
}

/** The days the Rep calls its company in a term: Tuesday to Saturday through its rehearsals, every night of its run. */
export function repDays(term: number): Set<string> {
  const rep = repProduction(term);
  const out = new Set<string>();
  for (let d = parseKey(rep.rehearsals.from); keyOf(d) <= rep.run.to; d = addDays(d, 1)) out.add(keyOf(d));
  return out;
}

/** A Cabaret show's calls, the same for any class: its evenings' rehearsals and its five shows (`YALE_CABARET`). */
export const CABARET_RUN = { rehearsals: YALE_CABARET.rehearsalEvenings, performances: YALE_CABARET.shows.length, part: 'A Part In A Cabaret Show' } as const;

/**
 * A first class's classmate through a run (from 2026-10-11, out of `formerProductions`, for the Rep's company and the
 * Cabaret too): grown by its rehearsals and nights as a company is, judged as a classmate's run is, their composure
 * grown by the nights, and a School part (`size`) kept for the next casting's balance.
 */
function formerRun(sim: Simulation, person: Person, c: NonNullable<SchoolRecord['formerClasses']>[number], i: number, reads: Partial<Craft>, shown: string, rehearsals: number, nights: number, last: Instant, size?: PartSize): number {
  const mate = c.classmates[i]!;
  const kept = reliabilityFor(sim, person, mate, `reliability-${i}`);
  const f = ESTIMATE.classmateFocus * (mate.drive ?? 1) * ESTIMATE.classmateAttendance;
  for (let n = 0; n < rehearsals; n += 1) rehearse(mate.craft, f);
  for (let n = 0; n < nights; n += 1) playNight(mate.craft, reads, f);
  if (mate.ceiling) bindCeiling(mate.craft, mate.ceiling);
  const e = judge(sim.universe.meta.seed, formerPerformer(sim, person, mate, i), {
    task: TASK_PROFILES.performance!, techniques: reads, prep: { lines: kept, blocking: kept, notes: kept }, required: { lines: 1, blocking: 1, notes: 1 },
    difficulty: NIGHT_DIFFICULTY.school.supporting, condition: { readiness: 75 }, key: `former:${c.classOf}:${i}:${shown}`,
  });
  mate.shown = { production: shown, quality: e.overall, at: last, runs: (mate.shown?.runs ?? 0) + 1 };
  if (size) mate.last = { ...(mate.last ?? {}), size, delivery: kept };
  const a = mate.abilities ?? (mate.abilities = drawMateAbilities(sim.universe.meta.seed, person.id, i, mate.craft));
  for (let n = 0; n < nights; n += 1) a.composure = Math.min(100, a.composure + (100 - a.composure) * ATTRIBUTES.composureGain.performance);
  return e.overall;
}

/**
 * A run cast while the student was in the class, ended after they left the School (`COMPANY_KIND`, from 2026-10-11):
 * its classmates grown and judged as a first class's are (`formerRun`), and the run kept in the class's record.
 */
function formerCompanyRun(sim: Simulation, person: Person, c: NonNullable<SchoolRecord['formerClasses']>[number], item: { at: Instant; label: string; payload: Record<string, unknown> }): void {
  const reads = (item.payload.reads as Partial<Craft> | undefined) ?? COMPANY_READ;
  const shown = String(item.payload.production ?? item.label.replace(/: The (Run|Show) Ends$/, ''));
  const term = c.resume?.term ?? c.playedTo;
  const around = person.school!.around?.term === term ? person.school!.around.list : [];
  const cast: FormerProduction['cast'] = [];
  for (const i of item.payload.mates as number[]) {
    const mate = c.classmates[i];
    if (!mate) continue;
    const quality = formerRun(sim, person, c, i, reads, shown, Number(item.payload.rehearsals), Number(item.payload.performances), item.at);
    const part = around.find((a) => a.name === mate.name && (a.production === shown || shown.startsWith(a.production)));
    cast.push({ name: mate.name, part: part?.part ?? 'In The Company', size: part?.size ?? 'featured', quality });
  }
  const p = zonedParts(item.at, zone());
  const day = keyOf({ year: p.year, month: p.month, day: p.day });
  if (cast.length) (c.productions ??= []).push({ term, academic: term - (c.offset ?? 0), name: shown, from: String(item.payload.opened ?? day), to: day, cast });
}

/**
 * The student's class's Cabaret show in a term (`cabaretCompany`, from 2026-10-11): listed with the term's casts, and
 * those in it grown once it's played (`COMPANY_KIND`). A first fall, which has no casting, has its show too, as a
 * first-year may take one.
 */
function classCabaret(sim: Simulation, person: Person, term: number, callsOf: ReadonlyMap<number, ReadonlySet<string>>): void {
  const school = person.school!;
  const cab = cabaretCompany(sim, person, `class-${school.classOf}`, term, school.classmates.length, (i) => callsOf.get(i) ?? new Set());
  if (!cab) return;
  const show = cabaretSeason(term);
  school.around ??= { term, list: [] };
  for (const i of cab.members) school.around.list.push({ name: school.classmates[i]!.name, production: show, part: CABARET_RUN.part });
  school.around.cabaretWeek = keyOf(cab.week);
  schedule(sim, person, at(addDays(cab.week, 2), 23, 30), { kind: COMPANY_KIND, label: `${show}: The Show Ends`, minutes: 0, requiresPlayer: false, payload: { mates: cab.members, rehearsals: CABARET_RUN.rehearsals, performances: CABARET_RUN.performances, reads: NEW_PLAYS_READ, production: show, opened: keyOf(cab.week) } });
}

/** The year a class's plays are dealt from: its own class year (`playOf` reads the player's). */
const asClassOf = (person: Person, classOf: number): Person => ({ ...person, school: { ...person.school!, classOf } });

/**
 * A first class's productions in a term it had without the student (from the integration pass of 2026-10-10): cast by
 * the chair's rule, the same as the student's own class (`castScore`, read on the craft, `readOf`), into the
 * productions its year has (`schoolProduction`), with the plays dealt for its own class year (`playOf`); each cast
 * member grown by the rehearsals and the nights as a company is (`rehearse`, `playNight`), judged as a classmate's run
 * is, and their last part kept for the next casting's balance. Until then a first class had its classes played forward
 * and none of its productions. The student is never in these casts: they were somewhere else. Recorded once a term.
 * From 2026-10-11 its third-year fall's best play in the Rep's company instead, as the student's own class's do, and the
 * class has its Cabaret show (`cabaretCompany`): until then a first class's Rep and Cabaret parts weren't played. As
 * in the student's class, only a School part is kept for the next casting's balance (`last`).
 */
export function formerProductions(sim: Simulation, person: Person, c: NonNullable<SchoolRecord['formerClasses']>[number], term: number, academic: number): void {
  if (academic < 0 || academic >= YALE_DRAMA.terms) return;
  if ((c.productions ?? []).some((p) => p.term === term)) return;
  const as = asClassOf(person, c.classOf);
  // A third-year fall's best go to the Rep's company and not a School production, as in the student's own class (`cast`,
  // from 2026-10-11: until then a first class's were cast in the School's productions that term like the rest).
  const company = repTerm(academic) && yearOfTerm(academic) === 3;
  const atRep = new Set(company ? c.classmates.flatMap((m, i) => (actingOf(m.craft) >= ESTIMATE.castAtRep ? [i] : [])) : []);
  const callsOf = new Map<number, Set<string>>();
  for (const i of atRep) callsOf.set(i, repDays(term));
  const students: Student[] = c.classmates.flatMap((m, i) => (atRep.has(i) ? [] : [{ i, name: m.name, craft: m.craft, title: m.title ?? 'actor', ...(m.last ? { last: m.last } : {}) }]));
  // A first fall has no casting, only its Cabaret show.
  const first = schoolProduction(term, 1, academic);
  const firstPlay = first && playOf(sim, as, first);
  const order = firstPlay ? [...students].sort((a, b) => castScore(b, playReads(firstPlay)) - castScore(a, playReads(firstPlay))) : [];
  const groups = new Map<string, { production: NonNullable<ReturnType<typeof schoolProduction>>; members: Student[] }>();
  order.forEach((s, k) => {
    const production = schoolProduction(term, k + 1, academic)!;
    const g = groups.get(production.name) ?? { production, members: [] };
    g.members.push(s);
    groups.set(production.name, g);
  });
  const record = (p: Omit<FormerProduction, 'term' | 'academic'>) => (c.productions ??= []).push({ term, academic, ...p });
  for (const { production, members } of groups.values()) {
    const play = playOf(sim, as, production);
    const reads = playReads(play);
    const given = partsFor(members, play.parts, reads);
    const shown = play.title ?? production.name;
    const rehearsals = rehearsalDays(term, production.runs[0]!, production.weeks).length;
    const nights = production.runs.length;
    const cast: FormerProduction['cast'] = [];
    for (const g of given) {
      callsOf.set(g.s.i, productionDays(term, production));
      const quality = formerRun(sim, person, c, g.s.i, reads, shown, rehearsals, nights, at(production.runs[nights - 1]!, 22), g.size);
      cast.push({ name: c.classmates[g.s.i]!.name, part: partLabel(g.part, production.kind), size: g.size, quality });
    }
    record({ name: production.name, ...(play.title ? { play: play.title } : {}), ...(play.by ? { by: play.by } : {}), from: keyOf(production.runs[0]!), to: keyOf(production.runs[nights - 1]!), cast });
  }
  // The Rep's company, played as the student's class's is (`COMPANY_KIND`): its rehearsal weeks' weekdays and its nights.
  if (atRep.size) {
    const rep = repProduction(term);
    const days = Math.max(0, Math.round((Date.parse(rep.run.from) - Date.parse(rep.rehearsals.from)) / MS_DAY));
    const nights = Math.round((Date.parse(rep.run.to) - Date.parse(rep.run.from)) / MS_DAY * 6 / 7) + 1;
    const cast: FormerProduction['cast'] = [];
    for (const i of atRep) {
      const quality = formerRun(sim, person, c, i, COMPANY_READ, rep.name, Math.round(days * 5 / 7), nights, at(parseKey(rep.run.to), 23));
      cast.push({ name: c.classmates[i]!.name, part: 'A Featured Part In The Company', size: 'featured', quality });
    }
    record({ name: rep.name, from: rep.run.from, to: rep.run.to, cast });
  }
  // And the class's Cabaret show (`cabaretCompany`), under the key the class had while the student was in it.
  const cab = cabaretCompany(sim, person, `class-${c.classOf}`, term, c.classmates.length, (i) => callsOf.get(i) ?? new Set());
  if (cab) {
    const show = cabaretSeason(term);
    const cast: FormerProduction['cast'] = [];
    for (const i of cab.members) {
      const quality = formerRun(sim, person, c, i, NEW_PLAYS_READ, show, CABARET_RUN.rehearsals, CABARET_RUN.performances, at(addDays(cab.week, 2), 23, 30));
      cast.push({ name: c.classmates[i]!.name, part: CABARET_RUN.part, size: 'featured', quality });
    }
    record({ name: show, from: keyOf(cab.week), to: keyOf(addDays(cab.week, 2)), cast });
  }
  // A long life's list stays bounded: at most a School production, the Rep and a Cabaret show a term, for five terms.
  if (c.productions!.length > 30) c.productions!.splice(0, c.productions!.length - 30);
}

/** A first-class classmate as the evaluation reads them, from their own record, under the keys they always had. */
function formerPerformer(sim: Simulation, person: Person, mate: Classmate, i: number): Performer {
  const held: Partial<Record<AbilityId, Skill>> = { emotionalDepth: 'emotion', memory: 'memorization', vocal: 'voice', physical: 'movement' };
  return {
    ability: (id) => {
      const skill = held[id];
      if (skill) return mate.craft[skill];
      if (id === 'presence') return presenceFor(sim, person, mate, `mate-${i}`);
      if (id === 'discipline' || id === 'stamina') return 100;
      return (mate.abilities ?? (mate.abilities = drawMateAbilities(sim.universe.meta.seed, person.id, i, mate.craft)))[id as keyof MateAbilities];
    },
    full: () => 100,
    technique: (skill) => mate.craft[skill],
  };
}

/**
 * A class's terms of classes played forward, for a class the player wasn't in while it went on (from 2026-10-10): each
 * class day of each academic term, its courses grow each classmate's skills and the abilities they reach, by the same
 * rule a class day does (`CLASSES_KIND`), on the days a classmate's ordinary attendance has them there. Their
 * productions' rehearsals and nights aren't played forward: SLATE keeps those for the class the player is in.
 * From 2026-10-11 the days are the calendar term's (`offset`, the class's calendar term less its academic one): until
 * then they were the academic term's own, the class of 2029's, so a class a year behind was played the year before's
 * days, recesses and all. And a term the class had partly with the student plays on `from` the day it was left at.
 */
export function advanceMates(mates: Classmate[], academicTerms: readonly number[], offset = 0, from?: string): void {
  for (const a of academicTerms) {
    if (a < 0 || a >= YALE_DRAMA.terms) continue;
    const period = classPeriod(a + offset);
    const season = termStart(a).fall ? 'fall' : 'spring';
    let n = 0;
    for (let d = period.from; keyOf(d) <= keyOf(period.to); d = addDays(d, 1)) {
      if (!isClassDay(a + offset, d)) continue;
      n += 1;
      if (from && keyOf(d) < from) continue;
      const courses = timetable(yearOfTerm(a), season)[weekday(d) - 1] ?? [];
      mates.forEach((mate, i) => {
        // Ordinary attendance, by a fixed pattern: about one class day in thirty-three missed (`classmateAttendance`).
        if ((n + i * 7) % Math.round(1 / (1 - ESTIMATE.classmateAttendance)) === 0) return;
        const focus = ESTIMATE.classmateFocus * (mate.drive ?? 1);
        for (const course of courses) {
          for (const skill of course.skills) grow(mate.craft, skill, focus);
          if (!mate.abilities) continue;
          for (const ability of classAbilities(course.skills)) {
            const id = ability as keyof MateAbilities;
            if (mate.abilities[id] === undefined) continue;
            const kin = ABILITY_KIN[ability] ?? [];
            const reach = kin.length ? kin.reduce((s, k) => s + ceilingOf(mate.craft, k), 0) / kin.length : 100;
            mate.abilities[id] = Math.min(100, mate.abilities[id] + abilityGain(mate.abilities[id], reach, { weight: CLASS_ABILITY_SHARE, focus, deliberate: false }));
          }
        }
      });
    }
  }
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

/** The protective equipment's price in the save's money. */
export const ppeCost = (sim: Simulation): Money => inSaveMoney(sim, REQUIRED_PPE.cost, 'USD');

/** Why the protective equipment can't be bought now, or nothing. */
export function ppeRefusal(person: Person): string | undefined {
  const school = person.school;
  if (!school || schoolEnded(school.standing)) return 'Only students on work-study need it.';
  if (school.ppe) return `You already bought it on ${formatDate(school.ppe.at, zone())}.`;
  return undefined;
}

/** Bought, through the bank, as a school cost; false where the bank can't cover it. */
export function buyPpe(sim: Simulation, person: Person): boolean {
  const cost = ppeCost(sim);
  if (!spend(sim, person, cost, 'Required protective equipment for work-study', 'school')) return false;
  person.school!.ppe = { at: sim.now, cost };
  return true;
}

/** The work-study rate in a currency. */
export const hourlyIn = (into: string): Money => (into === 'USD' ? WORK_STUDY.hourly : exchange(WORK_STUDY.hourly, 'USD', into) ?? WORK_STUDY.hourly);

/** Whether the need assessment finds need: the family's means are read, by the rule creation reads too (`needFor`). */
export const hasNeed = (person: Person) => needFor(person.family);

/**
 * A term's support, by how many terms are enrolled with it: past the six the tuition scholarship supports it has none
 * (`unsupported`) unless the aid office's review granted an exception (`AidReview.tuition`); living aid (`need`) goes by
 * need, past six only where the review kept it (`AidReview.living`). The term's start bills by it and Terms And Award
 * shows by it (from 2026-10-12: until then the screen counted terms alone, and showed a term the review waived as billed
 * to the Yale account with its health fee, and no living aid).
 */
export function termSupport(person: Person, enrolledCount: number): { unsupported: boolean; need: boolean } {
  const review = person.school?.aidReview?.status === 'decided' ? person.school.aidReview : undefined;
  const unsupported = enrolledCount > YALE_DRAMA.terms && !review?.tuition;
  return { unsupported, need: hasNeed(person) && (!unsupported || review?.living === true) };
}

// ---------------------------------------------------------------------------
// The record
// ---------------------------------------------------------------------------

/**
 * Which year of the degree a student is in: the first until the second fall term begins. It's the year of the
 * program's terms begun as the school look's Terms Begun counts them (`programTermsBegun`, `ui/looks/school.tsx`), from
 * 2026-10-12: the calendar's less those a leave or a repeated year took (from 2026-10-10), and on a leave, or with the
 * School left during one, the program's terms before the term the leave began in, which is taken again on return. A
 * leave's length, which `startLeave` put on the offset, is its first term to its return term: every leave sets them
 * `terms` apart, and one from before `terms` was kept, `LEAVE_RULES.terms` apart. Until then it read the calendar's
 * terms less the offset on a leave too, while `startLeave` adds the whole leave to the offset as it begins and
 * `termsBegun` follows the calendar only to that term: a two-term leave from the second spring or the third read a year
 * low for the whole of it (measured: on leave from the second spring, Terms Begun 3 of 6 and "your first year of
 * three" on the same look, and Year 1 on the Profile and the save's slot), and one from the first spring or a fall
 * read the same year either way.
 */
export function yearOfStudy(person: Person): number {
  const school = person.school;
  if (!school) return 1;
  const away = school.leave?.status === 'on' ? school.leave : school.leaves?.find((l) => l.status === 'dismissed' || l.status === 'withdrawn');
  const offset = school.offset ?? 0;
  const begun = away ? away.firstTerm - (offset - (away.returnTerm - away.firstTerm)) : school.termsBegun - offset;
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
export function dayKeyAt(when: Instant): string {
  const p = zonedParts(when, zone());
  return keyOf({ year: p.year, month: p.month, day: p.day });
}

/**
 * In hospital, or laid up by an injury (`systems/injury.ts`): an absence the
 * School excuses, as it does a sick day called in. Until 2026-09-28 only a
 * hospital stay was excused, and an actor laid up who missed a performance
 * was warned and then dismissed for it.
 */
export function offSick(person: Person, when: Instant): boolean {
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

export function schedule(
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
  if (!school || schoolEnded(school.standing)) return 'The Cabaret is for students.';
  if (school.standing === 'warning') return 'You can’t take part in the Cabaret while you’re on academic warning.';
  // On a leave, as `leaveCabaret`'s notice says and `startLeave` calls off a show begun (from 2026-10-12: until then a
  // student on one, still in good standing, could join a show after the leave had begun).
  if (school.leave?.status === 'on') return 'You’re on leave, and a student on leave can’t take part in the Yale Cabaret.';
  const term = school.termsBegun - 1;
  if (term < 0) return 'The Cabaret’s season starts with the term. Ask again once it’s begun.';
  if (school.cabaret?.term === term) return 'You’re already in a Cabaret show this term.';
  // Until 2026-09-27 it was offered in the summer and the term's last weeks, where no week can be, and refused on the click.
  const week = cabaretWeek(sim, person, term);
  if (!week) return 'There’s no Cabaret week left this term that’s at least three weeks away and clear of your recesses and calls.';
  // Double-cast, a School production and the Rep both calling in the weeks the show would rehearse and play, there's no
  // Cabaret: the Bulletin's "double-cast actors ... cannot do Yale Cabaret productions" (research-yale-school-2.json).
  // Two castings in one term at different times aren't double-casting: the Rep's winter and the Carlotta's spring.
  const from = at(addDays(week, -21), 0), to = at(addDays(week, 3), 23);
  const calling = (rep: boolean) => sim.universe.scheduled.some((i) => i.kind === CALL_KIND && i.status === 'pending' && i.payload.personId === person.id && (i.payload.which === 'rep') === rep && i.at >= from && i.at <= to);
  if (calling(false) && calling(true)) return 'You’re cast in two productions at once, and the Bulletin doesn’t allow a double-cast actor to take a Cabaret show.';
  return undefined;
}

export function summerRefusal(sim: Simulation, person: Person): string | undefined {
  const school = person.school;
  if (!school || school.standing !== 'good') return 'The Summer Cabaret only takes students in good standing.';
  // On a leave, whose start calls off a company's calls and stipends (`startLeave`), from 2026-10-12: until then a
  // student on one could join the company after the leave had begun.
  if (school.leave?.status === 'on') return 'You’re on leave, and a student on leave can’t take part in the Summer Cabaret.';
  const term = school.termsBegun - 1;
  // A spring term with a year still to come: the summer after the first or second year.
  if (term < 0 || termStart(term).fall || yearOfTerm(academicTerm(school, term)) === 3) return 'The company forms in the spring, from students with at least a year still to go.';
  const year = termStart(term).date.year;
  if (school.summer?.year === year) return 'You’re already in this summer’s company.';
  if (sim.now > at({ year, month: SUMMER_CABARET.applyBy[0], day: SUMMER_CABARET.applyBy[1] }, 23)) return 'This summer’s company has already formed.';
  return undefined;
}

export function shiftRefusal(person: Person): string | undefined {
  const school = person.school;
  if (!school || schoolEnded(school.standing)) return 'You’re not at school.';
  // On a leave nothing is worked (`startLeave`), as the leave's panel says (from 2026-10-12: until then an elective
  // shift was booked, worked and paid on a leave, since a student on one is still registered).
  if (school.leave?.status === 'on') return 'You’re on leave, so there are no shifts until you’re back.';
  // The Bulletin's 50 elective hours are part of a minimum of 200, not a cap (from 2026-10-10: until then a shift past 50
  // was refused). The award's ceiling isn't published, so SLATE sets none: the calendar's own hours are the limit.
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
/**
 * The hours a call holds: its own, and for a night on call, from the call at five to the curtain's end, SLATE's
 * estimate of three hours from eight (from 2026-10-10: until then a night on call held nothing, and a Cabaret week and an
 * elective shift were both set on Seagull nights the understudy was on call for).
 */
const ON_CALL_HOLDS_MINUTES = 180;
/**
 * From 2026-10-16 (brief 10) a night on call holds to the curtain's fall of the play's own running time and the curtain
 * call (`holds`, `holdOf`); one booked before keeps the three hours it was booked for, `ON_CALL_HOLDS_MINUTES`, until its
 * save's first opening times it (`timeTheCalls`).
 */
/**
 * A save from before 2026-10-16's brief 10 has its performance calls still to come booked for the hours they held then
 * (150 minutes at the School and the Summer Cabaret, 180 at the Rep, 90 at the Cabaret, three hours on call): each is
 * given its play's running time and the curtain call (`holdOf`) on the save's first opening (`ONCE_ON_OPENING`), where
 * nothing else the player must attend begins inside the span it would hold; where something does, it keeps what it was
 * booked for, so no two things are held at once. A night on call is given its hold to keep (`holds`). Returns how many
 * calls were timed.
 */
export function timeTheCalls(sim: Simulation): number {
  let timed = 0;
  const pending = sim.universe.scheduled.filter((i) => i.status === 'pending');
  for (const item of pending) {
    const person = sim.universe.people[String(item.payload.personId)];
    const school = person?.school;
    if (!person || !school) continue;
    const call = item.payload.call;
    const holder: NightHolder | undefined = item.kind === CALL_KIND ? ((item.payload.which === 'rep' ? school.rep : school.casting) as NightHolder | undefined)
      : item.kind === CABARET_KIND ? (school.cabaret as NightHolder | undefined)
        : item.kind === SUMMER_KIND ? (school.summer?.shows?.[Number(item.payload.run)] as NightHolder | undefined) : undefined;
    if (!holder) continue;
    if (item.kind === CALL_KIND && call === 'oncall' && item.payload.check === true && item.payload.holds === undefined) { item.payload.holds = holdOf(holder); timed += 1; continue; }
    if (call !== 'performance' && call !== 'runthrough') continue;
    const minutes = holdOf(holder);
    if (minutes === item.durationMinutes) continue;
    const end = item.at + minutes * 60_000;
    const clash = pending.some((o) => o !== item && o.requiresPlayer === true && (o.payload.personId === undefined || o.payload.personId === person.id) && o.at > item.at && o.at < end);
    if (clash) continue;
    item.durationMinutes = minutes;
    timed += 1;
  }
  return timed;
}

function heldSpan(i: { at: Instant; durationMinutes?: number; payload: Record<string, unknown> }): readonly [Instant, Instant] {
  if (i.payload.call === 'oncall' && i.payload.perfAt !== undefined) return [i.at, Number(i.payload.perfAt) + (Number(i.payload.holds) || ON_CALL_HOLDS_MINUTES) * 60_000] as const;
  return [i.at, i.at + (i.durationMinutes ?? 0) * 60_000] as const;
}

export function cabaretWeek(sim: Simulation, person: Person, term: number): SchoolDate | undefined {
  const period = classPeriod(term);
  const calls = sim.universe.scheduled
    // A work-study shift booked too: until 2026-09-27 an elective evening already taken wasn't read, and the show was set on it.
    .filter((i) => i.status === 'pending' && (i.kind === CALL_KIND || i.kind === LAB_KIND || i.kind === SHIFT_KIND) && i.payload.personId === person.id)
    .map(heldSpan);
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
  if (!school || schoolEnded(school.standing)) return undefined;
  const term = school.termsBegun - 1;
  if (term < 0 || termStart(term).fall || yearOfTerm(academicTerm(school, term)) === 3) return undefined;
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
    classOf: TERM_STARTS_2026_27.fall.year + 3, termsBegun: 0, standing: 'good', castable: true, creditsDated: true,
    classmates: admitted.classmates, tally: undefined as unknown as TermTally, history: [],
    workStudy: { electiveHours: 0, owedHours: 0 },
  };
  person.school = school;
  // Each classmate's abilities, drawn as the class is admitted (from 2026-10-10, `mateAbilities`).
  school.classmates.forEach((_, i) => mateAbilities(sim, person, i));
  // Illness comes at school too, with Yale Health to meet it; until 2026-09-27 it waited for the degree.
  armHealth(sim, person);
  // A scholarship for living costs is income the US taxes, and the returns begin with school.
  armTaxes(sim, person);
  school.tally = freshTally(person, school);
  sim.schedule({ at: Math.max(at(termStart(0).date, 9), sim.now + 60_000), kind: TERM_KIND, label: termBegins(0), category: 'school', priority: 30, payload: { personId: person.id, term: 0 } });
  planWeek(sim, person, sim.now);
  // The first week's sessions, each changing what's known or arranged (`systems/coursework.ts`, from 2026-10-07).
  scheduleOrientation(sim, person);
  if (person.id !== sim.universe.playerId) return;
  const day = (d: SchoolDate) => formatDate(at(d, 12), zone());
  sim.notify({
    category: 'school',
    title: 'Welcome To The Class Of ' + school.classOf,
    body: `You’re one of the ${YALE_DRAMA.classSize} actors in the ${YALE_DRAMA.degree} in ${YALE_DRAMA.program} at the ${YALE_DRAMA.name}, chosen from this year’s auditions with the ${YALE_DRAMA.classSize - 1} others you’ll be cast beside and against. Tuition is covered, as it is for every student. The fall term begins with registration, then orientation until ${day(ORIENTATION_2026.ends)}, and classes start on ${day(ORIENTATION_2026.classesBegin)}, at 9 a.m.`,
    importance: 80, route: '/workspace/school',
  });
}

/**
 * The week put on the calendar, from a moment to the Sunday after: its class
 * days and its work-study Saturday. A payday goes on once there are hours
 * to pay (`bookPayday`); every Friday had one until 2026-09-26, summer's too. Each Sunday evening it runs
 * again for the week after.
 */
export function planWeek(sim: Simulation, person: Person, from: Instant): void {
  const school = person.school;
  if (!school || schoolEnded(school.standing)) return;
  const p = zonedParts(from, zone());
  const first: SchoolDate = { year: p.year, month: p.month, day: p.day };
  const sunday = dayOnOrAfter(first.year, first.month, first.day, 0);
  for (let day = first; keyOf(day) <= keyOf(sunday); day = addDays(day, 1)) {
    const term = termOf(day);
    if (coursesFor(school, day).length) schedule(sim, person, at(day, 9), { kind: CLASSES_KIND, label: 'Classes', minutes: 360, payload: { day: keyOf(day) } });
    // The year's assigned hours, and no more: until 2026-09-27 every class-week
    // Saturday was booked, 156 hours in a second year against the Bulletin's 150.
    // Within Yale's weekly cap across its jobs (from 2026-10-10).
    if (isShiftDay(term, day) && (school.workStudy.assignedBooked ?? 0) + 6 <= WORK_STUDY.assignedHours && at(day, 10) > sim.now && weekHours(sim, person, at(day, 10)) + 6 <= weekCap(at(day, 10))) {
      school.workStudy.assignedBooked = (school.workStudy.assignedBooked ?? 0) + 6;
      schedule(sim, person, at(day, 10), { kind: SHIFT_KIND, label: 'Work-Study Shift', minutes: 360, payload: { hours: 6, elective: false } });
    }
  }
  sim.schedule({ at: at(sunday, 18), kind: WEEK_KIND, label: 'The School Week Ahead', category: 'system', priority: 5, payload: { personId: person.id } });
}

/**
 * Work-study hours in the week a moment falls in, Monday to Sunday in New Haven (SLATE's week; Yale's isn't found): every
 * shift booked or worked, not one canceled or missed, so a shift called off or missed sick frees its hours and none is
 * counted twice (from 2026-10-10). `except` leaves one shift out; `before`, only shifts before a moment and worked, as
 * a shift reads the cap when it comes, so a later booking never takes an earlier shift's hours.
 */
export function weekHours(sim: Simulation, person: Person, when: Instant, except?: string, before?: Instant): number {
  const p = zonedParts(when, zone());
  const day = { year: p.year, month: p.month, day: p.day };
  const monday = addDays(day, -((weekday(day) + 6) % 7));
  const from = at(monday, 0), to = at(addDays(monday, 7), 0);
  return sim.universe.scheduled
    .filter((i) => i.kind === SHIFT_KIND && i.payload.personId === person.id && i.id !== except && i.at >= from && i.at < to && i.status !== 'cancelled' && i.status !== 'missed' && (before === undefined || (i.at < before && i.status !== 'pending')))
    .reduce((n, i) => n + Number(i.payload.hours ?? 0), 0);
}

/**
 * The School’s work done between two moments, by when it was done, paid yet or not (from 2026-10-13), for a week an
 * unemployment claim certifies (`systems/unemployment.ts`): each work-study shift worked in it, its hours worked (the
 * shift’s `worked`; one worked before that day kept none, and is read as its hours booked) at the hourly rate; and the
 * Summer Cabaret’s stipend, paid each Friday for the seven days before it, by the share of those days in the window, a
 * company week taken as forty hours (SLATE’s estimate, as `workedBetween` takes it). A claim week counts what was earned
 * in it: Connecticut’s weekly claim asks “If you worked last week, Sunday through Saturday you must report any earnings
 * even if you do not get paid until later” (portal.ct.gov/dol, “What questions are asked when I file a weekly claim?”,
 * read 2026-10-13), and California’s EDD asks the same of the week the work was done.
 */
export function workDoneIn(sim: Simulation, person: Person, from: Instant, to: Instant): { pay: Money; hours: number } {
  const hourly = hourlyIn(saveCurrency(sim.universe));
  let pay = 0;
  let hours = 0;
  for (const i of sim.universe.scheduled) {
    if (i.kind !== SHIFT_KIND || i.status !== 'done' || i.payload.personId !== person.id || i.at < from || i.at >= to) continue;
    const worked = Number(i.payload.worked ?? i.payload.hours ?? 0);
    hours += worked;
    pay += worked * hourly;
  }
  const week = 7 * MS_DAY;
  for (const t of sim.universe.transactions) {
    if (t.memo !== STIPEND_MEMO || t.at <= from || t.at - week >= to) continue;
    if (!t.postings.some((p) => sim.universe.accounts[p.accountId]?.ownerId === person.id)) continue;
    const gross = t.postings.filter((p) => sim.universe.accounts[p.accountId]?.kind === 'income').reduce((s, p) => s - p.amount, 0);
    const share = (Math.min(to, t.at) - Math.max(from, t.at - week)) / week;
    pay += gross * share;
    hours += 40 * share;
  }
  return { pay: Math.round(pay), hours };
}

/** Yale's cap on a week's hours, across all its jobs: 19 in an academic term's classes, 40 in recess and summer. */
export function weekCap(when: Instant): number {
  const p = zonedParts(when, zone());
  const day = { year: p.year, month: p.month, day: p.day };
  const period = classPeriod(termOf(day));
  return keyOf(day) >= keyOf(period.from) && keyOf(day) <= keyOf(period.to) ? WORK_LIMITS.weekHours : WORK_LIMITS.recessWeekHours;
}

/** The academic year a calendar term is in, by its fall term, for the year's work-study hours. */
export const yearKeyOf = (term: number): string => String(term - (termStart(term).fall ? 0 : 1));

/** Hours that can be converted to grant aid now: excused in the year, and, once its spring is under way, those never assigned. */
export function convertibleHours(person: Person, yearKey: string, unassigned = false): number {
  const school = person.school;
  if (!school) return 0;
  const excused = school.excusedHours?.[yearKey] ?? 0;
  const onLeave = (school.leaves ?? []).some((l) => l.startedAt !== undefined && l.firstTerm >= Number(yearKey) && l.firstTerm <= Number(yearKey) + 1);
  const left = unassigned && !onLeave ? Math.max(0, WORK_STUDY.assignedHours - (school.workStudy.assignedBooked ?? 0)) : 0;
  const done = school.convertedHours?.[yearKey] ?? 0;
  return Math.max(0, Math.min(WORK_LIMITS.convertibleHours, excused + left) - done);
}

/** Why a conversion can't be asked for now, or nothing. */
export function conversionRefusal(sim: Simulation, person: Person): string | undefined {
  const school = person.school;
  if (!school || schoolEnded(school.standing)) return 'You’re not at school.';
  if (!hasNeed(person)) return 'Converting hours to grant aid is only for students on financial aid, and the aid office found no need for you.';
  if (school.leave?.status === 'on') return 'You can’t while you’re on leave: a student on leave has no aid.';
  if (sim.universe.scheduled.some((i) => i.kind === CONVERT_KIND && i.status === 'pending' && i.payload.personId === person.id)) return 'Your request is already in for the next processing.';
  const term = Math.max(0, school.termsBegun - 1);
  if (convertibleHours(person, yearKeyOf(term), unassignedKnown(sim.now)) <= 0) {
    if (!countsUnassigned(nextConversion(sim.now))) return 'There are no hours to convert at January’s processing. Only assigned hours you missed while ill or hurt count then.';
    return unassignedKnown(sim.now) ? 'There are no hours to convert. Only assigned hours you missed while ill or hurt, or hours never assigned, can be converted.' : 'There are no hours to convert yet. Hours you missed while ill or hurt count now; hours never assigned count from May, once the spring’s shifts are done.';
  }
  return undefined;
}

/** The processing a request made at a moment is booked for: the next 15th of January or May, at noon. */
export function nextConversion(now: Instant): Instant {
  const p = zonedParts(now, zone());
  const month = WORK_LIMITS.convertMonths.find((m) => m > p.month || (m === p.month && p.day < 15));
  return at({ year: month ? p.year : p.year + 1, month: month ?? WORK_LIMITS.convertMonths[0], day: 15 }, 12);
}

/**
 * Whether a processing counts hours never assigned: May's, when the spring's shifts are done. A request reads the rule of
 * the processing it books (from 2026-10-13): until then a request in the spring counted the spring's Saturdays not yet
 * booked as never assigned, was accepted, and was booked for January's processing, or the next January's, which counts
 * only hours missed ill or hurt, and paid nothing, with nothing said (found by the review of that day).
 */
export const countsUnassigned = (processing: Instant): boolean => zonedParts(processing, zone()).month === 5;

/** Whether the hours never assigned are known at a moment: in May, before its processing, the spring's shifts done. */
export const unassignedKnown = (now: Instant): boolean => zonedParts(now, zone()).month === 5 && countsUnassigned(nextConversion(now));

/** The Friday after hours were worked, at five, unless one's already booked. */
function bookPayday(sim: Simulation, person: Person, worked: Instant): void {
  if (sim.universe.scheduled.some((item) => item.kind === PAYDAY_KIND && item.status === 'pending' && item.payload.personId === person.id)) return;
  const p = zonedParts(worked, zone());
  const next = addDays({ year: p.year, month: p.month, day: p.day }, 1);
  schedule(sim, person, at(dayOnOrAfter(next.year, next.month, next.day, 5), 17), { kind: PAYDAY_KIND, label: 'Work-Study Payday', minutes: 0, requiresPlayer: false });
}

/**
 * The actor's standing moved: a notice, and on dismissal or the degree the school's hold on the calendar let go.
 * Until the scope reset of 2026-10-09 the degree or a dismissal began the career (`systems/career.ts`) and the class
 * was known for life after it (`systems/people.ts`); both went, and a life now ends its school at the results.
 */
export function setStanding(sim: Simulation, person: Person, to: Standing, reason: string): void {
  const school = person.school!;
  school.standing = to;
  if (schoolEnded(to)) school.endedAt = sim.now;
  if (to !== 'good' && to !== 'withdrawn') feel(person, to === 'withheld' ? 'dismissed' : to);
  // "No student on academic warning ... may participate" in the Cabaret (Bulletin 2026–27 p.148): a warning, or the end
  // of school, during a show takes them out of what's still to come (from 2026-10-10: until then it was checked only at
  // joining).
  if (to === 'warning' || schoolEnded(to)) leaveCabaret(sim, person, to === 'warning' ? 'academic warning' : 'leaving the School');
  if (schoolEnded(to)) {
    // A leave open or under way ends with the School (`closeLeave`, from 2026-10-10).
    closeLeave(school, to === 'withdrawn' ? 'withdrawn' : 'dismissed');
    // The coursework ends with it (`endCoursework`, from 2026-10-10).
    endCoursework(sim, person);
    // The degree added to reputation and a dismissal took from it until 2026-10-09, when what read it went with the career.
    keepCredit(sim, school);
    // The class they were in goes on without them (`leaveClassBehind`, from 2026-10-11), after a dismissal or a
    // withdrawal; its runs under way and every class's next term are its, not the student's, and stay on the calendar.
    if (to === 'dismissed' || to === 'withdrawn') leaveClassBehind(sim, person);
    // The Summer Cabaret’s week under way is paid on its Friday for the days of it worked, as a company that lets them go
    // pays it: Connecticut has wages paid in full by the next regular payday to one who leaves (CGS 31-71c(a) and (b),
    // https://www.cga.ct.gov/current/pub/chap_558.htm, read 2026-10-13). From 2026-10-13: until then it was called off
    // with the rest, and the days worked since the last Friday went unpaid while the notice said work done is still paid
    // (found by that day’s third round of defects).
    const stipend = sim.universe.scheduled.filter((one) => one.status === 'pending' && one.kind === STIPEND_KIND && one.payload.personId === person.id).sort((a, b) => a.at - b.at)[0];
    const worked = stipend ? 1 - (stipend.at - sim.now) / (7 * MS_DAY) : 0;
    const begun = sim.universe.scheduled.some((one) => one.kind === SUMMER_KIND && one.payload.personId === person.id && one.at <= sim.now && one.status !== 'pending' && one.status !== 'cancelled');
    const kept = stipend && begun && worked > 0 ? stipend : undefined;
    if (kept) kept.payload.share = Math.min(typeof kept.payload.share === 'number' ? kept.payload.share : 1, worked);
    for (const item of sim.universe.scheduled) {
      if (item === kept) continue;
      // A classmate’s moment keeps its own lapse, at its hour, as one does at the School (`MOMENT_KIND`, from 2026-10-13:
      // until then it was called off with the rest, and stayed open with its answers live for good; found by that day’s
      // evidence pass). Lapsed with the coursework instead (`endCoursework`), a disagreement answered before its hour
      // would be told the moment passed, where what’s so is that its work is finished.
      if (item.kind === FORMER_KIND || item.kind === MOMENT_KIND || (item.kind === COMPANY_KIND && item.payload.classOf !== undefined)) continue;
      if (item.status === 'pending' && item.kind.startsWith('school.') && item.payload.personId === person.id) callOff(sim, person, item);
    }
    // What was worked is still paid.
    if (school.workStudy.owedHours > 0) schedule(sim, person, sim.now + 60_000, { kind: PAYDAY_KIND, label: 'Work-Study Payday', minutes: 0, requiresPlayer: false });
    // A dismissal ends an F-1 student's program now, and the look at their status comes with it (`programEnd`).
    // Every way out ends an F-1 student's program, and the look at their status comes with it (`programEnd`): until
    // 2026-10-10 the degree didn't reschedule it.
    scheduleUsStatus(sim, person);
  }
  if (person.id !== sim.universe.playerId) return;
  // What still stands when nothing is left to ask, said with the end (from 2026-10-16, the owner's brief's “no dead-end
  // warning”): until then a dismissal and a withheld degree said the end and nothing of what it left. Each clause is what
  // the end does above: the course record isn't touched, the runs played go on the Profile (`keepCredit`), the hours
  // worked are paid (`PAYDAY_KIND`), and practice and the briefs read the craft, not the School (`practiceRefusal`,
  // `tapeRefusal`). A withdrawal's own words already said the hours (school.withdraw).
  const stands = 'What you did here stands: every course and its result stay on your record, the productions you played stay on your Profile, and hours you worked are still paid. Practice, and the practice briefs on your Profile, go on outside the School.';
  // The decision is SLATE's simulation of the faculty's, so the notice says what the program's chair and faculty do and
  // names nobody as having said it (from 2026-10-16, the owner's brief's “do not present … simulated staff feedback as
  // authentic”: until then each was put in the words of the chair of Acting by her name, which the Standing tab's Your
  // Faculty keeps as the Bulletin gives it).
  // What a short next term would do from here, as `evaluate` steps it (`shortTermWords`, from 2026-10-17): until then a
  // concern given before the last term said a short one would bring a warning, where the last term withholds the degree.
  const words: Record<Standing, [string, string]> = {
    good: ['In Good Standing', `The acting faculty find you in good standing. ${reason}`],
    concern: ['A Notice Of Academic Concern', `The chair of Acting has raised a concern about your work. ${reason} If your next term review finds you short again, the faculty would ${shortTermWords(school, school.termsBegun)}. A term that meets what’s asked puts you back in good standing.`],
    warning: ['Academic Warning', `You’re on academic warning, given at a formal meeting with the chair of Acting and an associate dean, as the Bulletin sets out. ${reason} If your next term review finds you short, you’ll be dismissed from the School. While you’re on warning, you can’t take part in the Yale Cabaret.`],
    dismissed: ['Dismissed From The School', `${reason} A dismissed student can’t return to the School. ${stands}`],
    graduated: ['Your MFA Is Conferred', reason],
    withdrawn: ['You Withdrew From The School', reason],
    withheld: ['The Degree Isn’t Recommended', `${reason} The faculty didn’t recommend the degree, and your terms at the School are over. ${stands}`],
  };
  // The last term has no next one to remedy anything in (from 2026-10-10: until then a last-term concern said "by the
  // end of next term").
  if (to === 'concern' && academicTerm(school, school.termsBegun) >= YALE_DRAMA.terms) words.concern = ['A Notice Of Academic Concern', `The chair of Acting has raised a concern about your work. ${reason} It was your last term, so the concern is noted and doesn’t stand in the way of your degree.`];
  const [title, body] = words[to];
  sim.notify({ category: 'school', title, body, importance: to === 'good' ? 45 : 85, route: '/workspace/school' });
}

/**
 * Out of a Cabaret show still to come: its calls ahead called off, with no missed call or breach for them; the
 * rehearsals and nights already played stay played. Said once.
 */
export function leaveCabaret(sim: Simulation, person: Person, why: string): void {
  const cab = person.school?.cabaret;
  if (!cab || cab.withdrawn) return;
  const ahead = sim.universe.scheduled.filter((i) => i.status === 'pending' && i.kind === CABARET_KIND && i.payload.personId === person.id);
  if (!ahead.length) return;
  for (const i of ahead) sim.timeline.cancel(i.id, sim.now);
  cab.withdrawn = { at: sim.now, why };
  if (person.id === sim.universe.playerId) sim.notify({ category: 'school', title: 'Out Of The Cabaret Show', body: `On ${why}, you can’t take part in the Yale Cabaret, so ${ahead.length === 1 ? 'the one call still to come is' : `the ${ahead.length} calls still to come are`} off and the show goes on without you. What you rehearsed and played stays on your record, and it isn’t held against you as a missed call.`, importance: 70, route: '/workspace/school' });
}

/**
 * A missed call that brings the term's missed calls to `ESTIMATE.missedCallsOut`: out of the casting pool until a good
 * evaluation, said once; whether it did. A missed rehearsal, a missed run-through and a lab missed unexcused reach it,
 * as the tutorial's "labs and rehearsals together" says (from 2026-10-12: until then a missed lab was counted and never
 * checked, so two labs missed left a student castable where one lab and one rehearsal took them out, and a missed
 * run-through took them out without a word). A missed performance is counted among them and is a breach of its own.
 */
function missedCallsOut(sim: Simulation, person: Person): boolean {
  const school = person.school!;
  if (!school.castable || school.tally.calls - school.tally.answered < ESTIMATE.missedCallsOut) return false;
  school.castable = false;
  if (person.id === sim.universe.playerId) sim.notify({ category: 'school', title: 'Out Of The Casting Pool', body: `You’ve missed ${ESTIMATE.missedCallsOut === 2 ? 'two' : ESTIMATE.missedCallsOut} calls this term, so the chair of Acting has taken you out of the casting pool. You still play what you’re cast in now, but you won’t be cast again until a term review finds you in good standing.`, importance: 80, route: '/workspace/school' });
  return true;
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
export function schoolProduction(term: number, rank: number, academic = term): { name: string; kind: Casting['kind']; runs: SchoolDate[]; weeks: number; n: number } | undefined {
  const season = SCHOOL_SEASON;
  const fallYear = termStart(term).fall ? termStart(term).date.year : termStart(term).date.year - 1;
  const day = ([m, d]: readonly [number, number]): SchoolDate => ({ year: m >= 8 ? fallYear : fallYear + 1, month: m, day: d });
  const span = (run: readonly (readonly [number, number])[]) => { const out: SchoolDate[] = []; for (let d = day(run[0]!); keyOf(d) <= keyOf(day(run[1]!)); d = addDays(d, 1)) out.push(d); return out; };
  const upper = rank <= Math.ceil(YALE_DRAMA.classSize / 2);
  const thesis = (n: number) => ({ name: `Directors’ Thesis Production ${['I', 'II', 'III'][n]}`, kind: 'thesis' as const, runs: span(season.theses[n]!), weeks: season.rehearsalWeeks.thesis, n });
  const hughes = { name: 'Langston Hughes Festival Of New Work', kind: 'hughes' as const, runs: span(season.hughes), weeks: season.rehearsalWeeks.hughes, n: 0 };
  const all = span(season.carlotta);
  const carlotta = { name: 'Carlotta Festival Of New Plays', kind: 'carlotta' as const, runs: [0, 2, 5, all.length - 1].map((n) => all[Math.min(n, all.length - 1)]!).slice(0, season.carlottaShows), weeks: season.rehearsalWeeks.carlotta, n: 0 };
  // The production by the year they're in, on this calendar's dates (`academic`, from 2026-10-10).
  switch (academic) {
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
export function labDays(term: number, academic = term): { name: string; days: SchoolDate[]; showing: boolean } | undefined {
  const period = classPeriod(term);
  const free = (d: SchoolDate) => !period.off.some(([a, b]) => keyOf(d) >= a && keyOf(d) <= b);
  // The lab of the year they're in, on this calendar's days (`academic`, from 2026-10-10).
  if (academic === LABS.drama50.term || academic === LABS.newPlayLab.term) {
    const lab = academic === LABS.drama50.term ? LABS.drama50 : LABS.newPlayLab;
    // Drama 50 from the second week of classes; the New Play Lab from the Tuesday after the spring recess.
    // The term's recess: its longest run of days off.
    const span = ([a, b]: readonly [string, string]) => Date.parse(b) - Date.parse(a);
    const recess = period.off.filter(([a, b]) => a >= keyOf(period.from) && b <= keyOf(period.to)).reduce((best, one) => (span(one) > span(best) ? one : best));
    const start = academic === LABS.drama50.term ? addDays(period.from, 7) : addDays(parseKey(recess![1]), 1);
    const days: SchoolDate[] = [];
    for (let d = start; keyOf(d) < keyOf(addDays(start, 7 * lab.weeks)); d = addDays(d, 1)) {
      const wd = weekday(d);
      const open = academic === LABS.drama50.term ? wd >= 1 && wd <= 5 : wd >= 2 && wd <= 5;
      if (open && free(d)) days.push(d);
    }
    return { name: lab.name, days, showing: false };
  }
  if (academic === LABS.creator.term) return { name: LABS.creator.name, days: [dayOnOrAfter(period.from.year, period.from.month, period.from.day, 5)], showing: true };
  return undefined;
}

function scheduleLabs(sim: Simulation, person: Person, term: number): void {
  const lab = labDays(term, academicTerm(person.school, term));
  if (!lab) return;
  for (const d of lab.days) schedule(sim, person, at(d, LABS.from), { kind: LAB_KIND, label: lab.showing ? `${lab.name}: Your Showing` : lab.name, minutes: LABS.minutes, payload: { showing: lab.showing } });
}

/** Whether a term brings a Yale Rep assignment: once a year, a first-year's spring and a second and third year's fall. */
export const repTerm = (term: number) => term === 1 || (termStart(term).fall && term >= 2);

/**
 * A casting done with goes on the résumé where it was played: an understudy only if they went on. Its year is its
 * term's (from the acceptance pass of 2026-10-11): until then it was the year the credit was written, at the next
 * casting, and a student away on a leave had their spring's Carlotta lead credited to the year they came back.
 */
/**
 * An older save's credits dated by their runs, once (from 2026-10-11): until the acceptance pass of 2026-10-11 a credit
 * took the year it was written down, at the next casting, so a fall's run was dated the January after and a run before
 * a leave a year later. Each term's casting notice (`Cast: …`, kept with the save's notifications) names its
 * productions and parts and dates its term: the credits, in the order they were written, are matched to them in turn,
 * each notice's production once, by its production and its part (a Rep company part by its production alone), and each
 * takes its term's year where it's no later than the year it had and within two. A credit with no notice kept for it
 * (a save keeps its last 500 notifications) keeps its year, and says so. The Cabaret's and the summer's were always
 * dated by their own runs. Returns how many were dated again and how many kept.
 */
export function redateCredits(school: SchoolRecord, notices: readonly { at: Instant; title: string; body: string }[]): { redated: number; kept: number } {
  let redated = 0;
  let kept = 0;
  if (school.creditsDated) return { redated, kept };
  const casts = notices.filter((n) => n.title.startsWith('Cast: ')).sort((a, b) => a.at - b.at).map((n) => {
    const p = zonedParts(n.at, zone());
    return { year: termStart(termOf({ year: p.year, month: p.month, day: p.day })).date.year, text: `${n.title} ${n.body}` };
  });
  const used = new Set<string>();
  let from = 0;
  for (const c of school.credits ?? []) {
    if (c.kind === 'cabaret' || c.kind === 'summer') continue;
    // Its production named, and its part where the notice names it (a company part in the Rep it doesn't).
    const k = casts.findIndex((x, i) => i >= from && !used.has(`${i}|${c.production}`) && x.text.includes(c.production) && (c.kind === 'role' || x.text.includes(c.role)));
    const year = k < 0 ? undefined : casts[k]!.year;
    if (year === undefined || year > c.year || c.year - year > 2) { c.yearAsKept = true; kept += 1; continue; }
    used.add(`${k}|${c.production}`);
    from = k;
    if (year !== c.year) { c.year = year; redated += 1; }
  }
  school.creditsDated = true;
  return { redated, kept };
}

export function keepCredit(_sim: Simulation, school: SchoolRecord): void {
  for (const c of [school.casting, school.rep]) {
    if (!c || c.performed === 0) continue;
    (school.credits ??= []).push({ production: c.production, role: c.role, kind: c.kind, year: termStart(c.term).date.year, wentOn: c.performed, ...(c.size ? { size: c.size } : {}) });
  }
}

/**
 * The chair's casting for a term, from the second (`SCHOOL_SEASON`): a
 * School production for every student in the pool, its rehearsal calls
 * Tuesday to Friday from three for its weeks before opening, inside the
 * term, and its performances at eight (SLATE's casting of every student each term is its own: the Bulletin says the
 * chair determines assignments). Beside it, once a year (a first
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
export function playOf(sim: Simulation, person: Person, production: { kind: Casting['kind']; n: number; runs: SchoolDate[] }): { title?: string; by?: string; parts: Part[]; reads: Partial<Craft>; kinds?: readonly string[] } {
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
    return { title: play.title, by: play.by, parts: [...play.parts], reads: play.reads, ...(play.kinds ? { kinds: play.kinds } : {}) };
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
  // With what its kinds of play asked (`withDemands`) from 2026-10-10 until the material profiles later that day: a
  // farce's physical comedy was read into The Importance of Being Earnest, whose comedy is verbal. A play with a
  // profile reads its own techniques and what its material asks (`playReads`), and every play named here has one. This
  // said its kinds were read where it had none until 2026-10-13, when that read, which added nothing, went.
  if (play) return playReads(play);
  // The Rep's company without a named play asks a professional stage's; the rest are new work.
  return c.kind === 'role' || c.kind === 'understudy' ? COMPANY_READ : NEW_PLAYS_READ;
}

/**
 * What a play asks of the craft: its own reads and its material’s techniques, or, with no profile, its reads alone. Every
 * named play has a profile (tests/evidence-g23-school.test.ts); the one with none is a new piece (`playOf`), which names no
 * title and no kinds. Until 2026-10-13 that took its kinds’ demands too (`withDemands`), and with no kinds there were
 * none to take: it added nothing (found by that day’s second round).
 */
export function playReads(play: { title?: string; reads: Partial<Craft>; kinds?: readonly string[] }): Partial<Craft> {
  const m = materialOf(play.title);
  if (!m) return { ...play.reads };
  const out = { ...play.reads } as Partial<Craft>;
  for (const [k, w] of Object.entries(m.techniques ?? {}) as [Skill, number][]) if (out[k] === undefined) out[k] = w;
  return out;
}

/**
 * A performance's growth: the scene, the feeling and the voice, and as much
 * again in what the play asks (`castingReads`), so a Shakespeare builds the
 * classics and a Wilde comedy and speech. Until 2026-09-28 every play grew
 * the same three.
 */
export function playNight(craft: Craft, reads: Partial<Craft>, focus: number, scale = 1): void {
  for (const [k, w] of nightWeights(reads, scale)) grow(craft, k, focus, w);
}

/** What a night grows and by how much (`playNight` for a classmate, `grewFrom` for the player), in order. */
export function nightWeights(reads: Partial<Craft>, scale = 1): (readonly [Skill, number])[] {
  const r = Object.entries(reads) as [Skill, number][];
  const total = r.reduce((sum, [, w]) => sum + w, 0);
  return [['scene', 2 * scale], ['emotion', scale], ['voice', scale], ...r.map(([k, w]) => [k, (4 * scale * w) / total] as const)];
}

/** A rehearsal's growth: the scene, the character, the script and the lines. */
export const REHEARSAL_WEIGHTS: readonly (readonly [Skill, number])[] = [['scene', 1.5], ['character', 1.5], ['script', 1], ['memorization', 1]];
export function rehearse(craft: Craft, focus: number): void {
  for (const [k, w] of REHEARSAL_WEIGHTS) grow(craft, k, focus, w);
}

/**
 * A part in the company’s own shows, the Cabaret’s and the Summer Cabaret’s, which the company casts among itself
 * (SLATE’s estimate of how a company that isn’t the chair’s casts): the leads written for their title to the four the
 * play reads best, and to the rest the supporting parts. Where the play writes none of that size for them, the next
 * smaller part it writes for them, and for one outside the four never a lead: where the play writes them nothing below
 * a lead, the company’s unnamed part (`In The Company`, featured), as the chair’s casting gives a student the company
 * when no part written for them is left (`partsFor`). The owner settled it so on 2026-10-14. Until then a part the play
 * wrote for them of any size was given, so a play whose only part for a woman is a lead (A Marriage Proposal, The Bear,
 * Trifles’ two) gave it to an actress outside the four, a lead she hadn’t earned. A new piece names no parts, and its
 * part is the size alone.
 * From 2026-10-12 each is read as the chair reads a student for a play (`castFit`): the evaluation’s expected night
 * from the abilities a night asks and the techniques and material the play reads. Until then it was the raw craft
 * against the play’s reads alone, a second casting model blind to the abilities and the material (the completeness
 * critic of 2026-10-12). Until 2026-10-13 a second comment above this one said a student outside the four was given a
 * supporting part, which a play with no supporting part for their title never did.
 */
export function companyPart(sim: Simulation, person: Person, reads: Partial<Craft>, parts?: readonly Part[], play?: string): { role: string; size: PartSize } {
  const school = person.school!;
  const mine = castFit(sim, performerOf(sim, person), reads, [], `company:${person.id}`, play);
  const place = 1 + school.classmates.filter((_m, i) => castFit(sim, classmatePerformer(sim, person, i), reads, [], `company:${i}`, play) > mine).length;
  const size: PartSize = place <= 4 ? 'lead' : 'supporting';
  const title = person.performerTitle === 'actress' ? 'actress' : 'actor';
  const fits = (p: Part) => p.for === 'either' || p.for === title;
  if (!parts) return { role: `${SIZE_WORD[size]} In A New Piece`, size };
  const sizes: PartSize[] = size === 'lead' ? ['lead', 'supporting', 'featured'] : ['supporting', 'featured'];
  const part = sizes.map((z) => parts.find((p) => p.size === z && fits(p))).find((p) => p !== undefined);
  return part ? { role: part.name, size: part.size } : { role: 'In The Company', size: 'featured' };
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
 * How hard a part is, by its size and the stage it's on (`content/tasks.ts`, `difficulty`): a lead asks more than a
 * featured part, and the Rep's professional company more than the School's. SLATE's estimate. It was 0, 0.1 and 0.2
 * at the School and 0.25 to 0.45 at the Rep for an hour of 2026-10-09, set on the old pars, until a played autopilot
 * life's nights came out at 48 on average, under LAMDA's pass, and three terms of off nights dismissed a student who
 * had graduated before: a rested, prepared student of ordinary ability should pass. Measured since, at an even 55,
 * rested and prepared: a School part at 51 to 54, a Rep lead at 45; at 60, 56 to 59 and 51.
 */
export const NIGHT_DIFFICULTY: Readonly<Record<'school' | 'rep', Record<PartSize, number>>> = {
  school: { featured: 0, supporting: 0.05, lead: 0.1 },
  rep: { featured: 0.15, supporting: 0.2, lead: 0.3 },
};

/**
 * What a night reads of a run: its play (the techniques, the genres) and its process (the preparation). From 2026-10-16
 * (brief 10) its production's name and whether it's a solo piece too, for the running time (`runningOf`).
 */
export type NightHolder = { play?: string; kind?: Casting['kind']; process?: unknown; production?: string; solo?: boolean };

/**
 * A night judged (`systems/evaluation.ts`, the `performance` profile), from 2026-10-09: the part's techniques as the
 * play reads them, the abilities a night asks, the process as its preparation (lines, blocking, notes taken), the
 * day's condition at the curtain, and the play's genres leaning what counts. Until 2026-10-09 a night was the craft
 * against a par, readiness, a fifth of presence's distance from the middle, nerves taken off the top and a luck draw
 * of ±0.2 that could pull down any night; the luck is the evaluation's bounded variation now, and nothing at full
 * capacity.
 */
/**
 * A play as a piece in its movements (from 2026-10-12, `systems/piece.ts`): its tones in order, two at least, a first
 * half and a second where the play holds one; each movement's blocking refined by any work on it, and the evening's
 * load. A play with no profile, a festival's or a cabaret's new one, was judged whole until 2026-10-12; from then it's
 * its two halves with no tones assumed (`toneSegments` with two at least). From 2026-10-16 (evaluation-10) a play's movements
 * are its units, each tone section cut again at its turns (`unitSegments`), where until then they were its tones only.
 * From later that day (brief 10, evaluation-11) the evening's load is its workload (`nightPiece`, `systems/workload.ts`):
 * the production's running time, the part's share of it by its size, and the body's and the voice's work. Until then it
 * read the body and the voice alone, so a one-act and a featured part were each a whole evening's lead.
 */
export function playPiece(holder: NightHolder, size: Participation = 'supporting'): PieceSpec {
  const material = materialOf(holder.play);
  const proc = hasProcess(holder) ? holder.process : undefined;
  return withBook({ ...nightPiece(material, runningOf(holder), holder.solo ? 'solo' : size), work: proc?.work ?? [] }, proc?.book);
}

/** The hours a part is on stage in a performance (from 2026-10-16, brief 10): the playing time, by the part's share of it. */
export function stageHours(holder: NightHolder, size: Participation): number {
  const n = playPiece(holder, size).night!;
  return (n.playing * n.share) / 60;
}

export function nightEvaluation(sim: Simulation, person: Person, key: string, holder: NightHolder, at: Instant, size: PartSize = 'supporting', where: 'school' | 'rep' = 'school', expected = false): Evaluation {
  const E = TASK_PROFILES.performance!;
  const prep = prepOf(holder) ?? {};
  // Complete is what every call makes, but never asks less than a part's lines and blocking at their least.
  const par = completeFor(holder);
  const required: Record<string, number> = par ? { lines: Math.max(par.lines, NIGHT_LEAST.lines), blocking: Math.max(par.blocking, NIGHT_LEAST.blocking), notes: par.notes } : {};
  // The play's material and the way the part is played (from 2026-10-10): its lean, what it asks, the choice's
  // rehearsal and whether it fits the play and the director's request. A play with no profile leans by its kinds.
  // From later on 2026-10-16 (brief 10) the material carries the part's text, by its time on stage (`withPart`).
  const piece = playPiece(holder, size);
  const material = materialOf(holder.play);
  const proc = hasProcess(holder) ? holder.process : undefined;
  const playing = proc?.playing;
  const prepWith: Record<string, number> = { ...prep };
  const read = material || playing ? materialContext(E, material && withPart(material, piece.night!), playing, proc?.direction) : undefined;
  if (playing && (playing.pace || playing.scale || playing.structure)) { prepWith.approach = playing.prep; required.approach = read?.required ?? PLAYING.complete; }
  const ctx = {
    task: E, techniques: castingReads(holder), prep: prepWith, required, difficulty: NIGHT_DIFFICULTY[where][size],
    condition: conditionAt(sim, person, at), ...(read ? { lean: read.lean, inputs: read.inputs, extraPrep: read.prep, fit: read.fit, grain: read.grain } : { families: familiesOf(genresOfPlay(holder.play) ?? []) }), key: `night:${person.id}:${key}`,
    ...(expected ? { expected: true } : {}),
  };
  return evaluatePiece(sim, person, ctx, piece);
}

/**
 * The company of a night (from 2026-10-12, `systems/ensemble.ts`): the classmates cast with you, as one partner. Their
 * preparation is the share of the calls they keep (`reliabilityOf`), their timing their listening and focus, and the
 * play's partner level how much of the night is played off them. None cast with you that the class knows: none.
 */
export function companyRead(sim: Simulation, person: Person, holder: NightHolder & { cast?: { name: string }[] }): PartnerRead | undefined {
  const school = person.school;
  const material = materialOf(holder.play);
  if (!school || !holder.cast?.length) return undefined;
  const idx = holder.cast.map((c) => school.classmates.findIndex((m) => m.name === c.name)).filter((i) => i >= 0);
  if (!idx.length) return undefined;
  const mean = (f: (i: number) => number) => idx.reduce((a, i) => a + f(i), 0) / idx.length;
  const rel = mean((i) => reliabilityOf(sim, person, i));
  const timing = mean((i) => { const p = classmatePerformer(sim, person, i); return 0.5 + 0.5 * ((Math.min(100, p.ability('listening')) + Math.min(100, p.ability('focus'))) / 200); });
  // A new play with no profile is played off the company as an ordinary play is, at 2 (SLATE's middle).
  return { name: 'The Company', prep: rel, timing, agree: 1, reliability: rel, level: material?.partner ?? 2 };
}

/** A night together: your night with the company's contribution, where there's a company (`companyRead`). */
export function nightTogether(sim: Simulation, person: Person, holder: NightHolder & { cast?: { name: string }[] }, evaluation: Evaluation): SharedResult | undefined {
  const read = companyRead(sim, person, holder);
  if (!read) return undefined;
  const material = materialOf(holder.play);
  const proc = hasProcess(holder) ? holder.process : undefined;
  // The part's text as the night read it (from 2026-10-16, brief 10): its own night where it kept one, a supporting part's where not.
  const night = evaluation.inputs.piece?.night ?? playPiece(holder).night!;
  const lean = material || proc?.playing ? materialContext(TASK_PROFILES.performance!, material && withPart(material, night), proc?.playing, proc?.direction).lean : undefined;
  const weights = lean ? pieceWeights(TASK_PROFILES.performance!, lean, playPiece(holder)) : leanedWeights(TASK_PROFILES.performance!, familiesOf(genresOfPlay(holder.play) ?? []));
  const norm = (id: AbilityId) => Math.min(1, abilityOf(sim, person, id) / Math.max(1, abilityFull(sim, person, id)));
  return sharedOf(evaluation, read, sim.universe.meta.seed, evaluation.inputs.key, (norm('listening') + norm('adaptability')) / 2, weights);
}

/**
 * What a part would show on a night played a given way, prepared fully and on a sufficient day, with no draw (from
 * 2026-10-10): the preview a choice of how to play it is made by. The size and the house don't change between the
 * choices, so a supporting part at the School is the reading.
 */
export function partPreview(sim: Simulation, person: Person, holder: NightHolder, playing: Omit<Playing, 'chosenAt' | 'prep'>): Evaluation {
  const E = TASK_PROFILES.performance!;
  const material = materialOf(holder.play);
  const proc = hasProcess(holder) ? holder.process : undefined;
  const chosen = { ...playing, chosenAt: sim.now, prep: 1 } as Playing;
  const piece = playPiece(holder, 'supporting');
  const read = materialContext(E, material && withPart(material, piece.night!), chosen, proc?.direction);
  const ctx = { task: E, techniques: castingReads(holder), prep: { lines: 1, blocking: 1, notes: 1, approach: 1 }, required: { lines: 1, blocking: 1, notes: 1, approach: 1 }, difficulty: NIGHT_DIFFICULTY.school.supporting, condition: { readiness: 100 }, lean: read.lean, inputs: read.inputs, extraPrep: read.prep, fit: read.fit, grain: read.grain, key: `preview:${holder.play ?? ''}`, expected: true };
  // A supporting part's workload and text, as its difficulty is (from 2026-10-16, brief 10): the same for every choice compared.
  return judgePiece(sim.universe.meta.seed, performerOf(sim, person), ctx, piece);
}

/** The least a night's lines and blocking must be at to count complete, however few the calls: off book (`PROCESS.offBook`), and the blocking set. */
export const NIGHT_LEAST = { lines: 0.7, blocking: 0.7 } as const;

/** A night's band as a title says it. */
const NIGHT_WORD_TITLE: Record<Night, string> = { off: 'An Off Night', solid: 'Solid', strong: 'Strong', remarkable: 'Remarkable' };

/** A night's band, by its whole result at the evaluation's bands (LAMDA's Pass, Merit and Distinction). */
export const nightBand = (overall: number): Night => ({ unready: 'off', working: 'solid', strong: 'strong', exceptional: 'remarkable' } as const)[bandOfQuality(overall)];

/** How a night went (`school.night`), in its band. */
export function nightOf(sim: Simulation, person: Person, key: string, holder: NightHolder, at: Instant, size: PartSize = 'supporting', where: 'school' | 'rep' = 'school'): Night {
  return nightBand(nightEvaluation(sim, person, key, holder, at, size, where).overall);
}

/** The director's note on a run, by how its nights went on average. */
export function directorsNote(mean: number): string {
  if (mean >= 1.25) return 'Remarkable work, night after night.';
  if (mean >= 0.5) return 'Strong, reliable work across the run.';
  if (mean >= -0.25) return 'Solid, sound nights. The next step is to take more risks in them.';
  return 'Uneven: some nights got away from you. Come in rested, and have the part in your body before the house does.';
}

/**
 * The teachers' notes on a term: for each course the term ran, its first
 * teacher on how the student grew in the skills it trains against the class's
 * middle, ahead at a quarter more, behind under three quarters. The Bulletin
 * says the faculty evaluate students regularly (this said "each term" until
 * 2026-10-10); a note each term, what each says, and the edges, are SLATE's.
 */
export function teachersNotes(person: Person, term: number): { course: string; teacher: string; note: string }[] {
  const t = person.school?.tally;
  const start = t?.classCraftAtStart;
  if (!t || !start || !person.craft) return [];
  const courses = COURSES.filter((c) => c.year === yearOfTerm(academicTerm(person.school, term)) && c.terms.includes(termStart(term).fall ? 'fall' : 'spring'));
  return courses.map((c) => {
    const mine = c.skills.reduce((sum, k) => sum + person.craft![k] - t.craftAtStart[k], 0) / c.skills.length;
    const class_ = person.school!.classmates.map((m, i) => c.skills.reduce((sum, k) => sum + m.craft[k] - (start[i]?.[k] ?? m.craft[k]), 0) / c.skills.length).sort((a, b) => a - b);
    const middle = class_[Math.floor(class_.length / 2)] ?? 0;
    // Every skill the course trains, as its growth is measured over them all (from 2026-10-17, brief 14: until then the
    // note named the first alone).
    const names = c.skills.map((id) => SKILLS.find((k) => k.id === id)!.label.toLowerCase());
    const skill = names.length < 2 ? names[0]! : `${names.slice(0, -1).join(', ')}${names.some((n) => n.includes(' and ')) ? ', and' : ' and'} ${names.at(-1)}`;
    const note = mine >= 1.25 * middle
      ? `Real progress this term: you’re pulling ahead of the class in ${skill}.`
      : mine >= 0.75 * middle
      ? `Steady work, in step with the class. Keep at your ${skill}.`
      : `You’ve grown less than the class in ${skill} this term. Come to class rested, and do the work between classes.`;
    return { course: c.name, teacher: c.teachers.split(', ')[0]!, note };
  });
}

/**
 * The chair's read of the runs since the last casting (`ESTIMATE.casting.record`), each marked read: the delivery,
 * the evidence it stands on and where it came from, and the last School or Rep part's size. A save from before
 * 2026-10-10 has no run record; its last production's delivery, kept on the casting, is read as that run.
 */
export function readRuns(school: SchoolRecord, term: number, c0: Casting | undefined): LastWork | undefined {
  const R = ESTIMATE.casting.record;
  const prior = school.lastWork;
  const legacy = (c0 as Run & { delivered?: { sum: number; n: number } } | undefined)?.delivered;
  if (c0 && legacy?.n && !(school.runs ?? []).some((r) => r.production === c0.production && r.term === c0.term)) {
    (school.runs ??= []).push({ key: `school:${c0.production}:${c0.term}`, source: 'school', production: c0.production, ...(c0.play ? { play: c0.play } : {}), role: c0.role, ...(c0.size ? { size: c0.size } : {}), term: c0.term, nights: legacy.n, missed: 0, delivered: legacy.sum, quality: 0, firstAt: 0, lastAt: 0 });
  }
  const from: NonNullable<LastWork['from']> = [];
  let weight = 0;
  let sum = 0;
  if (prior?.delivery !== undefined) {
    const w = (prior.weight ?? R.nightsCap) * R.carry;
    weight += w; sum += prior.delivery * w;
    from.push({ what: 'Your record before', source: 'before', delivery: prior.delivery, weight: Math.round(w * 100) / 100 });
  }
  for (const r of school.runs ?? []) {
    if (r.readAtCasting !== undefined || r.nights <= 0) continue;
    const w = Math.min(r.nights, R.nightsCap) * R.weight[r.source];
    const d = r.delivered / r.nights;
    weight += w; sum += d * w;
    r.readAtCasting = term;
    from.push({ what: r.play ?? r.production, source: r.source, nights: r.nights, delivery: Math.round(d * 1000) / 1000, weight: w });
  }
  const size = c0?.size ?? prior?.size;
  if (!weight && !size) return prior;
  return { ...(size ? { size } : {}), ...(weight ? { delivery: Math.round((sum / weight) * 1000) / 1000, weight: Math.min(R.cap, weight), from } : {}) };
}

/** Where a run is played, by which of the student's runs it is. */
function runSource(school: SchoolRecord, run: Run, rep: boolean): RunSource {
  if (run === (school.cabaret as unknown)) return 'cabaret';
  if (school.summer?.shows?.includes(run)) return 'summer';
  return rep ? 'rep' : 'school';
}

/** A night of a run kept in the record (`RunRecord`): played, with its delivery and quality, or missed. */
export function noteRun(school: SchoolRecord, run: Run & { term?: number }, rep: boolean, at: Instant, night: { delivery: number; quality: number } | 'missed'): RunRecord {
  const source = runSource(school, run, rep);
  const key = `${source}:${run.production}:${run.term ?? ''}`;
  const runs = (school.runs ??= []);
  let r = runs.find((x) => x.key === key && x.readAtCasting === undefined);
  if (!r) {
    r = { key, source, production: run.production, ...(run.play ? { play: run.play } : {}), role: run.role, ...(run.size ? { size: run.size } : {}), ...(run.term !== undefined ? { term: run.term } : {}), nights: 0, missed: 0, delivered: 0, quality: 0, firstAt: at, lastAt: at };
    runs.push(r);
    if (runs.length > 12) runs.splice(0, runs.length - 12);
  }
  r.nights += 1;
  r.lastAt = at;
  if (night === 'missed') r.missed += 1;
  else { r.delivered += night.delivery; r.quality += night.quality; }
  return r;
}

/** How many nights a run has played. */
const nightsOf = (c: Casting) => Object.values(c.nights ?? {}).reduce((a, b) => a + b, 0);

/** A run's nights on average, by what each is worth. */
export function nightsMean(nights: Partial<Record<Night, number>>): number {
  const all = Object.entries(nights) as [Night, number][];
  const n = all.reduce((sum, [, c]) => sum + c, 0);
  return n ? all.reduce((sum, [b, c]) => sum + NIGHT_VALUE[b] * c, 0) / n : 0;
}

type Student = { i: number; name: string; craft: Craft; title: NonNullable<Classmate['title']>; last?: LastWork; perf?: Performer };

/**
 * A classmate's abilities, drawn the first time they're asked for and kept (`MateAbilities`). From their craft as it
 * stands then, so a class from before 2026-10-10 is drawn from the craft it has grown to, and the same save draws the
 * same.
 */
export function mateAbilities(sim: Simulation, person: Person, i: number): MateAbilities {
  const mate = person.school!.classmates[i]!;
  mate.abilities ??= drawMateAbilities(sim.universe.meta.seed, person.id, i, mate.craft);
  return mate.abilities;
}

/** The draw itself, by the save's seed, the player and the classmate's place: the same whenever it's made (migration 93 makes it). */
export function drawMateAbilities(seed: string, personId: string, i: number, craft: Craft): MateAbilities {
  const stability = 100 * rngFor(seed, 'attributes.composure', personId, `mate-${i}`).next();
  const kin = (id: AbilityId) => { const k = ABILITY_KIN[id] ?? []; return Math.round(k.reduce((s, x) => s + craft[x], 0) / k.length * 10) / 10; };
  return {
    composure: Math.round((ATTRIBUTES.composureStart.base + ATTRIBUTES.composureStart.perStability * stability) * 10) / 10,
    listening: kin('listening'), imagination: kin('imagination'), focus: kin('focus'), adaptability: kin('adaptability'),
  };
}

/**
 * A classmate's run, judged (from 2026-10-10): the same evaluation as the player's nights, by the same profile, of the
 * play's reads, with the preparation their kept calls make (`reliabilityOf`, the share of the process they'd have)
 * and a sufficient day, since a classmate's days aren't lived; kept on them as their work's record (`shown`), and
 * their composure grown by the nights as the player's is (`ATTRIBUTES.composureGain`).
 */
export function classmateRun(sim: Simulation, person: Person, i: number, reads: Partial<Craft>, production: string, nights: number, at: Instant): void {
  const mate = person.school!.classmates[i]!;
  const kept = reliabilityOf(sim, person, i);
  const e = judge(sim.universe.meta.seed, classmatePerformer(sim, person, i), {
    task: TASK_PROFILES.performance!, techniques: reads, prep: { lines: kept, blocking: kept, notes: kept }, required: { lines: 1, blocking: 1, notes: 1 },
    difficulty: NIGHT_DIFFICULTY.school.supporting, condition: { readiness: 75 }, key: `mate:${i}:${production}`,
  });
  mate.shown = { production, quality: e.overall, at, runs: (mate.shown?.runs ?? 0) + 1 };
  const a = mateAbilities(sim, person, i);
  for (let n = 0; n < nights; n += 1) a.composure = Math.min(100, a.composure + (100 - a.composure) * ATTRIBUTES.composureGain.performance);
}

/** A classmate as the evaluation reads them: their craft, presence and abilities, on the same scales as the player's. */
export function classmatePerformer(sim: Simulation, person: Person, i: number): Performer {
  const mate = person.school!.classmates[i]!;
  const held: Partial<Record<AbilityId, Skill>> = { emotionalDepth: 'emotion', memory: 'memorization', vocal: 'voice', physical: 'movement' };
  return {
    ability: (id) => {
      const skill = held[id];
      if (skill) return mate.craft[skill];
      if (id === 'presence') return classmatePresence(sim, person, i);
      if (id === 'discipline' || id === 'stamina') return 100;
      return mateAbilities(sim, person, i)[id as keyof MateAbilities];
    },
    full: () => 100,
    technique: (skill) => mate.craft[skill],
  };
}

/**
 * How a casting reads anybody (from 2026-10-10): the same, for the player and every classmate, but blind to a body's
 * conditioning and a work habit (stamina and discipline count as full), since neither is simulated for the class;
 * they show in the nights a student plays, not in the chair's read.
 */
export const castingPerformer = (p: Performer): Performer => ({
  ability: (id) => (id === 'stamina' || id === 'discipline' ? p.full(id) : p.ability(id)),
  full: (id) => p.full(id),
  technique: (skill) => p.technique(skill),
});

/**
 * A student's fit for a play (from 2026-10-10): the whole a night of it would be expected to come to, read by the
 * evaluation (`performance`) from the abilities a night asks and the techniques the play reads, its kinds' demands
 * among them; preparation complete and the day sufficient, and no draw. What each would bring if all went to plan.
 */
export function castFit(sim: Simulation, perf: Performer, reads: Partial<Craft>, kinds: readonly string[], key: string, title?: string): number {
  // The play's material as a night reads it (from 2026-10-10), before anyone has chosen how to play it.
  // From later on 2026-10-16 (brief 10) with a supporting part's text, as its workload is (`withPart`).
  const material = materialOf(title);
  const piece = playPiece({ ...(title ? { play: title } : {}) });
  const read = material ? materialContext(TASK_PROFILES.performance!, withPart(material, piece.night!)) : undefined;
  const ctx = {
    task: TASK_PROFILES.performance!, techniques: reads, prep: {}, required: {}, difficulty: 0,
    condition: { readiness: 100 }, ...(read ? { lean: read.lean, inputs: read.inputs } : { families: familiesOf(kinds) }), key, expected: true,
  };
  // Judged in its movements as a night is (from 2026-10-12).
  return judgePiece(sim.universe.meta.seed, castingPerformer(perf), ctx, piece).overall;
}

/**
 * How a student reads to the chair for a play (`ESTIMATE.casting`): their fit for it (`castFit`; the craft the play
 * reads where nobody's been read yet), a fifth of it by how much of themselves they delivered in their last run, and
 * the balance of opportunity. Until 2026-10-10 it was the craft against the play's reads, the last run's nights a
 * point and a half a band and a director's note heeded another point and a half: the nights and the note read the
 * craft a second and a third time, and they went.
 */
export function castScore(s: { craft: Craft; last?: LastWork; fit?: number }, reads: Partial<Craft>): number {
  const c = ESTIMATE.casting;
  const fit = s.fit ?? readOf(s.craft, reads);
  return fit * (1 - c.delivery + c.delivery * (s.last?.delivery ?? 1)) + (s.last?.size ? c.balance[s.last.size] : 0);
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
export function partsFor(students: readonly Student[], parts: readonly Part[], reads: Partial<Craft>, fit?: (s: Student) => number): { s: Student; part: string; size: PartSize }[] {
  const open = [...parts];
  const score = (s: Student) => castScore({ ...s, ...(fit ? { fit: fit(s) } : {}) }, reads);
  return [...students].sort((a, b) => score(b) - score(a)).map((s) => {
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
  // What the chair reads of last time: the part's size and how much of themselves they delivered in it.
  const c0 = school.casting;
  // A run its term's evaluation came too early to judge is kept for the next.
  const unjudged = [school.casting, school.rep].filter((c): c is Casting => c !== undefined && !c.reviewed && nightsOf(c) >= ESTIMATE.workNights);
  if (unjudged.length) school.unreviewed = [...(school.unreviewed ?? []), ...unjudged].slice(-2);
  school.lastWork = readRuns(school, term, c0);
  delete school.casting;
  delete school.rep;
  // A third-year a director asks into the Rep's company plays there that
  // term, not in a School production too: the two rehearse the same
  // afternoons. Until 2026-09-28 a student was cast in both, and the Rep won
  // every rehearsal, leaving the thesis part unrehearsed.
  // The year they're in, and this calendar term's productions (`academic`, from 2026-10-10).
  const academic = academicTerm(school, term);
  const company = repTerm(academic) && yearOfTerm(academic) === 3;
  const playerAtRep = company && school.standing === 'good' && actingOf(person.craft!) >= ESTIMATE.castAtRep;
  const matesAtRep = new Set(company ? school.classmates.map((m, i) => ({ m, i })).filter(({ m }) => actingOf(m.craft) >= ESTIMATE.castAtRep).map(({ i }) => i) : []);
  // The rest of the class is cast together, the player among them where they're in the pool.
  const students: Student[] = school.classmates.flatMap((_, i) => { if (matesAtRep.has(i)) return []; const m = mateOf(sim, person, i); return [{ i, name: m.name, craft: m.craft, title: m.title, perf: classmatePerformer(sim, person, i), ...(m.last ? { last: m.last } : {}) }]; });
  if (school.castable && !playerAtRep) students.push({ i: -1, name: 'You', craft: person.craft!, title: person.performerTitle === 'actress' ? 'actress' : 'actor', perf: performerOf(sim, person), ...(school.lastWork ? { last: school.lastWork } : {}) });
  // Each student's fit for each play, worked out once (`castFit`).
  const fits = new Map<string, number>();
  const fitFor = (play: { title?: string; reads: Partial<Craft>; kinds?: readonly string[] }) => (s: Student) => {
    const k = `${s.i}:${play.title ?? 'new'}`;
    if (!fits.has(k)) fits.set(k, s.perf ? castFit(sim, s.perf, playReads(play), play.kinds ?? [], `cast:${term}:${k}`, play.title) : readOf(s.craft, play.reads));
    return fits.get(k)!;
  };
  const first = schoolProduction(term, 1, academic);
  const around: { name: string; production: string; part: string; size?: PartSize }[] = [];
  let mine: { production: NonNullable<ReturnType<typeof schoolProduction>>; play: ReturnType<typeof playOf>; part: string; size: PartSize; cast: { name: string; part: string }[] } | undefined;
  // The days each classmate's production calls them, for the Cabaret's (`cabaretCompany`).
  const callsOf = new Map<number, Set<string>>();
  if (company) for (const i of matesAtRep) callsOf.set(i, repDays(term));
  if (first) {
    // Placed by how each reads for the first production's play, then cast within each.
    const firstPlay = playOf(sim, person, first);
    const firstFit = fitFor(firstPlay);
    const order = [...students].sort((a, b) => castScore({ ...b, fit: firstFit(b) }, firstPlay.reads) - castScore({ ...a, fit: firstFit(a) }, firstPlay.reads));
    const groups = new Map<string, { production: NonNullable<ReturnType<typeof schoolProduction>>; members: Student[] }>();
    order.forEach((s, k) => {
      const production = schoolProduction(term, k + 1, academic)!;
      const g = groups.get(production.name) ?? { production, members: [] };
      g.members.push(s);
      groups.set(production.name, g);
    });
    for (const { production, members } of groups.values()) {
      const play = playOf(sim, person, production);
      const playFit = fitFor(play);
      const given = partsFor(members, play.parts, play.reads, playFit);
      const shown = play.title ?? production.name;
      for (const g of given) if (g.s.i >= 0) callsOf.set(g.s.i, productionDays(term, production));
      for (const g of given) around.push({ name: g.s.name, production: shown, part: partLabel(g.part, production.kind), size: g.size });
      // A classmate's delivery is the share of calls they keep (`reliabilityOf`): their calls aren't played one by one.
      for (const g of given) if (g.s.i >= 0) school.classmates[g.s.i]!.last = { size: g.size, delivery: reliabilityOf(sim, person, g.s.i) };
      const me = given.find((g) => g.s.i < 0);
      // The chair's read of this cast, kept for the screen: each student's fit, delivery, balance and the part.
      if (me) {
        school.castRead = {
          term, play: shown, reads: playReads(play), kinds: [...(play.kinds ?? [])],
          rows: given.map((g) => ({ name: g.s.name, you: g.s.i < 0, fit: Math.round(playFit(g.s) * 10) / 10, delivery: g.s.last?.delivery ?? 1, balance: g.s.last?.size ? ESTIMATE.casting.balance[g.s.last.size] : 0, ...(g.s.i < 0 && g.s.last?.from ? { from: g.s.last.from } : {}), score: Math.round(castScore({ ...g.s, fit: playFit(g.s) }, play.reads) * 10) / 10, part: partLabel(g.part, production.kind), size: g.size })),
        };
      }
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
      if (mates.length) schedule(sim, person, at(last, 22), { kind: COMPANY_KIND, label: `${shown}: The Run Ends`, minutes: 0, requiresPlayer: false, payload: { mates, rehearsals: rehearsalDays(term, production.runs[0]!, production.weeks).length, performances: production.runs.length, reads: playReads(play), production: shown, opened: keyOf(production.runs[0]!) } });
    }
  }
  school.around = { term, list: around };
  classCabaret(sim, person, term, callsOf);
  castListRead(person);
  if (!school.castable) {
    if (person.id === sim.universe.playerId) sim.notify({ category: 'school', title: 'Not Cast This Term', body: 'You’re out of the casting pool after missed calls. A term review that finds you in good standing puts you back.', importance: 70, route: '/workspace/school' });
    return;
  }
  // Both assignments' calls, worked out before any is booked, so the one
  // student is never called to two places at once. The School production's
  // rehearsals give way to a Yale Rep call; a Rep night on call gives way to
  // the student's own School performance; a Rep performance in a role wins
  // over a School one. Until 2026-09-27 each was booked on its own, and a
  // second-year understudy was called to Rep and to a thesis on eight
  // afternoons, and credited with both.
  type Call = { at: Instant; minutes: number; label: string; call: 'rehearsal' | 'performance' | 'oncall' | 'runthrough'; which?: 'rep'; last?: true; stage?: Stage; n?: number; of?: number };
  // Each rehearsal call's stage in the process, numbered (`systems/production.ts`, from 2026-10-07): until then every
  // call was the same rehearsal, from the first to the night before opening.
  const staged = (calls: Call[], name: string, understudy = false) => {
    const rehearsals = calls.filter((c) => c.call === 'rehearsal');
    const stages = stagesOf(rehearsals.length);
    rehearsals.forEach((c, i) => { c.stage = understudy ? 'understudy' : stages[i]!; c.n = i + 1; c.of = rehearsals.length; c.label = `${name}: ${STAGE_LABEL[c.stage]}`; });
  };
  const ours: Call[] = [];
  const reps: Call[] = [];
  const production = mine?.production;
  if (mine && production) {
    school.casting = {
      production: production.name, role: partLabel(mine.part, production.kind), kind: production.kind, term, performed: 0, size: mine.size, cast: mine.cast,
      ...(mine.play.title ? { play: mine.play.title, by: mine.play.by } : {}),
    };
    // A rehearsal on the afternoon of a lab's showing gives way to it (from 2026-10-10: until then the third year's You Are
    // The Creator showing and the Shakespeare Repertory Project I rehearsal were both called for 19 January 2029).
    const labs = sim.universe.scheduled.filter((i) => i.status === 'pending' && i.kind === LAB_KIND && i.payload.personId === person.id);
    for (const d of rehearsalDays(term, production.runs[0]!, production.weeks)) {
      const from = at(d, 15);
      if (labs.some((l) => l.at < from + 360 * 60_000 && from < l.at + (l.durationMinutes ?? 0) * 60_000)) continue;
      ours.push({ at: from, minutes: 360, label: `${production.name}: Rehearsal`, call: 'rehearsal' });
    }
    // At eight, as Carlotta's 2026 curtains were (from 2026-10-10; until then at seven, which nothing published). Held for
    // the play's running time and the curtain call (from 2026-10-16, brief 10, `holdOf`): until then two and a half hours
    // whatever the play.
    const hold = holdOf({ ...(mine.play.title ? { play: mine.play.title } : {}), kind: production.kind });
    production.runs.forEach((d, k) => ours.push({ at: at(d, 20), minutes: hold, label: `${production.name}: Performance`, call: 'performance', ...(k === production.runs.length - 1 ? { last: true } : {}) }));
  }
  // Staged once the calls each production keeps are known (below), from 2026-10-12.
  let repStaged: { name: string; understudy: boolean } | undefined;
  if (repTerm(academic) && school.standing === 'good') {
    const rep = repProduction(term);
    const inRole = playerAtRep;
    // After 2026–27 the Rep's play is dealt (`repPlayOf`): an understudy covers a lead written for them, and a company member plays a featured part (SLATE's estimate).
    const play = term === 1 ? undefined : repPlayOf(sim, person, term);
    const title = person.performerTitle === 'actress' ? 'actress' : 'actor';
    const pick = (size: PartSize) => play?.parts.find((x) => x.size === size && (x.for === title || x.for === 'either'))?.name;
    const role = term === 1 ? (title === 'actress' ? SEAGULL_2027.roles.actress : SEAGULL_2027.roles.actor) : inRole ? (pick('featured') ?? 'A Featured Part In The Company') : (pick('lead') ?? 'An Understudy In The Company');
    // The class's others asked into the company with you, as a School production's cast lists them (from 2026-10-12), so a
    // curtain counts the friends among them and the nights together read them. Until then the Rep's casting had no cast,
    // and every Rep curtain weighed on somebody who needs company as one played among strangers, classmates on the stage
    // with them or not. An understudy sent on still plays with none of the class.
    const fellows = inRole ? [...matesAtRep].map((i) => ({ name: school.classmates[i]!.name, part: 'A Featured Part In The Company' })) : [];
    school.rep = { production: rep.name, role, kind: inRole ? 'role' : 'understudy', term, performed: 0, ...(inRole ? { size: 'featured' as const } : {}), ...(fellows.length ? { cast: fellows } : {}), ...(play ? { play: play.title, by: play.by } : {}) };
    // Rehearsals: an understudy's Wednesday and Friday, three to six; a company member's Tuesday to Saturday, three to nine (SLATE's estimate).
    for (let d = parseKey(rep.rehearsals.from); keyOf(d) <= rep.rehearsals.to; d = addDays(d, 1)) {
      const wd = weekday(d);
      if (inRole ? wd >= 2 && wd <= 6 : wd === 3 || wd === 5) reps.push({ at: at(d, 15), minutes: inRole ? 360 : 180, label: `${rep.name}: ${inRole ? 'Rehearsal' : 'Understudy Rehearsal'}`, call: 'rehearsal', which: 'rep' });
    }
    // Every performance, evenings Tuesday to Saturday at eight and Sundays at two: played, or on call. Each held for the
    // play's running time and the curtain call (from 2026-10-16, brief 10): until then three hours whatever the play.
    const repHold = holdOf({ ...(play ? { play: play.title } : {}), kind: inRole ? 'role' : 'understudy' });
    for (let d = parseKey(rep.run.from); keyOf(d) <= rep.run.to; d = addDays(d, 1)) {
      const wd = weekday(d);
      if (wd === 1) continue;
      reps.push({ at: wd === 0 ? at(d, 14) : at(d, 20), minutes: repHold, label: `${rep.name}: ${inRole ? 'Performance' : 'On Call'}`, call: inRole ? 'performance' : 'oncall', which: 'rep' });
    }
    repStaged = { name: rep.name, understudy: !inRole };
    // An understudy's run-through: the understudies play the show once for the
    // director and stage management, on the dark Monday of the run's second
    // week (SLATE's estimate of when).
    if (!inRole) {
      let d = addDays(parseKey(rep.run.from), 7);
      while (weekday(d) !== 1) d = addDays(d, 1);
      if (keyOf(d) <= rep.run.to) reps.push({ at: at(d, 14), minutes: repHold, label: `${rep.name}: Understudy Run-Through`, call: 'runthrough', which: 'rep' });
    }
  }
  const overlaps = (a: Call, b: Call) => a.at < b.at + b.minutes * 60_000 && b.at < a.at + a.minutes * 60_000;
  // An understudy on call needs nobody at the theater unless they're sent on (from 2026-09-28), so an evening on call
  // doesn't take a School rehearsal's place: only a Rep rehearsal, performance or run-through does (from 2026-10-12;
  // until then every School rehearsal on a Rep performance night was dropped, the technical and the dress among them).
  const keptOurs0 = ours.filter((c) => !reps.some((r) => r.call !== 'oncall' && overlaps(c, r) && (c.call === 'rehearsal' || r.call === 'performance')));
  // A School rehearsal on an evening on call ends when the call begins, so an understudy sent on can go, and one after a
  // matinee on call starts when it's over; under two hours left of it, it isn't called.
  const keptOurs = keptOurs0.flatMap((c) => {
    if (c.call !== 'rehearsal') return [c];
    const call = reps.find((r) => r.call === 'oncall' && overlaps(c, r));
    if (!call) return [c];
    // A matinee on call before it: it starts when the call is over instead.
    if (call.at <= c.at) {
      const from = call.at + call.minutes * 60_000;
      const minutes = Math.floor((c.at + c.minutes * 60_000 - from) / 60_000);
      return minutes >= 120 ? [{ ...c, at: from, minutes }] : [];
    }
    const minutes = Math.floor((call.at - c.at) / 60_000);
    return minutes >= 120 ? [{ ...c, minutes }] : [];
  });
  const keptReps = reps.filter((r) => !(r.call === 'oncall' && keptOurs.some((c) => c.call === 'performance' && overlaps(c, r))));
  // The run’s last night, played or on call, closes it (`closeRun`). Until 2026-10-14 only a performance was marked, so
  // an understudy’s run, all on call, was never closed: sent on once as Nina in The Seagull, which ran to 27 March 2027,
  // she read “No production yet.” on School Journey until the next casting filed the credit in August (found by that
  // day’s third round of evidence). Marked among the nights kept, so a night on call a School performance took isn’t it.
  const final = keptReps.filter((r) => r.call === 'performance' || r.call === 'oncall').at(-1);
  if (final) final.last = true;
  // Each production's rehearsals numbered and staged on the calls it keeps (from 2026-10-12). Until then they were
  // staged before the overlap filter dropped any, so a call numbered 4 of 20 could be the student's second of eight, the
  // par counted calls never given, and the technical and the dress could be among the dropped: measured on seed 'of-a',
  // a Thesis I casting with a Rep understudy kept 8 of 20 numbered calls and could never reach complete preparation.
  if (production) staged(keptOurs, production.name);
  if (repStaged) staged(keptReps, repStaged.name, repStaged.understudy);
  for (const c of [...keptOurs, ...keptReps]) {
    // A night on call is a call at five (`ESTIMATE.onCallAt`), in New Haven and reachable, and needs nobody at the theater unless they're sent on. Until 2026-09-28 it held the evening at the theater and stopped the clock every performance night.
    if (c.call === 'oncall') {
      schedule(sim, person, c.at - ESTIMATE.onCallAhead * 60 * 60_000, { kind: CALL_KIND, label: c.label, minutes: 0, requiresPlayer: false, payload: { call: 'oncall', check: true, perfAt: c.at, holds: c.minutes, which: 'rep', ...(c.last ? { last: true } : {}) } });
      continue;
    }
    schedule(sim, person, c.at, { kind: CALL_KIND, label: c.label, minutes: c.minutes, payload: { call: c.call, ...(c.which ? { which: c.which } : {}), ...(c.last ? { last: true } : {}), ...(c.stage ? { stage: c.stage, n: c.n, of: c.of } : {}) } });
  }
  // The class's others the directors ask into the Rep's company in the third year, the same bar.
  if (repTerm(academic) && yearOfTerm(academic) === 3) {
    const rep = repProduction(term);
    const mates = school.classmates.map((m, i) => ({ m, i })).filter(({ i }) => matesAtRep.has(i));
    for (const { m } of mates) school.around.list.push({ name: m.name, production: rep.name, part: 'A Featured Part In The Company' });
    const days = Math.max(0, Math.round((Date.parse(rep.run.from) - Date.parse(rep.rehearsals.from)) / MS_DAY));
    if (mates.length) schedule(sim, person, at(parseKey(rep.run.to), 23), { kind: COMPANY_KIND, label: `${rep.name}: The Run Ends`, minutes: 0, requiresPlayer: false, payload: { mates: mates.map(({ i }) => i), rehearsals: Math.round(days * 5 / 7), performances: Math.round((Date.parse(rep.run.to) - Date.parse(rep.run.from)) / MS_DAY * 6 / 7) + 1, production: rep.name, opened: rep.run.from } });
  }
  if (person.id === sim.universe.playerId) {
    // The casting is SLATE's simulation of the chair's (from 2026-10-16 the notice names nobody as having made it: until then
    // it named the chair of Acting, as `setStanding`'s notices did).
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
    if (parts.length) sim.notify({ category: 'school', title: `Cast: ${school.casting?.production ?? r!.production}`, body: `The chair of Acting has cast you ${parts.join(', ')}. Once cast, you play the part through the run, and a missed call counts against you.`, importance: 75, route: '/workspace/school' });
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
/**
 * The room a growth is measured against, at its least (from 2026-10-12): within this of the ceiling a student has the
 * reach the classes level off at, and has met the growth the term asks. Until then the room was floored at 0.01, so a
 * student at every skill's ceiling who grew nothing was judged behind the class and stepped toward dismissal, and one a
 * hair under it who grew 0.3 was judged a hundred times ahead (the completeness critic of 2026-10-12, measured).
 */
export const ROOM_LEAST = 0.02;

export function termGrowth(person: Person): { growth: number; classGrowth: number; grewTooLittle: boolean; pace: 'ahead of' | 'in line with' | 'behind' } {
  const school = person.school!;
  const t = school.tally;
  const roomLeft = (start: number, ceiling: number) => Math.max(0, 1 - start / ceiling) ** 1.5;
  const room = (start: number, ceiling: number) => Math.max(ROOM_LEAST, roomLeft(start, ceiling));
  const growth = meanCraft(person.craft!) - meanCraft(t.craftAtStart);
  const gains = school.classmates.map((m, i) => meanCraft(m.craft) - (t.classAtStart[i] ?? meanCraft(m.craft))).sort((a, b) => a - b);
  const classGrowth = gains[Math.floor(gains.length / 2)] ?? 0;
  const paced = growth / room(meanCraft(t.craftAtStart), person.craftCeiling ? meanCraft(person.craftCeiling) : 100);
  const classPaced = school.classmates.map((m, i) => { const start = t.classAtStart[i] ?? meanCraft(m.craft); return (meanCraft(m.craft) - start) / room(start, m.ceiling ? meanCraft(m.ceiling) : 100); }).sort((a, b) => a - b);
  const classPace = classPaced[Math.floor(classPaced.length / 2)] ?? 0;
  // At the reach: nothing left to grow isn't growing too little.
  const atReach = roomLeft(meanCraft(t.craftAtStart), person.craftCeiling ? meanCraft(person.craftCeiling) : 100) < ROOM_LEAST;
  const grewTooLittle = !atReach && paced < ESTIMATE.growthFloor * classPace;
  const pace = classPace <= 0 || atReach ? 'in line with' : paced >= 1.1 * classPace ? 'ahead of' : grewTooLittle ? 'behind' : 'in line with';
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
/** The standing a term found short steps down to, as `evaluate` steps it: concern, warning, dismissal. */
export const stepDown = (standing: Standing): Standing => (standing === 'good' ? 'concern' : standing === 'concern' ? 'warning' : 'dismissed');

/**
 * What the term's review would do to a student's standing if it found the term short, in words, as `evaluate` steps it
 * (from 2026-10-17, brief 14): the coursework warning names it. Until then the warning said “your standing falls a step”.
 */
export function shortTermWords(school: SchoolRecord, term: number): string {
  const reviewed = school.reviews?.at(-1)?.term === term && school.reviews.at(-1)!.outcome === 'warning';
  const next = reviewed ? 'warning' : stepDown(school.standing);
  const last = academicTerm(school, term) === YALE_DRAMA.terms - 1 || school.extra?.term === term;
  if (next === 'dismissed') return 'dismiss you from the School';
  if (next === 'warning') return last ? 'not recommend your degree' : reviewed ? 'keep you on academic warning' : 'put you on academic warning';
  return 'give you a notice of academic concern';
}

export function evaluate(sim: Simulation, person: Person, term: number): TermReview | undefined {
  const school = person.school;
  if (!school || !person.craft || schoolEnded(school.standing)) return undefined;
  const t = school.tally;
  const expected = (t.classDays - t.excused) + t.calls + t.shifts;
  const attendance = expected > 0 ? (t.attended + t.answered + t.worked) / expected : 1;
  const { growth, classGrowth, grewTooLittle, pace } = termGrowth(person);
  // The term's work on stage, as the faculty see it: a run gone mostly off falls short, as poor production work does; a strong one is noted.
  // Each run once, and one played after the last evaluation with this term's (`unreviewed`). The term's Cabaret show
  // with them from 2026-10-10: until then its nights reached the record and nothing the faculty read.
  const runs = [...(school.unreviewed ?? []), school.casting, school.rep, school.cabaret as unknown as Casting | undefined].filter((c): c is Casting => c !== undefined && !c.reviewed && c.term <= term && nightsOf(c) >= ESTIMATE.workNights);
  const nights: Partial<Record<Night, number>> = {};
  for (const one of runs) for (const [b, n] of Object.entries(one.nights ?? {}) as [Night, number][]) nights[b] = (nights[b] ?? 0) + n;
  const work = runs.length ? nightsMean(nights) : undefined;
  const plays = runs.map((c) => c.play ?? c.production).join(' and ');
  for (const one of runs) one.reviewed = true;
  delete school.unreviewed;
  const workedPoorly = work !== undefined && work <= ESTIMATE.workFloor;
  // The term's coursework as shown (`ESTIMATE.coursework`).
  // Read as the warning in the term reads it (`termTally`): a piece shown again at its second band, one missed unready.
  const tally = termTally((school as SchoolRecord & { coursework?: { assignments: Assignment[] } }).coursework?.assignments ?? [], term);
  const cw = { shown: tally.shown, unready: tally.unready, strong: tally.strong };
  const counted = cw.shown >= ESTIMATE.coursework.shown;
  const unreadyWork = counted && cw.unready >= ESTIMATE.coursework.unready * cw.shown;
  const strongWork = counted && !unreadyWork && cw.strong >= ESTIMATE.coursework.strong * cw.shown;
  // A course failed this term falls short (`settleCourses`, from 2026-10-10).
  const failedNow = Object.values(school.courses ?? {}).filter((r) => r.term === term && r.result === 'fail');
  const shortOtherwise = attendance < ESTIMATE.attendanceFloor || grewTooLittle || workedPoorly || unreadyWork || failedNow.length > 0;
  // A grave breach in the term keeps it short of good standing, whatever else went well; it has already stepped the
  // standing (`breach`), so on its own it holds the term where the breach put it. Until 2026-10-12 the evaluation stepped
  // again on the same breach, and one missed performance in good standing ended in dismissal at that term's evaluation.
  const short = shortOtherwise || t.breaches > 0;
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  const onStage = work === undefined ? '' : workedPoorly ? ` Your work in ${plays} fell short of what the program asks.` : work >= 1 ? ` The faculty noted your strong work in ${plays}.` : '';
  // What held the unready ones back, and what answers it (from 2026-10-16): until then the notice gave the count alone.
  // From 2026-10-17 (`shortCause`): every part of each short, or no part short on more than one, said as that, and not a
  // part named by its tie.
  const most = shortCause(person, tally.unreadyShown);
  const why = most?.kind === 'part' ? ` What held most of them back was “${most.label}”, unfinished on ${most.n} of them. ${most.remedy.charAt(0).toUpperCase()}${most.remedy.slice(1)} works on it.` : most?.kind === 'every' ? ' Every part of each one was unfinished.' : most?.kind === 'scattered' ? ' Each was short on a different part.' : '';
  const inClass = unreadyWork ? ` ${cw.unready} of the ${cw.shown} pieces due in class were Unready or not shown. That’s short of what the program asks.${why}` : strongWork ? ` The faculty noted your coursework: ${cw.strong} of ${cw.shown} pieces were Strong or better.` : '';
  const notPassed = failedNow.length ? ` You didn’t pass ${failedNow.length === 1 ? failedNow[0]!.name : `${failedNow.slice(0, -1).map((r) => r.name).join(', ')} and ${failedNow.at(-1)!.name}`}.` : '';
  const breached = t.breaches > 0 ? ' A grave breach of professionalism this term keeps you from good standing.' : '';
  const reason = `You came to ${pct(attendance)} of the classes, calls and shifts asked of you. Your craft grew ${growth.toFixed(1)} points, and the class’s middle student’s grew ${classGrowth.toFixed(1)}. Allowing for how much room each of you had to grow, that’s ${pace} the class.${onStage}${inClass}${notPassed}${breached}`;
  const extraTerm = school.extra?.term === term;
  const last = academicTerm(school, term) === YALE_DRAMA.terms - 1 || extraTerm;
  // A faculty review this term that kept them on warning (`facultyReview`) has judged these Fails: the evaluation doesn't
  // step past it on the same Fails (from 2026-10-10).
  const reviewed = school.reviews?.at(-1)?.term === term && school.reviews.at(-1)!.outcome === 'warning';
  const stepped: Standing = reviewed ? 'warning' : !short ? 'good' : !shortOtherwise ? school.standing : stepDown(school.standing);
  const shortfall = degreeShortfall(school);
  // A last year with a course failed: a repeat offered for thirty days (`offerRepeat`, from 2026-10-10), before the degree
  // is withheld; with a warning unmet, withheld as it was.
  const repeatable = last && stepped !== 'dismissed' && stepped !== 'warning' && shortfall.failed.length > 0;
  let next: Standing = last && stepped !== 'dismissed' && (stepped === 'warning' || shortfall.failed.length > 0) && !repeatable ? 'withheld' : stepped;
  const notes = teachersNotes(person, term);
  const review: TermReview = { term, standing: next, attendance, growth, classGrowth, reason, ...(work !== undefined ? { work } : {}), ...(cw.shown ? { coursework: cw } : {}), ...(notes.length ? { notes } : {}) };
  school.history.push(review);
  // No repeat open to them (a year already repeated, nine semesters, or the failure in an earlier year): withheld.
  const offered = repeatable && offerRepeat(sim, person);
  if (repeatable && !offered) { next = 'withheld'; review.standing = next; }
  if (!short) school.castable = true;
  const withheldWhy = shortfall.failed.length ? `The degree needs every course passed, and ${shortfall.failed.map((r) => r.name).join(', ')} ${shortfall.failed.length === 1 ? 'wasn’t' : 'weren’t'}.` : 'The concern wasn’t remedied.';
  setStanding(sim, person, next, next === 'dismissed' ? `You didn’t meet the terms of your academic warning. ${reason}` : next === 'withheld' ? `${withheldWhy} ${reason}` : reason);
  // The tally starts again with the next term (`TERM_KIND`). Until 2026-09-27 it
  // started again here, and a first-year's Carlotta calls in May and the
  // summer's growth went into the next fall's attendance and growth.
  // After the sixth term in standing, the degree at Commencement on the last Monday of May, as 24 May 2027 is (SLATE's estimate for 2029).
  if (last && !schoolEnded(next) && !offered && extraTerm && termStart(term).fall) {
    // Finished in a fall: the degree at Yale's December conferral (`DEGREE_DATES`), not May's Commencement.
    const y = termStart(term).date.year;
    schedule(sim, person, at({ year: y, month: DEGREE_DATES.december[0], day: DEGREE_DATES.december[1] }, 10), { kind: CONFERRAL_KIND, label: 'December Degree Conferral', minutes: 0, requiresPlayer: false });
  } else if (last && !schoolEnded(next) && !offered) {
    const y = termStart(term).date.year;
    // Yale's Commencement is the Monday before Memorial Day, which is May's last Monday: 24 May 2027 and the published
    // 21 May 2029 (from 2026-10-10; until then the first Monday from the 25th, Memorial Day itself in 2029).
    schedule(sim, person, at(addDays(dayOnOrAfter(y, 5, 25, 1), -7), 10), { kind: COMMENCEMENT_KIND, label: 'Commencement', minutes: 180 });
  }
  return review;
}

/**
 * A degree waiting past Commencement, conferred once nothing stands in its way: an Incomplete made up, or a financial
 * hold paid (from 2026-10-10). `why` opens the notice.
 */
export function conferIfReady(sim: Simulation, person: Person, why: string): void {
  const school = person.school;
  if (!school?.awaitingDegree || schoolEnded(school.standing)) return;
  const open = degreeShortfall(school);
  if (open.failed.length || open.incomplete.length || school.hold !== undefined) return;
  delete school.awaitingDegree;
  setStanding(sim, person, 'graduated', `${why}, the faculty confer the ${YALE_DRAMA.degree} in ${YALE_DRAMA.program}, class of ${school.classOf}, without the ceremony.`);
}

/**
 * The program term taken next: on a leave under way, the one it began in, taken again on return (as `yearOfStudy` reads
 * it); otherwise the one after the term now. From 2026-10-16 a function of its own, read by `repeatRoom` and `extraLater`.
 *
 * The leave's branch was played on 2026-10-16 (tests/remaining-school.test.ts): a Permanent Incomplete run out during a
 * medical leave is the only notice that reads it on a leave, since an evaluation is called off with the leave. It decides
 * nothing a played leave reaches: `leaveLengths` grants only two-term leaves while every year of the curriculum has
 * year-long courses, and on one the other branch counts one term more (the leave's first term less the offset that
 * already holds the leave, plus one), 9 against 8 with no repeat granted and 11 against 10 with one, the same side of the
 * nine. It is kept, as a guard, for a leave of one or three terms, which the Bulletin allows (2026–27 p.158) and
 * `leaveLengths` grants for a curriculum of one-term courses: on a three-term leave the other branch counts 10 where the
 * program has 8, and offers nothing that `repeatRefusal` would grant (tests/remaining-school.test.ts, GUARD).
 */
const programNext = (school: SchoolRecord): number => {
  const away = school.leave?.status === 'on' ? school.leave : undefined;
  return away ? away.firstTerm - ((school.offset ?? 0) - (away.returnTerm - away.firstTerm)) : academicTerm(school, Math.max(0, school.termsBegun - 1)) + 1;
};

/**
 * Room in the nine semesters the Bulletin allows for a repeat of the year ending with this spring (`withRepeat`), read
 * by the Fail and Permanent Incomplete notices so they offer only what `repeatRefusal` would grant (from 2026-10-15:
 * until then a Fail in any year after a repeat was told to ask, and “Repeating would make 10 semesters” refused it).
 * Counted as the year's end will count it, with the program's terms still to be taken through that spring: at a fall's
 * evaluation the spring, and after a year's repeat is granted the year's two again (from 2026-10-15: earlier that day it
 * counted the terms enrolled so far, so a second year's fall Fail after a first year's repeat, at nine, was told to ask,
 * and the spring's end made ten; found by tests/scope-school.test.ts). After any repeat granted, none more fits: the
 * terms enrolled are the program's taken plus two for each repeat, so the count is eight and two more for each.
 */
const repeatRoom = (person: Person, spring: number): boolean => {
  const school = person.school;
  if (!school) return false;
  return withRepeat(school, spring) + Math.max(0, spring + 1 - programNext(school)) <= EXTENDED_STUDY.maxSemesters;
};

/**
 * Whether an additional term after the last year's evaluation is still to be had, for a Fail or a Permanent Incomplete
 * whose year can't be repeated (from 2026-10-16, the owner's brief's “no dead-end warning”): until then their notices
 * said only that the degree needs every course passed, though `offerRepeat` offers that term at the last year's end
 * wherever the evaluation leaves the student short of warning and dismissal. Still ahead: no last year's thirty days,
 * no degree waiting, no additional term already, and the last program term not yet evaluated; and within the nine
 * semesters with the program's terms still to come (`programNext`) and the term itself, as `extraRefusal` will count it.
 */
const extraLater = (person: Person): boolean => {
  const school = person.school;
  if (!school || schoolEnded(school.standing) || school.repeatBy !== undefined || school.awaitingDegree || school.extra || school.extraRequest?.status === 'pending') return false;
  const t = Math.max(0, school.termsBegun - 1);
  const last = academicTerm(school, t) >= YALE_DRAMA.terms - 1 && school.leave?.status !== 'on';
  if (last && school.history.some((h) => h.term === t)) return false;
  return enrolledTerms(school).length + Math.max(0, YALE_DRAMA.terms - programNext(school)) + 1 <= EXTENDED_STUDY.maxSemesters;
};

export function registerSchool(sim: Simulation): void {
  // An Incomplete made up, or run out: a degree waiting past Commencement is conferred, or withheld (from 2026-10-10).
  registerCourseRecord(sim, (s, person) => conferIfReady(s, person, 'Your last Incomplete made up'), (s, person, r) => {
    const school = person.school!;
    if (school.awaitingDegree && !schoolEnded(school.standing)) {
      delete school.awaitingDegree;
      setStanding(s, person, 'withheld', `${r.name} wasn’t made up in its month, and the degree needs every course passed.`);
    }
  }, repeatRoom, extraLater);
  const personOf = (item: { payload: Record<string, unknown> }) => sim.universe.people[String(item.payload.personId)];

  sim.onSchedule(TERM_KIND, (item, s) => {
    const person = personOf(item);
    const school = person?.school;
    const term = Number(item.payload.term);
    if (!person || !school || schoolEnded(school.standing)) return;
    // A first class goes on through its own terms, whatever the student's are (`followFormerClasses`).
    followFormerClasses(s, person, term);
    // A leave granted for this term begins with it; one under way ends at its return term, with notice given
    // (`systems/leave.ts`, from 2026-10-10). A term already begun isn't begun again.
    if (school.leave?.status === 'granted' && school.leave.firstTerm === term) { school.termsBegun = Math.max(school.termsBegun, term + 1); startLeave(s, person, false); return; }
    if (school.leave?.status === 'on') {
      if (school.leave.returnTerm !== term || school.leave.noticeAt === undefined) return;
      returnFromLeave(s, person);
    }
    if (school.termsBegun > term && (school.enrolled ?? []).includes(term)) return;
    // A year behind now (a leave, a repeated year): on with the class at this stage (`joinCohort`, from 2026-10-10).
    if (school.joinsCohort) { joinCohort(s, person, term); delete school.joinsCohort; }
    const academic = academicTerm(school, term);
    school.termsBegun = term + 1;
    school.enrolled = [...enrolledTerms(school).filter((x) => x < term), term];
    // Past the six terms the tuition scholarship supports, no aid: tuition and the health fee billed (`EXTENDED_STUDY`).
    // Living aid past six terms where the aid review keeps it (`AidReview.living`), as tuition support where it grants
    // an exception: `termSupport`, which Terms And Award reads too.
    const { unsupported, need } = termSupport(person, school.enrolled.length);
    if (term > 0) {
      // The ending term's calls kept for life before its tally starts again (`callsBefore`, from 2026-10-12).
      const before = school.callsBefore ?? { calls: 0, answered: 0 };
      school.callsBefore = { calls: before.calls + school.tally.calls, answered: before.answered + school.tally.answered };
      school.tally = freshTally(person, school);
    }
    // A new year's hours from the second fall; the first's began at enrollment, and resetting them
    // here lost an elective shift asked for before the first term's morning.
    if (term > 0 && termStart(term).fall) school.workStudy = { electiveHours: 0, owedHours: school.workStudy.owedHours };
    const cur = saveCurrency(s.universe);
    const account = termAccount(cur, need, term);
    // Paid where their payments are paid (`payeeAccount`, from 2026-10-10: until then into whichever account was primary).
    const current = payeeAccount(s, person);
    const paid = need && current && !current.closedAt ? current : undefined;
    // A nonresident alien's taxable scholarship has 14% withheld at source, reported on Form 1042-S (IRC 1441(b);
    // research-student-status.json), from 2026-10-10: until then nothing was, and the 1040-NR found it all owed.
    const year = zonedParts(item.at, zone()).year;
    const withheld = paid && nonresidentFor(person, year) ? Math.min(account.refund, Math.round(NONRESIDENT_SCHOLARSHIP_RATE * account.taxable)) : 0;
    // This term's charges first, then the aid on what the Yale account owes before any is paid out (`aidOnAccount`), then
    // the hold's registration. From 2026-10-16: until then the aid was paid out first, whatever the account owed, the
    // term billed after it, and a hold the aid would have cleared stopped registration.
    if (unsupported) billUnsupportedTerm(s, person, term, need, paid ? account.refund - withheld : 0);
    const applied = paid ? aidOnAccount(s, person, account.refund - withheld) : 0;
    if (paid) {
      s.post({
        memo: `Living-expense scholarship, ${termWords(term)}: ${YALE_DRAMA.name}`,
        category: 'scholarship',
        postings: [...(account.refund - withheld - applied ? [{ accountId: paid.id, amount: account.refund - withheld - applied }] : []), ...(applied ? [{ accountId: yaleAccount(s, person)!.id, amount: applied }] : []), { accountId: s.nominalAccount('income', 'Scholarship').id, amount: -account.refund }, ...(withheld ? [{ accountId: s.nominalAccount('expense', 'Tax Withheld').id, amount: withheld }] : [])],
      });
      recordScholarship(person, item.at, zone(), account.taxable);
      // Form 1042-S's withholding is the IRS's.
      if (withheld) { yearOf(person, year).withheld += withheld; addWithheld(yearOf(person, year), withheld); }
    }
    if (applied) liftHold(s, person, `This term’s living-expense scholarship paid the ${formatMoney(applied, cur)} it owed.`);
    // A hold on the Yale account at a term's start: registration again once it's paid (Bulletin p.184).
    if (school.hold !== undefined) school.mustRegister = true;
    let planPaid = true;
    if (!unsupported && !need) {
      // No need found: the health plan is billed to the Yale account and paid from the bank. Where the bank can’t pay it
      // (its money moved to savings not linked to checking, say), it’s owed, as a bill the bank can’t pay is (`owe`), and
      // paid back the first day there’s money (`settleArrears`, `systems/spending.ts`). Until 2026-10-13 it was dropped:
      // nothing posted, nothing owed, and the notice said it was paid (found by that day’s evidence pass).
      planPaid = payFromCurrent(s, person, account.healthPlan, `Yale Health plan, ${termWords(term)}`, 'school');
      if (!planPaid) owe(s, person, account.healthPlan, `Yale Health plan, ${termWords(term)}`, 'school');
    }
    if (person.id === s.universe.playerId && !unsupported) {
      s.notify({
        category: 'school', title: `${termLabel(term)} Begins`,
        body: need
          // What reached the account, less what was withheld for the IRS and what the Yale account took (from 2026-10-16:
          // until then the whole refund, so an F-1 student was told $13,318.50 was in her account where $11,356.54 was).
          ? `Your living-expense scholarship of ${formatMoney(account.livingScholarship, cur)} met this term’s Yale Health plan, ${formatMoney(account.healthPlan, cur)}, ${!applied ? `and ${formatMoney(account.refund - withheld, cur)} is` : account.refund - withheld - applied > 0 ? `and the ${formatMoney(applied, cur)} your Yale account owed; ${formatMoney(account.refund - withheld - applied, cur)} is` : `and ${formatMoney(applied, cur)} of what your Yale account owed${accountOwed(s, person) > 0 ? `, which still owes ${formatMoney(accountOwed(s, person), cur)}` : ''}; none of it is`} in your ${current?.name ?? 'account'}${withheld ? `, after ${formatMoney(withheld, cur)} withheld for the IRS` : ''}. Tuition, ${formatMoney(account.tuition, cur)} a term, is covered by the tuition scholarship.`
          : `Tuition, ${formatMoney(account.tuition, cur)} a term, is covered by the tuition scholarship. Yale’s aid for living costs goes by need, and none was found, so this term’s Yale Health plan, ${formatMoney(account.healthPlan, cur)}, ${planPaid ? 'was paid from your bank, and living costs are yours.' : 'and living costs are yours. Your bank couldn’t cover the plan: it’s owed, and comes out of your bank the first day there’s money for it.'}`,
        importance: 55, route: '/workspace/school',
      });
    }
    // An additional term has its retakes and its evaluation, nothing of a year's (`school.extra`, from 2026-10-10).
    if (school.extra?.term === term) {
      // Planned here only where the weekly planning isn't still running, which plans the term's weeks with it (from
      // 2026-10-13: until then a second weekly planning was put beside the first, and every class day was held twice;
      // found by that day's evidence pass).
      if (!s.universe.scheduled.some((i) => i.status === 'pending' && i.kind === WEEK_KIND && i.payload.personId === person.id)) planWeek(s, person, s.now);
      schedule(s, person, at(classPeriod(term).to, 17), { kind: EVALUATION_KIND, label: `Term Review, ${termLabel(term)}`, minutes: 0, payload: { term }, requiresPlayer: false });
      return;
    }
    // A first or second year's spring ends in a summer that's theirs. Until 2026-10-09 its first Monday began the business's week (`systems/career.ts`).
    if (!termStart(term).fall && yearOfTerm(academic) < 3) schedule(s, person, at(recessStart(term), 9), { kind: RECESS_KIND, label: 'Summer Recess', minutes: 0, requiresPlayer: false });
    scheduleLabs(s, person, term);
    if (academic >= 1) cast(s, person, term);
    else { if (school.around?.term !== term) school.around = { term, list: [] }; classCabaret(s, person, term, new Map()); }
    // The last spring ended in the Actor Showcase for the agents until the career went on 2026-10-09. The degree's
    // filmed monologues were marked posted at its end (`school.filmed`), footage for a reel, until 2026-10-10: with the
    // career gone nothing cut a reel, and the mark went.
    schedule(s, person, at(classPeriod(term).to, 17), { kind: EVALUATION_KIND, label: `Term Review, ${termLabel(term)}`, minutes: 0, payload: { term }, requiresPlayer: false });
    if (academic + 1 < YALE_DRAMA.terms) s.schedule({ at: Math.max(at(termStart(term + 1).date, 9), s.now + 60_000), kind: TERM_KIND, label: termBegins(term + 1), category: 'school', priority: 30, payload: { personId: person.id, term: term + 1 } });
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
    const courses = coursesFor(school, day);
    school.tally.classDays += 1;
    // The classmates, in class most days.
    const inClass = classmatesIn(s, person, keyOf(day));
    school.classmates.forEach((mate, i) => {
      if (!inClass[i]) return;
      const focus = ESTIMATE.classmateFocus * (mate.drive ?? 1);
      for (const course of courses) {
        for (const skill of course.skills) grow(mate.craft, skill, focus);
        // Their abilities beside the craft (from 2026-10-10), by the same rule as the player's (`CLASS_ABILITY_SHARE`).
        for (const ability of classAbilities(course.skills)) growMateAbility(s, person, i, ability as keyof MateAbilities, focus, CLASS_ABILITY_SHARE);
      }
    });
    // Each course's work: due there, shown once (or moved on, excused), and what that makes of the meeting's growth in
    // place of an ordinary meeting's; then the course's next work set (`systems/coursework.ts`, from 2026-10-07).
    const meet = (here: boolean, excused: boolean) => courses.map((course) => {
      // The course's own record, for its pass (`noteMeeting`, from 2026-10-10).
      noteMeeting(school, termOf(day), course.code, course.name, here ? 'attended' : excused ? 'excused' : 'missed');
      const weight = meetingWeight(s, person, course.code, day, item.at, here, excused);
      setWork(s, person, course.code, day);
      // In class, a partner may ask for an evening (`partnerAsks`, from 2026-10-07).
      if (here) partnerAsks(s, person, course.code, day);
      return weight;
    });
    // Called in sick, kept home and excused, however well they could have gone (from 2026-10-06; until then a sick day
    // counted only for someone absent anyway, and a student who called in was counted in class).
    if (school.sickDay === keyOf(day)) { meet(false, true); item.status = 'missed'; school.tally.excused += 1; considerWelfare(s, person); return; }
    // Not registered, classes don't count them: an absence, unexcused (from 2026-10-10, `registered`).
    if (!registered(school, courseworkOf(s, person))) {
      meet(false, false);
      item.status = 'missed';
      // Under a financial hold, which stops registration (`school.reregister`), the hold is the step first (from 2026-10-16:
      // until then this said to register, which the hold refused, every class day of a term the hold had begun; played,
      // tests/remaining-school.test.ts, a term's nine courses failed at none of their meetings and the faculty dismissed).
      const held = school.hold !== undefined ? ` A financial hold stops registration: ${formatMoney(accountOwed(s, person), saveCurrency(s.universe))} is owed on your Yale account. Pay it on the Terms And Award tab, then register on the Standing tab.` : ' Register on the School screen. Registering late takes the chair’s written permission, which the game assumes you have.';
      if (person.id === s.universe.playerId) s.notify({ category: 'school', title: 'Not Registered', body: `You haven’t registered, so today’s classes didn’t count your attendance.${held}`, importance: 75, route: '/workspace/school' });
      return;
    }
    if (present(person, item.at)) {
      school.tally.attended += 1;
      const focus = focusAt(s, person, item.at);
      const weights = meet(true, false);
      courses.forEach((course, i) => {
        // Kept on the development history, by the class (from 2026-10-09); through `ordinary` from 2026-10-16, so a class
        // reads discipline and halves the same growth again the same day as every other growth does.
        for (const skill of course.skills) ordinary(s, person, skill, focus, weights[i]!, `class:${course.code}`);
        for (const ability of classAbilities(course.skills)) ordinary(s, person, ability, focus, weights[i]! * CLASS_ABILITY_SHARE, `class:${course.code}`);
        // A class that trains the body as hard as a workout counts as one (`classTrains`, from 2026-10-16).
        classTrains(s, person, course.code, termStart(termOf(day)).fall ? 'fall' : 'spring');
      });
      // The class, met in the room if not before.
      for (const mate of school.classmates) mateRecord(mate).met ??= item.at;
      // And maybe one of them brings something (`systems/classmates.ts`, from 2026-10-08).
      momentInClass(s, person, item.at);
      tire(person, ESTIMATE.energy.classes);
      return;
    }
    item.status = 'missed';
    // A day in hospital is excused, as a sick day called in is.
    meet(false, offSick(person, item.at));
    if (offSick(person, item.at)) { school.tally.excused += 1; considerWelfare(s, person); return; }
    if (person.id === s.universe.playerId) s.notify({ category: 'school', title: 'You Missed Classes', body: `${courses.map((one) => one.name).join(', ')}: an unexcused absence. The faculty count it at the term review.`, importance: 65, route: '/workspace/school' });
  });

  sim.onCommand<Record<string, never>, { cost: Money }>('school.buy_ppe', (_p, { sim: s }) => {
    const person = s.player;
    const no = ppeRefusal(person);
    if (no) throw new CommandError(no);
    if (!buyPpe(s, person)) throw new CommandError(`Your bank can’t cover ${formatMoney(ppeCost(s), saveCurrency(s.universe))}, so nothing was charged.`);
    return { cost: person.school!.ppe!.cost };
  });

  sim.onSchedule(SHIFT_KIND, (item, s) => {
    const person = personOf(item);
    const school = person?.school;
    if (!person || !school) return;
    const hours = Number(item.payload.hours);
    const elective = item.payload.elective === true;
    // A shift in hospital isn't one they were there to be asked for.
    // A day called in sick excuses it too (from 2026-10-10: until then only a hospital stay or a lay-up did).
    if (offSick(person, item.at) || school.sickDay === dayKeyAt(item.at)) {
      item.status = 'missed';
      if (elective) school.workStudy.electiveHours -= hours;
      // An assigned shift missed ill or hurt is hours that can be converted to grant aid (Bulletin p.189, from 2026-10-10).
      else { const key = yearKeyOf(termOf(parseKey(dayKeyAt(item.at)))); (school.excusedHours ??= {})[key] = (school.excusedHours[key] ?? 0) + hours; }
      return;
    }
    // Over Yale's weekly cap on the day, with what's worked already: worked to the cap, the rest not (from 2026-10-10).
    const room = weekCap(item.at) - weekHours(s, person, item.at, item.id, item.at);
    if (room <= 0) { item.status = 'missed'; if (elective) school.workStudy.electiveHours -= hours; if (person.id === s.universe.playerId) s.notify({ category: 'school', title: 'A Shift Over The Weekly Cap', body: `Yale caps a student’s hours at ${weekCap(item.at)} a week across all its jobs, and you’ve worked this week’s. The shift is off, and it isn’t held against you.`, importance: 55, route: '/workspace/school' }); return; }
    if (!elective) school.tally.shifts += 1;
    // Not registered, the I-9 isn't done and the shift can't be worked: missed, and not excused (the Bulletin's hours lost
    // to "delay of I-9 completion" can't be converted), from 2026-10-10.
    if (!registered(school, courseworkOf(s, person))) {
      item.status = 'missed';
      if (elective) school.workStudy.electiveHours -= hours;
      if (person.id === s.universe.playerId) s.notify({ category: 'school', title: 'A Shift You Couldn’t Work', body: 'Work-study starts with registration, when the I-9 is done. Register on the School screen.', importance: 60, route: '/workspace/school' });
      return;
    }
    // The crew's Saturday needs the protective equipment: bought there if not before, through the bank; the bank short of
    // it, the supervisor sends them home and the shift is missed (`REQUIRED_PPE`, from 2026-10-08).
    if (!elective && present(person, item.at) && !school.ppe && !buyPpe(s, person)) {
      item.status = 'missed';
      if (person.id === s.universe.playerId) s.notify({ category: 'school', title: 'Sent Home From Work-Study', body: `The shift needs the required protective equipment, ${formatMoney(ppeCost(s), saveCurrency(s.universe))}, and your bank couldn’t cover it. The shift counts as missed. Buy it on the School’s Shifts And Pay tab once you can.`, importance: 70, route: '/workspace/school' });
      return;
    }
    if (present(person, item.at)) {
      if (!elective) school.tally.worked += 1;
      const worked = Math.min(hours, room);
      school.workStudy.owedHours += worked;
      // Kept on the shift, for the week of a claim it was worked in (`workDoneIn`, from 2026-10-13).
      item.payload.worked = worked;
      // The work's own risk to the body, by the hour: the crew's in the shops, front of house a floor's (BLS; from
      // 2026-10-10). Hurt at it, it's work, and workers' compensation's (`mayHurt`). A chance, never a certainty.
      // The week's wage: this shift and the week's worked before it (from 2026-10-13: until then this shift's alone, half
      // a week of two shifts); work-study bears no FICA, a student's at their own school (found by the review of that day).
      const wage = Math.round((weekHours(s, person, item.at, item.id, item.at) + worked) * hourlyIn(saveCurrency(s.universe)));
      mayHurt(s, person, elective ? 'usher' : 'crew', chanceOver(elective ? INJURY.perThousandHours.usher : INJURY.perThousandHours.crew, worked), item.at, { cityId: YALE_DRAMA.cityId, weeklyWage: wage, noFica: true });
      bookPayday(s, person, item.at);
      tire(person, ESTIMATE.energy.shift);
      return;
    }
    item.status = 'missed';
    // An elective evening not worked frees its hours to be asked for again.
    if (elective) school.workStudy.electiveHours -= hours;
    if (person.id === s.universe.playerId) s.notify({ category: 'school', title: 'You Missed A Work-Study Shift', body: 'Unworked hours aren’t paid, and a missed assigned shift counts against your attendance at the term review.', importance: 60, route: '/workspace/school' });
  });

  /**
   * Hours converted to grant-in-aid, on a request of the student's (Bulletin p.189, from 2026-10-10): processed in January
   * and May, at the work-study rate, up to 150 a year. It's a scholarship for living costs, so taxable, and a nonresident's
   * withheld at 14% as the living scholarship is (SLATE's reading: the Bulletin names it grant-in-aid).
   */
  sim.onCommand<Record<string, never>, { at: Instant; hours: number }>('school.request_conversion', (_p, { sim: s }) => {
    const person = s.player;
    const no = conversionRefusal(s, person);
    if (no) throw new CommandError(no);
    const school = person.school!;
    const term = Math.max(0, school.termsBegun - 1);
    const when = nextConversion(s.now);
    s.schedule({ at: when, kind: CONVERT_KIND, label: 'Work-Study Hours Converted To Grant Aid', category: 'school', priority: 33, payload: { personId: person.id, year: yearKeyOf(term) } });
    return { at: when, hours: convertibleHours(person, yearKeyOf(term), unassignedKnown(s.now)) };
  });

  sim.onSchedule(CONVERT_KIND, (item, s) => {
    const person = personOf(item);
    const school = person?.school;
    if (!person || !school || !hasNeed(person)) return;
    const key = String(item.payload.year);
    const hours = convertibleHours(person, key, countsUnassigned(item.at));
    // Said, where the processing finds nothing (from 2026-10-13: until then it passed in silence).
    if (hours <= 0) {
      if (person.id === s.universe.playerId) s.notify({ category: 'school', title: 'No Hours To Convert', body: 'The aid office processed your request and found no work-study hours to convert: none missed ill or hurt, and none never assigned.', importance: 50, route: '/workspace/school' });
      return;
    }
    const cur = saveCurrency(s.universe);
    const grant = Math.round(hours * hourlyIn(cur));
    const year = zonedParts(item.at, zone()).year;
    const withheld = nonresidentFor(person, year) ? Math.round(NONRESIDENT_SCHOLARSHIP_RATE * grant) : 0;
    const into = payeeAccount(s, person);
    s.post({ memo: `Grant-in-aid: ${hours} work-study hours converted, ${YALE_DRAMA.name}`, category: 'scholarship', postings: [{ accountId: into.id, amount: grant - withheld }, { accountId: s.nominalAccount('income', 'Scholarship').id, amount: -grant }, ...(withheld ? [{ accountId: s.nominalAccount('expense', 'Tax Withheld').id, amount: withheld }] : [])] });
    recordScholarship(person, item.at, zone(), grant);
    if (withheld) { yearOf(person, year).withheld += withheld; addWithheld(yearOf(person, year), withheld); }
    (school.convertedHours ??= {})[key] = (school.convertedHours[key] ?? 0) + hours;
    if (person.id === s.universe.playerId) s.notify({ category: 'school', title: 'Hours Converted To Grant Aid', body: `${hours} work-study hours you couldn’t work became ${formatMoney(grant, cur)} of grant aid, paid into your ${into.name}${withheld ? `, ${formatMoney(withheld, cur)} withheld for tax` : ''}. It’s a scholarship for living costs, which the US taxes.`, importance: 60, route: '/workspace/school' });
  });

  sim.onSchedule(PAYDAY_KIND, (item, s) => {
    const person = personOf(item);
    const school = person?.school;
    if (!person || !school || school.workStudy.owedHours <= 0) return;
    // Yale's payroll, whose change of direct deposit takes a pay cycle (`PAYER_LEAD`, from 2026-10-10).
    const current = payeeAccount(s, person, 'yale-payroll');
    const cur = saveCurrency(s.universe);
    const pay = Math.round(school.workStudy.owedHours * hourlyIn(cur));
    // Paid by direct deposit through Yale's payroll, so a bank counts it as wages. A student's pay
    // is exempt from FICA, and at these hours no federal tax is withheld.
    s.post({ memo: `Work-study wages, ${school.workStudy.owedHours} hours: ${YALE_DRAMA.name}`, category: 'salary', postings: [{ accountId: current.id, amount: pay }, { accountId: s.nominalAccount('income', 'Wages').id, amount: -pay }] });
    // Income for the year's return (`systems/earnings.ts`).
    recordWages(person, item.at, zone(), { gross: pay, workStudy: true });
    school.workStudy.owedHours = 0;
  });

  /**
   * A night played: its reading, what it does, and on the last, the director's note. From 2026-10-16 (brief 10) it returns
   * the energy the night costs too, from its own workload (`energyOfNight`), which the call takes once after the night's
   * growth, where 10 was taken flat until then.
   */
  const reckonNight = (s: Simulation, person: Person, casting: Run, item: { at: Instant; payload: Record<string, unknown> }, rep: boolean): { night: Night; energy: number } => {
    const n = ESTIMATE.nights;
    // An understudy plays the part they cover, which at the Rep is a lead.
    const evaluation = nightEvaluation(s, person, `${casting.production}-${item.at}`, casting, item.at, casting.size ?? 'lead', rep ? 'rep' : 'school');
    const night = nightBand(evaluation.overall);
    recordWork(s, person, evaluation, { at: item.at, what: casting.play ?? casting.production, band: night });
    // How much of themselves they brought (`LastWork.delivery`): each dimension's preparation and the day's condition
    // (`DimensionResult.day`), averaged. From 2026-10-12 the day's alone: until then the condition read with it the
    // stamina's drain, which the fit already reads, and a slip's shake, which the night's draw brings, so a night held
    // to the last movement read as less delivered by a stamina under full or a chance slip.
    const d = (casting as Run & { delivered?: { sum: number; n: number } }).delivered ??= { sum: 0, n: 0 };
    const tonight = evaluation.dimensions.reduce((a, x) => a + x.prepared * x.day, 0) / Math.max(1, evaluation.dimensions.length);
    d.sum += tonight;
    d.n += 1;
    // And in the record of runs the next casting reads, whatever kind of run (`noteRun`, from 2026-10-10).
    if (person.school) noteRun(person.school, casting, rep, item.at, { delivery: tonight, quality: evaluation.overall });
    // A house answered night after night: listening grows by it (`content/abilities.ts`), and the play's kinds are
    // practiced, one night's worth shared among them (`practiceGenres`).
    ordinary(s, person, 'listening', focusAt(s, person, item.at), 0.5, 'night');
    practiceGenres(s, person, genresOfPlay(casting.play) ?? []);
    (casting.nights ??= {})[night] = (casting.nights[night] ?? 0) + 1;
    // The night together (from 2026-10-12, `systems/ensemble.ts`): your own night is the band and the record; how the
    // show went as a whole, with the company, is the mood it leaves you in.
    const together = nightTogether(s, person, casting, evaluation);
    const proc = hasProcess(casting) ? casting.process : undefined;
    if (together && proc) {
      const t = (proc.together ??= { sum: 0, n: 0, slips: 0, covered: 0 });
      t.sum = Math.round((t.sum + together.overall) * 10) / 10;
      t.n += 1;
      if (together.slip) { t.slips += 1; if (together.slip.covered >= 0.5) t.covered += 1; }
    }
    if (together) countTogether(person, together);
    const felt = together ? nightBand(together.overall) : night;
    const w = person.wellbeing;
    if (felt === 'off') w.morale = Math.max(0, w.morale - n.sting);
    else if (felt !== 'solid') w.morale = Math.min(100, w.morale + n.lift);
    if (night === 'remarkable') {
      nudge(s, person, 'presence', n.presence, true, 'night');
    }
    // The night's material met and shown, as coursework's and a brief's are (from 2026-10-12: until then a night of
    // Woyzeck added nothing to the record of material met, and its way of playing nothing to the ways shown).
    noteMaterial(person, { ...(materialOf(casting.play) ? { material: materialOf(casting.play)! } : {}), at: item.at, overall: evaluation.overall, approaches: hasProcess(casting) ? sidesOf(casting.process.playing) : [], shown: true });
    if (item.payload.last === true) closeRun(s, person, casting, item.at);
    // A classmate in the cast asked you out after it from 2026-10-08 (`celebrate`), until the people they are and the
    // restaurants went in the scope reset of 2026-10-09.
    return { night, energy: energyOfNight(evaluation) };
  };

  /**
   * A run closed, once, when its last night passes, played or not (from 2026-10-12: until then only a closing night
   * played reached it, and a run whose closing night was missed in hospital never had its milestone, its note or its
   * look back, and its open notes never reached class). The milestone where any night was played; the director's note
   * from the nights, with what held the run's nights back most where something did (until then the play's weakest raw
   * craft skill, named even at mastery and whatever the nights showed); and the process looked back on.
   */
  const closeRun = (s: Simulation, person: Person, casting: Run, at: Instant): void => {
    const done = casting as Run & { closed?: Instant };
    if (done.closed !== undefined) return;
    done.closed = at;
    // An understudy never sent on played no night of the run: the run-through for the director, judged as a night, isn’t
    // one, and makes no milestone or director’s note of its own (from 2026-10-14, when an understudy’s run first closed).
    const wentOn = casting.kind !== 'understudy' || ((casting as Partial<Casting>).performed ?? 0) > 0;
    const runNights = wentOn ? (person.work ?? []).filter((w) => w.task === 'performance' && w.what === (casting.play ?? casting.production) && w.at > at - 120 * MS_DAY) : [];
    if (runNights.length) milestone(person, { at, kind: 'run', what: `${casting.role}, ${casting.play ?? casting.production}`, overall: Math.round(runNights.reduce((a, w) => a + w.overall, 0) / runNights.length * 10) / 10, detail: Object.entries(casting.nights ?? {}).map(([b, n]) => `${n} ${b}`).join(', ') });
    // What held the nights back most, ability or technique, by what it cost the whole.
    const held = new Map<string, { label: string; whole: number }>();
    for (const w of runNights) for (const l of w.limits) if (l.kind === 'ability' || l.kind === 'technique') { const h = held.get(l.what) ?? { label: l.label, whole: 0 }; h.whole += l.whole ?? l.by / 4; held.set(l.what, h); }
    const top = [...held.values()].sort((a, b) => b.whole - a.whole)[0];
    const workOn = top && top.whole / Math.max(1, runNights.length) >= 0.5 ? ` Work on your ${top.label.toLowerCase()}: it held your nights back most.` : '';
    // An understudy who never went on missed no night, and the note says so.
    casting.note = runNights.length ? `${directorsNote(nightsMean(casting.nights ?? {}))}${workOn}`
      : !wentOn ?`You covered ${casting.role} on call through the run and didn’t go on. The work you did in the room isn’t lost.`
        : `The run went on without you: the nights you missed are in the record, and the work you did in the room isn’t lost.`;
    if (person.id === s.universe.playerId) s.notify({ category: 'school', title: `The Director’s Note: ${casting.play ?? casting.production}`, body: casting.note, importance: 70, route: '/workspace/school' });
    // And the process looked back on, its open notes carried into class (`reflect`, from 2026-10-08).
    reflect(s, person, casting, casting.play ?? casting.production);
  };

  // A production's run over: the classmates in it grew by its rehearsals and nights, as the player does by theirs.
  sim.onSchedule(COMPANY_KIND, (item, s) => {
    const person = personOf(item);
    const school = person?.school;
    if (!person || !school) return;
    const reads = (item.payload.reads as Partial<Craft> | undefined) ?? COMPANY_READ;
    // A run of a class the student has left (`leaveClassBehind`, from 2026-10-11): played into that class's record.
    const left = item.payload.classOf === undefined ? undefined : school.formerClasses?.find((c) => c.classOf === item.payload.classOf);
    if (left) { formerCompanyRun(s, person, left, item); return; }
    for (const i of item.payload.mates as number[]) {
      const m = school.classmates[i];
      if (!m) continue;
      const f = ESTIMATE.classmateFocus * (m.drive ?? 1) * ESTIMATE.classmateAttendance;
      for (let n = 0; n < Number(item.payload.rehearsals); n += 1) rehearse(m.craft, f);
      for (let n = 0; n < Number(item.payload.performances); n += 1) playNight(m.craft, reads, f);
      classmateRun(s, person, i, reads, String(item.payload.production ?? item.label), Number(item.payload.performances), item.at);
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
    if (offSick(person, item.at) || school.sickDay === dayKeyAt(item.at)) {
      item.status = 'missed';
      // The blocking set without them is still a gap in the book to catch up (from 2026-10-10: until then an excused
      // call left none, and `school.review_blocking` refused, where an unexcused one could be caught up).
      if (call === 'rehearsal') callMissed(casting, (item.payload.stage as Stage | undefined) ?? 'work', Number(item.payload.of ?? 0));
      if (call === 'performance' && item.payload.last === true) closeRun(s, person, casting, item.at);
      // An understudy’s last night on call closes the run at its curtain, as a last performance does (from 2026-10-14).
      if (call === 'oncall' && item.payload.last === true) closeRun(s, person, casting, Number(item.payload.perfAt));
      return;
    }
    if (call === 'oncall' && item.payload.check === true) {
      // At five: most nights they aren't needed, and the evening is theirs.
      const curtain = Number(item.payload.perfAt);
      const last = item.payload.last === true;
      if (!goesOn(s, person, curtain)) { item.status = 'cancelled'; if (last) closeRun(s, person, casting, curtain); return; }
      if (person.currentLocationId !== YALE_DRAMA.cityId) {
        school.tally.calls += 1;
        breach(s, person, `weren’t in New Haven when called to go on as ${casting.role}`);
        if (last) closeRun(s, person, casting, curtain);
        return;
      }
      // Sent on: the night’s performance is theirs, on the calendar from now, with three hours’ notice, and on the last
      // night it closes the run when played or missed.
      schedule(s, person, curtain, { kind: CALL_KIND, label: `${casting.production}: You’re On As ${casting.role}`, minutes: holdOf(casting), payload: { call: 'performance', which: 'rep', wentOn: true, ...(last ? { last: true } : {}) } });
      if (person.id === s.universe.playerId) s.notify({ category: 'school', title: `You’re On Tonight As ${casting.role}`, body: `The role’s actor is out: you go on in Yale Rep’s ${casting.production} tonight at ${formatTime(curtain, zone())}.`, importance: 95, route: '/workspace/school' });
      return;
    }
    if (call === 'runthrough') {
      // The understudies' run-through: the whole show, played once for the director.
      school.tally.calls += 1;
      if (!present(person, item.at)) {
        item.status = 'missed';
        missedCallsOut(s, person);
        return;
      }
      school.tally.answered += 1;
      // Nerves before it (`attributes.ts`): stress, and composure grown by facing them. What composure does to the night
      // itself is the evaluation's, in its consistency, from 2026-10-09; until then nerves took a share off the focus too.
      nerves(s, person, 'performance');
      // Judged as the craft stood coming in, then grown by it (from 2026-10-10: until then the night was judged after its
      // own growth).
      const { night, energy } = reckonNight(s, person, casting, item, true);
      grewFrom(s, person, `night:${casting.production}`, focusAt(s, person, item.at) * nightFactor(casting), nightWeights(castingReads(casting), 0.75));
      tire(person, energy);
      // A play of a kind they love is a better night, as a rehearsal of it is (from 2026-10-13: until then a School or
      // Rep night, its run-through and a night on call read no genre, while the creation screen and the guide said a
      // night of a play of its kind was a better day; found by the review of that day).
      enjoyWork(person, { genres: genresOfPlay(casting.play) });
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
        // Sent on: nerves (`attributes.ts`).
        nerves(s, person, 'performance');
        grewFrom(s, person, `night:${casting.production}`, focusAt(s, person, item.at), nightWeights(castingReads(casting), 0.75));
        // Not judged, as it never was: its energy is the lead's evening it covers (from 2026-10-16, brief 10).
        tire(person, energyOfNight(nightEvaluation(s, person, `oncall-${item.at}`, casting, item.at, 'lead', 'rep', true)));
        enjoyWork(person, { genres: genresOfPlay(casting.play) });
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
      // A performance's hours are the part's own on stage (from 2026-10-16, brief 10, `stageHours`): until then three, a
      // featured part in a one-act as a lead's long evening.
      const hours = call === 'performance' ? stageHours(casting, casting.size ?? 'lead') : 4;
      mayHurt(s, person, 'stage', chanceOver(INJURY.perThousandHours.stage, hours), item.at);
      exerts(person, BODY.met.acting, hours, true);
      if (call === 'performance') {
        casting.performed += 1;
        // Nerves before a house (`attributes.ts`); at the Rep the night added to reputation too, until 2026-10-09.
        nerves(s, person, 'performance');
        // Friends in the cast: a better night to be in.
        const friends = (casting.cast ?? []).filter((c) => (school.classmates.find((m) => m.name === c.name)?.bond ?? 0) >= BONDS.friend).length;
        person.wellbeing.morale = Math.max(0, Math.min(100, person.wellbeing.morale + castCompany(person, friends)));
        // The rehearsal process behind it: lines, blocking and notes taken (`nightFactor`, 1 for an actor who came to every call).
        // Judged as the craft stood coming in, then grown by it (from 2026-10-10).
        const { energy } = reckonNight(s, person, casting, item, item.payload.which === 'rep');
        grewFrom(s, person, `night:${casting.production}`, focusAt(s, person, item.at) * nightFactor(casting), nightWeights(castingReads(casting)));
        tire(person, energy);
        enjoyWork(person, { genres: genresOfPlay(casting.play) });
        if (item.payload.wentOn === true && person.id === s.universe.playerId) s.notify({ category: 'school', title: `You Went On As ${casting.role}`, body: `The role’s actor was out, and you played ${casting.role} in Yale Rep’s ${casting.production} tonight.`, importance: 90, route: '/workspace/school' });
      } else {
        const stage = (item.payload.stage as Stage | undefined) ?? 'work';
        const weight = callAnswered(s, person, casting, stage, Number(item.payload.n ?? 0), Number(item.payload.of ?? 0), castingReads(casting), item.payload.which === 'rep' ? 'rep' : 'school');
        grewFrom(s, person, `rehearsal:${casting.production}`, focusAt(s, person, item.at) * weight, REHEARSAL_WEIGHTS);
        // The dress, played through as a night would be, with no house: its reading kept, nothing counted as a performance.
        if (stage === 'dress') {
          const dress = nightOf(s, person, `${casting.production}-dress-${item.at}`, casting, item.at, casting.size ?? 'lead', item.payload.which === 'rep' ? 'rep' : 'school');
          (casting as Casting & { process?: { dress?: string } }).process!.dress = dress;
        }
        tire(person, ESTIMATE.energy.rehearsal);
        enjoyWork(person, { rehearsal: true, genres: genresOfPlay(casting.play), novel: casting.kind === 'hughes' || casting.kind === 'carlotta' });
      }
      return;
    }
    item.status = 'missed';
    if (call === 'rehearsal') callMissed(casting, (item.payload.stage as Stage | undefined) ?? 'work', Number(item.payload.of ?? 0));
    // A performance not played, and not excused: a breach, and a night delivered at nothing in the record the next
    // casting reads, as a classmate's delivery is the share of calls they keep (from 2026-10-10).
    if (call === 'performance') { noteRun(school, casting, item.payload.which === 'rep', item.at, 'missed'); breach(s, person, `missed a performance of ${casting.kind === 'project' ? 'the ' : ''}${casting.production}`); if (item.payload.last === true) closeRun(s, person, casting, item.at); return; }
    if (missedCallsOut(s, person)) return;
    if (person.id === s.universe.playerId) s.notify({ category: 'school', title: 'You Missed A Rehearsal Call', body: `${ESTIMATE.missedCallsOut === 2 ? 'Two' : ESTIMATE.missedCallsOut} missed calls in a term take you out of the casting pool.`, importance: 65, route: '/workspace/school' });
  });

  sim.onSchedule(EVALUATION_KIND, (item, s) => {
    const person = personOf(item);
    if (!person) return;
    // The term’s classes are over: work still open has no meeting left to be shown at (`systems/coursework.ts`).
    const term = Number(item.payload.term);
    lapseTerm(s, person, term);
    // Each course passed, incomplete or failed (`settleCourses`, from 2026-10-10), which the evaluation then reads.
    if (person.school && !schoolEnded(person.school.standing)) {
      const work = courseworkOf(s, person)?.assignments.filter((a) => a.term === term) ?? [];
      settleCourses(s, person, term, (code) => {
        const due = work.filter((a) => a.course === code && (a.shown || a.status === 'missed'));
        return { due: due.length, notShown: due.filter((a) => !a.shown).length };
      }, (code) => COURSES.find((c) => c.code === code)?.perWeek ?? 4);
      // The Bulletin's disqualification by Fails (p.194): the faculty "may" disqualify, so it's their review
      // (`facultyReview`, from 2026-10-10; that morning it was automatic).
      const review = facultyReview(s, person, term);
      if (review?.outcome === 'dismissed') {
        person.school.history.push({ term, standing: 'dismissed', attendance: 0, growth: 0, classGrowth: 0, reason: review.why });
        setStanding(s, person, 'dismissed', review.why);
        tellFails(s, person, term, true, (a) => repeatRoom(person, a), () => extraLater(person));
        return;
      }
      evaluate(s, person, term);
      // The Fails told after the standing they led to (`tellFails`, from 2026-10-15).
      tellFails(s, person, term, schoolEnded(person.school.standing), (a) => repeatRoom(person, a), () => extraLater(person));
      return;
    }
    evaluate(s, person, term);
  });

  sim.onSchedule(COMMENCEMENT_KIND, (item, s) => {
    const person = personOf(item);
    const school = person?.school;
    if (!person || !school || schoolEnded(school.standing)) return;
    // An Incomplete outstanding: no part in Commencement (Bulletin p.26), and the degree waits for it (from 2026-10-10).
    const open = degreeShortfall(school);
    if (open.failed.length) { setStanding(s, person, 'withheld', `The degree needs every course passed, and ${open.failed.map((r) => r.name).join(', ')} ${open.failed.length === 1 ? 'wasn’t' : 'weren’t'}.`); return; }
    // A financial hold keeps the diploma until the Yale account is paid (Bulletin p.184, from 2026-10-10). Paid on the
    // tab Your Yale Account is on (from 2026-10-12: until then the notice said the Standing tab, where it isn't).
    if (school.hold !== undefined) {
      school.awaitingDegree = true;
      if (person.id === s.universe.playerId) s.notify({ category: 'school', title: 'The Diploma Is Held', body: `${formatMoney(accountOwed(s, person), saveCurrency(s.universe))} is owed on your Yale account, and a financial hold keeps the diploma until it’s paid. Pay it on the Terms And Award tab.`, importance: 85, route: '/workspace/school' });
      if (!open.incomplete.length) return;
    }
    if (open.incomplete.length) {
      school.awaitingDegree = true;
      if (person.id === s.universe.playerId) s.notify({ category: 'school', title: 'Not At Commencement', body: `With ${open.incomplete.map((r) => r.name).join(', ')} still incomplete, you take no part in Commencement. The degree is yours once ${open.incomplete.length === 1 ? 'it’s' : 'they’re'} made up in time.`, importance: 80, route: '/workspace/school' });
      return;
    }
    setStanding(s, person, 'graduated', `You graduate from the ${YALE_DRAMA.name} with an ${YALE_DRAMA.degree} in ${YALE_DRAMA.program}, class of ${school.classOf}.`);
  });

  sim.onSchedule(CONFERRAL_KIND, (item, s) => {
    const person = personOf(item);
    const school = person?.school;
    if (!person || !school || schoolEnded(school.standing)) return;
    const open = degreeShortfall(school);
    if (open.failed.length) { setStanding(s, person, 'withheld', `The degree needs every course passed, and ${open.failed.map((r) => r.name).join(', ')} ${open.failed.length === 1 ? 'wasn’t' : 'weren’t'}.`); return; }
    if (school.hold !== undefined || open.incomplete.length) { school.awaitingDegree = true; if (person.id === s.universe.playerId) s.notify({ category: 'school', title: 'Not Conferred In December', body: school.hold !== undefined ? 'A financial hold on your Yale account keeps the degree until it’s paid.' : `${open.incomplete.map((r) => r.name).join(', ')} still incomplete: the degree waits for ${open.incomplete.length === 1 ? 'it' : 'them'}.`, importance: 85, route: '/workspace/school' }); return; }
    setStanding(s, person, 'graduated', `The ${YALE_DRAMA.degree} in ${YALE_DRAMA.program} is conferred at Yale’s December conferral, your last courses retaken in an additional term; the diploma is mailed in about ${DEGREE_DATES.mailedWeeks} weeks.`);
  });

  sim.onCommand<Record<string, never>, { week: string }>('school.cabaret', (_p, { sim: s }) => {
    const person = s.player;
    const no = cabaretRefusal(s, person);
    if (no) throw new CommandError(no);
    const school = person.school!;
    const term = school.termsBegun - 1;
    const week = cabaretWeek(s, person, term)!;
    // A new piece, made by the students, cast within the company (`companyPart`).
    school.cabaret = { term, week: keyOf(week), performed: 0, production: cabaretSeason(term), ...companyPart(s, person, NEW_PLAYS_READ) };
    const c = YALE_CABARET;
    // Each evening its stage in a new piece's week (`cabaretStages`, from 2026-10-08): read, block, work, and the
    // technical and dress at once; until then every evening was the same rehearsal.
    processOf(school.cabaret).format = 'cabaret';
    const evenings = [...cabaretEvenings(week, classPeriod(term).off)].sort((x, y) => (keyOf(x) < keyOf(y) ? -1 : 1));
    const stages = cabaretStages(evenings.length);
    evenings.forEach((d, i) => {
      schedule(s, person, at(d, c.rehearsalFrom), { kind: CABARET_KIND, label: `Yale Cabaret: ${STAGE_LABEL[stages[i]!]}`, minutes: c.rehearsalMinutes, payload: { call: 'rehearsal', stage: stages[i]!, n: i + 1, of: evenings.length } });
    });
    c.shows.forEach(([wd, hour], n) => {
      // Held for a Cabaret piece's running time and the curtain call (from 2026-10-16, brief 10; an hour and a half until then).
      schedule(s, person, at(addDays(week, wd - 4), hour), { kind: CABARET_KIND, label: 'Yale Cabaret: Performance', minutes: holdOf(school.cabaret!), payload: { call: 'performance', last: n === c.shows.length - 1 } });
    });
    return { week: keyOf(week) };
  });

  sim.onSchedule(CABARET_KIND, (item) => {
    const person = personOf(item);
    const school = person?.school;
    if (!person || !school?.cabaret || !person.craft) return;
    const stage = item.payload.stage as Stage | undefined;
    // In hospital, laid up, or with the day called in sick: excused, as a School call is (from 2026-10-12: until then a
    // sick day called in was read by no Cabaret call, and the show was played as if nothing had been said).
    const sick = offSick(person, item.at) || school.sickDay === dayKeyAt(item.at);
    if (!present(person, item.at) || sick) {
      item.status = 'missed';
      // The evening's stage set without them is still a gap to catch up, excused or not.
      if (stage) callMissed(school.cabaret, stage, Number(item.payload.of ?? 0));
      // A show not played, and not excused: a night delivered at nothing in the record (from 2026-10-10).
      if (item.payload.call === 'performance' && !sick && school.cabaret.role) noteRun(school, school.cabaret as typeof school.cabaret & Run, false, item.at, 'missed');
      // The closing show missed after others were played: on the résumé all the same, and the run closed (from
      // 2026-10-12; until then only a closing show played reached either).
      if (item.payload.call === 'performance' && item.payload.last === true && school.cabaret.performed > 0) {
        (school.credits ??= []).push({ production: cabaretSeason(school.cabaret.term), role: school.cabaret.role ?? '', kind: 'cabaret', year: zonedParts(item.at, zone()).year, wentOn: school.cabaret.performed });
        closeRun(sim, person, school.cabaret as typeof school.cabaret & Run, item.at);
      }
      return;
    }
    const cab = school.cabaret;
    // A show joined before 2026-09-28 has no part yet: the company's, now.
    if (!cab.role) Object.assign(cab, { production: cabaretSeason(cab.term), ...companyPart(sim, person, NEW_PLAYS_READ) });
    const run = cab as typeof cab & Run;
    // A Cabaret piece’s rehearsals are new work, taken by openness (from 2026-10-09, `WorkDay.novel`); until 2026-10-13
    // its performances were too, where a festival’s weren’t and the Profile and creation say rehearsing (found by that
    // day’s evidence pass).
    if (item.payload.call === 'performance') {
      cab.performed += 1;
      // The week's process behind it (`nightFactor`, 1 for a show joined before 2026-10-08 or one every evening was kept).
      nerves(sim, person, 'performance');
      // Judged as the craft stood coming in, then grown by it (from 2026-10-10).
      const { energy } = reckonNight(sim, person, run, item, false);
      grewFrom(sim, person, 'night:cabaret', focusAt(sim, person, item.at) * nightFactor(cab), nightWeights(castingReads(run)));
      tire(person, energy);
    } else {
      // An evening staged: answered (`callAnswered`), and the technical and dress played through with no house.
      const weight = stage ? callAnswered(sim, person, cab, stage, Number(item.payload.n ?? 0), Number(item.payload.of ?? 0), castingReads(run), 'cabaret') : 1;
      grewFrom(sim, person, 'rehearsal:cabaret', focusAt(sim, person, item.at) * weight, REHEARSAL_WEIGHTS);
      if (stage === 'techdress') processOf(cab).dress = nightOf(sim, person, `${cabaretSeason(cab.term)}-dress-${item.at}`, run, item.at, run.size ?? 'supporting', 'school');
      tire(person, ESTIMATE.energy.rehearsal);
      enjoyWork(person, { novel: true, rehearsal: true });
    }
    // The closing night played: on the résumé. A closing show missed after others were played is credited above.
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
    const shows: Run[] = summerPlaysOf(s, person, year).slice(0, runs.length).map((p, n) => ({ production: `Yale Summer Cabaret ${year}, Show ${n + 1}`, play: p.title, by: p.by, ...companyPart(s, person, p.reads, p.parts, p.title) }));
    school.summer = { year, played: runs.map(() => 0), until, shows };
    // Dark on Mondays; the closing is the run's last night played, which a later summer's Monday can move.
    const nightsOf = (run: { from: SchoolDate; to: SchoolDate }): SchoolDate[] => {
      const nights: SchoolDate[] = [];
      for (let d = run.from; keyOf(d) <= keyOf(run.to); d = addDays(d, 1)) if (weekday(d) !== 1) nights.push(d);
      return nights;
    };
    // Every show's performances, worked out before any rehearsal is booked: the Saturday matinees at two and the nights
    // at eight. A rehearsal on the afternoon of another show's performance gives way to it, as a School rehearsal gives
    // way to a lab's showing (from 2026-10-12: until then each show's rehearsals were booked without reading the others'
    // calls, and in 2027 the third show rehearsed from one to six over the second's matinees of 24 and 31 July).
    // Each show held for its play's running time and the curtain call (from 2026-10-16, brief 10, `holdOf`): until then
    // two and a half hours whatever the play, a 25-minute A Marriage Proposal as Major Barbara.
    const showMinutes = runs.map((_r, n) => (shows[n] ? holdOf(shows[n]!) : holdOf({})));
    const performances = runs.map((run) => nightsOf(run).flatMap((d) => [...(weekday(d) === 6 ? [at(d, 14)] : []), at(d, 20)]));
    const playing = (n: number, from: Instant) => performances.some((times, m) => m !== n && times.some((t) => t < from + SUMMER_CABARET.rehearsalMinutes * 60_000 && from < t + showMinutes[m]! * 60_000));
    runs.forEach((run, n) => {
      // Each show a full production's process (`stagesOf`, from 2026-10-08): its read-through, blocking, work, technical
      // and dress, staged and numbered over the days kept.
      const days: SchoolDate[] = [];
      for (let d = addDays(run.from, -7 * SUMMER_CABARET.rehearsalWeeks); keyOf(d) < keyOf(run.from); d = addDays(d, 1)) {
        const wd = weekday(d);
        if (wd >= 2 && wd <= 6 && !playing(n, at(d, SUMMER_CABARET.rehearsalFrom))) days.push(d);
      }
      const stages = stagesOf(days.length);
      days.forEach((d, i) => schedule(s, person, at(d, SUMMER_CABARET.rehearsalFrom), { kind: SUMMER_KIND, label: `Summer Cabaret: ${STAGE_LABEL[stages[i]!]}`, minutes: SUMMER_CABARET.rehearsalMinutes, payload: { call: 'rehearsal', run: n, stage: stages[i]!, n: i + 1, of: days.length } }));
      const nights = nightsOf(run);
      nights.forEach((d, i) => {
        if (weekday(d) === 6) schedule(s, person, at(d, 14), { kind: SUMMER_KIND, label: 'Summer Cabaret: Matinee', minutes: showMinutes[n]!, payload: { call: 'performance', run: n } });
        schedule(s, person, at(d, 20), { kind: SUMMER_KIND, label: 'Summer Cabaret: Performance', minutes: showMinutes[n]!, payload: { call: 'performance', run: n, last: i === nights.length - 1 } });
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
    const stage = item.payload.stage as Stage | undefined;
    // A day called in sick excused as a stay in hospital is (from 2026-10-12: until then no Summer Cabaret call read it,
    // and the night was played).
    const sick = offSick(person, item.at) || school!.sickDay === dayKeyAt(item.at);
    if (!present(person, item.at) || sick) {
      item.status = 'missed';
      if (stage && summer.shows?.[run]) callMissed(summer.shows[run]!, stage, Number(item.payload.of ?? 0));
      // A missed performance not excused is in the record the next casting reads, delivered at nothing (from
      // 2026-10-10).
      const unexcused = item.payload.call === 'performance' && !sick;
      if (unexcused && summer.shows?.[run]) noteRun(school!, summer.shows[run]!, false, item.at, 'missed');
      // The closing night missed after nights were played, excused or not: on the résumé all the same, and the run
      // closed with its note and its looking back, as the Cabaret's is. Until 2026-10-13 it was never closed, with no
      // credit, note or reflection, found by the review of that day; and until later that day an unexcused one still
      // wasn't, found by its evidence pass.
      if (item.payload.call === 'performance' && item.payload.last === true && (summer.played[run] ?? 0) > 0 && summer.shows?.[run]) {
        const show = summer.shows[run]!;
        (school!.credits ??= []).push({ production: `${show.play}, Yale Summer Cabaret ${summer.year}`, role: show.role, kind: 'summer', year: summer.year, wentOn: summer.played[run]! });
        closeRun(s, person, show, item.at);
      }
      // In hospital, laid up or called in sick, the company covers the night and keeps them.
      if (!unexcused) return;
      // A missed performance and the company lets them go: the calls ahead are off and the stipend stops.
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
    summer.shows ??= summerPlaysOf(s, person, summer.year).slice(0, summer.played.length).map((p, n) => ({ production: `Yale Summer Cabaret ${summer.year}, Show ${n + 1}`, play: p.title, by: p.by, ...companyPart(s, person, p.reads, p.parts, p.title) }));
    const show = summer.shows[run]!;
    // A call's risk to the body, as the School's calls carry it (from 2026-10-10; until then the Summer Cabaret's calls
    // carried none). The company pays a stipend, so this is paid work: hurt badly enough to be kept off it, workers'
    // compensation pays Connecticut’s share of the week’s stipend, 75% of the whole $375, the state’s least for a week
    // that small (`compWeekly`), the one place in the game a wage and a stage meet, and the stipend for the days it pays
    // stops (`STIPEND_KIND`). Until 2026-10-12 this said two-thirds, New York’s share, and the full stipend was paid
    // beside it; until 2026-10-13 it said 75% after tax, which the least has paid more than since that day’s fix of it.
    const cur = saveCurrency(s.universe);
    const weeklyWage = cur === 'USD' ? SUMMER_CABARET.stipendWeekly : exchange(SUMMER_CABARET.stipendWeekly, 'USD', cur) ?? SUMMER_CABARET.stipendWeekly;
    // An F-1's stipend bears no FICA, and none is taken off its compensation (from 2026-10-13).
    // A performance's hours on stage are the part's own (from 2026-10-16, brief 10, `stageHours`), three until then.
    mayHurt(s, person, 'stage', chanceOver(INJURY.perThousandHours.stage, item.payload.call === 'performance' ? stageHours(show, show.size ?? 'supporting') : 4), item.at, { cityId: YALE_DRAMA.cityId, weeklyWage, employer: SUMMER_EMPLOYER, ...(nonresidentFor(person, zonedParts(item.at, zone()).year) ? { noFica: true } : {}) });
    if (item.payload.call === 'performance') {
      summer.played[run] = (summer.played[run] ?? 0) + 1;
      nerves(s, person, 'performance');
      // Judged as the craft stood coming in, then grown by it (from 2026-10-10).
      const { energy } = reckonNight(s, person, show, item, false);
      grewFrom(s, person, 'night:summer', focusAt(s, person, item.at) * nightFactor(show), nightWeights(castingReads(show)));
      tire(person, energy);
      enjoyWork(person, { genres: genresOfPlay(show.play) });
      if (item.payload.last === true) (school!.credits ??= []).push({ production: `${show.play}, Yale Summer Cabaret ${summer.year}`, role: show.role, kind: 'summer', year: summer.year, wentOn: summer.played[run]! });
    } else {
      const weight = stage ? callAnswered(s, person, show, stage, Number(item.payload.n ?? 0), Number(item.payload.of ?? 0), castingReads(show), 'summer') : 1;
      grewFrom(s, person, 'rehearsal:summer', focusAt(s, person, item.at) * weight, REHEARSAL_WEIGHTS);
      if (stage === 'dress') processOf(show).dress = nightOf(s, person, `${show.production}-dress-${item.at}`, show, item.at, show.size ?? 'supporting', 'school');
      tire(person, ESTIMATE.energy.rehearsal);
      enjoyWork(person, { rehearsal: true, genres: genresOfPlay(show.play) });
    }
  });

  sim.onSchedule(LAB_KIND, (item) => {
    const person = personOf(item);
    const school = person?.school;
    if (!person || !school || !person.craft) return;
    // Excused as a call is. Until 2026-09-27 a lab missed in hospital counted
    // against them, and toward the casting pool's missed calls.
    // A lab is a Pass/Fail course (DRAM 50a, 51b, 363a): its meetings go on its record (`noteMeeting`, from 2026-10-10).
    const labDay = parseKey(dayKeyAt(item.at));
    const labTerm = termOf(labDay);
    // The lab of the year they're in, kept on this calendar term's record (from 2026-10-10).
    const labAcademic = academicTerm(school, labTerm);
    const lab = labDays(labTerm, labAcademic);
    const note = (how: 'attended' | 'excused' | 'missed') => { if (LAB_CODES[labAcademic] && lab) noteMeeting(school, labTerm, LAB_CODES[labAcademic]!, lab.name, how); };
    if (offSick(person, item.at) || school.sickDay === dayKeyAt(item.at)) { item.status = 'missed'; note('excused'); return; }
    school.tally.calls += 1;
    // Missed unexcused: a call toward the casting pool's count, and out at it (`missedCallsOut`, from 2026-10-12).
    if (!present(person, item.at)) { item.status = 'missed'; note('missed'); missedCallsOut(sim, person); return; }
    school.tally.answered += 1;
    note('attended');
    if (item.payload.showing === true) {
      nerves(sim, person, 'performance');
      // The solo piece judged as a night is, a lead's, and kept in the work's record and the journey (from 2026-10-10:
      // until then it was grown from and never judged). The piece is their own, so no process stands behind it.
      // A solo piece, the one actor on stage throughout, for its own running time (from 2026-10-16, brief 10, `UNNAMED_RUNNING.solo`).
      const solo = nightEvaluation(sim, person, `creator-${item.at}`, { play: undefined, solo: true }, item.at, 'lead', 'school');
      const band = nightBand(solo.overall);
      recordWork(sim, person, solo, { at: item.at, what: LABS.creator.name, band });
      const w = person.wellbeing;
      if (band === 'off') w.morale = Math.max(0, w.morale - ESTIMATE.nights.sting);
      else if (band !== 'solid') w.morale = Math.min(100, w.morale + ESTIMATE.nights.lift);
      if (person.id === sim.universe.playerId) sim.notify({ category: 'school', title: `Your Solo Showing: ${NIGHT_WORD_TITLE[band]}`, body: `${LABS.creator.name}, shown to the class: ${Math.round(solo.overall)} of 100.`, importance: 60, route: '/workspace/school' });
      grewFrom(sim, person, 'lab:showing', focusAt(sim, person, item.at), [['scene', 3]]);
      tire(person, energyOfNight(solo));
      // A showing lifted somebody who loved theater (`enjoyWork`'s medium) until the interests went on 2026-10-10.
      return;
    }
    grewFrom(sim, person, 'lab', focusAt(sim, person, item.at), [['scene', 1], ['character', 1], ['script', 1], ['memorization', 1]]);
    tire(person, ESTIMATE.energy.rehearsal);
    enjoyWork(person, { rehearsal: true });
  });

  // The recess's notice: a reminder. The calendar's dates rule the summer (`recessStart`, `classPeriod`, `termStart`):
  // no class meets and the school calls on nobody between the recess and the fall term, which
  // tests/coverage-gaps-recess.test.ts holds. Nothing reads a recess of its own (said 2026-10-10, when the audit asked).
  sim.onSchedule(RECESS_KIND, (item, s) => {
    const person = personOf(item);
    if (!person || !summerOf(person, item.at)) return;
    if (person.id === s.universe.playerId) s.notify({ category: 'school', title: 'The Summer Is Yours', body: 'Classes are done until the fall term.', importance: 60, route: '/workspace/school' });
  });

  sim.onSchedule(STIPEND_KIND, (item, s) => {
    const person = personOf(item);
    if (!person) return;
    const current = payeeAccount(s, person);
    const cur = saveCurrency(s.universe);
    const week = cur === 'USD' ? SUMMER_CABARET.stipendWeekly : exchange(SUMMER_CABARET.stipendWeekly, 'USD', cur) ?? SUMMER_CABARET.stipendWeekly;
    // A week cut short when the company let them go: its days worked.
    const share = typeof item.payload.share === 'number' ? item.payload.share : 1;
    // And the days of it kept off the stage by an injury at the company's work, which workers' compensation pays in its
    // place (from 2026-10-12: until then both were paid for the same days).
    const injury = healthOf(person).injury;
    const from = item.at - 7 * MS_DAY;
    const off = injury?.atWork?.employer === SUMMER_EMPLOYER && injury.offWorkUntil ? Math.max(0, Math.min(injury.offWorkUntil, item.at) - Math.max(injury.at, from)) : 0;
    const pay = Math.round(week * share * (1 - off / (7 * MS_DAY)));
    if (pay <= 0) return;
    // Summer wages, with tax withheld as a paycheck's: a student out of term
    // isn't exempt from FICA. Until 2026-09-27 nothing was withheld, and the
    // return asked for the payroll tax as a balance due.
    const year = zonedParts(item.at, zone()).year;
    const before = yearOf(person, year).acting;
    // A nonresident alien can’t take the standard deduction the withholding tables give, so the employer adds it to the
    // wages before them (IRS Notice 1392, Rev. January 2020: “Because nonresident aliens may not claim the standard
    // deduction, employers are instructed to withhold an additional amount”; Pub 15-T, Withholding Adjustment for
    // Nonresident Alien Employees, Table 2, a 2020-or-later Form W-4: $14,600 a year in its 2024 edition, $15,000 in
    // 2025’s, $16,100 in 2026’s, and 2027’s not yet published). India’s students, whom it spares, aren’t among SLATE’s
    // birthplaces. Each year’s figure takes back the deduction in that year’s own tables, and the tables here are SLATE’s
    // tax table, which keeps each year’s brackets and deduction (`INCOME_TAX_RULES`; until 2026-10-14 2024’s for every
    // year): so what’s added is the deduction the table takes at the payday (`federalStandardDeduction`), 6,100 on a
    // 2026 payday, with 2026’s brackets. The wages are then withheld on from the first dollar, as the 1040-NR the same
    // save files taxes them (`figuresFor`). It moves the federal line alone: the table carries no Connecticut layer, and
    // the payroll tax it would move is taken back out below. Until 2026-10-13 an F-1 student’s stipend was withheld on a
    // resident’s standard deduction, and the first $375 of a year withheld nothing federal (found by that day’s
    // evidence pass).
    const nra = nonresidentFor(person, year);
    const deduction = federalStandardDeduction(YALE_DRAMA.cityId, item.at);
    const added = nra ? (cur === 'USD' ? deduction : exchange(deduction, 'USD', cur) ?? deduction) : 0;
    const taxOf = (x: number) => computeAnnualTax(x + added, YALE_DRAMA.cityId, item.at, { currency: cur });
    // A nonresident alien on an F-1 pays no FICA at all (IRC 3121(b)(19), from 2026-10-10: until then it was withheld).
    const fica = nra ? taxOf(before + pay).payroll - taxOf(before).payroll : 0;
    // Connecticut's tax withheld too, by its own schedule (`connecticutTax`; SLATE's tax table carries none for it), kept
    // as Connecticut's (from the integration pass of 2026-10-10). Until then the week's paycheck withheld the IRS's and
    // payroll tax only, and the return found all of Connecticut's owed.
    const ct = connecticutTax(before + pay, cur) - connecticutTax(before, cur);
    const withheld = taxOf(before + pay).total - taxOf(before).total - fica + ct;
    s.post({ memo: STIPEND_MEMO, category: 'salary', postings: [{ accountId: current.id, amount: pay - withheld }, { accountId: s.nominalAccount('income', 'Wages').id, amount: -pay }, ...(withheld ? [{ accountId: s.nominalAccount('expense', 'Tax Withheld').id, amount: withheld }] : [])] });
    recordWages(person, item.at, zone(), { gross: pay, withheld, withheldBy: { [stateOf(YALE_DRAMA.cityId)]: ct }, employer: SUMMER_EMPLOYER });
  });

  /**
   * A withdrawal of their own (from 2026-10-10): the place given up that day, as the Bulletin lets a student do
   * (pp.157-160). Its consequences: classes, calls, shifts and coursework end; hours worked are still paid; Yale Health
   * ends (`yaleUntil`), and on or before the fifteenth day of a term's classes the term's Hospitalization premium comes
   * back; an F-1 student has fifteen days' grace and no OPT (`graceDays`). Tuition is the Geffen scholarship's, so
   * the tuition rebate isn't the student's. The Bulletin lets a student who withdrew apply to come back; SLATE doesn't
   * model a return, and says so.
   */
  sim.onCommand<{ confirm?: boolean }, { early: boolean; refund: Money }>('school.withdraw', (p, { sim: s }) => {
    const person = s.player;
    const school = person.school;
    if (!school || schoolEnded(school.standing)) throw new CommandError('You’re not at school.');
    if (!p?.confirm) throw new CommandError('Withdrawing gives up your place at the School. Confirm to go ahead.');
    const term = Math.max(0, school.termsBegun - 1);
    const classesFrom = at(classPeriod(term).from, 0);
    const early = school.termsBegun > 0 && s.now <= classesFrom + 15 * MS_DAY;
    school.withdrewEarly = early;
    // The term's Hospitalization premium back, where it was paid from the bank and the cover is canceled.
    const cur = saveCurrency(s.universe);
    const memo = `Yale Health plan, ${termWords(term)}`;
    // Paid or owed (`owe`’s memo, from 2026-10-13, when a plan the bank couldn’t pay began to be owed): one owed comes
    // back to the bank too, which then pays back what’s owed.
    const paid = early && s.universe.transactions.some((t) => (t.memo === memo || t.memo === `${memo}, unpaid`) && t.postings.some((q) => s.universe.accounts[q.accountId]?.ownerId === person.id));
    const refund = paid ? termAccount(cur, false, term).healthPlan : 0;
    if (refund > 0) s.post({ memo: `Refund: ${memo}, withdrawn`, category: 'school', postings: [{ accountId: payeeAccount(s, person).id, amount: refund }, { accountId: s.nominalAccount('expense', expenseFor('school')).id, amount: -refund }] });
    // Canceled back to the insurance term's start, care had since is billed as uninsured care is (`repriceCare`, from
    // 2026-10-10: until then it stayed as Yale Health had paid it). In a spring the insurance term starts on 1 February,
    // after the fifteenth day of classes, so the cover ends on the day (`yaleUntil`) and nothing is repriced.
    const from = insuranceStart(term);
    if (early) {
      (school.uncovered ??= []).push({ from });
      repriceCare(s, person, from, s.now, 'Yale Health cover canceled back to the insurance term’s start, on withdrawing');
    }
    const f1 = f1Of(person) !== undefined;
    // Said as it falls (from 2026-10-12): until then the notice said the cover was canceled back to the term's start,
    // where it went back to the insurance term's, three weeks before a fall term began, and in a spring to nothing.
    const ends = from < s.now ? `is canceled back to ${formatDate(from, zone())}, the start of its insurance term` : 'ends today';
    setStanding(s, person, 'withdrawn', [
      'You gave up your place at the School today.',
      early ? `It was by the fifteenth day of classes, so Yale Health’s cover ${ends}${refund > 0 ? `, and its ${formatMoney(refund, cur)} premium is refunded` : ''}.` : 'Yale Health covers you for thirty days more.',
      'Hours you worked are still paid.',
      f1 ? 'As an F-1 student you have fifteen days’ grace, and OPT isn’t open to you.' : '',
      'The Bulletin lets a student who withdrew apply to come back, but the game doesn’t offer a return.',
    ].filter(Boolean).join(' '));
    return { early, refund };
  });

  sim.onCommand<Record<string, never>, { excused: boolean }>('school.call_in_sick', (_p, { sim: s }) => {
    const person = s.player;
    const no = sickRefusal(s, person);
    if (no) throw new CommandError(no);
    const p = zonedParts(s.now, zone());
    person.school!.sickDay = keyOf({ year: p.year, month: p.month, day: p.day });
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
    const held = s.universe.scheduled.filter((i) => i.status === 'pending' && i.payload.personId === person.id && i.kind === CALL_KIND).map(heldSpan);
    let capped = false;
    for (let n = 0; n < 14; n += 1, day = addDays(day, 1)) {
      const when = at(day, 19);
      if (s.timeline.conflicts(when, hours * 60).some((one) => one.requiresPlayer)) continue;
      // Not on a night on call (from 2026-10-10), and only in a term, when the Rep plays: front of house in the summer
      // recess, before the first term or between terms was offered with the theater dark until then.
      if (held.some(([a, b]) => a < when + hours * 3_600_000 && when < b)) continue;
      // Within Yale's weekly cap across its jobs, 19 hours in term (from 2026-10-10).
      if (weekHours(s, person, when) + hours > weekCap(when)) { capped = true; continue; }
      // Nor on a day off within it, a holiday or a recess, as the classes skip them (`inPeriod`): from 2026-10-13, when
      // until then the term’s first to last day was all it read, and Labor Day was booked (found by that day’s final
      // defect pass).
      if (!inPeriod(termOf(day), day)) continue;
      school.workStudy.electiveHours += hours;
      schedule(s, person, when, { kind: SHIFT_KIND, label: 'Elective Shift: Front Of House, Yale Rep', minutes: hours * 60, payload: { hours, elective: true } });
      return { at: when, hours };
    }
    throw new CommandError(capped ? `There’s no free evening in the next two weeks within Yale’s cap of ${WORK_LIMITS.weekHours} hours a week in term, across all your Yale jobs.` : 'There’s no free evening left in the term in the next two weeks.');
  });
}
