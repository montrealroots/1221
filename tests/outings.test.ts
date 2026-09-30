/**
 * Bicycles, e-bikes and ATVs (`content/ridecatalog.ts`, `content/rides.ts`,
 * `systems/outings.ts`, from 2026-09-30): what each is taxed and registered
 * at where it's bought, that neither is driven every day or between towns,
 * and what each is for: a ride that builds fitness at a cyclist's risk, and
 * an afternoon on the trail on land one owns.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { carryCars, modelById, modelsFor, monthlyInsurance, quote, vehiclesOf, VEHICLE_RENEWAL_KIND, type Quote } from '@/engine/systems/vehicles';
import { documentsOf } from '@/engine/systems/documents';
import { planDrive } from '@/engine/systems/journey';
import { lookAfterRefusal } from '@/engine/systems/life';
import { rideInjuryChance, rideOut, trailFor } from '@/engine/systems/outings';
import { applyLookingAfter } from '@/engine/systems/life';
import { injuryOf } from '@/engine/systems/injury';
import type { Person } from '@/engine/domain/model';
import { BODY } from '@/engine/content/body';
import { LAND_MARKETS } from '@/engine/content/land';

const YEAR = 365.25 * MS_DAY;
const at = Date.UTC(2026, 9, 1);
const q = (id: string, city: string) => quote(modelById(id)!, city, at) as Quote;
const line = (x: Quote, re: RegExp) => x.lines.find((l) => re.test(l.label))?.amount;
function life(town: string, seed: string): Simulation {
  const sim = quickSave({ startLocationId: town, homeRegionId: town, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.player.documents = [];
  documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer: 'us-ny', name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 10 * YEAR, expiresAt: sim.now + 5 * YEAR });
  return sim;
}
const buy = (sim: Simulation, modelId: string) => { const r = sim.execute<{ vehicleId: string }>({ kind: 'vehicle.buy', payload: { modelId } }); expect(r.ok, r.error).toBe(true); return vehiclesOf(sim.player).find((v) => v.id === r.value!.vehicleId)!; };
/** On until the weather's fine for an outing, a day at a time. */
function fineDay(sim: Simulation, action: 'ride' | 'trail'): void {
  for (let n = 0; n < 120 && lookAfterRefusal(sim, action); n += 1) sim.advanceBy(MS_DAY);
  expect(lookAfterRefusal(sim, action)).toBeUndefined();
}

describe('what one costs', () => {
  it('sells bicycles, e-bikes and ATVs where they were read', () => {
    for (const city of ['us-ny-newyork', 'uk-eng-london', 'ie-lei-dublin', 'ca-on-toronto']) {
      expect(modelsFor(city, 'bicycle').length).toBeGreaterThan(0);
      expect(modelsFor(city, 'ebike').length).toBeGreaterThan(0);
      expect(modelsFor(city, 'atv').length).toBeGreaterThan(0);
    }
  });

  it('taxes a bicycle as a sale and nothing more: no dealer’s fee, no registration', () => {
    const x = q('us-trek-fx-1', 'us-ny-newyork');
    expect(line(x, /Sales Tax/)).toBe(Math.round(x.price * 0.08875));
    expect(x.lines).toHaveLength(1);
  });

  it('charges British Columbia’s GST and no PST on an e-bike, and both on an ATV with its registration', () => {
    const bike = q('ca-mec-skyway', 'ca-bc-vancouver');
    expect(line(bike, /GST/)).toBe(Math.round(bike.price * 0.05));
    expect(line(bike, /PST/)).toBeUndefined();
    const atv = q('ca-can-am-outlander', 'ca-bc-vancouver');
    expect(line(atv, /PST/)).toBe(Math.round(atv.price * 0.07));
    expect(line(atv, /Off-Road Vehicle Registration/)).toBe(48_00);
  });

  it('registers a New York ATV at $12.50 a year and its plate, and renews it; an Ontario ATV once; a bicycle never', () => {
    expect(line(q('us-honda-fourtrax-rancher', 'us-ny-newyork'), /Registration And Plate/)).toBe(25_00);
    const ny = life('us-ny-newyork', 'atv-ny');
    const atv = buy(ny, 'us-honda-fourtrax-rancher');
    const bike = buy(ny, 'us-trek-fx-1');
    const renewals = (id: string) => ny.universe.scheduled.filter((i) => i.kind === VEHICLE_RENEWAL_KIND && i.payload.vehicleId === id && i.status === 'pending');
    expect(renewals(atv.id)).toHaveLength(1);
    expect(renewals(bike.id)).toHaveLength(0);
    ny.advanceBy(366 * MS_DAY);
    expect(ny.universe.transactions.some((t) => t.memo === 'ATV registration renewed')).toBe(true);
    const on = life('ca-on-toronto', 'atv-on');
    const onAtv = buy(on, 'ca-honda-fourtrax-rancher');
    expect(on.universe.scheduled.some((i) => i.kind === VEHICLE_RENEWAL_KIND && i.payload.vehicleId === onAtv.id)).toBe(false);
  });

  it('insures an American ATV at ValuePenguin’s averages, and a bicycle not at all', () => {
    expect(monthlyInsurance('US-NY', 'full', modelById('us-honda-fourtrax-rancher'))).toBe(Math.round(327_00 / 12));
    expect(monthlyInsurance('US-NY', 'liability', modelById('us-honda-fourtrax-rancher'))).toBe(Math.round(88_00 / 12));
    expect(monthlyInsurance('CA-ON', 'full', modelById('ca-honda-fourtrax-rancher'))).toBe(0);
    expect(monthlyInsurance('US-NY', 'full', modelById('us-trek-fx-1'))).toBe(0);
  });
});

describe('where it goes', () => {
  it('isn’t driven every day or between towns, and moves with the household anywhere', () => {
    const sim = life('us-ny-newyork', 'bike-where');
    const bike = buy(sim, 'us-trek-fx-1');
    sim.advanceBy(61 * MS_DAY);
    expect(bike.km ?? 0).toBe(0);
    expect(planDrive(sim, sim.player, bike.id, 'us-ny-newyork', 'us-ct-newhaven', sim.now + 7 * MS_DAY, 2)).toMatch(/isn’t taken on a journey/);
    carryCars(sim, sim.player, 'us-ny-newyork', 'uk-eng-london');
    expect(bike.at).toBe('uk-eng-london');
  });
});

describe('a ride', () => {
  it('asks a bicycle or e-bike here, builds fitness, and risks a cyclist’s crash, an e-bike’s less', () => {
    const sim = life('us-ny-newyork', 'bike-ride');
    expect(lookAfterRefusal(sim, 'ride')).toMatch(/no bicycle or e-bike here/);
    const bike = buy(sim, 'us-trek-fx-1');
    expect(rideInjuryChance(bike)).toBeCloseTo((4_367 / 1e9) * 10, 12);
    const ebike = buy(sim, 'us-trek-fx-plus-1');
    expect(rideInjuryChance(ebike) / rideInjuryChance(bike)).toBeCloseTo(5.14 / 7.26, 9);
    fineDay(sim, 'ride');
    sim.player.wellbeing.energy = 90;
    sim.player.wellbeing.fitness = 30;
    const spent = sim.player.body!.extra;
    const r = sim.execute({ kind: 'life.look_after', payload: { action: 'ride' } });
    expect(r.ok, r.error).toBe(true);
    expect(sim.player.wellbeing.fitness).toBeGreaterThan(30);
    // An hour at the e-bike's 6.0 METs, over the sedentary day's 1.4.
    expect(sim.player.body!.extra - spent).toBeCloseTo((6.0 - BODY.sedentary) * sim.player.body!.weightKg, 6);
    // Its risk is drawn: at certainty, a crash's injury.
    const other = life('us-ny-newyork', 'bike-crash');
    rideOut(other, other.player, bike, 1);
    expect(injuryOf(other.player, other.now)).toBeDefined();
  });
});

describe('an afternoon on the trail', () => {
  it('asks an ATV and acreage owned in the state, not a city lot', () => {
    const sim = life('us-ny-newyork', 'atv-trail');
    buy(sim, 'us-honda-fourtrax-rancher');
    expect(lookAfterRefusal(sim, 'trail')).toMatch(/land you own/);
    const lot = LAND_MARKETS.findIndex((m) => m.cityId === 'us-ny-newyork' && m.kind === 'lot');
    sim.player.land = [{ id: 'lot', market: lot, acres: 0.07, boughtAt: sim.now, paid: 0 }];
    expect(trailFor(sim.player)).toBeUndefined();
    const farm = LAND_MARKETS.findIndex((m) => m.cityId === 'us-ny-newyork' && m.kind === 'acreage');
    sim.player.land.push({ id: 'farm', market: farm, acres: 10, boughtAt: sim.now, paid: 0 });
    expect(trailFor(sim.player)).toBeDefined();
    fineDay(sim, 'trail');
    const stress = (sim.player.wellbeing.stress = 60);
    const spent = sim.player.body!.extra;
    const r = sim.execute({ kind: 'life.look_after', payload: { action: 'trail' } });
    expect(r.ok, r.error).toBe(true);
    expect(sim.player.wellbeing.stress).toBeLessThan(stress);
    // Two hours at the Compendium's 4.0 METs, over the sedentary day's 1.4.
    expect(sim.player.body!.extra - spent).toBeCloseTo((4.0 - BODY.sedentary) * sim.player.body!.weightKg * 2, 6);
    // As an hour outside does for the mood, not an hour unwinding.
    const dial = (action: 'trail' | 'outside' | 'unwind') => { const p = { personality: sim.player.personality, personalityTraits: [], wellbeing: { ...sim.player.wellbeing, stress: 60, morale: 50 } } as unknown as Person; applyLookingAfter(p, action); return p.wellbeing; };
    expect(dial('trail')).toEqual(dial('outside'));
    expect(dial('trail')).not.toEqual(dial('unwind'));
  });
});
