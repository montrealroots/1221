/**
 * SLATE — What the money adds up to.
 *
 * The bills, the credit, the tax years and the standing orders are gone with
 * the systems that raised them. What is left is the one read model Home and
 * the save-slot summary still ask for: what a person is worth right now,
 * derived from the ledger and from what they own, never stored.
 */

import type { Simulation } from '../core/simulation';
import { isLiability } from '../core/ledger';
import type { Money } from '../core/money';
import type { Id } from '../domain/model';

export interface Worth {
  cash: Money;
  assets: Money;
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
  let liabilities = 0;
  for (const account of sim.ledger.accountsOf(ownerId)) {
    if (isLiability(account.kind)) liabilities += Math.max(0, -account.balance);
    else cash += account.balance;
  }

  let assets = 0;
  for (const property of Object.values(sim.universe.properties)) {
    if (property.ownerId === ownerId && property.tenure === 'owned' && !property.soldAt) {
      assets += property.marketValue;
    }
  }

  return { cash, assets, liabilities, total: cash + assets - liabilities };
}
