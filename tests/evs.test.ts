/**
 * Electric cars (`content/evcatalog.ts`, `systems/charging.ts`, from
 * 2026-09-30): what's given toward one at the sale by the place's rules, its
 * kWh at the public chargers or three-quarters at home with a charger, the
 * charger's price and grant, and Mexico City's exemption from the verificación.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { salesTaxRate } from '@/engine/content/tax';
import { UPKEEP_USD_PER_KM } from '@/engine/content/vehiclefees';
import { CHARGING, EV_MODELS, HOME_CHARGING_SHARE } from '@/engine/content/evcatalog';
import { documentsOf } from '@/engine/systems/documents';
import { ownBuilt, type HomeFacts } from '@/engine/systems/homes';
import { chargerQuote, chargingRewards, homeShareOf } from '@/engine/systems/charging';
import { yearOf } from '@/engine/systems/earnings';
import { modelById, monthKm, quote, runningCost, upkeepCost, vehiclesOf, type Quote } from '@/engine/systems/vehicles';
import { everydayFuel } from '@/engine/systems/fueltank';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
const model = (id: string) => EV_MODELS.find((m) => m.id === id)!;
const line = (q: Quote | string, label: string) => (q as Quote).lines.find((l) => l.label === label)?.amount;
const AT = Date.UTC(2026, 9, 1);

function house(city: string, seed: string, lot = 5_000): Simulation {
  const sim = life(city, seed);
  const facts: HomeFacts = { type: 'house', address: 'Test House', beds: 3, baths: 2, size: 1_200, ...(lot ? { lot } : {}), built: 2000, features: [], parts: {}, hoaUsd: 0 };
  const owned = ownBuilt(sim, sim.player, { cityId: city, facts, price: 600_000_00, closing: 0 });
  sim.player.home = { kind: 'owned', cityId: city, homeId: owned.id, since: sim.now };
  return sim;
}

describe('buying an electric car', () => {
  it('takes each place’s incentive off at the sale', () => {
    expect(line(quote(model('us-tesla-model-y'), 'us-ny-newyork', AT), 'Drive Clean Rebate')).toBe(-2_000_00);
    expect(line(quote(model('us-chevrolet-equinox-ev'), 'us-ct-newhaven', AT), 'CHEAPR Rebate')).toBe(-1_000_00);
    expect(line(quote(model('ca-tesla-model-y'), 'ca-on-toronto', AT), 'EVAP Incentive')).toBe(-5_000_00);
    expect(line(quote(model('ca-tesla-model-y'), 'ca-bc-vancouver', Date.UTC(2027, 5, 1)), 'EVAP Incentive')).toBe(-4_000_00);
    expect(line(quote(model('gb-ford-puma-gen-e'), 'uk-eng-london', AT), 'Electric Car Grant')).toBe(-3_750_00);
    expect(line(quote(model('gb-tesla-model-y'), 'uk-eng-london', AT), 'Electric Car Grant')).toBeUndefined();
    expect(line(quote(model('ie-tesla-model-y'), 'ie-lei-dublin', AT), 'VRT Relief')).toBe(-5_000_00);
    expect(line(quote(model('ie-tesla-model-y'), 'ie-lei-dublin', Date.UTC(2027, 1, 1)), 'VRT Relief')).toBeUndefined();
    // $500 over a $42,000 MSRP.
    expect(line(quote({ ...model('us-tesla-model-y'), price: 45_000_00 }, 'us-ny-newyork', AT), 'Drive Clean Rebate')).toBe(-500_00);
    // None on a used one.
    expect(line(quote(model('us-tesla-model-y'), 'us-ny-newyork', AT, { age: 2 }), 'Drive Clean Rebate')).toBeUndefined();
  });

  it('gives California’s MyFirstEV to a first electric car from a maker in it, and not a second', () => {
    const sim = life('us-ca-losangeles', 'ev-first');
    const y = model('us-tesla-model-y');
    expect(line(quote(y, 'us-ca-losangeles', AT, { person: sim.player }), 'MyFirstEV, A First Electric Car')).toBe(-3_500_00);
    expect(line(quote(model('us-chevrolet-equinox-ev'), 'us-ca-losangeles', AT, { person: sim.player }), 'MyFirstEV, A First Electric Car')).toBeUndefined();
    vehiclesOf(sim.player).push({ id: 'had', modelId: y.id, boughtAt: sim.now, ageAtPurchase: 0, listPrice: y.price, jurisdiction: 'US-CA', cityId: 'us-ca-losangeles', coverage: 'full', registrationDue: sim.now });
    expect(line(quote(y, 'us-ca-losangeles', AT, { person: sim.player }), 'MyFirstEV, A First Electric Car')).toBeUndefined();
  });
});

describe('charging rewards', () => {
  it('pays New York’s SmartCharge 10 cents a kWh charged at home, $35 a summer month and $25 at three months; Connecticut’s $100 and $10 a month', () => {
    const at = (m: number) => m;
    expect(chargingRewards(house('us-ny-newyork', 'rw-none'), house('us-ny-newyork', 'rw-none').player, 'US-NY', 100, 0, at(3))).toBe(0);
    const ny = house('us-ny-newyork', 'rw-ny');
    expect(ny.execute({ kind: 'home.charger', payload: {} }).ok).toBe(true);
    expect(chargingRewards(ny, ny.player, 'US-NY', 100, 0, 3)).toBe(inSave(ny, 10_00, 'USD'));
    expect(chargingRewards(ny, ny.player, 'US-NY', 100, 0, 7)).toBe(inSave(ny, 45_00, 'USD'));
    expect(chargingRewards(ny, ny.player, 'US-NY', 100, 2, 3)).toBe(inSave(ny, 35_00, 'USD'));
    const ct = house('us-ct-newhaven', 'rw-ct');
    yearOf(ct.player, new Date(ct.now).getUTCFullYear() - 1).acting = inSave(ct, 60_000_00, 'USD');
    expect(ct.execute({ kind: 'home.charger', payload: {} }).ok).toBe(true);
    expect(chargingRewards(ct, ct.player, 'US-CT', 100, 0, 3)).toBe(inSave(ct, 110_00, 'USD'));
    expect(chargingRewards(ct, ct.player, 'US-CT', 100, 1, 3)).toBe(inSave(ct, 10_00, 'USD'));
    // An income-qualified household took the rebate instead of the $100.
    const low = house('us-ct-newhaven', 'rw-ct-low');
    expect(low.execute({ kind: 'home.charger', payload: {} }).ok).toBe(true);
    expect(chargingRewards(low, low.player, 'US-CT', 100, 0, 3)).toBe(inSave(low, 10_00, 'USD'));
  });

  it('is paid in the car’s month', () => {
    const sim = house('us-ny-newyork', 'rw-month');
    documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer: 'us', name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 3650 * MS_DAY, expiresAt: sim.now + 3650 * MS_DAY });
    expect(sim.execute({ kind: 'home.charger', payload: {} }).ok).toBe(true);
    expect(sim.execute({ kind: 'vehicle.buy', payload: { modelId: 'us-tesla-model-y', fillUp: 'auto' } }).ok).toBe(true);
    sim.advanceBy(40 * MS_DAY);
    expect(sim.universe.transactions.some((t) => t.memo === 'Charging rewards, the month')).toBe(true);
  });
});

describe('charging it', () => {
  it('drives a month at home on the charger’s share', () => {
    const sim = house('us-ny-newyork', 'ev-month');
    documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer: 'us', name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 3650 * MS_DAY, expiresAt: sim.now + 3650 * MS_DAY });
    expect(sim.execute({ kind: 'home.charger', payload: {} }).ok).toBe(true);
    expect(sim.execute({ kind: 'vehicle.buy', payload: { modelId: 'us-tesla-model-y', fillUp: 'auto' } }).ok).toBe(true);
    sim.advanceBy(40 * MS_DAY);
    const v = vehiclesOf(sim.player)[0]!;
    const fuel = sim.universe.transactions.find((t) => t.memo === 'Fuel and upkeep, the Tesla Model Y')!;
    const paid = fuel.postings.filter((p) => p.amount > 0).reduce((a, p) => a + p.amount, 0);
    // What its charges came to through the month from a full battery (`systems/fueltank.ts`), and the month's upkeep.
    expect(paid).toBe(everydayFuel(sim, { ...v, fuelLevel: 1 }, monthKm(v), HOME_CHARGING_SHARE)!.cost + upkeepCost(sim, v, monthKm(v)));
  });


  it('buys its kWh at the public chargers, or three-quarters at home with a charger', () => {
    const sim = life('us-ny-newyork', 'ev-run');
    const y = model('us-tesla-model-y');
    const v = { id: 'v', modelId: y.id, boughtAt: sim.now, ageAtPurchase: 0, listPrice: y.price, jurisdiction: 'US-NY' as const, cityId: 'us-ny-newyork', coverage: 'full' as const, registrationDue: sim.now };
    const kwh = (1_000 * y.kwhPer100km!) / 100;
    const upkeep = inSave(sim, Math.round(1_000 * UPKEEP_USD_PER_KM), 'USD');
    expect(Math.abs(runningCost(sim, v, 1_000) - upkeep - inSave(sim, Math.round(kwh * CHARGING['US-NY'].public), 'USD'))).toBeLessThanOrEqual(2);
    const home = runningCost(sim, v, 1_000, HOME_CHARGING_SHARE);
    expect(Math.abs(home - upkeep - inSave(sim, Math.round(kwh * (0.75 * 33.83 + 0.25 * 57.8)), 'USD'))).toBeLessThanOrEqual(2);
    expect(home).toBeLessThan(runningCost(sim, v, 1_000));
  });

  it('fits a charger to a house one owns, at the place’s price less its grant, and not to a flat', () => {
    const la = house('us-ca-losangeles', 'ev-charger-la');
    const q = chargerQuote(la, la.player);
    if (typeof q === 'string') throw new Error(q);
    expect(q.cost).toBe(inSave(la, Math.round(585_00 * (1 + salesTaxRate('us-ca-losangeles', la.now, 'goods'))) + 1_700_00 - 1_000_00, 'USD'));
    expect(homeShareOf(la.player)).toBe(0);
    const r = la.execute({ kind: 'home.charger', payload: {} });
    expect(r.ok, r.error).toBe(true);
    expect(homeShareOf(la.player)).toBe(HOME_CHARGING_SHARE);
    expect(chargerQuote(la, la.player)).toMatch(/has one/);
    // LADWP's rebate is Los Angeles's only.
    const sf = house('us-ca-sanfrancisco', 'ev-charger-sf');
    expect((chargerQuote(sf, sf.player) as { grant: number }).grant).toBe(0);
    // BC's rebate is half, to $350.
    const bc = house('ca-bc-vancouver', 'ev-charger-bc');
    expect((chargerQuote(bc, bc.player) as { grant: number }).grant).toBe(inSave(bc, 350_00, 'CAD'));
    // Connecticut's is for income-qualified households only, to 300% of the poverty line: $1,500, and nothing above it.
    const ct = house('us-ct-newhaven', 'ev-charger-ct');
    expect((chargerQuote(ct, ct.player) as { grant: number }).grant).toBe(inSave(ct, 1_500_00, 'USD'));
    yearOf(ct.player, new Date(ct.now).getUTCFullYear() - 1).acting = inSave(ct, 50_000_00, 'USD');
    expect((chargerQuote(ct, ct.player) as { grant: number }).grant).toBe(0);
    expect(chargerQuote(house('us-ny-newyork', 'ev-charger-flat', 0), house('us-ny-newyork', 'ev-charger-flat', 0).player)).toMatch(/not a flat/);
    expect(chargerQuote(life('us-ny-newyork', 'ev-charger-renter'), life('us-ny-newyork', 'ev-charger-renter').player)).toMatch(/home you own/);
  });

  it('is driven at home for a month at the charged price, and skips Mexico City’s verificación', () => {
    const sim = life('mx-cmx-mexicocity', 'ev-mx');
    documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer: 'mx', name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 3650 * MS_DAY, expiresAt: sim.now + 3650 * MS_DAY });
    const r = sim.execute({ kind: 'vehicle.buy', payload: { modelId: 'mx-tesla-model-y', fillUp: 'auto' } });
    expect(r.ok, r.error).toBe(true);
    expect(modelById('mx-tesla-model-y')!.fuel).toBe('ev');
    sim.advanceBy(400 * MS_DAY);
    expect(sim.universe.transactions.some((t) => t.memo.startsWith('Fuel and upkeep, the Tesla Model Y'))).toBe(true);
    expect(sim.universe.transactions.some((t) => /verificación/i.test(t.memo))).toBe(false);
  });
});
