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
 *   growth is the better for it; not worked on, it's still there.
 * - **The dress**, played through as a night with no house, its reading kept.
 *
 * A night reads all of it: lines, blocking and the notes taken make a
 * readiness factor around 1, 0.85 to 1.15, measured against what an actor who
 * came to every one of this casting's calls and did no more would have
 * (`parFor`), who plays at 1, as nights read before this. In the first
 * version that par was one number, 0.7, and such an actor in the Carlotta's
 * twelve calls played at 0.988, a little worse for doing everything asked.
 * Every number here is SLATE's estimate: no school publishes a rehearsal's
 * arithmetic.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { formatTime, type Instant } from '../core/time';
import { SKILLS, type Skill } from '../content/school';
import { occupiedAt } from './life';
import { exerts } from './body';
import { CALL_KIND, type Casting, type Craft } from './school';

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
} as const;

export type Stage = 'read' | 'blocking' | 'work' | 'tech' | 'dress' | 'understudy';
export const STAGE_LABEL: Record<Stage, string> = { read: 'Read-Through', blocking: 'Blocking Rehearsal', work: 'Rehearsal', tech: 'Technical Rehearsal', dress: 'Dress Rehearsal', understudy: 'Understudy Rehearsal' };

export type NoteFocus = { kind: 'lines' } | { kind: 'blocking' } | { kind: 'skill'; skill: Skill };
export interface DirectorNote { at: Instant; text: string; focus: NoteFocus; worked?: boolean; taken?: boolean }

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
}

export const processOf = (casting: Casting): Process => ((casting as Casting & { process?: Process }).process ??= { lines: 0, blocking: 0, calls: 0, blockingMissed: 0, notes: [], trained: 0 });
export const hasProcess = (casting: Casting | undefined): casting is Casting & { process: Process } => Boolean(casting && (casting as Casting & { process?: Process }).process);

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

/** The notes taken, as a share of the notes given; none given, none to take. */
const notesShare = (p: { notes: { taken?: boolean }[] }) => (p.notes.length ? p.notes.filter((n) => n.taken).length / p.notes.length : 0);
const scoreOf = (p: { lines: number; blocking: number; notes: { taken?: boolean }[] }) => PROCESS.factor.lines * p.lines + PROCESS.factor.blocking * p.blocking + PROCESS.factor.notes * notesShare(p);

type Kept = Pick<Process, 'lines' | 'blocking' | 'blockingMissed'>;
/** What a note is on: a blocking call missed and not caught up, the lines past off-book, the blocking short, else the play's craft. */
const noteKind = (p: Kept, n: number, of: number): NoteFocus['kind'] =>
  p.blockingMissed > 0 ? 'blocking' : n / Math.max(1, of) >= PROCESS.blockingShare && p.lines < PROCESS.offBook ? 'lines' : p.blocking < 0.7 ? 'blocking' : 'skill';
/** Whether a note not worked on is taken anyway: a lines or blocking note is, once the calls have done it. */
const takenUnworked = (p: Kept, kind: NoteFocus['kind']) =>
  (kind === 'lines' && p.lines >= PROCESS.offBook) || (kind === 'blocking' && p.blocking >= 0.7 && p.blockingMissed === 0);
/** One call's lines and blocking, attended. */
const attend = (p: Kept, stage: Stage) => {
  p.lines = clamp01(p.lines + PROCESS.call.lines * (1 - p.lines));
  if (stage === 'blocking' || stage === 'tech' || stage === 'understudy') p.blocking = clamp01(p.blocking + PROCESS.call.blocking * (1 - p.blocking));
};

/** The score of an actor who came to all of a run of calls and did nothing more: the par a night is measured against. */
export function parFor(of: number, understudy = false): number {
  const p = { lines: 0, blocking: 0, blockingMissed: 0, notes: [] as { kind: NoteFocus['kind']; taken?: boolean }[] };
  const stages = understudy ? Array.from({ length: of }, (): Stage => 'understudy') : stagesOf(of);
  stages.forEach((stage, i) => {
    attend(p, stage);
    const last = p.notes.at(-1);
    if (last && last.taken === undefined) last.taken = takenUnworked(p, last.kind);
    if (stage === 'work') p.notes.push({ kind: noteKind(p, i + 1, of) });
  });
  return scoreOf(p);
}

/** A night's readiness factor from the process: 1 for an actor who came to every call and did no more; 1 for a casting from before the process. */
export function nightFactor(casting: Casting | undefined): number {
  if (!hasProcess(casting)) return 1;
  const p = casting.process;
  const f = PROCESS.factor;
  return Math.max(f.least, Math.min(f.most, 1 + f.slope * (scoreOf(p) - parFor(p.of ?? 0, p.understudy))));
}

/** The note a director gives at a work-through: a gap in the blocking, the lines past off-book, the blocking short, else the play's craft weakest in the actor. */
export function noteFor(person: Person, p: Process, reads: Partial<Craft>, n: number, of: number): NoteFocus {
  const kind = noteKind(p, n, of);
  if (kind !== 'skill') return { kind };
  const weakest = (Object.keys(reads) as Skill[]).sort((a, b) => person.craft![a] - person.craft![b])[0] ?? 'scene';
  return { kind: 'skill', skill: weakest };
}

export function noteText(f: NoteFocus): string {
  if (f.kind === 'lines') return 'Be off book: the lines aren’t there yet, and the scene can’t start until they are.';
  if (f.kind === 'blocking') return 'The blocking isn’t set in you: go back through the book, so the stage pictures land where they’re meant to.';
  return `Find more ${labelOf(f.skill).toLowerCase()} in it: that’s where the part is thin.`;
}

/**
 * A rehearsal call answered: its stage done, the last note checked, and a new
 * note where it's a work-through. What it makes of the call's growth (1, or
 * more with a note taken).
 */
export function callAnswered(sim: Simulation, person: Person, casting: Casting, stage: Stage, n: number, of: number, reads: Partial<Craft>): number {
  const p = processOf(casting);
  p.calls += 1;
  p.of = of;
  p.understudy = stage === 'understudy';
  attend(p, stage);
  // The last note, taken or not at this call.
  let weight = 1;
  const last = p.notes.at(-1);
  if (last && last.taken === undefined) {
    last.taken = Boolean(last.worked) || takenUnworked(p, last.focus.kind);
    if (last.taken) weight = PROCESS.noteTaken;
  }
  if (stage === 'work') {
    const focus = noteFor(person, p, reads, n, of);
    p.notes.push({ at: sim.now, text: noteText(focus), focus });
    if (p.notes.length > 30) p.notes.splice(0, p.notes.length - 30);
  }
  return weight;
}

/** A call missed: the par still counts it, and a blocking call missed is a gap in the book to catch up. */
export function callMissed(casting: Casting, stage: Stage, of: number): void {
  const p = processOf(casting);
  p.of = of;
  p.understudy = stage === 'understudy';
  if (stage === 'blocking' || stage === 'tech') p.blockingMissed += 1;
}

export type Which = 'school' | 'rep';
const castingFor = (person: Person, which: Which): Casting | undefined => (which === 'rep' ? person.school?.rep : person.school?.casting);

/** Why the actor's own work on a part can't be done now, or nothing. */
export function ownWorkRefusal(sim: Simulation, person: Person, which: Which, what: 'part' | 'blocking' | 'note'): string | undefined {
  const casting = castingFor(person, which);
  if (!casting) return 'You aren’t cast in anything there.';
  // A run over: nothing left to rehearse for. Until the first version was checked in the running app, a finished run's part could still be learned.
  if (!sim.universe.scheduled.some((i) => i.kind === CALL_KIND && i.status === 'pending' && i.payload.personId === person.id && (i.payload.which === 'rep') === (which === 'rep'))) return 'The run is over.';
  const p = processOf(casting);
  if (what === 'part' && p.lines >= 0.97) return 'You know the part.';
  if (what === 'blocking' && p.blockingMissed === 0) return 'You haven’t missed any blocking.';
  if (what === 'note') {
    const last = p.notes.at(-1);
    if (!last || last.taken !== undefined) return 'There’s no note to work on.';
    if (last.worked) return 'You’ve worked on it: the next call will show it.';
  }
  const busy = occupiedAt(sim, sim.now);
  if (busy) return `You’re at ${busy.label} until ${formatTime(busy.at + busy.durationMinutes! * 60_000, sim.zone)}.`;
  return undefined;
}

export function registerProduction(sim: Simulation, grow: (craft: Craft, skill: Skill, focus: number, weight: number) => void, focusOf: (person: Person) => number): void {
  const take = (s: Simulation, person: Person) => {
    s.advanceTo(s.now + PROCESS.own.minutes * 60_000);
    exerts(person, 1.5, PROCESS.own.minutes / 60);
  };
  sim.onCommand<{ which?: Which }, { lines: number }>('school.learn_part', (p, { sim: s }) => {
    const person = s.player;
    const which: Which = p?.which === 'rep' ? 'rep' : 'school';
    const no = ownWorkRefusal(s, person, which, 'part');
    if (no) throw new CommandError(no);
    const proc = processOf(castingFor(person, which)!);
    const focus = focusOf(person);
    take(s, person);
    proc.lines = clamp01(proc.lines + PROCESS.own.lines * Math.min(1.1, Math.max(0.5, focus)) * (1 - proc.lines));
    if (proc.trained < PROCESS.own.trainsAtMost && person.craft) { grow(person.craft, 'memorization', focus, PROCESS.own.trainingWeight); proc.trained += 1; }
    return { lines: proc.lines };
  });
  sim.onCommand<{ which?: Which }, { blocking: number }>('school.review_blocking', (p, { sim: s }) => {
    const person = s.player;
    const which: Which = p?.which === 'rep' ? 'rep' : 'school';
    const no = ownWorkRefusal(s, person, which, 'blocking');
    if (no) throw new CommandError(no);
    const proc = processOf(castingFor(person, which)!);
    take(s, person);
    proc.blockingMissed -= 1;
    proc.blocking = clamp01(proc.blocking + PROCESS.own.blocking * (1 - proc.blocking));
    return { blocking: proc.blocking };
  });
  sim.onCommand<{ which?: Which }, { worked: true }>('school.work_note', (p, { sim: s }) => {
    const person = s.player;
    const which: Which = p?.which === 'rep' ? 'rep' : 'school';
    const no = ownWorkRefusal(s, person, which, 'note');
    if (no) throw new CommandError(no);
    const proc = processOf(castingFor(person, which)!);
    const note = proc.notes.at(-1)!;
    take(s, person);
    note.worked = true;
    // Working a lines or blocking note is the work itself.
    if (note.focus.kind === 'lines') proc.lines = clamp01(proc.lines + PROCESS.own.lines * (1 - proc.lines));
    if (note.focus.kind === 'blocking') proc.blocking = clamp01(proc.blocking + PROCESS.own.blocking * (1 - proc.blocking));
    return { worked: true };
  });
}
