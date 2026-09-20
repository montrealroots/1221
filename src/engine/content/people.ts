/**
 * SLATE — the people who actually make it, and what is true about them.
 *
 * Until now a department was hired at a **level**: the player typed a number from one
 * to five and the budget multiplied by it. That was honest about the money and silent
 * about everything else. Two teams at the same price were the same team, there was
 * nobody to be unavailable, and the word "hiring" described picking a tier.
 *
 * This is the content half of replacing that number with a person. The world half is
 * `world/people.ts`, which draws them, keeps their dates and decides who is free.
 *
 * ## Standing is the old level, deliberately
 *
 * A person's standing in their discipline runs one to five and **is** the team level
 * the department engine already prices. That is not a shortcut — it is what keeps the
 * economy that was measured over two instruments from being quietly re-tuned by a
 * change that was supposed to be about people. Hire a standing-three designer and the
 * design department costs exactly what level three cost yesterday.
 *
 * What is new is that the number is no longer typed. It belongs to somebody, it is not
 * available whenever you want it, and it moves over a life.
 *
 * ## Capability and temperament are different things
 *
 * Standing says how good they are. Temperament says what they are like, and the two do
 * not correlate — which is the whole reason to have both. A brilliant designer who
 * cannot be kept to a budget and a steady one a rung below are a real choice, and
 * under a bare level they were the same hire at different prices.
 *
 * Every temperament here moves something the build already reads, because a trait
 * nothing reads is the defect this project fails a gate for:
 *
 * - `spends` multiplies the department's **monthly rate** — read by the budget.
 * - `takes` multiplies its **months** — read by the schedule, and through the schedule
 *   by the delivery date and by every other department's phase.
 * - `lifts` moves the **rung the craft is read at** — read by what the picture takes.
 *
 * Four of them, not twelve. Each one is a different shape of trade and none of them is
 * a tint on the same axis: exacting buys quality with time, brisk sells quality for
 * time, extravagant sells money for nothing at all, and steady is the absence of a
 * story. Twelve traits that all nudged the budget would be one trait with twelve names.
 */

import type { Money } from '../core/money';

/**
 * What somebody does, which is exactly the set of departments there are.
 *
 * One taxonomy, not two. A discipline that did not answer to a department would be a
 * word with a career behind it and no work to do, and a department with no discipline
 * would be work nobody could be hired onto.
 */
export type Discipline = string;

/** The rungs a person's standing can sit on, matching the team levels a budget prices. */
export const LEAST_STANDING = 1;
export const BEST_STANDING = 5;

/** What each rung is called, so a shortlist is not a column of digits. */
export const STANDING_SAID: readonly string[] = [
  'Starting Out', 'Working', 'Established', 'Sought After', 'The Best There Is',
];

/** Where on that ladder a standing sits, clamped, for a screen. */
export const standingSaid = (standing: number): string =>
  STANDING_SAID[Math.max(0, Math.min(STANDING_SAID.length - 1, Math.round(standing) - 1))]!;

export interface Temperament {
  id: string;
  /** What it is called on a shortlist. */
  said: string;
  /** What it means, in the player's terms rather than the engine's. */
  what: string;
  /** Multiplies what a month of this department costs. */
  spends: number;
  /** Multiplies how many months it takes. */
  takes: number;
  /** Moves the rung the craft is read at, which is what the picture's take reads. */
  lifts: number;
}

/**
 * The four.
 *
 * `steady` is the common one and the others are the story. The weights they turn up at
 * live in `TURNS_UP` below, because how often a thing happens is a different decision
 * from what it does.
 */
export const TEMPERAMENTS: readonly Temperament[] = [
  {
    id: 'steady',
    said: 'Steady',
    what: 'Does the work, on the schedule, for the money.',
    spends: 1,
    takes: 1,
    lifts: 0,
  },
  {
    id: 'exacting',
    said: 'Exacting',
    what: 'Will not sign it off until it is right, and takes the time that needs.',
    spends: 1,
    takes: 1.2,
    lifts: 0.5,
  },
  {
    id: 'brisk',
    said: 'Brisk',
    what: 'Fast, and you can see it on the screen.',
    spends: 1,
    takes: 0.85,
    lifts: -0.4,
  },
  {
    id: 'extravagant',
    said: 'Extravagant',
    what: 'Spends what is in front of them, and it does not end up on the screen.',
    spends: 1.25,
    takes: 1,
    lifts: 0,
  },
];

export const TEMPERAMENT_BY_ID: Readonly<Record<string, Temperament>> = Object.fromEntries(
  TEMPERAMENTS.map((one) => [one.id, one]),
);

/**
 * How often each turns up in a shortlist.
 *
 * Steady is most of the trade, which is what makes the other three worth reading a
 * shortlist for. If they were even, temperament would be noise rather than news.
 */
export const TURNS_UP: Readonly<Record<string, number>> = {
  steady: 52,
  exacting: 18,
  brisk: 18,
  extravagant: 12,
};

/** Which temperament a draw lands on, weighted. Pure, so the decider can sweep it. */
export function temperamentFrom(t: number): Temperament {
  const total = TEMPERAMENTS.reduce((sum, one) => sum + (TURNS_UP[one.id] ?? 0), 0);
  let at = Math.max(0, Math.min(0.999999, t)) * total;
  for (const one of TEMPERAMENTS) {
    at -= TURNS_UP[one.id] ?? 0;
    if (at < 0) return one;
  }
  return TEMPERAMENTS[TEMPERAMENTS.length - 1]!;
}

/**
 * The age a career in a craft department runs between.
 *
 * Nobody heads a department at nineteen and very few are still doing it at seventy.
 * These are the ends of the working life rather than of the life, which is a different
 * question that `content/lifespan.ts` already answers for the family.
 */
export const STARTS_AT = 24;
export const RETIRES_AT = 68;

/**
 * The years a career is at its peak, which is a stretch and not an instant.
 *
 * Measured, and the first version of this was a single age. With the peak at one
 * point, standing at the top of the ladder needed the greatest possible reach and
 * exactly the right birthday at the same moment, and across all six disciplines the
 * drawn trade held **nobody at all** at rung five and eleven people at rung four. A
 * rung of the ladder that no hire can occupy is the dead-word defect this project
 * fails a gate for, and it was hiding inside a curve rather than in a list.
 *
 * Craft departments are apprenticeship trades: somebody is still getting better at
 * forty-five in a way a performer is not, and then they are simply good for a long
 * time. Sixteen years of that is what makes the top of the trade a place a studio can
 * actually hire from.
 */
export const PEAKS_FROM = 40;
export const PEAKS_TO = 56;

/**
 * What a life does to a standing, as a share of the way from the floor to the top.
 *
 * Nought at the start of a working life, one across the peak, and falling back after
 * it. A person carries a *reach* — how far they would ever get — and this decides how
 * much of it they have got to yet, which is what makes age a fact that moves numbers
 * rather than a number printed beside a name.
 */
export function throughTheCareer(age: number): number {
  if (age <= STARTS_AT) return 0;
  if (age >= RETIRES_AT) return 0;
  if (age <= PEAKS_FROM) return (age - STARTS_AT) / (PEAKS_FROM - STARTS_AT);
  if (age <= PEAKS_TO) return 1;
  // The way down is shallower than the way up, and never reaches the floor again:
  // experience does not evaporate, it just stops compounding.
  const past = (age - PEAKS_TO) / (RETIRES_AT - PEAKS_TO);
  return 1 - past * FALLS_BY;
}

/**
 * How far somebody was ever going to get, from a draw.
 *
 * Bent toward the top rather than flat, and for the same reason the peak is a stretch:
 * a flat draw put a fifth of the trade in each band of reach, and since almost nobody
 * is at their peak on any given day, the rungs a studio could actually hire collapsed
 * into the bottom three. Bending the draw is the difference between a trade that has
 * a top and one that only has a middle.
 */
export const REACH_BENDS = 0.55;

export const reachFrom = (t: number): number => LEAST_STANDING
  + (BEST_STANDING - LEAST_STANDING) * Math.max(0, Math.min(1, t)) ** REACH_BENDS;

/**
 * How much of a peak is lost by the end of a working life.
 *
 * Not all of it. Somebody at sixty-seven who was the best there is at forty-eight is
 * not starting out again, and a model that said so would make every older hire absurd.
 */
export const FALLS_BY = 0.45;

/**
 * What somebody of this reach is standing at, at this age.
 *
 * Rounded to a rung, because the budget prices rungs. Held at or above the floor, so
 * a person who is in the trade at all is somebody the departments can be told about.
 */
export function standingFor(reach: number, age: number): number {
  const at = LEAST_STANDING
    + (Math.max(LEAST_STANDING, Math.min(BEST_STANDING, reach)) - LEAST_STANDING)
    * throughTheCareer(age);
  return Math.max(LEAST_STANDING, Math.min(BEST_STANDING, Math.round(at)));
}

/**
 * The least a picture can cost before the best of the trade will take it.
 *
 * A term, not a price. Standing already says what somebody charges; this says what
 * they will not do at any price, which is a different kind of fact and the first one
 * in this build that transfers something other than money.
 *
 * It is the hard edge of the decision the ceiling on the take created. Matching the
 * team to the material was an argument about arithmetic — over-hire and you lose
 * money — and a player with deep pockets could simply eat that. This makes the small
 * picture *unable* to have the best designer, whatever it is willing to pay, because
 * people who are sought after do not spend a year on something nobody will see.
 *
 * Nought at the bottom rung: somebody starting out will work on anything, which is
 * how starting out works.
 *
 * **What it does and does not do**, both measured, because the second half is the
 * kind of thing a constant quietly gets credit for. It bites: at this figure the top
 * of the trade refuses about a quarter of the properties `tools/slate.mjs` draws, and
 * turning it off changes which hires are possible. It does **not** change what a
 * career comes to — ten worlds with it on and ten with it off both put the matching
 * policy at 1.04x the best fixed rung — because a policy that is refused simply
 * steps down a rung, which is what a player does too.
 *
 * So this is a constraint rather than an economy. It stops the absurd hire and makes
 * a small picture a different kind of thing to staff; it does not make hiring worth
 * more money. Claiming otherwise was the first draft of this comment.
 */
export const WORKS_ABOVE: Money = 400_000_00;

/**
 * How steeply that climbs with the rung.
 *
 * Faster than the rung does, because refusing work is a luxury and the top of a trade
 * has much more of it than the middle. At 1.5 the five rungs insist on nothing, four
 * hundred thousand, one and an eighth million, two and a tenth, and three and a fifth.
 */
export const WORKS_ABOVE_BENDS = 1.5;

/** How far one person strays from what their rung usually insists on. */
export const WORKS_ABOVE_STRAYS = 0.45;

/**
 * The least a picture can cost before this person will take it.
 *
 * `t` is their own draw, so two people at the same rung are not the same hire: one of
 * the four on a shortlist will usually take something the others will not, which is
 * what keeps this from being a second name for standing.
 */
export function worksAboveFor(standing: number, t: number): Money {
  const rungs = Math.max(0, standing - LEAST_STANDING);
  if (rungs <= 0) return 0;
  const strayed = 1 + (Math.max(0, Math.min(1, t)) * 2 - 1) * WORKS_ABOVE_STRAYS;
  return Math.max(0, Math.round(WORKS_ABOVE * rungs ** WORKS_ABOVE_BENDS * strayed));
}

/**
 * How likely somebody is to insist on being paid whether or not it gets made.
 *
 * Pay-or-play is the other kind of term: it does not change what a picture costs to
 * make, it changes what it costs to **stop**. Common at the top, where an agent can
 * ask for it, and rare at the bottom, where nobody can.
 */
export const PAY_OR_PLAY_AT_TOP = 0.8;
export const PAY_OR_PLAY_AT_FLOOR = 0.05;

/** Whether this person signs pay-or-play, from their rung and their own draw. */
export function wantsPayOrPlay(standing: number, t: number): boolean {
  const through = (Math.max(LEAST_STANDING, Math.min(BEST_STANDING, standing)) - LEAST_STANDING)
    / (BEST_STANDING - LEAST_STANDING);
  return t < PAY_OR_PLAY_AT_FLOOR + (PAY_OR_PLAY_AT_TOP - PAY_OR_PLAY_AT_FLOOR) * through;
}

/**
 * What a pay-or-play engagement costs when the picture does not happen.
 *
 * Half of what they would have been paid for the whole engagement. A real one is
 * usually the whole fee, and the whole fee was refused here on the evidence of what
 * it would do: attaching anybody good to a picture you might not make would be a
 * commitment no sensible player ever takes, and a term nobody agrees to is a term
 * that does nothing. Half is enough that shelving a staffed picture hurts in
 * proportion to who is on it, which is the entire job of this number.
 */
export const PAY_OR_PLAY_SHARE = 0.5;

/**
 * What a shortlist offers at once.
 *
 * Four, matching the material market, and for the same reason: a list long enough to
 * choose from and short enough that choosing is a decision rather than a search.
 */
export const HOW_MANY_OFFERED = 4;

/**
 * What signing somebody costs, on top of what their department bills every month.
 *
 * A fee for saying yes — the thing an agent is paid out of. It climbs with standing,
 * because the top of a trade is priced by scarcity rather than by hours, and it is
 * charged again when somebody is replaced, which is what stops reshuffling a crew
 * being free.
 *
 * It is small against a budget **on purpose**, and the first version was not. At nine
 * thousand climbing by 2.1 a rung, the top of the trade asked a hundred and
 * seventy-five thousand to sign: six departments at the top came to over a million in
 * fees against a two-million budget that did not include them. That made hiring a
 * question about cash on hand rather than about the picture, which is the one thing
 * this fee must not do. Six top departments now come to a little over a quarter of a
 * million, which is felt and survivable.
 */
export const SIGNS_FOR: Money = 6_000_00;

/** How steeply that climbs with the rung. */
export const SIGNING_CLIMBS = 1.65;

/** What this person asks to sign, at this standing. */
export const signsFor = (standing: number): Money => Math.round(
  SIGNS_FOR * SIGNING_CLIMBS ** (Math.max(LEAST_STANDING, standing) - LEAST_STANDING),
);
