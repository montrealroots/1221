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
import { recordWages } from '@/engine/systems/earnings';
import { beginCareer } from '@/engine/systems/career';
import { instantFromZoned } from '@/engine/core/time';
import { TAX_NOTICE_KIND, armCollection, owedOn, returnsOf } from '@/engine/systems/taxreturn';

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

describe('a balance left owing', () => {
  /** A 2026 return filed with nothing in the bank to pay it. */
  function owing(seed: string): { sim: Simulation; zero: () => void } {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);
    beginCareer(sim, sim.player);
    recordWages(sim.player, instantFromZoned({ year: 2026, month: 5, day: 1, hour: 9 }, 'America/New_York'), 'America/New_York', { gross: 90_000_00 });
    const zero = () => { for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && !a.nominal && a.balance > 0 && (a.kind === 'checking' || a.kind === 'savings')) sim.post({ memo: 'test', category: 'test', postings: [{ accountId: a.id, amount: -a.balance }, { accountId: sim.nominalAccount('expense', 'Test').id, amount: a.balance }] }); };
    while (sim.now < instantFromZoned({ year: 2027, month: 2, day: 1, hour: 12 }, 'America/New_York')) sim.advanceTo(sim.now + 6 * 3_600_000);
    zero();
    expect(sim.execute({ kind: 'tax.file', payload: { year: 2026 } }).ok).toBe(true);
    return { sim, zero };
  }

  it('grows by the IRS’s 7% a year, compounded daily, and the late-payment half-point a month to a quarter', () => {
    const { sim } = owing('owing-grows');
    const r = returnsOf(sim.player)['2026']!;
    const owed = r.owed!;
    expect(owed).toBe(r.figures.balance);
    const year = owedOn(r, sim.now + 365 * MS_DAY);
    expect(year).toBe(Math.round(owed * (1 + 0.07 / 365) ** 365 + 0.06 * owed));
    // Past four years, the penalty has stopped at a quarter; the interest hasn't.
    const later = owedOn(r, sim.now + 5 * 365 * MS_DAY);
    expect(later).toBe(Math.round(owed * (1 + 0.07 / 365) ** (5 * 365) + 0.25 * owed));
  });

  it('is collected: four notices five weeks apart, the final one’s 30 days, then a levy on the bank accounts', () => {
    const { sim, zero } = owing('owing-levy');
    const r = returnsOf(sim.player)['2026']!;
    const titles = () => sim.universe.notifications.filter((n) => n.category === 'tax').map((n) => n.title);
    const filed = sim.now;
    const until = (days: number) => { while (sim.now < filed + days * MS_DAY) { zero(); sim.advanceTo(Math.min(filed + days * MS_DAY, sim.now + 6 * 3_600_000)); } };
    until(4 * 35 + 1);
    expect(titles()).toEqual(expect.arrayContaining(['A Reminder From The IRS', 'A Second Reminder From The IRS', 'The IRS Intends To Levy', 'Final Notice Of Intent To Levy']));
    expect(titles()).not.toContain('The IRS Levied Your Accounts');
    // Money in the bank before the levy: it's taken, to what's owed with its interest and penalty.
    // The open savings: kept empty, the current account went overdrawn and the bank closed it, as banks do, and moved the money.
    const savings = Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.kind === 'savings' && !a.closedAt)!;
    sim.post({ memo: 'test', category: 'test', postings: [{ accountId: savings.id, amount: 1_000_000_00 }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -1_000_000_00 }] });
    const due = owedOn(r, filed + (4 * 35 + 30) * MS_DAY);
    sim.advanceTo(filed + (4 * 35 + 31) * MS_DAY);
    expect(titles()).toContain('The IRS Levied Your Accounts');
    const levy = sim.universe.transactions.find((t) => t.memo === 'IRS levy, 2026 return')!;
    expect(levy.postings[0]!.amount).toBe(due);
    expect(r.owed).toBeUndefined();
  });

  it('begins collecting on a save from before, that holds a balance with none on the calendar', () => {
    const { sim } = owing('owing-legacy');
    for (const one of sim.universe.scheduled) if (one.kind === TAX_NOTICE_KIND && one.status === 'pending') sim.timeline.cancel(one.id, sim.now);
    armCollection(sim, sim.player);
    expect(sim.universe.scheduled.filter((i) => i.kind === TAX_NOTICE_KIND && i.status === 'pending')).toHaveLength(1);
  });
});
