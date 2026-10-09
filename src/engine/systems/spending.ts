/**
 * SLATE — paying for things: out of the bank, onto the card, in cash, or owed.
 *
 * Taken out of `systems/household.ts` in the scope reset of 2026-10-09, when
 * the owner removed the home, its rent and its bills. What stayed is what
 * every payment in the game goes through, and the day's food, which is still
 * bought every morning at the town's prices.
 *
 * Each payment is made the way the character pays (`systems/payments.ts`):
 * the day's food on the debit card, the credit card or in cash; a fee or a
 * bill from the current account, with its overdraft and any savings linked
 * to it, or from any account named. A payment the account can't make goes
 * back unpaid, with the bank's fee, and what's owed is paid off the first
 * day there is money to pay it. Owing, or a card at its limit, weighs on
 * somebody every day it lasts.
 *
 * Until the reset what went unpaid was owed to the landlord, and rent and
 * bills fell due on the first of the month. A save that owed rent then still
 * owes it: the account it's kept in is the same one (`arrearsAccount`).
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Account } from '../core/ledger';
import { CITIES } from '../content/geography';
import { exchange } from '../content/currency';
import { salesTaxRate } from '../content/tax';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import type { Instant } from '../core/time';
import { clamp } from '../core/rng';
import { personalityOf } from './personality';
import { cardCeilingRoom, chargeForItem, chargeForPurchase, chargeReturned, overdraftHeadroom, purchaseMayOverdraw } from './lending';
import { paymentsOf, setPaymentHooks } from './payments';
import { cardRoom, cardsOf, cardOf as everydayCard, stateOf } from './credit';
import { roundUpOf, roundUpsOn, savingsDebit } from './accountlife';
import { hold } from './pending';
import { deadline, latePenalty } from './taxreturn';

/** A day's groceries and a cooked meal, in US dollars at the American average cost of living. SLATE's estimates. */
const DAY_OF_FOOD_USD = 8;
const MEAL_USD = 4;

/** The day's cost of owing, or of a card at its limit. */
const WORRY_STRESS = 4;
const WORRY_MORALE = 2;
const CARD_FULL = 0.9;

/** An amount the atlas prices in US dollars at a town's cost of living, in a currency, to the whole unit. */
export function atTown(cityId: string, usd: number, currency: string): Money {
  const city = CITIES.get(cityId);
  const cents = Math.round(usd * 100 * (city ? city.costOfLivingIndex / 100 : 1));
  const local = exchange(cents, 'USD', currency) ?? cents;
  return Math.round(local / 100) * 100;
}

/** A day's groceries and a cooked meal in a town at a date, in a currency, both with the town's sales tax on food. */
export function foodAt(cityId: string, currency: string, at: Instant): { day: Money; meal: Money } {
  if (!CITIES.get(cityId)) return { day: 0, meal: 0 };
  const tax = 1 + salesTaxRate(cityId, at, 'groceries');
  return { day: Math.round(atTown(cityId, DAY_OF_FOOD_USD, currency) * tax), meal: Math.round(atTown(cityId, MEAL_USD, currency) * tax) };
}

/**
 * A day's groceries, and a meal, as this person buys them where they are: a
 * frugal one spends less on the same day than a spender does (`spending`,
 * from the money traits).
 */
export function foodOf(sim: Simulation, person: Person): Money {
  return Math.round(foodAt(person.currentLocationId, saveCurrency(sim.universe), sim.now).day * personalityOf(person, 'spending'));
}

export function mealOf(sim: Simulation, person: Person): Money {
  return Math.round(foodAt(person.currentLocationId, saveCurrency(sim.universe), sim.now).meal * personalityOf(person, 'spending'));
}

const accountsOf = (sim: Simulation, person: Person) =>
  Object.values(sim.universe.accounts).filter((a) => a.ownerId === person.id && !a.nominal && !a.closedAt);

function checkingOf(sim: Simulation, person: Person): Account | undefined {
  return person.primaryAccountId ? sim.universe.accounts[person.primaryAccountId] : undefined;
}

/** The everyday card, where the day's spending goes. */
function cardOf(sim: Simulation, person: Person): Account | undefined {
  return everydayCard(sim, person);
}

/** What went unpaid and is owed, as a positive amount. */
export function arrearsOf(sim: Simulation, person: Person): Money {
  const owed = accountsOf(sim, person).find((a) => a.kind === 'loan' && a.category === 'arrears');
  return owed ? Math.max(0, -owed.balance) : 0;
}

/** Where what went unpaid is kept: the account a save's unpaid rent was kept in until 2026-10-09, or a new one. */
export function arrearsAccount(sim: Simulation, person: Person): Account {
  const found = accountsOf(sim, person).find((a) => a.kind === 'loan' && a.category === 'arrears');
  if (found) return found;
  return sim.openAccount({
    id: sim.nextId('account'), kind: 'loan', name: 'Bills Owed', ownerId: person.id,
    institution: 'Unpaid', openedAt: sim.now, category: 'arrears', apr: 0,
  });
}

/** Easy-access savings: a term deposit is locked until its end. */
function savingsOf(sim: Simulation, person: Person): Account | undefined {
  return accountsOf(sim, person).find((a) => a.kind === 'savings' && a.category !== 'term');
}

/** What can come out of savings now, its fee and any monthly allowance allowed for. */
function savingsRoom(sim: Simulation, person: Person): Money {
  const savings = savingsOf(sim, person);
  return savings ? savingsDebit(sim, savings).room : 0;
}

/** What checking and savings can pay between them, now. */
export function inTheBank(sim: Simulation, person: Person): Money {
  return Math.max(0, checkingOf(sim, person)?.balance ?? 0) + savingsRoom(sim, person);
}

/** What a payment from the current account can reach: the account, and savings where it's linked to it. */
function reachable(sim: Simulation, person: Person): Money {
  return Math.max(0, checkingOf(sim, person)?.balance ?? 0) + (paymentsOf(person).linkSavings ? savingsRoom(sim, person) : 0);
}

/**
 * The postings that take an amount out of checking, then savings, as far as
 * they go, then, where asked, the current account's overdraft
 * (`systems/lending.ts`), and what's left.
 */
export function drawFromBank(sim: Simulation, person: Person, amount: Money, withOverdraft = false, fromSavings = paymentsOf(person).linkSavings): { postings: { accountId: string; amount: Money }[]; short: Money } {
  const postings: { accountId: string; amount: Money }[] = [];
  let left = amount;
  const checking = checkingOf(sim, person);
  if (checking && left > 0) {
    const take = Math.min(left, Math.max(0, checking.balance));
    if (take > 0) {
      postings.push({ accountId: checking.id, amount: -take });
      left -= take;
    }
  }
  // From savings, what it lets out, and the bank's fee for the withdrawal beside it.
  const savings = fromSavings ? savingsOf(sim, person) : undefined;
  if (savings && left > 0) {
    const { room, fee } = savingsDebit(sim, savings);
    const take = Math.min(left, room);
    if (take > 0) {
      postings.push({ accountId: savings.id, amount: -take });
      if (fee > 0) postings.push({ accountId: savings.id, amount: -fee }, { accountId: sim.nominalAccount('expense', 'Bank Fees').id, amount: fee });
      left -= take;
    }
  }
  const current = checkingOf(sim, person);
  if (withOverdraft && current && left > 0) {
    const take = Math.min(left, overdraftHeadroom(sim, person));
    if (take > 0) {
      postings.push({ accountId: current.id, amount: -take });
      left -= take;
    }
  }
  return { postings, short: left };
}

/** What the current account (with linked savings), its overdraft where it may be used, and the card can pay between them, now. */
export function canPay(sim: Simulation, person: Person, overdraft = true): Money {
  const free = cardRoom(person, cardOf(sim, person));
  // Cash in hand pays for food first (`spend`), so it counts.
  const cash = Math.max(0, accountsOf(sim, person).find((a) => a.kind === 'cash')?.balance ?? 0);
  return reachable(sim, person) + (overdraft ? overdraftHeadroom(sim, person) : 0) + free + cash;
}

/**
 * A payment the person makes themselves and points at their money, as a tax
 * bill is paid from any account named: checking, then savings, whether or not
 * savings is linked. Until 2026-09-28 a tax bill reached only what
 * checking and linked savings held, and was refused as more than the bank
 * could cover with millions in savings.
 */
export function payFromBank(sim: Simulation, person: Person, amount: Money, memo: string, category: string): boolean {
  if (amount <= 0) return true;
  if (inTheBank(sim, person) < amount) return false;
  const bank = drawFromBank(sim, person, amount, false, true);
  if (bank.short > 0) return false;
  sim.post({ memo, category, postings: [{ accountId: sim.nominalAccount('expense', expenseFor(category)).id, amount }, ...bank.postings] });
  return true;
}

/**
 * Pays from the current account, its overdraft and any savings linked to it,
 * all of it or none, as a direct debit, standing order or cashed check is
 * paid. True if it went.
 */
export function payFromCurrent(sim: Simulation, person: Person, amount: Money, memo: string, category: string): boolean {
  if (amount <= 0) return true;
  if (reachable(sim, person) + overdraftHeadroom(sim, person) < amount) return false;
  const current = checkingOf(sim, person);
  const before = current?.balance ?? 0;
  const bank = drawFromBank(sim, person, amount, true);
  sim.post({ memo, category, postings: [{ accountId: sim.nominalAccount('expense', expenseFor(category)).id, amount }, ...bank.postings] });
  if (current && current.balance < 0 && current.balance < before) chargeForItem(sim, person, before - current.balance);
  return true;
}

/** Owes an amount for what went unpaid. Until 2026-10-09 it was owed to the landlord. */
export function owe(sim: Simulation, person: Person, amount: Money, memo: string, category: string): void {
  if (amount <= 0) return;
  sim.post({ memo: `${memo}, unpaid`, category, postings: [{ accountId: sim.nominalAccount('expense', expenseFor(category)).id, amount }, { accountId: arrearsAccount(sim, person).id, amount: -amount }] });
}

/**
 * The ledger's expense line for a payment's category. Until 2026-09-27
 * anything not rent or bills went to Food, so union dues, health premiums,
 * tax paid and the work's costs all read as food. Rent, bills, travel,
 * vehicles, land and building a house went from it with their systems on
 * 2026-10-09; the lines a save posted to then are still in its ledger.
 */
const EXPENSE_LINE: Record<string, string> = { food: 'Food', dues: 'Union Dues', health: 'Medical Care', tax: 'Tax Paid', career: 'Work Costs', school: 'School', documents: 'Documents And Their Fees' };
export const expenseFor = (category: string) => EXPENSE_LINE[category] ?? 'Other';

setPaymentHooks({ fromCurrent: payFromCurrent, owe, returned: (sim, person, amount) => chargeReturned(sim, person, amount) });

/**
 * Pays an amount out of checking, then the card; what's left is owed where
 * `owe` allows it. Returns whether all of it was paid or owed. With nothing
 * owed allowed and not enough to pay, nothing is spent at all.
 */
export function spend(sim: Simulation, person: Person, amount: Money, memo: string, category: string, owe = false): boolean {
  if (amount <= 0) return true;
  const card = cardOf(sim, person);
  // A debit card purchase goes into an overdraft only where the bank may pay it there.
  const overdraft = category !== 'food' || purchaseMayOverdraw(sim, person);
  if (!owe && canPay(sim, person, overdraft) < amount) return false;
  // In cash first, where that's how they pay for the day.
  if (category === 'food' && paymentsOf(person).everyday === 'cash') {
    const wallet = accountsOf(sim, person).find((a) => a.kind === 'cash');
    const inHand = Math.min(amount, Math.max(0, wallet?.balance ?? 0));
    if (wallet && inHand > 0) {
      sim.post({ memo, category, postings: [{ accountId: sim.nominalAccount('expense', 'Food').id, amount: inHand }, { accountId: wallet.id, amount: -inHand }] });
      if (inHand === amount) return true;
      return spend(sim, person, amount - inHand, memo, category, owe);
    }
  }
  const current = checkingOf(sim, person);
  const before = current?.balance ?? 0;
  const cardFree = cardRoom(person, card);
  // A debit card locked, lost or stolen buys nothing: the day's shopping goes
  // on the credit card or in cash, or isn't bought (`systems/security.ts`).
  if (category === 'food' && current?.plastic && (current.plastic.locked || current.plastic.stopped)) {
    const wallet = accountsOf(sim, person).find((a) => a.kind === 'cash');
    const inHand = Math.max(0, wallet?.balance ?? 0);
    if (cardFree + inHand < amount) return false;
    const onCredit = Math.min(amount, cardFree);
    const postings = [{ accountId: sim.nominalAccount('expense', 'Food').id, amount }];
    if (onCredit > 0 && card) postings.push({ accountId: card.id, amount: -onCredit });
    if (amount > onCredit && wallet) postings.push({ accountId: wallet.id, amount: -(amount - onCredit) });
    const txn = sim.post({ memo, category, postings });
    if (onCredit > 0 && card) hold(sim, txn, card);
    return true;
  }
  // On the credit card first where that's how they pay for the day, then the debit card.
  let creditFirst = category === 'food' && paymentsOf(person).everyday === 'credit' ? Math.min(amount, cardFree) : 0;
  // A French debit card past its payment ceiling declines: the credit card takes the day, or it isn't bought.
  const room = category === 'food' ? cardCeilingRoom(sim, person) : undefined;
  if (room !== undefined && amount - creditFirst > room) {
    if (cardFree < amount) return false;
    creditFirst = amount;
  }
  const bank = drawFromBank(sim, person, amount - creditFirst, overdraft);
  const fromCard = creditFirst + Math.min(bank.short, cardFree - creditFirst);
  const owed = bank.short - fromCard;
  const postings = [{ accountId: sim.nominalAccount('expense', expenseFor(category)).id, amount }, ...bank.postings];
  if (fromCard > 0 && card) postings.push({ accountId: card.id, amount: -fromCard });
  if (owed > 0) postings.push({ accountId: arrearsAccount(sim, person).id, amount: -owed });
  const txn = sim.post({ memo, category, postings });
  // A card purchase is authorized now and posts in the bank's days (A95).
  if (category === 'food') hold(sim, txn, bank.postings.length > 0 && current ? current : card ?? current!);
  // An item's fee is for one the bank paid below zero, not one the card took.
  // Until 2026-09-25 a purchase the card paid was charged one if the account
  // happened to be overdrawn already.
  if (current && current.balance < 0 && current.balance < before) chargeForItem(sim, person, before - current.balance);
  // A debit the bank couldn't pay went back unpaid first, where it charges
  // for that; a card purchase it can't pay is only declined.
  if (bank.short > 0 && category !== 'food') chargeReturned(sim, person, bank.short);
  if (category === 'food' && bank.postings.length > 0 && creditFirst < amount) {
    chargeForPurchase(sim, person);
    // The change to the next whole unit, into savings tonight, where the bank rounds up (B9).
    if (roundUpsOn(sim, person)) person.roundUps!.pending += roundUpOf(amount - creditFirst);
  }
  return true;
}

/**
 * Buys the day's food for the meals the day eats, at the day's start. False,
 * and nothing spent, when it can't be paid for. Somebody with no bank of
 * their own isn't charged: until 2026-10-09 that was somebody with no home.
 */
export function buyTheDaysFood(sim: Simulation, person: Person): boolean {
  if (!person.primaryAccountId) return true;
  let cost = foodOf(sim, person);
  // An EBT card's SNAP pays for groceries first, and for nothing else (`systems/assistance.ts`, from 2026-10-01).
  const ebtId = person.assistance?.ebtAccountId;
  const ebt = ebtId ? sim.universe.accounts[ebtId] : undefined;
  const fromEbt = ebt ? Math.min(cost, Math.max(0, ebt.balance)) : 0;
  if (ebt && fromEbt > 0) {
    sim.post({ memo: 'Groceries, on the EBT card', category: 'food', postings: [{ accountId: sim.nominalAccount('expense', 'Food').id, amount: fromEbt }, { accountId: ebt.id, amount: -fromEbt }] });
    cost -= fromEbt;
  }
  const bought = spend(sim, person, cost, 'Groceries', 'food');
  if (bought) person.fedOn = sim.now;
  if (!bought && person.id === sim.universe.playerId) {
    sim.notify({
      category: 'money',
      title: 'No Money For Food Today',
      body: `A day's groceries cost ${formatMoney(cost, saveCurrency(sim.universe))}, and there's nothing left to pay with. It's what's in the cupboard today, and not enough of it.`,
      importance: 70,
    });
  }
  return bought;
}

/**
 * Whether the day that starts at an instant had its food bought. A night
 * paid late eats the day's meals again after it (`creditNightAlone`), and
 * without asking this it fed somebody who couldn't pay for them.
 */
export function fedOn(person: Person, dayStart: Instant): boolean {
  return !person.primaryAccountId || person.fedOn === dayStart;
}

/** Pays back what's owed out of the bank, as far as it goes. */
function settleArrears(sim: Simulation, person: Person): void {
  const owed = arrearsOf(sim, person);
  if (owed <= 0) return;
  const bank = drawFromBank(sim, person, owed, false, true);
  const paid = owed - bank.short;
  if (paid <= 0) return;
  sim.post({
    memo: 'Paid back what was owed', category: 'arrears',
    postings: [{ accountId: arrearsAccount(sim, person).id, amount: paid }, ...bank.postings],
  });
}

/** A money trouble, and how much it comes to. Until 2026-10-09 what was owed was owed to the landlord. */
export type Trouble = { kind: 'owed' | 'overdrawn' | 'card' | 'card_behind' | 'medical' | 'collections' | 'tax' | 'return_late'; amount: Money; accountId?: string };

/**
 * What money is weighing on somebody with today: owing, the doctors, a
 * collector or the tax office, overdrawn, or the card at its limit. The day's
 * worry reads it (`inTrouble`), and so does Home. Until 2026-09-27 a medical
 * debt, a debt in collections and a tax balance unpaid weighed nothing, and
 * Home's All Clear read only the rent.
 */
export function troubles(sim: Simulation, person: Person): Trouble[] {
  const out: Trouble[] = [];
  const owed = arrearsOf(sim, person);
  if (owed > 0) out.push({ kind: 'owed', amount: owed });
  const current = checkingOf(sim, person)?.balance ?? 0;
  if (current < 0) out.push({ kind: 'overdrawn', amount: -current });
  // Every card: until 2026-09-28 a person held one.
  for (const card of person.credit ? cardsOf(sim, person) : []) {
    if ((card.creditLimit ?? 0) > 0 && -card.balance >= CARD_FULL * (card.creditLimit ?? 0)) out.push({ kind: 'card', amount: -card.balance });
    // Behind on it, or stopped for it: until 2026-09-27 a card two payments
    // behind and suspended counted as in order unless it was nearly full.
    const state = stateOf(person, card);
    if ((state.missed ?? 0) > 0 || state.suspended) out.push({ kind: 'card_behind', amount: Math.max(0, -card.balance), accountId: card.id });
  }
  for (const kind of ['medical', 'collections'] as const) {
    const debt = accountsOf(sim, person).filter((a) => a.category === kind && a.balance < 0).reduce((sum, a) => sum - a.balance, 0);
    if (debt > 0) out.push({ kind, amount: debt });
  }
  const tax = Object.values(person.returns ?? {}).reduce((sum, r) => sum + Math.max(0, r.owed ?? 0), 0);
  if (tax > 0) out.push({ kind: 'tax', amount: tax });
  // A return past its day with a balance, not filed, its penalty building:
  // until 2026-09-27 it counted for nothing until it was filed.
  const cur = saveCurrency(sim.universe);
  const late = Object.values(person.returns ?? {})
    .filter((r) => r.filedAt === undefined && r.figures.balance > 0 && sim.now > deadline(r.year))
    .reduce((sum, r) => sum + r.figures.balance + latePenalty(r.figures.balance, deadline(r.year), sim.now, cur), 0);
  if (late > 0) out.push({ kind: 'return_late', amount: late });
  return out;
}

/** Whether money is weighing on somebody today (`troubles`). */
export function inTrouble(sim: Simulation, person: Person): boolean {
  return troubles(sim, person).length > 0;
}

export function registerSpending(sim: Simulation): void {
  // Every day with the rollover: what's owed paid back where there's money to do it, and a day of owing felt.
  sim.onEvent('world.day_rollover', 'spending.day', (_event, { sim: s }) => {
    for (const person of Object.values(s.universe.people)) {
      if (!person.primaryAccountId) continue;
      settleArrears(s, person);
      if (!inTrouble(s, person)) continue;
      const w = person.wellbeing;
      w.stress = clamp(w.stress + WORRY_STRESS * personalityOf(person, 'stressGain'), 0, 100);
      w.morale = clamp(w.morale - WORRY_MORALE * personalityOf(person, 'moraleSwing'), 0, 100);
    }
  });
}
