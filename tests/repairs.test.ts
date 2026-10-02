/**
 * A car that breaks, and the shop that mends it (`systems/repairs.ts`,
 * `content/carshops.ts`, from 2026-10-01): RepairPal's rates, CarMD's
 * repair, the upkeep they come out of, a severe fault that stops the car,
 * a lit light that fails a computer-read inspection, and a garage's make,
 * hours and time.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, instantFromZoned } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { UPKEEP_USD_PER_KM } from '@/engine/content/vehiclefees';
import { modelById, valueOf, vehiclesOf, type OwnedVehicle } from '@/engine/systems/vehicles';
import { expectedRepairsUsd, laidUp, mayBreak, readyAt, reliabilityOf, repairRefusal, shopById, shopsFor, upkeepPerKm } from '@/engine/systems/repairs';
import { inspectIfDue, inspectionFails } from '@/engine/systems/inspections';
import { planDrive } from '@/engine/systems/journey';
import { documentsOf } from '@/engine/systems/documents';

const NY = 'America/New_York';
const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const buy = (sim: Simulation, modelId: string) => { const r = sim.execute<{ vehicleId: string }>({ kind: 'vehicle.buy', payload: { modelId } }); expect(r.ok, r.error).toBe(true); return vehiclesOf(sim.player).find((v) => v.id === r.value!.vehicleId)!; };
const usd = (sim: Simulation, c: number) => { const cur = saveCurrency(sim.universe); return cur === 'USD' ? c : exchange(c, 'USD', cur)!; };
const at = (d: number, h: number) => instantFromZoned({ year: 2026, month: 1, day: d, hour: h, minute: 0 }, NY);

describe('what breaks', () => {
  it('is the model’s rating, the make’s, or the average, and nothing RepairPal doesn’t rate', () => {
    expect(reliabilityOf(modelById('us-toyota-camry')!)).toEqual({ visits: 0.28, severe: 0.11, annualUsd: 388 });
    // Chevrolet's Equinox isn't rated alone: Chevrolet's.
    expect(reliabilityOf(modelById('us-chevrolet-equinox')!)).toEqual({ visits: 0.3, severe: 0.15, annualUsd: 649 });
    expect(reliabilityOf(modelById('us-gmc-sierra')!)).toEqual({ visits: 0.4, severe: 0.12, annualUsd: 652 });
    expect(reliabilityOf(modelById('us-tesla-model-y')!)).toBeUndefined();
  });

  it('comes out of AAA’s upkeep, so a repair isn’t paid twice', () => {
    const camry = modelById('us-toyota-camry')!;
    const expected = 0.28 * (0.89 * 554.01 + 0.11 * 3 * 388);
    expect(expectedRepairsUsd(reliabilityOf(camry)!)).toBeCloseTo(expected, 9);
    expect(upkeepPerKm(camry, 'US-NY')).toBeLessThan(UPKEEP_USD_PER_KM);
    expect(upkeepPerKm(modelById('us-tesla-model-y')!, 'US-NY')).toBe(UPKEEP_USD_PER_KM);
  });
});

describe('a fault', () => {
  it('is drawn in a month driven; a severe one stops the car, and either is worth its repair less', () => {
    const sim = life('us-ny-newyork', 'rp-fault');
    const v = buy(sim, 'us-toyota-camry');
    const m = modelById(v.modelId)!;
    const worth = valueOf(v, sim.now);
    expect(mayBreak(sim, sim.player, v, m, sim.now, 1)).toBe(true);
    expect(v.fault).toBeDefined();
    // Once broken it isn't drawn again until mended.
    expect(mayBreak(sim, sim.player, v, m, sim.now, 1)).toBe(false);
    v.fault = { at: sim.now, severe: true, usd: 3 * 388 };
    expect(valueOf(v, sim.now)).toBe(worth - 3 * 388 * 100);
    expect(laidUp(v, sim.now)).toMatch(/broken down/);
    expect(planDrive(sim, sim.player, v.id, 'us-ny-newyork', 'us-ny-albany', sim.now + 2 * MS_DAY, 2)).toMatch(/broken down/);
    // An ordinary one goes.
    v.fault = { at: sim.now, severe: false, usd: 554.01 };
    expect(laidUp(v, sim.now)).toBeUndefined();
  });

  it('isn’t drawn at all when the odds say no', () => {
    const sim = life('us-ny-newyork', 'rp-none');
    const v = buy(sim, 'us-toyota-camry');
    expect(mayBreak(sim, sim.player, v, modelById(v.modelId)!, sim.now, 0)).toBe(false);
    expect(v.fault).toBeUndefined();
  });

  it('fails New York’s inspection for its lit light, and is mended there; Britain’s MOT draws as before', () => {
    const sim = life('us-ny-newyork', 'rp-insp');
    const v = buy(sim, 'us-toyota-camry');
    v.fault = { at: sim.now, severe: false, usd: 554.01 };
    expect(inspectionFails(sim, v, sim.now)).toEqual({ repair: 554.01, repairCurrency: 'USD', retest: 0, light: true });
    // A year on the inspection comes due, and the light is mended with it.
    v.boughtAt = sim.now - 400 * MS_DAY;
    expect(inspectIfDue(sim, sim.player, v)).toBe(true);
    expect(v.fault).toBeUndefined();
    const gb = { ...v, jurisdiction: 'GB', cityId: 'uk-eng-london', fault: { at: 0, severe: false, usd: 554.01 } } as OwnedVehicle;
    expect(inspectionFails(sim, gb, sim.now)?.light).toBeUndefined();
  });
});

describe('the shop', () => {
  it('mends only its own make, while it’s open, with the car and you in town', () => {
    const sim = life('us-ny-newyork', 'rp-shop');
    const v = buy(sim, 'us-chevrolet-equinox');
    const m = modelById(v.modelId)!;
    expect(shopsFor('us-ny-newyork', m).map((s) => s.id)).not.toContain('toyota-of-manhattan');
    expect(repairRefusal(sim.player, v, m, 'midas-w53', sim.now)).toBe('It has nothing to repair.');
    v.fault = { at: sim.now, severe: false, usd: 554.01 };
    expect(repairRefusal(sim.player, v, m, 'toyota-of-manhattan', at(12, 10))).toBe('Toyota of Manhattan works only on a Toyota.');
    const camry = { ...v, modelId: 'us-toyota-camry' };
    // 2026-01-11 was a Sunday, when it's shut; Monday at ten it's open.
    expect(repairRefusal(sim.player, camry, modelById('us-toyota-camry')!, 'toyota-of-manhattan', at(11, 10))).toBe('Toyota of Manhattan is closed today.');
    expect(repairRefusal(sim.player, camry, modelById('us-toyota-camry')!, 'toyota-of-manhattan', at(12, 10))).toBeUndefined();
    expect(repairRefusal(sim.player, camry, modelById('us-toyota-camry')!, 'toyota-of-manhattan', at(12, 6))).toBe('Toyota of Manhattan opens at 07:00.');
    expect(repairRefusal(sim.player, v, m, 'a1-toyota', sim.now)).toBe('The car is in New York.');
    sim.player.currentLocationId = 'us-ct-newhaven';
    expect(repairRefusal(sim.player, v, m, 'midas-w53', sim.now)).toBe('You’re not in New York.');
  });

  it('has it back by closing, or three days after a severe fault, and it goes nowhere meanwhile', () => {
    const shop = shopById('toyota-of-manhattan')!;
    expect(readyAt(shop, false, at(12, 10))).toBe(at(12, 18));
    expect(readyAt(shop, true, at(12, 10))).toBe(at(12, 10) + 3 * MS_DAY);
    expect(readyAt(shopById('midas-w53')!, false, at(12, 10))).toBe(at(12, 18));
    const sim = life('us-ny-newyork', 'rp-book');
    const v = buy(sim, 'us-chevrolet-equinox');
    v.fault = { at: sim.now, severe: true, usd: 3 * 649 };
    const bank = () => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && !a.nominal).reduce((t, a) => t + a.balance, 0);
    const before = bank();
    const r = sim.execute<{ readyAt: number; paid: number }>({ kind: 'vehicle.repair', payload: { vehicleId: v.id, shopId: 'midas-w53' } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.paid).toBe(usd(sim, 3 * 649 * 100));
    expect(bank()).toBe(before - r.value!.paid);
    expect(v.fault).toBeUndefined();
    expect(v.inShop).toEqual({ shopId: 'midas-w53', until: sim.now + 3 * MS_DAY });
    expect(planDrive(sim, sim.player, v.id, 'us-ny-newyork', 'us-ny-albany', sim.now + MS_DAY, 2)).toMatch(/^It’s at Midas until/);
    expect(laidUp(v, sim.now + 3 * MS_DAY)).toBeUndefined();
  });
});

describe('a month', () => {
  it('doesn’t drive a car that’s broken down, and drives one that isn’t', () => {
    const month = (severe: boolean) => {
      const sim = life('us-ny-newyork', 'rp-month');
      documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer: 'us-ny', name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 3650 * MS_DAY, expiresAt: sim.now + 3650 * MS_DAY });
      const v = buy(sim, 'us-toyota-camry');
      if (severe) v.fault = { at: sim.now, severe: true, usd: 3 * 388 };
      sim.advanceBy(35 * MS_DAY);
      return v.km ?? 0;
    };
    expect(month(false)).toBeGreaterThan(0);
    expect(month(true)).toBe(0);
  });
});
