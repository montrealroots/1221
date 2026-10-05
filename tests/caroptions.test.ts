/**
 * A new car built as specified (`systems/caroptions.ts`, from 2026-10-02):
 * its maker's options at their prices joining the car's before the taxes, one
 * paint, wheels and interior, a factory order not the buyer's to drive until
 * it comes after its published weeks, and none where no lead time is
 * published.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { documentsOf } from '@/engine/systems/documents';
import { modelById, quote, vehiclesOf } from '@/engine/systems/vehicles';
import { optionsFor, optionsRefusal, orderWeeksOf } from '@/engine/systems/caroptions';
import { tripRefusal } from '@/engine/systems/trips';

const life = (city: string, seed: string) => {
  const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer: 'us-ny', name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 3650 * MS_DAY, expiresAt: sim.now + 3650 * MS_DAY });
  return sim;
};
const F150 = 'us-ford-f-series';

describe('a new car’s options', () => {
  it('join its price before the taxes, at the maker’s prices', () => {
    const sim = life('us-ny-newyork', 'opts-quote');
    const m = modelById(F150)!;
    const pack = optionsFor(F150).find((o) => o.category === 'package' && o.price > 0)!;
    const plain = quote(m, 'us-ny-newyork', sim.now) as Exclude<ReturnType<typeof quote>, string>;
    const built = quote(m, 'us-ny-newyork', sim.now, { options: [pack.key] }) as Exclude<ReturnType<typeof quote>, string>;
    expect(built.price - plain.price).toBe(pack.price * 100);
    // The sales tax is on the dearer price.
    expect(built.total - plain.total).toBeGreaterThan(pack.price * 100);
  });

  it('take one paint, set of wheels and interior, and none on a used car', () => {
    const m = modelById(F150)!;
    const paints = optionsFor(F150).filter((o) => o.category === 'paint');
    expect(optionsRefusal(m, [paints[0]!.key, paints[1]!.key], 0)).toBe('One paint.');
    expect(optionsRefusal(m, [paints[0]!.key], 3)).toBe('A used car comes as it is.');
    expect(optionsRefusal(m, ['nonsense'], 0)).toBe('That isn’t one of its options.');
  });

  it('make a factory order, the buyer’s to drive only once it comes after the dealer’s published weeks', () => {
    const sim = life('us-ny-newyork', 'opts-order');
    const pack = optionsFor(F150).find((o) => o.category === 'package' && o.price > 0)!;
    const r = sim.execute<{ vehicleId: string; deliveredAt: number }>({ kind: 'vehicle.buy', payload: { modelId: F150, options: [pack.key] } });
    expect(r.ok, r.error).toBe(true);
    const weeks = orderWeeksOf(modelById(F150)!)!.weeks;
    expect(r.value!.deliveredAt - sim.now).toBe(weeks * 7 * MS_DAY);
    const v = vehiclesOf(sim.player)[0]!;
    expect(v.options).toEqual([pack.key]);
    expect(tripRefusal(sim, sim.player, 'car', v.id)).toMatch(/^It’s on order: it comes/);
    // Nor driven in the month's everyday driving.
    sim.advanceBy(31 * MS_DAY);
    expect(v.km ?? 0).toBe(0);
    sim.advanceTo(v.deliveredAt! + MS_DAY);
    expect(tripRefusal(sim, sim.player, 'car', v.id)).toBeUndefined();
  });

  it('as it comes, or in a paint at no charge, is bought from stock and driven away', () => {
    const sim = life('us-ny-newyork', 'opts-stock');
    const free = optionsFor(F150).find((o) => o.category === 'paint' && o.price === 0)!;
    sim.must({ kind: 'vehicle.buy', payload: { modelId: F150, options: [free.key] } });
    expect(vehiclesOf(sim.player)[0]!.deliveredAt).toBeUndefined();
  });

  it('can’t be ordered with a priced option where no lead time is published', () => {
    const toyota = modelById('us-toyota-camry')!;
    const priced = optionsFor(toyota.id).find((o) => o.price > 0);
    expect(priced).toBeDefined();
    expect(optionsRefusal(toyota, [priced!.key], 0)).toMatch(/No lead time for a factory order/);
  });
});
