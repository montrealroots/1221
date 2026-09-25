/**
 * SLATE — What the money adds up to.
 *
 * The bills, the credit, the tax years and the standing orders went with the
 * systems that raised them; rent, bills, food, wages and the card came back
 * in their own systems (`work.ts`, `household.ts`, `credit.ts`). What is
 * here is the one read model Home and the save-slot summary ask for: what a
 * person is worth right now, derived from the ledger, never stored.
 */

import type { Simulation } from '../core/simulation';
import { isLiability } from '../core/ledger';
import type { Money } from '../core/money';
import type { Id } from '../domain/model';

export interface Worth {
  /** In the bank: every account of theirs but a deposit a landlord holds. */
  cash: Money;
  /** Theirs, held by somebody else: a rent deposit (`systems/household.ts`). */
  held: Money;
  /** In a pension fund their pay goes into, theirs but locked until they retire (`systems/work.ts`). */
  pension: Money;
  liabilities: Money;
  total: Money;
}

/**
 * What somebody is worth, recomputed from the ledger every time it is asked
 * for. Balances are derived from postings, so this cannot drift from the
 * transactions that produced it.
 */
export function netWorth(sim: Simulation, ownerId: Id): Worth {
  let cash = 0;
  let held = 0;
  let pension = 0;
  let liabilities = 0;
  // A deposit counted as money in the bank, and Home said 343,750 kr was in
  // the bank when 112,750 of it was with the landlord.
  for (const account of sim.ledger.accountsOf(ownerId)) {
    if (isLiability(account.kind)) liabilities += Math.max(0, -account.balance);
    else if (account.kind === 'escrow') held += account.balance;
    else if (account.category === 'pension') pension += account.balance;
    else cash += account.balance;
  }

  return { cash, held, pension, liabilities, total: cash + held + pension - liabilities };
}
