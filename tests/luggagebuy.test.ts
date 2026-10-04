/**
 * Bags bought and chosen (`luggage.buy`, `luggage.choose` in
 * `systems/luggage.ts`, `content/luggagecatalog.ts`, from 2026-10-02).
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { LUGGAGE } from '@/engine/content/luggagecatalog';
import { salesTaxRate } from '@/engine/content/tax';
import { inSaveMoney } from '@/engine/systems/banking';
import { bagsOf, buyLuggageRefusal, luggageCatalog, luggagePrice, luggageProduct, packedIn, suitcaseOf } from '@/engine/systems/luggage';
import { garmentsOf } from '@/engine/systems/wardrobe';

const life = (seed: string) => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);

describe('a bag', () => {
  it('is bought where you live at its price with the town’s tax, cheapest first, holding its maker’s liters', () => {
    const sim = life('bag-buy');
    const shop = luggageCatalog(sim, sim.player);
    expect(shop.every((x) => x.piece.country === 'us')).toBe(true);
    expect(shop.map((x) => x.price)).toEqual([...shop.map((x) => x.price)].sort((a, b) => a - b));
    const big = shop.find((x) => x.piece.type === 'large')!.piece;
    expect(luggagePrice(sim, 'us-ny-newyork', big)).toBe(inSaveMoney(sim, Math.round(big.price * (1 + salesTaxRate('us-ny-newyork', sim.now, 'goods')) * 100), 'USD'));
    const r = sim.execute<{ itemId: string }>({ kind: 'luggage.buy', payload: { pieceId: big.id } });
    expect(r.ok, r.error).toBe(true);
    const bag = bagsOf(sim.player).find((b) => b.id === r.value!.itemId)!;
    expect(bag.holdsL).toBe(big.liters);
    expect(buyLuggageRefusal(sim.player, LUGGAGE.find((x) => x.country === 'uk')!.id)).toBe('It’s sold in another country.');
  });

  it('goes away with you once chosen, but not over one still packed', () => {
    const sim = life('bag-choose');
    const p = sim.player;
    const first = suitcaseOf(p)!;
    const big = luggageCatalog(sim, p).find((x) => x.piece.type === 'large')!.piece;
    const r = sim.execute<{ itemId: string }>({ kind: 'luggage.buy', payload: { pieceId: big.id } });
    expect(suitcaseOf(p)!.id).toBe(first.id);
    const shirt = garmentsOf(p)[0]!;
    shirt.at = { kind: 'inside', itemId: first.id };
    expect(packedIn(p, first)).toContain(shirt);
    expect(sim.execute({ kind: 'luggage.choose', payload: { itemId: r.value!.itemId } }).error).toBe('Unpack the one you have first.');
    shirt.at = { kind: 'person' };
    sim.must({ kind: 'luggage.choose', payload: { itemId: r.value!.itemId } });
    expect(suitcaseOf(p)!.id).toBe(r.value!.itemId);
  });
});

describe('a bag as a product', () => {
  it('keeps its product and the offer it was bought on, and refuses a color it isn’t offered in', () => {
    const sim = life('bag-product');
    const piece = luggageCatalog(sim, sim.player)[0]!.piece;
    expect(sim.execute({ kind: 'luggage.buy', payload: { pieceId: piece.id, color: 'Not A Color' } }).error).toBe('It isn’t offered in that color.');
    const r = sim.must<{ itemId: string }>({ kind: 'luggage.buy', payload: { pieceId: piece.id } });
    const bag = sim.player.items!.find((i) => i.id === r.itemId)!;
    expect(bag.spec).toMatchObject({ product: piece.productId, offer: piece.id });
    expect(luggageProduct(piece)!.offers.some((o) => o.id === piece.id)).toBe(true);
  });
});
