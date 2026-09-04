/**
 * SLATE — how a picture of this kind actually gets made.
 *
 * A cartoon is not photographed. A documentary is not screen-tested. A stop
 * motion feature is measured in seconds a week, not pages a day. The format
 * and the genres decide which pipeline a project runs on, and the pipeline
 * decides what the schedule is made of, what post is made of, which chairs
 * matter, and what every one of them is called on screen.
 *
 * The descriptions here are how these things are made in the industry, stated
 * plainly. The numbers — how many lines a session gets through, how many shots
 * a week of animation finishes — are SLATE's calibration.
 */

import type { PostTaskKind, ProjectFormat, ShootDayKind } from '../domain/model';
import type { CraftRole } from './craft-attributes';

export type ProductionKind = 'live_action' | 'animation' | 'stop_motion' | 'documentary' | 'unscripted';

export interface Pipeline {
  kind: ProductionKind;
  /** What the making of it is called. */
  label: string;
  /** What one unit of the schedule is. */
  unit: string;
  units: string;
  /** The button that starts it. */
  scheduleCta: string;
  /** What casting is called here. */
  castingLabel: string;
  /** What the room is: a room, a booth, or a conversation. */
  auditionLabel: string;
  /** The kinds of day this pipeline schedules, in the order they happen. */
  dayKinds: readonly ShootDayKind[];
  /**
   * The post graph for this kind, in order, each with what it waits for. A
   * cartoon's edit waits on the story reel, not on an assembly of rushes; a
   * documentary's lawyers wait on the director's cut.
   */
  post: readonly { kind: PostTaskKind; after: PostTaskKind[] }[];
  /** Which chairs are worth filling. */
  chairs: readonly CraftRole[];
  /** How it is really made, in a sentence or two. */
  how: string;
  /** What the player is told the schedule means. */
  scheduleNote: string;
}

/** The tail every picture shares once it is locked and mixed. */
function finish(
  afterPicture: PostTaskKind,
  colourAfter: PostTaskKind[] = [],
  mixAfter: PostTaskKind[] = ['sound_design', 'score', 'music_clearance'],
): { kind: PostTaskKind; after: PostTaskKind[] }[] {
  return [
    { kind: 'mix', after: mixAfter },
    { kind: 'color', after: [afterPicture, ...colourAfter] },
    { kind: 'titles', after: [afterPicture] },
    { kind: 'subtitles', after: ['mix'] },
    { kind: 'localization', after: ['mix'] },
    { kind: 'qc', after: ['color', 'mix', 'titles'] },
    { kind: 'mastering', after: ['qc'] },
    { kind: 'delivery', after: ['mastering', 'subtitles'] },
  ];
}

export const PIPELINES: Readonly<Record<ProductionKind, Pipeline>> = {
  live_action: {
    kind: 'live_action',
    label: 'Principal Photography',
    unit: 'Shoot Day', units: 'Shoot Days',
    scheduleCta: 'Board A Shooting Schedule',
    castingLabel: 'Casting',
    auditionLabel: 'Audition',
    dayKinds: ['photography'],
    post: [
      { kind: 'assembly', after: [] },
      { kind: 'editors_cut', after: ['assembly'] },
      { kind: 'directors_cut', after: ['editors_cut'] },
      { kind: 'studio_notes', after: ['directors_cut'] },
      { kind: 'picture_lock', after: ['studio_notes'] },
      { kind: 'vfx', after: ['picture_lock'] },
      { kind: 'adr', after: ['picture_lock'] },
      { kind: 'foley', after: ['picture_lock'] },
      { kind: 'sound_design', after: ['picture_lock'] },
      { kind: 'score', after: ['picture_lock'] },
      { kind: 'music_clearance', after: ['picture_lock'] },
      ...finish('picture_lock', ['vfx']),
    ],
    chairs: ['director', 'producer', 'cinematographer', 'composer'],
    how: 'A crew photographs actors on sets and locations, day by day, against a schedule the first AD boards from the script.',
    scheduleNote: 'Days are placed on the calendar. Cast have to be in the right city on each of them, and what is not shot rolls over.',
  },
  animation: {
    kind: 'animation',
    label: 'Voice And Animation',
    unit: 'Production Day', units: 'Production Days',
    scheduleCta: 'Plan The Production',
    castingLabel: 'Voice Casting',
    auditionLabel: 'Voice Session',
    dayKinds: ['voice_session', 'story_reel', 'animation_block'],
    post: [
      { kind: 'story_reel_lock', after: [] },
      { kind: 'layout', after: ['story_reel_lock'] },
      { kind: 'animation_final', after: ['layout'] },
      { kind: 'lighting_render', after: ['animation_final'] },
      { kind: 'editors_cut', after: ['lighting_render'] },
      { kind: 'directors_cut', after: ['editors_cut'] },
      { kind: 'studio_notes', after: ['directors_cut'] },
      { kind: 'picture_lock', after: ['studio_notes'] },
      { kind: 'adr', after: ['story_reel_lock'] },
      { kind: 'foley', after: ['picture_lock'] },
      { kind: 'sound_design', after: ['picture_lock'] },
      { kind: 'score', after: ['picture_lock'] },
      { kind: 'music_clearance', after: ['picture_lock'] },
      ...finish('picture_lock', ['lighting_render']),
    ],
    chairs: ['director', 'producer', 'cinematographer', 'composer'],
    how: 'Nothing is photographed. The cast record in a booth, usually one at a time and often before a frame exists; the film is cut as a story reel from boards, then built through layout, animation, lighting and rendering. The director of photography lights it, in software.',
    scheduleNote: 'Recording sessions and animation blocks, not shoot days. A session needs the voice; a block needs the crew and the time.',
  },
  stop_motion: {
    kind: 'stop_motion',
    label: 'Stop Motion Unit',
    unit: 'Unit Week', units: 'Unit Weeks',
    scheduleCta: 'Set The Units Going',
    castingLabel: 'Voice Casting',
    auditionLabel: 'Voice Session',
    dayKinds: ['voice_session', 'story_reel', 'stop_motion_unit'],
    post: [
      { kind: 'story_reel_lock', after: [] },
      { kind: 'animation_final', after: ['story_reel_lock'] },
      { kind: 'editors_cut', after: ['animation_final'] },
      { kind: 'directors_cut', after: ['editors_cut'] },
      { kind: 'studio_notes', after: ['directors_cut'] },
      { kind: 'picture_lock', after: ['studio_notes'] },
      { kind: 'vfx', after: ['picture_lock'] },
      { kind: 'adr', after: ['story_reel_lock'] },
      { kind: 'foley', after: ['picture_lock'] },
      { kind: 'sound_design', after: ['picture_lock'] },
      { kind: 'score', after: ['picture_lock'] },
      { kind: 'music_clearance', after: ['picture_lock'] },
      ...finish('picture_lock', ['vfx']),
    ],
    chairs: ['director', 'producer', 'cinematographer', 'composer'],
    how: 'Puppets on real sets, moved a frame at a time and photographed. Many units shoot at once, and a good week is a few seconds of finished film per animator.',
    scheduleNote: 'Weeks, not days. Each unit week is measured in seconds of film, and a knocked puppet costs the shot.',
  },
  documentary: {
    kind: 'documentary',
    label: 'Filming',
    unit: 'Filming Day', units: 'Filming Days',
    scheduleCta: 'Plan The Shoot',
    castingLabel: 'Subjects And Contributors',
    auditionLabel: 'Pre-Interview',
    dayKinds: ['interview', 'verite', 'archive'],
    post: [
      { kind: 'transcription', after: [] },
      { kind: 'assembly', after: ['transcription'] },
      { kind: 'editors_cut', after: ['assembly'] },
      { kind: 'directors_cut', after: ['editors_cut'] },
      { kind: 'archive_clearance', after: ['editors_cut'] },
      { kind: 'legal_review', after: ['directors_cut'] },
      { kind: 'studio_notes', after: ['directors_cut'] },
      { kind: 'picture_lock', after: ['studio_notes', 'legal_review', 'archive_clearance'] },
      { kind: 'sound_design', after: ['picture_lock'] },
      { kind: 'score', after: ['picture_lock'] },
      { kind: 'music_clearance', after: ['picture_lock'] },
      ...finish('picture_lock'),
    ],
    chairs: ['director', 'producer', 'cinematographer', 'composer'],
    how: 'Access first: interviews with people who agreed to sit down, footage shot as things happen, and archive that has to be found, licensed and cleared. The film is found in the edit, and the lawyers read it before anybody else does.',
    scheduleNote: 'Interview days, days out with the camera, and days in the archive. A subject can say no on the morning.',
  },
  unscripted: {
    kind: 'unscripted',
    label: 'Production',
    unit: 'Record Day', units: 'Record Days',
    scheduleCta: 'Plan The Record',
    castingLabel: 'Casting',
    auditionLabel: 'Casting Call',
    dayKinds: ['verite', 'photography'],
    post: [
      { kind: 'transcription', after: [] },
      { kind: 'assembly', after: ['transcription'] },
      { kind: 'editors_cut', after: ['assembly'] },
      { kind: 'studio_notes', after: ['editors_cut'] },
      { kind: 'picture_lock', after: ['studio_notes'] },
      { kind: 'sound_design', after: ['picture_lock'] },
      { kind: 'music_clearance', after: ['picture_lock'] },
      // No composer on most of these: the music is licensed, so the mix waits
      // on the clearance rather than on a score that was never commissioned.
      ...finish('picture_lock', [], ['sound_design', 'music_clearance']),
    ],
    chairs: ['producer', 'director', 'composer'],
    how: 'Contributors, a format, and a lot of footage. The show is made in the edit from what the day gave you.',
    scheduleNote: 'Record days against a format, and an edit that decides what the show was.',
  },
};

/** Genres that mean it is drawn or built rather than photographed. */
const ANIMATION_GENRES = new Set(['animation', 'anime']);
const STOP_MOTION_HINTS = ['stop motion', 'stop-motion', 'puppet'];
const DOC_GENRES = new Set(['documentary', 'nature', 'true-crime', 'concert']);
const UNSCRIPTED_GENRES = new Set(['reality', 'competition', 'cooking', 'talk', 'game-show', 'lifestyle', 'travelogue']);

/** Which pipeline a project runs on. */
export function pipelineKindFor(project: { format: ProjectFormat; genres: readonly string[]; logline?: string }): ProductionKind {
  const genres = project.genres.map((g) => g.toLowerCase());
  const text = `${project.logline ?? ''}`.toLowerCase();
  if (genres.some((g) => ANIMATION_GENRES.has(g))) {
    return STOP_MOTION_HINTS.some((hint) => text.includes(hint)) ? 'stop_motion' : 'animation';
  }
  if (project.format === 'documentary' || genres.some((g) => DOC_GENRES.has(g))) {
    // A drama is not a documentary because it is about nature.
    if (project.format === 'documentary' || genres.includes('documentary')) return 'documentary';
  }
  if (genres.some((g) => UNSCRIPTED_GENRES.has(g))) return 'unscripted';
  return 'live_action';
}

export function pipelineFor(project: { format: ProjectFormat; genres: readonly string[]; logline?: string }): Pipeline {
  return PIPELINES[pipelineKindFor(project)];
}

/** What each kind of day is called, and what it is. */
export const DAY_KIND_LABEL: Readonly<Record<ShootDayKind, string>> = {
  photography: 'Shoot Day',
  voice_session: 'Recording Session',
  story_reel: 'Story Reel Day',
  animation_block: 'Animation Block',
  stop_motion_unit: 'Unit Week',
  interview: 'Interview Day',
  verite: 'Day Out With The Camera',
  archive: 'Archive Day',
  motion_capture: 'Capture Day',
};

export const DAY_KIND_NOTE: Readonly<Record<ShootDayKind, string>> = {
  photography: 'A crew, a location or a stage, and a day of setups.',
  voice_session: 'One or two actors in a booth with the director and an engineer, going line by line.',
  story_reel: 'Boards cut to temp dialogue, so the film can be watched before it exists.',
  animation_block: 'A week of the animation crew working through assigned shots.',
  stop_motion_unit: 'Units shooting a frame at a time. A good week is seconds, not minutes.',
  interview: 'A subject, two cameras and however long they are willing to sit there.',
  verite: 'Out with the camera, filming what happens rather than what was planned.',
  archive: 'In the archive: finding the footage, logging it, and starting the paperwork.',
  motion_capture: 'Performers on a capture stage in suits, driving characters that get built later.',
};

/** Post tasks that only exist on some pipelines, with what they are. */
export const EXTRA_POST_SPECS: readonly { kind: PostTaskKind; name: string; dependsOn: PostTaskKind[]; budgetShare: number; days: number; qualityWeight: number; about: string }[] = [
  { kind: 'story_reel_lock', name: 'Story Reel', dependsOn: [], budgetShare: 0.05, days: 60, qualityWeight: 1.3, about: 'The whole film cut from boards with temp voices, watched and rebuilt until it works.' },
  { kind: 'layout', name: 'Layout', dependsOn: ['story_reel_lock'], budgetShare: 0.08, days: 70, qualityWeight: 0.9, about: 'Staging every shot in three dimensions: where the camera is and what it sees.' },
  { kind: 'animation_final', name: 'Animation', dependsOn: ['layout'], budgetShare: 0.30, days: 220, qualityWeight: 1.5, about: 'The performance itself, shot by shot, at a few seconds per animator per week.' },
  { kind: 'lighting_render', name: 'Lighting And Render', dependsOn: ['animation_final'], budgetShare: 0.16, days: 120, qualityWeight: 1.1, about: 'Lighting every shot and putting it through the farm, which takes as long as it takes.' },
  { kind: 'transcription', name: 'Transcription And Logging', dependsOn: [], budgetShare: 0.03, days: 30, qualityWeight: 0.4, about: 'Every frame logged and every word transcribed, because you cannot cut what you cannot find.' },
  { kind: 'archive_clearance', name: 'Archive Clearance', dependsOn: ['editors_cut'], budgetShare: 0.09, days: 70, qualityWeight: 0.5, about: 'Licensing every second of footage and every photograph, from whoever owns it.' },
  { kind: 'legal_review', name: 'Legal Review', dependsOn: ['directors_cut'], budgetShare: 0.03, days: 25, qualityWeight: 0.3, about: 'Lawyers watching for what can be proved, and errors-and-omissions cover on the other side of it.' },
];

export const EXTRA_POST_BY_KIND: Readonly<Record<string, typeof EXTRA_POST_SPECS[number]>> =
  Object.fromEntries(EXTRA_POST_SPECS.map((s) => [s.kind, s]));
