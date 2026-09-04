/**
 * SLATE — the phrases the trade press writes with.
 *
 * A frame is a sentence with holes in it. These are what goes in the holes.
 * Six frames with three of these slots each is not six sentences; it is
 * several hundred, and that is where the variety in the coverage comes from
 * without every single one having to be written out by hand.
 *
 * Everything here is ordinary industry English. None of it names a real
 * publication's house style, and none of it is quoted from anybody.
 */

import type { Rng } from '../core/rng';
import type { Register } from './press';
import type { Voice } from './press-story';

/** One of a bank, drawn from the story's own seeded stream. */
export function one(rng: Rng, bank: readonly string[]): string {
  return bank[rng.int(0, bank.length - 1)] ?? bank[0] ?? '';
}

/** One of a bank, weighted to the front. Used where the first options read best. */
export function lean(rng: Rng, bank: readonly string[]): string {
  const roll = rng.next();
  const span = Math.max(1, Math.ceil(bank.length * (roll < 0.55 ? 0.4 : roll < 0.85 ? 0.75 : 1)));
  return bank[rng.int(0, span - 1)] ?? bank[0] ?? '';
}

// ---------------------------------------------------------------------------
// Attribution — how a piece says where it got something
// ---------------------------------------------------------------------------

export const SOURCED: readonly string[] = [
  'according to people with knowledge of the deal',
  'according to sources close to the production',
  'according to two people briefed on the talks',
  'according to people familiar with the arrangement',
  'according to a person who has seen the paperwork',
  'according to people on both sides of the negotiation',
  'according to someone involved in putting it together',
  'sources say',
  'people close to the film say',
  'those involved say',
  'people who have read it say',
  'insiders say',
];

/**
 * How a piece says something was confirmed.
 *
 * None of these carries a time of its own, because every frame that uses one
 * supplies its own — 'a spokesperson confirmed on Tuesday' works, and 'the
 * announcement came without a statement quietly, over the weekend' does not.
 */
export const CONFIRMED: readonly string[] = [
  'the studio confirmed',
  'the company said in a statement',
  'a spokesperson confirmed',
  'the production confirmed',
  'representatives for both sides confirmed',
  'the company put out a one-line statement',
  'the announcement was made',
  'both parties confirmed',
  'the news was made public',
];

export const UNCONFIRMED: readonly string[] = [
  'though nothing has been signed',
  'though the deal is not yet papered',
  'though neither side would comment',
  'though the studio declined to comment',
  'though representatives did not respond',
  'though it has not been announced',
  'though the terms are not being disclosed',
  'though nobody would put a figure on it',
];

// ---------------------------------------------------------------------------
// Timing
// ---------------------------------------------------------------------------

export const WHEN: readonly string[] = [
  'this week', 'on Tuesday', 'overnight', 'late on Friday', 'this morning',
  'after months of talks', 'after a short negotiation', 'ahead of the market',
  'in the last few days', 'quietly, over the weekend', 'earlier today',
  'after a week of speculation',
];

export const SOON: readonly string[] = [
  'in the spring', 'before the end of the year', 'in the new year',
  'over the summer', 'in the autumn', 'within months', 'early next year',
  'once the schedule allows', 'as soon as the cast are free',
];

export const HOW_LONG: readonly string[] = [
  'for the best part of a year', 'for eighteen months', 'since last autumn',
  'for longer than anybody expected', 'since the project first surfaced',
  'for the better part of two years', 'since the rights changed hands',
];

// ---------------------------------------------------------------------------
// Scale and shape
// ---------------------------------------------------------------------------

export const SIZE_BIG: readonly string[] = [
  'a tentpole', 'a swing at scale', 'one of the bigger bets on the slate',
  'a picture built for a wide opening', 'a summer-sized production',
  'the kind of budget that has to work', 'a four-quadrant play',
];

export const SIZE_MID: readonly string[] = [
  'a mid-budget picture of the kind the studios keep saying they miss',
  'a grown-up film at a sensible price', 'a picture priced to work',
  'the sort of film that used to be the whole business',
  'a modestly budgeted feature', 'a picture that does not need a miracle',
];

export const SIZE_SMALL: readonly string[] = [
  'an independent production', 'a small film with a specific idea of itself',
  'a picture made for less than a studio spends on a trailer',
  'a low-budget feature', 'a film financed outside the system',
  'a picture that will live or die on reviews',
];

/**
 * Tone in predicate position — after 'has landed', 'came out', 'reads as'.
 * These are adjectival; the noun-phrase banks below take an article and cannot
 * be used the same way.
 */
export const READS_GOOD: readonly string[] = [
  'very well', 'about as well as anybody hoped', 'strongly',
  'better than the picture around it deserves', 'warmly', 'unusually well',
];

export const READS_MIXED: readonly string[] = [
  'somewhere in the middle', 'divided', 'politely rather than warmly',
  'better in parts than as a whole', 'respectfully and no further', 'unevenly',
];

export const READS_BAD: readonly string[] = [
  'badly', 'about as poorly as these things go', 'coldly',
  'worse than anybody at the company expected', 'flatly', 'without a defender in the room',
];

export const TONE_GOOD: readonly string[] = [
  'the strongest thing on the slate', 'the one people keep bringing up',
  'a genuine piece of work', 'better than it needed to be',
  'the sort of film that justifies the year', 'unmistakably good',
];

export const TONE_MIXED: readonly string[] = [
  'a picture at war with itself', 'good in parts and lost in others',
  'admirable rather than successful', 'more interesting than satisfying',
  'the right idea in the wrong shape', 'never quite the film it is reaching for',
];

export const TONE_BAD: readonly string[] = [
  'a misfire', 'not close to working', 'inert',
  'a picture that never finds a reason to exist', 'badly out of shape',
  'the kind of failure nobody can be blamed for individually',
];

// ---------------------------------------------------------------------------
// Business framing
// ---------------------------------------------------------------------------

export const MARKET_MOOD: readonly string[] = [
  'in a market that has been rewarding almost nothing',
  'in a year that has been kind to very little',
  'at a moment when the business is nervous about everything it cannot franchise',
  'against a slate that has been thinning out for two years',
  'while the rest of the calendar looks soft',
  'in a quarter the whole business would like to forget',
  'as the studios keep narrowing what they will pay for',
  'while everyone waits to see whether the audience comes back for this kind of thing',
];

/**
 * What a company has been doing, written so it can follow either 'it is' or
 * 'a company that has been'. Every entry is a present participle or an
 * adjectival phrase for that reason; a noun phrase here breaks half the frames
 * that use it.
 */
/**
 * The same mood as a sentence rather than a clause.
 *
 * MARKET_MOOD is written to hang off the end of another sentence, and every
 * frame that wanted to lead with it was hacking the preposition off the front
 * and leaving a fragment. These stand alone.
 */
export const MOOD_SENTENCE: readonly string[] = [
  'The market has been rewarding almost nothing.',
  'It has been a year that was kind to very little.',
  'The business is nervous about anything it cannot franchise.',
  'The slate has been thinning out for two years.',
  'The rest of the calendar looks soft.',
  'It has been a quarter the whole business would like to forget.',
  'The studios keep narrowing what they will pay for.',
  'Nobody is sure the audience comes back for this kind of thing.',
  'Everything costs more than it did and returns less.',
  'There is more money in the business than there is confidence.',
];

export const STRATEGY: readonly string[] = [
  'pushing hard into material with a built-in audience',
  'buying exactly this all year',
  'moving away from what it used to make',
  'taking on its third film of the kind this year',
  'saying publicly that it was getting out of this',
  'quietly rebuilding a slate it spent two years cutting',
  'making the bets a company makes when the rest of the slate is set',
  'paying above the market for anything with a title attached',
  'spending less and announcing more',
  'chasing the audience that stopped turning up',
];

export const RISK: readonly string[] = [
  'the risk is entirely in the number',
  'nothing about the arithmetic is comfortable',
  'the maths only works if it travels',
  'it has to open, and openings are the part nobody controls',
  'the downside is survivable and the upside is not enormous',
  'there is no version of this that is cheap',
  'the money is recoverable if the reviews land',
];

// ---------------------------------------------------------------------------
// People framing
// ---------------------------------------------------------------------------

export const CAREER_UP: readonly string[] = [
  'the best position they have been in',
  'a considerable step up',
  'the sort of job that changes what somebody is offered next',
  'a long way from where they started',
  'the busiest stretch of their career',
];

export const CAREER_STEADY: readonly string[] = [
  'the kind of work they have been doing for years',
  'squarely in what they do',
  'unsurprising, and none the worse for it',
  'the sort of part they are always sent',
];

export const CAREER_TURN: readonly string[] = [
  'a deliberate turn away from what made them famous',
  'nothing like anything else they have done',
  'a swerve, and an interesting one',
  'the first time they have taken on anything of this kind',
];

// ---------------------------------------------------------------------------
// Hedges, qualifiers and the small print
// ---------------------------------------------------------------------------

export const HEDGE: readonly string[] = [
  'if it holds', 'assuming nothing moves', 'on current plans',
  'barring a change of heart', 'if the schedule survives contact with the cast',
  'for now', 'subject to the usual conditions',
];

/**
 * The line that qualifies whatever has just been asserted.
 *
 * Deliberately general: this bank is shared by every desk, so anything here
 * has to be true of a greenlight, an opening weekend and an executive move
 * alike. A caveat that only makes sense in development belongs in a
 * development frame, not here.
 */
export const CAVEAT: readonly string[] = [
  'None of this is unusual and none of it is guaranteed.',
  'Everything at this stage is reversible.',
  'The industry has broken more of these than it has kept.',
  'What it means will not be clear for a year.',
  'The number is the easy part to report and the hard part to read.',
  'Everybody involved has a reason to want it reported this way.',
  'There is a version of this that looks entirely different in six months.',
];

// ---------------------------------------------------------------------------
// Endings by register
// ---------------------------------------------------------------------------

export const SIGN_OFF: Readonly<Record<Register, readonly string[]>> = {
  scoop: [
    'More as it firms up.',
    'The rest of the deal is still being papered.',
    'Watch the dating.',
    'Expect the rest of the cast within a fortnight.',
    'We hear the announcement is days away.',
  ],
  business: [
    'The company would not put a figure on the exposure.',
    'Analysts had modelled something smaller.',
    'The write-down, if there is one, lands next quarter.',
    'The economics are the story here, not the film.',
    'Whether the shareholders share the enthusiasm is another matter.',
  ],
  balanced: [
    'Neither side would discuss terms.',
    'How it plays out will not be clear for a year.',
    'Both readings of it are defensible.',
    'The answer will be in the opening.',
    'It is early, and the industry is bad at early.',
  ],
  critical: [
    'Whether any of that matters is a question for the film itself.',
    'None of which tells you whether it is any good.',
    'The work will settle this, as it always does.',
    'The commerce is legible; the picture is not, yet.',
    'It would be a shame if the number were the only thing anybody remembered.',
  ],
  enthusiast: [
    'On this evidence, it is worth being excited about.',
    'File under things to look forward to.',
    'We will take it.',
    'There is a version of this that is enormous.',
    'Fingers crossed.',
  ],
  essay: [
    'What that says about the moment is a longer argument than this.',
    'The interesting question is not whether it works but what it is for.',
    'Films like this used to be the middle of the business; now they are the edge of it.',
    'It is worth asking what a slate made entirely of these would look like.',
    'The answer, as usual, is somewhere in what does not get made.',
  ],
  wire: [
    'The company did not respond to a request for comment.',
    'Terms were not disclosed.',
    'Additional reporting from the market.',
    'The figures are as reported.',
    'No further details were given.',
  ],
  aggregate: [
    'Figures are provisional and revise on Monday.',
    'The score updates as reviews come in.',
    'Counts are as of this morning.',
    'The average is weighted; the percentage is not.',
    'Totals include previews.',
  ],
};

/** A close in the outlet's own register. */
export function signOff(rng: Rng, v: Voice): string {
  return one(rng, SIGN_OFF[v.register]);
}

// ---------------------------------------------------------------------------
// Small helpers the frames use constantly
// ---------------------------------------------------------------------------

/** 'a' or 'an', which no template should ever get wrong. */
export function article(word: string): string {
  return /^[aeiou]/i.test(word.trim()) ? 'an' : 'a';
}

/** A list as English writes it: 'a, b and c'. */
export function list(items: readonly string[], max = 3): string {
  const shown = items.slice(0, max);
  if (shown.length === 0) return '';
  if (shown.length === 1) return shown[0]!;
  return `${shown.slice(0, -1).join(', ')} and ${shown[shown.length - 1]}`;
}

/** A percentage as a piece would print it. */
export function percent(value: number): string {
  return `${Math.round(value)}%`;
}

/** A count with its noun, pluralised. */
export function count(n: number, singular: string, plural = `${singular}s`): string {
  return `${n.toLocaleString('en-US')} ${n === 1 ? singular : plural}`;
}
