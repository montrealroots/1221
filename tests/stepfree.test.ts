/**
 * Step-free transit to the airport (`stepFreeRefusal` in
 * `systems/airportground.ts`, from 2026-10-02): a wheelchair user takes a
 * route only where its operator says it's step-free; Mexico City's Metro to
 * Terminal Aérea has no elevator on the Metro's own list.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { planBy } from '@/engine/systems/journey';
import { stepFreeRefusal } from '@/engine/systems/airportground';

describe('transit to the airport for a wheelchair user', () => {
  it('is refused in Mexico City, and not from New York', () => {
    const mx = quickSave({ startLocationId: 'mx-cmx-mexicocity', homeRegionId: 'mx-cmx-mexicocity', livesWhereBorn: true, wealth: 'wealthy' }, 'step-mx');
    const day = mx.now + 10 * MS_DAY;
    const legs = planBy(mx, undefined, 'mx-cmx-mexicocity', 'us-ny-newyork', day, 2, 0);
    if (typeof legs === 'string') throw new Error(legs);
    expect(stepFreeRefusal(legs)).toBe('Metro Line 5 to Terminal Aérea isn’t step-free; go by taxi.');
    mx.player.mobility = 'wheelchair';
    expect(mx.execute({ kind: 'travel.book', payload: { toCity: 'us-ny-newyork', day, slot: 2, nights: 2, ground: 'transit' } }).error).toBe('Metro Line 5 to Terminal Aérea isn’t step-free; go by taxi.');
    const ny = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'step-ny');
    const out = planBy(ny, undefined, 'us-ny-newyork', 'mx-cmx-mexicocity', day, 2, 0);
    if (typeof out === 'string') throw new Error(out);
    expect(stepFreeRefusal(out)).toBe('Metro Line 5 to Terminal Aérea isn’t step-free; go by taxi.');
    expect(stepFreeRefusal(out.slice(0, 2))).toBeUndefined();
  });
});
