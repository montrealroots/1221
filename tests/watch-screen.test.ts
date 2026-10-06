/**
 * Watching needs a screen (`watchRefusal` in `systems/homelife.ts`, from
 * 2026-10-06): live TV a TV, a service a TV, a computer, a tablet or a phone.
 * A let comes furnished; a house bought bare has none until one is bought.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { watchRefusal } from '@/engine/systems/homelife';
import { itemsOf, homeKeyOf } from '@/engine/systems/items';
import { ownBuilt, type HomeFacts } from '@/engine/systems/homes';
import type { Fixtures } from '@/engine/content/homes';

const bare: Fixtures = { bathtub: false, dishwasher: false, laundry: 'none', cooling: 'none', outdoor: 'none', gym: 'none' };
const facts: HomeFacts = { type: 'house', address: 'Test Home', beds: 2, baths: 1, size: 1_000, built: 2000, features: [], parts: {}, hoaUsd: 0, fixtures: { ...bare } };

describe('a screen to watch on', () => {
  it('in a let, as it comes furnished, live TV plays', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true }, 'screen-let');
    expect(watchRefusal(sim, sim.player, 'live')).toBeUndefined();
  });

  it('in a house bought bare: no live TV without a TV, and a service only on a phone, a computer or a TV', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'screen-bare');
    const p = sim.player;
    const home = ownBuilt(sim, p, { cityId: 'us-ny-newyork', facts, price: 400_000_00, closing: 0 });
    home.bare = true;
    p.home = { kind: 'owned', cityId: 'us-ny-newyork', since: sim.now, homeId: home.id };
    p.subscriptions = [{ id: 'us-netflix-standard-with-ads', since: sim.now }];
    p.items = itemsOf(p).filter((i) => i.device === undefined && i.kind !== 'furniture:tv' && i.kind !== 'furniture:computer');
    expect(watchRefusal(sim, p, 'live')).toBe('There’s no TV here to watch it on.');
    expect(watchRefusal(sim, p, 'us-netflix-standard-with-ads')).toBe('There’s nothing here to watch it on: a TV, a computer, a tablet or a phone.');
    // A TV brought home, and both play.
    p.items!.push({ id: 'tv1', kind: 'furniture:tv', label: 'A TV', quantity: 1, condition: 1, at: { kind: 'home', home: homeKeyOf(p.home)!, spot: 'floor' }, acquiredAt: sim.now, paid: 0 } as never);
    expect(watchRefusal(sim, p, 'live')).toBeUndefined();
    expect(watchRefusal(sim, p, 'us-netflix-standard-with-ads')).toBeUndefined();
  });
});
