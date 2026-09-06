/**
 * SLATE — banking, as a bank rather than a ledger view.
 *
 * An account is opened on a product with a minimum, a monthly fee that a big
 * enough balance waives, and a rate. Checking can be covered when it runs
 * out, for a fee an item, or it declines. Savings counts your withdrawals and
 * charges for the ones past the allowance. A certificate locks the money for
 * a term and takes back a share of the interest if you break it. A card runs
 * a real cycle: the statement closes, a minimum is due by a date, paying in
 * full costs nothing, carrying costs interest on what is carried, and being
 * late costs a fee and some of your score. Standing orders move money between
 * your own accounts on a day of the month until they cannot.
 *
 * Every rate, fee and limit is SLATE's own; see `src/engine/content/banking.ts`.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { AccountStatement, Id, StandingOrder } from '../domain/model';
import type { Account } from '../core/ledger';
import { isLiability } from '../core/ledger';
import { applyRate, formatMoney, type Money } from '../core/money';
import { MS_DAY, addDays, addMonths, formatDate, instantFromZoned, zonedParts } from '../core/time';
import { clamp } from '../core/rng';
import {
  BANK_PRODUCTS, INSTITUTIONS, institutionById, productById, productLabel, productsOf,
  type BankProduct, type ProductFamily,
} from '../content/banking';
import { offeredApr, recomputeCreditScore } from './finance';

/** Days from the statement closing to the payment being due. */
export const CARD_GRACE_DAYS = 21;
/** How many months of statements a save keeps per account. */
export const STATEMENTS_KEPT = 24;
/** Missed runs before the bank gives up on a standing order. */
export const STANDING_ORDER_STRIKES = 3;

export const NO_SUCH_PRODUCT = 'No such product.';
export const NOT_YOURS = 'That is not your account.';

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

export function statements(sim: Simulation, accountId?: Id): AccountStatement[] {
  return Object.values(sim.universe.accountStatements ?? {})
    .filter((s) => !accountId || s.accountId === accountId)
    .sort((a, b) => b.closedAt - a.closedAt);
}

export function standingOrders(sim: Simulation, ownerId?: Id): StandingOrder[] {
  return Object.values(sim.universe.standingOrders ?? {})
    .filter((o) => !ownerId || o.ownerId === ownerId)
    .sort((a, b) => a.dayOfMonth - b.dayOfMonth);
}

export function productOf(account: Account): BankProduct | undefined {
  return account.productId ? productById(account.productId) : undefined;
}

/** What this month's maintenance fee would be, given the balance now. */
export function monthlyFeeFor(account: Account): Money {
  const product = productOf(account);
  if (!product || product.monthlyFee <= 0) return 0;
  if (product.feeWaivedAbove > 0 && account.balance >= product.feeWaivedAbove) return 0;
  return product.monthlyFee;
}

/** Why a product cannot be opened right now, or nothing. */
export function openingRefusal(sim: Simulation, product: BankProduct, deposit: Money, fromAccountId?: Id): string | undefined {
  if (product.family === 'card') {
    const score = sim.universe.creditProfiles[sim.player.id]?.score ?? 600;
    if (score < (product.minimumScore ?? 560)) {
      return `${productLabel(product)} wants a score of ${product.minimumScore}. Yours is ${score}.`;
    }
    return undefined;
  }
  if (deposit < product.minimumOpening) {
    return `${productLabel(product)} takes ${formatMoney(product.minimumOpening)} to open.`;
  }
  if (product.minimumOpening > 0 && !fromAccountId) return 'Choose an account to fund it from.';
  if (fromAccountId && deposit > 0 && sim.ledger.availableFunds(fromAccountId) < deposit) {
    return `There is not ${formatMoney(deposit)} in ${sim.ledger.account(fromAccountId).name}.`;
  }
  return undefined;
}

/** What a card of this product would lend you, given your score. */
export function cardLimitFor(sim: Simulation, product: BankProduct): Money {
  const score = sim.universe.creditProfiles[sim.player.id]?.score ?? 600;
  const base = product.baseCreditLimit ?? 1_000_00;
  return Math.round(base * clamp(0.4 + (score - 500) / 400, 0.4, 1.6) / 100_00) * 100_00 || base;
}

/** What breaking a certificate today would cost, and what would land in the account. */
export function breakingCost(account: Account): { penalty: Money; proceeds: Money } {
  const product = productOf(account);
  const earned = account.interestEarned ?? 0;
  const share = product?.earlyExitShare ?? 0.5;
  const penalty = Math.round(earned * share);
  return { penalty, proceeds: Math.max(0, account.balance - penalty) };
}

/** The player's own accounts, open, newest last. */
export function myAccounts(sim: Simulation): Account[] {
  return sim.ledger.accountsOf(sim.player.id).filter((a) => !a.nominal && !a.closedAt);
}

// ---------------------------------------------------------------------------
// Statements
// ---------------------------------------------------------------------------

function periodOf(sim: Simulation, at: number): string {
  const p = zonedParts(at, sim.homeZone);
  return `${p.year}-${String(p.month).padStart(2, '0')}`;
}

/** Everything posted to an account between two instants, summed the way a statement sums it. */
function movement(sim: Simulation, accountId: Id, from: number, to: number): { credits: Money; debits: Money; fees: Money; interest: Money; count: number } {
  let credits = 0, debits = 0, fees = 0, interest = 0, count = 0;
  for (const txn of sim.universe.transactions) {
    if (txn.at < from || txn.at >= to) continue;
    const delta = txn.postings.reduce((sum, p) => (p.accountId === accountId ? sum + p.amount : sum), 0);
    if (delta === 0) continue;
    count += 1;
    if (delta > 0) credits += delta; else debits += -delta;
    if (txn.category === 'fees') fees += Math.abs(delta);
    if (txn.category === 'interest') interest += delta;
  }
  return { credits, debits, fees, interest, count };
}

function writeStatement(sim: Simulation, account: Account, from: number, to: number): AccountStatement {
  const m = movement(sim, account.id, from, to);
  const closing = account.balance;
  const statement: AccountStatement = {
    id: sim.nextId('statement'),
    saveId: sim.universe.meta.id,
    accountId: account.id,
    period: periodOf(sim, from),
    openedAt: from,
    closedAt: to,
    openingBalance: closing - m.credits + m.debits,
    credits: m.credits,
    debits: m.debits,
    fees: m.fees,
    interest: m.interest,
    closingBalance: closing,
    transactionCount: m.count,
  };
  sim.universe.accountStatements ??= {};
  sim.universe.accountStatements[statement.id] = statement;
  return statement;
}

function pruneStatements(sim: Simulation, accountId: Id): void {
  const mine = statements(sim, accountId);
  for (const old of mine.slice(STATEMENTS_KEPT)) delete sim.universe.accountStatements?.[old.id];
}

// ---------------------------------------------------------------------------
// Charges
// ---------------------------------------------------------------------------

function charge(sim: Simulation, account: Account, amount: Money, memo: string): void {
  if (amount <= 0) return;
  const expense = sim.nominalAccount('expense', 'Bank charges');
  sim.post({
    memo, category: 'fees',
    postings: [{ accountId: account.id, amount: -amount }, { accountId: expense.id, amount }],
    refType: 'account', refId: account.id,
  });
}

function credit(sim: Simulation, account: Account, amount: Money, memo: string, category = 'interest'): void {
  if (amount <= 0) return;
  const income = sim.nominalAccount('income', 'Interest and rebates');
  sim.post({
    memo, category,
    postings: [{ accountId: account.id, amount }, { accountId: income.id, amount: -amount }],
    refType: 'account', refId: account.id,
  });
}

/**
 * Cover, checked once a day: an account that has gone below zero since the
 * last look is charged the fee for it, once for that episode rather than once
 * a day it stays there. Coming back above zero ends the episode.
 */
export function chargeCover(sim: Simulation): void {
  for (const account of Object.values(sim.universe.accounts)) {
    if (account.nominal || account.closedAt || isLiability(account.kind)) continue;
    if (account.balance >= 0) { account.inCoverSince = undefined; continue; }
    if (account.inCoverSince) continue;
    account.inCoverSince = sim.now;
    const fee = productOf(account)?.overdraftItemFee ?? 0;
    if (fee > 0) charge(sim, account, fee, `Cover fee — ${account.name}`);
    sim.notify({
      category: 'finance', title: `${account.name} Is Into Its Cover`,
      body: `${formatMoney(-account.balance)} below zero.${fee > 0 ? ` ${formatMoney(fee)} for going there.` : ''} Put it right before it grows.`,
      importance: 54, route: '/workspace/bank', refType: 'account', refId: account.id,
    });
    sim.emit('bank.overdrawn', { accountId: account.id, fee, short: -account.balance });
  }
}

/** A withdrawal from savings, counted, and charged for if it is past the allowance. */
export function countWithdrawal(sim: Simulation, accountId: Id): Money {
  const account = sim.ledger.tryAccount(accountId);
  const product = account ? productOf(account) : undefined;
  if (!account || !product || product.family !== 'savings' || !product.freeWithdrawals) return 0;
  account.withdrawalsThisMonth = (account.withdrawalsThisMonth ?? 0) + 1;
  if (account.withdrawalsThisMonth <= product.freeWithdrawals) return 0;
  const fee = product.excessWithdrawalFee ?? 0;
  if (fee > 0) charge(sim, account, fee, `Withdrawal fee — ${account.name}`);
  return fee;
}

// ---------------------------------------------------------------------------
// The monthly close
// ---------------------------------------------------------------------------

/**
 * A month on every account: the maintenance fee, the interest paid or
 * charged, the statement, and on a card the cycle that decides all of it.
 */
export function closeMonth(sim: Simulation): void {
  const now = sim.now;
  for (const account of Object.values(sim.universe.accounts)) {
    if (account.nominal || account.closedAt) continue;
    // A statement covers everything since the last one, so nothing falls
    // between two of them however the clock actually ran.
    const last = statements(sim, account.id)[0];
    const from = Math.max(last?.closedAt ?? account.openedAt, addMonths(now, -2, sim.homeZone));
    const product = productOf(account);

    // Maintenance, where the balance did not earn the waiver.
    const fee = monthlyFeeFor(account);
    if (fee > 0) charge(sim, account, fee, `Monthly fee — ${account.name}`);

    if (account.kind === 'credit_card' || account.kind === 'company_credit') {
      closeCardCycle(sim, account, from, now);
      continue;
    }
    if (now <= from) continue;

    // Interest on money you are keeping there.
    if (product && product.apy > 0 && account.balance > 0) {
      const interest = applyRate(account.balance, product.apy / 12);
      if (interest > 0) {
        credit(sim, account, interest, `Interest — ${account.name}`);
        if (account.maturesAt) account.interestEarned = (account.interestEarned ?? 0) + interest;
      }
    } else if (!product && account.kind === 'savings' && account.balance > 0) {
      // An account from before products, left on the old rate rather than
      // silently repriced.
      credit(sim, account, applyRate(account.balance, 0.021 / 12), `Interest — ${account.name}`);
    }

    // Interest owed on a loan is the loan's own, not a product's.
    if (isLiability(account.kind) && account.balance < 0 && account.apr) {
      const owed = applyRate(-account.balance, account.apr / 12);
      if (owed > 0) {
        const expense = sim.nominalAccount('expense', 'Interest charged');
        sim.post({
          memo: `Interest — ${account.name}`, category: 'interest',
          postings: [{ accountId: account.id, amount: -owed }, { accountId: expense.id, amount: owed }],
          refType: 'account', refId: account.id,
        });
      }
    }

    account.withdrawalsThisMonth = 0;
    writeStatement(sim, account, from, now);
    pruneStatements(sim, account.id);

    if (account.maturesAt && now >= account.maturesAt) matureCertificate(sim, account);
  }
}

/** A card's month: what you owe, the least they will take, and by when. */
function closeCardCycle(sim: Simulation, account: Account, from: number, now: number): void {
  const product = productOf(account);
  const owed = Math.max(0, -account.balance);

  // Last cycle first: was the statement paid by its date?
  const previous = account.statementBalance ?? 0;
  if (previous > 0) {
    const paid = account.paidSinceStatement ?? 0;
    const minimum = minimumFor(product, previous);
    if (paid + 1 < minimum) {
      const late = product?.lateFee ?? 40_00;
      if (late > 0) charge(sim, account, late, `Late fee — ${account.name}`);
      const profile = sim.universe.creditProfiles[account.ownerId];
      if (profile) profile.latePayments += 1;
      sim.notify({
        category: 'finance', title: `${account.name} Was Not Paid`,
        body: `${formatMoney(minimum)} was the least they would take and ${formatMoney(paid)} arrived.${late > 0 ? ` ${formatMoney(late)} late fee.` : ''} It goes on your record.`,
        importance: 72, route: '/workspace/bank', refType: 'account', refId: account.id,
      });
      sim.emit('bank.card_late', { accountId: account.id, minimum, paid });
    }
    // Interest is charged on what was carried, not on what was cleared.
    const carried = Math.max(0, previous - paid);
    if (carried > 0 && account.apr) {
      const interest = applyRate(carried, account.apr / 12);
      if (interest > 0) {
        const expense = sim.nominalAccount('expense', 'Interest charged');
        sim.post({
          memo: `Interest — ${account.name}`, category: 'interest',
          postings: [{ accountId: account.id, amount: -interest }, { accountId: expense.id, amount: interest }],
          refType: 'account', refId: account.id,
        });
      }
    }
  }

  // Then this cycle's statement.
  const statement = writeStatement(sim, account, from, now);
  const balance = Math.max(0, -account.balance);
  account.statementBalance = balance;
  account.statementAt = now;
  account.paidSinceStatement = 0;
  account.paymentDueAt = balance > 0 ? addDays(now, CARD_GRACE_DAYS, sim.homeZone) : undefined;
  statement.minimumDue = balance > 0 ? minimumFor(product, balance) : 0;
  statement.dueAt = account.paymentDueAt;
  pruneStatements(sim, account.id);

  if (balance > 0) {
    sim.requireDecision({
      urgency: 52, category: 'finance',
      title: `${account.name} Statement`,
      detail: `${formatMoney(balance)} on the statement. The least they will take is ${formatMoney(statement.minimumDue ?? 0)}, by ${formatDate(account.paymentDueAt ?? now, sim.homeZone)}. Pay it all and there is no interest.`,
      route: '/workspace/bank',
      actions: [
        { label: 'Pay It In Full', commandKind: 'bank.pay_card', payload: { accountId: account.id, how: 'full' } },
        { label: 'Pay The Minimum', commandKind: 'bank.pay_card', payload: { accountId: account.id, how: 'minimum' } },
      ],
      dueAt: account.paymentDueAt,
      refType: 'account', refId: account.id,
    });
  }
  void owed;
}

function minimumFor(product: BankProduct | undefined, balance: Money): Money {
  const share = product?.minimumShare ?? 0.02;
  const floor = product?.minimumFloor ?? 35_00;
  return Math.min(balance, Math.max(floor, Math.round(balance * share)));
}

/** A certificate has run its term: the money is free again. */
function matureCertificate(sim: Simulation, account: Account): void {
  account.maturesAt = undefined;
  sim.notify({
    category: 'finance', title: `${account.name} Has Matured`,
    body: `${formatMoney(account.balance)} is yours to move, with ${formatMoney(account.interestEarned ?? 0)} of interest on it.`,
    importance: 44, route: '/workspace/bank', refType: 'account', refId: account.id,
  });
  sim.emit('bank.matured', { accountId: account.id, balance: account.balance });
}

// ---------------------------------------------------------------------------
// Standing orders
// ---------------------------------------------------------------------------

function runStandingOrders(sim: Simulation): void {
  const today = zonedParts(sim.now, sim.homeZone).day;
  for (const order of standingOrders(sim)) {
    if (!order.active || order.dayOfMonth !== today) continue;
    if (order.lastRunAt && sim.now - order.lastRunAt < 20 * MS_DAY) continue;
    const from = sim.ledger.tryAccount(order.fromAccountId);
    const to = sim.ledger.tryAccount(order.toAccountId);
    if (!from || !to || from.closedAt || to.closedAt) { stopOrder(sim, order, 'An account it used has gone.'); continue; }
    if (sim.ledger.availableFunds(order.fromAccountId) < order.amount) {
      order.missed += 1;
      sim.notify({
        category: 'finance', title: `${order.name} Did Not Go Out`,
        body: `${formatMoney(order.amount)} was not there in ${from.name}. ${order.missed >= STANDING_ORDER_STRIKES ? 'The bank has stopped trying.' : `Missed ${order.missed} of ${STANDING_ORDER_STRIKES}.`}`,
        importance: 50, route: '/workspace/bank', refType: 'account', refId: from.id,
      });
      if (order.missed >= STANDING_ORDER_STRIKES) stopOrder(sim, order, 'It could not be paid three times.');
      continue;
    }
    sim.transfer(order.fromAccountId, order.toAccountId, order.amount, order.name, 'transfer');
    countWithdrawal(sim, order.fromAccountId);
    order.lastRunAt = sim.now;
    order.missed = 0;
    sim.emit('bank.standing_order_ran', { orderId: order.id, amount: order.amount });
  }
}

function stopOrder(sim: Simulation, order: StandingOrder, why: string): void {
  order.active = false;
  order.endedAt = sim.now;
  order.endedReason = why;
  sim.emit('bank.standing_order_stopped', { orderId: order.id, why });
}

// ---------------------------------------------------------------------------
// Bringing old accounts onto products
// ---------------------------------------------------------------------------

/**
 * A save from before products: each account is matched to the product it most
 * resembles, so it gains the fee, the cover and the rate that shape it now.
 * Idempotent, and no balance is touched.
 */
export function ensureProducts(sim: Simulation): number {
  let matched = 0;
  for (const account of Object.values(sim.universe.accounts)) {
    if (account.nominal || account.closedAt || account.productId) continue;
    const product = account.kind === 'checking' ? productById('nb_everyday')
      : account.kind === 'savings' ? productById('nb_savings')
        : account.kind === 'credit_card' ? productById('nb_card_everyday')
          : undefined;
    if (!product) continue;
    account.productId = product.id;
    account.overdraftLimit = product.overdraftLimit;
    account.overdraftOptIn = account.overdraftOptIn ?? false;
    if (account.kind === 'credit_card' && !account.creditLimit) account.creditLimit = product.baseCreditLimit;
    matched += 1;
  }
  return matched;
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerBanking(sim: Simulation): void {
  sim.onSchedule('bank.month', () => {
    closeMonth(sim);
    sim.schedule({
      at: firstOfNextMonth(sim), kind: 'bank.month', label: 'Statements And Interest',
      category: 'finance', priority: 18,
    });
  });

  sim.onSchedule('bank.day', () => {
    runStandingOrders(sim);
    chargeCover(sim);
    sim.schedule({ at: addDays(sim.now, 1, sim.homeZone), kind: 'bank.day', label: 'Standing Orders', category: 'system', priority: 19 });
  });

  // --- Opening and closing -------------------------------------------------

  // The clocks, so a save made rather than loaded still has a month and a day.
  ensureBankClocks(sim);

  sim.onCommand<{ productId: string; deposit?: Money; fromAccountId?: Id; name?: string }, { accountId: Id; limit?: Money; maturesAt?: number }>(
    'bank.open',
    (p, { sim: s }) => {
      const product = productById(p.productId);
      if (!product) throw new CommandError(NO_SUCH_PRODUCT);
      const deposit = Math.max(0, p.deposit ?? product.minimumOpening);
      const refusal = openingRefusal(s, product, deposit, p.fromAccountId);
      if (refusal) throw new CommandError(refusal);

      const isCard = product.family === 'card';
      const limit = isCard ? cardLimitFor(s, product) : undefined;
      const account = s.openAccount({
        id: s.nextId('account'),
        kind: product.kind,
        name: p.name?.trim() || product.name,
        ownerId: s.player.id,
        institution: institutionById(product.institutionId)?.name ?? 'Northbank',
        openedAt: s.now,
        productId: product.id,
        creditLimit: limit,
        apr: isCard ? offeredApr(s.universe.creditProfiles[s.player.id]?.score ?? 600, 'card') : undefined,
        overdraftLimit: product.overdraftLimit,
        overdraftOptIn: false,
        last4: String(1000 + (s.counter('account_last4') * 7919) % 9000),
        maturesAt: product.termMonths ? addMonths(s.now, product.termMonths, s.homeZone) : undefined,
        interestEarned: product.termMonths ? 0 : undefined,
      });

      if (isCard) {
        const profile = s.universe.creditProfiles[s.player.id];
        profile?.hardInquiries.push({ at: s.now, reason: `${productLabel(product)} application` });
      } else if (deposit > 0 && p.fromAccountId) {
        s.transfer(p.fromAccountId, account.id, deposit, `Opening ${account.name}`, 'transfer');
        countWithdrawal(s, p.fromAccountId);
      }
      recomputeCreditScore(s, s.player.id);
      s.emit('bank.opened', { accountId: account.id, productId: product.id, deposit });
      s.remember({
        category: 'finance', title: `Opened ${productLabel(product)}`,
        detail: isCard ? `A limit of ${formatMoney(limit ?? 0)}.` : `${formatMoney(deposit)} in it${product.termMonths ? `, locked until ${formatDate(account.maturesAt ?? s.now, s.homeZone)}` : ''}.`,
        refs: [], significance: 14, public: false, amount: deposit,
      });
      return { accountId: account.id, limit, maturesAt: account.maturesAt };
    },
  );

  sim.onCommand<{ accountId: Id; toAccountId?: Id }, { moved: Money; penalty: Money }>(
    'bank.close',
    (p, { sim: s }) => {
      const account = s.ledger.account(p.accountId);
      if (account.ownerId !== s.player.id) throw new CommandError(NOT_YOURS);
      if (account.closedAt) throw new CommandError('That account is already closed.');
      if (account.nominal) throw new CommandError('That is not an account you hold.');
      if (isLiability(account.kind) && account.balance < 0) {
        throw new CommandError(`Clear the ${formatMoney(-account.balance)} on ${account.name} before closing it.`);
      }
      if (s.player.primaryAccountId === account.id && myAccounts(s).filter((a) => a.kind === 'checking' || a.kind === 'cash').length <= 1) {
        throw new CommandError('That is the only account your money comes into. Open another first.');
      }
      const pointed = Object.values(s.universe.bills).filter((b) => b.active && b.autopayAccountId === account.id);
      if (pointed.length > 0) throw new CommandError(`${pointed.length} bill${pointed.length === 1 ? ' is' : 's are'} paid from ${account.name}. Point ${pointed.length === 1 ? 'it' : 'them'} somewhere else first.`);
      const orders = standingOrders(s, s.player.id).filter((o) => o.active && (o.fromAccountId === account.id || o.toAccountId === account.id));
      if (orders.length > 0) throw new CommandError(`${orders.length} standing order${orders.length === 1 ? '' : 's'} use${orders.length === 1 ? 's' : ''} ${account.name}. Cancel ${orders.length === 1 ? 'it' : 'them'} first.`);

      let penalty = 0;
      let moved = 0;
      if (account.balance > 0) {
        const to = p.toAccountId ?? myAccounts(s).find((a) => a.id !== account.id && (a.kind === 'checking' || a.kind === 'savings' || a.kind === 'cash'))?.id;
        if (!to) throw new CommandError('There is nowhere to move the money to.');
        if (account.maturesAt && s.now < account.maturesAt) {
          const broken = breakingCost(account);
          penalty = broken.penalty;
          if (penalty > 0) charge(s, account, penalty, `Early withdrawal — ${account.name}`);
        }
        moved = account.balance;
        if (moved > 0) s.transfer(account.id, to, moved, `Closing ${account.name}`, 'transfer');
      }
      account.closedAt = s.now;
      if (s.player.primaryAccountId === account.id) {
        s.player.primaryAccountId = myAccounts(s).find((a) => a.kind === 'checking' || a.kind === 'cash')?.id;
      }
      recomputeCreditScore(s, s.player.id);
      s.emit('bank.closed', { accountId: account.id, moved, penalty });
      return { moved, penalty };
    },
  );

  // --- Cover ----------------------------------------------------------------

  sim.onCommand<{ accountId: Id; on: boolean }, { on: boolean; limit: Money }>(
    'bank.set_overdraft',
    (p, { sim: s }) => {
      const account = s.ledger.account(p.accountId);
      if (account.ownerId !== s.player.id) throw new CommandError(NOT_YOURS);
      const product = productOf(account);
      if (!product?.overdraftLimit) throw new CommandError(`${account.name} does not come with cover.`);
      if (!p.on && account.balance < 0) throw new CommandError(`${account.name} is ${formatMoney(-account.balance)} into its cover. Put it right before switching it off.`);
      account.overdraftOptIn = p.on;
      account.overdraftLimit = product.overdraftLimit;
      s.emit('bank.overdraft_set', { accountId: account.id, on: p.on });
      return { on: p.on, limit: product.overdraftLimit };
    },
  );

  // --- The card -------------------------------------------------------------

  sim.onCommand<{ accountId: Id; how?: 'full' | 'minimum' | 'amount'; amount?: Money; fromAccountId?: Id }, { paid: Money; remaining: Money }>(
    'bank.pay_card',
    (p, { sim: s }) => {
      const card = s.ledger.account(p.accountId);
      if (card.ownerId !== s.player.id) throw new CommandError(NOT_YOURS);
      if (card.kind !== 'credit_card' && card.kind !== 'company_credit') throw new CommandError('That is not a card.');
      const owed = Math.max(0, -card.balance);
      if (owed <= 0) throw new CommandError(`There is nothing owing on ${card.name}.`);
      const statement = card.statementBalance ?? 0;
      const minimum = Math.min(owed, minimumFor(productOf(card), statement || owed));
      const how = p.how ?? 'amount';
      const wanted = how === 'full' ? owed : how === 'minimum' ? minimum : Math.max(0, p.amount ?? 0);
      if (wanted <= 0) throw new CommandError('Pay something.');
      const amount = Math.min(owed, wanted);
      const fromId = p.fromAccountId ?? s.player.primaryAccountId;
      if (!fromId) throw new CommandError('No account to pay from.');
      if (s.ledger.availableFunds(fromId) < amount) {
        throw new CommandError(`${formatMoney(amount)} is more than is available in ${s.ledger.account(fromId).name}.`);
      }
      s.transfer(fromId, card.id, amount, `Payment — ${card.name}`, 'transfer');
      countWithdrawal(s, fromId);
      card.paidSinceStatement = (card.paidSinceStatement ?? 0) + amount;
      const remaining = Math.max(0, -card.balance);
      if ((card.paidSinceStatement ?? 0) >= statement) s.resolveDecision('account', card.id);
      s.emit('bank.card_paid', { accountId: card.id, amount, remaining });
      return { paid: amount, remaining };
    },
  );

  // --- Standing orders ------------------------------------------------------

  sim.onCommand<{ name: string; fromAccountId: Id; toAccountId: Id; amount: Money; dayOfMonth: number }, { orderId: Id }>(
    'bank.create_standing_order',
    (p, { sim: s }) => {
      const from = s.ledger.account(p.fromAccountId);
      const to = s.ledger.account(p.toAccountId);
      if (from.ownerId !== s.player.id || to.ownerId !== s.player.id) throw new CommandError('Both accounts have to be yours.');
      if (from.id === to.id) throw new CommandError('That would move money to where it already is.');
      if (p.amount <= 0) throw new CommandError('A standing order needs an amount.');
      const day = Math.round(p.dayOfMonth);
      if (!Number.isFinite(day) || day < 1 || day > 28) throw new CommandError('Pick a day from the 1st to the 28th.');
      const name = p.name.replace(/\s+/g, ' ').trim();
      if (name.length === 0) throw new CommandError('Give it a name.');
      s.universe.standingOrders ??= {};
      const order: StandingOrder = {
        id: s.nextId('standing'), saveId: s.universe.meta.id, ownerId: s.player.id, name,
        fromAccountId: from.id, toAccountId: to.id, amount: p.amount, dayOfMonth: day,
        active: true, createdAt: s.now, missed: 0,
      };
      s.universe.standingOrders[order.id] = order;
      s.emit('bank.standing_order_created', { orderId: order.id, amount: order.amount });
      return { orderId: order.id };
    },
  );

  sim.onCommand<{ orderId: Id }, { stopped: boolean }>(
    'bank.cancel_standing_order',
    (p, { sim: s }) => {
      const order = s.universe.standingOrders?.[p.orderId];
      if (!order || !order.active) throw new CommandError('There is no standing order like that.');
      stopOrder(s, order, 'You cancelled it.');
      return { stopped: true };
    },
  );
}

/**
 * The monthly and daily clocks the bank runs on. Called when a save loads,
 * and idempotent: a save that already has them keeps the ones it has.
 */
export function ensureBankClocks(sim: Simulation): void {
  const pending = sim.timeline.pending();
  if (!pending.some((i) => i.kind === 'bank.month')) {
    sim.schedule({ at: firstOfNextMonth(sim), kind: 'bank.month', label: 'Statements And Interest', category: 'finance', priority: 18 });
  }
  if (!pending.some((i) => i.kind === 'bank.day')) {
    sim.schedule({ at: addDays(sim.now, 1, sim.homeZone), kind: 'bank.day', label: 'Standing Orders', category: 'system', priority: 19 });
  }
}

/** The first of next month, at nine, in the home zone. */
function firstOfNextMonth(sim: Simulation): number {
  const p = zonedParts(sim.now, sim.homeZone);
  const month = p.month === 12 ? 1 : p.month + 1;
  const year = p.month === 12 ? p.year + 1 : p.year;
  return instantFromZoned({ year, month, day: 1, hour: 9 }, sim.homeZone);
}

export { BANK_PRODUCTS, INSTITUTIONS, productById, productLabel, productsOf, type BankProduct, type ProductFamily };
