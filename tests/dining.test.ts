/**
 * The room and the shop floor.
 *
 * A restaurant has somebody on the door and somebody with your table, and
 * both of them remember whether you came, what you always order and what you
 * left. A busy, dear room makes you wait; a counter never does and takes the
 * money with the order. A shop has somebody on the floor, a rail that changes
 * with the fortnight, a fitting room with an opinion, and a counter that
 * charges through the one purchase engine every other purchase in the game
 * uses.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { loadAllSections } from '@/engine/dialogue';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_MINUTE } from '@/engine/core/time';
import type { DiningVisit, RetailVisit } from '@/engine/domain/model';
import { menuOf, placesIn, type Place } from '@/engine/content/places';
import { shoppableRetailers } from '@/engine/content/catalog';
import { ALL_RETAILERS, tradesIn } from '@/engine/content/brands';
import { CITIES } from '@/engine/content/geography';
import {
  GOOD_TIP, MAX_WAIT_MINUTES, SERVICE_SHARE, billFor, cookMinutes, openVisit, serviceOf, staffOf, standingAt, waitFor,
} from '@/engine/systems/dining';
import {
  FITTABLE, assistantAt, retailerAt, stockAt, standingAt as floorStanding, openVisit as openShop,
} from '@/engine/systems/retail';
import { factsOf } from '@/engine/systems/memory';

const LA = 'us-ca-losangeles';

function aLife(seed = 'dining', funding = 500_000_00): Simulation {
  const sim = quickSave({}, seed);
  sim.income(sim.player.primaryAccountId!, funding, 'Test funding', 'other');
  sim.execute({ kind: 'co.set_draw', payload: { amount: 0 } });
  return sim;
}

function aRoom(sim: Simulation, kind: Place['kind'] = 'restaurant'): Place {
  const place = placesIn(sim.player.currentLocationId).find((p) => p.kind === kind && menuOf(p).length > 0);
  if (!place) throw new Error(`No ${kind} in this city.`);
  return place;
}

function walkTo(sim: Simulation, place: Place): void {
  const result = sim.execute({ kind: 'go.to', payload: { placeId: place.id, mode: 'taxi' } });
  expect(result.ok, result.error).toBe(true);
}

function eatAt(sim: Simulation, place: Place, tipShare: number): DiningVisit {
  walkTo(sim, place);
  const arrival = sim.execute<{ visitId: string; quotedWait: number }>({ kind: 'dine.arrive', payload: { placeId: place.id } });
  expect(arrival.ok, arrival.error).toBe(true);
  const visitId = arrival.value!.visitId;
  if (arrival.value!.quotedWait > 0) {
    expect(sim.execute({ kind: 'dine.wait', payload: { visitId } }).ok).toBe(true);
  }
  const dish = menuOf(place)[0]!;
  const ordered = sim.execute({ kind: 'dine.order', payload: { visitId, items: [dish.name] } });
  expect(ordered.ok, ordered.error).toBe(true);
  if (serviceOf(place) === 'table') {
    const settled = sim.execute({ kind: 'dine.settle', payload: { visitId, tipShare } });
    expect(settled.ok, settled.error).toBe(true);
  }
  return sim.universe.diningVisits![visitId]!;
}

beforeAll(async () => { await loadAllSections(); });

describe('the room', () => {
  it('puts a host and a server behind every table, and the same two every time', () => {
    const sim = aLife();
    const place = aRoom(sim);
    const host = staffOf(sim, place, 'host');
    const server = staffOf(sim, place, 'server');
    expect(host.id).not.toBe(server.id);
    expect(staffOf(sim, place, 'host').id).toBe(host.id);
    expect(host.displayName.split(' ').length).toBeGreaterThanOrEqual(2);
    expect(host.currentLocationId).toBe(place.cityId);
  });

  it('serves a counter over the counter and a restaurant at a table', () => {
    const sim = aLife();
    expect(serviceOf(aRoom(sim, 'restaurant'))).toBe('table');
    expect(serviceOf(aRoom(sim, 'cafe'))).toBe('counter');
    expect(serviceOf(aRoom(sim, 'fast_food'))).toBe('counter');
    expect(serviceOf(aRoom(sim, 'bar'))).toBe('table');
  });

  it('never quotes a counter a wait, and never quotes anybody more than the cap', () => {
    const sim = aLife();
    const nobody = { visits: 0, goodTips: 0, stiffed: 0, walkouts: 0, regular: false };
    expect(waitFor(sim, aRoom(sim, 'cafe'), nobody, 1)).toBe(0);
    for (const place of placesIn(LA).filter((p) => p.kind === 'restaurant')) {
      expect(waitFor(sim, place, nobody, 6)).toBeLessThanOrEqual(MAX_WAIT_MINUTES);
      expect(waitFor(sim, place, nobody, 6)).toBeGreaterThanOrEqual(0);
    }
  });

  it('quotes a regular less than a stranger at the same room and the same minute', () => {
    const sim = aLife();
    // A dear, good room at a busy hour, so there is a wait to shorten at all.
    const busy = placesIn(LA)
      .filter((p) => p.kind === 'restaurant' && p.price >= 3 && p.quality >= 80)
      .sort((a, b) => b.quality - a.quality)[0]!;
    const stranger = { visits: 0, goodTips: 0, stiffed: 0, walkouts: 0, regular: false };
    const known = { visits: 9, goodTips: 4, stiffed: 0, walkouts: 0, regular: true };
    expect(waitFor(sim, busy, known, 2)).toBeLessThanOrEqual(waitFor(sim, busy, stranger, 2));
  });

  it('takes the money at a counter with the order and leaves nothing to settle', () => {
    const sim = aLife();
    const cafe = aRoom(sim, 'cafe');
    const before = sim.ledger.availableFunds(sim.player.primaryAccountId!);
    const visit = eatAt(sim, cafe, 0);
    expect(visit.status).toBe('settled');
    expect(visit.serviceCharge).toBe(0);
    expect(sim.ledger.availableFunds(sim.player.primaryAccountId!)).toBeLessThan(before);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('brings a bill at a table, adds service, and charges the tip on top', () => {
    const sim = aLife();
    const place = aRoom(sim);
    walkTo(sim, place);
    const arrival = sim.execute<{ visitId: string; quotedWait: number }>({ kind: 'dine.arrive', payload: { placeId: place.id } });
    const visitId = arrival.value!.visitId;
    if (arrival.value!.quotedWait > 0) sim.execute({ kind: 'dine.wait', payload: { visitId } });

    const dish = menuOf(place)[0]!;
    const before = sim.ledger.availableFunds(sim.player.primaryAccountId!);
    sim.execute({ kind: 'dine.order', payload: { visitId, items: [dish.name] } });
    // Nothing has been charged yet: the table has not asked for money.
    expect(sim.ledger.availableFunds(sim.player.primaryAccountId!)).toBe(before);

    const visit = sim.universe.diningVisits![visitId]!;
    const quoted = billFor(sim, visit, 0.2);
    expect(quoted.serviceCharge).toBe(Math.round(visit.subtotal * SERVICE_SHARE));
    const settled = sim.execute<{ total: number; tip: number }>({ kind: 'dine.settle', payload: { visitId, tipShare: 0.2 } });
    expect(settled.ok, settled.error).toBe(true);
    expect(settled.value!.total).toBe(quoted.total);
    expect(before - sim.ledger.availableFunds(sim.player.primaryAccountId!)).toBe(quoted.total);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('will not settle the same bill twice', () => {
    const sim = aLife();
    const visit = eatAt(sim, aRoom(sim), 0.18);
    const again = sim.execute({ kind: 'dine.settle', payload: { visitId: visit.id, tipShare: 0.18 } });
    expect(again.ok).toBe(false);
    expect(again.error).toMatch(/paid/i);
  });

  it('remembers a good tip on the server and a stiff on the server too', () => {
    const generous = aLife('tips-good');
    const room = aRoom(generous);
    const paid = eatAt(generous, room, 0.25);
    const server = generous.universe.people[paid.serverId]!;
    expect(factsOf(generous, server.id, { aboutId: generous.player.id }).some((f) => f.text === 'Tipped well')).toBe(true);

    const mean = aLife('tips-none');
    const meanRoom = aRoom(mean);
    const stiffed = eatAt(mean, meanRoom, 0);
    expect(factsOf(mean, stiffed.serverId, { aboutId: mean.player.id }).some((f) => f.text === 'Left nothing')).toBe(true);
    expect(standingAt(mean, meanRoom).stiffed).toBe(1);
  });

  it('counts you a regular after enough sittings, and learns what you always order', () => {
    const sim = aLife('regular');
    const place = aRoom(sim);
    const dish = menuOf(place)[0]!.name;
    for (let i = 0; i < 4; i++) {
      walkTo(sim, place);
      const arrival = sim.execute<{ visitId: string; quotedWait: number }>({ kind: 'dine.arrive', payload: { placeId: place.id } });
      const visitId = arrival.value!.visitId;
      if (arrival.value!.quotedWait > 0) sim.execute({ kind: 'dine.wait', payload: { visitId } });
      sim.execute({ kind: 'dine.order', payload: { visitId, items: [dish] } });
      sim.execute({ kind: 'dine.settle', payload: { visitId, tipShare: GOOD_TIP } });
      sim.advanceTo(sim.now + 26 * 60 * MS_MINUTE);
    }
    const standing = standingAt(sim, place);
    expect(standing.visits).toBeGreaterThanOrEqual(3);
    expect(standing.regular).toBe(true);
    expect(standing.usual).toBe(dish);
  });

  it('remembers a walkout, and the walkout costs nothing at the time', () => {
    const sim = aLife('walkout');
    const place = aRoom(sim);
    walkTo(sim, place);
    const before = sim.ledger.availableFunds(sim.player.primaryAccountId!);
    const arrival = sim.execute<{ visitId: string; quotedWait: number }>({ kind: 'dine.arrive', payload: { placeId: place.id } });
    const visitId = arrival.value!.visitId;
    if (arrival.value!.quotedWait === 0) {
      // A quiet room seated us; there is nothing to walk out of, which is also true.
      expect(sim.universe.diningVisits![visitId]!.status).toBe('seated');
      return;
    }
    expect(sim.execute({ kind: 'dine.leave', payload: { visitId } }).ok).toBe(true);
    expect(sim.ledger.availableFunds(sim.player.primaryAccountId!)).toBe(before);
    expect(standingAt(sim, place).walkouts).toBe(1);
  });

  it('refuses a dish that is not on the menu, and an order in a room you are not in', () => {
    const sim = aLife();
    const place = aRoom(sim);
    walkTo(sim, place);
    const arrival = sim.execute<{ visitId: string; quotedWait: number }>({ kind: 'dine.arrive', payload: { placeId: place.id } });
    const visitId = arrival.value!.visitId;
    if (arrival.value!.quotedWait > 0) sim.execute({ kind: 'dine.wait', payload: { visitId } });
    const bad = sim.execute({ kind: 'dine.order', payload: { visitId, items: ['Fish Fingers And Custard'] } });
    expect(bad.ok).toBe(false);

    const elsewhere = placesIn(sim.player.currentLocationId).find((p) => p.kind === 'restaurant' && p.id !== place.id)!;
    const notThere = sim.execute({ kind: 'dine.arrive', payload: { placeId: elsewhere.id } });
    expect(notThere.ok).toBe(false);
    expect(notThere.error).toMatch(/not at/i);
  });

  it('moves the clock for the wait and for the kitchen, and never backwards', () => {
    const sim = aLife('clock');
    const place = aRoom(sim);
    walkTo(sim, place);
    const arrival = sim.execute<{ visitId: string; quotedWait: number }>({ kind: 'dine.arrive', payload: { placeId: place.id } });
    const visitId = arrival.value!.visitId;
    const atDoor = sim.now;
    if (arrival.value!.quotedWait > 0) {
      sim.execute({ kind: 'dine.wait', payload: { visitId } });
      expect(sim.now).toBeGreaterThan(atDoor);
    }
    const seated = sim.now;
    const dish = menuOf(place)[0]!;
    const ordered = sim.execute<{ minutes: number }>({ kind: 'dine.order', payload: { visitId, items: [dish.name] } });
    expect(ordered.value!.minutes).toBe(cookMinutes(place, 1));
    expect(sim.now).toBe(seated + ordered.value!.minutes * MS_MINUTE);
  });

  it('leaves the open sitting findable so the interface can pick it back up', () => {
    const sim = aLife('open');
    const place = aRoom(sim);
    walkTo(sim, place);
    const arrival = sim.execute<{ visitId: string }>({ kind: 'dine.arrive', payload: { placeId: place.id } });
    expect(openVisit(sim)?.id).toBe(arrival.value!.visitId);
    expect(openVisit(sim, place.id)?.id).toBe(arrival.value!.visitId);
  });
});

describe('the shop floor', () => {
  function aShop(sim: Simulation, retailerId?: string): Place {
    const place = placesIn(sim.player.currentLocationId)
      .find((p) => p.retailerId !== undefined && (retailerId === undefined || p.retailerId === retailerId));
    if (!place) throw new Error('No storefront in this city.');
    return place;
  }

  it('gives every chain that trades here, and only in the market it really trades in', () => {
    const population = CITIES.get(LA)!.population;
    const here = placesIn(LA).filter((p) => p.retailerId);
    const expected = ALL_RETAILERS.filter((r) => r.kind !== 'online' && tradesIn(r, LA, population));
    expect(here.length).toBe(expected.length);
    expect(here.length).toBeGreaterThan(30);
    expect(new Set(here.map((p) => p.id)).size).toBe(here.length);
    for (const place of here) expect(retailerAt(place)).toBeDefined();
    // Online only stays online only, and a British grocer does not turn up in California.
    expect(here.some((p) => p.retailerId === 'amazon')).toBe(false);
    expect(here.some((p) => p.retailerId === 'tesco')).toBe(false);
    expect(here.some((p) => p.retailerId === 'whole_foods')).toBe(true);
    // A chain SLATE invented before the real ones is never given a door.
    expect(here.some((p) => p.retailerId === 'hallidays')).toBe(false);
    expect(shoppableRetailers().some((r) => r.legacy)).toBe(false);
  });

  it('puts a British grocer in Britain and a flagship only where the flagship is', () => {
    const london = placesIn('uk-eng-london').filter((p) => p.retailerId);
    expect(london.some((p) => p.retailerId === 'tesco')).toBe(true);
    expect(london.some((p) => p.retailerId === 'harrods')).toBe(true);
    expect(london.some((p) => p.retailerId === 'trader_joes')).toBe(false);
    expect(placesIn(LA).some((p) => p.retailerId === 'harrods')).toBe(false);
  });

  it('names the storefront for the chain, so the id never moves when a chain is added', () => {
    const shop = aShop(aLife(), 'nordstrom');
    expect(shop.id).toBe(`${LA}:shop:nordstrom`);
    expect(shop.name).toBe('Nordstrom');
  });

  it('puts one assistant on the floor and keeps them', () => {
    const sim = aLife();
    const shop = aShop(sim);
    const first = assistantAt(sim, shop);
    expect(assistantAt(sim, shop).id).toBe(first.id);
    expect(first.currentLocationId).toBe(shop.cityId);
  });

  it('puts out a rail that is the same rail all fortnight and only what the chain stocks', () => {
    const sim = aLife();
    const shop = aShop(sim, 'nordstrom');
    const retailer = retailerAt(shop)!;
    const morning = stockAt(sim, shop);
    expect(morning.length).toBeGreaterThan(0);
    for (const stocked of morning) {
      expect(retailer.categories.includes(stocked.item.category) || retailer.categories.includes(stocked.item.subcategory)).toBe(true);
      expect(stocked.price).toBeGreaterThan(0);
    }
    sim.advanceTo(sim.now + 2 * 60 * MS_MINUTE);
    expect(stockAt(sim, shop).map((s) => s.item.id)).toEqual(morning.map((s) => s.item.id));
  });

  it('walks a basket to the counter and charges it through the one purchase engine', () => {
    const sim = aLife('buying');
    const shop = aShop(sim, 'nordstrom');
    walkTo(sim, shop);
    const entered = sim.execute<{ visitId: string }>({ kind: 'retail.enter', payload: { placeId: shop.id } });
    expect(entered.ok, entered.error).toBe(true);
    const visitId = entered.value!.visitId;

    const stocked = stockAt(sim, shop)[0]!;
    expect(sim.execute({ kind: 'retail.handle', payload: { visitId, catalogId: stocked.item.id } }).ok).toBe(true);
    expect(sim.execute({ kind: 'retail.basket', payload: { visitId, catalogId: stocked.item.id, take: true } }).ok).toBe(true);

    const before = sim.ledger.availableFunds(sim.player.primaryAccountId!);
    const paid = sim.execute<{ orderId: string; total: number }>({ kind: 'retail.pay', payload: { visitId } });
    expect(paid.ok, paid.error).toBe(true);
    // Tax on top of the shelf price, and an order in the same place every other purchase lands.
    expect(paid.value!.total).toBeGreaterThanOrEqual(stocked.price);
    expect(sim.universe.orders[paid.value!.orderId]!.channel).toBe('in_store');
    expect(before - sim.ledger.availableFunds(sim.player.primaryAccountId!)).toBe(paid.value!.total);
    expect(sim.ledger.audit()).toEqual([]);

    const visit: RetailVisit = sim.universe.retailVisits![visitId]!;
    expect(visit.status).toBe('bought');
    expect(floorStanding(sim, shop).bought).toBe(1);
  });

  it('does not charge twice when the same counter is rung twice', () => {
    const sim = aLife('retry');
    const shop = aShop(sim, 'nordstrom');
    walkTo(sim, shop);
    const visitId = sim.execute<{ visitId: string }>({ kind: 'retail.enter', payload: { placeId: shop.id } }).value!.visitId;
    const stocked = stockAt(sim, shop)[0]!;
    sim.execute({ kind: 'retail.basket', payload: { visitId, catalogId: stocked.item.id, take: true } });
    const before = sim.ledger.availableFunds(sim.player.primaryAccountId!);
    const first = sim.execute<{ orderId: string; total: number }>({ kind: 'retail.pay', payload: { visitId } });
    const charged = before - sim.ledger.availableFunds(sim.player.primaryAccountId!);
    const second = sim.execute({ kind: 'retail.pay', payload: { visitId } });
    expect(second.ok).toBe(false);
    expect(before - sim.ledger.availableFunds(sim.player.primaryAccountId!)).toBe(charged);
    expect(Object.values(sim.universe.orders).filter((o) => o.id === first.value!.orderId).length).toBe(1);
  });

  it('only lets you try on the things you would try on, and only once each', () => {
    const sim = aLife('fitting');
    const shop = aShop(sim, 'nordstrom');
    walkTo(sim, shop);
    const visitId = sim.execute<{ visitId: string }>({ kind: 'retail.enter', payload: { placeId: shop.id } }).value!.visitId;
    const shelf = stockAt(sim, shop);
    const fittable = shelf.find((s) => s.fittable);
    const notFittable = shelf.find((s) => !s.fittable);
    if (fittable) {
      const tried = sim.execute<{ verdict: string }>({ kind: 'retail.try_on', payload: { visitId, catalogId: fittable.item.id } });
      expect(tried.ok, tried.error).toBe(true);
      expect(['yours', 'close', 'wrong_size', 'not_you']).toContain(tried.value!.verdict);
      expect(sim.execute({ kind: 'retail.try_on', payload: { visitId, catalogId: fittable.item.id } }).ok).toBe(false);
      expect(FITTABLE).toContain(fittable.item.category);
    }
    if (notFittable) {
      const refused = sim.execute({ kind: 'retail.try_on', payload: { visitId, catalogId: notFittable.item.id } });
      expect(refused.ok).toBe(false);
    }
  });

  it('refuses to bag something the mirror said was the wrong size', () => {
    const sim = aLife('sizes');
    const shop = aShop(sim, 'nordstrom');
    walkTo(sim, shop);
    const visitId = sim.execute<{ visitId: string }>({ kind: 'retail.enter', payload: { placeId: shop.id } }).value!.visitId;
    const visit = sim.universe.retailVisits![visitId]!;
    const stocked = stockAt(sim, shop).find((s) => s.fittable);
    if (!stocked) return;
    // Write the verdict the mirror could have given, and check the till agrees with it.
    visit.tried.push({ catalogId: stocked.item.id, verdict: 'wrong_size' });
    const refused = sim.execute({ kind: 'retail.basket', payload: { visitId, catalogId: stocked.item.id, take: true } });
    expect(refused.ok).toBe(false);
    expect(refused.error).toMatch(/size/i);
  });

  it('remembers a browser who never buys, separately from a buyer', () => {
    const sim = aLife('browser');
    const shop = aShop(sim, 'uniqlo');
    walkTo(sim, shop);
    for (let i = 0; i < 2; i++) {
      const visitId = sim.execute<{ visitId: string }>({ kind: 'retail.enter', payload: { placeId: shop.id } }).value!.visitId;
      const stocked = stockAt(sim, shop)[0]!;
      sim.execute({ kind: 'retail.handle', payload: { visitId, catalogId: stocked.item.id } });
      expect(sim.execute({ kind: 'retail.walk_out', payload: { visitId } }).ok).toBe(true);
    }
    const standing = floorStanding(sim, shop);
    expect(standing.browsedOnly).toBeGreaterThanOrEqual(1);
    expect(standing.bought).toBe(0);
    expect(openShop(sim, shop.id)).toBeUndefined();
  });

  it('will not let you walk around a place that is not a shop', () => {
    const sim = aLife();
    const park = placesIn(sim.player.currentLocationId).find((p) => p.kind === 'park');
    if (!park) return;
    walkTo(sim, park);
    const refused = sim.execute({ kind: 'retail.enter', payload: { placeId: park.id } });
    expect(refused.ok).toBe(false);
  });
});
