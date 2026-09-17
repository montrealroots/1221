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
import type { Audition } from '@/engine/domain/model';
import { SHADES, type Reading } from '@/engine/content/audition';
import { freeAcross, goUpFor, goingNow, takeTheNote } from '@/engine/world/audition';
import { MS_WEEK } from '@/engine/world/lot';
import { stillMissing } from '@/engine/world/making';
import { parentCompany } from '@/engine/world/company';

export interface HowTheyPlay {
  /** Which way in, every time. A tape gives no note; a room does. */
  way?: 'tape' | 'room';
  /** How far the note is taken, every time. */
  howFar?: 'touch' | 'good' | 'far';
  /** The reading sent in. Dead center unless something else is wanted. */
  opening?: Reading;
  /**
   * The reading sent in, chosen per ask rather than once.
   *
   * What `opening` cannot express, and the only way to play the policy the room
   * is now built around: open on what this holder has kept asking for. Takes
   * precedence over `opening` when both are given.
   */
  openingFor?: (sim: Simulation, audition: Audition) => Reading;
  /** Called at the end of every week, for whatever else is being measured. */
  eachWeek?: (sim: Simulation, week: number) => void;
  /**
   * Lets the career run on even though a scheduled system is failing.
   *
   * Only for a measurement whose whole point is a broken handler. Everything
   * else wants the throw, for the reason in `THE WEEK A SYSTEM STOPPED` below.
   */
  evenIfSomethingBroke?: boolean;
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
    // Read off the notification and not off `AdvanceResult.missed`, because an
    // item is also marked missed when its kind simply has no handler — which is
    // an ordinary thing for a save written by another build. The notification is
    // written on the throwing path and only there.
    for (const one of Object.values(sim.universe.auditions)) {
      if (seen.has(one.id)) continue;
      seen.add(one.id);
      asked += 1;
    }
    for (const one of goingNow(sim)) {
      if (!freeAcross(sim, one.from, one.to)) { clashed += 1; continue; }
      const played = how.openingFor?.(sim, one) ?? opening;
      if (goUpFor(sim, { auditionId: one.id, way, played }).ok) read += 1;
    }
    for (const one of Object.values(sim.universe.auditions)) {
      if (one.state === 'noted') takeTheNote(sim, { auditionId: one.id, howFar });
    }
    how.eachWeek?.(sim, week);
  }

  const broke = sim.universe.notifications
    .filter((note) => note.title === 'A Scheduled Event Could Not Be Processed');
  if (broke.length > 0 && how.evenIfSomethingBroke !== true) {
    const said = [...new Set(broke.map((note) => note.body))].slice(0, 5).map((why) => `  ${why}`).join('\n');
    throw new Error(
      `A scheduled system failed ${broke.length} time${broke.length === 1 ? '' : 's'} during this `
      + `career, so these numbers describe a world where part of the engine stopped `
      + `running:\n${said}\n`
      + `Fix it, or pass evenIfSomethingBroke if a broken handler is what is being measured.`,
    );
  }

  return {
    asked,
    read,
    clashed,
    cast: Object.values(sim.universe.auditions).filter((one) => one.why === 'cast').length,
  };
}

// ---------------------------------------------------------------------------
// The other half of the game
// ---------------------------------------------------------------------------

/** The stages a picture sits in before anybody has committed money to it. */
const BEFORE_THE_GREENLIGHT = new Set(['idea', 'optioned', 'writing', 'draft', 'packaged']);

export interface WhatTheCompanyDid {
  /** Pictures greenlit. */
  greenlit: number;
  /** Pictures that reached delivered. */
  delivered: number;
  /** The lowest the company's cash account ever went, in cents. */
  lowestCents: number;
  /** The week it was lowest. */
  lowestAt: number;
  /** Weeks that ended with the company's cash account under water. */
  weeksUnder: number;
  /** What the account held at the end. */
  endedCents: number;
  /** Refusals the pipeline handed back, by the sentence they came with. */
  refused: Record<string, number>;
}

/**
 * A save somebody actually runs a company in.
 *
 * `playACareer` above plays the acting half, and for a long time it was the
 * whole instrument — which meant every claim about the company was measured
 * some other way, by hand, once, and then quoted from a page afterwards. That
 * is the idle-save trap wearing a different coat: a career nobody finishes was
 * the first version of it, and a company nobody runs is this one. Over
 * twenty-five years of `playACareer` the company's cash account never moves off
 * nought, because the player never options anything, so anything measured there
 * about money the company has or has not got is measuring a company that has
 * never traded.
 *
 * So this runs the pipeline the way a producer does, with the game's own
 * commands: fill the post, option the material, register the payroll, bind the
 * cover, then develop, greenlight, let the weeks run, file whatever the
 * delivery list is waiting on, and do it again.
 *
 * It opens the doors here rather than calling `tests/doors.ts`, which asserts
 * through `vitest`. `played.ts` is imported by `tools/` scripts that run under
 * `vite-node`, and pulling vitest in through the side door is a thing this file
 * has already been cleaned of once.
 */
export function playABusiness(sim: Simulation, years: number): WhatTheCompanyDid {
  const refused: Record<string, number> = {};
  const ask = (kind: string, payload: Record<string, unknown> = {}): { ok?: boolean; id?: string; error?: string } => {
    const out = sim.execute<{ ok?: boolean; id?: string; error?: string }>({ kind, payload }).value ?? {};
    if (out.error) refused[out.error] = (refused[out.error] ?? 0) + 1;
    return out;
  };

  //  and not , which is Sugar Land — the estate,
  // not the pictures company. The first draft read a cash account that does not
  // exist, got nought every week, and would have reported that the company
  // never once went under water.
  const company = parentCompany(sim.universe);
  const cash = (): number => Object.values(sim.universe.accounts)
    .find((one) => one.ownerId === company?.id && one.kind === 'company_cash' && !one.closedAt)?.balance ?? 0;

  const somebody = Object.values(sim.universe.people).find((one) => !one.isPlayer)
    ?? Object.values(sim.universe.people)[0];
  if (somebody) ask('company.fill_post', { role: 'production', personId: somebody.id });

  // The material before the cover, and that order is the engine's rule rather
  // than a preference: errors and omissions refuses with *an underwriter reads
  // the chain of title before writing this, and there is nothing to read*. The
  // first version of this function bound the cover first, and every picture it
  // made then sat one certificate short of delivered for twenty-five years —
  // 1,299 refusals of the same sentence, nought delivered, on every seed. The
  // instrument was wrong and the engine was right, which is the outcome worth
  // having from a new instrument's first run.
  let made = 1;
  ask('company.option', { title: 'Picture 1', hold: 'option', months: 18 });
  ask('company.register', { registry: 'is_employer' });
  for (const policy of ['general_liability', 'workers_comp', 'production_package', 'errors_omissions']) {
    ask('company.insure', { policy });
  }

  let greenlit = 0;
  let delivered = 0;
  let lowestCents = cash();
  let lowestAt = 0;
  let weeksUnder = 0;
  let optioned = 1;

  for (let week = 1; week <= years * 52; week += 1) {
    // One picture at a time, which is what a company this size can carry.
    const live = Object.values(sim.universe.projects)
      .filter((one) => one.stage !== 'delivered' && one.stage !== 'shelved');

    if (live.length === 0) {
      const title = `Picture ${made}`;
      if (made > optioned) {
        ask('company.option', { title, hold: 'option', months: 18 });
        optioned = made;
      }
      ask('company.develop', { title, medium: 'film' });
      made += 1;
    } else {
      for (const project of live) {
        // A picture that has not been committed to yet is waiting for the
        // greenlight, not for paperwork: asking a picture in `idea` to file its
        // music cue sheet is what the first draft of this loop did, five
        // thousand times a save, while the company made nothing.
        if (BEFORE_THE_GREENLIGHT.has(project.stage)) {
          const out = ask('company.greenlight', {
            projectId: project.id, planId: 'feature', budgetCents: 20_000_000_00, shootWeeks: 6,
          });
          if (out.ok !== false && !out.error) greenlit += 1;
          continue;
        }
        for (const element of stillMissing(project).filter((one) => one.by === 'business')) {
          ask('company.deliver', { projectId: project.id, elementId: element.id });
        }
        // And sell it, because a producer who delivers and never sells is not a
        // producer running out of money, it is an instrument forgetting to
        // trade. Without this the company makes two pictures in twenty-five
        // years and then cannot greenlight a third, which reads as a finding
        // about the company and is a finding about the loop.
        const now = sim.universe.projects[project.id];
        if (now?.stage === 'delivered' && !now.dealId) {
          ask('company.sell', { projectId: project.id, dealId: 'studio' });
        }
        if (sim.universe.projects[project.id]?.stage === 'delivered') delivered += 1;
      }
    }

    sim.advanceTo(sim.now + MS_WEEK);

    const held = cash();
    if (held < lowestCents) { lowestCents = held; lowestAt = week; }
    if (held < 0) weeksUnder += 1;
  }

  const broke = sim.universe.notifications
    .filter((note) => note.title === 'A Scheduled Event Could Not Be Processed');
  if (broke.length > 0) {
    const said = [...new Set(broke.map((note) => note.body))].slice(0, 5).map((why) => `  ${why}`).join('\n');
    throw new Error(
      `A scheduled system failed ${broke.length} times while the company ran, so these numbers `
      + `describe a world where part of the engine stopped:\n${said}`,
    );
  }

  return { greenlit, delivered, lowestCents, lowestAt, weeksUnder, endedCents: cash(), refused };
}
