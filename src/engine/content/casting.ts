/**
 * SLATE — what a part is, and what the person playing it is actually worth.
 *
 * The game has eight hundred and thirteen acting attributes and, until this
 * file, nothing in the tree read a single one of them. That is the largest
 * unwired thing in the build by a wide margin — `docs/DEPTH.md` has carried the
 * row `813 acting attributes | 0` since the ledger was written — and casting is
 * the system that was always going to be its reader. A part goes to somebody,
 * and what they are on that part is what their sheet says.
 *
 * ## Three axes, three consequences, or it is one number wearing three names
 *
 * The research is blunt about the failure here: an audition must not resolve to
 * a single score, because the reason casting exists at all is that different
 * rooms weight the same performer differently. So a read is a vector — and a
 * vector is only a vector if the axes go somewhere different.
 *
 * These three do, and that is the test each of them had to pass:
 *
 * - **Truth** is whether it is any good, and it is read by what the finished
 *   thing sells for. Nothing else.
 * - **Repeatable** is whether take nine cuts with take two, and it is read by
 *   how much material the shoot banks per finished second — which is the
 *   shooting ratio, which is how long the cutting room wades, which is whether
 *   the picture makes its date. It never touches the money.
 * - **How It Reads** is what the lens does with a face, and it is read by what
 *   the picture sells for and by nothing on the floor.
 *
 * Truth and How It Reads both reach the sale, and they reach it differently: a
 * magnificent performance in a face the camera does not want is a different
 * picture from a beautiful blank, and the two axes are what make those two
 * pictures different objects rather than the same number twice.
 *
 * ## Sizes are a shape, not a ladder
 *
 * A lead is not a better day player. The sizes below differ in how much of the
 * picture they carry, how many of them a title has, and — the one that costs
 * real money — whether one of them is engaged across the whole title or for a
 * single part. A television regular is the expensive word in that sentence.
 *
 * ## What is real here and what is ours
 *
 * The employment categories, the shape of a quote and the pass reasons are
 * real, drawn from `docs/research/PIPELINE.md` section 7. The attribute
 * groupings are SLATE's own — nobody publishes a list of which acting skills
 * add up to repeatability — and so are the cast share and the take curve, both
 * fitted so the numbers that fall out land where the research says the real
 * ones do.
 */

import type { Money } from '../core/money';

// ---------------------------------------------------------------------------
// What a read is
// ---------------------------------------------------------------------------

export type AxisId = 'truth' | 'repeatable' | 'reads';

export interface Axis {
  id: AxisId;
  /** Title Case, for a screen. */
  label: string;
  /** What it is, in the words somebody watching would use. */
  what: string;
  /** What in the build reads it, said out loud so an unread axis is obvious. */
  moves: string;
  /**
   * The attributes it averages, by id.
   *
   * Every one of these is a real row in `domain/attributes.ts`, and a
   * misspelling would silently average a base the sheet never set — so
   * `tests/casting.test.ts` checks each id resolves.
   */
  of: readonly string[];
}

/**
 * The three things a producer is actually buying.
 *
 * Deliberately three and not eight. The research lists eight axes a real room
 * carries, and five of them — listening, size, control, specificity,
 * directability — resolve inside an audition scene this build does not have
 * yet. Writing them here with nothing reading them would be the exact disease
 * the depth ledger exists to catch. They arrive with the room.
 */
export const AXES: readonly Axis[] = [
  {
    id: 'truth',
    label: 'Truth',
    what: 'Whether what happens in the take reads as something happening to a person, or as an actor doing acting at you.',
    moves: 'What the finished picture is reckoned to take.',
    of: [
      'emotional_truth', 'active_listening', 'given_circumstances',
      'character_construction', 'illusion_of_the_first_time', 'impulse_work',
      'justification',
    ],
  },
  {
    id: 'repeatable',
    label: 'Repeatable',
    what: 'Whether take nine matches take two closely enough to cut together. The axis everybody forgets and every producer cares about.',
    moves: 'The shooting ratio: how much material the shoot banks for every finished second.',
    of: [
      'take_consistency', 'repeatable_emotional_beats', 'matching_physical_business',
      'continuity_awareness', 'hitting_marks', 'keeping_overlaps_clean',
      'holding_through_the_cut',
    ],
  },
  {
    id: 'reads',
    label: 'How It Reads',
    what: 'What the lens does with this particular face. Not beauty, and not technique: a thing that happens between a person and a piece of glass.',
    moves: 'What the finished picture is reckoned to take.',
    of: [
      'photogenic_quality', 'charisma', 'magnetism', 'close_up_work',
      'direct_lens_address',
    ],
  },
];

export const axisById = (id: string): Axis | undefined => AXES.find((a) => a.id === id);

/** Every attribute any axis reads, deduplicated. */
export const ATTRIBUTES_READ: readonly string[] =
  [...new Set(AXES.flatMap((axis) => axis.of))];

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

export type SizeId = 'lead' | 'support' | 'guest' | 'day';

export interface Size {
  id: SizeId;
  /** Title Case, for a screen. */
  label: string;
  /** What it is, the way a breakdown would say it. */
  what: string;
  /**
   * How many of them a title carries, per hour of finished runtime.
   *
   * Fractional on purpose. A hundred-minute feature at 1.2 leads an hour is
   * two leads; a fifty-minute episode at the same rate is one.
   */
  perHour: number;
  /**
   * Whether one of them is engaged across the whole title or for a single part.
   *
   * The expensive word in television. A regular is `title`, and eight episodes
   * of a regular is eight times the money of the guest who does one.
   */
  across: 'title' | 'part';
  /**
   * Share of the picture's screen time one of them is on.
   *
   * What weights the axes into a cast: a lead's repeatability costs the shoot
   * far more than a day player's, because the lead is in far more of it.
   */
  onScreen: number;
  /** How the cast money divides, before any one quote moves it. */
  weight: number;
}

/**
 * The four sizes this build casts.
 *
 * The research lists twenty-five employment categories and every one of them
 * is real. These four are the ones that differ in the engine rather than on
 * paper: how much of the picture you carry, how many of you there are, and
 * whether you are on the whole thing or one piece of it. A body double and a
 * stand-in differ from each other enormously and from these four not at all,
 * as far as anything in this tree can currently tell — so they are not here,
 * and `docs/COVERAGE-MATRIX.md` says so rather than this list implying it.
 */
export const SIZES: readonly Size[] = [
  {
    id: 'lead',
    label: 'Lead',
    what: 'The part the picture is about. On screen for most of it, on the poster, and the one a buyer asks about first.',
    perHour: 1.2,
    across: 'title',
    onScreen: 0.55,
    weight: 1,
  },
  {
    id: 'support',
    label: 'Supporting',
    what: 'The parts around the lead that recur across the picture. Fewer scenes, the same months.',
    perHour: 2.4,
    across: 'title',
    onScreen: 0.2,
    weight: 0.3,
  },
  {
    id: 'guest',
    label: 'Guest',
    what: 'One part, one block, one story. On a season that is an episode; on a feature it is a sequence.',
    perHour: 3,
    across: 'part',
    onScreen: 0.12,
    weight: 0.12,
  },
  {
    id: 'day',
    label: 'Day Player',
    what: 'A scene, a handful of lines, a day. Cast late, paid little, and capable of sinking a scene the picture needs.',
    perHour: 6,
    across: 'part',
    onScreen: 0.03,
    weight: 0.03,
  },
];

export const sizeById = (id: string): Size | undefined => SIZES.find((s) => s.id === id);

// ---------------------------------------------------------------------------
// What cast costs
// ---------------------------------------------------------------------------

/**
 * Share of the negative that goes on performers.
 *
 * SLATE's own, sized to the ordinary above-the-line cast line on a picture
 * with no star attached. It is the pot the sizes divide, so a company that
 * greenlights cheap has a small pot and reaches nobody good, which is the
 * whole shape of the decision.
 */
export const CAST_SHARE = 0.18;

/**
 * How much above their band a performer can be talked into, and how far below
 * their quote they will go before it is an insult.
 *
 * Both SLATE's own. The floor is the interesting one: a quote is a ratchet
 * with memory, so the reason an actor will not take less is not pride, it is
 * that the number is read by everybody who hires them next.
 */
export const HAGGLE = { over: 1.6, under: 0.8 } as const;

/**
 * Years before an old quote stops being argued from.
 *
 * A quote decays rather than expiring: business affairs pulls what you were
 * last paid, and the further back it was the less of it survives the call.
 */
export const QUOTE_LIFE = 4;

// ---------------------------------------------------------------------------
// What a cast does to the shoot
// ---------------------------------------------------------------------------

/**
 * How much material a cast banks, against what the plan says a week banks.
 *
 * The plan's figure is quoted for an ordinary cast, so this is centered on one
 * and not on a perfect one. That matters more than it looks: a curve that
 * reached 1.0 only at a hundred would mean every picture ever made shot more
 * than the published ratio for its form, and the bands in
 * `content/inventory.ts` would stop describing anything.
 *
 * `middling` is the standing a production office reaches with the money the
 * band gives it — an ordinary professional who has done this before. Above it
 * the shoot gets shorter; below it, longer. A cast that cannot repeat is not
 * worse on the day, it is more takes, and more takes is more material for the
 * same finished second: the shooting ratio going up, the cutting room wading
 * further, the delivery date.
 *
 * SLATE's own, all three numbers. End to end the curve is a bit under two to
 * one, which is about the distance between a technical actor and a
 * different-every-take one as the research describes it — and not the
 * difference between a good picture and a bad one, which is a different axis.
 */
export const TAKES = { middling: 55, best: 0.72, worst: 1.35 } as const;

/**
 * What a cast's repeatability means for a week of banking.
 *
 * Two slopes meeting at one, rather than a single slope with a clamp on it. The
 * clamp version declared a floor and a ceiling that nothing inside the scale
 * could ever reach, so the two most prominent numbers in the table described
 * something that never happened — which is a small lie of exactly the kind this
 * project keeps finding in its own work. Pinned at both ends instead: a cast at
 * a hundred banks `best` and a cast at nothing banks `worst`, and both of those
 * are real.
 */
export function takesAt(repeatable: number): number {
  const at = Math.min(100, Math.max(0, repeatable));
  return at >= TAKES.middling
    ? 1 - (1 - TAKES.best) * ((at - TAKES.middling) / (100 - TAKES.middling))
    : 1 + (TAKES.worst - 1) * ((TAKES.middling - at) / TAKES.middling);
}

// ---------------------------------------------------------------------------
// Why somebody says no
// ---------------------------------------------------------------------------

/**
 * The reasons an offer comes back a no.
 *
 * The research lists twenty that a real office records. These four are the
 * ones this build can tell apart, and each of them is produced by a different
 * branch rather than picked off a list — which is the difference between a
 * reason and a label. If a fifth branch arrives, a fifth row arrives with it.
 */
export type PassId = 'price' | 'dates' | 'size' | 'thought-about-it';

export interface Pass {
  id: PassId;
  /** Title Case, for a screen. */
  label: string;
  /** What the agent actually says, which is never the whole of it. */
  said: string;
}

export const PASSES: readonly Pass[] = [
  { id: 'price', label: 'Price', said: 'They’re not going out for that. Their quote is their quote.' },
  { id: 'dates', label: 'The Dates', said: 'They’re working. Ask again in the spring.' },
  { id: 'size', label: 'The Part', said: 'It’s a lovely part. They’re holding out for a bigger one.' },
  { id: 'thought-about-it', label: 'They Thought About It', said: 'They read it twice and they’re going to pass. No, there isn’t a reason.' },
];

export const passById = (id: string): Pass | undefined => PASSES.find((p) => p.id === id);

/** What a fee reads as, against what was asked. */
export function feeReads(feeCents: Money, quoteCents: Money): string {
  if (quoteCents <= 0) return 'no quote to argue from';
  const share = feeCents / quoteCents;
  if (share >= 1.25) return 'well over quote';
  if (share >= 1.02) return 'over quote';
  if (share >= 0.98) return 'at quote';
  if (share >= HAGGLE.under) return 'under quote';
  return 'a long way under quote';
}
