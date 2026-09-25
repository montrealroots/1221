/**
 * The rest of what a bank charges and gives back, each as its bank does it.
 *
 * France's €8 an operation, €80 a month at most, past zero or past an
 * arranged limit; Spain's descubierto, with its interest and its commission
 * on the month's deepest point; Canada's $10 for a debit returned unpaid,
 * spared on a card purchase, a small one and a second within two business
 * days; Arion's debit card fees and its age exemption; MUFG's fee on an
 * account unused for two years; Santander México's fee for a quiet month;
 * introductory rates that step down; and Iceland's refund of the tax on the
 * first 300,000 kr of interest.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';
import { MS_DAY, instantFromZoned } from '@/engine/core/time';
import { spend } from '@/engine/systems/household';
import { bankAccountsOf, rateOf } from '@/engine/systems/banking';

const lifeIn = (cityId: string, extra: Record<string, unknown> = {}, seed = 'fees') =>
  quickSave({ startLocationId: cityId, homeRegionId: cityId, livesWhereBorn: true, dayJob: false, ...extra }, seed);
const current = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!;
const savings = (sim: Simulation) => bankAccountsOf(sim, sim.player).find((a) => a.kind === 'savings');
function set(sim: Simulation, account: Account | undefined, amount: number): void {
  if (!account) return;
  const diff = amount - account.balance;
  if (diff !== 0) sim.post({ memo: 'Test', category: 'test', postings: [{ accountId: account.id, amount: diff }, { accountId: sim.nominalAccount('equity', 'Test').id, amount: -diff }] });
}
const charged = (sim: Simulation, account: Account, memo: string) => sim.universe.transactions
  .filter((t) => t.memo === memo).flatMap((t) => t.postings).filter((p) => p.accountId === account.id).map((p) => p.amount);
const noHome = (sim: Simulation) => { sim.player.home = undefined; };

describe('France', () => {
  it('charges €8 an operation past zero, and no more than €80 a month', () => {
    const sim = lifeIn('fr-idf-paris', { bankId: 'fr-bnp-paribas' });
    set(sim, current(sim), 0);
    set(sim, savings(sim), 0);
    for (let i = 0; i < 12; i += 1) spend(sim, sim.player, 5_00, 'Test', 'bills');
    expect(charged(sim, current(sim), 'Overdraft fee')).toEqual(new Array(10).fill(-8_00));
  });

  it('charges it past an arranged limit, and not inside it', () => {
    const sim = lifeIn('fr-idf-paris', { bankId: 'fr-societe-generale' });
    sim.post({ memo: 'Wages', category: 'salary', postings: [{ accountId: current(sim).id, amount: 2_000_00 }, { accountId: sim.nominalAccount('income', 'Wages').id, amount: -2_000_00 }] });
    sim.must({ kind: 'bank.arrange_overdraft', payload: { limit: 500_00 } });
    set(sim, current(sim), 0);
    set(sim, savings(sim), 0);
    spend(sim, sim.player, 400_00, 'Test', 'bills');
    expect(charged(sim, current(sim), 'Overdraft fee')).toEqual([]);
    spend(sim, sim.player, 200_00, 'Test', 'bills');
    expect(charged(sim, current(sim), 'Overdraft fee')).toEqual([-8_00]);
  });
});

describe('Spain’s descubierto', () => {
  it('takes interest and, on the first, 5% of the month’s deepest point, at least €15', () => {
    const sim = lifeIn('es-md-madrid', { bankId: 'es-santander' });
    noHome(sim);
    set(sim, savings(sim), 0);
    const account = current(sim);
    set(sim, account, 0);
    sim.advanceTo(instantFromZoned({ year: 2026, month: 1, day: 20, hour: 12 }, sim.homeZone));
    spend(sim, sim.player, 400_00, 'Test', 'bills');
    set(sim, account, -100_00);
    sim.advanceTo(instantFromZoned({ year: 2026, month: 2, day: 1, hour: 6 }, sim.homeZone));
    expect(charged(sim, account, 'Overdraft commission')).toEqual([-20_00]);
    expect(charged(sim, account, 'Overdraft interest').length).toBe(1);
    // A shallow month is charged the €15 floor.
    set(sim, account, -50_00);
    sim.advanceTo(instantFromZoned({ year: 2026, month: 3, day: 1, hour: 6 }, sim.homeZone));
    expect(charged(sim, account, 'Overdraft commission')).toEqual([-20_00, -15_00]);
  });
});

describe('Canada’s returned payment', () => {
  it('is $10 on a bill the bank can’t pay, not on a card purchase, and not twice within two business days', () => {
    const sim = lifeIn('ca-on-toronto', { bankId: 'ca-td' });
    set(sim, current(sim), 0);
    set(sim, savings(sim), 0);
    spend(sim, sim.player, 50_00, 'Groceries', 'food');
    expect(charged(sim, current(sim), 'Returned payment fee')).toEqual([]);
    spend(sim, sim.player, 5_00, 'Bills', 'bills', true);
    expect(charged(sim, current(sim), 'Returned payment fee')).toEqual([]);
    spend(sim, sim.player, 50_00, 'Bills', 'bills', true);
    spend(sim, sim.player, 50_00, 'Bills', 'bills', true);
    expect(charged(sim, current(sim), 'Returned payment fee')).toEqual([-10_00]);
    sim.advanceBy(4 * MS_DAY);
    spend(sim, sim.player, 50_00, 'Bills', 'bills', true);
    expect(charged(sim, current(sim), 'Returned payment fee')).toEqual([-10_00, -10_00]);
  });
});

describe('Arion’s debit card', () => {
  it('costs 19 kr a purchase and 950 kr a year, and nothing at 23', () => {
    const sim = lifeIn('is-39-mosfellsbr', { bankId: 'is-arion', birthYear: 1990 });
    spend(sim, sim.player, 1_000_00, 'Groceries', 'food');
    expect(charged(sim, current(sim), 'Debit card purchase fee')).toEqual([-19_00]);
    sim.advanceBy(366 * MS_DAY);
    expect(charged(sim, current(sim), 'Debit card yearly fee')).toEqual([-950_00]);
    const young = lifeIn('is-39-mosfellsbr', { bankId: 'is-arion', birthYear: 2004 });
    spend(young, young.player, 1_000_00, 'Groceries', 'food');
    expect(charged(young, current(young), 'Debit card purchase fee')).toEqual([]);
  });
});

describe('a dormant account', () => {
  it('costs ¥1,320 a year at MUFG once two years pass without use', () => {
    const sim = lifeIn('jp-13-tokyo', { bankId: 'jp-mufg', wealth: 'modest' });
    const saver = savings(sim)!;
    // Enough in the current account that living never draws on savings.
    set(sim, current(sim), 100_000_000_00);
    sim.advanceBy(700 * MS_DAY);
    expect(charged(sim, saver, 'Dormant account fee')).toEqual([]);
    sim.advanceBy(60 * MS_DAY);
    expect(charged(sim, saver, 'Dormant account fee')).toEqual([-1_320_00]);
    // The current account, used every day, is never charged.
    expect(charged(sim, current(sim), 'Dormant account fee')).toEqual([]);
  });
});

describe('Santander México’s quiet month', () => {
  it('is charged for a month with under two transactions, and not for one with wages', () => {
    const sim = lifeIn('mx-cmx-mexicocity', { bankId: 'mx-santander' });
    noHome(sim);
    sim.advanceTo(instantFromZoned({ year: 2026, month: 3, day: 1, hour: 6 }, sim.homeZone));
    expect(charged(sim, current(sim), 'Quiet month fee').length).toBeGreaterThanOrEqual(1);
    const before = charged(sim, current(sim), 'Quiet month fee').length;
    sim.post({ memo: 'Wages', category: 'salary', postings: [{ accountId: current(sim).id, amount: 5_000_00 }, { accountId: sim.nominalAccount('income', 'Wages').id, amount: -5_000_00 }] });
    sim.advanceTo(instantFromZoned({ year: 2026, month: 4, day: 1, hour: 6 }, sim.homeZone));
    expect(charged(sim, current(sim), 'Quiet month fee').length).toBe(before);
  });
});

describe('an introductory rate', () => {
  it('steps down: CommBank’s 5.20% for five months, then 2.10%', () => {
    const sim = lifeIn('au-nsw-sydney', { bankId: 'au-commbank', wealth: 'modest' });
    const saver = savings(sim)!;
    expect(rateOf(sim, saver)).toBe(0.052);
    sim.advanceBy(160 * MS_DAY);
    expect(rateOf(sim, saver)).toBe(0.021);
  });

  it('and Bankinter’s 5% for a year, 2% for the next, then none on record', () => {
    const sim = lifeIn('es-md-madrid', { bankId: 'es-bankinter' });
    const account = current(sim);
    expect(rateOf(sim, account)).toBe(0.05);
    sim.advanceBy(400 * MS_DAY);
    expect(rateOf(sim, account)).toBe(0.02);
    sim.advanceBy(370 * MS_DAY);
    expect(rateOf(sim, account)).toBe(0);
  });
});

describe('Iceland’s assessment', () => {
  it('gives back the tax on the first 300,000 kr of last year’s interest, on 1 June', () => {
    const sim = lifeIn('is-39-mosfellsbr', { bankId: 'is-landsbankinn', wealth: 'modest' });
    noHome(sim);
    const account = current(sim);
    // 500,000 kr of interest in 2026, as the bank would have paid it.
    sim.post({ memo: 'Interest', category: 'interest', postings: [
      { accountId: account.id, amount: 390_000_00 }, { accountId: sim.nominalAccount('income', 'Interest').id, amount: -500_000_00 },
      { accountId: sim.nominalAccount('expense', 'Tax On Interest').id, amount: 110_000_00 },
    ] });
    sim.advanceTo(instantFromZoned({ year: 2027, month: 6, day: 1, hour: 6 }, sim.homeZone));
    const refunds = sim.universe.transactions.filter((t) => t.category === 'tax_refund')
      .flatMap((t) => t.postings).filter((p) => p.accountId === account.id).map((p) => p.amount);
    // Over 300,000 kr of interest, so the refund is 22% of 300,000 kr exactly.
    expect(refunds).toEqual([66_000_00]);
  });
});
