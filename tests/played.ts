/**
 * A save somebody actually plays.
 *
 * The most expensive recurring mistake in this project, three times over in one
 * run of work: the fifth stage's value, `docs/UNBITTEN.md`'s own reading of the
 * personality axes, and the creation screen's count of them. Every one was
 * measured on a save nobody plays, every one came back confident and wrong, and
 * every one flipped the moment somebody went up for a part.
 *
 * The reason is structural rather than careless. An idle save settles into a
 * fixed point — `liveTheUnattendedDay` restores to the same ceiling and the
 * same floor every day, so by day thirty most dials are constants and most
 * levers move nothing. Anything measured there is measured against a world with
 * the interesting parts switched off.
 *
 * So this is the instrument, kept in one place rather than rewritten by hand
 * each time. It plays the game the way the game is meant to be played: goes up
 * for every part the dates allow, answers every note, and lets being cast take
 * the weeks it takes.
 */

import type { Simulation } from '@/engine';
import { MS_WEEK } from '@/engine/world/lot';

export interface HowTheyPlay {
  /** Called at the end of every week, for whatever else is being measured. */
  eachWeek?: (sim: Simulation, week: number) => void;
  /**
   * Lets the career run on even though a scheduled system is failing.
   *
   * Only for a measurement whose whole point is a broken handler. Everything
   * else wants the throw, for the reason in `THE WEEK A SYSTEM STOPPED` below.
   */
  evenIfSomethingBroke?: boolean;
  /**
   * Whether the roof is kept up. On unless a measurement is about not keeping it.
   *
   * It defaults on because a player who is told the condition only moves one way,
   * and who has EUR 1.2m in the bank, keeps the house — and because the shape of
   * a career measured without it is not a worse career, it is a different game.
   */
  letTheHouseGo?: boolean;
}

/**
 * What a life came to.
 *
 * This counted asks, readings, parts and clashes, all of which came from the
 * audition system. That system went with the production system, and rather than
 * leave four counters reading nought — which is the exact shape of a measurement
 * that looks like a result — it reports the weeks it actually ran. When work comes
 * back, what work came to goes here.
 */
export interface WhatHappened {
  /** Weeks the career ran for. */
  weeks: number;
}

export function playACareer(sim: Simulation, years: number, how: HowTheyPlay = {}): WhatHappened {

  for (let week = 1; week <= years * 52; week += 1) {
    // Two hours a week keeping in shape, taken out of the week rather than added
    // to it, and this is not a detail. Training advances the clock, so calling it
    // after a full week made every week a week and two hours: over twenty-five
    // years the schedule drifted a hundred and eight days, the weekly tick fired
    // fewer times, and the number of parts the player was asked about fell from
    // thirty-one to fifteen. An instrument that changes the thing it measures is
    // the whole reason this file exists.
    const endOfWeek = sim.now + MS_WEEK;
    sim.execute({ kind: 'life.train', payload: { hours: 2 } });
    // And keeping the roof up, which is the other lever a player has on their own
    // body and which this loop did not pull for the whole of its life.
    //
    // Measured before it did: the house went 100 → 34 by year fifteen and 0 by
    // year twenty-four, and everything downstream of a night's sleep went with
    // it. Body condition to 0, energy pinned at 0, stress at 90, sleep debt at
    // 60, morale at 0, readiness at 11 — and once energy is under
    // `TOO_SPENT_TO_TRAIN` the training above refuses every week, so fitness
    // ratcheted from 98 at year fifteen to 0 at year twenty-five with nothing
    // able to put it back. Every late-career figure this instrument has ever
    // reported was measured on a character in a derelict house with EUR 1.2m in
    // the bank, which is not a player and is not the game either.
    //
    // `haveTheWorkDone` charges by the point and refuses when there is nothing to
    // do, so calling it every week is the cheap end of keeping it: it does
    // nothing most weeks and a small amount of work often rather than a
    // restoration once. That is also the behavior a screen that says "left alone
    // it only moves one way" is asking for.
    if (!how.letTheHouseGo) sim.execute({ kind: 'life.upkeep', payload: {} });
    sim.advanceTo(endOfWeek);
    // Which is a thing a played career now contains and an autopilot one did not.
    //
    // This loop answered auditions and did nothing else with the body, so every
    // dial the player has a command for read as a dial nothing moves — which was
    // true of the instrument rather than of the game. `life.train` is the second
    // direction fitness never had, and two hours a week is what it takes to stay
    // ahead of the decay once a body stops being twenty. It refuses on an empty
    // tank and at the age ceiling, and both refusals are ordinary here.
    // THE WEEK A SYSTEM STOPPED.
    //
    // A scheduled handler that throws is caught, marked missed, and left as a
    // notification — the career goes on and every total it reports still looks
    // reasonable. That is how a measurement once "proved" a causal chain from a
    // mutation that threw a ReferenceError on its first line every single day:
    // the daily wellbeing model never ran, fitness read its seed of fifty
    // because it was never decayed, and the frozen number was mistaken for the
    // effect somebody was hoping for. `npx vite-node` does not typecheck, so
    // nothing else was going to catch it.
    //
    // So the instrument refuses to hand back numbers from a world where a
    // system stopped. It is the cheapest possible guard and it is here because
    // the expensive version of this lesson has already been paid for.
    //
    // Read off `universe.engineFailures`, which the kernel writes on the
    // throwing path and only there. Not off `AdvanceResult.missed`, because an
    // item is also marked missed when its kind simply has no handler — an
    // ordinary thing for a save written by another build.
    //
    // This used to match on a notification's title, because a scheduled handler
    // that threw was announced and never recorded: the guard had to read the
    // announcement since there was nothing else to read. The kernel records it
    // now, so this asks the log rather than matching a string that a rewording
    // would have broken silently.
    how.eachWeek?.(sim, week);
  }

  const broke = sim.universe.engineFailures;
  if (broke.length > 0 && how.evenIfSomethingBroke !== true) {
    const said = [...new Set(broke.map((one) => one.error))].slice(0, 5).map((why) => `  ${why}`).join('\n');
    throw new Error(
      `A scheduled system failed ${broke.length} time${broke.length === 1 ? '' : 's'} during this `
      + `career, so these numbers describe a world where part of the engine stopped `
      + `running:\n${said}\n`
      + `Fix it, or pass evenIfSomethingBroke if a broken handler is what is being measured.`,
    );
  }

  return { weeks: years * 52 };
}

// ---------------------------------------------------------------------------
// The other half of the game
// ---------------------------------------------------------------------------

/** The stages a picture sits in before anybody has committed money to it. */
/** The most this producer will put into one picture. */
