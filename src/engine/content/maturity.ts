/**
 * SLATE — how far along something is, which is never one number.
 *
 * A picture does not have a state. It has six of them, and they move
 * independently: what the picture looks like, what it sounds like, whether the
 * performance is there, whether the rights are clean, whether it has passed
 * compliance, and whether it conforms to the spec somebody will actually
 * accept. An act can be beautifully cut and legally undeliverable. A shot can
 * be lit and tracking a temporary voice. A season can be finished and destroyed
 * at week nineteen by a withdrawn consent.
 *
 * ## Done is the minimum, never the picture
 *
 * The rule this file exists to enforce, straight out of the research:
 *
 * > Done(t) = MIN across dimensions, never picture alone.
 *
 * A scene that is cut, graded and unlicensed is zero per cent done, and saying
 * otherwise is the single most common lie a production-management tool tells.
 * `doneShare` in `world/maturity.ts` takes the minimum and nothing else.
 *
 * ## The ladder is data, and it differs by what you are making
 *
 * Each way of making something declares, per dimension, an ordered list of
 * rungs ending in a terminal one. A live-action picture's cut goes assembled,
 * cut, locked, graded. An unscripted season's goes stringout, paper cut,
 * assembly, producer's cut, executive's cut, broadcaster's cut, locked — which
 * is a real ladder from the real business, and is longer because on that form
 * the notes are the work.
 *
 * Both are rows in the same table. Nothing in the engine knows the name of a
 * rung; it knows a dimension has an order and a last one.
 *
 * ## Rungs go down as well as up
 *
 * The reason this is a ladder and not a counter. A regression sends a
 * dimension back down, and the cost of that is the signature of the form:
 * free and infinite in animation, a week of destroyed work in stop-motion, a
 * recalled cast and crew in live action, and in unscripted a thing that cannot
 * be answered at all except by new access or a restructure.
 */

// ---------------------------------------------------------------------------
// The dimensions
// ---------------------------------------------------------------------------

export type DimensionId =
  | 'picture' | 'sound' | 'performance' | 'rights' | 'compliance' | 'conform';

export interface Dimension {
  id: DimensionId;
  /** Title Case, for a screen. */
  label: string;
  /** What it tracks, in the world's words. */
  what: string;
  /** Why it can hold everything else up on its own. */
  holdsUp: string;
}

/**
 * The six, in the order a person would worry about them.
 *
 * Picture and sound first because they are what people think finishing means.
 * The last three are the ones that surprise everybody, and they are where a
 * finished thing turns out not to be finished.
 */
export const DIMENSIONS: readonly Dimension[] = [
  {
    id: 'picture',
    label: 'Picture',
    what: 'What it looks like: assembled, cut, locked, graded.',
    holdsUp: 'A cut that’s still moving finishes nothing downstream of it, so everything waits on lock.',
  },
  {
    id: 'sound',
    label: 'Sound',
    what: 'Dialogue, effects and music, up to a mix a distributor will accept.',
    holdsUp: 'A mix is made against a locked picture, so a late recut throws away work that was already signed off.',
  },
  {
    id: 'performance',
    label: 'Performance',
    what: 'Whether what was needed was actually got, and whether it can be got again.',
    holdsUp: 'The one dimension that can become impossible rather than expensive. People age, go elsewhere, and refuse.',
  },
  {
    id: 'rights',
    label: 'Rights And Consent',
    what: 'Whether the thing being sold is owned: chain of title, music, archive, likeness, and a contributor’s consent.',
    holdsUp: 'A gap here stops a sale dead, and it’s discovered long after the mistake was made.',
  },
  {
    id: 'compliance',
    label: 'Compliance',
    what: 'Legal review, fairness, duty of care, and whatever a broadcaster’s standards department says.',
    holdsUp: 'It can destroy finished work rather than delay it, and it arrives at the end when there’s no time.',
  },
  {
    id: 'conform',
    label: 'Conform',
    what: 'Masters, captions, textless elements, the versions and the quality check.',
    holdsUp: 'The least interesting dimension and the one that most often misses a date, because nobody owns it.',
  },
];

export const dimensionById = (id: string): Dimension | undefined =>
  DIMENSIONS.find((d) => d.id === id);

// ---------------------------------------------------------------------------
// The ladders
// ---------------------------------------------------------------------------

export interface Rung {
  id: string;
  /** Title Case, for a screen. */
  label: string;
  /** What being at this rung means. */
  what: string;
}

export type Ladders = Record<DimensionId, readonly Rung[]>;

const rung = (id: string, label: string, what: string): Rung => ({ id, label, what });

/**
 * A picture's ladders.
 *
 * The picture ladder is the live-action one from the research —
 * unscheduled, scheduled, shot, selected, cut, locked, finished — compressed
 * to the rungs that are actually distinguishable from outside a cutting room.
 */
const PICTURE_LADDERS: Ladders = {
  picture: [
    rung('nothing', 'Not Shot', 'A schedule, and nothing shot against it yet.'),
    rung('shot', 'Shot', 'It’s on a drive. Nobody has decided which take.'),
    rung('assembled', 'Assembled', 'Every scene is in order at its full length, and it plays badly.'),
    rung('cut', 'Cut', 'It’s the length it’s going to be, give or take a reel.'),
    rung('locked', 'Locked', 'Picture lock. Everything downstream can finally start for real.'),
    rung('graded', 'Graded', 'Color is done and the picture is what it will be forever.'),
  ],
  sound: [
    rung('nothing', 'As Recorded', 'Production sound, and no work done to it.'),
    rung('edited', 'Edited', 'Dialogue cleaned, effects cut, music laid against a picture that may still move.'),
    rung('mixed', 'Mixed', 'The final mix, made against a locked picture.'),
  ],
  performance: [
    rung('nothing', 'Not Got', 'It hasn’t been shot.'),
    rung('captured', 'Captured', 'It’s in the can, and whether it’s good is a different question.'),
    rung('complete', 'Complete', 'Including whatever had to be looped afterward.'),
  ],
  rights: [
    rung('nothing', 'Not Cleared', 'Something in this is owned by a person the company has no deal with.'),
    rung('optioned', 'Underlying Held', 'The material itself is owned. Music and likeness aren’t.'),
    rung('cleared', 'Cleared', 'Chain of title, music, archive and likeness all the way through.'),
  ],
  compliance: [
    rung('nothing', 'Not Reviewed', 'No lawyer has watched it.'),
    rung('reviewed', 'Reviewed', 'Counsel has been through it and raised what they raised.'),
    rung('passed', 'Passed', 'Signed off, including whatever had to change to get there.'),
  ],
  conform: [
    rung('nothing', 'Unmastered', 'The picture exists. A master a distributor would accept does not.'),
    rung('mastered', 'Mastered', 'The master exists and hasn’t been checked.'),
    rung('accepted', 'Accepted', 'Through quality control, in every version the contract names.'),
  ],
};

/**
 * A season's ladders, and the picture one is the real difference.
 *
 * Straight from the research: stringouts built, paper cut, assembly,
 * producer's cut, executive's cut, broadcaster's cut, lock. Seven rungs
 * against a picture's six, and every one of them is a person with the
 * authority to send it back down — which is exactly why unscripted post is
 * measured in editor-weeks and rounds rather than in anything to do with
 * shooting.
 *
 * Rights and compliance are separate ladders here for the reason the whole
 * vector exists. On a picture they are paperwork settled in advance. On a
 * season they are a live hazard to finished work: a contributor can withdraw
 * consent after lock, and the act goes in the bin.
 */
const SEASON_LADDERS: Ladders = {
  picture: [
    rung('nothing', 'Unwatched', 'The rig is running and nobody has looked at any of it.'),
    rung('stringout', 'Stringouts', 'Every usable moment pulled and grouped. The raw material of a story.'),
    rung('paper', 'Paper Cut', 'A story producer has written the episode from footage that already exists.'),
    rung('assembly', 'Assembly', 'Cut long — routinely twice the running time it has to become.'),
    rung('producer', 'Producer’s Cut', 'Down to something that plays, and the first version anybody defends.'),
    rung('exec', 'Executive’s Cut', 'After the notes from inside the company.'),
    rung('broadcaster', 'Broadcaster’s Cut', 'After the notes from the people paying for it. Those are the ones that count.'),
    rung('locked', 'Locked', 'The episode is the episode.'),
  ],
  sound: [
    rung('nothing', 'As Recorded', 'Rig audio and radio mics, straight off the cards.'),
    rung('edited', 'Tracklaid', 'Dialogue cleaned up, music from the package laid in.'),
    rung('mixed', 'Mixed', 'Dubbed and levelled to the broadcaster’s spec.'),
  ],
  performance: [
    rung('nothing', 'Not Happened', 'The moment hasn’t occurred, and nobody can make it occur.'),
    rung('captured', 'Banked', 'It happened and the rig caught it. There’s no second take of it, ever.'),
    rung('complete', 'Covered', 'Including the pickup interview that makes it cuttable.'),
  ],
  rights: [
    rung('nothing', 'No Consent', 'A person on screen hasn’t signed, or has withdrawn.'),
    rung('optioned', 'Signed', 'Appearance agreements in hand from everybody on screen.'),
    rung('cleared', 'Cleared', 'Consent, music, archive and third-party footage all the way through.'),
  ],
  compliance: [
    rung('nothing', 'Not Reviewed', 'Nobody has watched this for fairness, welfare or standards.'),
    rung('reviewed', 'Reviewed', 'Compliance has been through it and raised what they raised.'),
    rung('passed', 'Passed', 'Cleared for transmission, including whatever had to be recut.'),
  ],
  conform: [
    rung('nothing', 'Unmastered', 'No transmission master, and no subtitles or audio description.'),
    rung('mastered', 'Mastered', 'The transmission master exists, with subtitles and audio description.'),
    rung('accepted', 'Accepted', 'Through the broadcaster’s technical review, which rejects for things nobody watching would notice.'),
  ],
};

export const LADDER_SETS: Record<string, Ladders> = {
  picture: PICTURE_LADDERS,
  season: SEASON_LADDERS,
};

export const laddersFor = (id: string): Ladders => LADDER_SETS[id] ?? PICTURE_LADDERS;

/** The rungs of one dimension under one ladder set. */
export const rungsOf = (ladders: string, dimension: DimensionId): readonly Rung[] =>
  laddersFor(ladders)[dimension];

/** The rung everything starts at, which is the bottom one. */
export const bottomOf = (ladders: string, dimension: DimensionId): string =>
  rungsOf(ladders, dimension)[0]!.id;

/** The rung that means this dimension is finished. */
export const terminalOf = (ladders: string, dimension: DimensionId): string => {
  const rungs = rungsOf(ladders, dimension);
  return rungs[rungs.length - 1]!.id;
};
