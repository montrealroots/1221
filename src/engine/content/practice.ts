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
