/**
 * SLATE — the bank.
 *
 * Every save opened its accounts at "Northbank", a bank that doesn't exist,
 * whatever the country, and an account there did nothing but hold a number:
 * savings earned nothing, the account cost nothing, and money couldn't be
 * moved from one account to another. Now a person banks with a real bank in
 * the country they live in (`content/banks.ts`), under that bank's own
 * account names, with a number in the country's own format and real check
 * digits (`systems/banknumber.ts`), and the bank does what that bank does:
 *
 * - **Interest.** A savings account earns the bank's published rate where it
 *   publishes one, and the table's estimate where it doesn't; the screen says
 *   which. It builds day by day on what the account holds at the end of each
 *   day and is paid on the last day of the month, less any tax the country
 *   has the bank take first.
 * - **The monthly fee.** A current account that charges one charges it on the
 *   last day of the month, unless the month met the bank's own waiver: wages
 *   paid in by direct deposit, or a balance kept above a line all month.
 * - **Moving money.** Between one's own accounts, at once, as a bank's app
 *   does it (`bank.transfer`), and a savings account opened or closed
 *   (`bank.open_savings`, `bank.close_savings`).
 *
 * Money still leaves in the order `systems/household.ts` takes it: the
 * current account, then savings, then the card.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Account } from '../core/ledger';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import type { Person } from '../domain/model';
import { CITIES, COUNTRIES } from '../content/geography';
import { exchange } from '../content/currency';
import { dateKey, daysInMonth, instantFromZoned, zonedParts, type Instant } from '../core/time';
import { bankById, bankingIn, banksIn, type Bank, type Product } from '../content/banks';
import { ageOn } from './mortality';
import { hourlyWage, jobOf } from './work';
import { patternHours, patternOf } from '../content/jobs';
import { accountNumber } from './banknumber';

export const MONTH_END_KIND = 'bank.month_end';

/** A current account or an easy-access savings account: not a term deposit, not a loan. */
export function isEveryday(account: Account): boolean {
  return (account.kind === 'checking' || account.kind === 'savings') && account.category !== 'term';
}

/** A person's open current and savings accounts. */
export function bankAccountsOf(sim: Simulation, person: Person): Account[] {
  return Object.values(sim.universe.accounts).filter(
    (a) => a.ownerId === person.id && !a.nominal && !a.closedAt && isEveryday(a),
  );
}

/** The bank a person keeps their current account with. */
export function bankOf(sim: Simulation, person: Person): Bank | undefined {
  const current = person.primaryAccountId ? sim.universe.accounts[person.primaryAccountId] : undefined;
  return current?.bankId ? bankById(current.bankId) : undefined;
}

/** A town's country as ISO 3166 alpha-2. */
export function isoOf(cityId: string): string | undefined {
  const city = CITIES.get(cityId);
  return city ? COUNTRIES.get(city.countryId)?.iso2?.toUpperCase() : undefined;
}

/** The banks a new life in a town can choose from. */
export function banksFor(cityId: string): readonly Bank[] {
  const iso = isoOf(cityId);
  return iso ? banksIn(iso) : [];
}

/** The bank a new life starts with: the one chosen, or the country's first. */
export function startingBank(cityId: string, chosen?: string): Bank | undefined {
  const banks = banksFor(cityId);
  return banks.find((b) => b.id === chosen) ?? banks[0];
}

/** An amount in a bank's currency, in the save's money. */
export function inSaveMoney(sim: Simulation, amount: Money, currency: string): Money {
  const into = saveCurrency(sim.universe);
  if (currency === into) return amount;
  return exchange(amount, currency, into) ?? amount;
}

/**
 * Opens a current account, and savings when there's money to put in it, at a
 * bank: the first thing a new life does with money.
 */
export function openAt(sim: Simulation, person: Person, bank: Bank, balances: { checking: Money; savings: Money }): void {
  const current = openOne(sim, person, bank, 'checking', balances.checking);
  person.primaryAccountId = current.id;
  if (balances.savings > 0) openOne(sim, person, bank, 'savings', balances.savings);
}

function openOne(sim: Simulation, person: Person, bank: Bank, kind: 'checking' | 'savings', balance: Money): Account {
  const product = kind === 'checking' ? bank.current : bank.savings;
  const number = accountNumber(sim, person, bank, kind);
  return sim.openAccount({
    id: sim.nextId('account'),
    kind,
    name: product.name,
    ownerId: person.id,
    institution: bank.name,
    bankId: bank.id,
    number,
    last4: number.replace(/\D/g, '').slice(-4),
    openedAt: sim.now,
    balance,
    monthOpen: balance,
  });
}

/** The product an account is at its bank. */
export function productOf(account: Account): Product | undefined {
  const bank = account.bankId ? bankById(account.bankId) : undefined;
  if (!bank) return undefined;
  return account.kind === 'savings' ? bank.savings : bank.current;
}

/** What an account's product pays a year on a day, with any change the bank announced for it. */
export function rateOn(product: Product | undefined, at: Instant, zone = 'UTC'): number {
  if (!product) return 0;
  let rate = product.rate ?? 0;
  const day = dateKey(at, zone);
  for (const change of product.changes ?? []) if (day >= change.from) rate = change.rate;
  return rate;
}

/**
 * What an account pays a year now: its introductory step while one runs,
 * counted in whole months from the day it opened, and the product's own
 * rate, with any change announced, after.
 */
export function rateOf(sim: Simulation, account: Account): number {
  const product = productOf(account);
  const step = introStep(sim, product, account.openedAt, sim.now);
  return step ?? rateOn(product, sim.now, sim.homeZone);
}

/** The rate a tiered account pays on a balance, where the balance reaches a tier. */
export function tierRate(product: Product | undefined, account: Account, balance: Money): number | undefined {
  const bank = account.bankId ? bankById(account.bankId) : undefined;
  if (!product?.tiers || !bank) return undefined;
  let rate: number | undefined;
  for (const tier of product.tiers) if (balance >= tier.from) rate = tier.rate;
  return rate;
}

/** The introductory rate running at a moment, for an account opened at another. */
export function introStep(sim: Simulation, product: Product | undefined, openedAt: Instant, at: Instant): number | undefined {
  if (!product?.intro) return undefined;
  const a = zonedParts(openedAt, sim.homeZone);
  const b = zonedParts(at, sim.homeZone);
  const months = (b.year - a.year) * 12 + (b.month - a.month) - (b.day < a.day ? 1 : 0);
  let through = 0;
  for (const step of product.intro) {
    through += step.months;
    if (months < through) return step.rate;
  }
  return undefined;
}

/**
 * The part of a balance a rate is paid on: none below the product's floor,
 * and no more than its cap.
 */
export function earningBalance(product: Product | undefined, balance: Money): Money {
  if (!product || balance <= 0) return 0;
  if (product.rateFrom !== undefined && balance < product.rateFrom) return 0;
  return product.rateUpTo !== undefined ? Math.min(balance, product.rateUpTo) : balance;
}

/** The first moment of the month an instant is in, where the save keeps time. */
export function monthStartOf(sim: Simulation, at: Instant): Instant {
  const p = zonedParts(at, sim.homeZone);
  return instantFromZoned({ year: p.year, month: p.month, day: 1, hour: 0 }, sim.homeZone);
}

/** Eleven at night on the last day of the month, the first one after an instant. */
export function monthEndAfter(sim: Simulation, after: Instant): Instant {
  const p = zonedParts(after, sim.homeZone);
  let year = p.year;
  let month = p.month;
  for (;;) {
    const at = instantFromZoned({ year, month, day: daysInMonth(year, month), hour: 23 }, sim.homeZone);
    if (at > after) return at;
    month += 1;
    if (month > 12) { month = 1; year += 1; }
  }
}

/** Wages paid into an account since a moment: what a bank counts as direct deposit. */
export function directDeposits(sim: Simulation, account: Account, since: Instant): Money {
  let total = 0;
  const list = sim.universe.transactions;
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const t = list[i]!;
    if (t.at < since) break;
    if (t.category !== 'salary') continue;
    for (const p of t.postings) if (p.accountId === account.id && p.amount > 0) total += p.amount;
  }
  return total;
}

/**
 * The month's fee on an account, in the save's money: none when the account
 * has none or the month met its waiver, and what met it.
 */
export function feeFor(sim: Simulation, account: Account, monthStart: Instant): { fee: Money; waivedBy?: 'deposits' | 'balance' | 'age' } {
  const product = productOf(account);
  const bank = account.bankId ? bankById(account.bankId) : undefined;
  if (!product?.monthlyFee || !bank) return { fee: 0 };
  const waiver = product.waiver;
  // Met, the waiver clears the fee, or lowers it where the bank only lowers it.
  const met = (by: 'deposits' | 'balance' | 'age') => (
    waiver?.reducedTo !== undefined ? { fee: inSaveMoney(sim, waiver.reducedTo, bank.currency), waivedBy: by } : { fee: 0, waivedBy: by }
  );
  const owner = sim.universe.people[account.ownerId];
  if (waiver?.ageBelow !== undefined && owner && ageOn(sim, owner, sim.now) < waiver.ageBelow) return met('age');
  if (waiver?.depositsAtLeast !== undefined
    && directDeposits(sim, account, monthStart) >= inSaveMoney(sim, waiver.depositsAtLeast, bank.currency)
    && (!waiver.depositsAlso || alsoMet(sim, account, waiver.depositsAlso))) {
    return met('deposits');
  }
  if (waiver?.balanceAtLeast !== undefined
    && Math.min(account.lowest ?? account.balance, account.balance) >= inSaveMoney(sim, waiver.balanceAtLeast, bank.currency)) {
    return met('balance');
  }
  if (waiver?.averageAtLeast !== undefined && averageBalance(account) >= inSaveMoney(sim, waiver.averageAtLeast, bank.currency)) {
    return met('balance');
  }
  if (waiver?.linkedAverageAtLeast !== undefined) {
    const linked = Object.values(sim.universe.accounts)
      .filter((a) => a.ownerId === account.ownerId && !a.closedAt && a.bankId === bank.id && isEveryday(a))
      .reduce((sum, a) => sum + averageBalance(a), 0);
    if (linked >= inSaveMoney(sim, waiver.linkedAverageAtLeast, bank.currency)) return met('balance');
  }
  return { fee: inSaveMoney(sim, product.monthlyFee, bank.currency) };
}

/** The month's average daily balance so far: today's, before a day has been counted. */
export function averageBalance(account: Account): Money {
  return account.monthDays ? Math.round((account.monthSum ?? 0) / account.monthDays) : account.balance;
}

/**
 * Whether the last so many months had the bills paid from an account, or the
 * card purchases on it, that a waiver asks for alongside wages.
 */
export function alsoMet(sim: Simulation, account: Account, rule: { bills?: number; purchases?: number; either?: number; months: number }): boolean {
  const since = sim.now - rule.months * 30 * 86_400_000;
  let bills = 0;
  let purchases = 0;
  const list = sim.universe.transactions;
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const t = list[i]!;
    if (t.at < since) break;
    if (!t.postings.some((p) => p.accountId === account.id && p.amount < 0)) continue;
    if (t.category === 'rent' || t.category === 'bills') bills += 1;
    else if (t.category === 'food') purchases += 1;
  }
  if (rule.either !== undefined && bills + purchases >= rule.either) return true;
  if (rule.bills !== undefined && bills >= rule.bills) return true;
  return rule.purchases !== undefined && purchases >= rule.purchases;
}

/** Whether money left an account since a moment, other than the bank's own fee. */
export function withdrawnSince(sim: Simulation, account: Account, since: Instant): boolean {
  const list = sim.universe.transactions;
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const t = list[i]!;
    if (t.at < since) break;
    if (t.category === 'bank_fee' || t.category === 'interest') continue;
    if (t.postings.some((p) => p.accountId === account.id && p.amount < 0)) return true;
  }
  return false;
}

/** Whether a month earned an account its bonus rate. */
export function bonusEarned(sim: Simulation, account: Account, monthStart: Instant): boolean {
  const bonus = productOf(account)?.bonus;
  if (!bonus) return false;
  if (bonus.when === 'no_withdrawals') return !withdrawnSince(sim, account, monthStart);
  const bank = account.bankId ? bankById(account.bankId) : undefined;
  const need = bonus.growBy !== undefined && bank ? inSaveMoney(sim, bonus.growBy, bank.currency) : 1;
  return account.balance - (account.monthOpen ?? account.balance) >= need;
}

/** Interest of a person's paid so far in a calendar year, before tax. */
function interestThisYear(sim: Simulation, owner: string, yearStart: Instant): Money {
  const mine = new Set(Object.values(sim.universe.accounts).filter((a) => a.ownerId === owner).map((a) => a.id));
  let total = 0;
  const list = sim.universe.transactions;
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const t = list[i]!;
    if (t.at < yearStart) break;
    if (t.category !== 'interest' || !t.postings.some((p) => mine.has(p.accountId))) continue;
    for (const p of t.postings) if (p.amount < 0 && !mine.has(p.accountId) && sim.universe.accounts[p.accountId]?.kind === 'income') total += -p.amount;
  }
  return total;
}

/** A person's pay for a year, as their job has it now, for a tax set by income. */
function yearlyPay(sim: Simulation, owner: string): Money {
  const person = sim.universe.people[owner];
  const job = person ? jobOf(person) : undefined;
  if (!person?.job || !job) return 0;
  return hourlyWage(sim, person) * patternHours(patternOf(job, person.job.fullTime)) * 52;
}

/**
 * The share of interest the country has a bank take before paying it: none
 * on a tax-free account, the rate that matches the saver's income where the
 * rate goes by income, and the flat rate otherwise.
 */
export function interestTaxOn(sim: Simulation, account: Account): number {
  const bank = account.bankId ? bankById(account.bankId) : undefined;
  const rule = bank ? bankingIn(bank.iso)?.interestTax : undefined;
  if (!rule || productOf(account)?.taxFree) return 0;
  if (rule.brackets) {
    const pay = inSaveMoneyBack(sim, yearlyPay(sim, account.ownerId), bank!.currency);
    return rule.brackets.find((b) => b.upTo === undefined || pay <= b.upTo)?.rate ?? 0;
  }
  return rule.rate ?? 0;
}

/** An amount in the save's money, in a bank's currency. */
function inSaveMoneyBack(sim: Simulation, amount: Money, currency: string): Money {
  const from = saveCurrency(sim.universe);
  return from === currency ? amount : exchange(amount, from, currency) ?? amount;
}

/** What the bank takes off a payment of interest, with any yearly allowance left untaxed. */
export function interestTaxFor(sim: Simulation, account: Account, earned: Money): Money {
  const rate = interestTaxOn(sim, account);
  if (rate <= 0) return 0;
  const bank = bankById(account.bankId!)!;
  const allowance = bankingIn(bank.iso)?.interestTax?.allowance;
  if (allowance === undefined) return Math.round(earned * rate);
  const p = zonedParts(sim.now, sim.homeZone);
  const before = interestThisYear(sim, account.ownerId, instantFromZoned({ year: p.year, month: 1, day: 1, hour: 0 }, sim.homeZone));
  const free = Math.max(0, inSaveMoney(sim, allowance, bank.currency) - before);
  return Math.round(Math.max(0, earned - free) * rate);
}

/** Pays what an account has built up, now, as a bank does when it closes one. */
export function settleInterest(sim: Simulation, account: Account, memo: string): void {
  payInterest(sim, account, memo);
}

function payInterest(sim: Simulation, account: Account, memo: string): void {
  const earned = Math.floor(account.accrued ?? 0);
  if (earned <= 0) return;
  const tax = interestTaxFor(sim, account, earned);
  const postings = [
    { accountId: account.id, amount: earned - tax },
    { accountId: sim.nominalAccount('income', 'Interest').id, amount: -earned },
  ];
  if (tax > 0) postings.push({ accountId: sim.nominalAccount('expense', 'Tax On Interest').id, amount: tax });
  sim.post({ memo, category: 'interest', postings });
  account.accrued = (account.accrued ?? 0) - earned;
}

function scheduleMonthEnd(sim: Simulation, after: Instant): void {
  sim.schedule({
    at: monthEndAfter(sim, after), kind: MONTH_END_KIND, label: 'World Simulation', category: 'system', priority: 90,
  });
}

export function registerBanking(sim: Simulation): void {
  // Every day: interest builds on what each account holds at the day's end,
  // and the lowest it stood at this month is kept for the fee's waiver.
  sim.onEvent('world.day_rollover', 'bank.day', (_event, { sim: s }) => {
    for (const account of Object.values(s.universe.accounts)) {
      if (!account.bankId || account.closedAt || !isEveryday(account)) continue;
      const product = productOf(account);
      const earning = earningBalance(product, account.balance);
      const rate = tierRate(product, account, earning) ?? rateOf(s, account);
      if (rate > 0 && earning > 0) account.accrued = (account.accrued ?? 0) + (earning * rate) / 365;
      // The bonus builds too, and is kept only if the month earns it.
      if (product?.bonus && earning > 0) account.bonusAccrued = (account.bonusAccrued ?? 0) + (earning * product.bonus.rate) / 365;
      account.lowest = Math.min(account.lowest ?? account.balance, account.balance);
      account.monthSum = (account.monthSum ?? 0) + account.balance;
      account.monthDays = (account.monthDays ?? 0) + 1;
    }
  });

  sim.onSchedule(MONTH_END_KIND, (item, s) => {
    const monthStart = monthStartOf(s, item.at);
    const month = zonedParts(item.at, s.homeZone).month;
    for (const account of Object.values(s.universe.accounts)) {
      if (!account.bankId || account.closedAt || !isEveryday(account)) continue;
      const product = productOf(account);
      // A month that earned the bonus adds it to what's owed; one that didn't loses it.
      if (product?.bonus && bonusEarned(s, account, monthStart)) account.accrued = (account.accrued ?? 0) + (account.bonusAccrued ?? 0);
      account.bonusAccrued = 0;
      // Paid in the bank's months, where it doesn't pay every month.
      if (!product?.pays || product.pays.includes(month)) payInterest(s, account, `Interest: ${account.name}`);
      const { fee } = feeFor(s, account, monthStart);
      if (fee > 0) {
        s.post({
          memo: `Monthly fee: ${account.name}`, category: 'bank_fee',
          postings: [
            { accountId: account.id, amount: -fee },
            { accountId: s.nominalAccount('expense', 'Bank Fees').id, amount: fee },
          ],
        });
      }
      account.lowest = account.balance;
      account.monthOpen = account.balance;
      account.monthSum = 0;
      account.monthDays = 0;
    }
    scheduleMonthEnd(s, item.at);
  });

  sim.onCommand<{ fromId: string; toId: string; amount: Money }, { moved: Money }>('bank.transfer', (p, { sim: s }) => {
    const mine = bankAccountsOf(s, s.player);
    const from = mine.find((a) => a.id === p.fromId);
    const to = mine.find((a) => a.id === p.toId);
    if (!from || !to) throw new CommandError('Money moves here between your own current and savings accounts.');
    if (from.id === to.id) throw new CommandError('That’s the same account.');
    const amount = Math.round(Number(p.amount));
    if (!(amount > 0)) throw new CommandError('Say how much to move.');
    if (amount > from.balance) {
      throw new CommandError(`${from.name} holds ${formatMoney(Math.max(0, from.balance), saveCurrency(s.universe), { cents: false })}.`);
    }
    s.post({
      memo: `Moved to ${to.name}`, category: 'transfer',
      postings: [{ accountId: from.id, amount: -amount }, { accountId: to.id, amount }],
    });
    return { moved: amount };
  });

  sim.onCommand<Record<string, never>, { accountId: string }>('bank.open_savings', (_p, { sim: s }) => {
    const person = s.player;
    if (bankAccountsOf(s, person).some((a) => a.kind === 'savings')) throw new CommandError('You already have a savings account.');
    const bank = bankOf(s, person);
    if (!bank) throw new CommandError('Your current account isn’t with a bank that can open one.');
    return { accountId: openOne(s, person, bank, 'savings', 0).id };
  });

  sim.onCommand<{ accountId: string }, { closed: string }>('bank.close_savings', (p, { sim: s }) => {
    const person = s.player;
    const account = bankAccountsOf(s, person).find((a) => a.id === p.accountId && a.kind === 'savings');
    if (!account) throw new CommandError('Only a savings account of yours can be closed here.');
    const current = person.primaryAccountId ? s.universe.accounts[person.primaryAccountId] : undefined;
    if (!current || current.closedAt) throw new CommandError('There’s no current account to move the money into.');
    // What it has earned this month is paid before it closes, as a bank does.
    payInterest(s, account, `Interest: ${account.name}, on closing`);
    if (account.balance !== 0) {
      s.post({
        memo: `Closed ${account.name}`, category: 'transfer',
        postings: [{ accountId: account.id, amount: -account.balance }, { accountId: current.id, amount: account.balance }],
      });
    }
    account.accrued = 0;
    account.closedAt = s.now;
    return { closed: account.id };
  });
}

/**
 * A save from before the banks kept its money at "Northbank", which never
 * existed. Its current account, savings and card move to the first bank of
 * the country the player lives in, under that bank's account names and a
 * number in the country's format, with every balance and posting as it was.
 * A save already at a real bank is left alone.
 */
export function rebank(sim: Simulation): void {
  const person = sim.universe.people[sim.universe.playerId];
  if (!person) return;
  const bank = startingBank(person.currentLocationId);
  if (!bank) return;
  for (const account of Object.values(sim.universe.accounts)) {
    if (account.ownerId !== person.id || account.institution !== 'Northbank') continue;
    account.institution = bank.name;
    if (account.kind === 'checking' || account.kind === 'savings') {
      account.bankId = bank.id;
      account.name = account.kind === 'savings' ? bank.savings.name : bank.current.name;
      account.number = accountNumber(sim, person, bank, account.kind);
      account.last4 = account.number.replace(/\D/g, '').slice(-4);
    } else if (account.kind === 'credit_card') {
      account.name = bank.name + ' Credit Card';
    }
  }
}

/** The month's end on the calendar, where it isn't. */
export function armBanking(sim: Simulation): void {
  const armed = sim.universe.scheduled.some((one) => one.kind === MONTH_END_KIND && one.status === 'pending');
  if (!armed) scheduleMonthEnd(sim, sim.now);
}
