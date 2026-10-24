/**
 * SLATE — how each kind of professional work is done (from 2026-10-24, the owner's brief 25, Part 8;
 * `docs/verification/career-world-2026-10-23/criteria.md`, Module 5). Reference data, not the save: the day plan, what a
 * day judges and in what units, the preparation of its own, the choices a player makes in it, what the voice and the
 * body carry away, and what the work leaves. `systems/workflow.ts` works it.
 *
 * Until this module every professional day was one of three: a rehearsal, a night on stage, or a shoot day judged once as
 * a self-tape is. A voice session, a dub, a capture stage, a narration, a multicamera week, a musical and a stunt were
 * none of them, and a procedural's guest spot, a studio feature and a student film were the same shoot day under
 * different names.
 *
 * Two layers. A workflow is the way of working (single camera, multicamera, the booth, the dub, the capture stage,
 * narration, reenactment, the musical, action, the stage play). A format is the kind of production, each naming its
 * workflow and the terms that set it apart: how many takes it allows, how often the pages change, the order its scenes
 * are shot in, what follows the work, and the agreements' rules that touch it. Every figure here is the game's unless a
 * rule names the agreement it comes from (`docs/verification/career-world-2026-10-23/sources.json`, N13 and N17).
 */

import type { AbilityId } from './abilities';
import type { Dimension } from './tasks';

export type WorkflowId = 'stage' | 'single-camera' | 'multicam' | 'voice' | 'dubbing' | 'capture' | 'narration' | 'reenactment' | 'musical' | 'action';

/** What a work day is in its workflow (`stepOf`, `systems/workflow.ts`). */
export type StepId =
  | 'rehearsal' | 'performance' | 'shoot' | 'table-read' | 'blocking' | 'tape-night' | 'booth' | 'dub' | 'capture'
  | 'narration' | 'reenactment' | 'music' | 'choreography' | 'stunt-rehearsal' | 'stunt-day' | 'loop';

/** What a choice does to the day, read by `systems/workflow.ts`. */
export interface ChoiceEffect {
  /** Ask for more takes on a scene whose best isn't yet strong, up to the format's extra takes a day. */
  extraTakes?: true;
  /** Each part of the work's share of the whole, multiplied: what the choice puts first. */
  lean?: Partial<Record<Dimension, number>>;
  /** Energy each unit of the day costs, beyond the day's own. */
  energy?: number;
  /** The voice's strain from the day, multiplied. */
  strain?: number;
  /** What a rehearsal day builds, multiplied. */
  learn?: number;
  /** The unit done by a double: the stunt by the stunt double, the intimate scene by a body double. */
  double?: true;
  /** Screamed lines sprung on a session without notice, refused. */
  refuse?: true;
  /** Playback watched between takes: one take fewer, and each after the first reads the breakdown as complete. */
  playback?: true;
}

export interface Choice {
  id: string;
  /** Title Case, as a button names it. */
  label: string;
  /** What it does, in the player's words. */
  words: string;
  effect: ChoiceEffect;
}

export type DecisionId = 'takes' | 'alts' | 'audience' | 'stressful' | 'sync' | 'playback' | 'pace' | 'period' | 'marking' | 'stunts' | 'consent';

export interface Decision {
  id: DecisionId;
  /** Title Case, as a section head names it. */
  label: string;
  /** The days it's read on. */
  on: readonly StepId[];
  options: readonly Choice[];
  /** The option in force until the player picks another. */
  initial: string;
}

/** A judged day's units: what they're called, how many a day, and the takes each gets. */
export interface JudgedStep {
  /** The task profile it's judged as (`content/tasks.ts`). */
  task: string;
  unit: { one: string; many: string };
  perDay: number;
  /** Takes each unit gets, where the format doesn't set them. */
  takes: number;
  /** The voice's strain an hour of it adds (`VOICE`), where it's voice work. */
  strain?: number;
}

/** An unjudged day's work on the part: how far it brings each part of the preparation toward complete. */
export interface BuildStep {
  memorization?: number;
  rehearsal?: number;
  interpretation?: number;
  special?: number;
  strain?: number;
}

/** A workflow's preparation of its own, beside breaking it down, the lines and rehearsal (`BRIEF.steps`). */
export interface SpecialStep {
  label: string;
  what: string;
  /** What a day's report says was worked on, in a plain noun ("the fights"). */
  worked: string;
  minutes: number;
  gain: number;
  /** On your feet, which a tired body or an injury stops. */
  feet: boolean;
  trains?: AbilityId;
  /** Done only on the work's own days, with its specialist: never alone. */
  onlyWithCrew?: true;
}

export interface WorkflowSpec {
  id: WorkflowId;
  label: string;
  /** How the work is done, in the player's words. */
  words: string;
  judged: Partial<Record<StepId, JudgedStep>>;
  builds?: Partial<Record<StepId, BuildStep>>;
  /** The preparation steps it takes: the three a part always has, less those it doesn't read, and its own. */
  prep: { steps: readonly ('read' | 'lines' | 'rehearse')[]; special?: SpecialStep };
  decisions: readonly Decision[];
  /** What it leaves: a credit of its medium, and footage a reel can use or not. */
  leaves: { reel: boolean; why?: string };
}

// ---------------------------------------------------------------------------------------------------------------------
// The decisions
// ---------------------------------------------------------------------------------------------------------------------

const TAKES: Decision = {
  id: 'takes', label: 'Another Take', on: ['shoot', 'stunt-day', 'reenactment'], initial: 'as-directed',
  options: [
    { id: 'as-directed', label: 'Go With What’s Printed', words: 'Once a scene has its takes, you let the director move on.', effect: {} },
    { id: 'ask', label: 'Ask For Another Take', words: 'Where a scene’s best isn’t yet strong, you ask for one more, as many times as the production allows in a day. Each costs you energy.', effect: { extraTakes: true, energy: 2 } },
  ],
};

const ALTS: Decision = {
  id: 'alts', label: 'Alternate Lines', on: ['shoot'], initial: 'as-written',
  options: [
    { id: 'as-written', label: 'Play It As Written', words: 'You play the scripted lines in all your takes.', effect: {} },
    { id: 'alts', label: 'Pitch An Alt', words: 'You offer an alternate line in the later takes: the scene leans on how you answer your partner and how inventive the line is, and less on hitting the scripted words cleanly.', effect: { lean: { responsiveness: 1.5, interpretation: 1.2, execution: 0.85 } } },
  ],
};

const AUDIENCE: Decision = {
  id: 'audience', label: 'The Studio Audience', on: ['tape-night'], initial: 'both',
  options: [
    { id: 'both', label: 'Play To Both', words: 'Cameras and house alike: you play the scene for both.', effect: {} },
    { id: 'house', label: 'Play To The House', words: 'You ride the laughs and give the audience the moment: what passes between you and them counts for more, the marks and the timing for the cameras less.', effect: { lean: { connection: 1.4, responsiveness: 1.2, execution: 0.85 } } },
    { id: 'cameras', label: 'Play To The Cameras', words: 'You hit the marks and hold for the cameras: the clean execution and keeping it the same take to take count for more, the room less.', effect: { lean: { execution: 1.3, consistency: 1.2, connection: 0.8 } } },
  ],
};

const STRESSFUL: Decision = {
  id: 'stressful', label: 'Screamed Lines Not Announced', on: ['booth', 'dub'], initial: 'record',
  options: [
    { id: 'record', label: 'Record Them Anyway', words: 'If a session asks for screams or other vocally stressful lines it didn’t announce beforehand, you record them, and your voice carries the strain.', effect: {} },
    { id: 'refuse', label: 'Refuse Them', words: 'If a session asks for screams or other vocally stressful lines it didn’t announce beforehand, you decline them, as the agreement allows. Lines announced before the session are part of the work either way.', effect: { refuse: true } },
  ],
};

const SYNC: Decision = {
  id: 'sync', label: 'Matching The Original', on: ['dub', 'loop'], initial: 'between',
  options: [
    { id: 'between', label: 'Between The Two', words: 'Close to the original actor’s timing, and the lines still yours.', effect: {} },
    { id: 'match', label: 'Match The Original', words: 'You fit every syllable to the mouth on screen: timing counts for more, whether the line sounds like a person talking less.', effect: { lean: { execution: 1.4, believability: 0.8 } } },
    { id: 'own', label: 'Make It Your Own', words: 'You play the line as you’d say it and let the sync be close: believability and your choices count for more, the timing less.', effect: { lean: { believability: 1.3, interpretation: 1.2, execution: 0.8 } } },
  ],
};

const PLAYBACK: Decision = {
  id: 'playback', label: 'Playback', on: ['capture'], initial: 'keep-going',
  options: [
    { id: 'keep-going', label: 'Keep Going', words: 'All the takes there’s time for on the stage, as the director asks for them.', effect: {} },
    { id: 'playback', label: 'Watch The Playback', words: 'Between takes you watch the creature move on the monitor: one take fewer for each sequence, and each one after the first starts from a fuller sense of what you’re playing.', effect: { playback: true } },
  ],
};

const PACE: Decision = {
  id: 'pace', label: 'Pacing The Read', on: ['narration'], initial: 'straight',
  options: [
    { id: 'straight', label: 'Read Straight Through', words: 'Each chapter read without stopping: the session ends on time and your voice carries the whole of it.', effect: {} },
    { id: 'breaks', label: 'Rest Your Voice Each Hour', words: 'You stop for water and quiet each hour: your voice carries half the strain, and the longer session costs you more energy.', effect: { strain: 0.5, energy: 3 } },
  ],
};

const PERIOD: Decision = {
  id: 'period', label: 'The Historian’s Notes', on: ['reenactment'], initial: 'between',
  options: [
    { id: 'between', label: 'Use Them As A Guide', words: 'With the historian’s notes on how people moved and stood, you play the scene within them.', effect: {} },
    { id: 'historian', label: 'Follow Them Closely', words: 'You hold to every note on posture and gesture: the period reads true and clean, and your own choices count for less.', effect: { lean: { believability: 1.2, execution: 1.2, interpretation: 0.8 } } },
    { id: 'free', label: 'Play It Freely', words: 'You play the person more than the period: your own choices count for more, and the period’s exactness for less.', effect: { lean: { interpretation: 1.3, execution: 0.85 } } },
  ],
};

const MARKING: Decision = {
  id: 'marking', label: 'In Music Rehearsals', on: ['music', 'choreography'], initial: 'full',
  options: [
    { id: 'full', label: 'Sing And Dance Full Out', words: 'Everything, at every rehearsal: you learn the most, and your voice and body pay for it.', effect: {} },
    { id: 'mark', label: 'Mark It', words: 'You sing and dance at half voice and half height in rehearsals: your voice takes a third of the strain and you tire less, and you learn the songs and the steps more slowly.', effect: { learn: 0.6, strain: 0.33, energy: -2 } },
  ],
};

const STUNTS: Decision = {
  id: 'stunts', label: 'The Stunts', on: ['stunt-day'], initial: 'double',
  options: [
    { id: 'double', label: 'Use The Double', words: 'The stunt double does the stunts, and the production cuts your close-ups in: you carry none of the risk, and the shot is less your own.', effect: { double: true } },
    { id: 'yourself', label: 'Do It Yourself', words: 'You do the stunts yourself, with the stunt coordinator there, as you consented to: the shot is all yours, and the chance of an injury rests on your rehearsal with the coordinator and your body.', effect: {} },
  ],
};

/**
 * Consent to a scene of nudity or simulated sex (N13 §43): written, describing the scene, given before the work, and
 * withdrawn until it's shot, when a double does it. Read on any day that holds the scene, whatever the workflow.
 */
export const CONSENT: Decision = {
  id: 'consent', label: 'The Intimate Scene', on: ['shoot', 'tape-night', 'capture', 'reenactment', 'stunt-day'], initial: 'declined',
  options: [
    { id: 'declined', label: 'Use A Body Double', words: 'A body double does the scene’s intimate shots, and the scene isn’t judged as part of your work. It costs you nothing: not the part, not the casting office’s view, not your agent’s.', effect: { double: true } },
    { id: 'given', label: 'Consent To The Scene', words: 'You give your written consent to the scene as the contract describes it, shot on a closed set with the intimacy coordinator. You can withdraw it until the day it’s shot.', effect: {} },
  ],
};

// ---------------------------------------------------------------------------------------------------------------------
// The workflows
// ---------------------------------------------------------------------------------------------------------------------

const SCENE = { one: 'scene', many: 'scenes' };

export const WORKFLOWS: Readonly<Record<WorkflowId, WorkflowSpec>> = {
  stage: {
    id: 'stage', label: 'A Stage Play',
    words: 'Rehearsals, then a run of performances in front of a house. The rehearsals build the lines, the blocking and the director’s notes, and each night is judged whole.',
    judged: { performance: { task: 'performance', unit: { one: 'night', many: 'nights' }, perDay: 1, takes: 1 } },
    builds: { rehearsal: {} },
    prep: { steps: ['read', 'lines', 'rehearse'] },
    decisions: [],
    leaves: { reel: false, why: 'A night on stage isn’t filmed for a reel.' },
  },
  'single-camera': {
    id: 'single-camera', label: 'Single Camera',
    words: 'One camera, the scene shot from each angle in turn. Your scenes are shot out of the script’s order, as the locations allow, each in takes, and the director prints the best. Pages can change the night before.',
    judged: { shoot: { task: 'camera', unit: SCENE, perDay: 3, takes: 3 } },
    prep: { steps: ['read', 'lines', 'rehearse'] },
    decisions: [TAKES],
    leaves: { reel: true },
  },
  multicam: {
    id: 'multicam', label: 'Multicamera Before A Studio Audience',
    words: 'An episode’s week: a table read, rehearsal and camera blocking, then a tape night before a studio audience, the scenes played in order with three or four cameras rolling. A scene that plays badly is picked up after the audience leaves, without its laughs.',
    judged: { 'tape-night': { task: 'multicam', unit: SCENE, perDay: 4, takes: 1, strain: 2 } },
    builds: { 'table-read': { interpretation: 0.3, memorization: 0.1 }, blocking: { memorization: 0.3, rehearsal: 0.35, interpretation: 0.1 } },
    prep: { steps: ['read', 'lines', 'rehearse'] },
    decisions: [AUDIENCE],
    leaves: { reel: true },
  },
  voice: {
    id: 'voice', label: 'Voice In The Booth',
    words: 'Recording sessions in a booth, the script on a stand: the part’s lines scene by scene, each in several reads, with the voice director asking for more. There’s nothing to learn by heart and everything to find in the voice, and the voice carries what the sessions take out of it.',
    judged: { booth: { task: 'booth', unit: SCENE, perDay: 4, takes: 3, strain: 6 } },
    prep: { steps: ['read', 'rehearse'], special: { label: 'Find The Voice', worked: 'the character’s voice', what: 'The character’s voice found and kept: its pitch, its placement, its rhythm, so it’s the same voice in every session.', minutes: 45, gain: 0.5, feet: false, trains: 'vocal' } },
    decisions: [STRESSFUL],
    leaves: { reel: false, why: 'It’s your voice with no picture of you, so it can’t go on a reel.' },
  },
  dubbing: {
    id: 'dubbing', label: 'Dubbing',
    words: 'Another actor’s performance replaced in English, a loop at a time: a few seconds of picture played over and over while you fit the line to the mouth on screen. Judged above all on timing.',
    judged: { dub: { task: 'dub', unit: { one: 'loop', many: 'loops' }, perDay: 6, takes: 2, strain: 3 } },
    prep: { steps: ['read'], special: { label: 'Watch The Original', worked: 'the original', what: 'The episodes watched with the original actor: their rhythm, their breaths, where each line lands.', minutes: 60, gain: 0.5, feet: false, trains: 'listening' } },
    decisions: [SYNC, STRESSFUL],
    leaves: { reel: false, why: 'It’s your voice over another actor’s face, so it can’t go on a reel.' },
  },
  capture: {
    id: 'capture', label: 'Performance Capture',
    words: 'A capture stage in a suit and markers, a head rig on your face, and no set: the body and the imagination carry everything, and the character is made in the computer from what you do. Sequences in takes, and several characters in a day.',
    judged: { capture: { task: 'capture', unit: { one: 'sequence', many: 'sequences' }, perDay: 3, takes: 3 } },
    prep: { steps: ['read', 'lines', 'rehearse'], special: { label: 'Work On The Movement', worked: 'the movement', what: 'How the character moves, worked out in your body: how heavily, how fast, how it turns its head.', minutes: 60, gain: 0.45, feet: true, trains: 'physical' } },
    decisions: [PLAYBACK],
    leaves: { reel: true },
  },
  narration: {
    id: 'narration', label: 'Documentary Narration',
    words: 'A long read in a booth, chapter by chapter: the pace held and the voice the same in the last hour as the first, every name said right. A chapter that slips is picked up at the end.',
    judged: { narration: { task: 'narration', unit: { one: 'chapter', many: 'chapters' }, perDay: 4, takes: 1, strain: 5 } },
    prep: { steps: ['read'], special: { label: 'Check The Pronunciations', worked: 'the pronunciations', what: 'Every name, place and term in the script looked up and said aloud until it’s right.', minutes: 45, gain: 0.55, feet: false, trains: 'focus' } },
    decisions: [PACE],
    leaves: { reel: false, why: 'It’s your voice with no picture of you, so it can’t go on a reel.' },
  },
  reenactment: {
    id: 'reenactment', label: 'Documentary Reenactment',
    words: 'A part on camera with no lines: the person in the history, shown in what they did and how they did it. The period’s movement is the preparation, and a historian’s notes are there on the day.',
    judged: { reenactment: { task: 'reenactment', unit: SCENE, perDay: 3, takes: 2 } },
    prep: { steps: ['read', 'rehearse'], special: { label: 'Study The Period’s Movement', worked: 'the period’s movement', what: 'How people of the time stood, worked, carried things and greeted one another, practiced until it’s in your body.', minutes: 60, gain: 0.5, feet: true, trains: 'physical' } },
    decisions: [TAKES, PERIOD],
    leaves: { reel: true },
  },
  musical: {
    id: 'musical', label: 'A Musical',
    words: 'Music rehearsals and choreography before the staging, then a run of performances in front of a house. The songs and the steps are a preparation of their own, and the voice carries each night.',
    judged: { performance: { task: 'musicalNight', unit: { one: 'night', many: 'nights' }, perDay: 1, takes: 1, strain: 4 } },
    builds: { music: { memorization: 0.25, special: 0.15, strain: 6 }, choreography: { special: 0.3, rehearsal: 0.1, strain: 2 }, rehearsal: {} },
    prep: { steps: ['read', 'lines', 'rehearse'], special: { label: 'Practice The Choreography', worked: 'the choreography', what: 'The numbers’ steps run on your own, counted and then to the music.', minutes: 60, gain: 0.4, feet: true, trains: 'physical' } },
    decisions: [MARKING],
    leaves: { reel: false, why: 'A night on stage isn’t filmed for a reel.' },
  },
  action: {
    id: 'action', label: 'Action',
    words: 'Fight rehearsal with the stunt coordinator before the shoot, then shoot days, some with stunts. A stunt is done only with your consent and the coordinator there. Your scenes are shot out of order, in takes.',
    judged: { shoot: { task: 'camera', unit: SCENE, perDay: 2, takes: 3 }, 'stunt-day': { task: 'stunt', unit: SCENE, perDay: 2, takes: 3 } },
    builds: { 'stunt-rehearsal': { special: 0.4, rehearsal: 0.15 } },
    prep: { steps: ['read', 'lines', 'rehearse'], special: { label: 'Fight Rehearsal', worked: 'the fights', what: 'The fights and the stunts rehearsed with the stunt coordinator, move by move, until they’re safe at speed. Only on the rehearsal days, never alone.', minutes: 0, gain: 0, feet: true, onlyWithCrew: true } },
    decisions: [TAKES, STUNTS],
    leaves: { reel: true },
  },
};

// ---------------------------------------------------------------------------------------------------------------------
// The formats
// ---------------------------------------------------------------------------------------------------------------------

export type FormatId =
  | 'play' | 'musical' | 'independent-feature' | 'studio-feature' | 'procedural' | 'serialized-drama' | 'serialized-comedy'
  | 'limited-series' | 'anthology' | 'tv-movie' | 'single-camera-comedy' | 'multicam-comedy' | 'animated-feature'
  | 'animated-series' | 'dub' | 'capture' | 'narration' | 'reenactment' | 'action-feature' | 'short' | 'student-film';

/** What follows the work: a run's last night, a release in cinemas, a broadcast, a streaming release, festivals, or the school's screening. */
export type After = 'stage' | 'theatrical' | 'broadcast' | 'streaming' | 'festival' | 'school';

/**
 * How the release notice says the work came out, by what follows it (from 2026-10-24, brief 25's Module 5). Until then
 * `after` was declared on every format and read by nothing, and every release said only that the work "is out".
 */
export const RELEASED: Readonly<Record<After, string>> = {
  stage: 'is out', theatrical: 'is out in cinemas', broadcast: 'is on the air', streaming: 'is streaming',
  festival: 'has begun its festival run', school: 'was screened at its film school',
};

export interface FormatSpec {
  id: FormatId;
  workflow: WorkflowId;
  label: string;
  words: string;
  /** A camera format's takes: each scene's, and the extra takes the production allows in a day. */
  takes?: { base: number; extra: number };
  /** The chance a work day's pages are revised the night before, and the share of the lines a revision changes at most. */
  revisions: number;
  /**
   * The order its scenes are shot in: the story's; the locations', out of the script's order; within each episode; or
   * cross-boarded, the scenes of a block of episodes shot together as the locations allow.
   */
  board: 'story' | 'location' | 'episodes' | 'cross-boarded';
  /** A camera day's scenes, where it isn't the workflow's. */
  scenesPerDay?: number;
  after: After;
  /** An anthology invites back an actor who did strong work, into a new story. */
  returns?: true;
  /**
   * No consecutive employment: a day's pay only for each day worked, the days between unpaid (an animated feature's voice
   * work, N13 Schedule A §21's fourth exception; performance capture, N17 item 27).
   */
  daysOnly?: true;
  /** A recall to loop after the wrap, within so many months (N13 Schedule A §28.A): four, six for features and long-form television. */
  looping?: number;
  /** Decisions of its own, beside its workflow's. */
  decisions?: readonly Decision[];
}

export const FORMATS: Readonly<Record<FormatId, FormatSpec>> = {
  play: { id: 'play', workflow: 'stage', label: 'A Play', words: 'A play’s run.', revisions: 0, board: 'story', after: 'stage' },
  musical: { id: 'musical', workflow: 'musical', label: 'A Musical', words: 'A musical’s run in a regional theater.', revisions: 0, board: 'story', after: 'stage' },
  'independent-feature': {
    id: 'independent-feature', workflow: 'single-camera', label: 'An Independent Feature',
    words: 'A live-action feature on an independent budget: two takes a scene and time for only one more in a day, the scenes shot by location, and a release in cinemas a year on.',
    takes: { base: 2, extra: 1 }, revisions: 0.1, board: 'location', after: 'theatrical', looping: 6,
  },
  'studio-feature': {
    id: 'studio-feature', workflow: 'single-camera', label: 'A Studio Feature',
    words: 'A live-action feature on a studio’s budget: three takes a scene, three more in a day for the asking, fewer scenes a day, and a release in cinemas a year on.',
    takes: { base: 3, extra: 3 }, revisions: 0.15, board: 'location', scenesPerDay: 2, after: 'theatrical', looping: 6,
  },
  procedural: {
    id: 'procedural', workflow: 'single-camera', label: 'A Procedural',
    words: 'An hour of network television whose case is closed in the episode: your scenes are all in one episode, shot out of order in its eight days, and it airs within months.',
    takes: { base: 3, extra: 2 }, revisions: 0.25, board: 'episodes', after: 'broadcast', looping: 4,
  },
  'serialized-drama': {
    id: 'serialized-drama', workflow: 'single-camera', label: 'A Serialized Drama',
    words: 'A drama whose story runs across the season, shot two episodes at a time: a day can hold scenes from both, so you play the middle of the story before its beginning, and the pages change more often.',
    takes: { base: 3, extra: 2 }, revisions: 0.35, board: 'cross-boarded', after: 'streaming', looping: 4,
  },
  'serialized-comedy': {
    id: 'serialized-comedy', workflow: 'single-camera', label: 'A Serialized Comedy',
    words: 'A half-hour comedy whose story runs across the season, shot single camera two episodes at a time, with room for alternate lines in the later takes.',
    takes: { base: 3, extra: 2 }, revisions: 0.35, board: 'cross-boarded', after: 'streaming', looping: 4, decisions: [ALTS],
  },
  'limited-series': {
    // Until 2026-10-24 this format was also marked closedEnd, which nothing read: a limited series has no option because
    // it's no series' season, and its six months to loop are §28.A's for long-form television, a closed-end series among it.
    id: 'limited-series', workflow: 'single-camera', label: 'A Limited Series',
    words: 'A story told in one season and ended: every episode shot as one block, your scenes across them shot as the locations allow, and no next season, so no option.',
    takes: { base: 3, extra: 2 }, revisions: 0.2, board: 'cross-boarded', after: 'streaming', looping: 6,
  },
  anthology: {
    id: 'anthology', workflow: 'single-camera', label: 'An Anthology',
    words: 'Each season a new story with new characters: a guest part ends with its story, and an actor whose work was strong is invited back into the next one without auditioning.',
    takes: { base: 3, extra: 2 }, revisions: 0.2, board: 'location', after: 'streaming', returns: true, looping: 4,
  },
  'tv-movie': {
    id: 'tv-movie', workflow: 'single-camera', label: 'A Television Movie',
    words: 'A feature made for one network night: shot fast, two takes a scene, and broadcast once it’s cut.',
    takes: { base: 2, extra: 2 }, revisions: 0.15, board: 'location', scenesPerDay: 4, after: 'broadcast', looping: 6,
  },
  'single-camera-comedy': {
    id: 'single-camera-comedy', workflow: 'single-camera', label: 'A Single-Camera Comedy',
    words: 'A half-hour network comedy shot like a film, one camera, with room for alternate lines in the later takes.',
    takes: { base: 3, extra: 2 }, revisions: 0.25, board: 'episodes', after: 'broadcast', looping: 4, decisions: [ALTS],
  },
  'multicam-comedy': {
    id: 'multicam-comedy', workflow: 'multicam', label: 'A Multicamera Comedy',
    words: 'A half-hour comedy taped before a studio audience at the end of its week, the scenes in order, the pages rewritten after the table read.',
    revisions: 0.6, board: 'story', after: 'broadcast',
  },
  'animated-feature': {
    id: 'animated-feature', workflow: 'voice', label: 'An Animated Feature',
    words: 'An animated film, its lines recorded before it’s drawn, in sessions months apart, each paid as a day, the days between unpaid.',
    revisions: 0.3, board: 'location', after: 'theatrical', daysOnly: true,
  },
  'animated-series': {
    id: 'animated-series', workflow: 'voice', label: 'An Animated Series',
    words: 'An animated series, an episode’s lines recorded in a session every other week.',
    revisions: 0.2, board: 'story', after: 'broadcast',
  },
  dub: {
    id: 'dub', workflow: 'dubbing', label: 'An English Dub',
    words: 'A series from abroad dubbed into English: a session of your character alone is a day’s pay, however many lines; with other characters in it, a day covers up to five lines each for up to three of them, and each part of more than five, yours included, is a day more.',
    revisions: 0, board: 'location', after: 'streaming',
  },
  capture: {
    id: 'capture', workflow: 'capture', label: 'Performance Capture',
    words: 'A feature’s digital character played on a capture stage, called in day by day as the production needs you, each day paid, the days between unpaid, several characters in a day at no more pay.',
    revisions: 0.15, board: 'location', after: 'theatrical', daysOnly: true, looping: 6,
  },
  narration: {
    id: 'narration', workflow: 'narration', label: 'Documentary Narration',
    words: 'A documentary’s narration read in the booth over sessions, in the film’s order.',
    revisions: 0.2, board: 'story', after: 'broadcast',
  },
  reenactment: {
    id: 'reenactment', workflow: 'reenactment', label: 'A Documentary’s Reenactments',
    words: 'The documentary’s reenactments shot on location, with no lines.',
    takes: { base: 2, extra: 1 }, revisions: 0, board: 'location', after: 'broadcast',
  },
  'action-feature': {
    id: 'action-feature', workflow: 'action', label: 'An Action Feature',
    words: 'A studio feature built on its fights and stunts: rehearsal with the stunt coordinator first, and a release in cinemas a year on.',
    takes: { base: 3, extra: 3 }, revisions: 0.15, board: 'location', after: 'theatrical', looping: 6,
  },
  short: {
    id: 'short', workflow: 'single-camera', label: 'A Short Film',
    words: 'A short shot in a day or two with no time to spare: two takes a scene and none more, and a run at festivals once it’s cut.',
    takes: { base: 2, extra: 0 }, revisions: 0.05, board: 'location', scenesPerDay: 4, after: 'festival',
  },
  'student-film': {
    id: 'student-film', workflow: 'single-camera', label: 'A Student Film',
    words: 'A film school’s production: more takes than any paid set can spare, the pay deferred, and the film screened at the school, its footage yours for a reel.',
    takes: { base: 4, extra: 2 }, revisions: 0.1, board: 'location', after: 'school',
  },
};

/** The decisions a format's work offers: its workflow's and its own, and the intimate scene's where the part has one. */
export function decisionsOf(format: FormatId, intimate: boolean): Decision[] {
  const f = FORMATS[format];
  return [...WORKFLOWS[f.workflow].decisions, ...(f.decisions ?? []), ...(intimate ? [CONSENT] : [])];
}

/**
 * The voice's strain (from 2026-10-24): 0 to 100, raised by voice work, a night singing or a session in the booth, and
 * eased by rest, `restPerHour` an hour since it was last raised. Read only by work that uses the voice as its
 * instrument (`content/tasks.ts`, the profiles whose conditions name it), where it leaves `floor` at 100. ASSUMPTION,
 * every figure: the game's, after the common advice that a strained voice needs a day or two of quiet.
 */
export const VOICE = { restPerHour: 2, floor: 0.6, stressfulExtra: 15, warnAt: 70 } as const;

/**
 * A stunt done yourself (ASSUMPTION, the game's figures, since no published rate separates an actor's stunt from a stunt
 * performer's): the chance of an injury, `rehearsed` with the fight rehearsal complete and `cold` with none, less a
 * share for a strong body.
 */
export const STUNT = { rehearsed: 0.03, cold: 0.15, physicalShare: 0.4, insert: 0.85 } as const;

/** The chance revised pages change the lines, and the share of them at most (the game's). */
export const PAGES = { least: 0.1, most: 0.35, eveningHour: 18 } as const;

/** After a screen wrap, the chance the producer recalls you to loop, and the chance the edit cuts one of your scenes (the game's). */
export const AFTER_WRAP = { loop: 0.35, cut: 0.2, loopHours: 4, loopHour: 10 } as const;

/** Each scene of the part and how far into the story it falls, made at acceptance (`systems/workflow.ts`). */
export const SCRIPT = { scenesPerEpisode: 6, minimumScene: 3, spread: 40 } as const;
