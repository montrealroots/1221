/**
 * SLATE — what an actor has met and done, kept specifically (from 2026-10-10).
 *
 * Abilities and techniques say what an actor can do; this says what they've worked on: the material's features met
 * in work shown and in practice (verse, a farce's timing, a scene that turns from comedy to grief, a camera), the ways
 * of playing chosen and shown, and each exercise practised with how (`content/practice.ts`). It's read for three
 * things, and never for quality:
 *
 * - **Familiarity speeds preparation** (`featureSpeed`): material whose features have been met before is read and
 *   learned faster, up to the same sixth that a genre known gives (`genreSpeed`), and the better of the two counts,
 *   never both. Quality is the abilities' and techniques' alone, so the same evidence is never rewarded twice: once
 *   by the ability that grew from the work, and again by having done it.
 * - **Recommendations** (`recommendations`): what to work on next, from what held recent work back and isn't yet full,
 *   so a weakness addressed stops being prescribed. From 2026-10-12 the weakness the actor's work so far keeps coming
 *   back to (`Identity.recurring`, `systems/artistry.ts`) is said on its recommendation, with the pieces it has held
 *   back for life, and put first among those within half a point of the top; until then they read recent work alone.
 * - **Artistic identity** (`systems/artistry.ts`, from 2026-10-12): the material met and never met, and the ways of
 *   playing chosen, are what the actor's work so far is read from. Until then `approaches` was written and read by
 *   nothing. Two things went on being written on every judged piece and read by nothing after it: `materials`, each
 *   piece of material's showings, best and last, and a way of playing's `best`. Both were removed (from 2026-10-12); a
 *   save from before keeps them, unread.
 *
 * Bounded: the features are a fixed vocabulary, the ways of playing the axes' sides, the exercises the game's own, so
 * it can't grow past a few hundred entries however long the life.
 */

import type { Person } from '../domain/model';
import { zonedParts, type Instant } from '../core/time';
import type { MaterialProfile } from '../content/material';
import type { Identity } from './artistry';
import { ENGAGEMENT } from '../content/engagement';
import { blendsOf, transitionsOf } from './material';

export interface Experience {
  features: Record<string, { met: number; practiced: number; best?: number; last?: Instant }>;
  approaches: Record<string, { chosen: number; shown: number }>;
  /**
   * Each exercise's record: its sessions, the last day, how often each focus and tier; and from the integration pass of
   * 2026-10-10 the run of sessions on it with nothing else between (`streak`) and its last few gains (`gains`), which
   * the hour's feedback reads to say what's changed and when gains are slowing. Until then the same hour read the same
   * whatever had happened: a student told "Pitched where you are" 175 hours running while the level rose 17 points.
   */
  exercises: Record<string, { sessions: number; lastDay?: string; focus: Record<string, number>; tiers: Record<string, number>; streak?: number; gains?: number[]; lastTier?: number }>;
  /** The exercise practised last, whatever it was. */
  lastExercise?: string;
}

export const experienceOf = (person: Person): Experience => {
  const e = (person.experience ??= { features: {}, approaches: {}, exercises: {} });
  e.features ??= {}; e.approaches ??= {}; e.exercises ??= {};
  return e;
};

/** The features a material is built on, as the record keys them: those at level 2 or more, its language, its medium, a change of tone. */
export function featuresOf(m: MaterialProfile): string[] {
  const out: string[] = [];
  for (const f of ['timing', 'physical', 'partner', 'vocal', 'improvisation'] as const) if (m[f] >= 2) out.push(f);
  if (m.language !== 'everyday') out.push(`language:${m.language}`);
  if (m.medium === 'camera') out.push('medium:camera');
  if (m.medium === 'voice') out.push('medium:voice');
  if (transitionsOf(m) >= 3) out.push('transitions');
  if (new Set(m.tones).size > 1) out.push('mixed-tone');
  if (blendsOf(m) > 0) out.push('held-tones');
  return out;
}

export const FEATURE_LABEL: Readonly<Record<string, string>> = {
  timing: 'Exact Timing', physical: 'Physical Work', partner: 'Playing Off A Partner', vocal: 'Vocal Demand', improvisation: 'Improvised Freedom',
  'language:heightened': 'Heightened Prose', 'language:verse': 'Verse', 'medium:camera': 'The Camera', transitions: 'Many Transitions', 'mixed-tone': 'Mixed Tone',
  'medium:voice': 'The Microphone', 'held-tones': 'Two Tones At Once',
};

/** How many times a feature must have been met for familiarity to be full. SLATE's estimate. */
export const EXPERIENCE = { fullAt: 6 } as const;

/** Work shown or a session practised on material: its features, its playing, its result where judged. */
export function noteMaterial(person: Person, what: { material?: MaterialProfile; practiced?: boolean; at?: Instant; overall?: number; approaches?: readonly string[]; shown?: boolean }): void {
  const e = experienceOf(person);
  if (what.material) {
    for (const f of featuresOf(what.material)) {
      const r = (e.features[f] ??= { met: 0, practiced: 0 });
      if (what.practiced) r.practiced += 1; else r.met += 1;
      if (what.overall !== undefined) r.best = Math.max(r.best ?? 0, what.overall);
      if (what.at !== undefined) r.last = what.at;
    }
  }
  for (const side of what.approaches ?? []) {
    const r = (e.approaches[side] ??= { chosen: 0, shown: 0 });
    if (what.shown) r.shown += 1; else r.chosen += 1;
  }
}

/** How familiar an actor is with a material's features, 0 to 1: the mean over them of what's been met or practised, to `fullAt`. */
export function featureFamiliarity(person: Person, m: MaterialProfile | undefined): number {
  if (!m) return 0;
  const fs = featuresOf(m);
  if (!fs.length) return 0;
  const e = person.experience?.features ?? {};
  return fs.reduce((s, f) => s + Math.min(1, ((e[f]?.met ?? 0) + (e[f]?.practiced ?? 0)) / EXPERIENCE.fullAt), 0) / fs.length;
}

/** Preparation's speed from familiarity with the features: 1 to the genre's own most (`ENGAGEMENT.genreSpeed`). */
export const featureSpeed = (person: Person, m: MaterialProfile | undefined): number => 1 + ENGAGEMENT.genreSpeed * featureFamiliarity(person, m);

/**
 * What to work on next (from 2026-10-10): the inputs that cost recent work the most points (each kept result's
 * limits, `WorkRecord.limits`), weighted to the latest, that still have room, each with the exercise that trains it,
 * the tier that matches its level and a focus that suits it. A weakness addressed drops out: an input at full
 * isn't recommended, and one grown well past where it stood when it cost those points counts only what it costs now.
 * Preparation and condition limits say what to do differently, not what to train.
 */
export interface Recommendation {
  target: string; label: string; exercise?: string; tier?: 0 | 1 | 2; focus: string; why: string; points: number;
  /** Where it's the weakness the work so far keeps coming back to (from 2026-10-12): the last piece it held back and what that rests on, which the screens show beside it; the pieces and the points are in `why`. */
  recurring?: { last: number; evidence: readonly string[] };
}

/**
 * The floor a recommendation's recent cost has to reach, in points of the whole a piece, and how near the top the
 * recurring weakness has to be to be put first (from 2026-10-12). Both SLATE's.
 */
export const RECOMMEND = { floor: 0.5, recurringWithin: 0.5 } as const;

/** Days since an exercise was last practised, by the calendar at home (`lastDay`), for `recommendations`' focus; undefined where it never was. */
export function practicedDaysAgo(person: Person, now: Instant, zone: string): (exercise: string) => number | undefined {
  const p = zonedParts(now, zone);
  const today = Date.UTC(p.year, p.month - 1, p.day);
  return (ex) => {
    const d = person.experience?.exercises?.[ex]?.lastDay;
    if (!d) return undefined;
    const [y, m, dd] = d.split('-').map(Number);
    return Math.round((today - Date.UTC(y!, m! - 1, dd!)) / 86_400_000);
  };
}

/**
 * From 2026-10-12 a limit counts by what it cost the whole (`Limit.whole`), not its own dimension's points, and the
 * figure said is a mean per piece, weighted to the latest: until then the weighted sum of dimension points was said as
 * "it cost your recent work about N points", a number that grew with how many pieces there were. The focus is spaced
 * once the exercise was last practised a day to a week before (`lastPracticed`, the days since, where known), steady
 * otherwise, where until then it was steady always. A day's condition and a choice that didn't fit say what to do
 * differently, where until then they were dropped.
 *
 * `recurring` is the weakness the actor's work so far keeps coming back to (`Identity.recurring`, from later on
 * 2026-10-12): its recommendation says how many pieces it has held back for life, and goes first where its points are
 * within `RECOMMEND.recurringWithin` of the top. It's only ever one already here: at full, or under the floor, it isn't
 * brought back. No recommendation's points, exercise, tier or focus is moved by it, only the words and the order.
 */
export function recommendations(levelOf: (id: string) => number, fullOf: (id: string) => number, work: readonly { at: number; limits: readonly { kind: string; what: string; label: string; by: number; whole?: number }[]; inputs: { abilities: Record<string, number | undefined>; levels?: Record<string, number | undefined> } }[], exerciseFor: (id: string) => { id: string } | undefined, matchedTier: (level: number) => 0 | 1 | 2, recent = 12, lastPracticed?: (exercise: string) => number | undefined, recurring?: Identity['recurring']): Recommendation[] {
  const latest = [...work].sort((a, b) => a.at - b.at).slice(-recent);
  const cost = new Map<string, { label: string; points: number; then: number }>();
  const prepCost = new Map<string, { label: string; points: number }>();
  const dayCost = new Map<string, { label: string; points: number; kind: string }>();
  const weights = latest.reduce((a, _w, i) => a + (i + 1) / latest.length, 0) || 1;
  latest.forEach((w, i) => {
    const weight = (i + 1) / latest.length / weights;
    for (const l of w.limits) {
      const whole = l.whole ?? l.by / 4;
      if (l.kind === 'ability' || l.kind === 'technique') {
        const then = (l.kind === 'ability' ? w.inputs.abilities[l.what] : w.inputs.levels?.[l.what]) ?? 0;
        const c = cost.get(l.what) ?? { label: l.label, points: 0, then };
        c.points += whole * weight;
        c.then = Math.min(c.then, then);
        cost.set(l.what, c);
      } else if (l.kind === 'preparation') {
        const c = prepCost.get(l.what) ?? { label: l.label, points: 0 };
        c.points += whole * weight;
        prepCost.set(l.what, c);
      } else if (l.kind === 'condition' || l.kind === 'fit') {
        const k = `${l.kind}:${l.what}`;
        const c = dayCost.get(k) ?? { label: l.label, points: 0, kind: l.kind };
        c.points += whole * weight;
        dayCost.set(k, c);
      }
    }
  });
  const out: Recommendation[] = [];
  for (const [what, c] of cost) {
    const now = levelOf(what);
    const full = fullOf(what);
    if (now >= full) continue;
    // Grown since: what it cost then scales by the room left now against the room it had.
    const room = Math.max(0, full - now) / Math.max(1, full - c.then);
    const points = c.points * Math.min(1, room);
    if (points < RECOMMEND.floor) continue;
    const ex = exerciseFor(what);
    const since = ex ? lastPracticed?.(ex.id) : undefined;
    const focus = since !== undefined && since >= 1 && since <= 7 ? 'spaced' : 'steady';
    const each = Math.round(points * 10) / 10;
    out.push({ target: what, label: c.label, ...(ex ? { exercise: ex.id, tier: matchedTier(now) } : {}), focus, points: each, why: `It cost your recent work about ${each} ${each === 1 ? 'point' : 'points'} of the whole a piece, weighted to the latest; it’s at ${Math.round(now)} of ${Math.round(full)}. ${focus === 'spaced' ? 'Spaced: the last session was a day to a week ago, when spacing pays.' : 'Steady to begin; spaced pays once the last session is a day to a week old.'}` });
  }
  for (const [what, c] of prepCost) {
    if (c.points < RECOMMEND.floor) continue;
    out.push({ target: `prep:${what}`, label: c.label, focus: 'preparation', points: Math.round(c.points * 10) / 10, why: `Coming to the work with ${c.label.toLowerCase()} short cost about ${Math.round(c.points * 10) / 10} points of the whole a piece: that’s preparation, not training.` });
  }
  for (const [k, c] of dayCost) {
    if (c.points < RECOMMEND.floor) continue;
    out.push({ target: k, label: c.label, focus: c.kind === 'fit' ? 'choice' : 'condition', points: Math.round(c.points * 10) / 10, why: c.kind === 'fit' ? `A way of playing that didn’t fit cost about ${Math.round(c.points * 10) / 10} points of the whole a piece: choose one the material or the direction takes.` : `${c.label} cost about ${Math.round(c.points * 10) / 10} points of the whole a piece: come to the work rested and well, or find places to breathe in it.` });
  }
  out.sort((a, b) => b.points - a.points);
  // The weakness the work so far keeps coming back to, where it's here at all: said, with what it rests on, and first
  // where it's within half a point of the top.
  const mine = recurring ? out.find((r) => r.target === recurring.target) : undefined;
  if (recurring && mine) {
    mine.recurring = { last: recurring.last, evidence: recurring.evidence };
    mine.why = `${mine.why} Your work keeps coming back to it: it’s held back ${recurring.pieces} of your pieces for life, ${recurring.whole} ${recurring.whole === 1 ? 'point' : 'points'} of the whole in all.`;
    if (mine.points >= out[0]!.points - RECOMMEND.recurringWithin) out.unshift(...out.splice(out.indexOf(mine), 1));
  }
  return out.slice(0, 5);
}
