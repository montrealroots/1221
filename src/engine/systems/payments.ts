/**
 * SLATE — how each thing is paid.
 *
 * Until 2026-09-26 every payment fell through the same chute: the current
 * account, then savings, then the overdraft, then the card, then owed to the
 * landlord. No real account works like that, and nobody chose any of it.
 * Now each is paid the way the character pays it (module 2 of
 * `docs/BANKING-FUNCTIONS.md`):
 *
 * - **Everyday spending**, the day's groceries and a meal, on the debit card,
 *   the credit card or in cash (C27), through `spend` in
 *   `systems/spending.ts`.
 * - Savings pays nothing directly: it backs the current account only where
 *   the holder links it as overdraft protection (A108, B13, B19).
 * - **Standing orders** of the holder's own, into savings on a day each
 *   month (A67, B8), and **one-off payments** scheduled for a date (A70).
 *
 * Until the connected world of 2026-10-09 the rent and the bills were paid
 * here too, each the country's usual way (`content/payments.ts`): a
 * standing order, a direct debit, a check posted and cashed days later, or
 * by hand. A check could be stopped for the bank's fee, and a SEPA direct
 * debit taken back within eight weeks. The home and its rent and bills went
 * in the scope reset of 2026-10-09, nothing else in the game was paid by
 * check or by direct debit, and those went with them: `bank.stop_check`,
 * `bank.reclaim_debit`, the settings for the rent and the bills, and the
 * countries' norms that set them.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Account } from '../core/ledger';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { instantFromZoned, zonedParts, type Instant } from '../core/time';
import { savingsDebit } from './accountlife';

export interface StandingOrder { id: string; toId: string; amount: Money; day: number }

export interface PaymentSettings {
  everyday: 'debit' | 'credit' | 'cash';
  /** Savings backs the current account (overdraft protection). */
  linkSavings: boolean;
  standingOrders: StandingOrder[];
}

export const STANDING_ORDER_KIND = 'bank.standing_order';
export const SCHEDULED_KIND = 'bank.scheduled_payment';

/** A new life's settings: the debit card, and savings unlinked, as a bank opens it. */
export function freshPayments(): PaymentSettings {
  return { everyday: 'debit', linkSavings: false, standingOrders: [] };
}

/**
 * A person's settings. A save from before 2026-09-26 has none, and keeps the
 * way it ran: everything from the bank on the day, savings swept.
 */
export function paymentsOf(person: Person): PaymentSettings {
  return person.payments ?? { everyday: 'debit', linkSavings: true, standingOrders: [] };
}

function settle(person: Person): PaymentSettings {
  if (!person.payments) person.payments = paymentsOf(person);
  return person.payments;
}

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
      const why = !to || to.closedAt ? `${to?.name ?? 'The account'} is closed` : 'It wasn’t in the current account on the day';
      s.notify({ category: 'bank', title: 'A Standing Order Didn’t Go', body: `${formatMoney(order.amount, saveCurrency(s.universe))} to ${to?.name ?? 'your savings'}: ${why}, so the bank didn’t make it.`, importance: 50, route: '/workspace/bank' });
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
    // From savings, what it lets out, and its withdrawal fee: until 2026-09-27 neither was read here.
    const { room, fee } = from.kind === 'savings' ? savingsDebit(s, from) : { room: from.balance, fee: 0 };
    if (room >= amount) {
      s.post({ memo: `Scheduled payment to ${to.name}`, category: 'transfer', postings: [{ accountId: from.id, amount: -amount }, { accountId: to.id, amount }] });
      if (fee > 0) s.post({ memo: `Savings withdrawal fee: ${from.name}`, category: 'bank_fee', postings: [{ accountId: from.id, amount: -fee }, { accountId: s.nominalAccount('expense', 'Bank Fees').id, amount: fee }] });
    } else if (person.id === s.universe.playerId) {
      s.notify({ category: 'bank', title: 'A Scheduled Payment Didn’t Go', body: `${formatMoney(amount, saveCurrency(s.universe))} to ${to.name} wasn't in ${from.name} on the day.`, importance: 50, route: '/workspace/bank' });
    }
  });

  sim.onCommand<{ everyday?: 'debit' | 'credit' | 'cash'; linkSavings?: boolean }, { payments: PaymentSettings }>('bank.set_payments', (p, { sim: s }) => {
    const person = s.player;
    const pay = settle(person);
    if (p.everyday !== undefined) {
      if (p.everyday !== 'debit' && p.everyday !== 'credit' && p.everyday !== 'cash') throw new CommandError('Everyday spending goes in cash, on the debit card or on the credit card.');
      pay.everyday = p.everyday;
    }
    if (p.linkSavings === true && !Object.values(s.universe.accounts).some((a) => a.ownerId === person.id && !a.closedAt && a.kind === 'savings' && a.category !== 'term')) throw new CommandError('There’s no savings account to cover the current account.');
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
}

/** A standing order's calendar entries, for a save opened again. */
export function armPayments(sim: Simulation): void {
  for (const person of Object.values(sim.universe.people)) {
    if (!person.payments) continue;
    for (const order of person.payments.standingOrders) {
      const armed = sim.universe.scheduled.some((one) => one.kind === STANDING_ORDER_KIND && one.status === 'pending' && one.payload.orderId === order.id);
      if (!armed) sim.schedule({ at: nextOn(sim, order.day, sim.now), kind: STANDING_ORDER_KIND, label: 'Standing Order', category: 'home', priority: 37, payload: { personId: person.id, orderId: order.id } });
    }
  }
}
