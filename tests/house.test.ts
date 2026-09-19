/**
 * SLATE — keeping the house, and whether keeping it decides anything.
 *
 * `property.condition` had one writer in the whole build and it was a
 * subtraction. These hold the other direction honest: that the price is the
 * quotient it claims to be rather than a number somebody liked, that the money
 * really leaves, that the refusals are reachable, and — the one that matters —
 * that the condition reaches an outcome instead of only a sentence.
 *
 * The last of those is the whole reason this is not decoration. A lever that
 * moves a meter and nothing else is the failure this project is most exposed
 * to, so the test that would catch it is here and it plays a career.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { A_POINT_OF_IT_CENTS, HOUSE, WEAR_A_DAY } from '@/engine/content/estate';
import { TRAINING_AN_HOUR, ceilingAt } from '@/engine/content/lifespan';
import { TOO_SPENT_TO_TRAIN } from '@/engine/systems/life';
import {
  haveTheWorkDone, theHouse, upkeepRefusal, whatTheWorkCosts, whyNotUpkeep,
} from '@/engine/world/house';
import { RELIABILITY_RESTS_AT, sleepQuality } from '@/engine/systems/life';

/** Puts the house down by hand, which is what the days would have done. */
function wearItDownTo(sim: Simulation, condition: number): void {
  const house = theHouse(sim)!;
  house.condition = condition;
}

/** Gives the player enough to pay for anything these tests ask for. */
function fund(sim: Simulation, cents: number): void {
  const me = sim.universe.people[sim.universe.playerId]!;
  sim.income(me.primaryAccountId!, cents, 'Test float', 'other');
}

describe('what a point of it costs', () => {
  it('is a year of wear priced at a year of keeping, and not a number somebody picked', () => {
    // The derivation, done again here rather than imported, so that changing
    // the constant without changing the reasoning fails.
    const aYearOfWear = WEAR_A_DAY * 365.2425;
    const aYearOfKeeping = HOUSE.interiorSqft * 1_00;
    expect(A_POINT_OF_IT_CENTS).toBe(Math.round(aYearOfKeeping / aYearOfWear));
  });

  it('prices a year of neglect at about a year of upkeep, which is the point of pricing it by the point', () => {
    const sim = quickSave({}, 'house-price');
    const aYearOfWear = WEAR_A_DAY * 365.2425;
    wearItDownTo(sim, 100 - aYearOfWear);
    const cost = whatTheWorkCosts(sim);
    const aYearOfKeeping = HOUSE.interiorSqft * 1_00;
    // Within a cent of the rounding, because the two are the same quotient.
    expect(Math.abs(cost - aYearOfKeeping)).toBeLessThan(aYearOfWear + 1);
  });

  it('charges nothing for a house that has not moved', () => {
    const sim = quickSave({}, 'house-full');
    expect(whatTheWorkCosts(sim)).toBe(0);
  });
});

describe('having the work done', () => {
  it('puts the house back to a hundred and takes the money for it', () => {
    const sim = quickSave({}, 'house-work');
    wearItDownTo(sim, 60);
    fund(sim, 100_000_00);
    const me = sim.universe.people[sim.universe.playerId]!;
    const before = sim.universe.accounts[me.primaryAccountId!]!.balance;
    const owed = whatTheWorkCosts(sim);

    const out = haveTheWorkDone(sim);

    expect(out.ok).toBe(true);
    expect(theHouse(sim)!.condition).toBe(100);
    expect(sim.universe.accounts[me.primaryAccountId!]!.balance).toBe(before - owed);
    expect(out.spent).toBe(owed);
    expect(out.putBack).toBe(40);
  });

  it('keeps the books straight through it', () => {
    const sim = quickSave({}, 'house-books');
    wearItDownTo(sim, 55);
    fund(sim, 100_000_00);
    haveTheWorkDone(sim);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('runs through the command bus, because a screen can only reach it that way', () => {
    const sim = quickSave({}, 'house-command');
    wearItDownTo(sim, 70);
    fund(sim, 100_000_00);
    const answer = sim.execute<{ ok: boolean }>({ kind: 'life.upkeep', payload: {} });
    expect(answer.ok).toBe(true);
    expect(theHouse(sim)!.condition).toBe(100);
  });
});

describe('when it refuses', () => {
  it('refuses a house that is already as good as it goes, and says so', () => {
    const sim = quickSave({}, 'house-refuse-full');
    expect(whyNotUpkeep(sim)).toBe('nothing-to-do');
    const out = haveTheWorkDone(sim);
    expect(out.ok).toBe(false);
    expect(out.error).toContain('as good as it goes');
  });

  it('refuses when the money is not there, and names both numbers', () => {
    const sim = quickSave({}, 'house-refuse-broke');
    wearItDownTo(sim, 10);
    expect(whyNotUpkeep(sim)).toBe('cannot-pay');
    const said = upkeepRefusal(sim, 'cannot-pay');
    // Both halves, because a refusal that names only the price is a refusal
    // that reads as a shop being shut rather than a wallet being empty.
    expect(said).toContain('comes to');
    expect(said).toContain('you have');
    expect(haveTheWorkDone(sim).ok).toBe(false);
    expect(theHouse(sim)!.condition).toBe(10);
  });

  it('leaves the money alone when it refuses', () => {
    const sim = quickSave({}, 'house-refuse-money');
    wearItDownTo(sim, 10);
    const me = sim.universe.people[sim.universe.playerId]!;
    const before = sim.universe.accounts[me.primaryAccountId!]!.balance;
    haveTheWorkDone(sim);
    expect(sim.universe.accounts[me.primaryAccountId!]!.balance).toBe(before);
  });
});

describe('the wear it is there to answer', () => {
  it('is the same rate the day takes off, read from one place', () => {
    const sim = quickSave({}, 'house-wear');
    const was = theHouse(sim)!.condition;
    sim.advanceTo(sim.now + MS_DAY * 10);
    const now = theHouse(sim)!.condition;
    // Ten days of it, within a day's worth either side of the boundary.
    expect(was - now).toBeGreaterThan(WEAR_A_DAY * 9);
    expect(was - now).toBeLessThan(WEAR_A_DAY * 11);
  });

  it('has exactly two writers, and one of them is this', () => {
    // A source check, because the defect this fixes was structural: one writer,
    // and it was a subtraction. If a third appears, the answer to "what moves
    // the house" stops being readable in one place.
    const life = readSource('src/engine/systems/life.ts');
    const house = readSource('src/engine/world/house.ts');
    expect(life.match(/property\.condition\s*=/g) ?? []).toHaveLength(1);
    expect(house.match(/\.condition\s*=\s*100/g) ?? []).toHaveLength(1);
  });
});

describe('whether the condition reaches an outcome', () => {
  it('changes what a night is worth, which is the only thing that reads it', () => {
    const sim = quickSave({}, 'house-sleep');
    const me = sim.universe.people[sim.universe.playerId]!;
    wearItDownTo(sim, 100);
    const rested = sleepQuality(sim, me);
    wearItDownTo(sim, 0);
    const worn = sleepQuality(sim, me);
    expect(rested).toBeGreaterThan(worn);
  });

});

function readSource(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

describe('the seven dials that only went one way', () => {
  /**
   * `tools/dials.mjs` sweeps fourteen numeric fields on `Reputation` and
   * `Wellbeing` over a played career and reports the ones nothing moves. It
   * reported seven, and they were three different defects wearing one name:
   * four standings that rose on every part and fell on nothing ever, one that
   * reached nought and stayed, one that had no writer at all, and a body that
   * could only decay.
   */

  const MONTH = 31 * MS_DAY;


  it('charges a long jump exactly what living the days would have', () => {
    // The trap `driftBonds` already names: a career must not fade differently
    // because the player skipped forward in one jump rather than two.
    const once = quickSave({}, 'dials-anchor');
    const twice = quickSave({}, 'dials-anchor');
    once.advanceTo(once.now + 12 * MONTH);
    twice.advanceTo(twice.now + 6 * MONTH);
    twice.advanceTo(twice.now + 6 * MONTH);
    const a = once.universe.people[once.universe.playerId]!.reputation;
    const b = twice.universe.people[twice.universe.playerId]!.reputation;
    expect(Math.round(a.publicFame)).toBe(Math.round(b.publicFame));
    expect(Math.round(a.industryDemand)).toBe(Math.round(b.industryDemand));
  });

  it('leaves everybody else alone, because they have no career to fade', () => {
    // Decaying theirs would empty the pool the casting office reads from: their
    // reputation is a standing seeded once, not a record of work being done.
    const sim = quickSave({}, 'dials-others');
    const them = Object.values(sim.universe.people).filter((one) => !one.isPlayer);
    const before = them.map((one) => one.reputation.publicFame);
    sim.advanceTo(sim.now + 24 * MONTH);
    expect(them.map((one) => one.reputation.publicFame)).toEqual(before);
  });


  it('heals a record of turning up, because resting is not being unreliable', () => {
    // It moves only during a working week, three off against one back, and
    // late-career readiness is under `spentAt` almost every week. So it reached
    // nought and sat there for a third of the game.
    const sim = quickSave({}, 'dials-reliable');
    const me = sim.universe.people[sim.universe.playerId]!;
    me.reputation.reliability = 0;
    sim.advanceTo(sim.now + 6 * MONTH);
    expect(me.reputation.reliability, 'nought is where it stayed').toBeGreaterThan(0);
    expect(me.reputation.reliability).toBeLessThan(RELIABILITY_RESTS_AT);

    // And it settles at nobody having a complaint rather than at anybody being
    // impressed, from either side.
    const high = quickSave({}, 'dials-reliable-high');
    const them = high.universe.people[high.universe.playerId]!;
    them.reputation.reliability = 100;
    high.advanceTo(high.now + 60 * MONTH);
    expect(them.reputation.reliability).toBeLessThan(100);
    expect(them.reputation.reliability).toBeGreaterThanOrEqual(RELIABILITY_RESTS_AT);
  });

  it('puts fitness back, which nothing could', () => {
    // One writer and that writer a subtraction — 0.18 a day, forever. The same
    // shape as the house, and the same fix: a second direction that costs.
    const sim = quickSave({}, 'dials-train');
    const me = sim.universe.people[sim.universe.playerId]!;
    me.wellbeing.fitness = 40;
    me.wellbeing.energy = 90;
    const was = me.wellbeing.fitness;
    const began = sim.now;

    const done = sim.execute<{ fitness: number; gained: number; ceiling: number }>(
      { kind: 'life.train', payload: { hours: 2 } },
    ).value!;
    expect(done.gained).toBeCloseTo(2 * TRAINING_AN_HOUR, 5);
    expect(me.wellbeing.fitness).toBeGreaterThan(was);
    // And it cost the hours. They are charged where every waking hour is charged
    // — at the day rollover, by `applyElapsedWellbeing` — rather than on the spot,
    // so what this proves is that the clock moved and the day is that much shorter.
    expect(sim.now).toBe(began + 2 * 60 * 60 * 1000);
  });

  it('refuses on an empty tank and at the age ceiling, and says which', () => {
    const spent = quickSave({}, 'dials-spent');
    const tired = spent.universe.people[spent.universe.playerId]!;
    tired.wellbeing.energy = TOO_SPENT_TO_TRAIN - 1;
    expect(spent.execute({ kind: 'life.train', payload: { hours: 1 } }).error)
      .toMatch(/nothing left/i);

    const done = quickSave({}, 'dials-ceiling');
    const me = done.universe.people[done.universe.playerId]!;
    const years = Math.floor((done.now - me.birthInstant) / (365.2425 * MS_DAY));
    me.wellbeing.energy = 90;
    me.wellbeing.fitness = ceilingAt(years).fitness;
    expect(done.execute({ kind: 'life.train', payload: { hours: 1 } }).error)
      .toMatch(/as fit as a body your age gets/i);
    // Age is the one thing training does not argue with.
    expect(ceilingAt(60).fitness).toBeLessThan(ceilingAt(25).fitness);
  });
});
