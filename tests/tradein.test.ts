/**
 * A car traded in (`tradeInFor`, `quote`, `vehicle.buy` in `systems/vehicles.ts`,
 * from 2026-09-29): its value off the taxed price in New York and Connecticut
 * and not in California, Britain's part-exchange 4% under a private sale, and
 * the old car's loan paid off from its value.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { modelById, quote, tradeInValue, valueOf, vehiclesOf, type Quote } from '@/engine/systems/vehicles';

const at = Date.UTC(2026, 8, 29);
const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
const line = (q: Quote, re: RegExp) => q.lines.find((l) => re.test(l.label))!.amount;
const trade = { value: 10_000_00, payoff: 0, label: 'Old Car' };

describe('a trade-in’s credit', () => {
  it('comes off the price New York and Connecticut tax, and not California’s', () => {
    const cr = modelById('us-honda-cr-v')!;
    const ny = quote(cr, 'us-ny-newyork', at) as Quote;
    const nyTrade = quote(cr, 'us-ny-newyork', at, { tradeIn: trade }) as Quote;
    expect(line(ny, /Sales Tax/) - line(nyTrade, /Sales Tax/)).toBe(Math.round(10_000_00 * 0.08875));
    const camry = modelById('us-toyota-camry')!;
    expect(line(quote(camry, 'us-ct-newhaven', at) as Quote, /Sales tax/) - line(quote(camry, 'us-ct-newhaven', at, { tradeIn: trade }) as Quote, /Sales tax/)).toBe(Math.round(10_000_00 * 0.0635));
    const rav = modelById('us-toyota-rav4')!;
    expect(line(quote(rav, 'us-ca-losangeles', at, { tradeIn: trade }) as Quote, /Sales Tax/)).toBe(line(quote(rav, 'us-ca-losangeles', at) as Quote, /Sales Tax/));
    // The credit off what's due: the value less the old loan.
    expect(line(nyTrade, /Trade-In/)).toBe(-10_000_00);
    expect(line(quote(cr, 'us-ny-newyork', at, { tradeIn: { ...trade, payoff: 4_000_00 } }) as Quote, /Trade-In/)).toBe(-6_000_00);
  });
});

describe('trading one in', () => {
  it('sells the old car to the dealer at its value, 4% under in Britain, and pays for the new one with it', () => {
    const sim = quickSave({ startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london', livesWhereBorn: true, wealth: 'wealthy' }, 'trade-gb');
    sim.universe.accounts[sim.player.primaryAccountId!]!.balance += inSave(sim, 60_000_00, 'GBP');
    expect(sim.execute({ kind: 'vehicle.buy', payload: { modelId: 'gb-ford-puma', age: 3 } }).ok).toBe(true);
    const old = vehiclesOf(sim.player)[0]!;
    expect(tradeInValue(sim, old)).toBe(inSave(sim, Math.round(valueOf(old, sim.now) * 0.96), 'GBP'));
    const credit = tradeInValue(sim, old);
    const before = sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
    const plain = quote(modelById('gb-ford-puma')!, 'uk-eng-london', sim.now, { person: sim.player }) as Quote;
    const r = sim.execute<{ paid: number }>({ kind: 'vehicle.buy', payload: { modelId: 'gb-ford-puma', tradeIn: old.id } });
    expect(r.ok, r.error).toBe(true);
    expect(old.soldAt).toBeDefined();
    expect(r.value!.paid).toBe(inSave(sim, plain.total, 'GBP') - credit);
    expect(before - sim.universe.accounts[sim.player.primaryAccountId!]!.balance).toBe(r.value!.paid);
    expect(sim.universe.transactions.some((t) => t.memo === 'Traded in the Ford Puma')).toBe(true);
    expect(sim.execute({ kind: 'vehicle.buy', payload: { modelId: 'gb-ford-puma', tradeIn: old.id } }).error).toMatch(/isn’t a car you own/);
  });
});
