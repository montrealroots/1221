/**
 * The clothes journey (the owner's audit of 2026-10-06): lives run through
 * the Clothes, Routines and Calendar screens by the same commands those
 * screens run, each step reading what the one before it left.
 *
 * - **A wardrobe in New York**: measured, and the tee's size read off
 *   Uniqlo's chart by it; a basket filled, a line taken out, checked out
 *   online for one payment and one delivery; not to be called off (SLATE
 *   holds no American retailer's terms) nor sent back before it comes; a tee
 *   in store; saved and loaded; the order delivered, sent back by mail at
 *   Uniqlo's $7, and the store tee refused past its 30 days. A tee a size
 *   too big taken in at Mid City Tailoring, away its fourteen days and
 *   collected.
 * - **Worn and washed**: a dry-clean-only sweater changed into until it
 *   needs the cleaner, refused the laundry basket, taken in at the town's
 *   price, ready in two days and collected; tees put in the basket and
 *   washed, dried on the rack with the dryer not run, then in the dryer.
 *   Dressed, an outfit saved, worn by a routine at the hour it's set for,
 *   saved and loaded; the outfit deleted and the routine with it stopping
 *   at the step, the routine deleted and its hour no longer stopping the
 *   clock.
 * - **Jordans**: a used pair bought on GOAT at its ask and shipping, not to
 *   hand to sell until it comes, nor while it's worn, then sold at the ask
 *   less GOAT's fees.
 * - **In London**: an order called off as British law allows, refunded
 *   whole with its delivery, and never delivered; an order collected in
 *   store and sent back by mail, as Uniqlo UK takes them; another left past
 *   its hold, sent back and refunded; a third called off before it was
 *   ready, and refunded once; a Tissot
 *   automatic bought at Selfridges and serviced at Tissot's £175, away three
 *   weeks and home.
 * - **Looking after yourself**: a shampoo bought and chosen to use first, a
 *   razor, cream and hairspray bought; shaving, styling and makeup set and
 *   a short shower, each read by the next wash; all of them cleared, and
 *   the next wash uses none of it and meters the longer shower. A barber's
 *   cut at its price and tip.
 * - **The calendar**: a plan called off, which then never stops the clock;
 *   another skipped once it comes, and neither settled twice.
 *
 * Every case ends with every law of the world holding. Nothing here sets a
 * balance; the money moved is the engine's own. One step the game gets wrong
 * is kept apart, skipped, as a defect: a tailor takes in a garment that
 * hasn't been delivered.
 */
import { describe, expect, it } from 'vitest';
import { loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned, normalDate, zonedParts } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { breaches } from '@/engine/core/invariants';
import { CLOTHING_PRODUCTS } from '@/engine/content/clothingcatalog';
import { CLICK_COLLECT } from '@/engine/content/clickcollect';
import { DRY_CLEAN_DAYS } from '@/engine/content/garmentservices';
import { CANCEL_BY_LAW, basketOf, buyRefusal, checkoutQuote, dryCleanPrice, productPrice, purchaseItems, retailerById, returnFee } from '@/engine/systems/clothing';
import { alterCost, fitOf, sizeFor, tailorById } from '@/engine/systems/tailoring';
import { garmentsOf, type Garment } from '@/engine/systems/wardrobe';
import { LAUNDRY, laundryWay } from '@/engine/systems/dwelling';
import { itemById, type Item } from '@/engine/systems/items';
import { ordersOf } from '@/engine/systems/orders';
import { goatPayout, sneakerOffers } from '@/engine/systems/sneakers';
import { SERVICE_AWAY_DAYS, servicePrice } from '@/engine/systems/watches';
import { SHAVE, USE, groomingQuote, razorShaves, salonById, suppliesOf, toiletryById, toiletryPrice } from '@/engine/systems/hygiene';
import { SHOWER_MINUTES } from '@/engine/systems/water';
import { COSMETIC_G_A_DAY } from '@/engine/content/hygiene';
import { ROUTINE_DUE_KIND, runRoutine } from '@/engine/systems/routines';
import { PLAN_KIND, type PlanResult } from '@/engine/world/plans';

const NY = 'us-ny-newyork';
const LDN = 'uk-eng-london';
const life = (seed: string, city = NY) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
/** What the bank holds: checking and savings, which a payment from the bank draws on. */
const banked = (sim: Simulation) => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && !a.nominal && !a.closedAt && (a.kind === 'checking' || a.kind === 'savings')).reduce((s, a) => s + a.balance, 0);
/** An hour of a day some days on, in the life's zone. */
const dayAt = (sim: Simulation, days: number, hour: number) => { const p = zonedParts(sim.now + days * MS_DAY, sim.zone); return instantFromZoned({ ...normalDate(p.year, p.month, p.day), hour }, sim.zone); };
const garment = (sim: Simulation, id: string) => itemById(sim.player, id) as (Item & { garment: Garment }) | undefined;
const pending = (sim: Simulation, kind: string) => sim.universe.scheduled.filter((s) => s.status === 'pending' && s.kind === kind);
/** Runs the clock to a moment with the screen's stops, each let by as it comes; the kinds that stopped it. */
function playTo(sim: Simulation, target: number): string[] {
  const stops: string[] = [];
  for (let guard = 0; guard < 200 && sim.now < target; guard += 1) {
    const r = sim.advanceTo(target, { stopOnPlayerRequired: true });
    if (!r.interruptedBy) break;
    // The screen deals with what stopped it; here the clock is run on, which works it.
    stops.push(r.interruptedBy.kind);
  }
  return stops;
}

const TEE = CLOTHING_PRODUCTS.find((p) => p.id === 'us-uniqlo-supima-cotton-t-shirt')!;
const SWEATER = CLOTHING_PRODUCTS.find((p) => p.id === 'us-everlane-cable-sweater-in-luxe-merino')!;

describe('a wardrobe in New York', () => {
  it('is measured, filled from a basket checked out once, sent back by mail and refused too late, and a tee too big taken in', () => {
    let sim = life('jc-basket');
    // Measured: the tee's size read off Uniqlo's chart, which the body's mass index put at XL.
    expect(sizeFor(sim, sim.player, TEE.sizes, TEE)).toBe('XL');
    expect(sim.execute({ kind: 'clothes.measures', payload: { chestCm: 90 } }).error).toBe('Choose whose charts to size by.');
    expect(sim.execute({ kind: 'clothes.measures', payload: { department: 'men', chestCm: 300 } }).error).toBe('Each measurement in centimeters, from 40 to 220.');
    expect(sim.execute({ kind: 'clothes.measures', payload: { department: 'men', footCm: 5 } }).error).toBe('A foot in centimeters, from 10 to 40.');
    expect(sim.player.measures).toBeUndefined();
    expect(sim.must<{ kept: boolean }>({ kind: 'clothes.measures', payload: { department: 'men', chestCm: 90 } }).kept).toBe(true);
    const mine = sizeFor(sim, sim.player, TEE.sizes, TEE)!;
    expect(mine).toBe('S');
    // A broader chest, a bigger size: the chart reads the number, not only that there is one.
    sim.must({ kind: 'clothes.measures', payload: { department: 'men', chestCm: 115 } });
    expect(sizeFor(sim, sim.player, TEE.sizes, TEE)).toBe('XL');
    sim.must({ kind: 'clothes.measures', payload: { department: 'men', chestCm: 90 } });

    // The basket: two lines to order, one to buy in the store, refusals adding nothing.
    const online = { productId: TEE.id, how: 'online', size: mine, color: TEE.colors[0] };
    expect(sim.execute({ kind: 'clothes.basket_add', payload: { ...online, size: 'XXXXL' } }).error).toBe('Choose one of its sizes.');
    expect(sim.execute({ kind: 'clothes.basket_add', payload: { ...online, color: undefined } }).error).toBe('Choose one of its colors.');
    expect(sim.execute({ kind: 'clothes.basket_add', payload: { ...online, quantity: 11 } }).error).toBe('From one to ten at a time.');
    const a = sim.must<{ lineId: string }>({ kind: 'clothes.basket_add', payload: { ...online, quantity: 2 } }).lineId;
    const b = sim.must<{ lineId: string }>({ kind: 'clothes.basket_add', payload: { ...online, color: TEE.colors[1] } }).lineId;
    const c = sim.must<{ lineId: string }>({ kind: 'clothes.basket_add', payload: { productId: TEE.id, how: 'store', size: mine, color: TEE.colors[0] } }).lineId;
    expect(basketOf(sim.player).map((l) => l.id)).toEqual([a, b, c]);
    expect(sim.must<{ left: number }>({ kind: 'clothes.basket_remove', payload: { lineId: b } }).left).toBe(2);
    expect(sim.execute({ kind: 'clothes.basket_remove', payload: { lineId: b } }).error).toBe('That isn’t in the basket.');

    // Checked out online: the two tees' goods and one delivery, $7.99 under Uniqlo's $99, in one payment.
    const quote = checkoutQuote(sim, sim.player, [basketOf(sim.player)[0]!])!;
    expect(quote.goods).toEqual([2 * productPrice(sim, NY, TEE)]);
    expect(quote.delivery).toBe(799);
    let b0 = banked(sim);
    const ordered = sim.must<{ purchaseIds: string[]; paid: number }>({ kind: 'clothes.checkout', payload: { retailerId: 'us-uniqlo', how: 'online', payWith: 'debit' } });
    expect(ordered.paid).toBe(quote.total);
    expect(b0 - banked(sim)).toBe(quote.total);
    expect(basketOf(sim.player).map((l) => l.id)).toEqual([c]);
    const [orderedId] = ordered.purchaseIds as [string];
    expect(purchaseItems(sim.player, orderedId).map((i) => i.at.kind)).toEqual(['order', 'order']);
    // Nothing left to order online, and the order neither called off nor sent back before it comes.
    expect(sim.execute({ kind: 'clothes.checkout', payload: { retailerId: 'us-uniqlo', how: 'online' } }).error).toBe('The basket is empty.');
    expect(sim.execute({ kind: 'clothes.cancel', payload: { purchaseId: orderedId } }).error).toBe('SLATE doesn’t know Uniqlo’s terms for calling an order off; it can be returned once it comes.');
    expect(sim.execute({ kind: 'clothes.return', payload: { purchaseId: orderedId, how: 'mail' } }).error).toBe('It hasn’t arrived yet.');
    expect(sim.execute({ kind: 'clothes.cancel', payload: { purchaseId: 'purchase-none' } }).error).toBe('That isn’t something you bought.');
    expect(b0 - banked(sim)).toBe(quote.total);

    // The store line, in hand: its price, home to the wardrobe.
    b0 = banked(sim);
    const inStore = sim.must<{ purchaseIds: string[]; paid: number }>({ kind: 'clothes.checkout', payload: { retailerId: 'us-uniqlo', how: 'store' } });
    expect(inStore.paid).toBe(productPrice(sim, NY, TEE));
    expect(b0 - banked(sim)).toBe(productPrice(sim, NY, TEE));
    const storeId = inStore.purchaseIds[0]!;
    expect(purchaseItems(sim.player, storeId).map((i) => i.at.kind)).toEqual(['home']);
    expect(basketOf(sim.player)).toEqual([]);
    // Bought in a store, it's theirs: returned, not called off.
    expect(sim.execute({ kind: 'clothes.cancel', payload: { purchaseId: storeId } }).error).toBe('Bought in a store, it’s yours: it can be returned.');

    // A tee a size up from theirs: too big, refused at a London tailor, taken in at Mid City's price and days.
    sim.must({ kind: 'clothes.basket_add', payload: { productId: TEE.id, how: 'store', size: TEE.sizes[TEE.sizes.indexOf(mine) + 1], color: TEE.colors[2] } });
    const big = sim.must<{ purchaseIds: string[] }>({ kind: 'clothes.checkout', payload: { retailerId: 'us-uniqlo', how: 'store' } }).purchaseIds[0]!;
    const bigTee = purchaseItems(sim.player, big)[0]! as Item & { garment: Garment };
    expect(fitOf(sim.player, bigTee.garment)).toBe('big');
    expect(sim.execute({ kind: 'clothes.dress', payload: { itemIds: [bigTee.id] } }).error).toBe(`${bigTee.label} is too big now.`);
    expect(sim.execute({ kind: 'clothes.alter', payload: { itemId: bigTee.id, tailorId: 'lq-tailoring-soho-uk-eng-london' } }).error).toBe('The tailor is in another town.');
    const shop = tailorById('mid-city-tailoring-us-ny-newyork')!;
    const fitting = purchaseItems(sim.player, storeId)[0]!;
    expect(sim.execute({ kind: 'clothes.alter', payload: { itemId: fitting.id, tailorId: shop.id } }).error).toBe('It fits.');
    b0 = banked(sim);
    const altered = sim.must<{ readyAt: number; paid: number }>({ kind: 'clothes.alter', payload: { itemId: bigTee.id, tailorId: shop.id } });
    expect(altered.paid).toBe(alterCost(sim, shop));
    expect(altered.paid).toBe(35_00);
    expect(b0 - banked(sim)).toBe(35_00);
    expect(altered.readyAt - sim.now).toBe(14 * MS_DAY);
    expect(fitOf(sim.player, bigTee.garment)).toBe('fits');
    expect(sim.execute({ kind: 'clothes.alter', payload: { itemId: bigTee.id, tailorId: shop.id } }).error).toBe('It fits.');
    expect(sim.execute({ kind: 'clothes.collect', payload: {} }).error).toBe('The dry cleaner here has none of yours ready.');
    expect(b0 - banked(sim)).toBe(35_00);

    // Saved and loaded with an order on its way, a tee at the tailor, and the measurements.
    sim = reload(sim);
    expect(sim.player.measures).toMatchObject({ department: 'men', chestCm: 90 });
    expect(purchaseItems(sim.player, orderedId).map((i) => i.at.kind)).toEqual(['order', 'order']);
    expect(garment(sim, bigTee.id)!.at).toMatchObject({ kind: 'service', serviceId: `tailor:${NY}:${shop.id}`, readyAt: altered.readyAt });

    // Delivered in Uniqlo's five working days, seven on the calendar: both tees home.
    sim.advanceBy(7 * MS_DAY + 60_000);
    expect(purchaseItems(sim.player, orderedId).map((i) => i.at.kind)).toEqual(['home', 'home']);
    // Sent back by mail: the goods less Uniqlo's $7, the delivery kept; once.
    const fee = returnFee(sim, sim.player.clothesBought!.find((x) => x.id === orderedId)!, 'mail')!;
    expect(fee).toBe(7_00);
    b0 = banked(sim);
    expect(sim.must<{ refunded: number }>({ kind: 'clothes.return', payload: { purchaseId: orderedId, how: 'mail' } }).refunded).toBe(quote.goods[0]! - fee);
    expect(banked(sim) - b0).toBe(quote.goods[0]! - fee);
    expect(purchaseItems(sim.player, orderedId)).toEqual([]);
    expect(sim.execute({ kind: 'clothes.return', payload: { purchaseId: orderedId, how: 'mail' } }).error).toBe('It’s gone back.');
    expect(banked(sim) - b0).toBe(quote.goods[0]! - fee);

    // The tailor's fourteen days: collected, home to the wardrobe, and it fits.
    sim.advanceTo(altered.readyAt + 60_000);
    expect(sim.must<{ count: number }>({ kind: 'clothes.collect', payload: {} }).count).toBe(1);
    expect(garment(sim, bigTee.id)!.at).toMatchObject({ kind: 'home', spot: 'wardrobe' });
    expect(sim.execute({ kind: 'clothes.collect', payload: {} }).error).toBe('The dry cleaner here has none of yours ready.');

    // The store tee past Uniqlo's thirty days: refused, nothing refunded.
    sim.advanceTo(sim.player.clothesBought!.find((x) => x.id === storeId)!.at + 30 * MS_DAY + MS_HOUR);
    b0 = banked(sim);
    expect(sim.execute({ kind: 'clothes.return', payload: { purchaseId: storeId, how: 'store' } }).error).toBe('Uniqlo takes things back for 30 days.');
    expect(banked(sim)).toBe(b0);

    // Forgotten, the measurements go, and the size is the body's again.
    expect(sim.must<{ kept: boolean }>({ kind: 'clothes.measures', payload: { clear: true } }).kept).toBe(false);
    expect(sim.player.measures).toBeUndefined();
    expect(sizeFor(sim, sim.player, TEE.sizes, TEE)).not.toBe('S');
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('wears a sweater to the dry cleaner, washes tees on the rack and in the dryer, and dresses by an outfit a routine puts on at its hour', () => {
    // A home with its own washer and dryer, where the rack is a choice: seeds jc-wear-0 to 7 scanned, 1 the first (0 has a building's laundry room).
    let sim = life('jc-wear-1');
    expect(laundryWay(sim, sim.player)).toBe('in-unit');
    // The sweater, dry-clean only, bought in store at its price and New York's tax over $110.
    const size = sizeFor(sim, sim.player, SWEATER.sizes, SWEATER)!;
    sim.must({ kind: 'clothes.basket_add', payload: { productId: SWEATER.id, how: 'store', size, color: SWEATER.colors[0] } });
    let b0 = banked(sim);
    const bought = sim.must<{ purchaseIds: string[]; paid: number }>({ kind: 'clothes.checkout', payload: { retailerId: SWEATER.retailer, how: 'store' } });
    expect(bought.paid).toBe(productPrice(sim, NY, SWEATER));
    expect(bought.paid).toBe(Math.round(198 * 1.08875 * 100));
    expect(b0 - banked(sim)).toBe(bought.paid);
    const sweater = purchaseItems(sim.player, bought.purchaseIds[0]!)[0]! as Item & { garment: Garment };
    expect(sweater.garment.care).toBe('dry-clean');

    // Changed into three times it's still clean: nothing for the cleaner. The fourth, past 3.5 wears, it is.
    for (let i = 0; i < 3; i += 1) sim.must({ kind: 'clothes.change', payload: { itemIds: [sweater.id] } });
    expect(sim.execute({ kind: 'clothes.dry_clean', payload: {} }).error).toBe('None of your clothes need the dry cleaner.');
    sim.must({ kind: 'clothes.change', payload: { itemIds: [sweater.id] } });
    expect(sweater.garment.dirty).toBe(true);
    expect(sim.execute({ kind: 'clothes.dress', payload: { itemIds: [sweater.id] } }).error).toBe(`${sweater.label} is in the wash.`);
    expect(sim.execute({ kind: 'clothes.to_basket', payload: { itemIds: [sweater.id] } }).error).toBe('It goes to the dry cleaner, not in the wash.');

    // Taken in at the town's price, paid once, ready in two days.
    const price = dryCleanPrice(sim, NY, sweater);
    expect(price.estimate).toBe(false);
    b0 = banked(sim);
    const cleaned = sim.must<{ count: number; paid: number }>({ kind: 'clothes.dry_clean', payload: {} });
    expect(cleaned).toMatchObject({ count: 1, paid: price.price });
    expect(b0 - banked(sim)).toBe(price.price);
    expect(sim.execute({ kind: 'clothes.dry_clean', payload: {} }).error).toBe('None of your clothes need the dry cleaner.');
    expect(b0 - banked(sim)).toBe(price.price);
    expect(sim.execute({ kind: 'clothes.collect', payload: {} }).error).toBe('The dry cleaner here has none of yours ready.');
    expect(sim.execute({ kind: 'clothes.dress', payload: { itemIds: [sweater.id] } }).error).toBe(`${sweater.label} isn’t to hand.`);
    sim = reload(sim);
    sim.advanceBy(DRY_CLEAN_DAYS * MS_DAY + 60_000);
    expect(sim.universe.notifications.some((n) => n.title === 'Dry Cleaning Ready')).toBe(true);
    expect(sim.must<{ count: number }>({ kind: 'clothes.collect', payload: {} }).count).toBe(1);
    const back = garment(sim, sweater.id)!;
    expect(back.at).toMatchObject({ kind: 'home', spot: 'wardrobe' });
    expect(back.garment).toMatchObject({ dirty: false, wears: 0, washes: 1 });

    // Two tees put in the basket by hand, clean as they were: in it, and not twice.
    const tees = garmentsOf(sim.player).filter((g) => g.garment.kind === 't-shirt' && !g.garment.dirty && g.at.kind === 'home').slice(0, 3);
    expect(sim.execute({ kind: 'clothes.to_basket', payload: { itemIds: [] } }).error).toBe('Choose what goes in.');
    expect(sim.must<{ moved: number }>({ kind: 'clothes.to_basket', payload: { itemIds: [tees[0]!.id, tees[1]!.id] } }).moved).toBe(2);
    expect(garment(sim, tees[0]!.id)!.at).toMatchObject({ kind: 'home', spot: 'hamper' });
    expect(garment(sim, tees[0]!.id)!.garment.dirty).toBe(true);
    expect(sim.execute({ kind: 'clothes.to_basket', payload: { itemIds: [tees[0]!.id] } }).error).toBe('It’s in the basket.');

    // Dried on the rack, as a habit: the dryer isn't run, and they're dry by the washer-only home's hours.
    expect(sim.execute({ kind: 'clothes.dry_by', payload: { by: 'line' } }).error).toBe('On the rack or in the dryer.');
    expect(sim.must<{ by: string }>({ kind: 'clothes.dry_by', payload: { by: 'rack' } }).by).toBe('rack');
    const loads = () => ({ ...(sim.player.living?.loads ?? {}) });
    const before = loads();
    const washed = sim.must<{ doneAt: number }>({ kind: 'life.look_after', payload: { action: 'laundry', itemIds: [tees[0]!.id, tees[1]!.id] } });
    expect(loads().washer).toBe((before.washer ?? 0) + 1);
    expect(loads().dryer ?? 0).toBe(before.dryer ?? 0);
    expect(garment(sim, tees[0]!.id)!.garment.dryUntil).toBe(washed.doneAt + LAUNDRY.readyHours['washer-only'] * MS_HOUR);
    expect(garment(sim, tees[0]!.id)!.at).toMatchObject({ spot: 'drawers' });
    // In the dryer again: run, and dry in the in-unit machine's hours.
    expect(sim.must<{ by: string }>({ kind: 'clothes.dry_by', payload: { by: 'tumble' } }).by).toBe('tumble');
    expect(sim.player.laundryDry).toBeUndefined();
    sim.must({ kind: 'clothes.to_basket', payload: { itemIds: [tees[2]!.id] } });
    const tumbled = sim.must<{ doneAt: number }>({ kind: 'life.look_after', payload: { action: 'laundry', itemIds: [tees[2]!.id] } });
    expect(loads().dryer).toBe((before.dryer ?? 0) + 1);
    expect(garment(sim, tees[2]!.id)!.garment.dryUntil).toBe(tumbled.doneAt + LAUNDRY.readyHours['in-unit'] * MS_HOUR);

    // Dressed: a top and trousers chosen; a pair of tops refused.
    const shirt = garmentsOf(sim.player).find((g) => g.garment.kind === 'shirt' && !g.garment.dirty && g.at.kind === 'home')!;
    const trousers = garmentsOf(sim.player).find((g) => g.garment.kind === 'trousers' && !g.garment.dirty && g.at.kind === 'home')!;
    expect(sim.execute({ kind: 'clothes.dress', payload: { itemIds: [shirt.id, tees[2]!.id] } }).error).toBe('A sweater goes over a top; two of the rest don’t layer.');
    expect(sim.must<{ dressed: string[] }>({ kind: 'clothes.dress', payload: { itemIds: [sweater.id, trousers.id] } }).dressed).toEqual([sweater.id, trousers.id]);
    expect(sim.player.dressed).toEqual([sweater.id, trousers.id]);

    // An outfit, and a routine that puts it on at half past seven every day.
    const outfitId = sim.must<{ outfitId: string }>({ kind: 'clothes.save_outfit', payload: { name: 'Office', itemIds: [shirt.id, trousers.id] } }).outfitId;
    expect(sim.execute({ kind: 'clothes.wear_outfit', payload: { outfitId: 'outfit-none' } }).error).toBe('No such outfit.');
    expect(sim.execute({ kind: 'routine.save', payload: { name: 'Morning', steps: [{ kind: 'clothes.buy', payload: {} }] } }).error).toBe('A routine is made of everyday things.');
    expect(sim.execute({ kind: 'routine.save', payload: { name: ' ', steps: [{ kind: 'clothes.wear_outfit', payload: { outfitId } }] } }).error).toBe('Give it a name.');
    const routineId = sim.must<{ routineId: string }>({ kind: 'routine.save', payload: { name: 'Morning', steps: [{ kind: 'clothes.wear_outfit', payload: { outfitId } }] } }).routineId;
    expect(sim.execute({ kind: 'routine.set_time', payload: { routineId, at: { hour: 25, minute: 0, days: [1] } } }).error).toBe('Choose an hour and a minute.');
    expect(sim.execute({ kind: 'routine.set_time', payload: { routineId, at: { hour: 7, minute: 30, days: [] } } }).error).toBe('Choose the days.');
    expect(sim.execute({ kind: 'routine.set_time', payload: { routineId: 'routine-none', at: { hour: 7, minute: 30, days: [1] } } }).error).toBe('No such routine.');
    const next = sim.must<{ next: number }>({ kind: 'routine.set_time', payload: { routineId, at: { hour: 7, minute: 30, days: [0, 1, 2, 3, 4, 5, 6] } } }).next;
    expect(zonedParts(next, sim.zone)).toMatchObject({ hour: 7, minute: 30 });
    expect(pending(sim, ROUTINE_DUE_KIND).map((s) => s.at)).toEqual([next]);
    // Its hour cleared, nothing waits for it; set again, its hour is back.
    expect(sim.must({ kind: 'routine.set_time', payload: { routineId, at: null } })).toEqual({});
    expect(pending(sim, ROUTINE_DUE_KIND)).toEqual([]);
    sim.must({ kind: 'routine.set_time', payload: { routineId, at: { hour: 7, minute: 30, days: [6, 5, 4, 3, 2, 1, 0, 0] } } });
    expect(sim.player.routines![0]!.at).toEqual({ hour: 7, minute: 30, days: [0, 1, 2, 3, 4, 5, 6] });
    expect(pending(sim, ROUTINE_DUE_KIND).map((s) => s.at)).toEqual([next]);

    // Saved and loaded: the outfit, the routine and its hour kept.
    sim = reload(sim);
    expect(sim.player.outfits!.map((o) => o.id)).toEqual([outfitId]);
    expect(pending(sim, ROUTINE_DUE_KIND).map((s) => s.at)).toEqual([next]);

    // Its hour stops the clock, and the screen runs it then: the outfit chosen.
    const stopped = sim.advanceTo(next + MS_HOUR, { stopOnPlayerRequired: true });
    expect(stopped.interruptedBy?.kind).toBe(ROUTINE_DUE_KIND);
    expect(sim.now).toBe(next);
    expect(runRoutine(sim, routineId)).toEqual({ done: 1 });
    expect(sim.player.dressed).toEqual([shirt.id, trousers.id]);
    // Its moment past, the next day's is set.
    sim.advanceBy(60_000);
    expect(pending(sim, ROUTINE_DUE_KIND).map((s) => s.at)).toEqual([next + MS_DAY]);

    // The outfit deleted, once; the routine stops at its step and says why.
    expect(sim.must<{ outfits: number }>({ kind: 'clothes.delete_outfit', payload: { outfitId } }).outfits).toBe(0);
    expect(sim.execute({ kind: 'clothes.delete_outfit', payload: { outfitId } }).error).toBe('There’s no outfit of yours by that name.');
    expect(sim.execute({ kind: 'clothes.wear_outfit', payload: { outfitId } }).error).toBe('No such outfit.');
    expect(runRoutine(sim, routineId)).toEqual({ done: 0, stopped: { step: 0, label: 'Wear An Outfit', error: 'No such outfit.' } });

    // The routine deleted, once: its hour no longer stops the clock.
    expect(sim.must<{ routines: number }>({ kind: 'routine.delete', payload: { routineId } }).routines).toBe(0);
    expect(sim.execute({ kind: 'routine.delete', payload: { routineId } }).error).toBe('There’s no routine of yours by that name.');
    expect(pending(sim, ROUTINE_DUE_KIND)).toEqual([]);
    expect(playTo(sim, next + 2 * MS_DAY + MS_HOUR)).not.toContain(ROUTINE_DUE_KIND);
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('buys a used pair of Jordans on GOAT, and sells it on once it comes', () => {
    let sim = life('jc-jordans');
    const code = 'IF4396-104';
    const offer = sneakerOffers(sim, sim.player, code).find((o) => o.key === 'goat:used')!;
    // GOAT's used ask with New York's tax over $110, and its $14.95 shipping.
    expect(offer.total).toBe(Math.round(158 * 1.08875 * 100) + 14_95);
    expect(sim.execute({ kind: 'sneakers.buy', payload: { styleCode: code, offer: offer.key, size: '99' } }).error).toBe('Choose one of its sizes.');
    expect(sim.execute({ kind: 'sneakers.buy', payload: { styleCode: code, offer: 'goat:nothing', size: '10' } }).error).toBe('That offer isn’t open where you live.');
    let b0 = banked(sim);
    sim.must({ kind: 'sneakers.buy', payload: { styleCode: code, offer: offer.key, size: '10' } });
    expect(b0 - banked(sim)).toBe(offer.total);
    const pair = garmentsOf(sim.player).find((g) => g.spec?.styleCode === code)!;
    expect(pair.at.kind).toBe('order');
    expect(sim.execute({ kind: 'sneakers.sell', payload: { itemId: pair.id } }).error).toBe('It isn’t to hand.');
    sim = reload(sim);
    sim.advanceBy(7 * MS_DAY + 60_000);
    const home = garment(sim, pair.id)!;
    expect(home.at.kind).toBe('home');
    expect(home.spec).toMatchObject({ styleCode: code, size: '10', bought: 'used' });
    // On their feet, it isn't sold; changed out of, it is.
    sim.must({ kind: 'clothes.change', payload: { itemIds: [pair.id] } });
    expect(sim.execute({ kind: 'sneakers.sell', payload: { itemId: pair.id } }).error).toBe('You’re wearing it.');
    const other = garmentsOf(sim.player).find((g) => g.garment.slot === 'shoes' && g.id !== pair.id)!;
    sim.must({ kind: 'clothes.change', payload: { itemIds: [other.id] } });
    // Sold on: GOAT's used ask less 9.5%, the $5 label and 2.9% to cash out; once.
    const q = goatPayout(sim, sim.player, home);
    expect(typeof q).not.toBe('string');
    const expected = Math.round((158 * (1 - 0.095) - 5) * (1 - 0.029) * 100);
    expect((q as { paid: number }).paid).toBe(expected);
    b0 = banked(sim);
    expect(sim.must<{ paid: number }>({ kind: 'sneakers.sell', payload: { itemId: pair.id } }).paid).toBe(expected);
    expect(banked(sim) - b0).toBe(expected);
    expect(garment(sim, pair.id)).toBeUndefined();
    expect(sim.execute({ kind: 'sneakers.sell', payload: { itemId: pair.id } }).error).toBe('That isn’t a pair SLATE can sell on.');
    expect(banked(sim) - b0).toBe(expected);
    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('clothes in London', () => {
  it('calls an order off by law, collects one in store and lets another go back, and has a Tissot serviced', () => {
    let sim = life('jc-london', LDN);
    // An order with a delivery charge on it, from a retailer British law lets a buyer call off.
    const ordered = CLOTHING_PRODUCTS.find((p) => {
      const r = retailerById(p.retailer)!;
      return p.market === 'GB' && CANCEL_BY_LAW[r.market] && r.delivers && (r.fee ?? 0) > 0 && r.freeOver !== null && p.price < r.freeOver && p.sizes.length <= 1 && p.colors.length <= 1 && !buyRefusal(sim.player, { productId: p.id, how: 'online', size: p.sizes[0] });
    })!;
    sim.must({ kind: 'clothes.basket_add', payload: { productId: ordered.id, how: 'online', ...(ordered.sizes[0] ? { size: ordered.sizes[0] } : {}) } });
    const quote = checkoutQuote(sim, sim.player, basketOf(sim.player))!;
    expect(quote.delivery).toBeGreaterThan(0);
    const b0 = banked(sim);
    const orderedId = sim.must<{ purchaseIds: string[]; paid: number }>({ kind: 'clothes.checkout', payload: { retailerId: ordered.retailer, how: 'online' } }).purchaseIds[0]!;
    expect(b0 - banked(sim)).toBe(quote.total);
    // Called off: the goods and the delivery back, once.
    expect(sim.must<{ refunded: number }>({ kind: 'clothes.cancel', payload: { purchaseId: orderedId } }).refunded).toBe(quote.total);
    expect(banked(sim)).toBe(b0);
    expect(sim.execute({ kind: 'clothes.cancel', payload: { purchaseId: orderedId } }).error).toBe('It’s called off already.');
    expect(banked(sim)).toBe(b0);
    const order = ordersOf(sim.player).find((o) => o.id === sim.player.clothesBought!.find((x) => x.id === orderedId)!.orderId)!;
    expect(order.status).toBe('canceled');

    // Collected in store, Uniqlo's next day: refused before it's ready, then home.
    const collectable = CLOTHING_PRODUCTS.filter((p) => p.retailer === 'gb-uniqlo' && p.sizes.length > 0 && !buyRefusal(sim.player, { productId: p.id, how: 'collect', size: p.sizes[0], color: p.colors[0] }));
    const [first, second] = collectable as [typeof collectable[number], typeof collectable[number]];
    const terms = CLICK_COLLECT['gb-uniqlo']!;
    sim.must({ kind: 'clothes.basket_add', payload: { productId: first.id, how: 'collect', size: first.sizes[0], color: first.colors[0] } });
    const firstQuote = checkoutQuote(sim, sim.player, basketOf(sim.player))!;
    expect(firstQuote.delivery).toBe(0);
    const firstId = sim.must<{ purchaseIds: string[] }>({ kind: 'clothes.checkout', payload: { retailerId: 'gb-uniqlo', how: 'collect' } }).purchaseIds[0]!;
    const firstOrder = sim.player.clothesBought!.find((x) => x.id === firstId)!.orderId!;
    expect(sim.execute({ kind: 'clothes.collect_order', payload: { orderId: firstOrder } }).error).toBe('It isn’t ready yet.');
    expect(sim.execute({ kind: 'clothes.collect_order', payload: { orderId: 'order-none' } }).error).toBe('No order of yours is waiting to be collected.');
    // The second, to be left.
    sim.must({ kind: 'clothes.basket_add', payload: { productId: second.id, how: 'collect', size: second.sizes[0], color: second.colors[0] } });
    const secondGoods = checkoutQuote(sim, sim.player, basketOf(sim.player))!.total;
    const secondId = sim.must<{ purchaseIds: string[] }>({ kind: 'clothes.checkout', payload: { retailerId: 'gb-uniqlo', how: 'collect' } }).purchaseIds[0]!;
    // A third, called off before it's ready: refunded whole, and never at the store to be sent back.
    const third = collectable[2]!;
    sim.must({ kind: 'clothes.basket_add', payload: { productId: third.id, how: 'collect', size: third.sizes[0], color: third.colors[0] } });
    const t0 = banked(sim);
    const thirdId = sim.must<{ purchaseIds: string[]; paid: number }>({ kind: 'clothes.checkout', payload: { retailerId: 'gb-uniqlo', how: 'collect' } });
    expect(sim.must<{ refunded: number }>({ kind: 'clothes.cancel', payload: { purchaseId: thirdId.purchaseIds[0]! } }).refunded).toBe(thirdId.paid);
    expect(banked(sim)).toBe(t0);

    // A Tissot automatic, in Selfridges, at its tag.
    const tissot = CLOTHING_PRODUCTS.find((p) => p.id === 'gb-selfridges-tissot-gentleman-38mm-stainless-steel-automatic-watch')!;
    sim.must({ kind: 'clothes.basket_add', payload: { productId: tissot.id, how: 'store', size: tissot.sizes[0] } });
    let w0 = banked(sim);
    const watchBuy = sim.must<{ purchaseIds: string[]; paid: number }>({ kind: 'clothes.checkout', payload: { retailerId: 'gb-selfridges', how: 'store' } });
    expect(watchBuy.paid).toBe(690_00);
    expect(w0 - banked(sim)).toBe(690_00);
    const watch = purchaseItems(sim.player, watchBuy.purchaseIds[0]!)[0]!;
    // Serviced at Tissot's £175, away three weeks; not twice, and a tee isn't a watch.
    expect(servicePrice(sim, sim.player, watch)).toBe(175_00);
    w0 = banked(sim);
    const serviced = sim.must<{ paid: number; back: number }>({ kind: 'watch.service', payload: { itemId: watch.id } });
    expect(serviced.paid).toBe(175_00);
    expect(w0 - banked(sim)).toBe(175_00);
    expect(serviced.back - sim.now).toBe(SERVICE_AWAY_DAYS * MS_DAY);
    expect(sim.execute({ kind: 'watch.service', payload: { itemId: watch.id } }).error).toBe(`The ${watch.label} isn’t to hand.`);
    expect(sim.execute({ kind: 'watch.service', payload: { itemId: garmentsOf(sim.player).find((g) => g.garment.kind === 't-shirt')!.id } }).error).toBe('Only a mechanical watch whose maker’s service SLATE keeps is serviced here.');
    expect(w0 - banked(sim)).toBe(175_00);

    // Saved and loaded with two orders at the store and a watch away.
    sim = reload(sim);
    expect(itemById(sim.player, watch.id)!.at).toMatchObject({ kind: 'service', readyAt: serviced.back });

    // The day after: the first collected, home.
    sim.advanceBy(terms.readyDays * MS_DAY + MS_HOUR);
    expect(sim.must<{ collected: number }>({ kind: 'clothes.collect_order', payload: { orderId: firstOrder } }).collected).toBe(1);
    expect(purchaseItems(sim.player, firstId).map((i) => i.at.kind)).toEqual(['home']);
    expect(sim.execute({ kind: 'clothes.collect_order', payload: { orderId: firstOrder } }).error).toBe('No order of yours is waiting to be collected.');
    // Its window counted from when it was ready: Uniqlo UK takes it back by mail, at its £2.95, not over the counter.
    expect(sim.execute({ kind: 'clothes.return', payload: { purchaseId: firstId, how: 'store' } }).error).toBe('Uniqlo UK takes returns by mail.');
    const r0 = banked(sim);
    expect(sim.must<{ refunded: number }>({ kind: 'clothes.return', payload: { purchaseId: firstId, how: 'mail' } }).refunded).toBe(firstQuote.goods[0]! - 2_95);
    expect(banked(sim) - r0).toBe(firstQuote.goods[0]! - 2_95);
    expect(purchaseItems(sim.player, firstId)).toEqual([]);
    // The second left past Uniqlo's fourteen days: sent back, and its goods refunded.
    sim.advanceBy(terms.holdDays * MS_DAY);
    expect(purchaseItems(sim.player, secondId)).toEqual([]);
    expect(sim.universe.notifications.some((n) => n.title === 'An Order Went Back')).toBe(true);
    const refund = sim.universe.transactions.filter((t) => t.memo === `${retailerById('gb-uniqlo')!.name}: uncollected, refunded`);
    expect(refund).toHaveLength(1);
    expect(refund[0]!.postings.filter((p) => p.amount > 0).reduce((s, p) => s + p.amount, 0)).toBe(secondGoods);

    // The canceled order never came.
    expect(purchaseItems(sim.player, orderedId)).toEqual([]);
    expect(purchaseItems(sim.player, thirdId.purchaseIds[0]!)).toEqual([]);
    expect(sim.universe.transactions.filter((t) => t.memo.endsWith('an order canceled, refunded'))).toHaveLength(2);

    // Three weeks on, the watch is home.
    sim.advanceTo(serviced.back + 60_000);
    expect(itemById(sim.player, watch.id)!.at).toMatchObject({ kind: 'home', spot: 'drawers' });
    expect(itemById(sim.player, watch.id)!.servicedAt).toBe(serviced.back);
    expect(sim.universe.notifications.some((n) => n.title === 'A Watch Back')).toBe(true);
    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('looking after yourself', () => {
  it('buys a shampoo to use first and a shave’s things; the habits set are read by the wash, and cleared are not', () => {
    let sim = life('jc-hygiene');
    sim.advanceTo(dayAt(sim, 1, 10));
    const pantene = toiletryById('thefreshgrocer-pantene-daily-moisture-renewal-shampoo-120oz')!;
    const razor = toiletryById('thefreshgrocer-barbasol-ultra-3-disposable-razors-4-count')!;
    const cream = toiletryById('thefreshgrocer-edge-soothing-aloe-shave-gel-7-oz')!;
    const spray = toiletryById('thefreshgrocer-tresemme-extra-hold-hairspray-11-oz')!;
    expect(sim.execute({ kind: 'hygiene.buy', payload: { productId: pantene.id, quantity: 11 } }).error).toBe('From one to ten.');
    let b0 = banked(sim);
    for (const t of [pantene, razor, cream, spray]) expect(sim.must<{ paid: number }>({ kind: 'hygiene.buy', payload: { productId: t.id, quantity: 1 } }).paid).toBe(toiletryPrice(sim, NY, t));
    expect(b0 - banked(sim)).toBe([pantene, razor, cream, spray].reduce((s, t) => s + toiletryPrice(sim, NY, t), 0));
    const left = (id: string) => suppliesOf(sim.player).filter((i) => i.kind === id).reduce((s, i) => s + i.supply.left, 0);
    const starterShampoo = suppliesOf(sim.player).find((i) => i.supply.kind === 'shampoo' && i.kind !== pantene.id)!.kind;

    // The Pantene first; the habits set, and their refusals.
    expect(sim.execute({ kind: 'hygiene.use_first', payload: { productId: 'no-such-thing' } }).error).toBe('There’s no such product.');
    expect(sim.must<{ kind: string }>({ kind: 'hygiene.use_first', payload: { productId: pantene.id } }).kind).toBe('shampoo');
    expect(sim.execute({ kind: 'hygiene.shave_every', payload: { every: 'hourly' } }).error).toBe('Choose how often.');
    expect(sim.must<{ shaves: string }>({ kind: 'hygiene.shave_every', payload: { every: 'daily' } }).shaves).toBe('daily');
    expect(sim.execute({ kind: 'hygiene.style_every', payload: { every: 'never' } }).error).toBe('Choose how often.');
    expect(sim.must<{ styles: string }>({ kind: 'hygiene.style_every', payload: { every: 'daily' } }).styles).toBe('daily');
    expect(sim.execute({ kind: 'hygiene.makeup_every', payload: { every: 'daily', kinds: [] } }).error).toBe('Choose what you wear.');
    expect(sim.must<{ kinds: string[] }>({ kind: 'hygiene.makeup_every', payload: { every: 'daily', kinds: ['lipstick', 'glitter'] } }).kinds).toEqual(['lipstick']);
    expect(sim.execute({ kind: 'hygiene.shower_minutes', payload: { minutes: 61 } }).error).toBe('A shower is a whole number of minutes, from one to sixty.');
    expect(sim.execute({ kind: 'hygiene.shower_minutes', payload: { minutes: 4.5 } }).error).toBe('A shower is a whole number of minutes, from one to sixty.');
    expect(sim.must<{ minutes: number }>({ kind: 'hygiene.shower_minutes', payload: { minutes: 4 } }).minutes).toBe(4);

    // Saved and loaded with the habits.
    sim = reload(sim);
    expect(sim.player).toMatchObject({ shaves: 'daily', styles: 'daily', makeup: { every: 'daily', kinds: ['lipstick'] }, showerMinutes: 4, usesFirst: { shampoo: pantene.id } });

    // A wash: the Pantene's shampoo, not the other's; a shave's cream and razor; the hairspray's grams; a short shower metered.
    const was = { pantene: left(pantene.id), other: left(starterShampoo), razor: left(razor.id), cream: left(cream.id), spray: left(spray.id), showers: sim.player.living?.showers ?? 0 };
    expect(sim.player.wellbeing.hygiene).toBeLessThan(95);
    sim.must({ kind: 'life.look_after', payload: { action: 'wash' } });
    expect(was.pantene - left(pantene.id)).toBeCloseTo(USE.shampooG, 9);
    expect(left(starterShampoo)).toBe(was.other);
    expect(was.cream - left(cream.id)).toBeCloseTo(SHAVE.creamG, 9);
    expect(was.razor - left(razor.id)).toBeCloseTo(1 / razorShaves(razor.name), 9);
    expect(was.spray - left(spray.id)).toBeCloseTo(COSMETIC_G_A_DAY['hair-styling']!, 9);
    expect(sim.player.lastShave).toBe(sim.now);
    expect(sim.player.lastMakeup).toBe(sim.now);
    expect(sim.player.living!.showers! - was.showers).toBeCloseTo(4 / SHOWER_MINUTES.us!, 9);
    const shavedAt = sim.now;

    // Each cleared, the shower made longer: the next wash a day on shaves, styles and makes up nothing.
    expect(sim.must({ kind: 'hygiene.shave_every', payload: { every: null } })).toEqual({});
    expect(sim.must({ kind: 'hygiene.style_every', payload: { every: null } })).toEqual({});
    expect(sim.must({ kind: 'hygiene.makeup_every', payload: { every: null } })).toEqual({});
    expect(sim.must<{ minutes: number }>({ kind: 'hygiene.shower_minutes', payload: { minutes: 12 } }).minutes).toBe(12);
    sim.advanceTo(dayAt(sim, 1, 18));
    const again = { razor: left(razor.id), cream: left(cream.id), spray: left(spray.id), showers: sim.player.living?.showers ?? 0 };
    expect(sim.player.wellbeing.hygiene).toBeLessThan(95);
    sim.must({ kind: 'life.look_after', payload: { action: 'wash' } });
    expect(left(razor.id)).toBe(again.razor);
    expect(left(cream.id)).toBe(again.cream);
    expect(left(spray.id)).toBe(again.spray);
    expect(sim.player.lastShave).toBe(shavedAt);
    expect(sim.player.lastMakeup).toBe(shavedAt);
    expect(sim.player.living!.showers! - again.showers).toBeCloseTo(12 / SHOWER_MINUTES.us!, 9);
    expect(sim.must({ kind: 'hygiene.shower_minutes', payload: { minutes: null } })).toEqual({});
    expect(sim.player.showerMinutes).toBeUndefined();

    // A barber's cut at its price and New York's 17.5% tip, its minutes; not where the price isn't known, nor in London.
    const shop = salonById('artisan-barbershop-new-york')!;
    const q = groomingQuote(sim, shop, 'mens-cut')!;
    expect(q.price).toBe(37_81);
    expect(sim.execute({ kind: 'hygiene.groom', payload: { salonId: 'supercuts-yorkville-new-york', service: 'mens-cut' } }).error).toBe('SLATE doesn’t know their price for it.');
    const pall = salonById('pall-mall-barbers-trafalgar-square-london')!;
    expect(sim.execute({ kind: 'hygiene.groom', payload: { salonId: pall.id, service: 'mens-cut' } }).error).toBe(`${pall.name} is in another town.`);
    b0 = banked(sim);
    const start = sim.now;
    const cut = sim.must<{ doneAt: number; paid: number }>({ kind: 'hygiene.groom', payload: { salonId: shop.id, service: 'mens-cut' } });
    expect(cut.paid).toBe(q.price + q.tip);
    expect(b0 - banked(sim)).toBe(q.price + q.tip);
    expect(cut.doneAt - start).toBe(q.minutes * 60_000);
    expect(sim.player.groomedAt).toBe(cut.doneAt);
    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('the calendar', () => {
  it('calls one plan off, which then never stops the clock, and skips another once it comes', () => {
    let sim = life('jc-calendar');
    const coffeeAt = dayAt(sim, 1, 11);
    const dentistAt = dayAt(sim, 1, 15);
    const coffee = sim.must<PlanResult>({ kind: 'calendar.schedule', payload: { title: 'Coffee', at: coffeeAt, durationMinutes: 30 } });
    const dentist = sim.must<PlanResult>({ kind: 'calendar.schedule', payload: { title: 'Dentist', at: dentistAt, durationMinutes: 60 } });
    expect(coffee.ok && dentist.ok).toBe(true);
    // Not skipped before it comes; called off, once.
    expect(sim.must<PlanResult>({ kind: 'calendar.skip', payload: { entryId: dentist.id } })).toEqual({ ok: false, error: 'It hasn’t come round yet. Call it off instead.' });
    expect(sim.must<PlanResult>({ kind: 'calendar.cancel', payload: { entryId: coffee.id } })).toEqual({ ok: true, id: coffee.id });
    expect(sim.must<PlanResult>({ kind: 'calendar.cancel', payload: { entryId: coffee.id } })).toEqual({ ok: false, error: 'That’s already settled one way or the other.' });
    expect(sim.must<PlanResult>({ kind: 'calendar.cancel', payload: { entryId: 'sched-none' } })).toEqual({ ok: false, error: 'There’s nothing by that name on the calendar.' });
    // Something on the calendar that isn't a plan of theirs is neither called off nor skipped by them.
    const other = sim.universe.scheduled.find((s) => s.status === 'pending' && s.kind !== PLAN_KIND)!;
    expect(sim.must<PlanResult>({ kind: 'calendar.cancel', payload: { entryId: other.id } })).toEqual({ ok: false, error: 'That one isn’t yours to call off.' });
    expect(sim.must<PlanResult>({ kind: 'calendar.skip', payload: { entryId: other.id } })).toEqual({ ok: false, error: 'That one isn’t yours to walk away from.' });

    sim = reload(sim);
    expect(pending(sim, PLAN_KIND).map((s) => s.id)).toEqual([dentist.id]);

    // The clock run with the screen's stops: the called-off coffee doesn't stop it; the dentist does.
    const r = sim.advanceTo(dentistAt + MS_HOUR, { stopOnPlayerRequired: true });
    const stops: string[] = [];
    let at = r;
    while (at.interruptedBy && at.interruptedBy.id !== dentist.id) { stops.push(at.interruptedBy.id); at = sim.advanceTo(dentistAt + MS_HOUR, { stopOnPlayerRequired: true }); }
    expect(stops).not.toContain(coffee.id);
    expect(at.interruptedBy?.id).toBe(dentist.id);
    expect(sim.now).toBe(dentistAt);
    // Started, it's too late to call off; skipped, once.
    expect(sim.must<PlanResult>({ kind: 'calendar.cancel', payload: { entryId: dentist.id } })).toEqual({ ok: false, error: 'It’s already started. You either went or you didn’t.' });
    expect(sim.must<PlanResult>({ kind: 'calendar.skip', payload: { entryId: dentist.id } })).toEqual({ ok: true, id: dentist.id });
    expect(sim.universe.scheduled.find((s) => s.id === dentist.id)!.status).toBe('missed');
    expect(sim.universe.notifications.some((n) => n.title === 'You Didn’t Go To Dentist')).toBe(true);
    expect(sim.must<PlanResult>({ kind: 'calendar.skip', payload: { entryId: dentist.id } })).toEqual({ ok: false, error: 'That’s already settled one way or the other.' });
    expect(sim.universe.scheduled.find((s) => s.id === coffee.id)!.status).toBe('cancelled');
    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('a tailor, and what isn’t to hand', () => {
  // Found by this journey on 2026-10-06 and fixed: a garment still on its way in an order was taken in by a tailor,
  // Mid City paid its $35 and the tee missing from the order when it came, because `alterRefusal` never asked
  // `reachable` as the basket and an outfit do.
  it('won’t take in a tee that hasn’t been delivered', () => {
    let sim = life('jc-transit');
    const mine = sizeFor(sim, sim.player, TEE.sizes, TEE)!;
    const up = TEE.sizes[TEE.sizes.indexOf(mine) + 1]!;
    sim.must({ kind: 'clothes.basket_add', payload: { productId: TEE.id, how: 'online', size: up, color: TEE.colors[0] } });
    const id = sim.must<{ purchaseIds: string[] }>({ kind: 'clothes.checkout', payload: { retailerId: 'us-uniqlo', how: 'online' } }).purchaseIds[0]!;
    const tee = purchaseItems(sim.player, id)[0]! as Item & { garment: Garment };
    expect(tee.at.kind).toBe('order');
    expect(fitOf(sim.player, tee.garment)).toBe('big');
    const b0 = banked(sim);
    expect(sim.execute({ kind: 'clothes.alter', payload: { itemId: tee.id, tailorId: 'mid-city-tailoring-us-ny-newyork' } }).error).toBe('It hasn’t come yet.');
    expect(banked(sim)).toBe(b0);
    sim = reload(sim);
    sim.advanceBy(7 * MS_DAY + 60_000);
    expect(garment(sim, tee.id)!.at.kind).toBe('home');
    // Home, but they're in a hotel here: not to hand, so not taken in either.
    sim.must({ kind: 'travel.stay_here', payload: { nights: 1 } });
    expect(sim.execute({ kind: 'clothes.alter', payload: { itemId: tee.id, tailorId: 'mid-city-tailoring-us-ny-newyork' } }).error).toBe('It isn’t to hand.');
    sim.must({ kind: 'travel.check_out', payload: {} });
    expect(sim.execute({ kind: 'clothes.alter', payload: { itemId: tee.id, tailorId: 'mid-city-tailoring-us-ny-newyork' } }).ok).toBe(true);
    expect(breaches(sim.universe)).toEqual([]);
  });
});
