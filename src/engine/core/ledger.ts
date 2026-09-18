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

/**
 * The four kinds of account this game opens, and it used to declare twelve.
 *
 * Found by measuring rather than by reading: a probe over the ledger of a played
 * career and a played business listed every account in both saves, and there were
 * four kinds in them. `grep "kind: '<each>'"` across the engine then said why —
 * eight of the twelve had no writer anywhere, so no save this build can produce
 * has ever held one.
 *
 * What they were is worth recording, because most of them are the wreckage of
 * worlds this project has already deleted rather than plans for one. `mortgage`
 * and `auto_loan` outlived the property ladder and the vehicles — the last of the
 * property market came off `Property` at schema 80 — and `brokerage`, `cash` and
 * `loan` came with the American retail bank that `62c30ca` cut. `escrow` and
 * `production_account` are the two that were a plan: money held against a
 * delivery, and a picture banking its own float. Neither was ever built, and
 * `world/making.ts` settles a period straight out of the company's cash.
 *
 * `company_credit` is the one worth arguing about and it goes for the same reason
 * as the rest: a production company's overdraft is a real thing, and in this build
 * the family's patience already does that job — `familyCovers` tops the account up
 * from below zero every day, so a credit line would be a second answer to a
 * question already answered. Measured: the company never ends a day under water on
 * any seed, so an overdraft rate would never once have been charged.
 *
 * Any of them is three lines to put back on the day something opens one, and the
 * `Account` fields they would need are still here — `creditLimit` and `apr` are
 * read by the card.
 */
export type AccountKind =
  | 'checking' | 'savings' | 'credit_card' | 'company_cash'
  // Nominal counter-accounts. These never hold player money; they exist so
  // every posting has a balancing partner and every dollar has a provenance.
  | 'income' | 'expense' | 'equity' | 'asset_value' | 'liability_other';

export const NOMINAL_KINDS: readonly AccountKind[] = ['income', 'expense', 'equity', 'asset_value', 'liability_other'];

export function isNominal(kind: AccountKind): boolean {
  return NOMINAL_KINDS.includes(kind);
}

/**
 * Liability accounts carry a negative balance when money is owed.
 *
 * One kind, where there were five. The other four — `loan`, `mortgage`,
 * `auto_loan` and `company_credit` — were never opened by anything, so
 * `isLiability` has only ever answered about a card, and the list read as though
 * this game had a debt model.
 */
export const LIABILITY_KINDS: readonly AccountKind[] = ['credit_card'];

export function isLiability(kind: AccountKind): boolean {
  return LIABILITY_KINDS.includes(kind);
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
  /** What caused this, for the "why is my balance this?" audit. */
  refType?: string;
  refId?: string;
  idempotencyKey?: string;
  /** Set when a transaction has been reversed; points at the reversing txn. */
  reversedBy?: string;
  reverses?: string;
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

  /**
   * Available spend: cash balance, or remaining credit on a revolving line.
   *
   * One implementation, and it took a while to get to one. `docs/ARREARS.md` had
   * this down as a correct function nobody called, which was half the story — the
   * money screen was computing `Math.max(0, limit + balance)` inline in two
   * places while this sat here, so the idea had three implementations and the
   * named one had no reader. The screen asks this now.
   *
   * What it is NOT is the affordability question the game turns on. Nothing a
   * player can do spends out of a bank account: every door that costs money
   * costs the company's money, and the company's answer is `behindTheCompany()`
   * in `world/lot.ts` — cash plus what the family will still put in, which is a
   * different and larger question than what a bank would lend. Three fields that
   * belonged to the bank's version of it (`overdraftLimit`, `overdraftOptIn`,
   * `inCoverSince`) were cut for having no writer at all.
   */
  availableFunds(accountId: string): Money {
    const a = this.account(accountId);
    if (isLiability(a.kind)) {
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
