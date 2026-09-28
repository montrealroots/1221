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
  ESTIMATE, LOAN_DUE_KIND, SWITCH_KIND, closeForOverdraft, collectionsOf, loanOf, monthlyPayment, overdraftHeadroom, overdraftOffer, overdraftRoom, rateForRecord, termsOf,
} from '@/engine/systems/lending';

const lifeIn = (cityId: string, extra: Record<string, unknown> = {}, seed = 'lend') =>
  quickSave({ startLocationId: cityId, homeRegionId: cityId, livesWhereBorn: true, ...extra }, seed);
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

describe('an account left overdrawn', () => {
  it('is closed after sixty days, set off against savings there, and the rest charged off to collections', () => {
    const sim = lifeIn('us-ny-newyork', { bankId: 'us-chase', wealth: 'modest' });
    sim.player.home = undefined;
    const old = current(sim);
    const oldSavings = savings(sim)!;
    const score = sim.player.credit!.score;
    set(sim, oldSavings, 100_00);
    set(sim, old, -400_00);
    // Kept from living off the account, so the sum is the test's own.
    old.overdraftLimit = undefined;
    sim.advanceBy((ESTIMATE.closeAfterDays - 2) * MS_DAY);
    expect(old.closedAt).toBeUndefined();
    sim.advanceBy(3 * MS_DAY);
    expect(old.closedAt).toBeDefined();
    expect(oldSavings.closedAt).toBeDefined();
    const debt = collectionsOf(sim, sim.player)!;
    expect(debt).toBeDefined();
    // What savings held went against it, both accounts end at nothing, and
    // the debt is what the current account was short after that.
    const setOff = sim.universe.transactions.find((t) => t.memo === 'Set off against the overdraft')!;
    const chargedOff = sim.universe.transactions.find((t) => t.memo === 'Charged off by Chase')!;
    // Savings here ran dry on living and then below zero on its own $5 fee, and that came across too.
    expect(setOff.postings.find((p) => p.accountId === old.id)!.amount).not.toBe(0);
    expect(chargedOff.postings.find((p) => p.accountId === debt.id)!.amount).toBe(debt.balance);
    expect(old.balance).toBe(0);
    expect(oldSavings.balance).toBe(0);
    expect(-debt.balance).toBeGreaterThan(200_00);
    expect(sim.player.credit!.score).toBeLessThanOrEqual(score - ESTIMATE.chargeOffHit + 10);
    expect(bankOf(sim, sim.player)?.id).not.toBe('us-chase');
    expect(current(sim).id).not.toBe(old.id);
    // And Chase won't take them back while it's owed.
    expect(sim.execute({ kind: 'bank.switch', payload: { bankId: 'us-chase' } }).ok).toBe(false);
    // A bank is one where they live, whatever a job abroad has them standing in.
    sim.player.home = { kind: 'shared', cityId: 'us-ny-newyork', since: sim.now };
    sim.player.currentLocationId = 'uk-eng-london';
    expect(sim.execute({ kind: 'bank.switch', payload: { bankId: 'gb-hsbc' } }).error).toMatch(/where you live/);
  });

  it('re-banks them where they live, and switches on its rules, whatever a job abroad has them standing in', () => {
    const sim = lifeIn('us-ny-newyork', { bankId: 'us-chase', wealth: 'modest' }, 'lend-away');
    const old = current(sim);
    set(sim, savings(sim), 0);
    set(sim, old, -400_00);
    old.overdraftLimit = undefined;
    sim.player.currentLocationId = 'uk-eng-london';
    sim.advanceBy((ESTIMATE.closeAfterDays + 1) * MS_DAY);
    expect(old.closedAt).toBeDefined();
    expect(bankOf(sim, sim.player)!.id.startsWith('us-')).toBe(true);
    // A switch between US banks completes at once, not on Britain's seven working days.
    const well = lifeIn('us-ny-newyork', { bankId: 'us-chase', wealth: 'wealthy' }, 'lend-away-switch');
    well.player.currentLocationId = 'uk-eng-london';
    well.must({ kind: 'bank.switch', payload: { bankId: 'us-citi' } });
    expect(well.universe.scheduled.some((i) => i.kind === SWITCH_KIND && i.status === 'pending')).toBe(false);
    expect(bankOf(well, well.player)!.id).toBe('us-citi');
  });

  it('sets off only what savings there needs to give, and charges off the rest', () => {
    const sim = lifeIn('us-ny-newyork', { bankId: 'us-chase', wealth: 'modest' });
    set(sim, current(sim), -400_00);
    set(sim, savings(sim), 100_00);
    closeForOverdraft(sim, sim.player, bankOf(sim, sim.player)!);
    expect(-collectionsOf(sim, sim.player)!.balance).toBe(300_00);
  });

  it('takes a savings account’s shortfall from the current account there, closes only the savings, and charges nothing off', () => {
    const sim = lifeIn('us-ny-newyork', { bankId: 'us-citi', wealth: 'modest' });
    sim.player.home = undefined;
    const saver = savings(sim)!;
    const score = sim.player.credit!.score;
    set(sim, current(sim), 50_000_00);
    set(sim, saver, -9_00);
    sim.advanceBy((ESTIMATE.closeAfterDays + 1) * MS_DAY);
    expect(saver.closedAt).toBeDefined();
    expect(saver.balance).toBe(0);
    expect(collectionsOf(sim, sim.player)).toBeUndefined();
    expect(sim.player.credit!.score).toBeGreaterThanOrEqual(score);
    expect(bankOf(sim, sim.player)?.id).toBe('us-citi');
    expect(current(sim).closedAt).toBeUndefined();
  });

  it('isn’t closed for an arranged overdraft used within its limit', () => {
    const sim = lifeIn('uk-eng-london', { bankId: 'gb-barclays', wealth: 'modest' });
    sim.player.home = undefined;
    wages(sim, 3_000_00);
    sim.must({ kind: 'bank.arrange_overdraft', payload: { limit: 1_000_00 } });
    set(sim, savings(sim), 0);
    const account = current(sim);
    set(sim, account, -500_00);
    sim.advanceBy(90 * MS_DAY);
    expect(account.closedAt).toBeUndefined();
  });

  it('is paid down from the new account, and closed when it’s paid', () => {
    const sim = lifeIn('us-ny-newyork', { bankId: 'us-chase', wealth: 'modest' });
    sim.player.home = undefined;
    set(sim, savings(sim), 0);
    set(sim, current(sim), -300_00);
    sim.advanceBy((ESTIMATE.closeAfterDays + 1) * MS_DAY);
    const debt = collectionsOf(sim, sim.player)!;
    const owed = -debt.balance;
    set(sim, current(sim), 10_000_00);
    expect(sim.must<{ paid: number; left: number }>({ kind: 'bank.pay_collections', payload: { amount: 100_00 } })).toEqual({ paid: 100_00, left: owed - 100_00 });
    sim.must({ kind: 'bank.pay_collections', payload: { amount: 100_000_00 } });
    expect(debt.balance).toBe(0);
    expect(debt.closedAt).toBeDefined();
    expect(collectionsOf(sim, sim.player)).toBeUndefined();
    expect(sim.execute({ kind: 'bank.pay_collections', payload: { amount: 1_00 } }).ok).toBe(false);
  });
});

describe('an overdraft by the item', () => {
  // The save starts on Monday 5 January 2026: Tuesday is the next business
  // day, and it has ended by Wednesday morning.
  const wednesday = (sim: Simulation) => instantFromZoned({ year: 2026, month: 1, day: 7, hour: 6 }, sim.homeZone);

  it('charges Chase’s $34 an item past $50, three a day at most, once the next business day ends', () => {
    const sim = lifeIn('us-ny-newyork', { bankId: 'us-chase' });
    sim.player.home = undefined;
    set(sim, current(sim), 100_00);
    set(sim, savings(sim), 0);
    const account = current(sim);
    expect(spend(sim, sim.player, 120_00, 'Test', 'bills')).toBe(true);
    // Overdrawn by $20: inside the grace, no fee.
    expect(account.balance).toBe(-20_00);
    spend(sim, sim.player, 100_00, 'Test', 'bills');
    for (let i = 0; i < 4; i += 1) spend(sim, sim.player, 10_00, 'Test', 'bills');
    // Five items past the grace, and nothing charged yet: Tuesday is theirs to put it right.
    expect(feesOn(sim, account, 'Overdraft fee')).toEqual([]);
    sim.advanceTo(instantFromZoned({ year: 2026, month: 1, day: 6, hour: 18 }, sim.homeZone));
    expect(feesOn(sim, account, 'Overdraft fee')).toEqual([]);
    sim.advanceTo(wednesday(sim));
    expect(feesOn(sim, account, 'Overdraft fee')).toEqual([-34_00, -34_00, -34_00]);
  });

  it('waits over a weekend: Friday’s fees are charged after Monday ends', () => {
    const sim = lifeIn('us-ny-newyork', { bankId: 'us-chase' });
    sim.player.home = undefined;
    sim.advanceTo(instantFromZoned({ year: 2026, month: 1, day: 9, hour: 12 }, sim.homeZone));
    set(sim, current(sim), 0);
    set(sim, savings(sim), 0);
    spend(sim, sim.player, 200_00, 'Test', 'bills');
    sim.advanceTo(instantFromZoned({ year: 2026, month: 1, day: 12, hour: 18 }, sim.homeZone));
    expect(feesOn(sim, current(sim), 'Overdraft fee')).toEqual([]);
    sim.advanceTo(instantFromZoned({ year: 2026, month: 1, day: 13, hour: 6 }, sim.homeZone));
    expect(feesOn(sim, current(sim), 'Overdraft fee')).toEqual([-34_00]);
  });

  it('waits over a Federal Reserve holiday: Friday’s fees, before Martin Luther King Jr. Day, are charged after the Tuesday ends', () => {
    const sim = lifeIn('us-ny-newyork', { bankId: 'us-chase' });
    sim.player.home = undefined;
    sim.advanceTo(instantFromZoned({ year: 2026, month: 1, day: 16, hour: 12 }, sim.homeZone));
    set(sim, current(sim), 0);
    set(sim, savings(sim), 0);
    spend(sim, sim.player, 200_00, 'Test', 'bills');
    sim.advanceTo(instantFromZoned({ year: 2026, month: 1, day: 20, hour: 6 }, sim.homeZone));
    expect(feesOn(sim, current(sim), 'Overdraft fee')).toEqual([]);
    sim.advanceTo(instantFromZoned({ year: 2026, month: 1, day: 21, hour: 6 }, sim.homeZone));
    expect(feesOn(sim, current(sim), 'Overdraft fee')).toEqual([-34_00]);
  });

  it('lets Chase’s fees go when the account is back within $50 by the end of the next business day', () => {
    const sim = lifeIn('us-ny-newyork', { bankId: 'us-chase' });
    sim.player.home = undefined;
    set(sim, current(sim), 0);
    set(sim, savings(sim), 0);
    spend(sim, sim.player, 200_00, 'Test', 'bills');
    sim.advanceTo(instantFromZoned({ year: 2026, month: 1, day: 6, hour: 18 }, sim.homeZone));
    set(sim, current(sim), -40_00);
    sim.advanceTo(wednesday(sim));
    expect(feesOn(sim, current(sim), 'Overdraft fee')).toEqual([]);
  });

  it('won’t pay a debit card purchase into an overdraft unless the person opted in (Regulation E)', () => {
    const sim = lifeIn('us-ny-newyork', { bankId: 'us-chase', wealth: 'modest' });
    set(sim, current(sim), 0);
    set(sim, savings(sim), 0);
    // Not opted in: the card takes the groceries, and the account stays at zero.
    expect(spend(sim, sim.player, 60_00, 'Groceries', 'food')).toBe(true);
    expect(current(sim).balance).toBe(0);
    // Opted in: the bank pays it below zero.
    sim.must({ kind: 'bank.debit_overdraft', payload: { on: true } });
    spend(sim, sim.player, 60_00, 'Groceries', 'food');
    expect(current(sim).balance).toBe(-60_00);
    // A bill goes into the overdraft either way.
    sim.must({ kind: 'bank.debit_overdraft', payload: { on: false } });
    spend(sim, sim.player, 40_00, 'Electric', 'bills');
    expect(current(sim).balance).toBe(-100_00);
  });

  it('declines a debit card purchase with no card to take it, rather than owing it to the landlord', () => {
    const sim = lifeIn('us-ny-newyork', { bankId: 'us-chase', wealth: 'nothing' });
    set(sim, current(sim), 0);
    set(sim, savings(sim), 0);
    expect(spend(sim, sim.player, 60_00, 'Groceries', 'food')).toBe(false);
    expect(current(sim).balance).toBe(0);
    expect(sim.universe.transactions.some((t) => t.memo === 'Groceries')).toBe(false);
  });

  it('never pays a Bank of America debit card purchase into an overdraft, and charges no fee for one the card took', () => {
    const sim = lifeIn('us-ny-newyork', { bankId: 'us-bank-of-america', wealth: 'modest' });
    set(sim, savings(sim), 0);
    set(sim, current(sim), -20_00);
    expect(sim.execute({ kind: 'bank.debit_overdraft', payload: { on: true } }).ok).toBe(false);
    spend(sim, sim.player, 60_00, 'Groceries', 'food');
    expect(current(sim).balance).toBe(-20_00);
    expect(feesOn(sim, current(sim), 'Overdraft fee')).toEqual([]);
  });

  it('covers only so far, then the card takes it', () => {
    const sim = lifeIn('us-ny-newyork', { bankId: 'us-chase', wealth: 'scraping' });
    set(sim, current(sim), 0);
    set(sim, savings(sim), 0);
    expect(overdraftRoom(sim, sim.player)).toBe(500_00);
    spend(sim, sim.player, 700_00, 'Test', 'bills');
    expect(current(sim).balance).toBeGreaterThanOrEqual(-500_00 - 34_00 * 3);
    expect(overdraftHeadroom(sim, sim.player)).toBe(0);
  });

  it('charges CommBank’s $15 for a day a payment overdrew it and that ended overdrawn, and only interest for a day it stayed so', () => {
    const sim = lifeIn('au-nsw-sydney', { bankId: 'au-commbank' });
    sim.player.home = undefined;
    set(sim, current(sim), 0);
    set(sim, savings(sim), 0);
    spend(sim, sim.player, 200_00, 'Test', 'bills');
    expect(feesOn(sim, current(sim), 'Overdraft fee')).toEqual([]);
    sim.advanceBy(MS_DAY);
    expect(feesOn(sim, current(sim), 'Overdrawn at midnight')).toEqual([-15_00]);
    expect(current(sim).odAccrued ?? 0).toBeGreaterThan(0);
    // Five more days overdrawn, with nothing new paid: no more fees.
    sim.advanceBy(5 * MS_DAY);
    expect(feesOn(sim, current(sim), 'Overdrawn at midnight')).toEqual([-15_00]);
    // A new payment into it, and the day ends overdrawn: another.
    spend(sim, sim.player, 20_00, 'Test', 'bills');
    sim.advanceBy(MS_DAY);
    expect(feesOn(sim, current(sim), 'Overdrawn at midnight')).toEqual([-15_00, -15_00]);
  });

  it('charges CommBank nothing for a day overdrawn and put right before midnight', () => {
    const sim = lifeIn('au-nsw-sydney', { bankId: 'au-commbank' });
    sim.player.home = undefined;
    set(sim, current(sim), 0);
    set(sim, savings(sim), 0);
    spend(sim, sim.player, 200_00, 'Test', 'bills');
    set(sim, current(sim), 50_00);
    sim.advanceBy(MS_DAY);
    expect(feesOn(sim, current(sim), 'Overdrawn at midnight')).toEqual([]);
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
    // Savings behind the current account: a loan payment reaches savings only where it's linked (`drawFromBank`).
    sim.player.payments = { ...(sim.player.payments ?? {}), linkSavings: true } as typeof sim.player.payments;
    const answer = sim.must<{ apr: number; payment: number }>({ kind: 'bank.borrow', payload: { amount: 3_000_00, months: 12 } });
    const score = sim.player.credit!.score;
    expect(answer.apr).toBe(rateForRecord(0.0999, 0.1749, score));
    expect(answer.payment).toBe(monthlyPayment(3_000_00, answer.apr, 12));
    const loan = loanOf(sim, sim.player)!;
    expect(loan.balance).toBe(-3_000_00);
    // A payment a little under what clears it, as rounding can leave one: the term's last payment takes the rest.
    loan.loanPayment = (loan.loanPayment ?? 0) - 1_00;
    const interestPaid = () => sim.universe.transactions.filter((t) => t.category === 'loan_interest')
      .flatMap((t) => t.postings).filter((p) => p.accountId === loan.id).reduce((sum, p) => sum - p.amount, 0);
    sim.advanceBy(40 * MS_DAY);
    expect(loan.balance).toBeGreaterThan(-3_000_00);
    sim.advanceBy(340 * MS_DAY);
    expect(loan.closedAt).toBeDefined();
    expect(loan.balance).toBe(0);
    // The term's last payment clears what the months rounded, so it closes with its twelfth, not a thirteenth for the pennies.
    expect(loan.closedAt! - loan.openedAt).toBeLessThan(12 * 30.44 * MS_DAY + 10 * MS_DAY);
    // The interest is what twelve equal payments carry over the principal,
    // within the pennies each month rounds.
    expect(Math.abs(interestPaid() - (answer.payment * 12 - 3_000_00))).toBeLessThan(24_00);
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
