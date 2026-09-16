/**
 * SLATE — the player going up for something, and what it costs them.
 *
 * Everything else in this tree is the family's business. This is the one part
 * that belongs to the person, and it is the part the game is named after.
 *
 * ## Nothing here reads the sheet, on purpose
 *
 * The player holds all eight hundred and thirteen attributes at the ceiling and
 * forty-five of them are named for this room. So not one line below asks what
 * the player can do; every line asks what they chose. Whatever they play, they
 * play perfectly — the question is only ever whether it was the right idea, and
 * a perfect reading of the wrong idea is a perfect reading of the wrong idea.
 *
 * The practical test, and it is written into `tests/audition.test.ts`: set every
 * attribute in the save to fifty and every outcome in this file is identical. If
 * one moves, something in here is a craft check wearing a coat.
 *
 * ## Where the work comes from
 *
 * From the lot. A production that has booked a stage is a production that needs
 * people, and that is the only way anybody in this world hears about work that
 * is not their own family's. It makes two systems one: the money a player spends
 * telling the world the stages are there buys foreign calls, foreign calls book
 * weeks, and booked weeks are parts.
 *
 * It also means the player cannot make more work happen by wanting it. They can
 * make the lot busier, which is a different thing done a year earlier with
 * somebody else's money, and that gap is the honest shape of a career.
 *
 * ## The ratchet is being remembered, not being cast
 *
 * The research is explicit that roster memory is the main career ratchet and
 * that it pays out from a pass: a no in March is a booking in September from the
 * same office with no new audition. So what a reading buys is not the part. It
 * is that the next time these people need somebody, they think of you — and
 * that is worked out from the readings themselves rather than stored, because a
 * number counting how well somebody remembers you would drift from the readings
 * that earned it within a season.
 */

import type { Simulation } from '../core/simulation';
import type { Id } from '../core/ids';
import type { Money } from '../core/money';
import type { Instant } from '../core/time';
import type { Audition, Booking } from '../domain/model';
import { clamp } from '../core/rng';
import {
  AS_WRITTEN, A_WORKING_WEEK, CLOSE_ENOUGH, COLD, EXPECTED_OF_ANYBODY, FURTHEST, KNOWN_OF,
  RELIED_ON, REMEMBERED,
  HELD_AGAINST_YOU_YEARS, IGNORED, MISREAD_THE_ROOM, SHADES, TOO_FAR, WELL_LIKED,
  WHAT_THEY_OFFER,
  howFarById, shadeById, wayById, whyById, type Reading, type ShadeId, type WhyId,
} from '../content/audition';
import { SIZES, sizeById } from '../content/casting';
import { MS_WEEK } from './lot';
import { theyAreFree } from './diary';
import { readiness } from '../systems/life';

const MS_DAY = 24 * 60 * 60 * 1000;

export const AUDITION_KIND = 'life.reading';
export const WORKING_KIND = 'life.working';

// ---------------------------------------------------------------------------
// What is shooting that is not ours
// ---------------------------------------------------------------------------

/**
 * Every outside production with a stage booked, by its shooting row.
 *
 * The shooting row and not the build or the strike, because a production books
 * three and is one. The family's own pictures are excluded by the same field
 * that marks them: a booking the company holds carries `companyId`, and one a
 * broadcaster holds does not.
 */
export function shootingHere(sim: Simulation, from = sim.now): Booking[] {
  return Object.values(sim.universe.bookings)
    .filter((one) => one.kind === 'shooting' && one.companyId === undefined && one.to > from)
    .sort((a, b) => a.from - b.from);
}

/**
 * Readings the player has actually done for these people, whatever came of them.
 *
 * Every ending except the one where they never went. An ask that closed
 * unanswered is not a reading and must not read as one — it used to, back when
 * nothing closed at all, and the day auditions started expiring it would have
 * meant ignoring somebody made them think of you more.
 */
export function readFor(sim: Simulation, holder: string): Audition[] {
  return Object.values(sim.universe.auditions)
    .filter((one) => one.holder === holder && one.state !== 'open' && one.why !== 'never-answered');
}

/**
 * Times these people asked recently and the date to be seen by went past.
 *
 * Recently, and that word is the whole of it. Counting every one ever meant two
 * unanswered asks shut a holder for the rest of the save with no way back,
 * which is a countdown rather than a consequence — the same thing this build
 * refuses on the family's patience, where a bad year brings the rungs down and
 * a good one puts them back. Three years, the window the lot already judges its
 * own record over.
 */
export function ignoredBy(sim: Simulation, holder: string): number {
  const from = sim.now - HELD_AGAINST_YOU_YEARS * 365 * MS_DAY;
  return Object.values(sim.universe.auditions)
    .filter((one) => one.holder === holder && one.why === 'never-answered' && one.closesAt >= from)
    .length;
}

/**
 * Closes every ask whose date to be seen by has gone.
 *
 * `whatIsGoing` has always written a `closesAt` onto the row and said in the
 * notification that nobody is being seen after it, and nothing ever read that
 * date. Measured on a save nobody plays: sixty-six asks across twenty-five
 * years, every one still open, the oldest shut twelve years earlier. So the one
 * field on the record that says when a door closes was a sentence the game
 * printed and did not keep, and the list a player opened was parts cast years
 * ago by somebody else.
 *
 * They close here, and closing costs something, because the alternative is a
 * player who can ignore every part they are ever offered at no price.
 *
 * ## And the same date, one state further along
 *
 * A note is the player's turn rather than the clock's, which is right, and it
 * left the turn open forever. Measured on a save that went in for everything
 * and answered nothing: seventy-seven readings, seventy-seven of them still
 * sitting on an unanswered note twenty-five years later, not one no on the
 * record — and every one of them counted by `readFor`, because it counts a
 * reading that is not open and not never-answered. Going into the room and
 * walking out of it bought exactly what going in and doing the job bought.
 *
 * So a note goes unanswered on the first day of the shoot rather than never.
 * Not on `closesAt`, which is the date nobody is *seen* after and can fall
 * three days before a reading the player was in time to book; on the day the
 * thing is being made, by which point somebody else is standing in the part.
 * It settles on what was actually played, which is the reading before the note
 * — they were in the room and they were seen, and what they did not do was
 * answer.
 */
export function shutWhatHasClosed(sim: Simulation): Audition[] {
  const shut: Audition[] = [];
  for (const audition of Object.values(sim.universe.auditions)) {
    if (audition.state === 'noted' && sim.now >= audition.from) {
      settle(sim, audition, true);
      continue;
    }
    if (audition.state !== 'open' || sim.now <= audition.closesAt) continue;
    audition.state = 'over';
    audition.why = 'never-answered';
    shut.push(audition);
  }
  if (shut.length > 0) {
    const holders = [...new Set(shut.map((one) => one.holder))];
    sim.notify({
      category: 'career',
      title: shut.length === 1 ? 'A Part Went Without You' : `${shut.length} Parts Went Without You`,
      body: `${holders.join(', ')} asked, nobody heard back, and the date to be seen by has gone. `
        + 'Being asked and not answering is the one thing an office remembers about a performer it '
        + 'has never met.',
      importance: 50,
    });
  }
  return shut;
}

/**
 * Whether these people think of the player when they need somebody.
 *
 * Two halves, and they are different kinds of thing. One is what these
 * particular people remember, which climbs with every reading they have sat
 * through — including the ones that ended in no, which is the entire point.
 * The other is what everybody knows, which is fame, and fame is the half that
 * travels: a production that has never had you in still has an opinion if
 * enough people already know the name.
 *
 * Without the second half the whole ratchet was a cul-de-sac. Being cast moved
 * a fame that nothing on this side read, so a household name was a stranger to
 * anybody they had not personally sat in front of.
 *
 * Worked out from the readings and the person rather than stored, so it cannot
 * drift from the things that earned it.
 */
export function remembersYou(sim: Simulation, holder: string): number {
  const me = sim.universe.people[sim.universe.playerId];
  const fame = me?.reputation.publicFame ?? 0;
  // And whether they were easy to have there last time. Having been seen is what
  // gets an office to think of you; having been reliable is what stops them
  // hesitating. It is the only thing in this build that can take work away from
  // somebody who is perfect at the work, which is what makes it the cost the
  // premise leaves available.
  const relied = Math.min(0,
    ((me?.reputation.reliability ?? EXPECTED_OF_ANYBODY) - EXPECTED_OF_ANYBODY) / EXPECTED_OF_ANYBODY);
  return clamp(
    COLD + readFor(sim, holder).length * REMEMBERED + (fame / 100) * KNOWN_OF + relied * RELIED_ON
      - ignoredBy(sim, holder) * IGNORED,
    0, 1,
  );
}

// ---------------------------------------------------------------------------
// What a part is worth
// ---------------------------------------------------------------------------

/**
 * What a production shooting this many weeks pays for a part this size.
 *
 * Off the booking's own weekly rate, which is what the lot charged them, scaled
 * by how long they are here and by how much of the thing a part this size is.
 * A production that took a big stage for nine weeks is a production with money,
 * and there is no second table saying so.
 *
 * SLATE's own, and it has to be: the lot's rate card is what the stage costs,
 * not what the cast costs, and no published ratio between the two exists.
 */
export function feeFor(booking: Booking, sizeId: string): Money {
  const size = sizeById(sizeId);
  if (!size) return 0;
  const weeks = Math.max(1, (booking.to - booking.from) / MS_WEEK);
  return Math.round(booking.weekRateCents * weeks * size.onScreen * 0.55);
}

/** The size of part a production of this length is likely to be casting. */
/**
 * What these people, in particular, think the player is.
 *
 * Nought when nobody there has ever seen them, one when they have seen enough.
 * Read off the readings this holder has sat through — including every one that
 * ended in no, because being watched is what teaches a room whatever it decided
 * afterwards — with a reputation standing in for part of it and never all.
 *
 * It is the whole of what the prodigy constraint leaves room for. The player
 * cannot be bad at this and the sheet cannot move, so what varies is not what
 * they are, it is who has found out.
 */
export function believedOf(sim: Simulation, holder: string): number {
  const seen = readFor(sim, holder).length;
  const fame = (sim.universe.people[sim.universe.playerId]?.reputation.publicFame ?? 0) / 100;
  return clamp(
    seen / WHAT_THEY_OFFER.seenEnough + fame * WHAT_THEY_OFFER.fameStandsIn,
    0, 1,
  );
}

/**
 * What size of part somebody is asked about.
 *
 * Two gates and they are different questions. A job has to contain the size at
 * all — a commercial shooting for a week has no lead in it to cast, whoever is
 * available — and the office has to be willing to hand it over. The smaller of
 * the two decides the best somebody is offered, and the draw picks below it.
 *
 * Only the first of those existed, and at nine weeks or more it returned the
 * first row of `SIZES` for every roll there is, so every long job offered a lead
 * and the lot mostly books long. A career whose first job can only be the lead
 * is not a career, and the four authored size rows had one that nothing could
 * reach.
 */
export function sizeCasting(weeks: number, believed: number, roll: number): string {
  const has = clamp(weeks / 9, 0, 1);
  const top = Math.min(has, clamp(believed, 0, 1));
  // SIZES runs biggest first, so a low ceiling starts further down the list.
  const from = Math.floor((1 - top) * (SIZES.length - 1));
  const at = clamp(from + Math.floor(roll * (SIZES.length - from)), 0, SIZES.length - 1);
  return SIZES[at]!.id;
}

// ---------------------------------------------------------------------------
// The want
// ---------------------------------------------------------------------------

/** What one room wants, drawn once and never shown. */
export function whatTheyWant(next: () => number): Record<string, number> {
  const out: Record<string, number> = {};
  for (const shade of SHADES) {
    out[shade.id] = Math.round((next() * 2 - 1) * FURTHEST);
  }
  return out;
}

/** A reading, cleaned up into the range anybody could actually play. */
export function readingOf(raw: Partial<Record<string, number>> | undefined): Reading {
  const out = { ...AS_WRITTEN };
  for (const shade of SHADES) {
    const one = Number(raw?.[shade.id] ?? 0);
    out[shade.id] = Number.isFinite(one) ? clamp(Math.round(one), -FURTHEST, FURTHEST) : 0;
  }
  return out;
}

/**
 * How far a reading is from what the room wanted.
 *
 * The mean across the three shades, so being badly wrong about one thing is a
 * third of being wrong about everything. Nought is what they asked for and
 * nobody ever gets it.
 */
export function howFarOff(played: Reading, wants: Record<string, number>): number {
  let total = 0;
  for (const shade of SHADES) total += Math.abs(played[shade.id] - (wants[shade.id] ?? 0));
  return total / SHADES.length;
}

/**
 * The one note the room gives.
 *
 * On the shade the reading was FARTHEST off, which is what a room actually
 * says: the note is about the thing that is most wrong, not the thing that
 * nearly worked. It used to be the closest shade, on the reasoning that a room
 * tells you about the part that nearly landed — good prose, and it quietly made
 * the next decision unanswerable. The closest non-zero error is almost always
 * the smallest one there is: enumerated, 57% of notes asked for a move of one
 * step and 83% for one or two. A question whose answer is nearly always the
 * same number is not a question, and it is why every magnitude scheme tried
 * against it had a favorite in four states out of five.
 *
 * On the farthest shade the distances spread across the whole range — one step
 * to six, with no value above a quarter of them — so how far to go is worth
 * asking. Ties go to the first shade declared, so the note is the same note
 * every time the same reading is played, and no draw is involved in what
 * anybody says.
 */
export function theNote(played: Reading, wants: Record<string, number>): { shade: ShadeId; toward: number } | undefined {
  let best: ShadeId | undefined;
  let worst = 0;
  for (const shade of SHADES) {
    const off = Math.abs(played[shade.id] - (wants[shade.id] ?? 0));
    // A shade already exactly right gets no note, because a room does not ask
    // for a change to the thing it has. An earlier version did give one — "more
    // of that" — and it made the note a trap: any movement on a shade already
    // landed makes it worse, and the player has no way of knowing which kind of
    // note they are holding. A note you cannot act on is a coin with prose.
    if (off > worst) { worst = off; best = shade.id; }
  }
  if (!best) return undefined;
  return { shade: best, toward: Math.sign((wants[best] ?? 0) - played[best]) };
}

/**
 * How surely the player read the room, 0 to 1.
 *
 * One minus the share of their readiness that is missing, bounded by
 * `MISREAD_THE_ROOM`. Nothing here asks what the player can do — the premise
 * forbids it and a test greps this file to make sure. What it asks is whether
 * they were in any state to take in eight minutes and one sentence.
 */
export function heardItRight(sim: Simulation): number {
  const me = sim.universe.people[sim.universe.playerId];
  const ready = me ? clamp(readiness(me) / 100, 0, 1) : 1;
  return 1 - MISREAD_THE_ROOM * (1 - ready);
}

/**
 * What the reading becomes once the note is answered.
 *
 * The move is the number of steps the player chose, in the direction they took
 * the note to mean. Both halves of that are new and the first is the important
 * one: the magnitude used to be a SHARE of the distance the note was asking
 * for, and that distance is the hidden truth, so taking it "all the way" landed
 * on the want exactly, every time, by construction. Four buttons, one of which
 * was arithmetically incapable of being beaten.
 *
 * `sure` is the second half. Below one there is a chance the player moved the
 * shade the wrong way — not because they cannot act, but because a room gives
 * one note, once, and a tired person hears it wrong. It is the only thing that
 * makes the size of the move a decision: three steps is three steps of right
 * or three steps of wrong, and one step is neither.
 *
 * The draw is the caller's, so this stays pure and a test can walk both
 * outcomes without owning a simulation.
 */
export function afterTheNote(
  played: Reading, note: { shade: string; toward: number },
  howFarId: string, sure = 1, roll = 0,
): Reading {
  const how = howFarById(howFarId);
  const shade = shadeById(note.shade);
  if (!how || !shade) return played;
  const heard = roll < sure ? note.toward : -note.toward;
  const out = { ...played };
  out[shade.id] = clamp(played[shade.id] + heard * how.steps, -FURTHEST, FURTHEST);
  return out;
}

// ---------------------------------------------------------------------------
// The decision
// ---------------------------------------------------------------------------

export interface Reckoning {
  /** How far the final reading was from what they wanted. */
  off: number;
  /** Whether they were in the room, or watching a file. */
  sawYou: boolean;
  /** Whether the player is free for the dates. */
  free: boolean;
}

/**
 * Whether the part is yours.
 *
 * Dates first, because no reading survives being unavailable. Then distance,
 * which is the whole of it: a reading far enough off is not a near miss, it is
 * a different part. What is left is a draw, because two people can both be
 * right for something and only one of them gets it, and pretending otherwise
 * would make casting an exam.
 *
 * Nothing in here reads an attribute, and nothing in here reads which way the
 * player went up for it except to say what the no was called — the tape's cost
 * is paid earlier, in the note it never gave.
 */
export function decideAudition(reckoning: Reckoning, roll: number): WhyId {
  if (!reckoning.free) return 'dates';
  if (reckoning.off > TOO_FAR) return 'wrong-for-it';
  // Inside what they asked for, it is as good as it gets and still not certain.
  // Outside it, it falls away to nothing by the point the door shuts.
  const keen = reckoning.off <= CLOSE_ENOUGH
    ? AS_GOOD_AS_IT_GETS
    : AS_GOOD_AS_IT_GETS
      * (1 - (reckoning.off - CLOSE_ENOUGH) / (TOO_FAR - CLOSE_ENOUGH)) ** 1.4;
  if (roll < keen) return 'cast';
  return reckoning.sawYou ? 'went-another-way' : 'not-in-the-room';
}

// ---------------------------------------------------------------------------
// Hearing about it
// ---------------------------------------------------------------------------

/**
 * How long before the shoot a production is casting.
 *
 * Four weeks, which is late for a lead and about right for everything else. It
 * is one number rather than a table because the parts a lot picks up from
 * somebody else's production are not the ones cast a year out in another
 * country — they are the ones cast here, close in, because the production is
 * already standing on the stage. SLATE's own.
 */
export const ASKING_AT = 4;

/** How many weeks before the shoot the last person is seen. */
export const SHUTS_AT = 1;

/**
 * Puts out whatever the productions on the lot are casting.
 *
 * Runs on the weekly tick. One part per production at most, and only from the
 * ones who would think of the player at all — which is what being read for
 * somebody twice buys, and it buys nothing else.
 */
export function whatIsGoing(sim: Simulation): Audition[] {
  shutWhatHasClosed(sim);
  const made: Audition[] = [];
  for (const booking of shootingHere(sim)) {
    const opens = booking.from - ASKING_AT * MS_WEEK;
    const closes = booking.from - SHUTS_AT * MS_WEEK;
    if (sim.now < opens || sim.now > closes) continue;
    if (Object.values(sim.universe.auditions).some((one) => one.bookingId === booking.id)) continue;

    const rng = sim.rng('audition', 'calls', booking.id);
    if (rng.next() > remembersYou(sim, booking.holder)) continue;

    const weeks = (booking.to - booking.from) / MS_WEEK;
    const size = sizeCasting(weeks, believedOf(sim, booking.holder), rng.next());
    const audition: Audition = {
      id: sim.nextId('audition'),
      saveId: sim.universe.meta.id,
      bookingId: booking.id,
      holder: booking.holder,
      size,
      feeCents: feeFor(booking, size),
      from: booking.from,
      to: booking.to,
      closesAt: closes,
      wants: whatTheyWant(() => rng.next()),
      state: 'open',
    };
    sim.universe.auditions[audition.id] = audition;
    made.push(audition);
    sim.notify({
      category: 'career',
      title: `${booking.holder} Is Casting`,
      body: `${sizeById(size)?.label ?? 'A part'} on the thing they have taken a stage for. `
        + `They shoot from ${new Date(booking.from).toISOString().slice(0, 10)} `
        + `and nobody is being seen after ${new Date(closes).toISOString().slice(0, 10)}.`,
      importance: 60,
      refType: 'audition',
      refId: audition.id,
    });
  }
  return made;
}

/** Everything the player could still go up for. */
export const goingNow = (sim: Simulation): Audition[] =>
  Object.values(sim.universe.auditions)
    .filter((one) => one.state === 'open' && sim.now <= one.closesAt)
    .sort((a, b) => a.closesAt - b.closesAt);

/** Everything they are part way through, or have finished. */
export const alreadyUpFor = (sim: Simulation): Audition[] =>
  Object.values(sim.universe.auditions)
    .filter((one) => one.state !== 'open')
    .sort((a, b) => (b.decidedAt ?? b.closesAt) - (a.decidedAt ?? a.closesAt));

// ---------------------------------------------------------------------------
// Doing it
// ---------------------------------------------------------------------------

/** Whether the player is committed anywhere across a span. */
export function freeAcross(sim: Simulation, from: Instant, to: Instant): boolean {
  return theyAreFree(sim, from, to);
}

export interface GoingUp {
  auditionId: Id;
  way: string;
  played: Partial<Record<string, number>>;
}

/**
 * Goes up for a part, one way or the other.
 *
 * The reading is chosen here and it is chosen blind, which is the whole of the
 * first decision. Nobody has said anything about what this part is for and
 * nothing on any screen will, so what the player sends is a guess — perfectly
 * executed, because they are perfect, and a guess all the same.
 */
export function goUpFor(sim: Simulation, going: GoingUp): { ok: true; at: Instant } | { ok: false; error: string } {
  const audition = sim.universe.auditions[going.auditionId];
  if (!audition) return { ok: false, error: 'There’s no such part.' };
  if (audition.state !== 'open') return { ok: false, error: 'You have already been up for that one.' };
  if (sim.now > audition.closesAt) return { ok: false, error: 'They have stopped seeing people for it.' };
  const way = wayById(going.way);
  if (!way) return { ok: false, error: 'That isn’t a way of going up for anything.' };
  if (!freeAcross(sim, audition.from, audition.to)) {
    return { ok: false, error: 'You are working on those dates. There is no point reading for it.' };
  }

  const account = sim.universe.people[sim.universe.playerId]?.primaryAccountId;
  if (account && way.costsCents > 0) {
    sim.expense(account, way.costsCents, `Going in for ${audition.holder}`, 'career',
      { refType: 'audition', refId: audition.id });
  }

  audition.played = readingOf(going.played);
  audition.way = way.id;
  audition.state = 'waiting';
  const at = sim.now + Math.round(way.days * MS_DAY);
  sim.schedule({
    at,
    kind: AUDITION_KIND,
    label: way.notes ? `Reading For ${audition.holder}` : `${audition.holder}: The Tape Goes In`,
    category: 'career',
    priority: 40,
    // A room is somewhere you have to be and a tape is not, which is the whole
    // difference between the two ways in. Going in spends an afternoon that the
    // clock now stops for and that something else can want; taping spends the
    // days and none of the hours.
    ...(way.notes ? { requiresPlayer: true, durationMinutes: IN_THE_ROOM } : {}),
    payload: { auditionId: audition.id },
    refType: 'audition',
    refId: audition.id,
  });
  return { ok: true, at };
}

export interface Taking {
  auditionId: Id;
  howFar: string;
}

/**
 * Answers the note.
 *
 * The second and last decision, and the only one taken with any information in
 * it. What the room said is one shade and one direction; how far they wanted is
 * never said, and the difference between halfway, all the way and past it is
 * the difference between not listening, doing the job, and throwing away the
 * thing that made them ask.
 */
export function takeTheNote(sim: Simulation, taking: Taking): { ok: true; why: WhyId } | { ok: false; error: string } {
  const audition = sim.universe.auditions[taking.auditionId];
  if (!audition) return { ok: false, error: 'There’s no such part.' };
  if (audition.state !== 'noted' || !audition.note || !audition.played) {
    return { ok: false, error: 'Nobody has given you a note to take.' };
  }
  if (!howFarById(taking.howFar)) return { ok: false, error: 'That isn’t a way of taking a note.' };

  // Whether they took in what was actually said. Its own draw, keyed to this
  // audition, so the same save answering the same note the same way gets the
  // same day — and so a player who saves before a reading cannot roll for a
  // better room by taking the note twice.
  const sure = heardItRight(sim);
  const roll = sim.rng('audition', 'heard', audition.id).next();
  audition.heard = roll < sure;
  audition.played = afterTheNote(readingOf(audition.played), audition.note, taking.howFar, sure, roll);
  return { ok: true, why: settle(sim, audition, true) };
}

/** What the room decides, once there is nothing left to play. */
function settle(sim: Simulation, audition: Audition, sawYou: boolean): WhyId {
  const off = howFarOff(readingOf(audition.played), audition.wants);
  const roll = sim.rng('audition', 'said', audition.id).next();
  const why = decideAudition(
    { off, sawYou, free: freeAcross(sim, audition.from, audition.to) }, roll,
  );
  audition.state = 'over';
  audition.why = why;
  audition.decidedAt = sim.now;
  if (why === 'cast') theyWantYou(sim, audition);
  sim.notify({
    category: 'career',
    title: why === 'cast' ? `${audition.holder}: It Is Yours` : `${audition.holder}: Not This One`,
    body: sayWhy(audition),
    importance: why === 'cast' ? 80 : 45,
    refType: 'audition',
    refId: audition.id,
  });
  return why;
}

/**
 * What being cast in somebody else's picture does.
 *
 * The money is real and it is theirs — the first money in the build that comes
 * into the player's account from outside the family. The rest is the ratchet:
 * a fee on the record is what everybody else argues from next time, and being
 * in something other people watch is the only thing that has ever moved this
 * player's fame off nought.
 */
/** How long an afternoon in a room actually takes out of a day. */
export const IN_THE_ROOM = 90;

/**
 * Puts the engagement on the player's own calendar, a week at a time.
 *
 * The half of being cast that did not exist. `theyWantYou` posted the fee, moved
 * four reputation fields and scheduled nothing at all, so a nine-week picture
 * stopped the player's clock for exactly no time and a career was a sequence of
 * bank transfers. `requiresPlayer` had one write site in the whole engine and it
 * was a plan the player had typed themselves.
 *
 * A week rather than a day, deliberately. `docs/DEPTH.md` is explicit that
 * nothing downstream may name a shooting day, because an engine that names one
 * forecloses every other kind of production permanently — and a performer's week
 * on a picture is not the production's unit anyway. What this says is only that
 * somebody is working and cannot be elsewhere, which is true of every kind of
 * thing that could ever be made.
 */
function takeTheirWeeks(sim: Simulation, audition: Audition): void {
  const weeks = Math.max(1, Math.round((audition.to - audition.from) / MS_WEEK));
  for (let i = 0; i < weeks; i += 1) {
    const at = audition.from + i * MS_WEEK;
    if (at < sim.now) continue;
    sim.schedule({
      at,
      kind: WORKING_KIND,
      label: weeks === 1
        ? `On ${audition.holder}`
        : `On ${audition.holder}: Week ${i + 1} Of ${weeks}`,
      category: 'career',
      priority: 45,
      requiresPlayer: true,
      payload: { auditionId: audition.id, week: i + 1, of: weeks },
      refType: 'audition',
      refId: audition.id,
    });
  }
}

/**
 * What a week of it costs, which is never the work.
 *
 * The player cannot act badly, so nothing here touches whether the performance
 * was good. What a week decides is whether they were easy to have there, and
 * that is read off how much was left in them while they were doing it: somebody
 * working from under `spentAt` was late once, was short with the second AD,
 * needed an afternoon. None of that is about being able to act, and all of it is
 * what an office remembers.
 *
 * It moves both ways on purpose. A run of weeks worked in good order earns a
 * little back, so `reliability` is a record of how somebody works rather than a
 * meter that only falls — and so the answer to being tired is to stop for a
 * while, which is a decision, rather than to never work, which is not.
 */
function whatTheWeekTook(sim: Simulation, audition: Audition, week: number, of: number): void {
  const me = sim.universe.people[sim.universe.playerId];
  if (!me) return;
  const left = readiness(me);
  const was = me.reputation.reliability;
  me.reputation.reliability = clamp(Math.round(
    left < A_WORKING_WEEK.spentAt
      ? was - A_WORKING_WEEK.costsAWeek
      : was + A_WORKING_WEEK.earnsAWeek,
  ), 0, 100);
  if (me.reputation.reliability >= was) return;
  sim.notify({
    category: 'career',
    title: `${audition.holder}: A Hard Week`,
    body: 'You had nothing left and you went in anyway. Nobody says a word about the work — '
      + 'they say you were late, and that they had to wait.'
      + (week < of ? ` ${of - week} weeks of it still to go.` : ''),
    importance: 50,
    refType: 'audition',
    refId: audition.id,
  });
}

export function theyWantYou(sim: Simulation, audition: Audition): void {
  const me = sim.universe.people[sim.universe.playerId];
  if (!me) return;
  takeTheirWeeks(sim, audition);
  const account = me.primaryAccountId;
  if (account && audition.feeCents > 0) {
    sim.income(account, audition.feeCents, `${audition.holder}: Acting Fee`, 'career',
      { refType: 'audition', refId: audition.id });
  }
  if (!me.quotes) me.quotes = [];
  me.quotes.push({ projectId: audition.id, size: audition.size, cents: audition.feeCents, at: sim.now });
  const size = sizeById(audition.size);
  const carries = size?.onScreen ?? 0.1;
  me.reputation.publicFame = clamp(Math.round(me.reputation.publicFame + carries * 34), 0, 100);
  me.reputation.industryDemand = clamp(Math.round(me.reputation.industryDemand + carries * 26), 0, 100);
  me.reputation.professionalReputation = clamp(
    Math.round(me.reputation.professionalReputation + carries * 22), 0, 100,
  );
  // And whether the people who know them are glad about it. For this player it
  // only ever goes one way: they are the best there has ever been at this, so
  // anything they are in, they are good in, and appeal is simply what being
  // good in front of people accumulates into. It is the one axis that is not a
  // measure of them at all — it is a measure of what an audience has come to
  // feel, and the only way to get one is to have been somewhere they were
  // looking.
  me.reputation.audienceAppeal = clamp(
    Math.round(me.reputation.audienceAppeal + carries * WELL_LIKED), 0, 100,
  );
}

/** What anybody would say about how it went, which is rarely anything. */
export function sayWhy(audition: Audition): string {
  const why = audition.why ? whyById(audition.why) : undefined;
  const size = sizeById(audition.size);
  if (audition.why === 'cast') {
    return `${why?.said ?? 'They want you.'} ${size?.label ?? 'The part'}, `
      + `${Math.round(audition.feeCents / 100).toLocaleString('en-US')} euros.`;
  }
  // And whether the note went in backwards, which is the one thing a no can
  // tell you that you could not have known in the room. `Audition.heard` has
  // been written at every reading since the note existed and read by nothing,
  // while its own docstring said the whole point of keeping it was that "a no
  // you can open and find out you misheard is a different no from a no you
  // played right". It is that no now.
  const missed = audition.heard === false
    ? ' You took the note the wrong way — it was a bad day to be told something once.'
    : '';
  return `${why?.said ?? 'Nobody wrote back.'}${missed}`;
}

/**
 * The likeliest anybody is ever to say yes.
 *
 * Short of one on purpose. Two people can be exactly right for the same part
 * and one of them gets it, and a room that took the best reading every time
 * would be an exam. SLATE's own.
 */
export const AS_GOOD_AS_IT_GETS = 0.82;

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------

export function registerAudition(sim: Simulation): void {
  /**
   * A week of being on it.
   *
   * It does nothing to the world and that is correct for now: the point of the
   * item is that it exists, stops the clock and can be wanted by something else
   * at the same time. What a week of work takes out of the person giving it is
   * the next piece, and it is not invented here so that this one can be judged
   * on its own.
   */
  sim.onSchedule(WORKING_KIND, (item) => {
    const audition = sim.universe.auditions[String(item.payload?.auditionId ?? '')];
    if (!audition || audition.why !== 'cast') return;
    const week = Number(item.payload?.week ?? 0);
    const of = Number(item.payload?.of ?? 0);
    whatTheWeekTook(sim, audition, week, of);
    if (week !== 1) return;
    sim.notify({
      category: 'career',
      title: `You Start On ${audition.holder}`,
      body: of === 1
        ? 'A week of it, and your own time isn’t yours for any of it.'
        : `${of} weeks of it, and your own time isn’t yours for any of them.`,
      importance: 55,
      refType: 'audition',
      refId: audition.id,
    });
  });

  /**
   * The day the reading happens.
   *
   * A tape is watched or it is not, and that is the end of it. A room gives one
   * note and then waits, because the note is only worth anything if somebody
   * gets to answer it — and answering it is the player's turn, not the clock's.
   */
  sim.onSchedule(AUDITION_KIND, (item) => {
    const audition = sim.universe.auditions[String(item.payload?.auditionId ?? '')];
    if (!audition || audition.state !== 'waiting' || !audition.played) return;
    const way = wayById(audition.way ?? '');
    if (way?.notes) {
      const note = theNote(readingOf(audition.played), audition.wants);
      if (note) {
        audition.note = note;
        audition.state = 'noted';
        const shade = shadeById(note.shade);
        sim.notify({
          category: 'career',
          title: `${audition.holder}: They Give You A Note`,
          body: `“${shade ? (note.toward > 0 ? shade.high : shade.low) : 'Again'}.” `
            + 'That is all anybody is going to tell you about what this part is for. '
            + 'How far they meant, they did not say.',
          importance: 70,
          refType: 'audition',
          refId: audition.id,
        });
        return;
      }
    }
    settle(sim, audition, way?.notes ?? false);
  });

  /** Go up for a part, one way or the other, with a reading chosen blind. */
  sim.onCommand<GoingUp, { ok: boolean; error?: string; at?: number }>(
    'life.go_up', (payload, { sim: s }) => {
      const done = goUpFor(s, payload);
      return done.ok ? { ok: true, at: done.at } : { ok: false, error: done.error };
    },
  );

  /** Answer the one note anybody gives you. */
  sim.onCommand<Taking, { ok: boolean; error?: string; why?: string }>(
    'life.take_note', (payload, { sim: s }) => {
      const done = takeTheNote(s, payload);
      return done.ok ? { ok: true, why: done.why } : { ok: false, error: done.error };
    },
  );
}

/** What the player's own work amounts to, in a sentence. */
export function whereYourWorkStands(sim: Simulation): string {
  const open = goingNow(sim).length;
  const done = alreadyUpFor(sim);
  const got = done.filter((one) => one.why === 'cast').length;
  if (done.length === 0) {
    return open === 0
      ? 'Nobody has asked you about anything. Nobody has heard of you, and the stages are quiet.'
      : `${open} ${open === 1 ? 'part' : 'parts'} to go up for, and nothing behind you yet.`;
  }
  return `${done.length} ${done.length === 1 ? 'reading' : 'readings'}, ${got} of them yours`
    + `${open > 0 ? `, and ${open} more to go up for` : ''}.`;
}
