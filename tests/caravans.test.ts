/**
 * A travel trailer or touring caravan of one's own (`systems/caravans.ts`,
 * `content/caravans.ts`, from 2026-09-30): bought and kept at a house of one's
 * own, insured and registered as the place asks, towed behind a car rated to
 * tow it with a towbar fitted, burning more and driving slower, and slept in
 * at a campground.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, instantFromZoned, normalDate, zonedParts } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { salesTaxRate } from '@/engine/content/tax';
import { CARAVANS, LB } from '@/engine/content/caravans';
import { upkeepPerKm } from '@/engine/systems/repairs';
import { buyCaravanRefusal, caravanQuote, caravansOf, caravanValue, carryCaravans, hitchRefusal, towFor, towedLegs } from '@/engine/systems/caravans';
import { documentsOf } from '@/engine/systems/documents';
import { ownBuilt, type HomeFacts } from '@/engine/systems/homes';
import { journeysOf, planDrive } from '@/engine/systems/journey';
import { modelById, runningCost, vehiclesOf, type OwnedVehicle } from '@/engine/systems/vehicles';
import { roadKm } from '@/engine/systems/driving';

const YEAR = 365.25 * MS_DAY;
const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
const paidFor = (sim: Simulation, memo: string) => sim.universe.transactions.filter((t) => t.memo === memo).map((t) => t.postings.filter((x) => x.amount > 0).reduce((a, x) => a + x.amount, 0));

/** A life in a house of their own, licensed where they live. */
function atHome(city: string, seed: string, type: HomeFacts['type'] = 'house'): Simulation {
  const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'inherited' }, seed);
  const facts: HomeFacts = { type, address: 'Test House', beds: 3, baths: 2, size: 1_600, built: 2000, features: [], parts: {}, hoaUsd: 0 };
  const owned = ownBuilt(sim, sim.player, { cityId: city, facts, price: 900_000_00, closing: 0 });
  sim.player.home = { kind: 'owned', cityId: city, homeId: owned.id, since: sim.now };
  const issuer = city.startsWith('uk-') ? 'gb' : city.slice(0, 5);
  sim.player.documents = [{ id: 'lic', kind: 'license', issuer, name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 10 * YEAR, expiresAt: sim.now + 5 * YEAR }];
  return sim;
}
/** Their bank emptied. */
const drain = (sim: Simulation) => { for (const x of Object.values(sim.universe.accounts)) if (x.ownerId === sim.player.id && !x.nominal && x.balance > 0) x.balance = 0; };
const car = (sim: Simulation, modelId: string): OwnedVehicle => {
  const r = sim.execute({ kind: 'vehicle.buy', payload: { modelId } });
  expect(r.ok, r.error).toBe(true);
  return vehiclesOf(sim.player).at(-1)!;
};
function saturday(sim: Simulation, after: number): number {
  const p = zonedParts(sim.now + after * MS_DAY, sim.zone);
  for (let d = 0; d < 7; d += 1) {
    const t = instantFromZoned({ ...normalDate(p.year, p.month, p.day + d), hour: 12 }, sim.zone);
    if (new Date(t).getUTCDay() === 6) return t;
  }
  throw new Error('no saturday');
}

describe('buying and keeping one', () => {
  it('sells Jayco’s Jay Flight in Los Angeles taxed, with California’s $76, $34 and 0.65% of it, kept at a house of one’s own', () => {
    const sim = atHome('us-ca-losangeles', 'cv-la');
    const q = caravanQuote(sim, 'us-ca-losangeles')!;
    expect(q.price).toBe(inSave(sim, 17_318_00, 'USD'));
    expect(q.tax).toBe(inSave(sim, Math.round(17_318 * salesTaxRate('us-ca-losangeles', sim.now, 'goods') * 100), 'USD'));
    expect(q.registration).toBe(inSave(sim, Math.round((76 + 34 + 0.0065 * 17_318) * 100), 'USD'));
    const r = sim.execute<{ paid: number }>({ kind: 'caravan.buy', payload: {} });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.paid).toBe(q.price + q.tax + q.registration);
    // A condo has no drive of one's own.
    expect(buyCaravanRefusal(atHome('us-ca-losangeles', 'cv-condo', 'condo'), atHome('us-ca-losangeles', 'cv-condo', 'condo').player)).toMatch(/drive of a house/);
    // Nor without the money, nor a towbar.
    const poor = atHome('us-ca-losangeles', 'cv-poor');
    const truck = car(poor, 'us-ford-f-series');
    drain(poor);
    expect(buyCaravanRefusal(poor, poor.player)).toMatch(/It costs/);
    expect(hitchRefusal(poor, poor.player, truck)).toMatch(/afford/);
  });

  it('registers one in New York at $5.39 a 500 lb, and in Connecticut with its title, and none in Britain', () => {
    const ny = atHome('us-ny-newyork', 'cv-ny');
    expect(caravanQuote(ny, 'us-ny-newyork')!.registration).toBe(inSave(ny, 10 * 539, 'USD'));
    expect(caravanQuote(ny, 'us-ct-newhaven')!.registration).toBe(inSave(ny, Math.round((22.5 + 5 + 24 + 25) * 100), 'USD'));
    const gb = atHome('uk-eng-london', 'cv-gb');
    const q = caravanQuote(gb, 'uk-eng-london')!;
    expect([q.price, q.tax, q.registration]).toEqual([inSave(gb, 21_499_00, 'GBP'), 0, 0]);
    expect(caravanQuote(gb, 'ie-lei-dublin')).toBeUndefined();
  });

  it('insures it by the month, renews California’s registration on its worth, and sells it on the car curve', () => {
    const sim = atHome('us-ca-losangeles', 'cv-months');
    expect(sim.execute({ kind: 'caravan.buy', payload: {} }).ok).toBe(true);
    sim.advanceBy(425 * MS_DAY);
    const monthly = paidFor(sim, 'The caravan’s insurance, a month');
    expect(monthly.length).toBe(14);
    expect(monthly[0]).toBe(inSave(sim, Math.round((405.14 / 12) * 100), 'USD'));
    const renewed = paidFor(sim, 'The caravan’s registration renewed');
    expect(renewed.length).toBe(1);
    expect(renewed[0]).toBeLessThan(inSave(sim, Math.round((76 + 34 + 0.0065 * 17_318) * 100), 'USD'));
    const c = caravansOf(sim.player)[0]!;
    const worth = caravanValue(c, sim.now);
    expect(worth).toBeLessThan(c.price);
    expect(sim.execute<{ value: number }>({ kind: 'caravan.sell', payload: { caravanId: c.id } }).value!.value).toBe(worth);
    expect(caravansOf(sim.player)).toEqual([]);
  });
});

describe('towing it', () => {
  it('asks a towbar, and a car its maker rates for the caravan’s most', () => {
    const sim = atHome('us-ca-losangeles', 'cv-hitch');
    expect(sim.execute({ kind: 'caravan.buy', payload: {} }).ok).toBe(true);
    const rav4 = car(sim, 'us-toyota-rav4');
    const camry = car(sim, 'us-toyota-camry');
    const f150 = car(sim, 'us-ford-f-series');
    expect(hitchRefusal(sim, sim.player, camry)).toMatch(/tow nothing/);
    expect(towFor(sim.player, f150, 'us-ca-losangeles', 'us-ca-sanfrancisco')).toMatch(/no towbar/);
    expect(sim.execute({ kind: 'vehicle.hitch', payload: { vehicleId: rav4.id } }).ok).toBe(true);
    // 1,750 lb against the Jay Flight's 4,800.
    expect(towFor(sim.player, rav4, 'us-ca-losangeles', 'us-ca-sanfrancisco')).toMatch(/rates it to tow 794 kg/);
    const r = sim.execute<{ paid: number }>({ kind: 'vehicle.hitch', payload: { vehicleId: f150.id } });
    expect(r.value!.paid).toBe(inSave(sim, 350_00, 'USD'));
    expect(hitchRefusal(sim, sim.player, f150)).toMatch(/has one/);
    expect(typeof towFor(sim.player, f150, 'us-ca-losangeles', 'us-ca-sanfrancisco')).toBe('object');
    expect(towFor(sim.player, f150, 'us-ca-losangeles', 'ca-bc-vancouver')).toMatch(/own country/);
    expect(towFor(sim.player, f150, 'us-ca-sanfrancisco', 'us-ca-losangeles')).toMatch(/No caravan/);
    // A truck taken to Toronto has no towbar fitted there.
    expect(hitchRefusal(sim, sim.player, { ...rav4, hitch: false, cityId: 'ca-on-toronto' })).toMatch(/America and Britain/);
  });

  it('burns 1% more a 100 lb of it, and drives California at 55 mph to a car’s 65', () => {
    const sim = atHome('us-ca-losangeles', 'cv-legs');
    expect(sim.execute({ kind: 'caravan.buy', payload: {} }).ok).toBe(true);
    const f150 = car(sim, 'us-ford-f-series');
    sim.execute({ kind: 'vehicle.hitch', payload: { vehicleId: f150.id } });
    const legs = planDrive(sim, sim.player, f150.id, 'us-ca-losangeles', 'us-ca-sanfrancisco', saturday(sim, 7), 2) as never as Parameters<typeof towedLegs>[3];
    const towed = towedLegs(sim, f150, caravansOf(sim.player)[0]!, legs);
    const km = roadKm('us-ca-losangeles', 'us-ca-sanfrancisco');
    const fuel = runningCost(sim, f150, km) - inSave(sim, Math.round(km * upkeepPerKm(modelById(f150.modelId)!, f150.jurisdiction)), 'USD');
    expect(towed[0]!.fare - legs[0]!.fare).toBe(Math.round(fuel * (CARAVANS.US.maxKg / LB / 100) * 0.01));
    expect(towed[0]!.arriveAt - towed[0]!.departAt).toBe(Math.round((legs[0]!.arriveAt - legs[0]!.departAt) * 65 / 55));
    // In New York no lower limit towing is set: the same time.
    const ny = atHome('us-ny-newyork', 'cv-legs-ny');
    expect(ny.execute({ kind: 'caravan.buy', payload: {} }).ok).toBe(true);
    const ram = car(ny, 'us-ford-f-series');
    const nyLegs = planDrive(ny, ny.player, ram.id, 'us-ny-newyork', 'us-ny-hudson', saturday(ny, 7), 2) as never as Parameters<typeof towedLegs>[3];
    const nyTowed = towedLegs(ny, ram, caravansOf(ny.player)[0]!, nyLegs);
    expect(nyTowed[0]!.arriveAt).toBe(nyLegs[0]!.arriveAt);
  });

  it('is booked to a campground behind the truck, comes back with it, and is refused to a campground without it', () => {
    const sim = atHome('us-ca-losangeles', 'cv-trip');
    expect(sim.execute({ kind: 'caravan.buy', payload: {} }).ok).toBe(true);
    const f150 = car(sim, 'us-ford-f-series');
    sim.execute({ kind: 'vehicle.hitch', payload: { vehicleId: f150.id } });
    const day = saturday(sim, 14);
    const book = (tow: boolean, round = true) => sim.execute<{ journeyId: string; returnId?: string }>({ kind: 'travel.book', payload: { toCity: 'us-ca-sanfrancisco', day, slot: 2, by: `car:${f150.id}`, ...(round ? { returnDay: day + 2 * MS_DAY, returnSlot: 2 } : { nights: 2 }), stay: 'campground', tow } });
    expect(book(false).error).toMatch(/caravan of your own/);
    // A round trip tows it both ways.
    const both = book(true);
    expect(both.ok, both.error).toBe(true);
    const home = journeysOf(sim.player).find((j) => j.id === both.value!.returnId)!;
    expect(home.legs[0]!.basis).toMatch(/Towing the Jayco/);
    sim.execute({ kind: 'travel.cancel', payload: { journeyId: both.value!.journeyId } });
    const r = book(true, false);
    expect(r.ok, r.error).toBe(true);
    const out = journeysOf(sim.player).find((j) => j.id === r.value!.journeyId)!;
    expect(out.towing).toBe(caravansOf(sim.player)[0]!.id);
    expect(out.hotel!.price).toBe(inSave(sim, out.hotel!.nights * 45_00, 'USD'));
    sim.advanceTo(out.arriveAt + MS_DAY);
    expect(caravansOf(sim.player)[0]!.at).toBe('us-ca-sanfrancisco');
  });
});

describe('moving home with it', () => {
  it('comes to a new house in its country, and is sold where the new home has no drive', () => {
    const sim = atHome('us-ca-losangeles', 'cv-move');
    expect(sim.execute({ kind: 'caravan.buy', payload: {} }).ok).toBe(true);
    const c = caravansOf(sim.player)[0]!;
    // A house in New York: there, and registered in New York.
    const facts: HomeFacts = { type: 'house', address: 'New House', beds: 3, baths: 2, size: 1_600, built: 2000, features: [], parts: {}, hoaUsd: 0 };
    const owned = ownBuilt(sim, sim.player, { cityId: 'us-ny-newyork', facts, price: 900_000_00, closing: 0 });
    sim.player.home = { kind: 'owned', cityId: 'us-ny-newyork', homeId: owned.id, since: sim.now };
    carryCaravans(sim, sim.player, 'us-ca-losangeles', 'us-ny-newyork');
    expect([c.cityId, c.place]).toEqual(['us-ny-newyork', 'US-NY']);
    expect(paidFor(sim, 'Registering the caravan in its new home')).toEqual([inSave(sim, 10 * 539, 'USD')]);
    // One left in another town stays there; a house abroad doesn't take it.
    c.at = 'us-ny-hudson';
    carryCaravans(sim, sim.player, 'us-ny-newyork', 'us-ct-newhaven');
    expect(c.cityId).toBe('us-ny-newyork');
    expect(caravansOf(sim.player)).toEqual([c]);
    delete c.at;
    const london = ownBuilt(sim, sim.player, { cityId: 'uk-eng-london', facts, price: 900_000_00, closing: 0 });
    sim.player.home = { kind: 'owned', cityId: 'uk-eng-london', homeId: london.id, since: sim.now };
    carryCaravans(sim, sim.player, 'us-ny-newyork', 'uk-eng-london');
    expect(caravansOf(sim.player)).toEqual([]);
    // A room in Connecticut: sold at its worth.
    sim.player.home = { kind: 'owned', cityId: 'us-ny-newyork', homeId: owned.id, since: sim.now };
    expect(sim.execute({ kind: 'caravan.buy', payload: {} }).ok).toBe(true);
    sim.player.home = { kind: 'shared', cityId: 'us-ct-newhaven', since: sim.now } as never;
    carryCaravans(sim, sim.player, 'us-ny-newyork', 'us-ct-newhaven');
    expect(caravansOf(sim.player)).toEqual([]);
    expect(sim.universe.transactions.some((t) => t.memo.includes('no drive of your own'))).toBe(true);
    documentsOf(sim.player);
  });
});
