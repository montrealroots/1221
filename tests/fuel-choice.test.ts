/**
 * A fill chosen (`systems/fueltank.ts`, from 2026-10-03): full, a quantity,
 * a spending limit or a level, refused where it can't be; each fill kept on
 * the car; and filling up as the month goes a preference of the car's, a car
 * bought now filled only by you, its month run down, stopped where it runs
 * dry and said when it's low.
 */
import { describe, expect, it } from 'vitest';
import { loadSave, quickSave } from '@/engine';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { documentsOf } from '@/engine/systems/documents';
import { dayKm, modelById, monthKm, vehiclesOf } from '@/engine/systems/vehicles';
import { capacityOf, fillingOf, levelOf, planFill, rangeKm } from '@/engine/systems/fueltank';

const life = (seed: string) => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);
function withCar(sim: Simulation, modelId = 'us-toyota-camry', fillUp?: 'auto') {
  documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer: 'us-ny', name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 3650 * MS_DAY, expiresAt: sim.now + 3650 * MS_DAY });
  const r = sim.execute<{ vehicleId: string }>({ kind: 'vehicle.buy', payload: { modelId, ...(fillUp ? { fillUp } : {}) } });
  expect(r.ok, r.error).toBe(true);
  return vehiclesOf(sim.player).find((v) => v.id === r.value!.vehicleId)!;
}

describe('a fill chosen', () => {
  it('is planned as full, a quantity, a level or a limit, and refused where it can’t be', () => {
    const sim = life('fill-plan');
    const v = withCar(sim);
    const cap = capacityOf(modelById(v.modelId)!)!;
    v.fuelLevel = 0.5;
    const half = cap.size / 2;
    expect(planFill(sim, v, { by: 'quantity', value: half + 1 })).toBe(`It holds ${half.toFixed(1)} liters more.`);
    expect(planFill(sim, v, { by: 'level', value: 0.4 })).toBe('It’s at 50% already.');
    expect(planFill(sim, v, { by: 'level', value: 1.2 })).toBe('It can’t go past full.');
    expect(planFill(sim, v, { by: 'quantity', value: 0 })).toBe('Choose how many liters.');
    const full = planFill(sim, v, { by: 'full' });
    expect(typeof full === 'object' && full.amount).toBeCloseTo(half, 6);
    const ten = planFill(sim, v, { by: 'quantity', value: 10 });
    expect(typeof ten === 'object' && ten.to).toBeCloseTo(0.5 + 10 / cap.size, 9);
    // A limit stops at the money: it buys what the money buys, and never costs more.
    const limit = planFill(sim, v, { by: 'spend', value: 20_00 });
    expect(typeof limit === 'object' && limit.cost).toBeLessThanOrEqual(20_00);
    expect(typeof limit === 'object' && limit.amount).toBeGreaterThan(0);
    expect(typeof limit === 'object' && limit.amount).toBeLessThan(half);
    expect(planFill(sim, v, { by: 'spend', value: 1 })).toBe('That buys almost nothing.');
  });

  it('fills what was chosen, takes its minutes, and is kept on the car with its range', () => {
    const sim = life('fill-do');
    const v = withCar(sim);
    v.fuelLevel = 0.2;
    const before = sim.now;
    const r = sim.must<{ amount: number; paid: number; minutes: number; level: number; rangeKm: number }>({ kind: 'vehicle.refuel', payload: { vehicleId: v.id, station: 1, amount: { by: 'quantity', value: 15 } } });
    expect(r.amount).toBeCloseTo(15, 9);
    expect(levelOf(v)).toBeCloseTo(r.level, 12);
    expect(sim.now - before).toBe(r.minutes * 60_000);
    expect(v.fills?.[0]).toMatchObject({ where: 'Shell, 232 W 145th St', unit: 'L', cost: r.paid, basis: 'area', minutes: r.minutes });
    expect(v.fills?.[0]?.rangeKm).toBeCloseTo(rangeKm(v)!, 6);
    expect(sim.execute({ kind: 'vehicle.refuel', payload: { vehicleId: v.id, amount: { by: 'quantity', value: 999 } } }).error).toMatch(/^It holds/);
  });
  it('runs down a day at a time, so filling it when it’s low keeps it going all month', () => {
    const sim = life('fill-keep');
    const v = withCar(sim);
    const km = v.km ?? 0;
    let fills = 0;
    for (let d = 0; d < 62; d += 1) {
      sim.advanceBy(MS_DAY);
      // Left a few days below the mark before it's filled: low is said once each time.
      if (levelOf(v) < 0.12) { sim.must({ kind: 'vehicle.refuel', payload: { vehicleId: v.id, amount: { by: 'full' } } }); fills += 1; }
    }
    expect(fills).toBeGreaterThanOrEqual(2);
    expect(sim.universe.notifications.some((n) => n.title === 'Ran Dry')).toBe(false);
    expect(sim.universe.notifications.filter((n) => n.title === 'Running Low').length).toBe(fills);
    expect((v.km ?? 0) - km).toBeGreaterThan(monthKm(v) * 1.9);
    expect(v.fills?.length).toBe(fills);
  });
});

describe('filling as the month goes', () => {
  it('is yours alone in a car bought now: the month runs it down, and stops where it runs dry', () => {
    const sim = life('fill-self');
    const v = withCar(sim);
    expect(fillingOf(v)).toBe('self');
    const m = modelById(v.modelId)!;
    const cap = capacityOf(m)!;
    // Enough for a third of the month.
    const month = monthKm(v);
    v.fuelLevel = (month / 3) * (m.per100km! / 100) / cap.size;
    const km = v.km ?? 0;
    sim.advanceBy(31 * MS_DAY);
    expect(levelOf(v)).toBeCloseTo(0, 6);
    expect((v.km ?? 0) - km).toBeLessThan(month / 2);
    expect(sim.universe.notifications.some((n) => n.title === 'Ran Dry')).toBe(true);
    // Filled, it goes again, and run dry again it says so again.
    sim.must({ kind: 'vehicle.refuel', payload: { vehicleId: v.id, amount: { by: 'quantity', value: 5 } } });
    expect(v.dry).toBeUndefined();
    sim.advanceBy(3 * MS_DAY);
    expect(sim.universe.notifications.filter((n) => n.title === 'Ran Dry').length).toBe(2);
  });

  it('takes a day’s errands off that day’s everyday driving, so no kilometer is burned twice', () => {
    const sim = life('fill-errand');
    const v = withCar(sim);
    sim.must({ kind: 'errand.go', payload: { to: 'errand', by: 'car', vehicleId: v.id } });
    sim.must({ kind: 'errand.go', payload: { to: 'home' } });
    const errand = v.errandKm!;
    expect(errand).toBeGreaterThan(0);
    expect(errand).toBeLessThan(dayKm(v));
    sim.advanceBy(MS_DAY);
    expect(v.dayKm).toBeCloseTo(dayKm(v) - errand, 6);
    expect(v.errandUsed).toBeCloseTo(errand, 6);
  });

  it('says it’s running low, and fills nothing behind your back', () => {
    const sim = life('fill-low');
    const v = withCar(sim);
    sim.advanceBy(31 * MS_DAY);
    const after = levelOf(v);
    expect(after).toBeLessThan(1);
    expect(Object.values(sim.universe.transactions).some((t) => /^Fuel and upkeep/.test(t.memo))).toBe(false);
    expect(Object.values(sim.universe.transactions).some((t) => /^Upkeep, the /.test(t.memo))).toBe(true);
    if (after < 0.25) expect(sim.universe.notifications.some((n) => n.title === 'Running Low')).toBe(true);
  });

  it('is the driver’s at a quarter when set so, and the choice is kept across a save', () => {
    const sim = life('fill-auto');
    const v = withCar(sim);
    sim.must({ kind: 'vehicle.set_filling', payload: { vehicleId: v.id, auto: true } });
    v.fuelLevel = 0.3;
    sim.advanceBy(31 * MS_DAY);
    expect(levelOf(v)).toBeGreaterThan(0.25);
    sim.must({ kind: 'vehicle.refuel', payload: { vehicleId: v.id, amount: { by: 'full' } } });
    const back = loadSave(deserialise(serialise(sim.universe)) as never);
    const w = vehiclesOf(back.player).find((x) => x.id === v.id)!;
    expect(w.fillUp).toBe('auto');
    expect(w.fills?.length).toBe(1);
    expect(back.execute({ kind: 'vehicle.set_filling', payload: { vehicleId: 'nope', auto: true } }).error).toBe('That isn’t a vehicle you own.');
  });

  it('taken back from the month, it’s run down a day at a time again', () => {
    const sim = life('fill-back');
    const v = withCar(sim, 'us-toyota-camry', 'auto');
    sim.advanceBy(2 * MS_DAY);
    expect(v.dayKm).toBeUndefined();
    sim.must({ kind: 'vehicle.set_filling', payload: { vehicleId: v.id, auto: false } });
    sim.advanceBy(2 * MS_DAY);
    expect(v.dayKm).toBeCloseTo(2 * dayKm(v), 6);
  });
});
