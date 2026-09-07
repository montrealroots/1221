/**
 * The bank, as a bank.
 *
 * An account is opened on a product with a minimum, a fee a big enough
 * balance waives, and a rate. Cover is off until you switch it on, and costs
 * when you use it. Savings counts withdrawals. A certificate locks the money
 * and charges for breaking it. A card runs a cycle: a statement, a minimum, a
 * date, no interest if you clear it, interest on what you carry, a fee and a
 * mark on your record if you are late. Standing orders run until they cannot.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { loadAllSections } from '@/engine/dialogue';
import { loadSave, migrate, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { BANK_PRODUCTS, productById, productLabel } from '@/engine/content/banking';
import {
  CARD_GRACE_DAYS, STANDING_ORDER_STRIKES, breakingCost, cardLimitFor, ensureProducts,
  monthlyFeeFor, myAccounts, openingRefusal, productOf, standingOrders, statements,
} from '@/engine/systems/banking';

function aLife(seed = 'bank', funding = 500_000_00): Simulation {
  const sim = quickSave({}, seed);
  if (funding > 0) sim.income(sim.player.primaryAccountId!, funding, 'Test funding', 'other');
  sim.execute({ kind: 'co.set_draw', payload: { amount: 0 } });
  const profile = sim.universe.creditProfiles[sim.player.id];
  if (profile) profile.score = 720;
  return sim;
}

function must<R>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}): R {
  const result = sim.execute<R>({ kind, payload });
  if (!result.ok) throw new Error(`${kind} refused: ${result.error}`);
  return result.value as R;
}

function attempt<R>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}) {
  return sim.execute<R>({ kind, payload });
}

const checking = (sim: Simulation) => sim.ledger.account(sim.player.primaryAccountId!);
const balance = (sim: Simulation, id?: string) => sim.ledger.account(id ?? sim.player.primaryAccountId!).balance;

/** Past the first of a month, which is when the bank closes its books. */
function endOfMonth(sim: Simulation): void {
  sim.advanceTo(sim.now + 31 * MS_DAY);
}

beforeAll(async () => { await loadAllSections(); });

describe('the products', () => {
  it('are all coherent, and every one says who sells it', () => {
    expect(BANK_PRODUCTS.length).toBeGreaterThanOrEqual(11);
    for (const product of BANK_PRODUCTS) {
      expect(productLabel(product)).toMatch(/^(Northbank|Meridian Private) /);
      expect(product.about.length).toBeGreaterThan(20);
      expect(product.perks.length).toBeGreaterThan(0);
      if (product.family === 'card') {
        expect(product.baseCreditLimit).toBeGreaterThan(0);
        expect(product.minimumScore).toBeGreaterThan(400);
        expect(product.minimumFloor).toBeGreaterThan(0);
      }
      if (product.family === 'certificate') {
        expect(product.termMonths).toBeGreaterThan(0);
        expect(product.earlyExitShare).toBeGreaterThan(0);
        expect(product.apy).toBeGreaterThan(0.03);
      }
      if (product.family === 'checking') expect(product.overdraftLimit).toBeGreaterThan(0);
      if (product.family === 'savings') expect(product.freeWithdrawals).toBeGreaterThan(0);
    }
  });

  it('refuses what you cannot open, and says what it wants', () => {
    const sim = aLife('bank-refuse', 5_000_00);
    const reserve = productById('mp_reserve')!;
    expect(openingRefusal(sim, reserve, 5_000_00, checking(sim).id)).toMatch(/takes \$250,000/);
    expect(attempt(sim, 'bank.open', { productId: 'mp_reserve', deposit: 5_000_00, fromAccountId: checking(sim).id }).error).toMatch(/takes \$250,000/);
    // The money has to actually be there.
    expect(attempt(sim, 'bank.open', { productId: 'nb_high_yield', deposit: 10_000_00, fromAccountId: checking(sim).id }).error).toMatch(/There is not \$10,000/);
    // And a card wants a score.
    sim.universe.creditProfiles[sim.player.id]!.score = 600;
    expect(attempt(sim, 'bank.open', { productId: 'mp_card_reserve' }).error).toMatch(/wants a score of 760. Yours is 600/);
    expect(attempt(sim, 'bank.open', { productId: 'nb_card_everyday' }).ok).toBe(true);
  });

  it('opens a savings account, moves the money and pays the rate every month', () => {
    const sim = aLife('bank-savings');
    const before = balance(sim);
    const { accountId } = must<{ accountId: string }>(sim, 'bank.open', { productId: 'nb_high_yield', deposit: 50_000_00, fromAccountId: checking(sim).id });
    const savings = sim.ledger.account(accountId);
    expect(savings.productId).toBe('nb_high_yield');
    expect(savings.balance).toBe(50_000_00);
    expect(balance(sim)).toBe(before - 50_000_00);
    expect(monthlyFeeFor(savings)).toBe(0);

    endOfMonth(sim);
    const paid = sim.ledger.account(accountId).balance - 50_000_00;
    expect(paid).toBeGreaterThan(0);
    // A month of 4.3% on fifty thousand, near enough.
    expect(paid).toBeCloseTo(Math.round(50_000_00 * 0.043 / 12), -2);
    expect(sim.ledger.history(accountId, 5).some((t) => t.memo.startsWith('Interest — '))).toBe(true);
  });

  it('charges the monthly fee, and stops when the balance earns the waiver', () => {
    const sim = aLife('bank-fee', 1_000_00);
    const { accountId } = must<{ accountId: string }>(sim, 'bank.open', { productId: 'nb_everyday', deposit: 25_00, fromAccountId: checking(sim).id });
    const account = sim.ledger.account(accountId);
    sim.income(accountId, 375_00, 'A little', 'other');
    expect(monthlyFeeFor(sim.ledger.account(accountId))).toBe(12_00);
    endOfMonth(sim);
    expect(sim.ledger.history(accountId, 5).some((t) => t.memo.startsWith('Monthly fee — '))).toBe(true);
    const afterFee = sim.ledger.account(accountId).balance;
    expect(afterFee).toBe(400_00 - 12_00);

    sim.income(accountId, 5_000_00, 'Rather more', 'other');
    expect(monthlyFeeFor(sim.ledger.account(accountId))).toBe(0);
    const before = sim.ledger.account(accountId).balance;
    endOfMonth(sim);
    expect(sim.ledger.account(accountId).balance).toBe(before);
    void account;
  });
});

describe('cover', () => {
  it('is off until you turn it on, and then it spends and charges', () => {
    const sim = aLife('bank-cover', 1_000_00);
    const { accountId } = must<{ accountId: string }>(sim, 'bank.open', { productId: 'nb_everyday', deposit: 25_00, fromAccountId: checking(sim).id });
    sim.income(accountId, 75_00, 'Wages', 'salary');
    expect(sim.ledger.availableFunds(accountId)).toBe(100_00);
    const other = must<{ accountId: string }>(sim, 'bank.open', { productId: 'nb_savings', deposit: 0 });

    // Off: you cannot spend past the balance.
    expect(attempt(sim, 'finance.transfer', { fromAccountId: accountId, toAccountId: other.accountId, amount: 250_00 }).error).toMatch(/Not enough available/);
    must(sim, 'bank.set_overdraft', { accountId, on: true });
    expect(sim.ledger.availableFunds(accountId)).toBe(100_00 + 200_00);
    must(sim, 'finance.transfer', { fromAccountId: accountId, toAccountId: other.accountId, amount: 250_00 });
    expect(sim.ledger.account(accountId).balance).toBe(-150_00);

    // The daily look charges once for going there, not once a day.
    sim.advanceTo(sim.now + 2 * MS_DAY);
    const fees = () => sim.ledger.history(accountId, 30).filter((t) => t.memo.startsWith('Cover fee — '));
    expect(fees()).toHaveLength(1);
    expect(fees()[0]!.postings.some((p) => p.accountId === accountId && p.amount === -35_00)).toBe(true);
    sim.advanceTo(sim.now + 3 * MS_DAY);
    expect(fees()).toHaveLength(1);

    // Putting it right and going back in is a second episode.
    sim.income(accountId, 1_000_00, 'Wages', 'salary');
    sim.advanceTo(sim.now + 2 * MS_DAY);
    expect(sim.ledger.account(accountId).inCoverSince).toBeUndefined();
    must(sim, 'finance.transfer', { fromAccountId: accountId, toAccountId: other.accountId, amount: sim.ledger.account(accountId).balance + 50_00 });
    sim.advanceTo(sim.now + 2 * MS_DAY);
    expect(fees()).toHaveLength(2);
    // And it cannot be switched off while you are in it.
    expect(attempt(sim, 'bank.set_overdraft', { accountId, on: false }).error).toMatch(/into its cover/);
  });

  it('counts what leaves a savings account and charges past the allowance', () => {
    const sim = aLife('bank-withdrawals');
    const { accountId } = must<{ accountId: string }>(sim, 'bank.open', { productId: 'nb_high_yield', deposit: 40_000_00, fromAccountId: checking(sim).id });
    const product = productOf(sim.ledger.account(accountId))!;
    expect(product.freeWithdrawals).toBe(3);
    for (let i = 0; i < 3; i++) must(sim, 'finance.transfer', { fromAccountId: accountId, toAccountId: checking(sim).id, amount: 100_00 });
    expect(sim.ledger.history(accountId, 20).some((t) => t.memo.startsWith('Withdrawal fee'))).toBe(false);
    must(sim, 'finance.transfer', { fromAccountId: accountId, toAccountId: checking(sim).id, amount: 100_00 });
    const fee = sim.ledger.history(accountId, 20).find((t) => t.memo.startsWith('Withdrawal fee'));
    expect(fee).toBeDefined();
    expect(sim.ledger.account(accountId).withdrawalsThisMonth).toBe(4);
    // The month resets the count.
    endOfMonth(sim);
    expect(sim.ledger.account(accountId).withdrawalsThisMonth).toBe(0);
  });
});

describe('a certificate', () => {
  it('locks the money, pays a better rate, and takes a share of the interest back if you break it', () => {
    const sim = aLife('bank-cd');
    const { accountId, maturesAt } = must<{ accountId: string; maturesAt: number }>(sim, 'bank.open', { productId: 'nb_cd_12', deposit: 20_000_00, fromAccountId: checking(sim).id });
    const cd = sim.ledger.account(accountId);
    expect(maturesAt).toBeGreaterThan(sim.now);
    expect(sim.ledger.availableFunds(accountId)).toBe(0);
    expect(attempt(sim, 'finance.transfer', { fromAccountId: accountId, toAccountId: checking(sim).id, amount: 100_00 }).error).toMatch(/Not enough available/);

    for (let m = 0; m < 3; m++) endOfMonth(sim);
    const earned = sim.ledger.account(accountId).interestEarned ?? 0;
    expect(earned).toBeGreaterThan(0);
    const { penalty, proceeds } = breakingCost(sim.ledger.account(accountId));
    expect(penalty).toBe(Math.round(earned * 0.5));

    const before = balance(sim);
    const closed = must<{ moved: number; penalty: number }>(sim, 'bank.close', { accountId, toAccountId: checking(sim).id });
    expect(closed.penalty).toBe(penalty);
    expect(closed.moved).toBe(proceeds);
    expect(balance(sim)).toBe(before + proceeds);
    expect(sim.ledger.account(accountId).closedAt).toBeDefined();
    void cd;
  });

  it('frees the money when the term runs out', () => {
    const sim = aLife('bank-cd-mature');
    const { accountId } = must<{ accountId: string }>(sim, 'bank.open', { productId: 'nb_cd_12', deposit: 10_000_00, fromAccountId: checking(sim).id });
    for (let m = 0; m < 13; m++) endOfMonth(sim);
    const matured = sim.ledger.account(accountId);
    expect(matured.maturesAt).toBeUndefined();
    expect(sim.ledger.availableFunds(accountId)).toBe(matured.balance);
    expect(matured.balance).toBeGreaterThan(10_000_00);
    expect(breakingCost(matured).penalty).toBeGreaterThan(0);
    // Closing a matured certificate takes nothing.
    const closed = must<{ penalty: number }>(sim, 'bank.close', { accountId, toAccountId: checking(sim).id });
    expect(closed.penalty).toBe(0);
  });
});

describe('a card', () => {
  function aCard(sim: Simulation) {
    const { accountId, limit } = must<{ accountId: string; limit: number }>(sim, 'bank.open', { productId: 'nb_card_rewards' });
    return { cardId: accountId, limit };
  }

  it('is issued against your score, and spends up to its limit', () => {
    const sim = aLife('bank-card');
    const product = productById('nb_card_rewards')!;
    const expected = cardLimitFor(sim, product);
    const { cardId, limit } = aCard(sim);
    expect(limit).toBe(expected);
    expect(sim.ledger.availableFunds(cardId)).toBe(limit);
    sim.expense(cardId, 900_00, 'Dinner', 'food');
    expect(sim.ledger.availableFunds(cardId)).toBe(limit - 900_00);
  });

  it('closes a statement with a minimum and a date, and charges nothing if you clear it', () => {
    const sim = aLife('bank-card-clear');
    const { cardId } = aCard(sim);
    sim.expense(cardId, 1_200_00, 'A weekend', 'leisure');
    endOfMonth(sim);
    const card = sim.ledger.account(cardId);
    // The card's own monthly fee lands before the statement closes.
    expect(card.statementBalance).toBe(1_200_00 + 8_00);
    expect(card.paymentDueAt! - card.statementAt!).toBe(CARD_GRACE_DAYS * MS_DAY);
    const statement = statements(sim, cardId)[0]!;
    expect(statement.minimumDue).toBe(Math.max(40_00, Math.round(1_208_00 * 0.02)));
    expect(statement.closingBalance).toBe(-1_208_00);
    const ask = Object.values(sim.universe.decisions).find((d) => d.refType === 'account' && d.refId === cardId && !d.resolvedAt);
    expect(ask!.actions.map((a) => a.label)).toEqual(['Pay It In Full', 'Pay The Minimum']);

    must(sim, 'bank.pay_card', { accountId: cardId, how: 'full' });
    expect(sim.ledger.account(cardId).balance).toBe(0);
    endOfMonth(sim);
    // Cleared in full, so no interest, only the card's own monthly fee.
    expect(sim.ledger.history(cardId, 20).some((t) => t.memo.startsWith('Interest — '))).toBe(false);
    expect(sim.ledger.history(cardId, 20).some((t) => t.memo.startsWith('Monthly fee — '))).toBe(true);
  });

  it('charges interest on what you carry, and a fee and a mark if you do not pay the minimum', () => {
    const sim = aLife('bank-card-carry');
    const { cardId } = aCard(sim);
    sim.expense(cardId, 3_000_00, 'A very good weekend', 'leisure');
    endOfMonth(sim);
    must(sim, 'bank.pay_card', { accountId: cardId, how: 'minimum' });
    const statement = statements(sim, cardId)[0]!;
    expect(sim.ledger.account(cardId).paidSinceStatement).toBe(statement.minimumDue);

    const lateFees = () => sim.ledger.history(cardId, 60).filter((t) => t.memo.startsWith('Late fee — '));
    const lateBefore = sim.universe.creditProfiles[sim.player.id]!.latePayments;
    endOfMonth(sim);
    // The minimum was paid, so no late fee on the card, but the carried balance costs.
    expect(lateFees()).toHaveLength(0);
    expect(sim.ledger.history(cardId, 30).some((t) => t.memo.startsWith('Interest — '))).toBe(true);

    // Now pay nothing at all.
    endOfMonth(sim);
    expect(lateFees()).toHaveLength(1);
    expect(lateFees()[0]!.postings.some((p) => p.accountId === cardId && p.amount === -40_00)).toBe(true);
    expect(sim.universe.creditProfiles[sim.player.id]!.latePayments).toBeGreaterThan(lateBefore);
  });

  it('will not be closed while it is owed money', () => {
    const sim = aLife('bank-card-close');
    const { cardId } = aCard(sim);
    sim.expense(cardId, 500_00, 'Shoes', 'shopping');
    expect(attempt(sim, 'bank.close', { accountId: cardId }).error).toMatch(/Clear the \$500.00 on/);
    must(sim, 'bank.pay_card', { accountId: cardId, how: 'full' });
    expect(attempt(sim, 'bank.close', { accountId: cardId }).ok).toBe(true);
  });
});

describe('standing orders', () => {
  it('run on their day, and stop after three they cannot pay', () => {
    const sim = aLife('bank-standing', 3_000_00);
    const savings = must<{ accountId: string }>(sim, 'bank.open', { productId: 'nb_savings', deposit: 0 });
    const day = 5;
    const { orderId } = must<{ orderId: string }>(sim, 'bank.create_standing_order', {
      name: 'Into Savings', fromAccountId: checking(sim).id, toAccountId: savings.accountId, amount: 1_000_00, dayOfMonth: day,
    });
    expect(standingOrders(sim, sim.player.id)).toHaveLength(1);
    expect(attempt(sim, 'bank.create_standing_order', { name: 'Bad', fromAccountId: checking(sim).id, toAccountId: checking(sim).id, amount: 100, dayOfMonth: 5 }).error).toMatch(/already is/);
    expect(attempt(sim, 'bank.create_standing_order', { name: 'Bad', fromAccountId: checking(sim).id, toAccountId: savings.accountId, amount: 100, dayOfMonth: 31 }).error).toMatch(/1st to the 28th/);

    // Three months: two run, then the money runs out.
    for (let m = 0; m < 4; m++) sim.advanceTo(sim.now + 31 * MS_DAY);
    const moved = sim.ledger.account(savings.accountId).balance;
    expect(moved).toBeGreaterThanOrEqual(1_000_00);
    const order = sim.universe.standingOrders![orderId]!;
    expect(order.missed + Math.round(moved / 1_000_00)).toBeGreaterThanOrEqual(2);

    // Empty the account and let it fail its way out.
    const left = sim.ledger.availableFunds(checking(sim).id);
    if (left > 0) must(sim, 'finance.transfer', { fromAccountId: checking(sim).id, toAccountId: savings.accountId, amount: left });
    for (let m = 0; m < STANDING_ORDER_STRIKES + 1; m++) sim.advanceTo(sim.now + 31 * MS_DAY);
    const stopped = sim.universe.standingOrders![orderId]!;
    expect(stopped.active).toBe(false);
    expect(stopped.endedReason).toMatch(/three times|account it used/);
  });

  it('can be canceled, and blocks closing the account it uses until it is', () => {
    const sim = aLife('bank-standing-close');
    const savings = must<{ accountId: string }>(sim, 'bank.open', { productId: 'nb_savings', deposit: 0 });
    const { orderId } = must<{ orderId: string }>(sim, 'bank.create_standing_order', {
      name: 'Into Savings', fromAccountId: checking(sim).id, toAccountId: savings.accountId, amount: 100_00, dayOfMonth: 12,
    });
    expect(attempt(sim, 'bank.close', { accountId: savings.accountId }).error).toMatch(/standing order/);
    must(sim, 'bank.cancel_standing_order', { orderId });
    expect(sim.universe.standingOrders![orderId]!.active).toBe(false);
    expect(attempt(sim, 'bank.close', { accountId: savings.accountId }).ok).toBe(true);
  });
});

describe('closing an account', () => {
  it('refuses the last one your money comes into, and refuses one that bills are pointed at', () => {
    const sim = aLife('bank-close');
    const primary = checking(sim).id;
    expect(attempt(sim, 'bank.close', { accountId: primary }).error).toMatch(/only account your money comes into|bill/);
    const second = must<{ accountId: string }>(sim, 'bank.open', { productId: 'nb_everyday', deposit: 100_00, fromAccountId: primary });
    // Bills still point at the first one.
    expect(attempt(sim, 'bank.close', { accountId: primary }).error).toMatch(/bills are paid from|bill is paid from/);
    const moved = must<{ moved: number }>(sim, 'bank.close', { accountId: second.accountId, toAccountId: primary });
    expect(moved.moved).toBe(100_00);
    expect(myAccounts(sim).some((a) => a.id === second.accountId)).toBe(false);
  });
});

describe('statements', () => {
  it('are written every month and add up', () => {
    const sim = aLife('bank-statements');
    const id = checking(sim).id;
    // The first statement covers the account's whole life, so it opens at
    // nothing. The interesting one is the second.
    endOfMonth(sim);
    expect(statements(sim, id)[0]!.openingBalance).toBe(0);
    const opening = statements(sim, id)[0]!.closingBalance;
    sim.expense(id, 2_000_00, 'Rent', 'housing');
    sim.income(id, 500_00, 'A check', 'other');
    endOfMonth(sim);
    const statement = statements(sim, id)[0]!;
    expect(statement.period).toMatch(/^\d{4}-\d{2}$/);
    // The statement adds up on its own terms; the account has moved on since.
    expect(statement.openingBalance + statement.credits - statement.debits).toBe(statement.closingBalance);
    // One statement opens where the last one closed. Nothing falls between them.
    expect(statement.openingBalance).toBe(opening);
    expect(statement.debits).toBeGreaterThanOrEqual(2_000_00);
    expect(statement.credits).toBeGreaterThanOrEqual(500_00);
    expect(statement.transactionCount).toBeGreaterThanOrEqual(2);
    // Every open account gets one.
    expect(statements(sim).length).toBeGreaterThanOrEqual(myAccounts(sim).length);
  });
});

describe('saves from before', () => {
  it('puts old accounts on the product they most resemble, without touching a balance', () => {
    const sim = quickSave({}, 'bank-migrate');
    const before = Object.values(sim.universe.accounts).filter((a) => !a.nominal).map((a) => [a.id, a.balance] as const);
    for (const account of Object.values(sim.universe.accounts)) delete account.productId;
    sim.universe.meta.schemaVersion = 40;
    const result = migrate(sim.universe);
    expect(result.migrated).toBe(true);
    const matched = ensureProducts(sim);
    expect(matched).toBeGreaterThan(0);
    for (const [id, was] of before) {
      const account = sim.universe.accounts[id]!;
      expect(account.balance, id).toBe(was);
      if (account.kind === 'checking') expect(account.productId).toBe('nb_everyday');
      if (account.kind === 'savings') expect(account.productId).toBe('nb_savings');
    }
    // Cover starts switched off on an account that never had it.
    for (const account of Object.values(sim.universe.accounts)) {
      if (account.kind === 'checking') expect(account.overdraftOptIn).toBe(false);
    }
    const loaded = loadSave(sim.universe);
    expect(ensureProducts(loaded)).toBe(0);
  });
});
