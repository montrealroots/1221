/**
 * What the bank lends and holds, the way each bank does it.
 *
 * Each claim in `systems/lending.ts` against the researched terms in
 * `content/banks-lending.ts`: Chase's fee by the item, capped by the day and
 * spared under its grace; an arranged overdraft's interest past its free
 * buffer, charged on the first, its limit and the rate a record earns;
 * CommBank's midnight fee; MUFG's loan against time deposits; a personal
 * loan paid down month by month, missed onto the record, and paid off; a
 * term deposit locked and paid out; and a switch, the same day or through
 * Britain's seven working days.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';
import { MS_DAY, instantFromZoned } from '@/engine/core/time';
import { spend } from '@/engine/systems/household';
import { bankAccountsOf, bankOf } from '@/engine/systems/banking';
import {
  LOAN_DUE_KIND, SWITCH_KIND, loanOf, monthlyPayment, overdraftHeadroom, overdraftOffer, overdraftRoom, rateForRecord, termsOf,
} from '@/engine/systems/lending';

const lifeIn = (cityId: string, extra: Record<string, unknown> = {}, seed = 'lend') =>
  quickSave({ startLocationId: cityId, homeRegionId: cityId, livesWhereBorn: true, dayJob: false, ...extra }, seed);
const current = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!;
const savings = (sim: Simulation) => bankAccountsOf(sim, sim.player).find((a) => a.kind === 'savings');

function set(sim: Simulation, account: Account | undefined, amount: number): void {
  if (!account) return;
  const diff = amount - account.balance;
  if (diff !== 0) {
    sim.post({ memo: 'Test', category: 'test', postings: [{ accountId: account.id, amount: diff }, { accountId: sim.nominalAccount('equity', 'Test').id, amount: -diff }] });
  }
}
function wages(sim: Simulation, amount: number): void {
  sim.post({ memo: 'Wages', category: 'salary', postings: [{ accountId: current(sim).id, amount }, { accountId: sim.nominalAccount('income', 'Wages').id, amount: -amount }] });
}
const feesOn = (sim: Simulation, account: Account, memo: string) => sim.universe.transactions
  .filter((t) => t.memo.startsWith(memo)).flatMap((t) => t.postings).filter((p) => p.accountId === account.id).map((p) => p.amount);

describe('an overdraft by the item', () => {
  it('charges Chase’s $34 an item past $50, three a day at most', () => {
    const sim = lifeIn('us-ny-newyork', { bankId: 'us-chase' });
    set(sim, current(sim), 100_00);
    set(sim, savings(sim), 0);
    const account = current(sim);
    expect(spend(sim, sim.player, 120_00, 'Test', 'food')).toBe(true);
    // Overdrawn by $20: inside the grace, no fee.
    expect(account.balance).toBe(-20_00);
    expect(feesOn(sim, account, 'Overdraft fee')).toEqual([]);
    spend(sim, sim.player, 100_00, 'Test', 'food');
    expect(feesOn(sim, account, 'Overdraft fee')).toEqual([-34_00]);
    for (let i = 0; i < 4; i += 1) spend(sim, sim.player, 10_00, 'Test', 'food');
    expect(feesOn(sim, account, 'Overdraft fee')).toEqual([-34_00, -34_00, -34_00]);
  });

  it('covers only so far, then the card takes it', () => {
    const sim = lifeIn('us-ny-newyork', { bankId: 'us-chase', wealth: 'scraping' });
    set(sim, current(sim), 0);
    set(sim, savings(sim), 0);
    expect(overdraftRoom(sim, sim.player)).toBe(500_00);
    spend(sim, sim.player, 700_00, 'Test', 'food');
    expect(current(sim).balance).toBeGreaterThanOrEqual(-500_00 - 34_00 * 3);
    expect(overdraftHeadroom(sim, sim.player)).toBe(0);
  });

  it('charges CommBank’s $15 for an account still overdrawn at midnight, with interest', () => {
    const sim = lifeIn('au-nsw-sydney', { bankId: 'au-commbank' });
    set(sim, current(sim), 0);
    set(sim, savings(sim), 0);
    spend(sim, sim.player, 200_00, 'Test', 'food');
    expect(feesOn(sim, current(sim), 'Overdraft fee')).toEqual([]);
    sim.advanceBy(MS_DAY);
    expect(feesOn(sim, current(sim), 'Overdrawn at midnight').length).toBeGreaterThanOrEqual(1);
    expect(current(sim).odAccrued ?? 0).toBeGreaterThan(0);
  });
});

describe('an arranged overdraft', () => {
  it('is refused without wages paid in, and arranged up to a month of them', () => {
    const sim = lifeIn('uk-eng-london', { bankId: 'gb-barclays' });
    expect('refused' in overdraftOffer(sim, sim.player)).toBe(true);
    wages(sim, 2_000_00);
    const offer = overdraftOffer(sim, sim.player);
    expect(offer).toEqual({ min: 1_00, max: 2_000_00, rate: 0.35 });
    expect(sim.execute({ kind: 'bank.arrange_overdraft', payload: { limit: 2_500_00 } }).ok).toBe(false);
    expect(sim.execute({ kind: 'bank.arrange_overdraft', payload: { limit: 1_000_00 } }).ok).toBe(true);
    expect(overdraftRoom(sim, sim.player)).toBe(1_000_00);
  });

  it('charges interest past Barclays’ free £15, on the first of the month', () => {
    const sim = lifeIn('uk-eng-london', { bankId: 'gb-barclays' });
    wages(sim, 2_000_00);
    sim.must({ kind: 'bank.arrange_overdraft', payload: { limit: 1_000_00 } });
    const zone = sim.homeZone;
    sim.advanceTo(instantFromZoned({ year: 2026, month: 1, day: 20, hour: 12 }, zone));
    set(sim, current(sim), -415_00);
    set(sim, savings(sim), 0);
    const account = current(sim);
    account.odAccrued = 0;
    // The rollovers of the 21st to the 31st: 11 days on £400.
    sim.advanceTo(instantFromZoned({ year: 2026, month: 1, day: 31, hour: 12 }, zone));
    const built = account.odAccrued ?? 0;
    expect(built).toBeGreaterThan(0);
    // No spending moves it in these days by more than the day's food, so the
    // interest is about £400 × 35% / 365 a day.
    expect(built / 11).toBeLessThan((1_000_00 * 0.35) / 365);
    sim.advanceTo(instantFromZoned({ year: 2026, month: 2, day: 1, hour: 6 }, zone));
    expect(feesOn(sim, account, 'Overdraft interest').length).toBe(1);
  });

  it('charges nothing inside the buffer, and exactly the rate on what’s past it', () => {
    const sim = lifeIn('uk-eng-london', { bankId: 'gb-barclays' });
    wages(sim, 2_000_00);
    sim.must({ kind: 'bank.arrange_overdraft', payload: { limit: 1_000_00 } });
    // No home, so no rent and no food: nothing moves the balance but the test.
    sim.player.home = undefined;
    set(sim, savings(sim), 0);
    const account = current(sim);
    set(sim, account, -10_00);
    account.odAccrued = 0;
    sim.advanceBy(MS_DAY);
    expect(account.odAccrued ?? 0).toBe(0);
    set(sim, account, -415_00);
    sim.advanceBy(MS_DAY);
    expect(account.odAccrued).toBeCloseTo((400_00 * 0.35) / 365, 6);
  });

  it('prices by the record where the bank does: Lloyds, 19.9% to 49.9%', () => {
    expect(rateForRecord(0.199, 0.499, 780)).toBe(0.199);
    expect(rateForRecord(0.199, 0.499, 580)).toBe(0.499);
    expect(rateForRecord(0.199, 0.499, 680)).toBe(0.349);
    expect(rateForRecord(0.35, undefined, 600)).toBe(0.35);
  });

  it('charges TD’s $5 a month and an Irish bank’s yearly fee on arranging', () => {
    const td = lifeIn('ca-on-toronto', { bankId: 'ca-td' });
    wages(td, 3_000_00);
    td.must({ kind: 'bank.arrange_overdraft', payload: { limit: 1_000_00 } });
    td.advanceTo(instantFromZoned({ year: 2026, month: 2, day: 1, hour: 6 }, td.homeZone));
    expect(feesOn(td, current(td), 'Overdraft fee')).toEqual([-5_00]);
    const ie = lifeIn('ie-lei-dublin', { bankId: 'ie-bank-of-ireland' });
    wages(ie, 3_000_00);
    ie.must({ kind: 'bank.arrange_overdraft', payload: { limit: 1_000_00 } });
    expect(feesOn(ie, current(ie), 'Overdraft facility fee')).toEqual([-30_00]);
  });

  it('lends MUFG’s way: against time deposits, 90% up to ¥2 million', () => {
    const sim = lifeIn('jp-13-tokyo', { bankId: 'jp-mufg', wealth: 'wealthy' });
    expect(overdraftRoom(sim, sim.player)).toBe(0);
    sim.must({ kind: 'bank.open_term', payload: { amount: 1_000_000_00 } });
    expect(overdraftRoom(sim, sim.player)).toBe(900_000_00);
    sim.must({ kind: 'bank.open_term', payload: { amount: 2_000_000_00 } });
    expect(overdraftRoom(sim, sim.player)).toBe(2_000_000_00);
  });
});

describe('a personal loan', () => {
  it('is priced by the record, paid down monthly, and closed when it’s paid', () => {
    const sim = lifeIn('us-ny-newyork', { bankId: 'us-citi', wealth: 'comfortable' });
    wages(sim, 4_000_00);
    const answer = sim.must<{ apr: number; payment: number }>({ kind: 'bank.borrow', payload: { amount: 3_000_00, months: 12 } });
    const score = sim.player.credit!.score;
    expect(answer.apr).toBe(rateForRecord(0.0999, 0.1749, score));
    expect(answer.payment).toBe(monthlyPayment(3_000_00, answer.apr, 12));
    const loan = loanOf(sim, sim.player)!;
    expect(loan.balance).toBe(-3_000_00);
    const interestPaid = () => sim.universe.transactions.filter((t) => t.category === 'loan_interest')
      .flatMap((t) => t.postings).filter((p) => p.accountId === loan.id).reduce((sum, p) => sum - p.amount, 0);
    sim.advanceBy(40 * MS_DAY);
    expect(loan.balance).toBeGreaterThan(-3_000_00);
    sim.advanceBy(340 * MS_DAY);
    expect(loan.closedAt).toBeDefined();
    expect(loan.balance).toBe(0);
    // The interest is what twelve equal payments carry over the principal,
    // within the pennies each month rounds.
    expect(Math.abs(interestPaid() - (answer.payment * 12 - 3_000_00))).toBeLessThan(12_00);
    expect(interestPaid()).toBeGreaterThan(0);
  });

  it('refuses without wages, past 35% of them, to a poor record, and Wells Fargo below a good one', () => {
    const sim = lifeIn('us-ny-newyork', { bankId: 'us-citi' });
    expect(sim.execute({ kind: 'bank.borrow', payload: { amount: 1_000_00, months: 12 } }).ok).toBe(false);
    wages(sim, 1_000_00);
    expect(sim.execute({ kind: 'bank.borrow', payload: { amount: 50_000_00, months: 12 } }).ok).toBe(false);
    sim.player.credit!.score = 560;
    expect(sim.execute({ kind: 'bank.borrow', payload: { amount: 1_000_00, months: 12 } }).ok).toBe(false);
    const wf = lifeIn('us-ny-newyork', { bankId: 'us-wells-fargo' });
    wages(wf, 10_000_00);
    wf.player.credit!.score = 650;
    expect(wf.execute({ kind: 'bank.borrow', payload: { amount: 5_000_00, months: 24 } }).error).toContain('lowest rate');
    wf.player.credit!.score = 700;
    expect(wf.execute({ kind: 'bank.borrow', payload: { amount: 5_000_00, months: 24 } }).ok).toBe(true);
    expect(wf.execute({ kind: 'bank.borrow', payload: { amount: 1_000_00, months: 24 } }).ok).toBe(false);
  });

  it('puts a missed payment on the record', () => {
    const sim = lifeIn('us-ny-newyork', { bankId: 'us-citi', wealth: 'comfortable' });
    wages(sim, 4_000_00);
    sim.must({ kind: 'bank.borrow', payload: { amount: 3_000_00, months: 12 } });
    const before = sim.player.credit!.score;
    const lates = sim.player.credit!.late.length;
    // Nothing in the bank and no overdraft room when it falls due.
    for (const account of Object.values(sim.universe.accounts)) if (account.ownerId === sim.player.id && account.kind !== 'loan' && account.kind !== 'credit_card') set(sim, account, 0);
    const due = sim.universe.scheduled.find((one) => one.kind === LOAN_DUE_KIND && one.status === 'pending')!;
    set(sim, current(sim), -500_00);
    sim.advanceTo(due.at + 60_000);
    expect(sim.player.credit!.late.length).toBe(lates + 1);
    expect(sim.player.credit!.score).toBeLessThan(before);
  });

  it('is paid off early, and nothing more falls due', () => {
    const sim = lifeIn('us-ny-newyork', { bankId: 'us-citi', wealth: 'comfortable' });
    wages(sim, 4_000_00);
    sim.must({ kind: 'bank.borrow', payload: { amount: 3_000_00, months: 12 } });
    set(sim, current(sim), 10_000_00);
    expect(sim.execute({ kind: 'bank.repay_loan', payload: {} }).ok).toBe(true);
    expect(loanOf(sim, sim.player)).toBeUndefined();
    expect(sim.universe.scheduled.some((one) => one.kind === LOAN_DUE_KIND && one.status === 'pending')).toBe(false);
  });
});

describe('a term deposit', () => {
  it('is locked away, kept from spending, and paid out with its interest less the tax', () => {
    const sim = lifeIn('is-39-mosfellsbr', { bankId: 'is-arion', wealth: 'comfortable' });
    const account = current(sim);
    const before = account.balance;
    sim.must({ kind: 'bank.open_term', payload: { amount: 1_000_000_00 } });
    expect(account.balance).toBe(before - 1_000_000_00);
    const term = termsOf(sim, sim.player)[0]!;
    expect(term.fixedRate).toBe(0.0805);
    expect(bankAccountsOf(sim, sim.player).some((a) => a.id === term.id)).toBe(false);
    // Spending never reaches it, even with no other savings to take from.
    set(sim, account, 0);
    sim.must({ kind: 'bank.close_savings', payload: { accountId: savings(sim)!.id } });
    set(sim, account, 0);
    spend(sim, sim.player, 100_000_00, 'Test', 'food');
    expect(term.balance).toBe(1_000_000_00);
    set(sim, account, 5_000_000_00);
    sim.advanceTo(term.maturesAt! + 2 * MS_DAY);
    expect(term.closedAt).toBeDefined();
    const paid = sim.universe.transactions.find((t) => t.memo === `${term.name} paid out`)!;
    const gross = -paid.postings.find((p) => sim.universe.accounts[p.accountId]?.kind === 'income')!.amount;
    // A year at 8.05%, give or take the leap of a day.
    expect(gross).toBeGreaterThan(1_000_000_00 * 0.0805 * 0.99);
    expect(gross).toBeLessThan(1_000_000_00 * 0.0805 * 1.01);
    // Into the current account, less Iceland's 22%.
    const into = paid.postings.find((p) => p.accountId === account.id)!.amount;
    expect(into).toBe(1_000_000_00 + gross - Math.round(gross * 0.22));
  });

  it('keeps ING’s €100,000 floor', () => {
    const sim = lifeIn('de-be-berlin', { bankId: 'de-ing', wealth: 'wealthy' });
    set(sim, current(sim), 150_000_00);
    expect(sim.execute({ kind: 'bank.open_term', payload: { amount: 50_000_00 } }).ok).toBe(false);
    expect(sim.execute({ kind: 'bank.open_term', payload: { amount: 100_000_00 } }).ok).toBe(true);
  });
});

describe('a switch', () => {
  it('moves the money the same day where there’s no switching service', () => {
    const sim = lifeIn('is-39-mosfellsbr', { bankId: 'is-landsbankinn', wealth: 'modest' });
    const total = bankAccountsOf(sim, sim.player).reduce((sum, a) => sum + a.balance, 0);
    sim.must({ kind: 'bank.switch', payload: { bankId: 'is-islandsbanki' } });
    expect(bankOf(sim, sim.player)?.name).toBe('Íslandsbanki');
    expect(current(sim).name).toBe('Almennur reikningur');
    const now = bankAccountsOf(sim, sim.player);
    expect(now.every((a) => a.bankId === 'is-islandsbanki')).toBe(true);
    expect(now.reduce((sum, a) => sum + a.balance, 0)).toBe(total);
  });

  it('takes Britain’s seven working days, and waits for an overdraft to be cleared', () => {
    const sim = lifeIn('uk-eng-london', { bankId: 'gb-barclays', wealth: 'modest' });
    set(sim, current(sim), -10_00);
    expect(sim.execute({ kind: 'bank.switch', payload: { bankId: 'gb-hsbc' } }).ok).toBe(false);
    set(sim, current(sim), 1_000_00);
    // Monday 5 January 2026: seven working days on is Wednesday the 14th.
    const at = sim.must<{ at: number }>({ kind: 'bank.switch', payload: { bankId: 'gb-hsbc' } }).at;
    expect(new Date(at).toISOString().slice(0, 10)).toBe('2026-01-14');
    expect(bankOf(sim, sim.player)?.name).toBe('Barclays');
    expect(sim.execute({ kind: 'bank.switch', payload: { bankId: 'gb-natwest' } }).ok).toBe(false);
    sim.advanceTo(at + 60_000);
    expect(bankOf(sim, sim.player)?.name).toBe('HSBC UK');
    expect(sim.universe.scheduled.some((one) => one.kind === SWITCH_KIND && one.status === 'pending')).toBe(false);
  });
});
