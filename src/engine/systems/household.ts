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
 * Rent and bills fall due at eight in the evening on the first, after a
 * payday that falls that day: due at nine, they went on the card eight hours
 * before an Icelandic wage arrived.
 *
 * Money comes out of checking first, then the card while it has room. What
 * neither can cover: the rent and bills are owed to the landlord, and paid
 * off the first day there is money to pay them; the day's food is simply not
 * bought, and the meals it was for are not eaten, which the body feels.
 * Owing, or a card at its limit, weighs on somebody every day it lasts.
 *
 * Nobody is evicted. That is the next thing a landlord does, and it is not
 * modeled.
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

export const RENT_KIND = 'home.rent';

export type Housing = 'shared' | 'own';

export interface HomeState {
  kind: Housing;
  cityId: string;
  since: Instant;
  /** The start of the last day whose food was bought. */
  fedOn?: Instant;
}

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

/** The day's cost of owing, or of a card at its limit. */
const WORRY_STRESS = 4;
const WORRY_MORALE = 2;
const CARD_FULL = 0.9;

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
export function costsAt(cityId: string, kind: Housing, currency: string, at: Instant): LivingCosts {
  const city = CITIES.get(cityId);
  const rentFigure = rentAt(cityId, currency);
  if (!city) return { rent: 0, rentFigure, bills: 0, day: 0, meal: 0 };
  const rent = Math.round((kind === 'own' ? rentFigure.oneBed : rentFigure.room) / 100) * 100;
  const tax = 1 + salesTaxRate(cityId, at, 'groceries');
  return {
    rent,
    rentFigure,
    bills: atTown(cityId, HOUSING[kind].billsUsd, currency),
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

/** What checking and the card can pay between them, now. */
export function canPay(sim: Simulation, person: Person): Money {
  const checking = checkingOf(sim, person);
  const card = cardOf(sim, person);
  const free = card ? Math.max(0, (card.creditLimit ?? 0) + card.balance) : 0;
  return Math.max(0, checking?.balance ?? 0) + free;
}

/**
 * Pays an amount out of checking, then the card; what's left is owed to the
 * landlord where `owe` allows it. Returns whether all of it was paid or owed.
 * With nothing owed allowed and not enough to pay, nothing is spent at all.
 */
export function spend(sim: Simulation, person: Person, amount: Money, memo: string, category: string, owe = false): boolean {
  if (amount <= 0) return true;
  const checking = checkingOf(sim, person);
  const card = cardOf(sim, person);
  if (!owe && canPay(sim, person) < amount) return false;
  const fromChecking = Math.min(amount, Math.max(0, checking?.balance ?? 0));
  const cardFree = card ? Math.max(0, (card.creditLimit ?? 0) + card.balance) : 0;
  const fromCard = Math.min(amount - fromChecking, cardFree);
  const owed = amount - fromChecking - fromCard;
  const postings = [{ accountId: sim.nominalAccount('expense', category === 'rent' ? 'Rent' : category === 'bills' ? 'Bills' : 'Food').id, amount }];
  if (fromChecking > 0 && checking) postings.push({ accountId: checking.id, amount: -fromChecking });
  if (fromCard > 0 && card) postings.push({ accountId: card.id, amount: -fromCard });
  if (owed > 0) postings.push({ accountId: arrearsAccount(sim, person).id, amount: -owed });
  sim.post({ memo, category, postings });
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

/** Pays the landlord back out of checking, as far as it goes. */
function settleArrears(sim: Simulation, person: Person): void {
  const owed = arrearsOf(sim, person);
  const checking = checkingOf(sim, person);
  if (owed <= 0 || !checking || checking.balance <= 0) return;
  const paid = Math.min(owed, checking.balance);
  sim.post({
    memo: 'Paid the landlord back', category: 'rent',
    postings: [{ accountId: arrearsAccount(sim, person).id, amount: paid }, { accountId: checking.id, amount: -paid }],
  });
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
    spend(s, person, rent, 'Rent', 'rent', true);
    spend(s, person, bills, 'Bills', 'bills', true);
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
      if (!inTrouble(s, person)) continue;
      const w = person.wellbeing;
      w.stress = clamp(w.stress + WORRY_STRESS * personalityOf(person, 'stressGain'), 0, 100);
      w.morale = clamp(w.morale - WORRY_MORALE * personalityOf(person, 'moraleSwing'), 0, 100);
    }
  });
}

/** Moves them into a home in the town they are in, with the first of the month's rent due. */
export function moveIn(sim: Simulation, person: Person, kind: Housing): void {
  person.home = { kind, cityId: person.currentLocationId, since: sim.now };
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
