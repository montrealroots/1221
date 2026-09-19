/**
 * SLATE — the library market, where a finished picture is a thing that can change hands.
 *
 * Everything else in the production system ended at the last window. A picture opened,
 * ran, paid out over a year and a bit, and then sat there as a row in a ledger that
 * nothing would ever touch again. That is not what a library is. A library is an asset,
 * and the whole second half of this business is people buying and selling the tail of
 * somebody else's work.
 *
 * ## Why selling is not simply a discount
 *
 * The first shape this took was a flat haircut: what is left to pay, minus a third,
 * take it or leave it. It failed the falsifiability test in the most boring way — the
 * answer was always leave it, because a certain discount on a deterministic remainder
 * is strictly worse than waiting. One sentence changed, no outcome did.
 *
 * So the buyers are not one buyer. Each has a channel it works in and a price it pays,
 * and the price reads what people said about the picture. A studio that wants cinema
 * libraries will pay **over** the remainder for something beloved, and nobody will pay
 * half for something nobody liked. Selling is then a real question with a different
 * answer per picture: the tail of a hit is worth more to somebody who wants it than it
 * is worth to you, and the tail of a failure is worth more to you than the market will
 * give — which is exactly backwards from what a producer expects, and is the point.
 *
 * ## What an award adds, which is nothing, and why
 *
 * The first draft of this file had a lift per award on the asking price. It was deleted
 * before it shipped. A win already multiplies the windows that have not opened yet
 * through `Opening.liftedBy`, and the remainder is computed from those windows — so a
 * second lift here would have paid for the same trophy twice. It is written down in the
 * past tense so that nobody re-derives it.
 */

import type { Channel } from './format';

/**
 * What a buyer keeps for carrying a run they did not make.
 *
 * The base discount, before appetite and before what people said. A third is steep,
 * and it has to be: it is the floor the two adjustments move off, and a floor near
 * parity would make every sale a coin toss about rounding.
 */
export const A_BUYER_KEEPS = 0.34;

/**
 * How far word of mouth moves the price, either way.
 *
 * Large on purpose. At the top of the range a beloved picture sold to a studio that
 * wants it clears more than holding it would have paid, and at the bottom a picture
 * nobody liked fetches about half. Those two facts are the whole market.
 */
export const A_RECORD_IS_WORTH = 0.55;

/**
 * The soonest anybody will quote, in weeks from the opening.
 *
 * Nobody buys a library position off an opening weekend. Three weeks in, the shape of
 * the run is legible, and until then the remainder is almost the whole reckoning — so
 * an instant sale would be a way to turn a reckoning into cash before the world had
 * had a chance to disagree with it.
 */
export const SOONEST_WEEK = 3;

export interface Appetite {
  /** Which studio, by id from `content/rivals.ts`. */
  studioId: string;
  /** Which channels' libraries it will quote on at all. */
  channels: readonly Channel[];
  /**
   * What it pays against the discounted remainder.
   *
   * Above one for a studio that actively wants the thing, below one for a studio
   * taking it off your hands. Multiplied by what people said, so the range a picture
   * can fetch across the five of them is about two and a half to one.
   */
  pays: number;
  /** What it is after, for a line on a screen. */
  wants: string;
}

/**
 * The five, and what each of them is in the market for.
 *
 * The same studios that crowd the release calendar, which is deliberate: a player who
 * has learned that Meridian opens enormous pictures in July should find that Meridian
 * is also the one that pays over the odds for a cinema library. One set of names doing
 * two jobs is a world; two sets doing one each is a menu.
 */
export const APPETITES: readonly Appetite[] = [
  {
    studioId: 'meridian',
    channels: ['theatrical'],
    pays: 1.16,
    wants: 'Cinema, and pays over the odds for anything an audience loved.',
  },
  {
    studioId: 'kestrel',
    channels: ['theatrical', 'streaming'],
    pays: 1.0,
    wants: 'Anything with a run left in it. The price is the price.',
  },
  {
    studioId: 'northgate',
    channels: ['broadcast', 'streaming'],
    pays: 0.78,
    wants: 'Volume, cheaply. It takes what nobody else wants and says so.',
  },
  {
    studioId: 'aubade',
    channels: ['theatrical'],
    pays: 1.08,
    wants: 'Pictures people talked about. It is buying the reputation, not the run.',
  },
  {
    studioId: 'halvard',
    channels: ['broadcast'],
    pays: 0.95,
    wants: 'Broadcast libraries, steadily, and never anything else.',
  },
];

export const APPETITE_BY_STUDIO: Readonly<Record<string, Appetite>> = Object.fromEntries(
  APPETITES.map((a) => [a.studioId, a]),
);

/** Who will quote on a library in this channel. */
export const buyersOn = (channel: Channel): readonly Appetite[] =>
  APPETITES.filter((a) => a.channels.includes(channel));

/**
 * What one buyer offers for what is left of a run.
 *
 * `leftCents` is computed from the same window tables that pay it, so this cannot
 * drift from the thing it prices. Everything else here is the market's opinion.
 */
export function offerOn(appetite: Appetite, leftCents: number, wordOfMouth: number): number {
  const confidence = 1 + Math.max(-1, Math.min(1, wordOfMouth)) * A_RECORD_IS_WORTH;
  return Math.max(0, Math.round(leftCents * (1 - A_BUYER_KEEPS) * appetite.pays * confidence));
}

/**
 * Why a buyer will not quote, where it will not.
 *
 * A refusal with a reason rather than an absent row, because a player who cannot see
 * that Halvard is there at all cannot learn that Halvard only does broadcast.
 */
export function whyNotQuote(appetite: Appetite, channel: Channel, week: number): string | undefined {
  if (!appetite.channels.includes(channel)) return 'Not a channel they work in.';
  if (week < SOONEST_WEEK) return `Too early. Nobody quotes before week ${SOONEST_WEEK}.`;
  return undefined;
}

// ---------------------------------------------------------------------------
// The other side of it: what the rivals have for sale
// ---------------------------------------------------------------------------

/**
 * How many library positions are on the market in any given month.
 *
 * Small. A market with twenty rows is a spreadsheet to optimize; a market with two or
 * three is a decision about whether either of them is worth the cash.
 */
export const MOST_ON_THE_MARKET = 3;

/**
 * How far an asking price strays from what the position is actually worth.
 *
 * The reason buying is a judgement rather than arithmetic. At the low end a seller is
 * clearing a position and the buyer makes money on the spread; at the high end they
 * are fishing, and a player who pays it has overpaid by a third. Nothing hides which
 * is which — the remainder is shown beside the price — so this rewards reading rather
 * than luck, and a player who never buys a dear one is playing correctly.
 */
export const ASKING_STRAYS = 0.36;

/**
 * Words a rival's picture is called, in two halves.
 *
 * Titles are generated because a fixed list of forty repeats inside two played years,
 * and because a title carries no mechanics — nothing reads these strings but the
 * screen. They are here rather than in the world file so that the market logic has no
 * prose in it at all.
 */
export const TITLE_FIRST: readonly string[] = [
  'The Quiet', 'Low', 'Northern', 'The Last', 'Falling', 'The Sixth', 'Hollow',
  'Bright', 'The Narrow', 'Winter', 'The Second', 'Salt', 'The Longest', 'Iron',
  'The Other', 'Small', 'The Burning', 'Nine', 'The Empty', 'Slow',
];

export const TITLE_SECOND: readonly string[] = [
  'Harbor', 'Country', 'Season', 'Hours', 'Light', 'Winter', 'House', 'Road',
  'Water', 'Summer', 'Window', 'Crossing', 'Ground', 'Weather', 'Mornings',
  'Coast', 'Bell', 'Field', 'Passage', 'Dark',
];

/** A title from two draws, which is enough spread that a played decade rarely repeats. */
export const titleFrom = (a: number, b: number): string =>
  `${TITLE_FIRST[a % TITLE_FIRST.length]} ${TITLE_SECOND[b % TITLE_SECOND.length]}`;
