/**
 * A car's interior done to your own design (`systems/interiors.ts`, from
 * 2026-10-02): an itemized estimate of the materials at suppliers' prices
 * and the hours at the trade's, a leopard-print commission kept with the car
 * as designed, the car at the shop its days, and a Katzkin kit fitted when
 * it comes.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { documentsOf } from '@/engine/systems/documents';
import { vehiclesOf } from '@/engine/systems/vehicles';
import { HOURS, KATZKIN, KATZKIN_USD, MATERIAL_USD, SHOP_RATE_USD, YARDS, interiorQuote } from '@/engine/systems/interiors';

const usd = (sim: Simulation, dollars: number) => { const c = Math.round(dollars * 100); const cur = saveCurrency(sim.universe); return cur === 'USD' ? c : exchange(c, 'USD', cur)!; };
function withCar(seed: string) {
  const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);
  documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer: 'us-ny', name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 3650 * MS_DAY, expiresAt: sim.now + 3650 * MS_DAY });
  sim.must({ kind: 'vehicle.buy', payload: { modelId: 'us-toyota-camry' } });
  return { sim, v: vehiclesOf(sim.player)[0]! };
}
const leopard = [{ part: 'seats' as const, material: 'leopard-vinyl' as const, color: 'Leopard', stitching: 'Black' }, { part: 'steering' as const, material: 'leather' as const, color: 'Black', stitching: 'Gold' }];

describe('an interior to your design', () => {
  it('is estimated line by line: each material at its supplier’s price, each part’s hours at the trade’s rate', () => {
    const { sim } = withCar('int-quote');
    const q = interiorQuote(sim, 'ivan-car-upholstery-bronx', leopard);
    if (typeof q === 'string') throw new Error(q);
    expect(q.lines).toHaveLength(4);
    expect(q.lines[0]!.amount).toBe(usd(sim, YARDS.seats * MATERIAL_USD['leopard-vinyl'].price));
    expect(q.lines[1]!.amount).toBe(usd(sim, HOURS.seats * SHOP_RATE_USD));
    expect(q.lines[2]!.amount).toBe(usd(sim, YARDS.steering * 13.5 * MATERIAL_USD.leather.price));
    expect(q.total).toBe(q.lines.reduce((a, l) => a + l.amount, 0));
    // Nineteen hours: three working days, five on the calendar.
    expect(q.days).toBe(Math.ceil((Math.ceil((HOURS.seats + HOURS.steering) / 8) * 7) / 5));
    expect(interiorQuote(sim, 'ivan-car-upholstery-bronx', [{ part: 'headliner', material: 'leather', color: 'Black', stitching: '' }])).toMatch(/isn’t done in leather/);
    expect(interiorQuote(sim, 'ivan-car-upholstery-bronx', leopard, true)).toMatch(/doesn’t fit Katzkin/);
  });

  it('is commissioned, paid, and kept with the car exactly as designed while it’s at the shop its days', () => {
    const { sim, v } = withCar('int-commission');
    const q = interiorQuote(sim, 'ivan-car-upholstery-bronx', leopard) as Exclude<ReturnType<typeof interiorQuote>, string>;
    const before = sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
    const r = sim.execute<{ paid: number; readyAt: number }>({ kind: 'vehicle.interior', payload: { vehicleId: v.id, shopId: 'ivan-car-upholstery-bronx', design: leopard } });
    expect(r.ok, r.error).toBe(true);
    expect(before - sim.universe.accounts[sim.player.primaryAccountId!]!.balance).toBe(q.total);
    expect(v.interior!.parts).toEqual(leopard);
    expect(v.inShop!.until).toBe(r.value!.readyAt);
    expect(sim.execute({ kind: 'vehicle.interior', payload: { vehicleId: v.id, shopId: 'ivan-car-upholstery-bronx', design: leopard } }).error).toBe('It’s in a shop already.');
    // A part with no color isn't a design; a leased car's interior is the lessor's.
    const other = withCar('int-refusals');
    expect(other.sim.execute({ kind: 'vehicle.interior', payload: { vehicleId: other.v.id, shopId: 'ivan-car-upholstery-bronx', design: [{ ...leopard[0]!, color: '' }] } }).error).toBe('Choose a color for each part.');
    other.v.lease = {} as never;
    expect(other.sim.execute({ kind: 'vehicle.interior', payload: { vehicleId: other.v.id, shopId: 'ivan-car-upholstery-bronx', design: leopard } }).error).toBe('It’s the lessor’s car: its interior isn’t yours to change.');
    // Not in Los Angeles's shops from New York.
    expect(sim.execute({ kind: 'vehicle.interior', payload: { vehicleId: v.id, shopId: 'los-angeles-upholstery-pico', design: leopard } }).error).toBe('The car isn’t in the shop’s town.');
  });

  it('as a Katzkin kit: leather seats at Katzkin’s price, fitted two weeks on, for two days', () => {
    const { sim, v } = withCar('int-katzkin');
    const seats = [{ part: 'seats' as const, material: 'leather' as const, color: 'Cognac', stitching: 'Black' }];
    expect(interiorQuote(sim, 'city-seat-covers-lic', leopard, true)).toBe('A Katzkin kit is leather seats only.');
    const r = sim.execute<{ paid: number }>({ kind: 'vehicle.interior', payload: { vehicleId: v.id, shopId: 'city-seat-covers-lic', design: seats, kit: true } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.paid).toBe(usd(sim, KATZKIN_USD));
    expect(v.interior).toBeUndefined();
    expect(v.inShop).toBeUndefined();
    sim.advanceBy((KATZKIN.waitDays + 0.5) * MS_DAY);
    expect(v.interior).toMatchObject({ kit: 'katzkin', parts: seats });
    expect(v.inShop!.until).toBeGreaterThan(sim.now);
  });
});
