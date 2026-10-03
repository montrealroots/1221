/**
 * Which toiletry of a kind is used (`inUseOrder` and `hygiene.use_first` in
 * `systems/hygiene.ts`, from 2026-10-02): the one chosen first, then an open
 * bottle before a new one; and the one chosen is what's bought again.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { USE, dailyCare, restock, showerUses, suppliesOf, toiletryCatalog } from '@/engine/systems/hygiene';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);

describe('the shampoo used', () => {
  it('is the one chosen first, then the open one, and the chosen one is bought again', () => {
    const sim = life('us-ny-newyork', 'use-first');
    const p = sim.player;
    const shampoos = toiletryCatalog(sim, 'us-ny-newyork').filter((e) => e.facets?.kind === 'Shampoo' || e.id.includes('shampoo'));
    const starter = suppliesOf(p).find((i) => i.supply.kind === 'shampoo')!;
    const other = shampoos.find((e) => e.id !== starter.kind)!;
    sim.must({ kind: 'hygiene.buy', payload: { productId: other.id, quantity: 1 } });
    const bought = suppliesOf(p).find((i) => i.kind === other.id)!;
    // Both full: the one bought first is used; opened, it's finished before the new one.
    starter.supply.left -= 1;
    const was = { starter: starter.supply.left, bought: bought.supply.left };
    showerUses(sim, p);
    expect(starter.supply.left).toBeCloseTo(was.starter - USE.shampooG, 6);
    expect(bought.supply.left).toBe(was.bought);
    // Chosen first, the new one is used though the other is open.
    sim.must({ kind: 'hygiene.use_first', payload: { productId: other.id } });
    showerUses(sim, p);
    expect(bought.supply.left).toBeCloseTo(was.bought - USE.shampooG, 6);
    // Run out, the chosen one is what's bought again, not the cheapest.
    p.items = (p.items ?? []).filter((i) => i.supply?.kind !== 'shampoo');
    sim.universe.now = Date.parse('2027-06-09T16:00:00Z');
    restock(sim, p);
    expect(suppliesOf(p).filter((i) => i.supply.kind === 'shampoo').map((i) => i.kind)).toEqual([other.id]);
    expect(sim.execute({ kind: 'hygiene.use_first', payload: { productId: 'nothing' } }).error).toBe('There’s no such product.');
  });

  it('finishes an open bottle before a new one bought before it', () => {
    const sim = life('us-ny-newyork', 'use-open');
    const p = sim.player;
    const starter = suppliesOf(p).find((i) => i.supply.kind === 'shampoo')!;
    const other = toiletryCatalog(sim, 'us-ny-newyork').find((e) => e.id.includes('shampoo') && e.id !== starter.kind)!;
    sim.must({ kind: 'hygiene.buy', payload: { productId: other.id, quantity: 1 } });
    const bought = suppliesOf(p).find((i) => i.kind === other.id)!;
    bought.supply.left -= 1;
    const full = starter.supply.left;
    showerUses(sim, p);
    expect(starter.supply.left).toBe(full);
  });

  it('bought again only where it’s sold, the cheapest otherwise', () => {
    const sim = life('us-ny-newyork', 'use-abroad');
    const p = sim.player;
    const british = toiletryCatalog(sim, 'uk-eng-london').find((e) => e.id.includes('shampoo'))!;
    sim.must({ kind: 'hygiene.use_first', payload: { productId: british.id } });
    p.items = (p.items ?? []).filter((i) => i.supply?.kind !== 'shampoo');
    sim.universe.now = Date.parse('2027-06-09T16:00:00Z');
    restock(sim, p);
    const now = suppliesOf(p).filter((i) => i.supply.kind === 'shampoo');
    expect(now.length).toBe(1);
    expect(now[0]!.kind).not.toBe(british.id);
  });

  it('wears the toothbrush chosen first', () => {
    const sim = life('us-ny-newyork', 'use-brush');
    const p = sim.player;
    const old = suppliesOf(p).find((i) => i.supply.kind === 'toothbrush')!;
    const brush = toiletryCatalog(sim, 'us-ny-newyork').find((e) => e.id.includes('toothbrush') && e.id !== old.kind)!;
    sim.must({ kind: 'hygiene.buy', payload: { productId: brush.id, quantity: 1 } });
    const second = suppliesOf(p).find((i) => i.kind === brush.id)!;
    sim.must({ kind: 'hygiene.use_first', payload: { productId: brush.id } });
    dailyCare(sim, p);
    expect(second.condition).toBeLessThan(1);
    expect(old.condition).toBe(1);
  });
});
