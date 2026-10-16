/**
 * SLATE — a performance’s workload worked out (from 2026-10-16, brief 10; `content/workload.ts` holds the running times
 * and the coefficients, and says where each comes from).
 *
 * The formula, in one place:
 *
 * - **The workload.** Stage hours h = the playing minutes (the running time less its breaks) ÷ 60 × the part’s share of
 *   them (`WORKLOAD.share`, by its size). Intensity i = 1 + `perLevel` × (the body’s level + the voice’s, each 0 to 3, as
 *   the play’s material reads them). The workload W = h × i, never over `cap`. A longer part, a bigger part or a harder
 *   one is a greater workload, and a short, hard one can be as great as a long, easy one.
 * - **The drain within it.** The work done so far, A, rises through the playing time at W per playing time; at each break
 *   it’s cut by what the break gives back (`recovered`). At a moment the drain is `PIECE.drain` × min(1, A ÷ `full`, less
 *   where places to breathe were found) × (1 − stamina) × g, where g = 1 + `condition` × (1 − readiness ÷ 100) reads how
 *   tired the actor came to the curtain. A segment of the piece reads the drain’s mean over its own stretch of the
 *   running, worked out exactly, so a performance judged in its units comes to what the same performance judged whole
 *   does, and the drain is applied once, segment by segment, to what tiring reaches (`systems/piece.ts`).
 * - **What it costs after.** Energy = `energy` × W × (1 − `staminaSpares` × stamina) × g, taken once, when the call is
 *   played (`systems/school.ts`). It reads the work done, W, not A: a break gives back some of the drain for what follows
 *   it, and isn’t credited a second time here; the clock charges the evening’s waking hours as it charges any, breaks
 *   among them, and gives nothing back awake; and the night’s sleep restores energy by its own rule (`systems/life.ts`).
 * - **The clock.** A call holds its running time and the curtain call (`holdOf`), once.
 *
 * At stamina 100 the drain is nothing, whatever the workload and the day, so the mastery guarantee holds; the evening
 * still costs energy, half what it would at stamina 0.
 */

import { PIECE } from '../content/piece';
import { RUNNING_TIMES, UNNAMED_RUNNING, WORKLOAD, type RunningTime } from '../content/workload';
import type { PartSize } from '../content/plays';
import type { Evaluation } from './evaluation';
import type { SegmentSpec } from './piece';

/** Who plays how much of it: a part by its size, or the one actor of a solo piece. */
export type Participation = PartSize | 'solo';

/** A night’s workload, as a night’s piece keeps it (`PieceSpec.night`): what it reads, and what it comes to. */
export interface NightLoad {
  /** The running time, its breaks included, and the playing time without them, in minutes. */
  running: number;
  playing: number;
  /** Each break’s minutes, in order, at an even share of the playing time. */
  breaks: readonly number[];
  basis: RunningTime['basis'];
  /** The running time’s basis in words. */
  from: string;
  size: Participation;
  /** The part’s share of the playing time on stage. */
  share: number;
  /** The body’s and the voice’s levels, 0 to 3, and the intensity they make. */
  physical: number;
  vocal: number;
  intensity: number;
  /** The workload, 0 to `WORKLOAD.cap`. */
  workload: number;
  /** What places to breathe leave of the drain (`WORKBOOK.breathe`), 1 where none were found. */
  breathe: number;
}

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

/** What a break of so many minutes gives back of the drain so far: a quarter at 20 minutes or more, a shorter one in proportion. */
export const recovered = (minutes: number): number => WORKLOAD.recovers * clamp(minutes / WORKLOAD.recoversFullAt, 0, 1);

/** How much more the evening asks of somebody tired at the curtain: 1 at full readiness, `1 + condition` at none. */
export const conditionFactor = (readiness: number): number => 1 + WORKLOAD.condition * (1 - clamp(readiness, 0, 100) / 100);

/** A production’s running time: the play’s, or what stands for it where the catalog names none (`UNNAMED_RUNNING`). */
export function runningOf(holder: { play?: string; kind?: string; solo?: boolean; production?: string; process?: unknown }): RunningTime {
  if (holder.solo) return UNNAMED_RUNNING.solo;
  const named = holder.play ? RUNNING_TIMES[holder.play] : undefined;
  if (named) return named;
  // Yale Rep without a play it names is 2026–27’s The Seagull (`SEAGULL_2027`); a Cabaret piece is its own.
  if (!holder.play && (holder.kind === 'role' || holder.kind === 'understudy')) return UNNAMED_RUNNING.seagull;
  if ((holder.process as { format?: string } | undefined)?.format === 'cabaret' || holder.production?.startsWith('Yale Cabaret,')) return UNNAMED_RUNNING.cabaret;
  return UNNAMED_RUNNING.newPlay;
}

/** The minutes a production’s performance call holds the clock: its running time and the curtain call. */
export const holdOf = (holder: Parameters<typeof runningOf>[0]): number => runningOf(holder).minutes + WORKLOAD.curtainCall;

/** A night’s workload from its running time, the body’s and the voice’s work, and who plays how much of it. */
export function nightLoad(rt: RunningTime, m: { physical: number; vocal: number }, size: Participation, breathe = 1): NightLoad {
  const playing = Math.max(1, rt.minutes - rt.breaks.reduce((a, b) => a + b, 0));
  const physical = clamp(m.physical, 0, 3);
  const vocal = clamp(m.vocal, 0, 3);
  const share = WORKLOAD.share[size];
  const intensity = 1 + WORKLOAD.perLevel * (physical + vocal);
  const workload = Math.min(WORKLOAD.cap, (playing / 60) * share * intensity);
  return { running: rt.minutes, playing, breaks: [...rt.breaks], basis: rt.basis, from: rt.from, size, share, physical, vocal, intensity, workload, breathe };
}

/** The work done so far, piece by piece of the playing time between breaks: where each starts, what it starts at, and its rise a minute. */
function stretches(n: NightLoad): { from: number; to: number; a: number; slope: number }[] {
  const k = n.breaks.length;
  const slope = n.workload / n.playing;
  const out: { from: number; to: number; a: number; slope: number }[] = [];
  let a = 0;
  let from = 0;
  for (let i = 0; i <= k; i += 1) {
    const to = i < k ? ((i + 1) / (k + 1)) * n.playing : n.playing;
    out.push({ from, to, a, slope });
    a = (a + slope * (to - from)) * (i < k ? 1 - recovered(n.breaks[i]!) : 1);
    from = to;
  }
  return out;
}

/** The integral of min(1, c × (a + slope × (t − from))) over [lo, hi] within one stretch: a line, held at 1 once it reaches it. */
function integral(p: { from: number; a: number; slope: number }, lo: number, hi: number, c: number): number {
  const y0 = c * (p.a + p.slope * (lo - p.from));
  const y1 = c * (p.a + p.slope * (hi - p.from));
  if (y1 <= 1) return ((y0 + y1) / 2) * (hi - lo);
  if (y0 >= 1) return hi - lo;
  const cross = lo + ((1 - y0) / (y1 - y0)) * (hi - lo);
  return ((y0 + 1) / 2) * (cross - lo) + (hi - cross);
}

/** The drain’s share of its most, before stamina and the day, as a mean over [u, v] of the playing time. */
export function meanShare(n: NightLoad, u: number, v: number): number {
  const c = n.breathe / WORKLOAD.full;
  if (!(v > u)) return shareAt(n, u);
  let total = 0;
  for (const p of stretches(n)) {
    const lo = Math.max(u, p.from);
    const hi = Math.min(v, p.to);
    if (hi > lo) total += integral(p, lo, hi, c);
  }
  return total / (v - u);
}

/** The drain’s share of its most at a moment of the playing time (just before a break, at a break’s own minute). */
export function shareAt(n: NightLoad, t: number): number {
  const ps = stretches(n);
  const p = ps.find((x) => t <= x.to) ?? ps[ps.length - 1]!;
  return Math.min(1, (n.breathe / WORKLOAD.full) * (p.a + p.slope * (clamp(t, p.from, p.to) - p.from)));
}

/** At the curtain’s fall. */
export const endShare = (n: NightLoad): number => shareAt(n, n.playing);

/** The whole performance processed at once: the drain’s mean over all of it. */
export const wholeShare = (n: NightLoad): number => meanShare(n, 0, n.playing);

/** Each segment’s stretch of the playing time, by its length (`SegmentSpec.length`, one where it isn’t given). */
export function spansOf(n: NightLoad, segments: readonly SegmentSpec[]): [number, number][] {
  const total = segments.reduce((t, x) => t + (x.length ?? 1), 0) || 1;
  let before = 0;
  return segments.map((x) => {
    const from = (before / total) * n.playing;
    before += x.length ?? 1;
    return [from, (before / total) * n.playing] as [number, number];
  });
}

/** Each segment’s mean share of the drain over its own stretch: what `judgePiece` applies to it. */
export const segmentShares = (n: NightLoad, segments: readonly SegmentSpec[]): number[] => spansOf(n, segments).map(([u, v]) => meanShare(n, u, v));

/** Each segment’s share of the workload, by its stretch of the playing time: they sum to the whole’s. */
export const segmentWorkloads = (n: NightLoad, segments: readonly SegmentSpec[]): number[] => spansOf(n, segments).map(([u, v]) => (n.workload * (v - u)) / n.playing);

/** The drain at a share of its most: what tiring takes off what it reaches, by stamina (0 to 1) and readiness at the curtain. */
export const drainOf = (share: number, stamina: number, readiness: number): number => PIECE.drain * share * (1 - clamp(stamina, 0, 1)) * conditionFactor(readiness);

/** What the evening comes to for an actor: the drain at its end and on average, and the energy it costs after. */
export function eveningCost(n: NightLoad, stamina: number, readiness: number): { drainEnd: number; drainMean: number; energy: number } {
  const s = clamp(stamina, 0, 1);
  const g = conditionFactor(readiness);
  return {
    drainEnd: drainOf(endShare(n), s, readiness),
    drainMean: drainOf(wholeShare(n), s, readiness),
    energy: WORKLOAD.energy * n.workload * (1 - WORKLOAD.staminaSpares * s) * g,
  };
}

/** What a judged night’s record holds of its workload and the actor’s stamina and day, or nothing for a piece that isn’t a night. */
export function nightOfRecord(e: { inputs: Pick<Evaluation['inputs'], 'abilities' | 'fulls' | 'condition'> & { piece?: { night?: NightLoad } } }): { night: NightLoad; stamina: number; readiness: number } | undefined {
  const night = e.inputs.piece?.night;
  if (!night) return undefined;
  const st = e.inputs.abilities.stamina ?? 0;
  const full = e.inputs.fulls?.stamina ?? 100;
  return { night, stamina: clamp(st / Math.max(1, full), 0, 1), readiness: e.inputs.condition.readiness };
}

/** The energy a judged night costs after it, from its own record: what the call takes (`systems/school.ts`). */
export function energyOfNight(e: Parameters<typeof nightOfRecord>[0]): number {
  const r = nightOfRecord(e);
  return r ? eveningCost(r.night, r.stamina, r.readiness).energy : 0;
}

const minutesWords = (m: number): string => {
  const h = Math.floor(m / 60);
  const r = Math.round(m - h * 60);
  return h ? `${h} h${r ? ` ${String(r).padStart(2, '0')}` : ''}` : `${r} minutes`;
};
const SIZE_WORDS: Record<Participation, string> = { lead: 'a lead', supporting: 'a supporting part', featured: 'a featured part', solo: 'a solo piece' };
const WORDS = ['no', 'one', 'two', 'three'];

/**
 * The workload in words, from a judged night’s own record (the forecast’s or the night’s): the running time and its
 * basis, the breaks, the part’s share, the intensity, the workload against its bound, and what it does, the drain at the
 * curtain’s fall and the energy it costs. The figures are the engine’s, worked by the functions above.
 */
export function workloadWords(e: Parameters<typeof nightOfRecord>[0]): string | undefined {
  const r = nightOfRecord(e);
  if (!r) return undefined;
  const { night: n, stamina, readiness } = r;
  const cost = eveningCost(n, stamina, readiness);
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  const breaks = n.breaks.length ? `with ${WORDS[n.breaks.length] ?? n.breaks.length} ${n.breaks.length === 1 ? 'break' : 'breaks'} of ${n.breaks.map((b) => `${b} minutes`).join(' and ')}` : 'straight through';
  const estimate = n.basis === 'estimate' ? ', an estimate' : '';
  return `The evening runs ${minutesWords(n.running)} ${breaks}${estimate}. As ${SIZE_WORDS[n.size]} you’re on for about ${pct(n.share)} of its ${minutesWords(n.playing)} of playing; the body’s work is ${n.physical} of 3 and the voice’s ${n.vocal}, an intensity of ${n.intensity.toFixed(2)}: a workload of ${n.workload.toFixed(2)}, of at most ${WORKLOAD.cap}. At the curtain’s fall tiring takes ${pct(cost.drainEnd)} off what it reaches, at your stamina and readiness ${Math.round(readiness)}; the evening costs ${Math.round(cost.energy)} energy.`;
}
