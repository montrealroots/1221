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
import { careerOf } from '@/engine/systems/career';
import { PENSION_KIND, SAG_PENSION, armPension, earlyRefusal, pensionAge, pensionOf } from '@/engine/systems/pension';

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

  it('is held to the law’s ceiling: $290,000 a year, and never more than the best three years in a row', () => {
    // Until 2026-09-28 a long career's pension had no ceiling (IRC section 415(b), IRS Notice 2025-67).
    const big = life('pension-415');
    const years: Record<number, number> = {};
    for (let y = 1976; y < 2026; y += 1) years[y] = 400_000_00;
    earned(big, years);
    expect(pensionOf(big, big.player).yearly).toBe(290_000_00);
    // Twenty years of $60,000: 2% of them is $24,000, under both.
    const modest = life('pension-415-modest');
    const small: Record<number, number> = {};
    for (let y = 2006; y < 2026; y += 1) small[y] = 60_000_00;
    earned(modest, small);
    expect(pensionOf(modest, modest.player).yearly).toBe(24_000_00);
    // Fifty years at the Plan's minimum and three late years: the accrual passes the best three's average.
    const late = life('pension-415-three');
    const lean: Record<number, number> = {};
    for (let y = 1960; y < 2023; y += 1) lean[y] = 20_000_00;
    earned(late, lean);
    expect(pensionOf(late, late.player).yearly).toBe(20_000_00);
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

describe('the Plan’s finer rules', () => {
  it('counts a production’s earnings to its ceiling, and a year before the breakdown whole', () => {
    const sim = life('pension-ceiling');
    const years = earningsOf(sim.player).years;
    years['2024'] = { acting: 300_000_00, residuals: 0, sag: 300_000_00, sagByProject: { 'A Studio Film': 300_000_00 }, workStudy: 0, unemployment: 0, withheld: 0, commission: 0, dues: 0, employers: {}, byResidence: {}, elsewhere: {}, foreign: {} } as never;
    expect(pensionOf(sim, sim.player).years[0]!.earnings).toBe(SAG_PENSION.projectCeiling);
    delete (years['2024'] as unknown as { sagByProject?: unknown }).sagByProject;
    expect(pensionOf(sim, sim.player).years[0]!.earnings).toBe(300_000_00);
  });

  it('counts a television episode to its length’s ceiling, and a season to its episodes’', () => {
    const sim = life('pension-episodes');
    const career = careerOf(sim.player);
    career.bookings.push({ id: 'b-guest', roleId: 'guest-hour', units: 5 } as never, { id: 'b-series', roleId: 'series-half', units: 13 } as never);
    const years = earningsOf(sim.player).years;
    years['2024'] = { acting: 0, residuals: 0, sag: 140_000_00, sagByProject: { 'b-guest': 50_000_00, 'b-series': 90_000_00 }, workStudy: 0, unemployment: 0, withheld: 0, commission: 0, dues: 0, employers: {}, byResidence: {}, elsewhere: {}, foreign: {} } as never;
    // A guest hour: one episode, to $35,000. A half-hour season of thirteen: to $325,000, so all of it.
    expect(pensionOf(sim, sim.player).years[0]!.earnings).toBe(SAG_PENSION.episodeCeiling.hour + 90_000_00);
  });

  it('starts early from 55 with ten credits, a quarter of a percent less a month under 65, and pays it onto the return', () => {
    const sim = life('pension-early-start');
    const ten = Object.fromEntries(Array.from({ length: 10 }, (_, n) => [2015 + n, 30_000_00]));
    earned(sim, ten);
    // Fifty-four: too young.
    sim.player.birthInstant = sim.now - Math.round(54.5 * 365.2425 * MS_DAY);
    expect(earlyRefusal(sim, sim.player)).toMatch(/at the earliest/);
    // Sixty exactly: five years early, sixty months, 15% less.
    sim.player.birthInstant = sim.now - Math.round(60 * 365.2425 * MS_DAY) - 2 * MS_DAY;
    expect(earlyRefusal(sim, sim.player)).toBeUndefined();
    const { factor } = sim.must<{ factor: number }>({ kind: 'pension.start', payload: {} });
    expect(factor).toBeCloseTo(1 - 60 * SAG_PENSION.earlyPerMonth, 6);
    sim.advanceBy(2 * MS_DAY);
    const month = Math.round((pensionOf(sim, sim.player).yearly * factor) / 12);
    const paid = sim.universe.transactions.filter((t) => t.memo === 'SAG-Producers Pension Plan, the month');
    expect(paid).toHaveLength(1);
    expect(Math.max(...paid[0]!.postings.map((x) => x.amount))).toBe(month);
    expect(earningsOf(sim.player).years[String(new Date(sim.now).getUTCFullYear())]!.pension).toBe(month);
    expect(sim.execute({ kind: 'pension.start', payload: {} }).ok).toBe(false);
    // Nine credits: not early.
    const nine = life('pension-nine');
    earned(nine, Object.fromEntries(Array.from({ length: 9 }, (_, n) => [2016 + n, 30_000_00])));
    nine.player.birthInstant = nine.now - Math.round(60 * 365.2425 * MS_DAY);
    expect(earlyRefusal(nine, nine.player)).toMatch(/10 Pension Credits/);
  });
});
