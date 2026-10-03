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
});
