/**
 * Used cars on offer (`usedListings`, `vehicle.test_drive`, `vehicle.transfer`
 * in `systems/usedcars.ts`, from 2026-10-03): three a month for a model, each
 * its own age, odometer and seller; a test drive that shows a fault that
 * shows; a private sale's transfer by the place's own rule.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { documentsOf } from '@/engine/systems/documents';
import { quote, vehiclesOf, modelById, type Quote } from '@/engine/systems/vehicles';
import { odometer } from '@/engine/systems/carcare';
import { laidUp } from '@/engine/systems/repairs';
import { usedFault, usedListings, type UsedListing } from '@/engine/systems/usedcars';
import { inSaveMoney } from '@/engine/systems/banking';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const MX_CAR = 'mx-nissan-versa';
const license =(sim: Simulation, issuer: string) => documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer, name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 3650 * MS_DAY, expiresAt: sim.now + 3650 * MS_DAY });
/** A life whose month has a listing of the seller wanted. */
function withSeller(city: string, j: Parameters<typeof usedListings>[4], model: string, seller: UsedListing['seller'], seed: string): { sim: Simulation; l: UsedListing } {
  for (let i = 0; i < 60; i += 1) {
    const sim = life(city, `${seed}-${i}`);
    const l = usedListings(sim, sim.player, model, city, j).find((x) => x.seller === seller);
    if (l) return { sim, l };
  }
  throw new Error('none');
}

describe('this month’s used cars', () => {
  it('are three, each its own age, odometer and seller, the same all month', () => {
    const sim = life('uk-eng-london', 'ul-three');
    const a = usedListings(sim, sim.player, 'gb-ford-puma', 'uk-eng-london', 'GB');
    expect(a).toHaveLength(3);
    expect(new Set(a.map((l) => l.age)).size).toBe(3);
    for (const l of a) {
      expect(l.age).toBeGreaterThanOrEqual(1);
      expect(l.age).toBeLessThanOrEqual(10);
      // The DfT's bands run to 40,000 miles a year.
      expect(l.odometerKm).toBeLessThan(40_000 * 1.609344 * l.age + 1);
    }
    expect(usedListings(sim, sim.player, 'gb-ford-puma', 'uk-eng-london', 'GB')).toEqual(a);
    const ny = life('us-ny-newyork', 'ul-us');
    const us = usedListings(ny, ny.player, 'us-toyota-camry', 'us-ny-newyork', 'US-NY')[0]!;
    const nhtsa = [14_231, 13_961, 13_669, 13_357, 13_028, 12_683, 12_325, 11_956, 11_578, 11_193].slice(0, us.age).reduce((n, x) => n + x, 0);
    expect(us.odometerKm).toBe(Math.round(nhtsa * 1.609344));
  });

  it('is what’s bought: an age not on offer is refused, and the listing’s odometer is the car’s', () => {
    const sim = life('us-ny-newyork', 'ul-buy');
    const offered = usedListings(sim, sim.player, 'us-toyota-camry', 'us-ny-newyork', 'US-NY');
    const missing = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].find((a) => !offered.some((l) => l.age === a))!;
    expect(sim.execute({ kind: 'vehicle.buy', payload: { modelId: 'us-toyota-camry', age: missing } }).error).toMatch(/is on offer this month/);
    sim.must({ kind: 'vehicle.buy', payload: { modelId: 'us-toyota-camry', age: offered[0]!.age } });
    const v = vehiclesOf(sim.player)[0]!;
    expect(v.odometerAtPurchase).toBe(offered[0]!.odometerKm);
    expect(odometer(v)).toBe(offered[0]!.odometerKm);
  });
});

describe('a private seller', () => {
  it('charges no dealer’s documentation fee, and in Britain the car isn’t driven until it’s transferred', () => {
    const { sim, l } = withSeller('uk-eng-london', 'GB', 'gb-ford-puma', 'private', 'ul-priv-gb');
    // New York's dealers charge one; a private seller doesn't.
    const m = modelById('us-toyota-camry')!;
    const dealer = quote(m, 'us-ny-newyork', sim.now, { age: 3 }) as Quote;
    const priv = quote(m, 'us-ny-newyork', sim.now, { age: 3, privateSeller: true }) as Quote;
    expect(priv.total).toBeLessThan(dealer.total);
    sim.must({ kind: 'vehicle.buy', payload: { modelId: 'gb-ford-puma', age: l.age } });
    const v = vehiclesOf(sim.player)[0]!;
    expect(laidUp(v, sim.now)).toBe('It’s driven once it’s transferred to you and taxed.');
    expect(sim.must<{ penalty: number }>({ kind: 'vehicle.transfer', payload: { vehicleId: v.id } }).penalty).toBe(0);
    expect(laidUp(v, sim.now)).toBeUndefined();
    expect(sim.execute({ kind: 'vehicle.transfer', payload: { vehicleId: v.id } }).error).toBe('It’s in your name.');
  });

  it('in California has 10 days, then a $15 penalty; in Ontario 6, then it isn’t driven', () => {
    const ca = withSeller('us-ca-losangeles', 'US-CA', 'us-toyota-camry', 'private', 'ul-priv-ca');
    ca.sim.must({ kind: 'vehicle.buy', payload: { modelId: 'us-toyota-camry', age: ca.l.age } });
    const v = vehiclesOf(ca.sim.player)[0]!;
    expect(laidUp(v, ca.sim.now)).toBeUndefined();
    ca.sim.advanceBy(11 * MS_DAY);
    const caDone = ca.sim.must<{ penalty: number; fee: number }>({ kind: 'vehicle.transfer', payload: { vehicleId: v.id } });
    expect(caDone.penalty).toBe(inSaveMoney(ca.sim, 15_00, 'USD'));
    expect(caDone.fee).toBe(0);
    const on = withSeller('ca-on-toronto', 'CA-ON', 'ca-honda-cr-v', 'private', 'ul-priv-on');
    on.sim.must({ kind: 'vehicle.buy', payload: { modelId: 'ca-honda-cr-v', age: on.l.age } });
    const w = vehiclesOf(on.sim.player)[0]!;
    expect(laidUp(w, on.sim.now + 5 * MS_DAY)).toBeUndefined();
    expect(laidUp(w, on.sim.now + 7 * MS_DAY)).toBe('Its transfer to you is overdue: it’s driven again once that’s done.');
    // Done, at ServiceOntario's $32 vehicle permit (from 2026-10-05); California's has no fee kept.
    expect(on.sim.must<{ fee: number }>({ kind: 'vehicle.transfer', payload: { vehicleId: w.id } }).fee).toBe(inSaveMoney(on.sim, 32_00, 'CAD'));
    // Its quote no longer charges the permit as well (from 2026-10-06).
    const crv = modelById('ca-honda-cr-v')!;
    expect((quote(crv, 'ca-on-toronto', on.sim.now, { age: 3, privateSeller: true }) as Quote).lines.map((l) => l.label)).not.toContain('Permit And Plates');
  });

  it('in New York charges the $50 title at the transfer, not the sale; in Connecticut $25, and $50 more after 30 days', () => {
    const m = modelById('us-toyota-camry')!;
    const labels = (q: Quote) => q.lines.map((l) => l.label);
    expect(labels(quote(m, 'us-ny-newyork', Date.UTC(2026, 9, 6), { age: 3, privateSeller: true }) as Quote)).not.toContain('Title');
    expect(labels(quote(m, 'us-ny-newyork', Date.UTC(2026, 9, 6), { age: 3 }) as Quote)).toContain('Title');
    const ny = withSeller('us-ny-newyork', 'US-NY', 'us-toyota-camry', 'private', 'ul-priv-ny');
    ny.sim.must({ kind: 'vehicle.buy', payload: { modelId: 'us-toyota-camry', age: ny.l.age } });
    const v = vehiclesOf(ny.sim.player)[0]!;
    expect(v.transferBy! - v.boughtAt).toBe(30 * MS_DAY);
    ny.sim.advanceBy(40 * MS_DAY);
    expect(ny.sim.must<{ penalty: number; fee: number }>({ kind: 'vehicle.transfer', payload: { vehicleId: v.id } })).toEqual({ penalty: 0, fee: inSaveMoney(ny.sim, 50_00, 'USD') });
    const ct = withSeller('us-ct-newhaven', 'US-CT', 'us-toyota-camry', 'private', 'ul-priv-ct');
    ct.sim.must({ kind: 'vehicle.buy', payload: { modelId: 'us-toyota-camry', age: ct.l.age } });
    const w = vehiclesOf(ct.sim.player)[0]!;
    ct.sim.advanceBy(31 * MS_DAY);
    expect(ct.sim.must<{ penalty: number; fee: number }>({ kind: 'vehicle.transfer', payload: { vehicleId: w.id } })).toEqual({ penalty: inSaveMoney(ct.sim, 50_00, 'USD'), fee: inSaveMoney(ct.sim, 25_00, 'USD') });
  });

  it('in British Columbia charges $28; in Mexico City 433 pesos, with no fine past the 15 working days', () => {
    const bc = withSeller('ca-bc-vancouver', 'CA-BC', 'ca-honda-cr-v', 'private', 'ul-priv-bc');
    bc.sim.must({ kind: 'vehicle.buy', payload: { modelId: 'ca-honda-cr-v', age: bc.l.age } });
    expect(bc.sim.must<{ fee: number }>({ kind: 'vehicle.transfer', payload: { vehicleId: vehiclesOf(bc.sim.player)[0]!.id } }).fee).toBe(inSaveMoney(bc.sim, 28_00, 'CAD'));
    const mx = withSeller('mx-cmx-mexicocity', 'MX-CMX', MX_CAR, 'private', 'ul-priv-mx');
    mx.sim.must({ kind: 'vehicle.buy', payload: { modelId: MX_CAR, age: mx.l.age } });
    mx.sim.advanceBy(30 * MS_DAY);
    expect(mx.sim.must<{ penalty: number; fee: number }>({ kind: 'vehicle.transfer', payload: { vehicleId: vehiclesOf(mx.sim.player)[0]!.id } })).toEqual({ penalty: 0, fee: inSaveMoney(mx.sim, 433_00, 'MXN') });
  });
});

describe('a test drive', () => {
  it('takes the dealer’s minutes, needs a license, and shows a fault that shows', () => {
    let found: { sim: Simulation; age: number } | undefined;
    for (let i = 0; i < 60 && !found; i += 1) {
      const s = life('us-ny-newyork', `ul-drive-${i}`);
      const l = usedListings(s, s.player, 'us-toyota-camry', 'us-ny-newyork', 'US-NY').find((x) => usedFault(s, s.player, 'us-toyota-camry', x.age, 'us-ny-newyork', s.now));
      if (l) found = { sim: s, age: l.age };
    }
    const { sim, age } = found!;
    documentsOf(sim.player).splice(0, documentsOf(sim.player).length, ...documentsOf(sim.player).filter((d) => d.kind !== 'license'));
    expect(sim.execute({ kind: 'vehicle.test_drive', payload: { modelId: 'us-toyota-camry', age } }).error).toMatch(/driving license/);
    license(sim, 'us-ny');
    const start = sim.now;
    const r = sim.must<{ showed: boolean }>({ kind: 'vehicle.test_drive', payload: { modelId: 'us-toyota-camry', age } });
    expect(sim.now - start).toBe(30 * 60_000);
    expect(r.showed).toBe(true);
  });
});
