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
import type { Person } from '../domain/model';
import { formatDate, formatTime, instantFromZoned, zonedParts, MS_DAY, type Instant } from '../core/time';
import { formatMoney, saveCurrency } from '../core/money';
import { CITIES } from '../content/geography';
import { COURSES, ORIENTATION_2026, SKILLS, WORK_STUDY, YALE_DRAMA, type Course, type SchoolDate, type Skill } from '../content/school';
import { PREP_DIMS, QUESTIONS, SCENE_SIZE_MINUTES, sceneById, templateById, templateFor, type Activity, type Need, type Option, type PrepDim, type Question, type Template } from '../content/coursework';
import { bondMove, classPeriod, coursesOn, focusOf, focusAt, grow, hasNeed, keyOf, termAccount, termOf, termStart, repProduction, type Classmate } from './school';
import { SPENT, occupiedAt } from './life';
import { exerts } from './body';
import { enjoyCrafts } from './enjoyment';
import { personalityOf } from './personality';
import type { PersonalityKnob } from '../content/personality-traits';
import { inHospital } from './health';
import {
  ADVANCED, APPROACH, APPROACHES, LEARNING, OBJECTIVE_DIM, challengesFor, mayGive, noteSubject, objectiveLabel, nextChallenge, noteKey, objectiveFor, partnerFor, recordNote, resolveNote, revisitOf, scenePast, scenesFor, targetDifficulty,
  type Approach, type NoteFocus, type NoteKind, type NoteRecord, type Objective, type Revisit,
} from './learning';
import { actingOf } from './school';
import { boundaryRefusal, keptWith, momentsOf, noteIncident } from './classmates';
import { laidUp } from './injury';

/** What SLATE estimates for the coursework, named where it's read. */
export const WORK = {
  /** The steps of an assignment that train their skill, at most, and how much one does against a class meeting's. */
  trainingSteps: 3, trainingWeight: 0.25,
  /**
   * A showing's reading: preparation, the craft against the work's par (a point worth a fortieth), readiness, and luck
   * either side. Craft and readiness count only as far as the work was prepared, to half of it, since nobody shows
   * their craft in a scene they don't know: until a first played test, a rested, able student who'd done nothing
   * showed as Working.
   */
  showing: { prep: 0.5, craft: 0.3, ready: 0.2, perPoint: 40, luck: 0.08, carries: 0.5 },
  /** The bands, and what each makes of the meeting's growth against an ordinary meeting. */
  bands: { unready: 0.4, working: 0.58, strong: 0.74 },
  weight: { unready: 0.85, working: 1, strong: 1.1, exceptional: 1.2 },
  /** A revision's meeting, the note taken or not. */
  revision: { applied: 1.1, notApplied: 0.95, dimRise: 0.2, dimEnough: 0.8, worked: 0.6 },
  /** What a partner prepares on their own, a week of it at an ordinary drive, and the most. */
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
  /** A partner's share of a scene: their own work against what you've done together. */
  partnerMix: { together: 0.6, own: 0.4 },
  /** Effort, as METs: work at a desk, on one's feet in a room. */
  met: { desk: 1.5, feet: 2.5 },
} as const;

export type Band = 'unready' | 'working' | 'strong' | 'exceptional';
export const BAND_LABEL: Record<Band, string> = { unready: 'Unready', working: 'Working', strong: 'Strong', exceptional: 'Exceptional' };

/** What a note is about (`NoteFocus` in `systems/learning.ts`): a part of the preparation, a choice at the table, a skill, or the next step beyond the work. */
export type Focus = NoteFocus;

export interface Showing {
  band: Band; score: number; at: Instant;
  parts: { prep: number; craft: number; ready: number; partner?: number };
  /** What helped, in words. */
  strengths: string[];
}

/**
 * A showing's note: its words, what it's about, and how it stands against the
 * notes before it on the same thing (`kind`; `before` is the last time it was
 * given). From 2026-10-08.
 */
export interface Feedback { course: string; teachers: string; text: string; focus: Focus; seen?: boolean; kind?: NoteKind; before?: { on: string; course: string } }

export interface PartnerRehearsal {
  id: string; at: Instant; status: 'booked' | 'kept' | 'missedByYou' | 'missedByThem' | 'cancelled';
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
  status: 'open' | 'revising' | 'done' | 'missed' | 'lapsed';
  /** What the work asks you to put first (`objectiveFor`), and, for a scene studied before, what's new about it (`revisitOf`). From 2026-10-08. */
  objective?: Objective;
  revisit?: Revisit & { answers?: Partial<Record<Question['id'], string>> };
  /** Notes from before put right by this showing, by their ledger key. */
  taken?: string[];
  /** Another way at a persistent weakness, chosen for this work (`APPROACHES`, from 2026-10-08): which note, how, when. */
  approach?: { key: string; dim: PrepDim; kind: Approach; on: string };
  /** Work shown in rounds (`Template.rounds`): the round it's at, and each round shown, with how it went. From 2026-10-08. */
  round?: number;
  roundsShown?: { label: string; band: Band; on: string }[];
  shown?: Showing;
  feedback?: Feedback;
  revision?: { dueOn: string; before: number; applied?: boolean; band?: Band };
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
  const mate = mateRecord(person.school!.classmates[i]!);
  if (mate.reliability === undefined) {
    const r = sim.rng('school.partner', person.id, `reliability-${i}`).next();
    const drive = person.school!.classmates[i]!.drive ?? 1;
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

/** Whether a classmate is cast this term, and so called Tuesday to Friday from three (the Bulletin's rehearsal hours). */
const castThisTerm = (person: Person, mate: Classmate, term: number): boolean => person.school!.around?.term === term && person.school!.around.list.some((x) => x.name === mate.name);

/** Why a classmate can't rehearse at a moment, by their own day, or nothing. */
export function mateBusy(person: Person, i: number, when: Instant, minutes: number): string | undefined {
  const mate = person.school!.classmates[i]!;
  const first = mate.name.split(' ')[0];
  const p = zonedParts(when, zone());
  const day: SchoolDate = { year: p.year, month: p.month, day: p.day };
  const startH = p.hour + p.minute / 60;
  const endH = startH + minutes / 60;
  const weekday = new Date(Date.UTC(day.year, day.month - 1, day.day)).getUTCDay();
  if (startH < WORK.rehearsal.from || endH > WORK.rehearsal.until) return `${first} won’t rehearse before ${WORK.rehearsal.from} or past ${WORK.rehearsal.until}.`;
  if (coursesOn(day).length && startH < 15 && endH > 9) return `${first} is in class until three.`;
  const term = termOf(day);
  if (weekday === 6 && startH < 16 && endH > 10 && coursesOn(plus(day, -1)).length) return `${first} works a work-study shift on Saturdays.`;
  if (castThisTerm(person, mate, term) && weekday >= 2 && weekday <= 5 && endH > 15) return `${first} has rehearsal calls from three, Tuesday to Friday.`;
  return undefined;
}

// ---------------------------------------------------------------------------
// Setting work
// ---------------------------------------------------------------------------

/** A course's meetings from a day on, to the end of its term's classes. */
export function meetingsFrom(course: string, from: SchoolDate): string[] {
  const term = termOf(from);
  const end = keyOf(classPeriod(term).to);
  const out: string[] = [];
  for (let d = from; keyOf(d) <= end; d = plus(d, 1)) if (coursesOn(d).some((c) => c.code === course)) out.push(keyOf(d));
  return out;
}

const termWord = (term: number): 'fall' | 'spring' => (termStart(term).fall ? 'fall' : 'spring');

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
  if (cw.assignments.some((a) => a.course === course && (a.status === 'open' || a.status === 'revising'))) return undefined;
  const meetings = meetingsFrom(course, day).filter((k) => k > keyOf(day));
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
  const year = Math.min(3, Math.floor(term / 2) + 1);
  if (t.material !== 'none') {
    const pool = scenesFor(t, course, cw.assignments, targetDifficulty(year, person.craft ? actingOf(person.craft) : 50));
    const scene = pool[0];
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
    a.partner = partnerFor(cw.assignments, course, school.classmates.length, rng.next(), a.revisit?.partner !== undefined ? [a.revisit.partner] : []);
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
    const what = scene ? `${scene.play}, ${scene.where}: you play ${scene.roles[a.role!].name}${partner ? `, ${partner} the other part` : ''}` : a.repPlay ? `${a.repPlay}, this season at Yale Rep` : t.deliverable;
    const again = a.revisit && scene ? ` ${revisitWords(a, scene.roles[a.revisit.role].name, school.classmates[a.revisit.partner ?? -1]?.name)}` : '';
    const focus = a.objective ? ` Put first: ${objectiveLabel(t, a.objective)}.` : '';
    sim.notify({ category: 'school', title: `${c?.name ?? course}: ${t.title}`, body: `${what}.${again}${focus} Due at the meeting on ${formatDate(at(parse(dueOn), 12), zone())}.`, importance: 55, route: '/workspace/school' });
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
  const here = person.currentLocationId === YALE_DRAMA.cityId;
  switch (need) {
    case 'studio': if (!here) return 'The studios are in New Haven.'; return cw.orientation.done.tour || cw.orientation.behind ? undefined : 'You don’t know the building yet: the tour shows you the studios.';
    case 'library': if (!here) return 'The Haas Arts Library is in New Haven.'; return cw.orientation.done.tour || cw.orientation.behind ? undefined : 'You don’t know the library yet: the tour shows you it.';
    // On its feet: the energy, below (`SPENT`). Clothes to move in were the wardrobe's to have until 2026-10-09.
    case 'feet': return undefined;
    case 'partner': return 'Work with your partner is a rehearsal you agree with them: ask them on the assignment.';
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
  if (a.status !== 'open' && a.status !== 'revising') return 'That work is finished.';
  if (a.approach) return `You chose ${APPROACHES[a.approach.kind].label.toLowerCase()} for this work already.`;
  const cw = courseworkOf(sim, person)!;
  const weak = persistentFor(cw, a)[0];
  if (!weak) return 'No note keeps coming back that this work can help with.';
  if (kind === 'objective' && !(Object.keys(OBJECTIVE_DIM) as Objective[]).some((o) => OBJECTIVE_DIM[o] === weak.dim && (o !== 'listening' || a.partner !== undefined))) return 'This work can’t put that first.';
  if (kind === 'partner') {
    if (a.partner === undefined) return 'This work has no partner.';
    if (weak.dim === 'partner') return 'That’s the work with your partner already.';
    if (trustOf(person.school!.classmates[a.partner]!) < WORK.trust.wary) return `${person.school!.classmates[a.partner]!.name.split(' ')[0]} would rather work alone, after last time.`;
  }
  return undefined;
}

/** The steps of an assignment: its template's, and a targeted drill where that's the way chosen at a weakness (`approach`). */
export function activitiesOf(a: Assignment): readonly Activity[] {
  const t = templateById(a.template)!;
  if (a.approach?.kind !== 'drill') return t.activities;
  const label = `${APPROACHES.drill.label}: ${t.dims[a.approach.dim]?.label ?? a.approach.dim}`;
  return [...t.activities, { id: 'drill', label, minutes: APPROACH.drill.minutes, dim: a.approach.dim, gain: APPROACH.drill.gain, daily: true }];
}

/** Why a step can't be done now, or nothing. */
export function prepareRefusal(sim: Simulation, person: Person, a: Assignment | undefined, activityId: string): string | undefined {
  if (!a) return 'There’s no such assignment.';
  if (a.status !== 'open' && a.status !== 'revising') return 'That work is finished.';
  const t = templateById(a.template)!;
  const act = activitiesOf(a).find((x) => x.id === activityId);
  if (!act) return 'That isn’t a step of this work.';
  if (act.dim === 'revision' && t.revised && a.status !== 'revising') return 'There’s no note to work on until it’s been shown.';
  if (a.feedback && !a.feedback.seen) return 'There’s new feedback on this: read it first.';
  if (a.asks?.some((k) => k.status === 'open')) return `${person.school!.classmates[a.partner!]!.name.split(' ')[0]} asked to rehearse: answer first.`;
  if (momentsOf(courseworkOf(sim, person)!).some((m) => m.status === 'open' && m.assignmentId === a.id)) return `${person.school!.classmates[a.partner!]!.name.split(' ')[0]} reads the scene another way: answer first.`;
  for (const need of act.needs ?? []) { const no = needRefusal(sim, person, need); if (no) return no; }
  if (act.requires && a.prep[act.requires.dim] < act.requires.at) return act.requires.why;
  if (a.prep[act.dim] >= 0.97) return 'There’s nothing more to gain from it now.';
  if (act.daily && a.practicedOn[act.id] === dayKey(sim.now)) return 'Done today already: it takes days, not one long session.';
  // On your feet, the line training reads (`SPENT` in `systems/life.ts`, from 2026-10-08): desk work can be done tired, a studio can't.
  if ((act.needs ?? []).some((n) => n === 'studio' || n === 'feet') && person.wellbeing.energy < SPENT) return 'You’re too tired to work on your feet. Sleep first.';
  const busy = occupiedAt(sim, sim.now);
  if (busy) return `You’re at ${busy.label} until ${formatTime(busy.at + busy.durationMinutes! * 60_000, sim.zone)}.`;
  return undefined;
}

/** The trait knob each kind of preparation reads: interpretation is read around, lines drilled, a scene skimmed, a note revised. */
export const PREP_KNOB: Partial<Record<PrepDim, PersonalityKnob>> = { interpretation: 'readsAround', memorization: 'drills', familiarity: 'skims', revision: 'revises' };

/** How far this kind of step goes for this person, by the knob `PREP_KNOB` names: each read where it's asked, so `tools/wired.mjs` sees it. */
function prepLean(person: Person, dim: PrepDim): number {
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
  // Work in a craft they love is a better hour, and no better work (`Template.crafts`, from 2026-10-09).
  const crafts = templateById(a.template)?.crafts;
  if (crafts) enjoyCrafts(person, crafts);
  const before = a.prep[act.dim];
  // What this kind of work gives this person (from 2026-10-09): reading around a scene, drilling lines, getting
  // around it fast, revising from a note (`PREP_KNOB`), each a trait's.
  a.prep[act.dim] = clamp01(before + act.gain * Math.min(1.1, Math.max(0.5, focus)) * prepLean(person, act.dim) * (1 - before));
  a.steps[act.id] = (a.steps[act.id] ?? 0) + 1;
  if (act.daily) a.practicedOn[act.id] = dayKey(sim.now);
  if (act.trains && a.trained < WORK.trainingSteps && person.craft) {
    grow(person.craft, act.trains, focus, WORK.trainingWeight);
    a.trained += 1;
  }
  return { moved: a.prep[act.dim] - before, dim: act.dim, minutes };
}

/** A scene coming back, said: when it was studied, in which part, with whom, and what's new this time. */
export function revisitWords(a: Assignment, lastRole: string, lastPartner?: string): string {
  const r = a.revisit!;
  const when = formatDate(at(parse(r.on), 12), zone());
  const before = `You worked this scene from ${when}, as ${lastRole}${lastPartner ? ` with ${lastPartner}` : ''}.`;
  if (r.change === 'role') return `${before} This time you play the other part.`;
  return `${before} You’ve played both parts: this time, find another reading at the table than last time’s.`;
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

/** What a partner has done on their own by a day, by their drive and reliability. */
function partnerOwn(person: Person, a: Assignment, onDay: string): number {
  if (a.partner === undefined) return 0;
  const mate = person.school!.classmates[a.partner]!;
  const weeks = Math.max(0, (Date.UTC(parse(onDay).year, parse(onDay).month - 1, parse(onDay).day) - Date.UTC(parse(a.setOn).year, parse(a.setOn).month - 1, parse(a.setOn).day)) / (7 * MS_DAY));
  return Math.min(WORK.partnerOwnMost, WORK.partnerOwnPerWeek * weeks * (mate.drive ?? 1) * (mateRecord(mate).reliability ?? 0.85));
}

/** Each part of the preparation as the showing reads it, 0 to 1, for the template's parts. */
export function preparedParts(person: Person, a: Assignment, onDay: string): Partial<Record<PrepDim, number>> {
  const t = templateById(a.template)!;
  const out: Partial<Record<PrepDim, number>> = {};
  for (const dim of Object.keys(t.dims) as PrepDim[]) {
    if (dim === 'interpretation') out[dim] = interpretationOf(a);
    else if (dim === 'partner' && t.paired) out[dim] = WORK.partnerMix.together * a.prep.partner + WORK.partnerMix.own * partnerOwn(person, a, onDay);
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

/** A part's weight in a showing: the template's, and more for the assignment's objective (normalized in `weightsOf`). */
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
 */
export function noteCandidates(person: Person, a: Assignment, parts: Partial<Record<PrepDim, number>>, craft: number, notes: readonly NoteRecord[]): { focus: Focus; level?: number }[] {
  const t = templateById(a.template)!;
  const w = weightsOf(a);
  const out: { focus: Focus; level?: number; short: number }[] = [];
  for (const [dim, v] of Object.entries(parts) as [PrepDim, number][]) {
    const short = (w[dim] ?? 0) * (1 - v) + (a.objective && OBJECTIVE_DIM[a.objective] === dim && v < LEARNING.enough ? 0.05 : 0);
    if (short >= 0.05) out.push({ focus: { kind: 'dim', dim }, level: v, short });
  }
  for (const { q, options } of questionsFor(a)) {
    if (a.answers[q.id] && !options.find((o) => o.id === a.answers[q.id])?.supported) out.push({ focus: { kind: 'choice', question: q.id }, short: 0.1 });
  }
  if (craft < 0.45) {
    const weakest = (Object.keys(t.reads) as Skill[]).sort((x, y) => person.craft![x] - person.craft![y])[0]!;
    out.push({ focus: { kind: 'skill', skill: weakest }, level: person.craft![weakest] / 100, short: 0.06 });
  }
  return out.filter((c) => mayGive(notes, noteKey(c.focus), c.level)).sort((x, y) => y.short - x.short).map(({ focus, level }) => (level === undefined ? { focus } : { focus, level }));
}

/** The one thing that most held a showing back, as the ledger allows, or nothing. */
export function mainNote(person: Person, a: Assignment, parts: Partial<Record<PrepDim, number>>, craft: number, notes: readonly NoteRecord[] = []): Focus | undefined {
  return noteCandidates(person, a, parts, craft, notes)[0]?.focus;
}

/** The note's substance: the course's own words for a part, with what the work measured and the material's specifics; the text's reason for a choice; the skill; or the step beyond. */
export function noteText(a: Assignment, focus: Focus, level?: number, partnerName?: string): string {
  const t = templateById(a.template)!;
  const scene = a.sceneId ? sceneById(a.sceneId) : undefined;
  const as = scene && a.role !== undefined ? ` As ${scene.roles[a.role].name} in ${scene.play}.` : '';
  if (focus.kind === 'dim') {
    const base = t.notes[focus.dim] ?? `${t.dims[focus.dim]?.label ?? focus.dim} needed more work.`;
    const with_ = focus.dim === 'partner' && partnerName ? ` You and ${partnerName.split(' ')[0]} had rehearsed together ${a.rehearsals.filter((r) => r.status === 'kept').length} times.` : '';
    const measured = level !== undefined ? ` (${t.dims[focus.dim]?.label ?? focus.dim}: ${Math.round(level * 100)}%.)` : '';
    return `${base}${with_}${measured}${as}`;
  }
  if (focus.kind === 'choice') {
    const qo = questionsFor(a).find(({ q }) => q.id === focus.question);
    const picked = qo?.options.find((o) => o.id === a.answers[focus.question]);
    return `${qo?.q.label ?? 'A choice'}: ${picked?.why ?? 'the text cuts against it.'}${as}`;
  }
  if (focus.kind === 'skill') return `It asked more ${labelOf(focus.skill).toLowerCase()} than you have yet: that’s the work for the next weeks.`;
  return ADVANCED[focus.challenge];
}

/** A note's words with where it stands against the ones before: new, still there, better but not yet, or the step beyond. */
export function feedbackWords(kind: NoteKind, body: string, before?: { on: string; course: string; level?: number; given?: number }, level?: number): string {
  const when = before ? formatDate(at(parse(before.on), 12), zone()) : '';
  if (kind === 'advanced') return `It held together this time. The next step: ${body}`;
  if (kind === 'partial' && before) return `Better than on ${when}${before.level !== undefined && level !== undefined ? ` (${Math.round(before.level * 100)}% then, ${Math.round(level * 100)}% now)` : ''}, not there yet. ${body}`;
  // From the third time, how many: a weakness that keeps coming back is named as one (from a measured run, where one note came seventeen times in a year).
  const times = before?.given !== undefined && before.given >= 2 ? `, the ${ordinal(before.given + 1)} time it’s been given` : '';
  if (kind === 'recurring' && before) return `The same note as on ${when}, in ${before.course}${times}: it’s still there. ${body}`;
  return body;
}

const ordinal = (n: number): string => { const t = n % 100; return `${n}${t >= 11 && t <= 13 ? 'th' : (['th', 'st', 'nd', 'rd'][n % 10] ?? 'th')}`; };

function bandOf(score: number): Band {
  const b = WORK.bands;
  return score < b.unready ? 'unready' : score < b.working ? 'working' : score < b.strong ? 'strong' : 'exceptional';
}

/** The showing reckoned once: its band and parts, what helped, and the note. */
export function show(sim: Simulation, person: Person, a: Assignment, onDay: string, when: Instant): Showing {
  const t = templateById(a.template)!;
  const w = weightsOf(a);
  // The parts this showing reads: all of the work's, or a round's.
  const parts = Object.fromEntries(Object.entries(preparedParts(person, a, onDay)).filter(([d]) => w[d as PrepDim] !== undefined)) as Partial<Record<PrepDim, number>>;
  const prep = (Object.entries(parts) as [PrepDim, number][]).reduce((s, [dim, v]) => s + (w[dim] ?? 0) * v, 0);
  const craft = craftScore(person, t);
  const ready = clamp01((focusOf(person) - 0.3) / 0.9);
  const luck = (sim.rng('school.coursework', person.id, `show-${a.id}-${onDay}`).next() * 2 - 1) * WORK.showing.luck;
  const s = WORK.showing;
  const carried = Math.min(1, prep / s.carries);
  const score = s.prep * prep + (s.craft * craft + s.ready * ready) * carried + luck;
  const strengths = (Object.entries(parts) as [PrepDim, number][]).filter(([, v]) => v >= 0.75).map(([dim]) => `${t.dims[dim]!.label} was there`);
  if (craft >= 0.65) strengths.push(`Your ${(Object.keys(t.reads) as Skill[]).map((k) => labelOf(k).toLowerCase()).join(' and ')} carried it`);
  if (ready >= 0.75) strengths.push('You came rested and ready');
  const c = courseOf(a.course)!;
  const cw = courseworkOf(sim, person)!;
  const notes = notesOf(cw);
  // Notes from before whose part this work has put right: taken, and said (`resolveNote`).
  const taken: string[] = [];
  for (const n of notes) {
    if (n.status !== 'open' || !n.key.startsWith('dim:')) continue;
    const v = parts[n.key.slice(4) as PrepDim];
    if (v !== undefined && v >= LEARNING.enough && resolveNote(notes, n.key, onDay, a.id, c.name)) taken.push(n.key);
  }
  for (const key of taken) strengths.push(`The note on ${(t.dims[key.slice(4) as PrepDim]?.label ?? key.slice(4)).toLowerCase()} is taken`);
  if (taken.length) a.taken = taken;
  // A smaller piece shown is no better than Working (`approach`).
  const band = a.approach?.kind === 'smaller' && ['strong', 'exceptional'].includes(bandOf(score)) ? 'working' : bandOf(score);
  const showing: Showing = { band, score: Math.round(score * 1000) / 1000, at: when, parts: { prep, craft, ready, ...(t.paired ? { partner: parts.partner ?? 0 } : {}) }, strengths };
  // The note: what held it back most, as the ledger allows; nothing did, the step beyond.
  const pick = noteCandidates(person, a, parts, craft, notes)[0];
  // The course's last step beyond, not given again running.
  const lastHere = cw.assignments.filter((x) => x.course === a.course && x.id !== a.id && x.feedback?.focus.kind === 'advanced').at(-1)?.feedback?.focus;
  const focus: Focus = pick?.focus ?? { kind: 'advanced', challenge: nextChallenge(notes, sim.rng('school.coursework', person.id, `challenge-${a.id}-${onDay}`).next(), challengesFor(t), lastHere?.kind === 'advanced' ? lastHere.challenge : undefined) };
  const { kind, before } = recordNote(notes, focus, onDay, a.id, c.name, pick?.level);
  const partnerName = a.partner !== undefined ? person.school!.classmates[a.partner]?.name : undefined;
  const body = noteText(a, focus, pick?.level, partnerName);
  const prior = before ? { on: before.last, course: before.history.at(-1)?.course ?? c.name, given: before.given, ...(before.level !== undefined ? { level: before.level } : {}) } : undefined;
  a.feedback = { course: c.name, teachers: c.teachers, text: feedbackWords(kind, body, prior, pick?.level), focus, kind, ...(prior ? { before: { on: prior.on, course: prior.course } } : {}) };
  a.shown = showing;
  return showing;
}

/** Whether a note was taken by its revision: the part risen enough, the choice now supported, or the note worked on. */
export function noteTaken(person: Person, a: Assignment, onDay: string): boolean {
  const focus = a.feedback?.focus;
  if (!focus) return true;
  const r = WORK.revision;
  if (focus.kind === 'dim') {
    const now = preparedParts(person, a, onDay)[focus.dim] ?? 0;
    return now >= (a.revision?.before ?? 0) + r.dimRise || now >= r.dimEnough || a.prep.revision >= r.worked;
  }
  if (focus.kind === 'choice') return Boolean(questionsFor(a).find(({ q }) => q.id === focus.question)?.options.find((o) => o.id === a.answers[focus.question])?.supported);
  return a.prep.revision >= r.worked;
}

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
      const next = meetingsFrom(course, plus(day, 1))[0];
      if (excused && next) { due.dueOn = next; return 1; }
      due.status = 'missed';
      if (due.partner !== undefined) { const mate = person.school!.classmates[due.partner]!; moveTrust(mate, WORK.trust.missed, { person, by: WORK.bond.missed }); noteIncident(mate, sim.now, 'missed'); remember(sim, mate, `You weren’t there to show ${sceneById(due.sceneId ?? '')?.play ?? 'the work'}`); }
      if (mine) sim.notify({ category: 'school', title: `Not Shown: ${courseOf(course)?.name}`, body: 'You weren’t there when it was due, and it isn’t taken later.', importance: 60, route: '/workspace/school' });
      return 1;
    }
    const showing = show(sim, person, due, key, when);
    const t = templateById(due.template)!;
    if (t.rounds) {
      // A round shown: the next is due its gap of meetings on, the work still open, its note to be taken there.
      const r = due.round ?? 0;
      (due.roundsShown ??= []).push({ label: t.rounds[r]!.label, band: showing.band, on: key });
      const nextRound = t.rounds[r + 1];
      const next = nextRound ? meetingsFrom(course, plus(day, 1))[nextRound.gap - 1] : undefined;
      if (nextRound && next) { due.round = r + 1; due.dueOn = next; } else due.status = 'done';
    } else if (t.revised && due.feedback) {
      const next = meetingsFrom(course, plus(day, 1))[0];
      if (next) {
        const f = due.feedback.focus;
        due.revision = { dueOn: next, before: f.kind === 'dim' ? preparedParts(person, due, key)[f.dim] ?? 0 : 0 };
        due.status = 'revising';
      } else due.status = 'done';
    } else due.status = 'done';
    if (due.partner !== undefined) remember(sim, person.school!.classmates[due.partner]!, `Showed ${sceneById(due.sceneId ?? '')?.play ?? t.title} together: ${BAND_LABEL[showing.band].toLowerCase()}`);
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
        sim.notify({ category: 'school', title: `Still There: ${noteSubject(rec.key)}`, body: `${t.title}, ${BAND_LABEL[showing.band].toLowerCase()}: the same note, given ${rec.given} times. On the Coursework tab you can choose another way at it.`, importance: 30, route: '/workspace/school' });
      }
    } else if (mine) sim.notify({ category: 'school', title: `Shown: ${t.title}${roundLabel}, ${BAND_LABEL[showing.band]}`, body: `${showing.strengths.length ? `${showing.strengths.join('; ')}. ` : ''}${due.feedback ? `The note (simulated feedback from ${due.feedback.course}): ${due.feedback.text}` : ''}`, importance: 60, route: '/workspace/school' });
    return WORK.weight[showing.band];
  }
  const revising = cw.assignments.find((a) => a.course === course && a.status === 'revising' && a.revision?.dueOn === key);
  if (revising) {
    if (!present) {
      const next = meetingsFrom(course, plus(day, 1))[0];
      if (excused && next) { revising.revision!.dueOn = next; return 1; }
      revising.status = 'done';
      return 1;
    }
    const applied = noteTaken(person, revising, key);
    revising.revision!.applied = applied;
    // Shown again, reckoned as a showing: its band kept (the showcase reads the last one, `showcaseSceneSeen`). Until
    // 2026-10-08 the second showing was only taken or not, and its band was never set.
    revising.revision!.band = reshow(sim, person, revising, key);
    if (applied && revising.feedback) resolveNote(notesOf(courseworkOf(sim, person)!), noteKey(revising.feedback.focus), key, revising.id, courseOf(course)?.name ?? course);
    revising.status = 'done';
    if (mine) sim.notify({ category: 'school', title: applied ? 'The Note Was Taken' : 'The Note Wasn’t Taken Yet', body: `${templateById(revising.template)!.title}, shown again: ${applied ? 'what held it back last time was worked on, and it showed.' : `${revising.feedback?.text ?? ''} It’s still there.`}`, importance: 50, route: '/workspace/school' });
    return applied ? WORK.revision.applied : WORK.revision.notApplied;
  }
  return 1;
}

/** The revised work's band: read as a showing is, without a new note (the note given stands until the next work). */
function reshow(sim: Simulation, person: Person, a: Assignment, onDay: string): Band {
  const t = templateById(a.template)!;
  const parts = preparedParts(person, a, onDay);
  const w = weightsOf(a);
  const prep = (Object.entries(parts) as [PrepDim, number][]).reduce((s, [dim, v]) => s + (w[dim] ?? 0) * v, 0);
  const craft = craftScore(person, t);
  const ready = clamp01((focusOf(person) - 0.3) / 0.9);
  const luck = (sim.rng('school.coursework', person.id, `reshow-${a.id}-${onDay}`).next() * 2 - 1) * WORK.showing.luck;
  const s = WORK.showing;
  const b = bandOf(s.prep * prep + (s.craft * craft + s.ready * ready) * Math.min(1, prep / s.carries) + luck);
  return a.approach?.kind === 'smaller' && (b === 'strong' || b === 'exceptional') ? 'working' : b;
}

/** Work still open when its term's classes end lapses: there's no meeting left to show it. */
export function lapseTerm(sim: Simulation, person: Person, term: number): void {
  for (const a of courseworkOf(sim, person)?.assignments ?? []) {
    if (a.term !== term) continue;
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
      const acc = termAccount(cur, hasNeed(person), 0);
      return `Tuition, ${formatMoney(acc.tuition, cur)} a term, is met by the tuition scholarship. ${hasNeed(person) ? `Your living-expense scholarship, ${formatMoney(acc.livingScholarship, cur)}, meets the Yale Health plan, ${formatMoney(acc.healthPlan, cur)}, and the rest comes to your bank.` : `No need was found, so the Yale Health plan, ${formatMoney(acc.healthPlan, cur)} a term, is yours to pay.`} Work-study is ${WORK_STUDY.assignedHours} assigned hours a year at ${formatMoney(WORK_STUDY.hourly, 'USD')} an hour, a shift each Saturday of the class weeks.`;
    }
    case 'classmates': {
      for (const mate of school.classmates) mateRecord(mate).met ??= sim.now;
      return `You met the ${school.classmates.length} others in your class: you’ll partner them in scenes, rehearse with them and be cast beside them.`;
    }
    case 'faculty': return `You met the acting faculty, with the chair, ${YALE_DRAMA.actingChair.name}. First-year courses are taught by ${[...new Set(COURSES.filter((c) => c.year === 1).map((c) => c.teachers))].join(', ')}.`;
    case 'tour': return 'You were shown the studios you can book to rehearse in, the theaters, and the Haas Family Arts Library.';
    case 'expectations': {
      const first = ORIENTATION_2026.classesBegin;
      const set = COURSES.filter((c) => c.year === 1 && c.terms.includes('fall')).map((c) => setWork(sim, person, c.code, plus(first, -1))).filter(Boolean);
      return `Each course set out what it asks. ${set.length ? `${set.length} courses gave you their first work now, so you can start before classes.` : ''}`;
    }
  }
}

/** Why an orientation session can't be caught up now, or nothing. */
export function orientationRefusal(sim: Simulation, person: Person, task: OrientationTask): string | undefined {
  const cw = courseworkOf(sim, person);
  if (!cw) return 'You’re not at school.';
  const o = ORIENTATION.find((x) => x.task === task);
  if (!o) return 'There’s no such session.';
  if (cw.orientation.behind) return 'Orientation is behind you.';
  const done = cw.orientation.done[task];
  if (done) return `Done on ${formatDate(done, zone())}.`;
  if (sim.now < at({ year: ORIENTATION_2026.begins.year, month: 8, day: o.day }, o.hour)) return 'Its session is still ahead on the calendar.';
  if (person.currentLocationId !== YALE_DRAMA.cityId) return 'Orientation is in New Haven.';
  const busy = occupiedAt(sim, sim.now);
  if (busy) return `You’re at ${busy.label} until ${formatTime(busy.at + busy.durationMinutes! * 60_000, sim.zone)}.`;
  return undefined;
}

// ---------------------------------------------------------------------------
// Commands and the calendar
// ---------------------------------------------------------------------------

/** Why a partner can't be asked to rehearse at a moment, or nothing; and if they'd rather not, why. */
export function askRefusal(sim: Simulation, person: Person, a: Assignment | undefined, when: Instant): { refused?: string; declines?: string } {
  if (!a) return { refused: 'There’s no such assignment.' };
  if (a.status !== 'open' && a.status !== 'revising') return { refused: 'That work is finished.' };
  if (a.partner === undefined) return { refused: 'This work has no partner.' };
  const mate = person.school!.classmates[a.partner]!;
  const first = mate.name.split(' ')[0];
  const cw = courseworkOf(sim, person)!;
  if (!mateRecord(mate).met && !cw.orientation.behind) return { refused: `You haven’t met ${first} yet: you’ll meet the class at orientation, or at the first class.` };
  if (!Number.isFinite(when) || when < sim.now + WORK.rehearsal.aheadHours * 3_600_000) return { refused: `Ask at least ${WORK.rehearsal.aheadHours} hours ahead.` };
  const due = at(parse(a.status === 'revising' ? a.revision!.dueOn : a.dueOn), 9);
  if (when + WORK.rehearsal.minutes * 60_000 > due) return { refused: 'That’s after it’s due.' };
  if (a.rehearsals.some((r) => r.status === 'booked' && Math.abs(r.at - when) < WORK.rehearsal.minutes * 60_000)) return { refused: 'You’re already rehearsing then.' };
  const clash = sim.universe.scheduled.find((x) => x.status === 'pending' && x.requiresPlayer && x.durationMinutes && x.at < when + WORK.rehearsal.minutes * 60_000 && x.at + x.durationMinutes * 60_000 > when);
  if (clash) return { refused: `You have ${clash.label} then.` };
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
  const here = person.currentLocationId === YALE_DRAMA.cityId && !(person.awakeSince !== undefined && person.awakeSince > when) && !inHospital(person, when) && !laidUp(person, when);
  const theyCome = sim.rng('school.partner', person.id, `${a.id}-${r.id}`).next() < reliabilityOf(sim, person, a.partner!);
  const what = sceneById(a.sceneId ?? '')?.play ?? templateById(a.template)!.title;
  if (!here) {
    r.status = 'missedByYou';
    m.missedByYou = (m.missedByYou ?? 0) + 1;
    moveTrust(mate, WORK.trust.missed, { person, by: WORK.bond.missed });
    noteIncident(mate, when, 'missed');
    remember(sim, mate, `You didn’t come to rehearse ${what}`);
    if (mine) sim.notify({ category: 'school', title: `${first} Waited For You`, body: `You didn’t come to the rehearsal of ${what}. ${first} will remember it.`, importance: 60, route: '/workspace/school' });
    return;
  }
  if (!theyCome) {
    r.status = 'missedByThem';
    m.stoodUp = (m.stoodUp ?? 0) + 1;
    remember(sim, mate, `Didn’t come to rehearse ${what}`);
    if (mine) sim.notify({ category: 'school', title: `${first} Didn’t Come`, body: `You waited for ${first} to rehearse ${what}, and they didn’t come.`, importance: 50, route: '/workspace/school' });
    return;
  }
  r.status = 'kept';
  m.kept = (m.kept ?? 0) + 1;
  const t = templateById(a.template)!;
  const act = t.activities.find((x) => x.dim === 'partner');
  const before = a.prep.partner;
  a.prep.partner = clamp01(before + (act?.gain ?? 0.4) * Math.min(1.1, Math.max(0.5, focusOf(person))) * (1 - before));
  exerts(person, WORK.met.feet, WORK.rehearsal.minutes / 60);
  moveTrust(mate, WORK.trust.kept, { person, by: WORK.bond.kept });
  keptWith(mate);
  // The weakness worked on with the partner too, where that's the way chosen (`approach`), once.
  if (a.approach?.kind === 'partner' && !(a as Assignment & { partnerWorked?: boolean }).partnerWorked) { a.prep[a.approach.dim] = clamp01(a.prep[a.approach.dim] + APPROACH.partner * (1 - a.prep[a.approach.dim])); (a as Assignment & { partnerWorked?: boolean }).partnerWorked = true; }
  // Both readings tried, as agreed with them (`systems/classmates.ts`): the table work moves, once.
  const tried = a as Assignment & { tryBoth?: boolean };
  if (tried.tryBoth) { a.prep.interpretation = clamp01(a.prep.interpretation + 0.15 * (1 - a.prep.interpretation)); delete tried.tryBoth; }
  remember(sim, mate, `Rehearsed ${what} together`);
  r.said = peerNote(a, first!);
}

/**
 * What a partner says after a rehearsal: the part of your preparation that
 * held the scene back most, of those a partner feels (knowing the scene, the
 * lines, the choices, time on its feet), or that it's coming together. The
 * game's words, from your preparation as it stands; change the preparation
 * and what they say changes.
 */
export function peerNote(a: Assignment, first: string): string {
  const t = templateById(a.template)!;
  const felt = (['familiarity', 'memorization', 'interpretation', 'rehearsal'] as const).filter((d) => t.dims[d]);
  const weakest = [...felt].sort((x, y) => a.prep[x] - a.prep[y])[0];
  if (!weakest || a.prep[weakest] >= 0.7) return `${first} says it’s coming together.`;
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
    if (person.id === sim.universe.playerId) sim.notify({ category: 'school', title: `${first} Asks To Rehearse`, body: `${first} asks to rehearse ${what} on ${formatDate(when, zone())} at ${formatTime(when, zone())}. Answer by ${formatTime(k.until, zone())} that day.`, importance: 60, route: '/workspace/school' });
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
  if (q.refused?.startsWith('You have ')) return `${q.refused.replace(/\.$/, '')}: say no instead.`;
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
    const here = person.currentLocationId === YALE_DRAMA.cityId && !(person.awakeSince !== undefined && person.awakeSince > item.at);
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

  sim.onCommand<{ assignmentId: string; question: Question['id']; option: string }, { supported: boolean }>('school.choose', (p, { sim: s }) => {
    const person = s.player;
    const a = assignmentById(s, person, String(p?.assignmentId));
    if (!a || (a.status !== 'open' && a.status !== 'revising')) throw new CommandError(a ? 'That work is finished.' : 'There’s no such assignment.');
    const qo = questionsFor(a).find(({ q }) => q.id === p.question);
    if (!qo) throw new CommandError('That isn’t a question this work asks.');
    const option = qo.options.find((o) => o.id === p.option);
    if (!option) throw new CommandError('That isn’t one of the answers.');
    if (a.prep.familiarity < 0.3) throw new CommandError('Read it first: table work is done on a text you know.');
    if (a.answers[qo.q.id] === option.id) throw new CommandError('That’s your answer already.');
    const busy = occupiedAt(s, s.now);
    if (busy) throw new CommandError(`You’re at ${busy.label} until ${formatTime(busy.at + busy.durationMinutes! * 60_000, s.zone)}.`);
    s.advanceTo(s.now + CHOOSE_MINUTES * 60_000);
    a.answers[qo.q.id] = option.id;
    return { supported: option.supported };
  });

  sim.onCommand<{ assignmentId: string }, { seen: true }>('school.read_feedback', (p, { sim: s }) => {
    const a = assignmentById(s, s.player, String(p?.assignmentId));
    if (!a?.feedback) throw new CommandError('There’s no feedback on that.');
    if (a.feedback.seen) throw new CommandError('Read already.');
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
    if (person.id === s.universe.playerId) s.notify({ category: 'school', title: `${mate.name.split(' ')[0]} Didn’t Hear Back`, body: `You didn’t answer about rehearsing on ${formatDate(k.at, zone())}, so it isn’t on.`, importance: 40, route: '/workspace/school' });
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
    remember(s, mate, late ? 'You called off a rehearsal at short notice' : 'You moved a rehearsal, with notice');
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
