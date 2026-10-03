/**
 * An order's tracking (`orderStage` in `systems/orders.ts`, from 2026-10-03):
 * label created, in transit from the next day, out for delivery from eight
 * on the day it comes, said that morning, then delivered.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, MS_HOUR, instantFromZoned, zonedParts } from '@/engine/core/time';
import { homeKeyOf } from '@/engine/systems/items';
import { ordersOf, orderStage, outForDeliveryAt, placeOrder } from '@/engine/systems/orders';

describe('an order’s tracking', () => {
  it('runs from its label to out for delivery at eight the day it comes, said that morning, then delivered', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'track');
    const p = sim.player;
    const z = 'America/New_York';
    const d = zonedParts(sim.now + 4 * MS_DAY, z);
    const arrives = instantFromZoned({ year: d.year, month: d.month, day: d.day, hour: 14, minute: 0 }, z);
    const o = placeOrder(sim, p, { from: 'A Shop', arrivesAt: arrives, to: { kind: 'home', home: homeKeyOf(p.home)!, spot: 'floor' }, paid: 10_00 }, [{ kind: 'custom', label: 'A Thing', quantity: 1, condition: 1 }]);
    expect(orderStage(p, o, sim.now)).toBe('Label Created');
    expect(orderStage(p, o, sim.now + 2 * MS_DAY)).toBe('In Transit');
    expect(outForDeliveryAt(p, o)).toBe(instantFromZoned({ year: d.year, month: d.month, day: d.day, hour: 8, minute: 0 }, z));
    expect(orderStage(p, o, outForDeliveryAt(p, o))).toBe('Out For Delivery');
    sim.advanceTo(outForDeliveryAt(p, o) + MS_HOUR);
    expect(sim.universe.notifications.some((n) => n.title === 'Out For Delivery')).toBe(true);
    sim.advanceTo(arrives + MS_HOUR);
    expect(orderStage(p, ordersOf(p).find((x) => x.id === o.id)!, sim.now)).toBe('Delivered');
  });
});
