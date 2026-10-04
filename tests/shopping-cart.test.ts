/**
 * Groceries and toiletries in a basket (`systems/shoppingcart.ts`, from
 * 2026-10-04): put in and taken out, the same thing again one line; checked
 * out a chain at a time in one payment the way chosen; what's bought carried
 * as a single Buy's is; and a single Buy paid by the credit card.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { GROCERY_PRODUCTS } from '@/engine/content/groceries';
import { TOILETRIES } from '@/engine/content/hygiene';
import { groceryPrice, groceryRefusal } from '@/engine/systems/kitchen';
import { toiletryPrice, toiletryRefusal } from '@/engine/systems/hygiene';
import { cartByChain, cartOf } from '@/engine/systems/shoppingcart';
import { itemsOf } from '@/engine/systems/items';
import { cardOf as everydayCard } from '@/engine/systems/credit';

const life = (seed: string) => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);

describe('the basket', () => {
  it('holds groceries and toiletries, one line a thing, and checks out a chain in one payment', () => {
    const sim = life('cart');
    const food = GROCERY_PRODUCTS.filter((g) => !groceryRefusal(sim, sim.player, g.id, 1));
    const a = food[0]!;
    const b = food.find((g) => g.chain === a.chain && g.id !== a.id)!;
    const t = TOILETRIES.find((x) => x.chain === a.chain && !toiletryRefusal(sim.player, x.id, 1, sim.now)) ?? TOILETRIES.find((x) => !toiletryRefusal(sim.player, x.id, 1, sim.now))!;
    sim.must({ kind: 'cart.add', payload: { kind: 'grocery', productId: a.id } });
    sim.must({ kind: 'cart.add', payload: { kind: 'grocery', productId: a.id, quantity: 2 } });
    const bLine = sim.must<{ lineId: string }>({ kind: 'cart.add', payload: { kind: 'grocery', productId: b.id } });
    sim.must({ kind: 'cart.add', payload: { kind: 'toiletry', productId: t.id } });
    expect(cartOf(sim.player).find((l) => l.productId === a.id)!.quantity).toBe(3);
    sim.must({ kind: 'cart.remove', payload: { lineId: bLine.lineId } });
    expect(cartOf(sim.player).some((l) => l.productId === b.id)).toBe(false);
    expect(sim.execute({ kind: 'cart.add', payload: { kind: 'grocery', productId: 'nothing' } }).error).toBe('That isn’t on sale.');
    // The chain's lines, its total, one payment.
    const group = cartByChain(sim, sim.player).find((g) => g.chain === a.chain)!;
    const expected = groceryPrice(sim, 'us-ny-newyork', a) * 3 + (t.chain === a.chain ? toiletryPrice(sim, 'us-ny-newyork', t) : 0);
    expect(group.total).toBe(expected);
    const txns = sim.universe.transactions.length;
    const before = itemsOf(sim.player).length;
    const r = sim.must<{ paid: number }>({ kind: 'cart.checkout', payload: { chain: a.chain } });
    expect(r.paid).toBe(expected);
    expect(sim.universe.transactions.length - txns).toBe(1);
    expect(itemsOf(sim.player).length - before).toBe(3 + (t.chain === a.chain ? 1 : 0));
    // What's bought is carried until it's put away, as a single Buy's is.
    expect(itemsOf(sim.player).filter((i) => i.kind === a.id).every((i) => i.at.kind !== 'home' || i.at.spot !== undefined)).toBe(true);
    expect(cartOf(sim.player).some((l) => l.productId === a.id)).toBe(false);
    expect(sim.execute({ kind: 'cart.checkout', payload: { chain: a.chain } }).error).toBe('The basket has nothing from that chain.');
  });

  it('pays by the credit card where chosen, at the basket’s till or a single Buy’s, and says why it can’t', () => {
    const sim = life('cart-credit');
    const a = GROCERY_PRODUCTS.find((g) => !groceryRefusal(sim, sim.player, g.id, 1))!;
    const card = everydayCard(sim, sim.player)!;
    expect(card).toBeDefined();
    const owed = card.balance;
    sim.must({ kind: 'food.buy_groceries', payload: { productId: a.id, payWith: 'credit' } });
    expect(card.balance).toBe(owed - groceryPrice(sim, 'us-ny-newyork', a));
    sim.must({ kind: 'cart.add', payload: { kind: 'grocery', productId: a.id } });
    sim.must({ kind: 'cart.checkout', payload: { chain: a.chain, payWith: 'credit' } });
    expect(card.balance).toBe(owed - 2 * groceryPrice(sim, 'us-ny-newyork', a));
    // Without a card, it says so.
    sim.must({ kind: 'cart.add', payload: { kind: 'grocery', productId: a.id } });
    card.closedAt = sim.now;
    expect(sim.execute({ kind: 'cart.checkout', payload: { chain: a.chain, payWith: 'credit' } }).error).toBe('There’s no credit card to pay with.');
    expect(sim.execute({ kind: 'food.buy_groceries', payload: { productId: a.id, payWith: 'credit' } }).error).toBe('There’s no credit card to pay with.');
    // Away where the chain has no store, the basket can't be checked out there.
    sim.player.currentLocationId = 'uk-eng-london';
    expect(sim.execute({ kind: 'cart.checkout', payload: { chain: a.chain } }).error).toBe(`${a.name}: There’s no store of that chain here.`);
  });
});
