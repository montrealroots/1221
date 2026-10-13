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
 * and 82 tags before it).
 *
 * Where they act: every brief listed under a genre stages its applied demands,
 * or its medium reads them (`tests/briefs-content.test.ts`), so a self-tape in
 * the genre reads each once, at the weight the brief or its medium gives it
 * (`tapeReadsOf`), and the evaluation reads it as every technique is: mastered
 * (90) it asks nothing more, and the requirement is a technique the player can
 * see and practice (`practice.exercise`) before the take.
 *
 * Until 2026-10-13 this said that where a work was of a genre (a play’s kinds,
 * a coursework scene’s play, a self-tape’s genre), its demanded techniques
 * joined what the work read (`withDemands`): once each, at `DEMAND_WEIGHT`, and
 * never on top of one the work already read. For a play and a class scene that
 * held from 2026-10-10 until the material profiles later that day: from then a
 * play or a scene with a profile read its own material’s techniques in their
 * place (`playReads`, `workContext`), and every play and every scene has one
 * (tests/evidence-g23-school.test.ts). For a self-tape it held until
 * 2026-10-12, when a take became a brief’s. The calls left in a take’s reads
 * and a class scene’s added nothing, and went on 2026-10-13. Until later that day this said
 * `withDemands` was called still by `playReads` for a play with no profile; that
 * call had gone too, so `withDemands`, `demandReads`, `demandTags` and
 * `DEMAND_WEIGHT` (a weight of one, SLATE’s design choice) were read by tests
 * alone, and went (found by that day’s third round of defects). A genre’s
 * demands act through the briefs that stage them, above.
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

/**
 * Whether a genre's researched tags are applied as requirements: only where the research reached medium or high
 * confidence. A low entry's tags rest on one film or one star, and are shown as not applied rather than presented as a
 * genre's convention (from 2026-10-10).
 */
export const applied = (genre: string): boolean => { const d = GENRE_DEMANDS[genre]; return Boolean(d && d.confidence !== 'low'); };

/** The tags a genre demands, applied ones only. */
export const genreTags = (genre: string): DemandTag[] => (applied(genre) ? (GENRE_DEMANDS[genre]?.tags ?? []).map((t) => t.tag) : []);

export { GENRE_DEMANDS };
