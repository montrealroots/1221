/**
 * A receipt (`ui/looks/receipt.tsx`, from 2026-10-03): the order's lines
 * together, what paid, and the return window from when it was had.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, formatDate } from '@/engine/core/time';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { resolveLook, type Looked } from '@/ui/looks/registry';
import { at } from '@/ui/looks/subject';
import '@/ui/looks/all';
import { purchaseQuote } from '@/engine/systems/clothing';
import { ordersOf } from '@/engine/systems/orders';

describe('a receipt', () => {
  it('holds every line of its order, and none of another', () => {
    const sim = quickSave();
    const now = sim.now;
    sim.player.clothesBought = [
      { id: 'a', productId: 'us-everlane-the-premium-weight-crew', retailerId: 'us-everlane', how: 'store', at: now - 2 * MS_DAY, goods: 48_00, count: 1 },
      { id: 'b', productId: 'us-everlane-the-premium-weight-crew', retailerId: 'us-everlane', how: 'online', orderId: 'o1', at: now - MS_DAY, goods: 30_00, count: 1 },
      { id: 'c', productId: 'us-everlane-the-premium-weight-crew', retailerId: 'us-everlane', how: 'online', orderId: 'o1', at: now - MS_DAY, goods: 20_00, count: 1, returnedAt: now },
    ];
    const order = resolveLook(sim, at('receipt', 'b')) as Looked;
    const cur = saveCurrency(sim.universe);
    expect(order.summary).toBe(`On ${formatDate(now - MS_DAY, sim.zone)} you paid ${formatMoney(50_00, cur)} for 2 lines, bought online, delivered, and 1 of them came back.`);
    const alone = resolveLook(sim, at('receipt', 'a')) as Looked;
    expect(alone.summary).toBe(`On ${formatDate(now - 2 * MS_DAY, sim.zone)} you paid ${formatMoney(48_00, cur)} for one line, bought in store.`);
    expect(resolveLook(sim, at('receipt', 'nope'))).toEqual({ gone: 'There’s no receipt by that name among what you’ve bought.' });
  });

  it('says what the order paid, its delivery with its goods (from 2026-10-05)', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'receipt-delivery');
    const o = { productId: 'us-uniqlo-supima-cotton-t-shirt', how: 'online' as const, size: 'M', color: '00 WHITE' };
    const q = purchaseQuote(sim, sim.player, o)!;
    expect(q.delivery).toBeGreaterThan(0);
    const r = sim.execute<{ purchaseId: string }>({ kind: 'clothes.buy', payload: o });
    expect(r.ok, r.error).toBe(true);
    const order = ordersOf(sim.player).at(-1)!;
    expect(order.paid).toBe(q.total);
    const looked = resolveLook(sim, at('receipt', r.value!.purchaseId)) as Looked;
    expect(looked.summary).toContain(`you paid ${formatMoney(q.total, saveCurrency(sim.universe))} for one line`);
  });
});
