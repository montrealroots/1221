/**
 * A car by its model year (`systems/modelyears.ts`, `content/modelyears.ts`, the EPA's ratings; from
 * 2026-10-05): a used car is the model year it is, built as that year was rated, never a year the model
 * didn't exist; a new car is the model year on sale, released from 1 July of the year before; past the
 * ratings a model year is carried forward and says so; and a car burns as its own model year was rated.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MODEL_YEARS } from '@/engine/content/modelyears';
import { buildLabel, buildsFor, newModelYear, onSaleNew, yearAt, yearsOf } from '@/engine/systems/modelyears';
import { usedListings } from '@/engine/systems/usedcars';
import { modelById, vehiclesOf } from '@/engine/systems/vehicles';
import { burnOf } from '@/engine/systems/fueltank';
import { instantFromZoned } from '@/engine/core/time';

const life = (seed: string) => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);
const NY = 'us-ny-newyork';
const at = (y: number, m: number) => instantFromZoned({ year: y, month: m, day: 15, hour: 12 }, 'America/New_York');

describe('a car by its model year', () => {
  it('lists a used car as its model year, built as that year was rated', () => {
    const sim = life('my-used');
    for (let month = 0; month < 6; month += 1) {
      const when = at(2026, month + 1);
      for (const l of usedListings(sim, sim.player, 'us-toyota-camry', NY, 'US-NY', when)) {
        expect(l.modelYear).toBe(yearAt(NY, when) - l.age);
        expect(l.build!.year).toBe(l.modelYear);
        const rated = MODEL_YEARS['us-toyota-camry']!.filter((r) => r[0] === l.modelYear);
        expect(rated.some((r) => r[3] === l.build!.transmission && r[6] === l.build!.per100km)).toBe(true);
      }
    }
  });

  it('never lists a model year the model didn’t have', () => {
    const sim = life('my-young');
    const first = yearsOf('us-bmw-i5')[0]!;
    expect(first).toBe(2024);
    let seen = 0;
    for (let month = 1; month <= 12; month += 1) {
      for (const l of usedListings(sim, sim.player, 'us-bmw-i5', NY, 'US-NY', at(2026, month))) { expect(l.modelYear!).toBeGreaterThanOrEqual(first); seen += 1; }
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('sells a model year new from 1 July of the year before it, and carries one forward past the ratings, saying so', () => {
    expect(onSaleNew(2027, NY, at(2026, 6))).toBe(false);
    expect(onSaleNew(2027, NY, at(2026, 7))).toBe(true);
    const camry = yearsOf('us-toyota-camry');
    const last = camry[camry.length - 1]!;
    expect(newModelYear('us-toyota-camry', NY, at(2026, 3))).toBe(Math.min(2026, last));
    const far = buildsFor('us-toyota-camry', last + 8);
    expect(far.length).toBeGreaterThan(0);
    expect(far.every((b) => b.basis === 'simulated' && b.year === last + 8)).toBe(true);
    expect(buildLabel(far[0]!)).toMatch(/Simulated Model Year/);
    expect(buildsFor('us-toyota-camry', 1990)).toEqual([]);
  });

  it('keeps the bought car’s model year and burns as it was rated', () => {
    const sim = life('my-bought');
    sim.must({ kind: 'vehicle.buy', payload: { modelId: 'us-toyota-camry' } });
    const v = vehiclesOf(sim.player)[0]!;
    expect(v.modelYear).toBe(newModelYear('us-toyota-camry', NY, sim.now));
    expect(v.build!.year).toBe(v.modelYear);
    const m = modelById(v.modelId)!;
    expect(burnOf(m, 100, v)).toBeCloseTo(v.build!.fuel === 'ev' ? v.build!.kwhPer100km! : v.build!.per100km!, 9);
  });
});
