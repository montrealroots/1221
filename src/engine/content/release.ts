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
 * They shipped reasoned and unmeasured, and this file said so. Two instruments settled
 * them. `tools/slate.mjs` puts sixteen properties through the real command path —
 * optioned, developed, staffed, locked, greenlit, walked to delivery, released and paid
 * out — at every team level, with the save seed held still so that only the hiring
 * differs. `tools/career.mjs` runs whole studios for five years on finite cash with the
 * company's own month turning underneath.
 *
 * The constants moved twice, and both readings are kept because each falsified a
 * different assumption.
 *
 * **First reading.** At craft swinging 0.55 against luck at 0.2 the outcome was all but
 * determined by the team: the cheapest lost **every** picture and the best won **every**
 * picture, with no overlap anywhere. Hiring stopped being a decision, because the answer
 * was always the same. At 0.35 against 0.45 the bands overlapped and the medians climbed
 * from 0.78x to 1.62x, which looked right on one picture at a time.
 *
 * **Second reading, which said it was not.** A median of 0.78x means the cheapest team
 * loses a fifth of every budget, and over a career that compounds: a studio hiring cheap
 * bled until it could not afford the next picture. At 30m of capital, teams one to three
 * were refused a greenlight fourteen to nineteen times and managed eight or nine
 * pictures, while teams four and five were refused nothing and managed twelve. Cheap was
 * not the affordable option. It was the path to having less money, which made it wrong
 * at every level of capital rather than only at the comfortable ones.
 *
 * So the floor came up. At 1.25 around, craft swinging 0.2:
 *
 * | team | worst | median | best | returned its cost |
 * |---|---|---|---|---|
 * | 1 | 0.59x | 1.04x | 1.35x | 10 of 16 |
 * | 2 | 0.66x | 1.17x | 1.52x | 10 of 16 |
 * | 3 | 0.73x | 1.30x | 1.68x | 13 of 16 |
 * | 4 | 0.81x | 1.43x | 1.85x | 14 of 16 |
 * | 5 | 0.88x | 1.56x | 2.02x | 15 of 16 |
 *
 * The cheapest team sits on break-even rather than under it, so hiring cheap treads
 * water instead of drowning, and the careers agreed: at 30m every level survived the
 * five years, every level made ten to twelve pictures, and the refusals moved to where
 * they belong — seven to nine at the cheap teams, none to one at the dear ones.
 *
 * Both tails are still real. The best team lost money on one picture in sixteen and the
 * cheapest cleared its cost on ten. That is the shape wanted: better craft is reliably
 * better and never a guarantee.
 *
 * ## What is still not settled, and why no constant fixes it
 *
 * The best team ended richest at every level of capital measured — 16.7m against 894k
 * across five years on 30m. Hiring is better than a lookup now, and it is not yet a
 * dilemma, and no value of these three numbers makes it one.
 *
 * The reason is structural and sits in `reckon` itself. What a picture takes is a pure
 * multiple **of what it cost**, and the multiple rises with craft, so spending more
 * returns more without bound and the only way to lose is a bad draw. What is missing is
 * a ceiling: an audience is finite, and a picture that spends far past anything its
 * material could reach should stop being paid for the excess. That belongs to the
 * demand side — what the material is worth, how it is rated, who it is for, what a
 * campaign buys — which the market already carries as `Demands` and which nothing yet
 * reads for money.
 *
 * Until that lands these constants are honest about a picture in isolation, and the
 * balance between craft and cash stays open. Re-measure on both instruments when the
 * reach term arrives, because it moves the very thing they measure.
 *
 * And re-measure after anything else that changes what a picture costs or returns. The
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
 * The middle of the model, and above one on purpose. A picture at the middle of the
 * draw with a middling team returns a quarter more than it cost, which sounds generous
 * until the burn is counted: the company pays admin and payroll every month a picture
 * is being made, so a quarter over is a living rather than a fortune.
 *
 * It was 1.15 and rose, because at 1.15 the cheapest team's median came out at 0.78x —
 * a loss on the typical picture, which made hiring cheap not a budget choice but a
 * mistake. What this number has to do is keep the floor of the craft band above water.
 */
export const RETURNS_AROUND = 1.25;

/**
 * How far the craft that went in moves what comes back.
 *
 * Measured twice. At 0.55 this drowned the draw entirely and every band was decided
 * before the dice were thrown. At 0.35 the bands overlapped, but the swing was wide
 * enough that the bottom of it lost money on the median picture — which read as merely
 * weak on one picture and turned out over a career to be fatal. At 0.2 the medians
 * still climb across the five teams, 1.04x to 1.56x, and the worst team's median
 * clears its cost.
 *
 * Craft is worth about half a turn of the budget from the cheapest team to the best,
 * which is deliberately less than the draw is worth. A studio that could buy certainty
 * would only ever be shopping.
 */
export const CRAFT_SWINGS = 0.2;

/**
 * How much of a run is simply luck.
 *
 * An audience is not a calculation. Measured at 0.45 and left there through both
 * retunes, because it is wide enough that the best team still lost money on one picture
 * in sixteen — the tail a studio has to plan around. At 0.2 that never happened and a
 * slate was a formality.
 *
 * It is wider than the craft band, which is the ordering wanted. Hiring well shifts the
 * odds. It does not buy the result.
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
