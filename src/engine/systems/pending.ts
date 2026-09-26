/**
 * SLATE — a card payment authorized, held and then posted (module 9 of
 * `docs/BANKING-FUNCTIONS.md`), from each bank's own terms
 * (`content/pending.ts`).
 *
 * Until 2026-09-26 a card purchase was on the account the moment it was
 * made and there was one balance. Now a debit or credit card payment is
 * authorized at once and held against the available balance, which is what
 * pays and declines things (A95, A96, A140, C36), and posts the bank's
 * business days later, SLATE's estimate of two where the bank doesn't say.
 * The posted balance, completed items only, is shown beside the available
 * one, and a statement marks what's still pending. Where a European bank
 * dates an entry's value apart from its booking, the statement shows both
 * (A98).
 */

import type { Simulation } from '../core/simulation';
import type { Account, LedgerTransaction } from '../core/ledger';
import type { Money } from '../core/money';
import { MS_DAY, type Instant } from '../core/time';
import { PENDING } from '../content/pending';

/** Business days a card payment stays pending where the bank doesn't say: SLATE's estimate. */
export const ESTIMATE_PENDING_DAYS = 2;

/** Business days as calendar days, a week's five in seven. */
const calendarDays = (business: number) => Math.ceil(business * 7 / 5);

/** The business days a card payment on an account stays pending: the bank's for its debit or credit card, or SLATE's estimate. */
export function pendingDaysOf(account: Account): { days: number; estimate: boolean } {
  const rules = account.bankId ? PENDING[account.bankId] : undefined;
  const days = account.kind === 'credit_card' ? rules?.creditPendingDays ?? rules?.pendingDays : rules?.pendingDays;
  return days === undefined ? { days: ESTIMATE_PENDING_DAYS, estimate: true } : { days, estimate: false };
}

/** A card payment just made: held against the available balance until it posts. */
export function hold(sim: Simulation, txn: LedgerTransaction | undefined, account: Account): void {
  if (!txn) return;
  txn.postsAt = sim.now + calendarDays(pendingDaysOf(account).days) * MS_DAY;
}

/** Whether an entry is still pending. */
export function isPending(sim: Simulation, txn: LedgerTransaction): boolean {
  return txn.postsAt !== undefined && txn.postsAt > sim.now;
}

/** What's pending on an account, in the ledger's sense (a debit negative). */
export function pendingOn(sim: Simulation, account: Account, at: Instant = sim.now): Money {
  let sum = 0;
  const list = sim.universe.transactions;
  // Nothing stays pending a month; stop looking back past that.
  for (let i = list.length - 1; i >= 0 && list[i]!.at > at - 31 * MS_DAY; i -= 1) {
    const txn = list[i]!;
    if (txn.postsAt === undefined || txn.postsAt <= at || txn.at > at) continue;
    for (const p of txn.postings) if (p.accountId === account.id) sum += p.amount;
  }
  return sum;
}

/** The posted balance: completed items only, what the bank calls the ledger or account balance (A96). */
export function postedBalance(sim: Simulation, account: Account): Money {
  return account.balance - pendingOn(sim, account);
}
