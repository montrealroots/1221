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
 *
 * **A parcel taken** (from 2026-10-02; `research-parcel-theft.json`): a
 * parcel delivered to a home is stolen at the market's own count of
 * parcels stolen over parcels delivered, and what was in it is gone. In
 * America, Security.org's 37 million stolen of its 22 billion delivered,
 * 0.168%, the one publisher's pair; in Britain, Quadient's one stolen every
 * seven seconds over Ofcom's 4.2 billion parcels less its 12% sent to
 * lockers and shops, 0.122%; in Canada, the 10% who had one taken in a year
 * (FedEx and Angus Reid, read secondhand) over Pitney Bowes' 34 parcels a
 * person, 0.294%, a rough floor. Ireland and Mexico publish no count, and
 * none is taken there. Each is an average over every parcel, whoever was
 * home. Until 2026-10-03 being in changed nothing; from then a parcel
 * delivered with somebody home, a partner, a sitter or the player in town
 * and free (`someoneHome` in `systems/away.ts`), is handed over and not
 * left, and one left is taken at the same average, which understates a
 * doorstep's, no source giving the split. With the post held where its hold
 * takes parcels, an order waits for the hold's end.
 *
 * **Tracked** (from 2026-10-03; `research-clothing-gaps.json`): an order's
 * stage, in the carriers' own words: its label created when placed (USPS's
 * and FedEx's first status); in transit from the next business day, SLATE's
 * reading of when a retailer hands it over; out for delivery from the
 * morning of the day it comes, at eight, SLATE's reading of a round that USPS
 * finishes by five; then delivered. Out for delivery, it's said, so you can
 * be home, or have someone there, to take it in. Every carrier read leaves a
 * parcel without a signature unless the shipper asks for one. Until
 * 2026-10-06 none of SLATE's retailers was read asking, so none was carried
 * back for want of one.
 *
 * **Missed** (from 2026-10-06; `research-missed-deliveries.json`,
 * `research-carrier-holds.json`): Apple's American store says "Most shipments
 * require a signature for delivery", and its stock in America ships by FedEx
 * (a forum's reading, low confidence). FedEx's own page: a parcel that can't
 * be left goes to a nearby FedEx location, held from that day for 7 days,
 * then returned to the shipper. So an Apple parcel with nobody home to sign
 * isn't left: it's held (`Order.held`), collected on an errand
 * (`orders.collect`, a stop on a trip), or sent back and refunded once
 * when the 7 days run out. Nothing else is signed for: no other retailer is
 * read asking, and Apple's pages for the other markets weren't read. The
 * posts' holds (USPS's 15 days, Royal Mail's 18, Canada Post's 15, An Post's
 * 5 working days) are read too, but no retailer of SLATE's is read shipping
 * by them, so none is kept.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, startOfDay, type Instant } from '../core/time';
import type { Money } from '../core/money';
import { addItem, homeKeyOf, itemsOf, type Item, type Place } from './items';
import { expenseFor } from './household';
import { CITIES } from '../content/geography';
import { heldUntil, holdBack, someoneHome } from './away';

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
  /** Taken from the door when it was delivered (from 2026-10-02). */
  stolen?: true;
  /** When it was placed, for its tracking (from 2026-10-03). */
  placedAt?: Instant;
  /** Missed with nobody home to sign: held by its carrier until a moment (from 2026-10-06). */
  held?: { carrier: string; from: Instant; until: Instant };
}

/** Who asks for a signature on its parcels in a market, the carrier it ships by there, and that carrier's hold in days. */
export const SIGNED: readonly { from: string; country: string; carrier: string; holdDays: number }[] = [
  { from: 'Apple', country: 'us', carrier: 'FedEx', holdDays: 7 },
];
export const HELD_DUE_KIND = 'items.order_held_due';
/** The signature an order needs where it's delivered, or none. */
export const signatureFor = (person: Person, o: Order) => SIGNED.find((x) => x.from === o.from && x.country === CITIES.get(person.home?.cityId ?? '')?.countryId);

/** Why a held order can't be collected now, or nothing: it must be held still and they in the town it's held in. */
export function heldRefusal(person: Person, orderId: string, at: Instant): string | undefined {
  const o = ordersOf(person).find((x) => x.id === orderId);
  if (!o?.held || o.status !== 'placed' || at > o.held.until) return 'No parcel of yours is held for collection.';
  if (person.currentLocationId !== person.home?.cityId) return `It’s collected from ${o.held.carrier} where you live.`;
  return undefined;
}

/** The share of parcels delivered to a home that are stolen, by country. */
export const PARCEL_THEFT: Readonly<Record<string, number>> = { us: 37e6 / 22e9, uk: 4_505_143 / (4.2e9 * 0.88), ca: 0.1 / 34 };

/** Whether a parcel delivered to a home where they live is taken from the door; a sweep's odds where given. */
export function takenFromDoor(sim: Simulation, person: Person, orderId: string, odds?: number): boolean {
  const rate = odds ?? PARCEL_THEFT[CITIES.get(person.home?.cityId ?? '')?.countryId ?? ''];
  return rate !== undefined && sim.rng('orders.porch', person.id, orderId).next() < rate;
}

export const ordersOf = (person: Person): Order[] => (person.orders ??= []);

export type OrderStage = 'Label Created' | 'In Transit' | 'Out For Delivery' | 'Held For Collection' | 'Delivered' | 'Returned' | 'Canceled';
export const OUT_FOR_DELIVERY_HOUR = 8;
export const OUT_FOR_DELIVERY_KIND = 'items.out_for_delivery';
/** When an order goes out for delivery: eight on the morning it comes, or when it comes if that's sooner. */
export function outForDeliveryAt(person: Person, o: Order): Instant {
  const zone = CITIES.get(person.home?.cityId ?? person.currentLocationId)?.timeZone ?? 'UTC';
  return Math.min(o.arrivesAt, startOfDay(o.arrivesAt, zone) + OUT_FOR_DELIVERY_HOUR * 3_600_000);
}
/** An order's stage at a moment, as a carrier's tracking says it. */
export function orderStage(person: Person, o: Order, at: Instant): OrderStage {
  if (o.status === 'delivered') return 'Delivered';
  if (o.status === 'returned') return 'Returned';
  if (o.status === 'canceled') return 'Canceled';
  if (o.held) return 'Held For Collection';
  if (at >= outForDeliveryAt(person, o)) return 'Out For Delivery';
  const zone = CITIES.get(person.home?.cityId ?? person.currentLocationId)?.timeZone ?? 'UTC';
  return at >= startOfDay(o.placedAt ?? o.arrivesAt, zone) + 86_400_000 ? 'In Transit' : 'Label Created';
}

/**
 * An order placed: its items made on it and its delivery booked. The caller
 * has taken the payment.
 */
export function placeOrder(sim: Simulation, person: Person, order: { from: string; arrivesAt: Instant; to: Place; paid: Money }, lines: readonly Omit<Item, 'id' | 'at' | 'acquiredAt'>[]): Order {
  const made: Order = { id: sim.nextId('order'), from: order.from, arrivesAt: order.arrivesAt, to: order.to, paid: order.paid, status: 'placed', placedAt: sim.now };
  ordersOf(person).push(made);
  for (const line of lines) addItem(sim, person, { ...line, at: { kind: 'order', orderId: made.id }, acquiredAt: sim.now });
  sim.schedule({ at: order.arrivesAt, kind: ORDER_KIND, label: `A Delivery From ${order.from}`, category: 'home', priority: 30, payload: { personId: person.id, orderId: made.id } });
  // Out for delivery that morning, said, where a home's the destination.
  const out = outForDeliveryAt(person, made);
  if (order.to.kind === 'home' && out > sim.now && out < order.arrivesAt) sim.schedule({ at: out, kind: OUT_FOR_DELIVERY_KIND, label: `Out For Delivery: ${order.from}`, category: 'home', priority: 29, payload: { personId: person.id, orderId: made.id } });
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
  if (!order || order.status !== 'placed' || order.held) return false;
  const to = destination(person, order.to);
  // The post held, a parcel it takes waits for the hold's end (`systems/away.ts`).
  const held = to.kind === 'home' ? heldUntil(person, sim.now, true, to.home) : undefined;
  if (held !== undefined) {
    holdBack(sim, { kind: ORDER_KIND, label: `A Delivery From ${order.from}`, category: 'home', priority: 30, payload: { personId: person.id, orderId } }, held);
    return false;
  }
  const handedOver = to.kind === 'home' && to.home === homeKeyOf(person.home) && someoneHome(sim, person, sim.now, sim.now);
  // Nobody home to sign: the carrier takes it away and holds it.
  const signed = to.kind === 'home' ? signatureFor(person, order) : undefined;
  if (signed && !handedOver) {
    order.held = { carrier: signed.carrier, from: sim.now, until: sim.now + signed.holdDays * MS_DAY };
    sim.schedule({ at: order.held.until, kind: HELD_DUE_KIND, label: `Held By ${signed.carrier}: ${order.from}`, category: 'home', priority: 30, payload: { personId: person.id, orderId } });
    if (person.id === sim.universe.playerId) sim.notify({ category: 'home', title: 'A Delivery Was Missed', body: `Your order from ${order.from} needs a signature and nobody was home. ${signed.carrier} holds it for ${signed.holdDays} days to be collected, then sends it back.`, importance: 50, route: BELONGINGS_ROUTE });
    return false;
  }
  order.status = 'delivered';
  order.deliveredAt = sim.now;
  if (to.kind === 'home' && !handedOver && takenFromDoor(sim, person, orderId)) {
    const taken = itemsOf(person).filter((i) => i.at.kind === 'order' && i.at.orderId === orderId);
    // Clothes taken are bought again as a worn-out garment is (`replaceWornOut` in `systems/clothing.ts`).
    for (const i of taken) if (i.garment) (person.garmentsToReplace ??= []).push({ kind: i.garment.kind, slot: i.garment.slot, care: i.garment.care, label: i.label });
    person.items = itemsOf(person).filter((i) => !(i.at.kind === 'order' && i.at.orderId === orderId));
    order.stolen = true;
    if (person.id === sim.universe.playerId) sim.notify({ category: 'home', title: 'A Parcel Was Taken', body: `Your order from ${order.from} was delivered and taken from the door.`, importance: 60, route: BELONGINGS_ROUTE });
    return true;
  }
  for (const item of itemsOf(person)) if (item.at.kind === 'order' && item.at.orderId === orderId) item.at = to;
  const collect = to.kind === 'service' && to.serviceId.startsWith('collect:');
  if (person.id === sim.universe.playerId) sim.notify({ category: 'home', title: collect ? 'Ready To Collect' : 'A Delivery', body: collect ? `Your order from ${order.from} is ready to collect in store.` : `Your order from ${order.from} has arrived.`, importance: 30, route: collect ? '/workspace/clothes' : BELONGINGS_ROUTE });
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

/** A held parcel collected from its carrier: what's in it where it was sent, and the order delivered. How many things. */
export function collectHeld(sim: Simulation, person: Person, orderId: string): number {
  const no = heldRefusal(person, orderId, sim.now);
  if (no) throw new CommandError(no);
  const order = ordersOf(person).find((o) => o.id === orderId)!;
  const to = destination(person, order.to);
  const things = itemsOf(person).filter((i) => i.at.kind === 'order' && i.at.orderId === orderId);
  for (const i of things) i.at = to;
  order.status = 'delivered';
  order.deliveredAt = sim.now;
  return things.length;
}

export function registerOrders(sim: Simulation): void {
  sim.onCommand<{ orderId: string }, { collected: number }>('orders.collect', (p, { sim: s }) => ({ collected: collectHeld(s, s.player, String(p?.orderId)) }));
  // Uncollected when the carrier's hold runs out: sent back, and refunded once.
  sim.onSchedule(HELD_DUE_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const o = person ? ordersOf(person).find((x) => x.id === item.payload.orderId) : undefined;
    if (!person || !o?.held || o.status !== 'placed') return;
    // Apple's phones are spent under personal (`buyPhone`), the only parcels signed for.
    const back = cancelOrder(s, person, o.id, `${o.from}: not collected from ${o.held.carrier}, refunded`, 'personal');
    o.status = 'returned';
    if (person.id === s.universe.playerId) s.notify({ category: 'home', title: 'A Parcel Went Back', body: `Your order from ${o.from} wasn’t collected from ${o.held.carrier} in time, so it went back${back > 0 ? ' and was refunded' : ''}.`, importance: 45, route: BELONGINGS_ROUTE });
  });
  sim.onSchedule(OUT_FOR_DELIVERY_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const o = person ? ordersOf(person).find((x) => x.id === item.payload.orderId) : undefined;
    // Held by the post, it isn't out today.
    if (!person || !o || o.status !== 'placed' || person.id !== s.universe.playerId || heldUntil(person, o.arrivesAt, true) !== undefined) return;
    s.notify({ category: 'home', title: 'Out For Delivery', body: `Your order from ${o.from} is out for delivery today${someoneHome(s, person, o.arrivesAt, o.arrivesAt) ? '' : signatureFor(person, o) ? `, and it needs a signature: with nobody home, ${signatureFor(person, o)!.carrier} will hold it to be collected` : ', and nobody will be home to take it in'}.`, importance: 35, route: BELONGINGS_ROUTE });
  });
  sim.onSchedule(ORDER_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    if (person) deliver(s, person, String(item.payload.orderId));
  });
}
