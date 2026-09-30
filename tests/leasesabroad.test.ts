/**
 * Leases outside America (`systems/leasing.ts`, from 2026-09-30): Canada's at
 * Honda's terms, and a PCP in Britain and Ireland, its final payment to own
 * the car or the car handed back, and the half rule for giving it back early.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { salesTaxRate } from '@/engine/content/tax';
import { CA_LEASE, PCP } from '@/engine/content/vehiclefees';
import { buyoutPrice, halfRule, leaseQuote, milesOver, pcpPayment, type LeaseQuote } from '@/engine/systems/leasing';
import { kept, modelById, vehiclesOf } from '@/engine/systems/vehicles';

const AT = Date.UTC(2026, 9, 1);
const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };

describe('a PCP in Britain', () => {
  it('reproduces Nissan’s Qashqai offer: 30% down, £219 a month for 36 months at 0%, and £13,550 to own it', () => {
    const q = leaseQuote('gb-nissan-qashqai', 'uk-eng-london', AT, 37) as LeaseQuote;
    expect(q.kind).toBe('pcp');
    expect(q.atSigning[0]).toEqual({ label: 'The Deposit', amount: Math.round(30_635_00 * 0.3) });
    expect(q.residual).toBe(13_550_00);
    expect(q.monthly).toBe(Math.round((30_635_00 - Math.round(30_635_00 * 0.3) - 13_550_00) / 36));
    expect(Math.abs(q.monthly - 219_00)).toBeLessThan(100);
    // Any other car at the FCA's 5% average: more a month than at 0%.
    const golf = leaseQuote('gb-volkswagen-golf', 'uk-eng-london', AT, 37) as LeaseQuote;
    const price = modelById('gb-volkswagen-golf')!.price + modelById('gb-volkswagen-golf')!.delivery;
    expect(golf.apr).toBeCloseTo(5, 10);
    expect(golf.monthly).toBe(pcpPayment(price - Math.round(price * 0.3), golf.residual, 36, 0.05));
    expect(golf.monthly).toBeGreaterThan(pcpPayment(price - Math.round(price * 0.3), golf.residual, 36, 0));
    expect(leaseQuote('gb-nissan-qashqai', 'uk-eng-london', AT, 36)).toMatch(/25, 37, 49/);
    // Longer, less to own it with, along SLATE's curve from Nissan's 37 months.
    expect((leaseQuote('gb-nissan-qashqai', 'uk-eng-london', AT, 49) as LeaseQuote).residual).toBe(Math.round(30_635_00 * PCP.gmfv37 * (kept(49 / 12) / kept(37 / 12))));
    // At a rate, the payments and the discounted final payment come to the credit.
    const i = 0.05 / 12;
    const worth = Array.from({ length: 36 }, (_, k) => golf.monthly / (1 + i) ** (k + 1)).reduce((a, x) => a + x, 0) + golf.residual / (1 + i) ** 37;
    expect(Math.abs(worth - (price - Math.round(price * 0.3)))).toBeLessThan(100);
  });

  it('goes back early under the half rule, the rest to half paid first, and at its end is kept for the final payment or handed back with the miles over', () => {
    const sim = life('uk-eng-london', 'pcp-half');
    const r = sim.execute<{ vehicleId: string }>({ kind: 'vehicle.lease', payload: { modelId: 'gb-nissan-qashqai', months: 37 } });
    expect(r.ok, r.error).toBe(true);
    const v = vehiclesOf(sim.player).find((x) => x.id === r.value!.vehicleId)!;
    const q = leaseQuote('gb-nissan-qashqai', 'uk-eng-london', AT, 37) as LeaseQuote;
    const half = halfRule(v) as { topUp: number };
    expect(half.topUp).toBe(Math.round(inSave(sim, q.total!, 'GBP') / 2) - inSave(sim, q.atSigning[0]!.amount, 'GBP'));
    sim.advanceBy(62 * MS_DAY);
    expect((halfRule(v) as { topUp: number }).topUp).toBe(half.topUp - 2 * v.lease!.monthly);
    const back = sim.execute<{ paid: number }>({ kind: 'vehicle.lease_return', payload: { vehicleId: v.id } });
    expect(back.ok, back.error).toBe(true);
    expect(back.value!.paid).toBeGreaterThanOrEqual(half.topUp - 2 * v.lease!.monthly);
    expect(v.soldAt).toBeDefined();
    // At its end: the final payment, and 8p a mile over 6,000 a year.
    const end = life('uk-eng-london', 'pcp-end');
    const e = end.execute<{ vehicleId: string }>({ kind: 'vehicle.lease', payload: { modelId: 'gb-nissan-qashqai', months: 37 } });
    const w = vehiclesOf(end.player).find((x) => x.id === e.value!.vehicleId)!;
    expect(buyoutPrice(w, end.now)).toBe(13_550_00);
    w.km = (37 / 12) * 6_000 * 1.609344 + 1_000 * 1.609344;
    expect(milesOver(w)).toEqual({ miles: 1_000, unit: 'mile', charge: 80_00 });
  });
});

describe('a PCP in Ireland, and a lease in Canada', () => {
  it('charges Toyota Ireland’s €63.49 documentation fee at signing and €63.49 on the final payment, at the Central Bank’s rate', () => {
    const sim = life('ie-lei-dublin', 'pcp-ie');
    const q = leaseQuote('ie-toyota-rav4', 'ie-lei-dublin', AT, 37, sim.player) as LeaseQuote;
    expect(q.currency).toBe('EUR');
    expect(q.atSigning.find((l) => l.label === 'Documentation Fee')!.amount).toBe(63_49);
    expect(q.buyoutFee).toBe(63_49);
    expect(q.apr).toBeGreaterThan(0);
    expect(PCP.IE.purchaseFee).toBe(63.49);
    const r = sim.execute<{ vehicleId: string }>({ kind: 'vehicle.lease', payload: { modelId: 'ie-toyota-rav4', months: 37 } });
    expect(r.ok, r.error).toBe(true);
    const v = vehiclesOf(sim.player).find((x) => x.id === r.value!.vehicleId)!;
    expect(buyoutPrice(v, AT)).toBe(v.lease!.residual + 63_49);
  });

  it('leases in Toronto at 2.99% on Honda’s worked-back residual, each payment taxed with HST, 15 cents a kilometer over', () => {
    const m = modelById('ca-honda-cr-v')!;
    const sticker = m.price + m.delivery;
    const q = leaseQuote(m.id, 'ca-on-toronto', AT, 24) as LeaseQuote;
    const residual = Math.round(sticker * CA_LEASE.residual24);
    expect(q.residual).toBe(residual);
    expect(q.base).toBe(Math.round((sticker - residual) / 24 + ((sticker + residual) * 0.0299) / 24));
    expect(q.monthly).toBe(Math.round(q.base * (1 + salesTaxRate('ca-on-toronto', AT, 'goods'))));
    // Honda's own example: $797.47 on $51,993 over 24 months is what 68.2% gives.
    expect((51_993 - 51_993 * 0.682) / 24 + (51_993 * 1.682 * 0.0299) / 24).toBeCloseTo(797.47, 0);
    // Longer, it keeps less of its value, along SLATE's curve.
    expect((leaseQuote(m.id, 'ca-on-toronto', AT, 48) as LeaseQuote).residual).toBe(Math.round(sticker * CA_LEASE.residual24 * (kept(4) / kept(2))));
    const sim = life('ca-on-toronto', 'lease-ca');
    const r = sim.execute<{ vehicleId: string }>({ kind: 'vehicle.lease', payload: { modelId: m.id, months: 24 } });
    expect(r.ok, r.error).toBe(true);
    const v = vehiclesOf(sim.player).find((x) => x.id === r.value!.vehicleId)!;
    v.km = 40_000 + 500;
    expect(milesOver(v)).toEqual({ miles: 500, unit: 'km', charge: 75_00 });
    expect(buyoutPrice(v, AT)).toBe(Math.round(residual * (1 + salesTaxRate('ca-on-toronto', AT, 'goods'))));
    // A Canadian lease doesn't end early.
    expect(sim.execute({ kind: 'vehicle.lease_return', payload: { vehicleId: v.id } }).error).toMatch(/run its term/);
  });
});
