/**
 * SLATE — each card's own offers (module 8 of `docs/BANKING-FUNCTIONS.md`),
 * from the cards' researched terms (`probe/more/cards2-*.jsonl`, merged into
 * `content/cards.ts`):
 *
 * - **An introductory purchase rate** (C51), for the card's months from
 *   opening, ended on a US card by a payment sixty days late (in
 *   `cardTerms`).
 * - **A balance transfer** (C31, C55): applying for a new bank's card after
 *   switching, the old card's balance moved onto it on arrival for the card's
 *   fee, at its transfer rate, and its introductory transfer rate for its
 *   months, where the card's terms were found. The old card closes. SLATE
 *   holds one card at a time, so a transfer that the new limit won't take
 *   with its fee isn't made.
 * - **A money transfer** (C32) into the holder's own current account, for the
 *   card's fee, at its transfer rate from the day it's made, where the card
 *   offers one (NatWest's, Santander Spain's, Bankinter's).
 * - **A plan** (C34, C62): part of what purchases owe paid off in equal
 *   months for a fixed monthly fee instead of interest, where the card
 *   charges one (Chase's and Bank of America's 1.72%, RBC's, BMO's, the
 *   Japanese banks' installments). The fee is the most the bank says it
 *   charges, as SLATE can't know the offer it would make on the day.
 * - **Rewards** (C39): the card's base rate on every purchase, counted at
 *   each statement from the ledger and redeemed onto the card. A card's
 *   bonus categories are shown in the bank's words and not paid.
 *
 * A payment goes to the dearest balance first, a US card's minimum to the
 * cheapest, and a plan's balance last (`allocatePayment` in `systems/cash.ts`).
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Account } from '../core/ledger';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { addMonths } from '../core/time';
import { exchange } from '../content/currency';
import { bankById } from '../content/banks';
import { CARDS } from '../content/cards';
import { cardOf, cardRoom, cardTerms, type CardPlan, type CardTerms, type CardTransfer, type CreditState } from './credit';
import { cashOwedOn } from './cash';

/** The months a plan may run: the lengths Chase, Bank of America and the Canadian banks all offer. */
export const PLAN_MONTHS = [3, 6, 12] as const;

/** What isn't a purchase on the card, for rewards. */
const NOT_PURCHASES = new Set(['interest', 'fees', 'cash', 'card-transfer', 'transfer', 'card-payment', 'rewards']);

/** A transfer's rate today: its introductory rate while it runs, unless a US payment sixty days late ended it. */
export function transferRate(sim: Simulation, credit: CreditState, one: CardTransfer): number {
  return one.introUntil !== undefined && sim.now < one.introUntil && !credit.introLost ? one.introApr ?? one.apr : one.apr;
}

/** What the card owes on transfers, cut down to what it owes beyond cash advances. */
export function transfersOwedOn(person: Person, card: Account): Money {
  const owed = (person.credit?.transfers ?? []).reduce((sum, one) => sum + one.owed, 0);
  return Math.max(0, Math.min(owed, -card.balance - cashOwedOn(person, card)));
}

/** What's left to pay on the card's plans. */
export function planLeftOf(credit: CreditState | undefined): Money {
  return (credit?.plans ?? []).reduce((sum, one) => sum + one.left, 0);
}

/** A transfer's fee: the card's share of it, never under its minimum. */
export function transferFee(terms: CardTerms, amount: Money): Money {
  return terms.transfer ? Math.max(terms.transfer.feeMin, Math.round(amount * terms.transfer.feeShare)) : 0;
}

/** What purchases owe that isn't in a plan, a transfer or a cash advance: what a plan can be made from. */
export function planRoom(person: Person, card: Account): Money {
  return Math.max(0, -card.balance - cashOwedOn(person, card) - transfersOwedOn(person, card) - planLeftOf(person.credit));
}

/**
 * At each statement: each transfer's interest charged onto it, each plan's
 * month moved into what's due with its fee, and the cycle's purchases'
 * rewards counted.
 */
export function statementOffers(sim: Simulation, card: Account, credit: CreditState, terms: CardTerms): void {
  for (const one of credit.transfers ?? []) {
    const interest = Math.round(one.accrued);
    one.accrued = 0;
    if (interest <= 0) continue;
    sim.post({ memo: one.kind === 'balance' ? 'Balance transfer interest' : 'Money transfer interest', category: 'interest', postings: [{ accountId: sim.nominalAccount('expense', 'Card Interest').id, amount: interest }, { accountId: card.id, amount: -interest }] });
    one.owed += interest;
  }
  credit.transfers = (credit.transfers ?? []).filter((one) => one.owed > 0);
  let planDue = 0;
  for (const plan of credit.plans ?? []) {
    const month = Math.min(plan.left, plan.monthly);
    plan.left -= month;
    plan.monthsLeft -= 1;
    if (plan.fee > 0) sim.post({ memo: 'Plan fee', category: 'fees', postings: [{ accountId: sim.nominalAccount('expense', 'Card Fees').id, amount: plan.fee }, { accountId: card.id, amount: -plan.fee }] });
    planDue += month + plan.fee;
  }
  credit.plans = (credit.plans ?? []).filter((plan) => plan.left > 0 && plan.monthsLeft > 0);
  credit.statementPlanDue = planDue;
  if (terms.rewardsRate) {
    const from = credit.rewardsFrom ?? card.openedAt;
    let spent = 0;
    const list = sim.universe.transactions;
    for (let i = list.length - 1; i >= 0 && list[i]!.at >= from; i -= 1) {
      const t = list[i]!;
      if (NOT_PURCHASES.has(t.category)) continue;
      for (const p of t.postings) if (p.accountId === card.id && p.amount < 0) spent -= p.amount;
    }
    credit.rewards = (credit.rewards ?? 0) + Math.round(spent * terms.rewardsRate);
  }
  credit.rewardsFrom = sim.now;
}

/**
 * The new card arrived with a balance transfer asked for: the old card's
 * balance moved onto it for the card's fee, and the old card closed.
 */
export function transferOnArrival(sim: Simulation, person: Person, card: Account, old: Account): void {
  const credit = person.credit!;
  const terms = cardTerms(sim, card, credit.score);
  const owed = Math.max(0, -old.balance);
  if (!terms.transfer || owed <= 0) return;
  const fee = transferFee(terms, owed);
  sim.post({ memo: `Balance transfer from ${old.name}`, category: 'card-transfer', postings: [{ accountId: old.id, amount: owed }, { accountId: card.id, amount: -owed }] });
  if (fee > 0) sim.post({ memo: 'Balance transfer fee', category: 'fees', postings: [{ accountId: sim.nominalAccount('expense', 'Card Fees').id, amount: fee }, { accountId: card.id, amount: -fee }] });
  old.closedAt = sim.now;
  const intro = terms.transfer.introMonths !== undefined ? { introApr: terms.transfer.introApr, introUntil: addMonths(card.openedAt, terms.transfer.introMonths, sim.homeZone) } : {};
  credit.transfers = [{ kind: 'balance', owed: owed + fee, accrued: 0, apr: terms.transfer.apr, ...intro }];
  if (person.id === sim.universe.playerId) {
    const cur = saveCurrency(sim.universe);
    sim.notify({ category: 'money', title: 'Your Balance Moved', body: `${formatMoney(owed, cur)} from the ${old.name}, for a ${formatMoney(fee, cur)} fee, at ${((intro.introApr ?? terms.transfer.apr) * 100).toFixed(2)}%. The old card is closed.`, importance: 50, route: '/workspace/bank' });
  }
}

export function registerCardOffers(sim: Simulation): void {
  sim.onCommand<{ amount: Money }, { fee: Money }>('card.money_transfer', (p, { sim: s }) => {
    const person = s.player;
    const card = cardOf(s, person);
    const credit = person.credit;
    if (!card || !credit) throw new CommandError('You don’t have a card.');
    const terms = cardTerms(s, card, credit.score);
    if (!terms.moneyTransferFee) throw new CommandError(`The ${card.name} doesn’t offer money transfers.`);
    const current = person.primaryAccountId ? s.universe.accounts[person.primaryAccountId] : undefined;
    if (!current || current.closedAt) throw new CommandError('You need a current account for the money.');
    const amount = Math.round(Number(p.amount));
    if (!(amount > 0)) throw new CommandError('Say how much.');
    const fee = Math.round(amount * terms.moneyTransferFee);
    const room = cardRoom(person, card);
    if (room < amount + fee) throw new CommandError(`The card has ${formatMoney(room, saveCurrency(s.universe))} free, and this takes ${formatMoney(amount + fee, saveCurrency(s.universe))} with its fee.`);
    s.post({ memo: `Money transfer from ${card.name}`, category: 'card-transfer', postings: [{ accountId: card.id, amount: -amount }, { accountId: current.id, amount }] });
    s.post({ memo: 'Money transfer fee', category: 'fees', postings: [{ accountId: s.nominalAccount('expense', 'Card Fees').id, amount: fee }, { accountId: card.id, amount: -fee }] });
    credit.transfers = [...(credit.transfers ?? []), { kind: 'money', owed: amount + fee, accrued: 0, apr: terms.transfer?.apr ?? terms.apr }];
    return { fee };
  });

  sim.onCommand<{ amount: Money; months: number }, { plan: CardPlan }>('card.plan', (p, { sim: s }) => {
    const person = s.player;
    const card = cardOf(s, person);
    const credit = person.credit;
    if (!card || !credit) throw new CommandError('You don’t have a card.');
    const terms = cardTerms(s, card, credit.score);
    if (!terms.planFeeShare) throw new CommandError(`The ${card.name} has no plan SLATE has terms for.`);
    const months = Math.round(Number(p.months));
    if (!(PLAN_MONTHS as readonly number[]).includes(months)) throw new CommandError('A plan runs 3, 6 or 12 months.');
    const amount = Math.round(Number(p.amount));
    const room = planRoom(person, card);
    if (!(amount > 0) || amount > room) throw new CommandError(`Purchases owe ${formatMoney(room, saveCurrency(s.universe))} that can go into a plan.`);
    const plan: CardPlan = { left: amount, monthly: Math.ceil(amount / months), fee: Math.round(amount * terms.planFeeShare), monthsLeft: months };
    credit.plans = [...(credit.plans ?? []), plan];
    return { plan };
  });

  sim.onCommand<Record<string, never>, { redeemed: Money }>('card.redeem_rewards', (_p, { sim: s }) => {
    const person = s.player;
    const card = cardOf(s, person);
    const credit = person.credit;
    const rewards = credit?.rewards ?? 0;
    if (!card || !credit || rewards <= 0) throw new CommandError('The card has no rewards to redeem.');
    s.post({ memo: 'Rewards redeemed', category: 'rewards', postings: [{ accountId: card.id, amount: rewards }, { accountId: s.nominalAccount('income', 'Card Rewards').id, amount: -rewards }] });
    credit.rewards = 0;
    return { redeemed: rewards };
  });
}

/** A balance transfer asked for with an application: refused before the bank looks if the limit won't take it with its fee. */
export function transferRefusal(sim: Simulation, person: Person, bankId: string, limit: Money): string | undefined {
  const old = cardOf(sim, person);
  if (!old) return 'You have no card to move a balance from.';
  if (old.bankId === bankId) return 'A balance moves onto a card at another bank.';
  const bank = bankById(bankId);
  const found = CARDS[bankId];
  const offer = found && !('none' in found) ? found.transfer : undefined;
  if (!bank || !offer) return `SLATE doesn’t have ${bank?.name ?? 'this bank'}’s card’s balance transfer terms.`;
  const owed = Math.max(0, -old.balance);
  if (owed <= 0) return `The ${old.name} owes nothing to move.`;
  const into = saveCurrency(sim.universe);
  const feeMin = offer.feeMin === undefined ? 0 : bank.currency === into ? offer.feeMin : exchange(offer.feeMin, bank.currency, into) ?? offer.feeMin;
  const fee = Math.max(feeMin, Math.round(owed * (offer.feeShare ?? 0)));
  if (owed + fee > limit) return `It would come with a ${formatMoney(limit, saveCurrency(sim.universe))} limit, and moving ${formatMoney(owed, saveCurrency(sim.universe))} takes ${formatMoney(owed + fee, saveCurrency(sim.universe))} with its fee. Pay the old card down first.`;
  return undefined;
}
