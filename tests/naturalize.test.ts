/**
 * A green card and a second citizenship (`systems/residence.ts`,
 * `systems/citizenship.ts`, from 2026-09-30): EB-1A on the O-1's record,
 * timed by the I-140, the I-485 and the Visa Bulletin by country of birth;
 * federal Medicaid's status test from October 2026; and naturalizing in
 * Britain, Mexico and the United States, the citizenship of birth kept.
 */
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { greenCardDays } from '@/engine/systems/residence';
import { describe,expect,it } from 'vitest';
/** Born in a town, living in New York. */
const bornIn = (born: string, seed: string) => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: born, wealth: 'wealthy' }, seed);

describe('a green card', () => {

  it('takes the I-140’s 31 months without premium, and adds India’s years behind on the Visa Bulletin', () => {
    const mx = bornIn('mx-cmx-mexicocity', 'gc-days-mx');
    expect(greenCardDays(mx.player, false)).toBeCloseTo(31 * 30.44, 6);
    expect(greenCardDays(mx.player, true)).toBeCloseTo(8.6 * 30.44, 6);
    const india = bornIn('in-16-mumbai', 'gc-days-in');
    expect(greenCardDays(india.player, true)).toBeCloseTo((Date.UTC(2026, 9, 1) - Date.UTC(2023, 1, 1)) / MS_DAY + 8.6 * 30.44, 6);
  });
});
