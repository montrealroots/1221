/**
 * Retired (2026-09-28): the pension has federal tax withheld as the IRS's
 * default for a periodic payment has it, and a tax bill the person pays
 * reaches their savings. Found by playing lives to death: a retired actor
 * owed tens of thousands each year, and the bill was refused as more than
 * the bank could cover with millions in savings.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { computeAnnualTax } from '@/engine/content/tax';
import { earningsOf, yearOf } from '@/engine/systems/earnings';
import { SAG_PENSION, armPension, pensionOf } from '@/engine/systems/pension';
import { payFromBank } from '@/engine/systems/household';

const life = (seed: string): Simulation => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);
function earned(sim: Simulation, byYear: Record<number, number>): void {
  const years = earningsOf(sim.player).years;
  for (const [y, sag] of Object.entries(byYear)) years[y] = { acting: sag, residuals: 0, sag, workStudy: 0, unemployment: 0, withheld: 0, commission: 0, dues: 0, employers: {}, byResidence: {}, elsewhere: {}, foreign: {} } as never;
}

describe('the pension, retired', () => {
  it('has federal tax withheld each month, as for somebody single on the year the month makes, and credits it to the return', () => {
    const sim = life('pension-withheld');
    const years: Record<number, number> = {};
    for (let y = 1990; y < 2026; y += 1) years[y] = 200_000_00;
    earned(sim, years);
    sim.player.birthInstant = sim.now + MS_DAY - Math.round(SAG_PENSION.age * 365.2425 * MS_DAY);
    armPension(sim, sim.player);
    sim.advanceBy(2 * MS_DAY);
    const month = Math.round(pensionOf(sim, sim.player).yearly / 12);
    const paid = sim.universe.transactions.find((t) => t.memo === 'SAG-Producers Pension Plan, the month')!;
    const withheld = Math.round(computeAnnualTax(month * 12, 'us-ny-newyork', sim.now, { currency: 'USD' }).federal / 12);
    expect(withheld).toBeGreaterThan(1_000_00);
    expect(paid.postings.find((x) => x.accountId === sim.nominalAccount('expense', 'Tax Withheld').id)!.amount).toBe(withheld);
    expect(Math.max(...paid.postings.map((x) => x.amount))).toBe(month - withheld);
    expect(yearOf(sim.player, new Date(sim.now).getUTCFullYear()).withheld).toBe(withheld);
  });
});

describe('a bill the person pays', () => {
  it('reaches savings when checking is short, linked or not', () => {
    const sim = life('pays-from-savings');
    const mine = Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && !a.nominal);
    const checking = mine.find((a) => a.id === sim.player.primaryAccountId)!;
    const savings = mine.find((a) => a.kind === 'savings')!;
    const move = (from: typeof checking, to: typeof checking, amount: number) => sim.post({ memo: 'test', category: 'transfer', postings: [{ accountId: from.id, amount: -amount }, { accountId: to.id, amount }] });
    move(checking, savings, checking.balance - 100_00);
    expect(savings.balance).toBeGreaterThan(5_000_00);
    expect(payFromBank(sim, sim.player, 3_000_00, 'Income tax owed, 2026', 'tax')).toBe(true);
    expect(checking.balance).toBe(0);
    expect(payFromBank(sim, sim.player, checking.balance + savings.balance + 1, 'Too much', 'tax')).toBe(false);
  });
});
