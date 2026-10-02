/**
 * Clothes bought, taken back, cleaned and put together (`systems/clothing.ts`,
 * from 2026-10-01): real retailers' products at their prices and the tax
 * where they're bought, a store only where there's one, an order at the
 * retailer's fee and days, a return inside its window unworn, the dry
 * cleaner's prices and days, outfits from what's to hand, and the clothes a
 * life begins with.
 */
import { describe, expect, it } from 'vitest';
import { loadSave, quickSave } from '@/engine';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { MS_DAY } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { CLOTHING_PRODUCTS } from '@/engine/content/clothingcatalog';
import { buyRefusal, cancelRefusal, checkoutQuote, checkoutRefusal, clothingCatalog, clothingTax, dryCleanPrice, productPrice, purchaseItems, purchaseQuote, retailerById, STARTER, starterWardrobe } from '@/engine/systems/clothing';
import { arrange } from '@/engine/systems/catalog';
import { cleanOutfits, garmentsOf, outfitFor, washableDirty, wearTheDay } from '@/engine/systems/wardrobe';
import { sizeFor } from '@/engine/systems/tailoring';
import { reachable } from '@/engine/systems/items';
import { ordersOf } from '@/engine/systems/orders';

const life = (seed: string, city = 'us-ny-newyork') => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const bank = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
const tee = CLOTHING_PRODUCTS.find((p) => p.id === 'us-uniqlo-supima-cotton-t-shirt')!;

describe('the clothes on sale', () => {
  it('are the market’s where they are, cheapest first, tax in where it’s added', () => {
    const sim = life('cat-ny');
    const list = arrange(clothingCatalog(sim, 'us-ny-newyork'));
    expect(list.length).toBeGreaterThan(200);
    expect(list.every((e) => (e.value as { market: string }).market === 'US')).toBe(true);
    for (let i = 1; i < list.length; i += 1) expect(list[i]!.price!).toBeGreaterThanOrEqual(list[i - 1]!.price!);
    // New York doesn't tax clothing under $110 an item; Los Angeles taxes it at 9.75%.
    expect(productPrice(sim, 'us-ny-newyork', tee)).toBe(2490);
    expect(productPrice(sim, 'us-ca-losangeles', tee)).toBe(Math.round(2490 * 1.0975));
    const dear = CLOTHING_PRODUCTS.find((p) => p.market === 'US' && p.price >= 110)!;
    expect(clothingTax('us-ny-newyork', sim.now, dear)).toBeCloseTo(dear.price * 0.08875, 6);
    // Massachusetts taxes what's over $175.
    expect(clothingTax('us-ma-boston', sim.now, { ...dear, price: 200 })).toBeCloseTo(0.0625 * 25, 6);
    // Nowhere SLATE has retailers, nothing on sale.
    expect(clothingCatalog(sim, 'is-39-mosfellsbr')).toHaveLength(0);
  });

  it('in Britain at the price on the tag, VAT in', () => {
    const sim = life('cat-ldn', 'uk-eng-london');
    const p = CLOTHING_PRODUCTS.find((x) => x.market === 'GB')!;
    expect(productPrice(sim, 'uk-eng-london', p)).toBe(Math.round(p.price * 100));
  });
});

describe('buying', () => {
  it('in a store where there is one: paid, each of a pack its own garment, carried home', () => {
    const sim = life('buy-store');
    const before = bank(sim);
    const garments = garmentsOf(sim.player).length;
    sim.must({ kind: 'clothes.buy', payload: { productId: tee.id, how: 'store', size: 'M', color: tee.colors[0], quantity: 2 } });
    expect(before - bank(sim)).toBe(2 * 2490);
    const bought = sim.player.clothesBought![0]!;
    const items = purchaseItems(sim.player, bought.id);
    expect(items).toHaveLength(2);
    expect(garmentsOf(sim.player).length).toBe(garments + 2);
    expect(items.every((i) => i.at.kind === 'home' && reachable(sim, sim.player, i.at) && i.spec?.size === 'M')).toBe(true);
    // A pack is that many garments.
    const pack = CLOTHING_PRODUCTS.find((p) => p.retailer === 'us-old-navy' && p.pack > 1)!;
    sim.must({ kind: 'clothes.buy', payload: { productId: pack.id, how: 'store', size: pack.sizes[0], color: pack.colors[0] } });
    expect(purchaseItems(sim.player, sim.player.clothesBought![1]!.id)).toHaveLength(pack.pack);
  });

  it('refuses a size or color it doesn’t come in, a store that isn’t there, and a retailer that doesn’t deliver', () => {
    const sim = life('buy-no');
    expect(buyRefusal(sim.player, { productId: tee.id, how: 'store', size: 'XXXXL', color: tee.colors[0] })).toBe('Choose one of its sizes.');
    expect(buyRefusal(sim.player, { productId: tee.id, how: 'store', size: 'M', color: 'Plaid' })).toBe('Choose one of its colors.');
    expect(buyRefusal(sim.player, { productId: tee.id, how: 'store', size: 'M', color: tee.colors[0] })).toBeUndefined();
    sim.player.currentLocationId = 'us-ny-hudson';
    expect(buyRefusal(sim.player, { productId: tee.id, how: 'store', size: 'M', color: tee.colors[0] })).toMatch(/no Uniqlo store/);
    const primark = CLOTHING_PRODUCTS.find((p) => p.retailer === 'gb-primark')!;
    const london = life('buy-primark', 'uk-eng-london');
    expect(buyRefusal(london.player, { productId: primark.id, how: 'online', size: primark.sizes[0], color: primark.colors[0] })).toMatch(/doesn’t deliver/);
    // A retailer delivers in its own country.
    expect(buyRefusal(london.player, { productId: tee.id, how: 'online', size: 'M', color: tee.colors[0] })).toMatch(/its own country/);
  });

  it('online at the retailer’s fee, free over its threshold, arriving in its working days', () => {
    const sim = life('buy-online');
    const uniqlo = retailerById('us-uniqlo')!;
    const one = purchaseQuote(sim, sim.player, { productId: tee.id, how: 'online', size: 'M', color: tee.colors[0] })!;
    expect(one.delivery).toBe(Math.round(uniqlo.fee! * 100));
    // Five working days are seven on the calendar.
    expect(one.arrivesAt! - sim.now).toBe(7 * MS_DAY);
    const four = purchaseQuote(sim, sim.player, { productId: tee.id, how: 'online', size: 'M', color: tee.colors[0], quantity: 4 })!;
    expect(4 * tee.price).toBeGreaterThanOrEqual(uniqlo.freeOver!);
    expect(four.delivery).toBe(0);
    // In their own size, so it isn't replaced as soon as it's home (`sizeFor`, from 2026-10-02).
    sim.must({ kind: 'clothes.buy', payload: { productId: tee.id, how: 'online', size: sizeFor(sim, sim.player, tee.sizes), color: tee.colors[0] } });
    const items = purchaseItems(sim.player, sim.player.clothesBought![0]!.id);
    expect(items[0]!.at.kind).toBe('order');
    sim.advanceBy(7 * MS_DAY + 60_000);
    expect(items[0]!.at.kind).toBe('home');
  });
});

describe('browsing', () => {
  it('filters by the department and the retailer’s own type of garment', () => {
    const sim = life('browse');
    const entries = clothingCatalog(sim, 'us-ny-newyork');
    const jewelry = arrange(entries, { filters: { department: 'jewelry' } });
    expect(jewelry.length).toBeGreaterThan(0);
    expect(jewelry.every((e) => e.value.category === 'jewelry')).toBe(true);
    const jeans = arrange(entries, { filters: { type: 'jeans' } });
    expect(jeans.length).toBeGreaterThan(0);
    expect(jeans.every((e) => e.value.subcategory === 'jeans')).toBe(true);
  });
});

describe('the basket', () => {
  it('checks a retailer out at once: one payment, one order, one delivery, free once the order passes the threshold', () => {
    const sim = life('basket');
    const uniqlo = retailerById('us-uniqlo')!;
    const size = sizeFor(sim, sim.player, tee.sizes);
    const line = { productId: tee.id, how: 'online' as const, size, color: tee.colors[0] };
    // Two tees alone are under Uniqlo's free delivery; four are over it, together as one order.
    expect(2 * tee.price).toBeLessThan(uniqlo.freeOver!);
    for (let i = 0; i < 4; i += 1) sim.must({ kind: 'clothes.basket_add', payload: line });
    expect(sim.player.basket).toHaveLength(4);
    const q = checkoutQuote(sim, sim.player, sim.player.basket!)!;
    expect(q.delivery).toBe(0);
    // Each bought on its own would have paid four deliveries.
    expect(purchaseQuote(sim, sim.player, line)!.delivery).toBe(Math.round(uniqlo.fee! * 100));
    const removed = sim.player.basket![3]!.id;
    sim.must({ kind: 'clothes.basket_remove', payload: { lineId: removed } });
    sim.must({ kind: 'clothes.basket_add', payload: line });
    const before = bank(sim);
    const orders = ordersOf(sim.player).length;
    const r = sim.must<{ purchaseIds: string[]; paid: number }>({ kind: 'clothes.checkout', payload: { retailerId: 'us-uniqlo', how: 'online' } });
    expect(r.purchaseIds).toHaveLength(4);
    expect(bank(sim)).toBe(before - r.paid);
    expect(r.paid).toBe(q.total);
    expect(ordersOf(sim.player).length).toBe(orders + 1);
    expect(sim.universe.transactions.at(-1)!.memo).toBe('Uniqlo: 4 items');
    expect(sim.player.basket).toEqual([]);
    expect(sim.execute({ kind: 'clothes.checkout', payload: { retailerId: 'us-uniqlo', how: 'online' } }).error).toBe('The basket is empty.');
  });

  it('is one retailer’s at a time, and a British order called off goes whole', () => {
    const sim = life('basket-gb', 'uk-eng-london');
    const ok = (x: (typeof CLOTHING_PRODUCTS)[number]) => !buyRefusal(sim.player, { productId: x.id, how: 'online', size: sizeFor(sim, sim.player, x.sizes), color: x.colors[0] });
    const p = CLOTHING_PRODUCTS.find((x) => x.market === 'GB' && retailerById(x.retailer)!.delivers && ok(x))!;
    const other = CLOTHING_PRODUCTS.find((x) => x.market === 'GB' && x.retailer !== p.retailer && retailerById(x.retailer)!.delivers && ok(x))!;
    const line = (x: typeof p) => ({ productId: x.id, how: 'online' as const, size: sizeFor(sim, sim.player, x.sizes), color: x.colors[0] });
    expect(checkoutRefusal(sim.player, [line(p), line(other)])).toBe('A checkout is one retailer’s, in a store or online.');
    sim.must({ kind: 'clothes.basket_add', payload: line(p) });
    sim.must({ kind: 'clothes.basket_add', payload: line(p) });
    const [a, b] = sim.must<{ purchaseIds: string[] }>({ kind: 'clothes.checkout', payload: { retailerId: p.retailer, how: 'online' } }).purchaseIds;
    sim.must({ kind: 'clothes.cancel', payload: { purchaseId: a } });
    const bought = sim.player.clothesBought!;
    expect(bought.find((x) => x.id === b)!.canceledAt).toBe(sim.now);
    expect(sim.execute({ kind: 'clothes.cancel', payload: { purchaseId: b } }).error).toBe('It’s called off already.');
  });

  it('won’t take what can’t be bought, and an order goes back as returned only when all of it has', () => {
    const sim = life('basket-return');
    expect(sim.execute({ kind: 'clothes.basket_add', payload: { productId: tee.id, how: 'online', size: 'XXXXL', color: tee.colors[0] } }).error).toBe('Choose one of its sizes.');
    const line = { productId: tee.id, how: 'online' as const, size: sizeFor(sim, sim.player, tee.sizes), color: tee.colors[0] };
    sim.must({ kind: 'clothes.basket_add', payload: line });
    sim.must({ kind: 'clothes.basket_add', payload: line });
    const [a, b] = sim.must<{ purchaseIds: string[] }>({ kind: 'clothes.checkout', payload: { retailerId: 'us-uniqlo', how: 'online' } }).purchaseIds;
    sim.advanceBy(8 * MS_DAY);
    const order = ordersOf(sim.player).at(-1)!;
    sim.must({ kind: 'clothes.return', payload: { purchaseId: a, how: 'mail' } });
    expect(order.status).toBe('delivered');
    sim.must({ kind: 'clothes.return', payload: { purchaseId: b, how: 'mail' } });
    expect(order.status).toBe('returned');
  });
});

describe('an order called off, or sent back', () => {
  it('in Britain, before it comes, by law: refunded whole, delivery too, and never delivered', () => {
    const sim = life('cancel-gb', 'uk-eng-london');
    const p = CLOTHING_PRODUCTS.find((x) => x.market === 'GB' && retailerById(x.retailer)!.delivers && !buyRefusal(sim.player, { productId: x.id, how: 'online', size: sizeFor(sim, sim.player, x.sizes), color: x.colors[0] }))!;
    const before = bank(sim);
    sim.must({ kind: 'clothes.buy', payload: { productId: p.id, how: 'online', size: sizeFor(sim, sim.player, p.sizes), color: p.colors[0] } });
    const bought = sim.player.clothesBought!.at(-1)!;
    const order = ordersOf(sim.player).at(-1)!;
    expect(bank(sim)).toBe(before - order.paid);
    expect(cancelRefusal(sim.player, bought.id)).toBeUndefined();
    expect(sim.must<{ refunded: number }>({ kind: 'clothes.cancel', payload: { purchaseId: bought.id } }).refunded).toBe(order.paid);
    expect(bank(sim)).toBe(before);
    expect(order.status).toBe('canceled');
    expect(purchaseItems(sim.player, bought.id)).toHaveLength(0);
    expect(sim.universe.scheduled.some((x) => x.status === 'pending' && x.payload.orderId === order.id)).toBe(false);
    expect(sim.execute({ kind: 'clothes.cancel', payload: { purchaseId: bought.id } }).error).toBe('It’s called off already.');
    sim.advanceBy(14 * MS_DAY);
    expect(order.status).toBe('canceled');
    expect(purchaseItems(sim.player, bought.id)).toHaveLength(0);
  });

  it('in America, not by SLATE’s guess at a retailer’s terms; delivered, it goes back, and the order says so', () => {
    const sim = life('cancel-us');
    sim.must({ kind: 'clothes.buy', payload: { productId: tee.id, how: 'online', size: sizeFor(sim, sim.player, tee.sizes), color: tee.colors[0] } });
    const bought = sim.player.clothesBought!.at(-1)!;
    expect(sim.execute({ kind: 'clothes.cancel', payload: { purchaseId: bought.id } }).error).toMatch(/doesn’t know Uniqlo’s terms/);
    sim.advanceBy(7 * MS_DAY + 60_000);
    expect(cancelRefusal(sim.player, bought.id)).toMatch(/delivered/);
    sim.must({ kind: 'clothes.return', payload: { purchaseId: bought.id, how: 'mail' } });
    expect(ordersOf(sim.player).find((o) => o.id === bought.orderId)!.status).toBe('returned');
  });
});

describe('returns', () => {
  it('go back unworn inside the window, the goods refunded, the delivery not', () => {
    const sim = life('return');
    sim.must({ kind: 'clothes.buy', payload: { productId: tee.id, how: 'store', size: 'M', color: tee.colors[0] } });
    const id = sim.player.clothesBought![0]!.id;
    const before = bank(sim);
    sim.must({ kind: 'clothes.return', payload: { purchaseId: id, how: 'store' } });
    expect(bank(sim) - before).toBe(2490);
    expect(purchaseItems(sim.player, id)).toHaveLength(0);
    expect(sim.execute({ kind: 'clothes.return', payload: { purchaseId: id, how: 'store' } }).ok).toBe(false);
  });

  it('not once worn, nor past the window; by mail at its fee', () => {
    const sim = life('return-no');
    const buy = () => { sim.must({ kind: 'clothes.buy', payload: { productId: tee.id, how: 'store', size: 'M', color: tee.colors[0] } }); return sim.player.clothesBought!.at(-1)!.id; };
    const worn = buy();
    purchaseItems(sim.player, worn)[0]!.garment!.wears = 1;
    expect(sim.execute({ kind: 'clothes.return', payload: { purchaseId: worn, how: 'store' } })).toMatchObject({ ok: false });
    const mailed = buy();
    const before = bank(sim);
    sim.must({ kind: 'clothes.return', payload: { purchaseId: mailed, how: 'mail' } });
    expect(bank(sim) - before).toBe(2490 - Math.round(retailerById('us-uniqlo')!.returnByMail! * 100));
    const late = buy();
    sim.advanceBy(31 * MS_DAY);
    const r = sim.execute({ kind: 'clothes.return', payload: { purchaseId: late, how: 'store' } });
    expect(r.ok).toBe(false);
  });
});

describe('the dry cleaner', () => {
  it('takes what’s dry-clean-only at its prices, keeps it its days, and it’s collected in the town', () => {
    const sim = life('dryclean');
    const suit = CLOTHING_PRODUCTS.find((p) => p.market === 'US' && p.slot === 'suit' && retailerById(p.retailer)!.storesIn.includes('us-ny-newyork'))!;
    sim.must({ kind: 'clothes.buy', payload: { productId: suit.id, how: 'store', size: suit.sizes[0], color: suit.colors[0] } });
    const item = purchaseItems(sim.player, sim.player.clothesBought![0]!.id)[0]! as Parameters<typeof dryCleanPrice>[2];
    item.garment.care = 'dry-clean';
    item.garment.dirty = true;
    // Morris Cleaners, New York: $19 a two-piece suit.
    expect(dryCleanPrice(sim, 'us-ny-newyork', item)).toEqual({ price: 1900, estimate: false });
    const before = bank(sim);
    sim.must({ kind: 'clothes.dry_clean', payload: {} });
    expect(before - bank(sim)).toBe(1900);
    expect(reachable(sim, sim.player, item.at)).toBe(false);
    expect(sim.execute({ kind: 'clothes.collect', payload: {} }).ok).toBe(false);
    sim.advanceBy(2 * MS_DAY + 60_000);
    sim.must({ kind: 'clothes.collect', payload: {} });
    expect(reachable(sim, sim.player, item.at)).toBe(true);
    expect(item.garment.dirty).toBe(false);
    // A town with no list of its own: New York's at its cost of living, said to be an estimate.
    expect(dryCleanPrice(sim, 'us-tx-houston', item).estimate).toBe(true);
  });
});

describe('outfits', () => {
  it('are put together from what’s to hand, one to a part, and worn when chosen', () => {
    const sim = life('outfit');
    const g = garmentsOf(sim.player);
    const top = g.find((x) => x.garment.slot === 'top')!;
    const top2 = g.filter((x) => x.garment.slot === 'top')[1]!;
    const bottom = g.find((x) => x.garment.kind === 'trousers')!;
    expect(sim.execute({ kind: 'clothes.save_outfit', payload: { name: 'Two Tops', itemIds: [top.id, top2.id] } }).ok).toBe(false);
    sim.must({ kind: 'clothes.save_outfit', payload: { name: 'Audition', itemIds: [top.id, bottom.id] } });
    const outfit = sim.player.outfits![0]!;
    sim.must({ kind: 'clothes.wear_outfit', payload: { outfitId: outfit.id } });
    expect(outfitFor(sim, sim.player)!.map((x) => x.id)).toEqual(expect.arrayContaining([top.id, bottom.id]));
    sim.must({ kind: 'clothes.delete_outfit', payload: { outfitId: outfit.id } });
    expect(sim.player.outfits).toHaveLength(0);
    // Away from home, the wardrobe isn't to hand to build one from.
    sim.player.currentLocationId = 'us-ca-losangeles';
    expect(sim.execute({ kind: 'clothes.save_outfit', payload: { name: 'Away', itemIds: [top.id] } }).ok).toBe(false);
  });
});

describe('the clothes a life begins with', () => {
  it('are a wardrobe of garments at home, once', () => {
    const sim = life('starter');
    const count = STARTER.reduce((s, x) => s + x.count, 0);
    expect(garmentsOf(sim.player)).toHaveLength(count);
    expect(outfitFor(sim, sim.player)).toBeDefined();
  });

  it('replace a save’s count of outfits, its dirty ones worn into it', () => {
    const sim = life('starter-old');
    sim.player.items = (sim.player.items ?? []).filter((i) => !i.garment);
    delete sim.player.clothesSince;
    sim.player.living = { clean: 4, dirty: 10, drying: [], tidy: 80 };
    const old = loadSave(deserialise(serialise(sim.universe)));
    expect(garmentsOf(old.player).length).toBeGreaterThan(0);
    expect(old.player.living!.clean).toBeUndefined();
    expect(garmentsOf(old.player).filter((x) => x.garment.dirty).length).toBeGreaterThan(0);
  });
});

describe('what each rule refuses', () => {
  const buyTee = (sim: Simulation, quantity = 1) => { sim.must({ kind: 'clothes.buy', payload: { productId: tee.id, how: 'store', size: 'M', color: tee.colors[0], quantity } }); return sim.player.clothesBought!.at(-1)!.id; };
  const back = (sim: Simulation, purchaseId: string, how: 'store' | 'mail') => sim.execute({ kind: 'clothes.return', payload: { purchaseId, how } }).error;

  it('an order with no home to send it to, and more than ten at a time', () => {
    const sim = life('rule-buy');
    expect(buyRefusal(sim.player, { productId: tee.id, how: 'store', size: 'M', color: tee.colors[0], quantity: 11 })).toBe('From one to ten at a time.');
    sim.player.home = { ...sim.player.home!, kind: 'sofa' };
    expect(buyRefusal(sim.player, { productId: tee.id, how: 'online', size: 'M', color: tee.colors[0] })).toBe('An order needs a home to be sent to.');
  });

  it('a return gone back, not arrived, late, broken up, out of reach, or where no store takes it', () => {
    const sim = life('rule-return');
    const once = buyTee(sim);
    sim.must({ kind: 'clothes.return', payload: { purchaseId: once, how: 'store' } });
    expect(back(sim, once, 'store')).toBe('It’s gone back.');
    sim.must({ kind: 'clothes.buy', payload: { productId: tee.id, how: 'online', size: 'M', color: tee.colors[0] } });
    expect(back(sim, sim.player.clothesBought!.at(-1)!.id, 'mail')).toBe('It hasn’t arrived yet.');
    const pair = buyTee(sim, 2);
    sim.player.items = sim.player.items!.filter((i) => i.id !== purchaseItems(sim.player, pair)[0]!.id);
    expect(back(sim, pair, 'store')).toBe('A purchase goes back whole, and some of it is gone.');
    const away = buyTee(sim);
    sim.player.currentLocationId = 'us-ny-hudson';
    expect(back(sim, away, 'mail')).toBe('It needs to be to hand.');
    for (const i of purchaseItems(sim.player, away)) i.at = { kind: 'person' };
    expect(back(sim, away, 'store')).toBe('SLATE knows of no Uniqlo store here.');
    sim.player.currentLocationId = 'us-ny-newyork';
    const levis = CLOTHING_PRODUCTS.find((p) => p.retailer === 'us-levis')!;
    sim.must({ kind: 'clothes.buy', payload: { productId: levis.id, how: 'store', size: levis.sizes[0], color: levis.colors[0] } });
    expect(back(sim, sim.player.clothesBought!.at(-1)!.id, 'store')).toBe('Levi\'s takes returns by mail.');
    const late = buyTee(sim);
    // Bought thirty-one days ago.
    sim.player.clothesBought!.at(-1)!.at -= 31 * MS_DAY;
    expect(back(sim, late, 'store')).toBe('Uniqlo takes things back for 30 days.');
  });

  it('a suit or a dress worn with a top or a bottom', () => {
    const sim = life('rule-outfit');
    const g = garmentsOf(sim.player);
    const top = g.find((x) => x.garment.slot === 'top')!;
    const dressP = CLOTHING_PRODUCTS.find((p) => p.market === 'US' && p.slot === 'dress' && retailerById(p.retailer)!.storesIn.includes('us-ny-newyork'))!;
    sim.must({ kind: 'clothes.buy', payload: { productId: dressP.id, how: 'store', size: dressP.sizes[0], color: dressP.colors[0] } });
    const dress = purchaseItems(sim.player, sim.player.clothesBought!.at(-1)!.id)[0]!;
    expect(sim.execute({ kind: 'clothes.dress', payload: { itemIds: [dress.id, top.id] } }).error).toBe('A dress is worn on its own.');
    const suitP = CLOTHING_PRODUCTS.find((p) => p.market === 'US' && p.slot === 'suit' && retailerById(p.retailer)!.storesIn.includes('us-ny-newyork'))!;
    sim.must({ kind: 'clothes.buy', payload: { productId: suitP.id, how: 'store', size: suitP.sizes[0], color: suitP.colors[0] } });
    const whole = purchaseItems(sim.player, sim.player.clothesBought!.at(-1)!.id)[0]!;
    expect(sim.execute({ kind: 'clothes.dress', payload: { itemIds: [whole.id, top.id] } }).error).toBe('A suit is worn on its own, with what goes under it.');
  });
});

describe('the day’s turn of the wardrobe', () => {
  it('gives a life its clothes the first day it has a home, once, and not again when it has none left', () => {
    const sim = life('turn-starter');
    sim.player.items = (sim.player.items ?? []).filter((i) => !i.garment);
    delete sim.player.clothesSince;
    sim.advanceBy(MS_DAY);
    expect(garmentsOf(sim.player).length).toBeGreaterThan(0);
    sim.player.items = (sim.player.items ?? []).filter((i) => !i.garment);
    expect(starterWardrobe(sim, sim.player)).toBe(false);
  });

  it('does the washing on a free day when it’s down to the last outfit', () => {
    const sim = life('turn-wash');
    let worn = 0;
    while (cleanOutfits(sim, sim.player) > 1 && worn < 30) { wearTheDay(sim, sim.player); worn += 1; }
    expect(washableDirty(sim, sim.player).length).toBeGreaterThan(0);
    sim.advanceBy(MS_DAY);
    expect(washableDirty(sim, sim.player).filter((g) => g.garment.wears > 1 || g.garment.kind !== 'jeans').length).toBeLessThan(5);
  });
});

describe('a refund', () => {
  it('goes back to what paid: the bank where it paid, the card where that did', () => {
    const sim = life('refund-card');
    const p = sim.player;
    const card = Object.values(sim.universe.accounts).find((a) => a.ownerId === p.id && a.kind === 'credit_card' && !a.closedAt)!;
    const checking = Object.values(sim.universe.accounts).find((a) => a.ownerId === p.id && a.kind === 'checking' && !a.closedAt)!;
    const tee = CLOTHING_PRODUCTS.find((x) => x.retailer === 'us-uniqlo' && x.slot === 'top' && x.sizes.includes('M'))!;
    const buy = () => { sim.must({ kind: 'clothes.buy', payload: { productId: tee.id, how: 'store', size: 'M', color: tee.colors[0], quantity: 1 } }); return p.clothesBought!.at(-1)!; };
    const first = buy();
    expect(first.paidFrom).toEqual([{ accountId: checking.id, share: 1 }]);
    // Paid on the card, it goes back on the card.
    const second = buy();
    second.paidFrom = [{ accountId: card.id, share: 1 }];
    const cardBefore = card.balance;
    const bankBefore = checking.balance;
    sim.must({ kind: 'clothes.return', payload: { purchaseId: second.id, how: 'store' } });
    expect(card.balance - cardBefore).toBe(second.goods);
    expect(checking.balance).toBe(bankBefore);
    // Split, it's split back the same.
    const third = buy();
    third.paidFrom = [{ accountId: card.id, share: 0.25 }, { accountId: checking.id, share: 0.75 }];
    const c2 = card.balance;
    const b2 = checking.balance;
    sim.must({ kind: 'clothes.return', payload: { purchaseId: third.id, how: 'store' } });
    expect(card.balance - c2 + checking.balance - b2).toBe(third.goods);
    expect(card.balance - c2).toBe(Math.round(third.goods * 0.25));
  });
});
