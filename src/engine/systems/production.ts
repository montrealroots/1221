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
 * - **How the part is played** (from 2026-10-10): the actor's choice of pace, scale and structure
 *   (`systems/material.ts`), rehearsed in at every call after it's made; and the director's own request on an axis,
 *   drawn once for the production and shown from the first call, which the material's own constraints bound. A choice
 *   against the request is given as a note at a work-through, and taken at the next call if the choice has changed.
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
import { zonedParts, type Instant } from '../core/time';
import { SKILLS, YALE_DRAMA, type Skill } from '../content/school';
import { CITIES } from '../content/geography';
import { startRefusal } from './life';
import { exerts } from './body';
import { CABARET_KIND, CALL_KIND, SUMMER_KIND, type Craft } from './school';
import { courseworkOf, notesOf } from './coursework';
import { recordNote, type NoteFocus as LedgerFocus } from './learning';
import { develop, type Target } from './attributes';
import { genreSpeed } from './engagement';
import { genresOfPlay } from '../content/plays';
import { AXES, APPROACH_EFFECT } from '../content/approaches';
import type { Axis, AxisValue } from '../content/material';
import { choose, materialOf, misfitOf, rehearseChoice, sidesOf, type Playing } from './material';
import { noteMaterial } from './experience';

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

export type NoteFocus = { kind: 'lines' } | { kind: 'blocking' } | { kind: 'skill'; skill: Skill } | { kind: 'direction'; axis: Axis; side: AxisValue };
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
  /** A format whose calls run otherwise than a full production's (`Format`). */
  format?: Format;
  /** Looking back once it closed (`reflect`), from 2026-10-08. */
  reflection?: { on: Instant; text: string };
  /** How the actor plays the part, and the director's request on an axis (none asked: `{}`), from 2026-10-10. */
  playing?: Playing;
  direction?: Partial<Record<Axis, AxisValue>>;
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

/** The notes taken, as a share of the notes given; none given, none to take. */
const notesShare = (p: { notes: { taken?: boolean }[] }) => (p.notes.length ? p.notes.filter((n) => n.taken).length / p.notes.length : 0);
const scoreOf = (p: { lines: number; blocking: number; notes: { taken?: boolean }[] }) => PROCESS.factor.lines * p.lines + PROCESS.factor.blocking * p.blocking + PROCESS.factor.notes * notesShare(p);

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
 * What makes a night's preparation complete (`prepOf`, `content/tasks.ts` `performance`), from 2026-10-09: what
 * every call attended makes of the lines, the blocking and the notes, as the par did for the night's factor before.
 * An actor who came to every call is fully prepared; a call missed leaves a gap, and the actor's own work (an hour on
 * the part, the book, a note) is how it's made up.
 */
export function completeFor(holder: Holder | undefined): { lines: number; blocking: number; notes: number } | undefined {
  if (!hasProcess(holder)) return undefined;
  const p = holder.process;
  const par = parProcess(p.of ?? 0, p.understudy, p.format);
  return { lines: par.lines, blocking: par.blocking, notes: par.notes.length ? notesShare(par) : 1 };
}

/**
 * The process as a night's preparation (`content/tasks.ts` `performance`): the lines, the blocking, less a missed
 * blocking call not caught up, and the share of notes taken. None for a casting from before the process, whose
 * preparation the evaluation doesn't read.
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

/** The note a director gives at a work-through: a gap in the blocking, the lines past off-book, the blocking short, else the play's craft weakest in the actor. */
export function noteFor(person: Person, p: Process, reads: Partial<Craft>, n: number, of: number): NoteFocus {
  const kind = noteKind(p, n, of);
  if (kind !== 'skill') return { kind } as NoteFocus;
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
 */
export function noteText(f: NoteFocus, before?: DirectorNote): string {
  const words = noteWords(f);
  if (!before) return words;
  return before.taken ? `Better since the last note. ${words}` : `Still: ${words.charAt(0).toLowerCase()}${words.slice(1)}`;
}

function noteWords(f: NoteFocus): string {
  if (f.kind === 'lines') return 'Be off book: the lines aren’t there yet, and the scene can’t start until they are.';
  if (f.kind === 'blocking') return 'The blocking isn’t set in you: go back through the book, so the stage pictures land where they’re meant to.';
  if (f.kind === 'direction') return `I want it ${APPROACH_EFFECT[f.side].label.toLowerCase()}: ${APPROACH_EFFECT[f.side].words.charAt(0).toLowerCase()}${APPROACH_EFFECT[f.side].words.slice(1)}`;
  return `Find more ${labelOf(f.skill).toLowerCase()} in it: that’s where the part is thin.`;
}

/**
 * A rehearsal call answered: its stage done, the last note checked, and a new
 * note where it's a work-through. What it makes of the call's growth (1, or
 * more with a note taken).
 */
export function callAnswered(sim: Simulation, person: Person, holder: Holder, stage: Stage, n: number, of: number, reads: Partial<Craft>): number {
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
  if (stage !== 'read') rehearseChoice(p.playing, 0.3);
  // The last note, taken or not at this call: a note on the director's request is taken when the playing has changed.
  let weight = 1;
  const last = p.notes.at(-1);
  if (last && last.taken === undefined) {
    last.taken = last.focus.kind === 'direction' ? !againstDirection(p) : Boolean(last.worked) || takenUnworked(p, last.focus.kind);
    if (last.taken) weight = PROCESS.noteTaken;
  }
  if (stage === 'work') {
    const against = againstDirection(p);
    const focus: NoteFocus = against ? { kind: 'direction', ...against } : noteFor(person, p, reads, n, of);
    const before = [...p.notes].reverse().find((x) => JSON.stringify(x.focus) === JSON.stringify(focus));
    p.notes.push({ at: sim.now, text: noteText(focus, before), focus });
    if (p.notes.length > 30) p.notes.splice(0, p.notes.length - 30);
  }
  return weight;
}

/** A call missed: the par still counts it, and a blocking call missed is a gap in the book to catch up. */
export function callMissed(holder: Holder, stage: Stage, of: number): void {
  const p = processOf(holder);
  p.of = of;
  p.understudy = stage === 'understudy';
  if (stage === 'blocking' || stage === 'tech' || stage === 'techdress') p.blockingMissed += 1;
}

/** Where a part is: the School production, the Rep, this term's Cabaret show, or the Summer Cabaret's show now rehearsing or running. */
export type Which = 'school' | 'rep' | 'cabaret' | 'summer';
export const WHICH: readonly Which[] = ['school', 'rep', 'cabaret', 'summer'];
const pendingOf = (sim: Simulation, person: Person, which: Which) => sim.universe.scheduled.filter((i) => i.status === 'pending' && i.payload.personId === person.id && (
  which === 'cabaret' ? i.kind === CABARET_KIND : which === 'summer' ? i.kind === SUMMER_KIND : i.kind === CALL_KIND && (i.payload.which === 'rep') === (which === 'rep')));
/** The Summer Cabaret show whose calls come next. */
const summerShow = (sim: Simulation, person: Person): number | undefined => {
  const next = pendingOf(sim, person, 'summer').filter((i) => i.payload.run !== undefined).sort((a, b) => a.at - b.at)[0];
  return next ? Number(next.payload.run) : undefined;
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
  if (what === 'part' && p.lines >= 0.97) return 'You know the part.';
  if (what === 'blocking' && p.blockingMissed === 0) return 'You haven’t missed any blocking.';
  if (what === 'note') {
    const last = p.notes.at(-1);
    if (!last || last.taken !== undefined) return 'There’s no note to work on.';
    if (last.worked) return 'You’ve worked on it: the next call will show it.';
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
    proc.lines = clamp01(proc.lines + PROCESS.own.lines * Math.min(1.1, Math.max(0.5, focus)) * genreSpeed(person, genresOfPlay(holder.play)) * (1 - proc.lines));
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
    pr.playing = choose(pr.playing, { pace: pick(p?.pace, ['measured', 'driven'] as const), scale: pick(p?.scale, ['restrained', 'expansive'] as const), structure: pick(p?.structure, ['set', 'open'] as const) }, s.now);
    if (!sidesOf(pr.playing).length) delete pr.playing;
    noteMaterial(person, { approaches: sidesOf(pr.playing) });
    return { prep: pr.playing?.prep ?? 0 };
  });

  sim.onCommand<{ which?: Which }, { worked: true }>('school.work_note', (p, { sim: s }) => {
    const person = s.player;
    const which: Which = WHICH.includes(p?.which as Which) ? (p!.which as Which) : 'school';
    const no = ownWorkRefusal(s, person, which, 'note');
    if (no) throw new CommandError(no);
    const proc = processOf(holderFor(s, person, which)!);
    const note = proc.notes.at(-1)!;
    const focus = focusAt(s, person, s.now);
    take(s, person);
    note.worked = true;
    // A director's note taken into the work is practice in taking direction (from 2026-10-09).
    ordinary(s, person, 'adaptability', focus, PROCESS.own.trainingWeight, 'work-note');
    // Working a lines or blocking note is the work itself.
    if (note.focus.kind === 'lines') proc.lines = clamp01(proc.lines + PROCESS.own.lines * (1 - proc.lines));
    if (note.focus.kind === 'blocking') proc.blocking = clamp01(proc.blocking + PROCESS.own.blocking * (1 - proc.blocking));
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
  const factor = Math.round(nightFactor(holder) * 100);
  const text = `${title}: ${p.calls} ${p.calls === 1 ? 'call' : 'calls'} answered of ${p.of ?? p.calls}; ${taken} of ${given.length} ${given.length === 1 ? 'note' : 'notes'} taken${p.dress ? `; the dress ${p.dress}` : ''}; you played at ${factor}% of what every call kept makes.${open.length ? ' What’s still open goes with you into class.' : ''}`;
  p.reflection = { on: sim.now, text };
  const cw = courseworkOf(sim, person);
  if (cw) {
    const pz = zonedParts(sim.now, CITIES.require(YALE_DRAMA.cityId).timeZone);
    const on = `${pz.year}-${String(pz.month).padStart(2, '0')}-${String(pz.day).padStart(2, '0')}`;
    const seen = new Set<string>();
    for (const n of open) {
      // A note on the director's request isn't a weakness for the ledger: it's a choice, said on the part's process.
      if (n.focus.kind === 'direction') continue;
      const f: LedgerFocus = n.focus.kind === 'lines' ? { kind: 'dim', dim: 'memorization' } : n.focus.kind === 'blocking' ? { kind: 'dim', dim: 'rehearsal' } : { kind: 'skill', skill: n.focus.skill };
      const key = JSON.stringify(f);
      if (seen.has(key)) continue;
      seen.add(key);
      recordNote(notesOf(cw), f, on, `production:${title}`, title, f.kind === 'dim' ? (f.dim === 'memorization' ? p.lines : p.blocking) : undefined);
    }
  }
  if (person.id === sim.universe.playerId) sim.notify({ category: 'school', title: `Looking Back: ${title}`, body: `${text} (Simulated: the game’s reading of the process.)`, importance: 50, route: '/workspace/school' });
  return text;
}
