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
 * ## An audience is finite, and that is the whole model
 *
 * What a picture takes is a share of **what its material could ever reach**, and that
 * ceiling is set before a penny is spent. Craft decides how much of the reach is
 * actually collected and the draw moves it either way, but neither can lift a picture
 * past the audience its story was able to find.
 *
 * This replaced a model where the take was a multiple **of the budget**, and the
 * replacement was forced by measurement rather than taste. Under a multiple, spending
 * more returned more without any bound at all: the best team cost about three and a
 * half times the cheapest and multiplied the take by more than it multiplied the cost,
 * so hiring the best was correct on every picture, at every level of capital, forever.
 * `tools/career.mjs` showed exactly that — five years, finite cash, best team richest
 * every time — and no value of the three constants involved could have changed it,
 * because the shape of the formula was the problem and not its numbers.
 *
 * The rates moved with the formula. The best team used to cost three and a half times
 * the cheapest; it now costs a little over twice, because a rung has to be able to pay
 * for itself on ordinary material and at the old ramp the margin needed to justify one
 * was so fat that nothing else in the game could have mattered.
 *
 * With a ceiling the arithmetic inverts into a decision. Reach is fixed by the
 * material; budget is chosen by the player. The best team is worth its money only when
 * the material can carry it, and on a small property it is simply an expensive way to
 * lose. Which property deserves which team is now a question with a wrong answer.
 *
 * ## What draws an audience, and what merely costs
 *
 * Reach reads two of the three demands and pointedly ignores the third.
 *
 * **Scope** pulls hardest: how much picture there is, is most of how many people will
 * come to it. **Spectacle** pulls, but less — something worth seeing brings an
 * audience, though not as many as something big brings. **Period** pulls **nothing at
 * all**, and that is the sharpest claim in this file. Building a world rather than
 * borrowing one costs real money in design and on the floor, and no part of it puts a
 * single person in a seat. Period material is therefore a trap dressed as prestige,
 * and the only defense against it is optioning it cheaply.
 *
 * That gives the demand vector three genuinely different meanings instead of three
 * synonyms for *bigger*, and it is falsifiable in the plainest way: move `period` and
 * the budget moves while the take does not.
 *
 * ## What these were measured against
 *
 * Every constant below was moved by a measurement, and three of them were moved twice.
 * The department rates moved with them, because the crossover is a relationship
 * between what a team costs and what it collects and neither half can be tuned alone.
 *
 * On forty properties through the real command path (`tools/slate.mjs`):
 *
 * | team | worst | median | best | returned its cost |
 * |---|---|---|---|---|
 * | 1 | 0.36x | 1.22x | 2.97x | 26 of 40 |
 * | 2 | 0.34x | 1.23x | 3.23x | 28 of 40 |
 * | 3 | 0.32x | 1.18x | 2.73x | 25 of 40 |
 * | 4 | 0.30x | 1.11x | 2.56x | 24 of 40 |
 * | 5 | 0.30x | 1.04x | 2.60x | 21 of 40 |
 *
 * The medians barely separate, and that is the point rather than a failure: the dear
 * team is not better on average, it is better **on the right property**. Across the
 * forty, every one of the five rungs was the right answer at least once — ten, then
 * fourteen, five, five and six — and played with the right team each time the median
 * picture returned 1.25x while twelve of the forty still lost money.
 *
 * That ratio is take against **budget** and flatters, because it counts neither what
 * the rights cost nor what the heads asked to sign. The career run below counts every
 * penny, which is why it is the one to believe.
 *
 * On five-year careers at thirty million of capital (`tools/career.mjs`), against a
 * policy that hires the same rung whatever turns up:
 *
 * | policy | greenlights refused | lowest cash | ended on |
 * |---|---|---|---|
 * | always team 1 | 0.8 | 2.4m | 2.5m |
 * | always team 2 | 0.5 | 2.6m | 3.1m |
 * | always team 3 | 2.0 | 1.8m | 2.2m |
 * | always team 4 | 3.0 | 788k | 2.0m |
 * | always team 5 | 7.3 | 154k | 1.8m |
 * | **match the material** | **0.0** | **3.2m** | **3.6m** |
 *
 * Reading the property before hiring is worth **1.16x** the best rung that never
 * looks, and it is safer as well as richer — it never over-hires, so it is never
 * refused a greenlight for money. That is the whole model in one row. Under the old
 * multiple-of-budget formula the same comparison came back dead level, because there
 * was nothing about the material worth reading.
 *
 * The edge was 1.27x before the rights and the signing fees were priced properly, and
 * it is a floor rather than a ceiling either way: the matching policy reads the
 * property it has been handed and never decides **which** property to take, which is
 * the larger half of the same judgement and is left to a player.
 *
 * Re-measure on both instruments after anything that moves a department rate, a month
 * count, or what a demand asks for. The deleted build's rate constant carried a
 * genuine measurement on twelve careers and was falsified later by a change upstream
 * of it that nobody thought to re-run.
 */

import type { Money } from '../core/money';
import type { Demands } from './material';

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
 * How far a point of scope carries an audience.
 *
 * The heaviest of the three, because size is the thing a wide audience turns up for.
 */
export const SCOPE_PULLS = 1;

/**
 * How far a point of spectacle carries one.
 *
 * Lighter than scope on purpose. Something worth seeing brings people; it does not
 * bring as many as something big brings, and a small picture full of effects is the
 * most reliable way in this model to spend like a large one and be seen like a small
 * one.
 */
export const SPECTACLE_PULLS = 0.7;

/**
 * How far a point of period carries one, which is nowhere.
 *
 * Declared rather than omitted, because the omission is the claim and a claim nothing
 * states is a claim nobody can find. Period costs design in prep and the unit on the
 * floor and returns not one ticket for any of it.
 *
 * This is a real number that is really read — `whatItCouldReach` multiplies by it —
 * so the falsifiability test has something to bite on: set it above nought and period
 * material stops being a trap.
 */
export const PERIOD_PULLS = 0;

/**
 * What one point of pull is worth at the box office.
 *
 * The scale of the whole economy, and the number everything else is read against. The
 * best team costs a little over twice the cheapest and collects 1/`CRAFT_REACHES` as
 * much of the reach, so where this sits decides which properties can carry which rung.
 * Set it low and no material is ever worth a good team; set it high and every material
 * is, which is the failure the old multiple-of-budget model had.
 *
 * Measured down twice, from 3.2m through 2.2m to here. At 3.2m every picture made
 * money — forty of forty — and a median return of 2.9x meant nothing a studio did
 * could hurt it. At 1.05m the median picture played right returns 1.24x and twelve of
 * forty lose money anyway, which is a business rather than an annuity.
 */
export const REACH_PER_PULL: Money = 1_050_000_00;

/**
 * How much of the reach the cheapest team collects.
 *
 * The floor of the craft band, and the other half of the crossover. It is not nought,
 * because a picture made plainly still opens and people still go; and it is well under
 * one, because the gap between it and one is the entire argument for spending money on
 * a crew.
 */
export const CRAFT_REACHES = 0.55;

/**
 * How the craft band bends, which is what puts the answer anywhere but the ends.
 *
 * Craft buys reach with diminishing returns: the distance from a poor crew to a decent
 * one is worth far more than the distance from a very good one to the best. That is
 * true of the thing being modeled, and it is also the only reason a middling team is
 * ever the right answer.
 *
 * Measured, and the first reading is the reason this constant exists at all. At a
 * straight line — this at one — what a picture cost and what it took both rose evenly
 * with the team, so the best choice was always an end of the scale and never anywhere
 * in between: across fourteen properties the answer came back as team one four times
 * and team five ten times, and teams two, three and four were never right about
 * anything. Three dead rungs on a five-rung ladder is the defect this project fails a
 * gate for.
 *
 * Below one the ladder bends and each extra rung buys less, so the rung that pays for
 * itself depends on how far the material can reach — which is the decision. At 0.7 all
 * five rungs win properties.
 */
export const CRAFT_BENDS = 0.7;

/**
 * How much of a run is simply luck.
 *
 * An audience is not a calculation. Wide enough that the best team loses money on a
 * picture now and then — the tail a studio has to plan around — and it is wider than
 * the craft band on purpose. Hiring well shifts the odds. It does not buy the result.
 */
export const LUCK_SWINGS = 0.45;

/**
 * The most an audience would ever pay for this material, before anyone makes it.
 *
 * Reads the shape of the property and how far it carries, and nothing else. Not the
 * budget, not the team, not the asking price — a property is worth what it is worth,
 * and everything the studio does afterwards decides how much of that it collects.
 *
 * `appeal` is one for an ordinary property. It exists because the shape alone was not
 * enough: with reach a pure function of the three demands, every property of the same
 * size was the same property, and a policy that costed out every team against the
 * material picked the same team every single time. Two stories the same size do not
 * reach the same audience, and now they do not here either.
 */
export function whatItCouldReach(demands: Demands, appeal = 1): Money {
  const pull = Math.max(0, demands.scope) * SCOPE_PULLS
    + Math.max(0, demands.spectacle) * SPECTACLE_PULLS
    + Math.max(0, demands.period) * PERIOD_PULLS;
  return Math.max(0, Math.round(REACH_PER_PULL * pull * Math.max(0, appeal)));
}

/**
 * What a picture takes across its whole run.
 *
 * `craft` is nought to one, where one is the best team in every department that
 * worked. `luck` is nought to one from the draw. Both are clamped, because a caller
 * handing in something out of range should get a sensible answer rather than a
 * negative box office.
 */
export function reckon(reachCents: Money, craft: number, luck: number): Money {
  const got = CRAFT_REACHES
    + (1 - CRAFT_REACHES) * Math.max(0, Math.min(1, craft)) ** CRAFT_BENDS;
  const atLuck = 1 + (Math.max(0, Math.min(1, luck)) * 2 - 1) * LUCK_SWINGS;
  return Math.max(0, Math.round(reachCents * got * atLuck));
}

/** What arrives in one month of a run, counting the first as month one. */
export function paysInMonth(totalCents: Money, month: number): Money {
  const share = PAYS_IN[month - 1];
  if (share === undefined) return 0;
  return Math.round(totalCents * share);
}
