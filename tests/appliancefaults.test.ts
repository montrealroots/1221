/**
 * A home machine that breaks (`systems/appliancefaults.ts`, from
 * 2026-10-02): the published yearly rates, what a broken washer, dishwasher
 * and fridge do, the landlord's repair, and one's own booked at the
 * market's price.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { inSaveMoney } from '@/engine/systems/banking';
import { FAULTS_A_YEAR, REPAIRS, faultsOf, machinesAt, machinesDay, repairBill, repairRefusal } from '@/engine/systems/appliancefaults';
import { homePlace, workingFixtures } from '@/engine/systems/dwelling';
import { homeKeyOf } from '@/engine/systems/items';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
/** Every machine broken at once, the day's odds overridden. */
const breakAll = (sim: Simulation) => machinesDay(sim, sim.player, 1);

describe('how often', () => {
  it('is Consumer Reports’ and Which?’s rates, a year', () => {
    expect(FAULTS_A_YEAR.washer).toBeCloseTo(1 - Math.pow(0.87, 0.25), 12);
    expect(FAULTS_A_YEAR.dishwasher).toBeCloseTo(1 - Math.pow(0.8, 1 / 6), 12);
    expect(FAULTS_A_YEAR.fridge).toBeCloseTo(1 - Math.pow(0.7, 0.2), 12);
    // From 2026-10-05: a dryer, the middle of 8% and 19% in five years; central air, 36% in eight.
    expect(FAULTS_A_YEAR.dryer).toBeCloseTo(1 - Math.pow(1 - 0.135, 0.2), 12);
    expect(FAULTS_A_YEAR.centralAir).toBeCloseTo(1 - Math.pow(0.64, 1 / 8), 12);
    // At the real odds, a year of days breaks a machine about as often as the rate says.
    const sim = life('us-ny-newyork', 'af-rate');
    let fridges = 0;
    for (let d = 0; d < 400; d += 1) {
      sim.player.applianceFaults = undefined;
      sim.universe.now += MS_DAY;
      if (machinesDay(sim, sim.player).includes('fridge')) fridges += 1;
    }
    expect(fridges).toBeLessThan(40);
  });
});

describe('a dryer or central air broken', () => {
  it('leaves the washing to dry on a line and the home uncooled, and is mended at the market’s price', () => {
    const sim = life('us-ny-newyork', 'af-dryer');
    const p = sim.player;
    const unit = p.home!.unit!;
    unit.fixtures = { ...unit.fixtures, laundry: 'in-unit', cooling: 'central' };
    expect(machinesAt(sim, p)).toEqual(expect.arrayContaining(['washer', 'dryer', 'centralAir']));
    p.applianceFaults = { dryer: { at: sim.now }, centralAir: { at: sim.now } };
    const place = homePlace(sim, p)!;
    expect(place.fixtures.laundry).toBe('washer-only');
    expect(place.fixtures.cooling).toBe('none');
    expect(repairBill(sim, p, 'dryer')).toBe(inSaveMoney(sim, REPAIRS.us!.items.dryer * 100, 'USD'));
    expect(repairBill(sim, p, 'centralAir')).toBe(inSaveMoney(sim, REPAIRS.us!.items.centralAir * 100, 'USD'));
    // A washer only, no dryer to break; room units, none either.
    unit.fixtures = { ...unit.fixtures, laundry: 'washer-only', cooling: 'units' };
    p.applianceFaults = undefined;
    expect(machinesAt(sim, p)).not.toContain('dryer');
    expect(machinesAt(sim, p)).not.toContain('centralAir');
  });
});

describe('a machine broken', () => {
  it('in a rented home is the landlord’s, mended the next morning', () => {
    const sim = life('us-ny-newyork', 'af-rent');
    expect(sim.player.home!.kind).not.toBe('owned');
    const broke = breakAll(sim);
    expect(broke).toEqual(machinesAt(sim, sim.player));
    expect(broke).toContain('fridge');
    const f = faultsOf(sim.player).fridge!;
    expect(f.landlord).toBe(true);
    expect(f.fixAt).toBeGreaterThan(sim.now);
    expect(repairRefusal(sim, sim.player, 'fridge')).toBe('The landlord is having it mended.');
    sim.universe.now = f.fixAt! + 1;
    machinesDay(sim, sim.player, 0);
    expect(sim.player.applianceFaults).toBeUndefined();
  });

  it('sends the washing to the laundromat and the dishes to the sink, and spoils the fridge', () => {
    const sim = life('us-ny-newyork', 'af-effects');
    const p = sim.player;
    p.portables = { washer: sim.now, dishwasher: sim.now };
    expect(workingFixtures(sim, p)!.dishwasher).toBe(true);
    const milk = { id: 'milk', kind: 'milk', label: 'Milk', quantity: 1, condition: 1, at: { kind: 'home' as const, home: homeKeyOf(p.home)!, spot: 'fridge' as const }, acquiredAt: sim.now, food: { key: 'milk', unit: 'ml' as const, left: 1000, expiresAt: sim.now + 7 * MS_DAY } };
    p.items = [...(p.items ?? []), milk as never];
    breakAll(sim);
    const place = homePlace(sim, p)!;
    expect(place.fixtures.dishwasher).toBe(false);
    expect(place.fixtures.laundry).toBe('none');
    expect(milk.food.expiresAt).toBe(sim.now);
    // A tenant's own portable is theirs to mend.
    expect(faultsOf(p).washer!.landlord).toBeUndefined();
    expect(repairRefusal(sim, p, 'washer')).toBeUndefined();
  });

  it('of one’s own is booked at the market’s price, and mended the next morning', () => {
    const sim = life('uk-eng-london', 'af-own');
    const p = sim.player;
    p.portables = { washer: sim.now };
    breakAll(sim);
    const bill = repairBill(sim, p, 'washer')!;
    expect(bill).toBe(inSaveMoney(sim, Math.round((REPAIRS.uk!.callout + REPAIRS.uk!.items.washer) * 100), 'GBP'));
    const r = sim.execute<{ paid: number; fixAt: number }>({ kind: 'home.repair_machine', payload: { machine: 'washer' } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.paid).toBe(bill);
    expect(repairRefusal(sim, p, 'washer')).toBe('The technician is booked.');
    // Broken already, it isn't broken again over the booking.
    machinesDay(sim, p, 1);
    expect(faultsOf(p).washer!.fixAt).toBe(r.value!.fixAt);
    expect(sim.execute({ kind: 'home.repair_machine', payload: { machine: 'dishwasher' } }).error).toBe('The dishwasher isn’t broken.');
    sim.universe.now = r.value!.fixAt;
    machinesDay(sim, p, 0);
    expect(faultsOf(p).washer).toBeUndefined();
  });
});
