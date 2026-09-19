/**
 * SLATE — what a finished thing takes, worked out one named step at a time.
 *
 * The deleted system had `selling.take`, which returned a figure. One function, one
 * number, and no way to answer the only question a player ever asks about a result:
 * *why that?* A model whose output cannot be taken apart is indistinguishable from a
 * roll with prose on top, and this project has a test for exactly that.
 *
 * So the take is an **accumulator**. A single figure is carried through a chain of
 * named links, each of which may move it, and each of which writes down what it did
 * and why. The chain is the model; the notes are the receipt. `theReceipt` prints
 * them, and the printed receipt reconciles to the final figure by construction
 * rather than by agreement — the same discipline the ledger holds money to, applied
 * to the number before it becomes money.
 *
 * ## The two things a release has, and why they are separate
 *
 * **Height** is how much it takes. **Shape** is when. They are genuinely independent
 * and the build kept conflating them: a loud opening for a poor picture and a quiet
 * one for a good picture are both ordinary, and a model where quality only scales
 * the total cannot produce either.
 *
 * Height is this file. Shape is `content/release.ts`, bent by word of mouth, which
 * this file produces. The link between them is one number and it travels one way.
 *
 * ## Why every link is also a decider
 *
 * Because a link that reads an input and ignores it is the defect this repository
 * fails the gate on, and a link that reads it *backwards* passed every check in the
 * build until `sweepDirection` existed. `making.slip` read its schedule figure
 * inverted for the whole of its life behind a field whose name meant its opposite.
 *
 * Every link below therefore declares a ladder and a direction in `decided.ts`, and
 * the sweep pushes each input end to end and fails if the outcome goes the other
 * way. That is not extra diligence. It is the only reason to believe any of it.
 */

import { millions } from '../core/money';
import type { Format } from '../content/format';
import { formatById } from '../content/format';
import type { StoryEngine } from '../content/concept';
import { axisStands } from '../content/department';
import {
  AIRS_ONCE, SEASON, WEEKS_OF_RUN, WINDOWS_AFTER, bendTheRun,
  DISTRIBUTION_FEE, EXHIBITOR_KEEPS,
} from '../content/release';
import type { Channel } from '../content/format';

// ---------------------------------------------------------------------------
// What a reckoning is
// ---------------------------------------------------------------------------

/** One link's work, kept so the result can be taken apart afterwards. */
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
  /** The running figure, in cents, before the exhibitor and the distributor. */
  cents: number;
  /**
   * How well people speak of it, −1 to +1.
   *
   * Produced by the craft link and read only by the run's shape. Kept on the
   * reckoning rather than returned separately because it is a property of the
   * result, and a second return value is a second thing to forget to thread.
   */
  wordOfMouth: number;
  /** What each link did, in order. */
  said: readonly Note[];
}

/** Everything a reckoning reads. One object, so a link cannot reach for the world. */
export interface Spec {
  format: Format;
  /** How many parts were made. */
  parts: number;
  /** Seconds of finished screen time per part. */
  secondsEach: number;
  /** What making it actually cost, in cents. */
  spentCents: number;
  /** What was spent telling anybody about it, in cents. */
  campaignCents: number;
  /** Who filled each department, by band id. */
  staffing: Readonly<Record<string, string>>;
  /** The story engine underneath it, where there is one. */
  engine?: StoryEngine;
  /** Month of release, 0 for January. */
  month: number;
  /**
   * How much else is opening against it, 0 (an empty week) to 1 (a full one).
   *
   * A share rather than a count, because what matters is how much of the
   * available attention is already spoken for and not how many titles that took.
   */
  field: number;
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
 * The floor of the whole model, and the only link that does not multiply. Seconds
 * of finished screen time is the engine's native measure, so the base is drawn off
 * it rather than off the part count — twelve micro-parts and one feature are not
 * the same object and should not start from the same figure.
 *
 * The rate falls as the thing gets longer, because an audience's attention is not
 * linear in runtime and a forty-part series does not take forty times a feature.
 */
export const OPENING_RATE_PER_MINUTE_CENTS = 750_000_00;

export function fromTheShape(r: Reckoning, spec: Spec): Reckoning {
  const minutes = (spec.parts * spec.secondsEach) / 60;
  // Square root rather than linear: doubling the length adds about forty per cent,
  // which is what stops a long format being a way to print money by the yard.
  const base = OPENING_RATE_PER_MINUTE_CENTS * Math.sqrt(minutes);
  return note(r, 'the shape', base,
    `${spec.format.label}, ${spec.parts} part${spec.parts === 1 ? '' : 's'} `
    + `of ${Math.round(spec.secondsEach / 60)} minutes.`);
}

/**
 * What the money on the screen bought.
 *
 * Diminishing, and steeply. The first million changes what can be attempted; the
 * twentieth changes the number of extras. Modeled as a power under one so that
 * spending more always helps and never proportionally, which is the shape that
 * makes a budget a decision instead of a dial.
 */
export const SPEND_BITES = 0.42;
export const SPEND_REFERENCE_CENTS = 3_000_000_00;

export function fromTheSpend(r: Reckoning, spec: Spec): Reckoning {
  const ratio = Math.max(0.01, spec.spentCents / SPEND_REFERENCE_CENTS);
  const mult = Math.pow(ratio, SPEND_BITES);
  return note(r, 'the spend', r.cents * mult,
    `Made for ${millions(spec.spentCents)}, which is `
    + `${mult >= 1 ? 'above' : 'below'} what this shape usually costs.`);
}

/**
 * How good it turned out, and the one link that writes word of mouth.
 *
 * Craft does not move the height much on its own — a well-made film that nobody
 * has heard of still opens small. What it does is decide whether the run has a
 * tail, and that is where the money actually is over twenty weeks.
 *
 * So this link moves the figure a little and `wordOfMouth` a lot, which is the
 * asymmetry the whole model turns on.
 */
export const CRAFT_MOVES_HEIGHT = 0.30;

export function fromTheCraft(r: Reckoning, spec: Spec): Reckoning {
  const stands = axisStands('craft', spec.staffing);
  const mult = 1 + (stands - 1) * CRAFT_MOVES_HEIGHT;
  // Word of mouth is the distance from an ordinary production, clamped. A normally
  // staffed picture says nothing either way, which is right: most do not.
  const mouth = Math.max(-1, Math.min(1, (stands - 1) * 2.4));
  const after = note(r, 'the craft', r.cents * mult,
    `Direction, writing, photography and cutting stand at ${stands.toFixed(2)}.`);
  return { ...after, wordOfMouth: mouth };
}

/**
 * Who is in it and what it sounds like — the reason anybody turns up cold.
 *
 * The opposite asymmetry to craft: draw moves the height hard and does nothing at
 * all to word of mouth. A famous cast fills an opening weekend and does not make
 * anybody recommend it afterwards, which is the most reliable pattern in the
 * business this is modeling.
 */
export const DRAW_MOVES_HEIGHT = 0.85;

export function fromTheDraw(r: Reckoning, spec: Spec): Reckoning {
  const stands = axisStands('draw', spec.staffing);
  const mult = 1 + (stands - 1) * DRAW_MOVES_HEIGHT;
  return note(r, 'the draw', r.cents * mult,
    `Casting and music stand at ${stands.toFixed(2)}.`);
}

/**
 * Whether the engine underneath it had anything left.
 *
 * The link that makes `carries` in `content/concept.ts` a fact rather than a
 * number on a screen. An engine of the `revealed` kind is spending something as it
 * goes — a secret, a transformation — and a production that asked for more parts
 * than it carries is running on an empty tank for the difference.
 *
 * Renewable engines are untouched. That is the whole point of the distinction.
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
  // Falls away rather than cliffs, because an audience leaves a show that has run
  // dry over several parts and not between two of them.
  const mult = Math.max(0.25, 1 - (over / engine.carries) * 0.8);
  return note(r, 'the engine', r.cents * mult,
    `${engine.label} carries ${engine.carries} parts and this asked for ${spec.parts}. `
    + `${over} of them had nothing left to reveal.`);
}

/**
 * What else was happening the month it opened.
 *
 * Applied to the height rather than to the run, because a crowded December hurts
 * an opening and does nothing to a tail still playing in February.
 */
export function fromTheSeason(r: Reckoning, spec: Spec): Reckoning {
  const month = ((spec.month % 12) + 12) % 12;
  const mult = SEASON[month] ?? 1;
  return note(r, 'the season', r.cents * mult,
    `Opened in a month that runs at ${mult.toFixed(2)}.`);
}

/**
 * Whether anybody had heard of it, measured against what the format expects.
 *
 * The one link that can be actively negative, and it is deliberate. Spending
 * under the floor is worse than spending nothing, because a half-campaign buys
 * awareness without reach: people have heard the title and have no idea when or
 * where, and the opening is worse than it would have been with no campaign and
 * honest word of mouth. Over the floor it is the usual diminishing curve.
 */
export const CAMPAIGN_FLOOR_PENALTY = 0.35;

export function fromTheCampaign(r: Reckoning, spec: Spec): Reckoning {
  const floor = spec.format.expectsCampaignCents;
  const ratio = spec.campaignCents / floor;
  if (ratio < 1) {
    // Straight line down to the penalty at zero spend, so the worst case is a
    // known figure rather than an asymptote.
    const mult = 1 - (1 - ratio) * CAMPAIGN_FLOOR_PENALTY;
    return note(r, 'the campaign', r.cents * mult,
      `Spent ${Math.round(ratio * 100)}% of what ${spec.format.label} needs to be heard of.`);
  }
  const mult = 1 + Math.log10(ratio) * 0.55;
  return note(r, 'the campaign', r.cents * mult,
    `Spent ${Math.round(ratio * 100)}% of what ${spec.format.label} needs to be heard of.`);
}

/**
 * How much of the available attention was already spoken for.
 *
 * `field` is a share and not a count, because two enormous titles and nine small
 * ones can take the same room. Caps at a little under half, since even a full week
 * does not halve an opening — audiences expand somewhat to meet supply.
 */
export function againstTheField(r: Reckoning, spec: Spec): Reckoning {
  const field = Math.max(0, Math.min(1, spec.field));
  const mult = 1 - field * 0.42;
  return note(r, 'the field', r.cents * mult,
    `${Math.round(field * 100)}% of the week's attention was already taken.`);
}

/**
 * The chain, in order.
 *
 * Order matters and is not arbitrary: the shape sets a floor, the spend and the
 * craft and the draw say what was made of it, the engine says whether it had
 * anything to say, and the season, the campaign and the field are the world's
 * answer. Everything before the last three is about the thing; the last three are
 * about when it was let out.
 */
export const THE_CHAIN: readonly { id: string; run: (r: Reckoning, s: Spec) => Reckoning }[] = [
  { id: 'the shape', run: fromTheShape },
  { id: 'the spend', run: fromTheSpend },
  { id: 'the craft', run: fromTheCraft },
  { id: 'the draw', run: fromTheDraw },
  { id: 'the engine', run: fromTheEngine },
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

// ---------------------------------------------------------------------------
// From a figure to a run
// ---------------------------------------------------------------------------

export interface Week {
  /** Which week of the run, counting from one. */
  week: number;
  /** What the audience paid, in cents, before anybody's cut. */
  grossCents: number;
}

export interface Take {
  /** Which window or channel this is. */
  id: string;
  label: string;
  /** What reached the company, in cents, after the cuts that apply to it. */
  cents: number;
  /** Which week of the release it lands in. */
  week: number;
}

export interface Run {
  /** The reckoning that produced it, receipt and all. */
  reckoning: Reckoning;
  /** Which channel it opened down. */
  channel: Channel;
  /** The opening channel, week by week. */
  weeks: readonly Week[];
  /** Everything the audience paid down the opening channel. */
  grossCents: number;
  /** What reached the company from the opening channel. */
  rentalCents: number;
  /** Every window that opened afterwards, in the order they open. */
  takes: readonly Take[];
  /** What the whole life of it came to, opening channel and windows together. */
  totalCents: number;
}

/**
 * Spreads a reckoning over weeks and windows.
 *
 * The only place height and shape meet. Height came out of the chain; shape comes
 * out of `bendTheRun` reading the word of mouth the chain produced. Neither knows
 * about the other, which is what lets a well-reviewed failure and an unloved hit
 * both exist.
 */
export function layTheRun(reckoning: Reckoning, format: Format, channel: Channel): Run {
  const curve = format.legs <= 0 ? AIRS_ONCE : bendTheRun(reckoning.wordOfMouth, format.legs);
  const weeks: Week[] = [];
  for (let i = 0; i < WEEKS_OF_RUN; i += 1) {
    const share = curve[i] ?? 0;
    const cents = Math.round(reckoning.cents * share);
    if (cents > 0) weeks.push({ week: i + 1, grossCents: cents });
  }
  const grossCents = weeks.reduce((sum, w) => sum + w.grossCents, 0);

  // Theatrical is the only channel an exhibitor stands in front of. A broadcaster
  // or a service buys the thing, so what is agreed is what arrives.
  const keptShare = channel === 'theatrical' ? 1 - EXHIBITOR_KEEPS : 1;
  const rentalBefore = Math.round(grossCents * keptShare);
  const rentalCents = Math.round(rentalBefore * (1 - DISTRIBUTION_FEE));

  const takes: Take[] = [];
  for (const window of WINDOWS_AFTER[channel]) {
    const cents = Math.round(rentalCents * window.share);
    if (cents > 0) {
      takes.push({ id: window.id, label: window.label, cents, week: window.opensAfterWeeks });
    }
  }
  const totalCents = rentalCents + takes.reduce((sum, t) => sum + t.cents, 0);
  return { reckoning, channel, weeks, grossCents, rentalCents, takes, totalCents };
}

/**
 * The receipt, as lines a person can read.
 *
 * Every link, what it was handed, what it handed on, and why. This exists because
 * the first question anybody asks a model like this is *why that number*, and an
 * answer that cannot be produced is the difference between a simulation and a die.
 */
export function theReceipt(reckoning: Reckoning): readonly string[] {
  const money = (cents: number) => millions(cents);
  return reckoning.said.map((n) => {
    const moved = n.was === 0 ? '' : ` (${n.became >= n.was ? '+' : ''}${Math.round((n.became / n.was - 1) * 100)}%)`;
    return `  ${n.by.padEnd(14)} ${money(n.became).padStart(9)}${moved.padEnd(8)}  ${n.why}`;
  });
}

/** Everything in one call, for a caller that does not need the pieces. */
export function reckonTheRun(spec: Spec, channel: Channel): Run {
  return layTheRun(reckon(spec), spec.format, channel);
}

/**
 * The format a project was made in, or undefined when it has not chosen one.
 *
 * A convenience with one job: keeping `formatById`'s undefined case in one place
 * rather than at every call site, because six call sites each doing their own
 * undefined check is six chances to do it differently.
 */
export const formatOf = (formatId: string | undefined): Format | undefined => formatById(formatId);
