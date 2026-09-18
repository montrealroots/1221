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
    what: 'Whether what happens in the take reads as something happening to a person, or as a performance aimed at you.',
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
// Where somebody is from
// ---------------------------------------------------------------------------

export interface WhereFrom {
  id: string;
  /** Title Case, for a screen. */
  label: string;
  /** Where they live, by gazetteer city id. */
  cityId: string;
  /** Whose passport, by country id. */
  citizenshipId: string;
  /** How many of the people who come in are from here, before money reaches. */
  weight: number;
  /**
   * How far a part's band has to reach before anybody from here is in the pile
   * at all, out of a hundred.
   *
   * The reason a cheap picture is cast out of the phone book and an expensive
   * one is not. Nobody flies from Los Angeles to read for a part that pays four
   * thousand euros, and no amount of wanting them changes it.
   */
  reaches: number;
  /**
   * What bringing them costs, as a share of their fee.
   *
   * Flights, a hotel for the run, and per diem for every day they are here.
   * Nought for anybody who already lives here, which is the whole of why local
   * hire is a budget decision and not only a casting one. SLATE's own, sized so
   * that a lead flown in costs about a fifth again what they are paid.
   */
  travel: number;
}

/**
 * The places the people who read for an Icelandic picture come from.
 *
 * Deliberately short and deliberately real. Iceland is a country of four
 * hundred thousand people with a working screen industry, so most of everybody
 * is from here, a good number are Nordic and come without much fuss, and the
 * English-speaking world is a long way away in every sense: it costs money to
 * reach, it costs money to bring, and one corner of it brings a union with it.
 *
 * Every city id is a real row in the gazetteer, which is the first time
 * anything in casting has read one. Weights and travel shares are SLATE's own.
 */
export const WHERE_FROM: readonly WhereFrom[] = [
  {
    id: 'here', label: 'Iceland', cityId: 'is-39-reykjavik', citizenshipId: 'is',
    weight: 62, reaches: 0, travel: 0,
  },
  {
    id: 'nordic-dk', label: 'Denmark', cityId: 'dk-17-copenhagen', citizenshipId: 'dk',
    weight: 12, reaches: 30, travel: 0.12,
  },
  {
    id: 'nordic-se', label: 'Sweden', cityId: 'se-26-stockholm', citizenshipId: 'se',
    weight: 10, reaches: 34, travel: 0.13,
  },
  {
    id: 'uk', label: 'Britain', cityId: 'uk-eng-london', citizenshipId: 'uk',
    weight: 9, reaches: 52, travel: 0.18,
  },
  {
    id: 'us', label: 'America', cityId: 'us-ca-losangeles', citizenshipId: 'us',
    weight: 7, reaches: 70, travel: 0.24,
  },
];

export const whereFromById = (id: string): WhereFrom | undefined =>
  WHERE_FROM.find((one) => one.id === id);

/** Where somebody lives, by the city they live in. */
export const whereFromCity = (cityId: string): WhereFrom | undefined =>
  WHERE_FROM.find((one) => one.cityId === cityId);

// ---------------------------------------------------------------------------
// Seeing somebody
// ---------------------------------------------------------------------------

/**
 * How far a company has got with one person for one part.
 *
 * The rounds of a casting funnel, and the reason they are rows rather than a
 * number is that they are not a ladder of *better looks at the same thing*.
 * Each one tells you about different axes, and one of them tells you something
 * false with great confidence.
 *
 * `pile` is not a round. It is what you have before you have done anything: a
 * headshot, a résumé and a credit list. It is here so that the state of knowing
 * nothing is a row with numbers in it rather than a special case somewhere.
 */
export type RoundId = 'pile' | 'tape' | 'preread' | 'callback';

export interface Round {
  id: RoundId;
  /** Title Case, for a screen. */
  label: string;
  /** What actually happens, in the words of somebody who has sat through one. */
  what: string;
  /** What has to have happened before this one can. */
  after?: readonly RoundId[];
  /**
   * Days of the casting office's diary one of them takes.
   *
   * The office runs one thing at a time, so this is the real scarcity: a
   * picture with twenty-one parts and eleven weeks of prep cannot see everybody
   * for everything, and deciding who is worth the room is the decision.
   */
  takes: number;
  /** What one costs the production, in cents. */
  costsCents: Money;
  /**
   * How far out the estimate can be on each axis afterwards, out of a hundred.
   *
   * Half-widths: the shown figure sits somewhere inside plus or minus this of
   * the truth. Note what does *not* narrow. A tape tells you a great deal about
   * whether somebody is any good and almost nothing about whether they can do
   * it again, because a tape is one take they chose out of however many they
   * shot. Only a callback closes that, because a callback is literally the
   * request to do it again.
   */
  width: Readonly<Record<AxisId, number>>;
  /**
   * Axes this round shows through the performer's own equipment instead of the
   * room's.
   *
   * Width and distortion are not the same failure, and conflating them would
   * lose the most interesting row on this table. A wide estimate makes you
   * uncertain. A distorted one makes you confident and wrong, which is worse.
   *
   * A tape is the whole of the reason this field exists. What arrives is not
   * the performer, it is their tape: shot at home, as many times as they
   * liked, in whatever light they have, cut by them, and sent only if they
   * judged it the good one. Some people are far better at that than at acting
   * and some are far worse, and neither fact is visible in the file. So the
   * distortion is signed and it is a property of the person rather than of the
   * round — which is what makes a preread a correction rather than a zoom.
   */
  distorts?: readonly AxisId[];
}

/**
 * The funnel, in the order it is walked.
 *
 * Costs are SLATE's own and deliberately small against a picture's money: what
 * casting spends is never what makes casting expensive. The office's diary is
 * what makes it expensive, and that is `takes`.
 */
export const ROUNDS: readonly Round[] = [
  {
    id: 'pile',
    label: 'The Pile',
    what: 'A headshot, a résumé and a credit list. You can see a face. Everything else is a guess wearing a number.',
    takes: 0,
    costsCents: 0,
    width: { truth: 32, repeatable: 38, reads: 14 },
  },
  {
    id: 'tape',
    label: 'A Tape',
    what: 'Sides go out and a file comes back. They shot it as many times as they liked at home and sent the one they liked best. Everything wrong with a tape is in that sentence.',
    takes: 0.25,
    costsCents: 40_00,
    width: { truth: 14, repeatable: 34, reads: 7 },
    distorts: ['truth', 'reads'],
  },
  {
    id: 'preread',
    label: 'A Preread',
    what: 'They come in, slate, read with the reader and leave. Eight minutes, and for a small part it’s the only round there will ever be.',
    takes: 0.5,
    costsCents: 220_00,
    width: { truth: 9, repeatable: 22, reads: 5 },
  },
  {
    id: 'callback',
    label: 'A Callback',
    what: 'Back in with more sides, for the person who will actually direct them. The first time anybody is directing the read instead of assessing it, and the only time anybody finds out whether take nine matches take two.',
    after: ['tape', 'preread'],
    takes: 1.5,
    costsCents: 900_00,
    width: { truth: 6, repeatable: 7, reads: 4 },
  },
];

export const roundById = (id: string): Round | undefined => ROUNDS.find((r) => r.id === id);

/** Every round that is actually a round, which is all of them but the pile. */
export const BOOKABLE: readonly Round[] = ROUNDS.filter((r) => r.id !== 'pile');

/**
 * How far a particular part can lean away from what its size usually wants.
 *
 * A lead is usually a coverage problem and occasionally a face in a window. The
 * draw is what makes two leads on the same picture different buys, and it is
 * deliberately not hidden from the player: they are the producer, and a producer
 * knows what their own picture needs. What is hidden here is what the performer is,
 * which is a different question and the one the room exists to answer.
 *
 * SLATE's own.
 */
export const A_PART_LEANS = 0.45;

/**
 * What somebody gives the person they are in the scene with.
 *
 * Six attributes about whoever else is in the room, none of them on any of the
 * three axes and none of them in `THE_TAPE`: a believable bond out of nothing,
 * a stranger from the hallway looking like you go back years, live two-way
 * contact instead of two performances side by side, serving the scene rather
 * than your own coverage, a full performance given off camera for somebody
 * else's eyeline, and the audience's eye handed to whoever the scene needs it
 * on.
 *
 * It is read only as a multiplier on what two people have between them, never
 * on its own. Generosity with nothing to be generous toward is a quality nobody
 * can see.
 */
export const THE_GIVING: readonly string[] = [
  'chemistry', 'chemistry_read', 'communion', 'ensemble_blending',
  'feeding_off_camera_lines', 'giving_and_taking_focus',
];

/**
 * What two people have between them, out of a hundred, and where it comes from.
 *
 * The research is blunt: "Chemistry cannot be computed from two solo scores. If
 * the pairing matrix is separable, there is no chemistry read — there is only
 * addition with a new name on it." So the term that carries it is the one that
 * cannot be split: how different the two of them are in *shape*, multiplied by
 * how much each of them gives.
 *
 * Shape and not level, because level would make the best performer alive the
 * worst possible partner for everybody — maximum difference from the whole
 * world. Two people can be a long way apart in how good they are and be exactly
 * the same note twice, and two people can be identical in standing and fill
 * each other's gaps completely. What pairs is the second thing.
 *
 * `middling` is what an ordinary pairing is worth. `complement` is how far the
 * shape term can carry it, and `apartAt` is the difference in shape at which it
 * is fully paid — without that second number the term ran off the top of the
 * scale and every interesting pairing clamped at a hundred, which is a matrix
 * with one value in it. `rapport` is the part nobody can account for: two
 * people either got on in the room or they did not, and the research calls it
 * an off-screen rapport roll because that is what it is.
 *
 * SLATE's own, all four.
 */
export const PAIRING = { middling: 50, complement: 42, rapport: 16, apartAt: 55 } as const;

/**
 * What a tape shows, as against what the person is.
 *
 * Four attributes that have sat in the sheet unread since it was written, and
 * they are the right four: frame, sound and performance out of a living room;
 * trimming and joining takes into one clean file; knowing what to change
 * between takes with nobody there to tell you; and getting the whole of it done
 * between a late brief and a morning deadline.
 *
 * None of them is acting. That is the entire point of reading them here: the
 * post-2020 complaint about self-tapes is not that they are a worse look at the
 * same thing, it is that they select for people with a good room at home. A
 * performer who is superb at this looks better on tape than they are, and one
 * who is hopeless at it looks worse, and the file gives you no way to tell
 * which you are holding.
 */
export const THE_TAPE: readonly string[] = [
  'self_tape_craft', 'self_tape_editing', 'directing_your_own_tape', 'overnight_turnaround',
];

/**
 * How far a tape can flatter somebody, or bury them, out of a hundred.
 *
 * SLATE's own. Set against the tape's own width of fourteen on truth, so that
 * being very good or very bad at taping matters more than the ordinary
 * uncertainty of watching one — which is the complaint, stated as a number.
 */
export const TAPE_LEANS = 17;

/**
 * What one note buys.
 *
 * A session is one note and a note is one axis — that is not a simplification,
 * it is what a redirect is. Naming the axis moves it a whole round further than
 * the session would otherwise have taken it, and leaves the other two where
 * they were. So a probe is not extra information, it is the same information
 * pointed somewhere, and pointing it at the wrong thing costs the round.
 *
 * SLATE's own.
 */
export const A_NOTE_IS_WORTH = 1;

/**
 * Days of diary the casting office has in a week.
 *
 * Five, because it is an office. The research's own figure for what one of
 * those days holds is fifteen to forty people seen, which is why a preread is
 * half a day of the diary rather than a whole one and a callback is three
 * times that: the director is in the room for a callback and the director does
 * not have forty of anything.
 */
export const OFFICE_DAYS = 5;

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
  /**
   * What a part this size usually needs, before this particular one is written.
   *
   * Three numbers that come to three, so a part with no leaning at all is one,
   * one and one. They exist because without them the best buy for any part on
   * any picture is the same weighted sum forever, and a casting system where
   * every decision is the same decision is a casting system with one decision
   * in it. The research says so in as many words: the reason casting exists is
   * that different rooms weight the same performer differently.
   *
   * The leanings are physical rather than tasteful. A day player is a face in
   * one scene, so how they read is nearly the whole of it and nobody is going
   * to ask them for take nine. A lead is in half the picture and every setup of
   * it, so what they cost the floor when they cannot repeat is enormous and how
   * they photograph is the least of three worries. SLATE's own.
   */
  leans: Readonly<Record<AxisId, number>>;
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
    leans: { truth: 1.15, repeatable: 1.1, reads: 0.75 },
  },
  {
    id: 'support',
    label: 'Supporting',
    what: 'The parts around the lead that recur across the picture. Fewer scenes, the same months.',
    perHour: 2.4,
    across: 'title',
    onScreen: 0.2,
    weight: 0.3,
    leans: { truth: 1.1, repeatable: 1, reads: 0.9 },
  },
  {
    id: 'guest',
    label: 'Guest',
    what: 'One part, one block, one story. On a season that’s an episode; on a feature it’s a sequence.',
    perHour: 3,
    across: 'part',
    onScreen: 0.12,
    weight: 0.12,
    leans: { truth: 1.05, repeatable: 0.85, reads: 1.1 },
  },
  {
    id: 'day',
    label: 'Day Player',
    what: 'A scene, a handful of lines, a day. Cast late, paid little, and capable of sinking a scene the picture needs.',
    perHour: 6,
    across: 'part',
    onScreen: 0.03,
    weight: 0.03,
    leans: { truth: 0.8, repeatable: 0.7, reads: 1.5 },
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
 * The three ends of a negotiation.
 *
 * `under` is how far below their quote somebody will go before it is an insult,
 * and it is the interesting one: the reason a performer will not take less is not
 * pride, it is that the number is read by everybody who hires them next.
 * `over` is the point past which more money buys nothing, so a producer who
 * doubles an already-generous offer is handing money over for a yes they had.
 * `most` is the likeliest anybody ever is to say yes, because nobody is a
 * certainty and a deal that always closes is not a deal.
 *
 * All three SLATE's own. `most` used to be an unnamed 0.96 sitting inside the
 * formula, which is a ceiling with nobody's name on it doing one of the two
 * most important jobs in the file.
 */
export const HAGGLE = { over: 1.6, under: 0.8, most: 0.96 } as const;

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
 * one, which is about the distance between a technical performer and a
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
