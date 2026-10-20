/**
 * SLATE — what a student has worked on, and what's still open (from
 * 2026-10-08; read by `systems/coursework.ts`).
 *
 * **History is read from the record, not kept beside it.** Which scenes were
 * studied, in which part, with whom, with which readings and how they went,
 * is read from the assignments themselves (`scenePast`), so nothing here can
 * drift from what happened.
 *
 * **The next work reads it.** A scene is chosen from those the course can
 * take, matched to where the actor is (`targetDifficulty`), never-studied
 * first; where every fitting scene has been studied, the least recently
 * studied comes back, and the assignment says so and asks something new of
 * it (`revisitOf`): the other part, or, both parts played, a different
 * reading at the table; with a partner not had in it. The partner is the classmate
 * least worked with, never last time's in the same course where another is
 * free. And each assignment has a learning objective (`objectiveFor`): the
 * part of the work a recurring note keeps naming, or, nothing recurring, the
 * one the course hasn't asked of you for longest.
 *
 * **The notes are a ledger.** Each note a showing gives is kept by what it's
 * about (`noteKey`: lines, the relationship, a choice at the table, a skill),
 * across every course, with when it was given and what it measured. The next
 * note on the same thing says so: still there, or better but not there yet.
 * One whose part has come right is marked taken, the showing says so, and it
 * isn't given again unless the part slips back. With nothing holding the work
 * back, the note is the next step instead (`ADVANCED`). Until 2026-10-08 each
 * showing chose its note from the template's list alone, so the same words
 * came back however the work had moved, and a note on something already put
 * right could be given again.
 *
 * Every threshold here is SLATE's estimate.
 */

import { QUESTIONS, SCENES, sceneById, templateById, type PrepDim, type Question, type Scene, type Template } from '../content/coursework';
import { SKILLS, type Skill } from '../content/school';

/** What a note can be about. A step beyond the work, given when nothing held it back, is `advanced`. */
export type NoteFocus =
  | { kind: 'dim'; dim: PrepDim }
  | { kind: 'choice'; question: Question['id'] }
  | { kind: 'skill'; skill: Skill }
  | { kind: 'advanced'; challenge: Challenge };

/** How a note stands against the ones before it on the same thing. */
export type NoteKind = 'new' | 'recurring' | 'partial' | 'applied' | 'advanced';

export interface NoteRecord {
  key: string;
  status: 'open' | 'resolved';
  first: string;
  last: string;
  given: number;
  /** What it measured when last given (the part's preparation, 0 to 1), to tell better from the same. */
  level?: number;
  resolvedOn?: string;
  history: { on: string; assignmentId: string; course: string; kind: NoteKind }[];
}

export const LEARNING = {
  /** A part this far up is put right, and its note taken; below this again, it has slipped back. */
  enough: 0.75, slipped: 0.45,
  /** Better by this much since last time is partial progress, not the same note again. */
  better: 0.1,
  /** How many of a ledger's entries' history to keep. */
  history: 12,
  /** A learning objective's part weighs this much more in its showing. */
  objectiveWeight: 1.5,
  /** Where a revisit asks for another reading and none differs, the reading counts this much. */
  sameReading: 0.8,
  /** A note open and given this often is a persistent weakness, and the work offers another way at it (`APPROACHES`). */
  persistent: 3,
  /** A persistent note's notice, at most this often (days): the card and the ledger keep it in view between. */
  quietDays: 7,
} as const;

/**
 * Another way at a weakness that keeps coming back (from 2026-10-08), one an
 * assignment, chosen by the player; none of them takes the note by itself:
 * - `drill`: a targeted drill of that part, half an hour, once a day, moving
 *   it as the work's own steps do, by what's left;
 * - `objective`: the part put first, weighing more in the showing;
 * - `partner`: the next rehearsal kept with the partner works on it too;
 * - `smaller`: a smaller piece of it asked for, so a part prepared to six
 *   tenths reads as whole, and the showing can be no better than Working,
 *   since less was shown.
 * SLATE's estimates, each.
 */
export type Approach = 'drill' | 'objective' | 'partner' | 'smaller';
export const APPROACHES: Record<Approach, { label: string; words: string }> = {
  drill: { label: 'A Targeted Drill', words: 'a half-hour drill of it, once a day' },
  objective: { label: 'Put It First', words: 'it comes first, and counts for more when the piece is shown' },
  partner: { label: 'Work On It With Your Partner', words: 'your next rehearsal with your partner works on it too' },
  smaller: { label: 'A Smaller Piece Of It', words: 'you show a smaller piece of it, which can be judged no better than Working' },
};
export const APPROACH = { drill: { minutes: 30, gain: 0.3 }, partner: 0.2, smaller: 0.6 } as const;

/** The steps beyond the work, by what they ask: SLATE's, given in the game's words and shown as simulated. */
export type Challenge = 'stakes' | 'listening' | 'economy' | 'contrast' | 'text' | 'release' | 'precision';
export const ADVANCED: Record<Challenge, string> = {
  release: 'Take it slower than feels safe, and let go of what you’re holding on to just to get through it. The effort shouldn’t show.',
  precision: 'Make one moment exact. Choose where it starts and ends, and repeat it the same way twice.',
  stakes: 'Raise what it costs. Play it as though the scene decides everything for your character, and see what that does to the pace.',
  listening: 'Let the other person change you. Take your next line from what you were just given, not from what you planned.',
  economy: 'Do less. Find the moments that need nothing added, and trust the text in them.',
  contrast: 'Find the turn, where your character wants the opposite of what they wanted a minute ago, and make the change visible.',
  text: 'Go back to the words. Find one image or one repeated word you’ve played past, and see what it tells you.',
};

export const noteKey = (f: NoteFocus): string =>
  f.kind === 'dim' ? `dim:${f.dim}` : f.kind === 'choice' ? `choice:${f.question}` : f.kind === 'skill' ? `skill:${f.skill}` : `advanced:${f.challenge}`;

/** The minimal shape of an assignment this module reads (`Assignment` in `systems/coursework.ts`). */
export interface Worked {
  id: string;
  course: string;
  template: string;
  setOn: string;
  sceneId?: string;
  role?: 0 | 1;
  partner?: number;
  answers: Partial<Record<Question['id'], string>>;
  status: string;
  objective?: Objective;
  shown?: { band: string };
}

/** A scene's history: each time it was set, in which part, with whom, the readings chosen, and how it went. */
export function scenePast(assignments: readonly Worked[], sceneId: string): Worked[] {
  return assignments.filter((a) => a.sceneId === sceneId);
}

/** How hard a scene should be for a student, 1 to 3: their year, and their acting either side of the class's middle. SLATE's estimate. */
export function targetDifficulty(year: number, acting: number): 1 | 2 | 3 {
  const t = year + (acting >= 72 ? 1 : 0) - (acting < 52 ? 1 : 0);
  return Math.max(1, Math.min(3, t)) as 1 | 2 | 3;
}

/**
 * The scenes a template can take for a course, best first: the kind it asks
 * (modern prose, classical text, a Greek play), from its earliest year;
 * never studied before any studied, each group nearest the difficulty that
 * fits; studied ones the longest ago first.
 */
export function scenesFor(t: Template, course: string, assignments: readonly Worked[], target: 1 | 2 | 3): Scene[] {
  const from = t.materialFrom?.[course] ?? 0;
  const fits = SCENES.filter((s) => s.year >= from && (t.material === 'greek-scene' ? s.tradition === 'greek' : s.tradition !== 'greek' && (t.material === 'verse-scene' ? s.language === 'verse' : s.language === 'prose')));
  const lastSet = (s: Scene) => scenePast(assignments, s.id).reduce((m, a) => (a.setOn > m ? a.setOn : m), '');
  return [...fits].sort((x, y) => {
    const fx = lastSet(x), fy = lastSet(y);
    if (!fx !== !fy) return fx ? 1 : -1;
    if (fx && fy && fx !== fy) return fx < fy ? -1 : 1;
    const dx = Math.abs(x.difficulty - target) + (x.difficulty > target ? 0.5 : 0), dy = Math.abs(y.difficulty - target) + (y.difficulty > target ? 0.5 : 0);
    return dx - dy;
  });
}

/** What a scene coming back asks that's new: the part not yet played, or, both parts played, another reading. Last time's partner isn't given again (`partnerFor`'s `avoid`). */
export interface Revisit { assignmentId: string; on: string; role: 0 | 1; partner?: number; change: 'role' | 'reading' }

/** The part to play in a scene, and what's new about it if it has been studied before. */
export function revisitOf(past: readonly Worked[], draw: number): { role: 0 | 1; revisit?: Revisit } {
  const last = [...past].sort((a, b) => (a.setOn < b.setOn ? -1 : 1)).at(-1);
  if (!last) return { role: draw < 0.5 ? 0 : 1 };
  const played = new Set(past.map((a) => a.role));
  const base = { assignmentId: last.id, on: last.setOn, role: last.role ?? 0, ...(last.partner !== undefined ? { partner: last.partner } : {}) };
  if (!played.has(0) || !played.has(1)) return { role: played.has(0) ? 1 : 0, revisit: { ...base, change: 'role' } };
  // Both parts played: the last one's other, and something else asked of it.
  return { role: last.role === 0 ? 1 : 0, revisit: { ...base, change: 'reading' } };
}

/** The partner: the classmate least worked with, never last time's in this course or this scene where another is free. */
export function partnerFor(assignments: readonly Worked[], course: string, classmates: number, draw: number, avoid: readonly number[] = []): number {
  const count = Array.from({ length: classmates }, () => 0);
  for (const a of assignments) if (a.partner !== undefined && a.partner < classmates) count[a.partner]! += 1;
  const lastHere = [...assignments].filter((a) => a.course === course && a.partner !== undefined).sort((a, b) => (a.setOn < b.setOn ? -1 : 1)).at(-1)?.partner;
  const not = new Set([...(lastHere !== undefined ? [lastHere] : []), ...avoid]);
  const free = count.map((n, i) => ({ n, i })).filter((x) => !not.has(x.i) || not.size >= classmates);
  const least = Math.min(...free.map((x) => x.n));
  const pool = free.filter((x) => x.n === least);
  return pool[Math.floor(draw * pool.length)]!.i;
}

/** A learning objective: the part of the work an assignment asks you to put first. */
export type Objective = 'circumstances' | 'lines' | 'choices' | 'shape' | 'listening';
export const OBJECTIVE_DIM: Record<Objective, PrepDim> = { circumstances: 'familiarity', lines: 'memorization', choices: 'interpretation', shape: 'rehearsal', listening: 'partner' };
/** An objective in the work's own words: the template's label for the part it puts first ("Lines", "The Sequence Learned"). Until a first played save, a scene's words named every course's objective, and a voice sequence was asked to know the world of it. */
export const objectiveLabel = (t: Template, o: Objective): string => t.dims[OBJECTIVE_DIM[o]]?.label ?? OBJECTIVE_DIM[o];

/**
 * The objective for the next assignment of a course: the part an open note
 * has named most often, where the work has it; otherwise the part this
 * course asked of you longest ago (never asked first).
 */
export function objectiveFor(t: Template, course: string, assignments: readonly Worked[], notes: readonly NoteRecord[]): Objective | undefined {
  const offered = (Object.keys(OBJECTIVE_DIM) as Objective[]).filter((o) => t.dims[OBJECTIVE_DIM[o]] && (o !== 'listening' || t.paired));
  if (!offered.length) return undefined;
  const open = notes.filter((n) => n.status === 'open' && n.given >= 2).sort((a, b) => b.given - a.given);
  for (const n of open) {
    const o = offered.find((x) => `dim:${OBJECTIVE_DIM[x]}` === n.key);
    if (o) return o;
  }
  const lastAsked = (o: Objective) => assignments.filter((a) => a.course === course && a.objective === o).reduce((m, a) => (a.setOn > m ? a.setOn : m), '');
  return [...offered].sort((a, b) => (lastAsked(a) < lastAsked(b) ? -1 : lastAsked(a) > lastAsked(b) ? 1 : 0))[0];
}

/** The ledger's entry for a note's subject, if it's been given before. */
export const noteRecord = (notes: readonly NoteRecord[], key: string): NoteRecord | undefined => notes.find((n) => n.key === key);

/**
 * How a note given now stands against the ledger: new, the same again, or
 * better but short; and the entry kept (made, or moved on). `level` is what
 * the note measures now, where it measures something.
 */
export function recordNote(notes: NoteRecord[], focus: NoteFocus, on: string, assignmentId: string, course: string, level?: number): { kind: NoteKind; before?: NoteRecord } {
  const key = noteKey(focus);
  const rec = noteRecord(notes, key);
  const before = rec ? { ...rec, history: [...rec.history] } : undefined;
  let kind: NoteKind;
  if (focus.kind === 'advanced') kind = 'advanced';
  else if (!rec) kind = 'new';
  else if (rec.status === 'resolved') kind = 'recurring';
  else if (level !== undefined && rec.level !== undefined && level >= rec.level + LEARNING.better) kind = 'partial';
  else kind = 'recurring';
  const entry = rec ?? { key, status: 'open' as const, first: on, last: on, given: 0, history: [] };
  if (!rec) notes.push(entry);
  entry.status = 'open';
  delete entry.resolvedOn;
  entry.last = on;
  entry.given += 1;
  if (level !== undefined) entry.level = level; else delete entry.level;
  entry.history.push({ on, assignmentId, course, kind });
  if (entry.history.length > LEARNING.history) entry.history.splice(0, entry.history.length - LEARNING.history);
  return { kind, ...(before ? { before } : {}) };
}

/** A note's subject put right: marked taken, with when. Returns whether it was open. */
export function resolveNote(notes: NoteRecord[], key: string, on: string, assignmentId: string, course: string): boolean {
  const rec = noteRecord(notes, key);
  if (!rec || rec.status !== 'open') return false;
  rec.status = 'resolved';
  rec.resolvedOn = on;
  rec.history.push({ on, assignmentId, course, kind: 'applied' });
  if (rec.history.length > LEARNING.history) rec.history.splice(0, rec.history.length - LEARNING.history);
  return true;
}

/** Whether a note on a subject may be given now: not one put right and holding (above where it slips back). */
export function mayGive(notes: readonly NoteRecord[], key: string, level?: number): boolean {
  const rec = noteRecord(notes, key);
  if (!rec || rec.status === 'open') return true;
  return level !== undefined && level < LEARNING.slipped;
}

/** The step beyond the work given least recently, so two showings with nothing holding them back don't hear the same thing. */
/**
 * Which steps beyond fit a piece of work (from 2026-10-08): another person's
 * only where there's a partner, the text's and the stakes' only where there's
 * material, letting go where it's the body or the voice alone. Until then
 * a voice sequence could be told to let its partner change it.
 */
export function challengesFor(t: Template): Challenge[] {
  const scene = t.material !== 'none';
  return (Object.keys(ADVANCED) as Challenge[]).filter((c) => (c === 'listening' ? t.paired : c === 'text' || c === 'stakes' || c === 'contrast' ? scene : c === 'release' ? !scene : true));
}

export function nextChallenge(notes: readonly NoteRecord[], draw: number, fits: readonly Challenge[] = Object.keys(ADVANCED) as Challenge[], notAgain?: Challenge): Challenge {
  // Not the one the course gave last, where another fits (a measured term found the same words twice running in a course).
  const all = fits.length > 1 && notAgain ? fits.filter((c) => c !== notAgain) : fits.length ? [...fits] : (Object.keys(ADVANCED) as Challenge[]);
  const last = (c: Challenge) => noteRecord(notes, `advanced:${c}`)?.last ?? '';
  const sorted = [...all].sort((a, b) => (last(a) < last(b) ? -1 : last(a) > last(b) ? 1 : 0));
  const oldest = sorted.filter((c) => last(c) === last(sorted[0]!));
  return oldest[Math.floor(draw * oldest.length)]!;
}

/** A scene's title for a sentence. */
export const sceneTitle = (id: string | undefined): string | undefined => (id ? sceneById(id)?.play : undefined);

/**
 * Freshness, measured on a record (from 2026-10-08; `tools/freshness.mjs`
 * reads a save with it). Explicit criteria, not impressions:
 * - `recentRepeat`: of the work with material, the share whose scene was set
 *   in any of the six pieces of material work before it (a measure of how much
 *   material fits, since a scene comes back only once every fitting one has
 *   been studied);
 * - `avoidableRepeat`: the scenes set again while one that fitted was still
 *   unstudied (the rule says none), and `unacknowledged`: those set again
 *   without saying so and asking something new of them (none);
 * - `partnerRepeat`: of paired work, the share with the same partner as the
 *   course's previous paired work;
 * - `sameNoteRun`: of notes given, the share whose words are identical to the
 *   previous note in the same course;
 * - the notes by kind, the revisits by what changed, and the objectives set.
 */
export interface Freshness {
  assignments: number; withMaterial: number; scenes: number; recentRepeat: number; avoidableRepeat: number; unacknowledged: number;
  revisits: Record<string, number>; paired: number; partners: number; partnerRepeat: number;
  notes: number; sameNoteRun: number; kinds: Record<string, number>; objectives: Record<string, number>;
  /** Of notes given, the share on the same subject as the course's previous note, whatever the words (from 2026-10-08). */
  sameSubjectRun: number;
  /** Approaches chosen, by kind. */
  approaches: Record<string, number>;
}
export function freshnessOf(assignments: readonly (Worked & { feedback?: { text: string; kind?: string; focus?: NoteFocus }; revisit?: { change: string }; approach?: { kind: string } })[]): Freshness {
  const ordered = [...assignments].sort((a, b) => (a.setOn < b.setOn ? -1 : a.setOn > b.setOn ? 1 : 0));
  const material = ordered.filter((a) => a.sceneId);
  const recent = material.filter((a, i) => material.slice(Math.max(0, i - 6), i).some((b) => b.sceneId === a.sceneId)).length;
  const before = (a: Worked) => ordered.filter((b) => b.setOn < a.setOn || (b.setOn === a.setOn && ordered.indexOf(b) < ordered.indexOf(a)));
  const again = material.filter((a) => scenePast(before(a), a.sceneId!).length > 0);
  const avoidable = again.filter((a) => { const t = templateById(a.template); return t !== undefined && scenesFor(t, a.course, before(a), 2).some((x) => !scenePast(before(a), x.id).length); }).length;
  const unacknowledged = again.filter((a) => !a.revisit).length;
  const paired = ordered.filter((a) => a.partner !== undefined);
  const partnerRepeat = paired.filter((a) => { const prev = paired.filter((b) => b.course === a.course && b.setOn < a.setOn).at(-1); return prev !== undefined && prev.partner === a.partner; }).length;
  const noted = ordered.filter((a) => a.feedback);
  const sameRun = noted.filter((a) => { const prev = noted.filter((b) => b.course === a.course && b.setOn < a.setOn).at(-1); return prev !== undefined && prev.feedback!.text === a.feedback!.text; }).length;
  const sameSubject = noted.filter((a) => { const prev = noted.filter((b) => b.course === a.course && b.setOn < a.setOn).at(-1); return prev?.feedback?.focus !== undefined && a.feedback!.focus !== undefined && noteKey(prev.feedback.focus) === noteKey(a.feedback!.focus); }).length;
  const count = (xs: (string | undefined)[]) => xs.reduce<Record<string, number>>((m, x) => { if (x) m[x] = (m[x] ?? 0) + 1; return m; }, {});
  const share = (n: number, of: number) => (of ? Math.round((n / of) * 1000) / 1000 : 0);
  return {
    assignments: ordered.length, withMaterial: material.length, scenes: new Set(material.map((a) => a.sceneId)).size, recentRepeat: share(recent, material.length), avoidableRepeat: avoidable, unacknowledged,
    revisits: count(ordered.map((a) => a.revisit?.change)), paired: paired.length, partners: new Set(paired.map((a) => a.partner)).size, partnerRepeat: share(partnerRepeat, paired.length),
    notes: noted.length, sameNoteRun: share(sameRun, noted.length), sameSubjectRun: share(sameSubject, noted.length), kinds: count(noted.map((a) => a.feedback!.kind)), objectives: count(ordered.map((a) => a.objective)), approaches: count(ordered.map((a) => a.approach?.kind)),
  };
}

const DIM_SUBJECT: Record<PrepDim, string> = { familiarity: 'Knowing The Material', memorization: 'Lines', interpretation: 'The Choices', rehearsal: 'Time On Its Feet', partner: 'Work With Your Partner', revision: 'Working A Note' };
/** A ledger entry's subject in words, Title Case. */
export function noteSubject(key: string): string {
  const [kind, what] = key.split(':') as [string, string];
  if (kind === 'dim') return DIM_SUBJECT[what as PrepDim] ?? what;
  if (kind === 'choice') return `A Choice: ${QUESTIONS.find((q) => q.id === what)?.label ?? what}`;
  if (kind === 'skill') return SKILLS.find((k) => k.id === what)?.label ?? what;
  return 'The Next Step';
}
