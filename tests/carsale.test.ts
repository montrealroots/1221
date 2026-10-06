/**
 * A car sold (`systems/carsale.ts`, from 2026-10-03): to a dealer now for
 * less, or listed privately at the site's fee to sell for its value in about
 * 30 days, with the seller in town for the buyer.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { modelById, valueOf, vehiclesOf } from '@/engine/systems/vehicles';
import { GB_DAYS_TO_SELL, KBB_EXAMPLE, PRIVATE_DAYS, PRIVATE_PREMIUM, dealerOffer, listingQuote, privateDaysOf, privateValue } from '@/engine/systems/carsale';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const inSave = (sim: ReturnType<typeof life>, cents: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? cents : exchange(cents, from, cur)!; };
const bought = (city: string, model: string, seed: string) => {
  const sim = life(city, seed);
  sim.must({ kind: 'vehicle.buy', payload: { modelId: model } });
  return { sim, v: vehiclesOf(sim.player)[0]! };
};

describe('a dealer', () => {
  it('in America pays KBB’s example gap under the value, never under its ratio', () => {
    const { sim, v } = bought('us-ny-newyork', 'us-honda-cr-v', 'sale-us');
    expect(dealerOffer(sim, v)).toBe(inSave(sim, valueOf(v, sim.now) - KBB_EXAMPLE.gapUsd * 100, 'USD'));
    v.listPrice = 300_000;
    v.ageAtPurchase = 12;
    expect(dealerOffer(sim, v)).toBe(inSave(sim, Math.round(valueOf(v, sim.now) * KBB_EXAMPLE.ratio), 'USD'));
  });

  it('in Britain pays the value over Autotrader’s 12.5% private premium', () => {
    const { sim, v } = bought('uk-eng-london', 'gb-ford-puma', 'sale-gb');
    expect(dealerOffer(sim, v)).toBe(inSave(sim, Math.round(valueOf(v, sim.now) / PRIVATE_PREMIUM), 'GBP'));
    expect(dealerOffer(sim, v)).toBeLessThan(privateValue(sim, v));
  });

  it('buys it only where it is', () => {
    const { sim, v } = bought('us-ny-newyork', 'us-honda-cr-v', 'sale-where');
    sim.player.currentLocationId = 'uk-eng-london';
    expect(sim.execute({ kind: 'vehicle.sell', payload: { vehicleId: v.id } }).error).toBe('It’s sold where it is, in New York.');
  });
});

describe('a private listing', () => {
  it('costs Craigslist’s $5 and sells in thirty days for more than a dealer gives', () => {
    const { sim, v } = bought('us-ny-newyork', 'us-honda-cr-v', 'sale-list');
    expect(listingQuote(sim, v)).toEqual({ platform: 'Craigslist', fee: inSave(sim, 500, 'USD'), confirmed: true });
    const l = sim.must<{ sellsAt: number; fee: number }>({ kind: 'vehicle.list', payload: { vehicleId: v.id } });
    expect(l.sellsAt - sim.now).toBe(PRIVATE_DAYS * MS_DAY);
    expect(sim.universe.transactions.some((t) => t.memo === 'Craigslist, the Honda CR-V listed')).toBe(true);
    expect(sim.execute({ kind: 'vehicle.list', payload: { vehicleId: v.id } }).error).toBe('It’s listed on Craigslist.');
    sim.advanceTo(l.sellsAt - 60_000);
    const dealer = dealerOffer(sim, v);
    sim.advanceTo(l.sellsAt + 60_000);
    expect(v.soldAt).toBe(l.sellsAt);
    const sale = sim.universe.transactions.find((t) => t.memo === 'Sold the Honda CR-V privately')!;
    const got = sale.postings.find((x) => x.accountId === sim.player.primaryAccountId)!.amount;
    expect(got).toBeGreaterThan(dealer);
    expect(v.listed).toBeUndefined();
  });

  it('waits for the seller to be in town, and taken down never sells', () => {
    const { sim, v } = bought('ca-on-toronto', 'ca-honda-cr-v', 'sale-away');
    const l = sim.must<{ sellsAt: number; fee: number }>({ kind: 'vehicle.list', payload: { vehicleId: v.id } });
    expect(l.fee).toBe(0);
    sim.player.currentLocationId = 'uk-eng-london';
    sim.advanceTo(l.sellsAt + 2 * MS_DAY);
    expect(v.soldAt).toBeUndefined();
    sim.player.currentLocationId = 'ca-on-toronto';
    sim.advanceBy(MS_DAY + 60_000);
    expect(v.soldAt).toBeDefined();

    const two = bought('us-ny-newyork', 'us-honda-cr-v', 'sale-down');
    const l2 = two.sim.must<{ sellsAt: number }>({ kind: 'vehicle.list', payload: { vehicleId: two.v.id } });
    two.sim.must({ kind: 'vehicle.unlist', payload: { vehicleId: two.v.id } });
    two.sim.advanceTo(l2.sellsAt + MS_DAY);
    expect(two.v.soldAt).toBeUndefined();
    expect(two.sim.execute({ kind: 'vehicle.unlist', payload: { vehicleId: two.v.id } }).error).toBe('It isn’t listed.');
  });

  it('lapses when the car’s stolen', () => {
    const { sim, v } = bought('us-ny-newyork', 'us-honda-cr-v', 'sale-stolen');
    const l = sim.must<{ sellsAt: number }>({ kind: 'vehicle.list', payload: { vehicleId: v.id } });
    // Found again after its buyer was due.
    v.stolen = { at: sim.now, recoverAt: l.sellsAt + 10 * MS_DAY };
    sim.advanceTo(l.sellsAt + 60_000);
    expect(v.soldAt).toBeUndefined();
    expect(v.listed).toBeUndefined();
  });
});

describe('a private sale in Britain (from 2026-10-05)', () => {
  it('takes Auto Trader’s days to sell for the car’s fuel', () => {
    expect(GB_DAYS_TO_SELL).toEqual({ petrol: 29, diesel: 32, ev: 24 });
    const { sim, v } = bought('uk-eng-london', 'gb-volkswagen-polo', 'sale-gb-days');
    const days = GB_DAYS_TO_SELL[modelById(v.modelId)!.fuel] ?? PRIVATE_DAYS;
    expect(privateDaysOf(v)).toBe(days);
    const l = sim.must<{ sellsAt: number }>({ kind: 'vehicle.list', payload: { vehicleId: v.id } });
    expect(l.sellsAt - sim.now).toBe(days * MS_DAY);
    expect(days).not.toBe(PRIVATE_DAYS);
  });
});
