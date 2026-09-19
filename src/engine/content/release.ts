/**
 * SLATE — how money arrives after a thing is finished, and why it is never one number.
 *
 * A release is not a payment. It is a shape spread over weeks, down more than one
 * channel, each of which opens at its own moment and decays at its own rate. The
 * build had none of this: `selling.take` returned a figure, the figure was posted,
 * and a picture earned its whole life in a single instant on its delivery date.
 *
 * That was the defect worth fixing first, because it made every other production
 * decision weightless. If the take is one number, the release month cannot matter,
 * word of mouth cannot matter, and the difference between a thing with legs and a
 * thing without is a difference in one multiplier — which is decoration by the
 * format-engine rule in `docs/research/PIPELINE.md`: *a format that multiplies a
 * result is decoration.*
 *
 * ## The run is a weighting, not a schedule
 *
 * `THE_RUN` holds twenty weeks of weight. It is normalised at use rather than
 * stored normalised, so a row can be edited without anybody having to keep the
 * column summing to one by hand — which is the kind of invariant that survives
 * exactly as long as the person who knew about it.
 *
 * ## Where the shape comes from, which is the part that bites
 *
 * A fixed curve applied to every release is the same decoration in a different
 * coat: every picture would have the same shape and only its height would differ.
 *
 * So the curve is bent by **word of mouth**, which is a number the quality of the
 * thing produces. `bendTheRun` takes the flat table and tilts it. A picture people
 * tell each other about moves weight out of its opening and into its tail; a
 * picture they do not front-loads, takes its money in the first fortnight, and is
 * gone. The height of the run is decided elsewhere. This decides only its shape,
 * and the two are genuinely independent: a loud opening for a bad picture and a
 * quiet one for a good picture are both ordinary, and both fall out of this.
 *
 * That is the falsifiability test passing. Change word of mouth, hold the total
 * still, and the weeks move — so the run is reading it rather than reciting it.
 */

import type { Channel, Format } from './format';

/**
 * The flat run: twenty weeks of relative weight before anything bends it.
 *
 * Weekly rather than daily because the ledger posts weekly and a daily curve would
 * be ninety per cent interpolation dressed as detail. Twenty because week twenty-one
 * of the table carried less than a thousandth of the weight and the row was noise.
 *
 * The shape is a decay with a shoulder — the second week holds most of the first,
 * and the fall steepens after it. That is the shape of a thing an audience arrives
 * at over a fortnight rather than in a night.
 */
export const THE_RUN: readonly number[] = [
  100, 74, 52, 38, 28, 21, 16, 12.5, 10, 8,
  6.5, 5.2, 4.2, 3.4, 2.7, 2.2, 1.8, 1.4, 1.1, 0.9,
];

/** How many weeks a theatrical run is tracked for. */
export const WEEKS_OF_RUN = THE_RUN.length;

/**
 * How far the curve can be bent, either way.
 *
 * At 1 the tilt would be able to invert the run — week twenty heavier than week
 * one — which no release has ever done and which would make the number a fantasy
 * rather than a lever. Two thirds was where the worst word of mouth still left the
 * opening week the largest and the best still left week one ahead of week five.
 */
export const MOST_BEND = 0.66;

/**
 * Bends the flat run by word of mouth and normalises it.
 *
 * `wordOfMouth` runs −1 (nobody recommends it) to +1 (everybody does). The tilt is
 * applied as a per-week exponent on position rather than as two separate branches,
 * because two branches is two chances to get the sign backwards — which is exactly
 * the class of bug `sweepDirection` was built after finding.
 *
 * Returns weights summing to one, so the caller multiplies a total by them and does
 * not have to know how many weeks there are.
 */
export function bendTheRun(wordOfMouth: number, legs: number): readonly number[] {
  const mouth = Math.max(-1, Math.min(1, wordOfMouth));
  const held = Math.max(0, Math.min(1, legs));
  // Two tilts, and they are genuinely separate. The format's own `legs` is a
  // property of the object — a continuing series re-opens every part and a
  // made-for-television film does not — and it tilts the curve on its own,
  // before anybody has an opinion. Word of mouth is then a second tilt on top,
  // scaled by how much the format leaves room for one.
  //
  // The first draft folded them into a single product, `mouth * MOST_BEND * legs`,
  // which meant `legs` did nothing at all at neutral word of mouth: a serial and
  // an anthology produced the same curve, and with bad word of mouth a longer-
  // legged format came out *more* front-loaded than a short-legged one. That is
  // backwards, it read plausibly, and `sweepDirection` is what found it — the
  // same class of inverted sign it was built after.
  const bend = Math.max(-MOST_BEND, Math.min(
    MOST_BEND,
    (held - 0.5) + mouth * MOST_BEND * held,
  ));
  const bent = THE_RUN.map((weight, index) => {
    // Position through the run, 0 at the opening and 1 at the end. Weight is
    // moved along it: positive bend lifts the far end, negative lifts the near.
    const along = index / (THE_RUN.length - 1);
    return weight * (1 + bend * (along * 2 - 1));
  }).map((w) => Math.max(0, w));
  const total = bent.reduce((sum, w) => sum + w, 0);
  // A format with no legs at all collapses to its opening week, and the guard
  // below is what stops that dividing by nothing.
  if (total <= 0) return THE_RUN.map((_, i) => (i === 0 ? 1 : 0));
  return bent.map((w) => w / total);
}

/**
 * A thing that airs once has no run, whatever the table says.
 *
 * Read by `bendTheRun`'s caller rather than by `bendTheRun`, because a format with
 * `legs: 0` still has a first week and the curve has to put everything in it. This
 * is the shape that produces.
 */
export const AIRS_ONCE: readonly number[] = THE_RUN.map((_, i) => (i === 0 ? 1 : 0));

export interface Window {
  /** Stable id, used as the ledger account suffix. */
  id: string;
  /** What it is called on a statement. */
  label: string;
  /** Which channel's release opens it. */
  after: Channel;
  /** Weeks after that channel's run begins before this window opens. */
  opensAfterWeeks: number;
  /**
   * What this window takes, as a share of what the opening channel took.
   *
   * A share rather than a figure, because an ancillary that pays the same on a
   * hit and a failure is not an ancillary, it is a grant.
   */
  share: number;
  /** How many weeks it pays over, flat. */
  weeks: number;
}

/**
 * The windows, and the order they open in.
 *
 * Five. Each one is a separate ledger account and a separate posting, which is what
 * makes the statement answer "where did this money come from" rather than showing a
 * single line called revenue.
 *
 * The shares are SLATE's own and they are deliberately conservative: together the
 * ancillaries come to rather less than the opening channel, because a library that
 * out-earns its own releases would make the release decision the small one.
 */
export const WINDOWS: readonly Window[] = [
  {
    id: 'home',
    label: 'Home Release',
    after: 'theatrical',
    opensAfterWeeks: 14,
    share: 0.34,
    weeks: 26,
  },
  {
    id: 'service',
    label: 'Sold To A Service',
    after: 'theatrical',
    opensAfterWeeks: 30,
    share: 0.22,
    weeks: 12,
  },
  {
    id: 'broadcast-window',
    label: 'Sold To A Broadcaster',
    after: 'theatrical',
    opensAfterWeeks: 52,
    share: 0.14,
    weeks: 8,
  },
  {
    id: 'abroad',
    label: 'Sold Abroad',
    after: 'theatrical',
    opensAfterWeeks: 6,
    share: 0.41,
    weeks: 20,
  },
  {
    // The one window that hangs off a thing that never opened in a cinema, which
    // is why `after` is a field rather than an assumption. A series has no home
    // release and no foreign theatrical, and it does get sold on again.
    id: 'resold',
    label: 'Sold On',
    after: 'broadcast',
    opensAfterWeeks: 20,
    share: 0.30,
    weeks: 16,
  },
];

export const WINDOWS_AFTER: Readonly<Record<Channel, readonly Window[]>> = {
  theatrical: WINDOWS.filter((w) => w.after === 'theatrical'),
  broadcast: WINDOWS.filter((w) => w.after === 'broadcast'),
  streaming: WINDOWS.filter((w) => w.after === 'streaming'),
};

/**
 * What the distributor keeps of a theatrical gross.
 *
 * The exhibitor's half never reaches the company at all, which is why what a
 * picture "made" and what its owner banked are different numbers and the statement
 * shows both. Set at the customary split rather than measured, and flagged here as
 * the one figure in this file with no derivation behind it.
 */
export const EXHIBITOR_KEEPS = 0.48;

/** What a distributor charges to handle a release, off the top of the rental. */
export const DISTRIBUTION_FEE = 0.22;

/**
 * The share of a campaign that is spent before the thing opens.
 *
 * The rest goes out across the first weeks of the run, which is why a campaign is
 * two postings and not one, and why pulling a release forward cannot recover the
 * money already spent announcing the old date.
 */
export const CAMPAIGN_UPFRONT = 0.8;

/**
 * Which month a release lands in, and what the audience is doing that month.
 *
 * Twelve rows, indexed by month from January. A multiplier on the opening rather
 * than on the whole run, because a crowded December hurts an opening and does
 * nothing to a tail that is still playing in February.
 *
 * Set from the shape of a year rather than measured: the two peaks are summer and
 * the end of the year, and the troughs are the weeks after each of them.
 */
export const SEASON: readonly number[] = [
  0.82, 0.86, 0.94, 0.97, 1.08, 1.18,
  1.22, 1.14, 0.93, 0.96, 1.05, 1.24,
];

export const MONTH_SAID: readonly string[] = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Whether a format can be sold down a channel at all.
 *
 * The refusal that makes `Format.channels` a fact rather than a hint. A
 * micro-series has one channel on its row and this is what reads it.
 */
export function whyNotThisChannel(format: Format, channel: Channel): string | undefined {
  if (format.channels.includes(channel)) return undefined;
  const open = format.channels.join(', ');
  return `${format.label} does not open ${channel === 'theatrical' ? 'in cinemas' : `on ${channel}`}. `
    + `What is open to it: ${open}.`;
}
