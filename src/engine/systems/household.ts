/**
 * SLATE — what it costs to live where you live.
 *
 * Nothing spent money until this: the balances a save started with were the
 * balances it kept. Now a home costs rent and bills on the first of the
 * month, and every day's food is bought with the day's meals. Rent is the
 * town's, published where it is and calibrated or estimated where it isn't
 * (`content/rents.ts`), for a one-bedroom or a room in a shared flat; food
 * and bills are SLATE's estimates of what a person spends, at the town's cost
 * of living, with the town's sales tax on food.
 *
 * Rent and bills fall due at eight in the evening on the first. It was set
 * after the day job's payday that fell that day: due at nine, they went on
 * the card eight hours before an Icelandic wage arrived. The payday went with
 * the job engine on 2026-09-26, and the hour stayed.
 *
 * Each is paid the way the character pays it (`systems/payments.ts`): rent
 * and bills from the current account on the day, with its overdraft and any
 * savings linked to it, or by check, or on the card for the bills, or by hand;
 * the day's food on the debit card or the credit card. Until 2026-09-26 every
 * payment fell through checking, then savings, then the card, and a landlord
 * was paid by credit card whenever the bank ran short. A payment the account
 * can't make goes back unpaid, with the bank's fee, and the rent and bills are
 * owed to the landlord, paid off the first day there is money to pay them; the
 * day's food isn't bought, and the day is eaten thin (`eatWhatThereIs` in
 * `systems/life.ts`).
 * Owing, or a card at its limit, weighs on somebody every day it lasts.
 *
 * Owing two months' rent brings a notice to pay or quit: thirty days to get
 * it under a month's. Still over it then, and they're evicted: the deposit
 * goes to the landlord against what's owed, the record takes it, and they
 * sleep on a friend's sofa, which costs no rent and sleeps badly, until they
 * can pay a deposit and a first month somewhere. Nobody was evicted until
 * this; owing only weighed on them, however long it ran.
 *
 * Moving costs what it costs a real tenant: a deposit, a month's rent or two
 * where the record is poor (the landlord's credit check), and the rest of
 * this month's rent, all from the bank, since a landlord doesn't take a card.
 * The old deposit comes back, less anything still owed. Somebody who already
 * lives somewhere when the story starts paid a month's deposit on it once, and
 * the landlord holds it (`moveIn`): the eviction notice spoke of a deposit
 * nobody had paid.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Account } from '../core/ledger';
import { CITIES } from '../content/geography';
import { exchange } from '../content/currency';
import { salesTaxRate } from '../content/tax';
import { rentAt, type RentFigure } from '../content/rents';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { instantFromZoned, zonedParts, type Instant } from '../core/time';
import { clamp } from '../core/rng';
import { personalityOf } from './personality';
import { chargeForItem, chargeForPurchase, chargeReturned, overdraftHeadroom, purchaseMayOverdraw } from './lending';
import { paymentsOf, setPaymentHooks, writeCheck } from './payments';
import { cardRoom } from './credit';
import { roundUpOf, roundUpsOn } from './accountlife';
import { CommandError } from '../core/simulation';

export const RENT_KIND = 'home.rent';

export type Housing = 'shared' | 'own';
/** Where somebody sleeps: a home they rent, or a friend's sofa after an eviction. */
export type HomeKind = Housing | 'sofa';

export interface HomeState {
  kind: HomeKind;
  cityId: string;
  since: Instant;
  /** The start of the last day whose food was bought. */
  fedOn?: Instant;
  /** The end of a notice to pay or quit, while one stands. */
  noticeUntil?: Instant;
}

/** What a friend's sofa is, for the screens. */
export const SOFA = { label: 'A Friend’s Sofa', note: 'No rent, and no bed of your own. Nights on it sleep badly.' };

export const HOUSING: Readonly<Record<Housing, { label: string; billsUsd: number; note: string }>> = {
  shared: {
    label: 'A Room In A Shared Flat', billsUsd: 90,
    note: 'How most actors starting out live: a room at what rooms rent for here, and the bills split.',
  },
  own: {
    label: 'A Place Of Your Own', billsUsd: 180,
    note: 'A one-bedroom to yourself, and every bill yours.',
  },
};

/** A day's groceries and a cooked meal, in US dollars at the American average cost of living. SLATE's estimates. */
const DAY_OF_FOOD_USD = 8;
const MEAL_USD = 4;

/** The day's cost of owing, or of a card at its limit, and of having no home. */
const WORRY_STRESS = 4;
const WORRY_MORALE = 2;
const CARD_FULL = 0.9;
const HOMELESS_STRESS = 2;
/** Owing this many months' rent brings a notice, and the notice runs this long. */
const NOTICE_AT_MONTHS = 2;
const NOTICE_DAYS = 30;
/** Where the landlord's credit check asks for two months' deposit rather than one. */
const POOR_RECORD = 620;
const EVICTION_ON_RECORD = 60;

/** An amount the atlas prices in US dollars at a town's cost of living, in a currency, to the whole unit. */
function atTown(cityId: string, usd: number, currency: string): Money {
  const city = CITIES.get(cityId);
  const cents = Math.round(usd * 100 * (city ? city.costOfLivingIndex / 100 : 1));
  const local = exchange(cents, 'USD', currency) ?? cents;
  return Math.round(local / 100) * 100;
}

export interface LivingCosts {
  /** A month's rent and a month's bills. */
  rent: Money;
  /** Where the rent comes from (`content/rents.ts`). */
  rentFigure: RentFigure;
  bills: Money;
  /** A day's groceries, and a cooked meal, both with the town's sales tax on food. */
  day: Money;
  meal: Money;
}

/** What a home of a kind costs in a town at a date, in a currency: the one sum the game and the screens both read. */
export function costsAt(cityId: string, kind: HomeKind, currency: string, at: Instant): LivingCosts {
  const city = CITIES.get(cityId);
  const rentFigure = rentAt(cityId, currency);
  if (!city) return { rent: 0, rentFigure, bills: 0, day: 0, meal: 0 };
  const rent = kind === 'sofa' ? 0 : Math.round((kind === 'own' ? rentFigure.oneBed : rentFigure.room) / 100) * 100;
  const tax = 1 + salesTaxRate(cityId, at, 'groceries');
  return {
    rent,
    rentFigure,
    bills: kind === 'sofa' ? 0 : atTown(cityId, HOUSING[kind].billsUsd, currency),
    day: Math.round(atTown(cityId, DAY_OF_FOOD_USD, currency) * tax),
    meal: Math.round(atTown(cityId, MEAL_USD, currency) * tax),
  };
}

const costsOf = (sim: Simulation, person: Person): LivingCosts | undefined =>
  person.home ? costsAt(person.home.cityId, person.home.kind, saveCurrency(sim.universe), sim.now) : undefined;

/** The month's rent where they live. */
export function rentOf(sim: Simulation, person: Person): Money {
  return costsOf(sim, person)?.rent ?? 0;
}

/** The month's bills: power, heat, phone, internet and getting about. */
export function billsOf(sim: Simulation, person: Person): Money {
  return costsOf(sim, person)?.bills ?? 0;
}

/**
 * A day's groceries, and a meal cooked at home, as this person buys them:
 * a frugal one spends less on the same day than a spender does
 * (`spending`, from the money traits). Rent and bills are what they are.
 */
export function foodOf(sim: Simulation, person: Person): Money {
  return Math.round((costsOf(sim, person)?.day ?? 0) * personalityOf(person, 'spending'));
}

export function mealOf(sim: Simulation, person: Person): Money {
  return Math.round((costsOf(sim, person)?.meal ?? 0) * personalityOf(person, 'spending'));
}

const accountsOf = (sim: Simulation, person: Person) =>
  Object.values(sim.universe.accounts).filter((a) => a.ownerId === person.id && !a.nominal && !a.closedAt);

function checkingOf(sim: Simulation, person: Person): Account | undefined {
  return person.primaryAccountId ? sim.universe.accounts[person.primaryAccountId] : undefined;
}

function cardOf(sim: Simulation, person: Person): Account | undefined {
  return accountsOf(sim, person).find((a) => a.kind === 'credit_card');
}

/** What owed rent and bills stand at, as a positive amount. */
export function arrearsOf(sim: Simulation, person: Person): Money {
  const owed = accountsOf(sim, person).find((a) => a.kind === 'loan' && a.category === 'arrears');
  return owed ? Math.max(0, -owed.balance) : 0;
}

function arrearsAccount(sim: Simulation, person: Person): Account {
  const found = accountsOf(sim, person).find((a) => a.kind === 'loan' && a.category === 'arrears');
  if (found) return found;
  return sim.openAccount({
    id: sim.nextId('account'), kind: 'loan', name: 'Rent And Bills Owed', ownerId: person.id,
    institution: 'Your Landlord', openedAt: sim.now, category: 'arrears', apr: 0,
  });
}

/** Easy-access savings: a term deposit is locked until its end. */
function savingsOf(sim: Simulation, person: Person): Account | undefined {
  return accountsOf(sim, person).find((a) => a.kind === 'savings' && a.category !== 'term');
}

/** What checking and savings hold between them, now. */
export function inTheBank(sim: Simulation, person: Person): Money {
  return Math.max(0, checkingOf(sim, person)?.balance ?? 0) + Math.max(0, savingsOf(sim, person)?.balance ?? 0);
}

/** What a payment from the current account can reach: the account, and savings where it's linked to it. */
function reachable(sim: Simulation, person: Person): Money {
  return Math.max(0, checkingOf(sim, person)?.balance ?? 0) + (paymentsOf(person).linkSavings ? Math.max(0, savingsOf(sim, person)?.balance ?? 0) : 0);
}

/**
 * The postings that take an amount out of checking, then savings, as far as
 * they go, then, where asked, the current account's overdraft
 * (`systems/lending.ts`), and what's left.
 */
export function drawFromBank(sim: Simulation, person: Person, amount: Money, withOverdraft = false, fromSavings = paymentsOf(person).linkSavings): { postings: { accountId: string; amount: Money }[]; short: Money } {
  const postings: { accountId: string; amount: Money }[] = [];
  let left = amount;
  for (const account of [checkingOf(sim, person), fromSavings ? savingsOf(sim, person) : undefined]) {
    if (!account || left <= 0) continue;
    const take = Math.min(left, Math.max(0, account.balance));
    if (take > 0) {
      postings.push({ accountId: account.id, amount: -take });
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
  return reachable(sim, person) + (overdraft ? overdraftHeadroom(sim, person) : 0) + free;
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
  if (current && current.balance < 0 && current.balance < before) chargeForItem(sim, person);
  return true;
}

/** Owes an amount to the landlord, for what went unpaid. */
function owe(sim: Simulation, person: Person, amount: Money, memo: string, category: string): void {
  if (amount <= 0) return;
  sim.post({ memo: `${memo}, unpaid`, category, postings: [{ accountId: sim.nominalAccount('expense', expenseFor(category)).id, amount }, { accountId: arrearsAccount(sim, person).id, amount: -amount }] });
}

const expenseFor = (category: string) => (category === 'rent' ? 'Rent' : category === 'bills' ? 'Bills' : 'Food');

setPaymentHooks({ fromCurrent: payFromCurrent, owe, returned: (sim, person, amount) => chargeReturned(sim, person, amount) });

/** On the card, if it has room, as a recurring card payment. True if it went. */
function onCard(sim: Simulation, person: Person, amount: Money, memo: string, category: string): boolean {
  const card = cardOf(sim, person);
  if (!card || cardRoom(person, card) < amount) return false;
  sim.post({ memo, category, postings: [{ accountId: sim.nominalAccount('expense', expenseFor(category)).id, amount }, { accountId: card.id, amount: -amount }] });
  return true;
}

/** The month's rent, the way it's paid. */
function payRent(sim: Simulation, person: Person, rent: Money): void {
  const pay = paymentsOf(person);
  if (pay.rent === 'check') { writeCheck(sim, person, rent, 'Rent', 'rent'); return; }
  if (pay.rent === 'manual') {
    // What they paid ahead goes against it, and the rest is owed.
    const ahead = Math.min(pay.rentCredit ?? 0, rent);
    if (ahead > 0 && person.payments) person.payments.rentCredit = (pay.rentCredit ?? 0) - ahead;
    if (ahead > 0) sim.post({ memo: 'Rent, paid ahead', category: 'rent', postings: [{ accountId: sim.nominalAccount('expense', 'Rent').id, amount: ahead }, { accountId: sim.nominalAccount('liability_other', 'Rent Paid Ahead').id, amount: -ahead }] });
    owe(sim, person, rent - ahead, 'Rent', 'rent');
    return;
  }
  if (payFromCurrent(sim, person, rent, 'Rent', 'rent')) return;
  chargeReturned(sim, person, rent);
  owe(sim, person, rent, 'Rent', 'rent');
}

/** The month's bills, the way they're paid. */
function payBills(sim: Simulation, person: Person, bills: Money): void {
  const pay = paymentsOf(person);
  if (pay.bills === 'manual') { owe(sim, person, bills, 'Bills', 'bills'); return; }
  if (pay.bills === 'card') {
    if (!onCard(sim, person, bills, 'Bills', 'bills')) owe(sim, person, bills, 'Bills', 'bills');
    return;
  }
  if (payFromCurrent(sim, person, bills, 'Bills', 'bills')) return;
  chargeReturned(sim, person, bills);
  owe(sim, person, bills, 'Bills', 'bills');
}

/**
 * Pays an amount out of checking, then the card; what's left is owed to the
 * landlord where `owe` allows it. Returns whether all of it was paid or owed.
 * With nothing owed allowed and not enough to pay, nothing is spent at all.
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
  // On the credit card first where that's how they pay for the day, then the debit card.
  const cardFree = cardRoom(person, card);
  const creditFirst = category === 'food' && paymentsOf(person).everyday === 'credit' ? Math.min(amount, cardFree) : 0;
  const bank = drawFromBank(sim, person, amount - creditFirst, overdraft);
  const fromCard = creditFirst + Math.min(bank.short, cardFree - creditFirst);
  const owed = bank.short - fromCard;
  const postings = [{ accountId: sim.nominalAccount('expense', category === 'rent' ? 'Rent' : category === 'bills' ? 'Bills' : 'Food').id, amount }, ...bank.postings];
  if (fromCard > 0 && card) postings.push({ accountId: card.id, amount: -fromCard });
  if (owed > 0) postings.push({ accountId: arrearsAccount(sim, person).id, amount: -owed });
  sim.post({ memo, category, postings });
  // An item's fee is for one the bank paid below zero, not one the card took.
  // Until 2026-09-25 a purchase the card paid was charged one if the account
  // happened to be overdrawn already.
  if (current && current.balance < 0 && current.balance < before) chargeForItem(sim, person);
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
 * and nothing spent, when it can't be paid for.
 */
export function buyTheDaysFood(sim: Simulation, person: Person): boolean {
  if (!person.home) return true;
  const cost = foodOf(sim, person);
  const bought = spend(sim, person, cost, 'Groceries', 'food');
  if (bought) person.home.fedOn = sim.now;
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
  return !person.home || person.home.fedOn === dayStart;
}

/** Pays the landlord back out of the bank, as far as it goes. */
function settleArrears(sim: Simulation, person: Person): void {
  const owed = arrearsOf(sim, person);
  if (owed <= 0) return;
  // Paid by hand where rent is: they pay the landlord themselves.
  if (paymentsOf(person).rent === 'manual') return;
  const bank = drawFromBank(sim, person, owed, false, true);
  const paid = owed - bank.short;
  if (paid <= 0) return;
  sim.post({
    memo: 'Paid the landlord back', category: 'rent',
    postings: [{ accountId: arrearsAccount(sim, person).id, amount: paid }, ...bank.postings],
  });
}

function depositAccount(sim: Simulation, person: Person): Account | undefined {
  return accountsOf(sim, person).find((a) => a.kind === 'escrow' && a.category === 'deposit');
}

/**
 * The deposit a landlord asks here: a month's rent, or two for a record under
 * 620. Britain caps a deposit at five weeks' rent in law (the Tenant Fees Act
 * 2019), so it is never more than that there.
 */
export function depositFor(sim: Simulation, person: Person, kind: Housing): Money {
  const rent = costsAt(person.currentLocationId, kind, saveCurrency(sim.universe), sim.now).rent;
  const months = (person.credit?.score ?? 650) < POOR_RECORD ? 2 : 1;
  const country = CITIES.get(person.currentLocationId)?.countryId;
  const cap = country === 'uk' || country === 'gb' ? Math.round(rent * 12 / 52 * 5) : Number.POSITIVE_INFINITY;
  return Math.min(rent * months, cap);
}

/** The rest of this month's rent, from today, for somebody moving in. */
function restOfMonth(sim: Simulation, person: Person, kind: Housing): Money {
  const zone = CITIES.get(person.currentLocationId)?.timeZone ?? sim.homeZone;
  const p = zonedParts(sim.now, zone);
  const days = new Date(Date.UTC(p.year, p.month, 0)).getUTCDate();
  const rent = costsAt(person.currentLocationId, kind, saveCurrency(sim.universe), sim.now).rent;
  return Math.round(rent * (days - p.day + 1) / days);
}

/** What moving into a home of a kind costs today: the deposit and the rest of the month. */
export function moveCost(sim: Simulation, person: Person, kind: Housing): Money {
  return depositFor(sim, person, kind) + restOfMonth(sim, person, kind);
}

/**
 * Moves them into a home of a kind here, paying the deposit and the rest of
 * the month from checking, and taking back the old deposit less what's owed.
 * Throws the reason when it can't be done.
 */
export function move(sim: Simulation, person: Person, kind: Housing): void {
  const checking = checkingOf(sim, person);
  if (!checking) throw new CommandError('You don’t have an account to pay from.');
  if (person.home && person.home.kind === kind && person.home.cityId === person.currentLocationId) {
    throw new CommandError('You live in one already.');
  }
  // The old deposit back first, less what's still owed on the old place.
  const old = depositAccount(sim, person);
  if (old && old.balance > 0) {
    const owed = Math.min(old.balance, arrearsOf(sim, person));
    const postings = [{ accountId: old.id, amount: -old.balance }, { accountId: checking.id, amount: old.balance - owed }];
    if (owed > 0) postings.push({ accountId: arrearsAccount(sim, person).id, amount: owed });
    sim.post({ memo: 'Deposit back', category: 'rent', postings });
  }
  const deposit = depositFor(sim, person, kind);
  const rest = restOfMonth(sim, person, kind);
  if (inTheBank(sim, person) < deposit + rest) {
    const currency = saveCurrency(sim.universe);
    throw new CommandError(`Moving in takes ${formatMoney(deposit + rest, currency)} from the bank: a ${formatMoney(deposit, currency)} deposit and ${formatMoney(rest, currency)} for the rest of the month.`);
  }
  const held = depositAccount(sim, person) ?? sim.openAccount({
    id: sim.nextId('account'), kind: 'escrow', name: 'Deposit Held', ownerId: person.id,
    institution: 'Your Landlord', openedAt: sim.now, category: 'deposit',
  });
  sim.post({
    memo: 'Deposit and the rest of the month', category: 'rent',
    postings: [
      ...drawFromBank(sim, person, deposit + rest, false, true).postings,
      { accountId: held.id, amount: deposit },
      { accountId: sim.nominalAccount('expense', 'Rent').id, amount: rest },
    ],
  });
  const hadRent = sim.universe.scheduled.some((one) => one.kind === RENT_KIND && one.status === 'pending' && one.payload.personId === person.id);
  person.home = { kind, cityId: person.currentLocationId, since: sim.now, ...(person.home?.fedOn !== undefined ? { fedOn: person.home.fedOn } : {}) };
  if (!hadRent) scheduleRent(sim, person, sim.now);
}

/** Evicted: the deposit goes against what's owed, the record takes it, and it's a friend's sofa. */
function evict(sim: Simulation, person: Person): void {
  const held = depositAccount(sim, person);
  if (held && held.balance > 0) {
    const against = Math.min(held.balance, arrearsOf(sim, person));
    const postings = [{ accountId: held.id, amount: -held.balance }, { accountId: arrearsAccount(sim, person).id, amount: against }];
    if (held.balance > against) postings.push({ accountId: checkingOf(sim, person)!.id, amount: held.balance - against });
    sim.post({ memo: 'Deposit kept against rent owed', category: 'rent', postings });
  }
  if (person.credit) person.credit.score = Math.max(300, person.credit.score - EVICTION_ON_RECORD);
  person.home = { kind: 'sofa', cityId: person.home?.cityId ?? person.currentLocationId, since: sim.now };
  if (person.id === sim.universe.playerId) {
    sim.notify({
      category: 'money',
      title: 'Evicted',
      body: 'The notice ran out with the rent still owed. Your deposit went against it, it\'s on your record, and you\'re on a friend\'s sofa until you can pay a deposit and a first month somewhere.',
      importance: 95,
    });
  }
}

/** A notice to pay or quit, when two months' rent is owed; withdrawn once it's under one; eviction when it runs out. */
function landlord(sim: Simulation, person: Person): void {
  const home = person.home;
  if (!home || home.kind === 'sofa') return;
  const rent = rentOf(sim, person);
  const owed = arrearsOf(sim, person);
  const currency = saveCurrency(sim.universe);
  if (home.noticeUntil === undefined) {
    if (rent > 0 && owed >= rent * NOTICE_AT_MONTHS) {
      home.noticeUntil = sim.now + NOTICE_DAYS * 86_400_000;
      if (person.id === sim.universe.playerId) {
        sim.notify({
          category: 'money',
          title: 'A Notice To Pay Or Quit',
          body: `You owe your landlord ${formatMoney(owed, currency)}, two months' rent. Get it under ${formatMoney(rent, currency)} within thirty days, or you're out.`,
          importance: 95,
        });
      }
    }
    return;
  }
  if (owed < rent) {
    delete home.noticeUntil;
    if (person.id === sim.universe.playerId) {
      sim.notify({ category: 'money', title: 'The Notice Is Withdrawn', body: 'You got what you owe under a month\'s rent. The home is yours.', importance: 60 });
    }
    return;
  }
  if (sim.now >= home.noticeUntil) evict(sim, person);
}

/** Whether money is weighing on somebody today: owing, overdrawn, or the card at its limit. */
export function inTrouble(sim: Simulation, person: Person): boolean {
  if (arrearsOf(sim, person) > 0) return true;
  if ((checkingOf(sim, person)?.balance ?? 0) < 0) return true;
  const card = cardOf(sim, person);
  return Boolean(card && (card.creditLimit ?? 0) > 0 && -card.balance >= CARD_FULL * (card.creditLimit ?? 0));
}

function scheduleRent(sim: Simulation, person: Person, after: Instant): void {
  const zone = CITIES.get(person.home?.cityId ?? person.currentLocationId)?.timeZone ?? sim.homeZone;
  const p = zonedParts(after, zone);
  const thisMonth = instantFromZoned({ year: p.year, month: p.month, day: 1, hour: 20 }, zone);
  const next = thisMonth > after ? thisMonth
    : instantFromZoned({ year: p.month === 12 ? p.year + 1 : p.year, month: p.month === 12 ? 1 : p.month + 1, day: 1, hour: 20 }, zone);
  sim.schedule({ at: next, kind: RENT_KIND, label: 'Rent And Bills', category: 'home', priority: 35, payload: { personId: person.id } });
}

export function registerHousehold(sim: Simulation): void {
  sim.onSchedule(RENT_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId ?? s.universe.playerId)];
    if (!person?.home) return;
    const currency = saveCurrency(s.universe);
    const rent = rentOf(s, person);
    const bills = billsOf(s, person);
    const before = arrearsOf(s, person);
    payRent(s, person, rent);
    payBills(s, person, bills);
    const owed = arrearsOf(s, person) - before;
    if (owed > 0) {
      s.notify({
        category: 'money',
        title: 'Rent You Couldn’t Pay',
        body: `${formatMoney(owed, currency)} of this month's ${formatMoney(rent + bills, currency)} is owed to your landlord. It comes out of the first money that comes in.`,
        importance: 85,
      });
    }
    scheduleRent(s, person, item.at);
  });

  // Every day with the rollover: the landlord paid back where there's money
  // to do it, and a day of owing felt.
  sim.onEvent('world.day_rollover', 'household.day', (_event, { sim: s }) => {
    for (const person of Object.values(s.universe.people)) {
      if (!person.home) continue;
      settleArrears(s, person);
      landlord(s, person);
      const w = person.wellbeing;
      // On the sofa, the day weighs too, and somebody left to their own life
      // takes a room as soon as the deposit and a month are there, with a
      // month's food behind them.
      if (person.home.kind === 'sofa') {
        w.stress = clamp(w.stress + HOMELESS_STRESS * personalityOf(person, 'stressGain'), 0, 100);
        const buffer = foodOf(s, person) * 30;
        if (inTheBank(s, person) >= moveCost(s, person, 'shared') + buffer) {
          move(s, person, 'shared');
          if (person.id === s.universe.playerId) {
            s.notify({ category: 'money', title: 'You Found A Room', body: 'You took a room as soon as you could pay for it: the deposit and the rest of the month are paid. Off the sofa.', importance: 70 });
          }
        }
      }
      if (!inTrouble(s, person)) continue;
      w.stress = clamp(w.stress + WORRY_STRESS * personalityOf(person, 'stressGain'), 0, 100);
      w.morale = clamp(w.morale - WORRY_MORALE * personalityOf(person, 'moraleSwing'), 0, 100);
    }
  });

  // Paying the landlord by hand (A62, A69): what's owed first, then rent ahead.
  sim.onCommand<{ amount: Money }, { paid: Money }>('home.pay_landlord', (p, { sim: s }) => {
    const person = s.player;
    if (!person.home || person.home.kind === 'sofa') throw new CommandError('You have no landlord to pay.');
    const amount = Math.round(Number(p.amount));
    if (!(amount > 0)) throw new CommandError('Say how much.');
    const current = checkingOf(s, person);
    if (!current || current.balance < amount) throw new CommandError(`${current?.name ?? 'Your current account'} holds ${formatMoney(Math.max(0, current?.balance ?? 0), saveCurrency(s.universe))}.`);
    const toArrears = Math.min(amount, arrearsOf(s, person));
    const ahead = amount - toArrears;
    const postings = [{ accountId: current.id, amount: -amount }];
    if (toArrears > 0) postings.push({ accountId: arrearsAccount(s, person).id, amount: toArrears });
    if (ahead > 0) postings.push({ accountId: s.nominalAccount('liability_other', 'Rent Paid Ahead').id, amount: ahead });
    s.post({ memo: 'Paid the landlord', category: 'rent', postings });
    if (ahead > 0) {
      person.payments = { ...paymentsOf(person), rentCredit: (paymentsOf(person).rentCredit ?? 0) + ahead };
    }
    return { paid: amount };
  });

  sim.onCommand<{ kind: Housing }, { kind: Housing }>('home.move', (p, { sim: s }) => {
    if (p.kind !== 'shared' && p.kind !== 'own') throw new CommandError('A room in a shared flat, or a place of your own.');
    move(s, s.player, p.kind);
    return { kind: p.kind };
  });
}

/**
 * Moves them into a home in the town they are in, with the first of the
 * month's rent due, and the month's deposit they paid on it once held by the
 * landlord, theirs, out of the opening balances.
 */
export function moveIn(sim: Simulation, person: Person, kind: Housing): void {
  person.home = { kind, cityId: person.currentLocationId, since: sim.now };
  const rent = rentOf(sim, person);
  if (rent > 0) {
    sim.openAccount({
      id: sim.nextId('account'), kind: 'escrow', name: 'Deposit Held', ownerId: person.id,
      institution: 'Your Landlord', openedAt: sim.now, category: 'deposit', balance: rent,
    });
  }
  scheduleRent(sim, person, sim.now);
}

/** A rent due for everybody with a home, where none is. */
export function armHousehold(sim: Simulation): void {
  for (const person of Object.values(sim.universe.people)) {
    if (!person.home) continue;
    const due = sim.universe.scheduled.some((one) => one.kind === RENT_KIND && one.status === 'pending'
      && one.payload.personId === person.id);
    if (!due) scheduleRent(sim, person, sim.now);
  }
}
