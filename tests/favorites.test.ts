/**
 * Favorites (`systems/catalog.ts`, from 2026-10-03): anything in a list
 * marked, kept by the list with the character, and a list narrowed to them,
 * still the cheapest first.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { arrange, favoritesIn } from '@/engine/systems/catalog';
import { toiletryCatalog } from '@/engine/systems/hygiene';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);

describe('favorites', () => {
  it('are marked and unmarked by list, and narrow it, the cheapest first still', () => {
    const sim = life('us-ny-newyork', 'fav');
    const entries = toiletryCatalog(sim, sim.player.currentLocationId);
    const [a, b, c] = [entries[5]!, entries[1]!, entries[3]!];
    for (const e of [a, b, c]) expect(sim.must<{ favorite: boolean }>({ kind: 'catalog.favorite', payload: { list: 'toiletries', id: e.id } }).favorite).toBe(true);
    expect(favoritesIn(sim.player, 'toiletries')).toEqual([a.id, b.id, c.id]);
    expect(favoritesIn(sim.player, 'groceries')).toEqual([]);
    const shown = arrange(entries, { only: favoritesIn(sim.player, 'toiletries') });
    expect(shown.map((e) => e.id).sort()).toEqual([a.id, b.id, c.id].sort());
    expect(shown.map((e) => e.price)).toEqual([...shown.map((e) => e.price)].sort((x, y) => x! - y!));
    expect(sim.must<{ favorite: boolean }>({ kind: 'catalog.favorite', payload: { list: 'toiletries', id: b.id } }).favorite).toBe(false);
    expect(favoritesIn(sim.player, 'toiletries')).toEqual([a.id, c.id]);
    sim.must({ kind: 'catalog.favorite', payload: { list: 'toiletries', id: a.id } });
    sim.must({ kind: 'catalog.favorite', payload: { list: 'toiletries', id: c.id } });
    expect(sim.player.favorites).toEqual({});
    expect(sim.execute({ kind: 'catalog.favorite', payload: { list: '', id: a.id } }).error).toBe('Choose something in a list.');
    expect(arrange(entries, {}).length).toBe(entries.length);
  });
});
