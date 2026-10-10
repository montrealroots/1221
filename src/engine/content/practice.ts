/**
 * SLATE — deliberate practice: an hour on one ability or one technique,
 * alone or with a classmate (from the connected attributes of 2026-10-09,
 * `systems/practice.ts`).
 *
 * Each exercise is one a conservatory teaches for what it trains, named with
 * where it comes from. The research behind how practice works is in
 * `docs/research/attributes/research-acting-engine.json`, topics 1 to 3:
 *
 * - practice is deliberate when it's effortful and aimed at one thing, and
 *   it's that kind of practice that goes past where classes level off
 *   (Ericsson, Krampe & Tesch-Römer 1993; `DEVELOPMENT.deliberate`);
 * - about four hours a day of it is what the best sustain, with less from
 *   each hour past two, so a day's practice stops counting at four hours
 *   (`PRACTICE.dailyHours`), and the same exercise again the same day gives
 *   half what it gave before (`DEVELOPMENT.repeat`);
 * - recalling lines beats reading them again (Roediger & Karpicke 2006: 61%
 *   kept a week later against 40%), so the memory exercise is a recall drill.
 *
 * Presence and composure grow in front of people: a house (`nerves`, a
 * night's band) and, from 2026-10-10, a showing for classmates and graded
 * exposure; until then only a night's share moved them, which approaches
 * full and never reaches it. Stamina is the body's fitness, built by a
 * workout (`life.look_after`). Discipline grows from practice kept up day
 * after day (`PRACTICE.disciplineDay`), deliberately, so it reaches full.
 */

import type { AbilityId } from './abilities';
export type { AbilityId };
import type { Skill } from './school';

export interface Exercise {
  id: string;
  label: string;
  /** The ability or the technique it trains. */
  trains: AbilityId | Skill;
  /** What the hour is. */
  how: string;
  /** Where it comes from. */
  source: string;
  /** On your feet: refused too tired or hurt (`SPENT`, `trainingRefusal`). */
  feet?: boolean;
  /** With a classmate: refused without a class to ask. */
  partnered?: boolean;
  /** Where it comes from (from 2026-10-10): an exercise real pedagogy names, a composite of real practice, or SLATE's own. */
  kind: 'named' | 'composite' | 'slate';
}

const ex = (id: string, label: string, trains: AbilityId | Skill, how: string, source: string, extra: Partial<Exercise> = {}): Exercise => ({ id, label, trains, how, source, kind: 'composite', ...extra });

export const EXERCISES: readonly Exercise[] = [
  // The abilities practised alone or with a partner.
  ex('sense-memory', 'Sense Memory', 'emotionalDepth', 'Recreating a remembered object, place and sensation in detail until it brings real feeling with it.', 'Lee Strasberg’s sense-memory exercise, grown from Stanislavski’s emotion memory (An Actor Prepares, 1936)', { kind: 'named' }),
  ex('repetition', 'The Repetition Exercise', 'listening', 'Repetition with a classmate: a phrase about what you see in each other, repeated and changed only by what the other does.', 'Meisner & Longwell, Sanford Meisner on Acting (1987); research topic 1 (read secondhand)', { partnered: true, kind: 'named' }),
  ex('given-circumstances', 'The Given Circumstances', 'imagination', 'Writing out a character’s who, where, when and what they want, and the life before the first line.', 'Stanislavski, An Actor Prepares (1936), the given circumstances and the magic if; Hagen, Respect for Acting (1973)'),
  ex('concentration', 'Circles Of Attention', 'focus', 'Holding attention on one object, then a small circle, then the room, and back, against distraction.', 'Stanislavski, An Actor Prepares (1936), concentration of attention: the circles', { kind: 'named' }),
  ex('recall-drill', 'A Recall Drill', 'memory', 'Learning a speech by meaning and then recalling it without the page, checking, and recalling again.', 'SLATE’s own drill, applying Roediger & Karpicke (2006), the testing effect, and Noice & Noice (2006), active experiencing; research topic 3 (read directly)', { kind: 'slate' }),
  ex('adjustments', 'Adjustments', 'adaptability', 'Playing one speech under a new adjustment each time (faster, to a child, hiding it), taking each fully.', 'Meisner’s adjustments (Meisner & Longwell, 1987), as studios commonly practice them'),
  ex('voice-work', 'Voice Work', 'vocal', 'Breath, release and resonance work, then text spoken on the breath.', 'Linklater, Freeing the Natural Voice (1976); Berry, Voice and the Actor (1973)'),
  ex('movement-work', 'Movement Work', 'physical', 'Laban’s efforts: space, weight, time and flow, each pole in turn, then a character’s walk.', 'Laban, The Mastery of Movement (1950); research topic 1 (read secondhand)', { feet: true }),
  // Presence and composure in front of people (from 2026-10-10): until then only a performance's share moved them, which approaches full and never reaches it.
  ex('showing-for-classmates', 'A Showing For Classmates', 'presence', 'A prepared speech performed to a few classmates in a studio, and what they saw, heard back.', 'SLATE’s own exercise: presence grows in front of an audience, as a showing in class grows it', { partnered: true, kind: 'slate' }),
  ex('graded-exposure', 'Graded Exposure', 'composure', 'A monologue performed to an audience that grows a few people at a time, until the nerves settle.', 'Exposure reduced public-speaking anxiety in Reeves et al.’s (2022) meta-analysis of 11 studies; the graded form here is SLATE’s composite', { partnered: true }),
  // The techniques, one drill each.
  ex('dialect-drill', 'Dialect Drill', 'accents', 'With a recorded native speaker: the sound changes, the music, then a speech in it.', 'Yale’s Speech And Accents sequence (DRAM 123, 223, 323)'),
  ex('audition-pieces', 'Audition Pieces', 'audition', 'Two contrasting monologues: in, played, and out in the time an audition gives.', 'Yale’s Professional Preparation And Audition Workshop (DRAM 743b)'),
  ex('character-work', 'Character Work', 'character', 'Finding a character through the body: a psychological gesture, an imaginary center, an animal.', 'Chekhov, To the Actor (1953); animal work (research topic 9, read secondhand)'),
  ex('verse-speaking', 'Verse Speaking', 'classical', 'Scanning a verse speech, finding the line endings and the antitheses, and speaking it on the thought.', 'Berry, The Actor and His Text (1987); Yale’s Acting II: Plays Of Extended And Heightened Language (DRAM 203)'),
  ex('clown-practice', 'Clown Practice', 'clown', 'With the nose: entrances, a flop, and finding what’s funny in failing in front of people.', 'Lecoq, The Moving Body (2000), the clown; research topic 10 (read directly)', { feet: true }),
  ex('cold-reading', 'Cold Reading', 'coldReading', 'Sides never seen before, read once and played: making a choice fast and committing to it.', 'Yale’s Professional Preparation And Audition Workshop (DRAM 743b) and On-Camera Acting Technique (DRAM 463)'),
  ex('comic-timing', 'Comic Timing', 'comedy', 'A comic scene’s rhythm: the set-up, the pause, the turn, played until it lands.', 'SLATE’s own exercise; the comic’s rhythm after Bergson, Laughter (1900), which has no exercises (research topic 10)', { kind: 'slate' }),
  ex('dance-class', 'A Dance Class', 'dance', 'A dance class: barre, center and a combination.', 'A standard technique class (barre, center, combination); Yale’s plan lists no dance class for actors, so this one is SLATE’s choice of where it’s taken', { feet: true }),
  ex('improv-session', 'An Improv Session', 'improv', 'Scenes with classmates from a suggestion, saying yes to what’s offered.', 'Johnstone, Impro (1979); Spolin, Improvisation for the Theater (1963)', { partnered: true }),
  ex('intimacy-study', 'Intimacy Practice', 'intimacy', 'The tools of staged intimacy: boundaries, consent, and choreography learned as a fight is.', 'Yale’s Acting Intimacy And Combat For The Stage (DRAM 403)'),
  ex('self-tape-practice', 'Self-Tape Practice', 'screen', 'Taping a scene at home and watching it back: the frame, the eyeline, how little reads.', 'Yale’s On-Camera Acting Technique (DRAM 463)'),
  ex('scene-work', 'Scene Work', 'scene', 'Breaking a scene into beats and actions, and playing each action at the reader.', 'Stanislavski’s units and objectives; research topic 1 (read directly)'),
  ex('script-analysis', 'Script Analysis', 'script', 'A play’s structure: its events, the through-line, and what each scene is for.', 'Stanislavski’s through-line and superobjective; RADA’s textual strand (research topic 9)'),
  ex('singing-practice', 'Singing Practice', 'singing', 'Scales, then a song worked phrase by phrase for its acting as well as its notes.', 'Yale’s Singing II And Tutorials (DRAM 413) and Acting Through Song (DRAM 423)'),
  ex('speech-drill', 'Speech Drill', 'speech', 'Articulation drills, then a speech for clarity at size.', 'Yale’s Speech And Accents I (DRAM 123)'),
  ex('combat-drill', 'Combat Drill', 'combat', 'Footwork, falls and unarmed technique, slowly, then at speed.', 'Yale’s Acting Intimacy And Combat For The Stage (DRAM 403), where the unarmed work is taught', { feet: true }),
  ex('copy-reading', 'Copy Reading', 'voiceover', 'Reading commercial and narration copy into a microphone and listening back.', 'Voice-over technique; SLATE has no published curriculum for it, said so'),
];

export const EXERCISE_BY_ID: Readonly<Record<string, Exercise>> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

/**
 * Each exercise as practice on a challenge, not a stat (from 2026-10-10; `systems/practice.ts`): the material at
 * three tiers, chosen against where the actor is; the challenge it sets; what it carries over to (`transfer`); and the
 * material features it's practice in, which the experience record keeps (`systems/experience.ts`). The tiers' material
 * is the pedagogy's own progression where it has one (Berry's sonnet before the soliloquy before the shared line), and
 * SLATE's composite otherwise.
 */
export interface ExerciseDesign {
  challenge: string;
  tiers: readonly [string, string, string];
  transfer: readonly (AbilityId | Skill)[];
  practises: readonly string[];
}

export const EXERCISE_DESIGN: Readonly<Record<string, ExerciseDesign>> = {
  'sense-memory': { challenge: 'Real feeling from imagined detail, not from pushing.', tiers: ['A familiar object: a cup, its weight and warmth', 'A remembered place, all five senses, until it moves you', 'A private moment carried into a speech without showing the effort'], transfer: ['imagination'], practises: [] },
  repetition: { challenge: 'Answering what the partner actually does.', tiers: ['Mechanical repetition: the same words, heard exactly', 'Repetition changed by what you see in each other', 'Repetition with an independent activity and a knock at the door'], transfer: ['adaptability'], practises: ['partner'] },
  'given-circumstances': { challenge: 'Specific choices built from the text’s facts.', tiers: ['Who, where and when for a short scene', 'The life before the first line, and what the character wants', 'Two defensible readings of the same scene, each argued from the text'], transfer: ['script'], practises: [] },
  concentration: { challenge: 'Attention held where the work needs it.', tiers: ['One object, five minutes, nothing else', 'The small circle, then the room, against a distraction', 'Public solitude: a private task in front of watchers'], transfer: ['composure'], practises: [] },
  'recall-drill': { challenge: 'Lines kept by meaning, recalled without the page.', tiers: ['A short speech by its thoughts, recalled once', 'A scene recalled the next day, gaps found and filled', 'A long speech recalled at speed, under a partner’s interruptions'], transfer: ['focus'], practises: [] },
  adjustments: { challenge: 'A new choice taken fully, fast.', tiers: ['One speech, two adjustments: faster, quieter', 'Five adjustments called out mid-speech', 'A turn from comic to grave inside a single speech'], transfer: ['improv'], practises: ['transitions'] },
  'voice-work': { challenge: 'Breath and resonance carrying the thought.', tiers: ['Breath and release on the floor', 'Resonators and range on a short text', 'A speech sustained over sound, sized to a large room'], transfer: ['speech'], practises: ['vocal'] },
  'movement-work': { challenge: 'A specific, readable body.', tiers: ['Laban’s efforts one at a time', 'Efforts combined in a character’s walk', 'A wordless sequence that tells the scene'], transfer: ['character'], practises: ['physical'] },
  'showing-for-classmates': { challenge: 'Being watched without closing down.', tiers: ['A short speech to two classmates', 'A prepared piece to the year, then their notes', 'A piece played again after notes, changed'], transfer: ['composure'], practises: [] },
  'graded-exposure': { challenge: 'Nerves settling with exposure.', tiers: ['A monologue to one person', 'To a handful, then more', 'To a room of strangers, twice in an evening'], transfer: ['presence'], practises: [] },
  'dialect-drill': { challenge: 'A dialect’s sound changes and its music, held.', tiers: ['The sound changes on single words', 'A text in the dialect, transcribed and spoken', 'A scene in the dialect, held under emotion'], transfer: ['vocal'], practises: [] },
  'audition-pieces': { challenge: 'Two contrasting pieces, in and out, in the time an audition gives.', tiers: ['One piece, timed', 'Two contrasting pieces, back to back', 'Both again after a redirection, at once'], transfer: ['coldReading'], practises: ['transitions'] },
  'character-work': { challenge: 'A character found through the body.', tiers: ['A psychological gesture', 'An imaginary center and a walk', 'An animal study carried into a scene'], transfer: ['physical'], practises: ['physical'] },
  'verse-speaking': { challenge: 'Verse spoken on the thought, the line honored.', tiers: ['A sonnet: scansion and the line ending', 'A soliloquy: antithesis and the turn', 'Shared lines with a partner: no pause between them'], transfer: ['vocal', 'imagination'], practises: ['language:verse'] },
  'clown-practice': { challenge: 'What’s funny in failing in front of people.', tiers: ['An entrance with the nose', 'The flop, played and recovered', 'A turn built live on what the room gives back'], transfer: ['presence', 'comedy'], practises: ['physical', 'improvisation'] },
  'cold-reading': { challenge: 'A choice made fast and committed to.', tiers: ['Sides read once and played', 'Sides with a redirection', 'Sides on camera, eyeline to a reader'], transfer: ['adaptability'], practises: [] },
  'comic-timing': { challenge: 'The set-up, the pause, the turn: placed exactly.', tiers: ['A single joke’s rhythm, repeated until it lands', 'An epigram duel, line on line', 'An escalating quarrel picked up on the cue'], transfer: ['listening'], practises: ['timing'] },
  'dance-class': { challenge: 'A combination held in time and space.', tiers: ['Barre', 'Center work', 'A combination, at tempo'], transfer: ['physical'], practises: ['physical'] },
  'improv-session': { challenge: 'Accepting the offer.', tiers: ['Yes, and: a two-person scene', 'Status games', 'A long-form scene with a turn the group finds'], transfer: ['listening', 'adaptability'], practises: ['improvisation', 'partner'] },
  'intimacy-study': { challenge: 'Choreography with consent and boundaries kept.', tiers: ['Boundaries and the check-in', 'A short moment choreographed', 'The moment played in a scene at full emotion, the choreography held'], transfer: ['listening'], practises: ['partner'] },
  'self-tape-practice': { challenge: 'How little reads in a frame.', tiers: ['A wide shot, then a close one', 'Eyeline and stillness in a close-up', 'A scene taped twice, the second smaller'], transfer: ['emotionalDepth'], practises: ['medium:camera'] },
  'scene-work': { challenge: 'Beats and actions played at the partner.', tiers: ['A short scene broken into beats', 'Each beat an action played', 'The scene played with the actions changing on what the partner does'], transfer: ['listening'], practises: ['partner'] },
  'script-analysis': { challenge: 'A play’s structure and what each scene is for.', tiers: ['The events of one act', 'The through-line', 'Two scenes compared for what they turn on'], transfer: ['imagination'], practises: [] },
  'singing-practice': { challenge: 'Notes and acting together.', tiers: ['Scales and breath', 'A song phrase by phrase', 'The song acted, its turns played'], transfer: ['vocal'], practises: ['vocal'] },
  'speech-drill': { challenge: 'Clarity at size.', tiers: ['Articulation drills', 'A text for clarity', 'A text at size in a large room'], transfer: ['vocal'], practises: ['vocal'] },
  'combat-drill': { challenge: 'Technique safe at speed.', tiers: ['Footwork and falls, slowly', 'Unarmed technique, half speed', 'A sequence at speed with a partner'], transfer: ['physical'], practises: ['physical', 'partner'] },
  'copy-reading': { challenge: 'A read that sells on the microphone.', tiers: ['Narration, plainly', 'Commercial copy, three reads', 'Character voices, one after another'], transfer: ['vocal'], practises: [] },
};

/** The exercise that trains an ability or a technique, for its look's practice link. */
export const exerciseFor = (id: AbilityId | Skill): Exercise | undefined => EXERCISES.find((e) => e.trains === id);

/** SLATE's estimates, on the research's shape. */
export const PRACTICE = {
  /** An hour each. */
  minutes: 60,
  /** What a practice day counts for: past four hours, no more (Ericsson et al. 1993, research topic 2). */
  dailyHours: 4,
  /** What an hour burns at a desk and on the feet, as `exerts` reads a met value, and what it costs in energy (a class day costs 6). */
  met: { desk: 1.5, feet: 4 },
  energy: { desk: 3, feet: 8 },
  /** Discipline from a day practised, once a day, weighted as one ordinary session. */
  disciplineDay: 1,
} as const;

/**
 * The tier against where the actor is (from 2026-10-10): the challenge-point framework (Guadagnoli & Lee 2004) has the
 * best difficulty rise with skill and gives no numbers, so these are SLATE's. A tier at the actor's level counts in
 * full; one below goes easily and counts less; one above is a struggle that counts less and tires more; two away
 * counts half. The level bands are where each tier is matched.
 */
export const TIER = { bands: [45, 75], matched: 1, below: 0.75, above: 0.8, far: 0.5, aboveEnergy: 3, label: ['Foundation', 'Developing', 'Advanced'] } as const;

export type PracticeFocus = 'steady' | 'precision' | 'spaced' | 'variation' | 'live';

/**
 * How the hour is spent (from 2026-10-10), each a real kind of practice with a trade-off, none best everywhere; the
 * research gives their direction and that they're small, not their size (research-practice-material.json), so the
 * sizes are SLATE's:
 * - `steady`: the hour as it always was, at full measure;
 * - `precision`: slow, exact, the same thing until it's right: more from a rested hour, less from a tired one;
 * - `spaced`: taken a day or more after the last session of it, within a week: a little more, the spacing effect
 *   (Cepeda et al. 2006; Donovan & Radosevich 1999, d about 0.46);
 * - `variation`: the exercise played under changing conditions: less on its own target, some carried to its kin
 *   (contextual interference: better transfer, small and uncertain; Brady 2004);
 * - `live`: with a classmate, taking what they give: a little less on the target, some to listening and adaptability.
 */
export const FOCUS: Readonly<Record<PracticeFocus, { label: string; words: string }>> = {
  steady: { label: 'Steady', words: 'The exercise as it comes, for the hour.' },
  precision: { label: 'Precision', words: 'Slow and exact, until it’s right. Pays most on a rested day.' },
  spaced: { label: 'Spaced', words: 'Picked up a day or more since the last time, within the week.' },
  variation: { label: 'Variation', words: 'Under changing conditions: less on the exercise’s own target, some carried to what it’s kin to.' },
  live: { label: 'Live With A Partner', words: 'With a classmate, taking what they give: some carried to listening and adaptability.' },
};

export const FOCUS_RATE = {
  precision: { rested: 1.15, tired: 0.85, restedAt: 0.85 },
  spaced: { within: 1.1, fromDays: 1, toDays: 7 },
  variation: { primary: 0.85, transfer: 0.3 },
  live: { primary: 0.9, transfer: 0.25 },
} as const;
