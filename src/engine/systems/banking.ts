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
 * - **Moving money.** Between one's own accounts at a bank, at once, as a
 *   bank's app does it (`bank.transfer`); to one's own account at another
 *   bank, in that bank's days (`systems/bankmoves.ts`, from 2026-10-10); and
 *   a savings account opened or closed (`bank.open_savings`,
 *   `bank.close_savings`).
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
import { addMonths, dateKey, daysInMonth, formatDate, instantFromZoned, zonedParts, MS_DAY, type Instant } from '../core/time';
import { bankById, bankingIn, banksIn, type Bank, type Product } from '../content/banks';
import { OPENING } from '../content/bankopening';
import { ageOn } from './mortality';
import { accountNumber } from './banknumber';
import { ACCOUNT_LIFE } from '../content/accountlife';
import { statementReady } from './statements';
import { savingsLeftThisMonth } from './cash';
import type { ScheduledItem } from '../core/scheduler';
import { savingsDebit } from './accountlife';
import { recordInterest } from './earnings';
import { marksFallOff } from './credit';
import { checkingAt } from './lending';
import { sendBetweenBanks } from './bankmoves';

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

/**
 * The bank a new life starts with: the one chosen, or the country's first; and for somebody who isn't a US citizen, one
 * that opens for them (from 2026-10-10: Capital One and Citi online are for US persons, `OPENING`).
 */
export function startingBank(cityId: string, chosen?: string, usPerson = true): Bank | undefined {
  // At creation nobody holds a green card yet, so a US person here is a citizen.
  const banks = banksFor(cityId).filter((b) => usPerson || !OPENING[b.id]?.usPersonsOnly);
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

export function openOne(sim: Simulation, person: Person, bank: Bank, kind: 'checking' | 'savings', balance: Money): Account {
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
export function tierRate(product: Product | undefined, account: Account, balance: Money, inSave: (bankMoney: Money) => Money = (x) => x): number | undefined {
  const bank = account.bankId ? bankById(account.bankId) : undefined;
  if (!product?.tiers || !bank) return undefined;
  let rate: number | undefined;
  for (const tier of product.tiers) if (balance >= inSave(tier.from)) rate = tier.rate;
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
export function earningBalance(product: Product | undefined, balance: Money, inSave: (bankMoney: Money) => Money = (x) => x): Money {
  if (!product || balance <= 0) return 0;
  if (product.rateFrom !== undefined && balance < inSave(product.rateFrom)) return 0;
  return product.rateUpTo !== undefined ? Math.min(balance, inSave(product.rateUpTo)) : balance;
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

/** What a bank counts as a deposit, by what the product asks (`Product.deposits`). */
const ELECTRONIC = new Set(['salary', 'benefit', 'tax']);

/** Deposits into an account since a moment that a bank counts: wages, or any electronic deposit from outside. */
export function directDeposits(sim: Simulation, account: Account, since: Instant, counts: 'wages' | 'electronic' = 'wages'): Money {
  let total = 0;
  const list = sim.universe.transactions;
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const t = list[i]!;
    if (t.at < since) break;
    if (counts === 'electronic' ? !ELECTRONIC.has(t.category) : t.category !== 'salary') continue;
    for (const p of t.postings) if (p.accountId === account.id && p.amount > 0) total += p.amount;
  }
  return total;
}

/**
 * The month's fee on an account, in the save's money: none when the account
 * has none or the month met its waiver, and what met it.
 */
export type WaivedBy = 'deposits' | 'balance' | 'age' | 'purchases' | 'new';

export function feeFor(sim: Simulation, account: Account, monthStart: Instant): { fee: Money; waivedBy?: WaivedBy } {
  const product = productOf(account);
  const bank = account.bankId ? bankById(account.bankId) : undefined;
  // A second-chance account is its own product, and its own fee is charged on the first (`systems/lending.ts`); until 2026-09-27 it paid the ordinary account's beside it.
  if (!product?.monthlyFee || !bank || account.secondChance) return { fee: 0 };
  const waiver = product.waiver;
  const met = (by: WaivedBy) => ({ fee: 0, waivedBy: by });
  const owner = sim.universe.people[account.ownerId];
  const age = owner ? ageOn(sim, owner, sim.now) : undefined;
  if (waiver?.ageBelow !== undefined && age !== undefined && age < waiver.ageBelow) return met('age');
  if (waiver?.ageAtLeast !== undefined && age !== undefined && age >= waiver.ageAtLeast) return met('age');
  if (waiver?.firstMonths !== undefined && monthStart < addMonths(account.openedAt, waiver.firstMonths, sim.homeZone)) return met('new');
  if (waiver?.purchasesAtLeast !== undefined && purchasesSince(sim, account, monthStart) >= waiver.purchasesAtLeast) return met('purchases');
  if (waiver?.depositsAtLeast !== undefined
    && directDeposits(sim, account, monthStart, product.deposits) >= inSaveMoney(sim, waiver.depositsAtLeast, bank.currency)
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
  // Short of a waiver, a lesser condition may lower the fee.
  const cut = product.reduced;
  if (cut) {
    const lower = (by: WaivedBy) => ({ fee: inSaveMoney(sim, cut.to, bank.currency), waivedBy: by });
    if (cut.ageBelow !== undefined && age !== undefined && age < cut.ageBelow) return lower('age');
    if (cut.depositsAtLeast !== undefined && directDeposits(sim, account, monthStart, product.deposits) >= inSaveMoney(sim, cut.depositsAtLeast, bank.currency)) return lower('deposits');
    if (cut.averageAtLeast !== undefined && averageBalance(account) >= inSaveMoney(sim, cut.averageAtLeast, bank.currency)) return lower('balance');
  }
  return { fee: inSaveMoney(sim, product.monthlyFee, bank.currency) };
}

/** Debit card purchases from an account since a moment. */
export function purchasesSince(sim: Simulation, account: Account, since: Instant): number {
  let count = 0;
  const list = sim.universe.transactions;
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const t = list[i]!;
    if (t.at < since) break;
    if (t.category === 'food' && t.postings.some((p) => p.accountId === account.id && p.amount < 0)) count += 1;
  }
  return count;
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

/**
 * A person's wages over the last year, as paid into their accounts, for a
 * tax set by income. Until 2026-09-26 it was the day job's rate times its
 * week, a year ahead; the job engine went, and with it any pay to project.
 */
function yearlyPay(sim: Simulation, owner: string): Money {
  const mine = new Set(Object.values(sim.universe.accounts).filter((a) => a.ownerId === owner).map((a) => a.id));
  const since = sim.now - 365 * MS_DAY;
  let total = 0;
  const list = sim.universe.transactions;
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const t = list[i]!;
    if (t.at < since) break;
    if (t.category !== 'salary') continue;
    for (const p of t.postings) if (p.amount > 0 && mine.has(p.accountId)) total += p.amount;
  }
  return total;
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

/**
 * Whether the account is closed each calendar quarter rather than each month:
 * Germany's, whose banks settle interest and fees in one closing at the end
 * of March, June, September and December (AGB-Banken no. 7). Until
 * 2026-09-26 SLATE settled them monthly everywhere.
 */
export function closesQuarterly(account: Account): boolean {
  const bank = account.bankId ? bankById(account.bankId) : undefined;
  return bank?.iso === 'DE' && (account.kind === 'checking' || account.kind === 'savings');
}

/** An amount in the save's money, in a bank's currency. */
function inSaveMoneyBack(sim: Simulation, amount: Money, currency: string): Money {
  const from = saveCurrency(sim.universe);
  return from === currency ? amount : exchange(amount, from, currency) ?? amount;
}

/** What's left this year of the country's untaxed interest, in the save's money, or undefined where there's no allowance. */
export function interestAllowanceLeft(sim: Simulation, account: Account): Money | undefined {
  const bank = account.bankId ? bankById(account.bankId) : undefined;
  const allowance = bank ? bankingIn(bank.iso)?.interestTax?.allowance : undefined;
  if (!bank || allowance === undefined) return undefined;
  const p = zonedParts(sim.now, sim.homeZone);
  const before = interestThisYear(sim, account.ownerId, instantFromZoned({ year: p.year, month: 1, day: 1, hour: 0 }, sim.homeZone));
  return Math.max(0, inSaveMoney(sim, allowance, bank.currency) - before);
}

/** What the bank takes off a payment of interest, with any yearly allowance left untaxed. */
export function interestTaxFor(sim: Simulation, account: Account, earned: Money): Money {
  const rate = interestTaxOn(sim, account);
  if (rate <= 0) return 0;
  const free = interestAllowanceLeft(sim, account);
  if (free === undefined) return Math.round(earned * rate);
  return Math.round(Math.max(0, earned - free) * rate);
}

export const SAVINGS_NOTICE_KIND = 'bank.savings_notice';

/** The notice given on a savings account, where it's closing on it. */
export function savingsNotice(sim: Simulation, account: Account): ScheduledItem | undefined {
  return sim.universe.scheduled.find((i) => i.kind === SAVINGS_NOTICE_KIND && i.status === 'pending' && i.payload.accountId === account.id);
}

/**
 * Closes a savings account into the current account: its interest paid, its
 * fees charged, what it holds moved across, and the holder's standing orders
 * and payments ahead that touch it called off. Until 2026-09-27 the orders
 * stayed pointed at it and said every month that the money wasn't there.
 */
function closeSavings(sim: Simulation, person: Person, account: Account, primary: Account): void {
  // What it has earned this month is paid before it closes, as a bank does.
  payInterest(sim, account, `Interest: ${account.name}, on closing`);
  settleFees(sim, account);
  // Into the current account at its own bank; with none there, sent to the primary one in the bank's days (from
  // 2026-10-10: until then into the primary account at once, wherever it was).
  const current = checkingAt(sim, person, account.bankId) ?? primary;
  if (account.balance > 0 && current.bankId !== account.bankId) sendBetweenBanks(sim, person, account, current, account.balance);
  else if (account.balance !== 0) {
    sim.post({
      memo: `Closed ${account.name}`, category: 'transfer',
      postings: [{ accountId: account.id, amount: -account.balance }, { accountId: current.id, amount: account.balance }],
    });
  }
  account.accrued = 0;
  account.closedAt = sim.now;
  dropPaymentsFor(sim, person, account);
}

/**
 * A closed account's standing orders into it and its scheduled payments to or from it, taken off. Closing savings
 * did it; from 2026-10-10 an account canceled in its cooling-off and one handed to the state as unclaimed do too,
 * which until then left them to run against a closed account.
 */
export function dropPaymentsFor(sim: Simulation, person: Person, account: Account): void {
  const pay = person.payments;
  if (pay) {
    const gone = new Set(pay.standingOrders.filter((o) => o.toId === account.id).map((o) => o.id));
    pay.standingOrders = pay.standingOrders.filter((o) => !gone.has(o.id));
    for (const one of sim.universe.scheduled) {
      if (one.status !== 'pending' || one.payload.personId !== person.id) continue;
      if ((one.kind === 'bank.standing_order' && gone.has(String(one.payload.orderId))) || (one.kind === 'bank.scheduled_payment' && (one.payload.fromId === account.id || one.payload.toId === account.id))) sim.timeline.cancel(one.id, sim.now);
    }
  }
}

/**
 * What a closing account owes of its fees: at Germany's quarterly closing,
 * the quarter's so far and this month's. Until 2026-09-27 an account closed
 * mid-quarter took them with it.
 */
export function settleFees(sim: Simulation, account: Account): void {
  if (!closesQuarterly(account)) return;
  const due = (account.feesDue ?? 0) + feeFor(sim, account, monthStartOf(sim, sim.now)).fee;
  account.feesDue = 0;
  if (due <= 0) return;
  sim.post({ memo: `Closing fees: ${account.name}`, category: 'bank_fee', postings: [{ accountId: account.id, amount: -due }, { accountId: sim.nominalAccount('expense', 'Bank Fees').id, amount: due }] });
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
  const owner = account.ownerId ? sim.universe.people[account.ownerId] : undefined;
  if (owner) recordInterest(owner, sim.now, sim.homeZone, earned);
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
      if (account.dormant && ACCOUNT_LIFE[account.bankId]?.stopsInterest) continue;
      const product = productOf(account);
      // The floor, the cap and the tiers are the bank's own money; until 2026-09-27 they were read as the save's.
      const bankMoney = (x: Money) => inSaveMoney(s, x, bankById(account.bankId!)!.currency);
      const earning = earningBalance(product, account.balance, bankMoney);
      const rate = tierRate(product, account, earning, bankMoney) ?? rateOf(s, account);
      if (rate > 0 && earning > 0) account.accrued = (account.accrued ?? 0) + (earning * rate) / 365;
      // The bonus builds too, and is kept only if the month earns it.
      if (product?.bonus && earning > 0) account.bonusAccrued = (account.bonusAccrued ?? 0) + (earning * product.bonus.rate) / 365;
      account.lowest = Math.min(account.lowest ?? account.balance, account.balance);
      account.monthSum = (account.monthSum ?? 0) + account.balance;
      account.monthDays = (account.monthDays ?? 0) + 1;
    }
  });

  sim.onSchedule(MONTH_END_KIND, (item, s) => {
    // Marks past their years leave the record, whoever's it is (`systems/credit.ts`), card or none.
    for (const person of Object.values(s.universe.people)) marksFallOff(person, s.now);
    const monthStart = monthStartOf(s, item.at);
    const month = zonedParts(item.at, s.homeZone).month;
    for (const account of Object.values(s.universe.accounts)) {
      if (!account.bankId || account.closedAt || !isEveryday(account)) continue;
      const product = productOf(account);
      // A month that earned the bonus adds it to what's owed; one that didn't loses it.
      if (product?.bonus && bonusEarned(s, account, monthStart)) account.accrued = (account.accrued ?? 0) + (account.bonusAccrued ?? 0);
      account.bonusAccrued = 0;
      // Paid in the bank's months, where it doesn't pay every month, and in
      // Germany at the quarterly closing (AGB-Banken no. 7), with the
      // quarter's fees beside it.
      const quarterly = closesQuarterly(account);
      if ((!product?.pays || product.pays.includes(month)) && (!quarterly || month % 3 === 0)) payInterest(s, account, `Interest: ${account.name}`);
      const { fee } = feeFor(s, account, monthStart);
      if (quarterly) {
        account.feesDue = (account.feesDue ?? 0) + fee;
        if (month % 3 === 0 && account.feesDue > 0) {
          s.post({
            memo: `Quarterly closing, fees: ${account.name}`, category: 'bank_fee',
            postings: [
              { accountId: account.id, amount: -account.feesDue },
              { accountId: s.nominalAccount('expense', 'Bank Fees').id, amount: account.feesDue },
            ],
          });
          account.feesDue = 0;
        }
      } else if (fee > 0) {
        s.post({
          memo: `Monthly fee: ${account.name}`, category: 'bank_fee',
          postings: [
            { accountId: account.id, amount: -fee },
            { accountId: s.nominalAccount('expense', 'Bank Fees').id, amount: fee },
          ],
        });
      }
      // The current account's statement, monthly, or at Germany's quarterly closing.
      if (account.kind === 'checking' && (!quarterly || month % 3 === 0)) {
        const owner = s.universe.people[account.ownerId];
        if (owner) statementReady(s, owner, account, `${formatMoney(account.balance, saveCurrency(s.universe))} at the close.`);
      }
      account.lowest = account.balance;
      account.monthOpen = account.balance;
      account.monthSum = 0;
      account.monthDays = 0;
    }
    scheduleMonthEnd(s, item.at);
  });

  sim.onCommand<{ fromId: string; toId: string; amount: Money }, { moved: Money; arrivesAt?: Instant }>('bank.transfer', (p, { sim: s }) => {
    const person = s.player;
    const mine = bankAccountsOf(s, person);
    const from = mine.find((a) => a.id === p.fromId);
    const to = mine.find((a) => a.id === p.toId);
    if (!from || !to) throw new CommandError('Money moves here between your own current and savings accounts.');
    if (from.id === to.id) throw new CommandError('That’s the same account.');
    const amount = Math.round(Number(p.amount));
    if (!(amount > 0)) throw new CommandError('Say how much to move.');
    if (amount > from.balance) {
      throw new CommandError(`${from.name} holds ${formatMoney(Math.max(0, from.balance), saveCurrency(s.universe), { cents: false })}.`);
    }
    if (from.dormant || to.dormant) throw new CommandError(`${(from.dormant ? from : to).name} is dormant; use Reactivate first.`);
    const { room, fee: withdrawalFee } = from.kind === 'savings' ? savingsDebit(s, from) : { room: from.balance, fee: 0 };
    const left = savingsLeftThisMonth(s, from);
    if (left !== undefined && amount > left) {
      throw new CommandError(`${from.name} lets ${formatMoney(left, saveCurrency(s.universe), { cents: false })} more out this month without notice; more takes three months’ notice.`);
    }
    // The fee comes out beside it: until 2026-09-27 a move of the whole balance left the account overdrawn by the fee.
    if (amount > room) throw new CommandError(`${from.name} can let ${formatMoney(room, saveCurrency(s.universe), { cents: false })} out, with the ${formatMoney(withdrawalFee, saveCurrency(s.universe))} withdrawal fee.`);
    if (from.closingAt !== undefined || to.closingAt !== undefined) throw new CommandError(`${(from.closingAt !== undefined ? from : to).name} is closing.`);
    // Between two banks, it goes out now and arrives in the sending bank's days (`systems/bankmoves.ts`, from
    // 2026-10-10); until then it couldn't, and a bank switch moved everything at once.
    if (from.bankId !== to.bankId) {
      const arrivesAt = sendBetweenBanks(s, person, from, to, amount);
      if (withdrawalFee > 0) s.post({ memo: `Savings withdrawal fee: ${from.name}`, category: 'bank_fee', postings: [{ accountId: from.id, amount: -withdrawalFee }, { accountId: s.nominalAccount('expense', 'Bank Fees').id, amount: withdrawalFee }] });
      return { moved: amount, arrivesAt };
    }
    s.post({
      memo: `Moved to ${to.name}`, category: 'transfer',
      postings: [{ accountId: from.id, amount: -amount }, { accountId: to.id, amount }],
    });
    if (withdrawalFee > 0) s.post({ memo: `Savings withdrawal fee: ${from.name}`, category: 'bank_fee', postings: [{ accountId: from.id, amount: -withdrawalFee }, { accountId: s.nominalAccount('expense', 'Bank Fees').id, amount: withdrawalFee }] });
    return { moved: amount };
  });

  sim.onCommand<{ bankId?: string }, { accountId: string }>('bank.open_savings', (p, { sim: s }) => {
    const person = s.player;
    // At any bank they keep a current account with, one each (from 2026-10-10: until then one savings account in all,
    // at the primary account's bank).
    const bank = p?.bankId ? bankById(String(p.bankId)) : bankOf(s, person);
    if (!bank || !checkingAt(s, person, bank.id)) throw new CommandError('Savings opens beside a current account of yours at that bank.');
    if (bankAccountsOf(s, person).some((a) => a.kind === 'savings' && a.bankId === bank.id)) throw new CommandError(`You already have a savings account at ${bank.name}.`);
    return { accountId: openOne(s, person, bank, 'savings', 0).id };
  });

  sim.onCommand<{ accountId: string }, { closed: string; on?: Instant }>('bank.close_savings', (p, { sim: s }) => {
    const person = s.player;
    const account = bankAccountsOf(s, person).find((a) => a.id === p.accountId && a.kind === 'savings');
    if (!account) throw new CommandError('Only a savings account of yours can be closed here.');
    const current = person.primaryAccountId ? s.universe.accounts[person.primaryAccountId] : undefined;
    if (!current || current.closedAt) throw new CommandError('There’s no current account to move the money into.');
    const notice = savingsNotice(s, account);
    if (notice) throw new CommandError(`Notice is given: ${account.name} closes on ${formatDate(notice.at, s.homeZone)}.`);
    // More than Germany's monthly allowance takes the law's three months' notice, and it closes then.
    const left = savingsLeftThisMonth(s, account);
    if (left !== undefined && account.balance + Math.floor(account.accrued ?? 0) > left) {
      const on = addMonths(s.now, 3, s.homeZone);
      s.schedule({ at: on, kind: SAVINGS_NOTICE_KIND, label: `${account.name} Closes`, category: 'home', priority: 36, payload: { personId: person.id, accountId: account.id } });
      return { closed: account.id, on };
    }
    closeSavings(s, person, account, current);
    return { closed: account.id };
  });

  sim.onSchedule(SAVINGS_NOTICE_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const account = s.universe.accounts[String(item.payload.accountId)];
    const current = person?.primaryAccountId ? s.universe.accounts[person.primaryAccountId] : undefined;
    if (!person || !account || account.closedAt || !current || current.closedAt) return;
    closeSavings(s, person, account, current);
    if (person.id === s.universe.playerId) s.notify({ category: 'bank', title: `${account.name} Closed`, body: `The notice ran out, and what it held is in your ${current.name}.`, importance: 50, route: '/workspace/bank' });
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
      account.bankId = bank.id;
    }
  }
}

/** The month's end on the calendar, where it isn't. */
export function armBanking(sim: Simulation): void {
  const armed = sim.universe.scheduled.some((one) => one.kind === MONTH_END_KIND && one.status === 'pending');
  if (!armed) scheduleMonthEnd(sim, sim.now);
}
