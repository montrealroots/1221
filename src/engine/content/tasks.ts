/**
 * SLATE — what each kind of finished work asks (from the connected attributes
 * of 2026-10-09), read by `systems/evaluation.ts`.
 *
 * The six quality dimensions are those the conservatories' own assessment
 * criteria name in one wording or another (`docs/research/attributes/
 * research-acting-engine.json`, topic 1): whether it's believable, how it's
 * interpreted, the connection to a partner or a house, the execution of the
 * technique, how consistently it's held, and how it responds to what
 * happens. A task uses only those that apply to it: a written analysis has no
 * partner to connect with, a movement exercise no text to interpret.
 *
 * Each dimension names its inputs (abilities, or the work's own techniques as
 * its template or play weights them), the parts of preparation it reads, and
 * the conditions of the day that reach it. The weights are SLATE's reading of
 * what each task asks, set against Yale's plan of study for what each course
 * trains; every one is shown on the outcome's look.
 */

import type { AbilityId } from './abilities';

/**
 * The version of these rules, kept on every result so an old one is read under its own terms. Three from 2026-10-12:
 * a piece judged in segments, stamina read as a drain through it, a slip carried into the next segment, and the limits
 * ranked by what they cost the whole.
 */
export const RULESET = 'evaluation-3 (2026-10-12)';

export type Dimension = 'believability' | 'interpretation' | 'connection' | 'execution' | 'consistency' | 'responsiveness';

export const DIMENSION_LABEL: Readonly<Record<Dimension, string>> = {
  believability: 'Believability', interpretation: 'Interpretation', connection: 'Connection',
  execution: 'Execution', consistency: 'Consistency', responsiveness: 'Responsiveness',
};

export const DIMENSION_MEANS: Readonly<Record<Dimension, string>> = {
  believability: 'Whether it reads as true: real feeling under the given circumstances.',
  interpretation: 'The choices made about the text or the score, and how specific they are.',
  connection: 'What passes between you and a partner, a house or a camera.',
  execution: 'The technique of it: lines, voice, body, the form’s demands, done cleanly.',
  consistency: 'Holding it the whole way through, and under pressure.',
  responsiveness: 'Answering what actually happens, a partner’s offer or a note, not a plan.',
};

/** What can reach a dimension on the day: being tired, being ill, being hurt. */
export type ConditionKind = 'fatigue' | 'illness' | 'injury';

export type Input = { ability: AbilityId; weight: number } | { techniques: true; weight: number };

export interface DimensionSpec {
  /** Its weight in the whole. */
  weight: number;
  inputs: readonly Input[];
  /** The parts of preparation it reads. */
  prep?: readonly string[];
  conditions?: readonly ConditionKind[];
}

export interface TaskProfile {
  id: string;
  label: string;
  /** What it is, for the outcome's look. */
  what: string;
  dims: Partial<Record<Dimension, DimensionSpec>>;
  /** The names of its parts of preparation, for the explanation. */
  prepLabel?: Readonly<Record<string, string>>;
}

const a = (ability: AbilityId, weight: number): Input => ({ ability, weight });
const tech = (weight: number): Input => ({ techniques: true, weight });
const ALL: readonly ConditionKind[] = ['fatigue'];

/** Coursework's parts, by their own words (`content/coursework.ts` `PrepDim`). */
const COURSEWORK_PREP = { familiarity: 'Knowing the material', memorization: 'The lines', interpretation: 'The choices', rehearsal: 'Rehearsal', partner: 'Work with your partner', revision: 'The revision' } as const;

export const TASK_PROFILES: Readonly<Record<string, TaskProfile>> = {
  scene: {
    id: 'scene', label: 'A Scene Shown', what: 'A scene with a partner, prepared and shown in class.', prepLabel: COURSEWORK_PREP,
    dims: {
      believability: { weight: 3, inputs: [a('emotionalDepth', 3), tech(1)], prep: ['interpretation', 'memorization'], conditions: ALL },
      interpretation: { weight: 2, inputs: [a('imagination', 3), tech(1)], prep: ['interpretation', 'familiarity'] },
      connection: { weight: 2, inputs: [a('listening', 2), a('presence', 1)], prep: ['partner'], conditions: ALL },
      execution: { weight: 2, inputs: [a('memory', 2), a('vocal', 1), a('physical', 1), tech(2)], prep: ['memorization', 'rehearsal'], conditions: ['fatigue', 'illness'] },
      consistency: { weight: 1, inputs: [a('composure', 2), a('discipline', 1), a('stamina', 1)], prep: ['rehearsal'], conditions: ALL },
      responsiveness: { weight: 1, inputs: [a('listening', 2), a('adaptability', 2)], prep: ['partner', 'rehearsal'], conditions: ALL },
    },
  },
  written: {
    id: 'written', label: 'A Written Analysis', what: 'Table work or a presentation: the text analyzed, written up and given.', prepLabel: COURSEWORK_PREP,
    dims: {
      interpretation: { weight: 3, inputs: [a('imagination', 3), a('focus', 1), tech(2)], prep: ['interpretation', 'familiarity'] },
      execution: { weight: 2, inputs: [a('focus', 2), a('discipline', 1), tech(1)], prep: ['revision', 'familiarity'], conditions: ALL },
    },
  },
  voice: {
    id: 'voice', label: 'Voice Work', what: 'A voice sequence or a speech drill, shown in class.', prepLabel: COURSEWORK_PREP,
    dims: {
      execution: { weight: 3, inputs: [a('vocal', 3), a('focus', 1), tech(2)], prep: ['rehearsal', 'memorization'], conditions: ['fatigue', 'illness'] },
      consistency: { weight: 2, inputs: [a('vocal', 1), a('stamina', 1), a('discipline', 1)], prep: ['rehearsal', 'familiarity'], conditions: ['fatigue', 'illness'] },
      interpretation: { weight: 1, inputs: [a('imagination', 1), tech(1)], prep: ['interpretation'] },
    },
  },
  song: {
    id: 'song', label: 'A Song', what: 'A song sung and acted for the class.', prepLabel: COURSEWORK_PREP,
    dims: {
      execution: { weight: 3, inputs: [a('vocal', 2), tech(2)], prep: ['memorization', 'rehearsal'], conditions: ['fatigue', 'illness'] },
      believability: { weight: 2, inputs: [a('emotionalDepth', 2), tech(1)], prep: ['interpretation'], conditions: ALL },
      interpretation: { weight: 1, inputs: [a('imagination', 2)], prep: ['interpretation'] },
      consistency: { weight: 1, inputs: [a('composure', 1), a('stamina', 1), a('discipline', 1)], prep: ['rehearsal'], conditions: ['fatigue', 'illness'] },
    },
  },
  movement: {
    id: 'movement', label: 'Movement Work', what: 'A movement score or an Alexander practice, shown in class.', prepLabel: COURSEWORK_PREP,
    dims: {
      // The flu's aches and fever reach the body's work too (from 2026-10-10): played matched, a student showing a
      // movement score with the flu showed exactly what a healthy twin did.
      execution: { weight: 3, inputs: [a('physical', 3), tech(2)], prep: ['rehearsal'], conditions: ['fatigue', 'illness', 'injury'] },
      consistency: { weight: 2, inputs: [a('stamina', 2), a('discipline', 1), a('focus', 1)], prep: ['rehearsal', 'familiarity'], conditions: ['fatigue', 'illness', 'injury'] },
      interpretation: { weight: 1, inputs: [a('imagination', 2), tech(1)], prep: ['interpretation'] },
    },
  },
  partnered: {
    id: 'partnered', label: 'Partnered Physical Work', what: 'A fight or a moment of intimacy, choreographed and shown with a partner.', prepLabel: COURSEWORK_PREP,
    dims: {
      execution: { weight: 3, inputs: [a('physical', 2), tech(3)], prep: ['familiarity', 'rehearsal'], conditions: ['fatigue', 'illness', 'injury'] },
      responsiveness: { weight: 2, inputs: [a('listening', 2), a('adaptability', 1)], prep: ['partner'], conditions: ALL },
      consistency: { weight: 2, inputs: [a('discipline', 1), a('stamina', 1), a('focus', 1)], prep: ['rehearsal'], conditions: ['fatigue', 'illness', 'injury'] },
      connection: { weight: 1, inputs: [a('listening', 1), a('emotionalDepth', 1)], prep: ['partner'] },
    },
  },
  improvisation: {
    id: 'improvisation', label: 'An Improvisation', what: 'A game played through with partners, in class.', prepLabel: COURSEWORK_PREP,
    dims: {
      responsiveness: { weight: 3, inputs: [a('listening', 3), a('adaptability', 2), tech(1)], prep: ['partner'], conditions: ALL },
      interpretation: { weight: 2, inputs: [a('imagination', 3), tech(1)], prep: ['rehearsal'] },
      connection: { weight: 2, inputs: [a('listening', 1), a('presence', 1)], prep: ['partner'], conditions: ALL },
      believability: { weight: 1, inputs: [a('emotionalDepth', 2), tech(1)], conditions: ALL },
    },
  },
  clown: {
    id: 'clown', label: 'A Clown Turn', what: 'A short turn played to the class.', prepLabel: COURSEWORK_PREP,
    dims: {
      connection: { weight: 3, inputs: [a('presence', 3), a('listening', 1), tech(1)], prep: ['rehearsal'], conditions: ALL },
      responsiveness: { weight: 2, inputs: [a('adaptability', 2), a('listening', 1), tech(1)], prep: ['rehearsal'], conditions: ALL },
      execution: { weight: 2, inputs: [a('physical', 2), tech(2)], prep: ['rehearsal'], conditions: ['fatigue', 'illness', 'injury'] },
      believability: { weight: 1, inputs: [a('emotionalDepth', 1), tech(1)], prep: ['interpretation'] },
    },
  },
  camera: {
    id: 'camera', label: 'A Self-Tape', what: 'A scene recorded on camera and watched back.', prepLabel: { ...COURSEWORK_PREP, genre: 'Knowing the genre' },
    dims: {
      believability: { weight: 3, inputs: [a('emotionalDepth', 3), tech(1)], prep: ['interpretation', 'memorization'], conditions: ALL },
      interpretation: { weight: 2, inputs: [a('imagination', 2), tech(1)], prep: ['interpretation', 'genre'] },
      execution: { weight: 2, inputs: [a('memory', 2), a('focus', 1), tech(2)], prep: ['memorization', 'rehearsal'], conditions: ALL },
      consistency: { weight: 1, inputs: [a('composure', 1), a('discipline', 1)], prep: ['rehearsal'], conditions: ALL },
    },
  },
  // A practice brief taped (from 2026-10-12, `systems/briefs.ts`): the camera's four dimensions, and the two a reader
  // off camera brings: connection (what passes to the reader and the lens) and responsiveness (taking what the reader
  // gives). The self-tape's own (`camera`) has neither, since until then it had no scene and no reader.
  // The connection a take makes is to the reader and to the lens (from 2026-10-12): presence, what a camera sees, read
  // twice as the audition's connection reads it. Until then it read presence once beside listening, and presence was
  // under 3% of a take, the least of any ability on a medium built on being seen (tools/specialists.ts).
  tape: {
    id: 'tape', label: 'A Taped Brief', what: 'A practice brief prepared, played to a reader off camera or alone at a microphone, and watched back.',
    prepLabel: { ...COURSEWORK_PREP, interpretation: 'The breakdown and your reading', rehearsal: 'Rehearsal on your feet', genre: 'Knowing the genre' },
    dims: {
      believability: { weight: 3, inputs: [a('emotionalDepth', 3), tech(1)], prep: ['interpretation', 'memorization'], conditions: ALL },
      interpretation: { weight: 2, inputs: [a('imagination', 2), tech(1)], prep: ['interpretation', 'genre'] },
      connection: { weight: 1, inputs: [a('listening', 1), a('presence', 2)], prep: ['rehearsal'], conditions: ALL },
      execution: { weight: 2, inputs: [a('memory', 2), a('focus', 1), tech(2)], prep: ['memorization', 'rehearsal'], conditions: ['fatigue', 'illness'] },
      consistency: { weight: 1, inputs: [a('composure', 1), a('discipline', 1)], prep: ['rehearsal'], conditions: ALL },
      responsiveness: { weight: 1, inputs: [a('listening', 1), a('adaptability', 1)], prep: ['rehearsal'], conditions: ALL },
    },
  },
  // A brief whose scene is built on physical work (physical 2 or more: a fight, a dance, a fall), taped: the same as a
  // taped brief, and an injury reaches its execution and its consistency (from 2026-10-12). Until then the mastery
  // tool's sprained twin taped the musical's brief, a song and a dance, at 100: a camera scene of no material had never
  // been reached by an injury, and the brief inherited that.
  tapeOnFeet: {
    id: 'tapeOnFeet', label: 'A Taped Brief, On Its Feet', what: 'A practice brief built on physical work, prepared, played to a reader off camera, and watched back.',
    prepLabel: { ...COURSEWORK_PREP, interpretation: 'The breakdown and your reading', rehearsal: 'Rehearsal on your feet', genre: 'Knowing the genre' },
    dims: {
      believability: { weight: 3, inputs: [a('emotionalDepth', 3), tech(1)], prep: ['interpretation', 'memorization'], conditions: ALL },
      interpretation: { weight: 2, inputs: [a('imagination', 2), tech(1)], prep: ['interpretation', 'genre'] },
      connection: { weight: 1, inputs: [a('listening', 1), a('presence', 2)], prep: ['rehearsal'], conditions: ALL },
      execution: { weight: 2, inputs: [a('memory', 2), a('focus', 1), tech(2)], prep: ['memorization', 'rehearsal'], conditions: ['fatigue', 'illness', 'injury'] },
      consistency: { weight: 1, inputs: [a('composure', 1), a('discipline', 1)], prep: ['rehearsal'], conditions: ['fatigue', 'injury'] },
      responsiveness: { weight: 1, inputs: [a('listening', 1), a('adaptability', 1)], prep: ['rehearsal'], conditions: ALL },
    },
  },
  audition: {
    id: 'audition', label: 'An Audition', what: 'Two contrasting monologues, shown as an audition.', prepLabel: COURSEWORK_PREP,
    dims: {
      believability: { weight: 3, inputs: [a('emotionalDepth', 2), tech(1)], prep: ['interpretation', 'memorization'], conditions: ALL },
      interpretation: { weight: 2, inputs: [a('imagination', 2), tech(1)], prep: ['interpretation'] },
      execution: { weight: 2, inputs: [a('memory', 1), a('vocal', 1), a('physical', 1), tech(2)], prep: ['memorization', 'rehearsal'], conditions: ['fatigue', 'illness'] },
      connection: { weight: 1, inputs: [a('presence', 2)], prep: ['rehearsal'], conditions: ALL },
      consistency: { weight: 1, inputs: [a('composure', 2)], conditions: ALL },
    },
  },
  performance: {
    id: 'performance', label: 'A Night On Stage', what: 'A performance of a production in front of a house.',
    prepLabel: { lines: 'The lines', blocking: 'The blocking', notes: 'The director’s notes taken' },
    dims: {
      believability: { weight: 3, inputs: [a('emotionalDepth', 3), tech(1)], prep: ['lines', 'notes'], conditions: ALL },
      interpretation: { weight: 2, inputs: [a('imagination', 2), tech(1)], prep: ['notes'] },
      connection: { weight: 2, inputs: [a('presence', 2), a('listening', 1)], prep: ['blocking'], conditions: ALL },
      execution: { weight: 2, inputs: [a('memory', 1), a('vocal', 1), a('physical', 1), tech(2)], prep: ['lines', 'blocking'], conditions: ['fatigue', 'illness', 'injury'] },
      consistency: { weight: 1, inputs: [a('composure', 2), a('stamina', 1), a('discipline', 1)], prep: ['lines'], conditions: ALL },
      responsiveness: { weight: 1, inputs: [a('listening', 2), a('adaptability', 1)], prep: ['notes'], conditions: ALL },
    },
  },
};

/** Which profile each coursework template is shown under. */
export const TEMPLATE_TASK: Readonly<Record<string, keyof typeof TASK_PROFILES>> = {
  'scene-study': 'scene', 'classical-scene': 'scene', 'greek-scene': 'scene', 'showcase-scene': 'scene', 'simulated-rehearsal': 'scene',
  'table-work': 'written', 'context-presentation': 'written',
  'voice-sequence': 'voice', 'speech-drill': 'voice', song: 'song',
  'movement-score': 'movement', 'alexander-practice': 'movement',
  'fight-sequence': 'partnered', 'intimacy-practice': 'partnered',
  'play-game': 'improvisation', 'clown-turn': 'clown', 'self-tape': 'camera', 'audition-pair': 'audition',
};

/**
 * The calculation's constants (`systems/evaluation.ts`). Where research names a figure it's cited in
 * `docs/research/attributes/research-acting-engine.json`; the rest are SLATE's estimates, said so.
 */
export const EVALUATION = {
  /** Readiness at or over this is a sufficient condition for any work: a rested, fed, unhurried day reads 70 to 95. */
  sufficientReadiness: 60,
  /** What incomplete preparation leaves at none done: a part not prepared still shows something of the actor. */
  prepFloor: 0.35,
  /** What fatigue leaves at readiness 0, what being ill leaves the voice and the body's work, and what being hurt leaves what the injury limits (`INJURY_KIND[].limits`). */
  fatigueFloor: 0.6,
  illness: 0.85,
  injury: 0.6,
  /** The bounded draw at no mastery, in points either way; nothing at full capacity. Scaled by the other factors from 2026-10-10, any spread under 100 keeps quality rising with every input. */
  variation: 10,
  /** How much a tired day widens the draw at readiness 0 (from 2026-10-10): sleep loss makes work erratic (Doran et al. 2001). SLATE's size of it. */
  fatigueSpread: 0.5,
  /** The whole: this share the weighted mean, the rest the weakest dimension. */
  meanShare: 0.75,
  /**
   * The bands a whole result falls in, for coursework's and a night's readers: LAMDA's Pass, Merit and Distinction
   * (its 2024 Performance Syllabus, read directly; topic 1).
   */
  bands: { working: 50, strong: 65, exceptional: 80 },
  /**
   * Preparation complete: each coursework part at this. A night's lines, blocking and notes count complete at what every
   * call makes (`completeFor`, `systems/production.ts`), and a brief's parts at its own (`BRIEF.complete`); the lines,
   * blocking, notes and genre figures declared here until 2026-10-12 were read by nothing.
   */
  complete: { coursework: 0.9 },
  /**
   * How a genre family leans a work's dimensions, from what each form asks of a performer (topic 10 of the research;
   * SLATE's reading of it): the mean of a work's families, normalized, so a genre leans the weights and never adds to
   * them. A family with no lean listed leans nothing.
   */
  familyLean: {
    comedy: { responsiveness: 1.5, execution: 1.2 },
    farce: { execution: 1.4, responsiveness: 1.3, consistency: 1.2 },
    satire: { interpretation: 1.4 },
    tragedy: { believability: 1.4, interpretation: 1.2 },
    drama: { believability: 1.2, connection: 1.2 },
    melodrama: { believability: 1.2, execution: 1.2 },
    romance: { connection: 1.5 },
    horror: { believability: 1.3, consistency: 1.2 },
    thriller: { consistency: 1.3, responsiveness: 1.1 },
    mystery: { interpretation: 1.3 },
    action: { execution: 1.5 },
    adventure: { execution: 1.2, connection: 1.1 },
    fantasy: { interpretation: 1.3 },
    science_fiction: { interpretation: 1.2, believability: 1.2 },
    musical: { execution: 1.5 },
    historical: { interpretation: 1.2, execution: 1.2 },
    documentary: { believability: 1.5 },
    western: { believability: 1.2, execution: 1.1 },
    war: { believability: 1.3, consistency: 1.2 },
    crime: { believability: 1.2, interpretation: 1.1 },
    animation: { execution: 1.3, interpretation: 1.2 },
    experimental: { interpretation: 1.4, responsiveness: 1.2 },
  } as Readonly<Record<string, Partial<Record<Dimension, number>>>>,
} as const;
