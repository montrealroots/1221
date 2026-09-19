/**
 * SLATE — what a finished thing opens at, worked out one named step at a time.
 *
 * The deleted system had a function that returned a figure. One number, and no way to
 * answer the only question anybody ever asks about a result: *why that?* A model whose
 * output cannot be taken apart is indistinguishable from a roll with prose on top, and
 * this project has a test for exactly that.
 *
 * So the opening is an **accumulator**. One figure is carried through a chain of named
 * links, each of which may move it and each of which writes down what it did. The chain
 * is the model; the notes are the receipt. `theReceipt` prints them and it reconciles to
 * the answer by construction rather than by agreement — the discipline the ledger holds
 * money to, applied to the number before it becomes money.
 *
 * ## Height and shape are different things
 *
 * **Height** is how much. **Shape** is when. They are independent, and conflating them
 * is the mistake that makes a studio game shallow: if quality only scales a total then
 * a beautiful film that nobody went to and a loud empty hit cannot both exist, and both
 * are ordinary.
 *
 * Height is this file. Shape is `content/release.ts`, bent by the word of mouth that
 * this file produces. One number travels between them, one way.
 *
 * ## Every link is a decider
 *
 * A link that reads an input and ignores it is the defect the gate fails on. A link
 * that reads it *backwards* passed every check in this build until `sweepDirection`
 * existed — and then immediately found a real one in the run curve. So the chain
 * declares its directions in `decided.ts` and the sweep pushes each input end to end.
 * That is not diligence. It is the only reason to believe any of it.
 */

import { millions } from '../core/money';
import type { Format } from '../content/format';
import type { StoryEngine } from '../content/concept';
import { axisStands } from '../content/craft';
import { SEASON } from '../content/release';
import { inherits, type Entry } from '../content/lineage';

// ---------------------------------------------------------------------------
// What a reckoning is
// ---------------------------------------------------------------------------

/** One link's work, kept so the answer can be taken apart afterwards. */
export interface Note {
  /** Which link. */
  by: string;
  /** The figure it was handed. */
  was: number;
  /** The figure it handed on. */
  became: number;
  /** Why, in the words a person would use. */
  why: string;
}

export interface Reckoning {
  /** The running figure, in cents: what an audience will pay across the run. */
  cents: number;
  /**
   * How well people speak of it, −1 to +1.
   *
   * Written by the craft link and read only by the run's shape. It rides on the
   * reckoning rather than being returned beside it, because a second return value is
   * a second thing to forget to thread.
   */
  wordOfMouth: number;
  /** What each link did, in order. */
  said: readonly Note[];
}

/** Everything a reckoning reads. One object, so no link can reach for the world. */
export interface Spec {
  format: Format;
  /** How many parts were made. */
  parts: number;
  /** Seconds of finished screen time per part. */
  secondsEach: number;
  /** What making it actually cost, in cents, heads and all. */
  spentCents: number;
  /** What was spent telling anybody about it, in cents. */
  campaignCents: number;
  /** The reach of whoever filled each post, by post id. Absent means nobody chose. */
  reach: Readonly<Record<string, number>>;
  /** The story engine underneath it, where there is one. */
  engine?: StoryEngine;
  /** Month of release, 0 for January. */
  month: number;
  /**
   * How much of the week's attention was already spoken for, 0 to 1.
   *
   * Computed from the release calendar rather than passed as a guess, which is what
   * makes opening opposite somebody a decision instead of a parameter.
   */
  crowding: number;
  /** Where this sits in a line of follow-ups, where it is one. */
  entry?: Entry;
}

const note = (r: Reckoning, by: string, became: number, why: string): Reckoning => ({
  ...r,
  cents: became,
  said: [...r.said, { by, was: r.cents, became, why }],
});

// ---------------------------------------------------------------------------
// The links
// ---------------------------------------------------------------------------

/**
 * What a thing of this shape and this length could take at all.
 *
 * The floor of the model, and the only link that does not multiply. Drawn off seconds
 * of finished screen time rather than off the part count, because twelve micro-parts
 * and one feature are not the same object and should not start from the same figure.
 */
export const RATE_PER_ROOT_MINUTE_CENTS = 750_000_00;

export function fromTheShape(r: Reckoning, spec: Spec): Reckoning {
  const minutes = (spec.parts * spec.secondsEach) / 60;
  // Square root rather than linear: doubling the length adds about forty per cent,
  // which is what stops a long format being a way to print money by the yard.
  const base = RATE_PER_ROOT_MINUTE_CENTS * Math.sqrt(minutes);
  return note(r, 'the shape', base,
    `${spec.format.label}, ${spec.parts} part${spec.parts === 1 ? '' : 's'} of `
    + `${Math.round(spec.secondsEach / 60)} minutes.`);
}

/**
 * What the money on the screen bought.
 *
 * Diminishing, and steeply. The first million changes what can be attempted; the
 * twentieth changes the number of extras. A power under one, so spending more always
 * helps and never proportionally — the shape that makes a budget a decision rather
 * than a dial.
 */
export const SPEND_BITES = 0.42;
export const SPEND_REFERENCE_CENTS = 3_000_000_00;

export function fromTheSpend(r: Reckoning, spec: Spec): Reckoning {
  const ratio = Math.max(0.01, spec.spentCents / SPEND_REFERENCE_CENTS);
  const mult = Math.pow(ratio, SPEND_BITES);
  return note(r, 'the spend', r.cents * mult,
    `Made for ${millions(spec.spentCents)}, ${mult >= 1 ? 'above' : 'below'} what this `
    + 'shape usually costs.');
}

/**
 * How good it turned out, and the only link that writes word of mouth.
 *
 * Craft barely moves the height — a fine picture nobody has heard of still opens
 * small. What it moves is whether the run has a tail, and over twenty weeks the tail
 * is where the money is. So this moves the figure a little and the mouth a lot, which
 * is the asymmetry the model turns on.
 */
export const CRAFT_MOVES_HEIGHT = 0.30;
export const CRAFT_MOVES_MOUTH = 2.4;

export function fromTheCraft(r: Reckoning, spec: Spec): Reckoning {
  const stands = axisStands('craft', (id) => spec.reach[id]);
  const after = note(r, 'the craft', r.cents * (1 + (stands - 1) * CRAFT_MOVES_HEIGHT),
    `Direction, writing, photography and cutting stand at ${stands.toFixed(2)}.`);
  // The distance from an ordinary picture, clamped. An ordinarily made one says
  // nothing either way, which is right: most do not.
  return { ...after, wordOfMouth: Math.max(-1, Math.min(1, (stands - 1) * CRAFT_MOVES_MOUTH)) };
}

/**
 * Whose face is on it and what it sounds like — the reason anybody turns up cold.
 *
 * The opposite asymmetry to craft: draw moves the height hard and does nothing at all
 * to word of mouth. A famous cast fills an opening weekend and does not make anybody
 * recommend the picture afterwards, which is the most reliable pattern in the business
 * this is modeling.
 */
export const DRAW_MOVES_HEIGHT = 0.85;

export function fromTheDraw(r: Reckoning, spec: Spec): Reckoning {
  const stands = axisStands('draw', (id) => spec.reach[id]);
  return note(r, 'the draw', r.cents * (1 + (stands - 1) * DRAW_MOVES_HEIGHT),
    `The cast and the music stand at ${stands.toFixed(2)}.`);
}

/**
 * Whether the engine underneath it had anything left.
 *
 * The link that makes `carries` in `content/concept.ts` a fact rather than a number on
 * a screen. An engine of the revealed kind is spending something as it goes — a
 * secret, a transformation — and a production asking for more parts than it carries is
 * running on an empty tank for the difference. Renewable engines are untouched, which
 * is the entire point of the distinction.
 */
export function fromTheEngine(r: Reckoning, spec: Spec): Reckoning {
  const engine = spec.engine;
  if (!engine || engine.carries === undefined) {
    return note(r, 'the engine', r.cents,
      engine ? `${engine.label} never runs out.` : 'No engine underneath it.');
  }
  const over = spec.parts - engine.carries;
  if (over <= 0) {
    return note(r, 'the engine', r.cents,
      `${engine.label} carries ${engine.carries} parts and this asked for ${spec.parts}.`);
  }
  // Falls away rather than cliffs, because an audience leaves a show that has run dry
  // over several parts and not between two of them.
  return note(r, 'the engine', r.cents * Math.max(0.25, 1 - (over / engine.carries) * 0.8),
    `${engine.label} carries ${engine.carries} and this asked for ${spec.parts}. `
    + `${over} of them had nothing left to reveal.`);
}

/**
 * What the line it belongs to is worth by now.
 *
 * Inheritance against fatigue, both in `content/lineage.ts`. A first picture is
 * untouched. A second usually opens well above where it would alone. A fifth can open
 * below it, and that is the warning the mechanic exists to deliver: a franchise run
 * past its welcome is worse than a new title, because the audience arrives tired.
 */
export function fromTheLine(r: Reckoning, spec: Spec): Reckoning {
  if (!spec.entry || spec.entry.ordinal <= 1) {
    return note(r, 'the line', r.cents, 'The first of its name.');
  }
  const mult = Math.max(0.3, inherits(spec.entry));
  const n = spec.entry.ordinal;
  return note(r, 'the line', r.cents * mult,
    `Number ${n} of the line, ${spec.entry.gapYears.toFixed(1)} years after the last, `
    + `which returned ${spec.entry.lastReturned.toFixed(2)}x.`);
}

/** What else an audience was doing the month it opened. */
export function fromTheSeason(r: Reckoning, spec: Spec): Reckoning {
  const month = ((spec.month % 12) + 12) % 12;
  const mult = SEASON[month] ?? 1;
  return note(r, 'the season', r.cents * mult,
    `Opened in a month that runs at ${mult.toFixed(2)}.`);
}

/**
 * Whether anybody had heard of it, measured against what the format expects.
 *
 * The one link that can go actively negative, deliberately. Spending under the floor
 * is worse than spending nothing: a half-campaign buys awareness without reach, so
 * people have heard the title and no idea when or where, and the opening is worse than
 * it would have been on honest word of mouth. Over the floor it is the usual
 * diminishing curve.
 */
export const CAMPAIGN_FLOOR_COSTS = 0.35;

export function fromTheCampaign(r: Reckoning, spec: Spec): Reckoning {
  const ratio = spec.campaignCents / spec.format.expectsCampaignCents;
  const mult = ratio < 1
    ? 1 - (1 - Math.max(0, ratio)) * CAMPAIGN_FLOOR_COSTS
    : 1 + Math.log10(ratio) * 0.55;
  return note(r, 'the campaign', r.cents * mult,
    `Spent ${Math.round(ratio * 100)}% of what ${spec.format.label} needs to be heard of.`);
}

/**
 * How much of the week was already taken.
 *
 * A share and not a count, because two enormous titles and nine small ones can fill
 * the same room. Caps short of halving, since an audience expands somewhat to meet
 * supply rather than dividing a fixed pot.
 */
export const CROWDING_COSTS = 0.42;

export function againstTheField(r: Reckoning, spec: Spec): Reckoning {
  const crowd = Math.max(0, Math.min(1, spec.crowding));
  return note(r, 'the field', r.cents * (1 - crowd * CROWDING_COSTS),
    `${Math.round(crowd * 100)}% of the week's attention was already taken.`);
}

/**
 * The chain, in order.
 *
 * The order is not arbitrary. The shape sets a floor; the spend, the craft and the
 * draw say what was made of it; the engine says whether it had anything to say; the
 * line says what its name was already worth; and the season, the campaign and the
 * field are the world's answer. Everything before the last three is about the thing.
 * The last three are about when it was let out.
 */
export const THE_CHAIN: readonly { id: string; run: (r: Reckoning, s: Spec) => Reckoning }[] = [
  { id: 'the shape', run: fromTheShape },
  { id: 'the spend', run: fromTheSpend },
  { id: 'the craft', run: fromTheCraft },
  { id: 'the draw', run: fromTheDraw },
  { id: 'the engine', run: fromTheEngine },
  { id: 'the line', run: fromTheLine },
  { id: 'the season', run: fromTheSeason },
  { id: 'the campaign', run: fromTheCampaign },
  { id: 'the field', run: againstTheField },
];

/** Runs the whole chain and hands back the reckoning with its receipt attached. */
export function reckon(spec: Spec): Reckoning {
  let r: Reckoning = { cents: 0, wordOfMouth: 0, said: [] };
  for (const link of THE_CHAIN) r = link.run(r, spec);
  return { ...r, cents: Math.max(0, Math.round(r.cents)) };
}

/**
 * The receipt, as lines a person can read.
 *
 * This exists because the first question anybody asks a model like this is *why that
 * number*, and an answer that cannot be produced is the difference between a
 * simulation and a die.
 */
export function theReceipt(reckoning: Reckoning): readonly string[] {
  return reckoning.said.map((n) => {
    const moved = n.was === 0
      ? ''
      : ` (${n.became >= n.was ? '+' : ''}${Math.round((n.became / n.was - 1) * 100)}%)`;
    return `${n.by.padEnd(13)} ${millions(n.became).padStart(9)}${moved.padEnd(8)} ${n.why}`;
  });
}
