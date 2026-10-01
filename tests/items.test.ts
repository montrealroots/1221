/**
 * Possessions and where each one is (`systems/items.ts`, `systems/orders.ts`,
 * from 2026-10-01): owning a thing apart from having it to hand, moving and
 * packing it, belongings following a move, an order delivered once, and all
 * of it through a save and a load.
 */
import { describe, expect, it } from 'vitest';
import { loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { addItem, followTheMove, homeKeyOf, itemsOf, leavingHome, reachable, toHand, type Item } from '@/engine/systems/items';
import { deliver, ordersOf, placeOrder } from '@/engine/systems/orders';
import { owns } from '@/engine/systems/furniture';

const DAY = 86_400_000;
const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const atHome = (sim: Simulation): Item['at'] => ({ kind: 'home', home: homeKeyOf(sim.player.home)!, spot: 'floor' });
const thing = (sim: Simulation, label: string, at: Item['at'], extra: Partial<Item> = {}) => addItem(sim, sim.player, { kind: `test:${label}`, label, quantity: 1, condition: 1, at, acquiredAt: sim.now, ...extra });

describe('owning a thing, and having it to hand', () => {
  it('moves a save’s bed and sofa into items at the home they live in', () => {
    const sim = life('us-ny-newyork', 'items-migrate');
    sim.player.furniture = { bed: sim.now - 10 * DAY, sofa: sim.now - 5 * DAY };
    // Beside the clothes the life began with.
    const items = itemsOf(sim.player).filter((i) => !i.garment);
    expect(items.map((i) => i.kind).sort()).toEqual(['furniture:bed', 'furniture:sofa']);
    expect(items.every((i) => i.at.kind === 'home' && i.at.home === homeKeyOf(sim.player.home))).toBe(true);
    expect(items.find((i) => i.kind === 'furniture:bed')!.acquiredAt).toBe(sim.now - 10 * DAY);
    expect(sim.player.furniture).toBeUndefined();
    expect(owns(sim.player, 'bed')).toBe(true);
    // A bed is moved by movers: between spots at home, never onto a person or into a bag.
    const bed = items.find((i) => i.kind === 'furniture:bed')!;
    expect(sim.execute({ kind: 'items.move', payload: { itemId: bed.id, to: { kind: 'person' } } }).error).toMatch(/moved by movers/);
    expect(sim.execute({ kind: 'items.move', payload: { itemId: bed.id, to: { kind: 'home', home: homeKeyOf(sim.player.home)!, spot: 'wardrobe' } } }).error).toMatch(/stands in a room/);
    expect(sim.execute({ kind: 'items.move', payload: { itemId: bed.id, to: { kind: 'home', home: homeKeyOf(sim.player.home)!, spot: 'storage' } } }).ok).toBe(true);
    // The fridge is for food.
    const lamp = addItem(sim, sim.player, { kind: 'test:lamp', label: 'Lamp', quantity: 1, condition: 1, at: { kind: 'person' }, acquiredAt: sim.now });
    expect(sim.execute({ kind: 'items.move', payload: { itemId: lamp.id, to: { kind: 'home', home: homeKeyOf(sim.player.home)!, spot: 'fridge' } } }).error).toMatch(/The Fridge is for food/);
  });

  it('has a thing at home to hand only at home, and one in a bag wherever the bag is', () => {
    const sim = life('us-ny-newyork', 'items-reach');
    const lamp = thing(sim, 'Lamp', atHome(sim));
    const bag = thing(sim, 'Suitcase', { kind: 'person' }, { holdsL: 40, volumeL: 45 });
    const shirt = thing(sim, 'Shirt', { kind: 'inside', itemId: bag.id }, { volumeL: 2 });
    expect(reachable(sim, sim.player, lamp.at)).toBe(true);
    // Away in another town: the lamp stays home, the bag and its shirt come along.
    sim.player.currentLocationId = 'us-ca-losangeles';
    expect(reachable(sim, sim.player, lamp.at)).toBe(false);
    expect(reachable(sim, sim.player, shirt.at)).toBe(true);
    expect(toHand(sim, sim.player).map((i) => i.label).sort()).toEqual(['Shirt', 'Suitcase']);
  });

  it('moves a thing only from where it’s to hand, into room enough, and never inside itself', () => {
    const sim = life('us-ny-newyork', 'items-move');
    const bag = thing(sim, 'Carry-On', atHome(sim), { holdsL: 10, volumeL: 12 });
    const coat = thing(sim, 'Coat', atHome(sim), { volumeL: 8 });
    const boots = thing(sim, 'Boots', atHome(sim), { volumeL: 5 });
    const move = (item: Item, to: Item['at']) => sim.execute({ kind: 'items.move', payload: { itemId: item.id, to } });
    expect(move(coat, { kind: 'inside', itemId: bag.id }).ok).toBe(true);
    // 2 liters left for 5.
    expect(move(boots, { kind: 'inside', itemId: bag.id }).error).toMatch(/2 liters left; the Boots needs 5/);
    expect(move(bag, { kind: 'inside', itemId: bag.id }).error).toMatch(/inside itself/);
    expect(move(boots, { kind: 'inside', itemId: coat.id }).error).toMatch(/doesn’t hold/);
    // A bag can't go into what it holds.
    const pouch = thing(sim, 'Pouch', { kind: 'inside', itemId: bag.id }, { holdsL: 3, volumeL: 0 });
    expect(move(bag, { kind: 'inside', itemId: pouch.id }).error).toMatch(/holds that already/);
    // Away, the boots at home can't be moved.
    sim.player.currentLocationId = 'us-ca-losangeles';
    expect(move(boots, { kind: 'person' }).error).toMatch(/isn’t to hand: at another home|isn’t to hand/);
    // Nor can what's on them be put down at a home they aren't at, or on an order.
    const watch = thing(sim, 'Watch', { kind: 'person' });
    expect(move(watch, atHome(sim)).error).toMatch(/can’t get to that place/);
    expect(move(watch, { kind: 'order', orderId: 'x' }).error).toMatch(/can’t get to that place/);
  });

  it('brings the belongings to the new home on a move, and the bed’s movers are paid from the home left', () => {
    const sim = life('us-ny-newyork', 'items-follow');
    sim.universe.accounts[sim.player.primaryAccountId!]!.balance += 50_000_00;
    sim.player.furniture = { bed: sim.now };
    const lamp = thing(sim, 'Lamp', atHome(sim));
    const kind = sim.player.home!.kind === 'shared' ? 'own' : 'shared';
    expect(sim.execute({ kind: 'home.move', payload: { kind } }).ok).toBe(true);
    expect(lamp.at).toEqual({ kind: 'home', home: homeKeyOf(sim.player.home), spot: 'floor' });
    expect(owns(sim.player, 'bed')).toBe(true);
    expect(sim.universe.transactions.filter((t) => t.memo === 'Movers, your bed and sofa')).toHaveLength(1);
    // A move made by hand, with followTheMove, the same.
    const from = leavingHome(sim.player);
    sim.player.home = { ...sim.player.home!, since: sim.now + 1 };
    followTheMove(sim.player, from);
    expect((lamp.at as { home: string }).home).toBe(homeKeyOf(sim.player.home));
  });
});

describe('an order', () => {
  it('is on its way until it’s delivered, once, to where it was sent, or to where they live now', () => {
    const sim = life('us-ny-newyork', 'items-order');
    const order = placeOrder(sim, sim.player, { from: 'A Test Shop', arrivesAt: sim.now + 3 * DAY, to: atHome(sim), paid: 100_00 }, [{ kind: 'test:mug', label: 'Mug', quantity: 2, condition: 1, volumeL: 0.4 }]);
    const mug = itemsOf(sim.player).find((i) => i.kind === 'test:mug')!;
    expect(mug.at).toEqual({ kind: 'order', orderId: order.id });
    expect(reachable(sim, sim.player, mug.at)).toBe(false);
    sim.advanceBy(2 * DAY);
    expect(ordersOf(sim.player)[0]!.status).toBe('placed');
    sim.advanceBy(2 * DAY);
    expect(ordersOf(sim.player)[0]!.status).toBe('delivered');
    expect(reachable(sim, sim.player, mug.at)).toBe(true);
    // Delivered once: a second delivery changes nothing.
    expect(deliver(sim, sim.player, order.id)).toBe(false);
    expect(itemsOf(sim.player).filter((i) => i.kind === 'test:mug')).toHaveLength(1);
    // Sent to a home they've left, it's forwarded to the one they live in.
    const second = placeOrder(sim, sim.player, { from: 'A Test Shop', arrivesAt: sim.now + DAY, to: atHome(sim), paid: 10_00 }, [{ kind: 'test:plate', label: 'Plate', quantity: 1, condition: 1 }]);
    const from = leavingHome(sim.player);
    sim.player.home = { ...sim.player.home!, since: sim.now + 1 };
    followTheMove(sim.player, from);
    sim.advanceBy(2 * DAY);
    const plate = itemsOf(sim.player).find((i) => i.kind === 'test:plate')!;
    expect(plate.at).toEqual({ kind: 'home', home: homeKeyOf(sim.player.home), spot: 'floor' });
    expect(ordersOf(sim.player).find((o) => o.id === second.id)!.status).toBe('delivered');
  });

  it('keeps items, orders and where each thing is through a save and a load', () => {
    const sim = life('us-ny-newyork', 'items-save');
    const bag = thing(sim, 'Suitcase', { kind: 'person' }, { holdsL: 40 });
    thing(sim, 'Shirt', { kind: 'inside', itemId: bag.id }, { volumeL: 2 });
    placeOrder(sim, sim.player, { from: 'A Test Shop', arrivesAt: sim.now + 3 * DAY, to: atHome(sim), paid: 5_00 }, [{ kind: 'test:cup', label: 'Cup', quantity: 1, condition: 1 }]);
    const back = loadSave(deserialise(serialise(sim.universe)));
    expect(back.player.items).toEqual(sim.player.items);
    expect(back.player.orders).toEqual(sim.player.orders);
    back.advanceBy(4 * DAY);
    expect(itemsOf(back.player).find((i) => i.kind === 'test:cup')!.at.kind).toBe('home');
  });
});
