/**
 * SLATE — a production's rehearsal process, inside the casting the chair
 * assigns (from 2026-10-07; `systems/school.ts` keeps the casting itself, its
 * calls and its nights).
 *
 * Each rehearsal call carries its stage, set when the calls are booked: the
 * read-through first, then blocking for the first two-fifths of the calls,
 * then work-throughs, and the last two before opening the technical and the
 * dress rehearsal. An understudy's calls are their own rehearsals of the part
 * they cover. What's kept for a part:
 * - **Lines**, learned at the calls (a share of what's left at each) and by the
 *   actor's own work on the part (`school.learn_part`);
 * - **Blocking**, set at the blocking calls; one missed is caught up from the
 *   stage manager's book (`school.review_blocking`);
 * - **Notes**: at each work-through the director gives one (the game's,
 *   marked simulated), on what most needs it now: a blocking call missed,
 *   the lines past the off-book call, the blocking, or the craft the play asks. Worked on before
 *   the next call (`school.work_note`), it's taken there, and that call's
 *   growth is the better for it; not worked on, it's still there. A note on
 *   the craft whose problem is a limit on the weakness the actor's work keeps
 *   coming back to says so, with the pieces it has held back before this
 *   (from 2026-10-12, `noteText`; until then a note knew only the part).
 * - **The dress**, played through as a night with no house, its reading kept.
 *
 * - **How the part is played** (from 2026-10-10): the actor's choice of pace, scale and structure
 *   (`systems/material.ts`), rehearsed in at every call after it's made; and the director's own request on an axis,
 *   drawn once for the production and shown from the first call, which the material's own constraints bound. A choice
 *   against the request is given as a note at a work-through, and taken at the next call if the choice has changed.
 *
 * A night reads all of it. Until 2026-10-09 the lines, blocking and notes
 * taken made a readiness factor around 1, 0.85 to 1.15, measured against what
 * an actor who came to every one of this casting's calls and did no more would
 * have (`parFor`), who played at 1, and a night played at that factor. In the
 * first version that par was one number, 0.7, and such an actor in the
 * Carlotta's twelve calls played at 0.988, a little worse for doing everything
 * asked. From 2026-10-09 the factor reaches only a night's growth
 * (`nightFactor`), and the night itself is judged by the evaluation, which reads
 * the process as its preparation against what every call kept makes of it
 * (`completeFor`), never under `NIGHT_LEAST` of the lines and the blocking (this
 * said until 2026-10-12 that a night played at the factor).
 * Every number here is SLATE's estimate: no school publishes a rehearsal's
 * arithmetic.
 */

import { hash, pick } from './feedback';
import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { zonedParts, type Instant } from '../core/time';
import { SKILLS, YALE_DRAMA, type Skill } from '../content/school';
import { CITIES } from '../content/geography';
import { startRefusal } from './life';
import { exerts } from './body';
import { CABARET_KIND, CALL_KIND, SUMMER_KIND, type Craft } from './school';
import { courseworkOf, notesOf } from './coursework';
import { recordNote, type NoteFocus as LedgerFocus } from './learning';
import { develop, stepSpeed, type Target } from './attributes';
import { genreSpeed } from './engagement';
import { genresOfPlay } from '../content/plays';
import { AXES, APPROACH_EFFECT } from '../content/approaches';
import type { Axis, AxisValue } from '../content/material';
import { choose, materialOf, misfitOf, rehearseChoice, sidesOf, type Playing } from './material';
import { noteMaterial } from './experience';
import { countDirection } from './evaluation';
import { identityOf } from './artistry';
import { WORKBOOK, ADJUSTMENTS, type AdjustmentId } from '../content/workbook';
import { optionsOf, problemsOf, stillThere, tryAdjustment, wayRefusal, type Problem, type WorkPiece } from './workbook';
import { workPiece } from './workpieces';
import { rehearseWays } from './piece';

export const PROCESS = {
  /** What a call attended does to lines and blocking, as a share of what's left. */
  call: { lines: 0.12, blocking: 0.25 },
  /** The actor's own work: an hour on the part, on the blocking book, on a note. */
  own: { lines: 0.3, blocking: 0.5, minutes: 60, trainsAtMost: 3, trainingWeight: 0.25 },
  /** The share of the calls that block, and where the lines are asked off book. */
  blockingShare: 0.4,
  offBook: 0.7,
  /** The readiness factor's weights, how far it moves either side of the par, and its bounds. */
  factor: { lines: 0.5, blocking: 0.3, notes: 0.2, slope: 0.3, least: 0.85, most: 1.15 },
  /** A note taken: that call's growth. */
  noteTaken: 1.1,
  /**
   * A craft note worked and learned from without moving it (from 2026-10-16): half a taken note's, in the call's growth
   * and in the notes share a night reads. The work was done and its evidence kept; nothing it measured improved.
   */
  noteLearned: 0.5,
} as const;

export type Stage = 'read' | 'blocking' | 'work' | 'tech' | 'dress' | 'techdress' | 'understudy';
export const STAGE_LABEL: Record<Stage, string> = { read: 'Read-Through', blocking: 'Blocking Rehearsal', work: 'Rehearsal', tech: 'Technical Rehearsal', dress: 'Dress Rehearsal', techdress: 'Technical And Dress Rehearsal', understudy: 'Understudy Rehearsal' };

/**
 * How a format's calls run. A School production, the Rep and a Summer
 * Cabaret show are full productions (`stagesOf`). A Yale Cabaret show is a
 * new piece put up over a few weeknight evenings in a small room (from
 * 2026-10-08; the Bulletin: "strictly extracurricular"): a read-through, two
 * evenings blocking, then work, and its last evening the technical and dress
 * at once (`cabaretStages`); how it divides is SLATE's reading.
 */
export type Format = 'production' | 'cabaret';

/**
 * What a director's note is about (from 2026-10-12, `craft`): something the part's own forecast shows, named as a
 * director names it: what the character wants (`objective`), taking what the others give (`listening`), the pace and
 * the stamina to hold it (`pacing`), the physical life (`behavior`), a change between parts of the play
 * (`transitions`), what the character is to the others (`relationship`). Each is a problem the workbook can work
 * (`systems/workbook.ts`), with several ways at it, and its figure when given, so the next call can read whether it was
 * addressed. Until then a note past the lines and the blocking named the play's weakest raw craft skill and was taken
 * by working it once, whatever the skill or the work.
 */
export type CraftNote = 'objective' | 'listening' | 'pacing' | 'behavior' | 'transitions' | 'relationship';
export type NoteFocus = { kind: 'lines' } | { kind: 'blocking' } | { kind: 'skill'; skill: Skill } | { kind: 'direction'; axis: Axis; side: AxisValue }
  | { kind: 'craft'; note: CraftNote; problem: string; segment?: number; where?: string; measure: number };
/**
 * What became of a craft note by the next call (from 2026-10-16): `resolved`, its problem gone from the part's forecast;
 * `better`, a way kept that moved the note's own figure by `WORKBOOK.evidence` or more; `learned`, a way tried and its
 * evidence kept, but nothing moved; `unchanged`, not worked and still there. Only the first two are a note taken.
 */
export type NoteOutcome = 'resolved' | 'better' | 'learned' | 'unchanged';
export interface DirectorNote {
  at: Instant; text: string; focus: NoteFocus; worked?: boolean; taken?: boolean;
  /** What became of it, for a craft note (from 2026-10-16). Absent on a note from before, or one not on the craft. */
  outcome?: NoteOutcome;
  /** How it was answered (from 2026-10-12): the way tried and its own evidence, before and after it, and the note's figure at the next call. */
  answer?: { solution?: string; label?: string; before: number; after: number; now?: number };
}

export interface Process {
  lines: number;
  blocking: number;
  calls: number;
  /** Blocking calls missed, each a gap to catch up from the book. */
  blockingMissed: number;
  notes: DirectorNote[];
  trained: number;
  dress?: string;
  /** The rehearsal calls this casting has, and whether they're an understudy's: what the par is measured on. */
  of?: number;
  understudy?: boolean;
  /** A format whose calls run otherwise than a full production's (`Format`). */
  format?: Format;
  /** Looking back once it closed (`reflect`), from 2026-10-08. */
  reflection?: { on: Instant; text: string };
  /** How the actor plays the part, and the director's request on an axis (none asked: `{}`), from 2026-10-10. */
  playing?: Playing;
  direction?: Partial<Record<Axis, AxisValue>>;
  /** Focused work on each movement of the play, 0 to 1 (from 2026-10-12, `systems/workbook.ts`): each refines the blocking there. */
  work?: number[];
  /**
   * The nights together (from 2026-10-12, `systems/ensemble.ts`): the company's nights summed, how many, the slips in the
   * company, and those you covered. Read by the run's looking back and the morale a night leaves.
   */
  together?: { sum: number; n: number; slips: number; covered: number };
  /** The problem being worked on, the tries and the discoveries kept (from 2026-10-12, `systems/workbook.ts`). */
  book?: import('./piece').Workbook;
}

/** The share of productions whose director asks for a particular way on one axis: SLATE's estimate. */
export const DIRECTION = { asks: 0.5 } as const;

/**
 * The director's request, drawn once for a production: on one axis, half the time, a side the play's material allows.
 * Deterministic by the production's own key, so a reload draws the same.
 */
export function drawDirection(sim: Simulation, person: Person, holder: Holder): Partial<Record<Axis, AxisValue>> {
  const title = (holder as { play?: string; production?: string }).play ?? (holder as { production?: string }).production ?? 'work';
  const term = (holder as { term?: number }).term ?? 0;
  const rng = sim.rng('production.direction', person.id, `${title}:${term}`);
  if (rng.next() >= DIRECTION.asks) return {};
  const axes = Object.keys(AXES) as Axis[];
  const axis = axes[Math.floor(rng.next() * axes.length)]!;
  const material = materialOf((holder as { play?: string }).play);
  const sides = AXES[axis].values.filter((v) => !material?.allows?.[axis] || material.allows[axis]!.includes(v));
  return { [axis]: sides[Math.floor(rng.next() * sides.length)]! };
}

/** The axis on which the actor's playing goes against the director's request, if one does. */
export function againstDirection(p: Process): { axis: Axis; side: AxisValue } | undefined {
  for (const [axis, side] of Object.entries(p.direction ?? {}) as [Axis, AxisValue][]) if (p.playing?.[axis] !== undefined && misfitOf(axis, p.playing[axis]!, undefined, p.direction)) return { axis, side };
  return undefined;
}

/** Why a part's playing can't be chosen now, or nothing. */
export function partPlayingRefusal(sim: Simulation, person: Person, which: Which): string | undefined {
  const casting = holderFor(sim, person, which);
  if (!casting) return 'You aren’t cast in anything there.';
  if (!pendingOf(sim, person, which).length) return 'The run is over.';
  return undefined;
}

/** Anything a process can be kept on: a casting, a Cabaret show, a Summer Cabaret show. */
export type Holder = object;
export const processOf = (holder: Holder): Process => ((holder as { process?: Process }).process ??= { lines: 0, blocking: 0, calls: 0, blockingMissed: 0, notes: [], trained: 0 });
export const hasProcess = <T extends Holder>(holder: T | undefined): holder is T & { process: Process } => Boolean(holder && (holder as { process?: Process }).process);

/** A Cabaret show's evenings: the read-through, two blocking, work, and the last the technical and dress together. */
export function cabaretStages(n: number): Stage[] {
  return Array.from({ length: n }, (_, i): Stage => (i === 0 ? 'read' : n >= 3 && i === n - 1 ? 'techdress' : i <= 2 ? 'blocking' : 'work'));
}
/** A format's stages for a run of calls. */
export const stagesFor = (n: number, format: Format = 'production'): Stage[] => (format === 'cabaret' ? cabaretStages(n) : stagesOf(n));

/** The stages of a run of rehearsal calls in order: the first a read-through, two-fifths blocking, the last two before opening tech and dress. */
export function stagesOf(n: number): Stage[] {
  return Array.from({ length: n }, (_, i): Stage => {
    if (i === 0) return 'read';
    if (n >= 4 && i === n - 1) return 'dress';
    if (n >= 4 && i === n - 2) return 'tech';
    return i < Math.max(2, Math.round(n * PROCESS.blockingShare)) ? 'blocking' : 'work';
  });
}

const labelOf = (skill: Skill) => SKILLS.find((k) => k.id === skill)?.label ?? skill;
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/**
 * The notes taken, as a share of the notes given; none given, none to take. A craft note learned from without moving it
 * counts `PROCESS.noteLearned` of one (from 2026-10-16): until then such a note counted as taken whole.
 */
const notesShare = (p: { notes: { taken?: boolean; outcome?: NoteOutcome }[] }) => (p.notes.length ? p.notes.reduce((t, n) => t + (n.taken ? 1 : n.outcome === 'learned' ? PROCESS.noteLearned : 0), 0) / p.notes.length : 0);
const scoreOf = (p: { lines: number; blocking: number; notes: { taken?: boolean; outcome?: NoteOutcome }[] }) => PROCESS.factor.lines * p.lines + PROCESS.factor.blocking * p.blocking + PROCESS.factor.notes * notesShare(p);

type Kept = Pick<Process, 'lines' | 'blocking' | 'blockingMissed'>;
/** What a note is on: a blocking call missed and not caught up, the lines past off-book, the blocking short, else the play's craft. */
const noteKind = (p: Kept, n: number, of: number): 'lines' | 'blocking' | 'skill' =>
  p.blockingMissed > 0 ? 'blocking' : n / Math.max(1, of) >= PROCESS.blockingShare && p.lines < PROCESS.offBook ? 'lines' : p.blocking < 0.7 ? 'blocking' : 'skill';
/** Whether a note not worked on is taken anyway: a lines or blocking note is, once the calls have done it. */
const takenUnworked = (p: Kept, kind: NoteFocus['kind']) =>
  (kind === 'lines' && p.lines >= PROCESS.offBook) || (kind === 'blocking' && p.blocking >= 0.7 && p.blockingMissed === 0);
/** One call's lines and blocking, attended. */
const attend = (p: Kept, stage: Stage) => {
  p.lines = clamp01(p.lines + PROCESS.call.lines * (1 - p.lines));
  if (stage === 'blocking' || stage === 'tech' || stage === 'techdress' || stage === 'understudy') p.blocking = clamp01(p.blocking + PROCESS.call.blocking * (1 - p.blocking));
};

/** The score of an actor who came to all of a run of calls and did nothing more: the par a night is measured against. */
export function parFor(of: number, understudy = false, format: Format = 'production'): number {
  return scoreOf(parProcess(of, understudy, format));
}

/** What every call attended and no more makes of a process: its lines, blocking and notes. */
function parProcess(of: number, understudy = false, format: Format = 'production') {
  const p = { lines: 0, blocking: 0, blockingMissed: 0, notes: [] as { kind: NoteFocus['kind']; taken?: boolean }[] };
  const stages = understudy ? Array.from({ length: of }, (): Stage => 'understudy') : stagesFor(of, format);
  stages.forEach((stage, i) => {
    attend(p, stage);
    const last = p.notes.at(-1);
    if (last && last.taken === undefined) last.taken = takenUnworked(p, last.kind);
    if (stage === 'work') p.notes.push({ kind: noteKind(p, i + 1, of) });
  });
  return p;
}

/**
 * What every call attended makes of the lines, the blocking and the notes (`prepOf`, `content/tasks.ts`
 * `performance`), from 2026-10-09, as the par did for the night's factor before. A night asks this, but never less than
 * `NIGHT_LEAST` of the lines and the blocking however few the calls (`nightEvaluation`), so a short run is complete only
 * with the actor's own work: Learn The Part for the lines, and for the blocking Work On The Note when a work-through's
 * note is on it, or Work It Through. Measured on
 * 2026-10-12, a Yale Cabaret show's nine evenings make lines 68% and blocking 58%, and a ten-call production's blocking
 * 68%, all under 70%. A call missed leaves a further gap, made up the same way. Until 2026-10-12 this said an actor who
 * came to every call was fully prepared, which the night, asking `NIGHT_LEAST` from the day it read this, never held.
 */
export function completeFor(holder: Holder | undefined): { lines: number; blocking: number; notes: number } | undefined {
  if (!hasProcess(holder)) return undefined;
  const p = holder.process;
  const par = parProcess(p.of ?? 0, p.understudy, p.format);
  return { lines: par.lines, blocking: par.blocking, notes: par.notes.length ? notesShare(par) : 1 };
}

/**
 * The process as a night’s preparation (`content/tasks.ts` `performance`): the lines; the blocking, to which a missed
 * blocking call added nothing (Catch Up The Blocking adds its share of what’s left, `school.review_blocking`); and the
 * share of notes taken. None for a casting from before the process, whose preparation the evaluation doesn’t read.
 * Until 2026-10-13 this said a missed blocking call not caught up was taken off the blocking, which nothing here did.
 */
export function prepOf(holder: Holder | undefined): { lines: number; blocking: number; notes: number } | undefined {
  if (!hasProcess(holder)) return undefined;
  const p = holder.process;
  return { lines: p.lines, blocking: p.blocking, notes: p.notes.length ? notesShare(p) : 1 };
}

/** A night's readiness factor from the process: 1 for an actor who came to every call and did no more; 1 for a casting from before the process. */
export function nightFactor(holder: Holder | undefined): number {
  if (!hasProcess(holder)) return 1;
  const p = holder.process;
  const f = PROCESS.factor;
  return Math.max(f.least, Math.min(f.most, 1 + f.slope * (scoreOf(p) - parFor(p.of ?? 0, p.understudy, p.format))));
}

/**
 * What kind of note a problem the part's forecast shows is, as a director says it. A movement held back most by tiring
 * (the stamina drain, `systems/piece.ts`) is a note on its pacing, "It sags in…" (from 2026-10-12): until then it was
 * read by the quality the drain cost most, believability, and given "I don't know what you want in…".
 */
export function craftNoteOf(problem: Problem, e: { piece?: { segments: { chief?: { kind: string; what: string; dimension: string } }[] }; limits: { kind: string; what: string; dimension: string }[] }): CraftNote {
  if (problem.kind === 'turn') return 'transitions';
  if (problem.kind === 'stamina') return 'pacing';
  if (problem.kind === 'partner') return 'listening';
  if (problem.kind === 'objective') return 'objective';
  const chief = problem.kind !== 'limit' && problem.segment !== undefined ? e.piece?.segments[problem.segment]?.chief : undefined;
  if (chief?.kind === 'condition' && chief.what === 'stamina') return 'pacing';
  const dim = problem.kind === 'limit'
    ? e.limits.find((l) => `limit:${l.what}` === problem.id)?.dimension
    : chief?.dimension;
  return dim === 'connection' ? 'relationship' : dim === 'responsiveness' ? 'listening' : dim === 'execution' ? 'behavior' : dim === 'consistency' ? 'pacing' : 'objective';
}

/**
 * The craft note a director would give now, from the part's own forecast (`problemsOf`, from 2026-10-12): its worst
 * problem past the lines and the blocking, which the calls themselves answer. A note just taken moves on to the next
 * problem. Nothing the forecast shows: no craft note.
 */
export function craftNoteFrom(piece: WorkPiece | undefined, p: Process): NoteFocus | undefined {
  if (!piece) return undefined;
  const e = piece.forecast();
  const last = [...p.notes].reverse().find((x) => x.focus.kind === 'craft');
  // A note there's a way to work: the worst problem with at least one way at it.
  const problems = problemsOf(piece).filter((x) => x.kind !== 'prep' && !(last?.taken && last.focus.kind === 'craft' && last.focus.problem === x.id));
  const pick = problems.find((x) => optionsOf(piece, x).length > 0);
  if (!pick) return undefined;
  const where = pick.segment !== undefined ? e.piece?.segments[pick.segment]?.label : undefined;
  return { kind: 'craft', note: craftNoteOf(pick, e), problem: pick.id, ...(pick.segment !== undefined ? { segment: pick.segment } : {}), ...(where ? { where } : {}), measure: pick.measure };
}

/** The note a director gives at a work-through: a gap in the blocking, the lines past off-book, the blocking short, else what the part's forecast shows (`craftNoteFrom`), else the play's craft weakest in the actor. */
export function noteFor(person: Person, p: Process, reads: Partial<Craft>, n: number, of: number, piece?: WorkPiece): NoteFocus {
  const kind = noteKind(p, n, of);
  if (kind !== 'skill') return { kind } as NoteFocus;
  const craft = craftNoteFrom(piece, p);
  if (craft) return craft;
  const order = (Object.keys(reads) as Skill[]).sort((a, b) => person.craft![a] - person.craft![b]);
  // A skill note just taken moves the next one on to the next thinnest place (from the integration pass of 2026-10-10):
  // until then the same note came at every work-through while that skill stayed the weakest, taken or not.
  const prev = [...p.notes].reverse().find((x) => x.focus.kind === 'skill');
  const taken = prev?.taken && prev.focus.kind === 'skill' ? prev.focus.skill : undefined;
  const weakest = (taken && order[0] === taken && order.length > 1 ? order[1] : order[0]) ?? 'scene';
  return { kind: 'skill', skill: weakest };
}

/**
 * A note's words, and where the same note was given before at this work, what came of it (from the integration pass of
 * 2026-10-10): not taken, it's said again as still; taken, it's acknowledged before more is asked.
 *
 * `recurring` is the weakness the actor's work so far keeps coming back to (`Identity.recurring`, `systems/artistry.ts`).
 * A note on the craft whose problem is a limit on it says so, and how many pieces it has held back before this (from
 * 2026-10-12): until then a note knew only this part, never the actor's history. It's words alone: the note's problem,
 * its figure and what answers it are the same either way.
 */
/**
 * A director's voice (from 2026-10-20, the owner's brief 17, section 4): each production's director keeps one, chosen
 * from the production by a hash, never a draw (`directorVoiceOf`), so the same director sounds the same at every call.
 * - `plain`: blunt and short, in the first person; the note and what to do about it.
 * - `exacting`: precise about where and what; the fix as a task.
 * - `encouraging`: the same note put as what it opens up.
 * The words are SLATE's, a fictional director's; the screen says so beside them. Until brief 17 every production's
 * director said each note in the same words.
 */
export type DirectorVoice = 'plain' | 'exacting' | 'encouraging';
const DIRECTOR_VOICES: readonly DirectorVoice[] = ['plain', 'exacting', 'encouraging'];
export const directorVoiceOf = (key: string): DirectorVoice => DIRECTOR_VOICES[hash(`director:${key}`) % DIRECTOR_VOICES.length]!;

export function noteText(f: NoteFocus, before?: DirectorNote, recurring?: { target: string; label: string; pieces: number }, memory?: { key: string; recent: readonly string[]; voice?: DirectorVoice }): string {
  const voice = memory?.voice ?? 'plain';
  const words = noteWords(f, voice);
  const history = f.kind === 'craft' && recurring && f.problem === `limit:${recurring.target}` ? ` It’s your ${recurring.label.toLowerCase()} again: it’s held back ${recurring.pieces} of your pieces before this.` : '';
  if (!before) return `${words}${history}`;
  // What was tried for it before, said, where it was worked a way of its own (from 2026-10-12), and from 2026-10-16
  // whether it moved it: a way that changed nothing is said to have, not called better.
  const a = before.answer;
  const moved = a?.solution ? Math.max(a.after, a.now ?? a.after) - a.before : 0;
  // The way tried named as its control names it (from 2026-10-20, brief 16): until then lower-cased into the sentence,
  // "You tried work it slowly".
  const tried = a?.solution ? ` You tried ${a.label ?? ADJUSTMENTS[a.solution as AdjustmentId]?.label ?? a.solution}: ${a.before} then, ${a.now ?? a.after} now${before.outcome === 'learned' || (before.outcome === undefined && moved < WORKBOOK.evidence && !before.taken) ? (Math.min(a.after, a.now ?? a.after) - a.before <= -WORKBOOK.evidence ? ', which made it worse: worth knowing, and not the answer' : ', which didn’t move it: worth knowing, and not the answer') : ''}.` : '';
  // Said a few true ways, where the part's own last notes are passed (from 2026-10-20, brief 16, `pick`): until then every
  // note after one taken began "Better since the last note." and every one not taken "Still:", 17 and 29 of 85 notes in
  // brief 16's baseline. Without them, the first way, as before.
  // In the director's voice (brief 17): what came of the last note, then this one.
  const TAKEN: Record<DirectorVoice, string[]> = {
    plain: [`Better since the last note.${tried} ${words}${history}`, `That’s moved since the last note.${tried} Now: ${continued(words)}${history}`],
    exacting: [`The last note took.${tried} Next: ${continued(words)}${history}`, `That’s fixed.${tried} Now: ${continued(words)}${history}`, `The last note took.${tried} ${words}${history}`],
    encouraging: [`That last note landed.${tried} Next: ${continued(words)}${history}`, `Good: that’s moved since the last call.${tried} ${words}${history}`],
  };
  const STILL: Record<DirectorVoice, string[]> = {
    plain: [`Still: ${continued(words)}${tried}${history}`, `Same note as at the last call. ${words}${tried}${history}`],
    exacting: [`Not there yet. ${words}${tried}${history}`, `The same note as last time: ${continued(words)}${tried}${history}`],
    encouraging: [`We’re still on the last note. ${words}${tried}${history}`, `Keep at the last note: ${continued(words)}${tried}${history}`],
  };
  // Never two colons in a sentence (brief 17's first after-run: "Keep at the last note: get off book: once the lines are
  // in you…"): a way that would put a colon before words that have one gives way to one that doesn't, where there is one.
  const all = before.taken ? TAKEN[voice] : STILL[voice];
  const single = all.filter((o) => !o.split(/(?<=[.!?])\s+/).some((x) => (x.match(/:/g) ?? []).length > 1));
  const options = single.length ? single : all;
  return memory ? pick(options, memory.key, memory.recent) : options[0]!;
}

/**
 * A note's words carried on after "Still:", their first letter small, but never the word "I" (from 2026-10-13: until then
 * a note on what the actor wants came again as "Still: i don’t know what you want…", and a direction as "Still: i want
 * it…", found on the director's-note journey's save).
 */
const continued = (words: string): string => (/^I[\s’']/.test(words) ? words : `${words.charAt(0).toLowerCase()}${words.slice(1)}`);

/** A note's words, in the director's voice: the same note, the same place and the same fix, told three ways. */
function noteWords(f: NoteFocus, v: DirectorVoice = 'plain'): string {
  const pick3 = (plain: string, exacting: string, encouraging: string) => (v === 'exacting' ? exacting : v === 'encouraging' ? encouraging : plain);
  if (f.kind === 'lines') return pick3('Be off book: the lines aren’t there yet, and the scene can’t start until they are.', 'The lines aren’t there yet. I need you off book before we can work on anything else.', 'Get off book: once the lines are in you, the scene can start.');
  if (f.kind === 'blocking') return pick3('The blocking isn’t set in you: go back through the book, so the stage pictures land where they’re meant to.', 'The blocking isn’t set yet. Go back through the book until every stage picture lands where it’s meant to.', 'Go back through the blocking in the book, so the stage pictures settle where they’re meant to.');
  if (f.kind === 'direction') {
    const way = APPROACH_EFFECT[f.side].label.toLowerCase();
    const why = `${APPROACH_EFFECT[f.side].words.charAt(0).toLowerCase()}${APPROACH_EFFECT[f.side].words.slice(1)}`;
    return pick3(`I want it ${way}: ${why}`, `Play it ${way}, please: ${why}`, `Try it ${way}: ${why}`);
  }
  if (f.kind === 'craft') {
    const at = (f.where ?? 'the whole play').toLowerCase();
    const At = `${at.charAt(0).toUpperCase()}${at.slice(1)}`;
    switch (f.note) {
      case 'objective': return pick3(`I don’t know what you want in ${at}. Find it, and play it.`, `In ${at}, what you want isn’t clear yet. Name it in one verb, and play that.`, `In ${at}, find what you want and go after it: that’s where the scene opens up.`);
      case 'listening': return pick3(`You’re not taking what they give you in ${at}: listen, and let it change you.`, `In ${at}, you’re playing your plan, not what they give you. Take each line from the one before.`, `In ${at}, let what they give you land. It’s the best thing you have to play.`);
      case 'pacing': return f.problem === 'stamina'
        ? pick3(`You’re spent by ${at}: find where the play lets you breathe.`, `You run out by ${at}. Mark where the play lets you breathe, and use it.`, `By ${at} you’re tiring. Look for the places the play gives you to breathe.`)
        : pick3(`It sags in ${at}: hold it the whole way through.`, `${At} loses its tension. Hold it through to the end.`, `Keep ${at} alive all the way through: it dips, and it doesn’t need to.`);
      case 'behavior': return pick3(`The physical life in ${at} isn’t clean yet: what you do is telling the story too.`, `The physical life in ${at} isn’t clean yet. Make each action deliberate.`, `What you do in ${at} tells the story too: let it be as clear as the words.`);
      case 'transitions': return pick3(`The change into ${at} lurches: find what turns it.`, `The change into ${at} is abrupt. Find the moment that turns it, and play from there.`, `The way into ${at} comes too suddenly. Find what turns it, and let it turn.`);
      case 'relationship': return pick3(`Who are they to you in ${at}? Decide, and let it show.`, `In ${at}, I can’t tell who they are to you. Decide, and play it.`, `Think about who they are to you in ${at}, and let us see it.`);
    }
  }
  const skill = labelOf(f.skill).toLowerCase();
  return pick3(`Find more ${skill} in it: that’s where the part is thin.`, `The part is thin in ${skill}. Build it there.`, `There’s more ${skill} to find in this part.`);
}

/** The ways at a note, for its screen: what the workbook offers for its problem (from 2026-10-12). Lines, blocking and a direction have their own. */
export function solutionsOf(piece: WorkPiece | undefined, note: DirectorNote | undefined): ReturnType<typeof optionsOf> {
  if (!piece || !note || note.focus.kind !== 'craft') return [];
  const f = note.focus;
  const problem: Problem = { id: f.problem, kind: (f.problem.split(':')[0] === 'limit' ? 'limit' : f.problem === 'stamina' ? 'stamina' : f.problem === 'partner' ? 'partner' : f.problem.split(':')[0]) as Problem['kind'], ...(f.segment !== undefined ? { segment: f.segment } : {}), label: '', why: '', measure: f.measure };
  return optionsOf(piece, problem);
}

/**
 * What became of a craft note by the next call (from 2026-10-16, `NoteOutcome`): resolved where its problem has left the
 * part's forecast, whatever did it; better where a way was worked and kept and the note's own figure, then or now, stands
 * `WORKBOOK.evidence` or more over where it was; learned where a way was worked and nothing moved; unchanged otherwise.
 * Until then a way that changed nothing answered the note (its figure after at least where it was, less a twentieth of
 * a point): played on 2026-10-16, every one of 16 craft notes across four seeds was taken by a way that moved its figure
 * by 0.0, with the problem still in the forecast (docs/verification/notes-2026-10-16/README.md). Its figure now is kept.
 */
function addressed(piece: WorkPiece | undefined, note: DirectorNote & { focus: Extract<NoteFocus, { kind: 'craft' }> }): { outcome: NoteOutcome; now: number } {
  const f = note.focus;
  if (!piece) return { outcome: note.worked ? 'learned' : 'unchanged', now: f.measure };
  const still = stillThere(piece, f.problem);
  const e = piece.forecast();
  const now = f.segment !== undefined && !f.problem.startsWith('limit:') ? e.piece?.segments[f.segment]?.overall ?? e.overall : e.overall;
  if (!still) return { outcome: 'resolved', now };
  const kept = piece.peek()?.tries.filter((t) => t.problem === f.problem).at(-1)?.verdict !== 'revised';
  if (!note.worked || !note.answer) return { outcome: 'unchanged', now };
  const moved = Math.max(note.answer.after, now) - note.answer.before;
  return { outcome: kept && moved >= WORKBOOK.evidence ? 'better' : 'learned', now };
}

/** A craft note worked a way that was then put back: it can be worked another way. */
export function reworkable(p: Process): boolean {
  const last = p.notes.at(-1);
  return Boolean(last && last.focus.kind === 'craft' && last.worked && last.taken === undefined && p.book?.tries.filter((t) => last.focus.kind === 'craft' && t.problem === last.focus.problem).at(-1)?.verdict === 'revised');
}

/**
 * A rehearsal call answered: its stage done, the last note checked, and a new
 * note where it's a work-through. What it makes of the call's growth (1, or
 * more with a note taken).
 */
export function callAnswered(sim: Simulation, person: Person, holder: Holder, stage: Stage, n: number, of: number, reads: Partial<Craft>, which?: Which): number {
  const p = processOf(holder);
  p.calls += 1;
  p.of = of;
  p.understudy = stage === 'understudy';
  attend(p, stage);
  // A call kept is discipline kept, a quarter of a session's worth (from 2026-10-09).
  develop(sim, person, 'discipline', { weight: 0.25, focus: 1, deliberate: false, source: 'call' });
  // The director's request, from the first call (from 2026-10-10).
  p.direction ??= drawDirection(sim, person, holder);
  // Every call works the part on its feet, and with it the way it's being played.
  if (stage !== 'read') { rehearseChoice(p.playing, 0.3); rehearseWays(p.book, 0.3); }
  // The last note, taken or not at this call: a note on the director's request is taken when the playing has changed.
  let weight = 1;
  const last = p.notes.at(-1);
  // The part as the workbook reads it, for a note on the craft (from 2026-10-12); a part with no play profile has none.
  const piece = which ? workPiece(sim, person, `part:${which}`) : undefined;
  // A change tried and not put back by the next call is the one played at it: kept (from 2026-10-12).
  const waiting = p.book?.tries.find((t) => t.verdict === 'pending');
  if (waiting && p.book) { waiting.verdict = 'kept'; delete p.book.undo; }
  if (last && last.taken === undefined) {
    if (last.focus.kind === 'craft') {
      // A craft note is taken where the work answered it (`addressed`); its figure at the call is kept beside it.
      const a = addressed(piece, last as DirectorNote & { focus: Extract<NoteFocus, { kind: 'craft' }> });
      last.outcome = a.outcome;
      last.taken = a.outcome === 'resolved' || a.outcome === 'better';
      last.answer = { ...(last.answer ?? { before: last.focus.measure, after: last.focus.measure }), now: Math.round(a.now * 10) / 10 };
    } else last.taken = last.focus.kind === 'direction' ? !againstDirection(p) : Boolean(last.worked) || takenUnworked(p, last.focus.kind);
    if (last.taken) weight = PROCESS.noteTaken;
    else if (last.outcome === 'learned') weight = 1 + (PROCESS.noteTaken - 1) * PROCESS.noteLearned;
    // Answered direction, for life (`Journey.direction`, from 2026-10-12): the craft's notes and the director's requests.
    if (last.taken && (last.focus.kind === 'craft' || last.focus.kind === 'direction')) countDirection(person, { answered: true });
  }
  if (stage === 'work') {
    const against = againstDirection(p);
    const focus: NoteFocus = against ? { kind: 'direction', ...against } : noteFor(person, p, reads, n, of, piece);
    // The same note before: a craft note is the same where it's the same kind in the same place.
    const same = (x: NoteFocus) => (focus.kind === 'craft' && x.kind === 'craft' ? x.note === focus.note && x.segment === focus.segment : JSON.stringify(x) === JSON.stringify(focus));
    const before = [...p.notes].reverse().find((x) => same(x.focus));
    // A limit on the weakness the actor's work keeps coming back to is said as one (from 2026-10-12, `noteText`).
    const recurring = focus.kind === 'craft' && focus.problem.startsWith('limit:') ? identityOf(person).recurring : undefined;
    // The production's director, by its name (brief 17): the same voice at every call of the run.
    const production = (holder as { production?: string; title?: string }).production ?? (holder as { title?: string }).title ?? '';
    p.notes.push({ at: sim.now, text: noteText(focus, before, recurring, { key: `${which ?? stage}:${p.calls}:${p.notes.length}`, recent: p.notes.slice(-6).map((x) => x.text), voice: directorVoiceOf(`${which ?? stage}:${production}`) }), focus });
    if (focus.kind === 'craft' || focus.kind === 'direction') countDirection(person, { given: true });
    if (p.notes.length > 30) p.notes.splice(0, p.notes.length - 30);
  }
  return weight;
}

/** A call missed: the par still counts it, and a blocking call missed is a gap in the book to catch up. */
export function callMissed(holder: Holder, stage: Stage, of: number): void {
  const p = processOf(holder);
  p.of = of;
  p.understudy = stage === 'understudy';
  // An understudy's call sets blocking too (`attend`), so one missed is a gap in it as well (from 2026-10-12).
  if (stage === 'blocking' || stage === 'tech' || stage === 'techdress' || stage === 'understudy') p.blockingMissed += 1;
}

/** Where a part is: the School production, the Rep, this term's Cabaret show, or the Summer Cabaret's show now rehearsing or running. */
export type Which = 'school' | 'rep' | 'cabaret' | 'summer';
export const WHICH: readonly Which[] = ['school', 'rep', 'cabaret', 'summer'];
export const runPending = (sim: Simulation, person: Person, which: Which): boolean => pendingOf(sim, person, which).length > 0;
const pendingOf = (sim: Simulation, person: Person, which: Which) => sim.universe.scheduled.filter((i) => i.status === 'pending' && i.payload.personId === person.id && (
  which === 'cabaret' ? i.kind === CABARET_KIND : which === 'summer' ? i.kind === SUMMER_KIND : i.kind === CALL_KIND && (i.payload.which === 'rep') === (which === 'rep')));
/**
 * The Summer Cabaret show that's the summer's part: the one rehearsing, its read-through past and rehearsals to come,
 * else the earliest with a call to come, running or next. Until 2026-10-12 it was the show whose next call came soonest,
 * and from the third show's read-through to the second's closing, as the second's nights and the third's afternoons
 * took turns, the part on the School tab, Learn The Part and Work On The Note moved from one show to the other and back.
 */
const summerShow = (sim: Simulation, person: Person): number | undefined => {
  const calls = pendingOf(sim, person, 'summer').filter((i) => i.payload.run !== undefined);
  const shows = [...new Set(calls.map((i) => Number(i.payload.run)))].sort((a, b) => a - b);
  const rehearsals = (n: number) => calls.filter((i) => Number(i.payload.run) === n && i.payload.call === 'rehearsal');
  return shows.find((n) => rehearsals(n).length > 0 && !rehearsals(n).some((i) => Number(i.payload.n) === 1)) ?? shows[0];
};
export function holderFor(sim: Simulation, person: Person, which: Which): Holder | undefined {
  const school = person.school;
  if (which === 'rep') return school?.rep;
  if (which === 'school') return school?.casting;
  if (which === 'cabaret') return school?.cabaret;
  const n = summerShow(sim, person);
  return n === undefined || school?.summer?.out ? undefined : school?.summer?.shows?.[n];
}

/** Why the actor's own work on a part can't be done now, or nothing. */
export function ownWorkRefusal(sim: Simulation, person: Person, which: Which, what: 'part' | 'blocking' | 'note'): string | undefined {
  const casting = holderFor(sim, person, which);
  if (!casting) return 'You aren’t cast in anything there.';
  // A run over: nothing left to rehearse for. Until the first version was checked in the running app, a finished run's part could still be learned.
  if (!pendingOf(sim, person, which).length) return 'The run is over.';
  const p = processOf(casting);
  if (what === 'part' && p.lines >= 0.97) return 'You already know the part.';
  if (what === 'blocking' && p.blockingMissed === 0) return 'You haven’t missed any blocking.';
  if (what === 'note') {
    const last = p.notes.at(-1);
    if (!last || last.taken !== undefined) return 'There’s no note to work on.';
    // A note on the director's request is answered by the part played as asked (`callAnswered`), never by an hour on it
    // (from 2026-10-12: until then the hour was spent, the note marked worked, and it stayed unanswered).
    if (last.focus.kind === 'direction') return againstDirection(p) ? 'This note asks for the part played another way: change it under How You’ll Play It.' : 'You’ve changed how you play it: the next call will show it.';
    if (last.worked && !reworkable(p)) return 'You’ve worked on it: the next call will show it.';
    // A note on the craft is worked one of its ways, and the way's own checks and minutes refuse it (`wayRefusal`), as
    // the command asks them. Until 2026-10-12 a fixed hour was asked here and nothing else.
    if (last.focus.kind === 'craft') return undefined;
  }
  return startRefusal(sim, person, PROCESS.own.minutes);
}

/** Ordinary development from a step of the actor's own work (`ordinary` in `systems/school.ts`), injected as `grow` is. */
type Ordinary = (sim: Simulation, person: Person, target: Target, focus: number, weight: number, source: string) => number;

export function registerProduction(sim: Simulation, focusAt: (sim: Simulation, person: Person, at: number) => number, ordinary: Ordinary): void {
  const take = (s: Simulation, person: Person) => {
    s.advanceTo(s.now + PROCESS.own.minutes * 60_000);
    exerts(person, 1.5, PROCESS.own.minutes / 60);
  };
  sim.onCommand<{ which?: Which }, { lines: number }>('school.learn_part', (p, { sim: s }) => {
    const person = s.player;
    const which: Which = WHICH.includes(p?.which as Which) ? (p!.which as Which) : 'school';
    const no = ownWorkRefusal(s, person, which, 'part');
    if (no) throw new CommandError(no);
    const proc = processOf(holderFor(s, person, which)!);
    // At the hour it's learned (`focusAt`, from 2026-10-09), as every other step of the work is.
    const focus = focusAt(s, person, s.now);
    take(s, person);
    // A play of a kind known is learned faster (`genreSpeed`, from 2026-10-09).
    const holder = holderFor(s, person, which) as { play?: string };
    // And by memory (`stepSpeed`, from 2026-10-16), as every step learning lines is.
    proc.lines = clamp01(proc.lines + PROCESS.own.lines * Math.min(1.1, Math.max(0.5, focus)) * genreSpeed(person, genresOfPlay(holder.play)) * stepSpeed(s, person, 'memory') * (1 - proc.lines));
    // Memory, recorded on the development history from 2026-10-09 (it was grown unrecorded before, the same amount).
    if (proc.trained < PROCESS.own.trainsAtMost && person.craft) { ordinary(s, person, 'memory', focus, PROCESS.own.trainingWeight, 'learn-part'); proc.trained += 1; }
    return { lines: proc.lines };
  });
  sim.onCommand<{ which?: Which }, { blocking: number }>('school.review_blocking', (p, { sim: s }) => {
    const person = s.player;
    const which: Which = WHICH.includes(p?.which as Which) ? (p!.which as Which) : 'school';
    const no = ownWorkRefusal(s, person, which, 'blocking');
    if (no) throw new CommandError(no);
    const proc = processOf(holderFor(s, person, which)!);
    const focus = focusAt(s, person, s.now);
    take(s, person);
    // The moves learned from the book are memory too (from 2026-10-09).
    ordinary(s, person, 'memory', focus, PROCESS.own.trainingWeight, 'blocking');
    proc.blockingMissed -= 1;
    proc.blocking = clamp01(proc.blocking + PROCESS.own.blocking * (1 - proc.blocking));
    return { blocking: proc.blocking };
  });
  sim.onCommand<{ which?: Which; pace?: string; scale?: string; structure?: string }, { prep: number }>('school.choose_part_playing', (p, { sim: s }) => {
    const person = s.player;
    const which = (WHICH.includes(p?.which as Which) ? p!.which : 'school') as Which;
    const no = partPlayingRefusal(s, person, which);
    if (no) throw new CommandError(no);
    const pr = processOf(holderFor(s, person, which)!);
    const pick = <T extends string>(v: unknown, of: readonly T[]): T | undefined => ((of as readonly unknown[]).includes(v) ? (v as T) : undefined);
    const before = sidesOf(pr.playing);
    pr.playing = choose(pr.playing, { pace: pick(p?.pace, ['measured', 'driven'] as const), scale: pick(p?.scale, ['restrained', 'expansive'] as const), structure: pick(p?.structure, ['set', 'open'] as const) }, s.now);
    if (!sidesOf(pr.playing).length) delete pr.playing;
    // Only a side newly chosen counts toward the habits (from 2026-10-12): until then a side kept while another axis
    // changed was counted again with it, as `chooseBrief` says.
    noteMaterial(person, { approaches: sidesOf(pr.playing).filter((x) => !before.includes(x)) });
    return { prep: pr.playing?.prep ?? 0 };
  });

  sim.onCommand<{ which?: Which; solution?: string; option?: string }, { worked: true; before?: number; after?: number; pending?: boolean }>('school.work_note', (p, { sim: s }) => {
    const person = s.player;
    const which: Which = WHICH.includes(p?.which as Which) ? (p!.which as Which) : 'school';
    const no = ownWorkRefusal(s, person, which, 'note');
    if (no) throw new CommandError(no);
    const proc = processOf(holderFor(s, person, which)!);
    const note = proc.notes.at(-1)!;
    const focus = focusAt(s, person, s.now);
    // A craft note is worked one of its ways (from 2026-10-12): a way the workbook offers for its problem, tried on the
    // part, its time spent and its evidence kept on the note. A change of how a part is played waits there to be kept
    // or put back (`work.settle`).
    if (note.focus.kind === 'craft') {
      const piece = workPiece(s, person, `part:${which}`);
      const ways = solutionsOf(piece, note);
      const way = ways.find((o) => o.adjustment === p?.solution && (o.option ?? '') === String(p?.option ?? '')) ?? (p?.solution ? undefined : ways[0]);
      if (!piece || !way) throw new CommandError(ways.length ? 'That isn’t one of the ways at this note.' : 'There’s no way left at this note that hasn’t been tried and put back, or tried and found to change nothing.');
      const book = piece.book();
      if (book.tries.some((t) => t.verdict === 'pending')) throw new CommandError('Keep or put back the change you tried first.');
      // What refuses the way through Work It Through refuses it here (from 2026-10-12): until then a way was worked
      // from a hospital bed, asleep, spent, hurt, or with too little of the part learned.
      const refused = wayRefusal(s, person, piece, way.adjustment);
      if (refused) throw new CommandError(refused);
      const f = note.focus;
      book.problem = { id: f.problem, kind: (f.problem.startsWith('limit:') ? 'limit' : f.problem === 'stamina' ? 'stamina' : f.problem === 'partner' ? 'partner' : f.problem.split(':')[0]) as Problem['kind'], ...(f.segment !== undefined ? { segment: f.segment } : {}), label: noteWords(f), why: note.text, measure: f.measure, at: s.now };
      const t = tryAdjustment(s, person, piece, way.adjustment, way.option);
      note.worked = true;
      // The way's own label, a movement played to a side ("Play The Second Half Measured") rather than the kind of way
      // (from 2026-10-13: until then the notes so far and a note said again named only "play this part another way").
      note.answer = { solution: way.adjustment, label: way.label, before: t.before, after: t.after };
      countDirection(person, { worked: way.adjustment });
      ordinary(s, person, 'adaptability', focus, PROCESS.own.trainingWeight, 'work-note');
      return { worked: true, before: t.before, after: t.after, pending: t.verdict === 'pending' };
    }
    take(s, person);
    note.worked = true;
    // A director's note taken into the work is practice in taking direction (from 2026-10-09).
    ordinary(s, person, 'adaptability', focus, PROCESS.own.trainingWeight, 'work-note');
    // Working a lines or blocking note is the work itself.
    // As an hour on the part moves the lines (`school.learn_part`), by the hour's focus and the play's kind known (from
    // 2026-10-12; until then the same hour on the lines moved them by a different amount from this button).
    if (note.focus.kind === 'lines') proc.lines = clamp01(proc.lines + PROCESS.own.lines * Math.min(1.1, Math.max(0.5, focus)) * genreSpeed(person, genresOfPlay((holderFor(s, person, which) as { play?: string } | undefined)?.play)) * stepSpeed(s, person, 'memory') * (1 - proc.lines));
    // A blocking note given for a missed call asks the book gone back through, as Catch Up The Blocking does: worked, it
    // closes one gap (from 2026-10-12). Until then the gap stayed open, the next call counted the note taken, and the
    // next work-through gave the same note again as "Better since the last note".
    if (note.focus.kind === 'blocking') {
      if (proc.blockingMissed > 0) proc.blockingMissed -= 1;
      // By adaptability (`stepSpeed`, from 2026-10-16): a note taken into the staging is a change made without losing the
      // rest. Until then adaptability's description said a note worked went further with it, and only coursework's
      // revision read it.
      proc.blocking = clamp01(proc.blocking + PROCESS.own.blocking * stepSpeed(s, person, 'adaptability') * (1 - proc.blocking));
    }
    return { worked: true };
  });
}

/**
 * Looking back once a part has closed (from 2026-10-08), once: how many of
 * its calls were answered, the director's notes given and taken, the dress,
 * and the night's readiness it played at. The notes not taken are carried into
 * the coursework's ledger (`recordNote`, `systems/learning.ts`): lines as
 * lines, blocking as time on its feet, a skill as that skill, so the next work
 * can ask for them and a showing says if they come back. Until 2026-10-08 a
 * production's notes ended with it.
 */
export function reflect(sim: Simulation, person: Person, holder: Holder, title: string): string | undefined {
  if (!hasProcess(holder) || holder.process.reflection) return undefined;
  const p = holder.process;
  const given = p.notes.filter((n) => n.taken !== undefined);
  const taken = given.filter((n) => n.taken).length;
  const open = p.notes.filter((n) => n.taken === false || (n.taken === undefined && !n.worked));
  // How the nights went with the company (`together`, from 2026-10-12). Until then this said "you played at N% of what
  // every call kept makes", the readiness factor that from 2026-10-09 reached only a night's growth, not the night.
  // In sentences from 2026-10-17 (brief 14's editorial review): until then “11 calls answered of 11; 0 of 0 notes taken;
  // the dress solid. With the company the nights came to 56 on average, 1 with a slip in the company, 1 of them covered.”
  const slips = p.together?.slips ?? 0, covered = p.together?.covered ?? 0;
  const company = p.together?.n ? ` With the company, your nights averaged ${Math.round(p.together.sum / p.together.n)} out of 100${slips ? `, with ${slips === 1 ? 'a slip' : `${slips} slips`} by others${covered ? `, ${covered === slips ? (slips === 1 ? 'which you covered' : 'all of which you covered') : `${covered} of which you covered`}` : ''}` : ''}.` : '';
  // Worked and learned from, without moving it (from 2026-10-16): said apart from the notes taken.
  const learned = p.notes.filter((n) => n.outcome === 'learned').length;
  const of = p.of ?? p.calls;
  const calls = of === 0 ? 'there were no calls' : of === 1 ? (p.calls ? 'you answered your one call' : 'you missed your one call') : p.calls === of ? `you answered all ${of} calls` : `you answered ${p.calls || 'none'} of your ${of} calls`;
  // A count in words, and the notes taken without “answered in the work” (from 2026-10-19, brief 15): every note taken
  // was answered by the part's work, so the clause said nothing a player could use.
  const nWords = (n: number) => ['none', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'][n] ?? String(n);
  const notes = !given.length ? 'The director gave you no notes.'
    : given.length === 1 ? `The director gave you one note${taken ? ', and you took it.' : learned ? '. You worked on it, but it didn’t move.' : ', and you didn’t take it.'}`
      : `The director gave you ${nWords(given.length)} notes, and you took ${taken === given.length ? 'all of them' : nWords(taken)}${learned ? `. You worked on ${nWords(learned)} more, but ${learned === 1 ? 'it didn’t' : 'they didn’t'} move` : ''}.`;
  const dress = p.dress ? ` The dress rehearsal was ${p.dress === 'off' ? 'an off night' : p.dress}.` : '';
  const text = `${title}: ${calls}. ${notes}${dress}${company}${open.length ? ' What’s still open goes with you into class.' : ''}`;
  p.reflection = { on: sim.now, text };
  const cw = courseworkOf(sim, person);
  if (cw) {
    const pz = zonedParts(sim.now, CITIES.require(YALE_DRAMA.cityId).timeZone);
    const on = `${pz.year}-${String(pz.month).padStart(2, '0')}-${String(pz.day).padStart(2, '0')}`;
    const seen = new Set<string>();
    for (const n of open) {
      // A note on the director's request isn't a weakness for the ledger: it's a choice, said on the part's process.
      if (n.focus.kind === 'direction') continue;
      // A craft note goes in as the part of a scene's preparation that answers it: the objective as the breakdown, listening
      // and the relationship as the partner's part, the rest as time on its feet (from 2026-10-12).
      const f: LedgerFocus = n.focus.kind === 'lines' ? { kind: 'dim', dim: 'memorization' } : n.focus.kind === 'blocking' ? { kind: 'dim', dim: 'rehearsal' }
        : n.focus.kind === 'craft' ? { kind: 'dim', dim: n.focus.note === 'objective' ? 'interpretation' : n.focus.note === 'listening' || n.focus.note === 'relationship' ? 'partner' : 'rehearsal' }
          : { kind: 'skill', skill: n.focus.skill };
      const key = JSON.stringify(f);
      if (seen.has(key)) continue;
      seen.add(key);
      recordNote(notesOf(cw), f, on, `production:${title}`, title, f.kind === 'dim' ? (f.dim === 'memorization' ? p.lines : p.blocking) : undefined);
    }
  }
  if (person.id === sim.universe.playerId) sim.notify({ category: 'school', title: `Looking Back: ${title}`, body: `${text} (A summary of your run, not the director’s own words.)`, importance: 50, route: '/workspace/school' });
  return text;
}
