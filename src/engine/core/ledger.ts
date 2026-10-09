/**
 * SLATE — Double-entry ledger.
 *
 * LAW: a balance is never a number someone typed. It is the sum of postings.
 * Every transaction balances to exactly zero across its postings, with income
 * and expense modeled as nominal counter-accounts, so the universe can prove
 * at any moment that no money was invented or destroyed.
 */

import type { Instant } from './time';
import type { Money } from './money';

export type AccountKind =
  | 'checking' | 'savings' | 'cash' | 'credit_card' | 'loan' | 'mortgage'
  | 'auto_loan' | 'brokerage' | 'company_cash' | 'company_credit'
  | 'escrow' | 'production_account'
  // Nominal counter-accounts. These never hold player money; they exist so
  // every posting has a balancing partner and every dollar has a provenance.
  | 'income' | 'expense' | 'equity' | 'asset_value' | 'liability_other';

export const NOMINAL_KINDS: readonly AccountKind[] = ['income', 'expense', 'equity', 'asset_value', 'liability_other'];

/** Liability accounts carry a negative balance when money is owed. */
export const LIABILITY_KINDS: readonly AccountKind[] = ['credit_card', 'loan', 'mortgage', 'auto_loan', 'company_credit'];

export function isLiability(kind: AccountKind): boolean {
  return LIABILITY_KINDS.includes(kind);
}

/** A card in the hand: its number's last four, its expiry, whether it's locked or stopped and why, a replacement on its way, and whether the bills on it still have its number. */
export interface Plastic {
  last4: string;
  expiresAt: Instant;
  issued?: number;
  locked?: boolean;
  stopped?: 'lost' | 'stolen' | 'damaged' | 'fraud';
  replacementAt?: Instant;
}

export interface Account {
  id: string;
  saveId: string;
  kind: AccountKind;
  name: string;
  /** Person id, company id, or 'world' for nominal accounts. */
  ownerId: string;
  institution?: string;
  /** Derived from postings; never assigned directly outside `post`. */
  balance: Money;
  /** Credit limit for revolving accounts (positive cents). */
  creditLimit?: Money;
  /** Annual percentage rate as a decimal, e.g. 0.2249. */
  apr?: number;
  openedAt: Instant;
  closedAt?: Instant;
  /** Nominal accounts are hidden from the player's account list. */
  nominal: boolean;
  /** Grouping for statements: 'housing', 'transport', 'career', ... */
  category?: string;
  last4?: string;
  /** The card on it: the debit card on a current account, the credit card on a card's own (`systems/security.ts`). */
  plastic?: Plastic;
  /** The real bank it is held at (`content/banks.ts`), for a bank account. */
  bankId?: string;
  /** The account's number as its country writes it (`systems/banknumber.ts`). */
  number?: string;
  /** Interest built up since it was last paid, in fractional hundredths. */
  accrued?: number;
  /** The lowest it has stood at this month, for a fee's waiver. */
  lowest?: Money;
  /** The month's daily balances added up, and the days counted, for an average balance. */
  monthSum?: number;
  monthDays?: number;
  /** A bonus rate's interest this month, kept only if the month earns it. */
  bonusAccrued?: number;
  /** What it held when the month began, for a bonus paid on growth. */
  monthOpen?: Money;
  /** An arranged overdraft: its limit, its rate, when it was arranged, and interest built on it (`systems/lending.ts`). */
  overdraftLimit?: Money;
  overdraftRate?: number;
  /** An arranged overdraft paid for by the use rather than the month, where the bank sells it so. */
  overdraftPerUse?: boolean;
  overdraftSince?: Instant;
  odAccrued?: number;
  /** Overdraft items charged today, where a bank charges by the item and caps the day. */
  itemsDay?: string;
  itemsCount?: number;
  /** A term deposit's fixed rate and the day it ends. */
  fixedRate?: number;
  maturesAt?: Instant;
  /** Items charged this month, where a bank caps them by the month. */
  itemsMonth?: string;
  itemsMonthCount?: number;
  /** The most the account was overdrawn this month, for Spain's commission. */
  odPeak?: Money;
  /** The month's overdrawn balances, summed day by day, for Spain's legal cap on what an overdraft may cost. */
  odDaySum?: Money;
  /** Midnights this month the account sat past its limit by more than the bank's margin, for New Zealand's unarranged overdraft fee. */
  odBeyondDays?: number;
  /** Items that overdrew it on a day, whose fees wait for the end of the next business day (Chase, Wells Fargo). */
  pendingItems?: { day: string; count: number }[];
  /** Since when it has been below zero past any arranged limit, for the bank closing it. */
  negativeSince?: number;
  /** The last day a payment took it below zero, for a bank that charges one fee for a day that ends overdrawn. */
  overdrewDay?: string;
  /** Opted into the bank paying everyday debit card purchases into an overdraft (a US bank's Regulation E choice). */
  debitOverdraft?: boolean;
  /** When a returned payment's fee, the debit card's yearly fee and a dormant account's fee were last charged. */
  returnedAt?: Instant;
  cardFeeAt?: Instant;
  dormantFeeAt?: Instant;
  /** Germany: the quarter's fees so far, charged at the quarterly closing. */
  feesDue?: Money;
  /** Untouched past the bank's months: inactive, then dormant and blocked until used again. */
  inactive?: boolean;
  dormant?: boolean;
  /** When its holder last had a dormant account reactivated, which counts as using it. */
  reactivatedAt?: Instant;
  /** When the bank wrote that the balance goes to the state unless the holder gets in touch (`ESCHEAT_NOTICE_DAYS`). */
  escheatWarned?: Instant;
  /** A term deposit renewed: until when it can be taken without penalty, and whether the bank has written about its end. */
  graceUntil?: Instant;
  maturityNoticed?: boolean;
  /** A term deposit whose early close has been asked for, on the notice the bank needs, closing on this day. */
  breakAt?: number;
  /** France: the month's letter about an overrun sent, the credit offered at three months, and the closing's notice given. */
  overrunInformed?: boolean;
  creditOffered?: { amount: number; apr: number; months: number };
  closingNoticed?: boolean;
  /** A second-chance account, opened for somebody the mainstream banks turned away: a monthly fee and no overdraft. */
  secondChance?: boolean;
  /** When a term deposit last renewed: its current term runs from here. */
  renewedAt?: Instant;
  /** What its holder has told the bank to do with a term deposit at its end, where it differs from the bank's default. */
  atEnd?: 'renews' | 'savings' | 'paid_out';
  /** A loan's monthly payment and its term. */
  loanPayment?: Money;
  loanMonths?: number;
}

export interface Posting {
  accountId: string;
  amount: Money;
}

export interface LedgerTransaction {
  id: string;
  saveId: string;
  at: Instant;
  memo: string;
  /** Statement category: 'salary', 'rent', 'groceries', 'production', ... */
  category: string;
  postings: Posting[];
  /** Set when a transaction has been reversed; points at the reversing txn. */
  reversedBy?: string;
  reverses?: string;
  /** A card payment authorized and held against the available balance, posting then (`systems/pending.ts`). */
  postsAt?: Instant;
}

export interface LedgerHost {
  accounts: Record<string, Account>;
  transactions: LedgerTransaction[];
}

export class LedgerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LedgerError';
  }
}

export class Ledger {
  constructor(private host: LedgerHost) {}

  account(id: string): Account {
    const acct = this.host.accounts[id];
    if (!acct) throw new LedgerError(`No such account: ${id}`);
    return acct;
  }

  tryAccount(id: string): Account | undefined {
    return this.host.accounts[id];
  }

  accountsOf(ownerId: string): Account[] {
    return Object.values(this.host.accounts)
      .filter((a) => a.ownerId === ownerId && !a.nominal && !a.closedAt)
      .sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name));
  }

  open(account: Account): Account {
    if (this.host.accounts[account.id]) throw new LedgerError(`Account already exists: ${account.id}`);
    this.host.accounts[account.id] = account;
    return account;
  }

  /**
   * Records a balanced transaction. Throws if postings do not sum to zero,
   * which is the guard that makes money conservation a structural property
   * rather than something we hope holds.
   */
  post(txn: LedgerTransaction): LedgerTransaction {
    if (txn.postings.length < 2) {
      throw new LedgerError(`Transaction ${txn.id} ('${txn.memo}') needs at least two postings.`);
    }
    let sum = 0;
    for (const p of txn.postings) {
      if (!Number.isInteger(p.amount)) {
        throw new LedgerError(`Non-integer posting amount ${p.amount} in ${txn.id} ('${txn.memo}'). Money is always cents.`);
      }
      sum += p.amount;
    }
    if (sum !== 0) {
      throw new LedgerError(
        `Transaction ${txn.id} ('${txn.memo}') doesn’t balance: postings sum to ${sum} cents, expected 0.`,
      );
    }
    for (const p of txn.postings) {
      const acct = this.account(p.accountId);
      acct.balance += p.amount;
    }
    this.host.transactions.push(txn);
    return txn;
  }

  /** Available spend: cash balance, or remaining credit on a revolving line. */
  availableFunds(accountId: string): Money {
    const a = this.account(accountId);
    if (a.kind === 'credit_card' || a.kind === 'company_credit') {
      return Math.max(0, (a.creditLimit ?? 0) + a.balance);
    }
    return a.balance;
  }

  /** Transactions touching an account, newest first. */
  history(accountId: string, limit = 100): LedgerTransaction[] {
    const out: LedgerTransaction[] = [];
    for (let i = this.host.transactions.length - 1; i >= 0 && out.length < limit; i--) {
      const t = this.host.transactions[i] as LedgerTransaction;
      if (t.postings.some((p) => p.accountId === accountId)) out.push(t);
    }
    return out;
  }

  /** Net effect of a transaction on one account. */
  static effectOn(txn: LedgerTransaction, accountId: string): Money {
    return txn.postings.reduce((s, p) => (p.accountId === accountId ? s + p.amount : s), 0);
  }

  /** Recomputes every balance from postings. Used by reconciliation tests. */
  recompute(): Record<string, Money> {
    const totals: Record<string, Money> = {};
    for (const id of Object.keys(this.host.accounts)) totals[id] = 0;
    for (const txn of this.host.transactions) {
      for (const p of txn.postings) {
        totals[p.accountId] = (totals[p.accountId] ?? 0) + p.amount;
      }
    }
    return totals;
  }

  /**
   * Proves the ledger is internally consistent. Returns a list of problems;
   * an empty list means the books balance.
   */
  audit(): string[] {
    const problems: string[] = [];
    const recomputed = this.recompute();
    for (const [id, acct] of Object.entries(this.host.accounts)) {
      const expected = recomputed[id] ?? 0;
      if (expected !== acct.balance) {
        problems.push(`Account ${id} (${acct.name}) cached balance ${acct.balance} != posted total ${expected}.`);
      }
    }
    let grand = 0;
    for (const txn of this.host.transactions) {
      const sum = txn.postings.reduce((s, p) => s + p.amount, 0);
      if (sum !== 0) problems.push(`Transaction ${txn.id} ('${txn.memo}') sums to ${sum}, expected 0.`);
      grand += sum;
    }
    if (grand !== 0) problems.push(`Universe-wide posting total is ${grand}, expected 0. Money was created or destroyed.`);
    return problems;
  }

  /** Sum of real (non-nominal) balances for an owner. Liabilities count negative. */
  netWorthCash(ownerId: string): Money {
    return this.accountsOf(ownerId).reduce((s, a) => s + a.balance, 0);
  }

  /** Total spend in a category over a window. */
  spendByCategory(ownerId: string, from: Instant, to: Instant): Record<string, Money> {
    const owned = new Set(this.accountsOf(ownerId).map((a) => a.id));
    const out: Record<string, Money> = {};
    for (const txn of this.host.transactions) {
      if (txn.at < from || txn.at > to) continue;
      const delta = txn.postings.reduce((s, p) => (owned.has(p.accountId) ? s + p.amount : s), 0);
      if (delta < 0) out[txn.category] = (out[txn.category] ?? 0) + -delta;
    }
    return out;
  }
}
