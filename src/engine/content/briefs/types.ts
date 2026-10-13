/**
 * SLATE — a practice brief: an original scene written for SLATE, for a self-tape in a genre (from 2026-10-12;
 * `systems/briefs.ts`).
 *
 * Until then a self-tape in a genre had no material: the camera's task, the genre's researched demands and how well
 * the genre was known, and nothing to read, choose or rehearse. A brief is the scene the tape is of, set out the way an
 * actor breaks a scene down before working on it: where and when it is, who the two people are to each other, what the
 * character wants and what's in the way, and where it turns (`docs/research/attributes/research-self-tape-briefs.json`
 * says which of those are the acting texts' and which are SLATE's). Every brief is original, written for SLATE, and shown
 * as SLATE's own: none is an excerpt from, or an adaptation of, a real film or play, and none names one.
 *
 * What a brief asks of the work is its material profile (`content/material.ts`'s features, read the same way, levels 0
 * to 3), its language, its medium, its beats, and the techniques its text requires. A genre doesn't add a demand of its
 * own: a brief listed under a genre with researched, applied demands (`content/demands.ts`) has those techniques because
 * its scene stages them, and the content test holds every listing to that. A genre without them is made distinct by
 * the scene's circumstances and task, never by a stereotype or a technique its label suggests.
 *
 * Each brief offers two or more readings, every one of them supported by the brief: a reading leans what the work
 * counts for and draws on different abilities (normalized, so a reading moves weight and never adds it). None is the
 * right answer. A reading can't misfit: only the material's own `allows`, said with its reason, and a direction
 * communicated before the take can hold a choice back (`systems/material.ts`).
 */

import type { AbilityId } from '../abilities';
import type { Axis, AxisValue, Level, Tone } from '../material';
import type { Skill } from '../school';
import type { Dimension } from '../tasks';

/**
 * Staged for a tape (from the review of 2026-10-12): a brief is taped alone, to a reader who stands off camera, or
 * recorded alone at a microphone. Nothing touches the reader: a fight's exchanges are marked solo against the reader's
 * called cues and its contact reacted to, an embrace is played to the eyeline beside the lens, props stay on the
 * actor's side of the frame, a weapon is a replica, and there's no live animal, water, fire, ladder or car to drive.
 * Each brief that stages something physical says how.
 */

/**
 * A beat of the scene, in order: what happens, and its tone. One tone is played plainly; two tones are held together
 * in the one beat (funny and frightening at once), which asks something different from a change between beats (a turn
 * from the joke to the grief). `systems/briefs.ts` counts each apart.
 */
export interface Beat { what: string; tones: readonly Tone[] }

/** An ability a reading draws on, and in which dimension of the work. */
export interface Draw { dim: Dimension; ability: AbilityId; weight: number }

/**
 * A reading of the scene the brief supports: what it takes the scene to be, what in the brief it rests on, how it leans
 * the work's dimensions (each 0.85 to 1.25, normalized) and the abilities it draws on (each weight 0.3 to 1).
 */
export interface Reading {
  id: string;
  /** Title Case, a few words. */
  label: string;
  /** The reading, in a sentence: what the scene is, played this way. */
  reading: string;
  /** What in the brief supports it. */
  rests: string;
  lean: Partial<Record<Dimension, number>>;
  draws: readonly Draw[];
}

export interface Brief {
  /** `brief-<genre id>` for the brief written for a genre, `-2` and on for further ones. */
  id: string;
  /** Title Case. The scene's own title, invented, never a real work's. */
  title: string;
  /** The genres it's a scene of (`kinds`, as a play's are), the one it was written for first. Each listing must carry that genre's applied demands. */
  kinds: readonly string[];
  /** On camera, to a reader off camera; or a voice recorded alone at a microphone. */
  medium: 'camera' | 'voice';
  /** How much there is to learn: a long one (from 2026-10-12) is a longer scene, slower to learn and harder on stamina. */
  size: 'short' | 'medium' | 'long';
  /**
   * How much rides on it for your character, 0 little to 3 everything (from 2026-10-12). A take's difficulty reads it
   * (`BRIEF.stakes`): the more that rides on it, the more it asks of the same craft. Unset, 1.
   */
  stakes?: 0 | 1 | 2 | 3;
  /**
   * How the reader plays the other part (from 2026-10-12): steady, pressing (pushing at you), withholding (giving you
   * little to play off) or unpredictable (never the same twice). It leans the take toward what playing against that asks
   * (`READER_PLAYS`, `systems/briefs.ts`). Unset, steady. A voice brief has no reader.
   */
  readerPlays?: 'steady' | 'pressing' | 'withholding' | 'unpredictable';
  /** The scene in one sentence. */
  logline: string;
  /** Where and when, and what has just happened: the given circumstances. */
  circumstances: string;
  /** What the two are to each other. */
  relationship: string;
  /** Who you play. */
  you: string;
  /** Who the reader plays, off camera (for a voice brief: who or what the voice speaks to). */
  reader: string;
  /** What your character wants in the scene. */
  objective: string;
  /** What's in the way. */
  obstacle: string;
  /** Two to six beats, in order: four at most for a short or medium one, six for a long one. */
  beats: readonly Beat[];
  language: 'everyday' | 'heightened' | 'verse';
  timing: Level;
  physical: Level;
  partner: Level;
  vocal: Level;
  improvisation: Level;
  /** Only what the scene's text requires: a song sung, a fight staged, a dialect written into the lines. */
  techniques?: Partial<Record<Skill, number>>;
  /** A side the scene can't be played, only where its text forces it, with its reason in `why.allows`. */
  allows?: Partial<Record<Axis, readonly AxisValue[]>>;
  /** Why, from the brief: each feature at 2 or more, each technique, any `allows`, and the beats. */
  why: Partial<Record<'timing' | 'physical' | 'partner' | 'vocal' | 'improvisation' | 'language' | 'techniques' | 'allows' | 'beats', string>>;
  /** Two or more readings the brief supports. */
  readings: readonly Reading[];
}
