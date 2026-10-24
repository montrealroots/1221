/**
 * A tax balance paid in parts, an amended return, and the IRS's substitute return replaced before and after it's assessed
 * (from 2026-10-10, `systems/taxreturn.ts`). PLAYER JOURNEYS play forward through commands; FIXTURES set a state by hand
 * to reach one rule, and say so.
 */
import { describe, expect, it } from 'vitest';
import { loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { recordWages, yearOf } from '@/engine/systems/earnings';
import { AMEND, SUBSTITUTE, TAX_NOTICE_KIND, TAX_SFR_KIND, owedOn, partsOn, returnsOf } from '@/engine/systems/taxreturn';

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, NY);
const play = (sim: Simulation, until: number) => { while (sim.now < until) sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR), { stopOnPlayerRequired: true }); };
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const life = (seed: string) => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', wealth: 'wealthy' }, seed);
/** FIXTURE: every account emptied, as a life with nothing in the bank has them. */
const broke = (sim: Simulation) => { for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && a.balance > 0) a.balance = 0; };
/** The failure-to-pay rate charged by a moment: half a percent a month or part since filing, to a quarter. */
const payLate = (filedAt: number, now: number) => Math.min(0.25, 0.005 * Math.ceil((now - filedAt) / (30.4375 * MS_DAY)));
const fund = (sim: Simulation, amount: number) => sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: sim.player.primaryAccountId!, amount }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -amount }] });

/** A 2026 return filed with nothing in the bank, so its balance is owed. */
function owing(seed: string): Simulation {
  const sim = life(seed);
  recordWages(sim.player, at(2026, 5, 1), NY, { gross: 40_000_00 });
  play(sim, at(2027, 2, 1, 12));
  broke(sim);
  sim.must({ kind: 'tax.file', payload: { year: 2026 } });
  return sim;
}

describe('PLAYER JOURNEY: a tax balance paid in parts, then corrected', () => {
  it('applies each part to the tax, then the penalty, then the interest; the next months’ penalty falls with the tax; an amended return adds what a late form showed', () => {
    let sim = owing('tx-parts');
    const r = () => returnsOf(sim.player)['2026']!;
    // The IRS's part of the year (from the integration pass of 2026-10-10): New York's is owed to New York, apart.
    const tax = r().figures.owedTo!.irs;
    expect(r().parts).toEqual({ tax, penalty: 0, interest: 0 });
    expect(r().stateDue!['us-ny']!.parts!.tax).toBe(r().figures.owedTo!.states['us-ny']);
    // Before the due date, filed early: nothing added yet (IRC 6601(a), 6651(a)(2); until the integration pass of
    // 2026-10-10 both ran from filing).
    expect(partsOn(r(), r().due - MS_DAY)).toEqual({ tax, penalty: 0, interest: 0 });
    // Two months past the due date: the penalty, half a percent a month on the tax, and the interest beside it.
    play(sim, r().due + 61 * MS_DAY);
    const two = partsOn(r(), sim.now);
    const rateTwo = payLate(r().due, sim.now);
    expect(two.penalty).toBe(Math.round(rateTwo * tax));
    expect(two.interest).toBeGreaterThan(0);
    // A part: all of it to the tax.
    fund(sim, tax);
    const paid = sim.must<{ tax: number; penalty: number; interest: number; owed: number }>({ kind: 'tax.pay', payload: { year: 2026, amount: Math.round(tax / 2) } });
    expect(paid).toMatchObject({ tax: Math.round(tax / 2), penalty: 0, interest: 0 });
    expect(r().parts!.tax).toBe(tax - Math.round(tax / 2));
    expect(r().parts!.penalty).toBe(two.penalty);
    // A month later the penalty grows on the half left, not the whole.
    sim = reload(sim);
    play(sim, sim.now + 31 * MS_DAY);
    const three = partsOn(r(), sim.now);
    expect(three.penalty - two.penalty).toBe(Math.round((payLate(r().due, sim.now) - rateTwo) * (tax - Math.round(tax / 2))));
    // More than owed is refused; the rest pays it off and the IRS's notices stop.
    expect(sim.execute({ kind: 'tax.pay', payload: { year: 2026, amount: owedOn(r(), sim.now) + 1 } }).error).toMatch(/Pay that amount or less/);
    fund(sim, owedOn(r(), sim.now) + 10_000_00);
    sim.must({ kind: 'tax.pay', payload: { year: 2026 } });
    expect(r().owed).toBeUndefined();
    expect(r().payments!.map((p) => p.how)).toEqual(['payment', 'payment']);
    expect(r().payments![1]!.penalty).toBe(three.penalty);
    expect(sim.universe.scheduled.some((i) => i.kind === TAX_NOTICE_KIND && i.status === 'pending')).toBe(false);
    // FIXTURE: a corrected W-2 arriving after filing, $5,000 of wages the return didn't carry.
    yearOf(sim.player, 2026).acting += 5_000_00;
    const amended = sim.must<{ change: number; processAt: number; form: string }>({ kind: 'tax.amend', payload: { year: 2026 } });
    expect(amended.change).toBeGreaterThan(0);
    expect(amended.form).toBe('1040-X');
    expect(sim.execute({ kind: 'tax.amend', payload: { year: 2026 } }).error).toMatch(/with the IRS/);
    sim = reload(sim);
    play(sim, amended.processAt + MS_HOUR);
    expect(r().amended![0]!.processedAt).toBeDefined();
    // The 1040-X's part is the IRS's; New York's IT-201-X part is New York's, owed to it from the due date.
    expect(r().parts!.tax).toBe(r().amended![0]!.irs);
    expect(r().amended![0]!.irs! + (r().amended![0]!.states?.['us-ny'] ?? 0)).toBe(amended.change);
    expect(r().stateDue!['us-ny']!.owed).toBeGreaterThan(r().amended![0]!.states!['us-ny']!);
    expect(r().parts!.interest).toBeGreaterThan(0);
    expect(titled(sim, 'Your Amended 2026 Return Is Processed')).toHaveLength(1);
  }, 60_000);

  it('an amended return showing less tax takes it off what’s owed first, and refunds the rest with the IRS’s interest', () => {
    const sim = owing('tx-less');
    const r = returnsOf(sim.player)['2026']!;
    fund(sim, 100_000_00);
    sim.must({ kind: 'tax.pay', payload: { year: 2026 } });
    expect(sim.execute({ kind: 'tax.amend', payload: { year: 2026 } }).error).toMatch(/nothing to amend/);
    // FIXTURE: a W-2 that overstated the wages by $10,000, corrected after filing, in the summer: the IRS's interest on a
    // refund runs from the later of the due date and the filing, so a correction before 15 April earns none.
    play(sim, at(2027, 7, 1));
    yearOf(sim.player, 2026).acting -= 10_000_00;
    const amended = sim.must<{ change: number; processAt: number }>({ kind: 'tax.amend', payload: { year: 2026 } });
    expect(amended.change).toBeLessThan(0);
    play(sim, amended.processAt + MS_HOUR);
    const a = r.amended![0]!;
    // The IRS refunds its own part; New York takes its part off what's owed to it first.
    expect(a.refund).toBe(-a.irs!);
    expect(a.irs! + (a.states?.['us-ny'] ?? 0)).toBe(amended.change);
    expect(a.interest).toBeGreaterThan(0);
    expect(sim.universe.transactions.some((t) => t.memo === 'Tax refund, amended 2026 return, with interest')).toBe(true);
  }, 60_000);
});

describe('the IRS’s substitute return', () => {
  /** A 2026 return never filed, owing, played to the IRS's proposal. */
  function unfiled(seed: string): Simulation {
    const sim = life(seed);
    recordWages(sim.player, at(2026, 5, 1), NY, { gross: 40_000_00 });
    play(sim, at(2027, 2, 1, 12));
    const r = returnsOf(sim.player)['2026']!;
    // FIXTURE: the clock brought to a year past the due date, when the IRS proposes its own, without playing the year.
    sim.universe.scheduled.filter((i) => i.kind === TAX_SFR_KIND).forEach((i) => sim.timeline.cancel(i.id, sim.now));
    sim.schedule({ at: sim.now + MS_HOUR, kind: TAX_SFR_KIND, label: 'The IRS', category: 'system', priority: 20, payload: { personId: sim.player.id, year: r.year, step: 'proposed' } });
    play(sim, sim.now + 2 * MS_HOUR);
    return sim;
  }

  it('is replaced before it’s assessed by a return of their own, and nothing of it is assessed', () => {
    const sim = unfiled('tx-sfr-before');
    expect(titled(sim, 'The IRS Figured Your 2026 Return')).toHaveLength(1);
    broke(sim);
    fund(sim, 100_000_00);
    sim.must({ kind: 'tax.file', payload: { year: 2026 } });
    play(sim, sim.now + (SUBSTITUTE.answerDays + 2) * MS_DAY);
    const r = returnsOf(sim.player)['2026']!;
    expect(r.substitute).toBeUndefined();
    expect(titled(sim, 'The IRS Assessed Your 2026 Return')).toHaveLength(0);
  }, 60_000);

  it('PLAYER JOURNEY: assessed, partly levied, then reconsidered on their own return: the tax becomes theirs, penalty and interest in proportion, and what was paid past it comes back', () => {
    let sim = unfiled('tx-sfr-after');
    broke(sim);
    play(sim, sim.now + (SUBSTITUTE.answerDays + 2) * MS_DAY);
    const r = () => returnsOf(sim.player)['2026']!;
    expect(r().substitute).toBe(true);
    // FIXTURE: the IRS's figures counted a 1099 twice, $8,000 of tax more than their own return shows.
    const own = r().figures.balance;
    // The IRS assessed its own part only (from the integration pass of 2026-10-10), New York's not being its to assess.
    const irs = r().figures.owedTo!.irs;
    expect(r().parts!.tax).toBe(irs);
    expect(r().stateDue).toBeUndefined();
    r().substituteFigures = { ...r().substituteFigures!, balance: own + 8_000_00 };
    r().parts = { ...r().parts!, tax: irs + 8_000_00 };
    r().owed = r().parts!.tax + r().parts!.penalty + r().parts!.interest;
    // A part paid, the most the bank holds.
    const primary = sim.universe.accounts[sim.player.primaryAccountId!]!;
    fund(sim, irs + 2_000_00 - Math.min(0, primary.balance));
    sim.must({ kind: 'tax.pay', payload: { year: 2026, amount: irs + 2_000_00 } });
    const penaltyBefore = r().parts!.penalty;
    sim = reload(sim);
    sim.must({ kind: 'tax.file', payload: { year: 2026 } });
    expect(r().substitute).toBe(false);
    expect(r().reconsideredAt).toBeDefined();
    expect(r().parts?.tax ?? 0).toBe(0);
    expect(r().penalty).toBeLessThan(penaltyBefore + 1);
    expect(sim.universe.transactions.some((t) => t.memo === 'Tax refund, 2026: the IRS’s return replaced by yours' && t.postings[0]!.amount === 2_000_00)).toBe(true);
    // New York's side, filed now for the first time with its late penalties, owed to New York.
    expect(r().stateDue!['us-ny']!.filedAt).toBe(sim.now);
    expect(r().stateDue!['us-ny']!.penalty).toBeGreaterThan(0);
    expect(sim.execute({ kind: 'tax.file', payload: { year: 2026 } }).error).toMatch(/amended return/);
  }, 60_000);
});

describe('amending', () => {
  it('runs out three years after filing', () => {
    const sim = owing('tx-late');
    const r = returnsOf(sim.player)['2026']!;
    // FIXTURE: filed long ago.
    r.filedAt = sim.now - (AMEND.years * 365.25 + 1) * MS_DAY;
    delete r.payments;
    expect(sim.execute({ kind: 'tax.amend', payload: { year: 2026 } }).error).toMatch(/time to amend it ran out/);
  }, 60_000);
});
