/**
 * A home's screen, console and speaker (`content/furniture.ts`, the gear in
 * `lovedIn`, from 2026-09-30): each priced where it's sold, and an hour
 * unwinding at home loved only with what the interest needs there.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { owns } from '@/engine/systems/furniture';
import { lovedIn } from '@/engine/systems/enjoyment';
import { pieceCost } from '@/engine/systems/furniture';
import type { Person } from '@/engine/domain/model';

const home = { kind: 'own', cityId: 'us-ny-newyork' } as Person['home'];
const fan = (furniture: Person['furniture'], currentLocationId = 'us-ny-newyork') => ({ interests: ['film', 'games', 'music', 'art'], furniture, home, currentLocationId });

describe('the gear', () => {
  it('is sold at its price where it’s sold, and a console isn’t sold in Mexico', () => {
    const sim = quickSave({ startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london', livesWhereBorn: true }, 'gear-price');
    const tv = pieceCost(sim, 'uk-eng-london', 'tv')!;
    expect(tv.tax).toBe(0);
    expect(pieceCost(sim, 'mx-cmx-mexicocity', 'console')).toBeUndefined();
    expect(pieceCost(sim, 'mx-cmx-mexicocity', 'tv')).toBeDefined();
  });

  it('is bought as a piece of furniture', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'gear-buy');
    const r = sim.execute({ kind: 'home.furnish', payload: { piece: 'tv' } });
    expect(r.ok, r.error).toBe(true);
    // An item at the home they live in, since 2026-10-01 (`systems/items.ts`).
    expect(owns(sim.player, 'tv')).toBe(true);
    expect(sim.execute({ kind: 'home.furnish', payload: { piece: 'piano' } }).error).toMatch(/No such piece/);
  });
});

describe('unwinding at home', () => {
  it('is loved for film, games and music only with a TV, a console and a speaker there; an interest needing nothing, always', () => {
    expect(lovedIn(fan({}), 'unwind')).toEqual(['art']);
    expect(lovedIn(fan({ tv: 1 }), 'unwind')).toEqual(['art', 'film']);
    expect(lovedIn(fan({ tv: 1, console: 1, speaker: 1 }), 'unwind').sort()).toEqual(['art', 'film', 'games', 'music']);
  });

  it('is loved for all of them away from home, where a hotel’s TV does', () => {
    expect(lovedIn(fan({}, 'uk-eng-london'), 'unwind').sort()).toEqual(['art', 'film', 'games', 'music']);
  });
});
