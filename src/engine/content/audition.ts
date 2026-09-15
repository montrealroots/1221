/**
 * SLATE — going up for it.
 *
 * The other half of casting, and the half the whole game is named after. The
 * producer's side asks what a stranger is; this side asks what a room wants,
 * which is a different question with a different answer and no overlap.
 *
 * ## The player cannot be outacted, so the room cannot be about acting
 *
 * This is the constraint the entire file is shaped around. The player holds
 * every one of the eight hundred and thirteen attributes at the ceiling, and
 * forty-five of them are named for this room specifically — `audition_technique`,
 * `cold_reading`, `taking_a_redirect`, `nerve_management`, `self_tape_craft`,
 * `walking_into_the_room`. A faithful port of the research would be forty-five
 * lookups all returning a hundred, which `docs/DEPTH.md` names as a trap in
 * those words.
 *
 * So nothing here reads the sheet. Every verb resolves against what the room
 * wants, never against what the player can do, and what the player can do is
 * assumed perfect throughout: whatever they choose to play, they play it
 * exactly. The game is entirely in the choosing.
 *
 * ## What is left when competence is removed
 *
 * Four things, and every one of them is a decision a person at the top of the
 * profession still gets wrong every week of their life:
 *
 * - **What to play**, before anybody has told you anything. A perfect reading
 *   of the wrong idea is a perfect reading of the wrong idea.
 * - **Whether to go in or send a file.** A tape costs a day and the room costs
 *   three, and the difference is not quality — the player's tape is flawless —
 *   it is that nobody gives a note to a file. Taping is information forgone.
 * - **How far to take the note.** Half-taking reads as not listening and
 *   over-taking spends the very thing that made them ask you again.
 * A fourth — when to stop talking, and whether to ask to go again — is the
 * turn loop, and it is not here. One note and one answer is what this cut
 * holds, because a patience clock with one turn to spend is a clock with
 * nothing to count.
 *
 * ## What is real here and what is ours
 *
 * The rounds, the redirect and its magnitudes, the pass reasons and the fact
 * that a pass is remembered are real, from `docs/research/PIPELINE.md` section
 * 7. The three axes a reading is chosen in are SLATE's own, fitted from the
 * research's twenty-two adjustments down to the three that are genuinely
 * separate questions rather than the same question twice.
 */

import type { Money } from '../core/money';

// ---------------------------------------------------------------------------
// What a reading is
// ---------------------------------------------------------------------------

export type ShadeId = 'warmth' | 'size' | 'pace';

export interface Shade {
  id: ShadeId;
  /** Title Case, for a screen. */
  label: string;
  /** What moving along it actually changes about the scene. */
  what: string;
  /** What the low end of it is called, in the words a room would use. */
  low: string;
  /** And the high end. */
  high: string;
}

/**
 * The three questions a reading answers.
 *
 * The research lists twenty-two adjustments a room can give. Most of them are
 * the same question asked twice — "smaller" and "do it flat" and "take out the
 * pause" are three ways of asking for less, and "more dangerous" and "less
 * likeable" are one axis with two names. These three are what survives when
 * the duplicates are collapsed: how much they want you liked, how much of it
 * they want, and how fast it goes.
 *
 * Three and not eight, because every axis has to be a question the player can
 * actually be told the answer to in one note, and a note is one sentence.
 */
export const SHADES: readonly Shade[] = [
  {
    id: 'warmth',
    label: 'Warmth',
    what: 'Whether the audience is meant to be on their side, or wary of them.',
    low: 'dangerous',
    high: 'likeable',
  },
  {
    id: 'size',
    label: 'Size',
    what: 'How much of it there is. The difference between a thought crossing a face and a scene being played.',
    low: 'held in',
    high: 'played out',
  },
  {
    id: 'pace',
    label: 'Pace',
    what: 'How fast it goes, and whether the pauses are left in.',
    low: 'slow',
    high: 'quick',
  },
];

export const shadeById = (id: string): Shade | undefined => SHADES.find((s) => s.id === id);

/** How far either way a reading can be taken. */
export const FURTHEST = 3;

/** A reading, as three choices. */
export type Reading = Record<ShadeId, number>;

/** The reading nobody could object to and nobody remembers. */
export const AS_WRITTEN: Reading = { warmth: 0, size: 0, pace: 0 };

// ---------------------------------------------------------------------------
// How you go up for it
// ---------------------------------------------------------------------------

export type WayId = 'tape' | 'room';

export interface Way {
  id: WayId;
  /** Title Case, for a screen. */
  label: string;
  what: string;
  /** Days of the player's own calendar it takes. */
  days: number;
  /** What it costs them out of pocket, in cents. */
  costsCents: Money;
  /**
   * Whether anybody in the room says anything back.
   *
   * The whole difference between the two, and it is not quality. The player's
   * tape is flawless — they hold every attribute the file could possibly read
   * at the ceiling. What a tape does not do is come back with a note, so
   * everything the player learns about what this part wants, they learn by
   * being in a room. Taping is not a worse performance. It is a performance
   * nobody tells you anything about.
   */
  notes: boolean;
}

export const WAYS: readonly Way[] = [
  {
    id: 'tape',
    label: 'Send A Tape',
    what: 'Sides arrive, you shoot it at home and send the one you want them to see. Nobody says anything back, and you find out weeks later or never.',
    days: 1,
    costsCents: 0,
    notes: false,
  },
  {
    id: 'room',
    label: 'Go In',
    what: 'Eight minutes in a room with a reader and whoever is casting. They give you one note. It is the only thing anybody will ever tell you about what this part is for.',
    days: 3,
    costsCents: 120_00,
    notes: true,
  },
];

export const wayById = (id: string): Way | undefined => WAYS.find((w) => w.id === id);

// ---------------------------------------------------------------------------
// The redirect
// ---------------------------------------------------------------------------

export type HowFarId = 'none' | 'half' | 'full' | 'over';

export interface HowFar {
  id: HowFarId;
  /** Title Case, for a screen. */
  label: string;
  /** What the room reads it as. */
  what: string;
  /** The share of the note the player actually applies. */
  share: number;
}

/**
 * What the player does with the one note they get.
 *
 * The research is precise about this and it is the sharpest decision in the
 * domain: half-taking reads as not listening, and over-taking loses the thing
 * they liked enough to give you a second go. Both halves of that sentence are
 * built. The note is given on the shade the reading was *closest* on — the room
 * tells you about the part of it that nearly worked — so overcooking that shade
 * spends the only thing that was going right.
 */
export const HOW_FAR: readonly HowFar[] = [
  { id: 'none', label: 'Leave It', what: 'You heard it and you do it again as it was. Sometimes that is the answer. Usually it is deafness.', share: 0 },
  { id: 'half', label: 'Halfway', what: 'You move, and not as far as they asked. Safe, and it can read as not having listened.', share: 0.5 },
  { id: 'full', label: 'All The Way', what: 'Exactly what they asked for, exactly as far as they asked for it.', share: 1 },
  { id: 'over', label: 'Past It', what: 'Further than they asked. It can be the thing that wins the room, and it can throw away whatever made them ask.', share: 1.7 },
];

export const howFarById = (id: string): HowFar | undefined => HOW_FAR.find((h) => h.id === id);

/**
 * How far off a reading can be before nobody is interested.
 *
 * Distance is the mean of the three shades, so it runs from nought to twice
 * `FURTHEST` and a miss on one shade is worth a third of a miss on all of them.
 * This is where the door shuts.
 *
 * SLATE's own, and fitted rather than picked: a reading played dead center
 * against a want drawn flat across the range is about 1.7 out, so playing it
 * safe lands between the two thresholds below. Safe is not wrong and it is not
 * enough, which is the sentence the whole file is trying to be.
 */
export const TOO_FAR = 3.4;

/**
 * What a reading has to be within to be the one they take.
 *
 * Deliberately tight. Most readings end in no, which is the research's own
 * first sentence about the pass, and a room that said yes to anything close
 * would be a room nobody had to think about. One note taken the whole way pulls
 * an average guess inside it, which is what makes going in worth three days.
 */
export const CLOSE_ENOUGH = 1.2;

// ---------------------------------------------------------------------------
// Why it ended
// ---------------------------------------------------------------------------

export type WhyId = 'wrong-for-it' | 'not-in-the-room' | 'went-another-way' | 'dates' | 'cast';

export interface Why {
  id: WhyId;
  /** Title Case, for a screen. */
  label: string;
  /** What the actual sentence is, on the rare occasion anybody says one. */
  said: string;
}

/**
 * The reasons a reading ends.
 *
 * The research lists twenty a real office records. These five are the ones this
 * build can tell apart, and each is produced by a different branch rather than
 * drawn off a list. The player usually learns nothing, which is also the
 * research: the office logs it and the performer is told a sentence if the
 * relationship is good.
 */
export const WHYS: readonly Why[] = [
  { id: 'cast', label: 'It Is Yours', said: 'They want you. Dates as discussed.' },
  { id: 'wrong-for-it', label: 'Wrong For It', said: 'They loved it. It isn’t what the part is.' },
  { id: 'not-in-the-room', label: 'A Tape Is A Tape', said: 'It went in the pile with the others and nobody wrote back.' },
  { id: 'went-another-way', label: 'They Went Another Way', said: 'It came down to two and it wasn’t you. No, there isn’t a reason.' },
  { id: 'dates', label: 'The Dates', said: 'You’re working. They couldn’t hold it.' },
];

export const whyById = (id: string): Why | undefined => WHYS.find((w) => w.id === id);

/**
 * How much being seen once raises the chance of being asked again.
 *
 * The research calls roster memory the main career ratchet, and it is explicit
 * that it pays out from a *pass*: a no in March is a booking in September, from
 * the same office, with no new audition. So this accrues on being read rather
 * than on being cast, and the number is what one reading is worth to the next
 * call from the same people. SLATE's own.
 */
export const REMEMBERED = 0.16;

/**
 * How many of them think of you before anybody has seen anything.
 *
 * Not the number a stranger in another country would get, and it should not be.
 * The production is standing on a stage the player's family owns, on land the
 * player lives on, and the family runs the lot — so about a third of them ask,
 * and the other two thirds never think of it. That is nepotism stated as
 * arithmetic, and it is the one advantage this player is actually born with.
 *
 * Everything above it is earned by being read, and being read for somebody
 * twice is worth more than the whole of the advantage. SLATE's own.
 */
export const COLD = 0.35;

/**
 * What being known to the public on its own is worth, before anybody in the
 * room has ever met you.
 *
 * The other half of the ratchet, and the half that travels. Being read twice by
 * RÚV is worth a great deal to RÚV and nothing at all to a Nordic broadcaster
 * who has never heard the name. Fame is the part that crosses: a production
 * setting up on a stage does not need to have had somebody in to have an
 * opinion about whether they want them, if enough people already know who they
 * are.
 *
 * Set so that being a household name is worth more than any amount of history
 * with one office, because it is — and so that it never quite reaches everybody,
 * because somebody always has their own idea. SLATE's own.
 */
export const KNOWN_OF = 0.5;

/**
 * What carrying a whole picture does to how much an audience likes you.
 *
 * Scaled by how much of the thing the part was, so a day player is barely
 * noticed and a lead is remembered. It only goes up, for this player, and that
 * is not generosity — they hold every attribute at the ceiling, so there is no
 * such thing as being bad in something. What they can still do is not be in
 * anything, which is what the rest of this file is about. SLATE's own.
 */
export const WELL_LIKED = 18;
