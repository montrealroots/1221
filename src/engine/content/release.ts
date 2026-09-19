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
 * ## What these were measured against
 *
 * They shipped reasoned and unmeasured, and this file said so. `tools/slate.mjs`
 * settles it: sixteen properties put through the real command path — optioned,
 * developed, staffed, locked, greenlit, walked to delivery, released and paid out —
 * at every team level, with the save seed held still so that only the hiring differs.
 *
 * The first reading was bad and the constants moved because of it. At craft swinging
 * 0.55 against luck at 0.2 the outcome was all but determined by the team: the
 * cheapest lost **every** picture and the best won **every** picture, with no overlap
 * anywhere. Hiring stopped being a decision, because the answer was always the same.
 *
 * At 0.35 against 0.45 the bands overlap and the medians still climb:
 *
 * | team | worst | median | best | returned its cost |
 * |---|---|---|---|---|
 * | 1 | 0.44x | 0.78x | 1.01x | 2 of 16 |
 * | 2 | 0.56x | 0.99x | 1.28x | 7 of 16 |
 * | 3 | 0.68x | 1.20x | 1.55x | 12 of 16 |
 * | 4 | 0.79x | 1.41x | 1.82x | 13 of 16 |
 * | 5 | 0.91x | 1.62x | 2.09x | 15 of 16 |
 *
 * Both tails are real: the best team still lost money on one picture in sixteen, and
 * the cheapest scraped its cost back on one. That is the shape wanted — better craft
 * is reliably better and never a guarantee.
 *
 * ## What this measurement does not settle
 *
 * The instrument funds the company with more money than it can spend, so the best team
 * is close to dominant in it: if cash is free, always hire the best. **That is an
 * artefact of the measurement, not a finding about the game.** The real constraint on
 * hiring is affordability across a slate — how many pictures a studio can carry at
 * once, against a monthly burn — and nothing here reads that.
 *
 * So a career measurement is still owed, and it is a different instrument: several
 * pictures, real cash limits, and the company's own month running underneath. Until
 * it exists, treat the balance between craft and cash as unverified.
 *
 * And re-measure after anything that changes what a picture costs or returns. The
 * deleted build's rate constant carried a genuine measurement on twelve careers and
 * was falsified later by a change upstream of it that nobody thought to re-run.
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
 * Measured. At 0.55 this drowned the draw entirely and every band was decided before
 * the dice were thrown; at 0.35 the medians still climb from 0.78x to 1.62x across the
 * five teams while the bands overlap, which is what makes hiring a judgement rather
 * than a lookup.
 */
export const CRAFT_SWINGS = 0.35;

/**
 * How much of a run is simply luck.
 *
 * An audience is not a calculation. Measured at 0.45, which is wide enough that the
 * best team lost money on one picture in sixteen and the cheapest got its cost back on
 * one — both tails a studio has to plan around. At 0.2 neither happened and a slate
 * was a formality.
 */
export const LUCK_SWINGS = 0.45;

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
