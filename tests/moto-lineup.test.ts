/**
 * Each market's wider motorcycle and scooter lineup (`content/motocatalog.ts`,
 * from 2026-10-05): on sale beside the first catalog's, each with the engine
 * size its tax, insurance and license read, quoted and filled like any other;
 * its tank the maker's where read, the median of its kind's where not.
 */
import { describe, expect, it } from 'vitest';
import { MOTO_MODELS, MOTO_TANKS } from '@/engine/content/motocatalog';
import { BIKE_MODELS as FIRST_BIKES } from '@/engine/content/bikecatalog';
import { BIKE_MODELS, BIKE_UNRATED_PER100, modelById, modelsFor, quote, type Quote } from '@/engine/systems/vehicles';
import { burnOf, capacityOf } from '@/engine/systems/fueltank';

describe('the wider motorcycle lineup', () => {
  it('is on sale beside the first catalog’s, from many makers, each with its engine size and no model twice', () => {
    const makes = new Set(MOTO_MODELS.map((m) => m.make));
    expect(makes.size).toBeGreaterThanOrEqual(30);
    expect(MOTO_MODELS.every((m) => typeof m.cc === 'number' && m.cc > 0 && m.fuel === 'petrol' && m.price > 0)).toBe(true);
    const ids = BIKE_MODELS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(BIKE_MODELS.length).toBe(FIRST_BIKES.length + MOTO_MODELS.length);
    const ny = modelsFor('us-ny-newyork', 'motorcycle');
    expect(ny.some((m) => MOTO_MODELS.includes(m))).toBe(true);
    expect(modelsFor('mx-cmx-mexicocity', 'motorcycle').filter((m) => MOTO_MODELS.includes(m)).length).toBeGreaterThan(50);
  });

  it('is quoted like any other, and holds its maker’s tank or the median of its kind’s', () => {
    const withTank = MOTO_MODELS.find((m) => m.market === 'US' && MOTO_TANKS[m.id])!;
    expect(capacityOf(withTank)).toEqual({ size: MOTO_TANKS[withTank.id]!.tankL, unit: 'L', estimated: false });
    const without = MOTO_MODELS.find((m) => m.market === 'MX' && !MOTO_TANKS[m.id])!;
    // Unrated, it still holds a tank and burns the mean of those rated (from 2026-10-05).
    const est = capacityOf(without);
    expect(est?.estimated).toBe(true);
    const q = quote(modelById(withTank.id)!, 'us-ny-newyork', Date.UTC(2026, 9, 1)) as Quote;
    expect(q.lines.length).toBeGreaterThan(0);
  });
});

describe('an unrated motorcycle', () => {
  it('burns the mean of those rated from its tank, as its running cost reckons', () => {
    const m = MOTO_MODELS.find((x) => x.per100km === null)!;
    expect(burnOf(m, 200)).toBeCloseTo(2 * BIKE_UNRATED_PER100, 9);
  });
});
