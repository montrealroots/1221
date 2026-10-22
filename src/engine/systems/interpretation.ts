/**
 * SLATE — a way of playing read against the scene it's played in (from 2026-10-16; `content/interpretation.ts`).
 *
 * `suitabilityOf` sums what a scene's signals say of a side: its genre's register, the reader, the medium, its tones and
 * turns, its features and language, its circumstances (from 2026-10-16, later), and the reading taken of it. `grainOf` turns the chosen sides' suitability into what
 * the evaluation reads: a share of difficulty on each dimension a side leans on (`EvalContext.grain`) and how much of the
 * choice's rehearsal completes it. The brief's pane, the take's result and the guide read the same functions, so what
 * the screen says a choice suits is what the take is judged by.
 */

import { AXES, APPROACH_EFFECT, PLAYING } from '../content/approaches';
import { CONCERNS, type Concern } from '../content/concerns';
import { CIRCUMSTANCE_AFFINITY, CONCERN_AFFINITY, FEATURE_AFFINITY, SOLO_AFFINITY, GRAIN, GRAIN_LABEL, LANGUAGE_AFFINITY, MEDIUM_AFFINITY, READER_AFFINITY, TONE_AFFINITY, TURN_AFFINITY, type GrainBand } from '../content/interpretation';
import type { Axis, AxisValue, MaterialProfile } from '../content/material';
import type { Dimension, TaskProfile } from '../content/tasks';
import { GENRE_BY_ID } from '../content/film-genres';
import { GENRE_REGISTER } from '../content/genre-register';
import { SCENES } from '../content/coursework';
import { registerOfPlay } from '../content/genre-weights';

/** What a scene is, beyond its material, for reading a choice against it: its genre's register, its reader, the reading taken. */
export interface Scene {
  genre?: string;
  concerns?: readonly Concern[];
  readerPlays?: keyof typeof READER_AFFINITY;
  reading?: { label: string; lean: Partial<Record<Dimension, number>> };
}

export interface Signal { source: string; v: number }

export interface Suitability {
  side: AxisValue;
  /** -1 (against the grain) to 1 (with it): the signals' sum, halved and held. */
  s: number;
  band: GrainBand;
  /** What it rests on, the largest first. */
  signals: Signal[];
}

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const r2 = (x: number) => Math.round(x * 100) / 100;

/** The changes of tone a material asks, as `transitionsOf` counts them, without importing the material system (which reads this one). */
function turnsOf(m: MaterialProfile): number {
  if (m.beats?.length) {
    const key = (b: { tones: readonly string[] }) => [...b.tones].sort().join('+');
    return m.beats.slice(1).filter((b, i) => key(b) !== key(m.beats![i]!)).length;
  }
  return m.tones.slice(1).filter((t, i) => t !== m.tones[i]).length + m.turns;
}

/** Each tone's share of the material's beats (or its tones, without beats). */
function toneShares(m: MaterialProfile): Record<string, number> {
  const tones = m.beats ? m.beats.flatMap((b) => b.tones.map((t) => ({ t, w: 1 / b.tones.length }))) : m.tones.map((t) => ({ t, w: 1 }));
  const total = tones.reduce((a, x) => a + x.w, 0) || 1;
  const out: Record<string, number> = {};
  for (const x of tones) out[x.t] = (out[x.t] ?? 0) + x.w / total;
  return out;
}

/**
 * How far a reading leans the way a side does: the two leans' agreement over the dimensions, -1 to 1, scaled by
 * `GRAIN.reading`. A reading that puts the take's weight on its consistency coheres with playing it set.
 */
function readingCoherence(side: AxisValue, lean: Partial<Record<Dimension, number>>): number {
  const a = APPROACH_EFFECT[side].lean;
  const dims = [...new Set([...Object.keys(a), ...Object.keys(lean)])] as Dimension[];
  const x = dims.map((d) => Math.log(a[d] ?? 1));
  const y = dims.map((d) => Math.log(lean[d] ?? 1));
  const dot = x.reduce((s, v, i) => s + v * y[i]!, 0);
  const n = Math.sqrt(x.reduce((s, v) => s + v * v, 0) * y.reduce((s, v) => s + v * v, 0));
  return n > 0 ? GRAIN.reading * (dot / n) : 0;
}

/** What a scene's signals say of one side of an axis. */
export function suitabilityOf(side: AxisValue, material: MaterialProfile | undefined, scene: Scene = {}): Suitability {
  const signals: Signal[] = [];
  const push = (source: string, v: number) => { if (Math.abs(v) >= 0.005) signals.push({ source, v: r2(v) }); };
  const genre = scene.genre ? GENRE_BY_ID[scene.genre]?.label ?? scene.genre : undefined;
  for (const c of scene.concerns ?? []) push(`${genre ? `${genre}’s ` : ''}${CONCERNS[c].label}: ${CONCERN_AFFINITY[c].why}`, (CONCERN_AFFINITY[c].affinity[side] ?? 0) * GRAIN.concern);
  if (scene.readerPlays) push(READER_AFFINITY[scene.readerPlays].label, (READER_AFFINITY[scene.readerPlays].affinity[side] ?? 0) * GRAIN.reader);
  if (material) {
    push(MEDIUM_AFFINITY[material.medium].label, MEDIUM_AFFINITY[material.medium].affinity[side] ?? 0);
    const shares = toneShares(material);
    for (const t of Object.keys(TONE_AFFINITY) as (keyof typeof TONE_AFFINITY)[]) if (shares[t]) push(TONE_AFFINITY[t].label, (TONE_AFFINITY[t].affinity[side] ?? 0) * shares[t]!);
    if (material.partner === 0 && material.medium !== 'voice') push('No One To Play Off But The Lens', SOLO_AFFINITY[side] ?? 0);
    const turns = Math.min(3, turnsOf(material));
    if (turns) push(`Its ${turns === 1 ? 'Turn' : `${turns} Turns`}`, (TURN_AFFINITY[side] ?? 0) * turns);
    for (const f of Object.keys(FEATURE_AFFINITY) as (keyof typeof FEATURE_AFFINITY)[]) {
      const level = material[f];
      const e = FEATURE_AFFINITY[f];
      // On stage a voice's demand is the house's to reach, read on the execution (`STAGE_LEAN`), not a size of playing
      // (from 2026-10-16): until then Othello's willow song, sung low at bedtime, counted three quarters for expansive.
      if (f === 'vocal' && material.medium === 'stage') continue;
      if (level && level >= (e.from ?? 1)) push(e.label, (e.affinity[side] ?? 0) * level);
    }
    for (const [c, level] of Object.entries(material.circumstances ?? {}) as [keyof typeof CIRCUMSTANCE_AFFINITY, number][]) if (level) push(CIRCUMSTANCE_AFFINITY[c].label, (CIRCUMSTANCE_AFFINITY[c].affinity[side] ?? 0) * level);
    if (material.language !== 'everyday') push(LANGUAGE_AFFINITY[material.language].label, LANGUAGE_AFFINITY[material.language].affinity[side] ?? 0);
  }
  if (scene.reading) push(`Your Reading, ${scene.reading.label}`, readingCoherence(side, scene.reading.lean));
  signals.sort((a, b) => Math.abs(b.v) - Math.abs(a.v));
  const s = r2(clamp(signals.reduce((t, x) => t + x.v, 0) / 2, -1, 1));
  return { side, s, band: s >= GRAIN.band ? 'suits' : s <= -GRAIN.band ? 'against' : 'either', signals };
}

/** Both sides of an axis read against the scene. */
export const axisSuitability = (axis: Axis, material: MaterialProfile | undefined, scene: Scene = {}): [Suitability, Suitability] =>
  [suitabilityOf(AXES[axis].values[0], material, scene), suitabilityOf(AXES[axis].values[1], material, scene)];

/** What rides on it scales what suitability moves: a stakes-1 scene as it is, each level past it `stakesStep` more. */
export const stakesScale = (stakes: number | undefined) => 1 + GRAIN.stakesStep * ((stakes ?? 1) - 1);

/**
 * What the chosen sides' suitability asks of the evaluation: on each dimension a side leans on, by how far it leans there
 * against its most, a share of difficulty, negative with the grain and positive against it; and how much of the
 * choice's rehearsal completes it, the sides' mean suitability moving it from `PLAYING.complete`.
 *
 * Each share and the mark are kept to a hundredth (`r2`), as each signal and a side's suitability are (`suitabilityOf`),
 * since this was written on 2026-10-16; nothing said so until 2026-10-17 (brief 13). So a share under half a hundredth
 * comes to nothing. At a suitability of ±0.01 every share is under it (0.3 × 0.01 × at most 1.3, 0.0039), the grain moves
 * no take, and the take's line says nothing of it (`grainRead`); from ±0.02 believability's share is a hundredth or more
 * at every stakes the catalog holds, and every take moves the right way. Carried at full precision, the grain at ±0.01
 * would have moved a take by 0.063 at most, under a shown tenth, the right way on every one
 * (docs/verification/playthroughs-2026-10-17/acting-criteria.md, measured on the ten brief readings at ±0.01).
 */
export function grainOf(task: TaskProfile, sides: readonly AxisValue[], material: MaterialProfile | undefined, scene: Scene = {}): { grain: Partial<Record<Dimension, { d: number; label: string }>>; required: number; suits: Suitability[] } {
  const grain: Partial<Record<Dimension, { d: number; label: string }>> = {};
  const suits = sides.map((side) => suitabilityOf(side, material, scene));
  const k = stakesScale(material?.stakes);
  for (const x of suits) {
    const e = APPROACH_EFFECT[x.side];
    if (x.s === 0) continue;
    // Every dimension the side leans on, by how far it leans there against its most (from 2026-10-16, later). Until then
    // only a dimension leant 1.1 or more, where the choice's rehearsal is read: expansive's execution (1.05), the voice and
    // the body sized up, never met the scene's grain, and at a microphone, where execution weighs most, the side's
    // suitability hardly reached the take (docs/verification/interpretation-2026-10-16/i3-review.md).
    const most = Math.max(...Object.values(e.lean)) - 1;
    for (const [d, lean] of Object.entries(e.lean) as [Dimension, number][]) {
      if (lean <= 1 || !task.dims[d]) continue;
      const had = grain[d];
      const label = `${e.label}, ${GRAIN_LABEL[x.band]}`;
      grain[d] = { d: r2((had?.d ?? 0) - GRAIN.strength * x.s * k * ((lean - 1) / most)), label: had ? `${had.label}; ${label}` : label };
    }
  }
  const mean = suits.length ? suits.reduce((t, x) => t + x.s, 0) / suits.length : 0;
  return { grain, required: r2(clamp(PLAYING.complete - GRAIN.prep * mean, PLAYING.complete - GRAIN.prep, 1)), suits };
}

/** A side's suitability in words for the screen: its band, and the two or three signals it rests on most, each for or against. */
export function suitabilityWords(x: Suitability): string {
  const top = x.signals.filter((g) => Math.abs(g.v) >= 0.1).slice(0, 3);
  const said = top.map((g) => `${g.source} (${g.v > 0 ? 'for it' : 'against it'})`).join('; ');
  return `${APPROACH_EFFECT[x.side].label}: ${GRAIN_LABEL[x.band]}.${said ? ` ${said}.` : ' The scene doesn’t lean either way.'}`;
}

/** How much of a choice's rehearsal completes it, for the sides given (`grainOf`'s `required`), without a task. */
export function requiredFor(sides: readonly AxisValue[], material: MaterialProfile | undefined, scene: Scene = {}): number {
  if (!sides.length) return PLAYING.complete;
  const mean = sides.reduce((t, side) => t + suitabilityOf(side, material, scene).s, 0) / sides.length;
  return r2(clamp(PLAYING.complete - GRAIN.prep * mean, PLAYING.complete - GRAIN.prep, 1));
}

/**
 * The scene a class scene or a play is read as, where nothing more is given (from 2026-10-16, later): its genre's
 * register, as a brief's is, the genre a class scene names and the one a play names as its register (`registerOfPlay`,
 * `content/genre-weights.ts`, from 2026-10-22, the owner's brief 22: until then the first a play was listed under,
 * `kinds[0]`, by position; each play's register is the genre it had). Until then a class scene and a play were read by their material alone, and nothing in any of them
 * could favor restraint: measured on the 86 of them, fresh to the criteria, expansive came out ahead on every one
 * (docs/verification/interpretation-2026-10-16/i3-review.md). Their suitability only: the register's lean and draw on
 * class work stay as they were.
 */
export function sceneOfMaterial(material: MaterialProfile | undefined): Scene {
  if (!material) return {};
  const genre = SCENE_BY_ID.get(material.id)?.genre ?? registerOfPlay(material.title);
  const concerns = genre ? GENRE_REGISTER[genre]?.concerns : undefined;
  return genre && concerns?.length ? { genre, concerns } : {};
}
const SCENE_BY_ID = new Map(SCENES.map((x) => [x.id, x]));
