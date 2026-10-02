/**
 * SLATE — buying clothes, taking them back, having them cleaned and putting
 * outfits together (Stage 3 of `docs/BACKLOG.md`, from 2026-10-01). What a
 * person wears and washes is `systems/wardrobe.ts`; this is how garments
 * come and go.
 *
 * The clothes on sale are real retailers' real products
 * (`content/clothingcatalog.ts`), at the regular prices their pages listed,
 * in the market of the country they're sold in. A store sells where it has
 * a branch SLATE has an address for; online, a retailer delivers inside its
 * own market, at its published fee, free over its threshold, in its
 * published working days. A purchase goes back unworn and unwashed inside
 * the retailer's window, to a store free where it takes returns there, or
 * by mail at its fee. What was paid for the goods comes back; the delivery
 * doesn't.
 *
 * A life begins with clothes of its own, not bought: unbranded basics, the
 * stand-ins SLATE gives everybody (`STARTER`), since what somebody already
 * owns needn't be any one shop's.
 *
 * Alterations and selling clothes on were left out at first, for want of a
 * body to fit and a resale price. Both came later: fit by weight and size
 * (`systems/tailoring.ts`) and resale (`systems/resale.ts`). A home's bath
 * towels are kept here too, from 2026-10-02 (`starterTowels`).
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatTime, type Instant } from '../core/time';
import { occupiedAt } from './life';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { CITIES } from '../content/geography';
import { salesTaxRate } from '../content/tax';
import { CLOTHING_PRODUCTS, CLOTHING_RETAILERS, type ClothingMarket, type ClothingProduct, type ClothingRetailer } from '../content/clothingcatalog';
import { careFor, type Slot } from '../content/garmentcare';
import { DRY_CLEANERS, DRY_CLEANER_BASE, DRY_CLEAN_DAYS, cleanClassOf } from '../content/garmentservices';
import type { CatalogEntry } from './catalog';
import { inSaveMoney } from './banking';
import { atTown } from './homes';
import { expenseFor, spend } from './household';
import { addItem, homeKeyOf, itemById, itemsOf, reachable, type Item, type Place } from './items';
import { cancelOrder, ordersOf, placeOrder } from './orders';
import { stow } from './trips';
import { fitOf, fitKgFor, sizeFor } from './tailoring';
import { bodyOf } from './body';
import { CHANGE_MINUTES, changeInto, dryCleanDirty, garmentsOf, unwearable, wearTheDay, type Garment } from './wardrobe';

/** A purchase of clothes: what, from whom, how, and what the goods cost; and whether it went back. */
export interface ClothesPurchase {
  id: string;
  productId: string;
  retailerId: string;
  how: 'store' | 'online';
  /** The order it came on, bought online. */
  orderId?: string;
  at: Instant;
  /** What the goods cost, tax in, in the save's money: what a return refunds. */
  goods: Money;
  /** How many garments it brought: a pack's each. */
  count: number;
  returnedAt?: Instant;
  /** Called off before it was delivered (from 2026-10-02). */
  canceledAt?: Instant;
}

/** An outfit they've put together and named. */
export interface Outfit { id: string; name: string; itemIds: string[] }

// ---------------------------------------------------------------------------
// Where clothes are sold

/** The market a town buys clothes in: its country's, where SLATE has its retailers. */
export function marketOf(cityId: string): ClothingMarket | undefined {
  return ({ us: 'US', uk: 'GB', ie: 'IE', ca: 'CA', mx: 'MX' } as const)[cityId.split('-')[0] ?? ''];
}

export const retailerById = (id: string): ClothingRetailer | undefined => CLOTHING_RETAILERS.find((r) => r.id === id);
export const productById = (id: string): ClothingProduct | undefined => CLOTHING_PRODUCTS.find((p) => p.id === id);

/**
 * The sales tax on one garment, in its market's money. New York exempts
 * clothing and footwear under $110 an item from its state tax, and New York
 * City from its own too (Tax Law §1115(a)(30); Publication 718-C); elsewhere
 * in the state SLATE keeps only the state's rate, so none. Massachusetts taxes
 * only what an item costs over $175 (830 CMR 64H.6.4). New Jersey and
 * Pennsylvania don't tax clothing, which their rules already say. In
 * Britain, Ireland and Mexico the tax is in the price.
 */
export function clothingTax(cityId: string, at: Instant, p: ClothingProduct): number {
  if (p.taxIncluded) return 0;
  const rate = salesTaxRate(cityId, at, 'clothing');
  if (cityId.startsWith('us-ny-') && p.price < 110) return 0;
  if (cityId.startsWith('us-ma-')) return 0.0625 * Math.max(0, p.price - 175);
  return p.price * rate;
}

/** One of a product, tax in, in the save's money, cents, bought where a town is. */
export function productPrice(sim: Simulation, cityId: string, p: ClothingProduct): Money {
  return inSaveMoney(sim, Math.round((p.price + clothingTax(cityId, sim.now, p)) * 100), p.currency);
}

/** A kind of garment as a list names it. */
export const KIND_LABEL: Readonly<Record<string, string>> = {
  't-shirt': 'T-Shirts', shirt: 'Shirts And Tops', sweater: 'Sweaters', jeans: 'Jeans', trousers: 'Trousers And Shorts', skirt: 'Skirts',
  dress: 'Dresses', suit: 'Suits And Tailoring', coat: 'Coats And Jackets', active: 'Activewear', underwear: 'Underwear', bra: 'Bras',
  socks: 'Socks And Tights', pajamas: 'Sleepwear', shoes: 'Shoes', accessory: 'Accessories',
};

/**
 * The clothes on sale to them: the market where they are, each at its price
 * tax in, and each saying whether a store here sells it.
 */
export function clothingCatalog(sim: Simulation, cityId: string): CatalogEntry<ClothingProduct>[] {
  const market = marketOf(cityId);
  if (!market) return [];
  return CLOTHING_PRODUCTS.filter((p) => p.market === market).map((p) => {
    const r = retailerById(p.retailer)!;
    return {
      id: p.id, label: p.name, value: p, basis: 'Price, Tax In', price: productPrice(sim, cityId, p), priceKind: 'advertised' as const,
      facets: { retailer: r.name, kind: KIND_LABEL[p.kind] ?? 'Other', where: r.storesIn.includes(cityId) ? 'In Store' : r.delivers ? 'Online' : 'Elsewhere' },
      words: `${p.brand} ${p.category} ${p.subcategory ?? ''} ${p.material ?? ''} ${p.colors.join(' ')}`,
    };
  });
}

// ---------------------------------------------------------------------------
// Buying

export interface BuyOptions { productId: string; how: 'store' | 'online'; size?: string; color?: string; quantity?: number }

/** Working days to calendar days, five to a week. */
const calendarDays = (working: number): number => Math.ceil((working * 7) / 5);

/** What a purchase would cost: the goods tax in, the delivery, and when it would arrive. */
export function purchaseQuote(sim: Simulation, person: Person, o: BuyOptions): { goods: Money; delivery: Money; total: Money; arrivesAt?: Instant } | undefined {
  // A checkout of one line (`checkoutQuote`).
  const q = checkoutQuote(sim, person, [o]);
  return q && { goods: q.goods[0]!, delivery: q.delivery, total: q.total, ...(q.arrivesAt !== undefined ? { arrivesAt: q.arrivesAt } : {}) };
}

/** Why they can't buy it so, or nothing. */
export function buyRefusal(person: Person, o: BuyOptions): string | undefined {
  const p = productById(o.productId);
  const r = p && retailerById(p.retailer);
  if (!p || !r) return 'That isn’t on sale.';
  const here = CITIES.get(person.currentLocationId)?.name ?? 'here';
  if (o.how === 'store') {
    if (!r.storesIn.includes(person.currentLocationId)) return `SLATE knows of no ${r.name} store in ${here}.${r.delivers ? ' It can be ordered online.' : ''}`;
  } else {
    if (!r.delivers) return `${r.name} doesn’t deliver; it sells in its stores.`;
    if (!person.home || person.home.kind === 'sofa') return 'An order needs a home to be sent to.';
    if (marketOf(person.home.cityId) !== p.market) return `${r.name} delivers in its own country, not to where you live.`;
  }
  if (p.sizes.length > 0 && !(o.size && p.sizes.includes(o.size))) return 'Choose one of its sizes.';
  if (p.colors.length > 1 && !(o.color && p.colors.includes(o.color))) return 'Choose one of its colors.';
  const qty = o.quantity ?? 1;
  if (!(Number.isInteger(qty) && qty >= 1 && qty <= 10)) return 'From one to ten at a time.';
  return undefined;
}

/** A garment's wear and care, from a product. A wipe-clean garment is never in the wash, so its care doesn't come up. */
function garmentOf(p: ClothingProduct): Garment {
  return { kind: p.kind, slot: p.slot, care: p.care === 'wipe' ? 'hand' : p.care, wears: 0, washes: 0 };
}

/**
 * What a checkout at one retailer comes to: each line's goods, and one
 * delivery for the order, free where the order's goods before tax reach the
 * retailer's threshold. Until 2026-10-02 each product was its own order, with
 * its own fee and its own threshold, so three shirts from one shop paid three
 * deliveries and never counted toward free shipping together.
 */
export function checkoutQuote(sim: Simulation, person: Person, lines: readonly BuyOptions[]): { goods: Money[]; delivery: Money; total: Money; arrivesAt?: Instant } | undefined {
  if (lines.length === 0) return undefined;
  const p0 = productById(lines[0]!.productId);
  const r = p0 && retailerById(p0.retailer);
  if (!p0 || !r) return undefined;
  const how = lines[0]!.how;
  const where = how === 'online' ? person.home?.cityId ?? person.currentLocationId : person.currentLocationId;
  const goods = lines.map((o) => productPrice(sim, where, productById(o.productId)!) * Math.max(1, Math.floor(o.quantity ?? 1)));
  const sum = goods.reduce((a, b) => a + b, 0);
  if (how === 'store') return { goods, delivery: 0, total: sum };
  // A threshold is on the goods before any sales tax.
  const listed = lines.reduce((a, o) => a + productById(o.productId)!.price * Math.max(1, Math.floor(o.quantity ?? 1)), 0);
  const free = r.freeOver !== null && listed >= r.freeOver;
  const delivery = free ? 0 : inSaveMoney(sim, Math.round((r.fee ?? 0) * 100), p0.currency);
  return { goods, delivery, total: sum + delivery, arrivesAt: sim.now + calendarDays(r.days ?? 5) * MS_DAY };
}

/** Why these lines can't be checked out together, or nothing: one retailer, one way, each line buyable. */
export function checkoutRefusal(person: Person, lines: readonly BuyOptions[]): string | undefined {
  if (lines.length === 0) return 'The basket is empty.';
  const first = productById(lines[0]!.productId);
  for (const o of lines) {
    const no = buyRefusal(person, o);
    if (no) return `${productById(o.productId)?.name ?? 'One of them'}: ${no}`;
    if (productById(o.productId)!.retailer !== first?.retailer || o.how !== lines[0]!.how) return 'A checkout is one retailer’s, in a store or online.';
  }
  return undefined;
}

/**
 * Checks out at one retailer: one payment for it all, in hand from a store
 * or on one order with one delivery. Each line is its own purchase, for its
 * returns; each of a pack its own garment.
 */
export function checkoutClothes(sim: Simulation, person: Person, lines: readonly BuyOptions[]): ClothesPurchase[] {
  const no = checkoutRefusal(person, lines);
  if (no) throw new CommandError(no);
  const r = retailerById(productById(lines[0]!.productId)!.retailer)!;
  const how = lines[0]!.how;
  const q = checkoutQuote(sim, person, lines)!;
  const memo = lines.length === 1 ? `${r.name}: ${productById(lines[0]!.productId)!.name}` : `${r.name}: ${lines.length} items`;
  if (!spend(sim, person, q.total, memo, 'clothing')) throw new CommandError(`It comes to ${formatMoney(q.total, saveCurrency(sim.universe))}, more than you can pay.`);
  const made = lines.map((o, i) => {
    const p = productById(o.productId)!;
    const count = (o.quantity ?? 1) * p.pack;
    const purchase: ClothesPurchase = { id: sim.nextId('purchase'), productId: p.id, retailerId: r.id, how, at: sim.now, goods: q.goods[i]!, count };
    const spec: Record<string, string> = { purchase: purchase.id, ...(o.size ? { size: o.size } : {}), ...(o.color ? { color: o.color } : p.colors.length === 1 ? { color: p.colors[0]! } : {}) };
    // Bought for the body they have now, in the size chosen: a size off is made for a body a step heavier or lighter (`fitKgFor`, `systems/tailoring.ts`).
    const line = { kind: p.id, label: p.name, quantity: 1, condition: 1, paid: Math.round(q.goods[i]! / count), spec, garment: { ...garmentOf(p), fitKg: fitKgFor(sim, person, p.sizes, o.size) } };
    return { purchase, count, line };
  });
  if (how === 'online') {
    const order = placeOrder(sim, person, { from: r.name, arrivesAt: q.arrivesAt!, to: { kind: 'home', home: homeKeyOf(person.home)!, spot: 'wardrobe' }, paid: q.total }, made.flatMap((m) => Array.from({ length: m.count }, () => ({ ...m.line, garment: { ...m.line.garment } }))));
    for (const m of made) m.purchase.orderId = order.id;
  } else {
    // Carried home where home is in this town; on them otherwise, and in the car or arms on a trip (`stow`).
    const home = homeKeyOf(person.home);
    const at: Place = home && person.home!.cityId === person.currentLocationId ? { kind: 'home', home, spot: 'wardrobe' } : { kind: 'person' };
    for (const m of made) for (let i = 0; i < m.count; i += 1) stow(person, addItem(sim, person, { ...m.line, garment: { ...m.line.garment }, at, acquiredAt: sim.now }), sim.now);
  }
  (person.clothesBought ??= []).push(...made.map((m) => m.purchase));
  return made.map((m) => m.purchase);
}

/** Buys one product: a checkout of one line. */
export const buyClothes = (sim: Simulation, person: Person, o: BuyOptions): ClothesPurchase => checkoutClothes(sim, person, [o])[0]!;

/** A line in the basket, with its own id to take it out by. */
export interface BasketLine extends BuyOptions { id: string }
export const basketOf = (person: Person): BasketLine[] => (person.basket ??= []);

// ---------------------------------------------------------------------------
// Returns

/** The garments a purchase brought that they still have. */
export const purchaseItems = (person: Person, purchaseId: string): Item[] => itemsOf(person).filter((i) => i.spec?.purchase === purchaseId);

/** When a purchase's return window opened: the day it was bought in a store, or delivered. */
function receivedAt(person: Person, purchase: ClothesPurchase): Instant | undefined {
  if (purchase.how === 'store') return purchase.at;
  return ordersOf(person).find((o) => o.id === purchase.orderId)?.deliveredAt;
}

/** What a return by mail costs, in the save's money; nothing for one to a store. Unknown where the retailer gave no fee. */
export function returnFee(sim: Simulation, purchase: ClothesPurchase, how: 'store' | 'mail'): Money | undefined {
  const r = retailerById(purchase.retailerId)!;
  if (how === 'store') return 0;
  if (r.returnByMail === null) return undefined;
  return inSaveMoney(sim, Math.round(r.returnByMail * 100), productById(purchase.productId)?.currency ?? 'USD');
}

/** Why a purchase can't go back so, or nothing. */
export function returnRefusal(sim: Simulation, person: Person, purchaseId: string, how: 'store' | 'mail'): string | undefined {
  const purchase = (person.clothesBought ?? []).find((x) => x.id === purchaseId);
  if (!purchase) return 'That isn’t something you bought.';
  if (purchase.returnedAt !== undefined) return 'It’s gone back.';
  const r = retailerById(purchase.retailerId)!;
  const from = receivedAt(person, purchase);
  if (from === undefined) return 'It hasn’t arrived yet.';
  if (r.returnDays === null) return `SLATE doesn’t know ${r.name}’s return window.`;
  if (sim.now - from > r.returnDays * MS_DAY) return `${r.name} takes things back for ${r.returnDays} days.`;
  const items = purchaseItems(person, purchaseId);
  if (items.length < purchase.count) return 'A purchase goes back whole, and some of it is gone.';
  if (items.some((i) => (i.garment?.wears ?? 0) > 0 || (i.garment?.washes ?? 0) > 0 || i.garment?.dirty)) return 'It’s been worn.';
  if (!items.every((i) => reachable(sim, person, i.at))) return 'It needs to be to hand.';
  if (how === 'store') {
    if (!r.storesIn.includes(person.currentLocationId)) return `SLATE knows of no ${r.name} store here.`;
    if (!r.returnFreeInStore) return `${r.name} takes returns by mail.`;
  } else if (returnFee(sim, purchase, 'mail') === undefined) return `SLATE doesn’t know what ${r.name} charges to return by mail.`;
  return undefined;
}

/** Returns a purchase: the goods refunded, less any fee by mail, and its garments gone. */
export function returnClothes(sim: Simulation, person: Person, purchaseId: string, how: 'store' | 'mail'): Money {
  const no = returnRefusal(sim, person, purchaseId, how);
  if (no) throw new CommandError(no);
  const purchase = person.clothesBought!.find((x) => x.id === purchaseId)!;
  const fee = returnFee(sim, purchase, how)!;
  const back = purchase.goods - fee;
  const account = Object.values(sim.universe.accounts).find((a) => a.ownerId === person.id && !a.nominal && !a.closedAt && a.kind === 'checking');
  if (!account) throw new CommandError('There’s no account to refund to.');
  const r = retailerById(purchase.retailerId)!;
  sim.post({ memo: `${r.name}: a return, refunded`, category: 'clothing', postings: [{ accountId: account.id, amount: back }, { accountId: sim.nominalAccount('expense', expenseFor('clothing')).id, amount: -back }] });
  const gone = new Set(purchaseItems(person, purchaseId).map((i) => i.id));
  person.items = itemsOf(person).filter((i) => !gone.has(i.id));
  forget(person, gone);
  purchase.returnedAt = sim.now;
  // The order it came on, once all of it has gone back.
  const order = ordersOf(person).find((o) => o.id === purchase.orderId);
  if (order && (person.clothesBought ?? []).every((x) => x.orderId !== order.id || x.returnedAt !== undefined)) { order.status = 'returned'; order.endedAt = sim.now; }
  return back;
}

/**
 * Where an order may be called off before it comes, by law: in Britain the
 * Consumer Contracts Regulations 2013 and in Ireland the European Union
 * (Consumer Information, Cancellation and Other Rights) Regulations 2013
 * (S.I. 484/2013) give a buyer at a distance the right to cancel from the
 * order until 14 days after delivery, refunded in full with the standard
 * delivery paid. In America, Canada and Mexico it's each retailer's own
 * terms, which SLATE doesn't hold.
 */
export const CANCEL_BY_LAW: Readonly<Partial<Record<ClothingMarket, string>>> = {
  GB: 'the Consumer Contracts Regulations 2013',
  IE: 'S.I. 484/2013',
};

/** Why an order of clothes can't be called off now, or nothing. */
export function cancelRefusal(person: Person, purchaseId: string): string | undefined {
  const purchase = (person.clothesBought ?? []).find((x) => x.id === purchaseId);
  if (!purchase) return 'That isn’t something you bought.';
  if (purchase.canceledAt !== undefined) return 'It’s called off already.';
  const order = ordersOf(person).find((o) => o.id === purchase.orderId);
  if (!order) return 'Bought in a store, it’s yours: it can be returned.';
  if (order.status !== 'placed') return 'It’s been delivered: it can be returned.';
  const r = retailerById(purchase.retailerId)!;
  if (!CANCEL_BY_LAW[r.market]) return `SLATE doesn’t know ${r.name}’s terms for calling an order off; it can be returned once it comes.`;
  return undefined;
}

/** Calls an order of clothes off before it's delivered: refunded whole, delivery too. */
export function cancelClothes(sim: Simulation, person: Person, purchaseId: string): Money {
  const no = cancelRefusal(person, purchaseId);
  if (no) throw new CommandError(no);
  const purchase = person.clothesBought!.find((x) => x.id === purchaseId)!;
  const r = retailerById(purchase.retailerId)!;
  const back = cancelOrder(sim, person, purchase.orderId!, `${r.name}: an order canceled, refunded`, 'clothing');
  // The order goes whole: every purchase on it.
  for (const x of person.clothesBought ?? []) if (x.orderId === purchase.orderId) x.canceledAt = sim.now;
  return back;
}

/** Garments gone from what they chose to wear and their outfits. */
export function forget(person: Person, gone: ReadonlySet<string>): void {
  if (person.dressed) person.dressed = person.dressed.filter((id) => !gone.has(id));
  for (const o of person.outfits ?? []) o.itemIds = o.itemIds.filter((id) => !gone.has(id));
}

// ---------------------------------------------------------------------------
// The dry cleaner

/** What the town's dry cleaner charges for a garment, in the save's money, and whether it's SLATE's estimate. */
export function dryCleanPrice(sim: Simulation, cityId: string, g: Item & { garment: Garment }): { price: Money; estimate: boolean } {
  const cls = cleanClassOf(g.garment.kind, g.garment.slot);
  const own = DRY_CLEANERS[cityId];
  if (own) return { price: inSaveMoney(sim, Math.round(own.price[cls] * 100), own.currency), estimate: (own.estimated ?? []).includes(cls) };
  const base = DRY_CLEANERS[DRY_CLEANER_BASE]!;
  return { price: atTown(sim, cityId, base.price[cls]), estimate: true };
}

const READY_KIND = 'clothes.cleaning_ready';
const serviceId = (cityId: string): string => `drycleaner:${cityId}`;

/** Takes what's waiting on a dry cleaner in to the town's: paid now, ready in its days, collected in the town. */
export function dryClean(sim: Simulation, person: Person): { count: number; paid: Money; readyAt: Instant } {
  const dirty = dryCleanDirty(sim, person);
  if (dirty.length === 0) throw new CommandError('None of your clothes need the dry cleaner.');
  const cityId = person.currentLocationId;
  const paid = dirty.reduce((sum, g) => sum + dryCleanPrice(sim, cityId, g).price, 0);
  if (!spend(sim, person, paid, 'The dry cleaner', 'laundry')) throw new CommandError(`It comes to ${formatMoney(paid, saveCurrency(sim.universe))}, more than you can pay.`);
  const readyAt = sim.now + DRY_CLEAN_DAYS * MS_DAY;
  for (const g of dirty) {
    g.garment.dirty = false;
    g.garment.wears = 0;
    g.garment.washes += 1;
    g.at = { kind: 'service', serviceId: serviceId(cityId), readyAt };
  }
  sim.schedule({ at: readyAt, kind: READY_KIND, label: 'Dry Cleaning Ready', category: 'home', priority: 25, payload: { personId: person.id, cityId } });
  return { count: dirty.length, paid, readyAt };
}

/** What's ready at the dry cleaner, or a tailor (`systems/tailoring.ts`), in the town they're in. */
export const readyToCollect = (sim: Simulation, person: Person): Item[] =>
  itemsOf(person).filter((i) => i.at.kind === 'service' && (i.at.serviceId === serviceId(person.currentLocationId) || i.at.serviceId.startsWith(`tailor:${person.currentLocationId}:`)) && i.at.readyAt <= sim.now);

/** Collects what's ready: home to the wardrobe where home is here, on them otherwise. */
export function collectCleaning(sim: Simulation, person: Person): number {
  const ready = readyToCollect(sim, person);
  if (ready.length === 0) throw new CommandError('The dry cleaner here has none of yours ready.');
  const home = homeKeyOf(person.home);
  const to: Place = home && person.home!.cityId === person.currentLocationId ? { kind: 'home', home, spot: 'wardrobe' } : { kind: 'person' };
  for (const i of ready) i.at = to;
  return ready.length;
}

// ---------------------------------------------------------------------------
// Outfits

/** Why these garments can't be an outfit, or nothing: theirs, to hand, and one to a slot. */
export function outfitRefusal(sim: Simulation, person: Person, itemIds: readonly string[]): string | undefined {
  const seen = new Set<Slot>();
  for (const id of itemIds) {
    const item = itemById(person, id);
    if (!item?.garment) return 'That isn’t one of your clothes.';
    if (!reachable(sim, person, item.at)) return `${item.label} isn’t to hand.`;
    const slot = item.garment.slot;
    if (slot === 'accessory') continue;
    if (seen.has(slot)) return 'One garment to a part of an outfit.';
    seen.add(slot);
  }
  if (seen.has('suit') && (seen.has('dress') || seen.has('top') || seen.has('bottom'))) return 'A suit is worn on its own, with what goes under it.';
  if (seen.has('dress') && (seen.has('top') || seen.has('bottom'))) return 'A dress is worn on its own.';
  return undefined;
}

/** Why these garments can't be put on now, or nothing: an outfit, each piece of it clean, dry, fitting and to hand (from 2026-10-02; until then a dirty piece was taken and silently swapped on the day). */
export function dressRefusal(sim: Simulation, person: Person, itemIds: readonly string[]): string | undefined {
  const no = outfitRefusal(sim, person, itemIds);
  if (no) return no;
  for (const id of itemIds) {
    const item = itemById(person, id) as Item & { garment: Garment };
    const why = unwearable(sim, person, item);
    if (why) return `${item.label} is ${why}.`;
  }
  return undefined;
}

/** Puts together an outfit and names it. */
export function saveOutfit(sim: Simulation, person: Person, name: string, itemIds: readonly string[]): Outfit {
  const title = name.trim();
  if (!title) throw new CommandError('Give it a name.');
  if (itemIds.length === 0) throw new CommandError('Choose what goes in it.');
  const no = outfitRefusal(sim, person, itemIds);
  if (no) throw new CommandError(no);
  const outfit: Outfit = { id: sim.nextId('outfit'), name: title, itemIds: [...itemIds] };
  (person.outfits ??= []).push(outfit);
  return outfit;
}

// ---------------------------------------------------------------------------
// The clothes a life begins with

/**
 * The wardrobe a life starts with, SLATE's estimate: two weeks of underwear
 * and socks, since a person washes a load or two a week, ten tops, four
 * bottoms, two pairs of shoes and a coat.
 */
export const STARTER: readonly { label: string; kind: string; slot: Slot; count: number }[] = [
  { label: 'T-Shirt', kind: 't-shirt', slot: 'top', count: 7 },
  { label: 'Button-Up Shirt', kind: 'shirt', slot: 'top', count: 3 },
  { label: 'Jeans', kind: 'jeans', slot: 'bottom', count: 2 },
  { label: 'Trousers', kind: 'trousers', slot: 'bottom', count: 2 },
  { label: 'Underwear', kind: 'underwear', slot: 'underwear', count: 14 },
  { label: 'Socks', kind: 'socks', slot: 'socks', count: 14 },
  { label: 'Sneakers', kind: 'shoes', slot: 'shoes', count: 1 },
  { label: 'Dress Shoes', kind: 'shoes', slot: 'shoes', count: 1 },
  { label: 'Coat', kind: 'coat', slot: 'outer', count: 1 },
];

/** The bath towels a household begins with: three, SLATE's estimate, one in use, one in the wash and one spare. */
export const STARTER_TOWELS = 3;

/** Gives a home its towels where they own none, as a household has: an older save's too (from 2026-10-02). */
export function starterTowels(sim: Simulation, person: Person): boolean {
  const home = homeKeyOf(person.home);
  if (!home || garmentsOf(person).some((g) => g.garment.slot === 'towel')) return false;
  for (let i = 0; i < STARTER_TOWELS; i += 1) addItem(sim, person, { kind: 'starter:towel', label: 'Bath Towel', quantity: 1, condition: 1, at: { kind: 'home', home, spot: 'bathroom' }, acquiredAt: sim.now, garment: { kind: 'towel', slot: 'towel', care: 'wash', wears: 0, washes: 0 } });
  return true;
}

/**
 * Gives somebody the clothes a life begins with, once, at home, if they
 * have a home and no wardrobe yet. A save from before kept a count of
 * outfits, clean and dirty: its dirty ones are worn into the new wardrobe,
 * and the count goes.
 */
export function starterWardrobe(sim: Simulation, person: Person): boolean {
  if (person.clothesSince !== undefined || garmentsOf(person).length > 0) return false;
  const home = homeKeyOf(person.home);
  if (!home) return false;
  for (const s of STARTER) {
    for (let i = 0; i < s.count; i += 1) {
      addItem(sim, person, { kind: `starter:${s.kind}`, label: s.label, quantity: 1, condition: 1, at: { kind: 'home', home, spot: s.slot === 'shoes' || s.slot === 'outer' ? 'wardrobe' : 'drawers' }, acquiredAt: sim.now, garment: { kind: s.kind, slot: s.slot, care: careFor(s.kind).lifetimeWashes === null ? 'hand' : 'wash', wears: 0, washes: 0, fitKg: bodyOf(sim, person).weightKg } });
    }
  }
  person.clothesSince = sim.now;
  const l = person.living;
  if (l && l.dirty !== undefined) {
    for (let i = 0; i < Math.min(l.dirty, 13); i += 1) wearTheDay(sim, person, sim.now, false);
    delete l.clean;
    delete l.dirty;
    delete l.drying;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Replacing what wears out

/** Words that say a product is cut for one sex: a replacement is bought without them where the shop has one. */
const CUT_FOR = /\b(women'?s|men'?s|mens|womens|girls'?|boys'?|maternity|mama)\b/i;

/** The cheapest of a kind on sale to them now, by the garment: in a store here, else online to home. */
export function cheapestOf(sim: Simulation, person: Person, kind: string, slot: Slot): { product: ClothingProduct; how: 'store' | 'online'; size?: string; color?: string } | undefined {
  const market = marketOf(person.home?.cityId ?? person.currentLocationId);
  const ways = CLOTHING_PRODUCTS.filter((p) => p.market === market && p.kind === kind && p.slot === slot).flatMap((p) => {
    // Your own size, where the run can be ordered; the middle one where it can't (`sizeFor`).
    const size = p.sizes.length ? sizeFor(sim, person, p.sizes) ?? p.sizes[Math.floor(p.sizes.length / 2)] : undefined;
    const color = p.colors.length > 1 ? p.colors[0] : undefined;
    const how = (['store', 'online'] as const).find((h) => !buyRefusal(person, { productId: p.id, how: h, size, color }));
    return how ? [{ product: p, how, size, color, each: productPrice(sim, person.currentLocationId, p) / p.pack }] : [];
  });
  const plain = ways.filter((w) => !CUT_FOR.test(w.product.name));
  return (plain.length ? plain : ways).sort((a, b) => a.each - b.each)[0];
}

/**
 * Worn-out garments replaced, on a day with time for it: the cheapest of
 * each kind where they live, enough packs for what wore out, and the worn
 * ones thrown away. Where SLATE has no shops, an unbranded one at the
 * cheapest American price at the town's cost of living, SLATE's estimate.
 * What the bank can't pay for isn't bought, and the worn ones stay.
 */
export function replaceWornOut(sim: Simulation, person: Person): number {
  // Worn out, or no longer fitting the body (`systems/tailoring.ts`); not one away being altered.
  const worn = garmentsOf(person).filter((g) => g.condition <= 0 || (fitOf(person, g.garment) !== 'fits' && g.at.kind !== 'service'));
  if (worn.length === 0) return 0;
  const groups = new Map<string, (Item & { garment: Garment })[]>();
  for (const g of worn) groups.set(`${g.garment.slot}:${g.garment.kind}`, [...(groups.get(`${g.garment.slot}:${g.garment.kind}`) ?? []), g]);
  let replaced = 0;
  for (const list of groups.values()) {
    const { kind, slot } = list[0]!.garment;
    const pick = cheapestOf(sim, person, kind, slot);
    let got = 0;
    if (pick) {
      const quantity = Math.min(10, Math.ceil(list.length / pick.product.pack));
      try {
        buyClothes(sim, person, { productId: pick.product.id, how: pick.how, size: pick.size, color: pick.color, quantity });
        got = quantity * pick.product.pack;
      } catch (e) {
        if (!(e instanceof CommandError)) throw e;
      }
    } else if (!marketOf(person.home?.cityId ?? person.currentLocationId)) {
      const us = CLOTHING_PRODUCTS.filter((p) => p.market === 'US' && p.kind === kind && p.slot === slot).map((p) => p.price / p.pack).sort((a, b) => a - b)[0];
      const home = homeKeyOf(person.home);
      if (us !== undefined && home) {
        const each = atTown(sim, person.home!.cityId, us);
        if (spend(sim, person, each * list.length, `Clothes: ${list[0]!.label}`, 'clothing')) {
          for (const g of list) addItem(sim, person, { kind: g.kind, label: g.label, quantity: 1, condition: 1, at: { kind: 'home', home, spot: g.at.kind === 'home' ? g.at.spot ?? 'wardrobe' : 'wardrobe' }, acquiredAt: sim.now, paid: each, garment: { kind, slot, care: g.garment.care, wears: 0, washes: 0, fitKg: bodyOf(sim, person).weightKg } });
          got = list.length;
        }
      }
    }
    const gone = new Set(list.slice(0, got).map((g) => g.id));
    if (gone.size === 0) continue;
    person.items = itemsOf(person).filter((i) => !gone.has(i.id));
    forget(person, gone);
    replaced += gone.size;
  }
  return replaced;
}

export function registerClothing(sim: Simulation): void {
  sim.onSchedule(READY_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    if (person?.id === s.universe.playerId) s.notify({ category: 'home', title: 'Dry Cleaning Ready', body: `Your dry cleaning is ready to collect in ${CITIES.get(String(item.payload.cityId))?.name ?? 'town'}.`, importance: 25, route: '/workspace/clothes' });
  });
  sim.onCommand<BuyOptions, { purchaseId: string }>('clothes.buy', (p, { sim: s }) => {
    if (!p || typeof p.productId !== 'string') throw new CommandError('What to buy?');
    return { purchaseId: buyClothes(s, s.player, { productId: p.productId, how: p.how === 'online' ? 'online' : 'store', size: p.size, color: p.color, quantity: p.quantity }).id };
  });
  sim.onCommand<{ purchaseId: string; how: 'store' | 'mail' }, { refunded: Money }>('clothes.return', (p, { sim: s }) => ({ refunded: returnClothes(s, s.player, String(p?.purchaseId), p?.how === 'mail' ? 'mail' : 'store') }));
  // The basket: lines put in and taken out, then checked out a retailer at a time (from 2026-10-02).
  sim.onCommand<BuyOptions, { lineId: string }>('clothes.basket_add', (p, { sim: s }) => {
    const o: BuyOptions = { productId: String(p?.productId), how: p?.how === 'online' ? 'online' : 'store', ...(p?.size ? { size: String(p.size) } : {}), ...(p?.color ? { color: String(p.color) } : {}), quantity: p?.quantity === undefined ? 1 : Number(p.quantity) };
    const no = buyRefusal(s.player, o);
    if (no) throw new CommandError(no);
    // Numbered from the purchases', which is what a line becomes.
    const line: BasketLine = { ...o, id: s.nextId('purchase') };
    basketOf(s.player).push(line);
    return { lineId: line.id };
  });
  sim.onCommand<{ lineId: string }, { left: number }>('clothes.basket_remove', (p, { sim: s }) => {
    const basket = basketOf(s.player);
    if (!basket.some((l) => l.id === p?.lineId)) throw new CommandError('That isn’t in the basket.');
    s.player.basket = basket.filter((l) => l.id !== p.lineId);
    return { left: s.player.basket.length };
  });
  sim.onCommand<{ retailerId: string; how: 'store' | 'online' }, { purchaseIds: string[]; paid: Money }>('clothes.checkout', (p, { sim: s }) => {
    const person = s.player;
    const lines = basketOf(person).filter((l) => productById(l.productId)?.retailer === p?.retailerId && l.how === p?.how);
    const q = checkoutQuote(s, person, lines);
    const made = checkoutClothes(s, person, lines);
    const done = new Set(lines.map((l) => l.id));
    person.basket = basketOf(person).filter((l) => !done.has(l.id));
    return { purchaseIds: made.map((m) => m.id), paid: q!.total };
  });
  sim.onCommand<{ purchaseId: string }, { refunded: Money }>('clothes.cancel', (p, { sim: s }) => ({ refunded: cancelClothes(s, s.player, String(p?.purchaseId)) }));
  sim.onCommand<Record<string, never>, { count: number; paid: Money }>('clothes.dry_clean', (_p, { sim: s }) => dryClean(s, s.player));
  sim.onCommand<Record<string, never>, { count: number }>('clothes.collect', (_p, { sim: s }) => ({ count: collectCleaning(s, s.player) }));
  sim.onCommand<{ itemIds: string[] }, { dressed: string[] }>('clothes.dress', (p, { sim: s }) => {
    const ids = Array.isArray(p?.itemIds) ? p.itemIds.map(String) : [];
    const no = dressRefusal(s, s.player, ids);
    if (no) throw new CommandError(no);
    s.player.dressed = ids;
    return { dressed: ids };
  });
  // Changed into, now: the time it takes, each piece a wear, and what they have on (from 2026-10-02).
  sim.onCommand<{ itemIds: string[] }, { wearing: string[] }>('clothes.change', (p, { sim: s }) => {
    const person = s.player;
    const ids = Array.isArray(p?.itemIds) ? p.itemIds.map(String) : [];
    if (ids.length === 0) throw new CommandError('Choose what to put on.');
    const no = dressRefusal(s, person, ids);
    if (no) throw new CommandError(no);
    const busy = occupiedAt(s, s.now);
    if (busy) throw new CommandError(`You’re at ${busy.label} until ${formatTime(busy.at + busy.durationMinutes! * 60_000, s.zone)}.`);
    s.advanceTo(s.now + CHANGE_MINUTES * 60_000);
    changeInto(s, person, ids.map((id) => itemById(person, id) as Item & { garment: Garment }));
    person.dressed = ids;
    return { wearing: ids };
  });
  sim.onCommand<{ name: string; itemIds: string[] }, { outfitId: string }>('clothes.save_outfit', (p, { sim: s }) => ({ outfitId: saveOutfit(s, s.player, String(p?.name ?? ''), Array.isArray(p?.itemIds) ? p.itemIds.map(String) : []).id }));
  sim.onCommand<{ outfitId: string }, { dressed: string[] }>('clothes.wear_outfit', (p, { sim: s }) => {
    const outfit = (s.player.outfits ?? []).find((o) => o.id === p?.outfitId);
    if (!outfit) throw new CommandError('No such outfit.');
    if (outfit.itemIds.length === 0) throw new CommandError('None of it is yours any more.');
    const no = dressRefusal(s, s.player, outfit.itemIds);
    if (no) throw new CommandError(no);
    s.player.dressed = [...outfit.itemIds];
    return { dressed: s.player.dressed };
  });
  sim.onCommand<{ outfitId: string }, { outfits: number }>('clothes.delete_outfit', (p, { sim: s }) => {
    s.player.outfits = (s.player.outfits ?? []).filter((o) => o.id !== p?.outfitId);
    return { outfits: s.player.outfits.length };
  });
}
