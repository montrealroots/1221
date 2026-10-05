/**
 * Paying at the till the way chosen (`payWith` in `systems/household.ts`,
 * from 2026-10-03): the debit card, the credit card within its limit, or
 * cash from the wallet in a store; and a return refunded to what paid.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { cardOf, cardRoom } from '@/engine/systems/credit';
import { walletOf } from '@/engine/systems/cash';
import { payWithRefusal } from '@/engine/systems/household';
import { buyRefusal, purchaseQuote, retailerById } from '@/engine/systems/clothing';
import { CLOTHING_PRODUCTS } from '@/engine/content/clothingcatalog';
import { pendingDaysOf, pendingOn } from '@/engine/systems/pending';

const life = (seed: string) => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);
const SHIRT = { productId: 'us-uniqlo-supima-cotton-t-shirt', how: 'store' as const, size: 'M', color: '00 WHITE' };

describe('paying at the till', () => {
  it('in cash, from the wallet, only in a store and only with the cash there', () => {
    const sim = life('pay-cash');
    const o = SHIRT;
    const total = purchaseQuote(sim, sim.player, o)!.total;
    expect(payWithRefusal(sim, sim.player, total, 'cash', false)).toBe('Cash is paid in a store.');
    const wallet = walletOf(sim, sim.player, true)!;
    wallet.balance = total - 1;
    expect(sim.execute({ kind: 'clothes.buy', payload: { ...o, payWith: 'cash' } }).error).toBe('There isn’t that much cash in your wallet.');
    wallet.balance = total + 500;
    const bank = sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
    const r = sim.execute<{ purchaseId: string }>({ kind: 'clothes.buy', payload: { ...o, payWith: 'cash' } });
    expect(r.ok, r.error).toBe(true);
    expect(wallet.balance).toBe(500);
    expect(sim.universe.accounts[sim.player.primaryAccountId!]!.balance).toBe(bank);
    expect(sim.player.clothesBought!.find((b) => b.id === r.value!.purchaseId)!.paidFrom).toEqual([{ accountId: wallet.id, share: 1 }]);
    // A basket checked out in cash the same way.
    wallet.balance = total;
    expect(sim.execute({ kind: 'clothes.basket_add', payload: o }).ok).toBe(true);
    const out = sim.execute({ kind: 'clothes.checkout', payload: { retailerId: 'us-uniqlo', how: 'store', payWith: 'cash' } });
    expect(out.ok, out.error).toBe(true);
    expect(wallet.balance).toBe(0);
  });

  it('on the credit card, within what it has left', () => {
    const sim = life('pay-credit');
    const o = SHIRT;
    if (!cardOf(sim, sim.player)) expect(sim.execute({ kind: 'card.apply', payload: {} }).ok).toBe(true);
    const card = cardOf(sim, sim.player)!;
    const total = purchaseQuote(sim, sim.player, o)!.total;
    const room = cardRoom(sim.player, card);
    const owed = card.balance;
    const r = sim.execute<{ purchaseId: string }>({ kind: 'clothes.buy', payload: { ...o, payWith: 'credit' } });
    expect(r.ok, r.error).toBe(true);
    expect(card.balance).toBe(owed - total);
    // Authorized now, posted in the card's days, as a card purchase is.
    if (pendingDaysOf(card).days > 0) expect(pendingOn(sim, card)).toBe(-total);
    else expect(pendingOn(sim, card)).toBe(0);
    expect(cardRoom(sim.player, card)).toBe(room - total);
    expect(payWithRefusal(sim, sim.player, cardRoom(sim.player, card) + 1, 'credit', true)).toBe('It’s past what the credit card has left.');
  });

  it('called off, goes back to the card that paid, not the bank (from 2026-10-05)', () => {
    // In London, where the law lets an order be called off before it comes.
    const sim = quickSave({ startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london', livesWhereBorn: true, wealth: 'wealthy' }, 'pay-cancel');
    if (!cardOf(sim, sim.player)) expect(sim.execute({ kind: 'card.apply', payload: {} }).ok).toBe(true);
    const card = cardOf(sim, sim.player)!;
    const p = CLOTHING_PRODUCTS.find((x) => x.market === 'GB' && retailerById(x.retailer)!.delivers && x.sizes.length > 0 && x.price < 60 && !buyRefusal(sim.player, { productId: x.id, how: 'online', size: x.sizes[0], color: x.colors[0] }))!;
    const bank = sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
    const owed = card.balance;
    const r = sim.execute<{ purchaseId: string }>({ kind: 'clothes.buy', payload: { productId: p.id, how: 'online', size: p.sizes[0], color: p.colors[0], payWith: 'credit' } });
    expect(r.ok, r.error).toBe(true);
    expect(card.balance).toBeLessThan(owed);
    sim.must({ kind: 'clothes.cancel', payload: { purchaseId: r.value!.purchaseId } });
    expect(card.balance).toBe(owed);
    expect(sim.universe.accounts[sim.player.primaryAccountId!]!.balance).toBe(bank);
  });
});
