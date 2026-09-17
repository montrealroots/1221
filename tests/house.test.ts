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
import {
  haveTheWorkDone, theHouse, upkeepRefusal, whatTheWorkCosts, whyNotUpkeep,
} from '@/engine/world/house';
import { readiness, sleepQuality } from '@/engine/systems/life';
import { playACareer } from './played';

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

  it('decides how ready somebody is over a career, which is what the room reads', () => {
    // The falsifiability test, run as a test. Same seed both sides; the only
    // difference is whether the work is ever had done.
    //
    // It asserts readiness rather than parts won, and the reason is a number
    // worth knowing before trusting this lever: paired over six seeds of
    // twenty-five played years, keeping the house moves readiness in the last
    // third from 19.3 to 46.6 and career earnings from EUR 1.92m to 2.20m, and
    // moves parts won by three of a hundred and fifteen. Parts are too small
    // and too noisy to pin on one seed. Readiness is the term `heardItRight`
    // reads on every reading, so it is the mechanism rather than a meter.
    //
    // Twelve years rather than twenty-five because that is where this stops
    // being cheap, and the claim about the whole career — no seed reaching
    // reliability nought with the house kept, six of six without — is measured
    // and recorded in `world/house.ts` rather than paid for on every gate run.
    const ready = (keep: boolean) => {
      const sim = quickSave({}, 'house-career');
      fund(sim, 5_000_000_00);
      const seen: number[] = [];
      playACareer(sim, 12, {
        eachWeek: (s) => {
          if (keep && whyNotUpkeep(s) === undefined) haveTheWorkDone(s);
          const me = s.universe.people[s.universe.playerId];
          if (me) seen.push(readiness(me));
        },
      });
      return seen.slice(-52).reduce((a, b) => a + b, 0) / 52;
    };

    const left = ready(false);
    const kept = ready(true);
    expect(kept).toBeGreaterThan(left + 1);
  });
});

function readSource(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}
