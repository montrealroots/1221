/**
 * SLATE — somewhere for money owed to a person to land.
 *
 * One function, and it exists because of a gap the family generator leaves and
 * two separate systems then fell into. `populateFamily` writes people — a mother,
 * a father, a twin — and gives none of them a bank account, because until
 * anything owed them anything there was nothing for an account to hold. The
 * player gets one at creation. Nobody else does.
 *
 * So the first thing that tried to pay a relative had to open one, and then the
 * second thing did too. The sugar group's board draw was first and this was
 * written inside `world/sugar.ts`, where it read as a fact about cane; the
 * producer's fee needs exactly the same thing for exactly the same reason. A
 * helper that two unrelated systems need is not a detail of either of them.
 */

import type { Simulation } from '../core/simulation';
import type { Id } from '../domain/model';

/**
 * The account somebody is paid into, opened on demand.
 *
 * Returns the one they have where they have one, so it never makes a second, and
 * a save that has already opened one for somebody keeps using it. Opened with a
 * balance of nought: this hands nobody any money, it only gives money somewhere
 * to go.
 */
export function purseFor(sim: Simulation, personId: Id): Id | undefined {
  const person = sim.universe.people[personId];
  if (!person) return undefined;
  if (person.primaryAccountId && sim.universe.accounts[person.primaryAccountId]) {
    return person.primaryAccountId;
  }
  const opened = sim.openAccount({
    id: sim.nextId('account'),
    kind: 'checking',
    name: `${person.displayName || person.firstName} Checking`,
    ownerId: person.id,
    institution: 'Landsbankinn',
    openedAt: sim.now,
    balance: 0,
  });
  person.primaryAccountId = opened.id;
  return opened.id;
}
