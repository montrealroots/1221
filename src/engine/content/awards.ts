/**
 * SLATE — what the industry says about the work, once a year.
 *
 * ## What this deliberately is not
 *
 * `docs/AWARDS.md` closes with a section headed "The thing to refuse", and it is
 * the reason this file is ninety lines rather than nine hundred:
 *
 *   > Do not build the festival circuit first. A named-ceremony content table —
 *   > the academies, the categories, the voting bodies — is the part that reads
 *   > as an awards feature and the part that decides nothing, and this build has
 *   > already paid for that mistake twice over in a hundred and five id
 *   > namespaces and 199 lines of record shapes for a game it is not.
 *
 * So there are no academies here, no categories, no juries and no red carpet.
 * There is one judgement a year on the pictures that were finished, and the only
 * thing it produces is a number on the people who made them. The ceremony is the
 * last thing to build and the easiest; the number that moves because of it is the
 * whole of the work.
 *
 * ## What is real here and what is ours
 *
 * Nothing in this file is quoted from any awards body, because naming one would
 * be inventing its opinion. Every figure is SLATE's own and the shape they are
 * fitted to is the one thing about awards that is reliably true: **the work that
 * gets noticed is not the work that sells**. A season nominates a small number of
 * things out of everything eligible, most of what is nominated does not win, and
 * neither the nomination nor the win is settled by the budget.
 */

import type { Money } from '../core/money';

/** The month the year's judgement lands, and the year it judges. */
export const AWARDS_MONTH = 2;

/**
 * How many of the year's finished pictures are named, and how many win.
 *
 * Five and one, which is the shape almost every award in the business takes and
 * the shape that makes a nomination worth something on its own — four fifths of
 * the people who are named do not win, and being named is still the thing that
 * changes what an office thinks. A season that named one and gave it the award
 * would make the whole mechanism a single coin toss a year.
 */
export const NAMED_A_YEAR = 5;
export const WINS_A_YEAR = 1;

/**
 * What being named and what winning are worth, as points of prestige.
 *
 * Both are a share of the distance left to a hundred rather than a flat addition,
 * for the reason every other standing figure in this build is: a flat addition
 * saturates, and a career of nothing but wins should approach being the most
 * respected person in the business without a step ever taking it there.
 *
 * Winning is worth about three times being named. SLATE's own, and fitted to the
 * one thing the ratio has to do: make a career of five nominations and no wins a
 * real career, and a career of one win better than it.
 */
export const NAMED_IS_WORTH = 0.06;
export const WON_IS_WORTH = 0.18;

/** What a year takes off prestige nobody has added to. */
export const FORGOTTEN_A_YEAR = 4;

/**
 * What a picture's standing with the people who vote is made of.
 *
 * Three things, and the weights are the argument. What the cast actually is
 * carries most of it, because that is what is on the screen — and it is the
 * *real* read rather than the believed one, because a voting body has seen the
 * picture and a producer guessing at a casting session has not. The form carries
 * some, because a feature and a commercial are not judged against each other.
 * And a draw carries the rest, because it is a judgement rather than a
 * measurement and a model that pretended otherwise would be claiming to know how
 * a jury votes.
 *
 * The negative is deliberately absent. Money buys scale, reach and a marketing
 * campaign; it does not buy the opinion, and a build where the most expensive
 * picture won every year would be saying something false about the business.
 */
export const NOTICED = {
  /** What is on the screen, off the cast's own reads. */
  cast: 0.55,
  /** Which form it is, off `AWARDABLE` below. */
  form: 0.2,
  /** A jury is people. */
  draw: 0.25,
} as const;

/**
 * How much a form is the kind of thing that gets named, 0-1.
 *
 * SLATE's own, and it is the least contentious table here: a feature and a
 * limited series are what awards are given to, and a commercial is not. The
 * format season sits between them, because formats do win — there are awards for
 * them and they are real — and they do not win the ones anybody remembers.
 */
export const AWARDABLE: Readonly<Record<string, number>> = {
  feature: 1,
  series: 0.9,
  unscripted: 0.45,
};

/** Below this, a picture is not in the conversation at all. */
export const IN_THE_CONVERSATION = 45;

/**
 * The least a picture must have cost to be eligible, in cents.
 *
 * Not a quality bar — a floor under what counts as a picture rather than a job.
 * Nothing in the business nominates a corporate video, and without this the
 * commercials the lot makes for an Icelandic agency would be in the running
 * against features every year.
 */
export const ELIGIBLE_ABOVE: Money = 500_000_00;

/**
 * The smallest part a season notices, as a share of the screen.
 *
 * A day player is not nominated for anything, anywhere, and a season that named
 * one would be flattering the player rather than judging them. Set at the
 * supporting size's own share, so the table decides this rather than a number
 * typed next to it.
 */
export const NOTICED_AT_LEAST = 0.2;
