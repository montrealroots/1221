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
import { FBAR_NOTE, FBAR_THRESHOLD, PRIVATE_BANKS, REAL_CARDS, REPORTING_NOTE, privateBankById, type PrivateBank } from '../content/wealth';
import { COUNTRIES } from '../content/geography';
import { passportCheck, residenceCountryOf } from './documents';
import type { PrivateApplication } from '../domain/model';
import { requireAge } from './lifespan';

/** Days from the statement closing to the payment being due. */
export const CARD_GRACE_DAYS = 21;
/** How many months of statements a save keeps per account. */
export const STATEMENTS_KEPT = 24;
/** Missed runs before the bank gives up on a standing order. */
export const STANDING_ORDER_STRIKES = 3;

export const NO_SUCH_PRODUCT = 'No such product.';
export const NOT_YOURS = 'That isn’t your account.';
export const INVITATION_ONLY = 'Invitation only. Nobody applies for it; the issuer decides who is asked.';
export const NOT_ISSUED_HERE = 'Not issued where you live.';

/** The product id an account at a private bank carries. */
export function privateProductId(bankId: string): string {
  return `private:${bankId}`;
}

/** The private bank behind an account, when it is one. */
export function privateBankOf(account: Account): PrivateBank | undefined {
  return account.productId?.startsWith('private:') ? privateBankById(account.productId.slice('private:'.length)) : undefined;
}

/** Offshore is relative: the account is offshore when its bank is not where you live. */
export function isOffshore(sim: Simulation, bank: PrivateBank): boolean {
  return bank.countryId !== residenceCountryOf(sim, sim.player);
}

export function privateApplications(sim: Simulation, applicantId?: Id): PrivateApplication[] {
  return Object.values(sim.universe.privateApplications ?? {})
    .filter((a) => !applicantId || a.applicantId === applicantId)
    .sort((a, b) => b.appliedAt - a.appliedAt);
}

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
    if (product.countryIds && !product.countryIds.includes(residenceCountryOf(sim, sim.player))) return NOT_ISSUED_HERE;
    if (product.invitation && !sim.player.invitations?.[product.id]) return INVITATION_ONLY;
    if (product.real && sim.ledger.accountsOf(sim.player.id).some((a) => a.productId === product.id && !a.closedAt)) return `You hold ${productLabel(product)} already.`;
    const score = sim.universe.creditProfiles[sim.player.id]?.score ?? 600;
    // An invitation is the issuer having looked already; nobody is scored twice.
    if (!product.invitation && score < (product.minimumScore ?? 560)) {
      return `${productLabel(product)} wants a score of ${product.minimumScore}. Yours is ${score}.`;
    }
    if (product.initiationFee) {
      const payFrom = fromAccountId ?? sim.player.primaryAccountId;
      if (!payFrom || sim.ledger.availableFunds(payFrom) < product.initiationFee) return `${productLabel(product)} takes ${formatMoney(product.initiationFee)} to join, and you can’t cover it.`;
    }
    return undefined;
  }
  if (deposit < product.minimumOpening) {
    return `${productLabel(product)} takes ${formatMoney(product.minimumOpening)} to open.`;
  }
  if (product.minimumOpening > 0 && !fromAccountId) return 'Choose an account to fund it from.';
  if (fromAccountId && deposit > 0 && sim.ledger.availableFunds(fromAccountId) < deposit) {
    return `There isn’t ${formatMoney(deposit)} in ${sim.ledger.account(fromAccountId).name}.`;
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
/** Twelve months of spend on the cards of this product, from the statements. */
export function trailingSpend(sim: Simulation, productId: string): Money {
  const since = addMonths(sim.now, -12, sim.homeZone);
  let spend = 0;
  for (const account of sim.ledger.accountsOf(sim.player.id)) {
    if (account.productId !== productId) continue;
    for (const statement of statements(sim, account.id)) if (statement.closedAt >= since) spend += statement.debits;
  }
  return spend;
}

/**
 * Whether an invitation-only card would be offered today, and why. The rule
 * is SLATE's reading of what is widely reported, never the issuer's, which
 * nobody outside the issuer has.
 */
export function invitationStanding(sim: Simulation, product: BankProduct): { ready: boolean; detail: string } {
  const rule = product.invitation;
  if (!rule) return { ready: true, detail: 'Applied for, not offered.' };
  if (product.countryIds && !product.countryIds.includes(residenceCountryOf(sim, sim.player))) return { ready: false, detail: NOT_ISSUED_HERE };
  if (rule.viaBank) {
    const held = sim.ledger.accountsOf(sim.player.id).some((a) => a.productId === privateProductId(rule.viaBank!) && !a.closedAt);
    return { ready: held, detail: held ? `You bank at ${privateBankById(rule.viaBank)?.name ?? 'the private bank'}, which is the door.` : `Offered to clients of ${privateBankById(rule.viaBank)?.name ?? 'the private bank'}. Open an account there first.` };
  }
  const via = rule.viaCardId ? productById(rule.viaCardId) : undefined;
  const held = via ? sim.ledger.accountsOf(sim.player.id).find((a) => a.productId === via.id && !a.closedAt) : undefined;
  if (!via || !held) return { ready: false, detail: `As reported: hold ${via ? productLabel(via) : 'the issuer’s top card'} for ${rule.reportedMonths} months and spend ${formatMoney(rule.reportedSpend, { cents: false })} a year on it.` };
  const months = Math.floor((sim.now - held.openedAt) / (30.4 * MS_DAY));
  const spend = trailingSpend(sim, via.id);
  const ready = months >= rule.reportedMonths && spend >= rule.reportedSpend;
  return { ready, detail: ready ? 'You meet the reported rule. The invitation comes with a statement.' : `${months} of ${rule.reportedMonths} months on ${productLabel(via)}, ${formatMoney(spend, { cents: false })} of ${formatMoney(rule.reportedSpend, { cents: false })} spent in the last year.` };
}

/** The invitations that arrive with this month's statements. */
function considerInvitations(sim: Simulation): void {
  const me = sim.player;
  for (const card of REAL_CARDS) {
    if (!card.invitation || me.invitations?.[card.id]) continue;
    const product = productById(card.id);
    if (!product) continue;
    if (!invitationStanding(sim, product).ready) continue;
    me.invitations = { ...(me.invitations ?? {}), [card.id]: sim.now };
    sim.notify({ category: 'finance', title: `An Invitation From ${card.issuer}`, body: `${card.name}. ${card.invitation.note}`, importance: 70, route: '/workspace/bank' });
    sim.requireDecision({
      urgency: 50, category: 'bank', refType: 'card', refId: card.id,
      title: `${card.issuer} Has Invited You`, detail: `${card.name}: ${card.initiationFee ? `${formatMoney(card.initiationFee, { cents: false })} to join and ` : ''}${card.annualFee > 0 ? `${formatMoney(card.annualFee, { cents: false })} a year` : 'no published fee'}. Nobody has to say yes.`,
      route: '/workspace/bank', actions: [{ label: 'Accept The Card', commandKind: 'bank.open', payload: { productId: card.id } }],
    });
    sim.remember({ category: 'finance', title: `Invited To The ${card.name}`, detail: `${card.issuer} asked. ${card.invitation.note}`, refs: [{ type: 'person', id: me.id }], significance: 30, public: false });
    sim.emit('bank.invited', { productId: card.id });
  }
}

export function closeMonth(sim: Simulation): void {
  considerInvitations(sim);
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
    } else if (!product && privateBankOf(account)) {
      // A private bank pays its rate on cash and takes its relationship fee.
      const bank = privateBankOf(account)!;
      if (bank.apy > 0 && account.balance > 0) credit(sim, account, applyRate(account.balance, bank.apy / 12), `Interest — ${account.name}`);
      if (bank.annualFee > 0) charge(sim, account, Math.round(bank.annualFee / 12), `Relationship fee — ${bank.name}`);
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
        body: `${formatMoney(minimum)} was the least they’d take and ${formatMoney(paid)} arrived.${late > 0 ? ` ${formatMoney(late)} late fee.` : ''} It goes on your record.`,
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
      detail: `${formatMoney(balance)} on the statement. The least they’ll take is ${formatMoney(statement.minimumDue ?? 0)}, by ${formatDate(account.paymentDueAt ?? now, sim.homeZone)}. Pay it all and there’s no interest.`,
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
        body: `${formatMoney(order.amount)} wasn’t there in ${from.name}. ${order.missed >= STANDING_ORDER_STRIKES ? 'The bank has stopped trying.' : `Missed ${order.missed} of ${STANDING_ORDER_STRIKES}.`}`,
        importance: 50, route: '/workspace/bank', refType: 'account', refId: from.id,
      });
      if (order.missed >= STANDING_ORDER_STRIKES) stopOrder(sim, order, 'It couldn’t be paid three times.');
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
  sim.universe.privateApplications ??= {};

  // --- Private and offshore banking ---------------------------------------

  sim.onSchedule('bank.private_open', (item) => {
    const application = sim.universe.privateApplications?.[item.payload.applicationId as Id];
    if (!application || application.status !== 'pending') return;
    const bank = privateBankById(application.bankId);
    if (!bank) { application.status = 'declined'; application.reason = 'The bank no longer exists.'; return; }
    const me = sim.player;
    const from = sim.ledger.account(application.fromAccountId);
    const funds = from.closedAt ? 0 : sim.ledger.availableFunds(from.id);
    if (funds < application.deposit) {
      application.status = 'declined';
      application.reason = `The opening deposit of ${formatMoney(application.deposit, { cents: false })} wasn’t there when the bank came to take it.`;
      sim.notify({ category: 'finance', title: `${bank.name} Declined`, body: application.reason, importance: 60, route: '/workspace/bank' });
      sim.emit('bank.private_declined', { applicationId: application.id, bankId: bank.id });
      return;
    }
    const offshore = isOffshore(sim, bank);
    const account = sim.openAccount({
      id: sim.nextId('account'), kind: 'checking', name: `${bank.name} Account`, ownerId: me.id, institution: bank.name,
      openedAt: sim.now, productId: privateProductId(bank.id), overdraftOptIn: false,
      last4: String(1000 + (sim.counter('account_last4') * 7919) % 9000),
    });
    sim.transfer(from.id, account.id, application.deposit, `Opening ${account.name}`, 'transfer', { refType: 'account', refId: account.id });
    countWithdrawal(sim, from.id);
    application.status = 'opened';
    application.accountId = account.id;
    const reporting = offshore ? ` ${REPORTING_NOTE}${me.citizenshipId === 'us' && application.deposit > FBAR_THRESHOLD ? ` ${FBAR_NOTE}` : ''}` : '';
    sim.notify({ category: 'finance', title: `${bank.name} Has Opened Your Account`, body: `${formatMoney(application.deposit, { cents: false })} is in it, in ${bank.city}.${reporting}`, importance: 60, route: '/workspace/bank' });
    sim.remember({
      category: 'finance', title: offshore ? `Opened An Account Abroad` : `Opened A Private Account`,
      detail: `${bank.name}, ${bank.city}. ${formatMoney(application.deposit, { cents: false })} to open.${offshore ? ' Reported to the tax authority at home under the Common Reporting Standard.' : ''}`,
      refs: [{ type: 'person', id: me.id }], significance: 28, public: false, amount: application.deposit,
    });
    sim.emit('bank.private_opened', { applicationId: application.id, bankId: bank.id, accountId: account.id, offshore });
    considerInvitations(sim);
  });

  sim.onCommand<{ bankId: string; deposit: Money; fromAccountId: Id }, { applicationId: Id; readyAt: number; offshore: boolean; note: string }>(
    'bank.apply_private',
    (p, { sim: s }) => {
      const bank = privateBankById(p.bankId);
      if (!bank) throw new CommandError('No such bank.');
      const me = s.player;
      if (privateApplications(s, me.id).some((a) => a.bankId === bank.id && a.status === 'pending')) throw new CommandError(`${bank.name} is already looking at your application.`);
      if (s.ledger.accountsOf(me.id).some((a) => a.productId === privateProductId(bank.id) && !a.closedAt)) throw new CommandError(`You bank at ${bank.name} already.`);
      if (!Number.isFinite(p.deposit) || p.deposit < bank.minimumRelationship) throw new CommandError(`${bank.name} wants ${formatMoney(bank.minimumRelationship, { cents: false })} to open a relationship (${bank.minimumIs}).`);
      const from = s.ledger.account(p.fromAccountId);
      if (from.ownerId !== me.id) throw new CommandError(NOT_YOURS);
      if (s.ledger.availableFunds(from.id) < p.deposit) throw new CommandError(`There isn’t ${formatMoney(p.deposit, { cents: false })} in ${from.name}.`);
      // Know your customer: a valid passport, and the address the game
      // already has for where you live. Nothing else is asked and nothing
      // is invented about the source of the money.
      const papers = passportCheck(s, me);
      if (!papers.ok) throw new CommandError(`${bank.name} wants a valid passport before anything else. ${papers.reason ?? ''}`.trim());
      const offshore = isOffshore(s, bank);
      const readyAt = addDays(s.now, bank.kycWeeks * 7, s.homeZone);
      const application: PrivateApplication = {
        id: s.nextId('application'), saveId: s.universe.meta.id, bankId: bank.id, applicantId: me.id,
        deposit: p.deposit, fromAccountId: from.id, appliedAt: s.now, readyAt, status: 'pending',
      };
      s.universe.privateApplications![application.id] = application;
      s.schedule({ at: readyAt, kind: 'bank.private_open', label: `${bank.name} Decides`, category: 'finance', payload: { applicationId: application.id }, priority: 45, refType: 'application', refId: application.id });
      const note = `${bank.name} in ${bank.city} takes ${bank.kycWeeks} weeks over its checks. The deposit moves when the account opens, not before.${offshore ? ` ${REPORTING_NOTE}` : ''}`;
      s.remember({ category: 'finance', title: `Applied To ${bank.name}`, detail: `${formatMoney(p.deposit, { cents: false })} to open, in ${COUNTRIES.get(bank.countryId)?.name ?? bank.countryId}.`, refs: [{ type: 'person', id: me.id }], significance: 12, public: false });
      s.emit('bank.private_applied', { applicationId: application.id, bankId: bank.id, offshore });
      return { applicationId: application.id, readyAt, offshore, note };
    },
  );

  sim.onCommand<{ productId: string; deposit?: Money; fromAccountId?: Id; name?: string }, { accountId: Id; limit?: Money; maturesAt?: number }>(
    'bank.open',
    (p, { sim: s }) => {
      // An account in your own name needs you to be able to sign for it.
      requireAge(s, 'majority');
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
        if (product.initiationFee) {
          const payFrom = p.fromAccountId ?? s.player.primaryAccountId!;
          s.expense(payFrom, product.initiationFee, `Initiation fee — ${productLabel(product)}`, 'fees', { refType: 'account', refId: account.id });
        }
        if (product.invitation) s.resolveDecision('card', product.id, 'bank');
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
      if (account.nominal) throw new CommandError('That isn’t an account you hold.');
      if (isLiability(account.kind) && account.balance < 0) {
        throw new CommandError(`Clear the ${formatMoney(-account.balance)} on ${account.name} before closing it.`);
      }
      if (s.player.primaryAccountId === account.id && myAccounts(s).filter((a) => a.kind === 'checking' || a.kind === 'cash').length <= 1) {
        throw new CommandError('That’s the only account your money comes into. Open another first.');
      }
      const pointed = Object.values(s.universe.bills).filter((b) => b.active && b.autopayAccountId === account.id);
      if (pointed.length > 0) throw new CommandError(`${pointed.length} bill${pointed.length === 1 ? ' is' : 's are'} paid from ${account.name}. Point ${pointed.length === 1 ? 'it' : 'them'} somewhere else first.`);
      const orders = standingOrders(s, s.player.id).filter((o) => o.active && (o.fromAccountId === account.id || o.toAccountId === account.id));
      if (orders.length > 0) throw new CommandError(`${orders.length} standing order${orders.length === 1 ? '' : 's'} use${orders.length === 1 ? 's' : ''} ${account.name}. Cancel ${orders.length === 1 ? 'it' : 'them'} first.`);

      let penalty = 0;
      let moved = 0;
      if (account.balance > 0) {
        const to = p.toAccountId ?? myAccounts(s).find((a) => a.id !== account.id && (a.kind === 'checking' || a.kind === 'savings' || a.kind === 'cash'))?.id;
        if (!to) throw new CommandError('There’s nowhere to move the money to.');
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
      // Borrowing is a contract like any other.
      requireAge(s, 'borrow');
      const account = s.ledger.account(p.accountId);
      if (account.ownerId !== s.player.id) throw new CommandError(NOT_YOURS);
      const product = productOf(account);
      if (!product?.overdraftLimit) throw new CommandError(`${account.name} doesn’t come with cover.`);
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
      if (card.kind !== 'credit_card' && card.kind !== 'company_credit') throw new CommandError('That isn’t a card.');
      const owed = Math.max(0, -card.balance);
      if (owed <= 0) throw new CommandError(`There’s nothing owing on ${card.name}.`);
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
      if (!order || !order.active) throw new CommandError('There’s no standing order like that.');
      stopOrder(s, order, 'You canceled it.');
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

export { BANK_PRODUCTS, INSTITUTIONS, PRIVATE_BANKS, productById, productLabel, productsOf, type BankProduct, type ProductFamily };
