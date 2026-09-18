/**
 * SLATE — finished work coming apart, which is what the vector is for.
 *
 * The maturity vector has been six ladders nobody ever fell off. `knockBack`
 * existed, it worked, and nothing in the engine had a reason to call it — a
 * mechanism with no cause, which by this project's own rule is worse than not
 * having one. These hold the engine to the research's own sentence: a finished,
 * perfectly cut act can be destroyed at week nineteen by a withdrawn consent, a
 * fairness obligation or a compliance note.
 *
 * The claim that matters is not that things go wrong. It is that what going
 * wrong costs is carried by the ladder and by the cutting room, and by nothing
 * written down: the same finding is free early and ruinous late, and the
 * difference is how far the work had climbed and how much room the room has.
 */

import { describe, expect, it } from 'vitest';
import { quickSave, validateUniverse } from '@/engine';
import type { Simulation } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { MS_WEEK } from '@/engine/world/lot';
import { projectsOf } from '@/engine/world/company';
import { PLANS, planById } from '@/engine/content/making';
import { FINDINGS, REVIEW_RATE, findingById } from '@/engine/content/trouble';
import { DIMENSIONS, rungsOf } from '@/engine/content/maturity';
import {
  aboveTheRoom, climbedTo, comesApart, deckFor, decideReview, exposureOf, landsOn,
  movedDuringTheWork, rateOf, takeItBack,
} from '@/engine/world/trouble';
import { theBiggestName } from '@/engine/world/casting';
import {
  doneShare, isFinished, partsOf, rungOfPart, stepOfPart,
} from '@/engine/world/maturity';
import { leftToCut, willMakeIt } from '@/engine/world/inventory';
import { finishesBy, heldUpBy, windowOf } from '@/engine/world/making';
import { deliverIt, openTheDoors } from './doors';

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
  // Off the material the company optioned, the way a picture actually gets
  // made: the holding is what the chain of title is a chain to.
  const held = Object.values(sim.universe.holdings)[0];
  run(sim, 'company.develop', { title, medium, holdingId: held?.id });
  const id = projectsOf(sim.universe).find((one) => one.title === title)!.id;
  const done = run(sim, 'company.greenlight', {
    projectId: id, planId, budgetCents: 20_000_000_00, shootWeeks: 6, ...extra,
  });
  expect(done.error).toBeUndefined();
  return id;
}

const FOUND = /Compliance Note|Note From The People|Coverage Debt|Master Comes Back|Withdrawn Consent|Gap In The Chain|Moment Nobody/;
const findings = (sim: Simulation): string[] => sim.universe.notifications
  .filter((one) => FOUND.test(one.title)).map((one) => one.title);

// ---------------------------------------------------------------------------

describe('somebody watches the work, and what they find is not a script', () => {
  it('finds nothing worth saying on a picture shot to a plan, and plenty on a rig', () => {
    const tidy = world('exposure-tidy');
    const tidyId = greenlit(tidy, 'feature', 'Hvítserkur');
    const loose = world('exposure-rig');
    const looseId = greenlit(loose, 'unscripted', 'The Arena');
    deliverIt(tidy, tidyId);
    deliverIt(loose, looseId);

    // Nothing sets either number. One production banked twenty-five hours
    // against a hundred minutes and the other banked fifteen thousand against
    // eight, and everything below follows from that.
    expect(exposureOf(loose.universe.projects[looseId]!, loose))
      .toBeGreaterThan(exposureOf(tidy.universe.projects[tidyId]!, tidy));
    expect(findings(loose).length).toBeGreaterThan(findings(tidy).length);
  });

  it('delivers both of them anyway, because a finding is a setback and not a wall', () => {
    for (const plan of PLANS) {
      const sim = world(`through-${plan.id}`);
      const id = greenlit(sim, plan.id, `Through ${plan.id}`);
      expect(deliverIt(sim, id), `${plan.id} never got delivered`).toBe(true);
      expect(isFinished(sim.universe.projects[id]!)).toBe(true);
      expect(validateUniverse(sim.universe).errors).toEqual([]);
      expect(sim.ledger.audit()).toEqual([]);
    }
  });

  it('asks the plan what it does, never what it is called', () => {
    // A picture clears its rights by filing a chain of title in prep, so it has
    // no live consent for anybody to withdraw. A season's consent is a standing
    // relationship with people still in the room. That difference is visible in
    // the periods and nowhere else, and no module names a plan to find it.
    expect(movedDuringTheWork(planById('unscripted')!, 'rights')).toBe(true);
    expect(movedDuringTheWork(planById('feature')!, 'rights')).toBe(false);

    const season = world('deck-season');
    const seasonId = greenlit(season, 'unscripted', 'The Arena');
    const picture = world('deck-picture');
    const pictureId = greenlit(picture, 'feature', 'Hvítserkur');
    season.advanceTo(finishesBy(season.universe.projects[seasonId]!)!);
    picture.advanceTo(finishesBy(picture.universe.projects[pictureId]!)!);

    const seasonDeck = deckFor(
      season.universe.projects[seasonId]!, planById('unscripted')!,
      theBiggestName(season, season.universe.projects[seasonId]!),
    ).map((one) => one.id);
    const pictureDeck = deckFor(
      picture.universe.projects[pictureId]!, planById('feature')!,
      theBiggestName(picture, picture.universe.projects[pictureId]!),
    ).map((one) => one.id);
    expect(seasonDeck).toContain('withdrawn-consent');
    expect(pictureDeck).not.toContain('withdrawn-consent');
    // And the routine one happens to everything, which is why it needs no gate.
    expect(seasonDeck).toContain('compliance-note');
    expect(pictureDeck).toContain('compliance-note');
  });

  it('counts the rungs above the cutting room off the ladder, not off the plan id', () => {
    // A season carries a producer, an executive and a broadcaster above the
    // assembly. A picture carries the grade above the cut. Same function.
    expect(aboveTheRoom(planById('unscripted')!, 'season')).toBe(4);
    expect(aboveTheRoom(planById('feature')!, 'picture')).toBe(2);
    expect(aboveTheRoom(planById('unscripted')!, 'season'))
      .toBeGreaterThan(aboveTheRoom(planById('feature')!, 'picture'));
  });
});

describe('the ladder says what it cost, and the row never does', () => {
  it('reads nothing at the bottom and everything at the top, off the same row', () => {
    const deck = [...FINDINGS];
    const at = (climbed: number): string => decideReview({
      ladders: 'season', deck, climbed, exposure: 1, whether: 0, which: 0.99,
    }).said;
    // The same finding, the same week, the same production.
    expect(at(0)).toBe('nothing found');
    expect(at(1)).toBe('the finish thrown away');
    const seen = new Set([at(0), at(0.1), at(0.3), at(0.6), at(1)]);
    expect(seen.size, 'how far it had climbed changed nothing').toBeGreaterThan(2);
  });

  it('separates whether anything was found from what it was', () => {
    const deck = [...FINDINGS];
    const base = { ladders: 'season', deck, climbed: 0.9, exposure: 0.5 };
    // One roll doing both jobs would tie them together, and the rare rows at
    // the bottom of the deck could never come up at all.
    const rows = new Set<string>();
    for (let i = 0; i < 40; i += 1) {
      const got = decideReview({ ...base, whether: 0.01, which: i / 40 });
      if (got.finding) rows.add(got.finding.id);
    }
    expect(rows.size, 'the deck only ever deals the same card').toBeGreaterThan(3);
    expect(rows).toContain('withdrawn-consent');
    // And a week that finds nothing finds nothing whatever is in the deck.
    expect(decideReview({ ...base, whether: 0.99, which: 0.99 }).said).toBe('nothing found');
  });

  it('looks harder at a production with more lying around', () => {
    expect(rateOf(0)).toBe(REVIEW_RATE.clean);
    expect(rateOf(1)).toBeCloseTo(REVIEW_RATE.exposed, 10);
    expect(rateOf(1)).toBeGreaterThan(rateOf(0) * 5);
  });

  it('never sends a cut below the last thing the cutting room handed up', () => {
    const sim = world('floor');
    const id = greenlit(sim, 'unscripted', 'The Arena');
    const project = sim.universe.projects[id]!;
    const part = partsOf(project)[0]!;
    // A note from a broadcaster is a note about the version they were shown.
    // The version under it still exists, and a part that never got past the
    // stringout cannot be sent back to one below it.
    const note = findingById('notes-round')!;
    const to = landsOn(project, part, note, planById('unscripted')!);
    const rungs = rungsOf('season', 'picture').map((one) => one.id);
    expect(rungs.indexOf(to!)).toBeGreaterThanOrEqual(rungs.indexOf('assembly'));
  });

  it('takes the mix and the master down with the picture, and says why', () => {
    const sim = world('cascade');
    const id = greenlit(sim, 'unscripted', 'The Arena');
    const project = sim.universe.projects[id]!;
    deliverIt(sim, id);
    const part = partsOf(project)[0]!;
    expect(rungOfPart(project, part, 'sound')).toBe('mixed');
    expect(rungOfPart(project, part, 'conform')).toBe('accepted');

    // The mix was made against a locked picture and the master against that
    // mix. Take the picture away and neither one is a thing any more.
    const apart = comesApart(project, part, 'rights', planById('unscripted')!, 99);
    expect(apart.picture, 'the picture stood while its consent went').toBeGreaterThan(0);
    expect(rungOfPart(project, part, 'sound')).not.toBe('mixed');
    expect(rungOfPart(project, part, 'conform')).toBe('nothing');
    // And the master is void outright rather than faulty: a file of the wrong
    // thing is not a file with a fault in it.
    expect(apart.fell).toBeGreaterThan(apart.picture);
  });

  it('leaves a rejected master alone, because nothing was built on it', () => {
    const sim = world('conform-only');
    const id = greenlit(sim, 'unscripted', 'The Arena');
    deliverIt(sim, id);
    const project = sim.universe.projects[id]!;
    const part = partsOf(project)[0]!;
    const apart = comesApart(project, part, 'conform', planById('unscripted')!, 99);
    expect(apart.fell).toBe(0);
    expect(rungOfPart(project, part, 'picture')).toBe('locked');
  });
});

describe('the money goes back to being held, through the machinery that holds it', () => {
  it('strikes what the vector no longer supports off the delivery list', () => {
    const sim = world('strike');
    const id = greenlit(sim, 'feature', 'Hvítserkur');
    expect(deliverIt(sim, id)).toBe(true);
    const project = sim.universe.projects[id]!;
    expect(heldUpBy(project)).toHaveLength(0);

    // The chain of title said the rights were cleared. Take the rights away
    // and the thing that said so comes off the list.
    for (const part of partsOf(project)) {
      part.maturity = { ...(part.maturity ?? {}), rights: 'nothing' };
    }
    const struck = takeItBack(project);
    expect(struck.length).toBeGreaterThan(0);
    expect(project.delivered).not.toContain('chain');
    // Which re-arms the same code that held the money in the first place.
    expect(heldUpBy(project).length).toBeGreaterThan(0);
  });

  it('never un-settles a period, because that is a budget spent twice', () => {
    const sim = world('settled');
    const id = greenlit(sim, 'unscripted', 'The Arena');
    expect(deliverIt(sim, id)).toBe(true);
    const project = sim.universe.projects[id]!;
    const plan = planById('unscripted')!;
    expect(project.settled).toHaveLength(plan.periods.length);
    for (const period of plan.periods) {
      const posted = sim.universe.transactions
        .filter((t) => t.memo === `${project.title}: ${period.label}`).length;
      expect(posted, `${period.label} settled ${posted} times`).toBe(1);
    }
    expect(sim.ledger.audit()).toEqual([]);
  });
});

describe('the cutting room is what a recut actually costs', () => {
  it('hands the room back a share of an episode, and the room pays it down', () => {
    const sim = world('recut');
    const id = greenlit(sim, 'unscripted', 'The Arena');
    const project = () => sim.universe.projects[id]!;
    const post = windowOf(project(), 'post')!;
    sim.advanceTo(post.to);
    const before = leftToCut(project());

    // A withdrawn consent on one episode: the person comes out of it, so the
    // episode goes back to the assembly and the room owes it again.
    const part = partsOf(project())[0]!;
    part.maturity = { ...(part.maturity ?? {}), rights: 'nothing' };
    comesApart(project(), part, 'rights', planById('unscripted')!, 99);
    // What the episode already owed before this test put the whole of it back.
    // `comesApart` can have handed some of it back by itself, and overwriting
    // rather than adding meant the expectation only held while that happened to
    // be nothing — which it stopped being the day an unrelated system shifted
    // every draw in the save along.
    const was = part.recut ?? 0;
    const owed = part.seconds;
    part.recut = owed;
    expect(leftToCut(project()), 'the forecast never noticed').toBe(before - was + owed);

    // And the room works it off at the rate it runs at, with the hands it has.
    sim.advanceTo(sim.now + 4 * MS_WEEK);
    expect(partsOf(project())[0]!.recut ?? 0).toBeLessThan(owed);
  });

  it('is absorbed by a room with slack and fatal to one without', () => {
    // One editor against three, on the same season with the same seeds and the
    // same deck. Nothing about what gets found changes. Only the room changes,
    // and the room is the whole difference between a note and a disaster.
    const got = (hands: number): { made: number; late: number } => {
      let made = 0;
      let late = 0;
      for (const seed of ['a', 'b', 'c']) {
        const sim = world(`slack-${hands}-${seed}`);
        const id = greenlit(sim, 'unscripted', 'The Arena', { hands });
        const there = deliverIt(sim, id, 120);
        const project = sim.universe.projects[id]!;
        if (there) {
          made += 1;
          late += Math.max(0, (project.deliveredAt! - project.deliverBy!) / MS_WEEK);
        } else {
          late += 120;
        }
      }
      return { made, late: late / 3 };
    };
    const alone = got(1);
    const staffed = got(3);
    expect(staffed.made, 'three editors could not get a season out').toBe(3);
    expect(staffed.late, 'three editors still missed air badly').toBeLessThan(6);
    expect(alone.late, 'one editor made the airdate anyway').toBeGreaterThan(20);
    expect(staffed.late).toBeLessThan(alone.late / 4);
  });
});

describe('a season can be destroyed at week nineteen, and can come back', () => {
  /**
   * Runs the work out without filing a thing.
   *
   * A week at a time and not a jump to the end date, because the end date is no
   * longer where the work ends: a review can put an episode back in the room in
   * any week, and the season is finished when it is finished.
   */
  const runToTheEnd = (sim: Simulation, id: string): void => {
    for (let i = 0; i < 200; i += 1) {
      const project = sim.universe.projects[id]!;
      if (isFinished(project)) return;
      sim.advanceTo(sim.now + MS_WEEK);
    }
  };

  it('has a week to be destroyed in, between the work finishing and delivering', () => {
    // The gap the research puts the lawyer in. Before this the weekly tick
    // stopped when the cutting room closed, so the one week the whole thing
    // exists for had nothing running in it.
    for (const plan of PLANS) {
      const sim = world(`gap-${plan.id}`);
      const id = greenlit(sim, plan.id, `Gap ${plan.id}`);
      const project = sim.universe.projects[id]!;
      const gap = (project.deliverBy! - finishesBy(project)!) / MS_WEEK;
      expect(gap, `${plan.id} delivers the day it finishes`).toBeGreaterThan(0);
    }
  });

  it('un-finishes a season in the week between finishing and delivering', () => {
    const sim = world('week19');
    const id = greenlit(sim, 'unscripted', 'The Arena');
    const project = () => sim.universe.projects[id]!;
    runToTheEnd(sim, id);

    // The work is done and the thing is not delivered. That gap is where the
    // research puts the lawyer, and until the weekly tick was made to run
    // through it there was no week nineteen for anything to happen in.
    expect(isFinished(project()), 'the season never finished in the first place').toBe(true);
    expect(project().stage).not.toBe('delivered');
    // Finished and not handed over. Whether that lands before the airdate or
    // after it is the season's own business — the point is that the weeks in
    // between exist and have a tick running in them.
    expect(heldUpBy(project()).length).toBeGreaterThan(0);

    // Then the thing the research says can happen there. Every episode this
    // person is in loses its consent, which takes the cut back to the assembly
    // and the mix and the master with it.
    for (const part of partsOf(project()).slice(0, 3)) {
      part.maturity = { ...(part.maturity ?? {}), rights: 'nothing' };
      comesApart(project(), part, 'rights', planById('unscripted')!, 99);
      part.recut = part.seconds;
    }
    takeItBack(project());
    expect(isFinished(project()), 'a withdrawn consent left it finished').toBe(false);
    // Three of eight episodes lost their consent, so the season reads a
    // fraction finished — and a fraction finished is worth nothing, because
    // done is the minimum and a season cannot be sold in pieces.
    expect(doneShare(project())).toBeLessThan(1);
    expect(heldUpBy(project()).length, 'the money was not held again').toBeGreaterThan(0);
    const owes = partsOf(project()).reduce((n, part) => n + (part.recut ?? 0), 0);
    expect(leftToCut(project()), 'the room was never told').toBeGreaterThanOrEqual(owes);

    // And it climbs back, because a setback with no way out is a dead end
    // rather than a risk. It costs weeks, and the weeks are the cost.
    expect(deliverIt(sim, id), 'the season never came back').toBe(true);
    expect(isFinished(project())).toBe(true);
    expect(project().deliveredAt!).toBeGreaterThan(project().deliverBy!);
    expect(validateUniverse(sim.universe).errors).toEqual([]);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('leaves a delivered picture alone, because that one is somebody else’s now', () => {
    const sim = world('past-it');
    const id = greenlit(sim, 'feature', 'Hvítserkur');
    expect(deliverIt(sim, id)).toBe(true);
    const before = findings(sim).length;
    sim.advanceTo(sim.now + 300 * MS_DAY);
    // A review is somebody watching work the company still owns. Once it has
    // gone over, what happens to it is a different mechanism with a different
    // name, and the engine says nothing rather than pretending.
    expect(findings(sim).length).toBe(before);
    expect(sim.universe.projects[id]!.stage).toBe('delivered');
  });

  it('costs more the later it lands, and nothing anywhere says so', () => {
    const cost = (at: 'early' | 'late'): number => {
      const sim = world(`when-${at}`);
      const id = greenlit(sim, 'unscripted', 'The Arena');
      const project = () => sim.universe.projects[id]!;
      const post = windowOf(project(), 'post')!;
      if (at === 'early') sim.advanceTo(post.from + MS_WEEK);
      else runToTheEnd(sim, id);
      const part = partsOf(project())[0]!;
      const climbed = climbedTo(project(), part);
      part.maturity = { ...(part.maturity ?? {}), rights: 'nothing' };
      const apart = comesApart(project(), part, 'rights', planById('unscripted')!, 99);
      return apart.fell + climbed * 10;
    };
    // Same row, same season, same episode. The only difference is when.
    expect(cost('late')).toBeGreaterThan(cost('early') * 2);
  });
});

describe('the deck holds together', () => {
  it('names a real dimension and a reachable rung everywhere', () => {
    for (const finding of FINDINGS) {
      expect(DIMENSIONS.map((d) => d.id), finding.id).toContain(finding.dimension);
      expect(finding.weight).toBeGreaterThan(0);
      expect(finding.what.split(/\s+/).length, `${finding.id} says too little`).toBeGreaterThan(12);
      expect(finding.source.length, `${finding.id} cites nothing`).toBeGreaterThan(20);
      // A distance and never the name of a rung, because a rung id is a
      // form-specific fact in ordinary clothes and a third ladder set would
      // break every row that named one, silently.
      expect(typeof finding.down === 'number' || finding.down === 'floor' || finding.down === 'room')
        .toBe(true);
    }
  });

  it('can reach every row from some production the engine can make', () => {
    const reached = new Set<string>();
    for (const plan of PLANS) {
      const sim = world(`reach-${plan.id}`);
      const id = greenlit(sim, plan.id, `Reach ${plan.id}`);
      const project = sim.universe.projects[id]!;
      sim.advanceTo(finishesBy(project)!);
      for (const one of deckFor(project, plan, theBiggestName(sim, project))) reached.add(one.id);
    }
    // A row nothing can ever draw is a declared word with nothing reading it.
    for (const finding of FINDINGS) {
      expect(reached, `${finding.id} can never happen to anything`).toContain(finding.id);
    }
  });

  it('knows what a part has to lose, which is not the same as what it is worth', () => {
    const sim = world('standing');
    const id = greenlit(sim, 'unscripted', 'The Arena');
    const project = sim.universe.projects[id]!;
    deliverIt(sim, id);
    const part = partsOf(project)[0]!;
    part.maturity = { ...(part.maturity ?? {}), rights: 'nothing' };

    // Done is the minimum: locked, mixed, mastered and unsigned is worth
    // nothing. What there is to lose is the mean, and it is nearly everything.
    // Reading the minimum here would make a production invulnerable right up
    // until it was finished, and finished things are delivered within the week.
    expect(Math.min(...DIMENSIONS.map((d) => stepOfPart(project, part, d.id)))).toBe(0);
    expect(climbedTo(project, part)).toBeGreaterThan(0.6);
  });

  it('keeps the whole thing sound across every plan and a long run', () => {
    for (const plan of PLANS) {
      const sim = world(`sound-${plan.id}`);
      const id = greenlit(sim, plan.id, `Sound ${plan.id}`);
      expect(deliverIt(sim, id)).toBe(true);
      sim.advanceTo(sim.now + 200 * MS_DAY);
      expect(validateUniverse(sim.universe).errors, plan.id).toEqual([]);
      expect(sim.ledger.audit(), plan.id).toEqual([]);
      expect(willMakeIt(sim.universe.projects[id]!, sim.now)).toBeDefined();
    }
  });
});
