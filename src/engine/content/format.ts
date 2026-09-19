/**
 * SLATE — what shape a thing is made in, and why the shape is not a label.
 *
 * The build used to ask one question here and it was the wrong one. `medium` —
 * `film` or `television` — was taken first, in a modal, before anybody knew the
 * budget or the schedule, was never writable again, and for `film` it collapsed
 * every later choice to a single option. One irreversible decision, made with the
 * least information anybody would ever have.
 *
 * A format is the decision that question was standing in front of. It says how many
 * parts there are, how long each one runs, where the thing can be sold, how long an
 * audience stays with it, and how far a follow-up can carry. `medium` falls out of
 * the format rather than gating it.
 *
 * ## The test every row here had to pass
 *
 * `docs/research/README.md` states it: an option earns its place when something reads
 * it. Not when it is plausible, not when it is real. A list of twelve formats where
 * the choice changes a noun is worse than six where it changes what happens next.
 *
 * So every field on a row is read by something downstream, and the rows differ on
 * fields rather than on prose:
 *
 *   - `cadences` is checked against the story engine. A transformation engine has a
 *     bottom to it, so it cannot carry a returning series, and a format that asks for
 *     one is refused in the room.
 *   - `parts` and `secondsEach` build the part list and set what the thing owes,
 *     which is what the schedule and the cutting room are measured in.
 *   - `channels` decides where it can be sold. Anything very short opens on a
 *     service or it opens nowhere, and that is a refusal rather than a bad price.
 *   - `expectsCampaignCents` is the floor an audience expects before it has heard of
 *     the thing. Under it the campaign term goes negative rather than merely small.
 *   - `legs` is how long it holds an audience once the run starts.
 *   - `carriesForward` is how much of a hit a follow-up inherits, which is the whole
 *     difference between a format that can found a franchise and one that cannot.
 *
 * ## Why a made-for-television film is its own row and not a feature with a flag
 *
 * Because it differs on five fields at once — one part like a feature, broadcast-only
 * like a series, a campaign floor an order of magnitude below a theatrical one, no
 * legs because it airs once, and almost nothing carried forward. A boolean on the
 * feature row would have had five things reading it, which is five branches, which is
 * the shape of a row that wanted to be a row.
 */

import type { Cadence } from './concept';

/**
 * Where a finished thing can be sold.
 *
 * Three, and the separation is what makes the windows mean anything: a channel has
 * its own audience, its own run and its own tail behind it. A format that lists one
 * channel is not a format with a restriction, it is a different object.
 */
export type Channel = 'theatrical' | 'broadcast' | 'streaming';

export const CHANNELS: readonly Channel[] = ['theatrical', 'broadcast', 'streaming'];

/** What a channel is called on a screen. */
export const CHANNEL_LABEL: Readonly<Record<Channel, string>> = {
  theatrical: 'In Cinemas',
  broadcast: 'On Air',
  streaming: 'On A Service',
};

export interface Format {
  /** Stable id. Saved on the project, so renaming one costs a migration. */
  id: string;
  /** Title Case, for a screen. */
  label: string;
  /** What this is, said to the person choosing it. */
  what: string;
  /** Which it counts as, once chosen. Derived from the format, never asked. */
  medium: 'film' | 'television';
  /** The cadences this shape can honestly take, checked against the story engine. */
  cadences: readonly Cadence[];
  /** How many parts, least and most. One for anything that is one sitting. */
  parts: { least: number; most: number };
  /** Seconds of finished screen time per part, least and most. */
  secondsEach: { least: number; most: number };
  /** Where it can be sold. Absence is a refusal, not a penalty. */
  channels: readonly Channel[];
  /**
   * What a campaign has to reach before an audience has heard of it.
   *
   * Not a cost and not a minimum anybody is stopped at — a threshold the campaign
   * term is measured against. Spending under it is worse than spending nothing,
   * because a half-campaign buys awareness without reach.
   */
  expectsCampaignCents: number;
  /**
   * How long it holds an audience, as the share of the run's weight falling after
   * the opening.
   *
   * Zero means it airs once and there is no second week. Set from the shape of the
   * object: a feature opens and decays, a continuing series re-opens every part, an
   * anthology sits between because each part has to find its audience again.
   */
  legs: number;
  /**
   * How much of a success a follow-up inherits.
   *
   * The franchise term reads this. A feature founds a franchise and a
   * made-for-television film does not, and the difference is a number here rather
   * than a branch somewhere else. Zero means a follow-up starts from nothing, which
   * is the honest answer for a thing nobody remembers the name of.
   */
  carriesForward: number;
}

/**
 * The formats, and the axes they differ on.
 *
 * Six. The list stopped there because the seventh candidate — a two-part event film —
 * differed from the limited series row on nothing but its name, and a row that changes
 * no outcome is the exact thing `tools/wired.mjs` exists to catch.
 */
export const FORMATS: readonly Format[] = [
  {
    id: 'feature',
    label: 'A Feature Film',
    what: 'One picture, one sitting, opening in cinemas and living afterwards on '
      + 'everything else.',
    medium: 'film',
    cadences: ['single'],
    parts: { least: 1, most: 1 },
    secondsEach: { least: 80 * 60, most: 180 * 60 },
    channels: ['theatrical', 'broadcast', 'streaming'],
    expectsCampaignCents: 250_000_00,
    legs: 0.62,
    // The highest here. A feature is the thing an audience remembers the name of,
    // so it is the thing a follow-up can be sold on.
    carriesForward: 0.55,
  },
  {
    id: 'tv-movie',
    label: 'A Film Made For Television',
    what: 'One picture, made to air rather than to open. Cheaper to sell and it '
      + 'only happens once.',
    medium: 'film',
    cadences: ['single'],
    parts: { least: 1, most: 1 },
    secondsEach: { least: 70 * 60, most: 110 * 60 },
    channels: ['broadcast', 'streaming'],
    expectsCampaignCents: 20_000_00,
    // None at all. It airs on a night and there is no second night, and that is the
    // whole difference between this row and the feature above it.
    legs: 0,
    carriesForward: 0.08,
  },
  {
    id: 'miniseries',
    label: 'A Limited Series',
    what: 'One story told across a handful of parts, ending where it was always '
      + 'going to end.',
    medium: 'television',
    cadences: ['closed'],
    parts: { least: 3, most: 8 },
    secondsEach: { least: 45 * 60, most: 60 * 60 },
    channels: ['broadcast', 'streaming'],
    expectsCampaignCents: 60_000_00,
    legs: 0.55,
    // A limited series says it is finished in its own title, so what a follow-up
    // inherits is the maker's name rather than the story's.
    carriesForward: 0.30,
  },
  {
    id: 'anthology',
    label: 'An Anthology',
    what: 'Parts that share a frame and nothing else — a new story and a new cast '
      + 'each time.',
    medium: 'television',
    cadences: ['closed', 'returning'],
    parts: { least: 4, most: 12 },
    secondsEach: { least: 30 * 60, most: 60 * 60 },
    channels: ['broadcast', 'streaming'],
    // Between the two, for a reason that is the format's whole problem: every part
    // has to find its audience again from nearly nothing, so the tail is real and it
    // never compounds the way a continuing story's does.
    legs: 0.40,
    expectsCampaignCents: 45_000_00,
    // And the flip side of the same problem: the frame is the brand, so it carries
    // further than any one part of it ever could.
    carriesForward: 0.48,
  },
  {
    id: 'serial',
    label: 'A Continuing Series',
    what: 'One long story in many parts, each one ending somewhere that makes the '
      + 'next one necessary.',
    medium: 'television',
    cadences: ['closed', 'returning'],
    parts: { least: 6, most: 24 },
    secondsEach: { least: 40 * 60, most: 60 * 60 },
    channels: ['broadcast', 'streaming'],
    expectsCampaignCents: 80_000_00,
    // The highest, because a serial does not have one opening — it has as many as it
    // has parts, and each arrives at an audience the last one built.
    legs: 0.78,
    carriesForward: 0.62,
  },
  {
    id: 'micro',
    label: 'A Micro-Series',
    what: 'Very short parts, many of them, made for a service and watched in '
      + 'handfuls.',
    medium: 'television',
    cadences: ['closed', 'returning'],
    parts: { least: 8, most: 40 },
    secondsEach: { least: 3 * 60, most: 8 * 60 },
    // One channel, and it is the reason this row exists. Anything this short opens
    // here or it opens nowhere, and the refusal says so instead of pricing it badly.
    channels: ['streaming'],
    expectsCampaignCents: 8_000_00,
    legs: 0.70,
    carriesForward: 0.22,
  },
];

export const FORMAT_BY_ID: Readonly<Record<string, Format>> = Object.fromEntries(
  FORMATS.map((one) => [one.id, one]),
);

export const formatById = (id: string | undefined): Format | undefined =>
  (id === undefined ? undefined : FORMAT_BY_ID[id]);

/** The formats a given cadence can be made in. */
export const formatsFor = (cadence: Cadence): readonly Format[] =>
  FORMATS.filter((one) => one.cadences.includes(cadence));

/** The formats that can be sold down a given channel. */
export const formatsOn = (channel: Channel): readonly Format[] =>
  FORMATS.filter((one) => one.channels.includes(channel));

/**
 * The most parts any format asks for, which is the ceiling everything else clamps to.
 *
 * Derived from the rows rather than typed, because a typed ceiling and a row that
 * exceeds it is a defect nobody notices until a season of forty-one arrives.
 */
export const MOST_PARTS_ANY_FORMAT = FORMATS.reduce((most, one) => Math.max(most, one.parts.most), 0);

/**
 * Why this many parts at this length cannot be made in this format.
 *
 * Returns the reason, or undefined when it can. A refusal names the range, because a
 * refusal that does not say where to go is a wall rather than a rule.
 */
export function whyNotThisShape(
  format: Format,
  parts: number,
  secondsEach: number,
): string | undefined {
  if (!Number.isInteger(parts) || parts < format.parts.least || parts > format.parts.most) {
    return `${format.label} runs to between ${format.parts.least} and ${format.parts.most} parts, `
      + `and ${parts} isn’t in that range.`;
  }
  const leastMin = Math.round(format.secondsEach.least / 60);
  const mostMin = Math.round(format.secondsEach.most / 60);
  if (secondsEach < format.secondsEach.least || secondsEach > format.secondsEach.most) {
    return `A part of ${format.label} runs between ${leastMin} and ${mostMin} minutes, `
      + `and ${Math.round(secondsEach / 60)} isn’t in that range.`;
  }
  return undefined;
}

/**
 * Why this format cannot be sold down this channel.
 *
 * The refusal that makes `channels` a fact rather than a hint, and the reason a
 * micro-series row can carry one entry without anybody having to special-case it.
 */
export function whyNotThisChannel(format: Format, channel: Channel): string | undefined {
  if (format.channels.includes(channel)) return undefined;
  return `${format.label} doesn’t open ${channel === 'theatrical' ? 'in cinemas' : `on ${channel}`}. `
    + `What is open to it: ${format.channels.map((c) => CHANNEL_LABEL[c]).join(', ')}.`;
}
