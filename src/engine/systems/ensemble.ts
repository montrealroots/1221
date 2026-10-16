/**
 * SLATE — what a partner brings to a scene, kept apart from the player's own work (from 2026-10-12).
 *
 * Until then a coursework scene's partner part was six tenths what the player had rehearsed with the partner and four
 * tenths what the partner had prepared on their own by the days since the work was set (`partnerOwn`), and the showing
 * read it as the player's own preparation. A partner's own preparation tops out at 0.85 and a scene is due in a week or
 * two, so a student at full abilities, every technique mastered and every part of their own work complete came out at
 * 94 to 98 on a paired scene, never 100, and was given a note, "work with your partner", that nothing they could do
 * would answer. The owner's brief of 2026-10-12 asked for the opposite: a partner's preparation, timing, interpretation
 * and reliability affect the shared scene; the player's own execution is kept apart from the partner's contribution;
 * and a partner's mistake mustn't lower a fully mastered player's own result, though it can lower the shared one.
 *
 * So there are two results.
 * - **Your own** is the evaluation of your work, as every piece of work is judged (`systems/evaluation.ts`). Its
 *   partner part is what you did: your rehearsals together. At mastery it's 100, whoever the partner is.
 * - **The scene together** (`sharedOf`) takes your result and the partner's contribution, and blends each dimension a
 *   partner shares by how much the material is played off them (`ENSEMBLE.share` times the material's partner level, of
 *   3): connection and responsiveness most, a little of belief and of holding it. The partner's contribution is
 *   their own preparation (from what they've done alone and what you've rehearsed together), their timing (their
 *   listening and focus), whether your readings agree (a disagreement held apart and not yet tried both ways), and an
 *   on-the-day slip drawn from their reliability, part of which a player who listens and adapts covers.
 *
 * What reads which: a coursework band and a night's band read your own result, since the teacher and the director
 * judge the actor; a callback reads the take as a whole, and the bond with a partner moves with how the scene went
 * together. Every size here is SLATE's estimate.
 */

import type { Dimension } from '../content/tasks';
import { draw, wholeOf, type DimensionResult, type Evaluation } from './evaluation';

export const ENSEMBLE = {
  /** The share of each dimension a partner holds, at a material built on the partner (level 3); less, less. */
  share: { connection: 0.5, responsiveness: 0.5, believability: 0.15, consistency: 0.1 } as Partial<Record<Dimension, number>>,
  /** What a partner who has prepared nothing still brings: they're there, saying the lines. */
  prepFloor: 0.4,
  /** How likely a slip is, against how unreliable they are: at reliability 0.72, about one scene in six. */
  slipRate: 0.6,
  /** A slip's size, against the contribution, over its share of the piece. */
  slipBy: 0.6,
  /** What a partner's working with you leaves of their preparation's gap: rehearsals together bring them up too. */
  together: 0.8,
  /** A table-work reading held apart, and not yet tried both ways: what agreement is left. */
  apart: 0.9,
} as const;

/** A partner as a scene reads them: name, preparation, timing, agreement and reliability, and how much the material is played off them. */
export interface PartnerRead {
  name: string;
  /** 0 to 1: what they've prepared, alone and with you. */
  prep: number;
  /** 0.5 to 1: their listening and focus. */
  timing: number;
  /** 1, or less where your readings are held apart. */
  agree: number;
  /** How often they come through: 0.72 to 0.98 for a classmate. */
  reliability: number;
  /** The material's partner level, 0 to 3. */
  level: number;
}

export interface SharedResult {
  /** The scene together: your result with the partner's contribution blended in where a partner shares it. */
  overall: number;
  dims: Partial<Record<Dimension, number>>;
  /** The partner's contribution, 0 to 1, after any slip. */
  contribution: number;
  partner: string;
  parts: { prep: number; timing: number; agree: number; reliability: number };
  /** A slip on the day: in which part of the scene, what it cost the contribution, and how much of it you covered (0 to 1). */
  slip?: { at: string; by: number; covered: number };
}

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const r1 = (x: number) => Math.round(x * 10) / 10;
const r3 = (x: number) => Math.round(x * 1000) / 1000;

/**
 * The scene together, from your result and the partner's read. `cover` is how much of a slip you'd cover, 0 to 1 (your
 * listening and adaptability); `weights` are the dimensions' weights as your result was judged; `key` keys the slip's
 * draw, under the save's seed, so the same scene on the same day slips the same.
 */
export function sharedOf(personal: Evaluation, read: PartnerRead, seed: string, key: string, cover: number, weights: Partial<Record<Dimension, number>>): SharedResult {
  const E = ENSEMBLE;
  const base = (E.prepFloor + (1 - E.prepFloor) * clamp(read.prep, 0, 1)) * clamp(read.timing, 0, 1) * clamp(read.agree, 0, 1);
  const segments = personal.piece?.segments.map((s) => s.label) ?? ['The Scene'];
  const u = (draw(`${seed}:${key}:slip`) + 1) / 2;
  let contribution = base;
  let slip: SharedResult['slip'];
  if (read.level > 0 && u < (1 - clamp(read.reliability, 0, 1)) * E.slipRate) {
    const at = segments[Math.floor(((draw(`${seed}:${key}:where`) + 1) / 2) * segments.length) % segments.length]!;
    const covered = clamp(cover, 0, 1);
    const by = (E.slipBy * base) / segments.length;
    contribution = base - by * (1 - covered);
    slip = { at, by: r3(by), covered: r3(covered) };
  }
  const dims: Partial<Record<Dimension, number>> = {};
  const blended: Pick<DimensionResult, 'dimension' | 'quality'>[] = personal.dimensions.map((d) => {
    const s = (E.share[d.dimension] ?? 0) * clamp(read.level, 0, 3) / 3;
    // The personal dimension at full precision where the result keeps it (from 2026-10-16, evaluation-9), so the scene
    // together is rounded once.
    const q = (1 - s) * (d.exact ?? d.quality) + s * 100 * contribution;
    dims[d.dimension] = r1(q);
    return { dimension: d.dimension, quality: q };
  });
  return {
    overall: r1(wholeOf(blended, weights)), dims, contribution: r3(contribution), partner: read.name,
    parts: { prep: r3(read.prep), timing: r3(read.timing), agree: read.agree, reliability: read.reliability },
    ...(slip ? { slip } : {}),
  };
}

/**
 * How the scene together compares with your own work, in words: what the partner added or cost it, and why. A classmate
 * is named by their first name; a reader that isn't a person, a name with an article ('A Recording', `systems/briefs.ts`),
 * by the thing itself, "the recording" (from 2026-10-12). Until then every reader was named by the first word of their
 * name, and a take the recording lifted said "… over your own work: A lifted it."
 */
export function sharedWords(personal: number, shared: SharedResult): string {
  const thing = /^(?:a|an|the) (.+)$/i.exec(shared.partner)?.[1];
  const first = thing ? `the ${thing.toLowerCase()}` : shared.partner.split(' ')[0];
  const gap = r1(shared.overall - personal);
  const why: string[] = [];
  if (shared.parts.prep < 0.6) why.push(`${first} came less prepared than you`);
  if (shared.parts.agree < 1) why.push('your readings were still apart');
  if (shared.slip) why.push(`${first} slipped in ${shared.slip.at.toLowerCase()}${shared.slip.covered >= 0.5 ? ', and you covered most of it' : ''}`);
  const said = why.length ? `: ${why.join('; ')}` : '';
  if (Math.abs(gap) < 1) return `Together it came to ${shared.overall}, about what your own work did${said}.`;
  return gap < 0 ? `Together it came to ${shared.overall}, ${-gap} under your own work${said}. Your own result stands as it is.` : `Together it came to ${shared.overall}, ${gap} over your own work: ${first} lifted it.`;
}
