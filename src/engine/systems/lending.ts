/**
 * SLATE — what the bank lends, holds for a term, and does when you leave it.
 *
 * The bank screen named each bank's overdraft terms and nothing charged
 * them: no account ever went below zero. Now an account can, the way the
 * bank runs it (`content/banks-lending.ts`):
 *
 * - **An arranged overdraft** (Britain, Ireland, Iceland, Germany, Canada,
 *   Korea, New Zealand and the rest that run one) is set up to a limit,
 *   charges interest on what's used at the bank's rate, or at the place in
 *   its range the record earns, past any buffer it gives free, and charges
 *   the monthly or yearly fee it charges for having one.
 * - **An overdraft by the item** (Chase, Wells Fargo, Bank of America) needs
 *   no arrangement: the bank pays what the account can't and charges a fee
 *   for each item that does it, at most so many a day and none while the
 *   account is overdrawn by less than the bank's grace amount. CommBank and
 *   Westpac charge theirs once, for an account still overdrawn at midnight,
 *   and interest on it.
 * - **MUFG's general account** lends against time deposits: nine tenths of
 *   them up to ¥2 million, at their rate and half a point more.
 * - **Past the limit, or with none** (`Unarranged`), some banks still pay:
 *   France's for its commission on each operation, Germany's at a higher
 *   rate on the part beyond the Dispo (the geduldete Überziehung), and New
 *   Zealand's for a fee in a month the account sat more than a margin past
 *   its limit. ANZ runs one past its arranged overdraft; BNZ's is the only
 *   one it runs on the account SLATE opens.
 * - **Spain's descubierto** costs its interest and a commission on the
 *   month's deepest point, and the two together may not cost more than the
 *   law's cap (two and a half times the legal rate of interest) on what was
 *   overdrawn day by day. What's over the cap isn't charged.
 *
 * The banks' sentences about their overdrafts were only shown, and some of
 * what they said was charged by nothing: the rate past a German Dispo,
 * La Banque Postale's unauthorized rate, ANZ's and BNZ's unarranged fees,
 * PTSB's set-up fee and Spain's cap. Each was made a term here on
 * 2026-09-25 and the sentences were deleted; Citi's and Capital One's,
 * which say they run no overdraft, stay, and the screen shows them.
 *
 * Money leaves in the household's order, with the overdraft after savings
 * and before the card (`systems/household.ts`).
 *
 * A personal loan is lent at the bank's rate, or where in its range the
 * record puts it, and repaid in equal monthly payments from the current
 * account; a payment the account can't make goes on the record, as a
 * late card payment does. It can be paid off early. A term deposit is
 * locked at the bank's rate for its term and paid out, interest and all,
 * at the end. And a person can move to another bank in their country:
 * in Britain through the Current Account Switch Service, which takes seven
 * working days, and elsewhere by opening the new accounts and moving the
 * money the same day, as a person does there.
 *
 * What no bank publishes, and so is SLATE's estimate, stands in `ESTIMATE`
 * and the screen says so: how far a bank pays items without an
 * arrangement, how big an overdraft it would arrange, what share of a
 * month's pay a loan payment may take, and the record a bank lends to.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Account } from '../core/ledger';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import type { Person } from '../domain/model';
import { addDays, addMonths, dateKey, instantFromZoned, zonedParts, MS_DAY, type Instant } from '../core/time';
import { clamp } from '../core/rng';
import { bankById, bankingIn, type Bank } from '../content/banks';
import { ageOn } from './mortality';
import { LENDING, SWITCHING, type Lending, type Loan, type Overdraft, type Unarranged } from '../content/banks-lending';
import { accountNumber } from './banknumber';
import { bankOf, banksFor, inSaveMoney, interestTaxFor, isoOf, monthStartOf, settleInterest } from './banking';

export const LOAN_DUE_KIND = 'bank.loan_due';
export const SWITCH_KIND = 'bank.switch_complete';

/**
 * SLATE's estimates, where banks publish nothing.
 *
 * - `perItemCover`: how far past zero a bank that charges by the item pays
 *   before it declines, in the bank's currency. US banks cover at their
 *   discretion and publish no figure.
 * - `overdraftOfPay`: an arranged overdraft up to a month's wages paid in,
 *   within any range the bank publishes.
 * - `loanShareOfPay`: a loan payment may take up to 35% of a month's wages
 *   paid in, a common lender's line on debt to income.
 * - `scoreFloor`, `scoreBest`, `scoreGood`: a bank lends to a record of 580
 *   and up, at the bottom of its range at 780, and, where it publishes only
 *   its lowest rate, only to a record of 670 and up.
 * - `loanMonths`: 12 to 60 months, where the bank doesn't say.
 */
export const ESTIMATE = {
  perItemCover: 500_00,
  overdraftOfPay: 1,
  loanShareOfPay: 0.35,
  scoreFloor: 580,
  scoreBest: 780,
  scoreGood: 670,
  loanMonths: [12, 60] as const,
};

export function lendingOf(bank: Bank | undefined): Lending {
  return (bank && LENDING[bank.id]) ?? {};
}

/** What the bank does past the arranged limit, or with none arranged. */
export function unarrangedOf(terms: Overdraft | undefined): Unarranged | undefined {
  if (terms?.kind === 'arranged') return terms.beyond;
  return terms?.kind === 'unarranged' ? terms : undefined;
}

function currentOf(sim: Simulation, person: Person): Account | undefined {
  const account = person.primaryAccountId ? sim.universe.accounts[person.primaryAccountId] : undefined;
  return account && !account.closedAt ? account : undefined;
}

/** A person's open term deposits. */
export function termsOf(sim: Simulation, person: Person): Account[] {
  return Object.values(sim.universe.accounts).filter((a) => a.ownerId === person.id && !a.closedAt && a.category === 'term');
}

/** A person's open personal loan. */
export function loanOf(sim: Simulation, person: Person): Account | undefined {
  return Object.values(sim.universe.accounts).find((a) => a.ownerId === person.id && !a.closedAt && a.kind === 'loan' && a.category === 'personal');
}

/** How far below zero the current account may go now, in the save's money. */
export function overdraftRoom(sim: Simulation, person: Person): Money {
  const current = currentOf(sim, person);
  const bank = current?.bankId ? bankById(current.bankId) : undefined;
  const terms = lendingOf(bank).overdraft;
  if (!current || !bank || !terms) return 0;
  const cover = inSaveMoney(sim, ESTIMATE.perItemCover, bank.currency);
  // Past an arranged limit, a French, German or New Zealand bank still pays.
  if (terms.kind === 'arranged') return (current.overdraftLimit ?? 0) + (terms.beyond ? cover : 0);
  if (terms.kind === 'per_item' || terms.kind === 'tacit' || terms.kind === 'unarranged') return cover;
  const held = termsOf(sim, person).filter((a) => a.bankId === bank.id).reduce((sum, a) => sum + Math.max(0, a.balance), 0);
  return Math.min(inSaveMoney(sim, terms.max, bank.currency), Math.floor(held * terms.share));
}

/** What's left of it: the room less what the account is already overdrawn by. */
export function overdraftHeadroom(sim: Simulation, person: Person): Money {
  const current = currentOf(sim, person);
  if (!current) return 0;
  return Math.max(0, overdraftRoom(sim, person) - Math.max(0, -current.balance));
}

/** Wages paid into a person's accounts over the last thirty days. */
export function wagesLastMonth(sim: Simulation, person: Person): Money {
  const mine = new Set(Object.values(sim.universe.accounts).filter((a) => a.ownerId === person.id).map((a) => a.id));
  const since = sim.now - 30 * MS_DAY;
  let total = 0;
  const list = sim.universe.transactions;
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const t = list[i]!;
    if (t.at < since) break;
    if (t.category !== 'salary') continue;
    for (const p of t.postings) if (mine.has(p.accountId) && p.amount > 0) total += p.amount;
  }
  return total;
}

/** Where in a range the record puts a rate: the bottom at 780, the top at 580. */
export function rateForRecord(from: number, to: number | undefined, score: number): number {
  if (to === undefined) return from;
  const share = clamp((ESTIMATE.scoreBest - score) / (ESTIMATE.scoreBest - ESTIMATE.scoreFloor), 0, 1);
  return Math.round((from + (to - from) * share) * 10_000) / 10_000;
}

/** An equal monthly payment that clears a loan in its months. */
export function monthlyPayment(amount: Money, apr: number, months: number): Money {
  const r = apr / 12;
  if (r === 0) return Math.ceil(amount / months);
  return Math.ceil((amount * r) / (1 - (1 + r) ** -months));
}

/** What the bank would arrange, or why not. */
export function overdraftOffer(sim: Simulation, person: Person): { min: Money; max: Money; rate: number } | { refused: string } {
  const current = currentOf(sim, person);
  const bank = current?.bankId ? bankById(current.bankId) : undefined;
  const terms = lendingOf(bank).overdraft;
  if (!bank || !terms) return { refused: `${bank?.name ?? 'Your bank'} doesn’t offer an overdraft SLATE has terms for.` };
  if (terms.kind !== 'arranged') return { refused: `${bank.name} doesn’t arrange one: it runs overdrafts its own way, and the bank screen says how.` };
  const score = person.credit?.score ?? 0;
  if (score < ESTIMATE.scoreFloor) return { refused: 'The bank turns down a credit record this poor.' };
  const pay = wagesLastMonth(sim, person);
  const max = Math.min(Math.round(pay * ESTIMATE.overdraftOfPay), terms.maxLimit !== undefined ? inSaveMoney(sim, terms.maxLimit, bank.currency) : Number.POSITIVE_INFINITY);
  const min = terms.minLimit !== undefined ? inSaveMoney(sim, terms.minLimit, bank.currency) : 1_00;
  if (max < min) return { refused: 'The bank arranges one against wages paid in, and not enough has been paid in this month.' };
  return { min, max, rate: rateForRecord(terms.rate, terms.rateTo, score) };
}

/** What the bank would lend, at what rate and payment, or why not. */
export function loanOffer(sim: Simulation, person: Person, amount: Money, months: number): { apr: number; payment: Money; terms: Loan } | { refused: string } {
  const bank = bankOf(sim, person);
  const terms = lendingOf(bank).loan;
  if (!bank || !terms) return { refused: `${bank?.name ?? 'Your bank'} publishes no personal loan rate SLATE has.` };
  if (loanOf(sim, person)) return { refused: 'You already have a loan with the bank.' };
  const score = person.credit?.score ?? 0;
  if (score < ESTIMATE.scoreFloor) return { refused: 'The bank turns down a credit record this poor.' };
  if (terms.to === undefined && !terms.market && score < ESTIMATE.scoreGood) {
    return { refused: `${bank.name} publishes only its lowest rate, and SLATE lends at it only to a good record.` };
  }
  const [least, most] = [terms.minMonths ?? ESTIMATE.loanMonths[0], terms.maxMonths ?? ESTIMATE.loanMonths[1]];
  if (months < least || months > most) return { refused: `The bank lends over ${least} to ${most} months.` };
  const cur = saveCurrency(sim.universe);
  if (terms.minAmount !== undefined && amount < inSaveMoney(sim, terms.minAmount, bank.currency)) {
    return { refused: `The bank lends ${formatMoney(inSaveMoney(sim, terms.minAmount, bank.currency), cur, { cents: false })} or more.` };
  }
  if (terms.maxAmount !== undefined && amount > inSaveMoney(sim, terms.maxAmount, bank.currency)) {
    return { refused: `The bank lends up to ${formatMoney(inSaveMoney(sim, terms.maxAmount, bank.currency), cur, { cents: false })}.` };
  }
  if (!(amount > 0)) return { refused: 'Say how much to borrow.' };
  const apr = terms.market ? terms.from : rateForRecord(terms.from, terms.to, score);
  const payment = monthlyPayment(amount, apr, months);
  const pay = wagesLastMonth(sim, person);
  if (pay <= 0) return { refused: 'The bank lends against wages paid in, and none has been paid in this month.' };
  if (payment > pay * ESTIMATE.loanShareOfPay) {
    return { refused: `A payment of ${formatMoney(payment, cur, { cents: false })} a month is more than the bank lets a loan take of ${formatMoney(pay, cur, { cents: false })} of wages.` };
  }
  return { apr, payment, terms };
}

function post(sim: Simulation, memo: string, category: string, postings: { accountId: string; amount: Money }[]): void {
  sim.post({ memo, category, postings });
}

/** A fee or interest out of the current account, to the bank. */
function charge(sim: Simulation, account: Account, amount: Money, memo: string, category: string, expense: string): void {
  if (amount <= 0) return;
  post(sim, memo, category, [
    { accountId: account.id, amount: -amount },
    { accountId: sim.nominalAccount('expense', expense).id, amount },
  ]);
}

/**
 * The fee for an item that took the current account below zero, where the
 * bank charges by the item: after the payment's posted, if the account is
 * overdrawn by more than the grace, once per item up to the day's cap.
 */
export function chargeForItem(sim: Simulation, person: Person): void {
  const current = currentOf(sim, person);
  const bank = current?.bankId ? bankById(current.bankId) : undefined;
  const terms = lendingOf(bank).overdraft;
  if (!current || !bank || !terms) return;
  // The month's deepest point, for a commission charged on it.
  if (current.balance < 0) current.odPeak = Math.max(current.odPeak ?? 0, -current.balance);
  let fee: { fee: Money; maxPerDay?: number; maxPerMonth?: number } | undefined;
  if (terms.kind === 'per_item' && terms.rate === undefined) {
    if (current.balance >= -(terms.graceUpTo !== undefined ? inSaveMoney(sim, terms.graceUpTo, bank.currency) : 0)) return;
    fee = terms;
  } else if (unarrangedOf(terms)?.fee !== undefined) {
    const past = unarrangedOf(terms)!;
    if (current.balance >= -(current.overdraftLimit ?? 0)) return;
    fee = { fee: past.fee!, maxPerMonth: past.maxPerMonth };
  }
  if (!fee) return;
  const today = dateKey(sim.now, sim.homeZone);
  const month = today.slice(0, 7);
  if (current.itemsDay !== today) { current.itemsDay = today; current.itemsCount = 0; }
  if (current.itemsMonth !== month) { current.itemsMonth = month; current.itemsMonthCount = 0; }
  if (fee.maxPerDay !== undefined && (current.itemsCount ?? 0) >= fee.maxPerDay) return;
  if (fee.maxPerMonth !== undefined && (current.itemsMonthCount ?? 0) >= fee.maxPerMonth) return;
  current.itemsCount = (current.itemsCount ?? 0) + 1;
  current.itemsMonthCount = (current.itemsMonthCount ?? 0) + 1;
  charge(sim, current, inSaveMoney(sim, fee.fee, bank.currency), 'Overdraft fee', 'bank_fee', 'Bank Fees');
}

/**
 * The fee for a payment the bank returned unpaid, where it charges one:
 * no more than once every so many business days, and none on a small one.
 */
export function chargeReturned(sim: Simulation, person: Person, short: Money): void {
  const current = currentOf(sim, person);
  const bank = current?.bankId ? bankById(current.bankId) : undefined;
  const rule = bank?.returned;
  if (!current || !bank || !rule || short <= 0) return;
  if (rule.ifShortAtLeast !== undefined && short < inSaveMoney(sim, rule.ifShortAtLeast, bank.currency)) return;
  if (current.returnedAt !== undefined && businessDaysBetween(sim, current.returnedAt, sim.now) < rule.gapDays) return;
  current.returnedAt = sim.now;
  charge(sim, current, inSaveMoney(sim, rule.fee, bank.currency), 'Returned payment fee', 'bank_fee', 'Bank Fees');
}

/** Monday-to-Friday days from one moment to another. */
function businessDaysBetween(sim: Simulation, from: Instant, to: Instant): number {
  let days = 0;
  for (let at = addDays(from, 1, sim.homeZone); at <= to; at = addDays(at, 1, sim.homeZone)) {
    const p = zonedParts(at, sim.homeZone);
    const weekday = new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay();
    if (weekday !== 0 && weekday !== 6) days += 1;
    if (days > 30) break;
  }
  return days;
}

/** A debit card purchase's fee, where the bank charges one and the age isn't spared. */
export function chargeForPurchase(sim: Simulation, person: Person): void {
  const current = currentOf(sim, person);
  const bank = current?.bankId ? bankById(current.bankId) : undefined;
  const card = bank?.card;
  if (!current || !bank || !card?.perPurchase) return;
  if (card.freeUnder !== undefined && ageOn(sim, person, sim.now) < card.freeUnder) return;
  charge(sim, current, inSaveMoney(sim, card.perPurchase, bank.currency), 'Debit card purchase fee', 'bank_fee', 'Bank Fees');
}

/** When an account last had money moved in or out by its owner or their employer, not the bank. */
function lastUsed(sim: Simulation, account: Account): Instant {
  const list = sim.universe.transactions;
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const t = list[i]!;
    if (t.at < account.openedAt) break;
    if (t.category === 'interest' || t.category === 'bank_fee' || t.category === 'tax_refund') continue;
    if (t.postings.some((p) => p.accountId === account.id)) return t.at;
  }
  return account.openedAt;
}

/** Transactions on an account between two moments, other than the bank's own. */
function transactionsBetween(sim: Simulation, account: Account, from: Instant, to: Instant): { count: number; wages: boolean } {
  let count = 0;
  let wages = false;
  const list = sim.universe.transactions;
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const t = list[i]!;
    if (t.at < from) break;
    if (t.at >= to || t.category === 'interest' || t.category === 'bank_fee') continue;
    if (!t.postings.some((p) => p.accountId === account.id)) continue;
    count += 1;
    if (t.category === 'salary') wages = true;
  }
  return { count, wages };
}

function scheduleLoan(sim: Simulation, loan: Account, after: Instant): void {
  sim.schedule({
    at: addMonths(after, 1, sim.homeZone), kind: LOAN_DUE_KIND, label: 'World Simulation', category: 'system', priority: 85,
    refType: 'account', refId: loan.id, payload: { accountId: loan.id },
  });
}

/** Pays an amount from the bank, overdraft and all, and says what it couldn't. */
function payFromBank(sim: Simulation, person: Person, amount: Money): { postings: { accountId: string; amount: Money }[]; short: Money } {
  const postings: { accountId: string; amount: Money }[] = [];
  let left = amount;
  const current = currentOf(sim, person);
  const saver = Object.values(sim.universe.accounts).find((a) => a.ownerId === person.id && !a.closedAt && a.kind === 'savings' && a.category !== 'term');
  for (const account of [current, saver]) {
    if (!account || left <= 0) continue;
    const take = Math.min(left, Math.max(0, account.balance));
    if (take > 0) { postings.push({ accountId: account.id, amount: -take }); left -= take; }
  }
  if (current && left > 0) {
    const take = Math.min(left, overdraftHeadroom(sim, person));
    if (take > 0) { postings.push({ accountId: current.id, amount: -take }); left -= take; }
  }
  return { postings, short: left };
}

/** Moves one person's bank to another of their country's, now. */
function completeSwitch(sim: Simulation, person: Person, to: Bank): void {
  const old = currentOf(sim, person);
  if (!old) return;
  const oldSavings = Object.values(sim.universe.accounts).find((a) => a.ownerId === person.id && !a.closedAt && a.kind === 'savings' && a.category !== 'term' && a.bankId === old.bankId);
  const open = (kind: 'checking' | 'savings', from: Account) => {
    const number = accountNumber(sim, person, to, kind);
    const account = sim.openAccount({
      id: sim.nextId('account'), kind, name: kind === 'checking' ? to.current.name : to.savings.name, ownerId: person.id,
      institution: to.name, bankId: to.id, number, last4: number.replace(/\D/g, '').slice(-4), openedAt: sim.now, monthOpen: 0,
    });
    // The balance goes across, and anything built up on it is paid first.
    settleInterest(sim, from, `Interest: ${from.name}, on closing`);
    if (from.balance !== 0) {
      post(sim, `Moved to ${to.name}`, 'transfer', [{ accountId: from.id, amount: -from.balance }, { accountId: account.id, amount: from.balance }]);
    }
    from.closedAt = sim.now;
    from.overdraftLimit = undefined;
    return account;
  };
  const current = open('checking', old);
  person.primaryAccountId = current.id;
  if (oldSavings) open('savings', oldSavings);
  if (person.id === sim.universe.playerId) {
    sim.notify({ category: 'money', title: `Switched To ${to.name}`, body: `Your money is at ${to.name} now, in a ${to.current.name}. Wages and bills go through it from today.`, importance: 60 });
  }
}

/**
 * On the first of the month: a dormant account's yearly fee, and the fee for
 * a month with too few transactions, where the bank charges them.
 */
function monthlyCharges(sim: Simulation, person: Person, current: Account, bank: Bank): void {
  const monthStart = monthStartOf(sim, sim.now - MS_DAY);
  for (const account of Object.values(sim.universe.accounts)) {
    if (account.ownerId !== person.id || account.closedAt || account.bankId !== bank.id) continue;
    if (account.kind !== 'checking' && account.kind !== 'savings') continue;
    const dormant = bank.dormant;
    if (dormant && sim.now - lastUsed(sim, account) >= dormant.afterYears * 365 * MS_DAY
      && (dormant.belowBalance === undefined || account.balance < inSaveMoney(sim, dormant.belowBalance, bank.currency))
      && (account.dormantFeeAt === undefined || sim.now - account.dormantFeeAt >= 365 * MS_DAY)) {
      account.dormantFeeAt = sim.now;
      charge(sim, account, inSaveMoney(sim, dormant.yearly, bank.currency), 'Dormant account fee', 'bank_fee', 'Bank Fees');
    }
  }
  const quiet = bank.quietMonth;
  if (quiet && current.openedAt < monthStart) {
    const month = transactionsBetween(sim, current, monthStart, sim.now);
    if (month.count < quiet.minTransactions && !(quiet.unlessWages && month.wages)) {
      charge(sim, current, inSaveMoney(sim, quiet.fee, bank.currency), 'Quiet month fee', 'bank_fee', 'Bank Fees');
    }
  }
}

/**
 * Iceland: on the assessment's day, the tax taken on the first 300,000 kr of
 * last year's interest comes back into the current account.
 */
function refundInterestTax(sim: Simulation, person: Person, current: Account, bank: Bank): void {
  const rule = bankingIn(bank.iso)?.interestTax;
  const refund = rule?.refund;
  if (!rule || !refund || !rule.rate) return;
  const today = zonedParts(sim.now, sim.homeZone);
  if (today.month !== refund.month || today.day !== refund.day) return;
  const from = instantFromZoned({ year: today.year - 1, month: 1, day: 1, hour: 0 }, sim.homeZone);
  const to = instantFromZoned({ year: today.year, month: 1, day: 1, hour: 0 }, sim.homeZone);
  const mine = new Set(Object.values(sim.universe.accounts).filter((a) => a.ownerId === person.id && a.bankId !== undefined && bankById(a.bankId)?.iso === bank.iso).map((a) => a.id));
  let gross = 0;
  for (const t of sim.universe.transactions) {
    if (t.at < from || t.at >= to || t.category !== 'interest' || !t.postings.some((p) => mine.has(p.accountId))) continue;
    for (const p of t.postings) if (p.amount < 0 && sim.universe.accounts[p.accountId]?.kind === 'income') gross += -p.amount;
  }
  const back = Math.round(Math.min(gross, inSaveMoney(sim, refund.allowance, bank.currency)) * rule.rate);
  if (back <= 0) return;
  post(sim, 'Tax on interest refunded at assessment', 'tax_refund', [
    { accountId: current.id, amount: back },
    { accountId: sim.nominalAccount('expense', 'Tax On Interest').id, amount: -back },
  ]);
  if (person.id === sim.universe.playerId) {
    sim.notify({ category: 'money', title: 'Tax On Interest Refunded', body: `The assessment gave back ${formatMoney(back, saveCurrency(sim.universe), { cents: false })} of the tax taken on last year's interest.`, importance: 50 });
  }
}

export function registerLending(sim: Simulation): void {
  // Every day: overdraft interest builds, a midnight fee where the bank
  // charges one, and a term deposit that has reached its end pays out.
  sim.onEvent('world.day_rollover', 'bank.lending_day', (_event, { sim: s }) => {
    const firstOfMonth = zonedParts(s.now, s.homeZone).day === 1;
    for (const person of Object.values(s.universe.people)) {
      const current = currentOf(s, person);
      const bank = current?.bankId ? bankById(current.bankId) : undefined;
      const terms = lendingOf(bank).overdraft;
      if (current && bank && terms) {
        const beyondTerms = unarrangedOf(terms);
        if (current.balance < 0) {
          const used = -current.balance;
          const limit = current.overdraftLimit ?? 0;
          current.odPeak = Math.max(current.odPeak ?? 0, used);
          current.odDaySum = (current.odDaySum ?? 0) + used;
          if (beyondTerms && used - limit > (beyondTerms.graceUpTo !== undefined ? inSaveMoney(s, beyondTerms.graceUpTo, bank.currency) : 0)) {
            current.odBeyondDays = (current.odBeyondDays ?? 0) + 1;
          }
          if (terms.kind === 'arranged') {
            // Past the buffer at the arranged rate; past the limit at the rate beyond it, where the bank has one.
            const buffer = terms.buffer !== undefined ? inSaveMoney(s, terms.buffer, bank.currency) : 0;
            const rate = current.overdraftRate ?? terms.rate;
            const beyond = Math.max(0, used - Math.max(limit, buffer));
            const within = Math.max(0, used - buffer) - beyond;
            current.odAccrued = (current.odAccrued ?? 0) + (within * rate + beyond * (terms.beyond?.rate ?? rate)) / 365;
          } else if (terms.kind === 'unarranged') {
            if (terms.rate !== undefined) current.odAccrued = (current.odAccrued ?? 0) + (used * terms.rate) / 365;
          } else if (terms.kind === 'per_item' && terms.rate !== undefined) {
            current.odAccrued = (current.odAccrued ?? 0) + (used * terms.rate) / 365;
            charge(s, current, inSaveMoney(s, terms.fee, bank.currency), 'Overdrawn at midnight', 'bank_fee', 'Bank Fees');
          } else if (terms.kind === 'tacit') {
            current.odAccrued = (current.odAccrued ?? 0) + (used * terms.rate) / 365;
          } else if (terms.kind === 'secured') {
            const held = termsOf(s, person).find((a) => a.bankId === bank.id);
            current.odAccrued = (current.odAccrued ?? 0) + (used * ((held?.fixedRate ?? 0) + terms.over)) / 365;
          }
        }
        if (firstOfMonth) {
          const interest = Math.floor(current.odAccrued ?? 0);
          current.odAccrued = (current.odAccrued ?? 0) - interest;
          let commission = terms.kind === 'tacit' && (current.odPeak ?? 0) > 0
            ? Math.max(Math.round((current.odPeak ?? 0) * terms.commission.share), inSaveMoney(s, terms.commission.min, bank.currency))
            : 0;
          if (terms.kind === 'tacit' && terms.cap) {
            // The law's cap on the month's cost, on what was overdrawn day by
            // day. Both banks' rates (7.83%, 7.25%) are under it, so the
            // interest alone never reaches it and the commission takes the cut;
            // a cap on the interest as well changed nothing and was taken out.
            const most = Math.floor(((current.odDaySum ?? 0) * terms.cap.rate) / 365);
            commission = Math.min(commission, most - interest);
          }
          charge(s, current, interest, 'Overdraft interest', 'bank_fee', 'Overdraft Interest');
          if (terms.kind === 'arranged' && (current.overdraftLimit ?? 0) > 0 && terms.monthlyFee !== undefined) {
            charge(s, current, inSaveMoney(s, terms.monthlyFee, bank.currency), 'Overdraft fee', 'bank_fee', 'Bank Fees');
          }
          charge(s, current, commission, 'Overdraft commission', 'bank_fee', 'Bank Fees');
          if (beyondTerms?.monthlyFee !== undefined && (current.odBeyondDays ?? 0) >= (beyondTerms.afterDays ?? 1)
            && (beyondTerms.freeUnder === undefined || ageOn(s, person, s.now) >= beyondTerms.freeUnder)) {
            charge(s, current, inSaveMoney(s, beyondTerms.monthlyFee, bank.currency), 'Unarranged overdraft fee', 'bank_fee', 'Bank Fees');
          }
          current.odPeak = current.balance < 0 ? -current.balance : 0;
          current.odDaySum = 0;
          current.odBeyondDays = 0;
        }
        if (terms.kind === 'arranged' && (current.overdraftLimit ?? 0) > 0 && terms.yearlyFee !== undefined
          && current.overdraftSince !== undefined && s.now - current.overdraftSince >= 365 * MS_DAY) {
          charge(s, current, inSaveMoney(s, terms.yearlyFee, bank.currency), 'Overdraft facility fee', 'bank_fee', 'Bank Fees');
          current.overdraftSince = s.now;
        }
      }
      if (current && bank && firstOfMonth) monthlyCharges(s, person, current, bank);
      if (current && bank?.card?.yearly !== undefined && s.now - (current.cardFeeAt ?? current.openedAt) >= 365 * MS_DAY) {
        current.cardFeeAt = s.now;
        if (bank.card.freeUnder === undefined || ageOn(s, person, s.now) >= bank.card.freeUnder) {
          charge(s, current, inSaveMoney(s, bank.card.yearly, bank.currency), 'Debit card yearly fee', 'bank_fee', 'Bank Fees');
        }
      }
      if (current && bank) refundInterestTax(s, person, current, bank);
      for (const term of termsOf(s, person)) {
        term.accrued = (term.accrued ?? 0) + (Math.max(0, term.balance) * (term.fixedRate ?? 0)) / 365;
        if (term.maturesAt === undefined || s.now < term.maturesAt) continue;
        const into = currentOf(s, person);
        if (!into) continue;
        const earned = Math.floor(term.accrued ?? 0);
        const tax = interestTaxFor(s, term, earned);
        const postings = [
          { accountId: into.id, amount: term.balance + earned - tax },
          { accountId: term.id, amount: -term.balance },
          { accountId: s.nominalAccount('income', 'Interest').id, amount: -earned },
        ];
        if (tax > 0) postings.push({ accountId: s.nominalAccount('expense', 'Tax On Interest').id, amount: tax });
        post(s, `${term.name} paid out`, 'interest', postings);
        term.accrued = 0;
        term.closedAt = s.now;
        if (person.id === s.universe.playerId) {
          s.notify({
            category: 'money', title: `Your ${term.name} Has Matured`,
            body: `It paid ${formatMoney(earned - tax, saveCurrency(s.universe), { cents: false })} of interest after tax, and all of it is in your ${into.name}.`,
            importance: 55,
          });
        }
      }
    }
  });

  sim.onSchedule(LOAN_DUE_KIND, (item, s) => {
    const loan = s.universe.accounts[String(item.payload.accountId)];
    if (!loan || loan.closedAt) return;
    const person = s.universe.people[loan.ownerId];
    if (!person) return;
    const interest = Math.round(-loan.balance * (loan.apr ?? 0) / 12);
    if (interest > 0) {
      post(s, `Interest: ${loan.name}`, 'loan_interest', [
        { accountId: loan.id, amount: -interest },
        { accountId: s.nominalAccount('expense', 'Loan Interest').id, amount: interest },
      ]);
    }
    const due = Math.min(loan.loanPayment ?? 0, -loan.balance);
    const bank = payFromBank(s, person, due);
    const paid = due - bank.short;
    if (paid > 0) post(s, `Payment: ${loan.name}`, 'loan_payment', [{ accountId: loan.id, amount: paid }, ...bank.postings]);
    if (bank.short > 0) chargeReturned(s, person, bank.short);
    if (bank.short > 0 && person.credit) {
      // A missed payment goes on the record, as a late card payment does.
      person.credit.late = [...person.credit.late.filter((when) => s.now - when < 365 * MS_DAY), s.now];
      person.credit.score = Math.max(300, person.credit.score - 50);
      if (person.id === s.universe.playerId) {
        s.notify({
          category: 'money', title: 'A Missed Loan Payment',
          body: `${formatMoney(due, saveCurrency(s.universe))} was due and ${formatMoney(paid, saveCurrency(s.universe))} was there to pay it. It’s on your record, and what’s left is still owed.`,
          importance: 80,
        });
      }
    }
    if (loan.balance >= 0) { loan.closedAt = s.now; return; }
    scheduleLoan(s, loan, item.at);
  });

  sim.onSchedule(SWITCH_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const to = bankById(String(item.payload.bankId));
    if (person && to) completeSwitch(s, person, to);
  });

  sim.onCommand<{ limit: Money }, { limit: Money; rate?: number }>('bank.arrange_overdraft', (p, { sim: s }) => {
    const person = s.player;
    const current = currentOf(s, person);
    if (!current) throw new CommandError('There’s no current account to arrange one on.');
    const limit = Math.round(Number(p.limit));
    if (limit === 0) {
      if (current.balance < 0) throw new CommandError('Pay the overdraft back before closing it.');
      current.overdraftLimit = undefined;
      return { limit: 0 };
    }
    const offer = overdraftOffer(s, person);
    if ('refused' in offer) throw new CommandError(offer.refused);
    if (limit < offer.min || limit > offer.max) {
      const cur = saveCurrency(s.universe);
      throw new CommandError(`The bank arranges between ${formatMoney(offer.min, cur, { cents: false })} and ${formatMoney(offer.max, cur, { cents: false })}.`);
    }
    if (current.balance < -limit) throw new CommandError('You’re overdrawn by more than that already.');
    const first = current.overdraftLimit === undefined;
    current.overdraftLimit = limit;
    current.overdraftRate = offer.rate;
    if (first) {
      current.overdraftSince = s.now;
      const bank = bankById(current.bankId!)!;
      const terms = lendingOf(bank).overdraft;
      // A set-up fee where the bank charges one, and the year's facility fee after a year; otherwise the facility fee now.
      if (terms?.kind === 'arranged' && terms.setupFee !== undefined) {
        charge(s, current, inSaveMoney(s, terms.setupFee, bank.currency), 'Overdraft set-up fee', 'bank_fee', 'Bank Fees');
      } else if (terms?.kind === 'arranged' && terms.yearlyFee !== undefined) {
        charge(s, current, inSaveMoney(s, terms.yearlyFee, bank.currency), 'Overdraft facility fee', 'bank_fee', 'Bank Fees');
      }
    }
    return { limit, rate: offer.rate };
  });

  sim.onCommand<{ amount: Money; months: number }, { apr: number; payment: Money }>('bank.borrow', (p, { sim: s }) => {
    const person = s.player;
    const amount = Math.round(Number(p.amount));
    const months = Math.round(Number(p.months));
    const offer = loanOffer(s, person, amount, months);
    if ('refused' in offer) throw new CommandError(offer.refused);
    const bank = bankOf(s, person)!;
    const current = currentOf(s, person)!;
    const loan = s.openAccount({
      id: s.nextId('account'), kind: 'loan', category: 'personal', name: `${bank.name} Personal Loan`, ownerId: person.id,
      institution: bank.name, bankId: bank.id, openedAt: s.now, apr: offer.apr, loanPayment: offer.payment, loanMonths: months,
    });
    post(s, `Borrowed from ${bank.name}`, 'loan', [{ accountId: loan.id, amount: -amount }, { accountId: current.id, amount }]);
    scheduleLoan(s, loan, s.now);
    return { apr: offer.apr, payment: offer.payment };
  });

  sim.onCommand<Record<string, never>, { paid: Money }>('bank.repay_loan', (_p, { sim: s }) => {
    const person = s.player;
    const loan = loanOf(s, person);
    if (!loan) throw new CommandError('You don’t have a loan to pay off.');
    // What's owed, with the month's interest so far.
    const since = s.universe.scheduled.find((one) => one.kind === LOAN_DUE_KIND && one.status === 'pending' && one.refId === loan.id);
    const days = since ? Math.max(0, 30 - Math.ceil((since.at - s.now) / MS_DAY)) : 0;
    const interest = Math.round(-loan.balance * (loan.apr ?? 0) * days / 365);
    const owed = -loan.balance + interest;
    const bank = payFromBank(s, person, owed);
    if (bank.short > 0) throw new CommandError(`Paying it off takes ${formatMoney(owed, saveCurrency(s.universe), { cents: false })}, and the bank can’t cover it all.`);
    if (interest > 0) {
      post(s, `Interest: ${loan.name}`, 'loan_interest', [
        { accountId: loan.id, amount: -interest }, { accountId: s.nominalAccount('expense', 'Loan Interest').id, amount: interest },
      ]);
    }
    post(s, `Paid off ${loan.name}`, 'loan_payment', [{ accountId: loan.id, amount: owed }, ...bank.postings]);
    loan.closedAt = s.now;
    s.timeline.cancelFor('account', loan.id, s.now);
    return { paid: owed };
  });

  sim.onCommand<{ amount: Money }, { accountId: string; maturesAt: Instant }>('bank.open_term', (p, { sim: s }) => {
    const person = s.player;
    const bank = bankOf(s, person);
    const term = lendingOf(bank).term;
    if (!bank || !term) throw new CommandError(`${bank?.name ?? 'Your bank'} publishes no term deposit rate SLATE has.`);
    const current = currentOf(s, person)!;
    const amount = Math.round(Number(p.amount));
    if (!(amount > 0)) throw new CommandError('Say how much to put in.');
    const cur = saveCurrency(s.universe);
    if (term.minAmount !== undefined && amount < inSaveMoney(s, term.minAmount, bank.currency)) {
      throw new CommandError(`It takes ${formatMoney(inSaveMoney(s, term.minAmount, bank.currency), cur, { cents: false })} or more.`);
    }
    if (amount > current.balance) throw new CommandError(`${current.name} holds ${formatMoney(Math.max(0, current.balance), cur, { cents: false })}.`);
    const number = accountNumber(s, person, bank, 'savings');
    const maturesAt = addMonths(s.now, term.months, s.homeZone);
    const account = s.openAccount({
      id: s.nextId('account'), kind: 'savings', category: 'term', name: term.called, ownerId: person.id, institution: bank.name,
      bankId: bank.id, number, last4: number.replace(/\D/g, '').slice(-4), openedAt: s.now, fixedRate: term.rate, maturesAt,
    });
    post(s, `Into ${term.called}`, 'transfer', [{ accountId: current.id, amount: -amount }, { accountId: account.id, amount }]);
    return { accountId: account.id, maturesAt };
  });

  sim.onCommand<{ bankId: string }, { at: Instant }>('bank.switch', (p, { sim: s }) => {
    const person = s.player;
    const from = bankOf(s, person);
    const to = banksFor(person.currentLocationId).find((b) => b.id === p.bankId);
    if (!to) throw new CommandError('That isn’t a bank where you live.');
    if (from?.id === to.id) throw new CommandError(`You already bank with ${to.name}.`);
    if (s.universe.scheduled.some((one) => one.kind === SWITCH_KIND && one.status === 'pending')) throw new CommandError('A switch is already under way.');
    const current = currentOf(s, person);
    if (current && current.balance < 0) throw new CommandError('Clear the overdraft before switching; the new bank won’t take it on.');
    const iso = isoOf(person.currentLocationId) ?? '';
    const rule = SWITCHING[iso];
    if (!rule) {
      completeSwitch(s, person, to);
      return { at: s.now };
    }
    // Working days: Monday to Friday, from tomorrow.
    let at = s.now;
    let left = rule.workingDays;
    while (left > 0) {
      at = addDays(at, 1, s.homeZone);
      const p2 = zonedParts(at, s.homeZone);
      const weekday = new Date(Date.UTC(p2.year, p2.month - 1, p2.day)).getUTCDay();
      if (weekday !== 0 && weekday !== 6) left -= 1;
    }
    const d = zonedParts(at, s.homeZone);
    const due = instantFromZoned({ year: d.year, month: d.month, day: d.day, hour: 9 }, s.homeZone);
    s.schedule({ at: due, kind: SWITCH_KIND, label: 'World Simulation', category: 'system', priority: 80, payload: { personId: person.id, bankId: to.id } });
    return { at: due };
  });
}
