/**
 * Hotels' holds read later (`MORE_DEPOSITS` in `systems/hotels.ts`, from 2026-10-03).
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { inSaveMoney } from '@/engine/systems/banking';
import { depositFor } from '@/engine/systems/hotels';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);

describe('a hotel’s hold read later', () => {
  it('is the Chelsea’s C$150 a stay and The Dean’s €50 a night and €100 more', () => {
    const sim = life('ca-on-toronto', 'deposit-later');
    expect(depositFor(sim, 'chelsea-hotel-toronto', 3)).toBe(inSaveMoney(sim, 150_00, 'CAD'));
    expect(depositFor(sim, 'the-dean-dublin', 3)).toBe(inSaveMoney(sim, 250_00, 'EUR'));
    expect(depositFor(sim, 'fairmont-royal-york', 2)).toBe(inSaveMoney(sim, 400_00, 'CAD'));
  });
});
