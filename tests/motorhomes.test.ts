/**
 * Motorhomes, campervans and cargo vans (`content/rvcatalog.ts`, the kinds in
 * `systems/vehicles.ts`, from 2026-09-30): what each costs and insures at
 * where it's kept, a night at a campground on a journey made in one's own
 * motorhome (`campgroundPrice` in `systems/stays.ts`), and a move made in
 * one's own van instead of the movers' (`ownVanFor` in `systems/furniture.ts`).
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, instantFromZoned, normalDate, zonedParts } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { buyRefusal, classFor, modelById, modelsFor, monthlyInsurance, quote, renewal, runningCost, vehiclesOf, type OwnedVehicle, type Quote } from '@/engine/systems/vehicles';
import { documentsOf } from '@/engine/systems/documents';
import { crashChance, roadKm } from '@/engine/systems/driving';
import { stayClassesIn, stayPrice, streetRefusal } from '@/engine/systems/stays';
import { journeysOf } from '@/engine/systems/journey';
import { carryFurniture, moversCost, truckFor } from '@/engine/systems/furniture';
import { FUEL } from '@/engine/content/vehiclefees';

const YEAR = 365.25 * MS_DAY;
const at = Date.UTC(2026, 9, 1);
const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
const held = (id: string, j: string) => ({ id: 'owned', modelId: id, jurisdiction: j, cityId: '', boughtAt: at, ageAtPurchase: 0, listPrice: modelById(id)!.price, coverage: 'full', registrationDue: 0 }) as OwnedVehicle;
function life(town: string, seed: string, licensed = true): Simulation {
  const sim = quickSave({ startLocationId: town, homeRegionId: town, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.player.documents = [];
  if (licensed) documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer: town.startsWith('us-ca') ? 'us-ca' : town.startsWith('us-ny') ? 'us-ny' : 'us-ct', name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 10 * YEAR, expiresAt: sim.now + 5 * YEAR });
  return sim;
}
function saturday(sim: Simulation, after: number): number {
  const p = zonedParts(sim.now + after * MS_DAY, sim.zone);
  for (let d = 0; d < 7; d += 1) {
    const t = instantFromZoned({ ...normalDate(p.year, p.month, p.day + d), hour: 12 }, sim.zone);
    if (zonedParts(t, sim.zone).weekday === 6) return t;
  }
  throw new Error('no saturday');
}

describe('what one costs', () => {
  it('sells motorhomes, campervans and vans where they were read, and no motorhome in Mexico City', () => {
    expect(modelsFor('us-ca-losangeles', 'motorhome').length).toBeGreaterThan(0);
    expect(modelsFor('us-ca-losangeles', 'campervan').length).toBeGreaterThan(0);
    expect(modelsFor('uk-eng-london', 'van').length).toBeGreaterThan(0);
    expect(modelsFor('mx-cmx-mexicocity', 'van').length).toBeGreaterThan(0);
    expect(modelsFor('mx-cmx-mexicocity', 'motorhome')).toHaveLength(0);
  });

  it('sells an American van below its sticker, as KBB’s light vehicles are, and a motorhome at it', () => {
    const van = quote(modelById('us-ram-promaster')!, 'us-ca-losangeles', at) as Quote;
    expect(van.lines.find((l) => /Below The Sticker/.test(l.label))!.amount).toBe(-Math.round(van.price * 0.034));
    const rv = quote(modelById('us-thor-four-winds')!, 'us-ca-losangeles', at) as Quote;
    expect(rv.lines.some((l) => /Below The Sticker/.test(l.label))).toBe(false);
  });

  it('taxes an Irish van as a goods vehicle and a motorhome as a motor caravan', () => {
    expect(renewal(held('ie-ford-transit', 'IE'), at).amount).toBe(333_00);
    expect(renewal(held('ie-swift-escape-640', 'IE'), at).amount).toBe(102_00);
    // Britain's light goods rate on a van, £140 for one registered to Euro 4 or 5, and a motorhome's private light goods rate.
    expect(renewal(held('gb-ford-transit-custom', 'GB'), at).amount).toBe(360_00);
    expect(renewal({ ...held('gb-ford-transit-custom', 'GB'), ageAtPurchase: 18 }, at).amount).toBe(140_00);
    expect(renewal({ ...held('gb-ford-transit-custom', 'GB'), ageAtPurchase: 26 }, at).amount).toBe(360_00);
    expect(renewal(held('gb-swift-escape', 'GB'), at).amount).toBe(375_00);
    expect(renewal(held('gb-auto-trail-v-line-610', 'GB'), at).amount).toBe(375_00);
  });

  it('insures a motorhome at Progressive’s and Quotezone’s averages, full cover only, and a van as a car', () => {
    expect(monthlyInsurance('US-CA', 'full', modelById('us-thor-four-winds'))).toBe(Math.round(1_052_00 / 12));
    expect(monthlyInsurance('GB', 'full', modelById('gb-swift-escape'))).toBe(Math.round(598_00 / 12));
    expect(monthlyInsurance('US-CA', 'liability', modelById('us-ram-promaster'))).toBe(monthlyInsurance('US-CA', 'liability'));
    const sim = life('us-ca-losangeles', 'rv-cover');
    expect(buyRefusal(sim, sim.player, 'us-thor-four-winds', { coverage: 'liability' })).toMatch(/full cover/);
    expect(buyRefusal(sim, sim.player, 'us-ram-promaster', { coverage: 'liability' })).toBeUndefined();
  });

  it('is driven on a car license, at a car’s risk, burning the nearest published figure', () => {
    const rv = modelById('us-thor-four-winds')!;
    expect(classFor(rv)).toBe('car');
    const sim = life('us-ca-losangeles', 'rv-drive');
    expect(crashChance(sim.player, 100, at, 'motorhome')).toBe(crashChance(sim.player, 100, at));
    expect(rv.per100km).toBe(23.5);
    expect(modelById('us-winnebago-solis')!.per100km).toBe(9);
  });
});

describe('a campground', () => {
  it('is offered only on a journey in one’s own motorhome, at the region’s park, a visitor paying New York’s surcharge', () => {
    expect(stayClassesIn('us-ca-losangeles')).not.toContain('campground');
    expect(stayClassesIn('us-ca-losangeles', true)).toContain('campground');
    expect(stayClassesIn('uk-eng-london', true)).not.toContain('campground');
    const sim = life('us-ca-losangeles', 'rv-camp-price');
    expect(stayPrice(sim, 'us-ca-losangeles', 3, 1, 'campground')!.price).toBe(inSave(sim, 3 * 45_00, 'USD'));
    expect(stayPrice(sim, 'us-ny-newyork', 2, 1, 'campground', 'flexible', true)!.price).toBe(inSave(sim, 2 * 24_00, 'USD'));
    expect(stayPrice(sim, 'us-ny-newyork', 2, 1, 'campground', 'flexible', false)!.price).toBe(inSave(sim, 2 * 29_00, 'USD'));
  });

  it('is booked with a trip in the motorhome, and refused with one in a car', () => {
    const sim = life('us-ca-losangeles', 'rv-camp-book');
    expect(sim.execute({ kind: 'vehicle.buy', payload: { modelId: 'us-thor-four-winds' } }).ok).toBe(true);
    expect(sim.execute({ kind: 'vehicle.buy', payload: { modelId: 'us-toyota-camry' } }).ok).toBe(true);
    const [rv, car] = vehiclesOf(sim.player);
    const day = saturday(sim, 14);
    const trip = (v: OwnedVehicle) => sim.execute<{ journeyId: string }>({ kind: 'travel.book', payload: { toCity: 'us-ca-sanfrancisco', day, slot: 2, by: `car:${v.id}`, returnDay: day + 2 * MS_DAY, returnSlot: 2, stay: 'campground' } });
    expect(trip(car!).error).toMatch(/motorhome, a campervan or a caravan/);
    const r = trip(rv!);
    expect(r.ok, r.error).toBe(true);
    const out = journeysOf(sim.player).find((j) => j.id === r.value!.journeyId)!;
    expect(out.hotel!.cls).toBe('campground');
    expect(out.hotel!.price).toBe(inSave(sim, out.hotel!.nights * 45_00, 'USD'));
  });

  it('parks a motorhome at its own site, not at New York City’s hotel rate, and charges a Connecticut visitor New York’s surcharge', () => {
    const sim = life('us-ct-newhaven', 'rv-camp-nyc');
    expect(sim.execute({ kind: 'vehicle.buy', payload: { modelId: 'us-thor-four-winds' } }).ok).toBe(true);
    const rv = vehiclesOf(sim.player)[0]!;
    const day = saturday(sim, 14);
    const r = sim.execute<{ journeyId: string }>({ kind: 'travel.book', payload: { toCity: 'us-ny-newyork', day, slot: 2, by: `car:${rv.id}`, returnDay: day + 2 * MS_DAY, returnSlot: 2, stay: 'campground' } });
    expect(r.ok, r.error).toBe(true);
    const out = journeysOf(sim.player).find((j) => j.id === r.value!.journeyId)!;
    expect(out.hotel!.parking).toBeUndefined();
    // Two nights from a Saturday: its  weekend fee, and Sunday's none.
    expect(out.hotel!.nights).toBe(2);
    expect(out.hotel!.price).toBe(inSave(sim, 33_00 + 29_00, 'USD'));
  });

  it('prices each night by its date: Rathtrevor’s peak, shoulder and winter, Carrowkeel’s high season, and closed in winter', () => {
    const sim = life('us-ca-losangeles', 'rv-camp-seasons');
    const on = (y: number, m: number, d: number) => Date.UTC(y, m - 1, d, 20);
    const bc = (m: number, d: number) => stayPrice(sim, 'ca-bc-vancouver', 1, 1, 'campground', 'flexible', true, on(2027, m, d))!.price;
    expect([bc(7, 1), bc(9, 7), bc(9, 8), bc(5, 1), bc(12, 1), bc(3, 14), bc(3, 15)]).toEqual([51, 51, 35, 35, 13, 13, 35].map((x) => inSave(sim, x * 100, 'CAD')));
    const ie = (m: number, d: number) => stayPrice(sim, 'ie-lei-dublin', 1, 1, 'campground', 'flexible', true, on(2027, m, d))?.price;
    expect(ie(8, 1)).toBe(inSave(sim, 31_00, 'EUR'));
    expect(ie(5, 1)).toBe(inSave(sim, 26_00, 'EUR'));
    expect(ie(10, 1)).toBe(inSave(sim, 26_00, 'EUR'));
    expect(ie(10, 2)).toBeUndefined();
    expect(ie(3, 31)).toBeUndefined();
    // Three nights from 30 September: the third falls after it closes.
    expect(stayPrice(sim, 'ie-lei-dublin', 3, 1, 'campground', 'flexible', true, on(2027, 9, 30))).toBeUndefined();
    // New York's $4 falls on a Friday night too (1 January 2027 is a Friday), and not on a Thursday.
    expect(stayPrice(sim, 'us-ny-newyork', 1, 1, 'campground', 'flexible', true, on(2027, 1, 1))!.price).toBe(inSave(sim, 28_00, 'USD'));
    expect(stayPrice(sim, 'us-ny-newyork', 1, 1, 'campground', 'flexible', true, on(2026, 12, 31))!.price).toBe(inSave(sim, 24_00, 'USD'));
    // A booking for Carrowkeel's closed months says when it's open.
    const dub = quickSave({ startLocationId: 'ie-lei-dublin', homeRegionId: 'ie-lei-dublin', livesWhereBorn: true, wealth: 'wealthy' }, 'rv-camp-closed');
    dub.player.documents = [{ id: 'lic', kind: 'license', issuer: 'ie', name: 'License', number: 'L1', status: 'valid', issuedAt: dub.now - 10 * YEAR, expiresAt: dub.now + 5 * YEAR }];
    expect(dub.execute({ kind: 'vehicle.buy', payload: { modelId: 'ie-swift-escape-640' } }).ok).toBe(true);
    const van = vehiclesOf(dub.player)[0]!;
    const winter = dub.execute({ kind: 'travel.book', payload: { toCity: 'ie-m-cork', day: saturday(dub, 7), slot: 2, by: `car:${van.id}`, nights: 2, stay: 'campground' } });
    expect(winter.error).toMatch(/open from 1 April to 1 October/);
    // In summer it books, though Cork has no hotel figures: the motorhome sleeps at the park.
    const summer = dub.execute<{ journeyId: string }>({ kind: 'travel.book', payload: { toCity: 'ie-m-cork', day: saturday(dub, 180), slot: 2, by: 'car:' + van.id, nights: 2, stay: 'campground' } });
    expect(summer.ok, summer.error).toBe(true);
    // A visitor pays BC's $20 in winter too.
    expect(stayPrice(sim, 'ca-bc-vancouver', 1, 1, 'campground', 'flexible', false, on(2027, 12, 1))!.price).toBe(inSave(sim, 33_00, 'CAD'));
  });
});

describe('a night on the street, in one’s own motorhome', () => {
  it('is offered in New York City for up to seven nights, free, and refused where the city’s rules forbid it, saying why', () => {
    expect(stayClassesIn('us-ny-newyork', true)).toContain('street');
    expect(stayClassesIn('us-ny-newyork')).not.toContain('street');
    expect(stayClassesIn('ca-on-toronto', true)).not.toContain('street');
    const sim = life('us-ct-newhaven', 'rv-street-price');
    expect(stayPrice(sim, 'us-ny-newyork', 7, 1, 'street')!.price).toBe(0);
    expect(stayPrice(sim, 'us-ny-newyork', 8, 1, 'street')).toBeUndefined();
    expect(streetRefusal('us-ny-newyork', 8)).toMatch(/7 nights at most/);
    expect(streetRefusal('ca-on-toronto', 1)).toMatch(/three hours/);
    expect(streetRefusal('ca-bc-vancouver', 1)).toMatch(/10 p.m. to 6 a.m./);
    expect(streetRefusal('us-ct-newhaven', 1)).toMatch(/doesn’t have New Haven’s rules/);
  });

  it('is booked with a trip in the motorhome, with no hotel parking, refused in a car, and refused past the week', () => {
    const sim = life('us-ct-newhaven', 'rv-street-book');
    expect(sim.execute({ kind: 'vehicle.buy', payload: { modelId: 'us-thor-four-winds' } }).ok).toBe(true);
    expect(sim.execute({ kind: 'vehicle.buy', payload: { modelId: 'us-toyota-camry' } }).ok).toBe(true);
    const [rv, car] = vehiclesOf(sim.player);
    const day = saturday(sim, 14);
    const trip = (v: OwnedVehicle, nights: number) => sim.execute<{ journeyId: string; total: number }>({ kind: 'travel.book', payload: { toCity: 'us-ny-newyork', day, slot: 2, by: `car:${v.id}`, nights, stay: 'street' } });
    expect(trip(car!, 2).error).toMatch(/motorhome or campervan/);
    expect(trip(rv!, 8).error).toMatch(/7 nights at most/);
    const r = trip(rv!, 2);
    expect(r.ok, r.error).toBe(true);
    const out = journeysOf(sim.player).find((j) => j.id === r.value!.journeyId)!;
    expect(out.hotel!.cls).toBe('street');
    expect(out.hotel!.price).toBe(0);
    expect(out.hotel!.parking).toBeUndefined();
  });
});

describe('a move in one’s own van', () => {
  it('carries the bed and sofa for its fuel instead of the movers’ fee', () => {
    const sim = life('us-ca-losangeles', 'rv-van-move');
    // A car doesn’t carry a bed and sofa: the movers do.
    expect(sim.execute({ kind: 'vehicle.buy', payload: { modelId: 'us-toyota-camry' } }).ok).toBe(true);
    sim.player.furniture = { bed: sim.now, sofa: sim.now };
    const movers = moversCost(sim, sim.player, 'us-ca-losangeles', 'us-ca-sanfrancisco');
    expect(movers).toBeGreaterThan(0);
    carryFurniture(sim, sim.player, 'us-ca-losangeles', 'us-ca-sanfrancisco');
    expect(sim.universe.transactions.filter((t) => t.memo.startsWith('Movers'))).toHaveLength(1);
    // With nothing to move, the van isn't driven for it.
    expect(sim.execute({ kind: 'vehicle.buy', payload: { modelId: 'us-ram-promaster' } }).ok).toBe(true);
    const van = vehiclesOf(sim.player).find((v) => v.modelId === 'us-ram-promaster')!;
    // No pieces of one's own: items since 2026-10-01.
    sim.player.items = [];
    const before = sim.universe.transactions.length;
    carryFurniture(sim, sim.player, 'us-ca-losangeles', 'us-ca-sanfrancisco');
    expect(sim.universe.transactions.length).toBe(before);
    sim.player.furniture = { bed: sim.now, sofa: sim.now };
    carryFurniture(sim, sim.player, 'us-ca-losangeles', 'us-ca-sanfrancisco');
    const moved = sim.universe.transactions.find((t) => t.memo === 'Your bed and sofa moved in the Ram ProMaster Cargo Van')!;
    expect(moved.postings.find((p) => p.accountId === sim.player.primaryAccountId)!.amount).toBe(-runningCost(sim, van, roadKm('us-ca-losangeles', 'us-ca-sanfrancisco')));
    expect(sim.universe.transactions.filter((t) => t.memo.startsWith('Movers'))).toHaveLength(1);
    // Without a license to drive it, the movers come.
    sim.player.documents = [];
    carryFurniture(sim, sim.player, 'us-ca-losangeles', 'us-ca-sanfrancisco');
    expect(sim.universe.transactions.filter((t) => t.memo.startsWith('Movers'))).toHaveLength(2);
  });
});

describe('a move in a rented truck', () => {
  it('prices U-Haul’s day, its miles there and back and its fuel, only in America, within 100 miles, on a license', () => {
    const sim = life('us-ca-losangeles', 'truck-price');
    const miles = roadKm('us-ca-losangeles', 'us-ca-burbank') / 1.609344;
    const fuel = (2 * miles) / 10 * 3.785411784 * FUEL['US-CA'].petrol;
    expect(truckFor(sim, sim.player, 'us-ca-losangeles', 'us-ca-burbank')).toBe(inSave(sim, Math.round((29.95 + 1.19 * 2 * miles) * 100 + fuel), 'USD'));
    expect(truckFor(sim, sim.player, 'us-ca-losangeles', 'us-ca-sanfrancisco')).toMatch(/within 100 miles/);
    expect(truckFor(sim, sim.player, 'uk-eng-london', 'uk-eng-london')).toMatch(/only in America/);
    expect(truckFor(sim, sim.player, 'us-ca-losangeles', 'uk-eng-london')).toMatch(/only in America/);
    expect(truckFor(sim, sim.player, 'uk-eng-london', 'us-ca-losangeles')).toMatch(/only in America/);
    sim.player.documents = [];
    expect(truckFor(sim, sim.player, 'us-ca-losangeles', 'us-ca-burbank')).toMatch(/license/);
  });

  it('is taken in place of the movers only when chosen', () => {
    const sim = life('us-ca-losangeles', 'truck-move');
    sim.player.furniture = { bed: sim.now, sofa: sim.now };
    const paid = (memo: string) => sim.universe.transactions.filter((t) => t.memo.startsWith(memo)).length;
    carryFurniture(sim, sim.player, 'us-ca-losangeles', 'us-ca-burbank');
    expect([paid('Movers'), paid('U-Haul')]).toEqual([1, 0]);
    expect(sim.execute({ kind: 'home.move_by', payload: { by: 'truck' } }).ok).toBe(true);
    carryFurniture(sim, sim.player, 'us-ca-losangeles', 'us-ca-burbank');
    expect([paid('Movers'), paid('U-Haul')]).toEqual([1, 1]);
    const t = sim.universe.transactions.find((x) => x.memo.startsWith('U-Haul'))!;
    expect(t.postings.find((p) => p.accountId === sim.player.primaryAccountId)!.amount).toBe(-(truckFor(sim, sim.player, 'us-ca-losangeles', 'us-ca-burbank') as number));
    // Too far for it, the movers come anyway.
    carryFurniture(sim, sim.player, 'us-ca-losangeles', 'us-ca-sanfrancisco');
    expect([paid('Movers'), paid('U-Haul')]).toEqual([2, 1]);
    expect(sim.execute({ kind: 'home.move_by', payload: { by: 'movers' } }).ok).toBe(true);
    expect(sim.player.moveBy).toBeUndefined();
  });
});
