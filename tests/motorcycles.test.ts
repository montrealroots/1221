/**
 * Motorcycles and scooters (`content/bikecatalog.ts`, `bikeLines` and the
 * kinds in `systems/vehicles.ts`, the motorcycle track in
 * `systems/licensing.ts`, from 2026-09-30): each place's taxes, registration
 * and insurance by engine size, the motorcycle class they're ridden on, and a
 * rider's injury risk against a driver's.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { BIKE_UNRATED_PER100, runningCost, kindOf, modelById, modelsFor, monthlyInsurance, quote, renewal, buyRefusal, vehiclesOf, type OwnedVehicle, type Quote } from '@/engine/systems/vehicles';
import { documentsOf, mayDrive, type PersonDocument } from '@/engine/systems/documents';
import { pathHere, stepRefusal } from '@/engine/systems/licensing';
import { crashChance , RIDER_DEATH, drive, riderDeath, riderDeathPerKm } from '@/engine/systems/driving';
import { inspectIfDue } from '@/engine/systems/inspections';
import { FUEL, UPKEEP_USD_PER_KM } from '@/engine/content/vehiclefees';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { parkingYear } from '@/engine/systems/vehicles';
import type { Person } from '@/engine/domain/model';

const at = Date.UTC(2026, 9, 1);
const q = (id: string, city: string) => quote(modelById(id)!, city, at) as Quote;
const line = (x: Quote, re: RegExp) => x.lines.find((l) => re.test(l.label))?.amount;
const held = (id: string, j: string) => ({ id: 'owned', modelId: id, jurisdiction: j, cityId: '', boughtAt: at, ageAtPurchase: 0, listPrice: modelById(id)!.price, coverage: 'full', registrationDue: 0 }) as OwnedVehicle;
const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const license = (issuer: string, cls?: 'motorcycle'): PersonDocument => ({ id: `doc-${issuer}-${cls ?? 'car'}`, kind: 'license', issuer, name: cls ? 'Class M' : 'Class D', number: 'X', status: 'valid', issuedAt: at - 365 * MS_DAY, expiresAt: at + 3 * 365 * MS_DAY, ...(cls ? { vehicleClass: cls } : {}) });

describe('the catalog', () => {
  it('sells motorcycles and scooters apart from cars, in each market', () => {
    for (const city of ['us-ny-newyork', 'uk-eng-london', 'ie-lei-dublin', 'ca-on-toronto', 'mx-cmx-mexicocity']) {
      expect(modelsFor(city, 'motorcycle').length).toBeGreaterThan(0);
      expect(modelsFor(city, 'scooter').length).toBeGreaterThan(0);
      expect(modelsFor(city).every((m) => kindOf(m) === 'car')).toBe(true);
    }
  });
});

describe('what one costs', () => {
  it('taxes a Ninja 500 in New York City at the sticker, not below it, with the dealer’s fee, the $50 title and $17.50 a year', () => {
    const x = q('us-kawasaki-ninja-500', 'us-ny-newyork');
    expect(line(x, /Below The Sticker/)).toBeUndefined();
    expect(line(x, /Sales Tax/)).toBe(Math.round(x.price * 0.08875));
    expect(line(x, /Documentation/)).toBe(175_00);
    expect(line(x, /Title/)).toBe(50_00);
    expect(line(x, /Registration/)).toBe(17_50);
  });

  it('takes a trade-in off the price New York taxes, as a car’s', () => {
    const plain = q('us-kawasaki-ninja-500', 'us-ny-newyork');
    const traded = quote(modelById('us-kawasaki-ninja-500')!, 'us-ny-newyork', at, { tradeIn: { value: 1_000_00, payoff: 0, label: 'Old Bike' } }) as Quote;
    expect(line(traded, /Sales Tax/)).toBe(Math.round((plain.price - 1_000_00) * 0.08875));
  });

  it('keeps no London parking permit for a motorcycle, as Westminster’s is a car’s', () => {
    const nobody = { homes: [] } as unknown as Person;
    expect(parkingYear(nobody, modelById('gb-kawasaki-ninja-500')!, 'uk-eng-london')).toBeUndefined();
    expect(parkingYear(nobody, modelsFor('uk-eng-london')[0]!, 'uk-eng-london')).toBeDefined();
  });

  it('tests a British motorcycle at the MOT’s £29.65, and one in New York not at all', () => {
    const sim = life('uk-eng-london', 'moto-mot');
    const old = { id: 'old-bike', boughtAt: sim.now - 5 * 365 * MS_DAY, ageAtPurchase: 0, cityId: 'uk-eng-london' };
    expect(inspectIfDue(sim, sim.player, { ...old, jurisdiction: 'GB' }, 'motorcycle')).toBe(true);
    const mot = sim.universe.transactions.find((t) => t.memo.includes('MOT'))!;
    expect(mot.postings.find((p) => p.accountId === sim.player.primaryAccountId)!.amount).toBe(-29_65);
    expect(inspectIfDue(sim, sim.player, { ...old, id: 'ny-bike', jurisdiction: 'US-NY', cityId: 'us-ny-newyork' }, 'motorcycle')).toBe(false);
    expect(inspectIfDue(sim, sim.player, { ...old, id: 'ny-car', jurisdiction: 'US-NY', cityId: 'us-ny-newyork' })).toBe(true);
  });

  it('taxes by engine size in Britain and Ireland', () => {
    expect(renewal(held('gb-honda-cb125f', 'GB'), at).amount).toBe(27_00);
    expect(renewal(held('gb-royal-enfield-hunter-350', 'GB'), at).amount).toBe(59_00);
    expect(renewal(held('gb-kawasaki-ninja-500', 'GB'), at).amount).toBe(90_00);
    expect(renewal(held('gb-honda-nt1100', 'GB'), at).amount).toBe(125_00);
    expect(renewal(held('ie-honda-cb125f', 'IE'), at).amount).toBe(67_00);
    expect(renewal(held('ie-kawasaki-ninja-500', 'IE'), at).amount).toBe(88_00);
  });

  it('charges Mexico City’s tenencia only past MXN 250,000, at 3% before IVA', () => {
    expect(line(q('mx-italika-ft150', 'mx-cmx-mexicocity'), /Tenencia/)).toBe(0);
    const bob = q('mx-harley-davidson-street-bob', 'mx-cmx-mexicocity');
    expect(line(bob, /Tenencia/)).toBe(Math.round((bob.price / 1.16) * 0.03));
    expect(line(bob, /Alta/)).toBe(709_00);
  });

  it('insures a British Columbia motorcycle by ICBC’s engine class, and a British moped at the moped’s median', () => {
    expect(monthlyInsurance('CA-BC', 'full', modelById('ca-kawasaki-ninja-500'))).toBe(Math.round(1_299_30 / 12));
    expect(monthlyInsurance('CA-BC', 'full', modelById('ca-harley-davidson-street-glide'))).toBe(Math.round(1_960_70 / 12));
    expect(monthlyInsurance('GB', 'full', modelById('gb-peugeot-kisbee-50'))).toBe(Math.round(288_17 / 12));
    expect(monthlyInsurance('GB', 'full', modelById('gb-honda-pcx125'))).toBe(Math.round(463_01 / 12));
    expect(monthlyInsurance('US-NY', 'liability', modelById('us-honda-metropolitan'))).toBe(Math.round(312_00 / 12));
  });

  it('offers liability-only cover for a motorcycle nowhere it isn’t published', () => {
    const sim = life('us-ny-newyork', 'moto-liab');
    expect(buyRefusal(sim, sim.player, 'us-kawasaki-ninja-500', { coverage: 'liability' })).toMatch(/full cover/);
    expect(buyRefusal(sim, sim.player, 'us-honda-metropolitan', { coverage: 'liability' })).toBeUndefined();
  });
});

describe('riding one', () => {
  it('burns its maker’s economy, and one unrated the mean of the rated, not a car’s cost a mile', () => {
    const sim = life('mx-cmx-mexicocity', 'moto-fuel');
    const own = (id: string) => ({ ...held(id, 'MX-CMX'), cityId: 'mx-cmx-mexicocity' });
    const cur = saveCurrency(sim.universe);
    const inSave = (c: number, from: string) => (cur === from ? c : exchange(c, from, cur)!);
    const petrol = FUEL['MX-CMX'].petrol;
    const upkeep = inSave(Math.round(1_000 * UPKEEP_USD_PER_KM), 'USD');
    expect(modelById('mx-italika-ft150')!.per100km).toBeNull();
    // The fourteen rated: two CB125Fs at 1.4, two PCX125s at 2.1, a Primavera 150 at 2.7, three Hunter 350s at 2.8, two Rebel 500s at 3.6, four Ninja 500s at 3.8.
    expect(BIKE_UNRATED_PER100).toBeCloseTo((2 * 1.4 + 2 * 2.1 + 2.7 + 3 * 2.8 + 2 * 3.6 + 4 * 3.8) / 14, 6);
    expect(runningCost(sim, own('mx-italika-ft150'), 1_000)).toBe(inSave(Math.round((1_000 * BIKE_UNRATED_PER100 * petrol) / 100), 'MXN') + upkeep);
    expect(runningCost(sim, own('gb-honda-cb125f'), 1_000)).toBe(inSave(Math.round((1_000 * 1.4 * petrol) / 100), 'MXN') + upkeep);
  });

  it('asks the motorcycle class, which a car license isn’t, and a rider is NHTSA’s 391 injured to a car’s 86', () => {
    const sim = life('us-ny-newyork', 'moto-class');
    const p = sim.player;
    p.documents = [license('us-ny')];
    expect(mayDrive(p, 'us-ny-newyork', at).ok).toBe(true);
    expect(mayDrive(p, 'us-ny-newyork', at, at, 'motorcycle').why).toMatch(/motorcycle license/);
    documentsOf(p).push(license('us-ny', 'motorcycle'));
    expect(mayDrive(p, 'us-ny-newyork', at, at, 'motorcycle').ok).toBe(true);
    const car = crashChance(p, 100, at);
    const bike = crashChance(p, 100, at, 'motorcycle');
    expect(bike / car).toBeCloseTo(391 / 86, 2);
  });

  it('isn’t ridden a month without the class: no fuel is bought for it', () => {
    const sim = life('us-ny-newyork', 'moto-idle');
    sim.player.documents = [license('us-ny')];
    const r = sim.execute<{ vehicleId: string }>({ kind: 'vehicle.buy', payload: { modelId: 'us-honda-rebel-500' } });
    expect(r.ok, r.error).toBe(true);
    sim.advanceBy(31 * MS_DAY);
    const v = vehiclesOf(sim.player).find((x) => x.id === r.value!.vehicleId)!;
    expect(v.km ?? 0).toBe(0);
    expect(sim.universe.transactions.some((t) => t.memo === 'Insurance, the Honda Rebel 500')).toBe(true);
    documentsOf(sim.player).push(license('us-ny', 'motorcycle'));
    sim.advanceBy(31 * MS_DAY);
    expect(v.km).toBeGreaterThan(0);
  });
});

describe('the motorcycle license', () => {
  it('keeps its own path and record apart from the car’s', () => {
    const sim = life('us-ny-newyork', 'moto-path');
    expect(pathHere(sim.player, 'motorcycle')!.path.steps[0]!.id).toBe('permit');
    sim.player.documents = [];
    const r = sim.execute<{ at: number[] }>({ kind: 'documents.license_step', payload: { step: 'permit', track: 'motorcycle' } });
    expect(r.ok, r.error).toBe(true);
    expect(sim.player.motoLicensing?.booked?.step).toBe('permit');
    expect(sim.player.licensing?.booked).toBeUndefined();
  });

  it('takes the motorcycle test on its own record, and its permit leaves the car license standing', () => {
    // The first seed whose permit test passes, at SLATE’s mean rate.
    for (let n = 0; n < 20; n += 1) {
      const sim = life('us-ny-newyork', `moto-pass-${n}`);
      const car = license('us-ny');
      sim.player.documents = [car];
      expect(sim.execute({ kind: 'documents.license_step', payload: { step: 'permit', track: 'motorcycle' } }).ok).toBe(true);
      sim.advanceBy(10 * MS_DAY);
      expect(sim.player.motoLicensing!.attempts.permit).toBe(1);
      if (sim.player.motoLicensing!.done.permit === undefined) continue;
      expect(car.status).toBe('valid');
      expect(documentsOf(sim.player).some((d) => d.vehicleClass === 'motorcycle' && d.name === 'Motorcycle Learner Permit')).toBe(true);
      return;
    }
    throw new Error('no seed passed');
  });

  it('asks Britain’s provisional license only of someone without a British car license', () => {
    const sim = life('uk-eng-london', 'moto-gb');
    sim.player.documents = [];
    expect(stepRefusal(sim, sim.player, 'provisional', 'motorcycle')).toBeUndefined();
    sim.player.documents = [license('gb')];
    expect(stepRefusal(sim, sim.player, 'provisional', 'motorcycle')).toMatch(/isn’t a step/);
    expect(stepRefusal(sim, sim.player, 'cbt', 'motorcycle')).toBeUndefined();
  });

  it('adds British Columbia’s Class 6 to a Class 5 or 7 license only', () => {
    const sim = life('ca-bc-vancouver', 'moto-bc');
    sim.player.documents = [];
    expect(stepRefusal(sim, sim.player, 'knowledge', 'motorcycle')).toMatch(/Class 8/);
    sim.player.documents = [license('ca-bc')];
    expect(stepRefusal(sim, sim.player, 'knowledge', 'motorcycle')).toBeUndefined();
  });

  it('renews with the car license, the class on the same card', () => {
    const sim = life('us-ny-newyork', 'moto-renew');
    const car = { ...license('us-ny'), expiresAt: sim.now + 30 * MS_DAY };
    const moto = { ...license('us-ny', 'motorcycle'), expiresAt: sim.now + 30 * MS_DAY };
    sim.player.documents = [car, moto];
    const r = sim.execute<{ expiresAt: number }>({ kind: 'documents.renew_license', payload: {} });
    expect(r.ok, r.error).toBe(true);
    expect(moto.expiresAt).toBe(r.value!.expiresAt);
  });
});

describe('a rider’s death risk', () => {
  it('adds the motorcyclist’s death rate above a car occupant’s, a kilometer: NHTSA’s in America, the DfT’s in Britain', () => {
    expect(RIDER_DEATH.american).toBeCloseTo((28 - 1.05) / 1e8 / 1.609344, 15);
    expect(RIDER_DEATH.british).toBeCloseTo(65.3 / 1e9, 15);
    expect(riderDeathPerKm('GB')).toBe(RIDER_DEATH.british);
    expect(riderDeathPerKm('IE')).toBe(RIDER_DEATH.british);
    expect(riderDeathPerKm('CA-ON')).toBe(RIDER_DEATH.american);
    const ends = (sim: ReturnType<typeof quickSave>) => sim.universe.scheduled.filter((i) => i.kind === 'life.end' && i.status === 'pending').length;
    // Twenty million kilometers makes the rare draw nearly sure, on two wheels and not on four.
    const rider = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true }, 'rider-death');
    const before = ends(rider);
    drive(rider, rider.player, 'US-NY', 20_000_000, rider.now, 'far', 'motorcycle');
    expect(ends(rider)).toBe(before + 1);
    const driver = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true }, 'rider-death');
    const was = ends(driver);
    drive(driver, driver.player, 'US-NY', 20_000_000, driver.now, 'far', 'car');
    expect(ends(driver)).toBe(was);
    // Once a life's end is set, another isn't.
    const gb = quickSave({ startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london', livesWhereBorn: true }, 'rider-gb');
    expect(riderDeath(gb, gb.player, 'GB', 1, gb.now, 'one', 1)).toBe(true);
    expect(riderDeath(gb, gb.player, 'GB', 1, gb.now, 'two', 1)).toBe(false);
  });
});