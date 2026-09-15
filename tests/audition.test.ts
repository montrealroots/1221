/**
 * SLATE — going up for it, and the one rule the whole system is shaped by.
 *
 * The player holds every one of the eight hundred and thirteen attributes at
 * the ceiling, and forty-five of them are named for this room: `cold_reading`,
 * `taking_a_redirect`, `nerve_management`, `walking_into_the_room`,
 * `self_tape_craft`. A faithful port of the research would be forty-five
 * lookups all returning a hundred, which `docs/DEPTH.md` names as a trap in
 * exactly those words.
 *
 * So the first test in this file is the one that matters: set every attribute
 * in the save to fifty and every outcome must be identical. If one moves,
 * something in `world/audition.ts` is a craft check wearing a coat, and the
 * room is an exam the player cannot fail.
 *
 * Everything after it checks that what is left is still a decision.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine';
import type { Audition, Booking } from '@/engine/domain/model';
import { sheetOf } from '@/engine/domain/attributes';
import { MS_DAY } from '@/engine/core/time';
import { MS_WEEK } from '@/engine/world/lot';
import {
  AS_GOOD_AS_IT_GETS, ASKING_AT, SHUTS_AT, afterTheNote, alreadyUpFor, decideAudition, feeFor,
  freeAcross, goingNow, howFarOff, readingOf, remembersYou, shootingHere, theNote, whatIsGoing,
  theyWantYou, whatTheyWant, whereYourWorkStands, WORKING_KIND,
} from '@/engine/world/audition';
import { whatHasThem } from '@/engine/world/diary';
import {
  AS_WRITTEN, CLOSE_ENOUGH, COLD, FURTHEST, KNOWN_OF, REMEMBERED, SHADES, TOO_FAR, WAYS, howFarById,
} from '@/engine/content/audition';
import { sizeById } from '@/engine/content/casting';

interface Done { ok: boolean; error?: string; at?: number; why?: string }
const run = (sim: Simulation, kind: string, payload: Record<string, unknown> = {}): Done =>
  sim.execute<Done>({ kind, payload }).value!;

const world = (seed: string): Simulation => quickSave({}, seed);

/** Puts an outside production on a stage, the way the lot does. */
function shootingOnTheLot(sim: Simulation, holder: string, weeks = 6, inWeeks = 8): Booking {
  const stage = Object.values(sim.universe.stages)[0]!;
  const from = sim.now + inWeeks * MS_WEEK;
  const booking: Booking = {
    id: sim.nextId('booking'),
    saveId: sim.universe.meta.id,
    stageId: stage.id,
    holder,
    kind: 'shooting',
    from,
    to: from + weeks * MS_WEEK,
    weekRateCents: 3_000_000,
  };
  sim.universe.bookings[booking.id] = booking;
  return booking;
}

/**
 * Moves the clock to the week they are casting, and gets somebody to ask.
 *
 * Whether a given production thinks of the player is a draw against how well
 * they are remembered, so a test that hung on one booking would be testing the
 * draw. This puts productions on until one of them asks, which is what a year
 * of them does anyway.
 */
function untilTheyAsk(sim: Simulation, booking: Booking): Audition | undefined {
  // Two readings already behind you with these people, so they are likely to
  // think of you. Whether they think of you at all is its own draw with its own
  // test; a test about the room should not be riding it.
  for (let i = 0; i < 2; i += 1) {
    const id = sim.nextId('audition');
    sim.universe.auditions[id] = {
      id, saveId: sim.universe.meta.id, bookingId: `before-${id}`, holder: booking.holder,
      size: 'day', feeCents: 1_00, from: sim.now - 2 * MS_WEEK, to: sim.now - MS_WEEK,
      closesAt: sim.now - 3 * MS_WEEK, wants: {}, state: 'over', why: 'went-another-way',
    };
  }
  let at = booking;
  for (let i = 0; i < 12; i += 1) {
    sim.advanceTo(at.from - ASKING_AT * MS_WEEK + MS_DAY);
    whatIsGoing(sim);
    const asked = Object.values(sim.universe.auditions)
      .find((one) => one.holder === at.holder && one.state === 'open' && sim.now <= one.closesAt);
    if (asked) return asked;
    at = shootingOnTheLot(
      sim, at.holder,
      Math.max(1, (at.to - at.from) / MS_WEEK),
      ASKING_AT + 2 + i,
    );
  }
  return undefined;
}

/** Sets every attribute on every person in the save to one flat number. */
function everybodyAt(sim: Simulation, base: number): void {
  for (const person of Object.values(sim.universe.people)) person.attributes = sheetOf(base);
}

/** Runs one whole audition, and reports every outcome it produced. */
function playItOut(
  sim: Simulation, audition: Audition, played: Record<string, number>, way: string, howFar = 'full',
): { why?: string; note?: string; toward?: number; off: number; fame: number; money: number } {
  const me = sim.universe.people[sim.universe.playerId]!;
  const going = run(sim, 'life.go_up', { auditionId: audition.id, way, played });
  expect(going.error, 'could not go up for it').toBeUndefined();
  if (going.at !== undefined) sim.advanceTo(going.at + MS_DAY);
  const live = sim.universe.auditions[audition.id]!;
  const note = live.note;
  if (live.state === 'noted') run(sim, 'life.take_note', { auditionId: audition.id, howFar });
  const after = sim.universe.auditions[audition.id]!;
  return {
    ...(after.why ? { why: after.why } : {}),
    ...(note ? { note: note.shade, toward: note.toward } : {}),
    off: howFarOff(readingOf(after.played), after.wants),
    fame: me.reputation.publicFame,
    money: sim.universe.accounts[me.primaryAccountId!]!.balance,
  };
}

// ---------------------------------------------------------------------------

/**
 * Puts a real engagement on the player, through the real path.
 *
 * `theyWantYou` is what a settled audition calls, so this asks it the same way
 * the engine does rather than writing a seat by hand.
 */
function castOnSomething(sim: Simulation, weeks = 6): Audition {
  const booking = shootingOnTheLot(sim, 'A Nordic Broadcaster', weeks);
  const audition: Audition = {
    id: sim.nextId('audition'),
    saveId: sim.universe.meta.id,
    bookingId: booking.id,
    holder: booking.holder,
    size: 'lead',
    feeCents: 1_000_00,
    from: booking.from,
    to: booking.to,
    closesAt: booking.from - SHUTS_AT * MS_WEEK,
    wants: AS_WRITTEN,
    state: 'over',
    why: 'cast',
  };
  sim.universe.auditions[audition.id] = audition;
  theyWantYou(sim, audition);
  return audition;
}

describe('being cast is time you no longer have', () => {
  it('lays the engagement on the calendar, a week at a time, and stops the clock', () => {
    const sim = world('engaged');
    const cast = castOnSomething(sim);
    const weeks = sim.universe.scheduled
      .filter((one) => one.kind === WORKING_KIND && one.refId === cast.id);

    // theyWantYou posted the fee, moved four reputation fields and called
    // sim.schedule exactly zero times, so a nine-week picture stopped the
    // player's clock for no time at all and a career was a sequence of bank
    // transfers. requiresPlayer had one write site in the whole engine.
    expect(weeks.length).toBeGreaterThan(0);
    expect(weeks.length)
      .toBe(Math.max(1, Math.round((cast.to - cast.from) / MS_WEEK)));
    expect(weeks.every((one) => one.requiresPlayer === true)).toBe(true);
  });

  it('has somebody who is on it, right through the middle of it', () => {
    const sim = world('engaged-mid');
    const cast = castOnSomething(sim);
    const mid = cast.from + Math.floor((cast.to - cast.from) / 2);
    expect(whatHasThem(sim, mid, mid + MS_DAY)?.what).toBe(cast.holder);
    // And free again once it is over.
    expect(whatHasThem(sim, cast.to + MS_WEEK, cast.to + 2 * MS_WEEK)).toBeUndefined();
  });

  it('is spoken for in the week before the first day, not only from it', () => {
    const sim = world('engaged-before');
    const cast = castOnSomething(sim);
    const before = cast.from - MS_DAY;
    expect(whatHasThem(sim, before, before + MS_DAY)?.what).toBe(cast.holder);
  });
});

describe('the room cannot be an exam the player passes by existing', () => {
  it('decides exactly the same thing with every attribute in the save at fifty', () => {
    // The whole file in one assertion. Forty-five of the 813 attributes are
    // named for this room and the player holds all of them at the ceiling, so
    // any line that read one would be a lookup returning a hundred. Two
    // identical worlds, one at the ceiling and one at the middle, must not
    // differ by a single outcome.
    const both = (base: number | undefined) => {
      const sim = world('flat-or-not');
      if (base !== undefined) everybodyAt(sim, base);
      const booking = shootingOnTheLot(sim, 'RÚV, a limited series');
      const audition = untilTheyAsk(sim, booking);
      if (!audition) return { asked: false };
      return {
        asked: true,
        wants: { ...audition.wants },
        fee: audition.feeCents,
        size: audition.size,
        ...playItOut(sim, audition, { warmth: 1, size: -1, pace: 2 }, 'room', 'full'),
      };
    };
    expect(both(undefined)).toEqual(both(50));
    expect(both(50)).toEqual(both(1));
  });

  it('reads no attribute anywhere in the file', () => {
    // The structural version of the same claim, so a future line that reaches
    // for the sheet is caught by grep rather than by luck.
    const whole = readFileSync(new URL('../src/engine/world/audition.ts', import.meta.url), 'utf8');
    // Comments stripped, because the file is allowed to explain at length why it
    // does not touch the sheet and the explanation has to name it to do that.
    const source = whole.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
    for (const forbidden of ['readOn(', 'rate(', '.attributes', 'overallRating', 'groupAverage']) {
      expect(source, `world/audition.ts reaches for ${forbidden}`).not.toContain(forbidden);
    }
  });
});

describe('the work comes from the stages, and from nowhere else', () => {
  it('finds the productions that booked, and not the family’s own', () => {
    const sim = world('shooting-here');
    const outside = shootingOnTheLot(sim, 'a Nordic broadcaster, a limited series');
    const ours = shootingOnTheLot(sim, 'Rivera Pictures, a feature');
    sim.universe.bookings[ours.id]!.companyId = 'company_00000h';
    const found = shootingHere(sim).map((one) => one.id);
    expect(found).toContain(outside.id);
    expect(found).not.toContain(ours.id);
  });

  it('asks nobody about anything until something is shooting', () => {
    const sim = world('quiet');
    whatIsGoing(sim);
    expect(goingNow(sim)).toHaveLength(0);
    expect(whereYourWorkStands(sim)).toMatch(/Nobody has asked you/);
  });

  it('asks only inside the weeks it is casting in', () => {
    const sim = world('window');
    const booking = shootingOnTheLot(sim, 'RÚV, a limited series');
    whatIsGoing(sim);
    expect(goingNow(sim)).toHaveLength(0);
    sim.advanceTo(booking.from - SHUTS_AT * MS_WEEK + 2 * MS_DAY);
    whatIsGoing(sim);
    expect(goingNow(sim), 'too late is too late').toHaveLength(0);
  });

  it('pays more for a longer job on a bigger stage, off the lot’s own rate', () => {
    const sim = world('fees');
    const short = shootingOnTheLot(sim, 'an Icelandic agency, a commercial', 1);
    const long = shootingOnTheLot(sim, 'an American studio, a feature', 14);
    expect(feeFor(long, 'lead')).toBeGreaterThan(feeFor(short, 'lead'));
    expect(feeFor(long, 'lead')).toBeGreaterThan(feeFor(long, 'day'));
  });
});

describe('being remembered is the ratchet, and a no counts', () => {
  it('starts cold, because nobody has heard of anybody', () => {
    const sim = world('cold');
    expect(remembersYou(sim, 'RÚV, a limited series')).toBeCloseTo(COLD, 6);
  });

  it('climbs with every reading, including the ones that ended in no', () => {
    // The research calls roster memory the main career ratchet and is explicit
    // that it pays out from a pass: a no in March is a booking in September
    // from the same office. So this must move on readings, not on parts won.
    const sim = world('remembered');
    const holder = 'RÚV, a limited series';
    const was = remembersYou(sim, holder);
    for (let i = 0; i < 3; i += 1) {
      const id = sim.nextId('audition');
      sim.universe.auditions[id] = {
        id, saveId: sim.universe.meta.id, bookingId: `b${i}`, holder, size: 'day',
        feeCents: 1_000_00, from: sim.now, to: sim.now + MS_WEEK, closesAt: sim.now,
        wants: {}, state: 'over', why: 'went-another-way',
      };
    }
    const now = remembersYou(sim, holder);
    expect(now).toBeCloseTo(was + 3 * REMEMBERED, 6);
    // And it is these people only. Being read by RÚV is nothing to anybody else.
    expect(remembersYou(sim, 'an American studio, a feature')).toBeCloseTo(COLD, 6);
  });
});

describe('a tape is a performance nobody tells you anything about', () => {
  it('comes back with a note from a room and with silence from a file', () => {
    const play = (way: string) => {
      const sim = world(`note-${way}`);
      const booking = shootingOnTheLot(sim, 'RÚV, a limited series');
      const audition = untilTheyAsk(sim, booking)!;
      // Played deliberately away from every shade they wanted, so there is
      // certainly something for a room to have an opinion about.
      const played = Object.fromEntries(
        SHADES.map((shade) => [shade.id, (audition.wants[shade.id] ?? 0) > 0 ? -FURTHEST : FURTHEST]),
      );
      return playItOut(sim, audition, played, way);
    };
    expect(play('room').note).toBeDefined();
    expect(play('tape').note).toBeUndefined();
  });

  it('costs a day against three, and the three are not a better performance', () => {
    const tape = WAYS.find((one) => one.id === 'tape')!;
    const room = WAYS.find((one) => one.id === 'room')!;
    expect(room.days).toBeGreaterThan(tape.days);
    expect(room.notes).toBe(true);
    expect(tape.notes).toBe(false);
    // Nothing on either row says one of them plays better, because the player
    // cannot play better. The difference is entirely what comes back.
    expect(Object.keys(tape)).not.toContain('quality');
  });

  it('calls the two kinds of no by their two different names', () => {
    expect(decideAudition({ off: 2.4, sawYou: true, free: true }, 0.99)).toBe('went-another-way');
    expect(decideAudition({ off: 2.4, sawYou: false, free: true }, 0.99)).toBe('not-in-the-room');
  });
});

describe('the note is on the thing that nearly worked', () => {
  it('names the shade the reading was closest on, and never one already right', () => {
    const wants = { warmth: 3, size: 0, pace: -3 };
    const note = theNote({ warmth: -2, size: 1, pace: 3 }, wants)!;
    expect(note.shade).toBe('size');
    expect(note.toward).toBe(-1);
    // A shade landed exactly gets no note. A room does not ask for a change to
    // the thing it has, and a note you cannot act on is a coin with prose.
    expect(theNote({ warmth: -2, size: 0, pace: 3 }, wants)!.shade).toBe('warmth');
    expect(theNote(wants as never, wants)).toBeUndefined();
  });

  it('lands exactly on what they wanted when it is taken all the way', () => {
    const wants = { warmth: 2, size: -1, pace: 3 };
    const played = { warmth: 1, size: -1, pace: 0 };
    const note = theNote(played, wants)!;
    const after = afterTheNote(played, wants, note, 'full');
    expect(after[note.shade]).toBe(wants[note.shade]);
  });

  it('spends the very thing that got you the second go when it is overcooked', () => {
    // The research's own sentence: over-taking loses the thing they liked
    // enough to ask you again. The note is given on the shade you had nearest
    // right, so going past it is the only way to make that shade worse.
    const wants = { warmth: 1, size: -3, pace: 0 };
    const played = { warmth: -1, size: 3, pace: 0 };
    const note = theNote(played, wants)!;
    const full = afterTheNote(played, wants, note, 'full');
    const over = afterTheNote(played, wants, note, 'over');
    const wasOff = Math.abs(played[note.shade] - (wants[note.shade] ?? 0));
    expect(Math.abs(full[note.shade] - (wants[note.shade] ?? 0))).toBeLessThan(wasOff);
    expect(Math.abs(over[note.shade] - (wants[note.shade] ?? 0)))
      .toBeGreaterThan(Math.abs(full[note.shade] - (wants[note.shade] ?? 0)));
  });

  it('reads halfway as halfway, and leaving it as leaving it', () => {
    const wants = { warmth: 0, size: 0, pace: 3 };
    const played = { warmth: 2, size: 2, pace: 0 };
    const note = theNote(played, wants)!;
    const off = (r: Record<string, number>) => Math.abs(r[note.shade]! - (wants[note.shade] ?? 0));
    expect(off(afterTheNote(played, wants, note, 'none'))).toBe(off(played));
    expect(off(afterTheNote(played, wants, note, 'half')))
      .toBeGreaterThan(off(afterTheNote(played, wants, note, 'full')));
  });

  it('gives every magnitude a different share and only one of them nothing', () => {
    expect(howFarById('none')!.share).toBe(0);
    expect(howFarById('full')!.share).toBe(1);
    expect(howFarById('over')!.share).toBeGreaterThan(1);
    expect(howFarById('half')!.share).toBeGreaterThan(0);
  });
});

describe('what you played is the whole of what decides it', () => {
  it('turns a near miss down more often than a hit, and a wide miss flat', () => {
    expect(decideAudition({ off: 0, sawYou: true, free: true }, 0.5)).toBe('cast');
    expect(decideAudition({ off: TOO_FAR + 0.1, sawYou: true, free: true }, 0)).toBe('wrong-for-it');
    const at = (off: number) => {
      let got = 0;
      for (let i = 0; i < 100; i += 1) {
        if (decideAudition({ off, sawYou: true, free: true }, i / 100) === 'cast') got += 1;
      }
      return got;
    };
    expect(at(CLOSE_ENOUGH)).toBeGreaterThan(at(CLOSE_ENOUGH + 1));
    expect(at(CLOSE_ENOUGH + 1)).toBeGreaterThan(at(TOO_FAR - 0.1));
    // Nobody is ever a certainty.
    expect(at(0) / 100).toBeCloseTo(AS_GOOD_AS_IT_GETS, 1);
  });

  it('refuses it outright when the dates are gone', () => {
    expect(decideAudition({ off: 0, sawYou: true, free: false }, 0)).toBe('dates');
  });

  it('measures how far off as the mean of the three, so one wrong idea is a third', () => {
    const wants = { warmth: 3, size: 3, pace: 3 };
    const oneWrong = howFarOff({ warmth: -3, size: 3, pace: 3 }, wants);
    const allWrong = howFarOff({ warmth: -3, size: -3, pace: -3 }, wants);
    // Being wrong has to cost something before the ratio between two kinds of
    // wrong means anything. A version of this test without the next line
    // passed with the distance hard-wired to nought.
    expect(oneWrong).toBeGreaterThan(0);
    expect(allWrong).toBeCloseTo(oneWrong * 3, 6);
    expect(allWrong).toBe(2 * FURTHEST);
    expect(howFarOff(wants as never, wants)).toBe(0);
    // And one step off is one step off, whichever shade it is on.
    for (const shade of SHADES) {
      const nudged = { ...wants, [shade.id]: wants[shade.id as keyof typeof wants] - 1 };
      expect(howFarOff(nudged, wants)).toBeCloseTo(1 / SHADES.length, 6);
    }
  });

  it('keeps a want inside the range anybody could play', () => {
    let n = 0;
    const wants = whatTheyWant(() => { n += 1; return ((n * 37) % 23) / 23; });
    for (const shade of SHADES) {
      expect(Math.abs(wants[shade.id]!)).toBeLessThanOrEqual(FURTHEST);
    }
    expect(readingOf({ warmth: 99, size: -99, pace: undefined })).toEqual({
      warmth: FURTHEST, size: -FURTHEST, pace: 0,
    });
    expect(readingOf(undefined)).toEqual(AS_WRITTEN);
  });
});

describe('the part is the first money that is yours', () => {
  it('pays it into your own account and writes the number onto you', () => {
    const sim = world('paid');
    const me = sim.universe.people[sim.universe.playerId]!;
    const booking = shootingOnTheLot(sim, 'an American studio, a feature', 12);
    const audition = untilTheyAsk(sim, booking)!;
    const before = sim.universe.accounts[me.primaryAccountId!]!.balance;
    // Play it exactly right, so the only thing left is the draw.
    const out = playItOut(sim, audition, audition.wants, 'room', 'none');
    if (out.why !== 'cast') return;
    const room = WAYS.find((one) => one.id === 'room')!;
    expect(out.money).toBe(before - room.costsCents + audition.feeCents);
    expect(me.quotes?.some((q) => q.cents === audition.feeCents)).toBe(true);
    expect(me.reputation.publicFame).toBeGreaterThan(0);
    expect(me.reputation.industryDemand).toBeGreaterThan(0);
  });

  it('moves a fame that nothing else in the build has ever moved', () => {
    // The player boots at nought on every one of these and no other system
    // writes them. Being in something other people watch is the only thing
    // that ever has.
    const sim = world('fame');
    const me = sim.universe.people[sim.universe.playerId]!;
    expect(me.reputation.publicFame).toBe(0);
    let got = false;
    for (let i = 0; i < 12 && !got; i += 1) {
      const booking = shootingOnTheLot(sim, `a Nordic broadcaster, a limited series ${i}`, 9, 8 + i * 12);
      const audition = untilTheyAsk(sim, booking);
      if (!audition) continue;
      const out = playItOut(sim, audition, audition.wants, 'room', 'none');
      if (out.why === 'cast') got = true;
    }
    expect(got, 'twelve goes at it should land one').toBe(true);
    expect(me.reputation.publicFame).toBeGreaterThan(0);
  });
});

describe('a part you took is a part you cannot take again', () => {
  it('holds the dates against everything else', () => {
    const sim = world('held');
    const booking = shootingOnTheLot(sim, 'RÚV, a limited series', 8);
    const audition = untilTheyAsk(sim, booking)!;
    expect(freeAcross(sim, audition.from, audition.to)).toBe(true);
    audition.state = 'over';
    audition.why = 'cast';
    expect(freeAcross(sim, audition.from, audition.to)).toBe(false);
    expect(freeAcross(sim, audition.to + 4 * MS_WEEK, audition.to + 8 * MS_WEEK)).toBe(true);
  });

  it('refuses a reading for dates you have already sold', () => {
    const sim = world('clash');
    const first = shootingOnTheLot(sim, 'RÚV, a limited series', 8);
    const audition = untilTheyAsk(sim, first)!;
    const second = shootingOnTheLot(sim, 'a Nordic broadcaster, a limited series', 8, 10);
    const clash = untilTheyAsk(sim, second)!;
    // The first one landed, and it runs across the second one's shoot. Built
    // here rather than left to the draw, because the claim is about the dates.
    audition.state = 'over';
    audition.why = 'cast';
    audition.from = clash.from - MS_WEEK;
    audition.to = clash.to + MS_WEEK;
    const done = run(sim, 'life.go_up', { auditionId: clash.id, way: 'tape', played: {} });
    expect(done.ok).toBe(false);
    expect(done.error).toMatch(/working on those dates/);
  });
});

describe('the commands refuse what they should', () => {
  it('will not go up twice, or late, or in a way nobody uses', () => {
    const sim = world('refusals');
    const booking = shootingOnTheLot(sim, 'RÚV, a limited series');
    const audition = untilTheyAsk(sim, booking)!;
    expect(run(sim, 'life.go_up', { auditionId: audition.id, way: 'interpretive dance', played: {} }).ok)
      .toBe(false);
    expect(run(sim, 'life.take_note', { auditionId: audition.id, howFar: 'full' }).ok).toBe(false);
    expect(run(sim, 'life.go_up', { auditionId: audition.id, way: 'tape', played: {} }).ok).toBe(true);
    expect(run(sim, 'life.go_up', { auditionId: audition.id, way: 'tape', played: {} }).ok).toBe(false);
  });

  it('says what came of everything, once anything has', () => {
    const sim = world('standing');
    const booking = shootingOnTheLot(sim, 'RÚV, a limited series');
    const audition = untilTheyAsk(sim, booking)!;
    const before = alreadyUpFor(sim).length;
    playItOut(sim, audition, { warmth: 1, size: 1, pace: 1 }, 'tape');
    expect(alreadyUpFor(sim).length).toBe(before + 1);
    expect(whereYourWorkStands(sim)).toMatch(/reading/);
    expect(sizeById(audition.size)).toBeDefined();
  });
});

describe('fame is the half of the ratchet that travels', () => {
  it('gets you thought of by people you have never read for', () => {
    // Without this the whole ratchet was a cul-de-sac: being cast moved a fame
    // that nothing on this side read, so a household name was a stranger to
    // anybody they had not personally sat in front of.
    const sim = world('famous');
    const me = sim.universe.people[sim.universe.playerId]!;
    const nobody = 'a Nordic broadcaster, a limited series';
    const cold = remembersYou(sim, nobody);
    me.reputation.publicFame = 100;
    const known = remembersYou(sim, nobody);
    expect(known).toBeGreaterThan(cold);
    expect(known - cold).toBeCloseTo(KNOWN_OF, 6);
  });

  it('is worth more on its own than any amount of history with one office', () => {
    // Which is the right way round. Being read twice by RÚV is worth a great
    // deal to RÚV and nothing at all to anybody else.
    expect(KNOWN_OF).toBeGreaterThan(REMEMBERED * 2);
  });

  it('never quite reaches everybody, because somebody always has their own idea', () => {
    const sim = world('household');
    const me = sim.universe.people[sim.universe.playerId]!;
    me.reputation.publicFame = 100;
    expect(remembersYou(sim, 'an American studio, a feature')).toBeLessThan(1);
  });

  it('rises with being in things, and so does whether anybody is glad about it', () => {
    const sim = world('liked');
    const me = sim.universe.people[sim.universe.playerId]!;
    const was = { ...me.reputation };
    const booking = shootingOnTheLot(sim, 'RÚV, a limited series', 9);
    const audition = untilTheyAsk(sim, booking)!;
    theyWantYou(sim, audition);
    expect(me.reputation.publicFame).toBeGreaterThan(was.publicFame);
    expect(me.reputation.audienceAppeal).toBeGreaterThan(was.audienceAppeal);
    expect(me.reputation.industryDemand).toBeGreaterThan(was.industryDemand);
    // A lead is remembered and a day player is barely noticed.
    const small = { ...audition, size: 'day' };
    const before = me.reputation.audienceAppeal;
    theyWantYou(sim, small);
    expect(me.reputation.audienceAppeal - before)
      .toBeLessThan(me.reputation.publicFame - was.publicFame);
  });
});
