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
import { homesValue, owedOnHomes } from './homes';
import { saveCurrency } from '../core/money';
import { exchange } from '../content/currency';
import { LAND_MARKETS } from '../content/land';
import { landValue, parcelsOf } from './land';
import { valueOf, vehiclesOf, modelById } from './vehicles';

export interface Worth {
  /** In the bank: every account of theirs but a deposit a landlord holds. */
  cash: Money;
  /** Theirs, held by somebody else: a rent deposit (`systems/household.ts`). */
  held: Money;
  /**
   * In a pension fund, theirs but locked until they retire. The day job's pay
   * went into one until the job engine went on 2026-09-26; a save from before
   * keeps it, and nothing adds to it now.
   */
  pension: Money;
  /** The homes they own, at what they're worth now (`systems/homes.ts`); the loans on them are among the liabilities. From 2026-09-28. */
  home: Money;
  /**
   * Their cars at what they'd sell for, their land at its value, and a house
   * being built at what its stages have cost so far (`systems/vehicles.ts`,
   * `land.ts`, `construction.ts`). Until 2026-09-29 none was counted, nor a
   * car loan among the liabilities: the loan is kept on a book of every car
   * loan, not the person's own, and so was missed.
   */
  vehicles: Money;
  land: Money;
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

  const person = sim.universe.people[ownerId];
  const home = person ? homesValue(sim, person) : 0;
  // Payments due on homes and not yet made are owed, as a debt on the ledger is.
  if (person) liabilities += owedOnHomes(person);
  const cur = saveCurrency(sim.universe);
  const inSave = (cents: Money, from: string) => (cur === from ? cents : exchange(cents, from, cur) ?? cents);
  let vehicles = 0;
  let land = 0;
  for (const v of person ? vehiclesOf(person) : []) {
    if (v.soldAt !== undefined) continue;
    const m = modelById(v.modelId);
    vehicles += m ? inSave(valueOf(v, sim.now), m.currency) : 0;
    liabilities += v.loan?.owed ?? 0;
  }
  // A plane of their own, at its price, held (`systems/aviation.ts`).
  if (person?.aircraft && person.aircraft.soldAt === undefined) vehicles += person.aircraft.price;
  // And a boat, the same way (`systems/boats.ts`).
  if (person?.boat && person.boat.soldAt === undefined) { vehicles += person.boat.price; liabilities += person.boat.loan?.owed ?? 0; }
  for (const p of person ? parcelsOf(person) : []) {
    if (p.soldAt !== undefined) continue;
    const m = LAND_MARKETS[p.market]!;
    land += inSave(landValue(m, p.acres, sim.now), m.currency);
    // A house going up on it, at what its finished stages have been paid.
    const b = person?.building;
    if (b && b.parcelId === p.id) land += inSave(b.amounts.slice(0, Math.max(0, b.stage)).reduce((a, x) => a + x, 0), m.currency);
  }
  return { cash, held, pension, home, vehicles, land, liabilities, total: cash + held + pension + home + vehicles + land - liabilities };
}
