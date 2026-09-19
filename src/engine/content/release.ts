/**
 * SLATE — how money arrives after a thing is finished, and why it is never one number.
 *
 * A release is not a payment. It is a shape spread over weeks, down more than one
 * channel, each of which opens at its own moment and decays at its own rate. The
 * deleted system had none of this: a figure was reckoned, the figure was posted, and
 * a picture earned its whole life in a single instant on its delivery date.
 *
 * That was the defect worth fixing first, because it made every other decision
 * weightless. If the take is one number, the release month cannot matter, word of
 * mouth cannot matter, and the difference between a thing with legs and a thing
 * without is a difference in one multiplier — which is decoration by the rule in
 * `docs/research/PIPELINE.md`: *a format that multiplies a result is decoration.*
 *
 * ## The run is a weighting, not a schedule
 *
 * `THE_RUN` holds twenty weeks of weight. It is normalized at use rather than stored
 * normalized, so a row can be edited without anybody keeping the column summing to
 * one by hand — the kind of invariant that survives exactly as long as the person
 * who knew about it.
 *
 * ## Where the shape comes from, which is the part that bites
 *
 * A fixed curve applied to every release is the same decoration in a different coat:
 * every picture would have the same shape and only its height would differ.
 *
 * So the curve is bent by two things that are genuinely separate. **`legs`** is a
 * property of the format — a continuing series re-opens every part and a
 * made-for-television film does not — and tilts the curve before anybody has an
 * opinion. **Word of mouth** is the audience's answer, and tilts it again, scaled by
 * how much room the format leaves. A picture people tell each other about moves
 * weight out of its opening and into its tail; one they do not front-loads, takes
 * its money in a fortnight and is gone.
 *
 * The height of the run is decided elsewhere. This decides only its shape, and the
 * two are independent: a loud opening for a poor picture and a quiet one for a good
 * picture are both ordinary, and both fall out of this.
 */

import type { Channel, Format } from './format';

/**
 * The flat run: twenty weeks of relative weight before anything bends it.
 *
 * Weekly and not daily, because the tick pays weekly and a daily curve would be
 * ninety per cent interpolation dressed as detail. Twenty because week twenty-one
 * carried under a thousandth of the weight and the row was noise.
 *
 * The shape is a decay with a shoulder — the second week holds most of the first and
 * the fall steepens after it, which is the shape of a thing an audience arrives at
 * over a fortnight rather than in a night.
 */
export const THE_RUN: readonly number[] = [
  100, 74, 52, 38, 28, 21, 16, 12.5, 10, 8,
  6.5, 5.2, 4.2, 3.4, 2.7, 2.2, 1.8, 1.4, 1.1, 0.9,
];

/** How many weeks a run is tracked for. */
export const WEEKS_OF_RUN = THE_RUN.length;

/**
 * How far the curve can be bent, either way.
 *
 * At 1 the tilt could invert the run — week twenty heavier than week one — which no
 * release has ever done and which would make the number a fantasy rather than a
 * lever. Two thirds is where the worst word of mouth still leaves the opening week
 * the largest and the best still leaves week one ahead of week five.
 */
export const MOST_BEND = 0.66;

/**
 * Bends the flat run and normalizes it.
 *
 * `wordOfMouth` runs −1 (nobody recommends it) to +1 (everybody does). `legs` is the
 * format's own hold, 0 to 1.
 *
 * The two tilts are added rather than multiplied, and that is the correction worth
 * recording. The first version folded them into a single product, which meant `legs`
 * did nothing at all at neutral word of mouth — a continuing series and an anthology
 * produced identical curves — and with bad word of mouth the longer-legged format
 * came out *more* front-loaded than the short one. Backwards, and it read perfectly.
 * `sweepDirection` found it, which is the entire reason that tool exists.
 *
 * Returns weights summing to one, so a caller multiplies a total by them without
 * having to know how many weeks there are.
 */
export function bendTheRun(wordOfMouth: number, legs: number): readonly number[] {
  const mouth = Math.max(-1, Math.min(1, wordOfMouth));
  const held = Math.max(0, Math.min(1, legs));
  const bend = Math.max(-MOST_BEND, Math.min(MOST_BEND, (held - 0.5) + mouth * MOST_BEND * held));
  const bent = THE_RUN.map((weight, index) => {
    // Position through the run, 0 at the opening and 1 at the end. Weight is moved
    // along it: a positive bend lifts the far end, a negative one lifts the near.
    const along = index / (THE_RUN.length - 1);
    return Math.max(0, weight * (1 + bend * (along * 2 - 1)));
  });
  const total = bent.reduce((sum, w) => sum + w, 0);
  if (total <= 0) return AIRS_ONCE;
  return bent.map((w) => w / total);
}

/**
 * A thing that airs once has no run, whatever the table says.
 *
 * Read by the caller rather than by `bendTheRun`, because a format with `legs: 0`
 * still has a first week and the curve has to put everything in it.
 */
export const AIRS_ONCE: readonly number[] = THE_RUN.map((_, i) => (i === 0 ? 1 : 0));

/** The curve a format and a word of mouth actually produce. */
export const runFor = (format: Format, wordOfMouth: number): readonly number[] =>
  (format.legs <= 0 ? AIRS_ONCE : bendTheRun(wordOfMouth, format.legs));

export interface Window {
  /** Stable id, used as the ledger account suffix and the posting key. */
  id: string;
  /** What it is called on a statement. */
  label: string;
  /** Which channel's release opens it. */
  after: Channel;
  /** Weeks after the run begins before this window opens. */
  opensAtWeek: number;
  /**
   * What this window takes, as a share of what the opening channel returned.
   *
   * A share and not a figure, because an ancillary that pays the same on a hit
   * and a failure is not an ancillary, it is a grant.
   */
  share: number;
  /** How many weeks it pays over, evenly. */
  overWeeks: number;
}

/**
 * The windows, and the order they open in.
 *
 * Five, each its own ledger account and its own posting on its own date. That is
 * what lets a statement answer "where did this money come from" instead of showing
 * one line called revenue — and it is why the foreign sale carrying a picture the
 * cinemas never did is a thing a player can actually discover.
 *
 * The shares are SLATE's own and deliberately conservative: together the windows
 * come to rather less than the opening channel, because a library that out-earns its
 * own releases would make the release decision the small one.
 */
export const WINDOWS: readonly Window[] = [
  { id: 'abroad', label: 'Sold Abroad', after: 'theatrical', opensAtWeek: 6, share: 0.41, overWeeks: 20 },
  { id: 'home', label: 'Home Release', after: 'theatrical', opensAtWeek: 14, share: 0.34, overWeeks: 26 },
  { id: 'service', label: 'Sold To A Service', after: 'theatrical', opensAtWeek: 30, share: 0.22, overWeeks: 12 },
  { id: 'aired', label: 'Sold To A Broadcaster', after: 'theatrical', opensAtWeek: 52, share: 0.14, overWeeks: 8 },
  // The one window hanging off a thing that never opened in a cinema, which is why
  // `after` is a field rather than an assumption. A series has no home release and no
  // foreign theatrical, and it does get sold on again.
  { id: 'resold', label: 'Sold On', after: 'broadcast', opensAtWeek: 20, share: 0.30, overWeeks: 16 },
  { id: 'renewed', label: 'Renewed', after: 'streaming', opensAtWeek: 26, share: 0.35, overWeeks: 12 },
];

export const windowsAfter = (channel: Channel): readonly Window[] =>
  WINDOWS.filter((w) => w.after === channel);

/** The last week anything is still paying, which is how long a run is watched for. */
export const LAST_WEEK_ANYTHING_PAYS = WINDOWS.reduce(
  (last, w) => Math.max(last, w.opensAtWeek + w.overWeeks),
  WEEKS_OF_RUN,
);

/**
 * What the exhibitor keeps of a theatrical gross.
 *
 * Roughly half never reaches the company at all, which is why what a picture "made"
 * and what its owner banked are different numbers and the statement shows both. Set
 * at the customary split rather than measured, and flagged as one of the two figures
 * in this file with no derivation behind it.
 */
export const EXHIBITOR_KEEPS = 0.48;

/** What a distributor charges to handle a release, off the top of what comes back. */
export const DISTRIBUTION_FEE = 0.22;

/**
 * The share of a campaign spent before the thing opens.
 *
 * The rest goes out across the first weeks, which is why a campaign is two postings
 * and not one, and why pulling a date forward cannot recover what was already spent
 * announcing the old one.
 */
export const CAMPAIGN_UPFRONT = 0.8;

/**
 * Which month a release lands in, and what an audience is doing that month.
 *
 * Twelve rows from January. A multiplier on the opening rather than on the whole
 * run, because a crowded December hurts an opening and does nothing to a tail still
 * playing in February. Set from the shape of a year: two peaks, and the troughs are
 * the weeks after each of them.
 */
export const SEASON: readonly number[] = [
  0.82, 0.86, 0.94, 0.97, 1.08, 1.18,
  1.22, 1.14, 0.93, 0.96, 1.05, 1.24,
];

export const MONTH_SAID: readonly string[] = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
