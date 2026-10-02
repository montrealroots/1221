/**
 * A garment's size, read (`sizeFor`, `fitKgFor` in `systems/tailoring.ts`,
 * from 2026-10-02): your size sits in a garment's run where your body mass
 * index sits among your country's adults, and a size off doesn't fit.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { bodyOf } from '@/engine/systems/body';
import { SIZE_STEP, bmiShare, fitKgFor, fitOf, sizeFor, sizeRun } from '@/engine/systems/tailoring';

const life = (seed: string) => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);
const RUN = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

describe('a size run', () => {
  it('is ordered smallest first, letters, Spanish letters and numbers; one size or an unknown run has none', () => {
    expect(sizeRun(['L', 'M', 'S', 'XL', 'XS', 'XXL'])).toEqual(RUN);
    expect(sizeRun(['EG', 'CH', 'G', 'M', 'ECH'])).toEqual(['ECH', 'CH', 'M', 'G', 'EG']);
    expect(sizeRun(['15½', '14½', '15'])).toEqual(['14½', '15', '15½']);
    expect(sizeRun(['One Size'])).toEqual([]);
    expect(sizeRun(['Petite', 'Tall'])).toEqual([]);
  });

  it('puts the country’s middle in the run’s middle, the lightest at its start and the heaviest at its end', () => {
    expect(bmiShare('us', 15)).toBe(0);
    expect(bmiShare('us', 60)).toBe(1);
    expect(bmiShare('us', 27)).toBeGreaterThan(0.3);
    expect(bmiShare('us', 27)).toBeLessThan(0.7);
    // A heavier country puts the same body lower among its adults.
    expect(bmiShare('us', 27)).toBeLessThan(bmiShare('jp', 27));
  });
});

describe('a garment bought', () => {
  it('in your size fits; a size up is too big, a size down too small', () => {
    const sim = life('size-fit');
    const mine = sizeFor(sim, sim.player, RUN)!;
    const i = RUN.indexOf(mine);
    const kg = bodyOf(sim, sim.player).weightKg;
    const g = (size: string) => ({ kind: 't-shirt', slot: 'top' as const, care: 'wash' as const, wears: 0, washes: 0, fitKg: fitKgFor(sim, sim.player, RUN, size) });
    expect(fitOf(sim.player, g(mine))).toBe('fits');
    if (i < RUN.length - 1) { expect(fitOf(sim.player, g(RUN[i + 1]!))).toBe('big'); expect(g(RUN[i + 1]!).fitKg).toBeCloseTo(kg * (1 + SIZE_STEP), 6); }
    if (i > 0) expect(fitOf(sim.player, g(RUN[i - 1]!))).toBe('small');
    // One size fits everybody.
    expect(fitKgFor(sim, sim.player, ['One Size'], 'One Size')).toBe(kg);
  });
});
