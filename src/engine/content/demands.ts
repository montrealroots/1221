/**
 * SLATE — what a genre asks of an actor, as requirements the work reads
 * (from 2026-10-10). Until then each genre's demands were a sentence on its
 * look and nothing read them (`docs/UNBITTEN.md`).
 *
 * A genre's demands are tags from one fixed vocabulary, each the technique it
 * asks for (`DEMAND_TECHNIQUE`), each tag with the source that supports it
 * (`content/genre-demands.json`, generated from
 * `docs/research/attributes/research-genre-demands.json`), applied only where
 * the research reached medium or high confidence (`applied`): 41 of the 149
 * genres, 52 tags, after the review of 2026-10-10, which lowered every entry
 * that rested on one film, one director, one role or one subgenre (64 genres
 * and 82 tags before it). Where a work is of a
 * genre (a play's kinds, a coursework scene's play, a self-tape's genre), its
 * demanded techniques join what the work reads (`withDemands`):
 *
 * - once each, however many of its genres ask for the same one, so two kinds
 *   of comedy don't ask for comedy twice;
 * - at `DEMAND_WEIGHT`, a technique of the work's own, and never on top of one
 *   the work already reads, which keeps its own weight;
 * - read by the evaluation as every technique is, so mastered (90) it asks
 *   nothing more: the guarantee holds, and the requirement is a technique the
 *   player can see and practice (`practice.exercise`) before the work begins.
 *
 * The weight is SLATE's design choice; no source puts a number on how much a
 * genre's demands count against the rest of the craft.
 */

import type { Skill } from './school';
import { GENRE_DEMANDS } from './genre-demands';

export type DemandTag =
  | 'stunt' | 'song' | 'dance' | 'comic' | 'physicalComedy' | 'heightened' | 'accent' | 'improvisation' | 'intimacy'
  | 'camera' | 'voiceWork' | 'transformation';

export const DEMAND_TECHNIQUE: Readonly<Record<DemandTag, Skill>> = {
  stunt: 'combat', song: 'singing', dance: 'dance', comic: 'comedy', physicalComedy: 'clown', heightened: 'classical',
  accent: 'accents', improvisation: 'improv', intimacy: 'intimacy', camera: 'screen', voiceWork: 'voiceover', transformation: 'character',
};

export const DEMAND_LABEL: Readonly<Record<DemandTag, string>> = {
  stunt: 'Fights And Stunts', song: 'Singing', dance: 'Dancing', comic: 'Comic Timing', physicalComedy: 'Physical Comedy',
  heightened: 'Heightened Language', accent: 'Accents', improvisation: 'Improvisation', intimacy: 'Staged Intimacy',
  camera: 'Naturalism On Camera', voiceWork: 'Voice-Led Performance', transformation: 'Physical Transformation',
};

/** A genre's demands as researched: the claim, its source and what the source supports, and each tag's reason. */
export interface GenreDemand {
  claim: string;
  source: string;
  sourceSupports: string;
  how: string;
  confidence: 'high' | 'medium' | 'low';
  tags: readonly { tag: DemandTag; why: string }[];
  uncertainty: string;
  /** Where the demand belongs instead of the whole genre (from 2026-10-10): a subgenre, a role, particular material. Never applied. */
  belongsTo?: string;
  /** `definition`: applied because the genre is defined by it (a comedy asks comic timing), SLATE's reading rather than a source's statement. */
  basis?: 'definition';
}

/** A demanded technique's weight beside the work's own: SLATE's design choice. */
export const DEMAND_WEIGHT = 1;

/**
 * Whether a genre's researched tags are applied as requirements: only where the research reached medium or high
 * confidence. A low entry's tags rest on one film or one star, and are shown as not applied rather than presented as a
 * genre's convention (from 2026-10-10).
 */
export const applied = (genre: string): boolean => { const d = GENRE_DEMANDS[genre]; return Boolean(d && d.confidence !== 'low'); };

/** The tags a genre demands, applied ones only. */
export const genreTags = (genre: string): DemandTag[] => (applied(genre) ? (GENRE_DEMANDS[genre]?.tags ?? []).map((t) => t.tag) : []);

/** The tags a set of genres demands, once each. */
export function demandTags(genres: readonly string[]): DemandTag[] {
  return [...new Set(genres.flatMap(genreTags))];
}

/** The techniques a set of genres demands, once each, by weight. */
export function demandReads(genres: readonly string[]): Partial<Record<Skill, number>> {
  return Object.fromEntries(demandTags(genres).map((t) => [DEMAND_TECHNIQUE[t], DEMAND_WEIGHT]));
}

/** A work's reads with its genres' demands added: a technique the work already reads keeps its own weight. */
export function withDemands<T extends Partial<Record<Skill, number>>>(reads: T, genres: readonly string[]): T {
  const out: Partial<Record<Skill, number>> = { ...reads };
  for (const [skill, w] of Object.entries(demandReads(genres)) as [Skill, number][]) if (out[skill] === undefined) out[skill] = w;
  return out as T;
}

export { GENRE_DEMANDS };
