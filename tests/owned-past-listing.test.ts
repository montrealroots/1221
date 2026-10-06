/**
 * A thing owned outlasts its listing (from 2026-10-05): what was sold is kept
 * with the thing bought (`Item.made`), so a television, a computer, a mower or
 * a pack of bulbs still works when its catalog entry is replaced or taken out.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { itemsOf } from '@/engine/systems/items';
import { computerCatalog, gamingComputer } from '@/engine/systems/computers';
import { tvAtHome, tvCatalog } from '@/engine/systems/televisions';
import { handMower, mowersAt } from '@/engine/systems/mowers';
import { homeKeyOf } from '@/engine/systems/items';
import { ownedProduct } from '@/engine/systems/devices';

const life = (seed: string) => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);
/** As though its listing were gone: its product id points at nothing in the catalog. */
const delist = (item: { spec?: Readonly<Record<string, string>> }) => { (item as { spec: Record<string, string> }).spec = { ...item.spec, product: 'gone-from-the-catalog' }; };

describe('a thing owned, its listing gone', () => {
  it('keeps a gaming computer playing games and a TV drawing its own watts', () => {
    const sim = life('owned-delisted');
    const pc = computerCatalog(sim, sim.player).find((r) => r.product.attrs.discrete)!;
    const { itemId } = sim.must<{ itemId: string }>({ kind: 'computer.buy', payload: { offerId: pc.offer.id } });
    const item = itemsOf(sim.player).find((i) => i.id === itemId)!;
    expect(item.made).toMatchObject({ brand: pc.product.brand, model: pc.product.model });
    delist(item);
    expect(gamingComputer(sim.player)).toBe(true);
    const tv = tvCatalog(sim, sim.player).find((r) => typeof r.product.attrs.onModeWatts === 'number')!;
    const bought = sim.must<{ itemId: string }>({ kind: 'tv.buy', payload: { offerId: tv.offer.id } });
    delist(itemsOf(sim.player).find((i) => i.id === bought.itemId)!);
    expect(tvAtHome(sim.player)!.watts).toBe(tv.product.attrs.onModeWatts);
  });

  it('keeps a mower a mower, and one bought before anything was kept a push mower', () => {
    const sim = life('owned-mower');
    const home = homeKeyOf(sim.player.home)!;
    sim.player.items = [...itemsOf(sim.player), { id: 'old-mower', kind: 'furniture:mower', label: 'An Old Mower', quantity: 1, condition: 1, at: { kind: 'home', home, spot: 'floor' }, acquiredAt: sim.now, spec: { product: 'long-gone' } } as never];
    expect(mowersAt(sim.player, home)).toHaveLength(1);
    expect(handMower(sim.player)?.item.id).toBe('old-mower');
    expect(ownedProduct({ spec: { product: 'x' } } as never, [])).toBeUndefined();
  });
});
