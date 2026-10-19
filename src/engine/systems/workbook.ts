/**
 * SLATE — working a problem through (from 2026-10-12; `content/workbook.ts` says what and why).
 *
 * One process for every piece of work in progress: a practice brief (`brief:<id>`), a scene for class
 * (`assignment:<id>`) and a part in a production (`part:<which>`). Each kind gives the process its piece (`WorkPiece`):
 * how it's forecast, where its segments' work and its workbook are kept, which part of preparation naming the
 * objectives moves, who its partner is, and what refuses an hour of work on it. The process is then the same:
 *
 * 1. **Identify** (`work.identify`): one of the problems the forecast shows (`problemsOf`), kept as the one being worked.
 * 2. **Choose and rehearse** (`work.try`): an adjustment the problem admits (`optionsOf`), with its time spent.
 * 3. **Observe**: the problem's own figure in the forecast before and after, kept on the try.
 * 4. **Keep or revise** (`work.settle`): a change of how it's played is kept, a discovery every later forecast and
 *    performance reads, or put back, and not offered for that problem again. Work done is done, and kept.
 * 5. **Perform**: the take, the showing or the night reads the piece with everything kept (`withBook`).
 *
 * A problem solved leaves the forecast's problems by itself. Nothing here draws: the forecast is the expected result,
 * so the same work tried the same way shows the same evidence, and there are no setbacks by chance.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import { titleCaseLabel } from '../core/text';
import type { Person } from '../domain/model';
import { ADJUSTMENTS, WORKBOOK, type AdjustmentId, type ProblemKind } from '../content/workbook';
import { AXES, APPROACH_EFFECT } from '../content/approaches';
import { DIMENSION_LABEL } from '../content/tasks';
import type { Axis, AxisValue, MaterialProfile } from '../content/material';
import { alreadyApplied, markApplied, type Target } from './attributes';
import { exerts } from './body';
import { SPENT, startRefusal } from './life';
import { trainingRefusal } from './injury';
import { inHospital } from './health';
import { misfitOf, type Playing } from './material';
import type { Evaluation } from './evaluation';
import type { PieceSpec, Problem, SegmentWay, Try, Workbook } from './piece';
import { focusAt, ordinary } from './school';

export type { Problem, Try, Workbook } from './piece';

/** A piece of work in progress, as the process meets it. */
export interface WorkPiece {
  key: string;
  title: string;
  /** Its workbook, made where it has none. */
  book: () => Workbook;
  /** Its workbook if it has one, made nowhere: what a screen reads. */
  peek: () => Workbook | undefined;
  /** The material, where the game has its profile; a new play has none. */
  material?: MaterialProfile;
  /** A request how to play it: a callback's note, a director's. */
  direction?: Partial<Record<Axis, AxisValue>>;
  /** How the whole is played: a segment's own way is only on an axis this leaves open. */
  playing?: Playing;
  spec: () => PieceSpec;
  /** The expected result now, with no draw. */
  forecast: () => Evaluation;
  /** The work together, where a partner shares it: its figure now. */
  together?: (e: Evaluation) => number | undefined;
  work: () => number[];
  setWork: (w: number[]) => void;
  /** The part naming the objectives moves, where the piece has one the forecast reads. */
  objective?: { part: string; label: string; get: () => number; set: (v: number) => void };
  /**
   * The partner's preparation, as the work together reads it, and `set` where running it together moves it (a brief's
   * reader). A scene for class has no `set` (from 2026-10-12): its partner's side moves with the rehearsals agreed
   * with them. Until then Run It With Your Partner was offered on a scene, took its minutes and moved nothing.
   */
  partner?: { name: string; get: () => number; set?: (v: number) => void };
  /** Why an hour of work on it can't be done now, beyond what every piece shares. */
  refusal: (minutes: number) => string | undefined;
  /** Parts of preparation that aren't problems to work: a part's notes taken are the director's notes themselves. */
  ignore?: readonly string[];
}

export interface Option { adjustment: AdjustmentId; option?: string; label: string; words: string; minutes: number; segment?: number }

const r1 = (x: number) => Math.round(x * 10) / 10;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const pct = (x: number) => `${Math.round(x * 100)}%`;

/** The ability or technique that holds a segment back most, of the limits a problem is worked on, if one does. */
function abilityHolding(p: WorkPiece, seg: { top?: { kind: string; what: string }[]; chief?: { kind: string; what: string } }): string | undefined {
  const ignored = (l: { kind: string; what: string }) => l.kind === 'preparation' && (p.ignore ?? []).includes(l.what);
  const c = (seg.top ?? (seg.chief ? [seg.chief] : [])).find((l) => !ignored(l));
  return c && (c.kind === 'ability' || c.kind === 'technique') ? c.what : undefined;
}

/** The problems a piece's forecast shows, worst first, at most `WORKBOOK.offered`, the one being worked among them while it's still one. */
export function problemsOf(p: WorkPiece): Problem[] {
  const e = p.forecast();
  const spec = p.spec();
  const segs = e.piece?.segments ?? [];
  const out: (Problem & { gap: number })[] = [];
  const ignored = (l: { kind: string; what: string }) => l.kind === 'preparation' && (p.ignore ?? []).includes(l.what);
  // A segment's costliest limit that's a problem to work.
  const chiefOf = (s: (typeof segs)[number]) => (s.top ?? (s.chief ? [s.chief] : [])).find((l) => !ignored(l));
  segs.forEach((s, i) => {
    const turn = spec.segments[i]?.turnInto;
    if (s.part < s.required - 0.005) {
      out.push({ id: `${turn ? 'turn' : 'segment'}:${i}`, kind: turn ? 'turn' : 'segment', segment: i, label: turn ? `The Turn Into ${s.label}` : `${s.label} Isn’t Secure`, why: `${turn ? `The change into ${s.label.toLowerCase()} needs more rehearsal than the rest` : `${s.label} hasn’t been rehearsed enough`}: it’s at ${pct(s.part)} of the ${pct(s.required)} it needs. It comes to ${s.overall}, against ${e.overall} for the whole piece.`, measure: s.overall, gap: (s.required - s.part) * 100 });
    } else if (segs.length > 1 && s.overall < e.overall - WORKBOOK.segmentGap) {
      const c = chiefOf(s);
      // A segment held back most by tiring is the stamina problem below, said once (from 2026-10-16). At a whole evening’s
      // load (`PIECE.load.night`, raised that day) a new play’s second half, played at half stamina, fell under the whole
      // by more than `segmentGap`, and the same drain came as two problems, the segment’s first, whose ways don’t include
      // breathing (tests/guide-examples-productions.test.ts, the director’s note on tiring).
      if (c?.kind === 'condition' && c.what === 'stamina') return;
      out.push({ id: `segment:${i}`, kind: 'segment', segment: i, label: `${s.label} Holds It Back`, why: `${s.label} comes to ${s.overall}, against ${e.overall} for the whole piece.${c ? ` What costs it most: ${c.label.toLowerCase()}, in its ${DIMENSION_LABEL[c.dimension].toLowerCase()}.` : ''}`, measure: s.overall, gap: e.overall - s.overall });
    }
  });
  const stamina = e.limits.find((l) => l.what === 'stamina');
  if (stamina && (stamina.whole ?? 0) >= 0.5 && segs.length) {
    const last = segs.length - 1;
    out.push({ id: 'stamina', kind: 'stamina', segment: last, label: 'Tiring Late In The Piece', why: `Your stamina costs the piece ${stamina.whole} points, most of it in ${segs[last]!.label.toLowerCase()}, which comes to ${segs[last]!.overall}.`, measure: segs[last]!.overall, gap: (stamina.whole ?? 0) * 2 });
  }
  const top = e.limits.find((l) => l.kind === 'ability' || l.kind === 'technique');
  if (top && (top.whole ?? 0) >= WORKBOOK.named) {
    // Worked where the piece is weakest: the lowest segment, played another way, can draw on something else.
    const at = segs.length ? segs.reduce((b, s, i) => (s.overall < segs[b]!.overall ? i : b), 0) : undefined;
    out.push({ id: `limit:${top.what}`, kind: 'limit', ...(at !== undefined ? { segment: at } : {}), label: `${top.label} Holds It Back`, why: `Your ${top.label.toLowerCase()} costs your ${DIMENSION_LABEL[top.dimension].toLowerCase()} ${top.by} points, and the whole piece ${top.whole}.${at !== undefined ? ` The piece is weakest in ${segs[at]!.label.toLowerCase()}, at ${segs[at]!.overall}.` : ''} Working on it trains it a little, and playing one part of the scene another way can lean on a different ability.`, measure: e.overall, gap: top.whole ?? 0 });
  }
  // A part of preparation short, other than the segments' own and the objective's: its own step answers it. Its label is
  // a button's, in Title Case (from 2026-10-12: until then only its first letter was raised, and Work It Through offered
  // "Knowing the genre: Not There Yet").
  for (const l of e.limits.filter((x) => x.kind === 'preparation' && !ignored(x) && x.what !== spec.part && x.what !== p.objective?.part && x.what !== 'way' && (x.whole ?? 0) >= 0.5)) {
    if (out.some((x) => x.id === `prep:${l.what}`)) continue;
    out.push({ id: `prep:${l.what}`, kind: 'prep', label: `${titleCaseLabel(l.label)}: Not There Yet`, why: `It costs your ${DIMENSION_LABEL[l.dimension].toLowerCase()} ${l.by} points, and the whole piece ${l.whole}. Its own preparation step works on it.`, measure: e.overall, gap: l.whole ?? 0 });
  }
  if (p.objective) {
    const obj = e.limits.find((l) => l.kind === 'preparation' && l.what === p.objective!.part);
    if (obj && (obj.whole ?? 0) >= 0.5) out.push({ id: 'objective', kind: 'objective', label: 'What You Want Isn’t Clear Yet', why: `${p.objective.label} is at ${pct(p.objective.get())}, which costs your ${DIMENSION_LABEL[obj.dimension].toLowerCase()} ${obj.by} points.`, measure: e.overall, gap: obj.whole ?? 0 });
  }
  if (p.together && p.partner) {
    const t = p.together(e);
    // Where running it together can't move them, the way at it is asking them to rehearse (from 2026-10-12).
    const first = p.partner.name.split(' ')[0];
    if (t !== undefined && e.overall - t >= 3) out.push({ id: 'partner', kind: 'partner', label: `${first} Isn’t There Yet`, why: `Together it would come to ${t}, against ${e.overall} for your own work: ${first}’s preparation is at ${pct(p.partner.get())}.${p.partner.set ? '' : ` Ask ${first} to rehearse it with you.`}`, measure: t, gap: e.overall - t });
  }
  const sorted = out.sort((a, b) => b.gap - a.gap || a.id.localeCompare(b.id));
  const shown = sorted.slice(0, WORKBOOK.offered);
  // The problem being worked stays on the list while it's still a problem, in the last place if it has fallen below it
  // (from 2026-10-16, evaluation-10's follow-up). Once a scene was judged in its units, the Seagull's five turns were five
  // problems, and the turn into its second part, worked slowly to 92% of the 95% it asks, fell under the others past the
  // eighth place and left the list, so a kept try took it for answered (`tryAdjustment`) and Work It Slowly was refused
  // for it as no problem the work showed (tests/guide-examples-coursework.test.ts, the workbook's played example).
  const named = p.peek()?.problem?.id;
  const kept = named !== undefined && !shown.some((x) => x.id === named) ? sorted.find((x) => x.id === named) : undefined;
  if (kept) shown.splice(Math.max(0, shown.length - 1), 1, kept);
  return shown.map(({ gap: _gap, ...x }) => x);
}

/** A problem's figure in a forecast: its segment's result, the whole, or the work together. */
function measureOf(p: WorkPiece, problem: Pick<Problem, 'kind' | 'segment'>, e = p.forecast()): number {
  if (problem.kind === 'partner') return p.together?.(e) ?? e.overall;
  if (problem.segment !== undefined && problem.kind !== 'limit') return e.piece?.segments[problem.segment]?.overall ?? e.overall;
  return e.overall;
}

/** The sides a segment can be played its own way: on an axis the whole leaves open, fitting the material and any request. */
function waysFor(p: WorkPiece): { axis: Axis; side: AxisValue }[] {
  const out: { axis: Axis; side: AxisValue }[] = [];
  for (const axis of Object.keys(AXES) as Axis[]) {
    if (p.playing?.[axis] !== undefined) continue;
    for (const side of AXES[axis].values) if (!misfitOf(axis, side, p.material, p.direction)) out.push({ axis, side });
  }
  return out;
}

/**
 * A way already tried at a problem and put back, or (from 2026-10-16) kept but measured to move nothing at all (under
 * `WORKBOOK.unmoved`): it isn't offered again, since it has said what it can. Until then a way that changed nothing stayed
 * on offer, and was the one a note was worked with again and again: played on 2026-10-16, a note on emotional depth was
 * worked Work It Slowly four times, 53 to 53 each time. A way that moves a little, a segment rehearsed in by a few tenths,
 * stays on offer.
 */
const tried = (book: Workbook | undefined, problem: string, adjustment: AdjustmentId, option?: string) =>
  (book?.tries ?? []).some((t) => t.problem === problem && t.adjustment === adjustment && (t.option ?? '') === (option ?? '') && (t.verdict === 'revised' || (t.verdict === 'kept' && Math.abs(t.after - t.before) < WORKBOOK.unmoved)));

/** The adjustments the problem being worked on admits, each a different change; none put back for it before. */
export function optionsOf(p: WorkPiece, problem: Problem): Option[] {
  const book = p.peek();
  const out: Option[] = [];
  const s = problem.segment;
  const segs = p.spec().segments;
  const work = p.work();
  // Working a segment slowly moves its own rehearsal: offered where that's short, where a turn leads into it, or for a
  // limit, which the work trains a little; a segment already secure gains nothing from it.
  const seg = s !== undefined ? p.forecast().piece?.segments[s] : undefined;
  const shortThere = seg ? seg.part < seg.required - 0.005 : false;
  // Or where an ability or a technique holds the segment back: the work there is practice in it.
  const heldBy = seg ? abilityHolding(p, seg) : undefined;
  for (const a of Object.values(ADJUSTMENTS)) {
    if (!a.answers.includes(problem.kind as ProblemKind)) continue;
    if (a.id === 'work-beat') { if (s !== undefined && (work[s] ?? 0) < 0.97 && (shortThere || heldBy || problem.kind === 'limit' || problem.kind === 'turn') && !tried(book, problem.id, a.id)) out.push({ adjustment: a.id, label: a.label, words: a.words, minutes: a.minutes, segment: s }); continue; }
    if (a.id === 'run-into') { if (s !== undefined && s > 0 && segs[s]?.turnInto && (work[s] ?? 0) < 0.97) out.push({ adjustment: a.id, label: a.label, words: a.words, minutes: a.minutes, segment: s }); continue; }
    if (a.id === 'beat-way') {
      if (s === undefined || book?.ways?.[s]) continue;
      for (const w of waysFor(p)) {
        const option = `${w.axis}:${w.side}`;
        if (tried(book, problem.id, a.id, option)) continue;
        out.push({ adjustment: a.id, option, label: `Play ${segs[s]!.label} ${APPROACH_EFFECT[w.side].label}`, words: APPROACH_EFFECT[w.side].words, minutes: a.minutes, segment: s });
      }
      continue;
    }
    if (a.id === 'breathe') { if (!book?.breathe && !tried(book, problem.id, a.id)) out.push({ adjustment: a.id, label: a.label, words: a.words, minutes: a.minutes }); continue; }
    if (a.id === 'objective') { if (p.objective && p.objective.get() < 0.97) out.push({ adjustment: a.id, label: a.label, words: a.words, minutes: a.minutes }); continue; }
    if (a.id === 'with-partner') { if (p.partner?.set && p.partner.get() < 0.97) out.push({ adjustment: a.id, label: a.label, words: a.words, minutes: a.minutes }); continue; }
  }
  // Work first, then the changes of how it's played: the first offered is never a gamble.
  return out.sort((x, y) => (ADJUSTMENTS[x.adjustment].kind === 'work' ? 0 : 1) - (ADJUSTMENTS[y.adjustment].kind === 'work' ? 0 : 1));
}

/** Why a problem can't be named now, or nothing. */
export function identifyRefusal(p: WorkPiece | undefined, problem: unknown): string | undefined {
  if (!p) return 'There’s no such work in progress.';
  if (p.peek()?.tries.some((t) => t.verdict === 'pending')) return 'Keep or put back the change you tried first.';
  if (!problemsOf(p).some((x) => x.id === problem)) return 'That isn’t a problem the work shows now.';
  return undefined;
}

export function identify(sim: Simulation, p: WorkPiece, problem: string): Problem {
  const found = problemsOf(p).find((x) => x.id === problem)!;
  p.book().problem = { ...found, at: sim.now };
  return found;
}

/** Why an adjustment can't be tried now, or nothing. */
export function tryRefusal(sim: Simulation, person: Person, p: WorkPiece | undefined, adjustment: unknown, option?: unknown): string | undefined {
  if (!p) return 'There’s no such work in progress.';
  const book = p.peek();
  const problem = book?.problem;
  if (!problem) return 'Name the problem you’re working on first.';
  if (book.tries.some((t) => t.verdict === 'pending')) return 'Keep or put back the change you tried first.';
  const def = ADJUSTMENTS[adjustment as AdjustmentId];
  if (!def) return 'That isn’t a way to work on it.';
  if (!optionsOf(p, problem).some((o) => o.adjustment === def.id && (o.option ?? '') === String(option ?? ''))) return tried(book, problem.id, def.id, option ? String(option) : undefined) ? 'You tried that for this and put it back.' : 'That doesn’t answer the problem you’re working on.';
  return wayRefusal(sim, person, p, def.id);
}

/**
 * Why a way at a piece can't be worked now, or nothing, whichever door it's worked through: Work It Through
 * (`work.try`) and a director's note on the craft (`school.work_note`) both ask it (from 2026-10-12; until then only
 * `work.try` did, and the note's door asked whether a fixed hour was clear). A hospital bed, asleep, too tired or hurt
 * for work on your feet, the piece's own refusal, and the way's own minutes before the next commitment.
 */
export function wayRefusal(sim: Simulation, person: Person, p: WorkPiece, adjustment: AdjustmentId): string | undefined {
  const def = ADJUSTMENTS[adjustment];
  if (inHospital(person, sim.now)) return 'Not from a hospital bed.';
  if (person.awakeSince !== undefined && person.awakeSince > sim.now) return 'You’re asleep.';
  if (def.feet) {
    if (person.wellbeing.energy < SPENT) return 'You’re too tired to work on your feet. Sleep first.';
    const hurt = trainingRefusal(person, sim.now);
    if (hurt) return hurt;
  }
  return p.refusal(def.minutes) ?? startRefusal(sim, person, def.minutes);
}

/** An adjustment tried: its time, its change, its evidence. A change of how it's played waits to be kept or put back. */
export function tryAdjustment(sim: Simulation, person: Person, p: WorkPiece, adjustment: AdjustmentId, option?: string): Try {
  const def = ADJUSTMENTS[adjustment];
  const book = p.book();
  const problem = book.problem!;
  const before = measureOf(p, problem);
  const focus = Math.min(1.1, Math.max(0.5, focusAt(sim, person, sim.now)));
  const s = problem.segment;
  const work = [...p.work()];
  const n = p.spec().segments.length;
  while (work.length < n) work.push(0);
  const W = WORKBOOK;
  if (adjustment === 'work-beat' && s !== undefined) work[s] = clamp01(work[s]! + W.workGain * focus * (1 - work[s]!));
  if (adjustment === 'run-into' && s !== undefined && s > 0) { work[s - 1] = clamp01(work[s - 1]! + W.intoBefore * focus * (1 - work[s - 1]!)); work[s] = clamp01(work[s]! + W.intoAfter * focus * (1 - work[s]!)); }
  if (adjustment === 'work-beat' || adjustment === 'run-into') p.setWork(work);
  if (adjustment === 'beat-way' && s !== undefined && option) {
    const [axis, side] = option.split(':') as [Axis, AxisValue];
    book.undo = { ways: [...(book.ways ?? [])] };
    const ways = [...(book.ways ?? [])];
    while (ways.length < n) ways.push(null);
    ways[s] = { axis, side, prep: clamp01(W.wayGain * focus) } satisfies SegmentWay;
    book.ways = ways;
  }
  if (adjustment === 'breathe') { book.undo = { breathe: book.breathe ?? false }; book.breathe = true; }
  if (adjustment === 'objective' && p.objective) p.objective.set(clamp01(p.objective.get() + W.objectiveGain * focus * (1 - p.objective.get())));
  if (adjustment === 'with-partner' && p.partner?.set) p.partner.set(clamp01(p.partner.get() + W.partnerGain * focus * (1 - p.partner.get())));
  // Working a segment slowly rehearses in a way it's played its own way, as rehearsal does a whole's.
  if (adjustment === 'work-beat' && s !== undefined && book.ways?.[s]) book.ways[s] = { ...book.ways[s]!, prep: clamp01(book.ways[s]!.prep + W.wayGain * focus * (1 - book.ways[s]!.prep)) };
  // The evidence is the change in the work, measured on the day as it stood when the way began (from 2026-10-16). Until
  // then the figure after was read once the half hour on the feet had passed and tired the actor, so a way that changed
  // nothing measured worse by the tiring alone, and a director's note on a limit no way moves (an ability) was answered
  // only if the limit left the forecast: played in phase 2b of the attributes brief, a student's notes on presence went unanswered
  // call after call, the notes share fell, and her nights with it.
  const after = measureOf(p, problem);
  sim.advanceTo(sim.now + def.minutes * 60_000);
  exerts(person, def.feet ? 2.5 : 1.5, def.minutes / 60);
  // What it practises: a limit worked on trains what limits it, a turn run into trains adaptability. Lightly, as a
  // preparation step's training does (\`BRIEF.trainingWeight\`).
  const trains = problem.kind === 'limit' ? problem.id.slice('limit:'.length) : s !== undefined && problem.kind === 'segment' ? abilityHolding(p, p.forecast().piece?.segments[s] ?? {}) : undefined;
  if (trains && (adjustment === 'work-beat' || adjustment === 'beat-way')) ordinary(sim, person, trains as Target, focus, 0.25, `workbook:${p.key}`);
  if (adjustment === 'run-into') ordinary(sim, person, 'adaptability', focus, 0.25, `workbook:${p.key}`);
  const t: Try = { at: sim.now, problem: problem.id, label: problem.label, adjustment, ...(option ? { option } : {}), ...(s !== undefined ? { segment: s } : {}), before: r1(before), after: r1(after), verdict: def.kind === 'choice' ? 'pending' : 'kept' };
  book.tries.push(t);
  if (book.tries.length > W.triesKept) book.tries.splice(0, book.tries.length - W.triesKept);
  // Solved: the problem has left the forecast's problems.
  if (t.verdict === 'kept' && !problemsOf(p).some((x) => x.id === problem.id)) delete book.problem;
  return t;
}

/** Why a change tried can't be settled now, or nothing. */
export function settleRefusal(p: WorkPiece | undefined): string | undefined {
  if (!p) return 'There’s no such work in progress.';
  if (!p.peek()?.tries.some((t) => t.verdict === 'pending')) return 'There’s no change waiting to be kept or put back.';
  return undefined;
}

/** A change tried, kept (a discovery) or put back. */
export function settle(p: WorkPiece, keep: boolean): Try {
  const book = p.book();
  const t = book.tries.find((x) => x.verdict === 'pending')!;
  t.verdict = keep ? 'kept' : 'revised';
  if (!keep && book.undo) {
    if (book.undo.ways !== undefined) book.ways = book.undo.ways;
    if (book.undo.breathe !== undefined) { if (book.undo.breathe) book.breathe = true; else delete book.breathe; }
  }
  delete book.undo;
  if (book.problem && !problemsOf(p).some((x) => x.id === book.problem!.id)) delete book.problem;
  return t;
}

/** The discoveries kept, in words: what's played its own way, where the breath is, and the work that moved a problem. */
export function discoveriesOf(p: WorkPiece): string[] {
  const book = p.peek();
  if (!book) return [];
  const segs = p.spec().segments;
  const out: string[] = [];
  (book.ways ?? []).forEach((w, s) => { if (w) out.push(`${segs[s]?.label ?? `Part ${s + 1}`}, played ${APPROACH_EFFECT[w.side].label.toLowerCase()}: rehearsed to ${Math.round(w.prep * 100)}%.`); });
  if (book.breathe) out.push('Places to breathe found: the piece tires you less.');
  for (const t of book.tries.filter((x) => x.verdict === 'kept' && x.after - x.before >= WORKBOOK.evidence)) out.push(`${ADJUSTMENTS[t.adjustment].label}${t.option ? ` (${t.option.split(':')[1]})` : ''}, for ${t.label.toLowerCase()}: ${t.before} to ${t.after}.`);
  return out;
}

// ---------------------------------------------------------------------------
// The commands
// ---------------------------------------------------------------------------

/** Finds a piece in progress by its key (`systems/workpieces.ts`). */
export type FindPiece = (sim: Simulation, person: Person, key: string) => WorkPiece | undefined;

export function registerWorkbook(sim: Simulation, workPiece: FindPiece): void {
  sim.onCommand<{ piece: string; problem: string }, { problem: string; label: string; measure: number }>('work.identify', (p, { sim: s }) => {
    const piece = workPiece(s, s.player, String(p?.piece));
    const no = identifyRefusal(piece, p?.problem);
    if (no) throw new CommandError(no);
    const found = identify(s, piece!, String(p!.problem));
    return { problem: found.id, label: found.label, measure: found.measure };
  });
  sim.onCommand<{ piece: string; adjustment: string; option?: string; actionId?: string }, Try>('work.try', (p, { sim: s }) => {
    const piece = workPiece(s, s.player, String(p?.piece));
    const no = alreadyApplied(s.player, p?.actionId) ?? tryRefusal(s, s.player, piece, p?.adjustment, p?.option);
    if (no) throw new CommandError(no);
    markApplied(s.player, p?.actionId);
    return tryAdjustment(s, s.player, piece!, p!.adjustment as AdjustmentId, p?.option ? String(p.option) : undefined);
  });
  sim.onCommand<{ piece: string; keep: boolean }, Try>('work.settle', (p, { sim: s }) => {
    const piece = workPiece(s, s.player, String(p?.piece));
    const no = settleRefusal(piece);
    if (no) throw new CommandError(no);
    return settle(piece!, p?.keep !== false);
  });
}

/**
 * Whether a problem is still there (from 2026-10-16): a limit while it still costs the piece `WORKBOOK.named` of the whole
 * or more, whether or not it's the costliest; anything else while the forecast's problems still name it. Until then a
 * limit "left the forecast" when another input overtook it as the costliest, and a note on it was called answered while
 * its figure fell: played on 2026-10-16, emotional depth's note was resolved as the part fell from 53.1 to 50.3.
 */
export function stillThere(p: WorkPiece, id: string): boolean {
  if (id.startsWith('limit:')) {
    const what = id.slice('limit:'.length);
    const cost = p.forecast().limits.filter((l) => l.what === what && (l.kind === 'ability' || l.kind === 'technique')).reduce((t, l) => t + (l.whole ?? 0), 0);
    return cost >= WORKBOOK.named;
  }
  return problemsOf(p).some((x) => x.id === id);
}
