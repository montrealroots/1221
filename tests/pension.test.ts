/**
 * The SAG-Producers Pension Plan (`systems/pension.ts`): a credit for a year
 * of covered earnings at the minimum, vesting at ten or at five without a
 * break, a pension of 2% of the years' earnings a year, paid monthly from 65;
 * and a fund from before paid out then.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { earningsOf } from '@/engine/systems/earnings';
import { PENSION_KIND, SAG_PENSION, armPension, pensionAge, pensionOf } from '@/engine/systems/pension';

const life = (seed: string): Simulation => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);
/** Covered earnings, a year at a time, in the years before now. */
function earned(sim: Simulation, byYear: Record<number, number>): void {
  const years = earningsOf(sim.player).years;
  for (const [y, sag] of Object.entries(byYear)) years[y] = { acting: sag, residuals: 0, sag, workStudy: 0, unemployment: 0, withheld: 0, commission: 0, dues: 0, employers: {}, byResidence: {}, elsewhere: {}, foreign: {} } as never;
}

describe('the Plan', () => {
  it('counts a year at the minimum a credit, vests at ten or at five without a break, and adds 2% of the years’ earnings', () => {
    const sim = life('pension-credits');
    earned(sim, { 2014: 30_000_00, 2015: 19_000_00, 2016: 25_000_00, 2017: 40_000_00, 2018: 21_000_00, 2019: 22_000_00 });
    const p = pensionOf(sim, sim.player);
    expect(p.years.map((y) => y.credit)).toEqual([true, false, true, true, true, true]);
    expect(p.credits).toBe(5);
    expect(p.yearly).toBe(Math.round((30_000_00 + 19_000_00 + 25_000_00 + 40_000_00 + 21_000_00 + 22_000_00) * SAG_PENSION.accrual));
    // Five, but the last was more than five years ago: a break, not vested.
    expect(p.vested).toBe(false);
    earned(sim, { 2022: 20_000_00, 2023: 20_000_00, 2024: 20_000_00, 2025: 20_000_00 });
    expect(pensionOf(sim, sim.player)).toMatchObject({ credits: 9, vested: true });
    // Five in a row, lately: vested early.
    const early = life('pension-early');
    earned(early, { 2021: 20_000_00, 2022: 20_000_00, 2023: 20_000_00, 2024: 20_000_00, 2025: 20_000_00 });
    expect(pensionOf(early, early.player)).toMatchObject({ credits: 5, vested: true });
    // This year's earnings aren't a year yet.
    earned(early, { 2026: 90_000_00 });
    expect(pensionOf(early, early.player).credits).toBe(5);
  });

  it('pays monthly from 65, vested, and pays out a fund from before once', () => {
    const sim = life('pension-pay');
    earned(sim, { 2016: 50_000_00, 2017: 50_000_00, 2018: 50_000_00, 2019: 50_000_00, 2020: 50_000_00, 2021: 50_000_00, 2022: 50_000_00, 2023: 50_000_00, 2024: 50_000_00, 2025: 50_000_00 });
    // Sixty-five in a day's time.
    sim.player.birthInstant = sim.now + MS_DAY - Math.round(SAG_PENSION.age * 365.2425 * MS_DAY);
    const fund = Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.kind === 'savings')!;
    fund.category = 'pension';
    const held = fund.balance;
    expect(held).toBeGreaterThan(0);
    armPension(sim, sim.player);
    armPension(sim, sim.player);
    expect(sim.universe.scheduled.filter((i) => i.kind === PENSION_KIND && i.status === 'pending')).toHaveLength(1);
    expect(pensionAge(sim.player)).toBeGreaterThan(sim.now);
    sim.advanceBy(2 * MS_DAY);
    expect(fund.closedAt).toBeDefined();
    expect(fund.balance).toBe(0);
    const paid = () => sim.universe.transactions.filter((t) => t.memo === 'SAG-Producers Pension Plan, the month');
    expect(paid()).toHaveLength(1);
    expect(Math.max(...paid()[0]!.postings.map((x) => x.amount))).toBe(Math.round(pensionOf(sim, sim.player).yearly / 12));
    sim.advanceBy(31 * MS_DAY);
    expect(paid()).toHaveLength(2);
  });
});
