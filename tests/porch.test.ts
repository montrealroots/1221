/**
 * A parcel taken from the door (`takenFromDoor` in `systems/orders.ts`,
 * from 2026-10-02): delivered to a home, it's stolen at the market's count
 * of parcels stolen over parcels delivered, and what was in it is gone.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { homeKeyOf, itemsOf } from '@/engine/systems/items';
import { PARCEL_THEFT, deliver, ordersOf, placeOrder, takenFromDoor } from '@/engine/systems/orders';
import { replaceWornOut } from '@/engine/systems/clothing';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);

describe('a parcel at the door', () => {
  it('is taken at the market’s rate: Security.org’s 0.168% in America, none counted in Ireland', () => {
    expect(PARCEL_THEFT.us).toBeCloseTo(0.00168, 5);
    expect(PARCEL_THEFT.uk).toBeCloseTo(0.00122, 5);
    const ny = life('us-ny-newyork', 'porch-rate');
    let taken = 0;
    for (let i = 0; i < 40_000; i += 1) if (takenFromDoor(ny, ny.player, `o${i}`)) taken += 1;
    expect(taken / 40_000).toBeGreaterThan(0.0008);
    expect(taken / 40_000).toBeLessThan(0.003);
    const dub = life('ie-lei-dublin', 'porch-ie');
    for (let i = 0; i < 2_000; i += 1) expect(takenFromDoor(dub, dub.player, `o${i}`)).toBe(false);
  });

  it('taken, leaves nothing of the order, and says so', () => {
    const sim = life('us-ny-newyork', 'porch-take');
    const p = sim.player;
    const order = placeOrder(sim, p, { from: 'A Shop', arrivesAt: sim.now + MS_DAY, to: { kind: 'home', home: homeKeyOf(p.home)!, spot: 'floor' }, paid: 10_00 }, [{ kind: 'custom', label: 'A Thing', quantity: 1, condition: 1 }]);
    const was = PARCEL_THEFT.us!;
    (PARCEL_THEFT as Record<string, number>).us = 1;
    try { deliver(sim, p, order.id); } finally { (PARCEL_THEFT as Record<string, number>).us = was; }
    expect(ordersOf(p)[0]!.stolen).toBe(true);
    expect(itemsOf(p).some((i) => i.label === 'A Thing')).toBe(false);
    const kept = placeOrder(sim, p, { from: 'A Shop', arrivesAt: sim.now + MS_DAY, to: { kind: 'home', home: homeKeyOf(p.home)!, spot: 'floor' }, paid: 10_00 }, [{ kind: 'custom', label: 'Another Thing', quantity: 1, condition: 1 }]);
    (PARCEL_THEFT as Record<string, number>).us = 0;
    try { deliver(sim, p, kept.id); } finally { (PARCEL_THEFT as Record<string, number>).us = was; }
    expect(itemsOf(p).find((i) => i.label === 'Another Thing')!.at.kind).toBe('home');
  });

  it('taken with clothes in it, has them bought again on a free day, as a worn-out garment is', () => {
    const sim = life('us-ny-newyork', 'porch-clothes');
    const p = sim.player;
    const order = placeOrder(sim, p, { from: 'Uniqlo', arrivesAt: sim.now + MS_DAY, to: { kind: 'home', home: homeKeyOf(p.home)!, spot: 'drawers' }, paid: 10_00 }, [{ kind: 'x', label: 'Socks', quantity: 1, condition: 1, garment: { kind: 'socks', slot: 'socks', care: 'wash', wears: 0, washes: 0 } }]);
    const was = PARCEL_THEFT.us!;
    (PARCEL_THEFT as Record<string, number>).us = 1;
    try { deliver(sim, p, order.id); } finally { (PARCEL_THEFT as Record<string, number>).us = was; }
    expect(p.garmentsToReplace).toEqual([{ kind: 'socks', slot: 'socks', care: 'wash', label: 'Socks' }]);
    const socks = () => itemsOf(p).filter((i) => i.garment?.slot === 'socks').length;
    const before = socks();
    expect(replaceWornOut(sim, p)).toBeGreaterThanOrEqual(1);
    expect(p.garmentsToReplace).toBeUndefined();
    expect(socks()).toBeGreaterThan(before);
  });
});
