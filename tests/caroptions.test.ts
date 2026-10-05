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
import { VEHICLE_MONTH_KIND, modelById, quote, sellRefusal, vehiclesOf } from '@/engine/systems/vehicles';
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

  it('charge a package\'s own parts once: what it includes isn\'t chosen beside it (from 2026-10-05)', () => {
    const m = modelById('us-chevrolet-silverado')!;
    const of = (code: string) => optionsFor(m.id).find((o) => o.name.includes(`(${code})`))!.key;
    // GM's WT Value Package (PEB) includes the Trailering Package (Z82): until 2026-10-05 both were paid for.
    expect(optionsRefusal(m, [of('PEB'), of('Z82')], 0)).toMatch(/^The WT Value Package \(PEB\).* includes the Trailering Package \(Z82\) already\.$/);
    expect(optionsRefusal(m, [of('PEB')], 0)).toBeUndefined();
    expect(optionsRefusal(m, [of('Z82')], 0)).toBeUndefined();
    // A "Requires" line is what a package needs, not what it holds.
    const ca = modelById('ca-chevrolet-silverado')!;
    const caOf = (code: string) => optionsFor(ca.id).find((o) => o.name.includes(`(${code})`))!.key;
    expect(optionsRefusal(ca, [caOf('PQA'), caOf('PCV')], 0)).toBeUndefined();
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

  it('on order, is billed from when it comes, and a car traded in for it is driven till then (from 2026-10-05)', () => {
    const sim = life('us-ny-newyork', 'opts-trade');
    const old = sim.must<{ vehicleId: string }>({ kind: 'vehicle.buy', payload: { modelId: F150 } }).vehicleId;
    const pack = optionsFor(F150).find((o) => o.category === 'package' && o.price > 0)!;
    const r = sim.must<{ vehicleId: string; deliveredAt: number }>({ kind: 'vehicle.buy', payload: { modelId: F150, options: [pack.key], tradeIn: old } });
    const mine = vehiclesOf(sim.player);
    const was = mine.find((v) => v.id === old)!;
    const ordered = mine.find((v) => v.id === r.vehicleId)!;
    // Its first month a month after it comes, not after the order (until then a financed order paid from day 30).
    const months = sim.universe.scheduled.filter((i) => i.status === 'pending' && i.kind === VEHICLE_MONTH_KIND && i.payload.vehicleId === ordered.id);
    expect(months.map((i) => i.at)).toEqual([r.deliveredAt + 30 * MS_DAY]);
    // And its registration's year from then, as a car from stock has its year from the day it's driven away.
    expect(ordered.registrationDue - r.deliveredAt).toBe(was.registrationDue - was.boughtAt);
    // The old car is still theirs to drive, promised to the dealer, and can't be sold or traded again meanwhile.
    expect(was.soldAt).toBeUndefined();
    expect(tripRefusal(sim, sim.player, 'car', was.id)).toBeUndefined();
    expect(sellRefusal(sim, sim.player, was.id)).toBe('It’s promised to the dealer in trade for the car on order.');
    expect(sellRefusal(sim, sim.player, ordered.id)).toBe('It hasn’t come yet: a car on order is sold once it’s yours.');
    expect(sim.execute({ kind: 'vehicle.buy', payload: { modelId: F150, tradeIn: was.id } }).error).toBe('That car is promised in trade already.');
    // It comes: the new car theirs, the old one the dealer's.
    sim.advanceTo(r.deliveredAt + MS_DAY);
    expect(was.soldAt).toBe(r.deliveredAt);
    expect(was.tradedFor).toBeUndefined();
    expect(tripRefusal(sim, sim.player, 'car', ordered.id)).toBeUndefined();
    expect(sim.universe.notifications.some((n) => n.title === 'Your New Car Has Come')).toBe(true);
  });

  it('is bought where they live, and a trade-in is driven to the dealer there (from 2026-10-05)', () => {
    const sim = life('us-ny-newyork', 'opts-where');
    const old = sim.must<{ vehicleId: string }>({ kind: 'vehicle.buy', payload: { modelId: F150 } }).vehicleId;
    vehiclesOf(sim.player).find((v) => v.id === old)!.at = 'us-ct-newhaven';
    expect(sim.execute({ kind: 'vehicle.buy', payload: { modelId: F150, tradeIn: old } }).error).toBe('The car you’d trade is in New Haven: it’s traded in where the dealer is.');
    sim.player.currentLocationId = 'uk-eng-london';
    expect(sim.execute({ kind: 'vehicle.buy', payload: { modelId: F150 } }).error).toBe('A car is bought where you live: you’d need to be in New York.');
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
