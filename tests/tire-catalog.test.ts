/**
 * Tires by make and model (`systems/tires.ts`, `content/tirecatalog.ts`, from
 * 2026-10-05): a set of four of a tire sold where the car is, at its price
 * with the place's tax and America's fitting, lasting its own warranty, and a
 * winter set the same way.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { TIRE_PRODUCTS } from '@/engine/content/tirecatalog';
import { FIT_SET, TIRE_LIFE_KM, TREAD_LIFE, WINTER_TIRES, lifeOfTire, treadCredit, odometerOf, setPrice, tireCatalog, tireLifeOf, tireOfferRefusal, tiresWorn } from '@/engine/systems/tires';
import { devicePrice } from '@/engine/systems/devices';
import { inSaveMoney } from '@/engine/systems/banking';
import { vehiclesOf } from '@/engine/systems/vehicles';

const bought = (city: string, model: string, seed: string) => {
  const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.must({ kind: 'vehicle.buy', payload: { modelId: model } });
  return { sim, v: vehiclesOf(sim.player)[0]! };
};
const balance = (sim: ReturnType<typeof bought>['sim']) => sim.universe.accounts[sim.player.primaryAccountId!]!.balance;

describe('tires by make and model', () => {
  it('sells a set of four where the car is, cheapest first, America’s with BJ’s fitting', () => {
    const { sim, v } = bought('us-ny-newyork', 'us-toyota-camry', 'tirecat-us');
    const shop = tireCatalog(sim, v, false);
    expect(shop.length).toBeGreaterThan(0);
    expect(shop.every((r) => r.offer.market === 'us' && r.product.attrs.season !== 'winter')).toBe(true);
    expect(shop.map((r) => r.price)).toEqual([...shop.map((r) => r.price)].sort((a, b) => a - b));
    const one = shop[0]!;
    expect(one.price).toBe(devicePrice(sim, 'us-ny-newyork', one.offer) * 4 + inSaveMoney(sim, FIT_SET.us!.price * 100, 'USD'));
    expect(setPrice(sim, 'us-ny-newyork', one.offer)).toBe(one.price);
    const abroad = TIRE_PRODUCTS.flatMap((p) => p.offers).find((o) => o.market === 'uk')!;
    expect(tireOfferRefusal(v, abroad.id, false)).toBe('It’s sold in another country.');
    const winter = tireCatalog(sim, v, true)[0];
    if (winter) expect(tireOfferRefusal(v, winter.offer.id, false)).toBe('That’s a winter tire; fit it as one.');
  });

  it('fits the chosen set, paid, lasting its warranty or the CrossClimate 2’s', () => {
    const { sim, v } = bought('us-ny-newyork', 'us-toyota-camry', 'tirecat-fit');
    const shop = tireCatalog(sim, v, false);
    const rated = shop.find((r) => typeof r.product.attrs.warrantyKm === 'number');
    const pick = rated ?? shop[0]!;
    const before = balance(sim);
    const r = sim.must<{ paid: number }>({ kind: 'vehicle.replace_tires', payload: { vehicleId: v.id, offerId: pick.offer.id } });
    expect(r.paid).toBe(pick.price);
    expect(before - balance(sim)).toBe(pick.price);
    // A warranty is a promise, not a lifespan: the set's own life is 85% to 115% of it (from 2026-10-05).
    expect(v.tires).toMatchObject({ product: pick.product.id, brand: pick.product.brand, paid: pick.price });
    const promised = lifeOfTire(pick.product);
    expect(tireLifeOf(v)).toBeGreaterThanOrEqual(Math.round(promised * TREAD_LIFE.least));
    expect(tireLifeOf(v)).toBeLessThanOrEqual(Math.round(promised * TREAD_LIFE.most));
    expect(promised).toBe(typeof pick.product.attrs.warrantyKm === 'number' ? pick.product.attrs.warrantyKm : TIRE_LIFE_KM);
    // Worn at its own life from when it went on.
    v.km = (v.km ?? 0) + tireLifeOf(v) - 1;
    expect(tiresWorn(v)).toBe(false);
    v.km += 1;
    expect(tiresWorn(v)).toBe(true);
    // Fitted with no model chosen, the market's set as before, and its own life gone.
    sim.must({ kind: 'vehicle.replace_tires', payload: { vehicleId: v.id } });
    expect(v.tires).toBeUndefined();
    expect(v.tiresAtKm).toBe(odometerOf(v));
  });

  it('credits a set worn out before its warranty, pro rata, toward the same brand', () => {
    const { sim, v } = bought('us-ny-newyork', 'us-toyota-camry', 'tirecat-credit');
    const rated = tireCatalog(sim, v, false).find((r) => typeof r.product.attrs.warrantyKm === 'number')!;
    expect(rated).toBeDefined();
    sim.must({ kind: 'vehicle.replace_tires', payload: { vehicleId: v.id, offerId: rated.offer.id } });
    // Worn out at 90% of its warranty.
    v.tires = { ...v.tires!, lifeKm: Math.round(v.tires!.warrantyKm! * 0.9) };
    v.km = (v.km ?? 0) + v.tires.lifeKm;
    expect(tiresWorn(v)).toBe(true);
    const credit = treadCredit(v, rated.product.brand);
    expect(credit).toBe(Math.round(rated.price * (1 - v.tires.lifeKm / v.tires.warrantyKm!)));
    expect(treadCredit(v, 'Another Brand')).toBe(0);
    const before = balance(sim);
    const r = sim.must<{ paid: number; credit?: number }>({ kind: 'vehicle.replace_tires', payload: { vehicleId: v.id, offerId: rated.offer.id } });
    expect(r.credit).toBe(credit);
    expect(before - balance(sim)).toBe(rated.price - credit);
  });

  it('a set whose warranty is longer lasts longer', () => {
    const long = TIRE_PRODUCTS.find((p) => typeof p.attrs.warrantyKm === 'number' && p.attrs.warrantyKm > TIRE_LIFE_KM);
    expect(long).toBeDefined();
    const odo = { ageAtPurchase: 0, jurisdiction: 'US-NY' as const, km: TIRE_LIFE_KM + 10, tiresAtKm: 0 };
    expect(tiresWorn(odo)).toBe(true);
    expect(tiresWorn({ ...odo, tires: { product: long!.id, lifeKm: lifeOfTire(long!) } })).toBe(false);
  });

  it('fits a winter set by model in America and Canada, lasting its own km', () => {
    const { sim, v } = bought('ca-on-toronto', 'ca-toyota-corolla', 'tirecat-winter');
    const shop = tireCatalog(sim, v, true);
    if (shop.length === 0) return;
    const pick = shop[0]!;
    const r = sim.must<{ paid: number }>({ kind: 'vehicle.winter_tires', payload: { vehicleId: v.id, offerId: pick.offer.id } });
    expect(r.paid).toBe(pick.price);
    expect(v.winterTires).toMatchObject({ product: pick.product.id, wearKm: lifeOfTire(pick.product) });
    expect(lifeOfTire(pick.product)).toBe(typeof pick.product.attrs.warrantyKm === 'number' ? pick.product.attrs.warrantyKm : WINTER_TIRES.wearKm);
  });
});
