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
  freeAcross, goingNow, heardItRight, howFarOff, readingOf, remembersYou, shootingHere, theNote,
  whatIsGoing, theyWantYou, whatTheyWant, whereYourWorkStands, WORKING_KIND, believedOf,
  sizeCasting, readFor, ignoredBy,
} from '@/engine/world/audition';
import { whatHasThem } from '@/engine/world/diary';
import { applySleep, readiness } from '@/engine/systems/life';
import {
  AS_WRITTEN, A_WORKING_WEEK, CLOSE_ENOUGH, COLD, FURTHEST, HOW_FAR, KNOWN_OF, MISREAD_THE_ROOM,
  HELD_AGAINST_YOU_YEARS, IGNORED, REMEMBERED, SHADES, TOO_FAR, WAYS, WHAT_THEY_OFFER,
  type Reading,
} from '@/engine/content/audition';
import { SIZES, sizeById } from '@/engine/content/casting';

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
function castOnSomething(sim: Simulation, weeks = 6, inWeeks = 8): Audition {
  const booking = shootingOnTheLot(sim, 'A Nordic Broadcaster', weeks, inWeeks);
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

describe('what an office thinks you are', () => {
  const spread = (weeks: number, believed: number): Record<string, number> => {
    const out: Record<string, number> = {};
    for (let i = 0; i < 400; i += 1) {
      const id = sizeCasting(weeks, believed, i / 400);
      out[id] = (out[id] ?? 0) + 1;
    }
    return out;
  };

  it('offers a stranger nothing but the bottom of the call sheet', () => {
    // The defect this replaces: the only thing deciding size was how long the
    // shoot was, and at nine weeks or more it returned the first row of SIZES
    // for every roll there is. The lot mostly books long, so the first job of
    // every career was a lead — which is the wrong career, and it left one of
    // the four authored size rows unreachable.
    const cold = spread(9, 0);
    expect(Object.keys(cold)).toEqual(['day']);
    const known = spread(9, 1);
    expect(Object.keys(known).sort()).toEqual(['day', 'guest', 'lead', 'support']);
  });

  it('keeps a lead out of a job that has no lead in it, however well you are known', () => {
    expect(spread(1, 1).lead).toBeUndefined();
    expect(spread(9, 1).lead).toBeGreaterThan(0);
  });

  it('leaves every authored size reachable', () => {
    const every = new Set<string>();
    for (const weeks of [1, 3, 6, 9, 14]) {
      for (const believed of [0, 0.3, 0.6, 1]) {
        for (let i = 0; i < 40; i += 1) every.add(sizeCasting(weeks, believed, i / 40));
      }
    }
    expect([...every].sort()).toEqual(SIZES.map((one) => one.id).sort());
  });

  it('is what these people have seen, and not what anybody else has', () => {
    const sim = world('per-office');
    const booking = shootingOnTheLot(sim, 'One Office');
    for (let i = 0; i < WHAT_THEY_OFFER.seenEnough; i += 1) {
      sim.universe.auditions[`a${i}`] = {
        id: `a${i}`, saveId: sim.universe.meta.id, bookingId: booking.id, holder: 'One Office',
        size: 'day', feeCents: 1, from: sim.now, to: sim.now, closesAt: sim.now,
        wants: AS_WRITTEN, state: 'over', why: 'went-another-way',
      };
    }
    // Including the ones that ended in no, which is the point: being watched is
    // what teaches a room, whatever it decided afterwards.
    expect(believedOf(sim, 'One Office')).toBe(1);
    expect(believedOf(sim, 'Another Office')).toBe(0);
  });

  it('actually asks the office what it thinks, when a part comes up', () => {
    // Both ends of this were tested and the join between them was not, so the
    // call site could hand `sizeCasting` a constant and every test still passed.
    // One office's first offer is not enough to catch that — with the belief
    // ignored, the bottom of the list is still one of the outcomes a roll can
    // land on. Every office's first offer is, because a first offer is by
    // definition one from people who have never seen anybody.
    const sim = world('first-offers');
    const firsts = new Map<string, string>();
    for (let i = 0; i < 900; i += 1) {
      sim.advanceTo(sim.now + 4 * MS_DAY);
      for (const one of Object.values(sim.universe.auditions)) {
        if (!firsts.has(one.holder)) firsts.set(one.holder, one.size);
      }
    }
    expect(firsts.size, 'too few offices asked to prove anything').toBeGreaterThan(2);
    expect([...new Set(firsts.values())]).toEqual([SIZES[SIZES.length - 1]!.id]);
  });

  it('lets a reputation stand in for some of it and never for all of it', () => {
    const sim = world('famous');
    const me = sim.universe.people[sim.universe.playerId]!;
    me.reputation.publicFame = 0;
    const unknown = believedOf(sim, 'A Stranger');
    me.reputation.publicFame = 100;
    const famous = believedOf(sim, 'A Stranger');
    expect(famous).toBeGreaterThan(unknown);
    // An office trusts what it has watched over what it has heard, so somebody
    // at the top of the trade is still offered a day part by strangers.
    expect(famous).toBeLessThan(1);
  });
});

describe('what a week of it takes', () => {
  /** Runs the clock on and hands back readiness at each mark. */
  const track = (sim: Simulation, marks: number[]): number[] => {
    const out: number[] = [];
    for (const weeks of marks) {
      sim.advanceTo(sim.now + weeks * MS_WEEK);
      out.push(Math.round(readiness(sim.universe.people[sim.universe.playerId]!)));
    }
    return out;
  };

  it('moves a model that was a constant for five years', () => {
    const sim = world('takes');
    sim.advanceTo(sim.now + 60 * MS_DAY);
    const settled = Math.round(readiness(sim.universe.people[sim.universe.playerId]!));

    // Measured before any of this existed: seven of the nine wellbeing dials
    // were constants by day thirty and eight by day three hundred and sixty
    // five, and readiness sat on one number from the first month to the fifth
    // year. The cause was not the arithmetic — it was that the autopilot
    // restores to the same ceiling every day and no day had ever been different
    // from any other. A week on a picture is the first thing that makes one.
    castOnSomething(sim, 12);
    const through = track(sim, [2, 6, 12]);
    expect(Math.min(...through), 'work took nothing out of anybody').toBeLessThan(settled);

    // And it comes back, so it is a cost rather than a ruin.
    const after = track(sim, [8])[0]!;
    expect(after).toBeGreaterThan(Math.min(...through));
  });

  it('gives an ordinary night early on and a short one at the end', () => {
    const debtOver = (seed: string, weeks: number, skip: number, across: number): number => {
      const sim = world(seed);
      sim.advanceTo(sim.now + 60 * MS_DAY);
      if (weeks > 0) castOnSomething(sim, weeks);
      sim.advanceTo(sim.now + skip * MS_WEEK);
      const before = sim.universe.people[sim.universe.playerId]!.wellbeing.sleepDebt;
      sim.advanceTo(sim.now + across * MS_WEEK);
      return sim.universe.people[sim.universe.playerId]!.wellbeing.sleepDebt - before;
    };

    // Week one of anything is an ordinary week and the last week of a long one
    // is not. A flat working penalty makes both of them the end of a shoot,
    // which is the same fixed point moved somewhere else — and it makes a short
    // job cost as much per week as a marathon, for no reason anybody could name.
    // shootingOnTheLot puts the first day eight weeks out, so the marks have to
    // clear that before they are inside the job at all. Sampling at one week and
    // at ten was sampling before it started and two weeks in — both of them the
    // beginning, which is why an earlier version of this passed happily with the
    // deepening torn out.
    const idle = debtOver('nights-idle', 0, 9, 2);
    const early = debtOver('nights-early', 14, 9, 2);
    const late = debtOver('nights-late', 14, 19, 2);
    expect(early, 'the first weeks of a long job were already the end of one')
      .toBeLessThan(late);
    expect(early - idle, 'week one of a shoot was harder than a week of nothing')
      .toBeLessThan(late - idle);
  });

  it('leaves a debt behind that a night does not undo', () => {
    const sim = world('clears');
    sim.advanceTo(sim.now + 60 * MS_DAY);
    const me = sim.universe.people[sim.universe.playerId]!;
    me.wellbeing.sleepDebt = 50;
    // Measured rather than reckoned. An earlier version of this capped how fast
    // a night could clear, on an arithmetic guess that the model cleared twelve
    // a night; it clears about two and a half net, so the cap never once bound
    // and was a declared number deciding nothing. What is true is what this
    // holds: a real debt is still most of a real debt a week later.
    sim.advanceTo(sim.now + 7 * MS_DAY);
    expect(me.wellbeing.sleepDebt).toBeGreaterThan(25);
    expect(me.wellbeing.sleepDebt).toBeLessThan(50);
  });

  it('puts back less of a night when there is a debt behind it', () => {
    // Energy had no memory: a night returned about ninety points whatever the
    // last three months had been, so the only dial that carried anything was
    // the debt and it barely reaches readiness. The drain side of this coupling
    // was already declared and was measured dead; this is the half that makes
    // the model remember.
    const nightOn = (debt: number): number => {
      const sim = world(`night-${debt}`);
      const me = sim.universe.people[sim.universe.playerId]!;
      me.wellbeing.sleepDebt = debt;
      me.wellbeing.energy = 20;
      applySleep(me, 8, 0.9, sim.now);
      return me.wellbeing.energy - 20;
    };
    expect(nightOn(30)).toBeLessThan(nightOn(0));
    expect(nightOn(30)).toBeGreaterThan(0);
  });

  it('starts a job tired where the last one left off, not from nought', () => {
    const debtAcross = (rested: boolean): number => {
      const sim = world(`carry-${rested}`);
      sim.advanceTo(sim.now + 60 * MS_DAY);
      if (!rested) {
        const first = castOnSomething(sim, 12);
        sim.advanceTo(first.to + MS_DAY);
      }
      const next = castOnSomething(sim, 12, 1);
      sim.advanceTo(next.from);
      const me = sim.universe.people[sim.universe.playerId]!;
      const before = me.wellbeing.sleepDebt;
      // The first fortnight of it, which on its own terms is the easy part.
      sim.advanceTo(sim.now + 2 * MS_WEEK);
      return me.wellbeing.sleepDebt - before;
    };
    // How far into this job today is resets with every engagement, so on its own
    // it hands somebody who finished a twelve-weeker last week a run of ordinary
    // nights while they are still carrying it. The penalty is the worse of how
    // deep into this one and how worn they already were.
    expect(debtAcross(false), 'the second job started as if the first had not happened')
      .toBeGreaterThan(debtAcross(true));
  });

  it('makes the size of a gap between jobs decide something', () => {
    const afterTwo = (gapDays: number) => {
      const sim = world('gap');
      sim.advanceTo(sim.now + 60 * MS_DAY);
      const first = castOnSomething(sim, 12);
      sim.advanceTo(first.to + MS_DAY);
      const second = castOnSomething(sim, 12, gapDays / 7);
      sim.advanceTo(second.from);
      const ready = readiness(sim.universe.people[sim.universe.playerId]!);
      sim.advanceTo(second.to + MS_WEEK);
      return { ready, relied: sim.universe.people[sim.universe.playerId]!.reputation.reliability };
    };

    // This is what did not bite when the cost was first built. Energy had no
    // memory — a night put back about ninety points whatever the last three
    // months had been — so one week off and twelve weeks off left a career in
    // exactly the same place, and the only lever a tired player had moved
    // nothing at all.
    const straightBackIn = afterTwo(7);
    const aFortnight = afterTwo(21);
    expect(straightBackIn.ready, 'a week off restored as much as three did')
      .toBeLessThan(aFortnight.ready);
    expect(straightBackIn.relied, 'going straight back in cost nothing')
      .toBeLessThan(aFortnight.relied);
    // And by enough to be a decision rather than a rounding difference. With
    // neither half of this built the two runs came out identical; with only the
    // weaker half they differed by four points, which nobody would ever feel.
    expect(aFortnight.relied - straightBackIn.relied).toBeGreaterThan(20);
  });

  it('costs how reliable people found you, and never how good you were', () => {
    const sim = world('relied');
    const me = sim.universe.people[sim.universe.playerId]!;
    sim.advanceTo(sim.now + 60 * MS_DAY);
    const cast = castOnSomething(sim, 2);
    expect(A_WORKING_WEEK.spentAt).toBeGreaterThan(0);
    // Up to the morning it starts, then spend them, then let the first week run.
    sim.advanceTo(cast.from - MS_DAY);
    me.wellbeing.energy = 1;
    me.wellbeing.stress = 95;
    me.wellbeing.sleepDebt = 50;
    const was = me.reputation.reliability;
    sim.advanceTo(cast.from + MS_DAY);
    expect(me.reputation.reliability).toBeLessThan(was);
  });

  it('makes an office think twice about somebody nobody could rely on', () => {
    const sim = world('asks');
    const me = sim.universe.people[sim.universe.playerId]!;
    me.reputation.reliability = 100;
    const trusted = remembersYou(sim, 'An Office');
    me.reputation.reliability = 0;
    const not = remembersYou(sim, 'An Office');
    expect(not).toBeLessThan(trusted);
  });
});

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

describe('the note is on the thing that is most wrong', () => {
  it('names the shade the reading was farthest off, and never one already right', () => {
    const wants = { warmth: 3, size: 0, pace: -3 };
    const note = theNote({ warmth: -2, size: 1, pace: 3 }, wants)!;
    // Warmth is five out, size one, pace six. The note is about the six.
    expect(note.shade).toBe('pace');
    expect(note.toward).toBe(-1);
    // A shade landed exactly gets no note, and with nothing wrong there is no
    // note at all. A note you cannot act on is a coin with prose.
    expect(theNote({ warmth: 3, size: 2, pace: -3 }, wants)!.shade).toBe('size');
    expect(theNote(wants as never, wants)).toBeUndefined();
  });

  it('asks about a spread of distances rather than always the smallest one', () => {
    // The reason this moved off the closest shade. On the closest rule the note
    // asked for a single step in 57% of every reachable state and one or two in
    // 83% — so how far to go had the same answer nearly every time, whatever
    // the magnitudes were. Sampled here rather than enumerated, because the
    // full sweep is 117,306 states and this is a unit test.
    const seen = new Map<number, number>();
    let seed = 12345;
    const rng = (): number => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    for (let i = 0; i < 4000; i += 1) {
      const draw = (): number => Math.round((rng() * 2 - 1) * FURTHEST);
      const played: Reading = { warmth: draw(), size: draw(), pace: draw() };
      const wants = { warmth: draw(), size: draw(), pace: draw() };
      const note = theNote(played, wants);
      if (!note) continue;
      const gap = Math.abs(played[note.shade] - (wants[note.shade] ?? 0));
      seen.set(gap, (seen.get(gap) ?? 0) + 1);
    }
    const total = [...seen.values()].reduce((n, one) => n + one, 0);
    // No single distance is most of the questions, and the big ones happen.
    for (const [, count] of seen) expect(count / total).toBeLessThan(0.4);
    expect(seen.get(2 * FURTHEST) ?? 0).toBeGreaterThan(0);
  });

  it('moves the number of steps the player chose, and never the hidden distance', () => {
    // The whole of the old fault in one assertion. The magnitude used to be a
    // SHARE of the gap the note was asking for, and the gap is the hidden
    // truth — so "all the way" landed on the want exactly, in every state that
    // has ever existed, by arithmetic rather than by judgement.
    const wants = { warmth: 1, size: -3, pace: 0 };
    const played = { warmth: -1, size: 3, pace: 0 };
    const note = theNote(played, wants)!;
    for (const one of HOW_FAR) {
      const after = afterTheNote(played, note, one.id);
      expect(Math.abs(after[note.shade] - played[note.shade]), one.id).toBe(one.steps);
    }
    // And going as far as it goes is not a synonym for landing on it. On this
    // reading the gap is six and the biggest move anybody has is three.
    const far = afterTheNote(played, note, 'far');
    expect(far[note.shade]).not.toBe(wants[note.shade]);
  });

  it('overshoots when the move is bigger than the gap, which is how over-taking happens now', () => {
    // Over-taking used to be a button that always overshot by the same share.
    // It is an outcome now: ask for one step of change, give three, and you
    // have gone past them — which is what over-taking is.
    const wants = { warmth: 0, size: 0, pace: 1 };
    const played = { warmth: 0, size: 0, pace: 0 };
    const note = theNote(played, wants)!;
    expect(note.shade).toBe('pace');
    const off = (r: Reading) => Math.abs(r[note.shade] - (wants[note.shade] ?? 0));
    expect(off(afterTheNote(played, note, 'touch'))).toBe(0);
    expect(off(afterTheNote(played, note, 'far'))).toBe(2);
  });

  it('gives every magnitude a different number of steps and only one of them none', () => {
    const steps = HOW_FAR.map((one) => one.steps);
    expect(steps).toEqual([...new Set(steps)]);
    expect(steps.filter((n) => n === 0)).toHaveLength(1);
    expect(Math.max(...steps)).toBe(FURTHEST);
  });

  it('turns the move the wrong way when the room was misread, and by as much as was committed', () => {
    // The thing that makes how far to go a decision. A big swing is a big
    // mistake when the note was not taken in, and a touch is barely one.
    const wants = { warmth: 0, size: 0, pace: 3 };
    const played = { warmth: 0, size: 0, pace: 0 };
    const note = theNote(played, wants)!;
    for (const one of HOW_FAR) {
      const heard = afterTheNote(played, note, one.id, 1, 0);
      const missed = afterTheNote(played, note, one.id, 0, 0.5);
      expect(heard[note.shade], one.id).toBe(one.steps);
      // `0` rather than `-one.steps`, because negating zero gives -0 and the
      // matcher is Object.is. Leaving it wrong reads as a bug in the engine.
      expect(missed[note.shade], one.id).toBe(one.steps === 0 ? 0 : -one.steps);
    }
  });

  it('costs a rested actor nothing at all, and that is the point of the dial', () => {
    const sim = quickSave({}, 'heard-rested');
    const me = sim.universe.people[sim.universe.playerId]!;
    // Nothing in the room reads the sheet. What it reads is the state of the
    // person, and at the top of it there is no chance of mishearing anybody.
    me.wellbeing.energy = 100;
    me.wellbeing.stress = 0;
    me.wellbeing.sleepDebt = 0;
    const fresh = heardItRight(sim);
    me.wellbeing.energy = 0;
    me.wellbeing.stress = 100;
    me.wellbeing.sleepDebt = 40;
    const spent = heardItRight(sim);
    expect(fresh).toBeGreaterThan(spent);
    expect(fresh).toBeLessThanOrEqual(1);
    expect(spent).toBeGreaterThanOrEqual(1 - MISREAD_THE_ROOM);
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

/**
 * Being asked and not answering.
 *
 * `whatIsGoing` has always written a date the room shuts on and said so in the
 * notification. Nothing read it, so the list a player opened was parts cast
 * years ago and the one thing they could always do for free was ignore every
 * part they were ever offered.
 */
describe('an ask that is never answered', () => {
  it('closes when the date to be seen by goes past, rather than sitting open forever', () => {
    const sim = quickSave({}, 'shuts');
    sim.advanceTo(sim.now + 25 * 365 * MS_DAY);
    const asks = Object.values(sim.universe.auditions);
    expect(asks.length, 'the save has to produce some asks for this to mean anything')
      .toBeGreaterThan(5);
    // The measurement this exists for: on a save nobody plays, sixty-six asks
    // across twenty-five years were all still open and the oldest had shut
    // twelve years earlier.
    const stale = asks.filter((one) => one.state === 'open' && sim.now > one.closesAt);
    expect(stale, 'an ask past its own closing date is still open').toHaveLength(0);
    for (const one of asks.filter((x) => x.why === 'never-answered')) {
      expect(one.state).toBe('over');
      expect(one.closesAt).toBeLessThan(sim.now);
    }
  });

  it('does not let being ignored read as having been seen', () => {
    const sim = quickSave({}, 'not-seen');
    sim.advanceTo(sim.now + 10 * 365 * MS_DAY);
    for (const holder of [...new Set(Object.values(sim.universe.auditions).map((o) => o.holder))]) {
      // `readFor` is what the ratchet counts, and it must count readings. The
      // day asks started closing, an unanswered one would otherwise have made
      // ignoring somebody the thing that made them think of you.
      expect(readFor(sim, holder).every((one) => one.why !== 'never-answered')).toBe(true);
    }
  });

  it('makes an office that is ignored ask less often, and lets it come back', () => {
    const sim = quickSave({}, 'colder');
    const holder = 'somebody casting';
    const ask = (closesAt: number, why: string): void => {
      const id = sim.nextId('audition');
      sim.universe.auditions[id] = {
        id, saveId: sim.universe.meta.id, bookingId: 'b', holder, size: 'guest', feeCents: 0,
        from: closesAt, to: closesAt, closesAt, wants: { warmth: 0, size: 0, pace: 0 },
        state: 'over', why,
      };
    };
    const cold = remembersYou(sim, holder);
    ask(sim.now - 30 * MS_DAY, 'never-answered');
    const once = remembersYou(sim, holder);
    ask(sim.now - 60 * MS_DAY, 'never-answered');
    const twice = remembersYou(sim, holder);
    expect(once).toBeLessThan(cold);
    expect(twice).toBeLessThan(once);
    expect(IGNORED, 'not turning up costs more than turning up earns').toBeGreaterThan(REMEMBERED);

    // And there is a way back, which is the whole reason it is a window. The
    // first version counted every one ever, so two of these shut a holder for
    // the rest of the save — a countdown rather than a consequence, and the
    // same fault this build refuses on the family's patience.
    const old = quickSave({}, 'colder-later');
    const oldId = old.nextId('audition');
    const longAgo = old.now - (HELD_AGAINST_YOU_YEARS + 1) * 365 * MS_DAY;
    old.universe.auditions[oldId] = {
      id: oldId, saveId: old.universe.meta.id, bookingId: 'b', holder, size: 'guest', feeCents: 0,
      from: longAgo, to: longAgo, closesAt: longAgo, wants: { warmth: 0, size: 0, pace: 0 },
      state: 'over', why: 'never-answered',
    };
    expect(ignoredBy(old, holder), 'held against you forever').toBe(0);
    expect(remembersYou(old, holder)).toBe(cold);
  });

  it('asks a player who never answers about half as often over a career', () => {
    // The consequence, measured end to end rather than asserted on a constant.
    // Twenty-five years of a world running with nobody answering anything.
    const run = (seed: string): number => {
      const sim = quickSave({}, seed);
      sim.advanceTo(sim.now + 25 * 365 * MS_DAY);
      return Object.keys(sim.universe.auditions).length;
    };
    for (const seed of ['e1', 'e2', 'e3']) {
      const asked = run(seed);
      // Fewer than a world that forgives everything, and not nothing: an office
      // that has forgotten the last one asks again.
      expect(asked, seed).toBeGreaterThan(10);
      expect(asked, seed).toBeLessThan(55);
    }
  });
});
