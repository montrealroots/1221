/**
 * A delivery missed (`systems/orders.ts`, from 2026-10-06): Apple's American
 * parcels need a signature, so with nobody home FedEx holds one for its 7
 * days; it's collected on an errand, or goes back and is refunded once.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { homeKeyOf, itemsOf } from '@/engine/systems/items';
import { deliver, heldRefusal, orderStage, ordersOf, placeOrder } from '@/engine/systems/orders';
import { errandStops } from '@/engine/systems/trips';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const parcel = (sim: ReturnType<typeof life>, from: string) => placeOrder(sim, sim.player, { from, arrivesAt: sim.now + MS_DAY, to: { kind: 'home', home: homeKeyOf(sim.player.home)!, spot: 'floor' }, paid: 829_00 }, [{ kind: 'custom', label: `A Thing From ${from}`, quantity: 1, condition: 1 }]);

describe('a delivery missed', () => {
  it('holds an Apple parcel at FedEx for 7 days with nobody home to sign, where another shop’s is left', () => {
    const sim = life('us-ny-newyork', 'missed-hold');
    const p = sim.player;
    p.currentLocationId = 'uk-eng-london';
    const apple = parcel(sim, 'Apple');
    const shop = parcel(sim, 'A Shop');
    expect(deliver(sim, p, apple.id)).toBe(false);
    expect(apple.held).toEqual({ carrier: 'FedEx', from: sim.now, until: sim.now + 7 * MS_DAY });
    expect(orderStage(p, apple, sim.now)).toBe('Held For Collection');
    expect(itemsOf(p).find((i) => i.label === 'A Thing From Apple')!.at.kind).toBe('order');
    // Not delivered twice.
    expect(deliver(sim, p, apple.id)).toBe(false);
    deliver(sim, p, shop.id);
    expect(shop.held).toBeUndefined();
    expect(shop.status).toBe('delivered');
    // Away, it isn't collected; home, it's a stop on errands, and collected.
    expect(heldRefusal(p, apple.id, sim.now)).toBe('It’s collected from FedEx where you live.');
    p.currentLocationId = p.home!.cityId;
    expect(errandStops(sim, p, 'foot').some((s) => s.kind === 'orders.collect' && s.payload.orderId === apple.id)).toBe(true);
    expect(sim.must<{ collected: number }>({ kind: 'orders.collect', payload: { orderId: apple.id } }).collected).toBe(1);
    expect(itemsOf(p).find((i) => i.label === 'A Thing From Apple')!.at.kind).toBe('home');
    expect(apple.status).toBe('delivered');
    expect(sim.execute({ kind: 'orders.collect', payload: { orderId: apple.id } }).error).toBe('No parcel of yours is held for collection.');
  });

  it('hands it over with somebody home', () => {
    const sim = life('us-ny-newyork', 'missed-home');
    const p = sim.player;
    p.currentLocationId = p.home!.cityId;
    sim.universe.scheduled.splice(0, sim.universe.scheduled.length, ...sim.universe.scheduled.filter((x) => !x.requiresPlayer));
    const apple = parcel(sim, 'Apple');
    expect(deliver(sim, p, apple.id)).toBe(true);
    expect(apple.held).toBeUndefined();
  });

  it('isn’t signed for outside America, Apple’s other stores not read', () => {
    const sim = life('uk-eng-london', 'missed-uk');
    const p = sim.player;
    p.currentLocationId = 'us-ny-newyork';
    const apple = parcel(sim, 'Apple');
    deliver(sim, p, apple.id);
    expect(apple.held).toBeUndefined();
  });

  it('uncollected after the 7 days, goes back and is refunded once', () => {
    const sim = life('us-ny-newyork', 'missed-back');
    const p = sim.player;
    p.currentLocationId = 'uk-eng-london';
    const apple = parcel(sim, 'Apple');
    sim.advanceBy(MS_DAY + 60_000);
    expect(apple.held).toBeDefined();
    sim.advanceBy(7 * MS_DAY);
    expect(apple.status).toBe('returned');
    const refunds = () => Object.values(sim.universe.transactions).filter((t) => t.memo === 'Apple: not collected from FedEx, refunded');
    expect(refunds()).toHaveLength(1);
    expect(refunds()[0]!.postings.find((x) => x.accountId === p.primaryAccountId)!.amount).toBe(829_00);
    expect(itemsOf(p).some((i) => i.label === 'A Thing From Apple')).toBe(false);
    sim.advanceBy(7 * MS_DAY);
    expect(refunds()).toHaveLength(1);
    expect(ordersOf(p).filter((o) => o.status === 'returned')).toHaveLength(1);
  });
});
