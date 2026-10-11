/**
 * SLATE — how a piece is played, the player's choice (from 2026-10-10; `systems/material.ts`).
 *
 * Three axes, each a choice between two legitimate ways, or left open: the pace (measured or driven), the scale
 * (restrained or expansive) and the structure (set, fixed and repeatable, or open, live to the partner each time).
 * They're the choices acting teachers name when they talk about how a scene is played, chosen here because the
 * engine can evaluate each coherently: each says which quality dimensions it puts weight on and which abilities it
 * draws on to do it. Neither side of an axis is better: at full ability every choice reaches 100 (the guarantee,
 * `systems/evaluation.ts`); below it, a choice that leans on what an actor does well shows them better, which is a
 * real choice with a visible reason, never a hidden right answer.
 *
 * What a choice asks before it can be shown:
 * - preparation: it's rehearsed in (`Playing.prep`), by work on its feet after it's chosen; a change of mind halves
 *   what was worked;
 * - fit: where a material forbids a side (`MaterialProfile.allows`: a farce that escalates can't be played measured)
 *   or a director asks for one (a production's `direction`), the other side doesn't fit, and the dimensions it leans
 *   on are held to `MISFIT` of what they'd be. It's said before the choice, never after.
 *
 * The effects are SLATE's design, explained on the screen; no source puts a number on them.
 */

import type { AbilityId } from './abilities';
import type { Axis, AxisValue, Feature } from './material';
import type { Dimension } from './tasks';

export type Inputs = Partial<Record<Dimension, readonly { ability: AbilityId; weight: number }[]>>;

export const AXES: Readonly<Record<Axis, { label: string; values: readonly [AxisValue, AxisValue] }>> = {
  pace: { label: 'Pace', values: ['measured', 'driven'] },
  scale: { label: 'Scale', values: ['restrained', 'expansive'] },
  structure: { label: 'Structure', values: ['set', 'open'] },
};

export interface ApproachEffect {
  label: string;
  /** What it is, in a sentence. */
  words: string;
  /** How it leans the dimensions' weights (normalized: a lean moves weight, never adds it). */
  lean: Partial<Record<Dimension, number>>;
  /** The abilities it draws on, by dimension. */
  inputs: Inputs;
}

export const APPROACH_EFFECT: Readonly<Record<AxisValue, ApproachEffect>> = {
  measured: { label: 'Measured', words: 'Taking the time each thought needs: the choices specific, the pauses earned.', lean: { interpretation: 1.2, believability: 1.1 }, inputs: { interpretation: [{ ability: 'focus', weight: 1 }] } },
  driven: { label: 'Driven', words: 'Picking up cues and pressing on: the scene played at the speed of what the characters want.', lean: { responsiveness: 1.2, execution: 1.1 }, inputs: { responsiveness: [{ ability: 'adaptability', weight: 1 }], consistency: [{ ability: 'stamina', weight: 0.5 }] } },
  restrained: { label: 'Restrained', words: 'Less shown than felt: the feeling held under the surface.', lean: { believability: 1.25, consistency: 1.05 }, inputs: { believability: [{ ability: 'emotionalDepth', weight: 1 }] } },
  expansive: { label: 'Expansive', words: 'Sized to the room: voice, body and feeling played out to the house.', lean: { connection: 1.25, execution: 1.05 }, inputs: { connection: [{ ability: 'presence', weight: 1 }], execution: [{ ability: 'vocal', weight: 0.5 }, { ability: 'physical', weight: 0.5 }] } },
  set: { label: 'Set', words: 'Fixed and repeatable: every beat placed, the same each time.', lean: { consistency: 1.25, execution: 1.05 }, inputs: { consistency: [{ ability: 'discipline', weight: 1 }], execution: [{ ability: 'memory', weight: 0.5 }] } },
  open: { label: 'Open', words: 'Live each time: taking the next moment from what the partner gives.', lean: { responsiveness: 1.25, connection: 1.05 }, inputs: { responsiveness: [{ ability: 'listening', weight: 1 }] } },
};

/** What a dimension a misfitting choice leans on keeps of itself: SLATE's estimate, shown before the choice. */
export const MISFIT = 0.85;

/** How complete a choice's rehearsal must be to count, and how much of it a change of mind keeps. */
export const PLAYING = { complete: 0.9, keptOnChange: 0.5, gainShare: 0.9 } as const;

/**
 * What each material feature does at each level (`MaterialProfile`): the dimensions it leans, per level, and the
 * abilities it asks, per level. Applied only to the dimensions a task has. SLATE's design, from what each feature is.
 *
 * Doubled on 2026-10-12, both the lean and the abilities. Until then a feature at 3, the material built on it, made the
 * ability it asks about a fifth of one dimension, and measured across the 149 practice briefs it hardly decided who
 * showed best: an actor strong in the feeling abilities every take reads came out ahead of an even actor of the same
 * budget on 139 of them, whatever each was built on (docs/verification/BRIEF-BALANCE.md). Doubled, what a scene is built
 * on decides more of it: that actor is ahead on the briefs built on feeling and behind on those built on timing, a
 * partner or the body. Normalized as before, and every ability still reaches 100 at full.
 */
export const FEATURE_EFFECT: Readonly<Record<Feature, { lean: Partial<Record<Dimension, number>>; inputs: Partial<Record<Dimension, readonly { ability: AbilityId; weight: number }[]>> }>> = {
  timing: { lean: { responsiveness: 0.2, execution: 0.16 }, inputs: { responsiveness: [{ ability: 'listening', weight: 1 }], execution: [{ ability: 'focus', weight: 1 }] } },
  physical: { lean: { execution: 0.2 }, inputs: { execution: [{ ability: 'physical', weight: 1.2 }], consistency: [{ ability: 'stamina', weight: 0.8 }] } },
  partner: { lean: { connection: 0.2, responsiveness: 0.1 }, inputs: { connection: [{ ability: 'listening', weight: 1 }] } },
  vocal: { lean: { execution: 0.16 }, inputs: { execution: [{ ability: 'vocal', weight: 1.2 }], consistency: [{ ability: 'stamina', weight: 0.6 }] } },
  improvisation: { lean: { responsiveness: 0.2 }, inputs: { responsiveness: [{ ability: 'adaptability', weight: 1.2 }] } },
};

/** A tone change or an emotional turn, each: what transitions ask. */
export const TRANSITION_EFFECT = { lean: { believability: 0.05, consistency: 0.05 }, inputs: { believability: [{ ability: 'adaptability' as AbilityId, weight: 0.3 }], consistency: [{ ability: 'composure' as AbilityId, weight: 0.2 }] } } as const;

/**
 * A beat played two ways at once, funny and frightening together, each (from 2026-10-12): holding both asks depth of
 * feeling and the imagination to find where they meet, where a change between beats asks adaptability and composure
 * (`TRANSITION_EFFECT`). SLATE's design, from what the two are; research-self-tape-briefs.json topic 2 says what the
 * acting texts support.
 */
export const BLEND_EFFECT = { lean: { believability: 0.05, interpretation: 0.05 }, inputs: { believability: [{ ability: 'emotionalDepth' as AbilityId, weight: 0.3 }], interpretation: [{ ability: 'imagination' as AbilityId, weight: 0.2 }] } } as const;

/** Heightened prose and verse: what the language asks of interpretation and of the voice. */
export const LANGUAGE_EFFECT = {
  heightened: { lean: { interpretation: 1.15 }, inputs: { interpretation: [{ ability: 'imagination' as AbilityId, weight: 0.5 }] } },
  verse: { lean: { interpretation: 1.25 }, inputs: { interpretation: [{ ability: 'imagination' as AbilityId, weight: 0.8 }], execution: [{ ability: 'vocal' as AbilityId, weight: 0.4 }] } },
} as const;

/** The camera: what a close frame weighs most. */
export const CAMERA_LEAN: Partial<Record<Dimension, number>> = { believability: 1.2 };

/** A voice alone at a microphone (from 2026-10-12): the voice carries everything, so its execution weighs most. SLATE's design. */
export const VOICE_LEAN: Partial<Record<Dimension, number>> = { execution: 1.2 };
