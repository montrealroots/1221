/**
 * SLATE — things bought to be delivered (Stage 1 of `docs/BACKLOG.md`, from
 * 2026-10-01). An order is paid when it's placed. Its items exist from then,
 * on the order, and can't be used until the delivery puts them where they
 * were sent (`systems/items.ts`). A delivery happens once: an order delivered
 * isn't delivered again. One sent to a home they've since left goes to the
 * home they live in, as a forwarded parcel would; one sent to a home they
 * still own goes there.
 *
 * What each retailer charges to deliver, how long it takes and what it takes
 * back is the retailer's, and arrives with the catalogs that sell (clothing
 * in Stage 3). This is the machinery they share.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Instant } from '../core/time';
import type { Money } from '../core/money';
import { addItem, homeKeyOf, itemsOf, type Item, type Place } from './items';
import { expenseFor } from './household';

export const ORDER_KIND = 'items.order_arrives';

export interface Order {
  id: string;
  /** Who it's from, as the screen names it. */
  from: string;
  arrivesAt: Instant;
  /** Where it's sent. */
  to: Place;
  paid: Money;
  /** `returned` once all of it has gone back, `canceled` called off before it came (both set from 2026-10-02; until then `returned` was declared and never set). */
  status: 'placed' | 'delivered' | 'returned' | 'canceled';
  deliveredAt?: Instant;
  endedAt?: Instant;
}

export const ordersOf = (person: Person): Order[] => (person.orders ??= []);

/**
 * An order placed: its items made on it and its delivery booked. The caller
 * has taken the payment.
 */
export function placeOrder(sim: Simulation, person: Person, order: { from: string; arrivesAt: Instant; to: Place; paid: Money }, lines: readonly Omit<Item, 'id' | 'at' | 'acquiredAt'>[]): Order {
  const made: Order = { id: sim.nextId('order'), from: order.from, arrivesAt: order.arrivesAt, to: order.to, paid: order.paid, status: 'placed' };
  ordersOf(person).push(made);
  for (const line of lines) addItem(sim, person, { ...line, at: { kind: 'order', orderId: made.id }, acquiredAt: sim.now });
  sim.schedule({ at: order.arrivesAt, kind: ORDER_KIND, label: `A Delivery From ${order.from}`, category: 'home', priority: 30, payload: { personId: person.id, orderId: made.id } });
  return made;
}

/** Where a delivery goes: where it was sent, or where they live now if that was a home they've left. */
function destination(person: Person, to: Place): Place {
  if (to.kind !== 'home') return to;
  const theirs = to.home === homeKeyOf(person.home) || (to.home.startsWith('owned:') && (person.homes ?? []).some((h) => `owned:${h.id}` === to.home));
  const now = homeKeyOf(person.home);
  return theirs || !now ? to : { kind: 'home', home: now, spot: to.spot };
}

/** Delivers an order, once. */
export function deliver(sim: Simulation, person: Person, orderId: string): boolean {
  const order = ordersOf(person).find((o) => o.id === orderId);
  if (!order || order.status !== 'placed') return false;
  const to = destination(person, order.to);
  for (const item of itemsOf(person)) if (item.at.kind === 'order' && item.at.orderId === orderId) item.at = to;
  order.status = 'delivered';
  order.deliveredAt = sim.now;
  if (person.id === sim.universe.playerId) sim.notify({ category: 'home', title: 'A Delivery', body: `Your order from ${order.from} has arrived.`, importance: 30, route: BELONGINGS_ROUTE });
  return true;
}

/**
 * An order called off before it's delivered: its items gone from it, its
 * delivery stood down, off the calendar too, and what was paid, delivery
 * and all, refunded. The caller says whether it may be.
 */
export function cancelOrder(sim: Simulation, person: Person, orderId: string, memo: string, category: string): Money {
  const order = ordersOf(person).find((o) => o.id === orderId);
  if (!order) return 0;
  person.items = itemsOf(person).filter((i) => !(i.at.kind === 'order' && i.at.orderId === orderId));
  for (const one of sim.universe.scheduled) if (one.status === 'pending' && one.kind === ORDER_KIND && one.payload.orderId === orderId) sim.timeline.cancel(one.id, sim.now);
  const account = person.primaryAccountId;
  if (account && order.paid > 0) sim.post({ memo, category, postings: [{ accountId: account, amount: order.paid }, { accountId: sim.nominalAccount('expense', expenseFor(category)).id, amount: -order.paid }] });
  order.status = 'canceled';
  order.endedAt = sim.now;
  return order.paid;
}

const BELONGINGS_ROUTE = '/workspace/belongings';

export function registerOrders(sim: Simulation): void {
  sim.onSchedule(ORDER_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    if (person) deliver(s, person, String(item.payload.orderId));
  });
}
