/**
 * SLATE — what an actor has met and done, kept specifically (from 2026-10-10).
 *
 * Abilities and techniques say what an actor can do; this says what they've worked on: the material's features met
 * in work shown and in practice (verse, a farce's timing, a scene that turns from comedy to grief, a camera), the ways
 * of playing chosen and how they went, each piece of material and its best showing, and each exercise practised with
 * how (`content/practice.ts`). It's read for three things, and never for quality:
 *
 * - **Familiarity speeds preparation** (`featureSpeed`): material whose features have been met before is read and
 *   learned faster, up to the same sixth that a genre known gives (`genreSpeed`), and the better of the two counts,
 *   never both. Quality is the abilities' and techniques' alone, so the same evidence is never rewarded twice: once
 *   by the ability that grew from the work, and again by having done it.
 * - **Recommendations** (`recommendations`): what to work on next, from what held recent work back and isn't yet full,
 *   so a weakness addressed stops being prescribed.
 * - **The record** on the screens: continuity, what was met and how it went.
 *
 * Bounded: the features are a fixed vocabulary, the materials the game's own, the exercises the game's own, so it
 * can't grow past a few hundred entries however long the life.
 */

import type { Person } from '../domain/model';
import type { Instant } from '../core/time';
import type { MaterialProfile } from '../content/material';
import { ENGAGEMENT } from '../content/engagement';
import { transitionsOf } from './material';

export interface Experience {
  features: Record<string, { met: number; practiced: number; best?: number; last?: Instant }>;
  approaches: Record<string, { chosen: number; shown: number; best?: number }>;
  materials: Record<string, { times: number; best: number; last: Instant }>;
  exercises: Record<string, { sessions: number; lastDay?: string; focus: Record<string, number>; tiers: Record<string, number> }>;
}

export const experienceOf = (person: Person): Experience => {
  const e = (person.experience ??= { features: {}, approaches: {}, materials: {}, exercises: {} });
  e.features ??= {}; e.approaches ??= {}; e.materials ??= {}; e.exercises ??= {};
  return e;
};

/** The features a material is built on, as the record keys them: those at level 2 or more, its language, its medium, a change of tone. */
export function featuresOf(m: MaterialProfile): string[] {
  const out: string[] = [];
  for (const f of ['timing', 'physical', 'partner', 'vocal', 'improvisation'] as const) if (m[f] >= 2) out.push(f);
  if (m.language !== 'everyday') out.push(`language:${m.language}`);
  if (m.medium === 'camera') out.push('medium:camera');
  if (transitionsOf(m) >= 3) out.push('transitions');
  if (new Set(m.tones).size > 1) out.push('mixed-tone');
  return out;
}

export const FEATURE_LABEL: Readonly<Record<string, string>> = {
  timing: 'Exact Timing', physical: 'Physical Work', partner: 'Playing Off A Partner', vocal: 'Vocal Demand', improvisation: 'Improvised Freedom',
  'language:heightened': 'Heightened Prose', 'language:verse': 'Verse', 'medium:camera': 'The Camera', transitions: 'Many Transitions', 'mixed-tone': 'Mixed Tone',
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
    if (what.overall !== undefined && what.at !== undefined) {
      const m = (e.materials[what.material.id] ??= { times: 0, best: 0, last: what.at });
      m.times += 1;
      m.best = Math.max(m.best, what.overall);
      m.last = what.at;
    }
  }
  for (const side of what.approaches ?? []) {
    const r = (e.approaches[side] ??= { chosen: 0, shown: 0 });
    if (what.shown) { r.shown += 1; if (what.overall !== undefined) r.best = Math.max(r.best ?? 0, what.overall); } else r.chosen += 1;
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
export interface Recommendation { target: string; label: string; exercise?: string; tier?: 0 | 1 | 2; focus: string; why: string; points: number }
export function recommendations(levelOf: (id: string) => number, fullOf: (id: string) => number, work: readonly { at: number; limits: readonly { kind: string; what: string; label: string; by: number }[]; inputs: { abilities: Record<string, number | undefined>; levels?: Record<string, number | undefined> } }[], exerciseFor: (id: string) => { id: string } | undefined, matchedTier: (level: number) => 0 | 1 | 2, recent = 12): Recommendation[] {
  const latest = [...work].sort((a, b) => a.at - b.at).slice(-recent);
  const cost = new Map<string, { label: string; points: number; then: number }>();
  const prepCost = new Map<string, { label: string; points: number }>();
  latest.forEach((w, i) => {
    const weight = (i + 1) / latest.length;
    for (const l of w.limits) {
      if (l.kind === 'ability' || l.kind === 'technique') {
        const then = (l.kind === 'ability' ? w.inputs.abilities[l.what] : w.inputs.levels?.[l.what]) ?? 0;
        const c = cost.get(l.what) ?? { label: l.label, points: 0, then };
        c.points += l.by * weight;
        c.then = Math.min(c.then, then);
        cost.set(l.what, c);
      } else if (l.kind === 'preparation') {
        const c = prepCost.get(l.what) ?? { label: l.label, points: 0 };
        c.points += l.by * weight;
        prepCost.set(l.what, c);
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
    if (points < 0.5) continue;
    const ex = exerciseFor(what);
    out.push({ target: what, label: c.label, ...(ex ? { exercise: ex.id, tier: matchedTier(now) } : {}), focus: 'steady', points: Math.round(points * 10) / 10, why: `It cost your recent work about ${Math.round(points)} point${Math.round(points) === 1 ? '' : 's'}, weighted to the latest; it’s at ${Math.round(now)} of ${Math.round(full)}. Steady to begin; spaced pays once the last session is a day to a week old.` });
  }
  for (const [what, c] of prepCost) {
    if (c.points < 1) continue;
    out.push({ target: `prep:${what}`, label: c.label, focus: 'preparation', points: Math.round(c.points * 10) / 10, why: `Coming to the work with ${c.label.toLowerCase()} short cost about ${Math.round(c.points)} points: that’s preparation, not training.` });
  }
  return out.sort((a, b) => b.points - a.points).slice(0, 5);
}
