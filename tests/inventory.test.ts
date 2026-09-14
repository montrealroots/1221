/**
 * SLATE — the second ledger, and the rate that empties it.
 *
 * The claim under all of it: a production runs two ledgers, and the shooting
 * ratio is what they come to when you divide one by the other. Nothing in the
 * engine sets a ratio. These hold the engine to producing numbers a person in
 * the business would recognize, from inputs that are about shooting and
 * cutting rather than about ratios.
 *
 * The second claim is the one that costs money: hands buy capacity, capacity
 * buys screen time at a rate, and money never buys screen time directly. The
 * test for that is not that the forecast changes — it is that the work
 * genuinely arrives later with fewer hands.
 */

import { describe, expect, it } from 'vitest';
import { quickSave, validateUniverse } from '@/engine';
import type { Simulation } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { projectsOf } from '@/engine/world/company';
import { PLANS, planById } from '@/engine/content/making';
import { rungsOf } from '@/engine/content/maturity';
import { KNOWN_RATIOS, STOCKS, rateById, stockById, throughput } from '@/engine/content/inventory';
import {
  bankedOf, cutsAWeek, handsOn, leftToCut, ledgerOf, materialSeconds, ratioOf, saidAsRatio,
  weeksToConvert, whereTheMaterialStands, willMakeIt,
} from '@/engine/world/inventory';
import { isFinished, owedSeconds, rungOf, secondsAtOrBeyond } from '@/engine/world/maturity';
import { finishesBy, heldUpBy, windowOf } from '@/engine/world/making';
import { openTheDoors } from './doors';

interface Done { ok: boolean; id?: string; error?: string }
const run = (sim: Simulation, kind: string, payload: Record<string, unknown> = {}): Done =>
  sim.execute<Done>({ kind, payload }).value!;

const world = (seed: string): Simulation => {
  const sim = quickSave({}, seed);
  openTheDoors(sim);
  return sim;
};

function greenlit(
  sim: Simulation, planId: string, title: string, extra: Record<string, unknown> = {},
): string {
  const medium = planById(planId)!.media.includes('film') ? 'film' : 'television';
  run(sim, 'company.develop', { title, medium });
  const id = projectsOf(sim.universe).find((one) => one.title === title)!.id;
  const done = run(sim, 'company.greenlight', {
    projectId: id, planId, budgetCents: 20_000_000_00, shootWeeks: 6, ...extra,
  });
  expect(done.error).toBeUndefined();
  return id;
}

/** Runs a project out to the end of its work, re-reading the end as it moves. */
function runItOut(sim: Simulation, id: string, rounds = 12): void {
  for (let i = 0; i < rounds; i += 1) {
    const done = finishesBy(sim.universe.projects[id]!);
    if (done === undefined || sim.now > done) break;
    sim.advanceTo(done + MS_DAY);
  }
}

/** The band a ratio falls in, by the nearest published one. */
const bandFor = (ratio: number): string => KNOWN_RATIOS
  .reduce((best, band) => (
    Math.abs(Math.log(ratio / band.ratio)) < Math.abs(Math.log(ratio / best.ratio)) ? band : best
  ), KNOWN_RATIOS[0]!).id;

// ---------------------------------------------------------------------------

describe('the shooting ratio is reported, never chosen', () => {
  it('is not written down anywhere in the engine', () => {
    // Every plan says how much it banks in a week and how long it runs. None
    // of them says what the ratio is, and nothing outside the test corpus
    // reads the published bands.
    for (const plan of PLANS) {
      for (const period of plan.periods) {
        expect(Object.keys(period)).not.toContain('ratio');
      }
      expect(Object.keys(plan)).not.toContain('ratio');
    }
  });

  it('lands a scripted feature where a scripted feature lands', () => {
    const sim = world('ratio-feature');
    const id = greenlit(sim, 'feature', 'Hvítserkur');
    runItOut(sim, id);
    const ratio = ratioOf(sim.universe.projects[id]!)!;
    expect(bandFor(ratio)).toBe('feature');
    expect(saidAsRatio(ratio)).toBe('15:1');
  });

  it('lands a drama series below a feature, because it is shot to a plan', () => {
    const sim = world('ratio-series');
    const id = greenlit(sim, 'series', 'Landnám');
    runItOut(sim, id);
    const ratio = ratioOf(sim.universe.projects[id]!)!;
    expect(bandFor(ratio)).toBe('drama');
    expect(ratio).toBeLessThan(KNOWN_RATIOS.find((b) => b.id === 'feature')!.ratio);
  });

  it('lands a fixed-rig season in the four figures, from the same two lines', () => {
    const sim = world('ratio-rig');
    const id = greenlit(sim, 'unscripted', 'The Arena');
    runItOut(sim, id);
    const ratio = ratioOf(sim.universe.projects[id]!)!;
    // Four figures is the thing. An engine that cannot produce one has an
    // acquisition model that only understands scripted shooting.
    expect(ratio).toBeGreaterThanOrEqual(1_000);
    expect(ratio).toBeLessThan(10_000);
    expect(saidAsRatio(ratio)).toMatch(/^\d{1,2},?\d{3}:1$|^\d{4}:1$/);
  });

  it('rises when the same runtime is shot for longer, because that is what it means', () => {
    const short = world('ratio-short');
    const shortId = greenlit(short, 'feature', 'Six', { shootWeeks: 6 });
    runItOut(short, shortId);
    const long = world('ratio-long');
    const longId = greenlit(long, 'feature', 'Twelve', { shootWeeks: 12 });
    runItOut(long, longId);

    expect(owedSeconds(long.universe.projects[longId]!))
      .toBe(owedSeconds(short.universe.projects[shortId]!));
    const lean = ratioOf(short.universe.projects[shortId]!)!;
    const loose = ratioOf(long.universe.projects[longId]!)!;
    expect(loose).toBeGreaterThan(lean * 1.8);
  });

  it('has no ratio at all before anything is banked, which is not the same as nought', () => {
    const sim = world('ratio-none');
    const id = greenlit(sim, 'feature', 'Nothing Yet');
    expect(ratioOf(sim.universe.projects[id]!)).toBeUndefined();
    expect(whereTheMaterialStands(sim.universe.projects[id]!, sim.now))
      .toBe('Not a frame of it has been shot yet.');
  });

  it('counts a counted stock as the time it is worth', () => {
    const sim = world('ratio-units');
    const id = greenlit(sim, 'feature', 'Counted');
    const project = sim.universe.projects[id]!;
    project.banked = { rushes: 1, beats: 2, shots: 3, archive: 4 };
    // An hour of rushes, two beats at a minute, three shots at four seconds.
    expect(materialSeconds(project)).toBe(3_600 + 120 + 12 + 4);
  });
});

describe('material banks week by week, not in a lump', () => {
  it('piles up across the shoot rather than arriving at wrap', () => {
    const sim = world('banking');
    const id = greenlit(sim, 'unscripted', 'The Arena');
    const project = () => sim.universe.projects[id]!;
    const field = windowOf(project(), 'field')!;
    const seen: number[] = [];
    for (let at = field.from; at <= field.to; at += 7 * MS_DAY) {
      sim.advanceTo(at);
      seen.push(bankedOf(project(), 'rushes'));
    }
    const steps = new Set(seen).size;
    expect(steps, 'material arrived in one lump').toBeGreaterThan(3);
    // And it is monotonic: nothing un-banks material that has been shot.
    for (let i = 1; i < seen.length; i += 1) expect(seen[i]!).toBeGreaterThanOrEqual(seen[i - 1]!);
    // Half way through the field, about half of it is in.
    const half = seen[Math.floor(seen.length / 2)]!;
    const all = seen[seen.length - 1]!;
    expect(half).toBeGreaterThan(all * 0.3);
    expect(half).toBeLessThan(all * 0.7);
  });

  it('never gives it back, because unused material is still material', () => {
    const sim = world('banking-keeps');
    const id = greenlit(sim, 'unscripted', 'The Arena');
    runItOut(sim, id);
    const project = sim.universe.projects[id]!;
    expect(isFinished(project)).toBe(true);
    // The season is finished and almost none of what was shot is in it. That
    // gap is the ratio, and a ledger that decremented would hide it.
    expect(materialSeconds(project)).toBeGreaterThan(owedSeconds(project) * 100);
    expect(ledgerOf(project).map((row) => row.stock)).toEqual(['rushes']);
  });
});

describe('hands buy capacity, capacity buys screen time', () => {
  const staffed = (seed: string, hands?: number): { sim: Simulation; id: string } => {
    const sim = world(seed);
    return { sim, id: greenlit(sim, 'unscripted', 'The Arena', hands === undefined ? {} : { hands }) };
  };

  it('cuts twice as fast with twice the hands, and says so before it matters', () => {
    const one = staffed('hands-1', 1);
    const two = staffed('hands-2', 2);
    const field = windowOf(one.sim.universe.projects[one.id]!, 'field')!;
    one.sim.advanceTo(field.to);
    two.sim.advanceTo(field.to);
    const lean = one.sim.universe.projects[one.id]!;
    const full = two.sim.universe.projects[two.id]!;
    expect(cutsAWeek(full)).toBe(cutsAWeek(lean) * 2);
    expect(weeksToConvert(lean)!).toBeGreaterThan(weeksToConvert(full)!);
    expect(willMakeIt(lean, one.sim.now)!.makesIt).toBe(false);
    expect(willMakeIt(full, two.sim.now)!.makesIt).toBe(true);
  });

  it('actually delivers later with fewer hands, rather than warning and arriving anyway', () => {
    const lean = staffed('late-1', 1);
    const full = staffed('late-2', 2);
    runItOut(lean.sim, lean.id);
    runItOut(full.sim, full.id);
    const short = lean.sim.universe.projects[lean.id]!;
    const staffedUp = full.sim.universe.projects[full.id]!;

    // The well-staffed season is finished. The under-staffed one is not, and
    // the difference is measured in screen time that never came out of the
    // cutting room rather than in a message.
    expect(isFinished(staffedUp)).toBe(true);
    expect(isFinished(short)).toBe(false);
    expect(short.cut!).toBeLessThan(staffedUp.cut!);
    expect(leftToCut(short)).toBeGreaterThan(0);
    expect(leftToCut(staffedUp)).toBe(0);
    expect(secondsAtOrBeyond(short, 'picture', 'assembly'))
      .toBeLessThan(secondsAtOrBeyond(staffedUp, 'picture', 'assembly'));
  });

  it('takes the plan’s figure where nobody has decided, and the decision where somebody has', () => {
    const plan = planById('unscripted')!;
    const assumed = plan.periods.find((one) => one.converts)!.converts!.hands;
    const quiet = staffed('hands-default');
    expect(handsOn(quiet.sim.universe.projects[quiet.id]!)).toBe(assumed);
    const loud = staffed('hands-said', 5);
    expect(handsOn(loud.sim.universe.projects[loud.id]!)).toBe(5);
    expect(cutsAWeek(loud.sim.universe.projects[loud.id]!))
      .toBe(throughput(plan.periods.find((one) => one.converts)!.converts!.at, 5));
  });

  it('holds the parts back until the room has cut them, in order', () => {
    const lean = staffed('order', 1);
    const field = windowOf(lean.sim.universe.projects[lean.id]!, 'field')!;
    lean.sim.advanceTo(field.to);
    const project = lean.sim.universe.projects[lean.id]!;
    const cut = project.cut ?? 0;
    const parts = [...project.parts!].sort((a, b) => a.ordinal - b.ordinal);
    let covered = 0;
    for (const part of parts) {
      covered += part.seconds;
      const through = covered <= cut;
      const rung = part.maturity?.picture ?? 'nothing';
      if (through) expect(rung, `part ${part.ordinal} was cut and is still at ${rung}`).not.toBe('stringout');
      else expect(rung, `part ${part.ordinal} came out of a room that never cut it`).not.toBe('locked');
    }
  });
});

describe('the engine says so when the cut cannot make the date', () => {
  const warnings = (sim: Simulation): string[] => sim.universe.notifications
    .filter((one) => one.title.includes('More Than It Can Cut'))
    .map((one) => one.body);

  it('stays quiet on every plan that is staffed the way its plan assumes', () => {
    for (const plan of PLANS) {
      const sim = world(`quiet-${plan.id}`);
      const id = greenlit(sim, plan.id, `Quiet ${plan.id}`);
      runItOut(sim, id);
      expect(warnings(sim), `${plan.id} warns about a cut it makes`).toEqual([]);
    }
  });

  it('says so, once, and while there is still time to do something about it', () => {
    const sim = world('scramble');
    const id = greenlit(sim, 'unscripted', 'The Arena', { hands: 1 });
    const post = windowOf(sim.universe.projects[id]!, 'post')!;
    runItOut(sim, id);
    const said = warnings(sim);
    expect(said).toHaveLength(1);
    expect(said[0]!).toContain('1 cutting room');
    expect(said[0]!).toMatch(/short/);
    const when = sim.universe.notifications
      .find((one) => one.title.includes('More Than It Can Cut'))!.at;
    // Early enough to matter: inside the first half of the cut.
    expect(when).toBeLessThan(post.from + (post.to - post.from) / 2);
  });

  it('says so again when the room is put right', () => {
    const sim = world('recover');
    const id = greenlit(sim, 'unscripted', 'The Arena', { hands: 1 });
    const post = windowOf(sim.universe.projects[id]!, 'post')!;
    sim.advanceTo(post.from + 21 * MS_DAY);
    expect(warnings(sim)).toHaveLength(1);
    // Four editors instead of one, which is what the warning was for.
    sim.universe.projects[id]!.hands = 4;
    runItOut(sim, id);
    expect(sim.universe.notifications.some((one) => one.title.includes('Back Inside Its Date'))).toBe(true);
    expect(warnings(sim), 'it nagged about a cut it had already got back').toHaveLength(1);
    expect(isFinished(sim.universe.projects[id]!)).toBe(true);
  });
});

describe('the ledger holds together', () => {
  it('names a real stock and a real rate everywhere a plan names one', () => {
    for (const plan of PLANS) {
      for (const period of plan.periods) {
        if (period.acquires) {
          expect(stockById(period.acquires.stock), `${plan.id}/${period.id}`).toBeDefined();
          expect(period.acquires.aWeek).toBeGreaterThan(0);
        }
        if (period.converts) {
          expect(rateById(period.converts.at), `${plan.id}/${period.id}`).toBeDefined();
          expect(period.converts.hands).toBeGreaterThan(0);
          // And the rung it cuts up to is a real rung on the ladder this plan
          // is measured against, not a word that resembles one.
          const rungs = rungsOf(plan.ladders, 'picture').map((one) => one.id);
          expect(rungs, `${plan.id} cuts up to ${period.converts.upTo}`)
            .toContain(period.converts.upTo);
          // Below the top of it, because what sits above the cut is people
          // with authority and their time is calendar time, not editor-weeks.
          expect(rungs.indexOf(period.converts.upTo)).toBeLessThan(rungs.length - 1);
        }
      }
      // One cutting room per plan. Two would be two answers to the same
      // question about the same parts.
      expect(plan.periods.filter((one) => one.converts).length).toBeLessThanOrEqual(1);
    }
  });

  it('gives every plan both ledgers, because every form has both', () => {
    for (const plan of PLANS) {
      expect(plan.periods.some((one) => one.acquires), `${plan.id} banks nothing`).toBe(true);
      expect(plan.periods.some((one) => one.converts), `${plan.id} cuts nothing`).toBe(true);
    }
  });

  it('keeps every published rate a published rate', () => {
    for (const rate of ['unscripted-editor', 'feature-animator', 'stop-motion-animator']) {
      expect(rateById(rate)!.secondsAWeek).toBeGreaterThan(0);
    }
    // Two hundred and forty to one between the fastest and the slowest, and
    // both are somebody working flat out. An engine with one throughput number
    // can model exactly one of them.
    expect(rateById('unscripted-editor')!.secondsAWeek / rateById('feature-animator')!.secondsAWeek)
      .toBeGreaterThan(100);
    expect(STOCKS.map((one) => one.id)).toEqual(['rushes', 'beats', 'shots', 'archive']);
  });

  it('keeps the save sound and the books straight through a whole season', () => {
    const sim = world('sound');
    const id = greenlit(sim, 'unscripted', 'The Arena');
    runItOut(sim, id);
    for (const element of heldUpBy(sim.universe.projects[id]!)) {
      run(sim, 'company.deliver', { projectId: id, elementId: element.id });
    }
    expect(validateUniverse(sim.universe).errors).toEqual([]);
    expect(sim.ledger.audit()).toEqual([]);
    expect(rungOf(sim.universe.projects[id]!, 'picture')).toBe('locked');
  });
});
