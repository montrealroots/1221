/**
 * SLATE — cash in hand (module 3 of `docs/BANKING-FUNCTIONS.md`).
 *
 * Until 2026-09-26 money lived only in the bank and on the card. Now a person
 * can hold cash, in a wallet the ledger keeps like any account:
 *
 * - **Taking it out** (A52, A54, A55, A114, A138): at the bank's own ATM, at
 *   another bank's, at the counter, or in Britain at the Post Office where
 *   the bank lets its customers (A33), each for the bank's own fee
 *   (`content/cash.ts`), and the ATMs no more in a day than the bank allows.
 *   Where another machine's owner may add a fee of its own, SLATE doesn't
 *   know what it is, and says so.
 * - **On the credit card** (C29, C49, C56, C82): a cash advance, for the
 *   card's fee, at its cash rate from the day it's taken, with no grace
 *   period, within any cash limit it has.
 * - **Paying it in** (A28, A29, A33, A48, B10): at the counter or an ATM,
 *   into the current account or savings, counted and credited as counted.
 * - **Spending it**: the day's groceries paid in cash first, where that's how
 *   they pay (`systems/payments.ts`).
 * - **Germany's savings** (B21): a savings account lets out €2,000 a calendar
 *   month without notice, where the bank confirms it; more needs three
 *   months' notice, which SLATE refuses.
 * - **A payment to the card** (C21) goes to the dearer balance first: a US
 *   card's minimum to the cheaper one and the rest to the dearest (Reg Z
 *   §1026.53), everywhere else all of it to the dearest.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Account } from '../core/ledger';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { instantFromZoned, zonedParts } from '../core/time';
import { exchange } from '../content/currency';
import { bankById } from '../content/banks';
import { CASH } from '../content/cash';
import { cardOf, cardRoom, cardTerms } from './credit';

export type CashFrom = 'atm' | 'other_atm' | 'counter' | 'post_office' | 'card';
export type CashTo = 'counter' | 'atm' | 'post_office';

/** Their cash in hand: a wallet the ledger keeps, opened the first time it's needed. */
export function walletOf(sim: Simulation, person: Person, open = false): Account | undefined {
  const found = Object.values(sim.universe.accounts).find((a) => a.ownerId === person.id && a.kind === 'cash' && !a.closedAt);
  if (found || !open) return found;
  return sim.openAccount({ id: sim.nextId('account'), kind: 'cash', name: 'Cash In Hand', ownerId: person.id, openedAt: sim.now });
}

function inSave(sim: Simulation, amount: Money, currency: string): Money {
  const into = saveCurrency(sim.universe);
  return into === currency ? amount : exchange(amount, currency, into) ?? amount;
}

function currentOf(sim: Simulation, person: Person): Account | undefined {
  return person.primaryAccountId ? sim.universe.accounts[person.primaryAccountId] : undefined;
}

function dayStart(sim: Simulation): number {
  const p = zonedParts(sim.now, sim.zone);
  return instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: 0 }, sim.zone);
}

/** What's come out of ATMs today, the Post Office's included. */
function atmToday(sim: Simulation, person: Person): Money {
  const since = dayStart(sim);
  const wallet = walletOf(sim, person);
  if (!wallet) return 0;
  return sim.universe.transactions
    .filter((t) => t.at >= since && t.category === 'cash' && /ATM|Post Office/.test(t.memo))
    .reduce((sum, t) => sum + t.postings.filter((p) => p.accountId === wallet.id && p.amount > 0).reduce((a, p) => a + p.amount, 0), 0);
}

/** What a withdrawal of an amount would cost, and whether it may be made, before it's made. */
export function withdrawalQuote(sim: Simulation, person: Person, amount: Money, from: CashFrom): { fee: Money; refused?: string; ownerFee?: boolean } {
  const cur = saveCurrency(sim.universe);
  if (from === 'card') {
    const card = cardOf(sim, person);
    if (!card || !person.credit) return { fee: 0, refused: 'You don’t have a card.' };
    const terms = cardTerms(sim, card, person.credit.score);
    const fee = Math.max(terms.cashFeeMin, Math.round(amount * terms.cashFeeShare));
    const room = cardRoom(person, card);
    if (room < amount + fee) return { fee, refused: `The card has ${formatMoney(room, cur)} free, and this takes ${formatMoney(amount + fee, cur)} with its fee.` };
    const cashOwed = person.credit.cashOwed ?? 0;
    if (terms.cashLimit !== undefined && cashOwed + amount > terms.cashLimit) return { fee, refused: `The card lets ${formatMoney(terms.cashLimit, cur)} out as cash, and ${formatMoney(cashOwed, cur)} is out already.` };
    return { fee };
  }
  const current = currentOf(sim, person);
  const bank = current?.bankId ? bankById(current.bankId) : undefined;
  const rules = bank ? CASH[bank.id] : undefined;
  if (!current || !bank) return { fee: 0, refused: 'You need a bank account to take cash out of.' };
  if (current.dormant) return { fee: 0, refused: `${current.name} is dormant; use Reactivate first.` };
  if (from === 'post_office' && !rules?.postOffice) return { fee: 0, refused: `${bank.name}’s customers can’t use the Post Office for cash.` };
  const fee = inSave(sim, from === 'atm' ? rules?.own ?? 0 : from === 'other_atm' ? rules?.other ?? 0 : from === 'counter' ? rules?.teller ?? 0 : 0, bank.currency);
  if (from !== 'counter' && rules?.daily !== undefined) {
    const daily = inSave(sim, rules.daily, bank.currency);
    const used = atmToday(sim, person);
    if (used + amount > daily) return { fee, refused: `${bank.name} lets ${formatMoney(daily, cur)} out of machines in a day, and ${formatMoney(used, cur)} has come out today.` };
  }
  if (current.balance < amount + fee) return { fee, refused: `${current.name} holds ${formatMoney(Math.max(0, current.balance), cur)}.` };
  return { fee, ...(from === 'other_atm' && rules?.surcharge ? { ownerFee: true } : {}) };
}

/** The part of what's owed on the card that's cash, cut down to what's owed at all. */
export function cashOwedOn(person: Person, card: Account): Money {
  return Math.max(0, Math.min(person.credit?.cashOwed ?? 0, -card.balance));
}

/**
 * A payment to the card, split between its balances (C21): a US card's
 * minimum to the purchase balance first and the rest to the cash balance,
 * the dearer; everywhere else all of it to the cash balance first.
 */
export function allocatePayment(person: Person, card: Account, paid: Money, minimum: Money): void {
  const credit = person.credit;
  if (!credit || !credit.cashOwed) return;
  const us = bankById(card.bankId ?? '')?.iso === 'US';
  const owedBefore = -card.balance + paid;
  const purchases = Math.max(0, owedBefore - credit.cashOwed);
  // The US minimum goes to the cheaper purchase balance first.
  const toPurchasesFirst = us ? Math.min(paid, minimum, purchases) : 0;
  const toCash = Math.min(credit.cashOwed, paid - toPurchasesFirst);
  credit.cashOwed = Math.max(0, credit.cashOwed - toCash);
}

export function registerCash(sim: Simulation): void {
  sim.onCommand<{ amount: Money; from: CashFrom }, { fee: Money; ownerFee?: boolean }>('cash.withdraw', (p, { sim: s }) => {
    const person = s.player;
    const amount = Math.round(Number(p.amount));
    if (!(amount > 0)) throw new CommandError('Say how much.');
    const from = p.from;
    if (!['atm', 'other_atm', 'counter', 'post_office', 'card'].includes(from)) throw new CommandError('From your bank’s ATM, another bank’s, the counter, the Post Office or the card.');
    const quote = withdrawalQuote(s, person, amount, from);
    if (quote.refused) throw new CommandError(quote.refused);
    const wallet = walletOf(s, person, true)!;
    if (from === 'card') {
      const card = cardOf(s, person)!;
      s.post({ memo: 'Cash advance', category: 'cash', postings: [{ accountId: card.id, amount: -amount }, { accountId: wallet.id, amount }] });
      if (quote.fee > 0) s.post({ memo: 'Cash advance fee', category: 'fees', postings: [{ accountId: card.id, amount: -quote.fee }, { accountId: s.nominalAccount('expense', 'Card Fees').id, amount: quote.fee }] });
      person.credit!.cashOwed = (person.credit!.cashOwed ?? 0) + amount;
      return { fee: quote.fee };
    }
    const current = currentOf(s, person)!;
    const where = from === 'atm' ? 'ATM' : from === 'other_atm' ? 'Another bank’s ATM' : from === 'counter' ? 'Counter' : 'Post Office';
    s.post({ memo: `Cash out: ${where}`, category: 'cash', postings: [{ accountId: current.id, amount: -amount }, { accountId: wallet.id, amount }] });
    if (quote.fee > 0) s.post({ memo: `Cash withdrawal fee: ${where}`, category: 'bank_fee', postings: [{ accountId: current.id, amount: -quote.fee }, { accountId: s.nominalAccount('expense', 'Bank Fees').id, amount: quote.fee }] });
    return { fee: quote.fee, ...(quote.ownerFee ? { ownerFee: true } : {}) };
  });

  sim.onCommand<{ amount: Money; toId: string; at: CashTo }, { paid: Money }>('cash.deposit', (p, { sim: s }) => {
    const person = s.player;
    const amount = Math.round(Number(p.amount));
    const wallet = walletOf(s, person);
    if (!wallet || !(amount > 0) || wallet.balance < amount) throw new CommandError(`You have ${formatMoney(Math.max(0, wallet?.balance ?? 0), saveCurrency(s.universe))} in cash.`);
    const to = s.universe.accounts[p.toId];
    if (!to || to.ownerId !== person.id || to.closedAt || (to.kind !== 'checking' && to.kind !== 'savings') || to.category === 'term') throw new CommandError('Cash goes into your current account or savings.');
    const bank = to.bankId ? bankById(to.bankId) : undefined;
    if (p.at === 'post_office' && (!bank || CASH[bank.id]?.postOffice !== 'both')) throw new CommandError(`${bank?.name ?? 'Your bank'}’s customers can’t pay cash in at the Post Office.`);
    const where = p.at === 'atm' ? 'ATM' : p.at === 'post_office' ? 'Post Office' : 'Counter';
    s.post({ memo: `Cash in: ${where}`, category: 'cash', postings: [{ accountId: wallet.id, amount: -amount }, { accountId: to.id, amount }] });
    return { paid: amount };
  });
}

/** Germany's €2,000 a month from savings without notice, where the bank confirms it: what's left this month, or undefined where there's no such limit. */
export function savingsLeftThisMonth(sim: Simulation, account: Account): Money | undefined {
  if (account.kind !== 'savings' || !account.bankId) return undefined;
  const monthly = CASH[account.bankId]?.savingsMonthly;
  if (monthly === undefined) return undefined;
  const bank = bankById(account.bankId)!;
  const p = zonedParts(sim.now, sim.zone);
  const since = instantFromZoned({ year: p.year, month: p.month, day: 1, hour: 0 }, sim.zone);
  const out = sim.universe.transactions
    .filter((t) => t.at >= since && t.category !== 'interest')
    .reduce((sum, t) => sum + t.postings.filter((q) => q.accountId === account.id && q.amount < 0).reduce((a, q) => a - q.amount, 0), 0);
  return Math.max(0, inSave(sim, monthly, bank.currency) - out);
}
