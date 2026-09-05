/**
 * SLATE — the room, beat by beat.
 *
 * An audition is not one roll. It is a morning: a sign-in sheet, a corridor
 * full of people who look like you, sides that may have changed since they
 * were sent, a walk in, a camera, a reader who is being paid very little, one
 * read, an adjustment, a question about what else you are doing, and a walk
 * out. Everything in here happens in real rooms, and every choice offered is
 * a choice an actor actually has.
 *
 * What each choice is worth depends on who is sitting there. A joke lands
 * differently in a room with a network executive in it than in a pre-read
 * with the associate. Playing against the text is the bravest thing on this
 * page and the fastest way to lose a co-star booking. None of the options are
 * traps, and none of them are free.
 */

import type { RoomSeatId } from './casting-industry';

export type BeatId =
  | 'waiting' | 'sides_change' | 'walk_in' | 'slate' | 'first_read'
  | 'adjustment' | 'second_read' | 'room_talk' | 'walk_out';

export interface BeatChoice {
  id: string;
  /** What the player is choosing to do. */
  label: string;
  /** What it actually is, in the room. */
  detail: string;
  /** The attributes it is judged on, and by how much. */
  weighs: Readonly<Record<string, number>>;
  /** How far it can swing, either way. Higher is braver. */
  risk: number;
  /** What it does to your nerves before the next beat. */
  nerves: number;
  /** Minutes it takes. */
  minutes: number;
  /** Seats that respond to this more than most, and by how much. */
  favouredBy?: Partial<Record<RoomSeatId, number>>;
  /** Seats that respond to it worse, and by how much. */
  frownedOnBy?: Partial<Record<RoomSeatId, number>>;
  /** Only offered when this is true of the room. */
  requires?: 'taped' | 'reader' | 'director_present' | 'other_actors' | 'sides_changed';
}

export interface Beat {
  id: BeatId;
  name: string;
  /** What is happening. */
  what: string;
  /** Whether the beat is always in the room, or only sometimes. */
  always: boolean;
  choices: readonly BeatChoice[];
}

/**
 * The beats, in the order they happen.
 *
 * Not every room runs all of them. A pre-read has no adjustment because there
 * is no director in it to give one; a network test has no waiting room worth
 * the name because there are three of you and you are all in separate rooms.
 */
export const BEATS: readonly Beat[] = [
  {
    id: 'waiting',
    name: 'The Waiting Room',
    what: 'A corridor or a room with chairs, a sign-in sheet, and four other people who look enough like you to be unsettling. Your slot was fifteen minutes ago.',
    always: true,
    choices: [
      { id: 'run_lines', label: 'Run It Again', detail: 'Quietly, off the page, one more time.', weighs: { preparation: 0.5, memorization: 0.3, script_analysis: 0.2 }, risk: 0.2, nerves: -4, minutes: 10 },
      { id: 'sit_still', label: 'Sit With It', detail: 'Put the sides down. Breathe. Stop working it.', weighs: { pressure_tolerance: 0.5, stillness: 0.3, resilience: 0.2 }, risk: 0.1, nerves: -12, minutes: 10 },
      { id: 'talk_to_them', label: 'Talk To The Others', detail: 'The four people up for the same part. Somebody always knows something.', weighs: { networking: 0.4, social_instinct: 0.3, discretion: 0.3 }, risk: 0.5, nerves: 4, minutes: 12, requires: 'other_actors' },
      { id: 'watch_the_door', label: 'Watch Who Goes In', detail: 'And how long each of them is in there, and what their face does coming out.', weighs: { script_analysis: 0.3, pressure_tolerance: 0.4, discretion: 0.3 }, risk: 0.4, nerves: 8, minutes: 8, requires: 'other_actors' },
      { id: 'be_early', label: 'Say Nothing To Anyone', detail: 'Head down, phone away, wait to be called.', weighs: { pressure_tolerance: 0.6, punctuality: 0.4 }, risk: 0, nerves: -2, minutes: 8 },
    ],
  },
  {
    id: 'sides_change',
    name: 'New Sides',
    what: 'The assistant comes out with fresh pages. The scene you learned is not the scene you are reading. You have eleven minutes.',
    always: false,
    choices: [
      { id: 'learn_fast', label: 'Get It Down', detail: 'Eleven minutes, off book or close to it.', weighs: { memorization: 0.5, cold_reading: 0.3, pressure_tolerance: 0.2 }, risk: 0.5, nerves: 10, minutes: 11, requires: 'sides_changed' },
      { id: 'read_for_sense', label: 'Work Out What It Is', detail: 'Do not learn it. Understand it, and carry the page in.', weighs: { script_analysis: 0.5, cold_reading: 0.3, objective_clarity: 0.2 }, risk: 0.3, nerves: 2, minutes: 11, requires: 'sides_changed' },
      { id: 'ask_for_time', label: 'Ask For Ten More Minutes', detail: 'Reasonable, and it puts the room behind schedule.', weighs: { negotiation_awareness: 0.5, set_etiquette: 0.5 }, risk: 0.6, nerves: -6, minutes: 10, requires: 'sides_changed', frownedOnBy: { casting_associate: 6, producer: 4 } },
    ],
  },
  {
    id: 'walk_in',
    name: 'Walking In',
    what: 'Your name. The door. A camera on a tripod, a reader beside it, and however many people are behind the table.',
    always: true,
    choices: [
      { id: 'warm_brief', label: 'Warm, And Brief', detail: 'Hello, thank you for having me, and then stop talking.', weighs: { set_etiquette: 0.4, charisma: 0.3, collaboration: 0.3 }, risk: 0.1, nerves: -3, minutes: 2 },
      { id: 'straight_to_work', label: 'Straight To Work', detail: '"Where do you want me?" Nothing else.', weighs: { set_etiquette: 0.3, preparation: 0.4, pressure_tolerance: 0.3 }, risk: 0.15, nerves: -1, minutes: 1, favouredBy: { casting_director: 4, producer: 5 } },
      { id: 'make_a_joke', label: 'Make A Joke', detail: 'About the traffic, the corridor, the eleven of you out there.', weighs: { comedy_timing: 0.5, charisma: 0.3, social_instinct: 0.2 }, risk: 0.7, nerves: -6, minutes: 2, favouredBy: { writer: 5, director: 3 }, frownedOnBy: { network_executive: 5, studio_executive: 3 } },
      { id: 'ask_about_part', label: 'Ask Them About The Part', detail: 'One question, before you read, about who she is to him.', weighs: { script_analysis: 0.5, objective_clarity: 0.3, collaboration: 0.2 }, risk: 0.5, nerves: -4, minutes: 3, favouredBy: { director: 6, writer: 6 }, frownedOnBy: { casting_associate: 5 } },
    ],
  },
  {
    id: 'slate',
    name: 'The Slate',
    what: 'The assistant asks for your slate. The camera is already rolling.',
    always: false,
    choices: [
      { id: 'name_only', label: 'Your Name', detail: 'What was asked for and nothing more.', weighs: { set_etiquette: 0.4, camera_awareness: 0.4, diction: 0.2 }, risk: 0, nerves: 0, minutes: 1, requires: 'taped' },
      { id: 'name_agency', label: 'Name And Agency', detail: 'The full slate, the way the office asked when they asked.', weighs: { set_etiquette: 0.5, diction: 0.3, camera_awareness: 0.2 }, risk: 0.1, nerves: 0, minutes: 1, requires: 'taped' },
      { id: 'slate_in_character', label: 'Slate In Character', detail: 'Straight into it, without dropping out. Some rooms love it.', weighs: { charisma: 0.4, camera_awareness: 0.3, magnetism: 0.3 }, risk: 0.8, nerves: 2, minutes: 1, requires: 'taped', favouredBy: { director: 4 }, frownedOnBy: { casting_director: 6, casting_associate: 4 } },
    ],
  },
  {
    id: 'first_read',
    name: 'The Read',
    what: 'The reader gives you the first line. Whatever you decided in the corridor is what you are doing now.',
    always: true,
    choices: [
      { id: 'play_the_text', label: 'Play What Is Written', detail: 'Clean, clear, the scene as it is on the page.', weighs: { script_analysis: 0.3, emotional_truth: 0.3, take_consistency: 0.2, diction: 0.2 }, risk: 0.2, nerves: 0, minutes: 4 },
      { id: 'play_against', label: 'Play Against It', detail: 'The line is angry; you do it amused. If it works nobody in the room forgets you.', weighs: { subtext: 0.4, character_construction: 0.3, emotional_truth: 0.3 }, risk: 0.9, nerves: 4, minutes: 4, favouredBy: { director: 8, writer: 4 }, frownedOnBy: { network_executive: 6, studio_executive: 4 } },
      { id: 'play_small', label: 'Keep It Small', detail: 'Film-size. Almost nothing, and all of it behind the eyes.', weighs: { stillness: 0.35, subtext: 0.25, close_up_work: 0.2, emotional_truth: 0.2 }, risk: 0.4, nerves: -2, minutes: 4, favouredBy: { director: 5 }, frownedOnBy: { network_executive: 3 } },
      { id: 'play_big', label: 'Fill The Room', detail: 'Size, energy, out to the back wall. Reads as commitment or as too much.', weighs: { projection: 0.3, charisma: 0.3, physical_presence: 0.2, magnetism: 0.2 }, risk: 0.6, nerves: -4, minutes: 4, favouredBy: { network_executive: 4, studio_executive: 3 }, frownedOnBy: { director: 4 } },
      { id: 'play_the_reader', label: 'Play The Person Opposite', detail: 'Forget the camera. Do the scene with whoever is reading, however flat they are.', weighs: { active_listening: 0.4, chemistry: 0.25, emotional_truth: 0.2, ensemble_blending: 0.15 }, risk: 0.3, nerves: -3, minutes: 4, requires: 'reader', favouredBy: { director: 6, attached_lead: 8, casting_director: 4 } },
    ],
  },
  {
    id: 'adjustment',
    name: 'The Adjustment',
    what: 'They liked something. Now the director wants it again, differently, and what they are actually testing is whether you can change.',
    always: false,
    choices: [
      { id: 'take_it_exactly', label: 'Do Exactly That', detail: 'Take the note as given and put it in the work.', weighs: { direction_absorption: 0.5, take_consistency: 0.25, note_integration: 0.25 }, risk: 0.2, nerves: -2, minutes: 4, requires: 'director_present', favouredBy: { director: 6, showrunner: 5 } },
      { id: 'take_it_and_add', label: 'Take It And Go Further', detail: 'Do the note, and bring something they did not ask for.', weighs: { direction_absorption: 0.3, improvisation: 0.3, character_construction: 0.2, emotional_truth: 0.2 }, risk: 0.75, nerves: 2, minutes: 4, requires: 'director_present', favouredBy: { director: 7, writer: 4 }, frownedOnBy: { producer: 3 } },
      { id: 'ask_what_they_mean', label: 'Ask What They Mean By It', detail: 'One question, to get the note right rather than guess at it.', weighs: { objective_clarity: 0.4, collaboration: 0.35, script_analysis: 0.25 }, risk: 0.45, nerves: -4, minutes: 3, requires: 'director_present', favouredBy: { director: 3, writer: 3 }, frownedOnBy: { casting_associate: 4, producer: 3 } },
      { id: 'same_again', label: 'Do It The Way You Did It', detail: 'Because it was good the first time. It is the one thing a callback cannot forgive.', weighs: { take_consistency: 0.7, preparation: 0.3 }, risk: 0.5, nerves: 0, minutes: 4, requires: 'director_present', frownedOnBy: { director: 12, showrunner: 10, casting_director: 8 } },
    ],
  },
  {
    id: 'second_read',
    name: 'One More',
    what: 'They want the other scene, or the same one again, and this time nobody is looking at the page.',
    always: false,
    choices: [
      { id: 'off_book', label: 'Off The Page', detail: 'Put the sides down and look at them.', weighs: { memorization: 0.35, emotional_truth: 0.3, camera_awareness: 0.2, take_consistency: 0.15 }, risk: 0.4, nerves: 2, minutes: 4, favouredBy: { director: 4, casting_director: 4 } },
      { id: 'keep_the_page', label: 'Keep The Page In Hand', detail: 'Held low, barely looked at. Nobody has ever been told off for holding the sides.', weighs: { cold_reading: 0.4, emotional_truth: 0.3, take_consistency: 0.3 }, risk: 0.15, nerves: -3, minutes: 4 },
      { id: 'ask_to_go_again', label: 'Ask To Go Again', detail: 'You know it was not it. Asking costs nothing but the room’s patience.', weighs: { resilience: 0.4, pressure_tolerance: 0.3, collaboration: 0.3 }, risk: 0.55, nerves: -2, minutes: 5, favouredBy: { director: 4 }, frownedOnBy: { casting_associate: 5, producer: 4 } },
    ],
  },
  {
    id: 'room_talk',
    name: 'The Chat',
    what: '"What else have you got going on?" It is a friendly question and it is also them finding out whether you are free in April.',
    always: true,
    choices: [
      { id: 'honest_brief', label: 'Answer It Straight', detail: 'What you are doing, in one sentence, and then let it go.', weighs: { interview_poise: 0.4, discretion: 0.3, set_etiquette: 0.3 }, risk: 0.1, nerves: -2, minutes: 3 },
      { id: 'talk_up_slate', label: 'Make It Sound Busy', detail: 'Everything you are up for, at length. Reads as leverage, or as somebody who needs you to know.', weighs: { negotiation_awareness: 0.4, charisma: 0.3, social_instinct: 0.3 }, risk: 0.65, nerves: 2, minutes: 4, favouredBy: { producer: 3 }, frownedOnBy: { casting_director: 5, director: 3 } },
      { id: 'ask_dates', label: 'Ask About The Dates', detail: 'When it shoots and for how long. A working actor’s question.', weighs: { career_strategy: 0.4, negotiation_awareness: 0.3, set_etiquette: 0.3 }, risk: 0.25, nerves: -1, minutes: 2, favouredBy: { producer: 5, casting_director: 3 } },
      { id: 'stay_in_the_work', label: 'Turn It Back To The Script', detail: 'Answer in a word and ask about the ending instead.', weighs: { script_analysis: 0.5, collaboration: 0.3, objective_clarity: 0.2 }, risk: 0.4, nerves: -3, minutes: 3, favouredBy: { writer: 6, director: 4 }, frownedOnBy: { producer: 3 } },
    ],
  },
  {
    id: 'walk_out',
    name: 'Leaving',
    what: 'That is it. Somebody says thank you. The door is nine feet away.',
    always: true,
    choices: [
      { id: 'thank_and_go', label: 'Thank Them And Go', detail: 'The correct answer, almost every time.', weighs: { set_etiquette: 0.6, discretion: 0.4 }, risk: 0, nerves: 0, minutes: 1 },
      { id: 'offer_another', label: 'Offer Them Another', detail: '"I have a different way in if you want it." Sometimes they do.', weighs: { resilience: 0.35, collaboration: 0.35, pressure_tolerance: 0.3 }, risk: 0.6, nerves: 0, minutes: 4, favouredBy: { director: 5 }, frownedOnBy: { casting_associate: 4, producer: 3 } },
      { id: 'one_more_joke', label: 'One More Joke On The Way Out', detail: 'You want to leave them laughing. It is a coin flip and everybody has called it wrong.', weighs: { comedy_timing: 0.5, social_instinct: 0.3, charisma: 0.2 }, risk: 0.75, nerves: 0, minutes: 1, favouredBy: { writer: 4 }, frownedOnBy: { network_executive: 5, studio_executive: 3 } },
      { id: 'ask_a_question', label: 'Ask When They Are Deciding', detail: 'They will not tell you. Asking is not a crime and it is not nothing either.', weighs: { career_strategy: 0.4, interview_poise: 0.3, set_etiquette: 0.3 }, risk: 0.35, nerves: 0, minutes: 2, frownedOnBy: { casting_director: 3 } },
    ],
  },
];

export const BEAT_BY_ID: Readonly<Record<BeatId, Beat>> =
  Object.fromEntries(BEATS.map((b) => [b.id, b])) as Record<BeatId, Beat>;

/**
 * What the director actually says when they give you a note.
 *
 * Real adjustments, of the kind that come across a table: a fact you did not
 * have, a size, a speed, or an instruction so open it is really a test of
 * whether you have anything of your own.
 */
export const ADJUSTMENTS: readonly { note: string; tests: string }[] = [
  { note: 'Same again, but she knows he is lying the whole time.', tests: 'whether a piece of information changes the whole performance' },
  { note: 'He is not angry. He is embarrassed. Go.', tests: 'whether you can replace one engine with another' },
  { note: 'Faster. Do not leave any air in it.', tests: 'pace, and whether the work survives it' },
  { note: 'Less. Half of that.', tests: 'whether there is anything under the size' },
  { note: 'Try it like it is the funniest thing that has ever happened to you.', tests: 'range, and whether you will commit to a bad idea properly' },
  { note: 'Do it to me. Not to the camera, to me.', tests: 'whether you can put it on a person' },
  { note: 'She made up her mind about him in the car, before any of this.', tests: 'whether you play the end of the scene at the beginning' },
  { note: 'Have fun with it. Do whatever you want.', tests: 'whether you have anything without instructions' },
  { note: 'Take out all the pauses you love.', tests: 'whether the choices were choices or habits' },
  { note: 'He has said this to her a hundred times before.', tests: 'history, and whether the words wear it' },
  { note: 'Stand up and do it. No, do not use the chair.', tests: 'whether the body was doing any of the work' },
  { note: 'Whisper it.', tests: 'whether it holds when the volume is taken away' },
];

/** What a room says to itself about somebody, by how it went. */
export const ROOM_VERDICTS: readonly { floor: number; line: string }[] = [
  { floor: 88, line: 'Nobody said anything for a second after the door shut. That is the good silence.' },
  { floor: 76, line: 'The director wrote something down and underlined it.' },
  { floor: 64, line: '"That was a real actor." Said to the room, not to you.' },
  { floor: 52, line: 'Fine. Professional. The kind of read that gets you seen again and not cast.' },
  { floor: 40, line: 'Somebody checked the time.' },
  { floor: 26, line: '"Who sent that?" — asked of the associate, after the door.' },
  { floor: 0, line: 'The next name was called before you were out of the corridor.' },
];

/** How full the corridor is, and who is in it. */
export const WAITING_ROOM_LINES: readonly string[] = [
  'Four of you, all the same height, all in the same jacket.',
  'Somebody is running lines aloud in the corner and everybody hates them.',
  'One of them has clearly done this a hundred times. One of them is shaking.',
  'The person before you has been in there nineteen minutes. That is either very good or very bad.',
  'Nobody is talking. Everybody is reading the same two pages.',
  'A face you know from a commercial. That is who you are actually up against.',
  'The sign-in sheet has eleven names on it and yours is the twelfth.',
];
