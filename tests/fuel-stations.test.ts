/**
 * Where a car is filled (`systems/fueltank.ts`, `content/fuelcharging.ts`,
 * from 2026-10-03): a station's own grades and its posted price where one is
 * published, the area's average told apart where not; a grade the car can't
 * take, or a station doesn't sell, refused; named chargers by their
 * connectors, who may use them, their own or their network's price or an
 * hourly rate; and a charge slowing past 80% by the car's measured curve.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { AREA_GRADES } from '@/engine/content/fuelcharging';
import { documentsOf } from '@/engine/systems/documents';
import { modelById, vehiclesOf } from '@/engine/systems/vehicles';
import { capacityOf, chargeMinutes, planFill, priceAt } from '@/engine/systems/fueltank';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
function withCar(sim: Simulation, modelId: string, issuer: string) {
  documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer, name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 3650 * MS_DAY, expiresAt: sim.now + 3650 * MS_DAY });
  const r = sim.execute<{ vehicleId: string }>({ kind: 'vehicle.buy', payload: { modelId } });
  expect(r.ok, r.error).toBe(true);
  return vehiclesOf(sim.player).find((v) => v.id === r.value!.vehicleId)!;
}

describe('a station', () => {
  it('sells at its own posted price where one is published, and says so', () => {
    const sim = life('uk-eng-london', 'st-ldn');
    const v = withCar(sim, 'gb-ford-puma', 'uk');
    v.fuelLevel = 0.5;
    const cap = capacityOf(modelById(v.modelId)!)!;
    // Before the day it was posted, that day's price wasn't read, and the area's average stands.
    expect(priceAt(v, { station: 0, grade: 'regular' }, sim.now)).toMatchObject({ basis: 'area' });
    sim.advanceTo(Date.UTC(2026, 9, 5, 9));
    v.fuelLevel = 0.5;
    const p = priceAt(v, { station: 0, grade: 'regular' }, sim.now);
    expect(p).toMatchObject({ minor: 185.9, currency: 'GBP', basis: 'station' });
    expect(typeof p === 'object' && p.why).toMatch(/Esso, 77-83 Park Lane’s own price, posted October 4, 2026/);
    const r = sim.must<{ paid: number }>({ kind: 'vehicle.refuel', payload: { vehicleId: v.id, station: 0, grade: 'premium' } });
    expect(r.paid).toBe(inSave(sim, Math.round(0.5 * cap.size * 195.9), 'GBP'));
    expect(v.fills?.[0]).toMatchObject({ basis: 'station', grade: 'premium' });
  });

  it('sells at the area’s average where it posts none, a grade the area doesn’t publish refused', () => {
    const sim = life('us-ny-newyork', 'st-ny');
    const v = withCar(sim, 'us-toyota-camry', 'us-ny');
    expect(priceAt(v, { station: 0, grade: 'premium' }, sim.now)).toMatchObject({ minor: AREA_GRADES['US-NY']!.premium!.minor, basis: 'area' });
    expect(priceAt(v, { station: 0, grade: 'diesel' }, sim.now)).toBe('A petrol car can’t take diesel.');
    const dublin = life('ie-lei-dublin', 'st-ie');
    const w = withCar(dublin, 'ie-hyundai-tucson', 'ie');
    expect(priceAt(w, { station: 0, grade: 'regular' }, dublin.now)).toBe('A diesel takes diesel.');
    expect(priceAt(w, { station: 0, grade: 'premium-diesel' }, dublin.now)).toBe('Maxol, 134 Richmond Road doesn’t sell premium diesel.');
    expect(priceAt(w, { station: 0, grade: 'diesel' }, dublin.now)).toMatchObject({ basis: 'area' });
  });
});

describe('a charger', () => {
  it('fits by its connectors, and a Teslas-only site refuses other makes', () => {
    const ny = life('us-ny-newyork', 'ch-ny');
    const chevy = withCar(ny, 'us-chevrolet-equinox-ev', 'us-ny');
    expect(priceAt(chevy, { chargerId: 'us-ny-newyork-0' }, ny.now)).toBe('It has NACS; your car takes CCS1.');
    expect(priceAt(chevy, { chargerId: 'us-ny-newyork-3' }, ny.now)).toMatchObject({ minor: 67.3, basis: 'network', kw: 200 });
    expect(priceAt(chevy, { chargerId: 'us-ny-newyork-1' }, ny.now)).toMatchObject({ minor: 61, basis: 'site', kw: 320 });
    const ldn = life('uk-eng-london', 'ch-ldn');
    const puma = withCar(ldn, 'gb-ford-puma-gen-e', 'uk');
    expect(priceAt(puma, { chargerId: 'uk-eng-london-1' }, ldn.now)).toBe('It’s for Teslas only.');
    const mx = life('mx-cmx-mexicocity', 'ch-mx');
    const y = withCar(mx, 'mx-tesla-model-y', 'mx');
    expect(priceAt(y, { chargerId: 'mx-cmx-mexicocity-3' }, mx.now)).toBe('Its connectors aren’t published.');
  });

  it('by the hour, costs its minutes: Green P’s fast charger in Toronto', () => {
    const sim = life('ca-on-toronto', 'ch-to');
    const v = withCar(sim, 'ca-chevrolet-equinox-ev', 'ca-on');
    v.fuelLevel = 0.2;
    const q = planFill(sim, v, { by: 'level', value: 0.8 }, { chargerId: 'ca-on-toronto-1' });
    if (typeof q === 'string') throw new Error(q);
    expect(q.price.perHour).toBe(2000);
    expect(q.cost).toBe(inSave(sim, Math.round((q.minutes / 60) * 2000), 'CAD'));
    // A limit buys as far as its minutes' money goes.
    const capped = planFill(sim, v, { by: 'spend', value: Math.round(q.cost / 2) }, { chargerId: 'ca-on-toronto-1' });
    if (typeof capped === 'string') throw new Error(capped);
    expect(capped.cost).toBeLessThanOrEqual(Math.round(q.cost / 2));
    expect(capped.to).toBeLessThan(0.8);
    expect(capped.to).toBeGreaterThan(0.3);
  });

  it('charges at the slower of the charger and the car, past 80% by the car’s measured curve', () => {
    const m = modelById('us-tesla-model-y')!;
    const size = capacityOf(m)!.size;
    // EVKX's test: 10% to 80% in a little over half an hour on a charger that isn't the limit.
    const fast = chargeMinutes(m, size, 0.1, 0.8, 320);
    expect(fast).toBeGreaterThanOrEqual(25);
    expect(fast).toBeLessThanOrEqual(35);
    // On a 50 kW charger it's the charger that's slow; and 80% to 100% is slower than the same at the start.
    expect(chargeMinutes(m, size, 0.1, 0.8, 50)).toBeGreaterThan(fast);
    expect(chargeMinutes(m, size, 0.8, 1, 320)).toBeGreaterThan(chargeMinutes(m, size, 0.1, 0.3, 320));
  });

  it('left plugged in past its grace, charges an idle fee: Electrify America’s 40 cents a minute after ten, a Supercharger’s 50 after five', () => {
    const la = life('us-ca-losangeles', 'ch-idle');
    const chevy = withCar(la, 'us-chevrolet-equinox-ev', 'us-ca');
    chevy.fuelLevel = 0.5;
    const start = la.now;
    const a = la.must<{ idle: number; minutes: number }>({ kind: 'vehicle.refuel', payload: { vehicleId: chevy.id, chargerId: 'us-ca-losangeles-2', amount: { by: 'level', value: 0.6 }, leaveMinutes: 10 } });
    expect(a.idle).toBe(0);
    chevy.fuelLevel = 0.5;
    const b = la.must<{ idle: number; minutes: number }>({ kind: 'vehicle.refuel', payload: { vehicleId: chevy.id, chargerId: 'us-ca-losangeles-2', amount: { by: 'level', value: 0.6 }, leaveMinutes: 25 } });
    expect(b.idle).toBe(inSave(la, 15 * 40, 'USD'));
    // The time left plugged in passes too.
    expect(la.now - start).toBeGreaterThanOrEqual((a.minutes + 10 + b.minutes + 25) * 60_000);
    const y = withCar(la, 'us-tesla-model-y', 'us-ca');
    y.fuelLevel = 0.5;
    expect(la.must<{ idle: number }>({ kind: 'vehicle.refuel', payload: { vehicleId: y.id, chargerId: 'us-ca-losangeles-1', amount: { by: 'level', value: 0.6 }, leaveMinutes: 15 } }).idle).toBe(inSave(la, 10 * 50, 'USD'));
    // Charged at no named charger, there's nothing to idle at.
    y.fuelLevel = 0.5;
    expect(la.must<{ idle: number }>({ kind: 'vehicle.refuel', payload: { vehicleId: y.id, amount: { by: 'level', value: 0.6 }, leaveMinutes: 60 } }).idle).toBe(0);
  });
});

describe('a spending limit', () => {
  it('is held to the cent when the pump’s money isn’t the save’s', () => {
    const sim = life('us-ny-newyork', 'st-limit');
    const v = withCar(sim, 'us-toyota-camry', 'us-ny');
    // Driven to London: its pumps are in pounds, the save in dollars.
    v.at = 'uk-eng-london';
    sim.player.currentLocationId = 'uk-eng-london';
    v.fuelLevel = 0.1;
    let over = 0;
    for (let limit = 10_00; limit < 13_00; limit += 1) {
      const q = planFill(sim, v, { by: 'spend', value: limit }, { station: 1, grade: 'regular' });
      if (typeof q === 'string') throw new Error(q);
      if (q.cost > limit) over += 1;
    }
    expect(over).toBe(0);
  });
});
