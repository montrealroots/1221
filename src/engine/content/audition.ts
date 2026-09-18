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
 * - **What to play**, before anybody has told you anything about this part. A
 *   perfect reading of the wrong idea is a perfect reading of the wrong idea.
 *   What there is to go on is the record: `HOUSE_HOLDS` of each shade is the
 *   same across everything one holder casts, so an average of what you played
 *   in their rooms is a real handle on the next one.
 * - **Whether to go in or send a file.** A tape costs a day and the room costs
 *   three, and the difference is not quality — the player's tape is flawless —
 *   it is that nobody gives a note to a file. Taping is information forgone,
 *   and that sentence was decoration until the house existed: a note about a
 *   want drawn from nothing was worth one reading and nothing afterwards.
 *   Now a room is the only thing that adds to what you know about a holder, and
 *   a career of tapes learns nothing about anybody, ever.
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
import { CAST_SHARE } from './casting';

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

/**
 * The share of each shade a holder keeps across everything they cast.
 *
 * The first decision in this room used to have one right answer known before
 * the game started. Every want was drawn from nothing, independently, every
 * time — so the best opening against an unknown room was the opening that is
 * closest to every possible want at once, which is dead center, which is where
 * the sliders already sit. Enumerated over all 343 openings: dead center is
 * rank 1 of 343 in seven of the nine readiness-and-answer cells a player can
 * be in, and the joint optimum across all nine. A decision whose answer is the
 * default is a decision nobody takes.
 *
 * So a holder has a taste. Seven times in ten, on each shade separately, what
 * one of their rooms wants is what all of their rooms want; the other three
 * times that room goes its own way. Per shade rather than per room, so a
 * holder is recognizable without being a lookup — read for them nine times and
 * you know roughly what they like, and the tenth room can still surprise you
 * on one axis.
 *
 * The number is not arbitrary in its consequences and both ends are wrong. At
 * nought this file is exactly the shipped game, bit for bit, and the opening is
 * a constant again. At one a holder is a fixed answer, three readings solve
 * them forever, and the room stops being a room.
 *
 * Seven tenths is where a career solves most of a holder and never all of one.
 * Measured on twelve fifteen-year played careers, the distance between a
 * player's own average and the holder's taste runs 1.500 with nothing behind
 * them, 1.339 after one room, 1.222 after three, 1.077 from four to eight and
 * 0.742 from nine on. It goes on creeping down and never arrives: 0.696 between
 * twenty rooms and forty, and 0.633 past forty. What the player is averaging is
 * what they ended up playing rather than what was wanted, and three rooms in ten
 * went their own way, so the record can never quite close on the taste that made
 * it. The floor is the thing being bought: a holder worth learning, who cannot
 * be finished.
 *
 * SLATE's own. What it buys is measured in `tests/audition.test.ts` and on
 * played careers rather than asserted here.
 */
export const HOUSE_HOLDS = 0.7;

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
   *
   * That cost used to last one reading. `whatTheyKeepAskingFor` filters on
   * `way === 'room'`, so it now lasts the save: a taped reading adds nothing to
   * what the player knows about that holder, forever, however many of them they
   * send. Measured on twelve fifteen-year careers, the two taped policies come
   * out bit-identical — a player taping off their own history plays exactly what
   * a player taping dead center plays, 709 parts out of the same 1,130
   * readings, because there is no history to read. Three days and a hundred and
   * twenty euros buy a note today and a share of every room these people ever
   * hold.
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
    what: 'Eight minutes in a room with a reader and whoever is casting. They give you one note. It’s the only thing anybody will ever tell you about what this part is for.',
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
/**
 * How far to take the note, and what each one is actually worth.
 *
 * The copy on `good` and `far` used to claim about half of all notes want a
 * good deal and two in five want more. Measured over three seeds of
 * twenty-five played years, 1,707 shade-wants: **nought 19.9%, one 33.0%, two
 * 23.5%, three 23.6%**. So a good deal is exactly right a quarter of the time
 * rather than half, and taking it further is right just as often — not two in
 * five.
 *
 * Which explains the thing the measurement found and the old copy hid. Playing
 * each magnitude fixed for a career, six seeds: `touch` wins three, `good` wins
 * three, `far` wins none. It is not that `far` is rarely right; it is right as
 * often as `good` is. It is that the commonest note wants **one** step, and
 * `far` misses that by two — mean error 1.49 steps against 0.91 for `touch` and
 * 0.96 for `good`.
 *
 * The button is not the defect, and it has not been changed. A high-variance
 * play that is usually wrong is a real thing to offer somebody. Telling them it
 * is right two times in five when it is right one in four is not, and that was
 * the whole of what was wrong here.
 */
export const HOW_FAR: readonly HowFar[] = [
  { id: 'touch', label: 'A Touch', what: 'The smallest move that counts as having moved. Safe, and it can read as not having listened.', steps: 1 },
  { id: 'good', label: 'A Good Deal', what: 'A real change, and not the whole of what you have. Close to a quarter of notes want exactly this, and about as many want more.', steps: 2 },
  { id: 'far', label: 'As Far As It Goes', what: 'Everything you have in that direction. It’s exactly right about as often as a good deal is, and wrong by more when it’s wrong: the commonest note wants one step, and this overshoots that by two.', steps: 3 },
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
 * What the work being thought well of does to whether an office thinks of you.
 *
 * The first of the two readers `prestige` came back with, and `docs/AWARDS.md`
 * named this as the cheapest of the three candidates: `remembersYou` already
 * closes a gap toward certainty using fame, rooms read and reliability, and this
 * is a fourth term of exactly that kind.
 *
 * Smaller than `KNOWN_OF`, and the ordering is the claim. Being famous is worth
 * more to a casting office than being respected, because an office fills parts
 * and fame sells tickets — that is the business being unsentimental about itself.
 * But it is larger than `REMEMBERED`, because one award reaches offices that have
 * never met you and a reading only ever reaches the room it happened in.
 */
export const THOUGHT_WELL_OF = 0.28;

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
   * goes on costs.
   *
   * ## It was measurably unreachable, and the fix was somewhere else
   *
   * This line was on `docs/UNBITTEN.md` as a threshold no played career could
   * sit above late on: mean readiness by third ran 47.7 / 38.9 / 16.7 on
   * autopilot and 49.2 / 47.8 / 35.3 for somebody managing sleep deliberately,
   * so both ended under thirty-eight and the number divided nothing. The
   * obvious fix was to move it, and that would have been wrong.
   *
   * The cause was the house. `property.condition` fell every day with nothing
   * in the build that raised it, `sleepQuality` read it, and every career ended
   * worn out whatever the player did — so the threshold was not badly chosen,
   * it was the only honest reading of a world with one outcome. Now that
   * `life.upkeep` exists, there are two. Measured over three seeds of
   * twenty-five played years, mean readiness by third:
   *
   * | | thirds | weeks under this line, of 1300 | reliability at the end |
   * |---|---|---|---|
   * | let the house rot | 45.7 / 41.8 / 18.0 | 498-549 | 0 |
   * | keep it up | 47.8 / 47.9 / 46.8 | 58-74 | 91-97 |
   *
   * Thirty-eight now sits between the two, which is what a threshold is for.
   * It is deliberately unchanged: a number that divided nothing because the
   * world had one outcome does not want moving once the world has two.
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

/**
 * A whole cast's screen share, summed.
 *
 * `SIZES` says what share of a picture each size of part is, and a cast is more
 * than one part — so the cast pot is divided by what a whole cast comes to and
 * not by one row of it. A lead at 0.55, a couple of supports, a handful of
 * guests and the day players behind them come to about this.
 *
 * Fitted rather than assumed, and fitted to one thing only: that this change
 * connects the fee to the money without also moving what a career earns. Across
 * two seeds of twenty-five played years and 361 parts, the fees the rate card
 * used to pay come to EUR 3.16m and EUR 3.00m; at this figure the same parts
 * come to EUR 3.47m and EUR 2.75m — ten per cent over on one seed, eight under
 * on the other, which is the level holding rather than shifting.
 *
 * The first attempt divided by 1.77, taken from a mean of per-part ratios, and
 * that doubled career earnings. A mean of ratios is not the ratio of means, and
 * the only honest way to hold a total is to fit against the total.
 */
export const A_WHOLE_CAST = 3.3;

/**
 * What one point of a part's screen share is worth, as a share of the spend.
 *
 * The cast costs `CAST_SHARE` of what a production spends — the engine's own
 * figure, and what `world/casting.ts` already charges the family's company for
 * its own pictures — and a part takes its share of that pot.
 *
 * This is the number that stops the room standing in for the money. `feeFor`
 * used to price a part off the stage's weekly rate, so the same guest part on
 * the same commercial paid EUR 2,838 or EUR 1,442 depending on which room
 * happened to be free, and a picture's budget correlated with its cast's pay
 * only because floor area happened to track it.
 *
 * Deliberately calibrated to hold the level rather than to change it. The
 * coefficient is set where a played career's fees come out where they already
 * came out, so this commit connects the fee to the money without also being a
 * pay rise nobody asked for. Whether an Icelandic lead should earn more than
 * this is a real question and it is a different one.
 */
export const OF_THE_SPEND = CAST_SHARE / A_WHOLE_CAST;

/**
 * What a year of not being in anything takes off each of the four, in points.
 *
 * The other half of `WELL_LIKED`, and the half its own docstring asked for and
 * nothing built: *"It only goes up, for this player, and that is not generosity —
 * they hold every attribute at the ceiling, so there is no such thing as being bad
 * in something. What they can still do is not be in anything."* Being in nothing
 * had no cost. Four dials rose on every part taken and fell on nothing ever, which
 * `tools/dials.mjs` reported as four of its seven: publicFame, audienceAppeal,
 * professionalReputation and industryDemand, all "never falls".
 *
 * So reputation is a flow rather than a stock. It is spent every day and bought
 * back by working, which is what a reputation is.
 *
 * The four rates are different, and the ordering is the content rather than a
 * tuning. **The public forgets fastest** — fame is nothing but being in front of
 * people lately. **The industry forgets almost as fast**, because demand is the
 * answer to what somebody has done this year. **What an audience feels about you
 * is stickier than whether they remember you**, so appeal goes slowly. And **what
 * the trade thinks of your work is stickiest of all**: a good reputation survives a
 * quiet year, which is the whole reason it is worth having.
 *
 * Against the gains, which are 34, 26, 22 and 18 for carrying a whole picture: one
 * lead a year leaves a career comfortably ahead on all four, two quiet years are
 * felt, and a decade away takes the lot. That is the shape intended — the cost of
 * absence is real and it is not a trap.
 */
export const FORGETTING = {
  publicFame: 12,
  industryDemand: 10,
  audienceAppeal: 5,
  professionalReputation: 3,
} as const;

/**
 * What raises controversy, which nothing did.
 *
 * `Reputation.controversy` was the seventh dial on `tools/dials.mjs` and the
 * flattest: "one value, 0". `content/maturity.ts` says it stayed dead-but-declared
 * because two live mechanisms already read it and nothing ever raised it, which is
 * the exact shape of a guard no input can trip.
 *
 * What raises it here is the one thing this player can actually do wrong. They
 * cannot be bad in a part — every attribute sits at the ceiling — but they can
 * turn up with nothing left and make a room wait, which is already measured:
 * `whatTheWeekTook` reads `readiness` against `A_WORKING_WEEK.spentAt` every week
 * of every job and takes reliability off them when they are under it. That week
 * is the story that travels, so it raises controversy by the same event.
 *
 * And it fades, on the same principle as the rest: a bad fortnight is not a life
 * sentence, and nothing about a person should only ever get worse. Slower than it
 * arrives, because that is how being talked about works.
 */
export const TALKED_ABOUT = { aBadWeek: 4, forgottenAYear: 26 } as const;

/**
 * What a week of making a room wait takes off what the trade thinks of your work.
 *
 * The missing downward force on `professionalReputation`, and the one the content
 * already argued for: the `difficult` trait carries `professionalReputation: 0.7`
 * and its description is "the work may be great, the stories travel faster than
 * the work". Being hard to have on a set is exactly what a professional standing
 * is a measure of, and nothing connected the two.
 *
 * Without it the dial had no force on it but forgetting, which is the gentlest of
 * the four at three points a year — so a career that kept working sat at its
 * equilibrium and never moved again. The dials sweep reported 4.4 of its 71.2
 * range through the whole last third.
 *
 * Smaller than what the same week costs reliability, because these are different
 * things: how easy you were to have there is a fact about the fortnight, and what
 * the trade thinks of your work is a slower judgement that a fortnight only dents.
 */
export const A_HARD_WEEK_COSTS_STANDING = 1.2;

/**
 * Where a record of turning up settles when nobody is complaining, and how fast.
 *
 * `reliability` was the fifth dial nothing moved, and it was not a one-way
 * ratchet like the other four — it was a one-way trip. It moves only during a
 * working week, `costsAWeek` is three against `earnsAWeek` of one, and measured
 * readiness in the last third of a career runs between 16.7 and 35.3 against a
 * `spentAt` of 38. So every week worked late in a career took three off it,
 * nothing gave any back, and nothing moved it at all between jobs: it reached
 * nought and sat there, which `tools/dials.mjs` reported as 2.0 of its 100.0
 * range in the last third.
 *
 * What was missing is the obvious thing: you are not unreliable while you are
 * resting. A reputation for being hard to have on a set is a memory, and the
 * trade's memory is short — the same principle as `TALKED_ABOUT.forgottenAYear`,
 * and for the same reason, which is that nothing about a person should only ever
 * get worse.
 *
 * Seventy is where it settles, because seventy is nobody having a complaint
 * rather than anybody being impressed. The asymmetry stays: three off a bad
 * week against one back for a good one is how reputations actually move, and it
 * still means a run of hard weeks costs more than a run of easy ones earns.
 */
export const RELIABILITY_RESTS_AT = 70;
/**
 * How fast it closes the gap to that, per day.
 *
 * Proportional rather than flat, the way `driftBonds` closes on its resting
 * level, because the distance is the thing that heals: somebody at nought has
 * further to come back than somebody at sixty and comes back faster at first.
 *
 * Sized against what working costs it. A week under `spentAt` takes three off,
 * which is a hundred and fifty-six a year for somebody working constantly, so at
 * this rate a career of hard weeks settles around twenty rather than pinning at
 * nought. It moves, and where it moves to is how hard the work has been.
 */
export const RELIABILITY_HEALS_A_DAY = 0.009;

/**
 * How much of a gain the last few points of a standing are worth.
 *
 * Four dials rose by a flat amount on every part taken, and two of them then
 * pinned themselves against the ceiling: `audienceAppeal` sat between 94.7 and
 * 100 through the last third of a career and `professionalReputation` between
 * 98.5 and 100. A dial at its ceiling is as dead as a dial at its floor — it
 * had stopped being a measure of anything and become a receipt.
 *
 * So a gain is scaled by the headroom above it, which is the ordinary shape of
 * every standing that is about what other people think: going from forty to
 * forty-five in an audience's affection is a part, and going from ninety to
 * ninety-five is a career. It is not a cap and it is not a curve anybody tuned —
 * it is the difference between what is left to win and what has been won.
 *
 * What it buys is an equilibrium rather than a total. Against `FORGETTING`, a
 * career that carries one picture a year settles near sixty-five on fame and one
 * that carries two settles near eighty, so the number on the screen answers how
 * much this person works. A hundred is for somebody who never stops.
 */
export const HEADROOM = (standing: number): number => Math.max(0.04, 1 - standing / 100);

/**
 * The collective floor under any week of acting work in Iceland.
 *
 * `content/incorporation.ts` has declared this for as long as the guilds have
 * existed and nothing has ever read it. The Icelandic actors' row says it in as
 * many words — Icelandic employment does not work by signing up one production at
 * a time, a company employing people here is covered by the kjarasamningar because
 * it employs people here, and *"those set the floor whatever anybody signs"* — and
 * `binds` names the floor first of the three things it binds. It bound nothing.
 *
 * What that cost is a specific, indefensible number. `docs/ARREARS.md` found it
 * and could not fix it at the time: a day player on a small commercial earned
 * **EUR 273 for the week**, against an Icelandic minimum of about six hundred and
 * fifty. The entry's own words were that the "absurdly little" framing was
 * overstated as a level claim and understated as a structural one — the lead on a
 * four-hundred-thousand documentary at 3.3% of budget is defensible, and the day
 * player is simply below the legal floor.
 *
 * It is below it because the fee is a share of what the production spends and a
 * day part is three percent of a cast. That is the right model for a lead, who
 * negotiates against the budget, and the wrong one for a small part, who is paid
 * scale. A collective agreement exists precisely to make the second case not the
 * first, so the floor is what it is: the share, or this, whichever is larger.
 *
 * The anchor is real and the conversion is SLATE's own. The Icelandic collective
 * minimum for full-time work runs at ISK 425,000 a month, and `ISK_A_EURO` is the
 * rate this build already converts every Icelandic figure at.
 */
export const A_MONTH_AT_LEAST_ISK = 425_000;
export const SCALE_A_WEEK_CENTS: Money = Math.round(
  ((A_MONTH_AT_LEAST_ISK / 150) * 100 * 12) / 52,
);
