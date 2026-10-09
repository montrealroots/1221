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
 *   each statement from the ledger and redeemed onto the card; and, since
 *   2026-09-27, a card's bonus on the two things a card buys in SLATE, the
 *   groceries and the recurring bills, at the bank's rate to its cap
 *   (`BONUSES`). Until then the bonus categories were shown in the bank's
 *   words and not paid. A category SLATE's card never buys on (dining,
 *   drugstores, gas, travel) is paid at the base rate, which is what it
 *   would earn.
 *
 * A payment goes to the dearest balance first, a US card's minimum to the
 * cheapest, and a plan's balance last (`allocatePayment` in `systems/cash.ts`).
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Account } from '../core/ledger';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { addMonths, zonedParts } from '../core/time';
import { exchange } from '../content/currency';
import { bankById } from '../content/banks';
import { CARDS } from '../content/cards';
import { cardFor, cardRoom, cardTerms, stateOf, type CardPlan, type CardState, type CardTerms, type CardTransfer } from './credit';
import { ENERGY } from './seasons';
import { INTEREST_PLANS, planPayment } from '../content/plans';
import { cashOwedOn } from './cash';

/** The months a plan may run: the lengths Chase, Bank of America and the Canadian banks all offer. */
export const PLAN_MONTHS = [3, 6, 12] as const;

/** The months a card's plan may run: its bank's own where it charges interest or a fee by the length (`content/plans.ts`), else `PLAN_MONTHS`. */
export function planMonthsOf(card: Account): number[] {
  const own = card.bankId ? INTEREST_PLANS[card.bankId] : undefined;
  return own ? Object.keys(own.months).map(Number) : [...PLAN_MONTHS];
}

/**
 * The bonus categories of the cards that have one on groceries or recurring
 * bills, read by hand from each bank's words in `content/cards.ts`: each
 * category's rate to a cap in a period, and the rate past it; and the rate
 * on everything else where it isn't the card's base rate. Caps in the bank's
 * currency's hundredths.
 */
export interface Bonus { rate: number; cap?: Money; after?: number }
/**
 * The phone and internet's share of SLATE's bills: the part that isn't
 * energy (`ENERGY.share` in `systems/seasons.ts`) is the phone, the internet
 * and getting about, and Mexico's households spend 4.8% of what they spend
 * on communications against 19.5% on transport and communications together
 * (INEGI, ENIGH 2024, published July 2025), so communications are that
 * part's 4.8/19.5. It lived in `systems/telecom.ts` from 2026-10-01 until
 * the phone lines went in the scope reset of 2026-10-09, and came back here.
 */
export const TELECOM_OF_BILLS = (1 - ENERGY.share) * (4.8 / 19.5);

/**
 * Korea's: its households spent ₩167,000 a month on communications against
 * ₩337,000 on transport in 2025 (National Data Office, 가계동향조사, 26
 * February 2026), so communications are 167/504 of the bills' part that
 * isn't energy.
 */
export const KOREA_TELECOM_OF_BILLS = (1 - ENERGY.share) * (167 / 504);

/** A bills bonus that is a rate on the phone's share, held to a cap on the bonus itself, as the spend that reaches it. */
const onPhone = (rate: number, share: number, bonusCap: Money): Bonus => ({ rate: rate * share, cap: Math.round(bonusCap / (rate * share)), after: 0 });

export const BONUSES: Readonly<Record<string, { per: 'quarter' | 'year' | 'cycle' | 'month'; food?: Bonus; bills?: Bonus; other?: Bonus; shared?: boolean; priorMonth?: readonly (readonly [Money, number])[] }>> = {
  // 10% off the phone bill, ₩5,000 a month at most, in a month after one of ₩400,000 on the card (card.kbcard.com, My WE:SH).
  'kr-kb-kookmin': { per: 'month', bills: onPhone(0.1, KOREA_TELECOM_OF_BILLS, 5_000_00), priorMonth: [[400_000_00, 1]] },
  // 10% of the phone bill in points (₩1 each), to 5,000, 10,000 or 20,000 a month after one of ₩300,000, ₩500,000 or ₩1,000,000 (shinhancard.com, 처음).
  'kr-shinhan': { per: 'month', bills: onPhone(0.1, KOREA_TELECOM_OF_BILLS, 5_000_00), priorMonth: [[300_000_00, 1], [500_000_00, 2], [1_000_000_00, 4]] },
  // 2% at grocery stores, on the first $2,500 of grocery and choice spending together a quarter; 1% on the rest.
  'us-bank-of-america': { per: 'quarter', food: { rate: 0.02, cap: 2_500_00, after: 0.01 } },
  // 2% on the first $6,000 of groceries, 1% after; 0.5% on the first $6,000 of the rest, 1% after.
  'ca-rbc': { per: 'year', food: { rate: 0.02, cap: 6_000_00, after: 0.01 }, bills: { rate: 0.005, cap: 6_000_00, after: 0.01 }, other: { rate: 0.005, cap: 6_000_00, after: 0.01 } },
  // 1% on grocery and recurring bills, the first $5,000 a year in each; 0.5% else.
  'ca-td': { per: 'year', food: { rate: 0.01, cap: 5_000_00, after: 0.005 }, bills: { rate: 0.01, cap: 5_000_00, after: 0.005 } },
  // 1% on grocery, recurring bills and the rest of its list, to $15,000 a year together; 0.5% else.
  'ca-scotiabank': { per: 'year', food: { rate: 0.01, cap: 15_000_00, after: 0.005 }, bills: { rate: 0.01, cap: 15_000_00, after: 0.005 }, shared: true },
  // 3% on groceries and 1% on recurring bills, each on up to $500 a statement cycle; 0.5% else.
  'ca-bmo': { per: 'cycle', food: { rate: 0.03, cap: 500_00, after: 0.005 }, bills: { rate: 0.01, cap: 500_00, after: 0.005 } },
  // 2% on groceries, 1% on recurring payments, no cap; 0.5% else.
  'ca-cibc': { per: 'cycle', food: { rate: 0.02 }, bills: { rate: 0.01 } },
  // 1% at supermarkets, the whole cash back to $500 a month, which at 1% is $50,000 of groceries; nothing elsewhere but its named categories.
  // Its 4% on telecoms on the phone and internet's share of the bills (`TELECOM_OF_BILLS`); until 2026-09-28 it wasn't paid, that share unknown.
  'mx-santander': { per: 'month', food: { rate: 0.01, cap: 50_000_00, after: 0 }, bills: { rate: 0.04 * TELECOM_OF_BILLS }, other: { rate: 0 } },
};

/** The period a bonus's cap runs over, as a key: a calendar quarter, year or month, or the statement cycle. */
function bonusPeriod(sim: Simulation, per: 'quarter' | 'year' | 'cycle' | 'month', from: number): string {
  const d = zonedParts(sim.now, sim.zone);
  if (per === 'cycle') return `c${from}`;
  if (per === 'year') return `y${d.year}`;
  if (per === 'quarter') return `q${d.year}-${Math.floor((d.month - 1) / 3)}`;
  return `m${d.year}-${d.month}`;
}

/** What isn't a purchase on the card, for rewards. */
const NOT_PURCHASES = new Set(['interest', 'fees', 'cash', 'card-transfer', 'transfer', 'card-payment', 'rewards']);

/** A transfer's rate today: its introductory rate while it runs, unless a US payment sixty days late ended it. */
export function transferRate(sim: Simulation, credit: CardState, one: CardTransfer): number {
  return one.introUntil !== undefined && sim.now < one.introUntil && !credit.introLost ? one.introApr ?? one.apr : one.apr;
}

/** What the card owes on transfers, cut down to what it owes beyond cash advances. */
export function transfersOwedOn(person: Person, card: Account): Money {
  const owed = person.credit ? (stateOf(person, card).transfers ?? []).reduce((sum, one) => sum + one.owed, 0) : 0;
  return Math.max(0, Math.min(owed, -card.balance - cashOwedOn(person, card)));
}

/** What's left to pay on the card's plans. */
export function planLeftOf(credit: CardState | undefined): Money {
  return (credit?.plans ?? []).reduce((sum, one) => sum + one.left, 0);
}

/** A transfer's fee: the card's share of it, never under its minimum. */
export function transferFee(terms: CardTerms, amount: Money): Money {
  return terms.transfer ? Math.max(terms.transfer.feeMin, Math.round(amount * terms.transfer.feeShare)) : 0;
}

/** What purchases owe that isn't in a plan, a transfer or a cash advance: what a plan can be made from. */
export function planRoom(person: Person, card: Account): Money {
  return Math.max(0, -card.balance - cashOwedOn(person, card) - transfersOwedOn(person, card) - planLeftOf(person.credit ? stateOf(person, card) : undefined));
}

/**
 * At each statement: each transfer's interest charged onto it, each plan's
 * month moved into what's due with its fee, and the cycle's purchases'
 * rewards counted.
 */
export function statementOffers(sim: Simulation, card: Account, credit: CardState, terms: CardTerms): void {
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
    // A plan charged as interest: the month's interest on what's left, and the rest of the equal month off it.
    const interest = plan.apr ? Math.round(plan.left * plan.apr / 12) : 0;
    const month = Math.min(plan.left, plan.apr ? Math.max(0, plan.monthly - interest) : plan.monthly);
    plan.left -= month;
    plan.monthsLeft -= 1;
    if (interest > 0) sim.post({ memo: 'Plan interest', category: 'interest', postings: [{ accountId: sim.nominalAccount('expense', 'Card Interest').id, amount: interest }, { accountId: card.id, amount: -interest }] });
    if (plan.fee > 0) sim.post({ memo: 'Plan fee', category: 'fees', postings: [{ accountId: sim.nominalAccount('expense', 'Card Fees').id, amount: plan.fee }, { accountId: card.id, amount: -plan.fee }] });
    planDue += month + plan.fee + interest;
  }
  credit.plans = (credit.plans ?? []).filter((plan) => plan.left > 0 && plan.monthsLeft > 0);
  credit.statementPlanDue = planDue;
  const bonus = card.bankId ? BONUSES[card.bankId] : undefined;
  if (terms.rewardsRate || bonus) {
    const from = credit.rewardsFrom ?? card.openedAt;
    const spent = { food: 0, bills: 0, other: 0 };
    const list = sim.universe.transactions;
    for (let i = list.length - 1; i >= 0 && list[i]!.at >= from; i -= 1) {
      const t = list[i]!;
      if (NOT_PURCHASES.has(t.category)) continue;
      const kind = t.category === 'food' ? 'food' : t.category === 'bills' ? 'bills' : 'other';
      for (const p of t.postings) if (p.accountId === card.id && p.amount < 0) spent[kind] -= p.amount;
    }
    credit.rewards = (credit.rewards ?? 0) + bonusRewards(sim, card, credit, terms.rewardsRate ?? 0, spent, from);
  }
  credit.rewardsFrom = sim.now;
}

/** What went on a card in the last calendar month, as purchases. */
export function lastMonthSpend(sim: Simulation, card: Account): Money {
  const p = zonedParts(sim.now, sim.homeZone);
  const month = p.month === 1 ? `${p.year - 1}-12` : `${p.year}-${String(p.month - 1).padStart(2, '0')}`;
  let total = 0;
  for (const t of sim.universe.transactions) {
    if (NOT_PURCHASES.has(t.category)) continue;
    const q = zonedParts(t.at, sim.homeZone);
    if (`${q.year}-${String(q.month).padStart(2, '0')}` !== month) continue;
    for (const one of t.postings) if (one.accountId === card.id && one.amount < 0) total -= one.amount;
  }
  return total;
}

/** A statement's rewards: each category at its bonus to the period's cap, the rate after past it, and the base rate where there's no bonus. */
export function bonusRewards(sim: Simulation, card: Account, credit: CardState, base: number, spent: { food: Money; bills: Money; other: Money }, from: number): Money {
  const bonus = card.bankId ? BONUSES[card.bankId] : undefined;
  if (!bonus) return Math.round((spent.food + spent.bills + spent.other) * base);
  const currency = card.bankId ? bankById(card.bankId)?.currency ?? 'USD' : 'USD';
  const into = saveCurrency(sim.universe);
  // A Korean card's bonus turns on last month's spending (전월실적), its caps by the tier reached; below the first, only the base rate.
  let scale = 1;
  if (bonus.priorMonth) {
    const last = lastMonthSpend(sim, card);
    const tier = [...bonus.priorMonth].reverse().find(([atLeast]) => last >= (exchange(atLeast, currency, into) ?? atLeast));
    if (!tier) return Math.round((spent.food + spent.bills + spent.other) * base);
    scale = tier[1];
  }
  const period = bonusPeriod(sim, bonus.per, from);
  const used = (credit.bonusUsed ??= {});
  for (const key of Object.keys(used)) if (!key.endsWith(`@${period}`)) delete used[key];
  let total = 0;
  for (const kind of ['food', 'bills', 'other'] as const) {
    const amount = spent[kind];
    const b = bonus[kind];
    if (!b) { total += amount * base; continue; }
    if (b.cap === undefined) { total += amount * b.rate; continue; }
    const cap = (exchange(b.cap, currency, into) ?? b.cap) * scale;
    const key = `${bonus.shared ? 'all' : kind}@${period}`;
    const room = Math.max(0, cap - (used[key] ?? 0));
    const within = Math.min(amount, room);
    used[key] = (used[key] ?? 0) + within;
    total += within * b.rate + (amount - within) * (b.after ?? base);
  }
  return Math.round(total);
}

/**
 * The new card arrived with a balance transfer asked for: the old card's
 * balance moved onto it for the card's fee, and the old card closed.
 */
export function transferOnArrival(sim: Simulation, person: Person, card: Account, old: Account): void {
  const terms = cardTerms(sim, card, person.credit!.score);
  const credit = stateOf(person, card);
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
    sim.notify({ category: 'bank', title: 'Your Balance Moved', body: `${formatMoney(owed, cur)} from the ${old.name}, for a ${formatMoney(fee, cur)} fee, at ${((intro.introApr ?? terms.transfer.apr) * 100).toFixed(2)}%. The old card is closed.`, importance: 50, route: '/workspace/bank' });
  }
}

export function registerCardOffers(sim: Simulation): void {
  sim.onCommand<{ amount: Money; accountId?: string }, { fee: Money }>('card.money_transfer', (p, { sim: s }) => {
    const person = s.player;
    const card = cardFor(s, person, p.accountId);
    if (!card || !person.credit) throw new CommandError('You don’t have a card.');
    const credit = stateOf(person, card);
    const terms = cardTerms(s, card, person.credit.score);
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

  sim.onCommand<{ amount: Money; months: number; accountId?: string }, { plan: CardPlan }>('card.plan', (p, { sim: s }) => {
    const person = s.player;
    const card = cardFor(s, person, p.accountId);
    if (!card || !person.credit) throw new CommandError('You don’t have a card.');
    const credit = stateOf(person, card);
    const terms = cardTerms(s, card, person.credit.score);
    const interestPlan = card.bankId ? INTEREST_PLANS[card.bankId] : undefined;
    if (!terms.planFeeShare && !interestPlan) throw new CommandError(`The ${card.name} has no plan SLATE has terms for.`);
    const months = Math.round(Number(p.months));
    const lengths = planMonthsOf(card);
    if (!lengths.includes(months)) throw new CommandError(`A plan runs ${lengths.join(', ')} months.`);
    const amount = Math.round(Number(p.amount));
    const room = planRoom(person, card);
    if (!(amount > 0) || amount > room) throw new CommandError(`Purchases owe ${formatMoney(room, saveCurrency(s.universe))} that can go into a plan.`);
    const bank = bankById(card.bankId ?? '');
    const least = interestPlan?.min !== undefined && bank ? (exchange(interestPlan.min, bank.currency, saveCurrency(s.universe)) ?? interestPlan.min) : 0;
    if (amount < least) throw new CommandError(`A plan takes ${formatMoney(least, saveCurrency(s.universe))} at least.`);
    const term = interestPlan?.months[months];
    const plan: CardPlan = term?.apr !== undefined
      ? { left: amount, monthly: planPayment(amount, term.apr, months), fee: 0, monthsLeft: months, apr: term.apr }
      : term?.fee !== undefined
        ? { left: amount, monthly: Math.ceil(amount / months), fee: Math.round(amount * term.fee / months), monthsLeft: months }
        : { left: amount, monthly: Math.ceil(amount / months), fee: Math.round(amount * terms.planFeeShare!), monthsLeft: months };
    credit.plans = [...(credit.plans ?? []), plan];
    return { plan };
  });

  sim.onCommand<{ accountId?: string }, { redeemed: Money }>('card.redeem_rewards', (p, { sim: s }) => {
    const person = s.player;
    const card = cardFor(s, person, p?.accountId);
    const credit = card && person.credit ? stateOf(person, card) : undefined;
    const rewards = credit?.rewards ?? 0;
    if (!card || !credit || rewards <= 0) throw new CommandError('The card has no rewards to redeem.');
    s.post({ memo: 'Rewards redeemed', category: 'rewards', postings: [{ accountId: card.id, amount: rewards }, { accountId: s.nominalAccount('income', 'Card Rewards').id, amount: -rewards }] });
    credit.rewards = 0;
    return { redeemed: rewards };
  });
}

/** A balance transfer asked for with an application: refused before the bank looks if the limit won't take it with its fee. */
export function transferRefusal(sim: Simulation, person: Person, bankId: string, limit: Money, fromId?: string): string | undefined {
  const old = cardFor(sim, person, fromId);
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
