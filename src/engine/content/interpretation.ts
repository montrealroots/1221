/**
 * SLATE — how well a way of playing suits the scene it's played in (from 2026-10-16; `systems/interpretation.ts`).
 *
 * Until then a way of playing (`content/approaches.ts`) leaned the same dimensions and drew the same abilities in every
 * scene, so restrained against expansive moved a take by the actor's own abilities alone, the same within a tenth in
 * Nordic noir, melodrama and social realism (docs/verification/genres-2026-10-16/README.md). The owner's brief of
 * 2026-10-16 asked that a choice interact with the scene: its genre's conventions, its text and stakes, its tones and
 * turns, the reader, the medium and its scale, the reading taken of it.
 *
 * Each thing in a scene that bears on a side is a signal, with an affinity for each side it bears on, from -1 (it works
 * against that side) to 1 (it carries it). A side's suitability is the sum of its signals, halved and held to -1..1.
 * No signal decides alone, so no genre has a rule: a Nordic noir scene with a pressing reader and comic beats can suit
 * driven, where the genre's own Feeling Held In leans the other way (`tests/interpretation.test.ts`).
 *
 * What suitability does (`GRAIN`): a side with the grain of the scene is easier to make work, and one against it harder,
 * as a share of the work's difficulty on the dimensions the side leans on; and one against it asks more rehearsal before
 * it's complete. At full capacity a difficulty asks nothing more (`systems/evaluation.ts`), so a mastered actor reaches
 * 100 on every side that fits: suitability is never a cap, and a side against the grain isn't a misfit. Misfit stays what
 * it was: a side the text forbids or the director has asked against (`misfitOf`).
 *
 * The affinities are SLATE's, each from what its signal is; the sources it rests on are the register's
 * (`content/concerns.ts`, the project's acting research) and what each signal names. No source puts a number on them.
 */

import type { AxisValue } from './material';
import type { Concern } from './concerns';

export type Affinity = Partial<Record<AxisValue, number>>;

/**
 * Each concern of a genre's register and the sides it carries or works against: what its principle asks of the playing.
 * Feeling Held In is subtext, the feeling under the lines, so restraint carries it and playing it out to the house works
 * against it; Comic Rhythm is pace and cadence, so driving the cues carries it and taking time over each thought slows
 * the joke; Caught Live is naturalism found live, so an open playing carries it and a set one fixes what should be found.
 */
export const CONCERN_AFFINITY: Readonly<Record<Concern, { affinity: Affinity; why: string }>> = {
  restraint: { affinity: { restrained: 1, measured: 0.5, expansive: -1, driven: -0.5 }, why: 'the feeling kept under the lines' },
  sincerity: { affinity: { measured: 0.5, restrained: 0.25, expansive: -0.5 }, why: 'played with complete earnestness, never winked at' },
  heightened: { affinity: { expansive: 1, set: 0.5, restrained: -1 }, why: 'feeling sized past life, shaped in the body' },
  rhythm: { affinity: { driven: 1, set: 0.5, measured: -0.5 }, why: 'the cadence and the pace that land a joke' },
  spontaneity: { affinity: { open: 1, restrained: 0.25, set: -1 }, why: 'behavior found in the moment, not fixed' },
  exactness: { affinity: { set: 1, driven: 0.5, open: -0.5 }, why: 'dense text spoken exactly and at speed' },
  period: { affinity: { measured: 0.5, set: 0.5, open: -0.25 }, why: 'another age’s manners, kept' },
  invention: { affinity: { expansive: 0.5, measured: 0.25 }, why: 'a world made real by specific belief' },
  extremity: { affinity: { expansive: 0.5, driven: 0.5, restrained: -0.5 }, why: 'states pushed to their limit' },
  partnership: { affinity: { open: 1, set: -0.5 }, why: 'played off the other person, not to the camera' },
  tension: { affinity: { measured: 1, restrained: 0.5, driven: -0.5 }, why: 'suspense held in silence and pace' },
  stylized: { affinity: { set: 1, expansive: 0.5, open: -0.5 }, why: 'a form with its own exact logic' },
  command: { affinity: { restrained: 0.5, measured: 0.5, open: -0.25 }, why: 'economy and presence in the frame' },
};

/** How the reader plays the other part (`Brief.readerPlays`): a pressing reader is met, a withholding one waited out, an unpredictable one taken live. */
export const READER_AFFINITY: Readonly<Record<'steady' | 'pressing' | 'withholding' | 'unpredictable', { affinity: Affinity; label: string }>> = {
  steady: { affinity: { set: 0.25 }, label: 'A Steady Reader' },
  pressing: { affinity: { driven: 0.5, open: 0.5, expansive: 0.25, measured: -0.25 }, label: 'A Pressing Reader' },
  withholding: { affinity: { measured: 0.5, restrained: 0.25, driven: -0.5 }, label: 'A Withholding Reader' },
  unpredictable: { affinity: { open: 1, set: -1 }, label: 'An Unpredictable Reader' },
};

/**
 * The medium's scale: a close frame takes less than a house does. The camera's was 0.5 each way when first set, and
 * measured against the criteria (I3) it made restrained the better side on 74% of briefs, every brief but the voice ones
 * being on camera: a rule for the medium, not a reading of the scene. Halved on 2026-10-16, before any other change.
 * The stage's was 0.5 for expansive and -0.25 for restrained until later that day, when the class scenes and the plays,
 * measured for the first time, came out expansive on every one: The Seagull and A Doll's House decided by the house's
 * size. A medium leans, a quarter each way, and doesn't decide (docs/verification/interpretation-2026-10-16/i3-review.md).
 */
export const MEDIUM_AFFINITY: Readonly<Record<'stage' | 'camera' | 'voice', { affinity: Affinity; label: string }>> = {
  camera: { affinity: { restrained: 0.25, expansive: -0.25 }, label: 'A Close Frame' },
  stage: { affinity: { expansive: 0.25, restrained: -0.25 }, label: 'A House To Reach' },
  voice: { affinity: {}, label: 'A Microphone' },
};

/** The tones it's played in, by their share of its beats: a joke wants pace, grief and a lyric beat want time, the grotesque wants size. */
export const TONE_AFFINITY: Readonly<Record<'comic' | 'grave' | 'lyric' | 'grotesque', { affinity: Affinity; label: string }>> = {
  comic: { affinity: { driven: 0.75, expansive: 0.25, measured: -0.5 }, label: 'Its Comic Beats' },
  grave: { affinity: { measured: 0.5 }, label: 'Its Grave Beats' },
  lyric: { affinity: { measured: 0.5 }, label: 'Its Lyric Beats' },
  grotesque: { affinity: { expansive: 0.75 }, label: 'Its Grotesque Beats' },
};

/**
 * A take with no one to play off (partner 0): the lens is the partner, and presence carries it, which is what playing it
 * out draws on (`DEMAND_EFFECT.solo` reads presence for the same reason).
 */
export const SOLO_AFFINITY: Affinity = { expansive: 0.25 };

/** Each change of tone, up to three: a turn wants its time, so it's earned and not skipped. */
export const TURN_AFFINITY: Affinity = { measured: 0.15 };

/** What its features ask, per level: a timed scene wants its pace and its beats placed; improvisation wants it open; a voice at full stretch wants size. */
export const FEATURE_AFFINITY: Readonly<Record<'timing' | 'improvisation' | 'physical' | 'partner' | 'vocal', { affinity: Affinity; label: string; from?: number }>> = {
  timing: { affinity: { driven: 0.25, set: 0.25 }, label: 'Its Timing' },
  improvisation: { affinity: { open: 0.5, set: -0.5 }, label: 'What It Leaves To Be Found' },
  physical: { affinity: { set: 0.25 }, label: 'Its Physical Score', from: 2 },
  partner: { affinity: { open: 0.5 }, label: 'Its Partner', from: 3 },
  vocal: { affinity: { expansive: 0.25 }, label: 'Its Voice Work', from: 2 },
};

/** The language: heightened text wants to be sized to, verse placed and given its time. */
export const LANGUAGE_AFFINITY: Readonly<Record<'heightened' | 'verse', { affinity: Affinity; label: string }>> = {
  heightened: { affinity: { expansive: 0.5 }, label: 'Its Heightened Language' },
  verse: { affinity: { set: 0.5, measured: 0.5 }, label: 'Its Verse' },
};

/**
 * What suitability does. `strength`: the share of difficulty a side's suitability moves on each dimension it leans on (a
 * side fully with the grain, -0.3; fully against it, +0.3), scaled by what rides on it (`stakesStep` a level from 1).
 * `prep`: how much less, or more, of the choice's rehearsal completes it (`PLAYING.complete` 0.9, so 0.8 to 1).
 * `reading`: the most a reading's own lean adds for a side that leans the same way, or takes for one that leans away.
 * `band`: where a side counts as suiting the scene or going against its grain. `concern`: what a register's affinity
 * counts for beside the scene's own signals. At 1, as first set, a genre's two scenes disagreed on the scale axis in 10% of
 * genres (criterion I2 asks 20%): the register outweighed everything the scene itself said, a genre rule by another name. Chosen against the criteria written
 * before (docs/verification/interpretation-2026-10-16/criteria.md).
 */
export const GRAIN = { strength: 0.3, stakesStep: 0.15, prep: 0.1, reading: 0.5, band: 0.25, floor: 0.25, concern: 0.5, reader: 1 } as const;

export type GrainBand = 'suits' | 'either' | 'against';
export const GRAIN_LABEL: Readonly<Record<GrainBand, string>> = { suits: 'Suits The Scene', either: 'Either Way', against: 'Against The Grain' };
