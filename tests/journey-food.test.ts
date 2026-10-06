/**
 * The food journey (the owner's audit of 2026-10-06): lives run through the
 * Food screen, and the Homes screen's garden, mower and lights, by the same
 * commands those screens run, each step reading what the one before it left.
 *
 * - **A kitchen in New York**: banana ice cream refused for want of a
 *   blender; the cheapest blender bought, and not a second; what the recipe
 *   is short of bought at its shelf prices, and not again; cooked for four,
 *   three portions to the fridge. Frozen before any is eaten, it isn't heated
 *   frozen; saved and loaded, kept past the fridge's three days, thawed in a
 *   day and eaten, and the rest taken by the day's meals.
 * - **A basket at The Fresh Grocer**: refused after ten at night; chicken,
 *   coffee and a shampoo in, chicken twice as one line, the coffee taken out,
 *   all checked out for one payment, once. A cup from a bag of coffee; one
 *   chicken frozen, the other gone off in the fridge, the frozen one thawed
 *   and to hand a day on. Favorites kept through a save, and one taken off.
 * - **Lights**: a lamp that comes without a bulb burns nothing for a day; a
 *   pack bought and fitted, the dark socket first, and it burns its hours.
 * - **A garden in New York**: a house with a yard bought for cash, a bed and a
 *   greenhouse put in. Peppers in the greenhouse in February, refused in the
 *   bed, picked in April into the kitchen at the greenhouse's yield. Tomatoes
 *   in the bed in May, picked in July. The lawn not mown without a mower; a
 *   corded one bought, its mowing on the month's power. In September tomatoes
 *   refused for the frost; lettuce planted, left ripe, and taken by it.
 * - **Los Angeles**: a car driven to Smart & Final, beer and wine checked out
 *   into it; parked at a garage at its rate and at a meter at the city's;
 *   home, put away, a pint and a glass at home and two at a bar. Dinner at
 *   Bestia at its quote; a table there booked and kept at its hour, the
 *   party's dish each paid once; n/naka's $395 a head paid ahead and kept
 *   when called off; Providence called off inside its week for $375 a head.
 *
 * Every case ends with every law of the world holding. Nothing here sets a
 * balance; the house is bought with a gift posted against the opening
 * balances. Two steps the game gets wrong are kept apart, skipped, as defects:
 * a table counts as kept while a plan runs over its hour, and a drink at home
 * is poured from a can still in the car at the shops.
 */
import { describe, expect, it } from 'vitest';
import { loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned, normalDate, zonedParts } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { breaches } from '@/engine/core/invariants';
import { LEFTOVERS_FREEZE_DAYS } from '@/engine/content/groceries';
import { KITCHEN, THAW, gearOffers, groceryPrice, productById, shortfall } from '@/engine/systems/kitchen';
import { foodOf, mealsReady, stockOf } from '@/engine/systems/pantry';
import { cartByChain, cartOf } from '@/engine/systems/shoppingcart';
import { toiletryById, toiletryPrice } from '@/engine/systems/hygiene';
import { favoritesIn } from '@/engine/systems/catalog';
import { BULBS, bulbCatalog, darkSockets, lampCatalog, lightsOf, spareBulbs } from '@/engine/systems/lighting';
import { HOME, askingPrice, homesOf, listingsIn, livingIn, offerFor } from '@/engine/systems/homes';
import { CROPS } from '@/engine/content/garden';
import { plantingIn, yieldOf } from '@/engine/systems/garden';
import { mowKwh, mowerCatalog, mowersAt } from '@/engine/systems/mowers';
import { groceryCatalog } from '@/engine/systems/kitchen';
import { GARAGES } from '@/engine/content/garages';
import { garageCost, meterCost } from '@/engine/systems/trips';
import { bacAt, pintPrice } from '@/engine/systems/alcohol';
import { PINT } from '@/engine/content/alcohol';
import { diningQuote, restaurantById } from '@/engine/systems/dining';
import { lateFee, reservationsOf } from '@/engine/systems/reservations';

const NY = 'us-ny-newyork';
const life = (seed: string, city = NY) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
/** What the bank holds: checking and savings, which a payment from the bank draws on. */
const banked = (sim: Simulation) => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && !a.nominal && !a.closedAt && (a.kind === 'checking' || a.kind === 'savings')).reduce((s, a) => s + a.balance, 0);
/** An hour of a day some days on, in the life's zone. */
const dayAt = (sim: Simulation, days: number, hour: number) => { const p = zonedParts(sim.now + days * MS_DAY, sim.zone); return instantFromZoned({ ...normalDate(p.year, p.month, p.day), hour }, sim.zone); };
const food = (sim: Simulation, id: string) => foodOf(sim.player).find((i) => i.id === id);

const ICE_CREAM = 'easy-frozen-banana-ice-cream';
const COFFEE = 'thefreshgrocer-bowl-basket-colombian-medium-roast-ground-coffee-12-oz';
const CHICKEN = 'thefreshgrocer-perdue-99-fat-free-boneless-skinless-chicken-breasts';
const SHAMPOO = 'thefreshgrocer-pantene-daily-moisture-renewal-shampoo-120oz';

describe('a kitchen in New York', () => {
  it('buys a blender for a recipe that needs one, shops what’s short, cooks, and eats the leftovers frozen and thawed', () => {
    let sim = life('jf-kitchen');
    sim.advanceTo(dayAt(sim, 1, 10));
    expect(sim.execute({ kind: 'food.cook', payload: { recipeId: ICE_CREAM, servings: 4 } }).error).toBe('It needs a blender: buy one for the kitchen.');
    const blender = gearOffers(sim, sim.player).find((g) => g.gear === 'blender')!;
    let b0 = banked(sim);
    expect(sim.must<{ paid: number }>({ kind: 'food.buy_gear', payload: { gear: 'blender' } }).paid).toBe(blender.cost);
    expect(b0 - banked(sim)).toBe(blender.cost);
    expect(sim.execute({ kind: 'food.buy_gear', payload: { gear: 'blender' } }).error).toBe('Your kitchen has one.');
    expect(sim.execute({ kind: 'food.buy_gear', payload: { gear: 'slow-cooker', offerId: blender.id } }).error).toBe('That model isn’t sold where you live.');
    expect(b0 - banked(sim)).toBe(blender.cost);

    const need = shortfall(sim, sim.player, ICE_CREAM, 4)!;
    expect(need.unbuyable).toEqual([]);
    b0 = banked(sim);
    const short = sim.must<{ paid: number; bought: number }>({ kind: 'food.buy_short', payload: { recipeId: ICE_CREAM, servings: 4 } });
    expect(short).toEqual({ paid: need.buys.reduce((s, b) => s + b.cost, 0), bought: need.buys.length });
    expect(b0 - banked(sim)).toBe(short.paid);
    expect(sim.execute({ kind: 'food.buy_short', payload: { recipeId: ICE_CREAM, servings: 4 } }).error).toBe('You have all of it.');
    expect(sim.execute({ kind: 'food.buy_short', payload: { recipeId: 'chicken-jalfrezi' } }).error).toBe('No store here sells bell pepper, green chilli, garlic clove, canned chopped tomatoes.');
    expect(sim.execute({ kind: 'food.buy_short', payload: { recipeId: 'no-such-recipe' } }).error).toBe('No such recipe.');
    expect(b0 - banked(sim)).toBe(short.paid);

    expect(sim.must<{ left: number }>({ kind: 'food.cook', payload: { recipeId: ICE_CREAM, servings: 4 } }).left).toBe(3);
    const dish = foodOf(sim.player).find((i) => i.kind === `dish:${ICE_CREAM}`)!;
    expect(dish.at).toMatchObject({ kind: 'home', spot: 'fridge' });
    expect(dish.food.left).toBe(3);
    expect(sim.execute({ kind: 'food.cook', payload: { recipeId: ICE_CREAM, servings: 4 } }).error).toMatch(/^You’re short of /);
    // Fed by cooking it, then hungry by evening: the dish frozen before any more is eaten, and not heated frozen.
    expect(sim.execute({ kind: 'food.eat_ready', payload: { itemId: dish.id } }).error).toBe('You aren’t hungry.');
    sim.advanceTo(dayAt(sim, 0, 18));
    expect(sim.player.wellbeing.nourishment).toBeLessThan(90);
    const frozen = sim.must<{ keepsUntil: number }>({ kind: 'food.freeze', payload: { itemId: dish.id } });
    expect(frozen.keepsUntil).toBe(sim.now + LEFTOVERS_FREEZE_DAYS * MS_DAY);
    expect(food(sim, dish.id)!.at).toMatchObject({ kind: 'home', spot: 'freezer' });
    expect(mealsReady(sim, sim.player)).toEqual([]);
    expect(sim.execute({ kind: 'food.eat_ready', payload: { itemId: dish.id } }).error).toBe('That isn’t ready to eat here.');
    expect(sim.execute({ kind: 'food.eat_ready', payload: {} }).error).toBe('There’s no meal ready to eat here.');
    expect(sim.execute({ kind: 'food.freeze', payload: { itemId: dish.id } }).error).toBe('It’s frozen already.');
    expect(sim.execute({ kind: 'food.thaw', payload: { itemId: 'item-none' } }).error).toBe('That isn’t food of yours.');

    sim = reload(sim);
    expect(food(sim, dish.id)!.food).toMatchObject({ frozenAt: expect.any(Number), expiresAt: frozen.keepsUntil, left: 3 });
    sim.advanceBy(10 * MS_DAY);
    expect(food(sim, dish.id)!.food.left).toBe(3);

    const t = sim.must<{ thawsAt: number; keepsUntil: number }>({ kind: 'food.thaw', payload: { itemId: dish.id } });
    expect(t.thawsAt).toBe(sim.now + THAW.hours * MS_HOUR);
    expect(t.keepsUntil).toBe(t.thawsAt + KITCHEN.leftoverDays * MS_DAY);
    expect(sim.execute({ kind: 'food.eat_ready', payload: { itemId: dish.id } }).error).toBe('That isn’t ready to eat here.');
    expect(sim.execute({ kind: 'food.thaw', payload: { itemId: dish.id } }).error).toBe('It isn’t frozen.');
    sim.advanceTo(t.thawsAt + 60_000);
    sim.must({ kind: 'food.eat_ready', payload: { itemId: dish.id } });
    expect(food(sim, dish.id)!.food.left).toBe(2);
    // The day's meals take from what's ready first: the last two portions are eaten by the next day, none thrown out.
    const thrown = sim.universe.notifications.filter((n) => n.title === 'Thrown Out').length;
    sim.advanceBy(MS_DAY);
    expect(food(sim, dish.id)).toBeUndefined();
    expect(sim.universe.notifications.filter((n) => n.title === 'Thrown Out')).toHaveLength(thrown);
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('fills a basket at The Fresh Grocer, checks it out once, has a cup of coffee, freezes chicken, and keeps a favorite', () => {
    let sim = life('jf-basket');
    sim.advanceTo(dayAt(sim, 1, 23));
    // Past ten at night the store is shut, and nothing goes in the basket.
    expect(sim.execute({ kind: 'cart.add', payload: { kind: 'grocery', productId: COFFEE } }).error).toBe('The Fresh Grocer has closed for the day; it closed at 22:00.');
    expect(cartOf(sim.player)).toEqual([]);
    sim.advanceTo(dayAt(sim, 1, 10));
    const coffee = sim.must<{ lineId: string }>({ kind: 'cart.add', payload: { kind: 'grocery', productId: COFFEE } }).lineId;
    const chicken = sim.must<{ lineId: string }>({ kind: 'cart.add', payload: { kind: 'grocery', productId: CHICKEN } }).lineId;
    expect(sim.must<{ lineId: string }>({ kind: 'cart.add', payload: { kind: 'grocery', productId: CHICKEN } }).lineId).toBe(chicken);
    sim.must({ kind: 'cart.add', payload: { kind: 'toiletry', productId: SHAMPOO } });
    expect(cartOf(sim.player).map((l) => [l.productId, l.quantity])).toEqual([[COFFEE, 1], [CHICKEN, 2], [SHAMPOO, 1]]);
    expect(sim.execute({ kind: 'cart.add', payload: { kind: 'grocery', productId: 'nothing' } }).error).toBe('That isn’t on sale.');
    expect(sim.execute({ kind: 'cart.add', payload: { kind: 'grocery', productId: CHICKEN, quantity: 21 } }).error).toBe('From one to twenty.');
    expect(sim.must<{ left: number }>({ kind: 'cart.remove', payload: { lineId: coffee } }).left).toBe(2);
    expect(sim.execute({ kind: 'cart.remove', payload: { lineId: coffee } }).error).toBe('That isn’t in the basket.');

    const total = groceryPrice(sim, NY, productById(CHICKEN)!) * 2 + toiletryPrice(sim, NY, toiletryById(SHAMPOO)!);
    expect(cartByChain(sim, sim.player).map((g) => [g.chain, g.total])).toEqual([['thefreshgrocer', total]]);
    expect(sim.execute({ kind: 'cart.checkout', payload: { chain: 'smartfinal' } }).error).toBe('The basket has nothing from that chain.');
    const b0 = banked(sim);
    const tx0 = sim.universe.transactions.length;
    expect(sim.must<{ paid: number }>({ kind: 'cart.checkout', payload: { chain: 'thefreshgrocer', payWith: 'debit' } }).paid).toBe(total);
    expect(b0 - banked(sim)).toBe(total);
    expect(sim.universe.transactions.slice(tx0).map((t) => t.memo)).toEqual(['The Fresh Grocer: 2 things']);
    expect(cartOf(sim.player)).toEqual([]);
    expect(sim.execute({ kind: 'cart.checkout', payload: { chain: 'thefreshgrocer' } }).error).toBe('The basket has nothing from that chain.');
    expect(b0 - banked(sim)).toBe(total);
    const chickens = foodOf(sim.player).filter((i) => i.kind === CHICKEN);
    expect(chickens.map((i) => i.at)).toEqual([expect.objectContaining({ kind: 'home', spot: 'fridge' }), expect.objectContaining({ kind: 'home', spot: 'fridge' })]);

    // A cup of coffee from a bag bought on its own.
    sim.must({ kind: 'food.buy_groceries', payload: { productId: COFFEE, quantity: 1 } });
    const bag = foodOf(sim.player).find((i) => i.kind === COFFEE)!;
    const g0 = bag.food.left;
    expect(sim.must<{ ml: number }>({ kind: 'food.drink_home', payload: { itemId: bag.id } }).ml).toBe(240);
    expect(g0 - food(sim, bag.id)!.food.left).toBeCloseTo((240 * 55) / 1000, 9);
    expect(sim.execute({ kind: 'food.drink_home', payload: { itemId: chickens[0]!.id } }).error).toBe('That isn’t a drink here.');

    // One chicken frozen; the other left in the fridge.
    const [kept, left] = chickens as [typeof chickens[number], typeof chickens[number]];
    const fr = sim.must<{ keepsUntil: number }>({ kind: 'food.freeze', payload: { itemId: kept.id } });
    expect(fr.keepsUntil).toBe(sim.now + productById(CHICKEN)!.freezeDays! * MS_DAY);
    expect(stockOf(sim, sim.player, 'chicken').map((i) => i.id)).toEqual([left.id]);

    // Favorites.
    expect(sim.must<{ favorite: boolean }>({ kind: 'catalog.favorite', payload: { list: 'groceries', id: COFFEE } }).favorite).toBe(true);
    expect(sim.must<{ favorite: boolean }>({ kind: 'catalog.favorite', payload: { list: 'groceries', id: CHICKEN } }).favorite).toBe(true);
    expect(sim.execute({ kind: 'catalog.favorite', payload: { list: 'groceries', id: '' } }).error).toBe('Choose something in a list.');

    sim = reload(sim);
    expect(favoritesIn(sim.player, 'groceries')).toEqual([COFFEE, CHICKEN]);
    expect(sim.must<{ favorite: boolean }>({ kind: 'catalog.favorite', payload: { list: 'groceries', id: COFFEE } }).favorite).toBe(false);
    expect(favoritesIn(sim.player, 'groceries')).toEqual([CHICKEN]);

    // Three days on, the chicken left in the fridge is past FoodKeeper's day and thrown out; the frozen one keeps.
    sim.advanceBy(3 * MS_DAY);
    expect(food(sim, left.id)).toBeUndefined();
    expect(food(sim, kept.id)!.food).toMatchObject({ frozenAt: expect.any(Number), left: productById(CHICKEN)!.sizeQty });
    const th = sim.must<{ thawsAt: number; keepsUntil: number }>({ kind: 'food.thaw', payload: { itemId: kept.id } });
    expect(th.keepsUntil).toBe(th.thawsAt + THAW.meatDays * MS_DAY);
    expect(stockOf(sim, sim.player, 'chicken')).toEqual([]);
    sim.advanceTo(th.thawsAt + 60_000);
    expect(stockOf(sim, sim.player, 'chicken').map((i) => i.id)).toEqual([kept.id]);
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('buys a lamp that comes without a bulb, dark until a pack is bought and fitted, and lit after', () => {
    let sim = life('jf-lights');
    const before = lightsOf(sim.player)!.sockets.length;
    expect(darkSockets(sim.player)).toEqual([]);
    const lamp = lampCatalog(sim, sim.player).find((l) => l.product.attrs.bulbIncluded === false && l.product.attrs.socket === 'edison' && l.product.attrs.bulbs === 1)!;
    expect(sim.execute({ kind: 'lighting.buy_lamp', payload: { offerId: 'nothing' } }).error).toBe('That isn’t on sale.');
    let b0 = banked(sim);
    const bought = sim.must<{ paid: number; itemId: string }>({ kind: 'lighting.buy_lamp', payload: { offerId: lamp.offer.id } });
    expect(bought.paid).toBe(lamp.price);
    expect(b0 - banked(sim)).toBe(lamp.price);
    expect(lightsOf(sim.player)!.sockets).toHaveLength(before + 1);
    expect(darkSockets(sim.player).map((s) => s.lamp)).toEqual([bought.itemId]);

    const bulb = bulbCatalog(sim, sim.player).find((b) => b.product.attrs.socket === 'edison' && Number(b.product.attrs.watts) <= 60 && b.product.attrs.pack === 2)!;
    expect(sim.execute({ kind: 'lighting.fit', payload: { productId: bulb.product.id } }).error).toBe('You have none of those spare.');
    const abroad = BULBS.flatMap((p) => p.offers).find((o) => o.market === 'uk')!;
    expect(sim.execute({ kind: 'lighting.buy_bulbs', payload: { offerId: abroad.id } }).error).toBe('It’s sold in another country.');
    b0 = banked(sim);
    expect(sim.must<{ paid: number }>({ kind: 'lighting.buy_bulbs', payload: { offerId: bulb.offer.id } }).paid).toBe(bulb.price);
    expect(b0 - banked(sim)).toBe(bulb.price);
    expect(spareBulbs(sim.player).map((s) => [s.product.id, s.item.quantity])).toEqual([[bulb.product.id, 2]]);

    // A day with the lamp dark: its socket burns nothing while the home's own do.
    sim = reload(sim);
    const lampSocket = () => lightsOf(sim.player)!.sockets.find((s) => s.lamp === bought.itemId)!;
    const kwh0 = sim.player.living?.lightKwh ?? 0;
    sim.advanceBy(MS_DAY);
    expect((sim.player.living?.lightKwh ?? 0) - kwh0).toBeGreaterThan(0);
    expect(lampSocket().hours).toBe(0);
    expect(lampSocket().watts).toBeUndefined();

    // Fitted: the dark socket first, then the one drawing most; the pack used up, and none left to fit.
    expect(sim.must<{ fitted: number }>({ kind: 'lighting.fit', payload: { productId: bulb.product.id } }).fitted).toBe(2);
    expect(darkSockets(sim.player)).toEqual([]);
    expect(lampSocket()).toMatchObject({ watts: Number(bulb.product.attrs.watts), bulb: bulb.product.id, hours: 0 });
    expect(spareBulbs(sim.player)).toEqual([]);
    expect(sim.execute({ kind: 'lighting.fit', payload: { productId: bulb.product.id } }).error).toBe('You have none of those spare.');
    sim.advanceBy(MS_DAY);
    expect(lampSocket().hours).toBeGreaterThan(0);
    expect(breaches(sim.universe)).toEqual([]);
  });
});

const gift = (sim: Simulation, cents: number) => sim.post({ memo: 'A gift from the family', category: 'income', postings: [{ accountId: sim.player.primaryAccountId!, amount: cents }, { accountId: sim.nominalAccount('equity', 'Opening Balances').id, amount: -cents }] });
const nyOn = (month: number, day: number, year = 2026) => instantFromZoned({ year, month, day, hour: 10 }, 'America/New_York');

describe('a garden in New York', () => {
  it('buys a house with a yard for cash, puts in a bed and a greenhouse, grows peppers in winter, tomatoes in summer, loses lettuce to the frost, and mows with a mower of its own', () => {
    let sim = life('jf-garden');
    const listing = listingsIn(sim, NY).find((l) => l.type === 'house' && l.features.includes('yard'))!;
    const price = askingPrice(sim, listing);
    const offer = offerFor(sim, sim.player, listing, 1, price);
    gift(sim, offer.cash);
    expect(sim.must<{ answer: string }>({ kind: 'home.offer', payload: { listingId: listing.id, price, down: 1, live: true, inspect: false } }).answer).toBe('accepted');
    sim.advanceBy((HOME.closingDays + 1) * MS_DAY);
    const house = homesOf(sim.player).find((h) => h.listingId === listing.id)!;
    expect(livingIn(sim.player)?.id).toBe(house.id);

    expect(sim.execute({ kind: 'garden.plant', payload: { plot: 'bed', crop: 'tomato' } }).error).toBe('You have no garden bed.');
    const bed = sim.must<{ doneAt: number }>({ kind: 'home.renovate', payload: { homeId: house.id, projectId: 'raised-bed' } });
    const glass = sim.must<{ doneAt: number }>({ kind: 'home.renovate', payload: { homeId: house.id, projectId: 'greenhouse' } });
    // Done in their days, or in the days more a contractor runs late.
    sim.advanceTo(Math.max(bed.doneAt, glass.doneAt) + MS_HOUR);
    for (let d = 0; d < 30 && house.works.length > 0; d += 1) sim.advanceBy(MS_DAY);
    expect(livingIn(sim.player)!.facts.features).toEqual(expect.arrayContaining(['gardenBed', 'greenhouse']));
    sim.advanceTo(dayAt(sim, 1, 10));

    // Winter: the bed out of the frost-free months; the greenhouse grows peppers.
    expect(sim.execute({ kind: 'garden.plant', payload: { plot: 'bed', crop: 'tomato' } }).error).toBe('It’s out of the frost-free months.');
    expect(sim.execute({ kind: 'garden.plant', payload: { plot: 'bed', crop: 'banana' } }).error).toBe('That isn’t grown here.');
    expect(sim.execute({ kind: 'garden.harvest', payload: { plot: 'bed' } }).error).toBe('It’s empty: plant something first.');
    const peppers = sim.must<{ ripeAt: number }>({ kind: 'garden.plant', payload: { plot: 'greenhouse', crop: 'pepper' } });
    expect(peppers.ripeAt).toBe(sim.now + CROPS.pepper.days * MS_DAY);
    expect(sim.execute({ kind: 'garden.plant', payload: { plot: 'greenhouse', crop: 'tomato' } }).error).toBe('Something’s growing in it already.');
    expect(sim.execute({ kind: 'garden.harvest', payload: { plot: 'greenhouse' } }).error).toBe('It’s ripe about April 28, 2026.');

    sim = reload(sim);
    expect(plantingIn(sim.player, 'greenhouse')).toMatchObject({ crop: 'pepper' });
    sim.advanceTo(peppers.ripeAt + MS_HOUR);
    expect(sim.universe.notifications.some((n) => n.title === 'Peppers Ripe')).toBe(true);
    const had = (key: string) => stockOf(sim, sim.player, key).reduce((n, i) => n + i.food.left, 0);
    const p0 = had('pepper');
    const picked = sim.must<{ food: string; amount: number }>({ kind: 'garden.harvest', payload: { plot: 'greenhouse' } });
    expect(picked).toEqual({ food: 'pepper', amount: yieldOf('greenhouse', 'pepper') });
    expect(had('pepper') - p0).toBe(picked.amount);
    expect(plantingIn(sim.player, 'greenhouse')).toBeUndefined();
    expect(sim.execute({ kind: 'garden.harvest', payload: { plot: 'greenhouse' } }).error).toBe('It’s empty: plant something first.');

    // May: tomatoes in the bed, ripe in their eighty days and picked.
    sim.advanceTo(nyOn(5, 1));
    const tomatoes = sim.must<{ ripeAt: number }>({ kind: 'garden.plant', payload: { plot: 'bed', crop: 'tomato' } });

    // A lawn grown by June: not mown without a mower; a corded one bought, and its watts on the month's power.
    sim.advanceTo(nyOn(6, 1));
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'mow' } }).error).toBe('You have no mower to push; one is sold on Homes.');
    const corded = mowerCatalog(sim, sim.player).find((m) => m.product.attrs.kind === 'corded')!;
    expect(sim.execute({ kind: 'garden.buy_mower', payload: { offerId: 'nothing' } }).error).toBe('That isn’t on sale.');
    const b0 = banked(sim);
    const mower = sim.must<{ paid: number; itemId: string }>({ kind: 'garden.buy_mower', payload: { offerId: corded.offer.id } });
    expect(mower.paid).toBe(corded.price);
    expect(b0 - banked(sim)).toBe(corded.price);
    expect(mowersAt(sim.player, `owned:${house.id}`).map((m) => m.item.id)).toEqual([mower.itemId]);
    const kwh0 = sim.player.living?.extraKwh ?? 0;
    const mown = sim.execute({ kind: 'life.look_after', payload: { action: 'mow' } });
    expect(mown.ok).toBe(true);
    expect((sim.player.living?.extraKwh ?? 0) - kwh0).toBeCloseTo(mowKwh(corded.product), 9);
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'mow' } }).error).toBe('It’s cut.');

    sim.advanceTo(tomatoes.ripeAt + MS_HOUR);
    const t0 = had('tomato');
    expect(sim.must<{ amount: number }>({ kind: 'garden.harvest', payload: { plot: 'bed' } }).amount).toBe(yieldOf('bed', 'tomato'));
    expect(had('tomato') - t0).toBe(yieldOf('bed', 'tomato'));

    // September: tomatoes wouldn't ripen before the frost; lettuce would, and is left to it.
    sim.advanceTo(nyOn(9, 5));
    expect(sim.execute({ kind: 'garden.plant', payload: { plot: 'bed', crop: 'tomato' } }).error).toBe('It wouldn’t ripen before the first frost, about November 20, 2026.');
    const lettuce = sim.must<{ ripeAt: number }>({ kind: 'garden.plant', payload: { plot: 'bed', crop: 'lettuce' } });
    sim = reload(sim);
    sim.advanceTo(lettuce.ripeAt + MS_HOUR);
    expect(plantingIn(sim.player, 'bed')).toMatchObject({ crop: 'lettuce' });
    const l0 = had('lettuce');
    sim.advanceTo(nyOn(11, 21));
    expect(plantingIn(sim.player, 'bed')).toBeUndefined();
    expect(sim.universe.notifications.some((n) => n.title === 'The Frost Took It')).toBe(true);
    expect(had('lettuce')).toBe(l0);
    expect(sim.execute({ kind: 'garden.harvest', payload: { plot: 'bed' } }).error).toBe('It’s empty: plant something first.');
    expect(breaches(sim.universe)).toEqual([]);
  });
});

const LA = 'us-ca-losangeles';
const dish = (id: string) => restaurantById(id)!.menu.find((m) => m.price !== null)!.item;

describe('food in Los Angeles', () => {
  it('drives to Smart & Final, parks at a garage, brings the beer home, and drinks it there and at a bar', () => {
    let sim = life('jf-la-shop', LA);
    sim.advanceTo(dayAt(sim, 1, 11));
    const car = sim.must<{ vehicleId: string; deliveredAt?: number }>({ kind: 'vehicle.buy', payload: { modelId: 'us-toyota-camry' } });
    if (car.deliveredAt) sim.advanceTo(car.deliveredAt + MS_HOUR);
    sim.advanceTo(dayAt(sim, 1, 11));
    expect(sim.execute({ kind: 'errand.park', payload: { minutes: 30 } }).error).toBe('You aren’t out in the car.');
    sim.must({ kind: 'errand.go', payload: { to: 'shopping', by: 'car', vehicleId: car.vehicleId } });
    const beer = groceryCatalog(sim, LA).find((e) => e.value.food === 'beer')!.value;
    const wine = groceryCatalog(sim, LA).find((e) => e.value.food === 'wine')!.value;
    sim.must({ kind: 'cart.add', payload: { kind: 'grocery', productId: beer.id } });
    sim.must({ kind: 'cart.add', payload: { kind: 'grocery', productId: wine.id } });
    let b0 = banked(sim);
    const paid = sim.must<{ paid: number }>({ kind: 'cart.checkout', payload: { chain: 'smartfinal' } }).paid;
    expect(paid).toBe(groceryPrice(sim, LA, beer) + groceryPrice(sim, LA, wine));
    expect(b0 - banked(sim)).toBe(paid);
    const can = foodOf(sim.player).find((i) => i.kind === beer.id)!;
    expect(can.at.kind).toBe('vehicle');

    const garage = GARAGES.find((g) => g.id === 'la-pershing')!;
    b0 = banked(sim);
    expect(sim.must<{ paid: number }>({ kind: 'errand.park', payload: { minutes: 50, garageId: garage.id } }).paid).toBe(garageCost(sim, garage, 50));
    expect(b0 - banked(sim)).toBe(garageCost(sim, garage, 50));
    expect(sim.execute({ kind: 'errand.park', payload: { minutes: 50, garageId: 'nh-temple' } }).error).toBe('There’s no such garage in this town.');
    b0 = banked(sim);
    expect(sim.must<{ paid: number }>({ kind: 'errand.park', payload: { minutes: 30 } }).paid).toBe(meterCost(sim, LA, 30, sim.player));
    expect(b0 - banked(sim)).toBe(meterCost(sim, LA, 30, sim.player));
    sim.must({ kind: 'errand.go', payload: { to: 'home' } });
    expect(sim.execute({ kind: 'errand.park', payload: { minutes: 30 } }).error).toBe('You aren’t out in the car.');
    sim.must({ kind: 'items.put_away', payload: {} });
    expect(food(sim, can.id)!.at).toMatchObject({ kind: 'home', spot: beer.storage });

    sim = reload(sim);
    const ml0 = food(sim, can.id)!.food.left;
    const pint = sim.must<{ ml: number }>({ kind: 'food.drink_home', payload: { itemId: can.id } }).ml;
    expect(pint).toBe(PINT.US.ml);
    expect(ml0 - food(sim, can.id)!.food.left).toBe(pint);
    expect(bacAt(sim.player, sim.now)).toBeGreaterThan(0);
    const glass = foodOf(sim.player).find((i) => i.kind === wine.id)!;
    expect(sim.must<{ ml: number }>({ kind: 'food.drink_home', payload: { itemId: glass.id } }).ml).toBe(148);

    expect(sim.execute({ kind: 'food.drink', payload: { pints: 9 } }).error).toBe('From one to eight.');
    const bac0 = bacAt(sim.player, sim.now);
    b0 = banked(sim);
    const bar = sim.must<{ paid: number; bac: number }>({ kind: 'food.drink', payload: { pints: 2 } });
    expect(bar.paid).toBe(2 * pintPrice(sim, LA)!);
    expect(b0 - banked(sim)).toBe(bar.paid);
    expect(bar.bac).toBeGreaterThan(bac0);
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('dines at Bestia, books tables by each restaurant’s terms, calls two off, and keeps one', () => {
    let sim = life('jf-la-dine', LA);
    sim.advanceTo(dayAt(sim, 0, 18));
    const bestia = restaurantById('bestia-la')!;
    const item = dish(bestia.id);
    expect(sim.execute({ kind: 'food.dine', payload: { restaurantId: bestia.id, items: [], how: 'in' } }).error).toBe('Choose something from the menu.');
    expect(sim.execute({ kind: 'food.dine', payload: { restaurantId: bestia.id, items: ['A Hamburger'], how: 'in' } }).error).toBe('That isn’t on its menu.');
    expect(sim.execute({ kind: 'food.dine', payload: { restaurantId: 'le-bernardin-newyork', items: [dish('le-bernardin-newyork')], how: 'in' } }).error).toBe('Le Bernardin is in another town.');
    expect(sim.execute({ kind: 'food.dine', payload: { restaurantId: bestia.id, items: [item], how: 'delivery' } }).error).toBe('Bestia doesn’t deliver.');
    const q = diningQuote(sim, bestia, [item], 'in')!;
    let b0 = banked(sim);
    const t0 = sim.now;
    const ate = sim.must<{ doneAt: number; paid: number }>({ kind: 'food.dine', payload: { restaurantId: bestia.id, items: [item], how: 'in' } });
    expect(ate.paid).toBe(q.total);
    expect(b0 - banked(sim)).toBe(q.total);
    expect(ate.doneAt - t0).toBe(q.minutes * 60_000);

    // Bestia, booked for three days on; Night + Market Song, whose dishes SLATE has no price for, isn't.
    const when = (days: number, hour: number) => dayAt(sim, days, hour);
    const at3 = when(3, 19);
    expect(sim.execute({ kind: 'food.reserve', payload: { restaurantId: bestia.id, at: sim.now + 30 * 60_000, party: 2, item } }).error).toBe('Choose a time at least an hour from now.');
    expect(sim.execute({ kind: 'food.reserve', payload: { restaurantId: bestia.id, at: at3, party: 2, item: 'A Hamburger' } }).error).toBe('Choose a dish SLATE knows the price of.');
    const song = restaurantById('night-market-song-la')!;
    expect(sim.execute({ kind: 'food.reserve', payload: { restaurantId: song.id, at: at3, party: 2, item: song.menu[0]!.item } }).error).toBe('Choose a dish SLATE knows the price of.');
    expect(sim.execute({ kind: 'food.reserve', payload: { restaurantId: 'in-n-out-burger-la', at: at3, party: 2, item } }).error).toBe('In-N-Out Burger’s booking terms aren’t kept; you’re seated as you come.');
    const kept = sim.must<{ id: string; prepaid: number }>({ kind: 'food.reserve', payload: { restaurantId: bestia.id, at: at3, party: 2, item } });
    expect(kept.prepaid).toBe(0);

    // n/naka: paid ahead at its $395 a person, and kept when canceled, as its terms say.
    expect(sim.execute({ kind: 'food.reserve', payload: { restaurantId: 'n-naka-la', at: when(10, 19), party: 5, item: dish('n-naka-la') } }).error).toBe('n/naka books 4 at the most.');
    b0 = banked(sim);
    const naka = sim.must<{ id: string; prepaid: number }>({ kind: 'food.reserve', payload: { restaurantId: 'n-naka-la', at: when(10, 19), party: 2, item: dish('n-naka-la') } });
    expect(naka.prepaid).toBe(790_00);
    expect(b0 - banked(sim)).toBe(790_00);
    expect(sim.must<{ fee: number }>({ kind: 'food.cancel_table', payload: { reservationId: naka.id } }).fee).toBe(0);
    expect(b0 - banked(sim)).toBe(790_00);
    expect(sim.execute({ kind: 'food.cancel_table', payload: { reservationId: naka.id } }).error).toBe('No such booking.');

    // Providence: canceled inside its seven days, its $375 a person.
    const prov = sim.must<{ id: string }>({ kind: 'food.reserve', payload: { restaurantId: 'providence-la', at: when(4, 19), party: 2, item: dish('providence-la') } });
    b0 = banked(sim);
    const late = sim.must<{ fee: number }>({ kind: 'food.cancel_table', payload: { reservationId: prov.id } });
    expect(late.fee).toBe(lateFee(sim, 'providence-la', when(4, 19), 2));
    expect(late.fee).toBe(750_00);
    expect(b0 - banked(sim)).toBe(750_00);
    expect(sim.execute({ kind: 'food.cancel_table', payload: { reservationId: prov.id } }).error).toBe('No such booking.');
    expect(b0 - banked(sim)).toBe(750_00);

    // Saved and loaded with only Bestia's table standing; at its hour, the party's dish each, once, and nothing for the two called off.
    const nakaAt = when(10, 19);
    sim = reload(sim);
    expect(reservationsOf(sim.player).map((r) => r.id)).toEqual([kept.id]);
    const keptQuote = diningQuote(sim, bestia, [item, item], 'in')!;
    sim.advanceTo(at3 + 3 * MS_HOUR);
    const memo = (m: string) => sim.universe.transactions.filter((t) => t.memo === m);
    const charged = memo(`${bestia.name}, a table for 2`);
    expect(charged).toHaveLength(1);
    expect(charged[0]!.postings.filter((p) => p.amount > 0).reduce((s, p) => s + p.amount, 0)).toBe(keptQuote.total);
    expect(reservationsOf(sim.player)).toEqual([]);
    sim.advanceTo(nakaAt + 6 * MS_HOUR);
    expect(memo(`${bestia.name}, a table for 2`)).toHaveLength(1);
    expect(memo('n/naka, a table for 2')).toEqual([]);
    expect(memo('Providence, a table for 2')).toEqual([]);
    expect(memo('Providence, not come')).toEqual([]);
    expect(breaches(sim.universe)).toEqual([]);
  });
});

/**
 * Two things the game gets wrong, kept apart and skipped. Each case asserts
 * what should happen; each fails unskipped.
 */
describe('food, where the game is wrong', () => {
  // Found by this journey on 2026-10-06 and fixed: a table was never missed for being somewhere else in town, because
  // `occupiedAt`, asked from the table's own handler, found the table itself (marked done before it runs) and took
  // it for the table; it now leaves out the item asking.
  it('misses a table when a plan runs over its hour, and charges its no-show fee, not the meal', () => {
    let sim = life('jf-la-missed', LA);
    sim.advanceTo(dayAt(sim, 0, 12));
    const missedAt = dayAt(sim, 10, 19);
    sim.must({ kind: 'food.reserve', payload: { restaurantId: 'providence-la', at: missedAt, party: 2, item: dish('providence-la') } });
    sim.must({ kind: 'calendar.schedule', payload: { title: 'Work Late', at: missedAt - MS_HOUR, durationMinutes: 240 } });
    sim = reload(sim);
    sim.advanceTo(missedAt + 6 * MS_HOUR);
    const memo = (m: string) => sim.universe.transactions.filter((t) => t.memo === m);
    expect(sim.universe.scheduled.find((s) => s.label === 'Work Late')!.status).toBe('done');
    expect(memo('Providence, a table for 2')).toEqual([]);
    expect(memo('Providence, not come')).toHaveLength(1);
    expect(memo('Providence, not come')[0]!.postings.filter((p) => p.amount > 0).reduce((s, p) => s + p.amount, 0)).toBe(lateFee(sim, 'providence-la', missedAt, 2));
    expect(sim.universe.notifications.some((n) => n.title === 'A Table Missed')).toBe(true);
    expect(breaches(sim.universe)).toEqual([]);
  });

  // Found by this journey on 2026-10-06 and fixed: a drink "at home" was poured from a can still in the car at the
  // shops, because `drinkAtHome` never asked where it was; a coffee or tea the same.
  it('won’t pour a drink at home from a can still in the car at the shops', () => {
    let sim = life('jf-la-shop', LA);
    sim.advanceTo(dayAt(sim, 1, 11));
    const car = sim.must<{ vehicleId: string; deliveredAt?: number }>({ kind: 'vehicle.buy', payload: { modelId: 'us-toyota-camry' } });
    if (car.deliveredAt) sim.advanceTo(car.deliveredAt + MS_HOUR);
    sim.advanceTo(dayAt(sim, 1, 11));
    sim.must({ kind: 'errand.go', payload: { to: 'shopping', by: 'car', vehicleId: car.vehicleId } });
    const beer = groceryCatalog(sim, LA).find((e) => e.value.food === 'beer')!.value;
    sim.must({ kind: 'food.buy_groceries', payload: { productId: beer.id, quantity: 1 } });
    const can = foodOf(sim.player).find((i) => i.kind === beer.id)!;
    expect(can.at.kind).toBe('vehicle');
    sim = loadSave(deserialise(serialise(sim.universe)) as never);
    expect(sim.execute({ kind: 'food.drink_home', payload: { itemId: can.id } }).error).toBe('It isn’t at home with you.');
    expect(food(sim, can.id)!.food.left).toBe(beer.sizeQty);
    expect(bacAt(sim.player, sim.now)).toBe(0);
    expect(breaches(sim.universe)).toEqual([]);
  });
});
