/**
 * SLATE — the other studios, and what they are for.
 *
 * They are not opponents. No part of this tries to beat the player, nothing reacts to
 * what the player does, and no rival ever wins anything. They exist to make one number
 * a fact instead of a parameter: **how much of a week was already spoken for.**
 *
 * The first pass had `field` as an argument the caller supplied, which meant the most
 * interesting decision in a release — when to open — had no world behind it. A date
 * cannot be a decision unless something else is already standing on some of them.
 *
 * ## Why they are drawn rather than simulated
 *
 * A rival that develops, casts, commits and releases through the real pipeline would
 * be the same engine run five more times per year, for a result nobody reads except as
 * one number per week. That is a great deal of machinery to compute a shadow.
 *
 * So a studio here is a *release habit*: how often it puts something out, how big that
 * usually is, and which channels it works in. What lands on any given week is drawn
 * from the save's own seed, which makes the calendar deterministic and therefore
 * knowable — a player can look ahead at what is already booked and move their own
 * date, which is the entire point. A rival who behaved unpredictably would make the
 * decision a coin toss rather than a judgement.
 *
 * The honest limit, stated rather than hidden: these studios have no finances, no
 * talent and no history. If a later build wants a rival whose fortunes change, this
 * file is the wrong shape for it and should be replaced rather than extended.
 */

import type { Channel } from './format';

export interface Studio {
  /** Stable id, used as a draw key so a studio's slate does not move when another is added. */
  id: string;
  /** What it is called. */
  name: string;
  /** Roughly how many things it puts out a year. */
  aYear: number;
  /**
   * How much attention one of its releases takes, typically.
   *
   * On the same scale the calendar totals: one is a week-filling event and a tenth is
   * something most people never hear about. Drawn around rather than fixed, because a
   * studio that released the identical size every time would make the calendar a
   * pattern to memorize rather than a thing to read.
   */
  pull: number;
  /** Where it works. A studio that never opens in cinemas cannot crowd one. */
  channels: readonly Channel[];
  /** What it is known for, for a line on a screen. */
  known: string;
}

/**
 * Five, which is enough for a calendar to feel occupied and few enough to read.
 *
 * They differ on the two axes that reach anything — how often, and how big — so that
 * the crowded weeks are crowded by recognizably different things. The big infrequent
 * one is what makes a summer week dangerous; the small frequent one is the background
 * everybody opens against.
 */
export const STUDIOS: readonly Studio[] = [
  {
    id: 'meridian',
    name: 'Meridian',
    aYear: 4,
    pull: 0.82,
    channels: ['theatrical'],
    known: 'Four a year, all of them enormous, all of them in summer or at Christmas.',
  },
  {
    id: 'kestrel',
    name: 'Kestrel Pictures',
    aYear: 9,
    pull: 0.34,
    channels: ['theatrical', 'streaming'],
    known: 'Steady, mid-sized, and everywhere. The background any opening happens against.',
  },
  {
    id: 'northgate',
    name: 'Northgate',
    aYear: 14,
    pull: 0.16,
    channels: ['broadcast', 'streaming'],
    known: 'Volume. Most of it goes straight to a service and some of it finds an audience.',
  },
  {
    id: 'aubade',
    name: 'Aubade',
    aYear: 3,
    pull: 0.45,
    channels: ['theatrical'],
    known: 'Three a year, awards-shaped, and they all open in the same two months.',
  },
  {
    id: 'halvard',
    name: 'Halvard & Co.',
    aYear: 6,
    pull: 0.28,
    channels: ['broadcast'],
    known: 'Broadcast only, and reliably. Never in a cinema and never in anybody’s way there.',
  },
];

export const STUDIO_BY_ID: Readonly<Record<string, Studio>> = Object.fromEntries(
  STUDIOS.map((s) => [s.id, s]),
);

/** The studios that can crowd a given channel. */
export const studiosOn = (channel: Channel): readonly Studio[] =>
  STUDIOS.filter((s) => s.channels.includes(channel));

/**
 * How much attention a week holds before anything is crowded at all.
 *
 * Above one so that a single ordinary release does not crowd itself, and low enough
 * that two large ones in a week genuinely hurt each other. This is the figure that
 * decides whether the calendar is a real constraint or set dressing, and it was set by
 * asking what a week should feel like rather than measured off anything.
 */
export const A_WEEK_HOLDS = 1.4;

/**
 * Which studios like which months, as a weight per month from January.
 *
 * The reason the calendar has shape rather than being uniformly busy. Meridian and
 * Aubade cluster hard — one on summer and the end of the year, the other on the two
 * months before the awards — and the volume studios spread flat. So the best months
 * for an audience are also the most dangerous months to open in, which is the tension
 * the whole mechanic exists to produce.
 */
export const WHEN_THEY_OPEN: Readonly<Record<string, readonly number[]>> = {
  meridian: [0.2, 0.2, 0.4, 0.6, 1.4, 2.2, 2.4, 1.6, 0.4, 0.5, 1.2, 2.2],
  kestrel: [0.8, 0.9, 1.0, 1.0, 1.1, 1.2, 1.2, 1.1, 0.9, 1.0, 1.1, 1.1],
  northgate: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
  aubade: [0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.3, 0.4, 1.2, 2.6, 2.8, 1.0],
  halvard: [1.1, 1.1, 1.0, 1.0, 0.9, 0.7, 0.6, 0.8, 1.2, 1.3, 1.2, 1.0],
};
