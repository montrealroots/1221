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
  AS_WRITTEN, CLOSE_ENOUGH, COLD, FURTHEST, KNOWN_OF, REMEMBERED, SHADES, TOO_FAR, WELL_LIKED,
  howFarById, shadeById, wayById, whyById, type Reading, type ShadeId, type WhyId,
} from '../content/audition';
import { SIZES, sizeById } from '../content/casting';
import { MS_WEEK } from './lot';

const MS_DAY = 24 * 60 * 60 * 1000;

export const AUDITION_KIND = 'life.reading';

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

/** Readings the player has done for these people, whatever came of them. */
export function readFor(sim: Simulation, holder: string): Audition[] {
  return Object.values(sim.universe.auditions)
    .filter((one) => one.holder === holder && one.state !== 'open');
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
  const fame = sim.universe.people[sim.universe.playerId]?.reputation.publicFame ?? 0;
  return clamp(
    COLD + readFor(sim, holder).length * REMEMBERED + (fame / 100) * KNOWN_OF,
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
export function sizeCasting(weeks: number, roll: number): string {
  // Short jobs are day parts and long ones have leads in them, which is not a
  // rule about money — it is that a commercial shooting for a week does not
  // have a lead to cast and a nine-week series does.
  const reach = clamp(weeks / 9, 0, 1);
  const at = clamp(Math.floor((1 - reach * 0.75) * roll * SIZES.length), 0, SIZES.length - 1);
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
 * On the shade the reading was closest on, because a room tells you about the
 * part of it that nearly worked — which is also what makes over-taking
 * expensive, since the shade you are being asked to move is the shade you had
 * right. Ties go to the first shade declared, so the note is the same note every
 * time the same reading is played, and no draw is involved in what anybody says.
 */
export function theNote(played: Reading, wants: Record<string, number>): { shade: ShadeId; toward: number } | undefined {
  let best: ShadeId | undefined;
  let closest = Infinity;
  for (const shade of SHADES) {
    const off = Math.abs(played[shade.id] - (wants[shade.id] ?? 0));
    // A shade already exactly right gets no note, because a room does not ask
    // for a change to the thing it has. An earlier version did give one — "more
    // of that" — and it made the note a trap: any movement on a shade already
    // landed makes it worse, and the player has no way of knowing which kind of
    // note they are holding. A note you cannot act on is a coin with prose.
    if (off > 0 && off < closest) { closest = off; best = shade.id; }
  }
  if (!best) return undefined;
  return { shade: best, toward: Math.sign((wants[best] ?? 0) - played[best]) };
}

/**
 * What the reading becomes once the note is answered.
 *
 * The magnitude is applied to the distance the note was actually asking for,
 * which the player is never told. Taking it all the way lands exactly on it.
 * Taking it past goes further, and further is past the thing they liked.
 */
export function afterTheNote(
  played: Reading, wants: Record<string, number>, note: { shade: string; toward: number }, howFarId: string,
): Reading {
  const how = howFarById(howFarId);
  const shade = shadeById(note.shade);
  if (!how || !shade) return played;
  // What the note was actually asking for, which the player is never told. All
  // the way lands on it exactly; halfway does not get there; past it goes past.
  const asked = (wants[shade.id] ?? 0) - played[shade.id];
  const out = { ...played };
  out[shade.id] = clamp(Math.round(played[shade.id] + asked * how.share), -FURTHEST, FURTHEST);
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
  const made: Audition[] = [];
  for (const booking of shootingHere(sim)) {
    const opens = booking.from - ASKING_AT * MS_WEEK;
    const closes = booking.from - SHUTS_AT * MS_WEEK;
    if (sim.now < opens || sim.now > closes) continue;
    if (Object.values(sim.universe.auditions).some((one) => one.bookingId === booking.id)) continue;

    const rng = sim.rng('audition', 'calls', booking.id);
    if (rng.next() > remembersYou(sim, booking.holder)) continue;

    const weeks = (booking.to - booking.from) / MS_WEEK;
    const size = sizeCasting(weeks, rng.next());
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
  const me = sim.universe.playerId;
  for (const project of Object.values(sim.universe.projects)) {
    for (const seat of project.cast ?? []) {
      if (seat.personId !== me || seat.releasedAt !== undefined) continue;
      const role = project.roles?.find((r) => r.id === seat.roleId);
      if (!role) continue;
      const shoot = project.periods?.find((p) => p.id === 'shooting')
        ?? project.periods?.find((p) => p.id === 'field');
      if (shoot && shoot.from - MS_WEEK < to && from < shoot.to) return false;
    }
  }
  for (const one of Object.values(sim.universe.auditions)) {
    if (one.why !== 'cast') continue;
    if (one.from < to && from < one.to) return false;
  }
  return true;
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

  audition.took = taking.howFar;
  audition.played = afterTheNote(readingOf(audition.played), audition.wants, audition.note, taking.howFar);
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
export function theyWantYou(sim: Simulation, audition: Audition): void {
  const me = sim.universe.people[sim.universe.playerId];
  if (!me) return;
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
  return why?.said ?? 'Nobody wrote back.';
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
