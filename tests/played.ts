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
import { SHADES, type Reading } from '@/engine/content/audition';
import { freeAcross, goUpFor, goingNow, takeTheNote } from '@/engine/world/audition';
import { MS_WEEK } from '@/engine/world/lot';

export interface HowTheyPlay {
  /** Which way in, every time. A tape gives no note; a room does. */
  way?: 'tape' | 'room';
  /** How far the note is taken, every time. */
  howFar?: 'touch' | 'good' | 'far';
  /** The reading sent in blind. Dead center unless something else is wanted. */
  opening?: Reading;
  /** Called at the end of every week, for whatever else is being measured. */
  eachWeek?: (sim: Simulation, week: number) => void;
}

export interface WhatHappened {
  /** Asks that arrived, whether or not they were answered. */
  asked: number;
  /** Readings actually given. */
  read: number;
  /** Parts won. */
  cast: number;
  /** Asks the dates refused, which is the cost of the work already taken. */
  clashed: number;
}

/**
 * Runs a career and reports what came of it.
 *
 * Weekly rather than daily, because `whatIsGoing` runs on the weekly tick and a
 * daily loop measures the same asks fifty-two times over.
 */
export function playACareer(sim: Simulation, years: number, how: HowTheyPlay = {}): WhatHappened {
  const way = how.way ?? 'room';
  const howFar = how.howFar ?? 'good';
  const opening = how.opening ?? Object.fromEntries(SHADES.map((one) => [one.id, 0])) as Reading;
  const seen = new Set<string>();
  let asked = 0;
  let read = 0;
  let clashed = 0;

  for (let week = 1; week <= years * 52; week += 1) {
    sim.advanceTo(sim.now + MS_WEEK);
    for (const one of Object.values(sim.universe.auditions)) {
      if (seen.has(one.id)) continue;
      seen.add(one.id);
      asked += 1;
    }
    for (const one of goingNow(sim)) {
      if (!freeAcross(sim, one.from, one.to)) { clashed += 1; continue; }
      if (goUpFor(sim, { auditionId: one.id, way, played: opening }).ok) read += 1;
    }
    for (const one of Object.values(sim.universe.auditions)) {
      if (one.state === 'noted') takeTheNote(sim, { auditionId: one.id, howFar });
    }
    how.eachWeek?.(sim, week);
  }

  return {
    asked,
    read,
    clashed,
    cast: Object.values(sim.universe.auditions).filter((one) => one.why === 'cast').length,
  };
}
