/**
 * A computer of one's own (`systems/computers.ts`, `content/computercatalog.ts`,
 * from 2026-10-05): sold where they live, kept at the home with its model,
 * and one with a graphics card of its own playing a games lover's games at
 * home as a console does (`lovedIn` in `systems/enjoyment.ts`).
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { COMPUTER_PRODUCTS, computerCatalog, computerRefusal, gamingComputer } from '@/engine/systems/computers';
import { lovedIn } from '@/engine/systems/enjoyment';
import { itemsOf } from '@/engine/systems/items';

const life = (seed: string) => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);

describe('a computer', () => {
  it('is sold where you live, cheapest first', () => {
    const sim = life('pc-shop');
    const shop = computerCatalog(sim, sim.player);
    expect(shop.length).toBeGreaterThan(0);
    expect(shop.every((r) => r.offer.market === 'us')).toBe(true);
    expect(shop.map((r) => r.price)).toEqual([...shop.map((r) => r.price)].sort((a, b) => a - b));
    const abroad = COMPUTER_PRODUCTS.flatMap((p) => p.offers).find((o) => o.market === 'uk')!;
    expect(computerRefusal(sim.player, abroad.id)).toBe('It’s sold in another country.');
  });

  it('with a card of its own plays a games lover’s games at home; with built-in graphics it doesn’t', () => {
    const sim = life('pc-games');
    sim.player.interests = ['games'];
    delete sim.player.furniture;
    sim.player.items = itemsOf(sim.player).filter((i) => i.kind !== 'furniture:console');
    expect(lovedIn(sim.player, 'unwind')).not.toContain('games');
    const shop = computerCatalog(sim, sim.player);
    const plain = shop.find((r) => !r.product.attrs.discrete)!;
    sim.must({ kind: 'computer.buy', payload: { offerId: plain.offer.id } });
    expect(gamingComputer(sim.player)).toBe(false);
    expect(lovedIn(sim.player, 'unwind')).not.toContain('games');
    const gaming = shop.find((r) => r.product.attrs.discrete)!;
    const r = sim.must<{ itemId: string }>({ kind: 'computer.buy', payload: { offerId: gaming.offer.id } });
    expect(itemsOf(sim.player).find((i) => i.id === r.itemId)!.spec).toMatchObject({ product: gaming.product.id });
    expect(gamingComputer(sim.player)).toBe(true);
    expect(lovedIn(sim.player, 'unwind')).toContain('games');
  });
});
