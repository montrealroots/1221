/**
 * A vehicle's tank, or an electric car's battery (`systems/fueltank.ts`, from
 * 2026-10-02): its maker's capacity, burned at its official economy by every
 * kilometer, filled at a station at the pump price or charged publicly or at
 * home, an errand refused that can't reach its stop, the month's driving
 * filling up at a quarter, and the level kept through a save.
 */
import { describe, expect, it } from 'vitest';
import { loadSave, quickSave } from '@/engine';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, instantFromZoned } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { FUEL } from '@/engine/content/vehiclefees';
import { CHARGING } from '@/engine/content/evcatalog';
import { documentsOf } from '@/engine/systems/documents';
import { modelById, monthKm, vehiclesOf } from '@/engine/systems/vehicles';
import { FILL, PUBLIC_KW, burnOf, capacityOf, chargeMinutes, everydayFuel, levelOf, planFill, rangeKm } from '@/engine/systems/fueltank';
import { leg } from '@/engine/systems/trips';
import { tintFuelFactor } from '@/engine/systems/tint';

const life = (seed: string) => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);
const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
function withCar(sim: Simulation, modelId = 'us-toyota-camry') {
  documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer: 'us-ny', name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 3650 * MS_DAY, expiresAt: sim.now + 3650 * MS_DAY });
  const r = sim.execute<{ vehicleId: string }>({ kind: 'vehicle.buy', payload: { modelId, fillUp: 'auto' } });
  expect(r.ok, r.error).toBe(true);
  return vehiclesOf(sim.player).find((v) => v.id === r.value!.vehicleId)!;
}
const noon = (sim: Simulation) => { sim.advanceTo(instantFromZoned({ year: 2026, month: 1, day: 13, hour: 11, minute: 0 }, 'America/New_York')); };

describe('the tank', () => {
  it('holds its maker’s liters, burns its economy, and says how far it goes', () => {
    const sim = life('tank-cap');
    const v = withCar(sim);
    const m = modelById(v.modelId)!;
    const cap = capacityOf(m)!;
    expect(cap.unit).toBe('L');
    expect(cap.estimated).toBe(false);
    expect(levelOf(v)).toBe(1);
    expect(rangeKm(v)).toBeCloseTo((cap.size * 100) / m.per100km!, 6);
    expect(burnOf(m, 100)).toBeCloseTo(m.per100km!, 9);
  });

  it('fills at a station to full at the pump price, and won’t when full', () => {
    const sim = life('tank-fill');
    const v = withCar(sim);
    noon(sim);
    const cap = capacityOf(modelById(v.modelId)!)!;
    v.fuelLevel = 0.4;
    expect(sim.execute({ kind: 'vehicle.refuel', payload: { vehicleId: v.id, home: true } }).error).toBe('Only a battery charges at home.');
    const q = planFill(sim, v, { by: 'full' });
    if (typeof q === 'string') throw new Error(q);
    expect(q.amount).toBeCloseTo(0.6 * cap.size, 9);
    expect(q.cost).toBe(inSave(sim, Math.round(0.6 * cap.size * FUEL['US-NY'].petrol), 'USD'));
    const r = sim.execute<{ paid: number }>({ kind: 'vehicle.refuel', payload: { vehicleId: v.id } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.paid).toBe(q.cost);
    expect(levelOf(v)).toBe(1);
    expect(sim.universe.transactions.at(-1)!.memo).toMatch(/^Fuel at BP, 255 E 125th St/);
    expect(sim.execute({ kind: 'vehicle.refuel', payload: { vehicleId: v.id } }).error).toBe('The tank is full.');
  });

  it('runs an errand from the tank, refuses a leg it can’t make, and a fuel stop fills it', () => {
    const sim = life('tank-errand');
    const v = withCar(sim);
    noon(sim);
    const m = modelById(v.modelId)!;
    const cap = capacityOf(m)!;
    const l = leg('us-ny-newyork', 'car', 'errand');
    const before = levelOf(v);
    const cash = sim.universe.transactions.length;
    expect(sim.execute({ kind: 'errand.go', payload: { to: 'errand', by: 'car', vehicleId: v.id } }).ok).toBe(true);
    expect(levelOf(v)).toBeCloseTo(before - burnOf(m, l.km, v)! / cap.size, 9);
    // Nothing paid for the leg's fuel: it was in the tank.
    expect(sim.universe.transactions.slice(cash).some((t) => /^Fuel/.test(t.memo))).toBe(false);
    // Too little for the next leg: refused, and nothing burned.
    v.fuelLevel = burnOf(m, l.km / 2, v)! / cap.size;
    const low = levelOf(v);
    expect(sim.execute({ kind: 'errand.go', payload: { to: 'errand' } }).error).toMatch(/There isn’t enough in the tank/);
    expect(levelOf(v)).toBe(low);
    // A stop for fuel fills it, and the trip goes on.
    expect(sim.execute({ kind: 'errand.fuel', payload: {} }).ok).toBe(true);
    expect(levelOf(v)).toBe(1);
    expect(sim.execute({ kind: 'errand.go', payload: { to: 'home' } }).ok).toBe(true);
    expect(sim.player.trip).toBeUndefined();
  });

  it('fills up through the month’s driving at a quarter, and pays for what it bought', () => {
    const sim = life('tank-month');
    const v = withCar(sim);
    const m = modelById(v.modelId)!;
    const cap = capacityOf(m)!;
    const burned = burnOf(m, monthKm(v), v)!;
    const trial = { ...v, fuelLevel: 0.5 };
    const month = everydayFuel(sim, trial, monthKm(v))!;
    // Down to a quarter, then full each time, until the month's liters are burned.
    expect(month.bought).toBeCloseTo(burned - (0.5 - trial.fuelLevel!) * cap.size, 6);
    expect(month.fills).toBe(Math.ceil((burned - 0.25 * cap.size) / (0.75 * cap.size)));
    expect(trial.fuelLevel!).toBeGreaterThanOrEqual(FILL.petrolAt - 1e-9);
    expect(month.cost).toBe(inSave(sim, Math.round(month.bought * FUEL['US-NY'].petrol), 'USD'));
  });

  it('leaves the month’s driving in the tank, burns less tinted, and isn’t filled from another town', () => {
    const sim = life('tank-lived');
    const v = withCar(sim);
    const m = modelById(v.modelId)!;
    const expected = { ...v, fuelLevel: 1 };
    everydayFuel(sim, expected, monthKm(v));
    sim.advanceBy(31 * MS_DAY);
    expect(levelOf(v)).toBeCloseTo(expected.fuelLevel!, 9);
    expect(levelOf(v)).toBeLessThan(1);
    // Tint keeps the cabin cool, and the air conditioning burns less (`systems/tint.ts`).
    expect(burnOf(m, 100, { ...v, tint: { kind: 'full' } } as never)!).toBeCloseTo(m.per100km! * tintFuelFactor({ tint: { kind: 'full' } } as never), 9);
    expect(tintFuelFactor({ tint: { kind: 'full' } } as never)).toBeLessThan(1);
    v.fuelLevel = 0.5;
    sim.player.currentLocationId = 'us-ct-newhaven';
    expect(sim.execute({ kind: 'vehicle.refuel', payload: { vehicleId: v.id } }).error).toMatch(/^It’s in /);
  });

  it('keeps its level through a save', () => {
    const sim = life('tank-save');
    const v = withCar(sim);
    v.fuelLevel = 0.37;
    const back = loadSave(deserialise(serialise(sim.universe)));
    expect(levelOf(vehiclesOf(back.player).find((x) => x.id === v.id)!)).toBe(0.37);
  });
});

describe('the battery', () => {
  it('charges publicly to full at the public price over the time a 50 kW charger takes, slower past 80% by its curve', () => {
    const sim = life('ev-charge');
    const v = withCar(sim, 'us-tesla-model-y');
    noon(sim);
    const cap = capacityOf(modelById(v.modelId)!)!;
    expect(cap.unit).toBe('kWh');
    v.fuelLevel = 0.3;
    const start = sim.now;
    const r = sim.execute<{ paid: number; amount: number }>({ kind: 'vehicle.refuel', payload: { vehicleId: v.id } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.amount).toBeCloseTo(0.7 * cap.size, 9);
    expect(r.value!.paid).toBe(inSave(sim, Math.round(0.7 * cap.size * CHARGING['US-NY'].public), 'USD'));
    const minutes = chargeMinutes(modelById(v.modelId)!, cap.size, 0.3, 1, PUBLIC_KW);
    expect(sim.now - start).toBe(minutes * 60_000);
    // Past 80% the Model Y takes less than 50 kW, so the last fifth is slower than 50 kW would be.
    expect(minutes).toBeGreaterThan(Math.round(((0.7 * cap.size) / PUBLIC_KW) * 60));
    expect(levelOf(v)).toBe(1);
  });

  it('isn’t charged at home without a charger there', () => {
    const sim = life('ev-home');
    const v = withCar(sim, 'us-tesla-model-y');
    v.fuelLevel = 0.3;
    expect(sim.execute({ kind: 'vehicle.refuel', payload: { vehicleId: v.id, home: true } }).error).toBe('There’s no charger where you live.');
    // With one, to the 80% for every day, at the home price, and none of the player's time.
    const q = planFill(sim, v, { by: 'level', value: FILL.batteryTo }, { home: true });
    if (typeof q === 'string') throw new Error(q);
    expect(q.cost).toBe(inSave(sim, Math.round(0.5 * capacityOf(modelById(v.modelId)!)!.size * CHARGING['US-NY'].home), 'USD'));
  });
});
