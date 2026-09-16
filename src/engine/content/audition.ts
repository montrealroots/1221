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

export type HowFarId = 'touch' | 'good' | 'far';

export interface HowFar {
  id: HowFarId;
  /** Title Case, for a screen. */
  label: string;
  /** What the room reads it as. */
  what: string;
  /** How far the player moves, in shade steps. Absolute, not a share. */
  steps: number;
}

/**
 * What the player does with the one note they get.
 *
 * This was four buttons with one right answer, and the arithmetic said so
 * rather than the balance. The magnitudes used to be a SHARE of the distance
 * the note was asking for — and that distance is the hidden truth, so `share: 1`
 * landed exactly on the want by construction. It was an identity, not a
 * decision. Enumerated over every reachable state: 117,306 of them give a note,
 * and All The Way was among the best in **117,306 of them**. Leave It was never
 * once uniquely best.
 *
 * So the player supplies the distance now, in steps on the same seven-point
 * scale their own reading sits on, and nothing multiplies it by the answer.
 * How far to go is a real guess about a number nobody has told them.
 *
 * What stops that becoming "always press the biggest" is the second half, in
 * `world/audition.ts`: how surely you read a room is a thing fatigue takes. On
 * a bad day the note you act on can be the opposite of the note you were given,
 * and then the size of the swing is the size of the mistake. Committing hard
 * is right on a sharp day and a gamble on a bad one, which is the trade this
 * decision never had.
 *
 * Measured, so the claim is falsifiable: under the old rule one button was
 * among the best in 100.0% of states. Under this one the favorite is among
 * the best in about 80% of the states a player can distinguish — their own
 * opening and the note they were given — three different steps are uniquely
 * best across those situations, and which one is best moves with readiness.
 *
 * ## Three buttons, because the fourth could never be pressed
 *
 * There was a fourth, Leave It, worth nought steps, and it is gone. Enumerated
 * over 2,401 cells — every one of the 343 openings at seven readiness levels
 * spanning the entire range `heardItRight` can return — it was the best answer
 * in nought of them, and A Touch beat it everywhere by at least 0.0187. It was
 * also bit-identical to never going up at all: the same reading, the same
 * distance, in every one of the want-and-roll cells checked. So it was a button
 * that spent three days, a hundred and twenty euros and an afternoon the clock
 * stops for, to hand back the free tape's number.
 *
 * Nothing is lost by its going, because the thing it expressed is still
 * expressible: a player who does not want to change what they played can
 * decline to answer, and `shutWhatHasClosed` settles that on the first day of
 * the shoot, on the reading as played. The button duplicated an act the game
 * already models by inaction, and duplicated it at a price.
 *
 * That leaves three, and no state of the world in which one of them is
 * dominated. `docs/UNBITTEN.md` keeps the figures so nobody has to take this
 * comment's word for any of it.
 */
export const HOW_FAR: readonly HowFar[] = [
  { id: 'touch', label: 'A Touch', what: 'The smallest move that counts as having moved. Safe, and it can read as not having listened.', steps: 1 },
  { id: 'good', label: 'A Good Deal', what: 'A real change, and not the whole of what you have. About half of all notes want exactly this, and two in five want more.', steps: 2 },
  { id: 'far', label: 'As Far As It Goes', what: 'Everything you have in that direction. It can be the thing that wins the room, and if you have misread the room it’s the thing that loses it.', steps: 3 },
];

export const howFarById = (id: string): HowFar | undefined => HOW_FAR.find((h) => h.id === id);

/**
 * How far off a reading can be before nobody is interested.
 *
 * Distance is the mean of the three shades, so it runs from nought to twice
 * `FURTHEST` and a miss on one shade is worth a third of a miss on all of them.
 * This is where the door shuts.
 *
 * SLATE's own, and fitted rather than picked: a reading played dead center is
 * 1.5 out, so playing it safe lands between the two thresholds below. Safe is
 * not wrong and it is not enough, which is the sentence the whole file is
 * trying to be.
 *
 * The want it is 1.5 out of is not drawn flat, and this comment said it was for
 * as long as it existed — along with a figure of 1.7, which is what a flat draw
 * would have given. `whatTheyWant` rounds a number off the range, so the two
 * ends come up half as often as everything between them: nought, one and two
 * a sixth of the time each either way, and three a twelfth. That started as an
 * artifact of the rounding and it is kept on purpose, because it is the better
 * shape — most parts want something near the middle, and a part that wants the
 * most warmth anybody has is a rarer thing than a part that wants a little.
 *
 * The shape is pinned in a test rather than written out here a second time. A
 * distribution described in prose is a distribution nothing checks, and this
 * one went two numbers wrong in a single sentence without anything noticing.
 */
export const TOO_FAR = 3.4;

/**
 * What a reading has to be within to be the one they take.
 *
 * This said "most readings end in no" and it is the opposite of what the file
 * does. Measured exactly, over all 343 wants at their true weights: a blind
 * dead-center reading answered *a good deal* is cast 70.6% of the time at the
 * readiness a played save sits at, and 77.6% rested. Most readings end in yes.
 *
 * Three claims stood here together and only two of them can: that most
 * readings end in no, that one note pulls an average guess inside this
 * threshold, and that inside it is `AS_GOOD_AS_IT_GETS`. The second is true —
 * one note taken *a good deal* brings the expected distance from 1.500 to
 * 0.920, well inside — and the third is 0.82 by declaration. So the first was
 * the one that had to go, and what it was really describing is a room nobody
 * built: a threshold this tight only bites if landing inside it is not nearly
 * a yes.
 *
 * The figure is not defended here as right, only as measured. It is pinned in
 * `tests/audition.test.ts` to six decimals, which is what this comment did not
 * have: the rate could move forty-eight points and 1,204 tests would pass.
 * Whether 70.6% is the rate the game wants is a question for whoever is
 * holding it, and the test makes changing it a decision rather than a drift.
 */
export const CLOSE_ENOUGH = 1.2;

// ---------------------------------------------------------------------------
// Why it ended
// ---------------------------------------------------------------------------

export type WhyId = 'wrong-for-it' | 'not-in-the-room' | 'went-another-way' | 'dates' | 'cast'
  | 'never-answered';

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
  { id: 'never-answered', label: 'You Never Went Up For It', said: 'They asked, the date to be seen by went past, and they cast it without you.' },
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

// ---------------------------------------------------------------------------
// What a week of it takes
// ---------------------------------------------------------------------------

/**
 * What working takes out of the person doing it.
 *
 * The premise forbids the obvious version of this. The player is the best there
 * has ever been and cannot be bad at the work, so nothing here may decide how
 * well a performance goes — that would be a craft check wearing a tiredness
 * name, and it would be false. What a week on a picture decides is everything
 * around the work: whether somebody was easy to have there, whether they could
 * take the other thing, whether the people who booked them would book them
 * again.
 *
 * It is also not a meter that stops you. Nothing in this build refuses the
 * player a part for being tired. What it does is make them expensive to the
 * people they work for, and being expensive to work with is the one thing that
 * can take work away from somebody who is perfect at it.
 *
 * ## Why these numbers exist at all
 *
 * The wellbeing model was a fixed point. Measured on a booted save, seven of its
 * nine dials were constants by day thirty and eight by day three hundred and
 * sixty-five, and `readiness` — the figure the whole thing rolls up to — sat at
 * 49 from the first month to the fifth year without moving once. The cause was
 * not the arithmetic. It was that the autopilot restores to a fixed ceiling and
 * a fixed floor every single day, and no day had ever been different from any
 * other day.
 *
 * A week on a picture is the first thing in this game that makes a day
 * different. That is what these are for.
 */
export const A_WORKING_WEEK = {
  /**
   * The night a shoot leaves you, in hours.
   *
   * Not a second clamp bolted onto the model — the model already knows what a
   * short night does. `applySleep` clears less debt from a shorter night and
   * adds debt below six hours, so a run of these declines on its own and keeps
   * declining the longer it runs. The first draft set a fixed working ceiling
   * instead and simply moved the fixed point: every week cost the same, from the
   * first one, and a fourteen-week job took a career from sixty-six to nothing.
   *
   * A call at six with an hour in the chair before it is what this number is,
   * and it arrives gradually: week one of anything is an ordinary night, and the
   * last week of a long one is not. Scaled by how far into the engagement the
   * day is, so a short job never gets deep enough to cost anything and a
   * marathon does. That is the decision the whole thing exists to create.
   */
  shorterBy: 2.5,
  /**
   * How much of a night's recovery a full debt holds back.
   *
   * The reason resting between jobs was worth nothing. Energy had no memory: a
   * night put back about ninety points whatever came before it, so one week off
   * and twelve weeks off left a career in exactly the same place, and the only
   * lever a tired player had moved nothing at all.
   *
   * Debt already made somebody burn faster — `applyElapsedWellbeing` scales the
   * drain by it — and that term was measured dead, because an ordinary debt of
   * six makes the multiplier 1.125 and nothing notices. This is the other half
   * of the same idea and it is what gives the model a memory: you cannot fill
   * the tank while you are carrying one, so recovery is gradual and the size of
   * the gap is a decision.
   */
  debtHolds: 0.62,
  /**
   * The readiness below which turning up anyway is the thing people remember.
   *
   * Set under where a rested person starts a job and over where a long run
   * takes them, so the early weeks of anything are fine and only a run that
   * goes on costs. Short work keeps somebody reliable; one marathon does not.
   */
  spentAt: 38,
  /** What a week worked from under there takes off how reliable people found you. */
  costsAWeek: 3,
  /** And what a week worked in good order gives back, because it goes both ways. */
  earnsAWeek: 1,
} as const;

/**
 * How far somebody's record of turning up moves what a stranger's office does.
 *
 * The other half of `REMEMBERED`. Having been seen is what gets an office to
 * think of you; having been easy to have there is what stops them hesitating.
 * A performer nobody can rely on is asked about less, and that is the only
 * thing in this build that can take work away from a player who is perfect at
 * the work itself.
 */
export const RELIED_ON = 0.3;

/**
 * What an office takes for granted about anybody.
 *
 * Above this, being reliable earns nothing: nobody gets extra calls for having
 * been punctual, because turning up is the job rather than a distinction. Below
 * it, it is remembered and it costs. The first draft measured against the middle
 * of the scale and so handed a fresh player a bonus for a seeded number, which
 * broke the thing the room is built on — that a career starts cold because
 * nobody has heard of anybody.
 */
export const EXPECTED_OF_ANYBODY = 60;

// ---------------------------------------------------------------------------
// What an office thinks you are
// ---------------------------------------------------------------------------

/**
 * How an office's picture of somebody becomes what they are offered.
 *
 * The premise puts the player at the ceiling of every scale and the industry is
 * said to know it. That second half was never built: an office that had never
 * laid eyes on the player offered them exactly what an office that had used them
 * five times offered, because the only thing deciding the size of a part was how
 * long the shoot was. At nine weeks or more `sizeCasting` returned the first row
 * of `SIZES` for every roll there is, and the lot mostly books long — so the
 * first job of every career was a lead, which is the wrong career.
 *
 * What a room can know about somebody is what it has seen of them. So the
 * picture starts at nothing and climbs with every reading these particular
 * people have sat through, including the ones that ended in no — being seen is
 * the thing that teaches an office, whatever they decided afterwards.
 *
 * This is the answer to the prodigy constraint that the owner chose, stated as
 * arithmetic: the forty-five attributes named for this room are not what the
 * player has, they are what a room learns, and the gap between the two is the
 * career.
 */
export const WHAT_THEY_OFFER = {
  /**
   * Readings one office sits through before it would hand somebody the top of a
   * call sheet.
   *
   * Small on purpose. The player is the best there has ever been, so an office
   * that watches them work out loud four times has genuinely learned what it
   * needed to; what takes a career is getting into four rooms.
   */
  seenEnough: 4,
  /**
   * How much of that a reputation can stand in for.
   *
   * Under one, because it has to be: fame that bought the whole of it would
   * make a famous player interchangeable with a known quantity, and the thing
   * the research is most insistent about is that an office trusts what it has
   * watched over what it has heard. Somebody at the top of the trade is still
   * offered a day part by strangers, and that is the honest shape of it.
   */
  fameStandsIn: 0.55,
} as const;

/**
 * The most of your read of a room that a bad day can take.
 *
 * Not your acting — the premise forbids that, and `world/audition.ts` reads no
 * attribute anywhere. What fatigue takes is the listening: eight minutes, one
 * note, said once, by somebody who has been in that chair since nine. Tired
 * enough and you act on the opposite of what they meant, which is the most
 * ordinary way a good reading goes wrong and the only one the prodigy
 * constraint leaves room for.
 *
 * It is what makes how far to go a decision. Commit everything and it is three
 * steps of right or three steps of wrong; take a touch and it is neither. A
 * player who can see their own readiness on the front page can read which kind
 * of day it is before they walk in.
 *
 * SLATE’s own. At the ceiling it is nothing at all, so a rested performer simply
 * hears the room.
 */
export const MISREAD_THE_ROOM = 0.35;

/**
 * The share of a room's weeks that a whole cast is priced at.
 *
 * The lot's rate card says what a stage costs. It does not say what a cast
 * costs, and no published ratio between the two exists, so this figure is
 * SLATE's own — which is exactly why it belongs on a line with a name on it
 * rather than loose inside an expression.
 *
 * It is the same number as the lead's `onScreen` share in content/casting.ts,
 * so a lead is paid 0.3025 of what the room cost. The two are independent and
 * the match is a coincidence: move the lead's share of the screen and this
 * figure stays where it is.
 */
export const OF_THE_ROOM = 0.55;

/**
 * What it costs with these people to have been asked and not answered.
 *
 * The ratchet running backwards, and it is the whole reason an unanswered ask
 * closes rather than simply vanishing. `REMEMBERED` says a reading is worth
 * something to the next call even when it ends in no — the research is explicit
 * that a pass is an asset. The other half of that sentence was never built: an
 * office that asks twice and hears nothing twice is an office that stops
 * asking, and until now a player could ignore every part they were ever
 * offered at no cost, forever, because nothing ever read the date the room
 * shuts on.
 *
 * Larger than `REMEMBERED` on purpose. Turning up is ordinary and is worth a
 * little; not turning up is a thing people remember, and two of them undo more
 * than two readings built. SLATE's own.
 */
export const IGNORED = 0.22;

/**
 * How long an office holds it against you, in years.
 *
 * Because the first version of this did not, and a one-way door is a countdown
 * rather than a consequence. Two unanswered asks took a holder to nothing and
 * nothing is where they stayed for the rest of the save: no way back, no
 * decision to make, and the same fault this build already names on the family's
 * patience, where a shut year brings the rungs down and a good year puts them
 * back.
 *
 * Three years, which is the window the lot already uses to decide whether its
 * own record is any good, so the two halves of this world forget at the same
 * rate. A reading is not windowed and does not fade — the research is explicit
 * that a pass is a durable asset, and people remember having met somebody far
 * longer than they remember being stood up by them.
 */
export const HELD_AGAINST_YOU_YEARS = 3;
