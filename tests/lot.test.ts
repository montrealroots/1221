/**
 * SLATE — the lot as a business, and whether it is one.
 *
 * Sugar Land has four stages on it and the family paid for them. This holds the
 * engine to the honest answer about what that bought, because the answer is bad
 * and a bad answer that nothing pins is an answer that drifts.
 *
 * The finding these exist to keep: a lot nobody has heard of, in a country with
 * no crew, does not fill. Five years of doing nothing gives about nine bookings
 * a year and under a fifth of the stage-weeks sold, against a break-even that
 * needs three fifths of them. The family covers the difference out of the sugar
 * money, every month, for as long as the save runs.
 *
 * That is not a number to tune until it looks better. It is what a speculative
 * build in a hard place does, and the research is full of lots it did it to.
 * What these tests hold is that it stays true for a player who does nothing —
 * so that anything which changes it has to be something the player did.
 */

import { describe, expect, it } from 'vitest';
import { quickSave, validateUniverse } from '@/engine';
import type { Simulation } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { MONTHLY_OVERHEAD_CENTS, OVERHEAD } from '@/engine/content/lot';
import {
  breakEvenShare, paidInSoFar, stagesOn, utilisation, whereTheLotStands,
} from '@/engine/world/lot';

/** Five years of the world running, with nobody doing anything about it. */
function fiveYears(seed: string): { sim: Simulation; from: number } {
  const sim = quickSave({}, seed);
  const from = sim.now;
  sim.advanceTo(from + 5 * 365 * MS_DAY);
  return { sim, from };
}

const SEEDS = ['lot-a', 'lot-b', 'lot-c'];
const asYear = (cents: number): number => Math.round(cents / 100 / 1_000_000);

// ---------------------------------------------------------------------------

describe('what the family actually bought', () => {
  it('put four stages on the land and keeps them standing', () => {
    const { sim } = fiveYears('lot-standing');
    const stages = stagesOn(sim);
    expect(stages).toHaveLength(4);
    for (const stage of stages) {
      expect(stage.floorSqm).toBeGreaterThan(0);
      expect(stage.weekRateCents).toBeGreaterThan(0);
    }
  });

  it('charges for the place whether or not anybody is on it', () => {
    // Seven lines, posted separately, because one figure called overhead is a
    // figure nobody can argue with. These are what a lot costs to keep open.
    expect(OVERHEAD.length).toBeGreaterThan(5);
    expect(MONTHLY_OVERHEAD_CENTS).toBe(OVERHEAD.reduce((n, line) => n + line.monthlyCents, 0));
    const { sim } = fiveYears('lot-overhead');
    for (const line of OVERHEAD) {
      const posted = sim.universe.transactions.filter((t) => t.memo.includes(line.label)).length;
      expect(posted, `${line.label} was never charged`).toBeGreaterThan(50);
    }
  });

  it('needs three fifths of its stage-weeks sold to cover a month', () => {
    const { sim } = fiveYears('lot-breakeven');
    const need = breakEvenShare(sim)!;
    // Derived from the rate card against the overhead, not written down. It is
    // a hard number for a small lot and that is the point of it.
    expect(need).toBeGreaterThan(0.5);
    expect(need).toBeLessThan(0.75);
  });
});

describe('and it does not fill', () => {
  it('takes about nine bookings a year, doing nothing about it', () => {
    for (const seed of SEEDS) {
      const { sim } = fiveYears(seed);
      const ayear = Object.values(sim.universe.bookings).length / 5;
      expect(ayear, `${seed} took ${ayear} bookings a year`).toBeGreaterThan(6);
      expect(ayear, `${seed} took ${ayear} bookings a year`).toBeLessThan(13);
    }
  });

  it('sells under a fifth of its stage-weeks, against the three fifths it needs', () => {
    for (const seed of SEEDS) {
      const { sim, from } = fiveYears(seed);
      const five = utilisation(sim, from, sim.now);
      const got = five.share ?? 0;
      const need = breakEvenShare(sim)!;
      expect(got, `${seed} ran at ${Math.round(got * 100)}/100`).toBeLessThan(0.3);
      expect(got, `${seed} ran at ${Math.round(got * 100)}/100`).toBeGreaterThan(0.05);
      // The gap is the whole finding. Half of what it needs would be a business
      // in trouble; a third of what it needs is a different kind of thing.
      expect(got).toBeLessThan(need / 2);
    }
  });

  it('loses money every year, and the family covers it out of the sugar', () => {
    for (const seed of SEEDS) {
      const { sim, from } = fiveYears(seed);
      const five = utilisation(sim, from, sim.now);
      const earnedAYear = five.earnsCents / 5;
      const costAYear = MONTHLY_OVERHEAD_CENTS * 12;
      expect(earnedAYear, `${seed} earned ${asYear(earnedAYear)}m a year`).toBeLessThan(costAYear / 2);
      // And somebody is writing the check. Without this the company's cash
      // just goes negative and stays there with nothing saying who is funding it.
      expect(paidInSoFar(sim), seed).toBeGreaterThan(20_000_000_00);
    }
  });

  it('says so plainly rather than describing itself as quiet', () => {
    const { sim } = fiveYears('lot-says');
    const said = whereTheLotStands(sim);
    expect(said).toContain('4 stages');
    expect(said).toMatch(/62% full to cover a month/);
  });

  it('keeps the books straight while doing all of it', () => {
    const { sim } = fiveYears('lot-books');
    expect(validateUniverse(sim.universe).errors).toEqual([]);
    expect(sim.ledger.audit()).toEqual([]);
  });
});
