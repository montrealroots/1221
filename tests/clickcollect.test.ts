/**
 * Collecting an online order in store (`content/clickcollect.ts`,
 * `clothes.collect_order` in `systems/clothing.ts`, from 2026-10-02): sent
 * to the retailer's store where you live at its own fee, ready after its
 * stated time, held its days, then sent back and refunded.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { CLOTHING_PRODUCTS } from '@/engine/content/clothingcatalog';
import { buyRefusal, collectRefusal, purchaseQuote, purchaseItems } from '@/engine/systems/clothing';
import { inSaveMoney } from '@/engine/systems/banking';
import { PARCEL_THEFT } from '@/engine/systems/orders';

const THEFT_US = PARCEL_THEFT.us!;

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const firstOf = (retailer: string) => CLOTHING_PRODUCTS.find((p) => p.retailer === retailer)!;
const opts = (p: (typeof CLOTHING_PRODUCTS)[number]) => ({ productId: p.id, how: 'collect' as const, size: p.sizes[0], color: p.colors.length > 1 ? p.colors[0] : undefined, quantity: 1 });

describe('an order collected in store', () => {
  it('is ready at Target that day, collected, and home', () => {
    const sim = life('us-ny-newyork', 'collect-target');
    const p = sim.player;
    const product = firstOf('us-target');
    const q = purchaseQuote(sim, p, opts(product))!;
    expect(q.delivery).toBe(0);
    // Never left at a door, however likely a parcel there is to be taken.
    (PARCEL_THEFT as Record<string, number>).us = 1;
    expect(q.arrivesAt! - sim.now).toBe(2 * 3_600_000);
    const { purchaseId } = sim.must<{ purchaseId: string }>({ kind: 'clothes.buy', payload: opts(product) });
    const bought = p.clothesBought!.find((b) => b.id === purchaseId)!;
    expect(collectRefusal(p, bought.orderId!)).toBe('It isn’t ready yet.');
    sim.advanceTo(q.arrivesAt! + 60_000);
    (PARCEL_THEFT as Record<string, number>).us = THEFT_US;
    expect(purchaseItems(p, purchaseId).every((i) => i.at.kind === 'service')).toBe(true);
    // Collected in its town, not from another.
    p.currentLocationId = 'us-ca-losangeles';
    expect(collectRefusal(p, bought.orderId!)).toBe('It’s collected in New York.');
    p.currentLocationId = 'us-ny-newyork';
    sim.must({ kind: 'clothes.collect_order', payload: { orderId: bought.orderId } });
    expect(purchaseItems(p, purchaseId).every((i) => i.at.kind === 'home')).toBe(true);
  });

  it('left uncollected past its hold, goes back and is refunded', () => {
    const sim = life('us-ny-newyork', 'collect-late');
    const p = sim.player;
    const product = firstOf('us-target');
    const { purchaseId } = sim.must<{ purchaseId: string }>({ kind: 'clothes.buy', payload: opts(product) });
    const bought = p.clothesBought!.find((b) => b.id === purchaseId)!;
    sim.advanceBy(4 * MS_DAY);
    expect(purchaseItems(p, purchaseId)).toEqual([]);
    expect(bought.returnedAt).toBeDefined();
    expect(Object.values(sim.universe.transactions).some((t) => t.memo.endsWith('uncollected, refunded'))).toBe(true);
  });

  it('costs John Lewis’s £2.95 under £40, and is offered only where SLATE has the terms and a store where you live', () => {
    const sim = life('uk-eng-london', 'collect-jl');
    const p = sim.player;
    const cheap = CLOTHING_PRODUCTS.filter((x) => x.retailer === 'gb-john-lewis').sort((a, b) => a.price - b.price)[0]!;
    expect(cheap.price).toBeLessThan(40);
    expect(purchaseQuote(sim, p, opts(cheap))!.delivery).toBe(inSaveMoney(sim, 2_95, 'GBP'));
    const dear = CLOTHING_PRODUCTS.find((x) => x.retailer === 'gb-john-lewis' && x.price >= 40)!;
    expect(purchaseQuote(sim, p, opts(dear))!.delivery).toBe(0);
    const ny = life('us-ny-newyork', 'collect-gap');
    const gap = CLOTHING_PRODUCTS.find((x) => x.retailer === 'us-gap')!;
    expect(buyRefusal(ny.player, opts(gap))).toMatch(/^SLATE doesn’t have .*’s terms for collecting in store\.$/);
  });
});
