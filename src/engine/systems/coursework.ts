/**
 * SLATE — the work a course sets between its meetings, and the first week
 * that comes before it (from 2026-10-07; `content/coursework.ts`).
 *
 * **Assignments.** When a course with work (`templateFor`) meets and nothing
 * of its is open, it sets an assignment: its material where it has some (a
 * scene the class hasn't had, your part and a partner from the class), and
 * the meeting it's due at, so many of the course's meetings on. It's kept on
 * the school record with a stable id and survives a save, sleep, travel and
 * the turn of a term; one still open when its term's classes end lapses.
 *
 * **Preparation.** Each step (`school.prepare`) takes its time and moves one
 * part of the preparation by a share of what's left of it, so a step done
 * again moves it less and a part done fully isn't moved at all; daily practice
 * counts once a day. Table work is choosing, question by question, what the
 * scene is (`school.choose`): what the text supports counts; what it cuts
 * against is noted. A step that needs a partner is a rehearsal agreed with
 * them (`school.ask_partner`), kept or missed by both. A step may train its
 * skill a little, for at most three steps an assignment (`ESTIMATE`).
 *
 * **The showing.** At the meeting it's due, the course's class-day reckoning
 * (`systems/school.ts`) asks here first: the work is shown once, read from
 * what was prepared, the partner's work, the craft it asks against the year's
 * par, and how ready they came, with a little luck; and what the meeting adds
 * to the course's skills is weighed by how it went, in place of the ordinary
 * meeting's, never beside it. Absent, it isn't shown: excused, it moves to the
 * next meeting; unexcused, it's missed. The feedback names what helped and the
 * one thing that most held it back, and where the course revises, the next
 * meeting shows whether that note was taken.
 *
 * **Partners.** A classmate keeps how far they trust you and what's happened
 * between you. Asked to rehearse, they answer by their own day: their classes,
 * their Saturday shift, their production's calls Tuesday to Friday from three
 * to ten (the Bulletin's rehearsal hours), and the hour; one you've stood up
 * would rather work alone. They come or don't by their own reliability, and
 * do their own share of the work by their drive.
 *
 * **The first week.** Orientation's sessions, 24 to 28 August, are on the
 * calendar; each one kept changes what's known or arranged (the account and
 * the year's obligations, the class, the faculty, the building's studios and
 * the library, the courses' first work), once. One missed can be caught up
 * by hand. A save from after the first week has its week behind it.
 *
 * Every number here is SLATE's estimate unless it says otherwise.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import { spokenList } from '../core/text';
import type { Person } from '../domain/model';
import { formatDate, formatTime, instantFromZoned, zonedParts, MS_DAY, type Instant } from '../core/time';
import { formatMoney, saveCurrency } from '../core/money';
import { CITIES } from '../content/geography';
import { COURSES, ORIENTATION_2026, SKILLS, SKILL_WORDS, WORK_STUDY, YALE_DRAMA, type Course, type SchoolDate, type Skill } from '../content/school';
import { PREP_DIMS, QUESTIONS, SCENE_SIZE_MINUTES, questionWords, sceneById, templateById, templateFor, type Activity, type Need, type Option, type PrepDim, type Question, type Template } from '../content/coursework';
import { bondMove, classPeriod, classmatePerformer, conditionAt, ordinary, focusOf, focusAt, grewFrom, hasNeed, keyOf, termAccount, termOf, termStart, repProduction, type Classmate } from './school';
import { bandOfQuality, chiefLimit, countTogether, evaluate, leanedWeights, performerOf, recordWork, type Evaluation } from './evaluation';
import { evaluatePiece, judgePiece, loadOf, pieceWeights, rehearseWays, unitSegments, withBook, type PieceSpec, type Workbook } from './piece';
import { ENSEMBLE, sharedOf, sharedWords, type PartnerRead, type SharedResult } from './ensemble';
import { PIECE } from '../content/piece';
import { UNPERFORMED } from './material';
import { abilityFull, abilityOf, CRAFT_ABILITY, stepSpeed } from './attributes';
import { EVALUATION, TASK_PROFILES, TEMPLATE_TASK, type Dimension } from '../content/tasks';
import type { AbilityId } from '../content/abilities';
import { genreSpeed } from './engagement';
import { genresOfPlay } from '../content/plays';
import { SPENT, startRefusal } from './life';
import { exerts } from './body';
import { personalityOf } from './personality';
import type { PersonalityKnob } from '../content/personality-traits';
import { inHospital } from './health';
import {
  APPROACH, APPROACHES, LEARNING, OBJECTIVE_DIM, challengesFor, mayGive, noteRecord, noteSubject, objectiveLabel, nextChallenge, noteKey, objectiveFor, partnerFor, recordNote, resolveNote, revisitOf, scenePast, scenesFor, targetDifficulty,
  type Approach, type NoteFocus, type NoteKind, type NoteRecord, type Objective, type Revisit,
} from './learning';
import { actingOf, dayKeyAt } from './school';
import { CLASS, boundaryRefusal, keptWith, momentsOf, noteIncident } from './classmates';
import { injuryOf, laidUp, trainingRefusal } from './injury';
import { INJURY_KIND } from '../content/injury';
import { academicTerm, cabaretEvenings, CABARET_RUN, coursesFor, ESTIMATE, shortTermWords, type SchoolRecord } from './school';
import { choose, materialContext, materialOf, rehearseChoice, sidesOf, type Playing } from './material';
import { PLAYING } from '../content/approaches';
import { featureSpeed, noteMaterial } from './experience';
import { DIM_WORDS, STEP, disciplineOf, partWords, saysStep, showingWords, situationOf, type ShowingFacts, type Situation } from './feedback';
import { exerciseFor } from '../content/practice';

/** What SLATE estimates for the coursework, named where it's read. */
export const WORK = {
  /** The steps of an assignment that train their skill, at most, and how much one does against a class meeting's. */
  trainingSteps: 3, trainingWeight: 0.25,
  /**
   * A showing is judged by the evaluation from 2026-10-09 (`show`, `systems/evaluation.ts`): until then it was half
   * preparation, three tenths the craft against the work's par at a fortieth a point, a fifth readiness, and luck of
   * 0.08 either side, cut at 0.4, 0.58 and 0.74. The craft against the par at a fortieth a point is kept for the line
   * that the skills carried it and for whether a note on the craft is given (`craftScore`); until 2026-10-16 it chose
   * which skill too, which the judged result's limits choose since (`skillHeld`). The par is the work's difficulty now
   * (`difficultyOf`).
   */
  showing: { perPoint: 40 },
  /** What each band makes of the meeting's growth against an ordinary meeting. */
  weight: { unready: 0.85, working: 1, strong: 1.1, exceptional: 1.2 },
  /** A revision's meeting, the note taken or not. */
  revision: { applied: 1.1, notApplied: 0.95, dimRise: 0.2, dimEnough: 0.8, worked: 0.6 },
  /**
   * What a partner prepares on their own, a week of it at an ordinary drive, and the most. From 2026-10-12 it's the
   * partner's own preparation, read by the scene together (`systems/ensemble.ts`), and no longer a part of yours.
   */
  partnerOwnPerWeek: 0.35, partnerOwnMost: 0.85,
  /** A classmate's reliability, drawn once: how often they come when they've said they will. */
  reliability: { from: 0.72, to: 0.98 },
  /** Trust: where it starts, what a rehearsal kept, missed or called off late does to it, and below what they'd rather not. */
  trust: { start: 50, kept: 4, missed: -12, lateCancel: -4, wary: 25 },
  /**
   * What a rehearsal kept or missed does to the classmate's bond (`BONDS` in
   * `systems/school.ts`), the one the class is known by after school
   * (`knowTheClass`): a partner kept faith with is a friend for longer, one
   * stood up can be a rival. Until 2026-10-07 the partnership moved only its
   * own trust, which ended with the degree.
   */
  bond: { kept: 2, missed: -5 },
  /**
   * A partner asking you (from 2026-10-07): in class, how likely on a day
   * there's nothing booked between you, the hour they ask for, how many days
   * ahead they look for an evening they're free, and what an ask left
   * unanswered does to their trust. A no costs nothing: a partner who can't
   * have the evening they asked for isn't wronged by hearing so.
   */
  ask: { chance: 0.4, hour: 19, withinDays: 3, unanswered: -2 },
  /** A rehearsal with a partner: how long, the hours a call may be in, and how far ahead it must be asked for. */
  rehearsal: { minutes: 90, from: 7, until: 22, aheadHours: 2 },
  // A partner's share of your own partner part, six tenths together and four their own (`partnerMix`), went on
  // 2026-10-12: it held a mastered student under 100 for what the partner hadn't done (`systems/ensemble.ts`).
  /** Effort, as METs: work at a desk, on one's feet in a room. */
  met: { desk: 1.5, feet: 2.5 },
} as const;

/** What a scene together at Strong or better adds to the bond, and what covering a partner's slip adds to their trust (from 2026-10-12). SLATE's. */
export const TOGETHER_BOND = 1;
export const TOGETHER_COVERED = 2;

/** What a scene played together leaves between you and the classmate: a bond for one that went well, trust for a slip of theirs you covered. */
export function afterTogether(sim: Simulation, person: Person, mateIndex: number, together: SharedResult, what: string): void {
  const mate = person.school?.classmates[mateIndex];
  if (!mate) return;
  const went = bandOfQuality(together.overall);
  if (went === 'strong' || went === 'exceptional') moveTrust(mate, 0, { person, by: TOGETHER_BOND });
  if (together.slip && together.slip.covered >= 0.5) {
    moveTrust(mate, TOGETHER_COVERED);
    remember(sim, mate, `You covered for them when they slipped in ${what}`);
  }
}

export type Band = 'unready' | 'working' | 'strong' | 'exceptional';
export const BAND_LABEL: Record<Band, string> = { unready: 'Unready', working: 'Working', strong: 'Strong', exceptional: 'Exceptional' };
/** The bands in order, for one against another (from 2026-10-20, brief 16's feedback). */
const BAND_RANK: Record<Band, number> = { unready: 0, working: 1, strong: 2, exceptional: 3 };
const strongBand = (b: Band): boolean => BAND_RANK[b] >= BAND_RANK.strong;

/** What a note is about (`NoteFocus` in `systems/learning.ts`): a part of the preparation, a choice at the table, a skill, or the next step beyond the work. */
export type Focus = NoteFocus;

/**
 * Until 2026-10-12 a showing also kept `parts`: the preparation summed by `weightsOf`, the craft, the readiness and the
 * partner part, which nothing but a test read (the band and score have come from the judged result since 2026-10-09).
 * It went then; a save from before still carries it, unread.
 */
export interface Showing {
  band: Band; score: number; at: Instant;
  /** What helped, in words. */
  strengths: string[];
  /**
   * The scene together, on paired work (from 2026-10-12, `systems/ensemble.ts`): your result with your partner's
   * contribution blended in, apart from your own, which the band reads. What it came to, what the partner brought,
   * a slip and how much of it you covered, and the words for it.
   */
  together?: { overall: number; contribution: number; partner: string; slip?: SharedResult['slip']; words: string };
}

/**
 * A showing's note: its words, what it's about, and how it stands against the
 * notes before it on the same thing (`kind`; `before` is the last time it was
 * given). From 2026-10-08.
 */
/**
 * A showing's feedback as delivered: its words, kept, so a reload never chooses them again. From 2026-10-20 (brief 17)
 * it also keeps which situation the words said (`situationOf`) and whether they carried a step beyond (`saysStep`), so
 * the card's label says what the words do; a save from before has neither, and its card reads as it did.
 */
export interface Feedback { course: string; teachers: string; text: string; focus: Focus; seen?: boolean; kind?: NoteKind; before?: { on: string; course: string }; situation?: Situation; step?: boolean }

export interface PartnerRehearsal {
  /** `excused`: missed in hospital or laid up, which isn't standing them up (from 2026-10-10). */
  id: string; at: Instant; status: 'booked' | 'kept' | 'missedByYou' | 'missedByThem' | 'cancelled' | 'excused';
  /** A rehearsal they didn't come to: when their apology covered it (from 2026-10-20, brief 17, `missesOwed`). */
  apologized?: Instant;
  /** What the partner said after it, kept (`peerNote`): the game's words, marked simulated. */
  said?: string;
}
/** A rehearsal the partner asked for: answered yes (booked), no, or not in time. */
export interface PartnerAsk { id: string; at: Instant; until: Instant; status: 'open' | 'accepted' | 'declined' | 'lapsed' }

export interface Assignment {
  id: string;
  course: string;
  template: string;
  term: number;
  setOn: string;
  dueOn: string;
  sceneId?: string;
  /** Which of the scene's two parts is yours. */
  role?: 0 | 1;
  repPlay?: string;
  /** The classmate partnered with you, by their place in the class. */
  partner?: number;
  prep: Record<PrepDim, number>;
  answers: Partial<Record<Question['id'], string>>;
  /** Each step's count, and the day a daily one was last done. */
  steps: Record<string, number>;
  practicedOn: Record<string, string>;
  trained: number;
  /** What your partner has done together with you, and on their own. */
  rehearsals: PartnerRehearsal[];
  asks?: PartnerAsk[];
  /** `excused`: due at the last meeting of its course, missed ill, with none left to move it to (from 2026-10-10). */
  status: 'open' | 'revising' | 'done' | 'missed' | 'lapsed' | 'excused';
  /** What the work asks you to put first (`objectiveFor`), and, for a scene studied before, what's new about it (`revisitOf`). From 2026-10-08. */
  objective?: Objective;
  revisit?: Revisit & { answers?: Partial<Record<Question['id'], string>> };
  /** Notes from before put right by this showing, by their ledger key. */
  taken?: string[];
  /** Another way at a persistent weakness, chosen for this work (`APPROACHES`, from 2026-10-08): which note, how, when. */
  approach?: { key: string; dim: PrepDim; kind: Approach; on: string };
  /** How the player has chosen to play the scene, and how far it's rehearsed in (`systems/material.ts`, from 2026-10-10). */
  playing?: Playing;
  /** The partner's name, kept once the player has gone on with another class (`joinCohort`, from 2026-10-10). */
  partnerName?: string;
  /** Work shown in rounds (`Template.rounds`): the round it's at, and each round shown, with how it went. From 2026-10-08. */
  round?: number;
  roundsShown?: { label: string; band: Band; on: string }[];
  shown?: Showing;
  feedback?: Feedback;
  /** `missed`: not there to show it again, unexcused, which the term's evaluation reads as unready (from 2026-10-10). */
  revision?: { dueOn: string; before: number; applied?: boolean; band?: Band; missed?: boolean };
  /** A disagreement over the table work answered by both readings tried at the next rehearsal kept (`systems/classmates.ts`). */
  tryBoth?: boolean;
  /** The partner worked the weakness with you once, where that's the way chosen (`approach`). */
  partnerWorked?: boolean;
  /**
   * The partner part rehearsed with a reader in the partner's place (`READER`, from 2026-10-16), 0 to 1: your own side of
   * the scene worked off somebody feeding the other part. Your own partner part is it and your rehearsals with the
   * partner, compounded (`partnerPart`); the partner's own preparation reads only the rehearsals they came to
   * (`partnerPrepOf`). A save from before has none, and its partner part is what it was.
   */
  reader?: number;
  /**
   * The table-work question your partner reads another way, where you kept your reading (from 2026-10-12): the scene
   * together reads your readings as apart (`ENSEMBLE.apart`) until you try theirs or try both at a rehearsal.
   */
  readsApart?: string;
  /** Focused work on each of the scene's segments, 0 to 1 (from 2026-10-12, `systems/workbook.ts`, `scenePiece`). */
  work?: number[];
  /** The problem being worked on, the tries and the discoveries kept (from 2026-10-12, `systems/workbook.ts`). */
  book?: Workbook;
}

export type OrientationTask = 'register' | 'classmates' | 'faculty' | 'tour' | 'expectations';
export const ORIENTATION: readonly { task: OrientationTask; label: string; day: number; hour: number; minutes: number }[] = [
  { task: 'register', label: 'Registration And Your Account', day: 24, hour: 10, minutes: 120 },
  { task: 'classmates', label: 'Meeting Your Class', day: 25, hour: 10, minutes: 180 },
  { task: 'faculty', label: 'Meeting The Acting Faculty', day: 26, hour: 10, minutes: 120 },
  { task: 'tour', label: 'The Building, The Studios And The Library', day: 27, hour: 10, minutes: 120 },
  { task: 'expectations', label: 'The Courses And What They Ask', day: 28, hour: 10, minutes: 150 },
];

export interface Coursework {
  assignments: Assignment[];
  /** Scenes worked already, so the next is another. Kept for old saves; the history is read from the assignments (`scenePast`) from 2026-10-08. */
  used: string[];
  /** Every note given, by what it's about, across courses (`systems/learning.ts`). */
  notes?: NoteRecord[];
  orientation: { done: Partial<Record<OrientationTask, Instant>>; behind?: boolean };
  /** The terms a warning in the term was given for (from 2026-10-16, `termWarning`): once a term. */
  warned?: number[];
}

export const ORIENTATION_KIND = 'school.orientation';
export const PARTNER_KIND = 'school.partner_rehearsal';
/** A partner's ask, lapsing unanswered at its answer-by time. */
export const ASK_KIND = 'school.partner_ask';

const zone = () => CITIES.require(YALE_DRAMA.cityId).timeZone;
const at = (d: SchoolDate, hour: number, minute = 0): Instant => instantFromZoned({ ...d, hour, minute }, zone());
const parse = (key: string): SchoolDate => { const [y, m, d] = key.split('-').map(Number); return { year: y!, month: m!, day: d! }; };
const plus = (d: SchoolDate, n: number): SchoolDate => { const t = new Date(Date.UTC(d.year, d.month - 1, d.day + n)); return { year: t.getUTCFullYear(), month: t.getUTCMonth() + 1, day: t.getUTCDate() }; };
const dayKey = (when: Instant): string => { const p = zonedParts(when, zone()); return keyOf({ year: p.year, month: p.month, day: p.day }); };
const courseOf = (code: string): Course | undefined => COURSES.find((c) => c.code === code);
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const labelOf = (skill: Skill) => SKILLS.find((k) => k.id === skill)?.label ?? skill;

/** The record's coursework, made where a save has none; a save from after the first week has orientation behind it. */
export function courseworkOf(sim: Simulation, person: Person): Coursework | undefined {
  const school = person.school;
  if (!school) return undefined;
  const rec = school as typeof school & { coursework?: Coursework };
  if (!rec.coursework) {
    rec.coursework = { assignments: [], used: [], orientation: { done: {} } };
    if (sim.now >= at(ORIENTATION_2026.classesBegin, 0) || school.termsBegun > 1) rec.coursework.orientation.behind = true;
  }
  return rec.coursework;
}

// ---------------------------------------------------------------------------
// The classmates as partners
// ---------------------------------------------------------------------------

export interface MateRecord { reliability?: number; trust?: number; kept?: number; stoodUp?: number; missedByYou?: number; met?: Instant; log?: { at: Instant; what: string }[] }
export const mateRecord = (mate: Classmate): MateRecord => mate as Classmate & MateRecord;

/** How reliable a classmate is, drawn once (`school.partner`), by their drive: the more driven, the likelier. */
export function reliabilityOf(sim: Simulation, person: Person, i: number): number {
  return reliabilityFor(sim, person, person.school!.classmates[i]!, `reliability-${i}`);
}

/**
 * A classmate's reliability under a draw key of its own (from the integration pass of 2026-10-10): the first class keys
 * it by place (`reliability-<i>`), as always; a class drawn later (`drawCohort`) by its year, so its fifth classmate
 * isn't the first class's fifth again.
 */
export function reliabilityFor(sim: Simulation, person: Person, m: Classmate, key: string): number {
  const mate = mateRecord(m);
  if (mate.reliability === undefined) {
    const r = sim.rng('school.partner', person.id, key).next();
    const drive = m.drive ?? 1;
    mate.reliability = Math.round(Math.min(WORK.reliability.to, WORK.reliability.from + (WORK.reliability.to - WORK.reliability.from) * (0.5 * r + 0.5 * (drive - 0.75) / 0.5)) * 1000) / 1000;
  }
  return mate.reliability;
}

export const trustOf = (mate: Classmate): number => mateRecord(mate).trust ?? WORK.trust.start;

function remember(sim: Simulation, mate: Classmate, what: string): void {
  const m = mateRecord(mate);
  (m.log ??= []).unshift({ at: sim.now, what });
  if (m.log.length > 20) m.log.length = 20;
}

function moveTrust(mate: Classmate, by: number, bond?: { person: Person; by: number }): void {
  const m = mateRecord(mate);
  m.trust = Math.max(0, Math.min(100, trustOf(mate) + by));
  if (bond) mate.bond = Math.max(-100, Math.min(100, (mate.bond ?? 0) + bondMove(bond.person, bond.by)));
}

/**
 * Whether a classmate is cast this term, and so called Tuesday to Friday from three (the Bulletin's rehearsal hours). A
 * Cabaret show alone isn't that: it calls its evenings and its nights in one week (`cabaretCalls`, from 2026-10-11).
 */
const castThisTerm = (person: Person, mate: Classmate, term: number): boolean => person.school!.around?.term === term && person.school!.around.list.some((x) => x.name === mate.name && x.part !== CABARET_RUN.part);

/** Whether a classmate's Cabaret show calls them on a day, from six in the evening: its rehearsal evenings and its nights. */
function cabaretCalls(person: Person, mate: Classmate, term: number, day: SchoolDate): boolean {
  const around = person.school!.around;
  if (around?.term !== term || !around.cabaretWeek || !around.list.some((x) => x.name === mate.name && x.part === CABARET_RUN.part)) return false;
  const [y, m, d] = around.cabaretWeek.split('-').map(Number);
  const thu: SchoolDate = { year: y!, month: m!, day: d! };
  const k = keyOf(day);
  return [0, 1, 2].some((n) => keyOf(plus(thu, n)) === k) || cabaretEvenings(thu, classPeriod(term).off).some((e) => keyOf(e) === k);
}

/** Why a classmate can't rehearse at a moment, by their own day, or nothing. */
export function mateBusy(person: Person, i: number, when: Instant, minutes: number): string | undefined {
  const mate = person.school!.classmates[i]!;
  const first = mate.name.split(' ')[0];
  const p = zonedParts(when, zone());
  const day: SchoolDate = { year: p.year, month: p.month, day: p.day };
  const startH = p.hour + p.minute / 60;
  const endH = startH + minutes / 60;
  const weekday = new Date(Date.UTC(day.year, day.month - 1, day.day)).getUTCDay();
  if (startH < WORK.rehearsal.from || endH > WORK.rehearsal.until) return `${first} won’t rehearse before ${hourWords(WORK.rehearsal.from)} or after ${hourWords(WORK.rehearsal.until)}.`;
  if (coursesFor(person.school, day).length && startH < 15 && endH > 9) return `${first} is in class until three.`;
  const term = termOf(day);
  if (weekday === 6 && startH < 16 && endH > 10 && coursesFor(person.school, plus(day, -1)).length) return `${first} works a work-study shift on Saturdays.`;
  if (castThisTerm(person, mate, term) && weekday >= 2 && weekday <= 5 && endH > 15) return `${first} has rehearsal calls from three, Tuesday to Friday.`;
  if (endH > 18 && cabaretCalls(person, mate, term, day)) return `${first} is in a Cabaret show this week, with calls from six.`;
  return undefined;
}

// ---------------------------------------------------------------------------
// Setting work
// ---------------------------------------------------------------------------

/** A course's meetings from a day on, to the end of its term's classes. */
export function meetingsFrom(course: string, from: SchoolDate, school?: SchoolRecord): string[] {
  const term = termOf(from);
  const end = keyOf(classPeriod(term).to);
  const out: string[] = [];
  for (let d = from; keyOf(d) <= end; d = plus(d, 1)) if (coursesFor(school, d).some((c) => c.code === course)) out.push(keyOf(d));
  return out;
}

const termWord = (term: number): 'fall' | 'spring' => (termStart(term).fall ? 'fall' : 'spring');

/** A list in words: “a”, “a and b”, “a, b and c”, with a comma before the last where an item has an “and” of its own. */
const andList = (xs: readonly string[]): string => (xs.length < 2 ? xs[0] ?? '' : `${xs.slice(0, -1).join(', ')}${xs.some((x) => x.includes(' and ')) ? ', and' : ' and'} ${xs.at(-1)}`);
/** An hour of the day in words that can end a sentence: 7 in the morning, noon, 10 at night. */
const hourWords = (h: number): string => (h === 12 ? 'noon' : h === 0 || h === 24 ? 'midnight' : h < 12 ? `${h} in the morning` : h < 17 ? `${h - 12} in the afternoon` : h < 21 ? `${h - 12} in the evening` : `${h - 12} at night`);
/** A scene's place, as it reads inside a sentence: “The one act, the Wright kitchen” as “the one act, the Wright kitchen”. */
export const whereWords = (where: string): string => where.replace(/^(The|A|An|Their|His|Her|Before|Outside|Inside|In|On|At|By) (?=[a-z])/, (w) => w.toLowerCase());
/** A count under ten in words, as prose says it: two, seven, 12. */
const smallWords = (n: number): string => ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'][n] ?? String(n);
/** How many times, in words: once, twice, 3 times. */
const timesWords = (n: number): string => (n === 1 ? 'once' : n === 2 ? 'twice' : `${n} times`);

/** The ledger of notes, made where a save has none. */
export const notesOf = (cw: Coursework): NoteRecord[] => (cw.notes ??= []);

/** Sets a course's next work, from its meeting on a day, where there's room before the term's classes end. */
export function setWork(sim: Simulation, person: Person, course: string, day: SchoolDate): Assignment | undefined {
  const cw = courseworkOf(sim, person);
  const school = person.school;
  if (!cw || !school) return undefined;
  const term = termOf(day);
  const t = templateFor(course, termWord(term));
  if (!t) return undefined;
  // The final term's Actor Showcase sets the two scenes the student chooses, not a scene drawn in class
  // (`systems/proshowcase.ts`, from 2026-10-21), unless an Incomplete kept them out of it, when the course's classes set
  // their work as they always had.
  if (t.id === 'showcase-scene' && person.pro?.showcase?.term === term && person.pro.showcase.eligible !== false) return undefined;
  if (cw.assignments.some((a) => a.course === course && (a.status === 'open' || a.status === 'revising'))) return undefined;
  const meetings = meetingsFrom(course, day, person.school).filter((k) => k > keyOf(day));
  const dueOn = meetings[t.dueAfter - 1];
  if (!dueOn) return undefined;
  // Work in rounds is set only where the term has a meeting for every round: a rehearsal cut off after its table
  // work isn't one (the first played year found one closed after its first round).
  if (t.rounds && !meetings[t.dueAfter - 1 + t.rounds.slice(1).reduce((n, r) => n + r.gap, 0)]) return undefined;
  const rng = sim.rng('school.coursework', person.id, `${course}-${keyOf(day)}`);
  const a: Assignment = {
    id: sim.nextId('assignment'), course, template: t.id, term, setOn: keyOf(day), dueOn,
    prep: Object.fromEntries(PREP_DIMS.map((d) => [d, 0])) as Record<PrepDim, number>,
    answers: {}, steps: {}, practicedOn: {}, trained: 0, rehearsals: [], status: 'open',
  };
  // The material: the fitting scene not yet studied, nearest the difficulty that suits (`scenesFor`); every fitting one
  // studied, the longest ago comes back, and asks something new of it (`revisitOf`). Until 2026-10-08 a scene was
  // drawn from the unstudied ones at random, and once they ran out, from all of them, in any part, with anyone.
  // The program's year they're in, not the calendar's (from 2026-10-10: a student back from a leave was set a
  // year-two scene in their first year again).
  const year = Math.min(3, Math.floor(academicTerm(school, term) / 2) + 1);
  if (t.material !== 'none') {
    const target = targetDifficulty(year, person.craft ? actingOf(person.craft) : 50);
    const pool = scenesFor(t, course, cw.assignments, target);
    // Drawn among the unworked scenes nearest the difficulty that suits, up to four (from 2026-10-12): until then the
    // nearest was taken every time, and every life met the same scenes in the same order (the completeness critic of
    // 2026-10-12; VARIETY-2026-10-12.json had the same coursework on three seeds).
    const dist = (s: { difficulty: number }) => Math.abs(s.difficulty - target) + (s.difficulty > target ? 0.5 : 0);
    const fresh = pool.filter((s) => !scenePast(cw.assignments, s.id).length);
    const near = fresh.length ? fresh.filter((s) => dist(s) <= dist(fresh[0]!) + 0.5).slice(0, 4) : [];
    const scene = near.length > 1 ? near[Math.floor(rng.next() * near.length)]! : pool[0];
    // No scene of the kind it asks: nothing to set.
    if (!scene) return undefined;
    a.sceneId = scene.id;
    const past = scenePast(cw.assignments, scene.id);
    const { role, revisit } = revisitOf(past, rng.next());
    a.role = role;
    if (revisit) {
      const before = past.find((x) => x.id === revisit.assignmentId);
      a.revisit = { ...revisit, ...(revisit.change === 'reading' && before ? { answers: { ...before.answers } } : {}) };
    }
    if (!cw.used.includes(scene.id)) cw.used.push(scene.id);
  }
  if (t.repPlay) a.repPlay = repProduction(term).name;
  if (t.paired && school.classmates.length) {
    // The classmate least worked with, not last time's in this course or in this scene where another is free.
    // Within the class they're in now: work with a class gone ahead (`joinCohort`) keeps its partner by name.
    const current = cw.assignments.filter((x) => x.partnerName === undefined);
    a.partner = partnerFor(current, course, school.classmates.length, rng.next(), a.revisit?.partner !== undefined && !cw.assignments.find((x) => x.id === a.revisit!.assignmentId)?.partnerName ? [a.revisit.partner] : []);
    // Their reliability drawn now, once, so a screen only ever reads it.
    reliabilityOf(sim, person, a.partner);
  }
  const objective = objectiveFor(t, course, cw.assignments, notesOf(cw));
  if (objective) a.objective = objective;
  cw.assignments.push(a);
  if (person.id === sim.universe.playerId) {
    const c = courseOf(course);
    const scene = a.sceneId ? sceneById(a.sceneId) : undefined;
    const partner = a.partner !== undefined ? school.classmates[a.partner]!.name : undefined;
    const what = scene ? `Your scene is from ${scene.play}, ${whereWords(scene.where)}. You play ${scene.roles[a.role!].name}${partner ? `, and ${partner} plays ${scene.roles[a.role === 0 ? 1 : 0]!.name}` : ''}` : a.repPlay ? `${t.deliverable} (${a.repPlay})` : t.deliverable;
    const again = a.revisit && scene ? ` ${revisitWords(a, scene.roles[a.revisit.role].name, school.classmates[a.revisit.partner ?? -1]?.name)}` : '';
    // Where to start, after when it's due (from 2026-10-19, brief 15): the part this piece puts first counts for more in
    // its result (`workContext`, `putFirst`), so it's the advice to start there, not an order the steps must follow.
    const focus = a.objective ? ` Start with ${objectiveLabel(t, a.objective)}: this piece puts it first, so it counts for more when you show it.` : '';
    sim.notify({ category: 'school', title: `${c?.name ?? course}: ${t.title}`, body: `${what}.${again} It’s due in class on ${formatDate(at(parse(dueOn), 12), zone())}.${focus}`, importance: 55, route: '/workspace/school' });
  }
  return a;
}

// ---------------------------------------------------------------------------
// Preparing
// ---------------------------------------------------------------------------

export const assignmentById = (sim: Simulation, person: Person, id: string): Assignment | undefined => courseworkOf(sim, person)?.assignments.find((a) => a.id === id);

/** A course's open assignment, for a routine that names the course rather than the work. */
export const openFor = (sim: Simulation, person: Person, course: string): Assignment | undefined => courseworkOf(sim, person)?.assignments.find((a) => a.course === course && (a.status === 'open' || a.status === 'revising'));

/** How long a step takes: learning lines by how much there is to learn. */
export function minutesOf(a: Assignment, act: Activity): number {
  // A targeted drill keeps its own half hour (from 2026-10-08): it isn't learning the scene.
  if (act.dim === 'memorization' && a.sceneId && act.id !== 'drill') return SCENE_SIZE_MINUTES[sceneById(a.sceneId)!.size];
  return act.minutes;
}

/** Why a need isn't met now, or nothing. */
function needRefusal(sim: Simulation, person: Person, need: Need): string | undefined {
  const cw = courseworkOf(sim, person)!;
  // “The studios are in New Haven.” and “The Haas Arts Library is in New Haven.” went on 2026-10-13, reached by no play:
  // a life is enrolled only where it begins in New Haven (`populateWorld`, `engine/index.ts`), and nothing has moved a
  // person since the scope reset of 2026-10-09.
  switch (need) {
    case 'studio': return cw.orientation.done.tour || cw.orientation.behind ? undefined : 'You don’t know where the studios are yet. Orientation’s building tour shows you: if you missed it, press Catch Up beside it under Orientation.';
    case 'library': return cw.orientation.done.tour || cw.orientation.behind ? undefined : 'You don’t know where the library is yet. Orientation’s building tour shows you: if you missed it, press Catch Up beside it under Orientation.';
    // On its feet: the energy, below (`SPENT`). Clothes to move in were the wardrobe's to have until 2026-10-09.
    case 'feet': return undefined;
    case 'partner': return 'Work with your partner happens at a rehearsal you both agree to. Ask them for an evening under Rehearsing With on this piece.';
  }
}

/** The persistent weaknesses this work can be a way at: open notes given often, on a part this work prepares. */
export function persistentFor(cw: Coursework, a: Assignment): { key: string; dim: PrepDim; given: number }[] {
  const t = templateById(a.template)!;
  return notesOf(cw).flatMap((n) => {
    if (n.status !== 'open' || n.given < LEARNING.persistent) return [];
    const dim = (n.key.startsWith('dim:') ? n.key.slice(4) : n.key.startsWith('choice:') ? 'interpretation' : undefined) as PrepDim | undefined;
    return dim && t.dims[dim] ? [{ key: n.key, dim, given: n.given }] : [];
  }).sort((x, y) => y.given - x.given);
}

/** Why a way at a weakness can't be chosen for this work, or nothing. */
export function approachRefusal(sim: Simulation, person: Person, a: Assignment | undefined, kind: Approach): string | undefined {
  if (!a) return 'There’s no such assignment.';
  if (a.status !== 'open' && a.status !== 'revising') return 'That piece is finished.';
  if (a.approach) return `You’ve already chosen ${APPROACHES[a.approach.kind].label.toLowerCase()} for this piece.`;
  const cw = courseworkOf(sim, person)!;
  const weak = persistentFor(cw, a)[0];
  if (!weak) return 'This piece can’t help with any of your recurring notes.';
  if (kind === 'objective' && !(Object.keys(OBJECTIVE_DIM) as Objective[]).some((o) => OBJECTIVE_DIM[o] === weak.dim && (o !== 'listening' || a.partner !== undefined))) return 'This piece can’t put that part first.';
  if (kind === 'partner') {
    if (a.partner === undefined) return 'This piece has no partner.';
    if (weak.dim === 'partner') return 'That note is already about working with your partner, so this wouldn’t add anything.';
    if (trustOf(person.school!.classmates[a.partner]!) < WORK.trust.wary) return `${person.school!.classmates[a.partner]!.name.split(' ')[0]} would rather work alone, after last time.`;
  }
  // Where the table work is the answers alone (`interpretationOf`), a drill or the partner's work on it moves nothing the
  // showing reads: refused from 2026-10-12. Until then both could be chosen, and both moved a figure the showing didn't
  // read. Put It First and A Smaller Piece still act on the answers, by weight and by scale.
  const t = templateById(a.template)!;
  if ((kind === 'drill' || kind === 'partner') && weak.dim === 'interpretation' && t.material !== 'none' && !t.activities.some((x) => x.dim === 'interpretation')) return 'On this piece, Table Work is your answers to its questions, so a drill or your partner can’t change it. Change an answer under Table Work instead.';
  return undefined;
}

/**
 * Rehearsing the partner part with a reader in the partner's place (from 2026-10-16): a classmate who isn't in the
 * scene, a friend or a recording feeding the other lines, as a self-tape's reader does (the Casting Directors' Guild's
 * self-tape guidance: a reader "does not need to be an actor", and can be "virtual, via a pre-recorded app";
 * docs/research/attributes/research-self-tape-briefs.json) and as a stand-in runs lines when an actor isn't there
 * (standincentral.com, "Predicting When You Might Need To Read Lines", 2018; Backstage, "The New Online Tool For
 * Last-Minute Audition Rehearsals", on actors hiring a scene reader). Until then the partner part moved only at a
 * rehearsal the partner came to, so a partner who never came, or wouldn't, held a mastered player's own scene at 68
 * (baseline.md §4, criterion M3). It works your own side of the scene: what you take in and answer. It goes less far an
 * evening than the partner's own (`gain`, against their 0.4 to 0.45), once a day, and brings the partner up not at all,
 * so the scene together still reads what they did (`partnerPrepOf`). Its sizes are SLATE's.
 */
export const READER = { id: 'reader', label: 'Run It With A Reader', minutes: 60, gain: 0.3 } as const;

/** Your own partner part: the rehearsals your partner came to and a reader's, compounded, each a share of what's left. */
export const partnerPart = (a: Assignment): number => 1 - (1 - clamp01(a.prep.partner)) * (1 - clamp01(a.reader ?? 0));

/** A part as a step's `requires` reads it: your own partner part, the table work as the showing reads it, the rest as they are. */
const partOf = (a: Assignment, dim: PrepDim): number => (dim === 'partner' ? partnerPart(a) : dim === 'interpretation' ? interpretationOf(a) : a.prep[dim]);

/**
 * The steps of an assignment: its template's; a reader in the partner's place, on paired work (`READER`, from
 * 2026-10-16), asking what the partner's step asks but the partner; and a targeted drill where that's the way chosen at a
 * weakness (`approach`).
 */
export function activitiesOf(a: Assignment): readonly Activity[] {
  const t = templateById(a.template)!;
  const withPartner = t.paired ? t.activities.find((x) => x.dim === 'partner') : undefined;
  const reader: Activity[] = withPartner ? [{ id: READER.id, label: READER.label, minutes: READER.minutes, dim: 'partner', gain: READER.gain, daily: true, needs: (withPartner.needs ?? []).filter((n) => n !== 'partner'), ...(withPartner.requires ? { requires: withPartner.requires } : {}) }] : [];
  if (a.approach?.kind !== 'drill') return [...t.activities, ...reader];
  const label = `${APPROACHES.drill.label}: ${t.dims[a.approach.dim]?.label ?? a.approach.dim}`;
  return [...t.activities, ...reader, { id: 'drill', label, minutes: APPROACH.drill.minutes, dim: a.approach.dim, gain: APPROACH.drill.gain, daily: true }];
}

/** Why a step can't be done now, or nothing. */
/**
 * Why table work on a text can't be done yet: it's done on a text you know, read to 30% (from 2026-10-16 one rule, read by
 * `school.choose` and by the Table Work select, which said nothing of it until then and took an answer it then refused).
 */
export const tableWorkRefusal = (a: Pick<Assignment, 'prep'>): string | undefined => (a.prep.familiarity < 0.3 ? 'Read the text first. You can answer the Table Work questions once you know it.' : undefined);

export function prepareRefusal(sim: Simulation, person: Person, a: Assignment | undefined, activityId: string): string | undefined {
  if (!a) return 'There’s no such assignment.';
  if (a.status !== 'open' && a.status !== 'revising') return 'That piece is finished.';
  const t = templateById(a.template)!;
  const act = activitiesOf(a).find((x) => x.id === activityId);
  if (!act) return 'That isn’t a step of this piece.';
  if (act.dim === 'revision' && t.revised && a.status !== 'revising') return 'You can revise once it’s been shown and you have a note to work on.';
  if (a.feedback && !a.feedback.seen) return 'There’s new feedback on this piece. Read it, then press Mark As Read.';
  if (a.asks?.some((k) => k.status === 'open')) { const first = person.school!.classmates[a.partner!]!.name.split(' ')[0]; return `${first} has asked to rehearse. Answer them first, under Rehearsing With ${first}.`; }
  if (momentsOf(courseworkOf(sim, person)!).some((m) => m.status === 'open' && m.assignmentId === a.id)) return `${person.school!.classmates[a.partner!]!.name.split(' ')[0]} reads the scene differently from you. Answer them first, under Your Class.`;
  for (const need of act.needs ?? []) { const no = needRefusal(sim, person, need); if (no) return no; }
  // A step that builds on the table work reads it as the showing does (`interpretationOf`, from 2026-10-12): until then
  // it read `prep.interpretation`, which nothing in Table Work moves, so Write It Up never opened from the answers. A
  // template with no material reads that figure either way.
  // A step that builds on the partner part reads your own (`partnerPart`, from 2026-10-16): worked with a reader, it's there.
  if (act.requires && partOf(a, act.requires.dim) < act.requires.at) return act.requires.why;
  // Work on its feet still rehearses in a way of playing chosen after the part was complete (from 2026-10-12: until then
  // it was refused here, and a choice made late could never be rehearsed in; a played run of the practice briefs found it).
  // A step of the partner part here is a targeted drill on it (`activitiesOf`): the partner step itself is refused above
  // (`needRefusal`), and a rehearsal kept with the partner rehearses the choice in on its own (`rehearsalOutcome`).
  // Until the choice is complete at the scene's own mark (`choiceMark`). Until 2026-10-16 it stopped at
  // `PLAYING.complete`, the mark before suitability moved it, and a side against the grain, asking up to 100%, stalled
  // short of it once its part was full; partner rehearsals alone carried it further.
  const choiceToRehearse = (act.dim === 'rehearsal' || act.dim === 'partner') && sidesOf(a.playing).length > 0 && a.playing!.prep < choiceMark(a);
  if ((act.id === READER.id ? partnerPart(a) : a.prep[act.dim]) >= 0.97 && !choiceToRehearse) return 'You’ve done all this step can do.';
  if (act.daily && a.practicedOn[act.id] === dayKey(sim.now)) return 'You’ve done this today. It builds over several days, not in one long session.';
  // On your feet, the line training reads (`SPENT` in `systems/life.ts`, from 2026-10-08): desk work can be done tired, a studio can't.
  const onFeet = (act.needs ?? []).some((n) => n === 'studio' || n === 'feet');
  if (onFeet && person.wellbeing.energy < SPENT) return 'You’re too tired to work on your feet. Sleep first.';
  // An injury that stops training stops work on your feet too (from 2026-10-10: until then a sprain didn't).
  if (onFeet) { const hurt = trainingRefusal(person, sim.now); if (hurt) return hurt; }
  // Free for as long as the step takes (`minutesOf`, from 2026-10-12): until then Learn Lines was checked for the
  // template's 60 minutes and took the scene's 45, 75 or 105, so a long scene's ran into what was next.
  return startRefusal(sim, person, minutesOf(a, act), onFeet || (act.needs ?? []).includes('library'));
}

/**
 * The ability each kind of preparation is practice in (from 2026-10-09): getting to know the material is attention,
 * drilling lines is memory, the table work is imagination, a partner's evenings are listening, and a revision from a
 * note is taking direction. Rehearsal trains the work's own technique (`Activity.trains`).
 */
export const PREP_ABILITY: Partial<Record<PrepDim, AbilityId>> = { familiarity: 'focus', memorization: 'memory', interpretation: 'imagination', partner: 'listening', revision: 'adaptability' };

/**
 * The ability whose level speeds each kind of step (`stepSpeed`, from 2026-10-16): the one it's practice in, but the
 * partner's evenings, where what moves the part is the partner's coming (`rehearsalOutcome`) and a reader's
 * (`readerRehearsal`), and rehearsal, which trains a technique. From later on 2026-10-16 the partner's evenings and a
 * reader's read listening, each where it moves the part, outside this table.
 */
export const STEP_ABILITY: Partial<Record<PrepDim, AbilityId>> = { familiarity: 'focus', memorization: 'memory', interpretation: 'imagination', revision: 'adaptability' };

/** The trait knob each kind of preparation reads: interpretation is read around, lines drilled, a scene skimmed, a note revised. */
export const PREP_KNOB: Partial<Record<PrepDim, PersonalityKnob>> = { interpretation: 'readsAround', memorization: 'drills', familiarity: 'skims', revision: 'revises' };

/** How far this kind of step goes for this person, by the knob `PREP_KNOB` names: each read where it's asked, so `tools/wired.mjs` sees it. */
export function prepLean(person: Person, dim: PrepDim): number {
  switch (dim) {
    case 'interpretation': return personalityOf(person, 'readsAround');
    case 'memorization': return personalityOf(person, 'drills');
    case 'familiarity': return personalityOf(person, 'skims');
    case 'revision': return personalityOf(person, 'revises');
    default: return 1;
  }
}

/** A step done: its time taken, its part of the preparation moved, and its skill trained while the assignment allows. */
export function prepare(sim: Simulation, person: Person, a: Assignment, activityId: string): { moved: number; dim: PrepDim; minutes: number } {
  const act = activitiesOf(a).find((x) => x.id === activityId)!;
  const minutes = minutesOf(a, act);
  const focus = focusAt(sim, person, sim.now);
  sim.advanceTo(sim.now + minutes * 60_000);
  exerts(person, (act.needs ?? []).some((n) => n === 'studio' || n === 'feet') ? WORK.met.feet : WORK.met.desk, minutes / 60);
  // Work in a craft they loved was a better hour (`Template.crafts`) from 2026-10-09 until the interests went on 2026-10-10.
  // A reader's evening moves your own side of the partner part, kept apart from the partner's (`READER`, from 2026-10-16).
  if (act.id === READER.id) return readerRehearsal(sim, person, a, act, focus, minutes);
  const before = a.prep[act.dim];
  // What this kind of work gives this person (from 2026-10-09): reading around a scene, drilling lines, getting
  // around it fast, revising from a note (`PREP_KNOB`), each a trait's.
  // Work in a genre known goes faster (`genreSpeed`, from 2026-10-09): the scene's play's kinds, the best of them.
  // And from 2026-10-10 the material's features met before (`featureSpeed`), the better of the two: familiarity with a
  // kind of work counted once, never twice.
  const speed = Math.max(genreSpeed(person, a.sceneId ? genresOfPlay(sceneById(a.sceneId)?.play) : undefined), featureSpeed(person, materialOf(a.sceneId)));
  // And by the ability the step is practice in (`STEP_ABILITY`, from 2026-10-16): memory learns lines faster, and so on.
  const able = STEP_ABILITY[act.dim] ? stepSpeed(sim, person, STEP_ABILITY[act.dim]!) : 1;
  a.prep[act.dim] = clamp01(before + act.gain * Math.min(1.1, Math.max(0.5, focus)) * prepLean(person, act.dim) * speed * able * (1 - before));
  a.steps[act.id] = (a.steps[act.id] ?? 0) + 1;
  if (act.daily) a.practicedOn[act.id] = dayKey(sim.now);
  // Work on its feet rehearses the way it's to be played, where one is chosen (from 2026-10-10). The partner part's step
  // here is a targeted drill on it; a rehearsal kept with the partner does it in `rehearsalOutcome` (from 2026-10-12).
  if (act.dim === 'rehearsal' || act.dim === 'partner') {
    rehearseChoice(a.playing, act.gain * Math.min(1.1, Math.max(0.5, focus)));
    rehearseWays(a.book, act.gain * Math.min(1.1, Math.max(0.5, focus)));
  }
  if (act.trains && a.trained < WORK.trainingSteps && person.craft) {
    grewFrom(sim, person, `coursework:${act.id}`, focus, [[act.trains, WORK.trainingWeight]]);
    a.trained += 1;
  }
  // The ability this kind of step is practice in (`PREP_ABILITY`, from 2026-10-09), a step's training weight, while
  // the step still moves the work.
  const ability = PREP_ABILITY[act.dim];
  if (ability && a.prep[act.dim] > before) ordinary(sim, person, ability, focus, WORK.trainingWeight, `prepare:${act.dim}`);
  return { moved: a.prep[act.dim] - before, dim: act.dim, minutes };
}

/**
 * An evening with a reader (`READER`): your own partner part moves by its share of what's left of it, at the day's focus;
 * the way you're playing it is rehearsed in as any work on your feet rehearses it; listening grows a step's training
 * weight, as from any step of the partner part. Nothing moves the partner's preparation, their trust or the bond.
 */
function readerRehearsal(sim: Simulation, person: Person, a: Assignment, act: Activity, focus: number, minutes: number): { moved: number; dim: PrepDim; minutes: number } {
  const before = partnerPart(a);
  const gain = act.gain * Math.min(1.1, Math.max(0.5, focus));
  // By listening, as an evening with the partner is (`stepSpeed`, from 2026-10-16).
  a.reader = clamp01((a.reader ?? 0) + gain * stepSpeed(sim, person, 'listening') * (1 - (a.reader ?? 0)));
  a.steps[act.id] = (a.steps[act.id] ?? 0) + 1;
  a.practicedOn[act.id] = dayKey(sim.now);
  rehearseChoice(a.playing, gain);
  rehearseWays(a.book, gain);
  if (partnerPart(a) > before) ordinary(sim, person, 'listening', focus, WORK.trainingWeight, 'prepare:reader');
  return { moved: partnerPart(a) - before, dim: 'partner', minutes };
}

/** A scene coming back, said: when it was studied, in which part, with whom, and what's new this time. */
export function revisitWords(a: Assignment, lastRole: string, lastPartner?: string): string {
  const r = a.revisit!;
  const when = formatDate(at(parse(r.on), 12), zone());
  const before = `You’ve worked on this scene before. It was set on ${when}, and you played ${lastRole}${lastPartner ? ` with ${lastPartner}` : ''}.`;
  if (r.change === 'role') return `${before} This time you play the other part.`;
  return `${before} You’ve now played both parts, so this time find a different reading: answer at least one Table Work question another way the text supports.`;
}

/** Where a revisit asks for another reading: whether one of today's answers differs, where the text supports another. */
export function readingDiffers(a: Assignment): boolean {
  const prev = a.revisit?.answers;
  if (a.revisit?.change !== 'reading' || !prev) return true;
  return questionsFor(a).some(({ q, options }) => options.filter((o) => o.supported).length > 1 && a.answers[q.id] !== undefined && a.answers[q.id] !== prev[q.id]);
}

/** The questions an assignment's table work answers, and the options for each, for your part. */
export function questionsFor(a: Assignment): { q: Question; options: readonly Option[] }[] {
  const scene = a.sceneId ? sceneById(a.sceneId) : undefined;
  if (!scene || a.role === undefined) return [];
  const role = scene.roles[a.role];
  return QUESTIONS.map((q) => ({ q, options: q.id === 'circumstances' ? scene.circumstances : q.id === 'relationship' ? scene.relationship : role[q.id] }));
}

/** How much of the table work the text supports: each question answered with what it supports, of all of them. */
export function answersScore(a: Assignment): number {
  const qs = questionsFor(a);
  if (!qs.length) return 0;
  return qs.filter(({ q, options }) => options.find((o) => o.id === a.answers[q.id])?.supported).length / qs.length;
}

/** The interpretation a showing reads: the table work's answers, and for verse its scansion too. */
export function interpretationOf(a: Assignment): number {
  const t = templateById(a.template)!;
  if (t.material === 'none') return a.prep.interpretation;
  // A scene back for another reading, played the same way as last time where the text allows another, reads less.
  const same = readingDiffers(a) ? 1 : LEARNING.sameReading;
  if (t.activities.some((x) => x.dim === 'interpretation')) return same * (0.5 * answersScore(a) + 0.5 * a.prep.interpretation);
  return same * answersScore(a);
}

/** Minutes a question takes to answer at the table, SLATE's estimate. */
export const CHOOSE_MINUTES = 10;

// ---------------------------------------------------------------------------
// Showing
// ---------------------------------------------------------------------------

/**
 * What a partner has done on their own by a day, by their drive and reliability, and from 2026-10-12 by how much they
 * trust you: a partner stood up puts less into the scene they share with you, one who trusts you more.
 */
function partnerOwn(person: Person, a: Assignment, onDay: string): number {
  if (a.partner === undefined) return 0;
  const mate = person.school!.classmates[a.partner]!;
  const weeks = Math.max(0, (Date.UTC(parse(onDay).year, parse(onDay).month - 1, parse(onDay).day) - Date.UTC(parse(a.setOn).year, parse(a.setOn).month - 1, parse(a.setOn).day)) / (7 * MS_DAY));
  const effort = 0.8 + 0.4 * (trustOf(mate) / 100);
  return Math.min(WORK.partnerOwnMost, WORK.partnerOwnPerWeek * weeks * (mate.drive ?? 1) * (mateRecord(mate).reliability ?? 0.85) * effort);
}

/** A partner's preparation of the scene: their own, and what rehearsing together has brought them up to. */
export function partnerPrepOf(person: Person, a: Assignment, onDay: string): number {
  return 1 - (1 - partnerOwn(person, a, onDay)) * (1 - ENSEMBLE.together * clamp01(a.prep.partner));
}

/**
 * A scene's partner as the scene together reads them (`systems/ensemble.ts`), on paired work with a partner: their
 * preparation, their timing (listening and focus), whether your readings agree, their reliability, and how much the
 * scene is played off them.
 */
export function partnerReadOf(sim: Simulation, person: Person, a: Assignment, onDay: string): PartnerRead | undefined {
  const t = templateById(a.template)!;
  if (!t.paired || a.partner === undefined) return undefined;
  const mate = person.school!.classmates[a.partner];
  if (!mate) return undefined;
  const p = classmatePerformer(sim, person, a.partner);
  const timing = 0.5 + 0.5 * ((Math.min(100, p.ability('listening')) + Math.min(100, p.ability('focus'))) / 200);
  const apart = Boolean(a.readsApart || a.tryBoth);
  return { name: mate.name, prep: partnerPrepOf(person, a, onDay), timing, agree: apart ? ENSEMBLE.apart : 1, reliability: reliabilityOf(sim, person, a.partner), level: materialOf(a.sceneId)?.partner ?? 2 };
}

/**
 * A scene as a piece in its tones, in order (from 2026-10-12, `systems/piece.ts`): performed work with a scene, its
 * rehearsal refined segment by segment, and its load. From 2026-10-16 a scene of one tone is its two halves, as a play
 * is (`toneSegments`, at least 2), so every scene reads stamina the one way, as the drain through it. Until then a scene of
 * one tone was judged whole, stamina an input of its consistency, and a scene of two tones in segments, stamina only the
 * drain: the same stamina counted for one scene by how many tones it listed (attributes-matrix.md, "inconsistent
 * reading"). Work with no scene (a voice sequence, a song, a movement score, a fight) is still judged whole, stamina an
 * input of its consistency, as its profile says. From 2026-10-16 (evaluation-10) a scene is its units, each tone section cut
 * again at its turns (`unitSegments`), where until then it was its tones only.
 */
export function scenePiece(a: Assignment): PieceSpec | undefined {
  const task = TASK_PROFILES[TEMPLATE_TASK[a.template] ?? 'scene']!;
  const material = materialOf(a.sceneId);
  if (!material || UNPERFORMED.has(task.id)) return undefined;
  return withBook({
    segments: unitSegments(material, 2), work: a.work ?? [], part: 'rehearsal',
    perTurn: PIECE.scene.perTurn, perBlend: PIECE.scene.perBlend, most: PIECE.scene.most, load: loadOf(material, 'scene'),
  }, a.book);
}

/** What a piece of coursework would come to if shown now, with no draw: the forecast the workbook reads (`systems/workbook.ts`). */
export function forecastWork(sim: Simulation, person: Person, a: Assignment, onDay: string): Evaluation {
  const w = weightsOf(a);
  const parts = Object.fromEntries(Object.entries(preparedParts(person, a, onDay)).filter(([d]) => w[d as PrepDim] !== undefined)) as Record<string, number>;
  const required = Object.fromEntries(Object.keys(parts).map((d) => [d, EVALUATION.complete.coursework]));
  const ctx = { ...workContext(a, parts, required), condition: conditionAt(sim, person, sim.now), key: `forecast:${a.id}`, expected: true };
  const piece = scenePiece(a);
  return piece ? judgePiece(sim.universe.meta.seed, performerOf(sim, person), ctx, piece) : evaluate(sim, person, ctx);
}

/** Each part of the preparation as the showing reads it, 0 to 1, for the template's parts. */
export function preparedParts(_person: Person, a: Assignment, _onDay: string): Partial<Record<PrepDim, number>> {
  const t = templateById(a.template)!;
  const out: Partial<Record<PrepDim, number>> = {};
  for (const dim of Object.keys(t.dims) as PrepDim[]) {
    if (dim === 'interpretation') out[dim] = interpretationOf(a);
    // Your own partner part is what you've rehearsed together (from 2026-10-12): what the partner has done alone is
    // theirs, read by the scene together (`partnerReadOf`). From 2026-10-16 a reader's evenings count in it too
    // (`partnerPart`), so a partner who doesn't come can't hold your own result under what you've done.
    else if (dim === 'partner') out[dim] = partnerPart(a);
    else out[dim] = a.prep[dim];
  }
  // A smaller piece of a part asked for (`approach`): six tenths of it reads as the whole of what was asked.
  if (a.approach?.kind === 'smaller' && out[a.approach.dim] !== undefined) out[a.approach.dim] = Math.min(1, out[a.approach.dim]! / APPROACH.smaller);
  return out;
}

/** The craft a showing reads, against the work's par: half at par, a point worth a fortieth either side. */
function craftScore(person: Person, t: Template): number {
  const reads = Object.entries(t.reads) as [Skill, number][];
  const total = reads.reduce((s, [, w]) => s + w, 0);
  const level = reads.reduce((s, [k, w]) => s + person.craft![k] * w, 0) / total;
  return clamp01(0.5 + (level - t.par) / WORK.showing.perPoint);
}

/**
 * A part's weight in which note a showing gives (`noteCandidates`), and the parts it reads (a round's only, for work
 * shown in rounds): the template's, and more for the assignment's objective, normalized. The judged result has read the
 * task's dimensions since 2026-10-09 (`workContext`), not these weights; until 2026-10-12 they also summed a showing's
 * preparation (`Showing.parts.prep`), which nothing but a test read.
 */
export function weightsOf(a: Assignment): Partial<Record<PrepDim, number>> {
  const t = templateById(a.template)!;
  // Work shown in rounds reads the round's parts only.
  const only = t.rounds?.[a.round ?? 0]?.dims;
  const raw = Object.fromEntries((Object.entries(t.dims) as [PrepDim, { weight: number }][]).filter(([d]) => !only || only.includes(d)).map(([d, v]) => [d, v.weight * (a.objective && OBJECTIVE_DIM[a.objective] === d ? LEARNING.objectiveWeight : 1)])) as Partial<Record<PrepDim, number>>;
  const total = Object.values(raw).reduce((x, y) => x + (y ?? 0), 0);
  return Object.fromEntries(Object.entries(raw).map(([d, w]) => [d, w! / total])) as Partial<Record<PrepDim, number>>;
}

/**
 * What held a showing back, most first, as the ledger allows: a part short by
 * its weight (the objective's first, where it's short at all), a choice the
 * text cuts against, the craft it asks. A note on something put right and
 * holding isn't given (`mayGive`). Each with what it measures now.
 *
 * A note on the craft is given where the skills the work is shown for stand behind what it asks of the year (`craft`,
 * under 0.45 on the par's scale), as before; from 2026-10-16 the skill it names is the one the judged result's own
 * limits say cost it most (`skillHeld`, from `judged`). Until then it was the weakest raw skill the template reads, so a
 * note could name a skill the work barely leaned on while the one that cost it most went unsaid
 * (docs/verification/attributes-genres-2026-10-16/baseline.md, F1). With no result to read, or none of its limits a
 * craft skill, no note on the craft is given.
 */
export function noteCandidates(person: Person, a: Assignment, parts: Partial<Record<PrepDim, number>>, craft: number, notes: readonly NoteRecord[], judged?: Pick<Evaluation, 'limits'>): { focus: Focus; level?: number }[] {
  const w = weightsOf(a);
  const out: { focus: Focus; level?: number; short: number }[] = [];
  for (const [dim, v] of Object.entries(parts) as [PrepDim, number][]) {
    const short = (w[dim] ?? 0) * (1 - v) + (a.objective && OBJECTIVE_DIM[a.objective] === dim && v < LEARNING.enough ? 0.05 : 0);
    if (short >= 0.05) out.push({ focus: { kind: 'dim', dim }, level: v, short });
  }
  for (const { q, options } of questionsFor(a)) {
    // At 0, as a choice the text cuts against is: a note on it resolved before can be given again (from 2026-10-12; until
    // then it carried no level, and `mayGive` never gave a resolved one again however the choice was made later).
    if (a.answers[q.id] && !options.find((o) => o.id === a.answers[q.id])?.supported) out.push({ focus: { kind: 'choice', question: q.id }, level: 0, short: 0.1 });
  }
  const held = craft < 0.45 && judged ? skillHeld(judged) : undefined;
  if (held) out.push({ focus: { kind: 'skill', skill: held.skill }, level: (person.craft?.[held.skill] ?? 0) / 100, short: 0.06 });
  return out.filter((c) => mayGive(notes, noteKey(c.focus), c.level)).sort((x, y) => y.short - x.short).map(({ focus, level }) => (level === undefined ? { focus } : { focus, level }));
}

/**
 * The craft skill that held a judged piece back most, by the evaluation's own limits (from 2026-10-16): each technique,
 * and each ability kept in the craft (`CRAFT_ABILITY`), summed over the dimensions it cost, by what it cost the whole.
 * Abilities kept outside the craft (listening, imagination and the rest) are left to what to work on next
 * (`recommendations`), since a course's note names a skill its classes train.
 */
export function skillHeld(judged: Pick<Evaluation, 'limits'>): { skill: Skill; whole: number } | undefined {
  const cost = new Map<Skill, number>();
  for (const l of judged.limits) {
    const skill = l.kind === 'technique' ? (l.what as Skill) : l.kind === 'ability' ? CRAFT_ABILITY[l.what as AbilityId] : undefined;
    if (skill) cost.set(skill, (cost.get(skill) ?? 0) + (l.whole ?? 0));
  }
  const top = [...cost.entries()].sort((x, y) => y[1] - x[1])[0];
  return top ? { skill: top[0], whole: Math.round(top[1] * 10) / 10 } : undefined;
}

/** The one thing that most held a showing back, as the ledger allows, or nothing. */
export function mainNote(person: Person, a: Assignment, parts: Partial<Record<PrepDim, number>>, craft: number, notes: readonly NoteRecord[] = [], judged?: Pick<Evaluation, 'limits'>): Focus | undefined {
  return noteCandidates(person, a, parts, craft, notes, judged)[0]?.focus;
}

/** The note's substance: the course's own words for a part, with what the work measured and the material's specifics; the text's reason for a choice; the skill; or the step beyond. */
export function noteText(a: Assignment, focus: Focus, level?: number, partnerName?: string): string {
  const t = templateById(a.template)!;
  const scene = a.sceneId ? sceneById(a.sceneId) : undefined;
  const as = scene && a.role !== undefined ? ` You played ${scene.roles[a.role].name} in ${scene.play}.` : '';
  if (focus.kind === 'dim') {
    const base = t.notes[focus.dim] ?? `${t.dims[focus.dim]?.label ?? focus.dim} needed more work.`;
    // With a reader's evenings, or the way to one, from 2026-10-16 (`READER`): a partner who doesn't come isn't the end of it.
    const read = a.steps[READER.id] ?? 0;
    const withReader = read ? ` You ran it with a reader ${timesWords(read)}.` : ` To work on your side of it without them, use ${READER.label}.`;
    const kept = a.rehearsals.filter((r) => r.status === 'kept').length;
    const with_ = focus.dim === 'partner' && partnerName ? ` ${kept ? `You and ${partnerName.split(' ')[0]} had rehearsed together ${timesWords(kept)}.` : `You and ${partnerName.split(' ')[0]} hadn’t rehearsed together.`}${withReader}` : '';
    const measured = level !== undefined ? ` (${t.dims[focus.dim]?.label ?? focus.dim}: ${Math.round(level * 100)}% prepared.)` : '';
    return `${base}${with_}${measured}${as}`;
  }
  if (focus.kind === 'choice') {
    const qo = questionsFor(a).find(({ q }) => q.id === focus.question);
    const picked = qo?.options.find((o) => o.id === a.answers[focus.question]);
    // The answer the note is about, named (from 2026-10-19, brief 15's coordinator, at the first material area's report):
    // until then the note gave the reason alone, and most reasons point back at the answer ("That’s the fourth act.").
    if (!qo || !picked) return `${qo?.q.label ?? 'A choice'}: the text doesn’t support that reading.${as}`;
    return `${qo.q.label}: you answered “${picked.text},” but the text doesn’t support it.${picked.why ? ` ${picked.why}` : ''}${as}`;
  }
  if (focus.kind === 'skill') return `This piece asked for more ${SKILL_WORDS[focus.skill] ?? labelOf(focus.skill).toLowerCase()} than you have yet. Keep building it in class over the next few weeks.`;
  // The step beyond in the course's own terms (from 2026-10-20, brief 16, `STEP`): until then every course said acting's.
  return STEP[disciplineOf(courseOf(a.course)?.skills ?? [])][focus.challenge];
}

/** A place in an order: first to ninth in words, as prose says them, then 10th, 11th, 22nd. */
const ordinal = (n: number): string => ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth'][n] ?? (() => { const t = n % 100; return `${n}${t >= 11 && t <= 13 ? 'th' : (['th', 'st', 'nd', 'rd'][n % 10] ?? 'th')}`; })();

/**
 * How hard a piece of work is, by its par (`EvalContext.difficulty`): the showcase's 62 asks what a professional's
 * work does, and each point under it a fortieth less, so a first-year scene at 50 is pitched at a first-year (-0.3).
 * It was 0 at a par of 50 and rose from there for an hour of 2026-10-09, until a played attentive life's prepared
 * scenes came out at 45, under LAMDA's pass, for two years running, held back by abilities, not preparation: a class
 * exercise was being judged as a professional night.
 */
export const difficultyOf = (t: Template): number => Math.max(-0.5, Math.min(1, (t.par - 62) / WORK.showing.perPoint));

/**
 * A piece of coursework judged (`systems/evaluation.ts`), from 2026-10-09: the template's task profile
 * (`TEMPLATE_TASK`), the techniques it reads, its parts of preparation against `EVALUATION.complete.coursework`
 * (a round's parts only, for work shown in rounds), its par as difficulty, the day's condition at the meeting, and
 * its scene's material (`workContext`). Until 2026-10-13 this said its scene's play's kinds leaned what counted and
 * added what they demanded (`withDemands`); from 2026-10-10 a scene’s material read in their place.
 */
export function judgeWork(sim: Simulation, person: Person, a: Assignment, onDay: string, when: Instant, key: string): Evaluation {
  const w = weightsOf(a);
  const parts = Object.fromEntries(Object.entries(preparedParts(person, a, onDay)).filter(([d]) => w[d as PrepDim] !== undefined)) as Record<string, number>;
  const required = Object.fromEntries(Object.keys(parts).map((d) => [d, EVALUATION.complete.coursework]));
  const ctx = { ...workContext(a, parts, required), condition: conditionAt(sim, person, when), key };
  const piece = scenePiece(a);
  return piece ? evaluatePiece(sim, person, ctx, piece) : evaluate(sim, person, ctx);
}

/** The scene together for a showing judged: what the partner brought to your result (`systems/ensemble.ts`). */
export function togetherOf(sim: Simulation, person: Person, a: Assignment, onDay: string, judged: Evaluation): SharedResult | undefined {
  const read = partnerReadOf(sim, person, a, onDay);
  if (!read) return undefined;
  const ctx = workContext(a, {}, {});
  const piece = scenePiece(a);
  // No genre families lean coursework (`workContext`, from 2026-10-13: until then work with no scene carried an empty list).
  const weights = piece ? pieceWeights(ctx.task, ctx.lean, piece) : leanedWeights(ctx.task, [], ctx.lean);
  const norm = (id: 'listening' | 'adaptability') => Math.min(1, abilityOf(sim, person, id) / Math.max(1, abilityFull(sim, person, id)));
  return sharedOf(judged, read, sim.universe.meta.seed, judged.inputs.key, (norm('listening') + norm('adaptability')) / 2, weights);
}

/** How much of a way of playing's rehearsal completes it on this piece: the scene's own mark, as the showing reads it (`workContext`). */
export function choiceMark(a: Assignment): number {
  const material = materialOf(a.sceneId);
  return material ? materialContext(TASK_PROFILES[TEMPLATE_TASK[a.template] ?? 'scene']!, material, a.playing).required : PLAYING.complete;
}

/**
 * What a piece of coursework asks, but the day (from 2026-10-10): its task, its techniques, its preparation, its
 * difficulty, and its material's and its playing's reads (`materialContext`). A scene with a profile reads it and no
 * genre-wide demand, and every scene in the game has one (tests/evidence-g23-school.test.ts). Work without one, a
 * template that sets no scene (`material: 'none'`), reads the template’s own techniques. Until 2026-10-13 that work
 * added what its scene’s play’s kinds demanded (`withDemands`), and with no scene there was no play: it added nothing.
 */
export function workContext(a: Assignment, parts: Record<string, number>, required: Record<string, number>, playing: Playing | undefined = a.playing) {
  const t = templateById(a.template)!;
  const task = TASK_PROFILES[TEMPLATE_TASK[a.template] ?? 'scene']!;
  const material = materialOf(a.sceneId);
  const prep = { ...parts };
  const req = { ...required };
  if (sidesOf(playing).length) { prep.approach = playing!.prep; req.approach = PLAYING.complete; }
  // What the work asks to be put first (its objective, or "Put It First"), from 2026-10-12: each dimension that reads
  // that part of the preparation weighs more, by `LEARNING.objectiveWeight`, normalized as every lean is. Until then the
  // objective and Put It First changed which note was given and the "Weighs" line, and nothing in the result: the same
  // work under three objectives came out at 40.3 each time, while four screens said the part weighed more.
  const first = new Set<string>([...(a.objective ? [OBJECTIVE_DIM[a.objective]] : []), ...(a.approach?.kind === 'objective' ? [a.approach.dim] : [])]);
  const putFirst = (lean: Partial<Record<Dimension, number>>): Partial<Record<Dimension, number>> => {
    if (!first.size) return lean;
    const out = { ...lean };
    for (const [d, spec] of Object.entries(task.dims) as [Dimension, NonNullable<(typeof task.dims)[Dimension]>][]) if ((spec.prep ?? []).some((p) => first.has(p))) out[d] = (out[d] ?? 1) * LEARNING.objectiveWeight;
    return out;
  };
  if (material) {
    const read = materialContext(task, material, playing);
    const techniques = { ...t.reads } as Partial<Record<Skill, number>>;
    for (const [k, w] of Object.entries(material.techniques ?? {}) as [Skill, number][]) if (techniques[k] === undefined) techniques[k] = w;
    if (req.approach !== undefined) req.approach = read.required;
    return { task, techniques, prep, required: req, difficulty: difficultyOf(t), lean: putFirst(read.lean), inputs: read.inputs, extraPrep: read.prep, fit: read.fit, grain: read.grain };
  }
  // Work with no scene has no play and no genre to lean it: a way of playing chosen leans it, and what’s put first, as a
  // scene’s material does. Until 2026-10-13 its scene’s play’s genres were looked up here, and their families’ lean
  // carried into either, but work with a scene never comes here, every scene having a profile, and the lookup came back
  // empty each time, its lean even (found by that day’s second round).
  const read = materialContext(task, undefined, playing);
  const played = sidesOf(playing).length > 0;
  const even = Object.fromEntries(Object.keys(task.dims).map((d) => [d, 1])) as Partial<Record<Dimension, number>>;
  const leant = played || first.size ? putFirst(played ? read.lean : even) : undefined;
  return { task, techniques: { ...t.reads }, prep, required: req, difficulty: difficultyOf(t), ...(leant ? { lean: leant } : {}), ...(played ? { inputs: read.inputs, extraPrep: read.prep } : {}) };
}

/**
 * What each way of playing a piece would show today, prepared fully (from 2026-10-10): the expected result with no
 * draw, so the choice is made seeing what it does with this actor's abilities, and whether it fits.
 */
export function playingPreview(sim: Simulation, person: Person, a: Assignment, onDay: string, playing: Omit<Playing, 'chosenAt' | 'prep'>): Evaluation {
  const w = weightsOf(a);
  const parts = Object.fromEntries(Object.keys(w).map((d) => [d, 1])) as Record<string, number>;
  const required = Object.fromEntries(Object.keys(parts).map((d) => [d, EVALUATION.complete.coursework]));
  void onDay;
  const ctx = { ...workContext(a, parts, required, { ...playing, chosenAt: sim.now, prep: 1 }), condition: { readiness: 100 }, key: `preview:${a.id}`, expected: true };
  const piece = scenePiece(a);
  return piece ? judgePiece(sim.universe.meta.seed, performerOf(sim, person), ctx, piece) : evaluate(sim, person, ctx);
}

/**
 * Why a way of playing can't be chosen for a piece now, or nothing. Not for written work (from 2026-10-17, brief 13's
 * journeys): Table Work sets a scene, but its task, written work, isn't performed (`UNPERFORMED`), and no step of it is on
 * its feet to rehearse a way in (`rehearseChoice`); the other written work, A Play In Its Context, sets none. Until then one could be chosen, its preview read it as
 * rehearsed in full, and it came to the showing at nothing: J12 (seed j13-6) chose a way of playing on seven pieces of
 * written work; played again on seed written-playing, a Table Work previewed 64.6 left open and 64.9 played expansive,
 * and was shown at 44.4 left open against 44.2 with the choice.
 */
export function playingRefusal(a: Assignment | undefined): string | undefined {
  if (!a) return 'There’s no such piece.';
  if (a.status !== 'open' && a.status !== 'revising') return 'It’s already been shown.';
  const t = templateById(a.template);
  if (!t || t.material === 'none') return 'There’s no scene in this piece, so there’s no way of playing it to choose.';
  if (UNPERFORMED.has(TEMPLATE_TASK[t.id] ?? 'scene')) return 'It’s written work: you present it at the table and don’t perform it, so there’s no way of playing it to choose.';
  return undefined;
}

/**
 * A way of playing a save from before 2026-10-17 kept on written work still to be shown, taken off on opening, once
 * (`ONCE_ON_OPENING`, `engine/index.ts`): `playingRefusal` refuses one now, so the player couldn't take it off, and it came
 * to the showing unrehearsed. Work already shown keeps its record as it was judged. Returns how many were taken off.
 */
export function writtenUnplayed(sim: Simulation): number {
  let off = 0;
  for (const person of Object.values(sim.universe.people)) {
    for (const a of courseworkOf(sim, person)?.assignments ?? []) {
      if ((a.status !== 'open' && a.status !== 'revising') || !a.playing || !UNPERFORMED.has(TEMPLATE_TASK[a.template] ?? 'scene')) continue;
      delete a.playing;
      off += 1;
    }
  }
  return off;
}

/** A showing's band from its whole, a smaller piece no better than Working (`approach`). */
/** A showing's band from its score: a smaller piece of a part asked for goes no higher than Working. */
export const bandFor = (a: Assignment, overall: number): Band => {
  const b = bandOfQuality(overall);
  return a.approach?.kind === 'smaller' && (b === 'strong' || b === 'exceptional') ? 'working' : b;
};

/** The showing reckoned once: its band and score, what helped, and the note (until 2026-10-12 its parts too, unread). */
export function show(sim: Simulation, person: Person, a: Assignment, onDay: string, when: Instant): Showing {
  const t = templateById(a.template)!;
  const w = weightsOf(a);
  // The parts this showing reads: all of the work's, or a round's.
  const parts = Object.fromEntries(Object.entries(preparedParts(person, a, onDay)).filter(([d]) => w[d as PrepDim] !== undefined)) as Partial<Record<PrepDim, number>>;
  const craft = craftScore(person, t);
  const rested = clamp01((focusOf(person) - 0.3) / 0.9);
  const judged = judgeWork(sim, person, a, onDay, when, `show:${person.id}:${a.id}:${onDay}`);
  const score = judged.overall / 100;
  // One line for the parts well prepared (from 2026-10-17, brief 14): until then each was its own (“Lines was there”).
  const ready = (Object.entries(parts) as [PrepDim, number][]).filter(([, v]) => v >= 0.75).map(([dim]) => t.dims[dim]!.label);
  const strengths = ready.length ? [`Well prepared: ${andList(ready)}`] : [];
  if (craft >= 0.65) strengths.push(`${carriedWords(Object.keys(t.reads) as Skill[])} carried it`);
  // Rested and ready only where nothing about the day held it back (from 2026-10-10).
  if (rested >= 0.75 && !judged.limits.some((l) => l.kind === 'condition')) strengths.push('You came rested and ready');
  const c = courseOf(a.course)!;
  const cw = courseworkOf(sim, person)!;
  const notes = notesOf(cw);
  // Notes from before whose part this work has put right: taken, and said (`resolveNote`).
  const taken: string[] = [];
  for (const n of notes) {
    if (n.status !== 'open') continue;
    if (n.key.startsWith('dim:')) {
      const v = parts[n.key.slice(4) as PrepDim];
      if (v !== undefined && v >= LEARNING.enough && resolveNote(notes, n.key, onDay, a.id, c.name)) taken.push(n.key);
    }
    // A choice note is taken where this work answers the same question as the text supports (from 2026-10-12; until then
    // a choice note stayed open for ever, however the choices were made after it).
    if (n.key.startsWith('choice:')) {
      const q = n.key.slice('choice:'.length);
      const answered = questionsFor(a).find((x) => x.q.id === q);
      if (answered && answered.options.find((o) => o.id === a.answers[q as Question['id']])?.supported && resolveNote(notes, n.key, onDay, a.id, c.name)) taken.push(n.key);
    }
  }
  for (const key of taken) strengths.push(key.startsWith('choice:') ? `You took the earlier note on ${questionWords(QUESTIONS.find((q) => q.id === key.slice('choice:'.length)) ?? { label: 'A Choice' })}` : `You took the earlier note on ${t.dims[key.slice(4) as PrepDim]?.label ?? key.slice(4)}`);
  if (taken.length) a.taken = taken;
  // A smaller piece shown is no better than Working (`approach`).
  const band = bandFor(a, judged.overall);
  recordWork(sim, person, judged, { at: when, what: t.title, band });
  // The material met, the way it was played and how it went, on the record (`systems/experience.ts`, from 2026-10-10).
  noteMaterial(person, { material: materialOf(a.sceneId), at: when, overall: judged.overall, approaches: sidesOf(a.playing), shown: true });
  const showing: Showing = { band, score: Math.round(score * 1000) / 1000, at: when, strengths };
  // The scene together (from 2026-10-12): apart from your own result, which the band reads; it moves the bond with the
  // partner by how it went together, and a slip of theirs you covered earns their trust.
  const together = togetherOf(sim, person, a, onDay, judged);
  if (together && a.partner !== undefined) {
    showing.together = { overall: together.overall, contribution: together.contribution, partner: together.partner, ...(together.slip ? { slip: together.slip } : {}), words: sharedWords(judged.overall, together) };
    afterTogether(sim, person, a.partner, together, sceneById(a.sceneId ?? '')?.play ?? t.title);
    countTogether(person, together);
  }
  // The note: what held it back most, as the ledger allows; nothing did, the step beyond.
  const pick = noteCandidates(person, a, parts, craft, notes, judged)[0];
  // The course's last step beyond, not given again running.
  const lastHere = cw.assignments.filter((x) => x.course === a.course && x.id !== a.id && x.feedback?.focus.kind === 'advanced').at(-1)?.feedback?.focus;
  const focus: Focus = pick?.focus ?? { kind: 'advanced', challenge: nextChallenge(notes, sim.rng('school.coursework', person.id, `challenge-${a.id}-${onDay}`).next(), challengesFor(t), lastHere?.kind === 'advanced' ? lastHere.challenge : undefined) };
  const { kind, before } = recordNote(notes, focus, onDay, a.id, c.name, pick?.level);
  const partnerName = a.partner !== undefined ? person.school!.classmates[a.partner]?.name : undefined;
  // A new note's measure is said with it, where the card says it; a note given before says its figures in its own words.
  const body = noteText(a, focus, kind === 'new' ? pick?.level : undefined, partnerName);
  const prior = before ? { on: before.last, course: before.history.at(-1)?.course ?? c.name, given: before.given, ...(before.level !== undefined ? { level: before.level } : {}), ...(before.status === 'resolved' && before.resolvedOn ? { taken: before.resolvedOn } : {}) } : undefined;
  // Prepared, and still Unready or Working: what the evaluation says held it back, the day or the craft, not "it held
  // together" (from 2026-10-10: until then the words came from the preparation alone, and contradicted the band).
  const limits = withPartLabels(judged, a);
  const held = kind === 'advanced' && (band === 'unready' || band === 'working') ? chiefLimit(limits) : undefined;
  // What happened, why and what to try, in the course's voice, from the record (from 2026-10-20, brief 16,
  // `systems/feedback.ts`). Until then each note went through one frame: "It came together. Here’s what to try next.",
  // "It didn’t come together today. … When it does come together, here’s what to try next.", "You had this note … and
  // it’s still there.", the same in every course.
  const dayWords = (key: string) => formatDate(at(parse(key), 12), zone());
  // The course's showings before this one, every round of a piece in rounds counted (`roundsShown`, its band and day),
  // since a piece keeps only its latest round as `shown` (found reading brief 16's first transcripts: a second round was
  // compared with the piece before the first, and a run of three Strong rounds was called the second).
  const earlier = cw.assignments.filter((x) => x.course === a.course).flatMap((x) => (x.roundsShown?.length
    ? x.roundsShown.filter((r) => r.on < onDay).map((r) => ({ band: r.band, at: at(parse(r.on), 12), x }))
    : x.shown && x.shown.at < when ? [{ band: x.shown.band, at: x.shown.at, x }] : [])).sort((p, q) => p.at - q.at);
  const prev = earlier.at(-1);
  let run = strongBand(band) ? 1 : 0;
  for (const e of [...earlier].reverse()) { if (!run || !strongBand(e.band)) break; run += 1; }
  const discipline = disciplineOf(c.skills);
  const recent = cw.assignments.filter((x) => x.shown && x.shown.at < when && x.feedback && disciplineOf(courseOf(x.course)?.skills ?? []) === discipline).sort((x, y) => x.shown!.at - y.shown!.at).slice(-8).map((x) => x.feedback!.text);
  // Everything the student was told at a showing before, from the same record, and this course's own last five (`heard`).
  const told = cw.assignments.filter((x) => x.shown && x.shown.at < when && x.feedback).sort((x, y) => x.shown!.at - y.shown!.at);
  const heard = { all: told.map((x) => x.feedback!.text), own: told.filter((x) => x.course === a.course).slice(-5).map((x) => x.feedback!.text) };
  const heldLimit = held ? limits.limits[0] : undefined;
  const heldExercise = heldLimit && (heldLimit.kind === 'ability' || heldLimit.kind === 'technique') ? exerciseFor(heldLimit.what as never)?.label : undefined;
  // The same limit held the course's last piece back, and was said then: said as continuity, with when. A round's record
  // is found by its day and its piece (`recordWork` keeps each round), the time of a round not being kept with its band.
  const prevTitle = prev ? templateById(prev.x.template)?.title : undefined;
  const prevRecord = prev ? (person.work ?? []).find((w) => (prev.x.roundsShown?.length ? dayKeyAt(w.at) === dayKeyAt(prev.at) && w.what === prevTitle : w.at === prev.at)) : undefined;
  const prevChief = prev && prev.x.feedback?.kind === 'advanced' && !strongBand(prev.band) ? prevRecord?.limits[0] : undefined;
  const heldAgain = heldLimit && prevChief && prevChief.kind === heldLimit.kind && prevChief.what === heldLimit.what ? formatDate(prev!.at, zone()) : undefined;
  // How many of the course's pieces just before this one the same limit held back, in a row, each found as the last is
  // (brief 17's after-runs: Acting I's composure, said fresh with its date at each of eight showings running).
  let heldRun = 0;
  if (heldAgain) for (const e of [...earlier].reverse()) {
    const title = templateById(e.x.template)?.title;
    const rec = (person.work ?? []).find((w) => (e.x.roundsShown?.length ? dayKeyAt(w.at) === dayKeyAt(e.at) && w.what === title : w.at === e.at));
    const chief = e.x.feedback?.kind === 'advanced' && !strongBand(e.band) ? rec?.limits[0] : undefined;
    if (!chief || chief.kind !== heldLimit!.kind || chief.what !== heldLimit!.what) break;
    heldRun += 1;
  }
  const day = judged.limits.find((l) => l.kind === 'condition');
  const share = showing.together && a.partner !== undefined ? showing.together : undefined;
  const mate = share ? (/^(?:a|an|the) (.+)$/i.exec(share.partner)?.[1] ? `The ${(/^(?:a|an|the) (.+)$/i.exec(share.partner)![1]!).toLowerCase()}` : share.partner.split(' ')[0]!) : undefined;
  // The way at a note that keeps coming back this piece was worked with, where it's the note given (brief 17).
  const tried = a.approach && focus.kind !== 'advanced' && a.approach.key === noteKey(focus) ? APPROACHES[a.approach.kind].label : undefined;
  const facts: ShowingFacts = {
    key: `${a.id}:${onDay}:${a.round ?? 0}`, today: dayWords(onDay), discipline, course: c.name, piece: t.title, band, bandLabel: BAND_LABEL[band],
    ...(prev ? { prev: { band: prev.band, label: BAND_LABEL[prev.band], on: formatDate(prev.at, zone()) } } : {}),
    run, best: earlier.length > 0 && earlier.every((e) => BAND_RANK[e.band] < BAND_RANK[band]),
    // A first breakthrough (brief 17): Strong or better, where nothing the course showed before was.
    firstStrong: strongBand(band) && earlier.length > 0 && earlier.every((e) => !strongBand(e.band)),
    kind, note: body, ...(focus.kind !== 'advanced' ? { about: focus.kind === 'dim' ? 'part' as const : focus.kind } : {}),
    // The partner part's remedy is said with a note given before, whose own words (which name the reader) aren't said again.
    ...(focus.kind === 'dim' && (focus.dim !== 'partner' || kind !== 'new') ? { remedy: remedyWords(a, focus.dim) } : {}),
    ...(tried ? { tried } : {}),
    // A part left unfinished is answered by the steps that finish it, not a step beyond (brief 17: found reading the first
    // after-runs, Speech's “Drills wasn’t complete… Work on this next: Use less voice…”).
    ...(held && heldLimit ? { held: { words: held, kind: heldLimit.kind, what: heldLimit.what, ...(heldExercise ? { exercise: heldExercise } : {}), ...(heldAgain ? { again: heldAgain, ...(heldRun >= 2 ? { running: heldRun + 1 } : {}) } : {}), ...(heldLimit.kind === 'preparation' && (PREP_DIMS as readonly string[]).includes(heldLimit.what) && t.dims[heldLimit.what as PrepDim] ? { remedy: remedyWords(a, heldLimit.what as PrepDim) } : {}) } } : {}),
    ...(day ? { condition: { what: day.what, whole: day.whole ?? 0, words: day.label } } : {}),
    ...(share && mate ? { partner: { first: mate, lifted: share.overall - judged.overall >= 1, behind: (together?.parts.prep ?? 1) < 0.6, ...(share.slip ? { slip: { at: share.slip.at, covered: share.slip.covered >= 0.5 } } : {}) } } : {}),
    ...(prior ? { before: { on: dayWords(prior.on), course: prior.course, given: prior.given, ...(prior.taken ? { taken: dayWords(prior.taken) } : {}) } } : {}),
    ...(focus.kind === 'dim' ? { part: { label: t.dims[focus.dim]?.label ?? focus.dim, ...(prior?.level !== undefined ? { then: prior.level } : {}), ...(pick?.level !== undefined ? { now: pick.level } : {}) } } : {}),
    // A part as prose names it, never by its card's label (brief 17: "the note on Built On"): what it is in every course,
    // since the ledger counts it across them (`DIM_WORDS`), and what this piece calls it (`here`).
    ...(focus.kind === 'dim' ? { here: partWords(t.dims[focus.dim]?.label ?? noteSubject(noteKey(focus))).words } : {}),
    subject: focus.kind === 'dim' ? (DIM_WORDS[focus.dim]?.[0] ?? partWords(t.dims[focus.dim]?.label ?? noteSubject(noteKey(focus))).words) : focus.kind === 'choice' ? `your answer to “${questionsFor(a).find(({ q }) => q.id === focus.question)?.q.label ?? noteSubject(noteKey(focus))}”` : focus.kind === 'skill' ? (SKILL_WORDS[focus.skill] ?? labelOf(focus.skill).toLowerCase()) : undefined,
    persistent: kind === 'recurring' && (prior?.given ?? 0) >= LEARNING.persistent, enough: LEARNING.enough, recent, heard,
  };
  const text = showingWords(facts);
  a.feedback = { course: c.name, teachers: c.teachers, text, focus, kind, ...(prior ? { before: { on: prior.on, course: prior.course } } : {}), situation: situationOf(facts), step: saysStep(facts) };
  a.shown = showing;
  return showing;
}

/**
 * What a piece would come to shown today, on a good day, with no draw (from 2026-10-16): the showing's own judge
 * (`judgeWork`) with the day taken out, so what's said holds it back is the preparation and the craft. Until then a
 * piece showed each part's figure and its weight and nothing of what the showing would make of them: a part at 0 that
 * "weighed 15%" held the dimensions that read it to a third of themselves.
 */
export function showingForecast(sim: Simulation, person: Person, a: Assignment): Evaluation {
  const w = weightsOf(a);
  const due = a.status === 'revising' ? a.revision!.dueOn : a.dueOn;
  const parts = Object.fromEntries(Object.entries(preparedParts(person, a, due)).filter(([d]) => w[d as PrepDim] !== undefined)) as Record<string, number>;
  const required = Object.fromEntries(Object.keys(parts).map((d) => [d, EVALUATION.complete.coursework]));
  const ctx = { ...workContext(a, parts, required), condition: { readiness: 100 }, key: `forecast:${a.id}`, expected: true };
  const piece = scenePiece(a);
  return piece ? judgePiece(sim.universe.meta.seed, performerOf(sim, person), ctx, piece) : evaluate(sim, person, ctx);
}

/**
 * The parts a shown piece was short on, as its last showing read them (from 2026-10-17, brief 13's journeys): for work
 * shown in rounds, the round last shown, which its band is, and not the next round, which `shortParts` reads as the piece
 * goes on. Until then the term's warning and its review named the parts of the round still to come as the cause of an
 * Unready round: a Simulated Rehearsal shown Unready At The Table counted lines, on its feet and with your partner, the
 * next round's, not yet due (J15 and J16, seeds j13-9 and j13-10).
 */
export function shortAtShowing(person: Person, a: Assignment): PrepDim[] {
  const t = templateById(a.template);
  if (!t?.rounds || !a.roundsShown?.length) return shortParts(person, a);
  return shortParts(person, { ...a, round: a.roundsShown.length - 1 });
}

/** The parts of a piece short of what completes them, as the showing reads them (from 2026-10-16). */
/**
 * A forecast's or a showing's limits, each part of the piece's preparation named as its card names it (from 2026-10-17,
 * brief 14's editorial review). The evaluation names a part by its task's word (`COURSEWORK_PREP`), so a presentation's
 * card said “Still to finish: the presentation prepared” and, beside it, “The revision isn’t complete”: one part two ways,
 * and a first showing seemed to ask for a revision it couldn't have had yet. Only the label changes.
 */
export function withPartLabels<E extends Pick<Evaluation, 'limits'>>(e: E, a: Assignment): E {
  const t = templateById(a.template);
  if (!t) return e;
  return { ...e, limits: e.limits.map((l) => (l.kind === 'preparation' && t.dims[l.what as PrepDim] ? { ...l, label: t.dims[l.what as PrepDim]!.label } : l)) };
}

/**
 * The skills a piece reads that carried it, as a sentence opens on them (from 2026-10-17, brief 14's editorial review):
 * “Your speech and your accents and dialects”, each said once with “your” where one of them has an “and” in it. Until
 * then “Your speech, and accents and dialects carried it.” and “Your on camera and scene study carried it.”
 */
function carriedWords(skills: readonly Skill[]): string {
  const words = skills.map((k) => SKILL_WORDS[k] ?? labelOf(k).toLowerCase());
  if (!words.some((w) => w.includes(' and ')) || words.length < 2) return `Your ${andList(words)}`;
  const yours = words.map((w) => `your ${w}`);
  const said = `${yours.slice(0, -1).join(', ')}${yours.length > 2 ? ',' : ''} and ${yours.at(-1)}`;
  return `${said.charAt(0).toUpperCase()}${said.slice(1)}`;
}

export function shortParts(person: Person, a: Assignment): PrepDim[] {
  const w = weightsOf(a);
  const due = a.status === 'revising' ? a.revision!.dueOn : a.dueOn;
  return (Object.entries(preparedParts(person, a, due)) as [PrepDim, number][]).filter(([d, v]) => w[d] !== undefined && v < EVALUATION.complete.coursework - 0.005).map(([d]) => d);
}

/**
 * The open work in the order to prepare it (from 2026-10-16): soonest due first, and of two due the same day the one
 * that would come out lower shown today. Each comes with that figure and its parts short of complete. Until then the
 * panel listed the work in the order it was set, and nothing on it said which piece was most urgent.
 */
export function urgentWork(sim: Simulation, person: Person): { a: Assignment; due: string; forecast: number; short: PrepDim[] }[] {
  return (courseworkOf(sim, person)?.assignments ?? [])
    .filter((a) => a.status === 'open' || a.status === 'revising')
    .map((a) => ({ a, due: a.status === 'revising' ? a.revision!.dueOn : a.dueOn, forecast: showingForecast(sim, person, a).overall, short: shortParts(person, a) }))
    .sort((x, y) => x.due.localeCompare(y.due) || x.forecast - y.forecast);
}

/**
 * The steps that answer a part, in words (from 2026-10-16): the partner part by asking the partner for an evening, or a
 * reader; the table work by a reading the text supports for each of its questions, where the showing reads them
 * (`interpretationOf`). Until later that day the table work wasn't named: a scene's interpretation, which no step of its
 * own moves, was answered by "its own step", and the term's warning began a sentence with it.
 */
export function remedyWords(a: Assignment, dim: PrepDim): string {
  const acts = activitiesOf(a).filter((x) => x.dim === dim);
  // The partner's own step isn't a button on the card (it's done at a rehearsal they agree to, `needRefusal`), so it's
  // said as the ask under Rehearsing With (from 2026-10-19, brief 15: until then it named Rehearse With Your Partner,
  // which the card never shows).
  if (dim === 'partner') return `ask your partner for an evening under Rehearsing With, at least ${smallWords(WORK.rehearsal.aheadHours)} hours ahead, or ${READER.label}`;
  const labels = [...new Set(acts.map((x) => x.label))];
  if (dim === 'interpretation' && templateById(a.template)?.material !== 'none' && questionsFor(a).length) labels.push('answer each Table Work question the way the text supports');
  return labels.length > 1 ? `${labels.slice(0, -1).join(', ')} or ${labels.at(-1)}` : labels[0] ?? 'the steps on its card';
}

/**
 * A term's coursework as its review reads it (`ESTIMATE.coursework`), for the review and the warning before it (from
 * 2026-10-16, later). A piece shown again stands at its second showing's band; one not there to be shown again is
 * unready. A piece not shown at all, unexcused, counts as due and unready (from 2026-10-10: until then it counted as
 * nothing, and staying away was safer than showing unready work). Until later on 2026-10-16 the warning counted the
 * pieces shown alone, so a term with pieces missed could reach the review's mark with no warning: six shown, two of them
 * Unready, then two missed, was 2 of 6 to the warning and 4 of 8 to the review.
 */
export function termTally(assignments: readonly Assignment[], term: number) {
  const work = assignments.filter((a) => a.term === term);
  const shown = work.filter((a) => a.shown);
  const bandOf = (a: Assignment) => (a.revision?.missed ? 'unready' : a.revision?.band ?? a.shown!.band);
  const notShown = work.filter((a) => a.status === 'missed' && !a.shown).length;
  const unreadyShown = shown.filter((a) => bandOf(a) === 'unready');
  return { work, notShown, unreadyShown, shown: shown.length + notShown, unready: unreadyShown.length + notShown, strong: shown.filter((a) => bandOf(a) === 'strong' || bandOf(a) === 'exceptional').length };
}

/**
 * The part most often short on the Unready pieces given, and what answers it (from 2026-10-16). Counted by what the part
 * is on each piece's template and the steps that answer it there, and from 2026-10-17 on the round last shown for work in
 * rounds (`shortAtShowing`). Until later that day it was counted by the part's key
 * alone, which names different work on different templates (rehearsal has nine labels and steps among them), and the
 * first piece's words were said of all of them: "rehearsed in the body … Rehearse The Score answers it" of a song too.
 */
export function mostShort(person: Person, pieces: readonly Assignment[]): { label: string; remedy: string; n: number } | undefined {
  const by = new Map<string, { label: string; remedy: string; n: number }>();
  for (const a of pieces) {
    const t = templateById(a.template);
    if (!t) continue;
    for (const d of shortAtShowing(person, a)) {
      const label = t.dims[d]!.label, remedy = remedyWords(a, d);
      const c = by.get(`${label}|${remedy}`) ?? { label, remedy, n: 0 };
      c.n += 1;
      by.set(`${label}|${remedy}`, c);
    }
  }
  return [...by.values()].sort((p, q) => q.n - p.n)[0];
}

/**
 * What the Unready pieces were short on, as the term's warning and its review say it (from 2026-10-17, brief 13's journeys):
 * - **`every`:** each piece was short of complete on every part its showing reads, so no one part held them back;
 * - **`scattered`:** no part was short on more than one of them, so none is a pattern;
 * - **`part`:** the part most often short, where one is short on two or more (`mostShort`).
 *
 * Until then the part most often short was named whatever its count. A term left wholly unprepared (journey J15, seed
 * j13-9) was told "Most often short on them: knows the scene, on 1 of the 6 shown. Read The Scene answers it." of six
 * pieces each short on every part, its review "knows the scene, on 8" of 47. And a term whose three Unready pieces were
 * short on three different parts (J02, j13-2) was told "Most often short on them: lines, on 1 of the 3 shown." Both named
 * a part by its tie broken in the list's order, and a remedy that answered one piece.
 */
export function shortCause(person: Person, pieces: readonly Assignment[]): { kind: 'every' } | { kind: 'scattered' } | { kind: 'part'; label: string; remedy: string; n: number } | undefined {
  if (!pieces.length) return undefined;
  // A piece of no template the catalog has reads no parts, as `mostShort` passes it by. A piece in rounds reads the round
  // last shown (`shortAtShowing`).
  const shownRound = (a: Assignment): Assignment => (templateById(a.template)?.rounds && a.roundsShown?.length ? { ...a, round: a.roundsShown.length - 1 } : a);
  const judged = (a: Assignment) => { if (!templateById(a.template)) return 0; const w = weightsOf(shownRound(a)); return Object.keys(preparedParts(person, a, a.status === 'revising' ? a.revision!.dueOn : a.dueOn)).filter((d) => w[d as PrepDim] !== undefined).length; };
  if (pieces.every((a) => judged(a) > 0 && shortAtShowing(person, a).length === judged(a))) return { kind: 'every' };
  const top = mostShort(person, pieces);
  if (!top) return undefined;
  if (top.n < 2 && pieces.length > 1) return { kind: 'scattered' };
  return { kind: 'part', ...top };
}

/**
 * A warning in the term, early enough to act on (from 2026-10-16, the owner's brief "Finish School Workload Balance"):
 * once `TERM_CHECK.after` of a term's pieces have been due and the share unready reaches the review's mark less
 * `TERM_CHECK.margin`, a notice says how many, what they were short on (`shortCause`: the part most often short and the
 * steps that answer it, or, from 2026-10-17, that every part of each was short, or that no part was short on more than
 * one), the pieces set and not yet shown, and the day the faculty reviews the term. Once a term. It counts as the review does
 * (`termTally`), and is looked at after every piece due, shown, shown again or missed. Until later on 2026-10-16 it
 * counted the pieces shown alone and was looked at only when one was shown first; it said the pieces set and not yet
 * shown were "still to come", when one is set at a time in each course, so a term with weeks of work left could read
 * "None is still to come"; and it said a notice of concern would follow, where the review steps the standing down one,
 * from concern to warning and from warning to dismissal. Until then the first a student heard was
 * the review's own notice, after the term, which named the count and not the cause: played on 2026-10-16, a student
 * dismissed with attendance at 100% had left the partner part at nothing on most scenes, with 292 working hours idle.
 */
export const TERM_CHECK = { after: 6, margin: 0.15 } as const;

export function termWarning(sim: Simulation, person: Person, a: Assignment): void {
  const cw = courseworkOf(sim, person);
  if (!cw || person.id !== sim.universe.playerId || cw.warned?.includes(a.term)) return;
  const tally = termTally(cw.assignments, a.term);
  if (tally.shown < TERM_CHECK.after) return;
  const mark = ESTIMATE.coursework.unready;
  if (tally.unready < (mark - TERM_CHECK.margin) * tally.shown) return;
  // A warning after one before says so (from 2026-10-20, brief 16, "Repetition says what changed"): until then each
  // term's read as the first, three in a row for brief 16's underprepared student.
  const prior = [...(cw.warned ?? [])];
  const which = prior.length ? `This is your ${ordinal(prior.length + 1)} coursework warning${prior.includes(a.term - 1) ? ', after one last term' : ''}.` : 'This is a warning.';
  (cw.warned ??= []).push(a.term);
  const top = shortCause(person, tally.unreadyShown);
  // The part most often unfinished among the pieces shown Unready, with its count of them, as the term review says it
  // (from 2026-10-20, brief 17): until then "What held most of them back was “…”, unfinished on 2 of the 5 you showed",
  // which said "most" wherever the count was under half, and "most of them" of a single piece.
  const named = top?.kind !== 'part' ? '' : tally.unreadyShown.length === 1 ? ` “${top.label}” was left unfinished on the one you showed Unready.` : ` The part most often left unfinished was “${top.label}”, on ${top.n} of the ${tally.unreadyShown.length} you showed Unready.`;
  const cause = top?.kind === 'part' ? `${named} To work on it: ${top.remedy}.`
    : top?.kind === 'every' ? ' None of them had a single part finished, so it’s the preparation as a whole, not one part. Work through each piece’s steps before it’s due.'
      : top?.kind === 'scattered' ? ' Each fell short on a different part, so there’s no one thing to fix. Each piece’s feedback says what held it back.' : ' Each piece’s feedback says what held it back.';
  const set = tally.work.filter((x) => !x.shown && (x.status === 'open' || x.status === 'revising')).length;
  const counted = tally.notShown ? `So far this term, ${tally.unready} of the ${tally.shown} pieces due were Unready or not shown` : `So far this term, ${tally.unready} of the ${tally.shown} pieces you’ve shown were Unready`;
  const review = at(classPeriod(a.term).to, 17);
  const share = mark === 0.5 ? 'half' : `${Math.round(mark * 100)}%`;
  const school = person.school as SchoolRecord;
  // What happened, what it means against the review, then what to do (from 2026-10-19, brief 15): until then the cause
  // and its steps came first and the warning's own meaning after them, in one paragraph of seven sentences. In brief 15's
  // final runs the health journey read it as 121 words in one block, past the playthroughs' wall of text (120), and at
  // its longest it ran to 144; it runs to 119 now (`tests/language-dynamic.test.ts`). Until then it said "the faculty reviews the term on", "the term falls short of what the
  // program asks, and the review would", and that Shown Today said "how it would do if you showed it today", which the
  // line's own name says.
  sim.notify({ category: 'school', title: 'A Word On Your Coursework', body: `${counted}. ${which} The term review is on ${formatDate(review, zone())}. If ${share} or more of the term’s pieces are Unready or not shown by then, the review would ${shortTermWords(school, a.term)}.${cause} ${set ? `${set === 1 ? 'One piece is' : `${smallWords(set).replace(/^\w/, (c) => c.toUpperCase())} pieces are`} set and still to be shown.` : 'Everything set so far has been shown.'} On the Coursework tab, each open piece’s Shown Today line says what’s holding it back.`, importance: 75, route: '/workspace/school' });
}

/** Whether a note was taken by its revision: the part risen enough, the choice now supported, or the note worked on. */
export function noteTaken(person: Person, a: Assignment, onDay: string): boolean {
  const focus = a.feedback?.focus;
  if (!focus) return true;
  const r = WORK.revision;
  if (focus.kind === 'dim') {
    const now = preparedParts(person, a, onDay)[focus.dim] ?? 0;
    // Past enough counts only where it wasn't already (from 2026-10-10: until then a note on a part shown at 0.85 was
    // "taken" with no work, and paid the revision's growth).
    const before = a.revision?.before ?? 0;
    return now >= before + r.dimRise || (now >= r.dimEnough && before < r.dimEnough) || a.prep.revision >= r.worked;
  }
  if (focus.kind === 'choice') return Boolean(questionsFor(a).find(({ q }) => q.id === focus.question)?.options.find((o) => o.id === a.answers[focus.question])?.supported);
  // A note on a skill is taken where the skill grew since it was given (from 2026-10-12): the work for the next weeks it
  // names. Until then two steps of revision at the desk took it, whatever the skill did.
  if (focus.kind === 'skill') {
    const given = noteRecord(notesOf(courseworkOf2(person)), noteKey(focus))?.level;
    const now = (person.craft?.[focus.skill] ?? 0) / 100;
    return given !== undefined ? now >= given + SKILL_NOTE_RISE - 1e-9 : a.prep.revision >= r.worked;
  }
  return a.prep.revision >= r.worked;
}

/** How far a skill must have grown, of 100, for a note on it to be taken: two points (SLATE's). */
export const SKILL_NOTE_RISE = 0.02;
/** The coursework a person has, read without making one. */
const courseworkOf2 = (person: Person): Coursework => ((person.school as { coursework?: Coursework } | undefined)?.coursework ?? { assignments: [], used: [], orientation: { done: {} } });

/**
 * A course's meeting on a day, asked by the class-day reckoning: work due
 * there shown or revised once, and what that makes of the meeting's growth
 * (1 where nothing is due). Absent, nothing is shown; excused, it moves on.
 */
export function meetingWeight(sim: Simulation, person: Person, course: string, day: SchoolDate, when: Instant, present: boolean, excused: boolean): number {
  const cw = courseworkOf(sim, person);
  if (!cw) return 1;
  const key = keyOf(day);
  const mine = person.id === sim.universe.playerId;
  const due = cw.assignments.find((a) => a.course === course && a.status === 'open' && a.dueOn === key);
  if (due) {
    if (!present) {
      const next = meetingsFrom(course, plus(day, 1), person.school)[0];
      if (excused && next) { due.dueOn = next; return 1; }
      // Excused with no meeting left: not shown, and not held against them or their partner (from 2026-10-10: until
      // then it was missed as if they'd stayed away).
      if (excused) {
        due.status = 'excused';
        if (mine) sim.notify({ category: 'school', title: `Excused: ${courseOf(course)?.name}`, body: 'You were ill for the last class it could be shown at, so it won’t be shown this term. It isn’t held against you.', importance: 45, route: '/workspace/school' });
        return 1;
      }
      due.status = 'missed';
      if (due.partner !== undefined) { const mate = person.school!.classmates[due.partner]!; moveTrust(mate, WORK.trust.missed, { person, by: WORK.bond.missed }); noteIncident(mate, sim.now, 'missed'); remember(sim, mate, `You weren’t there to show ${sceneById(due.sceneId ?? '')?.play ?? 'the work'} with them`); }
      // What it counts for, said with it (from 2026-10-16, the owner's brief's “no dead-end warning”): until then the notice
      // said only that it isn't taken later, while the term's review counts it as due and Unready and the course's pass
      // reads it (`termTally`, `settleCourses`). The course's count is its pieces due so far, shown or missed, as the
      // evaluation reads them.
      if (mine) {
        const so = cw.assignments.filter((x) => x.course === course && x.term === due.term && (x.shown || x.status === 'missed'));
        sim.notify({ category: 'school', title: `Not Shown: ${courseOf(course)?.name}`, body: `You weren’t in class when it was due, and it can’t be shown later, so the term review counts it as Unready. You don’t pass a course if half or more of its pieces due in the term aren’t shown. In ${courseOf(course)?.name ?? course}, that’s ${so.filter((x) => !x.shown).length} of ${so.length} so far.`, importance: 60, route: '/workspace/school' });
      }
      termWarning(sim, person, due);
      return 1;
    }
    const showing = show(sim, person, due, key, when);
    const t = templateById(due.template)!;
    if (t.rounds) {
      // A round shown: the next is due its gap of meetings on, the work still open, its note to be taken there.
      const r = due.round ?? 0;
      (due.roundsShown ??= []).push({ label: t.rounds[r]!.label, band: showing.band, on: key });
      const nextRound = t.rounds[r + 1];
      const next = nextRound ? meetingsFrom(course, plus(day, 1), person.school)[nextRound.gap - 1] : undefined;
      if (nextRound && next) { due.round = r + 1; due.dueOn = next; } else due.status = 'done';
    } else if (t.revised && due.feedback) {
      const next = meetingsFrom(course, plus(day, 1), person.school)[0];
      if (next) {
        const f = due.feedback.focus;
        due.revision = { dueOn: next, before: f.kind === 'dim' ? preparedParts(person, due, key)[f.dim] ?? 0 : 0 };
        due.status = 'revising';
      } else due.status = 'done';
    } else due.status = 'done';
    if (due.partner !== undefined) remember(sim, person.school!.classmates[due.partner]!, `You showed ${sceneById(due.sceneId ?? '')?.play ?? t.title} together (${BAND_LABEL[showing.band]})`);
    const roundLabel = t.rounds && due.roundsShown?.length ? ` (${due.roundsShown.at(-1)!.label})` : '';
    const rec = due.feedback ? notesOf(cw).find((n) => n.key === noteKey(due.feedback!.focus)) : undefined;
    // A weakness that keeps coming back: a note the same again, never the step beyond (which is kept in the ledger too, and
    // which a measured term found sent as 'still there' after exceptional work).
    const persistent = rec && rec.status === 'open' && rec.given > LEARNING.persistent && due.feedback!.kind === 'recurring' && !rec.key.startsWith('advanced:');
    if (mine && persistent) {
      // A weakness that keeps coming back (from 2026-10-08): said once a week at most, short, and pointing at what can be done
      // about it; until then each showing sent the whole note again, the same subject a dozen times a term.
      const quiet = (rec as NoteRecord & { notifiedAt?: number }).notifiedAt;
      if (quiet === undefined || when - quiet >= LEARNING.quietDays * MS_DAY) {
        (rec as NoteRecord & { notifiedAt?: number }).notifiedAt = when;
        sim.notify({ category: 'school', title: `Still There: ${noteSubject(rec.key)}`, body: `You showed ${t.title} and it was ${BAND_LABEL[showing.band]}, but the same note came back, for the ${ordinal(rec.given)} time. It stays open under Your Notes. To try something different, find an open piece on the Coursework tab that works on it, and choose a way under A Note That Keeps Coming Back.`, importance: 30, route: '/workspace/school' });
      }
    } else if (mine) {
      // The note says what happened against the course's last piece and what the preparation did (from 2026-10-20, brief
      // 16), so the notice is the note, with a note taken said first in the game's own words. Until then it began with
      // the band against the last piece and every strength in a list, before the note said its own frame again.
      const tookWords = showing.strengths.filter((x) => x.startsWith('You took the earlier note'));
      sim.notify({ category: 'school', title: `Shown: ${t.title}${roundLabel}, ${BAND_LABEL[showing.band]}`, body: `${tookWords.length ? `${tookWords.join('. ')}. ` : ''}${due.feedback ? `Simulated note from ${due.feedback.course}: ${due.feedback.text}` : ''}`, importance: 60, route: '/workspace/school' });
    }
    // After the showing's own notice (from 2026-10-16, later: until then the warning came before it, from `show`).
    termWarning(sim, person, due);
    return WORK.weight[showing.band];
  }
  const revising = cw.assignments.find((a) => a.course === course && a.status === 'revising' && a.revision?.dueOn === key);
  if (revising) {
    if (!present) {
      const next = meetingsFrom(course, plus(day, 1), person.school)[0];
      if (excused && next) { revising.revision!.dueOn = next; return 1; }
      // Not there to show it again: unexcused, the evaluation reads it as unready (from 2026-10-10: until then it was
      // marked done in silence, and staying away was safer than showing it weak).
      if (!excused) revising.revision!.missed = true;
      revising.status = 'done';
      if (mine && !excused) sim.notify({ category: 'school', title: `Not Shown Again: ${courseOf(course)?.name}`, body: 'You weren’t in class to show it again, so the term review counts it as Unready.', importance: 55, route: '/workspace/school' });
      termWarning(sim, person, revising);
      return 1;
    }
    const applied = noteTaken(person, revising, key);
    revising.revision!.applied = applied;
    // Shown again, reckoned as a showing: its band kept, which the term's evaluation reads in place of the first
    // (`evaluate`, from 2026-10-10; the showcase read it, `showcaseSceneSeen`, until the showcase went on 2026-10-09).
    // Until 2026-10-08 the second showing was only taken or not, and its band was never set.
    revising.revision!.band = reshow(sim, person, revising, key, when);
    if (applied && revising.feedback) resolveNote(notesOf(courseworkOf(sim, person)!), noteKey(revising.feedback.focus), key, revising.id, courseOf(course)?.name ?? course);
    revising.status = 'done';
    if (mine) sim.notify({ category: 'school', title: `${applied ? 'Note Taken' : 'Note Not Taken Yet'}: ${templateById(revising.template)!.title}`, body: reshownWords(person, revising, key, applied), importance: 50, route: '/workspace/school' });
    termWarning(sim, person, revising);
    return applied ? WORK.revision.applied : WORK.revision.notApplied;
  }
  return 1;
}


/**
 * A piece shown again, said (from 2026-10-17, brief 14): what the note was on, how far the part it named moved since the
 * first showing where it measures one, and the band. Until then a note not taken repeated its whole text with “It’s
 * still there.”, and one taken said only that it showed: brief 13's journeys counted “The Note Was Taken” 31 times in
 * one life, every one the same.
 */
function reshownWords(person: Person, a: Assignment, onDay: string, applied: boolean): string {
  const t = templateById(a.template)!;
  const f = a.feedback?.focus;
  const about = !f ? 'the note' : f.kind === 'dim' ? `the note on ${t.dims[f.dim]?.label ?? f.dim}` : f.kind === 'choice' ? `the note on ${questionWords(QUESTIONS.find((q) => q.id === f.question) ?? { label: 'A Choice' })}` : f.kind === 'skill' ? `the note on your ${SKILL_WORDS[f.skill] ?? labelOf(f.skill).toLowerCase()}` : undefined;
  const from = f?.kind === 'dim' && a.revision ? Math.round(a.revision.before * 100) : undefined;
  const to = f?.kind === 'dim' ? Math.round((preparedParts(person, a, onDay)[f.dim] ?? 0) * 100) : undefined;
  const part = f?.kind === 'dim' ? t.dims[f.dim]?.label ?? f.dim : '';
  const moved = from === undefined || to === undefined ? '' : from === to ? ` ${part} is still at ${to}%.` : ` ${part} went from ${from}% to ${to}%.`;
  // The band against the first showing's (from 2026-10-19, brief 15): “again” only where it's the same.
  const first = a.shown?.band;
  const again = a.revision?.band;
  const band = !again ? '' : first === again ? ` It was ${BAND_LABEL[again]} again.` : first ? ` It was ${BAND_LABEL[again]} this time, after ${BAND_LABEL[first]} the first time.` : ` It was ${BAND_LABEL[again]}.`;
  const shown = `You showed ${t.title} again on ${formatDate(at(parse(onDay), 12), zone())}`;
  if (!about) return applied ? `${shown}, and worked in the next step you were given.${band}` : `${shown}, but the next step you were given doesn’t show in it yet.${band}`;
  // Taken by the revision's own work with the part itself no further on (`noteTaken`'s third way), it says so: until
  // 2026-10-17 it read “and took the note on rehearsal. Rehearsal stayed at 0%.”
  const byRevision = applied && from !== undefined && to !== undefined && to <= from;
  return applied
    ? `${shown}, and ${byRevision ? `worked ${about} into the revision` : `took ${about}`}.${moved}${band}`
    : `${shown}, but you haven’t taken ${about} yet.${moved}${band} The note stays open under Your Notes until you take it.`;
}

/**
 * The revised work's band: judged as a showing is, without a new note (the note given stands until the next work). The
 * Actor Showcase shows its scenes again with the note taken in Los Angeles through it (`systems/proshowcase.ts`, from
 * 2026-10-21).
 */
export function reshow(sim: Simulation, person: Person, a: Assignment, onDay: string, when: Instant = sim.now): Band {
  const judged = judgeWork(sim, person, a, onDay, when, `reshow:${person.id}:${a.id}:${onDay}`);
  const band = bandFor(a, judged.overall);
  recordWork(sim, person, judged, { at: when, what: `${templateById(a.template)!.title}, revised`, band });
  // The material met, the way it was played and how it went, on the record (`systems/experience.ts`, from 2026-10-10).
  noteMaterial(person, { material: materialOf(a.sceneId), at: when, overall: judged.overall, approaches: sidesOf(a.playing), shown: true });
  return band;
}

/** Work still open when its term's classes end lapses: there's no meeting left to show it. */
/**
 * School over (dismissed, or the degree): every piece still open lapses, every rehearsal booked is off, every ask
 * unanswered lapses (from 2026-10-10: until then a dismissed student's work stayed open, and a partner rehearsal booked
 * after the dismissal still ran).
 */
export function endCoursework(sim: Simulation, person: Person): void {
  for (const a of courseworkOf(sim, person)?.assignments ?? []) {
    if (a.status === 'open') a.status = 'lapsed';
    else if (a.status === 'revising') a.status = 'done';
    for (const r of a.rehearsals) if (r.status === 'booked') r.status = 'cancelled';
    for (const k of a.asks ?? []) if (k.status === 'open') k.status = 'lapsed';
  }
}

export function lapseTerm(sim: Simulation, person: Person, term: number): void {
  const end = keyOf(classPeriod(term).to);
  for (const a of courseworkOf(sim, person)?.assignments ?? []) {
    // A piece due after the term's classes has its showing still ahead: the final term's showcase scenes, due in New York
    // after the last class (`systems/proshowcase.ts`, from 2026-10-21). No other piece is due past the classes.
    if (a.term !== term || (a.status === 'open' && a.dueOn > end)) continue;
    if (a.status === 'open') a.status = 'lapsed';
    else if (a.status === 'revising') a.status = 'done';
  }
}

// ---------------------------------------------------------------------------
// Orientation
// ---------------------------------------------------------------------------

/** Orientation's sessions on the calendar, for a life arriving before them. */
export function scheduleOrientation(sim: Simulation, person: Person): void {
  const cw = courseworkOf(sim, person);
  if (!cw || cw.orientation.behind) return;
  for (const o of ORIENTATION) {
    const when = at({ year: ORIENTATION_2026.begins.year, month: 8, day: o.day }, o.hour);
    if (when <= sim.now) continue;
    sim.schedule({ at: when, kind: ORIENTATION_KIND, label: o.label, category: 'school', priority: 32, requiresPlayer: true, durationMinutes: o.minutes, locationId: YALE_DRAMA.cityId, payload: { personId: person.id, task: o.task } });
  }
}

/** What a session does, once: what it tells, and what it arranges. */
function orient(sim: Simulation, person: Person, task: OrientationTask): string {
  const cw = courseworkOf(sim, person)!;
  const school = person.school!;
  cw.orientation.done[task] = sim.now;
  const cur = saveCurrency(sim.universe);
  switch (task) {
    case 'register': {
      // Registered: classes count them, and the work-study's I-9 is done (`registered`, from 2026-10-10).
      school.registeredAt ??= sim.now;
      const acc = termAccount(cur, hasNeed(person), 0);
      return `Your tuition, ${formatMoney(acc.tuition, cur)} a term, is covered by the tuition scholarship. ${hasNeed(person) ? `Your living-expense scholarship, ${formatMoney(acc.livingScholarship, cur)}, pays the Yale Health plan, ${formatMoney(acc.healthPlan, cur)}, and the rest comes to your bank.` : `The aid office found no financial need, so you pay the Yale Health plan, ${formatMoney(acc.healthPlan, cur)} a term, yourself.`} Work-study is ${WORK_STUDY.assignedHours} assigned hours a year at ${formatMoney(WORK_STUDY.hourly, 'USD')} an hour: a shift each Saturday while classes run.`;
    }
    case 'classmates': {
      for (const mate of school.classmates) mateRecord(mate).met ??= sim.now;
      return `You met the ${school.classmates.length} others in your class: you’ll partner them in scenes, rehearse with them and be cast beside them.`;
    }
    // The faculty set out what the School asks (`SCHOOL_POLICIES`, from 2026-10-10), which the Standing tab keeps.
    case 'faculty': return `You met the acting faculty, with the chair, ${YALE_DRAMA.actingChair.name}. First-year courses are taught by ${spokenList([...new Set(COURSES.filter((c) => c.year === 1).map((c) => c.teachers))])}. They set out what the School asks of you: come to every class, rehearsal and call, and tell your teachers and the chair when you’re ill. They also explained Pass/Fail courses, making up an Incomplete within a month, the casting pool, the Cabaret and work-study. It’s all on the Standing And Craft tab.`;
    case 'tour': return 'You were shown the studios you can book to rehearse in, the theaters, and the Haas Family Arts Library.';
    case 'expectations': {
      const first = ORIENTATION_2026.classesBegin;
      const set = COURSES.filter((c) => c.year === 1 && c.terms.includes('fall')).map((c) => setWork(sim, person, c.code, plus(first, -1))).filter(Boolean);
      return `Each course set out what it asks.${set.length ? ` ${set.length === 1 ? 'One course' : `${smallWords(set.length).replace(/^\w/, (c) => c.toUpperCase())} courses`} gave you ${set.length === 1 ? 'its' : 'their'} first piece now, so you can start before classes.` : ''}`;
    }
  }
}

/** Why an orientation session can't be caught up now, or nothing. */
export function orientationRefusal(sim: Simulation, person: Person, task: OrientationTask): string | undefined {
  const cw = courseworkOf(sim, person);
  if (!cw) return 'You’re not at school.';
  const o = ORIENTATION.find((x) => x.task === task);
  if (!o) return 'There’s no such session.';
  if (cw.orientation.behind) return 'Orientation is over.';
  const done = cw.orientation.done[task];
  if (done) return `Done on ${formatDate(done, zone())}.`;
  if (sim.now < at({ year: ORIENTATION_2026.begins.year, month: 8, day: o.day }, o.hour)) return 'This session is still to come. It’s on your calendar.';
  // “Orientation is in New Haven.” went on 2026-10-13, reached by no play: a life is enrolled only where it begins in New
  // Haven (`populateWorld`, `engine/index.ts`), and nothing has moved a person since the scope reset of 2026-10-09.
  return startRefusal(sim, person, o.minutes, true);
}

// ---------------------------------------------------------------------------
// Commands and the calendar
// ---------------------------------------------------------------------------

/** Why a partner can't be asked to rehearse at a moment, or nothing; and if they'd rather not, why. */
export function askRefusal(sim: Simulation, person: Person, a: Assignment | undefined, when: Instant): { refused?: string; declines?: string } {
  if (!a) return { refused: 'There’s no such assignment.' };
  if (a.status !== 'open' && a.status !== 'revising') return { refused: 'That piece is finished.' };
  if (a.partner === undefined) return { refused: 'This piece has no partner.' };
  const mate = person.school!.classmates[a.partner]!;
  const first = mate.name.split(' ')[0];
  const cw = courseworkOf(sim, person)!;
  if (!mateRecord(mate).met && !cw.orientation.behind) return { refused: `You haven’t met ${first} yet. You’ll meet your class at orientation, or at your first class.` };
  if (!Number.isFinite(when) || when < sim.now + WORK.rehearsal.aheadHours * 3_600_000) return { refused: `Ask at least ${WORK.rehearsal.aheadHours} hours ahead.` };
  const due = at(parse(a.status === 'revising' ? a.revision!.dueOn : a.dueOn), 9);
  if (when + WORK.rehearsal.minutes * 60_000 > due) return { refused: 'That’s after the piece is due.' };
  if (a.rehearsals.some((r) => r.status === 'booked' && Math.abs(r.at - when) < WORK.rehearsal.minutes * 60_000)) return { refused: 'You’re already rehearsing then.' };
  const clash = sim.universe.scheduled.find((x) => x.status === 'pending' && x.requiresPlayer && x.durationMinutes && x.at < when + WORK.rehearsal.minutes * 60_000 && x.at + x.durationMinutes * 60_000 > when);
  if (clash) return { refused: `You have ${clash.label} then.` };
  const act = templateById(a.template)!.activities.find((x) => x.dim === 'partner');
  // Not an evening the School already knows it would excuse (from 2026-10-17, brief 13's journeys): in hospital then, laid
  // up, or, for work on its feet, hurt in a way that stops training, as `rehearsalOutcome` excuses it on the night. Until
  // then the ask was taken, the partner gave the evening, and it was called off when it came: journey J23 (seed j13-17),
  // a bone broken in a fall on 1 March 2027 and fifty days to mend, asked for twenty-two evenings to 19 April, each told
  // “… Knows You’re Ill”.
  if (inHospital(person, when)) return { refused: 'You’ll still be in hospital then, so the rehearsal would be called off.' };
  const hurt = injuryOf(person, when);
  if (hurt && laidUp(person, when)) return { refused: `You’ll still be laid up with ${INJURY_KIND[hurt.kind].label.toLowerCase()} then, so the rehearsal would be called off.` };
  const onFeet = (act?.needs ?? []).some((n) => n === 'studio' || n === 'feet');
  const noTraining = onFeet ? trainingRefusal(person, when) : undefined;
  if (noTraining) return { refused: `${noTraining} Rehearsing on your feet with your partner has to wait for that too.` };
  // The partner activity's own rule, as the step on your own keeps it (from 2026-10-12): a fight isn't drilled with a
  // partner before the choreography is known, an intimacy scene before its boundaries are set. Until then asking to
  // rehearse skipped it.
  if (act?.requires && a.prep[act.requires.dim] < act.requires.at) return { refused: act.requires.why };
  const busy = mateBusy(person, a.partner, when, WORK.rehearsal.minutes);
  if (busy) return { declines: busy };
  if (trustOf(mate) < WORK.trust.wary) return { declines: `${first} would rather work on it alone, after last time.` };
  // A boundary they set, after being let down (`systems/classmates.ts`): a day's notice.
  const boundary = boundaryRefusal(mate, sim.now, when);
  if (boundary) return { declines: boundary };
  return {};
}

function rehearsalOutcome(sim: Simulation, person: Person, a: Assignment, r: PartnerRehearsal, when: Instant): void {
  const mate = person.school!.classmates[a.partner!]!;
  const m = mateRecord(mate);
  const first = mate.name.split(' ')[0];
  const mine = person.id === sim.universe.playerId;
  // Ill (in hospital or laid up, or the day called in sick), it's excused, and they're told (from 2026-10-10: until then
  // it cost trust and bond as standing them up, which `health.ts` says an admission never is). A day called in sick
  // excuses it too from 2026-10-12, as the guide's School chapter says; until then only hospital and being laid up did.
  // And a body that can't train can't drill a scene on its feet with a partner: an injury that stops training excuses
  // it, where until then a sprained student drilled a fight at speed.
  const partnerAct = templateById(a.template)!.activities.find((x) => x.dim === 'partner');
  const onFeet = (partnerAct?.needs ?? []).some((n) => n === 'studio' || n === 'feet');
  if (inHospital(person, when) || laidUp(person, when) || person.school?.sickDay === dayKey(when) || (onFeet && trainingRefusal(person, when))) {
    r.status = 'excused';
    remember(sim, mate, `You were ill and couldn’t rehearse ${sceneById(a.sceneId ?? '')?.play ?? templateById(a.template)!.title}`);
    if (person.id === sim.universe.playerId) sim.notify({ category: 'school', title: `${mate.name.split(' ')[0]} Knows You’re Ill`, body: 'The rehearsal you booked is off, and they don’t hold it against you.', importance: 40, route: '/workspace/school' });
    return;
  }
  const here = person.currentLocationId === YALE_DRAMA.cityId && !(person.awakeSince !== undefined && person.awakeSince > when);
  const theyCome = sim.rng('school.partner', person.id, `${a.id}-${r.id}`).next() < reliabilityOf(sim, person, a.partner!);
  const what = sceneById(a.sceneId ?? '')?.play ?? templateById(a.template)!.title;
  if (!here) {
    r.status = 'missedByYou';
    m.missedByYou = (m.missedByYou ?? 0) + 1;
    moveTrust(mate, WORK.trust.missed, { person, by: WORK.bond.missed });
    noteIncident(mate, when, 'missed');
    remember(sim, mate, `You didn’t come to rehearse ${what}`);
    if (mine) sim.notify({ category: 'school', title: `${first} Waited For You`, body: `You missed your rehearsal of ${what}, and ${first} waited for you. It cost some of their trust, and they’ll remember it. You can make amends under Your Partners.`, importance: 60, route: '/workspace/school' });
    return;
  }
  if (!theyCome) {
    r.status = 'missedByThem';
    m.stoodUp = (m.stoodUp ?? 0) + 1;
    remember(sim, mate, `They didn’t come to rehearse ${what}`);
    // From the second, how many (from 2026-10-20, brief 16, `stoodUp`): until then each read as the first, nine times in a
    // year from one classmate in brief 16's baseline.
    // Said as a sentence of its own (from 2026-10-20, brief 17): until then "…and they didn’t come, the second time they
    // haven’t come."
    const times = m.stoodUp >= 2 ? ` It’s the ${ordinal(m.stoodUp)} time they haven’t come.` : '';
    if (mine) sim.notify({ category: 'school', title: `${first} Didn’t Come`, body: `You waited for ${first} to rehearse ${what}, and they didn’t come.${times} It isn’t held against you, but the scene got no further. Ask them for another evening under Rehearsing With ${first}, or use ${READER.label} to work on your side of it.`, importance: 50, route: '/workspace/school' });
    return;
  }
  r.status = 'kept';
  m.kept = (m.kept ?? 0) + 1;
  // How far the evening goes reads listening as it stood coming in (`stepSpeed`, from 2026-10-16), before the evening's
  // own practice in it, as a step's speed reads the level it starts at.
  const listened = stepSpeed(sim, person, 'listening');
  // An evening of working off a partner is listening practice (`content/abilities.ts`).
  ordinary(sim, person, 'listening', focusOf(person), 1, 'partner-rehearsal');
  const t = templateById(a.template)!;
  const act = t.activities.find((x) => x.dim === 'partner');
  const before = a.prep.partner;
  const gain = (act?.gain ?? 0.4) * Math.min(1.1, Math.max(0.5, focusOf(person)));
  // And by listening (`stepSpeed`, from 2026-10-16): an evening of working off a partner goes further the more of them
  // you take in. Until then listening's description said partner work read it, and only the scene judged did.
  a.prep.partner = clamp01(before + gain * listened * (1 - before));
  // The evening on its feet with them rehearses in the way it's to be played, where one is chosen, as a step on your
  // feet does in `prepare` (from 2026-10-12). Until then only the steps done alone did: the partner step itself is
  // always refused in `prepareRefusal` (`needRefusal`, 'partner'), so a scene rehearsed only with a partner was shown
  // with its way of playing never rehearsed in.
  rehearseChoice(a.playing, gain);
  rehearseWays(a.book, gain);
  exerts(person, WORK.met.feet, WORK.rehearsal.minutes / 60);
  moveTrust(mate, WORK.trust.kept, { person, by: WORK.bond.kept });
  keptWith(mate);
  // The weakness worked on with the partner too, where that's the way chosen (`approach`), once.
  if (a.approach?.kind === 'partner' && !a.partnerWorked) { a.prep[a.approach.dim] = clamp01(a.prep[a.approach.dim] + APPROACH.partner * (1 - a.prep[a.approach.dim])); a.partnerWorked = true; }
  // Both readings tried, as agreed with them (`systems/classmates.ts`): the readings come together, once, and where the
  // table work reads a figure of its own (`interpretationOf`: a course with a step at the table, or work with no scene),
  // that figure moves. Where the table work is the answers alone, nothing reads `prep.interpretation`: until 2026-10-12
  // it moved there all the same, and only the partner's after-rehearsal words (`peerNote`) read it. From then those
  // words read the choices as the showing does (`interpretationOf`), so there what they say of your choices comes from
  // your answers at the table, which trying both leaves as they are.
  if (a.tryBoth) {
    if (t.material === 'none' || t.activities.some((x) => x.dim === 'interpretation')) a.prep.interpretation = clamp01(a.prep.interpretation + CLASS.bothGain * (1 - a.prep.interpretation));
    delete a.tryBoth; delete a.readsApart;
  }
  remember(sim, mate, `You rehearsed ${what} together`);
  r.said = peerNote(a, first!);
}

/**
 * What a partner says after a rehearsal: the part of your preparation that
 * held the scene back most, of those a partner feels (knowing the scene, the
 * lines, the choices, time on its feet), or that it's coming together. The
 * game's words, from your preparation as it stands; change the preparation
 * and what they say changes. The choices are read as the showing reads them
 * (`interpretationOf`): your answers at the table, and for verse the scansion
 * too (from 2026-10-12). Until then they read `prep.interpretation`, which on a
 * scene whose table work is the answers alone the showing never read, and
 * which nothing moved there once the drill, the partner's way and Try Both
 * stopped moving it on 2026-10-12: a partner on Scene Study and the like said
 * your choices weren't clear however you'd made them.
 */
export function peerNote(a: Assignment, first: string): string {
  const t = templateById(a.template)!;
  const felt = (['familiarity', 'memorization', 'interpretation', 'rehearsal'] as const).filter((d) => t.dims[d]);
  const level = (d: (typeof felt)[number]): number => (d === 'interpretation' ? interpretationOf(a) : a.prep[d]);
  const weakest = [...felt].sort((x, y) => level(x) - level(y))[0];
  if (!weakest || level(weakest) >= 0.7) return `${first} says it’s coming together.`;
  return {
    familiarity: `${first} thinks you don’t know the scene well enough yet to play it.`,
    memorization: `${first} says you were on book most of the time, and they couldn’t catch your eye.`,
    interpretation: `${first} isn’t sure what you’re playing for: your choices weren’t clear to them.`,
    rehearsal: `${first} says it needs more time on its feet.`,
  }[weakest];
}

/**
 * In class, a partner may ask to rehearse (from 2026-10-07): on a day nothing
 * is booked between you and none of their asks is open, an evening in the
 * next three they're free, before the work's due. Not a partner who'd rather
 * work alone. Until then only the player asked.
 */
export function partnerAsks(sim: Simulation, person: Person, course: string, day: SchoolDate): void {
  const cw = person.school?.coursework;
  const a = cw?.assignments.find((x) => x.course === course && (x.status === 'open' || x.status === 'revising') && x.partner !== undefined);
  if (!a) return;
  const mate = person.school!.classmates[a.partner!]!;
  if (trustOf(mate) < WORK.trust.wary) return;
  // Nor before the partner work's own rule is met: a fight's choreography known, an intimacy scene's boundaries agreed (from 2026-10-12).
  const partnerAct = templateById(a.template)!.activities.find((x) => x.dim === 'partner');
  if (partnerAct?.requires && a.prep[partnerAct.requires.dim] < partnerAct.requires.at) return;
  if (a.asks?.some((k) => k.status === 'open') || a.rehearsals.some((r) => r.status === 'booked' && r.at > sim.now)) return;
  if (sim.rng('school.partner', person.id, `ask-${a.id}-${keyOf(day)}`).next() >= WORK.ask.chance) return;
  const due = at(parse(a.status === 'revising' ? a.revision!.dueOn : a.dueOn), 9);
  for (let n = 1; n <= WORK.ask.withinDays; n += 1) {
    const when = at(plus(day, n), WORK.ask.hour);
    if (when + WORK.rehearsal.minutes * 60_000 > due) return;
    if (mateBusy(person, a.partner!, when, WORK.rehearsal.minutes)) continue;
    const k: PartnerAsk = { id: sim.nextId('rehearsal'), at: when, until: when - WORK.rehearsal.aheadHours * 3_600_000, status: 'open' };
    if (k.until <= sim.now) continue;
    (a.asks ??= []).push(k);
    sim.schedule({ at: k.until, kind: ASK_KIND, label: `Answer ${mate.name.split(' ')[0]}`, category: 'school', priority: 33, requiresPlayer: false, payload: { personId: person.id, assignmentId: a.id, askId: k.id } });
    const first = mate.name.split(' ')[0];
    const what = sceneById(a.sceneId ?? '')?.play ?? templateById(a.template)!.title;
    if (person.id === sim.universe.playerId) sim.notify({ category: 'school', title: `${first} Asks To Rehearse`, body: `${first} asks to rehearse ${what} on ${formatDate(when, zone())} at ${formatTime(when, zone())}. Answer by ${formatTime(k.until, zone())} that day, under Rehearsing With ${first} on the Coursework tab. Saying no costs nothing.`, importance: 60, route: '/workspace/school' });
    return;
  }
}

/** Why a partner's ask can't be answered so, or nothing. */
export function answerRefusal(sim: Simulation, person: Person, a: Assignment | undefined, askId: string, yes: boolean): string | undefined {
  const k = a?.asks?.find((x) => x.id === askId);
  if (!a || !k) return 'There’s no such request.';
  if (k.status === 'lapsed') return 'You didn’t answer in time.';
  if (k.status !== 'open') return 'You’ve answered it.';
  if (!yes) return undefined;
  const q = askRefusal(sim, person, a, k.at);
  if (q.refused?.startsWith('You have ')) return `${q.refused.replace(/\.$/, '')}, so you’ll have to say no.`;
  return q.refused ?? q.declines;
}

/** A rehearsal booked with the partner, asked by either. */
function book(sim: Simulation, person: Person, a: Assignment, when: Instant): PartnerRehearsal {
  const mate = person.school!.classmates[a.partner!]!;
  const r: PartnerRehearsal = { id: sim.nextId('rehearsal'), at: when, status: 'booked' };
  a.rehearsals.push(r);
  sim.schedule({ at: when, kind: PARTNER_KIND, label: `Rehearsal With ${mate.name.split(' ')[0]}`, category: 'school', priority: 32, requiresPlayer: true, durationMinutes: WORK.rehearsal.minutes, locationId: YALE_DRAMA.cityId, payload: { personId: person.id, assignmentId: a.id, rehearsalId: r.id } });
  return r;
}

export function registerCoursework(sim: Simulation): void {
  sim.onSchedule(ORIENTATION_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const cw = person ? courseworkOf(s, person) : undefined;
    const task = item.payload.task as OrientationTask;
    if (!person || !cw || cw.orientation.done[task]) return;
    // In hospital it's missed too, to be caught up (from 2026-10-10: until then it was held at the bedside).
    const here = person.currentLocationId === YALE_DRAMA.cityId && !(person.awakeSince !== undefined && person.awakeSince > item.at) && !inHospital(person, item.at);
    if (!here) { item.status = 'missed'; return; }
    const told = orient(s, person, task);
    if (person.id === s.universe.playerId) s.notify({ category: 'school', title: ORIENTATION.find((o) => o.task === task)!.label, body: told, importance: 45, route: '/workspace/school' });
  });

  sim.onCommand<{ task: OrientationTask }, { told: string }>('school.orientation', (p, { sim: s }) => {
    const person = s.player;
    const task = p?.task as OrientationTask;
    const no = orientationRefusal(s, person, task);
    if (no) throw new CommandError(no);
    const o = ORIENTATION.find((x) => x.task === task)!;
    // Caught up by hand, as long as the session it stands for: with the office, the class or the faculty.
    s.advanceTo(s.now + o.minutes * 60_000);
    return { told: orient(s, person, task) };
  });

  sim.onCommand<{ assignmentId?: string; course?: string; activity: string }, { moved: number; dim: PrepDim; minutes: number; feedback?: boolean }>('school.prepare', (p, { sim: s }) => {
    const person = s.player;
    const a = p?.assignmentId ? assignmentById(s, person, String(p.assignmentId)) : p?.course ? openFor(s, person, String(p.course)) : undefined;
    const no = prepareRefusal(s, person, a, String(p?.activity));
    if (no) throw new CommandError(no);
    return prepare(s, person, a!, String(p.activity));
  });

  sim.onCommand<{ assignmentId: string; kind: Approach }, { dim: PrepDim }>('school.approach', (p, { sim: s }) => {
    const person = s.player;
    const a = assignmentById(s, person, String(p?.assignmentId));
    const kind = (['drill', 'objective', 'partner', 'smaller'] as const).find((k) => k === p?.kind);
    if (!kind) throw new CommandError('That isn’t a way to work on it.');
    const no = approachRefusal(s, person, a, kind);
    if (no) throw new CommandError(no);
    const weak = persistentFor(courseworkOf(s, person)!, a!)[0]!;
    a!.approach = { key: weak.key, dim: weak.dim, kind, on: dayKey(s.now) };
    if (kind === 'objective') a!.objective = (Object.keys(OBJECTIVE_DIM) as Objective[]).find((o) => OBJECTIVE_DIM[o] === weak.dim)!;
    return { dim: weak.dim };
  });

  sim.onCommand<{ assignmentId: string; pace?: string; scale?: string; structure?: string }, { prep: number; kept: boolean }>('school.choose_playing', (p, { sim: s }) => {
    const person = s.player;
    const a = assignmentById(s, person, String(p?.assignmentId));
    const no = playingRefusal(a);
    if (no) throw new CommandError(no);
    const pick = <T extends string>(v: unknown, of: readonly T[]): T | undefined => (of as readonly unknown[]).includes(v) ? v as T : undefined;
    const next = { pace: pick(p?.pace, ['measured', 'driven'] as const), scale: pick(p?.scale, ['restrained', 'expansive'] as const), structure: pick(p?.structure, ['set', 'open'] as const) };
    const was = a!.playing;
    a!.playing = choose(was, next, s.now);
    if (!sidesOf(a!.playing).length) delete a!.playing;
    // Only a side newly chosen counts toward the habits (from 2026-10-12): until then a side kept while another axis
    // changed was counted again with it, as `chooseBrief` says.
    noteMaterial(person, { approaches: sidesOf(a!.playing).filter((x) => !sidesOf(was).includes(x)) });
    return { prep: a!.playing?.prep ?? 0, kept: (a!.playing?.prep ?? 0) === (was?.prep ?? 0) };
  });

  sim.onCommand<{ assignmentId: string; question: Question['id']; option: string }, { supported: boolean }>('school.choose', (p, { sim: s }) => {
    const person = s.player;
    const a = assignmentById(s, person, String(p?.assignmentId));
    if (!a || (a.status !== 'open' && a.status !== 'revising')) throw new CommandError(a ? 'That piece is finished.' : 'There’s no such assignment.');
    const qo = questionsFor(a).find(({ q }) => q.id === p.question);
    if (!qo) throw new CommandError('That isn’t a question this piece asks.');
    const option = qo.options.find((o) => o.id === p.option);
    if (!option) throw new CommandError('That isn’t one of the answers.');
    const unread = tableWorkRefusal(a);
    if (unread) throw new CommandError(unread);
    if (a.answers[qo.q.id] === option.id) throw new CommandError('That’s your answer already.');
    const busy = startRefusal(s, person, CHOOSE_MINUTES);
    if (busy) throw new CommandError(busy);
    s.advanceTo(s.now + CHOOSE_MINUTES * 60_000);
    a.answers[qo.q.id] = option.id;
    return { supported: option.supported };
  });

  sim.onCommand<{ assignmentId: string }, { seen: true }>('school.read_feedback', (p, { sim: s }) => {
    const a = assignmentById(s, s.player, String(p?.assignmentId));
    if (!a?.feedback) throw new CommandError('There’s no feedback on that.');
    if (a.feedback.seen) throw new CommandError('You’ve already read it.');
    a.feedback.seen = true;
    return { seen: true };
  });

  sim.onCommand<{ assignmentId: string; at: Instant }, { accepted: boolean; reason?: string; rehearsalId?: string }>('school.ask_partner', (p, { sim: s }) => {
    const person = s.player;
    const a = assignmentById(s, person, String(p?.assignmentId));
    const when = Number(p?.at);
    const q = askRefusal(s, person, a, when);
    if (q.refused) throw new CommandError(q.refused);
    const mate = person.school!.classmates[a!.partner!]!;
    if (q.declines) { remember(s, mate, `Couldn’t rehearse at ${formatTime(when, zone())}: ${q.declines}`); return { accepted: false, reason: q.declines }; }
    const r = book(s, person, a!, when);
    return { accepted: true, rehearsalId: r.id };
  });

  sim.onCommand<{ assignmentId: string; askId: string; yes: boolean }, { booked: boolean; rehearsalId?: string }>('school.answer_partner', (p, { sim: s }) => {
    const person = s.player;
    const a = assignmentById(s, person, String(p?.assignmentId));
    const yes = p?.yes === true;
    const no = answerRefusal(s, person, a, String(p?.askId), yes);
    if (no) throw new CommandError(no);
    const k = a!.asks!.find((x) => x.id === p!.askId)!;
    for (const item of s.universe.scheduled) if (item.status === 'pending' && item.kind === ASK_KIND && item.payload.askId === k.id) s.timeline.cancel(item.id, s.now);
    const mate = person.school!.classmates[a!.partner!]!;
    if (!yes) {
      k.status = 'declined';
      remember(s, mate, `You couldn’t rehearse on ${formatDate(k.at, zone())}, and said so`);
      return { booked: false };
    }
    k.status = 'accepted';
    return { booked: true, rehearsalId: book(s, person, a!, k.at).id };
  });

  sim.onSchedule(ASK_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const a = person ? assignmentById(s, person, String(item.payload.assignmentId)) : undefined;
    const k = a?.asks?.find((x) => x.id === item.payload.askId);
    if (!person || !a || !k || k.status !== 'open') return;
    k.status = 'lapsed';
    const mate = person.school!.classmates[a.partner!]!;
    moveTrust(mate, WORK.ask.unanswered);
    remember(s, mate, 'Asked you to rehearse, and heard nothing back');
    if (person.id === s.universe.playerId) s.notify({ category: 'school', title: `${mate.name.split(' ')[0]} Didn’t Hear Back`, body: `You didn’t answer ${mate.name.split(' ')[0]} about rehearsing on ${formatDate(k.at, zone())}, so that rehearsal isn’t happening. Leaving them without an answer cost a little of their trust, where a no would have cost nothing.`, importance: 40, route: '/workspace/school' });
  });

  sim.onCommand<{ assignmentId: string; rehearsalId: string }, { late: boolean }>('school.cancel_rehearsal', (p, { sim: s }) => {
    const person = s.player;
    const a = assignmentById(s, person, String(p?.assignmentId));
    const r = a?.rehearsals.find((x) => x.id === p?.rehearsalId);
    if (!a || !r || r.status !== 'booked') throw new CommandError('There’s no such rehearsal booked.');
    r.status = 'cancelled';
    for (const item of s.universe.scheduled) if (item.status === 'pending' && item.kind === PARTNER_KIND && item.payload.rehearsalId === r.id) s.timeline.cancel(item.id, s.now);
    const late = r.at - s.now < MS_DAY;
    const mate = person.school!.classmates[a.partner!]!;
    if (late) { moveTrust(mate, WORK.trust.lateCancel); noteIncident(mate, s.now, 'lateCancel'); }
    remember(s, mate, late ? 'You called off a rehearsal at short notice' : 'You called off a rehearsal, with notice');
    return { late };
  });

  sim.onSchedule(PARTNER_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const a = person ? assignmentById(s, person, String(item.payload.assignmentId)) : undefined;
    const r = a?.rehearsals.find((x) => x.id === item.payload.rehearsalId);
    if (!person || !a || !r || r.status !== 'booked') return;
    // Work finished meanwhile (shown, missed or lapsed): there's nothing left to rehearse.
    if (a.status !== 'open' && a.status !== 'revising') { r.status = 'cancelled'; return; }
    rehearsalOutcome(s, person, a, r, item.at);
  });
}

/** The work a template's showing reads, for a screen: each skill's label. */
export const readsLabel = (t: Template): string => (Object.keys(t.reads) as Skill[]).map(labelOf).join(', ');
