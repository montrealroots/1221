/**
 * SLATE — what a date is made of.
 *
 * Five ways to spend the time, each tied to the kind of place it happens in;
 * the moves you can make across a table; how the other person answers,
 * in a voice that is theirs; and the ways an evening can end. None of it
 * changes the world on its own — the dating system decides what a move is
 * worth and the relationship keeps the score.
 */

import type { Rng } from '../core/rng';
import type { Person } from '../domain/model';
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

const REPLIES: Readonly<Record<MoveKind, Readonly<Record<MoveResult, readonly string[]>>>> = {
  ask: {
    good: ['They light up, and you get the long version.', 'Nobody has asked them that in a while. They tell you.', 'They answer properly, and then ask you the same thing back.'],
    flat: ['They give you the short version.', 'A polite answer. The subject does not catch.', 'They tell you, and the conversation waits for the next thing.'],
    bad: ['Wrong question. Something closes behind their eyes for a moment.', 'They answer, and you can tell they have answered it too many times.'],
  },
  share: {
    good: ['They lean in. That was the right thing to give them.', 'They laugh in the right place and remember a thing of their own.', 'You can see them file it away. In a good way.'],
    flat: ['They nod. It lands somewhere, but not far.', 'A story that was better in your head.', 'They are listening; they are just not sure why you told them that.'],
    bad: ['Too much, too early. They look at their glass.', 'You hear it as you say it, and so do they.'],
  },
  listen: {
    good: ['They talk, and then talk some more, and then catch themselves and grin.', 'Given the room, they say something they had not planned to.', 'You learn three things. One of them matters.'],
    flat: ['They talk for a while about nothing in particular.', 'A comfortable silence, then a small story.', 'You listen. It is fine.'],
    bad: ['They run out of things to say and you have nothing ready.', 'The quiet gets long. They check the time.'],
  },
  joke: {
    good: ['They laugh — properly, head back.', 'They laugh and then say you should not have said that, and laugh again.', 'It lands. They steal the punchline for later.'],
    flat: ['A smile. Not a laugh.', 'They get it. That is all.', 'Half a laugh, out of kindness.'],
    bad: ['It does not land. The silence is the joke now.', 'They do the face people do when they are deciding whether you meant it.'],
  },
  flirt: {
    good: ['They hold your eye a beat longer than they need to.', 'They flirt back, better than you did.', 'Something in the air changes and neither of you mentions it.'],
    flat: ['They smile and change the subject, gently.', 'Noted, not returned. Not refused either.'],
    bad: ['Too soon. They sit back a little.', 'They laugh it off and the temperature drops a degree.'],
  },
  deep: {
    good: ['They go quiet, then say something true back. That is the evening now.', 'They put their glass down. "Say that again."', 'It lands where it was aimed. They take your hand for a second.'],
    flat: ['They hear it. They are not ready to answer it.', 'A long pause, then something safe.'],
    bad: ['Too heavy for the table you are at. They look for the waiter.', 'They say "wow", and not the good kind.'],
  },
  work: {
    good: ['Turns out they have opinions about the business, and good ones.', 'They ask the sharp question, and you realise you like being asked it.', 'Shop talk, but the kind that turns into something else.'],
    flat: ['They ask a polite question about it. You answer. That is that.', 'They know the names. They do not care about the names.'],
    bad: ['You have been talking about work for eleven minutes. They have counted.', 'They glaze. Politely, but they glaze.'],
  },
  order: {
    good: ['Another round, and the evening gets its second wind.', 'They say they should not, and then they do.'],
    flat: ['Another round. The conversation carries on where it was.', 'Drinks arrive. Nothing changes but the glasses.'],
    bad: ['They cover their glass. "I am fine, actually."', 'One too many. You can feel the evening tilt.'],
  },
  phone: {
    good: ['You glance down. They are gracious about it. Once.'],
    flat: ['You check it. They wait. Something is spent.'],
    bad: ['They see you look, and see you look again, and stop talking until you look up.', '"Anything important?" It was not.'],
  },
};

const COLOUR: Readonly<Record<Tone, Readonly<Record<MoveResult, readonly string[]>>>> = {
  warm: { good: ['They are easy to be with.', 'They make it easy.'], flat: ['They are kind about it.'], bad: ['They are kind about it, which is worse.'] },
  dry: { good: ['They have a line for it, and it is a good one.', 'They are funnier than you expected.'], flat: ['A dry remark. Fair.'], bad: ['The remark they make about it is very dry indeed.'] },
  guarded: { good: ['They open a door they usually keep shut.', 'That is more than they give most people.'], flat: ['They keep something back.'], bad: ['The shutters come down, gently.'] },
};

/** How they answer a move, in their own voice. Seeded, so the same evening reads the same twice. */
export function replyFor(move: MoveKind, result: MoveResult, tone: Tone, rng: Rng): string {
  const line = rng.pick([...REPLIES[move][result]]);
  return rng.chance(0.45) ? `${line} ${rng.pick([...COLOUR[tone][result]])}` : line;
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
