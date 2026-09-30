/**
 * A new car leased in America (`systems/leasing.ts`, from 2026-09-30): the
 * published payment arithmetic at Toyota Financial Services' September 2026
 * terms, New York's tax at signing and the others' on each payment, the car
 * the lessor's until its end, and then returned for the disposition fee and
 * the miles over, or bought out at its residual.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { kept, tradeInFor, vehiclesOf } from '@/engine/systems/vehicles';
import { netWorth } from '@/engine/systems/finance';
import { buyoutPrice, leaseQuote, leaseRefusal, milesOver, type LeaseQuote } from '@/engine/systems/leasing';

const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const at = Date.UTC(2026, 9, 2);
const line = (q: LeaseQuote, re: RegExp) => q.atSigning.find((l) => re.test(l.label))?.amount;

describe('the payment', () => {
  it('capitalizes a RAV4 in Los Angeles at what buyers paid, keeps its three-year residual, and taxes each payment at 10.25%', () => {
    const q = leaseQuote('us-toyota-rav4', 'us-ca-losangeles', at, 36) as LeaseQuote;
    const cap = 3_190_000 - Math.round(3_190_000 * 0.034);
    const residual = Math.round(3_190_000 * kept(3));
    expect(q.capitalized).toBe(cap);
    expect(q.residual).toBe(residual);
    expect(q.base).toBe(Math.round((cap - residual) / 36 + (cap + residual) * 0.00299));
    expect(q.monthly).toBe(Math.round(q.base * 1.1025));
    expect(line(q, /Acquisition/)).toBe(750_00);
    expect(line(q, /Processing/)).toBe(85_00);
    expect(line(q, /Sales Tax/)).toBeUndefined();
    expect(q.dueAtSigning).toBe(q.atSigning.reduce((a, l) => a + l.amount, 0));
  });

  it('taxes every New York payment at signing, and a longer lease leaves a lower residual', () => {
    const q = leaseQuote('us-honda-cr-v', 'us-ny-newyork', at, 36) as LeaseQuote;
    expect(q.monthly).toBe(q.base);
    expect(line(q, /Sales Tax/)).toBe(Math.round(q.base * 36 * 0.08875));
    // Its fourth year costs more than the lease's term spreads it: 48 months are dearer a month than 36.
    const longer = leaseQuote('us-honda-cr-v', 'us-ny-newyork', at, 48) as LeaseQuote;
    expect(longer.residual).toBeLessThan(q.residual);
    expect(longer.base).toBeGreaterThan(q.base);
  });

  it('leases in America at 24, 36 or 48 months, and with full cover; not in Mexico City, and an American car not abroad', () => {
    // Until later on 2026-09-30, America only; a PCP is Britain's now (tests/leasesabroad.test.ts).
    expect(leaseQuote('us-toyota-rav4', 'uk-eng-london', at, 37)).toMatch(/another market/);
    expect(leaseQuote('mx-tesla-model-y', 'mx-cmx-mexicocity', at, 36)).toMatch(/America and Canada/);
    expect(leaseQuote('us-toyota-rav4', 'us-ca-losangeles', at, 30)).toMatch(/24, 36, 48/);
    const sim = life('us-ny-newyork', 'lease-refuse');
    expect(leaseRefusal(sim, sim.player, 'us-honda-cr-v', 36, 'liability')).toMatch(/full cover/);
    expect(leaseRefusal(sim, sim.player, 'us-honda-cr-v', 36, 'full')).toBeUndefined();
  });
});

describe('a lease', () => {
  it('is the lessor’s car: not held, sold or traded, nor ended early; at its end it’s returned for $350 and the miles over', () => {
    const sim = life('us-ny-newyork', 'lease-ny');
    const before = netWorth(sim, sim.player.id).vehicles;
    const r = sim.execute<{ vehicleId: string; paid: number; monthly: number }>({ kind: 'vehicle.lease', payload: { modelId: 'us-honda-cr-v', months: 24 } });
    expect(r.ok, r.error).toBe(true);
    const id = r.value!.vehicleId;
    const v = vehiclesOf(sim.player).find((x) => x.id === id)!;
    expect(netWorth(sim, sim.player.id).vehicles).toBe(before);
    expect(sim.execute({ kind: 'vehicle.sell', payload: { vehicleId: id } }).error).toMatch(/lessor/);
    expect(sim.execute({ kind: 'vehicle.buy', payload: { modelId: 'us-toyota-camry', tradeIn: id } }).error).toMatch(/lessor/);
    expect(tradeInFor(sim, 'us-ny-newyork', v)).toBeUndefined();
    expect(sim.execute({ kind: 'vehicle.lease_return', payload: { vehicleId: id } }).error).toMatch(/early/);
    expect(sim.execute({ kind: 'vehicle.lease_buyout', payload: { vehicleId: id } }).error).toMatch(/early/);
    sim.advanceBy(24 * 30 * MS_DAY + MS_DAY);
    expect(sim.universe.transactions.filter((t) => t.memo === 'Lease payment, the Honda CR-V')).toHaveLength(23);
    expect(v.lease!.maturedAt).toBeDefined();
    expect(sim.universe.notifications.some((n) => n.title === 'Your Lease Is Ending')).toBe(true);
    // Driven 21,000 miles against the two years' 20,000: a thousand over, at $0.15.
    v.km = 21_000 * 1.609344;
    const over = milesOver(v);
    expect(over).toEqual({ miles: 1_000, unit: 'mile', charge: 150_00 });
    sim.advanceBy(31 * MS_DAY);
    expect(v.soldAt).toBeDefined();
    const back = sim.universe.transactions.find((t) => t.memo.startsWith('The Honda CR-V returned'))!;
    expect(back.postings.find((p) => p.accountId === sim.player.primaryAccountId)!.amount).toBe(-inSave(sim, 350_00 + over.charge, 'USD'));
    expect(sim.universe.transactions.filter((t) => t.memo === 'Lease payment, the Honda CR-V')).toHaveLength(23);
  });

  it('is bought out at its end for the residual and the state’s tax, and then is held', () => {
    const sim = life('us-ny-newyork', 'lease-buy');
    const r = sim.execute<{ vehicleId: string }>({ kind: 'vehicle.lease', payload: { modelId: 'us-honda-cr-v', months: 24 } });
    const v = vehiclesOf(sim.player).find((x) => x.id === r.value!.vehicleId)!;
    sim.advanceBy(24 * 30 * MS_DAY + MS_DAY);
    const price = buyoutPrice(v, sim.now)!;
    expect(price).toBe(Math.round(v.lease!.residual * 1.08875));
    const b = sim.execute<{ paid: number }>({ kind: 'vehicle.lease_buyout', payload: { vehicleId: v.id } });
    expect(b.ok, b.error).toBe(true);
    expect(b.value!.paid).toBe(inSave(sim, price, 'USD'));
    expect(v.lease).toBeUndefined();
    sim.advanceBy(40 * MS_DAY);
    expect(v.soldAt).toBeUndefined();
    expect(netWorth(sim, sim.player.id).vehicles).toBeGreaterThan(0);
  });
});
