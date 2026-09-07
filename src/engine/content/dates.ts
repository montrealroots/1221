/**
 * SLATE — what a date is made of.
 *
 * Five ways to spend the time, each tied to the kind of place it happens in;
 * the moves you can make across a table; how the other person answers,
 * in a voice that is theirs; and the ways an evening can end. None of it
 * changes the world on its own — the dating system decides what a move is
 * worth and the relationship keeps the score.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { speak } from '../dialogue/library';
import type { PlaceKind } from './places';

export interface DateActivity {
  id: string;
  label: string;
  placeKinds: readonly PlaceKind[];
  minutes: number;
  /** What sitting down costs, as a price tier the place's own pricing turns into money; 0 for a walk. */
  tier: 0 | 1 | 2 | 3 | 4;
  opener: string;
}

export const DATE_ACTIVITIES: readonly DateActivity[] = [
  { id: 'dinner', label: 'Dinner', placeKinds: ['restaurant'], minutes: 150, tier: 3, opener: 'A table by the window, and a menu neither of you reads.' },
  { id: 'drinks', label: 'Drinks', placeKinds: ['bar', 'club', 'hotel'], minutes: 120, tier: 2, opener: 'Two seats at the bar and enough noise to lean in over.' },
  { id: 'coffee', label: 'Coffee', placeKinds: ['cafe'], minutes: 60, tier: 1, opener: 'A corner table and an hour that could be ten minutes or three.' },
  { id: 'film', label: 'See Something', placeKinds: ['cinema', 'theatre'], minutes: 180, tier: 2, opener: 'Two tickets and the strange closeness of watching something side by side.' },
  { id: 'walk', label: 'A Walk Somewhere', placeKinds: ['park', 'beach', 'viewpoint', 'landmark'], minutes: 90, tier: 0, opener: 'No table, no bill, nothing to hide behind.' },
];

export const DATE_ACTIVITY_BY_ID: Readonly<Record<string, DateActivity>> = Object.fromEntries(DATE_ACTIVITIES.map((a) => [a.id, a]));

export type MoveKind = 'ask' | 'share' | 'listen' | 'joke' | 'flirt' | 'deep' | 'work' | 'order' | 'phone';

export interface DateMove {
  id: MoveKind;
  label: string;
  aliases: readonly string[];
  cue: string;
  /** What it is worth when it lands, in chemistry. */
  base: number;
  /** How far either way the evening can take it. */
  variance: number;
  /** Chemistry it needs before it can land at all. */
  needs?: number;
  /** Costs money, at the place's prices. */
  spends?: boolean;
  /** What the other person will remember you talked about. */
  topic?: string;
}

export const MOVES: readonly DateMove[] = [
  { id: 'ask', label: 'Ask About Them', aliases: ['ask', 'question', 'about them'], cue: 'People like being asked.', base: 8, variance: 5, topic: 'them' },
  { id: 'share', label: 'Tell Them Something About You', aliases: ['share', 'tell', 'about me', 'myself'], cue: 'Give them something to hold.', base: 6, variance: 6, topic: 'you' },
  { id: 'listen', label: 'Let Them Talk', aliases: ['listen', 'quiet', 'let them'], cue: 'Say less. Hear more.', base: 7, variance: 4, topic: 'their life' },
  { id: 'joke', label: 'Make Them Laugh', aliases: ['joke', 'funny', 'laugh'], cue: 'It either lands or it does not.', base: 5, variance: 11 },
  { id: 'flirt', label: 'Flirt A Little', aliases: ['flirt', 'charm'], cue: 'Only when it is going somewhere.', base: 9, variance: 8, needs: 45 },
  { id: 'deep', label: 'Say Something True', aliases: ['true', 'honest', 'real', 'deep'], cue: 'The conversation that changes things, either way.', base: 12, variance: 10, needs: 55, topic: 'something true' },
  { id: 'work', label: 'Talk About The Work', aliases: ['work', 'the industry', 'business'], cue: 'Interesting to you. Possibly to them.', base: 3, variance: 6, topic: 'the work' },
  { id: 'order', label: 'Order Another Round', aliases: ['order', 'round', 'another', 'drinks'], cue: 'Time bought at the bar’s prices.', base: 4, variance: 3, spends: true },
  { id: 'phone', label: 'Check Your Phone', aliases: ['phone', 'messages', 'check'], cue: 'They notice. They always notice.', base: -8, variance: 2 },
];

export const MOVE_BY_ID: Readonly<Record<string, DateMove>> = Object.fromEntries(MOVES.map((m) => [m.id, m]));

export type MoveResult = 'good' | 'flat' | 'bad';

/** The voice a person answers in. Read from who they are, not rolled. */
export type Tone = 'warm' | 'dry' | 'guarded';

export function toneOf(person: Person): Tone {
  if (person.personality.agreeableness >= 60) return 'warm';
  if (person.personality.extraversion >= 60) return 'dry';
  return 'guarded';
}

/**
 * How they answer a move, in their own voice: the library's line for the
 * move and the outcome, filtered by tone, and sometimes a second sentence
 * of color. Seeded, so the same evening reads the same twice; recorded,
 * so the same person does not say the same thing next week.
 */
export function replyFor(sim: Simulation, move: MoveKind, result: MoveResult, tone: Tone, salt: string | number): string {
  const main = speak(sim, { section: 'dating', purpose: 'reply', beat: 'table' }, { move, result, tone }, salt);
  const rng = sim.rng('colour', String(salt), move, result);
  if (!rng.chance(0.45)) return main.text;
  const colour = speak(sim, { section: 'dating', purpose: 'colour', beat: 'table' }, { tone, result }, salt);
  return colour.fallback ? main.text : `${main.text} ${colour.text}`;
}

export interface CloseMove {
  id: 'walk' | 'kiss' | 'call' | 'again' | 'night';
  label: string;
  aliases: readonly string[];
  detail: string;
  /** Chemistry it needs before it is offered as a live choice. */
  needs?: number;
  /** What you are promising, if it is a promise. */
  promise?: string;
}

export const CLOSES: readonly CloseMove[] = [
  { id: 'walk', label: 'Walk Them Home', aliases: ['walk', 'walk them', 'home'], detail: 'Twenty minutes more, and no bill.' },
  { id: 'kiss', label: 'Kiss Them Goodnight', aliases: ['kiss', 'goodnight kiss'], detail: 'Only if the evening has earned it.', needs: 60 },
  { id: 'call', label: 'Say You Will Call', aliases: ['call', 'promise to call', 'i will call'], detail: 'They will remember whether you did.', promise: 'call' },
  { id: 'again', label: 'Suggest Doing This Again', aliases: ['again', 'second date', 'see you again'], detail: 'Then it is on you to arrange it.', needs: 50, promise: 'again' },
  { id: 'night', label: 'Call It A Night', aliases: ['night', 'done', 'leave', 'go home'], detail: 'Thank them and go.' },
];

export const CLOSE_BY_ID: Readonly<Record<string, CloseMove>> = Object.fromEntries(CLOSES.map((c) => [c.id, c]));

/** The evening in one word, as you would feel it from the inside. */
export function chemistryWord(chemistry: number): string {
  if (chemistry >= 75) return 'Electric';
  if (chemistry >= 60) return 'Warm';
  if (chemistry >= 45) return 'Easy';
  if (chemistry >= 30) return 'Flat';
  return 'Cold';
}
