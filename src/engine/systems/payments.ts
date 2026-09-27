/**
 * SLATE — how each thing is paid.
 *
 * Until 2026-09-26 every payment fell through the same chute: the current
 * account, then savings, then the overdraft, then the card, then owed to the
 * landlord. No real account works like that, and nobody chose any of it.
 * Now each is paid the way the character pays it (module 2 of
 * `docs/BANKING-FUNCTIONS.md`):
 *
 * - **Rent** by the country's usual way (`content/payments.ts`): a standing
 *   order, a direct debit, an online payment or a claim in the online bank,
 *   taken from the current account on the day (A63, A67, A74); or by check,
 *   posted on the due date and cashed a few days later where checks are how
 *   rent goes, or handed over post-dated in Canada (A56); or by hand, when
 *   the player pays the landlord themselves (A62, A69). A landlord takes no
 *   card.
 * - **Bills** the same way, or on the card as a recurring card payment
 *   (A68, C28).
 * - **Everyday spending**, the day's groceries, on the debit card or the
 *   credit card (C27).
 * - A payment the current account can't make, with its overdraft, goes back
 *   unpaid, with the bank's returned-item fee, and is owed (A107). Savings
 *   pays nothing directly: it backs the current account only where the
 *   holder links it as overdraft protection (A108, B13, B19).
 * - **Standing orders** of the holder's own, into savings on a day each
 *   month (A67, B8), and **one-off payments** scheduled for a date (A70).
 * - **A check** can be stopped before it's cashed, for the bank's fee, and
 *   the bank confirms it (A60, A158).
 * - **A SEPA direct debit** can be taken back within eight weeks, no
 *   questions asked, and what it paid is owed again (A124).
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Account } from '../core/ledger';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { formatDate, instantFromZoned, zonedParts, MS_DAY, type Instant } from '../core/time';
import { CITIES, COUNTRIES } from '../content/geography';
import { PAYMENT_NORMS, CHECK_FEES, type PaymentMethod } from '../content/payments';
import { bankById } from '../content/banks';

export type RentWay = 'auto' | 'check' | 'manual';
export type BillsWay = 'auto' | 'card' | 'manual';

export interface StandingOrder { id: string; toId: string; amount: Money; day: number }
export interface CheckInFlight { id: string; amount: Money; memo: string; category: string; clearsAt: Instant; itemId: string }

export interface PaymentSettings {
  rent: RentWay;
  bills: BillsWay;
  everyday: 'debit' | 'credit' | 'cash';
  /** Savings backs the current account (overdraft protection). */
  linkSavings: boolean;
  standingOrders: StandingOrder[];
  checks: CheckInFlight[];
  /** Rent paid ahead of its day, by hand, held by the landlord against the next. */
  rentCredit?: Money;
}

export const STANDING_ORDER_KIND = 'bank.standing_order';
export const SCHEDULED_KIND = 'bank.scheduled_payment';
export const CHECK_KIND = 'bank.check_clears';

/** The euro area and the rest of SEPA, whose direct debits can be taken back within eight weeks. */
const SEPA = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  'IS', 'LI', 'NO', 'CH', 'MC', 'SM', 'VA', 'AD', 'GB',
]);
/** Britain is in SEPA for euro payments, but its own Direct Debits run under the Guarantee, not the eight weeks. */
const SEPA_REFUND = new Set([...SEPA].filter((iso) => iso !== 'GB'));

export function isoOf(cityId: string): string | undefined {
  const city = CITIES.get(cityId);
  const country = city ? COUNTRIES.get(city.countryId) : undefined;
  return country?.iso2?.toUpperCase();
}

const CHECK_WAYS: readonly PaymentMethod[] = ['check', 'check_postdated'];

/** The country's usual way to pay rent, as SLATE pays it. */
export function usualRent(cityId: string): RentWay {
  const norm = PAYMENT_NORMS[isoOf(cityId) ?? ''];
  return norm && CHECK_WAYS.includes(norm.rentMost) ? 'check' : 'auto';
}

/** Whether checks are a way rent is paid here at all. */
export function checksUsed(cityId: string): boolean {
  const norm = PAYMENT_NORMS[isoOf(cityId) ?? ''];
  return Boolean(norm?.rent.some((one) => CHECK_WAYS.includes(one)));
}

/** A new life's settings: the country's usual ways, the debit card, and savings unlinked, as a bank opens it. */
export function freshPayments(cityId: string): PaymentSettings {
  return { rent: usualRent(cityId), bills: 'auto', everyday: 'debit', linkSavings: false, standingOrders: [], checks: [] };
}

/**
 * A person's settings. A save from before 2026-09-26 has none, and keeps the
 * way it ran: everything from the bank on the day, savings swept.
 */
export function paymentsOf(person: Person): PaymentSettings {
  return person.payments ?? { rent: 'auto', bills: 'auto', everyday: 'debit', linkSavings: true, standingOrders: [], checks: [] };
}

function settle(person: Person): PaymentSettings {
  if (!person.payments) person.payments = paymentsOf(person);
  return person.payments;
}

const METHOD_WORDS: Readonly<Record<PaymentMethod, string>> = {
  check: 'check', check_postdated: 'post-dated checks', standing_order: 'standing order', direct_debit: 'direct debit',
  bank_transfer: 'bank transfer', online_portal: 'the landlord’s online portal', p2p: 'a payment app', card: 'card',
  claim: 'a claim paid in the online bank', cash: 'cash',
};

/** How rent and bills usually go here, in plain words, for the screens. */
export function paymentWords(cityId: string): { usual: string } | undefined {
  const norm = PAYMENT_NORMS[isoOf(cityId) ?? ''];
  if (!norm) return undefined;
  return { usual: `Rent here usually goes by ${METHOD_WORDS[norm.rentMost]}, and bills by ${METHOD_WORDS[norm.billsMost]}.` };
}

/** Whether a direct debit here can be taken back within eight weeks (SEPA). */
export function mayReclaim(cityId: string): boolean {
  return SEPA_REFUND.has(isoOf(cityId) ?? '');
}

/** How many days a posted rent check takes to be cashed: a post-dated one is cashed on its date. */
function checkDays(cityId: string): number {
  return PAYMENT_NORMS[isoOf(cityId) ?? '']?.rentMost === 'check_postdated' ? 0 : 3;
}

function checkFees(sim: Simulation, person: Person) {
  const current = person.primaryAccountId ? sim.universe.accounts[person.primaryAccountId] : undefined;
  const bank = current?.bankId ? bankById(current.bankId) : undefined;
  return { fees: bank ? CHECK_FEES[bank.id] : undefined, bank, current };
}

/** Writes a check that's cashed on a date, and puts its clearing on the calendar. */
export function writeCheck(sim: Simulation, person: Person, amount: Money, memo: string, category: string): CheckInFlight {
  const pay = settle(person);
  const days = checkDays(person.home?.cityId ?? person.currentLocationId);
  const clearsAt = sim.now + days * MS_DAY;
  const id = sim.nextId('sched');
  const item = sim.schedule({
    at: clearsAt, kind: CHECK_KIND, label: `${memo} Check Cashed`, category: 'home', priority: 36,
    payload: { personId: person.id, checkId: id },
  });
  const check = { id, amount, memo, category, clearsAt, itemId: item.id };
  pay.checks.push(check);
  return check;
}

export interface PaymentHooks {
  /** Pays from the current account, its overdraft and any linked savings; all or nothing. */
  fromCurrent(sim: Simulation, person: Person, amount: Money, memo: string, category: string): boolean;
  /** Owes it to the landlord. */
  owe(sim: Simulation, person: Person, amount: Money, memo: string, category: string): void;
  /** The bank's fee for an item it sent back unpaid. */
  returned(sim: Simulation, person: Person, amount: Money): void;
}

let hooks: PaymentHooks | undefined;
/** `systems/household.ts` hands these over, so the payments here draw on its accounts without importing it. */
export function setPaymentHooks(h: PaymentHooks): void { hooks = h; }

function nextOn(sim: Simulation, day: number, after: Instant): Instant {
  const zone = sim.zone;
  const p = zonedParts(after, zone);
  const clamp = (y: number, m: number) => Math.min(day, new Date(Date.UTC(y, m, 0)).getUTCDate());
  let at = instantFromZoned({ year: p.year, month: p.month, day: clamp(p.year, p.month), hour: 9 }, zone);
  if (at <= after) {
    const y = p.month === 12 ? p.year + 1 : p.year;
    const m = p.month === 12 ? 1 : p.month + 1;
    at = instantFromZoned({ year: y, month: m, day: clamp(y, m), hour: 9 }, zone);
  }
  return at;
}

export function registerPayments(sim: Simulation): void {
  // A check cashed: paid from the current account if it can be, or bounced.
  sim.onSchedule(CHECK_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    if (!person || !hooks) return;
    const pay = settle(person);
    const check = pay.checks.find((one) => one.id === item.payload.checkId);
    if (!check) return;
    pay.checks = pay.checks.filter((one) => one.id !== check.id);
    if (hooks.fromCurrent(s, person, check.amount, check.memo, check.category)) return;
    hooks.returned(s, person, check.amount);
    hooks.owe(s, person, check.amount, check.memo, check.category);
    if (person.id === s.universe.playerId) {
      s.notify({ category: 'bank', title: 'A Check Bounced', body: `The ${check.memo.toLowerCase()} check for ${formatMoney(check.amount, saveCurrency(s.universe))} came back unpaid. It's owed, and the bank charged for it.`, importance: 80, route: '/workspace/bank' });
    }
  });

  // A standing order of the holder's own: made on its day if the current account can make it.
  sim.onSchedule(STANDING_ORDER_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const order = person ? paymentsOf(person).standingOrders.find((one) => one.id === item.payload.orderId) : undefined;
    if (!person || !order) return;
    const current = person.primaryAccountId ? s.universe.accounts[person.primaryAccountId] : undefined;
    const to = s.universe.accounts[order.toId];
    if (current && to && !to.closedAt && current.balance >= order.amount) {
      s.post({ memo: `Standing order to ${to.name}`, category: 'transfer', postings: [{ accountId: current.id, amount: -order.amount }, { accountId: to.id, amount: order.amount }] });
    } else if (person.id === s.universe.playerId) {
      s.notify({ category: 'bank', title: 'A Standing Order Didn’t Go', body: `${formatMoney(order.amount, saveCurrency(s.universe))} to ${to?.name ?? 'your savings'} wasn't in the current account on the day, so the bank didn't make it.`, importance: 50, route: '/workspace/bank' });
    }
    s.schedule({ at: nextOn(s, order.day, item.at), kind: STANDING_ORDER_KIND, label: 'Standing Order', category: 'home', priority: 37, payload: { personId: person.id, orderId: order.id } });
  });

  // A one-off payment set for a date.
  sim.onSchedule(SCHEDULED_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    if (!person) return;
    const from = s.universe.accounts[String(item.payload.fromId)];
    const to = s.universe.accounts[String(item.payload.toId)];
    const amount = Number(item.payload.amount);
    if (!from || !to || from.closedAt || to.closedAt) return;
    if (from.balance >= amount) {
      s.post({ memo: `Scheduled payment to ${to.name}`, category: 'transfer', postings: [{ accountId: from.id, amount: -amount }, { accountId: to.id, amount }] });
    } else if (person.id === s.universe.playerId) {
      s.notify({ category: 'bank', title: 'A Scheduled Payment Didn’t Go', body: `${formatMoney(amount, saveCurrency(s.universe))} to ${to.name} wasn't in ${from.name} on the day.`, importance: 50, route: '/workspace/bank' });
    }
  });

  sim.onCommand<{ rent?: RentWay; bills?: BillsWay; everyday?: 'debit' | 'credit' | 'cash'; linkSavings?: boolean }, { payments: PaymentSettings }>('bank.set_payments', (p, { sim: s }) => {
    const person = s.player;
    const pay = settle(person);
    const cityId = person.home?.cityId ?? person.currentLocationId;
    if (p.rent !== undefined) {
      if (!['auto', 'check', 'manual'].includes(p.rent)) throw new CommandError('Rent goes from the bank on its day, by check, or by hand.');
      if (p.rent === 'check' && !checksUsed(cityId)) throw new CommandError('Rent isn’t paid by check here.');
      if (p.rent === 'check' && pay.rent !== 'check') {
        // A checkbook, where the bank charges for one.
        const { fees, current } = checkFees(s, person);
        if (fees?.checkbook && !fees.firstFree && current) {
          s.post({ memo: 'Checks ordered', category: 'bank_fee', postings: [{ accountId: current.id, amount: -fees.checkbook }, { accountId: s.nominalAccount('expense', 'Bank Fees').id, amount: fees.checkbook }] });
        }
      }
      pay.rent = p.rent;
    }
    if (p.bills !== undefined) {
      if (!['auto', 'card', 'manual'].includes(p.bills)) throw new CommandError('Bills go from the bank on their day, on the card, or by hand.');
      pay.bills = p.bills;
    }
    if (p.everyday !== undefined) {
      if (p.everyday !== 'debit' && p.everyday !== 'credit' && p.everyday !== 'cash') throw new CommandError('Everyday spending goes in cash, on the debit card or on the credit card.');
      pay.everyday = p.everyday;
    }
    if (p.linkSavings !== undefined) pay.linkSavings = Boolean(p.linkSavings);
    return { payments: pay };
  });

  sim.onCommand<{ toId: string; amount: Money; day: number }, { id: string }>('bank.add_standing_order', (p, { sim: s }) => {
    const person = s.player;
    const to = s.universe.accounts[p.toId];
    if (!to || to.ownerId !== person.id || to.closedAt || to.kind !== 'savings') throw new CommandError('A standing order of your own goes into one of your savings accounts.');
    const amount = Math.round(Number(p.amount));
    if (!(amount > 0)) throw new CommandError('Say how much each month.');
    const day = Math.round(Number(p.day));
    if (!(day >= 1 && day <= 31)) throw new CommandError('Pick a day of the month, 1 to 31.');
    const order = { id: s.nextId('sched'), toId: to.id, amount, day };
    settle(person).standingOrders.push(order);
    s.schedule({ at: nextOn(s, day, s.now), kind: STANDING_ORDER_KIND, label: 'Standing Order', category: 'home', priority: 37, payload: { personId: person.id, orderId: order.id } });
    return { id: order.id };
  });

  sim.onCommand<{ id: string }, { id: string }>('bank.cancel_standing_order', (p, { sim: s }) => {
    const pay = settle(s.player);
    if (!pay.standingOrders.some((one) => one.id === p.id)) throw new CommandError('There’s no standing order by that name.');
    pay.standingOrders = pay.standingOrders.filter((one) => one.id !== p.id);
    for (const item of s.universe.scheduled) {
      if (item.kind === STANDING_ORDER_KIND && item.status === 'pending' && item.payload.orderId === p.id) s.timeline.cancel(item.id, s.now);
    }
    return { id: p.id };
  });

  sim.onCommand<{ fromId: string; toId: string; amount: Money; at: Instant }, { id: string }>('bank.schedule_payment', (p, { sim: s }) => {
    const person = s.player;
    const from = s.universe.accounts[p.fromId];
    const to = s.universe.accounts[p.toId];
    const mine = (a?: Account) => a && a.ownerId === person.id && !a.closedAt && (a.kind === 'checking' || a.kind === 'savings');
    if (!mine(from) || !mine(to) || from!.id === to!.id) throw new CommandError('A scheduled payment goes between two of your own accounts.');
    const amount = Math.round(Number(p.amount));
    if (!(amount > 0)) throw new CommandError('Say how much.');
    const at = Number(p.at);
    if (!(at > s.now)) throw new CommandError('Pick a day ahead.');
    const item = s.schedule({ at, kind: SCHEDULED_KIND, label: `Payment To ${to!.name}`, category: 'home', priority: 37, payload: { personId: person.id, fromId: from!.id, toId: to!.id, amount } });
    return { id: item.id };
  });

  sim.onCommand<{ id: string }, { id: string }>('bank.cancel_scheduled', (p, { sim: s }) => {
    const item = s.universe.scheduled.find((one) => one.id === p.id && one.kind === SCHEDULED_KIND && one.status === 'pending' && one.payload.personId === s.player.id);
    if (!item) throw new CommandError('There’s no payment waiting by that name.');
    s.timeline.cancel(item.id, s.now);
    return { id: p.id };
  });

  sim.onCommand<{ id: string }, { fee: Money }>('bank.stop_check', (p, { sim: s }) => {
    const person = s.player;
    const pay = settle(person);
    const check = pay.checks.find((one) => one.id === p.id);
    if (!check) throw new CommandError('That check has been cashed, or was never written.');
    const { fees, current } = checkFees(s, person);
    const fee = fees?.stopPayment ?? 0;
    if (fee > 0 && current) {
      s.post({ memo: 'Stop payment fee', category: 'bank_fee', postings: [{ accountId: current.id, amount: -fee }, { accountId: s.nominalAccount('expense', 'Bank Fees').id, amount: fee }] });
    }
    pay.checks = pay.checks.filter((one) => one.id !== check.id);
    const item = s.universe.scheduled.find((one) => one.id === check.itemId);
    if (item) s.timeline.cancel(item.id, s.now);
    // Stopped, it's still owed.
    hooks?.owe(s, person, check.amount, check.memo, check.category);
    s.notify({ category: 'bank', title: 'Check Stopped', body: `The ${check.memo.toLowerCase()} check for ${formatMoney(check.amount, saveCurrency(s.universe))} won't be paid. It's owed to your landlord.${fee > 0 ? ` The bank charged ${formatMoney(fee, saveCurrency(s.universe))}.` : ''}`, importance: 40 });
    return { fee };
  });

  sim.onCommand<{ transactionId: string }, { refunded: Money }>('bank.reclaim_debit', (p, { sim: s }) => {
    const person = s.player;
    if (!mayReclaim(person.home?.cityId ?? person.currentLocationId)) throw new CommandError('A direct debit here comes back only if it was taken in error.');
    const txn = s.universe.transactions.find((t) => t.id === p.transactionId);
    const current = person.primaryAccountId ? s.universe.accounts[person.primaryAccountId] : undefined;
    const taken = txn && current ? -txn.postings.filter((q) => q.accountId === current.id).reduce((a, q) => a + q.amount, 0) : 0;
    if (!txn || !current || txn.category !== 'bills' || taken <= 0) throw new CommandError('Only a bills direct debit taken from your current account can be taken back.');
    if (s.now - txn.at > 56 * MS_DAY) throw new CommandError(`That was ${formatDate(txn.at, s.zone)}; a direct debit comes back within eight weeks.`);
    if (s.universe.transactions.some((t) => t.reverses === txn.id)) throw new CommandError('That one has been taken back already.');
    const back = s.post({ memo: 'Direct debit taken back', category: 'bills', postings: [{ accountId: current.id, amount: taken }, { accountId: s.nominalAccount('expense', 'Bills').id, amount: -taken }] });
    back.reverses = txn.id;
    txn.reversedBy = back.id;
    hooks?.owe(s, person, taken, 'Bills', 'bills');
    return { refunded: taken };
  });
}

/** A standing order's and a check's calendar entries, for a save opened again. */
export function armPayments(sim: Simulation): void {
  for (const person of Object.values(sim.universe.people)) {
    if (!person.payments) continue;
    for (const order of person.payments.standingOrders) {
      const armed = sim.universe.scheduled.some((one) => one.kind === STANDING_ORDER_KIND && one.status === 'pending' && one.payload.orderId === order.id);
      if (!armed) sim.schedule({ at: nextOn(sim, order.day, sim.now), kind: STANDING_ORDER_KIND, label: 'Standing Order', category: 'home', priority: 37, payload: { personId: person.id, orderId: order.id } });
    }
  }
}
