/**
 * SLATE — a car loan in default, and the car taken back (docs/WORLD.md, stage
 * 3e), from 2026-09-29, on the rules in `content/repossession.ts`.
 *
 * Three payments missed running, where the loan is secured on the car and the
 * place's law lets the lender seize it, and the car is taken: it sits, its
 * notice runs, and Redeem It pays what the law says redeems it, with the tow
 * and the storage so far. Unredeemed, it's sold at its value, less the tow
 * and the storage: the loan paid from the sale, a surplus to the borrower,
 * and the shortfall owed as the place's law has it.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatDate } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { DEFAULT_AFTER_MISSED, LOAN_LATE_ON_RECORD, REPOSSESSED_ON_RECORD, REPOSSESSION, REPO_FEES_USD } from '../content/repossession';
import { arrearsAccount, arrearsOf, drawFromBank, owe } from './household';
import type { OwnedVehicle } from './vehicles';
import { markRecord } from './credit';

export const REPO_SALE_KIND = 'vehicle.repo_sale';

const usd = (sim: Simulation, units: number) => { const cur = saveCurrency(sim.universe); const c = Math.round(units * 100); return cur === 'USD' ? c : exchange(c, 'USD', cur) ?? c; };

/** The tow and the storage so far, in the save's money. */
export function repoFees(sim: Simulation, v: OwnedVehicle, at = sim.now): Money {
  if (!v.repossessed) return 0;
  const days = Math.max(0, Math.ceil((at - v.repossessed.at) / MS_DAY));
  return usd(sim, REPO_FEES_USD.tow + REPO_FEES_USD.storagePerDay * days);
}

/** What redeems a car taken: what's missed, or the whole balance, with the fees so far. */
export function redemption(sim: Simulation, v: OwnedVehicle): Money | undefined {
  const rule = REPOSSESSION[v.jurisdiction];
  if (!v.repossessed || !rule || !v.loan) return undefined;
  return (rule.redeemBy === 'missed' ? v.loan.missedAmount ?? 0 : (v.loan.owed + (v.loan.missedAmount ?? 0))) + repoFees(sim, v);
}

/** The record takes a mark, and remembers when. */
function mark(person: Person, points: number, at: number): void {
  if (!person.credit) return;
  markRecord(person, points, at, person.home?.cityId ?? person.currentLocationId);
  person.credit.late.push(at);
}

/**
 * A payment made or missed: counted, and the car taken where the law allows
 * once three are missed running. A second missed running means the first is
 * thirty days late, and the lender reports it, as it does each one after.
 */
export function loanMonth(sim: Simulation, person: Person, v: OwnedVehicle, paid: boolean, payment: Money, label: string): void {
  if (!v.loan) return;
  if (paid) { v.loan.missed = 0; return; }
  v.loan.missed = (v.loan.missed ?? 0) + 1;
  v.loan.missedAmount = (v.loan.missedAmount ?? 0) + payment;
  if (v.loan.missed >= 2) mark(person, LOAN_LATE_ON_RECORD, sim.now);
  const rule = REPOSSESSION[v.jurisdiction];
  if (!rule || v.repossessed || v.loan.missed < DEFAULT_AFTER_MISSED) return;
  const original = v.loan.original ?? v.loan.owed;
  if (rule.protectedAt !== undefined && 1 - v.loan.owed / original >= rule.protectedAt) return;
  const saleAt = sim.now + rule.noticeDays * MS_DAY;
  v.repossessed = { at: sim.now, saleAt };
  mark(person, REPOSSESSED_ON_RECORD, sim.now);
  sim.schedule({ at: saleAt, kind: REPO_SALE_KIND, label: 'Repossessed Car Sold', category: 'home', priority: 30, payload: { personId: person.id, vehicleId: v.id } });
  if (person.id === sim.universe.playerId) sim.notify({ category: 'home', title: 'Your Car Was Repossessed', body: `${DEFAULT_AFTER_MISSED} payments on the ${label} missed, the lender took it. It’s sold on ${formatDate(saleAt, sim.zone)} unless you redeem it on the Cars screen, and it’s on your record.`, importance: 85, route: '/workspace/vehicles' });
}

/** The car sold after its notice: the loan paid from it, a surplus back, the shortfall owed or ended by the law. */
export function sellRepossessed(sim: Simulation, person: Person, v: OwnedVehicle, value: Money, label: string): void {
  const rule = REPOSSESSION[v.jurisdiction]!;
  const loan = v.loan;
  const owed = loan?.owed ?? 0;
  const missed = loan?.missedAmount ?? 0;
  const proceeds = Math.max(0, value - repoFees(sim, v));
  // The loan's balance off the book of car loans, against the car given up.
  if (owed > 0) sim.post({ memo: `The ${label}, repossessed and sold`, category: 'vehicle', postings: [{ accountId: sim.nominalAccount('liability_other', 'Car Loans').id, amount: owed }, { accountId: sim.nominalAccount('income', 'Car Repossessed').id, amount: -owed }] });
  // Seize or sue: seizing ends the debt, the missed payments with it.
  const ended = rule.shortfall === 'none' ? Math.min(missed, arrearsOf(sim, person)) : 0;
  if (ended > 0) sim.post({ memo: 'Car loan arrears ended by the seizure', category: 'vehicle', postings: [{ accountId: arrearsAccount(sim, person).id, amount: ended }, { accountId: sim.nominalAccount('income', 'Car Repossessed').id, amount: -ended }] });
  const claim = owed + (rule.shortfall === 'none' ? 0 : missed);
  const credited = rule.shortfall === 'past-value' ? Math.max(proceeds, value) : proceeds;
  const surplus = proceeds - claim;
  if (surplus > 0) sim.post({ memo: `What the ${label}’s sale left over`, category: 'vehicle', postings: [{ accountId: person.primaryAccountId!, amount: surplus }, { accountId: sim.nominalAccount('income', 'Car Repossessed').id, amount: -surplus }] });
  // The shortfall past the loan's balance; the missed payments are owed already.
  const shortfall = rule.shortfall === 'none' ? 0 : Math.max(0, owed - credited);
  if (shortfall > 0) owe(sim, person, shortfall, `The ${label}’s loan, short after its sale`, 'vehicle');
  v.soldAt = sim.now;
  delete v.loan;
  delete v.repossessed;
  if (person.id === sim.universe.playerId) sim.notify({ category: 'home', title: 'Your Repossessed Car Was Sold', body: `${formatMoney(proceeds, saveCurrency(sim.universe))} after the tow and storage.${shortfall > 0 ? ` ${formatMoney(shortfall, saveCurrency(sim.universe))} of the loan is still owed.` : ''}${surplus > 0 ? ` ${formatMoney(surplus, saveCurrency(sim.universe))} came back to you.` : ''}${rule.shortfall === 'none' ? ' British Columbia’s law ends the debt with the seizure.' : ''}`, importance: 70, route: '/workspace/vehicles' });
}

export function registerRedeem(sim: Simulation, find: (person: Person, id: string) => OwnedVehicle | undefined): void {
  sim.onCommand<{ vehicleId: string }, { paid: Money }>('vehicle.redeem', (p, { sim: s }) => {
    const person = s.player;
    const v = find(person, String(p?.vehicleId));
    if (!v || !v.repossessed) throw new CommandError('That car isn’t repossessed.');
    const due = redemption(s, v)!;
    const rule = REPOSSESSION[v.jurisdiction]!;
    const draw = drawFromBank(s, person, due, false, true);
    if (draw.short > 0) throw new CommandError(`${formatMoney(due, saveCurrency(s.universe))} is more than the bank can pay.`);
    const missed = v.loan?.missedAmount ?? 0;
    const settled = Math.min(missed, arrearsOf(s, person));
    const balance = rule.redeemBy === 'balance' ? v.loan?.owed ?? 0 : 0;
    s.post({ memo: 'A repossessed car redeemed', category: 'vehicle', postings: [
      ...draw.postings,
      ...(settled > 0 ? [{ accountId: arrearsAccount(s, person).id, amount: settled }] : []),
      ...(balance > 0 ? [{ accountId: s.nominalAccount('liability_other', 'Car Loans').id, amount: balance }] : []),
      { accountId: s.nominalAccount('expense', 'Vehicles').id, amount: due - settled - balance },
    ] });
    if (v.loan) {
      v.loan.missed = 0;
      v.loan.missedAmount = 0;
      if (rule.redeemBy === 'balance') delete v.loan;
    }
    delete v.repossessed;
    for (const item of s.universe.scheduled) if (item.status === 'pending' && item.kind === REPO_SALE_KIND && item.payload.vehicleId === v.id) s.timeline.cancel(item.id, s.now);
    return { paid: due };
  });
}

