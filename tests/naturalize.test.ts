/**
 * A green card and a second citizenship (`systems/residence.ts`,
 * `systems/citizenship.ts`, from 2026-09-30): EB-1A on the O-1's record,
 * timed by the I-140, the I-485 and the Visa Bulletin by country of birth;
 * federal Medicaid's status test from October 2026; and naturalizing in
 * Britain, Mexico and the United States, the citizenship of birth kept.
 */
import { quickSave } from '@/engine';
import { describe,expect,it } from 'vitest';
/** Born in a town, living in New York. */
const bornIn = (born: string, seed: string) => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: born, wealth: 'wealthy' }, seed);

// A green card's wait (`greenCardDays`) was tested here until 2026-10-09, when the petition went with the career's record it read.
describe('a green card', () => {
  it('isn’t applied for: extraordinary ability was shown on the career’s record', () => {
    const sim = bornIn('mx-cmx-mexicocity', 'gc-none');
    const r = sim.execute({ kind: 'documents.residence', payload: { country: 'US' } });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/record of professional work/);
  });
});
