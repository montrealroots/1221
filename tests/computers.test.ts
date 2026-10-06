/**
 * A computer of one's own (`systems/computers.ts`, `content/computercatalog.ts`,
 * from 2026-10-05): sold where they live, kept at the home with its model,
 * and any of them playing a games lover's games at home as a console does
 * (`lovedIn` in `systems/enjoyment.ts`; until 2026-10-05 only one with a
 * graphics card of its own did).
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { COMPUTER_PRODUCTS, computerCatalog, computerRefusal, computerForGames, graphicsOf } from '@/engine/systems/computers';
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

  it('of any graphics plays a games lover’s games at home, as a console does', () => {
    const sim = life('pc-games');
    sim.player.interests = ['games'];
    delete sim.player.furniture;
    sim.player.items = itemsOf(sim.player).filter((i) => i.kind !== 'furniture:console');
    expect(lovedIn(sim.player, 'unwind')).not.toContain('games');
    const plain = computerCatalog(sim, sim.player).find((r) => !r.product.attrs.discrete)!;
    expect(graphicsOf(plain.product)).toBe('integrated');
    const r = sim.must<{ itemId: string }>({ kind: 'computer.buy', payload: { offerId: plain.offer.id } });
    expect(itemsOf(sim.player).find((i) => i.id === r.itemId)!.spec).toMatchObject({ product: plain.product.id });
    expect(computerForGames(sim.player)).toBe(true);
    expect(lovedIn(sim.player, 'unwind')).toContain('games');
  });
});
