/**
 * The laundry basket (`toBasket` in `systems/wardrobe.ts`, from 2026-10-02):
 * what's taken off into it is washed with the next load, whatever its count
 * of wears says, and put back where its kind is kept.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { garmentsOf, keptIn, toBasketRefusal, washableDirty } from '@/engine/systems/wardrobe';

const life = (seed: string) => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);

describe('the laundry basket', () => {
  it('takes a clean garment to be washed, and the wash puts it back', () => {
    const sim = life('basket');
    const p = sim.player;
    const shirt = garmentsOf(p).find((g) => g.garment.slot === 'top' && g.garment.care !== 'dry-clean' && !g.garment.dirty)!;
    expect(washableDirty(sim, p)).not.toContain(shirt);
    const r = sim.execute<{ moved: number }>({ kind: 'clothes.to_basket', payload: { itemIds: [shirt.id] } });
    expect(r.ok, r.error).toBe(true);
    expect(shirt.at).toMatchObject({ kind: 'home', spot: 'hamper' });
    expect(shirt.garment.dirty).toBe(true);
    expect(washableDirty(sim, p)).toContain(shirt);
    expect(toBasketRefusal(sim, p, shirt)).toBe('It’s in the basket.');
    sim.must({ kind: 'life.look_after', payload: { action: 'laundry' } });
    expect(shirt.garment.dirty).toBe(false);
    expect(shirt.at).toMatchObject({ kind: 'home', spot: keptIn('top') });
  });

  it('is at home, and not for what goes to the dry cleaner', () => {
    const sim = life('basket-no');
    const p = sim.player;
    const shirt = garmentsOf(p).find((g) => g.garment.care !== 'dry-clean')!;
    p.currentLocationId = 'us-ca-losangeles';
    expect(toBasketRefusal(sim, p, shirt)).toBe('The basket is at home.');
    expect(toBasketRefusal(sim, p, { ...shirt, garment: { ...shirt.garment, care: 'dry-clean' } })).toBe('It goes to the dry cleaner, not in the wash.');
    expect(sim.execute({ kind: 'clothes.to_basket', payload: { itemIds: [] } }).error).toBe('Choose what goes in.');
    expect(keptIn('shoes')).toBe('wardrobe');
    // A towel back in the bathroom (from 2026-10-05).
    expect(keptIn('towel')).toBe('bathroom');
  });
});
