/**
 * SLATE — the actor's twelve abilities and seventeen techniques, what each
 * is, what develops it and what it does (from the connected attributes of
 * 2026-10-09). The research behind each is in
 * `docs/research/attributes/research-acting-engine.json`, and each source is
 * named where it's read here.
 *
 * An ability is a capacity that bears on many tasks (`systems/attributes.ts`
 * keeps each in one place); a technique is a learned method for one kind of
 * work, kept in the craft. A technique counts as mastered at `MASTERED`.
 */

import { SKILLS, type Skill } from './school';

export type AbilityId =
  | 'emotionalDepth' | 'presence' | 'listening' | 'imagination' | 'focus' | 'memory'
  | 'adaptability' | 'composure' | 'vocal' | 'physical' | 'discipline' | 'stamina';

export interface AbilityDef {
  id: AbilityId;
  label: string;
  /** What it is, in a sentence. */
  definition: string;
  /** What develops it, in the game's own activities. */
  develops: string;
  /** What it does: the dimensions and the systems that read it. */
  affects: string;
  /** For a life from before it, and a new life's start: how its first value is drawn from what's already true. */
  derivedFrom: string;
  /** Acting's own grounding for it: the pedagogy or the research. */
  source: string;
  /** Whether it's one of the general capacities beside the acting ones. */
  general?: boolean;
}

export const ABILITY_DEFS: readonly AbilityDef[] = [
  {
    id: 'emotionalDepth', label: 'Emotional Depth',
    definition: 'Reaching real feeling under imaginary circumstances, and letting it show truthfully.',
    develops: 'Scene study and its classes, performing, and the sense-memory exercise.',
    affects: 'Believability in a scene, a song, a self-tape, an audition and a night on stage.',
    derivedFrom: 'The craft’s Emotional Access, which it is.',
    source: 'Stanislavski, An Actor Prepares (1936), emotion memory and the given circumstances; kept in the craft as Emotional Access until 2026-10-09',
  },
  {
    id: 'presence', label: 'Presence',
    definition: 'What a house or a camera sees beyond technique: the pull of somebody fully there.',
    develops: 'Nights in front of a house, a little at a time, and more on a remarkable night.',
    affects: 'Connection in performance, an audition and a clown turn.',
    derivedFrom: 'Drawn once at the start, 55 to 80 for a student the faculty chose.',
    source: 'Kept since 2026-09-27 (`systems/attributes.ts`)',
  },
  {
    id: 'listening', label: 'Listening And Responsiveness',
    definition: 'Taking in a partner and answering what they actually do, not a plan.',
    develops: 'Partner rehearsals, scene study with a partner, the improvisation game, and the repetition exercise.',
    affects: 'Responsiveness and connection in partnered work and performance.',
    derivedFrom: 'For a life from before it: the mean of its Scene Study and Improvisation.',
    source: 'Meisner & Longwell, Sanford Meisner on Acting (1987), the repetition exercise',
  },
  {
    id: 'imagination', label: 'Imagination',
    definition: 'Inventing a character’s world and the specific choices that make the text live.',
    develops: 'Interpretation and revision of coursework, table work, reading plays, and the given-circumstances exercise.',
    affects: 'Interpretation in every task, and how fast a part’s interpretation is prepared.',
    derivedFrom: 'For a life from before it: the mean of its Character Work and Script Analysis.',
    source: 'Stanislavski, An Actor Prepares (1936), imagination and the magic if; Chekhov, To the Actor (1953)',
  },
  {
    id: 'focus', label: 'Focus',
    definition: 'Holding attention where the work needs it, against distraction.',
    develops: 'Attentive preparation done well-rested, and the concentration exercise.',
    affects: 'How far a step of preparation goes, and execution in text work.',
    derivedFrom: 'For a life from before it: the mean of its Script Analysis and Cold Reading.',
    source: 'Stanislavski, An Actor Prepares (1936), concentration of attention and the circles of attention',
  },
  {
    id: 'memory', label: 'Memory',
    definition: 'Learning lines and blocking and keeping them under pressure.',
    develops: 'Learning lines, the recall drill, and learning a part.',
    affects: 'How fast lines are learned, and execution wherever lines are spoken.',
    derivedFrom: 'The craft’s Memorization, which it is.',
    source: 'Noice & Noice (2006) on actors’ elaborative learning; Roediger & Karpicke (2006) on retrieval practice; kept in the craft as Memorization until 2026-10-09',
  },
  {
    id: 'adaptability', label: 'Adaptability',
    definition: 'Taking direction and changing a choice quickly without losing the work.',
    develops: 'Revising after a note, working a director’s note, and the improvisation game.',
    affects: 'Responsiveness, and how fully a note is taken in a revision.',
    derivedFrom: 'For a life from before it: its Improvisation.',
    source: 'Johnstone, Impro (1979), accepting offers',
  },
  {
    id: 'composure', label: 'Composure',
    definition: 'Holding nerves under the pressure of a house, an audition or a camera.',
    develops: 'Every performance, a little, as performance anxiety falls with exposure.',
    affects: 'Consistency under pressure, and the stress nerves add before a performance.',
    derivedFrom: 'At the start, by emotional stability: 25 to 60.',
    source: 'Kept since 2026-09-27 (`systems/attributes.ts`)',
  },
  {
    id: 'vocal', label: 'Vocal Expression',
    definition: 'A free, supported voice that carries the thought and the feeling of the text.',
    develops: 'The voice classes and sequences, songs, and the vocal exercise.',
    affects: 'Execution in voice work, songs, classical text and performance.',
    derivedFrom: 'The craft’s Voice, which it is.',
    source: 'Linklater, Freeing the Natural Voice (1976); Berry, Voice and the Actor (1973); kept in the craft as Voice until 2026-10-09',
  },
  {
    id: 'physical', label: 'Physical Expression',
    definition: 'A body that’s free, specific and readable on stage.',
    develops: 'The movement and Alexander classes, movement scores, fights, and the movement exercise.',
    affects: 'Execution in movement, fights, intimacy work and performance.',
    derivedFrom: 'The craft’s Movement, which it is.',
    source: 'Laban, The Mastery of Movement on the Stage (1950); Lecoq, The Moving Body (2000); kept in the craft as Movement until 2026-10-09',
  },
  {
    id: 'discipline', label: 'Discipline', general: true,
    definition: 'Keeping up the daily work: practice done when it’s due, not when it’s easy.',
    develops: 'Practice on days running, attending every call, and work prepared before it’s due.',
    affects: 'How much practice counts for, and consistency in every task.',
    derivedFrom: 'For a new life and one from before it: the Conscientiousness slider, of which self-discipline is a facet.',
    source: 'Costa & McCrae, NEO PI-R Professional Manual (1992), self-discipline as a facet of conscientiousness',
  },
  {
    id: 'stamina', label: 'Stamina', general: true,
    definition: 'Lasting through long days, runs of nights and physical work without the work falling off.',
    develops: 'Workouts, and more on a run in fine weather; lost without them, as fitness is.',
    affects: 'Consistency in movement, fights, songs and every night on stage.',
    derivedFrom: 'It’s the body’s fitness, kept in one place: full at the most a body that age can be brought to.',
    source: 'Hickson et al. (1981): half of the aerobic fitness gain was made in 10.3 to 10.8 days, and it levelled off by three weeks at a constant load; Mujika & Padilla (2000) on detraining',
  },
];

/**
 * The new abilities' kin among the craft: what a life from before them is drawn from (`derivedAbilities`), the
 * classes that grow them as they grow these skills, and the reach those classes level off at (`reachOf`). A class
 * in Scene Study or Improvisation is a class in listening, as Meisner's repetition is.
 */
export const ABILITY_KIN: Readonly<Partial<Record<AbilityId, readonly Skill[]>>> = {
  listening: ['scene', 'improv'],
  imagination: ['character', 'script'],
  focus: ['script', 'coldReading'],
  adaptability: ['improv'],
};

/** The craft skills that are learned techniques: every one but the four kept as abilities. */
export const TECHNIQUES: readonly Skill[] = [
  'accents', 'audition', 'character', 'classical', 'clown', 'coldReading', 'comedy', 'dance', 'improv',
  'intimacy', 'screen', 'scene', 'script', 'singing', 'speech', 'combat', 'voiceover',
];

/**
 * Every craft skill's name, from the craft's own list (`SKILLS`): the four kept as abilities under the abilities'
 * names since 2026-10-09 (Emotional Access, Memorization, Movement and Voice until then).
 */
export const TECHNIQUE_LABEL: Readonly<Record<Skill, string>> = Object.fromEntries(SKILLS.map((s) => [s.id, s.label])) as Record<Skill, string>;

/** The level at which a technique counts as mastered: what a task asks of one for its best work (`systems/evaluation.ts`). */
export const MASTERED = 90;

/**
 * How abilities and techniques grow (`develop` in `systems/attributes.ts`). SLATE's calibration, on the shape of the
 * research in `docs/research/attributes/research-acting-engine.json`, topic 2:
 * - a session's gain falls as the level rises (`exponent`): "improvement is rapid at first but decreases as the
 *   practitioner becomes more skilled" (Heathcote, Brown & Mewhort 2000, p. 185; credited to Ericsson et al. until
 *   2026-10-10, whose full text doesn't contain it). Heathcote, Brown & Mewhort (2000) found an exponential
 *   curve fits each learner better than a power law; the classes' exponent of 1.5, kept, slows late gains more than
 *   either, which is SLATE's choice for a school whose classes level off;
 * - ordinary work levels off at the student's reach, and deliberate practice goes past it (`deliberate`, `floor`):
 *   effortful practice aimed at one thing is what the best performers did more of (Ericsson et al. 1993), and it
 *   explains 21% of the variance in music and 18% in sport (Macnamara et al. 2014): real, and not the whole story;
 * - the same practice again the same day gives half what it gave before (`repeat`), and a day's practice stops
 *   counting at four hours (`PRACTICE.dailyHours`): the best sustained about four hours a day (Ericsson et al. 1993);
 * - self-discipline makes practice count for a tenth more at its top and a tenth less at its bottom
 *   (`disciplineLift`): SLATE's estimate.
 * Skill decays with long disuse (Arthur et al. 1998, topic 2); SLATE doesn't take it away for resting, by the owner's
 * brief of 2026-10-09. The pace, measured (`tests/development.test.ts`): an ability from 55 to 100 in about 380 hours
 * of deliberate practice at full focus, a technique from 78 to its mastery at 90 in about 115. Ericsson et al.'s best
 * violinists had 7,410 hours by eighteen; an actor here masters a scene's twelve abilities and its techniques in
 * roughly 4,500, about four years at three hours a day.
 */
export const DEVELOPMENT = {
  /** A session's gain at nothing learned, by weight and focus: the classes' own (`ESTIMATE.sessionGain`). */
  sessionGain: 0.42,
  exponent: 1.5,
  /** Deliberate practice's rate past the reach, a share of an ordinary session's, and the least of what's left it keeps. */
  deliberate: 1,
  floor: 0.25,
  /** Each repeat of the same practice the same day keeps this share of the one before. */
  repeat: 0.5,
  /** At discipline 100 practice counts this much more, at 0 this much less. */
  disciplineLift: 0.1,
  /** How many changes the history keeps. */
  historyKept: 400,
} as const;
