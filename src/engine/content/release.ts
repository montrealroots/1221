/**
 * SLATE — what a finished picture takes, and over how long.
 *
 * Until now the studio could only spend. Material cost money, departments cost money,
 * the company itself cost money every month, and nothing ever came back. This is the
 * other half, and it is the half that makes every earlier decision mean something:
 * hiring a better team is only a question if the picture can repay it.
 *
 * ## Reckoned once, paid over time
 *
 * What an audience will pay across the whole run is worked out **once**, on the day it
 * opens, and then everything after that is arithmetic on that figure.
 *
 * That is a decision and the alternative is tempting, so it is worth defending. If the
 * total were re-derived every month, a change anywhere upstream would silently move
 * money that had already been counted, and the figure a player was shown at the
 * opening would stop being the figure they got. Worse, it would be un-auditable: a
 * receipt explains a reckoning, and a reckoning that keeps changing explains nothing.
 * The world decides the opening; the opening decides the run.
 *
 * The deleted production system got this wrong in the opposite direction — it reckoned
 * the whole life of a picture and posted every penny of it in one transaction on the
 * release date, so a year of earnings arrived in an afternoon and nobody could see
 * where any of it came from. Both halves matter: reckon once, and pay slowly.
 *
 * ## The figures here have not been measured yet
 *
 * Stated plainly because this project fails builds for less. Every constant below is
 * **reasoned, not measured**. They are set so that a competently made picture roughly
 * returns its cost and a well made one does better, which is the shape a studio game
 * needs — but that is an intention, not an observation.
 *
 * What is owed before any of them is trusted: play a career, several seeds, and read
 * what a slate actually returns. The deleted build's own rate constant carried a
 * measurement taken on twelve played careers and was still falsified later by a change
 * upstream of it. These have not even had the first pass.
 */

import type { Money } from '../core/money';

/**
 * How many months a run pays for.
 *
 * Long enough that a picture is a stream rather than an event, short enough that a
 * studio is not still counting one out when it has made four more.
 */
export const PAYS_FOR_MONTHS = 10;

/**
 * How much of the whole a run pays in each of its months.
 *
 * Front-loaded and then a tail, because that is the shape of the thing being modeled:
 * most of what a picture takes, it takes early, and then it keeps paying for a while
 * in smaller amounts. Written as explicit shares rather than a decay formula so that
 * they can be seen to sum to one — a curve that quietly lost four per cent of every
 * picture's earnings would be very hard to notice.
 */
export const PAYS_IN: readonly number[] = [
  0.34, 0.21, 0.13, 0.09, 0.07, 0.05, 0.04, 0.03, 0.02, 0.02,
];

/** What the shares come to, which has to be one. */
export const SHARES_TOTAL = PAYS_IN.reduce((sum, one) => sum + one, 0);

/**
 * What a picture returns against what it cost, before craft or luck.
 *
 * The middle of the model. At exactly this, a picture pays its own production budget
 * back and nothing else — which is deliberately not a living, because the company has
 * a monthly burn to cover out of what is left and a studio that broke even on every
 * picture would slowly die. Craft and the draw are what take it above.
 */
export const RETURNS_AROUND = 1.15;

/**
 * How far the craft that went in moves what comes back.
 *
 * At the cheapest team everywhere a picture returns well under its cost; at the best
 * everywhere, comfortably over. That spread is the whole reason hiring is a decision
 * rather than a formality, and it has to be wide enough to notice and narrow enough
 * that money alone does not guarantee a hit.
 */
export const CRAFT_SWINGS = 0.55;

/**
 * How much of a run is simply luck.
 *
 * An audience is not a calculation. A fifth either way means a well made picture
 * usually does well and sometimes does not, which is what makes a slate worth having
 * rather than a single perfect bet.
 */
export const LUCK_SWINGS = 0.2;

/**
 * What a picture takes across its whole run.
 *
 * `craft` is nought to one, where one is the best team in every department that
 * worked. `luck` is nought to one from the draw. Both are clamped, because a caller
 * handing in something out of range should get a sensible answer rather than a
 * negative box office.
 */
export function reckon(budgetCents: Money, craft: number, luck: number): Money {
  const atCraft = 1 + (Math.max(0, Math.min(1, craft)) * 2 - 1) * CRAFT_SWINGS;
  const atLuck = 1 + (Math.max(0, Math.min(1, luck)) * 2 - 1) * LUCK_SWINGS;
  return Math.max(0, Math.round(budgetCents * RETURNS_AROUND * atCraft * atLuck));
}

/** What arrives in one month of a run, counting the first as month one. */
export function paysInMonth(totalCents: Money, month: number): Money {
  const share = PAYS_IN[month - 1];
  if (share === undefined) return 0;
  return Math.round(totalCents * share);
}
