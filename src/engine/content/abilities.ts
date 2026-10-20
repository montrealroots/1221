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
  /** The line at the foot of its look, a sentence: its source in acting's pedagogy or the research, or that it's estimated.
   * Shown whole from 2026-10-17 (brief 14), so it stays under the look's one line, 220 characters (`tests/looks.test.ts`);
   * until then one of 200 or more was replaced by the path of the research file. */
  source: string;
  /** Whether it's one of the general capacities beside the acting ones. */
  general?: boolean;
}

export const ABILITY_DEFS: readonly AbilityDef[] = [
  {
    id: 'emotionalDepth', label: 'Emotional Depth',
    definition: 'Finding real feeling in imaginary circumstances, and letting it show truthfully.',
    develops: 'Acting I and the other classes that train it, nights on stage, and the Sense Memory exercise.',
    // Until 2026-10-16 this said believability in a scene, a song, a self-tape, an audition and a night on stage, and left out
    // the improvisation, the clown turn and the partnered physical work that read it too (attributes-matrix.md).
    // From 2026-10-16 more where a piece is played grave (`DEMAND_EFFECT`); until then the same share of every piece.
    affects: 'How believable you are in everything you perform: a scene, a song, an improvisation, a clown turn, a self-tape, a taped brief, an audition and a night on stage. It matters most when the material is grave. It also shapes your connection with a partner in a fight or an intimacy scene.',
    derivedFrom: 'It was set with your techniques when the school admitted you. Older saves called it Emotional Access.',
    source: 'Source: Stanislavski, An Actor Prepares (1936), on emotion memory and the given circumstances.',
  },
  {
    id: 'presence', label: 'Presence',
    definition: 'The pull of being fully there, which an audience or a camera sees beyond your technique.',
    develops: 'Every night in front of an audience, a little at a time, and more on a remarkable night. The exercise A Showing For Classmates builds it too, and part of what Graded Exposure and Clown Practice build carries over to it.',
    // Until 2026-10-16 this left out a scene and a taped brief, which read it too; from then more the less a piece has a
    // partner to play off, and more in front of a house (`DEMAND_EFFECT`, the night's profile). Until 2026-10-17 it said
    // "most in front of a house": a clown turn's +10 moves its whole 1.6 on the mean and an improvisation's 1.0, against a
    // night's 0.65, a scene's 0.47, an audition's 0.38 and a taped brief's 0.29 (brief 11, A4,
    // tests/attributes-phase-2b.test.ts).
    affects: 'Your connection on stage and in an audition, a clown turn, a scene and a taped brief. It matters more the less of a partner you have to play off, and more on a night in front of an audience than in a scene, an audition or a taped brief.',
    derivedFrom: 'It was set when your life began, somewhere from 55 to 80 and most often near the middle, as it is for every student the school admits.',
    source: 'How it starts and how it grows are estimated.',
  },
  {
    id: 'listening', label: 'Listening And Responsiveness',
    definition: 'Taking in your partner and answering what they actually do, not what you planned.',
    // Until 2026-10-16 this left out a night in front of a house, which grows it every night (`systems/school.ts`).
    develops: 'Rehearsing with a partner, classes that train Scene Study or Improvisation, every night in front of an audience, improvisation games in class and in An Improv Session, and The Repetition Exercise.',
    // From 2026-10-16 it also speeds an evening with a partner or a reader and a brief rehearsed against its reader
    // (`stepSpeed`); until then this said partnered work read it, and only the judged work did.
    affects: 'How responsive and connected you are in a fight or an intimacy scene with a partner, and on stage. It matters more the more a piece depends on your partner and on timing. It also sets how much you get done in an evening rehearsing with a partner or a reader, and when you rehearse a brief on its feet with its reader.',
    derivedFrom: 'It started at the average of your Scene Study and Improvisation.',
    source: 'Source: Meisner & Longwell, Sanford Meisner on Acting (1987), on the repetition exercise.',
  },
  {
    id: 'imagination', label: 'Imagination',
    definition: 'Inventing a character’s world and the specific choices that make the text live.',
    // Until 2026-10-16 this said a revision of coursework grew it, which grows adaptability (`PREP_ABILITY`), and that it
    // made a part's interpretation faster to prepare, which nothing read. From 2026-10-16 it speeds the table work and a
    // brief's breakdown (`STEP_SPEED`).
    develops: 'Table work on your coursework, breaking down a brief, classes that train Character Work or Script Analysis, reading plays, and The Given Circumstances exercise.',
    // From 2026-10-16 believability reads a little of it too (the magic if), and interpretation more where the language,
    // a beat held two ways or a lyric or grotesque tone asks invention (`DEMAND_EFFECT`).
    affects: 'Your interpretation in every kind of work that asks for one. It matters more where the language is heightened or verse, where a beat plays two tones at once, or where the piece is lyric or grotesque. It adds a little to your believability, and sets how much you get done in a session of table work or of breaking down a brief.',
    derivedFrom: 'It started at the average of your Character Work and Script Analysis.',
    source: 'Sources: Stanislavski, An Actor Prepares (1936), on imagination and the magic if; Chekhov, To the Actor (1953).',
  },
  {
    id: 'focus', label: 'Focus',
    definition: 'Keeping your attention where the work needs it, whatever’s distracting you.',
    develops: 'Getting to know your coursework’s material, more when you’re well rested, and the Circles Of Attention exercise.',
    // Until 2026-10-16 this said how far a step of preparation goes, which read the day's focus (readiness at the hour,
    // `focusAt`) and never this ability. From 2026-10-16 it speeds getting to know coursework's material (`STEP_SPEED`).
    // From 2026-10-16 execution reads it more in comedy and in heightened or verse language (`DEMAND_EFFECT`); and from the
    // integration pass of that day consistency reads it in any piece played Restrained, the inner line held (`APPROACH_EFFECT`).
    affects: 'How much you get done in a session getting to know your coursework’s material. In written work it counts toward your interpretation and execution, and in voice work, a self-tape and a taped brief toward your execution, more where the material depends on timing, is comic, or is in heightened or verse language. It keeps you consistent in any piece you play Restrained, holding the inner line through it, and in movement work and in a fight or an intimacy scene with a partner. Focus on the day is something else: it’s your readiness at that hour, and this ability doesn’t change it.',
    derivedFrom: 'It started at the average of your Script Analysis and Cold Reading.',
    source: 'Source: Stanislavski, An Actor Prepares (1936), on concentration of attention and its circles.',
  },
  {
    id: 'memory', label: 'Memory',
    definition: 'Learning lines and blocking, and keeping them under pressure.',
    develops: 'Learning lines, practicing A Recall Drill, and learning a part for a production.',
    // From 2026-10-16 it speeds every step that learns lines (`STEP_SPEED`); until then this said so, and nothing read it.
    // From 2026-10-16 execution reads it more the more text there is: a longer brief, verse, a night's whole part (`DEMAND_EFFECT`).
    // From later that day (brief 10) a night's part more the longer it's on stage (`PART_TEXT`); until then every part alike.
    // Until 2026-10-17 it said execution "wherever lines are spoken": a voice sequence's text and a speech drill's are
    // spoken, learned as lines are, and voice work's execution reads no memory (brief 11, A4).
    affects: 'How much you get done in a session learning lines, for a scene, a brief or a part. It also counts toward your execution wherever you speak a part’s lines: a scene, a self-tape, a taped brief, an audition, a night on stage. It matters more the longer the text, so a medium or long brief, verse and a whole part on a night ask more of it, and a part asks more of it the longer you’re on stage.',
    derivedFrom: 'It was set with your techniques when the school admitted you. Older saves called it Memorization.',
    source: 'Sources: Noice & Noice (2006) on how actors learn a role by its meaning; Roediger & Karpicke (2006) on learning by recalling.',
  },
  {
    id: 'adaptability', label: 'Adaptability',
    definition: 'Taking direction and changing a choice quickly without losing the work.',
    develops: 'Revising your work after a teacher’s note, working on a director’s note, and improvisation, in its classes and in An Improv Session.',
    // Until 2026-10-16 this said how fully a note is taken in a revision, which read no ability. From 2026-10-16 it speeds
    // a step of revision (`STEP_SPEED`), and a revision worked far enough takes the note (`noteTaken`).
    // From 2026-10-16 a director's note on the blocking worked into a part reads it too (`stepSpeed`, `school.work_note`).
    affects: 'Your responsiveness in every kind of work judged on it. It keeps you believable through a change of tone, and helps you recover from a slip and cover a partner’s. It sets how much you get done in a session revising after a note, so you take the note sooner, and how much you get done working a director’s note on the blocking into your part.',
    derivedFrom: 'It started at your Improvisation level.',
    source: 'Source: Johnstone, Impro (1979), on accepting offers.',
  },
  {
    id: 'composure', label: 'Composure',
    definition: 'Keeping your nerves steady under the pressure of an audience, an audition or a camera.',
    develops: 'A little with every night in front of an audience and every solo showing, as performance anxiety falls with exposure. The Graded Exposure exercise builds it, and part of what Circles Of Attention and A Showing For Classmates build carries over to it.',
    // From 2026-10-16 more the more rides on a piece, and believability a little where it does (`DEMAND_EFFECT`); and from
    // the integration pass of that day believability in any piece played Restrained, the calm that lets a held feeling read
    // (`APPROACH_EFFECT`). From later that day (brief 10) a night before a house rides on more than a class scene
    // (`NIGHT_STAKES`); until then a night read the same stakes as a scene, and only its own profile's composure.
    // Until 2026-10-17 it said "on a night in front of a house, more than in class": a self-tape and an audition shown in
    // class move with +10 of it 0.95 and 0.93 on the mean, a night 0.69 and a scene shown in class 0.53 (brief 11, A4).
    affects: 'Your consistency under pressure. It matters more the more is riding on a piece (a brief’s stakes), and more on a night in front of an audience than in a scene shown in class. When the stakes are high it adds a little to your believability. In any piece you play Restrained it adds to your believability too, since calm lets a held-back feeling come through. It helps you recover from a slip, and sets how much stress your nerves add before a performance.',
    derivedFrom: 'It started from your Emotional Stability: from 25 to 60, higher the steadier you are.',
    source: 'How it starts and how it grows are estimated. That performance anxiety falls with exposure is from Reeves et al. (2022).',
  },
  {
    id: 'vocal', label: 'Vocal Expression',
    definition: 'A free, supported voice that carries the thought and the feeling of the text.',
    develops: 'Classes that train the voice, practicing voice sequences, songs, and the Voice Work exercise.',
    affects: 'Your execution in voice work, songs, classical text and on stage.',
    derivedFrom: 'It was set with your techniques when the school admitted you. Older saves called it Voice.',
    source: 'Sources: Linklater, Freeing the Natural Voice (1976); Berry, Voice and the Actor (1973).',
  },
  {
    id: 'physical', label: 'Physical Expression',
    definition: 'A body that’s free, specific and readable on stage.',
    develops: 'Classes that train movement, such as The Body As Source and Alexander Technique, rehearsing movement scores, fights, and the Movement Work exercise.',
    affects: 'Your execution in movement work, fights, intimacy work and on stage.',
    derivedFrom: 'It was set with your techniques when the school admitted you. Older saves called it Movement.',
    source: 'Sources: Laban, The Mastery of Movement on the Stage (1950); Lecoq, The Moving Body (2000).',
  },
  {
    id: 'discipline', label: 'Discipline', general: true,
    definition: 'Keeping up the daily work, and practicing when it’s due, not only when it’s easy.',
    // Until 2026-10-16 this said work prepared before it's due grew it, which grew nothing, and consistency in every task,
    // which the audition, the improvisation, the clown turn and written work don't read it for (attributes-matrix.md).
    // From 2026-10-16 every growth reads it, not deliberate practice alone (`grown` in `systems/attributes.ts`).
    develops: 'Practice kept up day after day, and turning up to every call.',
    // From 2026-10-16 consistency reads it more the more beats a piece holds and across a night's run, and execution in
    // physical work set to a score (`DEMAND_EFFECT`, `FEATURE_EFFECT`).
    // Until 2026-10-17 it said consistency in every task "but the audition, where nerves are what's held": an audition is
    // shown on a scene, and from evaluation-10 a scene of more than three units reads discipline as a brief's beats do, so
    // an audition on The Seagull's fourth act read it and one on A Doll's House's third didn't (brief 11, A4).
    affects: 'How much you gain from classes, nights on stage, preparation and practice: a tenth more with discipline at 100 and a tenth less at 0 (but not the fitness a workout builds). It keeps your work consistent wherever consistency is judged, more the more beats a piece has and on a night of a run. In an audition it counts only when the scene has many beats, since there your nerves are what’s tested. It also counts toward your execution in physical work set to a score, and in written work.',
    derivedFrom: 'It started from the Conscientiousness you set when you made your character: self-discipline is part of it.',
    source: 'Source: Costa & McCrae, NEO PI-R Professional Manual (1992), where self-discipline is a facet of conscientiousness.',
  },
  {
    id: 'stamina', label: 'Stamina', general: true,
    definition: 'Lasting through long days, a run of nights and physical work without your work falling off.',
    develops: 'Workouts, and more on a run when the weather’s fine. It holds for three days after each one, then slowly falls, as fitness does.',
    // Until 2026-10-16 this said consistency in movement, fights, songs and every night on stage; a night reads it as the
    // drain through the piece, never as consistency (`systems/piece.ts`). From 2026-10-16 a night's and a long brief's load
    // rose to their length (`PIECE.load`). Later that day (brief 10) a night's is its workload, the running time, the part's
    // share of it and the body's and the voice's work (`systems/workload.ts`), and it spares the energy a night costs after,
    // which until then was 10 whatever the stamina; this said a whole night, any part, was the heaviest until then.
    affects: 'How well you hold up through the later moments of a piece judged moment by moment (a scene, a brief, a night on stage), more the longer the piece and the more physical and vocal work it asks. On a night, how much it’s asked depends on the workload: the production’s running time, your part’s share of it and how intense it is, with less strain just after an interval. At full stamina it spares up to half the energy a night costs you afterward. In work shown whole, without a scene (voice work, a song, movement, a fight), it keeps you consistent.',
    derivedFrom: 'It’s your fitness, so it started where your fitness was. Full is the fittest a body your age can be.',
    source: 'Sources: Hickson et al. (1981), where half the gain in aerobic fitness came in 10.3 to 10.8 days and it leveled off by three weeks; Hickson & Rosenkoetter (1981) on keeping it; Mujika & Padilla (2000) on losing it.',
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

/**
 * How far a step of preparation goes by the ability it's practice in (from 2026-10-16): learning lines by memory,
 * table work and a brief's breakdown by imagination, getting to know coursework's material by focus, a revision after a
 * note by adaptability (`stepSpeed` in `systems/attributes.ts`). At 0 the step goes `least` as far, at full `most`, and
 * at 50 exactly as far as before, so an even actor prepares as fast as every actor did until then. Until 2026-10-16 the
 * descriptions of memory, imagination, focus and adaptability each said this of their step, and no step read any of
 * them (docs/verification/attributes-genres-2026-10-16/attributes-matrix.md). Noice & Noice (2006) found actors'
 * learning of a role is elaborative, deeper processing, not rote, which is a skill that grows; how much faster, here,
 * is SLATE's estimate.
 */
export const STEP_SPEED = { least: 0.85, most: 1.15 } as const;
