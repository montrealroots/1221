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

/**
 * Restrained draws on composure and focus as well as emotional depth (from 2026-10-16, the integration pass): the feeling
 * held under the surface is the feeling and the control that holds it. Stanislavski's "Internal and External Control and
 * the Finishing Touches" (An Actor's Work, tr. Benedetti, 2008, pp. 536-542) puts excess down to "nerves, embarrassment,
 * stagefright… lost self-control", has the actor "gain the necessary control" over what was felt before telling it, and
 * makes inner control the inner line kept clear through the pauses, "in each inner Bit"; "the more control and finish
 * acting has, the calmer the actor is, the more clearly the shape and form of the character comes across and the more it
 * affects the audience". So the calm (composure) goes on believability, where what was felt is read, and the line held
 * (focus) on consistency, the dimension restraint leans second; each where the task doesn't read it already, since a
 * draw at the share a dimension already gives it would change nothing (a first placing of both on consistency, which
 * reads composure at half, made a restrained take reward composure no more than an expansive one, and was caught by
 * tests/integration-stage.test.ts). The sizes are SLATE's, half each, so restraint draws as much in all as expansive
 * does. Until then it drew emotional depth alone, where the stage criteria (ST6) named its specialist strong
 * "in what restrained draws on (emotional depth, then composure and focus)". It moved ST6 by nothing: what holds a
 * restrained specialist back against a scene built on size is the grain itself (docs/verification/integration-2026-10-16/st6.md).
 */
export const APPROACH_EFFECT: Readonly<Record<AxisValue, ApproachEffect>> = {
  measured: { label: 'Measured', words: 'Taking the time each thought needs: the choices specific, the pauses earned.', lean: { interpretation: 1.2, believability: 1.1 }, inputs: { interpretation: [{ ability: 'focus', weight: 1 }] } },
  driven: { label: 'Driven', words: 'Picking up cues and pressing on: the scene played at the speed of what the characters want.', lean: { responsiveness: 1.2, execution: 1.1 }, inputs: { responsiveness: [{ ability: 'adaptability', weight: 1 }], consistency: [{ ability: 'stamina', weight: 0.5 }] } },
  restrained: { label: 'Restrained', words: 'Less shown than felt: the feeling held under the surface.', lean: { believability: 1.25, consistency: 1.05 }, inputs: { believability: [{ ability: 'emotionalDepth', weight: 1 }, { ability: 'composure', weight: 0.5 }], consistency: [{ ability: 'focus', weight: 0.5 }] } },
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
 *
 * The body's and the voice's raised again on 2026-10-12 (physical 1.2 to 1.8 an ability a level and its lean 0.2 to
 * 0.25; vocal 1.2 to 2 and 0.16 to 0.25), against a stated measure: on material built on a demand, at level 3, the
 * ability it names should carry at least as much of the work as the most-read ability of the task's own profile does
 * (emotional depth, about a sixth of a take). Measured before (tools/specialists.ts and the shares it reads), physical
 * carried 13.8% of a brief built on physical work against emotional depth's 17%, and vocal 12% of one built on the
 * voice against 17.8%, so a specialist in either came out about even with an even actor on their own material. The
 * feeling actor's lead on most briefs stands: every take is built on feeling, and that's the material, not a bias.
 * The sentence above, "that actor is ahead on the briefs built on feeling and behind on those built on timing, a
 * partner or the body", was never what the catalog measured: ahead on 145 of 149 then.
 *
 * Until 2026-10-16 the body and the voice also asked stamina of consistency (physical 0.8 a level, vocal 0.6). Every
 * piece judged in segments takes stamina out of its inputs and reads it as the drain, whose load the same two levels
 * set (`loadOf`, `systems/piece.ts`); and from that day every performed piece with material is judged in segments
 * (`scenePiece`, `systems/coursework.ts`), so nothing read them. They went, and stamina is read once, through the load.
 *
 * Moved on 2026-10-16 with the task profiles (`BASE_INPUTS`, `content/tasks.ts`), against the criteria written before
 * (docs/verification/attributes-genres-2026-10-16/acceptance-criteria.md, H2 and H4): a partner's listening 1 to 0.35
 * a level and timing's 1 to 0.3, since every class scene is built on a partner at 2 or 3 and listening came out best on
 * all 56; timing's focus 1 to 1.5, the body's 1.8 to 2.5 with discipline 0.5 (a fight or a dance is a set score, kept
 * "the same way every time", the stage-combat rule), the voice's 2 to 2.75, and both leans 0.25 to 0.3, since their
 * specialists had fallen behind the even actor on their own material once the profiles' other weights thinned.
 */
export const FEATURE_EFFECT: Readonly<Record<Feature, { lean: Partial<Record<Dimension, number>>; inputs: Partial<Record<Dimension, readonly { ability: AbilityId; weight: number }[]>> }>> = {
  timing: { lean: { responsiveness: 0.2, execution: 0.16 }, inputs: { responsiveness: [{ ability: 'listening', weight: 0.3 }], execution: [{ ability: 'focus', weight: 1.5 }] } },
  physical: { lean: { execution: 0.3 }, inputs: { execution: [{ ability: 'physical', weight: 2.5 }, { ability: 'discipline', weight: 0.5 }] } },
  partner: { lean: { connection: 0.2, responsiveness: 0.1 }, inputs: { connection: [{ ability: 'listening', weight: 0.35 }] } },
  vocal: { lean: { execution: 0.3 }, inputs: { execution: [{ ability: 'vocal', weight: 2.75 }] } },
  improvisation: { lean: { responsiveness: 0.2 }, inputs: { responsiveness: [{ ability: 'adaptability', weight: 1.2 }] } },
};

/** A tone change or an emotional turn, each: what transitions ask. Adaptability 0.3 to 0.6 a turn on 2026-10-16: the change itself is its work (Johnstone's accepting what comes). */
export const TRANSITION_EFFECT = { lean: { believability: 0.05, consistency: 0.05 }, inputs: { believability: [{ ability: 'adaptability' as AbilityId, weight: 0.6 }], consistency: [{ ability: 'composure' as AbilityId, weight: 0.2 }] } } as const;

/**
 * A beat played two ways at once, funny and frightening together, each (from 2026-10-12): holding both asks depth of
 * feeling and the imagination to find where they meet, where a change between beats asks adaptability and composure
 * (`TRANSITION_EFFECT`). SLATE's design, from what the two are; research-self-tape-briefs.json topic 2 says what the
 * acting texts support.
 */
export const BLEND_EFFECT = { lean: { believability: 0.05, interpretation: 0.05 }, inputs: { believability: [{ ability: 'emotionalDepth' as AbilityId, weight: 0.3 }], interpretation: [{ ability: 'imagination' as AbilityId, weight: 0.2 }] } } as const;

/**
 * Heightened prose and verse: what the language asks of interpretation and of the voice. From 2026-10-16 of execution's
 * focus too (heightened 1, verse 0.4), and verse of memory (3) and execution's lean: verse is spoken as written, its line
 * and its word exact (Berry, The Actor and the Text, 1987), where until then it asked nothing of either.
 */
export const LANGUAGE_EFFECT = {
  heightened: { lean: { interpretation: 1.15 }, inputs: { interpretation: [{ ability: 'imagination' as AbilityId, weight: 0.5 }], execution: [{ ability: 'focus' as AbilityId, weight: 1 }] } },
  verse: { lean: { interpretation: 1.25, execution: 1.15 }, inputs: { interpretation: [{ ability: 'imagination' as AbilityId, weight: 0.8 }], execution: [{ ability: 'vocal' as AbilityId, weight: 0.4 }, { ability: 'memory' as AbilityId, weight: 3 }, { ability: 'focus' as AbilityId, weight: 0.4 }] } },
} as const;

/**
 * What a piece demands of the abilities a task's own profile reads only a little of (from 2026-10-16, phase 2b of the
 * attributes brief): each entry leans the dimensions it names by `1 + lean × units` and adds its abilities to their
 * inputs at `weight × units`, for the units of it the piece has (`demandsOf`, `systems/material.ts`), as a feature's
 * level does. Until then presence, memory, composure, focus and discipline each read the same small share of every
 * piece, and emotional depth and listening a large one, so the actor strongest in feeling or in listening came out best
 * on 90% of the briefs and on every scene, night and casting, and the specialists in seven of the other ten were behind
 * an even actor almost everywhere (baseline.md §1 and §2). What informs each, and what is SLATE's:
 *
 * - **solo**, a unit for each level of partner under 2 (a brief alone at 0 two, a brief with a reader barely there at 1
 *   one; a scene or a play built on its partners at 2 or 3 none): with little to play off, the connection is to the
 *   lens or the house, which is presence. Rodenburg ties presence to a voice and a body fully there (research-acting-engine.json,
 *   voice pedagogy); a monologue or a direct address is where it shows most. The sizes are SLATE's.
 * - **text**, a medium brief 1 and a long one 2: more lines to hold. Noice and Noice found actors learn a role by
 *   working out its meaning, not by rote, a skill that holds more text the better it is (Noice & Noice 2006; "How Actors
 *   Remember Their Lines", MIT Press Reader). The sizes are SLATE's.
 * - **stakes**, a brief's 0 to 3 (a scene's and a play's 1): more riding on it is more pressure to hold steady through.
 *   Stage fright was a moderate or severe problem for 46% of senior drama students (Steptoe et al. 1995), predicted by
 *   low emotional stability (Goodman & Kaufman 2014), and relaxation is what lets an actor recover a line or take a
 *   change of direction in an audition (Backstage, a psychology professional on audition anxiety): composure, in
 *   consistency and a little in believability. The sizes are SLATE's.
 * - **beats**, a unit for each segment past three: a longer score of units, set in rehearsal and kept the same through
 *   every change, is discipline's (Stanislavski's units and objectives, Sawoski's summary in research-acting-engine.json).
 * - **grave**, the share of a piece's beats or tones played grave: belief in circumstances that hurt is where emotional
 *   depth decides most (Stanislavski's emotion memory and given circumstances).
 * - **invented**, the share played lyric or grotesque: a world or a register the actor has to invent is imagination's
 *   (Stanislavski on imagination and the magic if; Chekhov, To the Actor, 1953).
 * - **comic**, the share played comic: a joke lands on an exact moment, which is attention held on the beat, focus
 *   (Stanislavski's tempo-rhythm and concentration of attention; timing's own focus is `FEATURE_EFFECT`'s).
 *
 * The leans and weights are SLATE's, chosen against criteria written before (acceptance-criteria.md: A1, A3, H2, H5).
 * Leans are normalized, and inputs share a dimension's weight, so no entry adds weight to the whole. At full abilities
 * every term is 1, so the guarantee is unchanged.
 */
export const DEMAND_EFFECT: Readonly<Record<'solo' | 'text' | 'stakes' | 'beats' | 'grave' | 'invented' | 'comic', { lean: Partial<Record<Dimension, number>>; inputs: Partial<Record<Dimension, readonly { ability: AbilityId; weight: number }[]>> }>> = {
  solo: { lean: { connection: 0.5 }, inputs: { connection: [{ ability: 'presence', weight: 2 }] } },
  text: { lean: { execution: 0.7 }, inputs: { execution: [{ ability: 'memory', weight: 5 }] } },
  stakes: { lean: { consistency: 0.6 }, inputs: { consistency: [{ ability: 'composure', weight: 1.5 }], believability: [{ ability: 'composure', weight: 0.4 }] } },
  beats: { lean: { consistency: 0.7 }, inputs: { consistency: [{ ability: 'discipline', weight: 2.5 }] } },
  grave: { lean: { believability: 0.3 }, inputs: { believability: [{ ability: 'emotionalDepth', weight: 2.5 }] } },
  invented: { lean: { interpretation: 0.3 }, inputs: { interpretation: [{ ability: 'imagination', weight: 2.5 }] } },
  comic: { lean: { execution: 0.3 }, inputs: { execution: [{ ability: 'focus', weight: 3 }] } },
};

/** The camera: what a close frame weighs most. */
export const CAMERA_LEAN: Partial<Record<Dimension, number>> = { believability: 1.2 };

/** A voice alone at a microphone (from 2026-10-12): the voice carries everything, so its execution weighs most. SLATE's design. */
export const VOICE_LEAN: Partial<Record<Dimension, number>> = { execution: 1.2 };
/**
 * A house to reach (from 2026-10-16): on stage, the voice and the body have to carry to the back row, which weighs the
 * take's execution as a microphone's demand does, whichever way it's played. Until then the stage leant nothing here and
 * read its house as a quarter's pull toward playing expansive (`MEDIUM_AFFINITY`), as if being heard were playing
 * large; projection is support and clear intention, not size (docs/verification/stage-2026-10-16/research.md).
 */
export const STAGE_LEAN: Partial<Record<Dimension, number>> = { execution: 1.2 };
