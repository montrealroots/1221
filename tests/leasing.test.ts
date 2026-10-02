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
import { buyoutPrice, earlyEnd, leaseBalance, leaseQuote, leaseRefusal, milesOver, type LeaseQuote } from '@/engine/systems/leasing';
import { tradeInValue, usSalesTaxRate } from '@/engine/systems/vehicles';

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
  it('is the lessor’s car: not held, sold or traded; at its end it’s returned for $350 and the miles over', () => {
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

describe('a lease in default', () => {
  it('has its car taken back by the lessor after three missed payments, and the repossession on the record', () => {
    const sim = life('us-ny-newyork', 'lease-default');
    const r = sim.execute<{ vehicleId: string }>({ kind: 'vehicle.lease', payload: { modelId: 'us-toyota-rav4', months: 36 } });
    expect(r.ok, r.error).toBe(true);
    const v = vehiclesOf(sim.player).find((x) => x.id === r.value!.vehicleId)!;
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && !a.nominal) { a.balance = -1e9; if (a.kind === 'credit_card') a.creditLimit = 0; }
    const score = sim.player.credit?.score ?? 0;
    sim.advanceBy(65 * MS_DAY);
    expect(v.soldAt).toBeUndefined();
    sim.advanceBy(40 * MS_DAY);
    expect(v.lease!.missed).toBeGreaterThanOrEqual(3);
    expect(v.soldAt).toBeDefined();
    expect(sim.player.credit!.score).toBeLessThan(score);
    expect(sim.player.credit!.marks!.some((m) => m.points === 100 && m.at === v.soldAt)).toBe(true);
  });

  it('keeps the balance by the constant yield method: the capitalized cost less the first payment, falling each month to the residual at its end', () => {
    const sim = life('us-ny-newyork', 'lease-balance');
    const r = sim.execute<{ vehicleId: string }>({ kind: 'vehicle.lease', payload: { modelId: 'us-honda-cr-v', months: 36 } });
    const lease = vehiclesOf(sim.player).find((x) => x.id === r.value!.vehicleId)!.lease!;
    expect(lease.capitalized).toBeGreaterThan(lease.residual);
    expect(Math.abs(leaseBalance(lease, 1)! - (lease.capitalized! - lease.base!))).toBeLessThanOrEqual(2);
    // After the last payment, a month short of its end: the residual less a month's yield.
    expect(leaseBalance(lease, 36)!).toBeLessThan(lease.residual);
    expect(leaseBalance(lease, 36)!).toBeGreaterThan(lease.residual * 0.99);
    for (let k = 1; k < 36; k += 1) expect(leaseBalance(lease, k + 1)!).toBeLessThan(leaseBalance(lease, k)!);
    // A lease signed before the balance was kept ends at its term.
    expect(leaseBalance({ ...lease, capitalized: undefined }, 3)).toBeUndefined();
    expect(leaseBalance({ ...lease, base: undefined }, 3)).toBeUndefined();
  });

  it('ends early for its balance less the trade-in value and the disposition fee, or is bought out early for the balance, the fee and the tax', () => {
    const sim = life('us-ny-newyork', 'lease-early');
    const r = sim.execute<{ vehicleId: string }>({ kind: 'vehicle.lease', payload: { modelId: 'us-honda-cr-v', months: 36 } });
    const v = vehiclesOf(sim.player).find((x) => x.id === r.value!.vehicleId)!;
    sim.advanceBy(6 * 30 * MS_DAY + MS_DAY);
    v.lease!.buyoutFee = 300_00;
    const e = earlyEnd(sim, v) as Exclude<ReturnType<typeof earlyEnd>, string>;
    const made = v.lease!.months - v.lease!.monthsLeft;
    expect(e.balance).toBe(leaseBalance(v.lease!, made));
    expect(e.realized).toBe(exchange(tradeInValue(sim, v), saveCurrency(sim.universe), 'USD') ?? tradeInValue(sim, v));
    expect(e.charge).toBe(Math.max(0, e.balance - e.realized));
    expect(e.charge).toBeGreaterThan(0);
    // Worth more than its balance, there's no charge, and nothing back.
    expect((earlyEnd(sim, { ...v, listPrice: v.listPrice * 3 }) as { charge: number }).charge).toBe(0);
    expect(e.buyout).toBe(Math.round(e.balance * (1 + usSalesTaxRate('US-NY', 'us-ny-newyork', sim.now, e.balance / 100))) + v.lease!.buyoutFee!);
    // Bought out early: kept, the lease gone.
    const twin = life('us-ny-newyork', 'lease-early');
    const t = twin.execute<{ vehicleId: string }>({ kind: 'vehicle.lease', payload: { modelId: 'us-honda-cr-v', months: 36 } });
    twin.advanceBy(6 * 30 * MS_DAY + MS_DAY);
    const tv = vehiclesOf(twin.player).find((x) => x.id === t.value!.vehicleId)!;
    const tb = (earlyEnd(twin, tv) as { buyout: number }).buyout;
    const b = twin.execute<{ paid: number }>({ kind: 'vehicle.lease_buyout', payload: { vehicleId: tv.id } });
    expect(b.ok, b.error).toBe(true);
    expect(b.value!.paid).toBe(inSave(twin, tb, 'USD'));
    expect(tv.lease).toBeUndefined();
    expect(tv.soldAt).toBeUndefined();
    // Ended early: the charge and the $350, and the car gone.
    const end = sim.execute<{ paid: number }>({ kind: 'vehicle.lease_return', payload: { vehicleId: v.id } });
    expect(end.ok, end.error).toBe(true);
    expect(end.value!.paid).toBe(inSave(sim, e.charge + 350_00, 'USD'));
    expect(v.soldAt).toBeDefined();
    expect(sim.universe.transactions.some((x) => x.memo.includes('early, its early termination charge paid'))).toBe(true);
  });
});
