/**
 * Retired (2026-09-28): the pension has federal tax withheld as the IRS's
 * default for a periodic payment has it, and a tax bill the person pays
 * reaches their savings. Found by playing lives to death: a retired actor
 * owed tens of thousands each year, and the bill was refused as more than
 * the bank could cover with millions in savings.
 */
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY,instantFromZoned } from '@/engine/core/time';
import { recordWages } from '@/engine/systems/earnings';
import { payFromBank } from '@/engine/systems/spending';
import { SUBSTITUTE,TAX_NOTICE_KIND,armCollection,latePenalty,owedOn,returnsOf } from '@/engine/systems/taxreturn';
import { describe,expect,it } from 'vitest';

const life = (seed: string): Simulation => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);

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

describe('a return never filed', () => {
  it('is filed by the IRS a year after it was due, answerable for 120 days, then assessed and collected', () => {
    // Until 2026-09-28 a return never filed was never asked for.
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'never-filed');
    recordWages(sim.player, instantFromZoned({ year: 2026, month: 5, day: 1, hour: 9 }, 'America/New_York'), 'America/New_York', { gross: 90_000_00 });
    const step = (until: number) => { while (sim.now < until) sim.advanceTo(Math.min(until, sim.now + 12 * 3_600_000)); };
    step(instantFromZoned({ year: 2027, month: 2, day: 2, hour: 12 }, 'America/New_York'));
    const r = returnsOf(sim.player)['2026']!;
    expect(r.figures.balance).toBeGreaterThan(0);
    const titles = () => sim.universe.notifications.filter((n) => n.category === 'tax').map((n) => n.title);
    step(r.due + (SUBSTITUTE.afterDays - 1) * MS_DAY);
    expect(titles()).not.toContain('The IRS Figured Your 2026 Return');
    step(r.due + (SUBSTITUTE.afterDays + 1) * MS_DAY);
    expect(titles()).toContain('The IRS Figured Your 2026 Return');
    expect(r.filedAt).toBeUndefined();
    step(r.due + (SUBSTITUTE.afterDays + SUBSTITUTE.answerDays + 1) * MS_DAY);
    expect(titles()).toContain('The IRS Assessed Your 2026 Return');
    expect(r.substitute).toBe(true);
    // Its File It lapsed on the due date; nothing asks them to file it now.
    expect(Object.values(sim.universe.decisions).filter((d) => d.refType === 'return' && d.refId === '2026' && !d.resolvedAt)).toHaveLength(0);
    // The late-filing penalty and the interest from the due date, on the balance.
    expect(r.penalty).toBe(latePenalty(r.figures.balance, r.due, r.filedAt!, 'USD'));
    expect(r.owed).toBeGreaterThan(r.figures.balance + r.penalty!);
    expect(sim.universe.scheduled.some((i) => i.kind === TAX_NOTICE_KIND && i.status === 'pending')).toBe(true);
  });

  it('is left to them if they file in the months the IRS gives', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'files-late');
    recordWages(sim.player, instantFromZoned({ year: 2026, month: 5, day: 1, hour: 9 }, 'America/New_York'), 'America/New_York', { gross: 90_000_00 });
    const step = (until: number) => { while (sim.now < until) sim.advanceTo(Math.min(until, sim.now + 12 * 3_600_000)); };
    step(instantFromZoned({ year: 2027, month: 2, day: 2, hour: 12 }, 'America/New_York'));
    const r = returnsOf(sim.player)['2026']!;
    step(r.due + (SUBSTITUTE.afterDays + 10) * MS_DAY);
    expect(sim.execute({ kind: 'tax.file', payload: { year: 2026 } }).ok).toBe(true);
    step(r.due + (SUBSTITUTE.afterDays + SUBSTITUTE.answerDays + 5) * MS_DAY);
    expect(r.substitute).toBeUndefined();
  });
});
